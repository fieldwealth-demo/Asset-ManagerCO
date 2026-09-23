/* AI Flow — assistant response panels + marketing PPT preview */

/* ============================================================
   AI Insights Panel — Top Client Opportunities in Large Blend
   ============================================================ */

const TOP_5_CLIENTS = [
  {
    name: 'The Doe Wealth Group',
    firm: 'Contoso Wealth',
    city: 'New York, NY',
    type: 'Teams',
    init: 'PW',
    avatarBg: 'rgb(96,165,250)',
    advantage: 'Strong',
    advantageDot: 'rgb(52,211,153)',
    opp: '$24.2M',
    yours: '$4.9M',
    share: '20.2%',
    fit: 95,
    rationale: 'Large Blend gap of $19.3M; team holds 7 categories, missing only mid-cap & private credit overlap. Mary Doe recently rotated $8M out of competitor ETF.',
  },
  {
    name: 'The Smith Group',
    firm: 'Adatum Partners',
    city: 'Boston, MA',
    type: 'Teams',
    init: 'PG',
    avatarBg: 'rgb(167,139,250)',
    advantage: 'Moderate',
    advantageDot: 'rgb(250,204,21)',
    opp: '$18.6M',
    yours: '$3.2M',
    share: '17.2%',
    fit: 88,
    rationale: 'Currently holds Large Blend via Vanguard; fee variance of +12bps suggests price sensitivity. Q3 net inflows up 14%.',
  },
  {
    name: 'Jane Smith',
    firm: 'Litware Advisors',
    city: 'Chicago, IL',
    type: 'FA',
    init: 'JF',
    avatarBg: 'rgb(251,146,60)',
    advantage: 'Strong',
    advantageDot: 'rgb(52,211,153)',
    opp: '$14.8M',
    yours: '$2.1M',
    share: '14.2%',
    fit: 82,
    rationale: 'Solo FA with $87M book; outperformance vs benchmark on Large Blend +160bps. Open to model expansion per last rep visit.',
  },
  {
    name: 'Sample Consulting',
    firm: 'Contoso Wealth',
    city: 'Stamford, CT',
    type: 'Teams',
    init: 'GC',
    avatarBg: 'rgb(45,212,191)',
    advantage: 'Strong',
    advantageDot: 'rgb(52,211,153)',
    opp: '$11.4M',
    yours: '$1.6M',
    share: '14.0%',
    fit: 78,
    rationale: 'Strong relationship via competitive advantage; Large Blend underweight vs peer cohort (-$2.4M expected book size).',
  },
  {
    name: 'Alpine Partners',
    firm: 'Northwind Securities',
    city: 'Denver, CO',
    type: 'BA',
    init: 'AP',
    avatarBg: 'rgb(248,113,113)',
    advantage: 'Strong',
    advantageDot: 'rgb(52,211,153)',
    opp: '$9.2M',
    yours: '$1.1M',
    share: '12.0%',
    fit: 72,
    rationale: 'Geographic expansion target; Large Blend allocation sits in 2 legacy SMAs — model migration opportunity.',
  },
];

const KEY_INSIGHTS = [
  {
    icon: 'arrow-trend-up',
    color: 'rgb(52,211,153)',
    title: '$78M total Large Blend opportunity',
    body: 'Across the top 5 clients, market opportunity exceeds your current book by 6.4×. The Doe Wealth Group alone represents 31% of incremental potential.',
  },
  {
    icon: 'bullseye',
    color: 'rgb(96,165,250)',
    title: 'Doe Wealth has the highest fit score',
    body: 'Strong competitive advantage (CFP®, CFA), recent inflow momentum (+8.3% YoY), and 5 of 7 portfolios already hold compatible Large Blend exposures.',
  },
  {
    icon: 'clock',
    color: 'rgb(251,146,60)',
    title: 'Action window: Q4 2025',
    body: 'Doe Wealth team typically rebalances books in late Q4. Mary Doe has flagged interest in lower-fee Large Blend alternatives in last two rep meetings.',
  },
];

function AIClientRow({ client, rank, onClick }) {
  const [hover, setHover] = React.useState(false);
  const interactive = !!onClick;
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={interactive ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
      style={{
      display:'grid', gridTemplateColumns:'24px 36px 1fr auto auto auto 14px', alignItems:'center', gap:14,
      padding:'12px 14px',
      background: hover && interactive ? 'rgba(16,185,129,0.06)' : 'rgba(255,255,255,0.02)',
      border: hover && interactive ? '1px solid rgba(16,185,129,0.45)' : '1px solid rgba(75,85,99,0.35)',
      borderRadius:10,
      cursor: interactive ? 'pointer' : 'default',
      transition: 'background .14s ease, border-color .14s ease, transform .14s ease',
      transform: hover && interactive ? 'translateY(-1px)' : 'none',
    }}>
      <div style={{
        fontFamily:'Inter', fontSize:12, fontWeight:600, color:'rgb(163,163,163)',
        textAlign:'center',
      }}>{rank}</div>
      <div style={{
        width:32, height:32, borderRadius:6, background:client.avatarBg,
        display:'flex', alignItems:'center', justifyContent:'center',
        fontFamily:'Inter', fontSize:11, fontWeight:600, color:'rgb(17,24,39)',
      }}>{client.init}</div>
      <div style={{ minWidth:0 }}>
        <div style={{
          fontFamily:'Inter', fontSize:13, fontWeight:500, color:'rgb(249,250,251)',
          marginBottom:2, display:'flex', alignItems:'center', gap:8,
        }}>
          <span>{client.name}</span>
          <span style={{
            fontFamily:'Inter', fontSize:9.5, fontWeight:500, color:'rgb(163,163,163)',
            padding:'1px 5px', border:'1px solid rgba(75,85,99,0.5)', borderRadius:3,
          }}>{client.type}</span>
        </div>
        <div style={{ fontFamily:'Inter', fontSize:11, color:'rgb(163,163,163)' }}>
          {client.firm} · {client.city}
        </div>
      </div>
      <div style={{ textAlign:'right' }}>
        <div style={{ fontFamily:'Inter', fontSize:9.5, color:'rgb(115,115,115)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:2 }}>Opp</div>
        <div style={{ fontFamily:'Inter Display', fontSize:14, fontWeight:500, color:'rgb(249,250,251)' }}>{client.opp}</div>
      </div>
      <div style={{ textAlign:'right' }}>
        <div style={{ fontFamily:'Inter', fontSize:9.5, color:'rgb(115,115,115)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:2 }}>Yours</div>
        <div style={{ fontFamily:'Inter Display', fontSize:14, fontWeight:500, color:'rgb(96,165,250)' }}>{client.yours}</div>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:6, paddingLeft:8 }}>
        <div style={{
          width:6, height:6, borderRadius:'50%', background:client.advantageDot,
        }} />
        <span style={{ fontFamily:'Inter', fontSize:11, color:'rgb(209,213,219)' }}>{client.advantage}</span>
      </div>
      <i className="fa-solid fa-chevron-right" style={{
        fontSize:10,
        color: hover && interactive ? 'rgb(52,211,153)' : 'rgb(107,114,128)',
        opacity: interactive ? 1 : 0,
        transition:'color .14s ease, transform .14s ease',
        transform: hover && interactive ? 'translateX(2px)' : 'none',
      }} />
    </div>
  );
}

function AIInsight({ insight }) {
  return (
    <div style={{
      display:'flex', alignItems:'flex-start', gap:12, padding:'10px 0',
    }}>
      <div style={{
        width:28, height:28, borderRadius:6,
        background:`color-mix(in oklab, ${insight.color} 12%, transparent)`,
        border:`1px solid color-mix(in oklab, ${insight.color} 30%, transparent)`,
        display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
      }}>
        <i className={`fa-solid fa-${insight.icon}`} style={{ fontSize:11, color:insight.color }} />
      </div>
      <div style={{ minWidth:0 }}>
        <div style={{ fontFamily:'Inter', fontSize:12.5, fontWeight:500, color:'rgb(249,250,251)', marginBottom:3 }}>
          {insight.title}
        </div>
        <div style={{ fontFamily:'Inter', fontSize:11.5, color:'rgb(163,163,163)', lineHeight:1.55 }}>
          {insight.body}
        </div>
      </div>
    </div>
  );
}

function AIActionButton({ icon, label, sub, onClick, primary }) {
  return (
    <button onClick={onClick} style={{
      flex:1, display:'flex', alignItems:'center', gap:12,
      padding:'12px 14px', borderRadius:10, cursor:'pointer',
      background: primary ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.025)',
      border: primary ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(75,85,99,0.4)',
      textAlign:'left', fontFamily:'Inter',
    }}>
      <div style={{
        width:32, height:32, borderRadius:8,
        background: primary ? 'rgba(16,185,129,0.18)' : 'rgba(255,255,255,0.04)',
        border: primary ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(75,85,99,0.4)',
        display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
      }}>
        <i className={`fa-solid fa-${icon}`} style={{
          fontSize:13, color: primary ? 'rgb(52,211,153)' : 'rgb(209,213,219)',
        }} />
      </div>
      <div style={{ minWidth:0 }}>
        <div style={{ fontSize:13, fontWeight:500, color:'rgb(249,250,251)', marginBottom:2 }}>{label}</div>
        <div style={{ fontSize:11, color:'rgb(163,163,163)' }}>{sub}</div>
      </div>
    </button>
  );
}

function AIInsightsPanel({ prompt, onClient, onViewProfile, onCreateMaterial, onScheduleMeeting }) {
  const promptText = prompt || 'What are my top client opportunities in Large Blend?';
  return (
    <div style={{
      width: '100%', maxWidth: 920,
      background:'rgba(255,255,255,0.025)', border:'1px solid rgba(75,85,99,0.4)',
      borderRadius:14, padding:'20px 22px',
      backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)',
      display:'flex', flexDirection:'column', gap:18,
    }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
        <div style={{
          width:30, height:30, borderRadius:8,
          background:'linear-gradient(135deg, rgba(16,185,129,0.25), rgba(16,185,129,0.08))',
          border:'1px solid rgba(16,185,129,0.4)',
          display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
        }}>
          <i className="fa-solid fa-sparkles" style={{ fontSize:13, color:'rgb(52,211,153)' }} />
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontFamily:'Inter', fontSize:11, color:'rgb(115,115,115)', marginBottom:3 }}>
            <i className="fa-solid fa-user" style={{ fontSize:9, marginRight:6 }} />
            You asked
          </div>
          <div style={{ fontFamily:'Inter', fontSize:14, color:'rgb(229,231,235)' }}>
            {promptText}
          </div>
        </div>
      </div>

      {/* Summary line */}
      <div style={{
        fontFamily:'Inter', fontSize:13.5, color:'rgb(229,231,235)', lineHeight:1.6,
      }}>
        Based on Q3 2025 holdings and flow data, here are your <b style={{ color:'rgb(249,250,251)' }}>top 5 Large Blend opportunities</b>, ranked by fit score combining advantage, gap size, and engagement signals.
      </div>

      {/* Top 5 list */}
      <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
        {TOP_5_CLIENTS.map((c, i) => (
          <AIClientRow
            key={c.name}
            client={c}
            rank={i+1}
            onClick={onClient ? () => onClient(c) : undefined}
          />
        ))}
      </div>

      {/* Key insights */}
      <div>
        <div style={{
          fontFamily:'Inter', fontSize:10.5, fontWeight:500, color:'rgb(115,115,115)',
          textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6, paddingBottom:8,
          borderBottom:'1px solid rgba(75,85,99,0.3)',
        }}>Key insights</div>
        <div>
          {KEY_INSIGHTS.map((ins, i) => <AIInsight key={i} insight={ins} />)}
        </div>
      </div>

      {/* Actions block removed — scheduling and marketing generation are out of
         scope, and the client profile is reachable from any row above. */}
    </div>
  );
}

/* ============================================================
   PowerPoint Preview Modal
   ============================================================ */

const PPT_SLIDES = [
  {
    n: 1,
    label: 'Cover',
    render: () => (
      <div style={{
        width:'92%', height:'100%',
        background:'linear-gradient(135deg, rgb(8,21,33) 0%, rgb(15,32,46) 50%, rgb(6,18,28) 100%)',
        position:'relative', overflow:'hidden',
        display:'flex', flexDirection:'column', justifyContent:'space-between',
        padding:'48px 56px',
      }}>
        {/* decorative jewel-tone glow */}
        <div style={{
          position:'absolute', right:-120, top:-80, width:380, height:380, borderRadius:'50%',
          background:'radial-gradient(circle, rgba(16,185,129,0.18), transparent 70%)',
          filter:'blur(40px)',
        }} />
        <div style={{
          position:'absolute', left:-60, bottom:-80, width:260, height:260, borderRadius:'50%',
          background:'radial-gradient(circle, rgba(96,165,250,0.16), transparent 70%)',
          filter:'blur(32px)',
        }} />
        <div style={{ position:'relative', zIndex:1 }}>
          <div style={{
            fontFamily:'Inter', fontSize:11, fontWeight:500, color:'rgb(52,211,153)',
            textTransform:'uppercase', letterSpacing:'0.16em', marginBottom:14,
          }}>Tailored proposal · Q4 2025</div>
          <div style={{
            fontFamily:'Inter Display, Inter', fontSize:44, fontWeight:500, color:'rgb(249,250,251)',
            letterSpacing:'-0.02em', lineHeight:1.1, marginBottom:14, maxWidth:580,
          }}>Large Blend allocation strategy</div>
          <div style={{
            fontFamily:'Inter', fontSize:18, color:'rgb(163,163,163)', maxWidth:520, lineHeight:1.45,
          }}>
            Prepared for The Doe Wealth Management Group · Contoso Wealth
          </div>
        </div>
        <div style={{ position:'relative', zIndex:1, display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
          <div style={{ fontFamily:'Inter', fontSize:11, color:'rgb(115,115,115)' }}>
            <div style={{ marginBottom:4 }}>Prepared by Field Wealth · Asset Manager</div>
            <div>Confidential · For institutional use only</div>
          </div>
          <div style={{
            fontFamily:'Inter', fontSize:11, color:'rgb(115,115,115)', textAlign:'right',
          }}>
            <div style={{ marginBottom:4 }}>November 20, 2025</div>
            <div>FW-LB-2025-Q4-014</div>
          </div>
        </div>
      </div>
    ),
  },
  {
    n: 2,
    label: 'Opportunity',
    render: () => (
      <div style={{
        width:'92%', height:'100%', background:'rgb(10,25,38)', padding:'40px 56px',
        display:'flex', flexDirection:'column',
      }}>
        <div style={{ fontFamily:'Inter', fontSize:11, fontWeight:500, color:'rgb(52,211,153)', textTransform:'uppercase', letterSpacing:'0.14em', marginBottom:8 }}>The opportunity</div>
        <div style={{ fontFamily:'Inter Display', fontSize:30, fontWeight:500, color:'rgb(249,250,251)', letterSpacing:'-0.015em', marginBottom:24 }}>
          A $24.2M gap to your peer cohort
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:16, marginBottom:24 }}>
          {[
            { l:'Market opp.',     v:'$24.2M', s:'Large Blend, your book',   c:'rgb(96,165,250)' },
            { l:'Current allocation', v:'$4.9M', s:'20.2% of opportunity',   c:'rgb(52,211,153)' },
            { l:'Incremental upside', v:'$19.3M', s:'vs peer cohort median', c:'rgb(167,139,250)' },
          ].map((k,i) => (
            <div key={i} style={{
              background:'rgba(255,255,255,0.03)', border:'1px solid rgba(75,85,99,0.4)',
              borderRadius:10, padding:'18px 18px 16px',
            }}>
              <div style={{ fontFamily:'Inter', fontSize:10, color:'rgb(115,115,115)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 }}>{k.l}</div>
              <div style={{ fontFamily:'Inter Display', fontSize:30, fontWeight:500, color:k.c, letterSpacing:'-0.01em' }}>{k.v}</div>
              <div style={{ fontFamily:'Inter', fontSize:11, color:'rgb(163,163,163)', marginTop:6 }}>{k.s}</div>
            </div>
          ))}
        </div>
        <div style={{ flex:1, display:'flex', gap:24 }}>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:'Inter', fontSize:11, color:'rgb(115,115,115)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10 }}>Why now</div>
            <ul style={{ listStyle:'none', padding:0, margin:0, fontFamily:'Inter', fontSize:13, color:'rgb(209,213,219)', lineHeight:1.7 }}>
              <li style={{ marginBottom:8, paddingLeft:18, position:'relative' }}>
                <span style={{ position:'absolute', left:0, top:9, width:6, height:6, borderRadius:'50%', background:'rgb(52,211,153)' }} />
                Mary Doe rebalanced $8M out of competitor ETF in Q3
              </li>
              <li style={{ marginBottom:8, paddingLeft:18, position:'relative' }}>
                <span style={{ position:'absolute', left:0, top:9, width:6, height:6, borderRadius:'50%', background:'rgb(52,211,153)' }} />
                Team typically rebalances books in late Q4
              </li>
              <li style={{ marginBottom:8, paddingLeft:18, position:'relative' }}>
                <span style={{ position:'absolute', left:0, top:9, width:6, height:6, borderRadius:'50%', background:'rgb(52,211,153)' }} />
                Net inflows up 8.3% YoY — fresh capital deployment cycle
              </li>
            </ul>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:'Inter', fontSize:11, color:'rgb(115,115,115)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10 }}>Fit signals</div>
            <ul style={{ listStyle:'none', padding:0, margin:0, fontFamily:'Inter', fontSize:13, color:'rgb(209,213,219)', lineHeight:1.7 }}>
              <li style={{ marginBottom:8, paddingLeft:18, position:'relative' }}>
                <span style={{ position:'absolute', left:0, top:9, width:6, height:6, borderRadius:'50%', background:'rgb(96,165,250)' }} />
                CFP®, CFA team — sophisticated allocator
              </li>
              <li style={{ marginBottom:8, paddingLeft:18, position:'relative' }}>
                <span style={{ position:'absolute', left:0, top:9, width:6, height:6, borderRadius:'50%', background:'rgb(96,165,250)' }} />
                5 of 7 portfolios already hold compatible exposures
              </li>
              <li style={{ marginBottom:8, paddingLeft:18, position:'relative' }}>
                <span style={{ position:'absolute', left:0, top:9, width:6, height:6, borderRadius:'50%', background:'rgb(96,165,250)' }} />
                Strong competitive advantage rating
              </li>
            </ul>
          </div>
        </div>
      </div>
    ),
  },
  {
    n: 3,
    label: 'Fit',
    render: () => (
      <div style={{
        width:'92%', height:'100%', background:'rgb(10,25,38)', padding:'40px 56px',
        display:'flex', flexDirection:'column',
      }}>
        <div style={{ fontFamily:'Inter', fontSize:11, fontWeight:500, color:'rgb(52,211,153)', textTransform:'uppercase', letterSpacing:'0.14em', marginBottom:8 }}>Portfolio fit</div>
        <div style={{ fontFamily:'Inter Display', fontSize:30, fontWeight:500, color:'rgb(249,250,251)', letterSpacing:'-0.015em', marginBottom:6 }}>
          Where the FW Large Blend strategy fits
        </div>
        <div style={{ fontFamily:'Inter', fontSize:14, color:'rgb(163,163,163)', marginBottom:24 }}>
          Mapped against The Doe Wealth Group's seven-category allocation today
        </div>
        <div style={{ flex:1, display:'flex', gap:32, alignItems:'center' }}>
          {/* Side-by-side allocation chart */}
          <div style={{ flex:1, display:'flex', flexDirection:'column', gap:8 }}>
            {[
              { name:'Large Growth',     cur:28, c:'rgb(59,130,246)' },
              { name:'Large Blend',      cur:14, prop:22, c:'rgb(96,165,250)', highlight:true },
              { name:'Multi-sector Bond',cur:18, c:'rgb(167,139,250)' },
              { name:'Int. Core Plus',   cur:12, c:'rgb(139,92,246)' },
              { name:'Foreign Lg.',      cur:10, c:'rgb(14,165,233)' },
              { name:'EM',               cur:8,  c:'rgb(45,212,191)' },
              { name:'Private Credit',   cur:10, c:'rgb(249,115,22)' },
            ].map((row,i) => (
              <div key={i} style={{ display:'grid', gridTemplateColumns:'120px 1fr 56px', alignItems:'center', gap:12 }}>
                <div style={{
                  fontFamily:'Inter', fontSize:11.5,
                  color: row.highlight ? 'rgb(52,211,153)' : 'rgb(209,213,219)',
                  fontWeight: row.highlight ? 500 : 400,
                }}>
                  {row.name}
                </div>
                <div style={{ position:'relative', height:18, background:'rgba(255,255,255,0.04)', borderRadius:3, overflow:'hidden' }}>
                  <div style={{
                    position:'absolute', left:0, top:0, bottom:0,
                    width:`${row.cur*2.5}%`, background: row.c, opacity:0.55,
                  }} />
                  {row.prop && (
                    <div style={{
                      position:'absolute', left:`${row.cur*2.5}%`, top:0, bottom:0,
                      width:`${(row.prop-row.cur)*2.5}%`, background:'rgb(52,211,153)',
                      borderLeft:'1px solid rgba(0,0,0,0.4)',
                    }} />
                  )}
                </div>
                <div style={{ fontFamily:'Inter Display', fontSize:12, color:'rgb(229,231,235)', textAlign:'right' }}>
                  {row.prop ? `${row.cur}→${row.prop}%` : `${row.cur}%`}
                </div>
              </div>
            ))}
            <div style={{ display:'flex', gap:18, marginTop:14, fontFamily:'Inter', fontSize:11, color:'rgb(163,163,163)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ width:10, height:10, background:'rgba(96,165,250,0.55)', borderRadius:2 }} /> Current
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ width:10, height:10, background:'rgb(52,211,153)', borderRadius:2 }} /> Proposed add
              </div>
            </div>
          </div>
          {/* Callout */}
          <div style={{
            width:280, padding:'22px 22px',
            background:'rgba(16,185,129,0.06)', border:'1px solid rgba(16,185,129,0.3)', borderRadius:10,
          }}>
            <div style={{ fontFamily:'Inter', fontSize:10, fontWeight:500, color:'rgb(52,211,153)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 }}>Recommended shift</div>
            <div style={{ fontFamily:'Inter Display', fontSize:30, fontWeight:500, color:'rgb(249,250,251)', marginBottom:10 }}>
              +8 pts
            </div>
            <div style={{ fontFamily:'Inter', fontSize:12, color:'rgb(209,213,219)', lineHeight:1.5 }}>
              Increase Large Blend from 14% to 22%, reallocating from overweight Large Growth and legacy bond exposures.
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    n: 4,
    label: 'Performance',
    render: () => (
      <div style={{
        width:'92%', height:'100%', background:'rgb(10,25,38)', padding:'40px 56px',
        display:'flex', flexDirection:'column',
      }}>
        <div style={{ fontFamily:'Inter', fontSize:11, fontWeight:500, color:'rgb(52,211,153)', textTransform:'uppercase', letterSpacing:'0.14em', marginBottom:8 }}>Performance</div>
        <div style={{ fontFamily:'Inter Display', fontSize:30, fontWeight:500, color:'rgb(249,250,251)', letterSpacing:'-0.015em', marginBottom:24 }}>
          5-year performance vs benchmark
        </div>
        <div style={{ flex:1, display:'flex', gap:24 }}>
          {/* Chart */}
          <div style={{ flex:1.2, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(75,85,99,0.4)', borderRadius:10, padding:18, position:'relative' }}>
            <PerformanceChart />
            <div style={{ position:'absolute', top:18, right:22, display:'flex', gap:14, fontFamily:'Inter', fontSize:10.5, color:'rgb(163,163,163)', zIndex:2 }}>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}><span style={{ width:14, height:2, background:'rgb(52,211,153)' }} /> FW Large Blend</div>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}><span style={{ width:14, height:1.5, borderTop:'1.5px dashed rgb(115,115,115)' }} /> S&P 500</div>
            </div>
          </div>
          {/* stats */}
          <div style={{ flex:1, display:'flex', flexDirection:'column', gap:10 }}>
            {[
              { l:'5y annualized return', v:'+13.4%', s:'vs S&P 500: +11.2%', c:'rgb(52,211,153)' },
              { l:'Outperformance',       v:'+220 bps', s:'rolling 3y',         c:'rgb(96,165,250)' },
              { l:'Sharpe ratio',         v:'1.18',    s:'vs benchmark: 0.94', c:'rgb(167,139,250)' },
              { l:'Net expense ratio',    v:'0.32%',   s:'24bps below median', c:'rgb(251,146,60)' },
            ].map((k,i) => (
              <div key={i} style={{
                background:'rgba(255,255,255,0.025)', border:'1px solid rgba(75,85,99,0.4)',
                borderRadius:8, padding:'12px 14px',
                display:'flex', justifyContent:'space-between', alignItems:'center',
              }}>
                <div>
                  <div style={{ fontFamily:'Inter', fontSize:10.5, color:'rgb(115,115,115)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>{k.l}</div>
                  <div style={{ fontFamily:'Inter', fontSize:11, color:'rgb(163,163,163)' }}>{k.s}</div>
                </div>
                <div style={{ fontFamily:'Inter Display', fontSize:22, fontWeight:500, color:k.c }}>{k.v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  },
  {
    n: 5,
    label: 'Next steps',
    render: () => (
      <div style={{
        width:'92%', height:'100%', background:'rgb(10,25,38)', padding:'40px 56px',
        display:'flex', flexDirection:'column',
      }}>
        <div style={{ fontFamily:'Inter', fontSize:11, fontWeight:500, color:'rgb(52,211,153)', textTransform:'uppercase', letterSpacing:'0.14em', marginBottom:8 }}>Next steps</div>
        <div style={{ fontFamily:'Inter Display', fontSize:30, fontWeight:500, color:'rgb(249,250,251)', letterSpacing:'-0.015em', marginBottom:24 }}>
          Proposed engagement plan
        </div>
        <div style={{ flex:1, display:'flex', flexDirection:'column', gap:14 }}>
          {[
            { w:'Week 1', t:'Discovery call with Mary Doe', s:'30-min review of current Large Blend exposure and rebalancing thesis', icon:'phone' },
            { w:'Week 2', t:'Tailored model proposal',           s:'Side-by-side performance, fee, and risk analysis vs current allocation',  icon:'file-lines' },
            { w:'Week 3–4', t:'Team presentation at NY office',  s:'45-min walk-through with John Doe and team; investment policy alignment', icon:'users' },
            { w:'Q1 2026', t:'Funding & onboarding',             s:'Initial $4–6M tranche, with quarterly review cadence established',         icon:'check' },
          ].map((s,i) => (
            <div key={i} style={{
              display:'grid', gridTemplateColumns:'90px 36px 1fr', alignItems:'flex-start', gap:16,
              padding:'14px 16px', background:'rgba(255,255,255,0.02)',
              border:'1px solid rgba(75,85,99,0.4)', borderRadius:10,
            }}>
              <div style={{
                fontFamily:'Inter', fontSize:11, fontWeight:500, color:'rgb(52,211,153)',
                textTransform:'uppercase', letterSpacing:'0.08em', paddingTop:6,
              }}>{s.w}</div>
              <div style={{
                width:32, height:32, borderRadius:6, background:'rgba(52,211,153,0.1)',
                border:'1px solid rgba(52,211,153,0.3)',
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>
                <i className={`fa-solid fa-${s.icon}`} style={{ fontSize:13, color:'rgb(52,211,153)' }} />
              </div>
              <div>
                <div style={{ fontFamily:'Inter', fontSize:14, fontWeight:500, color:'rgb(249,250,251)', marginBottom:4 }}>{s.t}</div>
                <div style={{ fontFamily:'Inter', fontSize:12, color:'rgb(163,163,163)' }}>{s.s}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
];

function SlideStage({ children }) {
  // Native slide size — content is designed at this resolution.
  const NATIVE_W = 1280, NATIVE_H = 720;
  const wrapRef = React.useRef(null);
  const [scale, setScale] = React.useState(1);

  React.useEffect(() => {
    const recalc = () => {
      if (!wrapRef.current) return;
      const rect = wrapRef.current.getBoundingClientRect();
      const sx = rect.width / NATIVE_W;
      const sy = rect.height / NATIVE_H;
      setScale(Math.min(sx, sy, 1));
    };
    recalc();
    const ro = new ResizeObserver(recalc);
    if (wrapRef.current) ro.observe(wrapRef.current);
    window.addEventListener('resize', recalc);
    return () => { ro.disconnect(); window.removeEventListener('resize', recalc); };
  }, []);

  return (
    <div style={{
      width:'100%', flex:1, minWidth:0, minHeight:0,
      position:'relative', overflow:'hidden',
    }}>
      <div ref={wrapRef} style={{
        position:'absolute', inset:0,
        display:'flex', alignItems:'center', justifyContent:'center',
      }}>
        <div style={{
          width: NATIVE_W, height: NATIVE_H,
          transform: `scale(${scale})`, transformOrigin:'center center',
          border:'1px solid rgba(75,85,99,0.4)', borderRadius: 6 / scale,
          boxShadow:'0 24px 60px rgba(0,0,0,0.55)', overflow:'hidden',
          flexShrink:0,
        }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function PPTPreviewModal({ open, onClose }) {
  const [idx, setIdx] = React.useState(0);
  React.useEffect(() => { if (open) setIdx(0); }, [open]);
  if (!open) return null;

  const slide = PPT_SLIDES[idx];

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:200,
      background:'rgba(0,0,0,0.7)', backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)',
      display:'flex', flexDirection:'column',
      animation:'fadeIn 0.2s ease',
    }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
      {/* top toolbar */}
      <div style={{
        height:52, padding:'0 18px', display:'flex', alignItems:'center', gap:14,
        borderBottom:'1px solid rgba(75,85,99,0.4)', background:'rgba(10,25,38,0.75)',
      }}>
        <div style={{
          width:26, height:26, borderRadius:6, background:'rgba(228,76,46,0.15)',
          border:'1px solid rgba(228,76,46,0.4)',
          display:'flex', alignItems:'center', justifyContent:'center',
        }}>
          <i className="fa-solid fa-file-powerpoint" style={{ fontSize:13, color:'rgb(232,116,86)' }} />
        </div>
        <div style={{ flex:1, fontFamily:'Inter', fontSize:13, color:'rgb(229,231,235)' }}>
          <span style={{ fontWeight:500 }}>Doe Wealth — Large Blend Proposal.pptx</span>
          <span style={{ color:'rgb(115,115,115)', marginLeft:10, fontSize:11 }}>generated by AI · 5 slides · just now</span>
        </div>
        <button style={{
          height:30, padding:'0 14px', borderRadius:6,
          background:'rgba(255,255,255,0.04)', border:'1px solid rgba(75,85,99,0.5)',
          color:'rgb(229,231,235)', fontFamily:'Inter', fontSize:12, cursor:'pointer',
          display:'flex', alignItems:'center', gap:8,
        }}>
          <i className="fa-solid fa-pen" style={{ fontSize:11 }} /> Edit
        </button>
        <button style={{
          height:30, padding:'0 14px', borderRadius:6,
          background:'rgba(16,185,129,0.15)', border:'1px solid rgba(16,185,129,0.4)',
          color:'rgb(52,211,153)', fontFamily:'Inter', fontSize:12, fontWeight:500, cursor:'pointer',
          display:'flex', alignItems:'center', gap:8,
        }}>
          <i className="fa-solid fa-arrow-down-to-line" style={{ fontSize:11 }} /> Download
        </button>
        <button onClick={onClose} style={{
          width:30, height:30, borderRadius:6,
          background:'transparent', border:'1px solid rgba(75,85,99,0.5)',
          color:'rgb(163,163,163)', cursor:'pointer',
          display:'flex', alignItems:'center', justifyContent:'center',
        }}>
          <i className="fa-solid fa-xmark" style={{ fontSize:13 }} />
        </button>
      </div>

      {/* main */}
      <div style={{ flex:1, display:'flex', minHeight:0 }}>
        {/* slide thumbnails */}
        <div style={{
          width:170, padding:'18px 12px', overflowY:'auto',
          borderRight:'1px solid rgba(75,85,99,0.4)', background:'rgba(8,21,33,0.5)',
        }}>
          {PPT_SLIDES.map((s,i) => (
            <button key={s.n} onClick={() => setIdx(i)} style={{
              display:'block', width:'100%', marginBottom:10, padding:0,
              background:'transparent', border:'none', cursor:'pointer', textAlign:'left',
            }}>
              <div style={{
                aspectRatio:'16/9', width:'100%',
                border: i === idx ? '2px solid rgb(52,211,153)' : '1px solid rgba(75,85,99,0.5)',
                borderRadius:4, overflow:'hidden', position:'relative',
                boxShadow: i === idx ? '0 0 0 3px rgba(52,211,153,0.18)' : 'none',
              }}>
                <div style={{
                  position:'absolute', inset:0,
                  transform:'scale(0.18)', transformOrigin:'top left',
                  width:'555%', height:'555%',
                }}>{s.render()}</div>
              </div>
              <div style={{
                fontFamily:'Inter', fontSize:11, color: i === idx ? 'rgb(229,231,235)' : 'rgb(163,163,163)',
                marginTop:6, paddingLeft:2,
              }}>
                <span style={{ color:'rgb(115,115,115)', marginRight:6 }}>{s.n}</span>{s.label}
              </div>
            </button>
          ))}
        </div>

        {/* slide canvas */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'28px 32px', gap:16, minWidth:0, minHeight:0 }}>
          <SlideStage>{slide.render()}</SlideStage>
          {/* nav */}
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <button onClick={() => setIdx(Math.max(0, idx-1))} disabled={idx === 0} style={{
              width:34, height:34, borderRadius:6,
              background:'rgba(255,255,255,0.04)', border:'1px solid rgba(75,85,99,0.5)',
              color: idx === 0 ? 'rgb(75,85,99)' : 'rgb(229,231,235)',
              cursor: idx === 0 ? 'default' : 'pointer',
              display:'flex', alignItems:'center', justifyContent:'center',
            }}>
              <i className="fa-solid fa-chevron-left" style={{ fontSize:12 }} />
            </button>
            <div style={{ fontFamily:'Inter', fontSize:12, color:'rgb(163,163,163)', minWidth:60, textAlign:'center' }}>
              {idx+1} / {PPT_SLIDES.length}
            </div>
            <button onClick={() => setIdx(Math.min(PPT_SLIDES.length-1, idx+1))} disabled={idx === PPT_SLIDES.length-1} style={{
              width:34, height:34, borderRadius:6,
              background:'rgba(255,255,255,0.04)', border:'1px solid rgba(75,85,99,0.5)',
              color: idx === PPT_SLIDES.length-1 ? 'rgb(75,85,99)' : 'rgb(229,231,235)',
              cursor: idx === PPT_SLIDES.length-1 ? 'default' : 'pointer',
              display:'flex', alignItems:'center', justifyContent:'center',
            }}>
              <i className="fa-solid fa-chevron-right" style={{ fontSize:12 }} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PerformanceChart() {
  const opts = React.useMemo(() => ({
    chart: { type: 'area', spacing: [10, 6, 6, 6], backgroundColor: 'transparent' },
    xAxis: {
      categories: ['2020','2021','2022','2023','2024','2025'],
      lineColor: 'transparent', tickLength: 0,
      labels: { style: { color: 'rgb(115,115,115)', fontSize: '10.5px' } },
    },
    yAxis: {
      visible: false,
      gridLineColor: 'rgba(75,85,99,0.25)', gridLineDashStyle: 'Solid',
    },
    legend: { enabled: false },
    tooltip: {
      shared: true,
      pointFormat: '<span style="color:{series.color}">●</span> {series.name}: <b>{point.y}</b><br/>',
    },
    plotOptions: {
      series: { marker: { enabled: false } },
    },
    series: [
      {
        type: 'line', name: 'S&P 500',
        data: [100, 108, 116, 128, 142, 158],
        color: 'rgb(115,115,115)', lineWidth: 1.5, dashStyle: 'Dash',
      },
      {
        type: 'area', name: 'FW Large Blend',
        data: [100, 112, 124, 140, 160, 184],
        color: 'rgb(52,211,153)',
      },
    ],
  }), []);
  return <div style={{ width:'100%', height:'100%' }}><HC options={opts} /></div>;
}

Object.assign(window, { AIInsightsPanel, PPTPreviewModal, TOP_5_CLIENTS });
