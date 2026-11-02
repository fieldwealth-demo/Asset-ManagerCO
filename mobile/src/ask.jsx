/* Ask Field: the assistant, laid out as a phone chat. */
import { DATA, I, FieldGlyph, Pill, TeamLink, Html, useNav, reduceMotion, Sheet } from './ui.jsx';
const { useEffect, useMemo, useRef, useState, useCallback } = React;

export const SUGGESTED = [
  ['phone', 'Who should I call first today, and what should I lead with?'],
  ['bullhorn', 'Which FA/Teams should go into a Muni Ladder SMA campaign?'],
  ['wave-pulse', 'Which Segment A prospects are most likely to buy Core Plus?'],
  ['wand-magic-sparkles', 'Which next best actions are most likely to convert this month?'],
];
export const MORE = [
  ['shield-halved', 'Where are my Retention Risk signals, and how much AUM is exposed?'],
  ['calendar-check', 'Which webinar attendees have I not followed up with inside 48 hours?'],
  ['user-clock', 'Which Segment A producers have had no external meeting in 6 months?'],
  ['chart-simple', 'Which touch types have lifted sales most in my territory?'],
  ['route', "Which nearby FA/Teams should I add to this week's meetings?"],
  ['fire', 'What are my top client opportunities in Large Blend?'],
];
const ALL_Q = [...SUGGESTED, ...MORE].map(x => x[1]);

/* The desktop's default answer (aiflow.jsx), kept for the Large Blend prompt. */
const LARGE_BLEND = {
  source: { label: 'Data packs · Q3 2025 holdings and flows', icon: 'database' },
  summary: 'Here are your <b>top 5 Large Blend opportunities</b>, ranked by fit score combining advantage, gap size and engagement.',
  clients: [
    { name: 'The Doe Wealth Group', firm: 'Contoso Wealth', city: 'New York, NY', type: 'Teams', init: 'PW', bg: 'rgb(96,165,250)', adv: 'Strong', advDot: 'rgb(52,211,153)', opp: '$24.2M', yours: '$4.9M', share: '20.2%', fit: 95, body: 'Large Blend gap of $19.3M; team holds 7 categories, missing only mid-cap and private credit overlap. Mary Doe recently rotated $8M out of a competitor ETF.' },
    { name: 'The Smith Group', firm: 'Adatum Partners', city: 'Boston, MA', type: 'Teams', init: 'PG', bg: 'rgb(167,139,250)', adv: 'Moderate', advDot: 'rgb(250,204,21)', opp: '$18.6M', yours: '$3.2M', share: '17.2%', fit: 88, body: 'Currently holds Large Blend via Vanguard; fee variance of +12bps suggests price sensitivity. Q3 net inflows up 14%.' },
    { name: 'Jane Smith', firm: 'Litware Advisors', city: 'Chicago, IL', type: 'FA', init: 'JF', bg: 'rgb(251,146,60)', adv: 'Strong', advDot: 'rgb(52,211,153)', opp: '$14.8M', yours: '$2.1M', share: '14.2%', fit: 82, body: 'Solo FA with $87M book; outperformance vs benchmark on Large Blend +160bps. Open to model expansion per last rep visit.' },
    { name: 'Sample Consulting', firm: 'Contoso Wealth', city: 'Stamford, CT', type: 'Teams', init: 'GC', bg: 'rgb(45,212,191)', adv: 'Strong', advDot: 'rgb(52,211,153)', opp: '$11.4M', yours: '$1.6M', share: '14.0%', fit: 78, body: 'Strong relationship via competitive advantage; Large Blend underweight vs peer cohort (−$2.4M expected book size).' },
    { name: 'Alpine Partners', firm: 'Northwind Securities', city: 'Denver, CO', type: 'BA', init: 'AP', bg: 'rgb(248,113,113)', adv: 'Strong', advDot: 'rgb(52,211,153)', opp: '$9.2M', yours: '$1.1M', share: '12.0%', fit: 72, body: 'Geographic expansion target; Large Blend allocation sits in 2 legacy SMAs, a model migration opportunity.' },
  ],
  insights: [
    { icon: 'arrow-trend-up', color: 'rgb(52,211,153)', title: '$78M total Large Blend opportunity', body: 'Across the top 5 clients, market opportunity exceeds your current book by 6.4×. The Doe Wealth Group alone represents 31% of incremental potential.' },
    { icon: 'bullseye', color: 'rgb(96,165,250)', title: 'Doe Wealth has the highest fit score', body: 'Strong competitive advantage (CFP®, CFA), recent inflow momentum (+8.3% YoY), and 5 of 7 portfolios already hold compatible Large Blend exposures.' },
    { icon: 'clock', color: 'rgb(251,146,60)', title: 'Action window: Q4', body: 'The Doe Wealth team typically rebalances books in late Q4. Mary Doe has flagged interest in lower-fee Large Blend alternatives in the last two rep meetings.' },
  ],
  ctas: [],
};

const norm = (q) => (q || '').trim().toLowerCase().replace(/[?.!]+$/, '').replace(/’/g, "'");
const ANSWERS = {};
Object.entries(DATA.answers).forEach(([q, a]) => { if (a) ANSWERS[norm(q)] = a; });
ANSWERS[norm('What are my top client opportunities in Large Blend?')] = LARGE_BLEND;

function stepsFor(a) {
  const src = a.source.label;
  if (/Territory Brief/.test(src)) return ['Reading your Territory Brief for Tue, Sep 22', 'Checking 284 open signals in your territory', 'Ranking by confidence × expected opportunity'];
  if (/Monthly/.test(src)) return ['Reading September Monthly Review & Plan', 'Comparing sales 30 days before and after each touch', 'Sorting touch types by lift'];
  if (/Data packs/.test(src)) return ['Reading Q3 data-pack holdings and flows', 'Scoring fit on advantage, gap size and engagement', 'Ranking the top 5 FA/Teams'];
  return ['Searching the live Segmentation & Signals book', `Reading signals across ${DATA.rowsCount || 325} FA/Teams`, 'Ranking by confidence and expected opportunity'];
}

/* Split answer HTML into words and tags so it can stream without breaking markup. */
function tokens(html) { return html.match(/<[^>]+>|[^\s<]+\s*|\s+/g) || []; }

function nextQuestions(asked) {
  const seen = new Set(asked.map(norm));
  return ALL_Q.filter(q => !seen.has(norm(q))).slice(0, 3);
}

/* ---------- answer pieces ---------- */
export function AnswerItem({ it, delay = 0 }) {
  return (
    <article className="ans-item" style={{ animationDelay: `${delay}ms` }}>
      {it.sig && (
        <div className="ans-sig" style={{ color: it.sig.color }}>
          <I n={it.sig.icon} /> <span>{it.sig.label}</span>
        </div>
      )}
      <div className="ans-item-top">
        {it.rank && <span className="rank">{it.rank}</span>}
        <div className="ans-item-name">
          <TeamLink name={it.title} strong>{it.title}<I n="chevron-right" className="tl-chev" /></TeamLink>
          <div className="sub">{it.sub}</div>
        </div>
        <Pill tone={it.pill[1]}>{it.pill[0]}</Pill>
      </div>
      <p className="ans-body"><Html html={it.body} /></p>
      {it.tags && it.tags.length > 0 && <div className="tags">{it.tags.map(t => <span key={t} className="tag">{t}</span>)}</div>}
    </article>
  );
}

function ClientItem({ c, rank, delay }) {
  return (
    <article className="ans-item" style={{ animationDelay: `${delay}ms` }}>
      <div className="ans-item-top">
        <span className="rank">{rank}</span>
        <div className="ans-item-name">
          <TeamLink name={c.name} strong>{c.name}<I n="chevron-right" className="tl-chev" /></TeamLink>
          <div className="sub">{c.firm} · {c.city} · {c.type}</div>
        </div>
        <Pill tone="g">Fit {c.fit}</Pill>
      </div>
      <div className="mini-stats">
        <div><span>Mkt opp.</span><b>{c.opp}</b></div>
        <div><span>Yours</span><b>{c.yours}</b></div>
        <div><span>Share</span><b className="g">{c.share}</b></div>
        <div><span>Advantage</span><b><i className="dot" style={{ background: c.advDot }} />{c.adv}</b></div>
      </div>
      <p className="ans-body">{c.body}</p>
    </article>
  );
}

export function LiftBars({ bars }) {
  const max = Math.max(...bars.map(b => b[2]));
  return (
    <div className="lift">
      <div className="lift-head"><span>Touch type</span><span>n</span><span>Lift</span></div>
      {bars.map(([l, n, v]) => (
        <div key={l} className="lift-row">
          <div className="lift-label">
            <span>{l}</span>
            <span className="lift-track"><span style={{ width: `${(v / max) * 100}%` }} className={v >= 1.5 ? 'strong' : ''} /></span>
          </div>
          <span className="lift-n">{n}</span>
          <b className={v >= 1.5 ? 'g' : 'm'}>{v.toFixed(1)}x</b>
        </div>
      ))}
    </div>
  );
}

export function Insight({ ins }) {
  return (
    <div className="insight">
      <span className="insight-ic" style={{ color: ins.color, background: ins.color.replace('rgb', 'rgba').replace(')', ',0.12)') }}><I n={ins.icon} /></span>
      <div>
        <div className="insight-t">{ins.title}</div>
        <div className="insight-b">{ins.body}</div>
      </div>
    </div>
  );
}

/* ---------- one assistant turn ---------- */
function AssistantMsg({ msg, onDone, onStopAck, onRegenerate, onAsk, onToast, live }) {
  const nav = useNav();
  const a = msg.answer;
  const steps = useMemo(() => (a ? stepsFor(a) : []), [a]);
  const toks = useMemo(() => tokens(a ? a.summary : ''), [a]);
  const instant = !live || reduceMotion;
  const [phase, setPhase] = useState(instant ? 'done' : 'thinking'); // thinking → streaming → done | stopped
  const [step, setStep] = useState(instant ? steps.length : 0);
  const [shown, setShown] = useState(instant ? toks.length : 0);
  const [openSteps, setOpenSteps] = useState(false);
  const [vote, setVote] = useState(0);

  // thinking
  useEffect(() => {
    if (phase !== 'thinking') return;
    if (step >= steps.length) { const t = setTimeout(() => setPhase('streaming'), 250); return () => clearTimeout(t); }
    const t = setTimeout(() => setStep(s => s + 1), 520);
    return () => clearTimeout(t);
  }, [phase, step, steps.length]);
  // streaming
  useEffect(() => {
    if (phase !== 'streaming') return;
    if (shown >= toks.length) { setPhase('done'); return; }
    const t = setTimeout(() => setShown(s => Math.min(toks.length, s + 2)), 28);
    return () => clearTimeout(t);
  }, [phase, shown, toks.length]);
  const list = a ? (a.items || a.clients || []) : [];
  const [shownItems, setShownItems] = useState(instant ? list.length : 0);
  useEffect(() => {
    if (phase !== 'done' || shownItems >= list.length) return;
    const t = setTimeout(() => setShownItems(n => n + 1), shownItems === 0 ? 60 : 110);
    return () => clearTimeout(t);
  }, [phase, shownItems, list.length]);
  const doneAll = phase === 'done' && shownItems >= list.length;

  useEffect(() => { if (doneAll || phase === 'stopped') onDone(msg.id, phase); }, [doneAll, phase]);
  useEffect(() => {
    if (!msg.stop) return;
    if (phase === 'thinking' || phase === 'streaming') setPhase('stopped');
    onStopAck(msg.id);
  }, [msg.stop]);

  if (msg.fallback) {
    return (
      <div className="msg-a">
        <div className="msg-a-head"><span className="glyph"><FieldGlyph size={13} /></span><b>Field</b></div>
        <p className="ans-summary">This demo answers questions from your Territory Brief, Monthly Review and live signals book. I don't have an answer for that one yet. Try one of these:</p>
        <div className="fallback-list">
          {msg.fallback.map(q => <button key={q} type="button" className="suggest-row" onClick={() => onAsk(q)}><I n="arrow-turn-down-right" /><span>{q}</span></button>)}
        </div>
      </div>
    );
  }

  const copy = () => {
    const text = [a.summary.replace(/<[^>]+>/g, ''), ...list.map((it, i) => `${i + 1}. ${it.title || it.name} — ${(it.body || '').replace(/<[^>]+>/g, '')}`)].join('\n');
    const ok = () => onToast('Copied to clipboard');
    try { navigator.clipboard.writeText(text).then(ok, () => onToast('Copy is not available here')); } catch (e) { onToast('Copy is not available here'); }
  };
  const ctas = (a.ctas || []).filter(c => c.nav === 'briefs');

  return (
    <div className="msg-a">
      <div className="msg-a-head">
        <span className={`glyph${phase === 'thinking' ? ' pulse' : ''}`}><FieldGlyph size={13} /></span>
        <b>Field</b>
        <span className="src"><I n={a.source.icon} />{a.source.label}</span>
      </div>

      {phase === 'thinking' ? (
        <div className="thinking" aria-live="polite">
          {steps.slice(0, step + 1).map((s, i) => (
            <div key={s} className={`think-step${i === step ? ' cur' : ' done'}`}>
              <I n={i < step ? 'check' : 'circle-notch'} className={i < step ? '' : 'spin'} />
              <span className={i === step ? 'shimmer' : ''}>{s}</span>
            </div>
          ))}
        </div>
      ) : (
        <button type="button" className="thought" onClick={() => setOpenSteps(o => !o)} aria-expanded={openSteps}>
          <I n="sparkles" /> Worked through {steps.length} steps <I n={openSteps ? 'chevron-up' : 'chevron-down'} />
        </button>
      )}
      {openSteps && phase !== 'thinking' && (
        <ol className="thought-list">{steps.map(s => <li key={s}><I n="check" />{s}</li>)}</ol>
      )}

      {phase !== 'thinking' && (
        <p className="ans-summary">
          <Html html={toks.slice(0, shown).join('')} />
          {phase === 'streaming' && <span className="caret" />}
        </p>
      )}

      {phase === 'done' && (
        <>
          {list.length > 0 && (
            <div className="ans-list">
              {(a.clients
                ? a.clients.slice(0, shownItems).map((c, i) => <ClientItem key={c.name} c={c} rank={i + 1} delay={0} />)
                : a.items.slice(0, shownItems).map((it, i) => <AnswerItem key={it.title + i} it={it} />))}
            </div>
          )}
          {doneAll && a.bars && <LiftBars bars={a.bars} />}
          {doneAll && a.insights && (
            <div className="insights fade-in">
              <div className="eyebrow">Key insights</div>
              {a.insights.map((ins, i) => <Insight key={i} ins={ins} />)}
            </div>
          )}
          {doneAll && ctas.length > 0 && (
            <div className="ctas fade-in">
              {ctas.map((c, i) => (
                <button key={c.label} type="button" className={`btn${i === 0 ? ' btn-primary' : ''}`} onClick={() => nav.openBrief(c.briefView === 'monthly' ? 'monthly' : 'brief')}>
                  <I n={c.briefView === 'monthly' ? 'chart-line' : 'newspaper'} />{c.label}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {phase === 'stopped' && (
        <div className="stopped"><I n="circle-stop" r /> You stopped this answer.</div>
      )}

      {(doneAll || phase === 'stopped') && (
        <div className="msg-actions fade-in">
          {phase === 'done' && <button type="button" className="icon-btn sm" aria-label="Copy answer" onClick={copy}><I n="copy" r /></button>}
          {phase === 'done' && <button type="button" className={`icon-btn sm${vote === 1 ? ' on' : ''}`} aria-label="Good answer" aria-pressed={vote === 1} onClick={() => { setVote(v => (v === 1 ? 0 : 1)); if (vote !== 1) onToast('Thanks for the feedback'); }}><I n="thumbs-up" r={vote !== 1} /></button>}
          {phase === 'done' && <button type="button" className={`icon-btn sm${vote === -1 ? ' on' : ''}`} aria-label="Bad answer" aria-pressed={vote === -1} onClick={() => { setVote(v => (v === -1 ? 0 : -1)); if (vote !== -1) onToast('Thanks for the feedback'); }}><I n="thumbs-down" r={vote !== -1} /></button>}
          <button type="button" className="icon-btn sm" aria-label="Regenerate answer" onClick={() => onRegenerate(msg.id)}><I n="rotate-right" /></button>
        </div>
      )}
    </div>
  );
}

/* ---------- conversation state (owned by the app so the history drawer can use it) ---------- */
let uid = 1;
const snapshot = (msgs) => msgs.map(x => ({ ...x, live: false, stop: false }));
export function useChat() {
  const [msgs, setMsgs] = useState([]);
  const [busy, setBusy] = useState(null);
  const [history, setHistory] = useState([]);
  const [curId, setCurId] = useState(() => uid++);
  const lastUserRef = useRef(null);

  const ask = useCallback((text) => {
    const t = (text || '').trim();
    if (!t || busy) return;
    const ans = ANSWERS[norm(t)];
    const asked = msgs.filter(m => m.role === 'user').map(m => m.text);
    const u = { id: uid++, role: 'user', text: t };
    const a = ans
      ? { id: uid++, role: 'assistant', answer: ans, live: true }
      : { id: uid++, role: 'assistant', live: false, fallback: [...nextQuestions(asked), ...SUGGESTED.map(s => s[1])].filter((q, i, arr) => arr.indexOf(q) === i && norm(q) !== norm(t)).slice(0, 3) };
    setMsgs(m => [...m, u, a]);
    setBusy(ans ? a.id : null);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const el = lastUserRef.current;
      if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 92, behavior: reduceMotion ? 'auto' : 'smooth' });
    }));
  }, [busy, msgs]);

  const finish = useCallback((id) => { setBusy(b => (b === id ? null : b)); setMsgs(m => m.map(x => (x.id === id ? { ...x, live: false } : x))); }, []);
  const stopAck = useCallback((id) => setBusy(b => (b === id ? null : b)), []);
  const stop = () => setMsgs(m => m.map(x => (x.id === busy ? { ...x, stop: true } : x)));
  const regenerate = (id) => {
    if (busy) return;
    const nid = uid++;
    setMsgs(m => m.map(x => (x.id === id ? { ...x, id: nid, live: true, stop: false } : x)));
    setBusy(nid);
  };
  const archive = (list) => {
    if (!msgs.length) return list;
    return [{ id: curId, title: msgs[0].text, msgs: snapshot(msgs) }, ...list.filter(x => x.id !== curId)];
  };
  const newChat = () => {
    if (busy) return;
    setHistory(h => archive(h));
    setMsgs([]);
    setCurId(uid++);
    window.scrollTo({ top: 0 });
  };
  const openChat = (c) => {
    if (busy || c.id === curId) return;
    setHistory(h => archive(h).filter(x => x.id !== c.id));
    setMsgs(c.msgs);
    setCurId(c.id);
    window.scrollTo({ top: 0 });
  };
  return { msgs, busy, history, curId, ask, finish, stopAck, stop, regenerate, newChat, openChat, lastUserRef };
}

/* ---------- screen ---------- */
export function AskScreen({ active, chat, onToast, onMore }) {
  const { msgs, busy, ask, finish, stopAck, stop, regenerate, lastUserRef } = chat;
  const [draft, setDraft] = useState('');
  const taRef = useRef(null);

  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 140) + 'px';
  }, [draft]);

  const send = (q) => { if (busy) return; ask(q); setDraft(''); };
  const lastUserIdx = msgs.map(m => m.role).lastIndexOf('user');
  const asked = msgs.filter(m => m.role === 'user').map(m => m.text);
  const lastMsg = msgs[msgs.length - 1];
  const follow = !busy && msgs.length > 0 && !(lastMsg && lastMsg.fallback) ? nextQuestions(asked) : [];

  return (
    <section className={`screen ask${active ? '' : ' hidden'}`} aria-label="Ask Field">
      {msgs.length === 0 ? (
        <div className="ask-empty gutter">
          <div className="ask-hello">
            <span className="hello-mark"><FieldGlyph size={22} /></span>
            <h1 className="hero-h">Good morning, Morgan.</h1>
            <p className="hero-p">What do you want to know about your territory today?</p>
          </div>
          <div className="suggest-list" role="list">
            {SUGGESTED.map(([ic, q]) => (
              <button key={q} type="button" role="listitem" className="suggest-row" onClick={() => send(q)}>
                <I n={ic} className="suggest-ic" /><span>{q}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="thread gutter">
          {msgs.map((m, i) => (m.role === 'user'
            ? <div key={m.id} ref={i === lastUserIdx ? lastUserRef : null} className="msg-u"><div className="bubble">{m.text}</div></div>
            : <AssistantMsg key={m.id} msg={m} live={!!m.live} onDone={finish} onStopAck={stopAck} onRegenerate={regenerate} onAsk={send} onToast={onToast} />))}
        </div>
      )}

      <div className="composer-wrap">
        {follow.length > 0 && (
          <div className="follow chip-scroll">
            {follow.map(q => <button key={q} type="button" className="chip-q" onClick={() => send(q)}>{q}</button>)}
          </div>
        )}
        <form className="composer" onSubmit={(e) => { e.preventDefault(); send(draft); }}>
          <button type="button" className="comp-btn" aria-label="More questions and attachments" onClick={onMore}><I n="plus" /></button>
          <label htmlFor="ask-input" className="sr">Message Ask Field</label>
          <textarea id="ask-input" ref={taRef} rows={1} value={draft} placeholder={msgs.length ? 'Ask a follow-up' : 'Ask Field'}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(draft); } }} />
          {busy
            ? <button type="button" className="send stop" aria-label="Stop answer" onClick={stop}><I n="stop" /></button>
            : <button type="submit" className="send" aria-label="Send" disabled={!draft.trim()}><I n="arrow-up" /></button>}
        </form>
      </div>
    </section>
  );
}
