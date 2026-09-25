/* Home — AI assistant greeting screen */

function HomePage({ onNav, onAIAction, subs, onSubscribe, onReadEmail, level }) {
  const [msg, setMsg] = React.useState('');
  const [aiActive, setAIActive] = React.useState(false);
  const [aiPrompt, setAIPrompt] = React.useState('');
  const [chatMsg, setChatMsg] = React.useState('');
  const [history, setHistory] = React.useState([]);
  const [historyOpen, setHistoryOpen] = React.useState(false);

  const recordPrompt = (text) => {
    setHistory(prev => {
      const stamp = { text, when: new Date() };
      // de-dupe consecutive identical prompts
      if (prev[0] && prev[0].text === text) return prev;
      return [stamp, ...prev].slice(0, 20);
    });
  };

  const submitPrompt = (text) => {
    const t = (text || '').trim();
    if (!t) return;
    recordPrompt(t);
    setAIPrompt(t);
    setAIActive(true);
    setChatMsg('');
    setHistoryOpen(false);
  };

  const startNewChat = () => {
    setAIActive(false);
    setAIPrompt('');
    setChatMsg('');
    setMsg('');
    setHistoryOpen(false);
  };

  const [hdrSlot, setHdrSlot] = React.useState(null);
  React.useEffect(() => { setHdrSlot(document.getElementById('askfield-hdr-slot')); }, []);
  const histBtn = hdrSlot && (aiActive || history.length > 0) ? ReactDOM.createPortal(
    <button onClick={() => { if (!aiActive && history[0]) submitPrompt(history[0].text); setHistoryOpen(true); }} style={{ ...pillBtn(historyOpen) }} title="Recent chats">
      <i className="fa-solid fa-clock-rotate-left" style={{ fontSize:10 }} /> History
      {history.length > 0 && <span style={{ marginLeft:2, padding:'1px 6px', borderRadius:9999, background:'rgba(16,185,129,0.18)', color:'rgb(52,211,153)', fontFamily:'Inter', fontSize:10, fontWeight:600 }}>{history.length}</span>}
    </button>, hdrSlot) : null;

  // ---- AI active view: content + left history rail (fixed) + sticky bottom composer
  if (aiActive) {
    return (
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        position: 'relative', minHeight: 0, overflowY: 'auto',
      }} className="af-scroll">
        {historyOpen && (
          <HistorySidePanel
            items={history}
            activeText={aiPrompt}
            onPick={(t) => { submitPrompt(t); }}
            onClose={() => setHistoryOpen(false)}
            onClear={() => setHistory([])}
            onNewChat={startNewChat}
          />
        )}

        {/* History sits beside the Ask Field header; New chat is highlighted so
           it is obvious how to clear the answer and start over. */}
        {!historyOpen && histBtn}
        <button
          onClick={startNewChat}
          className="af-newchat"
          style={{ ...pillBtn(true), height: 30, padding: '0 14px', fontSize: 12, fontWeight: 600, background: 'rgb(16,185,129)', border: '1px solid rgb(52,211,153)', color: '#fff', position:'fixed', top:70, right:20, zIndex:22 }}
          title="Clear this answer and start a new chat">
          <style>{'@keyframes afPulse{0%{box-shadow:0 0 0 0 rgba(16,185,129,.6)}70%{box-shadow:0 0 0 10px rgba(16,185,129,0)}100%{box-shadow:0 0 0 0 rgba(16,185,129,0)}}.af-newchat{animation:afPulse 1.6s ease-out 3}.af-newchat:hover{background:rgb(5,150,105)!important}'}</style>
          <i className="fa-solid fa-pen-to-square" style={{ fontSize:11 }} /> New chat
        </button>

        {/* Top spacer so the result panel doesn't sit under the fixed buttons */}
        <div style={{ height: 16 }} />

        {/* Result body */}
        <div style={{
          padding:'18px 40px 24px',
          display:'flex', justifyContent:'center',
        }}>
          <div style={{ width:'100%', maxWidth:920 }}>
            <AIInsightsPanel
              prompt={aiPrompt}
              onNav={onNav}
              onClient={(client) => onAIAction && onAIAction({ id:'openClient', client })}
              onViewProfile={() => onAIAction && onAIAction('viewPolkProfile')}
              onCreateMaterial={() => onAIAction && onAIAction('createMaterial')}
              onScheduleMeeting={() => onAIAction && onAIAction('scheduleMeeting')}
            />
          </div>
        </div>

        {/* Sticky bottom area — background matches the top bar */}
        <div style={{
          position:'sticky', bottom:0, marginTop:'auto', zIndex:30,
          padding:'12px 40px 18px',
          borderTop:'1px solid rgba(75,85,99,0.3)',
          background:'rgba(31, 41, 55, 0.85)',
          backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)',
        }}>
          <div style={{
            width:'100%', maxWidth:920, margin:'0 auto',
            background:'rgba(255,255,255,0.04)',
            border:'1px solid rgba(75,85,99,0.5)', borderRadius:14, padding:'12px 14px 10px',
            display:'flex', flexDirection:'column', gap:10,
          }}>
            <textarea
              value={chatMsg}
              onChange={(e) => setChatMsg(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitPrompt(chatMsg); } }}
              placeholder="Ask a follow-up…"
              rows={1}
              style={{
                width: '100%', background: 'transparent', border: 'none', resize: 'none',
                color: 'rgb(249,250,251)', fontFamily: 'Inter', fontSize: 13.5, outline: 'none',
                minHeight: 22,
              }}
            />
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <button style={{
                width:26, height:26, borderRadius:6, border:'none',
                background:'transparent', color:'rgb(163,163,163)', cursor:'pointer',
                display:'flex', alignItems:'center', justifyContent:'center',
              }} title="Attach">
                <i className="fa-solid fa-paperclip" style={{ fontSize:12 }} />
              </button>
              <div style={{ display:'flex', gap:6, flex:1, flexWrap:'wrap' }}>
                {[
                  'Filter to Northeast region',
                  'Show similar opps in Mid-Cap Growth',
                  'Compare Doe vs Smith Group',
                ].map((p,i) => (
                  <button key={i} onClick={() => setChatMsg(p)} style={{
                    height:24, padding:'0 10px', borderRadius:9999,
                    background:'rgba(255,255,255,0.025)', border:'1px solid rgba(75,85,99,0.4)',
                    color:'rgb(163,163,163)', fontFamily:'Inter', fontSize:11, cursor:'pointer',
                  }}>{p}</button>
                ))}
              </div>
              <button onClick={() => submitPrompt(chatMsg)} style={{
                width:28, height:28, borderRadius:7, border:'none',
                background: chatMsg ? 'rgb(16,185,129)' : 'rgba(16,185,129,0.3)',
                color: '#fff', cursor: chatMsg ? 'pointer' : 'default',
                display:'flex', alignItems:'center', justifyContent:'center',
              }} title="Send">
                <i className="fa-solid fa-paper-plane" style={{ fontSize:11 }} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---- Default view: composer over the asset-manager feed
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', minHeight: 0, overflowY: 'auto',
      padding: '48px 40px 80px', gap: 28,
    }} className="af-scroll">
      {histBtn}
      <h1 style={{
        fontFamily: 'Inter Display, Inter', fontWeight: 500, fontSize: 48,
        color: 'rgb(249,250,251)', margin: 0, letterSpacing: '-0.02em',
      }}>Ask Field</h1>

      <div style={{
        width: 620, maxWidth: '100%', background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(75,85,99,0.5)', borderRadius: 14, padding: '16px 16px 12px',
        display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        <textarea
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          placeholder="Write your message here…"
          rows={2}
          style={{
            width: '100%', background: 'transparent', border: 'none', resize: 'none',
            color: 'rgb(249,250,251)', fontFamily: 'Inter', fontSize: 14, outline: 'none',
            minHeight: 46,
          }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button title="Attach a list to match against Field data — event lists, target lists, prospect files" style={{
            width: 28, height: 28, borderRadius: 6, border: 'none',
            background: 'transparent', color: 'rgb(163,163,163)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <i className="fa-solid fa-paperclip" style={{ fontSize: 13 }} />
          </button>
          <span style={{ fontFamily:'Inter', fontSize:11, color:'rgb(107,114,128)' }}>Attach a list to match against Field data</span>
          <div style={{ flex: 1 }} />
          <button onClick={() => submitPrompt(msg)} style={{
            width: 30, height: 30, borderRadius: 8, border: 'none',
            background: msg ? 'rgb(16,185,129)' : 'rgba(16,185,129,0.3)',
            color: '#fff', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <i className="fa-solid fa-paper-plane" style={{ fontSize: 12 }} />
          </button>
        </div>
      </div>

      <HomeSuggestions level={level} onPick={submitPrompt} />
    </div>
  );
}

/* Signal prompts follow what the subscription can deliver: Level 1 is
   opportunity + competitive advantage from the data packs, Level 2 adds the
   firm's own sales and CRM activity, Level 3 adds segmentation and the
   predictive / prescriptive signal models. */
const HOME_SIGNALS = {
  1: { note: 'Opportunity and competitive advantage', items: [
    ['trophy', 'Where do we have a Strong competitive advantage but under 10% share?'],
    ['bullseye', 'Top 10 FA/Teams by opportunity where our market share is lowest'],
    ['arrow-trend-up', 'Which categories are taking flows where our funds rank top quartile?'],
    ['building-columns', 'Which firms hold the most opportunity in our focus categories?'],
  ] },
  2: { note: 'Opportunity, plus your sales and CRM activity', items: [
    ['user-clock', 'Which top-opportunity FA/Teams have had no meeting in 90 days?'],
    ['arrow-trend-down', 'Which producers slowed their sales this quarter?'],
    ['video', 'Which webinar attendees have not had a follow-up inside 48 hours?'],
    ['handshake', 'Where is activity high but sales lift low?'],
  ] },
  3: { note: 'Full signals with predictive and prescriptive models', items: [
    ['phone', 'Who should I call first today, and what should I lead with?'],
    ['shield-exclamation', 'Where are my Retention Risk signals, and how much AUM is exposed?'],
    ['wave-pulse', 'Which Segment A prospects are most likely to buy Core Plus?'],
    ['wand-magic-sparkles', 'Which next best actions are most likely to convert this month?'],
  ] },
};
const HOME_POPULAR = [
  ['fire', 'What are my top client opportunities in Large Blend?'],
  ['users', "Who are my top producers I haven't met this quarter?"],
  ['chart-pie', 'Where am I losing share in Intermediate Core-Plus?'],
  ['building', 'Which firms drove our YTD sales growth?'],
];

function HomeSuggestions({ onPick, level = 3 }) {
  const sig = HOME_SIGNALS[level] || HOME_SIGNALS[3];
  const row = (title, icon, note, items, accent) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'Inter', fontSize: 10, fontWeight: 600, color: 'rgb(200,205,213)', letterSpacing: 0.8, textTransform: 'uppercase' }}>
        <i className={`fa-solid fa-${icon}`} style={{ fontSize: 10, color: accent }} />{title}
        {note && <span style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 400, color: 'rgb(107,114,128)' }}>· {note}</span>}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: 8 }}>
        {items.map(([ic, t]) => (
          <button key={t} onClick={() => onPick(t)} className="home-sugg" style={{
            display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10, textAlign: 'left',
            padding: '12px 13px', borderRadius: 10, cursor: 'pointer', minHeight: 92,
            background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(75,85,99,0.45)',
            color: 'rgb(209,213,219)', fontFamily: 'Inter', fontSize: 12.5, lineHeight: 1.4,
          }}>
            <i className={`fa-solid fa-${ic}`} style={{ fontSize: 12, color: accent }} />
            <span style={{ textWrap: 'pretty' }}>{t}</span>
          </button>
        ))}
      </div>
    </div>
  );
  return (
    <div style={{ width: 860, maxWidth: '100%', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <style>{`.home-sugg:hover{background:rgba(16,185,129,0.08)!important;border-color:rgba(16,185,129,0.45)!important;color:rgb(249,250,251)!important}`}</style>
      {row(`Signals · Level ${level}`, 'satellite-dish', sig.note, sig.items, 'rgb(52,211,153)')}
      {row('Popular in your company', 'fire', null, HOME_POPULAR, 'rgb(156,163,175)')}
    </div>
  );
}

window.HomePage = HomePage;

/* ---- small helpers / sub-components for the AI active view ---- */
function pillBtn(active) {
  return {
    height:26, padding:'0 10px', borderRadius:9999,
    background: active ? 'rgba(16,185,129,0.16)' : 'rgba(255,255,255,0.04)',
    border: active ? '1px solid rgba(16,185,129,0.45)' : '1px solid rgba(75,85,99,0.5)',
    color: active ? 'rgb(52,211,153)' : 'rgb(209,213,219)',
    fontFamily:'Inter', fontSize:11.5, fontWeight:500, cursor:'pointer',
    display:'inline-flex', alignItems:'center', gap:6, whiteSpace:'nowrap',
  };
}

function fmtWhen(d) {
  if (!d) return '';
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  return d.toLocaleDateString();
}

function HistorySidePanel({ items, activeText, onPick, onClose, onClear, onNewChat }) {
  // Fixed full-height rail that docks next to the 56px nav sidebar.
  return (
    <aside style={{
      position:'fixed', top:56, bottom:0, left:56, width:280, zIndex:18,
      background:'transparent',
      borderRight:'1px solid rgba(75,85,99,0.4)',
      padding:'14px 12px 12px',
      display:'flex', flexDirection:'column', gap:8,
    }}>
      <div style={{ display:'flex', alignItems:'center', gap:6, padding:'2px 4px 6px' }}>
        <i className="fa-solid fa-clock-rotate-left" style={{ fontSize:11, color:'rgb(163,163,163)' }} />
        <div style={{
          fontFamily:'Inter', fontSize:11, fontWeight:600,
          color:'rgb(229,231,235)', textTransform:'uppercase', letterSpacing:'0.06em',
        }}>Recent chats</div>
        <div style={{ flex:1 }} />
        <button onClick={onClose} title="Close" style={{
          width:22, height:22, borderRadius:5, border:'none',
          background:'transparent', color:'rgb(163,163,163)', cursor:'pointer',
          display:'inline-flex', alignItems:'center', justifyContent:'center',
        }}><i className="fa-solid fa-xmark" style={{ fontSize:11 }} /></button>
      </div>

      <div style={{
        flex:1, minHeight:0, overflowY:'auto',
        display:'flex', flexDirection:'column', gap:2,
        paddingRight:2,
      }}>
        {items.length === 0 && (
          <div style={{
            padding:'24px 12px', textAlign:'center',
            fontFamily:'Inter', fontSize:11.5, color:'rgb(115,115,115)',
          }}>No chats yet.</div>
        )}
        {items.map((it, i) => {
          const isActive = it.text === activeText;
          return (
            <button key={i} onClick={() => onPick(it.text)} style={{
              textAlign:'left', cursor:'pointer',
              display:'flex', flexDirection:'column', gap:3,
              padding:'9px 10px', borderRadius:8,
              background: isActive ? 'rgba(16,185,129,0.10)' : 'transparent',
              border: isActive ? '1px solid rgba(16,185,129,0.35)' : '1px solid transparent',
              fontFamily:'Inter',
            }}
            onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
            onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}>
              <span style={{
                fontSize:12.5, color:'rgb(229,231,235)', lineHeight:1.4,
                display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden',
              }}>{it.text}</span>
              <span style={{ fontSize:10.5, color:'rgb(115,115,115)' }}>
                <i className="fa-solid fa-clock" style={{ fontSize:9, marginRight:5 }} />
                {fmtWhen(it.when)}
              </span>
            </button>
          );
        })}
      </div>

      {items.length > 0 && (
        <button onClick={onClear} style={{
          background:'transparent', border:'none', cursor:'pointer',
          color:'rgb(163,163,163)', fontFamily:'Inter', fontSize:11,
          padding:'6px 4px 2px', textAlign:'left',
        }}>Clear history</button>
      )}
    </aside>
  );
}
