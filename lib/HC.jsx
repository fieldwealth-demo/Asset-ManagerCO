/* Highcharts helper + shared Field theme.
   Usage: <HC options={...} style={{ height: 200 }} />
   The Field theme is applied once via Highcharts.setOptions; every HC instance
   inherits it and can override per-chart. */

(function applyFieldTheme() {
  if (typeof Highcharts === 'undefined' || window.__fieldHCThemed) return;
  window.__fieldHCThemed = true;
  Highcharts.setOptions({
    colors: ['rgb(16,185,129)', 'rgb(59,130,246)', 'rgb(139,92,246)', 'rgb(234,179,8)', 'rgb(249,115,22)', 'rgb(20,184,166)', 'rgb(217,119,6)', 'rgb(14,165,233)'],
    chart: {
      backgroundColor: 'transparent',
      style: { fontFamily: 'Inter, sans-serif' },
      spacing: [8, 4, 8, 4],
    },
    title: { text: '' },
    credits: { enabled: false },
    legend: {
      itemStyle: { color: 'rgb(229,231,235)', fontWeight: '500', fontSize: '11px' },
      itemHoverStyle: { color: 'rgb(249,250,251)' },
      itemHiddenStyle: { color: 'rgb(107,114,128)' },
    },
    xAxis: {
      lineColor: 'rgba(75,85,99,0.5)',
      tickColor: 'rgba(75,85,99,0.5)',
      gridLineColor: 'rgba(75,85,99,0.25)',
      labels: { style: { color: 'rgb(163,163,163)', fontSize: '11px' } },
    },
    yAxis: {
      gridLineColor: 'rgba(75,85,99,0.25)',
      gridLineDashStyle: 'Dash',
      lineColor: 'transparent',
      tickColor: 'transparent',
      labels: { style: { color: 'rgb(163,163,163)', fontSize: '11px' } },
      title: { text: null },
    },
    tooltip: {
      backgroundColor: 'rgb(17,24,39)',
      borderColor: 'rgb(75,85,99)',
      borderRadius: 8,
      style: { color: 'rgb(249,250,251)', fontSize: '11.5px' },
      shadow: false,
      useHTML: true,
    },
    plotOptions: {
      series: { animation: { duration: 420 } },
      line:   { marker: { lineColor: 'rgb(10,10,10)', lineWidth: 2, fillColor: 'rgb(16,185,129)', radius: 3.5 } },
      area:   { marker: { enabled: false } },
      // Field chart treatment: filled shapes (columns/bars/areas) render as a
      // low-opacity wash of the series hue plus a crisp 1.5px border in the
      // same hue. Series should be defined with the `wash()` helper below
      // (or with explicit color + borderColor) so this stays consistent.
      column: { borderWidth: 1.5, borderRadius: 2 },
      bar:    { borderWidth: 1.5, borderRadius: 2 },
      area:       { fillOpacity: 0.28, lineWidth: 2 },
      areaspline: { fillOpacity: 0.28, lineWidth: 2 },
      pie:    { borderColor: 'rgb(10,10,10)', borderWidth: 1, borderRadius: 0 },
    },
  });
})();

function HC({ options, style }) {
  const ref = React.useRef();
  const chartRef = React.useRef(null);
  // Recreate chart whenever options change — simpler & always correct, esp.
  // when series types change between metric switches.
  React.useEffect(() => {
    if (!ref.current) return;
    try { chartRef.current && chartRef.current.destroy(); } catch(e){}
    chartRef.current = Highcharts.chart(ref.current, options);
    // Keep the chart sized to its tile when the layout reflows (window resize,
    // sidebar collapse, grid column wrap) — Highcharts only tracks the window.
    // Guarded: reflow() can itself change the observed box, so we only act on a
    // real size change and coalesce to one reflow per frame. Without this a
    // chart whose reflow nudges its own container loops forever.
    let ro, raf = 0, lastW = 0, lastH = 0;
    if (window.ResizeObserver) {
      ro = new ResizeObserver(entries => {
        const box = entries[0] && entries[0].contentRect;
        if (!box) return;
        const w = Math.round(box.width), h = Math.round(box.height);
        if (w === lastW && h === lastH) return;
        lastW = w; lastH = h;
        if (raf) return;
        raf = requestAnimationFrame(() => {
          raf = 0;
          try { chartRef.current && chartRef.current.reflow(); } catch(e){}
        });
      });
      ro.observe(ref.current);
    }
    return () => {
      if (raf) cancelAnimationFrame(raf);
      try { ro && ro.disconnect(); } catch(e){}
      try { chartRef.current && chartRef.current.destroy(); } catch(e){}
    };
  }, [options]);
  return <div ref={ref} style={{ width:'100%', height:'100%', ...style }} />;
}

window.HC = HC;

/* wash(rgb, alpha?) — derive the Field "washed fill + crisp border" pair
   from a saturated rgb string. Spread the result onto a column/bar/area
   series spec so every filled-shape chart in the system reads the same way.
   Example:
     { type:'column', name:'AUM', data:[…], ...wash('rgb(16,185,129)') }
   Returns { color, borderColor } for columns/bars and the same `color` is
   correct for areas (the theme already sets fillOpacity:0.22 + lineWidth:2). */
window.wash = function wash(rgb, alpha) {
  const a = alpha == null ? 0.45 : alpha;
  const m = String(rgb).match(/rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (!m) return { color: rgb, borderColor: rgb };
  const r = +m[1], g = +m[2], b = +m[3];
  return {
    color: `rgba(${r},${g},${b},${a})`,
    borderColor: `rgb(${r},${g},${b})`,
  };
};
