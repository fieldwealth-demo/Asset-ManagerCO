/* Data Explorer — pivot-style analysis on the unified egress feed.
   Fields panel → layout zones → formula bar → grid → status bar. */

const EX_STORE = 'amp_explorer_v1';
const EX_ZONES = [
  { id: 'filters', label: 'Filters', icon: 'filter', accepts: 'dim' },
  { id: 'cols', label: 'Columns', icon: 'table-columns', accepts: 'dim', max: 2 },
  { id: 'rows', label: 'Rows', icon: 'table-list', accepts: 'dim' },
  { id: 'values', label: 'Values', icon: 'calculator', accepts: 'measure' },
];
const EX_AGG_LABEL = { sum: 'Σ', last: 'latest', ratio: 'ratio', wavg: 'w-avg', count: '#', countd: '#d', faAvg: 'avg', faMin: 'min', faMonth: 'Σ', sig: 'sig', top3: 'top 3', calc: 'fx' };

function exLoad() { try { return JSON.parse(localStorage.getItem(EX_STORE)); } catch (e) { return null; } }

function DataExplorerPage({ level = 3 }) {
  const saved = exLoad();
  const [cfg, setCfgRaw] = React.useState(() => (saved && saved.cfg) || JSON.parse(JSON.stringify(EX_PRESETS[0].cfg)));
  const [view, setView] = React.useState(() => (saved && saved.view) || EX_PRESETS[0].id);
  const [openSet, setOpenSet] = React.useState(() => new Set());
  const [expandAll, setExpandAll] = React.useState(false);
  const [selected, setSelected] = React.useState(null);
  const [fa, setFa] = React.useState(null);
  const [sqlOpen, setSqlOpen] = React.useState(false);
  const [menu, setMenu] = React.useState(null); // 'export' | 'views'
  const [filterPop, setFilterPop] = React.useState(null);
  const [editCalc, setEditCalc] = React.useState(null);
  const [toast, setToast] = React.useState(null);
  const [running, setRunning] = React.useState(false);
  const [stats, setStats] = React.useState({ ms: 412, at: new Date() });
  const [gridTheme, setGridTheme] = React.useState(() => { try { return localStorage.getItem('amp_explorer_theme') || 'light'; } catch (e) { return 'light'; } });
  React.useEffect(() => { try { localStorage.setItem('amp_explorer_theme', gridTheme); } catch (e) {} }, [gridTheme]);
  const [fieldsOpen, setFieldsOpen] = React.useState(() => window.innerWidth > 1180);
  React.useEffect(() => { try { localStorage.setItem(EX_STORE, JSON.stringify({ cfg, view })); } catch (e) {} }, [cfg, view]);
  const setCfg = (fn, keepView) => { setCfgRaw(c => (typeof fn === 'function' ? fn(c) : fn)); if (!keepView) setView('custom'); setSelected(null); };

  const F = React.useMemo(() => exFieldMap(cfg.calc), [cfg.calc]);
  const locked = f => f && (f.level || 1) > level;
  const eff = React.useMemo(() => {
    const ok = id => F[id] && !locked(F[id]);
    return { ...cfg, rows: cfg.rows.filter(ok), cols: cfg.cols.filter(ok), values: cfg.values.filter(ok), filters: Object.fromEntries(Object.entries(cfg.filters || {}).filter(([k]) => ok(k))) };
  }, [cfg, F, level]);
  const p = React.useMemo(() => exPivot(EX_DATA.rows, eff, F), [eff, F]);
  const conf = React.useMemo(() => exQueryConfidence(p), [p]);

  const qKey = JSON.stringify([eff.rows, eff.cols, eff.values, eff.filters, cfg.calc]);
  React.useEffect(() => {
    setRunning(true);
    const ms = 240 + Math.round(Math.random() * 380 + p.rows.length / 40);
    const t = setTimeout(() => { setRunning(false); setStats({ ms, at: new Date() }); }, Math.min(ms, 700));
    return () => clearTimeout(t);
  }, [qKey]);

  const isOpen = id => (expandAll ? !openSet.has(id) : openSet.has(id));
  const toggle = id => setOpenSet(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const setExpand = all => { setExpandAll(all); setOpenSet(new Set()); };
  const setSort = key => setCfg(c => ({ ...c, sort: c.sort && c.sort.col === key ? (c.sort.dir < 0 ? { col: key, dir: 1 } : null) : { col: key, dir: key === '__label' ? 1 : -1 } }), true);

  const applyPreset = pr => { setCfgRaw(c => ({ ...JSON.parse(JSON.stringify(pr.cfg)), calc: c.calc || [] })); setView(pr.id); setMenu(null); setExpand(false); setSelected(null); };

  const addTo = (zone, id, at) => setCfg(c => {
    const f = F[id]; if (!f || locked(f)) return c;
    const z = EX_ZONES.find(x => x.id === zone);
    if (z.accepts !== f.kind) return c;
    if (zone === 'filters') { if (c.filters[id]) return c; setTimeout(() => setFilterPop({ id }), 0); return { ...c, filters: { ...c.filters, [id]: [] } }; }
    const strip = k => c[k].filter(x => x !== id);
    const next = { ...c, rows: strip('rows'), cols: strip('cols'), values: strip('values') };
    const arr = [...next[zone]];
    if (z.max && arr.length >= z.max) return c;
    arr.splice(at == null ? arr.length : at, 0, id);
    next[zone] = arr;
    return next;
  });
  const removeFrom = (zone, id) => setCfg(c => {
    if (zone === 'filters') { const fl = { ...c.filters }; delete fl[id]; return { ...c, filters: fl }; }
    return { ...c, [zone]: c[zone].filter(x => x !== id), sort: c.sort && c.sort.col.startsWith(id + '|') ? null : c.sort };
  });
  const quickAdd = f => { if (f.kind === 'measure') addTo('values', f.id); else addTo(cfg.rows.length < 3 ? 'rows' : 'cols', f.id); };

  const saveCalc = c => setCfg(cf => {
    const exists = (cf.calc || []).some(x => x.id === c.id);
    const calc = exists ? cf.calc.map(x => (x.id === c.id ? c : x)) : [...(cf.calc || []), c];
    return { ...cf, calc, values: cf.values.includes(c.id) ? cf.values : [...cf.values, c.id] };
  });
  const deleteCalc = id => setCfg(cf => ({ ...cf, calc: cf.calc.filter(x => x.id !== id), values: cf.values.filter(x => x !== id) }));

  const flash = (t, icon = 'circle-check') => { setToast({ t, icon }); setTimeout(() => setToast(null), 3600); };
  const doExport = kind => {
    setMenu(null);
    const stamp = new Date().toISOString().slice(0, 10);
    const q = exSQL(eff, F);
    const filt = Object.entries(eff.filters).filter(([, v]) => v.length).map(([k, v]) => [F[k].label, v.join(', ')]);
    const meta = [['Field Data Explorer export'], ['Generated', new Date().toLocaleString()], ['Data through', EX_MONTHS[5]], ['Rows scanned', p.rows.length], [], ['Filters'], ...(filt.length ? filt : [['(none)']]), [], ['Semantic query'], [q.sl], [], ['Compiled SQL'], ...q.sql.split('\n').map(l => [l])];
    const defs = [['Field', 'Kind', 'Definition'], ...[...eff.rows, ...eff.cols, ...eff.values].map(id => F[id]).map(f => [f.label, f.kind === 'dim' ? 'Dimension' : f.group === 'Calculated' ? 'Calculated' : 'Governed metric', f.def || f.expr || f.desc || f.sql])];
    if (kind === 'pivot') { exDownload(`Field_Explorer_${stamp}`, [['Pivot', exPivotAOA(p, F)], ['Query', meta], ['Definitions', defs]]); flash('Pivot exported to Excel with query and definitions tabs.'); }
    if (kind === 'flat') { exDownload(`Field_Feed_Extract_${stamp}`, [['Feed rows', exFlatAOA(p.rows)], ['Query', meta]]); flash(`${p.rows.length.toLocaleString()} feed rows exported.`); }
    if (kind === 'unload') flash('Full extract queued. Snowflake unloads it to a secure link and you get an email when it is ready.', 'paper-plane');
  };

  const onFilterFa = f => { setCfg(c => ({ ...c, filters: { ...c.filters, fa: [f.name] } })); setFa(null); };

  return (
    <div style={{ padding: '14px 20px 16px', display: 'flex', flexDirection: 'column', gap: 10, flex: 1, minHeight: 0, fontFamily: 'Inter' }}>
      <style>{`.ex-field:hover{background:rgba(255,255,255,0.05)!important}.ex-zone-over{border-color:${EXS.acc}!important;background:rgba(16,185,129,0.06)!important}.ex-explorer a{color:${EXS.acc}}.ex-explorer a:hover{color:rgb(110,231,183)}`}</style>
      {/* toolbar */}
      <div className="ex-explorer" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={() => setFieldsOpen(o => !o)} title={fieldsOpen ? 'Hide field panels' : 'Show field panels'} style={{ ...exBtn(), width: 30, padding: 0, justifyContent: 'center' }}><i className={`fa-solid fa-${fieldsOpen ? 'angles-left' : 'angles-right'}`} style={{ fontSize: 10 }} /></button>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {EX_PRESETS.map(pr => {
            const on = view === pr.id;
            return <button key={pr.id} onClick={() => applyPreset(pr)} style={{ height: 30, padding: '0 11px', borderRadius: 7, cursor: 'pointer', fontFamily: 'Inter', fontSize: 12, whiteSpace: 'nowrap', background: on ? EXS.accBg : 'rgba(255,255,255,0.03)', border: `1px solid ${on ? 'rgb(16,185,129)' : 'rgba(75,85,99,0.5)'}`, color: on ? 'rgb(110,231,183)' : EXS.ink, fontWeight: on ? 600 : 500 }}>{pr.name}</button>;
          })}
          {view === 'custom' && <span style={{ height: 30, padding: '0 11px', borderRadius: 7, display: 'inline-flex', alignItems: 'center', fontSize: 12, color: EXS.calcC, border: `1px dashed ${EXS.calcC}88` }}>Unsaved view</span>}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
          <div style={{ flexShrink: 0, display: 'flex' }}><TabPills options={['light', 'dark']} labels={{ light: 'Sheet', dark: 'Dark' }} value={gridTheme} onChange={setGridTheme} /></div>
          <button onClick={() => setExpand(!expandAll)} style={exBtn()}><i className={`fa-solid fa-${expandAll ? 'compress' : 'expand'}`} style={{ fontSize: 10 }} />{expandAll ? 'Collapse all' : 'Expand all'}</button>
          <button onClick={() => setSqlOpen(true)} style={exBtn()}><i className="fa-solid fa-code" style={{ fontSize: 10 }} />View SQL</button>
          <div style={{ position: 'relative' }}>
            <button onClick={() => setMenu(menu === 'export' ? null : 'export')} style={exBtn('primary')}><i className="fa-solid fa-file-excel" style={{ fontSize: 11 }} />Export<i className="fa-solid fa-chevron-down" style={{ fontSize: 8 }} /></button>
            {menu === 'export' && (
              <ExMenu onClose={() => setMenu(null)} items={[
                { icon: 'table', t: 'Pivot as shown (.xlsx)', s: 'All levels, with subtotals, query and definitions tabs', on: () => doExport('pivot') },
                { icon: 'list', t: `Underlying rows (.xlsx)`, s: `${p.rows.length.toLocaleString()} feed rows matching the filters`, on: () => doExport('flat') },
                { icon: 'cloud-arrow-down', t: 'Full extract to secure link', s: 'For large pulls. Runs as a Snowflake unload', on: () => doExport('unload') },
              ]} />
            )}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, display: 'flex', gap: 10 }}>
        {fieldsOpen && <ExFieldsPanel F={F} level={level} onQuickAdd={quickAdd} onNewCalc={() => setEditCalc({})} onEditCalc={c => setEditCalc(c)} />}
        {fieldsOpen && <ExZonesPanel cfg={cfg} F={F} locked={locked} addTo={addTo} removeFrom={removeFrom} onFilter={id => setFilterPop({ id })} onEditCalc={id => setEditCalc(cfg.calc.find(c => c.id === id))} />}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', borderRadius: 12, border: `1px solid ${EXS.line}`, background: 'rgba(15,24,37,0.85)', overflow: 'hidden' }}>
          <ExFormulaBar F={F} sel={selected} p={p} edit={editCalc} onCancel={() => setEditCalc(null)} onSave={c => { saveCalc(c); setEditCalc(null); flash(`Calculated field "${c.label}" added to Values.`); }} onDelete={id => { deleteCalc(id); setEditCalc(null); }} onNew={() => setEditCalc({})} />
          <div style={{ height: 2, backgroundColor: 'transparent', backgroundImage: running ? `linear-gradient(90deg, transparent, ${EXS.acc}, transparent)` : 'none', backgroundSize: '200% 100%', animation: running ? 'exScan 900ms linear infinite' : 'none' }} />
          <ExGrid p={p} cfg={eff} setSort={setSort} isOpen={isOpen} toggle={toggle} selected={selected} onSelect={setSelected} onFa={setFa} running={running} theme={gridTheme} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '0 14px', height: 30, borderTop: `1px solid ${EXS.line}`, fontSize: 11, color: EXS.dim, whiteSpace: 'nowrap', overflow: 'hidden' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: running ? EXS.calcC : EXS.acc }}>
              <span style={{ width: 7, height: 7, borderRadius: 9, background: running ? EXS.calcC : EXS.acc, boxShadow: `0 0 0 3px ${running ? 'rgba(251,191,36,0.18)' : 'rgba(52,211,153,0.18)'}` }} />
              {running ? 'Running on Snowflake…' : 'Live · Snowflake'}
            </span>
            <span>{running ? '—' : `${(stats.ms / 1000).toFixed(2)}s`}</span>
            <span>{p.rows.length.toLocaleString()} rows scanned</span>
            <span>{p.top.length.toLocaleString()} groups</span>
            <span>Data through {EX_MONTHS[5]}</span>
            {conf && <span title="Computed at run time by the semantic layer. Rolling up returns to directly sourced levels, so query confidence is usually higher than the record-level tier.">Query confidence <strong style={{ color: conf.label === 'High' ? EXS.acc : conf.label === 'Medium' ? EXS.calcC : EXS.neg }}>{conf.label}</strong> ({conf.tier.toFixed(1)})</span>}
            <span style={{ marginLeft: 'auto', fontFamily: EXS.mono, color: EXS.mute }}>FIELD_EGRESS.UNIFIED_FEED{level >= 2 ? ' ⋈ FA_CRM_MONTHLY' : ''}{' ⋈ FA_SIGNALS'}</span>
          </div>
        </div>
      </div>

      {filterPop && <ExFilterPop id={filterPop.id} F={F} cfg={cfg} onClose={() => setFilterPop(null)} onApply={vals => { setCfg(c => ({ ...c, filters: { ...c.filters, [filterPop.id]: vals } })); setFilterPop(null); }} />}
      {sqlOpen && <ExSqlPanel q={exSQL(eff, F)} onClose={() => setSqlOpen(false)} />}
      <ExFaDrawer fa={fa} level={level} onClose={() => setFa(null)} onFilter={onFilterFa} />
      {toast && <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 90, background: 'rgb(17,24,39)', border: `1px solid ${EXS.acc}88`, borderRadius: 10, padding: '10px 16px', fontSize: 12.5, color: EXS.hi, display: 'flex', gap: 10, alignItems: 'center', boxShadow: '0 12px 30px -8px rgba(0,0,0,0.6)' }}><i className={`fa-solid fa-${toast.icon}`} style={{ color: EXS.acc }} />{toast.t}</div>}
    </div>
  );
}

function ExMenu({ items, onClose }) {
  React.useEffect(() => { const h = () => onClose(); setTimeout(() => document.addEventListener('click', h), 0); return () => document.removeEventListener('click', h); }, []);
  return (
    <div onClick={e => e.stopPropagation()} style={{ position: 'absolute', right: 0, top: 36, zIndex: 50, width: 300, background: EXS.panelSolid, border: `1px solid ${EXS.line}`, borderRadius: 10, padding: 6, boxShadow: '0 18px 40px -10px rgba(0,0,0,0.6)' }}>
      {items.map(it => (
        <button key={it.t} onClick={it.on} className="ex-field" style={{ width: '100%', display: 'flex', gap: 10, alignItems: 'flex-start', padding: '9px 10px', border: 'none', borderRadius: 7, background: 'transparent', cursor: 'pointer', textAlign: 'left', fontFamily: 'Inter' }}>
          <i className={`fa-solid fa-${it.icon}`} style={{ fontSize: 12, color: EXS.acc, width: 14, marginTop: 2 }} />
          <span><span style={{ display: 'block', fontSize: 12.5, color: EXS.hi, fontWeight: 500 }}>{it.t}</span><span style={{ display: 'block', fontSize: 11, color: EXS.dim, marginTop: 2 }}>{it.s}</span></span>
        </button>
      ))}
    </div>
  );
}

/* ---- fields panel --------------------------------------------------------- */

function ExFieldsPanel({ F, level, onQuickAdd, onNewCalc, onEditCalc }) {
  const [q, setQ] = React.useState('');
  const [closed, setClosed] = React.useState(() => new Set(['Provenance', 'Geo & Territory']));
  const all = Object.values(F).filter(f => !q || f.label.toLowerCase().includes(q.toLowerCase()));
  const groups = EX_GROUP_ORDER.map(g => [g, all.filter(f => f.group === g)]).filter(([, fs]) => fs.length);
  const dimGroups = groups.filter(([, fs]) => fs[0].kind === 'dim'), mGroups = groups.filter(([, fs]) => fs[0].kind === 'measure');
  const tag = f => f.kind === 'dim' ? <span style={{ fontFamily: EXS.mono, fontSize: 9.5, color: EXS.dimC, width: 22 }}>Abc</span> : f.group === 'Calculated' ? <span style={{ fontFamily: EXS.mono, fontSize: 10, color: EXS.calcC, width: 22 }}>fx</span> : <span style={{ fontFamily: EXS.mono, fontSize: 11, color: EXS.acc, width: 22 }}>#</span>;
  const head = t => <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: EXS.mute, padding: '12px 4px 4px' }}>{t}</div>;
  const renderGroup = ([g, fs]) => {
    const open = q || !closed.has(g);
    const lvl = Math.max(...fs.map(f => f.level || 1));
    return (
      <div key={g}>
        <button onClick={() => setClosed(s => { const n = new Set(s); n.has(g) ? n.delete(g) : n.add(g); return n; })} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 6, height: 26, border: 'none', background: 'transparent', cursor: 'pointer', color: EXS.ink, fontFamily: 'Inter', fontSize: 11.5, fontWeight: 600, padding: '0 4px' }}>
          <i className="fa-solid fa-chevron-right" style={{ fontSize: 8, color: EXS.mute, transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 140ms' }} />
          {g}
          {lvl > 1 && <span style={{ fontSize: 9, fontWeight: 700, color: lvl > level ? EXS.mute : EXS.acc, border: `1px solid ${lvl > level ? EXS.line : 'rgba(52,211,153,0.4)'}`, borderRadius: 4, padding: '0 4px', lineHeight: '14px' }}>{lvl > level && <i className="fa-solid fa-lock" style={{ fontSize: 7, marginRight: 3 }} />}P{lvl}</span>}
          <span style={{ marginLeft: 'auto', fontSize: 10, color: EXS.mute, fontWeight: 400 }}>{fs.length}</span>
        </button>
        {open && fs.map(f => {
          const lk = (f.level || 1) > level;
          return (
            <div key={f.id} className={lk ? '' : 'ex-field'} draggable={!lk}
              onDragStart={e => { e.dataTransfer.setData('text/ex-field', f.id); e.dataTransfer.effectAllowed = 'copyMove'; }}
              onDoubleClick={() => !lk && onQuickAdd(f)}
              title={lk ? `Turns on in Phase ${f.level}` : `${f.desc || f.def || f.expr || ''}${f.desc || f.def || f.expr ? '\n' : ''}Drag to a zone or double-click to add.`}
              style={{ display: 'flex', alignItems: 'center', gap: 4, height: 26, padding: '0 6px 0 16px', borderRadius: 6, cursor: lk ? 'not-allowed' : 'grab', opacity: lk ? 0.45 : 1, fontSize: 12, color: EXS.ink, userSelect: 'none' }}>
              {tag(f)}
              <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.label}</span>
              {f.group === 'Calculated' && <button onClick={() => onEditCalc(f)} title="Edit formula" style={{ border: 'none', background: 'transparent', color: EXS.dim, cursor: 'pointer', fontSize: 10 }}><i className="fa-solid fa-pen" /></button>}
              {lk && <i className="fa-solid fa-lock" style={{ fontSize: 9, color: EXS.mute }} />}
            </div>
          );
        })}
      </div>
    );
  };
  return (
    <div style={{ width: 236, flexShrink: 0, display: 'flex', flexDirection: 'column', borderRadius: 12, border: `1px solid ${EXS.line}`, background: EXS.panel, minHeight: 0 }}>
      <div style={{ padding: '12px 12px 8px', borderBottom: `1px solid ${EXS.lineSoft}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: EXS.hi }}>Fields</span>
          <button onClick={onNewCalc} title="New calculated field" style={{ ...exBtn(), height: 24, padding: '0 8px', fontSize: 11 }}><span style={{ fontFamily: EXS.mono, color: EXS.calcC }}>fx</span> New</button>
        </div>
        <div style={{ position: 'relative' }}>
          <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: 9, top: 8, fontSize: 10, color: EXS.mute }} />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search fields" style={{ width: '100%', boxSizing: 'border-box', height: 28, padding: '0 8px 0 26px', borderRadius: 7, background: 'rgba(0,0,0,0.3)', border: `1px solid ${EXS.line}`, color: EXS.hi, fontFamily: 'Inter', fontSize: 12, outline: 'none' }} />
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '0 8px 10px' }}>
        {dimGroups.length > 0 && head('Dimensions')}
        {dimGroups.map(renderGroup)}
        {mGroups.length > 0 && head('Measures')}
        {mGroups.map(renderGroup)}
      </div>
    </div>
  );
}

/* ---- layout zones --------------------------------------------------------- */

function ExZonesPanel({ cfg, F, locked, addTo, removeFrom, onFilter, onEditCalc }) {
  const [over, setOver] = React.useState(null);
  const items = z => (z === 'filters' ? Object.keys(cfg.filters || {}) : cfg[z]);
  const onDrop = (e, z, at) => {
    e.preventDefault(); e.stopPropagation(); setOver(null);
    const id = e.dataTransfer.getData('text/ex-field'), from = e.dataTransfer.getData('text/ex-from');
    if (!id) return;
    if (from === 'filters' && z !== 'filters') return;
    addTo(z, id, at);
  };
  return (
    <div style={{ width: 216, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8, minHeight: 0, overflow: 'auto' }}>
      {EX_ZONES.map(z => {
        const ids = items(z.id);
        return (
          <div key={z.id} onDragOver={e => { e.preventDefault(); setOver(z.id); }} onDragLeave={() => setOver(null)} onDrop={e => onDrop(e, z.id)}
            className={over === z.id ? 'ex-zone-over' : ''}
            style={{ borderRadius: 12, border: `1px solid ${EXS.line}`, background: EXS.panel, padding: '10px 10px 8px', flex: z.id === 'values' || z.id === 'rows' ? '1 0 auto' : '0 0 auto', minHeight: 64 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11.5, fontWeight: 600, color: EXS.ink, marginBottom: 7 }}>
              <i className={`fa-solid fa-${z.icon}`} style={{ fontSize: 10, color: EXS.mute }} />{z.label}
              {z.max && <span style={{ marginLeft: 'auto', fontSize: 10, color: EXS.mute, fontWeight: 400 }}>max {z.max}</span>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {ids.map((id, i) => {
                const f = F[id]; if (!f) return null;
                const lk = locked(f);
                const isM = f.kind === 'measure', calc = f.group === 'Calculated';
                const fv = z.id === 'filters' ? cfg.filters[id] : null;
                return (
                  <div key={id} draggable onDragStart={e => { e.dataTransfer.setData('text/ex-field', id); e.dataTransfer.setData('text/ex-from', z.id); }}
                    onDragOver={e => e.preventDefault()} onDrop={e => onDrop(e, z.id, i)}
                    onClick={() => (z.id === 'filters' ? onFilter(id) : calc ? onEditCalc(id) : null)}
                    title={lk ? `Needs Phase ${f.level}; ignored in this query` : f.def || f.desc || f.expr || ''}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, minHeight: 26, padding: '3px 4px 3px 8px', borderRadius: 6, cursor: 'grab', background: calc ? 'rgba(251,191,36,0.08)' : isM ? 'rgba(16,185,129,0.10)' : 'rgba(96,165,250,0.10)', border: `1px solid ${calc ? 'rgba(251,191,36,0.35)' : isM ? 'rgba(52,211,153,0.35)' : 'rgba(96,165,250,0.35)'}`, opacity: lk ? 0.45 : 1 }}>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: 11.5, color: EXS.hi, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.label}</span>
                      {fv && <span style={{ display: 'block', fontSize: 10.5, color: EXS.dim, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fv.length ? fv.join(', ') : 'All values'}</span>}
                    </span>
                    {isM && <span style={{ fontSize: 9.5, fontFamily: EXS.mono, color: calc ? EXS.calcC : EXS.acc }}>{EX_AGG_LABEL[f.agg]}</span>}
                    <button onClick={e => { e.stopPropagation(); removeFrom(z.id, id); }} title="Remove" style={{ width: 18, height: 18, border: 'none', background: 'transparent', color: EXS.dim, cursor: 'pointer', padding: 0 }}><i className="fa-solid fa-xmark" style={{ fontSize: 10 }} /></button>
                  </div>
                );
              })}
              {!ids.length && <div style={{ fontSize: 11, color: EXS.mute, padding: '6px 2px' }}>Drop {z.accepts === 'measure' ? 'measures' : 'dimensions'} here</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---- filter popover ------------------------------------------------------- */

function ExFilterPop({ id, F, cfg, onClose, onApply }) {
  const d = F[id];
  const counts = React.useMemo(() => { const m = new Map(); EX_DATA.rows.forEach(r => { const v = d.get(r); m.set(v, (m.get(v) || 0) + 1); }); return m; }, [id]);
  const vals = exSortVals([...counts.keys()], d);
  const [sel, setSel] = React.useState(() => new Set(cfg.filters[id] || []));
  const [q, setQ] = React.useState('');
  const shown = vals.filter(v => !q || String(v).toLowerCase().includes(q.toLowerCase()));
  const tog = v => setSel(s => { const n = new Set(s); n.has(v) ? n.delete(v) : n.add(v); return n; });
  return ReactDOM.createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 75, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: 340, maxHeight: '70vh', display: 'flex', flexDirection: 'column', background: EXS.panelSolid, border: `1px solid ${EXS.line}`, borderRadius: 12, boxShadow: '0 24px 60px -12px rgba(0,0,0,0.7)', fontFamily: 'Inter' }}>
        <div style={{ padding: '14px 14px 10px' }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: EXS.hi }}>Filter · {d.label}</div>
          <div style={{ fontSize: 11, color: EXS.dim, marginTop: 3 }}>{sel.size ? `${sel.size} selected` : 'No selection keeps all values'}</div>
          <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Search values" style={{ marginTop: 10, width: '100%', boxSizing: 'border-box', height: 28, padding: '0 9px', borderRadius: 7, background: 'rgba(0,0,0,0.3)', border: `1px solid ${EXS.line}`, color: EXS.hi, fontSize: 12, outline: 'none', fontFamily: 'Inter' }} />
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '0 8px' }}>
          {shown.map(v => (
            <label key={v} className="ex-field" style={{ display: 'flex', alignItems: 'center', gap: 8, height: 28, padding: '0 6px', borderRadius: 6, cursor: 'pointer', fontSize: 12, color: EXS.ink }}>
              <input type="checkbox" checked={sel.has(v)} onChange={() => tog(v)} style={{ accentColor: 'rgb(16,185,129)' }} />
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v}</span>
              <span style={{ fontSize: 10.5, color: EXS.mute, fontVariantNumeric: 'tabular-nums' }}>{counts.get(v).toLocaleString()}</span>
            </label>
          ))}
        </div>
        <div style={{ padding: 12, display: 'flex', gap: 6, borderTop: `1px solid ${EXS.lineSoft}` }}>
          <button onClick={() => setSel(new Set(shown))} style={exBtn()}>Select shown</button>
          <button onClick={() => setSel(new Set())} style={exBtn()}>Clear</button>
          <button onClick={() => onApply([...sel])} style={{ ...exBtn('primary'), marginLeft: 'auto' }}>Apply</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ---- SQL panel ------------------------------------------------------------ */

function ExSqlPanel({ q, onClose }) {
  const [tab, setTab] = React.useState('sql');
  const text = tab === 'sql' ? q.sql : q.sl;
  return ReactDOM.createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 75, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: 760, maxWidth: '100%', maxHeight: '80vh', display: 'flex', flexDirection: 'column', background: EXS.panelSolid, border: `1px solid ${EXS.line}`, borderRadius: 12, fontFamily: 'Inter', boxShadow: '0 24px 60px -12px rgba(0,0,0,0.7)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 16px', borderBottom: `1px solid ${EXS.lineSoft}` }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: EXS.hi, marginRight: 8 }}>Query</span>
          <TabPills options={['sql', 'sl']} labels={{ sql: 'Compiled SQL', sl: 'Semantic layer query' }} value={tab} onChange={setTab} />
          <button onClick={() => { navigator.clipboard && navigator.clipboard.writeText(text); }} style={{ ...exBtn(), marginLeft: 'auto' }}><i className="fa-solid fa-copy" style={{ fontSize: 10 }} />Copy</button>
          <button onClick={onClose} style={{ ...exBtn(), width: 30, padding: 0, justifyContent: 'center' }}><i className="fa-solid fa-xmark" /></button>
        </div>
        <pre style={{ margin: 0, padding: 16, overflow: 'auto', fontFamily: EXS.mono, fontSize: 12, lineHeight: 1.6, color: EXS.ink, whiteSpace: tab === 'sl' ? 'pre-wrap' : 'pre' }}>{text}</pre>
        <div style={{ padding: '10px 16px', borderTop: `1px solid ${EXS.lineSoft}`, fontSize: 11, color: EXS.dim }}>Generated from governed metric definitions. Row access policies scope results to your firm before the query runs.</div>
      </div>
    </div>,
    document.body
  );
}

Object.assign(window, { DataExplorerPage });
