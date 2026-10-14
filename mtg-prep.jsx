/* Meeting prep brief, opened from the FA/Team profile. Leads with the
   highest-confidence opportunity: why we recommend it (evidence that is also
   the model's drivers, with sources), what to say and the ask. Then the second
   opportunity, who to speak to, recent notes, watch-outs and follow-ups. */

const MP = { bg: 'rgb(11,17,28)', card: 'rgba(255,255,255,0.035)', line: 'rgba(75,85,99,0.4)', ink: 'rgb(249,250,251)', txt: 'rgb(229,231,235)', dim: 'rgb(163,163,163)', mut: 'rgb(115,122,135)', acc: 'rgb(52,211,153)', amber: 'rgb(251,191,36)', red: 'rgb(248,113,113)', violet: 'rgb(167,139,250)', sky: 'rgb(125,211,252)' };
const mpA = (c, a) => c.replace('rgb', 'rgba').replace(')', `,${a})`);
const mpStrip = (h) => String(h || '').replace(/<[^>]+>/g, '');
const mpShort = (p) => String(p || '').replace(/^Field /, '');
const mpHash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; };
const mpM = (m) => (window.lvFmtM ? lvFmtM(m) : `$${m.toFixed(1)}M`);
const mpDate = (daysAgo) => { const d = new Date(); d.setDate(d.getDate() - daysAgo); return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); };
const mpOrd = (n) => { const v = n % 100, s = v >= 11 && v <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th'); return n + s; };
const mpVeh = (v) => ({ 'Mutual Funds': 'mutual fund', ETFs: 'ETF', SMAs: 'SMA', Privates: 'private fund' }[v] || 'product');

const MP_SRC = {
  txn: { name: 'Your sales data', lag: 1 },
  hold: { name: 'BD data packs (Broadridge, SS&C) / FA attribution engine', lag: 32 },
  mstar: { name: 'Performance and fee data via BD data packs / FA attribution engine', lag: 32 },
  crm: { name: 'Your CRM activity', lag: 0 },
  mc: { name: 'Your Marketing Cloud engagement', lag: 1 },
  plat: { name: 'BD platform approvals (data pack)', lag: 32 },
};
const MP_MODEL = {
  focus: ['Focus product propensity', 'Logistic regression on look-alike adoption'],
  cross: ['Next-product propensity', 'Market basket + logistic regression'],
  upsell: ['Share-of-wallet model', 'Peer regression on AUM, mix and platform'],
  adv: ['Competitive advantage model', 'Rules + gradient boosted ranker'],
  ret: ['Attrition model', 'Gradient boosted classifier'],
  fallen: ['Reactivation model', 'Survival model on purchase gaps'],
  meet: ['Meeting priority model', 'Gradient boosted ranker'],
};
/* Pinned notes are real CRM/desk notes; generated ones restate the type and are skipped. */
const mpRealNote = (s) => { const t = mpStrip(s.desc).trim(); if (!t || /\bat \d+ confidence\.?$/i.test(t) || (window.LV_SIG_CALC && mpStrip(LV_SIG_CALC[s.type]) === t)) return null; return t; };
const mpKind = (t) => t.startsWith('Focus') ? 'focus' : t === 'Cross-sell' ? 'cross' : t === 'Upsell' ? 'upsell' : /Advantage/.test(t) ? 'adv' : t === 'Retention Risk' ? 'ret' : t === 'Fallen Angel' ? 'fallen' : 'meet';

function mpBuild(row, d, level) {
  if (window.lvPhaseRow) row = lvPhaseRow(row);
  const r = lvRng(mpHash(row.name + 'prep'));
  const sigs = (row.signals || []).slice().sort((a, b) => b.confidence - a.confidence);
  const holdings = (row.holdings || []).filter(h => h.aumM > 0 || (h.inflow && lvR12(h) > 0)).sort((a, b) => b.aumM - a.aumM);
  const held = holdings.map(h => mpShort(h.product));
  const yoursAum = holdings.reduce((a, h) => a + h.aumM, 0);
  const extDays = row.act && row.act.ext ? row.act.ext.days : null;
  const intDays = row.act && row.act.int ? row.act.int.days : null;
  const catalog = LV_CATALOG.map(c => ({ ...c, short: mpShort(c.name) }));
  const prodInfo = (p) => catalog.find(c => c.short === mpShort(p)) || null;
  const mem = d.members || [];
  const dmFirst = mem[0] ? mem[0].name.split(' ')[0] : 'the team';

  /* Market basket: the unheld product look-alikes most often buy next. */
  const sigProd = sigs.find(s => (s.type === 'Cross-sell' || s.type.startsWith('Focus')) && s.product && !held.includes(mpShort(s.product)));
  const bPick = sigProd ? prodInfo(sigProd.product) : catalog.find(c => !held.includes(c.short) && c.cat !== (holdings[0] || {}).cat);
  const basket = bPick ? { product: bPick.short, from: held.slice(0, 2), conf: Math.round(28 + r() * 20), lift: (1.8 + r() * 1.4).toFixed(1), peers: Math.round(140 + r() * 280), score: Math.round(58 + r() * 16), opp: Math.max(0.5, Math.round(yoursAum * (0.08 + r() * 0.1) * 10) / 10) } : null;

  /* Candidates: one per product/action, signals first; basket and
     share-of-wallet results merge into the signal for the same product. */
  const cands = [];
  sigs.forEach(s => {
    const key = s.product ? mpShort(s.product) : s.type;
    const ex = cands.find(c => c.key === key);
    if (ex) { ex.alsoTypes.push(s.type); ex.conf = Math.max(ex.conf, s.confidence); return; }
    const isHeld = !!s.product && held.includes(mpShort(s.product));
    const k0 = mpKind(s.type);
    cands.push({ key, sig: s, type: s.type, kind: k0 === 'upsell' && !isHeld ? 'cross' : k0, isHeld, product: s.product ? mpShort(s.product) : null, info: s.product ? prodInfo(s.product) : null, opp: s.opp, conf: s.confidence, note: mpRealNote(s), alsoTypes: [] });
  });
  if (basket) { const c = cands.find(x => x.product === basket.product); if (c) c.basket = basket; else cands.push({ key: basket.product, type: 'Cross-sell', kind: 'cross', product: basket.product, info: prodInfo(basket.product), opp: basket.opp, conf: basket.score, basket, alsoTypes: [] }); }
  const sigCap = Math.max(0.5, ...sigs.map(s => s.opp));
  holdings.forEach(h => {
    const p = mpShort(h.product), c = cands.find(x => x.product === p);
    const head = c && c.sig && c.sig.type === 'Upsell' ? c.opp : Math.min(h.aumM * (0.4 + r() * 1.1), sigCap * (0.3 + r() * 0.4));
    const deep = { now: h.aumM, peer: h.aumM + head, head, pctl: Math.round(18 + r() * 22) };
    if (c) c.deep = deep;
    else if (head > 0.3 && !cands.some(x => x.kind === 'upsell' && !x.sig)) cands.push({ key: p, type: 'Upsell', kind: 'upsell', product: p, info: prodInfo(h.product), opp: Math.round(head * 10) / 10, conf: Math.round(52 + r() * 14), deep, alsoTypes: [] });
  });
  const ret = cands.find(c => c.kind === 'ret' && c.conf >= 55);
  let ranked = cands.filter(c => c.kind !== 'meet' || cands.length < 2).sort((a, b) => b.conf - a.conf);
  if (ret) ranked = [ret, ...ranked.filter(c => c !== ret)];

  /* Evidence. Each line is one model driver, so the "why" and the model
     explanation are the same list. */
  const evidence = (c) => {
    const ev = [], add = (label, text, src) => ev.push({ label, text, src });
    const cat = c.info ? c.info.cat : null, veh = c.info ? c.info.vehicle : null;
    const sameCat = cat ? holdings.filter(h => h.cat === cat && mpShort(h.product) !== c.product) : [];
    const ext = Math.round(c.opp * (1.5 + r() * 1.6) * 10) / 10;
    const fr = (4 + r() * 6), cr = fr - (0.4 + r() * 1.4), bps = Math.round((fr - cr) * 100);
    const fer = Math.round(25 + r() * 35), cer = fer + Math.round(6 + r() * 30);
    if (c.kind === 'focus' || c.kind === 'cross') {
      if (sameCat.length) add('Same exposure, different vehicle', `Holds ${mpM(sameCat[0].aumM)} in ${mpShort(sameCat[0].product)} with you, the same ${cat} exposure, but no ${mpVeh(veh)}.`, 'txn');
      add(`${cat || 'Category'} assets with other managers`, `About ${mpM(ext)} in ${cat || 'the category'} sits with other managers${sameCat.length ? '' : ', none with you'}.`, 'hold');
      add('Performance vs. current hold', `${c.product} returned ${fr.toFixed(1)}% a year over 3 years vs. ${cr.toFixed(1)}% for their largest ${cat || ''} hold, net of fees (+${bps}bps).`, 'mstar');
      if (veh === 'SMAs') add('Uses SMAs on the platform', `Runs ${2 + Math.floor(r() * 4)} SMA strategies at ${d.firm}; ${c.product} is approved on the platform.`, 'plat');
      if (c.basket) add('Look-alike adoption', `${c.basket.conf}% of ${c.basket.peers} look-alike teams${c.basket.from.length ? ' holding ' + c.basket.from.join(' and ') : ''} added it within 12 months, ${c.basket.lift}× the base rate.`, 'txn');
      add('Campaign engagement', `Opened the ${c.product} campaign email on ${mpDate(4 + Math.floor(r() * 20))}${r() > 0.5 ? ' and clicked the fact sheet' : ''}.`, 'mc');
    } else if (c.kind === 'upsell') {
      const dp = c.deep;
      add('Share of wallet vs. peers', `${mpM(dp.now)} in ${c.product} with you today. Teams with a similar book, mix and platform hold ${mpM(dp.peer)}; they're in the ${mpOrd(dp.pctl)} percentile.`, 'hold');
      add(`${cat || 'Category'} assets with other managers`, `About ${mpM(ext)} more in ${cat || 'the category'} sits with other managers.`, 'hold');
      add('Performance vs. those holds', `+${bps}bps a year over 3 years vs. their other ${cat || ''} managers, net of fees.`, 'mstar');
      add('Sales trend with you', row.salesTrend >= 0 ? `R12 sales up ${Math.round(row.salesTrend * 100)}% on the prior year.` : `R12 sales down ${Math.round(-row.salesTrend * 100)}% on the prior year.`, 'txn');
    } else if (c.kind === 'adv') {
      if (c.type === 'Fee Advantage') add('Fee vs. current hold', `${c.product} at ${fer}bps vs. ${cer}bps for the competing ${cat || ''} position (${cer - fer}bps cheaper), no offsetting performance gap.`, 'mstar');
      else add('Performance vs. current hold', `${c.product} returned ${fr.toFixed(1)}% a year over 3 years vs. ${cr.toFixed(1)}% for the competing hold, net of fees (+${bps}bps).`, 'mstar');
      add('Competing assets', `${mpM(ext)} in the competing ${cat || ''} position, the size of the opportunity.`, 'hold');
      add('Peers switching', `${Math.round(8 + r() * 14)} teams at ${d.firm} moved from that hold to ${c.product} in the last 12 months.`, 'txn');
    } else if (c.kind === 'ret') {
      add('Redemptions', `${mpM(c.opp)} redeemed in the last 90 days.`, 'txn');
      add('Competitor purchases', `Bought a competing ${cat || 'product'} in the same window.`, 'hold');
      add('Coverage gap', extDays != null ? `${extDays} days since the last external meeting.` : 'No external meeting on record.', 'crm');
    } else if (c.kind === 'fallen') {
      add('Production drop', c.note || 'Production down sharply over 12 months.', 'txn');
      add('Still holds', `${mpM(yoursAum)} still with you across ${holdings.length} products.`, 'txn');
      add('Coverage gap', extDays != null ? `${extDays} days since the last external meeting.` : 'No external meeting on record.', 'crm');
    } else {
      add('Coverage gap', extDays != null ? `${extDays} days since the last external meeting.` : 'No external meeting on record.', 'crm');
      add('Sales trend', `R12 sales ${row.salesTrend >= 0 ? 'up' : 'down'} ${Math.abs(Math.round(row.salesTrend * 100))}%.`, 'txn');
    }
    if (c.note && c.kind !== 'fallen' && c.kind !== 'ret') ev.unshift({ label: 'Signal note', text: c.note, src: 'txn' });
    const ws = ev.map(() => 0.4 + r()), W = ws.reduce((a, x) => a + x, 0);
    ev.forEach((e, i) => { e.w = ws[i] / W; });
    ev.sort((a, b) => b.w - a.w);
    const srcs = [...new Set(ev.map(e => e.src))].map(k => ({ ...MP_SRC[k], asOf: mpDate(MP_SRC[k].lag) }));
    const [model, method] = MP_MODEL[c.kind];
    return { ext, ev, srcs, model, method, ver: `v${2 + Math.floor(r() * 3)}.${Math.floor(r() * 9)}`, precision: Math.round(58 + r() * 20), sameCat, bps, fer, cer, cat, veh };
  };

  const pitch = (c, x) => {
    const pts = [];
    if (c.kind === 'focus' || c.kind === 'cross') {
      if (x.sameCat.length) pts.push(`Position ${c.product} as the next step from the ${mpShort(x.sameCat[0].product)} they already own: same team and process${x.veh === 'SMAs' ? ', plus tax-loss harvesting and client-level customization' : ''}.`);
      else pts.push(`Ask how they cover ${x.cat || 'the category'} today and what would make them add a manager.`);
      pts.push(`Lead with the 3-year record: +${x.bps}bps a year net over their largest ${x.cat || ''} hold.`);
      if (c.basket) pts.push(`Peers with a similar book are adding it: ${c.basket.conf}% within 12 months.`);
    } else if (c.kind === 'upsell') {
      pts.push(`${c.product} is already in their model. Ask what's driving the rest of ${x.cat || 'the category'} to other managers.`);
      pts.push(`Show the +${x.bps}bps net record against those managers.`);
    } else if (c.kind === 'adv') {
      pts.push(c.type === 'Fee Advantage' ? `Lead with the fee: ${x.cer - x.fer}bps cheaper than the competing hold with comparable performance.` : `Lead with the 3-year record: +${x.bps}bps a year net of fees.`);
      pts.push(`Peers at ${d.firm} have made the same switch; offer the comparison one-pager.`);
    } else if (c.kind === 'ret') {
      pts.push('Open with a portfolio check-in. Ask what changed before any product discussion.');
      pts.push('Confirm whether the redemption was client-driven or a model change.');
    } else if (c.kind === 'fallen') {
      pts.push('Ask what changed in the book or the model. Avoid leading with product.');
      pts.push('Offer a portfolio review against the positions they still hold.');
    } else pts.push('Use the meeting to reset coverage and learn current allocation plans.');
    return pts;
  };
  const askOf = (c) => c.kind === 'ret' ? 'Agree what would keep the assets in place and book a portfolio check-in within 2 weeks.'
    : c.kind === 'fallen' || c.kind === 'meet' ? `Agree a follow-up with ${dmFirst} and a date to review their model.`
    : `Ask for a ${mpM(Math.max(0.5, Math.round(c.opp * 0.35 * 10) / 10))} starter allocation to ${c.product} in the next model rebalance.`;
  const titleOf = (c) => c.sig && !(c.sig.type === 'Upsell' && !c.isHeld) ? lvNbaLabel(c.sig) : c.sig ? `Introduce ${c.product}` : c.kind === 'upsell' ? `Grow ${c.product}` : `Introduce ${c.product}`;
  const typeLabel = (c) => [c.type, ...c.alsoTypes].concat(c.basket && c.type !== 'Cross-sell' ? ['Market basket'] : []).filter((v, i, a) => a.indexOf(v) === i);

  const opps = ranked.slice(0, 2).map(c => { const x = evidence(c); return { ...c, title: titleOf(c), labels: typeLabel(c), x, points: pitch(c, x), ask: askOf(c), meta: LV_SIG_META[c.type] || { color: c.kind === 'upsell' ? 'rgb(251,191,36)' : 'rgb(249,115,22)', icon: c.kind === 'upsell' ? 'arrow-up-right-dots' : 'shuffle' } }; });
  const P = opps[0];
  const more = ranked.slice(2);

  /* Who to speak to, briefed on the primary opportunity. */
  const pProd = P && P.product ? P.product : 'the allocation';
  const lead = P ? (P.kind === 'ret' ? 'a portfolio check-in' : P.kind === 'adv' && P.type === 'Fee Advantage' ? `the ${pProd} fee case` : `the ${pProd} performance case`) : 'discovery';
  const who = [];
  if (mem[0]) who.push({ ...mem[0], why: `Makes the investment decision. Lead with ${lead}.` });
  const pm = mem.find((m, i) => i > 0 && /Advisor|Portfolio|Analyst/i.test(m.role));
  if (pm) who.push({ ...pm, why: P && P.x.sameCat.length ? `Runs ${mpShort(P.x.sameCat[0].product)} day to day. Ask where ${pProd} would sit in the model.` : `Day-to-day contact. Ask how ${P && P.x.cat ? P.x.cat : 'the category'} is covered in the model today.` });
  const ops = mem.find((m, i) => i > 0 && m !== pm && /Associate|Client|Operations|Paraplanner/i.test(m.role));
  if (ops) who.push({ ...ops, why: P && P.x.veh === 'SMAs' ? 'Handles SMA account opening. Loop in once the allocation is agreed.' : 'Handles tickets and paperwork. Loop in once the allocation is agreed.' });

  const watch = [];
  const retAny = sigs.find(s => s.type === 'Retention Risk');
  if (retAny && (!P || P.kind !== 'ret')) watch.push(`Retention risk at ${retAny.confidence} confidence: ${mpStrip(retAny.desc)}`);
  if (extDays != null && extDays > 90) watch.push(`No external meeting in ${extDays} days. Expect to re-establish context before the ask.`);
  if (extDays == null) watch.push('No external meeting on record in the last 12 months.');
  if (row.salesTrend < -0.1) watch.push(`R12 sales with you are down ${Math.round(-row.salesTrend * 100)}% on the prior year.`);
  if (row.compAdv === 'Low') watch.push('Competitive advantage is low across their current holds; avoid leading on performance.');
  if (!watch.length) watch.push('Nothing flagged. Sales are steady and coverage is current.');

  const prodA = held[0] || pProd, prodB = P && P.product ? P.product : held[1] || 'Muni Ladder SMA';
  const notes = [
    extDays != null && { when: extDays, who: 'You', kind: 'External meeting', text: `Reviewed ${prodA} positioning with ${dmFirst}. Comfortable with the hold; asked for the 3-year attribution versus their current manager.` },
    intDays != null && { when: intDays, who: 'Internal desk', kind: 'Call', text: `Follow-up call. ${mem[1] ? mem[1].name.split(' ')[0] : 'Associate'} mentioned the team is reviewing ${P && P.x.cat ? P.x.cat : 'fixed income'} allocations next quarter.` },
    { when: Math.max(3, Math.round((extDays || 60) * (0.3 + r() * 0.4))), who: 'Marketing', kind: 'Email', text: `Opened the ${prodB} campaign email${r() > 0.5 ? ' and clicked through to the fact sheet' : ''}.` },
  ].filter(Boolean).sort((a, b) => a.when - b.when).slice(0, 3);

  const steps = [
    P && P.product && `Bring the ${P.product} ${P.type === 'Fee Advantage' ? 'fee comparison' : 'performance one-pager'} vs. their current ${P.x.cat || ''} hold`,
    P && P.x.veh === 'SMAs' && `Bring a sample ${P.product} proposal and the ${d.firm} SMA account paperwork`,
    opps[1] && opps[1].product && `Have ${opps[1].product} materials ready if there's time`,
    'Log the meeting and next step in Salesforce within 24 hours',
  ].filter(Boolean);

  const last = (a) => (a && a.length ? a[a.length - 1] : 0);
  const book = holdings.map(h => ({ product: mpShort(h.product), vehicle: h.vehicle, cat: h.cat, aum: h.aumM, inflow: lvR12(h), red: lvR12(h, 'redemption'), net: lvR12(h, 'net'), prior: lvP12(h) }));
  const bIn = book.reduce((a, h) => a + h.inflow, 0), bPr = book.reduce((a, h) => a + (h.prior || 0), 0), bNet = book.reduce((a, h) => a + h.net, 0);
  /* Their book by category from the BD data packs: total market opportunity
     (all managers), your pack-reported share and the vehicles they use.
     Categories behind the opportunities above always appear, sized from the
     same figures the evidence quotes; the rest of the FA/Team total is spread
     across their other categories so rows never exceed the total. */
  const rv = lvRng(mpHash(row.name + 'mkt'));
  const hAum = holdings.reduce((a, h) => a + h.aumM, 0) || 1;
  const inRate = row.oppAum ? row.oppIn / row.oppAum : 0.14;
  const yPack = {};
  holdings.forEach(h => { const y = yPack[h.cat] || (yPack[h.cat] = { a: 0, i: 0 }); y.a += (row.yoursAum || 0) * h.aumM / hAum; y.i += (row.yoursIn || 0) * h.aumM / hAum; });
  const byCat = {};
  opps.forEach((o, i) => { if (!o.x.cat || byCat[o.x.cat]) return; const y = yPack[o.x.cat] || { a: 0, i: 0 }; const opp = o.x.ext + y.a; byCat[o.x.cat] = { cat: o.x.cat, fixed: true, tag: i + 1, opp, oppIn: Math.max(opp * inRate, y.i + o.x.ext * inRate) }; });
  const others = [];
  const addOther = (cat, w) => { if (byCat[cat] || others.find(x => x.cat === cat)) return; others.push({ cat, w }); };
  (row.catMix || []).forEach(c => addOther(c.cat, c.w));
  Object.keys(yPack).forEach(c => addOther(c, 0.15 + rv() * 0.2));
  LV_PROD_CATEGORIES.slice().sort(() => rv() - 0.5).forEach(c => { if (Object.keys(byCat).length + others.length < 5) addOther(c, 0.05 + rv() * 0.1); });
  const fixedA = Object.values(byCat).reduce((a, c) => a + c.opp, 0), fixedI = Object.values(byCat).reduce((a, c) => a + c.oppIn, 0);
  const remA = Math.max(0, (row.oppAum || 0) - fixedA), remI = Math.max(0, (row.oppIn || 0) - fixedI);
  others.forEach(o => { const y = yPack[o.cat]; if (y && remA) o.w = Math.max(o.w, y.a / remA * 2.2); });
  const wt = others.reduce((a, o) => a + o.w, 0) || 1;
  others.forEach(o => { byCat[o.cat] = { cat: o.cat, opp: remA * o.w / wt, oppIn: remI * o.w / wt }; });
  const MKT_VEH = (cat) => /Private|Real Assets/.test(cat) ? ['Private', 'Interval'] : /Muni/.test(cat) ? ['MF', 'SMA', 'ETF'] : ['MF', 'ETF', 'SMA', 'UMA'];
  const mktAll = Object.values(byCat).map(c => {
    const y = yPack[c.cat] || { a: 0, i: 0 };
    const vehs = MKT_VEH(c.cat), vw = vehs.map((_, i) => (i === 0 ? 0.8 : 0.15) + rv()), vt = vw.reduce((a, x) => a + x, 0);
    let acc = 0; const mix = vehs.map((v, i) => { const p = i === vehs.length - 1 ? 100 - acc : Math.round(vw[i] / vt * 100); acc += p; return { v, p }; }).filter(x => x.p >= 3).sort((a, b) => b.p - a.p);
    return { cat: c.cat, tag: c.tag, opp: c.opp, oppIn: c.oppIn, yA: y.a, yI: y.i, shareA: c.opp ? Math.min(1, y.a / c.opp) : 0, shareI: c.oppIn ? Math.min(1, y.i / c.oppIn) : 0, mix, trend: (rv() - 0.4) * 0.5, prod: catalog.filter(p => p.cat === c.cat).map(p => p.short), held: !!yPack[c.cat] };
  });
  const mkt = [...mktAll.filter(x => x.tag).sort((a, b) => a.tag - b.tag), ...mktAll.filter(x => !x.tag).sort((a, b) => b.opp - a.opp)].slice(0, 5);
  const mktAsOf = mpDate(MP_SRC.hold.lag);

  return { mkt, mktAsOf, book, bIn, bPr, bNet, level, sigs, opps, more, who, watch, notes, steps, snap: { yoursAum, r12: row.r12ProdK, trend: row.salesTrend, products: holdings.length, share: row.shareAum, extDays, seg: row.segment, prodCat: row.prodCat } };
}

function MpSection({ icon, title, tag, children, style }) {
  return (
    <div style={{ background: MP.card, border: `1px solid ${MP.line}`, borderRadius: 10, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 9, minWidth: 0, ...style }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <i className={`fa-solid fa-${icon}`} style={{ fontSize: 11, color: MP.dim, width: 13 }}></i>
        <span style={{ fontFamily: 'Inter', fontSize: 10.5, fontWeight: 700, color: 'rgb(200,205,213)', textTransform: 'uppercase', letterSpacing: 0.7 }}>{title}</span>
        {tag}
      </div>
      {children}
    </div>
  );
}
const mpLbl = { fontFamily: 'Inter', fontSize: 10, fontWeight: 700, color: MP.mut, textTransform: 'uppercase', letterSpacing: 0.7 };
const mpTxt = { fontFamily: 'Inter', fontSize: 12, lineHeight: 1.5, color: MP.txt, textWrap: 'pretty' };

function MpOpportunity({ o, rank, L3 }) {
  const col = o.meta.color, primary = rank === 1;
  return (
    <div style={{ borderRadius: 10, border: `1px solid ${primary ? mpA(col, 0.55) : MP.line}`, background: primary ? mpA(col, 0.06) : MP.card, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ width: 24, height: 24, borderRadius: 6, background: mpA(col, 0.18), color: col, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter', fontSize: 12, fontWeight: 700 }}>{rank}</span>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ ...mpLbl, color: primary ? col : MP.mut }}>{primary ? 'Primary opportunity' : 'Second opportunity'}</div>
          <div style={{ fontFamily: 'Inter', fontSize: primary ? 17 : 15, fontWeight: 600, color: MP.ink }}>{o.title}</div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{o.labels.map(l => <span key={l} style={{ fontFamily: 'Inter', fontSize: 10, fontWeight: 600, color: (LV_SIG_META[l] || {}).color || MP.violet, border: `1px solid ${mpA((LV_SIG_META[l] || {}).color || MP.violet, 0.45)}`, borderRadius: 4, padding: '1px 6px', whiteSpace: 'nowrap' }}>{l}</span>)}</div>
        <div style={{ textAlign: 'right' }}><div style={mpLbl}>Opportunity</div><div style={{ fontFamily: 'Inter', fontSize: 16, fontWeight: 600, color: MP.acc, fontVariantNumeric: 'tabular-nums' }}>{mpM(o.opp)}</div></div>
        {L3 && <div style={{ textAlign: 'right' }}><div style={mpLbl}>Confidence</div><div style={{ display: 'flex', alignItems: 'center', gap: 6, height: 22 }}><LvConfBar value={o.conf} width={44} /></div></div>}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.25fr) minmax(0,1fr)', gap: 18 }}>
        <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center' }}><span style={mpLbl}>Why we're recommending it</span>{L3 && <span style={{ ...mpLbl, marginLeft: 'auto', fontWeight: 600 }}>Share of score</span>}</div>
          {o.x.ev.map((e, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: L3 ? 'minmax(0,1fr) 64px 30px' : 'minmax(0,1fr)', gap: 10, alignItems: 'start' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: 'Inter', fontSize: 11.5, fontWeight: 600, color: MP.ink }}>{e.label}</div>
                <div style={{ ...mpTxt, fontSize: 11.5, color: 'rgb(200,205,213)' }}>{e.text} <span style={{ color: MP.mut, fontSize: 10.5 }}>· {MP_SRC[e.src].name}</span></div>
              </div>
              {L3 && <span style={{ height: 5, marginTop: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)' }}><span style={{ display: 'block', height: '100%', width: `${e.w * 100 / o.x.ev[0].w}%`, borderRadius: 3, background: mpA(col, 0.8) }}></span></span>}
              {L3 && <span style={{ fontFamily: 'Inter', fontSize: 10.5, color: MP.dim, textAlign: 'right', fontVariantNumeric: 'tabular-nums', marginTop: 1 }}>{Math.round(e.w * 100)}%</span>}
            </div>
          ))}
        </div>
        <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8, borderLeft: `1px solid ${MP.line}`, paddingLeft: 16 }}>
          <span style={mpLbl}>Talking points</span>
          {o.points.map((p, i) => <div key={i} style={{ display: 'flex', gap: 8 }}><span style={{ width: 6, height: 6, borderRadius: 3, background: col, marginTop: 6, flexShrink: 0 }}></span><div style={mpTxt}>{p}</div></div>)}
          <div style={{ marginTop: 4, borderRadius: 8, padding: '9px 11px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${MP.line}` }}>
            <div style={{ ...mpLbl, color: MP.acc }}>The ask</div>
            <div style={{ ...mpTxt, color: MP.ink, fontWeight: 500 }}>{o.ask}</div>
          </div>
        </div>
      </div>
      {L3 && <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', borderTop: `1px solid ${MP.line}`, paddingTop: 9, fontFamily: 'Inter', fontSize: 10.5, color: MP.mut }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><i className="fa-solid fa-diagram-project" style={{ fontSize: 9.5 }}></i>{o.x.model} {o.x.ver} · {o.x.method} · {o.x.precision}% of top-decile scores converted in back-test</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}><i className="fa-solid fa-database" style={{ fontSize: 9.5 }}></i>{o.x.srcs.map(s => `${s.name} (${s.asOf})`).join(' · ')}</span>
      </div>}
    </div>
  );
}

function MpMarket({ rows, asOf, oppTotal, oppInTotal }) {
  if (!rows.length) return null;
  const th = (t, right) => <th style={{ ...mpLbl, fontWeight: 600, textAlign: right ? 'right' : 'left', padding: '0 10px 7px', borderBottom: `1px solid ${MP.line}`, whiteSpace: 'nowrap' }}>{t}</th>;
  const td = { fontFamily: 'Inter', fontSize: 12, color: MP.txt, padding: '7px 10px', borderBottom: '1px solid rgba(75,85,99,0.18)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' };
  const tdr = { ...td, textAlign: 'right' };
  const mx = Math.max(...rows.map(r => r.opp));
  const share = (v) => <span style={{ color: v > 0 ? MP.txt : MP.mut }}>{v > 0 ? `${(v * 100).toFixed(1)}%` : '—'}</span>;
  return (
    <MpSection icon="chart-pie" title="Their book by category" tag={<span style={{ marginLeft: 'auto', fontFamily: 'Inter', fontSize: 10.5, color: MP.mut }}>Opportunity categories first, then largest · BD data packs (Broadridge, SS&amp;C) as of {asOf}</span>}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
          <thead><tr>{th('Category')}{th('Mkt opp AUM', true)}{th('Your share', true)}{th('Mkt opp inflows', true)}{th('Your share', true)}{th('Inflow trend', true)}{th('Vehicles used')}</tr></thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.cat}>
                <td style={{ ...td, whiteSpace: 'normal' }}><div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ fontWeight: 600, color: MP.ink }}>{r.cat}</span>{r.tag && <span style={{ fontSize: 9.5, fontWeight: 700, color: MP.acc, border: `1px solid ${mpA(MP.acc, 0.5)}`, borderRadius: 4, padding: '0 5px' }}>Opportunity {r.tag}</span>}</div><div style={{ fontSize: 10.5, color: MP.mut }}>{r.held ? 'You hold: ' : 'Your products: '}{r.prod.join(', ')}</div></td>
                <td style={tdr}><div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}><span style={{ width: 48, height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.06)' }}><span style={{ display: 'block', height: '100%', width: `${r.opp / mx * 100}%`, borderRadius: 3, background: mpA(MP.sky, 0.7) }}></span></span>{mpM(r.opp)}</div></td>
                <td style={tdr}>{share(r.shareA)}</td>
                <td style={tdr}>{mpM(r.oppIn)}</td>
                <td style={tdr}>{share(r.shareI)}</td>
                <td style={{ ...tdr, color: r.trend < 0 ? MP.red : MP.acc }}>{r.trend < 0 ? '−' : '+'}{Math.abs(Math.round(r.trend * 100))}%</td>
                <td style={td}><div style={{ display: 'flex', gap: 5 }}>{r.mix.map(x => <span key={x.v} style={{ fontSize: 10.5, color: 'rgb(200,205,213)', border: `1px solid ${MP.line}`, borderRadius: 4, padding: '1px 5px' }}>{x.v} {x.p}%</span>)}</div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ fontFamily: 'Inter', fontSize: 10.5, color: MP.mut, lineHeight: 1.5 }}>Market opportunity is the FA/Team's assets and inflows in the category across all managers. Your share here is from the data packs, which lag and may not cover every product or vehicle, so it won't tie to your own sales above. Vehicles used is their mix across all managers. Category, vehicle and platform usage are inputs to the NBA models.</div>
    </MpSection>
  );
}

function MpBook({ holdings }) {
  if (!holdings.length) return <MpSection icon="layer-group" title="Current business with you"><div style={{ ...mpTxt, color: MP.dim }}>No current holdings with you.</div></MpSection>;
  const tot = holdings.reduce((a, h) => ({ aum: a.aum + h.aum, inflow: a.inflow + h.inflow, red: a.red + h.red, net: a.net + h.net }), { aum: 0, inflow: 0, red: 0, net: 0 });
  const th = (t, right) => <th style={{ ...mpLbl, fontWeight: 600, textAlign: right ? 'right' : 'left', padding: '0 10px 7px', borderBottom: `1px solid ${MP.line}`, whiteSpace: 'nowrap' }}>{t}</th>;
  const td = { fontFamily: 'Inter', fontSize: 12, color: MP.txt, padding: '7px 10px', borderBottom: '1px solid rgba(75,85,99,0.18)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' };
  const tdr = { ...td, textAlign: 'right' };
  const net = (v) => <span style={{ color: v < 0 ? MP.red : MP.acc }}>{v < 0 ? '−' : '+'}{mpM(Math.abs(v))}</span>;
  const mx = Math.max(...holdings.map(h => h.aum));
  return (
    <MpSection icon="layer-group" title="Current business with you" tag={<span style={{ marginLeft: 'auto', fontFamily: 'Inter', fontSize: 10.5, color: MP.mut }}>Rolling 12 months · your sales data</span>}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
          <thead><tr>{th('Product')}{th('AUM', true)}{th('R12 sales', true)}{th('vs prior 12m', true)}{th('R12 redemptions', true)}{th('R12 net flow', true)}</tr></thead>
          <tbody>
            {holdings.map(h => { const g = h.prior ? h.inflow / h.prior - 1 : null; return (
              <tr key={h.product}>
                <td style={{ ...td, whiteSpace: 'normal' }}><div style={{ fontWeight: 600, color: MP.ink }}>{h.product}</div><div style={{ fontSize: 10.5, color: MP.mut }}>{mpVeh(h.vehicle)} · {h.cat}</div></td>
                <td style={tdr}><div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}><span style={{ width: 48, height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.06)' }}><span style={{ display: 'block', height: '100%', width: `${h.aum / mx * 100}%`, borderRadius: 3, background: mpA(MP.acc, 0.7) }}></span></span>{mpM(h.aum)}</div></td>
                <td style={tdr}>{mpM(h.inflow)}</td>
                <td style={{ ...tdr, color: g == null ? MP.mut : g < 0 ? MP.red : MP.acc }}>{g == null ? '—' : `${g < 0 ? '−' : '+'}${Math.abs(Math.round(g * 100))}%`}</td>
                <td style={{ ...tdr, color: MP.dim }}>{mpM(h.red)}</td>
                <td style={tdr}>{net(h.net)}</td>
              </tr>
            ); })}
            {holdings.length > 1 && <tr>
              <td style={{ ...td, fontWeight: 600, color: MP.ink, borderBottom: 'none' }}>Total</td>
              <td style={{ ...tdr, fontWeight: 600, color: MP.ink, borderBottom: 'none' }}>{mpM(tot.aum)}</td>
              <td style={{ ...tdr, fontWeight: 600, borderBottom: 'none' }}>{mpM(tot.inflow)}</td>
              <td style={{ ...tdr, borderBottom: 'none' }}></td>
              <td style={{ ...tdr, color: MP.dim, borderBottom: 'none' }}>{mpM(tot.red)}</td>
              <td style={{ ...tdr, fontWeight: 600, borderBottom: 'none' }}>{net(tot.net)}</td>
            </tr>}
          </tbody>
        </table>
      </div>
    </MpSection>
  );
}

function MeetingPrepBrief({ row, d, onClose }) {
  let level = 3; try { level = Number(localStorage.getItem('amp_level')) || 3; } catch (e) {}
  const b = React.useMemo(() => mpBuild(row, d, level), [row, d, level]);
  const ref = React.useRef(null);
  const [copied, setCopied] = React.useState(false);
  const L3 = level >= 3;
  const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const P = b.opps[0], s = b.snap;

  const asText = () => [
    `MEETING PREP: ${d.fullName} (${d.firm}) · ${today}`, '',
    ...b.opps.flatMap((o, i) => [
      `${i ? 'SECOND' : 'PRIMARY'} OPPORTUNITY: ${o.title} · ${mpM(o.opp)}${L3 ? ` · confidence ${o.conf}` : ''}`,
      'Why:', ...o.x.ev.map(e => `- ${e.label}: ${e.text}`),
      'Talking points:', ...o.points.map(p => `- ${p}`),
      `Ask: ${o.ask}`, '',
    ]),
    'Their book by category (BD data packs):', ...b.mkt.map(x => `- ${x.cat}: mkt opp ${mpM(x.opp)} AUM, ${mpM(x.oppIn)} inflows; your share ${(x.shareA * 100).toFixed(1)}%`), '',
    'Who to speak to:', ...b.who.map(w => `- ${w.name} (${w.dm ? 'decision maker' : w.role}): ${w.why}`), '',
    'Watch-outs:', ...b.watch.map(w => `- ${w}`), '',
    'Bring / follow up:', ...b.steps.map(x => `- ${x}`),
  ].join('\n');
  const copy = () => { try { navigator.clipboard.writeText(asText()); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch (e) {} };
  React.useEffect(() => { const k = (e) => { if (e.key === 'Escape') onClose(); }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, []);
  const openWin = (doPrint) => {
    const w = window.open('', '_blank', doPrint ? '' : 'width=1240,height=900'); if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>Meeting prep · ${d.fullName}</title><base href="${location.href}"><link rel="stylesheet" href="fontawesome-pro-local.css"><style>body{margin:0;padding:24px;background:${MP.bg};-webkit-print-color-adjust:exact;print-color-adjust:exact;font-family:Inter,system-ui,sans-serif}[data-mp-noprint]{display:none!important}[data-mp-scroll]{overflow:visible!important}</style></head><body>${ref.current.outerHTML}</body></html>`);
    w.document.close(); if (doPrint) setTimeout(() => w.print(), 300);
  };

  const btn = { height: 30, padding: '0 12px', borderRadius: 7, border: `1px solid ${MP.line}`, background: 'rgba(255,255,255,0.04)', color: 'rgb(209,213,219)', fontFamily: 'Inter', fontSize: 11.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 };
  const kpi = (label, value, sub, color) => (
    <div style={{ minWidth: 0 }}>
      <div style={{ fontFamily: 'Inter', fontSize: 9.5, color: MP.dim, textTransform: 'uppercase', letterSpacing: 0.6 }}>{label}</div>
      <div style={{ fontFamily: 'Inter Display, Inter', fontSize: 19, fontWeight: 600, color: color || MP.ink, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      {sub && <div style={{ fontFamily: 'Inter', fontSize: 10.5, color: MP.mut }}>{sub}</div>}
    </div>
  );

  return (
    <div onClick={(e) => { e.stopPropagation(); onClose(); }} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(5,10,18,0.72)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'stretch', padding: '20px 24px' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 'min(1200px, 100%)', background: MP.bg, border: `1px solid ${MP.line}`, borderRadius: 14, boxShadow: '0 40px 120px rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div ref={ref} data-mp-scroll="" style={{ flex: 1, overflow: 'auto', padding: '0 22px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, position: 'sticky', top: 0, zIndex: 2, background: MP.bg, padding: '18px 0 12px', borderBottom: `1px solid ${MP.line}` }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'Inter', fontSize: 10.5, fontWeight: 700, color: MP.acc, textTransform: 'uppercase', letterSpacing: 0.9 }}>Meeting prep</div>
            <div style={{ fontFamily: 'Geist, Inter', fontSize: 21, fontWeight: 700, color: MP.ink, letterSpacing: -0.3 }}>{d.fullName}</div>
            <div style={{ fontFamily: 'Inter', fontSize: 11.5, color: MP.dim, display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 2 }}>
              <span>{d.firm}</span><span>·</span><span>{row.city}{row.state ? ', ' + row.state : ''}</span><span>·</span>
              <span>{s.extDays != null ? `Last met ${mpDate(s.extDays)} (${s.extDays}d ago)` : 'No meeting on record'}</span><span>·</span><span>Prepared {today}</span>
            </div>
          </div>
          <div data-mp-noprint="" style={{ display: 'flex', gap: 6 }}>
            <button onClick={copy} style={btn}><i className={`fa-solid fa-${copied ? 'check' : 'copy'}`} style={{ fontSize: 10.5 }}></i>{copied ? 'Copied' : 'Copy'}</button>
            <button onClick={() => openWin(false)} title="Open in a separate browser window" style={btn}><i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: 10.5 }}></i>Pop out</button>
            <button onClick={() => openWin(true)} style={btn}><i className="fa-solid fa-print" style={{ fontSize: 10.5 }}></i>Print</button>
            <button onClick={onClose} title="Close" style={{ ...btn, width: 30, padding: 0, justifyContent: 'center' }}><i className="fa-solid fa-xmark"></i></button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '2px 2px 0', flexWrap: 'wrap' }}>
          <i className="fa-solid fa-bullseye" style={{ fontSize: 13, color: MP.acc }}></i>
          <span style={{ ...mpLbl, color: MP.acc }}>Meeting objective</span>
          <span style={{ fontFamily: 'Inter', fontSize: 14, fontWeight: 600, color: MP.ink }}>{P ? (P.kind === 'ret' ? `Hold the ${mpM(P.opp)} at risk${b.opps[1] ? `, then ${b.opps[1].title.toLowerCase()}` : ''}` : `${P.title}${b.opps[1] ? `; if there's time, ${b.opps[1].title.toLowerCase()}` : ''}`) : 'Relationship review and discovery'}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0,1fr))', gap: 12, padding: '10px 16px', border: `1px solid ${MP.line}`, borderRadius: 10 }}>
          {kpi('Your AUM', mpM(s.yoursAum), `${s.products} product${s.products === 1 ? '' : 's'}`)}
          {b.book.length ? kpi('R12 sales', mpM(b.bIn), `${b.bPr ? `${b.bIn >= b.bPr ? '+' : '−'}${Math.abs(Math.round((b.bIn / b.bPr - 1) * 100))}% vs prior 12m · ` : ''}net ${b.bNet < 0 ? '−' : '+'}${mpM(Math.abs(b.bNet))}`, b.bIn >= b.bPr ? MP.acc : MP.red) : kpi('R12 sales', '$0', 'No current holdings')}
          {kpi('Share of wallet', `${((s.share || 0) * 100).toFixed(1)}%`, 'Of their AUM in your categories')}
          {kpi('Status', s.prodCat || '—', L3 && s.seg && s.seg !== 'N' ? `Segment ${s.seg}` : null)}
          {kpi('Open signals', b.sigs.length, b.more.length ? `${b.more.length} more beyond these two` : null)}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.3fr)', gap: 12 }}>
          <MpSection icon="user-group" title="Who to speak to">
            {b.who.map((w, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: w.avatar, color: '#0b1220', fontFamily: 'Inter', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: w.dm ? `0 0 0 2px ${mpA(MP.acc, 0.6)}` : 'none' }}>{w.init}</div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}><span style={{ fontFamily: 'Inter', fontSize: 12.5, fontWeight: 600, color: MP.ink }}>{w.name}</span><span style={{ fontFamily: 'Inter', fontSize: 10.5, color: w.dm ? MP.acc : MP.dim }}>{w.dm ? 'Decision maker' : w.role}</span></div>
                  <div style={{ ...mpTxt, fontSize: 11.5, color: 'rgb(200,205,213)' }}>{w.why}</div>
                </div>
              </div>
            ))}
          </MpSection>
          <MpSection icon="note-sticky" title="Recent notes" tag={<span style={{ marginLeft: 'auto' }}><CrmLink name={d.fullName} kind="Account" label="Open in Salesforce" /></span>}>
            {b.notes.map((n, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '64px minmax(0,1fr)', gap: 10 }}>
                <div style={{ fontFamily: 'Inter', fontSize: 11, color: MP.dim }}><div style={{ color: MP.txt, fontWeight: 600 }}>{mpDate(n.when)}</div><div>{n.kind}</div></div>
                <div style={{ ...mpTxt, fontSize: 11.5 }}><span style={{ color: MP.dim }}>{n.who}: </span>{n.text}</div>
              </div>
            ))}
          </MpSection>
        </div>
        <MpBook holdings={b.book} />
        <MpMarket rows={b.mkt} asOf={b.mktAsOf} />
        {b.opps.map((o, i) => <MpOpportunity key={o.key} o={o} rank={i + 1} L3={L3} />)}
        {!b.opps.length && <MpSection icon="bullseye" title="No open opportunities"><div style={{ ...mpTxt, color: MP.dim }}>No signal above the confidence floor. Use the meeting to learn the book and current allocation plans.</div></MpSection>}

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 12 }}>
          <MpSection icon="triangle-exclamation" title="Watch-outs">
            {b.watch.map((w, i) => <div key={i} style={{ display: 'flex', gap: 8 }}><span style={{ width: 6, height: 6, borderRadius: 3, background: MP.amber, marginTop: 6, flexShrink: 0 }}></span><div style={{ ...mpTxt, fontSize: 11.5 }}>{w}</div></div>)}
          </MpSection>
          <MpSection icon="list-check" title="Bring / follow up">
            {b.steps.map((x, i) => <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}><i className="fa-regular fa-square" style={{ fontSize: 11, color: MP.dim, marginTop: 3 }}></i><div style={{ ...mpTxt, fontSize: 11.5 }}>{x}</div></div>)}
          </MpSection>
        </div>
        {L3 && <div style={{ fontFamily: 'Inter', fontSize: 10.5, color: MP.mut, lineHeight: 1.5 }}>Opportunities are ranked by model confidence, with retention risk above 55 always first. Signals, market-basket and share-of-wallet results for the same product are combined into one opportunity. Each evidence line is a model driver; its share of score is that driver's contribution to the confidence.</div>}
      </div>
      </div>
    </div>
  );
}

function MeetingPrepLauncher({ row, d }) {
  const [open, setOpen] = React.useState(false);
  if (!row) return null;
  return (
    <>
      <button onClick={(e) => { e.stopPropagation(); setOpen(true); }} title="Meeting prep brief" style={{ alignSelf: 'flex-end', height: 30, padding: '0 12px', borderRadius: 6, border: `1px solid ${mpA(MP.acc, 0.55)}`, background: mpA(MP.acc, 0.12), color: MP.acc, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7, fontFamily: 'Inter', fontSize: 12, fontWeight: 600 }}>
        <i className="fa-solid fa-clipboard-list" style={{ fontSize: 12 }}></i>Meeting prep
      </button>
      {open && ReactDOM.createPortal(<MeetingPrepBrief row={row} d={d} onClose={() => setOpen(false)} />, document.body)}
    </>
  );
}

Object.assign(window, { MeetingPrepBrief, MeetingPrepLauncher });
