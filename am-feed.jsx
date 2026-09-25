/* Asset-manager home feed — one mixed stream under the composer, laid out as
   social-style posts: source header, copy, media (stats / chart), then actions.
   Mirrors the advisor feed pattern; content is asset-manager work: opportunity,
   flows, competitive advantage, territory coverage and data delivery. */

const MF_INK   = 'rgb(249,250,251)';
const MF_INK_2 = 'rgb(229,231,235)';
const MF_MUTED = 'rgb(163,163,163)';
const MF_DIM   = 'rgb(115,115,115)';
const MF_LINE  = 'rgba(75,85,99,0.45)';
const MF_GREEN = 'rgb(52,211,153)';
const MF_BLUE  = 'rgb(96,165,250)';
const MF_VIO   = 'rgb(167,139,250)';
const MF_AMBER = 'rgb(251,191,36)';
const MF_RED   = 'rgb(248,113,113)';

const MF_KINDS = {
  opportunity: { label:'Opportunity', icon:'bullseye',          color:MF_GREEN },
  flow:        { label:'Flows',       icon:'arrow-trend-down',  color:MF_BLUE  },
  advantage:   { label:'Advantage',   icon:'trophy',            color:MF_AMBER },
  territory:   { label:'Territory',   icon:'map-location-dot',  color:MF_VIO   },
  data:        { label:'Data',        icon:'database',          color:MF_MUTED },
};

/* ---------- media ---------- */

function MfStats({ stats }) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:`repeat(${stats.length}, 1fr)`, border:`1px solid ${MF_LINE}`, borderRadius:10, overflow:'hidden', background:'rgba(5,122,85,0.05)' }}>
      {stats.map((s, i) => (
        <div key={s.k} style={{ padding:'14px 16px', borderLeft: i ? `1px solid ${MF_LINE}` : 'none' }}>
          <div style={{ fontFamily:'Inter', fontSize:10, color:MF_DIM, letterSpacing:'0.06em', textTransform:'uppercase' }}>{s.k}</div>
          <div style={{ fontFamily:'Inter Display, Inter', fontSize:20, fontWeight:500, color: s.tone === 'down' ? MF_RED : s.tone === 'up' ? MF_GREEN : MF_INK, marginTop:4 }}>{s.v}</div>
        </div>
      ))}
    </div>
  );
}

/* Monthly net flow columns — red below the zero line. */
function MfFlowChart({ series, label, note }) {
  const max = Math.max(...series.map(v => Math.abs(v))) || 1;
  return (
    <div style={{ borderRadius:10, overflow:'hidden', border:`1px solid ${MF_LINE}`, background:'rgba(96,165,250,0.05)' }}>
      <div style={{ height:130, display:'flex', alignItems:'stretch', gap:5, padding:'12px 14px', position:'relative' }}>
        <div style={{ position:'absolute', left:14, right:14, top:'50%', borderTop:'1px dashed rgba(148,163,184,0.55)' }} />
        {series.map((v, i) => {
          const h = (Math.abs(v) / max) * 100;
          const up = v >= 0;
          return (
            <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center' }}>
              <div style={{ height:53, display:'flex', alignItems:'flex-end' }}>
                {up && <div style={{ width:'100%', height:`${h}%`, minHeight:2, background:'rgba(52,211,153,0.45)', borderTop:`1.5px solid ${MF_GREEN}`, borderRadius:'2px 2px 0 0' }} />}
              </div>
              <div style={{ height:53, display:'flex', alignItems:'flex-start' }}>
                {!up && <div style={{ width:'100%', height:`${h}%`, minHeight:2, background:'rgba(248,113,113,0.40)', borderBottom:`1.5px solid ${MF_RED}`, borderRadius:'0 0 2px 2px' }} />}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'0 12px', height:30, borderTop:`1px solid ${MF_LINE}`, background:'rgba(9,17,29,0.5)' }}>
        <span style={{ fontFamily:'Inter', fontSize:10.5, color:MF_MUTED, letterSpacing:'0.05em', textTransform:'uppercase' }}>{label}</span>
        <span style={{ flex:1 }} />
        <span style={{ fontFamily:'Inter', fontSize:10.5, color:MF_RED }}>{note}</span>
      </div>
    </div>
  );
}

/* Your share vs the category — paired bars. */
function MfShareChart({ rows, footer }) {
  const max = Math.max(...rows.flatMap(r => [r.you, r.peer])) || 1;
  return (
    <div style={{ borderRadius:10, overflow:'hidden', border:`1px solid ${MF_LINE}`, background:'rgba(5,122,85,0.05)' }}>
      <div style={{ padding:'14px 14px 10px', display:'flex', flexDirection:'column', gap:10 }}>
        {rows.map(r => (
          <div key={r.name} style={{ display:'grid', gridTemplateColumns:'120px 1fr 52px', alignItems:'center', gap:10 }}>
            <span style={{ fontFamily:'Inter', fontSize:11, color:MF_INK_2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{r.name}</span>
            <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
              <div style={{ height:8, width:`${(r.you / max) * 100}%`, minWidth:3, background:'rgba(52,211,153,0.5)', borderRight:`1.5px solid ${MF_GREEN}`, borderRadius:2 }} />
              <div style={{ height:8, width:`${(r.peer / max) * 100}%`, minWidth:3, background:'rgba(255,255,255,0.10)', borderRight:`1.5px solid ${MF_DIM}`, borderRadius:2 }} />
            </div>
            <span style={{ fontFamily:'Inter', fontSize:11, color: r.gap < 0 ? MF_RED : MF_GREEN, textAlign:'right' }}>{r.gap > 0 ? `+${r.gap}` : r.gap}bps</span>
          </div>
        ))}
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:14, padding:'0 12px', height:30, borderTop:`1px solid ${MF_LINE}`, background:'rgba(9,17,29,0.5)' }}>
        <span style={{ display:'inline-flex', alignItems:'center', gap:6, fontFamily:'Inter', fontSize:10.5, color:MF_MUTED }}>
          <span style={{ width:12, height:6, background:'rgba(52,211,153,0.5)', borderRadius:1 }} /> Your share
        </span>
        <span style={{ display:'inline-flex', alignItems:'center', gap:6, fontFamily:'Inter', fontSize:10.5, color:MF_MUTED }}>
          <span style={{ width:12, height:6, background:'rgba(255,255,255,0.12)', borderRadius:1 }} /> Peer median
        </span>
        <span style={{ flex:1 }} />
        <span style={{ fontFamily:'Inter', fontSize:10.5, color:MF_DIM, whiteSpace:'nowrap' }}>{footer}</span>
      </div>
    </div>
  );
}

/* ---------- content ---------- */
/* ask → re-runs the prompt in the conversation view; go → jumps to a dashboard. */

const MF_ITEMS = [
  { kind:'opportunity', id:'opp-large-blend', when:'Today', initials:'DW',
    who:'Field AI · The Doe Wealth Group', eyebrow:'Whitespace in your book',
    title:'Doe Wealth is $2.4M light in Large Blend versus its peer cohort',
    body:'5 of 7 portfolios already hold compatible Large Blend exposure and the team is running +8.3% YoY inflows. Four more teams in the same cohort show the same gap.',
    stats:[{ k:'Expected book', v:'$6.1M' }, { k:'Current', v:'$3.7M' }, { k:'Fit score', v:'78' }],
    meta:['Large Blend','MF + ETF','Contoso Wealth','New York, NY'],
    action:'See the full answer', ask:'What are my top client opportunities in large blend?' },

  { kind:'flow', id:'flow-edj', when:'2h ago', initials:'EJ',
    who:'Edward Jones · Level 1 producers', eyebrow:'Redemption signal',
    title:'Net flow turned negative across 4 Level 1 producers for a third month',
    body:'Outflows concentrate in Intermediate Core-Plus. Two of the four moved assets to a competitor sleeve with a 6bps lower fee.',
    chart:<MfFlowChart series={[3.2, 2.1, 1.4, -0.6, -1.9, -2.8]} label="Net flow · rolling 6 months" note="-$5.3M trailing 90d" />,
    meta:['Intermediate Core-Plus','$41.8M AUM at risk','Wirehouse'],
    action:'Open Management', go:'management' },

  { kind:'advantage', id:'adv-gain', when:'Today', initials:'CA',
    who:'Field AI · Competitive advantage', eyebrow:'Position moved in your favour',
    title:'You gained competitive advantage on 6 teams in Intermediate Core-Plus',
    body:'Performance advantage widened while fee variance held flat, so the gain is durable enough to lead with in a quarterly review.',
    stats:[{ k:'Comp adv $', v:'+$18.6M', tone:'up' }, { k:'Teams', v:'6' }, { k:'Fee variance', v:'0.0bps' }],
    meta:['Intermediate Core-Plus','Perf +3.1','Q3 2025'],
    action:'Open Competitive Advantage', go:'advantage' },

  { kind:'territory', id:'terr-ny', when:'Yesterday', initials:'NY',
    who:'Territory Analytics · NY metro', eyebrow:'Coverage gap',
    title:'12 top producers in NY metro have no meeting logged this quarter',
    body:'Together they hold $310M in categories you compete in. Three sit inside an hour of a rep already travelling to the city next week.',
    stats:[{ k:'Producers', v:'12' }, { k:'Addressable AUM', v:'$310M' }, { k:'Reps in market', v:'3' }],
    meta:['Level 2','NY metro','RIA + Wirehouse','No touch 90d+'],
    action:'Open Territory Analytics', go:'l2sales' },

  { kind:'flow', id:'mkt-share', when:'Today', initials:'M★',
    who:'Morningstar · Category flows', eyebrow:'Market context',
    title:'Large Blend took in $18.4B industry-wide last quarter; your share slipped 20bps',
    body:'The category grew faster than your book in three of five categories you compete in. Mid-Cap Growth is the only one where you outgrew the peer median.',
    chart:<MfShareChart rows={[
      { name:'Large Blend', you:1.4, peer:1.6, gap:-20 },
      { name:'Int. Core-Plus', you:2.1, peer:2.0, gap:10 },
      { name:'Mid-Cap Growth', you:1.9, peer:1.5, gap:40 },
      { name:'Foreign Large', you:0.8, peer:1.2, gap:-40 },
    ]} footer="Q3 2025 · Morningstar + Broadridge" />,
    meta:['5 categories','Q3 2025','MF + ETF'],
    action:'Open Opportunity', go:'opportunity' },

  { kind:'opportunity', id:'opp-focus', when:'Today', initials:'FP',
    who:'Field AI · Focus products', eyebrow:'Signal confidence',
    title:'38 FA/Teams carry a focus-product signal above 70 confidence',
    body:'Ranked by holdings fit, recent rotation and engagement momentum. 14 have never been contacted about the product they score highest on.',
    stats:[{ k:'FA/Teams', v:'38' }, { k:'Signal opp.', v:'$96M' }, { k:'Never contacted', v:'14' }],
    meta:['Level 3','3 focus products','Confidence ≥ 70','All channels'],
    action:'Open Segmentation & Signals', go:'l3intel' },

  { kind:'advantage', id:'adv-fee', when:'3d ago', initials:'SG',
    who:'The Smith Group · Adatum Partners', eyebrow:'Position moved against you',
    title:'Fee variance moved 4bps against you at The Smith Group',
    body:'A competitor share class repriced inside two model sleeves. Performance advantage still holds, so the relationship is defensible on outcome rather than cost.',
    stats:[{ k:'Fee variance', v:'-4.0bps', tone:'down' }, { k:'AUM exposed', v:'$28.4M' }, { k:'Perf advantage', v:'+2.2' }],
    meta:['Boston, MA','Large Growth','Model sleeves'],
    action:'Open Competitive Advantage', go:'advantage' },

  { kind:'territory', id:'l2-gap', when:'2d ago', initials:'R12',
    who:'Territory Analytics · Northeast territory', eyebrow:'Coverage against production',
    title:'Segment A absorbs a third of your coverage and 80% of the signal opportunity',
    body:'27 FA/Teams in Segment A took 226 of 680 logged activities in the rolling 12. The 54 in Segment C took 265 for $2.4M of actual sales.',
    stats:[{ k:'R12 actual', v:'$363M' }, { k:'Market share', v:'2.1%' }, { k:'Acts per FA', v:'5.7' }],
    meta:['Level 2','Northeast territory','Rolling 12'],
    action:'Open Territory Analytics', go:'l2sales' },

  { kind:'advantage', id:'l3-nba', when:'This morning', initials:'NBA',
    who:'Segmentation & Signals · Next best action', eyebrow:'Model refresh',
    title:'298 signals refreshed overnight across 120 FA/Teams',
    body:'Meeting Opportunity is the largest family at $106M, ahead of Performance Advantage. Asset-weighted confidence across the territory holds at 69.',
    stats:[{ k:'Signal opp.', v:'$333–619M' }, { k:'Signals', v:'298' }, { k:'Wtd conf.', v:'69' }],
    meta:['Level 3','Northeast territory','Nightly model run'],
    action:'Open Segmentation & Signals', go:'l3intel' },

  { kind:'data', id:'data-ubs', when:'This morning', initials:'DB',
    who:'Data Packs · UBS FA Data', eyebrow:'Delivery',
    title:'September UBS FA file loaded — 15,420 FAs, 84,213 rows',
    body:'Tier 3 columns are live, so category data in wide format is available for the UBS book from this refresh forward.',
    meta:['Monthly cadence','FA grain','Tier 3','Loaded 06:12 ET'],
    stats:[{ k:'FAs', v:'15,420' }, { k:'Rows', v:'84,213' }, { k:'Coverage', v:'98.6%' }],
    action:'Open Data Packs', go:'datapacks' },
];

function MfChip({ children }) {
  return (
    <span style={{
      fontFamily:'Inter', fontSize:10.5, color:MF_MUTED, whiteSpace:'nowrap',
      padding:'2px 7px', border:`1px solid ${MF_LINE}`, borderRadius:4,
    }}>{children}</span>
  );
}

function MfPost({ item, onOpen }) {
  const [hover, setHover] = React.useState(false);
  const k = MF_KINDS[item.kind];
  return (
    <article onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}
      style={{
        border: hover ? '1px solid rgba(5,122,85,0.35)' : `1px solid ${MF_LINE}`,
        borderRadius:14, background:'rgba(255,255,255,0.025)',
        transition:'border-color .14s ease', overflow:'hidden', textAlign:'left',
      }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 18px 12px' }}>
        <div style={{
          width:36, height:36, borderRadius:10, flexShrink:0,
          background:`color-mix(in oklab, ${k.color} 14%, transparent)`,
          border:`1px solid color-mix(in oklab, ${k.color} 32%, transparent)`,
          display:'flex', alignItems:'center', justifyContent:'center',
          fontFamily:'Inter', fontSize:12, fontWeight:600, color:k.color,
        }}>{item.initials}</div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontFamily:'Inter', fontSize:13, fontWeight:500, color:MF_INK }}>{item.who}</div>
          <div style={{ display:'flex', alignItems:'center', gap:7, marginTop:2, flexWrap:'wrap' }}>
            <span style={{ fontFamily:'Inter', fontSize:10.5, fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase', color:k.color }}>
              <i className={`fa-solid fa-${k.icon}`} style={{ fontSize:9, marginRight:5 }} />{k.label}
            </span>
            <span style={{ color:MF_DIM }}>·</span>
            <span style={{ fontFamily:'Inter', fontSize:11, color:MF_MUTED }}>{item.eyebrow}</span>
            <span style={{ color:MF_DIM }}>·</span>
            <span style={{ fontFamily:'Inter', fontSize:11, color:MF_DIM }}>{item.when}</span>
          </div>
        </div>
        <i className="fa-solid fa-ellipsis" style={{ fontSize:13, color:MF_DIM }} />
      </div>

      <div style={{ padding:'0 18px 12px' }}>
        <div style={{ fontFamily:'Inter', fontSize:15, fontWeight:500, color:MF_INK, lineHeight:1.4, textWrap:'pretty' }}>{item.title}</div>
        {item.body && (
          <div style={{ fontFamily:'Inter', fontSize:12.5, color:MF_MUTED, lineHeight:1.6, marginTop:6 }}>{item.body}</div>
        )}
      </div>

      <div onClick={()=>onOpen(item)} style={{ padding:'0 18px 14px', cursor:'pointer' }}>
        {item.stats ? <MfStats stats={item.stats} /> : item.chart}
      </div>

      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 18px 14px', flexWrap:'wrap' }}>
        <div style={{ display:'flex', gap:6, flex:1, flexWrap:'wrap', minWidth:0 }}>
          {(item.meta || []).filter(Boolean).map((m, i) => <MfChip key={i}>{m}</MfChip>)}
        </div>
        <button onClick={()=>onOpen(item)} style={{
          height:30, padding:'0 14px', borderRadius:8, cursor:'pointer', whiteSpace:'nowrap',
          fontFamily:'Inter', fontSize:12, fontWeight:500,
          background: hover ? 'rgba(5,122,85,0.18)' : 'rgba(255,255,255,0.04)',
          border: hover ? '1px solid rgba(5,122,85,0.45)' : `1px solid ${MF_LINE}`,
          color: hover ? MF_GREEN : MF_INK_2,
          display:'inline-flex', alignItems:'center', gap:8,
          transition:'background .14s ease, border-color .14s ease, color .14s ease',
        }}>
          {item.action}
          <i className="fa-solid fa-chevron-right" style={{ fontSize:9 }} />
        </button>
      </div>
    </article>
  );
}

function MfFilter({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      height:26, padding:'0 11px', borderRadius:9999, cursor:'pointer',
      fontFamily:'Inter', fontSize:11.5, fontWeight:500,
      background: active ? 'rgba(5,122,85,0.16)' : 'transparent',
      border: active ? '1px solid rgba(5,122,85,0.40)' : `1px solid ${MF_LINE}`,
      color: active ? MF_GREEN : MF_MUTED,
    }}>{label}</button>
  );
}

/* Top next best actions — the demo's home view. Ranked straight out of the
   Level 3 signal models rather than authored: highest-confidence signal per
   FA/Team, ordered by confidence then by the opportunity behind it. */

function MfNbaCard({ p, rank, onNav }) {
  const [hover, setHover] = React.useState(false);
  const s = p.nba;
  // The next best action carries its own colour, icon and label; its family
  // comes from the underlying signal type.
  const base = LV_SIG_META[s.signal] || LV_SIG_META[String(s.signal).split(':')[0].trim()] || {};
  const meta = { color: s.color || base.color || 'rgb(148,163,184)', icon: s.icon || base.icon || 'bolt', group: base.group || 'Signal' };
  const sig = p.signals.find(x => x.type === s.signal) || p.signals[0] || {};
  const seg = LV_SEG_META[p.segment];
  const act = p.actTotal;
  return (
    <article style={{
      border: `1px solid ${MF_LINE}`, borderRadius: 12, background: 'rgba(255,255,255,0.025)',
      padding: '14px 16px 13px', display: 'flex', flexDirection: 'column', gap: 11,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{
          width: 26, height: 26, borderRadius: 7, flexShrink: 0, marginTop: 1,
          background: 'rgba(5,122,85,0.16)', border: '1px solid rgba(5,122,85,0.4)',
          color: MF_GREEN, fontFamily: 'Inter', fontSize: 11, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>{rank}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <span style={{ fontFamily: 'Inter', fontSize: 13.5, fontWeight: 600, color: MF_INK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
            <span title={`Segment ${p.segment}`} style={{
              flexShrink: 0, width: 17, height: 17, borderRadius: 5,
              background: seg.dot.replace('rgb', 'rgba').replace(')', ',0.18)'),
              border: `1px solid ${seg.dot}`, color: seg.dot,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Inter', fontSize: 9.5, fontWeight: 700,
            }}>{p.segment}</span>
          </div>
          <div style={{ fontFamily: 'Inter', fontSize: 11.5, color: MF_DIM, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {p.firm} · {p.city} · {p.prodCat}
          </div>
        </div>
        <span style={{
          flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 9px', borderRadius: 6,
          background: meta.color.replace('rgb', 'rgba').replace(')', ',0.13)'),
          border: `1px solid ${meta.color.replace('rgb', 'rgba').replace(')', ',0.35)')}`,
          color: meta.color, fontFamily: 'Inter', fontSize: 10.5, fontWeight: 600, whiteSpace: 'nowrap',
        }}><i className={`fa-solid fa-${meta.icon}`} style={{ fontSize: 9 }} />{s.label}</span>
      </div>

      <div style={{ fontFamily: 'Inter', fontSize: 12.5, lineHeight: 1.55, color: MF_INK_2 }}
        dangerouslySetInnerHTML={{ __html: sig.desc || '' }} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', border: `1px solid ${MF_LINE}`, borderRadius: 10, overflow: 'hidden', background: 'rgba(5,122,85,0.05)' }}>
        {[
          ['Signal opp.', `${lvFmtM(s.oppMin)}–${lvFmtM(s.oppMax)}`, MF_GREEN],
          ['Confidence', String(s.confidence), MF_VIO],
          ['R12 actual', lvFmtK(p.r12ProdK), MF_INK],
          ['Act R12', String(act), MF_INK],
        ].map(([k, v, col], i) => (
          <div key={k} style={{ padding: '10px 12px', borderLeft: i ? `1px solid ${MF_LINE}` : 'none' }}>
            <div style={{ fontFamily: 'Inter', fontSize: 9, color: MF_DIM, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>{k}</div>
            <div style={{ fontFamily: 'Inter Display, Inter', fontSize: 16, fontWeight: 500, color: col, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{v}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ display: 'flex', gap: 6, flex: 1, flexWrap: 'wrap', minWidth: 0 }}>
          <MfChip>{sig.when || 'This week'}</MfChip>
          <MfChip>{s.signal}</MfChip>
          <MfChip>{p.signals.length} signals</MfChip>
        </div>
        <button onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
          onClick={() => onNav && onNav('l3intel')} style={{
            height: 30, padding: '0 14px', borderRadius: 8, cursor: 'pointer', whiteSpace: 'nowrap',
            fontFamily: 'Inter', fontSize: 12, fontWeight: 500,
            background: hover ? 'rgba(5,122,85,0.18)' : 'rgba(255,255,255,0.04)',
            border: hover ? '1px solid rgba(5,122,85,0.45)' : `1px solid ${MF_LINE}`,
            color: hover ? MF_GREEN : MF_INK_2,
            display: 'inline-flex', alignItems: 'center', gap: 8,
            transition: 'background .14s ease, border-color .14s ease, color .14s ease',
          }}>
          Open in Signals
          <i className="fa-solid fa-chevron-right" style={{ fontSize: 9 }} />
        </button>
      </div>
    </article>
  );
}

function AMHomeFeed({ onAsk, onNav, width = 620 }) {
  const [seg, setSeg] = React.useState('all');
  const [limit, setLimit] = React.useState(5);

  const ranked = React.useMemo(() => LV_ROWS
    .filter(p => p.nba && p.nba.label)
    .slice()
    .sort((a, b) => (b.nba.confidence - a.nba.confidence) || (b.nba.oppMax - a.nba.oppMax)),
  []);
  const rows = seg === 'all' ? ranked : ranked.filter(p => p.segment === seg);
  const shown = rows.slice(0, limit);
  const totalOpp = rows.reduce((a, p) => a + p.nba.oppMax, 0);

  return (
    <section style={{ width: '100%', maxWidth: width, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', padding: '0 2px 2px' }}>
        <div style={{ fontFamily: 'Inter', fontSize: 10, fontWeight: 600, color: 'rgb(200,205,213)', letterSpacing: 0.8, textTransform: 'uppercase' }}>Top next best actions</div>
        <div style={{ flex: 1 }} />
        {[['all', 'All'], ['A', 'Segment A'], ['B', 'Segment B'], ['C', 'Segment C']].map(([id, label]) => (
          <MfFilter key={id} label={label} active={seg === id} onClick={() => { setSeg(id); setLimit(5); }} />
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, padding: '0 2px', fontFamily: 'Inter', fontSize: 11.5, color: MF_MUTED }}>
        {rows.length} FA/Teams · <span style={{ color: MF_GREEN, fontWeight: 600 }}>{lvFmtM(totalOpp)}</span> in next-best-action opportunity, ranked by model confidence
      </div>
      {shown.map((p, i) => <MfNbaCard key={p.id} p={p} rank={i + 1} onNav={onNav} />)}
      {rows.length > shown.length && (
        <button onClick={() => setLimit(n => n + 5)} style={{
          alignSelf: 'center', height: 32, padding: '0 18px', borderRadius: 9999,
          background: 'transparent', border: `1px solid ${MF_LINE}`, color: MF_INK_2,
          fontFamily: 'Inter', fontSize: 11.5, cursor: 'pointer',
        }}>{`Show ${Math.min(5, rows.length - shown.length)} more`}</button>
      )}
    </section>
  );
}

Object.assign(window, { AMHomeFeed, MfNbaCard, MF_ITEMS });
