/* First-landing guided tour: welcome modal → spotlit steps → sample-data callout. */
const TOUR_KEY = 'amp_tour_done_v2';
const TOUR_NOTE_KEY = 'amp_demo_note_closed';
const TOUR_STEPS = [
  { target: '[data-tour="nav-briefs"]', page: 'briefs', title: 'Territory Brief & Review', body: 'Tailored by role, summarizes sales, upcoming meetings and action items.', hint: 'Scroll the brief to read it.' },
  { target: '[data-sec="calls"] .item', frame: true, page: 'briefs', place: 'below', title: "Today's priority calls", body: 'Ranked by signal confidence × expected opportunity, with the touch that has lifted sales most for that signal. Click The Doe Wealth Group to open its FA/Team page.' },
  { target: '[data-tour="fa-team"]', page: 'briefs', client: 'The Doe Wealth Group', place: 'center', title: 'FA/Team Page', body: 'Click through from the brief, FA/team details, next best actions, actual sales/AUM, opportunity data.' },
  { target: '[data-tour="nav-l2sales"]', page: 'l2sales', title: 'Territory Analytics', body: 'The whole territory: FA/Team grid, sorting, and filters by segment, signal, opportunity, engagement.' },
  { target: '[data-tour="nav-leadbriefs"]', page: 'leadbriefs', title: 'Leadership Brief & Review', body: 'View by region, salesperson and strategic account with ability to email or download a pdf or PowerPoint.' },
  { target: '[data-tour="nav-management"]', page: 'management', title: 'Leadership Dashboard', body: 'The wholesaler scorecard and "what worked" by signals, segmentation, activity types and conferences.' },
  { target: '[data-tour="nav-home"]', page: 'home', title: 'Ask Field', body: 'AI Agent to ask any question across the entire data set.' },
];
const TOUR_CSS = `@keyframes tourIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}@keyframes tourFade{from{opacity:0}to{opacity:1}}@keyframes tourPop{from{opacity:0;transform:translate(-50%,-48%) scale(.98)}to{opacity:1;transform:translate(-50%,-50%)}}@keyframes tourPulse{0%,100%{box-shadow:0 0 0 0 rgba(94,214,164,.45)}50%{box-shadow:0 0 0 6px rgba(94,214,164,0)}}.tour-btn{height:32px;padding:0 14px;border-radius:8px;font-family:Inter;font-size:13px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:7px;text-decoration:none;box-sizing:border-box}.tour-ghost{background:rgba(255,255,255,.04);border:1px solid rgba(107,114,128,.7);color:rgb(229,231,235)}.tour-ghost:hover{color:rgb(249,250,251);background:rgba(255,255,255,.08)}.tour-pri{background:rgb(5,122,85);border:1px solid rgb(5,122,85);color:rgb(249,250,251)}.tour-pri:hover{background:rgb(6,140,98)}.tour-skip{background:none;border:none;color:rgb(156,163,175);font-family:Inter;font-size:12px;cursor:pointer;padding:0}.tour-skip:hover{color:rgb(229,231,235)}`;
const TOUR_PANEL = { background: 'rgb(11,21,36)', border: '1px solid rgba(75,85,99,0.6)', borderRadius: 14, boxShadow: '0 18px 40px -10px rgba(0,0,0,0.6)', fontFamily: 'Inter' };

function useTourState() {
  const [phase, setPhase] = React.useState(() => {
    if (location.hash === '#tour') return 'welcome';
    try { return localStorage.getItem(TOUR_KEY) ? 'off' : 'welcome'; } catch (e) { return 'welcome'; }
  });
  const [step, setStep] = React.useState(0);
  const [note, setNote] = React.useState(false);
  const end = React.useCallback(() => {
    setPhase('off'); setNote(true);
    try { localStorage.setItem(TOUR_KEY, '1'); } catch (e) {}
  }, []);
  return {
    phase, step, setStep, end, note,
    running: phase === 'tour',
    welcome: () => { setNote(false); setPhase('welcome'); },
    begin: () => { setStep(0); setNote(false); setPhase('tour'); },
    closeNote: () => setNote(false),
  };
}

function TourWelcome({ onSkip, onStart }) {
  return ReactDOM.createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(5,10,18,0.72)', animation: 'tourFade 200ms ease-out both' }}>
      <style>{TOUR_CSS}</style>
      <div style={{ ...TOUR_PANEL, position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: 'min(504px, calc(100vw - 32px))', padding: '32px 36px 30px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center', animation: 'tourPop 240ms cubic-bezier(.2,.8,.2,1) both' }}>
        <img src="assets/field-glyph.svg" alt="Field" style={{ width: 50, height: 50 }} />
        <div style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.3, letterSpacing: '-0.02em', color: 'rgb(249,250,251)', marginTop: 6 }}>Welcome to Field</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, width: '100%', textAlign: 'left' }}>
          {[['Field Groundwork', 'The unglamorous prep work that everything else depends on.', 'fa-layer-group'], ['Field Harvest', 'You reap what the data layer planted.', 'fa-wheat-awn']].map(([h, b, ic]) => (
            <div key={h} style={{ border: '1px solid rgba(75,85,99,0.6)', borderRadius: 10, padding: '12px 14px', background: 'rgba(255,255,255,0.02)', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgb(94,214,164)' }}><i className={`fa-solid ${ic}`} style={{ fontSize: 11 }}></i>{h}</div>
              <div style={{ fontSize: 13, lineHeight: 1.45, color: 'rgb(229,231,235)', textWrap: 'pretty' }}>{b}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 14.5, lineHeight: 1.55, color: 'rgb(209,213,219)', textWrap: 'pretty' }}>Field unifies your sales, CRM and industry data into one layer, then delivers the insights to your distribution team: who to call, why, and what has worked. Take a 60-second tour, built on sample data.</div>
        <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
          <button className="tour-btn tour-ghost" onClick={onSkip}>Skip</button>
          <button className="tour-btn tour-pri" onClick={onStart}>Start tour<i className="fa-solid fa-arrow-right" style={{ fontSize: 11 }}></i></button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function TourNote({ left, onTour, onClose }) {
  return ReactDOM.createPortal(
    <div style={{ ...TOUR_PANEL, position: 'fixed', left, bottom: 16, zIndex: 9000, width: 'min(356px, calc(100vw - 32px))', padding: '14px 16px 16px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 10, animation: 'tourIn 220ms ease-out both' }}>
      <style>{TOUR_CSS}</style>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 9, height: 9, borderRadius: 9999, background: 'rgb(52,211,153)', animation: 'tourPulse 1.8s ease-in-out infinite' }}></span>
        <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgb(94,214,164)' }}>Viewing a demo · Sample data</span>
        <span style={{ flex: 1 }}></span>
        <button onClick={onClose} title="Close" style={{ border: 'none', background: 'none', color: 'rgb(156,163,175)', cursor: 'pointer', padding: 2, fontSize: 13 }}><i className="fa-solid fa-xmark"></i></button>
      </div>
      <div style={{ fontSize: 13.5, lineHeight: 1.5, color: 'rgb(209,213,219)', textWrap: 'pretty' }}>This is a live preview built on <b style={{ color: 'rgb(249,250,251)' }}>sample data</b>. Revisit the guided tour any time, or see Field on your own territory.</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 2 }}>
        <button className="tour-btn tour-pri" style={{ height: 36 }} onClick={onTour}>Take the tour</button>
        <a className="tour-btn tour-ghost" style={{ height: 36 }} href="https://fieldwealth.ai" target="_blank" rel="noopener noreferrer">Schedule a demo</a>
      </div>
    </div>,
    document.body
  );
}

function GuidedTour({ step, setStep, onEnd, onNav, onClient }) {
  const s = TOUR_STEPS[step];
  const [rect, setRect] = React.useState(null);
  React.useEffect(() => { if (s) { onNav(s.page); onClient(s.client || false); } }, [step]);
  React.useEffect(() => {
    if (!s) return;
    let raf, scrolled = false, t0 = performance.now();
    const tick = () => {
      let el = null, fr = null;
      if (s.frame) {
        fr = document.querySelector('main iframe');
        let d = null; try { d = fr && fr.contentDocument; } catch (e) {}
        el = d && d.querySelector(s.target);
      } else el = document.querySelector(s.target);
      if (el) {
        if (!scrolled && fr) {
          let p = fr.parentElement;
          while (p && p !== document.body) { const oy = getComputedStyle(p).overflowY; if ((oy === 'auto' || oy === 'scroll') && p.scrollHeight > p.clientHeight) break; p = p.parentElement; }
          if (p && p !== document.body) {
            const y = fr.getBoundingClientRect().top + el.getBoundingClientRect().top - p.getBoundingClientRect().top;
            p.scrollTop = Math.max(0, p.scrollTop + y - p.clientHeight * 0.22);
          }
          scrolled = performance.now() - t0 > 600;
        }
        if (!scrolled) {
          const sc = el.closest('[data-tour-scroll]');
          if (sc) {
            const want = s.scroll ? el.getBoundingClientRect().top - sc.getBoundingClientRect().top + sc.scrollTop - 260 : 0;
            sc.scrollTop = Math.max(0, want);
          }
          let p = el.parentElement;
          while (p && p !== document.body) {
            const ox = getComputedStyle(p).overflowX;
            if ((ox === 'auto' || ox === 'scroll') && p.scrollWidth > p.clientWidth) {
              const er = el.getBoundingClientRect(), pr = p.getBoundingClientRect();
              if (er.right > pr.right - 8 || er.left < pr.left + 8) p.scrollLeft += er.right - pr.right + 40;
            }
            p = p.parentElement;
          }
          scrolled = performance.now() - t0 > 600;
        }
        const r0 = el.getBoundingClientRect(), fo = fr ? fr.getBoundingClientRect() : { left: 0, top: 0 };
        const r = { left: r0.left + fo.left, top: r0.top + fo.top, width: r0.width, height: r0.height, bottom: r0.bottom + fo.top };
        const top = Math.max(r.top, 12), bottom = Math.min(r.bottom, window.innerHeight - 12);
        const n = { left: r.left, top, width: r.width, height: Math.max(0, bottom - top) };
        if (n.height < Math.min(r.height, 40) || r.bottom < 8 || r.top > window.innerHeight - 8) { setRect(null); raf = requestAnimationFrame(tick); return; }
        setRect(p => (p && ['left', 'top', 'width', 'height'].every(k => Math.abs(p[k] - n[k]) < .5)) ? p : n);
      } else if (performance.now() - t0 > 300) setRect(null);
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [step]);
  const last = step === TOUR_STEPS.length - 1;
  const next = () => (last ? onEnd() : setStep(step + 1));
  React.useEffect(() => {
    const k = (e) => {
      if (e.key === 'Escape') onEnd();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft' && step > 0) setStep(step - 1);
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [step]);
  if (!s) return null;
  const nav = !s.place;
  const pad = nav ? 4 : 0;
  const TW = 340, TH = 200;
  let tipStyle = { left: '50%', bottom: 28, transform: 'translateX(-50%)' }, arrow = null;
  if (rect && nav) {
    const top = Math.min(Math.max(16, rect.top + rect.height / 2 - 40), window.innerHeight - 230);
    tipStyle = { left: rect.left + rect.width + pad + 18, top };
    arrow = { left: -6, top: rect.top + rect.height / 2 - top - 6, b: 'L' };
  } else if (s.place === 'center') {
    tipStyle = { left: '50%', top: '50%', transform: 'translate(-50%,-50%)', boxShadow: '0 0 0 1px rgba(94,214,164,0.5), 0 24px 60px -8px rgba(0,0,0,0.85)' };
  } else if (rect) {
    const left = Math.min(Math.max(16, rect.left + rect.width / 2 - 34), window.innerWidth - TW - 16);
    const below = rect.top + rect.height + 18, above = rect.top - 18 - TH;
    const aL = Math.min(Math.max(rect.left + rect.width / 2 - left - 6, 16), TW - 28);
    if (s.place === 'below' && below + TH < window.innerHeight) { tipStyle = { left, top: below }; arrow = { left: aL, top: -6, b: 'T' }; }
    else if (above > 12) { tipStyle = { left, top: above, height: TH, boxSizing: 'border-box', justifyContent: 'flex-end' }; arrow = { left: aL, bottom: -6, b: 'B' }; }
  }
  const ab = '1px solid rgba(75,85,99,0.6)';
  const arrowBorders = arrow && (arrow.b === 'L' ? { borderLeft: ab, borderBottom: ab } : arrow.b === 'T' ? { borderLeft: ab, borderTop: ab } : { borderRight: ab, borderBottom: ab });
  return ReactDOM.createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 10000, pointerEvents: 'none' }}>
      <style>{TOUR_CSS}</style>
      {rect ? (
        <div style={{ position: 'fixed', left: rect.left - pad, top: rect.top - pad, width: rect.width + pad * 2, height: rect.height + pad * 2, borderRadius: nav ? 10 : 12, boxShadow: '0 0 0 6px rgba(94,214,164,0.18), 0 0 24px rgba(94,214,164,0.25)', outline: '2px solid rgb(94,214,164)', outlineOffset: 2, transition: 'all 260ms cubic-bezier(.22,.61,.36,1)' }}></div>
      ) : (
        null
      )}
      <div key={step} style={{ ...TOUR_PANEL, position: 'fixed', width: TW, boxSizing: 'border-box', padding: '16px 18px 14px', display: 'flex', flexDirection: 'column', gap: 10, pointerEvents: 'auto', animation: 'tourIn 200ms ease-out both', ...tipStyle }}>
        {arrow && <span style={{ position: 'absolute', left: arrow.left, top: arrow.top, bottom: arrow.bottom, width: 11, height: 11, background: 'rgb(11,21,36)', transform: 'rotate(45deg)', ...arrowBorders }}></span>}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 22, height: 22, borderRadius: 9999, background: 'rgba(94,214,164,0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', animation: 'tourPulse 1.8s ease-in-out infinite' }}><i className="fa-solid fa-hand-pointer" style={{ color: 'rgb(94,214,164)', fontSize: 11 }}></i></span>
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgb(94,214,164)', whiteSpace: 'nowrap' }}>Step {step + 1} of {TOUR_STEPS.length}</span>
          <span style={{ flex: 1 }}></span>
          <button className="tour-skip" style={{ whiteSpace: 'nowrap' }} onClick={onEnd}>Skip tour</button>
        </div>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'rgb(249,250,251)' }}>{s.title}</div>
        <div style={{ fontSize: 13, lineHeight: 1.5, color: 'rgb(209,213,219)', textWrap: 'pretty' }}>{s.body}</div>
        {s.hint && <div style={{ fontSize: 12, color: 'rgb(156,163,175)', display: 'flex', alignItems: 'center', gap: 6 }}><i className="fa-solid fa-computer-mouse" style={{ fontSize: 11 }}></i>{s.hint}</div>}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {TOUR_STEPS.map((_, i) => <span key={i} style={{ width: i === step ? 14 : 6, height: 6, borderRadius: 9999, background: i === step ? 'rgb(94,214,164)' : 'rgba(156,163,175,0.35)', transition: 'width 200ms ease' }}></span>)}
          </div>
          <span style={{ flex: 1 }}></span>
          {step > 0 && <button className="tour-btn tour-ghost" style={{ height: 30, borderRadius: 9999 }} onClick={() => setStep(step - 1)}>Back</button>}
          <button className="tour-btn tour-pri" style={{ height: 30, borderRadius: 9999 }} onClick={next}>{last ? 'Finish' : 'Next'}{!last && <i className="fa-solid fa-arrow-right" style={{ fontSize: 11 }}></i>}</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

Object.assign(window, { GuidedTour, TourWelcome, TourNote, useTourState, TOUR_STEPS });
