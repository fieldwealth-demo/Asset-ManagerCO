/* TileViz — renders a query result as one of the supported visual types.
   Every renderer takes the output of dmRunQuery plus the tile config.
   Charts emit onPick(field, value) so the dashboard can cross-filter. */

const TV_INK = 'rgb(249,250,251)';
const TV_MUTE = 'rgb(163,163,163)';
const TV_LINE = 'rgba(75,85,99,0.55)';
/* the composite of the tile's translucent surface over the page, so a sticky
   header or totals row reads as part of the tile rather than as a tinted bar */
const TV_SURFACE = 'rgb(26,37,53)';
const TV_GREEN = 'rgb(5,122,85)';
const TV_SERIES = ['rgb(5,122,85)', 'rgb(56,189,248)', 'rgb(167,139,250)', 'rgb(234,179,8)', 'rgb(248,113,113)', 'rgb(94,214,164)', 'rgb(120,160,230)', 'rgb(251,146,60)'];

const tvCleanName = (n) => String(n || '').replace(/\s*\(signed\)\s*$/i, '');

/* Money leaving is red and money arriving is green everywhere else in the app,
   so a series named for either takes that colour instead of its palette slot. */
const TV_SEMANTIC = [
  [/^(outflow|outflows|withdrawal|withdrawals|transfer out)\b/i, 'rgb(220,38,38)'],
  [/^(inflow|inflows|deposit|deposits|contributions?)\b/i, 'rgb(5,122,85)'],
];
function tvSeriesColor(name, i) {
  const hit = TV_SEMANTIC.find(([re]) => re.test(String(name || '').trim()));
  return hit ? hit[1] : TV_SERIES[i % TV_SERIES.length];
}

const TV_TYPES = [
  { id:'kpi',     label:'KPI',        icon:'hash',          needs:{ values:1, rows:0 } },
  { id:'line',    label:'Line',       icon:'chart-line',    needs:{ values:1, rows:1 } },
  { id:'area',    label:'Area',       icon:'chart-area',    needs:{ values:1, rows:1 } },
  { id:'column',  label:'Column',     icon:'chart-column',  needs:{ values:1, rows:1 } },
  { id:'bar',     label:'Bar',        icon:'chart-bar',     needs:{ values:1, rows:1 } },
  { id:'stacked', label:'Stacked',    icon:'layer-group',   needs:{ values:1, rows:1 } },
  { id:'donut',   label:'Donut',      icon:'chart-pie',     needs:{ values:1, rows:1 } },
  { id:'progress',label:'Progress',   icon:'bars-progress', needs:{ values:1, rows:1 } },
  { id:'cards',   label:'Cards',      icon:'id-card',       needs:{ values:1, rows:1 } },
  { id:'table',   label:'Table',      icon:'table',         needs:{ values:1, rows:1 } },
  { id:'pivot',   label:'Pivot',      icon:'table-columns', needs:{ values:1, rows:1, cols:1 } },
  { id:'scatter', label:'Scatter',    icon:'braille',       needs:{ values:2, rows:1 } },
  { id:'heatmap', label:'Heatmap',    icon:'grip',          needs:{ values:1, rows:1, cols:1 } },
  { id:'map',     label:'Map',        icon:'map',           needs:{ values:1, rows:1, geo:true } },
  { id:'list',    label:'List',       icon:'list',          needs:{} },
  { id:'text',    label:'Text',       icon:'align-left',    needs:{} },
];

/* 'rgb(r,g,b)' -> 'rgba(r,g,b,a)' so a series can be drawn as a tinted fill
   under a solid outline, the way the design system renders bars. */
function tvAlpha(color, a) {
  const s = String(color).replace(/\s+/g, ' ').trim();
  const m = /^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/.exec(s);
  if (m) return `rgba(${m[1]},${m[2]},${m[3]},${a})`;
  const h = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(s);
  if (h) {
    let x = h[1]; if (x.length === 3) x = x.split('').map(c => c + c).join('');
    const n = parseInt(x, 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  }
  return color;
}

/* Colour themes a tile can choose from; custom colours win over any theme. */
const TV_PALETTES = {
  field:  { label:'Field',   colors: TV_SERIES },
  emerald:{ label:'Emerald', colors:['rgb(5,122,85)', 'rgb(52,211,153)', 'rgb(110,231,183)', 'rgb(4,84,60)', 'rgb(16,185,129)', 'rgb(167,243,208)', 'rgb(6,148,103)', 'rgb(2,62,45)'] },
  ocean:  { label:'Ocean',   colors:['rgb(56,189,248)', 'rgb(59,130,246)', 'rgb(103,232,249)', 'rgb(99,102,241)', 'rgb(14,165,233)', 'rgb(125,211,252)', 'rgb(37,99,235)', 'rgb(79,70,229)'] },
  violet: { label:'Violet',  colors:['rgb(167,139,250)', 'rgb(139,92,246)', 'rgb(216,180,254)', 'rgb(124,58,237)', 'rgb(196,181,253)', 'rgb(109,40,217)', 'rgb(233,213,255)', 'rgb(91,33,182)'] },
  warm:   { label:'Warm',    colors:['rgb(234,179,8)', 'rgb(251,146,60)', 'rgb(248,113,113)', 'rgb(250,204,21)', 'rgb(253,186,116)', 'rgb(239,68,68)', 'rgb(254,240,138)', 'rgb(220,38,38)'] },
  mono:   { label:'Mono',    colors:['rgb(209,213,219)', 'rgb(148,163,184)', 'rgb(107,114,128)', 'rgb(229,231,235)', 'rgb(75,85,99)', 'rgb(156,163,175)', 'rgb(55,65,81)', 'rgb(243,244,246)'] },
};
function tvPalette(cfg) {
  if (cfg && Array.isArray(cfg.customColors) && cfg.customColors.length) return cfg.customColors;
  const p = cfg && cfg.palette && TV_PALETTES[cfg.palette];
  return p ? p.colors : TV_SERIES;
}
const tvThemed = (cfg) => !!(cfg && ((cfg.palette && cfg.palette !== 'field') || (cfg.customColors && cfg.customColors.length)));

const tvBaseChart = (h) => ({
  chart:{ backgroundColor:'transparent', height: h || '100%', spacing:[6, 4, 4, 4], style:{ fontFamily:'Inter' } },
  title:{ text:null }, credits:{ enabled:false },
  legend:{ enabled:false, itemStyle:{ color:'rgb(209,213,219)', fontWeight:'500', fontSize:'11px' }, itemHoverStyle:{ color:TV_INK } },
  xAxis:{ lineColor:TV_LINE, tickColor:TV_LINE, labels:{ style:{ color:TV_MUTE, fontSize:'10px' } }, title:{ text:null } },
  yAxis:{ gridLineColor:'rgba(75,85,99,0.22)', labels:{ style:{ color:TV_MUTE, fontSize:'10px' } }, title:{ text:null } },
  tooltip:{ backgroundColor:'rgba(17,24,39,0.96)', borderColor:'rgb(75,85,99)', style:{ color:TV_INK, fontSize:'11px' }, shadow:false },
  /* inactive series/points barely dim — a hover should not grey out the chart */
  plotOptions:{ series:{ animation:{ duration:260 }, borderWidth:0, states:{ inactive:{ opacity:0.88 } } } },
});

const tvFmtAxis = (fmt) => fmt === 'usd'
  ? function () { const a = Math.abs(this.value); const s = this.value < 0 ? '-$' : '$';
      return s + (a >= 1e12 ? (a / 1e12).toFixed(1) + 'T' : a >= 1e9 ? (a / 1e9).toFixed(1) + 'B'
        : a >= 1e6 ? (a / 1e6).toFixed(1) + 'M' : a >= 1000 ? Math.round(a / 1000) + 'K' : a); }
  : fmt === 'pct' ? function () { return this.value + '%'; }
  : function () { return Highcharts.numberFormat(this.value, -1); };

/* ---------- KPI ---------------------------------------------------------- */
function TVKpi({ q, cfg, deltaCfg }) {
  const col = q.valueCols[0];
  const dcfg = deltaCfg || cfg;
  const delta = React.useMemo(() => { try { return col ? dmKpiDelta(dcfg) : null; } catch (e) { return null; } }, [JSON.stringify(dcfg), !!col]);
  if (!col) return <TVEmpty label="Add a value field" />;
  const val = q.data.length === 1 && !q.dimCols.length ? q.data[0].cells[col.key] : q.totals[col.key];
  const second = q.valueCols[1];
  const spark = q.data.length > 2 ? q.data.map(d => Number(d.cells[col.key]) || 0).slice(0, 24).reverse() : null;
  return (
    <div style={{ display:'flex', flexDirection:'column', justifyContent:'center', flex:1, minHeight:0, gap:4 }}>
      <div style={{ fontFamily:'Inter', fontSize:10.5, color:TV_MUTE, letterSpacing:'0.02em' }}>{col.label || col.valueLabel}</div>
      <div style={{ fontFamily:'Inter', fontWeight:700, fontSize:28, letterSpacing:'-0.03em', lineHeight:1.1, color:TV_INK }}>
        {dmFmt(val, col.fmt)}
      </div>
      {delta && (
        <div style={{ display:'flex', alignItems:'center', gap:6, fontFamily:'Inter', fontSize:12 }}>
          <i className={`fa-solid fa-arrow-${delta.pct >= 0 ? 'up' : 'down'}`} style={{ fontSize:10, color: delta.pct >= 0 ? 'rgb(16,185,129)' : 'rgb(248,113,113)' }} />
          <span style={{ color: delta.pct >= 0 ? 'rgb(16,185,129)' : 'rgb(248,113,113)', fontWeight:600 }}>{Math.abs(delta.pct)}%</span>
          <span style={{ color:TV_MUTE }}>{delta.label}</span>
        </div>
      )}
      {second && (
        <div style={{ marginTop:6, paddingTop:10, borderTop:'1px solid ' + TV_LINE, display:'flex', alignItems:'baseline', gap:8 }}>
          <span style={{ fontFamily:'Inter', fontSize:11, color:TV_MUTE }}>{second.label || second.valueLabel}</span>
          <span style={{ fontFamily:'Inter', fontSize:16, fontWeight:600, color:TV_INK, fontVariantNumeric:'tabular-nums' }}>{dmFmt(q.totals[second.key], second.fmt)}</span>
        </div>
      )}
      {spark && (
        <div style={{ marginTop:6, height:40 }}>
          <HC options={{
            ...tvBaseChart(40),
            chart:{ ...tvBaseChart(40).chart, type:'area', height:40, margin:[2, 0, 2, 0] },
            xAxis:{ visible:false }, yAxis:{ visible:false }, tooltip:{ enabled:false },
            series:[{ data:spark, color:TV_GREEN, lineWidth:1.6, marker:{ enabled:false },
              fillColor:{ linearGradient:{ x1:0, y1:0, x2:0, y2:1 }, stops:[[0, 'rgba(5,122,85,0.34)'], [1, 'rgba(5,122,85,0)']] } }],
          }} />
        </div>
      )}
    </div>
  );
}

/* ---------- cartesian charts -------------------------------------------- */
function TVCartesian({ q, cfg, type, onPick, height }) {
  const dim = q.dimCols[0];
  if (!dim || !q.valueCols.length) return <TVEmpty label="Add a dimension and a value" />;
  const cats = q.data.map(d => String(d.cells[dim.key]));
  const stacking = type === 'stacked' ? 'normal' : undefined;
  const hcType = type === 'stacked' ? 'column' : type === 'bar' ? 'bar' : type;
  const base = tvBaseChart(height);
  const multi = q.valueCols.length > 1 || q.colKey;
  const opts = {
    ...base,
    chart:{ ...base.chart, type: hcType },
    legend:{ ...base.legend, enabled: multi },
    /* the default category crosshair is a full-width grey band; a hairline is enough */
    xAxis:{ ...base.xAxis, categories: cats,
      crosshair: (type === 'line' || type === 'area')
        ? { width:1, color:'rgba(148,163,184,0.3)', dashStyle:'ShortDot', snap:true }
        : false },
    yAxis:{ ...base.yAxis, labels:{ ...base.yAxis.labels, formatter: tvFmtAxis(q.valueCols[0].fmt) }, stackLabels:{ enabled:false } },
    tooltip:{ ...base.tooltip, shared: type === 'line' || type === 'area' || !!stacking,
      formatter: function () {
        const pts = this.points || [this.point ? this : this];
        const head = `<b>${this.x != null ? this.x : (this.point && this.point.category)}</b>`;
        const body = pts.map(p => {
          const c = q.valueCols[p.series.index % q.valueCols.length];
          return `<br/><span style="color:${p.series.color}">\u25cf</span> ${p.series.name}: <b>${dmFmtFull(p.y, c ? c.fmt : 'num')}</b>`;
        }).join('');
        return head + body;
      },
    },
    plotOptions:{
      ...base.plotOptions,
      series:{ ...base.plotOptions.series, stacking,
        cursor: onPick ? 'pointer' : 'default',
        point:{ events:{ click: onPick ? function () { onPick(dim.key, q.data[this.index] ? q.data[this.index].cells[dim.key] : this.category); } : undefined } },
      },
      area:{ fillOpacity:0.22, lineWidth:2, marker:{ enabled: cats.length <= 24, radius:3, symbol:'circle' } },
      line:{ lineWidth:2, marker:{ enabled: cats.length <= 24, radius:3, symbol:'circle' } },
      column:{ borderRadius: stacking ? 0 : 3, borderWidth:1.5, pointPadding:0.06, groupPadding:0.16 },
      bar:{ borderRadius:3, borderWidth:1.5, pointPadding:0.06, groupPadding:0.16 },
    },
    responsive:{ rules:[
      /* below this the axis furniture would leave no plot at all */
      { condition:{ maxHeight:190 }, chartOptions:{
        chart:{ marginBottom:8 },
        xAxis:{ labels:{ enabled:false }, tickLength:0 },
        legend:{ itemStyle:{ fontSize:'9px' }, itemMarginBottom:0, padding:2, margin:4, y:2 },
      } },
      { condition:{ maxHeight:120 }, chartOptions:{ yAxis:{ labels:{ enabled:false } }, chart:{ marginLeft:4, marginBottom:12 } } },
    ] },
    series: q.valueCols.map((c, i) => {
      const pal = tvPalette(cfg);
      const seriesName = tvCleanName(c.groupLabel ? c.groupLabel : (c.valueLabel || c.label));
      const solid = tvThemed(cfg) ? pal[i % pal.length] : tvSeriesColor(seriesName, i);
      const barLike = hcType === 'column' || hcType === 'bar';
      return {
        name: c.groupLabel ? seriesName + (q.valueCols.length > colCount(q) ? ' \u00b7 ' + tvCleanName(c.valueLabel) : '') : seriesName,
        data: q.data.map(d => Number(d.cells[c.key]) || 0),
        /* bars: tinted body, solid edge. lines and areas keep the solid stroke */
        color: barLike ? tvAlpha(solid, 0.45) : solid,
        borderColor: barLike ? solid : undefined,
        borderWidth: barLike ? 1.5 : undefined,
        fillColor: (type === 'area' && q.valueCols.length === 1)
          ? { linearGradient:{ x1:0, y1:0, x2:0, y2:1 }, stops:[[0, tvAlpha(solid, 0.38)], [1, tvAlpha(solid, 0.02)]] } : undefined,
      };
    }),
  };
  return <TVChartBox options={opts} />;
}
const colCount = (q) => (q.colKey ? new Set(q.valueCols.map(c => c.colValue)).size : 1);

/* ---------- donut -------------------------------------------------------- */
function TVDonut({ q, cfg, onPick, height }) {
  const pal = tvPalette(cfg);
  const dim = q.dimCols[0], col = q.valueCols[0];
  if (!dim || !col) return <TVEmpty label="Add a dimension and a value" />;
  const base = tvBaseChart(height);
  /* No legend: it ate up to half the tile and duplicated what the tooltip and
     the companion breakdown table already say. */
  const total = q.data.reduce((s, d) => s + (Number(d.cells[col.key]) || 0), 0);
  const opts = {
    ...base,
    chart:{ ...base.chart, type:'pie' },
    legend:{ ...base.legend, enabled:false },
    tooltip:{ ...base.tooltip, formatter: function () { return `<b>${this.point.name}</b><br/>${dmFmtFull(this.y, col.fmt)} \u00b7 ${((this.y / total) * 100).toFixed(1)}%`; } },
    plotOptions:{ pie:{ innerSize:'62%', size:'92%', borderWidth:1.5, dataLabels:{ enabled:false }, showInLegend:false,
      cursor: onPick ? 'pointer' : 'default',
      point:{ events:{ click: onPick ? function () { onPick(dim.key, this.name); } : undefined } } } },
    series:[{ name: col.valueLabel, data: q.data.filter(d => (Number(d.cells[col.key]) || 0) > 0).map((d, i) => {
      const solid = pal[i % pal.length];
      return { name:String(d.cells[dim.key]), y:Number(d.cells[col.key]) || 0,
        color: tvAlpha(solid, 0.5), borderColor: solid, borderWidth:1.5 };
    }) }],
  };
  const dropped = q.data.filter(d => (Number(d.cells[col.key]) || 0) <= 0);
  return (
    <div style={{ flex:1, minHeight:0, display:'flex', flexDirection:'column' }}>
      <TVChartBox options={opts} />
      {dropped.length > 0 && (
        <div title={dropped.map(d => String(d.cells[dim.key]) + ' ' + dmFmt(d.cells[col.key], col.fmt)).join(' · ')}
          style={{ flexShrink:0, paddingTop:6, fontFamily:'Inter', fontSize:10, color:TV_MUTE,
            whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
          Excluded (not positive): {dropped.map(d => String(d.cells[dim.key])).join(', ')}
        </div>
      )}
    </div>
  );
}

/* ---------- progress bars -------------------------------------------------
   Label + value per row with a thin fill bar scaled to the largest value; an
   additive measure also shows each row's share of the positive total. */
function TVProgress({ q, cfg, onPick }) {
  const pal = tvPalette(cfg);
  const dim = q.dimCols[0], col = q.valueCols[0];
  if (!dim || !col) return <TVEmpty label="Add a dimension and a value" />;
  const nums = q.data.map(d => Number(d.cells[col.key]) || 0);
  const max = Math.max(...nums.map(Math.abs), 1);
  const total = nums.filter(v => v > 0).reduce((a, b) => a + b, 0) || 1;
  const additive = ['sum', 'count', 'countd'].includes(col.agg);
  return (
    <div style={{ flex:1, minHeight:0, overflowY:'auto', overflowX:'hidden', paddingRight:4,
      scrollbarGutter:'stable', display:'flex', flexDirection:'column', gap:11 }}>
      {q.data.map(d => {
        const v = Number(d.cells[col.key]) || 0;
        const neg = v < 0;
        /* a negative balance is a callout, not a bar — there is no share to draw */
        if (neg) return (
          <div key={d._key} onClick={onPick ? () => onPick(dim.key, d.cells[dim.key]) : undefined}
            style={{ flexShrink:0, display:'flex', alignItems:'center', gap:10, cursor: onPick ? 'pointer' : 'default',
              border:'1px solid rgba(248,113,113,0.5)', background:'rgba(248,113,113,0.05)', borderRadius:8, padding:'9px 12px' }}>
            <span title={String(d.cells[dim.key])} style={{ flex:1, minWidth:0, fontFamily:'Inter', fontSize:12,
              color:TV_MUTE, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{String(d.cells[dim.key])}</span>
            <span title={dmFmtFull(v, col.fmt)} style={{ fontFamily:'Inter', fontSize:12.5, fontWeight:600,
              color:'rgb(248,113,113)', fontVariantNumeric:'tabular-nums' }}>{'\u2212' + dmFmt(Math.abs(v), col.fmt)}</span>
          </div>
        );
        return (
          <div key={d._key} onClick={onPick ? () => onPick(dim.key, d.cells[dim.key]) : undefined}
            style={{ flexShrink:0, cursor: onPick ? 'pointer' : 'default' }}>
            <div style={{ display:'flex', alignItems:'baseline', gap:8 }}>
              <span title={String(d.cells[dim.key])} style={{ flex:1, minWidth:0, fontFamily:'Inter', fontSize:12,
                color:'rgb(209,213,219)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{String(d.cells[dim.key])}</span>
              <span title={dmFmtFull(v, col.fmt)} style={{ fontFamily:'Inter', fontSize:12.5, fontWeight:600,
                color: neg ? 'rgb(248,113,113)' : TV_INK, fontVariantNumeric:'tabular-nums' }}>{dmFmt(v, col.fmt)}</span>
              {additive && !neg && (
                <span style={{ fontFamily:'Inter', fontSize:10.5, color:TV_MUTE, fontVariantNumeric:'tabular-nums',
                  width:34, textAlign:'right', flexShrink:0 }}>{(v / total * 100).toFixed(v / total >= 0.995 || v / total * 100 < 1 ? 1 : 0)}%</span>
              )}
            </div>
            <div style={{ marginTop:5, height:4, borderRadius:2, background:'rgba(75,85,99,0.35)', overflow:'hidden' }}>
              <div style={{ width: Math.max(Math.abs(v) / max * 100, v === 0 ? 0 : 1.5) + '%', height:'100%',
                borderRadius:2, background: neg ? 'rgb(248,113,113)' : pal[0] }} />
            </div>
          </div>
        );
      })}
      {!q.data.length && <TVEmpty label="Nothing matches these filters" />}
    </div>
  );
}

/* ---------- scatter ------------------------------------------------------ */
function TVScatter({ q, onPick, height }) {
  const dim = q.dimCols[0], x = q.valueCols[0], y = q.valueCols[1];
  if (!dim || !x || !y) return <TVEmpty label="Add a dimension and two values" />;
  const base = tvBaseChart(height);
  const opts = {
    ...base,
    chart:{ ...base.chart, type:'scatter', zoomType:'xy' },
    xAxis:{ ...base.xAxis, title:{ text:x.valueLabel, style:{ color:TV_MUTE, fontSize:'10px' } }, labels:{ ...base.xAxis.labels, formatter: tvFmtAxis(x.fmt) }, gridLineColor:'rgba(75,85,99,0.18)', gridLineWidth:1 },
    yAxis:{ ...base.yAxis, title:{ text:y.valueLabel, style:{ color:TV_MUTE, fontSize:'10px' } }, labels:{ ...base.yAxis.labels, formatter: tvFmtAxis(y.fmt) } },
    tooltip:{ ...base.tooltip, formatter: function () { return `<b>${this.point.name}</b><br/>${x.valueLabel}: ${dmFmtFull(this.x, x.fmt)}<br/>${y.valueLabel}: ${dmFmtFull(this.y, y.fmt)}`; } },
    plotOptions:{ scatter:{ marker:{ radius:4.5, symbol:'circle', fillColor:'rgba(5,122,85,0.55)', lineColor:'rgb(16,185,129)', lineWidth:1.2 },
      cursor: onPick ? 'pointer' : 'default',
      point:{ events:{ click: onPick ? function () { onPick(dim.key, this.name); } : undefined } } } },
    series:[{ name:'Accounts', data: q.data.map(d => ({ name:String(d.cells[dim.key]), x:Number(d.cells[x.key]) || 0, y:Number(d.cells[y.key]) || 0 })) }],
  };
  return <TVChartBox options={opts} />;
}

/* ---------- heatmap (CSS grid — no Highcharts heatmap module needed) ----- */
function TVHeatmap({ q, onPick }) {
  const dim = q.dimCols[0];
  if (!dim || !q.colKey || !q.valueCols.length) return <TVEmpty label="Heatmap needs a row, a column and a value" />;
  const cols = [...new Set(q.valueCols.map(c => c.colValue))];
  const vals = q.data.flatMap(d => q.valueCols.map(c => Number(d.cells[c.key]) || 0));
  const max = Math.max(...vals, 1), min = Math.min(...vals, 0);
  const shade = (v) => {
    const t = max === min ? 0.5 : (v - min) / (max - min);
    return `rgba(5,122,85,${0.08 + t * 0.82})`;
  };
  const fmt = q.valueCols[0].fmt;
  return (
    <div style={{ flex:1, minHeight:0, overflow:'auto' }}>
      <div style={{ display:'grid', gridTemplateColumns:`minmax(120px,1.4fr) repeat(${cols.length}, minmax(56px,1fr))`, gap:3 }}>
        <div />
        {cols.map(c => (
          <div key={String(c)} style={{ fontFamily:'Inter', fontSize:9.5, color:TV_MUTE, textAlign:'center', paddingBottom:2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{String(c)}</div>
        ))}
        {q.data.map(d => (
          <React.Fragment key={d._key}>
            <div style={{ fontFamily:'Inter', fontSize:11, color:'rgb(209,213,219)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', paddingRight:6, alignSelf:'center' }}>{String(d.cells[dim.key])}</div>
            {cols.map(c => {
              const col = q.valueCols.find(vc => vc.colValue === c);
              const v = col ? Number(d.cells[col.key]) || 0 : 0;
              return (
                <div key={String(c)} title={`${d.cells[dim.key]} \u00b7 ${c}: ${dmFmtFull(v, fmt)}`}
                  onClick={onPick ? () => onPick(dim.key, d.cells[dim.key]) : undefined}
                  style={{ height:26, borderRadius:4, background:shade(v), cursor:onPick ? 'pointer' : 'default',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontFamily:'Inter', fontSize:9.5, fontWeight:600, color: (v - min) / (max - min || 1) > 0.55 ? '#fff' : 'rgba(229,231,235,0.85)' }}>
                  {dmFmt(v, fmt)}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

/* ---------- map — real US state geometry, choropleth ---------------------
   Geometry is loaded once from us-atlas (Census cartographic boundaries) and
   drawn with d3-geo. States are shaded by value alone. */
const TV_FIPS_ABBR = {
  '01':'AL','02':'AK','04':'AZ','05':'AR','06':'CA','08':'CO','09':'CT','10':'DE','11':'DC','12':'FL',
  '13':'GA','15':'HI','16':'ID','17':'IL','18':'IN','19':'IA','20':'KS','21':'KY','22':'LA','23':'ME',
  '24':'MD','25':'MA','26':'MI','27':'MN','28':'MS','29':'MO','30':'MT','31':'NE','32':'NV','33':'NH',
  '34':'NJ','35':'NM','36':'NY','37':'NC','38':'ND','39':'OH','40':'OK','41':'OR','42':'PA','44':'RI',
  '45':'SC','46':'SD','47':'TN','48':'TX','49':'UT','50':'VT','51':'VA','53':'WA','54':'WV','55':'WI','56':'WY',
};

let _tvUsPromise = null;
function tvLoadUs() {
  if (!_tvUsPromise) {
    _tvUsPromise = fetch('https://cdn.jsdelivr.net/npm/us-atlas@3.0.1/states-10m.json')
      .then(r => r.json())
      .then(topo => topojson.feature(topo, topo.objects.states).features.map(f => ({
        ...f, abbr: TV_FIPS_ABBR[f.id] || null,
      })))
      .catch(() => null);
  }
  return _tvUsPromise;
}

function TVMap({ q, onPick }) {
  const dim = q.dimCols[0], col = q.valueCols[0];
  const wrapRef = React.useRef(null);
  const [features, setFeatures] = React.useState(null);
  const [size, setSize] = React.useState({ w:0, h:0 });
  const [hover, setHover] = React.useState(null);

  React.useEffect(() => { tvLoadUs().then(f => setFeatures(f)); }, []);
  React.useEffect(() => {
    const el = wrapRef.current; if (!el) return;
    const measure = () => { const r = el.getBoundingClientRect(); setSize({ w:Math.round(r.width), h:Math.round(r.height) }); };
    measure();
    const ro = new ResizeObserver(measure); ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const byState = React.useMemo(() => {
    const m = {};
    if (dim && col) q.data.forEach(d => { m[String(d.cells[dim.key])] = Number(d.cells[col.key]) || 0; });
    return m;
  }, [q, dim && dim.key, col && col.key]);

  const geo = React.useMemo(() => {
    if (!features || !size.w || !size.h) return null;
    const fc = { type:'FeatureCollection', features };
    const projection = d3.geoAlbersUsa().fitSize([size.w, size.h - 16], fc);
    const path = d3.geoPath(projection);
    return { path, projection };
  }, [features, size.w, size.h]);

  if (!dim || !col) return <TVEmpty label="Map needs a State field and a value" />;

  const vals = Object.values(byState);
  const max = Math.max(...vals, 1), min = Math.min(...vals, 0);
  const t = (v) => (max === min ? 0.5 : (v - min) / (max - min));
  const fillOf = (v) => v == null ? 'rgba(255,255,255,0.035)' : `rgba(5,122,85,${0.16 + t(v) * 0.78})`;

  return (
    <div style={{ flex:1, minHeight:0, display:'flex', flexDirection:'column', gap:6 }}>
      <div ref={wrapRef} style={{ flex:1, minHeight:0, position:'relative' }}>
        {geo ? (
          <svg width={size.w} height={size.h} style={{ position:'absolute', inset:0, display:'block' }}>
            {features.map(f => {
              const v = f.abbr ? byState[f.abbr] : null;
              const on = hover === f.id;
              return (
                <path key={f.id} d={geo.path(f)}
                  onMouseEnter={() => setHover(f.id)} onMouseLeave={() => setHover(null)}
                  onClick={v != null && onPick ? () => onPick(dim.key, f.abbr) : undefined}
                  style={{ cursor: v != null && onPick ? 'pointer' : 'default' }}
                  fill={fillOf(v)}
                  stroke={on ? 'rgb(110,231,183)' : 'rgba(148,163,184,0.35)'}
                  strokeWidth={on ? 1.4 : 0.6} />
              );
            })}
            {hover && (() => {
              const f = features.find(x => x.id === hover); if (!f) return null;
              const c = geo.projection(d3.geoCentroid(f)); if (!c) return null;
              const v = f.abbr ? byState[f.abbr] : null;
              const label = (f.abbr || '') + (v == null ? '' : ' \u00b7 ' + dmFmt(v, col.fmt));
              const w = label.length * 6.2 + 14;
              return (
                <g transform={`translate(${Math.min(Math.max(c[0] - w / 2, 2), size.w - w - 2)},${Math.max(c[1] - 30, 2)})`} pointerEvents="none">
                  <rect width={w} height={21} rx={5} fill="rgba(17,24,39,0.96)" stroke="rgb(75,85,99)" />
                  <text x={w / 2} y={14.5} textAnchor="middle" fill={TV_INK}
                    style={{ fontFamily:'Inter', fontSize:11, fontWeight:600 }}>{label}</text>
                </g>
              );
            })()}
          </svg>
        ) : (
          <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center',
            fontFamily:'Inter', fontSize:11.5, color:TV_MUTE }}>Loading map…</div>
        )}
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:8, fontFamily:'Inter', fontSize:10, color:TV_MUTE }}>
        <span>{dmFmt(min, col.fmt)}</span>
        <div style={{ flex:1, height:6, borderRadius:3, background:'linear-gradient(90deg, rgba(5,122,85,0.16), rgba(5,122,85,0.94))' }} />
        <span>{dmFmt(max, col.fmt)}</span>
      </div>
    </div>
  );
}

/* ---------- table + pivot ------------------------------------------------ */
const groupsOf = (q) => (q.colKey ? [...new Set(q.valueCols.map(c => c.colValue))] : null);

/* what the summary row is, per column: only additive aggregations are a total */
const TV_AGG_FOOT = { sum:'Total', count:'Total', countd:'Total', avg:'Average', max:'Max', min:'Min', median:'Median' };
const tvFootLabel = (c) => TV_AGG_FOOT[c && c.agg] || 'Total';
/* one word for the whole row when every column agrees, otherwise per column */
function tvFootHead(cols) {
  const set = [...new Set((cols || []).map(tvFootLabel))];
  return set.length === 1 ? set[0] : 'Summary';
}

let _tvCtx = null;
function tvTextW(text, { size = 10, weight = 700, upper = false, tracking = 0 } = {}) {
  const s = upper ? String(text).toUpperCase() : String(text);
  if (!_tvCtx) { const c = document.createElement('canvas'); _tvCtx = c.getContext('2d'); }
  _tvCtx.font = weight + ' ' + size + 'px Inter, sans-serif';
  return Math.ceil(_tvCtx.measureText(s).width + s.length * tracking);
}

/* measures that describe a gain or a loss, where the sign carries the meaning */
const TV_SIGNED_KEYS = ['unrealized', 'unrealized_pct', 'net_flow', 'amount', 'outflow_signed'];
const tvSignColor = (col, val) => {
  if (!col || !TV_SIGNED_KEYS.includes(col.valueKey)) return null;
  const n = Number(val);
  if (!isFinite(n) || n === 0) return null;
  return n > 0 ? 'rgb(16,185,129)' : 'rgb(248,113,113)';
};

function TVTable({ q, onPick, showTotals = true, dense }) {
  const boxRef = React.useRef(null);
  const [avail, setAvail] = React.useState(0);
  React.useEffect(() => {
    const el = boxRef.current; if (!el) return;
    const measure = () => {
      const cs = getComputedStyle(el);
      setAvail(Math.round(el.clientWidth - parseFloat(cs.paddingRight || 0) - parseFloat(cs.paddingLeft || 0)));
    };
    measure();
    const ro = new ResizeObserver(measure); ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const th = { fontFamily:'Inter', fontSize:10, fontWeight:700, letterSpacing:'0.05em', textTransform:'uppercase', color:TV_MUTE, padding: dense ? '5px 6px' : '7px 7px', borderBottom:'1px solid ' + TV_LINE, whiteSpace:'nowrap', textAlign:'left', lineHeight:1.25, hyphens:'none', background:'transparent' };
  const td = { fontFamily:'Inter', fontSize: dense ? 11.5 : 12.5, color:'rgb(229,231,235)', padding: dense ? '5px 6px' : '8px 7px', borderBottom:'1px solid rgba(75,85,99,0.3)', whiteSpace:'nowrap' };
  /* dimension columns share the leftover space and ellipsize; value columns are
     sized to their content so a $341K never renders as $341 */
  /* Value columns get a fixed width sized to their own content; the dimension
     column takes the remainder, so slack lands on the labels. */
  const valWidths = React.useMemo(() => {
    const m = {};
    q.valueCols.forEach(c => {
      const header = (groupsOf(q) && c.num ? (c.valueLabel || c.label) : c.label) || '';
      /* headers never wrap, so the column must fit the whole label */
      const headW = tvTextW(header, { size:10, weight:700, upper:true, tracking:0.5 });
      const widestText = [...q.data.map(d => dmFmt(d.cells[c.key], c.fmt)), dmFmt(q.totals[c.key], c.fmt)]
        .reduce((a, b) => (String(b).length > String(a).length ? b : a), '');
      const valW = tvTextW(widestText, { size: dense ? 11.5 : 12.5, weight:600 });
      const px = Math.max(headW, valW) + (dense ? 14 : 16);
      m[c.key] = Math.round(Math.min(Math.max(px, 52), 168));
    });
    return m;
  }, [q, dense]);

  /* The label column needs a floor, or a narrow tile crushes it. Measure the
     longest label, clamp to a sane band, and let the table overflow-scroll
     rather than collapse. */
  const dimMin = React.useMemo(() => {
    if (!q.dimCols.length) return 0;
    if (!q.columns.length) return 0;
    const longest = Math.max(
      ...q.dimCols.map(c => String(c.label).length * 5.6),
      ...q.data.slice(0, 40).flatMap(d => q.dimCols.map(c => String(d.cells[c.key] == null ? '' : d.cells[c.key]).length * 6.4)),
      60,
    );
    return Math.round(Math.min(longest, 176) / (q.dimCols.length || 1)) + (dense ? 12 : 14);
  }, [q, dense]);

  if (!q.columns.length) return <TVEmpty label="Add fields to build a table" />;
  const dimCount = q.dimCols.length || 1;
  const valsTotal = q.valueCols.reduce((s, c) => s + valWidths[c.key], 0);
  const dimMax = Math.max(72, Math.round((((avail || 320) - 10) - valsTotal) / dimCount));
  const gutter = 12;
  let tableMin = dimMin * (q.dimCols.length || 0) + q.valueCols.reduce((s, c) => s + valWidths[c.key], 0);
  if (avail > 0) tableMin = Math.min(tableMin, avail - gutter);
  /* if the ideal budget overflows the box, shrink the value columns to fit
     rather than pushing the last one out of view */
  if (avail > 0 && tableMin > avail) {
    const dimTotal = dimMin * (q.dimCols.length || 0);
    const valTotal = tableMin - dimTotal;
    const room = Math.max(avail - dimTotal, q.valueCols.length * 46);
    const k = room / (valTotal || 1);
    q.valueCols.forEach(c => { valWidths[c.key] = Math.max(46, Math.floor(valWidths[c.key] * k)); });
    tableMin = dimTotal + q.valueCols.reduce((s, c) => s + valWidths[c.key], 0);
  }
  const groups = groupsOf(q);
  const perGroup = groups ? q.valueCols.length / groups.length : 0;
  /* sticky bottom on a tfoot doesn't hold under border-collapse, so the total
     lives outside the scroll box as a sibling table sharing these widths */
  const cols = (
    <colgroup>
      {q.columns.map((c, i) => (
        <col key={c.key} style={(c.dim && i === 0) ? { width:'100%' } : undefined} />
      ))}
    </colgroup>
  );
  const wantTotals = showTotals && q.valueCols.length > 0;
  /* with mixed aggregations one heading can't describe the row, so each cell says */
  const mixedFoot = new Set(q.valueCols.map(tvFootLabel)).size > 1;

  return (
    <div style={{ flex:1, minHeight:0, display:'flex', flexDirection:'column' }}>
    <div ref={boxRef} style={{ flex:1, minHeight:0, overflowY:'auto', overflowX:'hidden', paddingRight:10, scrollbarGutter:'stable' }}>
      <table style={{ width:'100%', borderCollapse:'collapse', tableLayout:'auto' }}>
        {cols}
        <thead>
          {groups && (
            <tr>
              {q.dimCols.map(c => <th key={c.key} style={{ ...th, borderBottom:'none' }} />)}
              {groups.map(g => <th key={String(g)} colSpan={perGroup} style={{ ...th, textAlign:'center', color:'rgb(209,213,219)', zIndex:3 }}>{String(g)}</th>)}
            </tr>
          )}
          <tr>
            {q.columns.map(c => (
              <th key={c.key} title={c.expr || (groups && c.num ? c.valueLabel : c.label)}
                style={{ ...th, textAlign: c.num ? 'right' : 'left', top: groups ? 24 : 0,
                maxWidth: c.dim ? dimMax : undefined, overflow:'hidden', textOverflow:'ellipsis' }}>
                {groups && c.num ? c.valueLabel : c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {q.data.map(d => (
            <tr key={d._key}
              onClick={onPick && q.dimCols[0] ? () => onPick(q.dimCols[0].key, d.cells[q.dimCols[0].key]) : undefined}
              style={{ cursor: onPick ? 'pointer' : 'default' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.035)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
              {q.columns.map(c => (
                <td key={c.key} title={c.dim ? String(d.cells[c.key] == null ? '' : d.cells[c.key]) : undefined}
                  style={{ ...td, textAlign: c.num ? 'right' : 'left',
                  fontVariantNumeric: c.num ? 'tabular-nums' : 'normal',
                  fontWeight: c.dim ? 500 : 400, maxWidth: c.dim ? dimMax : undefined,
                  overflow: c.dim ? 'hidden' : 'visible', textOverflow: c.dim ? 'ellipsis' : 'clip',
                  color: c.dim ? TV_INK : (tvSignColor(c, d.cells[c.key]) || 'rgb(209,213,219)') }}>
                  {c.num ? dmFmt(d.cells[c.key], c.fmt) : String(d.cells[c.key] == null ? '\u2014' : d.cells[c.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {wantTotals && (
          <tfoot>
            <tr>
              {q.columns.map((c, i) => (
                <td key={c.key} title={c.num ? tvFootLabel(c) + ' of ' + (c.valueLabel || c.label) : undefined}
                  style={{ ...td, borderTop:'1px solid ' + TV_LINE, borderBottom:'none',
                  background:'transparent',
                  maxWidth: c.dim ? dimMax : undefined, overflow:'hidden', textOverflow:'ellipsis',
                  fontWeight:700, color:TV_INK, textAlign: c.num ? 'right' : 'left', fontVariantNumeric:'tabular-nums' }}>
                  {i === 0 ? tvFootHead(q.valueCols) : c.num ? (
                    <React.Fragment>
                      {mixedFoot && (
                        <span style={{ fontSize:8.5, fontWeight:700, letterSpacing:'0.05em', textTransform:'uppercase',
                          color:TV_MUTE, marginRight:5 }}>{tvFootLabel(c)}</span>
                      )}
                      {dmFmt(q.totals[c.key], c.fmt)}
                    </React.Fragment>
                  ) : ''}
                </td>
              ))}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  </div>
  );
}

/* Highcharts needs a parent with a definite height for height:'100%'.
   flex:1 alone isn't definite, so pin the chart with absolute positioning. */
function TVChartBox({ options }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    const el = ref.current; if (!el) return;
    const fit = () => {
      const w = el.clientWidth, h = el.clientHeight;
      if (!w || !h) return;
      (Highcharts.charts || []).forEach(c => {
        if (!c || !el.contains(c.renderTo)) return;
        /* the chart can carry the right dimensions while its container keeps a
           stale inline width from an earlier measurement — that clips the svg,
           so check the container too */
        if (Math.abs(c.chartHeight - h) > 1 || Math.abs(c.chartWidth - w) > 1) {
          try { c.setSize(w, h, false); c.redraw(false); } catch (e) {}
        }
      });
    };
    /* the first observation can land before the box has resolved, so fit again
       once layout has settled */
    const raf = requestAnimationFrame(fit);
    const ts = [40, 140, 320, 700].map(ms => setTimeout(fit, ms));
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => { cancelAnimationFrame(raf); ts.forEach(clearTimeout); ro.disconnect(); };
  });
  const opts = React.useMemo(() => {
    const chart = { ...options.chart };
    delete chart.height;
    delete chart.width;
    return { ...options, chart };
  }, [options]);
  return (
    <div ref={ref} style={{ flex:1, minHeight:0, position:'relative' }}>
      <div style={{ position:'absolute', inset:0 }}><HC options={opts} /></div>
    </div>
  );
}

function TVCards({ q, cfg, onPick }) {
  const pal = tvPalette(cfg);
  const dim = q.dimCols[0];
  if (!dim || !q.valueCols.length) return <TVEmpty label="Add a dimension and a value" />;
  const meta = q.dimCols.slice(1);
  /* the last measure is the headline; a percentage or signed measure above it
     reads as the trend and sets the card's accent */
  const stats = q.valueCols.slice(0, -1);
  const head = q.valueCols[q.valueCols.length - 1];
  const trend = stats.find(c => c.fmt === 'pct' || TV_SIGNED_KEYS.includes(c.valueKey)) || null;
  /* an additive, all-positive headline gets a share bar under the figure */
  const headVals = q.data.map(d => Number(d.cells[head.key]) || 0);
  const grand = headVals.reduce((s, v) => s + v, 0);
  const headMax = Math.max(...headVals, 1);
  const showShare = ['sum', 'count', 'countd'].includes(head.agg) && grand > 0 && headVals.every(v => v >= 0)
    && !(cfg && cfg.cardShare === false);

  return (
    <div style={{ flex:1, minHeight:0, overflowY:'auto', overflowX:'hidden', paddingRight:4, scrollbarGutter:'stable' }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(158px, 1fr))', gap:10 }}>
        {q.data.map((d, ci) => {
          const tv = trend ? Number(d.cells[trend.key]) : null;
          const up = tv == null || tv >= 0;
          const accent = tv == null ? 'rgb(5,122,85)' : up ? 'rgb(16,185,129)' : 'rgb(248,113,113)';
          return (
            <div key={d._key} onClick={onPick ? () => onPick(dim.key, d.cells[dim.key]) : undefined}
              style={{ display:'flex', borderRadius:10, overflow:'hidden', cursor: onPick ? 'pointer' : 'default',
                background:'rgba(255,255,255,0.04)', border:'1px solid rgba(75,85,99,0.65)' }}>
              {!(cfg && cfg.cardAccent === false) && <span style={{ width:3, flexShrink:0, background:accent }} />}
              <div style={{ flex:1, minWidth:0, padding:'10px 11px', display:'flex', flexDirection:'column', gap:6 }}>
                <div style={{ fontFamily:'Inter', fontSize:12.5, fontWeight:600, color:TV_INK,
                  whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{String(d.cells[dim.key])}</div>
                {meta.map(c => (
                  <div key={c.key} style={{ fontFamily:'Inter', fontSize:10.5, color:TV_MUTE,
                    whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                    {c.label}: {String(d.cells[c.key] == null ? '\u2014' : d.cells[c.key])}
                  </div>
                ))}
                {stats.map(c => {
                  const n = Number(d.cells[c.key]);
                  const signed = c.fmt === 'pct' || TV_SIGNED_KEYS.includes(c.valueKey);
                  const col = signed ? (n >= 0 ? 'rgb(16,185,129)' : 'rgb(248,113,113)') : 'rgb(229,231,235)';
                  return (
                    <div key={c.key}>
                      <div style={{ fontFamily:'Inter', fontSize:10, color:TV_MUTE }}>{c.label}</div>
                      <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:1 }}>
                        {signed && !(cfg && cfg.cardTrend === false) && <i className={`fa-solid fa-arrow-${n >= 0 ? 'up' : 'down'}`} style={{ fontSize:9, color:col }} />}
                        <span style={{ fontFamily:'Inter', fontSize:12, fontWeight:600, color:col, fontVariantNumeric:'tabular-nums' }}>
                          {dmFmt(d.cells[c.key], c.fmt)}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <div>
                  <div style={{ fontFamily:'Inter', fontSize:10, color:TV_MUTE }}>{head.valueLabel || head.label}</div>
                  <div style={{ display:'flex', alignItems:'baseline', gap:6 }}>
                    <span style={{ fontFamily:'Inter', fontSize:17, fontWeight:700, letterSpacing:'-0.02em', color:TV_INK, fontVariantNumeric:'tabular-nums' }}>
                      {dmFmt(d.cells[head.key], head.fmt)}
                    </span>
                    {showShare && (
                      <span style={{ fontFamily:'Inter', fontSize:10.5, fontWeight:700, fontVariantNumeric:'tabular-nums',
                        color:pal[ci % pal.length] }}>
                        {((Number(d.cells[head.key]) || 0) / grand * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>
                  {showShare && (
                    <div style={{ marginTop:7, height:4, borderRadius:2, background:'rgba(75,85,99,0.35)', overflow:'hidden' }}>
                      <div style={{ width: Math.max((Number(d.cells[head.key]) || 0) / headMax * 100, 1.5) + '%', height:'100%',
                        borderRadius:2, background:pal[ci % pal.length] }} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TVConnect({ gate, compact }) {
  return (
    <div style={{ flex:1, minHeight: compact ? 0 : 120, display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center', gap:8, padding:'14px 16px', textAlign:'center' }}>
      <span style={{ width:32, height:32, borderRadius:9999, background:'rgba(234,179,8,0.16)',
        border:'1px solid rgba(234,179,8,0.45)', display:'inline-flex', alignItems:'center', justifyContent:'center' }}>
        <i className={`fa-solid fa-${gate.icon || 'plug'}`} style={{ fontSize:12, color:'rgb(234,179,8)' }} />
      </span>
      <div style={{ fontFamily:'Inter', fontSize:12.5, fontWeight:600, color:TV_INK }}>Connect {gate.service}</div>
      <div style={{ fontFamily:'Inter', fontSize:11, color:TV_MUTE, lineHeight:1.5, maxWidth:240 }}>{gate.note}</div>
    </div>
  );
}

function TVEmpty({ label }) {
  return (
    <div style={{ flex:1, minHeight:120, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8,
      border:'1px dashed rgba(75,85,99,0.7)', borderRadius:10, color:TV_MUTE, fontFamily:'Inter', fontSize:12 }}>
      <i className="fa-solid fa-chart-simple" style={{ fontSize:18, opacity:0.5 }} />
      {label}
    </div>
  );
}

/* ---------- KPI strip ----------------------------------------------------
   cfg.kpis = [{ k, agg, label, filters }]. Each is its own one-number query so
   a strip can mix scopes (YTD inflows vs outflows) inside a single tile. */
function TVKpiStrip({ cfg, effective, onDropField, editing, onRemoveKpi }) {
  const kpis = cfg.kpis || [];
  const hero = !!cfg.heroKpi;
  /* 0.62em per glyph is a safe upper bound for tabular Inter digits at these
     weights; 18px of padding and 1px of border sit outside the text box */
  const needPx = (text, size) => Math.ceil(String(text).length * size * 0.62) + 20;
  const [over, setOver] = React.useState(false);
  const results = React.useMemo(() => kpis.map(kp => {
    try {
      /* A per-KPI filter re-scopes that one figure, so it replaces any base
         filter on the same field rather than intersecting with it — otherwise
         "Fees" inside a dividends-only tile is an unsatisfiable AND. */
      const base = (effective || cfg).filters || [];
      const own = kp.filters || [];
      const owned = new Set(own.map(f => f.k));
      const filters = [...base.filter(f => !owned.has(f.k)), ...own];
      const q = dmRunQuery({ ...(effective || cfg), rows:[], cols:[], viz:'kpi',
        values:[{ k:kp.k, agg:kp.agg, expr:kp.expr, fmt:kp.fmt, decimals:kp.decimals }],
        filters });
      const col = q.valueCols[0];
      const label = kp.label || (col ? col.valueLabel : kp.k);
      const t = String(label).trim();
      const v = col ? q.totals[col.key] : 0;
      /* Only a negative figure is called out; everything else reads in the
         ordinary ink, so a strip is not several shades of the accent colour. */
      const signed = col && TV_SIGNED_KEYS.includes(col.valueKey);
      return { v, fmt: col ? col.fmt : 'num', label,
        negative: (signed && v < 0) || (col && String(col.fmt).slice(0, 3) === 'usd'
          && /^(outflow|outflows|withdrawal|withdrawals|transfer out|loss|losses)\b/i.test(t)),
        positive: false };
    } catch (e) { return { v:0, fmt:'num', label: kp.label || kp.k }; }
  }), [JSON.stringify(kpis), JSON.stringify(effective || cfg)]);

  if (!kpis.length && !editing) return null;
  /* the floor must hold the widest figure any box will draw, hero included */
  const floorPx = Math.min(140, Math.max(72, ...results.map((r, i) => {
    const txt = (r.negative && r.v > 0 ? '\u2212' : '') + dmFmt(r.v, r.fmt);
    return needPx(txt, hero && i === 0 ? 23 : 18);
  })));

  return (
    <div
      onDragOver={onDropField ? (e) => { if (e.dataTransfer.types.includes('text/ts-field')) { e.preventDefault(); setOver(true); } } : undefined}
      onDragLeave={() => setOver(false)}
      onDrop={onDropField ? (e) => { e.preventDefault(); setOver(false); const k = e.dataTransfer.getData('text/ts-field'); if (k) onDropField(k); } : undefined}
      style={{
        display:'grid', gridTemplateColumns:`repeat(auto-fit, minmax(${floorPx}px, 1fr))`, gap:6,
        marginBottom:10, padding: editing ? 4 : 0, borderRadius:10,
        background: over ? 'rgba(5,122,85,0.16)' : editing ? 'rgba(255,255,255,0.02)' : 'transparent',
        border: over ? '1px solid rgb(16,185,129)' : editing ? '1px dashed rgba(75,85,99,0.8)' : 'none',
      }}>
      {results.map((r, i) => (
        <div key={i} style={{
          position:'relative', borderRadius:9, minWidth:0, padding:'8px 9px',
          border:'1px solid ' + (hero && i === 0 ? 'rgba(16,185,129,0.4)' : 'rgba(75,85,99,0.6)'),
          background: hero && i === 0 ? 'rgba(5,122,85,0.1)' : 'rgba(255,255,255,0.025)',
        }}>
          <div title={r.label} style={{ fontFamily:'Inter', fontSize:10.5, color:TV_MUTE, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{r.label}</div>
          <div title={(r.negative && r.v > 0 ? '\u2212' : '') + dmFmtFull(r.v, r.fmt)}
            style={{ fontFamily:'Inter', fontWeight:700, fontSize: hero && i === 0 ? 23 : 18, letterSpacing:'-0.02em', marginTop:2,
            color: (r.v < 0 || r.negative) ? 'rgb(248,113,113)' : r.positive ? 'rgb(16,185,129)' : TV_INK, fontVariantNumeric:'tabular-nums',
            whiteSpace:'nowrap' }}>
            {(r.negative && r.v > 0 ? '\u2212' : '') + dmFmt(r.v, r.fmt)}
          </div>
          {editing && (
            <button onClick={() => onRemoveKpi(i)} title="Remove"
              style={{ position:'absolute', top:3, right:3, width:17, height:17, borderRadius:5, cursor:'pointer',
                background:'rgba(0,0,0,0.35)', border:'none', color:'rgba(229,231,235,0.75)', lineHeight:0 }}>
              <i className="fa-solid fa-xmark" style={{ fontSize:8 }} />
            </button>
          )}
        </div>
      ))}
      {editing && !kpis.length && (
        <div style={{ gridColumn:'1/-1', padding:'11px 4px', textAlign:'center', fontFamily:'Inter', fontSize:11, color:TV_MUTE }}>
          Drop a measure here to add a KPI
        </div>
      )}
    </div>
  );
}

/* ---------- List — agenda / notification style rows ---------------------- */
function TVList({ cfg, q, onPick }) {
  const ds = dmDataset(cfg.ds);
  const map = ds.listMap;
  const rows = React.useMemo(() => {
    let r = dmRows(cfg.ds);
    const fs = (cfg.filters || []);
    if (fs.length) r = r.filter(x => fs.every(f => dmMatchFilter(x, f)));
    return r.slice(0, cfg.limit || 30);
  }, [cfg.ds, JSON.stringify(cfg.filters), cfg.limit]);

  if (!map) return <TVEmpty label="This dataset has no list layout \u2014 pick a chart instead" />;
  const TONES = {
    good:{ bd:'rgba(16,185,129,0.5)',  bg:'rgba(5,122,85,0.12)',   ink:'rgb(110,231,183)' },
    info:{ bd:'rgba(120,160,230,0.5)', bg:'rgba(59,130,246,0.10)', ink:'rgb(147,183,244)' },
    warn:{ bd:'rgba(234,179,8,0.5)',   bg:'rgba(234,179,8,0.10)',  ink:'rgb(250,204,21)' },
    bad: { bd:'rgba(248,113,113,0.5)', bg:'rgba(248,113,113,0.10)',ink:'rgb(252,165,165)' },
    mute:{ bd:'rgba(75,85,99,0.55)',   bg:'rgba(255,255,255,0.02)',ink:'rgb(163,163,163)' },
  };
  return (
    <div style={{ flex:1, minHeight:0, overflowY:'auto', overflowX:'hidden', display:'flex', flexDirection:'column', gap:7, scrollbarGutter:'stable' }}>
      {rows.map((r, i) => {
        const t = TONES[r[map.tone]] || TONES.mute;
        return (
          <div key={i}
            onClick={onPick ? () => onPick('client', r.client) : undefined}
            style={{ display:'flex', alignItems:'flex-start', gap:10, flexShrink:0, cursor: onPick ? 'pointer' : 'default',
              border:'1px solid ' + t.bd, background:t.bg, borderRadius:9, padding:'9px 11px' }}>
            <span style={{ fontFamily:'Inter', fontSize:9.5, fontWeight:700, letterSpacing:'0.05em', textTransform:'uppercase',
              color:t.ink, minWidth:52, flexShrink:0, paddingTop:2 }}>
              {map.kicker === 'date' ? new Date(r.date + 'T12:00:00').toLocaleDateString(undefined, { month:'short', day:'numeric' }) : r[map.kicker]}
            </span>
            <span style={{ flex:1, minWidth:0 }}>
              <span style={{ display:'block', fontFamily:'Inter', fontSize:12.5, fontWeight:600, color:TV_INK,
                whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{r[map.title]}</span>
              <span style={{ display:'block', fontFamily:'Inter', fontSize:11, color:TV_MUTE, marginTop:2,
                whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{r[map.meta]}</span>
            </span>
            <span style={{ fontFamily:'Inter', fontSize:10, fontWeight:600, color:t.ink, flexShrink:0,
              border:'1px solid ' + t.bd, borderRadius:20, padding:'2px 8px', whiteSpace:'nowrap', maxWidth:118,
              overflow:'hidden', textOverflow:'ellipsis' }}>{r[map.badge]}</span>
          </div>
        );
      })}
      {!rows.length && <TVEmpty label="Nothing matches these filters" />}
    </div>
  );
}

/* Width the breakdown needs before it starts hiding columns: swatch + label
   floor + one slot per value + Share when it's shown. */
const tvVisibleVals = (q, hidden) => (q.valueCols || []).filter(c => !(hidden || []).includes(c.key));

function tvBreakdownMin(q, hidden) {
  const headW = tvVisibleVals(q, hidden).reduce((s, c) =>
    s + tvTextW((q.colKey && c.groupLabel) ? c.groupLabel : (c.valueLabel || c.label),
      { size:9, weight:700, upper:true, tracking:0.45 }) + 10, 0);
  return 14 + 64 + Math.max(headW, 44);
}
function tvBreakdownIdeal(q, withShare, hidden) {
  const vals = tvVisibleVals(q, hidden).length || 1;
  return 14 + 88 + vals * 60 + (withShare ? 48 : 0);
}

/* ---------- breakdown panel ----------------------------------------------
   The chart's own query, spelled out. Every field on the Values shelf becomes a
   column here, so adding a measure updates the table as well as the plot; Share
   is computed against the first value. */
function TVBreakdown({ q, onPick, compact, showShare = true, hidden, palette }) {
  const pal = palette || TV_SERIES;
  const bodyRef = React.useRef(null);
  const [bodyW, setBodyW] = React.useState(0);
  React.useEffect(() => {
    const el = bodyRef.current; if (!el) return;
    const measure = () => {
      const cs = getComputedStyle(el);
      const n = Math.round(el.clientWidth - parseFloat(cs.paddingLeft || 0) - parseFloat(cs.paddingRight || 0));
      if (n > 0) setBodyW(n);
    };
    measure();
    const ro = new ResizeObserver(measure); ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const dim = q.dimCols[0];
  const vals = tvVisibleVals(q, hidden);
  if (!dim || !vals.length) return null;
  const primary = vals[0];
  /* The displayed figure must come from the engine, which applies each column's
     own aggregation; the additive reduce is only ever a share denominator. */
  const totals = {};
  vals.forEach(c => { totals[c.key] = q.totals[c.key]; });
  const grand = q.data.reduce((s, d) => s + (Number(d.cells[primary.key]) || 0), 0) || 1;
  /* a share of a non-additive column doesn't mean anything, so it isn't offered */
  const additive = ['sum', 'count', 'countd'].includes(primary.agg);
  /* Share is the first thing to go when space runs short — it's derivable from
     the value and the total, and the label column is what must stay readable. */
  const allPositive = q.data.every(d => (Number(d.cells[primary.key]) || 0) >= 0);
  const wantShare = showShare && additive && vals.length === 1 && allPositive;

  /* value columns sized to their own content, like the main table */
  /* with a column dimension every value column is the same measure, so the
     column's own value is the informative header */
  const headOf = (c) => tvCleanName((q.colKey && c.groupLabel) ? c.groupLabel : (c.valueLabel || c.label));
  const valWidths = {}, valFloors = {};
  vals.forEach(c => {
    const headW = tvTextW(headOf(c), { size:9, weight:700, upper:true, tracking:0.45 });
    valFloors[c.key] = headW + 10;
    const widestText = [...q.data.map(d => dmFmt(d.cells[c.key], c.fmt)), dmFmt(totals[c.key], c.fmt)]
      .reduce((a, b) => (String(b).length > String(a).length ? b : a), '');
    const valW = tvTextW(widestText, { size: compact ? 10.5 : 11.5, weight:600 });
    valWidths[c.key] = Math.round(Math.min(Math.max(Math.max(headW, valW) + 10, 50), 140));
  });

  const th = { fontFamily:'Inter', fontSize:9, fontWeight:700, letterSpacing:'0.05em', textTransform:'uppercase',
    color:TV_MUTE, padding:'0 0 5px', borderBottom:'1px solid ' + TV_LINE, textAlign:'left',
    whiteSpace:'nowrap', lineHeight:1.25, background:'transparent' };
  const td = { fontFamily:'Inter', fontSize: compact ? 10.5 : 11.5, padding:'5px 0',
    borderBottom:'1px solid rgba(75,85,99,0.28)', whiteSpace:'nowrap' };

  /* the content minimum of the label, value and Share columns; Share only stays
     if all of it fits the wrapper's content box */
  const shareW = 46, labelW = 84;
  const valsW = vals.reduce((s, c) => s + valWidths[c.key], 0);
  const withShare = wantShare && bodyW > 0 && (14 + labelW + valsW + shareW) <= bodyW;

  /* Content-sized like the main table: the browser fits the columns to their
     text, so the table cannot exceed its container and no measured width is
     needed. The label column is capped and ellipsizes, and the totals row lives
     in the same table so no column can be stranded behind a hidden overflow. */
  const bkCols = (
    <colgroup>
      <col style={{ width:14 }} />
      <col style={{ maxWidth:150 }} />
      {vals.map(c => <col key={c.key} />)}
      {withShare && <col />}
    </colgroup>
  );
  const clip = { overflow:'hidden', textOverflow:'ellipsis', maxWidth:150 };
  const foot = { ...td, borderTop:'1px solid ' + TV_LINE, borderBottom:'none',
    background:'transparent', fontWeight:700 };

  return (
    <div style={{ flex:1, minWidth:0, minHeight:0, display:'flex', flexDirection:'column' }}>
      <div ref={bodyRef} style={{ flex:1, minWidth:0, minHeight:0, overflowY:'auto', overflowX:'hidden',
        paddingRight:10, scrollbarGutter:'stable' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', tableLayout:'auto' }}>
          {bkCols}
          <thead>
            <tr>
              <th style={th} />
              <th title={dim.label} style={{ ...th, ...clip }}>{dim.label}</th>
              {vals.map(c => <th key={c.key} title={c.expr || headOf(c)} style={{ ...th, textAlign:'right' }}>{headOf(c)}</th>)}
              {withShare && <th style={{ ...th, textAlign:'right' }}>Share</th>}
            </tr>
          </thead>
          <tbody>
            {q.data.map((d, i) => (
              <tr key={d._key}
                onClick={onPick ? () => onPick(dim.key, d.cells[dim.key]) : undefined}
                style={{ cursor: onPick ? 'pointer' : 'default' }}>
                <td style={td}>
                  <span style={{ display:'block', width:8, height:8, borderRadius:2, background:pal[i % pal.length] }} />
                </td>
                <td title={String(d.cells[dim.key])} style={{ ...td, ...clip, color:TV_INK }}>{String(d.cells[dim.key])}</td>
                {vals.map(c => (
                  <td key={c.key} style={{ ...td, textAlign:'right', fontVariantNumeric:'tabular-nums',
                    color: tvSignColor(c, d.cells[c.key]) || 'rgb(209,213,219)' }}>
                    {dmFmt(d.cells[c.key], c.fmt)}
                  </td>
                ))}
                {withShare && (
                  <td style={{ ...td, textAlign:'right', color:TV_MUTE, fontVariantNumeric:'tabular-nums' }}>
                    {((Number(d.cells[primary.key]) || 0) / grand * 100).toFixed(1)}%
                  </td>
                )}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td style={foot} />
              <td style={{ ...foot, ...clip, color:TV_INK }}>{tvFootHead(vals)}</td>
              {vals.map(c => (
                <td key={c.key} style={{ ...foot, textAlign:'right', color:TV_INK, fontVariantNumeric:'tabular-nums' }}>
                  {dmFmt(totals[c.key], c.fmt)}
                </td>
              ))}
              {withShare && <td style={{ ...foot, textAlign:'right', color:TV_MUTE, fontVariantNumeric:'tabular-nums' }}>100%</td>}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

/* ---------- dispatcher --------------------------------------------------- */
function TileViz({ cfg, q, onPick, height = 240, deltaCfg, editing, onDropKpi, onRemoveKpi, onDropBody, onDropValue, onSplit }) {
  /* a dataset that isn't connected explains itself instead of drawing an empty chart */
  const gate = cfg.ds ? (dmDataset(cfg.ds) || {}).needsConnect : null;
  if (gate) return <TVConnect gate={gate} />;
  const strip = (cfg.kpis && cfg.kpis.length)
    ? <TVKpiStrip cfg={cfg} effective={deltaCfg} editing={editing} onDropField={onDropKpi} onRemoveKpi={onRemoveKpi} />
    : null;
  /* a companion breakdown sits beside the chart (or under it in a narrow tile) */
  const wantsSide = cfg.side === 'table' && q && q.dimCols.length && q.valueCols.length
    && cfg.viz !== 'table' && cfg.viz !== 'pivot' && cfg.viz !== 'kpi' && cfg.viz !== 'list' && cfg.viz !== 'text';
  const plain = <TileVizBody cfg={cfg} q={q} onPick={onPick} height={height} deltaCfg={deltaCfg} />;
  const body = wantsSide
    && tvVisibleVals(q, cfg.sideHidden).length > 0
    ? <TVSideBySide flip={!!cfg.sideFlip} chart={plain}
        table={<TVBreakdown q={q} onPick={onPick} hidden={cfg.sideHidden} palette={tvPalette(cfg)} showShare={!(cfg.sideHidden || []).includes('share')} />}
        dir={cfg.sideDir || (cfg.sideFlip ? 'left' : 'right')}
        split={cfg.sideSplit} onSplit={onSplit}
        tableMin={tvBreakdownMin(q, cfg.sideHidden)} tableIdeal={tvBreakdownIdeal(q, q.valueCols.length === 1, cfg.sideHidden)}
        editing={editing} onDropTable={onDropValue || onDropBody} valueCount={q.valueCols.length} />
    : plain;
  const extraSections = (cfg.sections || []).filter(s => s && s.ds);
  const footer = (cfg.footer || cfg.footerLink) ? (
    <div style={{ flexShrink:0, display:'flex', alignItems:'center', gap:8, marginTop:10 }}>
      <span style={{ fontFamily:'Inter', fontSize:10.5, color:TV_MUTE }}>{cfg.footer}</span>
      {cfg.footerLink && (
        <span style={{ marginLeft:'auto', fontFamily:'Inter', fontSize:11, fontWeight:600, color:'rgb(16,185,129)',
          display:'inline-flex', alignItems:'center', gap:5, cursor:'pointer', whiteSpace:'nowrap' }}>
          {cfg.footerLink}<i className="fa-solid fa-chevron-right" style={{ fontSize:8 }} />
        </span>
      )}
    </div>
  ) : null;
  if (!strip && !onDropBody && !extraSections.length && !footer) return body;
  const dropped = onDropBody ? <TVBodyDrop onDropBody={onDropBody}>{body}</TVBodyDrop> : body;
  return (
    <div style={{ flex:1, minHeight:0, display:'flex', flexDirection:'column', overflowY: extraSections.length ? 'auto' : undefined }}>
      {strip}
      {extraSections.length
        ? <div style={{ display:'flex', flexWrap:'wrap', gap:12, alignItems:'stretch' }}>
            {(() => {
              const items = extraSections.map((s, i) => <TVSection key={'s' + i} s={s} onPick={onPick} />);
              const mainPos = Math.min(cfg.mainPos == null ? 0 : cfg.mainPos, items.length);
              const hasMain = !!(cfg.viz || (cfg.values || []).length || (cfg.kpis || []).length);
              if (hasMain) items.splice(mainPos, 0, (
                <div key="main" style={{ flex:'1 1 calc(' + Math.round(((cfg.mainW || 12) / 12) * 100) + '% - 12px)', minWidth:170,
                  minHeight:170, height: cfg.mainH || undefined, boxSizing:'border-box', display:'flex', flexDirection:'column' }}>{dropped}</div>
              ));
              return items;
              /* (main omitted when erased) */
            })()}
          </div>
        : dropped}
      {footer}
    </div>
  );
}

/* A stacked section: its own dataset, query and viz rendered under the tile's
   main body, with an uppercase section heading. */
function TVSection({ s, onPick }) {
  const q = React.useMemo(() => {
    if (s.viz === 'text') return null;
    try { return dmRunQuery(s); } catch (e) { return null; }
  }, [JSON.stringify(s)]);
  return (
    <div style={{ flex:'1 1 calc(' + Math.round(((s.w || 12) / 12) * 100) + '% - 12px)', minWidth:170,
      boxSizing:'border-box', display:'flex', flexDirection:'column' }}>
      {s.label && (
        <div style={{ fontFamily:'Inter', fontSize:10, fontWeight:700, letterSpacing:'0.07em',
          textTransform:'uppercase', color:TV_MUTE, marginBottom:10 }}>{s.label}</div>
      )}
      <div style={{ height: s.h || 180, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        <TileVizBody cfg={s} q={q} onPick={onPick} height={0} />
      </div>
    </div>
  );
}

/* Side-by-side at a comfortable width, stacked when the tile is narrow. */
function TVSideBySide({ chart, table, editing, onDropTable, valueCount, flip, dir = 'right', tableMin = 146, tableIdeal, split, onSplit }) {
  const ref = React.useRef(null);
  const [box, setBox] = React.useState({ w:0, h:0 });
  const [over, setOver] = React.useState(false);
  React.useEffect(() => {
    const el = ref.current; if (!el) return;
    const measure = () => { const r = el.getBoundingClientRect(); setBox({ w:Math.round(r.width), h:Math.round(r.height) }); };
    measure();
    const ro = new ResizeObserver(measure); ro.observe(el);
    return () => ro.disconnect();
  }, []);
  /* Stacking needs real vertical room: a chart worth looking at plus a header,
     a few rows and the total. Without it, sit side by side instead — never
     impose a minimum the container can't honour, or the total paints outside. */
  const gap = 12;
  /* Give the table the share it actually needs rather than a fixed split, so a
     pivoted breakdown can sit beside its chart — capped so the chart always
     keeps something to draw in. */
  const avail = Math.max(box.w - gap, 1);
  const chartMin = 130, chartFloor = 130;
  const cap = avail < 520 ? 0.5 : 0.58;
  const want = ((tableIdeal || tableMin) + 12) / avail;
  const floor = (tableMin + 12) / avail;
  /* aim for the ideal, never exceed the cap, never go under the hard floor */
  /* a split the user dragged wins, clamped so neither side collapses */
  const tShare = split
    ? Math.max((tableMin + 12) / avail, Math.min(split, 1 - chartFloor / avail))
    : Math.max(Math.min(want, cap), Math.min(floor, cap));
  const fitsRow = avail * tShare >= tableMin + 12 && avail * (1 - tShare) >= chartMin;
  /* The chosen side is honoured when the geometry allows it: left/right need
     enough width to seat the table's columns, top/bottom always work. */
  const wantsRow = dir === 'left' || dir === 'right';
  const row = wantsRow && (box.w === 0 || fitsRow);
  /* a left/right choice that can't fit falls back to stacking on the same side */
  const tableFirst = dir === 'left' || dir === 'top' || (!row && dir === 'left');
  const chartPct = Math.round((1 - tShare) * 100), tablePct = Math.round(tShare * 100);
  /* stacked: the chart keeps a drawable band of its own — a donut squeezed into
     a hundred pixels reads as a broken tile */
  const chartHalf = (
    <div key="chart" style={{ flex: row ? `1 1 ${chartPct}%` : '1 1 46%', minWidth:0,
      minHeight: row ? 0 : Math.min(150, Math.max(0, box.h - 90)), display:'flex', flexDirection:'column' }}>{chart}</div>
  );
  const tableHalf = (
      <div key="table"
        onDragOver={editing && onDropTable ? (e) => { if (e.dataTransfer.types.includes('text/ts-field')) { e.preventDefault(); e.stopPropagation(); setOver(true); } } : undefined}
        onDragLeave={() => setOver(false)}
        onDrop={editing && onDropTable ? (e) => { e.preventDefault(); e.stopPropagation(); setOver(false); const k = e.dataTransfer.getData('text/ts-field'); if (k) onDropTable(k); } : undefined}
        style={{ flex: row ? `1 1 ${tablePct}%` : '1 1 54%', minWidth:0, position:'relative', minHeight:0,
          boxSizing:'border-box', display:'flex', flexDirection:'column', borderRadius:9,
          padding: editing ? '4px 5px' : 0,
          background: over ? 'rgba(5,122,85,0.16)' : editing ? 'rgba(255,255,255,0.02)' : 'transparent',
          border: editing ? '1px ' + (over ? 'solid rgb(16,185,129)' : 'dashed rgba(75,85,99,0.8)') : 'none' }}>
        {editing && over && (
          <div style={{ position:'absolute', inset:0, zIndex:12, pointerEvents:'none',
            display:'flex', alignItems:'center', justifyContent:'center',
            background:'rgba(5,122,85,0.28)', borderRadius:9 }}>
            <span style={{ fontFamily:'Inter', fontSize:11, fontWeight:700, letterSpacing:'0.04em',
              color:'#fff', background:'rgb(5,122,85)', borderRadius:20, padding:'4px 12px', whiteSpace:'nowrap' }}>
              Add as a column
            </span>
          </div>
        )}
        {table}
      </div>
  );
  /* Dragging sets the table's share of the row directly; the pointer position
     is the split, so the handle tracks the cursor exactly. */
  const [dragging, setDragging] = React.useState(false);
  const startDrag = (e) => {
    if (!onSplit || !row) return;
    e.preventDefault(); e.stopPropagation();
    setDragging(true);
    const el = ref.current;
    const move = (ev) => {
      const r = el.getBoundingClientRect();
      const x = (ev.clientX - r.left) / Math.max(r.width, 1);
      onSplit(Math.min(0.72, Math.max(0.18, tableFirst ? x : 1 - x)));
    };
    const up = () => { setDragging(false); window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const handle = row && onSplit ? (
    <div key="handle" onPointerDown={startDrag} onDoubleClick={() => onSplit(null)}
      title="Drag to resize \u00b7 double-click to reset"
      style={{ flex:'0 0 8px', margin:'0 -6px', cursor:'col-resize', position:'relative', zIndex:14,
        display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:3, height: dragging ? '100%' : 40, borderRadius:2,
        background: dragging ? 'rgb(16,185,129)' : 'rgba(75,85,99,0.9)', transition:'height 120ms' }} />
    </div>
  ) : null;

  const order = tableFirst ? [tableHalf, handle, chartHalf] : [chartHalf, handle, tableHalf];
  return (
    <div ref={ref} style={{ flex:1, minHeight:0, display:'flex', flexDirection: row ? 'row' : 'column', gap:12,
      userSelect: dragging ? 'none' : undefined }}>
      {order.filter(Boolean)}
    </div>
  );
}

function TVBodyDrop({ onDropBody, children }) {
  const [over, setOver] = React.useState(false);
  return (
    <div
      onDragOver={(e) => { if (e.dataTransfer.types.includes('text/ts-field')) { e.preventDefault(); setOver(true); } }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); const k = e.dataTransfer.getData('text/ts-field'); if (k) onDropBody(k); }}
      style={{ flex:1, minHeight:0, display:'flex', flexDirection:'column', borderRadius:10,
        background: over ? 'rgba(5,122,85,0.14)' : 'transparent',
        outline: over ? '1px solid rgb(16,185,129)' : 'none' }}>
      {children}
    </div>
  );
}

function TileVizBody({ cfg, q, onPick, height = 240, deltaCfg }) {
  if (cfg.viz === 'text') {
    return (
      <div style={{ flex:1, minHeight:0, overflow:'auto', fontFamily:'Inter', fontSize:13, lineHeight:1.6, color:'rgb(209,213,219)', whiteSpace:'pre-wrap' }}>
        {cfg.text || 'Double-click to write a note for this dashboard.'}
      </div>
    );
  }
  if (!q) return <TVEmpty label="No query" />;
  switch (cfg.viz) {
    case 'kpi':     return <TVKpi q={q} cfg={cfg} deltaCfg={deltaCfg} />;
    case 'donut':   return <TVDonut q={q} cfg={cfg} onPick={onPick} height={height} />;
    case 'progress':return <TVProgress q={q} cfg={cfg} onPick={onPick} />;
    case 'scatter': return <TVScatter q={q} onPick={onPick} height={height} />;
    case 'heatmap': return <TVHeatmap q={q} onPick={onPick} />;
    case 'map':     return <TVMap q={q} onPick={onPick} />;
    case 'list':    return <TVList cfg={cfg} q={q} onPick={onPick} />;
    case 'cards':   return <TVCards q={q} cfg={cfg} onPick={onPick} />;
    case 'table':   return <TVTable q={q} onPick={onPick} />;
    case 'pivot':   return <TVTable q={q} onPick={onPick} dense />;
    default:        return <TVCartesian q={q} cfg={cfg} type={cfg.viz} onPick={onPick} height={height} />;
  }
}

Object.assign(window, { TileViz, TVConnect, TVCards, TVTable, TVEmpty, TVChartBox, TV_TYPES, TV_SERIES, TV_PALETTES, tvPalette, tvBaseChart });
