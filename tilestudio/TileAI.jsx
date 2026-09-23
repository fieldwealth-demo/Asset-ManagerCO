/* TileAI — prompt→config interpreter and the dashboard templates.
   The interpreter maps plain-English asks onto real fields in DM_DATASETS, so an
   AI-drafted tile is a normal builder config the user can then edit by hand. */

const TA_VIZ_WORDS = [
  [/\b(list|agenda|feed|inbox|cards?)\b/, 'list'],
  [/\b(kpi|single value|big number|total only|scorecard|metric card)\b/, 'kpi'],
  [/\b(pivot|crosstab|cross-tab)\b/, 'pivot'],
  [/\b(heat ?map)\b/, 'heatmap'],
  [/\b(map|geograph|by state|state map)\b/, 'map'],
  [/\b(scatter|correlat|versus|vs\.?)\b/, 'scatter'],
  [/\b(donut|pie|ring|breakdown by share|share of)\b/, 'donut'],
  [/\b(stack|stacked)\b/, 'stacked'],
  [/\b(horizontal bar|bar chart|bars)\b/, 'bar'],
  [/\b(column|vertical bar)\b/, 'column'],
  [/\b(area)\b/, 'area'],
  [/\b(line|trend|over time|by month|monthly|history)\b/, 'line'],
  [/\b(cards?|card grid|tiles for each)\b/, 'cards'],
  [/\b(table|list|grid|rows|top \d+)\b/, 'table'],
];

const TA_DS_WORDS = [
  [/\b(product|platform|approved|recommended|shelf|coverage|fund list)\b/, 'product_platform'],
  [/\b(flows?|gross sales|sales|redemptions?|net flows?|capture|monthly)\b/, 'flow_trend'],
  [/\b(firms?|channels?|distributors?|home ?office|headcount|hq)\b/, 'firm_profile'],
  [/\b(market share|share|opportunity|opp|aum|white ?space|categor\w+|vehicles?)\b/, 'market_share'],
];

const TA_AGG_WORDS = [
  [/\b(average|avg|mean)\b/, 'avg'],
  [/\b(count of|number of|how many|count)\b/, 'count'],
  [/\b(distinct|unique)\b/, 'countd'],
  [/\b(median)\b/, 'median'],
  [/\b(largest|max|highest|biggest)\b/, 'max'],
  [/\b(smallest|min|lowest)\b/, 'min'],
];

function taScoreField(f, p) {
  const label = f.label.toLowerCase(), key = f.k.toLowerCase();
  if (p.includes(label)) return 100 + label.length;
  if (p.includes(key.replace(/_/g, ' '))) return 90 + key.length;
  const words = label.split(/[^a-z0-9%]+/).filter(w => w.length > 3);
  const hits = words.filter(w => p.includes(w)).length;
  return hits ? 40 + hits * 10 : 0;
}

function taParsePrompt(prompt, forcedDs) {
  const p = (prompt || '').toLowerCase();

  let ds = forcedDs;
  if (!ds) { const hit = TA_DS_WORDS.find(([re]) => re.test(p)); ds = hit ? hit[1] : 'market_share'; }

  let viz = null;
  const vhit = TA_VIZ_WORDS.find(([re]) => re.test(p));
  if (vhit) viz = vhit[1];

  const fields = dmFields(ds);
  const scored = fields.map(f => ({ f, s: taScoreField(f, p) })).filter(x => x.s > 0).sort((a, b) => b.s - a.s);
  const dims = scored.filter(x => x.f.type === 'dim' || x.f.type === 'geo').map(x => x.f);
  const nums = scored.filter(x => x.f.type === 'num').map(x => x.f);

  let agg = null;
  const ahit = TA_AGG_WORDS.find(([re]) => re.test(p));
  if (ahit) agg = ahit[1];

  /* sensible defaults per dataset when the prompt is vague */
  const DEF = {
    market_share:     { row:'firm',     val:'your_aum' },
    firm_profile:     { row:'channel',  val:'your_aum' },
    product_platform: { row:'category', val:'your_aum' },
    flow_trend:       { row:'month',    val:'net_flows' },
  }[ds] || { row:'firm', val:'your_aum' };

  /* explicit "by A and B" — first phrase is rows, second is columns */
  const byPhrases = [];
  const byMatch = p.match(/\bby ([a-z0-9 %/&_-]+?)(?: as | on |$)/);
  if (byMatch) {
    byMatch[1].split(/\s+and\s+|,\s*/).map(x => x.trim()).filter(Boolean).forEach(phrase => {
      const cand = fields
        .filter(f => f.type !== 'num')
        .map(f => ({ f, s: taScoreField(f, phrase) }))
        .filter(x => x.s > 0).sort((a, b) => b.s - a.s)[0];
      if (cand && !byPhrases.includes(cand.f.k)) byPhrases.push(cand.f.k);
    });
  }

  const geoWanted = viz === 'map' || /\bby state|geograph\b/.test(p);
  const rowField = geoWanted ? (fields.find(f => f.type === 'geo') || dims[0])
    : (dims[0] || fields.find(f => f.k === DEF.row) || fields.find(f => f.type === 'dim'));
  const valField = nums[0] || fields.find(f => f.k === DEF.val) || fields.find(f => f.type === 'num');

  /* time-series prompts should group by month, not by whatever dimension matched */
  const timeish = /\bover time|by month|monthly|trend|history|by quarter|quarterly\b/.test(p);
  let row = byPhrases[0] || (rowField ? rowField.k : null);
  if (timeish) {
    const t = /quarter/.test(p) ? fields.find(f => f.k === 'quarter') : fields.find(f => f.k === 'month');
    if (t) row = t.k;
  }

  const secondNum = nums[1];
  if (!viz) {
    if (timeish) viz = 'line';
    else if (secondNum && /\bvs\.?|versus|against|correlat/.test(p)) viz = 'scatter';
    else if (!row) viz = 'kpi';
    else if (/\bshare|mix|composition|allocation\b/.test(p)) viz = 'donut';
    else viz = 'column';
  }
  if (viz === 'kpi') row = null;
  /* meetings and notifications read as a list unless a chart was asked for */
  if (dmDataset(ds).listMap && !vhit) { viz = 'list'; row = null; cols = []; }

  /* pivot / heatmap need a column dimension */
  let cols = [];
  if (viz === 'pivot' || viz === 'heatmap' || viz === 'stacked') {
    const cand = dims.filter(d => d.k !== row);
    const c = byPhrases[1] || (cand[0] && cand[0].k)
      || (fields.find(f => f.type === 'dim' && f.k !== row) || {}).k;
    if (c) cols = [c];
    /* a time dimension reads better across the top than down the side */
    const TIME = ['month', 'quarter', 'year'];
    if (TIME.includes(row) && cols[0] && !TIME.includes(cols[0])) { const t = row; row = cols[0]; cols = [t]; }
  }

  const values = [{ k: valField ? valField.k : DEF.val, agg: agg || (valField && valField.agg) || 'sum' }];
  if (viz === 'scatter' && secondNum) values.push({ k: secondNum.k, agg: secondNum.agg || 'sum' });

  const side = /\bwith (a )?(table|breakdown|legend table|detail)\b|\band (a )?table\b/.test(p) ? 'table' : '';

  const limitMatch = p.match(/\btop (\d+)/);
  const limit = limitMatch ? Number(limitMatch[1]) : (viz === 'table' || viz === 'bar' ? 12 : viz === 'pivot' || viz === 'heatmap' ? 14 : 0);

  const dsLabel = dmDataset(ds).label;
  const rowLabel = row ? (dmField(ds, row) || {}).label : null;
  const valLabel = (dmField(ds, values[0].k) || {}).label || 'Value';
  const title = prompt && prompt.length < 46
    ? prompt.replace(/^(show|show me|give me|build|create|add|make)\s+(a|an|the)?\s*/i, '').replace(/^\w/, c => c.toUpperCase())
    : (rowLabel ? `${valLabel} by ${rowLabel}` : `${valLabel} \u00b7 ${dsLabel}`);

  return {
    id:'t' + Date.now() + Math.floor(Math.random() * 99),
    title, ds, viz,
    rows: row ? [row] : [], cols, values, side,
    filters:[], calcs:[], limit, span: viz === 'kpi' ? 3 : viz === 'table' || viz === 'pivot' || viz === 'heatmap' ? 6 : 4,
    sort:null, aiPrompt: prompt || null,
  };
}

/* ---- templates ----------------------------------------------------------
   Starting boards for an asset manager. Every tile reads firm-level market,
   platform and flow data — nothing here reaches an intermediary's advisors or
   their end clients. */
const mk = (o) => Object.assign({ rows:[], cols:[], values:[], filters:[], calcs:[], limit:0, span:4 }, o);

const TA_TEMPLATES = [
  {
    id:'market_overview', cat:'Market', name:'Market Overview', icon:'chart-column',
    desc:'Where the opportunity sits and how much of it you hold.',
    tiles:[
      mk({ title:'Mkt Opp AUM', cat:'Market', ds:'market_share', viz:'kpi', span:3,
        values:[{ k:'mkt_opp_aum', agg:'sum' }], filters:[{ k:'quarter', op:'is', v:'2026-Q2' }] }),
      mk({ title:'Your AUM', cat:'Market', ds:'market_share', viz:'kpi', span:3,
        values:[{ k:'your_aum', agg:'sum' }], filters:[{ k:'quarter', op:'is', v:'2026-Q2' }] }),
      mk({ title:'Mkt Share', cat:'Market', ds:'market_share', viz:'kpi', span:3,
        values:[{ k:'your_aum', agg:'sum', label:'Mkt Share', fmt:'pct', decimals:1,
          expr:'Sum([your_aum]) / Sum([mkt_opp_aum]) * 100' }],
        filters:[{ k:'quarter', op:'is', v:'2026-Q2' }] }),
      mk({ title:'White Space', cat:'Market', ds:'market_share', viz:'kpi', span:3,
        values:[{ k:'white_space', agg:'sum' }], filters:[{ k:'quarter', op:'is', v:'2026-Q2' }] }),
      mk({ title:'AUM Trend', cat:'Market', ds:'market_share', viz:'line', rows:['quarter'], span:6, h:360,
        values:[{ k:'mkt_opp_aum', agg:'sum' }, { k:'your_aum', agg:'sum' }] }),
      mk({ title:'Your AUM by Firm', cat:'Market', ds:'market_share', viz:'bar', rows:['firm'], span:6, h:360,
        values:[{ k:'your_aum', agg:'sum' }], limit:12, filters:[{ k:'quarter', op:'is', v:'2026-Q2' }] }),
      mk({ title:'Category × Vehicle', cat:'Market', ds:'market_share', viz:'heatmap',
        rows:['category'], cols:['vehicle'], span:6, h:380,
        values:[{ k:'your_aum', agg:'sum' }], filters:[{ k:'quarter', op:'is', v:'2026-Q2' }] }),
      mk({ title:'Share by Channel', cat:'Market', ds:'market_share', viz:'donut', rows:['channel'], span:6, h:380,
        values:[{ k:'your_aum', agg:'sum' }], side:'table', sideDir:'right',
        filters:[{ k:'quarter', op:'is', v:'2026-Q2' }] }),
    ],
  },
  {
    id:'firm_coverage', cat:'Firms', name:'Firm Coverage', icon:'building',
    desc:'Firm-level book, platform tier and product coverage.',
    tiles:[
      mk({ title:'Firms Covered', cat:'Firms', ds:'firm_profile', viz:'kpi', span:3,
        values:[{ k:'firm_count', agg:'count' }] }),
      mk({ title:'Advisor Headcount', cat:'Firms', ds:'firm_profile', viz:'kpi', span:3,
        values:[{ k:'advisor_headcount', agg:'sum' }] }),
      mk({ title:'Firm Detail', cat:'Firms', ds:'firm_profile', viz:'table', rows:['firm'], span:12, h:420,
        values:[{ k:'mkt_opp_aum', agg:'sum' }, { k:'your_aum', agg:'sum' },
          { k:'mkt_share_aum', agg:'avg' }, { k:'products_on_platform', agg:'sum' }] }),
      mk({ title:'Book by Region', cat:'Firms', ds:'firm_profile', viz:'map', rows:['hq_state'], span:6, h:380,
        values:[{ k:'your_aum', agg:'sum' }] }),
      mk({ title:'Platform Tier Mix', cat:'Firms', ds:'firm_profile', viz:'donut', rows:['platform_tier'], span:6, h:380,
        values:[{ k:'your_aum', agg:'sum' }], side:'table', sideDir:'right' }),
    ],
  },
  {
    id:'platform_status', cat:'Products', name:'Platform Status', icon:'layer-group',
    desc:'Which products sit on which firm platform, and what they carry.',
    tiles:[
      mk({ title:'Products Recommended', cat:'Products', ds:'product_platform', viz:'kpi', span:3,
        values:[{ k:'product_count', agg:'count' }], filters:[{ k:'status', op:'is', v:'Recommended' }] }),
      mk({ title:'Off Platform', cat:'Products', ds:'product_platform', viz:'kpi', span:3,
        values:[{ k:'product_count', agg:'count' }], filters:[{ k:'status', op:'is', v:'Not on platform' }] }),
      mk({ title:'Status by Firm', cat:'Products', ds:'product_platform', viz:'pivot',
        rows:['firm'], cols:['status'], span:12, h:420, values:[{ k:'product_count', agg:'count' }] }),
      mk({ title:'AUM by Product', cat:'Products', ds:'product_platform', viz:'bar', rows:['product'], span:6, h:380,
        values:[{ k:'your_aum', agg:'sum' }], limit:12 }),
      mk({ title:'Coverage by Asset Class', cat:'Products', ds:'product_platform', viz:'stacked',
        rows:['asset_class'], cols:['status'], span:6, h:380, values:[{ k:'product_count', agg:'count' }] }),
    ],
  },
  {
    id:'flows', cat:'Flows', name:'Flows', icon:'arrow-trend-up',
    desc:'Gross sales, redemptions and capture rate over time.',
    tiles:[
      mk({ title:'Gross Sales', cat:'Flows', ds:'flow_trend', viz:'kpi', span:3, values:[{ k:'gross_sales', agg:'sum' }] }),
      mk({ title:'Net Flows', cat:'Flows', ds:'flow_trend', viz:'kpi', span:3, values:[{ k:'net_flows', agg:'sum' }] }),
      mk({ title:'Capture Rate', cat:'Flows', ds:'flow_trend', viz:'kpi', span:3,
        values:[{ k:'gross_sales', agg:'sum', label:'Capture Rate', fmt:'pct', decimals:1,
          expr:'Sum([gross_sales]) / Sum([mkt_gross_sales]) * 100' }] }),
      mk({ title:'Flows by Month', cat:'Flows', ds:'flow_trend', viz:'column', rows:['month'], span:12, h:380,
        values:[{ k:'gross_sales', agg:'sum' }, { k:'redemptions', agg:'sum' }] }),
      mk({ title:'Net Flows by Category', cat:'Flows', ds:'flow_trend', viz:'bar', rows:['category'], span:6, h:360,
        values:[{ k:'net_flows', agg:'sum' }], limit:10 }),
      mk({ title:'Vehicle Mix', cat:'Flows', ds:'flow_trend', viz:'area', rows:['month'], cols:['vehicle'], span:6, h:360,
        values:[{ k:'gross_sales', agg:'sum' }] }),
    ],
  },
];

const TA_SUGGESTIONS = [
  'Your AUM by firm',
  'Mkt share by channel and category',
  'Net flows by month',
  'Top 10 categories by white space',
  'Gross sales by vehicle over time',
  'Product platform status by firm as a pivot',
  'Your AUM by HQ state on a map',
  'Capture rate by category',
];

Object.assign(window, { taParsePrompt, TA_TEMPLATES, TA_SUGGESTIONS });
