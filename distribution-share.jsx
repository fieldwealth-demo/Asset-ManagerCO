/* Distribution Intelligence — "Share opportunity" flow.
   Opens from any RIA Practice Summary row; composes a signal-backed outreach
   package addressed to the practice's contacts. */

const DIST_SHARE_CHANNELS = [
  { id:'email',  label:'Email',            icon:'envelope',        note:'Sends from your Field address' },
  { id:'crm',    label:'CRM task',         icon:'bullseye',        note:'Logs an activity on the account' },
  { id:'teams',  label:'Teams message',    icon:'comment-dots',    note:'DMs the covering wholesaler' },
];

function distGenericContacts(p) {
  return [
    { name:'John Doe',  role:'Managing Partner',     email:'jdoe@' + p.id + '.example' },
    { name:'Jane Doe',  role:'Director of Research', email:'jane.doe@' + p.id + '.example' },
  ];
}

function distShareBody(p, sigs, oppMin, oppMax) {
  const lead = sigs[0];
  return [
    'Hi ' + p.name + ' team,',
    '',
    'Based on your book profile (' + p.clients + ' clients · ' + distFmtM(p.aum) + ' AUM · ' + p.qp + '% QP), we flagged ' +
      sigs.length + ' allocation ' + (sigs.length === 1 ? 'signal' : 'signals') + ' worth ' + distFmtM(oppMin) + '–' + distFmtM(oppMax) + ' in estimated opportunity.',
    '',
    lead ? '• ' + lead.type + ' — ' + lead.clients + ' eligible clients, ' + distFmtM(lead.oppMin) + '–' + distFmtM(lead.oppMax) + ' est. opportunity.' : '',
    '',
    'Happy to walk through the underlying methodology and a proposed allocation.',
  ].filter(l => l !== undefined).join('\n');
}

function DistShareModal({ practice: p, sigs, onClose, onSent }) {
  const link = p.firmLink;
  const contacts = (link && link.contacts) || distGenericContacts(p);
  const [picked, setPicked] = React.useState(() => sigs.map(s => s.type));
  const [to, setTo] = React.useState(() => contacts.slice(0, 1).map(c => c.email));
  const [channel, setChannel] = React.useState('email');
  const [phase, setPhase] = React.useState('compose');
  const chosen = sigs.filter(s => picked.indexOf(s.type) !== -1);
  const oppMin = chosen.reduce((a, s) => a + s.oppMin, 0);
  const oppMax = chosen.reduce((a, s) => a + s.oppMax, 0);
  const [body, setBody] = React.useState(() => distShareBody(p, sigs, sigs.reduce((a,s)=>a+s.oppMin,0), sigs.reduce((a,s)=>a+s.oppMax,0)));
  const canSend = chosen.length > 0 && to.length > 0;

  const send = () => {
    if (!canSend) return;
    setPhase('sending');
    setTimeout(() => { setPhase('sent'); onSent && onSent(p.id); }, 1150);
  };
  const toggle = (arr, set, v) => set(arr.indexOf(v) === -1 ? arr.concat([v]) : arr.filter(x => x !== v));

  const label = { fontFamily:'Inter', fontSize:9.5, fontWeight:700, letterSpacing:0.6, textTransform:'uppercase', color:'rgb(200,205,213)', marginBottom:8 };

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:80 }} />
      <div style={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:620, maxWidth:'94vw', maxHeight:'88vh', overflowY:'auto', zIndex:81,
        background:'rgb(17,24,39)', border:'1px solid rgba(75,85,99,0.7)', borderRadius:14, boxShadow:'0 24px 64px rgba(0,0,0,0.55)' }}>

        <div style={{ display:'flex', alignItems:'flex-start', gap:12, padding:'18px 20px 14px', borderBottom:'1px solid rgba(75,85,99,0.4)' }}>
          <span style={{ width:34, height:34, flexShrink:0, borderRadius:9, background:'rgba(16,185,129,0.14)', border:'1px solid rgba(16,185,129,0.4)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <i className="fa-solid fa-paper-plane" style={{ fontSize:13, color:'rgb(52,211,153)' }} />
          </span>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontFamily:'Inter Display, Inter', fontSize:15.5, fontWeight:700, color:'rgb(249,250,251)' }}>Share opportunity — {p.name}</div>
            <div style={{ fontFamily:'Inter', fontSize:11, color:'rgb(163,163,163)', marginTop:2 }}>
              {p.city}, {p.state}{link ? ' · ' + link.firm + ' · ' + link.channel : ''} · {p.clients} clients · {distFmtM(p.aum)} AUM
            </div>
          </div>
          <button onClick={onClose} style={{ width:28, height:28, flexShrink:0, borderRadius:7, border:'1px solid rgba(75,85,99,0.6)', background:'transparent', color:'rgb(163,163,163)', cursor:'pointer' }}>
            <i className="fa-solid fa-xmark" style={{ fontSize:12 }} />
          </button>
        </div>

        {phase === 'sent' ? (
          <div style={{ padding:'34px 26px 30px', textAlign:'center' }}>
            <div style={{ width:50, height:50, margin:'0 auto 16px', borderRadius:9999, background:'rgba(16,185,129,0.14)', border:'1px solid rgba(16,185,129,0.5)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <i className="fa-solid fa-check" style={{ fontSize:20, color:'rgb(52,211,153)' }} />
            </div>
            <div style={{ fontFamily:'Inter Display, Inter', fontSize:17, fontWeight:700, color:'rgb(249,250,251)' }}>Opportunity shared</div>
            <div style={{ fontFamily:'Inter', fontSize:12.5, color:'rgb(163,163,163)', marginTop:7, lineHeight:1.6 }}>
              {chosen.length} signal{chosen.length !== 1 ? 's' : ''} · {distFmtM(oppMin)}–{distFmtM(oppMax)} est. opportunity sent to {to.length} contact{to.length !== 1 ? 's' : ''} at {p.name}.
            </div>
            <div style={{ fontFamily:'Inter', fontSize:11, color:'rgb(107,114,128)', marginTop:6 }}>Logged to the account timeline.</div>
            <button onClick={onClose} style={{ marginTop:22, height:36, padding:'0 20px', borderRadius:8, border:'none', background:'rgb(16,185,129)', color:'rgb(6,24,17)', fontFamily:'Inter', fontSize:12.5, fontWeight:600, cursor:'pointer' }}>Done</button>
          </div>
        ) : (
          <>
            <div style={{ padding:'16px 20px', display:'flex', flexDirection:'column', gap:20 }}>
              {link && (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
                  {[['Total opportunity', link.totalOpp, 'rgb(52,211,153)'], ['Your book', link.yourBook, 'rgb(249,250,251)'], ['Share of wallet', link.share, 'rgb(249,250,251)']].map(([k, v, c]) => (
                    <div key={k} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(75,85,99,0.45)', borderRadius:9, padding:'10px 12px' }}>
                      <div style={{ fontFamily:'Inter', fontSize:9.5, fontWeight:600, letterSpacing:0.5, textTransform:'uppercase', color:'rgb(200,205,213)' }}>{k}</div>
                      <div style={{ fontFamily:'Inter Display, Inter', fontSize:17, fontWeight:700, color:c, marginTop:4, fontVariantNumeric:'tabular-nums' }}>{v}</div>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <div style={label}>Signals to include</div>
                <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                  {sigs.map(s => {
                    const sm = DIST_SIG_META[s.type];
                    const on = picked.indexOf(s.type) !== -1;
                    return (
                      <div key={s.type} onClick={() => toggle(picked, setPicked, s.type)} style={{ display:'flex', alignItems:'center', gap:11, padding:'10px 12px', borderRadius:9, cursor:'pointer',
                        border:'1px solid ' + (on ? 'rgba(16,185,129,0.55)' : 'rgba(75,85,99,0.45)'), background: on ? 'rgba(16,185,129,0.07)' : 'rgba(0,0,0,0.18)', transition:'all .12s' }}>
                        <span style={{ width:16, height:16, flexShrink:0, borderRadius:4, border: on ? 'none' : '1.5px solid rgba(107,114,128,0.8)', background: on ? 'rgb(16,185,129)' : 'transparent', color:'rgb(6,24,17)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                          {on && <i className="fa-solid fa-check" style={{ fontSize:9 }} />}
                        </span>
                        <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'2px 8px', borderRadius:9999, fontSize:9.5, fontWeight:700, flexShrink:0,
                          background: sm.dot.replace('rgb','rgba').replace(')',',0.14)'), color:sm.dot, border:'1px solid ' + sm.dot.replace('rgb','rgba').replace(')',',0.3)') }}>
                          <i className={'fa-solid fa-' + sm.icon} style={{ fontSize:8.5 }} />{s.type}
                        </span>
                        <span style={{ flex:1, fontFamily:'Inter', fontSize:11, color:'rgb(163,163,163)' }}>{s.clients} eligible clients</span>
                        <span style={{ fontFamily:'Inter', fontSize:11.5, fontWeight:700, color:'rgb(52,211,153)', fontVariantNumeric:'tabular-nums' }}>{distFmtM(s.oppMin)}–{distFmtM(s.oppMax)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <div style={label}>Send to</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
                  {contacts.map(c => {
                    const on = to.indexOf(c.email) !== -1;
                    return (
                      <button key={c.email} onClick={() => toggle(to, setTo, c.email)} style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'7px 11px', borderRadius:9999, cursor:'pointer',
                        border:'1px solid ' + (on ? 'rgba(16,185,129,0.55)' : 'rgba(75,85,99,0.45)'), background: on ? 'rgba(16,185,129,0.1)' : 'rgba(0,0,0,0.18)', transition:'all .12s' }}>
                        <span style={{ width:20, height:20, borderRadius:9999, background:'rgba(255,255,255,0.07)', fontFamily:'Inter', fontSize:8.5, fontWeight:700, color:'rgb(209,213,219)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                          {c.name.split(' ').map(w => w[0]).join('')}
                        </span>
                        <span style={{ textAlign:'left' }}>
                          <span style={{ display:'block', fontFamily:'Inter', fontSize:11.5, fontWeight:600, color: on ? 'rgb(249,250,251)' : 'rgb(209,213,219)' }}>{c.name}</span>
                          <span style={{ display:'block', fontFamily:'Inter', fontSize:9.5, color:'rgb(107,114,128)' }}>{c.role}</span>
                        </span>
                        {on && <i className="fa-solid fa-check" style={{ fontSize:9, color:'rgb(52,211,153)' }} />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div style={label}>Deliver via</div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
                  {DIST_SHARE_CHANNELS.map(ch => {
                    const on = channel === ch.id;
                    return (
                      <button key={ch.id} onClick={() => setChannel(ch.id)} style={{ padding:'10px 11px', borderRadius:9, cursor:'pointer', textAlign:'left',
                        border:'1px solid ' + (on ? 'rgba(16,185,129,0.55)' : 'rgba(75,85,99,0.45)'), background: on ? 'rgba(16,185,129,0.07)' : 'rgba(0,0,0,0.18)', transition:'all .12s' }}>
                        <i className={'fa-solid fa-' + ch.icon} style={{ fontSize:11, color: on ? 'rgb(52,211,153)' : 'rgb(163,163,163)' }} />
                        <div style={{ fontFamily:'Inter', fontSize:11.5, fontWeight:600, color:'rgb(249,250,251)', marginTop:6 }}>{ch.label}</div>
                        <div style={{ fontFamily:'Inter', fontSize:9.5, color:'rgb(107,114,128)', marginTop:2, lineHeight:1.4 }}>{ch.note}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div style={label}>Message</div>
                <textarea value={body} onChange={e => setBody(e.target.value)} rows={7} style={{ width:'100%', boxSizing:'border-box', resize:'vertical',
                  background:'rgba(0,0,0,0.25)', border:'1px solid rgba(75,85,99,0.5)', borderRadius:9, padding:'11px 13px',
                  fontFamily:'Inter', fontSize:11.5, lineHeight:1.65, color:'rgb(229,231,235)', outline:'none' }} />
              </div>
            </div>

            <div style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 20px', borderTop:'1px solid rgba(75,85,99,0.4)', position:'sticky', bottom:0, background:'rgb(17,24,39)' }}>
              <span style={{ fontFamily:'Inter', fontSize:11.5, color:'rgb(163,163,163)' }}>
                {chosen.length} signal{chosen.length !== 1 ? 's' : ''} · <strong style={{ color:'rgb(52,211,153)', fontWeight:700 }}>{distFmtM(oppMin)}–{distFmtM(oppMax)}</strong> · {to.length} recipient{to.length !== 1 ? 's' : ''}
              </span>
              <span style={{ flex:1 }} />
              <button onClick={onClose} style={{ height:34, padding:'0 14px', borderRadius:8, border:'1px solid rgba(75,85,99,0.7)', background:'transparent', color:'rgb(209,213,219)', fontFamily:'Inter', fontSize:12, fontWeight:500, cursor:'pointer' }}>Cancel</button>
              <button onClick={send} disabled={!canSend || phase === 'sending'} style={{ height:34, padding:'0 18px', borderRadius:8, border:'none', display:'inline-flex', alignItems:'center', gap:8,
                background: canSend ? 'rgb(16,185,129)' : 'rgba(16,185,129,0.25)', color: canSend ? 'rgb(6,24,17)' : 'rgba(255,255,255,0.45)',
                fontFamily:'Inter', fontSize:12.5, fontWeight:600, cursor: canSend && phase !== 'sending' ? 'pointer' : 'default' }}>
                {phase === 'sending'
                  ? <><i className="fa-solid fa-circle-notch" style={{ fontSize:11, animation:'obSpin .9s linear infinite' }} />Sending…</>
                  : <><i className="fa-solid fa-paper-plane" style={{ fontSize:11 }} />Share opportunity</>}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

function DistShareButton({ onClick, shared }) {
  const [hover, setHover] = React.useState(false);
  return (
    <button onClick={onClick} title={shared ? 'Shared — send again' : 'Share this opportunity with the practice'}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ height:26, padding:'0 9px', borderRadius:6, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:6, whiteSpace:'nowrap',
        border:'1px solid ' + (shared ? 'rgba(16,185,129,0.55)' : hover ? 'rgb(16,185,129)' : 'rgba(75,85,99,0.55)'),
        background: shared ? 'rgba(16,185,129,0.12)' : hover ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.03)',
        color: shared || hover ? 'rgb(52,211,153)' : 'rgb(163,163,163)',
        fontFamily:'Inter', fontSize:10.5, fontWeight:600, transition:'all .12s' }}>
      <i className={'fa-solid fa-' + (shared ? 'check' : 'paper-plane')} style={{ fontSize:10 }} />{shared ? 'Shared' : 'Share'}
    </button>
  );
}

Object.assign(window, { DistShareModal, DistShareButton, DIST_SHARE_CHANNELS });
