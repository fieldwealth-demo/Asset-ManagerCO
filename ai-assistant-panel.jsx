/* AI Assistant Slide-out (Asset Manager) ------------------------------
   Right-side panel triggered by the floating sparkle FAB. Asks the asset
   manager "How can I help?" with starter suggestions tailored to the AM
   workflow — opportunity sizing, drafting proposals, flow surveillance,
   redemption risk. Picking a suggestion (or submitting a free-form
   prompt) runs a mock agent flow with streamed steps, tool calls, and an
   actionable result. */

const AI_BRAND       = 'rgb(16,185,129)';
const AI_BRAND_SOFT  = 'rgba(16,185,129,0.18)';
const AI_BRAND_RING  = 'rgba(16,185,129,0.35)';
const AI_PANEL_BG    = 'rgba(10, 21, 33, 0.92)';
const AI_BORDER      = 'rgb(75,85,99)';
const AI_BORDER_SOFT = 'rgba(75,85,99,0.5)';
const AI_INK         = 'rgb(249,250,251)';
const AI_MUTED       = 'rgb(163,163,163)';
const AI_DIM         = 'rgb(115,115,115)';
const AI_BUBBLE_USER = 'rgba(16,185,129,0.18)';

/* -- Starter suggestions ----------------------------------------------- */
const AI_SUGGESTIONS = [
  {
    id: 'large-blend-opps',
    title: 'Top client opportunities in Large Blend',
    flow: 'large-blend',
  },
  {
    id: 'polk-proposal',
    title: 'Draft a tailored proposal for Doe Wealth',
    flow: 'polk-proposal',
  },
  {
    id: 'flow-accel',
    title: 'Where are net flows accelerating this quarter?',
    flow: 'flow-accel',
  },
  {
    id: 'redemption-risk',
    title: 'Clients at risk of redemption',
    flow: 'redemption-risk',
  },
];

/* =====================================================================
   AGENT FLOWS — scripted sequences. Step kinds: thinking | tool | result
   ===================================================================== */

const AI_FLOW_LARGE_BLEND = [
  { kind:'thinking', text:'Sizing the Large Blend opportunity across your book — pulling holdings, flows, and advantage scores.' },
  { kind:'tool', tool:'holdings.scan',     label:'Scanning current holdings',          detail:'2,148 advisors · $14.2B AUM in scope' },
  { kind:'tool', tool:'market.opportunity',label:'Cross-referencing market size',      detail:'Morningstar + Broadridge · Q3 2025' },
  { kind:'tool', tool:'advantage.score',   label:'Layering competitive advantage',     detail:'CFP/CFA · fee variance · fit signals' },
  { kind:'tool', tool:'flows.recent',      label:'Recent flow & rotation signals',     detail:'Rolling 90d net flow per client', long:true },
  { kind:'thinking', text:'Ranking by fit × gap size × engagement momentum.' },
  {
    kind:'result',
    title:'Top 5 Large Blend opportunities',
    summary:'$78M incremental upside · sorted by fit × gap × momentum',
    table: [
      { name:'The Doe Wealth Group',  firm:'Contoso Wealth',  opp:'$24.2M', yours:'$4.9M',  adv:'Strong',   advDot:'rgb(52,211,153)' },
      { name:'The Smith Group',       firm:'Adatum Partners',   opp:'$18.6M', yours:'$3.2M',  adv:'Moderate', advDot:'rgb(250,204,21)' },
      { name:'Jane Smith',    firm:'Litware Advisors',      opp:'$14.8M', yours:'$2.1M',  adv:'Strong',   advDot:'rgb(52,211,153)' },
      { name:'Sample Consulting',  firm:'Contoso Wealth',  opp:'$11.4M', yours:'$1.6M',  adv:'Strong',   advDot:'rgb(52,211,153)' },
      { name:'Alpine Partners',       firm:'Northwind Securities',             opp:'$9.2M',  yours:'$1.1M',  adv:'Strong',   advDot:'rgb(52,211,153)' },
    ],
    actions: [
      { id:'viewPolkProfile', label:'Open Doe Wealth profile', icon:'arrow-up-right-from-square', primary:true },
      { id:'createMaterial',  label:'Draft tailored deck', icon:'file-powerpoint' },
    ],
  },
];

const AI_FLOW_POLK_PROPOSAL = [
  { kind:'thinking', text:'Pulling everything I have on The Doe Wealth Group — book, recent rotations, prior touchpoints.' },
  { kind:'tool', tool:'crm.lookup',         label:'Looking up Doe Wealth team',       detail:'Contoso Wealth · NY · 7 portfolios · $14.2M AUM with us' },
  { kind:'tool', tool:'portfolio.snapshot', label:'Snapshotting current allocation',   detail:'Large Blend 14% · gap +8pts vs peer cohort' },
  { kind:'tool', tool:'flows.recent',       label:'Recent rotation activity',          detail:'Mary Doe · $8M out of competitor ETF in Q3' },
  { kind:'tool', tool:'perf.compare',       label:'Performance vs benchmark',          detail:'FW Large Blend +220bps vs S&P 500 · 3y rolling' },
  { kind:'thinking', text:'Assembling a 5-slide proposal: cover, opportunity, fit, performance, next steps.' },
  { kind:'tool', tool:'deck.generate',      label:'Generating PowerPoint deck',        detail:'5 slides · branded · ~12 sec', long:true },
  {
    kind:'result',
    title:'Doe Wealth proposal ready',
    summary:'Tailored Large Blend deck · 5 slides · ready to review',
    bullets: [
      { label:'Opportunity',  value:'$24.2M market · $4.9M yours · $19.3M incremental' },
      { label:'Fit signals',  value:'CFP/CFA team · 5 of 7 portfolios compatible' },
      { label:'Why now',      value:'Doe rotated $8M from competitor ETF · Q4 rebal window' },
      { label:'Performance',  value:'+220 bps vs S&P 500 (3y) · 0.32% expense' },
    ],
    actions: [
      { id:'createMaterial', label:'Open proposal deck', icon:'file-powerpoint', primary:true },
      { id:'viewPolkProfile', label:'View client profile', icon:'arrow-up-right-from-square' },
      { id:'scheduleMeeting', label:'Schedule with Doe', icon:'calendar' },
    ],
  },
];

const AI_FLOW_FLOW_ACCEL = [
  { kind:'thinking', text:'Looking for net-flow inflection — channels and vehicles accelerating vs trailing 4 quarters.' },
  { kind:'tool', tool:'flows.aggregate',   label:'Aggregating flows by channel + vehicle', detail:'Wirehouse · IBD · RIA · Bank — MF/ETF/SMA/Privates' },
  { kind:'tool', tool:'stat.changepoint',  label:'Running changepoint detection',           detail:'Q3 vs trailing 4Q · 95% CI' },
  { kind:'tool', tool:'category.rank',     label:'Ranking by acceleration delta',           detail:'Z-score weighted · normalized to AUM' },
  {
    kind:'result',
    title:'3 acceleration signals worth a closer look',
    summary:'Sorted by Z-score · all stat. significant at 95%',
    bullets: [
      { label:'RIA · SMA',     value:'+38% QoQ net inflow · driven by tax-managed Large Blend' },
      { label:'IBD · ETF',     value:'+22% QoQ · Multi-sector Bond rotating into FW core' },
      { label:'Wirehouse · MF',value:'-14% QoQ outflow · legacy Large Growth attrition' },
    ],
    actions: [
      { id:'openManagement', label:'Open Management dashboard', icon:'arrow-up-right-from-square', primary:true },
    ],
  },
];

const AI_FLOW_REDEMPTION_RISK = [
  { kind:'thinking', text:'Scoring redemption risk — outflow velocity, advisor turnover signals, fee sensitivity.' },
  { kind:'tool', tool:'flows.client',       label:'Reading client-level flow trail',   detail:'Rolling 90d net flow · 2,148 advisors' },
  { kind:'tool', tool:'engagement.signal',  label:'Cross-referencing rep engagement',  detail:'Days since last touchpoint · email reply rate' },
  { kind:'tool', tool:'risk.score',         label:'Computing redemption risk score',   detail:'Logistic model · features: flow, engagement, fee' },
  {
    kind:'result',
    title:'4 clients flagged elevated risk',
    summary:'$47.8M AUM at risk · prioritized by score × balance',
    table: [
      { name:'Carlton Advisors',    firm:'RBC',            opp:'$18.4M', yours:'$18.4M', adv:'At risk',  advDot:'rgb(248,113,113)' },
      { name:'Highline Partners',   firm:'Raymond James',  opp:'$12.6M', yours:'$12.6M', adv:'At risk',  advDot:'rgb(248,113,113)' },
      { name:'Sequoia Family Off.', firm:'Independent',    opp:'$9.8M',  yours:'$9.8M',  adv:'Watch',    advDot:'rgb(250,204,21)' },
      { name:'Crescent Wealth',     firm:'Fabrikam Financial',    opp:'$7.0M',  yours:'$7.0M',  adv:'Watch',    advDot:'rgb(250,204,21)' },
    ],
    actions: [
      { id:'scheduleMeeting', label:'Schedule outreach', icon:'calendar', primary:true },
    ],
  },
];

const AI_FLOW_GENERIC = [
  { kind:'thinking', text:'Got it — let me pull this together.' },
  { kind:'tool', tool:'data.query',  label:'Querying your book',     detail:'~3s' },
  { kind:'tool', tool:'rules.apply', label:'Applying your filters',  detail:'Using your saved preferences' },
  {
    kind:'result',
    title:'Here\'s what I found',
    summary:'A focused starting point — tap an action to dig in.',
    bullets: [
      { label:'Top finding',  value:'Doe Wealth shows the largest Large Blend gap ($19.3M)' },
      { label:'Worth a look', value:'3 channels show stat. significant flow acceleration' },
      { label:'Do this next', value:'Draft a proposal or schedule a Doe touchpoint' },
    ],
    actions: [
      { id:'viewPolkProfile', label:'Open Doe Wealth profile', icon:'arrow-up-right-from-square', primary:true },
    ],
  },
];

function aiPickFlow(flow) {
  if (flow === 'large-blend')     return AI_FLOW_LARGE_BLEND;
  if (flow === 'polk-proposal')   return AI_FLOW_POLK_PROPOSAL;
  if (flow === 'flow-accel')      return AI_FLOW_FLOW_ACCEL;
  if (flow === 'redemption-risk') return AI_FLOW_REDEMPTION_RISK;
  return AI_FLOW_GENERIC;
}


/* =====================================================================
   STEP RENDERERS
   ===================================================================== */

function AiThinking({ text }) {
  return (
    <div style={{
      display:'flex', alignItems:'flex-start', gap:8, padding:'4px 2px',
      fontFamily:'Inter', fontSize:12, fontStyle:'italic',
      color:AI_DIM, lineHeight:1.55,
    }}>
      <i className="fa-solid fa-wand-magic-sparkles" style={{ fontSize:10, color:AI_BRAND, marginTop:3, flexShrink:0 }} />
      <div>{text}</div>
    </div>
  );
}

function AiToolCall({ step }) {
  const done = step.status === 'done';
  return (
    <div style={{
      display:'flex', alignItems:'center', gap:10,
      padding:'8px 10px', borderRadius:8,
      background: done ? 'rgba(255,255,255,0.025)' : 'rgba(16,185,129,0.08)',
      border:`1px solid ${done ? AI_BORDER_SOFT : AI_BRAND_RING}`,
      transition:'background 200ms ease, border-color 200ms ease',
    }}>
      <div style={{
        width:18, height:18, borderRadius:9999, flexShrink:0,
        background: done ? AI_BRAND_SOFT : 'transparent',
        border: done ? `1px solid ${AI_BRAND}` : `1.5px solid ${AI_BRAND_RING}`,
        display:'flex', alignItems:'center', justifyContent:'center',
        color: AI_BRAND,
      }}>
        {done
          ? <i className="fa-solid fa-check" style={{ fontSize:9 }} />
          : <i className="fa-solid fa-spinner fa-spin" style={{ fontSize:9 }} />
        }
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontFamily:'Inter', fontSize:12, fontWeight:500, color:AI_INK, lineHeight:1.3 }}>
          {step.label}
        </div>
        {step.detail && (
          <div style={{ fontFamily:'Geist Mono, monospace', fontSize:10.5, color:AI_MUTED, marginTop:2, lineHeight:1.3 }}>
            <span style={{ color:AI_BRAND }}>{step.tool}</span>
            <span style={{ color:AI_DIM, margin:'0 6px' }}>·</span>
            {step.detail}
          </div>
        )}
      </div>
    </div>
  );
}

function AiResultCard({ step, onAction }) {
  return (
    <div style={{
      borderRadius:12,
      background:'rgba(16,185,129,0.08)',
      border:`1px solid ${AI_BRAND_RING}`,
      padding:14,
      boxShadow:'0 8px 24px -10px rgba(16,185,129,0.35)',
    }}>
      <div style={{ display:'flex', alignItems:'flex-start', gap:10, marginBottom:10 }}>
        <div style={{
          width:24, height:24, borderRadius:8, background:AI_BRAND_SOFT,
          display:'flex', alignItems:'center', justifyContent:'center',
          color:AI_BRAND, flexShrink:0,
        }}>
          <i className="fa-solid fa-circle-check" style={{ fontSize:13 }} />
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontFamily:'Inter', fontSize:13.5, fontWeight:600, color:AI_INK, lineHeight:1.3 }}>
            {step.title}
          </div>
          {step.summary && (
            <div style={{ fontFamily:'Inter', fontSize:11.5, color:AI_MUTED, marginTop:3, lineHeight:1.4 }}>
              {step.summary}
            </div>
          )}
        </div>
      </div>

      {step.bullets && (
        <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:12 }}>
          {step.bullets.map((b, i) => (
            <div key={i} style={{
              display:'grid', gridTemplateColumns:'118px 1fr', gap:8,
              padding:'6px 0',
              borderTop: i === 0 ? 'none' : `1px dashed ${AI_BORDER_SOFT}`,
            }}>
              <div style={{ fontFamily:'Inter', fontSize:11, color:AI_MUTED, fontWeight:500 }}>
                {b.label}
              </div>
              <div style={{ fontFamily:'Inter', fontSize:12, color:AI_INK, lineHeight:1.4 }}>
                {b.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {step.table && (
        <div style={{ display:'flex', flexDirection:'column', gap:4, marginBottom:12 }}>
          {step.table.map((r, i) => (
            <button key={i}
              onClick={() => onAction({ id:'viewPolkProfile', client: r.name })}
              style={{
                textAlign:'left', cursor:'pointer',
                display:'grid', gridTemplateColumns:'1fr auto auto', alignItems:'center',
                gap:10, padding:'8px 10px', borderRadius:8,
                background:'rgba(255,255,255,0.025)',
                border:`1px solid ${AI_BORDER_SOFT}`,
                color:'inherit',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(16,185,129,0.10)'; e.currentTarget.style.borderColor = AI_BRAND_RING; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.025)'; e.currentTarget.style.borderColor = AI_BORDER_SOFT; }}
            >
              <div style={{ minWidth:0 }}>
                <div style={{ fontFamily:'Inter', fontSize:12.5, fontWeight:600, color:AI_INK, display:'flex', alignItems:'center', gap:8 }}>
                  {r.name}
                  <span style={{
                    display:'inline-flex', alignItems:'center', gap:5,
                    fontSize:9.5, padding:'2px 6px', borderRadius:4,
                    background:'rgba(255,255,255,0.05)', color:AI_MUTED, fontWeight:500,
                    border:`1px solid ${AI_BORDER_SOFT}`,
                  }}>
                    <span style={{ width:5, height:5, borderRadius:9999, background: r.advDot }} />
                    {r.adv}
                  </span>
                </div>
                <div style={{ fontFamily:'Inter', fontSize:10.5, color:AI_MUTED, marginTop:2 }}>
                  {r.firm}
                </div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontFamily:'Inter Display, Inter', fontSize:12.5, fontWeight:500, color:AI_INK, fontVariantNumeric:'tabular-nums' }}>{r.opp}</div>
                <div style={{ fontFamily:'Inter', fontSize:10, color:AI_MUTED, marginTop:1 }}>opp · <span style={{ color:'rgb(96,165,250)' }}>{r.yours}</span> yours</div>
              </div>
              <i className="fa-solid fa-chevron-right" style={{ fontSize:10, color:AI_DIM }} />
            </button>
          ))}
        </div>
      )}

      {step.actions && (
        <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
          {step.actions.map((a) => (
            <button key={a.id}
              onClick={() => onAction(a)}
              style={{
                height:30, padding:'0 12px', borderRadius:8, cursor:'pointer',
                fontFamily:'Inter', fontSize:11.5, fontWeight:500,
                display:'inline-flex', alignItems:'center', gap:6,
                border: a.primary ? `1px solid ${AI_BRAND}` : `1px solid ${AI_BORDER}`,
                background: a.primary ? AI_BRAND : 'rgba(255,255,255,0.04)',
                color: a.primary ? '#fff' : AI_INK,
              }}>
              <i className={`fa-solid fa-${a.icon}`} style={{ fontSize:10 }} />
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* =====================================================================
   THREAD — runs a flow and reveals each step on a timer
   ===================================================================== */

function AiThread({ entry, onAction }) {
  const [revealed, setRevealed] = React.useState(0);
  const [doneMap, setDoneMap]   = React.useState({});

  React.useEffect(() => {
    if (!entry.steps) return;
    let cancelled = false;
    setRevealed(0); setDoneMap({});
    let i = 0;
    const next = () => {
      if (cancelled || i >= entry.steps.length) return;
      const step = entry.steps[i];
      setRevealed(i + 1);
      const reveal = step.kind === 'thinking' ? 700
                   : step.kind === 'tool' ? (step.long ? 1500 : 850)
                   : step.kind === 'result' ? 0
                   : 600;
      if (step.kind === 'tool') {
        const myIdx = i;
        setTimeout(() => { if (!cancelled) setDoneMap(prev => ({ ...prev, [myIdx]: true })); }, reveal - 200);
      }
      i++;
      setTimeout(next, reveal);
    };
    next();
    return () => { cancelled = true; };
  }, [entry.id]);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      <div style={{ alignSelf:'flex-end', maxWidth:'85%' }}>
        <div style={{
          background: AI_BUBBLE_USER,
          border:`1px solid ${AI_BRAND_RING}`,
          borderRadius:'12px 12px 2px 12px',
          padding:'8px 12px',
          fontFamily:'Inter', fontSize:13, color:AI_INK, lineHeight:1.45,
        }}>{entry.prompt}</div>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {entry.steps.slice(0, revealed).map((step, i) => {
          const liveStep = step.kind === 'tool'
            ? { ...step, status: doneMap[i] ? 'done' : 'running' }
            : step;
          if (step.kind === 'thinking') return <AiThinking key={i} text={step.text} />;
          if (step.kind === 'tool')     return <AiToolCall key={i} step={liveStep} />;
          if (step.kind === 'result')   return <AiResultCard key={i} step={step} onAction={onAction} />;
          return null;
        })}
        {revealed < entry.steps.length && entry.steps[revealed - 1]?.kind !== 'result' && (
          <div style={{ display:'inline-flex', gap:3, padding:'4px 2px' }}>
            <AiDot delay={0} /><AiDot delay={150} /><AiDot delay={300} />
          </div>
        )}
      </div>
    </div>
  );
}

function AiDot({ delay }) {
  return (
    <span style={{
      width:5, height:5, borderRadius:9999, background:AI_BRAND,
      display:'inline-block', opacity:0.3,
      animation:`aiPulse 1.1s ${delay}ms ease-in-out infinite`,
    }} />
  );
}


/* =====================================================================
   MAIN PANEL
   ===================================================================== */

function AIAssistantPanel({ open, onClose, onAction }) {
  const [thread, setThread] = React.useState([]);
  const [input, setInput]   = React.useState('');
  const scrollerRef = React.useRef();

  React.useEffect(() => {
    if (!scrollerRef.current) return;
    scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
    const id = setInterval(() => {
      if (scrollerRef.current) scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
    }, 400);
    setTimeout(() => clearInterval(id), 12000);
    return () => clearInterval(id);
  }, [thread.length]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const handleStart = (suggestion) => {
    setThread(prev => [...prev, {
      id: 'msg-' + Date.now(),
      prompt: suggestion.title,
      steps: aiPickFlow(suggestion.flow),
    }]);
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    const q = input.trim();
    if (!q) return;
    setInput('');
    const lower = q.toLowerCase();
    let flow = 'generic';
    if (lower.includes('large blend') || lower.includes('opportunit')) flow = 'large-blend';
    else if (lower.includes('polk') || lower.includes('proposal') || lower.includes('deck') || lower.includes('material')) flow = 'polk-proposal';
    else if (lower.includes('flow') || lower.includes('accelerat')) flow = 'flow-accel';
    else if (lower.includes('redemption') || lower.includes('risk') || lower.includes('outflow')) flow = 'redemption-risk';
    setThread(prev => [...prev, {
      id: 'msg-' + Date.now(),
      prompt: q,
      steps: aiPickFlow(flow),
    }]);
  };

  const handleAction = (action) => {
    if (onAction) onAction(action);
    if (['viewPolkProfile','createMaterial'].includes(action.id)) {
      onClose();
    }
  };

  const handleNewThread = () => setThread([]);

  return (
    <>
      <style>{`
        @keyframes aiPulse { 0%, 100% { opacity:0.25; transform:translateY(0); } 50% { opacity:1; transform:translateY(-2px); } }
        @keyframes aiSlideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes aiFadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes aiStepIn { from { opacity:0; transform: translateY(4px); } to { opacity:1; transform: translateY(0); } }
        .ai-step > * { animation: aiStepIn 280ms ease both; }
        .ai-pill:hover { background: rgba(16,185,129,0.10) !important; border-color: ${AI_BRAND_RING} !important; }
      `}</style>

      {open && (
        <div onClick={onClose} style={{
          position:'fixed', inset:0, background:'rgba(0,0,0,0.35)',
          zIndex:90, animation:'aiFadeIn 200ms ease',
        }} />
      )}

      {open && (
        <div role="dialog" aria-label="Field AI" style={{
          position:'fixed', top:0, right:0, bottom:0,
          width: 'min(460px, 92vw)',
          background: AI_PANEL_BG,
          backdropFilter:'blur(18px) saturate(160%)',
          WebkitBackdropFilter:'blur(18px) saturate(160%)',
          borderLeft: `1px solid ${AI_BORDER}`,
          boxShadow:'-24px 0 60px -12px rgba(0,0,0,0.6)',
          zIndex:100,
          display:'flex', flexDirection:'column',
          animation:'aiSlideIn 280ms cubic-bezier(0.22, 0.61, 0.36, 1)',
        }}>
          {/* Header */}
          <div style={{
            padding:'16px 18px',
            borderBottom:`1px solid ${AI_BORDER_SOFT}`,
            display:'flex', alignItems:'center', gap:10,
          }}>
            <div style={{
              width:30, height:30, borderRadius:8,
              background:`linear-gradient(135deg, ${AI_BRAND} 0%, rgb(20,160,120) 100%)`,
              display:'flex', alignItems:'center', justifyContent:'center',
              color:'#fff', boxShadow:`0 0 0 3px ${AI_BRAND_SOFT}`,
            }}>
              <i className="fa-solid fa-wand-magic-sparkles" style={{ fontSize:13 }} />
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontFamily:'Inter', fontSize:13.5, fontWeight:600, color:AI_INK, lineHeight:1.2 }}>
                Field AI
              </div>
              <div style={{ fontFamily:'Inter', fontSize:11, color:AI_MUTED, lineHeight:1.2, marginTop:1 }}>
                Your asset-management assistant
              </div>
            </div>
            {thread.length > 0 && (
              <button onClick={handleNewThread} title="Start a new thread" style={{
                height:28, padding:'0 10px', borderRadius:8,
                border:`1px solid ${AI_BORDER}`, background:'rgba(255,255,255,0.04)',
                color:AI_INK, cursor:'pointer',
                fontFamily:'Inter', fontSize:11, fontWeight:500,
                display:'inline-flex', alignItems:'center', gap:5,
              }}>
                <i className="fa-solid fa-plus" style={{ fontSize:9 }} /> New
              </button>
            )}
            <button onClick={onClose} title="Close" style={{
              width:28, height:28, borderRadius:8, border:'none',
              background:'transparent', color:AI_MUTED, cursor:'pointer',
              display:'flex', alignItems:'center', justifyContent:'center',
            }}>
              <i className="fa-solid fa-xmark" style={{ fontSize:13 }} />
            </button>
          </div>

          {/* Body */}
          <div ref={scrollerRef} style={{
            flex:1, minHeight:0, overflowY:'auto',
            padding: thread.length === 0 ? '0' : '18px 18px 12px',
            display: thread.length === 0 ? 'flex' : 'block',
            flexDirection: thread.length === 0 ? 'column' : undefined,
          }}>
            {thread.length === 0 ? (
              <AiEmptyState
                input={input}
                setInput={setInput}
                onSubmit={handleSubmit}
                onPick={handleStart}
              />
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
                {thread.map((entry) => (
                  <div key={entry.id} className="ai-step">
                    <AiThread entry={entry} onAction={handleAction} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Composer when thread exists */}
          {thread.length > 0 && (
            <form onSubmit={handleSubmit} style={{
              padding:'12px 14px 16px',
              borderTop:`1px solid ${AI_BORDER_SOFT}`,
            }}>
              <div style={{
                display:'flex', alignItems:'flex-end', gap:8,
                background:'rgba(255,255,255,0.04)',
                border:`1px solid ${AI_BORDER}`,
                borderRadius:12,
                padding:'8px 8px 8px 12px',
              }}>
                <textarea
                  value={input}
                  onChange={(e)=>setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); }
                  }}
                  placeholder="Ask anything about your book…"
                  rows={1}
                  style={{
                    flex:1, minWidth:0, resize:'none',
                    background:'transparent', border:'none', outline:'none',
                    fontFamily:'Inter', fontSize:13, color:AI_INK,
                    lineHeight:1.45, padding:'4px 0', maxHeight:120,
                  }}
                />
                <button type="submit" disabled={!input.trim()} style={{
                  width:30, height:30, borderRadius:8, border:'none',
                  background: input.trim() ? AI_BRAND : 'rgba(255,255,255,0.06)',
                  color: input.trim() ? '#fff' : AI_DIM,
                  cursor: input.trim() ? 'pointer' : 'not-allowed',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  flexShrink:0, transition:'background 150ms ease',
                }}>
                  <i className="fa-solid fa-arrow-up" style={{ fontSize:11 }} />
                </button>
              </div>
              <div style={{
                fontFamily:'Inter', fontSize:10, color:AI_DIM,
                marginTop:8, textAlign:'center',
              }}>
                Field AI can take actions on your behalf · review before sending to clients
              </div>
            </form>
          )}
        </div>
      )}
    </>
  );
}

function AiEmptyState({ input, setInput, onSubmit, onPick }) {
  return (
    <div style={{
      flex:1, minHeight:0,
      display:'flex', flexDirection:'column',
      justifyContent:'center', alignItems:'stretch',
      padding:'24px 22px 32px', gap:20,
    }}>
      <div style={{ textAlign:'center' }}>
        <div style={{
          fontFamily:'Inter Display, Inter, sans-serif',
          fontSize:34, fontWeight:600, color:AI_INK,
          letterSpacing:'-0.02em', lineHeight:1.05,
        }}>
          How can I help?
        </div>
        <div style={{
          fontFamily:'Inter', fontSize:13, color:AI_MUTED,
          marginTop:10, lineHeight:1.5, maxWidth:340, marginLeft:'auto', marginRight:'auto',
        }}>
          I can size opportunities across your book, draft tailored
          proposals, and surface flow signals.
        </div>
      </div>

      <form onSubmit={onSubmit} style={{
        background:'rgba(255,255,255,0.04)',
        border:`1px solid ${AI_BORDER}`,
        borderRadius:14,
        padding:'12px 12px 10px',
        display:'flex', flexDirection:'column', gap:10,
        boxShadow:'0 8px 24px -10px rgba(0,0,0,0.4)',
      }}>
        <textarea
          value={input}
          onChange={(e)=>setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSubmit(e); }
          }}
          placeholder="Write your message here…"
          rows={2}
          style={{
            width:'100%', resize:'none',
            background:'transparent', border:'none', outline:'none',
            fontFamily:'Inter', fontSize:14, color:AI_INK,
            lineHeight:1.5, padding:'2px 4px', minHeight:48, maxHeight:160,
          }}
        />
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <button type="button" title="Attach a file" style={{
            width:30, height:30, borderRadius:8, border:'none',
            background:'transparent', color:AI_MUTED, cursor:'pointer',
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            <i className="fa-solid fa-folder" style={{ fontSize:13 }} />
          </button>
          <div style={{ flex:1 }} />
          <button type="submit" disabled={!input.trim()} title="Send" style={{
            width:30, height:30, borderRadius:8, border:'none',
            background: input.trim() ? AI_BRAND : 'rgba(16,185,129,0.35)',
            color:'#fff',
            cursor: input.trim() ? 'pointer' : 'not-allowed',
            display:'flex', alignItems:'center', justifyContent:'center',
            transition:'background 150ms ease',
          }}>
            <i className="fa-solid fa-arrow-up" style={{ fontSize:11 }} />
          </button>
        </div>
      </form>

      <div style={{
        display:'flex', flexDirection:'column', alignItems:'center', gap:8,
        marginTop:4,
      }}>
        {AI_SUGGESTIONS.map((s) => (
          <button key={s.id}
            className="ai-pill"
            onClick={()=>onPick(s)}
            style={{
              cursor:'pointer',
              maxWidth:'100%',
              padding:'7px 14px',
              borderRadius:9999,
              background:'rgba(255,255,255,0.04)',
              border:`1px solid ${AI_BORDER}`,
              color:AI_INK,
              fontFamily:'Inter', fontSize:12, fontWeight:500,
              whiteSpace:'normal', textAlign:'center',
              transition:'background 150ms ease, border-color 150ms ease, transform 150ms ease',
            }}>
            {s.title}
          </button>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { AIAssistantPanel });
