/* Management Dashboard */

// Channel groupings (Chris's mapping)
const FIRM_CHANNELS = {
  'Contoso Wealth':  'Wires',
  'Northwind Securities':             'Wires',
  'Fabrikam Financial':     'Wires',
  'Adatum Partners':   'IBD',
  'Litware Advisors':      'IBD',
  'Tailspin Capital':          'IBD',
  'Proseware Group':           'IBD',
  'Wingtip RIA':   'RIA',
  'Trey Trust': 'Bank',
};

// Each rep covers most firms (not just 1–2). John Doe is the heaviest territory,
// Jane Doe and Jane Smith also span widely. Build dynamically so the table dim
// logic doesn't accidentally hide most rows.
const REP_TO_FIRMS = {
  'John Doe':      ['Contoso Wealth','Northwind Securities','Fabrikam Financial','Adatum Partners','Litware Advisors','Tailspin Capital','Proseware Group','Wingtip RIA','Trey Trust'],
  'John Smith':   ['Contoso Wealth','Northwind Securities','Fabrikam Financial','Adatum Partners','Litware Advisors','Tailspin Capital','Wingtip RIA'],
  'John Roe':  ['Contoso Wealth','Adatum Partners','Litware Advisors','Tailspin Capital','Proseware Group','Trey Trust'],
  'Robert Jones':      ['Contoso Wealth','Northwind Securities','Fabrikam Financial','Adatum Partners','Trey Trust'],
  'Jane Doe':      ['Contoso Wealth','Northwind Securities','Fabrikam Financial','Adatum Partners','Litware Advisors','Tailspin Capital','Proseware Group','Wingtip RIA'],
  'Jane Smith':   ['Contoso Wealth','Northwind Securities','Fabrikam Financial','Adatum Partners','Litware Advisors','Tailspin Capital','Proseware Group','Trey Trust'],
  'Jane Roe':     ['Contoso Wealth','Northwind Securities','Adatum Partners','Litware Advisors','Tailspin Capital','Proseware Group','Wingtip RIA'],
  'Mary Doe':      ['Contoso Wealth','Northwind Securities','Fabrikam Financial','Adatum Partners','Litware Advisors','Wingtip RIA','Trey Trust'],
  'Mark Smith':    ['Contoso Wealth','Fabrikam Financial','Adatum Partners','Litware Advisors','Tailspin Capital','Proseware Group'],
  'Sarah Roe':       ['Contoso Wealth','Northwind Securities','Adatum Partners','Litware Advisors','Tailspin Capital','Proseware Group','Trey Trust'],
  'Michael Brown':  ['Contoso Wealth','Northwind Securities','Fabrikam Financial','Adatum Partners','Litware Advisors','Proseware Group','Wingtip RIA'],
  'Emily Brown':   ['Contoso Wealth','Northwind Securities','Fabrikam Financial','Adatum Partners','Tailspin Capital','Proseware Group'],
  'Chris Public':   ['Contoso Wealth','Fabrikam Financial','Adatum Partners','Litware Advisors','Tailspin Capital','Trey Trust'],
  'Linda Jones':      ['Contoso Wealth','Northwind Securities','Fabrikam Financial','Adatum Partners','Litware Advisors','Wingtip RIA'],
  'Pat Public':      ['Contoso Wealth','Northwind Securities','Adatum Partners','Litware Advisors','Proseware Group','Wingtip RIA'],
  'Alex Sample':         ['Contoso Wealth','Northwind Securities','Adatum Partners','Tailspin Capital','Proseware Group'],
  'Sam Sample':      ['Contoso Wealth','Fabrikam Financial','Adatum Partners','Tailspin Capital','Proseware Group','Trey Trust'],
};

const FIRM_TO_CATS = {
  'Adatum Partners':  ['Large Growth','Large Value','Int. Core-Plus','Mid-Cap Growth','Global Large Stock','Diversified Emerging'],
  'Contoso Wealth': ['Large Growth','Large Value','Foreign Large Blend','Global Large Stock','Diversified Emerging','Int. Core-Plus','Muni National Long','Mid-Cap Growth'],
  'Litware Advisors':     ['Large Growth','Int. Core-Plus','Mid-Cap Growth','Global Large Stock','Large Value','Foreign Large Blend'],
  'Fabrikam Financial':    ['Large Value','Int. Core-Plus','Foreign Large Blend','Muni National Long','Large Growth'],
  'Tailspin Capital':         ['Large Growth','Mid-Cap Growth','Diversified Emerging','Large Value'],
  'Northwind Securities':            ['Large Growth','Large Value','Foreign Large Blend','Global Large Stock','Diversified Emerging'],
  'Proseware Group':          ['Int. Core-Plus','Mid-Cap Growth','Muni National Long','Large Growth'],
  'Trey Trust':['Large Value','Foreign Large Blend','Diversified Emerging','Muni National Long','Large Growth'],
  'Wingtip RIA':  ['Large Value','Int. Core-Plus','Large Growth','Global Large Stock'],
};

// Each metric runs on its own data series so the bar/line shapes actually change.
const METRIC_MULT = { AUM: 1, Inflow: 0.06, Net: 0.022 };
const METRIC_LABEL = { AUM: 'MKT OPP', Inflow: 'MKT OPP', Net: 'MKT OPP' };
const METRIC_LABEL_YOURS = { AUM: 'YOURS', Inflow: 'YOURS', Net: 'YOURS' };
const METRIC_PILLS = { AUM: 'AUM', Inflow: 'Inflows', Net: 'Net Flows' };

function applyMetric(rows, metric) {
  const m = METRIC_MULT[metric] || 1;
  if (m === 1) return rows;
  return rows.map(r => ({
    ...r,
    mkt: fmtB(parseB(r.mkt) * m),
    yours: fmtB(parseB(r.yours) * m),
  }));
}

// Parse "$301B" / "$134.8B" / "$892M" -> billions float
function parseB(s) {
  if (!s) return 0;
  const m = String(s).match(/([\d,.]+)\s*([BM])?/);
  if (!m) return 0;
  const v = parseFloat(m[1].replace(/,/g,''));
  return m[2] === 'M' ? v / 1000 : v;
}
// Format billions float -> "$301B" or "$892M"
function fmtB(v) {
  if (v == null || isNaN(v)) return '—';
  if (v < 1) return `$${Math.round(v * 1000)}M`;
  if (v < 10) return `$${v.toFixed(2)}B`;
  if (v < 100) return `$${v.toFixed(1)}B`;
  return `$${Math.round(v)}B`;
}

const VEHICLE_MIX = { MF: 0.40, ETF: 0.30, SMA: 0.20, Privates: 0.10 };

const TOTAL_MKT_B = 1215;     // total addressable market in $B (REP_ROWS sum)
const TOTAL_YOURS_B = 449.6;  // your total book in $B

/* Multi-select cross-filter model:
   xf keys are the nine shared dimensions (see dims.jsx) — all arrays of member
   names.
   Selecting anywhere removes non-matching rows from every other grid (rather
   than dimming them) and re-sorts what remains. KPI tiles use the intersection.
*/
const XF_DIMS = DIM_ORDER.map(d => d.key);
function isXfEmpty(xf) {
  return !xf || XF_DIMS.every(d => !(xf[d] || []).length);
}
function emptyXf() { const o = {}; XF_DIMS.forEach(d => { o[d] = []; }); return o; }

/* Secondary dimension universes — synthesized proportionally off the same
   territory totals so every pivot ties back to $1,215B / $449.6B. */
function splitRows(names, weights, extra) {
  const total = weights.reduce((a,b) => a+b, 0);
  return names.map((n, i) => {
    const mkt = TOTAL_MKT_B * weights[i] / total;
    const yrs = TOTAL_YOURS_B * weights[i] / total * (0.82 + ((i * 37) % 40) / 100);
    return { name: n, mkt: fmtB(mkt), yours: fmtB(yrs), share: `${(yrs/mkt*100).toFixed(2)}%`, ...(extra ? extra(n, i) : {}) };
  });
}

const OFFICE_NAMES = ['New York – Park Ave','Boston – Seaport','Philadelphia – Center City','Atlanta – Buckhead','Charlotte – Uptown','Miami – Brickell','Chicago – Loop','Minneapolis – Downtown','Detroit – Troy','Dallas – Uptown','Houston – Galleria','Phoenix – Camelback','San Francisco – FiDi','Los Angeles – Century City','Seattle – Bellevue','Denver – Cherry Creek'];
const OFFICE_REGION = ['Northeast','Northeast','Northeast','Southeast','Southeast','Southeast','Midwest','Midwest','Midwest','Southwest','Southwest','Southwest','West','West','West','West'];
const TEAM_NAMES = ['The Doe Wealth Group','The Smith Group','Doe & Roe Advisors','Sample Consulting','The Smith Group II','Alpine Partners','The Brown Group','Summit Advisory','Keystone Wealth','Harbor Point Group'];
const ADVISOR_NAMES = ['Jane Smith','John Doe','Mary Roe','Robert Sample','Linda Public','Mark Jones','Emily Doe','Chris Brown','Pat Smith','Sarah Public','Alex Roe','Sam Jones'];
const CHANNEL_NAMES = ['Wires','IBD','RIA','Bank'];
// Cities are the office metros — one row per metro, offices roll up into them.
const CITY_OF_OFFICE = OFFICE_NAMES.map(n => n.split(' – ')[0]);
const CITY_NAMES = CITY_OF_OFFICE.filter((c, i) => CITY_OF_OFFICE.indexOf(c) === i);

const REGION_COLORS = { Northeast:'rgb(52,211,153)', Southeast:'rgb(249,115,22)', Midwest:'rgb(234,179,8)', Southwest:'rgb(139,92,246)', West:'rgb(59,130,246)' };

let _dimCache = null;
function dimRows(dim) {
  if (!_dimCache) {
    _dimCache = {
      regions: (() => {
        const order = ['Northeast','West','Midwest','Southwest','Southeast'];
        return order.map(rg => {
          const rs = REP_ROWS.filter(r => r.region === rg);
          const mkt = rs.reduce((a,r) => a + parseB(r.mkt), 0);
          const yrs = rs.reduce((a,r) => a + parseB(r.yours), 0);
          return { name: rg, mkt: fmtB(mkt), yours: fmtB(yrs), share: `${(yrs/mkt*100).toFixed(2)}%`, dot: REGION_COLORS[rg], sub: `${rs.length} rep${rs.length!==1?'s':''}` };
        });
      })(),
      vehicles: Object.keys(VEHICLE_MIX).map(v => {
        const mkt = TOTAL_MKT_B * VEHICLE_MIX[v];
        const yrs = TOTAL_YOURS_B * VEHICLE_MIX[v];
        return { name: v, mkt: fmtB(mkt), yours: fmtB(yrs), share: `${(yrs/mkt*100).toFixed(2)}%`, dot: VEHICLE_COLORS[v] };
      }),
      offices: splitRows(OFFICE_NAMES, [140,96,64,88,72,58,120,64,52,96,80,54,110,92,72,57], (n,i) => ({ sub: OFFICE_REGION[i], dot: REGION_COLORS[OFFICE_REGION[i]] })),
      channels: splitRows(CHANNEL_NAMES, [52,22,21,5]),
      cities: (() => {
        const W = [140,96,64,88,72,58,120,64,52,96,80,54,110,92,72,57];
        const weights = CITY_NAMES.map(c => CITY_OF_OFFICE.reduce((a, oc, i) => a + (oc === c ? W[i] : 0), 0));
        const regionOf = CITY_NAMES.map(c => OFFICE_REGION[CITY_OF_OFFICE.indexOf(c)]);
        return splitRows(CITY_NAMES, weights, (n, i) => ({ sub: regionOf[i], dot: REGION_COLORS[regionOf[i]] }));
      })(),
      // Teams and individual FAs share one dimension — a book is held by whichever it is.
      teams: splitRows([...TEAM_NAMES, ...ADVISOR_NAMES],
        [180,150,132,120,110,102,94,86,78,63, 150,138,124,116,106,98,92,84,78,72,66,60],
        (n, i) => ({ sub: i < TEAM_NAMES.length ? 'Team' : 'Financial Advisor' })),
    };
  }
  if (dim === 'reps') return REP_ROWS;
  if (dim === 'firms') return FIRM_ROWS;
  if (dim === 'cats') return CAT_ROWS;
  return _dimCache[dim] || [];
}

/* Dimension registry — every grid can be re-pivoted to any of these. */
const DIMS = {
  channels: { label:'Channel',     col:'CHANNEL',     unit:'channels',    unit1:'channel',     chip:'CHANNEL' },
  firms:    { label:'Firm',        col:'FIRM',        unit:'firms',       unit1:'firm',        chip:'FIRM', channel:true },
  cities:   { label:'City',        col:'CITY',        unit:'cities',      unit1:'city',        chip:'CITY' },
  offices:  { label:'Office',      col:'OFFICE',      unit:'offices',     unit1:'office',      chip:'OFFICE' },
  teams:    { label:'Team/FA',     col:'TEAM/FA',     unit:'teams/FAs',   unit1:'team/FA',     chip:'TEAM/FA' },
  vehicles: { label:'Vehicle',     col:'VEHICLE',     unit:'vehicles',    unit1:'vehicle',     chip:'VEHICLE' },
  cats:     { label:'Category',    col:'CATEGORY',    unit:'categories',  unit1:'category',    chip:'CATEGORY' },
  regions:  { label:'Region',      col:'REGION',      unit:'regions',     unit1:'region',      chip:'REGION' },
  reps:     { label:'Salesperson', col:'SALESPERSON', unit:'salespeople', unit1:'salesperson', chip:'SALESPERSON' },
};
const DIM_OPTIONS = DIM_ORDER;

// Visibility set: given current xf, return the in-scope member names per dimension.
// A dimension is never narrowed by its OWN selection — selecting three
// salespeople must leave the salesperson grid showing every salesperson (those
// three checked) so a fourth is still reachable. Selections narrow the OTHERS.
function computeVis(xf) {
  const out = {};
  XF_DIMS.forEach(d => { out[d] = dimRows(d).map(r => r.name); });
  if (isXfEmpty(xf)) return out;

  // Region → reps / offices / cities
  if ((xf.regions || []).length) {
    out.reps = out.reps.filter(n => xf.regions.includes((REP_ROWS.find(r => r.name === n) || {}).region));
    out.offices = out.offices.filter(n => { const i = OFFICE_NAMES.indexOf(n); return i < 0 || xf.regions.includes(OFFICE_REGION[i]); });
    out.cities = out.cities.filter(n => { const i = CITY_OF_OFFICE.indexOf(n); return i < 0 || xf.regions.includes(OFFICE_REGION[i]); });
  }
  // City ↔ office roll-up
  if ((xf.cities || []).length) {
    out.offices = out.offices.filter(n => xf.cities.includes(n.split(' – ')[0]));
  }
  if ((xf.offices || []).length) {
    const cs = new Set(xf.offices.map(n => n.split(' – ')[0]));
    out.cities = out.cities.filter(n => cs.has(n));
  }
  // Channel ↔ firm
  if ((xf.channels || []).length) {
    out.firms = out.firms.filter(f => xf.channels.includes(FIRM_CHANNELS[f] || ''));
  }
  if ((xf.firms || []).length) {
    const chs = new Set(xf.firms.map(f => FIRM_CHANNELS[f]).filter(Boolean));
    if (chs.size) out.channels = out.channels.filter(c => chs.has(c));
  }
  if ((xf.reps || []).length) {
    const rg = new Set(xf.reps.map(n => (REP_ROWS.find(r => r.name === n) || {}).region));
    out.regions = out.regions.filter(n => rg.has(n));
    const coveredFirms = new Set();
    xf.reps.forEach(r => (REP_TO_FIRMS[r] || []).forEach(f => coveredFirms.add(f)));
    out.firms = out.firms.filter(f => coveredFirms.has(f));
  }
  if ((xf.firms || []).length) {
    const reps2 = Object.keys(REP_TO_FIRMS).filter(r => (REP_TO_FIRMS[r] || []).some(f => xf.firms.includes(f)));
    out.reps = out.reps.filter(r => reps2.includes(r));
    const coveredCats = new Set();
    xf.firms.forEach(f => (FIRM_TO_CATS[f] || []).forEach(c => coveredCats.add(c)));
    out.cats = out.cats.filter(c => coveredCats.has(c));
  }
  if ((xf.cats || []).length) {
    const firmsForCats = Object.keys(FIRM_TO_CATS).filter(f => (FIRM_TO_CATS[f] || []).some(c => xf.cats.includes(c)));
    out.firms = out.firms.filter(f => firmsForCats.includes(f));
    const repsForFirms = Object.keys(REP_TO_FIRMS).filter(r => (REP_TO_FIRMS[r] || []).some(f => out.firms.includes(f)));
    out.reps = out.reps.filter(r => repsForFirms.includes(r));
  }
  // A selected member always stays reachable in its own grid.
  XF_DIMS.forEach(d => {
    (xf[d] || []).forEach(n => { if (!out[d].includes(n)) out[d].push(n); });
  });
  return out;
}

// Fold the global filter panel into the cross-filter model so header KPIs,
// charts and grids all move together regardless of where the filter came from.
function xfFromFilters(f) {
  const base = emptyXf();
  if (!f) return base;
  const vehMap = { 'Mutual Fund':'MF', 'ETF':'ETF', 'SMA':'SMA', 'Privates':'Privates', 'Model':'Model' };
  base.regions  = (f.regions || []).slice();
  base.reps     = (f.salespeople || []).slice();
  base.firms    = (f.firms || []).slice();
  base.cats     = (f.categories || []).filter(c => CAT_ROWS.some(r => r.name === c));
  base.offices  = (f.offices || []).slice();
  // The drawer lists Teams and Financial Advisors separately; the grids treat
  // them as one Team/FA dimension.
  base.teams    = [...(f.teams || []), ...(f.advisors || [])];
  base.channels = (f.channels || []).filter(c => CHANNEL_NAMES.includes(c));
  base.cities   = (f.cities || []).slice();
  base.vehicles = (f.vehicles || []).map(v => vehMap[v] || v).filter(v => VEHICLE_MIX[v] != null);
  return base;
}
function mergeXf(a, b) {
  const out = emptyXf();
  XF_DIMS.forEach(d => {
    const s = new Set([...(a[d] || []), ...(b[d] || [])]);
    out[d] = Array.from(s);
  });
  return out;
}

// Target total for the current filter selection — every selected dimension
// narrows the total, so header KPIs move with any filter source.
function targetTotal(xf) {
  let mkt = TOTAL_MKT_B, yours = TOTAL_YOURS_B;
  ['reps','firms','cats','regions','offices','teams','channels','cities'].forEach(dim => {
    const sel = xf[dim] || [];
    if (!sel.length) return;
    const rows = dimRows(dim);
    const totMkt = rows.reduce((a,r) => a + parseB(r.mkt), 0) || 1;
    const totYrs = rows.reduce((a,r) => a + parseB(r.yours), 0) || 1;
    const s  = sel.reduce((a,n) => a + parseB((rows.find(r => r.name === n) || {}).mkt), 0);
    const sy = sel.reduce((a,n) => a + parseB((rows.find(r => r.name === n) || {}).yours), 0);
    mkt   = mkt * (s / totMkt);
    yours = yours * (sy / totYrs);
  });
  if (xf.vehicles && xf.vehicles.length > 0) {
    const f = xf.vehicles.reduce((s, v) => s + (VEHICLE_MIX[v] || 0), 0);
    mkt *= f; yours *= f;
  }
  return { mkt, yours };
}

// Rescale a table's rows so the in-scope rows sum to the target totals.
// Out-of-scope rows are dropped by the caller, not dimmed.
function scaleRowsForVis(rows, visNames, targetMkt, targetYours) {
  const visRows = rows.filter(r => visNames.includes(r.name));
  const sumMkt = visRows.reduce((s, r) => s + parseB(r.mkt), 0) || 1;
  const sumYours = visRows.reduce((s, r) => s + parseB(r.yours), 0) || 1;
  const mFac = targetMkt / sumMkt;
  const yFac = targetYours / sumYours;
  return rows.map(r => {
    if (!visNames.includes(r.name)) return r;
    const nm = parseB(r.mkt) * mFac;
    const ny = parseB(r.yours) * yFac;
    return {
      ...r,
      mkt: fmtB(nm),
      yours: fmtB(ny),
      share: nm > 0 ? `${(ny/nm*100).toFixed(2)}%` : '—',
    };
  });
}

// Compute KPI numbers from current selection — uses targetTotal so tiles always tie
// to the sum of each table's visible rows. Every card carries a YoY % change.
function kpisFor(xf) {
  const { mkt, yours } = targetTotal(xf);
  let sub;
  if (isXfEmpty(xf)) {
    sub = `${REP_ROWS.length} salespeople · ${FIRM_ROWS.length} firms · ${CAT_ROWS.length} categories`;
  } else {
    const labels = [];
    XF_DIMS.forEach(d => {
      const n = (xf[d] || []).length;
      if (n) labels.push(`${n} ${n > 1 ? DIMS[d].unit : DIMS[d].unit1}`);
    });
    sub = labels.join(' · ');
  }
  return [
    { title:'AUM',       mkt,            yours,               mktSub: sub,                     mktYoY:'↑ 5.6% YoY',  yoursYoY:'↑ 4.8% YoY',  shareYoY:'↓ 0.7 pts YoY' },
    { title:'Inflows',   mkt: mkt*0.06,  yours: yours*0.063,  mktSub:'Gross inflows in period', mktYoY:'↑ 9.1% YoY',  yoursYoY:'↑ 12.3% YoY', shareYoY:'↑ 1.4 pts YoY' },
    { title:'Net Flows', mkt: mkt*0.022, yours: yours*0.026,  mktSub:'Net of redemptions',      mktYoY:'↑ 16.4% YoY', yoursYoY:'↑ 23.1% YoY', shareYoY:'↑ 2.1 pts YoY' },
  ];
}

function ManagementPage({ filters, onSelectionsChange, focus }) {
  // Per-tile metric state (Chris: each tile is independent unless changed globally)
  const [metricTrend,   setMetricTrend]   = React.useState('AUM');
  const [metricChannel, setMetricChannel] = React.useState('AUM');
  const [metricA, setMetricA] = React.useState('AUM');
  const [metricB, setMetricB] = React.useState('AUM');
  const [metricC, setMetricC] = React.useState('AUM');
  // Which dimension each grid slot is pivoted on — swappable at any time.
  const [dimA, setDimA] = React.useState('reps');
  const [dimB, setDimB] = React.useState('firms');
  const [dimC, setDimC] = React.useState('cats');
  const [dimBreak, setDimBreak] = React.useState('channels');
  const [dimTrend, setDimTrend] = React.useState('vehicles');
  // Multi-select cross-filter, merged with the global filter panel.
  const [sel, setSel] = React.useState(emptyXf());
  const panelXf = React.useMemo(() => xfFromFilters(filters), [filters]);
  const xfBase = React.useMemo(() => mergeXf(panelXf, sel), [panelXf, sel]);
  // Focus strategies only: the category cross-filter is narrowed to the focus
  // categories, so every total, chart and grid rescales to them.
  const focusCatNames = React.useMemo(() => CAT_ROWS.map(r => r.name).filter(isFocusCat), [focus]);
  const xf = React.useMemo(() => {
    if (!focus) return xfBase;
    const inter = (xfBase.cats || []).filter(c => focusCatNames.includes(c));
    return { ...xfBase, cats: inter.length ? inter : focusCatNames };
  }, [xfBase, focus, focusCatNames]);
  const [drawerRow, setDrawerRow] = React.useState(null);
  const [vehicleOverlay, setVehicleOverlay] = React.useState(null);
  const [firmOverlay, setFirmOverlay] = React.useState(null);

  const vis = React.useMemo(() => computeVis(xf), [xf]);
  const target = React.useMemo(() => targetTotal(xf), [xf]);
  const kpis = React.useMemo(() => kpisFor(xf), [xf]);
  const hasFilter = !isXfEmpty(xf);

  // Rows per grid. A grid that has its own selection keeps every row visible
  // (selected ones checked) and at its own values — its selection is what
  // narrows the OTHER grids, which rescale to the resulting target totals.
  const rowsFor = React.useCallback((dim) => {
    const all = focus && dim === 'cats' ? dimRows(dim).filter(r => focusCatNames.includes(r.name)) : dimRows(dim);
    if (!hasFilter) return all;
    const visible = all.filter(r => (vis[dim] || []).includes(r.name));
    if ((xf[dim] || []).length > 0) return visible;
    return scaleRowsForVis(visible, visible.map(r => r.name), target.mkt, target.yours);
  }, [hasFilter, vis, xf, target.mkt, target.yours, focus, focusCatNames]);

  const toggleSel = (dim, key) => {
    setSel(prev => {
      const arr = prev[dim] || [];
      const next = arr.includes(key) ? arr.filter(x => x !== key) : [...arr, key];
      return { ...prev, [dim]: next };
    });
  };
  const removeOne = (dim, key) => setSel(prev => ({ ...prev, [dim]: (prev[dim] || []).filter(x => x !== key) }));
  const clearAll = React.useCallback(() => setSel(emptyXf()), []);

  // Report chips up to the top bar so nothing on the page moves when a
  // selection is applied or cleared.
  const DIM_ICON = { channels:'sitemap', firms:'building-columns', cities:'city', offices:'building', teams:'users', vehicles:'cube', cats:'layer-group', regions:'location-dot', reps:'user-tie' };
  React.useEffect(() => {
    if (!onSelectionsChange) return;
    const out = [];
    XF_DIMS.forEach(dim => {
      (xfBase[dim] || []).forEach(key => {
        const own = (sel[dim] || []).includes(key);
        out.push({
          key: `${dim}:${key}`, label: key, icon: DIM_ICON[dim],
          onRemove: own ? () => removeOne(dim, key) : undefined,
        });
      });
    });
    onSelectionsChange(out);
  }, [xfBase, sel, onSelectionsChange]);

  const drillFor = (dim, r) => {
    if (dim === 'firms') { setFirmOverlay(r); return; }
    if (dim === 'cats') { setVehicleOverlay({ name:r.name, opp:r.mkt, c: catColorFor(r.name) }); return; }
    setDrawerRow({
      type: dim, name: r.name,
      subtitle: `${DIMS[dim].label} · Vehicle Breakdown`,
      data: { ...drillDataForRep(r), meta: {
        init: r.name.split(' ').map(s=>s[0]).join('').slice(0,2).toUpperCase(),
        color: r.dot || 'rgb(52,211,153)', region: r.region || r.sub,
        firms: (REP_TO_FIRMS[r.name] || []).join(' · '),
      } },
    });
  };

  return (
    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16, flex: 1, minHeight: 620 }}>
      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px,1fr))', gap: 16 }}>
        {kpis.map((k,i) => (
          <KpiTile key={i} title={k.title} mkt={k.mkt} yours={k.yours} mktSub={k.mktSub} mktYoY={k.mktYoY} yoursYoY={k.yoursYoY} shareYoY={k.shareYoY} />
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px,1fr))', gap: 16 }}>
        <Tile
          center={<ClickableVehicleLegend xf={xf} onToggle={(v) => toggleSel('vehicles', v)} />}
          titleRight={<DimensionPicker variant="title" suffix=" Trend" value={dimTrend} options={BREAKDOWN_OPTIONS} onChange={setDimTrend} />}
          right={<TabPills options={['AUM','Inflow','Net']} labels={METRIC_PILLS} value={metricTrend} onChange={setMetricTrend} />}
          style={{ minHeight: 0 }}>
          <StackedBarWithLine xf={xf} metric={metricTrend} dim={dimTrend} />
        </Tile>
        <Tile
          center={<ClickableVehicleLegend xf={xf} onToggle={(v) => toggleSel('vehicles', v)} />}
          titleRight={<DimensionPicker variant="title" suffix=" Breakdown" value={dimBreak} options={BREAKDOWN_OPTIONS} onChange={setDimBreak} />}
          right={<TabPills options={['AUM','Inflow','Net']} labels={METRIC_PILLS} value={metricChannel} onChange={setMetricChannel} />}
          style={{ minHeight: 0 }}>
          <BreakdownBars xf={xf} metric={metricChannel} dim={dimBreak} />
        </Tile>
      </div>

      {/* Three grids row — each pivot is swappable */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px,1fr))', gridAutoRows: 'minmax(260px, 1fr)', gap: 16, flex: 1, minHeight: 260 }}>
        {[[dimA, setDimA, metricA, setMetricA], [dimB, setDimB, metricB, setMetricB], [dimC, setDimC, metricC, setMetricC]].map(([dim, setDim, metric, setMetric], i) => (
          <DimTable key={i}
            dim={dim} onDimChange={setDim}
            rows={applyMetric(rowsFor(dim), metric)}
            metric={metric} setMetric={setMetric}
            selected={xf[dim] || []}
            onRowClick={(name) => toggleSel(dim, name)}
            onRowDrill={(r) => drillFor(dim, r)} />
        ))}
      </div>

      <RowDrawer
        open={!!drawerRow}
        onClose={() => setDrawerRow(null)}
        title={drawerRow?.name}
        subtitle={drawerRow?.subtitle}
        data={drawerRow?.data}
      />
      <VehicleBreakdownOverlay cat={vehicleOverlay} onClose={() => setVehicleOverlay(null)} />
      <FirmBreakdownOverlay firm={firmOverlay} onClose={() => setFirmOverlay(null)} />
    </div>
  );
}

function FilterChip({ kind, label, onRemove }) {
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:6, padding:'3px 10px', borderRadius:9999,
      background:'rgba(16,185,129,0.25)', border:'1px solid rgb(16,185,129)',
      fontFamily:'Inter', fontSize:11, fontWeight:600, color:'rgb(52,211,153)',
    }}>
      <span style={{ fontSize:9, opacity:0.7, fontWeight:600 }}>{kind}</span>
      {label}
      {onRemove && <i className="fa-solid fa-xmark" onClick={onRemove} style={{ fontSize:9, cursor:'pointer', opacity:0.7 }} />}
    </span>
  );
}

const VEHICLE_COLORS = {
  MF:       'rgb(52,211,153)',
  ETF:      'rgb(120,160,230)',
  SMA:      'rgb(180,150,235)',
  Privates: 'rgb(245,200,90)',
};

function ClickableVehicleLegend({ xf, onToggle }) {
  const items = [
    { l:'MF',       c: VEHICLE_COLORS.MF },
    { l:'ETF',      c: VEHICLE_COLORS.ETF },
    { l:'SMA',      c: VEHICLE_COLORS.SMA },
    { l:'Privates', c: VEHICLE_COLORS.Privates },
  ];
  const sel = (xf && xf.vehicles) || [];
  const anySelected = sel.length > 0;
  return (
    <div style={{ display:'inline-flex', alignItems:'center', gap:8 }}>
      <span style={{ fontFamily:'Inter', fontSize:10.5, fontWeight:600, color:'rgb(200,205,213)', textTransform:'uppercase', letterSpacing:0.4 }}>
        Vehicle
      </span>
      <div style={{ display:'inline-flex', gap:4, alignItems:'center' }}>
        {items.map(it => {
          const isOn = sel.includes(it.l);
          const dim = anySelected && !isOn;
          return <VehicleChip key={it.l} label={it.l} color={it.c} on={isOn} dim={dim} onClick={() => onToggle && onToggle(it.l)} />;
        })}
        {anySelected && (
          <button onClick={() => { sel.forEach(v => onToggle && onToggle(v)); }} title="Clear vehicle filter" style={{
            marginLeft:2, background:'transparent', border:'none',
            color:'rgb(107,114,128)', fontFamily:'Inter', fontSize:10, cursor:'pointer',
            padding:'2px 4px',
          }}>Clear</button>
        )}
      </div>
    </div>
  );
}

function VehicleChip({ label, color, on, dim, onClick }) {  const [hover, setHover] = React.useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display:'inline-flex', alignItems:'center', gap:5,
        height:24, padding: on ? '0 8px 0 7px' : '0 9px',
        borderRadius:9999,
        background: on ? color : (hover ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)'),
        border: on ? `1px solid ${color}` : `1px solid ${hover ? 'rgba(255,255,255,0.25)' : 'rgba(75,85,99,0.55)'}`,
        color: on ? 'rgb(15,23,36)' : (dim ? 'rgb(107,114,128)' : 'rgb(229,231,235)'),
        fontFamily:'Inter', fontSize:11, fontWeight: on ? 700 : 500,
        cursor:'pointer',
        opacity: dim ? 0.55 : 1,
        boxShadow: on ? `0 0 0 2px ${color}33` : 'none',
        transform: hover && !on ? 'translateY(-0.5px)' : 'none',
        transition: 'background .12s, border-color .12s, transform .12s, opacity .15s, color .12s',
      }}>
      {on
        ? <i className="fa-solid fa-check" style={{ fontSize:9, color:'rgb(15,23,36)' }} />
        : <span style={{ width:8, height:8, borderRadius:9999, background: color, opacity: dim ? 0.5 : 1 }} />
      }
      {label}
    </button>
  );
}

function KpiTile({ title, mkt, yours, mktSub, mktYoY, yoursYoY, shareYoY }) {
  const sharePct = mkt > 0 ? `${(yours/mkt*100).toFixed(2)}%` : '—';
  const items = [
    { label:'Mkt Opp',   value: fmtB(mkt),   sub: mktYoY },
    { label:'Yours',     value: fmtB(yours), sub: yoursYoY, strong:true },
    { label:'Mkt Share', value: sharePct,    sub: shareYoY },
  ];
  const yoyColor = (s) => String(s).startsWith('↓') ? 'rgb(248,113,113)' : 'rgb(52,211,153)';
  return (
    <Tile pad={16}>
      <div style={{ display:'flex', alignItems:'baseline', gap:8, marginBottom:12 }}>
        <div style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 12.5, color: 'rgb(249,250,251)' }}>{title}</div>
        {mktSub && <div style={{ fontFamily:'Inter', fontSize:10.5, color:'rgb(107,114,128)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{mktSub}</div>}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 'clamp(6px,0.9vw,12px)' }}>
        {items.map((it, i) => (
          <div key={i} style={{ minWidth: 0, borderLeft: i>0 ? '1px solid rgba(75,85,99,0.3)' : 'none', paddingLeft: i>0 ? 'clamp(6px,0.9vw,12px)' : 0 }}>
            <div style={{ fontFamily: 'Inter', fontSize: 10, color: 'rgb(200,205,213)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{it.label}</div>
            <div style={{ fontFamily: 'Inter Display, Inter', fontWeight: 700, fontSize: 'clamp(16px,1.35vw,20px)', color: 'rgb(249,250,251)', fontVariantNumeric: 'tabular-nums' }}>{it.value}</div>
            <div style={{ fontFamily: 'Inter', fontSize: 10.5, color: yoyColor(it.sub), marginTop: 2 }}>{it.sub}</div>
          </div>
        ))}
      </div>
    </Tile>
  );
}

function LegendDots({ dots }) {
  return (
    <div style={{ display: 'inline-flex', gap: 10, alignItems: 'center' }}>
      {dots.map((d,i) => (
        <span key={i} style={{ display: 'inline-flex', gap: 5, alignItems: 'center', fontFamily: 'Inter', fontSize: 10.5, color: 'rgb(163,163,163)' }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: d.c }} />
          {d.l}
        </span>
      ))}
    </div>
  );
}

function StackedBarWithLine({ xf, metric, dim = 'vehicles' }) {
  // Visibility-scaled scale factor so the bars resize when filters change.
  const scale = React.useMemo(() => {
    const vis = computeVis(xf);
    const totalMkt = REP_ROWS.reduce((a,r) => a + parseB(r.mkt), 0) || 1;
    const visMkt = vis.reps.reduce((a, n) => a + parseB((REP_ROWS.find(r => r.name === n) || {}).mkt), 0);
    return Math.max(visMkt / totalMkt, 0.05);
  }, [xf]);
  const shareScale = React.useMemo(() => {
    const vis = computeVis(xf);
    const totalMkt = REP_ROWS.reduce((a,r) => a + parseB(r.mkt), 0) || 1;
    const totalYours = REP_ROWS.reduce((a,r) => a + parseB(r.yours), 0) || 1;
    const visMkt = vis.reps.reduce((a, n) => a + parseB((REP_ROWS.find(r => r.name === n) || {}).mkt), 0);
    const visYours = vis.reps.reduce((a, n) => a + parseB((REP_ROWS.find(r => r.name === n) || {}).yours), 0);
    if (!visMkt) return 0;
    const baseShare = totalYours / totalMkt;
    const newShare = visYours / visMkt;
    return newShare / baseShare;
  }, [xf]);

  // Vehicle filter (mask) — if vehicles array has entries, only include those vehicles
  const vehMask = (xf && xf.vehicles && xf.vehicles.length > 0) ? new Set(xf.vehicles) : null;
  const inMask = (v) => !vehMask || vehMask.has(v);

  // Different base series shape per metric — Net Flow has dips, Inflow has volatility, AUM grows
  const SERIES = {
    AUM: {
      MF:       [180, 220, 260, 300],
      ETF:      [160, 180, 220, 280],
      SMA:      [ 80, 120, 140, 170],
      Privates: [ 40,  60,  80, 100],
      share:    [2.4, 3.1, 3.9, 4.8],
      yUnit: 'B', shareMax: 6,
    },
    Inflow: {
      MF:       [ 14,  18,  22,  26],
      ETF:      [ 12,  16,  20,  24],
      SMA:      [  8,  10,  12,  14],
      Privates: [  4,   6,   7,   9],
      share:    [3.0, 3.4, 3.8, 4.2],
      yUnit: 'B', shareMax: 6,
    },
    Net: {
      MF:       [  6,   8,   5,  10],
      ETF:      [  5,   3,   7,   9],
      SMA:      [  2,   4,   2,   5],
      Privates: [  1,   2,   1,   3],
      share:    [3.5, 4.0, 4.3, 4.9],
      yUnit: 'B', shareMax: 6,
    },
  };
  const S = SERIES[metric] || SERIES.AUM;
  const sc = (arr, m=scale) => arr.map(v => +(v*m).toFixed(2));

  const vehSeries = [
    { vehicle:'MF',       color:VEHICLE_COLORS.MF,       data: sc(S.MF) },
    { vehicle:'ETF',      color:VEHICLE_COLORS.ETF,      data: sc(S.ETF) },
    { vehicle:'SMA',      color:VEHICLE_COLORS.SMA,      data: sc(S.SMA) },
    { vehicle:'Privates', color:VEHICLE_COLORS.Privates, data: sc(S.Privates) },
  ].filter(s => inMask(s.vehicle));

  // Re-pivot the stack: quarterly totals (already vehicle-masked) split by the
  // picked dimension's weights, so every pivot ties to the same book.
  const cfg = BREAKDOWN_DIMS[dim] || BREAKDOWN_DIMS.vehicles;
  const qTotals = [0,1,2,3].map(q => vehSeries.reduce((a,s) => a + s.data[q], 0));
  const series = dim === 'vehicles' || !BREAKDOWN_DIMS[dim]
    ? vehSeries
    : cfg.cats.map((c, i) => ({
        vehicle: c,
        color: DIM_SERIES_COLORS[i % DIM_SERIES_COLORS.length],
        data: qTotals.map(t => +(t * cfg.w[i]).toFixed(2)),
      }));

  const opts = React.useMemo(() => ({
    chart: { height: 220, backgroundColor: 'transparent', animation: { duration: 400 } },
    xAxis: { categories: ['2024-Q3','2024-Q4','2025-Q1','2025-Q2'], lineColor: 'rgba(75,85,99,0.4)' },
    yAxis: [{
      title: { text: 'Mkt Opp', style: { color: 'rgb(163,163,163)', fontSize: '10px' } },
      labels: { formatter: function() { return '$' + this.value + S.yUnit; }, style: { color: 'rgb(163,163,163)', fontSize: '10px' } },
      gridLineColor: 'rgba(75,85,99,0.2)', gridLineDashStyle: 'Dash',
    }, {
      opposite: true, title: { text: 'Mkt share', style: { color: 'rgb(163,163,163)', fontSize: '10px' } },
      labels: { formatter: function() { return this.value.toFixed(1) + '%'; }, style: { color: 'rgb(163,163,163)', fontSize: '10px' } },
      gridLineWidth: 0, max: S.shareMax,
    }],
    legend: { enabled: false },
    plotOptions: { column: { stacking: 'normal', borderRadius: 0, pointPadding: 0.1, groupPadding: 0.15 } },
    series: [
      ...series.map(s => ({ type:'column', name:s.vehicle, data:s.data, ...wash(s.color) })),
      { type: 'spline', name: 'Mkt Share', data: sc(S.share, shareScale), yAxis: 1, color: 'rgb(52,211,153)',
        marker: { fillColor: 'rgb(52,211,153)', lineColor: '#fff', lineWidth: 1, radius: 4 }, dashStyle: 'Dash' },
    ],
  }), [series, scale, shareScale, metric, dim]);
  return <div style={{ height: 220 }}><HC options={opts} /></div>;
}

const DIM_SERIES_COLORS = ['rgb(52,211,153)','rgb(96,165,250)','rgb(167,139,250)','rgb(251,146,60)','rgb(45,212,191)','rgb(250,204,21)','rgb(244,114,182)','rgb(148,163,184)','rgb(129,140,248)'];

/* Breakdown columns for any dimension. Vehicle stacks per category, with one
   independent Mkt Share reading per column — markers only, never a line, since
   the categories aren't a sequence. */
const BREAKDOWN_DIMS = {
  channels: { label:'Channel',  cats:['Wires','IBD','RIA','Bank'], w:[0.52,0.22,0.21,0.05], share:[2.44,1.98,2.16,1.74] },
  cities:   { label:'City',     cats:['New York','Chicago','San Francisco','Dallas','Boston','Los Angeles','Atlanta','Seattle'], w:[0.192,0.164,0.151,0.131,0.099,0.096,0.091,0.076], share:[2.58,2.12,2.34,1.86,2.46,2.05,1.78,2.22] },
  offices:  { label:'Office',   cats:['New York – Park Ave','Chicago – Loop','San Francisco – FiDi','Dallas – Uptown','Boston – Seaport','Los Angeles – Century City','Atlanta – Buckhead','Houston – Galleria'], w:[0.171,0.147,0.135,0.117,0.117,0.112,0.107,0.094], share:[2.62,2.16,2.38,1.88,2.44,2.02,1.76,1.94] },
  teams:    { label:'Team/FA',  cats:['The Doe Wealth Group','The Smith Group','Doe & Roe Advisors','Jane Smith','Sample Consulting','John Doe','The Brown Group','Alpine Partners'], w:[0.168,0.140,0.123,0.121,0.112,0.111,0.113,0.112], share:[2.48,2.18,2.02,2.36,1.92,2.54,1.84,2.10] },
  regions:  { label:'Region',   cats:['Northeast','West','Midwest','Southwest','Southeast'], w:[0.28,0.28,0.22,0.10,0.12], share:[2.62,2.18,2.05,1.92,1.74] },
  reps:     { label:'Salesperson', cats:['John Doe','Jane Doe','John Smith','Jane Smith','Mary Roe','Robert Sample','Linda Public','Mark Jones'], w:[0.164,0.142,0.131,0.124,0.118,0.113,0.106,0.102], share:[2.56,2.24,2.08,2.34,1.96,1.88,2.12,2.02] },
  vehicles: { label:'Vehicle',  cats:['MF','ETF','SMA','Privates'], w:[0.40,0.30,0.20,0.10], share:[2.30,2.55,1.98,1.62], flat:true },
  firms:    { label:'Firm',     cats:['Adatum','Litware','Fabrikam','Tailspin','Contoso','Northwind','Proseware','Wingtip','Trey'], w:[0.201,0.160,0.148,0.118,0.109,0.087,0.067,0.058,0.052], share:[1.92,2.44,2.36,1.68,2.28,2.55,1.86,2.72,2.44] },
  cats:     { label:'Category', cats:['Large Growth','Large Value','Foreign Lg Blend','Mid-Cap Growth','Global Lg Stock','Div. Emerging','Int. Core-Plus','Muni Natl Long'], w:[0.337,0.181,0.119,0.086,0.082,0.074,0.066,0.055], share:[2.18,2.26,1.98,2.12,2.05,1.72,2.44,2.86] },
};
const BREAKDOWN_OPTIONS = DIM_ORDER;

// Territory totals per vehicle, per metric — distributed across whichever
// dimension the user picked so every pivot ties to the same book.
const VEHICLE_TOTALS = {
  AUM:    { MF: 610, ETF: 500, SMA: 330, Privates: 200 },
  Inflow: { MF: 49,  ETF: 41,  SMA: 27,  Privates: 15 },
  Net:    { MF: 24,  ETF: 16,  SMA: 9,   Privates: 5 },
};

function BreakdownBars({ xf, metric, dim }) {
  const cfg = BREAKDOWN_DIMS[dim] || BREAKDOWN_DIMS.channels;
  const scale = React.useMemo(() => {
    const vis = computeVis(xf);
    const totalMkt = REP_ROWS.reduce((a,r) => a + parseB(r.mkt), 0) || 1;
    const visMkt = vis.reps.reduce((a, n) => a + parseB((REP_ROWS.find(r => r.name === n) || {}).mkt), 0);
    return Math.max(visMkt / totalMkt, 0.05);
  }, [xf]);
  const shareScale = React.useMemo(() => {
    const vis = computeVis(xf);
    const totalMkt = REP_ROWS.reduce((a,r) => a + parseB(r.mkt), 0) || 1;
    const totalYours = REP_ROWS.reduce((a,r) => a + parseB(r.yours), 0) || 1;
    const visMkt = vis.reps.reduce((a, n) => a + parseB((REP_ROWS.find(r => r.name === n) || {}).mkt), 0);
    const visYours = vis.reps.reduce((a, n) => a + parseB((REP_ROWS.find(r => r.name === n) || {}).yours), 0);
    if (!visMkt) return 0;
    return (visYours / visMkt) / (totalYours / totalMkt);
  }, [xf]);

  const vehMask = (xf && xf.vehicles && xf.vehicles.length > 0) ? new Set(xf.vehicles) : null;
  const inMask = (v) => !vehMask || vehMask.has(v);
  const totals = VEHICLE_TOTALS[metric] || VEHICLE_TOTALS.AUM;
  const VEHS = ['MF','ETF','SMA','Privates'];

  const colSeries = cfg.flat
    ? [{
        type: 'column', name: 'Mkt Opp',
        data: cfg.cats.map((v, i) => ({
          y: inMask(v) ? +((totals.MF + totals.ETF + totals.SMA + totals.Privates) * cfg.w[i] * scale).toFixed(2) : 0,
          color: VEHICLE_COLORS[v],
        })),
      }]
    : VEHS.filter(inMask).map(v => ({
        type: 'column', name: v,
        data: cfg.cats.map((_, i) => +(totals[v] * cfg.w[i] * scale).toFixed(2)),
        ...wash(VEHICLE_COLORS[v]),
      }));

  const shareMax = metric === 'AUM' ? 3 : 0.8;
  const shareData = cfg.share.map(v => +((metric === 'AUM' ? v : v * 0.22) * shareScale).toFixed(2));

  const opts = React.useMemo(() => ({
    chart: { height: 220, backgroundColor: 'transparent', animation: { duration: 400 } },
    xAxis: { categories: cfg.cats, lineColor: 'rgba(75,85,99,0.4)',
      labels: { style: { color: 'rgb(163,163,163)', fontSize: '10px' }, rotation: cfg.cats.length > 6 ? -35 : 0 } },
    yAxis: [{
      title: { text: 'Mkt Opp', style: { color: 'rgb(163,163,163)', fontSize: '10px' } },
      labels: { formatter: function() { return '$' + this.value + 'B'; }, style: { color: 'rgb(163,163,163)', fontSize: '10px' } },
      gridLineColor: 'rgba(75,85,99,0.2)', gridLineDashStyle: 'Dash',
    }, {
      opposite: true, title: { text: 'Mkt share', style: { color: 'rgb(163,163,163)', fontSize: '10px' } },
      labels: { formatter: function() { return this.value.toFixed(2) + '%'; }, style: { color: 'rgb(163,163,163)', fontSize: '10px' } },
      gridLineWidth: 0, max: shareMax,
    }],
    legend: { enabled: false },
    plotOptions: { column: { stacking: 'normal', borderRadius: 0, pointPadding: 0.08, groupPadding: 0.2 } },
    // One component per hover, matching the trend chart beside it.
    tooltip: { shared: false },
    series: [
      ...colSeries,
      { type: 'scatter', name: 'Mkt Share', data: shareData, yAxis: 1, color: 'rgb(249,115,22)',
        marker: { symbol: 'diamond', fillColor: 'rgb(249,115,22)', lineColor: '#fff', lineWidth: 1, radius: 5 } },
    ],
  }), [colSeries, shareData, scale, shareScale, metric, dim]);

  return <div style={{ height: 220 }}><HC options={opts} /></div>;
}

/* Tables */
// 17 sales reps spanning all 5 regions. Sum: mkt = $1,215B, yours = $449.6B — ties to FIRM_ROWS and CAT_ROWS.
const REP_ROWS = [
  { name: 'John Doe',      region: 'Northeast', mkt: '$181B', yours: '$80.9B', share: '44.7%', dot: 'rgb(52,211,153)' },
  { name: 'Jane Doe',      region: 'West',      mkt: '$157B', yours: '$48.6B', share: '30.9%', dot: 'rgb(59,130,246)' },
  { name: 'John Smith',   region: 'West',      mkt: '$102B', yours: '$39.2B', share: '38.4%', dot: 'rgb(59,130,246)' },
  { name: 'Jane Smith',   region: 'Midwest',   mkt: '$105B', yours: '$36.1B', share: '34.4%', dot: 'rgb(234,179,8)' },
  { name: 'John Roe',  region: 'Midwest',   mkt: '$70B',  yours: '$21.1B', share: '30.1%', dot: 'rgb(234,179,8)' },
  { name: 'Jane Roe',     region: 'Southwest', mkt: '$67B',  yours: '$24.2B', share: '36.1%', dot: 'rgb(139,92,246)' },
  { name: 'Mary Doe',      region: 'Northeast', mkt: '$72B',  yours: '$32.0B', share: '44.4%', dot: 'rgb(52,211,153)' },
  { name: 'Mark Smith',    region: 'Southeast', mkt: '$62B',  yours: '$18.0B', share: '29.0%', dot: 'rgb(249,115,22)' },
  { name: 'Sarah Roe',       region: 'Midwest',   mkt: '$55B',  yours: '$24.0B', share: '43.6%', dot: 'rgb(234,179,8)' },
  { name: 'Michael Brown',  region: 'Southwest', mkt: '$50B',  yours: '$21.0B', share: '42.0%', dot: 'rgb(139,92,246)' },
  { name: 'Emily Brown',   region: 'West',      mkt: '$48B',  yours: '$14.0B', share: '29.2%', dot: 'rgb(59,130,246)' },
  { name: 'Robert Jones',      region: 'Northeast', mkt: '$47B',  yours: '$19.6B', share: '41.7%', dot: 'rgb(52,211,153)' },
  { name: 'Chris Public',   region: 'Southeast', mkt: '$45B',  yours: '$19.0B', share: '42.2%', dot: 'rgb(249,115,22)' },
  { name: 'Linda Jones',      region: 'Northeast', mkt: '$42B',  yours: '$17.0B', share: '40.5%', dot: 'rgb(52,211,153)' },
  { name: 'Pat Public',      region: 'Midwest',   mkt: '$38B',  yours: '$11.0B', share: '28.9%', dot: 'rgb(234,179,8)' },
  { name: 'Alex Sample',         region: 'West',      mkt: '$38B',  yours: '$15.0B', share: '39.5%', dot: 'rgb(59,130,246)' },
  { name: 'Sam Sample',      region: 'Southeast', mkt: '$36B',  yours: '$8.9B',  share: '24.7%', dot: 'rgb(249,115,22)' },
];

/* One grid, any dimension. The header carries the dimension swap + measure pills. */
function DimTable({ dim, onDimChange, rows, metric, setMetric, selected, onRowClick, onRowDrill }) {
  const cfg = DIMS[dim];
  const n = (rows || []).length;
  const [sorted, sort, onSort] = useSortableRows(rows || [], 'mkt');
  return (
    <Tile style={{ minHeight: 0, minWidth: 0, height: '100%' }} pad={0}>
      <TableHeader
        dim={dim} onDimChange={onDimChange}
        count={`${n} ${n === 1 ? cfg.unit1 : cfg.unit}`}
        tab={metric} setTab={setMetric}
      />
      <div style={SCROLL_BODY_STYLE}>
      <table style={tableStyle}>
        <thead style={{ position:'sticky', top:0, background:'rgb(20,28,42)', zIndex:1 }}>
          <tr style={thTr}>
            <SortTh label={cfg.col} col="name" sort={sort} onSort={onSort} />
            {cfg.channel && <th style={th}>CH.</th>}
            <SortTh label={METRIC_LABEL[metric]} col="mkt" sort={sort} onSort={onSort} align="right" />
            <SortTh label={METRIC_LABEL_YOURS[metric]} col="yours" sort={sort} onSort={onSort} align="right" />
            <SortTh label="MKT SHARE" col="share" sort={sort} onSort={onSort} align="right" />
            <th style={{width:30}}></th>
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 && (
            <tr><td colSpan={cfg.channel ? 6 : 5} style={{ padding:'22px 16px', textAlign:'center', fontFamily:'Inter', fontSize:11.5, color:'rgb(107,114,128)' }}>
              No {cfg.unit} match the current selection
            </td></tr>
          )}
          {sorted.map(r => {
            const sel = selected.includes(r.name);
            const sub = r.region || r.sub;
            return (
            <tr key={r.name} style={rowStyle(sel)} onClick={() => onRowClick(r.name)}>
              <td style={{...tdCell, borderLeft: sel ? '3px solid rgb(16,185,129)':'3px solid transparent'}}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  {r.badge && <span style={{
                    width:22, height:18, borderRadius:4, background:'rgba(255,255,255,0.08)',
                    border:'1px solid rgba(75,85,99,0.6)', flexShrink:0,
                    display:'inline-flex', alignItems:'center', justifyContent:'center',
                    fontSize:9, fontWeight:700, color:'rgb(209,213,219)', letterSpacing:0.5,
                  }}>{r.badge}</span>}
                  {!r.badge && r.dot && <span style={{ width:6, height:6, borderRadius:9999, background:r.dot, flexShrink:0 }} />}
                  <span style={{
                    width:12, height:12, borderRadius:3, flexShrink:0,
                    border:`1px solid ${sel ? 'rgb(16,185,129)' : 'rgba(107,114,128,0.6)'}`,
                    background: sel ? 'rgb(16,185,129)' : 'transparent',
                    display:'inline-flex', alignItems:'center', justifyContent:'center',
                  }}>{sel && <i className="fa-solid fa-check" style={{ fontSize:6.5, color:'#fff' }} />}</span>
                  <span style={{ fontWeight: sel ? 700 : 500, color:'rgb(249,250,251)', whiteSpace:'nowrap' }}>{r.name}</span>
                  {sub && <span style={{ fontSize:10, color:'rgb(163,163,163)', whiteSpace:'nowrap' }}>{sub}</span>}
                </div>
              </td>
              {cfg.channel && (
                <td style={{ ...tdCell, padding:'6px 10px' }}><ChannelBadge ch={FIRM_CHANNELS[r.name] || '—'} /></td>
              )}
              <td style={tdN}>{r.mkt}</td>
              <td style={tdNStrong}>{r.yours}</td>
              <td style={tdN}>{r.share}</td>
              <td style={{...tdN, padding:'6px 10px'}}>
                <DrillBtn onClick={(e) => { e.stopPropagation(); onRowDrill(r); }} />
              </td>
            </tr>
          );})}
        </tbody>
      </table>
      </div>
    </Tile>
  );
}

const FIRM_ROWS = [
  // Sum: mkt = $1,215B, yours = $449.6B — matches REP_ROWS so the unfiltered totals tie across all 3 tables.
  { badge: 'CW', name: 'Contoso Wealth',  mkt: '$133B', yours: '$53.0B', share: '39.85%' },
  { badge: 'FF', name: 'Fabrikam Financial',     mkt: '$180B', yours: '$72.8B', share: '40.44%' },
  { badge: 'NS', name: 'Northwind Securities',             mkt: '$106B', yours: '$47.8B', share: '45.09%' },
  { badge: 'AP', name: 'Adatum Partners',   mkt: '$244B', yours: '$69.2B', share: '28.36%' },
  { badge: 'LA', name: 'Litware Advisors',      mkt: '$194B', yours: '$81.7B', share: '42.11%' },
  { badge: 'TC', name: 'Tailspin Capital',          mkt: '$143B', yours: '$38.2B', share: '26.71%' },
  { badge: 'PG', name: 'Proseware Group',           mkt: '$82B',  yours: '$26.7B', share: '32.56%' },
  { badge: 'WR', name: 'Wingtip RIA',   mkt: '$71B',  yours: '$33.6B', share: '47.32%' },
  { badge: 'TT', name: 'Trey Trust', mkt: '$62B',  yours: '$26.6B', share: '42.90%' },
];

/* Sortable column hook + sortable header cell */
function useSortableRows(rows, defaultCol, defaultDir = 'desc') {
  const [sort, setSort] = React.useState({ col: defaultCol, dir: defaultDir });
  const sorted = React.useMemo(() => {
    if (!sort.col) return rows;
    const out = [...rows];
    out.sort((a, b) => {
      const av = a[sort.col];
      const bv = b[sort.col];
      const an = typeof av === 'string' ? parseB(av) || parseFloat(av) || 0 : (av || 0);
      const bn = typeof bv === 'string' ? parseB(bv) || parseFloat(bv) || 0 : (bv || 0);
      // If numeric parse failed (text col), fall back to string compare
      if (typeof av === 'string' && isNaN(parseFloat(av)) && !av.match(/^\$|^[0-9]/)) {
        return sort.dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return sort.dir === 'asc' ? an - bn : bn - an;
    });
    return out;
  }, [rows, sort.col, sort.dir]);
  const onSort = (col) => {
    setSort(prev => prev.col === col
      ? { col, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
      : { col, dir: col === 'name' ? 'asc' : 'desc' });
  };
  return [sorted, sort, onSort];
}

function SortTh({ label, col, sort, onSort, align = 'left', style }) {
  const active = sort && sort.col === col;
  const arrow = !active ? '' : (sort.dir === 'asc' ? '▲' : '▼');
  return (
    <th
      onClick={() => onSort && onSort(col)}
      style={{
        ...(align === 'right' ? thN : th),
        cursor: 'pointer', userSelect: 'none',
        color: active ? 'rgb(229,231,235)' : 'rgb(107,114,128)',
        ...style,
      }}
    >
      <span style={{ display:'inline-flex', alignItems:'center', gap:4, whiteSpace:'nowrap', justifyContent: align === 'right' ? 'flex-end' : 'flex-start' }}>
        {label}
        <span style={{ fontSize: 8, opacity: active ? 1 : 0.35, width: 8 }}>{arrow || '↕'}</span>
      </span>
    </th>
  );
}

// Fixed body height so a grid keeps its footprint no matter how many rows the
// current selection leaves — nothing on the page shifts.
const SCROLL_BODY_STYLE = { flex: 1, minHeight: 120, overflow: 'auto' };

function ChannelBadge({ ch }) {
  const map = {
    Wires: { bg:'rgba(59,130,246,0.18)', c:'rgb(147,197,253)' },
    IBD:   { bg:'rgba(16,185,129,0.18)', c:'rgb(110,231,183)' },
    RIA:   { bg:'rgba(139,92,246,0.20)', c:'rgb(196,181,253)' },
    Bank:  { bg:'rgba(234,179,8,0.18)',  c:'rgb(253,224,71)' },
  };
  const s = map[ch] || { bg:'rgba(75,85,99,0.25)', c:'rgb(163,163,163)' };
  return <span style={{
    display:'inline-block', padding:'2px 7px', borderRadius:4,
    background: s.bg, color: s.c, fontFamily:'Inter', fontSize:9.5, fontWeight:700, letterSpacing:0.3,
  }}>{ch}</span>;
}

function catColorFor(name) {
  const map = {
    'Large Growth':'rgb(59,130,246)', 'Large Value':'rgb(96,165,250)',
    'Multi-sector Bond':'rgb(139,92,246)', 'Foreign Lg.':'rgb(14,165,233)',
    'Foreign Large Blend':'rgb(14,165,233)', 'Mid-Cap Growth':'rgb(45,212,191)',
    'Small Growth':'rgb(20,184,166)', 'EM':'rgb(45,212,191)',
    'Core Plus':'rgb(20,184,166)', 'Int. Core Plus':'rgb(139,92,246)',
    'Large Blend':'rgb(96,165,250)', 'Private Credit':'rgb(249,115,22)',
  };
  return map[name] || 'rgb(16,185,129)';
}

const CAT_ROWS = [
  // Sum: mkt = $1,215B, yours = $449.6B — matches REP_ROWS / FIRM_ROWS.
  { name: 'Large Growth',         mkt: '$410B', yours: '$152B',  share: '37.07%' },
  { name: 'Large Value',          mkt: '$220B', yours: '$81B',   share: '36.82%' },
  { name: 'Foreign Large Blend',  mkt: '$145B', yours: '$50B',   share: '34.48%' },
  { name: 'Mid-Cap Growth',       mkt: '$105B', yours: '$38B',   share: '36.19%' },
  { name: 'Global Large Stock',   mkt: '$100B', yours: '$35B',   share: '35.00%' },
  { name: 'Diversified Emerging', mkt: '$90B',  yours: '$28B',   share: '31.11%' },
  { name: 'Int. Core-Plus',       mkt: '$80B',  yours: '$33B',   share: '41.25%' },
  { name: 'Muni National Long',   mkt: '$65B',  yours: '$32.6B', share: '50.15%' },
];

function DrillBtn({ onClick }) {
  const [hover, setHover] = React.useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      title="Vehicle breakdown"
      style={{
        width:22, height:22, borderRadius:4,
        background: hover ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${hover ? 'rgb(16,185,129)' : 'rgba(75,85,99,0.5)'}`,
        color: hover ? 'rgb(52,211,153)' : 'rgb(163,163,163)',
        display:'inline-flex', alignItems:'center', justifyContent:'center',
        cursor:'pointer', transition:'all .12s',
      }}>
      <i className="fa-solid fa-up-right-from-square" style={{ fontSize:9 }} />
    </button>
  );
}

function TableHeader({ dim, onDimChange, count, tab, setTab }) {
  return (
    <div style={{ display:'flex', alignItems:'center', flexWrap:'wrap', gap:8, minWidth:0, padding:'12px 14px 10px', borderBottom:'1px solid rgba(75,85,99,0.3)' }}>
      <DimensionPicker variant="title" suffix=" View" value={dim} options={DIM_OPTIONS} onChange={onDimChange} />
      {count && <div style={{ fontFamily:'Inter', fontSize:10.5, color:'rgb(107,114,128)', whiteSpace:'nowrap' }}>{count}</div>}
      <div style={{ marginLeft:'auto' }} />
      <TabPills options={['AUM','Inflow','Net']} labels={METRIC_PILLS} value={tab} onChange={setTab} />
    </div>
  );
}

const tableStyle = { width:'100%', borderCollapse:'collapse', fontFamily:'Inter', fontSize:12 };
const thTr = { };
const th  = { textAlign:'left', fontSize:10, fontWeight:500, color:'rgb(200,205,213)', letterSpacing:0.5, textTransform:'uppercase', padding:'10px 16px 8px' };
const thN = { ...th, textAlign:'right' };
const tdCell = { padding:'8px 14px', color:'rgb(209,213,219)' };
const tdN = { padding:'8px 14px', textAlign:'right', color:'rgb(163,163,163)', fontVariantNumeric:'tabular-nums' };
const tdNStrong = { ...tdN, color:'rgb(52,211,153)' };

function rowStyle(selected) {
  return {
    borderTop: '1px solid rgba(75,85,99,0.2)',
    background: selected ? 'rgba(16,185,129,0.1)' : 'transparent',
    cursor: 'pointer',
    transition: 'background .12s',
  };
}

/* Build drill data for RowDrawer */
function drillDataForFirm(r) {
  // Parse the share to build synthetic vehicle breakdown
  const aum = r.yours;
  const shr = r.share;
  return {
    summary: {
      aum:     { mktOpp: r.mkt, yours: r.yours, share: r.share, yoy: '↑ 8.2%' },
      inflow:  { mktOpp: scaleDollar(r.mkt, 0.08), yours: scaleDollar(r.yours, 0.09), share: shr, yoy: '↑ 12.3%' },
      netflow: { mktOpp: scaleDollar(r.mkt, 0.027), yours: scaleDollar(r.yours, 0.031), share: shr, yoy: '↑ 14.6%' },
    },
    drill: {
      aum: [
        { v:'MF',       val: scaleDollar(aum, 0.45), opp: scaleDollar(r.mkt, 0.45), shr: '1.42%' },
        { v:'ETF',      val: scaleDollar(aum, 0.32), opp: scaleDollar(r.mkt, 0.32), shr: '2.82%' },
        { v:'SMA',      val: scaleDollar(aum, 0.15), opp: scaleDollar(r.mkt, 0.15), shr: '1.02%' },
        { v:'Privates', val: scaleDollar(aum, 0.08), opp: scaleDollar(r.mkt, 0.08), shr: '0.68%' },
      ],
      inflow: [
        { v:'MF',       val: scaleDollar(aum, 0.036), opp: scaleDollar(r.mkt, 0.040), shr: '0.18%' },
        { v:'ETF',      val: scaleDollar(aum, 0.028), opp: scaleDollar(r.mkt, 0.028), shr: '0.32%' },
        { v:'SMA',      val: scaleDollar(aum, 0.015), opp: scaleDollar(r.mkt, 0.015), shr: '0.12%' },
        { v:'Privates', val: scaleDollar(aum, 0.008), opp: scaleDollar(r.mkt, 0.008), shr: '0.08%' },
      ],
      netflow: [
        { v:'MF',       val: scaleDollar(aum, 0.013), opp: scaleDollar(r.mkt, 0.015), shr: '0.20%' },
        { v:'ETF',      val: scaleDollar(aum, 0.010), opp: scaleDollar(r.mkt, 0.010), shr: '0.36%' },
        { v:'SMA',      val: scaleDollar(aum, 0.005), opp: scaleDollar(r.mkt, 0.005), shr: '0.14%' },
        { v:'Privates', val: scaleDollar(aum, 0.003), opp: scaleDollar(r.mkt, 0.003), shr: '0.09%' },
      ],
    },
  };
}

function drillDataForRep(r) {
  return {
    summary: {
      aum:     { mktOpp: r.mkt, yours: r.yours, share: r.share, yoy: '↑ 9.4%' },
      inflow:  { mktOpp: scaleDollar(r.mkt, 0.08), yours: scaleDollar(r.yours, 0.09), share: r.share, yoy: '↑ 13.1%' },
      netflow: { mktOpp: scaleDollar(r.mkt, 0.027), yours: scaleDollar(r.yours, 0.031), share: r.share, yoy: '↑ 15.2%' },
    },
    drill: {
      aum: [
        { v:'MF',       val: scaleDollar(r.yours, 0.45), opp: scaleDollar(r.mkt, 0.45), shr: '1.82%' },
        { v:'ETF',      val: scaleDollar(r.yours, 0.30), opp: scaleDollar(r.mkt, 0.30), shr: '3.48%' },
        { v:'SMA',      val: scaleDollar(r.yours, 0.17), opp: scaleDollar(r.mkt, 0.17), shr: '1.20%' },
        { v:'Privates', val: scaleDollar(r.yours, 0.08), opp: scaleDollar(r.mkt, 0.08), shr: '0.90%' },
      ],
      inflow: [
        { v:'MF',       val: scaleDollar(r.yours, 0.036), opp: scaleDollar(r.mkt, 0.036), shr: '0.22%' },
        { v:'ETF',      val: scaleDollar(r.yours, 0.028), opp: scaleDollar(r.mkt, 0.028), shr: '0.38%' },
        { v:'SMA',      val: scaleDollar(r.yours, 0.014), opp: scaleDollar(r.mkt, 0.014), shr: '0.18%' },
        { v:'Privates', val: scaleDollar(r.yours, 0.007), opp: scaleDollar(r.mkt, 0.007), shr: '0.14%' },
      ],
      netflow: [
        { v:'MF',       val: scaleDollar(r.yours, 0.013), opp: scaleDollar(r.mkt, 0.013), shr: '0.24%' },
        { v:'ETF',      val: scaleDollar(r.yours, 0.010), opp: scaleDollar(r.mkt, 0.010), shr: '0.42%' },
        { v:'SMA',      val: scaleDollar(r.yours, 0.005), opp: scaleDollar(r.mkt, 0.005), shr: '0.20%' },
        { v:'Privates', val: scaleDollar(r.yours, 0.003), opp: scaleDollar(r.mkt, 0.003), shr: '0.12%' },
      ],
    },
  };
}

function drillDataForCat(r) {
  return {
    summary: {
      aum:     { mktOpp: r.mkt, yours: r.yours, share: r.share, yoy: '↑ 6.8%' },
      inflow:  { mktOpp: scaleDollar(r.mkt, 0.08), yours: scaleDollar(r.yours, 0.08), share: r.share, yoy: '↑ 10.4%' },
      netflow: { mktOpp: scaleDollar(r.mkt, 0.027), yours: scaleDollar(r.yours, 0.027), share: r.share, yoy: '↑ 12.1%' },
    },
    drill: {
      aum: [
        { v:'MF',       val: scaleDollar(r.yours, 0.44), opp: scaleDollar(r.mkt, 0.44), shr: '0.18%' },
        { v:'ETF',      val: scaleDollar(r.yours, 0.40), opp: scaleDollar(r.mkt, 0.40), shr: '0.42%' },
        { v:'SMA',      val: scaleDollar(r.yours, 0.12), opp: scaleDollar(r.mkt, 0.12), shr: '0.14%' },
        { v:'Privates', val: scaleDollar(r.yours, 0.04), opp: scaleDollar(r.mkt, 0.04), shr: '0.08%' },
      ],
      inflow: [
        { v:'MF',       val: scaleDollar(r.yours, 0.035), opp: scaleDollar(r.mkt, 0.035), shr: '0.14%' },
        { v:'ETF',      val: scaleDollar(r.yours, 0.032), opp: scaleDollar(r.mkt, 0.032), shr: '0.32%' },
        { v:'SMA',      val: scaleDollar(r.yours, 0.010), opp: scaleDollar(r.mkt, 0.010), shr: '0.10%' },
        { v:'Privates', val: scaleDollar(r.yours, 0.003), opp: scaleDollar(r.mkt, 0.003), shr: '0.06%' },
      ],
      netflow: [
        { v:'MF',       val: scaleDollar(r.yours, 0.013), opp: scaleDollar(r.mkt, 0.013), shr: '0.16%' },
        { v:'ETF',      val: scaleDollar(r.yours, 0.011), opp: scaleDollar(r.mkt, 0.011), shr: '0.36%' },
        { v:'SMA',      val: scaleDollar(r.yours, 0.004), opp: scaleDollar(r.mkt, 0.004), shr: '0.11%' },
        { v:'Privates', val: scaleDollar(r.yours, 0.001), opp: scaleDollar(r.mkt, 0.001), shr: '0.07%' },
      ],
    },
  };
}

/* Scale a dollar string like "$134.8B" or "$198M" by a factor, preserving unit */
function scaleDollar(s, factor) {
  if (!s) return '—';
  const num = parseFloat(s.replace(/[^0-9.]/g, ''));
  const unit = s.includes('B') ? 'B' : s.includes('M') ? 'M' : '';
  const v = num * factor;
  return '$' + (v >= 100 ? v.toFixed(0) : v.toFixed(1)) + unit;
}

Object.assign(window, { ManagementPage, LegendDots });
