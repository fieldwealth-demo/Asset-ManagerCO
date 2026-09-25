/* Dimension tile shared by the Level 2 and Level 3 dashboards.

   Every stat tile is the same component: it groups the filtered book by a
   dimension the user picks from the tile's own header, and shows market
   opportunity, your share of it, actual sales and coverage for each bucket.
   Which dimensions are offered is decided by the dashboard — segmentation
   only exists at Level 3, producer category only at Level 2. */

const LV_DIMS = {  firm:        { label: 'Firm',                  filter: 'firms',        of: r => r.firm,        scroll: true },
  office:      { label: 'Office',                filter: 'offices',      of: r => r.office,      scroll: true },
  city:        { label: 'City',                  filter: 'cities',       of: r => r.city,        scroll: true },
  msa:         { label: 'Metro area',            filter: 'msas',         of: r => r.msa,         scroll: true },
  state:       { label: 'State',                 filter: 'states',       of: r => r.state,       scroll: true },
  channel:     { label: 'Channel',               filter: 'channels',     of: r => r.channel,
                 color: k => ({ Wirehouse: 'rgb(96,165,250)', BA: 'rgb(167,139,250)', IBD: 'rgb(251,191,36)', RIA: 'rgb(52,211,153)' }[k]) },
  vehicle:     { label: 'Vehicle',               filter: 'vehicles',     mode: 'vehicle', of: r => lvRowVehicles(r)[0], order: () => LV_VEHICLES,
                 color: k => ({ 'Mutual Funds': 'rgb(52,211,153)', ETFs: 'rgb(96,165,250)', SMAs: 'rgb(167,139,250)', Privates: 'rgb(251,191,36)' }[k]) },
  discretion:  { label: 'Discretion',            filter: 'discretion',   of: r => r.discretion },
  product:     { label: 'Product',               mode: 'product',  filter: 'products' },
  prodCategory:{ label: 'Product category',      mode: 'category', filter: 'prodCategories' },
  role:        { label: 'Sales role',            mode: 'role' },
  prodCat:     { label: 'Producer category',     filter: 'prodCats',     of: r => r.prodCat, order: () => LV_PROD_CATS,
                 color: k => (k === 'Producer' ? 'rgb(52,211,153)' : k === 'Dabbler' ? 'rgb(251,191,36)' : 'rgb(148,163,184)') },
  prodBand:    { label: 'Rolling 12 production', filter: 'prodBands',    of: r => r.prodBand, order: () => LV_PROD_BANDS.slice(1).reverse(), color: k => LV_PROD_BAND_COLORS[k] },
  productBand: { label: '# of Products',         filter: 'productBands', of: r => r.productBand, order: () => LV_PROD_COUNT_BANDS.slice(1), color: () => 'rgb(96,165,250)' },
  compAdv:     { label: 'Competitive advantage', filter: 'compAdv',      of: r => r.compAdv, order: () => LV_COMP_ADV.map(a => a.key), color: k => LV_ADV_COLOR[k] },
  engagement:  { label: 'Engagement',            mode: 'engagement' },
  segment:     { label: 'Segment',               filter: 'segments',     of: r => r.segment, order: () => LV_SEGMENTS,
                 label_: k => `Segment ${k}`,    color: k => LV_SEG_META[k].dot },
};

const LV_DIMS_L2 = ['firm', 'office', 'city', 'msa', 'state', 'channel', 'vehicle', 'product', 'prodCategory', 'prodCat', 'prodBand', 'productBand', 'compAdv', 'discretion', 'role', 'engagement'];
const LV_DIMS_L3 = ['firm', 'office', 'city', 'msa', 'state', 'channel', 'vehicle', 'product', 'prodCategory', 'segment', 'prodBand', 'productBand', 'compAdv', 'discretion', 'role', 'engagement'];

/* Roll the filtered book up to the chosen dimension. Every bucket carries the
   same measures so the tiles stay comparable when the dimension changes. */
function lvDimBuckets(rows, dimKey, { measure, pk, roles, filters }) {
  const d = LV_DIMS[dimKey];
  const M = LV_MEASURES[measure];
  if (!d) return [];
  // When a vehicle is picked, product-level figures only count holdings in
  // that vehicle — an ETF filter never surfaces the same FA/Team's SMA.
  const vf = (filters && filters.vehicles) || [];
  const holdingsOf = (r) => (r.holdings || []).filter(h => !vf.length || vf.includes(h.vehicle));

  if (d.mode === 'vehicle') {
    // Rolled up from what each FA/Team holds: sales and tagged activity by the
    // product's vehicle, opportunity split on the FA/Team's holdings mix.
    // FA/Teams with no holdings sit under their stated preference.
    const by = {};
    LV_VEHICLES.forEach(v => (by[v] = { key: v, label: v, color: d.color(v), n: 0, opp: 0, yours: 0, sales: 0, acts: 0 }));
    rows.forEach(r => {
      const hs = r.holdings || [];
      if (!hs.length) {
        const b = by[r.vehiclePref]; if (!b) return;
        b.n += 1; b.opp += r[M.opp]; b.acts += lvActivity(r, roles).r12;
        return;
      }
      const tot = hs.reduce((a, h) => a + (h.aumM || 0), 0) || 1;
      const seen = new Set();
      hs.forEach(h => {
        const b = by[h.vehicle]; if (!b) return;
        const w = (h.aumM || 0) / tot;
        b.opp += r[M.opp] * w; b.yours += r[M.yours] * w;
        b.sales += lvHoldActual(h, measure); b.acts += h.acts || 0;
        if (!seen.has(h.vehicle)) { b.n += 1; seen.add(h.vehicle); }
      });
    });
    return LV_VEHICLES.map(v => ({ ...by[v], acts: Math.round(by[v].acts) }));
  }

  const fromSet = (key, label, set, color) => ({
    key, label, color: color || 'rgb(52,211,153)',
    n: set.length,
    opp: set.reduce((a, r) => a + r[M.opp], 0),
    yours: set.reduce((a, r) => a + r[M.yours], 0),
    sales: set.reduce((a, r) => a + lvActual(r, measure, pk), 0),
    acts: set.reduce((a, r) => a + lvActivity(r, roles).r12, 0),
  });

  if (d.mode === 'category' || d.mode === 'product') {
    // Market opportunity is carried at the FA/Team level, so it is allocated
    // down to the asset manager's product categories on each FA/Team's own
    // category mix — the same basis the packs are scoped on.
    const by = {};
    rows.forEach(r => {
      r.catMix.forEach(({ cat, w }) => {
        if (!by[cat]) by[cat] = { key: cat, label: cat, color: 'rgb(45,212,191)', n: 0, opp: 0, yours: 0, sales: 0, acts: 0, _rows: new Set() };
        const b = by[cat];
        b.opp += r[M.opp] * w;
        b.yours += r[M.yours] * w;
        b._rows.add(r.id);
      });
      // Activity lands on the category of the product it was logged against,
      // so it is counted from holdings rather than spread across the mix.
      holdingsOf(r).forEach(h => {
        const cat = LV_CAT_OF_PRODUCT[h.product];
        if (by[cat]) { by[cat].sales += lvHoldActual(h, measure); by[cat].acts += h.acts || 0; }
      });
    });
    const cats = Object.values(by).map(b => ({ ...b, n: b._rows.size, acts: Math.round(b.acts) }));

    if (d.mode === 'product') {
      // Each product inherits its category's opportunity, split across the
      // products the manager runs in that category.
      const catOf = {};
      cats.forEach(b => (catOf[b.key] = b));
      const perCat = {};
      LV_CATALOG.forEach(p => (perCat[p.cat] = (perCat[p.cat] || 0) + 1));
      const prod = {};
      rows.forEach(r => holdingsOf(r).forEach(h => {
        if (!prod[h.product]) prod[h.product] = { key: h.product, label: h.product.replace(/^Field /, ''), color: 'rgb(45,212,191)', n: 0, opp: 0, yours: 0, sales: 0, acts: 0 };
        prod[h.product].n += 1;
        prod[h.product].sales += lvHoldActual(h, measure);
        prod[h.product].acts += h.acts || 0;
      }));
      return Object.values(prod).map(p => {
        const cat = LV_CAT_OF_PRODUCT[p.key];
        const c = catOf[cat];
        const share = c ? 1 / (perCat[cat] || 1) : 0;
        return { ...p, opp: c ? c.opp * share : 0, yours: c ? c.yours * share : 0 };
      }).sort((a, b) => b.sales - a.sales);
    }
    // Ordered on sales, not opportunity, so the row order holds still when the
    // AUM / Inflows / Net Flows toggle changes.
    return cats.sort((a, b) => b.sales - a.sales);
  }

  if (d.mode === 'role') {
    // Production of the FA/Teams each role actually touched, alongside that
    // role's own activity count.
    return LV_ROLES.map(role => {
      const set = rows.filter(r => r.act[role.key].r12 > 0);
      const b = fromSet(role.key, role.label, set, 'rgb(56,189,248)');
      b.acts = rows.reduce((a, r) => a + r.act[role.key].r12, 0);
      return b;
    });
  }

  if (d.mode === 'engagement') {
    return LV_ENGAGEMENT.map(e => {
      const set = rows.filter(r => r.engagement.includes(e.key));
      return fromSet(e.key, LV_ENG_META[e.key].label, set, LV_ENG_META[e.key].color);
    }).sort((a, b) => b.sales - a.sales);
  }

  const keys = d.order ? d.order() : [...new Set(rows.map(d.of))];
  const out = keys.map(k => fromSet(k, d.label_ ? d.label_(k) : String(k), rows.filter(r => d.of(r) === k), d.color && d.color(k)));
  return d.order ? out : out.sort((a, b) => b.sales - a.sales);
}

/* Does an FA/Team fall in a given bucket of a dimension? Used to highlight the
   buckets behind whatever FA/Teams are selected in the grid. */
function lvInBucket(r, dimKey, key) {
  const d = LV_DIMS[dimKey];
  if (!d) return false;
  if (d.mode === 'product') return (r.holdings || []).some(h => h.product === key);
  if (d.mode === 'vehicle') return lvRowVehicles(r).includes(key);
  if (d.mode === 'category') return (r.catMix || []).some(c => c.cat === key);
  if (d.mode === 'role') return r.act[key] && r.act[key].r12 > 0;
  if (d.mode === 'engagement') return r.engagement.includes(key);
  return d.of(r) === key;
}

/* ---------- the tile ---------- */

const LVD_LINE = 'rgba(75,85,99,0.35)';
const LVD_DIM = 'rgb(200,205,213)';
const lvdPeriodKey = (p) => (LV_ROWS[0] && LV_ROWS[0].sales[p] !== undefined ? p : 'Rolling 12');
const lvdPeriodShort = (p) => (p === 'Rolling 12' ? 'R12' : p);

function LvDimTile({ dim, onDim, dims, rows, highlight, measure, period, filters, setFilters, fill, visibleRows = 5 }) {
  const d = LV_DIMS[dim] || LV_DIMS.firm;
  const M = LV_MEASURES[measure];
  const pk = lvdPeriodKey(period);
  const pkShort = lvdPeriodShort(pk);

  const buckets = React.useMemo(() => {
    // A tile never filters itself: it is built from the book with every
    // filter applied except its own dimension's, so picking a firm highlights
    // that firm while the rest of the list stays visible for comparison.
    const own = d.filter && (filters[d.filter] || []).length
      ? lvFilterRows(LV_ROWS, { ...filters, [d.filter]: [] })
      : rows;
    return lvDimBuckets(own, dim, { measure, pk, roles: filters.roles, filters });
  }, [rows, dim, measure, pk, filters, d.filter]);

  const salesTotal = buckets.reduce((a, b) => a + b.sales, 0) || 1;
  const actsTotal = buckets.reduce((a, b) => a + (b.acts || 0), 0) || 1;
  const maxSales = Math.max(1, ...buckets.map(b => b.sales));
  const scroll = buckets.length > visibleRows;
  const selected = (d.filter && filters[d.filter]) || [];
  const anyOn = selected.length > 0 || !!(highlight && highlight.length);
  const toggle = d.filter
    ? (v) => setFilters(s => ({ ...s, [d.filter]: s[d.filter].includes(v) ? s[d.filter].filter(x => x !== v) : [...s[d.filter], v] }))
    : null;

  // Label track carries a real floor so a firm or product name stays readable;
  // the tile grid's minimum below is sized to seat it plus the numbers.
  const cols = 'minmax(104px,2.2fr) minmax(46px,1fr) minmax(46px,1fr) minmax(32px,0.8fr) minmax(46px,1fr) minmax(30px,0.7fr) minmax(30px,0.7fr) minmax(34px,0.8fr)';
  const head = { fontFamily: 'Inter', fontSize: 8.5, color: LVD_DIM, textAlign: 'right', textTransform: 'uppercase', letterSpacing: 0.4, whiteSpace: 'nowrap' };
  const num = { fontFamily: 'Inter', fontSize: 11, textAlign: 'right', fontVariantNumeric: 'tabular-nums' };
  const dash = <span style={{ color: LVD_DIM }}>—</span>;

  return (
    <div style={{
      background: 'rgba(255,255,255,0.035)', border: `1px solid ${LVD_LINE}`, borderRadius: 12,
      padding: '12px 14px 12px', display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0,
      height: fill ? '100%' : undefined, boxSizing: 'border-box',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        <LvDimPicker value={dim} dims={dims} onChange={onDim} />
        <div style={{ fontFamily: 'Inter', fontSize: 10, color: LVD_DIM, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {measure === 'AUM' ? 'AUM · actual as of today' : `${measure} · ${pkShort}`}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: cols, gap: 5, paddingBottom: 5, paddingRight: scroll ? lvScrollbarW() : 0, borderBottom: `1px solid ${LVD_LINE}` }}>
        <span />
        <span style={head}>Mkt opp</span>
        <span style={head}>Yours</span>
        <span style={head}>Share</span>
        <span style={head}>{measure === 'AUM' ? 'Actual' : pkShort}</span>
        <span style={head}>% $</span>
        <span style={head}>Act</span>
        <span style={head}>% Act</span>
      </div>

      <div style={{
        display: 'flex', flexDirection: 'column', gap: 4,
        // Rows always stack from the top; a short list leaves space below rather
        // than spreading out to fill a taller neighbour's height.
        flex: fill && !scroll ? 1 : undefined,
        justifyContent: 'flex-start',
        maxHeight: scroll ? visibleRows * 27 + (visibleRows - 1) * 4 : undefined,
        overflowY: scroll ? 'auto' : undefined,
        overflowX: scroll ? 'hidden' : undefined,
        scrollbarGutter: scroll ? 'stable' : undefined,
      }}>
        {buckets.map(b => {
          const on = selected.includes(b.key) || (!!highlight && highlight.some(r => lvInBucket(r, dim, b.key)));
          return (
            <button key={b.key} onClick={() => toggle && toggle(b.key)} style={{
              display: 'grid', gridTemplateColumns: cols, alignItems: 'center', gap: 5,
              background: on ? 'rgba(16,185,129,0.10)' : 'transparent', border: 'none',
              padding: scroll ? '3px 0' : '3px 5px', margin: scroll ? 0 : '0 -5px', borderRadius: 6,
              cursor: toggle ? 'pointer' : 'default', textAlign: 'left',
            }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: 'Inter', fontSize: 10.5, fontWeight: on ? 600 : 400, color: on ? 'rgb(52,211,153)' : anyOn ? 'rgb(163,163,163)' : 'rgb(209,213,219)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 3 }}>{b.label}</div>
                <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.max(0, (b.sales / maxSales) * 100)}%`, height: '100%', background: b.color, borderRadius: 2 }} />
                </div>
              </div>
              <span style={{ ...num, color: 'rgb(163,163,163)' }}>{b.opp == null ? dash : M.fmt(b.opp)}</span>
              <span style={{ ...num, color: 'rgb(52,211,153)', fontWeight: 600 }}>{b.yours == null ? dash : M.fmt(b.yours)}</span>
              <span style={{ ...num, color: 'rgb(163,163,163)' }}>{b.opp ? lvFmtPct(Math.abs(b.yours / b.opp)) : dash}</span>
              <span style={{ ...num, color: 'rgb(249,250,251)', fontWeight: 600 }}>{lvFmtKs(b.sales, measure)}</span>
              <span style={{ ...num, color: LVD_DIM }}>{((b.sales / salesTotal) * 100).toFixed(0)}%</span>
              <span style={{ ...num, color: 'rgb(163,163,163)' }}>{b.acts == null ? dash : b.acts}</span>
              <span style={{ ...num, color: LVD_DIM }}>{b.acts == null ? dash : `${((b.acts / actsTotal) * 100).toFixed(0)}%`}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* Dimension picker — the tile's title doubles as the control. */
function LvDimPicker({ value, dims, onChange }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!open) return;
    const off = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', off);
    return () => document.removeEventListener('mousedown', off);
  }, [open]);
  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <button onClick={() => setOpen(o => !o)} title="Change dimension" style={{
        display: 'inline-flex', alignItems: 'center', gap: 6, padding: '2px 6px', margin: '0 -6px',
        background: open ? 'rgba(16,185,129,0.14)' : 'transparent', border: 'none', borderRadius: 6,
        cursor: 'pointer', fontFamily: 'Inter', fontSize: 11, fontWeight: 600,
        color: open ? 'rgb(52,211,153)' : 'rgb(249,250,251)', whiteSpace: 'nowrap',
      }}>
        {LV_DIMS[value].label}
        <i className="fa-solid fa-chevron-down" style={{ fontSize: 8, color: LVD_DIM }} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 26, left: -6, zIndex: 40, minWidth: 186, padding: 5,
          maxHeight: 300, overflowY: 'auto',
          background: 'rgb(17,24,39)', border: '1px solid rgba(75,85,99,0.6)', borderRadius: 8,
          boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
        }}>
          {dims.map(k => (
            <button key={k} onClick={() => { onChange(k); setOpen(false); }} style={{
              display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '6px 9px',
              background: value === k ? 'rgba(16,185,129,0.14)' : 'transparent',
              border: 'none', borderRadius: 6, cursor: 'pointer', textAlign: 'left',
              color: value === k ? 'rgb(52,211,153)' : 'rgb(209,213,219)',
              fontFamily: 'Inter', fontSize: 12, whiteSpace: 'nowrap',
            }}>
              <i className="fa-solid fa-check" style={{ fontSize: 9, opacity: value === k ? 1 : 0 }} />
              {LV_DIMS[k].label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* Six dimension tiles with independent, persisted dimension choices. */
function LvDimTileRow({ defaults, dims, rows, highlight, measure, period, filters, setFilters, storageKey }) {
  const [picks, setPicks] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem(storageKey)) || defaults; } catch (e) { return defaults; }
  });
  React.useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(picks)); } catch (e) {}
  }, [picks, storageKey]);
  const set = (i, v) => setPicks(p => p.map((x, j) => (j === i ? v : x)));
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(max(480px, 30%), 1fr))', gap: 14, alignItems: 'stretch' }}>
      {picks.map((k, i) => (
        <LvDimTile key={i} dim={k} onDim={v => set(i, v)} dims={dims}
          rows={rows} highlight={highlight} measure={measure} period={period}
          filters={filters} setFilters={setFilters} fill />
      ))}
    </div>
  );
}

/* Narrow dimension rail that sits to the left of a main grid and takes the
   grid's height. The header picker swaps the dimension; each value is a
   filter toggle. */
function LvRail({ picker, note, items, onToggle, head = 'Sales' }) {
  const anyOn = items.some(b => b.on);
  const max = Math.max(1, ...items.map(b => Math.abs(b.bar != null ? b.bar : b.value || 0)));
  return (
    <div style={{ height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 12px 10px', background: 'rgba(255,255,255,0.035)', border: `1px solid ${LVD_LINE}`, borderRadius: 12, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, paddingLeft: 6, position: 'relative', zIndex: 5 }}>{picker}</div>
      {note && <div style={{ fontFamily: 'Inter', fontSize: 10, color: LVD_DIM, paddingLeft: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{note}</div>}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'Inter', fontSize: 9, fontWeight: 600, color: LVD_DIM, textTransform: 'uppercase', letterSpacing: 0.5, paddingBottom: 5, borderBottom: `1px solid ${LVD_LINE}` }}>
        <span>Value</span><span>{head}</span>
      </div>
      <div className="l3-sig-list" style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column', gap: 2, marginRight: -4, paddingRight: 4 }}>
        {items.map(b => (
          <button key={b.key} onClick={() => onToggle(b.key)} style={{
            display: 'flex', flexDirection: 'column', gap: 4, padding: '6px 7px', border: 'none', borderRadius: 7, cursor: 'pointer', textAlign: 'left', flexShrink: 0,
            background: b.on ? 'rgba(16,185,129,0.12)' : 'transparent', boxShadow: b.on ? 'inset 0 0 0 1px rgba(16,185,129,0.55)' : 'none',
          }}>
            <span style={{ display: 'flex', alignItems: 'baseline', gap: 8, width: '100%' }}>
              <span style={{ flex: 1, minWidth: 0, fontFamily: 'Inter', fontSize: 11.5, fontWeight: b.on ? 600 : 500, color: b.on ? 'rgb(52,211,153)' : anyOn ? 'rgb(163,163,163)' : 'rgb(229,231,235)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.label}</span>
              <span style={{ fontFamily: 'Inter', fontSize: 11.5, fontWeight: 600, color: 'rgb(249,250,251)', fontVariantNumeric: 'tabular-nums' }}>{b.fmt}</span>
            </span>
            <span style={{ display: 'block', height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', width: '100%' }}>
              <span style={{ display: 'block', width: `${Math.max(0, (Math.abs(b.bar != null ? b.bar : b.value || 0) / max) * 100)}%`, height: '100%', background: b.color || 'rgb(52,211,153)', borderRadius: 2 }} />
            </span>
            {b.sub && <span style={{ fontFamily: 'Inter', fontSize: 10, color: LVD_DIM, fontVariantNumeric: 'tabular-nums' }}>{b.sub}</span>}
          </button>
        ))}
        {!items.length && <div style={{ fontFamily: 'Inter', fontSize: 11, color: LVD_DIM, padding: '14px 0', textAlign: 'center' }}>Nothing in this slice.</div>}
      </div>
    </div>
  );
}

/* Territory Analytics rail — same buckets as the stat tiles. */
const LV_RAIL_DIMS = ['city', 'vehicle', 'prodCategory', 'product', 'prodBand', 'productBand', 'firm', 'office', 'msa', 'state', 'channel', 'prodCat', 'compAdv', 'discretion'];
function LvDimRail({ rows, measure, period, filters, setFilters, dims = LV_RAIL_DIMS, storageKey = 'amp_l2rail' }) {
  const [dim, setDim] = React.useState(() => { try { const v = localStorage.getItem(storageKey); return dims.includes(v) ? v : dims[0]; } catch (e) { return dims[0]; } });
  React.useEffect(() => { try { localStorage.setItem(storageKey, dim); } catch (e) {} }, [dim]);
  const d = LV_DIMS[dim];
  const pk = lvdPeriodKey(period);
  const buckets = React.useMemo(() => {
    const own = d.filter && (filters[d.filter] || []).length ? lvFilterRows(LV_ROWS, { ...filters, [d.filter]: [] }) : rows;
    return lvDimBuckets(own, dim, { measure, pk, roles: filters.roles, filters });
  }, [rows, dim, measure, pk, filters]);
  const tot = buckets.reduce((a, b) => a + b.sales, 0) || 1;
  const sel = (d.filter && filters[d.filter]) || [];
  const items = buckets.filter(b => b.n || b.sales).map(b => ({
    key: b.key, label: b.label, color: b.color, value: b.sales, fmt: lvFmtKs(b.sales, measure), on: sel.includes(b.key),
    sub: `${b.n.toLocaleString()} FA/Teams · ${Math.round((b.sales / tot) * 100)}% of sales`,
  }));
  const toggle = (v) => d.filter && setFilters(s => ({ ...s, [d.filter]: s[d.filter].includes(v) ? s[d.filter].filter(x => x !== v) : [...s[d.filter], v] }));
  return <LvRail picker={<LvDimPicker value={dim} dims={dims} onChange={setDim} />} note={sel.length ? `${sel.length} selected · tap to filter` : 'Tap a value to filter the page'} items={items} onToggle={toggle}
    head={measure === 'AUM' ? 'AUM' : `${lvdPeriodShort(pk)} ${measure === 'Net Flows' ? 'net' : 'sales'}`} />;
}

Object.assign(window, { LvRail, LvDimRail, LV_RAIL_DIMS, lvInBucket, LV_DIMS, LV_DIMS_L2, LV_DIMS_L3, lvDimBuckets, LvDimTile, LvDimPicker, LvDimTileRow });
