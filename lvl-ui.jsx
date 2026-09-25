/* Shared UI atoms + filter engine for the Level 2 and Level 3 dashboards.
   Filtering runs through the same right-hand drawer the Level 1 dashboards
   use: the drawer renders an L2/L3 section list, active picks surface as
   removable chips in the TopBar. */

const LVU_LINE = 'rgba(75,85,99,0.4)';
const LVU_INK = 'rgb(249,250,251)';
const LVU_MUT = 'rgb(163,163,163)';
const LVU_DIM = 'rgb(200,205,213)';

const LV_FILTER_DEFAULT = {
  segments: [], prodCats: [], prodBands: [], productBands: [], compAdv: [],
  vehicles: [], discretion: [], engagement: [], roles: [], types: [],
  cities: [], states: [], msas: [], zips: [], firms: [], offices: [], names: [], channels: [], sigTypes: [],
  products: [], prodCategories: [],
  focusOnly: false, staleOnly: false,
  minConf: 50,
};

const LV_FILTER_KEYS = Object.keys(LV_FILTER_DEFAULT);

function lvRowVehicles(row) {
  const hs = row.holdings || [];
  return hs.length ? [...new Set(hs.map(h => h.vehicle))] : [row.vehiclePref];
}

function lvMatches(row, f) {
  const has = (k, v) => !f[k].length || f[k].includes(v);
  if (!has('segments', row.segment)) return false;
  if (!has('prodCats', row.prodCat)) return false;
  if (!has('prodBands', row.prodBand)) return false;
  if (!has('productBands', row.productBand)) return false;
  if (!has('compAdv', row.compAdv)) return false;
  // Vehicle follows the products the FA/Team actually holds, so the Vehicle
  // and Product tiles always agree; prospects fall back to their preference.
  if (f.vehicles.length && !lvRowVehicles(row).some(v => f.vehicles.includes(v))) return false;
  if (!has('discretion', row.discretion)) return false;
  if (!has('cities', row.city)) return false;
  if (!has('states', row.state)) return false;
  if (!has('msas', row.msa)) return false;
  if (!has('zips', row.zip)) return false;
  if (!has('firms', row.firm)) return false;
  if (!has('offices', row.office)) return false;
  if (!has('names', row.name)) return false;
  if (!has('channels', row.channel)) return false;
  if (f.products && f.products.length && !(row.holdings || []).some(h => f.products.includes(h.product))) return false;
  if (f.prodCategories && f.prodCategories.length && !(row.catMix || []).some(c => f.prodCategories.includes(c.cat))) return false;
  if (!has('types', row.type)) return false;
  if (f.engagement.length && !f.engagement.some(e => row.engagement.includes(e))) return false;
  if (f.sigTypes.length && !row.signals.some(s => f.sigTypes.includes(s.type))) return false;
  if (f.focusOnly) {
    const scope = f.roles.length ? f.roles : LV_ROLES.map(r => r.key);
    if (!row.focusRoles.some(r => scope.includes(r))) return false;
  }
  if (f.staleOnly) {
    const a = lvActivity(row, f.roles);
    if (a.days != null && a.days <= 90) return false;
  }
  return true;
}

/* Focus strategies only: each FA/Team re-cut to the focus categories.
   Opportunity follows the category mix, your AUM / sales / production follow
   the focus holdings, activity follows the activity logged against them, and
   signals keep only focus-category products (relationship-level signals are
   scaled to the focus share of the opportunity). FA/Teams with nothing in the
   focus strategies drop out. */
const lvFocusCats = () => new Set(LV_PROD_CATEGORIES.filter(c => window.isFocusCat && isFocusCat(c)));
function lvSigCat(prod) {
  if (!prod) return null;
  const c = LV_CATALOG.find(x => { const n = x.name.replace(/^Field /, ''); return n === prod || n.startsWith(prod) || prod.startsWith(n); });
  return c ? c.cat : null;
}
function lvFocusRow(p, fc) {
  const mix = (p.catMix || []).filter(c => fc.has(c.cat));
  const fw = mix.reduce((a, c) => a + c.w, 0);
  const all = p.holdings || [];
  const holdings = all.filter(h => fc.has(h.cat));
  if (!fw && !holdings.length) return null;
  const totA = all.reduce((a, h) => a + (h.aumM || 0), 0);
  const hf = totA ? holdings.reduce((a, h) => a + (h.aumM || 0), 0) / totA : 0;
  const totActs = all.reduce((a, h) => a + (h.acts || 0), 0);
  const af = totActs ? holdings.reduce((a, h) => a + (h.acts || 0), 0) / totActs : fw;
  const r2 = v => Math.round(v * 100) / 100;
  const sales = {};
  Object.keys(p.sales).forEach(k => { sales[k] = Math.round(p.sales[k] * hf); });
  const act = {};
  Object.keys(p.act).forEach(k => { const n = Math.round(p.act[k].r12 * af); act[k] = { r12: n, days: n ? p.act[k].days : null }; });
  const signals = p.signals
    .filter(s => (s.product ? fc.has(lvSigCat(s.product)) : fw > 0))
    .map(s => (s.product ? s : { ...s, opp: r2(s.opp * fw), oppMin: r2(s.oppMin * fw), oppMax: r2(s.oppMax * fw) }));
  const oppAum = Math.round(p.oppAum * fw), oppIn = r2(p.oppIn * fw), oppNet = r2(p.oppNet * fw);
  const yoursAum = r2(p.yoursAum * hf), yoursIn = r2(p.yoursIn * hf), yoursNet = r2(p.yoursNet * hf);
  const r12ProdK = Math.round(p.r12ProdK * hf);
  const q = {
    ...p, holdings, sales, act, signals,
    catMix: fw ? mix.map(c => ({ cat: c.cat, w: c.w / fw })) : [],
    oppAum, oppIn, oppNet, yoursAum, yoursIn, yoursNet,
    shareAum: oppAum ? yoursAum / oppAum : 0, shareIn: oppIn ? yoursIn / oppIn : 0, shareNet: oppNet ? yoursNet / oppNet : 0,
    r12ProdK, prior12K: Math.round(p.prior12K * hf),
    lapsedK: p.lapsedK ? Math.round(p.lapsedK * fw) : p.lapsedK,
    prodCat: r12ProdK === 0 ? 'Prospect' : r12ProdK < 400 ? 'Dabbler' : 'Producer',
    prodBand: lvBand(r12ProdK), products: holdings.length, productBand: lvCountBand(holdings.length),
    actTotal: Object.values(act).reduce((a, x) => a + x.r12, 0),
    perfAdvAum: r2(p.perfAdvAum * fw), feeAdvAum: r2(p.feeAdvAum * fw),
    perfAdvIn: r2(p.perfAdvIn * fw), feeAdvIn: r2(p.feeAdvIn * fw),
    perfAdvNet: r2(p.perfAdvNet * fw), feeAdvNet: r2(p.feeAdvNet * fw),
    addressable: p.addressable * fw,
    signalOpp: signals.reduce((a, s) => a + s.oppMax, 0),
    signalOppMin: signals.reduce((a, s) => a + s.oppMin, 0),
    wtdConfidence: lvWtdConf(signals),
  };
  q.nba = signals.length && window.lvNextBest ? lvNextBest(q) : null;
  return q;
}
let _lvFocusCache = null;
function lvFocusRows(rows) {
  if (_lvFocusCache && _lvFocusCache.src === rows && _lvFocusCache.ver === window.FOCUS_VER) return _lvFocusCache.out;
  const fc = lvFocusCats();
  const out = rows.map(r => lvFocusRow(r, fc)).filter(Boolean);
  _lvFocusCache = { src: rows, out, ver: window.FOCUS_VER };
  return out;
}
const lvFilterRows = (rows, f) => (f.focusStrat ? lvFocusRows(rows) : rows).filter(r => lvMatches(r, f));
const lvCount = (f) => LV_FILTER_KEYS.reduce((n, k) =>
  n + (k === 'minConf' ? ((f.minConf || 50) > 50 ? 1 : 0) : Array.isArray(f[k]) ? f[k].length : (f[k] ? 1 : 0)), 0);

/* TopBar selection chips. `roles` is excluded — it scopes the activity
   columns rather than removing rows, and lives on the grid header. */
function lvSelectionChips(f, setF) {
  const out = [];
  const arr = (key, icon, label) => (f[key] || []).forEach(v => out.push({
    key: `${key}:${v}`, label: label ? label(v) : v, icon,
    onRemove: () => setF(s => ({ ...s, [key]: s[key].filter(x => x !== v) })),
  }));
  arr('segments', 'layer-group', v => `Segment ${v}`);
  arr('compAdv', 'trophy', v => `${v} adv.`);
  arr('types', 'user');
  arr('prodCats', 'chart-simple');
  arr('prodBands', 'coins', v => `R12 ${v}`);
  arr('productBands', 'cubes', v => `${v} products`);
  arr('vehicles', 'cube');
  arr('discretion', 'sliders');
  arr('engagement', 'signal', v => (LV_ENG_META[v] || {}).label || v);
  arr('cities', 'location-dot');
  arr('states', 'map');
  arr('msas', 'city');
  arr('zips', 'location-crosshairs', v => `ZIP ${v}`);
  arr('firms', 'building-columns');
  arr('offices', 'building');
  arr('names', 'user');
  arr('channels', 'sitemap');
  arr('products', 'box');
  arr('prodCategories', 'layer-group');
  arr('sigTypes', 'satellite-dish');
  if ((f.minConf || 50) > 50) out.push({ key: 'minconf', label: `Confidence ≥ ${f.minConf}`, icon: 'gauge-high', onRemove: () => setF(s => ({ ...s, minConf: 50 })) });
  if (f.focusOnly) out.push({ key: 'focus', label: 'Focus only', icon: 'star', onRemove: () => setF(s => ({ ...s, focusOnly: false })) });
  if (f.staleOnly) out.push({ key: 'stale', label: 'No touch 90d+', icon: 'clock', onRemove: () => setF(s => ({ ...s, staleOnly: false })) });
  return out;
}

/* ---- drawer sections ---------------------------------------------------- */

/* Rendered inside the shared FilterDrawer. `level` decides whether the
   segmentation and signal dimensions appear at all. */
function LvDrawerSections({ local, toggle, setMany, level }) {
  const cities = Object.keys(LV_CITY_META);
  const states = [...new Set(Object.values(LV_CITY_META).map(m => m[2]))];
  const msas = [...new Set(Object.values(LV_CITY_META).map(m => m[3]))];
  const firms = [...new Set(LV_ROWS.map(r => r.firm))].sort();
  const offices = [...new Set(LV_ROWS.map(r => r.office))].sort();
  const names = LV_ROWS.map(r => r.name).sort();
  return (
    <>
      <FilterGroupLabel>Territory</FilterGroupLabel>
      <FilterSection label="Channel" options={['Wirehouse', 'BA', 'IBD', 'RIA']}
        selected={local.channels} onToggle={v => toggle('channels', v)} />
      <SearchMultiSelect label="State" placeholder="All states" options={states} selected={local.states} onChange={v => setMany('states', v)} />
      <SearchMultiSelect label="MSA" placeholder="All metro areas" options={msas} selected={local.msas} onChange={v => setMany('msas', v)} />
      <SearchMultiSelect label="City" placeholder="All cities" options={cities} selected={local.cities} onChange={v => setMany('cities', v)} />
      <SearchMultiSelect label="Firm" placeholder="All firms" options={firms} selected={local.firms} onChange={v => setMany('firms', v)} />
      <SearchMultiSelect label="Office" placeholder="All offices" options={offices} selected={local.offices} onChange={v => setMany('offices', v)} />
      <SearchMultiSelect label="Team / FA" placeholder="All teams and advisors" options={names} selected={local.names} onChange={v => setMany('names', v)} />

      <FilterGroupLabel>Competitive advantage</FilterGroupLabel>
      <FilterSection label="Advantage grade" options={LV_COMP_ADV.map(a => a.key)}
        selected={local.compAdv} onToggle={v => toggle('compAdv', v)} />

      <FilterGroupLabel>Sales &amp; CRM activity</FilterGroupLabel>
      <FilterSection label="Production category" options={LV_PROD_CATS}
        selected={local.prodCats} onToggle={v => toggle('prodCats', v)} />
      <SearchMultiSelect label="Rolling 12 production" placeholder="All production bands" options={LV_PROD_BANDS} selected={local.prodBands} onChange={v => setMany('prodBands', v)} />
      <FilterSection label="Products held" options={LV_PROD_COUNT_BANDS}
        selected={local.productBands} onToggle={v => toggle('productBands', v)} />
      <FilterSection label="Vehicle preference" options={LV_VEHICLES}
        selected={local.vehicles} onToggle={v => toggle('vehicles', v)} />
      <FilterSection label="Investment discretion" options={LV_DISCRETION}
        selected={local.discretion} onToggle={v => toggle('discretion', v)} />
      <FilterSection label="Sales role" options={LV_ROLES.map(r => r.label)}
        selected={local.roles.map(k => (LV_ROLES.find(r => r.key === k) || {}).label)}
        onToggle={label => toggle('roles', (LV_ROLES.find(r => r.label === label) || {}).key)} />
      <FilterSection label="Engagement" options={LV_ENGAGEMENT.map(e => e.label)}
        selected={local.engagement.map(k => (LV_ENG_META[k] || {}).label)}
        onToggle={label => toggle('engagement', (LV_ENGAGEMENT.find(e => e.label === label) || {}).key)} />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <LvToggle label="Focus FA/Teams only" icon="star" on={local.focusOnly}
          onClick={() => setMany('focusOnly', !local.focusOnly)} />
        <LvToggle label="No touch 90d+" icon="clock" on={local.staleOnly}
          onClick={() => setMany('staleOnly', !local.staleOnly)} />
      </div>

      {level >= 3 && (
        <>
          <FilterGroupLabel>Segmentation &amp; signals</FilterGroupLabel>
          <FilterSection label="Segment" options={LV_SEGMENTS.map(s => LV_SEG_META[s].label)}
            selected={local.segments.map(s => LV_SEG_META[s].label)}
            onToggle={label => toggle('segments', LV_SEGMENTS.find(s => LV_SEG_META[s].label === label))} />
          <SearchMultiSelect label="Signal type" placeholder="All signal types" options={LV_SIG_TYPES} selected={local.sigTypes} onChange={v => setMany('sigTypes', v)} />
          <LvConfFilter value={local.minConf || 50} onChange={v => setMany('minConf', v)} />
        </>
      )}
    </>
  );
}

/* Friendly text for the drawer's applied-chip strip: several dimensions store
   internal keys rather than the labels the user picked. */
function lvChipLabel(key, v) {
  if (key === 'roles') return (LV_ROLES.find(r => r.key === v) || {}).label || v;
  if (key === 'engagement') return (LV_ENG_META[v] || {}).label || v;
  if (key === 'segments') return `Segment ${v}`;
  if (key === 'zips') return `ZIP ${v}`;
  return v;
}

/* Minimum-confidence slider for the filter drawer. Every signal is scored 50
   or above, so the floor starts at 50; raising it drops weaker signals from
   every total, the map, the grid and the next best action. */
function LvConfFilter({ value, onChange }) {
  const bands = [50, 60, 70, 80, 90];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '4px 0 6px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: 'Inter', fontSize: 12, fontWeight: 600, color: 'rgb(229,231,235)' }}>Min. signal confidence</span>
        <span style={{ fontFamily: 'Inter Display, Inter', fontSize: 15, fontWeight: 600, color: 'rgb(196,181,253)', fontVariantNumeric: 'tabular-nums' }}>{value}+</span>
      </div>
      <input type="range" min={50} max={95} step={5} value={value} onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: 'rgb(167,139,250)' }} />
      <div style={{ display: 'flex', gap: 6 }}>
        {bands.map(v => (
          <button key={v} onClick={() => onChange(v)} style={{
            flex: 1, height: 24, borderRadius: 6, cursor: 'pointer',
            background: value === v ? 'rgba(167,139,250,0.2)' : 'transparent',
            border: `1px solid ${value === v ? 'rgb(167,139,250)' : 'rgba(75,85,99,0.5)'}`,
            color: value === v ? 'rgb(196,181,253)' : 'rgb(163,163,163)',
            fontFamily: 'Inter', fontSize: 11, fontWeight: 500,
          }}>{v === 50 ? 'All' : `${v}+`}</button>
        ))}
      </div>
    </div>
  );
}

/* ---- atoms -------------------------------------------------------------- */

function LvChip({ label, count, color, on, dim, onClick, icon, small }) {
  const c = color || 'rgb(209,213,219)';
  return (
    <button onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      height: small ? 24 : 27, padding: small ? '0 9px' : '0 11px', borderRadius: 9999,
      background: on ? c.replace('rgb', 'rgba').replace(')', ',0.16)') : 'rgba(255,255,255,0.03)',
      border: `1px solid ${on ? c : LVU_LINE}`,
      color: on ? c : (dim ? LVU_DIM : 'rgb(209,213,219)'),
      fontFamily: 'Inter', fontSize: small ? 10.5 : 11.5, fontWeight: on ? 600 : 500,
      cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all .12s',
    }}>
      {icon && <i className={`fa-solid fa-${icon}`} style={{ fontSize: 9, opacity: 0.9 }} />}
      {color && !icon && <span style={{ width: 8, height: 8, borderRadius: 9999, background: c }} />}
      {label}
      {count != null && <span style={{ fontSize: 10, color: on ? c : LVU_DIM, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{count}</span>}
    </button>
  );
}

function LvToggle({ label, on, onClick, icon }) {
  return (
    <button onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', gap: 7, height: 26, padding: '0 11px',
      borderRadius: 9999, cursor: 'pointer',
      background: on ? 'rgba(5,122,85,0.18)' : 'transparent',
      border: `1px solid ${on ? 'rgba(16,185,129,0.6)' : LVU_LINE}`,
      color: on ? 'rgb(52,211,153)' : LVU_MUT,
      fontFamily: 'Inter', fontSize: 11, fontWeight: on ? 600 : 500,
    }}>
      {icon && <i className={`fa-solid fa-${icon}`} style={{ fontSize: 9 }} />}{label}
    </button>
  );
}

/* Tri-stat header tile matching the Opportunity dashboard's Opp / Yours /
   Share treatment. */
function LvTriKpi({ title, items, note, cols }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.035)', border: `1px solid ${LVU_LINE}`, borderRadius: 12,
      padding: '14px 18px 16px', display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <div style={{ fontFamily: 'Inter', fontSize: 11, fontWeight: 600, color: LVU_INK }}>{title}</div>
        {note && <div style={{ fontFamily: 'Inter', fontSize: 10.5, color: LVU_DIM }}>{note}</div>}
      </div>
      <div style={{
        display: 'grid', alignContent: 'start',
        gridTemplateColumns: cols ? `repeat(${cols}, minmax(0,1fr))` : 'repeat(auto-fit, minmax(78px,1fr))', gap: '14px 14px',
      }}>
        {items.map(it => (
          <div key={it.label} style={{ minWidth: 0 }}>
            <div style={{ fontFamily: 'Inter', fontSize: 9.5, color: LVU_DIM, textTransform: 'uppercase', letterSpacing: 0.6, lineHeight: 1.25, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.label}</div>
            <div style={{
              fontFamily: 'Inter Display, Inter', fontSize: 22, fontWeight: 500, letterSpacing: '-0.01em',
              color: it.strong ? 'rgb(52,211,153)' : LVU_INK, fontVariantNumeric: 'tabular-nums',
            }}>{it.value}</div>
            {it.sub && <div style={{ fontFamily: 'Inter', fontSize: 10.5, color: LVU_MUT, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.sub}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

/* Width the engine reserves for a scrollbar gutter, measured once so a header
   grid outside a scrolling list can reserve exactly the same space. */
let LVU_SBW = null;
function lvScrollbarW() {
  if (LVU_SBW != null) return LVU_SBW;
  const d = document.createElement('div');
  d.style.cssText = 'position:absolute;top:-9999px;width:100px;height:100px;overflow-y:scroll;scrollbar-gutter:stable';
  document.body.appendChild(d);
  LVU_SBW = d.offsetWidth - d.clientWidth;
  document.body.removeChild(d);
  return LVU_SBW;
}

/* Breakdown tile: a labelled distribution with $ / % of $ / count / % of count
   per bucket, and optionally the share of CRM activity going to each. Column
   headers sit above the rows. Clicking a bucket filters the dashboard.
   `fill` lets the card stretch to a taller row partner without cramming. */
function LvBreakdownKpi({ title, note, rows, total, selected, onToggle, valueLabel = '$', activity, actLabel = 'act', hideCount, scrollRows, fill }) {
  const maxN = Math.max(1, ...rows.map(r => r.n));
  const actTotal = activity ? rows.reduce((a, r) => a + (r.acts || 0), 0) : 0;
  const valTotal = rows.reduce((a, r) => a + (r.raw || 0), 0);
  const cols = hideCount
    ? (activity ? 'minmax(0,1fr) 62px 40px 34px 40px' : 'minmax(0,1fr) 62px 40px')
    : (activity ? 'minmax(0,1fr) 56px 38px 28px 38px 30px 38px' : 'minmax(0,1fr) 60px 40px 32px 40px');
  const headCell = { fontFamily: 'Inter', fontSize: 8.5, color: LVU_DIM, textAlign: 'right', textTransform: 'uppercase', letterSpacing: 0.4, whiteSpace: 'nowrap' };
  const num = { fontFamily: 'Inter', fontSize: 11, textAlign: 'right', fontVariantNumeric: 'tabular-nums' };
  return (
    <div style={{
      background: 'rgba(255,255,255,0.035)', border: `1px solid ${LVU_LINE}`, borderRadius: 12,
      padding: '14px 16px 12px', display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0,
      height: fill ? '100%' : undefined, boxSizing: 'border-box',
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, minWidth: 0 }}>
        <div style={{ fontFamily: 'Inter', fontSize: 11, fontWeight: 600, color: LVU_INK, whiteSpace: 'nowrap' }}>{title}</div>
        {note && <div style={{ fontFamily: 'Inter', fontSize: 10.5, color: LVU_DIM, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{note}</div>}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: cols, gap: 6, paddingBottom: 5, paddingRight: scrollRows ? lvScrollbarW() : 0, borderBottom: `1px solid ${LVU_LINE}` }}>
        <span />
        <span style={headCell}>{valueLabel}</span>
        <span style={headCell}>% $</span>
        {!hideCount && <span style={headCell}>#</span>}
        {!hideCount && <span style={headCell}>% #</span>}
        {activity && <span style={headCell}>{actLabel}</span>}
        {activity && <span style={headCell}>{actLabel} %</span>}
      </div>
      {/* When the list scrolls, the rows drop their negative-margin bleed and
         the container reserves a stable gutter, so the header grid and the row
         grids resolve to the same content width. */}
      <div style={{
        display: 'flex', flexDirection: 'column', gap: 5,
        flex: fill && !scrollRows ? 1 : undefined,
        justifyContent: fill && !scrollRows ? 'space-around' : undefined,
        maxHeight: scrollRows ? scrollRows * 27 + (scrollRows - 1) * 5 : undefined,
        overflowY: scrollRows ? 'auto' : undefined,
        overflowX: scrollRows ? 'hidden' : undefined,
        scrollbarGutter: scrollRows ? 'stable' : undefined,
      }}>
        {rows.map(r => {
          const on = selected && selected.includes(r.key);
          const pct = total ? (r.n / total) * 100 : 0;
          const vPct = valTotal ? ((r.raw || 0) / valTotal) * 100 : 0;
          const aPct = actTotal ? ((r.acts || 0) / actTotal) * 100 : 0;
          return (
            <button key={r.key} onClick={() => onToggle && onToggle(r.key)} style={{
              display: 'grid', gridTemplateColumns: cols, alignItems: 'center', gap: 6,
              background: on ? 'rgba(16,185,129,0.10)' : 'transparent', border: 'none',
              padding: scrollRows ? '3px 0' : '3px 6px', margin: scrollRows ? 0 : '0 -6px', borderRadius: 6,
              cursor: onToggle ? 'pointer' : 'default', textAlign: 'left',
            }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: 'Inter', fontSize: 10.5, color: on ? LVU_INK : 'rgb(209,213,219)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 3 }}>{r.label}</div>
                <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                  <div style={{ width: `${((hideCount ? (r.raw || 0) / (Math.max(...rows.map(x => x.raw || 0)) || 1) : r.n / maxN)) * 100}%`, height: '100%', background: r.color || 'rgb(52,211,153)', borderRadius: 2 }} />
                </div>
              </div>
              <span style={{ ...num, fontWeight: 600, color: LVU_INK }}>{r.value}</span>
              <span style={{ ...num, color: LVU_DIM }}>{vPct.toFixed(0)}%</span>
              {!hideCount && <span style={{ ...num, color: LVU_MUT }}>{r.n}</span>}
              {!hideCount && <span style={{ ...num, color: LVU_DIM }}>{pct.toFixed(0)}%</span>}
              {activity && <span style={{ ...num, color: LVU_MUT }}>{r.acts || 0}</span>}
              {activity && <span style={{ ...num, color: LVU_DIM }}>{aPct.toFixed(0)}%</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function LvKpi({ label, value, sub, color, icon, delta }) {
  const soft = color ? color.replace('rgb', 'rgba').replace(')', ',0.14)') : 'rgba(255,255,255,0.05)';
  const ring = color ? color.replace('rgb', 'rgba').replace(')', ',0.3)') : 'rgba(75,85,99,0.5)';
  return (
    <div style={{
      background: 'rgba(255,255,255,0.035)', border: `1px solid ${LVU_LINE}`, borderRadius: 12,
      padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14, minWidth: 0,
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: 10, flexShrink: 0, background: soft,
        border: `1px solid ${ring}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}><i className={`fa-solid fa-${icon}`} style={{ fontSize: 14, color: color || LVU_MUT }} /></div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: 'Inter', fontSize: 10, fontWeight: 600, color: LVU_DIM, textTransform: 'uppercase', letterSpacing: 0.6 }}>{label}</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <div style={{ fontFamily: 'Inter Display, Inter', fontSize: 24, fontWeight: 500, color: LVU_INK, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em' }}>{value}</div>
          {delta && <span style={{ fontFamily: 'Inter', fontSize: 11.5, fontWeight: 600, color: delta.startsWith('−') || delta.startsWith('-') ? 'rgb(248,113,113)' : 'rgb(52,211,153)' }}>{delta}</span>}
        </div>
        {sub && <div style={{ fontFamily: 'Inter', fontSize: 11, color: LVU_MUT, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}</div>}
      </div>
    </div>
  );
}

/* Competitive-advantage dot. Same control and same overlay the Opportunity
   dashboard uses: the dot opens the Competitive Advantage breakdown — top
   vehicle / M★ category rows with performance and fee advantage — for this
   FA/Team. */
function LvAdvDot({ grade, row }) {
  const [open, setOpen] = React.useState(false);
  const c = LV_ADV_COLOR[grade] || LVU_DIM;
  const Btn = window.AdvDotButton;
  const Overlay = window.CompAdvOverlay;
  return (
    <>
      {Btn
        ? <Btn color={c} adv={grade} onClick={e => { e.stopPropagation(); setOpen(true); }} />
        : <button onClick={e => { e.stopPropagation(); setOpen(true); }} style={{ width: 22, height: 22, background: 'transparent', border: 'none' }}>
            <span style={{ display: 'inline-block', width: 9, height: 9, borderRadius: 9999, background: c }} />
          </button>}
      {open && Overlay && row && ReactDOM.createPortal(
        <div onClick={e => e.stopPropagation()}>
          <Overlay row={lvClientRow(row)} onClose={() => setOpen(false)} />
        </div>,
        document.body)}
    </>
  );
}

function LvSegBadge({ seg, size = 20 }) {
  const m = LV_SEG_META[seg];
  return (
    <span title={m.label} style={{
      width: size, height: size, borderRadius: 6, flexShrink: 0,
      background: m.dot.replace('rgb', 'rgba').replace(')', ',0.18)'),
      border: `1px solid ${m.dot}`, color: m.dot,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Inter', fontSize: size * 0.55, fontWeight: 700,
    }}>{seg}</span>
  );
}

function LvProdCatTag({ cat }) {
  const c = cat === 'Producer' ? 'rgb(52,211,153)' : cat === 'Dabbler' ? 'rgb(251,191,36)' : 'rgb(148,163,184)';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 5,
      background: c.replace('rgb', 'rgba').replace(')', ',0.14)'), border: `1px solid ${c.replace('rgb', 'rgba').replace(')', ',0.4)')}`,
      color: c, fontFamily: 'Inter', fontSize: 10, fontWeight: 600, whiteSpace: 'nowrap',
    }}>{cat}</span>
  );
}

/* Sales trend against the prior 12 — up / down / flat. */
function LvTrend({ value, compact }) {
  const up = value > 0.05, down = value < -0.05;
  const c = up ? 'rgb(52,211,153)' : down ? 'rgb(248,113,113)' : 'rgb(148,163,184)';
  const icon = up ? 'arrow-trend-up' : down ? 'arrow-trend-down' : 'arrow-right-long';
  return (
    <span title={`${value >= 0 ? '+' : '−'}${Math.abs(value * 100).toFixed(0)}% vs prior 12`}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: c, fontVariantNumeric: 'tabular-nums' }}>
      <i className={`fa-solid fa-${icon}`} style={{ fontSize: 10 }} />
      {!compact && <span style={{ fontFamily: 'Inter', fontSize: 11 }}>{`${value >= 0 ? '+' : '−'}${Math.abs(value * 100).toFixed(0)}%`}</span>}
    </span>
  );
}

function LvEngIcons({ keys, max }) {
  if (!keys.length) return <span style={{ color: LVU_DIM, fontSize: 11 }}>—</span>;
  const cap = max || keys.length;
  const shown = keys.slice(0, cap);
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      {shown.map(k => {
        const m = LV_ENG_META[k];
        return <i key={k} className={`fa-solid fa-${m.icon}`} title={m.label} style={{ fontSize: 10.5, color: m.color }} />;
      })}
      {keys.length > cap && (
        <span title={keys.slice(cap).map(k => LV_ENG_META[k].label).join(', ')}
          style={{ fontFamily: 'Inter', fontSize: 9.5, color: LVU_DIM }}>+{keys.length - cap}</span>
      )}
    </div>
  );
}

/* Role include/exclude for the activity columns. All roles on by default. */
function LvRoleToggle({ roles, onChange }) {
  const on = (k) => !roles.length || roles.includes(k);
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={{ fontFamily: 'Inter', fontSize: 9.5, fontWeight: 600, color: LVU_DIM, textTransform: 'uppercase', letterSpacing: 0.6 }}>Activity roles</span>
      {LV_ROLES.map(r => (
        <button key={r.key} onClick={() => {
          const cur = roles.length ? roles : LV_ROLES.map(x => x.key);
          const next = cur.includes(r.key) ? cur.filter(x => x !== r.key) : [...cur, r.key];
          onChange(next.length === LV_ROLES.length ? [] : next);
        }} style={{
          height: 22, padding: '0 9px', borderRadius: 9999, cursor: 'pointer',
          background: on(r.key) ? r.color.replace('rgb', 'rgba').replace(')', ',0.16)') : 'transparent',
          border: `1px solid ${on(r.key) ? r.color : LVU_LINE}`,
          color: on(r.key) ? r.color : LVU_DIM,
          fontFamily: 'Inter', fontSize: 10.5, fontWeight: on(r.key) ? 600 : 500,
        }}>{r.short}</button>
      ))}
    </div>
  );
}

function LvConfBar({ value, color = 'rgb(96,165,250)', width = 44 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, justifyContent: 'flex-end' }}>
      <div style={{ width, height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
        <div style={{ width: `${value}%`, height: '100%', background: color, borderRadius: 3 }} />
      </div>
      <span style={{ fontFamily: 'Inter', fontSize: 11.5, fontWeight: 600, color: LVU_INK, fontVariantNumeric: 'tabular-nums', minWidth: 20, textAlign: 'right' }}>{value}</span>
    </div>
  );
}

/* Sortable table header cell factory shared by both grids. */
function lvTh(sortKey, setSortKey, sortDir, setSortDir) {
  return (label, key, right, extra) => (
    <th onClick={() => { if (sortKey === key) setSortDir(d => -d); else { setSortKey(key); setSortDir(-1); } }}
      style={{
        textAlign: right ? 'right' : 'left', padding: right ? '11px 12px 10px' : '11px 14px 10px',
        fontFamily: 'Inter', fontSize: 9.5, fontWeight: 600, color: sortKey === key ? 'rgb(52,211,153)' : LVU_DIM,
        letterSpacing: 0.5, textTransform: 'uppercase', cursor: 'pointer', whiteSpace: 'nowrap',
        position: 'sticky', top: 0, background: 'rgb(16,26,42)', zIndex: 2,
        borderBottom: '1px solid rgba(75,85,99,0.35)', userSelect: 'none', ...extra,
      }}>
      {label}
      {sortKey === key && <i className={`fa-solid fa-caret-${sortDir === 1 ? 'up' : 'down'}`} style={{ marginLeft: 5, fontSize: 10 }} />}
    </th>
  );
}

const lvThPlain = (label, right, extra) => (
  <th style={{
    textAlign: right ? 'right' : 'left', padding: right ? '11px 12px 10px' : '11px 14px 10px',
    fontFamily: 'Inter', fontSize: 9.5, fontWeight: 600, color: LVU_DIM,
    letterSpacing: 0.5, textTransform: 'uppercase', whiteSpace: 'nowrap',
    position: 'sticky', top: 0, background: 'rgb(16,26,42)', zIndex: 2,
    borderBottom: '1px solid rgba(75,85,99,0.35)', ...extra,
  }}>{label}</th>
);

const lvTd = { padding: '10px 14px', fontFamily: 'Inter', fontSize: 12.5, color: 'rgb(229,231,235)', borderBottom: '1px solid rgba(75,85,99,0.16)' };
const lvTdR = { ...lvTd, padding: '10px 12px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' };

function LvEyeButton({ onClick, title = 'Open FA/Team profile' }) {
  const [hover, setHover] = React.useState(false);
  return (
    <button onClick={e => { e.stopPropagation(); onClick(); }} title={title}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        width: 26, height: 26, borderRadius: 7, cursor: 'pointer',
        background: hover ? 'rgba(16,185,129,0.16)' : 'transparent',
        border: `1px solid ${hover ? 'rgba(16,185,129,0.6)' : LVU_LINE}`,
        color: hover ? 'rgb(52,211,153)' : LVU_MUT,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      }}><i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: 10 }} /></button>
  );
}

/* Subscription-level switcher. */
function LvLevelSwitch({ level, onChange }) {
  const defs = [
    { n: 1, label: 'L1', title: 'Level 1 — Distribution Intelligence' },
    { n: 2, label: 'L2', title: 'Level 2 — Sales & CRM' },
    { n: 3, label: 'L3', title: 'Level 3 — Segmentation & Predictive' },
  ];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
      <span style={{ fontFamily: 'Inter', fontSize: 9.5, fontWeight: 600, color: LVU_DIM, textTransform: 'uppercase', letterSpacing: 0.7, whiteSpace: 'nowrap' }}>Subscribed</span>
      <div style={{ display: 'inline-flex', padding: 2, borderRadius: 7, background: 'rgba(0,0,0,0.35)', border: `1px solid ${LVU_LINE}` }}>
        {defs.map(d => (
          <button key={d.n} title={d.title} onClick={() => onChange(d.n)} style={{
            height: 22, padding: '0 11px', borderRadius: 5, border: 'none', cursor: 'pointer',
            background: level === d.n ? 'rgba(16,185,129,0.22)' : 'transparent',
            color: level === d.n ? 'rgb(52,211,153)' : LVU_MUT,
            fontFamily: 'Inter', fontSize: 11, fontWeight: level === d.n ? 700 : 500,
          }}>{d.label}</button>
        ))}
      </div>
    </div>
  );
}

function LvLevelBadge({ n }) {
  return (
    <span style={{
      padding: '2px 7px', borderRadius: 5, background: 'rgba(16,185,129,0.14)',
      border: '1px solid rgba(16,185,129,0.4)', color: 'rgb(52,211,153)',
      fontFamily: 'Inter', fontSize: 9.5, fontWeight: 700, letterSpacing: 0.4, whiteSpace: 'nowrap',
    }}>LEVEL {n}</span>
  );
}

/* Map an LV row onto the shape ClientDetailPage expects, carrying the Level 2
   actuals through so the profile can show real sales alongside opportunity. */
function lvClientRow(p) {
  return {
    type: p.type === 'FA' ? 'FA' : 'Teams',
    name: p.name, firm: p.firm,
    adv: p.compAdv, advDot: p.compAdvDot,
    opp: lvFmtM(p.oppAum), yours: lvFmtM(p.yoursAum), share: lvFmtPct(p.shareAum),
    iOpp: lvFmtM(p.oppIn), iYours: lvFmtM(p.yoursIn), iShare: lvFmtPct(p.shareIn),
    nOpp: lvFmtSigned(p.oppNet), nYours: lvFmtSigned(p.yoursNet), nShare: lvFmtPct(Math.abs(p.shareNet)),
    // Opportunity overlay parses these as $…M strings, so keep them in millions.
    ca: `${(p.perfAdvAum + p.feeAdvAum).toFixed(1)}M`, perf: `${p.perfAdvAum.toFixed(1)}M`, fee: `${p.feeAdvAum.toFixed(1)}M`,
    totInflow: lvFmtM(p.yoursIn), netFlow: lvFmtSigned(p.yoursNet),
    lvRow: p,
  };
}

Object.assign(window, {
  LvConfFilter, lvRowVehicles, LV_FILTER_DEFAULT, LV_FILTER_KEYS, lvFilterRows, lvMatches, lvCount, lvSelectionChips,
  LvDrawerSections, lvChipLabel, LvChip, LvToggle, LvKpi, LvTriKpi, LvBreakdownKpi,
  LvAdvDot, LvSegBadge, LvProdCatTag, LvTrend, LvEngIcons, LvRoleToggle, LvConfBar,
  lvTh, lvThPlain, lvTd, lvTdR, LvEyeButton, lvClientRow, lvScrollbarW,
  LvLevelSwitch, LvLevelBadge,
});
