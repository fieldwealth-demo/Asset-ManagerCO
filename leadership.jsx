/* Sales Leadership dashboard — one view for sales management across regions
   and salespeople. Level 2 is the base (opportunity, share, actual sales,
   activity, engagement); Level 3 adds signal layers onto the same view. */

const ML_MONTHS = (() => {
  const now = new Date();
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    return d.toLocaleString('en-US', { month: 'short' }) + (d.getMonth() === 0 ? ` ${String(d.getFullYear()).slice(2)}` : '');
  });
})();
const mlAxisTitle = (t) => ({ text: t, style: { color: 'rgb(200,205,213)', fontSize: '10.5px' } });

function MlProdTrend({ rows }) {
  const [mode, setMode] = React.useState('band');
  const options = React.useMemo(() => {
    const keys = mode === 'band' ? LV_PROD_BANDS.slice(1).reverse() : ['Producer', 'Dabbler'];
    const groupOf = mode === 'band' ? (v => lvBand(v)) : mlCatOf;
    const catColor = { Producer: 'rgb(52,211,153)', Dabbler: 'rgb(251,191,36)' };
    const series = keys.map(k => ({
      type: 'column', name: k, yAxis: 0,
      data: ML_MONTHS.map((_, m) => rows.reduce((a, r) => { const v = mlValAt(r, m) / (r.count || 1); return v > 0 && groupOf(v) === k ? a + (r.count || 1) : a; }, 0)),
      ...wash(mode === 'band' ? LV_PROD_BAND_COLORS[k] : catColor[k], 0.55),
    }));
    return {
      chart: { height: 290, animation: false },
      xAxis: { categories: ML_MONTHS },
      yAxis: [{ allowDecimals: false, title: mlAxisTitle('Producing FA/Teams') }],
      legend: { enabled: true, align: 'center', verticalAlign: 'bottom' },
      tooltip: { shared: false, headerFormat: '<span style="font-size:10.5px;color:rgb(200,205,213)">{point.key}</span><br/>', pointFormat: '<span style="color:{series.borderColor}">●</span> {series.name}: <b>{point.y}</b> FA/Teams' },
      plotOptions: { series: { animation: false }, column: { stacking: 'normal', pointPadding: 0.04, groupPadding: 0.1, borderWidth: 0 } },
      series,
    };
  }, [rows, mode]);
  return (
    <Tile title="Producer trend" subtitle="Producing FA/Teams by rolling-12 production, month by month"
      right={<TabPills options={['Thresholds', 'Category']} value={mode === 'band' ? 'Thresholds' : 'Category'} onChange={v => setMode(v === 'Thresholds' ? 'band' : 'cat')} />}>
      <HC options={options} style={{ height: 290 }} />
    </Tile>
  );
}

function MlActTrend({ rows, role }) {
  const options = React.useMemo(() => {
    const colors = { ext: 'rgb(16,185,129)', int: 'rgb(59,130,246)', spec: 'rgb(168,85,247)' };
    const series = ML_ROLE_KEYS.map(k => ({
      type: 'column', name: `${ML_ROLE_LABEL[k]} activities`,
      data: ML_MONTHS.map((_, m) => Math.round(rows.reduce((a, r) => a + r.actM[k][m], 0))),
      ...wash(colors[k], k === role ? 0.7 : 0.4),
    }));
    // Unique FA/Teams touched by anyone in the month. One FA/Team can get
    // several activities, so this always sits at or below total activities.
    series.push({ type: 'spline', name: 'FA/Teams touched', color: 'rgb(249,250,251)', lineWidth: 2, marker: { radius: 2.5, fillColor: 'rgb(249,250,251)' },
      data: ML_MONTHS.map((_, m) => Math.round(rows.reduce((a, r) => (ML_ROLE_KEYS.some(k => r.actM[k][m] > 0) ? a + (r.focus ? 1 : Math.min(r.touched, ML_ROLE_KEYS.reduce((x, k) => x + r.actM[k][m], 0))) : a), 0))) });
    series.push({ type: 'spline', name: 'Engagement touches', color: 'rgb(251,191,36)', dashStyle: 'ShortDash', marker: { radius: 2.5, fillColor: 'rgb(251,191,36)' },
      data: ML_MONTHS.map((_, m) => Math.round(rows.reduce((a, r) => a + r.engM[m], 0))) });
    return {
      chart: { height: 290, animation: false },
      xAxis: { categories: ML_MONTHS },
      yAxis: [{ allowDecimals: false, title: mlAxisTitle('Count per month') }],
      legend: { enabled: true, align: 'center', verticalAlign: 'bottom' },
      tooltip: { shared: false, headerFormat: '<span style="font-size:10.5px;color:rgb(200,205,213)">{point.key}</span><br/>', pointFormat: '<span style="color:{series.color}">●</span> {series.name}: <b>{point.y:,.0f}</b>' },
      plotOptions: { series: { animation: false }, column: { stacking: 'normal', pointPadding: 0.04, groupPadding: 0.1, borderWidth: 1 } },
      series,
    };
  }, [rows, role]);
  return (
    <Tile title="Activity & engagement trend" subtitle="Monthly activities by role, unique FA/Teams touched and engagement touches · one axis">
      <HC options={options} style={{ height: 290 }} />
    </Tile>
  );
}

/* One bubble per salesperson: effort (activities per FA/Team) against result
   (market share), sized on the opportunity they cover. */
function MlEffortScatter({ rowsAll, xf, ctx, onPick }) {
  const pickRef = React.useRef(onPick);
  React.useEffect(() => { pickRef.current = onPick; }, [onPick]);
  const options = React.useMemo(() => {
    const base = mlFilter(rowsAll, { ...xf, person: [], region: [] }, ctx.role);
    const people = ML_PEOPLE.filter(p => p.role === ctx.role);
    const sel = xf.person, rsel = xf.region;
    const series = ML_REGIONS.map(rg => ({
      type: 'bubble', name: rg, color: ML_REGION_COLORS[rg],
      data: people.filter(p => p.regions[0] === rg).map(p => {
        const a = mlSum(base.filter(r => r[ctx.role] === p.name), ctx, xf);
        const on = (!sel.length || sel.includes(p.name)) && (!rsel.length || p.regions.some(x => rsel.includes(x)));
        return { name: p.name, x: Math.round(mlPct(a.acts, a.focusN) * 10) / 10, y: Math.round(mlPct(a.yours, a.opp) * 1000) / 10, z: a.opp, g: a.prior ? (a.inflow - a.prior) / a.prior : 0,
          color: on ? ML_REGION_COLORS[rg].replace('rgb', 'rgba').replace(')', ',0.6)') : 'rgba(120,130,150,0.15)' };
      }),
    })).filter(s => s.data.length);
    return {
      chart: { type: 'bubble', height: 300, animation: false },
      xAxis: { title: mlAxisTitle('Activities per focus FA/Team'), gridLineWidth: 1 },
      yAxis: { title: mlAxisTitle('Market share (%)'), labels: { format: '{value}%' } },
      legend: { enabled: true, align: 'center', verticalAlign: 'bottom' },
      tooltip: { useHTML: true, formatter: function () { const p = this.point; return `<b>${p.name}</b><br/>${p.x} act / focus FA · ${p.y}% share<br/>Sales ${p.g >= 0 ? '+' : '−'}${Math.abs(p.g * 100).toFixed(0)}% vs prior`; } },
      plotOptions: { series: { animation: false }, bubble: { minSize: 12, maxSize: 44, cursor: 'pointer', dataLabels: { enabled: true, format: '{point.name}', style: { fontSize: '9px', fontWeight: '500', color: 'rgb(209,213,219)', textOutline: 'none' }, y: -14 },
        point: { events: { click: function () { pickRef.current && pickRef.current(this.name); } } } } },
      series,
    };
  }, [rowsAll, xf, ctx]);
  return (
    <Tile title="Effort against share" subtitle={`One bubble per ${ML_ROLE_ONE[ctx.role].toLowerCase()} · size = market opportunity · click to filter`}>
      <HC options={options} style={{ height: 300 }} />
    </Tile>
  );
}

function MlThresholds({ rows, ctx }) {
  const [by, setBy] = React.useState('Region');
  const options = React.useMemo(() => {
    const cats = by === 'Region' ? ML_REGIONS.filter(rg => rows.some(r => r.region === rg))
      : ML_PEOPLE.filter(p => p.role === ctx.role && rows.some(r => r[ctx.role] === p.name)).map(p => p.name);
    const inCat = (r, c) => (by === 'Region' ? r.region === c : r[ctx.role] === c);
    const series = LV_PROD_BANDS.filter(b => b !== '$0').map(b => ({
      type: 'bar', name: b,
      data: cats.map(c => rows.reduce((a, r) => (inCat(r, c) && r.prodBand === b ? a + (r.count || 1) : a), 0)),
      ...wash(LV_PROD_BAND_COLORS[b], 0.6),
    })).reverse();
    return {
      chart: { type: 'bar', height: Math.max(240, cats.length * 26 + 90), animation: false },
      xAxis: { categories: cats },
      yAxis: { max: 100, title: { text: null }, labels: { format: '{value}%' } },
      legend: { enabled: true, align: 'center', verticalAlign: 'bottom', reversed: true },
      tooltip: { headerFormat: '<span style="font-size:10.5px;color:rgb(200,205,213)">{point.key}</span><br/>', pointFormat: '<span style="color:{series.borderColor}">●</span> {series.name}: <b>{point.y}</b> FA/Teams ({point.percentage:.0f}% of producers)', shared: false },
      plotOptions: { series: { animation: false, stacking: 'percent', borderWidth: 0 }, bar: { pointPadding: 0.08, groupPadding: 0.08 } },
      series,
    };
  }, [rows, by, ctx.role]);
  return (
    <Tile title="Production thresholds" subtitle="Share of producing FA/Teams in each rolling-12 production band"
      right={<TabPills options={['Region', ML_ROLE_ONE[ctx.role]]} value={by === 'Region' ? 'Region' : ML_ROLE_ONE[ctx.role]} onChange={v => setBy(v === 'Region' ? 'Region' : 'Person')} />}>
      <HC options={options} style={{ height: Math.max(240, (by === 'Region' ? 5 : 16) * 26 + 90) }} />
    </Tile>
  );
}

/* ---------- Level 3 layers ---------- */

function MlSignalPipeline({ rows, ctx, xf }) {
  const [by, setBy] = React.useState('Person');
  const options = React.useMemo(() => {
    const dim = by === 'Region' ? 'region' : 'person';
    const bs = mlBuckets(rows, dim, ctx, xf).sort((a, b) => b.sigOpp - a.sigOpp);
    return {
      chart: { type: 'bar', height: Math.max(260, bs.length * 24 + 90), animation: false },
      xAxis: { categories: bs.map(b => b.label) },
      yAxis: { title: mlAxisTitle('Signal opportunity ($M)'), labels: { format: '${value}M' } },
      legend: { enabled: true, align: 'center', verticalAlign: 'bottom' },
      tooltip: { shared: false, headerFormat: '<span style="font-size:10.5px;color:rgb(200,205,213)">{point.key}</span><br/>', pointFormat: '<span style="color:{series.borderColor}">●</span> {series.name}: <b>${point.y:.1f}M</b>' },
      plotOptions: { series: { animation: false, stacking: 'normal', borderWidth: 0 }, bar: { pointPadding: 0.08, groupPadding: 0.08 } },
      series: ML_FAMILIES.map(f => ({ type: 'bar', name: f, data: bs.map(b => Math.round((b.fam[f] || 0) * 10) / 10), ...wash(ML_FAM_COLORS[f], 0.55) })),
    };
  }, [rows, ctx, xf, by]);
  return (
    <Tile title={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>Signal pipeline <MlL3Tag /></span>}
      subtitle="Open signal opportunity by signal family" style={{ height: '100%', boxSizing: 'border-box' }}
      right={<TabPills options={['Region', ML_ROLE_ONE[ctx.role]]} value={by === 'Region' ? 'Region' : ML_ROLE_ONE[ctx.role]} onChange={v => setBy(v === 'Region' ? 'Region' : 'Person')} />}>
      <HC options={options} style={{ height: Math.max(260, (by === 'Region' ? 5 : 16) * 24 + 90) }} />
    </Tile>
  );
}

function MlSignalFunnel({ agg, bySeg }) {
  const steps = [
    { label: 'Signals surfaced', n: agg.sigN, sub: `${lvFmtM(agg.sigOpp)} signal opp.`, color: 'rgb(167,139,250)' },
    { label: 'Actioned', n: agg.sigAct, sub: 'Activity logged against the signal', color: 'rgb(96,165,250)' },
    { label: 'Meeting held', n: agg.sigMet, sub: 'Meeting or call with the FA/Team', color: 'rgb(56,189,248)' },
    { label: 'Won', n: agg.sigWon, sub: `${mlFmtK(agg.wonK)} sales attributed`, color: 'rgb(52,211,153)' },
  ];
  const top = Math.max(1, agg.sigN);
  return (
    <Tile title={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>Signal conversion <MlL3Tag /></span>}
      subtitle="How far the team takes the signals it is given" style={{ height: '100%', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {steps.map((s, i) => (
          <div key={s.label} style={{ display: 'grid', gridTemplateColumns: '120px minmax(0,1fr) 60px', gap: 12, alignItems: 'center' }}>
            <div>
              <div style={{ fontFamily: 'Inter', fontSize: 11.5, fontWeight: 600, color: ML_INK }}>{s.label}</div>
              <div style={{ fontFamily: 'Inter', fontSize: 9.5, color: ML_DIM }}>{s.sub}</div>
            </div>
            <div style={{ height: 22, borderRadius: 5, background: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
              <div style={{ width: `${(s.n / top) * 100}%`, height: '100%', background: s.color.replace('rgb', 'rgba').replace(')', ',0.5)'), borderRight: `2px solid ${s.color}`, display: 'flex', alignItems: 'center', paddingLeft: 8, boxSizing: 'border-box', fontFamily: 'Inter', fontSize: 11, fontWeight: 600, color: ML_INK, fontVariantNumeric: 'tabular-nums' }}>{s.n.toLocaleString()}</div>
            </div>
            <div style={{ textAlign: 'right', fontFamily: 'Inter', fontSize: 12, fontWeight: 600, color: i ? s.color : ML_DIM, fontVariantNumeric: 'tabular-nums' }}>{i ? `${Math.round(mlPct(s.n, steps[i - 1].n) * 100)}%` : '—'}</div>
          </div>
        ))}
        <div style={{ marginTop: 6, paddingTop: 10, borderTop: `1px solid ${ML_LINE}` }}>
          <div style={{ fontFamily: 'Inter', fontSize: 9.5, fontWeight: 600, color: ML_DIM, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>By segment</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 10 }}>
            {bySeg.map(b => (
              <div key={b.key} style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: `1px solid ${ML_LINE}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <LvSegBadge seg={b.key} size={16} />
                  <span style={{ fontFamily: 'Inter', fontSize: 10.5, color: ML_MUT }}>{b.n} FA/Teams</span>
                </div>
                <div style={{ fontFamily: 'Inter', fontSize: 10.5, color: ML_MUT, lineHeight: 1.6 }}>
                  Covered <strong style={{ color: ML_INK }}>{Math.round(mlPct(b.covered, b.n) * 100)}%</strong><br />
                  Actioned <strong style={{ color: ML_INK }}>{Math.round(mlPct(b.sigAct, b.sigN) * 100)}%</strong><br />
                  Won <strong style={{ color: 'rgb(52,211,153)' }}>{mlFmtK(b.wonK)}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Tile>
  );
}

function MlConfPills({ value, onChange }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <span style={{ fontFamily: 'Inter', fontSize: 9.5, color: ML_DIM, textTransform: 'uppercase', letterSpacing: 0.5 }}>Min. conf.</span>
      {[50, 70, 85].map(v => (
        <button key={v} onClick={() => onChange(v)} style={{
          height: 20, padding: '0 8px', borderRadius: 9999, cursor: 'pointer',
          background: value === v ? 'rgba(167,139,250,0.2)' : 'transparent', border: `1px solid ${value === v ? 'rgb(167,139,250)' : 'rgba(75,85,99,0.5)'}`,
          color: value === v ? 'rgb(196,181,253)' : ML_MUT, fontFamily: 'Inter', fontSize: 10, fontWeight: 500,
        }}>{v === 50 ? 'All' : `${v}+`}</button>
      ))}
    </span>
  );
}

/* ---------- page ---------- */

/* Filter drawer sections — same drawer shell the other dashboards use. */
function MlDrawerSections({ local, toggle, setMany, level, role, onRole }) {
  const uniq = (f) => [...new Set(ML_ROWS.map(f))].sort();
  return (
    <>
      <FilterGroupLabel>Sales team</FilterGroupLabel>
      <FilterSection label="Sales role" options={ML_ROLE_KEYS.map(k => ML_ROLE_LABEL[k])} selected={[ML_ROLE_LABEL[role]]} onToggle={v => onRole && onRole(ML_ROLE_KEYS.find(k => ML_ROLE_LABEL[k] === v))} />
      <FilterSection label="Region" options={ML_REGIONS} selected={local.region} onToggle={v => toggle('region', v)} />
      <SearchMultiSelect label={ML_ROLE_ONE[role]} placeholder={`All ${ML_ROLE_LABEL[role].toLowerCase()}`}
        options={ML_PEOPLE.filter(p => p.role === role).map(p => p.name)} selected={local.person} onChange={v => setMany('person', v)} />
      <FilterGroupLabel>Distribution</FilterGroupLabel>
      <FilterSection label="Channel" options={LV_ALL_CHANNELS} selected={local.channel} onToggle={v => toggle('channel', v)} />
      <SearchMultiSelect label="Firm" placeholder="All firms" options={uniq(r => r.firm)} selected={local.firm} onChange={v => setMany('firm', v)} />
      <FilterGroupLabel>Products</FilterGroupLabel>
      <FilterSection label="Vehicle" options={LV_VEHICLES} selected={local.vehicle} onToggle={v => toggle('vehicle', v)} />
      <SearchMultiSelect label="Product category" placeholder="All categories" options={LV_PROD_CATEGORIES} selected={local.cat} onChange={v => setMany('cat', v)} />
      <SearchMultiSelect label="Product" placeholder="All products" options={LV_CATALOG.map(p => p.name)} selected={local.product} onChange={v => setMany('product', v)} />
      <FilterGroupLabel>Sales</FilterGroupLabel>
      <FilterSection label="Producer category" options={LV_PROD_CATS} selected={local.prodCat} onToggle={v => toggle('prodCat', v)} />
      <SearchMultiSelect label="Production threshold (R12)" placeholder="All thresholds" options={LV_PROD_BANDS} selected={local.prodBand} onChange={v => setMany('prodBand', v)} />
      {level >= 3 && (
        <>
          <FilterGroupLabel>Segmentation &amp; signals</FilterGroupLabel>
          <FilterSection label="Segment" options={LV_SEGMENTS} selected={local.segment} onToggle={v => toggle('segment', v)} />
        </>
      )}
    </>
  );
}

function LeadershipPage({ level, measure, period, role, onSelectionsChange, xf, setXf, focus }) {
  const L3 = level >= 3;
  const base = React.useMemo(() => (focus ? mlFocusRows() : ML_ROWS), [focus]);
  const [minConf, setMinConf] = React.useState(50);
  React.useEffect(() => { setXf(s => ({ ...s, person: [] })); }, [role]);
  React.useEffect(() => { if (!L3) setXf(s => ({ ...s, segment: [] })); }, [L3]);
  const pk = ML_PK_FRAC[period] != null ? period : 'Rolling 12';
  const pkShort = pk === 'Rolling 12' ? 'R12' : pk;
  const ctx = React.useMemo(() => ({ measure, pk, role, minConf: L3 ? minConf : 50 }), [measure, pk, role, minConf, L3]);
  const M = LV_MEASURES[measure];
  const actualLabel = lvActualLabel(measure, pkShort);

  const toggle = React.useCallback((dim, key) => setXf(s => ({ ...s, [dim]: s[dim].includes(key) ? s[dim].filter(x => x !== key) : [...s[dim], key] })), []);
  const pickPerson = React.useCallback((name, dim, key) => setXf(s => {
    if (!dim) return { ...s, person: s.person.includes(name) ? s.person.filter(x => x !== name) : [...s.person, name] };
    const same = s.person.length === 1 && s.person[0] === name && s[dim].length === 1 && s[dim][0] === key;
    return same ? { ...s, person: [], [dim]: [] } : { ...s, person: [name], [dim]: [key] };
  }), []);

  const rows = React.useMemo(() => mlFilter(base, xf, role), [base, xf, role]);
  const gridRows = React.useMemo(() => mlFilter(base, { ...xf, person: [] }, role), [base, xf, role]);
  const tot = React.useMemo(() => mlSum(rows, ctx, xf), [rows, ctx, xf]);
  const bySeg = React.useMemo(() => (L3 ? mlBuckets(rows, 'segment', ctx, xf) : []), [rows, ctx, xf, L3]);
  const peopleN = new Set(rows.map(r => r[role])).size;

  React.useEffect(() => {
    if (!onSelectionsChange) return;
    const icons = { region: 'map', person: 'user-tie', firm: 'building-columns', channel: 'sitemap', vehicle: 'cube', cat: 'layer-group', product: 'box', prodCat: 'chart-simple', prodBand: 'coins', segment: 'layer-group' };
    const chips = [];
    ML_XF_KEYS.forEach(k => xf[k].forEach(v => chips.push({
      key: `${k}:${v}`, icon: icons[k], label: ML_DIMS[k].label_ ? ML_DIMS[k].label_(v) : v,
      onRemove: () => setXf(s => ({ ...s, [k]: s[k].filter(x => x !== v) })),
    })));
    if (L3 && minConf > 50) chips.push({ key: 'minconf', icon: 'gauge-high', label: `Confidence ≥ ${minConf}`, onRemove: () => setMinConf(50) });
    onSelectionsChange(chips);
  }, [xf, minConf, L3, onSelectionsChange]);

  const g = tot.prior ? (tot.inflow - tot.prior) / tot.prior : 0;
  const goal = React.useMemo(() => mlGoal(ML_ROWS.filter(r => (!xf.region.length || xf.region.includes(r.region)) && (!xf.person.length || xf.person.includes(r[role]))), role, pk), [xf.region, xf.person, role, pk]);
  const pctOf = (x) => `${Math.round(mlPct(x, tot.n) * 100)}% of book`;

  return (
    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <LvTriKpi title={`Sales team · ${peopleN} ${ML_ROLE_LABEL[role].toLowerCase()} · ${measure}`} items={[
        { label: 'Mkt opp.', value: M.fmt(tot.opp) },
        { label: 'Yours', value: M.fmt(tot.yours), strong: true },
        { label: 'Mkt share', value: tot.opp ? lvFmtPct(tot.yours / tot.opp) : '—' },
        { label: actualLabel, value: mlFmtK(tot.sales), sub: `${g >= 0 ? '↑' : '↓'} ${Math.abs(g * 100).toFixed(0)}% sales vs prior` },
        { label: `${pkShort} sales goal`, value: mlFmtK(goal.goal), sub: `Annual ${mlFmtK(goal.annual)}${pk === 'Rolling 12' ? '' : ` · ${Math.round(ML_PK_FRAC[pk] * 100)}% of year`}` },
        { label: '% to goal', value: `${Math.round(goal.pct * 100)}%`, strong: goal.pct >= 1, sub: `${mlFmtK(goal.act)} sold · all products` },
        { label: 'Focus FA/Teams', value: tot.focusN.toLocaleString(), sub: `Covered list · ${Math.round(mlPct(tot.focusSales, tot.sales) * 100)}% of sales` },
        { label: 'Producers', value: tot.producers.toLocaleString(), sub: pctOf(tot.producers) },
        { label: 'Activities', value: Math.round(tot.acts).toLocaleString(), sub: `${mlPct(tot.acts, tot.focusN).toFixed(1)} per focus FA/Team` },
        { label: 'Focus covered', value: `${Math.round(mlPct(tot.covered, tot.focusN) * 100)}%`, sub: `${tot.stale.toLocaleString()} no touch 90d+` },
        { label: 'Focus engaged', value: `${Math.round(mlPct(tot.engaged, tot.focusN) * 100)}%`, sub: `${Math.round(tot.eng).toLocaleString()} touches` },
      ]} />

      {L3 && (
        <div style={{ background: 'rgba(167,139,250,0.05)', border: '1px solid rgba(167,139,250,0.28)', borderRadius: 12, padding: '12px 18px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'Inter', fontSize: 11, fontWeight: 600, color: ML_INK }}>Segmentation & signals</span>
            <MlL3Tag />
            <span style={{ flex: 1 }} />
            <MlConfPills value={minConf} onChange={setMinConf} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(96px,1fr))', gap: 14 }}>
            {[
              ['Signal opp.', lvFmtM(tot.sigOpp), 'rgb(52,211,153)'],
              ['Signals', tot.sigN.toLocaleString()],
              ['Wtd conf.', tot.sigOpp ? Math.round(tot.confW / tot.sigOpp) : '—', 'rgb(196,181,253)'],
              ['Actioned', `${Math.round(mlPct(tot.sigAct, tot.sigN) * 100)}%`],
              ['Won', tot.sigWon.toLocaleString()],
              ['Signal-won sales', mlFmtK(tot.wonK), 'rgb(52,211,153)'],
            ].map(([l, v, c]) => (
              <div key={l} style={{ minWidth: 0 }}>
                <div style={{ fontFamily: 'Inter', fontSize: 9.5, color: ML_DIM, textTransform: 'uppercase', letterSpacing: 0.6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l}</div>
                <div style={{ fontFamily: 'Inter Display, Inter', fontSize: 20, fontWeight: 500, color: c || ML_INK, fontVariantNumeric: 'tabular-nums' }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px,1fr))', gap: 10, paddingTop: 10, borderTop: '1px solid rgba(167,139,250,0.2)' }}>
            {['A', 'B', 'C'].map(sk => {
              const b = bySeg.find(x => x.key === sk) || mlEmpty();
              const m = LV_SEG_META[sk];
              const stats = [
                ['FA/Teams', b.focusN.toLocaleString()],
                ['% of sales', `${Math.round(mlPct(b.sales, tot.sales) * 100)}%`],
                ['Signal opp.', lvFmtM(b.sigOpp)],
                ['Covered', `${Math.round(mlPct(b.covered, b.focusN) * 100)}%`],
              ];
              return (
                <div key={sk} style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                  <LvSegBadge seg={sk} size={24} />
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 8, flex: 1, minWidth: 0 }}>
                    {stats.map(([l, v]) => (
                      <div key={l} style={{ minWidth: 0 }}>
                        <div style={{ fontFamily: 'Inter', fontSize: 9, color: ML_DIM, textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l}</div>
                        <div style={{ fontFamily: 'Inter', fontSize: 14, fontWeight: 600, color: l === 'Signal opp.' ? m.dot : ML_INK, fontVariantNumeric: 'tabular-nums' }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'stretch', containerType: 'inline-size' }}>
        <style>{'.ml-rail{position:relative}.ml-rail-in{position:absolute;inset:0}@container (max-width: 760px){.ml-rail{flex-basis:100%!important}.ml-rail-in{position:static!important}.ml-rail-in .l3-sig-list{max-height:200px!important}}'}</style>
        <div className="ml-rail" style={{ flex: '1 0 210px', maxWidth: '100%', minWidth: 0 }}>
          <div className="ml-rail-in"><MlDimRail level={level} rowsAll={base} xf={xf} ctx={ctx} M={M} onToggle={toggle} /></div>
        </div>
        <Tile title="Sales team"
          subtitle={`All ${ML_ROLE_LABEL[role].toLowerCase()} in one sortable list · click a row to filter the page${L3 ? ' · shaded columns are Level 3' : ''}`}
          pad={0} style={{ flex: '999 1 520px', minWidth: 0 }}>
          <MlTeamGrid rows={gridRows} ctx={ctx} xf={xf} level={level} onToggle={toggle} M={M} actualLabel={actualLabel} />
        </Tile>
      </div>

      <MlPeopleBoard rowsAll={base} xf={xf} ctx={ctx} M={M} level={level} onPick={pickPerson} />

      <MlSalesLift rows={rows} level={level} />

      {L3 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px,1fr))', gap: 16, alignItems: 'stretch' }}>
          <MlSignalPipeline rows={rows} ctx={ctx} xf={xf} />
          <MlSignalFunnel agg={tot} bySeg={bySeg} />
        </div>
      )}

      <MlDimTileRow level={level} rowsAll={base} xf={xf} ctx={ctx} M={M} onToggle={toggle} pkShort={pkShort} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px,1fr))', gap: 16 }}>
        <MlProdTrend rows={rows} />
        <MlActTrend rows={rows} role={role} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px,1fr))', gap: 16, alignItems: 'start' }}>
        <MlEffortScatter rowsAll={base} xf={xf} ctx={ctx} onPick={n => pickPerson(n)} />
        <MlThresholds rows={rows} ctx={ctx} />
      </div>
    </div>
  );
}

Object.assign(window, { LeadershipPage, MlDrawerSections });
