/* Sales Leadership — grid, dimension tiles and heatmap. */

const ML_INK = 'rgb(249,250,251)';
const ML_MUT = 'rgb(163,163,163)';
const ML_DIM = 'rgb(107,114,128)';
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
  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <button onClick={() => setOpen(o => !o)} title={title} style={{
        display: 'inline-flex', alignItems: 'center', gap: 6, height: 24, padding: '0 9px', borderRadius: 6, cursor: 'pointer',
        background: open ? 'rgba(16,185,129,0.14)' : 'rgba(0,0,0,0.3)', border: `1px solid ${open ? 'rgb(16,185,129)' : 'rgba(75,85,99,0.5)'}`,
        fontFamily: 'Inter', fontSize: 11, fontWeight: 600, color: open ? 'rgb(52,211,153)' : ML_INK, whiteSpace: 'nowrap',
      }}>{cur.label}<i className="fa-solid fa-chevron-down" style={{ fontSize: 8, color: ML_DIM }} /></button>
      {open && (
        <div style={{ position: 'absolute', top: 28, right: 0, zIndex: 40, minWidth: 180, padding: 5, maxHeight: 320, overflowY: 'auto', background: 'rgb(17,24,39)', border: '1px solid rgba(75,85,99,0.6)', borderRadius: 8, boxShadow: '0 16px 40px rgba(0,0,0,0.5)' }}>
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

/* Producer / dabbler / prospect split as one thin bar. */
function MlMixBar({ a, width = 74 }) {
  const t = a.n || 1;
  const seg = [['Producer', a.producers, 'rgb(52,211,153)'], ['Dabbler', a.dabblers, 'rgb(251,191,36)'], ['Prospect', a.prospects, 'rgb(100,116,139)']];
  return (
    <div title={seg.map(s => `${s[0]} ${s[1]}`).join(' · ')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
      <div style={{ display: 'flex', width, height: 6, borderRadius: 3, overflow: 'hidden', background: 'rgba(255,255,255,0.06)' }}>
        {seg.map(s => <div key={s[0]} style={{ width: `${(s[1] / t) * 100}%`, background: s[2] }} />)}
      </div>
      <span style={{ minWidth: 26, textAlign: 'right', color: 'rgb(52,211,153)', fontWeight: 600 }}>{a.producers}</span>
    </div>
  );
}

/* ---------- team grid: regions, expandable to salespeople ---------- */

function MlTeamGrid({ rows, ctx, xf, level, onToggle, M, actualLabel }) {
  const [open, setOpen] = React.useState(() => new Set(ML_REGIONS));
  const [sort, setSort] = React.useState({ k: 'sales', d: -1 });
  const L3 = level >= 3;
  const growth = a => (a.prior ? (a.inflow - a.prior) / a.prior : 0);
  const cols = [
    { k: 'opp', label: 'Mkt opp.', v: a => a.opp, f: v => M.fmt(v) },
    { k: 'yours', label: 'Yours', v: a => a.yours, f: v => M.fmt(v), c: v => (v < 0 ? 'rgb(248,113,113)' : 'rgb(52,211,153)'), b: true },
    { k: 'share', label: 'Share', v: a => mlPct(a.yours, a.opp), f: v => lvFmtPct(Math.abs(v)), end: true },
    { k: 'sales', label: actualLabel, v: a => a.sales, f: mlFmtK, c: v => (v < 0 ? 'rgb(248,113,113)' : ML_INK), b: true },
    { k: 'growth', label: 'vs prior', v: growth, f: ML_METRICS.growth.fmt, c: v => (v > 0.03 ? 'rgb(52,211,153)' : v < -0.03 ? 'rgb(248,113,113)' : ML_MUT), end: true },
    { k: 'n', label: 'FA/Teams', v: a => a.n, f: v => v.toLocaleString() },
    { k: 'producers', label: 'Producers', v: a => a.producers, render: a => <MlMixBar a={a} /> },
    { k: 'prospects', label: 'Prospects', v: a => a.prospects, f: v => v.toLocaleString(), c: () => ML_MUT, end: true },
    { k: 'acts', label: 'Activities', v: a => a.acts, f: v => Math.round(v).toLocaleString() },
    { k: 'perFA', label: 'Act / FA', v: a => mlPct(a.acts, a.n), f: v => v.toFixed(1) },
    { k: 'coverage', label: 'Covered', v: a => mlPct(a.covered, a.n), f: v => `${Math.round(v * 100)}%` },
    { k: 'engaged', label: 'Engaged', v: a => mlPct(a.engaged, a.n), f: v => `${Math.round(v * 100)}%`, end: L3 },
    ...(L3 ? [
      { k: 'sigOpp', label: 'Signal opp.', v: a => a.sigOpp, f: v => lvFmtM(v), c: () => 'rgb(52,211,153)', l3: true, b: true },
      { k: 'actioned', label: 'Actioned', v: a => mlPct(a.sigAct, a.sigN), f: v => `${Math.round(v * 100)}%`, l3: true },
      { k: 'wonK', label: 'Signal won', v: a => a.wonK, f: mlFmtK, l3: true },
      { k: 'segAcov', label: 'Seg A cov.', v: a => mlPct(a.segAcov, a.segA), f: v => `${Math.round(v * 100)}%`, l3: true },
    ] : []),
  ];
  const col = cols.find(c => c.k === sort.k) || cols[3];
  const sortFn = (a, b) => (col.v(a) - col.v(b)) * sort.d;

  const groups = ML_REGIONS.map(rg => {
    const rr = rows.filter(r => r.region === rg);
    return { key: rg, agg: mlSum(rr, ctx, xf), people: mlBuckets(rr, 'person', ctx, xf).sort(sortFn) };
  }).filter(g => g.agg.n).sort((a, b) => sortFn(a.agg, b.agg));
  const total = mlSum(rows, ctx, xf);
  const anySel = xf.region.length || xf.person.length;

  const thS = (c) => ({
    textAlign: 'right', padding: '11px 6px 10px', paddingRight: c.end ? 14 : 6, width: '1%', whiteSpace: 'nowrap',
    fontFamily: 'Inter', fontSize: 9.5, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', cursor: 'pointer', userSelect: 'none',
    color: sort.k === c.k ? 'rgb(52,211,153)' : ML_DIM, position: 'sticky', top: 0, zIndex: 2,
    background: c.l3 ? 'rgb(22,30,50)' : 'rgb(16,26,42)', borderBottom: '1px solid rgba(75,85,99,0.35)',
  });
  const tdS = (c, strong) => ({
    padding: '8px 6px', paddingRight: c.end ? 14 : 6, textAlign: 'right', whiteSpace: 'nowrap', fontFamily: 'Inter', fontSize: strong ? 12 : 11.5,
    fontVariantNumeric: 'tabular-nums', borderBottom: '1px solid rgba(75,85,99,0.16)', background: c.l3 ? ML_L3_BG : undefined,
  });
  const cells = (a, strong) => cols.map(c => {
    const v = c.v(a);
    return (
      <td key={c.k} style={{ ...tdS(c, strong), color: c.c ? c.c(v) : 'rgb(229,231,235)', fontWeight: c.b || strong ? 600 : 400 }}>
        {c.render ? c.render(a) : c.f(v)}
      </td>
    );
  });

  return (
    <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 620 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ ...thS({}), textAlign: 'left', width: 'auto', padding: '11px 10px 10px 14px', cursor: 'default', color: ML_DIM }}>
              Region / {ML_ROLE_ONE[ctx.role]}
            </th>
            {cols.map(c => (
              <th key={c.k} style={thS(c)} onClick={() => setSort(s => (s.k === c.k ? { k: c.k, d: -s.d } : { k: c.k, d: -1 }))}>
                {c.label}{sort.k === c.k && <i className={`fa-solid fa-caret-${sort.d > 0 ? 'up' : 'down'}`} style={{ marginLeft: 4, fontSize: 9 }} />}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {groups.map(g => {
            const isOpen = open.has(g.key);
            const on = xf.region.includes(g.key);
            return (
              <React.Fragment key={g.key}>
                <tr className="dp-row" onClick={() => onToggle('region', g.key)} style={{ cursor: 'pointer', background: on ? 'rgba(16,185,129,0.10)' : 'rgba(255,255,255,0.025)', opacity: anySel && !on && !g.people.some(p => xf.person.includes(p.key)) ? 0.6 : 1 }}>
                  <td style={{ padding: '9px 10px 9px 14px', borderBottom: '1px solid rgba(75,85,99,0.22)', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button onClick={e => { e.stopPropagation(); setOpen(s => { const n = new Set(s); n.has(g.key) ? n.delete(g.key) : n.add(g.key); return n; }); }}
                        style={{ width: 18, height: 18, border: 'none', background: 'transparent', cursor: 'pointer', color: ML_DIM, padding: 0 }}>
                        <i className={`fa-solid fa-chevron-${isOpen ? 'down' : 'right'}`} style={{ fontSize: 9 }} />
                      </button>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: ML_REGION_COLORS[g.key] }} />
                      <span style={{ fontFamily: 'Inter', fontSize: 12.5, fontWeight: 600, color: on ? 'rgb(52,211,153)' : ML_INK }}>{g.key}</span>
                      <span style={{ fontFamily: 'Inter', fontSize: 10, color: ML_DIM }}>{g.people.length} {g.people.length === 1 ? ML_ROLE_ONE[ctx.role].toLowerCase() : ML_ROLE_LABEL[ctx.role].toLowerCase()}</span>
                    </div>
                  </td>
                  {cells(g.agg, true)}
                </tr>
                {isOpen && g.people.map(p => {
                  const pon = xf.person.includes(p.key);
                  return (
                    <tr key={p.key} className="dp-row" onClick={() => onToggle('person', p.key)} style={{ cursor: 'pointer', background: pon ? 'rgba(16,185,129,0.09)' : 'transparent', opacity: anySel && !pon && !on ? 0.6 : 1 }}>
                      <td style={{ padding: '8px 10px 8px 48px', borderBottom: '1px solid rgba(75,85,99,0.16)', whiteSpace: 'nowrap', fontFamily: 'Inter', fontSize: 12, color: pon ? 'rgb(52,211,153)' : 'rgb(229,231,235)', fontWeight: pon ? 600 : 400 }}>
                        {p.key}
                        {ctx.role === 'spec' && <span style={{ marginLeft: 6, fontSize: 10, color: ML_DIM }}>{(ML_SPECS.find(s => s.name === p.key) || { regions: [] }).regions.length > 1 ? 'multi-region' : ''}</span>}
                      </td>
                      {cells(p)}
                    </tr>
                  );
                })}
              </React.Fragment>
            );
          })}
          <tr style={{ background: 'rgba(16,185,129,0.05)' }}>
            <td style={{ padding: '10px 10px 10px 14px', fontFamily: 'Inter', fontSize: 12, fontWeight: 700, color: ML_INK, textTransform: 'uppercase', letterSpacing: 0.5, position: 'sticky', bottom: 0, background: 'rgb(18,32,44)' }}>Total</td>
            {cols.map(c => {
              const v = c.v(total);
              return <td key={c.k} style={{ ...tdS(c, true), position: 'sticky', bottom: 0, background: 'rgb(18,32,44)', color: c.c ? c.c(v) : ML_INK, fontWeight: 700 }}>{c.render ? c.render(total) : c.f(v)}</td>;
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
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
  const cols = 'minmax(96px,1fr) 48px 46px 36px 48px 32px 34px 38px 34px';
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
  const defaults = ['region', 'person', 'firm', 'vehicle', 'cat', 'product'];
  const [picks, setPicks] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem('amp_leaddims')) || defaults; } catch (e) { return defaults; }
  });
  React.useEffect(() => { try { localStorage.setItem('amp_leaddims', JSON.stringify(picks)); } catch (e) {} }, [picks]);
  const shown = picks.map(k => (keys.includes(k) ? k : 'prodBand'));
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(max(470px, 30%), 1fr))', gap: 14 }}>
      {shown.map((k, i) => (
        <MlDimTile key={i} dim={k} onDim={v => setPicks(p => p.map((x, j) => (j === i ? v : x)))} dimOptions={options}
          rowsAll={rowsAll} xf={xf} ctx={ctx} M={M} onToggle={onToggle} pkShort={pkShort} />
      ))}
    </div>
  );
}

/* ---------- heatmap: salesperson × dimension ---------- */

const ML_HEAT_DIMS = ['vehicle', 'cat', 'channel', 'prodBand', 'prodCat', 'firm', 'product', 'segment'];

function MlHeatmap({ rowsAll, xf, ctx, M, level, onPick }) {
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
    return { colKeys, lines, min: Math.min(...vals, 0), max: Math.max(...vals, 0.0001), abs: Math.max(0.0001, ...vals.map(Math.abs)) };
  }, [rowsAll, xf, ctx, dimKey, metKey, role]);

  const cellBg = (v) => {
    if (met.diverge) {
      const t = Math.min(1, Math.abs(v) / data.abs);
      return v >= 0 ? `rgba(16,185,129,${0.08 + t * 0.6})` : `rgba(248,113,113,${0.08 + t * 0.55})`;
    }
    const t = data.max > data.min ? (v - data.min) / (data.max - data.min) : 0;
    return `rgba(16,185,129,${0.06 + t * 0.64})`;
  };
  const cols = `160px repeat(${data.colKeys.length}, minmax(62px,1fr)) 76px`;
  const dimOpts = ML_HEAT_DIMS.filter(k => L3 || !ML_DIMS[k].l3).map(k => ({ key: k, label: ML_DIMS[k].label, l3: ML_DIMS[k].l3 }));
  const metOpts = Object.keys(ML_METRICS).filter(k => L3 || !ML_METRICS[k].l3).map(k => ({ key: k, label: ML_METRICS[k].label, l3: ML_METRICS[k].l3 }));
  let lastRegion = null;

  return (
    <Tile title={`${ML_ROLE_LABEL[role]} heatmap`}
      subtitle={`${met.label} by ${ML_ROLE_ONE[role].toLowerCase()} and ${ML_DIMS[dimKey].label.toLowerCase()} · click a cell to filter`}
      right={<div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
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

Object.assign(window, { MlL3Tag, MlPicker, MlMixBar, MlTeamGrid, MlDimTile, MlDimTileRow, MlHeatmap });
