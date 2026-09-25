/* Deep links from a brief or review. The brief stays open underneath; each
   link opens a pop-up with the team profile or the dashboard pre-filtered to
   what was clicked. Closing the pop-up returns to the brief. */

function bpParse(go) {
  const i = go.indexOf(':');
  return i < 0 ? { kind: go, arg: '' } : { kind: go.slice(0, i), arg: go.slice(i + 1) };
}

function bpPersonRole(name) {
  if ((window.ML_SPECS || []).some(s => s.name === name)) return 'spec';
  const T = window.ML_TEAM || {};
  for (const r of Object.keys(T)) { if ((T[r].int || []).includes(name)) return 'int'; }
  return 'ext';
}

function bpLeadCats(arg) {
  const want = String(arg).toLowerCase().replace(/-/g, ' ');
  const all = [...new Set((window.ML_ROWS || []).flatMap(r => (r.mix || []).map(m => m.cat)))];
  return all.filter(c => c.toLowerCase().replace(/-/g, ' ').includes(want));
}

/* What each link opens: the view, its title and the preset. */
function bpResolve(go, level) {
  const { kind, arg } = bpParse(go);
  const D = { ...LV_FILTER_DEFAULT };
  if (kind === 'signal' || kind === 'signals') {
    const types = !arg ? [] : arg === 'Focus' ? LV_SIG_TYPES.filter(t => t.startsWith('Focus: ')) : [arg];
    return { view: level >= 3 ? 'l3' : 'l2', title: arg ? `${arg === 'Focus' ? 'Focus product' : arg} signals` : 'All open signals', filters: { ...D, sigTypes: types } };
  }
  if (kind === 'sales') {
    const t = { yesterday: 'Sales yesterday', new: 'New producers' }[arg] || 'Sales';
    return { view: 'l2', title: t, filters: arg === 'new' ? { ...D, prodCats: ['Producer'] } : D };
  }
  if (kind === 'activity') {
    const map = {
      cold: ['Segment A · no external meeting in 90+ days', { segments: ['A'], staleOnly: true }],
      segA: ['Segment A coverage', { segments: ['A'] }],
      segC: ['Segment C coverage', { segments: ['C'] }],
      calls: ['Internal calls', { roles: ['int'] }],
      book: ['Meetings to book', { roles: ['int'], segments: ['A'] }],
      followup: ['Follow-ups due', { roles: ['int'] }],
      joint: ['Specialist joint meetings', { roles: ['spec'] }],
      requests: ['Specialist activity', { roles: ['spec'] }],
      meetings: ['External meetings', { roles: ['ext'] }],
    };
    const [t, p] = map[arg] || ['Activity', {}];
    return { view: 'l2', title: t, filters: { ...D, ...p } };
  }
  if (kind === 'lead') {
    const j = arg.indexOf(':');
    const dim = j < 0 ? arg : arg.slice(0, j), val = j < 0 ? '' : arg.slice(j + 1);
    const xf = mlEmptyXf();
    let role = 'ext', title = 'Sales Leadership';
    if (dim === 'region' && val) { xf.region = [val]; title = `${val} region`; }
    if (dim === 'firm' && val) { xf.firm = [val]; title = val; }
    if (dim === 'person' && val) { role = bpPersonRole(val); xf.person = [val]; title = val; }
    if (dim === 'cat') { if (val && val !== 'all') { xf.cat = bpLeadCats(val); title = val; } else title = 'Focus categories'; }
    if (dim === 'activity') title = 'Team activity';
    return { view: 'lead', title, xf, role };
  }
  return { view: 'l2', title: 'Territory Analytics', filters: D };
}

function BriefLinkPopup({ go, label, level, measure, onClose, onViewClient, focusKey }) {
  const cfg = React.useMemo(() => bpResolve(go, level), [go, level]);
  const [filters, setFilters] = React.useState(cfg.filters || LV_FILTER_DEFAULT);
  const [xf, setXf] = React.useState(mlEmptyXf);
  const [role, setRole] = React.useState(cfg.role || 'ext');
  const [period, setPeriod] = React.useState('YTD');
  // LeadershipPage clears the person filter when it mounts; apply the preset after.
  React.useEffect(() => { if (cfg.xf) setXf(cfg.xf); }, []);
  React.useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, []);
  const f = React.useMemo(() => ({ ...filters, focusStrat: focusKey }), [filters, focusKey]);
  const setF = (v) => setFilters(prev => { const nv = typeof v === 'function' ? v({ ...prev, focusStrat: focusKey }) : v; const { focusStrat, ...rest } = nv; return rest; });
  const viewName = cfg.view === 'l3' ? 'Segmentation & Signals' : cfg.view === 'lead' ? 'Sales Leadership' : 'Territory Analytics';
  const chips = cfg.view === 'lead'
    ? ML_XF_KEYS.flatMap(k => (xf[k] || []).map(v => ({ k, v })))
    : LV_FILTER_KEYS.flatMap(k => Array.isArray(filters[k]) ? filters[k].map(v => ({ k, v })) : filters[k] === true ? [{ k, v: k === 'staleOnly' ? 'No touch 90d+' : k }] : []);
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 150, background: 'rgba(5,10,18,0.72)', backdropFilter: 'blur(6px)', display: 'flex', padding: '28px 32px' }}>
      <div onClick={e => e.stopPropagation()} style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', borderRadius: 14, border: '1px solid rgba(75,85,99,0.6)', background: 'rgb(11,21,36)', boxShadow: '0 24px 80px rgba(0,0,0,0.6)', overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(75,85,99,0.4)', display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(31,41,55,0.6)' }}>
          <button onClick={onClose} style={{ height: 30, padding: '0 12px', borderRadius: 7, border: '1px solid rgba(75,85,99,0.6)', background: 'transparent', color: 'rgb(209,213,219)', fontFamily: 'Inter', fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7 }}>
            <i className="fa-solid fa-arrow-left" style={{ fontSize: 10 }} />Back to brief
          </button>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: 'Inter', fontSize: 15, fontWeight: 600, color: 'rgb(249,250,251)' }}>{cfg.title}</div>
            <div style={{ fontFamily: 'Inter', fontSize: 11, color: 'rgb(156,163,175)' }}>{viewName}{label && label !== cfg.title ? ` · from "${label}"` : ''}</div>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flex: 1, minWidth: 0 }}>
            {chips.map(({ k, v }) => <SelectionChip key={k + v} label={cfg.view === 'lead' ? v : lvChipLabel(k, v)} />)}
          </div>
          <PeriodDropdown value={period} onChange={setPeriod} />
          <button onClick={onClose} title="Close" style={{ width: 30, height: 30, borderRadius: 7, border: '1px solid rgba(75,85,99,0.6)', background: 'transparent', color: 'rgb(163,163,163)', cursor: 'pointer' }}><i className="fa-solid fa-xmark" /></button>
        </div>
        <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
          {cfg.view === 'l3' && <Level3Page filters={f} setFilters={setF} period={period} measure={measure} onSelectionsChange={() => {}} onViewClient={onViewClient} />}
          {cfg.view === 'l2' && <Level2Page filters={f} setFilters={setF} period={period} measure={measure} onSelectionsChange={() => {}} onViewClient={onViewClient} />}
          {cfg.view === 'lead' && <LeadershipPage focus={focusKey} level={Math.max(2, level)} measure={measure} period={period} role={role} xf={xf} setXf={setXf} onSelectionsChange={() => {}} />}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { BriefLinkPopup, bpParse });
