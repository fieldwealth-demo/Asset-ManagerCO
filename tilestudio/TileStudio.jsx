/* TileStudio — the builder. Pick a dataset, drag or click fields into shelves,
   choose a visual, and see the real aggregation update live. An AI bar drafts a
   config from plain English; every result is an editable config, never a canned tile. */

const TS_INK = 'rgb(249,250,251)';
const TS_MUTE = 'rgb(163,163,163)';
const TS_LINE = 'rgba(75,85,99,0.6)';
const TS_SURF = 'rgba(255,255,255,0.04)';
const TS_GREEN = 'rgb(5,122,85)';

/* injected once: hover styling for the icon pickers */
if (typeof document !== 'undefined' && !document.getElementById('__ts_pick_css')) {
  const el = document.createElement('style');
  el.id = '__ts_pick_css';
  el.textContent = '.ts-pick{transition:background 120ms,border-color 120ms,color 120ms}'
    + '.ts-pick:not(.on):hover{background:rgba(255,255,255,0.1)!important;border-color:rgba(16,185,129,0.6)!important;color:rgb(249,250,251)!important}'
    + '.ts-pick:not(.on):hover svg rect{stroke:rgb(200,205,215)}'
    + '.ts-pick:not(.on):hover svg rect[fill^="rgba(163"]{fill:rgba(163,163,163,0.34)}';
  document.head.appendChild(el);
}

const tsBtn = (variant) => ({
  height:30, padding:'0 13px', borderRadius:7, cursor:'pointer',
  fontFamily:'Inter', fontSize:12, fontWeight:600,
  display:'inline-flex', alignItems:'center', gap:7,
  background: variant === 'primary' ? TS_GREEN : TS_SURF,
  border:'1px solid ' + (variant === 'primary' ? TS_GREEN : TS_LINE),
  color: variant === 'primary' ? '#fff' : 'rgb(229,231,235)',
});

function TSLabel({ children, hint }) {
  return (
    <div style={{ display:'flex', alignItems:'baseline', gap:6, marginBottom:6 }}>
      <span style={{ fontFamily:'Inter', fontSize:9.5, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:TS_MUTE }}>{children}</span>
      {hint && <span style={{ fontFamily:'Inter', fontSize:10, color:'rgba(163,163,163,0.7)' }}>{hint}</span>}
    </div>
  );
}

/* ---- field list --------------------------------------------------------- */
function TSFieldRow({ f, onAdd, source, sourceTag, disabled, disabledNote }) {
  const [hover, setHover] = React.useState(false);
  const isNum = f.type === 'num';
  const icon = isNum ? 'hash' : f.type === 'geo' ? 'map' : f.type === 'date' ? 'calendar' : 'font';
  return (
    <div
      draggable={!disabled}
      onDragStart={disabled ? undefined : (e) => { e.dataTransfer.setData('text/ts-field', f.k); e.dataTransfer.effectAllowed = 'copy'; }}
      onClick={disabled ? undefined : () => onAdd(f)}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      title={disabled ? disabledNote : [f.label, source || (isNum ? 'measure' : 'dimension'), 'click to add, or drag to a shelf'].join(' \u00b7 ')}
      style={{
        display:'flex', alignItems:'center', gap:8, padding:'6px 8px', borderRadius:6,
        cursor: disabled ? 'not-allowed' : 'grab', opacity: disabled ? 0.45 : 1,
        background: hover && !disabled ? 'rgba(255,255,255,0.06)' : 'transparent',
      }}>
      <i className={`fa-solid fa-${icon}`} style={{ fontSize:9.5, width:11, color: isNum ? 'rgb(94,214,164)' : 'rgb(120,160,230)' }} />
      <span style={{ fontFamily:'Inter', fontSize:12, color:'rgb(229,231,235)', flex:1, minWidth:0, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{f.label}</span>
      {disabled && <i className="fa-solid fa-ban" style={{ fontSize:8.5, color:'rgba(234,179,8,0.8)' }} />}
      {!disabled && sourceTag && (
        <span style={{ fontFamily:'Inter', fontSize:9, color:'rgba(163,163,163,0.75)', flexShrink:0,
          maxWidth:76, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{sourceTag}</span>
      )}
      {!disabled && source && !sourceTag && !hover && <i className="fa-solid fa-link" style={{ fontSize:8.5, color:'rgba(163,163,163,0.7)' }} />}
      {!disabled && hover && <i className="fa-solid fa-plus" style={{ fontSize:9, color:TS_MUTE }} />}
    </div>
  );
}

/* Source and fields are separate columns: scrolling a long field list should
   never push the dataset picker out of view, and measures shouldn't be lost
   below a dozen dimensions. */
function TSSourcePanel({ ds, setDs }) {
  const d = dmDataset(ds);
  const dsBtn = (id) => {
    const on = id === ds, def = DM_DATASETS[id];
    return (
      <button key={id} onClick={() => setDs(id)} style={{
        width:'100%', textAlign:'left', display:'flex', alignItems:'center', gap:8,
        padding:'7px 9px', borderRadius:7, cursor:'pointer',
        background: on ? 'rgba(5,122,85,0.2)' : 'transparent',
        border:'1px solid ' + (on ? 'rgba(16,185,129,0.5)' : 'transparent'),
        color: on ? TS_INK : 'rgb(209,213,219)', fontFamily:'Inter', fontSize:12, fontWeight: on ? 600 : 500,
      }}>
        <i className={`fa-solid fa-${def.icon}`} style={{ fontSize:11, width:12, color: on ? 'rgb(16,185,129)' : TS_MUTE }} />
        <span style={{ flex:1, minWidth:0, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{def.label}</span>
      </button>
    );
  };
  return (
    <div style={{ flex:'0 1 206px', minWidth:150, borderRight:'1px solid ' + TS_LINE, display:'flex', flexDirection:'column', minHeight:0, overflow:'auto' }}>
      <div style={{ padding:'12px 12px 14px' }}>
        <TSLabel>Data source</TSLabel>
        <div style={{ display:'flex', flexDirection:'column', gap:2 }}>{DM_GROUPS[0].ids.map(dsBtn)}</div>
        <div style={{ marginTop:12, paddingTop:10, borderTop:'1px solid ' + TS_LINE,
          fontFamily:'Inter', fontSize:10.5, color:TS_MUTE, lineHeight:1.45 }}>
          {d.desc}<br /><span style={{ color:'rgba(163,163,163,0.65)' }}>{[d.source, dmRows(ds).length.toLocaleString() + ' rows'].join(' \u00b7 ')}</span>
        </div>
        {d.needsConnect && (
          <div style={{ marginTop:9, padding:'8px 10px', borderRadius:8,
            background:'rgba(234,179,8,0.1)', border:'1px solid rgba(234,179,8,0.4)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:7, fontFamily:'Inter', fontSize:11, fontWeight:600, color:'rgb(234,179,8)' }}>
              <i className={`fa-solid fa-${d.needsConnect.icon || 'plug'}`} style={{ fontSize:10 }} />
              Connect {d.needsConnect.service}
            </div>
            <div style={{ fontFamily:'Inter', fontSize:10.5, color:TS_MUTE, marginTop:4, lineHeight:1.45 }}>{d.needsConnect.note}</div>
          </div>
        )}
      </div>
    </div>
  );
}

/* Each group scrolls in its own pane, so Measures and Custom stay reachable
   however many dimensions the dataset has. */
function TSFieldPanel({ ds, onAddField, calcs = [], onNewCalc, onEditCalc, onRemoveCalc }) {
  const related = React.useMemo(() => dmRelated(ds), [ds]);
  const [q, setQ] = React.useState('');
  const match = (f) => !q || f.label.toLowerCase().includes(q.toLowerCase());
  const fields = dmFields(ds);
  const dims = fields.filter(f => f.type !== 'num' && match(f));
  const nums = fields.filter(f => f.type === 'num' && match(f));
  const cust = calcs.filter(c => !q || c.name.toLowerCase().includes(q.toLowerCase()));
  /* Only sources that share a column can contribute, so nothing appears here
     that the tile couldn't actually line up with its own rows. */
  const allVals = React.useMemo(() => [
    ...nums,
    ...related.flatMap(rel => dmFields(rel.id)
      .filter(f => f.type === 'num' && !/_count$/.test(f.k) && match(f))
      .map(f => ({ ...f, k: rel.id + '.' + f.k, srcLabel: rel.label }))),
  ], [ds, q, related]);

  const head = (label, count, action) => (
    <div style={{ display:'flex', alignItems:'center', gap:6, padding:'0 4px 4px' }}>
      <span style={{ fontFamily:'Inter', fontSize:9.5, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:TS_MUTE }}>{label}</span>
      <span style={{ fontFamily:'Inter', fontSize:10, color:'rgba(163,163,163,0.7)' }}>{count}</span>
      {action}
    </div>
  );

  return (
    <div style={{ flex:'0 1 238px', minWidth:168, borderRight:'1px solid ' + TS_LINE, display:'flex', flexDirection:'column', minHeight:0 }}>
      <div style={{ padding:'12px 12px 8px' }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search fields"
          style={{ width:'100%', boxSizing:'border-box', background:TS_SURF, border:'1px solid ' + TS_LINE, borderRadius:7,
            color:TS_INK, fontFamily:'Inter', fontSize:11.5, padding:'7px 10px', outline:'none' }} />
      </div>

      {/* rows take the slack; values and custom keep a floor */}
      <div style={{ flex:'1 1 auto', minHeight:78, overflow:'auto', padding:'2px 8px 10px' }}>
        {head('Rows', dims.length)}
        {dims.map(f => <TSFieldRow key={f.k} f={f} onAdd={onAddField} />)}
        {!dims.length && <div style={{ fontFamily:'Inter', fontSize:11, color:'rgba(163,163,163,0.7)', padding:'4px 6px' }}>No match</div>}
      </div>

      <div style={{ flex:'0 1 auto', minHeight:76, maxHeight:'46%', overflow:'auto',
        padding:'10px 8px', borderTop:'1px solid ' + TS_LINE }}>
        {head('Values', allVals.length)}
        {allVals.map(f => (
          <TSFieldRow key={f.k} f={f} source={f.srcLabel} sourceTag={f.srcLabel} onAdd={onAddField} />
        ))}
        {!allVals.length && <div style={{ fontFamily:'Inter', fontSize:11, color:'rgba(163,163,163,0.7)', padding:'4px 6px' }}>No match</div>}
      </div>

      <div style={{ flexShrink:0, maxHeight:'34%', overflow:'auto',
        padding:'10px 8px 12px', borderTop:'1px solid ' + TS_LINE }}>
        {head('Custom', cust.length, (
          <button onClick={() => onNewCalc()} title="New custom field"
            style={{ marginLeft:'auto', background:'transparent', border:'none', cursor:'pointer', color:TS_MUTE, padding:'0 2px' }}>
            <i className="fa-solid fa-plus" style={{ fontSize:10 }} />
          </button>
        ))}
        {cust.map(c => (
          <div key={c.name} style={{ display:'flex', alignItems:'center', gap:2 }}>
            <div style={{ flex:1, minWidth:0 }}>
              <TSFieldRow f={{ k:c.name, label:c.name, type: c.fmt === 'text' ? 'dim' : 'num', fmt:c.fmt, calc:true }} onAdd={onAddField} />
            </div>
            <button onClick={() => onEditCalc(c)} title="Edit" style={{ background:'transparent', border:'none', cursor:'pointer', color:'rgba(163,163,163,0.8)', padding:'2px 3px' }}>
              <i className="fa-solid fa-pen-to-square" style={{ fontSize:9.5 }} />
            </button>
            <button onClick={() => onRemoveCalc(c)} title="Delete" style={{ background:'transparent', border:'none', cursor:'pointer', color:'rgba(163,163,163,0.8)', padding:'2px 3px' }}>
              <i className="fa-solid fa-xmark" style={{ fontSize:10 }} />
            </button>
          </div>
        ))}
        {!cust.length && (
          <button onClick={() => onNewCalc()} style={{
            width:'100%', textAlign:'left', padding:'7px 8px', borderRadius:7, cursor:'pointer',
            background:'transparent', border:'1px dashed ' + TS_LINE, color:TS_MUTE,
            fontFamily:'Inter', fontSize:11, lineHeight:1.4,
          }}>
            Build a field from this source&rsquo;s columns and a function.
          </button>
        )}
      </div>
    </div>
  );
}

/* ---- shelves ------------------------------------------------------------ */
function TSPill({ ds, item, onRemove, onAgg, showAgg, aggTag, calcs, onSelect, selected }) {
  const [open, setOpen] = React.useState(false);
  const calc = (calcs || []).find(c => c.name === item.k);
  const rel = dmFieldRef(ds, item.k);
  const f = (rel && rel.ref ? { ...rel, label:rel.refLabel } : dmField(ds, item.k))
    || (calc ? { label:calc.name, fmt:calc.fmt || 'num', calc:true } : { label:item.k, fmt:'num' });
  const pillTitle = rel && rel.ref ? rel.refLabel : f.label;
  const agg = item.agg || f.agg || 'sum';
  const aggLabel = (DM_AGGS.find(a => a.id === agg) || DM_AGGS[0]).label;
  return (
    <div style={{ position:'relative', display:'inline-flex', alignItems:'center', gap:0, marginRight:6, marginBottom:6 }}>
      <div style={{
        display:'inline-flex', alignItems:'center', gap:7, height:27, padding:'0 4px 0 10px',
        background: selected ? 'rgba(5,122,85,0.3)' : 'rgba(5,122,85,0.16)',
        border:'1px solid ' + (selected ? 'rgb(16,185,129)' : 'rgba(16,185,129,0.45)'),
        borderRadius:7, fontFamily:'Inter', fontSize:11.5, fontWeight:600, color:TS_INK, maxWidth:230,
      }}>
        {aggTag && !item.expr && (
          <span onClick={onSelect} title="Edit in the formula bar"
            style={{ background:'rgba(0,0,0,0.22)', borderRadius:4, color:'rgba(110,231,183,0.9)',
              fontFamily:'Inter', fontSize:9, fontWeight:700, letterSpacing:'0.04em', textTransform:'uppercase',
              padding:'2px 5px', cursor:'pointer' }}>
            {(DM_AGGS.find(a => a.id === (item.agg || 'sum')) || DM_AGGS[0]).label}
          </span>
        )}
        {showAgg && (
          <button onClick={() => setOpen(o => !o)} style={{
            background:'rgba(0,0,0,0.22)', border:'none', borderRadius:4, cursor:'pointer',
            color:'rgb(110,231,183)', fontFamily:'Inter', fontSize:9.5, fontWeight:700,
            letterSpacing:'0.04em', textTransform:'uppercase', padding:'2px 5px',
          }}>{aggLabel}</button>
        )}
        {rel && rel.ref && <i className="fa-solid fa-link" style={{ fontSize:8, color:'rgba(110,231,183,0.8)', flexShrink:0 }} />}
        <span title={item.expr ? item.expr + ' \u00b7 click to edit' : onSelect ? pillTitle + ' \u00b7 click to edit the formula' : pillTitle}
          onClick={onSelect} style={{ whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
            cursor: onSelect ? 'text' : 'default' }}>
          {item.expr ? dmFormulaLabel(ds, item.expr, dmCompileValue(ds, item.expr)) : f.label}
        </span>
        <button onClick={onRemove} style={{ background:'transparent', border:'none', cursor:'pointer', color:'rgba(229,231,235,0.6)', padding:'2px 4px' }}>
          <i className="fa-solid fa-xmark" style={{ fontSize:9.5 }} />
        </button>
      </div>
      {open && (
        <div style={{ position:'absolute', top:31, left:0, zIndex:20, background:'rgb(17,24,39)', border:'1px solid ' + TS_LINE,
          borderRadius:8, padding:4, minWidth:150, boxShadow:'0 16px 34px -10px rgba(0,0,0,0.7)' }}>
          {DM_AGGS.map(a => (
            <button key={a.id} onClick={() => { onAgg(a.id); setOpen(false); }} style={{
              width:'100%', textAlign:'left', padding:'6px 9px', borderRadius:5, border:'none', cursor:'pointer',
              background: a.id === agg ? 'rgba(5,122,85,0.22)' : 'transparent',
              color:'rgb(229,231,235)', fontFamily:'Inter', fontSize:11.5, fontWeight: a.id === agg ? 600 : 500,
            }}>{a.label}</button>
          ))}
        </div>
      )}
    </div>
  );
}

function TSShelf({ label, hint, children, onDrop, accepts, empty }) {
  const [over, setOver] = React.useState(false);
  return (
    <div style={{ marginBottom:14 }}>
      <TSLabel hint={hint}>{label}</TSLabel>
      <div
        onDragOver={(e) => { if (e.dataTransfer.types.includes('text/ts-field')) { e.preventDefault(); setOver(true); } }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); const k = e.dataTransfer.getData('text/ts-field'); if (k) onDrop(k); }}
        style={{
          minHeight:38, borderRadius:9, padding:'7px 8px 1px',
          background: over ? 'rgba(5,122,85,0.14)' : 'rgba(255,255,255,0.025)',
          border:'1px ' + (over ? 'solid rgb(16,185,129)' : 'dashed rgba(75,85,99,0.75)'),
          display:'flex', flexWrap:'wrap', alignItems:'flex-start',
        }}>
        {children}
        {empty && (
          <span style={{ fontFamily:'Inter', fontSize:11, color:'rgba(163,163,163,0.65)', padding:'4px 2px 8px' }}>
            {accepts}
          </span>
        )}
      </div>
    </div>
  );
}

const tsHexOf = (c) => {
  const m = /rgb\((\d+),\s*(\d+),\s*(\d+)\)/.exec(String(c));
  if (!m) return String(c)[0] === '#' ? String(c) : '#057a55';
  return '#' + [m[1], m[2], m[3]].map(n => Number(n).toString(16).padStart(2, '0')).join('');
};

/* the Visual rail: visual types you click or drag onto the canvas */
function TSVizPalette({ value, onPick, types }) {
  return (
    <div style={{ width:88, flexShrink:0, borderRight:'1px solid ' + TS_LINE, overflowY:'auto', padding:'12px 8px 16px' }}>
      <TSLabel>Visual</TSLabel>
      <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
        {types.map(t => {
          const on = value === t.id;
          return (
            <div key={t.id} draggable
              onDragStart={(e) => { e.dataTransfer.setData('text/ts-viz', t.id); e.dataTransfer.effectAllowed = 'copy'; }}
              onClick={() => onPick(t.id)}
              title={t.label + ' \u2014 click, or drag onto the canvas'}
              style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, padding:'8px 4px',
                borderRadius:9, cursor:'grab',
                background: on ? 'rgba(5,122,85,0.24)' : 'rgba(255,255,255,0.02)',
                border:'1px solid ' + (on ? 'rgb(16,185,129)' : 'rgba(75,85,99,0.5)') }}>
              <i className={'fa-solid fa-' + t.icon} style={{ fontSize:13, color: on ? 'rgb(110,231,183)' : TS_MUTE }} />
              <span style={{ fontFamily:'Inter', fontSize:9.5, fontWeight:600, color: on ? TS_INK : TS_MUTE }}>{t.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* header control: the data source, with the same explanations as the setup step */
function TSSourceDropdown({ ds, onPick }) {
  const [open, setOpen] = React.useState(false);
  const cur = DM_DATASETS[ds] || {};
  return (
    <div style={{ position:'relative' }}>
      <button onClick={() => setOpen(o => !o)} title="Data source"
        style={{ height:30, padding:'0 10px', borderRadius:8, cursor:'pointer', background:TS_SURF,
          border:'1px solid ' + TS_LINE, color:TS_INK, fontFamily:'Inter', fontSize:12, fontWeight:600,
          display:'inline-flex', alignItems:'center', gap:7, maxWidth:220 }}>
        <i className={'fa-solid fa-' + (cur.icon || 'database')} style={{ fontSize:10, color:'rgb(110,231,183)' }} />
        <span style={{ whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{cur.label || ds}</span>
        <i className="fa-solid fa-chevron-down" style={{ fontSize:8, color:TS_MUTE }} />
      </button>
      {open && (
        <div style={{ position:'absolute', top:34, left:0, zIndex:60, width:320, maxHeight:420, overflowY:'auto',
          background:'rgb(17,24,39)', border:'1px solid ' + TS_LINE, borderRadius:10, padding:5,
          boxShadow:'0 16px 34px -10px rgba(0,0,0,0.7)' }}>
          {DM_SOURCE_IDS.map(id => {
            const d = DM_DATASETS[id];
            const on = id === ds;
            return (
              <button key={id} onClick={() => { setOpen(false); onPick(id); }}
                style={{ width:'100%', textAlign:'left', display:'flex', gap:9, padding:'9px 10px',
                  borderRadius:7, border:'none', cursor:'pointer',
                  background: on ? 'rgba(5,122,85,0.18)' : 'transparent' }}>
                <i className={'fa-solid fa-' + d.icon} style={{ fontSize:11, marginTop:2, flexShrink:0,
                  color: on ? 'rgb(110,231,183)' : TS_MUTE }} />
                <span style={{ minWidth:0 }}>
                  <span style={{ display:'block', fontFamily:'Inter', fontSize:12, fontWeight:600,
                    color: on ? TS_INK : 'rgb(209,213,219)' }}>{d.label}
                    {on && <i className="fa-solid fa-check" style={{ fontSize:9, marginLeft:7, color:'rgb(16,185,129)' }} />}
                  </span>
                  <span style={{ display:'block', fontFamily:'Inter', fontSize:10.5, color:TS_MUTE,
                    marginTop:2, lineHeight:1.45 }}>{d.desc}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* header control: who should see this tile */
function TSAudiencePick({ value, onChange }) {
  const [open, setOpen] = React.useState(false);
  const ALL = ['Sales Rep', 'Sales Manager', 'National Accounts', 'Marketing'];
  return (
    <div style={{ position:'relative' }}>
      <button onClick={() => setOpen(o => !o)} title="Who should see this tile"
        style={{ height:30, padding:'0 10px', borderRadius:8, cursor:'pointer', background:TS_SURF,
          border:'1px solid ' + TS_LINE, color:TS_INK, fontFamily:'Inter', fontSize:11.5, fontWeight:600,
          display:'inline-flex', alignItems:'center', gap:7, maxWidth:230 }}>
        <i className="fa-solid fa-users" style={{ fontSize:10, color:'rgb(110,231,183)' }} />
        <span style={{ whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{value.length ? value.join(', ') : 'Audience'}</span>
        <i className="fa-solid fa-chevron-down" style={{ fontSize:8, color:TS_MUTE }} />
      </button>
      {open && (
        <div style={{ position:'absolute', top:34, left:0, zIndex:60, background:'rgb(17,24,39)', border:'1px solid ' + TS_LINE,
          borderRadius:9, padding:5, minWidth:190, boxShadow:'0 16px 34px -10px rgba(0,0,0,0.7)' }}>
          {ALL.map(a => {
            const on = value.includes(a);
            return (
              <button key={a} onClick={() => onChange(on ? value.filter(x => x !== a) : [...value, a])}
                style={{ width:'100%', textAlign:'left', display:'flex', alignItems:'center', gap:8, padding:'7px 9px',
                  borderRadius:6, border:'none', cursor:'pointer', background:'transparent',
                  color: on ? TS_INK : TS_MUTE, fontFamily:'Inter', fontSize:11.5, fontWeight:600 }}>
                <i className={'fa-solid ' + (on ? 'fa-square-check' : 'fa-square')} style={{ fontSize:11, color: on ? 'rgb(16,185,129)' : 'rgba(107,114,128,0.7)' }} />
                {a}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* the blank canvas walks the user through building */
function TSStepGuide({ hasRows, hasValues, placed }) {
  const steps = placed ? [
    { t:'Group your data', d:'Drag a dimension \u2014 Firm, Category, Quarter \u2014 into this box, or click one in the field list.', done:hasRows },
    { t:'Add a value', d:'Drag a measure \u2014 Mkt Opp, Your AUM, a count \u2014 to aggregate for each group. Then drag the section\u2019s edges to size it.', done:hasValues },
  ] : [
    { t:'Choose a visual', d:'Click a type in the \u201cVisual\u201d rail on the left \u2014 or drag one onto this canvas \u2014 and the tile is created.', done:false },
    { t:'Group your data', d:'Drag a dimension \u2014 Firm, Category, Quarter \u2014 into the tile, or just click it.', done:hasRows },
    { t:'Add a value', d:'Drag a measure \u2014 Mkt Opp, Your AUM, a count \u2014 to aggregate for each group.', done:hasValues },
  ];
  return (
    <div style={{ flex:1, minHeight:0, display:'flex', flexDirection:'column', alignItems:'center', gap:18, padding:24, overflowY:'auto' }}>
      <div style={{ marginTop:'auto' }} />
      {steps.map((s, i) => (
        <div key={i} style={{ display:'flex', gap:14, width:'min(420px, 100%)', opacity: s.done ? 0.55 : 1 }}>
          <span style={{ width:28, height:28, borderRadius:9999, flexShrink:0, display:'inline-flex', alignItems:'center', justifyContent:'center',
            background: s.done ? 'rgb(5,122,85)' : 'rgba(255,255,255,0.05)',
            border:'1px solid ' + (s.done ? 'rgb(16,185,129)' : 'rgba(75,85,99,0.8)'),
            fontFamily:'Inter', fontSize:12, fontWeight:700, color: s.done ? '#fff' : 'rgb(156,163,175)' }}>
            {s.done ? <i className="fa-solid fa-check" style={{ fontSize:10 }} /> : i + 1}
          </span>
          <div>
            <div style={{ fontFamily:'Inter', fontSize:13, fontWeight:600, color:'rgb(229,231,235)' }}>{s.t}</div>
            <div style={{ fontFamily:'Inter', fontSize:11.5, color:'rgb(156,163,175)', marginTop:3, lineHeight:1.5 }}>{s.d}</div>
          </div>
        </div>
      ))}
      <div style={{ marginBottom:'auto' }} />
    </div>
  );
}

/* ---- visual type picker ------------------------------------------------
   A row of icons rather than a dropdown: every option is one click away and the
   current one is obvious at a glance. */
function TSVizPicker({ value, onChange, types }) {
  const [hov, setHov] = React.useState(null);
  return (
    <div style={{ display:'flex', gap:3, flexWrap:'wrap' }}>
      {types.map(t => {
        const on = t.id === value, hot = hov === t.id;
        return (
          <button key={t.id} onClick={() => onChange(t.id)} title={t.label}
            className={'ts-pick' + (on ? ' on' : '')}
            onMouseEnter={() => setHov(t.id)} onMouseLeave={() => setHov(null)} style={{
            position:'relative', width:30, height:30, borderRadius:7, cursor:'pointer', padding:0,
            background: on ? 'rgba(5,122,85,0.28)' : TS_SURF,
            border:'1px solid ' + (on ? 'rgb(16,185,129)' : TS_LINE),
            color: on ? 'rgb(110,231,183)' : TS_MUTE,
            display:'inline-flex', alignItems:'center', justifyContent:'center',
          }}>
            <i className={`fa-solid fa-${t.icon}`} style={{ fontSize:12 }} />
            {hot && <TSTip>{t.label}</TSTip>}
          </button>
        );
      })}
    </div>
  );
}

/* a small label that appears under a hovered control */
function TSTip({ children }) {
  return (
    <span style={{
      position:'absolute', top:'calc(100% + 6px)', left:'50%', transform:'translateX(-50%)',
      zIndex:60, pointerEvents:'none', whiteSpace:'nowrap',
      background:'rgb(17,24,39)', border:'1px solid ' + TS_LINE, borderRadius:6,
      padding:'3px 8px', fontFamily:'Inter', fontSize:10.5, fontWeight:600, color:TS_INK,
      boxShadow:'0 10px 22px -8px rgba(0,0,0,0.75)',
    }}>{children}</span>
  );
}

/* ---- layout picker: chart alone, or the table on any side of it -------- */
function TSLayoutPicker({ side, sideDir, sideFlip, onChange }) {
  /* the solid block is the chart, the dashed one the table */
  const R = (x, y, w, h, c, dashed) => (
    <rect x={x} y={y} width={w} height={h} rx="2"
      fill={dashed ? 'none' : c.fill} stroke={c.stroke} strokeDasharray={dashed ? '2 1.6' : undefined} />
  );
  const opts = [
    { id:'none',   title:'Chart only',        dir:'',       glyph:(c) => R(2, 2, 24, 14, c) },
    { id:'right',  title:'Table on the right',dir:'right',  glyph:(c) => (<g>{R(2, 2, 13, 14, c)}{R(16, 2, 10, 14, c, true)}</g>) },
    { id:'left',   title:'Table on the left', dir:'left',   glyph:(c) => (<g>{R(2, 2, 10, 14, c, true)}{R(13, 2, 13, 14, c)}</g>) },
    { id:'bottom', title:'Table below',       dir:'bottom', glyph:(c) => (<g>{R(2, 2, 24, 8, c)}{R(2, 11, 24, 5, c, true)}</g>) },
    { id:'top',    title:'Table above',       dir:'top',    glyph:(c) => (<g>{R(2, 2, 24, 5, c, true)}{R(2, 8, 24, 8, c)}</g>) },
  ];
  /* older tiles stored the side as a boolean flip */
  const current = !side ? 'none' : (sideDir || (sideFlip ? 'left' : 'right'));
  return (
    <div style={{ display:'flex', alignItems:'center', gap:7, minWidth:0 }}>
      <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
        {opts.map(o => {
          const on = current === o.id;
          const c = {
            fill: on ? 'rgba(16,185,129,0.35)' : 'rgba(163,163,163,0.22)',
            stroke: on ? 'rgb(110,231,183)' : 'rgb(140,145,155)',
          };
          return (
            <button key={o.id} onClick={() => onChange({ side: o.dir ? 'table' : '', sideDir:o.dir, sideFlip: o.dir === 'left' })}
              title={o.title} className={'ts-pick' + (on ? ' on' : '')} style={{
              position:'relative', width:40, height:30, borderRadius:7, cursor:'pointer', padding:0,
              background: on ? 'rgba(5,122,85,0.26)' : TS_SURF,
              border:'1px solid ' + (on ? 'rgb(16,185,129)' : TS_LINE),
              display:'inline-flex', alignItems:'center', justifyContent:'center',
            }}>
              <svg width="28" height="18" viewBox="0 0 28 18" strokeWidth="1.3">{o.glyph(c)}</svg>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---- KPI strip shelf --------------------------------------------------- */
/* ---- KPI strip shelf ----------------------------------------------------
   Each figure is its own one-number query, so a strip can mix scopes: total
   Inflows beside Inflows narrowed to deposits. The scope is a single dropdown
   listing every dimension value in the dataset, grouped by column. */
function TSKpiRow({ ds, kpi, onChange, onRemove }) {
  const rf = dmFieldRef(ds, kpi.k);
  const f = (rf && rf.ref ? { ...rf, label:rf.refLabel } : dmField(ds, kpi.k)) || { label:kpi.k };
  const [openAgg, setOpenAgg] = React.useState(false);
  const sel = { background:TS_SURF, border:'1px solid ' + TS_LINE, borderRadius:6, color:TS_INK,
    fontFamily:'Inter', fontSize:11, padding:'4px 6px', outline:'none', appearance:'none', minWidth:0 };

  /* one option per distinct value, grouped under its column, so picking
     "Transaction Type \u203a Deposit" needs no operator or typing */
  const groups = React.useMemo(() => {
    const rows = dmRows(ds);
    return dmFields(ds)
      .filter(x => x.type === 'dim' || x.type === 'geo')
      .map(x => {
        const vals = [...new Set(rows.map(r => r[x.k]))]
          .filter(v => v != null && v !== '' && v !== '\u2014')
          .sort((p, r) => String(p).localeCompare(String(r)));
        return { field:x, vals: vals.length > 1 && vals.length <= 60 ? vals : [] };
      })
      .filter(g => g.vals.length);
  }, [ds]);

  /* the strip stores filters; the dropdown edits the first one. A time-like
     dimension also offers "latest", which resolves from the data at render time
     rather than pinning the figure to a month someone typed. */
  const LATEST = '\u0000latest';
  const cur = (kpi.filters || [])[0];
  const curKey = cur ? cur.k + '\u241f' + (cur.op === 'latest' ? LATEST : cur.v) : '';
  const pick = (key) => {
    if (!key) { onChange({ ...kpi, filters: [] }); return; }
    const [k, v] = key.split('\u241f');
    onChange({ ...kpi, filters: [v === LATEST ? { k, op:'latest' } : { k, op:'is', v }] });
  };

  return (
    <div style={{ display:'grid', gridTemplateColumns:'minmax(0,1fr) auto', gap:5, alignItems:'center',
      background:'rgba(5,122,85,0.1)', border:'1px solid rgba(16,185,129,0.4)', borderRadius:8, padding:'6px 7px', marginBottom:5 }}>
      <input value={kpi.label || ''} onChange={(e) => onChange({ ...kpi, label:e.target.value })} placeholder={f.label}
        style={{ ...sel, background:'rgba(0,0,0,0.22)', fontWeight:600, fontSize:11.5 }} />
      <div style={{ position:'relative', display:'flex', alignItems:'center', gap:4 }}>
        <button onClick={() => setOpenAgg(o => !o)} title={f.label}
          style={{ background:'rgba(0,0,0,0.28)', border:'none', borderRadius:4, cursor:'pointer',
          color:'rgb(110,231,183)', fontFamily:'Inter', fontSize:9, fontWeight:700, letterSpacing:'0.04em', textTransform:'uppercase', padding:'3px 5px' }}>
          {(DM_AGGS.find(a => a.id === (kpi.agg || 'sum')) || DM_AGGS[0]).label}
        </button>
        <button onClick={onRemove} style={{ background:'transparent', border:'none', cursor:'pointer', color:'rgba(229,231,235,0.6)', padding:'2px 3px', lineHeight:0 }}>
          <i className="fa-solid fa-xmark" style={{ fontSize:9 }} />
        </button>
        {openAgg && (
          <div style={{ position:'absolute', top:24, right:0, zIndex:30, background:'rgb(17,24,39)', border:'1px solid ' + TS_LINE,
            borderRadius:8, padding:4, minWidth:140, boxShadow:'0 14px 30px -10px rgba(0,0,0,0.7)' }}>
            {DM_AGGS.map(a => (
              <button key={a.id} onClick={() => { onChange({ ...kpi, agg:a.id }); setOpenAgg(false); }} style={{
                width:'100%', textAlign:'left', padding:'5px 8px', borderRadius:5, border:'none', cursor:'pointer',
                background: a.id === (kpi.agg || 'sum') ? 'rgba(5,122,85,0.22)' : 'transparent',
                color:'rgb(229,231,235)', fontFamily:'Inter', fontSize:11,
              }}>{a.label}</button>
            ))}
          </div>
        )}
      </div>
      <select value={curKey} onChange={(e) => pick(e.target.value)}
        title="Narrow this figure to part of the data"
        style={{ ...sel, gridColumn:'1/-1', background:'rgba(0,0,0,0.22)', fontSize:10.5 }}>
        <option value="" style={{ background:'rgb(17,24,39)' }}>Whole tile</option>
        {groups.map(g => (
          <optgroup key={g.field.k} label={g.field.label} style={{ background:'rgb(17,24,39)' }}>
            {['date', 'month', 'quarter', 'year', 'period'].includes(g.field.k) && (
              <option value={g.field.k + '\u241f' + LATEST} style={{ background:'rgb(17,24,39)' }}>
                {g.field.label + ' \u203a latest (' + dmLatestOf(ds, g.field.k) + ')'}
              </option>
            )}
            {g.vals.map(v => (
              <option key={String(v)} value={g.field.k + '\u241f' + v} style={{ background:'rgb(17,24,39)' }}>
                {g.field.label + ' \u203a ' + String(v)}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
}

/* ---- filter editor ------------------------------------------------------ */
function TSFilterRow({ ds, filter, onChange, onRemove }) {
  const rel = dmFieldRef(ds, filter.k);
  const f = rel || {};
  const src = rel && rel.ref ? rel.ref.ds : ds;
  const col = rel && rel.ref ? rel.ref.k : filter.k;
  const kind = f.type === 'num' ? 'num' : f.type === 'date' ? 'date' : 'dim';
  const ops = DM_FILTER_OPS[kind];
  const options = React.useMemo(() => kind === 'dim'
    ? [...new Set(dmRows(src).map(r => r[col]))].filter(v => v != null && v !== '').sort().slice(0, 60)
    : null, [src, col, kind]);
  const sel = { background:TS_SURF, border:'1px solid ' + TS_LINE, borderRadius:6, color:TS_INK, fontFamily:'Inter', fontSize:11.5, padding:'5px 7px', outline:'none', appearance:'none' };
  return (
    <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:6, flexWrap:'wrap' }}>
      <span title={rel && rel.ref ? rel.refLabel : f.label}
        style={{ fontFamily:'Inter', fontSize:11.5, fontWeight:600, color:TS_INK, minWidth:0, display:'inline-flex', alignItems:'center', gap:5 }}>
        {rel && rel.ref && <i className="fa-solid fa-link" style={{ fontSize:8, color:'rgba(110,231,183,0.8)' }} />}
        {(rel && rel.ref ? rel.refLabel : f.label) || filter.k}
      </span>
      <select value={filter.op} onChange={(e) => onChange({ ...filter, op:e.target.value })} style={sel}>
        {ops.map(o => <option key={o.id} value={o.id} style={{ background:'rgb(17,24,39)' }}>{o.label}</option>)}
      </select>
      {filter.op === 'latest'
        ? <span style={{ fontFamily:'Inter', fontSize:11.5, color:'rgb(110,231,183)' }}>{String(dmLatestOf(src, col))}</span>
        : options
        ? <select value={filter.v} onChange={(e) => onChange({ ...filter, v:e.target.value })} style={{ ...sel, maxWidth:150 }}>
            {options.map(o => <option key={String(o)} value={o} style={{ background:'rgb(17,24,39)' }}>{String(o)}</option>)}
          </select>
        : <input value={filter.v} onChange={(e) => onChange({ ...filter, v:e.target.value })} style={{ ...sel, width:96 }} />}
      <button onClick={onRemove} style={{ background:'transparent', border:'none', cursor:'pointer', color:'rgba(229,231,235,0.55)' }}>
        <i className="fa-solid fa-xmark" style={{ fontSize:10 }} />
      </button>
    </div>
  );
}

/* A field dropped on the KPI strip becomes another figure in it. Dimensions
   can't be a KPI, so they fall through to the body. */
function tsDropOnKpi(cfg, k) {
  const f = dmFieldRef(cfg.ds, k)
    || ((cfg.calcs || []).find(c => c.name === k) ? { k, type:'num', agg:'sum' } : null);
  if (!f) return {};
  if (f.type !== 'num') return tsDropOnBody(cfg, k);
  return { kpis:[...(cfg.kpis || []), { k, agg:f.agg || 'sum', label:f.label || k }] };
}

/* A field dropped on the plot itself: a measure is plotted, a dimension groups
   the plot — or becomes the column split when a grouping already exists. */
function tsDropOnBody(cfg, k) {
  const calc = (cfg.calcs || []).find(c => c.name === k);
  const f = dmFieldRef(cfg.ds, k)
    || (calc ? { k, label:calc.name, type: calc.fmt === 'text' ? 'dim' : 'num', fmt:calc.fmt } : null);
  if (!f) return {};
  if (f.type === 'num') return { values:[...(cfg.values || []), { k, agg:f.agg || 'sum' }] };
  const rows = cfg.rows || [];
  if (!rows.length) return { rows:[k] };
  if (rows.includes(k) || (cfg.cols || []).includes(k)) return {};
  if (!(cfg.cols || []).length) return { cols:[k] };
  return { rows:[...rows, k] };
}

/* Adds a measure — local or from a connected source — as a table column. */
function TSAddColumn({ ds, taken, onAdd }) {
  const [open, setOpen] = React.useState(false);
  const [at, setAt] = React.useState(null);
  const ref = React.useRef(null);
  const popRef = React.useRef(null);
  const W = 210, MAXH = 260;

  /* place the panel against the button, kept inside the viewport */
  const place = React.useCallback(() => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const left = Math.min(Math.max(8, r.right - W), window.innerWidth - W - 8);
    const above = r.top - 6 - MAXH >= 8;
    setAt({ left, top: above ? r.top - 6 : r.bottom + 6, above });
  }, []);

  React.useEffect(() => {
    if (!open) return;
    place();
    const onDoc = (e) => {
      if (ref.current && ref.current.contains(e.target)) return;
      if (popRef.current && popRef.current.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open, place]);

  const groups = React.useMemo(() => {
    const local = dmFields(ds).filter(f => f.type === 'num' && !taken.includes(f.k));
    const rel = dmRelated(ds).map(r => ({
      label:r.label,
      fields: dmFields(r.id)
        .filter(f => f.type === 'num' && !/_count$/.test(f.k) && !taken.includes(r.id + '.' + f.k))
        .map(f => ({ ...f, k: r.id + '.' + f.k })),
    })).filter(g => g.fields.length);
    return [{ label: dmDataset(ds).label, fields: local }, ...rel].filter(g => g.fields.length);
  }, [ds, taken.join('|')]);

  return (
    <div ref={ref} style={{ position:'relative', display:'inline-flex' }}>
      <button onClick={() => setOpen(o => !o)} title="Add a column"
        style={{ height:24, padding:'0 8px', borderRadius:6, cursor:'pointer',
          background:'transparent', border:'1px dashed ' + TS_LINE, color:'rgb(110,231,183)',
          fontFamily:'Inter', fontSize:10.5, fontWeight:600, display:'inline-flex', alignItems:'center', gap:5 }}>
        <i className="fa-solid fa-plus" style={{ fontSize:8.5 }} /> Column
      </button>
      {open && at && ReactDOM.createPortal(
        <div ref={popRef} style={{ position:'fixed', left:at.left, top:at.top, zIndex:260,
          width:W, maxHeight:MAXH, overflow:'auto',
          transform: at.above ? 'translateY(-100%)' : 'none',
          background:'rgb(17,24,39)', border:'1px solid ' + TS_LINE, borderRadius:9, padding:4,
          boxShadow:'0 18px 40px -12px rgba(0,0,0,0.75)' }}>
          {groups.map(g => (
            <div key={g.label}>
              <div style={{ fontFamily:'Inter', fontSize:9, fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase',
                color:TS_MUTE, padding:'6px 8px 3px' }}>{g.label}</div>
              {g.fields.map(f => (
                <button key={f.k} onClick={() => { onAdd(f); setOpen(false); }} style={{
                  width:'100%', textAlign:'left', padding:'5px 8px', borderRadius:5, border:'none', cursor:'pointer',
                  background:'transparent', color:'rgb(229,231,235)', fontFamily:'Inter', fontSize:11.5,
                  display:'flex', alignItems:'center', gap:7,
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                  <i className="fa-solid fa-hash" style={{ fontSize:8.5, color:'rgb(94,214,164)' }} />
                  <span style={{ flex:1, minWidth:0, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{f.label}</span>
                </button>
              ))}
            </div>
          ))}
          {!groups.length && (
            <div style={{ fontFamily:'Inter', fontSize:11, color:TS_MUTE, padding:'8px 9px' }}>Every measure is already a column.</div>
          )}
        </div>, document.body)}
    </div>
  );
}

function TSFormulaBar({ ds, value, onChange, onClose }) {
  const [text, setText] = React.useState(() => dmFormulaOf(ds, value));
  const [dirty, setDirty] = React.useState(false);
  const [focus, setFocus] = React.useState(false);
  React.useEffect(() => { setText(dmFormulaOf(ds, value)); setDirty(false); }, [value.k, value.expr, value.agg, ds]);

  const check = React.useMemo(() => dmCompileValue(ds, text), [ds, text]);
  const commit = () => {
    if (!check.ok) return;
    onChange({ ...value, expr:text, agg:check.agg });
    setDirty(false);
  };
  const setFmt = (fmt) => onChange({ ...value, fmt });
  const setDec = (d) => onChange({ ...value, decimals:d });

  const fmt = value.fmt || (dmFieldRef(ds, value.k) || {}).fmt || 'num';
  const setAgg = (agg) => {
    const inner = dmSplitFormula(text).inner;
    const next = dmAggName(agg) + '(' + inner + ')';
    setText(next);
    const c = dmCompileValue(ds, next);
    if (c.ok) { onChange({ ...value, expr:next, agg:c.agg }); setDirty(false); }
  };
  const btn = (on) => ({
    height:24, minWidth:26, padding:'0 7px', borderRadius:5, cursor:'pointer',
    background: on ? 'rgba(5,122,85,0.28)' : 'transparent',
    border:'1px solid ' + (on ? 'rgb(16,185,129)' : TS_LINE),
    color: on ? TS_INK : TS_MUTE, fontFamily:'Inter', fontSize:11, fontWeight:600,
  });
  const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace';

  return (
    <div style={{ display:'flex', alignItems:'center', flexWrap:'wrap', gap:6, rowGap:7, padding:'7px 10px',
      borderRadius:9, minWidth:0, overflow:'hidden',
      background:'rgba(255,255,255,0.04)', border:'1px solid ' + (check.ok ? TS_LINE : 'rgba(248,113,113,0.7)') }}>
      <select value={check.ok ? check.agg : (value.agg || 'sum')} onChange={(e) => setAgg(e.target.value)}
        title="Aggregation"
        style={{ height:24, flexShrink:0, background:'rgba(0,0,0,0.24)', border:'1px solid ' + TS_LINE,
          borderRadius:5, color:'rgb(110,231,183)', fontFamily:'Inter', fontSize:10.5, fontWeight:700,
          padding:'0 4px', outline:'none', appearance:'none', cursor:'pointer' }}>
        {DM_VALUE_AGGS.map(a => <option key={a.id} value={a.id} style={{ background:'rgb(17,24,39)' }}>{a.name}</option>)}
      </select>
      <button onClick={() => setFmt('usd')} title="Currency" style={btn(fmt === 'usd')}>$</button>
      <button onClick={() => setFmt('pct')} title="Percent" style={btn(fmt === 'pct')}>%</button>
      <button onClick={() => setDec(1)} title="One decimal place" style={btn(value.decimals === 1)}>.0</button>
      <button onClick={() => setDec(2)} title="Two decimal places" style={btn(value.decimals === 2)}>.00</button>
      <button onClick={() => { setFmt('num'); setDec(null); }} title="Plain number" style={btn(fmt === 'num' && value.decimals == null)}>123</button>
      <button onClick={onClose} title="Close" style={{ marginLeft:'auto', background:'transparent', border:'none',
        cursor:'pointer', color:TS_MUTE, padding:'2px 3px', lineHeight:0 }}>
        <i className="fa-solid fa-xmark" style={{ fontSize:10 }} />
      </button>
      <span title="Formula" style={{ flex:'1 1 100%', display:'flex', alignItems:'center', gap:5,
        fontFamily:'Inter', fontSize:9, fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase', color:TS_MUTE }}>
        <span style={{ fontFamily:'Georgia, serif', fontStyle:'italic', fontSize:12, textTransform:'none', letterSpacing:0, color:'rgb(110,231,183)' }}>fx</span>
        Formula
      </span>
      <input value={text} spellCheck={false} placeholder="Sum([Market Value])" className="mono-field"
        onChange={(e) => { setText(e.target.value); setDirty(true); }}
        onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') onClose(); }}
        onFocus={() => setFocus(true)}
        onBlur={() => { setFocus(false); commit(); }}
        style={{ flex:'1 1 100%', minWidth:0, width:'100%', boxSizing:'border-box',
          background:'rgba(0,0,0,0.45)', borderRadius:6, padding:'6px 8px',
          border:'1px solid ' + (!check.ok ? 'rgba(248,113,113,0.8)' : focus ? 'rgb(16,185,129)' : 'rgba(75,85,99,0.85)'),
          outline:'none', color: check.ok ? TS_INK : 'rgb(248,113,113)', fontFamily:mono, fontSize:12 }} />
      <div style={{ flex:'1 1 100%', display:'flex', alignItems:'center', gap:6, minWidth:0 }}>
        <span title={check.ok ? 'Press Enter to apply' : check.error}
          style={{ flex:1, minWidth:0, fontFamily:'Inter', fontSize:10.5, lineHeight:1.35,
            color: check.ok ? 'rgba(163,163,163,0.85)' : 'rgb(248,113,113)',
            overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {check.ok ? 'Fields in [brackets] \u00b7 Enter to apply' : check.error}
        </span>
        {dirty && check.ok && <button onClick={commit} style={{ ...tsBtn('primary'), height:22, fontSize:10.5, flexShrink:0 }}>Apply</button>}
      </div>
    </div>
  );
}

/* ---- editable tile title ------------------------------------------------
   Styled as a heading but obviously editable: a pencil and a hover well, so
   nobody has to discover it by clicking. */
function TSTitleInput({ value, onChange }) {
  const [hot, setHot] = React.useState(false);
  const [focus, setFocus] = React.useState(false);
  const lit = hot || focus;
  return (
    <div onMouseEnter={() => setHot(true)} onMouseLeave={() => setHot(false)}
      style={{ display:'flex', alignItems:'center', gap:8, flex:1, minWidth:0,
        padding:'3px 9px', borderRadius:8,
        background: lit ? 'rgba(255,255,255,0.06)' : 'transparent',
        border:'1px solid ' + (focus ? 'rgb(16,185,129)' : lit ? TS_LINE : 'transparent'),
        transition:'background 120ms, border-color 120ms' }}>
      <input value={value} onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        placeholder="Untitled tile" title="Tile title"
        style={{ background:'transparent', border:'none', outline:'none', color:TS_INK,
          fontFamily:'Inter', fontSize:16, fontWeight:600, letterSpacing:'-0.01em', flex:1, minWidth:0 }} />
      <i className="fa-solid fa-pen-to-square"
        style={{ fontSize:10.5, color: lit ? 'rgb(110,231,183)' : 'rgba(163,163,163,0.75)' }} />
    </div>
  );
}

/* ---- custom field editor ------------------------------------------------
   A custom field is an expression over the dataset's own columns. It becomes a
   field like any other, so it can be grouped by, aggregated, or filtered on. */
function TSCalcDialog({ ds, initial, onAdd, onClose }) {
  const fields = dmFields(ds);
  const [name, setName] = React.useState(initial ? initial.name : '');
  const [expr, setExpr] = React.useState(initial ? (initial.expr || '') : '');
  const [fmt, setFmt] = React.useState(initial ? (initial.fmt || 'num') : 'num');
  const [tab, setTab] = React.useState('fn');
  const [q, setQ] = React.useState('');
  const ref = React.useRef(null);

  /* insert at the caret so clicking a function continues the expression */
  const insert = (text) => {
    const el = ref.current;
    const at = el ? el.selectionStart : expr.length;
    const next = expr.slice(0, at) + text + expr.slice(el ? el.selectionEnd : expr.length);
    setExpr(next);
    requestAnimationFrame(() => { if (el) { el.focus(); const c = at + text.length; el.setSelectionRange(c, c); } });
  };

  /* validate and preview against real rows as the user types */
  const check = React.useMemo(() => {
    if (!expr.trim()) return { state:'empty' };
    const c = dmCompile(expr, ds);
    if (!c.ok) return { state:'error', message:c.error };
    const sample = dmRows(ds).slice(0, 3).map(r => { try { return c.run(r); } catch (e) { return null; } });
    return { state:'ok', sample };
  }, [expr, ds]);

  const fnList = DM_FUNCTIONS.filter(f => !q ||
    (f.name + ' ' + f.desc + ' ' + f.group).toLowerCase().includes(q.toLowerCase()));
  const fieldList = fields.filter(f => !q || f.label.toLowerCase().includes(q.toLowerCase()));

  const sel = { background:TS_SURF, border:'1px solid ' + TS_LINE, borderRadius:7, color:TS_INK,
    fontFamily:'Inter', fontSize:12, padding:'7px 9px', outline:'none', width:'100%', boxSizing:'border-box' };
  const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace';

  return ReactDOM.createPortal(
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.62)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width:'min(880px,100%)', height:'min(560px,100%)', background:'rgb(17,24,39)',
        border:'1px solid ' + TS_LINE, borderRadius:14, display:'flex', flexDirection:'column',
        overflow:'hidden', boxShadow:'0 30px 70px -20px rgba(0,0,0,0.8)',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'13px 16px', borderBottom:'1px solid ' + TS_LINE }}>
          <i className="fa-solid fa-calculator" style={{ fontSize:12, color:'rgb(110,231,183)' }} />
          <span style={{ fontFamily:'Inter', fontSize:14.5, fontWeight:600, color:TS_INK }}>
            {initial ? 'Edit custom field' : 'New custom field'}
          </span>
          <span style={{ fontFamily:'Inter', fontSize:11, color:TS_MUTE }}>{dmDataset(ds).label}</span>
        </div>

        <div style={{ flex:1, minHeight:0, display:'flex' }}>
          {/* editor */}
          <div style={{ flex:1, minWidth:0, display:'flex', flexDirection:'column', gap:12, padding:'14px 16px' }}>
            <div>
              <TSLabel>Field name</TSLabel>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Net of Fees" style={sel} />
            </div>
            <div style={{ flex:1, minHeight:0, display:'flex', flexDirection:'column' }}>
              <TSLabel hint="fields go in [brackets]">Expression</TSLabel>
              <textarea ref={ref} value={expr} onChange={(e) => setExpr(e.target.value)} spellCheck={false} className="mono-field"
                placeholder="[market_value] - [cost_basis]"
                style={{ ...sel, flex:1, minHeight:96, resize:'none', fontFamily:mono, fontSize:12.5, lineHeight:1.6,
                  borderColor: check.state === 'error' ? 'rgba(248,113,113,0.7)' : TS_LINE }} />
            </div>
            <div style={{ minHeight:34, fontFamily:'Inter', fontSize:11, lineHeight:1.5 }}>
              {check.state === 'error' && (
                <span style={{ color:'rgb(248,113,113)' }}>
                  <i className="fa-solid fa-triangle-alert" style={{ fontSize:10, marginRight:6 }} />{check.message}
                </span>
              )}
              {check.state === 'ok' && (
                <span style={{ color:TS_MUTE }}>
                  <i className="fa-solid fa-check" style={{ fontSize:10, marginRight:6, color:'rgb(16,185,129)' }} />
                  First rows: <span style={{ fontFamily:mono, color:'rgb(209,213,219)' }}>
                    {check.sample.map(v => dmFmt(v, fmt)).join('  \u00b7  ')}
                  </span>
                </span>
              )}
              {check.state === 'empty' && <span style={{ color:'rgba(163,163,163,0.75)' }}>Evaluated per row, then aggregated with the rest of the query.</span>}
            </div>
            <div>
              <TSLabel>Format</TSLabel>
              <div style={{ display:'flex', gap:6 }}>
                {[['usd', 'Currency'], ['pct', 'Percent'], ['num', 'Number'], ['text', 'Text']].map(([id, lb]) => (
                  <button key={id} onClick={() => setFmt(id)} style={{ ...tsBtn(fmt === id ? 'primary' : ''), height:27, fontSize:11.5 }}>{lb}</button>
                ))}
              </div>
            </div>
          </div>

          {/* reference */}
          <div style={{ width:330, flexShrink:0, borderLeft:'1px solid ' + TS_LINE, display:'flex', flexDirection:'column', minHeight:0 }}>
            <div style={{ display:'flex', gap:4, padding:'10px 12px 8px' }}>
              {[['fn', 'Functions'], ['field', 'Fields']].map(([id, lb]) => (
                <button key={id} onClick={() => setTab(id)} style={{
                  height:26, padding:'0 11px', borderRadius:6, cursor:'pointer',
                  background: tab === id ? 'rgba(5,122,85,0.26)' : TS_SURF,
                  border:'1px solid ' + (tab === id ? 'rgb(16,185,129)' : TS_LINE),
                  color: tab === id ? TS_INK : TS_MUTE, fontFamily:'Inter', fontSize:11.5, fontWeight:600,
                }}>{lb}</button>
              ))}
            </div>
            <div style={{ padding:'0 12px 8px' }}>
              <input value={q} onChange={(e) => setQ(e.target.value)}
                placeholder={tab === 'fn' ? 'Search functions\u2026' : 'Search fields\u2026'} style={{ ...sel, fontSize:11.5, padding:'6px 9px' }} />
            </div>
            <div style={{ flex:1, minHeight:0, overflow:'auto', padding:'0 8px 12px' }}>
              {tab === 'fn' ? fnList.map(f => (
                <button key={f.name} onClick={() => insert(f.name + '(')} title={'Insert ' + f.name}
                  style={{ width:'100%', textAlign:'left', padding:'8px 9px', borderRadius:7, cursor:'pointer',
                    background:'transparent', border:'1px solid transparent', display:'block' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                  <div style={{ fontFamily:mono, fontSize:11.5, color:'rgb(229,231,235)' }}>{f.sig}</div>
                  <div style={{ fontFamily:'Inter', fontSize:10.5, color:TS_MUTE, marginTop:3, lineHeight:1.4 }}>{f.desc}</div>
                  <div style={{ fontFamily:mono, fontSize:10.5, color:'rgba(110,231,183,0.85)', marginTop:3 }}>{f.example}</div>
                </button>
              )) : fieldList.map(f => (
                <button key={f.k} onClick={() => insert('[' + f.k + ']')}
                  style={{ width:'100%', textAlign:'left', padding:'6px 9px', borderRadius:6, cursor:'pointer',
                    background:'transparent', border:'none', display:'flex', alignItems:'center', gap:8 }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                  <i className={`fa-solid fa-${f.type === 'num' ? 'hash' : 'font'}`}
                    style={{ fontSize:9.5, width:11, color: f.type === 'num' ? 'rgb(94,214,164)' : 'rgb(120,160,230)' }} />
                  <span style={{ fontFamily:'Inter', fontSize:11.5, color:'rgb(229,231,235)', flex:1, minWidth:0, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{f.label}</span>
                  <span style={{ fontFamily:mono, fontSize:10, color:'rgba(163,163,163,0.8)' }}>[{f.k}]</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display:'flex', gap:8, justifyContent:'flex-end', padding:'12px 16px', borderTop:'1px solid ' + TS_LINE }}>
          <button onClick={onClose} style={tsBtn()}>Cancel</button>
          <button disabled={check.state !== 'ok' || !name.trim()}
            onClick={() => { onAdd({ name:name.trim(), expr, fmt }); onClose(); }}
            style={{ ...tsBtn('primary'), opacity: (check.state === 'ok' && name.trim()) ? 1 : 0.5 }}>
            {initial ? 'Save field' : 'Add field'}
          </button>
        </div>
      </div>
    </div>, document.body);
}

/* ---- the studio --------------------------------------------------------- */
function TileStudio({ open, initial, onClose, onSave, lockScope, saveLabel, scopeLabel }) {
  const [cfg, setCfg] = React.useState(() => (initial && initial.id) ? initial : taParsePrompt('Your AUM by firm'));
  const [mode, setMode] = React.useState('visual'); // visual | grid | data
  const [calcOpen, setCalcOpen] = React.useState(null);
  const [selVal, setSelVal] = React.useState(null);

  const [sec, setSec] = React.useState(0);
  const [inspect, setInspect] = React.useState(true);
  const [sizeTip, setSizeTip] = React.useState(null);
  const [hovBox, setHovBox] = React.useState(null);
  const tsContRef = React.useRef(null);

  /* a brand-new tile opens on a setup step: title, data source, audience */
  const [intro, setIntro] = React.useState(false);
  const [introDs, setIntroDs] = React.useState('market_share');
  const [introTitle, setIntroTitle] = React.useState('');
  const [introAud, setIntroAud] = React.useState(['Sales Manager']);

  React.useEffect(() => {
    if (!open) return;
    /* a new tile starts blank; the canvas walks the user through the steps */
    setCfg((initial && initial.id) ? initial : {
      id:'t' + Date.now(), title:'New Tile', ds:'market_share', viz:null,
      rows:[], cols:[], values:[], filters:[], calcs:[], kpis:[], limit:0, span:4,
      audiences:['Sales Manager'],
    });
    setMode('visual'); setSelVal(null); setSec((initial && initial.id) ? 0 : -1);
    setIntro(!(initial && initial.id)); setIntroDs('market_share'); setIntroTitle(''); setIntroAud(['Firm']);
  }, [open, initial]);

  const set = (patch) => setCfg(c => ({ ...c, ...patch }));
  /* stacked sections: tab 0 edits the tile's own query, tab n edits cfg.sections[n-1] */
  const sections = cfg.sections || [];
  const secIdx = sec > sections.length ? -1 : sec;
  const view = secIdx <= 0 ? cfg : sections[secIdx - 1];
  const setView = (patch) => secIdx <= 0 ? set(patch)
    : set({ sections: sections.map((s, i) => (i === secIdx - 1 ? { ...s, ...patch } : s)) });
  const ds = view.ds;

  const scopeFilters = React.useMemo(() => {
    if (!lockScope) return [];
    const k = lockScope.kind === 'client' ? 'client' : 'household';
    return dmFields(ds).some(f => f.k === k) ? [{ k, op:'is', v:lockScope.value }] : [];
  }, [lockScope, ds]);

  const q = React.useMemo(() => {
    try { return dmRunQuery({ ...cfg, filters:[...(cfg.filters || []), ...scopeFilters] }); } catch (e) { return null; }
  }, [JSON.stringify(cfg), JSON.stringify(scopeFilters)]);

  /* the query of whatever the shelves are editing right now */
  const qView = React.useMemo(() => {
    if (secIdx === 0) return q;
    try { return dmRunQuery(view); } catch (e) { return null; }
  }, [secIdx, q, JSON.stringify(view)]);

  const addField = (f) => {
    /* once a strip exists, a clicked measure joins it rather than replacing the plot */
    if (f.type === 'num' && (view.kpis || []).length) { setView(tsDropOnKpi({ ...view, ds }, f.k)); return; }
    if (f.type === 'num') setView({ values:[...(view.values || []), { k:f.k, agg:f.agg || 'sum' }] });
    else if ((view.rows || []).length && !(view.cols || []).length && (view.viz === 'pivot' || view.viz === 'heatmap' || view.viz === 'stacked')) setView({ cols:[f.k] });
    else setView({ rows:[...new Set([...(view.rows || []), f.k])] });
  };
  const calcOf = (k) => (cfg.calcs || []).find(c => c.name === k);
  const fieldOf = (k) => {
    const f = dmFieldRef(ds, k);
    if (f) return f;
    const c = calcOf(k);
    return c ? { k, label:c.name, type: c.fmt === 'text' ? 'dim' : 'num', fmt:c.fmt || 'num', calc:true } : null;
  };
  const dropTo = (shelf) => (k) => {
    const f = fieldOf(k); if (!f) return;
    if (shelf === 'values') setView({ values:[...(view.values || []), { k, agg:f.agg || 'sum' }] });
    if (shelf === 'rows')   setView({ rows:[...new Set([...(view.rows || []), k])] });
    if (shelf === 'cols')   setView({ cols:[k] });
    if (shelf === 'filters') {
      const kind = f.type === 'num' ? 'num' : f.type === 'date' ? 'date' : 'dim';
      const fsrc = f.ref ? f.ref.ds : ds, fcol = f.ref ? f.ref.k : k;
      const first = kind === 'dim'
        ? ([...new Set(dmRows(fsrc).map(r => r[fcol]))].filter(v => v != null && v !== '').sort()[0] ?? '')
        : 0;
      setView({ filters:[...(view.filters || []), { k, op:DM_FILTER_OPS[kind][0].id, v:first }] });
    }
  };

  /* switching the source resets the fields it feeds, so ask first */
  const changeDs = (id, e) => {
    if (id === ds) return;
    const dirty = (view.rows || []).length || (view.values || []).length || (view.kpis || []).length || (view.filters || []).length;
    if (dirty && !window.confirm('Changing the data source resets ' + (secIdx <= 0 ? 'this tile' : 'this section') + '\u2019s fields and filters. Continue?')) {
      /* snap the controlled select back \u2014 state did not change, so React will not */
      if (e && e.target) e.target.value = ds;
      return;
    }
    setView({ ds:id, rows:[], cols:[], values:[], filters:[], kpis:[], calcs:[], sideHidden:null, sort:null });
    setSelVal(null);
  };

  /* drag a box edge: x snaps its 12-col width inside the tile, y sets its pixel height */
  const tsResizeBox = (idx, dir) => (e) => {
    e.preventDefault(); e.stopPropagation();
    const frame = e.currentTarget.parentElement;
    const row = frame.parentElement;
    const frameTop = frame.getBoundingClientRect().top;
    const NAME = { 3:'\u00bc', 4:'\u2153', 6:'\u00bd', 8:'\u2154', 12:'Full' };
    const move = (ev) => {
      let w = null, h = null;
      if (dir !== 'y') {
        const r = row.getBoundingClientRect();
        const left = frame.getBoundingClientRect().left;
        const frac = Math.min(1, Math.max(0.15, (ev.clientX - left) / Math.max(r.width, 1)));
        const spans = [3, 4, 6, 8, 12];
        w = spans.reduce((a, b) => (Math.abs(b / 12 - frac) < Math.abs(a / 12 - frac) ? b : a), 3);
      }
      if (dir !== 'x') h = Math.round(Math.min(720, Math.max(120, ev.clientY - frameTop)));
      setSizeTip([w != null ? NAME[w] + ' wide' : null, h != null ? h + 'px tall' : null].filter(Boolean).join(' \u00b7 '));
      setCfg(c => {
        if (idx === 0) return { ...c, mainW: w != null ? w : (c.mainW || 12), mainH: h != null ? h : (c.mainH || 300) };
        return { ...c, sections:(c.sections || []).map((s, j) => (j === idx - 1
          ? { ...s, w: w != null ? w : (s.w || 12), h: h != null ? h : (s.h || 220) } : s)) };
      });
    };
    const up = () => { setSizeTip(null); window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  /* drag the tile card's edges: x snaps the dashboard span, y sets tile height */
  const tsResizeTile = (dir) => (e) => {
    e.preventDefault(); e.stopPropagation();
    const cont = tsContRef.current; if (!cont) return;
    const frame = e.currentTarget.parentElement;
    const frameTop = frame.getBoundingClientRect().top;
    const NAME = { 3:'\u00bc', 4:'\u2153', 6:'\u00bd', 8:'\u2154', 12:'Full' };
    const move = (ev) => {
      let w = null, h = null;
      if (dir !== 'y') {
        const r = cont.getBoundingClientRect();
        const centerX = r.left + r.width / 2;
        const frac = Math.min(1, Math.max(0.15, ((ev.clientX - centerX) * 2) / Math.max(r.width, 1)));
        const spans = [3, 4, 6, 8, 12];
        w = spans.reduce((a, b) => (Math.abs(b / 12 - frac) < Math.abs(a / 12 - frac) ? b : a), 3);
      }
      if (dir !== 'x') h = Math.round(Math.min(900, Math.max(180, ev.clientY - frameTop)));
      setSizeTip([w != null ? NAME[w] + ' wide' : null, h != null ? h + 'px tall' : null].filter(Boolean).join(' \u00b7 '));
      setCfg(c => ({ ...c, span: w != null ? w : c.span, h: h != null ? h : (c.h || 380) }));
    };
    const up = () => { setSizeTip(null); window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  /* reorder any box (main or a section) to a new position in the flow */
  const moveBoxTok = (tok, toFlow) => {
    setCfg(c => {
      const secs = [...(c.sections || [])];
      let mp = Math.min(c.mainPos == null ? 0 : c.mainPos, secs.length);
      if (tok === 'main') return { ...c, mainPos: Math.max(0, Math.min(toFlow, secs.length)) };
      const i = Number(tok);
      if (!(i >= 0 && i < secs.length)) return c;
      const [x] = secs.splice(i, 1);
      const fromFlow = i + (i >= mp ? 1 : 0);
      if (fromFlow < mp) mp--;
      const t = Math.max(0, Math.min(toFlow, secs.length + 1));
      if (t <= mp) { mp++; secs.splice(t, 0, x); }
      else { secs.splice(t - 1, 0, x); }
      return { ...c, sections:secs, mainPos:mp };
    });
    setSec(0);
  };

  if (!open) return null;

  if (intro) {
    const startBuild = () => {
      setCfg(c => ({ ...c, ds:introDs, title: introTitle.trim() || 'New Tile',
        audiences: introAud.length ? introAud : ['Sales Manager'] }));
      setIntro(false);
    };
    const secLbl = { fontFamily:'Inter', fontSize:11, fontWeight:700, letterSpacing:'0.05em',
      textTransform:'uppercase', color:TS_MUTE, margin:'20px 0 8px' };
    const inputStyle = { width:'100%', boxSizing:'border-box', background:TS_SURF, border:'1px solid ' + TS_LINE,
      borderRadius:9, color:TS_INK, fontFamily:'Inter', fontSize:13.5, padding:'10px 12px', outline:'none' };
    return ReactDOM.createPortal(
      <div style={{ position:'fixed', inset:0, background:'rgba(10,14,22,0.82)', zIndex:150,
        display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
        <div style={{ width:'min(940px,100%)', maxHeight:'100%', overflowY:'auto', background:'rgb(24,32,45)',
          border:'1px solid rgb(75,85,99)', borderRadius:16, padding:'26px 28px', boxSizing:'border-box' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <i className="fa-solid fa-table-columns" style={{ fontSize:14, color:'rgb(16,185,129)' }} />
            <div style={{ fontFamily:'Inter', fontSize:17, fontWeight:600, color:TS_INK, letterSpacing:'-0.01em' }}>New tile</div>
          </div>
          <div style={{ fontFamily:'Inter', fontSize:12.5, color:TS_MUTE, marginTop:5, lineHeight:1.5 }}>
            Name it, pick its data and its audience — all three stay editable in the builder header.
          </div>
          <div style={secLbl}>Tile title</div>
          <input value={introTitle} autoFocus placeholder="e.g. Your AUM by Firm"
            onChange={(e) => setIntroTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') startBuild(); }}
            style={inputStyle} />
          <div style={secLbl}>Data source</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(258px, 1fr))', gap:10 }}>
            {DM_SOURCE_IDS.map(id => {
              const d = DM_DATASETS[id];
              const on = introDs === id;
              return (
                <div key={id} onClick={() => setIntroDs(id)}
                  style={{ cursor:'pointer', borderRadius:12, padding:'13px 14px', boxSizing:'border-box',
                    background: on ? 'rgba(5,122,85,0.14)' : 'rgba(255,255,255,0.03)',
                    border:'1px solid ' + (on ? 'rgb(16,185,129)' : 'rgba(75,85,99,0.6)') }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ width:26, height:26, borderRadius:7, flexShrink:0, display:'inline-flex', alignItems:'center', justifyContent:'center',
                      background: on ? 'rgba(5,122,85,0.35)' : 'rgba(255,255,255,0.05)', border:'1px solid ' + (on ? 'rgba(16,185,129,0.6)' : TS_LINE) }}>
                      <i className={'fa-solid fa-' + d.icon} style={{ fontSize:11, color: on ? 'rgb(110,231,183)' : TS_MUTE }} />
                    </span>
                    <span style={{ fontFamily:'Inter', fontSize:13, fontWeight:600, color:TS_INK }}>{d.label}</span>
                    {on && <i className="fa-solid fa-circle-check" style={{ marginLeft:'auto', fontSize:12, color:'rgb(16,185,129)' }} />}
                  </div>
                  <div style={{ fontFamily:'Inter', fontSize:11.5, color:TS_MUTE, marginTop:8, lineHeight:1.5 }}>{d.desc}</div>
                </div>
              );
            })}
          </div>
          <div style={secLbl}>Who is this tile for?</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
            {['Sales Rep', 'Sales Manager', 'National Accounts', 'Marketing'].map(a => {
              const on = introAud.includes(a);
              return (
                <button key={a} onClick={() => setIntroAud(on ? introAud.filter(x => x !== a) : [...introAud, a])}
                  style={{ height:32, padding:'0 14px', borderRadius:9999, cursor:'pointer',
                    background: on ? 'rgba(5,122,85,0.26)' : 'rgba(255,255,255,0.03)',
                    border:'1px solid ' + (on ? 'rgb(16,185,129)' : 'rgba(75,85,99,0.6)'),
                    color: on ? TS_INK : TS_MUTE, fontFamily:'Inter', fontSize:12, fontWeight:600,
                    display:'inline-flex', alignItems:'center', gap:7 }}>
                  {on && <i className="fa-solid fa-check" style={{ fontSize:9, color:'rgb(110,231,183)' }} />}{a}
                </button>
              );
            })}
          </div>
          <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginTop:24 }}>
            <button onClick={onClose} style={tsBtn()}>Cancel</button>
            <button onClick={startBuild} style={tsBtn('primary')}>
              Start building <i className="fa-solid fa-arrow-right" style={{ fontSize:10 }} />
            </button>
          </div>
        </div>
      </div>, document.body);
  }

  const listable = !!dmDataset(ds).listMap;
  const vizAllowed = TV_TYPES.filter(t => t.id !== 'text' && (t.id !== 'list' || listable));

  return ReactDOM.createPortal(
    <div style={{ position:'fixed', inset:0, background:'rgb(17,24,39)', zIndex:150, display:'flex' }}>
      <div style={{
        flex:1, minWidth:0, background:'rgb(24,32,45)', display:'flex', flexDirection:'column', overflow:'hidden',
      }}>
        {/* header */}
        <div style={{ display:'flex', alignItems:'center', gap:12, padding:'13px 16px', borderBottom:'1px solid ' + TS_LINE }}>
          <i className="fa-solid fa-table-columns" style={{ fontSize:13, color:'rgb(16,185,129)' }} />
          <TSTitleInput value={cfg.title} onChange={(t) => set({ title:t })} />
          <TSSourceDropdown ds={ds} onPick={(id) => changeDs(id)} />
          <TSAudiencePick value={cfg.audiences || ['Sales Manager']} onChange={(a) => set({ audiences:a })} />
          {lockScope && (
            <span title={`Scoped to ${lockScope.value}`}
              style={{ display:'inline-flex', alignItems:'center', gap:6, height:26, padding:'0 10px', borderRadius:7,
              background:'rgba(5,122,85,0.18)', border:'1px solid rgba(16,185,129,0.45)',
              fontFamily:'Inter', fontSize:11.5, fontWeight:600, color:'rgb(110,231,183)' }}>
              <i className={`fa-solid fa-${lockScope.kind === 'client' ? 'user' : 'users'}`} style={{ fontSize:10 }} />
              {scopeLabel || lockScope.value}
            </span>
          )}
          <span style={{ fontFamily:'Inter', fontSize:11, color:TS_MUTE }}>
            {qView ? `${qView.matchedRows.toLocaleString()} source rows \u2192 ${qView.rowCount.toLocaleString()} groups` : ''}
          </span>
          <button onClick={onClose} style={tsBtn()}>Cancel</button>
          <button onClick={() => onSave({ ...cfg, viz: cfg.viz || 'column' })} style={tsBtn('primary')}>
            <i className="fa-solid fa-check" style={{ fontSize:11 }} /> {initial && initial.saved ? 'Save changes' : (saveLabel || 'Add to dashboard')}
          </button>
        </div>

        {/* body */}
        <div style={{ flex:1, minHeight:0, display:'flex', overflowX:'hidden' }}>
          <TSVizPalette value={view.viz} onPick={(id) => setView({ viz:id })} types={vizAllowed} />
          <TSFieldPanel ds={ds} onAddField={addField} calcs={cfg.calcs || []}
            onNewCalc={() => setCalcOpen({})}
            onEditCalc={(c) => setCalcOpen(c)}
            onRemoveCalc={(c) => set({
              calcs: cfg.calcs.filter(x => x.name !== c.name),
              values: cfg.values.filter(v => v.k !== c.name),
              rows: cfg.rows.filter(k => k !== c.name),
              cols: cfg.cols.filter(k => k !== c.name),
            })} />

          {/* preview */}
          <div style={{ flex:'1 1 340px', minWidth:260, display:'flex', flexDirection:'column', padding:'14px 16px', gap:12 }}>
            <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
              <span style={{ fontFamily:'Inter', fontSize:11.5, color:TS_MUTE }}>
                {'Drop a visual to add a section \u00b7 drag a section by its label to move it \u00b7 drag edges to resize \u00b7 click one to edit it'}
              </span>
              <div style={{ flex:1 }} />
              <div style={{ display:'inline-flex', background:TS_SURF, border:'1px solid ' + TS_LINE, borderRadius:7, overflow:'hidden' }}>
                {[['visual', 'Visual'], ['grid', 'Result grid'], ['data', 'Source rows']].map(([id, lb]) => (
                  <button key={id} onClick={() => setMode(id)} style={{
                    height:28, padding:'0 11px', border:'none', cursor:'pointer',
                    background: mode === id ? 'rgba(5,122,85,0.28)' : 'transparent',
                    color: mode === id ? TS_INK : TS_MUTE, fontFamily:'Inter', fontSize:11.5, fontWeight:600,
                  }}>{lb}</button>
                ))}
              </div>
            </div>

            <div style={{
              position:'relative', flex:1, minHeight:0,
              background: mode === 'visual' ? 'transparent' : 'rgba(255,255,255,0.03)',
              border: mode === 'visual' ? 'none' : '1px solid ' + TS_LINE,
              borderRadius:12, padding: mode === 'visual' ? 0 : 14, display:'flex', flexDirection:'column', overflow:'auto',
            }}>

              {mode === 'visual' && (
                <div ref={tsContRef}
                  onClick={() => { setSec(-1); setSelVal(null); }}
                  onDragOver={(e) => { if (e.dataTransfer.types.includes('text/ts-viz') || e.dataTransfer.types.includes('text/ts-field')) e.preventDefault(); }}
                  onDrop={(e) => {
                    if (e.defaultPrevented) return; /* an inner target already took it */
                    const vz = e.dataTransfer.getData('text/ts-viz');
                    if (vz) {
                      e.preventDefault();
                      if (!cfg.viz) { set({ viz:vz }); setSec(0); }
                      else {
                        set({ sections:[...sections, { label:'Section ' + (sections.length + 2), ds:cfg.ds, viz:vz,
                          rows:[], cols:[], values:[], filters:[], calcs:[], limit:0, w:12, h:220 }] });
                        setSec(sections.length + 1);
                      }
                      setSelVal(null);
                      return;
                    }
                    const k = e.dataTransfer.getData('text/ts-field');
                    if (k) { e.preventDefault(); const fld = fieldOf(k); if (fld) addField(fld); }
                  }}
                  style={{ flex:1, minHeight:0, overflow:'auto', position:'relative', padding:'8px 6px' }}>
                  {sizeTip && (
                    <span style={{ position:'absolute', top:4, right:10, zIndex:40, fontFamily:'Inter', fontSize:10, fontWeight:700,
                      background:'rgb(5,122,85)', color:'#fff', borderRadius:6, padding:'3px 8px', whiteSpace:'nowrap' }}>{sizeTip}</span>
                  )}
                  <div onClick={(e) => { e.stopPropagation(); setSec(-1); setSelVal(null); }}
                    style={{ width:'calc(' + Math.round(((cfg.span || 4) / 12) * 100) + '%)', minWidth:280, maxWidth:'100%',
                      height: cfg.h || 380, margin:'0 auto', position:'relative', boxSizing:'border-box',
                      border:'1px solid rgba(75,85,99,0.6)',
                      borderRadius:14, padding:'14px 14px 16px', background:'rgba(255,255,255,0.05)',
                      display:'flex', flexDirection:'column' }}>
                    <div style={{ flexShrink:0, marginBottom:10, fontFamily:'Inter', fontSize:14, fontWeight:600,
                      color:TS_INK, letterSpacing:'-0.01em' }}>{cfg.title}</div>
                    {!cfg.viz && !sections.length ? (
                      <TSStepGuide hasRows={(cfg.rows || []).length > 0} hasValues={(cfg.values || []).length > 0} placed={false} />
                    ) : (
                    <div style={{ flex:1, minHeight:0, overflowY:'auto', display:'flex', flexWrap:'wrap', gap:12,
                      alignItems:'flex-start', alignContent:'flex-start' }}>
                  {(() => {
                    const mainPos = Math.min(cfg.mainPos == null ? 0 : cfg.mainPos, sections.length);
                    const mainBox = !cfg.viz ? null : (
                      <div key="mainbox" onClick={(e) => { e.stopPropagation(); setSec(0); setSelVal(null); }}
                        onDragOver={(e) => { if (e.dataTransfer.types.includes('text/ts-box')) { e.preventDefault(); e.stopPropagation(); } }}
                        onDrop={(e) => { const mv = e.dataTransfer.getData('text/ts-box'); if (mv !== '') { e.preventDefault(); e.stopPropagation(); if (mv !== 'main') moveBoxTok(mv, mainPos); } }}
                        onMouseEnter={() => setHovBox('main')} onMouseLeave={() => setHovBox(h => (h === 'main' ? null : h))}
                        style={{ width:'calc(' + Math.round(((cfg.mainW || 12) / 12) * 100) + '% - 8px)', minWidth:200, maxWidth:'100%',
                          height: cfg.mainH || 300, flexShrink:0, position:'relative', boxSizing:'border-box',
                          border:'1px solid ' + (secIdx === 0 ? 'rgb(16,185,129)' : hovBox === 'main' ? 'rgba(16,185,129,0.5)' : 'transparent'),
                          boxShadow: secIdx === 0 ? '0 0 0 3px rgba(5,122,85,0.18)' : 'none',
                          borderRadius:12, padding:'8px 10px 12px', display:'flex', flexDirection:'column', cursor:'pointer',
                          background: secIdx === 0 ? 'rgba(0,0,0,0.28)' : 'transparent' }}>
                        {secIdx === 0 && (
                        <div draggable
                          onDragStart={(e) => { e.stopPropagation(); e.dataTransfer.setData('text/ts-box', 'main'); e.dataTransfer.effectAllowed = 'move'; }}
                          title="Drag to move this section"
                          style={{ display:'flex', alignItems:'center', gap:7, marginBottom:6, flexShrink:0, cursor:'grab' }}>
                          <i className="fa-solid fa-grip-vertical" style={{ fontSize:9, color:'rgba(107,114,128,0.8)' }} />
                          <span style={{ fontFamily:'Inter', fontSize:9.5, fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase', color:TS_MUTE }}>Section 1</span>
                          <span style={{ marginLeft:'auto', fontFamily:'Inter', fontSize:9, color:'rgba(163,163,163,0.6)' }}>{(DM_DATASETS[cfg.ds] || {}).label}</span>
                        </div>
                        )}
                        {!((cfg.values || []).length || (cfg.kpis || []).length)
                          ? <TSStepGuide hasRows={(cfg.rows || []).length > 0} hasValues={false} placed />
                          : (q && <TileViz cfg={{ ...cfg, sections:[], footer:null, footerLink:null }} q={q} height={0} editing
                              onDropKpi={(k) => set(tsDropOnKpi(cfg, k))}
                              onRemoveKpi={(i) => set({ kpis: cfg.kpis.filter((_, j) => j !== i) })}
                              onDropBody={(k) => set(tsDropOnBody(cfg, k))}
                              onDropValue={(k) => {
                                const f = dmField(cfg.ds, k);
                                if (f && f.type === 'num') set({ values:[...(cfg.values || []), { k, agg:f.agg || 'sum' }] });
                                else set(tsDropOnBody(cfg, k));
                              }}
                              onSplit={(s) => set({ sideSplit: s })} />)}
                        {secIdx === 0 && (
                          <React.Fragment>
                            <div onPointerDown={tsResizeBox(0, 'x')} title="Drag to set this section width" style={{ position:'absolute', top:0, right:-5, width:10, height:'100%', cursor:'ew-resize', zIndex:20 }} />
                            <div onPointerDown={tsResizeBox(0, 'y')} title="Drag to set this section height" style={{ position:'absolute', left:0, bottom:-5, width:'100%', height:10, cursor:'ns-resize', zIndex:20 }} />
                            <div onPointerDown={tsResizeBox(0, 'xy')} title="Drag to resize" style={{ position:'absolute', right:-2, bottom:-2, width:18, height:18, cursor:'nwse-resize', zIndex:21 }}>
                              <span style={{ position:'absolute', right:4, bottom:4, width:8, height:8,
                                borderRight:'2px solid rgba(148,163,184,0.8)', borderBottom:'2px solid rgba(148,163,184,0.8)', borderRadius:1 }} />
                            </div>
                          </React.Fragment>
                        )}
                      </div>
                    );
                    const boxes = sections.map((s, i) => {
                    let sq = null; try { sq = dmRunQuery(s); } catch (e2) {}
                    const sel = secIdx === i + 1;
                    return (
                      <div key={'sbox' + i}
                        onClick={(e) => { e.stopPropagation(); setSec(i + 1); setSelVal(null); }}
                        onDragOver={(e) => { if (e.dataTransfer.types.includes('text/ts-viz') || e.dataTransfer.types.includes('text/ts-field') || e.dataTransfer.types.includes('text/ts-box')) { e.preventDefault(); e.stopPropagation(); } }}
                        onDrop={(e) => {
                          e.preventDefault(); e.stopPropagation();
                          const mv = e.dataTransfer.getData('text/ts-box');
                          if (mv !== '') { moveBoxTok(mv, i + (i >= mainPos ? 1 : 0)); return; }
                          const vz = e.dataTransfer.getData('text/ts-viz');
                          if (vz) { set({ sections: sections.map((x, j) => (j === i ? { ...x, viz:vz } : x)) }); setSec(i + 1); return; }
                          const k = e.dataTransfer.getData('text/ts-field');
                          if (!k) return;
                          const fld = dmFieldRef(s.ds, k); if (!fld) return;
                          const patch = fld.type === 'num'
                            ? { values:[...(s.values || []), { k, agg:fld.agg || 'sum' }] }
                            : { rows:[...(s.rows || []), k] };
                          set({ sections: sections.map((x, j) => (j === i ? { ...x, ...patch } : x)) });
                          setSec(i + 1);
                        }}
                        onMouseEnter={() => setHovBox(i)} onMouseLeave={() => setHovBox(h => (h === i ? null : h))}
                        style={{ width:'calc(' + Math.round(((s.w || 12) / 12) * 100) + '% - 8px)', minWidth:180, maxWidth:'100%',
                          height: s.h || 220, flexShrink:0, position:'relative', boxSizing:'border-box',
                          border:'1px solid ' + (sel ? 'rgb(16,185,129)' : hovBox === i ? 'rgba(16,185,129,0.5)' : 'transparent'),
                          boxShadow: sel ? '0 0 0 3px rgba(5,122,85,0.18)' : 'none',
                          borderRadius:12, padding:'8px 10px 10px', display:'flex', flexDirection:'column', cursor:'pointer',
                          background: sel ? 'rgba(0,0,0,0.28)' : 'transparent' }}>
                        {sel ? (
                        <div draggable
                          onDragStart={(e) => { e.stopPropagation(); e.dataTransfer.setData('text/ts-box', String(i)); e.dataTransfer.effectAllowed = 'move'; }}
                          title="Drag to move this section"
                          style={{ display:'flex', alignItems:'center', gap:7, marginBottom:6, flexShrink:0, cursor:'grab' }}>
                          <i className="fa-solid fa-grip-vertical" style={{ fontSize:9, color:'rgba(107,114,128,0.8)' }} />
                          <span style={{ fontFamily:'Inter', fontSize:9.5, fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase', color:TS_MUTE }}>
                            {s.label || 'Section ' + (i + 2)}
                          </span>
                          <span style={{ marginLeft:'auto', fontFamily:'Inter', fontSize:9, color:'rgba(163,163,163,0.6)' }}>
                            {(DM_DATASETS[s.ds] || {}).label}
                          </span>
                        </div>
                        ) : null}
                        {(s.values || []).length
                          ? (sq && <TileViz cfg={s} q={sq} height={0} />)
                          : <TSStepGuide hasRows={(s.rows || []).length > 0} hasValues={false} placed />}
                        {sel && (
                          <React.Fragment>
                            <div onPointerDown={tsResizeBox(i + 1, 'x')} title="Drag to set this section width" style={{ position:'absolute', top:0, right:-5, width:10, height:'100%', cursor:'ew-resize', zIndex:20 }} />
                            <div onPointerDown={tsResizeBox(i + 1, 'y')} title="Drag to set this section height" style={{ position:'absolute', left:0, bottom:-5, width:'100%', height:10, cursor:'ns-resize', zIndex:20 }} />
                            <div onPointerDown={tsResizeBox(i + 1, 'xy')} title="Drag to resize" style={{ position:'absolute', right:-2, bottom:-2, width:18, height:18, cursor:'nwse-resize', zIndex:21 }}>
                              <span style={{ position:'absolute', right:4, bottom:4, width:8, height:8,
                                borderRight:'2px solid rgba(148,163,184,0.8)', borderBottom:'2px solid rgba(148,163,184,0.8)', borderRadius:1 }} />
                            </div>
                          </React.Fragment>
                        )}
                      </div>
                    );
                  });
                    if (mainBox) boxes.splice(mainPos, 0, mainBox);
                    return boxes;
                  })()}
                    </div>
                    )}
                    {(cfg.footer || cfg.footerLink) && (
                      <div style={{ flexShrink:0, display:'flex', alignItems:'center', gap:8, marginTop:10 }}>
                        <span style={{ fontFamily:'Inter', fontSize:10.5, color:TS_MUTE }}>{cfg.footer}</span>
                        {cfg.footerLink && (
                          <span style={{ marginLeft:'auto', fontFamily:'Inter', fontSize:11, fontWeight:600, color:'rgb(16,185,129)',
                            display:'inline-flex', alignItems:'center', gap:5, whiteSpace:'nowrap' }}>
                            {cfg.footerLink}<i className="fa-solid fa-chevron-right" style={{ fontSize:8 }} />
                          </span>
                        )}
                      </div>
                    )}
                    <div onPointerDown={tsResizeTile('x')} title="Drag to set the tile width" style={{ position:'absolute', top:0, right:-5, width:10, height:'100%', cursor:'ew-resize', zIndex:25 }} />
                    <div onPointerDown={tsResizeTile('y')} title="Drag to set the tile height" style={{ position:'absolute', left:0, bottom:-5, width:'100%', height:10, cursor:'ns-resize', zIndex:25 }} />
                    <div onPointerDown={tsResizeTile('xy')} title="Drag to resize the tile" style={{ position:'absolute', right:-2, bottom:-2, width:18, height:18, cursor:'nwse-resize', zIndex:26 }}>
                      <span style={{ position:'absolute', right:4, bottom:4, width:8, height:8,
                        borderRight:'2px solid rgba(148,163,184,0.8)', borderBottom:'2px solid rgba(148,163,184,0.8)', borderRadius:1 }} />
                    </div>
                  </div>
                </div>
              )}
              {mode === 'grid' && qView && <TVTable q={qView} dense />}
              {mode === 'data' && <TSSourceRows ds={ds} />}
            </div>
          </div>

          {/* shelves */}
          <div style={{ flex:'0 1 300px', minWidth:214, borderLeft:'1px solid ' + TS_LINE, overflow:'auto', padding:'14px 12px 20px' }}>
            {secIdx < 0 ? (
              <React.Fragment>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14, padding:'8px 10px',
                  borderRadius:9, border:'1px solid rgba(75,85,99,0.5)', background:'rgba(255,255,255,0.02)' }}>
                  <i className="fa-solid fa-table-cells-large" style={{ fontSize:11, color:'rgb(110,231,183)', flexShrink:0 }} />
                  <span style={{ fontFamily:'Inter', fontSize:11.5, fontWeight:600, color:TS_INK }}>Tile</span>
                  <span style={{ marginLeft:'auto', fontFamily:'Inter', fontSize:9.5, color:TS_MUTE, whiteSpace:'nowrap' }}>click a section to edit it</span>
                </div>
                <TSLabel>Tile width</TSLabel>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(5, minmax(0,1fr))', gap:5, marginBottom:16 }}>
                  {[[3, '\u00bc'], [4, '\u2153'], [6, '\u00bd'], [8, '\u2154'], [12, 'Full']].map(([sp, lb]) => (
                    <button key={sp} onClick={() => set({ span:sp })} title={sp + ' of 12 dashboard columns'} style={{
                      height:28, minWidth:0, padding:0, borderRadius:7, cursor:'pointer',
                      background: cfg.span === sp ? 'rgba(5,122,85,0.26)' : TS_SURF,
                      border:'1px solid ' + (cfg.span === sp ? 'rgb(16,185,129)' : TS_LINE),
                      color: cfg.span === sp ? TS_INK : TS_MUTE, fontFamily:'Inter', fontSize:11.5, fontWeight:600,
                    }}>{lb}</button>
                  ))}
                </div>
                <TSLabel>Tile height</TSLabel>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
                  <input type="number" min="180" max="900" step="10" value={cfg.h || 380}
                    onChange={(e) => set({ h:Number(e.target.value) })}
                    style={{ width:84, boxSizing:'border-box', background:TS_SURF, border:'1px solid ' + TS_LINE,
                      borderRadius:6, color:TS_INK, fontFamily:'Inter', fontSize:11.5, padding:'6px 8px', outline:'none' }} />
                  <span style={{ fontFamily:'Inter', fontSize:10.5, color:TS_MUTE }}>px</span>
                </div>
                <TSLabel>Footer</TSLabel>
                <input value={cfg.footer || ''} placeholder="e.g. As of Jun 8, 2026"
                  onChange={(e) => set({ footer:e.target.value })}
                  style={{ width:'100%', boxSizing:'border-box', background:TS_SURF, border:'1px solid ' + TS_LINE,
                    borderRadius:6, color:TS_INK, fontFamily:'Inter', fontSize:11.5, padding:'7px 9px', outline:'none', marginBottom:7 }} />
                <input value={cfg.footerLink || ''} placeholder="Link label, e.g. See more (optional)"
                  onChange={(e) => set({ footerLink:e.target.value })}
                  style={{ width:'100%', boxSizing:'border-box', background:TS_SURF, border:'1px solid ' + TS_LINE,
                    borderRadius:6, color:TS_INK, fontFamily:'Inter', fontSize:11.5, padding:'7px 9px', outline:'none', marginBottom:16 }} />
                <div style={{ fontFamily:'Inter', fontSize:10.5, color:TS_MUTE, lineHeight:1.6 }}>
                  Click a section to edit its data and looks, drag its edges to size it, or drop a visual from the left to add another section.
                </div>
              </React.Fragment>
            ) : (<React.Fragment>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12, padding:'8px 10px',
              borderRadius:9, border:'1px solid rgba(75,85,99,0.5)', background:'rgba(255,255,255,0.02)' }}>
              <i className={'fa-solid fa-' + (secIdx === 0 ? 'table-cells-large' : 'layer-group')} style={{ fontSize:11, color:'rgb(110,231,183)', flexShrink:0 }} />
              {secIdx === 0 ? (
                <span style={{ fontFamily:'Inter', fontSize:11.5, fontWeight:600, color:TS_INK, whiteSpace:'nowrap' }}>Section 1</span>
              ) : (
                <input value={view.label || ''} placeholder="Section label"
                  onChange={(e) => setView({ label:e.target.value })}
                  style={{ flex:1, minWidth:0, boxSizing:'border-box', background:'transparent', border:'none',
                    color:TS_INK, fontFamily:'Inter', fontSize:11.5, fontWeight:600, outline:'none' }} />
              )}
              <span style={{ marginLeft:'auto', fontFamily:'Inter', fontSize:9.5, color:TS_MUTE, whiteSpace:'nowrap' }}>
                {'section ' + (secIdx + 1)}
              </span>
              {secIdx === 0 && (
                <button onClick={() => { set({ viz:null, rows:[], cols:[], values:[], filters:[], kpis:[], mainW:12 }); setSec(sections.length ? 1 : -1); }}
                  title="Remove this section" style={{ height:24, width:24, flexShrink:0, borderRadius:6, cursor:'pointer',
                    background:'rgba(248,113,113,0.1)', border:'1px solid rgba(248,113,113,0.45)', color:'rgb(252,165,165)' }}>
                  <i className="fa-solid fa-trash-can" style={{ fontSize:9 }} />
                </button>
              )}
              {secIdx > 0 && (
                <button onClick={() => { set({ sections: sections.filter((_, i) => i !== secIdx - 1) }); setSec(0); }}
                  title="Remove this section" style={{ height:24, width:24, flexShrink:0, borderRadius:6, cursor:'pointer',
                    background:'rgba(248,113,113,0.1)', border:'1px solid rgba(248,113,113,0.45)', color:'rgb(252,165,165)' }}>
                  <i className="fa-solid fa-trash-can" style={{ fontSize:9 }} />
                </button>
              )}
            </div>

            {secIdx === 0 && (view.kpis || []).length > 0 && (
            <TSShelf label="KPI strip" hint="figures above the chart" accepts=""
              empty={false} onDrop={(k) => setView(tsDropOnKpi({ ...view, ds }, k))}>
              <div style={{ width:'100%' }}>
                {(view.kpis || []).map((kp, i) => (
                  <TSKpiRow key={kp.k + i} ds={ds} kpi={kp}
                    onChange={(next) => setView({ kpis: view.kpis.map((x, j) => j === i ? next : x) })}
                    onRemove={() => setView({ kpis: view.kpis.filter((_, j) => j !== i) })} />
                ))}
              </div>
            </TSShelf>
            )}

            <TSShelf label="Rows" hint="group by" accepts="Drag a dimension here" empty={!(view.rows || []).length} onDrop={dropTo('rows')}>
              {(view.rows || []).map(k => (
                <TSPill key={k} ds={ds} calcs={cfg.calcs} item={{ k }} onRemove={() => setView({ rows:(view.rows || []).filter(x => x !== k) })} />
              ))}
            </TSShelf>

            <TSShelf label="Columns" hint="pivot across" accepts="Optional — splits values into groups" empty={!(view.cols || []).length} onDrop={dropTo('cols')}>
              {(view.cols || []).map(k => (
                <TSPill key={k} ds={ds} calcs={cfg.calcs} item={{ k }} onRemove={() => setView({ cols:[] })} />
              ))}
            </TSShelf>

            <TSShelf label="Values" hint="aggregate" accepts="Drag a measure here" empty={false} onDrop={dropTo('values')}>
              {(view.values || []).map((v, i) => (
                <TSPill key={v.k + i} ds={ds} calcs={cfg.calcs} item={v} aggTag
                  selected={selVal === i} onSelect={() => setSelVal(selVal === i ? null : i)}
                  onAgg={(agg) => setView({ values: view.values.map((x, j) => j === i ? { ...x, agg, expr:null } : x) })}
                  onRemove={() => { setView({ values: view.values.filter((_, j) => j !== i) }); setSelVal(null); }} />
              ))}
              <button onClick={() => {
                  const vals = view.values || [];
                  const f0 = dmFields(ds).filter(x => x.type === 'num')[0];
                  setView({ values:[...vals, { k:'custom', agg:'sum', expr:'Sum([' + ((f0 && f0.label) || 'Value') + '])' }] });
                  setSelVal(vals.length);
                }}
                title="Add a formula value, e.g. Sum([Fees]) / Sum([AUM]) * 100"
                style={{ height:27, padding:'0 10px', marginRight:6, marginBottom:6, borderRadius:7, cursor:'pointer',
                  background:'transparent', border:'1px dashed rgba(75,85,99,0.9)', color:TS_MUTE,
                  fontFamily:'Inter', fontSize:10.5, fontWeight:600, whiteSpace:'nowrap' }}>+ Custom value</button>
            </TSShelf>

            {selVal != null && (view.values || [])[selVal] && (
              <div style={{ marginTop:-8, marginBottom:14 }}>
                <TSFormulaBar ds={ds} value={view.values[selVal]}
                  onChange={(v) => setView({ values: view.values.map((x, j) => j === selVal ? v : x) })}
                  onClose={() => setSelVal(null)} />
              </div>
            )}

            <TSShelf label="Filters" accepts="Drag any field here" empty={!(view.filters || []).length} onDrop={dropTo('filters')}>
              <div style={{ width:'100%' }}>
                {(view.filters || []).map((f, i) => (
                  <TSFilterRow key={f.k + i} ds={ds} filter={f}
                    onChange={(nf) => setView({ filters: view.filters.map((x, j) => j === i ? nf : x) })}
                    onRemove={() => setView({ filters: view.filters.filter((_, j) => j !== i) })} />
                ))}
              </div>
            </TSShelf>

            <TSLabel>Display</TSLabel>
            <div style={{ display:'grid', gridTemplateColumns:'64px minmax(0,1fr)', alignItems:'center', gap:'9px 8px' }}>
              <span style={{ fontFamily:'Inter', fontSize:11.5, color:TS_MUTE }}>Width</span>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(5, minmax(0,1fr))', gap:5, minWidth:0 }}>
                {[[3, '\u00bc'], [4, '\u2153'], [6, '\u00bd'], [8, '\u2154'], [12, 'Full']].map(([sp, lb]) => {
                  const cur = secIdx === 0 ? (cfg.mainW || 12) : (view.w || 12);
                  return (
                    <button key={sp} onClick={() => setView(secIdx === 0 ? { mainW:sp } : { w:sp })}
                      title={sp + ' of 12 \u2014 this section\u2019s share of the tile'} style={{
                      height:26, minWidth:0, padding:0, borderRadius:6, cursor:'pointer',
                      background: cur === sp ? 'rgba(5,122,85,0.26)' : TS_SURF,
                      border:'1px solid ' + (cur === sp ? 'rgb(16,185,129)' : TS_LINE),
                      color: cur === sp ? TS_INK : TS_MUTE, fontFamily:'Inter', fontSize:11, fontWeight:600,
                    }}>{lb}</button>
                  );
                })}
              </div>
              {/* 4. the companion breakdown table, explained */}
              {!['table', 'pivot', 'kpi', 'list', 'text', 'cards'].includes(view.viz) && (
                <React.Fragment>
                  <span title="A companion table of the chart's exact values" style={{ fontFamily:'Inter', fontSize:11.5, color:TS_MUTE, alignSelf:'start', paddingTop:6 }}>Breakdown</span>
                  <div style={{ minWidth:0 }}>
                    <TSLayoutPicker side={view.side} sideDir={view.sideDir} sideFlip={view.sideFlip}
                      onChange={(patch) => setView(patch)} />
                    <div style={{ fontFamily:'Inter', fontSize:10, color:'rgba(163,163,163,0.75)', marginTop:4, lineHeight:1.45 }}>
                      {'Shows the chart\u2019s values as a table beside it \u2014 left, right, top or bottom \u2014 or chart only.'}
                    </div>
                  </div>
                </React.Fragment>
              )}
              {view.side === 'table' && !['table', 'pivot', 'kpi', 'list', 'text', 'cards'].includes(view.viz) && qView && (
                <React.Fragment>
                  <span style={{ fontFamily:'Inter', fontSize:11.5, color:TS_MUTE }}>Columns</span>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:4, minWidth:0 }}>
                    {[...qView.valueCols.map(c => ({ key:c.key, label:(c.groupLabel && qView.colKey) ? c.groupLabel : (c.valueLabel || c.label) })),
                      ...(qView.valueCols.length === 1 ? [{ key:'share', label:'Share' }] : [])].map(c => {
                      const hidden = (view.sideHidden || []).includes(c.key);
                      const shownVals = qView.valueCols.filter(x => !(view.sideHidden || []).includes(x.key)).length;
                      const last = !hidden && c.key !== 'share' && shownVals <= 1;
                      return (
                        <button key={c.key} disabled={last}
                          title={last ? 'A table needs at least one column' : (hidden ? 'Show ' : 'Hide ') + c.label}
                          onClick={last ? undefined : () => setView({ sideHidden: hidden
                            ? (view.sideHidden || []).filter(x => x !== c.key)
                            : [...(view.sideHidden || []), c.key] })}
                          style={{ height:24, padding:'0 8px', borderRadius:6, cursor:'pointer', maxWidth:'100%',
                            background: hidden ? 'transparent' : 'rgba(5,122,85,0.24)',
                            border:'1px solid ' + (hidden ? TS_LINE : 'rgb(16,185,129)'),
                            color: hidden ? TS_MUTE : TS_INK, fontFamily:'Inter', fontSize:10.5, fontWeight:600,
                            opacity: last ? 0.6 : 1, cursor: last ? 'not-allowed' : 'pointer',
                            display:'inline-flex', alignItems:'center', gap:5, minWidth:0 }}>
                          <i className={`fa-solid fa-${hidden ? 'eye-slash' : 'check'}`} style={{ fontSize:8.5, flexShrink:0 }} />
                          <span style={{ minWidth:0, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{c.label}</span>
                        </button>
                      );
                    })}
                    <TSAddColumn ds={ds} taken={(view.values || []).map(v => v.k)}
                      onAdd={(f) => setView({ values:[...(view.values || []), { k:f.k, agg:f.agg || 'sum' }] })} />
                  </div>
                  <span style={{ fontFamily:'Inter', fontSize:11.5, color:TS_MUTE }}>Split</span>
                  <div style={{ display:'flex', alignItems:'center', gap:8, minWidth:0 }}>
                    <input type="range" min="18" max="72" step="1"
                      value={Math.round((view.sideSplit || 0.42) * 100)}
                      onChange={(e) => setView({ sideSplit: Number(e.target.value) / 100 })}
                      style={{ flex:1, minWidth:0, accentColor:'rgb(16,185,129)' }} />
                    <button onClick={() => setView({ sideSplit:null })} title="Fit to content"
                      style={{ background:'transparent', border:'none', cursor:'pointer', color:TS_MUTE,
                        fontFamily:'Inter', fontSize:10, fontWeight:600, whiteSpace:'nowrap' }}>
                      {view.sideSplit ? Math.round(view.sideSplit * 100) + '%' : 'Auto'}
                    </button>
                  </div>
                </React.Fragment>
              )}
              {view.viz === 'cards' && (
                <React.Fragment>
                  <span style={{ fontFamily:'Inter', fontSize:11.5, color:TS_MUTE }}>Card shows</span>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:5, minWidth:0 }}>
                    {[['cardShare', 'Share bar'], ['cardAccent', 'Accent stripe'], ['cardTrend', 'Stat arrows']].map(([k2, lb]) => {
                      const on = view[k2] !== false;
                      return (
                        <button key={k2} onClick={() => setView({ [k2]: on ? false : true })}
                          title={(on ? 'Hide ' : 'Show ') + lb.toLowerCase() + ' on each card'}
                          style={{ height:26, padding:'0 9px', borderRadius:7, cursor:'pointer',
                            background: on ? 'rgba(5,122,85,0.24)' : TS_SURF,
                            border:'1px solid ' + (on ? 'rgb(16,185,129)' : TS_LINE),
                            color: on ? TS_INK : TS_MUTE, fontFamily:'Inter', fontSize:10.5, fontWeight:600,
                            display:'inline-flex', alignItems:'center', gap:5 }}>
                          <i className={'fa-solid fa-' + (on ? 'check' : 'eye-slash')} style={{ fontSize:8.5 }} />{lb}
                        </button>
                      );
                    })}
                  </div>
                </React.Fragment>
              )}
              <span style={{ fontFamily:'Inter', fontSize:11.5, color:TS_MUTE }}>{view.viz === 'cards' ? 'Cards shown' : 'Row limit'}</span>
              <div style={{ display:'flex', alignItems:'center', gap:8, minWidth:0 }}>
                <input type="number" min="0" value={view.limit || 0} onChange={(e) => setView({ limit:Number(e.target.value) })}
                  style={{ width:64, flexShrink:0, boxSizing:'border-box', background:TS_SURF, border:'1px solid ' + TS_LINE, borderRadius:6, color:TS_INK, fontFamily:'Inter', fontSize:11.5, padding:'6px 8px', outline:'none' }} />
                <span style={{ fontFamily:'Inter', fontSize:10.5, color:'rgba(163,163,163,0.75)', whiteSpace:'nowrap' }}>0 = all</span>
              </div>
              {!['table', 'pivot', 'kpi', 'list', 'text'].includes(view.viz) && (
                <React.Fragment>
                  <span style={{ fontFamily:'Inter', fontSize:11.5, color:TS_MUTE }}>Colors</span>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:5, minWidth:0 }}>
                    {Object.keys(TV_PALETTES).map(pid => {
                      const on = !view.customColors && (view.palette || 'field') === pid;
                      return (
                        <button key={pid} onClick={() => setView({ palette:pid, customColors:null })} title={TV_PALETTES[pid].label}
                          style={{ height:26, padding:'0 7px', borderRadius:7, cursor:'pointer',
                            background: on ? 'rgba(5,122,85,0.24)' : TS_SURF,
                            border:'1px solid ' + (on ? 'rgb(16,185,129)' : TS_LINE),
                            display:'inline-flex', alignItems:'center', gap:3 }}>
                          {TV_PALETTES[pid].colors.slice(0, 4).map((c, i) => (
                            <span key={i} style={{ width:9, height:9, borderRadius:3, background:c }} />
                          ))}
                        </button>
                      );
                    })}
                    <button onClick={() => setView({ customColors: view.customColors && view.customColors.length ? null : tvPalette(view).slice(0, 5).map(tsHexOf) })}
                      title="Pick your own colors"
                      style={{ height:26, padding:'0 9px', borderRadius:7, cursor:'pointer',
                        background: view.customColors ? 'rgba(5,122,85,0.24)' : TS_SURF,
                        border:'1px solid ' + (view.customColors ? 'rgb(16,185,129)' : TS_LINE),
                        color: view.customColors ? TS_INK : TS_MUTE, fontFamily:'Inter', fontSize:10.5, fontWeight:600 }}>Custom</button>
                  </div>
                  {view.customColors && (
                    <React.Fragment>
                      <span />
                      <div style={{ display:'flex', gap:6, minWidth:0, flexWrap:'wrap' }}>
                        {view.customColors.map((c, i) => (
                          <input key={i} type="color" value={c} title={'Series ' + (i + 1)}
                            onChange={(e) => setView({ customColors: view.customColors.map((x, j) => (j === i ? e.target.value : x)) })}
                            style={{ width:30, height:26, padding:2, borderRadius:7, border:'1px solid ' + TS_LINE, background:TS_SURF, cursor:'pointer' }} />
                        ))}
                      </div>
                    </React.Fragment>
                  )}
                </React.Fragment>
              )}
            </div>
            </React.Fragment>)}
          </div>
        </div>
      </div>
      {calcOpen && (
        <TSCalcDialog ds={ds} initial={calcOpen.name ? calcOpen : null} onClose={() => setCalcOpen(null)}
          onAdd={(c) => set({ calcs: calcOpen.name
            ? cfg.calcs.map(x => x.name === calcOpen.name ? c : x)
            : [...(cfg.calcs || []), c] })} />
      )}
    </div>, document.body);
}

/* raw source rows — the spreadsheet view of the underlying table */
function TSSourceRows({ ds }) {
  const fields = dmFields(ds).slice(0, 9);
  const rows = dmRows(ds).slice(0, 120);
  const th = { fontFamily:'Inter', fontSize:9.5, fontWeight:700, letterSpacing:'0.05em', textTransform:'uppercase', color:TS_MUTE, padding:'5px 8px', borderBottom:'1px solid ' + TS_LINE, position:'sticky', top:0, background:'rgb(24,32,45)', whiteSpace:'nowrap', textAlign:'left' };
  const td = { fontFamily:'Inter', fontSize:11, color:'rgb(209,213,219)', padding:'4px 8px', borderBottom:'1px solid rgba(75,85,99,0.25)', whiteSpace:'nowrap' };
  return (
    <div style={{ flex:1, minHeight:0, overflow:'auto' }}>
      <table style={{ width:'100%', borderCollapse:'collapse' }}>
        <thead><tr>{fields.map(f => <th key={f.k} style={{ ...th, textAlign: f.type === 'num' ? 'right' : 'left' }}>{f.label}</th>)}</tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {fields.map(f => (
                <td key={f.k} style={{ ...td, textAlign: f.type === 'num' ? 'right' : 'left', fontVariantNumeric: f.type === 'num' ? 'tabular-nums' : 'normal' }}>
                  {f.type === 'num' ? dmFmt(r[f.k], f.fmt) : String(r[f.k] == null ? '\u2014' : r[f.k])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ fontFamily:'Inter', fontSize:10.5, color:TS_MUTE, padding:'8px 4px' }}>
        First {rows.length} of {dmRows(ds).length.toLocaleString()} rows
      </div>
    </div>
  );
}

Object.assign(window, { TileStudio, TSSourceRows, TSSourcePanel, TSFieldPanel, TSTitleInput, TSKpiRow, TSVizPicker, TSLayoutPicker, TSTip, tsBtn, tsDropOnBody, tsDropOnKpi });
