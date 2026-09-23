/* DataModel — the dataset layer behind the report builder, re-based on asset
   manager data. Everything here is FIRM-LEVEL market and platform data: an asset
   manager sees firms, channels, regions, categories, vehicles and products —
   never an intermediary's underlying advisor or end-client records.

   Exports: DM_DATASETS, dmRows(dsId), dmFields(dsId), dmRunQuery(cfg), formatters. */

/* ---- deterministic PRNG so every reload shows the same book ------------- */
function dmRng(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}
const dmPick = (r, arr) => arr[Math.floor(r() * arr.length)];
const dmRound = (n, p = 2) => Math.round(n * Math.pow(10, p)) / Math.pow(10, p);

/* ---- reference data ----------------------------------------------------- */
const DM_UNASSIGNED = 'Unassigned';
/* Identity dimensions here are institutions, not people. */
const DM_IDENTITY_DIMS = ['firm', 'hq_state', 'hq_city'];
const DM_SEGMENTS = ['National', 'Regional', 'Independent', 'Bank-owned'];

const AM_FIRMS = [
  { firm:'Contoso Wealth',       channel:'Wires', region:'Northeast', hq_city:'New York',      hq_state:'NY', segment:'National',    tier:'Strategic', weight:0.109, share:0.398 },
  { firm:'Fabrikam Financial',   channel:'Wires', region:'Northeast', hq_city:'Boston',        hq_state:'MA', segment:'National',    tier:'Strategic', weight:0.148, share:0.404 },
  { firm:'Northwind Securities', channel:'IBD',   region:'Midwest',   hq_city:'Chicago',       hq_state:'IL', segment:'Regional',    tier:'Core',      weight:0.087, share:0.451 },
  { firm:'Adatum Partners',      channel:'Wires', region:'West',      hq_city:'San Francisco', hq_state:'CA', segment:'National',    tier:'Strategic', weight:0.201, share:0.284 },
  { firm:'Litware Advisors',     channel:'RIA',   region:'West',      hq_city:'Los Angeles',   hq_state:'CA', segment:'Independent', tier:'Core',      weight:0.160, share:0.421 },
  { firm:'Tailspin Capital',     channel:'IBD',   region:'Southwest', hq_city:'Dallas',        hq_state:'TX', segment:'Regional',    tier:'Core',      weight:0.118, share:0.267 },
  { firm:'Proseware Group',      channel:'RIA',   region:'Southeast', hq_city:'Atlanta',       hq_state:'GA', segment:'Independent', tier:'Emerging',  weight:0.067, share:0.326 },
  { firm:'Wingtip Advisors',     channel:'Bank',  region:'Midwest',   hq_city:'Minneapolis',   hq_state:'MN', segment:'Bank-owned',  tier:'Emerging',  weight:0.058, share:0.372 },
  { firm:'Trey Wealth',          channel:'Bank',  region:'Southeast', hq_city:'Charlotte',     hq_state:'NC', segment:'Bank-owned',  tier:'Emerging',  weight:0.052, share:0.344 },
];
const AM_CATEGORIES = [
  { category:'Large Growth',      asset_class:'Equity',       focus:'Active Growth',   w:0.229, product:'Cornerstone Growth Fund' },
  { category:'Multi-sector Bond', asset_class:'Fixed Income', focus:'Income',          w:0.161, product:'Horizon Income Fund' },
  { category:'Large Blend',       asset_class:'Equity',       focus:'Core Beta',       w:0.145, product:'Cornerstone 500 Index' },
  { category:'Int. Core Plus',    asset_class:'Fixed Income', focus:'Income',          w:0.112, product:'Meridian Core Plus' },
  { category:'Core Plus',         asset_class:'Fixed Income', focus:'Income',          w:0.112, product:'Riverbend Core Plus' },
  { category:'Private Credit',    asset_class:'Alternatives', focus:'Private Markets', w:0.089, product:'Pinnacle Direct Lending' },
  { category:'Foreign Lg.',       asset_class:'Equity',       focus:'International',   w:0.073, product:'Compass Intl Equity' },
  { category:'EM',                asset_class:'Equity',       focus:'International',   w:0.079, product:'Compass EM Equity' },
];
const AM_VEHICLES = [
  { vehicle:'MF', w:0.40 }, { vehicle:'ETF', w:0.30 }, { vehicle:'SMA', w:0.20 }, { vehicle:'Privates', w:0.10 },
];
const AM_QUARTERS = ['2024-Q3','2024-Q4','2025-Q1','2025-Q2','2025-Q3','2025-Q4','2026-Q1','2026-Q2'];
const AM_MONTHS = (() => {
  const M = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const out = [];
  for (let y = 2025; y <= 2026; y++) for (let m = 0; m < 12; m++) {
    if (y === 2026 && m > 5) break;
    out.push({ month: M[m] + " '" + String(y).slice(2), year: String(y), quarter: y + '-Q' + (Math.floor(m / 3) + 1), idx: (y - 2025) * 12 + m });
  }
  return out;
})();
const AM_TOTAL_MKT_AUM = 1215e9; // territory market opportunity, in dollars

/* one row per firm × category × vehicle × quarter — the fact table every
   firm-level tile aggregates from */
let _amFact = null;
function amFact() {
  if (_amFact) return _amFact;
  const r = dmRng(20260903);
  const rows = [];
  AM_FIRMS.forEach(f => {
    AM_CATEGORIES.forEach(c => {
      AM_VEHICLES.forEach(v => {
        const base = AM_TOTAL_MKT_AUM * f.weight * c.w * v.w;
        const tilt = 0.85 + r() * 0.3;
        AM_QUARTERS.forEach((q, qi) => {
          const growth = 1 + qi * 0.028;
          const mkt = base * tilt * growth;
          const share = Math.max(0.05, Math.min(0.62, f.share * (0.8 + r() * 0.45)));
          const yours = mkt * share;
          const inflowMkt = mkt * (0.052 + r() * 0.03);
          const inflowYours = inflowMkt * share * (0.9 + r() * 0.35);
          const netMkt = inflowMkt * (0.28 + r() * 0.4) * (r() < 0.12 ? -1 : 1);
          const netYours = netMkt * share * (0.85 + r() * 0.4);
          rows.push({
            firm:f.firm, channel:f.channel, region:f.region, segment:f.segment,
            platform_tier:f.tier, hq_city:f.hq_city, hq_state:f.hq_state,
            category:c.category, asset_class:c.asset_class, focus_category:c.focus,
            vehicle:v.vehicle, quarter:q, year:q.slice(0, 4),
            mkt_opp_aum: dmRound(mkt, 0), your_aum: dmRound(yours, 0),
            mkt_inflows: dmRound(inflowMkt, 0), your_inflows: dmRound(inflowYours, 0),
            mkt_net_flows: dmRound(netMkt, 0), your_net_flows: dmRound(netYours, 0),
            row_count: 1,
          });
        });
      });
    });
  });
  _amFact = rows;
  return rows;
}
const amShare = (a, b) => (b ? dmRound(a / b * 100, 2) : 0);

const F = (k, label, type, fmt, extra) => Object.assign({ k, label, type, fmt }, extra || {});

const AM_DIM_FIELDS = [
  F('firm','Firm','dim','text'), F('channel','Channel','dim','text'),
  F('region','Region','dim','text'), F('segment','Firm Segment','dim','text'),
  F('platform_tier','Platform Tier','dim','text'),
  F('hq_state','HQ State','geo','text'), F('hq_city','HQ City','dim','text'),
  F('category','Category','dim','text'), F('asset_class','Asset Class','dim','text'),
  F('focus_category','Focus Category','dim','text'), F('vehicle','Vehicle','dim','text'),
  F('quarter','Quarter','dim','text'), F('year','Year','dim','text'),
];

const DM_DATASETS = {
  market_share: {
    id:'market_share', label:'Market Share', curated:true, icon:'chart-column',
    desc:'Market opportunity and your book by firm, category, vehicle and quarter. Firm level only — no advisor or end-client records.',
    source:'Field market data · firm level',
    fields:[
      ...AM_DIM_FIELDS,
      F('mkt_opp_aum','Mkt Opp AUM','num','usd'), F('your_aum','Your AUM','num','usd'),
      F('mkt_share_aum','Mkt Share (AUM)','num','pct',{ agg:'avg' }),
      F('mkt_inflows','Mkt Opp Inflows','num','usd'), F('your_inflows','Your Inflows','num','usd'),
      F('mkt_net_flows','Mkt Opp Net Flows','num','usd'), F('your_net_flows','Your Net Flows','num','usd'),
      F('white_space','White Space AUM','num','usd'),
      F('row_count','Rows','num','num',{ agg:'count' }),
    ],
    rows() {
      return amFact().map(x => ({
        ...x,
        mkt_share_aum: amShare(x.your_aum, x.mkt_opp_aum),
        white_space: dmRound(x.mkt_opp_aum - x.your_aum, 0),
      }));
    },
  },

  firm_profile: {
    id:'firm_profile', label:'Firm Profile', curated:true, icon:'building',
    desc:'One row per distribution firm: channel, region, HQ, platform tier and total book.',
    source:'Field firm master',
    fields:[
      F('firm','Firm','dim','text'), F('channel','Channel','dim','text'),
      F('region','Region','dim','text'), F('segment','Firm Segment','dim','text'),
      F('platform_tier','Platform Tier','dim','text'),
      F('hq_state','HQ State','geo','text'), F('hq_city','HQ City','dim','text'),
      F('mkt_opp_aum','Mkt Opp AUM','num','usd'), F('your_aum','Your AUM','num','usd'),
      F('mkt_share_aum','Mkt Share (AUM)','num','pct',{ agg:'avg' }),
      F('your_inflows','Your Inflows','num','usd'), F('your_net_flows','Your Net Flows','num','usd'),
      F('advisor_headcount','Advisor Headcount','num','num'),
      F('products_on_platform','Products on Platform','num','num'),
      F('firm_count','Firms','num','num',{ agg:'count' }),
    ],
    rows() {
      const r = dmRng(4471);
      const latest = AM_QUARTERS[AM_QUARTERS.length - 1];
      return AM_FIRMS.map(f => {
        const rows = amFact().filter(x => x.firm === f.firm && x.quarter === latest);
        const sum = (k) => rows.reduce((a, x) => a + x[k], 0);
        const mkt = sum('mkt_opp_aum'), yours = sum('your_aum');
        return {
          firm:f.firm, channel:f.channel, region:f.region, segment:f.segment,
          platform_tier:f.tier, hq_city:f.hq_city, hq_state:f.hq_state,
          mkt_opp_aum: dmRound(mkt, 0), your_aum: dmRound(yours, 0),
          mkt_share_aum: amShare(yours, mkt),
          your_inflows: dmRound(sum('your_inflows'), 0),
          your_net_flows: dmRound(sum('your_net_flows'), 0),
          advisor_headcount: 400 + Math.floor(r() * 9000),
          products_on_platform: 3 + Math.floor(r() * 6),
          firm_count: 1,
        };
      });
    },
  },

  product_platform: {
    id:'product_platform', label:'Product Platform', curated:true, icon:'layer-group',
    desc:'Your products by firm and category: platform status, vehicle and the assets behind them.',
    source:'Field platform coverage',
    fields:[
      F('firm','Firm','dim','text'), F('channel','Channel','dim','text'),
      F('region','Region','dim','text'), F('platform_tier','Platform Tier','dim','text'),
      F('product','Product','dim','text'), F('category','Category','dim','text'),
      F('asset_class','Asset Class','dim','text'), F('focus_category','Focus Category','dim','text'),
      F('vehicle','Vehicle','dim','text'), F('status','Platform Status','dim','text'),
      F('mkt_opp_aum','Mkt Opp AUM','num','usd'), F('your_aum','Your AUM','num','usd'),
      F('mkt_share_aum','Mkt Share (AUM)','num','pct',{ agg:'avg' }),
      F('product_count','Products','num','num',{ agg:'count' }),
    ],
    rows() {
      const STATUS = ['Recommended', 'Approved', 'Not on platform'];
      const hash = (s) => s.split('').reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) % 9973, 7);
      const latest = AM_QUARTERS[AM_QUARTERS.length - 1];
      const out = [];
      AM_FIRMS.forEach(f => {
        AM_CATEGORIES.forEach(c => {
          const rows = amFact().filter(x => x.firm === f.firm && x.category === c.category && x.quarter === latest);
          const mkt = rows.reduce((a, x) => a + x.mkt_opp_aum, 0);
          const yours = rows.reduce((a, x) => a + x.your_aum, 0);
          const status = STATUS[hash(f.firm + '|' + c.category) % 3];
          out.push({
            firm:f.firm, channel:f.channel, region:f.region, platform_tier:f.tier,
            product:c.product, category:c.category, asset_class:c.asset_class,
            focus_category:c.focus, vehicle: c.asset_class === 'Alternatives' ? 'Privates' : 'MF',
            status,
            mkt_opp_aum: dmRound(mkt, 0),
            your_aum: status === 'Not on platform' ? 0 : dmRound(yours, 0),
            mkt_share_aum: status === 'Not on platform' ? 0 : amShare(yours, mkt),
            product_count: 1,
          });
        });
      });
      return out;
    },
  },

  flow_trend: {
    id:'flow_trend', label:'Flow Trend', curated:true, icon:'arrow-trend-up',
    desc:'Monthly gross sales, redemptions and net flows by firm, category and vehicle.',
    source:'Field flows · firm level',
    dateField:'month',
    fields:[
      F('month','Month','dim','text'), F('quarter','Quarter','dim','text'), F('year','Year','dim','text'),
      F('firm','Firm','dim','text'), F('channel','Channel','dim','text'), F('region','Region','dim','text'),
      F('category','Category','dim','text'), F('asset_class','Asset Class','dim','text'),
      F('vehicle','Vehicle','dim','text'),
      F('gross_sales','Gross Sales','num','usd'), F('redemptions','Redemptions','num','usd'),
      F('net_flows','Net Flows','num','usd'), F('mkt_gross_sales','Mkt Gross Sales','num','usd'),
      F('capture_rate','Capture Rate','num','pct',{ agg:'avg' }),
      F('row_count','Rows','num','num',{ agg:'count' }),
    ],
    rows() {
      const r = dmRng(99137);
      const out = [];
      AM_FIRMS.forEach(f => {
        AM_CATEGORIES.forEach(c => {
          AM_VEHICLES.forEach(v => {
            AM_MONTHS.forEach(m => {
              const base = AM_TOTAL_MKT_AUM * f.weight * c.w * v.w * 0.0045;
              const mktGross = base * (0.85 + r() * 0.4) * (1 + m.idx * 0.004);
              const gross = mktGross * f.share * (0.8 + r() * 0.5);
              const redemptions = gross * (0.45 + r() * 0.35);
              out.push({
                month:m.month, quarter:m.quarter, year:m.year,
                firm:f.firm, channel:f.channel, region:f.region,
                category:c.category, asset_class:c.asset_class, vehicle:v.vehicle,
                gross_sales: dmRound(gross, 0),
                redemptions: dmRound(-redemptions, 0),
                net_flows: dmRound(gross - redemptions, 0),
                mkt_gross_sales: dmRound(mktGross, 0),
                capture_rate: amShare(gross, mktGross),
                row_count: 1,
              });
            });
          });
        });
      });
      return out;
    },
  },
};

const DM_GROUPS = [
  { label:'Data sources', ids:['market_share', 'firm_profile', 'product_platform', 'flow_trend'] },
];

function dmDataset(id) {
  const d = DM_DATASETS[id] || DM_DATASETS.market_share;
  if (d.rowsFrom) return { ...d, fields: DM_DATASETS[d.rowsFrom].fields, rows: DM_DATASETS[d.rowsFrom].rows };
  return d;
}
function dmFields(id) { return dmDataset(id).fields; }
function dmField(id, k) { return dmFields(id).find(f => f.k === k); }

const _dmRowCache = {};
function dmRows(id) {
  if (dmDataset(id).needsConnect) return [];
  if (!_dmRowCache[id]) _dmRowCache[id] = dmDataset(id).rows();
  return _dmRowCache[id];
}

/* ---- relationships between datasets --------------------------------------
   Every dataset is a view of the same book, so they share identity columns. A
   value can therefore be pulled from another dataset without leaving the one
   you are working in: we join on the most specific column the two share, then
   aggregate the related rows that belong to each group.

   A cross-dataset reference is written "dataset.field", e.g. "performance.return_pct". */
const DM_JOIN_KEYS = [
  'firm', 'category', 'product', 'vehicle', 'quarter', 'month',
  'channel', 'region', 'asset_class', 'focus_category', 'platform_tier', 'segment', 'hq_state',
];

function dmJoinKey(aId, bId) {
  if (aId === bId) return null;
  const A = new Set(dmFields(aId).map(f => f.k));
  const B = new Set(dmFields(bId).map(f => f.k));
  return DM_JOIN_KEYS.find(k => A.has(k) && B.has(k)) || null;
}

/* datasets reachable from this one, with the column they join on */
const DM_SOURCE_IDS = DM_GROUPS.flatMap(g => g.ids);

function dmRelated(id) {
  return DM_SOURCE_IDS
    .filter(x => x !== id && !DM_DATASETS[x].gate && dmJoinKey(id, x))
    .map(x => ({ id:x, label:DM_DATASETS[x].label, icon:DM_DATASETS[x].icon, key:dmJoinKey(id, x) }));
}

/* "performance.return_pct" -> { ds, k }; a plain key returns null */
function dmParseRef(k) {
  const i = String(k).indexOf('.');
  if (i < 0) return null;
  const ds = k.slice(0, i), field = k.slice(i + 1);
  return DM_DATASETS[ds] && dmFields(ds).some(f => f.k === field) ? { ds, k:field } : null;
}

/* a field descriptor for any key, local or cross-dataset */
function dmFieldRef(baseId, k) {
  const ref = dmParseRef(k);
  if (!ref) return dmField(baseId, k);
  const f = dmField(ref.ds, ref.k);
  if (!f) return null;
  return { ...f, k, label: f.label, refLabel: f.label + ' \u00b7 ' + DM_DATASETS[ref.ds].label, ref };
}

/* rows of a dataset indexed by a join column, built once per pair */
const _dmIndex = {};
function dmIndexBy(dsId, key) {
  const ck = dsId + '|' + key;
  if (!_dmIndex[ck]) {
    const m = new Map();
    dmRows(dsId).forEach(r => {
      const v = r[key];
      if (v == null || v === '') return;
      let a = m.get(v); if (!a) { a = []; m.set(v, a); }
      a.push(r);
    });
    _dmIndex[ck] = m;
  }
  return _dmIndex[ck];
}

/* ---- aggregation -------------------------------------------------------- */
const DM_AGGS = [
  { id:'sum', label:'Sum' }, { id:'avg', label:'Average' },
  { id:'min', label:'Min' }, { id:'max', label:'Max' },
  { id:'count', label:'Count' }, { id:'countd', label:'Count distinct' },
  { id:'median', label:'Median' },
];

function dmAgg(agg, vals) {
  const nums = vals.filter(v => v != null && v !== '' && !isNaN(Number(v))).map(Number);
  switch (agg) {
    case 'count':  return vals.length;
    case 'countd': return new Set(vals).size;
    case 'avg':    return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
    case 'min':    return nums.length ? Math.min(...nums) : 0;
    case 'max':    return nums.length ? Math.max(...nums) : 0;
    case 'median': {
      if (!nums.length) return 0;
      const s = [...nums].sort((a, b) => a - b), m = Math.floor(s.length / 2);
      return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
    }
    default:       return nums.reduce((a, b) => a + b, 0);
  }
}

/* ---- formatting --------------------------------------------------------- */
function dmFmt(v, fmt, opts) {
  const o = opts || {};
  if (v == null || v === '') return '\u2014';
  if (typeof fmt === 'string' && fmt.indexOf(':') > 0) {
    const p = fmt.split(':');
    fmt = p[0];
    if (o.decimals == null) o.decimals = Number(p[1]);
  }
  if (o.decimals != null && !isNaN(o.decimals) && (fmt === 'usd' || fmt === 'pct' || fmt === 'num')) {
    const n = Number(v), d = o.decimals;
    const body = Math.abs(n).toLocaleString(undefined, { minimumFractionDigits:d, maximumFractionDigits:d });
    const sign = n < 0 ? '-' : '';
    if (fmt === 'usd') return sign + '$' + body;
    if (fmt === 'pct') return sign + body + '%';
    return sign + body;
  }
  if (fmt === 'usd') {
    const n = Number(v), a = Math.abs(n), sign = n < 0 ? '-' : '';
    if (o.compact !== false && a >= 1e12) return sign + '$' + (a / 1e12).toFixed(a >= 1e13 ? 1 : 2) + 'T';
    if (o.compact !== false && a >= 1e9)  return sign + '$' + (a / 1e9).toFixed(a >= 1e10 ? 1 : 2) + 'B';
    if (o.compact !== false && a >= 1000000) return sign + '$' + (a / 1000000).toFixed(a >= 10000000 ? 1 : 2) + 'M';
    if (o.compact !== false && a >= 10000)   return sign + '$' + Math.round(a / 1000) + 'K';
    return sign + '$' + a.toLocaleString(undefined, { maximumFractionDigits: 0 });
  }
  if (fmt === 'pct') return dmRound(Number(v), 2) + '%';
  if (fmt === 'num') {
    const n = Number(v);
    return Number.isInteger(n) ? n.toLocaleString() : n.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }
  return String(v);
}
function dmFmtFull(v, fmt) {
  if (typeof fmt === 'string' && fmt.indexOf(':') > 0) return dmFmt(v, fmt);
  if (fmt === 'usd') return (Number(v) < 0 ? '-' : '') + '$' + Math.abs(Number(v)).toLocaleString(undefined, { maximumFractionDigits: 0 });
  return dmFmt(v, fmt, { compact: false });
}

/* ---- calculated fields -------------------------------------------------- */
const DM_CALC_OPS = [
  { id:'add', label:'+', apply:(a, b) => a + b },
  { id:'sub', label:'\u2212', apply:(a, b) => a - b },
  { id:'mul', label:'\u00d7', apply:(a, b) => a * b },
  { id:'div', label:'\u00f7', apply:(a, b) => (b ? a / b : 0) },
  { id:'pctof', label:'% of', apply:(a, b) => (b ? a / b * 100 : 0) },
];

/* ---- custom fields ------------------------------------------------------
   A custom field is an expression evaluated per source row, then aggregated
   like any other measure. Fields are written in [brackets]; the function
   library below is what the editor offers. */

const DM_FUNCTIONS = [
  { name:'datetrunc', sig:'datetrunc(part, expr) \u2192 date', group:'Date',
    desc:'Truncates a date to the given precision (year, quarter, month, day).',
    example:"datetrunc('month', [date])",
    fn:(part, v) => {
      const d = String(v || '');
      const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d); if (!m) return d;
      const p = String(part).toLowerCase();
      if (p === 'year')    return m[1] + '-01-01';
      if (p === 'quarter') return m[1] + '-' + String(Math.floor((+m[2] - 1) / 3) * 3 + 1).padStart(2, '0') + '-01';
      if (p === 'month')   return m[1] + '-' + m[2] + '-01';
      return m[0];
    } },
  { name:'current_date', sig:'current_date() \u2192 date', group:'Date',
    desc:'Today\u2019s date, as the reporting database sees it.',
    example:'current_date()', fn:() => '2026-07-27' },
  { name:'year', sig:'year(expr) \u2192 number', group:'Date',
    desc:'The four-digit year of a date.', example:'year([date])',
    fn:(v) => Number(String(v || '').slice(0, 4)) || 0 },
  { name:'datediff', sig:'datediff(a, b) \u2192 number', group:'Date',
    desc:'Whole days from date b to date a.', example:'datediff(current_date(), [opened_date])',
    fn:(a, b) => Math.round((Date.parse(a) - Date.parse(b)) / 86400000) || 0 },

  { name:'isnull', sig:'isnull(expr) \u2192 boolean', group:'Logic',
    desc:'True when the expression is NULL or empty.', example:'isnull([ticker])',
    fn:(v) => v == null || v === '' },
  { name:'isnotnull', sig:'isnotnull(expr) \u2192 boolean', group:'Logic',
    desc:'True when the expression is not NULL.', example:'isnotnull([ticker])',
    fn:(v) => !(v == null || v === '') },
  { name:'in', sig:'in(expr, values\u2026) \u2192 boolean', group:'Logic',
    desc:'True when the expression matches any of the listed values.',
    example:"in([segment], 'High Net Worth', 'Ultra High Net Worth')",
    fn:(v, ...vals) => vals.some(x => String(x) === String(v)) },
  { name:'if', sig:'if(test, then, else) \u2192 any', group:'Logic',
    desc:'Returns one value when the test holds, another when it does not.',
    example:"if([unrealized] > 0, 'Gain', 'Loss')",
    fn:(t, a, b) => (t ? a : b) },
  { name:'coalesce', sig:'coalesce(a, b\u2026) \u2192 any', group:'Logic',
    desc:'The first argument that is not NULL or empty.', example:'coalesce([ticker], [security])',
    fn:(...xs) => xs.find(x => x != null && x !== '') ?? null },

  { name:'abs', sig:'abs(expr) \u2192 number', group:'Number',
    desc:'Absolute value.', example:'abs([net_flow])', fn:(v) => Math.abs(Number(v) || 0) },
  { name:'round', sig:'round(expr, places) \u2192 number', group:'Number',
    desc:'Rounds to the given number of decimal places.', example:'round([fee_rate], 2)',
    fn:(v, p) => { const k = Math.pow(10, Number(p) || 0); return Math.round((Number(v) || 0) * k) / k; } },
  { name:'min', sig:'min(a, b\u2026) \u2192 number', group:'Number',
    desc:'Smallest of its arguments.', example:'min([market_value], 1000000)',
    fn:(...xs) => Math.min(...xs.map(x => Number(x) || 0)) },
  { name:'max', sig:'max(a, b\u2026) \u2192 number', group:'Number',
    desc:'Largest of its arguments.', example:'max([unrealized], 0)',
    fn:(...xs) => Math.max(...xs.map(x => Number(x) || 0)) },

  { name:'concat', sig:'concat(a, b\u2026) \u2192 text', group:'Text',
    desc:'Joins its arguments into one string.', example:"concat([ticker], ' \u00b7 ', [security])",
    fn:(...xs) => xs.map(x => (x == null ? '' : String(x))).join('') },
  { name:'upper', sig:'upper(expr) \u2192 text', group:'Text',
    desc:'Upper case.', example:'upper([segment])', fn:(v) => String(v == null ? '' : v).toUpperCase() },
  { name:'lower', sig:'lower(expr) \u2192 text', group:'Text',
    desc:'Lower case.', example:'lower([segment])', fn:(v) => String(v == null ? '' : v).toLowerCase() },
  { name:'contains', sig:'contains(expr, text) \u2192 boolean', group:'Text',
    desc:'True when the first argument contains the second.', example:"contains([security], 'Bond')",
    fn:(v, t) => String(v == null ? '' : v).toLowerCase().includes(String(t).toLowerCase()) },
];

const DM_FN_MAP = Object.fromEntries(DM_FUNCTIONS.map(f => [f.name, f]));

/* --- tokenizer --- */
function dmTokenize(src) {
  const out = [];
  let i = 0;
  const isDigit = (c) => c >= '0' && c <= '9';
  const isIdent = (c) => /[A-Za-z0-9_]/.test(c);
  while (i < src.length) {
    const c = src[i];
    if (/\s/.test(c)) { i++; continue; }
    if (c === '[') {
      const j = src.indexOf(']', i);
      if (j < 0) throw new Error('Unclosed [field]');
      out.push({ t:'field', v: src.slice(i + 1, j).trim() }); i = j + 1; continue;
    }
    if (c === "'" || c === '"') {
      const j = src.indexOf(c, i + 1);
      if (j < 0) throw new Error('Unclosed string');
      out.push({ t:'str', v: src.slice(i + 1, j) }); i = j + 1; continue;
    }
    if (isDigit(c) || (c === '.' && isDigit(src[i + 1]))) {
      let j = i; while (j < src.length && /[0-9.]/.test(src[j])) j++;
      out.push({ t:'num', v: Number(src.slice(i, j)) }); i = j; continue;
    }
    if (isIdent(c)) {
      let j = i; while (j < src.length && isIdent(src[j])) j++;
      out.push({ t:'ident', v: src.slice(i, j) }); i = j; continue;
    }
    const two = src.slice(i, i + 2);
    if (two === '>=' || two === '<=' || two === '!=' || two === '==') { out.push({ t:'op', v: two === '==' ? '=' : two }); i += 2; continue; }
    if ('+-*/%()<>=,'.includes(c)) { out.push({ t:'op', v:c }); i++; continue; }
    throw new Error('Unexpected character "' + c + '"');
  }
  return out;
}

/* --- parser: precedence climbing --- */
function dmParse(src) {
  const tk = dmTokenize(src);
  let p = 0;
  const peek = () => tk[p];
  const eat = (v) => { const t = tk[p]; if (!t || (v && !(t.v === v))) throw new Error('Expected "' + v + '"'); p++; return t; };

  const parsePrimary = () => {
    const t = peek();
    if (!t) throw new Error('Unexpected end of expression');
    if (t.t === 'num' || t.t === 'str') { p++; return { k:t.t, v:t.v }; }
    if (t.t === 'field') { p++; return { k:'field', v:t.v }; }
    if (t.t === 'op' && t.v === '(') { p++; const e = parseOr(); eat(')'); return e; }
    if (t.t === 'op' && t.v === '-') { p++; return { k:'neg', a:parsePrimary() }; }
    if (t.t === 'ident') {
      const name = t.v.toLowerCase(); p++;
      if (name === 'true')  return { k:'num', v:1 };
      if (name === 'false') return { k:'num', v:0 };
      if (name === 'null')  return { k:'str', v:'' };
      if (!peek() || peek().v !== '(') throw new Error('Unknown name "' + t.v + '" \u2014 fields go in [brackets]');
      eat('(');
      const args = [];
      if (peek() && peek().v !== ')') {
        args.push(parseOr());
        while (peek() && peek().v === ',') { p++; args.push(parseOr()); }
      }
      eat(')');
      if (!DM_FN_MAP[name]) throw new Error('No function called "' + name + '"');
      return { k:'call', name, args };
    }
    throw new Error('Unexpected "' + t.v + '"');
  };
  const bin = (next, ops) => () => {
    let left = next();
    while (peek() && peek().t === 'op' && ops.includes(peek().v)) { const op = eat().v; left = { k:'bin', op, a:left, b:next() }; }
    return left;
  };
  const parseMul = bin(parsePrimary, ['*', '/', '%']);
  const parseAdd = bin(parseMul, ['+', '-']);
  const parseCmp = bin(parseAdd, ['>', '<', '>=', '<=', '=', '!=']);
  const parseAnd = () => {
    let left = parseCmp();
    while (peek() && peek().t === 'ident' && peek().v.toLowerCase() === 'and') { p++; left = { k:'and', a:left, b:parseCmp() }; }
    return left;
  };
  function parseOr() {
    let left = parseAnd();
    while (peek() && peek().t === 'ident' && peek().v.toLowerCase() === 'or') { p++; left = { k:'or', a:left, b:parseAnd() }; }
    return left;
  }
  const ast = parseOr();
  if (p < tk.length) throw new Error('Unexpected "' + tk[p].v + '"');
  return ast;
}

function dmEvalAst(n, row) {
  switch (n.k) {
    case 'num': case 'str': return n.v;
    case 'field': return row[n.v];
    case 'neg': return -(Number(dmEvalAst(n.a, row)) || 0);
    case 'and': return !!dmEvalAst(n.a, row) && !!dmEvalAst(n.b, row);
    case 'or':  return !!dmEvalAst(n.a, row) || !!dmEvalAst(n.b, row);
    case 'call': return DM_FN_MAP[n.name].fn(...n.args.map(a => dmEvalAst(a, row)));
    case 'bin': {
      const a = dmEvalAst(n.a, row), b = dmEvalAst(n.b, row);
      const na = Number(a) || 0, nb = Number(b) || 0;
      switch (n.op) {
        case '+': return (typeof a === 'string' || typeof b === 'string') && isNaN(Number(a)) ? String(a) + String(b) : na + nb;
        case '-': return na - nb;
        case '*': return na * nb;
        case '/': return nb ? na / nb : 0;
        case '%': return nb ? na % nb : 0;
        case '>': return na > nb;  case '<': return na < nb;
        case '>=': return na >= nb; case '<=': return na <= nb;
        case '=':  return String(a) === String(b);
        case '!=': return String(a) !== String(b);
      }
      return 0;
    }
  }
  return null;
}

function dmAstFields(n, out = []) {
  if (!n || typeof n !== 'object') return out;
  if (n.k === 'field') out.push(n.v);
  ['a', 'b'].forEach(x => { if (n[x]) dmAstFields(n[x], out); });
  (n.args || []).forEach(x => dmAstFields(x, out));
  return out;
}

/* Compile once, evaluate per row. Pass a dataset id to check field names.
   Returns { ok, run, fields, error }. */
function dmCompile(expr, ds) {
  try {
    const ast = dmParse(String(expr || ''));
    const used = [...new Set(dmAstFields(ast))];
    if (ds) {
      const known = new Set(dmFields(ds).map(f => f.k));
      const bad = used.filter(k => !known.has(k));
      if (bad.length) throw new Error('No column [' + bad[0] + '] in ' + dmDataset(ds).label);
    }
    return { ok:true, fields:used, run:(row) => {
      const v = dmEvalAst(ast, row);
      return typeof v === 'boolean' ? (v ? 1 : 0) : v;
    } };
  } catch (e) { return { ok:false, error:e.message }; }
}

/* Legacy two-field calcs still work; anything with .expr uses the engine. */
function dmCalcRunner(c) {
  if (c.expr) { const r = dmCompile(c.expr); return r.ok ? r.run : null; }
  if (!c.a || !c.b) return null;
  const op = DM_CALC_OPS.find(o => o.id === c.op) || DM_CALC_OPS[0];
  return (row) => dmRound(op.apply(Number(row[c.a]) || 0, Number(row[c.b]) || 0), 2);
}

function dmApplyCalcs(rows, calcs) {
  const runners = calcs.map(c => ({ c, run: dmCalcRunner(c) })).filter(x => x.run);
  if (!runners.length) return rows;
  return rows.map(r => {
    const out = { ...r };
    runners.forEach(({ c, run }) => {
      let v; try { v = run(out); } catch (e) { v = null; }
      out[c.name] = typeof v === 'number' ? dmRound(v, 4) : v;
    });
    return out;
  });
}

/* ---- value formulas ------------------------------------------------------
   A placed value can carry a formula instead of a bare field: an aggregation
   wrapped around a row-level expression, e.g. Sum([Market Value] - [Cost Basis]).
   Fields may be written by label or by key; a label from a connected source
   ("Fee Amount \u00b7 Billing") resolves to that source's column. */
const DM_VALUE_AGGS = [
  { id:'sum', name:'Sum' }, { id:'avg', name:'Average' }, { id:'min', name:'Min' },
  { id:'max', name:'Max' }, { id:'count', name:'Count' }, { id:'countd', name:'CountDistinct' },
  { id:'median', name:'Median' },
];
const dmAggByName = (n) => (DM_VALUE_AGGS.find(a => a.name.toLowerCase() === String(n).toLowerCase()) || {}).id;
const dmAggName = (id) => (DM_VALUE_AGGS.find(a => a.id === id) || DM_VALUE_AGGS[0]).name;

/* every name a field answers to, mapped to its canonical key */
function dmFieldLookup(dsId) {
  const m = new Map();
  const put = (name, key) => { const k = String(name).toLowerCase().trim(); if (!m.has(k)) m.set(k, key); };
  dmFields(dsId).forEach(f => { put(f.k, f.k); put(f.label, f.k); });
  dmRelated(dsId).forEach(rel => {
    dmFields(rel.id).forEach(f => {
      const key = rel.id + '.' + f.k;
      put(key, key);
      put(f.label + ' \u00b7 ' + DM_DATASETS[rel.id].label, key);
      put(rel.label + '.' + f.label, key);
      if (!m.has(String(f.label).toLowerCase())) put(f.label, key);
    });
  });
  return m;
}

/* rewrite [Anything] to its canonical key, so the compiler sees real columns */
function dmResolveRefs(dsId, expr) {
  const look = dmFieldLookup(dsId);
  const unknown = [];
  const out = String(expr).replace(/\[([^\]]*)\]/g, (m, name) => {
    const key = look.get(String(name).toLowerCase().trim());
    if (!key) { unknown.push(name.trim()); return m; }
    return '[' + key + ']';
  });
  return { expr: out, unknown };
}

/* Agg( expression ) -> { agg, inner }; a bare expression defaults to Sum */
function dmSplitFormula(text) {
  const t = String(text || '').trim();
  const m = /^([A-Za-z]+)\s*\(([\s\S]*)\)$/.exec(t);
  if (m) {
    const agg = dmAggByName(m[1]);
    if (agg) return { agg, inner: m[2].trim() };
    /* a leading name that isn't an aggregation is a row function, not a wrapper */
  }
  return { agg:'sum', inner: t };
}

/* Splits "Sum([a]) / Sum([b]) * 100" into the arithmetic and the aggregate calls
   it contains, each replaced by a placeholder field. */
function dmSplitAggs(text) {
  const names = DM_VALUE_AGGS.map(a => a.name).join('|');
  const re = new RegExp('\\b(' + names + ')\\s*\\(', 'gi');
  let out = '', calls = [], i = 0;
  for (;;) {
    re.lastIndex = i;
    const m = re.exec(text);
    if (!m) { out += text.slice(i); break; }
    out += text.slice(i, m.index);
    let depth = 1, j = m.index + m[0].length;
    for (; j < text.length && depth > 0; j++) {
      if (text[j] === '(') depth++;
      else if (text[j] === ')') depth--;
    }
    if (depth > 0) return { outer:null, calls:[], error:'Unclosed (' };
    out += '[__a' + calls.length + ']';
    calls.push({ agg: dmAggByName(m[1]) || 'sum', inner: text.slice(m.index + m[0].length, j - 1) });
    i = j;
  }
  return { outer: out, calls };
}

/* Returns { ok, agg, run, scope, fmt, error }. scope is 'base' or a dataset id
   when every field in the expression belongs to one connected source. */
function dmCompileValue(dsId, text) {
  /* the scope of one aggregate call: base rows, or a single connected source */
  const scopeOf = (dsId2, fields) => {
    const dsOf = fields.map(k => { const p = dmParseRef(k); return p ? p.ds : null; });
    const foreign = [...new Set(dsOf.filter(Boolean))];
    if (foreign.length > 1) return { error:'A formula can use one connected source at a time' };
    if (foreign.length === 1 && dsOf.some(x => x === null)) {
      return { error:'Mix of sources \u2014 aggregate ' + DM_DATASETS[foreign[0]].label + ' separately' };
    }
    return { scope: foreign.length === 1 ? foreign[0] : 'base' };
  };

  const split = dmSplitAggs(String(text || ''));
  if (split.error) return { ok:false, error:split.error };
  if (split.calls.length) {
    const calls = [];
    for (const c of split.calls) {
      if (!c.inner.trim()) return { ok:false, error:'Empty ' + dmAggName(c.agg) + '()' };
      const r = dmResolveRefs(dsId, c.inner);
      if (r.unknown.length) return { ok:false, error:'No field called [' + r.unknown[0] + ']' };
      const cc = dmCompile(r.expr);
      if (!cc.ok) return { ok:false, error:cc.error };
      const sc = scopeOf(dsId, cc.fields || []);
      if (sc.error) return { ok:false, error:sc.error };
      const run = sc.scope === 'base' ? cc.run : (() => {
        const stripped = dmCompile(r.expr.replace(new RegExp('\\[' + sc.scope + '\\.', 'g'), '['));
        return stripped.ok ? stripped.run : cc.run;
      })();
      calls.push({ agg:c.agg, run, scope:sc.scope, fields:cc.fields || [] });
    }
    const outer = dmCompile(split.outer);
    if (!outer.ok) return { ok:false, error:outer.error };
    /* one aggregate over one field keeps that field's format; anything divided
       is a ratio, so it has no inherited unit */
    const refs = calls.flatMap(c => c.fields);
    const fmts = [...new Set(refs.map(k => (dmFieldRef(dsId, k) || {}).fmt).filter(Boolean))];
    const divides = /[/]/.test(split.outer);
    return { ok:true, post:true, calls, outer:outer.run,
      agg: calls.length === 1 ? calls[0].agg : 'sum',
      scope: calls.length === 1 ? calls[0].scope : 'base',
      fmt: (!divides && fmts.length === 1) ? fmts[0] : 'num', fields:refs };
  }

  const { agg, inner } = dmSplitFormula(text);
  if (!inner) return { ok:false, error:'Write an expression, e.g. Sum([Market Value])' };
  const r = dmResolveRefs(dsId, inner);
  if (r.unknown.length) return { ok:false, error:'No field called [' + r.unknown[0] + ']' };
  const c = dmCompile(r.expr);
  if (!c.ok) return { ok:false, error:c.error };

  const refs = (c.fields || []);
  const dsOf = refs.map(k => { const p = dmParseRef(k); return p ? p.ds : null; });
  const foreign = [...new Set(dsOf.filter(Boolean))];
  const hasBase = dsOf.some(x => x === null);
  if (foreign.length > 1) return { ok:false, error:'A formula can use one connected source at a time' };
  if (foreign.length === 1 && hasBase) return { ok:false, error:'Mix of sources \u2014 aggregate ' + DM_DATASETS[foreign[0]].label + ' separately' };
  const scope = foreign.length === 1 ? foreign[0] : 'base';

  /* inside a foreign scope the rows are that source's, so strip the prefix */
  const run = scope === 'base' ? c.run : (() => {
    const stripped = dmCompile(r.expr.replace(new RegExp('\\[' + scope + '\\.', 'g'), '['));
    return stripped.ok ? stripped.run : c.run;
  })();

  /* a formula inherits the format its fields agree on — currency minus
     currency is still currency; a ratio of unlike fields is a plain number */
  const fmts = [...new Set(refs.map(k => (dmFieldRef(dsId, k) || {}).fmt).filter(Boolean))];
  const divides = /[/]|%\s*of/.test(inner);
  return { ok:true, agg, run, scope, fmt: (!divides && fmts.length === 1) ? fmts[0] : 'num', fields:refs };
}

/* A short heading for a formula: the single field it references, or the
   aggregation over that field when several are involved. */
function dmFormulaLabel(dsId, expr, fx) {
  const refs = (fx && fx.fields) || [];
  const first = refs[0] ? dmFieldRef(dsId, refs[0]) : null;
  const firstLabel = first ? (first.refLabel || first.label) : null;
  if (refs.length === 1 && firstLabel) return firstLabel;
  const agg = fx && fx.agg ? dmAggName(fx.agg) : 'Sum';
  if (firstLabel) return agg + ' \u00b7 ' + firstLabel + (refs.length > 1 ? '\u2026' : '');
  return agg;
}

/* the text shown in the formula bar for a plain field */
function dmFormulaOf(dsId, v) {
  if (v.expr) return v.expr;
  const f = dmFieldRef(dsId, v.k);
  const label = f ? (f.refLabel || f.label) : v.k;
  return dmAggName(v.agg || (f && f.agg) || 'sum') + '([' + label + '])';
}

/* ---- filters ------------------------------------------------------------ */
const DM_FILTER_OPS = {
  dim:  [{ id:'is', label:'is' }, { id:'isnot', label:'is not' }, { id:'contains', label:'contains' }, { id:'latest', label:'is latest' }],
  num:  [{ id:'gt', label:'>' }, { id:'lt', label:'<' }, { id:'gte', label:'\u2265' }, { id:'lte', label:'\u2264' }, { id:'eq', label:'=' }],
  date: [{ id:'after', label:'after' }, { id:'before', label:'before' }],
};

/* ---- "latest" ------------------------------------------------------------
   A tile that means "the current month" should not carry a typed month. The
   value is read off the dataset instead, so the figure follows the export
   forward instead of going stale the day it rolls over. */
const DM_MONTHS_3 = { Jan:1, Feb:2, Mar:3, Apr:4, May:5, Jun:6, Jul:7, Aug:8, Sep:9, Oct:10, Nov:11, Dec:12 };
function dmTimeRank(v) {
  const t = String(v == null ? '' : v).trim();
  let m = /^([A-Z][a-z]{2})\s+(\d{2})$/.exec(t);
  if (m) return (2000 + Number(m[2])) * 100 + (DM_MONTHS_3[m[1]] || 0);
  m = /^Q([1-4])\s+(\d{4})$/.exec(t);
  if (m) return Number(m[2]) * 100 + Number(m[1]) * 3;
  m = /^(\d{4})-(\d{2})-(\d{2})/.exec(t);
  if (m) return Number(m[1]) * 10000 + Number(m[2]) * 100 + Number(m[3]);
  if (/^\d{4}$/.test(t)) return Number(t) * 100;
  return null;
}
const _dmLatest = new Map();
/* the newest value of a dimension: by period where the value parses as one,
   else the last one the source emits (source order is chronological) */
function dmLatestOf(dsId, k) {
  const ck = dsId + '|' + k;
  if (_dmLatest.has(ck)) return _dmLatest.get(ck);
  let best = null, bestRank = -Infinity;
  dmRows(dsId).forEach((r, i) => {
    const v = r[k];
    if (v == null || v === '') return;
    const t = dmTimeRank(v);
    const rank = t == null ? i : t;
    if (rank > bestRank) { bestRank = rank; best = v; }
  });
  _dmLatest.set(ck, best);
  return best;
}
/* 'is latest' carries no typed value, so it is resolved against the dataset
   before any row is matched */
function dmResolveFilters(dsId, filters) {
  return (filters || []).map(f => (f && f.op === 'latest')
    ? { ...f, op:'is', v: dmLatestOf(dsId, f.k) } : f);
}

function dmMatchFilter(row, f) {
  const v = row[f.k];
  switch (f.op) {
    case 'is':       return Array.isArray(f.v) ? f.v.includes(v) : String(v) === String(f.v);
    case 'isnot':    return Array.isArray(f.v) ? !f.v.includes(v) : String(v) !== String(f.v);
    case 'contains': return String(v).toLowerCase().includes(String(f.v).toLowerCase());
    case 'gt':       return Number(v) >  Number(f.v);
    case 'lt':       return Number(v) <  Number(f.v);
    case 'gte':      return Number(v) >= Number(f.v);
    case 'lte':      return Number(v) <= Number(f.v);
    case 'eq':       return Number(v) === Number(f.v);
    case 'after':    return String(v) >= String(f.v);
    case 'before':   return String(v) <= String(f.v);
    default:         return true;
  }
}

/* Date ranges available on the dashboard control bar */
const DM_DATE_RANGES = [
  { id:'all',   label:'All time',     from:null },
  { id:'today', label:'Today',        from:'2026-07-27' },
  { id:'week',  label:'This week',    from:'2026-07-20' },
  { id:'ytd',  label:'Year to date',  from:'2026-01-01' },
  { id:'q',    label:'This quarter',  from:'2026-07-01' },
  { id:'m',    label:'This month',    from:'2026-07-01' },
  { id:'t12',  label:'Last 12 months',from:'2025-08-01' },
  { id:'t90',  label:'Last 90 days',  from:'2026-04-28' },
  { id:'t30',  label:'Last 30 days',  from:'2026-06-27' },
];

/* ---- the query engine ---------------------------------------------------
   cfg = {
     ds, rows:[k], cols:[k|null], values:[{k, agg, label}],
     filters:[{k, op, v}], calcs:[{name, a, op, b, fmt}],
     sort:{key, dir}, limit, dateRange, crossFilter:{k,v}
   }
   → { columns:[{key,label,fmt,num}], data:[{cells:{}, _key, _raw}], totals:{}, rowCount } */
function dmRunQuery(cfg) {
  const ds = dmDataset(cfg.ds);
  const values = (cfg.values || []).filter(v => v && v.k);
  let rows = dmRows(cfg.ds);

  /* row-level calculated fields */
  const calcs = (cfg.calcs || []).filter(c => c && c.name && (c.expr || (c.a && c.b)));
  if (calcs.length) rows = dmApplyCalcs(rows, calcs);

  /* filters: tile filters + dashboard date range + cross-filter */
  const filters = dmResolveFilters(cfg.ds, cfg.filters);
  const dateField = ds.dateField;
  if (dateField && cfg.dateRange) {
    const dr = DM_DATE_RANGES.find(d => d.id === cfg.dateRange);
    if (dr && dr.from) filters.push({ k: dateField, op:'after', v: dr.from });
  }
  if (cfg.crossFilter && cfg.crossFilter.k && ds.fields.some(f => f.k === cfg.crossFilter.k)) {
    filters.push({ k: cfg.crossFilter.k, op:'is', v: cfg.crossFilter.v });
  }
  const baseFilters = filters.filter(f => !dmParseRef(f.k));
  if (baseFilters.length) rows = rows.filter(r => baseFilters.every(f => dmMatchFilter(r, f)));

  const fieldOf = (k) => {
    const c = calcs.find(x => x.name === k);
    if (c) return { k, label:k, type: c.fmt === 'text' ? 'dim' : 'num', fmt: c.fmt || 'num', calc:true };
    const rel = dmFieldRef(cfg.ds, k);
    if (rel && rel.ref) return { ...rel, label: rel.refLabel };
    return ds.fields.find(f => f.k === k) || { k, label:k, type:'dim', fmt:'text' };
  };

  const rowKeys = (cfg.rows || []).filter(Boolean);
  const colKey = (cfg.cols || []).filter(Boolean)[0] || null;

  /* Grouping by an identity dimension is asking about the things it names, so
     the unassigned bucket is set aside centrally — a tile must not have to
     remember to filter it. An explicit filter on that field still wins. */
  const groupDims = [...rowKeys, colKey].filter(Boolean);
  DM_IDENTITY_DIMS.forEach(k => {
    if (!groupDims.includes(k)) return;
    if (filters.some(f => f.k === k)) return;
    rows = rows.filter(r => r[k] !== DM_UNASSIGNED);
  });

  const dimRefs = [...rowKeys, colKey].filter(Boolean)
    .map(k => ({ k, ref: dmParseRef(k) })).filter(x => x.ref)
    .map(x => ({ ...x, join: dmJoinKey(cfg.ds, x.ref.ds) })).filter(x => x.join);
  if (dimRefs.length) {
    const idxs = dimRefs.map(d => ({ ...d, idx: dmIndexBy(d.ref.ds, d.join) }));
    rows = rows.map(r => {
      const o = { ...r };
      idxs.forEach(d => { const a = d.idx.get(r[d.join]); o[d.k] = a && a.length ? a[0][d.ref.k] : null; });
      return o;
    });
  }

  /* no grouping dimension → single aggregate row (KPI) */
  const groupOf = (r) => rowKeys.map(k => r[k]).join(' \u00b7 ');

  const groups = new Map();
  rows.forEach(r => {
    const gk = rowKeys.length ? groupOf(r) : '__all__';
    if (!groups.has(gk)) groups.set(gk, { key:gk, dims:rowKeys.map(k => r[k]), rows:[] });
    groups.get(gk).rows.push(r);
  });

  /* time dimensions read chronologically, not alphabetically. Source rows are
     generated in date order, so first-appearance order is chronological. */
  const TIME_KEYS = ['date', 'month', 'quarter', 'year', 'period', 'series'];
  const isTime = (k) => TIME_KEYS.includes(k);
  const MON = { Jan:1, Feb:2, Mar:3, Apr:4, May:5, Jun:6, Jul:7, Aug:8, Sep:9, Oct:10, Nov:11, Dec:12 };
  /* a sortable number for 'Mar 26', 'Q2 2026', '2026' or an ISO date */
  const timeRank = (v) => {
    const t = String(v == null ? '' : v).trim();
    let m = /^([A-Z][a-z]{2})\s+(\d{2})$/.exec(t);
    if (m) return (2000 + Number(m[2])) * 100 + (MON[m[1]] || 0);
    m = /^Q([1-4])\s+(\d{4})$/.exec(t);
    if (m) return Number(m[2]) * 100 + Number(m[1]) * 3;
    m = /^(\d{4})-(\d{2})-(\d{2})/.exec(t);
    if (m) return Number(m[1]) * 10000 + Number(m[2]) * 100 + Number(m[3]);
    if (/^\d{4}$/.test(t)) return Number(t) * 100;
    return null;
  };
  /* rank by the value itself where it parses as a period, else by first
     appearance — which is all an opaque dimension like 'series' can offer */
  const ordinalOf = (k) => {
    const seen = new Map();
    dmRows(cfg.ds).forEach((r, i) => { if (!seen.has(r[k])) seen.set(r[k], i); });
    const out = new Map();
    seen.forEach((i, v) => { const t = timeRank(v); out.set(v, t == null ? i : t); });
    return out;
  };

  const colValues = colKey
    ? (isTime(colKey)
        ? (() => { const ord = ordinalOf(colKey); return [...new Set(rows.map(r => r[colKey]))].sort((a, b) => (ord.get(a) || 0) - (ord.get(b) || 0)); })()
        : [...new Set(rows.map(r => r[colKey]))].sort())
    : [null];

  const columns = [];
  rowKeys.forEach(k => { const f = fieldOf(k); columns.push({ key:k, label:f.label, fmt:f.fmt, num:false, dim:true }); });
  const valueCols = [];
  colValues.forEach(cv => {
    values.forEach(v => {
      const fx = v.expr ? dmCompileValue(cfg.ds, v.expr) : null;
      const f = fx && fx.ok
        ? { label: dmFormulaLabel(cfg.ds, v.expr, fx), fmt: v.fmt || fx.fmt, agg: fx.agg }
        : fieldOf(v.k);
      const key = cv == null ? 'v:' + (v.expr || v.k) + ':' + v.agg : 'v:' + String(cv) + ':' + (v.expr || v.k) + ':' + v.agg;
      const label = v.label || (cv == null ? f.label : String(cv));
      const baseFmt = v.fmt || f.fmt || 'num';
      const col = { key, label, fmt: v.decimals != null ? baseFmt + ':' + v.decimals : baseFmt,
        num:true, valueKey:v.k, agg:v.agg || f.agg || 'sum', colValue:cv,
        decimals: v.decimals, formula: fx, expr: v.expr || null,
        groupLabel: cv == null ? null : String(cv), valueLabel:f.label,
        ref: f.ref || null, joinKey: f.ref ? dmJoinKey(cfg.ds, f.ref.ds) : null };
      columns.push(col); valueCols.push(col);
    });
  });

  /* Related rows for one group: everything in the other dataset that shares a
     join-key value with the group. Aggregating these directly (rather than
     attaching a value to every base row) is what keeps sums from double counting. */
  const relFilters = (relDs) => filters.filter(f => {
    const ref = dmParseRef(f.k);
    if (ref) return ref.ds === relDs;
    return DM_JOIN_KEYS.includes(f.k) && dmFields(relDs).some(x => x.k === f.k);
  }).map(f => ({ ...f, k: dmParseRef(f.k) ? dmParseRef(f.k).k : f.k }));

  const _relCache = new Map();
  const relRows = (col, groupRows) => {
    const idx = dmIndexBy(col.ref.ds, col.joinKey);
    const keys = [...new Set(groupRows.map(r => r[col.joinKey]))];
    const fs = _relCache.get(col.ref.ds) || (_relCache.set(col.ref.ds, relFilters(col.ref.ds)), _relCache.get(col.ref.ds));
    const out = [];
    keys.forEach(k => { const a = idx.get(k); if (a) out.push(...a); });
    return fs.length ? out.filter(r => fs.every(f => dmMatchFilter(r, f))) : out;
  };

  const evalPost = (fx, groupRows) => {
    const bound = {};
    fx.calls.forEach((c, i) => {
      const src = c.scope === 'base' ? groupRows
        : relRows({ ref:{ ds:c.scope }, joinKey: dmJoinKey(cfg.ds, c.scope) }, groupRows);
      bound['__a' + i] = dmAgg(c.agg, src.map(r => { try { return c.run(r); } catch (e) { return 0; } }));
    });
    try { const v = fx.outer(bound); return isFinite(v) ? v : 0; } catch (e) { return 0; }
  };

  const data = [...groups.values()].map(g => {
    const cells = {};
    rowKeys.forEach((k, i) => { cells[k] = g.dims[i]; });
    valueCols.forEach(c => {
      const src = c.colValue == null ? g.rows : g.rows.filter(r => r[colKey] === c.colValue);
      cells[c.key] = c.formula && c.formula.ok && c.formula.post
        ? evalPost(c.formula, src)
        : c.formula && c.formula.ok
        ? dmAgg(c.formula.agg, (c.formula.scope === 'base' ? src : relRows({ ref:{ ds:c.formula.scope }, joinKey: dmJoinKey(cfg.ds, c.formula.scope) }, src)).map(r => { try { return c.formula.run(r); } catch (e) { return 0; } }))
        : c.ref
          ? dmAgg(c.agg, relRows(c, src).map(r => r[c.ref.k]))
          : dmAgg(c.agg, src.map(r => r[c.valueKey]));
    });
    return { _key:g.key, cells, _count:g.rows.length, _rows:g.rows };
  });

  /* sort */
  if (!cfg.sort && rowKeys.length === 1 && isTime(rowKeys[0])) {
    const ord = ordinalOf(rowKeys[0]), rk = rowKeys[0];
    data.sort((a, b) => (ord.get(a.cells[rk]) || 0) - (ord.get(b.cells[rk]) || 0));
  } else {
  const headline = cfg.viz === 'cards' ? valueCols[valueCols.length - 1] : valueCols[0];
  const sortKey = (cfg.sort && cfg.sort.key) || (headline && headline.key);
  const dir = (cfg.sort && cfg.sort.dir) || 'desc';
  if (sortKey) {
    data.sort((a, b) => {
      const x = a.cells[sortKey], y = b.cells[sortKey];
      const nx = Number(x), ny = Number(y);
      const cmp = (!isNaN(nx) && !isNaN(ny)) ? nx - ny : String(x).localeCompare(String(y));
      return dir === 'asc' ? cmp : -cmp;
    });
  }
  }

  const rowCount = data.length;
  const limited = cfg.limit ? data.slice(0, cfg.limit) : data;

  const totals = {};
  valueCols.forEach(c => {
    if (c.formula && c.formula.ok && c.formula.post) { totals[c.key] = evalPost(c.formula, rows); return; }
    if (c.formula && c.formula.ok) {
      const src = c.formula.scope === 'base' ? rows : relRows({ ref:{ ds:c.formula.scope }, joinKey: dmJoinKey(cfg.ds, c.formula.scope) }, rows);
      totals[c.key] = dmAgg(c.formula.agg, src.map(r => { try { return c.formula.run(r); } catch (e) { return 0; } }));
      return;
    }
    if (c.ref) {
      const all = relRows(c, rows);
      totals[c.key] = c.agg === 'count' ? all.length
        : c.agg === 'countd' ? new Set(all.map(r => r[c.ref.k])).size
        : dmAgg(c.agg, all.map(r => r[c.ref.k]));
      return;
    }
    totals[c.key] = dmAgg(c.agg === 'count' || c.agg === 'countd' ? 'sum' : c.agg, rows.map(r => r[c.valueKey]));
    if (c.agg === 'count')  totals[c.key] = rows.length;
    if (c.agg === 'countd') totals[c.key] = new Set(rows.map(r => r[c.valueKey])).size;
  });

  return { columns, valueCols, dimCols: columns.filter(c => c.dim), data: limited, totals, rowCount, matchedRows: rows.length, dateField, colKey };
}

/* Comparison value for KPI deltas — month over month on the SAME filtered rows
   the tile itself queries (tile filters + date range + cross filter + page scope). */
function dmKpiDelta(cfg) {
  const ds = dmDataset(cfg.ds);
  if (!ds.dateField) return null;
  const v = (cfg.values || []).filter(x => x && x.k)[0];
  if (!v) return null;

  let rows = dmRows(cfg.ds);

  const calcs = (cfg.calcs || []).filter(c => c && c.name && (c.expr || (c.a && c.b)));
  if (calcs.length) rows = dmApplyCalcs(rows, calcs);

  const filters = dmResolveFilters(cfg.ds, cfg.filters);
  if (cfg.dateRange) {
    const dr = DM_DATE_RANGES.find(d => d.id === cfg.dateRange);
    if (dr && dr.from) filters.push({ k: ds.dateField, op:'after', v: dr.from });
  }
  if (cfg.crossFilter && cfg.crossFilter.k && ds.fields.some(f => f.k === cfg.crossFilter.k)) {
    filters.push({ k: cfg.crossFilter.k, op:'is', v: cfg.crossFilter.v });
  }
  if (filters.length) rows = rows.filter(r => filters.every(f => dmMatchFilter(r, f)));

  /* month ordering follows source order, which is chronological */
  const ord = new Map();
  dmRows(cfg.ds).forEach((r, i) => { if (!ord.has(r.month)) ord.set(r.month, i); });
  const months = [...new Set(rows.map(r => r.month))].sort((x, y) => (ord.get(x) || 0) - (ord.get(y) || 0));
  if (months.length < 2) return null;

  const agg = (m) => dmAgg(v.agg || (dmField(cfg.ds, v.k) || {}).agg || 'sum', rows.filter(r => r.month === m).map(r => r[v.k]));
  const cur = agg(months[months.length - 1]), prev = agg(months[months.length - 2]);
  if (!prev) return null;
  return { pct: dmRound((cur - prev) / Math.abs(prev) * 100, 1), label:'vs ' + months[months.length - 2] };
}

const DM_PERIOD_TO_RANGE = {
  'Today':'today', 'This week':'week', 'This month':'m', 'This quarter':'q',
  'Year to date':'ytd', 'Last 12 months':'t12', 'All time':'all',
};
const dmRangeFromPeriod = (p) => DM_PERIOD_TO_RANGE[p] || 'ytd';

Object.assign(window, {
  DM_PERIOD_TO_RANGE, dmRangeFromPeriod,
  DM_DATASETS, DM_GROUPS, DM_AGGS, DM_CALC_OPS, DM_FILTER_OPS, DM_DATE_RANGES,
  DM_FUNCTIONS, DM_FN_MAP, dmCompile, dmApplyCalcs, dmAstFields,
  DM_SEGMENTS,
  DM_UNASSIGNED, DM_IDENTITY_DIMS, DM_JOIN_KEYS, dmJoinKey, dmRelated, dmParseRef, dmFieldRef, dmIndexBy,
  DM_VALUE_AGGS, dmAggName, dmAggByName, dmCompileValue, dmFormulaOf, dmFormulaLabel, dmFieldLookup, dmSplitFormula,
  dmDataset, dmFields, dmField, dmRows, dmRunQuery, dmAgg, dmFmt, dmFmtFull, dmKpiDelta, dmMatchFilter, dmResolveFilters, dmLatestOf,
});
