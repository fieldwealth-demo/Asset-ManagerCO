import { Nav, I, Toast, Avatar, FieldGlyph, Sheet } from './ui.jsx';
import { AskScreen, useChat, SUGGESTED, MORE } from './ask.jsx';
import { BriefScreen } from './brief.jsx';
import { TeamScreen } from './team.jsx';
const { useCallback, useEffect, useMemo, useRef, useState } = React;

const VIEWS = [['ask', 'Ask'], ['brief', 'Brief'], ['review', 'Review']];

/* Left drawer: the Field mark opens recent chats. */
function Drawer({ open, onClose, chat, onPick, onNew }) {
  useEffect(() => {
    if (!open) return;
    const k = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [open, onClose]);
  const { msgs, history, curId, busy } = chat;
  const items = [...(msgs.length ? [{ id: curId, title: msgs[0].text, cur: true }] : []), ...history];
  return (
    <div className={`drawer-wrap${open ? ' open' : ''}`} aria-hidden={!open}>
      <div className="drawer-scrim" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label="Recent chats">
        <div className="drawer-head">
          <span className="drawer-brand"><FieldGlyph size={20} /><b>Field</b></span>
          <button type="button" className="round-btn" aria-label="Close" onClick={onClose}><I n="xmark" /></button>
        </div>
        <button type="button" className="drawer-new" disabled={!!busy} onClick={onNew}><I n="pen-to-square" />New chat</button>
        <div className="drawer-label">Recent</div>
        {items.length === 0
          ? <p className="drawer-empty">Your chats from this session will show up here.</p>
          : (
            <ul className="hist">
              {items.map(c => (
                <li key={c.id}>
                  <button type="button" className={`hist-row${c.cur ? ' cur' : ''}`} onClick={() => onPick(c)}>{c.title}</button>
                </li>
              ))}
            </ul>
          )}
        <div className="drawer-me">
          <Avatar init="MV" color="rgb(16,185,129)" size={36} />
          <div><b>Morgan Vance</b><span>External wholesaler · Northeast</span></div>
        </div>
      </aside>
    </div>
  );
}

function App() {
  const initial = (() => {
    const h = (location.hash || '').slice(1);
    if (h === 'brief' || h === 'review' || h === 'ask') return h;
    try { const v = localStorage.getItem('fm_view'); return ['ask', 'brief', 'review'].includes(v) ? v : 'ask'; } catch (e) { return 'ask'; }
  })();
  const [view, setView] = useState(initial);
  const [stack, setStack] = useState([]);
  const [drawer, setDrawer] = useState(false);
  const [more, setMore] = useState(false);
  const [toast, setToast] = useState('');
  const scrolls = useRef({});
  const toastT = useRef(null);
  const chat = useChat();

  useEffect(() => { try { localStorage.setItem('fm_view', view); } catch (e) {} }, [view]);
  useEffect(() => { document.body.classList.toggle('locked', stack.length > 0 || drawer); }, [stack.length, drawer]);

  const showToast = useCallback((m) => {
    setToast(m);
    clearTimeout(toastT.current);
    toastT.current = setTimeout(() => setToast(''), 2200);
  }, []);

  const go = (v) => {
    if (v === view) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    scrolls.current[view] = window.scrollY;
    setView(v);
    requestAnimationFrame(() => window.scrollTo({ top: scrolls.current[v] || 0 }));
  };
  const toAsk = () => { if (view !== 'ask') { scrolls.current[view] = window.scrollY; setView('ask'); } };

  const nav = useMemo(() => ({
    openTeam: (name) => setStack(s => (s[s.length - 1] === name ? s : [...s, name])),
    openBrief: (v) => {
      setStack([]);
      scrolls.current[view] = window.scrollY;
      setView(v === 'monthly' ? 'review' : 'brief');
      requestAnimationFrame(() => window.scrollTo({ top: 0 }));
    },
  }), [view]);

  return (
    <Nav.Provider value={nav}>
      <div className="app">
        <header className="appbar">
          <button type="button" className="round-btn brand" aria-label="Recent chats" onClick={() => setDrawer(true)}>
            <FieldGlyph size={20} />
            {chat.history.length > 0 && <span className="badge">{chat.history.length}</span>}
          </button>
          <div className="switch" role="tablist" aria-label="Sections">
            {VIEWS.map(([k, l]) => (
              <button key={k} type="button" role="tab" aria-selected={view === k} className={view === k ? 'on' : ''} onClick={() => go(k)}>{l}</button>
            ))}
          </div>
          <button type="button" className="round-btn" aria-label="New chat" disabled={!!chat.busy || (view === 'ask' && !chat.msgs.length)}
            onClick={() => { chat.newChat(); toAsk(); }}>
            <I n="pen-to-square" />
          </button>
        </header>

        <main className="app-main">
          <AskScreen active={view === 'ask'} chat={chat} onToast={showToast} onMore={() => setMore(true)} />
          <BriefScreen active={view === 'brief'} view="brief" />
          <BriefScreen active={view === 'review'} view="review" />
        </main>

        <Drawer open={drawer} onClose={() => setDrawer(false)} chat={chat}
          onNew={() => { chat.newChat(); toAsk(); setDrawer(false); }}
          onPick={(c) => { if (!c.cur) chat.openChat(c); toAsk(); setDrawer(false); }} />

        <Sheet open={more} onClose={() => setMore(false)} title="Ask about">
          <div className="more-list">
            {[...SUGGESTED, ...MORE].map(([ic, q]) => (
              <button key={q} type="button" className="more-q" onClick={() => { setMore(false); chat.ask(q); }}><I n={ic} /><span>{q}</span></button>
            ))}
            <button type="button" className="more-q muted" onClick={() => { setMore(false); showToast('Matching a list is coming to mobile soon'); }}><I n="paperclip" /><span>Attach a list to match against Field data</span></button>
          </div>
        </Sheet>

        {stack.map((name, i) => (
          <TeamScreen key={name + i} name={name} depth={i} onClose={() => setStack(s => s.slice(0, i))} />
        ))}
        <Toast msg={toast} />
      </div>
    </Nav.Provider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
