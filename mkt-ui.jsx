/* Marketing — shared controls and the three "start a campaign" layouts
   (Cards / Matrix / Rail) used by the Campaign Signals & Builder page. */

const MKB = { ink: 'rgb(249,250,251)', mut: 'rgb(163,163,163)', dim: 'rgb(200,205,213)', line: 'rgba(75,85,99,0.4)', card: 'rgba(255,255,255,0.035)', acc: 'rgb(52,211,153)', accBg: 'rgba(5,122,85,0.22)', btn: 'rgb(14,159,110)', bg: 'rgb(17,25,40)' };
const mkA = (c, a) => c.replace('rgb', 'rgba').replace(')', `,${a})`);

function MkCard({ title, note, right, children, pad = '14px 18px 16px', style }) {
  return (
    <div style={{ background: MKB.card, border: `1px solid ${MKB.line}`, borderRadius: 12, padding: pad, display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0, ...style }}>
      {(title || right) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', padding: pad.startsWith('14px 0') ? '0 18px' : 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flex: 1, minWidth: 0, flexWrap: 'wrap' }}>
            <div style={{ fontFamily: 'Inter', fontSize: 12, fontWeight: 600, color: MKB.ink }}>{title}</div>
            {note && <div style={{ fontFamily: 'Inter', fontSize: 11, color: MKB.dim }}>{note}</div>}
          </div>
          {right}
        </div>
      )}
      {children}
    </div>
  );
}
function MkPill({ on, onClick, children, color, title, disabled }) {
  const c = color || MKB.acc;
  return (
    <button onClick={onClick} title={title} disabled={disabled} style={{
      height: 26, padding: '0 10px', borderRadius: 7, cursor: disabled ? 'default' : 'pointer', fontFamily: 'Inter', fontSize: 11.5, fontWeight: on ? 600 : 500,
      border: `1px solid ${on ? mkA(c, 0.55) : 'rgba(75,85,99,0.6)'}`, background: on ? mkA(c, 0.14) : 'transparent', color: on ? MKB.ink : 'rgb(209,213,219)',
      display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', opacity: disabled ? 0.5 : 1,
    }}>{children}</button>
  );
}
function MkSeg({ value, options, onChange }) {
  return (
    <div style={{ display: 'inline-flex', padding: 2, borderRadius: 8, background: 'rgba(17,24,39,0.6)', border: '1px solid rgba(75,85,99,0.6)' }}>
      {options.map(([k, l]) => (
        <button key={k} onClick={() => onChange(k)} style={{ height: 24, padding: '0 10px', borderRadius: 6, border: 'none', cursor: 'pointer', fontFamily: 'Inter', fontSize: 11.5, fontWeight: value === k ? 600 : 500, background: value === k ? 'rgba(255,255,255,0.1)' : 'transparent', color: value === k ? MKB.ink : 'rgb(170,176,186)', whiteSpace: 'nowrap' }}>{l}</button>
      ))}
    </div>
  );
}
function MkSwitch({ on, onChange, label, sub, locked }) {
  return (
    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: locked ? 'default' : 'pointer' }} onClick={e => { e.preventDefault(); if (!locked) onChange(!on); }}>
      <span style={{ width: 30, height: 17, borderRadius: 9, flexShrink: 0, marginTop: 1, background: on ? MKB.btn : 'rgba(75,85,99,0.8)', position: 'relative', transition: 'background 140ms', opacity: locked ? 0.7 : 1 }}>
        <span style={{ position: 'absolute', top: 2, left: on ? 15 : 2, width: 13, height: 13, borderRadius: 7, background: '#fff', transition: 'left 140ms' }}></span>
      </span>
      <span style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <span style={{ fontFamily: 'Inter', fontSize: 12, fontWeight: 500, color: MKB.ink, display: 'inline-flex', gap: 6, alignItems: 'center' }}>{label}{locked && <i className="fa-solid fa-lock" style={{ fontSize: 9, color: MKB.mut }}></i>}</span>
        {sub && <span style={{ fontFamily: 'Inter', fontSize: 11, color: MKB.mut }}>{sub}</span>}
      </span>
    </label>
  );
}
function MkLabel({ children, style }) {
  return <div style={{ fontFamily: 'Inter', fontSize: 10, fontWeight: 600, color: MKB.dim, textTransform: 'uppercase', letterSpacing: 0.6, ...style }}>{children}</div>;
}
function MkMulti({ label, options, value, onChange, width = 220, labels }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h);
  }, [open]);
  const lab = (o) => (labels && labels[o]) || o;
  const txt = !value.length ? 'All' : value.length === 1 ? lab(value[0]) : `${value.length} selected`;
  return (
    <div ref={ref} style={{ position: 'relative', minWidth: 0 }}>
      <button onClick={() => setOpen(o => !o)} style={{ height: 30, width: '100%', padding: '0 10px', borderRadius: 8, border: `1px solid ${value.length ? 'rgba(52,211,153,0.55)' : 'rgba(75,85,99,0.7)'}`, background: value.length ? 'rgba(52,211,153,0.08)' : 'rgba(17,24,39,0.5)', color: MKB.ink, fontFamily: 'Inter', fontSize: 12, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
        <span style={{ color: MKB.mut, flexShrink: 0 }}>{label}</span>
        <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>{txt}</span>
        <i className="fa-solid fa-chevron-down" style={{ fontSize: 9, color: MKB.mut }}></i>
      </button>
      {open && (
        <div style={{ position: 'absolute', zIndex: 40, top: 34, left: 0, width: Math.max(width, 180), maxHeight: 300, overflow: 'auto', padding: 4, borderRadius: 10, background: 'rgb(31,41,55)', border: '1px solid rgba(75,85,99,0.7)', boxShadow: '0 12px 30px rgba(0,0,0,0.45)' }}>
          {value.length > 0 && <button onClick={() => onChange([])} style={{ width: '100%', textAlign: 'left', padding: '6px 8px', border: 'none', background: 'transparent', color: MKB.acc, fontFamily: 'Inter', fontSize: 11.5, cursor: 'pointer' }}>Clear</button>}
          {options.map(o => {
            const on = value.includes(o);
            return (
              <button key={o} onClick={() => onChange(on ? value.filter(x => x !== o) : [...value, o])} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', border: 'none', borderRadius: 6, background: on ? 'rgba(52,211,153,0.1)' : 'transparent', color: MKB.ink, fontFamily: 'Inter', fontSize: 12, cursor: 'pointer', textAlign: 'left' }}>
                <span style={{ width: 14, height: 14, borderRadius: 4, border: `1px solid ${on ? MKB.acc : 'rgba(107,114,128,0.9)'}`, background: on ? MKB.btn : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{on && <i className="fa-solid fa-check" style={{ fontSize: 8, color: '#fff' }}></i>}</span>
                {lab(o)}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
function MkSigChip({ type }) {
  const m = LV_SIG_META[type] || { color: MKB.dim, icon: 'circle' };
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 22, padding: '0 8px', borderRadius: 6, background: mkA(m.color, 0.12), border: `1px solid ${mkA(m.color, 0.35)}`, fontFamily: 'Inter', fontSize: 11, color: MKB.ink, whiteSpace: 'nowrap' }}><i className={`fa-solid fa-${m.icon}`} style={{ fontSize: 9, color: m.color }}></i>{type}</span>;
}

/* ---- start layouts ---- */
function MkTplCard({ t, on, count, onClick }) {
  const gen = t.kind === 'gen';
  const c = gen ? 'rgb(209,213,219)' : MK_SIG[t.sig].color;
  return (
    <button onClick={onClick} style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '11px 12px', borderRadius: 10, cursor: 'pointer', textAlign: 'left', minWidth: 0,
      border: `1px solid ${on ? 'rgba(52,211,153,0.7)' : t.key === 'blank' ? 'rgba(107,114,128,0.7)' : 'rgba(75,85,99,0.5)'}`, borderStyle: t.key === 'blank' && !on ? 'dashed' : 'solid',
      background: on ? 'rgba(5,122,85,0.18)' : 'rgba(255,255,255,0.02)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <i className={`fa-solid fa-${t.icon}`} style={{ fontSize: 12, color: on ? MKB.acc : c, width: 14, textAlign: 'center' }}></i>
        <span style={{ flex: 1, fontFamily: 'Inter', fontSize: 12.5, fontWeight: 600, color: MKB.ink }}>{t.label}</span>
        {count != null && <span style={{ fontFamily: 'Inter', fontSize: 11, color: MKB.dim, fontVariantNumeric: 'tabular-nums' }}>{mkNum(count)}</span>}
      </div>
      <div style={{ fontFamily: 'Inter', fontSize: 11, color: MKB.mut, lineHeight: 1.4, textWrap: 'pretty' }}>{t.desc}</div>
    </button>
  );
}

/* Cards: one card per signal group (sales families + No signal / Any signal),
   each with its signal types as toggles and live counts. */
function MkStartCards({ sig, sigTypes, onPick, counts }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      <MkLabel>Signal<span style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 400, color: MKB.mut, marginLeft: 8 }}>counts = FA/Teams in the current audience for the product focus below</span></MkLabel>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
        {MK_SIGNALS.map(s => {
          const on = sig === s.key, sub = s.key !== 'none' && s.key !== 'any';
          return (
            <div key={s.key} onClick={() => onPick(s.key, null)} style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '11px 12px', borderRadius: 10, cursor: 'pointer', minWidth: 0,
              border: `1px solid ${on ? mkA(s.color, 0.75) : 'rgba(75,85,99,0.5)'}`, background: on ? mkA(s.color, 0.1) : 'rgba(255,255,255,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className={`fa-solid fa-${s.icon}`} style={{ fontSize: 12, color: s.color, width: 14, textAlign: 'center' }}></i>
                <span style={{ flex: 1, fontFamily: 'Inter', fontSize: 12.5, fontWeight: 600, color: MKB.ink }}>{s.key === 'none' ? 'No signal (blank)' : s.label}</span>
                <span style={{ fontFamily: 'Inter', fontSize: 12, fontWeight: 600, color: on ? MKB.ink : MKB.dim, fontVariantNumeric: 'tabular-nums' }}>{mkNum(counts[s.key] || 0)}</span>
              </div>
              <div style={{ fontFamily: 'Inter', fontSize: 11, color: MKB.mut, lineHeight: 1.4, textWrap: 'pretty' }}>{s.desc}</div>
              {sub && (
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                  {s.types.map(ty => {
                    const tOn = on && sigTypes.includes(ty);
                    return (
                      <button key={ty} title={LV_SIG_CALC[ty]} onClick={e => { e.stopPropagation(); if (!on) return onPick(s.key, [ty]); const n = tOn ? sigTypes.filter(x => x !== ty) : [...sigTypes, ty]; if (n.length) onPick(s.key, n); }}
                        style={{ height: 24, padding: '0 8px', borderRadius: 6, cursor: 'pointer', fontFamily: 'Inter', fontSize: 11, fontWeight: tOn ? 600 : 500, display: 'inline-flex', alignItems: 'center', gap: 5,
                          border: `1px solid ${tOn ? mkA(s.color, 0.6) : 'rgba(75,85,99,0.6)'}`, background: tOn ? mkA(s.color, 0.16) : 'transparent', color: tOn ? MKB.ink : 'rgb(209,213,219)' }}>
                        <i className={`fa-solid fa-${(LV_SIG_META[ty] || {}).icon || 'circle'}`} style={{ fontSize: 9, color: s.color }}></i>{MK_TYPE_SHORT[ty]}<span style={{ color: MKB.mut, fontVariantNumeric: 'tabular-nums' }}>{mkNum(counts[s.key + ':' + ty] || 0)}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MkStartMatrix({ tpl, onTpl, sig, sigTypes, product, onCell, matrix }) {
  const rows = [];
  MK_SIGNALS.forEach(s => {
    rows.push({ key: s.key, s, label: s.label, icon: s.icon, sub: false });
    if (s.key !== 'none' && s.key !== 'any') s.types.forEach(ty => rows.push({ key: s.key + ':' + ty, s, label: MK_TYPE_SHORT[ty], icon: (LV_SIG_META[ty] || {}).icon, sub: true, ty }));
  });
  const isOn = (r) => r.s.key === sig && (r.sub ? sigTypes.length === 1 && sigTypes[0] === r.ty : (sig === 'none' || sig === 'any' || sigTypes.length === r.s.types.length));
  const mx = Math.max(1, ...rows.filter(r => r.s.key !== 'none' && r.s.key !== 'any').flatMap(r => MK_PRODUCTS.map(p => matrix[r.key][p.key])));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontFamily: 'Inter', fontSize: 11, color: MKB.mut }}>FA/Teams in the current audience · click a cell to select a signal and product</div>
      <div style={{ overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 3, minWidth: 720, tableLayout: 'fixed' }}>
          <colgroup><col style={{ width: 170 }} />{MK_PRODUCTS.map(p => <col key={p.key} />)}</colgroup>
          <thead><tr>
            <th style={{ textAlign: 'left', padding: '4px 8px', fontFamily: 'Inter', fontSize: 10, fontWeight: 600, color: MKB.dim, textTransform: 'uppercase', letterSpacing: 0.5, verticalAlign: 'bottom' }}>Signal</th>
            {MK_PRODUCTS.map(p => <th key={p.key} style={{ padding: '4px 6px', fontFamily: 'Inter', fontSize: 11, fontWeight: 600, color: product === p.key ? MKB.acc : MKB.ink, whiteSpace: 'nowrap' }}><i className={`fa-solid fa-${p.icon}`} style={{ fontSize: 9, color: p.color, marginRight: 5 }}></i>{p.label}</th>)}
          </tr></thead>
          <tbody>
            {rows.map(r => {
              const rowOn = isOn(r), fam = r.s, col = fam.color;
              const rgb = col.match(/\d+/g).join(',');
              return (
                <tr key={r.key}>
                  <td style={{ padding: r.sub ? '4px 8px 4px 30px' : '6px 8px', fontFamily: 'Inter', fontSize: r.sub ? 11.5 : 12, color: rowOn ? MKB.acc : r.sub ? 'rgb(209,213,219)' : MKB.ink, fontWeight: rowOn ? 600 : r.sub ? 400 : 600, whiteSpace: 'nowrap' }}><i className={`fa-solid fa-${r.icon}`} style={{ fontSize: r.sub ? 9 : 10, color: col, width: 16 }}></i>{r.label}</td>
                  {MK_PRODUCTS.map(p => {
                    const n = matrix[r.key][p.key], on = rowOn && product === p.key, flat = fam.key === 'none' || fam.key === 'any';
                    return (
                      <td key={p.key} onClick={() => onCell(r.key, p.key)} title={`${fam.label}${r.sub ? ' · ' + r.label : ''} · ${p.label}: ${mkNum(n)} FA/Teams`} style={{ cursor: 'pointer', textAlign: 'center', padding: r.sub ? '5px 4px' : '8px 4px', borderRadius: 6, fontFamily: 'Inter', fontSize: r.sub ? 11.5 : 12.5, fontWeight: on ? 700 : r.sub ? 400 : 500, fontVariantNumeric: 'tabular-nums', color: MKB.ink,
                        background: flat ? 'rgba(255,255,255,0.04)' : `rgba(${rgb},${0.05 + 0.45 * n / mx})`, outline: on ? '2px solid rgb(52,211,153)' : 'none', outlineOffset: -2 }}>{mkNum(n)}</td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MkStartRail({ tpl, onTpl, tplCounts }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {[['gen', 'General'], ['sig', 'Signal-driven']].map(([k, l]) => (
        <div key={k} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 6px 4px' }}><MkLabel>{l}</MkLabel>{k === 'sig' && <span style={{ fontFamily: 'Inter', fontSize: 10, color: MKB.mut }}>FA/Teams</span>}</div>
          {MK_TEMPLATES.filter(t => t.kind === k).map(t => {
            const on = tpl === t.key;
            return (
              <button key={t.key} onClick={() => onTpl(t.key)} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', textAlign: 'left', background: on ? MKB.accBg : 'transparent' }}
                onMouseEnter={e => { if (!on) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }} onMouseLeave={e => { if (!on) e.currentTarget.style.background = 'transparent'; }}>
                <i className={`fa-solid fa-${t.icon}`} style={{ fontSize: 11, width: 14, textAlign: 'center', color: on ? MKB.acc : k === 'sig' ? MK_SIG[t.sig].color : 'rgb(170,176,186)' }}></i>
                <span style={{ flex: 1, fontFamily: 'Inter', fontSize: 12, fontWeight: on ? 600 : 500, color: on ? MKB.acc : 'rgb(209,213,219)' }}>{t.label}</span>
                {k === 'sig' && <span style={{ fontFamily: 'Inter', fontSize: 11.5, color: MKB.dim, fontVariantNumeric: 'tabular-nums' }}>{mkNum(tplCounts[t.key])}</span>}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

Object.assign(window, { MKB, mkA, MkCard, MkPill, MkSeg, MkSwitch, MkLabel, MkMulti, MkSigChip, MkStartCards, MkStartMatrix, MkStartRail });
