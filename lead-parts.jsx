/* Sales Leadership — grid, dimension tiles and heatmap. */

const ML_INK = 'rgb(249,250,251)';
const ML_MUT = 'rgb(163,163,163)';
const ML_DIM = 'rgb(200,205,213)';
const ML_LINE = 'rgba(75,85,99,0.35)';
const ML_L3_BG = 'rgba(167,139,250,0.06)';

function MlL3Tag() {
  return <span title="Level 3 · Segmentation & Signals" style={{ padding: '1px 6px', borderRadius: 4, background: 'rgba(167,139,250,0.14)', border: '1px solid rgba(167,139,250,0.45)', color: 'rgb(196,181,253)', fontFamily: 'Inter', fontSize: 9, fontWeight: 700, letterSpacing: 0.4 }}>L3</span>;
}

function MlPicker({ value, options, onChange, title }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!open) return;
    const off = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', off);
    return () => document.removeEventListener('mousedown', off);
  }, [open]);
  const cur = options.find(o => o.key === value) || options[0];
  // Open toward whichever side has room, so a picker near the left edge of a
  // tile (e.g. the dimension rail) never drops its menu off-screen.
  const [alignLeft, setAlignLeft] = React.useState(false);
  const toggleOpen = () => { if (!open && ref.current) { const r = ref.current.getBoundingClientRect(); setAlignLeft(r.right < 220 || r.left < window.innerWidth / 2); } setOpen(o => !o); };
  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <button onClick={toggleOpen} title={title} style={{
        display: 'inline-flex', alignItems: 'center', gap: 6, height: 24, padding: '0 9px', borderRadius: 6, cursor: 'pointer',
        background: open ? 'rgba(16,185,129,0.14)' : 'rgba(0,0,0,0.3)', border: `1px solid ${open ? 'rgb(16,185,129)' : 'rgba(75,85,99,0.5)'}`,
        fontFamily: 'Inter', fontSize: 11, fontWeight: 600, color: open ? 'rgb(52,211,153)' : ML_INK, whiteSpace: 'nowrap',
      }}>{cur.label}<i className="fa-solid fa-chevron-down" style={{ fontSize: 8, color: ML_DIM }} /></button>
      {open && (
        <div style={{ position: 'absolute', top: 28, ...(alignLeft ? { left: 0 } : { right: 0 }), zIndex: 40, minWidth: 180, padding: 5, maxHeight: 320, overflowY: 'auto', background: 'rgb(17,24,39)', border: '1px solid rgba(75,85,99,0.6)', borderRadius: 8, boxShadow: '0 16px 40px rgba(0,0,0,0.5)' }}>
          {options.map(o => (
            <button key={o.key} onClick={() => { onChange(o.key); setOpen(false); }} style={{
              display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '6px 9px', border: 'none', borderRadius: 6, cursor: 'pointer', textAlign: 'left',
              background: value === o.key ? 'rgba(16,185,129,0.14)' : 'transparent', color: value === o.key ? 'rgb(52,211,153)' : 'rgb(209,213,219)', fontFamily: 'Inter', fontSize: 12, whiteSpace: 'nowrap',
            }}>
              <i className="fa-solid fa-check" style={{ fontSize: 9, opacity: value === o.key ? 1 : 0 }} />
              <span style={{ flex: 1 }}>{o.label}</span>
              {o.l3 && <MlL3Tag />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* Producer / dabbler / prospect split as one thin bar (Level 1 and 2), or the
   segment A / B / C split of the focus list (Level 3). Hovering anywhere on
   it shows the breakdown. */
function MlMixBar({ a, width = 74, seg }) {
  const [tip, setTip] = React.useState(null);
  const at = e => { const z = e.currentTarget.currentCSSZoom || 1; setTip({ x: e.clientX / z, y: e.clientY / z }); };
  const segs = seg
    ? [['Segment A', a.segA, LV_SEG_META.A.dot], ['Segment B', a.segB, LV_SEG_META.B.dot], ['Segment C', a.segC, LV_SEG_META.C.dot]]
    : [['Producers', a.producers, 'rgb(52,211,153)'], ['Dabblers', a.dabblers, 'rgb(251,191,36)'], ['Prospects', a.prospects, 'rgb(100,116,139)']];
  const t = segs.reduce((x, s) => x + s[1], 0) || 1;
  const lead = seg ? a.segA : a.producers;
  return (
    <div onMouseEnter={at} onMouseMove={at} onMouseLeave={() => setTip(null)}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
      <div style={{ display: 'flex', width, height: 6, borderRadius: 3, overflow: 'hidden', background: 'rgba(255,255,255,0.06)' }}>
        {segs.map(s => <div key={s[0]} style={{ width: `${(s[1] / t) * 100}%`, background: s[2] }} />)}
      </div>
      <span style={{ minWidth: 26, textAlign: 'right', color: segs[0][2], fontWeight: 600 }}>{lead.toLocaleString()}</span>
      {tip && (
        <div style={{ position: 'fixed', left: tip.x + 12, top: tip.y + 12, zIndex: 1000, pointerEvents: 'none', padding: '8px 10px', borderRadius: 8, background: 'rgb(17,24,39)', border: '1px solid rgba(75,85,99,0.7)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', gap: 4, textAlign: 'left' }}>
          {segs.map(s => (
            <span key={s[0]} style={{ display: 'flex', alignItems: 'center', gap: 7, fontFamily: 'Inter', fontSize: 11, fontWeight: 400, color: 'rgb(229,231,235)', whiteSpace: 'nowrap' }}>
              <span style={{ width: 7, height: 7, borderRadius: 2, background: s[2] }} />
              <span style={{ flex: 1 }}>{s[0]}</span>
              <b style={{ fontVariantNumeric: 'tabular-nums', marginLeft: 12 }}>{s[1].toLocaleString()}</b>
              <span style={{ color: 'rgb(163,163,163)', minWidth: 30, textAlign: 'right' }}>{Math.round((s[1] / t) * 100)}%</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- team grid: one flat, sortable list of salespeople ---------- */

const ML_SUBC = 'rgb(176,182,192)';
const mlSubS = { fontSize: 10, fontWeight: 400, color: ML_SUBC, marginTop: 2 };
function MlTeamGrid({ rows, ctx, xf, level, onToggle, M, actualLabel }) {
  const [sort, setSort] = React.useState({ k: 'sales', d: -1 });
  const L3 = level >= 3;
  const role = ctx.role;
  const pkShort = ctx.pk === 'Rolling 12' ? 'R12' : ctx.pk;
  const growth = a => (a.prior ? (a.inflow - a.prior) / a.prior : 0);
  const goals = React.useMemo(() => {
    const by = {};
    ML_PEOPLE.filter(p => p.role === role).forEach(p => {
      by[p.name] = mlGoal(ML_ROWS.filter(r => r[role] === p.name && (!xf.region.length || xf.region.includes(r.region))), role, ctx.pk);
    });
    return by;
  }, [role, ctx.pk, xf.region]);
  const people = React.useMemo(() => mlBuckets(rows, 'person', ctx, xf).map(b => {
    const p = ML_PEOPLE.find(x => x.name === b.key) || { regions: [] };
    const g = goals[b.key] || { goal: 0, act: 0, pct: 0 };
    return { ...b, regions: p.regions, goal: g.goal, annual: g.annual, gAct: g.act, gPct: g.pct };
  }), [rows, ctx, xf, goals]);
  const total = { ...mlSum(rows, ctx, xf) };
  total.goal = people.reduce((x, p) => x + p.goal, 0);
  total.annual = people.reduce((x, p) => x + p.annual, 0);
  total.gAct = people.reduce((x, p) => x + p.gAct, 0);
  total.gPct = total.goal ? total.gAct / total.goal : 0;
  const cols = [
    { k: 'region', label: 'Region', v: a => (a.regions ? ML_REGIONS.indexOf(a.regions[0]) : -1), left: true,
      render: a => (a.regions ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 7, height: 7, borderRadius: 2, background: ML_REGION_COLORS[a.regions[0]] }} />{a.regions.map(r => r.replace(/(North|South)(east|west)/, (m, x, y) => x[0] + y[0].toUpperCase()).replace('Midwest', 'MW').replace('West', 'W')).join(' · ')}</span> : '') },
    { k: 'opp', label: 'Mkt opp.', v: a => a.opp, f: v => M.fmt(v) },
    { k: 'yours', label: 'Yours', v: a => a.yours, f: v => M.fmt(v), c: v => (v < 0 ? 'rgb(248,113,113)' : 'rgb(52,211,153)'), b: true },
    { k: 'share', label: 'Mkt share', v: a => Math.abs(mlPct(a.yours, a.opp)), f: v => lvFmtPct(v), end: true, tip: 'Your share of market opportunity' },
    { k: 'sales', label: actualLabel, v: a => a.sales, f: mlFmtK, c: v => (v < 0 ? 'rgb(248,113,113)' : ML_INK), b: true },
    { k: 'growth', label: 'Vs prior', v: a => growth(a), f: v => ML_METRICS.growth.fmt(v), c: v => (v > 0.03 ? 'rgb(52,211,153)' : v < -0.03 ? 'rgb(248,113,113)' : ML_SUBC), end: true, tip: 'Sales growth against the prior period' },
    { k: 'gPct', label: '% to goal', v: a => a.gPct, f: v => `${Math.round(v * 100)}%`, c: v => mlGoalColor(v), b: true, end: true, tip: 'Total sales against the territory goal (annual, prorated by days elapsed)',
      s: a => `of ${mlFmtK(a.goal)}` },
    { k: 'focusN', label: 'Focus / FA/Teams', v: a => a.focusN, f: v => v.toLocaleString(), tip: 'Focus FA/Teams on the covered list' },
    L3
      ? { k: 'segA', label: 'Segments / A · B · C', v: a => a.segA, render: a => <MlMixBar a={a} width={54} seg />, end: true, tip: 'Focus FA/Teams by segment; the figure is Segment A' }
      : { k: 'producers', label: 'Producers', v: a => a.producers, render: a => <MlMixBar a={a} width={54} />, end: true },
    { k: 'acts', label: 'Activities / per focus', v: a => a.acts, f: v => Math.round(v).toLocaleString(),
      s: a => `${mlPct(a.acts, a.focusN).toFixed(1)} / FA` },
    { k: 'coverage', label: 'Covered / engaged', tip: 'Focus FA/Teams with an activity / with engagement', v: a => mlPct(a.covered, a.focusN), f: v => `${Math.round(v * 100)}%`, end: L3,
      s: a => `${Math.round(mlPct(a.engaged, a.focusN) * 100)}% eng.` },
    ...(L3 ? [
      { k: 'sigOpp', label: 'Signal opp. / actioned', v: a => a.sigOpp, f: v => lvFmtM(v), c: () => 'rgb(52,211,153)', l3: true, b: true,
        s: a => `${Math.round(mlPct(a.sigAct, a.sigN) * 100)}% actioned` },
      { k: 'wonK', label: 'Signal won / Seg A cov.', v: a => a.wonK, f: mlFmtK, l3: true,
        s: a => `${Math.round(mlPct(a.segAcov, a.segA) * 100)}% Seg A` },
    ] : []),
  ];
  const col = cols.find(c => c.k === sort.k);
  const list = people.slice().sort(sort.k === 'name' ? (a, b) => a.key.localeCompare(b.key) * sort.d : (a, b) => (col.v(a) - col.v(b)) * sort.d);
  const anySel = xf.person.length > 0;
  const onSort = (k) => setSort(s => (s.k === k ? { k, d: -s.d } : { k, d: k === 'name' || k === 'region' ? 1 : -1 }));
  const caret = (k) => sort.k === k && <i className={`fa-solid fa-caret-${sort.d > 0 ? 'up' : 'down'}`} style={{ marginLeft: 4, fontSize: 9 }} />;

  const thS = (c) => ({
    textAlign: c.left ? 'left' : 'right', padding: '11px 5px 10px', paddingRight: c.end ? 10 : 5, width: '1%', whiteSpace: 'normal', verticalAlign: 'bottom', lineHeight: 1.25,
    fontFamily: 'Inter', fontSize: 9.5, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', cursor: 'pointer', userSelect: 'none',
    color: sort.k === c.k ? 'rgb(52,211,153)' : ML_DIM, position: 'sticky', top: 0, zIndex: 2,
    background: c.l3 ? 'rgb(22,30,50)' : 'rgb(16,26,42)', borderBottom: '1px solid rgba(75,85,99,0.35)',
  });
  const tdS = (c, strong) => ({
    padding: '7px 5px', paddingRight: c.end ? 10 : 5, textAlign: c.left ? 'left' : 'right', whiteSpace: 'nowrap', verticalAlign: 'top', fontFamily: 'Inter', fontSize: strong ? 12 : 11.5,
    fontVariantNumeric: 'tabular-nums', borderBottom: '1px solid rgba(75,85,99,0.16)', background: c.l3 ? ML_L3_BG : undefined,
  });

  return (
    <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 620 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th onClick={() => onSort('name')} style={{ ...thS({ k: 'name', left: true }), padding: '11px 10px 10px 14px' }}>{ML_ROLE_ONE[role]}{caret('name')}</th>
            {cols.map(c => { const [l1, l2] = c.label.split(' / '); return <th key={c.k} title={c.tip} style={thS(c)} onClick={() => onSort(c.k)}><div style={{ whiteSpace: 'nowrap' }}>{l1}{!l2 && caret(c.k)}</div>{l2 && <div style={{ whiteSpace: 'nowrap', fontSize: 8.5, fontWeight: 500, opacity: 0.8, marginTop: 1 }}>{l2}{caret(c.k)}</div>}</th>; })}
          </tr>
        </thead>
        <tbody>
          {list.map(p => {
            const on = xf.person.includes(p.key);
            return (
              <tr key={p.key} className="dp-row" onClick={() => onToggle('person', p.key)} style={{ cursor: 'pointer', background: on ? 'rgba(16,185,129,0.10)' : 'transparent', opacity: anySel && !on ? 0.6 : 1 }}>
                <td style={{ padding: '8px 10px 8px 14px', borderBottom: '1px solid rgba(75,85,99,0.16)', whiteSpace: 'nowrap', fontFamily: 'Inter', fontSize: 12, color: on ? 'rgb(52,211,153)' : ML_INK, fontWeight: on ? 600 : 500 }}>{p.key}</td>
                {cols.map(c => { const v = c.v(p); return <td key={c.k} style={{ ...tdS(c), color: c.c ? c.c(v) : 'rgb(229,231,235)', fontWeight: c.b ? 600 : 400 }}>{c.render ? c.render(p) : c.f(v)}{c.s && <div style={mlSubS}>{c.s(p)}</div>}</td>; })}
              </tr>
            );
          })}
          <tr>
            <td style={{ padding: '10px 10px 10px 14px', fontFamily: 'Inter', fontSize: 12, fontWeight: 700, color: ML_INK, textTransform: 'uppercase', letterSpacing: 0.5, position: 'sticky', bottom: 0, background: 'rgb(18,32,44)' }}>Total</td>
            {cols.map(c => {
              const v = c.v(total);
              return <td key={c.k} style={{ ...tdS(c, true), position: 'sticky', bottom: 0, background: 'rgb(18,32,44)', color: c.c ? c.c(v) : ML_INK, fontWeight: 700 }}>{c.k === 'region' ? `${list.length} ${ML_ROLE_LABEL[role].toLowerCase()}` : c.render ? c.render(total) : c.f(v)}{c.s && c.k !== 'region' && <div style={mlSubS}>{c.s(total)}</div>}</td>;
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

/* Rail to the left of the team grid — one swappable dimension, click to filter. */
function MlDimRail({ level, rowsAll, xf, ctx, M, onToggle }) {
  const keys = ML_XF_KEYS.filter(k => k !== 'person' && (level >= 3 || !ML_DIMS[k].l3));
  const [dim, setDim] = React.useState(() => { try { const v = localStorage.getItem('amp_leadrail'); return keys.includes(v) ? v : 'region'; } catch (e) { return 'region'; } });
  React.useEffect(() => { try { localStorage.setItem('amp_leadrail', dim); } catch (e) {} }, [dim]);
  const k = keys.includes(dim) ? dim : 'region';
  const buckets = React.useMemo(() => mlBuckets(mlFilter(rowsAll, xf, ctx.role, k), k, ctx, { ...xf, [k]: [] }), [rowsAll, xf, ctx, k]);
  const tot = buckets.reduce((a, b) => a + b.sales, 0) || 1;
  const sel = xf[k] || [];
  const items = buckets.map(b => ({ key: b.key, label: b.label, color: b.color, value: b.sales, fmt: mlFmtK(b.sales), on: sel.includes(b.key),
    sub: `${b.n.toLocaleString()} FA/Teams · ${Math.round((b.sales / tot) * 100)}% of sales` }));
  const opts = keys.map(x => ({ key: x, label: ML_DIMS[x].label, l3: ML_DIMS[x].l3 }));
  return <LvRail picker={<MlPicker value={k} options={opts} onChange={setDim} title="Change dimension" />} note={sel.length ? `${sel.length} selected · tap to filter` : 'Tap a value to filter the page'} items={items} onToggle={v => onToggle(k, v)}
    head={ctx.measure === 'AUM' ? 'AUM' : `${ctx.pk === 'Rolling 12' ? 'R12' : ctx.pk} sales`} />;
}

/* ---------- dimension tile ---------- */

function MlDimTile({ dim, onDim, dimOptions, rowsAll, xf, ctx, M, onToggle, visibleRows = 5, pkShort }) {
  const d = ML_DIMS[dim];
  const buckets = React.useMemo(() => {
    const own = mlFilter(rowsAll, xf, ctx.role, dim);
    return mlBuckets(own, dim, ctx, { ...xf, [dim]: [] });
  }, [rowsAll, xf, ctx, dim]);
  const salesTot = buckets.reduce((a, b) => a + b.sales, 0) || 1;
  const maxSales = Math.max(1, ...buckets.map(b => b.sales));
  const scroll = buckets.length > visibleRows;
  const sel = xf[dim] || [];
  const cols = 'minmax(96px,2.2fr) minmax(48px,1fr) minmax(46px,1fr) minmax(36px,0.8fr) minmax(48px,1fr) minmax(32px,0.7fr) minmax(34px,0.7fr) minmax(38px,0.8fr) minmax(34px,0.8fr)';
  const head = { fontFamily: 'Inter', fontSize: 8.5, color: ML_DIM, textAlign: 'right', textTransform: 'uppercase', letterSpacing: 0.4, whiteSpace: 'nowrap' };
  const num = { fontFamily: 'Inter', fontSize: 11, textAlign: 'right', fontVariantNumeric: 'tabular-nums' };
  return (
    <div style={{ background: 'rgba(255,255,255,0.035)', border: `1px solid ${ML_LINE}`, borderRadius: 12, padding: 12, display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <MlPicker value={dim} options={dimOptions} onChange={onDim} title="Change dimension" />
        <span style={{ fontFamily: 'Inter', fontSize: 10, color: ML_DIM, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ctx.measure === 'AUM' ? 'AUM · as of today' : `${ctx.measure} · ${pkShort}`}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: cols, gap: 5, paddingBottom: 5, paddingRight: scroll ? lvScrollbarW() : 0, borderBottom: `1px solid ${ML_LINE}` }}>
        <span /><span style={head}>Mkt opp</span><span style={head}>Yours</span><span style={head}>Share</span>
        <span style={head}>Actual</span><span style={head}>% $</span><span style={head}>Δ</span><span style={head}>FA/T</span><span style={head}>Act</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: scroll ? visibleRows * 27 + (visibleRows - 1) * 4 : undefined, overflowY: scroll ? 'auto' : undefined, overflowX: 'hidden', scrollbarGutter: scroll ? 'stable' : undefined }}>
        {buckets.map(b => {
          const on = sel.includes(b.key);
          const g = b.prior ? (b.inflow - b.prior) / b.prior : 0;
          return (
            <button key={b.key} onClick={() => onToggle(dim, b.key)} style={{
              display: 'grid', gridTemplateColumns: cols, alignItems: 'center', gap: 5, padding: '3px 0', border: 'none', borderRadius: 6, cursor: 'pointer', textAlign: 'left',
              background: on ? 'rgba(16,185,129,0.10)' : 'transparent',
            }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: 'Inter', fontSize: 10.5, fontWeight: on ? 600 : 400, color: on ? 'rgb(52,211,153)' : sel.length ? ML_MUT : 'rgb(209,213,219)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 3 }}>{b.label}</div>
                <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.max(0, (b.sales / maxSales) * 100)}%`, height: '100%', background: b.color, borderRadius: 2 }} />
                </div>
              </div>
              <span style={{ ...num, color: ML_MUT }}>{M.fmt(b.opp)}</span>
              <span style={{ ...num, color: b.yours < 0 ? 'rgb(248,113,113)' : 'rgb(52,211,153)', fontWeight: 600 }}>{M.fmt(b.yours)}</span>
              <span style={{ ...num, color: ML_MUT }}>{b.opp ? lvFmtPct(Math.abs(b.yours / b.opp)) : '—'}</span>
              <span style={{ ...num, color: ML_INK, fontWeight: 600 }}>{mlFmtK(b.sales)}</span>
              <span style={{ ...num, color: ML_DIM }}>{((b.sales / salesTot) * 100).toFixed(0)}%</span>
              <span style={{ ...num, color: g > 0.03 ? 'rgb(52,211,153)' : g < -0.03 ? 'rgb(248,113,113)' : ML_MUT }}>{b.prior ? `${g >= 0 ? '+' : '−'}${Math.abs(g * 100).toFixed(0)}%` : '—'}</span>
              <span style={{ ...num, color: ML_MUT }}>{b.n}</span>
              <span style={{ ...num, color: ML_MUT }}>{Math.round(b.acts)}</span>
            </button>
          );
        })}
        {!buckets.length && <div style={{ fontFamily: 'Inter', fontSize: 11, color: ML_DIM, padding: '14px 0', textAlign: 'center' }}>Nothing in this slice.</div>}
      </div>
    </div>
  );
}

function MlDimTileRow({ level, rowsAll, xf, ctx, M, onToggle, pkShort }) {
  const keys = ML_XF_KEYS.filter(k => level >= 3 || !ML_DIMS[k].l3);
  const options = keys.map(k => ({ key: k, label: k === 'person' ? ML_ROLE_ONE[ctx.role] : ML_DIMS[k].label, l3: ML_DIMS[k].l3 }));
  const defaults = ['region', 'firm', 'vehicle', 'focus'];
  const [picks, setPicks] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem('amp_leaddims4')) || defaults; } catch (e) { return defaults; }
  });
  React.useEffect(() => { try { localStorage.setItem('amp_leaddims4', JSON.stringify(picks)); } catch (e) {} }, [picks]);
  const shown = picks.map(k => (keys.includes(k) ? k : 'prodBand'));
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(max(470px, 40%), 1fr))', gap: 14 }}>
      {shown.map((k, i) => (
        <MlDimTile key={i} dim={k} onDim={v => setPicks(p => p.map((x, j) => (j === i ? v : x)))} dimOptions={options}
          rowsAll={rowsAll} xf={xf} ctx={ctx} M={M} onToggle={onToggle} pkShort={pkShort} />
      ))}
    </div>
  );
}

/* ---------- heatmap: salesperson × dimension ---------- */

/* Five-stop ramp (red → amber → green) for the scorecard and heatmap, fed a
   0..1 percentile rank so every column spreads across the full range. */
const ML_RAMP = [[239, 68, 68], [249, 115, 22], [234, 179, 8], [132, 204, 22], [16, 185, 129]];
function mlRamp(t) {
  const x = Math.max(0, Math.min(1, t)) * (ML_RAMP.length - 1);
  const i = Math.min(ML_RAMP.length - 2, Math.floor(x)), f = x - i;
  const c = ML_RAMP[i].map((v, j) => Math.round(v + (ML_RAMP[i + 1][j] - v) * f));
  return `rgba(${c[0]},${c[1]},${c[2]},0.5)`;
}
function mlRank(vals) {
  const s = vals.slice().sort((a, b) => a - b);
  return v => { if (s.length < 2) return 0.5; let lo = 0; while (lo < s.length && s[lo] < v) lo++; let hi = lo; while (hi < s.length && s[hi] === v) hi++; return ((lo + hi - 1) / 2) / (s.length - 1); };
}

const ML_HEAT_DIMS = ['vehicle', 'cat', 'channel', 'prodBand', 'prodCat', 'firm', 'product', 'segment'];

function MlHeatmap({ rowsAll, xf, ctx, M, level, onPick, modeSwitch }) {
  const [dim, setDim] = React.useState('vehicle');
  const [metric, setMetric] = React.useState('share');
  const L3 = level >= 3;
  const dimKey = !L3 && ML_DIMS[dim].l3 ? 'vehicle' : dim;
  const metKey = !L3 && ML_METRICS[metric].l3 ? 'share' : metric;
  const met = ML_METRICS[metKey];
  const role = ctx.role;

  const data = React.useMemo(() => {
    const base = mlFilter(rowsAll, { ...xf, person: [], [dimKey]: [] }, role);
    const bxf = { ...xf, [dimKey]: [] };
    let colKeys = mlBuckets(base, dimKey, ctx, bxf).map(b => ({ key: b.key, label: b.label }));
    if (!ML_DIMS[dimKey].order) colKeys = colKeys.slice(0, 9);
    const people = ML_PEOPLE.filter(p => p.role === role);
    const lines = people.map(p => {
      const pr = base.filter(r => r[role] === p.name);
      const by = {};
      mlBuckets(pr, dimKey, ctx, bxf).forEach(b => (by[b.key] = b));
      return { p, total: mlSum(pr, ctx, bxf), by };
    }).filter(l => l.total.n);
    const vals = [];
    lines.forEach(l => colKeys.forEach(c => { const b = l.by[c.key]; if (b && b.n) vals.push(met.get(b, M)); }));
    return { colKeys, lines, rank: mlRank(vals), min: Math.min(...vals, 0), max: Math.max(...vals, 0.0001), abs: Math.max(0.0001, ...vals.map(Math.abs)) };
  }, [rowsAll, xf, ctx, dimKey, metKey, role]);

  const cellBg = (v) => mlRamp(data.rank(v));
  const cols = `160px repeat(${data.colKeys.length}, minmax(62px,1fr)) 76px`;
  const dimOpts = ML_HEAT_DIMS.filter(k => L3 || !ML_DIMS[k].l3).map(k => ({ key: k, label: ML_DIMS[k].label, l3: ML_DIMS[k].l3 }));
  const metOpts = Object.keys(ML_METRICS).filter(k => L3 || !ML_METRICS[k].l3).map(k => ({ key: k, label: ML_METRICS[k].label, l3: ML_METRICS[k].l3 }));
  let lastRegion = null;

  return (
    <Tile title={`${ML_ROLE_LABEL[role]} heatmap`}
      subtitle={`${met.label} by ${ML_ROLE_ONE[role].toLowerCase()} and ${ML_DIMS[dimKey].label.toLowerCase()} · click a cell to filter`}
      right={<div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        {modeSwitch}
        <span style={{ fontFamily: 'Inter', fontSize: 10, color: ML_DIM }}>Show</span>
        <MlPicker value={metKey} options={metOpts} onChange={setMetric} title="Metric" />
        <span style={{ fontFamily: 'Inter', fontSize: 10, color: ML_DIM }}>by</span>
        <MlPicker value={dimKey} options={dimOpts} onChange={setDim} title="Columns" />
      </div>}>
      <div style={{ overflowX: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: cols, gap: 3, minWidth: 160 + data.colKeys.length * 62 + 76 }}>
          <span />
          {data.colKeys.map(c => <div key={c.key} title={c.label} style={{ fontFamily: 'Inter', fontSize: 9.5, fontWeight: 600, color: ML_DIM, textAlign: 'center', padding: '0 2px 6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.label}</div>)}
          <div style={{ fontFamily: 'Inter', fontSize: 9.5, fontWeight: 700, color: ML_MUT, textAlign: 'center', paddingBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4 }}>All</div>
          {data.lines.map(l => {
            const rg = l.p.regions.join(' · ');
            const first = rg !== lastRegion; lastRegion = rg;
            const pOn = xf.person.includes(l.p.name);
            return (
              <React.Fragment key={l.p.name}>
                <button onClick={() => onPick(l.p.name)} style={{
                  display: 'flex', alignItems: 'center', gap: 7, minWidth: 0, padding: '0 6px', height: 30, border: 'none', borderRadius: 5, cursor: 'pointer', textAlign: 'left',
                  background: pOn ? 'rgba(16,185,129,0.12)' : 'transparent', borderTop: first ? '1px solid rgba(75,85,99,0.25)' : 'none',
                }}>
                  <span style={{ width: 3, alignSelf: 'stretch', margin: '5px 0', borderRadius: 2, background: ML_REGION_COLORS[l.p.regions[0]] }} />
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: 'block', fontFamily: 'Inter', fontSize: 11.5, fontWeight: pOn ? 600 : 500, color: pOn ? 'rgb(52,211,153)' : ML_INK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.p.name}</span>
                    {first && <span style={{ display: 'block', fontFamily: 'Inter', fontSize: 9, color: ML_DIM, whiteSpace: 'nowrap' }}>{rg}</span>}
                  </span>
                </button>
                {data.colKeys.map(c => {
                  const b = l.by[c.key];
                  const has = b && b.n;
                  const v = has ? met.get(b, M) : null;
                  const on = pOn && (xf[dimKey] || []).includes(c.key);
                  return (
                    <button key={c.key} disabled={!has} onClick={() => onPick(l.p.name, dimKey, c.key)}
                      title={has ? `${l.p.name} · ${c.label}\n${met.label}: ${met.fmt(v, M)}\n${b.n} FA/Teams` : 'No FA/Teams'}
                      style={{
                        height: 30, border: on ? '1px solid rgb(52,211,153)' : '1px solid transparent', borderRadius: 5, cursor: has ? 'pointer' : 'default',
                        background: has ? cellBg(v) : 'rgba(255,255,255,0.02)', color: has ? ML_INK : ML_DIM,
                        fontFamily: 'Inter', fontSize: 10.5, fontWeight: 500, fontVariantNumeric: 'tabular-nums', marginTop: first ? 1 : 0,
                      }}>{has ? met.fmt(v, M) : '—'}</button>
                  );
                })}
                <div style={{ height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 5, background: 'rgba(255,255,255,0.04)', fontFamily: 'Inter', fontSize: 10.5, fontWeight: 700, color: ML_INK, fontVariantNumeric: 'tabular-nums' }}>
                  {met.fmt(met.get(l.total, M), M)}
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </Tile>
  );
}

Object.assign(window, { MlDimRail, MlL3Tag, MlPicker, MlMixBar, MlTeamGrid, MlDimTile, MlDimTileRow, MlHeatmap });

/* ---------- scorecard: salesperson × key metrics ---------- */

const ML_SCORE_COLS = [
  { k: 'goal', label: '% to goal', fmt: v => `${Math.round(v * 100)}%`, tip: 'Total sales against the territory sales goal' },
  { k: 'share', label: 'Mkt share', fmt: v => lvFmtPct(v), tip: 'Your share of market opportunity' },
  { k: 'xsell', label: 'Cross-sell', fmt: v => v.toFixed(2), tip: 'Average products held per producing FA/Team' },
  { k: 'focus', label: 'Focus product mix', fmt: v => `${Math.round(v * 100)}%`, tip: 'Share of total sales (all products) from focus products' },
  { k: 'client', label: 'Focus client mix', fmt: v => `${Math.round(v * 100)}%`, tip: 'Share of total sales from the focus FA/Teams the salesperson covers' },
  { k: 'multi', label: 'Multi-product', fmt: v => `${Math.round(v * 100)}%`, tip: 'Producing FA/Teams with 2+ products' },
  { k: 'conv', label: 'Signal conv.', fmt: v => `${Math.round(v * 100)}%`, tip: 'Signals won ÷ signals surfaced', l3: true },
];

function mlScoreOf(rows, goalRows, ctx, fullRows) {
  const a = mlSum(rows, ctx);
  // Focus mix and client mix read the full book (all products), like goals.
  const full = fullRows || rows;
  const sales = full.map(r => r.sales[ctx.pk] || 0);
  const st = sales.reduce((x, v) => x + v, 0) || 1;
  const top = full.reduce((x, r) => x + (r.focus ? r.sales[ctx.pk] || 0 : 0), 0);
  const prod = rows.filter(r => r.nProd > 0);
  const pc = prod.reduce((x, r) => x + (r.count || 1), 0);
  const fs = full.reduce((x, r) => x + (r.sales[ctx.pk] || 0) * r.mix.reduce((y, h) => y + (h.focus !== 'Non-focus' ? h.w : 0), 0), 0);
  return {
    goal: mlGoal(goalRows, ctx.role, ctx.pk).pct,
    share: mlPct(a.yours, a.opp),
    xsell: pc ? prod.reduce((x, r) => x + r.nProd * (r.count || 1), 0) / pc : 0,
    focus: fs / st, client: top / st,
    multi: pc ? prod.reduce((x, r) => x + (r.count > 1 ? r.count * Math.max(0, r.nProd - 1) : r.nProd >= 2 ? 1 : 0), 0) / pc : 0,
    conv: mlPct(a.sigWon, a.sigN),
  };
}

function MlScorecard({ rowsAll, xf, ctx, level, onPick, modeSwitch }) {
  const L3 = level >= 3;
  const role = ctx.role;
  const cols = ML_SCORE_COLS.filter(c => L3 || !c.l3);
  const [sort, setSort] = React.useState({ k: 'goal', d: -1 });
  const lines = React.useMemo(() => {
    const base = mlFilter(rowsAll, { ...xf, person: [] }, role);
    const full = mlFilter(ML_ROWS, { ...xf, person: [] }, role);
    return ML_PEOPLE.filter(p => p.role === role).map(p => {
      const rr = base.filter(r => r[role] === p.name);
      const gr = ML_ROWS.filter(r => r[role] === p.name && (!xf.region.length || xf.region.includes(r.region)));
      return { p, n: rr.length, v: rr.length ? mlScoreOf(rr, gr, ctx, full.filter(r => r[role] === p.name)) : null };
    }).filter(l => l.v);
  }, [rowsAll, xf, ctx, role]);
  const total = React.useMemo(() => {
    const base = mlFilter(rowsAll, { ...xf, person: [] }, role);
    return mlScoreOf(base, ML_ROWS.filter(r => !xf.region.length || xf.region.includes(r.region)), ctx, mlFilter(ML_ROWS, { ...xf, person: [] }, role));
  }, [rowsAll, xf, ctx, role]);
  const rng = {};
  cols.forEach(c => { rng[c.k] = mlRank(lines.map(l => l.v[c.k])); });
  const bg = (c, v) => {
    // % to goal reads against 100%: 70% or less is the red end, 130%+ the green end.
    if (c.k === 'goal') return mlRamp((v - 0.7) / 0.6);
    let t = rng[c.k](v); if (c.invert) t = 1 - t;
    return mlRamp(t);
  };
  const list = lines.slice().sort((a, b) => (sort.k === 'name' ? a.p.name.localeCompare(b.p.name) : a.v[sort.k] - b.v[sort.k]) * sort.d);
  const grid = `minmax(130px,170px) repeat(${cols.length}, minmax(52px,1fr))`;
  const head = (k, label, tip, left) => (
    <button key={k} title={tip} onClick={() => setSort(s => (s.k === k ? { k, d: -s.d } : { k, d: k === 'name' ? 1 : -1 }))} style={{
      border: 'none', background: 'transparent', cursor: 'pointer', padding: '0 4px 6px', textAlign: left ? 'left' : 'center',
      fontFamily: 'Inter', fontSize: 9.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4, color: sort.k === k ? 'rgb(52,211,153)' : ML_DIM, whiteSpace: 'normal', lineHeight: 1.25, alignSelf: 'end',
    }}>{label}{sort.k === k && <i className={`fa-solid fa-caret-${sort.d > 0 ? 'up' : 'down'}`} style={{ marginLeft: 4, fontSize: 9 }} />}</button>
  );
  return (
    <Tile title={`${ML_ROLE_ONE[role]} scorecard`} subtitle={`${ctx.pk === 'Rolling 12' ? 'R12' : ctx.pk} · click a name to filter · shading ranks each column`} right={modeSwitch}>
      <div style={{ overflowX: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: grid, gap: 3 }}>
          {head('name', ML_ROLE_ONE[role], null, true)}
          {cols.map(c => head(c.k, c.label, c.tip))}
          {list.map(l => {
            const on = xf.person.includes(l.p.name);
            return (
              <React.Fragment key={l.p.name}>
                <button onClick={() => onPick(l.p.name)} style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0, padding: '0 6px', height: 30, border: 'none', borderRadius: 5, cursor: 'pointer', textAlign: 'left', background: on ? 'rgba(16,185,129,0.12)' : 'transparent' }}>
                  <span style={{ width: 3, alignSelf: 'stretch', margin: '5px 0', borderRadius: 2, background: ML_REGION_COLORS[l.p.regions[0]] }} />
                  <span style={{ fontFamily: 'Inter', fontSize: 11.5, fontWeight: on ? 600 : 500, color: on ? 'rgb(52,211,153)' : ML_INK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.p.name}</span>
                  <span style={{ fontFamily: 'Inter', fontSize: 9.5, color: ML_DIM, whiteSpace: 'nowrap' }}>{l.p.regions.map(r => r.replace(/(North|South)(east|west)/, (m, a, b) => a[0] + b[0].toUpperCase()).replace('Midwest', 'MW').replace('West', 'W')).join('·')}</span>
                </button>
                {cols.map(c => (
                  <div key={c.k} title={`${l.p.name} · ${c.label}: ${c.fmt(l.v[c.k])}`} style={{ height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 5, background: bg(c, l.v[c.k]), fontFamily: 'Inter', fontSize: 11, fontWeight: 500, color: ML_INK, fontVariantNumeric: 'tabular-nums' }}>{c.fmt(l.v[c.k])}</div>
                ))}
              </React.Fragment>
            );
          })}
          <div style={{ display: 'flex', alignItems: 'center', padding: '0 12px', height: 32, fontFamily: 'Inter', fontSize: 11, fontWeight: 700, color: ML_INK, textTransform: 'uppercase', letterSpacing: 0.5 }}>Total</div>
          {cols.map(c => <div key={c.k} style={{ height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 5, background: 'rgba(255,255,255,0.05)', fontFamily: 'Inter', fontSize: 11, fontWeight: 700, color: ML_INK, fontVariantNumeric: 'tabular-nums' }}>{c.fmt(total[c.k])}</div>)}
        </div>
      </div>
    </Tile>
  );
}

function MlPeopleBoard(props) {
  const [mode, setMode] = React.useState('Scorecard');
  const sw = <TabPills options={['Scorecard', 'Heatmap']} value={mode} onChange={setMode} />;
  return mode === 'Scorecard' ? <MlScorecard {...props} modeSwitch={sw} /> : <MlHeatmap {...props} modeSwitch={sw} />;
}

Object.assign(window, { MlScorecard, MlPeopleBoard });
