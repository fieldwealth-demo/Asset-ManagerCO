/* Custom Reports — a blank board an asset manager fills with their own tiles.
   Tiles are built in the Tile Studio against firm-level data only: firms,
   channels, regions, categories, vehicles, products and flows. Nothing here
   exposes an intermediary's advisors or their end clients. */

const CR_KEY = 'amp_custom_reports_v1';

function crLoad() {
  try { const raw = localStorage.getItem(CR_KEY); return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
}
function crSave(boards) {
  try { localStorage.setItem(CR_KEY, JSON.stringify(boards)); } catch (e) {}
}

function CustomReportsPage() {
  const [boards, setBoards] = React.useState(() => crLoad() || [{ id:'b1', name:'My Report', tiles:[] }]);
  const [activeId, setActiveId] = React.useState(() => (crLoad() || [{ id:'b1' }])[0].id);
  const [studio, setStudio] = React.useState(null); // { tile } | { tile:null } for new
  const [picker, setPicker] = React.useState(false);
  const board = boards.find(b => b.id === activeId) || boards[0];

  React.useEffect(() => { crSave(boards); }, [boards]);

  const setTiles = (fn) => setBoards(bs => bs.map(b => b.id === board.id ? { ...b, tiles: fn(b.tiles) } : b));
  const upsert = (cfg) => setTiles(ts => ts.some(t => t.id === cfg.id) ? ts.map(t => t.id === cfg.id ? cfg : t) : [...ts, cfg]);
  const remove = (id) => setTiles(ts => ts.filter(t => t.id !== id));
  const move = (id, dir) => setTiles(ts => {
    const i = ts.findIndex(t => t.id === id), j = i + dir;
    if (i < 0 || j < 0 || j >= ts.length) return ts;
    const next = [...ts]; const [x] = next.splice(i, 1); next.splice(j, 0, x); return next;
  });

  const addBoard = () => {
    const id = 'b' + Date.now();
    setBoards(bs => [...bs, { id, name: 'Report ' + (bs.length + 1), tiles: [] }]);
    setActiveId(id);
  };
  const renameBoard = (name) => setBoards(bs => bs.map(b => b.id === board.id ? { ...b, name } : b));
  const deleteBoard = () => {
    if (boards.length === 1) { setTiles(() => []); return; }
    setBoards(bs => bs.filter(b => b.id !== board.id));
    setActiveId(boards.find(b => b.id !== board.id).id);
  };

  const applyTemplate = (tpl) => {
    setTiles(ts => [...ts, ...tpl.tiles.map((t, i) => ({ ...t, id: 't' + Date.now() + '-' + i }))]);
    setPicker(false);
  };

  return (
    <div style={{ padding:20, display:'flex', flexDirection:'column', gap:14, flex:1, minHeight:0 }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
        <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
          {boards.map(b => (
            <button key={b.id} onClick={() => setActiveId(b.id)} style={{
              height:30, padding:'0 12px', borderRadius:7, cursor:'pointer',
              background: b.id === board.id ? 'rgba(16,185,129,0.16)' : 'rgba(255,255,255,0.04)',
              border: '1px solid ' + (b.id === board.id ? 'rgb(16,185,129)' : 'rgba(75,85,99,0.6)'),
              color: b.id === board.id ? 'rgb(110,231,183)' : 'rgb(209,213,219)',
              fontFamily:'Inter', fontSize:12, fontWeight: b.id === board.id ? 600 : 500, whiteSpace:'nowrap',
            }}>{b.name}</button>
          ))}
          <button onClick={addBoard} title="New report" style={{
            width:30, height:30, borderRadius:7, cursor:'pointer', background:'rgba(255,255,255,0.04)',
            border:'1px solid rgba(75,85,99,0.6)', color:'rgb(209,213,219)',
          }}><i className="fa-solid fa-plus" style={{ fontSize:11 }} /></button>
        </div>
        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:8 }}>
          <input value={board.name} onChange={(e) => renameBoard(e.target.value)} spellCheck={false} style={{
            height:30, width:190, padding:'0 10px', borderRadius:7, background:'rgba(0,0,0,0.3)',
            border:'1px solid rgba(75,85,99,0.6)', color:'rgb(249,250,251)', fontFamily:'Inter', fontSize:12, outline:'none',
          }} />
          <button onClick={() => setPicker(true)} style={crBtn()}>
            <i className="fa-solid fa-table-columns" style={{ fontSize:11 }} /> Start from template
          </button>
          <button onClick={() => setStudio({ tile:null })} style={crBtn('primary')}>
            <i className="fa-solid fa-plus" style={{ fontSize:11 }} /> New tile
          </button>
          <button onClick={deleteBoard} title="Clear this report" style={crBtn()}>
            <i className="fa-solid fa-trash" style={{ fontSize:11 }} />
          </button>
        </div>
      </div>

      <div style={{
        fontFamily:'Inter', fontSize:11, color:'rgb(148,163,184)',
        display:'flex', alignItems:'center', gap:8,
      }}>
        <i className="fa-solid fa-shield-halved" style={{ fontSize:11, color:'rgb(52,211,153)' }} />
        Firm-level data only — market opportunity, platform coverage and flows by firm, channel, region, category and vehicle.
      </div>

      {board.tiles.length === 0 ? (
        <div style={{
          flex:1, minHeight:280, borderRadius:12, border:'1px dashed rgba(75,85,99,0.7)',
          background:'rgba(255,255,255,0.02)', display:'flex', flexDirection:'column',
          alignItems:'center', justifyContent:'center', gap:12, textAlign:'center', padding:24,
        }}>
          <div style={{ fontFamily:'Inter', fontSize:15, fontWeight:600, color:'rgb(249,250,251)' }}>Build your first tile</div>
          <div style={{ fontFamily:'Inter', fontSize:12, color:'rgb(163,163,163)', maxWidth:440, lineHeight:1.5 }}>
            Pick a data source, drag fields into rows, columns and values, and choose a visual. Or describe what you want in plain English and edit the result.
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={() => setStudio({ tile:null })} style={crBtn('primary')}>
              <i className="fa-solid fa-plus" style={{ fontSize:11 }} /> New tile
            </button>
            <button onClick={() => setPicker(true)} style={crBtn()}>Start from template</button>
          </div>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(12, minmax(0,1fr))', gap:14, alignContent:'start' }}>
          {board.tiles.map(t => (
            <CRTile key={t.id} cfg={t}
              onEdit={() => setStudio({ tile:t })}
              onRemove={() => remove(t.id)}
              onMove={(d) => move(t.id, d)}
              onSpan={(s) => upsert({ ...t, span:s })}
            />
          ))}
        </div>
      )}

      {picker && <CRTemplatePicker onPick={applyTemplate} onClose={() => setPicker(false)} />}

      {studio && (
        <TileStudio
          open
          initial={studio.tile}
          saveLabel={studio.tile ? 'Save tile' : 'Add to report'}
          onClose={() => setStudio(null)}
          onSave={(cfg) => { upsert({ ...cfg, id: cfg.id || ('t' + Date.now()) }); setStudio(null); }}
        />
      )}
    </div>
  );
}

function crBtn(variant) {
  return {
    height:30, padding:'0 12px', borderRadius:7, cursor:'pointer',
    fontFamily:'Inter', fontSize:12, fontWeight:600,
    display:'inline-flex', alignItems:'center', gap:7,
    background: variant === 'primary' ? 'rgb(5,122,85)' : 'rgba(255,255,255,0.04)',
    border: '1px solid ' + (variant === 'primary' ? 'rgb(5,122,85)' : 'rgba(75,85,99,0.6)'),
    color: variant === 'primary' ? '#fff' : 'rgb(229,231,235)',
  };
}

function CRTile({ cfg, onEdit, onRemove, onMove, onSpan }) {
  const span = cfg.span || 4;
  const height = cfg.h || (cfg.viz === 'kpi' ? 130 : 340);
  return (
    <div style={{
      gridColumn: 'span ' + Math.max(3, Math.min(12, span)),
      minWidth:0, height, borderRadius:12,
      background:'rgba(255,255,255,0.035)', border:'1px solid rgba(75,85,99,0.4)',
      display:'flex', flexDirection:'column', overflow:'hidden',
    }}>
      <div style={{
        display:'flex', alignItems:'center', flexWrap:'wrap', rowGap:6, gap:8, padding:'10px 12px 8px',
        borderBottom:'1px solid rgba(75,85,99,0.25)',
      }}>
        <span title={cfg.title || 'Untitled tile'} style={{ fontFamily:'Inter', fontSize:12.5, fontWeight:600, color:'rgb(249,250,251)',
          flex:'1 1 90px', minWidth:70, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{cfg.title || 'Untitled tile'}</span>
        <div style={{ marginLeft:'auto', flexShrink:0, display:'flex', alignItems:'center', gap:4 }}>
          <select value={span} onChange={(e) => onSpan(Number(e.target.value))} title="Tile width"
            style={{ height:22, borderRadius:5, background:'rgba(0,0,0,0.3)', border:'1px solid rgba(75,85,99,0.6)',
              color:'rgb(209,213,219)', fontFamily:'Inter', fontSize:10.5, outline:'none' }}>
            {[3,4,6,8,12].map(s => <option key={s} value={s} style={{ background:'rgb(17,24,39)' }}>{s === 12 ? 'Full' : s + '/12'}</option>)}
          </select>
          <CRIconBtn icon="arrow-left" title="Move earlier" onClick={() => onMove(-1)} />
          <CRIconBtn icon="arrow-right" title="Move later" onClick={() => onMove(1)} />
          <CRIconBtn icon="pen" title="Edit tile" onClick={onEdit} />
          <CRIconBtn icon="xmark" title="Remove tile" onClick={onRemove} />
        </div>
      </div>
      <div style={{ flex:1, minHeight:0, padding:'8px 10px 10px' }}>
        <TilePreview cfg={cfg} />
      </div>
    </div>
  );
}

function CRIconBtn({ icon, title, onClick }) {
  return (
    <button onClick={onClick} title={title} style={{
      width:22, height:22, borderRadius:5, cursor:'pointer', padding:0,
      background:'transparent', border:'1px solid rgba(75,85,99,0.5)', color:'rgb(163,163,163)',
      display:'inline-flex', alignItems:'center', justifyContent:'center',
    }}><i className={'fa-solid fa-' + icon} style={{ fontSize:10 }} /></button>
  );
}

function CRTemplatePicker({ onPick, onClose }) {
  const templates = window.TA_TEMPLATES || [];
  return (
    <div onMouseDown={onClose} style={{
      position:'fixed', inset:0, zIndex:500, background:'rgba(3,7,18,0.72)',
      display:'flex', alignItems:'center', justifyContent:'center', padding:24,
    }}>
      <div onMouseDown={(e) => e.stopPropagation()} style={{
        width:'min(760px, 100%)', maxHeight:'80vh', overflow:'auto', borderRadius:14,
        background:'rgb(17,24,39)', border:'1px solid rgba(75,85,99,0.7)', padding:18,
        boxShadow:'0 30px 70px -20px rgba(0,0,0,0.8)',
      }}>
        <div style={{ display:'flex', alignItems:'center', marginBottom:14 }}>
          <span style={{ fontFamily:'Inter', fontSize:14, fontWeight:600, color:'rgb(249,250,251)' }}>Start from a template</span>
          <button onClick={onClose} style={{ marginLeft:'auto', background:'transparent', border:'none',
            color:'rgb(163,163,163)', cursor:'pointer', fontSize:14 }}><i className="fa-solid fa-xmark" /></button>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(230px,1fr))', gap:10 }}>
          {templates.map(tpl => (
            <button key={tpl.id} onClick={() => onPick(tpl)} style={{
              textAlign:'left', padding:14, borderRadius:10, cursor:'pointer',
              background:'rgba(255,255,255,0.04)', border:'1px solid rgba(75,85,99,0.6)',
            }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                <i className={'fa-solid fa-' + (tpl.icon || 'table-columns')} style={{ fontSize:12, color:'rgb(52,211,153)' }} />
                <span style={{ fontFamily:'Inter', fontSize:12.5, fontWeight:600, color:'rgb(249,250,251)' }}>{tpl.name}</span>
              </div>
              <div style={{ fontFamily:'Inter', fontSize:11, color:'rgb(163,163,163)', lineHeight:1.45 }}>{tpl.desc}</div>
              <div style={{ marginTop:8, fontFamily:'Inter', fontSize:10.5, color:'rgb(107,114,128)' }}>{(tpl.tiles || []).length} tiles</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { CustomReportsPage });
