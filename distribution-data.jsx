/* Distribution Intelligence — data + signal generation
   Aggregated RIA practice book data across 5 territories. Mirrors the
   wholesaler-facing "where is the opportunity" view: each practice carries a
   book profile (QP/AI %, vehicle mix) from which we derive product signals.
   No individual client records — book-level aggregates only.
   --------------------------------------------------------------------------
   Restyled into the Field design system: territory + signal colors pull from
   the chart palette (colors_and_type.css), not the original neon set. */

// ---- Territory + signal colour / label metadata --------------------------
const DIST_TERRS = ['Northeast', 'Southeast', 'Midwest', 'West', 'Southwest'];

const DIST_TERR_META = {
  Northeast: { dot: 'rgb(59,130,246)',  fill: 'rgba(59,130,246,0.62)'  },
  Southeast: { dot: 'rgb(16,185,129)',  fill: 'rgba(16,185,129,0.62)'  },
  Midwest:   { dot: 'rgb(234,179,8)',   fill: 'rgba(234,179,8,0.62)'   },
  West:      { dot: 'rgb(249,115,22)',  fill: 'rgba(249,115,22,0.62)'  },
  Southwest: { dot: 'rgb(139,92,246)',  fill: 'rgba(139,92,246,0.62)'  },
};

const DIST_SIG_TYPES = ['Private Equity','Private Credit','Interval Fund','Equity SMA','Tax-Managed SMA','Models / ETF','Alt Expansion'];

const DIST_SIG_META = {
  'Private Equity':  { dot:'rgb(249,115,22)',  short:'PE',     icon:'building-columns' },
  'Private Credit':  { dot:'rgb(14,165,233)',  short:'PC',     icon:'hand-holding-dollar' },
  'Interval Fund':   { dot:'rgb(20,184,166)',  short:'IF',     icon:'arrows-rotate' },
  'Equity SMA':      { dot:'rgb(139,92,246)',  short:'SMA',    icon:'layer-group' },
  'Tax-Managed SMA': { dot:'rgb(16,185,129)',  short:'TM-SMA', icon:'scale-balanced' },
  'Models / ETF':    { dot:'rgb(234,179,8)',   short:'Models', icon:'diagram-project' },
  'Alt Expansion':   { dot:'rgb(248,113,113)', short:'Alt Exp',icon:'arrow-up-right-dots' },
};

const DIST_CALC = {
  'Private Equity':   'QP-classified clients ($5M+ in investments) where equity vehicles (ETF + SMA + individual securities) exceed 55% of book AUM and private fund allocation is <5%. QP status is legally required for 3(c)(7) structures — these clients have regulatory eligibility, portfolio fit, and runway for 7–10 year horizons.',
  'Private Credit':   'AI/QP clients where fixed income and mutual fund allocation exceeds 35% of book AUM and private credit allocation is <5%. Floating-rate private credit offers a 200–400bps yield pickup over comparable public credit with no duration extension; IRA placement preferred for 35%+ bracket clients.',
  'Interval Fund':    'AI-classified clients (excluding QPs) with 0% interval fund allocation. Interval funds are SEC-registered 1940 Act vehicles accessible without QP status — the primary alternatives entry point for this cohort, with quarterly liquidity windows.',
  'Equity SMA':       'Clients where mutual fund allocation exceeds 35% of book AUM. SMA conversion provides tax-loss harvesting, direct security ownership, lower cost vs. active MFs, and full customization. Highest impact for the 32%+ bracket with embedded gains in existing fund positions.',
  'Tax-Managed SMA':  'Clients in estimated 35%+ marginal bracket with average account >$750K and <5% SMA / direct-indexing allocation in taxable accounts. Tax-managed direct indexing can reduce annual tax drag by 50–150bps — compounding to $200K+ over a decade on a $2M taxable account.',
  'Models / ETF':     'Clients in individual security positions without systematic model portfolio allocation. Model-based management improves consistency, reduces advisor time, lowers transaction costs, and scales efficiently. Most compelling for $250K–$750K accounts.',
  'Alt Expansion':    'QP clients with existing alternatives (private fund + interval fund) combined between 4–12% of AUM. Institutional allocators target 20–30% alternatives — these clients have demonstrated comfort with alt structures and are meaningfully underweight vs. institutional peer benchmarks.',
};

// ---- City coordinates (for the US map bubbles) ---------------------------
const DIST_CITY_COORDS = {
  'New York': [40.71,-74.01], 'Boston': [42.36,-71.06], 'Philadelphia': [39.95,-75.17],
  'Greenwich': [41.03,-73.63], 'Hartford': [41.76,-72.69], 'Pittsburgh': [40.44,-79.996],
  'Providence': [41.82,-71.41],
  'Atlanta': [33.75,-84.39], 'Miami': [25.76,-80.19], 'Charlotte': [35.23,-80.84],
  'Nashville': [36.16,-86.78], 'Tampa': [27.95,-82.46], 'Raleigh': [35.78,-78.64],
  'Richmond': [37.54,-77.44],
  'Chicago': [41.88,-87.63], 'Minneapolis': [44.98,-93.27], 'Detroit': [42.33,-83.05],
  'Columbus': [39.96,-82.99], 'Cincinnati': [39.10,-84.51], 'Indianapolis': [39.77,-86.16],
  'San Francisco': [37.77,-122.42], 'Seattle': [47.61,-122.33], 'Los Angeles': [34.05,-118.24],
  'Portland': [45.52,-122.68], 'Palo Alto': [37.44,-122.14], 'Denver': [39.74,-104.99],
  'Salt Lake City': [40.76,-111.89], 'San Diego': [32.72,-117.16],
  'Dallas': [32.78,-96.80], 'Houston': [29.76,-95.37], 'Austin': [30.27,-97.74],
  'Phoenix': [33.45,-112.07], 'San Antonio': [29.42,-98.49], 'Scottsdale': [33.49,-111.93],
};

// ---- Raw practice book data ----------------------------------------------
// [name, city, state, territory, clients, aum($M), avgAcct($M), qp%, ai%, mf%, sma%, interval%, pf%, oppScore]
const DIST_RAW = [
  ['Meridian Wealth Partners',     'New York',     'NY','Northeast', 187,312,1.67, 31,58, 18,31,5,8,  88],
  ['Lighthouse Financial Group',   'Boston',       'MA','Northeast', 134,224,1.67, 24,52, 22,24,4,6,  81],
  ['Harborview Capital',           'Philadelphia', 'PA','Northeast',  58, 71,1.22, 18,41, 31,16,2,3,  52],
  ['Stonebridge Advisors',         'Greenwich',    'CT','Northeast',  94,186,1.98, 38,62, 12,42,7,11, 91],
  ['Pinnacle Family Wealth',       'New York',     'NY','Northeast', 221,418,1.89, 42,67,  9,39,8,13, 93],
  ['Atlantic Wealth Management',   'Boston',       'MA','Northeast',  76, 98,1.29, 19,48, 27,22,3,4,  64],
  ['Prism Capital Advisors',       'New York',     'NY','Northeast', 143,256,1.79, 33,59, 14,35,6,9,  85],
  ['New England Private Wealth',   'Boston',       'MA','Northeast',  62, 88,1.42, 22,51, 24,26,3,5,  68],
  ['Hudson River Financial',       'New York',     'NY','Northeast', 108,179,1.66, 27,54, 20,29,4,7,  77],
  ['Colonial Wealth Group',        'Philadelphia', 'PA','Northeast',  84,112,1.33, 21,47, 26,23,3,5,  70],
  ['Berkshire Wealth Advisors',    'Hartford',     'CT','Northeast',  67, 94,1.40, 23,50, 25,24,3,4,  67],
  ['Harbor Light Capital',         'Boston',       'MA','Northeast',  52, 61,1.17, 16,39, 33,18,2,3,  49],
  ['Empire State Advisors',        'New York',     'NY','Northeast', 163,287,1.76, 35,61, 15,36,6,10, 86],
  ['Keystone Wealth Partners',     'Pittsburgh',   'PA','Northeast',  71, 89,1.25, 20,46, 28,21,3,4,  62],
  ['Northeast Capital Management', 'Providence',   'RI','Northeast',  44, 52,1.18, 14,36, 36,16,2,2,  44],
  ['Summit Capital Advisors',      'Atlanta',      'GA','Southeast',  96,158,1.65, 26,54, 21,28,3,5,  76],
  ['Cornerstone Advisory Services','Miami',        'FL','Southeast',  72, 89,1.24, 19,47, 28,21,2,4,  63],
  ['Palmetto Wealth Group',        'Charlotte',    'NC','Southeast',  88,124,1.41, 22,49, 24,25,3,4,  69],
  ['Sunbelt Financial Advisors',   'Nashville',    'TN','Southeast',  64, 78,1.22, 17,43, 29,19,2,3,  57],
  ['Gulf Coast Wealth Management', 'Tampa',        'FL','Southeast',  79,104,1.32, 20,48, 26,22,3,4,  65],
  ['Blue Ridge Capital',           'Raleigh',      'NC','Southeast',  53, 64,1.21, 15,40, 31,17,2,2,  51],
  ['Magnolia Wealth Partners',     'Atlanta',      'GA','Southeast', 111,167,1.50, 24,52, 22,27,3,5,  72],
  ['Carolina Capital Group',       'Charlotte',    'NC','Southeast',  68, 86,1.26, 18,44, 27,21,2,3,  58],
  ['Tidewater Advisors',           'Richmond',     'VA','Southeast',  57, 70,1.23, 16,41, 30,18,2,2,  52],
  ['Legacy Wealth Southeast',      'Miami',        'FL','Southeast', 134,231,1.72, 29,56, 17,32,5,7,  79],
  ['Alpine Partners',              'Denver',       'CO','West',      163,267,1.64, 27,51, 24,27,4,6,  82],
  ['Bluestone Wealth',             'Minneapolis',  'MN','Midwest',    44, 52,1.18, 12,34, 38,15,2,2,  42],
  ['Great Lakes Wealth Group',     'Detroit',      'MI','Midwest',    72, 94,1.31, 18,44, 27,21,2,3,  59],
  ['Heartland Capital Advisors',   'Columbus',     'OH','Midwest',    86,118,1.37, 21,48, 25,24,3,4,  66],
  ['Prairie Capital Management',   'Chicago',      'IL','Midwest',   124,198,1.60, 26,52, 21,28,4,5,  74],
  ['Northern Plains Advisors',     'Minneapolis',  'MN','Midwest',    58, 72,1.24, 15,39, 32,18,2,2,  50],
  ['Ohio Valley Wealth Partners',  'Cincinnati',   'OH','Midwest',    67, 84,1.25, 17,42, 28,20,2,3,  57],
  ['Lakeshore Financial Group',    'Chicago',      'IL','Midwest',   148,241,1.63, 28,53, 22,28,4,6,  78],
  ['Midwest Private Wealth',       'Indianapolis', 'IN','Midwest',    54, 66,1.22, 14,38, 33,17,2,2,  48],
  ['Twin Cities Capital',          'Minneapolis',  'MN','Midwest',    92,134,1.46, 22,48, 23,25,3,4,  68],
  ['Crestview Private Wealth',     'San Francisco','CA','West',       241,486,2.02, 41,64,  8,38,9,14, 91],
  ['Pacific Ridge Advisors',       'Seattle',      'WA','West',       112,186,1.66, 28,54, 18,30,4,7,  78],
  ['Golden Gate Wealth',           'San Francisco','CA','West',       178,342,1.92, 39,63, 10,37,8,12, 89],
  ['Sunset Capital Partners',      'Los Angeles',  'CA','West',       156,264,1.69, 32,57, 16,33,5,8,  82],
  ['Cascade Wealth Management',    'Portland',     'OR','West',        68, 88,1.29, 19,45, 27,22,3,4,  61],
  ['Silicon Valley Wealth',        'Palo Alto',    'CA','West',       203,412,2.03, 44,68,  7,41,9,15, 93],
  ['Bay Area Private Client',      'San Francisco','CA','West',       134,248,1.85, 37,61, 11,36,7,11, 87],
  ['Rocky Mountain Advisors',      'Denver',       'CO','West',        84,118,1.40, 22,49, 24,25,4,5,  66],
  ['Pacific Northwest Capital',    'Seattle',      'WA','West',        76,104,1.37, 21,47, 25,23,3,4,  63],
  ['Horizon Wealth Group',         'Los Angeles',  'CA','West',       119,196,1.65, 29,55, 17,30,5,7,  76],
  ['Mountain West Advisors',       'Salt Lake City','UT','West',       58, 72,1.24, 16,40, 30,18,2,3,  51],
  ['Harbor View Pacific',          'San Diego',    'CA','West',        88,132,1.50, 24,51, 22,26,4,5,  69],
  ['Lone Star Wealth Partners',    'Dallas',       'TX','Southwest',  142,236,1.66, 28,53, 19,29,4,6,  77],
  ['Texas Capital Advisors',       'Houston',      'TX','Southwest',  118,192,1.63, 26,51, 21,27,3,5,  73],
  ['Austin Wealth Management',     'Austin',       'TX','Southwest',   96,148,1.54, 23,49, 23,25,3,4,  68],
  ['Desert Sun Financial',         'Phoenix',      'AZ','Southwest',   74, 96,1.30, 18,44, 27,21,2,3,  58],
  ['Rio Grande Advisors',          'San Antonio',  'TX','Southwest',   52, 63,1.21, 14,37, 33,17,2,2,  46],
  ['Copper State Wealth',          'Scottsdale',   'AZ','Southwest',  104,162,1.56, 24,50, 22,26,3,5,  70],
  ['Mesa Capital Group',           'Phoenix',      'AZ','Southwest',   63, 79,1.25, 16,41, 29,19,2,3,  52],
  ['Southwest Private Wealth',     'Dallas',       'TX','Southwest',  158,271,1.72, 30,55, 17,31,5,8,  79],
];

// ---- Signal generation (unchanged logic, restyled descriptions) ----------
function distGenSignals(p) {
  const sigs = [];
  const qpN = Math.round(p.clients * p.qp / 100);
  const aiN = Math.round(p.clients * p.ai / 100);
  const aiNQ = Math.max(aiN - qpN, 0);
  if (qpN >= 5 && p.pf < 9 && p.mf < 22) { const c = Math.max(Math.round(qpN*.54),3); sigs.push({ type:'Private Equity', clients:c, oppMin:Math.max(Math.round(c*p.avgAcct*.13),2), oppMax:Math.round(c*p.avgAcct*.20), strength:c>=15?'high':'med', desc:`<strong>${c} QP clients</strong> with equity-heavy portfolio and no or minimal private equity allocation` }); }
  if (aiN >= 8 && p.pf < 9 && p.mf >= 17) { const c = Math.max(Math.round(aiN*.33),4); sigs.push({ type:'Private Credit', clients:c, oppMin:Math.max(Math.round(c*p.avgAcct*.09),2), oppMax:Math.round(c*p.avgAcct*.14), strength:c>=12?'high':'med', desc:`<strong>${c} AI+ clients</strong> with FI or balanced portfolio and no private credit allocation` }); }
  if (aiNQ >= 6 && p.interval < 5) { const c = Math.max(Math.round(aiNQ*.58),4); sigs.push({ type:'Interval Fund', clients:c, oppMin:Math.max(Math.round(c*p.avgAcct*.08),2), oppMax:Math.round(c*p.avgAcct*.12), strength:c>=20?'high':'med', desc:`<strong>${c} AI clients (non-QP)</strong> with no interval fund exposure — first alternatives allocation` }); }
  if (p.mf >= 22 && p.sma < 32) { const c = Math.max(Math.round(p.clients*(p.mf-16)/100*1.5),5); sigs.push({ type:'Equity SMA', clients:c, oppMin:Math.max(Math.round(c*p.avgAcct*.28),3), oppMax:Math.round(c*p.avgAcct*.42), strength:'med', desc:`<strong>${c} clients</strong> with >35% mutual fund allocation eligible for SMA conversion` }); }
  if (p.avgAcct >= 1.3 && p.sma < 24 && p.ai >= 38) { const c = Math.max(Math.round(p.clients*.17),4); sigs.push({ type:'Tax-Managed SMA', clients:c, oppMin:Math.max(Math.round(c*p.avgAcct*.24),3), oppMax:Math.round(c*p.avgAcct*.36), strength:'med', desc:`<strong>${c} high-bracket clients</strong> with $750K+ AUM and minimal direct indexing in taxable accounts` }); }
  if (p.mf >= 28 && p.ai < 42 && p.sma < 20) { const c = Math.max(Math.round(p.clients*.22),5); sigs.push({ type:'Models / ETF', clients:c, oppMin:Math.max(Math.round(c*p.avgAcct*.20),2), oppMax:Math.round(c*p.avgAcct*.32), strength:'med', desc:`<strong>${c} clients</strong> in MF or individual securities without systematic model portfolio` }); }
  if (p.pf >= 6 && p.interval >= 4 && p.qp >= 26) { const c = Math.max(Math.round(qpN*.44),5); sigs.push({ type:'Alt Expansion', clients:c, oppMin:Math.max(Math.round(c*p.avgAcct*.14),4), oppMax:Math.round(c*p.avgAcct*.22), strength:'high', desc:`<strong>${c} QP clients</strong> already in alternatives but with <12% total alts — underweight vs. institutional benchmarks` }); }
  return sigs.slice(0, 5);
}

// ---- Firm-dashboard link (metrics mirrored from the Opportunity dashboard) ----
const DIST_FIRM_LINK = {
  'alpine-partners': {
    firm:'Northwind Securities', channel:'BA', advantage:'Strong', advDot:'rgb(52,211,153)',
    totalOpp:'$56.7M', yourBook:'$6.4M', share:'13.3%',
    cats:['Large Blend','Large Growth','Int. Core Plus','EM','Foreign Lg.'],
    contacts:[
      { name:'John Roe',   role:'Managing Partner',     email:'jroe@alpinepartners.example' },
      { name:'Jane Roe',   role:'Director of Research', email:'jane.roe@alpinepartners.example' },
      { name:'Sam Sample', role:'Investment Committee', email:'ssample@alpinepartners.example' },
    ],
  },
};

const DIST_PRACTICES = DIST_RAW.map(([name,city,state,territory,clients,aum,avgAcct,qp,ai,mf,sma,interval,pf,oppScore]) => {
  const coord = DIST_CITY_COORDS[city] || [39.5,-98.35];
  const p = { id: name.toLowerCase().replace(/[^a-z0-9]+/g,'-'), name, city, state, territory, clients, aum, avgAcct, qp, ai, mf, sma, interval, pf, oppScore, lat: coord[0], lon: coord[1] };
  p.signals = distGenSignals(p);
  p.firmLink = DIST_FIRM_LINK[p.id] || null;
  return p;
});

function distFmtM(m) {
  if (m >= 1000) return '$' + (m / 1000).toFixed(1) + 'B';
  return '$' + Math.round(m) + 'M';
}

Object.assign(window, {
  DIST_TERRS, DIST_TERR_META, DIST_SIG_TYPES, DIST_SIG_META, DIST_CALC,
  DIST_PRACTICES, distFmtM, DIST_FIRM_LINK,
});
