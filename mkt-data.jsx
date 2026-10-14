/* Marketing — national FA/Team universe, campaign templates (generic first,
   then signal-driven), FA/Team signal families, product focus, audience
   matching, and seeded campaign history for Campaign Analytics. */

const MK_REGION_CITIES = {
  Northeast: null,
  Southeast: ['Atlanta', 'Miami', 'Charlotte', 'Tampa', 'Nashville', 'Raleigh'],
  Midwest: ['Chicago', 'Minneapolis', 'Detroit', 'St. Louis', 'Columbus', 'Milwaukee'],
  Southwest: ['Dallas', 'Houston', 'Phoenix', 'Austin', 'Denver', 'San Antonio'],
  West: ['Los Angeles', 'San Francisco', 'Seattle', 'San Diego', 'Portland', 'Salt Lake City'],
};
const MK_STRATEGIC = ['Contoso Wealth', 'Northwind Securities'];
const MK_AUM_BANDS = ['<$100M', '$100–250M', '$250–500M', '$500M–$1B', '>$1B'];
const mkAumBand = (a) => a < 100 ? MK_AUM_BANDS[0] : a < 250 ? MK_AUM_BANDS[1] : a < 500 ? MK_AUM_BANDS[2] : a < 1000 ? MK_AUM_BANDS[3] : MK_AUM_BANDS[4];
const MK_DM_TITLES = ['CIO', 'Managing Director', 'Lead Advisor', 'Senior Partner'];
const MK_MEMBER_TITLES = ['Financial Advisor', 'Portfolio Manager', 'Associate Advisor', 'Client Service Associate', 'Analyst'];
const MK_ACTIVE_CAMPAIGNS = ['Q4 Core Equity ETF Drip', 'Muni SMA Year-End Tax', 'Private Credit Education Series'];
const MK_PRODUCT_NAMES = LV_CATALOG.map(c => c.name.replace(/^Field /, ''));
const MK_STATUS = ['Producer', 'Dabbler', 'Prospect'];

const MK_UNIVERSE = (() => {
  const out = [], seen = new Set();
  const r = lvRng(80021);
  ML_REGIONS.forEach((rg, ri) => {
    const ext = ML_TEAM[rg].ext;
    LV_ROWS.forEach((src0, i) => {
      const src = ri === 0 ? src0 : LV_ROWS[(i * 7 + ri * 53) % LV_ROWS.length];
      let name = src0.name, city = src0.city;
      if (ri > 0) {
        const team = src.type === 'Team';
        for (let k = 0; k < 6; k++) {
          name = team ? `${lvPick(r, LV_TEAM_WORDS)} ${lvPick(r, LV_TEAM_TAIL)}` : `${lvPick(r, LV_FIRST)} ${lvPick(r, ['A.', 'B.', 'C.', 'J.', 'L.', 'M.', 'R.', 'S.', 'T.'])} ${lvPick(r, LV_LAST)}`;
          if (!seen.has(name)) break;
          name = `${lvPick(r, ['North', 'South', 'Harbor', 'Summit', 'River', 'Park', 'Bay'])} ${name}`;
          if (!seen.has(name)) break;
        }
        city = lvPick(r, MK_REGION_CITIES[rg]);
      }
      seen.add(name);
      const scale = ri === 0 ? 1 : 0.7 + r() * 0.6;
      const aum = Math.round(src.aum * scale);
      const size = src.type === 'Team' ? 2 + Math.floor(r() * 5) : 1;
      const contacts = [];
      const dmName = src.type === 'FA' ? name : `${lvPick(r, LV_FIRST)} ${lvPick(r, LV_LAST)}`;
      contacts.push({ name: dmName, title: src.type === 'FA' ? 'Financial Advisor' : lvPick(r, MK_DM_TITLES), dm: true, email: r() > 0.06, optOut: r() < 0.03 });
      for (let k = 1; k < size; k++) contacts.push({ name: `${lvPick(r, LV_FIRST)} ${lvPick(r, LV_LAST)}`, title: lvPick(r, MK_MEMBER_TITLES), dm: false, email: r() > 0.1, optOut: r() < 0.05 });
      const days = src.act && src.act.ext ? src.act.ext.days : null;
      const owns = (src.holdings || []).filter(h => h.aumM > 0 || h.product).map(h => h.product.replace(/^Field /, ''));
      const sigs = src.signals || [];
      const top = sigs.reduce((b, s) => (!b || s.opp > b.opp ? s : b), null);
      out.push({
        id: `r${ri}-${i}`, src, name, type: src.type, firm: src.firm, channel: src.channel,
        region: rg, city, wholesaler: ext[i % ext.length],
        segment: src.segment, prodCat: src.prodCat, prodBand: src.prodBand, aum, aumBand: mkAumBand(aum),
        r12ProdK: Math.round(src.r12ProdK * scale), lastTouch: days, engagement: src.engagement || [],
        signals: sigs, top, owns: [...new Set(owns)], contacts, strategic: MK_STRATEGIC.includes(src.firm),
        activeCampaign: r() < 0.11 ? lvPick(r, MK_ACTIVE_CAMPAIGNS) : null,
      });
    });
  });
  return out;
})();

/* Product focus: a campaign can run on any strategy, or none. */
const MK_PRODUCTS = [
  { key: 'any', label: 'Any product', cat: null, color: 'rgb(209,213,219)', icon: 'layer-group' },
  { key: 'core', label: 'Core Equity', cat: 'Large Blend', color: 'rgb(96,165,250)', icon: 'chart-pie' },
  { key: 'growth', label: 'Large Growth', cat: 'Large Growth', color: 'rgb(52,211,153)', icon: 'arrow-trend-up' },
  { key: 'muni', label: 'Muni Ladder SMA', cat: 'Muni National', color: 'rgb(56,189,248)', icon: 'building-columns' },
  { key: 'pc', label: 'Private Credit', cat: 'Private Credit', color: 'rgb(129,140,248)', icon: 'hand-holding-dollar' },
  { key: 'cplus', label: 'Core Plus Bond', cat: 'Int. Core-Plus', color: 'rgb(45,212,191)', icon: 'scale-balanced' },
];
const MK_PROD = MK_PRODUCTS.reduce((a, p) => (a[p.key] = p, a), {});
const MK_CAT_PRODUCTS = (cat) => LV_CATALOG.filter(c => c.cat === cat).map(c => c.name.replace(/^Field /, ''));

/* Signal families mirror the sales families (names, colours, icons) so a
   marketing audience reads the same as the Territory Analytics grid. Focus
   product is handled by product focus; Coverage doesn't apply to campaigns. */
const MK_FAM_COLORS = { Advantage: 'rgb(52,211,153)', Growth: 'rgb(251,191,36)', Recovery: 'rgb(244,114,182)' };
const MK_SIGNALS = [
  { key: 'none', label: 'No signal', icon: 'users', color: 'rgb(148,163,184)', types: [], desc: 'Audience comes from the filters alone.' },
  { key: 'adv', label: 'Advantage', icon: 'chart-line', color: MK_FAM_COLORS.Advantage, types: ['Performance Advantage', 'Fee Advantage'], desc: 'Performance or fee advantage over the competing hold.' },
  { key: 'growth', label: 'Growth', icon: 'arrow-up-right-dots', color: MK_FAM_COLORS.Growth, types: ['Cross-sell', 'Upsell'], desc: 'Owns you already; market basket model ranks the next product or a bigger ticket.' },
  { key: 'recovery', label: 'Recovery', icon: 'shield-halved', color: MK_FAM_COLORS.Recovery, types: ['Retention Risk', 'Fallen Angel'], desc: 'Assets at risk, or former producers who went quiet.' },
  { key: 'any', label: 'Any signal', icon: 'bolt', color: 'rgb(226,232,240)', types: LV_SIG_TYPES, desc: 'Any open FA/Team signal at or above the confidence floor.' },
];
const MK_TYPE_SHORT = { 'Performance Advantage': 'Performance', 'Fee Advantage': 'Fee', 'Cross-sell': 'Cross-sell', 'Upsell': 'Upsell', 'Retention Risk': 'Retention risk', 'Fallen Angel': 'Fallen angel' };
const MK_SIG = MK_SIGNALS.reduce((a, s) => (a[s.key] = s, a), {});

/* Templates are presets: a signal family, a product focus and audience filters.
   Generic templates lead; signal-driven ones follow. */
const MK_TEMPLATES = [
  { key: 'blank', kind: 'gen', label: 'Blank campaign', icon: 'plus', desc: 'Start from the full national universe and build with filters. Add a signal or product below if needed.', sig: 'none', product: 'any', preset: {} },
  { key: 'comp', kind: 'sig', label: 'Competitive advantage', icon: 'trophy', desc: 'Lead with the performance or fee case where you beat the competing hold.', sig: 'adv', types: ['Performance Advantage', 'Fee Advantage'], product: 'any', preset: { touch: 90 } },
  { key: 'xsell', kind: 'sig', label: 'Cross-sell', icon: 'shuffle', desc: 'Owners of one product with a modelled next product they don’t own yet.', sig: 'growth', types: ['Cross-sell'], product: 'any', preset: { status: ['Producer'], exclFocusOwners: true } },
  { key: 'ret', kind: 'sig', label: 'Retention defense', icon: 'shield-halved', desc: 'Reinforce the case before assets move.', sig: 'recovery', types: ['Retention Risk'], product: 'any', preset: { status: ['Producer', 'Dabbler'] } },
  { key: 'fallen', kind: 'sig', label: 'Fallen angel win-back', icon: 'arrow-trend-down', desc: 'Re-engage former producers who went quiet.', sig: 'recovery', types: ['Fallen Angel'], product: 'any', preset: {} },
  { key: 'webfu', kind: 'sig', label: 'Webinar follow-up', icon: 'video', desc: 'Attended a webinar and carries an open signal. Generic or product-specific.', sig: 'any', product: 'any', preset: { engagement: ['webinar'] } },
  { key: 'prospect', kind: 'sig', label: 'Prospect introduction', icon: 'user-plus', desc: 'No business with you yet, with a scored fit.', sig: 'any', product: 'any', preset: { status: ['Prospect'] } },
];

/* Campaigns already set up in the client's CRM, tagged with the
   template/signal and product they fit. */
const MK_JOURNEYS = [
  { name: 'Core Equity · Competitive Advantage Drip', fits: ['comp'], products: ['core'] },
  { name: 'Large Growth · Performance Story', fits: ['comp'], products: ['growth'] },
  { name: 'Muni SMA · Tax-Aware Advantage Drip', fits: ['comp', 'blank'], products: ['muni'] },
  { name: 'Private Credit Education Series', fits: ['blank', 'comp', 'webfu', 'prospect'], products: ['pc'] },
  { name: 'Core Plus Bond · Income Drip', fits: ['comp', 'blank'], products: ['cplus'] },
  { name: 'Cross-sell · Next Best Product', fits: ['xsell'], products: ['any', 'core', 'growth', 'muni', 'pc', 'cplus'] },
  { name: 'Retention · Stay the Course', fits: ['ret'], products: ['any', 'core', 'growth', 'muni', 'pc', 'cplus'] },
  { name: 'Fallen Angel Win-back', fits: ['fallen'], products: ['any', 'core', 'growth', 'muni', 'pc', 'cplus'] },
  { name: 'Webinar Follow-up · Replay + Deck', fits: ['webfu'], products: ['any', 'core', 'growth', 'muni', 'pc', 'cplus'] },
  { name: 'Prospect Introduction', fits: ['prospect'], products: ['any', 'core', 'growth', 'muni', 'pc', 'cplus'] },
  { name: 'Monthly Market Outlook', fits: ['blank'], products: ['any'] },
  { name: 'Wholesaler Introduction', fits: ['blank'], products: ['any'] },
  { name: 'Event Invitation', fits: ['blank'], products: ['any', 'core', 'growth', 'muni', 'pc', 'cplus'] },
];
const mkJourneysFor = (tpl, sig, product, types) => {
  if (tpl === 'blank' && sig === 'recovery' && types && types.length === 1 && types[0] === 'Fallen Angel') tpl = 'fallen';
  const key = tpl !== 'blank' ? tpl : sig === 'none' || sig === 'any' ? 'blank' : sig === 'adv' ? 'comp' : sig === 'growth' ? 'xsell' : 'ret';
  const fit = MK_JOURNEYS.filter(j => j.fits.includes(key) && j.products.includes(product));
  return { fit, other: MK_JOURNEYS.filter(j => !fit.includes(j)) };
};
const MK_TPL = MK_TEMPLATES.reduce((a, t) => (a[t.key] = t, a), {});

const MK_FOCUS_CAT = { 'Focus: Core Equity ETF': 'Large Blend', 'Focus: Muni Ladder SMA': 'Muni National', 'Focus: Private Credit Fund': 'Private Credit' };
const mkSigCat = (s) => MK_FOCUS_CAT[s.type] || (window.lvSigCat ? lvSigCat(s.product) : null);

/* Best FA/Team signal for a family + product focus, or null. For 'none' the
   FA/Team's top signal rides along for context. */
function mkMatch(u, sigKey, prodKey, minConf, types) {
  if (sigKey === 'none') return { s: u.top, generic: true };
  const fam = MK_SIG[sigKey], cat = MK_PROD[prodKey].cat;
  // Signals without a product (retention, fallen angel, meeting) match a
  // product focus through what the FA/Team holds in that strategy.
  const holdsCat = cat ? MK_CAT_PRODUCTS(cat).some(p => u.owns.includes(p)) : true;
  let best = null;
  for (const s of u.signals) {
    if (!(types && types.length ? types : fam.types).includes(s.type) || s.confidence < minConf) continue;
    if (cat) { const sc = mkSigCat(s); if (sc ? sc !== cat : !holdsCat) continue; }
    if (!best || s.opp > best.opp) best = s;
  }
  return best ? { s: best, generic: false } : null;
}
function mkSignalCount(sigKey, prodKey, minConf, pool, types) {
  let n = 0;
  for (const u of pool || MK_UNIVERSE) if (mkMatch(u, sigKey, prodKey, minConf, types)) n++;
  return n;
}

/* ---- campaign history ---- */
/* Lift is measured against each member's own pre-campaign run rate (trailing
   12-month sales, annualised to the campaign window). */
const MK_WINDOW_WEEKS = 26;
const MK_DIMS = [
  { key: 'region', label: 'Region' },
  { key: 'wholesaler', label: 'Wholesaler' },
  { key: 'segment', label: 'Segment' },
  { key: 'status', label: 'Producer status' },
  { key: 'prodBand', label: 'Production' },
  { key: 'channel', label: 'Channel' },
  { key: 'engagement', label: 'Engagement type' },
  { key: 'firm', label: 'Firm' },
  { key: 'product', label: 'Product' },
];
const MK_TOP_FIRMS = (() => { const n = {}; MK_UNIVERSE.forEach(u => { if (u.firm) n[u.firm] = (n[u.firm] || 0) + 1; }); return Object.keys(n).sort((a, b) => n[b] - n[a]); })();
const mkDimKeys = (dim) => dim === 'region' ? ML_REGIONS : dim === 'wholesaler' ? ML_REGIONS.flatMap(rg => ML_TEAM[rg].ext) : dim === 'segment' ? LV_SEGMENTS.map(s => `Segment ${s}`) : dim === 'status' ? MK_STATUS : dim === 'prodBand' ? LV_PROD_BANDS.filter(b => b !== '$0') : dim === 'channel' ? LV_ALL_CHANNELS : dim === 'firm' ? MK_TOP_FIRMS : dim === 'product' ? MK_PRODUCT_NAMES : LV_ENGAGEMENT.map(e => e.label);
const mkHash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; };

function mkBreakdown(c, dim) {
  if (c.fresh) return [];
  const r = lvRng(mkHash(c.id + dim));
  const keys = mkDimKeys(dim);
  const focusCat = MK_PROD[c.product] && MK_PROD[c.product].cat, catOf = (k) => (LV_CATALOG.find(x => x.name.replace(/^Field /, '') === k) || {}).cat;
  const shareTilt = (k) => dim === 'product' && focusCat ? (catOf(k) === focusCat ? 8 : 0.35) : 1;
  const tilt = (k, i) => dim === 'segment' ? [1.35, 1, 0.65][i] : dim === 'status' ? [1.2, 1, 0.7][i] : dim === 'engagement' ? (k === 'Webinar' || k === 'Conference' ? 1.3 : 1) : 1;
  let rows = keys.map((k, i) => ({ key: k, share: (0.4 + r()) * shareTilt(k), eng: c.engaged * tilt(k, i) * (0.75 + r() * 0.5), lift: c.lift * tilt(k, i) * (0.55 + r() * 0.9) }));
  if (dim === 'wholesaler' && c.scopeRegions) rows = rows.filter(x => c.scopeRegions.some(rg => ML_TEAM[rg].ext.includes(x.key)));
  const st = rows.reduce((a, x) => a + x.share, 0);
  rows.forEach(x => { x.share /= st; x.members = Math.max(1, Math.round(c.members * x.share)); });
  const wsum = rows.reduce((a, x) => a + x.share * (1 + x.lift), 0);
  rows.forEach(x => { x.attributed = c.attributed * x.share * (1 + x.lift) / wsum; x.base = x.attributed / (1 + x.lift); x.liftD = x.attributed - x.base; x.eng = Math.min(0.95, x.eng); });
  return rows;
}

const MK_CHANNEL = {"Q4 Core Equity ETF Drip":"Email","Muni SMA Year-End Tax":"Email","Private Credit Education Series":"Webinar series","Growth Owners → Core Equity Cross-sell":"Email","Q3 Large Growth Fee Advantage":"Email","Summer Fallen Angel Win-back":"Email","Core Equity Webinar Follow-up (Jul)":"Webinar","Muni Ladder Prospect Intro":"Email","Core Equity Upsell to Existing Owners":"Email","Large Growth Retention Defense":"Email","Meet Your New West Wholesaler":"Event"};
const MK_SEED_CAMPAIGNS = (() => {
  const r = lvRng(61203);
  const defs = [
    ['Q4 Core Equity ETF Drip', 'comp', 'adv:Performance Advantage', 'core', 'Active', '2026-07-20', 1840, 6],
    ['Muni SMA Year-End Tax', 'blank', 'none', 'muni', 'Active', '2026-08-31', 1210, 5],
    ['Private Credit Education Series', 'blank', 'none', 'pc', 'Active', '2026-08-18', 640, 45],
    ['Growth Owners → Core Equity Cross-sell', 'xsell', 'growth:Cross-sell', 'core', 'Active', '2026-09-14', 870, 4],
    ['Q3 Large Growth Fee Advantage', 'comp', 'adv:Fee Advantage', 'growth', 'Completed', '2026-06-02', 2260, 7],
    ['Summer Fallen Angel Win-back', 'fallen', 'recovery:Fallen Angel', 'any', 'Completed', '2026-05-12', 980, 5],
    ['Core Equity Webinar Follow-up (Jul)', 'webfu', 'any', 'core', 'Completed', '2026-07-14', 520, 18],
    ['Muni Ladder Prospect Intro', 'prospect', 'any', 'muni', 'Completed', '2026-04-20', 1460, 6],
    ['Core Equity Upsell to Existing Owners', 'blank', 'growth:Upsell', 'core', 'Completed', '2026-04-06', 760, 4],
    ['Large Growth Retention Defense', 'ret', 'recovery:Retention Risk', 'growth', 'Completed', '2026-05-26', 690, 5],
    ['Meet Your New West Wholesaler', 'blank', 'none', 'any', 'Completed', '2026-06-23', 410, 35],
  ];
  return defs.map(([name, tpl, sigSpec, product, status, start, members, costK], i) => {
    const [sig, one] = sigSpec.split(':');
    const types = one ? [one] : (MK_SIGNALS.find(x => x.key === sig) || { types: [] }).types;
    const open = 0.24 + r() * 0.18, click = open * (0.16 + r() * 0.14);
    const engaged = 0.18 + r() * 0.26;
    const lift = 0.05 + r() * 0.17;
    const runRate = members * (0.11 + r() * 0.1); // $M a year across members
    const weeks = status === 'Active' ? Math.min(MK_WINDOW_WEEKS, Math.max(2, Math.round((new Date('2026-10-12') - new Date(start)) / 6048e5))) : MK_WINDOW_WEEKS;
    const baseline = runRate * weeks / 52;
    const ramp = (() => { let s = 0, t = 0; for (let w = 0; w < MK_WINDOW_WEEKS; w++) { const v = w < 13 ? 0.08 + Math.pow((w + 1) / 13, 1.6) : Math.exp(-(w - 12) / 14); t += v; if (w < weeks) s += v; } return s / t * MK_WINDOW_WEEKS / weeks; })();
    const attributed = Math.round(baseline * (1 + lift * ramp) * 10) / 10;
    const trend = Array.from({ length: weeks }, (_, w) => {
      const decay = Math.exp(-w / 4.5);
      const touchCurve = w < 2 ? 0.6 + w * 0.4 : Math.exp(-(w - 2) / 5);
      // Lift builds over ~90 days, peaks, then tapers slowly.
      const liftCurve = w < 13 ? 0.08 + Math.pow((w + 1) / 13, 1.6) : Math.exp(-(w - 12) / 14);
      return { opens: Math.round(members * open * 0.38 * decay * (0.8 + r() * 0.4)), clicks: Math.round(members * click * 0.38 * decay * (0.8 + r() * 0.4)), touches: Math.round(members * engaged * 0.16 * touchCurve * (0.8 + r() * 0.4)), base: runRate / 52 * (0.9 + r() * 0.2), liftW: liftCurve * (0.75 + r() * 0.5) };
    });
    const lw = trend.reduce((a, t) => a + t.liftW, 0), totLift = (attributed - baseline);
    trend.forEach(t => { t.lift = totLift * t.liftW / lw; t.actual = t.base + t.lift; });
    return { id: 'seed-' + i, name, tpl, sig, types, product, basis: one === 'Retention Risk' ? 'net' : 'sales', status, start, members, contacts: Math.round(members * 1.6), costK, open, click, engaged, lift: baseline ? (attributed - baseline) / baseline : 0, runRate, baseline, attributed, liftD: attributed - baseline, days: weeks * 7, channel: MK_CHANNEL[name] || 'Email', trend, dest: 'CRM campaign', sync: 'Daily', showSales: i % 3 !== 2 };
  }).map(c => ({ ...c, journey: null, measureLift: true, purpose: 'Sales' })).map(c => (c.name.startsWith('Meet Your New West') ? { ...c, scopeRegions: ['West'], scope: 'West', measureLift: false, purpose: 'Awareness' } : c));
})();

function mkLoadUserCampaigns() { try { return JSON.parse(localStorage.getItem('mk_campaigns_v2')) || []; } catch (e) { return []; } }
function mkSaveUserCampaigns(c) { try { localStorage.setItem('mk_campaigns_v2', JSON.stringify(c)); } catch (e) {} }

const mkMoney = (m) => { const a = Math.abs(m), s = m < 0 ? '−' : ''; return a >= 1000 ? `${s}$${(a / 1000).toFixed(1)}B` : a >= 1 ? `${s}$${a.toFixed(1)}M` : `${s}$${Math.round(a * 1000)}K`; };
const mkRevMoney = (m) => { const a = Math.abs(m) * 1e6, s = m < 0 ? '−' : ''; return a < 1000 ? `${s}$${Math.round(a)}` : a < 10000 ? `${s}$${(a / 1000).toFixed(1)}K` : mkMoney(m); };
const mkPct = (v, d = 0) => `${(v * 100).toFixed(d)}%`;
const mkNum = (n) => n.toLocaleString('en-US');
/* Revenue: annual management fee on the sales, at the campaign product's
   blended fee rate (multi-product campaigns use the book average). ROI uses
   revenue lift × 3-year average hold, less cost, over cost. */
const MK_FEE_RATE = { any: 0.0045, core: 0.0030, growth: 0.0055, muni: 0.0040, pc: 0.0110, cplus: 0.0035 };
const MK_HOLD_YRS = 3;
const mkRate = (c) => MK_FEE_RATE[c.product] || MK_FEE_RATE.any;
const mkRev = (c) => c.liftD * mkRate(c);
/* ROI on a contribution basis, not gross revenue:
   value = annual revenue on lift-to-date assets × 40% contribution margin,
   held 3 years with 20% a year redeeming, discounted at an 8% cost of capital
   (factor ≈ 0.92× one year's revenue). Cost is fully loaded (direct cost plus
   $5K setup/content) and, for active campaigns, prorated to days live over the
   26-week window so cost to date matches lift to date. No annualizing. */
const MK_MARGIN = 0.40, MK_REDEEM = 0.20, MK_COC = 0.08, MK_SETUP_K = 5;
const MK_VALUE_F = MK_MARGIN * Array.from({ length: MK_HOLD_YRS }, (_, t) => Math.pow(1 - MK_REDEEM, t) / Math.pow(1 + MK_COC, t)).reduce((a, x) => a + x, 0);
const mkCost = (c) => { if (!c.costK) return 0; const full = c.costK + MK_SETUP_K; return c.status === 'Active' && c.days ? full * Math.min(1, c.days / (MK_WINDOW_WEEKS * 7)) : full; };
const mkRoiOf = (revM, costK) => costK ? (revM * MK_VALUE_F * 1e6 - costK * 1000) / (costK * 1000) : 0;
/* Lift is measured against each campaign's own pre-campaign average daily run
   rate × days live, so it's normalized for how long the campaign has run. */
const mkAnn = () => 1;
const mkRevAnn = (c) => mkRev(c);
const mkRoi = (c) => mkRoiOf(mkRev(c), mkCost(c));
const MK_FEE_BPS = MK_FEE_RATE.any * MK_HOLD_YRS;

/* FA/Team-level results for a campaign: a deterministic sample of the
   universe, with run rate, attributed sales and lift reconciled to the
   campaign totals. Engaged (touched) members carry most of the lift. */
const mkMemberCache = {};
function mkMembers(c) {
  if (c.fresh) return [];
  if (mkMemberCache[c.id]) return mkMemberCache[c.id];
  const r = lvRng(mkHash(c.id + 'members'));
  let pool = c.scopeRegions ? MK_UNIVERSE.filter(u => c.scopeRegions.includes(u.region)) : MK_UNIVERSE;
  pool = pool.map(u => ({ u, k: r() })).sort((a, b) => a.k - b.k).slice(0, Math.min(c.members, pool.length)).map(x => x.u);
  const prod = MK_PROD[c.product], cat = prod && prod.cat;
  const rows = pool.map(u => {
    const opened = r() < c.open, clicked = opened && r() < c.click / c.open, engaged = r() < c.engaged;
    const w = Math.max(5, u.r12ProdK) * (0.6 + r() * 0.8);
    const f = (engaged ? 1.9 : 0.5) * (0.15 + r() * 1.7) - (r() < 0.18 ? 0.6 : 0);
    const owned = cat ? MK_CAT_PRODUCTS(cat).some(p => u.owns.includes(p)) : true;
    return { id: u.id, name: u.name, type: u.type, firm: u.firm, region: u.region, wholesaler: u.wholesaler, opened, clicked, opens: opened ? 1 + Math.floor(r() * 4) : 0, touches: engaged ? 1 + Math.floor(r() * 4) : 0, engaged, w, f, owned };
  });
  const W = rows.reduce((a, x) => a + x.w, 0) || 1;
  rows.forEach(x => { x.base = c.baseline * x.w / W; x.rawLift = x.base * c.lift * x.f; });
  const L = rows.reduce((a, x) => a + x.rawLift, 0) || 1, rate = mkRate(c);
  rows.forEach(x => { x.liftD = x.rawLift / L * c.liftD; x.attributed = x.base + x.liftD; x.rev = x.liftD * rate; x.newBuyer = !x.owned && x.liftD > 0 && r() < 0.35; x.camps = 1; x.nOpened = x.opened ? 1 : 0; x.nClicked = x.clicked ? 1 : 0; });
  return (mkMemberCache[c.id] = rows);
}
function mkMembersAgg(cs) {
  if (cs.length === 1) return mkMembers(cs[0]);
  const m = {};
  cs.forEach(c => mkMembers(c).forEach(x => {
    const y = m[x.id] || (m[x.id] = { ...x, opens: 0, touches: 0, base: 0, liftD: 0, attributed: 0, rev: 0, camps: 0, nOpened: 0, nClicked: 0, newBuyer: false });
    y.camps += 1; y.opens += x.opens; y.touches += x.touches; y.base += x.base; y.liftD += x.liftD; y.attributed += x.attributed; y.rev += x.rev;
    y.nOpened += x.opened ? 1 : 0; y.nClicked += x.clicked ? 1 : 0; y.newBuyer = y.newBuyer || x.newBuyer; y.engaged = y.engaged || x.engaged;
  }));
  return Object.values(m);
}
const mkTypesLabel = (sig, types) => { const s = MK_SIG[sig]; if (!s || sig === 'none') return 'No signal'; if (sig === 'any' || !types || !types.length || types.length === s.types.length) return s.label; return `${s.label} · ${types.map(t => MK_TYPE_SHORT[t] || t).join(', ')}`; };
const mkCampaignLabel = (c) => { const p = MK_PROD[c.product]; return `${mkTypesLabel(c.sig, c.types)}${p && p.key !== 'any' ? ' · ' + p.label : ''}`; };

Object.assign(window, { MK_UNIVERSE, MK_PRODUCTS, MK_PROD, MK_SIGNALS, MK_SIG, MK_FAM_COLORS, MK_TYPE_SHORT, mkTypesLabel, MK_TEMPLATES, MK_TPL, MK_JOURNEYS, mkJourneysFor, MK_WINDOW_WEEKS, MK_AUM_BANDS, MK_STRATEGIC, MK_ACTIVE_CAMPAIGNS, MK_PRODUCT_NAMES, MK_STATUS, MK_CAT_PRODUCTS, MK_DIMS, MK_SEED_CAMPAIGNS, MK_FEE_BPS, MK_FEE_RATE, MK_HOLD_YRS, mkRate, mkRev, mkRevAnn, mkAnn, mkRoiOf, mkCost, MK_VALUE_F, MK_MARGIN, MK_REDEEM, MK_COC, MK_SETUP_K, mkMembers, mkMembersAgg, mkMatch, mkSignalCount, mkBreakdown, mkLoadUserCampaigns, mkSaveUserCampaigns, mkMoney, mkRevMoney, mkPct, mkNum, mkRoi, mkCampaignLabel, mkSigCat });
