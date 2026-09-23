/* Shared dataset for the Level 2 (Sales & CRM) and Level 3 (Segmentation &
   Predictive) dashboards.

   Both levels are wholesaler-scoped: one external wholesaler's territory
   (Northeast), not the country. Level 1 measures (opportunity AUM / inflows /
   net flows from the unified data packs) plus the Level 1 competitive-advantage
   grade ride on every row; Level 2 adds actual sales, CRM activity and FA/Team
   characteristics; Level 3 adds segment, confidence-scored signals and the
   next best action. */

const LV_TERRITORY = 'Northeast';
const LV_WHOLESALER = 'Morgan Vance';

// [lat, lon, state, MSA, representative ZIP]
const LV_CITY_META = {
  'New York':     [40.71, -74.01, 'NY', 'New York–Newark–Jersey City', '10004'],
  'Boston':       [42.36, -71.06, 'MA', 'Boston–Cambridge–Newton',     '02110'],
  'Philadelphia': [39.95, -75.17, 'PA', 'Philadelphia–Camden–Wilm.',   '19103'],
  'Greenwich':    [41.03, -73.63, 'CT', 'Bridgeport–Stamford–Norwalk', '06830'],
  'Stamford':     [41.05, -73.54, 'CT', 'Bridgeport–Stamford–Norwalk', '06901'],
  'Hartford':     [41.76, -72.69, 'CT', 'Hartford–East Hartford',      '06103'],
  'Princeton':    [40.35, -74.66, 'NJ', 'Trenton–Princeton',           '08540'],
  'Morristown':   [40.80, -74.48, 'NJ', 'New York–Newark–Jersey City', '07960'],
  'Providence':   [41.82, -71.41, 'RI', 'Providence–Warwick',          '02903'],
  'White Plains': [41.03, -73.76, 'NY', 'New York–Newark–Jersey City', '10601'],
  'Albany':       [42.65, -73.76, 'NY', 'Albany–Schenectady–Troy',     '12207'],
  'Buffalo':      [42.89, -78.88, 'NY', 'Buffalo–Cheektowaga',         '14202'],
  'Pittsburgh':   [40.44, -79.996,'PA', 'Pittsburgh',                  '15222'],
  'Portland':     [43.66, -70.26, 'ME', 'Portland–South Portland',     '04101'],
  'Newark':       [40.74, -74.17, 'NJ', 'New York–Newark–Jersey City', '07102'],
  'Red Bank':     [40.35, -74.06, 'NJ', 'New York–Newark–Jersey City', '07701'],
  'Short Hills':  [40.74, -74.32, 'NJ', 'New York–Newark–Jersey City', '07078'],
  'Melville':     [40.79, -73.41, 'NY', 'New York–Newark–Jersey City', '11747'],
  'Rochester':    [43.16, -77.61, 'NY', 'Rochester',                   '14604'],
  'Syracuse':     [43.05, -76.15, 'NY', 'Syracuse',                    '13202'],
  'New Haven':    [41.31, -72.93, 'CT', 'New Haven–Milford',           '06510'],
  'Wellesley':    [42.30, -71.29, 'MA', 'Boston–Cambridge–Newton',     '02481'],
  'Worcester':    [42.26, -71.80, 'MA', 'Worcester',                   '01608'],
  'Springfield':  [42.10, -72.59, 'MA', 'Springfield',                 '01103'],
  'Portsmouth':   [43.07, -70.76, 'NH', 'Portsmouth',                  '03801'],
  'Manchester':   [42.99, -71.46, 'NH', 'Manchester–Nashua',           '03101'],
  'Burlington':   [44.48, -73.21, 'VT', 'Burlington–South Burlington', '05401'],
  'Allentown':    [40.60, -75.47, 'PA', 'Allentown–Bethlehem',         '18101'],
  'Wilmington':   [39.74, -75.55, 'DE', 'Philadelphia–Camden–Wilm.',   '19801'],
  'Baltimore':    [39.29, -76.61, 'MD', 'Baltimore–Columbia–Towson',   '21202'],
};
const LV_CITIES = Object.entries(LV_CITY_META).reduce((a, [c, m]) => (a[c] = [m[0], m[1]], a), {});

/* ---- characteristic vocabularies (each one is a filter dimension) ---- */

const LV_PROD_CATS  = ['Producer', 'Dabbler', 'Prospect'];
// Five working bands plus a $0 bucket for prospects, which the tiles omit.
const LV_PROD_BANDS = ['$0', '>$0–$100k', '>$100k–$500k', '>$500k–$2M', '>$2M–$10M', '>$10M'];
const LV_PROD_BAND_COLORS = {
  '$0': 'rgb(107,114,128)',
  '>$0–$100k': 'rgb(148,163,184)',
  '>$100k–$500k': 'rgb(251,191,36)',
  '>$500k–$2M': 'rgb(56,189,248)',
  '>$2M–$10M': 'rgb(96,165,250)',
  '>$10M': 'rgb(52,211,153)',
};
const LV_VEHICLES   = ['Mutual Funds', 'ETFs', 'SMAs', 'Privates'];
const LV_DISCRETION = ['Discretionary', 'Home office models', 'Outsourced (3rd party)'];
const LV_PROD_COUNT_BANDS = ['0', '1', '2', '3', '4', '5+'];
const LV_COMP_ADV = [
  { key: 'Strong',   color: 'rgb(52,211,153)' },
  { key: 'Moderate', color: 'rgb(250,204,21)' },
  { key: 'Low',      color: 'rgb(248,113,113)' },
];
const LV_ADV_COLOR = LV_COMP_ADV.reduce((a, x) => (a[x.key] = x.color, a), {});
const LV_ROLES = [
  { key: 'ext',  label: 'External',   short: 'Ext',  color: 'rgb(52,211,153)' },
  { key: 'int',  label: 'Internal',   short: 'Int',  color: 'rgb(96,165,250)' },
  { key: 'spec', label: 'Specialist', short: 'Spec', color: 'rgb(167,139,250)' },
];
const LV_ACT_TYPES  = ['Meeting', 'Call', 'Email', 'Event', 'Virtual'];
const LV_ENGAGEMENT = [
  { key: 'email',      label: 'Email open',    icon: 'envelope-open-text', color: 'rgb(96,165,250)' },
  { key: 'web',        label: 'Website visit', icon: 'globe',              color: 'rgb(52,211,153)' },
  { key: 'social',     label: 'Social',        icon: 'share-nodes',        color: 'rgb(167,139,250)' },
  { key: 'conference', label: 'Conference',    icon: 'people-group',       color: 'rgb(251,191,36)' },
  { key: 'webinar',    label: 'Webinar',       icon: 'video',              color: 'rgb(244,114,182)' },
];
const LV_ENG_META = LV_ENGAGEMENT.reduce((a, e) => (a[e.key] = e, a), {});

/* Segments rank the size of the opportunity sitting in the territory — opp
   size, product availability, platform fit and book characteristics. They say
   nothing about likelihood; the signals and confidence scores do that. */
const LV_SEGMENTS = ['A', 'B', 'C'];
const LV_SEG_META = {
  A: { label: 'A', short: 'A', dot: 'rgb(52,211,153)',  fill: 'rgba(52,211,153,0.55)',  desc: 'Largest addressable opportunity in the territory on opp size, product availability and platform fit.' },
  B: { label: 'B', short: 'B', dot: 'rgb(96,165,250)',  fill: 'rgba(96,165,250,0.55)',  desc: 'Meaningful but smaller addressable opportunity, or narrower product availability.' },
  C: { label: 'C', short: 'C', dot: 'rgb(148,163,184)', fill: 'rgba(148,163,184,0.50)', desc: 'Limited addressable opportunity on current product and platform coverage.' },
};

/* ---- Level 3 signal taxonomy ---- */

const LV_PRODUCTS = ['Core Equity ETF', 'Muni Ladder SMA', 'Private Credit Fund'];

const LV_SIG_TYPES = [
  'Performance Advantage',
  'Fee Advantage',
  'Focus: Core Equity ETF',
  'Focus: Muni Ladder SMA',
  'Focus: Private Credit Fund',
  'Upsell',
  'Cross-sell',
  'Fallen Angel',
  'Retention Risk',
  'Meeting Opportunity',
];

const LV_SIG_META = {
  'Performance Advantage':      { short: 'Perf',      icon: 'chart-line',          color: 'rgb(52,211,153)',  group: 'Advantage' },
  'Fee Advantage':              { short: 'Fee',       icon: 'tag',                 color: 'rgb(45,212,191)',  group: 'Advantage' },
  'Focus: Core Equity ETF':     { short: 'Eq ETF',    icon: 'chart-pie',           color: 'rgb(96,165,250)',  group: 'Focus product' },
  'Focus: Muni Ladder SMA':     { short: 'Muni SMA',  icon: 'building-columns',    color: 'rgb(56,189,248)',  group: 'Focus product' },
  'Focus: Private Credit Fund': { short: 'Priv Cr',   icon: 'hand-holding-dollar', color: 'rgb(129,140,248)', group: 'Focus product' },
  'Upsell':                     { short: 'Upsell',    icon: 'arrow-up-right-dots', color: 'rgb(251,191,36)',  group: 'Growth' },
  'Cross-sell':                 { short: 'Cross',     icon: 'shuffle',             color: 'rgb(249,115,22)',  group: 'Growth' },
  'Fallen Angel':               { short: 'Fallen',    icon: 'arrow-trend-down',    color: 'rgb(244,114,182)', group: 'Recovery' },
  'Retention Risk':             { short: 'Retention', icon: 'shield-halved',       color: 'rgb(248,113,113)', group: 'Recovery' },
  'Meeting Opportunity':        { short: 'Meeting',   icon: 'calendar-check',      color: 'rgb(167,139,250)', group: 'Coverage' },
};

const LV_SIG_CALC = {
  'Performance Advantage':      'Your holdings outperform the competing position the FA/Team currently holds in the same category, net of fees, over the trailing 3 years. Sized on the competing AUM that could reasonably rotate.',
  'Fee Advantage':              'Your share class prices below the competing position held in the same category by 3bps or more, with no offsetting performance gap. Sized on the competing AUM in that category.',
  'Focus: Core Equity ETF':     'Holdings fit, recent category rotation and platform availability score the FA/Team as a buyer of the focus ETF. Confidence from the Level 3 ML model, trained on your closed-loop Level 2 sales.',
  'Focus: Muni Ladder SMA':     'High-bracket client base, existing SMA usage and taxable fixed income exposure score the FA/Team as a buyer of the focus muni SMA.',
  'Focus: Private Credit Fund': 'QP/AI-classified client base with under 5% private allocation and existing interval or alt exposure. Scored on platform availability and prior alt adoption.',
  'Upsell':                     'Already a producer in this category with rising share of wallet and headroom against the peer-median allocation. Market basket model sizes the incremental ticket.',
  'Cross-sell':                 'Buys you in one category and buys a competitor in an adjacent one where you also compete. Market basket model ranks the adjacent product most likely to follow.',
  'Fallen Angel':               'Produced meaningfully in the last 24 months, then went quiet. Trailing 12 production has dropped more than 60% against the prior 12 with no redemption event.',
  'Retention Risk':             'Net redemptions in two of the last three months, or a competitor repricing inside a model sleeve they hold. Sized on the AUM exposed rather than the upside.',
  'Meeting Opportunity':        'A scheduled or high-likelihood touch inside 30 days — conference attendance, webinar registration, or an inbound request — paired with an open signal worth leading with.',
};

/* ---- product catalogue (placeholder names) ---- */

const LV_CATALOG = [
  { name: 'Field Core Equity Fund',        vehicle: 'Mutual Funds', cat: 'Large Blend' },
  { name: 'Field Strategic Income Fund',   vehicle: 'Mutual Funds', cat: 'Int. Core-Plus' },
  { name: 'Field Global Opportunity Fund', vehicle: 'Mutual Funds', cat: 'Foreign Large' },
  { name: 'Field Core Equity ETF',         vehicle: 'ETFs',         cat: 'Large Blend' },
  { name: 'Field Short Duration ETF',      vehicle: 'ETFs',         cat: 'Short Term Bond' },
  { name: 'Field Muni Ladder SMA',         vehicle: 'SMAs',         cat: 'Muni National' },
  { name: 'Field Tax-Managed Equity SMA',  vehicle: 'SMAs',         cat: 'Large Blend' },
  { name: 'Field Private Credit Fund II',  vehicle: 'Privates',     cat: 'Private Credit' },
  { name: 'Field Real Assets Fund',        vehicle: 'Privates',     cat: 'Real Assets' },
];

/* The product categories the asset manager competes in. Market opportunity is
   only meaningful inside these — the packs cover the whole market, but the
   wholesaler can only sell where there is a product. */
const LV_PROD_CATEGORIES = [...new Set(LV_CATALOG.map(p => p.cat))];
const LV_CAT_OF_PRODUCT = LV_CATALOG.reduce((a, p) => (a[p.name] = p.cat, a), {});

/* ---- deterministic generation ------------------------------------------ */

function lvRng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}
const lvPick = (r, arr) => arr[Math.floor(r() * arr.length)];

// [name, type, firm, channel, city, book AUM $M, quality 0..1]
const LV_RAW = [
  ['The Doe Wealth Group',      'Team', 'Contoso Wealth',       'Wirehouse', 'New York',     840, 0.95],
  ['Alpine Partners',           'Team', 'Northwind Securities', 'BA',        'Boston',       612, 0.91],
  ['Keystone Wealth',           'Team', 'Fabrikam Financial',   'RIA',       'Philadelphia', 505, 0.88],
  ['The Smith Group',           'Team', 'Adatum Partners',      'Wirehouse', 'Boston',       470, 0.84],
  ['Harbor Point Advisors',     'Team', 'Litware Advisors',     'RIA',       'Greenwich',    455, 0.86],
  ['Summit Advisory',           'Team', 'Tailspin Capital',     'IBD',       'Stamford',     398, 0.78],
  ['Doe & Roe Advisors',        'Team', 'Proseware Group',      'IBD',       'Hartford',     341, 0.72],
  ['The Brown Group',           'Team', 'Contoso Wealth',       'Wirehouse', 'New York',     330, 0.80],
  ['Sample Consulting',         'Team', 'Wingtip RIA',          'RIA',       'Princeton',    312, 0.75],
  ['Northgate Capital Group',   'Team', 'Northwind Securities', 'BA',        'Morristown',   288, 0.70],
  ['The Smith Group II',        'Team', 'Adatum Partners',      'Wirehouse', 'White Plains', 265, 0.66],
  ['Blue Line Wealth',          'Team', 'Trey Trust',           'RIA',       'Providence',   248, 0.69],
  ['Charter Oak Advisors',      'Team', 'Litware Advisors',     'RIA',       'Hartford',     232, 0.63],
  ['Meridian Family Office',    'Team', 'Wingtip RIA',          'RIA',       'New York',     226, 0.82],
  ['Jane Smith',                'FA',   'Contoso Wealth',       'Wirehouse', 'New York',     198, 0.77],
  ['Robert Jones',              'FA',   'Fabrikam Financial',   'IBD',       'Philadelphia', 184, 0.58],
  ['Mary Roe',                  'FA',   'Tailspin Capital',     'IBD',       'Albany',       171, 0.52],
  ['Granite Ridge Partners',    'Team', 'Proseware Group',      'BA',        'Pittsburgh',   166, 0.61],
  ['John Doe',                  'FA',   'Adatum Partners',      'Wirehouse', 'Boston',       158, 0.65],
  ['Linda Public',              'FA',   'Northwind Securities', 'BA',        'Buffalo',      144, 0.44],
  ['Bay State Wealth',          'Team', 'Trey Trust',           'RIA',       'Boston',       139, 0.59],
  ['Mark Jones',                'FA',   'Litware Advisors',     'RIA',       'Portland',     126, 0.48],
  ['Emily Doe',                 'FA',   'Contoso Wealth',       'Wirehouse', 'Stamford',     118, 0.56],
  ['Liberty Bell Advisors',     'Team', 'Wingtip RIA',          'RIA',       'Philadelphia', 112, 0.51],
  ['Chris Brown',               'FA',   'Proseware Group',      'IBD',       'Princeton',    104, 0.40],
  ['Pat Smith',                 'FA',   'Fabrikam Financial',   'IBD',       'Providence',    96, 0.37],
  ['Sarah Public',              'FA',   'Tailspin Capital',     'IBD',       'Albany',        88, 0.33],
  ['Empire State Wealth',       'Team', 'Northwind Securities', 'BA',        'New York',      82, 0.46],
  ['Alex Roe',                  'FA',   'Trey Trust',           'RIA',       'White Plains',  74, 0.29],
  ['Sam Jones',                 'FA',   'Adatum Partners',      'Wirehouse', 'Buffalo',       61, 0.25],
];

const LV_FIRST = ['Jane','John','Mary','Robert','Linda','Mark','Emily','Chris','Pat','Sarah','Alex','Sam','Dana','Morgan'];
const LV_LAST  = ['Doe','Roe','Smith','Jones','Brown','Public','Sample'];

function lvBand(k) {
  if (k <= 0) return LV_PROD_BANDS[0];
  if (k <= 100) return LV_PROD_BANDS[1];
  if (k <= 500) return LV_PROD_BANDS[2];
  if (k <= 2000) return LV_PROD_BANDS[3];
  if (k <= 10000) return LV_PROD_BANDS[4];
  return LV_PROD_BANDS[5];
}
function lvCountBand(n) {
  if (!n) return '0';
  if (n >= 5) return '5+';
  return String(n);
}

const LV_OFFICE_SUFFIX = ['Park Ave', 'Seaport', 'Center City', 'Uptown', 'Midtown', 'Financial District', 'Harbor', 'Riverside', 'Main St', 'Commerce Sq'];
const LV_TEAM_WORDS = ['Cedar', 'Granite', 'Beacon', 'Sterling', 'Compass', 'Hawthorn', 'Bridgeway', 'Ironwood', 'Lakeshore', 'Redstone', 'Westport', 'Arbor', 'Pinnacle', 'Fairmount', 'Clearview', 'Oakfield', 'Stonegate', 'Brookline', 'Waverly', 'Halstead'];
const LV_TEAM_TAIL = ['Wealth Partners', 'Advisors', 'Capital Group', 'Wealth Management', 'Financial Group', 'Private Wealth'];
const LV_ALL_FIRMS = ['Contoso Wealth', 'Northwind Securities', 'Fabrikam Financial', 'Adatum Partners', 'Litware Advisors', 'Tailspin Capital', 'Proseware Group', 'Wingtip RIA', 'Trey Trust'];
const LV_ALL_CHANNELS = ['Wirehouse', 'BA', 'IBD', 'RIA'];

/* The named book above is the top of the territory. A wholesaler actually
   covers thousands of FA/Teams; the tail below keeps the sample light while
   still populating the production bands, the segmentation and the long thin
   end of the opportunity curve. Totals on every tile are the sum of the rows
   on screen — nothing is grossed up. */
const LV_BOOK = (() => {
  const out = LV_RAW.slice();
  const cityKeys = Object.keys(LV_CITY_META);
  const seen = new Set(out.map(x => x[0]));
  const r = lvRng(55501);
  let i = 0;
  while (out.length < 120) {
    i += 1;
    const isTeam = r() < 0.38;
    let name = isTeam
      ? `${lvPick(r, LV_TEAM_WORDS)} ${lvPick(r, LV_TEAM_TAIL)}`
      : `${lvPick(r, LV_FIRST)} ${lvPick(r, LV_LAST)}`;
    if (seen.has(name)) continue;
    seen.add(name);
    const aum = Math.round(6 + Math.pow(r(), 1.7) * 68);
    const q = Math.round((0.04 + Math.pow(r(), 1.25) * 0.46) * 100) / 100;
    out.push([name, isTeam ? 'Team' : 'FA', lvPick(r, LV_ALL_FIRMS), lvPick(r, LV_ALL_CHANNELS), lvPick(r, cityKeys), aum, q]);
  }
  return out;
})();

// Territory scale, set from the numbers a real Northeast book runs at:
// ~$15B of addressable annual sales opportunity, ~2% of it won, which is
// $300M+ of actual production over a rolling 12.
const LV_TERR_OPP_SALES = 15000;   // $M
const LV_AUM_TOTAL = LV_BOOK.reduce((a, x) => a + x[5], 0);

const LV_ROWS = LV_BOOK.map(([name, type, firm, channel, city, rawAum, q], i) => {
  const r = lvRng(9173 + i * 977);
  const meta = LV_CITY_META[city] || [40.7, -74, 'NY', 'Other', '00000'];
  const w = rawAum / LV_AUM_TOTAL;
  // Book AUM the FA/Team controls. A top wirehouse team runs billions; the
  // long tail runs tens of millions.
  const aum = rawAum * 5;

  // ---- Level 1: market opportunity from the unified data packs. Annual sales
  // opportunity is the territory number the wholesaler is measured on; the AUM
  // opportunity is the book sitting in the categories you compete in.
  const oppIn  = Math.round(LV_TERR_OPP_SALES * w * (0.75 + r() * 0.5) * 10) / 10;
  const oppAum = Math.round(aum * (0.82 + r() * 0.34));
  const oppNet = Math.round(oppIn * (0.30 + r() * 0.40) * 10) / 10;

  // ---- Production tier drives everything you own with them. A prospect does
  // no business with you, so Yours is zero across all three measures.
  const dormant = r() < 0.16;
  const tier = q < 0.42 ? (r() < 0.82 ? 'Prospect' : 'Dabbler')
             : q < 0.62 ? 'Dabbler'
             : dormant  ? 'Dabbler' : 'Producer';

  // Share of the opportunity you hold. Territory-wide this lands near 2%, but
  // the spread inside that average is wide — a handful of producers carry most
  // of the book while dabblers buy a token amount.
  const shareIn = tier === 'Prospect' ? 0
    : tier === 'Dabbler' ? 0.001 + Math.pow(r(), 2.2) * 0.005
    : 0.010 + Math.pow(q, 1.8) * 0.030 * (0.45 + r() * 1.20);
  const yoursIn  = Math.round(oppIn * shareIn * 100) / 100;
  // AUM you hold builds up from years of those sales, so it is a multiple of
  // a single year's flow rather than the same share of a different base.
  const yoursAum = Math.round(yoursIn * (2.6 + r() * 2.4) * 10) / 10;
  const yoursNet = tier === 'Prospect' ? 0
    : Math.round(yoursIn * (r() < 0.24 ? -(0.2 + r() * 0.6) : (0.2 + r() * 0.7)) * 100) / 100;

  // ---- Level 2: actual sales. These sit right on top of the pack-reported
  // figure and run slightly ahead of it — SMA and private sales are thinly
  // covered in the packs, and your nightly feed is simply more current.
  const gap = r();
  const gapKind = gap < 0.30 ? 'uncovered' : gap < 0.55 ? 'timing' : 'aligned';
  const gapMult = gapKind === 'uncovered' ? 1.10 + r() * 0.30
                : gapKind === 'timing'    ? 1.02 + r() * 0.05
                : 0.99 + r() * 0.02;
  const r12ProdK = Math.round(yoursIn * 1000 * gapMult);
  const prior12K = dormant ? Math.round(r12ProdK / (0.14 + r() * 0.2))
                           : Math.round(r12ProdK * (0.62 + r() * 0.66));
  const sales = {
    MTD: Math.round(r12ProdK / 12 * (0.3 + r() * 1.7)),
    QTD: Math.round(r12ProdK / 4 * (0.45 + r() * 1.2)),
    YTD: Math.round(r12ProdK * (0.6 + r() * 0.3)),
    'Rolling 12': r12ProdK,
  };
  const prodCat  = r12ProdK === 0 ? 'Prospect' : r12ProdK < 400 ? 'Dabbler' : 'Producer';
  // Most FA/Teams that buy you at all buy one to three products.
  const products = r12ProdK === 0 ? 0
    : r() < 0.80 ? 1 + Math.floor(r() * 3)
    : 4 + Math.floor(r() * 3);

  // Activity: a wholesaler manages roughly 5–10 touches per FA/Team a year,
  // more on producers, fewer on prospects.
  const act = {};
  const lift = tier === 'Producer' ? 1.35 : tier === 'Dabbler' ? 0.9 : 0.5;
  // A share of prospects have had no touch at all in the window.
  const untouched = tier === 'Prospect' && r() < 0.32;
  [['ext', 3.2], ['int', 3.6], ['spec', 1.1]].forEach(([k, base]) => {
    const n = untouched ? 0 : Math.max(0, Math.round(base * lift * (0.45 + r() * 1.1)));
    const days = n === 0 ? null : Math.max(2, Math.round(4 + Math.pow(r(), 1.9) * 330));
    act[k] = { r12: n, days };
  });
  const actTotal = act.ext.r12 + act.int.r12 + act.spec.r12;

  const engagement = LV_ENGAGEMENT.filter(() => r() < 0.22 + q * 0.34).map(e => e.key);
  const focusRoles = LV_ROLES.filter(() => r() < (q > 0.7 ? 0.55 : 0.14)).map(x => x.key);
  const dm = type === 'FA' ? name : `${lvPick(r, LV_FIRST)} ${lvPick(r, LV_LAST)}`;

  // ---- Level 1 competitive-advantage grade (same vocabulary as Opportunity)
  const advScore = q * 0.7 + r() * 0.3;
  const compAdv = advScore > 0.6 ? 'Strong' : advScore > 0.36 ? 'Moderate' : 'Low';

  // ---- Competitive advantage, split the way the Level 1 dashboard splits it:
  // performance advantage plus fee advantage. Both are expressed as the slice
  // of the market opportunity the advantage actually opens up.
  const perfShare = advScore * (0.10 + r() * 0.16);
  const feeShare  = advScore * (0.05 + r() * 0.10);

  // ---- Category mix. Each FA/Team's opportunity sits in a handful of the
  // categories the asset manager runs product in, not spread evenly.
  const catMix = (() => {
    const n = 2 + Math.floor(r() * 3);
    const picks = LV_PROD_CATEGORIES.slice().sort(() => r() - 0.5).slice(0, n);
    const w = picks.map(() => 0.35 + r());
    const tot = w.reduce((a, x) => a + x, 0);
    return picks.map((c, i) => ({ cat: c, w: w[i] / tot }));
  })();

  // ---- Level 3: segmentation on the size of the addressable opportunity
  const availability = 0.45 + r() * 0.55;
  const addressable  = (oppIn - yoursIn) * availability;

  const row = {
    id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + i,
    name, type, firm, channel, city,
    office: `${city} – ${lvPick(r, LV_OFFICE_SUFFIX)}`,
    // Small deterministic offset so ZIP-grain bubbles inside one city spread
    // instead of stacking; coarser grains average back to the city centre.
    lat: Math.round((meta[0] + ((i % 7) - 3) * 0.055) * 10000) / 10000,
    lon: Math.round((meta[1] + ((i % 5) - 2) * 0.085) * 10000) / 10000,
    state: meta[2], msa: meta[3],
    zip: String(Number(meta[4]) + (i % 9) * 3).padStart(5, '0'),
    territory: LV_TERRITORY,
    aum, oppAum, yoursAum,
    shareAum: oppAum ? yoursAum / oppAum : 0,
    oppIn, yoursIn, shareIn: oppIn ? yoursIn / oppIn : 0,
    oppNet, yoursNet, shareNet: oppNet ? yoursNet / oppNet : 0,
    r12ProdK, prior12K, sales, gapKind,
    salesTrend: prior12K ? (r12ProdK - prior12K) / prior12K : 0,
    prodCat, prodBand: lvBand(r12ProdK), products, productBand: lvCountBand(products),
    vehiclePref: lvPick(r, LV_VEHICLES),
    discretion: lvPick(r, LV_DISCRETION),
    decisionMaker: dm,
    act, actTotal, engagement, focusRoles,
    compAdv, compAdvDot: LV_ADV_COLOR[compAdv],
    perfAdvAum: Math.round(oppAum * perfShare * 10) / 10,
    feeAdvAum:  Math.round(oppAum * feeShare * 10) / 10,
    perfAdvIn:  Math.round(oppIn * perfShare * 100) / 100,
    feeAdvIn:   Math.round(oppIn * feeShare * 100) / 100,
    perfAdvNet: Math.round(oppNet * perfShare * 100) / 100,
    feeAdvNet:  Math.round(oppNet * feeShare * 100) / 100,
    catMix,
    availability, addressable,
    dormant, q,
  };
  row.holdings = lvHoldings(row, lvRng(7717 + i * 401));
  row.signals = lvGenSignals(row, lvRng(4211 + i * 613))
    .sort((a, b) => b.confidence - a.confidence);
  row.signalOpp = row.signals.reduce((a, s) => a + s.oppMax, 0);
  row.signalOppMin = row.signals.reduce((a, s) => a + s.oppMin, 0);
  row.wtdConfidence = lvWtdConf(row.signals);
  row.nba = lvNextBest(row);
  return row;
});

/* Segment by rank of addressable opportunity within the territory — the top
   fifth are the largest opportunities the wholesaler has, not an absolute cut. */
(() => {
  // Producer turnover over the rolling window: some of today's prospects were
  // buying earlier in the year and lapsed, and some of today's producers only
  // started buying part-way through. The production trend walks these so the
  // producer count genuinely moves month to month.
  const r = lvRng(31337);
  LV_ROWS.forEach(row => {
    if (row.r12ProdK === 0 && r() < 0.24) {
      row.lapseM = Math.floor(r() * 10);
      row.lapsedK = Math.round(30 + Math.pow(r(), 1.6) * 900);
    } else if (row.r12ProdK > 0 && r() < 0.26) {
      row.winM = 1 + Math.floor(r() * 10);
    }
  });
})();
(() => {
  const ranked = LV_ROWS.slice().sort((a, b) => b.addressable - a.addressable);
  const n = ranked.length;
  ranked.forEach((r, i) => {
    const pct = i / n;
    r.segment = pct < 0.22 ? 'A' : pct < 0.55 ? 'B' : 'C';
    r.score = Math.round(99 - (i / Math.max(n - 1, 1)) * 72);
  });
})();

/* Asset-weighted confidence across a set of signals. */
function lvWtdConf(sigs) {
  const w = sigs.reduce((a, s) => a + s.oppMax, 0);
  if (!w) return 0;
  return Math.round(sigs.reduce((a, s) => a + s.confidence * s.oppMax, 0) / w);
}

/* Per-FA/Team holdings: actual AUM, five years of flows, and the activity
   attributed to each product. Most meetings cover the relationship rather
   than a named product, so only a portion of the book's activity carries a
   product tag — the rest stays unattributed at the FA/Team level. */

function lvHoldings(p, r) {
  if (!p.products) return [];
  const picks = LV_CATALOG.slice().sort(() => r() - 0.5).slice(0, p.products);
  const total = p.yoursAum || 0;
  const weights = picks.map(() => 0.3 + r());
  const wsum = weights.reduce((a, b) => a + b, 0);
  // Roughly half to three quarters of meetings are logged against a product.
  let budget = Math.round((p.actTotal || 0) * (0.45 + r() * 0.3));
  return picks.map((c, i) => {
    const aumM = Math.round(total * (weights[i] / wsum) * 100) / 100;
    const share = weights[i] / wsum;
    const acts = Math.min(budget, Math.round(budget * share * (0.6 + r() * 0.9)));
    budget -= acts;
    const inflow = [], redemption = [];
    for (let y = 0; y < 5; y++) {
      const gi = aumM * (0.10 + r() * 0.22) * (0.6 + y * 0.16);
      inflow.push(Math.round(gi * 100) / 100);
      redemption.push(Math.round(gi * (0.25 + r() * 0.65) * 100) / 100);
    }
    return {
      product: c.name, vehicle: c.vehicle, cat: c.cat, aumM, acts,
      inflow, redemption,
      net: inflow.map((v, y) => Math.round((v - redemption[y]) * 100) / 100),
    };
  });
}

/* ---- signal generation -------------------------------------------------- */

function lvSig(type, product, oppMin, oppMax, confidence, desc, when) {
  // Signals carry one expected-value figure, not a range: the model's
  // estimate sits between the low and high sizing, and every roll-up (NBA,
  // FA/Team, territory) sums that single number.
  const opp = Math.round(((oppMin + oppMax) / 2) * 10) / 10;
  // Only signals the models score at 50 or better are surfaced; raw scores are
  // mapped onto 50–99 so the relative ordering between signals is kept.
  confidence = Math.max(50, Math.min(99, Math.round(50 + (confidence - 20) * 49 / 79)));
  return {
    type, product, opp, oppMin: opp, oppMax: opp, confidence, desc, when,
    strength: confidence >= 72 ? 'high' : confidence >= 50 ? 'medium' : 'low',
  };
}

function lvGenSignals(p, r) {
  const s = [];
  const M = (x) => Math.max(0.2, Math.round(x * 10) / 10);
  // Signals are sized against the addressable SALES opportunity, not the AUM
  // base — a signal is a ticket you can win this year, not a book to displace.
  const head = Math.max(p.oppIn - p.yoursIn, 1.5);
  // One product per signal per FA/Team: a product never carries both a
  // performance and a fee case, or a focus score and an upsell, at once.
  const used = new Set();
  const held = (p.holdings || []).map(h => h.product.replace(/^Field /, ''));
  const catalog = LV_CATALOG.map(c => c.name.replace(/^Field /, ''));
  const take = (pool) => {
    const free = pool.filter(x => !used.has(x));
    if (!free.length) return null;
    const x = free[Math.floor(r() * free.length)];
    used.add(x);
    return x;
  };
  // Every score carries its own noise so two signals rarely land on the same
  // confidence or sizing.
  const J = (base, spread = 9) => Math.round(base + (r() - 0.5) * 2 * spread);

  if (p.q > 0.55 && r() < 0.62) {
    const amt = head * (0.010 + r() * 0.014);
    const prod = take(catalog);
    if (prod) s.push(lvSig('Performance Advantage', prod, M(amt * 0.6), M(amt),
      J(50 + p.q * 32),
      `Your position outperforms the competing hold by <strong>${(1.4 + r() * 3.1).toFixed(1)}%</strong> net of fees over 3 years across <strong>$${M(amt * 2.4)}M</strong> of competing AUM.`,
      'Monthly · data packs'));
  }
  if (r() < 0.38) {
    const amt = head * (0.006 + r() * 0.010);
    const prod = take(catalog);
    if (prod) s.push(lvSig('Fee Advantage', prod, M(amt * 0.55), M(amt),
      J(42 + p.q * 30),
      `Your share class prices <strong>${(3 + Math.round(r() * 9))}bps</strong> below the competing position in the same category, with no performance gap to offset it.`,
      'Monthly · data packs'));
  }
  LV_PRODUCTS.forEach((prod, pi) => {
    if (!used.has(prod) && r() < (pi === 0 ? 0.48 : pi === 1 ? 0.30 : 0.22)) {
      used.add(prod);
      const amt = head * (0.005 + r() * 0.020);
      const conf = Math.min(96, J(36 + p.q * 44 + r() * 10, 7));
      s.push(lvSig(`Focus: ${prod}`, prod, M(amt * 0.6), M(amt), conf,
        `Model scores this ${p.type === 'FA' ? 'advisor' : 'team'} at <strong>${conf}</strong> on ${prod}: holdings fit, category rotation over the last two quarters and platform availability all clear.`,
        'Weekly · ML model'));
    }
  });
  if (p.prodCat === 'Producer' && r() < 0.55) {
    const amt = Math.max(p.yoursIn, 0.6) * (0.12 + r() * 0.34);
    // Upsell is always on something the FA/Team already buys from you.
    const prod = take(held.length ? held : catalog);
    if (prod) s.push(lvSig('Upsell', prod, M(amt * 0.5), M(amt),
      J(54 + p.q * 26, 11),
      `Already producing in this category with share of wallet rising <strong>${(1.2 + r() * 4).toFixed(1)}pts</strong> and headroom of <strong>$${M(amt * 1.8)}M</strong> against the peer-median allocation.`,
      'Daily · your sales'));
  }
  if (p.products >= 2 && r() < 0.45) {
    const amt = Math.max(p.yoursIn, 0.6) * (0.08 + r() * 0.24);
    // Cross-sell is always something they do not yet hold.
    const prod = take(catalog.filter(x => !held.includes(x)));
    if (prod) s.push(lvSig('Cross-sell', prod, M(amt * 0.5), M(amt),
      J(44 + p.q * 30, 10),
      `Buys you in ${p.products} categor${p.products === 1 ? 'y' : 'ies'} and buys a competitor in an adjacent one. Market basket ranks <strong>${prod}</strong> as the most likely next purchase.`,
      'Weekly · ML model'));
  }
  if (p.dormant) {
    const amt = p.prior12K / 1000 * (0.5 + r() * 0.8);
    s.push(lvSig('Fallen Angel', null, M(amt * 0.5), M(amt),
      J(40 + r() * 25, 6),
      `Produced <strong>$${Math.round(p.prior12K)}k</strong> in the prior 12 months and <strong>$${Math.round(p.r12ProdK)}k</strong> in the trailing 12, with no redemption event on file. Relationship, not performance.`,
      'Daily · your sales'));
  }
  if (p.yoursNet < 0) {
    s.push(lvSig('Retention Risk', null, M(Math.abs(p.yoursNet) * 0.6), M(Math.abs(p.yoursNet) * 1.4),
      Math.round(30 + r() * 30),
      `Net redemptions in two of the last three months totalling <strong>$${M(Math.abs(p.yoursNet))}M</strong>. A competitor repriced inside a model sleeve they hold.`,
      'Monthly · data packs'));
  }
  const soonest = Math.min(...LV_ROLES.map(x => p.act[x.key].days || 999));
  if (p.engagement.includes('conference') || p.engagement.includes('webinar') || (soonest > 90 && p.q > 0.6)) {
    s.push(lvSig('Meeting Opportunity', null, M(head * 0.004), M(head * 0.011),
      J(48 + p.q * 30, 10),
      p.engagement.includes('conference')
        ? 'Registered for the regional advisor conference in 18 days and holds two open signals worth leading with.'
        : p.engagement.includes('webinar')
          ? 'Attended the focus-product webinar and opened the follow-up. Warm inside the next two weeks.'
          : `No touch from any role in <strong>${soonest} days</strong> against a segment-A opportunity. Overdue.`,
      'Daily · CRM'));
  }
  if (!s.length) {
    s.push(lvSig('Focus: Core Equity ETF', 'Core Equity ETF', M(head * 0.004), M(head * 0.009),
      Math.round(22 + r() * 18),
      'Thin signal set. Holdings fit is present but neither rotation nor engagement supports a near-term play.',
      'Weekly · ML model'));
  }
  // Break exact ties so the next best action is never a coin toss between two
  // identically scored signals.
  const seen = new Set();
  s.sort((x, y) => y.confidence - x.confidence).forEach(x => {
    while (seen.has(x.confidence) && x.confidence > 50) x.confidence -= 1;
    seen.add(x.confidence);
  });
  return s;
}

/* Next best action = the highest-confidence open signal. */
function lvNextBest(p) {
  const best = p.signals[0];
  const meta = LV_SIG_META[best.type];
  const verb = best.type === 'Retention Risk' ? 'Defend'
    : best.type === 'Fallen Angel' ? 'Re-open'
    : best.type === 'Meeting Opportunity' ? 'Meet'
    : best.type.startsWith('Focus') ? 'Introduce'
    : best.type === 'Cross-sell' ? 'Cross-sell'
    : best.type === 'Upsell' ? 'Expand'
    : 'Lead with';
  const obj = best.product || (best.type === 'Retention Risk' ? 'the exposed sleeve'
    : best.type === 'Fallen Angel' ? 'the dormant relationship'
    : best.type === 'Meeting Opportunity' ? 'in person' : 'the advantage case');
  return {
    verb, object: obj, signal: best.type, color: meta.color, icon: meta.icon,
    confidence: best.confidence, oppMin: best.oppMin, oppMax: best.oppMax,
    label: `${verb} ${obj}`,
  };
}

/* ---- helpers ------------------------------------------------------------ */

const lvFmtM = (m) => (Math.abs(m) >= 1000 ? `$${(m / 1000).toFixed(1)}B` : `$${Math.abs(m) >= 10 ? Math.round(m) : m.toFixed(1)}M`);
const lvFmtSigned = (m) => (m >= 0 ? '+' : '−') + lvFmtM(Math.abs(m));
const lvFmtK = (k) => (Math.abs(k) >= 1e6 ? `${(k / 1e6).toFixed(1)}B` : Math.abs(k) >= 1000 ? `${(k / 1000).toFixed(Math.abs(k) >= 10000 ? 0 : 1)}M` : `${Math.round(k)}k`);
const lvFmtPct = (x) => `${(x * 100).toFixed(1)}%`;
// Signed $k for net flows; plain for AUM and inflows.
const lvFmtKs = (k, measure) => (measure === 'Net Flows' ? (k >= 0 ? '+' : '−') + lvFmtK(Math.abs(k)) : lvFmtK(k));

/* Actual figures follow the same AUM / Inflows / Net Flows choice as the
   market opportunity, so Mkt opp, Yours and Actual always describe one
   measure. AUM is the book held today (point in time); inflows are the sales
   for the period; net flows apply each FA/Team's own redemption rate. $k. */
function lvActual(r, measure, pk) {
  const hs = r.holdings || [];
  if (measure === 'AUM') return Math.round(hs.reduce((a, h) => a + (h.aumM || 0), 0) * 1000);
  const inflow = r.sales[pk] || 0;
  if (measure === 'Net Flows') {
    const i = hs.reduce((a, h) => a + h.inflow[4], 0);
    const n = hs.reduce((a, h) => a + h.net[4], 0);
    return i ? Math.round(inflow * n / i) : 0;
  }
  return inflow;
}
const lvHoldActual = (h, measure) => (measure === 'AUM' ? h.aumM : measure === 'Net Flows' ? h.net[4] : h.inflow[4]) * 1000;
const lvActualLabel = (measure, pkShort) => (measure === 'AUM' ? 'Actual AUM' : measure === 'Net Flows' ? `${pkShort} actual net` : `${pkShort} actual`);
const lvDaysColor = (d) => (d == null ? 'rgb(107,114,128)' : d <= 30 ? 'rgb(52,211,153)' : d <= 90 ? 'rgb(251,191,36)' : 'rgb(248,113,113)');

const LV_MEASURES = {
  AUM:         { key: 'AUM',       opp: 'oppAum', yours: 'yoursAum', share: 'shareAum', perf: 'perfAdvAum', fee: 'feeAdvAum', fmt: lvFmtM },
  Inflows:     { key: 'Inflows',   opp: 'oppIn',  yours: 'yoursIn',  share: 'shareIn',  perf: 'perfAdvIn',  fee: 'feeAdvIn',  fmt: lvFmtM },
  'Net Flows': { key: 'Net Flows', opp: 'oppNet', yours: 'yoursNet', share: 'shareNet', perf: 'perfAdvNet', fee: 'feeAdvNet', fmt: lvFmtSigned },
};

/* Activity rolled up across whichever roles are switched on. */
function lvActivity(row, roles) {
  const scope = roles && roles.length ? roles : LV_ROLES.map(x => x.key);
  const r12 = scope.reduce((a, k) => a + row.act[k].r12, 0);
  const days = Math.min(...scope.map(k => (row.act[k].days == null ? Infinity : row.act[k].days)));
  return { r12, days: Number.isFinite(days) ? days : null };
}

Object.assign(window, {
  lvActual, lvHoldActual, lvActualLabel, lvFmtKs,
  LV_TERRITORY, LV_WHOLESALER, LV_CITIES, LV_CITY_META, LV_ROWS, LV_CATALOG, LV_BOOK,
  LV_PROD_CATS, LV_PROD_BANDS, LV_PROD_BAND_COLORS, LV_PROD_COUNT_BANDS, LV_VEHICLES, LV_DISCRETION,
  LV_COMP_ADV, LV_ADV_COLOR, LV_ROLES, LV_ACT_TYPES, LV_PROD_CATEGORIES, LV_CAT_OF_PRODUCT,
  LV_ENGAGEMENT, LV_ENG_META, LV_SEGMENTS, LV_SEG_META,
  LV_PRODUCTS, LV_SIG_TYPES, LV_SIG_META, LV_SIG_CALC, LV_MEASURES,
  lvFmtM, lvFmtSigned, lvFmtK, lvFmtPct, lvDaysColor, lvWtdConf, lvActivity,
});
