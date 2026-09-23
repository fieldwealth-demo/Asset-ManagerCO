/* Shell — Topbar, Shared UI.
   The sidebar/nav now lives in sidebar.jsx (ported from the Advisor Dashboard
   design system): dual-state rail with push-content layout, persisted
   expand/collapse, collapsed tooltips + flyouts, profile cluster + footer. */

function TopBar({ title, dateStr, activeSelections, period, onPeriod, showExport, showFilter, onClearAll, onFilterClick, onExportClick, filterActive, showSearch = true, onAiClick, badge, levelSwitch, secondRow, measureToggle }) {
  const inlineSelections = activeSelections !== undefined && !secondRow;
  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 20,
      background: 'rgba(31, 41, 55, 0.85)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px) saturate(140%)',
      borderBottom: '1px solid rgba(75,85,99,0.4)',
    }}>
      <div style={{
        height: 56, display: 'flex', alignItems: 'center', gap: 16, padding: '0 20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexShrink: 0 }}>
          <div style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 15, color: 'rgb(249,250,251)', whiteSpace: 'nowrap' }}>{title}</div>
          {badge}
          {dateStr && <div className="tb-date" style={{ fontFamily: 'Inter', fontSize: 11.5, color: 'rgb(163,163,163)', whiteSpace: 'nowrap' }}>{dateStr}</div>}
        </div>
        {!secondRow && levelSwitch}

        {/* Active selections sit inline with the page header so the layout below
           never shifts when a selection is applied or cleared. */}
        {inlineSelections && (
          <div style={{
            flex: '1 1 auto', minWidth: 0, display: 'flex', alignItems: 'center', gap: 8,
            overflowX: 'auto', overflowY: 'hidden', height: 32, paddingRight: 4,
          }}>
            {activeSelections.length > 0 && (
              <>
                {activeSelections.map((sel, i) => (
                  <SelectionChip key={sel.key || i} label={sel.label} icon={sel.icon} onRemove={sel.onRemove} />
                ))}
                <button onClick={onClearAll} style={{
                  flexShrink: 0, height: 24, padding: '0 10px', borderRadius: 6,
                  background: 'rgba(16,185,129,0.14)', border: '1px solid rgb(16,185,129)',
                  boxShadow: '0 0 0 3px rgba(16,185,129,0.14)',
                  color: 'rgb(52,211,153)', fontFamily: 'Inter', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                }}><i className="fa-solid fa-xmark" style={{ fontSize: 9 }} />Clear All</button>
              </>
            )}
          </div>
        )}

        {showSearch && (
        <div className="tb-search" style={{ flex: inlineSelections ? '0 1 260px' : '1 1 120px', minWidth: 0, display: 'flex', justifyContent: 'center' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, height: 32, width: '100%', maxWidth: inlineSelections ? 260 : 420, minWidth: 0, padding: '0 12px',
            borderRadius: 8, background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(75,85,99,0.5)',
            fontFamily: 'Inter', fontSize: 12, color: 'rgb(163,163,163)',
          }}>
            <i className="fa-solid fa-magnifying-glass" style={{ fontSize: 11 }} />
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Search firm, advisor, city, CRD…</span>
          </div>
        </div>
        )}
        {!showSearch && <div style={{ flex: 1 }} />}

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {measureToggle}
          {period && (
            <PeriodDropdown value={period} onChange={onPeriod} />
          )}
          {showExport && (
            <button onClick={onExportClick} style={{
              height: 30, padding: '0 10px', borderRadius: 6, border: '1px solid rgb(75,85,99)',
              background: 'rgba(0,0,0,0.35)', color: 'rgb(229,231,235)',
              fontFamily: 'Inter', fontSize: 12, fontWeight: 500, cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 6,
            }}>
              <i className="fa-solid fa-arrow-up-from-bracket" style={{ fontSize: 10 }} />
              Export
            </button>
          )}
          {showFilter && (
            <button onClick={onFilterClick} style={{
              height: 30, padding: '0 10px', borderRadius: 6,
              border: `1px solid ${filterActive ? 'rgb(16,185,129)' : 'rgb(75,85,99)'}`,
              background: filterActive ? 'rgba(16,185,129,0.15)' : 'rgba(0,0,0,0.35)',
              color: filterActive ? 'rgb(52,211,153)' : 'rgb(229,231,235)',
              fontFamily: 'Inter', fontSize: 12, fontWeight: 500, cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 6,
            }}>
              <i className="fa-solid fa-filter" style={{ fontSize: 10 }} />
              Filter
              {filterActive && <span style={{ marginLeft:2, background:'rgb(16,185,129)', color:'#fff', fontSize:9, fontWeight:700, padding:'1px 5px', borderRadius:9999 }}>●</span>}
            </button>
          )}
          {onAiClick && (
            <button onClick={onAiClick} style={{
              height: 30, padding: '0 12px', borderRadius: 6, border: '1px solid rgb(16,185,129)',
              background: 'rgba(16,185,129,0.15)', color: 'rgb(52,211,153)',
              fontFamily: 'Inter', fontSize: 12, fontWeight: 500, cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
            }}>
              <i className="fa-solid fa-wand-magic-sparkles" style={{ fontSize: 11 }} />
              Ask Field
            </button>
          )}
        </div>
      </div>

      {/* Second row: subscription level on the left, applied selections in the
         middle where they can scroll, and Clear All pinned right so it never
         runs out of room. */}
      {secondRow && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '0 20px 8px',
          borderTop: '1px solid rgba(75,85,99,0.25)', paddingTop: 8,
        }}>
          {levelSwitch}
          <div style={{
            flex: '1 1 auto', minWidth: 0, display: 'flex', alignItems: 'center', gap: 8,
            overflowX: 'auto', overflowY: 'hidden', height: 26,
          }}>
            {(activeSelections || []).map((sel, i) => (
              <SelectionChip key={sel.key || i} label={sel.label} icon={sel.icon} onRemove={sel.onRemove} />
            ))}
          </div>
          <button onClick={onClearAll} disabled={!(activeSelections || []).length} style={{
            flexShrink: 0, height: 26, padding: '0 11px', borderRadius: 6, cursor: (activeSelections || []).length ? 'pointer' : 'default',
            background: (activeSelections || []).length ? 'rgba(16,185,129,0.14)' : 'transparent',
            border: `1px solid ${(activeSelections || []).length ? 'rgb(16,185,129)' : 'rgba(75,85,99,0.35)'}`,
            boxShadow: (activeSelections || []).length ? '0 0 0 3px rgba(16,185,129,0.14)' : 'none',
            color: (activeSelections || []).length ? 'rgb(52,211,153)' : 'rgb(107,114,128)',
            fontFamily: 'Inter', fontSize: 11, fontWeight: (activeSelections || []).length ? 600 : 400, whiteSpace: 'nowrap',
            display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'all .15s',
          }}>
            <i className="fa-solid fa-xmark" style={{ fontSize: 9 }} />
            Clear all{(activeSelections || []).length ? ` (${activeSelections.length})` : ''}
          </button>
        </div>
      )}
    </div>
  );
}

function SelectionChip({ label, icon, onRemove }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6, height: 24, padding: '0 8px', flexShrink: 0,
      borderRadius: 6, background: 'rgba(16,185,129,0.22)', border: '1px solid rgba(16,185,129,0.55)',
      fontFamily: 'Inter', fontSize: 11, color: 'rgb(110,240,180)', whiteSpace: 'nowrap',
    }}>
      {icon && <i className={`fa-solid fa-${icon}`} style={{ fontSize: 10 }} />}
      {label}
      <i className="fa-solid fa-xmark"
        onClick={onRemove}
        style={{ fontSize: 9, opacity: 0.7, cursor: onRemove ? 'pointer' : 'default' }} />
    </div>
  );
}

const PERIOD_OPTIONS = ['MTD', 'QTD', 'YTD', 'Rolling 12', 'Custom Range…'];

/* Source coverage — actual max period per data pack. Anything short of the
   unified max period is filled by the time-synthesis process (office-level
   data projected forward) and flagged with an asterisk wherever shown. */
const SOURCE_COVERAGE = [
  { src: 'Morningstar',   from: 'Jan 2026', to: 'Jul 2026', synth: false },
  { src: 'LPL',           from: 'Jan 2026', to: 'Jun 2026', synth: true  },
  { src: 'SS&C',          from: 'Jan 2026', to: 'Jun 2026', synth: true  },
  { src: 'Broadridge',    from: 'Jan 2026', to: 'Jul 2026', synth: false },
  { src: 'Internal CRM',  from: 'Jan 2026', to: 'Jul 2026', synth: false },
];
const UNIFIED_MAX_PERIOD = 'Jul 2026';
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const YEARS = ['2024','2025','2026'];

function CoverageTooltip() {
  return (
    <div style={{
      position:'absolute', top: 34, right: 0, width: 340, zIndex: 60,
      background:'rgb(17,24,39)', border:'1px solid rgba(75,85,99,0.6)', borderRadius:8,
      boxShadow:'0 12px 32px rgba(0,0,0,0.5)', padding:'14px 16px', textAlign:'left',
    }}>
      <div style={{ fontFamily:'Inter', fontSize:11.5, fontWeight:600, color:'rgb(249,250,251)', marginBottom:8 }}>Data source coverage</div>
      <table style={{ width:'100%', borderCollapse:'collapse', fontFamily:'Inter', fontSize:11 }}>
        <thead><tr>
          <th style={{ textAlign:'left', color:'rgb(107,114,128)', fontWeight:500, fontSize:9.5, letterSpacing:0.5, textTransform:'uppercase', paddingBottom:5 }}>Source</th>
          <th style={{ textAlign:'right', color:'rgb(107,114,128)', fontWeight:500, fontSize:9.5, letterSpacing:0.5, textTransform:'uppercase', paddingBottom:5 }}>Actual coverage</th>
        </tr></thead>
        <tbody>
          {SOURCE_COVERAGE.map(s => (
            <tr key={s.src} style={{ borderTop:'1px solid rgba(75,85,99,0.25)' }}>
              <td style={{ padding:'5px 0', color:'rgb(229,231,235)' }}>{s.src}{s.synth && <span style={{ color:'rgb(250,204,21)', fontWeight:700 }}> *</span>}</td>
              <td style={{ padding:'5px 0', textAlign:'right', color:'rgb(163,163,163)', fontVariantNumeric:'tabular-nums' }}>{s.from} – {s.to}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop:10, paddingTop:10, borderTop:'1px solid rgba(75,85,99,0.3)', fontFamily:'Inter', fontSize:10.5, lineHeight:1.5, color:'rgb(163,163,163)' }}>
        <span style={{ color:'rgb(250,204,21)', fontWeight:700 }}>*</span> Time synthesis applied. Sources whose latest data pack ends before {UNIFIED_MAX_PERIOD} are projected forward using office-level data so all sources unify to the current max period. Synthesized periods are flagged wherever they appear.
      </div>
    </div>
  );
}

function PeriodDropdown({ value, onChange }) {
  const [open, setOpen] = React.useState(false);
  const [tip, setTip] = React.useState(false);
  const [customOpen, setCustomOpen] = React.useState(false);
  const [fromM, setFromM] = React.useState('Jan');
  const [fromY, setFromY] = React.useState('2026');
  const [toM, setToM] = React.useState('Jul');
  const [toY, setToY] = React.useState('2026');
  const ref = React.useRef(null);
  const tipRef = React.useRef(null);
  React.useEffect(() => {
    if (!open) return;
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setCustomOpen(false); } };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);
  React.useEffect(() => {
    if (!tip) return;
    const close = (e) => { if (tipRef.current && !tipRef.current.contains(e.target)) setTip(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [tip]);
  return (
    <div style={{ display:'inline-flex', alignItems:'center', gap:4 }}>
    <div ref={tipRef} style={{ position:'relative' }}>
      <button onClick={() => setTip(t => !t)} title="Data source coverage & time synthesis" style={{
        width:22, height:22, borderRadius:4, cursor:'pointer',
        border:`1px solid ${tip ? 'rgb(250,204,21)' : 'rgba(75,85,99,0.6)'}`,
        background: tip ? 'rgba(250,204,21,0.15)' : 'rgba(0,0,0,0.35)',
        color:'rgb(250,204,21)', fontFamily:'Inter', fontSize:13, fontWeight:700, lineHeight:1,
        display:'inline-flex', alignItems:'center', justifyContent:'center', paddingBottom:2,
      }}>*</button>
      {tip && <CoverageTooltip />}
    </div>
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} style={{
        height: 30, padding: '0 12px', borderRadius: 6,
        border: `1px solid ${open ? 'rgb(16,185,129)' : 'rgb(75,85,99)'}`,
        background: open ? 'rgba(16,185,129,0.10)' : 'rgba(0,0,0,0.35)',
        color: 'rgb(229,231,235)',
        fontFamily: 'Inter', fontSize: 12, fontWeight: 500, cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', gap: 8,
      }}>
        <i className="fa-regular fa-calendar" style={{ fontSize: 11, color: 'rgb(163,163,163)' }} />
        {value}
        <i className={`fa-solid ${open ? 'fa-chevron-up' : 'fa-chevron-down'}`} style={{ fontSize: 9 }} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 36, right: 0, minWidth: 180, zIndex: 50,
          background: 'rgb(17,24,39)', border: '1px solid rgba(75,85,99,0.6)', borderRadius: 8,
          boxShadow: '0 12px 32px rgba(0,0,0,0.45)', padding: 4,
        }}>
          {PERIOD_OPTIONS.map(opt => {
            const isCustom = opt.startsWith('Custom');
            const sel = opt === value || (isCustom && value && value.startsWith('Custom'));
            return (
              <button key={opt} onClick={() => { if (isCustom) { setCustomOpen(true); } else { setOpen(false); setCustomOpen(false); onChange && onChange(opt); } }} style={{
                width: '100%', textAlign: 'left', padding: '8px 12px', borderRadius: 5,
                background: sel ? 'rgba(16,185,129,0.18)' : 'transparent', border: 'none',
                color: sel ? 'rgb(110,240,180)' : 'rgb(229,231,235)',
                fontFamily: 'Inter', fontSize: 12, fontWeight: sel ? 600 : 500, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 8,
              }}
              onMouseEnter={e => { if (!sel) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
              onMouseLeave={e => { if (!sel) e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{ width: 8, height: 8, borderRadius: 9999, background: sel ? 'rgb(16,185,129)' : 'transparent', border: sel ? 'none' : '1px solid rgba(75,85,99,0.6)' }} />
                {opt}
                {opt === 'YTD' && <span style={{ marginLeft: 'auto', fontSize: 9, color: 'rgb(107,114,128)' }}>Jan 1 – Apr 24</span>}
                {opt === 'QTD' && <span style={{ marginLeft: 'auto', fontSize: 9, color: 'rgb(107,114,128)' }}>Apr 1 – Apr 24</span>}
                {opt === 'MTD' && <span style={{ marginLeft: 'auto', fontSize: 9, color: 'rgb(107,114,128)' }}>Apr 1 – Apr 24</span>}
                {opt === 'Rolling 12' && <span style={{ marginLeft: 'auto', fontSize: 9, color: 'rgb(107,114,128)' }}>May '25 – Apr '26</span>}
              </button>
            );
          })}
          {customOpen && (
            <div style={{ marginTop:6, paddingTop:10, borderTop:'1px solid rgba(75,85,99,0.35)', padding:'10px 8px 4px' }}>
              <div style={{ display:'grid', gridTemplateColumns:'auto 1fr 1fr', gap:6, alignItems:'center' }}>
                <span style={{ fontFamily:'Inter', fontSize:10, color:'rgb(107,114,128)', textTransform:'uppercase', letterSpacing:0.5 }}>From</span>
                <MiniSelect value={fromM} options={MONTHS} onChange={setFromM} />
                <MiniSelect value={fromY} options={YEARS} onChange={setFromY} />
                <span style={{ fontFamily:'Inter', fontSize:10, color:'rgb(107,114,128)', textTransform:'uppercase', letterSpacing:0.5 }}>To</span>
                <MiniSelect value={toM} options={MONTHS} onChange={setToM} />
                <MiniSelect value={toY} options={YEARS} onChange={setToY} />
              </div>
              <button onClick={() => { setOpen(false); setCustomOpen(false); onChange && onChange(`Custom · ${fromM} '${fromY.slice(2)} – ${toM} '${toY.slice(2)}`); }} style={{
                width:'100%', marginTop:10, height:30, borderRadius:6, border:'1px solid rgb(16,185,129)',
                background:'rgb(16,185,129)', color:'#fff', fontFamily:'Inter', fontSize:12, fontWeight:600, cursor:'pointer',
              }}>Apply range</button>
            </div>
          )}
        </div>
      )}
    </div>
    </div>
  );
}

function MiniSelect({ value, options, onChange }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={{
      height:26, borderRadius:5, border:'1px solid rgba(75,85,99,0.6)', background:'rgb(11,21,36)',
      color:'rgb(229,231,235)', fontFamily:'Inter', fontSize:11.5, padding:'0 4px', cursor:'pointer',
    }}>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

/* Glass card wrapper */
function Tile({ children, style, title, subtitle, right, center, titleRight, pad = 20 }) {
  const hasHeader = title || right || center || titleRight;
  const noBodyPad = pad === 0;
  return (
    <div style={{
      background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(75,85,99,0.4)',
      borderRadius: 12, padding: noBodyPad ? 0 : pad, display: 'flex', flexDirection: 'column', minWidth: 0,
      boxShadow: '0 1px 0 0 rgba(255,255,255,0.03) inset',
      ...style,
    }}>
      {hasHeader && (
        <div style={{
          display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, minWidth: 0,
          padding: noBodyPad ? '16px 20px 12px' : 0,
          marginBottom: noBodyPad ? 0 : 14,
          borderBottom: noBodyPad ? '1px solid rgba(75,85,99,0.25)' : 'none',
        }}>
          <div style={{ minWidth: 0 }}>
            {(title || titleRight) && <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              {title && <div style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 13.5, color: 'rgb(249,250,251)', whiteSpace: 'nowrap' }}>{title}</div>}
              {titleRight}
            </div>}
            {subtitle && <div style={{ fontFamily: 'Inter', fontSize: 11, color: 'rgb(163,163,163)', marginTop: 2 }}>{subtitle}</div>}
          </div>
          {center && <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>{center}</div>}
          {right}
        </div>
      )}
      {children}
    </div>
  );
}

/* Tab-style pill selector used on the right of tile headers */
function TabPills({ options, value, onChange, labels }) {
  return (
    <div style={{
      display: 'inline-flex', flexWrap: 'wrap', padding: 2, borderRadius: 6,
      background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(75,85,99,0.4)',
    }}>
      {options.map(o => (
        <button key={o} onClick={() => onChange && onChange(o)} style={{
          height: 22, padding: '0 10px', borderRadius: 4, border: 'none',
          background: value === o ? 'rgba(255,255,255,0.08)' : 'transparent',
          color: value === o ? 'rgb(249,250,251)' : 'rgb(163,163,163)',
          fontFamily: 'Inter', fontSize: 11, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap',
        }}>{(labels && labels[o]) || o}</button>
      ))}
    </div>
  );
}

function AIFab({ onClick }) {
  return (
    <button onClick={onClick} style={{
      position: 'fixed', right: 24, bottom: 24, zIndex: 50,
      width: 48, height: 48, borderRadius: 10, border: 'none',
      background: 'rgb(16,185,129)', color: '#fff', cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.4), 0 0 0 4px rgba(16,185,129,0.18)',
    }}>
      <i className="fa-solid fa-wand-magic-sparkles" style={{ fontSize: 18 }} />
    </button>
  );
}

/* Shared vehicle filter chips — used on Management + Opportunity dashboards.
   `selected` is an array of vehicle labels (subset of options). onToggle(label) flips one. */
const VEHICLE_CHIP_DEFS = [
  { l:'MF',       c:'rgb(52,211,153)' },
  { l:'ETF',      c:'rgb(120,160,230)' },
  { l:'SMA',      c:'rgb(180,150,235)' },
  { l:'Privates', c:'rgb(245,200,90)' },
];

function VehicleFilterChips({ selected, onToggle, options, showLabel = true, compact = false }) {
  const sel = selected || [];
  const defs = (options || VEHICLE_CHIP_DEFS);
  const anySelected = sel.length > 0;
  return (
    <div style={{ display:'inline-flex', alignItems:'center', gap:8 }}>
      {showLabel && (
        <span style={{ fontFamily:'Inter', fontSize:10.5, fontWeight:600, color:'rgb(163,163,163)', textTransform:'uppercase', letterSpacing:0.4 }}>
          Vehicle
        </span>
      )}
      <div style={{ display:'inline-flex', gap:4, alignItems:'center', flexWrap:'wrap' }}>
        {defs.map(it => {
          const isOn = sel.includes(it.l);
          const dim = anySelected && !isOn;
          return <VehiclePillChip key={it.l} label={it.l} color={it.c} on={isOn} dim={dim} compact={compact} onClick={() => onToggle && onToggle(it.l)} />;
        })}
        {anySelected && (
          <button onClick={() => { sel.slice().forEach(v => onToggle && onToggle(v)); }} title="Clear vehicle filter" style={{
            marginLeft:2, background:'transparent', border:'none',
            color:'rgb(107,114,128)', fontFamily:'Inter', fontSize:10, cursor:'pointer',
            padding:'2px 4px',
          }}>Clear</button>
        )}
      </div>
    </div>
  );
}

function VehiclePillChip({ label, color, on, dim, compact, onClick }) {
  const [hover, setHover] = React.useState(false);
  const h = compact ? 22 : 24;
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display:'inline-flex', alignItems:'center', gap:5,
        height: h, padding: on ? '0 8px 0 7px' : '0 9px',
        borderRadius:9999,
        background: on ? color : (hover ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)'),
        border: on ? `1px solid ${color}` : `1px solid ${hover ? 'rgba(255,255,255,0.25)' : 'rgba(75,85,99,0.55)'}`,
        color: on ? 'rgb(15,23,36)' : (dim ? 'rgb(107,114,128)' : 'rgb(229,231,235)'),
        fontFamily:'Inter', fontSize: compact ? 10.5 : 11, fontWeight: on ? 700 : 500,
        cursor:'pointer',
        opacity: dim ? 0.55 : 1,
        boxShadow: on ? `0 0 0 2px ${color}33` : 'none',
        transform: hover && !on ? 'translateY(-0.5px)' : 'none',
        transition: 'background .12s, border-color .12s, transform .12s, opacity .15s, color .12s',
      }}>
      {on
        ? <i className="fa-solid fa-check" style={{ fontSize:9, color:'rgb(15,23,36)' }} />
        : <span style={{ width:8, height:8, borderRadius:9999, background: color, opacity: dim ? 0.5 : 1 }} />
      }
      {label}
    </button>
  );
}

/* Dimension swap control — lets the user re-pivot any grid or chart. */
/* variant='title' renders the tile's title itself as the trigger — the title
   names the current pivot and the chevron opens the swap menu. */
function DimensionPicker({ value, options, onChange, label = 'Dimension', variant, suffix = '' }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  const menuRef = React.useRef(null);
  React.useEffect(() => {
    if (!open) return;
    const close = (e) => {
      const inBtn = btnRef.current && btnRef.current.contains(e.target);
      const inMenu = menuRef.current && menuRef.current.contains(e.target);
      if (!inBtn && !inMenu) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);
  const current = options.find(o => o.key === value) || options[0];
  // The menu is fixed-positioned and portalled to <body>: tiles clip their
  // overflow, so an absolutely-positioned menu gets cut off inside them.
  const btnRef = React.useRef(null);
  const [pos, setPos] = React.useState(null);
  React.useLayoutEffect(() => {
    if (!open || !btnRef.current) { setPos(null); return; }
    const place = () => {
      const b = btnRef.current.getBoundingClientRect();
      const W = 190, H = Math.min(280, 44 + options.length * 32);
      setPos({
        left: Math.max(8, Math.min(variant === 'title' ? b.left : b.right - W, window.innerWidth - W - 8)),
        top: b.bottom + 4 + H > window.innerHeight - 8 ? Math.max(8, b.top - H - 4) : b.bottom + 4,
        width: W,
      });
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => { window.removeEventListener('resize', place); window.removeEventListener('scroll', place, true); };
  }, [open, options.length, variant]);
  return (
    <div ref={ref} style={{ position:'relative' }}>
      {variant === 'title' ? (
        <button ref={btnRef} onClick={() => setOpen(o => !o)} title={`Swap ${label.toLowerCase()}`} style={{
          padding:0, border:'none', background:'transparent', cursor:'pointer',
          fontFamily:'Inter', fontWeight:600, fontSize:13.5,
          color: open ? 'rgb(110,240,180)' : 'rgb(249,250,251)',
          display:'inline-flex', alignItems:'center', gap:6, whiteSpace:'nowrap',
        }}>
          {(current ? current.label : '—') + suffix}
          <i className={`fa-solid ${open ? 'fa-chevron-up' : 'fa-chevron-down'}`} style={{ fontSize:9, color:'rgb(107,114,128)' }} />
        </button>
      ) : (
        <button ref={btnRef} onClick={() => setOpen(o => !o)} title={`Swap ${label.toLowerCase()}`} style={{
          height:22, padding:'0 8px', borderRadius:5, cursor:'pointer',
          border:`1px solid ${open ? 'rgb(16,185,129)' : 'rgba(75,85,99,0.5)'}`,
          background: open ? 'rgba(16,185,129,0.12)' : 'rgba(0,0,0,0.3)',
          color:'rgb(229,231,235)', fontFamily:'Inter', fontSize:11, fontWeight:500,
          display:'inline-flex', alignItems:'center', gap:6,
        }}>
          <i className="fa-solid fa-right-left" style={{ fontSize:9, color:'rgb(107,114,128)' }} />
          {current ? current.label : '—'}
          <i className={`fa-solid ${open ? 'fa-chevron-up' : 'fa-chevron-down'}`} style={{ fontSize:8 }} />
        </button>
      )}
      {open && pos && ReactDOM.createPortal((
        <div ref={menuRef} style={{
          position:'fixed', left:pos.left, top:pos.top, width:pos.width, zIndex:600,
          background:'rgb(17,24,39)', border:'1px solid rgba(75,85,99,0.6)', borderRadius:8,
          boxShadow:'0 12px 32px rgba(0,0,0,0.45)', padding:4, maxHeight:280, overflowY:'auto',
        }}>
          <div style={{ fontFamily:'Inter', fontSize:9.5, color:'rgb(107,114,128)', textTransform:'uppercase', letterSpacing:0.6, padding:'6px 10px 4px' }}>{label}</div>
          {options.map(o => {
            const sel = o.key === value;
            return (
              <button key={o.key} onClick={() => { setOpen(false); onChange && onChange(o.key); }} style={{
                width:'100%', textAlign:'left', padding:'7px 10px', borderRadius:5,
                background: sel ? 'rgba(16,185,129,0.18)' : 'transparent', border:'none',
                color: sel ? 'rgb(110,240,180)' : 'rgb(229,231,235)',
                fontFamily:'Inter', fontSize:11.5, fontWeight: sel ? 600 : 500, cursor:'pointer',
              }}
              onMouseEnter={e => { if (!sel) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
              onMouseLeave={e => { if (!sel) e.currentTarget.style.background = 'transparent'; }}
              >{o.label}</button>
            );
          })}
        </div>
      ), document.body)}
    </div>
  );
}

Object.assign(window, { TopBar, SelectionChip, Tile, TabPills, AIFab, PeriodDropdown, VehicleFilterChips, DimensionPicker, MiniSelect, SOURCE_COVERAGE, UNIFIED_MAX_PERIOD });
