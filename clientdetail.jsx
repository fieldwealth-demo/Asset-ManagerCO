/* Client Detail Page (Doe-style) */

/* ---------- helpers ---------- */
function parseDollar(s) {
  if (!s) return 0;
  const num = parseFloat(String(s).replace(/[^0-9.+-]/g, ''));
  if (isNaN(num)) return 0;
  if (/B/i.test(s)) return num * 1000; // → millions
  if (/M/i.test(s)) return num;
  if (/K/i.test(s)) return num / 1000;
  return num;
}
function fmtM(v) {
  // v in millions; format with B if >= 1000
  const sign = v < 0 ? '-' : '';
  const a = Math.abs(v);
  if (a >= 1000) return `${sign}$${(a/1000).toFixed(2)}B`;
  if (a >= 100) return `${sign}$${a.toFixed(0)}M`;
  if (a >= 10) return `${sign}$${a.toFixed(1)}M`;
  return `${sign}$${a.toFixed(1)}M`;
}
function fmtSign(v) {
  // signed in millions
  const s = fmtM(Math.abs(v));
  return (v >= 0 ? '+' : '-') + s.replace(/^[-+]/, '');
}

/* ---------- per-client metadata ---------- */
const CLIENT_DETAILS = {
  'The Doe Wealth Group': {
    fullName: 'The Doe Wealth Management Group',
    firm: 'Contoso Wealth',
    branch: 'Doe Wealth — Wayne, PA Branch',
    activeSince: 2009,
    address: { line1: '450 Park Avenue, 12th Floor', line2: 'New York, NY 10022', label: 'Headquarters', kind: 'Primary' },
    badges: ['High Net Worth Focus','Retirement Planning','Estate Planning','Tax Planning','CFP®','CFA'],
    members: [
      { name:'John Doe',     role:'Sr. Financial Advisor', crd:'2547191', phone:'717-787-2065', avatar:'rgb(96,165,250)', init:'LP' },
      { name:'Mary Doe', role:'Financial Advisor',     crd:'2547192', phone:'717-787-2065', avatar:'rgb(167,139,250)', init:'SM' },
      { name:'John Smith',     role:'Associate Advisor',     crd:'2547193', phone:'717-787-2065', avatar:'rgb(251,146,60)', init:'DL' },
      { name:'Tina Chandra',  role:'Client Associate',                     phone:'717-787-2065', avatar:'rgb(52,211,153)', init:'TC' },
      { name:'Richard Hayes', role:'Operations Mgr',                       phone:'717-787-2065', avatar:'rgb(248,113,113)', init:'RH' },
      { name:'Nira Kowalski', role:'Paraplanner',                          phone:'717-787-2065', avatar:'rgb(250,204,21)', init:'NK' },
    ],
    others: [
      { name:'Patricia Malone', role:'Branch Manager · CFP®',  init:'PM', col:'rgb(96,165,250)',  yourAum:'$580M', yourShare:'$312M', mktShare:'53.6%' },
      { name:'Brian Welsh',     role:'Sr. Financial Advisor',  init:'BW', col:'rgb(20,184,166)',  yourAum:'$440M', yourShare:'$187M', mktShare:'42.4%' },
      { name:'Elena García',    role:'Financial Advisor · CFA',init:'EG', col:'rgb(52,211,153)',  yourAum:'$320M', yourShare:'$143M', mktShare:'44.7%' },
      { name:'Thomas Nguyen',   role:'Financial Advisor',      init:'TN', col:'rgb(167,139,250)', yourAum:'$240M', yourShare:'$98M',  mktShare:'40.8%' },
      { name:'Amy Stockton',    role:'Associate Advisor',      init:'AS', col:'rgb(251,146,60)',  yourAum:'$145M', yourShare:'$52M',  mktShare:'35.9%' },
    ],
  },
};

/* ---------- name → initials helper ---------- */
function nameInit(name) {
  return name.split(' ').filter(Boolean).map(s => s[0]).join('').slice(0,2).toUpperCase();
}

/* ---------- build synthetic detail from a CLIENT_ROW ---------- */
function buildClientDetail(row) {
  const known = CLIENT_DETAILS[row.name];
  // Numbers from the team's opportunity row — everything ties back to the main page:
  //   opp / yours / share for each metric maps directly into the detail page.
  // The headline of each KPI card shows the total opportunity (e.g. Doe Wealth = $142.5M AUM);
  // the breakdown below shows Mkt Opp / Yours / Mkt Share matching the team table.
  const mktOppAum = parseDollar(row.opp);    // 142.5M for Doe Wealth
  const yoursAum  = parseDollar(row.yours);  // 28.4M for Doe Wealth
  const shareAum  = row.share || (mktOppAum ? `${(yoursAum/mktOppAum*100).toFixed(1)}%` : '—');

  const mktOppIn = parseDollar(row.iOpp);    // 18.2M for Doe Wealth
  const yoursIn  = parseDollar(row.iYours);  // 4.8M for Doe Wealth
  const shareIn  = row.iShare || (mktOppIn ? `${(yoursIn/mktOppIn*100).toFixed(1)}%` : '—');

  const mktOppNf = parseDollar(row.nOpp);    // 8.4M for Doe Wealth
  const yoursNf  = parseDollar(row.nYours);  // 2.1M for Doe Wealth
  const shareNf  = row.nShare || (mktOppNf ? `${(yoursNf/mktOppNf*100).toFixed(1)}%` : '—');

  const fullName = known?.fullName || row.name;
  const firm = known?.firm || row.firm || 'Contoso Wealth';
  const branch = known?.branch || `${row.name} — Branch`;
  const activeSince = known?.activeSince || (2003 + (row.name.length % 18));
  const address = known?.address || {
    line1: '500 Madison Avenue, 8th Floor',
    line2: 'New York, NY 10022',
    label:'Headquarters', kind:'Primary',
  };
  const badges = known?.badges || ['High Net Worth Focus','Retirement Planning','Estate Planning','CFP®'];

  // Synthetic team
  const seedNames = [
    ['Mark Reynolds','Sr. Financial Advisor','rgb(96,165,250)'],
    ['Lauren Hayes','Financial Advisor','rgb(167,139,250)'],
    ['Daniel Park','Associate Advisor','rgb(251,146,60)'],
    ['Sophia Reyes','Client Associate','rgb(52,211,153)'],
    ['James O\'Neil','Operations Mgr','rgb(248,113,113)'],
    ['Priya Shah','Paraplanner','rgb(250,204,21)'],
  ];
  const members = (known?.members || seedNames.map(([n,r,c],i) => {
    const hasCrd = i < 3;
    return {
      name:n, role:r, crd: hasCrd ? `${2400000 + (row.name.length*1000) + i*7}` : null,
      phone:`${500 + (row.name.charCodeAt(0)%500)}-${100 + i*23}-${2000 + i*7}`,
      avatar:c, init: nameInit(n),
    };
  })).map((m, i) => ({ ...m, dm: i === 0 }));

  const seedOthers = [
    ['Patricia Malone','Branch Manager · CFP®','rgb(96,165,250)'],
    ['Brian Welsh','Sr. Financial Advisor','rgb(20,184,166)'],
    ['Elena García','Financial Advisor · CFA','rgb(52,211,153)'],
    ['Thomas Nguyen','Financial Advisor','rgb(167,139,250)'],
    ['Amy Stockton','Associate Advisor','rgb(251,146,60)'],
  ];
  const others = known?.others || seedOthers.map(([n,r,c],i) => {
    // Scale advisor AUMs from row.yours
    const base = parseDollar(row.yours);
    const yourAumV = base * (4.2 - i*0.6);
    const yourShareV = yourAumV * (0.42 - i*0.02);
    return {
      name:n, role:r, init:nameInit(n), col:c,
      yourAum: fmtM(yourAumV),
      yourShare: fmtM(yourShareV),
      mktShare: `${(50 - i*2.5).toFixed(1)}%`,
    };
  });

  const fieldPack = ['the smith group', 'doe & roe advisors'].indexOf(String(fullName).trim().toLowerCase().replace(/\s*&\s*/, ' & ')) !== -1;
  return {
    fullName, firm, branch, activeSince, address, badges, fieldPack,
    members, others,
    kpi: {
      aum:     { headline: fmtM(mktOppAum),       priorDelta: '↑ 5.6% YoY', mktOpp: fmtM(mktOppAum), yours: fmtM(yoursAum),       share: shareAum },
      inflow:  { headline: fmtM(mktOppIn),        priorDelta: '↑ 8.3% YoY',            mktOpp: fmtM(mktOppIn),  yours: fmtM(yoursIn),        share: shareIn  },
      netflow: { headline: '+' + fmtM(mktOppNf),  priorDelta: '↑ 18.4% YoY',      mktOpp: fmtM(mktOppNf),  yours: '+' + fmtM(yoursNf),  share: shareNf  },
    },
    raw: { yoursAum, yoursIn, yoursNf, mktOppAum, mktOppIn, mktOppNf },
  };
}

/* ===================================================== */
/*  Page Root                                             */
/* ===================================================== */
function ClientDetailPage({ clientRow, onBack }) {
  if (!clientRow) return null;
  const d = buildClientDetail(clientRow);

  return (
    <div onClick={onBack} style={{
      position:'fixed', inset:0, background:'rgba(5,10,18,0.78)', backdropFilter:'blur(8px)',
      display:'flex', alignItems:'flex-start', justifyContent:'center', zIndex:200,
      padding:'32px 24px', overflow:'auto',
      animation:'cdFade .18s ease-out',
      fontFamily:'Inter',
    }}>
      <style>{`
        @keyframes cdFade  { from{opacity:0} to{opacity:1} }
        @keyframes cdScale { from{opacity:0; transform:translateY(10px) scale(.985)} to{opacity:1; transform:none} }
      `}</style>
      <div onClick={(e) => e.stopPropagation()} style={{
        width:'min(1400px, 96vw)',
        background:'rgb(11,17,28)',
        border:'1px solid rgba(75,85,99,0.5)',
        borderRadius:14,
        boxShadow:'0 40px 120px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.02) inset',
        animation:'cdScale .22s cubic-bezier(.2,.8,.2,1)',
        padding:20,
        display:'flex', flexDirection:'column', gap:16,
        position:'relative',
      }}>
        <button onClick={onBack} title="Close" style={{
          position:'absolute', top:16, right:18, zIndex:5,
          width:32, height:32, borderRadius:6,
          border:'1px solid rgba(75,85,99,0.5)', background:'rgba(15,23,36,0.9)',
          color:'rgb(209,213,219)', cursor:'pointer',
          display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:14,
        }}><i className="fa-solid fa-xmark" /></button>
        <DetailHeader d={d} />
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16 }}>
        <div style={{ gridColumn:'span 2', minWidth:0, display:'flex' }}><TeamMembersCard d={d} /></div>
        <OtherAdvisorsCard d={d} />
      </div>
      {clientRow.lvRow && <ActualSalesCard row={clientRow.lvRow} />}
      <KpiRowCards d={d} />
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16 }}>
        <VehicleAllocationCard d={d} />
        <PlatformBreakdownCard d={d} />
        <CategoryAllocationCard d={d} />
      </div>
      {d.fieldPack && <ClientAnalyticsCards d={d} />}
      <CompetitiveAdvantageCard d={d} />
      <MoneyInMotionCard d={d} />
      </div>
    </div>
  );
}

/* ----- Back bar ----- */
function DetailBackBar({ onBack }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
      <button onClick={onBack} style={{
        display:'inline-flex', alignItems:'center', gap:8,
        padding:'7px 12px', background:'rgba(255,255,255,0.04)',
        border:'1px solid rgba(75,85,99,0.5)', borderRadius:8,
        color:'rgb(209,213,219)', fontFamily:'Inter', fontSize:12, fontWeight:500, cursor:'pointer',
      }}>
        <i className="fa-solid fa-arrow-left" style={{ fontSize:11 }} />
        Back to Opportunities
      </button>
    </div>
  );
}

/* ===================================================== */
/* HEADER CARD                                            */
/* ===================================================== */
function DetailHeader({ d }) {
  return (
    <div style={cardStyle}>
      <div style={{ display:'flex', alignItems:'flex-start', gap:14, padding:'18px 20px' }}>
        {/* Firm logo block */}
        <div style={{
          width:48, height:48, borderRadius:6, background:'rgb(13,71,161)',
          display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
          padding:6, color:'#fff', fontFamily:'Inter', fontSize:8, fontWeight:700, lineHeight:1.05, textAlign:'center',
        }}>{d.firm}</div>

        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'baseline', gap:14, flexWrap:'wrap' }}>
            <div style={{ fontFamily:'Geist, Inter', fontWeight:700, fontSize:22, color:'rgb(249,250,251)', letterSpacing:-0.3 }}>{d.fullName}</div>
          </div>
          <div style={{ fontFamily:'Inter', fontSize:12, color:'rgb(163,163,163)', marginTop:2 }}>{d.firm}</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:10 }}>
            {d.badges.map((b,i) => (
              <span key={i} style={{
                padding:'4px 10px', borderRadius:999,
                background: i >= 4 ? 'rgba(96,165,250,0.14)' : 'rgba(255,255,255,0.05)',
                border:'1px solid ' + (i >= 4 ? 'rgba(96,165,250,0.35)' : 'rgba(75,85,99,0.5)'),
                color: i >= 4 ? 'rgb(147,197,253)' : 'rgb(209,213,219)',
                fontFamily:'Inter', fontSize:11, fontWeight:500,
              }}>{b}</span>
            ))}
          </div>
        </div>

        {/* Address card + active-since */}
        <div style={{ display:'flex', flexDirection:'column', gap:6, minWidth:280 }}>
          <div style={{
            padding:'10px 14px',
            background:'rgba(255,255,255,0.03)',
            border:'1px solid rgba(75,85,99,0.4)', borderRadius:8,
            display:'flex', alignItems:'flex-start', gap:10,
          }}>
            <i className="fa-solid fa-building" style={{ color:'rgb(96,165,250)', fontSize:14, marginTop:3 }} />
            <div style={{ flex:1 }}>
              <div style={{ fontFamily:'Inter', fontSize:11.5, fontWeight:600, color:'rgb(229,231,235)' }}>{d.address.label}</div>
              <div style={{ fontFamily:'Inter', fontSize:10.5, color:'rgb(107,114,128)', textTransform:'uppercase', letterSpacing:0.6 }}>{d.address.kind}</div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontFamily:'Inter', fontSize:11, color:'rgb(209,213,219)' }}>{d.address.line1}</div>
              <div style={{ fontFamily:'Inter', fontSize:11, color:'rgb(209,213,219)' }}>{d.address.line2}</div>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', gap:8, paddingRight:2, fontFamily:'Inter', fontSize:10.5, color:'rgb(107,114,128)' }}>
            {d.fieldPack && (
              <span style={{ display:'inline-flex', alignItems:'center', gap:5, color:'rgb(163,163,163)' }}>
                <img src="assets/field-glyph.svg" alt="Field" style={{ width:9, height:9, display:'block' }} />Field Data Pack
                <span style={{ width:3, height:3, borderRadius:'50%', background:'rgb(75,85,99)' }}></span>
              </span>
            )}
            <span>Active since {d.activeSince}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===================================================== */
/* TEAM MEMBERS CARD                                      */
/* ===================================================== */
function TeamMembersCard({ d }) {
  const [page, setPage] = React.useState(1);
  return (
    <div style={Object.assign({}, cardStyle, { flex:1, minWidth:0 })}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 18px 6px' }}>
        <div style={{ fontFamily:'Inter', fontSize:13, fontWeight:600, color:'rgb(249,250,251)' }}>Team Members</div>
        <div style={{ fontFamily:'Inter', fontSize:11, color:'rgb(163,163,163)' }}>{d.branch}</div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, padding:'8px 16px 12px' }}>
        {d.members.map((m,i) => <TeamMemberCard key={i} m={m} />)}
      </div>
      <div style={{ display:'flex', justifyContent:'flex-end', alignItems:'center', gap:6, padding:'4px 16px 14px' }}>
        {[1,2,3,4].map(p => (
          <button key={p} onClick={() => setPage(p)} style={{
            width:22, height:22, borderRadius:4,
            background: page===p ? 'rgba(96,165,250,0.2)' : 'transparent',
            border: page===p ? '1px solid rgba(96,165,250,0.5)' : '1px solid rgba(75,85,99,0.4)',
            color: page===p ? 'rgb(147,197,253)' : 'rgb(163,163,163)',
            fontFamily:'Inter', fontSize:10, fontWeight:500, cursor:'pointer',
          }}>{p}</button>
        ))}
      </div>
    </div>
  );
}

/* The investment decision maker is the one name that matters most on this
   card, so it is lifted out of the grid and flagged. */
function TeamMemberCard({ m }) {
  const dm = !!m.dm;
  return (
    <div style={{
      padding:'12px 12px 10px',
      background: dm ? 'rgba(16,185,129,0.07)' : 'rgba(255,255,255,0.025)',
      border:`1px solid ${dm ? 'rgba(16,185,129,0.5)' : 'rgba(75,85,99,0.4)'}`, borderRadius:8,
      display:'flex', flexDirection:'column', gap:8,
    }}>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <div style={{
          width:32, height:32, borderRadius:'50%',
          background: m.avatar, color:'#0b1220',
          fontFamily:'Inter', fontSize:11, fontWeight:700,
          display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
          boxShadow: dm ? '0 0 0 2px rgba(16,185,129,0.55)' : 'none',
        }}>{m.init}</div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, minWidth:0 }}>
            <span style={{ fontFamily:'Inter', fontSize:12.5, fontWeight:600, color:'rgb(249,250,251)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{m.name}</span>
            {dm && (
              <span title="Investment decision maker" style={{
                flexShrink:0, padding:'1px 6px', borderRadius:4,
                background:'rgba(16,185,129,0.18)', border:'1px solid rgba(16,185,129,0.5)',
                color:'rgb(52,211,153)', fontFamily:'Inter', fontSize:8.5, fontWeight:700, letterSpacing:0.4,
              }}>CIO</span>
            )}
          </div>
          <div style={{ fontFamily:'Inter', fontSize:11, color: dm ? 'rgb(52,211,153)' : 'rgb(163,163,163)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
            {dm ? 'Investment decision maker' : m.role}
          </div>
        </div>
        {m.crd && (
          <div style={{ fontFamily:'Inter', fontSize:10, color:'rgb(107,114,128)' }}>CRD # {m.crd}</div>
        )}
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:14, color:'rgb(163,163,163)', fontFamily:'Inter', fontSize:10.5 }}>
        <span style={{ display:'inline-flex', alignItems:'center', gap:5 }}><i className="fa-regular fa-envelope" style={{ fontSize:9 }} />Email</span>
        <span style={{ display:'inline-flex', alignItems:'center', gap:5 }}><i className="fa-solid fa-phone" style={{ fontSize:9 }} />{m.phone}</span>
        <span style={{ flex:1 }} />
        <i className="fa-solid fa-calendar" style={{ fontSize:11 }} />
      </div>
    </div>
  );
}

/* ===================================================== */
/* OTHER ADVISORS                                         */
/* ===================================================== */
function OtherAdvisorsCard({ d }) {
  return (
    <div style={cardStyle}>
      <div style={{ padding:'14px 18px 8px', fontFamily:'Inter', fontSize:13, fontWeight:600, color:'rgb(249,250,251)' }}>Other Advisors in the branch</div>
      <table style={{ width:'100%', borderCollapse:'collapse', fontFamily:'Inter', fontSize:11.5 }}>
        <thead>
          <tr>
            <th style={{ padding:'4px 16px 6px', textAlign:'left' }}></th>
            <th style={otherTh}>Total AUM</th>
            <th style={otherTh}>Your AUM</th>
            <th style={{...otherTh, paddingRight:18 }}>Mkt Share</th>
          </tr>
        </thead>
        <tbody>
          {d.others.map((o,i) => (
            <tr key={i} style={{ borderTop:'1px solid rgba(75,85,99,0.18)' }}>
              <td style={{ padding:'10px 16px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                  <div style={{
                    width:26, height:26, borderRadius:'50%', background:o.col, color:'#0b1220',
                    fontFamily:'Inter', fontSize:9.5, fontWeight:700,
                    display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
                  }}>{o.init}</div>
                  <div style={{ minWidth:0 }}>
                    <div style={{ color:'rgb(229,231,235)', fontWeight:500, fontSize:11.5 }}>{o.name}</div>
                    <div style={{ color:'rgb(107,114,128)', fontSize:10 }}>{o.role}</div>
                  </div>
                </div>
              </td>
              <td style={otherTd}>{o.yourAum}</td>
              <td style={{...otherTd, color:'rgb(249,250,251)', fontWeight:600 }}>{o.yourShare}</td>
              <td style={{...otherTd, paddingRight:18, color:'rgb(52,211,153)', fontWeight:600 }}>{o.mktShare}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const otherTh = { padding:'6px 8px 8px', textAlign:'right', fontFamily:'Inter', fontSize:9.5, fontWeight:600, color:'rgb(107,114,128)', textTransform:'uppercase', letterSpacing:0.6 };
const otherTd = { padding:'10px 8px', textAlign:'right', color:'rgb(163,163,163)', fontVariantNumeric:'tabular-nums', fontSize:11.5 };

/* ===================================================== */
/* KPI ROW                                                */
/* ===================================================== */
function KpiRowCards({ d }) {
  const C_AUM = 'rgb(52,211,153)', C_IN = 'rgb(96,165,250)', C_NF = 'rgb(249,115,22)';
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16 }}>
      <KpiBigCard label="AUM" labelColor={C_AUM} headline={d.kpi.aum.headline}
        priorDelta={d.kpi.aum.priorDelta} priorPositive
        opp={d.kpi.aum.mktOpp} yours={d.kpi.aum.yours} share={d.kpi.aum.share} shareColor={C_AUM} />
      <KpiBigCard label="INFLOWS (YTD)" labelColor={C_IN} headline={d.kpi.inflow.headline}
        priorDelta={d.kpi.inflow.priorDelta} priorPositive
        opp={d.kpi.inflow.mktOpp} yours={d.kpi.inflow.yours} share={d.kpi.inflow.share} shareColor={C_IN} />
      <KpiBigCard label="NET FLOWS (YTD)" labelColor={C_NF} headline={d.kpi.netflow.headline}
        priorDelta={d.kpi.netflow.priorDelta} priorPositive
        opp={d.kpi.netflow.mktOpp} yours={d.kpi.netflow.yours} share={d.kpi.netflow.share} shareColor={C_NF} />
    </div>
  );
}

function KpiBigCard({ label, labelColor, headline, priorDelta, priorPositive, opp, yours, share, shareColor }) {
  return (
    <div style={{ ...cardStyle, padding:'14px 18px 16px' }}>
      <div style={{ fontFamily:'Inter', fontSize:11, fontWeight:700, color:labelColor, textTransform:'uppercase', letterSpacing:1.2 }}>{label}</div>
      <div style={{ display:'flex', alignItems:'baseline', gap:12, marginTop:6 }}>
        <div style={{ fontFamily:'Inter Display, Inter', fontSize:30, fontWeight:700, color:'rgb(249,250,251)', letterSpacing:-1, fontVariantNumeric:'tabular-nums' }}>{headline}</div>
        <div style={{ fontFamily:'Inter', fontSize:11, color: priorPositive ? 'rgb(52,211,153)' : 'rgb(248,113,113)' }}>{priorDelta}</div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14, marginTop:14, borderTop:'1px solid rgba(75,85,99,0.3)', paddingTop:12 }}>
        <KpiSubStat label="MKT OPP"    value={opp} />
        <KpiSubStat label="YOURS"      value={yours} bold />
        <KpiSubStat label="MKT SHARE"  value={share} color={shareColor} bold />
      </div>
    </div>
  );
}

function KpiSubStat({ label, value, color, bold }) {
  return (
    <div>
      <div style={{ fontFamily:'Inter', fontSize:9.5, fontWeight:600, color:'rgb(107,114,128)', textTransform:'uppercase', letterSpacing:0.8 }}>{label}</div>
      <div style={{
        marginTop:4,
        fontFamily:'Inter', fontSize:18, fontWeight: bold ? 700 : 500,
        color: color || 'rgb(229,231,235)',
        fontVariantNumeric:'tabular-nums', letterSpacing:-0.3,
      }}>{value}</div>
    </div>
  );
}

/* ===================================================== */
/* VEHICLE ALLOCATION                                     */
/* ===================================================== */
function VehicleAllocationCard({ d }) {
  const [tab, setTab] = React.useState('AUM');
  const totalM = d.raw.mktOppAum;  // headline of donut
  // Distribution sums to 1.0 — totals tie exactly to mktOppAum
  const rows = [
    { name:'Mutual Funds',  ...ALLOC.equities,    pct:0.42, mkt:fmtM(totalM*0.42), yrs:fmtM(d.raw.yoursAum*0.42), shr:'19.9%' },
    { name:'ETFs',          ...ALLOC.fixedIncome, pct:0.24, mkt:fmtM(totalM*0.24), yrs:fmtM(d.raw.yoursAum*0.24), shr:'19.9%' },
    { name:'Privates',      ...ALLOC.alternatives,pct:0.18, mkt:fmtM(totalM*0.18), yrs:fmtM(d.raw.yoursAum*0.18), shr:'19.9%' },
    { name:'UMA',           ...ALLOC.private,     pct:0.16, mkt:fmtM(totalM*0.16), yrs:fmtM(d.raw.yoursAum*0.16), shr:'19.9%' },
  ];
  return (
    <div style={cardStyle}>
      <DonutCardHeader title="Vehicle Allocation" tab={tab} setTab={setTab} />
      <div style={{ display:'flex', flexDirection:'column', alignItems:'stretch', gap:10, padding:'4px 16px 16px' }}>
        <div style={{ display:'flex', justifyContent:'center' }}>
          <Donut size={170} total={fmtM(totalM)} segments={rows.map(r => ({ pct:r.pct, fill:r.fill, dot:r.dot }))} />
        </div>
        <DonutTable compact headers={['ASSET CLASS','MKT OPP','YOURS','MKT SHARE']} rows={rows.map(r => [
          { type:'label', text:r.name, c:r.dot },
          { type:'val', text:r.mkt },
          { type:'val', text:r.yrs, strong:true },
          { type:'val', text:r.shr, color:'rgb(52,211,153)', strong:true },
        ])} />
      </div>
    </div>
  );
}

/* ===================================================== */
/* PLATFORM BREAKDOWN                                     */
/* ===================================================== */
function PlatformBreakdownCard({ d }) {
  const [tab, setTab] = React.useState('AUM');
  const totalM = d.raw.mktOppAum; // ties to mktOpp ($142.5M for Doe Wealth)
  const rows = [
    { name:'UMA FA Discretionary',   ...ALLOC.equities,     pct:0.36, mkt:fmtM(totalM*0.36), yrs:fmtM(d.raw.yoursAum*0.36), shr:'55.4%', tag:null },
    { name:'Portfolio Management',   ...ALLOC.fixedIncome,  pct:0.24, mkt:fmtM(totalM*0.24), yrs:fmtM(d.raw.yoursAum*0.24), shr:'34.3%', tag:null },
    { name:'UMA Non Discretionary',  ...ALLOC.alternatives, pct:0.18, mkt:fmtM(totalM*0.18), yrs:fmtM(d.raw.yoursAum*0.18), shr:'36.9%', tag:null },
    { name:'UMA Firm Discretionary', ...ALLOC.cash,         pct:0.12, mkt:fmtM(totalM*0.12), yrs:fmtM(d.raw.yoursAum*0.12), shr:'39.2%', tag:'New Mod' },
    { name:'Consulting & Evaluation',...ALLOC.private,      pct:0.05, mkt:fmtM(totalM*0.05), yrs:fmtM(d.raw.yoursAum*0.05), shr:'36.1%', tag:null },
    { name:'Consulting Group Advisor',...ALLOC.realEstate,  pct:0.04, mkt:fmtM(totalM*0.04), yrs:fmtM(d.raw.yoursAum*0.04), shr:'33.3%', tag:null },
    { name:'Standard Brokerage',     ...ALLOC.hedge,        pct:0.01, mkt:fmtM(totalM*0.01), yrs:fmtM(d.raw.yoursAum*0.01), shr:'45.8%', tag:null },
  ];
  return (
    <div style={cardStyle}>
      <DonutCardHeader title="Platform Breakdown" tab={tab} setTab={setTab} />
      <div style={{ display:'flex', flexDirection:'column', alignItems:'stretch', gap:10, padding:'4px 16px 16px' }}>
        <div style={{ display:'flex', justifyContent:'center' }}>
          <Donut size={170} total={fmtM(totalM)} segments={rows.map(r => ({ pct:r.pct, fill:r.fill, dot:r.dot }))} />
        </div>
        <DonutTable compact headers={['PLATFORM','MKT OPP','YOURS','MKT SHARE']} rows={rows.map(r => [
          { type:'label', text:r.name, c:r.dot, tag:r.tag },
          { type:'val', text:r.mkt },
          { type:'val', text:r.yrs, strong:true },
          { type:'val', text:r.shr, color:'rgb(52,211,153)', strong:true },
        ])} />
      </div>
    </div>
  );
}

/* ===================================================== */
/* CATEGORY ALLOCATION                                    */
/* ===================================================== */
function CategoryAllocationCard({ d }) {
  const [tab, setTab] = React.useState('AUM');
  const totalM = d.raw.mktOppAum;
  // Morningstar-style category mix — distribution sums to 1.0; ties to mktOppAum.
  // Mkt share is per-category (your AUM in cat / mkt opp in cat).
  const rows = [
    { name:'Large Growth',           ...ALLOC.fixedIncome,  pct:0.22, shr:'21.4%' },
    { name:'Large Blend',            ...ALLOC.equities,     pct:0.16, shr:'18.7%' },
    { name:'Intermediate Core-Plus', ...ALLOC.alternatives, pct:0.14, shr:'24.2%' },
    { name:'Multisector Bond',       ...ALLOC.cash,         pct:0.12, shr:'17.0%' },
    { name:'Large Value',            ...ALLOC.private,      pct:0.10, shr:'15.5%' },
    { name:'Foreign Large Blend',    ...ALLOC.other,        pct:0.09, shr:'19.9%' },
    { name:'Moderate Allocation',    ...ALLOC.realEstate,   pct:0.07, shr:'22.6%' },
    { name:'Mid-Cap Growth',         ...ALLOC.hedge,        pct:0.06, shr:'14.8%' },
    { name:'Other',                  fill:'rgba(107,114,128,0.55)', dot:'rgb(156,163,175)', pct:0.04, shr:'—' },
  ].map(r => ({ ...r, mkt:fmtM(totalM*r.pct), yrs:fmtM(d.raw.yoursAum*r.pct) }));
  return (
    <div style={cardStyle}>
      <DonutCardHeader title="Category Allocation" tab={tab} setTab={setTab} />
      <div style={{ display:'flex', flexDirection:'column', alignItems:'stretch', gap:10, padding:'4px 16px 16px' }}>
        <div style={{ display:'flex', justifyContent:'center' }}>
          <Donut size={170} total={fmtM(totalM)} segments={rows.map(r => ({ pct:r.pct, fill:r.fill, dot:r.dot }))} />
        </div>
        <DonutTable compact headers={['CATEGORY','MKT OPP','YOURS','MKT SHARE']} rows={rows.map(r => [
          { type:'label', text:r.name, c:r.dot },
          { type:'val', text:r.mkt },
          { type:'val', text:r.yrs, strong:true },
          { type:'val', text:r.shr, color: r.shr === '—' ? 'rgb(107,114,128)' : 'rgb(52,211,153)', strong:true },
        ])} />
      </div>
    </div>
  );
}

/* ----- shared donut card pieces ----- */
function DonutCardHeader({ title, tab, setTab }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 18px 4px' }}>
      <div style={{ fontFamily:'Inter', fontSize:13, fontWeight:600, color:'rgb(249,250,251)' }}>{title}</div>
      <div style={{ display:'flex', background:'rgba(0,0,0,0.3)', borderRadius:6, padding:2, border:'1px solid rgba(75,85,99,0.3)' }}>
        {['AUM','Inflows','Net Flows'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding:'4px 10px', borderRadius:4, border:'none',
            background: tab === t ? 'rgba(16,185,129,0.25)' : 'transparent',
            color: tab === t ? 'rgb(52,211,153)' : 'rgb(163,163,163)',
            fontFamily:'Inter', fontSize:10.5, fontWeight: tab===t?600:500, cursor:'pointer',
          }}>{t}</button>
        ))}
      </div>
    </div>
  );
}

function Donut({ total, segments, size = 200 }) {
  // Highcharts pie (donut). Field DS: innerSize 68%, borderRadius 0 — sharp slices.
  // Each segment is { pct: 0..1, fill, dot }. Slices render with a washed fill
  // and a crisp saturated border to match the rest of the chart system.
  const opts = React.useMemo(() => ({
    chart: { type: 'pie', height: size, width: size, backgroundColor: 'transparent',
             spacing: [0,0,0,0], margin: [0,0,0,0] },
    title: { text: '' },
    tooltip: { pointFormat: '<b>{point.percentage:.1f}%</b>' },
    plotOptions: {
      pie: {
        innerSize: '68%',
        borderRadius: 0,
        borderWidth: 1.5,
        dataLabels: { enabled: false },
        states: { hover: { brightness: 0.08, halo: { size: 4, opacity: 0.15 } } },
        center: ['50%', '50%'],
        size: '100%',
      },
    },
    series: [{
      type: 'pie',
      data: segments.map((s, i) => {
        const saturated = s.dot || s.fill;
        const washed = wash(saturated, 0.32);
        return {
          name: `Segment ${i+1}`,
          y: Math.max(s.pct, 0.0001),
          color: washed.color,
          borderColor: washed.borderColor,
        };
      }),
    }],
  }), [segments, size]);
  const fs = Math.round(size * 0.11);
  return (
    <div style={{ position:'relative', width:size, height:size, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <HC options={opts} style={{ width:size, height:size }} />
      <div style={{
        position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center',
        fontFamily:'Inter Display, Inter', fontSize:fs, fontWeight:700, color:'rgb(249,250,251)', letterSpacing:-0.5,
        pointerEvents:'none',
      }}>{total}</div>
    </div>
  );
}

function DonutTable({ headers, rows, compact }) {
  return (
    <table style={{ width:'100%', borderCollapse:'collapse', fontFamily:'Inter', fontSize: compact ? 11 : 11.5 }}>
      <thead>
        <tr>
          {headers.map((h,i) => (
            <th key={i} style={{
              padding:'2px 6px 8px', textAlign: i === 0 ? 'left' : 'right',
              fontFamily:'Inter', fontSize:9.5, fontWeight:600, color:'rgb(107,114,128)',
              textTransform:'uppercase', letterSpacing:0.6,
            }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((cells, i) => (
          <tr key={i} style={{ borderTop:'1px solid rgba(75,85,99,0.18)' }}>
            {cells.map((c, j) => {
              if (c.type === 'label') {
                return (
                  <td key={j} style={{ padding: compact ? '7px 6px' : '9px 6px', color:'rgb(229,231,235)' }}>
                    <span style={{ display:'inline-flex', alignItems:'center', gap:8 }}>
                      <span style={{ width:8, height:8, borderRadius:'50%', background:c.c, flexShrink:0 }} />
                      <span>{c.text}</span>
                      {c.tag && <span style={{
                        fontSize:9, fontWeight:600, color:'rgb(147,197,253)',
                        background:'rgba(96,165,250,0.18)', border:'1px solid rgba(96,165,250,0.3)',
                        padding:'1px 6px', borderRadius:3,
                      }}>{c.tag}</span>}
                    </span>
                  </td>
                );
              }
              return (
                <td key={j} style={{
                  padding: compact ? '7px 6px' : '9px 6px',
                  textAlign:'right', fontVariantNumeric:'tabular-nums',
                  color: c.color || 'rgb(163,163,163)',
                  fontWeight: c.strong ? 600 : 400,
                }}>{c.text}</td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* ===================================================== */
/* COMPETITIVE ADVANTAGE                                  */
/* ===================================================== */
function CompetitiveAdvantageCard({ d }) {
  const rows = [
    { vehicle:'MF',  cat:'Intermediate Core-Plus', catC:ALLOC.alternatives.dot, tot:'$17.0M', perf:'$10.1M', risk:-3.1, var:'-1.0', vsc:'$13.8V', fee:'25.0', feeVar:'0.0',  inflows:'$10.5M', outflows:'($0.8M)', net:'$0.9M', mgrs:5,  rank:18 },
    { vehicle:'MF',  cat:'Large Bond',             catC:ALLOC.cash.dot,         tot:'$5.4M',  perf:'$2.7M',  risk:1.5,  var:'+3.6', vsc:'$3.6V',  fee:'61.8', feeVar:'30.5', inflows:'$0.4M',  outflows:'($0.2M)', net:'$0.3M', mgrs:7,  rank:3 },
    { vehicle:'ETF', cat:'Moderate Allocation',    catC:ALLOC.realEstate.dot,   tot:'$4.7M',  perf:'$2.7M',  risk:1.6,  var:'+3.6', vsc:'$3.6V',  fee:'22.9', feeVar:'-3.0', inflows:'$0.3M',  outflows:'($0.6M)', net:'$0.34M',mgrs:8,  rank:2 },
    { vehicle:'MF',  cat:'Multisector Bond',       catC:ALLOC.cash.dot,         tot:'$3.8M',  perf:'$1.4M',  risk:0.3,  var:'+3.6', vsc:'$3.6V',  fee:'25.8', feeVar:'0.0',  inflows:'$14.3M', outflows:'($0.6M)', net:'$0.2M', mgrs:7,  rank:5 },
    { vehicle:'SMA', cat:'Moderate Allocation',    catC:ALLOC.realEstate.dot,   tot:'$2.1M',  perf:'$1.5M',  risk:1.2,  var:'+3.6', vsc:'$3.6V',  fee:'35.0', feeVar:'8.2',  inflows:'$1.7M',  outflows:'($0.6M)', net:'$0.05M',mgrs:11, rank:6 },
    { vehicle:'MF',  cat:'Large Value',            catC:ALLOC.fixedIncome.dot,  tot:'$1.8M',  perf:'$1.5M',  risk:2.6,  var:'1.2',  vsc:'$3.6V',  fee:'62.8', feeVar:'0.0',  inflows:'$10.5M', outflows:'($0.8M)', net:'$0.05M',mgrs:13, rank:1 },
  ];
  return (
    <div style={cardStyle}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 18px 4px' }}>
        <div style={{ fontFamily:'Inter', fontSize:13, fontWeight:600, color:'rgb(249,250,251)' }}>Competitive Advantage</div>
        <div style={{ display:'flex', gap:6 }}>
          <button style={advBtnStyle}><i className="fa-solid fa-table-columns" style={{ fontSize:10 }} /> Columns</button>
          <button style={advBtnStyle}><i className="fa-solid fa-filter" style={{ fontSize:10 }} /> Filter</button>
        </div>
      </div>
      <div style={{ overflow:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontFamily:'Inter', fontSize:11.5, minWidth:1100 }}>
          <thead>
            <tr style={{ background:'rgba(0,0,0,0.18)' }}>
              <th style={caTh}>Vehicle</th>
              <th style={caTh}>M* Category</th>
              <th style={caThR}>Total AUM</th>
              <th style={caThR}>Perf Adv AUM</th>
              <th style={caThR}>Asst Wtd Perf</th>
              <th style={caThR}>Perf Variance</th>
              <th style={caThR}>Fee Adv AUM</th>
              <th style={caThR}>Fee</th>
              <th style={caThR}>Fee Variance</th>
              <th style={caThR}>Inflows</th>
              <th style={caThR}>Total Outflows</th>
              <th style={caThR}>Net Flows</th>
              <th style={caThR}># Mgrs</th>
              <th style={caThR}>Rank</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r,i) => (
              <tr key={i} style={{ borderTop:'1px solid rgba(75,85,99,0.18)' }}>
                <td style={caTd}><VehicleBadge v={r.vehicle} /></td>
                <td style={caTd}>
                  <span style={{ display:'inline-flex', alignItems:'center', gap:7, color:'rgb(229,231,235)' }}>
                    <span style={{ width:7, height:7, borderRadius:'50%', background:r.catC }} />
                    {r.cat}
                  </span>
                </td>
                <td style={caTdR}>{r.tot}</td>
                <td style={caTdRStrong}>{r.perf}</td>
                <td style={caTdR}>
                  <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
                    <span style={{
                      width:6, height:6, borderRadius:'50%',
                      background: r.risk > 0 ? 'rgb(52,211,153)' : r.risk < 0 ? 'rgb(248,113,113)' : 'rgb(250,204,21)',
                    }} />
                    {r.risk}
                  </span>
                </td>
                <td style={caTdR}>{r.var}</td>
                <td style={caTdR}>{r.vsc}</td>
                <td style={caTdR}>{r.fee}<br/><span style={{ fontSize:9, color:'rgb(107,114,128)' }}>bp</span></td>
                <td style={caTdR}>{r.feeVar}</td>
                <td style={caTdR}>{r.inflows}</td>
                <td style={caTdR}>{r.outflows}</td>
                <td style={caTdR}>{r.net}</td>
                <td style={caTdR}>{r.mgrs}</td>
                <td style={caTdR}>
                  <span style={{
                    padding:'3px 8px', borderRadius:4, minWidth:22, display:'inline-block',
                    background: r.rank <= 3 ? 'rgba(251,146,60,0.18)' : 'transparent',
                    color: r.rank <= 3 ? 'rgb(251,146,60)' : 'rgb(163,163,163)',
                    border: r.rank <= 3 ? '1px solid rgba(251,146,60,0.4)' : 'none',
                    fontWeight: r.rank <= 3 ? 700 : 500,
                  }}>{r.rank}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function VehicleBadge({ v }) {
  const map = {
    'MF':  { bg:'rgba(96,165,250,0.18)',  fg:'rgb(147,197,253)' },
    'ETF': { bg:'rgba(250,204,21,0.18)',  fg:'rgb(252,211,77)' },
    'SMA': { bg:'rgba(251,146,60,0.18)',  fg:'rgb(251,146,60)' },
    'PRIV':{ bg:'rgba(167,139,250,0.18)', fg:'rgb(196,181,253)' },
  };
  const c = map[v] || { bg:'rgba(75,85,99,0.3)', fg:'rgb(209,213,219)' };
  return (
    <span style={{
      padding:'3px 8px', borderRadius:5, background:c.bg, color:c.fg,
      fontFamily:'Inter', fontSize:10, fontWeight:700, letterSpacing:0.4,
    }}>{v}</span>
  );
}

const advBtnStyle = {
  display:'inline-flex', alignItems:'center', gap:6,
  padding:'5px 10px', background:'rgba(255,255,255,0.04)',
  border:'1px solid rgba(75,85,99,0.5)', borderRadius:6,
  color:'rgb(209,213,219)', fontFamily:'Inter', fontSize:11, cursor:'pointer',
};
const caTh  = { padding:'10px 10px', textAlign:'left',  fontFamily:'Inter', fontSize:9.5, fontWeight:600, color:'rgb(107,114,128)', textTransform:'uppercase', letterSpacing:0.6, whiteSpace:'nowrap' };
const caThR = { ...caTh, textAlign:'right' };
const caTd  = { padding:'12px 10px', color:'rgb(229,231,235)', fontVariantNumeric:'tabular-nums', whiteSpace:'nowrap' };
const caTdR = { padding:'12px 10px', textAlign:'right', color:'rgb(163,163,163)', fontVariantNumeric:'tabular-nums', whiteSpace:'nowrap' };
const caTdRStrong = { ...caTdR, color:'rgb(249,250,251)', fontWeight:600 };

/* ===================================================== */
/* MONEY IN MOTION                                        */
/* ===================================================== */
function MoneyInMotionCard({ d }) {
  const [tab, setTab] = React.useState('AUM');
  const [expanded, setExpanded] = React.useState(new Set(['Large Growth']));
  const toggle = (k) => setExpanded(prev => {
    const s = new Set(prev);
    if (s.has(k)) s.delete(k); else s.add(k);
    return s;
  });

  const rows = [
    { name:'Large Growth',         color:ALLOC.fixedIncome.dot,  vehicle:'Mutual Fund', cur:'$92M', prior:'$79M',  delta:'+$13M', deltaPct:'+17.4%', sub:[
      { vehicle:'MF',  cur:'$53M', prior:'$45M', delta:'+$8M',  deltaPct:'+17.8%' },
      { vehicle:'ETF', cur:'$28M', prior:'$25M', delta:'+$3M',  deltaPct:'+12.0%' },
      { vehicle:'SMA', cur:'$11M', prior:'$9M',  delta:'+$2M',  deltaPct:'+22.2%' },
    ] },
    { name:'Multisector Bond',     color:ALLOC.cash.dot,         vehicle:'Mutual Fund', cur:'$67M', prior:'$59M',  delta:'+$8M',  deltaPct:'+9.2%', sub:[
      { vehicle:'MF',  cur:'$42M', prior:'$36M', delta:'+$6M',  deltaPct:'+16.7%' },
      { vehicle:'CIT', cur:'$15M', prior:'$14M', delta:'+$1M',  deltaPct:'+7.1%' },
      { vehicle:'ETF', cur:'$10M', prior:'$9M',  delta:'+$1M',  deltaPct:'+11.1%' },
    ] },
    { name:'Alternatives — Private Credit', color:ALLOC.alternatives.dot, vehicle:'Alternative', cur:'$54M', prior:'$48M', delta:'+$6M', deltaPct:'+10.7%', sub:[
      { vehicle:'Interval Fund', cur:'$31M', prior:'$26M', delta:'+$5M',  deltaPct:'+19.2%' },
      { vehicle:'BDC',           cur:'$14M', prior:'$13M', delta:'+$1M',  deltaPct:'+7.7%' },
      { vehicle:'Private Fund',  cur:'$9M',  prior:'$9M',  delta:'$0M',   deltaPct:'+0.0%' },
    ] },
    { name:'Large Blend',          color:ALLOC.fixedIncome.dot,  vehicle:'ETF',         cur:'$40M', prior:'$45M',  delta:'-$5M',  deltaPct:'-11.1%', sub:[
      { vehicle:'ETF', cur:'$22M', prior:'$26M', delta:'-$4M',  deltaPct:'-15.4%' },
      { vehicle:'MF',  cur:'$13M', prior:'$14M', delta:'-$1M',  deltaPct:'-7.1%' },
      { vehicle:'SMA', cur:'$5M',  prior:'$5M',  delta:'$0M',   deltaPct:'+0.0%' },
    ] },
    { name:'Intermediate Core-Plus', color:ALLOC.alternatives.dot,vehicle:'Mutual Fund',cur:'$30M', prior:'$31M',  delta:'-$1M',  deltaPct:'-3.2%', sub:[
      { vehicle:'MF',  cur:'$22M', prior:'$24M', delta:'-$2M',  deltaPct:'-8.3%' },
      { vehicle:'ETF', cur:'$8M',  prior:'$7M',  delta:'+$1M',  deltaPct:'+14.3%' },
    ] },
    { name:'Foreign Large Blend',  color:ALLOC.other.dot,        vehicle:'Mutual Fund', cur:'$32M', prior:'$30M',  delta:'+$2M',  deltaPct:'+6.7%', sub:[
      { vehicle:'MF',  cur:'$19M', prior:'$18M', delta:'+$1M',  deltaPct:'+5.6%' },
      { vehicle:'ETF', cur:'$10M', prior:'$9M',  delta:'+$1M',  deltaPct:'+11.1%' },
      { vehicle:'ADR', cur:'$3M',  prior:'$3M',  delta:'$0M',   deltaPct:'+0.0%' },
    ] },
    { name:'Mid-Cap Growth',       color:ALLOC.cash.dot,         vehicle:'ETF',         cur:'$23M', prior:'$22M',  delta:'+$1M',  deltaPct:'+4.5%', sub:[
      { vehicle:'ETF', cur:'$14M', prior:'$13M', delta:'+$1M',  deltaPct:'+7.7%' },
      { vehicle:'MF',  cur:'$9M',  prior:'$9M',  delta:'$0M',   deltaPct:'+0.0%' },
    ] },
    { name:'Real Estate',          color:ALLOC.private.dot,      vehicle:'Mutual Fund', cur:'$24M', prior:'$25M',  delta:'-$1M',  deltaPct:'-4.0%', sub:[
      { vehicle:'REIT MF', cur:'$13M', prior:'$15M', delta:'-$2M',  deltaPct:'-13.3%' },
      { vehicle:'Private', cur:'$8M',  prior:'$7M',  delta:'+$1M',  deltaPct:'+14.3%' },
      { vehicle:'ETF',     cur:'$3M',  prior:'$3M',  delta:'$0M',   deltaPct:'+0.0%' },
    ] },
  ];

  return (
    <div style={cardStyle}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 18px 6px' }}>
        <div style={{ fontFamily:'Inter', fontSize:13, fontWeight:600, color:'rgb(249,250,251)' }}>Money in motion</div>
        <div style={{ display:'flex', background:'rgba(0,0,0,0.3)', borderRadius:6, padding:2, border:'1px solid rgba(75,85,99,0.3)' }}>
          {['AUM','Inflows','Net Flows'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding:'4px 10px', borderRadius:4, border:'none',
              background: tab === t ? 'rgba(16,185,129,0.25)' : 'transparent',
              color: tab === t ? 'rgb(52,211,153)' : 'rgb(163,163,163)',
              fontFamily:'Inter', fontSize:10.5, fontWeight: tab===t?600:500, cursor:'pointer',
            }}>{t}</button>
          ))}
        </div>
      </div>
      <table style={{ width:'100%', borderCollapse:'collapse', fontFamily:'Inter', fontSize:11.5 }}>
        <thead>
          <tr>
            <th style={mmTh}>Category</th>
            <th style={mmTh}>Vehicle</th>
            <th style={mmThR}>Current AUM</th>
            <th style={mmThR}>Prior Period AUM</th>
            <th style={mmThR}>POP Change ($)</th>
            <th style={mmThR}>POP Change (%)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r,i) => {
            const isExp = expanded.has(r.name);
            const hasSub = !!r.sub;
            return (
              <React.Fragment key={i}>
                <tr style={{ borderTop:'1px solid rgba(75,85,99,0.18)', cursor: hasSub ? 'pointer' : 'default' }}
                    onClick={() => hasSub && toggle(r.name)}>
                  <td style={mmTd}>
                    <span style={{ display:'inline-flex', alignItems:'center', gap:8 }}>
                      {hasSub && <i className={`fa-solid ${isExp ? 'fa-chevron-down' : 'fa-chevron-right'}`} style={{ fontSize:9, color:'rgb(107,114,128)', width:9 }} />}
                      {!hasSub && <span style={{ width:9 }} />}
                      <span style={{ width:7, height:7, borderRadius:'50%', background:r.color, flexShrink:0 }} />
                      <span style={{ color: hasSub ? 'rgb(229,231,235)' : 'rgb(229,231,235)' }}>{r.name}</span>
                    </span>
                  </td>
                  <td style={{...mmTd, color:'rgb(163,163,163)'}}>{r.vehicle}</td>
                  <td style={mmTdR}>{r.cur}</td>
                  <td style={mmTdR}>{r.prior}</td>
                  <td style={{...mmTdR, color: r.delta.startsWith('+') ? 'rgb(52,211,153)' : 'rgb(248,113,113)', fontWeight:600 }}>{r.delta}</td>
                  <td style={{...mmTdR, color: r.deltaPct.startsWith('+') ? 'rgb(52,211,153)' : 'rgb(248,113,113)' }}>{r.deltaPct}</td>
                </tr>
                {hasSub && isExp && (
                  <>
                    <tr><td colSpan={6} style={{ padding:'4px 16px 4px 36px', fontFamily:'Inter', fontSize:10.5, color:'rgb(107,114,128)', background:'rgba(0,0,0,0.18)' }}>WACC Breakdown — {r.name}</td></tr>
                    <tr style={{ background:'rgba(0,0,0,0.18)' }}>
                      <th style={{...mmThSub, paddingLeft:36 }}>VEHICLE</th>
                      <th style={mmThSub}></th>
                      <th style={mmThSubR}>CURRENT AUM</th>
                      <th style={mmThSubR}>PRIOR PERIOD AUM</th>
                      <th style={mmThSubR}>POP CHANGE ($)</th>
                      <th style={mmThSubR}>POP CHANGE (%)</th>
                    </tr>
                    {r.sub.map((s,j) => (
                      <tr key={j} style={{ background:'rgba(0,0,0,0.10)', borderTop:'1px solid rgba(75,85,99,0.12)' }}>
                        <td style={{...mmTd, paddingLeft:36 }}>
                          <VehicleBadge v={s.vehicle} />
                        </td>
                        <td style={mmTd}></td>
                        <td style={mmTdR}>{s.cur}</td>
                        <td style={mmTdR}>{s.prior}</td>
                        <td style={{...mmTdR, color: s.delta.startsWith('+') ? 'rgb(52,211,153)' : 'rgb(248,113,113)', fontWeight:600 }}>{s.delta}</td>
                        <td style={{...mmTdR, color: s.deltaPct.startsWith('+') ? 'rgb(52,211,153)' : 'rgb(248,113,113)' }}>{s.deltaPct}</td>
                      </tr>
                    ))}
                  </>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 18px', borderTop:'1px solid rgba(75,85,99,0.25)' }}>
        <div style={{ fontFamily:'Inter', fontSize:10.5, color:'rgb(107,114,128)' }}>Showing 1–9 of 10+ Morningstar categories</div>
        <div style={{ display:'flex', gap:4 }}>
          {[1,2,3,4].map(p => (
            <span key={p} style={{
              width:22, height:22, borderRadius:4, display:'inline-flex', alignItems:'center', justifyContent:'center',
              background: p===1 ? 'rgba(96,165,250,0.18)' : 'transparent',
              border: p===1 ? '1px solid rgba(96,165,250,0.4)' : '1px solid rgba(75,85,99,0.4)',
              color: p===1 ? 'rgb(147,197,253)' : 'rgb(163,163,163)',
              fontFamily:'Inter', fontSize:10, fontWeight:500, cursor:'pointer',
            }}>{p}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

const mmTh = { padding:'10px 14px', textAlign:'left', fontFamily:'Inter', fontSize:9.5, fontWeight:600, color:'rgb(107,114,128)', textTransform:'uppercase', letterSpacing:0.6 };
const mmThR = { ...mmTh, textAlign:'right' };
const mmThSub = { padding:'8px 14px', textAlign:'left', fontFamily:'Inter', fontSize:9, fontWeight:600, color:'rgb(107,114,128)', textTransform:'uppercase', letterSpacing:0.6 };
const mmThSubR = { ...mmThSub, textAlign:'right' };
const mmTd = { padding:'12px 14px', color:'rgb(229,231,235)' };
const mmTdR = { padding:'12px 14px', textAlign:'right', color:'rgb(163,163,163)', fontVariantNumeric:'tabular-nums' };

/* ----- shared card style — matches Tile (.glass) from design system ----- */
const cardStyle = {
  background: 'rgba(255,255,255,0.035)',
  border: '1px solid rgba(75,85,99,0.4)',
  borderRadius: 12,
  boxShadow: '0 1px 0 0 rgba(255,255,255,0.03) inset',
  backdropFilter: 'blur(12px) saturate(140%)',
  WebkitBackdropFilter: 'blur(12px) saturate(140%)',
  position: 'relative',
  minWidth: 0,
};

/* ----- canonical chart palette (matches --alloc-* tokens) -----
   Fills render at 0.7 alpha; dots/strokes at full opacity. */
const ALLOC = {
  equities:     { fill: 'rgba(16,185,129,0.70)',  dot: 'rgb(16,185,129)' },   // emerald
  fixedIncome:  { fill: 'rgba(59,130,246,0.70)',  dot: 'rgb(59,130,246)' },   // blue
  alternatives: { fill: 'rgba(139,92,246,0.70)',  dot: 'rgb(139,92,246)' },   // violet
  private:      { fill: 'rgba(249,115,22,0.70)',  dot: 'rgb(249,115,22)' },   // orange
  realEstate:   { fill: 'rgba(239,68,68,0.70)',   dot: 'rgb(239,68,68)' },    // red
  cash:         { fill: 'rgba(20,184,166,0.70)',  dot: 'rgb(20,184,166)' },   // teal
  hedge:        { fill: 'rgba(234,179,8,0.70)',   dot: 'rgb(234,179,8)' },    // amber
  other:        { fill: 'rgba(14,165,233,0.70)',  dot: 'rgb(14,165,233)' },   // sky
};

Object.assign(window, { ClientDetailPage, cardStyle, VehicleBadge });
