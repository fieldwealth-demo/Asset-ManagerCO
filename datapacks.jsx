/* Data Packs page — subscriptions table + add/edit drawer. State shared with onboarding via localStorage */
function DataPacksPage() {
  const [state] = React.useState(() => {
    const saved = dpLoad();
    if (saved && saved.selected && Object.keys(saved.selected).length) return saved;
    const seed = dpSeed();
    dpSave(Object.assign({ phase:'dashboard', step:3 }, seed));
    return seed;
  });
  const [selected, setSelected] = React.useState(state.selected || {});
  const [tiers, setTiers] = React.useState(() => Object.assign({}, DP_DEFAULT_TIERS, state.tiers || {}));
  const [paused, setPaused] = React.useState(state.paused || {});
  const [uploads, setUploads, startUpload] = useDPUploads(state.uploads || {});
  const [drawer, setDrawer] = React.useState(null); // {type:'add'|'edit', packId, tier, paused}

  React.useEffect(() => { dpSave({ phase:'dashboard', selected, tiers, paused, uploads }); }, [selected, tiers, paused, uploads]);

  const selectedIds = DP_PACKS.filter(p => selected[p.id]).map(p => p.id);
  const drawerPack = drawer && drawer.packId ? dpPack(drawer.packId) : null;
  const isEdit = drawer && drawer.type === 'edit';
  const isAdd = drawer && drawer.type === 'add';
  const availPacks = DP_PACKS.filter(p => !selected[p.id]);

  const closeDrawer = () => setDrawer(null);
  const saveDrawer = () => {
    if (!drawerPack) return closeDrawer();
    const id = drawerPack.id;
    setSelected(s => Object.assign({}, s, { [id]: true }));
    setTiers(s => Object.assign({}, s, { [id]: drawer.tier || 1 }));
    setPaused(s => Object.assign({}, s, { [id]: !!drawer.paused }));
    setDrawer(null);
  };
  const removePack = () => {
    if (!drawerPack) return;
    const id = drawerPack.id;
    setSelected(s => { const n = Object.assign({}, s); delete n[id]; return n; });
    setUploads(s => { const n = Object.assign({}, s); delete n[id]; return n; });
    setDrawer(null);
  };
  const restartOnboarding = () => {
    try { localStorage.removeItem(DP_LS_KEY); } catch(e) {}
    window.location.href = 'Asset Manager Onboarding.html';
  };

  const dTierN = drawer ? (drawer.tier || 1) : 1;
  const dCadence = drawerPack ? (drawerPack.id === 'lpl' && dTierN === 3 ? 'Monthly' : drawerPack.cadence) : '';
  const dMeta = drawerPack ? [
    { k:'Cadence', v:dCadence },
    { k:'Format', v:'CSV · direct delivery' },
    { k:'Landing schema', v:DP_DB + '.' + drawerPack.schema },
    { k:'Staging model', v:'stg_' + drawerPack.id + '_to_canonical' },
  ] : [];
  const dUp = drawerPack ? (uploads[drawerPack.id] || { state:'idle' }) : null;

  return (
    <div style={{ padding:'24px 28px 60px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:18 }}>
        <div>
          <div style={{ fontFamily:"'Inter Display'", fontSize:19, fontWeight:700, color:'rgb(249,250,251)' }}>Data Packs</div>
          <div style={{ fontFamily:'Inter', fontSize:12, color:'rgb(163,163,163)', marginTop:3 }}>{selectedIds.length} subscription{selectedIds.length === 1 ? '' : 's'} · landing in {DP_DB}</div>
        </div>
        <span style={{ flex:1 }}></span>
        <button onClick={restartOnboarding} style={{ height:34, padding:'0 14px', borderRadius:8, border:'1px solid rgba(75,85,99,0.7)', background:'rgba(0,0,0,0.25)', color:'rgb(209,213,219)', fontFamily:'Inter', fontSize:12, fontWeight:500, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:8 }}><i className="fa-solid fa-rotate-left" style={{ fontSize:11 }}></i>Restart onboarding</button>
        <button onClick={() => setDrawer({ type:'add', packId:null, tier:1 })} style={{ height:34, padding:'0 14px', borderRadius:8, border:'none', background:'rgb(16,185,129)', color:'rgb(6,24,17)', fontFamily:'Inter', fontSize:12.5, fontWeight:600, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:8 }}><i className="fa-solid fa-plus" style={{ fontSize:11 }}></i>Add data pack</button>
      </div>

      {selectedIds.length === 0 && (
        <div style={{ border:'1px dashed rgba(75,85,99,0.7)', borderRadius:14, padding:48, textAlign:'center', fontFamily:'Inter', fontSize:13, color:'rgb(163,163,163)' }}>No data packs yet. Add your first pack to start the pipeline.</div>
      )}

      {selectedIds.length > 0 && (
        <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(75,85,99,0.5)', borderRadius:14, overflow:'hidden' }}>
          <div style={{ display:'grid', gridTemplateColumns:'minmax(230px,2.1fr) 1.3fr 0.9fr 0.8fr 0.9fr 1.3fr 1fr 34px', gap:10, alignItems:'center', padding:'11px 18px', borderBottom:'1px solid rgba(75,85,99,0.4)', fontFamily:'Inter', fontSize:10, fontWeight:600, letterSpacing:'0.07em', textTransform:'uppercase', color:'rgb(115,115,115)' }}>
            <span>Pack</span><span>Tier</span><span>Cadence</span><span>Grain</span><span>Vehicles</span><span>Last delivery</span><span>Status</span><span></span>
          </div>
          {selectedIds.map(id => {
            const p = dpPack(id), t = dpTierOf(id, tiers), u = uploads[id] || {};
            const isPaused = !!paused[id];
            const status = isPaused ? 'Paused' : (u.state === 'done' ? 'Active' : 'Awaiting file');
            const col = isPaused ? ['rgba(156,163,175,', 'rgb(156,163,175)'] : u.state === 'done' ? ['rgba(16,185,129,', 'rgb(52,211,153)'] : ['rgba(234,179,8,', 'rgb(234,179,8)'];
            return (
              <div key={id} onClick={() => setDrawer({ type:'edit', packId:id, tier:tiers[id] || 1, paused:isPaused })} className="dp-row"
                style={{ display:'grid', gridTemplateColumns:'minmax(230px,2.1fr) 1.3fr 0.9fr 0.8fr 0.9fr 1.3fr 1fr 34px', gap:10, alignItems:'center', padding:'13px 18px', borderBottom:'1px solid rgba(75,85,99,0.25)', cursor:'pointer' }}>
                <div style={{ display:'flex', alignItems:'center', gap:11, minWidth:0 }}>
                  <div style={dpAvatar(id, 30)}>{dpInit(p)}</div>
                  <div style={{ minWidth:0 }}>
                    <div style={{ fontFamily:'Inter', fontSize:13, fontWeight:600, color:'rgb(249,250,251)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{p.name}</div>
                    <div style={{ fontFamily:'Inter', fontSize:11, color:'rgb(163,163,163)' }}>{p.provider}</div>
                  </div>
                </div>
                <span style={{ fontFamily:'Inter', fontSize:12, color:'rgb(209,213,219)' }}>{t.name}</span>
                <span style={{ fontFamily:'Inter', fontSize:12, color:'rgb(209,213,219)' }}>{dpCadence(id, tiers)}</span>
                <span style={{ fontFamily:'Inter', fontSize:12, color:'rgb(209,213,219)' }}>{p.grain}</span>
                <span style={{ fontFamily:'Inter', fontSize:12, color:'rgb(209,213,219)' }}>{t.scope}</span>
                <span style={{ fontFamily:'Inter', fontSize:11.5, color:'rgb(163,163,163)' }}>{u.state === 'done' ? (u.date || '—') + ' · ' + dpFmt(u.rows) + ' rows' : '—'}</span>
                <span><span style={{ height:22, padding:'0 9px', borderRadius:9999, display:'inline-flex', alignItems:'center', background:col[0] + '0.12)', border:'1px solid ' + col[0] + '0.45)', color:col[1], fontFamily:'Inter', fontSize:10.5, fontWeight:600 }}>{status}</span></span>
                <i className="fa-solid fa-chevron-right" style={{ fontSize:10, color:'rgb(107,114,128)' }}></i>
              </div>
            );
          })}
        </div>
      )}

      {drawer && (
        <>
          <div onClick={closeDrawer} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:60 }}></div>
          <div style={{ position:'fixed', top:0, right:0, bottom:0, width:430, maxWidth:'92vw', background:'rgb(17,24,39)', borderLeft:'1px solid rgb(75,85,99)', zIndex:61, overflowY:'auto', display:'flex', flexDirection:'column' }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, padding:'20px 22px 16px', borderBottom:'1px solid rgba(75,85,99,0.4)', position:'sticky', top:0, background:'rgb(17,24,39)', zIndex:2 }}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontFamily:"'Inter Display'", fontSize:16, fontWeight:700, color:'rgb(249,250,251)' }}>{isAdd && !drawerPack ? 'Add data pack' : drawerPack ? drawerPack.name : ''}</div>
                <div style={{ fontFamily:'Inter', fontSize:11.5, color:'rgb(163,163,163)', marginTop:2 }}>{drawerPack ? drawerPack.provider + ' · ' + drawerPack.vendorType + ' · Pattern ' + drawerPack.pattern : 'Choose a provider data pack to subscribe to'}</div>
              </div>
              <button onClick={closeDrawer} style={{ width:28, height:28, borderRadius:7, border:'1px solid rgba(75,85,99,0.6)', background:'transparent', color:'rgb(163,163,163)', cursor:'pointer' }}><i className="fa-solid fa-xmark" style={{ fontSize:12 }}></i></button>
            </div>

            {isAdd && !drawerPack && (
              <div style={{ padding:'18px 22px', display:'flex', flexDirection:'column', gap:10 }}>
                {availPacks.length === 0 && <div style={{ fontFamily:'Inter', fontSize:12.5, color:'rgb(163,163,163)', padding:'20px 0', textAlign:'center' }}>All available packs are already subscribed.</div>}
                {availPacks.map(p => (
                  <div key={p.id} onClick={() => setDrawer(d => Object.assign({}, d, { packId:p.id, tier:DP_DEFAULT_TIERS[p.id] || 1 }))} style={{ display:'flex', alignItems:'center', gap:12, padding:'13px 14px', borderRadius:10, border:'1px solid rgba(75,85,99,0.5)', background:'rgba(255,255,255,0.03)', cursor:'pointer' }}>
                    <div style={dpAvatar(p.id, 30)}>{dpInit(p)}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontFamily:'Inter', fontSize:13, fontWeight:600, color:'rgb(249,250,251)' }}>{p.name}</div>
                      <div style={{ fontFamily:'Inter', fontSize:11, color:'rgb(163,163,163)', marginTop:2 }}>{p.provider} · {p.vendorType} · {p.grain} grain</div>
                    </div>
                    <i className="fa-solid fa-chevron-right" style={{ fontSize:10, color:'rgb(107,114,128)' }}></i>
                  </div>
                ))}
              </div>
            )}

            {drawerPack && (
              <>
                {isAdd && (
                  <div style={{ padding:'16px 22px 0' }}>
                    <button onClick={() => setDrawer(d => Object.assign({}, d, { packId:null }))} style={{ background:'transparent', border:'none', cursor:'pointer', fontFamily:'Inter', fontSize:11.5, color:'rgb(52,211,153)', padding:0, marginBottom:14 }}><i className="fa-solid fa-arrow-left" style={{ fontSize:10, marginRight:6 }}></i>All packs</button>
                  </div>
                )}
                <div style={{ padding:'16px 22px 20px', display:'flex', flexDirection:'column', gap:22 }}>
                  <div>
                    <div style={{ fontFamily:'Inter', fontSize:10.5, fontWeight:600, letterSpacing:'0.07em', textTransform:'uppercase', color:'rgb(115,115,115)', marginBottom:10 }}>Subscription tier</div>
                    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                      {drawerPack.tiers.map(t => (
                        <DPTierRow key={t.n} tier={t} selected={dTierN === t.n} onPick={() => setDrawer(d => Object.assign({}, d, { tier:t.n }))} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontFamily:'Inter', fontSize:10.5, fontWeight:600, letterSpacing:'0.07em', textTransform:'uppercase', color:'rgb(115,115,115)', marginBottom:10 }}>Delivery</div>
                    <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(75,85,99,0.5)', borderRadius:10, padding:'14px 16px', display:'flex', flexDirection:'column', gap:8 }}>
                      {dMeta.map(m => (
                        <div key={m.k} style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <span style={{ fontFamily:'Inter', fontSize:11.5, color:'rgb(115,115,115)', width:110, flexShrink:0 }}>{m.k}</span>
                          <span style={{ fontFamily:"'Geist Mono', monospace", fontSize:11, color:'rgb(209,213,219)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{m.v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontFamily:'Inter', fontSize:10.5, fontWeight:600, letterSpacing:'0.07em', textTransform:'uppercase', color:'rgb(115,115,115)', marginBottom:10 }}>Data file</div>
                    {dUp.state === 'done' && (
                      <div style={{ background:'rgba(16,185,129,0.06)', border:'1px solid rgba(16,185,129,0.4)', borderRadius:10, padding:'13px 15px', marginBottom:8 }}>
                        <div style={{ fontFamily:'Inter', fontSize:12, color:'rgb(52,211,153)', fontWeight:500 }}><i className="fa-solid fa-circle-check" style={{ marginRight:7 }}></i>{dpFmt(dUp.rows)} rows · {dpFmt(dUp.units)} {dUp.unit}</div>
                        <div style={{ fontFamily:"'Geist Mono', monospace", fontSize:10.5, color:'rgb(115,115,115)', marginTop:5 }}>{dUp.file}</div>
                      </div>
                    )}
                    {dUp.state === 'uploading' && (
                      <div style={{ border:'1px solid rgba(75,85,99,0.5)', borderRadius:10, padding:'13px 15px', marginBottom:8 }}>
                        <DPUploadZone u={dUp} />
                      </div>
                    )}
                    {dUp.state !== 'uploading' && (
                      <DPUploadZone u={{ state:'idle' }} onStart={() => startUpload(drawerPack.id, undefined, dTierN)} onDrop={(name) => startUpload(drawerPack.id, name, dTierN)} zoneLabel={dUp.state === 'done' ? 'Replace — drop CSV or browse' : 'Drop CSV here or browse'} />
                    )}
                  </div>
                  {isEdit && (
                    <div onClick={() => setDrawer(d => Object.assign({}, d, { paused:!d.paused }))} style={{ display:'flex', alignItems:'center', gap:12, cursor:'pointer', padding:'2px 0' }}>
                      <div style={{ width:36, height:20, borderRadius:9999, flexShrink:0, position:'relative', background:drawer.paused ? 'rgb(16,185,129)' : 'rgba(107,114,128,0.5)', transition:'background 150ms' }}>
                        <span style={{ position:'absolute', top:2, left:drawer.paused ? 18 : 2, width:16, height:16, borderRadius:9999, background:'rgb(249,250,251)', transition:'left 150ms', display:'block' }}></span>
                      </div>
                      <div>
                        <div style={{ fontFamily:'Inter', fontSize:12.5, fontWeight:600, color:'rgb(249,250,251)' }}>Pause pipeline</div>
                        <div style={{ fontFamily:'Inter', fontSize:11, color:'rgb(163,163,163)' }}>Mutes this pack without removing the subscription.</div>
                      </div>
                    </div>
                  )}
                </div>
                <div style={{ marginTop:'auto', padding:'16px 22px 20px', borderTop:'1px solid rgba(75,85,99,0.4)', display:'flex', alignItems:'center', gap:12, position:'sticky', bottom:0, background:'rgb(17,24,39)' }}>
                  {isEdit && <button onClick={removePack} style={{ height:34, padding:'0 12px', borderRadius:8, border:'1px solid rgba(248,113,113,0.4)', background:'transparent', color:'rgb(248,113,113)', fontFamily:'Inter', fontSize:12, fontWeight:500, cursor:'pointer' }}>Remove pack</button>}
                  <span style={{ flex:1 }}></span>
                  <button onClick={closeDrawer} style={{ height:34, padding:'0 14px', borderRadius:8, border:'1px solid rgba(75,85,99,0.7)', background:'transparent', color:'rgb(209,213,219)', fontFamily:'Inter', fontSize:12, fontWeight:500, cursor:'pointer' }}>Cancel</button>
                  <button onClick={saveDrawer} style={{ height:34, padding:'0 16px', borderRadius:8, border:'none', background:'rgb(16,185,129)', color:'rgb(6,24,17)', fontFamily:'Inter', fontSize:12.5, fontWeight:600, cursor:'pointer' }}>{isAdd ? 'Add pack' : 'Save changes'}</button>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
Object.assign(window, { DataPacksPage });
