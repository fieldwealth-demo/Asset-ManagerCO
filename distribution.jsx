/* Distribution Intelligence page
   Layout (per request):
     • Row 1:  [ US territory map ]  [ signal-type filter tiles ]
     • Row 2:  RIA practice summary (expandable per-firm signal detail)
   Filters: click a territory (map legend / bubble) and/or a signal type tile.
   Both filters compose and drive every panel + the KPI header. */

// Continental US state keys (excludes AK/HI so the inset separator line + far
// insets don't clutter the frame — all practice data is lower-48 anyway).
const DIST_CONUS_KEYS = ['us-al','us-az','us-ar','us-ca','us-co','us-ct','us-de','us-fl','us-ga','us-id','us-il','us-in','us-ia','us-ks','us-ky','us-la','us-me','us-md','us-ma','us-mi','us-mn','us-ms','us-mo','us-mt','us-ne','us-nv','us-nh','us-nj','us-nm','us-ny','us-nc','us-nd','us-oh','us-ok','us-or','us-pa','us-ri','us-sc','us-sd','us-tn','us-tx','us-ut','us-vt','us-va','us-wa','us-wv','us-wi','us-wy','us-dc'];

// State → territory (for the choropleth tint of data states)
const DIST_TERR_STATES = {
  Northeast: ['us-ny','us-ma','us-pa','us-ct','us-ri'],
  Southeast: ['us-ga','us-fl','us-nc','us-tn','us-va'],
  Midwest:   ['us-il','us-mn','us-mi','us-oh','us-in'],
  West:      ['us-ca','us-wa','us-or','us-co','us-ut'],
  Southwest: ['us-tx','us-az'],
};

// ---------- US territory map ----------
function DistTerritoryMap({ sigType, selectedTerr, onTerrClick, height = 432 }) {
  const ref = React.useRef(null);
  const chartRef = React.useRef(null);
  const onTerrClickRef = React.useRef(onTerrClick);
  React.useEffect(() => { onTerrClickRef.current = onTerrClick; }, [onTerrClick]);
  const [topology, setTopology] = React.useState(null);

  // City aggregates (opp respects the active signal-type filter)
  const cityAggs = React.useMemo(() => {
    const byCity = {};
    DIST_PRACTICES.forEach(p => {
      const sigs = sigType ? p.signals.filter(s => s.type === sigType) : p.signals;
      if (sigType && sigs.length === 0) return;
      const opp = sigs.reduce((s,x) => s + x.oppMax, 0);
      if (!byCity[p.city]) byCity[p.city] = { name:p.city, lat:p.lat, lon:p.lon, territory:p.territory, opp:0, practices:0, signals:0 };
      byCity[p.city].opp += opp;
      byCity[p.city].practices += 1;
      byCity[p.city].signals += sigs.length;
    });
    return Object.values(byCity).filter(c => c.opp > 0);
  }, [sigType]);

  React.useEffect(() => {
    if (window.__usTopology) { setTopology(window.__usTopology); return; }
    let cancelled = false;
    fetch('https://code.highcharts.com/mapdata/countries/us/us-all.topo.json')
      .then(r => r.json())
      .then(t => { if (!cancelled) { window.__usTopology = t; setTopology(t); } })
      .catch(e => console.error('Map data load failed', e));
    return () => { cancelled = true; };
  }, []);

  // Out-of-territory bubbles are removed when a territory is selected, not faded.
  const buildBubbles = React.useCallback((aggs, selTerr) => aggs
    .filter(c => !selTerr || selTerr === c.territory)
    .map(c => {
      const meta = DIST_TERR_META[c.territory];
      return {
        name: c.name,
        lat: c.lat, lon: c.lon,
        z: c.opp, opp: c.opp, practices: c.practices, signals: c.signals, territory: c.territory,
        color: meta.fill,
        marker: { lineColor: meta.dot, lineWidth: 1.5 },
      };
    }), []);

  // Tinted-state area data (per territory color), dimmed when another territory is selected
  const buildStateAreas = React.useCallback((selTerr) => {
    const out = [];
    Object.entries(DIST_TERR_STATES).forEach(([terr, keys]) => {
      const meta = DIST_TERR_META[terr];
      const dim = selTerr && selTerr !== terr;
      const m = meta.dot.match(/(\d+),(\d+),(\d+)/);
      const rgb = m ? `${m[1]},${m[2]},${m[3]}` : '120,130,150';
      keys.forEach(k => out.push({
        'hc-key': k,
        color: dim ? 'rgba(120,130,150,0.05)' : `rgba(${rgb},0.16)`,
        borderColor: dim ? 'rgba(120,130,150,0.25)' : `rgba(${rgb},0.55)`,
        territory: terr,
      }));
    });
    return out;
  }, []);

  // Create chart once
  React.useEffect(() => {
    if (!topology || !ref.current || typeof Highcharts === 'undefined' || !Highcharts.mapChart) return;
    if (chartRef.current) return;

    chartRef.current = Highcharts.mapChart(ref.current, {
      chart: { map: topology, backgroundColor: 'transparent', height, margin:[4,4,4,4], spacing:[0,0,0,0], animation:false },
      title: { text: '' }, credits: { enabled: false }, legend: { enabled: false },
      mapNavigation: {
        enabled: true, enableMouseWheelZoom: false, enableDoubleClickZoom: true,
        buttonOptions: {
          alignTo: 'spacingBox', align: 'left', verticalAlign: 'top', x: 8, y: 8,
          theme: {
            fill: 'rgba(13,20,32,0.78)', stroke: 'rgba(75,85,99,0.55)', 'stroke-width': 1, r: 6,
            style: { color:'rgb(229,231,235)', fontFamily:'Inter', fontSize:'13px', fontWeight:'600' },
            states: { hover:{ fill:'rgba(16,185,129,0.18)', style:{ color:'rgb(52,211,153)' } } },
          },
        },
      },
      mapView: {
        fitToGeometry: { type:'MultiPoint', coordinates: [[-123.5,48.5],[-69,46.5],[-80.5,25.5],[-117,32.5]] },
      },
      tooltip: {
        useHTML: true, backgroundColor:'rgba(13,20,32,0.96)', borderColor:'rgba(75,85,99,0.55)',
        borderRadius: 8, shadow:false, padding:10, hideDelay:60,
        style: { color:'#fff', fontFamily:'Inter', fontSize:'11px' },
        formatter: function() {
          if (this.point && this.point.opp != null) {
            const meta = DIST_TERR_META[this.point.territory] || { dot:'#fff' };
            return '<div style="min-width:170px;">' +
              '<div style="font-size:12px;font-weight:700;color:#fff;margin-bottom:2px;">' + this.point.name + '</div>' +
              '<div style="font-size:10px;color:' + meta.dot + ';font-weight:600;margin-bottom:6px;">' + this.point.territory + '</div>' +
              '<div style="display:grid;grid-template-columns:auto auto;gap:2px 14px;font-size:11px;">' +
                '<span style="color:rgb(107,114,128);">Est. opp AUM</span><span style="text-align:right;color:rgb(52,211,153);font-weight:700;">' + distFmtM(this.point.opp) + '</span>' +
                '<span style="color:rgb(107,114,128);">Practices</span><span style="text-align:right;color:#fff;font-weight:600;">' + this.point.practices + '</span>' +
                '<span style="color:rgb(107,114,128);">Signals</span><span style="text-align:right;color:#fff;font-weight:600;">' + this.point.signals + '</span>' +
              '</div></div>';
          }
          return false;
        },
      },
      plotOptions: {
        mapbubble: {
          minSize: 12, maxSize: 46, opacity: 0.82, animation:{ duration:350 }, cursor:'pointer',
          states: { hover:{ opacity:1, lineWidthPlus:2 } },
          point: { events: { click: function() { if (onTerrClickRef.current) onTerrClickRef.current(this.territory); } } },
        },
        map: { nullColor:'rgba(255,255,255,0.025)' },
      },
      series: [
        { // base US outline (continental only — avoids AK/HI insets + separator line)
          name:'US', mapData:topology, joinBy:'hc-key', allAreas:false,
          data: DIST_CONUS_KEYS.map(k => ({ 'hc-key':k, value:1, color:'rgba(255,255,255,0.028)' })),
          borderColor:'rgba(120,140,170,0.30)', borderWidth:0.6,
          enableMouseTracking:false, states:{ hover:{ enabled:false } },
        },
        { // territory-tinted data states
          name:'Territories', mapData:topology, joinBy:'hc-key', allAreas:false,
          borderWidth: 0.9, data: buildStateAreas(selectedTerr),
          cursor:'pointer', enableMouseTracking:true,
          states:{ hover:{ brightness:0.08 } },
          point:{ events:{ click: function() { if (onTerrClickRef.current && this.territory) onTerrClickRef.current(this.territory); } } },
          dataLabels:{ enabled:false },
          tooltip:{ pointFormatter: function() { return '<span style="color:rgb(163,163,163)">'+this.territory+'</span>'; } },
        },
        { type:'mapbubble', name:'Cities', data: buildBubbles(cityAggs, selectedTerr) },
      ],
    });

    return () => { try { chartRef.current && chartRef.current.destroy(); } catch(e){} chartRef.current = null; };
  }, [topology, height, buildBubbles, buildStateAreas]);

  // Update in place
  React.useEffect(() => {
    const ch = chartRef.current;
    if (!ch || !ch.series || ch.series.length < 3) return;
    try {
      ch.series[1].setData(buildStateAreas(selectedTerr), false, false, false);
      ch.series[2].setData(buildBubbles(cityAggs, selectedTerr), true, false, false);
    } catch(e){}
  }, [cityAggs, selectedTerr, buildBubbles, buildStateAreas]);

  React.useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(() => { try { chartRef.current && chartRef.current.reflow(); } catch(e){} });
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  return (
    <div style={{ position:'relative', width:'100%', height, borderRadius:8, overflow:'hidden',
      background:'radial-gradient(ellipse 60% 70% at 50% 42%, rgba(28,42,66,0.5) 0%, rgba(11,21,36,0) 70%)' }}>
      <svg width="100%" height="100%" style={{ position:'absolute', inset:0, pointerEvents:'none' }}>
        <defs>
          <pattern id="dist-grid" width="36" height="36" patternUnits="userSpaceOnUse">
            <path d="M 36 0 L 0 0 0 36" fill="none" stroke="rgba(75,85,99,0.18)" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dist-grid)" />
      </svg>
      <div ref={ref} style={{ width:'100%', height:'100%', position:'relative', zIndex:1 }} />

      {/* Bubble size legend */}
      <div style={{ position:'absolute', right:14, bottom:12, zIndex:2, padding:'8px 12px',
        background:'rgba(13,20,32,0.78)', border:'1px solid rgba(75,85,99,0.4)', borderRadius:8, backdropFilter:'blur(6px)' }}>
        <div style={{ fontFamily:'Inter', fontSize:9.5, fontWeight:600, color:'rgb(200,205,213)', textTransform:'uppercase', letterSpacing:0.5, marginBottom:5 }}>Bubble = est. opp AUM</div>
        <div style={{ display:'flex', alignItems:'flex-end', gap:12 }}>
          {[[7,'$20M'],[11,'$50M'],[16,'$100M']].map(([r,lbl],i) => (
            <div key={i} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
              <div style={{ width:r*2, height:r*2, borderRadius:'50%', background:'rgba(125,150,180,0.16)', border:'1px solid rgba(125,150,180,0.55)' }} />
              <span style={{ fontFamily:'Inter', fontSize:9, color:'rgb(163,163,163)', fontVariantNumeric:'tabular-nums' }}>{lbl}</span>
            </div>
          ))}
        </div>
      </div>

      {!topology && (
        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Inter', fontSize:12, color:'rgb(163,163,163)' }}>
          <i className="fa-solid fa-spinner fa-spin" style={{ marginRight:8 }} />Loading map…
        </div>
      )}
    </div>
  );
}

// ---------- Territory filter legend (under the map) ----------
function DistTerrLegend({ selectedTerr, onToggle }) {
  return (
    <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:12 }}>
      {DIST_TERRS.map(t => {
        const meta = DIST_TERR_META[t];
        const on = selectedTerr === t;
        const dim = selectedTerr && !on;
        const tp = DIST_PRACTICES.filter(p => p.territory === t);
        return (
          <button key={t} onClick={() => onToggle(t)} style={{
            display:'inline-flex', alignItems:'center', gap:7, height:28, padding:'0 11px', borderRadius:9999,
            background: on ? `${meta.dot.replace('rgb','rgba').replace(')',',0.16)')}` : 'rgba(255,255,255,0.03)',
            border: `1px solid ${on ? meta.dot : 'rgba(75,85,99,0.55)'}`,
            color: on ? meta.dot : (dim ? 'rgb(107,114,128)' : 'rgb(209,213,219)'),
            fontFamily:'Inter', fontSize:11.5, fontWeight: on ? 700 : 500, cursor:'pointer',
            opacity: dim ? 0.6 : 1, transition:'all .12s',
          }}>
            <span style={{ width:9, height:9, borderRadius:9999, background: meta.dot, opacity: dim ? 0.5 : 1 }} />
            {t}
            <span style={{ fontSize:10, color: on ? meta.dot : 'rgb(107,114,128)', fontWeight:500 }}>{tp.length}</span>
          </button>
        );
      })}
    </div>
  );
}

// ---------- Signal-type filter tiles ----------
function DistSignalTiles({ practices, sigType, onToggle }) {
  // Counts across the (territory-filtered) practice set
  const stats = DIST_SIG_TYPES.map(type => {
    let n = 0, oppMin = 0, oppMax = 0, firms = 0;
    practices.forEach(p => {
      const s = p.signals.find(x => x.type === type);
      if (s) { n += 1; firms += 1; oppMin += s.oppMin; oppMax += s.oppMax; }
    });
    return { type, n, oppMin, oppMax, firms };
  });
  const maxOpp = Math.max(1, ...stats.map(s => s.oppMax));

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
      {stats.map(s => {
        const meta = DIST_SIG_META[s.type];
        const on = sigType === s.type;
        const dim = sigType && !on;
        const empty = s.n === 0;
        return (
          <button key={s.type} disabled={empty} onClick={() => onToggle(s.type)} style={{
            display:'flex', alignItems:'center', gap:12, textAlign:'left', width:'100%',
            padding:'10px 13px', borderRadius:10, cursor: empty ? 'default' : 'pointer',
            background: on ? `${meta.dot.replace('rgb','rgba').replace(')',',0.12)')}` : 'rgba(255,255,255,0.025)',
            border: `1px solid ${on ? meta.dot : 'rgba(75,85,99,0.4)'}`,
            opacity: empty ? 0.4 : (dim ? 0.62 : 1), transition:'all .12s', position:'relative', overflow:'hidden',
          }}>
            <span style={{ width:30, height:30, borderRadius:8, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center',
              background:`${meta.dot.replace('rgb','rgba').replace(')',',0.16)')}`, border:`1px solid ${meta.dot.replace('rgb','rgba').replace(')',',0.4)')}` }}>
              <i className={`fa-solid fa-${meta.icon}`} style={{ fontSize:12, color: meta.dot }} />
            </span>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontFamily:'Inter', fontSize:12.5, fontWeight:600, color:'rgb(249,250,251)' }}>{s.type}</div>
              <div style={{ height:3, borderRadius:9999, background:'rgba(75,85,99,0.4)', marginTop:6, overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${empty?0:Math.max(8,(s.oppMax/maxOpp)*100)}%`, borderRadius:9999, background: meta.dot, opacity:0.85 }} />
              </div>
            </div>
            <div style={{ textAlign:'right', flexShrink:0 }}>
              <div style={{ fontFamily:'Inter Display, Inter', fontSize:18, fontWeight:700, color: empty ? 'rgb(107,114,128)' : meta.dot, lineHeight:1, fontVariantNumeric:'tabular-nums' }}>{s.n}</div>
              <div style={{ fontFamily:'Inter', fontSize:10, color:'rgb(163,163,163)', marginTop:3, fontVariantNumeric:'tabular-nums' }}>{empty ? '—' : `${distFmtM(s.oppMin)}–${distFmtM(s.oppMax)}`}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ---------- Practice → client-detail row (opens the shared ClientDetailPage) ----------
function distClientRow(p){
  const aum = p.aum;
  const oppMax = p.signals.reduce((a,s)=>a+s.oppMax,0);
  const yours = Math.max(Math.round(aum*0.10),1);
  const share = `${(yours/aum*100).toFixed(1)}%`;
  const f = distFmtM;
  const strong = p.oppScore>=80, mod = p.oppScore>=60;
  return {
    type:'Teams', name:p.name, firm:`${p.city}, ${p.state}`,
    adv: strong?'Strong':mod?'Moderate':'Developing',
    advDot: strong?'rgb(52,211,153)':mod?'rgb(234,179,8)':'rgb(248,113,113)',
    opp: f(aum), yours: f(yours), share,
    iOpp: f(oppMax), iYours: f(Math.max(Math.round(oppMax*0.18),1)), iShare:'18.0%',
    nOpp: '+'+f(Math.max(Math.round(oppMax*0.4),1)), nYours:'+'+f(Math.max(Math.round(oppMax*0.08),1)), nShare:'20.0%',
    ca:'$0M', perf:'$0M', fee:'$0M', totInflow:'$0M', netFlow:'+$0M',
  };
}

// ---------- Practice summary table ----------
function DistPracticeTable({ practices, sigType, selectedTerr, onViewClient }) {
  const [openId, setOpenId] = React.useState(null);
  const [shareP, setShareP] = React.useState(null);
  const [sharedIds, setSharedIds] = React.useState([]);
  const [sortCol, setSortCol] = React.useState('opp');
  const [sortDir, setSortDir] = React.useState(-1);

  const oppMaxOf = (p, st) => (st ? p.signals.filter(s => s.type === st) : p.signals).reduce((a,s) => a + s.oppMax, 0);
  const oppMinOf = (p, st) => (st ? p.signals.filter(s => s.type === st) : p.signals).reduce((a,s) => a + s.oppMin, 0);
  const sigCountOf = (p, st) => (st ? p.signals.filter(s => s.type === st).length : p.signals.length);

  let rows = practices.slice();
  rows.sort((a,b) => {
    let va, vb;
    if (sortCol === 'name') { va = a.name; vb = b.name; return va.localeCompare(vb) * sortDir; }
    if (sortCol === 'terr') { va = a.territory; vb = b.territory; return va.localeCompare(vb) * sortDir; }
    if (sortCol === 'sigs') { va = sigCountOf(a, sigType); vb = sigCountOf(b, sigType); }
    else if (sortCol === 'score') { va = a.oppScore; vb = b.oppScore; }
    else { va = oppMaxOf(a, sigType); vb = oppMaxOf(b, sigType); }
    return (va - vb) * sortDir;
  });

  const setSort = (col) => {
    if (sortCol === col) setSortDir(d => -d);
    else { setSortCol(col); setSortDir(-1); }
  };

  const th = (label, col, alignRight) => (
    <th onClick={() => setSort(col)} style={{
      textAlign: alignRight ? 'right' : 'left', padding:'11px 16px 10px', cursor:'pointer', userSelect:'none',
      fontFamily:'Inter', fontSize:10, fontWeight:500, color: sortCol===col ? 'rgb(209,213,219)' : 'rgb(107,114,128)',
      letterSpacing:0.5, textTransform:'uppercase', whiteSpace:'nowrap',
      position:'sticky', top:0, background:'rgba(17,24,39,0.96)', backdropFilter:'blur(6px)', zIndex:5,
      borderBottom:'1px solid rgba(75,85,99,0.35)',
    }}>
      {label}{sortCol===col && <span style={{ color:'rgb(52,211,153)' }}>{sortDir===-1 ? ' ↓' : ' ↑'}</span>}
    </th>
  );

  return (
    <div style={{ borderRadius:12, overflow:'hidden', border:'1px solid rgba(75,85,99,0.4)', background:'rgba(255,255,255,0.02)' }}>
      <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', gap:12, padding:'14px 16px', borderBottom:'1px solid rgba(75,85,99,0.3)' }}>
        <div>
          <div style={{ fontFamily:'Inter', fontWeight:600, fontSize:13.5, color:'rgb(249,250,251)' }}>
            {(selectedTerr ? selectedTerr + ' — ' : '')}RIA Practice Summary
          </div>
          <div style={{ fontFamily:'Inter', fontSize:11, color:'rgb(163,163,163)', marginTop:2 }}>
            Click a row to expand its signals · Share sends the opportunity to the practice · open Details for the full profile
          </div>
        </div>
        <span style={{ fontFamily:'Inter', fontSize:11, color:'rgb(163,163,163)', whiteSpace:'nowrap' }}>{rows.length} practice{rows.length!==1?'s':''}</span>
      </div>
      <div style={{ maxHeight:600, overflowY:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontFamily:'Inter', fontSize:12 }}>
          <thead>
            <tr>
              {th('Practice','name')}
              {th('Territory','terr')}
              <th style={{ textAlign:'left', padding:'11px 16px 10px', fontFamily:'Inter', fontSize:10, fontWeight:500, color:'rgb(200,205,213)', letterSpacing:0.5, textTransform:'uppercase', position:'sticky', top:0, background:'rgba(17,24,39,0.96)', backdropFilter:'blur(6px)', zIndex:5, borderBottom:'1px solid rgba(75,85,99,0.35)' }}>Signal Types</th>
              {th('Signals','sigs',true)}
              {th('Est. Opp AUM','opp',true)}
              {th('Score','score',true)}
              <th style={{ width:24, position:'sticky', top:0, background:'rgba(17,24,39,0.96)', zIndex:5, borderBottom:'1px solid rgba(75,85,99,0.35)' }}></th>
              <th style={{ width:64, textAlign:'right', padding:'11px 16px 10px', fontFamily:'Inter', fontSize:10, fontWeight:500, color:'rgb(200,205,213)', letterSpacing:0.5, textTransform:'uppercase', position:'sticky', top:0, background:'rgba(17,24,39,0.96)', backdropFilter:'blur(6px)', zIndex:5, borderBottom:'1px solid rgba(75,85,99,0.35)' }}>Details</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(p => {
              const sigs = sigType ? p.signals.filter(s => s.type === sigType) : p.signals;
              const oppMin = oppMinOf(p, sigType), oppMax = oppMaxOf(p, sigType);
              const isOpen = openId === p.id;
              const tmeta = DIST_TERR_META[p.territory];
              return (
                <React.Fragment key={p.id}>
                  <tr onClick={() => setOpenId(isOpen ? null : p.id)} style={{
                    borderTop:'1px solid rgba(75,85,99,0.15)', cursor:'pointer',
                    background: isOpen ? 'rgba(16,185,129,0.06)' : 'transparent',
                  }}
                  onMouseEnter={e => { if (!isOpen) e.currentTarget.style.background = 'rgba(255,255,255,0.025)'; }}
                  onMouseLeave={e => { if (!isOpen) e.currentTarget.style.background = 'transparent'; }}>
                    <td style={{ padding:'11px 16px' }}>
                      <div style={{ fontFamily:'Inter', fontSize:12.5, fontWeight:600, color:'rgb(249,250,251)' }}>{p.name}</div>
                      <div style={{ fontFamily:'Inter', fontSize:10.5, color:'rgb(163,163,163)', marginTop:1 }}>{p.city}, {p.state}</div>
                    </td>
                    <td style={{ padding:'11px 16px' }}>
                      <span style={{ display:'inline-flex', alignItems:'center', gap:6, fontFamily:'Inter', fontSize:11, fontWeight:600, color: tmeta_color(p.territory) }}>
                        <span style={{ width:8, height:8, borderRadius:9999, background: tmeta.dot }} />{p.territory}
                      </span>
                    </td>
                    <td style={{ padding:'11px 16px' }}>
                      <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                        {sigs.map((s,i) => {
                          const sm = DIST_SIG_META[s.type];
                          return <span key={i} style={{ display:'inline-flex', alignItems:'center', padding:'2px 7px', borderRadius:9999, fontSize:9.5, fontWeight:700,
                            background:`${sm.dot.replace('rgb','rgba').replace(')',',0.14)')}`, color: sm.dot, border:`1px solid ${sm.dot.replace('rgb','rgba').replace(')',',0.3)')}` }}>{sm.short}</span>;
                        })}
                      </div>
                    </td>
                    <td style={{ padding:'11px 16px', textAlign:'right', fontFamily:'Inter', fontWeight:700, color:'rgb(52,211,153)', fontVariantNumeric:'tabular-nums' }}>{sigs.length}</td>
                    <td style={{ padding:'11px 16px', textAlign:'right', fontFamily:'Inter', fontWeight:600, color:'rgb(52,211,153)', whiteSpace:'nowrap', fontVariantNumeric:'tabular-nums' }}>{oppMax ? `${distFmtM(oppMin)}–${distFmtM(oppMax)}` : '—'}</td>
                    <td style={{ padding:'11px 16px' }}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', gap:7 }}>
                        <div style={{ width:42, height:4, borderRadius:9999, background:'rgba(75,85,99,0.4)', overflow:'hidden' }}>
                          <div style={{ height:'100%', width:`${p.oppScore}%`, borderRadius:9999, background:'linear-gradient(90deg, rgb(16,185,129), rgb(52,211,153))' }} />
                        </div>
                        <span style={{ fontFamily:'Inter', fontSize:11, fontWeight:700, color:'rgb(52,211,153)', width:18, textAlign:'right', fontVariantNumeric:'tabular-nums' }}>{p.oppScore}</span>
                      </div>
                    </td>
                    <td style={{ padding:'11px 0', textAlign:'center' }}>
                      <i className="fa-solid fa-chevron-down" style={{ fontSize:11, color: isOpen ? 'rgb(52,211,153)' : 'rgb(107,114,128)', transform: isOpen ? 'rotate(180deg)' : 'none', transition:'transform .2s' }} />
                    </td>
                    <td style={{ padding:'11px 16px 11px 0', textAlign:'right' }}>
                      <div style={{ display:'inline-flex', alignItems:'center', gap:7 }}>
                        <DistShareButton shared={sharedIds.indexOf(p.id) !== -1} onClick={(e) => { e.stopPropagation(); setShareP(p); }} />
                        <DistEyeButton onClick={(e) => { e.stopPropagation(); onViewClient && onViewClient(distClientRow(p)); }} />
                      </div>
                    </td>
                  </tr>
                  {isOpen && (
                    <tr>
                      <td colSpan={8} style={{ padding:0, background:'rgba(16,185,129,0.04)', borderTop:'1px solid rgba(16,185,129,0.15)' }}>
                        <div style={{ display:'flex', flexDirection:'column', gap:8, padding:'14px 16px' }}>
                          {p.firmLink && (
                            <div style={{ display:'flex', alignItems:'center', gap:14, flexWrap:'wrap', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(75,85,99,0.4)', borderRadius:8, padding:'10px 14px' }}>
                              <span style={{ fontFamily:'Inter', fontSize:9.5, fontWeight:700, letterSpacing:0.5, textTransform:'uppercase', color:'rgb(200,205,213)' }}>From firm dashboard</span>
                              {[['Firm', p.firmLink.firm],['Channel', p.firmLink.channel],['Advantage', p.firmLink.advantage],['Total opp', p.firmLink.totalOpp],['Your book', p.firmLink.yourBook],['Share', p.firmLink.share]].map(([k,v]) => (
                                <span key={k} style={{ fontFamily:'Inter', fontSize:11, color:'rgb(163,163,163)' }}>{k}: <strong style={{ color: k==='Total opp' ? 'rgb(52,211,153)' : 'rgb(249,250,251)', fontWeight:700 }}>{v}</strong></span>
                              ))}
                            </div>
                          )}
                          {sigs.map((s,i) => {
                            const sm = DIST_SIG_META[s.type];
                            return (
                              <div key={i} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(75,85,99,0.4)', borderLeft:`2px solid ${sm.dot}`, borderRadius:8, padding:'12px 14px' }}>
                                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:7 }}>
                                  <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 9px', borderRadius:9999, fontSize:10.5, fontWeight:700,
                                    background:`${sm.dot.replace('rgb','rgba').replace(')',',0.14)')}`, color: sm.dot, border:`1px solid ${sm.dot.replace('rgb','rgba').replace(')',',0.3)')}` }}>
                                    <i className={`fa-solid fa-${sm.icon}`} style={{ fontSize:9 }} />{s.type}
                                  </span>
                                  <span style={{ fontFamily:'Inter', fontSize:10.5, fontWeight:700, color: s.strength==='high' ? 'rgb(52,211,153)' : 'rgb(234,179,8)' }}>● {s.strength==='high' ? 'High' : 'Medium'} signal</span>
                                </div>
                                <div style={{ fontFamily:'Inter', fontSize:12, lineHeight:1.5, color:'rgb(229,231,235)', marginBottom:8 }} dangerouslySetInnerHTML={{ __html: s.desc.replace(/<strong>/g,'<strong style="color:rgb(52,211,153);font-weight:700">') }} />
                                <div style={{ fontFamily:'Inter', fontSize:11, color:'rgb(163,163,163)', lineHeight:1.6, padding:'8px 11px', background:'rgba(255,255,255,0.025)', borderLeft:'2px solid rgba(75,85,99,0.6)', borderRadius:'0 6px 6px 0', marginBottom:8 }}>
                                  <div style={{ fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:0.5, color:'rgb(200,205,213)', marginBottom:3 }}>How it's calculated</div>
                                  {DIST_CALC[s.type]}
                                </div>
                                <div style={{ display:'flex', gap:24 }}>
                                  <div style={{ fontFamily:'Inter', fontSize:11, color:'rgb(163,163,163)' }}>Eligible clients: <strong style={{ color: sm.dot, fontWeight:700 }}>{s.clients}</strong></div>
                                  <div style={{ fontFamily:'Inter', fontSize:11, color:'rgb(163,163,163)' }}>Est. opp AUM: <strong style={{ color:'rgb(52,211,153)', fontWeight:700 }}>{distFmtM(s.oppMin)}–{distFmtM(s.oppMax)}</strong></div>
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
          </tbody>
        </table>
      </div>
      {shareP && (
        <DistShareModal practice={shareP} sigs={sigType ? shareP.signals.filter(s => s.type === sigType) : shareP.signals}
          onClose={() => setShareP(null)} onSent={(id) => setSharedIds(ids => ids.indexOf(id) === -1 ? ids.concat([id]) : ids)} />
      )}
    </div>
  );
}

function DistEyeButton({ onClick }) {
  const [hover, setHover] = React.useState(false);
  return (
    <button onClick={onClick} title="View full practice profile"
      onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}
      style={{
        width:30, height:26, padding:0, borderRadius:6, cursor:'pointer',
        border:`1px solid ${hover ? 'rgb(16,185,129)' : 'rgba(75,85,99,0.55)'}`,
        background: hover ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.03)',
        color: hover ? 'rgb(52,211,153)' : 'rgb(163,163,163)',
        display:'inline-flex', alignItems:'center', justifyContent:'center', transition:'all .12s',
      }}>
      <i className="fa-regular fa-eye" style={{ fontSize:11 }} />
    </button>
  );
}

function tmeta_color(terr) { return (DIST_TERR_META[terr] || { dot:'rgb(209,213,219)' }).dot; }

// ---------- KPI tile ----------
function DistKpi({ label, value, sub, color, icon }) {
  const soft = color ? color.replace('rgb','rgba').replace(')',',0.14)') : 'rgba(255,255,255,0.05)';
  const ring = color ? color.replace('rgb','rgba').replace(')',',0.3)') : 'rgba(75,85,99,0.5)';
  return (
    <Tile pad={16} style={{ minHeight:0 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
        <div style={{ fontFamily:'Inter', fontSize:10, fontWeight:600, color:'rgb(200,205,213)', textTransform:'uppercase', letterSpacing:0.6 }}>{label}</div>
        <span style={{ width:28, height:28, borderRadius:8, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', background:soft, border:`1px solid ${ring}` }}>
          <i className={`fa-solid fa-${icon}`} style={{ fontSize:12, color: color || 'rgb(163,163,163)' }} />
        </span>
      </div>
      <div style={{ fontFamily:'Inter Display, Inter', fontSize:28, fontWeight:700, letterSpacing:'-0.02em', lineHeight:1, color: color || 'rgb(249,250,251)', fontVariantNumeric:'tabular-nums' }}>{value}</div>
      <div style={{ fontFamily:'Inter', fontSize:11, color:'rgb(163,163,163)', marginTop:6 }}>{sub}</div>
    </Tile>
  );
}

// ---------- Page ----------
function DistributionPage({ onSelectionsChange, onViewClient }) {
  const [selectedTerr, setSelectedTerr] = React.useState('');
  const [sigType, setSigType] = React.useState('');

  const toggleTerr = (t) => setSelectedTerr(cur => cur === t ? '' : t);
  const toggleSig  = (t) => setSigType(cur => cur === t ? '' : t);

  // Publish active filters up to the TopBar's Active Selections bar
  React.useEffect(() => {
    if (!onSelectionsChange) return;
    const sels = [];
    if (selectedTerr) sels.push({ key:'terr', label: selectedTerr, icon:'location-dot', onRemove: () => setSelectedTerr('') });
    if (sigType) sels.push({ key:'sig', label: sigType, icon: (DIST_SIG_META[sigType] || {}).icon || 'bolt', onRemove: () => setSigType('') });
    onSelectionsChange(sels);
  }, [selectedTerr, sigType, onSelectionsChange]);

  // Territory-filtered practice set
  const fpracts = React.useMemo(() => selectedTerr ? DIST_PRACTICES.filter(p => p.territory === selectedTerr) : DIST_PRACTICES, [selectedTerr]);

  // Table set also respects the signal-type filter (only firms with that signal)
  const tableRows = React.useMemo(() => sigType ? fpracts.filter(p => p.signals.some(s => s.type === sigType)) : fpracts, [fpracts, sigType]);

  // KPI totals from filtered signals
  const { oppMin, oppMax, sigCount } = React.useMemo(() => {
    let mn = 0, mx = 0, n = 0;
    fpracts.forEach(p => {
      const sigs = sigType ? p.signals.filter(s => s.type === sigType) : p.signals;
      sigs.forEach(s => { mn += s.oppMin; mx += s.oppMax; n += 1; });
    });
    return { oppMin: mn, oppMax: mx, sigCount: n };
  }, [fpracts, sigType]);

  const anyFilter = selectedTerr || sigType; // eslint-disable-line no-unused-vars

  return (
    <div style={{ padding:20, display:'flex', flexDirection:'column', gap:16 }}>

      {/* KPI tiles */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:16 }}>
        <DistKpi label="Est. Opportunity AUM" value={`${distFmtM(oppMin)}–${distFmtM(oppMax)}`} sub={`across ${sigCount} signal${sigCount!==1?'s':''}`} color="rgb(52,211,153)" icon="sack-dollar" />
        <DistKpi label="Total Signals" value={sigCount} sub={`${tableRows.length} practice${tableRows.length!==1?'s':''}`} color="rgb(249,115,22)" icon="satellite-dish" />
        <DistKpi label="Coverage" value={`${tableRows.length}/${DIST_PRACTICES.length}`} sub={selectedTerr || 'all territories'} icon="location-dot" />
      </div>

      {/* Row 1: map + signal tiles */}
      <div style={{ display:'grid', gridTemplateColumns:'1.45fr 1fr', gap:16, alignItems:'stretch' }}>
        <Tile title="Territory Distribution" subtitle="Bubble size = estimated opportunity AUM · color = territory" style={{ minHeight:0 }}>
          <DistTerritoryMap sigType={sigType} selectedTerr={selectedTerr} onTerrClick={toggleTerr} />
          <DistTerrLegend selectedTerr={selectedTerr} onToggle={toggleTerr} />
        </Tile>
        <Tile title="Signal Types" subtitle={sigType ? `Filtered · ${sigType}` : 'Tap to filter the map + table'} style={{ minHeight:0 }}>
          <DistSignalTiles practices={fpracts} sigType={sigType} onToggle={toggleSig} />
        </Tile>
      </div>

      {/* Row 2: practice summary */}
      <DistPracticeTable practices={tableRows} sigType={sigType} selectedTerr={selectedTerr} onViewClient={onViewClient} />
    </div>
  );
}

window.DistributionPage = DistributionPage;
