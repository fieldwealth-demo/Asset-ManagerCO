/* Asset Manager Onboarding — 4-step wizard. Ends by navigating to Asset Manager Portal.html */
function ObStepper({ step }) {
  const labels = ['Select packs', 'Choose tiers', 'Upload data', 'Go live'];
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:34, flexWrap:'wrap' }}>
      {labels.map((label, i) => {
        const done = i < step, active = i === step;
        return (
          <div key={label} style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:24, height:24, borderRadius:9999, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Inter', fontSize:11, fontWeight:600,
              background:done ? 'rgba(16,185,129,0.18)' : active ? 'rgb(16,185,129)' : 'transparent',
              border:done ? '1px solid rgba(16,185,129,0.5)' : active ? 'none' : '1px solid rgba(107,114,128,0.7)',
              color:done ? 'rgb(52,211,153)' : active ? 'rgb(6,24,17)' : 'rgb(115,115,115)' }}>
              {done ? <i className="fa-solid fa-check" style={{ fontSize:10 }}></i> : <span>{i + 1}</span>}
            </div>
            <div style={{ fontFamily:'Inter', fontSize:12, fontWeight:active ? 600 : 500, color:active ? 'rgb(249,250,251)' : done ? 'rgb(163,163,163)' : 'rgb(115,115,115)' }}>{label}</div>
            {i < 3 && <i className="fa-solid fa-chevron-right" style={{ fontSize:9, color:'rgba(107,114,128,0.8)', margin:'0 4px' }}></i>}
          </div>
        );
      })}
    </div>
  );
}

function OnboardingApp() {
  const [step, setStep] = React.useState(0);
  const [selected, setSelected] = React.useState({});
  const [tiers, setTiers] = React.useState(() => Object.assign({}, DP_DEFAULT_TIERS));
  const [uploads, setUploads, startUpload] = useDPUploads({});

  React.useEffect(() => { dpSave({ phase:'onboarding', step, selected, tiers, uploads }); }, [step, selected, tiers, uploads]);

  const selectedIds = DP_PACKS.filter(p => selected[p.id]).map(p => p.id);
  const allSettled = selectedIds.length > 0 && selectedIds.every(id => { const st = (uploads[id] || {}).state; return st === 'done' || st === 'deferred'; });
  const doneCount = selectedIds.filter(id => (uploads[id] || {}).state === 'done').length;
  const canContinue = step === 0 ? selectedIds.length > 0 : step === 2 ? allSettled : true;
  const contLabels = ['Continue to tiers', 'Continue to upload', 'Review & go live'];
  const footerSummaries = [
    selectedIds.length + ' pack' + (selectedIds.length === 1 ? '' : 's') + ' selected',
    selectedIds.length + ' pack' + (selectedIds.length === 1 ? '' : 's') + ' · tiers confirmed',
    doneCount + ' of ' + selectedIds.length + ' files loaded' + (allSettled ? ' — ready' : ''),
  ];

  const goDashboard = () => {
    dpSave({ phase:'dashboard', step, selected, tiers, uploads });
    try { localStorage.setItem('amp_active', 'home'); } catch(e) {}
    window.location.href = 'index.html';
  };

  return (
    <div data-screen-label="00 Onboarding" style={{ minHeight:'100vh', display:'flex', flexDirection:'column' }}>
      <div style={{ height:64, display:'flex', alignItems:'center', gap:14, padding:'0 28px', borderBottom:'1px solid rgba(75,85,99,0.35)', position:'sticky', top:0, zIndex:30, background:'rgba(17,24,39,0.75)', backdropFilter:'blur(12px)' }}>
        <img src="assets/field-mark.png" alt="Field" style={{ width:26, height:26, borderRadius:6 }} />
        <span style={{ fontFamily:"'Inter Display'", fontSize:15, fontWeight:700, letterSpacing:'0.14em', color:'rgb(249,250,251)' }}>FIELD</span>
        <span style={{ width:1, height:20, background:'rgba(75,85,99,0.6)' }}></span>
        <span style={{ fontFamily:'Inter', fontSize:12.5, color:'rgb(163,163,163)' }}>Distribution data onboarding</span>
        <span style={{ flex:1 }}></span>
        <span style={{ fontFamily:'Inter', fontSize:12, color:'rgb(163,163,163)' }}>{DP_CLIENT} · Client workspace</span>
      </div>

      <div style={{ flex:1, display:'flex', justifyContent:'center', padding:'40px 24px 130px' }}>
        <div style={{ width:'100%', maxWidth:920 }}>
          <ObStepper step={step} />

          {step === 0 && (
            <div style={{ animation:'obFadeUp 260ms ease-out both' }}>
              <h1 style={{ fontFamily:"'Inter Display'", fontSize:30, fontWeight:700, margin:'0 0 8px', color:'rgb(249,250,251)' }}>Welcome, {DP_CLIENT}</h1>
              <p style={{ fontFamily:'Inter', fontSize:13.5, color:'rgb(163,163,163)', lineHeight:1.6, margin:'0 0 28px', maxWidth:640 }}>Select the data packs you subscribe to. Each pack is a distribution data feed from a provider — you will choose a tier and upload the delivery files next.</p>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                {DP_PACKS.map(p => {
                  const sel = !!selected[p.id];
                  return (
                    <div key={p.id} onClick={() => setSelected(s => Object.assign({}, s, { [p.id]: !s[p.id] }))}
                      style={{ background:sel ? 'rgba(16,185,129,0.06)' : 'rgba(255,255,255,0.03)', border:'1px solid ' + (sel ? 'rgba(16,185,129,0.6)' : 'rgba(75,85,99,0.5)'), borderRadius:14, padding:'18px 20px', cursor:'pointer', transition:'border-color 150ms, background 150ms' }}>
                      <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
                        <div style={dpAvatar(p.id, 34)}>{dpInit(p)}</div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontFamily:'Inter', fontSize:14, fontWeight:600, color:'rgb(249,250,251)' }}>{p.name}</div>
                          <div style={{ fontFamily:'Inter', fontSize:11.5, color:'rgb(163,163,163)', marginTop:2 }}>{p.provider} · {p.vendorType}</div>
                        </div>
                        <div style={{ width:20, height:20, borderRadius:9999, flexShrink:0, border:sel ? 'none' : '1.5px solid rgba(107,114,128,0.8)', background:sel ? 'rgb(16,185,129)' : 'transparent', color:'rgb(6,24,17)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                          {sel && <i className="fa-solid fa-check" style={{ fontSize:10 }}></i>}
                        </div>
                      </div>
                      <div style={{ fontFamily:'Inter', fontSize:12, color:'rgb(163,163,163)', lineHeight:1.55, margin:'10px 0 12px' }}>{p.desc}</div>
                      <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                        {[p.grain + ' grain', p.cadence, 'Pattern ' + p.pattern].map(ch => (
                          <span key={ch} style={{ height:22, padding:'0 9px', borderRadius:9999, border:'1px solid rgba(75,85,99,0.5)', background:'rgba(255,255,255,0.03)', fontFamily:'Inter', fontSize:10.5, fontWeight:500, color:'rgb(209,213,219)', display:'inline-flex', alignItems:'center' }}>{ch}</span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {step === 1 && (
            <div style={{ animation:'obFadeUp 260ms ease-out both' }}>
              <h1 style={{ fontFamily:"'Inter Display'", fontSize:26, fontWeight:700, margin:'0 0 8px', color:'rgb(249,250,251)' }}>Choose your tiers</h1>
              <p style={{ fontFamily:'Inter', fontSize:13.5, color:'rgb(163,163,163)', lineHeight:1.6, margin:'0 0 26px', maxWidth:640 }}>Tiers control product scope, channel coverage, and delivery grain. You can upgrade any pack later from the Data Packs page.</p>
              {selectedIds.map(id => {
                const p = dpPack(id);
                return (
                  <div key={id} style={{ marginBottom:18, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(75,85,99,0.5)', borderRadius:14, padding:20 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                      <div style={dpAvatar(id, 30)}>{dpInit(p)}</div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontFamily:'Inter', fontSize:14, fontWeight:600, color:'rgb(249,250,251)' }}>{p.name}</div>
                        <div style={{ fontFamily:'Inter', fontSize:11.5, color:'rgb(163,163,163)' }}>{p.provider}</div>
                      </div>
                      <span style={{ fontFamily:'Inter', fontSize:11, color:'rgb(115,115,115)' }}>{p.grain} grain · Pattern {p.pattern}</span>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:14 }}>
                      {p.tiers.map(t => (
                        <DPTierRow key={t.n} tier={t} selected={(tiers[id] || 1) === t.n} onPick={() => setTiers(s => Object.assign({}, s, { [id]: t.n }))} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {step === 2 && (
            <div style={{ animation:'obFadeUp 260ms ease-out both' }}>
              <h1 style={{ fontFamily:"'Inter Display'", fontSize:26, fontWeight:700, margin:'0 0 8px', color:'rgb(249,250,251)' }}>Upload your delivery files</h1>
              <p style={{ fontFamily:'Inter', fontSize:13.5, color:'rgb(163,163,163)', lineHeight:1.6, margin:'0 0 26px', maxWidth:680 }}>Drop the latest delivery file for each pack. We validate the schema, detect the grain, and land it in your raw schema — {DP_DB}.</p>
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {selectedIds.map(id => {
                  const p = dpPack(id), t = dpTierOf(id, tiers), u = uploads[id] || { state:'idle' };
                  const st = u.state || 'idle';
                  const iconCls = st === 'done' ? 'fa-solid fa-circle-check' : st === 'uploading' ? 'fa-solid fa-circle-notch' : st === 'deferred' ? 'fa-solid fa-clock' : 'fa-solid fa-file-csv';
                  return (
                    <div key={id} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(75,85,99,0.5)', borderRadius:14, padding:'16px 20px', display:'flex', alignItems:'center', gap:16 }}>
                      <div style={{ width:38, height:38, borderRadius:10, flexShrink:0, background:st === 'done' ? 'rgba(16,185,129,0.14)' : 'rgba(255,255,255,0.05)', border:'1px solid ' + (st === 'done' ? 'rgba(16,185,129,0.45)' : 'rgba(75,85,99,0.5)'), display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <i className={iconCls} style={{ fontSize:15, color:st === 'done' ? 'rgb(52,211,153)' : st === 'deferred' ? 'rgb(234,179,8)' : 'rgb(163,163,163)', animation:st === 'uploading' ? 'obSpin 0.9s linear infinite' : 'none' }}></i>
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontFamily:'Inter', fontSize:13.5, fontWeight:600, color:'rgb(249,250,251)' }}>{p.name}</div>
                        <div style={{ fontFamily:'Inter', fontSize:11.5, color:'rgb(163,163,163)', marginTop:3 }}>CSV · {t.name} · {dpCadence(id, tiers).toLowerCase()} delivery · {DP_DB}.{p.schema}</div>
                        <div style={{ fontFamily:"'Geist Mono', monospace", fontSize:10.5, color:'rgb(115,115,115)', marginTop:3 }}>expected: {id}_tier{t.n}_2026-06.csv</div>
                      </div>
                      <div style={{ width:340, flexShrink:0 }}>
                        {(st === 'idle') && (
                          <div>
                            <DPUploadZone u={u} onStart={() => startUpload(id, undefined, tiers[id])} onDrop={(name) => startUpload(id, name, tiers[id])} />
                            <div style={{ textAlign:'center', marginTop:6 }}>
                              <button onClick={(e) => { e.stopPropagation(); setUploads(s => Object.assign({}, s, { [id]: { state:'deferred' } })); }} style={{ background:'transparent', border:'none', cursor:'pointer', fontFamily:'Inter', fontSize:11, color:'rgb(115,115,115)', textDecoration:'underline', textUnderlineOffset:3 }}>Upload later</button>
                            </div>
                          </div>
                        )}
                        {st === 'uploading' && <DPUploadZone u={u} />}
                        {st === 'done' && (
                          <div>
                            <div style={{ fontFamily:'Inter', fontSize:12, color:'rgb(52,211,153)', fontWeight:500 }}><i className="fa-solid fa-circle-check" style={{ marginRight:7 }}></i>Schema valid · grain detected</div>
                            <div style={{ fontFamily:'Inter', fontSize:11.5, color:'rgb(163,163,163)', marginTop:4 }}>{dpFmt(u.rows)} rows · {dpFmt(u.units)} {u.unit} · {p.grain} grain</div>
                            <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:4 }}>
                              <span style={{ fontFamily:"'Geist Mono', monospace", fontSize:10.5, color:'rgb(115,115,115)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{u.file}</span>
                              <button onClick={() => startUpload(id, undefined, tiers[id])} style={{ background:'transparent', border:'none', cursor:'pointer', fontFamily:'Inter', fontSize:11, color:'rgb(52,211,153)', padding:0 }}>Replace</button>
                            </div>
                          </div>
                        )}
                        {st === 'deferred' && (
                          <div>
                            <div style={{ fontFamily:'Inter', fontSize:12, color:'rgb(234,179,8)' }}><i className="fa-solid fa-clock" style={{ marginRight:7 }}></i>Marked for later upload</div>
                            <div style={{ marginTop:6 }}>
                              <button onClick={() => setUploads(s => Object.assign({}, s, { [id]: { state:'idle' } }))} style={{ background:'transparent', border:'1px solid rgba(75,85,99,0.6)', borderRadius:6, height:26, padding:'0 10px', cursor:'pointer', fontFamily:'Inter', fontSize:11, color:'rgb(209,213,219)' }}>Upload now</button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {step === 3 && (
            <div style={{ animation:'obFadeUp 260ms ease-out both', display:'flex', flexDirection:'column', alignItems:'center', paddingTop:16 }}>
              <div style={{ width:56, height:56, borderRadius:9999, background:'rgba(16,185,129,0.14)', border:'1px solid rgba(16,185,129,0.5)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:18 }}>
                <i className="fa-solid fa-check" style={{ fontSize:22, color:'rgb(52,211,153)' }}></i>
              </div>
              <h1 style={{ fontFamily:"'Inter Display'", fontSize:28, fontWeight:700, margin:'0 0 8px', color:'rgb(249,250,251)' }}>Your data plane is live</h1>
              <p style={{ fontFamily:'Inter', fontSize:13.5, color:'rgb(163,163,163)', margin:'0 0 28px' }}>{selectedIds.length} data packs configured for {DP_CLIENT} · {doneCount} delivery file{doneCount === 1 ? '' : 's'} loaded into {DP_DB}</p>
              <div style={{ width:'100%', maxWidth:640, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(75,85,99,0.5)', borderRadius:14, overflow:'hidden', marginBottom:28 }}>
                {selectedIds.map(id => {
                  const p = dpPack(id), t = dpTierOf(id, tiers), u = uploads[id] || {};
                  return (
                    <div key={id} style={{ display:'flex', alignItems:'center', gap:12, padding:'13px 18px', borderBottom:'1px solid rgba(75,85,99,0.3)' }}>
                      <div style={{ flex:1, minWidth:0 }}>
                        <span style={{ fontFamily:'Inter', fontSize:13, fontWeight:600, color:'rgb(249,250,251)' }}>{p.name}</span>
                        <span style={{ fontFamily:'Inter', fontSize:11.5, color:'rgb(163,163,163)' }}> · {t.name} · {dpCadence(id, tiers)}</span>
                      </div>
                      <span style={{ fontFamily:'Inter', fontSize:11.5, color:'rgb(163,163,163)' }}>{u.state === 'done' ? dpFmt(u.rows) + ' rows' : 'awaiting file'}</span>
                    </div>
                  );
                })}
              </div>
              <button onClick={goDashboard} className="ob-cta" style={{ height:42, padding:'0 26px', borderRadius:9, border:'none', background:'rgb(16,185,129)', color:'rgb(6,24,17)', fontFamily:'Inter', fontSize:13.5, fontWeight:600, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:10 }}>Go to your dashboard<i className="fa-solid fa-arrow-right" style={{ fontSize:12 }}></i></button>
              <div style={{ fontFamily:'Inter', fontSize:11.5, color:'rgb(115,115,115)', marginTop:14 }}>You can edit tiers, re-upload files, and add packs anytime in Data Packs.</div>
            </div>
          )}
        </div>
      </div>

      {step < 3 && (
        <div style={{ position:'fixed', left:0, right:0, bottom:0, zIndex:40, background:'rgba(17,24,39,0.9)', backdropFilter:'blur(12px)', borderTop:'1px solid rgba(75,85,99,0.4)', padding:'14px 28px', display:'flex', alignItems:'center', gap:16 }}>
          {step > 0 && (
            <button onClick={() => setStep(step - 1)} style={{ height:36, padding:'0 16px', borderRadius:8, border:'1px solid rgba(75,85,99,0.7)', background:'rgba(0,0,0,0.25)', color:'rgb(209,213,219)', fontFamily:'Inter', fontSize:12.5, fontWeight:500, cursor:'pointer' }}>Back</button>
          )}
          <span style={{ fontFamily:'Inter', fontSize:12, color:'rgb(163,163,163)' }}>{footerSummaries[step]}</span>
          <span style={{ flex:1 }}></span>
          <button onClick={() => { if (canContinue) setStep(step + 1); }} style={{ height:36, padding:'0 18px', borderRadius:8, border:'none', background:canContinue ? 'rgb(16,185,129)' : 'rgba(16,185,129,0.25)', color:canContinue ? 'rgb(6,24,17)' : 'rgba(255,255,255,0.45)', fontFamily:'Inter', fontSize:13, fontWeight:600, cursor:canContinue ? 'pointer' : 'default', display:'inline-flex', alignItems:'center' }}>{contLabels[step]}<i className="fa-solid fa-arrow-right" style={{ fontSize:11, marginLeft:9 }}></i></button>
        </div>
      )}
    </div>
  );
}
Object.assign(window, { OnboardingApp });
