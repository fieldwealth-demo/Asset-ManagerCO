// Chart — lightweight SVG area chart, 5-series palette from design tokens.

/* ──────────────────────────────────────────────────────────────────────
   ChartLabel — design-system primitive for bar/line chart labels.

   Rule (see colors_and_type.css --chart-label-size-max): chart labels
   render at 12 CSS px and MUST NOT scale with the chart container. SVG
   <text> inside a viewBox'd SVG scales with the viewport, which breaks
   the rule. Use <ChartLabel> absolutely positioned over the SVG instead.

   Strokes inside chart SVGs should use vector-effect="non-scaling-stroke"
   so line weights stay crisp at any container width.

   Props: left/top/right/bottom — any CSS length (px, %, calc()).
          align — 'left' | 'center' | 'right' (default 'left').
          bold — use chart-value weight (600) instead of 400.
          color — override --chart-label-color.
   ──────────────────────────────────────────────────────────────────── */
function ChartLabel({ left, top, right, bottom, align = 'left', children, bold = false, color, style }) {
  return (
    <div style={{
      position: 'absolute', left, top, right, bottom,
      fontFamily: 'Inter',
      fontSize: 'var(--chart-label-size, 12px)',
      lineHeight: 'var(--chart-label-line, 16px)',
      fontWeight: bold ? 600 : 'var(--chart-label-weight, 400)',
      color: color || (bold ? 'var(--chart-value-color, rgb(249,250,251))' : 'var(--chart-label-color, rgb(163,163,163))'),
      textAlign: align,
      whiteSpace: 'nowrap',
      pointerEvents: 'none',
      fontVariantNumeric: 'tabular-nums',
      ...style,
    }}>{children}</div>
  );
}

/* ChartFrame — standard wrapper that gives chart labels something to
   absolutely-position against. Children = <svg> + any <ChartLabel>s. */
function ChartFrame({ children, style }) {
  return (
    <div style={{ position: 'relative', flex: 1, minHeight: 0, ...style }}>
      {children}
    </div>
  );
}

// Chart — lightweight SVG area chart, 5-series palette from design tokens.
function AreaChart({ data, width = 560, height = 180, colors = ['rgb(5,122,85)','rgb(0,144,255)'] }) {
  const max = Math.max(...data.flatMap(s => s.values));
  const min = 0;
  const pts = (vals) => vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * (width - 20) + 10;
    const y = height - 16 - ((v - min) / (max - min || 1)) * (height - 32);
    return [x, y];
  });
  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height }}>
      <defs>
        {data.map((s, i) => (
          <linearGradient key={i} id={`g${i}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colors[i % colors.length]} stopOpacity="0.35" />
            <stop offset="100%" stopColor={colors[i % colors.length]} stopOpacity="0" />
          </linearGradient>
        ))}
      </defs>
      {[0.25, 0.5, 0.75].map(t => (
        <line key={t} x1="10" x2={width - 10} y1={16 + (height - 32) * t} y2={16 + (height - 32) * t}
              stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
      ))}
      {data.map((s, i) => {
        const p = pts(s.values);
        const line = p.map((pt, j) => `${j === 0 ? 'M' : 'L'}${pt[0]},${pt[1]}`).join(' ');
        const area = `${line} L${p[p.length-1][0]},${height-16} L${p[0][0]},${height-16} Z`;
        return (
          <g key={i}>
            <path d={area} fill={`url(#g${i})`} />
            <path d={line} fill="none" stroke={colors[i % colors.length]} strokeWidth="2" strokeLinecap="round" />
          </g>
        );
      })}
    </svg>
  );
}

Object.assign(window, { AreaChart, ChartLabel, ChartFrame });
