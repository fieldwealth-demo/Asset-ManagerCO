/* Export panel — filter-menu-style scope picker. The user chooses what leaves
   the page (whole page, or specific grids + dimensions + measures) and the
   format: one page PDF, or per-grid CSV / Excel. */

const EXPORT_SCOPES = {
  management: {
    title: 'Management Dashboard',
    tiles: [
      { key:'kpi',     label:'Header KPIs',                  kind:'cards' },
      { key:'trend',   label:'Opportunity vs. Market Share', kind:'chart' },
      { key:'channel', label:'Channel Breakdown',            kind:'chart' },
      { key:'rep',     label:'Grid 1 (left)',                kind:'grid'  },
      { key:'firm',    label:'Grid 2 (center)',              kind:'grid'  },
      { key:'cat',     label:'Grid 3 (right)',               kind:'grid'  },
    ],
  },
  opportunity: {
    title: 'Opportunity Dashboard',
    tiles: [
      { key:'kpi',     label:'Header KPIs',            kind:'cards' },
      { key:'share',   label:'Market Share Trend',     kind:'chart' },
      { key:'catdist', label:'Category Distribution',  kind:'chart' },
      { key:'heat',    label:'Territory Heat Map',     kind:'chart' },
      { key:'clients', label:'Client grid',            kind:'grid'  },
    ],
  },
  advantage: {
    title: 'Competitive Advantage',
    tiles: [
      { key:'kpi',    label:'Header KPIs',        kind:'cards' },
      { key:'matrix', label:'Advantage matrix',   kind:'chart' },
      { key:'grid',   label:'Advantage grid',     kind:'grid'  },
    ],
  },
  distribution: {
    title: 'Distribution Intelligence',
    tiles: [
      { key:'kpi',   label:'Header KPIs',      kind:'cards' },
      { key:'map',   label:'Territory map',    kind:'chart' },
      { key:'grid',  label:'Distribution grid', kind:'grid' },
    ],
  },
};

const EXPORT_DIMENSIONS = ['Salesperson','Region','Office','Team','Financial Advisor','Firm','Channel','Category','Focus Category','Vehicle'];
const EXPORT_MEASURES = ['Mkt Opp AUM','Your AUM','Mkt Share (AUM)','Mkt Opp Inflows','Your Inflows','Mkt Share (Inflows)','Mkt Opp Net Flows','Your Net Flows','Mkt Share (Net Flows)','YoY %'];
function ExportPanel({ open, onClose, view, period }) {
  const scope = EXPORT_SCOPES[view] || EXPORT_SCOPES.management;
  const [mode, setMode] = React.useState('page');     // 'page' | 'select'
  const [format, setFormat] = React.useState('pdf');  // 'pdf' | 'csv' | 'xlsx'
  const [tiles, setTiles] = React.useState([]);
  const [dims, setDims] = React.useState([]);
  const [measures, setMeasures] = React.useState(['Mkt Opp AUM','Your AUM','Mkt Share (AUM)']);
  const [done, setDone] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setDone(false);
    setTiles(scope.tiles.filter(t => t.kind === 'grid').map(t => t.key));
  }, [open, view]);

  const gridCount = tiles.filter(k => (scope.tiles.find(t => t.key === k) || {}).kind === 'grid').length;
  const fileCount = mode === 'page' ? 1 : (format === 'pdf' ? 1 : Math.max(gridCount, 1));
  const canExport = mode === 'page' || tiles.length > 0;

  const toggleIn = (arr, set, v) => set(arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]);

  return (
    <>
      <div onClick={onClose} style={{
        position:'fixed', inset:0, background:'rgba(0,0,0,0.55)',
        opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none',
        transition:'opacity .22s ease-out', zIndex: 90,
      }} />
      <aside style={{
        position:'fixed', top:0, right:0, bottom:0, width:420, zIndex:100,
        background:'rgb(17,24,39)', borderLeft:'1px solid rgba(75,85,99,0.6)',
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition:'transform .26s cubic-bezier(.2,.8,.2,1)',
        display:'flex', flexDirection:'column', boxShadow: open ? '-20px 0 60px rgba(0,0,0,0.5)' : 'none', visibility: open ? 'visible' : 'hidden', transitionProperty: 'transform, visibility', transitionDelay: open ? '0s' : '0s, .26s',
      }}>
        <div style={{ padding:'18px 22px', borderBottom:'1px solid rgba(75,85,99,0.4)', display:'flex', alignItems:'center', gap:10 }}>
          <i className="fa-solid fa-arrow-up-from-bracket" style={{ color:'rgb(52,211,153)' }} />
          <div>
            <div style={{ fontFamily:'Geist, Inter', fontWeight:700, fontSize:16, color:'rgb(249,250,251)' }}>Export</div>
            <div style={{ fontFamily:'Inter', fontSize:10.5, color:'rgb(163,163,163)', marginTop:1 }}>{scope.title} · {period || 'YTD'}</div>
          </div>
          <div style={{ flex:1 }} />
          <button onClick={onClose} style={{
            width:28, height:28, border:'1px solid rgba(75,85,99,0.5)', borderRadius:6,
            background:'transparent', color:'rgb(163,163,163)', cursor:'pointer',
          }}><i className="fa-solid fa-xmark" /></button>
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:'18px 22px', display:'flex', flexDirection:'column', gap:20 }}>
          <div>
            <div style={xpLabel}>What to export</div>
            <div style={{ display:'flex', gap:8 }}>
              <ModeCard on={mode==='page'}   onClick={() => setMode('page')}   icon="file-lines"  title="Full page"  sub="Everything as laid out" />
              <ModeCard on={mode==='select'} onClick={() => setMode('select')} icon="table-cells" title="Choose tiles" sub="Pick grids & charts" />
            </div>
          </div>

          {mode === 'select' && (
            <>
              <div>
                <div style={xpLabel}>Tiles</div>
                <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                  {scope.tiles.map(t => (
                    <CheckRow key={t.key} on={tiles.includes(t.key)} onClick={() => toggleIn(tiles, setTiles, t.key)}
                      label={t.label} tag={t.kind} />
                  ))}
                </div>
              </div>
              <SearchMultiSelect label="Dimensions" placeholder="As shown on each tile"
                options={EXPORT_DIMENSIONS} selected={dims} onChange={setDims} />
              <SearchMultiSelect label="Measures" placeholder="Choose measures"
                options={EXPORT_MEASURES} selected={measures} onChange={setMeasures} />            </>
          )}

          <div>
            <div style={xpLabel}>Format</div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {[
                { k:'pdf',  l:'PDF — full page' },
                { k:'csv',  l:'CSV — one file per grid' },
                { k:'xlsx', l:'Excel — one sheet per grid' },
              ].map(f => {
                const on = format === f.k;
                return (
                  <button key={f.k} onClick={() => setFormat(f.k)} style={{
                    padding:'7px 12px', borderRadius:9999, cursor:'pointer',
                    border:`1px solid ${on ? 'rgb(16,185,129)' : 'rgba(75,85,99,0.5)'}`,
                    background: on ? 'rgba(16,185,129,0.2)' : 'transparent',
                    color: on ? 'rgb(52,211,153)' : 'rgb(209,213,219)',
                    fontFamily:'Inter', fontSize:11.5, fontWeight: on ? 600 : 400,
                  }}>{f.l}</button>
                );
              })}
            </div>
          </div>

          <div style={{
            padding:'10px 12px', borderRadius:8, background:'rgba(255,255,255,0.03)',
            border:'1px solid rgba(75,85,99,0.4)', fontFamily:'Inter', fontSize:10.5, lineHeight:1.55, color:'rgb(163,163,163)',
          }}>
            Active filters and the selected time period are carried into the export and stamped in the file header. Time-synthesized periods stay flagged.
          </div>

          {done && (
            <div style={{
              padding:'10px 12px', borderRadius:8, background:'rgba(16,185,129,0.12)',
              border:'1px solid rgba(16,185,129,0.4)', fontFamily:'Inter', fontSize:11.5, color:'rgb(110,240,180)',
              display:'flex', alignItems:'center', gap:8,
            }}>
              <i className="fa-solid fa-circle-check" />
              {fileCount === 1 ? 'File queued for download.' : `${fileCount} files queued for download.`}
            </div>
          )}
        </div>

        <div style={{ padding:'14px 22px', borderTop:'1px solid rgba(75,85,99,0.4)', display:'flex', gap:10, alignItems:'center' }}>
          <span style={{ fontFamily:'Inter', fontSize:10.5, color:'rgb(107,114,128)' }}>
            {fileCount} file{fileCount !== 1 ? 's' : ''}
          </span>
          <div style={{ flex:1 }} />
          <button onClick={onClose} style={{
            height:38, padding:'0 16px', borderRadius:8,
            border:'1px solid rgba(75,85,99,0.6)', background:'transparent',
            color:'rgb(209,213,219)', fontFamily:'Inter', fontSize:13, cursor:'pointer',
          }}>Cancel</button>
          <button disabled={!canExport} onClick={() => setDone(true)} style={{
            height:38, padding:'0 20px', borderRadius:8,
            border:`1px solid ${canExport ? 'rgb(16,185,129)' : 'rgba(75,85,99,0.6)'}`,
            background: canExport ? 'rgb(16,185,129)' : 'transparent',
            color: canExport ? '#fff' : 'rgb(107,114,128)',
            fontFamily:'Inter', fontSize:13, fontWeight:600, cursor: canExport ? 'pointer' : 'not-allowed',
          }}>Export</button>
        </div>
      </aside>
    </>
  );
}

const xpLabel = {
  fontFamily:'Inter', fontSize:10, fontWeight:600, color:'rgb(163,163,163)',
  textTransform:'uppercase', letterSpacing:0.6, marginBottom:8,
};

function ModeCard({ on, onClick, icon, title, sub }) {
  return (
    <button onClick={onClick} style={{
      flex:1, textAlign:'left', padding:'12px 12px', borderRadius:8, cursor:'pointer',
      border:`1px solid ${on ? 'rgb(16,185,129)' : 'rgba(75,85,99,0.5)'}`,
      background: on ? 'rgba(16,185,129,0.12)' : 'rgba(0,0,0,0.25)',
    }}>
      <i className={`fa-solid fa-${icon}`} style={{ fontSize:13, color: on ? 'rgb(52,211,153)' : 'rgb(107,114,128)' }} />
      <div style={{ fontFamily:'Inter', fontSize:12, fontWeight:600, color:'rgb(249,250,251)', marginTop:6 }}>{title}</div>
      <div style={{ fontFamily:'Inter', fontSize:10, color:'rgb(163,163,163)', marginTop:2 }}>{sub}</div>
    </button>
  );
}

function CheckRow({ on, onClick, label, tag }) {
  return (
    <button onClick={onClick} style={{
      width:'100%', textAlign:'left', padding:'7px 8px', borderRadius:6, border:'none',
      background: on ? 'rgba(16,185,129,0.12)' : 'transparent',
      fontFamily:'Inter', fontSize:12, cursor:'pointer',
      display:'flex', alignItems:'center', gap:9,
      color: on ? 'rgb(249,250,251)' : 'rgb(209,213,219)',
    }}
    onMouseEnter={e => { if (!on) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
    onMouseLeave={e => { if (!on) e.currentTarget.style.background = 'transparent'; }}
    >
      <span style={{
        width:14, height:14, borderRadius:3, flexShrink:0,
        border:`1px solid ${on ? 'rgb(16,185,129)' : 'rgba(107,114,128,0.7)'}`,
        background: on ? 'rgb(16,185,129)' : 'transparent',
        display:'inline-flex', alignItems:'center', justifyContent:'center',
      }}>{on && <i className="fa-solid fa-check" style={{ fontSize:8, color:'#fff' }} />}</span>
      <span style={{ flex:1 }}>{label}</span>
      <span style={{
        fontFamily:'Inter', fontSize:9, fontWeight:700, letterSpacing:0.5, textTransform:'uppercase',
        color:'rgb(107,114,128)', border:'1px solid rgba(75,85,99,0.5)', borderRadius:4, padding:'1px 5px',
      }}>{tag}</span>
    </button>
  );
}

Object.assign(window, { ExportPanel, EXPORT_SCOPES });
