/* Data Explorer — synthetic unified egress feed.
   Shape follows the Unified Distribution Intelligence Feed data dictionary
   (advisor x month x vehicle x category x platform grain) with every firm,
   person, pack and program name replaced by placeholders. Level 2 (CRM
   activity) and Level 3 (segments + signals) ride on a linked FA table,
   joined on fa_crd, the way the egress delivers them. */

const EX_MONTHS = ['Feb 2026', 'Mar 2026', 'Apr 2026', 'May 2026', 'Jun 2026', 'Jul 2026'];
const EX_MONTH_ISO = ['2026-02-28', '2026-03-31', '2026-04-30', '2026-05-31', '2026-06-30', '2026-07-31'];

const EX_FIRMS = [
  { name: 'Contoso Wealth',       ch: 'Wirehouse',    pack: 'Contoso FA Pack',   native: true,  w: 1.6, offices: 4 },
  { name: 'Northwind Securities', ch: 'Wirehouse',    pack: 'Northwind FA Pack', native: true,  w: 1.4, offices: 4 },
  { name: 'Fabrikam Financial',   ch: 'IBD',          pack: 'Fabrikam FA Pack',  native: true,  w: 1.0, offices: 3 },
  { name: 'Adatum Partners',      ch: 'Wirehouse',    pack: 'Office Pack',       native: false, w: 1.2, offices: 3 },
  { name: 'Tailspin Capital',     ch: 'IBD',          pack: 'Team Pack',         native: false, w: 0.8, offices: 3 },
  { name: 'Proseware Group',      ch: 'IBD',          pack: 'Office Pack',       native: false, w: 0.7, offices: 2 },
  { name: 'Litware Advisors',     ch: 'RIA',          pack: 'Form ADV',          native: false, w: 0.9, offices: 2 },
  { name: 'Wingtip RIA',          ch: 'RIA',          pack: 'Fund Flow Pack',    native: false, w: 0.6, offices: 2 },
  { name: 'Trey Trust',           ch: 'Private Bank', pack: 'Office Pack',       native: false, w: 0.9, offices: 2 },
];

const EX_REGIONS = [
  { name: 'Northeast',     wholesaler: 'Morgan Vance',  cities: [['New York', 'NY'], ['Boston', 'MA'], ['Stamford', 'CT'], ['Philadelphia', 'PA']] },
  { name: 'Southeast',     wholesaler: 'John Roe',      cities: [['Atlanta', 'GA'], ['Charlotte', 'NC'], ['Miami', 'FL']] },
  { name: 'Midwest',       wholesaler: 'Jane Roe',      cities: [['Chicago', 'IL'], ['Minneapolis', 'MN'], ['St. Louis', 'MO'], ['Des Moines', 'IA']] },
  { name: 'Southwest',     wholesaler: 'Mark Smith',    cities: [['Dallas', 'TX'], ['Oklahoma City', 'OK'], ['Phoenix', 'AZ']] },
  { name: 'Mountain West', wholesaler: 'Sarah Roe',     cities: [['Denver', 'CO'], ['Salt Lake City', 'UT']] },
  { name: 'West Coast',    wholesaler: 'Michael Brown', cities: [['San Francisco', 'CA'], ['Los Angeles', 'CA'], ['Seattle', 'WA']] },
];

// [category, broad asset class, vehicles it trades in]
const EX_CATS = [
  ['Large Growth', 'US Equity', ['MF', 'ETF', 'SMA']],
  ['Large Blend', 'US Equity', ['MF', 'ETF', 'SMA']],
  ['Large Value', 'US Equity', ['MF', 'ETF', 'SMA']],
  ['Foreign Large Blend', 'International Equity', ['MF', 'ETF']],
  ['Diversified Emerging Mkts', 'International Equity', ['MF', 'ETF']],
  ['Intermediate Core Bond', 'Fixed Income', ['MF', 'ETF', 'SMA']],
  ['Intermediate Core-Plus Bond', 'Fixed Income', ['MF', 'ETF', 'SMA']],
  ['High Yield Bond', 'Fixed Income', ['MF', 'ETF']],
  ['Muni National Interm', 'Fixed Income', ['SMA', 'MF']],
  ['Moderate Allocation', 'Allocation', ['Models', 'MF']],
  ['Aggressive Allocation', 'Allocation', ['Models']],
  ['Multistrategy', 'Alternatives', ['Alts']],
  ['Private Credit', 'Alternatives', ['Alts']],
];
const EX_PLATFORMS = {
  'Brokerage': ['Brokerage'],
  'FA Discretion Advisory': ['Rep-as-PM Program', 'Unified Managed Account'],
  'Firm Discretion Advisory': ['Home Office Models', 'Portfolio Consulting Program'],
};
const EX_TEAM_NAMED = ['The Doe Wealth Group', 'The Smith Group', 'Roe Partners', 'The Brown Group', 'Sample Consulting', 'Doe & Roe Advisors', 'The Smith Group II', 'Keystone Wealth', 'Charter Oak Advisors', 'Blue Line Wealth'];
const EX_TEAM_WORDS = ['Cedar', 'Granite', 'Beacon', 'Sterling', 'Compass', 'Hawthorn', 'Bridgeway', 'Ironwood', 'Lakeshore', 'Redstone', 'Westport', 'Arbor', 'Pinnacle', 'Fairmount', 'Clearview', 'Oakmont', 'Harborview', 'Silverline', 'Northfield', 'Kingsley'];
const EX_TEAM_TAIL = ['Wealth Partners', 'Advisors', 'Capital Group', 'Wealth Management', 'Financial Group', 'Private Wealth'];
const EX_FIRST = ['John', 'Jane', 'Mary', 'Mark', 'Robert', 'Linda', 'Michael', 'Emily', 'Sarah', 'Pat', 'Chris', 'Alex', 'Sam'];
const EX_LAST = ['Doe', 'Smith', 'Roe', 'Jones', 'Brown', 'Public', 'Sample'];

const EX_SIG_TYPES = ['Performance Advantage', 'Fee Advantage', 'Focus: Core Equity ETF', 'Focus: Muni Ladder SMA', 'Focus: Private Credit Fund', 'Upsell', 'Cross-sell', 'Fallen Angel', 'Retention Risk', 'Meeting Opportunity'];
const EX_SIG_PRODUCT = {
  'Performance Advantage': ['Field Large Growth Fund', 'Field Core Equity ETF', 'Field Core Plus Bond ETF'],
  'Fee Advantage': ['Field Core Equity ETF', 'Field Short Duration ETF', 'Field Core Plus SMA'],
  'Focus: Core Equity ETF': ['Field Core Equity ETF'],
  'Focus: Muni Ladder SMA': ['Field Muni Ladder SMA'],
  'Focus: Private Credit Fund': ['Field Private Credit Fund II'],
  'Upsell': ['Field Large Growth SMA', 'Field Tax-Managed Equity SMA', 'Field Core Equity ETF'],
  'Cross-sell': ['Field Strategic Income Fund', 'Field Muni Ladder SMA', 'Field Real Assets Fund'],
  'Fallen Angel': [null], 'Retention Risk': [null], 'Meeting Opportunity': [null],
};
const EX_SIG_SOURCE = t => (t.startsWith('Focus') || t === 'Cross-sell' ? 'ML model · weekly' : t === 'Upsell' || t === 'Fallen Angel' ? 'Your sales · daily' : t === 'Meeting Opportunity' ? 'CRM · daily' : t === 'Retention Risk' ? 'Feed + sales · daily' : 'Competitive pack · monthly');

function exRng(seed) {
  let a = seed >>> 0;
  return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

const EX_DATA = (() => {
  const r = exRng(20260731);
  const pick = a => a[Math.floor(r() * a.length)];
  const between = (a, b) => a + r() * (b - a);
  const fas = [], rows = [];
  let teamN = 0, faN = 0, officeN = 0;
  const allCities = EX_REGIONS.flatMap(g => g.cities.map(c => ({ region: g, city: c[0], state: c[1] })));
  EX_FIRMS.forEach((firm, fi) => {
    const used = new Set();
    for (let o = 0; o < firm.offices; o++) {
      let loc; do { loc = pick(allCities); } while (used.has(loc.city) && used.size < allCities.length); used.add(loc.city);
      officeN++;
      const officeId = `OFF-${String(1000 + fi * 37).slice(-4)}-${String(officeN).padStart(3, '0')}`;
      const nTeams = 2 + Math.floor(r() * 2);
      for (let t = 0; t < nTeams; t++) {
        const team = teamN < EX_TEAM_NAMED.length ? EX_TEAM_NAMED[teamN] : `${EX_TEAM_WORDS[teamN % EX_TEAM_WORDS.length]} ${EX_TEAM_TAIL[(teamN * 7) % EX_TEAM_TAIL.length]}`;
        const teamId = `TEAM-${String(4400 + teamN)}`;
        teamN++;
        const nFa = 1 + Math.floor(r() * 3);
        for (let k = 0; k < nFa; k++) fas.push(mkFa({ firm, loc, officeId, team, teamId, unalloc: false }));
      }
      if (!firm.native && r() < 0.45) fas.push(mkFa({ firm, loc, officeId, team: '(Unallocated)', teamId: '—', unalloc: true }));
    }
  });
  function mkFa({ firm, loc, officeId, team, teamId, unalloc }) {
    const i = faN++;
    const name = unalloc ? `Unknown FA · ${loc.city} ${officeId.slice(-3)}` : `${EX_FIRST[i % 13]} ${i >= 91 ? String.fromCharCode(65 + (i % 26)) + '. ' : ''}${EX_LAST[Math.floor(i / 13) % 7]}`;
    const book = Math.exp(between(Math.log(35e6), Math.log(900e6))) * firm.w * (unalloc ? 0.5 : 1);
    const tier = firm.native ? (r() < 0.5 ? 2 : 3) : unalloc ? 5 : (r() < 0.45 ? 3 : r() < 0.6 ? 4 : 5);
    const covered = r() < 0.68;
    const f = {
      idx: i, crd: unalloc ? `FLD-${officeId.slice(-3)}-UNK` : String(1200000 + Math.floor(r() * 6800000)), name, team, teamId, officeId,
      firm: firm.name, channel: firm.ch, pack: firm.pack, secondary: 'Office Pack (competitive)', city: loc.city, state: loc.state,
      region: loc.region.name, wholesaler: loc.region.wholesaler, tenure: Math.floor(between(2, 34)), unalloc,
      faDeriv: firm.native ? 'Direct' : 'ML-Attributed',
      attConf: firm.native ? 'N/A (FA-native)' : unalloc ? 'Low' : (r() < 0.55 ? 'High' : 'Medium'),
      tier, quality: r() < 0.04 ? 'stale' : r() < 0.03 ? 'review' : 'OK', freshness: firm.native ? 1 : 1 + Math.floor(r() * 3),
      timeDeriv: firm.native && r() < 0.6 ? 'Direct' : 'Synthesized', grain: firm.native ? 'FA x Month x Category x Platform' : firm.pack === 'Team Pack' ? 'TEAM' : 'OFFICE',
      book, covered, segment: null, producer: null, l2: [], lastMeet: 0, signals: [],
    };
    // Level 2: CRM activity by month
    f.l2 = EX_MONTHS.map(() => {
      const k = unalloc ? 0 : covered ? 1 : 0.15;
      return { meet: Math.round(between(0, 2.6) * k), call: Math.round(between(0, 6) * k), email: Math.round(between(0, 9) * (k + 0.2)), event: r() < 0.12 * (k + 0.3) ? 1 : 0, camp: Math.round(between(0, 6)) };
    });
    f.lastMeet = unalloc ? null : covered ? Math.floor(between(3, 90)) : Math.floor(between(120, 420));
    // Product cells
    const nCells = 4 + Math.floor(r() * 4);
    const cats = [...EX_CATS].sort(() => r() - 0.5).slice(0, nCells);
    let tSales = 0;
    cats.forEach(([cat, ac, vehs]) => {
      const veh = pick(vehs);
      const pt = veh === 'Models' ? 'Firm Discretion Advisory' : veh === 'SMA' ? (r() < 0.6 ? 'FA Discretion Advisory' : 'Firm Discretion Advisory') : veh === 'Alts' ? 'Brokerage' : veh === 'MF' ? (r() < 0.45 ? 'Brokerage' : 'FA Discretion Advisory') : (r() < 0.7 ? 'FA Discretion Advisory' : 'Brokerage');
      const pn = pick(EX_PLATFORMS[pt]);
      let aum = book * between(0.06, 0.28);
      const share = Math.max(0, between(-0.05, 0.36));
      const sShare = Math.max(0, Math.min(0.6, share + between(-0.08, 0.12)));
      const rm = +(between(-0.6, 1.4)).toFixed(1), fm = +(between(-0.12, 0.36)).toFixed(2), pm = +(between(-1.5, 3.6)).toFixed(1);
      const favourable = rm > 0 && fm > 0;
      EX_MONTHS.forEach((_, m) => {
        const gs = aum * between(0.006, 0.03), rd = aum * between(0.005, 0.024);
        const gsT = gs * sShare * between(0.7, 1.3), rdT = rd * share * between(0.7, 1.3);
        tSales += gsT;
        rows.push({ f, m, veh, cat, ac, pt, pn, aum, aumT: aum * share, gs, gsT, rd, rdT, rm, fm, pm, cap: favourable ? gs * (1 - sShare) * between(0.3, 0.8) : 0 });
        aum = aum * (1 + between(-0.012, 0.022)) + (gs - rd);
      });
    });
    f.producer = tSales > 1.2e6 ? 'Producer' : tSales > 0 ? 'Dabbler' : 'Prospect';
    // Level 3: segment + signals
    const opp = book * 0.12;
    f.segment = unalloc ? 'C' : opp > 40e6 ? 'A' : opp > 14e6 ? 'B' : 'C';
    if (!unalloc) {
      const n = Math.floor(between(0, 5.4) * (f.segment === 'A' ? 1.2 : f.segment === 'B' ? 0.9 : 0.6));
      const types = [...EX_SIG_TYPES].sort(() => r() - 0.5).slice(0, n);
      f.signals = types.map((type, j) => ({
        id: `SIG-${i}-${j}`, type, product: pick(EX_SIG_PRODUCT[type]), confidence: Math.round(between(50, 95)),
        opp: Math.round(opp * between(0.03, 0.22) / 1e5) * 1e5, source: EX_SIG_SOURCE(type),
        created: EX_MONTHS[5 - Math.floor(r() * 3)], method: type.startsWith('Focus') || type === 'Cross-sell' || type === 'Upsell' ? 'ML propensity model' : 'Rules engine',
      })).sort((a, b) => b.confidence - a.confidence);
    }
    // Signals follow the rollout phase: rule-based advantage signals from Phase 1,
    // retention / fallen angel from Phase 2, ML signals from Phase 3.
    const allSigs = f.signals || [];
    Object.defineProperty(f, 'signals', { configurable: true, enumerable: true, get: () => (window.lvPhaseSigOk ? allSigs.filter(s => lvPhaseSigOk(s.type)) : allSigs) });
    return f;
  }
  return { fas, rows };
})();

/* ---- field catalog: what the semantic layer exposes ---------------------- */

const EX_TIER_ORDER = ['Tier 1', 'Tier 2', 'Tier 3', 'Tier 4', 'Tier 5'];
const exD = (id, label, group, get, sql, o = {}) => ({ id, label, group, kind: 'dim', get, sql, ...o });
const EX_DIMS = [
  exD('fa', 'Advisor (FA)', 'Advisor', r => r.f.name, 'fa_name', { faLink: true, desc: 'Advisor full name. Unallocated office buckets show as Unknown FA.' }),
  exD('crd', 'FA CRD', 'Advisor', r => r.f.crd, 'fa_crd', { desc: 'FINRA CRD, or a Field-generated ID for unallocated buckets.' }),
  exD('team', 'Team', 'Advisor', r => r.f.team, 'team_name', { desc: 'Team / practice name.' }),
  exD('tenure', 'Tenure Band', 'Advisor', r => (r.f.tenure < 10 ? '<10 yrs' : r.f.tenure < 20 ? '10–19 yrs' : '20+ yrs'), 'fa_tenure_years', { order: ['<10 yrs', '10–19 yrs', '20+ yrs'], desc: 'Years since first FINRA registration, banded.' }),
  exD('firm', 'Firm', 'Firm', r => r.f.firm, 'firm_name', { desc: 'Resolved canonical firm name.' }),
  exD('channel', 'Channel', 'Firm', r => r.f.channel, 'channel_code', { desc: 'Wirehouse, IBD, RIA or Private Bank.' }),
  exD('region', 'Territory', 'Geo & Territory', r => r.f.region, 'territory_name', { desc: 'Client sales territory; Field default where none is provided.' }),
  exD('wholesaler', 'Wholesaler', 'Geo & Territory', r => r.f.wholesaler, 'wholesaler_name', { desc: 'External wholesaler covering the territory.' }),
  exD('state', 'State', 'Geo & Territory', r => r.f.state, 'office_state'),
  exD('city', 'City', 'Geo & Territory', r => r.f.city, 'office_city'),
  exD('office', 'Office', 'Geo & Territory', r => r.f.officeId, 'office_id', { desc: 'Field canonical office ID (address-resolved).' }),
  exD('month', 'Month', 'Time', r => EX_MONTHS[r.m], 'period_month', { order: EX_MONTHS, desc: 'Month-end the record describes.' }),
  exD('vehicle', 'Vehicle', 'Product', r => r.veh, 'vehicle', { prod: true, order: ['MF', 'ETF', 'SMA', 'Models', 'Alts'], desc: 'MF, ETF, SMA, Models or Alts.' }),
  exD('ac', 'Asset Class', 'Product', r => r.ac, 'asset_class_broad', { prod: true, desc: 'Broad asset-class rollup of the category.' }),
  exD('cat', 'Category', 'Product', r => r.cat, 'category', { prod: true, desc: 'Granular product category.' }),
  exD('pt', 'Platform Type', 'Product', r => r.pt, 'platform_type', { prod: true, desc: 'Brokerage, Firm Discretion Advisory or FA Discretion Advisory.' }),
  exD('pn', 'Platform (Program)', 'Product', r => r.pn, 'platform_native', { prod: true, desc: 'The firm program as delivered by the pack.' }),
  exD('pack', 'Source Pack', 'Provenance', r => r.f.pack, 'source_pack', { desc: 'Primary pack behind the core measures (varies by subscription).' }),
  exD('grain', 'Source Grain', 'Provenance', r => r.f.grain, 'source_grain', { desc: 'Native grain of the winning source.' }),
  exD('faDeriv', 'FA Derivation Method', 'Provenance', r => r.f.faDeriv, 'fa_derivation_method', { desc: 'Direct (advisor-native pack) or ML-Attributed (allocated down by the FA Attribution Engine).' }),
  exD('timeDeriv', 'Time Derivation Method', 'Provenance', r => r.f.timeDeriv, 'time_derivation_method', { desc: 'Direct monthly delivery or Synthesized.' }),
  exD('attConf', 'FA Attribution Confidence', 'Provenance', r => r.f.attConf, 'fa_attribution_confidence', { order: ['High', 'Medium', 'Low', 'N/A (FA-native)'] }),
  exD('tier', 'Confidence Tier', 'Provenance', r => 'Tier ' + r.f.tier, 'overall_confidence_tier', { order: EX_TIER_ORDER, desc: 'Record-level tier, 1 (highest) to 5.' }),
  exD('quality', 'Quality Flag', 'Provenance', r => r.f.quality, 'quality_flag'),
  exD('unalloc', 'Unallocated Bucket', 'Provenance', r => (r.f.unalloc ? 'Yes' : 'No'), 'is_unallocated_bucket'),
  exD('coverage', 'Coverage Status', 'CRM & Activity', r => (r.f.covered ? 'Covered' : 'Uncovered'), 'crm.coverage_status', { level: 2, desc: 'Covered = at least one logged meeting or call in the last 90 days.' }),
  exD('producer', 'Producer Type', 'CRM & Activity', r => r.f.producer, 'crm.producer_type', { level: 2, order: ['Producer', 'Dabbler', 'Prospect'] }),
  exD('segment', 'Segment', 'Signals', r => 'Segment ' + r.f.segment, 'sig.segment', { level: 3, order: ['Segment A', 'Segment B', 'Segment C'], desc: 'Size of the addressable opportunity (A largest).' }),
  exD('topSig', 'Top Signal Type', 'Signals', r => (r.f.signals[0] ? r.f.signals[0].type : 'No signal'), 'sig.top_signal_type', { level: 1, desc: 'Highest-ranked open signal for the FA. Phase 1: fee / performance advantage; Phase 2 adds retention risk and fallen angel; Phase 3 adds ML signals.' }),
];

const exM = (id, label, group, o) => ({ id, label, group, kind: 'measure', ...o });
const EX_MEASURES = [
  exM('aum', 'Market AUM', 'AUM', { agg: 'last', fn: r => r.aum, fmt: '$', metric: 'market_aum', sql: 'aum', def: 'SUM(aum) at the latest month in the selection', desc: 'All-manager AUM at the grain. Point-in-time: summed at the latest month, never across months.' }),
  exM('aumT', 'Client AUM', 'AUM', { agg: 'last', fn: r => r.aumT, fmt: '$', metric: 'client_aum', sql: 'aum_tenant', def: 'SUM(aum_tenant) at the latest month in the selection', desc: 'AUM in your own products. Point-in-time.' }),
  exM('oppAum', 'Opportunity AUM', 'Opportunity', { agg: 'last', fn: r => r.aum - r.aumT, fmt: '$', metric: 'opportunity_aum', sql: 'aum - aum_tenant', def: 'SUM(aum − aum_tenant) at the latest month', desc: 'Competitor-held AUM you could win.' }),
  exM('oppGs', 'Opportunity Gross Sales', 'Opportunity', { agg: 'sum', fn: r => r.gs - r.gsT, fmt: '$', metric: 'opportunity_gross_sales', sql: 'gross_sales - gross_sales_tenant', def: 'SUM(gross_sales − gross_sales_tenant)' }),
  exM('oppRd', 'Opportunity Redemptions', 'Opportunity', { agg: 'sum', fn: r => r.rd - r.rdT, fmt: '$', metric: 'opportunity_redemptions', sql: 'redemptions - redemptions_tenant', def: 'SUM(redemptions − redemptions_tenant)' }),
  exM('oppNf', 'Opportunity Net Flow', 'Opportunity', { agg: 'sum', fn: r => (r.gs - r.rd) - (r.gsT - r.rdT), fmt: '$', metric: 'opportunity_net_flow', sql: 'net_flow - net_flow_tenant', def: 'SUM(net_flow − net_flow_tenant)' }),
  exM('gs', 'Market Gross Sales', 'Sales & Flows', { agg: 'sum', fn: r => r.gs, fmt: '$', metric: 'market_gross_sales', sql: 'gross_sales', def: 'SUM(gross_sales)' }),
  exM('gsT', 'Client Gross Sales', 'Sales & Flows', { agg: 'sum', fn: r => r.gsT, fmt: '$', metric: 'client_gross_sales', sql: 'gross_sales_tenant', def: 'SUM(gross_sales_tenant)' }),
  exM('rd', 'Market Redemptions', 'Sales & Flows', { agg: 'sum', fn: r => r.rd, fmt: '$', metric: 'market_redemptions', sql: 'redemptions', def: 'SUM(redemptions)' }),
  exM('rdT', 'Client Redemptions', 'Sales & Flows', { agg: 'sum', fn: r => r.rdT, fmt: '$', metric: 'client_redemptions', sql: 'redemptions_tenant', def: 'SUM(redemptions_tenant)' }),
  exM('nf', 'Market Net Flow', 'Sales & Flows', { agg: 'sum', fn: r => r.gs - r.rd, fmt: '$', metric: 'market_net_flow', sql: 'net_flow', def: 'SUM(net_flow)' }),
  exM('nfT', 'Client Net Flow', 'Sales & Flows', { agg: 'sum', fn: r => r.gsT - r.rdT, fmt: '$', metric: 'client_net_flow', sql: 'net_flow_tenant', def: 'SUM(net_flow_tenant)' }),
  exM('msAum', 'Market Share · AUM', 'Market Share', { agg: 'ratio', num: 'aumT', den: 'aum', fmt: '%', metric: 'market_share_aum', def: 'Client AUM ÷ Market AUM, recomputed at every rollup', desc: 'Ratio metric. Never summed or averaged across rows.' }),
  exM('msGs', 'Market Share · Sales', 'Market Share', { agg: 'ratio', num: 'gsT', den: 'gs', fmt: '%', metric: 'market_share_sales', def: 'Client Gross Sales ÷ Market Gross Sales' }),
  exM('msRd', 'Market Share · Redemptions', 'Market Share', { agg: 'ratio', num: 'rdT', den: 'rd', fmt: '%', metric: 'market_share_redemptions', def: 'Client Redemptions ÷ Market Redemptions' }),
  exM('rating', 'Rating Matchup', 'Competitive', { agg: 'wavg', fn: r => r.rm, fmt: 'd1s', metric: 'comp_rating_matchup', sql: 'comp_rating_matchup', def: 'Gross-sales-weighted AVG(comp_rating_matchup)', desc: 'Your star rating minus what was sold. Positive favours you.' }),
  exM('fee', 'Fee Matchup', 'Competitive', { agg: 'wavg', fn: r => r.fm, fmt: 'pct2', metric: 'comp_fee_matchup', sql: 'comp_fee_matchup', def: 'Gross-sales-weighted AVG(comp_fee_matchup)', desc: 'Expense ratio sold minus yours. Positive means you are cheaper.' }),
  exM('perf3', '3Y Performance Matchup', 'Competitive', { agg: 'wavg', fn: r => r.pm, fmt: 'pp', metric: 'comp_performance_matchup_3yr', sql: 'comp_performance_matchup_3yr', def: 'Gross-sales-weighted AVG(comp_performance_matchup_3yr)' }),
  exM('cap', 'Capturable Opportunity', 'Competitive', { agg: 'sum', fn: r => r.cap, fmt: '$', metric: 'comp_advantage_opportunity', sql: 'comp_advantage_opportunity_total * comp_advantage_fa_proportion', def: 'SUM(sales where rating AND fee matchup favour you) × FA proportion' }),
  exM('records', 'Records', 'Provenance', { agg: 'count', fmt: 'n', metric: 'record_count', def: 'COUNT(*)' }),
  exM('advisors', 'Advisors', 'Provenance', { agg: 'countd', fmt: 'n', metric: 'advisor_count', def: 'COUNT(DISTINCT fa_crd)' }),
  exM('avgTier', 'Avg Confidence Tier', 'Provenance', { agg: 'faAvg', fn: f => f.tier, fmt: 'd1', metric: 'avg_confidence_tier', def: 'AVG(overall_confidence_tier) across distinct FAs' }),
  exM('meet', 'Meetings', 'CRM & Activity', { level: 2, grain: 'fa', agg: 'faMonth', k: 'meet', fmt: 'n', metric: 'crm_meetings', def: 'COUNT(activities WHERE type = Meeting)' }),
  exM('call', 'Calls', 'CRM & Activity', { level: 2, grain: 'fa', agg: 'faMonth', k: 'call', fmt: 'n', metric: 'crm_calls', def: 'COUNT(activities WHERE type = Call)' }),
  exM('email', 'Emails', 'CRM & Activity', { level: 2, grain: 'fa', agg: 'faMonth', k: 'email', fmt: 'n', metric: 'crm_emails', def: 'COUNT(activities WHERE type = Email)' }),
  exM('event', 'Event Attendance', 'CRM & Activity', { level: 2, grain: 'fa', agg: 'faMonth', k: 'event', fmt: 'n', metric: 'event_attendance', def: 'COUNT(event registrations attended)' }),
  exM('camp', 'Campaign Touches', 'CRM & Activity', { level: 2, grain: 'fa', agg: 'faMonth', k: 'camp', fmt: 'n', metric: 'campaign_touches', def: 'COUNT(campaign sends + responses)' }),
  exM('lastMeet', 'Days Since Last Meeting', 'CRM & Activity', { level: 2, grain: 'fa', agg: 'faMin', fn: f => f.lastMeet, fmt: 'days', metric: 'days_since_last_meeting', def: 'MIN(days since last logged meeting) across FAs' }),
  exM('coverRate', 'Coverage Rate', 'CRM & Activity', { level: 2, grain: 'fa', agg: 'faAvg', fn: f => (f.covered ? 1 : 0), fmt: '%', metric: 'coverage_rate', def: 'Share of distinct FAs with coverage status = Covered' }),
  exM('top3', 'Top 3 Signals', 'Signals', { level: 1, grain: 'fa', agg: 'top3', fmt: 'sig', metric: 'top_signals', def: 'Three highest-confidence open signals across FAs in the cell (FA_SIGNALS, ranked by confidence)' }),
  exM('sigCount', 'Open Signals', 'Signals', { level: 1, grain: 'fa', agg: 'sig', k: 'count', fmt: 'n', metric: 'signal_count', def: 'COUNT(DISTINCT signal_id)' }),
  exM('sigHi', 'High-Confidence Signals', 'Signals', { level: 3, grain: 'fa', agg: 'sig', k: 'hi', fmt: 'n', metric: 'signal_count_high', def: 'COUNT(signals WHERE confidence ≥ 75)' }),
  exM('sigConf', 'Avg Signal Confidence', 'Signals', { level: 3, grain: 'fa', agg: 'sig', k: 'conf', fmt: 'd0', metric: 'avg_signal_confidence', def: 'AVG(signal confidence)' }),
  exM('sigOpp', 'Signal Opportunity', 'Signals', { level: 1, grain: 'fa', agg: 'sig', k: 'opp', fmt: '$', metric: 'signal_opportunity', def: 'SUM(signal expected opportunity)' }),
];

const EX_GROUP_ORDER = ['Advisor', 'Firm', 'Geo & Territory', 'Time', 'Product', 'Provenance', 'CRM & Activity', 'Signals', 'AUM', 'Opportunity', 'Sales & Flows', 'Market Share', 'Competitive', 'Calculated'];

const EX_PRESETS = [
  { id: 'p-firm', name: 'Market share by firm', cfg: { rows: ['channel', 'firm'], cols: ['vehicle'], values: ['aumT', 'msAum'], filters: {}, calc: [] } },
  { id: 'p-fa', name: 'FA opportunity + signals', cfg: { rows: ['fa'], cols: [], values: ['oppAum', 'gsT', 'msGs', 'top3', 'sigOpp'], filters: { segment: ['Segment A'] }, sort: { col: 'oppAum|', dir: -1 }, calc: [] } },
  { id: 'p-comp', name: 'Competitive advantage', cfg: { rows: ['ac', 'cat'], cols: [], values: ['rating', 'fee', 'perf3', 'cap'], filters: {}, calc: [] } },
  { id: 'p-cov', name: 'Coverage vs opportunity', cfg: { rows: ['wholesaler', 'firm'], cols: [], values: ['oppAum', 'meet', 'lastMeet', 'coverRate', 'sigHi'], filters: {}, calc: [] } },
  { id: 'p-prov', name: 'Data provenance', cfg: { rows: ['pack', 'faDeriv'], cols: ['tier'], values: ['advisors'], filters: {}, calc: [] } },
  { id: 'p-trend', name: 'Monthly flows', cfg: { rows: ['firm'], cols: ['month'], values: ['nfT'], filters: {}, calc: [] } },
];

Object.assign(window, { EX_MONTHS, EX_MONTH_ISO, EX_DATA, EX_DIMS, EX_MEASURES, EX_GROUP_ORDER, EX_PRESETS, EX_SIG_TYPES });
