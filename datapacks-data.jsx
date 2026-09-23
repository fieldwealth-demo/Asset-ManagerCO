/* Data Packs — shared pack catalog, persistence, upload simulation */
const DP_LS_KEY = 'field_am_onboard_v1';
const DP_PACKS = [
  { id:'ssnc_office', name:'SS&C Office Wallet Share', provider:'SS&C', vendorType:'Aggregator', pattern:'B', grain:'Office', cadence:'Monthly', schema:'SSNC_OFFICE',
    desc:'Office-grain MF wallet share consortium across BD, IBD, RIA, Bank & Trust channels. Sponsor-scoped to your CUSIPs.',
    stats:{ rows:412380, units:18240, unit:'offices' },
    tiers:[
      { n:1, name:'Standard', scope:'MF', price:175000, note:'Base Office Wallet Share subscription' },
      { n:2, name:'Premium', scope:'MF + ETF', price:250000, note:'Adds ETF coverage' },
    ] },
  { id:'ssnc_teams', name:'SS&C Teams', provider:'SS&C', vendorType:'Aggregator', pattern:'B', grain:'Team', cadence:'Quarterly', schema:'SSNC_TEAMS',
    desc:'Team-grain consortium companion to Office Wallet Share — roughly 17% of the Office consortium opportunity.',
    stats:{ rows:96414, units:6120, unit:'teams' },
    tiers:[
      { n:1, name:'Standard', scope:'MF', price:200000, note:'Team-grain consortium' },
    ] },
  { id:'ms', name:'Morgan Stanley AIP', provider:'Morgan Stanley', vendorType:'BD Direct', pattern:'A', grain:'FA', cadence:'Monthly', schema:'MS',
    desc:'FA-grain home office data. The column set expands with each tier — from FA + AUM up to competitive analytics.',
    stats:{ rows:84213, units:15420, unit:'FAs' },
    tiers:[
      { n:1, name:'Tier 1', scope:'MF', price:225000, note:'FA + AUM only' },
      { n:2, name:'Tier 2', scope:'MF', price:315000, note:'Adds T12 sales by platform sub-channel' },
      { n:3, name:'Tier 3', scope:'MF', price:425000, note:'Adds Category Data wide format' },
      { n:4, name:'Tier 4', scope:'MF + ETF', price:540000, note:'Adds ETF + competitive advantage analytics' },
    ] },
  { id:'ubs', name:'UBS FA Data', provider:'UBS', vendorType:'BD Direct', pattern:'A', grain:'FA', cadence:'Monthly', schema:'UBS',
    desc:'FA-grain AUM and sales across UBS advisory programs. Delivered via BNY Growth Dynamics.',
    stats:{ rows:61882, units:9850, unit:'FAs' },
    tiers:[
      { n:1, name:'Premium', scope:'MF', price:225000, note:'FA AUM + Sales' },
      { n:2, name:'Premium + ETF', scope:'MF + ETF', price:290000, note:'Adds ETF AUM & Sales' },
      { n:3, name:'Premium + Enhanced + ETF', scope:'MF + ETF', price:350000, note:'Adds enhanced FA fields + category detail' },
    ] },
  { id:'lpl', name:'LPL LEAP', provider:'LPL Financial', vendorType:'BD Direct', pattern:'A', grain:'Advisor', cadence:'Quarterly', schema:'LPL',
    desc:'Advisor × account-platform grain across IBD, Hybrid RIA, credit union and bank channels. Custom asset classes.',
    stats:{ rows:118504, units:22930, unit:'advisors' },
    tiers:[
      { n:1, name:'LEAP $100K', scope:'MF', price:100000, note:'Advisor + sponsor position only · quarterly' },
      { n:2, name:'LEAP $300K', scope:'MF + ETF', price:250000, note:'Adds platform file context · quarterly' },
      { n:3, name:'LEAP $500K', scope:'MF + ETF', price:500000, note:'Same scope, monthly cadence' },
    ] },
  { id:'broadridge', name:'Broadridge ETF', provider:'Broadridge', vendorType:'Aggregator', pattern:'B', grain:'Office', cadence:'Monthly', schema:'BROADRIDGE',
    desc:'ETF-only office-grain consortium across 1,567 offices — wirehouse, regional, IBD, bank & trust, RIA.',
    stats:{ rows:210667, units:1567, unit:'offices' },
    tiers:[
      { n:1, name:'Standard', scope:'ETF', price:165000, note:'ETF office-grain consortium' },
    ] },
];
const DP_AVATARS = { ssnc_office:'rgb(134,239,172)', ssnc_teams:'rgb(110,231,183)', ms:'rgb(147,197,253)', ubs:'rgb(196,181,253)', lpl:'rgb(253,224,71)', broadridge:'rgb(125,211,252)' };
const DP_DEFAULT_TIERS = { ssnc_office:1, ssnc_teams:1, ms:2, ubs:3, lpl:2, broadridge:1 };
const DP_CLIENT = 'Neuberger';
const DP_DB = 'FW_RAW_' + DP_CLIENT.toUpperCase();

const dpPack = (id) => DP_PACKS.find(p => p.id === id);
const dpInit = (p) => p.provider.split(/[\s&]+/).filter(Boolean).slice(0,2).map(w => w[0]).join('').toUpperCase();
const dpAvatar = (id, size) => ({ width:size, height:size, borderRadius:8, flexShrink:0, background:DP_AVATARS[id] || 'rgb(156,163,175)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Inter', fontSize:size*0.34, fontWeight:700, color:'rgb(17,24,39)' });
const dpMoney = (v) => v >= 1000000 ? '$' + (v/1000000).toFixed(2) + 'M' : '$' + Math.round(v/1000) + 'K';
const dpFmt = (n) => n.toLocaleString('en-US');
const dpTierOf = (id, tiers) => { const p = dpPack(id); const n = (tiers && tiers[id]) || 1; return p.tiers.find(t => t.n === n) || p.tiers[0]; };
const dpCadence = (id, tiers) => (id === 'lpl' && tiers && tiers.lpl === 3) ? 'Monthly' : dpPack(id).cadence;
const dpStageFor = (pct) => pct < 45 ? 'Uploading file…' : pct < 70 ? 'Validating schema…' : pct < 88 ? 'Detecting grain…' : 'Landing in Snowflake…';

const dpLoad = () => { try { return JSON.parse(localStorage.getItem(DP_LS_KEY) || 'null'); } catch(e) { return null; } };
const dpSave = (patch) => {
  const cur = dpLoad() || {};
  const next = Object.assign({}, cur, patch);
  if (next.uploads) { const c = {}; Object.keys(next.uploads).forEach(k => { const u = next.uploads[k]; c[k] = u && u.state === 'uploading' ? { state:'idle' } : u; }); next.uploads = c; }
  try { localStorage.setItem(DP_LS_KEY, JSON.stringify(next)); } catch(e) {}
};
const dpSeed = () => {
  const selected = {}, uploads = {};
  DP_PACKS.forEach(p => {
    selected[p.id] = true;
    uploads[p.id] = { state:'done', file:p.id + '_' + DP_DEFAULT_TIERS[p.id] + '_2026-06.csv', rows:p.stats.rows, units:p.stats.units, unit:p.stats.unit, date:'Jun 2026' };
  });
  return { selected, uploads, tiers:Object.assign({}, DP_DEFAULT_TIERS), paused:{} };
};

/* Upload simulation hook: returns [uploads, setUploads, start(id, filename?, tierN?)] */
function useDPUploads(initial) {
  const [uploads, setUploads] = React.useState(initial || {});
  const timers = React.useRef({});
  React.useEffect(() => () => Object.values(timers.current).forEach(clearInterval), []);
  const start = (id, filename, tierN) => {
    const p = dpPack(id);
    const file = filename || (id + '_tier' + (tierN || 1) + '_2026-06.csv');
    clearInterval(timers.current[id]);
    const started = Date.now(), duration = 2200 + Math.random() * 900;
    setUploads(u => Object.assign({}, u, { [id]: { state:'uploading', pct:0, file } }));
    timers.current[id] = setInterval(() => {
      setUploads(u => {
        const cur = u[id];
        if (!cur || cur.state !== 'uploading') { clearInterval(timers.current[id]); return u; }
        const pct = Math.min(100, ((Date.now() - started) / duration) * 100);
        if (pct >= 100) { clearInterval(timers.current[id]); return Object.assign({}, u, { [id]: { state:'done', file:cur.file, rows:p.stats.rows, units:p.stats.units, unit:p.stats.unit, date:'Jun 2026' } }); }
        return Object.assign({}, u, { [id]: Object.assign({}, cur, { pct }) });
      });
    }, 110);
  };
  return [uploads, setUploads, start];
}

/* Shared tier radio row */
function DPTierRow({ tier, selected, onPick }) {
  return (
    <div onClick={onPick} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', borderRadius:10, cursor:'pointer', border:'1px solid ' + (selected ? 'rgba(16,185,129,0.6)' : 'rgba(75,85,99,0.5)'), background:selected ? 'rgba(16,185,129,0.07)' : 'rgba(0,0,0,0.18)', transition:'border-color 150ms, background 150ms' }}>
      <div style={{ width:18, height:18, borderRadius:9999, flexShrink:0, border:'1.5px solid ' + (selected ? 'rgb(16,185,129)' : 'rgba(107,114,128,0.8)'), display:'flex', alignItems:'center', justifyContent:'center' }}>
        {selected && <span style={{ width:8, height:8, borderRadius:9999, background:'rgb(16,185,129)', display:'block' }}></span>}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontFamily:'Inter', fontSize:13, fontWeight:600, color:'rgb(249,250,251)' }}>{tier.name}</div>
        <div style={{ fontFamily:'Inter', fontSize:11.5, color:'rgb(163,163,163)', marginTop:2 }}>{tier.scope} · {tier.note}</div>
      </div>
    </div>
  );
}

/* Shared upload drop zone / progress / done block. view = upload record */
function DPUploadZone({ u, onStart, onDrop, zoneLabel }) {
  const state = (u && u.state) || 'idle';
  if (state === 'uploading') {
    return (
      <div>
        <div style={{ fontFamily:'Inter', fontSize:11.5, color:'rgb(209,213,219)', marginBottom:8, display:'flex', justifyContent:'space-between' }}><span>{dpStageFor(u.pct || 0)}</span><span style={{ color:'rgb(115,115,115)' }}>{Math.round(u.pct || 0)}%</span></div>
        <div style={{ height:6, borderRadius:9999, background:'rgba(255,255,255,0.08)', overflow:'hidden' }}>
          <div style={{ height:'100%', width:(u.pct || 0) + '%', background:'rgb(16,185,129)', borderRadius:9999, transition:'width 120ms linear' }}></div>
        </div>
        <div style={{ fontFamily:"'Geist Mono', monospace", fontSize:10.5, color:'rgb(115,115,115)', marginTop:7 }}>{u.file}</div>
      </div>
    );
  }
  return (
    <div onClick={onStart} onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]; onDrop(f ? f.name : undefined); }} onDragOver={(e) => e.preventDefault()}
      className="dp-dropzone" style={{ border:'1px dashed rgba(75,85,99,0.8)', borderRadius:10, padding:14, textAlign:'center', cursor:'pointer', background:'rgba(0,0,0,0.2)' }}>
      <div style={{ fontFamily:'Inter', fontSize:12, color:'rgb(209,213,219)' }}><i className="fa-solid fa-arrow-up-from-bracket" style={{ fontSize:11, marginRight:7, color:'rgb(52,211,153)' }}></i>{zoneLabel || 'Drop CSV here or browse'}</div>
      <div style={{ fontFamily:'Inter', fontSize:10.5, color:'rgb(115,115,115)', marginTop:4 }}>click to load the sample delivery</div>
    </div>
  );
}

Object.assign(window, { DP_LS_KEY, DP_PACKS, DP_AVATARS, DP_DEFAULT_TIERS, DP_CLIENT, DP_DB, dpPack, dpInit, dpAvatar, dpMoney, dpFmt, dpTierOf, dpCadence, dpStageFor, dpLoad, dpSave, dpSeed, useDPUploads, DPTierRow, DPUploadZone });
