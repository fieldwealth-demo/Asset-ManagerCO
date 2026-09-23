/* Client analytics tiles — Age Distribution, Service Penetration, AUM Tier Distribution.
   Deterministic per-client synthesis so a given practice always renders the same book. */
function caSeed(str) { let h = 2166136261; for (let i = 0; i < String(str).length; i++) { h ^= String(str).charCodeAt(i); h = Math.imul(h, 16777619); } return () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h ^= h >>> 13; return ((h >>> 0) % 1000) / 1000; }; }

function buildClientAnalytics(d) {
  const rnd = caSeed(d.fullName + d.firm);
  const jig = (base, spread) => Math.max(1, Math.round(base + (rnd() - 0.5) * spread));
  const ageBuckets = ['<40', '40–54', '55–64', '65–74', '75+'];
  const ageRaw = [jig(8, 6), jig(19, 8), jig(28, 8), jig(27, 8), jig(18, 8)];
  const ageTot = ageRaw.reduce((a, b) => a + b, 0);
  const age = ageRaw.map(v => Math.round((v / ageTot) * 1000) / 10);

  const services = [
    { name: 'Financial planning', v: jig(72, 20) },
    { name: 'Tax-managed SMA', v: jig(28, 18) },
    { name: 'Alternatives', v: jig(34, 20) },
    { name: 'Trust & estate', v: jig(41, 20) },
    { name: 'Lending / banking', v: jig(23, 16) },
  ].map(s => ({ name: s.name, v: Math.min(96, s.v) }));

  const tiers = [
    { name: '<$500K', v: jig(24, 10) },
    { name: '$500K–$1M', v: jig(29, 10) },
    { name: '$1M–$5M', v: jig(31, 10) },
    { name: '$5M–$10M', v: jig(11, 6) },
    { name: '$10M+', v: jig(6, 4) },
  ];
  const tTot = tiers.reduce((a, b) => a + b.v, 0);
  const tierPct = tiers.map(t => ({ name: t.name, y: Math.round((t.v / tTot) * 1000) / 10 }));

  const medianAge = ageBuckets[age.indexOf(Math.max.apply(null, age))];
  const avgPen = Math.round(services.reduce((a, s) => a + s.v, 0) / services.length);
  const hnwShare = Math.round((tierPct[3].y + tierPct[4].y) * 10) / 10;
  return { ageBuckets, age, services, tierPct, medianAge, avgPen, hnwShare };
}

function CAHead({ title, note }) {
  return (
    <div style={{ padding:'14px 18px 4px' }}>
      <div style={{ fontFamily:'Inter', fontSize:13, fontWeight:600, color:'rgb(249,250,251)' }}>{title}</div>
      <div style={{ fontFamily:'Inter', fontSize:11, color:'rgb(115,115,115)', marginTop:3 }}>{note}</div>
    </div>
  );
}

function ClientAnalyticsCards({ d }) {
  const a = React.useMemo(() => buildClientAnalytics(d), [d.fullName, d.firm]);
  const base = { credits:{ enabled:false }, title:{ text:null }, legend:{ enabled:false }, chart:{ backgroundColor:'transparent', spacing:[6,4,4,4] } };

  const ageOpts = Object.assign({}, base, {
    chart: Object.assign({}, base.chart, { type:'column', height:190 }),
    xAxis:{ categories:a.ageBuckets, lineColor:'rgba(75,85,99,0.4)', tickLength:0, labels:{ style:{ color:'rgb(163,163,163)', fontSize:'10.5px' } } },
    yAxis:{ title:{ text:null }, gridLineColor:'rgba(75,85,99,0.25)', labels:{ format:'{value}%', style:{ color:'rgb(115,115,115)', fontSize:'10px' } } },
    tooltip:{ pointFormat:'<b>{point.y}%</b> of clients' },
    plotOptions:{ column:{ borderWidth:0, borderRadius:3, color:'rgb(16,185,129)', pointPadding:0.08, groupPadding:0.12 } },
    series:[{ name:'Clients', data:a.age }],
  });

  const penOpts = Object.assign({}, base, {
    chart: Object.assign({}, base.chart, { type:'bar', height:190 }),
    xAxis:{ categories:a.services.map(s => s.name), lineWidth:0, tickLength:0, labels:{ style:{ color:'rgb(163,163,163)', fontSize:'10.5px' } } },
    yAxis:{ max:100, title:{ text:null }, gridLineColor:'rgba(75,85,99,0.25)', labels:{ format:'{value}%', style:{ color:'rgb(115,115,115)', fontSize:'10px' } } },
    tooltip:{ pointFormat:'<b>{point.y}%</b> of clients enrolled' },
    plotOptions:{ bar:{ borderWidth:0, borderRadius:3, pointWidth:13, colorByPoint:true, colors:['rgb(16,185,129)','rgb(59,130,246)','rgb(139,92,246)','rgb(234,179,8)','rgb(20,184,166)'] } },
    series:[{ name:'Penetration', data:a.services.map(s => s.v) }],
  });

  const tierOpts = Object.assign({}, base, {
    chart: Object.assign({}, base.chart, { type:'pie', height:190 }),
    tooltip:{ pointFormat:'<b>{point.y}%</b> of book' },
    plotOptions:{ pie:{ innerSize:'62%', borderWidth:0, dataLabels:{ enabled:true, distance:8, style:{ color:'rgb(163,163,163)', fontSize:'10px', fontWeight:'500', textOutline:'none' }, format:'{point.name}' } } },
    series:[{ name:'Book', data:a.tierPct, colors:['rgb(75,85,99)','rgb(20,184,166)','rgb(16,185,129)','rgb(59,130,246)','rgb(139,92,246)'] }],
  });

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16 }}>
      <div style={cardStyle}>
        <CAHead title="Client Age Distribution" note={'Peak cohort ' + a.medianAge + ' · share of client count'} />
        <div style={{ padding:'0 10px 12px' }}><HC options={ageOpts} style={{ height:190 }} /></div>
      </div>
      <div style={cardStyle}>
        <CAHead title="Service Penetration" note={'Avg ' + a.avgPen + '% across five service lines'} />
        <div style={{ padding:'0 10px 12px' }}><HC options={penOpts} style={{ height:190 }} /></div>
      </div>
      <div style={cardStyle}>
        <CAHead title="AUM Tier Distribution" note={a.hnwShare + '% of book in $5M+ households'} />
        <div style={{ padding:'0 10px 12px' }}><HC options={tierOpts} style={{ height:190 }} /></div>
      </div>
    </div>
  );
}
Object.assign(window, { ClientAnalyticsCards, buildClientAnalytics });
