/* ROI Center — one ledger of incremental flows, valued once, sliced by lens.
   Method (shared with Campaign Analytics):
   • Incremental sales = actual sales since the acted-on signal/activity less the
     FA/Team's run rate (prior-12-month average daily sales × days since), with
     days capped at the measurement window (default 180). Not-acted signals in the
     same band are the check. Acted on = meeting, event, connected call or 1:1 email.
   • Assets retained = redemptions avoided on acted-on Retention Risk signals vs.
     the comparison group's save rate.
   • Revenue value = flows × net management fee (gross less waivers / caps, by
     product) carried over the life of the assets: Σ (1 − redemption)^t ÷ (1 + discount)^t,
     with redemption by vehicle (MF/ETF, SMA, private funds), capped at 10 years.
   • Each dollar is counted once in the ledger; lenses (signals, activities,
     campaigns, data packs) are views of it and never add together.
   • Phase 1 has no sales or CRM data, so it reports Indicative results from the
     sales and share shown in the data packs; Measured results start in Phase 2. */

const ROI_LS = 'amp_roi_v2';
/* Demo ledger, $M per month since go-live (go-live Oct 2024; Phase 1 M1–3, Phase 2 M4, models M7).
   Steady state from year two is about 5% lift on gross sales. */
const ROI_LIVE_MAX = 24, ROI_GOLIVE = { y: 2024, m: 9 }; // m: 0 = Jan
const ROI_SERIES = {
  sig:  [0, 0, 0, 0, 1, 4, 8, 12, 15, 18, 20, 21, 22, 22, 23, 23, 23, 24, 24, 24, 25, 25, 25, 26],
  camp: [0, 0, 0, 0, 0, 0, 0, 1, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
  ret:  [0, 0, 0, 0, 1, 3, 4, 5, 6, 6, 7, 7, 7, 7, 7, 8, 8, 8, 8, 8, 8, 8, 8, 8],
  ind:  [0, 1, 2, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4], // indicative: share shift at flagged FA/Teams (data-pack sales, lagged)
};
// Standalone status-quo check: total sales above the 3-yr trend, from total sales only (not the ROI ledger)
const ROI_TREND_GAP = [0.002, 0.004, 0.006, 0.008, 0.012, 0.018, 0.026, 0.033, 0.039, 0.044, 0.048, 0.051, 0.052, 0.053, 0.054, 0.055, 0.055, 0.056, 0.056, 0.057, 0.057, 0.058, 0.058, 0.059];
const ROI_MLBL = (i) => { const t = ROI_GOLIVE.m + i; return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][t % 12] + ' ' + String(ROI_GOLIVE.y + Math.floor(t / 12)).slice(2); };
const ROI_PERIODS = { R12: 'Trailing 12 months', YTD: 'Year to date', Q: 'Last 3 months', ITD: 'Since go-live' };
const ROI_BACKTEST = { hitX: 1.6, months: 12, faTeams: 2140 }; // signal validation on history: flagged vs. unflagged sales vs. run rate
const ROI_WIN_F = { 90: 0.62, 180: 1, 365: 1.12 };
const ROI_VEH = [['mf', 'Mutual funds & ETFs', '25–33%, 3–4 yr life'], ['sma', 'SMAs', '~20%, 5 yr life'], ['pvt', 'Private funds', '7–10 yr life']];
const ROI_GROSS_SALES_M = 6200, ROI_AUM_M = 48000;

function roiPacks() {
  try {
    if (window.DP_PACKS && window.DP_DEFAULT_TIERS) return DP_PACKS.map(p => {
      const t = (p.tiers || []).find(x => x.n === DP_DEFAULT_TIERS[p.id]) || (p.tiers || [])[0] || {};
      return { id: p.id, name: p.name, provider: p.provider, cost: Math.round((t.price || 0) / 1000) };
    });
  } catch (e) {}
  return [{ id: 'ms', name: 'Morgan Stanley AIP', provider: 'Morgan Stanley', cost: 315 }, { id: 'lpl', name: 'LPL LEAP', provider: 'LPL Financial', cost: 250 }, { id: 'broadridge', name: 'Broadridge ETF', provider: 'Broadridge', cost: 165 }];
}
/* Share of ledger value each pack contributed to (equal split across the packs behind each signal). */
const ROI_PACK_W = { ssnc_office: 0.12, ssnc_teams: 0.10, ms: 0.26, ubs: 0.16, lpl: 0.14, broadridge: 0.07 };
const ROI_CRM_ONLY = 0.15; // value from signals built on the firm's own sales/CRM only (no pack)
/* Events come in as CRM campaigns (Phase 2); [name, cost $K, FA/Teams reached, followed up, lift $M at full scale] */
const ROI_EVENTS = [['Regional Advisor Summit · Boston', 85, 64, 41, 11.9], ['Wealth Management EDGE', 120, 48, 29, 8.2], ['Muni Income Forum · Chicago', 42, 31, 24, 10.1], ['Financial Advisor Expo · Dallas', 64, 55, 18, 3.7], ['Retirement Planning Roundtable', 18, 22, 9, 1.8]];
function roiCampaigns() {
  try { return (window.MK_SEED_CAMPAIGNS || []).filter(c => !c.fresh && c.measureLift !== false && c.liftD > 0).slice(0, 8); } catch (e) { return []; }
}
const roiCEAnnualK = (level) => (level >= 2 ? ROI_EVENTS.reduce((a, x) => a + x[1], 0) : 0) + (level >= 3 ? roiCampaigns().reduce((a, c) => a + (c.costK || 0) + 5, 0) : 0);
/* Signal types come from the Signals dashboard so names and phase gating always match. */
const roiSigTypes = (level) => { const all = window.LV_SIG_TYPES || ['Performance Advantage', 'Fee Advantage', 'Focus: Core Equity ETF', 'Focus: Muni Ladder SMA', 'Focus: Private Credit Fund', 'Upsell', 'Cross-sell', 'Fallen Angel', 'Retention Risk', 'Meeting Opportunity']; const ph = window.LV_PHASE_SIGS || { 1: ['Fee Advantage', 'Performance Advantage'], 2: ['Fee Advantage', 'Performance Advantage', 'Retention Risk', 'Fallen Angel'] }; return level >= 3 ? all : all.filter(t => (ph[level] || []).includes(t)); };

function roiDefaults() {
  const packCost = {}; roiPacks().forEach(p => { packCost[p.id] = p.cost; });
  return {
    live: 24, period: 'R12', scope: 'field', lens: 'signals', mode: 'revenue', creditBuild: false, goal: 15, mkt: 6, sqView: 'aum',
    eff: { whole: 25, prepHrs: 2, wRate: 150, leaders: 6, leadHrs: 6, lRate: 200, analystFte: 1.5, analystCost: 150 },
    feeBps: 46, disc: Math.round((window.MK_COC || 0.08) * 100), attrib: 100, win: 180,
    veh: { mf: { r: 30, mix: 75 }, sma: { r: 20, mix: 15 }, pvt: { r: 12, mix: 10 } },
    fieldFee: 250, internal: 0, packCost,
    tcb: { fte: 5, fteCost: 275, buildMonths: 15, runFte: 2, fieldMonths: 3, rptPeople: 4, rptHours: 8, rate: 150 },
    bc: { sales: ROI_GROSS_SALES_M, redemptions: 4800, tande: 3, on: { grow: true, target: true, redeem: true, mktg: true, report: false }, grow: 4, target: 2, flagged: 12, saved: 15, redirect: 10 },
  };
}
let __roiS = null;
function roiGet() {
  if (!__roiS) {
    const d = roiDefaults();
    try { const s = JSON.parse(localStorage.getItem(ROI_LS)); __roiS = s ? { ...d, ...s, tcb: { ...d.tcb, ...(s.tcb || {}) }, bc: { ...d.bc, ...(s.bc || {}), on: { ...d.bc.on, ...((s.bc || {}).on || {}) } }, packCost: { ...d.packCost, ...(s.packCost || {}) } } : d; } catch (e) { __roiS = d; }
  }
  return __roiS;
}
function roiSet(p) {
  __roiS = { ...roiGet(), ...p };
  try { localStorage.setItem(ROI_LS, JSON.stringify(__roiS)); } catch (e) {}
  window.dispatchEvent(new Event('roi-change'));
}
function roiReset() { __roiS = null; try { localStorage.removeItem(ROI_LS); } catch (e) {} roiGet(); window.dispatchEvent(new Event('roi-change')); }
function useRoi() {
  const [s, setS] = React.useState(roiGet());
  React.useEffect(() => { const f = () => setS(roiGet()); window.addEventListener('roi-change', f); return () => window.removeEventListener('roi-change', f); }, []);
  return [s, roiSet];
}
/* Navigate by hash; re-fires when the hash is already set (e.g. a second
   click after going back through the sidebar). */
function roiGoPage(id) { if (location.hash === '#' + id) window.dispatchEvent(new HashChangeEvent('hashchange')); else location.hash = id; }
function roiGo() {
  roiGoPage('roi');
}

/* ---- scope: national, region or wholesaler ----
   Lift follows each wholesaler's own FA/Teams. Data packs, the Field fee, internal
   resources and efficiency are split evenly across wholesalers; campaigns and events
   follow their members. Wholesalers always add up to the national total. */
let __roiShares = null;
function roiShares() {
  if (__roiShares) return __roiShares;
  const ppl = (window.ML_PEOPLE || []).filter(p => p.role === 'ext'), rows = window.ML_ROWS || [];
  const sales = {}, mem = {};
  rows.forEach(r => { sales[r.ext] = (sales[r.ext] || 0) + ((r.sales && r.sales['Rolling 12']) || 0); if (r.focus) mem[r.ext] = (mem[r.ext] || 0) + 1; });
  const lift = {}; ppl.forEach(p => { lift[p.name] = (sales[p.name] || 0) * (0.6 + 0.8 * (p.skill || 0.5)); });
  const norm = (o) => { const t = Object.values(o).reduce((a, x) => a + x, 0) || 1; const out = {}; ppl.forEach(p => { out[p.name] = (o[p.name] || 0) / t; }); return out; };
  __roiShares = { ppl, n: ppl.length, lift: norm(lift), sales: norm(sales), mem: norm(mem) };
  return __roiShares;
}
const roiViewOf = (s) => (s && s.view) || { region: 'National', person: '' };
function roiScopeOpt(view) {
  const S = roiShares();
  if (!S.n || !view || (view.region === 'National' && !view.person)) return {};
  const names = view.person ? [view.person] : S.ppl.filter(p => p.regions.includes(view.region)).map(p => p.name);
  if (!names.length) return {};
  const sum = (o) => names.reduce((a, n) => a + (o[n] || 0), 0);
  return { liftK: sum(S.lift), salesK: sum(S.sales), costK: names.length / S.n, ceK: sum(S.mem), n: names.length };
}
const roiViewLabel = (v) => (!v || (v.region === 'National' && !v.person) ? 'National' : v.person ? v.person : `${v.region} region`);
function roiFor(name, level, period = 'R12') { const s = roiGet(); return roiCalc(s, level, { period, ...(name ? roiScopeOpt({ region: 'National', person: name }) : {}) }); }

/* ---- engine ---- */
const ROI_LIFE_CAP = 10;
const roiPV1 = (r, d) => { let f = 0; for (let t = 0; t < ROI_LIFE_CAP; t++) f += Math.pow(1 - r / 100, t) / Math.pow(1 + d / 100, t); return f; };
const roiPV = (s) => { const v = s.veh || roiDefaults().veh; let w = 0, f = 0; Object.keys(v).forEach(k => { w += +v[k].mix || 0; f += (+v[k].mix || 0) * roiPV1(+v[k].r || 0, s.disc); }); return w ? f / w : 0; };
const roiRedeem = (s) => { const v = s.veh || roiDefaults().veh; let w = 0, r = 0; Object.keys(v).forEach(k => { w += +v[k].mix || 0; r += (+v[k].mix || 0) * (+v[k].r || 0); }); return w ? r / w : 0; };
function roiRange(period, live) {
  if (period === 'ITD') return [1, live];
  if (period === 'Q') return [Math.max(1, live - 2), live];
  if (period === 'YTD') { let a = live; while (a > 1 && (ROI_GOLIVE.m + a - 1) % 12 !== 0) a--; return [a, live]; }
  return [Math.max(1, live - 11), live];
}
function roiCalc(s, level, opt = {}) {
  const k = opt.liftK != null ? opt.liftK : (opt.scale || 1), kS = opt.salesK != null ? opt.salesK : k, kC = opt.costK != null ? opt.costK : (opt.scale || 1), kCE = opt.ceK != null ? opt.ceK : kC, live = Math.min(ROI_LIVE_MAX, opt.live || s.live || 24), att = s.attrib / 100, wf = ROI_WIN_F[s.win] || 1;
  const fee = s.feeBps / 10000, pv = roiPV(s), vpm = fee * pv; // $ value per $ of flows
  const lv = level >= 3 ? 1 : level === 2 ? 0.72 : 0;
  const packsK = Object.values(s.packCost).reduce((a, x) => a + (+x || 0), 0) * kC;
  const feeK = s.fieldFee * kC, intK = s.internal * kC, ceK = roiCEAnnualK(level) * kCE;
  const mon = Array.from({ length: live }, (_, i) => {
    const sig = ROI_SERIES.sig[i] * lv * att * wf * k, camp = (level >= 3 ? ROI_SERIES.camp[i] : 0) * att * wf * k, ret = (level >= 2 ? ROI_SERIES.ret[i] : 0) * att * k;
    const flows = sig + camp + ret;
    return { m: i + 1, lbl: ROI_MLBL(i), sig, camp, ret, flows, ind: ROI_SERIES.ind[i] * k, value: flows * vpm, indValue: ROI_SERIES.ind[i] * k * vpm, cField: feeK / 12000, cPacks: packsK / 12000, cInt: intK / 12000, cCE: ceK / 12000 };
  });
  const [a, b] = roiRange(opt.period || s.period, live), M = b - a + 1;
  const agg = { sig: 0, camp: 0, ret: 0, flows: 0, ind: 0 };
  mon.slice(a - 1, b).forEach(x => Object.keys(agg).forEach(q => { agg[q] += x[q]; }));
  const value = agg.flows * vpm, costField = feeK / 1000 * M / 12, costPacks = packsK / 1000 * M / 12, costInt = intK / 1000 * M / 12, costCE = ceK / 1000 * M / 12;
  const costTotal = costField + costPacks + costCE + costInt, cost = costTotal;
  const baseSales = ROI_GROSS_SALES_M * kS * M / 12;
  let cv = 0, cc = 0, pb = null; mon.forEach(x => { cv += x.value; cc += x.cField + x.cPacks + x.cCE + x.cInt; if (pb == null && cv > 0 && cv >= cc) pb = x.m; });
  const last = mon[live - 1], prev = mon[Math.max(0, live - 2)];
  const packValue = value * (1 - ROI_CRM_ONLY);
  const e = s.eff || roiDefaults().eff, t = s.tcb || roiDefaults().tcb, ks = kC;
  const effParts = { prep: e.whole * e.prepHrs * 46 * e.wRate / 1e6, lead: e.leaders * e.leadHrs * 12 * e.lRate / 1e6, data: e.analystFte * e.analystCost / 1e3 };
  Object.keys(effParts).forEach(q => { effParts[q] *= ks * M / 12; });
  const effValue = level >= 2 ? effParts.prep + effParts.lead + effParts.data : effParts.data;
  const buildAnn = t.runFte * t.fteCost / 1000, buildValue = s.creditBuild ? buildAnn * ks * M / 12 : 0;
  const full = true, totValue = value + (full ? effValue + buildValue : 0);
  // status quo: pre-Field sales run rate carried forward at the firm's own 3-year CAGR
  const sqMon = mon.map((x, i) => ROI_GROSS_SALES_M * kS / 12 * Math.pow(1 + (s.mkt || 0) / 100, (i + 0.5) / 12));
  // AUM: incremental assets accumulate month to month, less redemptions, so the gap compounds
  const rdm = roiRedeem(s) / 100 / 12; let inc = 0;
  const incAum = mon.map(x => (inc = inc * (1 - rdm) + x.sig + x.camp + x.ret + (level === 1 ? x.ind : 0)));
  const sqAum = mon.map((x, i) => ROI_AUM_M * kS * Math.pow(1 + (s.mkt || 0) / 100, (i + 1) / 12));
  const actAum = sqAum.map((v, i) => v + incAum[i]);
  const gapK = level >= 3 ? 1 : level === 2 ? 0.75 : 0.15;
  const actMon = mon.map((x, i) => sqMon[i] * (1 + ROI_TREND_GAP[i] * gapK));
  let tg = 0; const trendAum = actMon.map((v, i) => (tg = tg * (1 - rdm) + (v - sqMon[i])));
  const sqP = sqMon.slice(a - 1, b).reduce((u, v) => u + v, 0), actP = actMon.slice(a - 1, b).reduce((u, v) => u + v, 0);
  return {
    M, a, b, live, fee, pv, vpm, level, kL: k, kC, kCE, mon, last, prev, packsK, feeK, intK,
    flows: agg.flows, sig: agg.sig, camp: agg.camp, ret: agg.ret, ind: agg.ind,
    value, costField, costPacks, costInt, costCE, ceK, costTotal, cost, baseSales, effParts, effValue, buildValue, buildAnn, totValue, full, sqMon, actMon, sqP, actP, sqAum, actAum, incAum, trendAum,
    liftPct: baseSales ? (agg.sig + agg.camp) / baseSales : 0,
    net: totValue - cost, roiX: cost ? totValue / cost : 0, roiField: costField ? totValue / costField : 0, roiTotal: costTotal ? totValue / costTotal : 0,
    packValue, roiPacks: costPacks ? packValue / costPacks : 0, paybackField: pb,
    runRateFlows: last.flows * 12, runRateValue: last.flows * 12 * vpm,
    measured: level >= 2 && agg.flows > 0, periodLbl: `${ROI_PERIODS[opt.period || s.period]} · ${mon[a - 1].lbl}–${mon[b - 1].lbl}`,
  };
}

/* ---- formatting + atoms ---- */
const roiM = (m, d) => { const a = Math.abs(m), s = m < 0 ? '−' : ''; if (a >= 1000) return `${s}$${(a / 1000).toFixed(d == null ? 2 : d)}B`; if (a >= 1) return `${s}$${a.toFixed(d == null ? (a >= 100 ? 0 : 1) : d)}M`; if (a > 0) return `${s}$${Math.round(a * 1000)}K`; return '$0'; };
const roiK = (k) => roiM(k / 1000);
const roiX = (x) => `${x.toFixed(1)}x`;
const ROI_C = { ink: 'rgb(249,250,251)', mut: 'rgb(163,163,163)', dim: 'rgb(200,205,213)', line: 'rgba(75,85,99,0.35)', acc: 'rgb(52,211,153)', grn: 'rgb(16,185,129)', amb: 'rgb(251,191,36)', blu: 'rgb(96,165,250)', red: 'rgb(248,113,113)', vio: 'rgb(196,181,253)' };
const roiA = (rgb, a) => rgb.replace('rgb(', 'rgba(').replace(')', `,${a})`);

function RoiTag({ kind }) {
  const T = { measured: ['Measured', ROI_C.acc], indicative: ['Indicative', ROI_C.amb], backtest: ['Validation', ROI_C.blu], estimate: ['Estimate', ROI_C.vio], p2: ['Phase 2', 'rgb(156,163,175)'], p3: ['Phase 3', 'rgb(156,163,175)'] }[kind] || [kind, ROI_C.mut];
  const tip = { measured: 'From your sales and CRM data, normalized to each FA/Team\'s run rate', indicative: 'From sales and share shown in the data packs; no CRM, so we can\'t see who acted', backtest: 'Signals replayed on your history at Phase 2 go-live: tests the signals, not the team, so it is not counted as ROI', estimate: 'Business case from the working session; the target Field measures against' }[kind];
  return <span title={tip} style={{ display: 'inline-flex', alignItems: 'center', height: 18, padding: '0 7px', borderRadius: 4, background: roiA(T[1], 0.12), border: `1px solid ${roiA(T[1], 0.45)}`, color: T[1], fontFamily: 'Inter', fontSize: 9.5, fontWeight: 700, letterSpacing: 0.3, whiteSpace: 'nowrap' }}>{T[0]}</span>;
}
function RoiKpi({ label, value, sub, tag, strong, tone }) {
  return (
    <div style={{ minWidth: 0, padding: '14px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.035)', border: `1px solid ${strong ? 'rgba(16,185,129,0.45)' : 'rgba(75,85,99,0.4)'}`, display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'space-between' }}>
        <span style={{ fontFamily: 'Inter', fontSize: 10, fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase', color: ROI_C.dim }}>{label}</span>{tag && <RoiTag kind={tag} />}
      </div>
      <div style={{ fontFamily: "'Inter Display', Inter", fontSize: 24, fontWeight: 600, color: tone || (strong ? ROI_C.acc : ROI_C.ink), fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em' }}>{value}</div>
      {sub && <div style={{ fontFamily: 'Inter', fontSize: 11, color: ROI_C.mut, lineHeight: 1.4 }}>{sub}</div>}
    </div>
  );
}
function RoiLocked({ phase, text }) {
  return (
    <div style={{ padding: '40px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textAlign: 'center' }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="fa-solid fa-lock" style={{ color: ROI_C.acc, fontSize: 14 }} /></div>
      <div style={{ fontFamily: 'Inter', fontSize: 14, fontWeight: 600, color: ROI_C.ink }}>Turns on in Phase {phase}</div>
      <div style={{ fontFamily: 'Inter', fontSize: 12, color: ROI_C.mut, maxWidth: 520, lineHeight: 1.55 }}>{text}</div>
    </div>
  );
}
const roiTh = { fontFamily: 'Inter', fontSize: 9.5, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', color: ROI_C.dim, textAlign: 'right', padding: '10px 8px', borderBottom: `1px solid ${ROI_C.line}`, whiteSpace: 'nowrap' };
const roiTd = { fontFamily: 'Inter', fontSize: 12, color: 'rgb(209,213,219)', textAlign: 'right', padding: '9px 8px', borderBottom: '1px solid rgba(75,85,99,0.16)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' };
function RoiTable({ head, rows, total, note }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead><tr>{head.map((h, i) => <th key={i} title={h.tip} style={{ ...roiTh, textAlign: i ? 'right' : 'left', paddingLeft: i ? 8 : 18, paddingRight: i === head.length - 1 ? 18 : 8 }}>{h.l || h}</th>)}</tr></thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri} style={{ opacity: r.dim ? 0.55 : 1 }}>
              {r.cells.map((c, i) => <td key={i} style={{ ...roiTd, textAlign: i ? 'right' : 'left', paddingLeft: i ? 8 : 18, paddingRight: i === r.cells.length - 1 ? 18 : 8, color: i ? roiTd.color : ROI_C.ink, fontSize: i ? 12 : 12.5 }}>{c}</td>)}
            </tr>
          ))}
          {total && <tr style={{ background: 'rgba(255,255,255,0.03)' }}>{total.map((c, i) => <td key={i} style={{ ...roiTd, borderBottom: 'none', textAlign: i ? 'right' : 'left', paddingLeft: i ? 8 : 18, paddingRight: i === total.length - 1 ? 18 : 8, fontWeight: 700, color: ROI_C.ink }}>{c}</td>)}</tr>}
        </tbody>
      </table>
      {note && <div style={{ padding: '10px 18px 14px', fontFamily: 'Inter', fontSize: 11, color: ROI_C.mut, lineHeight: 1.55 }}>{note}</div>}
    </div>
  );
}
const roiLiftCell = (x) => <span style={{ fontWeight: 700, color: x >= 1.5 ? ROI_C.acc : 'rgb(209,213,219)' }}>{roiX(x)}</span>;
const roiPos = (m) => <span style={{ fontWeight: 600, color: m > 0 ? ROI_C.acc : ROI_C.mut }}>{m > 0 ? '+' : ''}{roiM(m)}</span>;

/* ---- charts ---- */
function roiWaterfall(r, s) {
  const red = (name, y) => ({ name, y: -y, color: roiA(ROI_C.red, 0.3), borderColor: ROI_C.red });
  const costs = [red('Less data packs', r.costPacks), ...(r.costCE ? [red('Less campaigns & events', r.costCE)] : []), red('Less Field fee', r.costField), ...(r.costInt ? [red('Less internal', r.costInt)] : [])];
  const eff = r.full ? [{ name: 'Efficiency (capacity)', y: r.effValue, color: roiA(ROI_C.vio, 0.35), borderColor: ROI_C.vio }, ...(r.buildValue ? [{ name: 'Build cost avoided', y: r.buildValue, color: roiA(ROI_C.vio, 0.25), borderColor: ROI_C.vio }] : []), { name: 'Total value', isSum: true, color: roiA(ROI_C.vio, 0.55), borderColor: ROI_C.vio }] : [];
  const pts = r.level === 1 ? [
    { name: 'Indicative value', y: r.ind * r.vpm, color: roiA(ROI_C.amb, 0.35), borderColor: ROI_C.amb },
    ...(r.full ? [{ name: 'Efficiency', y: r.effValue + r.buildValue, color: roiA(ROI_C.vio, 0.35), borderColor: ROI_C.vio }] : []),
    ...costs, { name: 'Net value', isSum: true, color: roiA(ROI_C.blu, 0.6), borderColor: ROI_C.blu },
  ] : [
    { name: 'Sales lift', y: (r.sig + r.camp) * r.vpm, color: roiA(ROI_C.grn, 0.45), borderColor: ROI_C.grn },
    { name: 'Assets retained', y: r.ret * r.vpm, color: roiA(ROI_C.grn, 0.3), borderColor: ROI_C.grn },
    { name: 'Revenue value', isSum: true, color: roiA(ROI_C.grn, 0.7), borderColor: ROI_C.acc },
    ...eff, ...costs, { name: 'Net value', isSum: true, color: roiA(ROI_C.blu, 0.6), borderColor: ROI_C.blu },
  ];
  return {
    chart: { type: 'waterfall', height: 270 },
    xAxis: { type: 'category', labels: { style: { fontSize: '10.5px' }, autoRotation: false } },
    yAxis: { labels: { formatter() { return roiM(this.value, 1); } } },
    legend: { enabled: false },
    tooltip: { formatter() { return `<b>${this.point.name}</b><br/>${roiM(this.y)}`; } },
    plotOptions: { waterfall: { borderWidth: 1.5, borderRadius: 2, dataLabels: { enabled: true, formatter() { return roiM(this.y, 1); }, style: { color: 'rgb(229,231,235)', fontSize: '10px', fontWeight: '600', textOutline: 'none' } } } },
    series: [{ data: pts, upColor: roiA(ROI_C.grn, 0.45), color: roiA(ROI_C.red, 0.3) }],
  };
}
function roiTrend(r, s) {
  const cats = r.mon.map(x => x.lbl), L1 = r.level === 1;
  const val = r.mon.map(x => (L1 ? x.indValue : x.value));
  return {
    chart: { height: 270 },
    xAxis: { categories: cats, labels: { step: r.live > 12 ? 2 : 1 }, plotBands: [{ from: r.a - 1.5, to: r.b - 0.5, color: 'rgba(16,185,129,0.06)', label: { text: ROI_PERIODS[s.period], style: { color: ROI_C.dim, fontSize: '9.5px' }, y: 12 } }] },
    yAxis: { labels: { formatter() { return roiM(this.value, 2); } } },
    tooltip: { shared: true, formatter() { return `<b>${this.x}</b><br/>` + this.points.map(p => `<span style="color:${p.color}">●</span> ${p.series.name}: ${roiM(p.y)}`).join('<br/>'); } },
    legend: { enabled: true, align: 'right', verticalAlign: 'top' },
    plotOptions: { area: { stacking: 'normal', lineWidth: 1, marker: { enabled: false } }, column: { borderRadius: 2 } },
    series: [
      { type: 'area', name: 'Data packs', data: r.mon.map(x => x.cPacks + x.cInt), color: 'rgb(107,114,128)', fillOpacity: 0.22, stack: 'c', zIndex: 1 },
      { type: 'area', name: 'Campaigns & events', data: r.mon.map(x => x.cCE), color: ROI_C.amb, fillOpacity: 0.25, stack: 'c', zIndex: 1 },
      { type: 'area', name: 'Field fee', data: r.mon.map(x => x.cField), color: ROI_C.blu, fillOpacity: 0.35, stack: 'c', zIndex: 1 },
      { type: 'column', name: L1 ? 'Indicative value' : 'Revenue value', data: val, color: roiA(L1 ? ROI_C.amb : ROI_C.grn, 0.45), borderColor: L1 ? ROI_C.amb : ROI_C.grn, borderWidth: 1.5, zIndex: 2 },
    ],
  };
}

/* ---- path to proven ROI ---- */
function RoiPath({ r }) {
  const steps = [
    { m: '0–3', t: 'Phase 1 live', d: 'Opportunity, share and competitive advantage from the data packs. Signals start. Indicative results only.', k: 'indicative', at: 1 },
    { m: '3–4', t: 'Phase 2 go-live + signal validation', d: `Sales and CRM loaded with history. Signals replayed on the prior ${ROI_BACKTEST.months} months: did flagged FA/Teams go on to buy more? Tests the signals, not the team, so it isn't counted.`, k: 'backtest', at: 4 },
    { m: '6–9', t: 'Measured lift builds', d: 'Meetings take time to book and lift shows about 3 months after the activity. Sales vs. run rate, capped at the measurement window. Retention saves counted.', k: 'measured', at: 6 },
    { m: '9', t: 'ROI review', d: 'Agree results against the business case three months ahead of renewal.', k: 'estimate', at: 9 },
    { m: '12', t: 'Renewal', d: 'Year-one ROI plus the run rate going into year two.', k: 'measured', at: 12 },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 10, padding: 16 }}>
      {steps.map((x, i) => {
        const done = r.live >= x.at && (r.level >= 2 || x.at <= 1);
        return (
          <div key={i} style={{ padding: '12px 13px', borderRadius: 10, border: `1px solid ${done ? 'rgba(16,185,129,0.4)' : 'rgba(75,85,99,0.4)'}`, background: done ? 'rgba(16,185,129,0.05)' : 'rgba(255,255,255,0.02)', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
              <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 10.5, color: done ? ROI_C.acc : ROI_C.mut }}>Month {x.m}</span>
              {done ? <i className="fa-solid fa-circle-check" style={{ color: ROI_C.acc, fontSize: 11 }} /> : <RoiTag kind={x.k} />}
            </div>
            <div style={{ fontFamily: 'Inter', fontSize: 12.5, fontWeight: 600, color: ROI_C.ink }}>{x.t}</div>
            <div style={{ fontFamily: 'Inter', fontSize: 11, color: ROI_C.mut, lineHeight: 1.45 }}>{x.d}</div>
          </div>
        );
      })}
    </div>
  );
}

/* ---- ROI by component: full credit per component, each sale counted once in the total ---- */
const ROI_SIG_DATA = { // acted share, lift (acted ÷ expected), weight in signal sales lift (full credit)
  'Performance Advantage': [0.58, 2.6, 0.22], 'Fee Advantage': [0.36, 1.4, 0.08], 'Focus: Core Equity ETF': [0.44, 1.7, 0.12], 'Focus: Muni Ladder SMA': [0.47, 1.9, 0.12],
  'Focus: Private Credit Fund': [0.40, 1.8, 0.07], 'Upsell': [0.52, 2.2, 0.17], 'Cross-sell': [0.45, 1.6, 0.09], 'Fallen Angel': [0.41, 1.5, 0.07], 'Meeting Opportunity': [0.50, 1.3, 0.06], 'Retention Risk': [0.63, 1.89, 0],
};
// conversion: share of acted-on signals followed by a sale (retention: assets kept) within 90 days
const ROI_SIG_CONV = { 'Performance Advantage': 0.34, 'Fee Advantage': 0.19, 'Focus: Core Equity ETF': 0.24, 'Focus: Muni Ladder SMA': 0.27, 'Focus: Private Credit Fund': 0.21, 'Upsell': 0.31, 'Cross-sell': 0.22, 'Fallen Angel': 0.20, 'Meeting Opportunity': 0.15, 'Retention Risk': 0.34 };
const ROI_PACK_CONV = { ssnc_office: 0.25, ssnc_teams: 0.23, ms: 0.30, ubs: 0.27, lpl: 0.25, broadridge: 0.21 };
// acted on: share of the FA/Teams in each pack that the sales team engaged in the period
const ROI_PACK_ACTED = { ssnc_office: 0.38, ssnc_teams: 0.33, ms: 0.46, ubs: 0.41, lpl: 0.35, broadridge: 0.29 };
// segments: [share of ledger, lift, acted share, conversion]
const ROI_SEGS = [['Segment A', 0.45, 2.1, 0.61, 0.33], ['Segment B', 0.30, 1.6, 0.48, 0.24], ['Segment C', 0.15, 1.25, 0.35, 0.15], ['Non-segmented', 0.10, 1.1, 0.22, 0.08]];
const ROI_PROD_FEE = { 'Focus: Core Equity ETF': 0.0030, 'Focus: Muni Ladder SMA': 0.0040, 'Focus: Private Credit Fund': 0.0110 };
const ROI_PACK_LIFT = { ssnc_office: [0.30, 1.8], ssnc_teams: [0.18, 1.7], ms: [0.38, 2.0], ubs: [0.24, 1.9], lpl: [0.20, 1.8], broadridge: [0.10, 1.6] };
const ROI_SIG_OVERLAP = 1.15; // the same sale often follows more than one signal type
function roiRow(name, o, r, s) {
  const fee = o.fee || s.feeBps / 10000, base = o.liftX > 1 ? o.lift / (o.liftX - 1) : (o.base || 0);
  const value = o.lift * fee * r.pv;
  return { name, sub: o.sub, tag: o.tag, acted: o.acted, conv: o.conv, attributed: base + o.lift, base, lift: o.lift, liftPct: base ? o.lift / base : 0, rev: o.lift * fee, revPct: base ? (o.lift * fee) / (base * fee) : 0, cost: o.cost, roi: o.cost ? value * 1000 / o.cost : null, basis: o.basis, value };
}
function roiComponents(r, s) {
  const L1 = r.level === 1, types = roiSigTypes(r.level);
  // Signals
  const sigTypes = types.filter(t => t !== 'Retention Risk');
  const wSum = sigTypes.reduce((a, t) => a + ROI_SIG_DATA[t][2], 0) || 1;
  const sigPool = (L1 ? r.ind : r.sig) * ROI_SIG_OVERLAP;
  const signals = types.map(t => {
    const [acted, liftX, w] = ROI_SIG_DATA[t];
    if (t === 'Retention Risk') return roiRow(t, { lift: r.ret, liftX, acted, conv: ROI_SIG_CONV[t], basis: 'net', sub: 'Net flows: redemptions avoided', tag: L1 ? 'indicative' : null }, r, s);
    return roiRow(t, { lift: sigPool * w / wSum, liftX, acted: L1 ? null : acted, conv: L1 ? null : ROI_SIG_CONV[t], fee: ROI_PROD_FEE[t], tag: L1 ? 'indicative' : null }, r, s);
  });
  const sigDedup = L1 ? r.ind : r.sig + r.ret;
  // Data packs
  const pool = L1 ? r.ind : r.flows;
  const packs = roiPacks().map(p => { const [f, liftX] = ROI_PACK_LIFT[p.id] || [0.1, 1.7]; return roiRow(p.name, { lift: pool * f, liftX, acted: L1 ? null : ROI_PACK_ACTED[p.id], conv: L1 ? null : ROI_PACK_CONV[p.id], sub: p.provider, cost: (+s.packCost[p.id] || 0) * r.M / 12 * r.kC, tag: L1 ? 'indicative' : null }, r, s); });
  // Campaigns & events
  const scaleE = r.sig / 286, ce = [];
  if (r.level >= 2) ROI_EVENTS.forEach(([n, cost, fas, fu, l]) => ce.push(roiRow(n, { lift: l * scaleE, liftX: 1 + (l / Math.max(fas, 1)) * 2.4, acted: fu / fas, conv: Math.min(0.5, 0.06 + l / fas * 1.6), cost: cost * r.M / 12 * r.kCE, sub: 'Event' }, r, s)));
  if (r.level >= 3) roiCampaigns().forEach(c => ce.push(roiRow(c.name, { lift: c.liftD * r.kL, base: c.baseline * r.kL, liftX: c.baseline ? c.attributed / c.baseline : 0, acted: c.engaged, conv: Math.min(0.4, 0.04 + (c.baseline ? c.liftD / c.baseline : 0) * 0.6), cost: ((c.costK || 0) + 5) * r.kCE, sub: 'Campaign' + (c.status === 'Active' ? ' · active' : '') }, r, s)));
  const ceSum = ce.reduce((a, x) => a + x.lift, 0);
  const segs = r.level >= 3 ? ROI_SEGS.map(([n, f, liftX, acted, conv]) => roiRow(n, { lift: pool * f, liftX, acted, conv, sub: n === 'Non-segmented' ? 'FA/Teams outside the model' : null }, r, s)) : [];
  const sumAll = [...signals, ...packs, ...ce, ...segs].reduce((a, x) => a + x.lift, 0);
  const wavg = (rows, key) => { const ok = rows.filter(x => x[key] != null); const w = ok.reduce((a, x) => a + x.lift, 0); return w ? ok.reduce((a, x) => a + x[key] * x.lift, 0) / w : null; };
  const dedup = (rows, lift, cost) => { const k = rows.reduce((a, x) => a + x.lift, 0); const f = k ? lift / k : 0; const base = rows.reduce((a, x) => a + x.base, 0) * f; const fee = s.feeBps / 10000; return { lift, base, attributed: base + lift, liftPct: base ? lift / base : 0, rev: lift * fee, revPct: base ? lift / base : 0, cost, roi: cost ? lift * fee * r.pv * 1000 / cost : null, acted: wavg(rows, 'acted'), conv: wavg(rows, 'conv') }; };
  const groups = [
    { key: 'sig', name: 'Signals', note: 'By signal type, as on the Signals dashboard', rows: signals, tot: dedup(signals, sigDedup, null) },
    { key: 'pack', name: 'Data packs', note: 'Each pack credited with every sale its data fed', rows: packs, tot: dedup(packs, pool * (L1 ? 1 : 1 - ROI_CRM_ONLY), packs.reduce((a, x) => a + (x.cost || 0), 0)) },
    ...(segs.length ? [{ key: 'seg', name: 'Segmentation', note: 'By segment; each FA/Team sits in one, so rows add to the total', rows: segs, tot: dedup(segs, pool, null) }] : []),
    ...(ce.length ? [{ key: 'ce', name: 'Campaigns & events', note: 'From the CRM campaign: members, follow-up, cost', rows: ce, tot: dedup(ce, ceSum * 0.85, ce.reduce((a, x) => a + (x.cost || 0), 0)) }] : []),
  ];
  const total = dedup([...signals, ...packs, ...ce, ...segs], pool, r.costTotal * 1000);
  return { groups, total, sumAll, overlap: sumAll - pool };
}

function RoiComponents({ r, s }) {
  const [open, setOpen] = React.useState({ sig: false, pack: false, seg: false, ce: false });
  const C = roiComponents(r, s), L1 = r.level === 1;
  const pct = (x) => (x ? `+${(x * 100).toFixed(0)}%` : '—');
  const cells = (x, bold) => [
    x.acted == null ? <span style={{ color: ROI_C.mut }}>—</span> : `${Math.round(x.acted * 100)}%`,
    x.conv == null ? <span style={{ color: ROI_C.mut }}>—</span> : `${Math.round(x.conv * 100)}%`,
    roiM(x.attributed), roiPos(x.lift), <span style={{ color: x.liftPct >= 0.5 ? ROI_C.acc : 'rgb(209,213,219)', fontWeight: 600 }}>{pct(x.liftPct)}</span>,
    roiM(x.rev), pct(x.revPct), x.cost ? roiK(x.cost) : <span style={{ color: ROI_C.mut }}>—</span>,
    x.roi == null ? <span style={{ color: ROI_C.mut }}>—</span> : <span style={{ fontWeight: 700, color: x.roi >= 1 ? ROI_C.acc : ROI_C.amb }}>{roiX(x.roi)}</span>,
  ];
  const head = ['Component', { l: 'Acted on', tip: 'Signals: share worked. Data packs: share of the pack\'s FA/Teams the sales team engaged. Campaigns and events: members engaged by sales. Segments: share of signals worked' }, { l: 'Conversion', tip: 'Share of acted-on signals or engaged members followed by a sale within 90 days (Retention Risk: assets kept)' }, { l: 'Attributed sales', tip: 'Sales from FA/Teams after the signal, campaign or event, within the measurement window' }, { l: 'Sales lift', tip: 'Attributed sales less run rate (prior-12-month average daily sales × days since)' }, 'Lift %', { l: 'Revenue lift', tip: 'Annual fees on the sales lift at the product\'s net fee' }, 'Rev. lift %', 'Cost', { l: 'ROI', tip: 'Revenue lift over the life of the assets ÷ cost' }];
  const td = (i, extra) => ({ ...roiTd, textAlign: i ? 'right' : 'left', paddingLeft: i ? 8 : 18, paddingRight: i === 9 ? 18 : 8, ...extra });
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead><tr>{head.map((h, i) => <th key={i} title={h.tip} style={{ ...roiTh, textAlign: i ? 'right' : 'left', paddingLeft: i ? 8 : 18, paddingRight: i === 9 ? 18 : 8 }}>{h.l || h}</th>)}</tr></thead>
        <tbody>
          {C.groups.map(g => (
            <React.Fragment key={g.key}>
              <tr onClick={() => setOpen(o => ({ ...o, [g.key]: !o[g.key] }))} style={{ cursor: 'pointer', background: 'rgba(255,255,255,0.03)' }}>
                <td style={td(0, { color: ROI_C.ink, fontWeight: 700, fontSize: 12.5 })}>
                  <i className={`fa-solid fa-chevron-${open[g.key] ? 'down' : 'right'}`} style={{ fontSize: 9, width: 14, color: ROI_C.mut }} />{g.name}
                  <span style={{ marginLeft: 8, fontSize: 10.5, fontWeight: 400, color: ROI_C.mut }}>{g.rows.length} · {g.note}</span>
                </td>
                {cells(g.tot).map((c, i) => <td key={i} style={td(i + 1, { fontWeight: 700, color: ROI_C.ink })}>{c}</td>)}
              </tr>
              {open[g.key] && g.rows.map(x => (
                <tr key={x.name} style={{ opacity: x.dim ? 0.6 : 1 }}>
                  <td style={td(0, { paddingLeft: 40, color: ROI_C.ink })}>{x.name}{x.sub && <span style={{ marginLeft: 6, fontSize: 10.5, color: ROI_C.mut }}>{x.sub}</span>}{x.tag && <span style={{ marginLeft: 6 }}><RoiTag kind={x.tag} /></span>}</td>
                  {cells(x).map((c, i) => <td key={i} style={td(i + 1)}>{c}</td>)}
                </tr>
              ))}
            </React.Fragment>
          ))}
          <tr style={{ background: 'rgba(16,185,129,0.07)' }}>
            <td style={td(0, { color: ROI_C.ink, fontWeight: 700, borderBottom: 'none' })}>Total, each sale counted once</td>
            {cells(C.total).map((c, i) => <td key={i} style={td(i + 1, { fontWeight: 700, color: ROI_C.ink, borderBottom: 'none' })}>{c}</td>)}
          </tr>
        </tbody>
      </table>
      <div style={{ padding: '10px 18px 14px', fontFamily: 'Inter', fontSize: 11, color: ROI_C.mut, lineHeight: 1.55 }}>
        Every component gets full credit for the sales it touched (segments are the exception: each FA/Team sits in one segment): a sale after a Performance Advantage signal, on a Morgan Stanley FA/Team, who was in a campaign, counts in all three rows. Group rows and the total count each sale once. Rows add up to {roiM(C.sumAll)}; the total is {roiM(L1 ? r.ind : r.flows)}, because {roiM(C.overlap)} was touched by more than one component. Lift % here is on attributed sales (sales to the FA/Teams each component touched); the headline lift % is on all sales vs. run rate. Retention Risk lift is on net flows (redemptions avoided). About 15% of value came from signals built only on your own sales and CRM data, so it isn't credited to any data pack. Total cost is Intelligence cost: data packs, campaigns and events, the Field fee and any internal resources. ROI in this table is on revenue only; the headline ROI also counts efficiency (value layer 2). {L1 ? 'Phase 1 rows are indicative, from share movement in the data packs.' : ''}
      </div>
    </div>
  );
}

/* Sales team impact: a high-level talking point, always rolling 12 months, refreshed monthly. */
function RoiActivities({ r }) {
  if (r.level < 2) return <RoiLocked phase={2} text="Sales team impact comes from your CRM activity in Phase 2: how FA/Teams the team engages compare with those it doesn't." />;
  const k = r.level >= 3 ? 1 : 0.9;
  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 10 }}>
        <RoiKpi label="Sales lift, FA/Teams engaged" value={`+${Math.round(24 * k)}%`} strong sub="Over run rate, FA/Teams with a meeting, event, connected call or 1:1 email" />
        <RoiKpi label="Sales lift, not engaged" value="−3%" tone={ROI_C.mut} sub="Same period, FA/Teams the team didn't engage" />
        <RoiKpi label="Sales per activity" value="$68K" sub="Sales following each counted activity" />
        <RoiKpi label="Conversion rate" value="9.5%" sub="Activities followed by a sale within 90 days" />
      </div>
      <div style={{ fontFamily: 'Inter', fontSize: 11, color: ROI_C.mut, lineHeight: 1.5 }}>Rolling 12 months, refreshed monthly, across every FA/Team whether or not a signal was involved. Engaged FA/Teams outgrew their run rate by {Math.round(27 * k)} points more than those the team didn't reach: the value of the team's time with clients.</div>
    </div>
  );
}

function roiNumIn(val, onChange, unit, w = 54) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, height: 26, padding: '0 8px', borderRadius: 6, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(75,85,99,0.55)' }}>
      <input value={val} onChange={e => onChange(+e.target.value.replace(/[^0-9.]/g, '') || 0)} style={{ width: w, background: 'transparent', border: 'none', outline: 'none', color: ROI_C.ink, fontFamily: 'Inter', fontSize: 12, textAlign: 'right' }} />
      <span style={{ fontFamily: 'Inter', fontSize: 10.5, color: ROI_C.mut, whiteSpace: 'nowrap' }}>{unit}</span>
    </span>
  );
}

/* Field vs. status quo: what would have happened doing the same things. */
function roiStatusChart(r, view) {
  const cats = r.mon.map(x => x.lbl), step = r.live > 12 ? 2 : 1;
  if (view === 'aum') return {
    chart: { height: 230 },
    xAxis: { categories: cats, labels: { step } },
    yAxis: { min: 0, labels: { formatter() { return roiM(this.value, 0); } } },
    legend: { enabled: true, align: 'right', verticalAlign: 'top' },
    tooltip: { formatter() { return `<b>${this.x}</b><br/>AUM above trend: ${roiM(this.y)}<br/><span style="color:#9ca3af">Sales above the 3-yr trend, less redemptions</span>`; } },
    series: [{ type: 'areaspline', name: 'AUM above trend', data: r.trendAum, color: ROI_C.grn, fillOpacity: 0.22, marker: { enabled: false }, lineWidth: 2 }],
  };
  return {
    chart: { height: 230 },
    xAxis: { categories: cats, labels: { step } },
    yAxis: { startOnTick: false, endOnTick: false, labels: { formatter() { return roiM(this.value, 0); } } },
    legend: { enabled: true, align: 'right', verticalAlign: 'top' },
    tooltip: { shared: true, formatter() { return `<b>${this.x}</b><br/>` + this.points.map(p => `<span style="color:${p.color}">●</span> ${p.series.name}: ${roiM(p.y)}`).join('<br/>') + `<br/><span style="color:${ROI_C.acc}">Field: +${roiM(this.points[0].y - this.points[1].y)}</span>`; } },
    series: [
      { type: 'areaspline', name: 'Actual monthly sales', data: r.actMon, color: ROI_C.grn, fillOpacity: 0.15, threshold: null, marker: { enabled: false }, lineWidth: 2 },
      { type: 'spline', name: 'Status quo (3-yr trend)', data: r.sqMon, color: 'rgb(156,163,175)', dashStyle: 'ShortDash', marker: { enabled: false }, lineWidth: 1.5 },
    ],
  };
}
function RoiStatusQuo({ r, s }) {
  const view = s.sqView === 'sales' ? 'sales' : 'aum';
  const opt = React.useMemo(() => roiStatusChart(r, view), [JSON.stringify(s), r.level]);
  const incNow = r.trendAum[r.live - 1], incYr = r.trendAum[Math.max(0, r.live - 13)];
  const mkt = (s.mkt || 0) / 100, field = r.sqP ? (r.actP - r.sqP) / r.sqP : 0, yours = mkt + field;
  const explained = yours > 0 ? field / yours : 0;
  const gap = s.goal / 100 - mkt, closed = gap > 0 ? field / gap : 0;
  const L1 = r.level === 1, pct = (x) => `${x >= 0 ? '+' : ''}${(x * 100).toFixed(1)}%`;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(380px,1fr))', gap: 16, padding: 16 }}>
      <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <TabPills options={['aum', 'sales']} labels={{ aum: 'AUM', sales: 'Monthly sales' }} value={view} onChange={v => roiSet({ sqView: v })} />
          <span style={{ fontFamily: 'Inter', fontSize: 11, color: ROI_C.mut }}>{view === 'aum' ? `AUM above trend ${roiM(incNow)}${r.live > 12 ? `, up from ${roiM(incYr)} a year ago` : ''}` : 'Each month\'s lift is new sales above trend'}</span>
        </div>
        <HC options={opt} style={{ height: 230 }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
          <RoiKpi label="Your growth rate" value={pct(yours)} sub={`${roiM(r.actP)} sales vs. ${roiM(r.sqP)} status quo for the period`} />
          <RoiKpi label="Status quo (3-yr trend)" value={pct(mkt)} sub="Your trailing 3-year sales CAGR, carried forward: what doing the same things would have delivered" />
          <RoiKpi label="Growth above trend" value={pct(field)} strong sub={`${Math.round(explained * 100)}% of your growth came in above trend`} />
          <RoiKpi label="Goal gap closed" value={gap > 0 ? `${Math.round(closed * 100)}%` : '—'} strong={closed >= 0.5} sub={`Goal +${s.goal}% less +${(mkt * 100).toFixed(1)}% trend growth leaves ${(gap * 100).toFixed(1)} pts; above trend: ${(field * 100).toFixed(1)}`} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', fontFamily: 'Inter', fontSize: 11, color: ROI_C.mut }}>
          <span>Sales goal</span>{roiNumIn(s.goal, v => roiSet({ goal: v }), '% growth', 34)}
          <span>3-yr sales CAGR</span>{roiNumIn(s.mkt, v => roiSet({ mkt: v }), '% / yr', 34)}
        </div>
        <div style={{ fontFamily: 'Inter', fontSize: 11, color: ROI_C.mut, lineHeight: 1.5 }}>A standalone check on the measured ROI above: your total sales against your pre-Field sales carried forward at your own 3-year CAGR (from your sales history, or provided at kickoff), fixed at go-live. It isn't used in the ROI calculation, which measures lift against each FA/Team's rolling 12-month run rate. If the two broadly agree, the measured lift is real growth, not a shift between FA/Teams. The goal isn't assumed: the gap closed is measured against it.</div>
      </div>
    </div>
  );
}

/* Behavior change: the drivers of lift. Shown as metrics, never added as dollars. */
const ROI_BEHAVIOR = [
  ['Signals acted on', null, 49, '%', 'Of signals issued, worked within 30 days'],
  ['Segment A coverage', 62, 81, '%', 'Segment A FA/Teams with a meeting or call in the period'],
  ['Avg ticket size, signal sales', '$412K', '$548K', '', 'Average sale after an acted-on signal vs. average sale before'],
  ['Meeting-to-sale conversion', 5.1, 7.4, '%', 'Meetings followed by a sale within 90 days'],
  ['Days to first sale', 96, 71, ' days', 'From first meeting to first sale with a new FA/Team', true],
  ['FA/Teams covered per wholesaler', 118, 142, '', 'Unique FA/Teams with an activity, per external'],
];
/* Behavior metrics follow the selected region or wholesaler, from their own FA/Teams' signals and activity. */
const __roiBeh = {};
function roiBehStats(names) {
  const key = names.join('|'); if (__roiBeh[key]) return __roiBeh[key];
  const set = new Set(names); let sig = 0, act = 0, met = 0, won = 0, segA = 0, segAc = 0, cov = 0;
  (window.ML_ROWS || []).forEach(r => { if (!set.has(r.ext) || !r.focus) return;
    (r.signals || []).forEach(x => { sig++; if (x.actioned) act++; if (x.met) met++; if (x.won) won++; });
    const c = r.act && r.act.ext > 0; if (c) cov++; if (r.segment === 'A') { segA++; if (c) segAc++; } });
  const skill = names.reduce((a, n) => a + ((window.ML_SKILL || {})[n] || 0.5), 0) / Math.max(names.length, 1);
  return (__roiBeh[key] = { acted: sig ? act / sig : 0, segA: segA ? segAc / segA : 0, conv: met ? won / met : 0, covPer: cov / Math.max(names.length, 1), skill });
}
function roiBehaviorRows(view) {
  const S = roiShares(); const all = S.ppl.map(p => p.name);
  const names = !view || (view.region === 'National' && !view.person) ? all : view.person ? [view.person] : S.ppl.filter(p => p.regions.includes(view.region)).map(p => p.name);
  if (!names.length || names.length === all.length || !window.ML_ROWS) return ROI_BEHAVIOR;
  const N = roiBehStats(all), X = roiBehStats(names), f = 0.6 + 0.8 * X.skill;
  const up = (nNow, nBefore, ratio) => { const now = nNow * ratio; return [nBefore == null ? null : now / (1 + (nNow / nBefore - 1) * f), now]; };
  const r1 = (v) => Math.round(v), r10 = (v) => Math.round(v * 10) / 10;
  const [, a1] = up(49, null, N.acted ? X.acted / N.acted : 1);
  const [b2, a2] = up(81, 62, N.segA ? X.segA / N.segA : 1);
  const tk = 548 * (0.85 + 0.3 * X.skill), tkB = tk / (1 + (548 / 412 - 1) * f);
  const [b4, a4] = up(7.4, 5.1, N.conv ? X.conv / N.conv : 1);
  const dy = 71 * (1.2 - 0.4 * X.skill), dyB = dy * (1 + (96 / 71 - 1) * f);
  const [b6, a6] = up(142, 118, N.covPer ? X.covPer / N.covPer : 1);
  return [
    ['Signals acted on', null, Math.min(95, r1(a1)), '%', ROI_BEHAVIOR[0][4]],
    ['Segment A coverage', Math.min(99, r1(b2)), Math.min(100, r1(a2)), '%', ROI_BEHAVIOR[1][4]],
    ['Avg ticket size, signal sales', `$${r1(tkB)}K`, `$${r1(tk)}K`, '', ROI_BEHAVIOR[2][4]],
    ['Meeting-to-sale conversion', r10(b4), r10(a4), '%', ROI_BEHAVIOR[3][4]],
    ['Days to first sale', r1(dyB), r1(dy), ' days', ROI_BEHAVIOR[4][4], true],
    ['FA/Teams covered per wholesaler', r1(b6), r1(a6), '', ROI_BEHAVIOR[5][4]],
  ];
}
function RoiBehavior({ r, view }) {
  if (r.level < 2) return <RoiLocked phase={2} text="Behavior change needs your CRM activity. From Phase 2 you can see the team working the signals, covering the right FA/Teams and converting faster." />;
  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 10 }}>
        {roiBehaviorRows(view).map(([l0, b, n, u, h0, down]) => {
          const l = l0 === 'Segment A coverage' && r.level < 3 ? 'Top-opportunity coverage' : l0;
          const h = l0 === 'Segment A coverage' && r.level < 3 ? 'Top-opportunity FA/Teams with a meeting or call (Segment A from Phase 3)' : h0;
          const num = (v) => (typeof v === 'string' ? parseFloat(v.replace(/[^0-9.]/g, '')) : v);
          const better = b == null ? true : down ? num(n) < num(b) : num(n) > num(b);
          return (
            <div key={l} style={{ padding: '12px 14px', borderRadius: 10, border: `1px solid ${ROI_C.line}`, background: 'rgba(255,255,255,0.02)', display: 'flex', flexDirection: 'column', gap: 5 }}>
              <span style={{ fontFamily: 'Inter', fontSize: 10, fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase', color: ROI_C.dim }}>{l}</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontFamily: 'Inter', fontSize: 13, color: ROI_C.mut, textDecoration: b == null ? 'none' : 'line-through' }}>{b == null ? 'New' : `${b}${u}`}</span>
                <i className="fa-solid fa-arrow-right" style={{ fontSize: 10, color: ROI_C.mut }} />
                <span style={{ fontFamily: "'Inter Display', Inter", fontSize: 20, fontWeight: 600, color: better ? ROI_C.acc : ROI_C.amb }}>{n}{u}</span>
              </div>
              <span style={{ fontFamily: 'Inter', fontSize: 10.5, color: ROI_C.mut, lineHeight: 1.4 }}>{h}</span>
            </div>
          );
        })}
      </div>
      <div style={{ fontFamily: 'Inter', fontSize: 11, color: ROI_C.mut, lineHeight: 1.5 }}>Before = the 12 months before Phase 2 go-live, from your CRM history. These are how the lift happens, so they're shown as metrics and never added as dollars, which would count the same value twice.</div>
    </div>
  );
}

/* Value layers: revenue (measured), efficiency and cost avoided (estimated), strategic (not valued). */
function RoiValueLayers({ r, s }) {
  const e = s.eff, t = s.tcb, setE = (k, v) => roiSet({ eff: { ...e, [k]: v } }), setT = (k, v) => roiSet({ tcb: { ...t, [k]: v } });
  const card = (n, title, tag, value, children, tone) => (
    <div style={{ padding: '14px 16px', borderRadius: 12, border: `1px solid ${roiA(tone, 0.4)}`, background: roiA(tone, 0.04), display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 20, height: 20, borderRadius: 5, background: roiA(tone, 0.18), color: tone, fontFamily: 'Inter', fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{n}</span>
        <span style={{ fontFamily: 'Inter', fontSize: 12.5, fontWeight: 600, color: ROI_C.ink }}>{title}</span>
        <span style={{ flex: 1 }} />{tag}
      </div>
      {value != null && <div style={{ fontFamily: "'Inter Display', Inter", fontSize: 22, fontWeight: 600, color: tone }}>{value}</div>}
      {children}
    </div>
  );
  const line = (l, v, inputs) => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, alignItems: 'center', padding: '6px 0', borderTop: `1px solid ${ROI_C.line}` }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: 'Inter', fontSize: 12, color: ROI_C.ink }}>{l}</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>{inputs}</div>
      </div>
      <span style={{ fontFamily: 'Inter', fontSize: 12.5, fontWeight: 600, color: ROI_C.ink }}>{v}</span>
    </div>
  );
  const P = r.effParts, L2 = r.level >= 2;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 14, padding: 16 }}>
      {card(1, 'Revenue', <span style={{ display: 'inline-flex', gap: 6 }}><RoiTag kind={r.level === 1 ? 'indicative' : 'measured'} /><span style={{ display: 'inline-flex', alignItems: 'center', height: 18, padding: '0 7px', borderRadius: 4, fontFamily: 'Inter', fontSize: 9.5, fontWeight: 700, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.45)', color: ROI_C.acc }}>Included in ROI</span></span>, roiM(r.level === 1 ? r.ind * r.vpm : r.value), (
        <div style={{ fontFamily: 'Inter', fontSize: 11.5, color: ROI_C.mut, lineHeight: 1.5 }}>{r.level === 1 ? 'Indicative from share movement in the data packs until Phase 2 measures it.' : 'Sales lift and assets retained, measured from your data and valued over the life of the assets.'} This is the headline ROI.</div>
      ), ROI_C.grn)}
      {card(2, 'Efficiency and cost avoided', <span style={{ display: 'inline-flex', gap: 6 }}><RoiTag kind="estimate" /><span style={{ display: 'inline-flex', alignItems: 'center', height: 18, padding: '0 7px', borderRadius: 4, fontFamily: 'Inter', fontSize: 9.5, fontWeight: 700, whiteSpace: 'nowrap', background: r.full ? 'rgba(16,185,129,0.12)' : 'rgba(156,163,175,0.1)', border: `1px solid ${r.full ? 'rgba(16,185,129,0.45)' : 'rgba(156,163,175,0.4)'}`, color: r.full ? ROI_C.acc : 'rgb(156,163,175)' }}>{r.full ? 'Included in ROI' : 'Not included'}</span></span>, roiM(r.effValue + r.buildValue), (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {line('Wholesaler meeting prep', L2 ? roiM(P.prep) : '—', <>{roiNumIn(e.whole, v => setE('whole', v), 'people', 28)}{roiNumIn(e.prepHrs, v => setE('prepHrs', v), 'hrs / wk', 24)}{roiNumIn(e.wRate, v => setE('wRate', v), '$ / hr', 32)}</>)}
          {line('Leadership reporting and meeting prep', L2 ? roiM(P.lead) : '—', <>{roiNumIn(e.leaders, v => setE('leaders', v), 'people', 28)}{roiNumIn(e.leadHrs, v => setE('leadHrs', v), 'hrs / mo', 24)}{roiNumIn(e.lRate, v => setE('lRate', v), '$ / hr', 32)}</>)}
          {line('Data pack processing', roiM(P.data), <>{roiNumIn(e.analystFte, v => setE('analystFte', v), 'analyst FTE', 28)}{roiNumIn(e.analystCost, v => setE('analystCost', v), '$K loaded', 32)}</>)}
          {line(<label style={{ display: 'inline-flex', alignItems: 'center', gap: 7, cursor: 'pointer' }}><input type="checkbox" checked={!!s.creditBuild} onChange={() => roiSet({ creditBuild: !s.creditBuild })} style={{ accentColor: 'rgb(167,139,250)' }} />Build cost avoided <span style={{ fontSize: 10.5, color: ROI_C.mut }}>· only if they'd otherwise build it</span></label>, s.creditBuild ? roiM(r.buildValue) : 'Off', <>{roiNumIn(t.runFte, v => setT('runFte', v), 'FTE to run', 28)}{roiNumIn(t.fteCost, v => setT('fteCost', v), '$K / FTE', 32)}</>)}
          <div style={{ fontFamily: 'Inter', fontSize: 10.5, color: ROI_C.mut, lineHeight: 1.45, marginTop: 6 }}>Capacity freed, not hard savings, unless headcount changes. Build cost avoided is the in-house team to run it ({roiK(r.buildAnn * 1000)} a year); the one-time build ({roiK(t.fte * t.fteCost * t.buildMonths / 12)}, {t.buildMonths} months) is left out to stay conservative. Included in ROI.</div>
        </div>
      ), ROI_C.vio)}
      {card(3, 'Strategic', <span style={{ fontFamily: 'Inter', fontSize: 9.5, fontWeight: 700, color: ROI_C.mut }}>NOT VALUED</span>, null, (
        <ul style={{ margin: 0, paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 6, fontFamily: 'Inter', fontSize: 12, color: 'rgb(209,213,219)', lineHeight: 1.45 }}>
          <li>Coaching from what works: managers see which activities and signals convert, by person</li>
          <li>One source of truth across sales, CRM and data packs</li>
          <li>Faster ramp for new wholesalers with briefs and signals from day one</li>
          <li>Cleaner CRM data, matched to data-pack FA/Teams</li>
          <li>Ready for AI: a unified data layer the firm can build on</li>
          <li>{t.buildMonths - t.fieldMonths} months earlier to insight than building in-house</li>
        </ul>
      ), 'rgb(156,163,175)')}
    </div>
  );
}

/* ---- assumptions drawer ---- */
function RoiAssumptions({ s, onClose }) {
  const packs = roiPacks();
  const row = (l, k, u, h) => (
    <label style={{ display: 'grid', gridTemplateColumns: '1fr 110px', gap: 10, alignItems: 'center' }}>
      <span><span style={{ display: 'block', fontFamily: 'Inter', fontSize: 12.5, color: ROI_C.ink }}>{l}</span>{h && <span style={{ display: 'block', fontFamily: 'Inter', fontSize: 10.5, color: ROI_C.mut, marginTop: 2, lineHeight: 1.4 }}>{h}</span>}</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6, height: 30, padding: '0 10px', borderRadius: 7, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(75,85,99,0.55)' }}>
        <input value={s[k]} onChange={e => roiSet({ [k]: +e.target.value.replace(/[^0-9.]/g, '') || 0 })} style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: ROI_C.ink, fontFamily: 'Inter', fontSize: 12.5, textAlign: 'right' }} />
        <span style={{ fontFamily: 'Inter', fontSize: 11, color: ROI_C.mut }}>{u}</span>
      </span>
    </label>
  );
  const head = (t) => <div style={{ fontFamily: 'Inter', fontSize: 10.5, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'rgb(115,115,115)', marginTop: 6 }}>{t}</div>;
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 60 }} />
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 440, maxWidth: '92vw', background: 'rgb(17,24,39)', borderLeft: '1px solid rgb(75,85,99)', zIndex: 61, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 22px 16px', borderBottom: '1px solid rgba(75,85,99,0.4)', position: 'sticky', top: 0, background: 'rgb(17,24,39)', zIndex: 2 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Inter Display'", fontSize: 16, fontWeight: 700, color: ROI_C.ink }}>ROI assumptions</div>
            <div style={{ fontFamily: 'Inter', fontSize: 11.5, color: ROI_C.mut, marginTop: 2 }}>One set, used across the ROI Center, banners, briefs and Campaign Analytics</div>
          </div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid rgba(75,85,99,0.6)', background: 'transparent', color: ROI_C.mut, cursor: 'pointer' }}><i className="fa-solid fa-xmark" style={{ fontSize: 12 }} /></button>
        </div>
        <div style={{ padding: '16px 22px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {head('Revenue')}
          {row('Net management fee', 'feeBps', 'bps', 'Gross fee less waivers and expense caps, blended across products. Product-level fees are used when provided.')}
          {row('Discount rate', 'disc', '%')}
          {head('Redemption by vehicle')}
          {ROI_VEH.map(([k, l, h]) => (
            <div key={k} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px', gap: 8, alignItems: 'center' }}>
              <span><span style={{ display: 'block', fontFamily: 'Inter', fontSize: 12.5, color: ROI_C.ink }}>{l}</span><span style={{ display: 'block', fontFamily: 'Inter', fontSize: 10.5, color: ROI_C.mut }}>Industry {h}</span></span>
              {['r', 'mix'].map(f => (
                <span key={f} style={{ display: 'flex', alignItems: 'center', gap: 4, height: 30, padding: '0 8px', borderRadius: 7, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(75,85,99,0.55)' }}>
                  <input value={(s.veh || {})[k] ? s.veh[k][f] : 0} onChange={e => roiSet({ veh: { ...s.veh, [k]: { ...s.veh[k], [f]: +e.target.value.replace(/[^0-9.]/g, '') || 0 } } })} style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: ROI_C.ink, fontFamily: 'Inter', fontSize: 12.5, textAlign: 'right' }} />
                  <span style={{ fontFamily: 'Inter', fontSize: 10.5, color: ROI_C.mut, whiteSpace: 'nowrap' }}>{f === 'r' ? '%/yr' : '% mix'}</span>
                </span>
              ))}
            </div>
          ))}
          <div style={{ fontFamily: 'Inter', fontSize: 10.5, color: ROI_C.mut, lineHeight: 1.4, marginTop: -6 }}>Annual redemption rate and share of incremental flows by vehicle. Fees counted up to {ROI_LIFE_CAP} years; product-level rates replace these when calculated or provided.</div>
          {head('Lift measurement')}
          <label style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'center' }}>
            <span><span style={{ display: 'block', fontFamily: 'Inter', fontSize: 12.5, color: ROI_C.ink }}>Measurement window cap</span><span style={{ display: 'block', fontFamily: 'Inter', fontSize: 10.5, color: ROI_C.mut, marginTop: 2, lineHeight: 1.4 }}>Days after the signal or activity that count toward lift. 180 days covers the ~3-month lag plus time to book meetings without crediting organic sales.</span></span>
            <TabPills options={['90', '180', '365']} labels={{ 90: '90d', 180: '180d', 365: '12 mo' }} value={String(s.win)} onChange={v => roiSet({ win: +v })} />
          </label>
          {row('Share of measured lift attributed', 'attrib', '%', 'Lift is already net of each FA/Team\'s run rate. Lower this to be more conservative.')}
          {head('Cost')}
          {row('Field fee (annual)', 'fieldFee', '$K')}
          {row('Internal data / engineering resources', 'internal', '$K', 'Optional, separate line. Included in Intelligence cost.')}
          {head('Data packs (annual)')}
          {packs.map(p => (
            <label key={p.id} style={{ display: 'grid', gridTemplateColumns: '1fr 110px', gap: 10, alignItems: 'center' }}>
              <span style={{ fontFamily: 'Inter', fontSize: 12.5, color: ROI_C.ink }}>{p.name}<span style={{ display: 'block', fontFamily: 'Inter', fontSize: 10.5, color: ROI_C.mut }}>{p.provider}</span></span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, height: 30, padding: '0 10px', borderRadius: 7, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(75,85,99,0.55)' }}>
                <input value={s.packCost[p.id] || 0} onChange={e => roiSet({ packCost: { ...s.packCost, [p.id]: +e.target.value.replace(/[^0-9.]/g, '') || 0 } })} style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: ROI_C.ink, fontFamily: 'Inter', fontSize: 12.5, textAlign: 'right' }} />
                <span style={{ fontFamily: 'Inter', fontSize: 11, color: ROI_C.mut }}>$K</span>
              </span>
            </label>
          ))}
          <div style={{ marginTop: 6, padding: '12px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: `1px solid ${ROI_C.line}`, fontFamily: 'Inter', fontSize: 11.5, color: 'rgb(209,213,219)', lineHeight: 1.5 }}>
            Each $1M of incremental flows is worth <b style={{ color: ROI_C.acc }}>{roiK(s.feeBps / 10000 * roiPV(s) * 1e3)}</b> in today's dollars ({roiPV(s).toFixed(2)}× one year's fee at {s.feeBps} bps, blended {roiRedeem(s).toFixed(0)}% redemption).
          </div>
          {head('Demo')}
          <label style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'center' }}>
            <span><span style={{ display: 'block', fontFamily: 'Inter', fontSize: 12.5, color: ROI_C.ink }}>Months since go-live</span><span style={{ display: 'block', fontFamily: 'Inter', fontSize: 10.5, color: ROI_C.mut, marginTop: 2 }}>Preview a new client while measurement matures</span></span>
            <TabPills options={['3', '6', '9', '12', '24']} value={String(s.live)} onChange={v => roiSet({ live: +v })} />
          </label>
          <button onClick={roiReset} style={{ alignSelf: 'flex-start', height: 30, padding: '0 12px', borderRadius: 7, border: '1px solid rgba(75,85,99,0.7)', background: 'transparent', color: 'rgb(209,213,219)', fontFamily: 'Inter', fontSize: 12, cursor: 'pointer' }}><i className="fa-solid fa-rotate-left" style={{ fontSize: 10, marginRight: 6 }} />Reset to defaults</button>
        </div>
      </div>
    </>
  );
}

/* ---- page ---- */
function RoiPage({ level = 3 }) {
  const [s] = useRoi();
  const [open, setOpen] = React.useState(false);
  const [math, setMath] = React.useState(false);
  const view = roiViewOf(s), scoped = !(view.region === 'National' && !view.person);
  const r = roiCalc(s, level, roiScopeOpt(view));
  const L1 = level === 1, onboarding = r.live < 10;
  const regionOpts = [{ key: 'National', label: 'National' }, ...((window.ML_REGIONS) || []).map(x => ({ key: x, label: x }))];
  const whoOpts = [{ key: '', label: view.region === 'National' ? 'All wholesalers' : `All of ${view.region}` }, ...roiShares().ppl.filter(p => view.region === 'National' || p.regions.includes(view.region)).map(p => ({ key: p.name, label: p.name }))];
  const Pick = window.MlPicker;
  const be = Math.ceil((r.costTotal * 12 / r.M) / r.vpm);
  const key = JSON.stringify(s) + level;
  const tw = { trend: React.useMemo(() => roiTrend(r, s), [key]), wf: React.useMemo(() => roiWaterfall(r, s), [key]) };
  const pct = (x) => `${(x * 100).toFixed(1)}%`;

  return (
    <div style={{ padding: '20px 24px 60px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontFamily: "'Inter Display', Inter", fontSize: 19, fontWeight: 700, color: ROI_C.ink }}>Distribution Intelligence ROI</div>
          <div style={{ fontFamily: 'Inter', fontSize: 12, color: ROI_C.mut, marginTop: 3 }}><b style={{ color: scoped ? ROI_C.acc : 'rgb(209,213,219)', fontWeight: 600 }}>{roiViewLabel(view)}</b> · {r.periodLbl} · {L1 ? 'Phase 1: indicative from the data packs' : `Phase ${level}: measured from your sales and CRM`}</div>
        </div>
        <div style={{ flex: 1 }} />
        {Pick && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
            <span style={{ fontFamily: 'Inter', fontSize: 10, fontWeight: 600, color: ROI_C.dim, textTransform: 'uppercase', letterSpacing: 0.6 }}>View as</span>
            <Pick value={view.region} options={regionOpts} onChange={v => roiSet({ view: { region: v, person: '' } })} title="Region" />
            <Pick value={view.person} options={whoOpts} onChange={v => { const p = roiShares().ppl.find(x => x.name === v); roiSet({ view: { region: p ? p.regions[0] : view.region, person: v } }); }} title="Wholesaler" />
            {scoped && <button onClick={() => roiSet({ view: { region: 'National', person: '' } })} style={{ height: 24, padding: '0 9px', borderRadius: 6, cursor: 'pointer', background: 'transparent', border: '1px solid rgba(75,85,99,0.5)', color: 'rgb(209,213,219)', fontFamily: 'Inter', fontSize: 11 }}><i className="fa-solid fa-xmark" style={{ fontSize: 9, marginRight: 5 }} />National</button>}
          </span>
        )}
        <TabPills options={['R12', 'YTD', 'Q', 'ITD']} labels={{ R12: 'Trailing 12 mo', YTD: 'YTD', Q: 'Last 3 mo', ITD: 'Since go-live' }} value={s.period} onChange={v => roiSet({ period: v })} />
        <button onClick={() => setOpen(true)} style={{ height: 30, padding: '0 12px', borderRadius: 8, border: '1px solid rgba(75,85,99,0.7)', background: 'rgba(0,0,0,0.25)', color: 'rgb(209,213,219)', fontFamily: 'Inter', fontSize: 12, fontWeight: 500, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7 }}><i className="fa-solid fa-sliders" style={{ fontSize: 11 }} />Assumptions</button>
      </div>

      {scoped && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, background: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.35)', fontFamily: 'Inter', fontSize: 12, color: 'rgb(229,231,235)', lineHeight: 1.5 }}>
          <i className="fa-solid fa-user-tie" style={{ color: ROI_C.blu }} />
          <span>Lift and behavior come from {view.person ? 'this wholesaler\'s' : 'this region\'s'} own FA/Teams. Data packs, the Field fee and efficiency are split evenly across {roiShares().n} wholesalers; campaigns and events follow their members. Wholesalers add up to the national total.</span>
        </div>
      )}
      {(onboarding || L1) && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', borderRadius: 10, background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.35)', fontFamily: 'Inter', fontSize: 12, color: 'rgb(229,231,235)', lineHeight: 1.5 }}>
          <i className="fa-solid fa-hourglass-half" style={{ color: ROI_C.amb, marginTop: 3 }} />
          <span>{L1
            ? <>Without sales and CRM data, Phase 1 shows <b>indicative</b> results from the data packs. Measured lift starts once Phase 2 loads your sales and CRM history.</>
            : <>Measurement is still maturing ({r.live} months live). Lift usually shows about 3 months after the activity and meetings take time to book. At Phase 2 go-live, FA/Teams the signals would have flagged bought <b>{roiX(ROI_BACKTEST.hitX)} their run rate</b> vs. unflagged. That validates the signals; it isn't counted as ROI.</>}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 12 }}>
        {L1 ? (
          <>
            <RoiKpi label="Opportunity identified" value="$4.2B" sub="In your focus categories, across 9,800 FA/Teams" />
            <RoiKpi label="Signals issued" value={Math.round(1520 * r.M / 12).toLocaleString()} sub="Performance Advantage and Fee Advantage, from the data packs" />
            <RoiKpi label="Indicative sales" value={roiM(r.ind)} tag="indicative" sub="Share gained at flagged FA/Teams vs. unflagged" />
            <RoiKpi label="Indicative value" value={roiM(r.ind * r.vpm)} tag="indicative" sub={`${roiX(r.ind * r.vpm / Math.max(r.costTotal, 0.001))} on data packs + Field`} />
            <RoiKpi label="Intelligence cost" value={roiM(r.costTotal)} sub={`Data packs ${roiM(r.costPacks)} · Field ${roiM(r.costField)}`} />
            <RoiKpi label="Break-even lift" value={roiM(be)} sub={`Incremental flows a year to cover Intelligence cost · ${(be / ROI_GROSS_SALES_M * 100).toFixed(1)}% of gross sales`} />
          </>
        ) : (
          <>
            <RoiKpi label="Sales lift" value={roiM(r.sig + r.camp)} tag="measured" strong sub={`${pct(r.liftPct)} over run rate · plus ${roiM(r.ret)} assets retained`} />
            <RoiKpi label={r.full ? 'Total value' : 'Revenue value'} value={roiM(r.totValue)} tag={r.full ? null : 'measured'} sub={r.full ? `${roiM(r.value)} revenue (measured) + ${roiM(r.effValue + r.buildValue)} efficiency and cost avoided (estimated)` : `${roiM(r.flows)} flows at ${s.feeBps} bps net fee, over the life of the assets`} />
            <RoiKpi label="Intelligence cost" value={roiM(r.costTotal)} sub={`Data packs ${roiM(r.costPacks)}${r.costCE ? ` · campaigns & events ${roiM(r.costCE)}` : ''} · Field ${roiM(r.costField)}${r.costInt ? ` · internal ${roiM(r.costInt)}` : ''}`} />
            <RoiKpi label="Net value" value={roiM(r.net)} strong={r.net > 0} tone={r.net < 0 ? ROI_C.red : null} sub="Value less everything you spend on distribution intelligence" />
            <RoiKpi label="ROI" value={roiX(r.roiX)} strong={r.roiX >= 1} tone={r.roiX < 1 ? ROI_C.amb : null} sub={r.full ? `Revenue only ${roiX(r.value / Math.max(r.costTotal, 0.001))}` : 'Revenue value ÷ Intelligence cost'} />
            <RoiKpi label="Return on data pack spend" value={roiX(r.roiPacks)} strong={r.roiPacks >= 1} sub="Before Field: not measured. Value from pack-sourced signals ÷ pack cost." />
          </>
        )}
      </div>

      {!L1 && (
        <Tile title="Behavior change" subtitle="How the lift happened: what the team does differently" pad={0}>
          <RoiBehavior r={r} view={view} />
        </Tile>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(460px,1fr))', gap: 16 }}>
        <Tile title="From lift to net value" subtitle={`${L1 ? 'Indicative value' : 'Revenue value'}, less data packs, campaigns and events, and the Field fee · ${ROI_PERIODS[s.period].toLowerCase()}`}>
          <HC options={tw.wf} style={{ height: 270 }} />
        </Tile>
        <Tile title="Monthly value vs. cost" subtitle="Everything you spend on distribution intelligence against the revenue value it produces">
          <HC options={tw.trend} style={{ height: 270 }} />
        </Tile>
      </div>

      {onboarding && (
        <Tile title="Measurement status" subtitle="Shown while measurement matures; it drops away once a full window of results is in" pad={0}>
          <RoiPath r={r} />
        </Tile>
      )}

      <Tile title="ROI by component" subtitle={`Signals, data packs, campaigns and events, each with full credit; the total counts each sale once · ${ROI_PERIODS[s.period].toLowerCase()}`} pad={0}>
        <RoiComponents r={r} s={s} />
      </Tile>

      <Tile title="Sales team impact" subtitle="Engaged vs. not engaged FA/Teams · rolling 12 months, refreshed monthly" pad={0}>
        <RoiActivities r={r} />
      </Tile>

      <Tile title="Field vs. status quo" subtitle={`Standalone check: total sales vs. your 3-year trend, separate from the measured ROI · ${ROI_PERIODS[s.period].toLowerCase()}`} pad={0}>
        <RoiStatusQuo r={r} s={s} />
      </Tile>

      <Tile title="Value layers" subtitle={`ROI counts layers 1 and 2; layer 3 is listed, not valued · ${ROI_PERIODS[s.period].toLowerCase()}`} pad={0}>
        <RoiValueLayers r={r} s={s} />
      </Tile>

      <div style={{ border: `1px solid ${ROI_C.line}`, borderRadius: 12, background: 'rgba(255,255,255,0.015)' }}>
        <button onClick={() => setMath(m => !m)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '12px 18px', background: 'transparent', border: 'none', cursor: 'pointer', color: ROI_C.ink, fontFamily: 'Inter', fontSize: 12.5, fontWeight: 600 }}>
          <i className="fa-solid fa-calculator" style={{ fontSize: 11, color: ROI_C.acc }} />Show the math<span style={{ flex: 1 }} /><i className={`fa-solid fa-chevron-${math ? 'up' : 'down'}`} style={{ fontSize: 10, color: ROI_C.mut }} />
        </button>
        {math && (
          <div style={{ padding: '0 18px 16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 14, fontFamily: 'Inter', fontSize: 11.5, color: 'rgb(209,213,219)', lineHeight: 1.6 }}>
            <div><b style={{ color: ROI_C.ink }}>Sales lift.</b> Actual sales since the acted-on signal or activity, less the FA/Team's run rate: prior-12-month average daily sales × days since, with days capped at {s.win === 365 ? '12 months' : `${s.win} days`}. Lift % = incremental sales ÷ run-rate sales for the period. Acted on = meeting, event, connected call or 1:1 sales email within 30 days. Not-acted signals in the same band check that it isn't just the market.</div>
            <div><b style={{ color: ROI_C.ink }}>Revenue value.</b> Flows × net management fee (gross less waivers and caps) × {r.pv.toFixed(2)}, a year's fee carried over the life of the assets (redemption by vehicle, blended {roiRedeem(s).toFixed(0)}% a year, up to {ROI_LIFE_CAP} years), discounted at {s.disc}%. This values the assets already won; it doesn't project future lift.</div>
            <div><b style={{ color: ROI_C.ink }}>ROI.</b> Value for the period ÷ Intelligence cost for the period: data packs, campaigns and events, the Field fee and any internal resources. By component, each signal type, data pack, campaign and event gets full credit for the sales it touched; group rows and the total count each sale once.</div>
            <div><b style={{ color: ROI_C.ink }}>Value layers and status quo.</b> ROI counts measured revenue plus estimated efficiency (capacity freed) and, when switched on, the cost of running it in-house. The ROI tile also shows revenue-only ROI. Strategic benefits are listed, not valued. Field vs. status quo is a standalone check (total sales vs. your 3-year trend) and isn't part of the ROI calculation. Behavior metrics explain the lift and are never added as dollars.</div>
          </div>
        )}
      </div>
      {open && <RoiAssumptions s={s} onClose={() => setOpen(false)} />}
    </div>
  );
}

/* ---- banner for Leadership and Territory dashboards ---- */
function RoiBanner({ level = 3, scope = 'lead', onOpen, person = 'Morgan Vance', region = 'Northeast' }) {
  const [s] = useRoi();
  const terr = scope === 'territory';
  const v = terr ? { region, person } : { region: 'National', person: '' };
  const r = roiCalc(s, level, { period: 'R12', ...roiScopeOpt(v) });
  const L1 = level === 1;
  const open = () => { if (terr) { roiGoPage('l3intel'); return; } roiSet({ view: v }); (onOpen || roiGo)(); };
  const cell = (l, val, c, tag) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
      <span style={{ fontFamily: 'Inter', fontSize: 9.5, fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase', color: ROI_C.dim, whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 6 }}>{l}{tag && <RoiTag kind={tag} />}</span>
      <span style={{ fontFamily: "'Inter Display', Inter", fontSize: 18, fontWeight: 600, color: c || ROI_C.ink, fontVariantNumeric: 'tabular-nums' }}>{val}</span>
    </div>
  );
  return (
    <div style={{ margin: '16px 24px 0', padding: '12px 16px', borderRadius: 12, background: 'linear-gradient(90deg, rgba(16,185,129,0.09), rgba(255,255,255,0.03))', border: '1px solid rgba(16,185,129,0.35)', display: 'flex', alignItems: 'center', gap: 22, flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 180 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="fa-solid fa-sack-dollar" style={{ color: ROI_C.acc, fontSize: 14 }} /></div>
        <div>
          <div style={{ fontFamily: 'Inter', fontSize: 12.5, fontWeight: 600, color: ROI_C.ink }}>{terr ? 'Your sales lift' : 'Distribution Intelligence ROI'}</div>
          <div style={{ fontFamily: 'Inter', fontSize: 10.5, color: ROI_C.mut }}>{terr ? `${person} · trailing 12 months` : 'Trailing 12 months'}</div>
        </div>
      </div>
      {L1 ? (
        <>
          {cell('Indicative sales', roiM(r.ind), ROI_C.amb, 'indicative')}
          {cell('Signals issued', Math.round(1520 * r.kL * r.M / 12).toLocaleString())}
          {cell('Measured ROI', 'Phase 2', ROI_C.mut)}
        </>
      ) : (
        <>
          {cell('Sales lift', `${roiM(r.sig + r.camp)} · ${(r.liftPct * 100).toFixed(1)}%`, ROI_C.acc)}
          {!terr && cell('Revenue value', roiM(r.totValue))}
          {terr && cell('Revenue lift', roiM((r.sig + r.camp) * r.fee))}
          {cell('Incremental AUM', roiM(r.incAum[r.live - 1]))}
          {!terr && cell('ROI', roiX(r.roiTotal), r.roiTotal >= 1 ? ROI_C.acc : ROI_C.amb)}
          {terr && cell('Signals left unworked', roiM(r.sig * 0.42), ROI_C.amb)}
        </>
      )}
      <div style={{ flex: 1 }} />
      <button onClick={open} style={{ height: 30, padding: '0 12px', borderRadius: 8, border: '1px solid rgba(16,185,129,0.6)', background: 'rgba(16,185,129,0.12)', color: ROI_C.acc, fontFamily: 'Inter', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7, whiteSpace: 'nowrap' }}>{terr ? 'Work your signals' : 'Open ROI Center'}<i className="fa-solid fa-arrow-right" style={{ fontSize: 10 }} /></button>
    </div>
  );
}

/* ---- briefs: one line on the territory/leadership brief, an ROI section on the monthly review ---- */
function RoiBriefStrip({ view, audience, region = 'National', person = '', pick = 'ext', per = 'week' }) {
  const [s] = useRoi();
  const level = window.AMP_PHASE || 3;
  if (level < 2 || view === 'sabrief') return null;
  const monthly = view === 'monthly' || view === 'lmonthly';
  const lead = audience === 'lead';
  const P = person ? ((window.ML_PEOPLE || []).find(p => p.name === person) || null) : null;
  const scopeV = lead ? (P ? (P.role === 'ext' ? { region: P.regions[0], person } : { region: P.regions[0], person: '' }) : { region, person: '' })
    : (pick === 'ext' ? { region: 'Northeast', person: 'Morgan Vance' } : { region: 'Northeast', person: '' });
  const r = roiCalc(s, level, { period: 'R12', ...roiScopeOpt(scopeV) });
  const perTxt = per === 'month' ? 'last month' : 'since your last brief', perK = per === 'day' ? 1 / 21 : per === 'month' ? 1 : 1 / 4.33;
  const go = () => { if (!lead) { roiGoPage('l3intel'); return; } roiSet({ view: scopeV }); roiGo(); };
  const goLbl = lead ? 'ROI Center →' : 'Work your signals →';
  const goBtn = <button onClick={go} style={{ background: 'transparent', border: 'none', padding: 0, color: ROI_C.acc, fontFamily: 'Inter', fontSize: 12, cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' }}>{goLbl}</button>;
  const box = { padding: '11px 14px', borderRadius: 10, background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.35)', fontFamily: 'Inter', fontSize: 12.5, color: 'rgb(229,231,235)', lineHeight: 1.5 };
  if (!monthly) {
    const acted = r.last.sig, liftX = level >= 3 ? 2.1 : 1.8;
    return (
      <div style={{ ...box, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <i className="fa-solid fa-sack-dollar" style={{ color: ROI_C.acc }} /><b style={{ color: ROI_C.ink }}>{lead ? 'Sales lift' : 'Your sales lift'} {perTxt}</b><RoiTag kind="measured" />
          <span style={{ flex: 1 }} />{goBtn}
        </div>
        <span>{lead ? (P ? P.name.split(' ')[0] : region === 'National' ? 'Team' : region) : 'You'}: signals acted on {perTxt} delivered <b style={{ color: ROI_C.acc }}>{roiM(acted * perK)}</b> of incremental sales ({roiX(liftX)} lift). <span style={{ color: ROI_C.amb }}>{roiM(r.last.sig * 0.42 * perK)}</span> is sitting in signals not yet worked.</span>
      </div>
    );
  }
  const mFlows = r.last.flows, mVal = r.last.value;
  return (
    <div style={{ ...box, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <i className="fa-solid fa-sack-dollar" style={{ color: ROI_C.acc }} /><b style={{ color: ROI_C.ink }}>{lead ? 'ROI this month' : 'Your sales lift this month'}</b><RoiTag kind="measured" />
        <span style={{ flex: 1 }} />{goBtn}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12 }}>
        {[['Incremental flows', roiM(mFlows), `${roiM(r.flows)} trailing 12 months`], ['Revenue value', roiM(mVal), `${roiM(r.value)} trailing 12 months`], ['Sales lift', `+${(r.liftPct * 100).toFixed(1)}%`, `Over run rate · ${roiM(r.incAum[r.live - 1])} incremental AUM`], (lead ? ['ROI', roiX(r.roiTotal), 'On Intelligence cost · trailing 12 months'] : ['Revenue lift', roiM((r.sig + r.camp) * r.fee), 'Annual fees on your sales lift · trailing 12 months'])].map(([l, v, sub]) => (
          <div key={l}><div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase', color: ROI_C.dim }}>{l}</div><div style={{ fontFamily: "'Inter Display', Inter", fontSize: 19, fontWeight: 600, color: ROI_C.ink }}>{v}</div><div style={{ fontSize: 11, color: ROI_C.mut }}>{sub}</div></div>
        ))}
      </div>
      <div style={{ fontSize: 12, color: 'rgb(209,213,219)' }}><b style={{ color: ROI_C.acc }}>What to shift:</b> in-person meetings after a signal returned 2.4× run rate and the Boston summit returned the most per dollar of any event; mass email and voicemails added nothing. Move effort toward Performance Advantage and Upsell signals, which convert best.</div>
    </div>
  );
}

Object.assign(window, { RoiPage, RoiBanner, RoiBriefStrip, roiCalc, roiGet, roiGo, useRoi, roiFor, roiScopeOpt });
