/* Filter drawer + row drill-in drawer */

const DEFAULT_FILTERS = {
  regions: [],
  channels: [],
  vehicles: [],
  advantage: [],
  salespeople: [],
  categories: [],
  focus: [],
  firms: [],
  offices: [],
  teams: [],
  advisors: [],
  aumMax: 200, // $B
};

/* Option universes. High-cardinality dimensions get searchable dropdowns;
   low-cardinality ones stay as pills. */
const FO_SALESPEOPLE = ['John Doe','John Smith','John Roe','Robert Jones','Jane Doe','Jane Smith','Jane Roe','Mary Doe','Mark Smith','Sarah Roe','Michael Brown','Emily Brown','Chris Public','Linda Jones','Pat Public','Alex Sample','Sam Sample'];
const FO_FIRMS = ['Contoso Wealth','Northwind Securities','Fabrikam Financial','Adatum Partners','Litware Advisors','Tailspin Capital','Proseware Group','Wingtip RIA','Trey Trust'];
const FO_CATEGORIES = ['Large Growth','Large Value','Foreign Large Blend','Mid-Cap Growth','Global Large Stock','Diversified Emerging','Int. Core-Plus','Muni National Long','Small Growth','Multi-sector Bond','Private Credit','High Yield Bond','Real Estate','Short-Term Bond','Moderate Allocation'];
const FO_FOCUS = ['Core Equity Focus','Fixed Income Focus','International Focus','Alternatives Focus','Model Portfolio Focus','ESG Focus'];
const FO_OFFICES = ['New York – Park Ave','Boston – Seaport','Philadelphia – Center City','Atlanta – Buckhead','Charlotte – Uptown','Miami – Brickell','Chicago – Loop','Minneapolis – Downtown','Detroit – Troy','Dallas – Uptown','Houston – Galleria','Phoenix – Camelback','San Francisco – FiDi','Los Angeles – Century City','Seattle – Bellevue','Denver – Cherry Creek'];
const FO_TEAMS = ['The Doe Wealth Group','The Smith Group','Doe & Roe Advisors','Sample Consulting','The Smith Group II','Alpine Partners','The Brown Group','Summit Advisory','Keystone Wealth','Harbor Point Group'];
const FO_ADVISORS = ['Jane Smith','John Doe','Mary Roe','Robert Sample','Linda Public','Mark Jones','Emily Doe','Chris Brown','Pat Smith','Sarah Public','Alex Roe','Sam Jones'];

function FilterDrawer({ open, onClose, filters, onChange, onApply, onReset, renderSections, arrayKeys, defaults, chipLabel, focus, onFocusChange }) {
  const [local, setLocal] = React.useState(filters);
  const [lf, setLf] = React.useState(focus);
  React.useEffect(() => { if (open) { setLocal(filters); setLf(focus); } }, [open]);

  const toggle = (key, val) => {
    const arr = local[key] || [];
    const next = arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];
    setLocal({ ...local, [key]: next });
  };
  const setMany = (key, vals) => setLocal({ ...local, [key]: vals });

  const ARRAY_KEYS = arrayKeys || ['regions','channels','vehicles','advantage','salespeople','categories','focus','firms','offices','teams','advisors'];
  const BASE = defaults || DEFAULT_FILTERS;
  const boolKeys = Object.keys(BASE).filter(k => typeof BASE[k] === 'boolean');
  const activeCount = ARRAY_KEYS.reduce((n, k) => n + ((local[k] || []).length), 0)
    + boolKeys.reduce((n, k) => n + (local[k] ? 1 : 0), 0)
    + (local.aumMax !== undefined && local.aumMax < 200 ? 1 : 0);
  const chips = ARRAY_KEYS.flatMap(k => (local[k] || []).map(v => ({ k, v })));

  return (
    <>
      <div onClick={onClose} style={{
        position:'fixed', inset:0, background:'rgba(0,0,0,0.55)',
        opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none',
        transition: 'opacity .22s ease-out', zIndex: 90,
      }} />
      <aside style={{
        position:'fixed', top:0, right:0, bottom:0, width: 420, zIndex: 100,
        background:'rgb(17,24,39)', borderLeft:'1px solid rgba(75,85,99,0.6)',
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform .26s cubic-bezier(.2,.8,.2,1)',
        display:'flex', flexDirection:'column', boxShadow: open ? '-20px 0 60px rgba(0,0,0,0.5)' : 'none', visibility: open ? 'visible' : 'hidden', transitionProperty: 'transform, visibility', transitionDelay: open ? '0s' : '0s, .26s',
      }}>
        <div style={{ padding:'18px 22px', borderBottom:'1px solid rgba(75,85,99,0.4)', display:'flex', alignItems:'center', gap:10 }}>
          <i className="fa-solid fa-filter" style={{ color:'rgb(52,211,153)' }} />
          <div style={{ fontFamily:'Geist, Inter', fontWeight:700, fontSize:16, color:'rgb(249,250,251)' }}>Filters</div>
          {activeCount > 0 && (
            <span style={{ background:'rgb(16,185,129)', color:'#fff', fontFamily:'Inter', fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:9999 }}>{activeCount}</span>
          )}
          <div style={{ flex:1 }} />
          <button onClick={onClose} style={{
            width:28, height:28, border:'1px solid rgba(75,85,99,0.5)', borderRadius:6,
            background:'transparent', color:'rgb(163,163,163)', cursor:'pointer',
          }}><i className="fa-solid fa-xmark" /></button>
        </div>

        {chips.length > 0 && (
          <div style={{ padding:'10px 22px', borderBottom:'1px solid rgba(75,85,99,0.3)', display:'flex', flexWrap:'wrap', gap:6, maxHeight:120, overflowY:'auto' }}>
            {chips.map(({k,v}) => (
              <span key={`${k}-${v}`} style={{
                display:'inline-flex', alignItems:'center', gap:6, padding:'3px 8px', borderRadius:9999,
                background:'rgba(16,185,129,0.18)', border:'1px solid rgba(16,185,129,0.5)',
                fontFamily:'Inter', fontSize:10.5, color:'rgb(110,240,180)',
              }}>
                {chipLabel ? chipLabel(k, v) : v}
                <i className="fa-solid fa-xmark" onClick={() => toggle(k, v)} style={{ fontSize:8.5, cursor:'pointer', opacity:0.75 }} />
              </span>
            ))}
          </div>
        )}

        <div style={{ flex:1, overflowY:'auto', padding:'18px 22px', display:'flex', flexDirection:'column', gap:20 }}>
          {focus && lf && <FocusCategoriesSection value={lf} onChange={setLf} />}
          {renderSections ? renderSections({ local, toggle, setMany }) : (
          <>
          <FilterGroupLabel>Territory</FilterGroupLabel>
          <FilterSection label="Region" options={['Northeast','Southeast','Midwest','Southwest','West']}
            selected={local.regions} onToggle={(v) => toggle('regions', v)} />

          <FilterSection label="Channel" options={['Wires','IBD','RIA','Bank','DCIO']}
            selected={local.channels} onToggle={(v) => toggle('channels', v)} />

          <FilterSectionVehicleChips selected={local.vehicles}
            onToggle={(v) => toggle('vehicles', v)} />

          <FilterSection label="Competitive Advantage" options={['Strong (2–3 ★)','Moderate (1–2 ★)','Low (< 1 ★)']}
            selected={local.advantage} onToggle={(v) => toggle('advantage', v)} />

          <FilterGroupLabel>Distribution</FilterGroupLabel>
          <SearchMultiSelect label="Salesperson" placeholder="All salespeople" options={FO_SALESPEOPLE} selected={local.salespeople} onChange={(v) => setMany('salespeople', v)} />
          <SearchMultiSelect label="Firm" placeholder="All firms" options={FO_FIRMS} selected={local.firms} onChange={(v) => setMany('firms', v)} />
          <SearchMultiSelect label="Office" placeholder="All offices" options={FO_OFFICES} selected={local.offices} onChange={(v) => setMany('offices', v)} />
          <SearchMultiSelect label="Team" placeholder="All teams" options={FO_TEAMS} selected={local.teams} onChange={(v) => setMany('teams', v)} />
          <SearchMultiSelect label="Financial Advisor" placeholder="All financial advisors" options={FO_ADVISORS} selected={local.advisors} onChange={(v) => setMany('advisors', v)} />

          <FilterGroupLabel>Product</FilterGroupLabel>
          <SearchMultiSelect label="Category" placeholder="All categories" hint="Morningstar-equivalent — named generically pending licensing" options={FO_CATEGORIES} selected={local.categories} onChange={(v) => setMany('categories', v)} />

          <div>
            <div style={filterLabelStyle}>AUM Range (max)</div>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginTop: 4 }}>
              <input
                type="range" min="5" max="200" step="5"
                value={local.aumMax}
                onChange={(e) => setLocal({ ...local, aumMax: parseInt(e.target.value,10) })}
                style={{ flex:1, accentColor:'rgb(16,185,129)' }}
              />
              <span style={{ fontFamily:'Inter', fontSize:12, fontWeight:600, color:'rgb(52,211,153)', fontVariantNumeric:'tabular-nums', minWidth:48, textAlign:'right' }}>${local.aumMax}B</span>
            </div>
          </div>

          <div style={{
            padding:'10px 12px', borderRadius:8, background:'rgba(255,255,255,0.03)',
            border:'1px dashed rgba(75,85,99,0.5)', fontFamily:'Inter', fontSize:10.5, lineHeight:1.55, color:'rgb(163,163,163)',
          }}>
            Time period is set from the toolbar control, not here. Further dimensions arrive with live data: private wealth flag, confidence level (Actual vs. FA attribution), FA total AUM bands.
          </div>
          </>
          )}
        </div>

        <div style={{ padding:'14px 22px', borderTop:'1px solid rgba(75,85,99,0.4)', display:'flex', gap:10 }}>
          <button onClick={() => { setLocal(BASE); if (focus) setLf({ on: true, cats: [...FOCUS_STRATEGIES] }); onReset && onReset(); }} style={{
            flex:1, height:38, borderRadius:8,
            border:'1px solid rgba(75,85,99,0.6)', background:'transparent',
            color:'rgb(209,213,219)', fontFamily:'Inter', fontSize:13, fontWeight:500, cursor:'pointer',
          }}>Reset</button>
          <button onClick={() => { onChange(local); if (focus && onFocusChange) onFocusChange(lf); onApply && onApply(); }} style={{
            flex:2, height:38, borderRadius:8,
            border:'1px solid rgb(16,185,129)', background:'rgb(16,185,129)',
            color:'#fff', fontFamily:'Inter', fontSize:13, fontWeight:600, cursor:'pointer',
          }}>Apply Filters</button>
        </div>
      </aside>
    </>
  );
}

/* Focus categories sit first in every drawer: they scope the whole dashboard,
   on by default. Pick categories one by one or by focus effort. */
function FocusCategoriesSection({ value, onChange }) {
  const all = FOCUS_STRATEGIES;
  const cats = value.cats && value.cats.length ? value.cats : all;
  const on = value.on;
  const set = (patch) => onChange({ ...value, ...patch });
  const togCat = (c) => {
    const next = cats.includes(c) ? cats.filter(x => x !== c) : [...cats, c];
    set({ on: true, cats: next.length ? all.filter(x => next.includes(x)) : cats });
  };
  const groupOn = (g) => on && g.cats.every(c => cats.includes(c)) && cats.length === g.cats.length;
  const seg = (k, label) => {
    const act = (k === 'focus') === on;
    return (
      <button key={k} onClick={() => set({ on: k === 'focus' })} style={{
        flex: 1, height: 30, borderRadius: 6, border: 'none', cursor: 'pointer',
        background: act ? 'rgba(16,185,129,0.2)' : 'transparent', color: act ? 'rgb(52,211,153)' : 'rgb(209,213,219)',
        fontFamily: 'Inter', fontSize: 12, fontWeight: act ? 600 : 500,
      }}>{label}</button>
    );
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 14, borderRadius: 10, border: '1px solid rgba(16,185,129,0.35)', background: 'rgba(16,185,129,0.05)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <i className="fa-solid fa-star" style={{ fontSize: 10, color: 'rgb(52,211,153)' }} />
        <span style={{ fontFamily: 'Inter', fontSize: 12, fontWeight: 600, color: 'rgb(249,250,251)', flex: 1 }}>Focus categories</span>
        <span style={{ fontFamily: 'Inter', fontSize: 10.5, color: 'rgb(156,163,175)' }}>Default</span>
      </div>
      <div style={{ display: 'flex', padding: 3, gap: 3, borderRadius: 8, background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(75,85,99,0.5)' }}>
        {seg('focus', 'Focus categories')}{seg('all', 'All products')}
      </div>
      <div style={{ opacity: on ? 1 : 0.5, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <div style={filterLabelStyle}>By focus effort</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {FOCUS_GROUPS.map(g => {
              const act = groupOn(g);
              return (
                <button key={g.key} title={g.desc} onClick={() => set({ on: true, cats: act ? [...all] : [...g.cats] })} style={{
                  height: 28, padding: '0 11px', borderRadius: 9999, cursor: 'pointer',
                  border: `1px solid ${act ? 'rgb(16,185,129)' : 'rgba(75,85,99,0.6)'}`, background: act ? 'rgba(16,185,129,0.18)' : 'transparent',
                  color: act ? 'rgb(52,211,153)' : 'rgb(209,213,219)', fontFamily: 'Inter', fontSize: 11.5, fontWeight: act ? 600 : 500,
                }}>{g.key}</button>
              );
            })}
          </div>
        </div>
        <div>
          <div style={{ ...filterLabelStyle, display: 'flex' }}><span style={{ flex: 1 }}>Categories</span><span style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 400 }}>{on ? `${cats.length} of ${all.length}` : 'Off'}</span></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {all.map(c => {
              const act = on && cats.includes(c);
              return (
                <button key={c} onClick={() => togCat(c)} style={{
                  width: '100%', textAlign: 'left', padding: '7px 8px', borderRadius: 6, border: 'none', cursor: 'pointer',
                  background: act ? 'rgba(16,185,129,0.10)' : 'transparent', display: 'flex', alignItems: 'center', gap: 9,
                  fontFamily: 'Inter', fontSize: 12, color: act ? 'rgb(249,250,251)' : 'rgb(163,163,163)',
                }}>
                  <span style={{ width: 14, height: 14, borderRadius: 3, flexShrink: 0, border: `1px solid ${act ? 'rgb(16,185,129)' : 'rgba(107,114,128,0.7)'}`, background: act ? 'rgb(16,185,129)' : 'transparent', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    {act && <i className="fa-solid fa-check" style={{ fontSize: 8, color: '#fff' }} />}
                  </span>
                  <span style={{ flex: 1 }}>{c}</span>
                  <span style={{ fontSize: 10, color: 'rgb(107,114,128)' }}>{FOCUS_GROUP_OF[c]}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div style={{ fontFamily: 'Inter', fontSize: 10.5, lineHeight: 1.5, color: 'rgb(156,163,175)' }}>Opportunity, sales, market share, activity and signals all count only the categories chosen, so actuals compare like for like with where the team is focused.</div>
    </div>
  );
}

const filterLabelStyle = {
  fontFamily:'Inter', fontSize:10, fontWeight:600, color:'rgb(163,163,163)',
  textTransform:'uppercase', letterSpacing:0.6, marginBottom:8,
};

function FilterGroupLabel({ children }) {
  return (
    <div style={{
      fontFamily:'Inter', fontSize:10, fontWeight:700, color:'rgb(52,211,153)',
      textTransform:'uppercase', letterSpacing:1, paddingBottom:6,
      borderBottom:'1px solid rgba(16,185,129,0.25)', marginBottom:-6,
    }}>{children}</div>
  );
}

/* Searchable multi-select — for dimensions with too many members for pills. */
function SearchMultiSelect({ label, hint, options, selected, onChange, placeholder }) {
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState('');
  const ref = React.useRef(null);
  const sel = selected || [];
  React.useEffect(() => {
    if (!open) return;
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setQ(''); } };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);
  const matches = options.filter(o => o.toLowerCase().includes(q.trim().toLowerCase()));
  const toggle = (o) => onChange(sel.includes(o) ? sel.filter(x => x !== o) : [...sel, o]);
  const summary = sel.length === 0 ? (placeholder || `All ${label.toLowerCase()}`)
    : sel.length === 1 ? sel[0]
    : `${sel.length} selected`;
  return (
    <div ref={ref} style={{ position:'relative' }}>
      <div style={{ ...filterLabelStyle, marginBottom:6, display:'flex', alignItems:'center', gap:6 }}>
        {label}
        {sel.length > 0 && <span style={{ background:'rgba(16,185,129,0.25)', color:'rgb(110,240,180)', fontSize:9, fontWeight:700, padding:'1px 6px', borderRadius:9999 }}>{sel.length}</span>}
      </div>
      {hint && <div style={{ fontFamily:'Inter', fontSize:10, color:'rgb(107,114,128)', marginTop:-4, marginBottom:6 }}>{hint}</div>}
      <button onClick={() => setOpen(o => !o)} style={{
        width:'100%', height:34, padding:'0 10px', borderRadius:7, cursor:'pointer',
        border:`1px solid ${open ? 'rgb(16,185,129)' : 'rgba(75,85,99,0.55)'}`,
        background: 'rgba(0,0,0,0.3)',
        color: sel.length ? 'rgb(249,250,251)' : 'rgb(107,114,128)',
        fontFamily:'Inter', fontSize:12, textAlign:'left',
        display:'flex', alignItems:'center', gap:8,
      }}>
        <i className="fa-solid fa-magnifying-glass" style={{ fontSize:10, color:'rgb(107,114,128)' }} />
        <span style={{ flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{summary}</span>
        <i className={`fa-solid ${open ? 'fa-chevron-up' : 'fa-chevron-down'}`} style={{ fontSize:9, color:'rgb(107,114,128)' }} />
      </button>
      {open && (
        <div style={{
          position:'absolute', top:'100%', left:0, right:0, marginTop:4, zIndex:30,
          background:'rgb(20,28,42)', border:'1px solid rgba(75,85,99,0.7)', borderRadius:8,
          boxShadow:'0 14px 34px rgba(0,0,0,0.5)', overflow:'hidden',
        }}>
          <div style={{ padding:8, borderBottom:'1px solid rgba(75,85,99,0.35)' }}>
            <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder={`Search ${label.toLowerCase()}…`} style={{
              width:'100%', height:30, boxSizing:'border-box', padding:'0 10px', borderRadius:6,
              border:'1px solid rgba(75,85,99,0.55)', background:'rgba(0,0,0,0.4)',
              color:'rgb(249,250,251)', fontFamily:'Inter', fontSize:12, outline:'none',
            }} />
          </div>
          <div style={{ maxHeight:200, overflowY:'auto', padding:4 }}>
            {matches.length === 0 && (
              <div style={{ padding:'10px 10px', fontFamily:'Inter', fontSize:11.5, color:'rgb(107,114,128)' }}>No matches</div>
            )}
            {matches.map(o => {
              const on = sel.includes(o);
              return (
                <button key={o} onClick={() => toggle(o)} style={{
                  width:'100%', textAlign:'left', padding:'7px 8px', borderRadius:5, border:'none',
                  background: on ? 'rgba(16,185,129,0.15)' : 'transparent',
                  color: on ? 'rgb(110,240,180)' : 'rgb(229,231,235)',
                  fontFamily:'Inter', fontSize:11.5, cursor:'pointer',
                  display:'flex', alignItems:'center', gap:8,
                }}
                onMouseEnter={e => { if (!on) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                onMouseLeave={e => { if (!on) e.currentTarget.style.background = 'transparent'; }}
                >
                  <span style={{
                    width:13, height:13, borderRadius:3, flexShrink:0,
                    border:`1px solid ${on ? 'rgb(16,185,129)' : 'rgba(107,114,128,0.7)'}`,
                    background: on ? 'rgb(16,185,129)' : 'transparent',
                    display:'inline-flex', alignItems:'center', justifyContent:'center',
                  }}>{on && <i className="fa-solid fa-check" style={{ fontSize:7.5, color:'#fff' }} />}</span>
                  {o}
                </button>
              );
            })}
          </div>
          <div style={{ display:'flex', gap:8, padding:'8px 10px', borderTop:'1px solid rgba(75,85,99,0.35)' }}>
            <button onClick={() => onChange(matches)} style={smsFootBtn}>Select all{q ? ' matching' : ''}</button>
            <button onClick={() => onChange([])} style={smsFootBtn}>Clear</button>
            <span style={{ marginLeft:'auto', fontFamily:'Inter', fontSize:10, color:'rgb(107,114,128)' }}>{matches.length} of {options.length}</span>
          </div>
        </div>
      )}
    </div>
  );
}

const smsFootBtn = {
  background:'transparent', border:'none', padding:0,
  color:'rgb(52,211,153)', fontFamily:'Inter', fontSize:10.5, fontWeight:500, cursor:'pointer',
};

function FilterSectionVehicleChips({ selected, onToggle }) {
  // Translate drawer's verbose labels ↔ chip's short labels
  const labelToChip = { 'Mutual Fund':'MF', 'ETF':'ETF', 'SMA':'SMA', 'Privates':'Privates', 'Model':'Model' };
  const chipToLabel = { 'MF':'Mutual Fund', 'ETF':'ETF', 'SMA':'SMA', 'Privates':'Privates', 'Model':'Model' };
  const sel = (selected || []).map(s => labelToChip[s] || s);
  return (
    <div>
      <div style={filterLabelStyle}>Vehicle</div>
      <VehicleFilterChips
        selected={sel}
        onToggle={(chipLabel) => onToggle(chipToLabel[chipLabel] || chipLabel)}
        showLabel={false}
      />
    </div>
  );
}

function FilterSection({ label, options, selected, onToggle }) {  return (
    <div>
      <div style={filterLabelStyle}>{label}</div>
      <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
        {options.map(o => {
          const on = selected.includes(o);
          return (
            <button key={o} onClick={() => onToggle(o)} style={{
              padding:'6px 12px', borderRadius:9999,
              border:`1px solid ${on ? 'rgb(16,185,129)' : 'rgba(75,85,99,0.5)'}`,
              background: on ? 'rgba(16,185,129,0.2)' : 'transparent',
              color: on ? 'rgb(52,211,153)' : 'rgb(209,213,219)',
              fontFamily:'Inter', fontSize:12, fontWeight: on ? 500 : 400, cursor:'pointer',
              display:'inline-flex', alignItems:'center', gap:6, transition:'all .12s',
            }}>
              {on && <i className="fa-solid fa-check" style={{ fontSize:9 }} />}
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* --- Row drill-in drawer --- */

function RowDrawer({ open, onClose, title, subtitle, data }) {
  if (!open) return null;

  const meta = data?.meta || {};
  const sumAum = data?.summary?.aum;
  const sumIn  = data?.summary?.inflow;
  const sumNf  = data?.summary?.netflow;
  const aumRows = data?.drill?.aum || [];
  const inRows  = data?.drill?.inflow || [];
  const nfRows  = data?.drill?.netflow || [];

  const C_AUM = 'rgb(52,211,153)';
  const C_IN  = 'rgb(96,165,250)';
  const C_NF  = 'rgb(249,115,22)';

  return (
    <div onClick={onClose} style={{
      position:'fixed', inset:0, background:'rgba(5,10,18,0.78)', backdropFilter:'blur(8px)',
      display:'flex', alignItems:'center', justifyContent:'center', zIndex:200,
      animation:'rdFade .18s ease-out',
    }}>
      <style>{`
        @keyframes rdFade  { from{opacity:0} to{opacity:1} }
        @keyframes rdScale { from{opacity:0; transform:translateY(8px) scale(.98)} to{opacity:1; transform:none} }
      `}</style>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: 'min(1080px, 96vw)', maxHeight: '92vh',
        background:'rgb(13,20,32)', border:'1px solid rgba(75,85,99,0.5)',
        borderRadius:14,
        boxShadow:'0 40px 120px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.02) inset',
        display:'flex', flexDirection:'column',
        animation:'rdScale .22s cubic-bezier(.2,.8,.2,1)',
        overflow:'hidden',
      }}>
        {/* Header */}
        <div style={{ padding:'18px 22px', borderBottom:'1px solid rgba(75,85,99,0.4)', display:'flex', alignItems:'center', gap:14 }}>
          <div style={{
            width:44, height:44, borderRadius:'50%',
            background: meta.color || 'rgb(52,211,153)',
            color:'#0b1220', fontFamily:'Inter', fontWeight:700, fontSize:14,
            display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
          }}>{meta.init || (title || '').slice(0,2).toUpperCase()}</div>
          <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
            <div style={{ fontFamily:'Geist, Inter', fontWeight:700, fontSize:20, color:'rgb(249,250,251)', letterSpacing:-0.2 }}>{title}</div>
            <div style={{ fontFamily:'Inter', fontSize:12, color:'rgb(163,163,163)' }}>{subtitle}</div>
          </div>
          <div style={{ flex:1 }} />
          {meta.region && (
            <div style={{
              padding:'5px 11px', borderRadius:999, border:'1px solid rgba(96,165,250,0.4)',
              background:'rgba(96,165,250,0.10)', color:'rgb(147,197,253)',
              fontFamily:'Inter', fontSize:11, fontWeight:500,
              display:'inline-flex', alignItems:'center', gap:6,
            }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:'rgb(96,165,250)' }} />
              {meta.region}
            </div>
          )}
          {meta.firms && (
            <div style={{
              padding:'5px 11px', borderRadius:999, border:'1px solid rgba(75,85,99,0.5)',
              background:'rgba(255,255,255,0.03)', color:'rgb(209,213,219)',
              fontFamily:'Inter', fontSize:11, fontWeight:500,
            }}>{meta.firms}</div>
          )}
          <button onClick={onClose} style={{
            width:30, height:30, border:'1px solid rgba(75,85,99,0.5)', borderRadius:6,
            background:'transparent', color:'rgb(163,163,163)', cursor:'pointer',
            display:'inline-flex', alignItems:'center', justifyContent:'center',
          }}><i className="fa-solid fa-xmark"></i></button>
        </div>

        {/* KPI Ribbon */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr' }}>
          <SummaryCell label="AUM" color={C_AUM} mktOpp={sumAum?.mktOpp} yoursLabel="YOUR AUM" yours={sumAum?.yours} share={sumAum?.share} shareColor={C_AUM} divider />
          <SummaryCell label="INFLOWS" color={C_IN} mktOpp={sumIn?.mktOpp} yoursLabel="INFLOWS" yours={sumIn?.yours} share={sumIn?.share} shareColor={C_IN} divider />
          <SummaryCell label="NET FLOWS" color={C_NF} mktOpp={sumNf?.mktOpp} yoursLabel="NET FLOWS" yours={sumNf?.yours} share={sumNf?.share} shareColor={C_NF} />
        </div>

        {/* Vehicle Breakdown table */}
        <div style={{ flex:1, overflowY:'auto', padding:'18px 22px 16px', display:'flex', flexDirection:'column', gap:10 }}>
          <div style={{ fontFamily:'Inter', fontSize:11, fontWeight:600, color:'rgb(96,165,250)', textTransform:'uppercase', letterSpacing:1 }}>Vehicle Breakdown</div>

          <div style={{ border:'1px solid rgba(75,85,99,0.3)', borderRadius:10, overflow:'hidden', background:'rgba(0,0,0,0.18)' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontFamily:'Inter', fontSize:12 }}>
              <thead>
                {/* Group header row */}
                <tr style={{ background:'rgba(0,0,0,0.25)' }}>
                  <th colSpan={2} style={{ borderBottom:'1px solid rgba(75,85,99,0.3)' }}></th>
                  <th colSpan={3} style={{ textAlign:'center', padding:'10px 0 8px', color:C_AUM, fontFamily:'Inter', fontSize:10, fontWeight:700, letterSpacing:1.2, borderBottom:`2px solid ${C_AUM}` }}>AUM</th>
                  <th colSpan={3} style={{ textAlign:'center', padding:'10px 0 8px', color:C_IN, fontFamily:'Inter', fontSize:10, fontWeight:700, letterSpacing:1.2, borderBottom:`2px solid ${C_IN}` }}>INFLOW</th>
                  <th colSpan={3} style={{ textAlign:'center', padding:'10px 0 8px', color:C_NF, fontFamily:'Inter', fontSize:10, fontWeight:700, letterSpacing:1.2, borderBottom:`2px solid ${C_NF}` }}>NET FLOW</th>
                </tr>
                {/* Sub-header row */}
                <tr style={{ background:'rgba(0,0,0,0.15)' }}>
                  <th style={hSubL}>VEHICLE</th>
                  <th style={hSubL}></th>
                  <th style={hSubR}>MKT OPP</th>
                  <th style={hSubR}>YOURS</th>
                  <th style={hSubR}>MKT SHARE</th>
                  <th style={hSubR}>MKT OPP</th>
                  <th style={hSubR}>YOURS</th>
                  <th style={hSubR}>MKT SHARE</th>
                  <th style={hSubR}>MKT OPP</th>
                  <th style={hSubR}>YOURS</th>
                  <th style={hSubR}>MKT SHARE</th>
                </tr>
              </thead>
              <tbody>
                {aumRows.map((r,i) => {
                  const a = aumRows[i] || {};
                  const inn = inRows[i] || {};
                  const n = nfRows[i] || {};
                  return (
                    <tr key={i} style={{ borderTop:'1px solid rgba(75,85,99,0.18)' }}>
                      <td style={{ padding:'12px 12px 12px 14px', width:64 }}>
                        <span style={{
                          display:'inline-block', padding:'3px 8px', borderRadius:5,
                          background: vehicleBg(r.v), color: vehicleFg(r.v),
                          fontFamily:'Inter', fontSize:10, fontWeight:700, letterSpacing:0.4,
                        }}>{vehicleAbbr(r.v)}</span>
                      </td>
                      <td style={{ padding:'12px 8px', color:'rgb(229,231,235)', fontFamily:'Inter', fontSize:12.5, fontWeight:500, whiteSpace:'nowrap' }}>{vehicleFull(r.v)}</td>

                      <td style={tdNum}>{a.opp || '—'}</td>
                      <td style={tdYours}>{a.val || '—'}</td>
                      <td style={tdShareCell}><ShareBar pct={parsePct(a.shr)} color={C_AUM} label={a.shr} /></td>

                      <td style={tdNum}>{inn.opp || '—'}</td>
                      <td style={tdYours}>{inn.val || '—'}</td>
                      <td style={tdShareCell}><ShareBar pct={parsePct(inn.shr)} color={C_IN} label={inn.shr} /></td>

                      <td style={tdNum}>{n.opp || '—'}</td>
                      <td style={tdYours}>{n.val || '—'}</td>
                      <td style={tdShareCell}><ShareBar pct={parsePct(n.shr)} color={C_NF} label={n.shr} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding:'12px 22px', borderTop:'1px solid rgba(75,85,99,0.4)', display:'flex', alignItems:'center', gap:18, fontFamily:'Inter', fontSize:11, color:'rgb(107,114,128)' }}>
          <LegendItem c={C_AUM} label="AUM" />
          <LegendItem c={C_IN}  label="Inflows" />
          <LegendItem c={C_NF}  label="Net Flows" />
          <div style={{ flex:1 }} />
          <div>All figures in USD · Data as of Q3 2025{meta.region ? ` · ${meta.region} Territory` : ''}</div>
        </div>
      </div>
    </div>
  );
}

const hSubL = { textAlign:'left',  padding:'8px 12px 10px 14px', fontFamily:'Inter', fontSize:9.5, fontWeight:600, color:'rgb(200,205,213)', letterSpacing:0.8, textTransform:'uppercase' };
const hSubR = { textAlign:'right', padding:'8px 10px 10px',      fontFamily:'Inter', fontSize:9.5, fontWeight:600, color:'rgb(200,205,213)', letterSpacing:0.8, textTransform:'uppercase' };
const tdNum    = { padding:'12px 10px', textAlign:'right', color:'rgb(163,163,163)', fontFamily:'Inter', fontSize:12.5, fontVariantNumeric:'tabular-nums' };
const tdYours  = { padding:'12px 10px', textAlign:'right', color:'rgb(249,250,251)', fontFamily:'Inter', fontSize:12.5, fontWeight:600, fontVariantNumeric:'tabular-nums' };
const tdShareCell = { padding:'12px 14px 12px 10px', textAlign:'right', verticalAlign:'middle', minWidth:120 };

function SummaryCell({ label, color, mktOpp, yoursLabel, yours, share, shareColor, divider }) {
  return (
    <div style={{
      padding:'14px 22px 16px', position:'relative',
      borderRight: divider ? '1px solid rgba(75,85,99,0.35)' : 'none',
      background: 'rgba(255,255,255,0.015)',
    }}>
      <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background: color }} />
      <div style={{ fontFamily:'Inter', fontSize:11, fontWeight:700, color:color, textTransform:'uppercase', letterSpacing:1.2, marginBottom:10 }}>{label}</div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', columnGap:14 }}>
        <SummaryStat label="MKT OPP" value={mktOpp} />
        <SummaryStat label={yoursLabel} value={yours} bold />
        <SummaryStat label="MKT SHARE" value={share} color={shareColor} bold />
      </div>
    </div>
  );
}

function SummaryStat({ label, value, color, bold }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
      <div style={{ fontFamily:'Inter', fontSize:9.5, fontWeight:600, color:'rgb(200,205,213)', textTransform:'uppercase', letterSpacing:0.8 }}>{label}</div>
      <div style={{
        fontFamily:'Inter Display, Inter', fontSize:22, fontWeight:700,
        color: color || 'rgb(249,250,251)',
        letterSpacing:-0.5, fontVariantNumeric:'tabular-nums',
      }}>{value || '—'}</div>
    </div>
  );
}

function ShareBar({ pct, color, label }) {
  // pct expected 0..1 of "share" — we visually scale up small numbers so the bar reads
  const w = Math.max(0.06, Math.min(1, pct * 35)); // amplify since shares are <5%
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:5 }}>
      <div style={{ fontFamily:'Inter', fontSize:12, color:'rgb(229,231,235)', fontWeight:500, fontVariantNumeric:'tabular-nums' }}>{label || '—'}</div>
      <div style={{ width:90, height:3, background:'rgba(75,85,99,0.35)', borderRadius:2, overflow:'hidden' }}>
        <div style={{ width: `${w*100}%`, height:'100%', background: color }} />
      </div>
    </div>
  );
}

function LegendItem({ c, label }) {
  return (
    <div style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
      <span style={{ width:7, height:7, borderRadius:'50%', background:c }} />
      <span style={{ color:'rgb(163,163,163)' }}>{label}</span>
    </div>
  );
}

function parsePct(s) {
  if (!s) return 0;
  const n = parseFloat(String(s).replace(/[^0-9.]/g, ''));
  return isNaN(n) ? 0 : n / 100;
}

function vehicleAbbr(v) {
  if (v === 'MF') return 'MF';
  if (v === 'ETF') return 'ETF';
  if (v === 'SMA') return 'SMA';
  if (v === 'Privates' || v === 'Alt' || v === 'PRIV') return 'PRIV';
  return v;
}

function vehicleFull(v) {
  if (v === 'MF') return 'Mutual Fund';
  if (v === 'ETF') return 'Exchange Traded Fund';
  if (v === 'SMA') return 'Separately Managed Acct';
  if (v === 'Privates' || v === 'Alt' || v === 'PRIV') return 'Private Markets';
  return v;
}

function vehicleBg(v) {
  if (v === 'MF') return 'rgba(96,165,250,0.18)';
  if (v === 'ETF') return 'rgba(251,191,36,0.18)';
  if (v === 'SMA') return 'rgba(249,115,22,0.18)';
  if (v === 'Privates' || v === 'Alt' || v === 'PRIV') return 'rgba(167,139,250,0.18)';
  return 'rgba(75,85,99,0.3)';
}
function vehicleFg(v) {
  if (v === 'MF') return 'rgb(147,197,253)';
  if (v === 'ETF') return 'rgb(252,211,77)';
  if (v === 'SMA') return 'rgb(251,146,60)';
  if (v === 'Privates' || v === 'Alt' || v === 'PRIV') return 'rgb(196,181,253)';
  return 'rgb(209,213,219)';
}


function DrawerStat({ label, value, accent, positive }) {
  return (
    <div style={{ padding:'10px 12px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(75,85,99,0.3)', borderRadius:8 }}>
      <div style={{ fontFamily:'Inter', fontSize:9, fontWeight:600, color:'rgb(200,205,213)', textTransform:'uppercase', letterSpacing:0.5 }}>{label}</div>
      <div style={{
        fontFamily:'Inter Display, Inter', fontWeight:700, fontSize:16,
        color: accent ? 'rgb(52,211,153)' : positive ? 'rgb(52,211,153)' : 'rgb(249,250,251)',
        fontVariantNumeric:'tabular-nums', marginTop:2,
      }}>{value}</div>
    </div>
  );
}

function vehicleColor(v) {
  if (v === 'MF') return 'rgb(52,211,153)';
  if (v === 'ETF') return 'rgb(59,130,246)';
  if (v === 'SMA') return 'rgb(139,92,246)';
  if (v === 'Privates') return 'rgb(234,179,8)';
  return 'rgb(163,163,163)';
}

function VehicleStackChart({ rows }) {
  const opts = React.useMemo(() => {
    const cats = rows.map(r => r.v);
    const yourVals = rows.map(r => parseFloat(String(r.val).replace(/[^0-9.]/g,'')) || 0);
    const oppVals = rows.map(r => parseFloat(String(r.opp).replace(/[^0-9.]/g,'')) || 0);
    return {
      chart: { type:'column', height: 200, backgroundColor:'transparent' },
      xAxis: { categories: cats, lineColor:'rgba(75,85,99,0.4)' },
      yAxis: { labels: { style:{ color:'rgb(163,163,163)', fontSize:'10px' } }, gridLineColor:'rgba(75,85,99,0.2)', gridLineDashStyle:'Dash' },
      legend: { enabled:true, itemStyle:{ color:'rgb(163,163,163)', fontSize:'10px', fontWeight:500 } },
      plotOptions: { column: { borderRadius: 2, groupPadding:0.12 } },
      tooltip: { valuePrefix: '$', valueSuffix: 'B' },
      series: [
        { name:'Opportunity', data: oppVals, ...wash('rgb(107,114,128)', 0.18) },
        { name:'Yours',       data: yourVals, ...wash('rgb(16,185,129)') },
      ],
    };
  }, [rows]);
  return <div style={{ height: 200 }}><HC options={opts} /></div>;
}

function TrendChart({ metric }) {
  const opts = React.useMemo(() => {
    const base = metric === 'aum' ? [38, 41, 44, 48] : metric === 'inflow' ? [8.2, 8.9, 9.6, 10.3] : [2.8, 3.1, 3.4, 3.9];
    const mkt  = metric === 'aum' ? [132, 142, 151, 162] : metric === 'inflow' ? [38, 40, 42, 45] : [14, 15, 16, 17];
    return {
      chart: { height: 200, backgroundColor:'transparent' },
      xAxis: { categories:['24-Q3','24-Q4','25-Q1','25-Q2'], lineColor:'rgba(75,85,99,0.4)' },
      yAxis: [{ labels: { formatter: function() { return '$' + this.value + 'B'; }, style:{ color:'rgb(163,163,163)', fontSize:'10px' } }, gridLineColor:'rgba(75,85,99,0.2)', gridLineDashStyle:'Dash' }],
      legend: { enabled:true, itemStyle:{ color:'rgb(163,163,163)', fontSize:'10px', fontWeight:500 } },
      series: [
        { type:'area', name:'Market', data: mkt, color:'rgb(107,114,128)' },
        { type:'areaspline', name:'Yours', data: base, color:'rgb(52,211,153)', marker:{ fillColor:'rgb(52,211,153)', lineColor:'#fff', lineWidth:1, radius:4 } },
      ],
    };
  }, [metric]);
  return <div style={{ height: 200 }}><HC options={opts} /></div>;
}

Object.assign(window, { FilterDrawer, RowDrawer, DEFAULT_FILTERS, SearchMultiSelect, FilterGroupLabel, FilterSection });
