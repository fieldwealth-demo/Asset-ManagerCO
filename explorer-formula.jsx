/* Data Explorer — formula bar. Shows how the selected cell is calculated,
   and doubles as the editor for calculated fields (base function set). */

function ExFormulaBar({ F, sel, p, edit, onCancel, onSave, onDelete, onNew }) {
  if (edit) return <ExCalcEditor F={F} p={p} init={edit} onCancel={onCancel} onSave={onSave} onDelete={onDelete} />;
  let ref = 'No cell selected', body = <span style={{ color: EXS.mute }}>Select a cell to see how it is calculated, or create a calculated field.</span>;
  if (sel) {
    const m = sel.m;
    const ctx = [];
    if (sel.node) sel.node.id.split(p.SEP).slice(1).forEach((v, i) => p.rowDims[i] && ctx.push(`${p.rowDims[i].label} = ${v}`));
    if (sel.ck) sel.ck.split(p.SEP).forEach((v, i) => p.colDims[i] && ctx.push(`${p.colDims[i].label} = ${v}`));
    ref = m.label;
    body = (
      <span style={{ display: 'inline-flex', gap: 10, alignItems: 'baseline', minWidth: 0, overflow: 'hidden' }}>
        <span style={{ color: m.group === 'Calculated' ? EXS.calcC : EXS.hi, fontFamily: EXS.mono, whiteSpace: 'nowrap' }}>= {m.group === 'Calculated' ? m.expr : m.def}</span>
        <span style={{ color: EXS.dim, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ctx.length ? 'where ' + ctx.join(' · ') : 'across all rows in the filter'}</span>
        {m.grain === 'fa' && <span style={{ color: EXS.mute, whiteSpace: 'nowrap' }}>FA grain</span>}
      </span>
    );
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, height: 38, borderBottom: `1px solid ${EXS.line}`, background: 'rgba(0,0,0,0.18)', fontSize: 12 }}>
      <div style={{ width: 200, flexShrink: 0, height: '100%', display: 'flex', alignItems: 'center', padding: '0 12px', borderRight: `1px solid ${EXS.lineSoft}`, color: EXS.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ref}</div>
      <span style={{ fontFamily: EXS.mono, fontStyle: 'italic', color: EXS.calcC, padding: '0 10px', fontSize: 12 }}>fx</span>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', overflow: 'hidden' }}>{body}</div>
      <button onClick={onNew} style={{ ...exBtn(), height: 26, margin: '0 8px', fontSize: 11.5 }}><i className="fa-solid fa-plus" style={{ fontSize: 9 }} />Calculated field</button>
    </div>
  );
}

function ExCalcEditor({ F, p, init, onCancel, onSave, onDelete }) {
  const isNew = !init.id;
  const [label, setLabel] = React.useState(init.label || '');
  const [expr, setExpr] = React.useState(init.expr || '');
  const [fmt, setFmt] = React.useState(init.fmt || '$');
  const [caret, setCaret] = React.useState(0);
  const [hi, setHi] = React.useState(0);
  const inp = React.useRef(null);
  React.useEffect(() => { inp.current && inp.current.focus(); }, []);
  const id = init.id || 'calc_' + Date.now().toString(36);

  let err = null, ast = null;
  if (expr.trim()) { try { ast = exValidate(expr, F, id); } catch (e) { err = e.message; } }
  const dup = label.trim() && Object.values(F).some(f => f.id !== id && f.label.toLowerCase() === label.trim().toLowerCase());
  let preview = null;
  if (ast) { try { const v = exCompute({ id: '__pv', agg: 'calc', ast }, p.rows, F, null); preview = v == null ? '—' : exFmt(v, fmt); } catch (e) { err = 'Could not evaluate'; } }

  // autocomplete: inside an unclosed [ → fields; on a bare word → functions
  const before = expr.slice(0, caret);
  const ob = before.lastIndexOf('['), cb = before.lastIndexOf(']');
  let sug = [], tokStart = caret;
  if (ob > cb) {
    const q = before.slice(ob + 1).toLowerCase(); tokStart = ob;
    sug = Object.values(F).filter(f => f.id !== id && f.agg !== 'top3' && f.label.toLowerCase().includes(q)).slice(0, 8).map(f => ({ ins: `[${f.label}]`, t: f.label, s: f.kind === 'dim' ? 'Dimension' : f.def || f.expr || '', k: f.kind }));
  } else {
    const m = before.match(/([A-Za-z]+)$/);
    if (m) { tokStart = caret - m[1].length; sug = EX_FUNCS.filter(fn => fn.name.startsWith(m[1].toUpperCase())).map(fn => ({ ins: fn.name + '(', t: fn.sig, s: fn.desc, k: 'fn' })); }
  }
  const pick = s => {
    const next = expr.slice(0, tokStart) + s.ins + expr.slice(caret);
    setExpr(next); const c = tokStart + s.ins.length; setCaret(c); setHi(0);
    setTimeout(() => { inp.current && (inp.current.focus(), inp.current.setSelectionRange(c, c)); }, 0);
  };
  const onKey = e => {
    if (sug.length && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) { e.preventDefault(); setHi(h => (h + (e.key === 'ArrowDown' ? 1 : -1) + sug.length) % sug.length); }
    else if (sug.length && (e.key === 'Tab' || (e.key === 'Enter' && sug[hi]))) { e.preventDefault(); pick(sug[hi]); }
    else if (e.key === 'Enter' && canSave) save();
    else if (e.key === 'Escape') onCancel();
  };
  const canSave = ast && !err && label.trim() && !dup;
  const save = () => onSave({ id, label: label.trim(), expr, fmt, def: expr });
  const examples = ['DIVIDE([Client Gross Sales], [Market Gross Sales])', '[Opportunity AUM] - [Capturable Opportunity]', 'IF([Market Share · AUM] < 0.1, [Opportunity AUM], 0)'];

  return (
    <div style={{ borderBottom: `1px solid ${EXS.line}`, background: 'rgba(251,191,36,0.04)', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8, position: 'relative' }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <input value={label} onChange={e => setLabel(e.target.value)} placeholder="Field name" style={{ ...exInput, width: 190 }} />
        <span style={{ fontFamily: EXS.mono, fontStyle: 'italic', color: EXS.calcC }}>fx =</span>
        <div style={{ flex: 1, minWidth: 260, position: 'relative' }}>
          <input ref={inp} value={expr} spellCheck={false}
            onChange={e => { setExpr(e.target.value); setCaret(e.target.selectionStart); setHi(0); }}
            onKeyUp={e => setCaret(e.target.selectionStart)} onClick={e => setCaret(e.target.selectionStart)} onKeyDown={onKey}
            placeholder="e.g. DIVIDE([Client Gross Sales], [Market Gross Sales])"
            style={{ ...exInput, width: '100%', fontFamily: EXS.mono, borderColor: err ? 'rgba(248,113,113,0.6)' : ast ? 'rgba(52,211,153,0.5)' : EXS.line }} />
          {sug.length > 0 && (
            <div style={{ position: 'absolute', top: 34, left: 0, right: 0, zIndex: 20, background: EXS.panelSolid, border: `1px solid ${EXS.line}`, borderRadius: 8, padding: 4, boxShadow: '0 14px 30px -8px rgba(0,0,0,0.6)', maxHeight: 260, overflow: 'auto' }}>
              {sug.map((s, i) => (
                <button key={s.t} onMouseDown={e => { e.preventDefault(); pick(s); }} onMouseEnter={() => setHi(i)} style={{ width: '100%', display: 'flex', gap: 10, alignItems: 'baseline', padding: '6px 8px', border: 'none', borderRadius: 6, cursor: 'pointer', textAlign: 'left', background: i === hi ? 'rgba(255,255,255,0.06)' : 'transparent', fontFamily: 'Inter' }}>
                  <span style={{ fontFamily: EXS.mono, fontSize: 10, width: 24, color: s.k === 'fn' ? EXS.calcC : s.k === 'dim' ? EXS.dimC : EXS.acc }}>{s.k === 'fn' ? 'fn' : s.k === 'dim' ? 'Abc' : '#'}</span>
                  <span style={{ fontSize: 12, color: EXS.hi, fontFamily: s.k === 'fn' ? EXS.mono : 'Inter', whiteSpace: 'nowrap' }}>{s.t}</span>
                  <span style={{ fontSize: 11, color: EXS.dim, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.s}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <select value={fmt} onChange={e => setFmt(e.target.value)} style={{ ...exInput, width: 110 }}>
          <option value="$">Currency</option><option value="%">Percent</option><option value="n">Number</option><option value="d1">Decimal</option>
        </select>
        <button disabled={!canSave} onClick={save} style={{ ...exBtn('primary'), opacity: canSave ? 1 : 0.45, cursor: canSave ? 'pointer' : 'default' }}>{isNew ? 'Add to Values' : 'Save'}</button>
        {!isNew && <button onClick={() => onDelete(id)} style={exBtn()} title="Delete field"><i className="fa-solid fa-trash" style={{ fontSize: 10 }} /></button>}
        <button onClick={onCancel} style={exBtn()}>Cancel</button>
      </div>
      <div style={{ display: 'flex', gap: 14, alignItems: 'center', fontSize: 11, minHeight: 16, flexWrap: 'wrap' }}>
        {err ? <span style={{ color: EXS.neg }}><i className="fa-solid fa-circle-exclamation" style={{ marginRight: 5 }} />{err}</span>
          : dup ? <span style={{ color: EXS.neg }}>A field with that name already exists.</span>
          : preview != null ? <span style={{ color: EXS.acc }}><i className="fa-solid fa-check" style={{ marginRight: 5 }} />Grand total preview: <strong>{preview}</strong></span>
          : <span style={{ color: EXS.dim }}>Type [ for fields, letters for functions. Measures use their governed rollup at each cell.</span>}
        {!expr && <span style={{ color: EXS.mute }}>Try:</span>}
        {!expr && examples.map(x => <button key={x} onClick={() => setExpr(x)} style={{ border: `1px solid ${EXS.lineSoft}`, borderRadius: 5, background: 'transparent', color: EXS.ink, fontFamily: EXS.mono, fontSize: 10.5, padding: '2px 6px', cursor: 'pointer' }}>{x}</button>)}
      </div>
    </div>
  );
}
const exInput = { height: 30, boxSizing: 'border-box', padding: '0 10px', borderRadius: 7, background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(75,85,99,0.6)', color: 'rgb(249,250,251)', fontFamily: 'Inter', fontSize: 12, outline: 'none' };

Object.assign(window, { ExFormulaBar });
