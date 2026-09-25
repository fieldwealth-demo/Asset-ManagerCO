/* Sales Leadership dataset — national roll-up of the Level 2 / Level 3 book.
   Every external wholesaler covers a book of FA/Teams; each FA/Team is also
   assigned an internal (paired with the external) and a specialist (covering
   one or more regions). Leadership never sees the FA/Team rows directly —
   everything on the page is an aggregate of them — but building bottom-up
   keeps every region, salesperson, firm, vehicle, category and product cut
   tying back to the same totals. */

const ML_REGIONS = ['Northeast', 'Southeast', 'Midwest', 'Southwest', 'West'];
const ML_REGION_COLORS = { Northeast: 'rgb(52,211,153)', Southeast: 'rgb(249,115,22)', Midwest: 'rgb(234,179,8)', Southwest: 'rgb(167,139,250)', West: 'rgb(96,165,250)' };
const ML_TEAM = {
  Northeast: { ext: ['Morgan Vance', 'Jordan Ellis', 'Casey Reed'], int: ['Alex Kim', 'Sam Patel'] },
  Southeast: { ext: ['Taylor Brooks', 'Riley Hayes', 'Avery Cole'], int: ['Jamie Lin', 'Chris Ortiz'] },
  Midwest:   { ext: ['Quinn Parker', 'Drew Foster', 'Jesse Lane'], int: ['Pat Nguyen', 'Dana Wu'] },
  Southwest: { ext: ['Reese Morgan', 'Cameron Price'], int: ['Robin Shah'] },
  West:      { ext: ['Skyler Grant', 'Rowan Blake', 'Emerson Hale', 'Hayden Cruz'], int: ['Logan Diaz', 'Kerry Moss'] },
};
const ML_SPECS = [
  { name: 'Blair Sutton', regions: ['Northeast', 'Southeast'] },
  { name: 'Morgan Tate',  regions: ['Midwest', 'Southwest'] },
  { name: 'Parker Lowe',  regions: ['West'] },
];
const ML_ROLE_KEYS = ['ext', 'int', 'spec'];
const ML_ROLE_LABEL = { ext: 'Externals', int: 'Internals', spec: 'Specialists' };
const ML_ROLE_ONE = { ext: 'Wholesaler', int: 'Internal', spec: 'Specialist' };
const ML_ROLE_COLOR = { ext: 'rgb(52,211,153)', int: 'rgb(96,165,250)', spec: 'rgb(167,139,250)' };
const ML_REGION_SCALE = { Northeast: 1.25, Southeast: 1.0, Midwest: 0.9, Southwest: 0.72, West: 1.15 };
// Oldest → current month. Seasonality plus a gentle build through the year.
const ML_SEASON = [0.86, 0.9, 1.0, 0.96, 1.02, 0.88, 0.8, 0.86, 1.08, 1.14, 1.12, 1.0].map((v, i) => v * (0.9 + i * 0.018));
/* Share of the year elapsed, by day count. Annual goals prorate on this and
   the period sales in the dataset are built on the same fractions. */
const ML_PK_FRAC = (() => {
  const n = new Date(), y = n.getFullYear(), day = 864e5;
  const d = (from) => Math.floor((new Date(y, n.getMonth(), n.getDate()) - from) / day) + 1;
  return { MTD: n.getDate() / 365, QTD: d(new Date(y, Math.floor(n.getMonth() / 3) * 3, 1)) / 365, YTD: d(new Date(y, 0, 1)) / 365, 'Rolling 12': 1 };
})();
const ML_FAMILIES = ['Advantage', 'Focus product', 'Growth', 'Recovery', 'Coverage'];
const ML_FAM_COLORS = { Advantage: 'rgb(52,211,153)', 'Focus product': 'rgb(96,165,250)', Growth: 'rgb(251,191,36)', Recovery: 'rgb(244,114,182)', Coverage: 'rgb(167,139,250)' };

const ML_PEOPLE = (() => {
  const out = [];
  ML_REGIONS.forEach(rg => {
    ML_TEAM[rg].ext.forEach(n => out.push({ name: n, role: 'ext', regions: [rg] }));
    ML_TEAM[rg].int.forEach(n => out.push({ name: n, role: 'int', regions: [rg] }));
  });
  ML_SPECS.forEach(s => out.push({ name: s.name, role: 'spec', regions: s.regions }));
  const r = lvRng(8080);
  out.forEach(p => { p.skill = Math.round((0.2 + r() * 0.75) * 100) / 100; });
  const mv = out.find(p => p.name === 'Morgan Vance'); if (mv) mv.skill = 0.72;
  return out;
})();
const ML_SKILL = ML_PEOPLE.reduce((a, p) => (a[p.name] = p.skill, a), {});

const mlCatOf = (k) => (k <= 0 ? 'Prospect' : k < 210 ? 'Dabbler' : 'Producer');
function mlFocusGroupEarly(cat) {
  const nz = (n) => String(n || '').toLowerCase().replace(/^(int\.|intermediate)\s*/, '').replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
  const g = (window.FOCUS_GROUPS || []).find(x => x.cats.some(c => nz(c) === nz(cat)));
  return g ? g.key : 'Non-focus';
}
function mlSpread(n, r) {
  const m = new Array(12).fill(0);
  const tot = ML_SEASON.reduce((a, x) => a + x, 0);
  for (let i = 0; i < n; i++) {
    let x = r() * tot, k = 0;
    while (k < 11 && x > ML_SEASON[k]) { x -= ML_SEASON[k]; k++; }
    m[k] += 1;
  }
  return m;
}

const ML_ROWS = (() => {
  const out = [];
  let seed = 1;
  ML_REGIONS.forEach(region => {
    const t = ML_TEAM[region];
    const spec = ML_SPECS.find(s => s.regions.includes(region)).name;
    t.ext.forEach((ext, ei) => {
      // Each territory covers roughly 300-350 focus FA/Teams.
      const bookN = 300 + ((ei * 17 + ML_REGIONS.indexOf(region) * 11) % 51);
      const int = t.int[ei % t.int.length];
      const sk = ML_SKILL[ext], ik = ML_SKILL[int], spk = ML_SKILL[spec];
      for (let i = 0; i < bookN; i++) {
        const r = lvRng(7001 + (seed++) * 131);
        const type = r() < 0.4 ? 'Team' : 'FA';
        const firm = lvPick(r, LV_ALL_FIRMS), channel = lvPick(r, LV_ALL_CHANNELS);
        const size = Math.pow(r(), 1.9);
        const oppIn = Math.round(ML_REGION_SCALE[region] * 0.52 * (6 + size * 300) * 10) / 10;
        const oppAum = Math.round(oppIn * (7 + r() * 4));
        const oppNet = Math.round(oppIn * (0.3 + r() * 0.4) * 10) / 10;
        const q = Math.min(1, r() * 0.62 + sk * 0.38 + size * 0.1);
        const tier = q < 0.3 ? 'Prospect' : q < 0.52 ? 'Dabbler' : 'Producer';
        const shareIn = tier === 'Prospect' ? 0 : tier === 'Dabbler' ? 0.001 + Math.pow(r(), 2) * 0.004 : 0.008 + Math.pow(q, 1.6) * 0.03 * (0.5 + r());
        const yoursIn = oppIn * shareIn;
        const yoursAum = tier === 'Prospect' ? 0 : yoursIn * (2.6 + r() * 2.4);
        const netRatio = tier === 'Prospect' ? 0 : (r() < 0.2 ? -(0.2 + r() * 0.5) : 0.2 + r() * 0.6);
        const yoursNet = yoursIn * netRatio;
        const r12K = Math.round(yoursIn * 1000 * (1 + r() * 0.15));
        let prior12K, lapseM = null, winM = null;
        if (r12K === 0) {
          if (r() < 0.22) { prior12K = Math.round(40 + Math.pow(r(), 1.5) * 900); lapseM = Math.floor(r() * 10); } else prior12K = 0;
        } else if (r() < 0.14) { prior12K = 0; winM = 1 + Math.floor(r() * 10); }
        else prior12K = Math.round(r12K * (0.68 + r() * 0.55 - (sk - 0.5) * 0.35));
        const sales = {
          MTD: Math.round(r12K * ML_PK_FRAC.MTD * (0.3 + r() * 1.4)),
          QTD: Math.round(r12K * ML_PK_FRAC.QTD * (0.45 + r() * 1.1)),
          YTD: Math.round(r12K * ML_PK_FRAC.YTD * (0.84 + r() * 0.32)),
          'Rolling 12': r12K,
        };
        const prodCat = r12K === 0 ? 'Prospect' : r12K < 210 ? 'Dabbler' : 'Producer';
        const n = 2 + Math.floor(r() * 3);
        const picks = LV_CATALOG.slice().sort(() => r() - 0.5).slice(0, n);
        const ws = picks.map(() => 0.3 + r());
        const wt = ws.reduce((a, x) => a + x, 0);
        const mix = picks.map((p, j) => ({ product: p.name, vehicle: p.vehicle, cat: p.cat, w: ws[j] / wt }));
        const lift = tier === 'Producer' ? 1.35 : tier === 'Dabbler' ? 0.9 : 0.45;
        const untouched = tier === 'Prospect' && r() < 0.3;
        const specFit = mix.some(h => h.vehicle === 'SMAs' || h.vehicle === 'Privates');
        const base = { ext: 3.2 * (0.55 + sk * 0.9), int: 3.6 * (0.55 + ik * 0.9), spec: (specFit ? 1.7 : 0.3) * (0.55 + spk * 0.9) };
        const act = {}, actM = {}, days = {};
        ML_ROLE_KEYS.forEach(k => {
          const c = untouched ? 0 : Math.max(0, Math.round(base[k] * lift * (0.45 + r() * 1.1)));
          act[k] = c; actM[k] = mlSpread(c, r);
          days[k] = c ? Math.max(2, Math.round((4 + Math.pow(r(), 1.9) * 300) / (0.6 + sk))) : null;
        });
        const eng = Math.round((0.3 + q) * r() * 9);
        const engM = mlSpread(eng, r);
        const head = Math.max(oppIn - yoursIn, 1);
        const nSig = tier === 'Producer' ? 1 + Math.floor(r() * 4) : tier === 'Dabbler' ? 1 + Math.floor(r() * 3) : Math.floor(r() * 3);
        const signals = [];
        for (let s = 0; s < nSig; s++) {
          let type = lvPick(r, LV_SIG_TYPES);
          if (tier === 'Prospect' && ['Upsell', 'Cross-sell', 'Retention Risk', 'Fallen Angel'].includes(type)) type = 'Focus: Core Equity ETF';
          const conf = 50 + Math.round(Math.pow(r(), 0.85) * 45);
          const opp = Math.round(head * (0.004 + r() * 0.016) * 10) / 10;
          const actioned = r() < 0.25 + sk * 0.55;
          const met = actioned && r() < 0.6;
          const won = met && r() < (conf / 100) * 0.55;
          signals.push({ type, family: LV_SIG_META[type].group, conf, opp, actioned, met, won, wonK: won ? Math.round(opp * 1000 * (0.25 + r() * 0.6)) : 0 });
        }
        const nProd = prodCat === 'Prospect' ? 0 : prodCat === 'Dabbler' ? (r() < 0.8 ? 1 : 2) : Math.max(1, mix.length - (r() < 0.35 ? 1 : 0));
        out.push({
          id: `ml-${seed}`, nProd, region, ext, int, spec, type, firm, channel,
          oppAum, oppIn, oppNet, yoursAum, yoursIn, yoursNet, netRatio,
          r12K, prior12K, lapseM, winM, sales, prodCat, prodBand: lvBand(r12K),
          mix, act, actM, days, eng, engM, signals,
          addr: head * (0.45 + r() * 0.55), count: 1, focus: true,
        });
      }
      /* The rest of the territory: 5-10k FA/Teams the salesperson does not
         actively cover. Carried as 120 aggregate rows, each standing for a
         block of small FA/Teams (count), so totals and counts are complete
         without rendering thousands of rows. */
      const terrN = 5500 + ((ei * 1319 + ML_REGIONS.indexOf(region) * 977) % 3500);
      const per = Math.round((terrN - bookN) / 120);
      for (let j = 0; j < 120; j++) {
        const r = lvRng(90001 + (seed++) * 57);
        const roll = r();
        const tier = roll < 0.6 ? 'Prospect' : roll < 0.85 ? 'Dabbler' : 'Producer';
        const perOpp = ML_REGION_SCALE[region] * (1.5 + r() * 2.5);
        const oppIn = Math.round(perOpp * per * 10) / 10;
        const shareIn = tier === 'Prospect' ? 0 : tier === 'Dabbler' ? 0.002 + r() * 0.004 : 0.01 + r() * 0.02;
        const yoursIn = oppIn * shareIn;
        const r12K = Math.round(yoursIn * 1000);
        const prior12K = Math.round(r12K * (0.8 + r() * 0.4));
        const sales = {
          MTD: Math.round(r12K * ML_PK_FRAC.MTD * (0.6 + r() * 0.8)),
          QTD: Math.round(r12K * ML_PK_FRAC.QTD * (0.7 + r() * 0.6)),
          YTD: Math.round(r12K * ML_PK_FRAC.YTD * (0.88 + r() * 0.24)),
          'Rolling 12': r12K,
        };
        const perK = r12K / per;
        const picks = LV_CATALOG.slice().sort(() => r() - 0.5).slice(0, 2);
        const w0 = 0.4 + r() * 0.4;
        const mix = picks.map((p, k) => ({ product: p.name, vehicle: p.vehicle, cat: p.cat, w: k ? 1 - w0 : w0, focus: mlFocusGroupEarly(p.cat) }));
        const touched = Math.round(per * (0.02 + r() * 0.05));
        const act = { ext: Math.round(touched * 0.5), int: Math.round(touched * 1.3), spec: 0 };
        const actM = {}, days = { ext: null, int: null, spec: null };
        ML_ROLE_KEYS.forEach(k => { actM[k] = mlSpread(act[k], r); });
        const eng = Math.round(per * 0.03 * r());
        out.push({
          id: `ml-t${seed}`, nProd: tier === 'Prospect' ? 0 : tier === 'Dabbler' ? 1 : 1.4, region, ext, int, spec, type: 'Territory', firm: lvPick(r, LV_ALL_FIRMS), channel: lvPick(r, LV_ALL_CHANNELS),
          oppAum: oppIn * 8, oppIn, oppNet: oppIn * 0.5, yoursAum: yoursIn * 3.5, yoursIn, yoursNet: yoursIn * 0.3, netRatio: 0.3,
          r12K, prior12K, lapseM: null, winM: null, sales, prodCat: mlCatOf(perK), prodBand: lvBand(perK),
          mix, act, actM, days, eng, engM: mlSpread(eng, r), signals: [], addr: 0,
          count: per, focus: false, touched, segment: 'N',
        });
      }
    });
  });
  ML_REGIONS.forEach(rg => {
    const list = out.filter(x => x.region === rg && x.focus).sort((a, b) => b.addr - a.addr);
    list.forEach((x, i) => { const p = i / list.length; x.segment = p < 0.22 ? 'A' : p < 0.55 ? 'B' : 'C'; });
  });
  return out;
})();

/* Rolling-12 production at month m (0 oldest … 11 current), $k. */
function mlValAt(r, m) {
  if (r.lapseM != null) return m <= r.lapseM ? r.prior12K : 0;
  if (r.winM != null) return m < r.winM ? 0 : Math.round(r.r12K * ((m - r.winM + 1) / (12 - r.winM)));
  return Math.max(0, Math.round(r.prior12K + (r.r12K - r.prior12K) * ((m + 1) / 12)));
}
/* ---- cross-filter ---- */

const ML_DIMS = {
  region:   { label: 'Region',            of: r => r.region, order: () => ML_REGIONS, color: k => ML_REGION_COLORS[k] },
  person:   { label: 'Salesperson',       person: true },
  firm:     { label: 'Firm',              of: r => r.firm },
  channel:  { label: 'Channel',           of: r => r.channel, color: k => ({ Wirehouse: 'rgb(96,165,250)', BA: 'rgb(167,139,250)', IBD: 'rgb(251,191,36)', RIA: 'rgb(52,211,153)' }[k]) },
  vehicle:  { label: 'Vehicle',           mix: 'vehicle', order: () => LV_VEHICLES, color: k => ({ 'Mutual Funds': 'rgb(52,211,153)', ETFs: 'rgb(96,165,250)', SMAs: 'rgb(167,139,250)', Privates: 'rgb(251,191,36)' }[k]) },
  cat:      { label: 'Product category',  mix: 'cat', color: () => 'rgb(45,212,191)' },
  product:  { label: 'Product',           mix: 'product', label_: k => k.replace(/^Field /, ''), color: () => 'rgb(45,212,191)' },
  focus:    { label: 'Focus effort',      mix: 'focus', order: () => ['Franchise', 'Scale', 'Tactical', 'Non-focus'], color: k => ({ Franchise: 'rgb(52,211,153)', Scale: 'rgb(96,165,250)', Tactical: 'rgb(251,191,36)', 'Non-focus': 'rgb(148,163,184)' }[k]) },
  prodCat:  { label: 'Producer category', of: r => r.prodCat, order: () => LV_PROD_CATS, color: k => (k === 'Producer' ? 'rgb(52,211,153)' : k === 'Dabbler' ? 'rgb(251,191,36)' : 'rgb(148,163,184)') },
  prodBand: { label: 'Production threshold', of: r => r.prodBand, order: () => LV_PROD_BANDS.slice().reverse(), label_: k => (k === '$0' ? '$0 (prospect)' : k), color: k => LV_PROD_BAND_COLORS[k] },
  segment:  { label: 'Segment',           of: r => r.segment, order: () => LV_SEGMENTS, l3: true, label_: k => `Segment ${k}`, color: k => (LV_SEG_META[k] ? LV_SEG_META[k].dot : 'rgb(148,163,184)') },
};
const ML_XF_KEYS = Object.keys(ML_DIMS);
const ML_MIX_KEYS = ['vehicle', 'cat', 'product', 'focus'];
const mlEmptyXf = () => ML_XF_KEYS.reduce((a, k) => (a[k] = [], a), {});
const mlKeyOf = (r, dim, role) => (ML_DIMS[dim].person ? r[role] : ML_DIMS[dim].of(r));

const mlFocusNorm = (n) => String(n || '').toLowerCase().replace(/^(int\.|intermediate)\s*/, '').replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
function mlFocusGroup(cat) {
  const g = (window.FOCUS_GROUPS || []).find(x => x.cats.some(c => mlFocusNorm(c) === mlFocusNorm(cat)));
  return g ? g.key : 'Non-focus';
}
ML_ROWS.forEach(r => r.mix.forEach(h => { h.focus = mlFocusGroup(h.cat); }));

/* Sales goals are annual, set per salesperson territory (never by firm,
   product or category) from historical sales and market opportunity, then
   prorated by days elapsed. Each person's goal is spread across their book on
   the same history/opportunity blend, so region and national roll-ups sum.
   Results are deliberately mixed: a few well ahead, most near goal, a few
   behind. Goals and % to goal always read the full book (all products). */
(function mlBuildGoals() {
  const wOf = (r) => 0.7 * r.prior12K + 0.3 * r.oppIn * 1000 * 0.02 + 1;
  ML_ROWS.forEach(r => { r.goalA = {}; });
  ML_ROLE_KEYS.forEach(role => {
    const ppl = ML_PEOPLE.filter(p => p.role === role).sort((x, y) => y.skill - x.skill);
    ppl.forEach((p, i) => {
      const t = ppl.length > 1 ? i / (ppl.length - 1) : 0.5, sgn = 1 - 2 * t;
      const pct = 1.02 + 0.24 * Math.sign(sgn) * Math.pow(Math.abs(sgn), 1.8);
      const rows = ML_ROWS.filter(r => r[role] === p.name);
      const ytd = rows.reduce((x, r) => x + r.sales.YTD, 0);
      const annual = Math.round(ytd / (pct * ML_PK_FRAC.YTD) / 1000) * 1000;
      const wt = rows.reduce((x, r) => x + wOf(r), 0) || 1;
      rows.forEach(r => { r.goalA[role] = annual * (wOf(r) / wt); });
      p.goalA = annual;
    });
  });
})();
function mlGoal(rows, role, pk) {
  let annual = 0, act = 0;
  rows.forEach(r => { annual += r.goalA[role] || 0; act += r.sales[pk] || 0; });
  const goal = annual * ML_PK_FRAC[pk];
  return { goal, annual, act, pct: goal ? act / goal : 0 };
}
const mlGoalColor = (p) => (p >= 1 ? 'rgb(52,211,153)' : p >= 0.9 ? 'rgb(229,231,235)' : p >= 0.8 ? 'rgb(251,191,36)' : 'rgb(248,113,113)');

function mlMixW(row, xf, skip) {
  const f = ML_MIX_KEYS.filter(k => k !== skip && xf[k].length);
  if (!f.length) return 1;
  return row.mix.reduce((a, h) => a + (f.every(k => xf[k].includes(h[k])) ? h.w : 0), 0);
}
function mlPass(row, xf, role, skip) {
  for (const k of ML_XF_KEYS) {
    if (k === skip || ML_DIMS[k].mix || !xf[k].length) continue;
    if (!xf[k].includes(mlKeyOf(row, k, role))) return false;
  }
  return mlMixW(row, xf, skip) > 0;
}
const mlFilter = (rows, xf, role, skip) => rows.filter(r => mlPass(r, xf, role, skip));

/* ---- aggregation ---- */

function mlActual(row, measure, pk) {
  if (measure === 'AUM') return row.yoursAum * 1000;
  const s = row.sales[pk] || 0;
  return measure === 'Net Flows' ? s * row.netRatio : s;
}
function mlEmpty() {
  return { n: 0, focusN: 0, focusSales: 0, opp: 0, yours: 0, sales: 0, inflow: 0, prior: 0, acts: 0, covered: 0, stale: 0, producers: 0, dabblers: 0, prospects: 0, eng: 0, engaged: 0,
    sigN: 0, sigOpp: 0, sigAct: 0, sigMet: 0, sigWon: 0, wonK: 0, confW: 0, segA: 0, segB: 0, segC: 0, segAcov: 0, fam: {} };
}
function mlAdd(a, row, w, ctx) {
  const M = LV_MEASURES[ctx.measure];
  const c = row.count || 1;
  a.n += c;
  a.opp += row[M.opp] * w; a.yours += row[M.yours] * w;
  const act$ = mlActual(row, ctx.measure, ctx.pk) * w;
  a.sales += act$;
  a.inflow += (row.sales[ctx.pk] || 0) * w;
  a.prior += row.prior12K * ML_PK_FRAC[ctx.pk] * w;
  const ac = row.act[ctx.role];
  a.acts += ac * w;
  // Coverage, staleness and engagement are measured on the focus list the
  // salesperson actually covers; the rest of the territory is counted in n.
  if (row.focus) {
    a.focusN += 1; a.focusSales += act$;
    if (ac > 0) a.covered += 1;
    if (row.days[ctx.role] == null || row.days[ctx.role] > 90) a.stale += 1;
    if (row.eng > 0) a.engaged += 1;
  }
  a[row.prodCat === 'Producer' ? 'producers' : row.prodCat === 'Dabbler' ? 'dabblers' : 'prospects'] += c;
  a.eng += row.eng * w;
  if (row.segment === 'A') { a.segA += 1; if (ac > 0) a.segAcov += 1; }
  else if (row.segment === 'B') a.segB += 1;
  else if (row.segment === 'C') a.segC += 1;
  row.signals.forEach(s => {
    if (s.conf < ctx.minConf) return;
    a.sigN += 1; a.sigOpp += s.opp * w; a.confW += s.conf * s.opp * w;
    a.fam[s.family] = (a.fam[s.family] || 0) + s.opp * w;
    if (s.actioned) a.sigAct += 1;
    if (s.met) a.sigMet += 1;
    if (s.won) { a.sigWon += 1; a.wonK += s.wonK * w; }
  });
  return a;
}
function mlSum(rows, ctx, xf) {
  const a = mlEmpty();
  rows.forEach(r => { const w = xf ? mlMixW(r, xf) : 1; if (w > 0) mlAdd(a, r, w, ctx); });
  return a;
}

/* Bucket rows along a dimension. Mix dimensions (vehicle / category /
   product) split each FA/Team's figures on its product mix. */
function mlBuckets(rows, dim, ctx, xf) {
  const d = ML_DIMS[dim];
  const by = {};
  const get = (k) => (by[k] || (by[k] = { key: k, label: d.label_ ? d.label_(k) : k, color: (d.color && d.color(k)) || 'rgb(52,211,153)', ...mlEmpty() }));
  rows.forEach(r => {
    if (d.mix) {
      const other = ML_MIX_KEYS.filter(k => k !== d.mix && xf && xf[k].length);
      const acc = {};
      r.mix.forEach(h => { if (other.every(k => xf[k].includes(h[k]))) acc[h[d.mix]] = (acc[h[d.mix]] || 0) + h.w; });
      Object.entries(acc).forEach(([k, w]) => mlAdd(get(k), r, w, ctx));
    } else {
      const w = xf ? mlMixW(r, xf) : 1;
      if (w > 0) mlAdd(get(mlKeyOf(r, dim, ctx.role)), r, w, ctx);
    }
  });
  const keys = d.order ? d.order().filter(k => by[k]) : Object.keys(by);
  const out = keys.map(k => by[k]);
  return d.order ? out : out.sort((a, b) => b.inflow - a.inflow);
}

const mlPct = (x, y) => (y ? x / y : 0);
const ML_METRICS = {
  opp:       { label: 'Mkt opp.',          get: (a, M) => a.opp,                         fmt: (v, M) => M.fmt(v) },
  yours:     { label: 'Yours',             get: a => a.yours,                            fmt: (v, M) => M.fmt(v) },
  share:     { label: 'Mkt share',         get: a => mlPct(a.yours, a.opp),              fmt: v => lvFmtPct(Math.abs(v)) },
  sales:     { label: 'Actual sales',      get: a => a.sales,                            fmt: v => mlFmtK(v) },
  growth:    { label: 'Sales vs prior',    get: a => (a.prior ? (a.inflow - a.prior) / a.prior : 0), fmt: v => `${v >= 0 ? '+' : '−'}${Math.abs(v * 100).toFixed(0)}%`, diverge: true },
  prodPct:   { label: 'Producer %',        get: a => mlPct(a.producers, a.n),            fmt: v => `${Math.round(v * 100)}%` },
  perFA:     { label: 'Activities / focus FA', get: a => mlPct(a.acts, a.focusN),         fmt: v => v.toFixed(1) },
  coverage:  { label: 'Focus coverage %',  get: a => mlPct(a.covered, a.focusN),         fmt: v => `${Math.round(v * 100)}%` },
  engaged:   { label: 'Focus engaged %',   get: a => mlPct(a.engaged, a.focusN),         fmt: v => `${Math.round(v * 100)}%` },
  sigOpp:    { label: 'Signal opp.',       get: a => a.sigOpp,                           fmt: v => lvFmtM(v), l3: true },
  actioned:  { label: 'Signals actioned',  get: a => mlPct(a.sigAct, a.sigN),            fmt: v => `${Math.round(v * 100)}%`, l3: true },
  wonK:      { label: 'Signal-won sales',  get: a => a.wonK,                             fmt: v => mlFmtK(v), l3: true },
  segAcov:   { label: 'Seg A coverage',    get: a => mlPct(a.segAcov, a.segA),           fmt: v => `${Math.round(v * 100)}%`, l3: true },
};

// $k → $M/$B with sign for net flows.
const mlFmtK = (k) => (k < 0 ? '−' : '') + lvFmtM(Math.abs(k) / 1000);

/* Focus strategies only: each FA/Team re-cut to its focus-category share of
   the product mix. Everything that sums (opportunity, yours, sales, activity,
   engagement, signal opportunity) scales by that share; focus-product signals
   outside the focus categories drop. */
let _mlFocusCache = null, _mlFocusVer = -1;
function mlFocusRows() {
  if (_mlFocusCache && _mlFocusVer === window.FOCUS_VER) return _mlFocusCache;
  _mlFocusVer = window.FOCUS_VER;
  const focusSig = (t) => {
    if (!t.startsWith('Focus: ')) return true;
    const prod = t.slice(7);
    const c = LV_CATALOG.find(x => x.name.replace(/^Field /, '').startsWith(prod));
    return !!(c && isFocusCat(c.cat));
  };
  _mlFocusCache = ML_ROWS.map(r => {
    const mix = r.mix.filter(h => isFocusCat(h.cat));
    const w = mix.reduce((a, h) => a + h.w, 0);
    if (!w) return null;
    const sc = (v) => v * w;
    const sales = {};
    Object.keys(r.sales).forEach(k => { sales[k] = Math.round(r.sales[k] * w); });
    const act = {}, actM = {};
    ML_ROLE_KEYS.forEach(k => { act[k] = r.act[k] * w; actM[k] = r.actM[k].map(sc); });
    const r12K = Math.round(r.r12K * w);
    return {
      ...r, mix: mix.map(h => ({ ...h, w: h.w / w })),
      oppAum: sc(r.oppAum), oppIn: sc(r.oppIn), oppNet: sc(r.oppNet),
      yoursAum: sc(r.yoursAum), yoursIn: sc(r.yoursIn), yoursNet: sc(r.yoursNet),
      r12K, prior12K: Math.round(r.prior12K * w), sales, prodCat: mlCatOf(r12K), prodBand: lvBand(r12K),
      act, actM, eng: sc(r.eng), engM: r.engM.map(sc), addr: sc(r.addr),
      signals: r.signals.filter(s => focusSig(s.type)).map(s => ({ ...s, opp: sc(s.opp), wonK: sc(s.wonK) })),
    };
  }).filter(Boolean);
  return _mlFocusCache;
}

Object.assign(window, {
  mlFocusRows, mlGoal, mlGoalColor, mlFocusGroup, ML_SKILL,
  ML_REGIONS, ML_REGION_COLORS, ML_TEAM, ML_SPECS, ML_PEOPLE, ML_ROLE_KEYS, ML_ROLE_LABEL, ML_ROLE_ONE, ML_ROLE_COLOR,
  ML_ROWS, ML_DIMS, ML_XF_KEYS, ML_METRICS, ML_FAMILIES, ML_FAM_COLORS, ML_PK_FRAC,
  mlEmptyXf, mlKeyOf, mlMixW, mlPass, mlFilter, mlActual, mlEmpty, mlAdd, mlSum, mlBuckets, mlPct, mlFmtK, mlValAt, mlCatOf,
});
