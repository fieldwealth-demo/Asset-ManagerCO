/* Level 3 — Segmentation & Predictive.
   The Distribution Intelligence layout narrowed to one wholesaler's territory.
   Segment (A/B/C) ranks the size of the addressable opportunity; the ML
   signals and their confidence scores say who is likely to buy, how much and
   what. Every opportunity figure on this page is signal opportunity, not the
   market opportunity from the data packs. */

const L3_STATES = ['us-ny', 'us-ma', 'us-pa', 'us-ct', 'us-ri', 'us-nj', 'us-me', 'us-nh', 'us-vt', 'us-md', 'us-de'];

const L3_GEO = [
  { key: 'State', label: 'State', field: 'state', filter: 'states' },
  { key: 'MSA',   label: 'Metro area (MSA)', field: 'msa', filter: 'msas' },
  { key: 'City',  label: 'City', field: 'city', filter: 'cities' },
  { key: 'ZIP',   label: 'ZIP code', field: 'zip', filter: 'zips' },
];

/* ---------- territory map, coloured by segment ---------- */

function L3TerritoryMap({ rows, geo, selected, onPick }) {
  const ref = React.useRef(null);
  const chartRef = React.useRef(null);
  const clickRef = React.useRef(onPick);
  React.useEffect(() => { clickRef.current = onPick; }, [onPick]);
  const [topology, setTopology] = React.useState(null);

  const points = React.useMemo(() => {
    const by = {};
    rows.forEach(p => {
      const k = p[geo.field];
      if (!by[k]) by[k] = { name: k, lat: p.lat, lon: p.lon, opp: 0, n: 0, sigs: 0, seg: { A: 0, B: 0, C: 0 }, latSum: 0, lonSum: 0 };
      const c = by[k];
      c.opp += p.signalOpp; c.n += 1; c.sigs += p.signals.length; c.seg[p.segment] += p.signalOpp;
      c.latSum += p.lat; c.lonSum += p.lon;
    });
    return Object.values(by).map(c => ({
      ...c, lat: c.latSum / c.n, lon: c.lonSum / c.n,
      dom: LV_SEGMENTS.reduce((best, s) => (c.seg[s] > c.seg[best] ? s : best), 'C'),
    })).filter(c => c.opp > 0);
  }, [rows, geo.field]);

  React.useEffect(() => {
    if (window.__usTopology) { setTopology(window.__usTopology); return; }
    let cancelled = false;
    fetch('https://code.highcharts.com/mapdata/countries/us/us-all.topo.json')
      .then(r => r.json())
      .then(t => { if (!cancelled) { window.__usTopology = t; setTopology(t); } })
      .catch(e => console.error('Map data load failed', e));
    return () => { cancelled = true; };
  }, []);

  const bubbles = React.useCallback((list, sel) => list.map(c => {
    const m = LV_SEG_META[c.dom];
    const on = !sel.length || sel.includes(c.name);
    return {
      name: c.name, lat: c.lat, lon: c.lon, z: c.opp,
      opp: c.opp, n: c.n, sigs: c.sigs, dom: c.dom, mix: c.seg,
      color: on ? m.fill : 'rgba(120,130,150,0.12)',
      marker: { lineColor: on ? m.dot : 'rgba(120,130,150,0.4)', lineWidth: 1.5 },
    };
  }), []);

  React.useEffect(() => {
    if (!topology || !ref.current || typeof Highcharts === 'undefined' || !Highcharts.mapChart) return;
    if (chartRef.current) return;
    chartRef.current = Highcharts.mapChart(ref.current, {
      chart: { map: topology, backgroundColor: 'transparent', margin: [4, 4, 4, 4], spacing: [0, 0, 0, 0], animation: false },
      title: { text: '' }, credits: { enabled: false }, legend: { enabled: false },
      mapNavigation: {
        enabled: true, enableMouseWheelZoom: false, enableDoubleClickZoom: true,
        buttonOptions: {
          alignTo: 'spacingBox', align: 'left', verticalAlign: 'top', x: 8, y: 8,
          theme: {
            fill: 'rgba(13,20,32,0.78)', stroke: 'rgba(75,85,99,0.55)', 'stroke-width': 1, r: 6,
            style: { color: 'rgb(229,231,235)', fontFamily: 'Inter', fontSize: '13px', fontWeight: '600' },
            states: { hover: { fill: 'rgba(16,185,129,0.18)', style: { color: 'rgb(52,211,153)' } } },
          },
        },
      },
      mapView: {
        padding: 6,
        fitToGeometry: { type: 'MultiPoint', coordinates: [[-80.6, 38.6], [-67.4, 46.4], [-80.6, 46.4], [-67.4, 38.6]] },
      },
      tooltip: {
        useHTML: true, backgroundColor: 'rgba(13,20,32,0.96)', borderColor: 'rgba(75,85,99,0.55)',
        borderRadius: 8, shadow: false, padding: 10, hideDelay: 60,
        style: { color: '#fff', fontFamily: 'Inter', fontSize: '11px' },
        formatter: function () {
          const p = this.point;
          if (p && p.opp != null) {
            const mix = LV_SEGMENTS.map(s => `<span style="color:${LV_SEG_META[s].dot};font-weight:700;">${s}</span> ${distFmtM(p.mix[s])}`).join(' &nbsp; ');
            return '<div style="min-width:190px;">' +
              '<div style="font-size:12px;font-weight:700;color:#fff;margin-bottom:2px;">' + p.name + '</div>' +
              '<div style="font-size:10px;color:' + LV_SEG_META[p.dom].dot + ';font-weight:600;margin-bottom:6px;">Mostly segment ' + p.dom + '</div>' +
              '<div style="display:grid;grid-template-columns:auto auto;gap:2px 14px;font-size:11px;">' +
                '<span style="color:rgb(107,114,128);">Signal opp.</span><span style="text-align:right;color:rgb(52,211,153);font-weight:700;">' + distFmtM(p.opp) + '</span>' +
                '<span style="color:rgb(107,114,128);">FA/Teams</span><span style="text-align:right;color:#fff;font-weight:600;">' + p.n + '</span>' +
                '<span style="color:rgb(107,114,128);">Signals</span><span style="text-align:right;color:#fff;font-weight:600;">' + p.sigs + '</span>' +
              '</div><div style="margin-top:6px;font-size:10px;color:rgb(163,163,163);">' + mix + '</div></div>';
          }
          return false;
        },
      },
      plotOptions: {
        mapbubble: {
          minSize: 9, maxSize: 32, opacity: 0.86, animation: { duration: 250 }, cursor: 'pointer',
          states: { hover: { opacity: 1, lineWidthPlus: 2 } },
          point: { events: { click: function () { clickRef.current && clickRef.current(this.name); } } },
        },
        map: { nullColor: 'rgba(255,255,255,0.025)' },
      },
      series: [
        {
          name: 'US', mapData: topology, joinBy: 'hc-key', allAreas: false,
          data: DIST_CONUS_KEYS.map(k => ({ 'hc-key': k, value: 1, color: 'rgba(255,255,255,0.025)' })),
          borderColor: 'rgba(120,140,170,0.25)', borderWidth: 0.6,
          enableMouseTracking: false, states: { hover: { enabled: false } },
        },
        {
          name: 'Territory', mapData: topology, joinBy: 'hc-key', allAreas: false,
          data: L3_STATES.map(k => ({ 'hc-key': k, color: 'rgba(16,185,129,0.10)', borderColor: 'rgba(16,185,129,0.45)' })),
          borderWidth: 1, enableMouseTracking: false, states: { hover: { enabled: false } },
        },
        { type: 'mapbubble', name: 'Markets', data: bubbles(points, selected) },
      ],
    });
    return () => { try { chartRef.current && chartRef.current.destroy(); } catch (e) {} chartRef.current = null; };
  }, [topology, bubbles]);

  React.useEffect(() => {
    const ch = chartRef.current;
    if (!ch || !ch.series || ch.series.length < 3) return;
    try { ch.series[2].setData(bubbles(points, selected), true, false, false); } catch (e) {}
  }, [points, selected, bubbles]);

  React.useEffect(() => {
    if (!ref.current) return;
    // Guarded reflow: only on a real size change, one per frame. An unguarded
    // reflow can nudge its own box and loop forever.
    let raf = 0, lw = 0, lh = 0;
    const ro = new ResizeObserver(entries => {
      const b = entries[0] && entries[0].contentRect;
      if (!b) return;
      const w = Math.round(b.width), h = Math.round(b.height);
      if (w === lw && h === lh) return;
      lw = w; lh = h;
      if (raf) return;
      raf = requestAnimationFrame(() => { raf = 0; try { chartRef.current && chartRef.current.reflow(); } catch (e) {} });
    });
    ro.observe(ref.current);
    return () => { if (raf) cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);

  // The tile's row partner (the signal list) is taller, so the map fills
  // whatever height it is given rather than sitting at a fixed size.
  return (
    <div style={{
      position: 'relative', width: '100%', height: 420, borderRadius: 8, overflow: 'hidden',
      background: 'radial-gradient(ellipse 60% 70% at 50% 42%, rgba(28,42,66,0.5) 0%, rgba(11,21,36,0) 70%)',
    }}>
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <defs>
          <pattern id="l3-grid" width="36" height="36" patternUnits="userSpaceOnUse">
            <path d="M 36 0 L 0 0 0 36" fill="none" stroke="rgba(75,85,99,0.18)" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#l3-grid)" />
      </svg>
      <div ref={ref} style={{ width: '100%', height: '100%', position: 'relative', zIndex: 1 }} />
      <div style={{
        position: 'absolute', right: 14, bottom: 12, zIndex: 2, padding: '8px 12px',
        background: 'rgba(13,20,32,0.78)', border: '1px solid rgba(75,85,99,0.4)', borderRadius: 8, backdropFilter: 'blur(6px)',
      }}>
        <div style={{ fontFamily: 'Inter', fontSize: 9.5, fontWeight: 600, color: 'rgb(107,114,128)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 5 }}>Bubble = signal opp.</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {LV_SEGMENTS.map(s => (
            <span key={s} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: 'Inter', fontSize: 9.5, color: 'rgb(163,163,163)' }}>
              <span style={{ width: 9, height: 9, borderRadius: 9999, background: LV_SEG_META[s].fill, border: `1px solid ${LV_SEG_META[s].dot}` }} />
              {s}
            </span>
          ))}
        </div>
      </div>
      {!topology && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter', fontSize: 12, color: 'rgb(163,163,163)' }}>
          <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: 8 }} />Loading map…
        </div>
      )}
    </div>
  );
}

/* Grain picker — same popover treatment the Opportunity tiles use. */
function L3GeoPicker({ value, onChange }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!open) return;
    const off = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', off);
    return () => document.removeEventListener('mousedown', off);
  }, [open]);
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} title="Map grain" style={{
        height: 26, padding: '0 10px', borderRadius: 6, cursor: 'pointer',
        background: open ? 'rgba(16,185,129,0.15)' : 'rgba(0,0,0,0.3)',
        border: `1px solid ${open ? 'rgb(16,185,129)' : 'rgba(75,85,99,0.5)'}`,
        color: open ? 'rgb(52,211,153)' : 'rgb(209,213,219)',
        fontFamily: 'Inter', fontSize: 11, fontWeight: 500,
        display: 'inline-flex', alignItems: 'center', gap: 7,
      }}>
        <i className="fa-solid fa-sliders" style={{ fontSize: 10 }} />{value}
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 30, right: 0, zIndex: 30, minWidth: 150, padding: 5,
          background: 'rgb(17,24,39)', border: '1px solid rgba(75,85,99,0.6)', borderRadius: 8,
          boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
        }}>
          <div style={{ fontFamily: 'Inter', fontSize: 9, fontWeight: 600, color: 'rgb(107,114,128)', textTransform: 'uppercase', letterSpacing: 0.6, padding: '6px 9px 4px' }}>Map grain</div>
          {L3_GEO.map(g => (
            <button key={g.key} onClick={() => { onChange(g.key); setOpen(false); }} style={{
              display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 9px',
              background: value === g.key ? 'rgba(16,185,129,0.14)' : 'transparent',
              border: 'none', borderRadius: 6, cursor: 'pointer', textAlign: 'left',
              color: value === g.key ? 'rgb(52,211,153)' : 'rgb(209,213,219)',
              fontFamily: 'Inter', fontSize: 12,
            }}>
              <i className="fa-solid fa-check" style={{ fontSize: 9, opacity: value === g.key ? 1 : 0 }} />
              {g.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- signal-type list ---------- */

/* Signal families carry one colour each, shared by the family filter chips and
   every signal type inside the family, so the list reads as groups. */
const L3_FAM_COLORS = { Advantage: 'rgb(52,211,153)', 'Focus product': 'rgb(96,165,250)', Growth: 'rgb(251,191,36)', Recovery: 'rgb(244,114,182)', Coverage: 'rgb(167,139,250)' };
const L3_FAM_ICONS = { Advantage: 'chart-line', 'Focus product': 'bullseye', Growth: 'arrow-up-right-dots', Recovery: 'shield-halved', Coverage: 'calendar-check' };

function L3SignalTiles({ rows, selected, onToggle }) {
  const [sort, setSort] = React.useState({ k: 'opp', d: -1 });
  const stats = LV_SIG_TYPES.map(type => {
    const sigs = rows.flatMap(p => p.signals.filter(s => s.type === type));
    const meta = LV_SIG_META[type];
    return {
      type, n: sigs.length, group: meta.group, icon: meta.icon,
      color: L3_FAM_COLORS[meta.group] || meta.color,
      opp: sigs.reduce((a, s) => a + s.oppMax, 0),
      conf: lvWtdConf(sigs),
    };
  });
  const top = Math.max(1, ...stats.map(s => s.opp));
  const sorted = stats.slice().sort((a, b) => {
    const x = a[sort.k], y = b[sort.k];
    return (typeof x === 'string' ? x.localeCompare(y) : x - y) * sort.d;
  });
  const setK = (k) => setSort(s => (s.k === k ? { k, d: -s.d } : { k, d: k === 'type' ? 1 : -1 }));
  const head = (k, label, align) => (
    <button onClick={() => setK(k)} style={{
      background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', textAlign: align,
      fontFamily: 'Inter', fontSize: 9, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase',
      color: sort.k === k ? 'rgb(52,211,153)' : 'rgb(107,114,128)', whiteSpace: 'nowrap',
    }}>{label}{sort.k === k && <i className={`fa-solid fa-caret-${sort.d > 0 ? 'up' : 'down'}`} style={{ marginLeft: 4, fontSize: 8 }} />}</button>
  );
  const cols = '18px minmax(0,1fr) 84px 44px';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <div style={{ display: 'grid', gridTemplateColumns: cols, gap: 8, padding: '0 10px 6px 12px', borderBottom: '1px solid rgba(75,85,99,0.35)', marginBottom: 6 }}>
        <span />
        {head('type', 'Signal type', 'left')}
        <span style={{ textAlign: 'right' }}>{head('opp', 'Signal opp.', 'right')}</span>
        <span style={{ textAlign: 'right' }}>{head('conf', 'Conf.', 'right')}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, overflowY: 'auto', maxHeight: 360, paddingRight: 2 }}>
        {sorted.map(s => {
          const on = selected.includes(s.type);
          const dim = selected.length > 0 && !on;
          return (
            <button key={s.type} onClick={() => s.n && onToggle(s.type)} disabled={!s.n} title={`${s.group} · ${s.type}`} style={{
              display: 'grid', gridTemplateColumns: cols, alignItems: 'center', gap: 8, flexShrink: 0,
              padding: '7px 10px', borderRadius: 8,
              background: on ? s.color.replace('rgb', 'rgba').replace(')', ',0.14)') : 'rgba(255,255,255,0.03)',
              border: `1px solid ${on ? s.color : 'rgba(75,85,99,0.4)'}`,
              borderLeft: `3px solid ${s.color}`,
              cursor: s.n ? 'pointer' : 'default', opacity: !s.n ? 0.35 : dim ? 0.55 : 1,
              textAlign: 'left', transition: 'all .12s',
            }}>
              <i className={`fa-solid fa-${s.icon}`} style={{ fontSize: 11, color: s.color, justifySelf: 'center' }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, minWidth: 0 }}>
                  <span style={{ fontFamily: 'Inter', fontSize: 11.5, fontWeight: 600, color: on ? s.color : 'rgb(229,231,235)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.type}</span>
                  <span style={{ fontFamily: 'Inter', fontSize: 9.5, color: 'rgb(107,114,128)', whiteSpace: 'nowrap' }}>{s.n} signal{s.n === 1 ? '' : 's'}</span>
                </div>
                <div style={{ height: 3, marginTop: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                  <div style={{ width: `${(s.opp / top) * 100}%`, height: '100%', background: s.color, borderRadius: 2 }} />
                </div>
              </div>
              <div style={{ textAlign: 'right', fontFamily: 'Inter Display, Inter', fontSize: 14, fontWeight: 500, color: 'rgb(52,211,153)', fontVariantNumeric: 'tabular-nums' }}>{distFmtM(s.opp)}</div>
              <div style={{ textAlign: 'right', fontFamily: 'Inter', fontSize: 12.5, fontWeight: 600, color: 'rgb(209,213,219)', fontVariantNumeric: 'tabular-nums' }} title="Asset-weighted confidence">{s.conf || '—'}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- FA/Team summary ---------- */

function L3SummaryTable({ rows, sigTypes, period, measure = 'Inflows', roles, onViewClient }) {
  const [openId, setOpenId] = React.useState(null);
  const wrapRef = React.useRef(null);
  const [wrapW, setWrapW] = React.useState(0);
  React.useEffect(() => {
    if (!wrapRef.current || !window.ResizeObserver) return;
    const ro = new ResizeObserver(() => wrapRef.current && setWrapW(wrapRef.current.clientWidth));
    ro.observe(wrapRef.current);
    setWrapW(wrapRef.current.clientWidth);
    return () => ro.disconnect();
  }, []);
  const [sortKey, setSortKey] = React.useState('nbaOpp');
  const [sortDir, setSortDir] = React.useState(-1);
  const th = lvTh(sortKey, setSortKey, sortDir, setSortDir);

  // Signals in view, always ranked by confidence — the top one is the NBA.
  const pick = p => (sigTypes.length ? p.signals.filter(s => sigTypes.includes(s.type)) : p.signals)
    .slice().sort((a, b) => b.confidence - a.confidence);
  const pk = LV_ROWS[0] && LV_ROWS[0].sales[period] !== undefined ? period : 'Rolling 12';
  const pkShort = pk === 'Rolling 12' ? 'R12' : pk;
  const l3Th = { padding: '11px 4px' };
  const nbaTh = { padding: '11px 4px', background: 'rgba(167,139,250,0.06)' };
  const nbaTd = { ...lvTdR, padding: '9px 4px', background: 'rgba(167,139,250,0.06)' };

  const val = (p, k) => {
    const sigs = pick(p), nba = sigs[0] || { oppMax: 0, confidence: 0 };
    const a = lvActivity(p, roles);
    return {
      name: p.name, seg: 'CBA'.indexOf(p.segment),
      sales: lvActual(p, measure, pk), trend: p.salesTrend, prods: p.products,
      acts: a.r12, days: a.days == null ? 1e9 : a.days,
      nbaOpp: nba.oppMax, nbaConf: nba.confidence,
      sigs: sigs.length, opp: sigs.reduce((a2, s) => a2 + s.oppMax, 0), conf: lvWtdConf(sigs),
    }[k];
  };
  const sorted = rows.slice().sort((a, b) => {
    const x = val(a, sortKey), y = val(b, sortKey);
    return (typeof x === 'string' ? x.localeCompare(y) : x - y) * sortDir;
  });

  return (
    <div ref={wrapRef} style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 620 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'auto' }}>
        <thead>
          <tr>
            {th('FA / Team', 'name', false, { padding: '11px 6px 10px 12px' })}
            {th('Segment', 'seg', false, { padding: '11px 6px' })}
            {lvThPlain('Next best action', false, { padding: '11px 6px' })}
            {th('NBA opp.', 'nbaOpp', true, nbaTh)}
            {th('NBA conf.', 'nbaConf', true, nbaTh)}
            {th('Signals', 'sigs', true, { ...nbaTh, paddingLeft: 10 })}
            {th('Signal opp.', 'opp', true, nbaTh)}
            {th('Wtd conf.', 'conf', true, { ...nbaTh, paddingRight: 12 })}
            {th(lvActualLabel(measure, pkShort), 'sales', true, { padding: '11px 4px 10px 12px' })}
            {th('Trend', 'trend', true, l3Th)}
            {th('# Prod', 'prods', true, { ...l3Th, paddingRight: 12 })}
            {th('Act', 'acts', true, { padding: '11px 4px 10px 12px' })}
            {th('Days', 'days', true, l3Th)}
            {lvThPlain('Engagement', false, { padding: '11px 8px' })}
            {lvThPlain('', true, { padding: '11px 10px 10px 4px' })}
          </tr>
        </thead>
        <tbody>
          {sorted.map(p => {
            const sigs = pick(p);
            const nba = sigs[0];
            const open = openId === p.id;
            const opp = sigs.reduce((a, s) => a + s.oppMax, 0);
            const act = lvActivity(p, roles);
            const meta = nba ? LV_SIG_META[nba.type] : null;
            const label = nba ? lvNbaLabel(nba) : '—';
            return (
              <React.Fragment key={p.id}>
                <tr onClick={() => setOpenId(open ? null : p.id)} className="dp-row"
                  style={{ cursor: 'pointer', background: open ? 'rgba(16,185,129,0.07)' : 'transparent' }}>
                  <td style={{ ...lvTd, padding: '9px 6px 9px 12px', maxWidth: 168 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                      <i className={`fa-solid fa-chevron-${open ? 'down' : 'right'}`} style={{ fontSize: 9, color: 'rgb(107,114,128)', width: 9, flexShrink: 0 }} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 500, fontSize: 12, color: 'rgb(249,250,251)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                        <div style={{ fontSize: 10, color: 'rgb(107,114,128)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.firm} · {p.city}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ ...lvTd, padding: '9px 6px' }}><LvSegBadge seg={p.segment} size={18} /></td>
                  <td style={{ ...lvTd, padding: '9px 6px', maxWidth: 190 }}>
                    {meta && (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6, maxWidth: '100%', padding: '3px 9px', borderRadius: 6,
                        background: meta.color.replace('rgb', 'rgba').replace(')', ',0.13)'),
                        border: `1px solid ${meta.color.replace('rgb', 'rgba').replace(')', ',0.35)')}`,
                        color: meta.color, fontFamily: 'Inter', fontSize: 10.5, fontWeight: 600, whiteSpace: 'nowrap',
                      }}>
                        <i className={`fa-solid fa-${meta.icon}`} style={{ fontSize: 9, flexShrink: 0 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
                      </span>
                    )}
                  </td>
                  <td style={{ ...nbaTd, color: 'rgb(52,211,153)', fontWeight: 600 }}>{nba ? distFmtM(nba.oppMax) : '—'}</td>
                  <td style={nbaTd}>{nba ? <LvConfBar value={nba.confidence} width={28} /> : '—'}</td>
                  <td style={{ ...nbaTd, paddingLeft: 10 }}>{sigs.length}</td>
                  <td style={nbaTd}>{distFmtM(opp)}</td>
                  <td style={{ ...nbaTd, paddingRight: 12 }}><LvConfBar value={lvWtdConf(sigs)} color="rgb(167,139,250)" width={28} /></td>
                  <td style={{ ...lvTdR, padding: '9px 4px 9px 12px', color: lvActual(p, measure, pk) < 0 ? 'rgb(248,113,113)' : lvActual(p, measure, pk) ? 'rgb(249,250,251)' : 'rgb(107,114,128)', fontWeight: 600 }}>{lvFmtKs(lvActual(p, measure, pk), measure)}</td>
                  <td style={{ ...lvTdR, padding: '9px 4px' }}><LvTrend value={p.salesTrend} compact /></td>
                  <td style={{ ...lvTdR, padding: '9px 12px 9px 4px' }}>{p.products || '—'}</td>
                  <td style={{ ...lvTdR, padding: '9px 4px 9px 12px' }}>{act.r12}</td>
                  <td style={{ ...lvTdR, padding: '9px 4px', color: lvDaysColor(act.days), fontWeight: 600 }}>{act.days == null ? '—' : `${act.days}d`}</td>
                  <td style={{ ...lvTd, padding: '9px 8px' }}><LvEngIcons keys={p.engagement} max={3} /></td>
                  <td style={{ ...lvTdR, padding: '7px 10px 7px 4px' }}><LvEyeButton onClick={() => onViewClient(lvClientRow(p))} /></td>
                </tr>
                {open && (
                  <tr>
                    <td colSpan={16} style={{ padding: '0 14px 16px', background: 'rgba(16,185,129,0.03)', borderBottom: '1px solid rgba(75,85,99,0.16)' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px,1fr))', gap: 10, paddingTop: 12, width: wrapW ? wrapW - 28 : 'auto' }}>
                        {sigs.map((s, i) => {
                          const m = LV_SIG_META[s.type];
                          return (
                            <div key={i} style={{
                              padding: '11px 13px', borderRadius: 9, background: 'rgba(255,255,255,0.03)',
                              border: `1px solid ${m.color.replace('rgb', 'rgba').replace(')', i === 0 ? ',0.6)' : ',0.3)')}`,
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7, flexWrap: 'wrap' }}>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0, color: m.color, fontFamily: 'Inter', fontSize: 11, fontWeight: 700 }}>
                                  <i className={`fa-solid fa-${m.icon}`} style={{ fontSize: 9 }} />{s.type}
                                </span>
                                {i === 0 && (
                                  <span style={{ padding: '1px 6px', borderRadius: 4, background: 'rgba(16,185,129,0.16)', border: '1px solid rgba(16,185,129,0.45)', color: 'rgb(52,211,153)', fontFamily: 'Inter', fontSize: 9, fontWeight: 700, letterSpacing: 0.3 }}>NEXT BEST</span>
                                )}
                                <span style={{ flex: 1 }} />
                                <span style={{ fontFamily: 'Inter', fontSize: 10, color: 'rgb(107,114,128)' }}>{s.when}</span>
                              </div>
                              <div style={{ fontFamily: 'Inter', fontSize: 12, lineHeight: 1.55, color: 'rgb(229,231,235)', marginBottom: 9 }}
                                dangerouslySetInnerHTML={{ __html: s.desc }} />
                              <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
                                <L3Stat label="Signal opp." value={distFmtM(s.oppMax)} color="rgb(52,211,153)" />
                                <L3Stat label="Confidence" value={s.confidence} />
                                {s.product && <L3Stat label="Product" value={s.product} />}
                              </div>
                              <div style={{ marginTop: 9, paddingTop: 9, borderTop: '1px solid rgba(75,85,99,0.25)', fontFamily: 'Inter', fontSize: 10.5, lineHeight: 1.5, color: 'rgb(140,148,160)' }}>
                                <span style={{ color: 'rgb(107,114,128)', fontWeight: 600 }}>How it is calculated · </span>{LV_SIG_CALC[s.type]}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
          {!sorted.length && (
            <tr><td colSpan={16} style={{ ...lvTd, textAlign: 'center', color: 'rgb(107,114,128)', padding: '32px 0' }}>No FA/Teams match these filters.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function lvNbaLabel(s) {
  const verb = s.type === 'Retention Risk' ? 'Defend'
    : s.type === 'Fallen Angel' ? 'Re-open'
    : s.type === 'Meeting Opportunity' ? 'Meet'
    : s.type.startsWith('Focus') ? 'Introduce'
    : s.type === 'Cross-sell' ? 'Cross-sell'
    : s.type === 'Upsell' ? 'Expand'
    : 'Lead with';
  const obj = s.product || (s.type === 'Retention Risk' ? 'the exposed sleeve'
    : s.type === 'Fallen Angel' ? 'the dormant relationship'
    : s.type === 'Meeting Opportunity' ? 'in person' : 'the advantage case');
  return `${verb} ${obj}`;
}

function L3Stat({ label, value, color }) {
  return (
    <div>
      <div style={{ fontFamily: 'Inter', fontSize: 9, color: 'rgb(107,114,128)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontFamily: 'Inter', fontSize: 12, fontWeight: 600, color: color || 'rgb(249,250,251)', fontVariantNumeric: 'tabular-nums' }}>{value}</div>
    </div>
  );
}

/* Territory signal opportunity. A full-width band across the top of the page:
   headline range at the left, stats in the middle, family mix at the right. */
/* Territory band across the top of the dashboard. The left half is the same
   opportunity / yours / share / actual-sales read the Level 2 dashboard opens
   with; the right half is what the signal models add on top of it. */
function L3SignalOppCard({ oppMin, oppMax, wtdConf, sigCount, faCount, rows, measure, period, roles }) {
  const M = LV_MEASURES[measure];
  const pk = LV_ROWS[0] && LV_ROWS[0].sales[period] !== undefined ? period : 'Rolling 12';
  const pkShort = pk === 'Rolling 12' ? 'R12' : pk;
  const opp = rows.reduce((a, r) => a + r[M.opp], 0);
  const yours = rows.reduce((a, r) => a + r[M.yours], 0);
  const sales = rows.reduce((a, r) => a + lvActual(r, measure, pk), 0);
  const acts = rows.reduce((a, r) => a + lvActivity(r, roles).r12, 0);
  return (
    <div style={{
      background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(75,85,99,0.35)', borderRadius: 12,
      padding: '13px 18px', display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0,
    }}>
      {/* Wholesaler, then territory, then the measure in view — same order as
         the Sales & Activity header. */}
      <div style={{ fontFamily: 'Inter', fontSize: 11, fontWeight: 600, color: 'rgb(249,250,251)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {LV_WHOLESALER} · {LV_TERRITORY} territory · {measure}
      </div>
      <div style={{ display: 'grid', gap: 18, alignItems: 'end', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))' }}>
        {/* Signals lead; the territory read from Level 2 sits beside it. */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(110px,1.3fr) repeat(3, minmax(0,1fr))', gap: 14, alignItems: 'end' }}>
          <div>
            <div style={{ fontFamily: 'Inter', fontSize: 9, color: 'rgb(107,114,128)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 1 }}>Signal opportunity</div>
            <div style={{ fontFamily: 'Inter Display, Inter', fontSize: 26, fontWeight: 500, lineHeight: 1.1, color: 'rgb(52,211,153)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
              {distFmtM(oppMax)}
            </div>
          </div>
          <L3BigStat label="Signals" value={sigCount.toLocaleString()} size={19} />
          <L3BigStat label="FA/Teams" value={faCount.toLocaleString()} size={19} />
          <L3BigStat label="Wtd conf." value={wtdConf || '—'} size={19} color="rgb(167,139,250)" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0,1fr))', gap: 12, alignItems: 'end' }}>
          <L3BigStat label="Mkt opp." value={M.fmt(opp)} size={19} />
          <L3BigStat label="Yours" value={M.fmt(yours)} size={19} color="rgb(52,211,153)" />
          <L3BigStat label="Share" value={opp ? lvFmtPct(yours / opp) : '—'} size={19} />
          <L3BigStat label={lvActualLabel(measure, pkShort)} value={lvFmtKs(sales, measure)} size={19} />
          <L3BigStat label="Activities" value={acts.toLocaleString()} size={19} />
        </div>
      </div>
    </div>
  );
}

/* Signal-family filter strip above the signal-type list. */
function L3FamilyBar({ families, onFamily }) {
  const any = families.some(f => f.on);
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
      {families.map(f => (
        <button key={f.key} onClick={() => onFamily(f.key)} title={`${f.label} · ${distFmtM(f.opp)} · ${f.n} signals`} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, height: 24, padding: '0 9px',
          borderRadius: 9999, cursor: 'pointer', whiteSpace: 'nowrap',
          background: f.on ? f.color.replace('rgb', 'rgba').replace(')', ',0.16)') : 'rgba(255,255,255,0.03)',
          border: `1px solid ${f.on ? f.color : 'rgba(75,85,99,0.4)'}`,
          color: f.on ? f.color : 'rgb(163,163,163)',
          fontFamily: 'Inter', fontSize: 10.5, fontWeight: 500,
          opacity: any && !f.on ? 0.55 : 1,
        }}>
          <i className={`fa-solid fa-${f.icon}`} style={{ fontSize: 9 }} />
          {f.label}
          <span style={{ color: 'rgb(107,114,128)', fontVariantNumeric: 'tabular-nums' }}>{f.n}</span>
        </button>
      ))}
    </div>
  );
}

function L3BigStat({ label, value, color, size = 24 }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ fontFamily: 'Inter', fontSize: 9, color: 'rgb(107,114,128)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div>
      <div style={{ fontFamily: 'Inter Display, Inter', fontSize: size, fontWeight: 500, lineHeight: 1.1, color: color || 'rgb(249,250,251)', fontVariantNumeric: 'tabular-nums' }}>{value}</div>
    </div>
  );
}

/* Minimum-confidence control. Shows how much signal opportunity the threshold
   keeps against the total, so a large but low-confidence opportunity is
   visibly left out rather than silently inflating the figures. */
function L3ConfSlider({ value, onChange, rows }) {
  const all = rows.flatMap(p => p.signals);
  const total = all.reduce((a, s) => a + s.oppMax, 0);
  const kept = all.filter(s => s.confidence >= value);
  const keptOpp = kept.reduce((a, s) => a + s.oppMax, 0);
  const bands = [[0, 'All'], [50, '50+'], [70, '70+'], [85, '85+']];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '9px 11px', marginBottom: 10, borderRadius: 9, background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.25)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontFamily: 'Inter', fontSize: 10, fontWeight: 600, color: 'rgb(196,181,253)', textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap' }}>
          <i className="fa-solid fa-gauge-high" style={{ fontSize: 9, marginRight: 6 }} />Min. confidence
        </span>
        <input type="range" min={0} max={95} step={5} value={value} onChange={e => onChange(Number(e.target.value))}
          style={{ flex: 1, minWidth: 80, accentColor: 'rgb(167,139,250)' }} />
        <span style={{ fontFamily: 'Inter Display, Inter', fontSize: 15, fontWeight: 600, color: 'rgb(249,250,251)', minWidth: 26, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{value}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        {bands.map(([v, l]) => (
          <button key={v} onClick={() => onChange(v)} style={{
            height: 20, padding: '0 8px', borderRadius: 9999, cursor: 'pointer',
            background: value === v ? 'rgba(167,139,250,0.2)' : 'transparent',
            border: `1px solid ${value === v ? 'rgb(167,139,250)' : 'rgba(75,85,99,0.5)'}`,
            color: value === v ? 'rgb(196,181,253)' : 'rgb(163,163,163)',
            fontFamily: 'Inter', fontSize: 10, fontWeight: 500,
          }}>{l}</button>
        ))}
        <span style={{ flex: 1 }} />
        <span style={{ fontFamily: 'Inter', fontSize: 10.5, color: 'rgb(163,163,163)', whiteSpace: 'nowrap' }}>
          Keeps <strong style={{ color: 'rgb(52,211,153)', fontWeight: 600 }}>{distFmtM(keptOpp)}</strong> of {distFmtM(total)} · {kept.length}/{all.length} signals
        </span>
      </div>
    </div>
  );
}

/* ---------- page ---------- */

function Level3Page({ onSelectionsChange, onViewClient, filters, setFilters, period, measure }) {
  const [geoKey, setGeoKey] = React.useState('City');
  const geo = L3_GEO.find(g => g.key === geoKey);

  // Minimum confidence: signals below the threshold drop out of every figure on
  // the page — totals, signal types, the map, the grid and the next best action.
  const minConf = filters.minConf || 50;
  const byConf = React.useCallback(list => list.map(p => {
    if (minConf <= 50) return p;
    const signals = p.signals.filter(s => s.confidence >= minConf);
    return { ...p, signals, signalOpp: signals.reduce((a, s) => a + s.oppMax, 0), wtdConfidence: lvWtdConf(signals) };
  }), [minConf]);

  const rows = React.useMemo(() => byConf(lvFilterRows(LV_ROWS, filters)), [filters, byConf]);
  const tableRows = React.useMemo(() => {
    const base = minConf > 50 ? rows.filter(r => r.signals.length) : rows;
    return filters.sigTypes.length ? base.filter(r => r.signals.some(s => filters.sigTypes.includes(s.type))) : base;
  }, [rows, filters.sigTypes, minConf]);

  React.useEffect(() => {
    if (!onSelectionsChange) return;
    onSelectionsChange(lvSelectionChips(filters, setFilters));
  }, [filters, onSelectionsChange]);

  const tog = (key, v) => setFilters(s => ({ ...s, [key]: s[key].includes(v) ? s[key].filter(x => x !== v) : [...s[key], v] }));
  const picked = (p) => (filters.sigTypes.length ? p.signals.filter(s => filters.sigTypes.includes(s.type)) : p.signals);
  const allSigs = tableRows.flatMap(picked);
  const oppMin = allSigs.reduce((a, s) => a + s.oppMin, 0);
  const oppMax = allSigs.reduce((a, s) => a + s.oppMax, 0);
  const wtdConf = lvWtdConf(allSigs);

  const groups = [...new Set(LV_SIG_TYPES.map(t => LV_SIG_META[t].group))];
  const famColors = L3_FAM_COLORS;
  const famIcons = L3_FAM_ICONS;
  // The family mix is measured over every signal in the filtered book, not the
  // signal-type selection, so the bar stays stable while you toggle families.
  const famBase = React.useMemo(
    () => byConf(lvFilterRows(LV_ROWS, { ...filters, sigTypes: [] })).flatMap(p => p.signals),
    [filters, byConf]);
  const families = groups.map(g => {
    const types = LV_SIG_TYPES.filter(t => LV_SIG_META[t].group === g);
    const sigs = famBase.filter(s => LV_SIG_META[s.type].group === g);
    return {
      key: g, label: g, n: sigs.length, color: famColors[g], icon: famIcons[g], types,
      opp: sigs.reduce((a, s) => a + s.oppMax, 0),
      on: types.some(t => filters.sigTypes.includes(t)),
    };
  }).filter(f => f.n).sort((a, b) => b.opp - a.opp);

  // Clicking a family toggles every signal type inside it.
  const toggleFamily = (key) => {
    const fam = families.find(f => f.key === key);
    if (!fam) return;
    setFilters(s => {
      const on = fam.types.some(t => s.sigTypes.includes(t));
      return { ...s, sigTypes: on
        ? s.sigTypes.filter(t => !fam.types.includes(t))
        : [...new Set([...s.sigTypes, ...fam.types])] };
    });
  };

  return (
    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Territory band across the top, then signal types and the map. */}
      <L3SignalOppCard oppMin={oppMin} oppMax={oppMax} wtdConf={wtdConf}
        sigCount={allSigs.length} faCount={tableRows.length}
        rows={tableRows} measure={measure} period={period} roles={filters.roles} />

      {/* Signals lead, map follows — equal width so neither reads as the
         secondary panel. */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 16, alignItems: 'stretch' }}>
        <Tile title="Signal types"
          subtitle={filters.sigTypes.length ? `Filtered · ${filters.sigTypes.length} selected` : 'Total opportunity by signal type · tap to filter'}
          style={{ minHeight: 0 }}>
          <L3FamilyBar families={families} onFamily={toggleFamily} />
          <L3SignalTiles rows={rows} selected={filters.sigTypes} onToggle={v => tog('sigTypes', v)} />
        </Tile>
        <Tile title={`${LV_TERRITORY} territory`}
          subtitle="Bubble size = signal opportunity · colour = the segment holding most of it"
          right={<L3GeoPicker value={geoKey} onChange={setGeoKey} />}
          style={{ minHeight: 0 }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start' }}>
            <L3TerritoryMap rows={rows} geo={geo} selected={filters[geo.filter] || []}
              onPick={v => tog(geo.filter, v)} />
          </div>
        </Tile>
      </div>

      <Tile
        title="FA/Team Summary"
        subtitle="Ranked by next best action · click a row to expand its signals, highest confidence first"
        pad={0} style={{ minWidth: 0 }}>
        <L3SummaryTable rows={tableRows} sigTypes={filters.sigTypes} period={period} measure={measure} roles={filters.roles} onViewClient={onViewClient} />
      </Tile>
    </div>
  );
}

Object.assign(window, { L3ConfSlider, Level3Page, L3TerritoryMap, L3SummaryTable, L3SignalTiles, L3GeoPicker, L3SignalOppCard, L3FamilyBar, L3BigStat, lvNbaLabel });
