/* Marketing — Campaign Analytics: campaigns Field has pushed, members, email
   and sales-team engagement, attributed sales, sales lift over each member's
   pre-campaign run rate ($ and %), and ROI. */

function MkKpiStrip({ items }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
      {items.map(it => (
        <div key={it.label} style={{ background: MKB.card, border: `1px solid ${MKB.line}`, borderRadius: 12, padding: '12px 16px 14px', minWidth: 0 }}>
          <div style={{ fontFamily: 'Inter', fontSize: 9.5, color: MKB.dim, textTransform: 'uppercase', letterSpacing: 0.6 }}>{it.label}</div>
          <div style={{ fontFamily: 'Inter Display, Inter', fontSize: 24, fontWeight: 500, color: it.strong ? MKB.acc : MKB.ink, fontVariantNumeric: 'tabular-nums', marginTop: 2 }}>{it.value}</div>
          {it.sub && <div style={{ fontFamily: 'Inter', fontSize: 10.5, color: MKB.mut, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.sub}</div>}
        </div>
      ))}
    </div>
  );
}
function MkStatus({ s }) {
  const c = s === 'Active' ? 'rgb(52,211,153)' : 'rgb(148,163,184)';
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 20, padding: '0 8px', borderRadius: 10, border: `1px solid ${mkA(c, 0.4)}`, fontFamily: 'Inter', fontSize: 10.5, fontWeight: 600, color: c }}><span style={{ width: 6, height: 6, borderRadius: 3, background: c }}></span>{s}</span>;
}
function MkTag({ icon, color, children }) {
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: 'Inter', fontSize: 10.5, color: MKB.dim, whiteSpace: 'nowrap' }}><i className={`fa-solid fa-${icon}`} style={{ fontSize: 9, color }}></i>{children}</span>;
}
const mkFmtDate = (iso) => new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
const MKA_DEFAULT = { products: [], sigs: [], types: [], status: 'All', camp: '' };
const mkTypeOf = (c) => c.sig === 'none' ? '_none' : c.types && c.types.length === 1 ? c.types[0] : '_multi';
const MKA_DIM_FILTER = { sig: 'sigs', type: 'types', product: 'products' };
/* Walk up to the scrolling ancestor and bring el near the top (no scrollIntoView). */
function mkScrollTo(el, off = 64) { if (!el) return; let p = el.parentElement; while (p && !(/(auto|scroll)/.test(getComputedStyle(p).overflowY) && p.scrollHeight > p.clientHeight)) p = p.parentElement; const t = p || document.scrollingElement; const top = el.getBoundingClientRect().top - (p ? p.getBoundingClientRect().top : 0); t.scrollTo({ top: t.scrollTop + top - off, behavior: 'smooth' }); }

function CampaignAnalyticsPage() {
  const [user, setUser] = React.useState(mkLoadUserCampaigns);
  React.useEffect(() => { const on = () => setUser(mkLoadUserCampaigns()); window.addEventListener('focus', on); return () => window.removeEventListener('focus', on); }, []);
  const all = React.useMemo(() => [...user, ...MK_SEED_CAMPAIGNS], [user]);
  const [flt, setFlt] = React.useState(MKA_DEFAULT);
  const [sort, setSort] = React.useState({ k: 'start', d: -1 });
  const setSelId = (id) => setFlt(p => ({ ...p, camp: p.camp === id ? '' : id }));
  const [byDim, setByDim] = React.useState('sig');
  const [dim, setDim] = React.useState('region');
  const [dimSort, setDimSort] = React.useState({ k: 'liftD', d: -1 });
  const has = (a, v) => !a.length || a.includes(v);
  const mkPass = (c, skip) => (skip === 'products' || has(flt.products, c.product)) && (skip === 'sigs' || has(flt.sigs, c.sig)) && (skip === 'types' || has(flt.types, mkTypeOf(c))) && (flt.status === 'All' || c.status === flt.status);
  const detailRef = React.useRef(null);
  const fN = flt.products.length + flt.sigs.length + flt.types.length + (flt.status !== 'All' ? 1 : 0) + (flt.camp ? 1 : 0);
  const list = React.useMemo(() => {
    const rows = all.filter(c => mkPass(c));
    const key = { rev: c => mkRev(c), name: c => c.name, status: c => c.status, start: c => c.start, members: c => c.members, open: c => c.open, engaged: c => c.engaged, attributed: c => c.attributed, liftD: c => c.liftD, costK: c => c.costK, roi: c => mkRoi(c) }[sort.k];
    return rows.slice().sort((a, b) => { const x = key(a), y = key(b); return (x < y ? -1 : x > y ? 1 : 0) * sort.d; });
  }, [all, flt, sort]);
  const sel = flt.camp ? list.find(c => c.id === flt.camp) : null;
  const scope = sel ? [sel] : list;
  const meas = (c) => c.measureLift !== false;
  const liveE = scope.filter(c => !c.fresh);
  const live = liveE.filter(meas);
  const liveAll = list.filter(c => !c.fresh && meas(c));
  const noLift = sel && !meas(sel);
  const agg = React.useMemo(() => {
    if (!liveAll.length) return null;
    const L = Math.max(...liveAll.map(c => c.trend.length));
    const trend = Array.from({ length: L }, (_, w) => { const o = { opens: 0, clicks: 0, touches: 0, lift: 0, base: 0, actual: 0 }; liveAll.forEach(c => { const t = c.trend[w]; if (t) Object.keys(o).forEach(k => (o[k] += t[k])); }); return o; });
    const s = (k) => liveAll.reduce((x, c) => x + c[k], 0), m = s('members');
    const baseline = s('baseline'), liftD = s('liftD');
    return { id: 'all', aggregate: true, parts: liveAll, name: 'All campaigns', trend, members: m, attributed: s('attributed'), baseline, liftD, lift: baseline ? liftD / baseline : 0, engaged: m ? liveAll.reduce((x, c) => x + c.engaged * c.members, 0) / m : 0 };
  }, [liveAll]);
  const detail = sel || agg;
  const sum = (k) => live.reduce((a, c) => a + c[k], 0);
  const wavg = (k) => { const m = liveE.reduce((a, c) => a + c.members, 0); return m ? liveE.reduce((a, c) => a + c[k] * c.members, 0) / m : 0; };
  const liftD = sum('liftD'), base = sum('baseline'), cost = live.reduce((a, c) => a + mkCost(c), 0);
  const rev = live.reduce((a, c) => a + mkRev(c), 0), baseRev = live.reduce((a, c) => a + c.baseline * mkRate(c), 0);
  const revAnn = live.reduce((a, c) => a + mkRevAnn(c), 0);
  const roiAll = mkRoiOf(revAnn, cost);
  const openCamp = (id) => setFlt(p => ({ ...p, camp: p.camp === id ? '' : id }));

  const bubble = React.useMemo(() => ({
    chart: { type: 'bubble', height: 270 },
    legend: { enabled: false },
    xAxis: { title: { text: 'Sales engaged (members a wholesaler touched after send)', style: { color: MKB.dim, fontSize: '10.5px' } }, labels: { format: '{value}%' }, gridLineWidth: 1 },
    yAxis: { title: { text: 'Sales lift over run rate', style: { color: MKB.dim, fontSize: '10.5px' } }, labels: { format: '{value}%' } },
    tooltip: { formatter() { const c = this.point.c; return `<b>${c.name}</b><br/>Sales engaged ${mkPct(c.engaged)} · Lift ${mkPct(c.lift, 1)} (${mkMoney(c.liftD)})<br/>Attributed ${mkMoney(c.attributed)} · Revenue lift ${mkRevMoney(mkRev(c))}<br/>ROI ${c.costK ? mkPct(mkRoi(c)) : '—'}<br/><span style="color:#9ca3af">${sel && sel.id === c.id ? 'Click again to clear' : 'Click to filter'}</span>`; } },
    plotOptions: { bubble: { minSize: 14, maxSize: 46, cursor: 'pointer', point: { events: { click() { const c = this.c || (this.options && this.options.c); if (c) openCamp(c.id); } } }, dataLabels: { enabled: false } } },
    series: [{ data: liveAll.map(c => { const col = (MK_SIG[c.sig] || MK_SIG.none).color; const on = sel && sel.id === c.id, off = sel && !on; return { x: Math.round(c.engaged * 1000) / 10, y: Math.round(c.lift * 1000) / 10, z: c.attributed, c, color: mkA(col, off ? 0.1 : on ? 0.7 : 0.4), marker: { lineColor: off ? mkA(col, 0.35) : on ? 'rgb(249,250,251)' : col, lineWidth: on ? 2.5 : 1.5 } }; }) }],
  }), [liveAll, sel && sel.id]);

  const TYPE_ROWS = [...MK_SIGNALS.filter(s => s.key !== 'none' && s.key !== 'any').flatMap(s => s.types.map(ty => ({ key: ty, label: MK_TYPE_SHORT[ty], icon: (LV_SIG_META[ty] || {}).icon, color: s.color }))), { key: '_multi', label: 'Several / any', icon: 'bolt', color: 'rgb(226,232,240)' }, { key: '_none', label: 'No signal', icon: 'users', color: 'rgb(148,163,184)' }];
  const typeOf = mkTypeOf, fk = MKA_DIM_FILTER[byDim];
  const groupPool = all.filter(c => !c.fresh && meas(c) && mkPass(c, fk));
  const toggleGroup = (k) => setFlt(p => ({ ...p, [fk]: p[fk].includes(k) ? p[fk].filter(x => x !== k) : [...p[fk], k] }));
  const groupDefs = { type: [TYPE_ROWS, typeOf, x => x.label, x => x.icon, x => x.color], sig: [MK_SIGNALS, c => c.sig, x => x.label, x => x.icon, x => x.color], product: [MK_PRODUCTS, c => c.product, x => x.label, x => x.icon, x => x.color] }[byDim];
  const groups = groupDefs[0].map(x => { const cs = groupPool.filter(c => groupDefs[1](c) === x.key); const a = cs.reduce((s, c) => s + c.attributed, 0), l = cs.reduce((s, c) => s + c.liftD, 0), b = cs.reduce((s, c) => s + c.baseline, 0), k = cs.reduce((s, c) => s + mkCost(c), 0); const rv = cs.reduce((s, c) => s + mkRev(c), 0), rva = rv; return { x, n: cs.length, a, l, rv, pct: b ? l / b : 0, roi: mkRoiOf(rva, k) }; }).filter(g => g.n).sort((p, q) => q.l - p.l);
  const gmax = Math.max(0.1, ...groups.map(g => g.a));

  const trend = React.useMemo(() => detail && !detail.fresh && detail.trend.length ? ({
    chart: { height: 250 },
    xAxis: { categories: detail.trend.map((_, i) => `Wk ${i + 1}`), title: { text: 'Weeks since first send' }, tickInterval: 2 },
    yAxis: [{ title: { text: 'Opens · clicks · touches' } }, { title: { text: 'Sales lift ($K)' }, opposite: true, labels: { format: '${value}K' } }],
    tooltip: { shared: true },
    series: [
      { type: 'column', name: 'Email opens', data: detail.trend.map(t => t.opens), ...wash('rgb(59,130,246)'), visible: false },
      { type: 'column', name: 'Email clicks', data: detail.trend.map(t => t.clicks), ...wash('rgb(139,92,246)') },
      { type: 'column', name: 'Sales touches', data: detail.trend.map(t => t.touches), ...wash('rgb(16,185,129)') },
      { type: 'spline', name: 'Sales lift', yAxis: 1, data: detail.trend.map(t => Math.round(t.lift * 1000)), color: 'rgb(251,191,36)', lineWidth: 2.5, marker: { enabled: true, radius: 3 }, tooltip: { valuePrefix: '$', valueSuffix: 'K' } },
    ],
  }) : null, [detail]);
  const liftChart = React.useMemo(() => {
    if (!detail || detail.fresh || !detail.trend.length) return null;
    let a = 0, b = 0; const act = [], bas = [];
    detail.trend.forEach(t => { a += t.actual; b += t.base; act.push(Math.round(a * 100) / 100); bas.push(Math.round(b * 100) / 100); });
    return {
      chart: { height: 250 },
      xAxis: { categories: detail.trend.map((_, i) => `Wk ${i + 1}`), title: { text: 'Weeks since first send' }, tickInterval: 2, plotLines: detail.trend.length > 13 ? [{ value: 12.5, color: 'rgba(209,213,219,0.35)', dashStyle: 'Dot', width: 1, label: { text: '90 days', style: { color: 'rgb(163,163,163)', fontSize: '10px' } } }] : [] },
      yAxis: { title: { text: detail.basis === 'net' ? 'Cumulative net flows ($M)' : 'Cumulative sales ($M)' }, labels: { format: '${value}M' } },
      tooltip: { shared: true, valuePrefix: '$', valueSuffix: 'M' },
      series: [
        { type: 'areaspline', name: detail.basis === 'net' ? 'Actual net flows from members' : 'Actual sales from members', data: act, color: 'rgb(16,185,129)', fillOpacity: 0.18, lineWidth: 2 },
        { type: 'spline', name: 'Run rate (pre-campaign trailing 12m)', data: bas, color: 'rgb(148,163,184)', dashStyle: 'Dash', lineWidth: 2, marker: { enabled: false } },
      ],
    };
  }, [detail]);
  const dimRows = React.useMemo(() => {
    if (!detail || detail.fresh) return [];
    let rows;
    if (detail.aggregate) {
      const m = {};
      detail.parts.forEach(c => mkBreakdown(c, dim).forEach(r => { const x = m[r.key] || (m[r.key] = { key: r.key, members: 0, engW: 0, attributed: 0, base: 0, liftD: 0, rev: 0 }); x.rev += r.liftD * mkRate(c); x.members += r.members; x.engW += r.eng * r.members; x.attributed += r.attributed; x.base += r.base; x.liftD += r.liftD; }));
      rows = Object.values(m).map(x => ({ ...x, eng: x.members ? x.engW / x.members : 0, lift: x.base ? x.liftD / x.base : 0 }));
    } else rows = mkBreakdown(detail, dim).map(r => ({ ...r, rev: r.liftD * mkRate(detail) }));
    const k = dimSort.k;
    return rows.slice().sort((p, q) => { const x = k === 'key' ? p.key : p[k], y = k === 'key' ? q.key : q[k]; return (x < y ? -1 : x > y ? 1 : 0) * dimSort.d; });
  }, [detail, dim, dimSort]);

  const th = (label, k, right) => (
    <th onClick={k ? () => setSort(s => ({ k, d: s.k === k ? -s.d : -1 })) : undefined} style={{ textAlign: right ? 'right' : 'left', padding: '10px 12px', fontFamily: 'Inter', fontSize: 10, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', color: sort.k === k ? MKB.ink : MKB.dim, borderBottom: `1px solid ${MKB.line}`, cursor: k ? 'pointer' : 'default', whiteSpace: 'nowrap' }}>
      {label}{sort.k === k && <i className={`fa-solid fa-arrow-${sort.d < 0 ? 'down' : 'up'}`} style={{ fontSize: 8, marginLeft: 5 }}></i>}
    </th>
  );
  const dth = (label, k, right) => (
    <th onClick={() => setDimSort(s => ({ k, d: s.k === k ? -s.d : -1 }))} style={{ textAlign: right ? 'right' : 'left', padding: '7px 10px', fontFamily: 'Inter', fontSize: 10, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', color: dimSort.k === k ? MKB.ink : MKB.dim, borderBottom: `1px solid ${MKB.line}`, cursor: 'pointer', whiteSpace: 'nowrap', position: 'sticky', top: 0, background: 'rgb(24,32,45)' }}>
      {label}{dimSort.k === k && <i className={`fa-solid fa-arrow-${dimSort.d < 0 ? 'down' : 'up'}`} style={{ fontSize: 8, marginLeft: 5 }}></i>}
    </th>
  );
  const td = { padding: '10px 12px', fontFamily: 'Inter', fontSize: 12.5, color: 'rgb(229,231,235)', borderBottom: '1px solid rgba(75,85,99,0.16)', fontVariantNumeric: 'tabular-nums' };
  const tdr = { ...td, textAlign: 'right' };
  const dash = <span style={{ color: MKB.mut }}>—</span>;
  const campLabels = all.reduce((o, c) => (o[c.id] = c.name, o), {});
  const sigLabels = MK_SIGNALS.reduce((a, x) => (a[x.key] = x.label, a), {});
  const prodLabels = MK_PRODUCTS.reduce((a, x) => (a[x.key] = x.label, a), {});
  const dmax = Math.max(0.0001, ...dimRows.map(r => r.liftD));

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 20, background: MKB.bg, borderBottom: `1px solid ${MKB.line}`, padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ width: 300 }}>
          <select value={flt.camp} onChange={e => setFlt(p => ({ ...p, camp: e.target.value }))} style={{ height: 30, width: '100%', borderRadius: 8, border: `1px solid ${flt.camp ? 'rgba(52,211,153,0.55)' : 'rgba(75,85,99,0.7)'}`, background: flt.camp ? 'rgba(52,211,153,0.08)' : 'rgb(17,24,39)', color: MKB.ink, fontFamily: 'Inter', fontSize: 12, padding: '0 8px' }}>
            <option value="">Campaign: All campaigns</option>
            {list.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div style={{ width: 200 }}><MkMulti label="Signal" options={MK_SIGNALS.map(x => x.key)} labels={sigLabels} value={flt.sigs} onChange={v => setFlt(p => ({ ...p, sigs: v }))} /></div>
        <div style={{ width: 200 }}><MkMulti label="Product" options={MK_PRODUCTS.map(x => x.key)} labels={prodLabels} value={flt.products} onChange={v => setFlt(p => ({ ...p, products: v }))} /></div>
        <span style={{ width: 1, height: 18, background: MKB.line, margin: '0 4px' }}></span>
        <MkSeg value={flt.status} onChange={v => setFlt(p => ({ ...p, status: v }))} options={[['All', 'All'], ['Active', 'Active'], ['Completed', 'Completed']]} />
        {fN > 0 && <button onClick={() => setFlt(MKA_DEFAULT)} style={{ height: 28, padding: '0 10px', borderRadius: 7, border: 'none', background: 'transparent', color: MKB.acc, fontFamily: 'Inter', fontSize: 11.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}><i className="fa-solid fa-xmark" style={{ fontSize: 10 }}></i>Clear {fN} filter{fN === 1 ? '' : 's'}</button>}
        <span style={{ flex: 1 }}></span>
        <span style={{ fontFamily: 'Inter', fontSize: 11.5, color: MKB.dim }}>{sel ? '1 campaign selected' : `${list.length} of ${all.length} campaigns`}</span>
      </div>

      <div style={{ padding: '16px 24px 40px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <MkKpiStrip items={[
          { label: sel ? 'Campaign' : 'Campaigns', value: sel ? sel.status : scope.length, sub: sel ? `Started ${mkFmtDate(sel.start)}` : `${scope.filter(c => c.status === 'Active').length} active` },
          { label: 'Members', value: mkNum(scope.reduce((a, c) => a + c.members, 0)), sub: `${mkNum(scope.reduce((a, c) => a + c.contacts, 0))} contacts` },
          { label: 'Email open / click', value: mkPct(wavg('open')), sub: `${mkPct(wavg('click'), 1)} click rate` },
          { label: 'Sales engaged', value: mkPct(wavg('engaged')), sub: 'Members touched by sales after send' },
          ...(noLift ? [{ label: 'Sales lift, revenue, ROI', value: 'Not measured', sub: `${sel.purpose || 'Awareness'} campaign · engagement and follow-up only` }] : [
          { label: 'Attributed sales', value: mkMoney(sum('attributed')), sub: `vs ${mkMoney(base)} run rate` },
          { label: sel && sel.basis === 'net' ? 'Net flow lift' : 'Sales lift', value: mkMoney(liftD), sub: `+${mkPct(base ? liftD / base : 0, 1)} over run rate${!sel && liveE.length > live.length ? ` · ${liveE.length - live.length} excluded` : ''}`, strong: liftD > 0 },
          { label: 'Revenue lift', value: mkRevMoney(rev), sub: `+${mkPct(baseRev ? rev / baseRev : 0, 1)} annual fees over run rate`, strong: rev > 0 },
          { label: 'ROI', value: mkPct(roiAll), sub: `Contribution over ${MK_HOLD_YRS}-yr hold on ${mkMoney(cost / 1000)} cost to date`, strong: roiAll > 0 },
          ]),
        ]} />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 14 }}>
          <MkCard title="Does sales follow-up drive lift?" note={sel ? "Bubble size is attributed sales · click the bubble again to clear" : "Bubble size is attributed sales · click a bubble to filter"}>
            {live.length ? <HC options={bubble} style={{ height: 270 }} /> : <div style={{ padding: 30, textAlign: 'center', color: MKB.mut, fontFamily: 'Inter', fontSize: 12 }}>No results yet for this selection.</div>}
          </MkCard>
          <MkCard title="Attributed sales and lift" note={flt[fk].length ? `Filtered to ${flt[fk].length} · click again to clear` : 'Click a row to filter the page'} right={<MkSeg value={byDim} onChange={setByDim} options={[['sig', 'Signal group'], ['type', 'Signal type'], ['product', 'Product']]} />}>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(110px,1.2fr) minmax(0,2fr) 58px 62px 58px 54px', gap: 10, fontFamily: 'Inter', fontSize: 10, fontWeight: 600, color: MKB.dim, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              <span></span><span>Attributed · <span style={{ color: 'rgb(251,191,36)' }}>lift</span></span><span style={{ textAlign: 'right' }}>Attrib.</span><span style={{ textAlign: 'right' }}>Sales lift</span><span style={{ textAlign: 'right' }}>Rev lift</span><span style={{ textAlign: 'right' }}>ROI</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {groups.map(g => { const act = flt[fk].includes(g.x.key), selHit = sel && groupDefs[1](sel) === g.x.key, dimmed = (flt[fk].length && !act) || (sel && !selHit); return (
                <div key={g.x.key} onClick={() => toggleGroup(g.x.key)} title={act ? 'Click to clear' : 'Click to filter'} style={{ cursor: 'pointer', margin: '0 -8px', padding: '4px 8px', borderRadius: 6, background: act ? 'rgba(5,122,85,0.16)' : 'transparent', boxShadow: act ? `inset 2px 0 0 ${MKB.acc}` : 'none', opacity: dimmed ? 0.45 : 1, display: 'grid', gridTemplateColumns: 'minmax(110px,1.2fr) minmax(0,2fr) 58px 62px 58px 54px', gap: 10, alignItems: 'center' }}>
                  <span style={{ fontFamily: 'Inter', fontSize: 12, color: MKB.ink, display: 'inline-flex', alignItems: 'center', gap: 6, minWidth: 0 }}><i className={`fa-solid fa-${groupDefs[3](g.x)}`} style={{ fontSize: 10, color: groupDefs[4](g.x), width: 12 }}></i><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{groupDefs[2](g.x)}</span><span style={{ color: MKB.mut, fontSize: 10.5 }}>{g.n}</span></span>
                  <span style={{ height: 12, borderRadius: 3, background: 'rgba(255,255,255,0.04)', display: 'flex', overflow: 'hidden' }}>
                    <span style={{ width: `${(g.a - g.l) / gmax * 100}%`, background: 'rgba(16,185,129,0.4)' }}></span>
                    <span style={{ width: `${g.l / gmax * 100}%`, background: 'rgba(251,191,36,0.75)' }}></span>
                  </span>
                  <span style={{ textAlign: 'right', fontFamily: 'Inter', fontSize: 12, color: MKB.ink, fontVariantNumeric: 'tabular-nums' }}>{mkMoney(g.a)}</span>
                  <span style={{ textAlign: 'right', fontFamily: 'Inter', fontSize: 12, fontWeight: 600, color: 'rgb(251,191,36)', fontVariantNumeric: 'tabular-nums' }} title={`+${mkPct(g.pct, 1)} over run rate`}>{mkMoney(g.l)}</span>
                  <span style={{ textAlign: 'right', fontFamily: 'Inter', fontSize: 12, color: MKB.ink, fontVariantNumeric: 'tabular-nums' }}>{mkRevMoney(g.rv)}</span>
                  <span style={{ textAlign: 'right', fontFamily: 'Inter', fontSize: 11.5, color: g.roi > 0 ? MKB.acc : 'rgb(248,113,113)', fontVariantNumeric: 'tabular-nums' }}>{mkPct(g.roi)}</span>
                </div>
              ); })}
              {!groups.length && <div style={{ padding: 20, textAlign: 'center', color: MKB.mut, fontFamily: 'Inter', fontSize: 12 }}>No results yet for this selection.</div>}
            </div>
          </MkCard>
        </div>

        <MkCard title="Campaigns" note="Click a row for engagement, lift and breakdowns" pad="14px 0 6px">
          <div style={{ overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1260 }}>
              <thead><tr>{th('Campaign', 'name')}{th('Status', 'status')}{th('Start', 'start')}{th('Members', 'members', true)}{th('Open · click', 'open', true)}{th('Sales engaged', 'engaged', true)}{th('Attributed', 'attributed', true)}{th('Sales lift', 'liftD', true)}{th('Revenue lift', 'rev', true)}{th('Cost', 'costK', true)}{th('ROI', 'roi', true)}{th('Sales sees it')}</tr></thead>
              <tbody>
                {list.map(c => {
                  const on = sel && sel.id === c.id, roi = mkRoi(c), t = MK_TPL[c.tpl], s = MK_SIG[c.sig], p = MK_PROD[c.product];
                  return (
                    <tr key={c.id} onClick={() => setSelId(c.id)} style={{ cursor: 'pointer', background: on ? 'rgba(5,122,85,0.16)' : 'transparent' }}
                      onMouseEnter={e => { if (!on) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }} onMouseLeave={e => { if (!on) e.currentTarget.style.background = 'transparent'; }}>
                      <td style={{ ...td, boxShadow: on ? `inset 2px 0 0 ${MKB.acc}` : 'none' }}>
                        <div style={{ fontWeight: 600, color: MKB.ink, display: 'flex', alignItems: 'center', gap: 8 }}>{c.name}{c.fresh && <span style={{ fontSize: 10, fontWeight: 600, color: 'rgb(56,189,248)' }}>NEW</span>}</div>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 3, flexWrap: 'wrap' }}>
                          <MkTag icon={s ? s.icon : 'users'} color={s ? s.color : MKB.dim}>{mkTypesLabel(c.sig, c.types)}</MkTag>
                          {p && c.product !== 'any' && <MkTag icon={p.icon} color={p.color}>{p.label}</MkTag>}
                        </div>
                      </td>
                      <td style={td}><MkStatus s={c.status} /></td>
                      <td style={td}>{mkFmtDate(c.start)}</td>
                      <td style={tdr}><div style={{ color: MKB.ink, fontWeight: 600 }}>{mkNum(c.members)}</div><div style={{ fontSize: 10.5, color: MKB.mut }}>{mkNum(c.contacts)} contacts</div></td>
                      <td style={tdr}>{c.fresh ? dash : <><div>{mkPct(c.open)}</div><div style={{ fontSize: 10.5, color: MKB.mut }}>{mkPct(c.click, 1)} click</div></>}</td>
                      <td style={tdr}>{c.fresh ? dash : <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}><span style={{ width: 44, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)' }}><span style={{ display: 'block', height: '100%', width: `${Math.min(100, c.engaged * 200)}%`, borderRadius: 3, background: MKB.acc }}></span></span>{mkPct(c.engaged)}</div>}</td>
                      <td style={{ ...tdr, color: MKB.ink, fontWeight: 600 }}>{c.fresh ? dash : !meas(c) ? <span title="Excluded from lift, revenue and ROI" style={{ fontSize: 10.5, color: MKB.mut }}>Not measured</span> : <><div>{mkMoney(c.attributed)}</div><div style={{ fontSize: 10.5, color: MKB.mut, fontWeight: 400 }}>run rate {mkMoney(c.baseline)}</div></>}</td>
                      <td style={tdr}>{c.fresh || !meas(c) ? dash : <><div style={{ fontWeight: 600, color: 'rgb(251,191,36)' }}>{mkMoney(c.liftD)}</div><div style={{ fontSize: 10.5, color: MKB.mut }}>+{mkPct(c.lift, 1)}{c.basis === 'net' ? ' net flows' : ''}</div></>}</td>
                      <td style={tdr}>{c.fresh || !meas(c) ? dash : <><div>{mkRevMoney(mkRev(c))}</div><div style={{ fontSize: 10.5, color: MKB.mut }}>{(mkRate(c) * 1e4).toFixed(0)}bps fee</div></>}</td>
                      <td style={tdr}>{c.costK ? <><div title={`$${c.costK}K direct + $${MK_SETUP_K}K setup${c.status === 'Active' ? ', prorated to days live' : ''}`}>${(Math.round(mkCost(c) * 10) / 10)}K</div><div style={{ fontSize: 10.5, color: MKB.mut }}>{c.channel || 'Email'}{c.status === 'Active' ? ' · to date' : ''}</div></> : dash}</td>
                      <td style={{ ...tdr, fontWeight: 600, color: roi > 0 ? MKB.acc : 'rgb(248,113,113)' }}>{c.fresh || !c.costK || !meas(c) ? dash : mkPct(roi)}</td>
                      <td style={td}>{c.showSales ? <i className="fa-solid fa-eye" title="Visible to wholesalers" style={{ color: MKB.acc, fontSize: 11 }}></i> : <i className="fa-solid fa-eye-slash" title="Marketing only" style={{ color: MKB.mut, fontSize: 11 }}></i>}</td>
                    </tr>
                  );
                })}
                {!list.length && <tr><td colSpan={12} style={{ ...td, textAlign: 'center', color: MKB.mut, padding: 30 }}>No campaigns match these filters.</td></tr>}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '8px 18px 6px', fontFamily: 'Inter', fontSize: 11, color: MKB.mut, lineHeight: 1.5 }}>Attributed: sales from members within 26 weeks of first send; lift typically builds over the first 90 days, then tapers. Sales lift: attributed sales above each member's pre-campaign run rate (trailing 12-month sales, scaled to the same window). Retention campaigns measure lift on net flows: redemptions avoided against the members' pre-campaign net-flow run rate. Revenue lift: sales lift × the product's annual management fee (book average for multi-product campaigns). Lift: attributed sales less each campaign's pre-campaign average daily run rate × days live. ROI: revenue lift × 40% contribution margin over a 3-year hold (20% a year redeeming, 8% cost of capital), less cost, over cost. Cost is direct spend plus $5K setup and content, prorated to days live for active campaigns.</div>
        </MkCard>

        {detail && (<div ref={detailRef} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <MkCard title={detail.aggregate ? `All campaigns${fN ? ' in this selection' : ''}` : detail.name} note={detail.aggregate ? `${detail.parts.length} campaigns with results · weeks aligned to each campaign’s first send · pick a campaign above or click a row to drill in` : `${mkCampaignLabel(detail)} · ${detail.dest || 'CRM campaign'}${detail.journey ? ' · ' + detail.journey : ''}${detail.measureLift === false ? ' · excluded from lift and ROI' : ''} · syncs ${detail.sync.toLowerCase()}${detail.scope ? ' · ' + detail.scope : ''}`} right={detail.aggregate ? null : <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><MkStatus s={detail.status} /><button onClick={() => setFlt(p => ({ ...p, camp: '' }))} style={{ border: 'none', background: 'transparent', color: MKB.acc, fontFamily: 'Inter', fontSize: 11.5, cursor: 'pointer' }}>Back to all campaigns</button></div>}>
            {!detail.fresh && detail.measureLift === false && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', marginBottom: 10, borderRadius: 8, border: `1px solid ${MKB.line}`, background: 'rgba(255,255,255,0.03)', fontFamily: 'Inter', fontSize: 12, color: MKB.dim }}>
                <i className="fa-solid fa-bullhorn" style={{ color: 'rgb(56,189,248)', fontSize: 12 }}></i>
                <span>{detail.purpose || 'Awareness'} campaign, set up to track engagement and wholesaler follow-up only. Sales lift shown below is for reference and is excluded from campaign totals, revenue and ROI.</span>
              </div>
            )}
            {detail.fresh ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '18px 4px', fontFamily: 'Inter', fontSize: 12.5, color: MKB.dim }}>
                <i className="fa-solid fa-clock" style={{ color: 'rgb(56,189,248)', fontSize: 16 }}></i>
                <span>Pushed {mkFmtDate(detail.start)} with {mkNum(detail.members)} FA/Teams and {mkNum(detail.contacts)} contacts. Email engagement syncs back from the CRM campaign after the first send; sales engagement and lift build over the following weeks.</span>
              </div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 14 }}>
                  <div style={{ minWidth: 0 }}><MkLabel>Engagement and sales lift by week</MkLabel><HC options={trend} style={{ height: 250 }} /></div>
                  <div style={{ minWidth: 0 }}><MkLabel>{detail.basis === 'net' ? 'Net flow lift' : 'Sales lift'} over run rate · {mkMoney(detail.liftD)} (+{mkPct(detail.lift, 1)}){detail.status === 'Active' ? ' so far' : ''}</MkLabel><HC options={liftChart} style={{ height: 250 }} /></div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 12, borderTop: `1px solid ${MKB.line}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <MkLabel style={{ marginRight: 6 }}>Breakdown by</MkLabel>
                    {MK_DIMS.map(d => <MkPill key={d.key} on={dim === d.key} onClick={() => setDim(d.key)}>{d.label}</MkPill>)}
                  </div>
                  <div style={{ overflow: 'auto', maxHeight: 340 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 820 }}>
                      <thead><tr>{dth(MK_DIMS.find(d => d.key === dim).label, 'key')}{dth('Members', 'members', true)}{dth('Sales engaged', 'eng', true)}{dth('Attributed', 'attributed', true)}{dth('Run rate', 'base', true)}{dth('Sales lift', 'liftD', true)}{dth('Lift %', 'lift', true)}{dth('Revenue lift', 'rev', true)}</tr></thead>
                      <tbody>{dimRows.map(r => (
                        <tr key={r.key}>
                          <td style={{ ...td, padding: '7px 10px' }}>{r.key}</td>
                          <td style={{ ...tdr, padding: '7px 10px' }}>{mkNum(r.members)}</td>
                          <td style={{ ...tdr, padding: '7px 10px' }}>{mkPct(r.eng)}</td>
                          <td style={{ ...tdr, padding: '7px 10px' }}>{mkMoney(r.attributed)}</td>
                          <td style={{ ...tdr, padding: '7px 10px', color: MKB.dim }}>{mkMoney(r.base)}</td>
                          <td style={{ ...tdr, padding: '7px 10px' }}><div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}><span style={{ width: 60, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)' }}><span style={{ display: 'block', height: '100%', width: `${r.liftD / dmax * 100}%`, borderRadius: 3, background: 'rgb(251,191,36)' }}></span></span><span style={{ fontWeight: 600, color: MKB.ink, minWidth: 52 }}>{mkMoney(r.liftD)}</span></div></td>
                          <td style={{ ...tdr, padding: '7px 10px' }}>+{mkPct(r.lift, 1)}</td>
                          <td style={{ ...tdr, padding: '7px 10px' }}>{mkRevMoney(r.rev)}</td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </MkCard>
          {!detail.fresh && <MkFaResults detail={detail} />}
        </div>)}
      </div>
    </div>
  );
}

/* FA/Team results for the selected campaign, or every FA/Team across the
   campaigns in view. */
function MkFaResults({ detail }) {
  const [q, setQ] = React.useState('');
  const [eng, setEng] = React.useState('All');
  const [srt, setSrt] = React.useState({ k: 'liftD', d: -1 });
  const agg = !!detail.aggregate;
  const rows = React.useMemo(() => mkMembersAgg(agg ? detail.parts : [detail]), [detail]);
  const shown = React.useMemo(() => {
    const ql = q.trim().toLowerCase();
    const f = rows.filter(r => (eng === 'All' || (eng === 'Engaged') === r.engaged) && (!ql || r.name.toLowerCase().includes(ql) || (r.firm || '').toLowerCase().includes(ql) || (r.wholesaler || '').toLowerCase().includes(ql)));
    const val = (r) => srt.k === 'name' ? r.name : srt.k === 'lift' ? (r.base ? r.liftD / r.base : 0) : srt.k === 'email' ? r.nClicked * 100 + r.nOpened : srt.k === 'newBuyer' ? (r.newBuyer ? 1 : 0) : r[srt.k];
    return f.sort((a, b) => { const x = val(a), y = val(b); return (x < y ? -1 : x > y ? 1 : 0) * srt.d; });
  }, [rows, q, eng, srt]);
  const LIMIT = 100, vis = shown.slice(0, LIMIT);
  const engN = rows.filter(r => r.engaged).length;
  const avg = (fn, xs) => { const b = xs.reduce((a, r) => a + r.base, 0); return b ? xs.reduce((a, r) => a + r.liftD, 0) / b : 0; };
  const liftEng = avg(null, rows.filter(r => r.engaged)), liftNot = avg(null, rows.filter(r => !r.engaged));
  const th = (label, k, right) => (
    <th onClick={() => setSrt(s => ({ k, d: s.k === k ? -s.d : -1 }))} style={{ textAlign: right ? 'right' : 'left', padding: '8px 10px', fontFamily: 'Inter', fontSize: 10, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', color: srt.k === k ? MKB.ink : MKB.dim, borderBottom: `1px solid ${MKB.line}`, cursor: 'pointer', whiteSpace: 'nowrap', position: 'sticky', top: 0, background: 'rgb(24,32,45)', zIndex: 1 }}>
      {label}{srt.k === k && <i className={`fa-solid fa-arrow-${srt.d < 0 ? 'down' : 'up'}`} style={{ fontSize: 8, marginLeft: 5 }}></i>}
    </th>
  );
  const td = { padding: '8px 10px', fontFamily: 'Inter', fontSize: 12, color: 'rgb(229,231,235)', borderBottom: '1px solid rgba(75,85,99,0.16)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' };
  const tdr = { ...td, textAlign: 'right' };
  const sub = { fontSize: 10.5, color: MKB.mut };
  const lmax = Math.max(0.0001, ...vis.map(r => Math.abs(r.liftD)));
  const neg = 'rgb(248,113,113)';
  return (
    <MkCard title="FA/Team results" note={`${mkNum(rows.length)} FA/Teams${agg ? ' across ' + detail.parts.length + ' campaigns' : ''} · sales engaged lift +${mkPct(liftEng, 1)} vs +${mkPct(liftNot, 1)} not engaged`}
      right={<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <MkSeg value={eng} onChange={setEng} options={[['All', 'All'], ['Engaged', `Sales engaged ${mkNum(engN)}`], ['Not', 'Not engaged']]} />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search FA/Team, firm, wholesaler" style={{ height: 28, width: 220, borderRadius: 7, border: '1px solid rgba(75,85,99,0.7)', background: 'rgb(17,24,39)', color: MKB.ink, fontFamily: 'Inter', fontSize: 12, padding: '0 9px', outline: 'none' }} />
      </div>} pad="14px 0 6px">
      <div style={{ overflow: 'auto', maxHeight: 460 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1320 }}>
          <thead><tr>{th('FA/Team', 'name')}{th('Region', 'region')}{th('Wholesaler', 'wholesaler')}{agg && th('Campaigns', 'camps', true)}{th('Email', 'email', true)}{th('Sales touches', 'touches', true)}{th('Run rate', 'base', true)}{th('Attributed', 'attributed', true)}{th('Sales lift', 'liftD', true)}{th('Lift %', 'lift', true)}{th('Revenue lift', 'rev', true)}{th('New buyer', 'newBuyer')}</tr></thead>
          <tbody>{vis.map(r => {
            const lp = r.base ? r.liftD / r.base : 0;
            return (
              <tr key={r.id}>
                <td style={{ ...td, whiteSpace: 'normal', minWidth: 200 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, color: MKB.ink }}><i className={`fa-solid fa-${r.type === 'Team' ? 'users' : 'user'}`} style={{ fontSize: 9.5, color: MKB.dim }}></i>{r.name}</div>
                  <div style={sub}>{r.firm}</div>
                </td>
                <td style={td}>{r.region}</td>
                <td style={td}>{r.wholesaler}</td>
                {agg && <td style={tdr}>{r.camps}</td>}
                <td style={tdr}>{agg ? <><div>{r.nOpened}/{r.camps} opened</div><div style={sub}>{r.nClicked} clicked</div></> : r.clicked ? <span style={{ color: MKB.acc }}>Clicked</span> : r.opened ? <><div>Opened</div><div style={sub}>{r.opens}×</div></> : <span style={{ color: MKB.mut }}>Not opened</span>}</td>
                <td style={tdr}>{r.touches ? r.touches : <span style={{ color: MKB.mut }}>0</span>}</td>
                <td style={{ ...tdr, color: MKB.dim }}>{mkMoney(r.base)}</td>
                <td style={tdr}>{mkMoney(r.attributed)}</td>
                <td style={tdr}><div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}><span style={{ width: 50, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)' }}><span style={{ display: 'block', height: '100%', width: `${Math.abs(r.liftD) / lmax * 100}%`, borderRadius: 3, background: r.liftD < 0 ? neg : 'rgb(251,191,36)' }}></span></span><span style={{ fontWeight: 600, color: r.liftD < 0 ? neg : MKB.ink, minWidth: 52 }}>{mkMoney(r.liftD)}</span></div></td>
                <td style={{ ...tdr, color: lp < 0 ? neg : 'rgb(229,231,235)' }}>{lp >= 0 ? '+' : ''}{mkPct(lp, 1)}</td>
                <td style={{ ...tdr, color: r.rev < 0 ? neg : 'rgb(229,231,235)' }}>{mkRevMoney(r.rev)}</td>
                <td style={td}>{r.newBuyer ? <span title="First purchase of the campaign product" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'rgb(56,189,248)', fontWeight: 600 }}><i className="fa-solid fa-circle-check" style={{ fontSize: 10 }}></i>Yes</span> : <span style={{ color: MKB.mut }}>—</span>}</td>
              </tr>
            );
          })}
          {!vis.length && <tr><td colSpan={agg ? 12 : 11} style={{ ...td, textAlign: 'center', color: MKB.mut, padding: 24 }}>No FA/Teams match.</td></tr>}
          </tbody>
        </table>
      </div>
      <div style={{ padding: '8px 18px 6px', fontFamily: 'Inter', fontSize: 11, color: MKB.mut, lineHeight: 1.5 }}>{shown.length > LIMIT ? `Showing top ${LIMIT} of ${mkNum(shown.length)} by the sorted column. ` : ''}Run rate is each FA/Team's pre-campaign trailing 12-month sales scaled to the campaign window. Lift can be negative where sales came in under run rate. New buyer: first purchase of the campaign's product during the window.</div>
    </MkCard>
  );
}

Object.assign(window, { CampaignAnalyticsPage });
