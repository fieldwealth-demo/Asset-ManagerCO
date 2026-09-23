/* Opportunity Dashboard — Extras
   - TerritoryHeatMap: bubble map of Doe Wealth Group's NE-US territory
       bubble size  = Market AUM Opp ($M)
       bubble color = AM's market share (red < amber < green)
   - TileCustomize: gear icon + popover that lets the user swap
       chart type / dimension / measure for a tile
*/

/* Shared filter applied both inside the map (to build city aggregates) and by
   the heat-map tile (to feed the right-side client list). */
function filterCityClients(cityName, opts) {
  const { vehicleFilter = [], channels = [], advantage = [], regions = [],
          catSelected = [], selectedClient = null } = opts || {};
  const VEH_MIX = { MF: 0.40, ETF: 0.30, SMA: 0.20, Privates: 0.10 };
  const vehMult = vehicleFilter.length === 0 ? 1
    : vehicleFilter.reduce((s, v) => s + (VEH_MIX[v] || 0), 0);
  const advSet    = new Set(advantage);
  const regionSet = new Set(regions);
  const catSet    = new Set(catSelected);
  const chSet     = new Set(channels);

  const all = CITY_CLIENTS[cityName] || [];
  return all
    .filter(c => {
      if (advSet.size    && !advSet.has(c.adv))       return false;
      if (regionSet.size && !regionSet.has(c.region)) return false;
      if (chSet.size     && !chSet.has(c.channel))    return false;
      if (catSet.size    && !c.cats.some(cat => catSet.has(cat))) return false;
      if (selectedClient && c.name !== selectedClient) return false;
      return true;
    })
    .map(c => {
      let mult = vehMult;
      if (catSet.size) {
        const overlap = c.cats.filter(cat => catSet.has(cat)).length;
        mult *= overlap / c.cats.length;
      }
      const opp   = c.opp   * mult;
      const yours = c.yours * mult;
      const share = opp ? (yours / opp * 100) : 0;
      return { ...c, opp, yours, share };
    });
}

/* ---------- Territory heat map ---------- */

/* Hand-tuned Northeast cities. lon/lat in real coords; we project to an SVG box.
   labelDir tweaks where the city label sits relative to the bubble so dense
   clusters around NYC stay legible. */
const TERRITORY_CITIES = [
  // name,                 lon,     lat,    opp ($M),  share (%),  yours ($M), labelDir
  { name:'New York, NY',   lon:-74.00, lat:40.71, opp: 58.4, share: 19.2, yours: 11.2, labelDir:'br' },
  { name:'Boston, MA',     lon:-71.06, lat:42.36, opp: 32.6, share: 27.5, yours: 8.9 , labelDir:'tr' },
  { name:'Philadelphia',   lon:-75.17, lat:39.95, opp: 21.8, share: 11.4, yours: 2.5 , labelDir:'b'  },
  { name:'Washington DC',  lon:-77.04, lat:38.91, opp: 28.4, share: 9.8,  yours: 2.8 , labelDir:'b'  },
  { name:'Hartford, CT',   lon:-72.69, lat:41.76, opp: 9.6,  share: 31.2, yours: 3.0 , labelDir:'r'  },
  { name:'Stamford, CT',   lon:-73.54, lat:41.05, opp: 14.2, share: 26.8, yours: 3.8 , labelDir:'b' },
  { name:'Providence, RI', lon:-71.41, lat:41.82, opp: 6.8,  share: 12.5, yours: 0.85, labelDir:'br' },
  { name:'Wilmington, DE', lon:-75.55, lat:39.74, opp: 7.4,  share: 14.0, yours: 1.04, labelDir:'l'  },
  { name:'Albany, NY',     lon:-73.75, lat:42.65, opp: 5.2,  share: 22.3, yours: 1.16, labelDir:'l'  },
  { name:'Newark, NJ',     lon:-74.95, lat:40.78, opp: 12.6, share: 17.1, yours: 2.16, labelDir:'l'  },
  { name:'Pittsburgh, PA', lon:-79.99, lat:40.44, opp: 16.4, share: 8.6,  yours: 1.41, labelDir:'b'  },
  { name:'Portland, ME',   lon:-70.25, lat:43.66, opp: 4.2,  share: 28.0, yours: 1.18, labelDir:'r'  },
];

/* Which territory clients are based in each city. CLIENT_ROWS (in opportunity.jsx)
   are agnostic of location; this is the lookup the heat-map side panel uses to
   show clients for the city the user clicked. Each entry: clients[] is a list
   of {name, type, adv, advDot, opp, yours, share, channel, cats, region}.
   - `channel` is one of: Brokerage, Advisory, Retirement/IRA, Insurance
   - `cats` is the set of M★ categories this client invests in (matches ALL_CATS names)
   - `region` matches the global filter bar's region options */
const CITY_CLIENTS = {
  'New York, NY':   [
    { name:'The Doe Wealth Group',     type:'Teams', adv:'Strong',   advDot:'rgb(52,211,153)',  opp:58.4, yours:11.2, share:19.2, channel:'Advisory',         cats:['Large Growth','Multi-sector Bond','Large Blend','Core Plus','Private Credit'], region:'Northeast' },
    { name:'Caldwell Family Office',   type:'BA',    adv:'Moderate', advDot:'rgb(250,204,21)',  opp:22.4, yours:4.2,  share:18.8, channel:'Brokerage',        cats:['Large Blend','Private Credit','EM'],                                            region:'Northeast' },
    { name:'Madison Avenue Partners',  type:'Teams', adv:'Strong',   advDot:'rgb(52,211,153)',  opp:18.2, yours:3.6,  share:19.8, channel:'Advisory',         cats:['Large Growth','Core Plus','Foreign Lg.'],                                       region:'Northeast' },
  ],
  'Boston, MA':     [
    { name:'The Smith Group',          type:'Teams', adv:'Moderate', advDot:'rgb(250,204,21)',  opp:18.4, yours:5.1,  share:27.7, channel:'Retirement/IRA',   cats:['Large Blend','Multi-sector Bond','Int. Core Plus'],                             region:'Northeast' },
    { name:'Back Bay Advisors',        type:'Teams', adv:'Strong',   advDot:'rgb(52,211,153)',  opp:14.2, yours:3.8,  share:26.8, channel:'Advisory',         cats:['Large Growth','Foreign Lg.','EM'],                                              region:'Northeast' },
  ],
  'Philadelphia':   [
    { name:'Doe & Roe Advisors',       type:'Teams', adv:'Moderate', advDot:'rgb(250,204,21)',  opp:14.2, yours:1.6,  share:11.3, channel:'Advisory',         cats:['Large Blend','Multi-sector Bond'],                                              region:'Northeast' },
    { name:'Liberty Bell Wealth',      type:'FA',    adv:'Low',      advDot:'rgb(248,113,113)', opp:7.6,  yours:0.9,  share:11.8, channel:'Brokerage',        cats:['Large Growth','Core Plus'],                                                     region:'Northeast' },
  ],
  'Washington DC':  [
    { name:'Sample Consulting',        type:'Teams', adv:'Strong',   advDot:'rgb(52,211,153)',  opp:16.4, yours:1.7,  share:10.4, channel:'Advisory',         cats:['Large Growth','Multi-sector Bond','Private Credit'],                            region:'Mid-Atlantic' },
    { name:'Capital Hill Advisors',    type:'BA',    adv:'Low',      advDot:'rgb(248,113,113)', opp:12.0, yours:1.1,  share:9.2 , channel:'Brokerage',        cats:['Large Blend','Foreign Lg.'],                                                    region:'Mid-Atlantic' },
  ],
  'Hartford, CT':   [
    { name:'The Smith Group II',       type:'Teams', adv:'Low',      advDot:'rgb(248,113,113)', opp:9.6,  yours:3.0,  share:31.2, channel:'Insurance',        cats:['Multi-sector Bond','Core Plus','Int. Core Plus'],                               region:'Northeast' },
  ],
  'Stamford, CT':   [
    { name:'Jane Smith',               type:'FA',    adv:'Strong',   advDot:'rgb(52,211,153)',  opp:8.7,  yours:2.3,  share:26.4, channel:'Advisory',         cats:['Large Growth','Large Blend'],                                                   region:'Northeast' },
    { name:'Shoreline Family Office',  type:'Teams', adv:'Strong',   advDot:'rgb(52,211,153)',  opp:5.5,  yours:1.5,  share:27.3, channel:'Brokerage',        cats:['Private Credit','EM','Foreign Lg.'],                                            region:'Northeast' },
  ],
  'Providence, RI': [
    { name:'Ocean State Advisors',     type:'Teams', adv:'Low',      advDot:'rgb(248,113,113)', opp:6.8,  yours:0.85, share:12.5, channel:'Advisory',         cats:['Large Blend','Multi-sector Bond'],                                              region:'Northeast' },
  ],
  'Wilmington, DE': [
    { name:'Delaware Trust Co',        type:'BA',    adv:'Moderate', advDot:'rgb(250,204,21)',  opp:7.4,  yours:1.04, share:14.0, channel:'Brokerage',        cats:['Large Blend','Multi-sector Bond','Core Plus'],                                  region:'Mid-Atlantic' },
  ],
  'Albany, NY':     [
    { name:'Hudson Valley Wealth',     type:'FA',    adv:'Strong',   advDot:'rgb(52,211,153)',  opp:5.2,  yours:1.16, share:22.3, channel:'Retirement/IRA',   cats:['Large Growth','Large Blend'],                                                   region:'Northeast' },
  ],
  'Newark, NJ':     [
    { name:'The Brown Group',          type:'Teams', adv:'Moderate', advDot:'rgb(250,204,21)',  opp:12.6, yours:2.16, share:17.1, channel:'Advisory',         cats:['Large Growth','Foreign Lg.','Private Credit'],                                  region:'Northeast' },
  ],
  'Pittsburgh, PA': [
    { name:'Alpine Partners',             type:'BA',    adv:'Strong',   advDot:'rgb(52,211,153)',  opp:16.4, yours:1.41, share:8.6 , channel:'Brokerage',        cats:['Large Blend','Multi-sector Bond','Foreign Lg.'],                                region:'Mid-Atlantic' },
  ],
  'Portland, ME':   [
    { name:'Casco Bay Advisors',       type:'FA',    adv:'Strong',   advDot:'rgb(52,211,153)',  opp:4.2,  yours:1.18, share:28.0, channel:'Advisory',         cats:['Large Blend','Core Plus'],                                                      region:'Northeast' },
  ],
};

/* Format helpers for the heat map (data is now stored as numbers, not "$58.4M" strings) */
function fmtMoneyNum(n) {
  if (n >= 10) return `$${n.toFixed(1)}M`;
  return `$${n.toFixed(2)}M`;
}
function fmtShareNum(n) { return `${n.toFixed(1)}%`; }

/* Compute the channel multiplier (parallel to vehMult) — used when the user
   filters by channel. Each channel takes a fraction of territory AUM. */
const CHANNEL_MIX = { 'Brokerage': 0.40, 'Advisory': 0.35, 'Retirement/IRA': 0.18, 'Insurance': 0.07 };
function channelMultiplier(channels) {
  if (!channels || channels.length === 0) return 1;
  return channels.reduce((s, c) => s + (CHANNEL_MIX[c] || 0), 0);
}

/* Map a market share (%) to a red→amber→green color, with washes for fills.
   `bands` selects which thresholds apply — see SHARE_BANDS. */
const SHARE_BAND_SETS = {
  quartiles: [22, 15],
  fixed10:   [30, 20, 10],
  fixed5:    [25, 15, 5],
  vsTarget:  [20, 14],
};
const BAND_COLORS = [
  { stroke:'rgb(52,211,153)',  fill:'rgba(16,185,129,0.65)',  glow:'rgba(16,185,129,0.55)' },
  { stroke:'rgb(110,231,183)', fill:'rgba(16,185,129,0.42)',  glow:'rgba(16,185,129,0.38)' },
  { stroke:'rgb(250,204,21)',  fill:'rgba(234,179,8,0.62)',   glow:'rgba(234,179,8,0.50)' },
  { stroke:'rgb(248,113,113)', fill:'rgba(239,68,68,0.62)',   glow:'rgba(239,68,68,0.55)' },
];
function shareColors(sharePct, bands) {
  const th = SHARE_BAND_SETS[bands] || SHARE_BAND_SETS.quartiles;
  // 2 thresholds → green / amber / red; 3 thresholds → green / light green / amber / red
  const offset = th.length === 3 ? 0 : 0;
  for (let i = 0; i < th.length; i++) {
    if (sharePct >= th[i]) return BAND_COLORS[th.length === 3 ? i : (i === 0 ? 0 : 2)];
  }
  return BAND_COLORS[3];
}

/* Geographic rollups. City is the base grain; state and metro aggregate the
   same clients upward (opp and yours summed, share recomputed), ZIP splits each
   city into deterministic sub-points so the interaction is walkable before real
   ZIP-level data lands. */
const METRO_OF = {
  'New York, NY':'New York Metro', 'Newark, NJ':'New York Metro', 'Stamford, CT':'New York Metro',
  'Boston, MA':'Boston Metro', 'Providence, RI':'Boston Metro', 'Portland, ME':'Boston Metro',
  'Philadelphia':'Philadelphia Metro', 'Wilmington, DE':'Philadelphia Metro',
  'Washington DC':'Washington Metro', 'Baltimore, MD':'Washington Metro',
  'Hartford, CT':'Hartford Metro', 'Albany, NY':'Albany Metro', 'Pittsburgh, PA':'Pittsburgh Metro',
};
const STATE_NAMES = { NY:'New York', MA:'Massachusetts', PA:'Pennsylvania', CT:'Connecticut', RI:'Rhode Island', DE:'Delaware', NJ:'New Jersey', ME:'Maine', MD:'Maryland', DC:'Washington DC', VT:'Vermont', NH:'New Hampshire' };
function stateOf(cityName) {
  const m = String(cityName).match(/,\s*([A-Z]{2})$/);
  if (m) return STATE_NAMES[m[1]] || m[1];
  if (/Philadelphia/.test(cityName)) return 'Pennsylvania';
  if (/Washington DC/.test(cityName)) return 'Washington DC';
  return cityName;
}

function rollupGeo(aggs, geo) {
  if (!geo || geo === 'city') return aggs;
  if (geo === 'zip') {
    // Two deterministic ZIP points per city, split 62/38.
    const out = [];
    aggs.forEach((c, ci) => {
      const zips = [
        { suffix: String(10000 + ci * 137).slice(0,5), f: 0.62, dLat:  0.06, dLon:  0.07 },
        { suffix: String(10000 + ci * 137 + 41).slice(0,5), f: 0.38, dLat: -0.06, dLon: -0.07 },
      ];
      zips.forEach(z => {
        const opp = c.opp * z.f, yours = c.yours * z.f;
        out.push({
          ...c, name: `${z.suffix} · ${c.name}`,
          lat: c.lat + z.dLat, lon: c.lon + z.dLon,
          opp, yours, share: opp ? (yours / opp * 100) : 0,
        });
      });
    });
    return out;
  }
  const keyOf = geo === 'state' ? (c) => stateOf(c.name) : (c) => METRO_OF[c.name] || `${c.name} Area`;
  const groups = {};
  aggs.forEach(c => {
    const k = keyOf(c);
    if (!groups[k]) groups[k] = { name: k, opp: 0, yours: 0, wLat: 0, wLon: 0, clients: [] };
    const g = groups[k];
    g.opp += c.opp; g.yours += c.yours;
    g.wLat += c.lat * c.opp; g.wLon += c.lon * c.opp;
    g.clients = g.clients.concat(c.clients || []);
  });
  return Object.values(groups).map(g => ({
    name: g.name,
    lat: g.opp ? g.wLat / g.opp : 0,
    lon: g.opp ? g.wLon / g.opp : 0,
    opp: g.opp, yours: g.yours,
    share: g.opp ? (g.yours / g.opp * 100) : 0,
    clients: g.clients, hasData: true,
  }));
}

function TerritoryHeatMap({ vehicleFilter, height = 360, selectedCity, onCityClick,
                            channels = [], advantage = [], regions = [], catSelected = [],
                            selectedClient = null, summaryOpp = null, summaryShare = null,
                            geo = 'city', shareBands = 'quartiles' }) {
  const ref = React.useRef(null);
  const chartRef = React.useRef(null);
  const onCityClickRef = React.useRef(onCityClick);
  React.useEffect(() => { onCityClickRef.current = onCityClick; }, [onCityClick]);
  const [topology, setTopology] = React.useState(null);

  // Build per-city aggregates from the filtered client list. share = yours/opp
  // computed from the filtered client subset (not raw city share).
  const filterDeps = [vehicleFilter, channels, advantage, regions, catSelected, selectedClient, geo];
  const cityAggregates = React.useMemo(() => {
    const base = TERRITORY_CITIES.map(cityMeta => {
      const filtered = filterCityClients(cityMeta.name, {
        vehicleFilter, channels, advantage, regions, catSelected, selectedClient,
      });
      const opp   = filtered.reduce((s, c) => s + c.opp,   0);
      const yours = filtered.reduce((s, c) => s + c.yours, 0);
      const share = opp ? (yours / opp * 100) : 0;
      return { ...cityMeta, clients: filtered, opp, yours, share, hasData: filtered.length > 0 && opp > 0 };
    }).filter(c => c.hasData);
    return rollupGeo(base, geo);
  // eslint-disable-next-line
  }, filterDeps);

  const totalOpp   = cityAggregates.reduce((a,c) => a + c.opp,   0);
  const totalYours = cityAggregates.reduce((a,c) => a + c.yours, 0);
  const overallShare = totalOpp ? (totalYours / totalOpp * 100) : 0;

  // The tile summary mirrors the dashboard's AUM header KPI when those values
  // are supplied (so the two always agree and move together on selection);
  // otherwise it falls back to the map's own city-derived totals.
  const summaryOppText   = summaryOpp != null ? summaryOpp : `$${totalOpp.toFixed(1)}M`;
  const summaryShareText = summaryShare != null ? summaryShare : `${overallShare.toFixed(1)}%`;
  const summaryShareNum  = summaryShare != null ? (parseFloat(summaryShare) || 0) : overallShare;

  // Load US topology once (cached on window). The CDN serves TopoJSON which
  // Highcharts Maps consumes directly.
  React.useEffect(() => {
    if (window.__usTopology) { setTopology(window.__usTopology); return; }
    let cancelled = false;
    fetch('https://code.highcharts.com/mapdata/countries/us/us-all.topo.json')
      .then(r => r.json())
      .then(t => { if (!cancelled) { window.__usTopology = t; setTopology(t); } })
      .catch(e => console.error('Map data load failed', e));
    return () => { cancelled = true; };
  }, []);

  // Build per-city bubble points from the current aggregates + selection.
  // Pure function so the create-once effect and the in-place update effect
  // produce identical shapes.
  const buildBubbleData = React.useCallback((aggs, selCity) => aggs.map(c => {
    const col = shareColors(c.share, shareBands);
    const isSel = selCity === c.name;
    return {
      name: c.name,
      lat: c.lat, lon: c.lon,
      z: c.opp, share: c.share, yours: c.yours, opp: c.opp,
      color: col.fill,
      marker: { lineColor: isSel ? '#fff' : col.stroke, lineWidth: isSel ? 3 : 1.5 },
      selected: isSel,
    };
  }), [shareBands]);

  // ---- Create the chart ONCE when topology is ready. Subsequent prop changes
  // (selectedCity, filters) update series data in place — no destroy/recreate,
  // so the user's pan/zoom is naturally preserved.
  React.useEffect(() => {
    if (!topology || !ref.current || typeof Highcharts === 'undefined' || !Highcharts.mapChart) return;
    if (chartRef.current) return; // already built

    const NE_KEYS = ['us-me','us-nh','us-vt','us-ma','us-ct','us-ri','us-ny','us-nj','us-pa','us-md','us-de','us-dc'];
    const initialBubbles = buildBubbleData(cityAggregates, selectedCity);
    const initialLabels  = cityAggregates.map(c => ({ name: c.name, lat: c.lat, lon: c.lon }));

    chartRef.current = Highcharts.mapChart(ref.current, {
      chart: {
        map: topology,
        backgroundColor: 'transparent',
        height,
        margin: [4, 4, 4, 4],
        spacing: [0, 0, 0, 0],
        animation: false,
      },
      title:   { text: '' },
      credits: { enabled: false },
      legend:  { enabled: false },
      mapNavigation: {
        enabled: true,
        enableMouseWheelZoom: true,
        enableDoubleClickZoom: true,
        enableDoubleClickZoomTo: true,
        enableTouchZoom: true,
        buttonOptions: {
          alignTo: 'spacingBox',
          align: 'left',
          verticalAlign: 'top',
          x: 10,
          y: 10,
          theme: {
            fill: 'rgba(13,20,32,0.78)',
            stroke: 'rgba(75,85,99,0.55)',
            'stroke-width': 1,
            r: 6,
            style: { color: 'rgb(229,231,235)', fontFamily: 'Inter', fontSize: '13px', fontWeight: '600' },
            states: {
              hover:  { fill: 'rgba(96,165,250,0.18)', style: { color: 'rgb(147,197,253)' } },
              select: { fill: 'rgba(96,165,250,0.28)', style: { color: 'rgb(147,197,253)' } },
            },
          },
        },
      },
      mapView: {
        // Initial frame on the NE corridor — Maine to DC. After this, the user
        // controls pan/zoom; subsequent data updates do NOT touch mapView.
        fitToGeometry: {
          type: 'MultiPoint',
          coordinates: [
            [-69.0, 47.0], // northern Maine
            [-77.5, 38.5], // DC / southern MD
            [-80.5, 39.5], // western PA
            [-69.0, 41.5], // Cape Cod / Atlantic
          ],
        },
      },
      tooltip: {
        useHTML: true,
        // Only fire over the bubble itself — not anywhere inside the plot area.
        snap: 0,
        followPointer: false,
        backgroundColor: 'rgba(13,20,32,0.96)',
        borderColor: 'rgba(75,85,99,0.55)',
        borderRadius: 8,
        shadow: false,
        padding: 10,
        hideDelay: 60,
        style: { color: '#fff', fontFamily: 'Inter', fontSize: '11px' },
        formatter: function() {
          if (this.point && this.point.share != null) {
            const col = shareColors(this.point.share, shareBands);
            return '<div style="padding:2px 2px;min-width:180px;">' +
              '<div style="font-size:12px;font-weight:700;color:#fff;margin-bottom:6px;">' + this.point.name + '</div>' +
              '<div style="display:grid;grid-template-columns:auto auto;gap:2px 14px;font-size:11px;">' +
                '<span style="color:rgb(107,114,128);">Mkt AUM Opp</span><span style="text-align:right;color:#fff;font-weight:600;">$' + this.point.opp.toFixed(1) + 'M</span>' +
                '<span style="color:rgb(107,114,128);">Your AUM</span><span style="text-align:right;color:rgb(52,211,153);font-weight:600;">$' + this.point.yours.toFixed(2) + 'M</span>' +
                '<span style="color:rgb(107,114,128);">Mkt Share</span><span style="text-align:right;color:' + col.stroke + ';font-weight:700;">' + this.point.share.toFixed(1) + '%</span>' +
              '</div>' +
            '</div>';
          }
          return false;
        },
      },
      plotOptions: {
        mapbubble: {
          minSize: 16,
          maxSize: 58,
          opacity: 0.78,
          stickyTracking: false,
          animation: { duration: 350 },
          cursor: 'pointer',
          states: { hover: { opacity: 1, lineWidthPlus: 2 }, select: { opacity: 1 } },
          allowPointSelect: true,
          point: {
            events: {
              click: function() {
                if (onCityClickRef.current) onCityClickRef.current(this.name);
              },
            },
          },
          dataLabels: {
            enabled: true,
            allowOverlap: false,
            formatter: function() { return this.point.share.toFixed(1) + '%'; },
            style: {
              color: '#fff',
              fontFamily: 'Inter',
              fontSize: '11.5px',
              fontWeight: '700',
              textOutline: '1.5px rgba(0,0,0,0.45)',
            },
          },
        },
      },
      series: [
        {
          // Base layer: NE state shapes only
          name: 'States',
          mapData: topology,
          data: NE_KEYS.map(k => ({ 'hc-key': k, value: 1 })),
          joinBy: 'hc-key',
          allAreas: false,
          color: 'rgba(96,120,160,0.10)',
          borderColor: 'rgba(140,160,190,0.65)',
          borderWidth: 0.8,
          enableMouseTracking: false,
          states: { hover: { enabled: false } },
        },
        {
          // City name labels — invisible point series whose data labels appear
          // beneath each bubble.
          type: 'mappoint',
          name: 'CityLabels',
          enableMouseTracking: false,
          marker: { enabled: false },
          dataLabels: {
            enabled: true,
            allowOverlap: false,
            y: 26,
            style: {
              color: 'rgb(229,231,235)',
              fontFamily: 'Inter',
              fontSize: '10.5px',
              fontWeight: '600',
              textOutline: '3px rgba(11,21,36,0.85)',
            },
            formatter: function() { return this.point.name.split(',')[0]; },
          },
          data: initialLabels,
        },
        {
          // The actual bubbles
          type: 'mapbubble',
          name: 'Cities',
          data: initialBubbles,
        },
      ],
    });

    return () => {
      try { chartRef.current && chartRef.current.destroy(); } catch(e){}
      chartRef.current = null;
    };
  }, [topology, height, buildBubbleData]);

  // ---- Update bubble + label data in place when aggregates or selection change.
  // No destroy/recreate — pan/zoom stays put.
  React.useEffect(() => {
    const ch = chartRef.current;
    if (!ch || !ch.series || ch.series.length < 3) return;
    try {
      const labelData = cityAggregates.map(c => ({ name: c.name, lat: c.lat, lon: c.lon }));
      const bubbleData = buildBubbleData(cityAggregates, selectedCity);
      ch.series[1].setData(labelData, false, false, false);
      ch.series[2].setData(bubbleData,  true,  false, false);
    } catch(e){}
  }, [cityAggregates, selectedCity, buildBubbleData]);

  // ResizeObserver to reflow the chart on width changes
  React.useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(() => {
      try { chartRef.current && chartRef.current.reflow(); } catch(e){}
    });
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  return (
    <div style={{ position:'relative', width:'100%', height, borderRadius: 8, overflow:'hidden',
        background:'radial-gradient(ellipse 60% 70% at 50% 40%, rgba(28,42,66,0.55) 0%, rgba(11,21,36,0.0) 70%)' }}>
      {/* Subtle grid + dot pattern that sits BEHIND the Highcharts SVG */}
      <svg width="100%" height="100%" style={{ position:'absolute', inset:0, pointerEvents:'none' }}>
        <defs>
          <pattern id="hm-grid" width="36" height="36" patternUnits="userSpaceOnUse">
            <path d="M 36 0 L 0 0 0 36" fill="none" stroke="rgba(75,85,99,0.22)" strokeWidth="0.5" />
          </pattern>
          <pattern id="hm-dots" width="14" height="14" patternUnits="userSpaceOnUse">
            <circle cx="7" cy="7" r="0.6" fill="rgba(140,160,190,0.22)" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hm-grid)" />
        <rect width="100%" height="100%" fill="url(#hm-dots)" />
      </svg>
      <div ref={ref} style={{ width:'100%', height:'100%', position:'relative', zIndex:1 }} />

      {/* Top-right summary */}
      <div style={{
        position:'absolute', right:14, top:12, zIndex:2,
        padding:'10px 14px',
        background:'rgba(13,20,32,0.78)',
        border:'1px solid rgba(75,85,99,0.4)', borderRadius:8,
        backdropFilter:'blur(6px)',
        display:'flex', gap:18,
      }}>
        <div>
          <div style={{ fontFamily:'Inter', fontSize:9.5, fontWeight:600, color:'rgb(107,114,128)', textTransform:'uppercase', letterSpacing:0.5 }}>Mkt Opp</div>
          <div style={{ fontFamily:'Inter Display, Inter', fontSize:16, fontWeight:700, color:'rgb(249,250,251)', marginTop:2, fontVariantNumeric:'tabular-nums' }}>{summaryOppText}</div>
        </div>
        <div style={{ width:1, background:'rgba(75,85,99,0.4)' }} />
        <div>
          <div style={{ fontFamily:'Inter', fontSize:9.5, fontWeight:600, color:'rgb(107,114,128)', textTransform:'uppercase', letterSpacing:0.5 }}>Mkt Share</div>
          <div style={{ fontFamily:'Inter Display, Inter', fontSize:16, fontWeight:700, color: shareColors(summaryShareNum, shareBands).stroke, marginTop:2, fontVariantNumeric:'tabular-nums' }}>{summaryShareText}</div>
        </div>
      </div>

      {/* Bottom-left: bubble size legend */}
      <div style={{
        position:'absolute', left:14, bottom:12, zIndex:2,
        display:'flex', alignItems:'flex-end', gap:14,
        padding:'8px 12px',
        background:'rgba(13,20,32,0.78)',
        border:'1px solid rgba(75,85,99,0.4)', borderRadius:8,
        backdropFilter:'blur(6px)',
      }}>
        <div>
          <div style={{ fontFamily:'Inter', fontSize:9.5, fontWeight:600, color:'rgb(107,114,128)', textTransform:'uppercase', letterSpacing:0.5, marginBottom:4 }}>Bubble = Mkt Opp $</div>
          <div style={{ display:'flex', alignItems:'flex-end', gap:10 }}>
            {[8, 14, 22].map((r,i) => (
              <div key={i} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
                <div style={{ width:r*2, height:r*2, borderRadius:'50%', background:'rgba(125,150,180,0.18)', border:'1px solid rgba(125,150,180,0.55)' }} />
                <span style={{ fontFamily:'Inter', fontSize:9, color:'rgb(163,163,163)', fontVariantNumeric:'tabular-nums' }}>{['$5M','$20M','$60M'][i]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom-right: share color legend */}
      <div style={{
        position:'absolute', right:14, bottom:12, zIndex:2,
        padding:'8px 12px',
        background:'rgba(13,20,32,0.78)',
        border:'1px solid rgba(75,85,99,0.4)', borderRadius:8,
        backdropFilter:'blur(6px)',
      }}>
        <div style={{ fontFamily:'Inter', fontSize:9.5, fontWeight:600, color:'rgb(107,114,128)', textTransform:'uppercase', letterSpacing:0.5, marginBottom:6 }}>Color = Mkt Share</div>
        <div style={{ display:'flex', alignItems:'center', gap:10, fontFamily:'Inter', fontSize:10 }}>
          <span style={{ display:'inline-flex', alignItems:'center', gap:5, color:'rgb(248,113,113)' }}>
            <span style={{ width:10, height:10, borderRadius:9999, background:'rgba(239,68,68,0.7)', border:'1px solid rgb(248,113,113)' }} /> &lt;15%
          </span>
          <span style={{ display:'inline-flex', alignItems:'center', gap:5, color:'rgb(250,204,21)' }}>
            <span style={{ width:10, height:10, borderRadius:9999, background:'rgba(234,179,8,0.7)', border:'1px solid rgb(250,204,21)' }} /> 15–22%
          </span>
          <span style={{ display:'inline-flex', alignItems:'center', gap:5, color:'rgb(52,211,153)' }}>
            <span style={{ width:10, height:10, borderRadius:9999, background:'rgba(16,185,129,0.7)', border:'1px solid rgb(52,211,153)' }} /> ≥22%
          </span>
        </div>
      </div>

      {/* Loading state */}
      {!topology && (
        <div style={{
          position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center',
          fontFamily:'Inter', fontSize:12, color:'rgb(163,163,163)',
        }}>
          <i className="fa-solid fa-spinner fa-spin" style={{ marginRight:8 }} />Loading map…
        </div>
      )}
    </div>
  );
}

/* ---------- Client list panel — sits next to the heat map ---------- */
function TerritoryClientList({ city, clients, onSelectClient, height = 460 }) {
  const all = city ? clients : null;
  return (
    <div style={{
      width:'100%', height, display:'flex', flexDirection:'column',
      background:'rgba(255,255,255,0.02)',
      border:'1px solid rgba(75,85,99,0.3)',
      borderRadius:10, overflow:'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding:'12px 14px', borderBottom:'1px solid rgba(75,85,99,0.3)',
        display:'flex', alignItems:'center', justifyContent:'space-between', gap:10,
      }}>
        <div style={{ minWidth:0 }}>
          <div style={{ fontFamily:'Inter', fontSize:9.5, fontWeight:600, color:'rgb(107,114,128)', textTransform:'uppercase', letterSpacing:0.5 }}>
            {city ? 'Clients in' : 'Select a city'}
          </div>
          <div style={{
            fontFamily:'Inter Display, Inter', fontSize:14, fontWeight:700, color: city ? 'rgb(249,250,251)' : 'rgb(163,163,163)',
            marginTop:2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
          }}>{city || 'Click any bubble'}</div>
        </div>
        {city && (
          <span style={{
            display:'inline-flex', alignItems:'center', justifyContent:'center',
            minWidth:24, height:20, padding:'0 7px', borderRadius:9999,
            background:'rgba(96,165,250,0.18)', border:'1px solid rgba(96,165,250,0.5)',
            color:'rgb(147,197,253)', fontFamily:'Inter', fontSize:10, fontWeight:700,
            flexShrink:0,
          }}>{all ? all.length : 0}</span>
        )}
      </div>

      {/* Body */}
      <div style={{ flex:1, overflow:'auto' }}>
        {!city && (
          <div style={{
            height:'100%', display:'flex', flexDirection:'column',
            alignItems:'center', justifyContent:'center', gap:8,
            padding:24, textAlign:'center',
          }}>
            <div style={{
              width:46, height:46, borderRadius:'50%',
              background:'rgba(96,165,250,0.10)', border:'1px solid rgba(96,165,250,0.3)',
              display:'flex', alignItems:'center', justifyContent:'center',
              color:'rgb(147,197,253)',
            }}>
              <i className="fa-solid fa-location-dot" style={{ fontSize:18 }} />
            </div>
            <div style={{ fontFamily:'Inter', fontSize:12, color:'rgb(209,213,219)', fontWeight:500 }}>
              Click a city bubble
            </div>
            <div style={{ fontFamily:'Inter', fontSize:11, color:'rgb(107,114,128)', lineHeight:1.5, maxWidth:240 }}>
              See territory clients headquartered there with their AUM, market share, and competitive advantage.
            </div>
          </div>
        )}

        {city && all && all.length === 0 && (
          <div style={{ padding:'40px 20px', textAlign:'center', fontFamily:'Inter', fontSize:11, color:'rgb(107,114,128)' }}>
            No territory clients in {city}.
          </div>
        )}

        {city && all && all.map((c, i) => (
          <button
            key={i}
            onClick={() => onSelectClient && onSelectClient(c)}
            style={{
              width:'100%', display:'flex', flexDirection:'column', gap:4,
              padding:'10px 14px',
              background:'transparent', border:'none',
              borderBottom:'1px solid rgba(75,85,99,0.18)',
              textAlign:'left', cursor:'pointer',
              transition:'background .12s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(96,165,250,0.06)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <div style={{ display:'flex', alignItems:'center', gap:8, minWidth:0 }}>
              <span title={`Competitive Advantage: ${c.adv}`} style={{
                width:10, height:10, borderRadius:9999, background:c.advDot, flexShrink:0,
                boxShadow:'0 0 0 1px rgba(0,0,0,0.4)',
              }} />
              <span style={{
                width:30, height:14, borderRadius:3, background:'rgba(255,255,255,0.08)',
                display:'inline-flex', alignItems:'center', justifyContent:'center',
                fontSize:8.5, fontWeight:600, color:'rgb(163,163,163)', letterSpacing:0.3, flexShrink:0,
              }}>{c.type}</span>
              <span style={{
                flex:1, minWidth:0, fontFamily:'Inter', fontSize:12, fontWeight:600,
                color:'rgb(229,231,235)',
                whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
              }}>{c.name}</span>
              <i className="fa-solid fa-chevron-right" style={{ fontSize:9, color:'rgb(107,114,128)', flexShrink:0 }} />
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6, paddingLeft:24 }}>
              <Metric label="Mkt Opp" value={fmtMoneyNum(c.opp)} />
              <Metric label="Yours" value={fmtMoneyNum(c.yours)} accent />
              <Metric label="Mkt Share" value={fmtShareNum(c.share)} />
            </div>
          </button>
        ))}
      </div>

      {/* Footer summary */}
      {city && all && all.length > 0 && (
        <div style={{
          padding:'10px 14px', borderTop:'1px solid rgba(75,85,99,0.3)',
          fontFamily:'Inter', fontSize:11, color:'rgb(163,163,163)',
          background:'rgba(0,0,0,0.18)',
          display:'flex', justifyContent:'space-between',
        }}>
          <span>{all.length} {all.length === 1 ? 'client' : 'clients'}</span>
          <button style={{
            background:'transparent', border:'none',
            color:'rgb(147,197,253)', fontFamily:'Inter', fontSize:11, fontWeight:600, cursor:'pointer',
            padding:0,
          }}>
            View all <i className="fa-solid fa-arrow-right" style={{ fontSize:9, marginLeft:3 }} />
          </button>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, accent }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:1 }}>
      <span style={{ fontFamily:'Inter', fontSize:8.5, color:'rgb(107,114,128)', textTransform:'uppercase', letterSpacing:0.4 }}>{label}</span>
      <span style={{
        fontFamily:'Inter', fontSize:11, fontWeight:600,
        color: accent ? 'rgb(52,211,153)' : 'rgb(209,213,219)',
        fontVariantNumeric:'tabular-nums',
      }}>{value}</span>
    </div>
  );
}

/* ---------- Tile customize gear + popover ----------
   Generic; pass `config` ({chartType, dimension, measure}) plus an onChange.
   Each option list is the menu of swappable values for that field.
*/
function TileCustomize({ config, onChange, options, anchor = 'right' }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);

  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const set = (key, val) => onChange && onChange({ ...config, [key]: val });

  return (
    <div ref={ref} style={{ position:'relative', display:'inline-flex' }}>
      <button
        onClick={() => setOpen(o => !o)}
        title="Customize tile"
        style={{
          width:24, height:24, borderRadius:6,
          background: open ? 'rgba(96,165,250,0.18)' : 'rgba(255,255,255,0.03)',
          border: `1px solid ${open ? 'rgba(96,165,250,0.5)' : 'rgba(75,85,99,0.5)'}`,
          color: open ? 'rgb(147,197,253)' : 'rgb(163,163,163)',
          cursor:'pointer',
          display:'inline-flex', alignItems:'center', justifyContent:'center',
          transition:'all .12s',
        }}
        onMouseEnter={(e) => { if (!open) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; }}
        onMouseLeave={(e) => { if (!open) e.currentTarget.style.borderColor = 'rgba(75,85,99,0.5)'; }}
      >
        <i className="fa-solid fa-sliders" style={{ fontSize:10 }} />
      </button>

      {open && (
        <div style={{
          position:'absolute',
          top: 30,
          [anchor]: 0,
          width: 248,
          background:'rgb(15,23,38)',
          border:'1px solid rgba(75,85,99,0.55)',
          borderRadius:10,
          boxShadow:'0 20px 50px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.02) inset',
          zIndex: 50,
          padding: 12,
          animation:'tcPop .15s ease-out forwards',
        }}>
          <style>{`@keyframes tcPop { from { opacity:0; transform: translateY(-4px); } to { opacity:1; transform:none; } }`}</style>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
            <span style={{ fontFamily:'Inter', fontSize:11, fontWeight:700, color:'rgb(229,231,235)', letterSpacing:0.3, textTransform:'uppercase' }}>Customize</span>
            <button onClick={() => setOpen(false)} style={{
              width:18, height:18, borderRadius:4, border:'none', background:'transparent',
              color:'rgb(107,114,128)', cursor:'pointer', display:'inline-flex', alignItems:'center', justifyContent:'center',
            }}><i className="fa-solid fa-xmark" style={{ fontSize:11 }} /></button>
          </div>

          {options.geo && (
            <TCSection label="Geographic level">
              <TCSelect value={config.geo} options={options.geo} onChange={(v) => set('geo', v)} />
            </TCSection>
          )}

          {options.shareBands && (
            <TCSection label="Mkt Share colour bands">
              <TCSelect value={config.shareBands} options={options.shareBands} onChange={(v) => set('shareBands', v)} />
            </TCSection>
          )}

          {options.chartType && (
            <TCSection label="Chart Type">
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:4 }}>
                {options.chartType.map(opt => (
                  <TCIconButton key={opt.value} icon={opt.icon} label={opt.label}
                    active={config.chartType === opt.value}
                    onClick={() => set('chartType', opt.value)} />
                ))}
              </div>
            </TCSection>
          )}

          {options.dimension && (
            <TCSection label="Dimension (X-axis)">
              <TCSelect value={config.dimension} options={options.dimension} onChange={(v) => set('dimension', v)} />
            </TCSection>
          )}

          {options.measure && (
            <TCSection label="Measure (Y-axis)">
              <TCSelect value={config.measure} options={options.measure} onChange={(v) => set('measure', v)} />
            </TCSection>
          )}

          {options.compare && (
            <TCSection label="Compare vs">
              <TCSelect value={config.compare} options={options.compare} onChange={(v) => set('compare', v)} />
            </TCSection>
          )}

          <div style={{ display:'flex', gap:6, marginTop:12, paddingTop:10, borderTop:'1px solid rgba(75,85,99,0.3)' }}>
            <button onClick={() => onChange && onChange(options.defaults || config)} style={{
              flex:1, height:28, borderRadius:6,
              border:'1px solid rgba(75,85,99,0.5)', background:'transparent',
              color:'rgb(209,213,219)', fontFamily:'Inter', fontSize:11, fontWeight:500, cursor:'pointer',
            }}>Reset</button>
            <button onClick={() => setOpen(false)} style={{
              flex:1, height:28, borderRadius:6,
              border:'1px solid rgb(96,165,250)', background:'rgba(59,130,246,0.18)',
              color:'rgb(147,197,253)', fontFamily:'Inter', fontSize:11, fontWeight:600, cursor:'pointer',
            }}>Done</button>
          </div>
        </div>
      )}
    </div>
  );
}

function TCSection({ label, children }) {
  return (
    <div style={{ marginBottom:10 }}>
      <div style={{ fontFamily:'Inter', fontSize:9.5, fontWeight:600, color:'rgb(107,114,128)', textTransform:'uppercase', letterSpacing:0.5, marginBottom:5 }}>{label}</div>
      {children}
    </div>
  );
}

function TCIconButton({ icon, label, active, onClick }) {
  const [hover, setHover] = React.useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      title={label}
      style={{
        height:42, borderRadius:6,
        background: active ? 'rgba(96,165,250,0.18)' : (hover ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)'),
        border: `1px solid ${active ? 'rgb(96,165,250)' : 'rgba(75,85,99,0.4)'}`,
        color: active ? 'rgb(147,197,253)' : 'rgb(209,213,219)',
        cursor:'pointer',
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:2,
        fontFamily:'Inter',
        transition:'all .12s',
      }}>
      <i className={`fa-solid ${icon}`} style={{ fontSize:13 }} />
      <span style={{ fontSize:8.5, fontWeight:600, letterSpacing:0.3 }}>{label}</span>
    </button>
  );
}

/* ---------- Category alternative views ---------- */

function CategoryBar({ selectedClient, activeCats, metric = 'AUM', vehicleFilter, onToggle }) {
  const valueField = metric === 'Inflow' ? 'iOpp' : 'opp';
  const yoursField = metric === 'Inflow' ? 'iYours' : 'yours';
  const vehMult = (() => {
    const VEH_MIX = { MF: 0.40, ETF: 0.30, SMA: 0.20, Privates: 0.10 };
    if (!vehicleFilter || vehicleFilter.length === 0) return 1;
    return vehicleFilter.reduce((s, v) => s + (VEH_MIX[v] || 0), 0);
  })();
  const scale = (selectedClient ? 0.35 : 1) * vehMult;

  const CATS = (typeof window !== 'undefined' && window.ALL_CATS) || [];
  const rows = CATS
    .filter(c => activeCats.has(c.name))
    .map(c => {
      const oppNum = parseFloat(c[valueField].replace(/[^0-9.]/g,'')) * scale;
      const yrsNum = parseFloat(c[yoursField].replace(/[^0-9.]/g,'')) * scale;
      return { ...c, oppNum, yrsNum };
    })
    .sort((a,b) => b.oppNum - a.oppNum);
  const maxOpp = Math.max(...rows.map(r => r.oppNum), 1);
  const fmt = (v) => v >= 10 ? `$${v.toFixed(1)}M` : `$${v.toFixed(2)}M`;

  return (
    <div style={{ flex:1, minHeight:220, display:'flex', flexDirection:'column', gap:6, padding:'4px 4px 0', overflow:'auto' }}>
      {rows.map((r,i) => {
        const oppPct = (r.oppNum / maxOpp) * 100;
        const yoursPct = (r.yrsNum / maxOpp) * 100;
        return (
          <div key={i} onClick={() => onToggle && onToggle(r.name)}
            style={{ display:'grid', gridTemplateColumns:'160px 1fr 84px', alignItems:'center', gap:10, cursor:'pointer', padding:'4px 4px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:6, fontFamily:'Inter', fontSize:11.5, color:'rgb(229,231,235)', minWidth:0 }}>
              <span style={{ width:7, height:7, borderRadius:9999, background:r.c, flexShrink:0 }} />
              <span style={{ whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', fontWeight:500 }}>{r.name}</span>
              {r.recommended && (
                <span title="Rec list" style={{
                  flexShrink:0, display:'inline-flex', alignItems:'center', justifyContent:'center',
                  width:13, height:13, borderRadius:9999, background:'rgba(52,211,153,0.18)', border:'1px solid rgb(52,211,153)',
                  color:'rgb(52,211,153)',
                }}>
                  <i className="fa-solid fa-star" style={{ fontSize:6 }} />
                </span>
              )}
            </div>
            <div style={{ position:'relative', height:18 }}>
              <div style={{
                position:'absolute', left:0, top:0, bottom:0,
                width: `${oppPct}%`,
                background: `linear-gradient(90deg, ${r.fillA}33, ${r.fillB}33)`,
                border:`1px solid ${r.fillA}55`,
                borderRadius: 3,
              }} />
              <div style={{
                position:'absolute', left:0, top:0, bottom:0,
                width: `${yoursPct}%`,
                background: `linear-gradient(135deg, ${r.fillA}, ${r.fillB})`,
                borderRadius: 3,
                display:'flex', alignItems:'center', justifyContent:'flex-end', padding:'0 6px',
              }}>
                <span style={{ fontFamily:'Inter', fontSize:10, fontWeight:700, color:'#fff', textShadow:'0 1px 2px rgba(0,0,0,0.35)', fontVariantNumeric:'tabular-nums' }}>
                  {fmt(r.yrsNum)}
                </span>
              </div>
              <div style={{
                position:'absolute', left:`${oppPct}%`, top:-2, bottom:-2,
                width:1.5, background:'rgba(255,255,255,0.55)',
                transform:'translateX(-50%)',
              }} />
            </div>
            <div style={{ textAlign:'right', fontFamily:'Inter', fontSize:11, color:'rgb(163,163,163)', fontVariantNumeric:'tabular-nums' }}>
              <div>{fmt(r.oppNum)}</div>
              <div style={{ fontSize:9.5, color:'rgb(107,114,128)' }}>opp · {((r.yrsNum/r.oppNum)*100).toFixed(1)}%</div>
            </div>
          </div>
        );
      })}
      {rows.length === 0 && (
        <div style={{ textAlign:'center', padding:'40px 0', fontFamily:'Inter', fontSize:11, color:'rgb(107,114,128)' }}>No categories selected</div>
      )}
      <div style={{ marginTop:'auto', paddingTop:8, borderTop:'1px solid rgba(75,85,99,0.2)', display:'flex', gap:14, justifyContent:'center', fontFamily:'Inter', fontSize:10, color:'rgb(163,163,163)' }}>
        <span style={{ display:'inline-flex', alignItems:'center', gap:5 }}>
          <span style={{ width:14, height:8, borderRadius:2, background:'rgba(96,165,250,0.25)', border:'1px solid rgba(96,165,250,0.5)' }} /> Opportunity
        </span>
        <span style={{ display:'inline-flex', alignItems:'center', gap:5 }}>
          <span style={{ width:14, height:8, borderRadius:2, background:'linear-gradient(135deg, rgb(96,165,250), rgb(29,78,216))' }} /> Yours
        </span>
        <span style={{ display:'inline-flex', alignItems:'center', gap:5 }}>
          <span style={{ width:1.5, height:12, background:'rgba(255,255,255,0.6)' }} /> Opp end
        </span>
      </div>
    </div>
  );
}

function CategoryDonut({ selectedClient, activeCats, metric = 'AUM', vehicleFilter, onToggle }) {
  const valueField = metric === 'Inflow' ? 'iOpp' : 'opp';
  const yoursField = metric === 'Inflow' ? 'iYours' : 'yours';
  const wrapRef = React.useRef(null);
  const [h, setH] = React.useState(280);
  React.useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver(entries => {
      for (const e of entries) setH(Math.max(220, Math.floor(e.contentRect.height)));
    });
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  const vehMult = (() => {
    const VEH_MIX = { MF: 0.40, ETF: 0.30, SMA: 0.20, Privates: 0.10 };
    if (!vehicleFilter || vehicleFilter.length === 0) return 1;
    return vehicleFilter.reduce((s, v) => s + (VEH_MIX[v] || 0), 0);
  })();
  const scale = (selectedClient ? 0.35 : 1) * vehMult;

  const CATS = (typeof window !== 'undefined' && window.ALL_CATS) || [];
  const rows = CATS.filter(c => activeCats.has(c.name)).map(c => {
    const oppNum = parseFloat(c[valueField].replace(/[^0-9.]/g,'')) * scale;
    const yrsNum = parseFloat(c[yoursField].replace(/[^0-9.]/g,'')) * scale;
    return { name: c.name, y: oppNum, yours: yrsNum, color: c.fillA };
  });
  const total = rows.reduce((a, r) => a + r.y, 0);
  const yoursTotal = rows.reduce((a, r) => a + r.yours, 0);

  const opts = React.useMemo(() => ({
    chart: { type: 'pie', height: h, backgroundColor: 'transparent', animation: { duration: 350 } },
    title: { text: '' },
    legend: { enabled: false },
    tooltip: {
      pointFormatter: function() {
        const pct = (this.y / total * 100).toFixed(1);
        return `<b>$${this.y.toFixed(1)}M</b> · ${pct}% of opp<br/><span style="color:rgb(52,211,153)">Yours: $${this.yours.toFixed(2)}M</span>`;
      },
    },
    plotOptions: {
      pie: {
        innerSize: '62%',
        borderColor: 'rgba(11,21,36,0.9)',
        borderWidth: 2,
        dataLabels: {
          enabled: true,
          format: '{point.name}<br/><b>${point.y:.1f}M</b>',
          style: { fontFamily: 'Inter', fontSize: '10.5px', color: 'rgb(229,231,235)', textOutline: 'none', fontWeight: '500' },
          distance: 14,
          connectorColor: 'rgba(163,163,163,0.4)',
        },
        cursor: 'pointer',
        point: {
          events: { click: function() { onToggle && onToggle(this.name); } },
        },
      },
    },
    series: [{ name: 'Opportunity', data: rows }],
    credits: { enabled: false },
  }), [rows, h, total, onToggle]);

  return (
    <div ref={wrapRef} style={{ flex:1, minHeight:220, position:'relative' }}>
      <HC options={opts} />
      <div style={{
        position:'absolute', left:0, right:0, top:0, bottom:0,
        display:'flex', alignItems:'center', justifyContent:'center',
        pointerEvents:'none',
      }}>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontFamily:'Inter', fontSize:10, color:'rgb(107,114,128)', textTransform:'uppercase', letterSpacing:0.5 }}>Total {metric}</div>
          <div style={{ fontFamily:'Inter Display, Inter', fontSize:22, fontWeight:700, color:'rgb(249,250,251)', fontVariantNumeric:'tabular-nums', marginTop:2 }}>${total.toFixed(1)}M</div>
          <div style={{ fontFamily:'Inter', fontSize:11, color:'rgb(52,211,153)', fontVariantNumeric:'tabular-nums', marginTop:2, fontWeight:600 }}>Yours: ${yoursTotal.toFixed(2)}M · {total ? (yoursTotal/total*100).toFixed(1) : 0}%</div>
        </div>
      </div>
    </div>
  );
}

function TCSelect({ value, options, onChange }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      style={{
        width:'100%', height:28, padding:'0 8px',
        borderRadius:6, border:'1px solid rgba(75,85,99,0.55)',
        background:'rgba(255,255,255,0.02)', color:'rgb(229,231,235)',
        fontFamily:'Inter', fontSize:12, cursor:'pointer',
        appearance:'none',
        backgroundImage:'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'10\' height=\'6\' viewBox=\'0 0 10 6\'><path d=\'M1 1l4 4 4-4\' stroke=\'%23a3a3a3\' stroke-width=\'1.5\' fill=\'none\'/></svg>")',
        backgroundRepeat:'no-repeat',
        backgroundPosition:'right 10px center',
        paddingRight: 28,
      }}>
      {options.map(o => (
        <option key={o.value} value={o.value} style={{ background:'rgb(15,23,38)' }}>{o.label}</option>
      ))}
    </select>
  );
}

Object.assign(window, { TerritoryHeatMap, TerritoryClientList, CITY_CLIENTS, filterCityClients, TileCustomize, CategoryBar, CategoryDonut });
