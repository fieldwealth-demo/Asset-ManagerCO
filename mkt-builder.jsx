/* Marketing — Campaign Signals & Builder. Start generic (blank or a general
   template) or from a signal; set product focus; shape the audience; send the
   contacts and their attributes to a campaign in the client's CRM via API.
   The CRM is connected once at implementation; sends run from the campaign
   in the asset manager's own stack.
   Engagement and wholesaler follow-up sync back daily. */

const MKB_DEFAULT_F = { regions: [], wholesalers: [], segments: [], aumBands: [], prodBands: [], firms: [], channels: [], status: [], engagement: [], touch: 0, strategic: false, owns: [], notOwns: [], exclFocusOwners: false, contacts: 'dm', excludeActive: true, cap: 0, rankBy: 'exp' };
const MKB_FIELDS = ['Contact ID', 'CRD', 'Email', 'First / last name', 'Title', 'Firm', 'Region', 'Wholesaler', 'Segment', 'Signal', 'Confidence', 'Product', 'Content track'];
const MKB_RETURN = [['envelope-open-text', 'Email engagement', 'Sent, opened, clicked, unsubscribed, as recorded on the campaign member'], ['handshake', 'Wholesaler follow-up', 'Calls, meetings and tasks logged against campaign members'], ['user-check', 'Member status', 'Responded, opted out, bounced, removed'], ['envelope-circle-check', 'Email validity', 'Bounces and invalid addresses drop out of the next sync']];


function mkbLoad() { try { return JSON.parse(localStorage.getItem('mk_builder_v2')) || null; } catch (e) { return null; } }

function mkbAudience(u, f, product) {
  const has = (arr, v) => !arr.length || arr.includes(v);
  if (!(has(f.regions, u.region) && has(f.wholesalers, u.wholesaler) && has(f.segments, u.segment) && has(f.aumBands, u.aumBand) && has(f.prodBands, u.prodBand) && has(f.firms, u.firm) && has(f.channels, u.channel) && has(f.status, u.prodCat))) return false;
  if (f.engagement.length && !f.engagement.some(e => u.engagement.includes(e))) return false;
  if (f.touch && u.lastTouch != null && u.lastTouch < f.touch) return false;
  if (f.strategic && !u.strategic) return false;
  if (f.owns.length && !f.owns.some(p => u.owns.includes(p))) return false;
  if (f.notOwns.length && f.notOwns.some(p => u.owns.includes(p))) return false;
  if (f.exclFocusOwners && product !== 'any' && MK_CAT_PRODUCTS(MK_PROD[product].cat).some(p => u.owns.includes(p))) return false;
  return true;
}

function CampaignBuilderPage({ onViewClient, onGo }) {
  const saved = React.useMemo(mkbLoad, []);
  const [layout, setLayout] = React.useState(saved && saved.layout === 'matrix' ? 'matrix' : 'cards');
  const [tpl, setTpl] = React.useState(saved && MK_TPL[saved.tpl] ? saved.tpl : 'blank');
  const [sig, setSig] = React.useState(saved && MK_SIG[saved.sig] ? saved.sig : 'none');
  const [sigTypes, setSigTypes] = React.useState(() => saved && MK_SIG[saved.sig] && saved.sigTypes && saved.sigTypes.length ? saved.sigTypes : MK_SIG[saved && MK_SIG[saved.sig] ? saved.sig : 'none'].types);
  const chooseSig = (k, types) => { setSig(k); setSigTypes(types || MK_SIG[k].types); };
  const [product, setProduct] = React.useState(saved && MK_PROD[saved.product] ? saved.product : 'any');
  const [minConf, setMinConf] = React.useState(saved && saved.minConf || 60);
  const [f, setF] = React.useState(() => ({ ...MKB_DEFAULT_F, ...(saved && saved.f) }));
  const [whereBy, setWhereBy] = React.useState('region');
  const [manual, setManual] = React.useState(() => new Set());
  const [sort, setSort] = React.useState({ k: 'exp', d: -1 });
  const [shown, setShown] = React.useState(25);
  const [push, setPush] = React.useState(null);
  const wrapRef = React.useRef(null);
  const [wide, setWide] = React.useState(true);
  React.useEffect(() => { const el = wrapRef.current; if (!el || !window.ResizeObserver) return; const ro = new ResizeObserver(e => setWide(e[0].contentRect.width >= 1000)); ro.observe(el); return () => ro.disconnect(); }, []);
  React.useEffect(() => { try { localStorage.setItem('mk_builder_v2', JSON.stringify({ layout, tpl, sig, sigTypes, product, minConf, f })); } catch (e) {} }, [layout, tpl, sig, sigTypes, product, minConf, f]);
  React.useEffect(() => { setManual(new Set()); setShown(25); }, [sig, sigTypes, product]);
  const upd = (k, v) => setF(p => ({ ...p, [k]: v }));
  const t = MK_TPL[tpl], fam = MK_SIG[sig], prod = MK_PROD[product];
  const applyTpl = (k) => { const x = MK_TPL[k]; setTpl(k); chooseSig(x.sig, x.types); setProduct(x.product); setF(p => ({ ...MKB_DEFAULT_F, contacts: p.contacts, ...x.preset })); };
  const resetAll = () => applyTpl('blank');
  const autoName = `${t.label === 'Blank campaign' ? (sig === 'none' ? 'Campaign' : mkTypesLabel(sig, sigTypes)) : t.label}${product !== 'any' ? ' · ' + prod.label : ''} · Q4 2026`;
  const [name, setName] = React.useState(autoName);
  React.useEffect(() => setName(autoName), [tpl, sig, sigTypes, product]);
  const journeys = React.useMemo(() => mkJourneysFor(tpl, sig, product, sigTypes), [tpl, sig, product, sigTypes]);
  const [journey, setJourney] = React.useState('');
  React.useEffect(() => { setJourney(journeys.fit.length ? journeys.fit[0].name : 'New journey (data extension only)'); }, [journeys]);
  const [sfCampaign, setSfCampaign] = React.useState(true);
  const [campMode, setCampMode] = React.useState('new');
  const [purpose, setPurpose] = React.useState('Sales');
  const [measureLift, setMeasureLift] = React.useState(true);
  React.useEffect(() => { setMeasureLift(purpose === 'Sales'); }, [purpose]);
  const [showSales, setShowSales] = React.useState(true);
  const [removeStale, setRemoveStale] = React.useState(true);

  const tplCounts = React.useMemo(() => {
    const o = {}; MK_TEMPLATES.forEach(x => { if (x.kind === 'sig') o[x.key] = mkSignalCount(x.sig, x.product, minConf, null, x.types); }); return o;
  }, [minConf]);

  const audPool = React.useMemo(() => {
    const g = { ...f, exclFocusOwners: false };
    return MK_UNIVERSE.filter(u => mkbAudience(u, g, 'any'));
  }, [f]);
  const groupCounts = React.useMemo(() => {
    if (layout !== 'cards') return null;
    const pool = f.exclFocusOwners && product !== 'any' ? audPool.filter(u => mkbAudience(u, f, product)) : audPool;
    const o = {};
    MK_SIGNALS.forEach(s => { o[s.key] = mkSignalCount(s.key, product, minConf, pool); if (s.key !== 'none' && s.key !== 'any') s.types.forEach(ty => { o[s.key + ':' + ty] = mkSignalCount(s.key, product, minConf, pool, [ty]); }); });
    return o;
  }, [layout, audPool, product, minConf, f]);
  const matrix = React.useMemo(() => {
    if (layout !== 'matrix') return null;
    const m = {};
    const pools = {}; MK_PRODUCTS.forEach(p => { pools[p.key] = f.exclFocusOwners && p.key !== 'any' ? audPool.filter(u => mkbAudience(u, f, p.key)) : audPool; });
    MK_SIGNALS.forEach(s => {
      m[s.key] = {}; MK_PRODUCTS.forEach(p => { m[s.key][p.key] = mkSignalCount(s.key, p.key, minConf, pools[p.key]); });
      if (s.key !== 'none' && s.key !== 'any') s.types.forEach(ty => { const rk = s.key + ':' + ty; m[rk] = {}; MK_PRODUCTS.forEach(p => { m[rk][p.key] = mkSignalCount(s.key, p.key, minConf, pools[p.key], [ty]); }); });
    });
    return m;
  }, [layout, audPool, minConf, f]);

  const calc = React.useMemo(() => {
    const matched = [];
    MK_UNIVERSE.forEach(u => { const m = mkMatch(u, sig, product, minConf, sigTypes); if (m) matched.push({ u, s: m.s, generic: m.generic }); });
    const aud = matched.filter(({ u }) => mkbAudience(u, f, product));
    const inOther = aud.filter(m => m.u.activeCampaign);
    let pool = f.excludeActive ? aud.filter(m => !m.u.activeCampaign) : aud;
    const manualN = pool.filter(m => manual.has(m.u.id)).length;
    pool = pool.filter(m => !manual.has(m.u.id));
    const afterExcl = pool.length;
    let noEmail = 0, optOut = 0;
    const scoped = (u) => f.contacts === 'dm' ? u.contacts.filter(c => c.dm) : u.contacts;
    pool = pool.filter(m => { const cs = scoped(m.u); const ok = cs.filter(c => c.email && !c.optOut); return ok.length > 0; });
    const unreachable = afterExcl - pool.length;
    const rk = f.rankBy === 'conf' ? (m => m.s ? m.s.confidence : 0) : f.rankBy === 'aum' ? (m => m.u.aum) : (m => m.s ? m.s.opp : 0);
    pool.sort((a, b) => rk(b) - rk(a));
    const final = f.cap ? pool.slice(0, f.cap) : pool;
    let contacts = 0;
    final.forEach(m => scoped(m.u).forEach(c => (!c.email ? noEmail++ : c.optOut ? optOut++ : contacts++)));
    const exp = sig === 'none' ? 0 : final.reduce((a, m) => a + (m.s ? m.s.opp : 0), 0);
    const byRegion = ML_REGIONS.map(rg => { const xs = final.filter(m => m.u.region === rg); return { key: rg, n: xs.length, exp: xs.reduce((a, m) => a + (m.s ? m.s.opp : 0), 0), color: ML_REGION_COLORS[rg] }; });
    const byTerr = ML_REGIONS.flatMap(rg => ML_TEAM[rg].ext.map(w => { const xs = final.filter(m => m.u.wholesaler === w); return { key: w, region: rg, n: xs.length, exp: xs.reduce((a, m) => a + (m.s ? m.s.opp : 0), 0), color: ML_REGION_COLORS[rg] }; })).filter(x => (!f.regions.length || f.regions.includes(x.region))).sort((a, b) => b.n - a.n);
    const bySeg = LV_SEGMENTS.map(s => ({ key: s, n: final.filter(m => m.u.segment === s).length }));
    const byStatus = MK_STATUS.map(s => ({ key: s, n: final.filter(m => m.u.prodCat === s).length }));
    return { matched, aud, inOther, manualN, afterExcl, unreachable, final, contacts, noEmail, optOut, exp, byRegion, byTerr, bySeg, byStatus, finalSet: new Set(final.map(m => m.u.id)) };
  }, [sig, sigTypes, product, minConf, f, manual]);

  const tableRows = React.useMemo(() => {
    const rows = calc.aud.filter(m => calc.finalSet.has(m.u.id) || manual.has(m.u.id));
    const key = { exp: m => m.s ? m.s.opp : 0, conf: m => m.s ? m.s.confidence : 0, name: m => m.u.name, region: m => m.u.region + m.u.wholesaler, touch: m => m.u.lastTouch == null ? 9999 : m.u.lastTouch, aum: m => m.u.aum, seg: m => m.u.segment, owns: m => m.u.owns.length }[sort.k];
    return rows.slice().sort((a, b) => { const x = key(a), y = key(b); return (x < y ? -1 : x > y ? 1 : 0) * sort.d; });
  }, [calc, sort, manual]);

  const wholesalers = React.useMemo(() => (f.regions.length ? f.regions : ML_REGIONS).flatMap(rg => ML_TEAM[rg].ext), [f.regions]);
  const filterN = ['regions', 'wholesalers', 'segments', 'aumBands', 'prodBands', 'firms', 'channels', 'status', 'engagement', 'owns', 'notOwns'].reduce((n, k) => n + f[k].length, 0) + (f.strategic ? 1 : 0) + (f.touch ? 1 : 0) + (f.cap ? 1 : 0) + (f.exclFocusOwners ? 1 : 0);
  const scopeLabel = f.wholesalers.length ? `${f.wholesalers.length} territor${f.wholesalers.length === 1 ? 'y' : 'ies'}` : f.regions.length ? f.regions.join(', ') : 'National';

  const exportCsv = () => {
    const head = ['Contact', 'Title', 'Decision maker', 'Email valid', 'FA/Team', 'Firm', 'Channel', 'Region', 'Wholesaler', 'Segment', 'Status', 'Signal', 'Product', 'Confidence', 'Expected $M', 'Content track'];
    const lines = [head];
    calc.final.forEach(({ u, s }) => (f.contacts === 'dm' ? u.contacts.filter(c => c.dm) : u.contacts).filter(c => c.email && !c.optOut).forEach(c => lines.push([c.name, c.title, c.dm ? 'Y' : 'N', 'Y', u.name, u.firm, u.channel, u.region, u.wholesaler, u.segment, u.prodCat, sig === 'none' ? '' : s.type, sig === 'none' ? '' : (s.product || ''), sig === 'none' ? '' : s.confidence, sig === 'none' ? '' : s.opp, `${t.label}${product !== 'any' ? ' · ' + prod.label : ''}`])));
    const csv = lines.map(l => l.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = `${name.replace(/[\\/:*?"<>|]+/g, '-')}.csv`; a.click();
  };
  const startPush = () => {
    const steps = ['Connecting to your CRM (API)', campMode === 'new' ? `Creating CRM campaign: ${name}` : `Linking to CRM campaign: ${journey}`, `Adding ${mkNum(calc.contacts)} contacts as campaign members with ${MKB_FIELDS.length} attributes`, 'Scheduling daily membership sync (6:00 AM ET)', 'Scheduling daily return sync: engagement, follow-up, member status'];
    setPush({ steps, i: 0, done: false });
    steps.forEach((_, i) => setTimeout(() => setPush(p => p && { ...p, i: i + 1, done: i + 1 === steps.length }), 650 * (i + 1)));
    const camp = { id: 'user-' + Date.now(), name, tpl, sig, types: sigTypes, product, status: 'Active', start: new Date().toISOString().slice(0, 10), members: calc.final.length, contacts: calc.contacts, costK: 0, open: 0, click: 0, engaged: 0, lift: 0, runRate: 0, baseline: 0, attributed: 0, liftD: 0, trend: [], fresh: true, dest: 'CRM campaign', journey: campMode === 'new' ? null : journey, purpose, measureLift, sync: 'Daily', showSales, scope: scopeLabel, scopeRegions: f.regions.length ? f.regions : null };
    mkSaveUserCampaigns([camp, ...mkLoadUserCampaigns()]);
  };

  const th = (label, k, right) => (
    <th onClick={k ? () => setSort(s => ({ k, d: s.k === k ? -s.d : -1 })) : undefined} style={{ textAlign: right ? 'right' : 'left', padding: '10px 12px', fontFamily: 'Inter', fontSize: 10, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', color: sort.k === k ? MKB.ink : MKB.dim, borderBottom: `1px solid ${MKB.line}`, cursor: k ? 'pointer' : 'default', whiteSpace: 'nowrap', position: 'sticky', top: 0, background: 'rgb(24,32,45)', zIndex: 1 }}>
      {label}{sort.k === k && <i className={`fa-solid fa-arrow-${sort.d < 0 ? 'down' : 'up'}`} style={{ fontSize: 8, marginLeft: 5 }}></i>}
    </th>
  );
  const td = { padding: '9px 12px', fontFamily: 'Inter', fontSize: 12, color: 'rgb(229,231,235)', borderBottom: '1px solid rgba(75,85,99,0.16)', verticalAlign: 'middle' };
  const fmax = Math.max(1, calc.matched.length);
  const funnel = [
    [sig === 'none' ? 'National universe' : 'Signal matches', calc.matched.length, sig === 'none' ? 'All FA/Teams Field covers' : `${mkTypesLabel(sig, sigTypes)}${product !== 'any' ? ' · ' + prod.label : ''} · ${minConf}+ confidence`],
    ['After audience filters', calc.aud.length, filterN ? `${filterN} filter${filterN === 1 ? '' : 's'} applied` : 'No filters'],
    ['After exclusions', calc.afterExcl, `${f.excludeActive ? mkNum(calc.inOther.length) + ' in other active campaigns' : 'Other campaigns kept'}${calc.manualN ? ` · ${calc.manualN} removed by hand` : ''}`],
    ['Reachable by email', calc.afterExcl - calc.unreachable, `${mkNum(calc.unreachable)} with no valid, opted-in email auto-excluded`],
    ['Campaign FA/Teams', calc.final.length, f.cap ? `Capped at ${mkNum(f.cap)} by ${{ exp: 'expected $', conf: 'confidence', aum: 'AUM' }[f.rankBy]}` : 'No cap'],
  ];

  const sigControls = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <MkLabel>Product focus</MkLabel>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>{MK_PRODUCTS.map(p => <MkPill key={p.key} on={product === p.key} color={p.color} onClick={() => setProduct(p.key)}><i className={`fa-solid fa-${p.icon}`} style={{ fontSize: 9, color: p.color }}></i>{p.label}</MkPill>)}</div>
        </div>
        {sig !== 'none' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <MkLabel>Min signal confidence</MkLabel>
            <div style={{ display: 'flex', gap: 5 }}>{[50, 60, 70, 80, 90].map(v => <MkPill key={v} on={minConf === v} onClick={() => setMinConf(v)}>{v}+</MkPill>)}</div>
          </div>
        )}
      </div>
    </div>
  );

  const rail = false;
  return (
    <div ref={wrapRef} style={{ padding: '18px 24px 24px', display: 'grid', gridTemplateColumns: rail ? '250px minmax(0,1fr)' : 'minmax(0,1fr)', gap: 18, alignItems: 'start' }}>
      {rail && (
        <div style={{ position: 'sticky', top: 0, maxHeight: 'calc(100vh - 150px)', overflow: 'auto' }}>
          <div style={{ fontFamily: 'Inter', fontSize: 12, fontWeight: 600, color: MKB.ink, padding: '0 6px' }}>Start from</div>
          <MkStartRail tpl={tpl} onTpl={applyTpl} tplCounts={tplCounts} />
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
        <MkCard title={layout === 'rail' && rail ? `${t.label}` : 'Start a campaign'} note={layout === 'cards' ? 'Pick a signal group, or stay blank, then narrow by signal type and product' : 'Click a cell to pick a signal and product together'}
          right={<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontFamily: 'Inter', fontSize: 10.5, color: MKB.mut }}>Layout</span><MkSeg value={layout} onChange={setLayout} options={[['cards', 'Cards'], ['matrix', 'Matrix']]} /><button onClick={resetAll} title="Back to a blank campaign with no filters" style={{ height: 28, padding: '0 10px', borderRadius: 7, border: '1px solid rgba(75,85,99,0.7)', background: 'transparent', color: MKB.ink, fontFamily: 'Inter', fontSize: 11.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}><i className="fa-solid fa-rotate-left" style={{ fontSize: 10 }}></i>Reset</button></div>}>
          {layout === 'cards' && groupCounts && <MkStartCards sig={sig} sigTypes={sigTypes} counts={groupCounts} onPick={(k, ty) => { setTpl('blank'); chooseSig(k, ty); }} />}
          {layout === 'matrix' && matrix && <MkStartMatrix sig={sig} sigTypes={sigTypes} product={product} matrix={matrix} onCell={(rk, p) => { const [s, ty] = rk.split(':'); setTpl('blank'); chooseSig(s, ty ? [ty] : null); setProduct(p); }} />}
          <div style={{ paddingTop: layout === 'rail' && rail ? 0 : 12, borderTop: layout === 'rail' && rail ? 'none' : `1px solid ${MKB.line}` }}>
            {layout === 'matrix' ? (
              <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontFamily: 'Inter', fontSize: 12, color: MKB.dim }}>Selected: <b style={{ color: MKB.ink }}>{mkTypesLabel(sig, sigTypes)}</b> · <b style={{ color: MKB.ink }}>{prod.label}</b></span>
                {sig !== 'none' && <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}><MkLabel style={{ marginRight: 4 }}>Min confidence</MkLabel>{[50, 60, 70, 80, 90].map(v => <MkPill key={v} on={minConf === v} onClick={() => setMinConf(v)}>{v}+</MkPill>)}</div>}
              </div>
            ) : sigControls}
          </div>
        </MkCard>

        <MkCard title="Campaign audience" note={`${scopeLabel} · campaigns run national unless narrowed here`} right={filterN > 0 && <button onClick={() => setF(p => ({ ...MKB_DEFAULT_F, contacts: p.contacts, excludeActive: p.excludeActive }))} style={{ border: 'none', background: 'transparent', color: MKB.acc, fontFamily: 'Inter', fontSize: 11.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}><i className="fa-solid fa-xmark" style={{ fontSize: 10 }}></i>Clear {filterN} filter{filterN === 1 ? '' : 's'}</button>}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8 }}>
            <MkMulti label="Region" options={ML_REGIONS} value={f.regions} onChange={v => setF(p => ({ ...p, regions: v, wholesalers: p.wholesalers.filter(w => (v.length ? v : ML_REGIONS).some(rg => ML_TEAM[rg].ext.includes(w))) }))} />
            <MkMulti label="Territory" options={wholesalers} value={f.wholesalers} onChange={v => upd('wholesalers', v)} />
            <MkMulti label="Firm" options={LV_ALL_FIRMS} value={f.firms} onChange={v => upd('firms', v)} />
            <MkMulti label="Channel" options={LV_ALL_CHANNELS} value={f.channels} onChange={v => upd('channels', v)} />
            <MkMulti label="AUM" options={MK_AUM_BANDS} value={f.aumBands} onChange={v => upd('aumBands', v)} />
            <MkMulti label="Production" options={LV_PROD_BANDS} value={f.prodBands} onChange={v => upd('prodBands', v)} />
            <MkMulti label="Owns" options={MK_PRODUCT_NAMES} value={f.owns} onChange={v => upd('owns', v)} width={260} />
            <MkMulti label="Doesn’t own" options={MK_PRODUCT_NAMES} value={f.notOwns} onChange={v => upd('notOwns', v)} width={260} />
          </div>
          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <MkLabel>Producer status</MkLabel>
              <div style={{ display: 'flex', gap: 5 }}>{MK_STATUS.map(s => { const on = f.status.includes(s); return <MkPill key={s} on={on} onClick={() => upd('status', on ? f.status.filter(x => x !== s) : [...f.status, s])}>{s === 'Dabbler' ? 'Dabbler' : s}</MkPill>; })}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <MkLabel>Segment</MkLabel>
              <div style={{ display: 'flex', gap: 5 }}>{LV_SEGMENTS.map(s => { const on = f.segments.includes(s); return <MkPill key={s} on={on} color={LV_SEG_META[s].dot} title={LV_SEG_META[s].desc} onClick={() => upd('segments', on ? f.segments.filter(x => x !== s) : [...f.segments, s])}><span style={{ width: 7, height: 7, borderRadius: 4, background: LV_SEG_META[s].dot }}></span>{s}</MkPill>; })}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <MkLabel>No sales touch in</MkLabel>
              <div style={{ display: 'flex', gap: 5 }}>{[[0, 'Any'], [30, '30d'], [60, '60d'], [90, '90d'], [180, '180d']].map(([v, l]) => <MkPill key={v} on={f.touch === v} onClick={() => upd('touch', v)}>{l}</MkPill>)}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <MkLabel>Engaged with</MkLabel>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>{LV_ENGAGEMENT.map(e => { const on = f.engagement.includes(e.key); return <MkPill key={e.key} on={on} color={e.color} onClick={() => upd('engagement', on ? f.engagement.filter(x => x !== e.key) : [...f.engagement, e.key])}><i className={`fa-solid fa-${e.icon}`} style={{ fontSize: 9, color: e.color }}></i>{e.label.replace(' open', '').replace(' visit', '')}</MkPill>; })}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <MkLabel>Team contacts</MkLabel>
              <div style={{ display: 'flex', gap: 5 }}>
                <MkPill on={f.contacts === 'dm'} onClick={() => upd('contacts', 'dm')}><i className="fa-solid fa-user-tie" style={{ fontSize: 9 }}></i>Decision maker / CIO</MkPill>
                <MkPill on={f.contacts === 'all'} onClick={() => upd('contacts', 'all')}><i className="fa-solid fa-users" style={{ fontSize: 9 }}></i>All team members</MkPill>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <MkLabel>Accounts</MkLabel>
              <MkPill on={f.strategic} onClick={() => upd('strategic', !f.strategic)}><i className="fa-solid fa-star" style={{ fontSize: 9 }}></i>Strategic accounts only</MkPill>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <MkLabel>Max FA/Teams</MkLabel>
              <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'wrap' }}>
                {[[0, 'No cap'], [250, '250'], [500, '500'], [1000, '1,000']].map(([v, l]) => <MkPill key={v} on={f.cap === v} onClick={() => upd('cap', v)}>{l}</MkPill>)}
                {f.cap > 0 && <select value={f.rankBy} onChange={e => upd('rankBy', e.target.value)} style={{ height: 26, borderRadius: 7, border: '1px solid rgba(75,85,99,0.7)', background: 'rgb(17,24,39)', color: MKB.ink, fontFamily: 'Inter', fontSize: 11.5, padding: '0 6px' }}>{sig !== 'none' && <option value="exp">ranked by expected $</option>}{sig !== 'none' && <option value="conf">ranked by confidence</option>}<option value="aum">ranked by AUM</option></select>}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', paddingTop: 12, borderTop: `1px solid ${MKB.line}` }}>
            {product !== 'any' && <MkSwitch on={f.exclFocusOwners} onChange={v => upd('exclFocusOwners', v)} label={`Exclude current ${prod.label} owners`} sub={MK_CAT_PRODUCTS(prod.cat).join(', ')} />}
            <MkSwitch on={f.excludeActive} onChange={v => upd('excludeActive', v)} label="Exclude members of other active campaigns" sub={`${mkNum(calc.inOther.length)} FA/Teams in ${MK_ACTIVE_CAMPAIGNS.length} active campaigns`} />
            <MkSwitch on locked label="Require a valid email; suppress opt-outs and compliance holds" sub={`${mkNum(calc.unreachable)} FA/Teams unreachable`} />
          </div>
        </MkCard>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 14 }}>
          <MkCard title="Audience funnel">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {funnel.map(([l, n, sub], i) => (
                <div key={l} style={{ display: 'grid', gridTemplateColumns: '150px minmax(0,1fr) 60px', gap: 10, alignItems: 'center' }}>
                  <div><div style={{ fontFamily: 'Inter', fontSize: 12, color: MKB.ink, fontWeight: i === funnel.length - 1 ? 600 : 500 }}>{l}</div><div style={{ fontFamily: 'Inter', fontSize: 10.5, color: MKB.mut, lineHeight: 1.3 }}>{sub}</div></div>
                  <div style={{ height: 14, borderRadius: 4, background: 'rgba(255,255,255,0.04)' }}><div style={{ height: '100%', width: `${Math.max(1.5, n / fmax * 100)}%`, borderRadius: 4, background: i === funnel.length - 1 ? 'rgba(16,185,129,0.55)' : 'rgba(16,185,129,0.25)', border: '1px solid rgb(16,185,129)', transition: 'width 260ms ease', boxSizing: 'border-box' }}></div></div>
                  <div style={{ textAlign: 'right', fontFamily: 'Inter', fontSize: 13, fontWeight: 600, color: MKB.ink, fontVariantNumeric: 'tabular-nums' }}>{mkNum(n)}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 10, paddingTop: 12, borderTop: `1px solid ${MKB.line}` }}>
              {[['Contacts sent', mkNum(calc.contacts), f.contacts === 'dm' ? 'Decision makers only' : 'All team members', true], ['Not sent', mkNum(calc.noEmail + calc.optOut), `${mkNum(calc.noEmail)} no valid email · ${mkNum(calc.optOut)} opted out`], sig === 'none' ? ['Total AUM', mkMoney(calc.final.reduce((a, m) => a + m.u.aum, 0)), 'Across campaign FA/Teams'] : ['Expected $', mkMoney(calc.exp), 'Sum of signal estimates']].map(([l, v, s, strong]) => (
                <div key={l} style={{ minWidth: 0 }}><div style={{ fontFamily: 'Inter', fontSize: 9.5, color: MKB.dim, textTransform: 'uppercase', letterSpacing: 0.6 }}>{l}</div><div style={{ fontFamily: 'Inter', fontSize: 22, fontWeight: 500, color: strong ? MKB.acc : MKB.ink, fontVariantNumeric: 'tabular-nums' }}>{v}</div><div style={{ fontFamily: 'Inter', fontSize: 10.5, color: MKB.mut, lineHeight: 1.3 }}>{s}</div></div>
              ))}
            </div>
          </MkCard>
          <MkCard title="Where the audience sits" note={`Campaign FA/Teams · click to narrow`} right={<MkSeg value={whereBy} onChange={setWhereBy} options={[['region', 'Region'], ['territory', 'Territory']]} />}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 214, overflow: 'auto', paddingRight: 2 }}>
              {(whereBy === 'region' ? calc.byRegion : calc.byTerr).map(r => {
                const rows = whereBy === 'region' ? calc.byRegion : calc.byTerr;
                const mx = Math.max(1, ...rows.map(x => x.n));
                const fk = whereBy === 'region' ? 'regions' : 'wholesalers', on = f[fk].includes(r.key);
                return (
                  <button key={r.key} onClick={() => upd(fk, on ? f[fk].filter(x => x !== r.key) : [...f[fk], r.key])} style={{ display: 'grid', gridTemplateColumns: '120px minmax(0,1fr) 44px 60px', gap: 10, alignItems: 'center', border: 'none', background: on ? 'rgba(52,211,153,0.08)' : 'transparent', borderRadius: 6, padding: '3px 4px', cursor: 'pointer' }}>
                    <span style={{ textAlign: 'left', fontFamily: 'Inter', fontSize: 12, color: on ? MKB.acc : MKB.ink, display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>{whereBy === 'territory' && <span title={r.region} style={{ width: 6, height: 6, borderRadius: 3, background: r.color, flexShrink: 0 }}></span>}<span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.key}</span></span>
                    <span style={{ height: 10, borderRadius: 3, background: 'rgba(255,255,255,0.04)' }}><span style={{ display: 'block', height: '100%', width: `${r.n / mx * 100}%`, borderRadius: 3, background: mkA(r.color || MKB.acc, 0.5), transition: 'width 260ms' }}></span></span>
                    <span style={{ textAlign: 'right', fontFamily: 'Inter', fontSize: 12, fontWeight: 600, color: MKB.ink, fontVariantNumeric: 'tabular-nums' }}>{mkNum(r.n)}</span>
                    <span style={{ textAlign: 'right', fontFamily: 'Inter', fontSize: 11.5, color: MKB.dim, fontVariantNumeric: 'tabular-nums' }}>{sig === 'none' ? '' : mkMoney(r.exp)}</span>
                  </button>
                );
              })}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 14, paddingTop: 12, borderTop: `1px solid ${MKB.line}` }}>
              {[['Segment', calc.bySeg, s => LV_SEG_META[s].dot], ['Status', calc.byStatus, s => s === 'Producer' ? 'rgb(52,211,153)' : s === 'Dabbler' ? 'rgb(251,191,36)' : 'rgb(148,163,184)']].map(([tt, rows, col]) => {
                const tot = Math.max(1, rows.reduce((a, x) => a + x.n, 0));
                return (
                  <div key={tt} style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                    <MkLabel>{tt}</MkLabel>
                    <div style={{ display: 'flex', height: 10, borderRadius: 3, overflow: 'hidden', gap: 2 }}>{rows.map(x => <span key={x.key} style={{ width: `${x.n / tot * 100}%`, background: col(x.key), opacity: 0.75, transition: 'width 260ms' }}></span>)}</div>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>{rows.map(x => <span key={x.key} style={{ fontFamily: 'Inter', fontSize: 11, color: MKB.dim, display: 'inline-flex', alignItems: 'center', gap: 5 }}><span style={{ width: 7, height: 7, borderRadius: 2, background: col(x.key) }}></span>{x.key} {mkNum(x.n)}</span>)}</div>
                  </div>
                );
              })}
            </div>
          </MkCard>
        </div>

        <MkCard title="Campaign members" note={`${mkNum(calc.final.length)} FA/Teams · ${mkNum(calc.contacts)} contacts with a valid email · uncheck to remove`} pad="14px 0 6px">
          <div style={{ overflow: 'auto', maxHeight: 560 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1040 }}>
              <thead><tr>
                <th style={{ width: 36, position: 'sticky', top: 0, background: 'rgb(24,32,45)', borderBottom: `1px solid ${MKB.line}`, zIndex: 1 }}></th>
                {th('FA/Team', 'name')}{th('Region · Territory', 'region')}{th('Seg', 'seg')}{th('AUM', 'aum', true)}{th('Last touch', 'touch', true)}{th('Owns', 'owns', true)}{th(sig === 'none' ? 'Top signal' : 'Signal')}{th('Conf.', 'conf', true)}{th('Expected', 'exp', true)}{th('Sent to')}
                <th style={{ width: 40, position: 'sticky', top: 0, background: 'rgb(24,32,45)', borderBottom: `1px solid ${MKB.line}`, zIndex: 1 }}></th>
              </tr></thead>
              <tbody>
                {tableRows.slice(0, shown).map(({ u, s }) => {
                  const off = manual.has(u.id), out = !off && !calc.finalSet.has(u.id);
                  const cs = f.contacts === 'dm' ? u.contacts.filter(c => c.dm) : u.contacts;
                  const sent = cs.filter(c => c.email && !c.optOut);
                  const sm = s ? (LV_SIG_META[s.type] || {}) : {};
                  return (
                    <tr key={u.id} style={{ opacity: off || out ? 0.42 : 1 }}>
                      <td style={{ ...td, textAlign: 'center' }}><input type="checkbox" checked={!off} onChange={() => setManual(m => { const n = new Set(m); n.has(u.id) ? n.delete(u.id) : n.add(u.id); return n; })} style={{ accentColor: MKB.btn, cursor: 'pointer' }} /></td>
                      <td style={td}><div style={{ fontWeight: 600, color: MKB.ink, display: 'flex', alignItems: 'center', gap: 6 }}>{u.name}{u.strategic && <i className="fa-solid fa-star" title="Strategic account" style={{ fontSize: 9, color: 'rgb(251,191,36)' }}></i>}</div><div style={{ fontSize: 11, color: MKB.mut }}>{u.type} · {u.firm} · {u.prodCat}</div></td>
                      <td style={td}><div>{u.region}</div><div style={{ fontSize: 11, color: MKB.mut }}>{u.wholesaler}</div></td>
                      <td style={td}><LvSegBadge seg={u.segment} size={18} /></td>
                      <td style={{ ...td, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{mkMoney(u.aum)}</td>
                      <td style={{ ...td, textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: u.lastTouch == null || u.lastTouch > 90 ? 'rgb(251,191,36)' : 'rgb(229,231,235)' }}>{u.lastTouch == null ? 'Never' : `${u.lastTouch}d`}</td>
                      <td style={{ ...td, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }} title={u.owns.join(', ') || 'No Field products'}>{u.owns.length || <span style={{ color: MKB.mut }}>0</span>}</td>
                      <td style={{ ...td, opacity: sig === 'none' ? 0.8 : 1 }}>{s ? <><div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><i className={`fa-solid fa-${sm.icon || 'circle'}`} style={{ fontSize: 10, color: sm.color }}></i><span>{s.type.replace('Focus: ', 'Focus · ')}</span></div>{s.product && !s.type.startsWith('Focus') && <div style={{ fontSize: 11, color: MKB.mut }}>{s.product}</div>}</> : <span style={{ color: MKB.mut }}>—</span>}</td>
                      <td style={{ ...td, textAlign: 'right' }}>{s ? <LvConfBar value={s.confidence} /> : <span style={{ color: MKB.mut }}>—</span>}</td>
                      <td style={{ ...td, textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 600, color: MKB.ink }}>{s ? mkMoney(s.opp) : '—'}</td>
                      <td style={td}>{f.contacts === 'dm' || u.type === 'FA' ? <div><div>{cs[0].name}{!cs[0].email ? <span style={{ marginLeft: 6, fontSize: 10, color: 'rgb(248,113,113)' }}>no email</span> : cs[0].optOut ? <span style={{ marginLeft: 6, fontSize: 10, color: 'rgb(248,113,113)' }}>opted out</span> : null}</div><div style={{ fontSize: 11, color: MKB.mut }}>{cs[0].title}</div></div> : <div><div>{sent.length} of {u.contacts.length} members</div><div style={{ fontSize: 11, color: MKB.mut }}>{u.contacts.length - sent.length ? `${u.contacts.length - sent.length} not reachable` : 'Incl. ' + u.contacts[0].title}</div></div>}</td>
                      <td style={td}><LvEyeButton onClick={() => onViewClient && onViewClient(lvClientRow({ ...u.src, name: u.name, firm: u.firm }))} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {shown < tableRows.length && <div style={{ padding: '8px 18px 6px' }}><button onClick={() => setShown(n => n + 50)} style={{ border: 'none', background: 'transparent', color: MKB.acc, fontFamily: 'Inter', fontSize: 12, cursor: 'pointer' }}>Show 50 more of {mkNum(tableRows.length - shown)}</button></div>}
        </MkCard>

        <MkCard title="Send to campaign" note="Field sends members and their attributes to a campaign in your CRM, keeps membership in sync and pulls engagement and follow-up back">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(52,211,153,0.4)', background: 'rgba(52,211,153,0.06)' }}>
                <i className="fa-solid fa-cloud" style={{ color: 'rgb(56,189,248)', fontSize: 16 }}></i>
                <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontFamily: 'Inter', fontSize: 12.5, fontWeight: 600, color: MKB.ink }}>Your CRM</div><div style={{ fontFamily: 'Inter', fontSize: 11, color: MKB.mut }}>Connected at implementation · sends from the campaign run in your existing tools</div></div>
                <span style={{ fontFamily: 'Inter', fontSize: 10.5, fontWeight: 600, color: MKB.acc, display: 'inline-flex', alignItems: 'center', gap: 5 }}><span style={{ width: 6, height: 6, borderRadius: 3, background: MKB.acc }}></span>API</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}><MkLabel>CRM campaign</MkLabel>
                <MkSeg value={campMode} onChange={setCampMode} options={[['new', 'Create new'], ['existing', 'Add to existing']]} />
                {campMode === 'new'
                  ? <input value={name} onChange={e => setName(e.target.value)} style={{ height: 32, borderRadius: 8, border: '1px solid rgba(75,85,99,0.7)', background: 'rgba(17,24,39,0.5)', color: MKB.ink, fontFamily: 'Inter', fontSize: 12.5, padding: '0 10px' }} />
                  : <>
                    <select value={journey} onChange={e => setJourney(e.target.value)} style={{ height: 32, borderRadius: 8, border: '1px solid rgba(75,85,99,0.7)', background: 'rgb(17,24,39)', color: MKB.ink, fontFamily: 'Inter', fontSize: 12.5, padding: '0 8px' }}>
                      {journeys.fit.length > 0 && <optgroup label={`Fits ${t.key === 'blank' && sig === 'none' ? 'a general campaign' : (t.key !== 'blank' ? t.label : fam.label)}${product !== 'any' ? ' · ' + prod.label : ''}`}>{journeys.fit.map(j => <option key={j.name}>{j.name}</option>)}</optgroup>}
                      <optgroup label="Other campaigns">{journeys.other.map(j => <option key={j.name}>{j.name}</option>)}</optgroup>
                    </select>
                    <div style={{ fontFamily: 'Inter', fontSize: 11, color: journeys.fit.some(j => j.name === journey) ? MKB.acc : 'rgb(251,191,36)', display: 'flex', alignItems: 'center', gap: 5 }}><i className={`fa-solid fa-${journeys.fit.some(j => j.name === journey) ? 'circle-check' : 'circle-info'}`} style={{ fontSize: 10 }}></i>{journeys.fit.some(j => j.name === journey) ? `${journeys.fit.length} existing campaign${journeys.fit.length === 1 ? '' : 's'} fit this signal and product` : 'Not tagged for this campaign type or product'}</div>
                  </>}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}><MkLabel>Campaign purpose</MkLabel>
                <MkSeg value={purpose} onChange={setPurpose} options={[['Sales', 'Sales'], ['Awareness', 'Awareness / announcement']]} />
              </div>
              <MkSwitch on={measureLift} onChange={setMeasureLift} label="Measure sales lift, revenue and ROI" sub={measureLift ? 'Included in Campaign Analytics lift, revenue and ROI' : 'Tracks engagement and follow-up only; excluded from lift, revenue and ROI (e.g. new wholesaler intro)'} />
              <MkSwitch on={showSales} onChange={setShowSales} label="Show campaign to wholesalers" sub="Tags members in the Territory Brief and on the FA/Team page" />
              <MkSwitch on locked label="Sync membership daily at 6:00 AM ET" sub="Adds FA/Teams that newly qualify as data refreshes" />
              <MkSwitch on={removeStale} onChange={setRemoveStale} label="Remove members who no longer qualify" sub="Off keeps everyone added until the campaign ends" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <MkLabel>Sent to the CRM campaign · member attributes</MkLabel>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>{MKB_FIELDS.map(x => <span key={x} style={{ height: 22, padding: '0 8px', borderRadius: 6, border: '1px solid rgba(75,85,99,0.6)', fontFamily: 'Inter', fontSize: 11, color: 'rgb(209,213,219)', display: 'inline-flex', alignItems: 'center' }}>{x}</span>)}</div>
              <div style={{ fontFamily: 'Inter', fontSize: 11, color: MKB.mut, lineHeight: 1.45 }}>Content track carries the template, signal and product so your team can branch content.</div>
              <MkLabel>Synced back daily</MkLabel>
              {MKB_RETURN.map(([ic, l, s]) => <div key={l} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}><i className={`fa-solid fa-${ic}`} style={{ fontSize: 11, color: 'rgb(56,189,248)', marginTop: 3, width: 13 }}></i><div style={{ fontFamily: 'Inter', fontSize: 11.5, color: MKB.ink }}>{l}<div style={{ fontSize: 10.5, color: MKB.mut, lineHeight: 1.4 }}>{s}</div></div></div>)}
            </div>
          </div>
        </MkCard>

        <div style={{ position: 'sticky', bottom: 12, zIndex: 25, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', padding: '10px 12px 10px 18px', borderRadius: 12, background: 'rgb(31,41,55)', border: '1px solid rgba(75,85,99,0.8)', boxShadow: '0 14px 34px rgba(0,0,0,0.5)' }}>
          <div style={{ fontFamily: 'Inter', fontSize: 12, color: MKB.dim, flex: 1, minWidth: 200 }}><span style={{ color: MKB.ink, fontWeight: 600 }}>{mkNum(calc.contacts)}</span> contacts · {mkNum(calc.final.length)} FA/Teams · {scopeLabel}</div>
          <button onClick={exportCsv} title="Lists exported to file do not stay in sync" style={{ height: 32, padding: '0 12px', borderRadius: 8, border: '1px solid rgba(75,85,99,0.7)', background: 'transparent', color: MKB.ink, fontFamily: 'Inter', fontSize: 12, fontWeight: 500, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7, whiteSpace: 'nowrap' }}><i className="fa-solid fa-file-csv" style={{ fontSize: 12 }}></i>Export CSV</button>
          <button disabled={!calc.contacts} onClick={startPush} style={{ height: 32, padding: '0 14px', borderRadius: 8, border: 'none', background: calc.contacts ? MKB.btn : 'rgba(75,85,99,0.6)', color: '#fff', fontFamily: 'Inter', fontSize: 12, fontWeight: 600, cursor: calc.contacts ? 'pointer' : 'default', display: 'inline-flex', alignItems: 'center', gap: 7, whiteSpace: 'nowrap' }}><i className="fa-solid fa-paper-plane" style={{ fontSize: 11 }}></i>Send to CRM campaign</button>
        </div>
      </div>

      {push && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => push.done && setPush(null)}>
          <div onClick={e => e.stopPropagation()} style={{ width: 440, maxWidth: 'calc(100vw - 40px)', borderRadius: 14, background: 'rgb(31,41,55)', border: '1px solid rgba(75,85,99,0.8)', padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14, boxShadow: '0 20px 50px rgba(0,0,0,0.6)' }}>
            <div style={{ fontFamily: 'Inter', fontSize: 15, fontWeight: 600, color: MKB.ink }}>{push.done ? 'Members are in the CRM campaign' : 'Sending to your CRM'}</div>
            <div style={{ fontFamily: 'Inter', fontSize: 12, color: MKB.dim }}>{name}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {push.steps.map((s, i) => (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'Inter', fontSize: 12.5, color: i < push.i ? MKB.ink : MKB.mut }}>
                  <i className={`fa-solid ${i < push.i ? 'fa-circle-check' : i === push.i ? 'fa-spinner fa-spin' : 'fa-circle'}`} style={{ fontSize: 13, width: 14, color: i < push.i ? MKB.acc : MKB.mut, opacity: i > push.i ? 0.4 : 1 }}></i>{s}
                </div>
              ))}
            </div>
            {push.done && (
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 4 }}>
                <button onClick={() => setPush(null)} style={{ height: 32, padding: '0 12px', borderRadius: 8, border: '1px solid rgba(75,85,99,0.7)', background: 'transparent', color: MKB.ink, fontFamily: 'Inter', fontSize: 12, cursor: 'pointer' }}>Close</button>
                <button onClick={() => { setPush(null); onGo && onGo('mktanalytics'); }} style={{ height: 32, padding: '0 14px', borderRadius: 8, border: 'none', background: MKB.btn, color: '#fff', fontFamily: 'Inter', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>View in Campaign Analytics</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { CampaignBuilderPage });
