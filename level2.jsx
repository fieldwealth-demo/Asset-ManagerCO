/* Level 2 — Sales & CRM.
   The wholesaler's own territory, with actual sales (daily) and CRM activity
   blended onto the Level 1 opportunity and competitive-advantage view. The
   grid shows one measure at a time (AUM / Inflows / Net Flows) so the freed
   columns can carry actual production, product count and activity. */

const L2_PERIOD_KEY = (p) => (LV_ROWS[0] && LV_ROWS[0].sales[p] !== undefined ? p : 'Rolling 12');
const L2_PERIOD_SHORT = (p) => (p === 'Rolling 12' ? 'R12' : p);
const tightTh = { padding: '11px 4px 10px' };
const advTh = { padding: '11px 6px 10px', width: '1%', whiteSpace: 'nowrap', background: 'rgba(96,165,250,0.05)' };
const tightTd = { padding: '9px 4px', fontFamily: 'Inter', fontSize: 11.5, textAlign: 'right', color: 'rgb(229,231,235)', fontVariantNumeric: 'tabular-nums', borderBottom: '1px solid rgba(75,85,99,0.16)', whiteSpace: 'nowrap' };
const advTd = { ...tightTd, background: 'rgba(96,165,250,0.05)', color: 'rgb(191,219,254)' };
// Even column rhythm: every data column shrinks to its content (width 1%) with
// the same 6px inner padding, groups are separated by a wider GAP, and the
// FA/Team column absorbs whatever width is left over.
const GAP = 14;
const colTh = { padding: '11px 6px 10px', width: '1%', whiteSpace: 'nowrap' };
const colTd = { ...tightTd, padding: '9px 6px', width: '1%' };

/* ---------- book grid ---------- */

function L2BookTable({ rows, measure, period, roles, selected, onToggle, onViewClient, onAdvFilter }) {
  // Default sort is a measure-independent column, so switching AUM / Inflows /
  // Net Flows never reshuffles the rows underneath the activity columns.
  const [sortKey, setSortKey] = React.useState('sales');
  const [sortDir, setSortDir] = React.useState(-1);
  const th = lvTh(sortKey, setSortKey, sortDir, setSortDir);
  const M = LV_MEASURES[measure];
  const pk = L2_PERIOD_KEY(period);
  const pkShort = L2_PERIOD_SHORT(pk);
  const wrapRef = React.useRef(null);
  const [wrapW, setWrapW] = React.useState(0);
  React.useEffect(() => {
    if (!wrapRef.current || !window.ResizeObserver) return;
    const ro = new ResizeObserver(() => wrapRef.current && setWrapW(wrapRef.current.clientWidth));
    ro.observe(wrapRef.current);
    setWrapW(wrapRef.current.clientWidth);
    return () => ro.disconnect();
  }, []);
  // Wide tiles give share, trend and last-touch days their own columns;
  // narrower tiles stack them under the figure they qualify.
  const wide = wrapW >= 1040;
  const subS = { fontSize: 10, fontWeight: 400, color: 'rgb(176,182,192)', marginTop: 2 };

  const val = (r, k) => {
    const a = lvActivity(r, roles);
    return {
      adv: ['Low', 'Moderate', 'Strong'].indexOf(r.compAdv),
      name: r.name, opp: r[M.opp], yours: r[M.yours], share: r[M.share],
      ca: r[M.perf] + r[M.fee], perf: r[M.perf], fee: r[M.fee],
      cat: ['Prospect', 'Dabbler', 'Producer'].indexOf(r.prodCat),
      sales: lvActual(r, measure, pk), trend: r.salesTrend, prods: r.products,
      acts: a.r12, days: a.days == null ? 9999 : a.days,
    }[k];
  };
  const sorted = rows.slice().sort((a, b) => {
    const x = val(a, sortKey), y = val(b, sortKey);
    return (typeof x === 'string' ? x.localeCompare(y) : x - y) * sortDir;
  });

  return (
    <div ref={wrapRef} style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 560 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'auto' }}>
        <thead>
          <tr>
            {th('Adv', 'adv', false, { padding: '11px 4px 10px 12px', width: '1%' })}
            {th('FA / Team', 'name', false, { padding: '11px 10px 10px 6px' })}
            {th('Mkt opp.', 'opp', true, colTh)}
            {th(wide ? 'Yours' : 'Yours / share', 'yours', true, { ...colTh, paddingRight: wide ? 6 : GAP })}
            {wide && th('Share', 'share', true, { ...colTh, paddingRight: GAP })}
            {th('Comp adv. perf · fee', 'ca', true, { ...advTh, paddingLeft: GAP, paddingRight: GAP })}
            {th('Producer cat.', 'cat', false, { ...colTh, textAlign: 'left', paddingLeft: GAP })}
            {th(wide ? lvActualLabel(measure, pkShort) : `${lvActualLabel(measure, pkShort)} / trend`, 'sales', true, colTh)}
            {wide && th('Trend', 'trend', true, colTh)}
            {th('# Prod', 'prods', true, { ...colTh, paddingRight: GAP })}
            {th(wide ? 'Act' : 'Act / days', 'acts', true, { ...colTh, paddingLeft: GAP, paddingRight: wide ? 6 : GAP })}
            {wide && th('Days', 'days', true, { ...colTh, paddingRight: GAP })}
            {lvThPlain('Engagement', false, { ...colTh, textAlign: 'left' })}
            {lvThPlain('', true, { padding: '11px 10px 10px 4px', width: '1%' })}
          </tr>
        </thead>
        <tbody>
          {sorted.map(r => {
            const on = selected.includes(r.name);
            const neg = r[M.yours] < 0;
            const a = lvActivity(r, roles);
            const act = lvActual(r, measure, pk);
            const star = measure !== 'AUM' && r.gapKind !== 'aligned' && act > 0 && (
              <i className="fa-solid fa-asterisk" title={r.gapKind === 'uncovered'
                ? 'Includes sales in vehicles the data packs do not cover'
                : 'Ahead of the pack feed — your sales data is more recent'}
                style={{ fontSize: 6, marginLeft: 3, verticalAlign: 'top', color: 'rgb(96,165,250)' }} />
            );
            const days = <span style={{ color: lvDaysColor(a.days), fontWeight: 600 }}>{a.days == null ? '—' : `${a.days}d`}</span>;
            return (
              <tr key={r.id} onClick={() => onToggle(r.name)} className="dp-row"
                style={{ cursor: 'pointer', background: on ? 'rgba(16,185,129,0.09)' : 'transparent' }}>
                <td style={{ ...lvTd, padding: '9px 4px 9px 12px', width: 26 }}>
                  <LvAdvDot grade={r.compAdv} row={r} />
                </td>
                <td style={{ ...lvTd, padding: '9px 10px 9px 6px', maxWidth: wide ? 240 : 190 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 500, fontSize: 12, color: 'rgb(249,250,251)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</div>
                    <div style={{ fontSize: 10, color: 'rgb(107,114,128)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.firm} · {r.city}</div>
                  </div>
                </td>
                <td style={colTd}>{M.fmt(r[M.opp])}</td>
                <td style={{ ...colTd, paddingRight: wide ? 6 : GAP }}>
                  <div style={{ color: neg ? 'rgb(248,113,113)' : 'rgb(52,211,153)', fontWeight: 600 }}>{M.fmt(r[M.yours])}</div>
                  {!wide && <div style={subS}>{lvFmtPct(Math.abs(r[M.share]))}</div>}
                </td>
                {wide && <td style={{ ...colTd, paddingRight: GAP }}>{lvFmtPct(Math.abs(r[M.share]))}</td>}
                <td style={{ ...advTd, padding: '9px 6px', paddingLeft: GAP, paddingRight: GAP }}>
                  <div style={{ fontWeight: 600, color: 'rgb(219,234,254)' }}>{M.fmt(r[M.perf] + r[M.fee])}</div>
                  <div style={subS}>{M.fmt(r[M.perf])} · {M.fmt(r[M.fee])}</div>
                </td>
                <td style={{ ...lvTd, padding: '9px 6px', paddingLeft: GAP, width: '1%' }}><LvProdCatTag cat={r.prodCat} /></td>
                <td style={{ ...colTd, color: act < 0 ? 'rgb(248,113,113)' : act ? 'rgb(249,250,251)' : 'rgb(107,114,128)', fontWeight: 600 }}>
                  {lvFmtKs(act, measure)}{star}
                  {!wide && <div style={{ marginTop: 2 }}><LvTrend value={r.salesTrend} compact /></div>}
                </td>
                {wide && <td style={colTd}><div style={{ display: 'flex', justifyContent: 'flex-end' }}><LvTrend value={r.salesTrend} compact /></div></td>}
                <td style={{ ...colTd, paddingRight: GAP }}>{r.products || '—'}</td>
                <td style={{ ...colTd, paddingLeft: GAP, paddingRight: wide ? 6 : GAP }}>
                  <div>{a.r12}</div>
                  {!wide && <div style={subS}>{days}</div>}
                </td>
                {wide && <td style={{ ...colTd, paddingRight: GAP }}>{days}</td>}
                <td style={{ ...lvTd, padding: '9px 6px', width: '1%' }}><LvEngIcons keys={r.engagement} max={3} /></td>
                <td style={{ ...tightTd, padding: '7px 10px 7px 4px' }}><LvEyeButton onClick={() => onViewClient(lvClientRow(r))} /></td>
              </tr>
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

/* ---------- activity vs sales ---------- */

function L2ActivitySales({ rows, roles, period, onSelect }) {
  const selRef = React.useRef(onSelect);
  React.useEffect(() => { selRef.current = onSelect; }, [onSelect]);
  const roleKey = (roles || []).join(',');
  const pk = L2_PERIOD_KEY(period);
  const options = React.useMemo(() => {
    const byCat = LV_PROD_CATS.map(cat => ({
      type: 'scatter',
      name: cat,
      color: cat === 'Producer' ? 'rgba(52,211,153,0.8)' : cat === 'Dabbler' ? 'rgba(251,191,36,0.8)' : 'rgba(148,163,184,0.75)',
      marker: { symbol: 'circle', radius: 5, lineWidth: 1, lineColor: 'rgba(11,21,36,0.9)' },
      data: rows.filter(r => r.prodCat === cat).map(r => ({
        x: lvActivity(r, roles).r12,
        y: Math.round(r.sales[pk] / 100) / 10,
        name: r.name,
      })),
    }));
    return {
      chart: { type: 'scatter', height: 300, animation: false },
      xAxis: { title: { text: 'Activities, rolling 12', style: { color: 'rgb(200,205,213)', fontSize: '10.5px' } }, gridLineWidth: 1 },
      yAxis: { title: { text: `Actual sales, ${pk} ($M)`, style: { color: 'rgb(200,205,213)', fontSize: '10.5px' } } },
      legend: { enabled: true, align: 'center', verticalAlign: 'bottom' },
      tooltip: {
        formatter: function () {
          return `<b>${this.point.name}</b><br/>${this.x} activities · $${(this.y * 1000).toFixed(0)}k sold`;
        },
      },
      plotOptions: {
        series: { animation: false },
        scatter: {
          cursor: 'pointer',
          point: { events: { click: function () { selRef.current && selRef.current(this.name); } } },
          states: { hover: { halo: { size: 8 } } },
        },
      },
      series: byCat,
    };
  }, [rows, roleKey, pk]);
  return <HC options={options} style={{ height: 300 }} />;
}

/* ---------- rolling 12 production trend ---------- */

/* Twelve months of FA/Team counts by group, so the change in who is producing
   shows up over time. Each FA/Team's trailing-12 production is walked from
   its prior-year level to today's, and the FA/Team is counted in whichever
   band (or producing group) that value lands in for the month. */
function L2ProductionTrend({ rows, roles }) {
  const [dim, setDim] = React.useState('prodBand');
  const dims = ['prodBand', 'prodCat', 'vehicle', 'channel'];

  const months = React.useMemo(() => {
    const now = new Date();
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
      return d.toLocaleString('en-US', { month: 'short' }) + (d.getMonth() === 0 ? ` ${String(d.getFullYear()).slice(2)}` : '');
    });
  }, []);

  const series = React.useMemo(() => {
    const d = LV_DIMS[dim];
    const valAt = (r, m) => {
      if (r.lapseM != null) return m <= r.lapseM ? r.lapsedK : 0;
      if (r.winM != null && m < r.winM) return 0;
      const base = r.winM != null ? r.r12ProdK * ((m - r.winM + 1) / (12 - r.winM)) : r.prior12K + (r.r12ProdK - r.prior12K) * ((m + 1) / 12);
      return Math.max(0, Math.round(base));
    };
    const catOf = (k) => (k <= 0 ? 'Prospect' : k < 400 ? 'Dabbler' : 'Producer');
    let keys, groupOf;
    if (dim === 'prodBand') { keys = LV_PROD_BANDS.slice(1).reverse(); groupOf = (r, m) => lvBand(valAt(r, m)); }
    else if (dim === 'prodCat') { keys = ['Producer', 'Dabbler']; groupOf = (r, m) => catOf(valAt(r, m)); }
    else { keys = d.order ? d.order() : [...new Set(rows.map(d.of))]; groupOf = (r, m) => (valAt(r, m) > 0 ? d.of(r) : null); }
    const fallback = ['rgb(16,185,129)', 'rgb(59,130,246)', 'rgb(139,92,246)', 'rgb(234,179,8)', 'rgb(249,115,22)', 'rgb(20,184,166)'];
    return keys.map((k, ki) => ({
      type: 'column', name: d.label_ ? d.label_(k) : k,
      data: months.map((_, m) => rows.filter(r => groupOf(r, m) === k).length),
      ...wash((d.color && d.color(k)) || fallback[ki % fallback.length], 0.55),
    })).filter(s => s.data.some(v => v > 0));
  }, [rows, dim, months]);

  const options = React.useMemo(() => ({
    chart: { type: 'column', height: 280, animation: false },
    xAxis: { categories: months, tickmarkPlacement: 'on' },
    yAxis: { allowDecimals: false, title: { text: 'FA/Teams', style: { color: 'rgb(200,205,213)', fontSize: '10.5px' } } },
    legend: { enabled: true, align: 'center', verticalAlign: 'bottom' },
    tooltip: { shared: false, valueSuffix: ' FA/Teams' },
    plotOptions: { series: { animation: false, stacking: 'normal' }, column: { pointPadding: 0.04, groupPadding: 0.1, borderWidth: 0 } },
    series,
  }), [series, months]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 6 }}>
        <LvDimPicker value={dim} dims={dims} onChange={setDim} />
      </div>
      <HC options={options} style={{ height: 280 }} />
    </div>
  );
}

/* ---------- pack-reported sales against your own feed ---------- */

function L2TimingChart({ rows }) {
  const months = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
  const actualBase = rows.reduce((a, r) => a + r.r12ProdK, 0) / 12000;
  const packBase = rows.reduce((a, r) => a + r.yoursIn, 0) / 12;
  const actual = months.map((_, i) => Math.round(actualBase * (0.7 + ((i * 37) % 11) / 18) * 10) / 10);
  // Same measure from the packs: your sales as the packs report them. Lower
  // where vehicles aren't covered, and absent for the last two months because
  // the packs land behind your nightly feed.
  const packs = months.map((_, i) => (i >= months.length - 2 ? null
    : Math.round(packBase * (0.7 + ((i * 37) % 11) / 18) * (0.74 + ((i * 29) % 7) / 34) * 10) / 10));
  const options = React.useMemo(() => ({
    chart: { height: 260, animation: false },
    xAxis: { categories: months, tickmarkPlacement: 'on' },
    yAxis: [{ labels: { format: '${value}M' } }],
    legend: { enabled: true, align: 'center', verticalAlign: 'bottom' },
    tooltip: { shared: false, valuePrefix: '$', valueSuffix: 'M' },
    plotOptions: { series: { animation: false }, column: { pointPadding: 0.08, groupPadding: 0.14 } },
    series: [
      { type: 'column', name: 'Your sales as the packs report them', data: packs, ...wash('rgb(96,165,250)', 0.32) },
      { type: 'column', name: 'Your actual sales (CRM, daily)', data: actual, ...wash('rgb(16,185,129)', 0.55) },
    ],
  }), [rows]);
  return (
    <div>
      <HC options={options} style={{ height: 260 }} />
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginTop: 8, fontFamily: 'Inter', fontSize: 10.5, lineHeight: 1.5, color: 'rgb(163,163,163)' }}>
        <i className="fa-solid fa-circle-info" style={{ fontSize: 10, color: 'rgb(96,165,250)', marginTop: 2 }} />
        <span>Same measure, two sources. The standing gap is coverage — SMA and private sales the packs miss. The two empty months are timing: pack data runs through Jul 2026, your feed loads nightly.</span>
      </div>
    </div>
  );
}

/* Name search for the grid header — everything else lives in the filter drawer. */
function L2NameSearch({ value, onChange }) {
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: 9, fontSize: 10, color: 'rgb(107,114,128)', pointerEvents: 'none' }} />
      <input value={value} onChange={e => onChange(e.target.value)} placeholder="Search FA / Team" style={{
        height: 26, width: 176, padding: '0 26px 0 26px', borderRadius: 6,
        background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(75,85,99,0.5)',
        color: 'rgb(229,231,235)', fontFamily: 'Inter', fontSize: 11, outline: 'none',
      }} />
      {value && (
        <button onClick={() => onChange('')} title="Clear" style={{
          position: 'absolute', right: 6, width: 16, height: 16, borderRadius: 4, cursor: 'pointer',
          background: 'transparent', border: 'none', color: 'rgb(107,114,128)', fontSize: 10, padding: 0,
        }}><i className="fa-solid fa-xmark" /></button>
      )}
    </div>
  );
}

/* ---------- page ---------- */

const LV_TERR_FA = 7050;
function Level2Page({ onSelectionsChange, onViewClient, filters, setFilters, period, measure }) {
  const [query, setQuery] = React.useState('');
  const [selected, setSelected] = React.useState([]);
  const toggleSel = React.useCallback(name => {
    setSelected(p => p.includes(name) ? p.filter(x => x !== name) : [...p, name]);
  }, []);
  const tog = React.useCallback((key, v) => setFilters(s => ({
    ...s, [key]: s[key].includes(v) ? s[key].filter(x => x !== v) : [...s[key], v],
  })), [setFilters]);

  const rows = React.useMemo(() => lvFilterRows(LV_ROWS, filters), [filters]);
  const gridRows = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? rows.filter(r => r.name.toLowerCase().includes(q)) : rows;
  }, [rows, query]);
  const view = selected.length ? rows.filter(r => selected.includes(r.name)) : rows;
  const M = LV_MEASURES[measure];
  const pk = L2_PERIOD_KEY(period);
  const pkShort = L2_PERIOD_SHORT(pk);

  React.useEffect(() => {
    if (!onSelectionsChange) return;
    onSelectionsChange([
      ...selected.map(n => ({ key: `sel:${n}`, label: n, icon: 'user', onRemove: () => toggleSel(n) })),
      ...lvSelectionChips(filters, setFilters),
    ]);
  }, [selected, filters, onSelectionsChange]);

  const sum = (f) => view.reduce((a, r) => a + f(r), 0);
  const opp = sum(r => r[M.opp]), yours = sum(r => r[M.yours]);
  const salesTot = sum(r => lvActual(r, measure, pk));
  const actsTot = view.reduce((a, r) => a + lvActivity(r, filters.roles).r12, 0);
  const sellingN = view.filter(r => lvActual(r, measure, pk) !== 0).length;
  const coveredN = view.filter(r => lvActivity(r, filters.roles).r12 > 0).length;
  const priorSales = sum(r => r.prior12K) * (pk === 'Rolling 12' ? 1 : pk === 'YTD' ? 0.72 : pk === 'QTD' ? 0.25 : 0.083);
  const salesDelta = priorSales ? ((salesTot - priorSales) / priorSales) * 100 : 0;
  // Sales goal is set for the whole territory, so it reads the full book
  // whatever filters are on.
  const TG = lvTerritoryGoal(pk);
  const goal = TG.goal, goalAct = TG.act, goalPct = TG.pct;

  return (
    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Territory totals get their own full-width row: the breakdown tiles are
         much taller, and sharing a grid row with them stretched this card to
         twice its content height. */}
      <LvTriKpi title={`${LV_WHOLESALER} · ${LV_TERRITORY} territory · ${measure}`} items={[
        { label: 'Mkt opp.', value: M.fmt(opp) },
        { label: 'Yours', value: M.fmt(yours), strong: true },
        { label: 'Mkt share', value: opp ? lvFmtPct(yours / opp) : '—' },
        { label: 'Focus FA/Teams', value: view.length.toLocaleString(), sub: `of ${LV_TERR_FA.toLocaleString()} in territory` },
        { label: lvActualLabel(measure, pkShort), value: lvFmtKs(salesTot, measure), sub: measure === 'Inflows' ? `${salesDelta >= 0 ? '↑' : '↓'} ${Math.abs(salesDelta).toFixed(0)}% vs prior` : undefined },
        { label: `${pkShort} sales goal`, value: lvFmtKs(goal, 'Inflows'), sub: `Annual ${lvFmtKs(TG.annual, 'Inflows')}${pk === 'Rolling 12' ? '' : ` · ${Math.round(TG.frac * 100)}% of year`}` },
        { label: '% to goal', value: `${Math.round(goalPct * 100)}%`, strong: goalPct >= 1, sub: `${lvFmtKs(goalAct, 'Inflows')} sold · all products` },
        { label: measure === 'AUM' ? 'Holding' : 'Selling', value: sellingN.toLocaleString(), sub: `${view.length ? Math.round((sellingN / view.length) * 100) : 0}% of territory` },
        { label: 'Activities', value: actsTot.toLocaleString(), sub: `${(actsTot / Math.max(view.length, 1)).toFixed(1)} avg` },
        { label: 'Covered', value: coveredN.toLocaleString(), sub: `${view.length ? Math.round((coveredN / view.length) * 100) : 0}% of territory` },
      ]} />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'stretch', containerType: 'inline-size' }}>
        <style>{'.l2-rail{position:relative}.l2-rail-in{position:absolute;inset:0}@container (max-width: 1180px){.l2-rail{flex-basis:100%!important}.l2-rail-in{position:static!important}.l2-rail-in .l3-sig-list{max-height:200px!important}}'}</style>
        <div className="l2-rail" style={{ flex: '1 0 250px', maxWidth: '100%', minWidth: 0 }}>
          <div className="l2-rail-in">
            <LvDimRail rows={rows} measure={measure} period={period} filters={filters} setFilters={setFilters} />
          </div>
        </div>
      <Tile
        title={`${LV_TERRITORY} Territory`}
        subtitle={`${LV_WHOLESALER} · opportunity and competitive advantage from the unified data packs, production and activity from your own systems`}
        right={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <L2NameSearch value={query} onChange={setQuery} />
            {selected.length > 0 && (
              <button onClick={() => setSelected([])} style={{
                height: 24, padding: '0 10px', borderRadius: 9999, cursor: 'pointer',
                background: 'transparent', border: '1px solid rgba(75,85,99,0.5)',
                color: 'rgb(163,163,163)', fontFamily: 'Inter', fontSize: 10.5,
              }}>Clear {selected.length} selected</button>
            )}
          </div>
        }
        pad={0} style={{ flex: '999 1 600px', minWidth: 0 }}>
        <L2BookTable rows={gridRows} measure={measure} period={period} roles={filters.roles} selected={selected}
          onToggle={toggleSel} onViewClient={onViewClient} onAdvFilter={v => tog('compAdv', v)} />
      </Tile>
      </div>


      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px,1fr))', gap: 16 }}>
        <Tile title="Activity against sales"
          subtitle="One dot per FA/Team · click a dot to select it in the grid"
          style={{ minHeight: 360 }}>
          <L2ActivitySales rows={rows} roles={filters.roles} period={period} onSelect={toggleSel} />
        </Tile>
        <Tile title="Rolling 12 production trend"
          subtitle="Number of FA/Teams in each group, month by month"
          style={{ minHeight: 360 }}>
          <L2ProductionTrend rows={rows} roles={filters.roles} />
        </Tile>
      </div>

      <LvDimTileRow storageKey="amp_l2dims" dims={LV_DIMS_L2}
        defaults={['firm', 'vehicle', 'product', 'prodCat', 'prodBand', 'productBand']}
        rows={rows} highlight={selected.length ? view : null} measure={measure} period={period}
        filters={filters} setFilters={setFilters} />
    </div>
  );
}

Object.assign(window, { Level2Page, L2BookTable, L2ActivitySales, L2TimingChart, L2ProductionTrend });
