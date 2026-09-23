/* Level 2 addition to the FA/Team profile: what they actually hold and what
   they actually bought, by product and vehicle, with a five-year flow trend.
   Sits between the team card and the opportunity KPIs. */

function ActualSalesCard({ row }) {
  const [grain, setGrain] = React.useState('Product');
  const [flow, setFlow] = React.useState('Inflows');
  const holdings = (row && row.holdings) || [];

  const years = (() => {
    const y = new Date().getFullYear();
    return [y - 4, y - 3, y - 2, y - 1, y].map(String);
  })();
  const flowKey = flow === 'Inflows' ? 'inflow' : flow === 'Redemptions' ? 'redemption' : 'net';
  const fmt = (v) => (flow === 'Net Flows' ? lvFmtSigned(v) : lvFmtM(v));

  // Roll holdings up to whichever grain is selected.
  const groups = React.useMemo(() => {
    const by = {};
    holdings.forEach(h => {
      const k = grain === 'Product' ? h.product : h.vehicle;
      if (!by[k]) by[k] = { name: k, vehicle: h.vehicle, cat: h.cat, aumM: 0, inflow: [0, 0, 0, 0, 0], redemption: [0, 0, 0, 0, 0], net: [0, 0, 0, 0, 0] };
      const g = by[k];
      g.aumM += h.aumM;
      ['inflow', 'redemption', 'net'].forEach(f => h[f].forEach((v, i) => { g[f][i] += v; }));
    });
    return Object.values(by).sort((a, b) => b.aumM - a.aumM);
  }, [holdings, grain]);

  const totalAum = groups.reduce((a, g) => a + g.aumM, 0);
  const vehColor = { 'Mutual Funds': 'rgb(52,211,153)', 'ETFs': 'rgb(96,165,250)', 'SMAs': 'rgb(167,139,250)', 'Privates': 'rgb(251,191,36)' };

  // Trend is the rolling 12 by month, built from the latest year's flow so the
  // months always tie back to the figure in the table.
  const months = React.useMemo(() => {
    const now = new Date();
    const out = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      out.push(d.toLocaleString('en-US', { month: 'short' }) + (d.getMonth() === 0 ? ` ${String(d.getFullYear()).slice(2)}` : ''));
    }
    return out;
  }, []);

  const monthly = React.useMemo(() => groups.map((g, gi) => {
    const annual = g[flowKey][4];
    // Deterministic monthly shape that sums back to the annual figure.
    const w = months.map((_, i) => 0.6 + (((i * 7 + gi * 5) % 9) / 9) * 0.9);
    const tot = w.reduce((a, x) => a + x, 0);
    return { name: g.name, data: w.map(x => Math.round((annual * x / tot) * 100) / 100) };
  }), [groups, flowKey, months]);

  const options = React.useMemo(() => ({
    chart: { type: 'column', height: 180, animation: false },
    xAxis: { categories: months, tickmarkPlacement: 'on' },
    yAxis: { labels: { format: '${value}M' }, plotLines: [{ value: 0, color: 'rgba(148,163,184,0.5)', width: 1, zIndex: 3 }] },
    legend: { enabled: false },
    tooltip: { shared: false, valuePrefix: '$', valueSuffix: 'M', valueDecimals: 2 },
    plotOptions: { series: { animation: false, stacking: 'normal' }, column: { pointPadding: 0.03, groupPadding: 0.10 } },
    series: monthly.map((m, i) => ({
      name: m.name,
      data: m.data,
      ...wash(grain === 'Vehicle' ? (vehColor[m.name] || 'rgb(148,163,184)')
        : ['rgb(16,185,129)', 'rgb(59,130,246)', 'rgb(139,92,246)', 'rgb(234,179,8)', 'rgb(249,115,22)', 'rgb(20,184,166)', 'rgb(14,165,233)', 'rgb(244,114,182)', 'rgb(148,163,184)'][i % 9], 0.5),
    })),
  }), [monthly, months, grain]);

  if (!holdings.length) {
    return (
      <div style={{ ...cardStyle, padding: '16px 18px' }}>
        <div style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 13.5, color: 'rgb(249,250,251)' }}>Your actual AUM &amp; sales</div>
        <div style={{ fontFamily: 'Inter', fontSize: 12, color: 'rgb(163,163,163)', marginTop: 6 }}>
          No production on file. This FA/Team is a prospect — the opportunity below is all addressable.
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...cardStyle, padding: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', padding: '14px 18px 12px', borderBottom: '1px solid rgba(75,85,99,0.25)' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 13.5, color: 'rgb(249,250,251)' }}>Your actual AUM &amp; sales</div>
          <div style={{ fontFamily: 'Inter', fontSize: 11, color: 'rgb(163,163,163)', marginTop: 2 }}>
            From your own sales system · {holdings.length} product{holdings.length === 1 ? '' : 's'} · {lvFmtM(totalAum)} current AUM
          </div>
        </div>
        <span style={{ flex: 1 }} />
        <TabPills options={['Product', 'Vehicle']} value={grain} onChange={setGrain} />
        <TabPills options={['Inflows', 'Redemptions', 'Net Flows']} value={flow} onChange={setFlow} />
      </div>

      {/* Actual figures first — five years of flows per product, then the same
         series as a trend underneath. Scrolls when a team holds a long list. */}
      <div style={{ maxHeight: 220, overflowY: 'auto', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Inter', fontSize: 11 }}>
          <thead>
            <tr>
              <th style={asTh}>{grain}</th>
              {grain === 'Product' && <th style={asTh}>Veh.</th>}
              <th style={asThR}>Current AUM</th>
              {years.map(y => <th key={y} style={asThR}>{y}</th>)}
            </tr>
          </thead>
          <tbody>
            {groups.map(g => (
              <tr key={g.name}>
                <td style={{ ...asTd, color: 'rgb(249,250,251)' }}>{g.name}</td>
                {grain === 'Product' && <td style={asTd}><VehicleBadge v={g.vehicle === 'Mutual Funds' ? 'MF' : g.vehicle === 'ETFs' ? 'ETF' : g.vehicle === 'SMAs' ? 'SMA' : 'Privates'} /></td>}
                <td style={{ ...asTdR, color: 'rgb(249,250,251)', fontWeight: 600 }}>{lvFmtM(g.aumM)}</td>
                {g[flowKey].map((v, i) => (
                  <td key={i} style={{ ...asTdR, color: v < 0 ? 'rgb(248,113,113)' : i === 4 ? 'rgb(52,211,153)' : 'rgb(209,213,219)', fontWeight: i === 4 ? 600 : 400 }}>{fmt(v)}</td>
                ))}
              </tr>
            ))}
            <tr>
              <td style={{ ...asTd, fontWeight: 600, color: 'rgb(249,250,251)', borderTop: '1px solid rgba(75,85,99,0.35)' }}>Total</td>
              {grain === 'Product' && <td style={{ ...asTd, borderTop: '1px solid rgba(75,85,99,0.35)' }} />}
              <td style={{ ...asTdR, fontWeight: 600, color: 'rgb(52,211,153)', borderTop: '1px solid rgba(75,85,99,0.35)' }}>{lvFmtM(totalAum)}</td>
              {years.map((y, i) => {
                const t = groups.reduce((a, g) => a + g[flowKey][i], 0);
                return <td key={y} style={{ ...asTdR, fontWeight: 600, color: 'rgb(249,250,251)', borderTop: '1px solid rgba(75,85,99,0.35)' }}>{fmt(t)}</td>;
              })}
            </tr>
          </tbody>
        </table>
      </div>
      <div style={{ padding: '10px 16px 8px', borderTop: '1px solid rgba(75,85,99,0.25)' }}>
        <div style={{ fontFamily: 'Inter', fontSize: 9.5, fontWeight: 600, color: 'rgb(107,114,128)', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 2 }}>
          {flow} · rolling 12 by month, by {grain.toLowerCase()}
        </div>
        <HC options={options} style={{ height: 180 }} />
      </div>
    </div>
  );
}

const asTh  = { padding: '9px 10px 7px', textAlign: 'left', fontFamily: 'Inter', fontSize: 9, fontWeight: 600, color: 'rgb(107,114,128)', textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap', position: 'sticky', top: 0, background: 'rgb(16,26,42)', zIndex: 2 };
const asThR = { ...asTh, textAlign: 'right' };
const asTd  = { padding: '7px 10px', color: 'rgb(229,231,235)', whiteSpace: 'nowrap', borderBottom: '1px solid rgba(75,85,99,0.14)' };
const asTdR = { ...asTd, textAlign: 'right', color: 'rgb(163,163,163)', fontVariantNumeric: 'tabular-nums' };

window.ActualSalesCard = ActualSalesCard;
