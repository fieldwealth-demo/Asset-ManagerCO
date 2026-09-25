/* Opportunity Dashboard */

/* Per-client category usage (which categories each client actually holds) */
const CLIENT_CAT_USAGE = {
  'The Doe Wealth Group': ['Large Growth','Multi-sector Bond','Large Blend','Int. Core Plus','Private Credit','Foreign Lg.','EM'],
  'The Smith Group':      ['Large Growth','Large Blend','Multi-sector Bond','Private Credit'],
  'Jane Smith':   ['Large Blend','Core Plus','Int. Core Plus','EM'],
  'Doe & Roe Advisors':     ['Large Growth','Multi-sector Bond','Foreign Lg.'],
  'Sample Consulting': ['Large Blend','Large Growth','Core Plus','Int. Core Plus'],
  'The Smith Group II':   ['Large Growth','Private Credit','Multi-sector Bond'],
  'Alpine Partners':      ['Large Blend','Large Growth','Int. Core Plus','EM','Foreign Lg.'],
  'The Brown Group':      ['Multi-sector Bond','Core Plus','Private Credit'],
};

const VEH_MIX = { MF: 0.40, ETF: 0.30, SMA: 0.20, Privates: 0.10 };
function vehicleMultiplier(vehicleFilter) {
  if (!vehicleFilter || vehicleFilter.length === 0) return 1;
  return vehicleFilter.reduce((s, v) => s + (VEH_MIX[v] || 0), 0);
}

function OpportunityPage({ onViewClient, onSelectionsChange, filters, setFilters, focus }) {
  // Multi-select: any number of Teams/FAs can be picked at once.
  const [selectedClients, setSelectedClients] = React.useState([]);
  const toggleClient = React.useCallback((name) => {
    const names = Array.isArray(name) ? name : [name];
    setSelectedClients(prev => names.every(n => prev.includes(n))
      ? prev.filter(x => !names.includes(x))
      : [...new Set([...prev, ...names])]);
  }, []);
  const toggleCats = React.useCallback((name) => {
    const names = Array.isArray(name) ? name : [name];
    setCatSelected(prev => names.every(n => prev.includes(n))
      ? prev.filter(x => !names.includes(x))
      : [...new Set([...prev, ...names])]);
  }, []);
  // Legacy single-client paths (charts, per-client scaling) only apply when
  // exactly one is picked; with several the charts show the territory.
  const selectedClient = selectedClients.length === 1 ? selectedClients[0] : null;
  const [advFilter, setAdvFilter] = React.useState([]);
  const toggleAdv = React.useCallback((a) => {
    setAdvFilter(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);
  }, []);
  const [selectedCity, setSelectedCity] = React.useState(null);
  const [advOverlay, setAdvOverlay] = React.useState(null);
  const [vehicleOverlay, setVehicleOverlay] = React.useState(null); // category obj
  const [catSelected, setCatSelected] = React.useState([]);
  const [dimClient, setDimClient] = React.useState('teams');
  const [dimCat, setDimCat] = React.useState('cats');
  // Vehicles come from the shared drawer filter so the drawer + page chips stay in sync
  const vehicleSel = (filters && filters.vehicles) || [];
  const toggleVehicle = (v) => {
    setFilters && setFilters(f => ({
      ...f,
      vehicles: (f.vehicles || []).includes(v)
        ? (f.vehicles || []).filter(x => x !== v)
        : [...(f.vehicles || []), v],
    }));
  };

  // Selecting a city on the heat map selects that city's whole book: all of its
  // clients (the tables narrow to them) AND all categories its clients invest in
  // (checked in the Category View). Clearing the city clears those category checks.
  const selectCity = React.useCallback((city) => {
    setSelectedCity(city);
    if (city && window.CITY_CLIENTS && window.CITY_CLIENTS[city]) {
      const cityCats = Array.from(new Set(window.CITY_CLIENTS[city].flatMap(c => c.cats || [])))
        .filter(name => ALL_CATS.some(a => a.name === name));
      setCatSelected(cityCats);
    } else {
      setCatSelected([]);
    }
  }, []);

  // Publish selections up to the TopBar
  React.useEffect(() => {
    if (!onSelectionsChange) return;
    const sels = [];
    selectedClients.forEach(c => {
      sels.push({ key: `client:${c}`, label: c, icon: 'user', onRemove: () => toggleClient(c) });
    });
    advFilter.forEach(a => {
      sels.push({ key: `adv:${a}`, label: `${a} adv.`, icon: 'trophy', onRemove: () => toggleAdv(a) });
    });
    if (selectedCity) {
      sels.push({ key: `city:${selectedCity}`, label: selectedCity, icon: 'location-dot', onRemove: () => selectCity(null) });
    }
    catSelected.forEach(c => {
      sels.push({ key: `cat:${c}`, label: c, icon: 'layer-group', onRemove: () => setCatSelected(arr => arr.filter(x => x !== c)) });
    });
    (filters?.regions || []).forEach(r => {
      sels.push({ key: `reg:${r}`, label: r, icon: 'location-dot', onRemove: () => setFilters(f => ({ ...f, regions: f.regions.filter(x => x !== r) })) });
    });
    (filters?.channels || []).forEach(c => {
      sels.push({ key: `ch:${c}`, label: c, icon: 'building-columns', onRemove: () => setFilters(f => ({ ...f, channels: f.channels.filter(x => x !== c) })) });
    });
    (filters?.advantage || []).forEach(a => {
      sels.push({ key: `adv:${a}`, label: a, icon: 'trophy', onRemove: () => setFilters(f => ({ ...f, advantage: f.advantage.filter(x => x !== a) })) });
    });
    vehicleSel.forEach(v => {
      sels.push({ key: `veh:${v}`, label: v, icon: 'cube', onRemove: () => setFilters(f => ({ ...f, vehicles: (f.vehicles || []).filter(x => x !== v) })) });
    });
    if (filters && filters.aumMax < 200) {
      sels.push({ key: 'aum', label: `AUM ≤ $${filters.aumMax}B`, icon: 'gauge-high', onRemove: () => setFilters(f => ({ ...f, aumMax: 200 })) });
    }
    onSelectionsChange(sels);
  }, [selectedClients, advFilter, selectedCity, catSelected, filters, onSelectionsChange]);

  // City selection from the Territory Heat Map narrows the top grids + treemap
  // to clients headquartered in that city.
  const cityClientNames = React.useMemo(() => {
    if (!selectedCity || !window.CITY_CLIENTS) return null;
    const list = window.CITY_CLIENTS[selectedCity] || [];
    return new Set(list.map(c => c.name));
  }, [selectedCity]);

  // Effective set of active categories:
  //  - If Teams/FAs are selected → the union of categories they hold
  //  - Else if a city is selected → union of categories its clients use
  //  - Else if user has checked some → those
  //  - Else → ALL active (default state)
  const clientCats = selectedClients.length > 0
    ? Array.from(new Set(selectedClients.flatMap(n => CLIENT_CAT_USAGE[n] || [])))
    : (cityClientNames
        ? Array.from(new Set([...cityClientNames].flatMap(n => CLIENT_CAT_USAGE[n] || [])))
        : null);
  // Focus strategies only narrows every category-driven figure to the focus
  // categories (intersected with anything the user has picked).
  const focusCatList = ALL_CATS.map(c => c.name).filter(n => isFocusCat(n));
  const pickFocus = (list) => { const x = list.filter(c => isFocusCat(c)); return x.length ? x : focusCatList; };
  const catEff = focus ? pickFocus(catSelected) : catSelected;
  const clientCatsEff = focus ? (clientCats ? clientCats.filter(c => isFocusCat(c)) : focusCatList) : clientCats;
  const activeCatsSet = React.useMemo(() => {
    if (clientCatsEff) return new Set(clientCatsEff);
    if (catEff.length > 0) return new Set(catEff);
    return new Set(ALL_CATS.map(c => c.name));
  }, [clientCatsEff && clientCatsEff.join('|'), catEff.join('|')]);

  // AUM header KPI — also feeds the Territory Heat Map summary so the tile's
  // "Mkt Opp" / "Mkt Share" always match the header and move together on selection.
  const aumKpiItems = kpiForMetric('aum', selectedClients, catEff, vehicleSel, selectedCity);
  const aumSummaryOpp = (aumKpiItems.find(i => i.label === 'Mkt Opp') || {}).value;
  const aumSummaryShare = (aumKpiItems.find(i => i.label === 'Mkt Share') || {}).value;

  return (
    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px,1fr))', gap: 16 }}>
        <TripKpi title="AUM" items={aumKpiItems} />
        <TripKpi title="Inflows" items={kpiForMetric('inflow', selectedClients, catEff, vehicleSel, selectedCity)} />
        <TripKpi title="Net Flows" items={kpiForMetric('netflow', selectedClients, catEff, vehicleSel, selectedCity)} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 16 }}>
        <Tile
          titleRight={<DimensionPicker variant="title" suffix=" View" value={dimClient} options={CLIENT_DIM_OPTIONS} onChange={setDimClient} />}
          right={
          <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap', justifyContent:'flex-end', minWidth:0 }}>
            <AdvLegendFilter selected={advFilter} onToggle={toggleAdv} />
            <span style={{ fontFamily:'Inter', fontSize:11, color:'rgb(163,163,163)' }}>Click rows to multi-select</span>
          </div>
        } pad={0} style={{ minHeight: 320, minWidth: 0 }}>
          <DetailedClientTable
            dim={dimClient}
            onSelectVehicle={toggleVehicle}
            onSelectCats={toggleCats}
            selectedClients={selectedClients}
            advFilter={advFilter}
            onAdvFilter={toggleAdv}
            filterCats={catEff}
            vehicleFilter={vehicleSel}
            cityClients={cityClientNames}
            selectedCity={selectedCity}
            onSelect={toggleClient}
            onAdvClick={(row) => setAdvOverlay(row)}
            onViewClient={onViewClient}
          />
        </Tile>

        <Tile
          titleRight={<DimensionPicker variant="title" suffix=" View" value={dimCat} options={CAT_DIM_OPTIONS} onChange={setDimCat} />}
          right={
          <div style={{ display:'flex', gap:12, alignItems:'center', flexWrap:'wrap', justifyContent:'flex-end', minWidth:0 }}>
            <VehicleFilterChips selected={vehicleSel} onToggle={toggleVehicle} compact />
            <span style={{ fontFamily:'Inter', fontSize:11, color:'rgb(163,163,163)' }}>
              {selectedClients.length === 1 ? `Filtered · ${selectedClients[0]}`
                : selectedClients.length > 1 ? `Filtered · ${selectedClients.length} selected`
                : 'Click rows to multi-select'}
            </span>
          </div>
        } pad={0} style={{ minHeight: 320, minWidth: 0 }}>
          <DetailedCategoryTable
            dim={dimCat}
            selectedClient={selectedClient}
            selectedCats={catSelected}
            clientCats={clientCatsEff}
            vehicleFilter={vehicleSel}
            onToggle={toggleCats}
            onToggleVehicle={toggleVehicle}
            onToggleClient={toggleClient}
            selectedClientNames={selectedClients}
            onViewVehicles={(cat) => setVehicleOverlay(cat)}
          />
        </Tile>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px,1fr))', gap: 16 }}>
        <TerritoryHeatMapTile
          vehicleFilter={vehicleSel}
          channels={filters?.channels || []}
          advantage={filters?.advantage || []}
          regions={filters?.regions || []}
          catSelected={catEff}
          selectedClient={selectedClient}
          onViewClient={onViewClient}
          selectedCity={selectedCity}
          onCityChange={selectCity}
          summaryOpp={aumSummaryOpp}
          summaryShare={aumSummaryShare}
        />
        <CategoryDistributionTile selectedClient={selectedClient} activeCats={activeCatsSet} vehicleFilter={vehicleSel} onToggle={(name) => setCatSelected(arr => arr.includes(name) ? arr.filter(x => x !== name) : [...arr, name])} />
      </div>

      <MarketShareTrendTile selectedClient={selectedClient} vehicleFilter={vehicleSel} />

      <CompAdvOverlay row={advOverlay} onClose={() => setAdvOverlay(null)} />
      <VehicleBreakdownOverlay cat={vehicleOverlay} onClose={() => setVehicleOverlay(null)} />
    </div>
  );
}

function TabPillsLocal() {
  const [v, setV] = React.useState('AUM');
  return <TabPills options={['AUM','Inflow','Net Flow']} labels={{Inflow:'Inflows','Net Flow':'Net Flows'}} value={v} onChange={setV} />;
}

function MarketShareTrendTile({ selectedClient, vehicleFilter }) {
  const [metric, setMetric] = React.useState('AUM');
  const [cfg, setCfg] = React.useState({ chartType: 'column', dimension: 'time', measure: 'aum', compare: 'opp-vs-yours' });
  const customize = (
    <TileCustomize
      config={cfg}
      onChange={(next) => {
        setCfg(next);
        // Mirror measure into the local pill state so the same data flows through
        if (next.measure === 'aum') setMetric('AUM');
        else if (next.measure === 'inflow') setMetric('Inflow');
        else if (next.measure === 'netflow') setMetric('Net Flow');
      }}
      options={{
        defaults: { chartType:'column', dimension:'time', measure:'aum', compare:'opp-vs-yours' },
        chartType: [
          { value:'column', label:'Column', icon:'fa-chart-column' },
          { value:'line',   label:'Line',   icon:'fa-chart-line' },
          { value:'area',   label:'Area',   icon:'fa-chart-area' },
        ],
        dimension: [
          { value:'time',    label:'Time (monthly)' },
          { value:'channel', label:'Channel' },
          { value:'vehicle', label:'Vehicle' },
          { value:'region',  label:'Region' },
        ],
        measure: [
          { value:'aum',     label:'AUM' },
          { value:'inflow',  label:'Inflows' },
          { value:'netflow', label:'Net Flows' },
          { value:'share',   label:'Mkt Share %' },
        ],
        compare: [
          { value:'opp-vs-yours', label:'Opp vs Yours' },
          { value:'yoy',          label:'YoY' },
          { value:'qoq',          label:'QoQ' },
          { value:'none',         label:'None' },
        ],
      }}
    />
  );
  return (
    <Tile title="Mkt Share Trend" right={
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <TabPills options={['AUM','Inflow','Net Flow']} labels={{Inflow:'Inflows','Net Flow':'Net Flows'}} value={metric} onChange={setMetric} />
        {customize}
      </div>
    } style={{ minHeight: 420 }}>
      <MarketShareTrend selectedClient={selectedClient} metric={metric} vehicleFilter={vehicleFilter} chartType={cfg.chartType} />
    </Tile>
  );
}

function CategoryDistributionTile({ selectedClient, activeCats, vehicleFilter, onToggle }) {
  const [metric, setMetric] = React.useState('AUM');
  const [cfg, setCfg] = React.useState({ chartType: 'treemap', dimension: 'category', measure: 'aum' });
  const customize = (
    <TileCustomize
      config={cfg}
      onChange={setCfg}
      options={{
        defaults: { chartType:'treemap', dimension:'category', measure:'aum' },
        chartType: [
          { value:'treemap', label:'Treemap', icon:'fa-chart-tree-map' },
          { value:'bar',     label:'Bar',     icon:'fa-chart-bar' },
          { value:'donut',   label:'Donut',   icon:'fa-chart-pie' },
        ],
        dimension: [
          { value:'category', label:'Category' },
          { value:'vehicle',  label:'Vehicle' },
          { value:'channel',  label:'Channel' },
        ],
        measure: [
          { value:'aum',     label:'AUM' },
          { value:'inflow',  label:'Inflows' },
          { value:'netflow', label:'Net Flows' },
        ],
      }}
    />
  );
  return (
    <Tile title="Category Distribution" right={
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <TabPills options={['AUM','Inflow','Net Flow']} labels={{Inflow:'Inflows','Net Flow':'Net Flows'}} value={metric} onChange={setMetric} />
        {customize}
      </div>
    } subtitle={
      <span style={{ fontFamily:'Inter', fontSize:10.5, color:'rgb(163,163,163)' }}>Click a category to filter all tiles</span>
    } style={{ minHeight: 420 }}>
      {metric === 'Net Flow'
        ? <CategoryNetFlow selectedClient={selectedClient} activeCats={activeCats} vehicleFilter={vehicleFilter} onToggle={onToggle} />
        : cfg.chartType === 'bar'
          ? <CategoryBar selectedClient={selectedClient} activeCats={activeCats} metric={metric} vehicleFilter={vehicleFilter} onToggle={onToggle} />
        : cfg.chartType === 'donut'
          ? <CategoryDonut selectedClient={selectedClient} activeCats={activeCats} metric={metric} vehicleFilter={vehicleFilter} onToggle={onToggle} />
        : <Treemap selectedClient={selectedClient} activeCats={activeCats} metric={metric} vehicleFilter={vehicleFilter} onToggle={onToggle} />
      }
    </Tile>
  );
}

function TerritoryHeatMapTile({ vehicleFilter, selectedClient, onViewClient,
                                channels = [], advantage = [], regions = [], catSelected = [],
                                selectedCity: ctrlCity, onCityChange, summaryOpp, summaryShare }) {
  const [cfg, setCfg] = React.useState({ geo: 'city', shareBands: 'quartiles' });
  const [internalCity, setInternalCity] = React.useState(null);
  const isCtrl = onCityChange !== undefined;
  const selectedCity = isCtrl ? (ctrlCity || null) : internalCity;
  const setSelectedCity = isCtrl ? onCityChange : setInternalCity;

  // Filtered client list for the selected city (still computed so future drill-throughs can use it)
  const sideClients = React.useMemo(() => {
    if (!selectedCity) return [];
    return filterCityClients(selectedCity, { vehicleFilter, channels, advantage, regions, catSelected, selectedClient });
  }, [selectedCity, vehicleFilter, channels, advantage, regions, catSelected, selectedClient]);

  // Count active filters for the header badge
  const activeFilterCount =
    (vehicleFilter?.length || 0) +
    (channels?.length || 0) +
    (advantage?.length || 0) +
    (regions?.length || 0) +
    (catSelected?.length || 0) +
    (selectedClient ? 1 : 0);

  // Heat map customization is deliberately narrow: geographic grain (which
  // changes what a bubble represents) and the Mkt Share bands driving bubble
  // colour. Chart type / measure / compare are fixed — this tile is a map.
  const customize = (
    <TileCustomize
      config={cfg}
      onChange={setCfg}
      options={{
        defaults: { geo:'city', shareBands:'quartiles' },
        geo: [
          { value:'state', label:'State — one bubble per state' },
          { value:'metro', label:'Metro area — one bubble per CBSA' },
          { value:'city',  label:'City — one bubble per city' },
          { value:'zip',   label:'ZIP code — one bubble per ZIP' },
        ],
        shareBands: [
          { value:'quartiles', label:'Quartiles of territory share' },
          { value:'fixed10',   label:'Fixed — <10% / 10–20% / 20–30% / 30%+' },
          { value:'fixed5',    label:'Fixed — <5% / 5–15% / 15–25% / 25%+' },
          { value:'vsTarget',  label:'Vs. target share' },
        ],
      }}
    />
  );

  const statusLabel = selectedClient
    ? `Filtered · ${selectedClient}`
    : selectedCity
      ? `Selected · ${selectedCity}`
      : activeFilterCount > 0
        ? `${activeFilterCount} filter${activeFilterCount === 1 ? '' : 's'} applied`
        : 'All clients in territory';

  return (
    <Tile
      title="Territory Heat Map"
      subtitle={`Northeast US · one bubble per ${({ state:'state', metro:'metro area', city:'city', zip:'ZIP code' })[cfg.geo] || 'city'} · scroll to zoom, drag to pan`}
      right={
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{
            fontFamily:'Inter', fontSize:11,
            color: activeFilterCount > 0 ? 'rgb(147,197,253)' : 'rgb(163,163,163)',
            display:'inline-flex', alignItems:'center', gap:5,
          }}>
            {activeFilterCount > 0 && <i className="fa-solid fa-filter" style={{ fontSize:9 }} />}
            {statusLabel}
          </span>
          {selectedCity && (
            <button onClick={() => setSelectedCity(null)} style={{
              height:24, padding:'0 8px', borderRadius:6,
              border:'1px solid rgba(75,85,99,0.5)', background:'rgba(255,255,255,0.03)',
              color:'rgb(163,163,163)', fontFamily:'Inter', fontSize:11, cursor:'pointer',
              display:'inline-flex', alignItems:'center', gap:5,
            }}>
              <i className="fa-solid fa-xmark" style={{ fontSize:9 }} /> Clear city
            </button>
          )}
          <button style={{
            width:24, height:24, borderRadius:6,
            border:'1px solid rgba(75,85,99,0.5)', background:'rgba(255,255,255,0.03)',
            color:'rgb(163,163,163)', cursor:'pointer',
            display:'inline-flex', alignItems:'center', justifyContent:'center',
          }} title="Expand"><i className="fa-solid fa-expand" style={{ fontSize:10 }} /></button>
          {customize}
        </div>
      }
      style={{ minHeight: 500 }}
      pad={16}
    >
      <div style={{ flex:1, minHeight: 0 }}>
        <TerritoryHeatMap
          vehicleFilter={vehicleFilter}
          channels={channels}
          advantage={advantage}
          regions={regions}
          catSelected={catSelected}
          selectedClient={selectedClient}
          height={460}
          selectedCity={selectedCity}
          summaryOpp={summaryOpp}
          summaryShare={summaryShare}
          geo={cfg.geo}
          shareBands={cfg.shareBands}
          onCityClick={(name) => setSelectedCity(selectedCity === name ? null : name)}
        />
      </div>
    </Tile>
  );
}

function TripKpi({ title, items }) {
  return (
    <Tile pad={16}>
      <div style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 12, color: 'rgb(209,213,219)', marginBottom: 12 }}>{title}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 'clamp(6px,0.9vw,12px)' }}>
        {items.map((it, i) => (
          <div key={i} style={{ minWidth: 0, borderLeft: i>0 ? '1px solid rgba(75,85,99,0.3)' : 'none', paddingLeft: i>0 ? 'clamp(6px,0.9vw,12px)' : 0 }}>
            <div style={{ fontFamily: 'Inter', fontSize: 10, color: 'rgb(200,205,213)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{it.label}</div>
            <div style={{ fontFamily: 'Inter Display, Inter', fontWeight: 700, fontSize: 'clamp(16px,1.35vw,20px)', color: 'rgb(249,250,251)', fontVariantNumeric: 'tabular-nums' }}>{it.value}</div>
            <div style={{ fontFamily: 'Inter', fontSize: 10.5, color: /↑/.test(String(it.sub||'')) ? 'rgb(52,211,153)' : /↓/.test(String(it.sub||'')) ? 'rgb(248,113,113)' : 'rgb(163,163,163)', marginTop: 2 }}>{it.sub}</div>
          </div>
        ))}
      </div>
    </Tile>
  );
}

/* Row dimensions for the Client + Category grids. Each grouped dimension lists
   its member Teams/FAs (or categories) so selecting a grouped row cross-filters
   the page exactly as picking those members would. */
const CLIENT_GROUPS = {
  firms: { label:'Firm', map:{
    'Contoso Wealth':      ['The Doe Wealth Group','The Brown Group'],
    'Fabrikam Financial':  ['The Smith Group','The Smith Group II'],
    'Adatum Partners':     ['Jane Smith','Doe & Roe Advisors'],
    'Litware Advisors':    ['Sample Consulting','Alpine Partners'],
  }},
  offices: { label:'Office', map:{
    'New York':      ['The Doe Wealth Group','Jane Smith'],
    'Chicago':       ['The Smith Group','Sample Consulting'],
    'San Francisco': ['Doe & Roe Advisors','The Brown Group'],
    'Dallas':        ['The Smith Group II','Alpine Partners'],
  }},
  channels: { label:'Channel', map:{
    'Wires': ['The Doe Wealth Group','The Smith Group','Jane Smith'],
    'IBD':   ['Doe & Roe Advisors','The Smith Group II'],
    'RIA':   ['Sample Consulting','The Brown Group'],
    'Bank':  ['Alpine Partners'],
  }},
  regions: { label:'Region', map:{
    'Northeast': ['The Doe Wealth Group','Jane Smith'],
    'Midwest':   ['The Smith Group','Sample Consulting'],
    'West':      ['Doe & Roe Advisors','The Brown Group'],
    'Southwest': ['The Smith Group II','Alpine Partners'],
  }},
  cities: { label:'City', map:{
    'New York':      ['The Doe Wealth Group','Jane Smith'],
    'Chicago':       ['The Smith Group'],
    'Boston':        ['Sample Consulting'],
    'San Francisco': ['Doe & Roe Advisors'],
    'Los Angeles':   ['The Brown Group'],
    'Dallas':        ['The Smith Group II','Alpine Partners'],
  }},
  reps: { label:'Salesperson', map:{
    'John Doe':   ['The Doe Wealth Group','Jane Smith'],
    'Jane Doe':   ['The Smith Group','Sample Consulting'],
    'John Smith': ['Doe & Roe Advisors','The Brown Group'],
    'Jane Smith': ['The Smith Group II','Alpine Partners'],
  }},
};
/* Both Opportunity grids offer the same nine dimensions; only the default and
   the measure columns differ. 'teams' is the native Team/FA row set for the
   Client grid, 'cats' the native category row set for the Category grid — the
   rest aggregate and route their selection to the matching cross-filter. */
const CLIENT_DIM_OPTIONS = DIM_ORDER;
const CAT_DIM_OPTIONS = DIM_ORDER;

/* Build a row set by slicing a book proportionally — used whenever a grid is
   pivoted onto a dimension that isn't its native row set. Every pivot therefore
   still totals to the same book. */
function oppSlice(rows, slices, keys) {
  const K = keys || { opp:'opp', yrs:'yours', iOp:'iOpp', iYr:'iYours', nOp:'nOpp', nYr:'nYours' };
  const sum = (k) => rows.reduce((a, r) => a + parseMoneyM(r[k]), 0);
  const T = { opp:sum(K.opp), yrs:sum(K.yrs), iOp:sum(K.iOp), iYr:sum(K.iYr), nOp:sum(K.nOp), nYr:sum(K.nYr) };
  const total = slices.reduce((a, s) => a + s.w, 0) || 1;
  return slices.map(s => {
    const f = s.w / total;
    const opp = T.opp * f, yrs = T.yrs * f, iOp = T.iOp * f, iYr = T.iYr * f, nOp = T.nOp * f, nYr = T.nYr * f;
    return {
      name: s.name, c: s.c, selKind: s.selKind, members: s.members,
      opp: fmtMoneyM(opp), yours: fmtMoneyM(yrs), share: fmtPct(yrs, opp),
      iOpp: fmtMoneyM(iOp), iYours: fmtMoneyM(iYr), iShare: fmtPct(iYr, iOp),
      nOpp: fmtMoneyM(nOp), nYours: fmtMoneyM(nYr, true), nShare: fmtPct(nYr, nOp),
    };
  }).sort((a, b) => parseMoneyM(b.opp) - parseMoneyM(a.opp));
}
const OPP_VEH_COLORS = { MF:'rgb(52,211,153)', ETF:'rgb(120,160,230)', SMA:'rgb(167,139,250)', Privates:'rgb(251,146,60)' };
function oppVehicleSlices() {
  return Object.keys(VEH_MIX).map(v => ({ name:v, w:VEH_MIX[v], c:OPP_VEH_COLORS[v], selKind:'vehicle' }));
}
function oppCategorySlices() {
  return ALL_CATS.map(c => ({ name:c.name, w:parseMoneyM(c.opp), c:c.c, selKind:'cats', members:[c.name] }));
}
/* Client groups weighted by their members' share of the book. */
function oppClientGroupSlices(dim, rows) {
  const cfg = CLIENT_GROUPS[dim];
  if (!cfg) return null;
  const byName = new Map(rows.map(r => [r.name, r]));
  return Object.entries(cfg.map).map(([g, names]) => {
    const members = names.filter(n => byName.has(n));
    if (!members.length) return null;
    return { name:g, selKind:'clients', members,
      w: members.reduce((a, n) => a + parseMoneyM(byName.get(n).opp), 0) };
  }).filter(Boolean);
}

/* Category-side groupings that survive the shared vocabulary. Asset class and
   focus category remain the underlying roll-ups used elsewhere on the page. */
const CAT_GROUPS = {
  assetclass: { label:'Asset Class', map:{
    'Equity':       ['Large Growth','Large Blend','Foreign Lg.','EM'],
    'Fixed Income': ['Multi-sector Bond','Int. Core Plus','Core Plus'],
    'Alternatives': ['Private Credit'],
  }},
};

const CLIENT_ROWS = [
  { type:'Teams', name:'The Doe Wealth Group', adv:'Strong', advDot:'rgb(52,211,153)', opp:'$142.5M', yours:'$28.4M', share:'19.9%', iOpp:'$18.2M', iYours:'$4.8M', iShare:'26.4%', nOpp:'$8.4M', nYours:'$2.1M', nShare:'25.0%', ca:'$22.4M', perf:'$14.2M', fee:'$8.2M', totInflow:'$3.1M', netFlow:'+$1.4M' },
  { type:'Teams', name:'The Smith Group',      adv:'Moderate', advDot:'rgb(250,204,21)', opp:'$96.7M', yours:'$18.2M', share:'18.4%', iOpp:'$12.4M', iYours:'$4.8M', iShare:'26.4%', nOpp:'$6.4M', nYours:'$2.1M', nShare:'25.0%', ca:'$15.8M', perf:'$9.4M', fee:'$5.2M', totInflow:'$2.4M', netFlow:'+$0.9M' },
  { type:'FA',    name:'Jane Smith',   adv:'Strong', advDot:'rgb(52,211,153)',   opp:'$87.3M', yours:'$12.8M', share:'14.7%', iOpp:'$10.8M', iYours:'$1.9M', iShare:'16.4%', nOpp:'$4.2M', nYours:'$0.9M', nShare:'20.5%', ca:'$13.9M', perf:'$8.1M', fee:'$4.7M', totInflow:'$1.7M', netFlow:'+$0.6M' },
  { type:'Teams', name:'Doe & Roe Advisors',     adv:'Moderate', advDot:'rgb(250,204,21)', opp:'$74.4M', yours:'$10.2M', share:'13.6%', iOpp:'$8.4M', iYours:'$1.0M', iShare:'13.0%', nOpp:'$3.8M', nYours:'$0.7M', nShare:'15.8%', ca:'$11.8M', perf:'$7.2M', fee:'$3.8M', totInflow:'$1.2M', netFlow:'+$0.4M' },
  { type:'Teams', name:'Sample Consulting', adv:'Strong', advDot:'rgb(52,211,153)',   opp:'$67.4M', yours:'$6.4M',  share:'13.7%', iOpp:'$8.4M', iYours:'$1.5M', iShare:'16.7%', nOpp:'$3.8M', nYours:'$0.7M', nShare:'19.5%', ca:'$10.6M', perf:'$6.4M', fee:'$3.2M', totInflow:'$1.1M', netFlow:'+$0.3M' },
  { type:'Teams', name:'The Smith Group II',   adv:'Low', advDot:'rgb(248,113,113)',     opp:'$56.7M', yours:'$8.4M',  share:'13.8%', iOpp:'$7.2M', iYours:'$0.9M', iShare:'14.3%', nOpp:'$3.4M', nYours:'$0.5M', nShare:'14.1%', ca:'$9.0M', perf:'$5.4M', fee:'$2.6M', totInflow:'$0.9M', netFlow:'+$0.2M' },
  { type:'BA',    name:'Alpine Partners',      adv:'Strong', advDot:'rgb(52,211,153)',   opp:'$56.7M', yours:'$6.4M',  share:'13.3%', iOpp:'$7.2M', iYours:'$0.9M', iShare:'13.3%', nOpp:'$2.4M', nYours:'$0.5M', nShare:'23.3%', ca:'$8.8M', perf:'$5.2M', fee:'$2.6M', totInflow:'$0.8M', netFlow:'+$0.2M' },
  { type:'Teams', name:'The Brown Group',      adv:'Moderate', advDot:'rgb(250,204,21)', opp:'$37.4M', yours:'$4.8M',  share:'14.7%', iOpp:'$4.2M', iYours:'$0.9M', iShare:'19.9%', nOpp:'$1.2M', nYours:'$0.3M', nShare:'16.1%', ca:'$5.8M', perf:'$3.6M', fee:'$1.8M', totInflow:'$0.6M', netFlow:'+$0.1M' },
];

function kpiForMetric(metric, clients, catSelected, vehicleFilter, selectedCity) {
  const picked = Array.isArray(clients) ? clients : (clients ? [clients] : []);
  const vehMult = vehicleMultiplier(vehicleFilter);
  // When a client is selected with no categories: show that client's row totals.
  // When a client is selected AND categories are: scale the client's totals by the cat share.
  // When only categories are selected: sum across all clients but only those category slices.
  // Otherwise: territory totals (sum all clients).
  const cats = catSelected || [];
  const catKeys = { aum:['opp','yours','share'], inflow:['iOpp','iYours','iShare'], netflow:['nOpp','nYours','nShare'] }[metric];

  // Helper: scale Market + Yours by vehMult, recompute share
  const scaled = (opp, yours, sub, yoursSub, shareSub, strong = false, signed = false) => ([
    { label:'Mkt Opp', value: fmtMoneyM(opp * vehMult),                       sub },
    { label:'Yours',  value: signed ? fmtMoneyM(yours * vehMult, true) : fmtMoneyM(yours * vehMult), sub: yoursSub, strong: true },
    { label:'Mkt Share', value: opp ? (yours/opp*100).toFixed(1)+'%' : '—',     sub: shareSub },
  ]);

  if (picked.length > 0) {
    const rows = CLIENT_ROWS.filter(c => picked.includes(c.name));
    if (rows.length) {
      const sumK = (k) => rows.reduce((a, r) => a + parseMoneyM(r[k]), 0);
      if (cats.length === 0) {
        const opp = sumK(catKeys[0]);
        const yours = sumK(catKeys[1]);
        const sub = { aum:'↑ 5.6% YoY', inflow:'↑ 11.2% YoY', netflow:'↑ 18.4% YoY' }[metric];
        const subY = { aum:'↑ 4.6% YoY', inflow:'↑ 14.6% YoY', netflow:'↑ 22.1% YoY' }[metric];
        const subS = { aum:'↓ 0.4 pts YoY', inflow:'↑ 1.6 pts YoY', netflow:'↑ 2.3 pts YoY' }[metric];
        return scaled(opp, yours, sub, subY, subS, true, metric === 'netflow');
      }
      // Selected Teams/FAs + categories: scale by cat share
      const totalCatOpp = ALL_CATS.reduce((a, c) => a + parseMoneyM(c[catKeys[0]]), 0);
      const visCatOpp = ALL_CATS.filter(c => cats.includes(c.name)).reduce((a, c) => a + parseMoneyM(c[catKeys[0]]), 0);
      const f = totalCatOpp ? visCatOpp / totalCatOpp : 0;
      const opp = sumK(catKeys[0]) * f;
      const yours = sumK(catKeys[1]) * f;
      return [
        { label:'Mkt Opp', value: fmtMoneyM(opp * vehMult), sub:`${picked.length} selected · ${cats.length} categor${cats.length>1?'ies':'y'}` },
        { label:'Yours',  value: fmtMoneyM(yours * vehMult), sub:'↑ 4.6% YoY', strong:true },
        { label:'Mkt Share', value: opp ? (yours/opp*100).toFixed(1)+'%' : '—', sub:'↓ 0.4 pts YoY' },
      ];
    }
  }

  // No client selected

  // City selected: show that city's whole-book aggregate (sum of its clients),
  // scaled per metric so Inflow / Netflow stay proportional to the AUM totals.
  if (selectedCity && window.CITY_CLIENTS && window.CITY_CLIENTS[selectedCity]) {
    const cc = window.CITY_CLIENTS[selectedCity];
    const oppC   = cc.reduce((a, c) => a + (c.opp   || 0), 0);
    const yoursC = cc.reduce((a, c) => a + (c.yours || 0), 0);
    const ratio  = { aum:[1, 1], inflow:[0.124, 0.175], netflow:[0.054, 0.082] }[metric];
    const opp   = oppC   * ratio[0];
    const yours = yoursC * ratio[1];
    const subM = {
      aum:     `${cc.length} client${cc.length > 1 ? 's' : ''} · ${selectedCity}`,
      inflow:  `↑ 11.2% YoY · ${selectedCity}`,
      netflow: `↑ 18.4% YoY · ${selectedCity}`,
    }[metric];
    return [
      { label:'Mkt Opp', value: fmtMoneyM(opp * vehMult), sub: subM },
      { label:'Yours',  value: metric === 'netflow' ? fmtMoneyM(yours * vehMult, true) : fmtMoneyM(yours * vehMult), sub:'↑ 4.6% YoY', strong:true },
      { label:'Mkt Share', value: opp ? (yours/opp*100).toFixed(1)+'%' : '—', sub:'↓ 0.4 pts YoY' },
    ];
  }

  if (cats.length > 0) {
    const vis = ALL_CATS.filter(c => cats.includes(c.name));
    const opp = vis.reduce((a, c) => a + parseMoneyM(c[catKeys[0]]), 0);
    const yours = vis.reduce((a, c) => a + parseMoneyM(c[catKeys[1]]), 0);
    const labels = {
      aum:     ['↑ 5.6% YoY',  '↑ 4.6% YoY',  '↓ 0.4 pts YoY'],
      inflow:  ['↑ 11.2% YoY', '↑ 14.6% YoY', '↑ 1.6 pts YoY'],
      netflow: ['↑ 18.4% YoY', '↑ 22.1% YoY', '↑ 2.3 pts YoY'],
    }[metric];
    return [
      { label:'Mkt Opp', value: fmtMoneyM(opp * vehMult),   sub:`${cats.length} categor${cats.length>1?'ies':'y'}` },
      { label:'Yours',  value: metric === 'netflow' ? fmtMoneyM(yours * vehMult, true) : fmtMoneyM(yours * vehMult), sub:labels[1], strong:true },
      { label:'Mkt Share', value: opp ? (yours/opp*100).toFixed(1)+'%' : '—', sub:labels[2] },
    ];
  }

  // Territory totals
  const sumF = (k) => CLIENT_ROWS.reduce((a, r) => a + parseMoneyM(r[k]), 0);
  if (metric === 'aum') {
    const opp = sumF('opp'), yours = sumF('yours');
    return [
      { label:'Mkt Opp', value: fmtMoneyM(opp * vehMult),   sub:`${CLIENT_ROWS.length} clients · Territory opp.` },
      { label:'Yours',  value: fmtMoneyM(yours * vehMult), sub:'↑ 4.6% YoY', strong:true },
      { label:'Mkt Share', value: opp ? (yours/opp*100).toFixed(1)+'%' : '—', sub:'↓ 0.4 pts YoY' },
    ];
  }
  if (metric === 'inflow') {
    const opp = sumF('iOpp'), yours = sumF('iYours');
    return [
      { label:'Mkt Opp', value: fmtMoneyM(opp * vehMult),   sub:'↑ 11.2% YoY' },
      { label:'Yours',  value: fmtMoneyM(yours * vehMult), sub:'↑ 14.6% YoY', strong:true },
      { label:'Mkt Share', value: opp ? (yours/opp*100).toFixed(1)+'%' : '—', sub:'↑ 1.6 pts YoY' },
    ];
  }
  const opp = sumF('nOpp'), yours = sumF('nYours');
  return [
    { label:'Mkt Opp', value: fmtMoneyM(opp * vehMult),   sub:'↑ 18.4% YoY' },
    { label:'Yours',  value: fmtMoneyM(yours * vehMult, true), sub:'↑ 22.1% YoY', strong:true },
    { label:'Mkt Share', value: opp ? (yours/opp*100).toFixed(1)+'%' : '—', sub:'↑ 2.3 pts YoY' },
  ];
}

/* Parse '$142.5M', '$1.2B', '+$2.1M', '-$0.4M' → number in $M. */
function parseMoneyM(s) {
  if (s == null) return 0;
  const m = String(s).match(/(-?)\+?\$?(-?)([0-9]*\.?[0-9]+)\s*([MB]?)/i);
  if (!m) return 0;
  const neg = (m[1] === '-' || m[2] === '-') ? -1 : 1;
  const v = parseFloat(m[3]);
  const mult = (m[4] || '').toUpperCase() === 'B' ? 1000 : 1;
  return neg * v * mult;
}
function fmtMoneyM(v, withSign) {
  const abs = Math.abs(v);
  const unit = abs >= 1000 ? 'B' : 'M';
  const num = abs >= 1000 ? abs / 1000 : abs;
  const txt = num >= 10 ? num.toFixed(1) : num.toFixed(2);
  const sign = v < 0 ? '-' : (withSign && v > 0 ? '+' : '');
  return sign + '$' + txt + unit;
}
function fmtPct(a, b) { return b ? ((a / b) * 100).toFixed(1) + '%' : '0.0%'; }

function DetailedClientTable({ dim = 'teams', selectedClients, onSelectVehicle, onSelectCats, onSelect, onAdvClick, filterCats, vehicleFilter, onViewClient, cityClients, selectedCity, advFilter, onAdvFilter }) {
  const picked = selectedClients || [];
  // Filter clients to those holding any of the user-checked categories
  const hasCatFilter = filterCats && filterCats.length > 0;
  const hasCityFilter = !!cityClients;
  const vehMult = vehicleMultiplier(vehicleFilter);
  const filterSet = new Set(filterCats || []);
  const cityFiltered = hasCityFilter
    ? CLIENT_ROWS.filter(r => cityClients.has(r.name))
    : CLIENT_ROWS;
  const advFiltered = (advFilter && advFilter.length)
    ? cityFiltered.filter(r => advFilter.includes(r.adv))
    : cityFiltered;
  const baseVisible = hasCatFilter
    ? advFiltered.filter(r => {
        const used = CLIENT_CAT_USAGE[r.name] || [];
        return used.some(c => filterSet.has(c));
      })
    : advFiltered;

  // When categories are selected, rebase per-team values so column totals
  // match the SELECTED CATEGORY totals (e.g. Large Growth = $38.2M opp →
  // visible teams sum to $38.2M). Each team is allocated proportionally to
  // its share of the cohort, per metric.
  const visibleRows = React.useMemo(() => {
    if (!hasCatFilter || baseVisible.length === 0) return baseVisible;
    const cats = ALL_CATS.filter(c => filterSet.has(c.name));
    const T = {
      opp:  cats.reduce((a,c) => a + parseMoneyM(c.opp),    0),
      yrs:  cats.reduce((a,c) => a + parseMoneyM(c.yours),  0),
      iOp:  cats.reduce((a,c) => a + parseMoneyM(c.iOpp),   0),
      iYr:  cats.reduce((a,c) => a + parseMoneyM(c.iYours), 0),
      nOp:  cats.reduce((a,c) => a + parseMoneyM(c.nOpp),   0),
      nYr:  cats.reduce((a,c) => a + parseMoneyM(c.nYours), 0),
    };
    const S = {
      opp:  baseVisible.reduce((a,r) => a + parseMoneyM(r.opp),    0),
      yrs:  baseVisible.reduce((a,r) => a + parseMoneyM(r.yours),  0),
      iOp:  baseVisible.reduce((a,r) => a + parseMoneyM(r.iOpp),   0),
      iYr:  baseVisible.reduce((a,r) => a + parseMoneyM(r.iYours), 0),
      nOp:  baseVisible.reduce((a,r) => a + parseMoneyM(r.nOpp),   0),
      nYr:  baseVisible.reduce((a,r) => a + parseMoneyM(r.nYours), 0),
    };
    const k = (sum, target) => (sum > 0 ? target / sum : 0);
    const K = {
      opp: k(S.opp, T.opp), yrs: k(S.yrs, T.yrs),
      iOp: k(S.iOp, T.iOp), iYr: k(S.iYr, T.iYr),
      nOp: k(S.nOp, T.nOp), nYr: k(S.nYr, T.nYr),
    };
    return baseVisible.map(r => {
      const opp = parseMoneyM(r.opp)    * K.opp;
      const yrs = parseMoneyM(r.yours)  * K.yrs;
      const iOp = parseMoneyM(r.iOpp)   * K.iOp;
      const iYr = parseMoneyM(r.iYours) * K.iYr;
      const nOp = parseMoneyM(r.nOpp)   * K.nOp;
      const nYr = parseMoneyM(r.nYours) * K.nYr;
      return {
        ...r,
        opp:    fmtMoneyM(opp    * vehMult),
        yours:  fmtMoneyM(yrs    * vehMult),
        share:  fmtPct(yrs, opp),
        iOpp:   fmtMoneyM(iOp    * vehMult),
        iYours: fmtMoneyM(iYr    * vehMult),
        iShare: fmtPct(iYr, iOp),
        nOpp:   fmtMoneyM(nOp    * vehMult),
        nYours: fmtMoneyM(nYr    * vehMult, true),
        nShare: fmtPct(nYr, nOp),
      };
    });
  }, [hasCatFilter, baseVisible, filterCats, vehMult]);

  // When no cat filter is active but vehicle filter is, still scale the base rows.
  const scaledRows = React.useMemo(() => {
    if (hasCatFilter || vehMult === 1) return visibleRows;
    return baseVisible.map(r => ({
      ...r,
      opp:    fmtMoneyM(parseMoneyM(r.opp)    * vehMult),
      yours:  fmtMoneyM(parseMoneyM(r.yours)  * vehMult),
      iOpp:   fmtMoneyM(parseMoneyM(r.iOpp)   * vehMult),
      iYours: fmtMoneyM(parseMoneyM(r.iYours) * vehMult),
      nOpp:   fmtMoneyM(parseMoneyM(r.nOpp)   * vehMult),
      nYours: fmtMoneyM(parseMoneyM(r.nYours) * vehMult, true),
    }));
  }, [visibleRows, baseVisible, hasCatFilter, vehMult]);

  // Single source of truth for the grid. A grid never filters ITSELF on its own
  // selection — selected rows stay visible and checked, and the selection drives
  // the KPIs and the other tiles. Only the other filters remove rows here.
  const shownRows = React.useMemo(() => {
    if (dim === 'teams') return scaledRows;
    const byName = new Map(scaledRows.map(r => [r.name, r]));
    const groups = oppClientGroupSlices(dim, scaledRows);
    if (groups) {
      // Carry the strongest member's comp-advantage dot up to the group row.
      return oppSlice(scaledRows, groups).map(r => {
        const lead = [...r.members].map(n => byName.get(n))
          .sort((a, b) => parseMoneyM(b.yours) - parseMoneyM(a.yours))[0];
        return { ...r, adv: lead.adv, advDot: lead.advDot };
      });
    }
    if (dim === 'vehicles') return oppSlice(scaledRows, oppVehicleSlices());
    if (dim === 'cats') return oppSlice(scaledRows, oppCategorySlices());
    return scaledRows;
  }, [scaledRows, dim]);

  return (
    <div style={{ overflow:'auto', height: 380 }}>
      <table style={oTable}>
        <colgroup>
          <col style={{ width:28 }} />
          <col />
          {[56,50,42,56,50,42,56,50,42].map((w, i) => <col key={i} style={{ width:w }} />)}
          <col style={{ width:36 }} />
        </colgroup>
        <thead>
          <tr>
            <th rowSpan={2} style={{ ...oTh, textAlign:'center', width:28, padding:'8px 2px 6px', verticalAlign:'bottom' }} title="Competitive Advantage — click a dot for the breakdown">Adv</th>
            <th rowSpan={2} style={{ ...oTh, textAlign:'left', verticalAlign:'bottom', padding:'8px 8px 10px' }}>{DIM_LABEL[dim] || 'Team/FA'}</th>
            <th colSpan={3} style={groupTh}>AUM</th>
            <th colSpan={3} style={{ ...groupTh, background:'rgba(255,255,255,0.015)' }}>Inflows</th>
            <th colSpan={3} style={groupTh}>Net Flows</th>
            <th rowSpan={2} style={{ ...oTh, width:36, padding:'8px 8px 6px' }}></th>
          </tr>
          <tr>
            <th style={oThN}>Opp</th><th style={oThN}>Yours</th><th style={oThN}>Share</th>
            <th style={{...oThN, background:'rgba(255,255,255,0.015)'}}>Opp</th><th style={{...oThN, background:'rgba(255,255,255,0.015)'}}>Yours</th><th style={{...oThN, background:'rgba(255,255,255,0.015)'}}>Share</th>
            <th style={oThN}>Opp</th><th style={oThN}>Yours</th><th style={oThN}>Share</th>
          </tr>
        </thead>
        <tbody>
          {shownRows.map((r,i) => {
            const sel = r.selKind === 'vehicle' ? (vehicleFilter || []).includes(r.name)
                      : r.selKind === 'cats' ? (filterCats || []).includes(r.name)
                      : r.members ? r.members.every(n => picked.includes(n))
                      : picked.includes(r.name);
            const rowClick = () => {
              if (r.selKind === 'vehicle') { onSelectVehicle && onSelectVehicle(r.name); return; }
              if (r.selKind === 'cats') { onSelectCats && onSelectCats(r.name); return; }
              onSelect(r.members || r.name);
            };
            return (
              <tr key={i} onClick={rowClick} style={rowSel(sel)}>
                <td style={{ ...oTdCell, textAlign:'center', padding:'9px 2px', borderLeft: sel ? '3px solid rgb(16,185,129)' : '3px solid transparent' }}>
                  {r.advDot && <AdvDotButton color={r.advDot} adv={r.adv} onClick={(e) => { e.stopPropagation(); onAdvClick(r); }} />}
                </td>
                <td style={oTdCell}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{
                      width:13, height:13, borderRadius:3, flexShrink:0,
                      border:`1px solid ${sel ? 'rgb(16,185,129)' : 'rgba(107,114,128,0.7)'}`,
                      background: sel ? 'rgb(16,185,129)' : 'transparent',
                      display:'inline-flex', alignItems:'center', justifyContent:'center',
                    }}>{sel && <i className="fa-solid fa-check" style={{ fontSize:7, color:'#fff' }} />}</span>
                    <span style={{ fontWeight: sel ? 700 : 500, color:'rgb(249,250,251)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{r.name}</span>
                  </div>
                </td>
                <td style={oTdN}>{r.opp}</td><td style={oTdNStrong}>{r.yours}</td><td style={oTdN}>{r.share}</td>
                <td style={{...oTdN, background:'rgba(255,255,255,0.015)'}}>{r.iOpp}</td><td style={{...oTdNStrong, background:'rgba(255,255,255,0.015)'}}>{r.iYours}</td><td style={{...oTdN, background:'rgba(255,255,255,0.015)'}}>{r.iShare}</td>
                <td style={oTdN}>{r.nOpp}</td><td style={oTdNStrong}>{r.nYours}</td><td style={oTdN}>{r.nShare}</td>
                <td style={{ ...oTdN, padding:'6px 6px', textAlign:'center' }}>
                  {dim === 'teams' && <button
                    onClick={(e) => { e.stopPropagation(); onViewClient && onViewClient(r); }}
                    title="View client details"
                    style={{
                      width:26, height:24, padding:0, borderRadius:5, cursor:'pointer',
                      background:'rgba(96,165,250,0.10)',
                      border:'1px solid rgba(96,165,250,0.35)',
                      color:'rgb(147,197,253)',
                      display:'inline-flex', alignItems:'center', justifyContent:'center',
                    }}
                  ><i className="fa-regular fa-eye" style={{ fontSize:11 }} /></button>}
                </td>
              </tr>
            );
          })}
          {scaledRows.length === 0 && (
            <tr>
              <td colSpan={11} style={{ padding:'32px 16px', textAlign:'center', color:'rgb(163,163,163)', fontFamily:'Inter', fontSize:12 }}>
                No clients hold the selected categor{filterCats.length === 1 ? 'y' : 'ies'}.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
const ALL_CATS = [
  { name:'Large Growth',     c:'rgb(59,130,246)',  opp:'$38.2M', yours:'$8.4M', share:'22.0%', iOpp:'$4.8M', iYours:'$1.2M', iShare:'25.0%', nOpp:'$2.4M', nYours:'$0.8M', nShare:'25.0%', fillA:'rgb(96,165,250)',  fillB:'rgb(29,78,216)',
    approved:true,  recommended:true,  recFund:'Cornerstone Growth Fund', researchFund:'Cornerstone Growth Fund' },
  { name:'Multi-sector Bond',c:'rgb(139,92,246)',  opp:'$26.8M', yours:'$6.2M', share:'21.7%', iOpp:'$3.0M', iYours:'$0.9M', iShare:'25.0%', nOpp:'$1.4M', nYours:'$0.4M', nShare:'22.2%', fillA:'rgb(167,139,250)', fillB:'rgb(91,33,182)',
    approved:true,  recommended:true,  recFund:'Horizon Income Fund',    researchFund:'Horizon Income Fund' },
  { name:'Large Blend',      c:'rgb(59,130,246)',  opp:'$24.2M', yours:'$4.9M', share:'19.6%', iOpp:'$3.6M', iYours:'$0.8M', iShare:'26.7%', nOpp:'$1.4M', nYours:'$0.4M', nShare:'21.4%', fillA:'rgb(96,165,250)',  fillB:'rgb(37,99,235)',
    approved:true,  recommended:true,  recFund:'Cornerstone 500 Index',  researchFund:'Cornerstone 500 Index' },
  { name:'Int. Core Plus',   c:'rgb(139,92,246)',  opp:'$18.6M', yours:'$3.6M', share:'18.4%', iOpp:'$2.4M', iYours:'$0.6M', iShare:'25.0%', nOpp:'$1.2M', nYours:'$0.3M', nShare:'25.0%', fillA:'rgb(167,139,250)', fillB:'rgb(109,40,217)',
    approved:true,  recommended:false, recFund:null,                     researchFund:'Meridian Core Plus' },
  { name:'Core Plus',        c:'rgb(20,184,166)',  opp:'$18.6M', yours:'$3.6M', share:'18.4%', iOpp:'$2.4M', iYours:'$0.6M', iShare:'25.0%', nOpp:'$1.2M', nYours:'$0.3M', nShare:'25.0%', fillA:'rgb(45,212,191)',  fillB:'rgb(13,148,136)',
    approved:true,  recommended:true,  recFund:'Riverbend Core Plus',    researchFund:'Riverbend Core Plus' },
  { name:'Private Credit',   c:'rgb(249,115,22)',  opp:'$14.8M', yours:'$2.4M', share:'16.2%', iOpp:'$1.9M', iYours:'$0.4M', iShare:'22.3%', nOpp:'$0.8M', nYours:'$0.2M', nShare:'25.0%', fillA:'rgb(251,146,60)',  fillB:'rgb(194,65,12)',
    approved:true,  recommended:true,  recFund:'Pinnacle Direct Lending',researchFund:'Pinnacle Direct Lending' },
  { name:'Foreign Lg.',      c:'rgb(14,165,233)',  opp:'$12.2M', yours:'$2.4M', share:'18.4%', iOpp:'$1.2M', iYours:'$0.3M', iShare:'25.0%', nOpp:'$1.2M', nYours:'$0.4M', nShare:'33.3%', fillA:'rgb(56,189,248)',  fillB:'rgb(3,105,161)',
    approved:true,  recommended:false, recFund:null,                     researchFund:'Compass Intl Equity' },
  { name:'EM',               c:'rgb(20,184,166)',  opp:'$6.1M',  yours:'$1.2M', share:'18.4%', iOpp:'$0.8M', iYours:'$0.2M', iShare:'25.0%', nOpp:'$0.4M', nYours:'$0.1M', nShare:'25.0%', fillA:'rgb(45,212,191)',  fillB:'rgb(15,118,110)',
    approved:false, recommended:false, recFund:null,                     researchFund:null },
];

function DetailedCategoryTable({ dim = 'cats', selectedCats, onToggle, onToggleVehicle, onToggleClient, selectedClientNames, selectedClient, clientCats, vehicleFilter, onViewVehicles }) {
  const VEH_MIX = { MF: 0.40, ETF: 0.30, SMA: 0.20, Privates: 0.10 };
  const vehMult = (vehicleFilter && vehicleFilter.length > 0)
    ? vehicleFilter.reduce((s, v) => s + (VEH_MIX[v] || 0), 0)
    : 1;
  const mult = (selectedClient ? 0.35 : 1) * vehMult;
  const usedByClient = clientCats ? new Set(clientCats) : null;
  // Only applicable categories are shown — non-matching rows are removed, not
  // dimmed — and what's left is re-ranked by Mkt Opp.
  const visibleCats = React.useMemo(() => {
    const list = ALL_CATS.filter(r => !usedByClient || usedByClient.has(r.name));
    return [...list].sort((a,b) => parseFloat(String(b.opp).replace(/[^0-9.]/g,'')) - parseFloat(String(a.opp).replace(/[^0-9.]/g,'')));
  }, [clientCats]);

  const clientMult = selectedClient ? 0.35 : 1;
  const shownCats = React.useMemo(() => {
    if (dim === 'cats') return visibleCats;
    if (dim === 'vehicles') {
      // Vehicle slices of the same book — clicking one drives the page vehicle filter.
      return oppSlice(visibleCats, oppVehicleSlices()).map(r => ({ ...r, noVeh:true }));
    }
    const groups = oppClientGroupSlices(dim, CLIENT_ROWS);
    if (groups) return oppSlice(visibleCats, groups).map(r => ({ ...r, noVeh:true }));
    return visibleCats;
  }, [visibleCats, dim]);

  return (
    <div style={{ overflow:'auto', height: 380 }}>
      <table style={oTable}>
        <colgroup>
          <col />
          {[56,50,42,56,50,42,56,50,42].map((w, i) => <col key={i} style={{ width:w }} />)}
          <col style={{ width:32 }} />
        </colgroup>
        <thead>
          <tr>
            <th rowSpan={2} style={{ ...oTh, textAlign:'left', verticalAlign:'bottom', padding:'8px 8px 10px' }}>{DIM_LABEL[dim] || 'Category'}</th>
            <th colSpan={3} style={groupTh}>AUM</th>
            <th colSpan={3} style={{ ...groupTh, background:'rgba(255,255,255,0.015)' }}>Inflows</th>
            <th colSpan={3} style={groupTh}>Net Flows</th>
            <th rowSpan={2} style={{ ...oTh, width:32, padding:'8px 8px 6px' }}></th>
          </tr>
          <tr>
            <th style={oThN}>Opp</th><th style={oThN}>Yours</th><th style={oThN}>Share</th>
            <th style={{...oThN, background:'rgba(255,255,255,0.015)'}}>Opp</th><th style={{...oThN, background:'rgba(255,255,255,0.015)'}}>Yours</th><th style={{...oThN, background:'rgba(255,255,255,0.015)'}}>Share</th>
            <th style={oThN}>Opp</th><th style={oThN}>Yours</th><th style={oThN}>Share</th>
          </tr>
        </thead>
        <tbody>
          {shownCats.map((r,i) => {
            const checked = r.selKind === 'vehicle' ? (vehicleFilter || []).includes(r.name)
                          : r.selKind === 'clients' ? r.members.every(n => (selectedClientNames || []).includes(n))
                          : r.members ? r.members.every(n => selectedCats.includes(n))
                          : selectedCats.includes(r.name);
            // Only what the user clicked is highlighted. Picking an FA/Team
            // narrows this list to its categories but does not mark them.
            const bg = checked ? 'rgba(16,185,129,0.14)' : 'transparent';
            const borderL = checked ? '3px solid rgb(16,185,129)' : '3px solid transparent';
            return (
              <tr key={i}
                onClick={() => {
                  if (r.selKind === 'vehicle') { onToggleVehicle && onToggleVehicle(r.name); return; }
                  if (r.selKind === 'clients') { onToggleClient && onToggleClient(r.members); return; }
                  onToggle(r.members || r.name);
                }}
                style={{
                  borderTop: '1px solid rgba(75,85,99,0.18)',
                  background: bg,
                  cursor: 'pointer',
                  transition: 'all .15s',
                }}>
                <td style={{...oTdCell, borderLeft: borderL}}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{
                      width:13, height:13, borderRadius:3,
                      border:`1px solid ${checked ? 'rgb(16,185,129)' : 'rgb(75,85,99)'}`,
                      background: checked ? 'rgb(16,185,129)' : 'transparent',
                      display:'inline-flex', alignItems:'center', justifyContent:'center', flexShrink:0,
                    }}>
                      {checked && <i className="fa-solid fa-check" style={{ fontSize:7, color:'#fff' }} />}
                    </span>
                    <span style={{ width:6, height:6, borderRadius:9999, background:r.c, flexShrink:0 }} />
                    <span style={{ color:'rgb(249,250,251)', fontWeight: checked ? 600 : 500, whiteSpace:'nowrap' }}>{r.name}</span>
                  </div>
                </td>
                <td style={oTdN}>{scaleVal(r.opp, r.noVeh ? clientMult : mult)}</td><td style={oTdNStrong}>{scaleVal(r.yours, r.noVeh ? clientMult : mult)}</td><td style={oTdN}>{r.share}</td>
                <td style={{...oTdN, background:'rgba(255,255,255,0.015)'}}>{scaleVal(r.iOpp, r.noVeh ? clientMult : mult)}</td><td style={{...oTdNStrong, background:'rgba(255,255,255,0.015)'}}>{scaleVal(r.iYours, r.noVeh ? clientMult : mult)}</td><td style={{...oTdN, background:'rgba(255,255,255,0.015)'}}>{r.iShare}</td>
                <td style={oTdN}>{scaleVal(r.nOpp, r.noVeh ? clientMult : mult)}</td><td style={oTdNStrong}>{scaleVal(r.nYours, r.noVeh ? clientMult : mult)}</td><td style={oTdN}>{r.nShare}</td>
                <td style={{ padding:'9px 8px 9px 4px', textAlign:'right' }}>
                  {dim === 'cats' && <button
                    onClick={(e) => { e.stopPropagation(); onViewVehicles(r); }}
                    title={`Vehicle breakdown for ${r.name}`}
                    style={{
                      width:24, height:24, borderRadius:6,
                      border:'1px solid rgba(75,85,99,0.5)', background:'rgba(255,255,255,0.02)',
                      color:'rgb(163,163,163)', cursor:'pointer',
                      display:'inline-flex', alignItems:'center', justifyContent:'center',
                      transition:'all .12s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor='rgb(16,185,129)'; e.currentTarget.style.color='rgb(52,211,153)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor='rgba(75,85,99,0.5)'; e.currentTarget.style.color='rgb(163,163,163)'; }}
                  >
                    <i className="fa-solid fa-up-right-from-square" style={{ fontSize:9 }} />
                  </button>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* Comp Adv legend that doubles as the filter — one control instead of a
   legend plus a pill row, so both grids start at the same y. */
function AdvLegendFilter({ selected, onToggle }) {
  const defs = [
    { l:'Strong',   c:'rgb(52,211,153)',  hint:'2·★' },
    { l:'Moderate', c:'rgb(250,204,21)',  hint:'1·★' },
    { l:'Low',      c:'rgb(248,113,113)', hint:'★' },
  ];
  return (
    <div style={{ display:'flex', alignItems:'center', gap:4 }}>
      {defs.map(a => {
        const on = (selected || []).includes(a.l);
        return (
          <button key={a.l} onClick={() => onToggle && onToggle(a.l)}
            title={`Filter to ${a.l} competitive advantage`}
            style={{
              display:'inline-flex', alignItems:'center', gap:5, height:22, padding:'0 8px', borderRadius:9999,
              background: on ? a.c.replace('rgb','rgba').replace(')',',0.18)') : 'transparent',
              border: `1px solid ${on ? a.c : 'transparent'}`,
              color: on ? a.c : 'rgb(163,163,163)',
              fontFamily:'Inter', fontSize:10.5, fontWeight: on ? 600 : 500, cursor:'pointer', whiteSpace:'nowrap',
            }}>
            <span style={{ width:8, height:8, borderRadius:9999, background:a.c }} />
            {a.l} {a.hint}
          </button>
        );
      })}
    </div>
  );
}

/* Comp-advantage dot — reads as a control: ring on hover, caret hint. */
function AdvDotButton({ color, adv, onClick }) {
  const [hover, setHover] = React.useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      title={`Competitive Advantage: ${adv} — click for the breakdown`}
      style={{
        width:22, height:22, borderRadius:9999, padding:0, cursor:'pointer',
        background: hover ? `${color.replace('rgb','rgba').replace(')',',0.18)')}` : 'transparent',
        border: `1px solid ${hover ? color : 'rgba(75,85,99,0.45)'}`,
        display:'inline-flex', alignItems:'center', justifyContent:'center',
        transition:'background .12s, border-color .12s',
      }}>
      <span style={{ width:9, height:9, borderRadius:9999, background:color, boxShadow:'0 0 0 1px rgba(0,0,0,0.4)' }} />
    </button>
  );
}

function scaleVal(s, mult) {  if (mult === 1) return s;
  const sign = s.startsWith('+') ? '+' : '';
  const num = parseFloat(s.replace(/[^0-9.]/g,''));
  const unit = s.includes('M') ? 'M' : s.includes('B') ? 'B' : '';
  const v = num * mult;
  return sign + '$' + (v >= 10 ? v.toFixed(1) : v.toFixed(2)) + unit;
}

/* Style tokens — tighter header padding */
const oTable   = { width:'100%', tableLayout:'fixed', borderCollapse:'collapse', fontFamily:'Inter', fontSize:11.5 };
const oTh      = { textAlign:'left', fontSize:10, fontWeight:500, color:'rgb(163,163,163)', textTransform:'none', letterSpacing:0.3, padding:'8px 12px 6px', borderBottom:'1px solid rgba(75,85,99,0.3)' };
const oThN     = { ...oTh, textAlign:'right', padding:'8px 4px 6px', overflow:'hidden' };
const groupTh  = { textAlign:'center', fontSize:9.5, fontWeight:600, color:'rgb(200,205,213)', padding:'8px 5px 2px', textTransform:'uppercase', letterSpacing:0.6 };
const oTdCell  = { padding:'9px 8px', color:'rgb(209,213,219)', overflow:'hidden' };
const oTdN     = { padding:'9px 4px', fontSize:10.5, textAlign:'right', color:'rgb(163,163,163)', fontVariantNumeric:'tabular-nums', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' };
const oTdNStrong = { ...oTdN, color:'rgb(52,211,153)', fontWeight:600 };
const tdTr = { borderTop: '1px solid rgba(75,85,99,0.18)' };

function rowSel(selected) {
  return {
    borderTop: '1px solid rgba(75,85,99,0.18)',
    background: selected ? 'rgba(16,185,129,0.12)' : 'transparent',
    cursor: 'pointer',
    transition: 'all .15s',
  };
}

function MarketShareTrend({ selectedClient, metric = 'AUM', vehicleFilter, chartType = 'column' }) {
  const vehMult = vehicleMultiplier(vehicleFilter);
  return _MarketShareTrendInner({ selectedClient, metric, vehMult, chartType });
}

function _MarketShareTrendInner({ selectedClient, metric, vehMult, chartType = 'column' }) {
  const wrapRef = React.useRef(null);
  const [h, setH] = React.useState(230);
  React.useLayoutEffect(() => {
    if (!wrapRef.current) return;
    const measure = () => {
      const r = wrapRef.current && wrapRef.current.getBoundingClientRect();
      if (r && r.height > 0) setH(Math.max(180, Math.floor(r.height)));
    };
    measure();
    let ro;
    try {
      ro = new ResizeObserver(measure);
      ro.observe(wrapRef.current);
    } catch (e) {}
    window.addEventListener('resize', measure);
    return () => {
      window.removeEventListener('resize', measure);
      if (ro) ro.disconnect();
    };
  }, []);

  const opts = React.useMemo(() => {
    const cats = ['Oct','Nov','Dec','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep'];    const baseChart = {
      chart: { type: 'column', height: h, backgroundColor: 'transparent', animation: { duration: 350 } },
      xAxis: { categories: cats, lineColor:'rgba(75,85,99,0.3)' },
      legend: { enabled: true, itemStyle:{color:'rgb(209,213,219)', fontSize:'10.5px'} },
      plotOptions: { column: { borderRadius: 0, groupPadding: 0.12, pointPadding: 0.04 } },
      tooltip: { shared: true },
    };

    if (metric === 'AUM') {
      const scale = (selectedClient ? 0.18 : 1) * vehMult;
      const aum = [7.8,8.2,9.1,10.4,11.0,11.9,12.6,13.4,14.1,14.9,15.6,16.2].map(v => +(v*scale).toFixed(2));
      const share = selectedClient
        ? [2.1,2.6,3.1,3.8,4.2,4.7,5.1,5.6,6.0,6.4,6.8,7.1]
        : [3.2,3.8,4.5,5.2,5.8,6.4,6.9,7.6,8.1,8.8,9.2,9.6];
      return {
        ...baseChart,
        yAxis: [{
          labels: { formatter: function() { return '$' + this.value + 'B'; }, style:{color:'rgb(163,163,163)', fontSize:'10px'} },
          gridLineColor: 'rgba(75,85,99,0.2)', gridLineDashStyle:'Dash',
        }, {
          opposite:true, gridLineWidth:0, max:16,
          labels: { formatter: function() { return this.value + '%'; }, style:{color:'rgb(163,163,163)', fontSize:'10px'} },
        }],
        series: [
          { type:'column', name: selectedClient ? `${selectedClient} AUM` : 'Total AUM', data:aum, ...wash('rgb(16,185,129)') },
          { type:'spline', name:'Mkt Share', data:share, yAxis:1,
            color:'#fff', dashStyle:'Dash', marker:{fillColor:'#fff',lineColor:'rgb(16,185,129)', radius:3.5}},
        ],
      };
    }

    if (metric === 'Inflow') {
      const scale = (selectedClient ? 0.45 : 1) * vehMult;
      const oppor = [240,300,180,350,260,400,330,420,380,310,440,350].map(v => Math.round(v*scale));
      const yours = [110,130, 80,170,120,200,160,230,190,140,260,180].map(v => Math.round(v*scale));
      const capture = oppor.map((o,i) => +((yours[i]/o)*100).toFixed(1));
      return {
        ...baseChart,
        yAxis: [{
          labels: { formatter: function() { return '$' + this.value + 'M'; }, style:{color:'rgb(163,163,163)', fontSize:'10px'} },
          gridLineColor: 'rgba(75,85,99,0.2)', gridLineDashStyle:'Dash', min: 0,
        }, {
          opposite:true, gridLineWidth:0, min:0, max:50,
          labels: { formatter: function() { return this.value + '%'; }, style:{color:'rgb(163,163,163)', fontSize:'10px'} },
        }],
        series: [
          { type:'column', name:'Opportunity Inflow', data: oppor, ...wash('rgb(107,114,128)', 0.18) },
          { type:'column', name:'Your Inflow',        data: yours, ...wash('rgb(16,185,129)') },
          { type:'spline', name:'Capture Rate', data: capture, yAxis:1,
            color:'#fff', dashStyle:'Dash', marker:{fillColor:'#fff', lineColor:'rgb(16,185,129)', radius:4, lineWidth:2}},
        ],
      };
    }

    // Net Flow — demo data with multiple negative months to show outflow scenario
    const scale = (selectedClient ? 0.45 : 1) * vehMult;
    const oppor = [180, 220, -160, -90, 140, 280, 230, -120, -180, 200, 260, 190].map(v => Math.round(v*scale));
    const yours = [ 90, 130,  -110, -60, 80, 210, 170,  -80, -130, 130, 180, 120].map(v => Math.round(v*scale));
    return {
      ...baseChart,
      yAxis: [{
        labels: { formatter: function() { return (this.value > 0 ? '+' : (this.value < 0 ? '−' : '')) + '$' + Math.abs(this.value) + 'M'; }, style:{color:'rgb(163,163,163)', fontSize:'10px'} },
        gridLineColor: 'rgba(75,85,99,0.2)', gridLineDashStyle:'Dash',
        plotLines: [{ value: 0, width: 1.5, color: 'rgba(255,255,255,0.45)', zIndex: 5 }],
      }],
      series: [
        { type:'column', name:'Opportunity Net Flow',
          data: oppor.map(v => v < 0
            ? { y:v, color:'rgba(220,38,38,0.16)', borderColor:'rgb(220,38,38)' }
            : { y:v, color:'rgba(107,114,128,0.20)', borderColor:'rgb(107,114,128)' }) },
        { type:'column', name:'Your Net Flow',
          data: yours.map(v => v < 0
            ? { y:v, color:'rgba(220,38,38,0.22)', borderColor:'rgb(220,38,38)' }
            : { y:v, color:'rgba(16,185,129,0.22)', borderColor:'rgb(16,185,129)' }) },
      ],
    };
  }, [selectedClient, metric, vehMult, h]);

  // Post-process to apply chartType (column / line / area). We swap any
  // column series → spline (line) or areaspline (area). Spline series stay.
  const finalOpts = React.useMemo(() => {
    if (!opts || chartType === 'column' || !opts.series) return opts;
    const newType = chartType === 'line' ? 'spline' : chartType === 'area' ? 'areaspline' : 'column';
    const series = opts.series.map(s => {
      if (s.type !== 'column') return s;
      // Strip column-only point objects → just keep y values + colors for line/area
      const data = (s.data || []).map(d => (d && typeof d === 'object' && 'y' in d) ? d.y : d);
      const baseColor = (s.color || (s.color && s.color.linearGradient) || 'rgb(16,185,129)');
      // Try to derive a sensible color from the existing wash/borderColor
      const color = s.borderColor || (typeof baseColor === 'string' ? baseColor : 'rgb(16,185,129)');
      const next = { ...s, type: newType, data, color };
      if (newType === 'areaspline') {
        next.fillOpacity = 0.28;
        next.lineWidth = 2;
        next.marker = { radius: 3, fillColor: color };
      }
      if (newType === 'spline') {
        next.lineWidth = 2.5;
        next.marker = { radius: 3.5, fillColor: color };
      }
      return next;
    });
    return { ...opts, series, chart: { ...opts.chart, type: newType } };
  }, [opts, chartType]);
  return (
    <div ref={wrapRef} style={{ flex:1, minHeight: 200, position:'relative' }}>
      <HC options={finalOpts} />
      {metric === 'Net Flow' && (
        <div style={{ position:'absolute', left:8, bottom:34, fontFamily:'Inter', fontSize:10, fontWeight:600, letterSpacing:0.4, color:'rgb(248,113,113)', display:'inline-flex', alignItems:'center', gap:5, pointerEvents:'none' }}>
          <span style={{ width:7, height:7, borderRadius:9999, background:'rgb(239,68,68)' }} />Outflows
        </div>
      )}
    </div>
  );
}

/* Vibrant gradient treemap — cells dim when not in activeCats */
function Treemap({ selectedClient, activeCats, metric = 'AUM', vehicleFilter, onToggle }) {
  const isOn = (name) => activeCats.has(name);
  const scale = (selectedClient ? 0.35 : 1) * vehicleMultiplier(vehicleFilter);
  const valueField = metric === 'Inflow' ? 'iOpp' : 'opp';

  return (
    <div style={{ flex: 1, minHeight: 220, display:'grid', gridTemplateColumns:'1.5fr 1fr', gridTemplateRows:'1.2fr 1fr', gap: 6 }}>
      <TreeCell cat={ALL_CATS.find(c=>c.name==='Large Growth')} valueField={valueField} big on={isOn('Large Growth')} scale={scale} onToggle={onToggle} />
      <div style={{ display:'grid', gridTemplateRows:'1fr 1fr', gap: 6 }}>
        <TreeCell cat={ALL_CATS.find(c=>c.name==='Multi-sector Bond')} valueField={valueField} on={isOn('Multi-sector Bond')} scale={scale} onToggle={onToggle} />
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 6 }}>
          <TreeCell cat={ALL_CATS.find(c=>c.name==='Large Blend')} valueField={valueField} small on={isOn('Large Blend')} scale={scale} onToggle={onToggle} />
          <TreeCell cat={ALL_CATS.find(c=>c.name==='Int. Core Plus')} valueField={valueField} small on={isOn('Int. Core Plus')} scale={scale} onToggle={onToggle} />
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1.2fr 1fr 1fr 0.7fr', gap: 6, gridColumn:'1 / -1' }}>
        <TreeCell cat={ALL_CATS.find(c=>c.name==='Core Plus')} valueField={valueField} on={isOn('Core Plus')} scale={scale} onToggle={onToggle} />
        <TreeCell cat={ALL_CATS.find(c=>c.name==='Private Credit')} valueField={valueField} small on={isOn('Private Credit')} scale={scale} onToggle={onToggle} />
        <TreeCell cat={ALL_CATS.find(c=>c.name==='Foreign Lg.')} valueField={valueField} small on={isOn('Foreign Lg.')} scale={scale} onToggle={onToggle} />
        <TreeCell cat={ALL_CATS.find(c=>c.name==='EM')} valueField={valueField} small on={isOn('EM')} scale={scale} onToggle={onToggle} />
      </div>
    </div>
  );
}

/* Focus categories — the handful the firm is actively pushing. Platform status
   (approved / recommended) varies by client firm, so it lives in the tooltip
   rather than on the tile itself. */
const FOCUS_CATS = new Set(['Large Growth','Core Plus','Private Credit']);
const PLATFORM_FIRMS = ['Contoso Wealth','Fabrikam Financial','Adatum Partners','Litware Advisors'];
const PLATFORM_STATUS = [
  { l:'Recommended', c:'rgb(52,211,153)' },
  { l:'Approved',    c:'rgb(96,165,250)' },
  { l:'Not on platform', c:'rgb(148,163,184)' },
];
function firmPlatformRows(cat) {
  const hash = (s) => s.split('').reduce((a,ch) => (a * 31 + ch.charCodeAt(0)) % 9973, 7);
  const rec = cat.recFund || `${cat.name} strategy`;
  const research = cat.researchFund || rec;
  return PLATFORM_FIRMS.map(firm => {
    const s = PLATFORM_STATUS[hash(firm + '|' + cat.name) % 3];
    return { firm, status: s,
      product: s.l === 'Recommended' ? rec : s.l === 'Approved' ? research : '\u2014' };
  });
}

function TreeCell({ cat, big, small, on, scale, labelOverride, valueField = 'opp', onToggle }) {
  if (!cat) return null;
  // Out-of-scope categories are removed from the treemap, not faded out.
  if (!on) return null;
  const raw = cat[valueField] || cat.opp;
  const value = scale !== 1 ? scaleVal(raw, scale) : raw;
  const isFocus = FOCUS_CATS.has(cat.name);
  const [tip, setTip] = React.useState(null);
  const platformRows = React.useMemo(() => firmPlatformRows(cat), [cat.name]);
  const tipRef = React.useRef(null);
  // Clamp against the panel's real size once it has rendered.
  React.useLayoutEffect(() => {
    if (!tip || !tipRef.current) return;
    const b = tipRef.current.getBoundingClientRect();
    const x = Math.max(8, Math.min(tip.x, window.innerWidth - b.width - 8));
    const y = Math.max(8, Math.min(tip.y, window.innerHeight - b.height - 8));
    if (Math.abs(x - tip.x) > 0.5 || Math.abs(y - tip.y) > 0.5) setTip({ x, y });
  }, [tip]);
  React.useEffect(() => {
    if (!tip) return;
    const close = () => setTip(null);
    window.addEventListener('mousedown', close);
    window.addEventListener('scroll', close, true);
    return () => { window.removeEventListener('mousedown', close); window.removeEventListener('scroll', close, true); };
  }, [tip]);
  const titleSize = big ? 14 : small ? 10.5 : 12;
  const valueSize = big ? 24 : small ? 13 : 17;
  const metaSize  = big ? 11 : 10;
  return (
    <div
      onClick={() => onToggle && onToggle(cat.name)}
      style={{
      background: `linear-gradient(135deg, ${cat.fillA} 0%, ${cat.fillB} 100%)`,
      borderRadius: 4, padding: big ? '12px 14px' : small ? '8px 10px' : '11px 12px',
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      color: '#fff', overflow: 'hidden', position:'relative',
      opacity: 1, transition: 'box-shadow .15s',
      boxShadow: on
        ? '0 0 0 2px rgba(255,255,255,0.55) inset, 0 0 0 1px rgba(0,0,0,0.35)'
        : (isFocus ? '0 0 0 2.5px rgb(52,211,153) inset, 0 0 0 1px rgba(16,185,129,0.4), 0 0 22px rgba(52,211,153,0.45)' : 'none'),
      cursor: onToggle ? 'pointer' : 'default',
    }}>
      {/* Top: label + value */}
      <div style={{ paddingRight: isFocus ? (small ? 54 : 62) : 0 }}>
        <div style={{
          fontFamily: 'Inter', fontWeight: 600,
          fontSize: titleSize,
          color: 'rgba(255,255,255,0.96)',
          letterSpacing: 0.1,
          whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
        }}>{labelOverride || cat.name}</div>
        <div style={{
          fontFamily: 'Inter Display, Inter', fontWeight: 700,
          fontSize: valueSize,
          color: '#fff', fontVariantNumeric:'tabular-nums',
          textShadow: '0 1px 2px rgba(0,0,0,0.25)',
          marginTop: big ? 2 : 1,
        }}>{value}</div>
      </div>

      {/* Focus category badge — platform status is per-firm, see the tooltip */}
      {isFocus && (
        <div style={{ position:'absolute', top: small ? 6 : 8, right: small ? 6 : 8 }}>
          <span style={{
            display:'inline-flex', alignItems:'center', gap:5,
            padding: small ? '2px 7px' : '3px 9px', borderRadius:9999,
            background:'#fff', border:'1px solid rgba(255,255,255,0.9)',
            fontFamily:'Inter', fontSize: small ? 9.5 : 10.5, fontWeight:700,
            color:'rgb(17,24,39)', letterSpacing:0.3, textTransform:'uppercase',
            boxShadow:'0 1px 2px rgba(0,0,0,0.18)',
          }}>
            <i className="fa-solid fa-bullseye" style={{ fontSize: small ? 8 : 9, color:'rgb(52,211,153)' }} />
            Focus
          </span>
        </div>
      )}

      {/* Platform status by firm — opened from the info button, not on hover */}
      <button
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          if (tip) { setTip(null); return; }
          const r = e.currentTarget.getBoundingClientRect();
          setTip({ x: r.left - 260, y: r.top + 24 });
        }}
        title="Platform status by firm"
        style={{
          position:'absolute', bottom: small ? 6 : 8, right: small ? 6 : 8,
          width: small ? 18 : 20, height: small ? 18 : 20, padding:0, borderRadius:9999,
          background: tip ? '#fff' : 'rgba(0,0,0,0.28)',
          border:'1px solid rgba(255,255,255,0.55)',
          color: tip ? 'rgb(17,24,39)' : '#fff', cursor:'pointer',
          display:'inline-flex', alignItems:'center', justifyContent:'center',
        }}><i className="fa-solid fa-list-check" style={{ fontSize: small ? 8.5 : 9.5 }} /></button>

      {tip && (
        <div ref={tipRef} onMouseDown={(e) => e.stopPropagation()} style={{
          position:'fixed', left:tip.x, top:tip.y, zIndex:400, width:300,
          background:'rgb(17,24,39)', border:'1px solid rgba(75,85,99,0.7)', borderRadius:8,
          boxShadow:'0 16px 40px rgba(0,0,0,0.55)', padding:'10px 12px 8px',
        }}>
          <div style={{ fontFamily:'Inter', fontSize:11.5, fontWeight:600, color:'rgb(249,250,251)', marginBottom:2 }}>{cat.name}</div>
          <div style={{ fontFamily:'Inter', fontSize:9.5, textTransform:'uppercase', letterSpacing:0.5, color:'rgb(200,205,213)', marginBottom:6 }}>Platform status by firm</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:'6px 10px' }}>
            {platformRows.map(r => (
              <React.Fragment key={r.firm}>
                <div style={{ minWidth:0 }}>
                  <div style={{ fontFamily:'Inter', fontSize:11, color:'rgb(229,231,235)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{r.firm}</div>
                  <div style={{ fontFamily:'Inter', fontSize:10, color:'rgb(148,163,184)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{r.product}</div>
                </div>
                <div style={{ display:'inline-flex', alignItems:'center', gap:5, alignSelf:'center', fontFamily:'Inter', fontSize:10, fontWeight:600, color:r.status.c, whiteSpace:'nowrap' }}>
                  <span style={{ width:7, height:7, borderRadius:9999, background:r.status.c }} />
                  {r.status.l}
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* Net flow horizontal bar chart — positive (green right) and negative (red left) */
function CategoryNetFlow({ selectedClient, activeCats, vehicleFilter, onToggle }) {
  // Per-cat net flow values (some negative). Scaled when client selected.
  const NET = [
    { name:'Large Growth',      v:  2.4, c:'rgb(96,165,250)' },
    { name:'Multi-sector Bond', v:  1.8, c:'rgb(167,139,250)' },
    { name:'Large Blend',       v:  1.4, c:'rgb(96,165,250)' },
    { name:'Int. Core Plus',    v:  1.2, c:'rgb(167,139,250)' },
    { name:'Core Plus',         v:  0.9, c:'rgb(45,212,191)' },
    { name:'Private Credit',    v:  0.6, c:'rgb(251,146,60)' },
    { name:'Foreign Lg.',       v: -0.4, c:'rgb(56,189,248)' },
    { name:'EM',                v: -0.8, c:'rgb(45,212,191)' },
  ];
  const scale = (selectedClient ? 0.35 : 1) * vehicleMultiplier(vehicleFilter);
  const rows = NET.filter(r => activeCats.has(r.name)).map(r => ({ ...r, v: +(r.v * scale).toFixed(2) }));
  const maxAbs = Math.max(...rows.map(r => Math.abs(r.v)), 1);
  const halfW = 50; // % width on each side of zero line

  return (
    <div style={{ flex:1, minHeight: 220, display:'flex', flexDirection:'column', padding:'4px 4px 0' }}>
      <div style={{ flex:1, display:'flex', flexDirection:'column', gap:8, justifyContent:'center' }}>
        {rows.map((r,i) => {
          const pos = r.v >= 0;
          const widthPct = (Math.abs(r.v) / maxAbs) * halfW;
          const valLabel = `${pos ? '+' : '-'}$${Math.abs(r.v).toFixed(1)}M`;
          return (
            <div key={i} style={{ display:'grid', gridTemplateColumns:'130px 1fr', alignItems:'center', gap:10 }}>
              <div onClick={() => onToggle && onToggle(r.name)} style={{ display:'flex', alignItems:'center', gap:8, fontFamily:'Inter', fontSize:11.5, color:'rgb(229,231,235)', cursor: onToggle ? 'pointer' : 'default' }}>
                <span style={{ width:8, height:8, borderRadius:9999, background:r.c, flexShrink:0 }} />
                <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.name}</span>
              </div>
              <div style={{ position:'relative', height: 22 }}>
                {/* zero line */}
                <div style={{ position:'absolute', left:'50%', top:-4, bottom:-4, width:1, background:'rgba(255,255,255,0.25)' }} />
                {/* bar */}
                <div style={{
                  position:'absolute', top:0, bottom:0,
                  left: pos ? '50%' : `${50 - widthPct}%`,
                  width: `${widthPct}%`,
                  background: pos ? 'rgb(16,185,129)' : 'rgb(239,68,68)',
                  borderRadius: pos ? '2px 4px 4px 2px' : '4px 2px 2px 4px',
                  display:'flex', alignItems:'center',
                  justifyContent: pos ? 'flex-end' : 'flex-start',
                  padding:'0 8px',
                  fontFamily:'Inter', fontSize:11, fontWeight:700, color:'#fff',
                  fontVariantNumeric:'tabular-nums',
                  boxShadow:'0 1px 2px rgba(0,0,0,0.25)',
                }}>{valLabel}</div>
              </div>
            </div>
          );
        })}
        {rows.length === 0 && (
          <div style={{ textAlign:'center', fontFamily:'Inter', fontSize:11, color:'rgb(107,114,128)' }}>No categories selected</div>
        )}
      </div>
      {/* axis legend */}
      <div style={{ display:'grid', gridTemplateColumns:'130px 1fr', gap:10, marginTop:6, paddingBottom:4 }}>
        <div></div>
        <div style={{ position:'relative', height: 16, fontFamily:'Inter', fontSize:10.5 }}>
          <span style={{ position:'absolute', right:'50.5%', top:0, color:'rgb(239,68,68)', paddingRight:6 }}>Outflows</span>
          <span style={{ position:'absolute', left:'50%', top:0, color:'rgb(163,163,163)', transform:'translateX(-50%)', paddingTop: 0 }}>$0</span>
          <span style={{ position:'absolute', left:'50.5%', top:0, color:'rgb(52,211,153)', paddingLeft:6 }}>Inflows</span>
        </div>
      </div>
    </div>
  );
}

/* --- Competitive Advantage overlay --- */
// Top 3 vehicle/M* category breakdown that mirrors the team page CompetitiveAdvantageCard.
function buildTopCompAdvRows(row) {
  // Scale per-row from the team's Comp Adv $ (row.ca)
  const mul = parseFloat(row.ca.replace(/[^0-9.]/g,'')) / 22.4;
  const M = (v) => `$${(v * mul).toFixed(1)}M`;
  return [
    { vehicle:'MF',  cat:'Intermediate Core-Plus', catC:'rgb(160,140,230)', tot:M(17.0), perf:M(10.1), fee:M(6.9),  perfVar:'-1.0', feeVar:'0.0',  inflows:M(10.5), net:M(0.9),  rank:1 },
    { vehicle:'MF',  cat:'Large Bond',             catC:'rgb(80,140,220)',  tot:M(5.4),  perf:M(2.7),  fee:M(2.7),  perfVar:'+3.6', feeVar:'30.5', inflows:M(0.4),  net:M(0.3),  rank:2 },
    { vehicle:'ETF', cat:'Moderate Allocation',    catC:'rgb(180,130,220)', tot:M(4.7),  perf:M(2.7),  fee:M(2.0),  perfVar:'+3.6', feeVar:'-3.0', inflows:M(0.3),  net:M(0.34), rank:3 },
  ];
}

function CompAdvOverlay({ row, onClose }) {
  if (!row) return null;
  const rows = React.useMemo(() => buildTopCompAdvRows(row), [row?.name]);

  return (
    <div onClick={onClose} style={{
      position:'fixed', inset:0, background:'rgba(5,10,18,0.75)', backdropFilter:'blur(8px)',
      display:'flex', alignItems:'center', justifyContent:'center', zIndex:200,
      animation:'advFade .18s ease-out',
    }}>
      <style>{`
        @keyframes advFade { from{opacity:0} to{opacity:1} }
        @keyframes advScale { from{opacity:0; transform:translateY(8px) scale(.98)} to{opacity:1; transform:none} }
      `}</style>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: 'min(1100px, 94vw)',
        maxHeight: '86vh',
        background:'rgb(13,20,32)',
        border:'1px solid rgba(75,85,99,0.5)',
        borderRadius: 14,
        boxShadow: '0 40px 120px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.02) inset',
        display:'flex', flexDirection:'column',
        animation:'advScale .22s cubic-bezier(.2,.8,.2,1)',
        overflow:'hidden',
      }}>
        {/* Header */}
        <div style={{ padding:'22px 28px 18px', display:'flex', alignItems:'flex-start', gap:16 }}>
          <div style={{ flex:1 }}>
            <span style={{
              display:'inline-flex', alignItems:'center', gap:6, padding:'3px 10px', borderRadius:9999,
              background:'rgba(16,185,129,0.2)', border:'1px solid rgba(16,185,129,0.4)',
              fontFamily:'Inter', fontSize:11, fontWeight:600, color:'rgb(110,240,180)',
            }}>
              <span style={{ width:7, height:7, borderRadius:9999, background:row.advDot }} />
              {row.adv}
            </span>
            <div style={{ fontFamily:'Geist, Inter', fontWeight:700, fontSize:22, color:'rgb(249,250,251)', marginTop:8 }}>{row.name}</div>
            <div style={{ fontFamily:'Inter', fontSize:12, color:'rgb(163,163,163)', marginTop:2 }}>
              Competitive Advantage · Top 3 vehicle / M★ category
            </div>
          </div>
          <button onClick={onClose} style={{
            width:32, height:32, borderRadius:6,
            border:'1px solid rgba(75,85,99,0.5)', background:'transparent',
            color:'rgb(163,163,163)', cursor:'pointer',
            display:'inline-flex', alignItems:'center', justifyContent:'center',
          }}><i className="fa-solid fa-xmark" /></button>
        </div>

        {/* 5-tile ribbon (ties back to the row on the main page) */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', borderTop:'1px solid rgba(75,85,99,0.3)', borderBottom:'1px solid rgba(75,85,99,0.3)' }}>
          {[
            { l:'Total Comp Adv AUM', v:row.ca },
            { l:'Perf Adv AUM', v:row.perf },
            { l:'Fee Adv AUM', v:row.fee },
            { l:'Total Inflow', v:row.totInflow },
            { l:'Total Net Flow', v:row.netFlow, accent:true },
          ].map((k,i) => (
            <div key={i} style={{ padding:'16px 22px', borderRight: i<4 ? '1px solid rgba(75,85,99,0.3)' : 'none' }}>
              <div style={{ fontFamily:'Inter', fontSize:10, fontWeight:600, color:'rgb(200,205,213)', textTransform:'uppercase', letterSpacing:0.6 }}>{k.l}</div>
              <div style={{ fontFamily:'Inter Display, Inter', fontWeight:700, fontSize:19, color: k.accent ? 'rgb(52,211,153)' : 'rgb(249,250,251)', fontVariantNumeric:'tabular-nums', marginTop:4 }}>{k.v}</div>
            </div>
          ))}
        </div>

        {/* Top 3 vehicle/M* category — same shape as team-page CompetitiveAdvantageCard */}
        <div style={{ flex:1, overflow:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontFamily:'Inter', fontSize:12.5 }}>
            <thead>
              <tr style={{ background:'rgba(0,0,0,0.18)' }}>
                <th style={caoTh}>Vehicle</th>
                <th style={caoTh}>M* Category</th>
                <th style={caoThR}>Total AUM</th>
                <th style={caoThR}>Perf Adv AUM</th>
                <th style={caoThR}>Perf Variance</th>
                <th style={caoThR}>Fee Adv AUM</th>
                <th style={caoThR}>Fee Variance</th>
                <th style={caoThR}>Total Inflows</th>
                <th style={caoThR}>Net Flows</th>
                <th style={caoThR}>Rank</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r,i) => {
                const perfVarColor = parseFloat(r.perfVar) > 0 ? 'rgb(52,211,153)' : parseFloat(r.perfVar) < 0 ? 'rgb(248,113,113)' : 'rgb(163,163,163)';
                const feeVarColor = parseFloat(r.feeVar) > 0 ? 'rgb(249,115,22)' : parseFloat(r.feeVar) < 0 ? 'rgb(52,211,153)' : 'rgb(163,163,163)';
                return (
                  <tr key={i} style={{ borderTop:'1px solid rgba(75,85,99,0.2)' }}>
                    <td style={caoTd}><CaoVehicleBadge v={r.vehicle} /></td>
                    <td style={caoTd}>
                      <span style={{ display:'inline-flex', alignItems:'center', gap:7, color:'rgb(229,231,235)' }}>
                        <span style={{ width:7, height:7, borderRadius:'50%', background:r.catC }} />
                        {r.cat}
                      </span>
                    </td>
                    <td style={caoTdR}>{r.tot}</td>
                    <td style={{ ...caoTdR, color:'rgb(52,211,153)', fontWeight:600 }}>{r.perf}</td>
                    <td style={{ ...caoTdR, color: perfVarColor }}>{r.perfVar}</td>
                    <td style={caoTdR}>{r.fee}</td>
                    <td style={{ ...caoTdR, color: feeVarColor }}>{r.feeVar}</td>
                    <td style={caoTdR}>{r.inflows}</td>
                    <td style={caoTdR}>{r.net}</td>
                    <td style={caoTdR}>
                      <span style={{
                        padding:'3px 8px', borderRadius:4, minWidth:22, display:'inline-block',
                        background: r.rank <= 3 ? 'rgba(251,146,60,0.18)' : 'transparent',
                        color: r.rank <= 3 ? 'rgb(251,146,60)' : 'rgb(163,163,163)',
                        border: r.rank <= 3 ? '1px solid rgba(251,146,60,0.4)' : 'none',
                        fontWeight: 700,
                      }}>{r.rank}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{ padding:'14px 24px', borderTop:'1px solid rgba(75,85,99,0.3)', display:'flex', gap:10, alignItems:'center' }}>
          <span style={{ fontFamily:'Inter', fontSize:11, color:'rgb(107,114,128)' }}>Data as of Q3 2025 · SS&amp;C</span>
          <div style={{ flex:1 }} />
          <button style={{
            height:34, padding:'0 14px', borderRadius:8,
            border:'1px solid rgba(75,85,99,0.5)', background:'transparent',
            color:'rgb(209,213,219)', fontFamily:'Inter', fontSize:12, fontWeight:500, cursor:'pointer',
            display:'inline-flex', alignItems:'center', gap:6,
          }}><i className="fa-solid fa-download" style={{fontSize:10}} /> Export</button>
          <button style={{
            height:34, padding:'0 14px', borderRadius:8,
            border:'1px solid rgb(16,185,129)', background:'rgb(16,185,129)',
            color:'#fff', fontFamily:'Inter', fontSize:12, fontWeight:600, cursor:'pointer',
            display:'inline-flex', alignItems:'center', gap:6,
          }}>View Full Report <i className="fa-solid fa-arrow-right" style={{fontSize:10}} /></button>
        </div>
      </div>
    </div>
  );
}

const caoTh = { textAlign:'left', fontFamily:'Inter', fontSize:10, fontWeight:600, color:'rgb(200,205,213)', textTransform:'uppercase', letterSpacing:0.5, padding:'10px 14px', whiteSpace:'nowrap' };
const caoThR = { ...caoTh, textAlign:'right' };
const caoTd = { padding:'12px 14px', color:'rgb(209,213,219)', fontFamily:'Inter', fontSize:12 };
const caoTdR = { ...caoTd, textAlign:'right', fontVariantNumeric:'tabular-nums' };

function CaoVehicleBadge({ v }) {
  const m = {
    MF:  { bg:'rgba(59,130,246,0.18)', c:'rgb(110,168,254)' },
    ETF: { bg:'rgba(16,185,129,0.18)', c:'rgb(52,211,153)' },
    SMA: { bg:'rgba(234,179,8,0.18)',  c:'rgb(251,191,36)' },
    CIT: { bg:'rgba(14,165,233,0.18)', c:'rgb(125,211,252)' },
  };
  const s = m[v] || m.MF;
  return <span style={{
    display:'inline-flex', alignItems:'center', justifyContent:'center',
    width:34, height:18, borderRadius:4, background:s.bg, color:s.c,
    fontFamily:'Inter', fontSize:10, fontWeight:700, letterSpacing:0.3,
  }}>{v}</span>;
}

function TreeRow({ level, open, label, cells, onToggle, hasChildren }) {
  const indent = level * 22;
  const netColor = cells[2] && cells[2].includes('-') ? 'rgb(248,113,113)' : 'rgb(52,211,153)';
  const isBold = level === 0;
  return (
    <tr style={{
      borderTop:'1px solid rgba(75,85,99,0.18)',
      background: level === 0 ? 'rgba(255,255,255,0.02)' : level === 1 ? 'rgba(255,255,255,0.01)' : 'transparent',
      cursor: hasChildren ? 'pointer' : 'default',
    }} onClick={hasChildren ? onToggle : undefined}>
      <td style={{ padding:'11px 24px', paddingLeft: 24 + indent, color:'rgb(209,213,219)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {hasChildren ? (
            <i className={`fa-solid ${open ? 'fa-chevron-down' : 'fa-chevron-right'}`} style={{ fontSize:9, color:'rgb(163,163,163)', width:10 }} />
          ) : (
            <span style={{ width:10 }} />
          )}
          <span style={{
            fontWeight: isBold ? 600 : 400,
            color: level === 2 ? 'rgb(209,213,219)' : level === 1 ? 'rgb(229,231,235)' : 'rgb(249,250,251)',
            fontSize: isBold ? 13 : 12,
          }}>{label}</span>
        </div>
      </td>
      <td style={{ padding:'11px 24px', textAlign:'right', color:'rgb(229,231,235)', fontWeight: isBold ? 600 : 400, fontVariantNumeric:'tabular-nums' }}>{cells[0]}</td>
      <td style={{ padding:'11px 24px', textAlign:'right', color:'rgb(209,213,219)', fontVariantNumeric:'tabular-nums' }}>{cells[1]}</td>
      <td style={{ padding:'11px 24px', textAlign:'right', color: netColor, fontVariantNumeric:'tabular-nums', fontWeight: 500 }}>{cells[2]}</td>
    </tr>
  );
}

function buildAdvTree(row) {
  const mul = parseFloat(row.ca.replace(/[^0-9.]/g,'')) / 22.4;
  const M = (v) => `$${(v * mul).toFixed(1)}M`;
  const K = (v) => {
    const val = v * mul * 1000;
    if (Math.abs(val) >= 1000) return `$${(val/1000).toFixed(1)}M`;
    return `${val < 0 ? '-' : ''}$${Math.abs(Math.round(val))}K`;
  };
  const Ks = (v, neg) => {
    const val = v * mul * 1000;
    const sign = neg ? '-' : '+';
    if (Math.abs(val) >= 1000) return `${sign}$${(val/1000).toFixed(1)}M`;
    return `${sign}$${Math.abs(Math.round(val))}K`;
  };

  return [
    { name:'Brokerage', adv:M(11.8), inflow:M(1.6), net:Ks(0.82,false), children: [
      { name:'US Equity', adv:M(6.4), inflow:K(0.91), net:Ks(0.48,false), children: [
        { name:'Large Blend',    adv:M(3.2), inflow:K(0.51), net:Ks(0.28,false) },
        { name:'Large Growth',   adv:M(2.1), inflow:K(0.28), net:Ks(0.14,false) },
        { name:'Mid-Cap Value',  adv:M(1.1), inflow:K(0.12), net:Ks(0.06,false) },
      ]},
      { name:'Fixed Income', adv:M(3.8), inflow:K(0.49), net:Ks(0.21,false), children: [
        { name:'Intermediate Core Bond',    adv:M(2.1), inflow:K(0.28), net:Ks(0.14,false) },
        { name:'Short-Term Bond',           adv:M(1.0), inflow:K(0.13), net:Ks(0.03,true) },
        { name:'Inflation-Protected Bond',  adv:K(0.70), inflow:K(0.08), net:Ks(0.10,false) },
      ]},
      { name:'Alternatives', adv:M(1.6), inflow:K(0.20), net:Ks(0.13,false), children: [
        { name:'Multistrategy', adv:M(0.9), inflow:K(0.12), net:Ks(0.08,false) },
        { name:'Event Driven',  adv:K(0.70), inflow:K(0.08), net:Ks(0.05,false) },
      ]},
    ]},
    { name:'Advisory', adv:M(7.2), inflow:K(0.98), net:Ks(0.41,false), children: [
      { name:'Intl Developed Equity', adv:M(4.8), inflow:K(0.64), net:Ks(0.11,true), children: [
        { name:'Foreign Large Blend',  adv:M(2.9), inflow:K(0.39), net:Ks(0.08,true) },
        { name:'Foreign Large Growth', adv:M(1.9), inflow:K(0.25), net:Ks(0.03,true) },
      ]},
      { name:'Multi-Asset', adv:M(2.4), inflow:K(0.34), net:Ks(0.52,false), children: [
        { name:'Target Date 2040',  adv:M(1.4), inflow:K(0.20), net:Ks(0.30,false) },
        { name:'Target Date 2035',  adv:M(1.0), inflow:K(0.14), net:Ks(0.22,false) },
      ]},
    ]},
    { name:'Retirement / IRA', adv:M(3.4), inflow:K(0.51), net:Ks(0.17,false), children: [
      { name:'Lifecycle', adv:M(2.2), inflow:K(0.34), net:Ks(0.12,false), children: [
        { name:'2035',  adv:M(1.1), inflow:K(0.17), net:Ks(0.06,false) },
        { name:'2040',  adv:M(1.1), inflow:K(0.17), net:Ks(0.06,false) },
      ]},
      { name:'Stable Value', adv:M(1.2), inflow:K(0.17), net:Ks(0.05,false), children: [
        { name:'Core Stable Value', adv:M(1.2), inflow:K(0.17), net:Ks(0.05,false) },
      ]},
    ]},
  ];
}

/* --- Vehicle Breakdown overlay (per Morningstar category) --- */
const VEHICLE_TYPES = [
  { code:'MF',   name:'Mutual Fund',           bg:'rgba(59,130,246,0.18)',  c:'rgb(96,165,250)' },
  { code:'ETF',  name:'Exchange Traded Fund',  bg:'rgba(16,185,129,0.18)',  c:'rgb(52,211,153)' },
  { code:'SMA',  name:'Separately Managed Acct', bg:'rgba(234,179,8,0.18)', c:'rgb(250,204,21)' },
  { code:'PRIV', name:'Private Markets',       bg:'rgba(139,92,246,0.20)',  c:'rgb(196,181,253)' },
  { code:'CIT',  name:'Collective Inv Trust',  bg:'rgba(14,165,233,0.18)',  c:'rgb(125,211,252)' },
  { code:'ALT',  name:'Alternative',           bg:'rgba(248,113,113,0.18)', c:'rgb(252,165,165)' },
];

function VehicleBreakdownOverlay({ cat, onClose }) {
  if (!cat) return null;
  const rows = React.useMemo(() => buildVehicleRows(cat), [cat?.name]);

  // Aggregate top totals
  const totals = rows.reduce((a, r) => ({
    aumOpp: a.aumOpp + r.aumOppNum,   aumYours: a.aumYours + r.aumYoursNum,
    iOpp:   a.iOpp   + r.iOppNum,     iYours:   a.iYours   + r.iYoursNum,
    nOpp:   a.nOpp   + r.nOppNum,     nYours:   a.nYours   + r.nYoursNum,
  }), { aumOpp:0, aumYours:0, iOpp:0, iYours:0, nOpp:0, nYours:0 });
  const fmtB = (v) => {
    if (v >= 1000) return `$${(v/1000).toFixed(2)}B`;
    if (v >= 100)  return `$${v.toFixed(1)}M`;
    if (v >= 10)   return `$${v.toFixed(1)}M`;
    return `$${v.toFixed(2)}M`;
  };
  const pct = (a, b) => b === 0 ? '—' : (a / b * 100).toFixed(2) + '%';

  return (
    <div onClick={onClose} style={{
      position:'fixed', inset:0, background:'rgba(5,10,18,0.78)', backdropFilter:'blur(8px)',
      display:'flex', alignItems:'center', justifyContent:'center', zIndex:200,
      animation:'vbFade .18s ease-out',
    }}>
      <style>{`
        @keyframes vbFade  { from{opacity:0} to{opacity:1} }
        @keyframes vbScale { from{opacity:0; transform:translateY(8px) scale(.98)} to{opacity:1; transform:none} }
        .vb-row:hover { background: rgba(255,255,255,0.025) !important; }
      `}</style>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: 'min(1180px, 94vw)', maxHeight: '88vh',
        background:'rgb(13,20,32)', border:'1px solid rgba(75,85,99,0.5)',
        borderRadius:14,
        boxShadow:'0 40px 120px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.02) inset',
        display:'flex', flexDirection:'column',
        animation:'vbScale .22s cubic-bezier(.2,.8,.2,1)',
        overflow:'hidden',
      }}>
        {/* Header */}
        <div style={{ padding:'18px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid rgba(75,85,99,0.3)' }}>
          <div style={{ display:'flex', alignItems:'baseline', gap:12 }}>
            <span style={{ width:8, height:8, borderRadius:9999, background:cat.c, transform:'translateY(-2px)' }} />
            <h1 style={{ fontFamily:'Geist, Inter', fontWeight:700, fontSize:22, color:'rgb(249,250,251)', letterSpacing:-0.3 }}>{cat.name}</h1>
            <span style={{ fontFamily:'Inter', fontSize:12, color:'rgb(107,114,128)' }}>M★ Category · Vehicle Breakdown</span>
          </div>
          <button onClick={onClose} style={{
            width:30, height:30, borderRadius:6,
            border:'1px solid rgba(75,85,99,0.5)', background:'rgba(255,255,255,0.02)',
            color:'rgb(163,163,163)', cursor:'pointer',
            display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:14,
          }}><i className="fa-solid fa-xmark" /></button>
        </div>

        {/* Summary Ribbon */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', borderBottom:'1px solid rgba(75,85,99,0.3)' }}>
          {[
            { kind:'AUM',     accent:'rgb(52,211,153)', opp:fmtB(totals.aumOpp), yours:fmtB(totals.aumYours), share: pct(totals.aumYours, totals.aumOpp) },
            { kind:'INFLOW',  accent:'rgb(96,165,250)', opp:fmtB(totals.iOpp),   yours:fmtB(totals.iYours),   share: pct(totals.iYours,   totals.iOpp) },
            { kind:'NET FLOW',accent:'rgb(250,204,21)', opp:fmtB(totals.nOpp),   yours:fmtB(totals.nYours),   share: pct(totals.nYours,   totals.nOpp) },
          ].map((s, i) => (
            <div key={i} style={{ padding:'18px 24px', borderRight: i<2 ? '1px solid rgba(75,85,99,0.3)' : 'none', position:'relative' }}>
              <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:s.accent }} />
              <div style={{ fontFamily:'Inter', fontSize:11, fontWeight:700, letterSpacing:0.8, color:s.accent, marginBottom:14 }}>{s.kind}</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14 }}>
                {[['Mkt Opp', s.opp], ['Yours', s.yours], ['Mkt Share', s.share]].map(([l, v], j) => (
                  <div key={j}>
                    <div style={{ fontFamily:'Inter', fontSize:10, color:'rgb(200,205,213)', textTransform:'uppercase', letterSpacing:0.4 }}>{l}</div>
                    <div style={{ fontFamily:'Inter Display, Inter', fontSize:20, fontWeight:700, color:'rgb(249,250,251)', letterSpacing:-0.4, marginTop:3, fontVariantNumeric:'tabular-nums' }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div style={{ flex:1, overflow:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontFamily:'Inter', fontSize:12.5 }}>
            <thead>
              <tr>
                <th style={{ width:280, padding:'10px 14px', borderBottom:'1px solid rgba(75,85,99,0.3)', borderRight:'1px solid rgba(75,85,99,0.3)', background:'rgb(11,21,32)' }}></th>
                <th colSpan={3} style={{ padding:'10px 14px', fontFamily:'Inter', fontSize:11, fontWeight:700, color:'rgb(52,211,153)', textTransform:'uppercase', letterSpacing:0.8, textAlign:'center', background:'rgba(16,185,129,0.06)', borderBottom:'1px solid rgba(75,85,99,0.3)', borderRight:'1px solid rgba(75,85,99,0.3)' }}>AUM</th>
                <th colSpan={3} style={{ padding:'10px 14px', fontFamily:'Inter', fontSize:11, fontWeight:700, color:'rgb(96,165,250)', textTransform:'uppercase', letterSpacing:0.8, textAlign:'center', background:'rgba(59,130,246,0.06)', borderBottom:'1px solid rgba(75,85,99,0.3)', borderRight:'1px solid rgba(75,85,99,0.3)' }}>Inflow</th>
                <th colSpan={3} style={{ padding:'10px 14px', fontFamily:'Inter', fontSize:11, fontWeight:700, color:'rgb(250,204,21)', textTransform:'uppercase', letterSpacing:0.8, textAlign:'center', background:'rgba(234,179,8,0.06)', borderBottom:'1px solid rgba(75,85,99,0.3)' }}>Net Flow</th>
              </tr>
              <tr>
                <th style={vbColTh('left', true)}>Vehicle</th>
                <th style={vbColTh('right')}>Mkt Opp</th>
                <th style={vbColTh('right')}>Yours</th>
                <th style={vbColTh('right', true)}>Mkt Share</th>
                <th style={vbColTh('right')}>Mkt Opp</th>
                <th style={vbColTh('right')}>Yours</th>
                <th style={vbColTh('right', true)}>Mkt Share</th>
                <th style={vbColTh('right')}>Mkt Opp</th>
                <th style={vbColTh('right')}>Yours</th>
                <th style={vbColTh('right')}>Mkt Share</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const v = VEHICLE_TYPES.find(x => x.code === r.code);
                return (
                  <tr key={i} className="vb-row" style={{ borderBottom:'1px solid rgba(75,85,99,0.2)' }}>
                    <td style={{ padding:'12px 14px', borderRight:'1px solid rgba(75,85,99,0.3)' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <span style={{
                          display:'inline-flex', alignItems:'center', justifyContent:'center',
                          width:36, height:20, borderRadius:4, background:v.bg, color:v.c,
                          fontFamily:'Inter', fontSize:10, fontWeight:700, letterSpacing:0.3,
                        }}>{v.code}</span>
                        <span style={{ fontFamily:'Inter', fontWeight:600, color:'rgb(232,237,243)' }}>{v.name}</span>
                      </div>
                    </td>
                    <VBCell val={r.aumOpp} dim />
                    <VBCell val={r.aumYours} bold />
                    <VBShare pct={r.aumShare} fillColor="rgb(52,211,153)" boundary />
                    <VBCell val={r.iOpp} dim />
                    <VBCell val={r.iYours} bold />
                    <VBShare pct={r.iShare} fillColor="rgb(96,165,250)" boundary />
                    <VBCell val={r.nOpp} dim />
                    <VBCell val={r.nYours} bold />
                    <VBShare pct={r.nShare} fillColor="rgb(250,204,21)" />
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{ padding:'12px 24px', borderTop:'1px solid rgba(75,85,99,0.3)', display:'flex', justifyContent:'space-between', alignItems:'center', fontFamily:'Inter', fontSize:11, color:'rgb(107,114,128)' }}>
          <div style={{ display:'flex', gap:14 }}>
            <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}><span style={{ width:9, height:9, borderRadius:9999, background:'rgb(52,211,153)' }} />AUM</span>
            <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}><span style={{ width:9, height:9, borderRadius:9999, background:'rgb(96,165,250)' }} />Inflow</span>
            <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}><span style={{ width:9, height:9, borderRadius:9999, background:'rgb(250,204,21)' }} />Net Flow</span>
          </div>
          <span>All figures in USD · Data as of Apr 24, 2026</span>
        </div>
      </div>
    </div>
  );
}

function vbColTh(align, boundary) {
  return {
    padding:'9px 14px', textAlign:align,
    fontFamily:'Inter', fontSize:10, fontWeight:600,
    color:'rgb(200,205,213)', textTransform:'uppercase', letterSpacing:0.5,
    background:'rgb(11,21,32)', borderBottom:'1px solid rgba(75,85,99,0.3)',
    borderRight: boundary ? '1px solid rgba(75,85,99,0.3)' : 'none',
    whiteSpace:'nowrap',
  };
}

function VBCell({ val, bold, dim }) {
  return <td style={{
    padding:'12px 14px', textAlign:'right', fontVariantNumeric:'tabular-nums',
    fontWeight: bold ? 700 : 400,
    color: bold ? 'rgb(232,237,243)' : dim ? 'rgb(136,153,170)' : 'rgb(209,213,219)',
  }}>{val}</td>;
}

function VBShare({ pct, fillColor, boundary }) {
  // Share bar visualizes pct relative to a reasonable max. For category vehicle breakdowns,
  // shares are typically 15–25% so we cap visual fill at 30 (was 3% which made everything full).
  const numeric = Math.min(parseFloat(pct), 30);
  const widthPct = Math.max(8, (numeric / 30) * 100);
  return (
    <td style={{ padding:'12px 14px', textAlign:'right', borderRight: boundary ? '1px solid rgba(75,85,99,0.3)' : 'none' }}>
      <div style={{ display:'inline-flex', flexDirection:'column', alignItems:'flex-end', gap:4 }}>
        <span style={{ fontFamily:'Inter', fontSize:11, fontWeight:600, color:'rgb(180,192,208)', fontVariantNumeric:'tabular-nums' }}>{pct}</span>
        <div style={{ width:64, height:4, background:'rgba(75,85,99,0.4)', borderRadius:2, overflow:'hidden' }}>
          <div style={{ width: `${widthPct}%`, height:'100%', background:fillColor, borderRadius:2 }} />
        </div>
      </div>
    </td>
  );
}

function buildVehicleRows(cat) {
  // Distribute the category's opp ($cat.opp) and yours ($cat.yours) across vehicles.
  // The vehicle breakdown totals equal the category totals exactly.
  const base = parseFloat(cat.opp.replace(/[^0-9.]/g,''));   // millions, from card
  const yourBase = parseFloat((cat.yours || cat.opp).replace(/[^0-9.]/g,'')) ||
                   base * (parseFloat((cat.share || '20%').replace(/[^0-9.]/g,''))/100 || 0.20);

  // Distribution across vehicles (must sum to 1.0 for opp and 1.0 for yours)
  const dist = [
    { code:'MF',   sOpp:0.48, sY:0.42 },
    { code:'ETF',  sOpp:0.20, sY:0.36 },
    { code:'SMA',  sOpp:0.16, sY:0.12 },
    { code:'PRIV', sOpp:0.10, sY:0.06 },
    { code:'CIT',  sOpp:0.04, sY:0.03 },
    { code:'ALT',  sOpp:0.02, sY:0.01 },
  ];

  // Render in $M (matches the card's units, no $B fakery)
  const fmt = (v) => {
    if (v >= 1000) return `$${(v/1000).toFixed(2)}B`;
    if (v >= 100)  return `$${v.toFixed(1)}M`;
    if (v >= 10)   return `$${v.toFixed(1)}M`;
    return `$${v.toFixed(2)}M`;
  };

  return dist.map(d => {
    const aumOppNum   = base * d.sOpp;
    const aumYoursNum = yourBase * d.sY;
    // Inflow ≈ 13.5% of AUM; Net ≈ 4.1% of AUM (matches card ratios for Large Growth: $4.8M/$38.2M = 12.6%, $2.4M/$38.2M = 6.3%)
    const iOppNum     = aumOppNum * 0.135;
    const iYoursNum   = aumYoursNum * 0.072;
    const nOppNum     = aumOppNum * 0.041;
    const nYoursNum   = aumYoursNum * 0.024;

    const sharePct = (a, b) => b === 0 ? '0.00%' : ((a / b) * 100).toFixed(2) + '%';

    return {
      code: d.code,
      aumOpp: fmt(aumOppNum), aumYours: fmt(aumYoursNum), aumShare: sharePct(aumYoursNum, aumOppNum),
      iOpp:   fmt(iOppNum),   iYours:   fmt(iYoursNum),   iShare:   sharePct(iYoursNum,   iOppNum),
      nOpp:   fmt(nOppNum),   nYours:   fmt(nYoursNum),   nShare:   sharePct(nYoursNum,   nOppNum),
      aumOppNum, aumYoursNum, iOppNum, iYoursNum, nOppNum, nYoursNum,
    };
  });
}

/* --- Firm Breakdown overlay (Platform › Vehicle › M★ Category) --- */
const FIRM_BREAKDOWN_DATA = {
  totals: {
    aum:   { opp:'$130B', yours:'$53.0B', share:'2.44%' },
    inflow:{ opp:'$10.4B', yours:'$4.8B',  share:'0.46%' },
    net:   { opp:'$3.5B',  yours:'$1.7B',  share:'0.49%' },
  },
  platforms: [
    {
      name:'Portfolio Management', accent:'rgb(52,211,153)',
      tot:{ aOpp:'$45.5B',aY:'$18.5B',aS:'2.70%', iOpp:'$3.6B',iY:'$1.7B',iS:'0.52%', nOpp:'$1.2B',nY:'$0.6B',nS:'0.55%' },
      vehicles:[
        { code:'MF', name:'Mutual Fund',
          tot:{ aOpp:'$18.2B',aY:'$7.4B',aS:'2.62%', iOpp:'$1.45B',iY:'$0.68B',iS:'0.49%', nOpp:'$0.48B',nY:'$0.24B',nS:'0.54%' },
          subs:[
            ['Large Growth','$7.5B','$3.2B','0.45%','$0.61B','$0.29B','0.48%','$0.20B','$0.11B','0.55%'],
            ['Large Blend','$6.3B','$2.6B','0.43%','$0.51B','$0.24B','0.49%','$0.17B','$0.09B','0.54%'],
            ['Intermediate Core Bond','$4.4B','$1.6B','0.36%','$0.33B','$0.15B','0.45%','$0.11B','$0.04B','0.36%'],
          ],
        },
        { code:'ETF', name:'Exchange Traded Fund',
          tot:{ aOpp:'$13.7B',aY:'$5.5B',aS:'2.57%', iOpp:'$1.08B',iY:'$0.52B',iS:'0.48%', nOpp:'$0.36B',nY:'$0.18B',nS:'0.50%' },
          subs:[
            ['Large Blend','$6.1B','$2.6B','0.43%','$0.49B','$0.24B','0.49%','$0.16B','$0.09B','0.56%'],
            ['Large Growth','$4.6B','$1.8B','0.39%','$0.36B','$0.17B','0.47%','$0.12B','$0.06B','0.50%'],
            ['Intermediate Core Bond','$3.0B','$1.1B','0.37%','$0.23B','$0.11B','0.48%','$0.08B','$0.03B','0.38%'],
          ],
        },
        { code:'PRIV', name:'Private Markets',
          tot:{ aOpp:'$13.6B',aY:'$5.6B',aS:'2.76%', iOpp:'$1.07B',iY:'$0.50B',iS:'0.47%', nOpp:'$0.36B',nY:'$0.18B',nS:'0.50%' },
          subs:[
            ['Private Equity','$5.8B','$2.4B','0.41%','$0.46B','$0.22B','0.48%','$0.15B','$0.08B','0.53%'],
            ['Private Credit','$4.8B','$2.0B','0.42%','$0.38B','$0.18B','0.47%','$0.13B','$0.07B','0.54%'],
            ['Real Estate','$3.0B','$1.2B','0.40%','$0.23B','$0.10B','0.43%','$0.08B','$0.03B','0.38%'],
          ],
        },
      ],
    },
    {
      name:'UMA FA Discretionary', accent:'rgb(96,165,250)',
      tot:{ aOpp:'$36.4B',aY:'$14.8B',aS:'2.49%', iOpp:'$2.9B',iY:'$1.3B',iS:'0.45%', nOpp:'$0.98B',nY:'$0.47B',nS:'0.48%' },
      vehicles:[
        { code:'MF', name:'Mutual Fund',
          tot:{ aOpp:'$14.6B',aY:'$5.9B',aS:'2.48%', iOpp:'$1.16B',iY:'$0.53B',iS:'0.46%', nOpp:'$0.39B',nY:'$0.19B',nS:'0.48%' },
          subs:[
            ['Large Growth','$6.0B','$2.5B','0.42%','$0.49B','$0.23B','0.47%','$0.16B','$0.09B','0.56%'],
            ['Intermediate Core Bond','$5.1B','$2.0B','0.39%','$0.41B','$0.18B','0.44%','$0.14B','$0.06B','0.43%'],
            ['Large Blend','$3.5B','$1.4B','0.40%','$0.26B','$0.12B','0.46%','$0.09B','$0.04B','0.44%'],
          ],
        },
        { code:'ETF', name:'Exchange Traded Fund',
          tot:{ aOpp:'$10.9B',aY:'$4.4B',aS:'2.49%', iOpp:'$0.87B',iY:'$0.40B',iS:'0.46%', nOpp:'$0.29B',nY:'$0.14B',nS:'0.48%' },
          subs:[
            ['Large Blend','$4.9B','$2.0B','0.41%','$0.39B','$0.19B','0.49%','$0.13B','$0.07B','0.54%'],
            ['Large Growth','$3.7B','$1.5B','0.41%','$0.29B','$0.14B','0.48%','$0.10B','$0.05B','0.50%'],
            ['Intermediate Core Bond','$2.3B','$0.9B','0.39%','$0.19B','$0.07B','0.37%','$0.06B','$0.02B','0.33%'],
          ],
        },
        { code:'SMA', name:'Separately Managed Acct',
          tot:{ aOpp:'$10.9B',aY:'$4.5B',aS:'2.52%', iOpp:'$0.87B',iY:'$0.37B',iS:'0.43%', nOpp:'$0.30B',nY:'$0.14B',nS:'0.47%' },
          subs:[
            ['Large Growth','$5.0B','$2.1B','0.42%','$0.40B','$0.18B','0.45%','$0.14B','$0.07B','0.50%'],
            ['Muni National Interm','$3.6B','$1.5B','0.42%','$0.29B','$0.12B','0.41%','$0.10B','$0.05B','0.50%'],
            ['Large Value','$2.3B','$0.9B','0.39%','$0.18B','$0.07B','0.39%','$0.06B','$0.02B','0.33%'],
          ],
        },
      ],
    },
    {
      name:'UMA Non-Discretionary', accent:'rgb(167,139,250)',
      tot:{ aOpp:'$28.6B',aY:'$11.7B',aS:'2.39%', iOpp:'$2.3B',iY:'$1.0B',iS:'0.43%', nOpp:'$0.77B',nY:'$0.37B',nS:'0.47%' },
      vehicles:[
        { code:'MF', name:'Mutual Fund',
          tot:{ aOpp:'$11.4B',aY:'$4.7B',aS:'2.43%', iOpp:'$0.92B',iY:'$0.42B',iS:'0.46%', nOpp:'$0.31B',nY:'$0.15B',nS:'0.48%' },
          subs:[
            ['Large Blend','$4.7B','$2.0B','0.43%','$0.38B','$0.18B','0.47%','$0.13B','$0.06B','0.46%'],
            ['Large Growth','$4.0B','$1.7B','0.43%','$0.32B','$0.15B','0.47%','$0.11B','$0.06B','0.55%'],
            ['Intermediate Core Bond','$2.7B','$1.0B','0.37%','$0.22B','$0.09B','0.41%','$0.07B','$0.03B','0.43%'],
          ],
        },
        { code:'ETF', name:'Exchange Traded Fund',
          tot:{ aOpp:'$8.6B',aY:'$3.5B',aS:'2.44%', iOpp:'$0.69B',iY:'$0.32B',iS:'0.46%', nOpp:'$0.23B',nY:'$0.12B',nS:'0.52%' },
          subs:[
            ['Large Blend','$3.9B','$1.6B','0.41%','$0.31B','$0.14B','0.45%','$0.10B','$0.06B','0.60%'],
            ['Large Growth','$2.8B','$1.2B','0.43%','$0.22B','$0.11B','0.50%','$0.08B','$0.04B','0.50%'],
            ['Muni National Interm','$1.9B','$0.7B','0.37%','$0.16B','$0.07B','0.44%','$0.05B','$0.02B','0.40%'],
          ],
        },
        { code:'SMA', name:'Separately Managed Acct',
          tot:{ aOpp:'$8.6B',aY:'$3.5B',aS:'2.31%', iOpp:'$0.69B',iY:'$0.28B',iS:'0.41%', nOpp:'$0.23B',nY:'$0.10B',nS:'0.43%' },
          subs:[
            ['Large Growth','$4.0B','$1.6B','0.40%','$0.32B','$0.13B','0.41%','$0.11B','$0.05B','0.45%'],
            ['Large Value','$2.8B','$1.1B','0.39%','$0.22B','$0.09B','0.41%','$0.07B','$0.03B','0.43%'],
            ['Muni National Interm','$1.8B','$0.8B','0.44%','$0.15B','$0.06B','0.40%','$0.05B','$0.02B','0.40%'],
          ],
        },
      ],
    },
    {
      name:'Consulting & Evaluation', accent:'rgb(251,146,60)',
      tot:{ aOpp:'$19.5B',aY:'$8.0B',aS:'2.41%', iOpp:'$1.6B',iY:'$0.8B',iS:'0.45%', nOpp:'$0.55B',nY:'$0.26B',nS:'0.47%' },
      vehicles:[
        { code:'MF', name:'Mutual Fund',
          tot:{ aOpp:'$9.8B',aY:'$4.0B',aS:'2.43%', iOpp:'$0.78B',iY:'$0.36B',iS:'0.46%', nOpp:'$0.27B',nY:'$0.13B',nS:'0.48%' },
          subs:[
            ['Large Growth','$4.2B','$1.7B','0.41%','$0.34B','$0.16B','0.47%','$0.12B','$0.06B','0.50%'],
            ['Large Blend','$3.4B','$1.4B','0.42%','$0.27B','$0.13B','0.47%','$0.09B','$0.05B','0.55%'],
            ['Intermediate Core Bond','$2.2B','$0.9B','0.39%','$0.17B','$0.07B','0.40%','$0.06B','$0.02B','0.33%'],
          ],
        },
        { code:'ETF', name:'Exchange Traded Fund',
          tot:{ aOpp:'$5.9B',aY:'$2.4B',aS:'2.47%', iOpp:'$0.47B',iY:'$0.22B',iS:'0.46%', nOpp:'$0.16B',nY:'$0.08B',nS:'0.50%' },
          subs:[
            ['Large Blend','$2.6B','$1.1B','0.42%','$0.21B','$0.10B','0.47%','$0.07B','$0.04B','0.57%'],
            ['Large Growth','$2.0B','$0.8B','0.40%','$0.16B','$0.08B','0.50%','$0.05B','$0.03B','0.60%'],
          ],
        },
        { code:'SMA', name:'Separately Managed Acct',
          tot:{ aOpp:'$3.8B',aY:'$1.6B',aS:'2.42%', iOpp:'$0.30B',iY:'$0.13B',iS:'0.43%', nOpp:'$0.10B',nY:'$0.05B',nS:'0.50%' },
          subs:[
            ['Large Growth','$1.7B','$0.7B','0.41%','$0.14B','$0.06B','0.43%','$0.05B','$0.02B','0.40%'],
            ['Muni National Interm','$1.3B','$0.6B','0.46%','$0.10B','$0.04B','0.40%','$0.04B','$0.02B','0.50%'],
          ],
        },
      ],
    },
  ],
};

/* Fabrikam Financial-specific data — they share mutual fund data only.
   No platform breakout; ETF / SMA / Privates shown as blank rows. */
const WELLS_FARGO_DATA = {
  totals: {
    aum:   { opp:'$107B', yours:'$39.5B', share:'2.16%' },
    inflow:{ opp:'$8.6B', yours:'$3.6B',  share:'0.42%' },
    net:   { opp:'$2.9B', yours:'$1.3B',  share:'0.45%' },
  },
  vehicles: [
    { code:'MF', name:'Mutual Fund',
      tot:{ aOpp:'$107B',aY:'$39.5B',aS:'2.16%', iOpp:'$8.6B',iY:'$3.6B',iS:'0.42%', nOpp:'$2.9B',nY:'$1.3B',nS:'0.45%' },
      subs:[
        ['Large Value','$36.5B','$13.4B','0.42%','$2.9B','$1.2B','0.43%','$1.0B','$0.45B','0.45%'],
        ['Intermediate Core-Plus','$26.8B','$9.9B','0.40%','$2.1B','$0.9B','0.41%','$0.72B','$0.32B','0.44%'],
        ['Foreign Large Blend','$24.1B','$8.9B','0.39%','$1.9B','$0.8B','0.42%','$0.65B','$0.30B','0.47%'],
        ['Muni National Long','$19.6B','$7.3B','0.40%','$1.7B','$0.7B','0.43%','$0.53B','$0.23B','0.43%'],
      ],
    },
    { code:'ETF',  name:'Exchange Traded Fund',   blank:true },
    { code:'SMA',  name:'Separately Managed Acct', blank:true },
    { code:'PRIV', name:'Privates',                 blank:true },
  ],
};

function FirmBreakdownOverlay({ firm, onClose }) {
  if (!firm) return null;
  const isWF = firm.name === 'Fabrikam Financial';
  const D = isWF ? WELLS_FARGO_DATA : FIRM_BREAKDOWN_DATA;
  // Scale per firm: use firm's yours vs Contoso Wealth benchmark (53.0B).
  // WF data is already at its native scale, so don't rescale.
  const yoursNum = parseFloat(firm.yours.replace(/[^0-9.]/g, ''));
  const scale = isWF ? 1 : yoursNum / 53.0;

  const scaleStr = (s) => {
    if (!s || s === '—') return s;
    const sign = s.startsWith('+') ? '+' : s.startsWith('-') ? '-' : '';
    const num = parseFloat(s.replace(/[^0-9.]/g, ''));
    const unit = s.includes('T') ? 'T' : s.includes('B') ? 'B' : 'M';
    if (s.includes('%')) return s;
    const v = num * scale;
    const fmt = v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(1) : v.toFixed(2);
    return `${sign}$${fmt}${unit}`;
  };
  const ss = (s) => s.includes('%') ? s : scaleStr(s);

  return (
    <div onClick={onClose} style={{
      position:'fixed', inset:0, background:'rgba(5,10,18,0.78)', backdropFilter:'blur(8px)',
      display:'flex', alignItems:'center', justifyContent:'center', zIndex:200,
      animation:'vbFade .18s ease-out',
    }}>
      <style>{`
        .fb-row:hover td { background: rgba(255,255,255,0.03) !important; }
      `}</style>
      <div onClick={(e) => e.stopPropagation()} style={{
        width:'min(1320px, 95vw)', maxHeight:'90vh',
        background:'rgb(13,20,32)', border:'1px solid rgba(75,85,99,0.5)',
        borderRadius:14, boxShadow:'0 40px 120px rgba(0,0,0,0.6)',
        display:'flex', flexDirection:'column',
        animation:'vbScale .22s cubic-bezier(.2,.8,.2,1)', overflow:'hidden',
      }}>
        {/* Header */}
        <div style={{ padding:'18px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid rgba(75,85,99,0.3)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <div style={{
              width:44, height:44, borderRadius:6, background:'rgba(30,41,59,0.8)',
              border:'1px solid rgba(75,85,99,0.5)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontFamily:'Inter', fontSize:11, fontWeight:700, color:'rgb(180,192,208)',
              letterSpacing:0.4,
            }}>{firm.badge || firm.name?.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}</div>
            <div>
              <h1 style={{ fontFamily:'Geist, Inter', fontWeight:700, fontSize:22, color:'rgb(249,250,251)', letterSpacing:-0.3 }}>{firm.name}</h1>
              <div style={{ fontFamily:'Inter', fontSize:12, color:'rgb(107,114,128)', marginTop:2 }}>Firm · Breakdown by {isWF ? 'Vehicle › Morningstar Category' : 'Platform › Vehicle › Morningstar Category'}</div>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ background:'rgba(30,41,59,0.6)', border:'1px solid rgba(75,85,99,0.4)', color:'rgb(163,163,163)', fontFamily:'Inter', fontSize:11, padding:'5px 12px', borderRadius:6 }}>As of Apr 2026</span>
            <span style={{ background:'rgba(30,41,59,0.6)', border:'1px solid rgba(75,85,99,0.4)', color:'rgb(163,163,163)', fontFamily:'Inter', fontSize:11, padding:'5px 12px', borderRadius:6 }}>TTM</span>
            <button onClick={onClose} style={{
              width:30, height:30, borderRadius:6,
              border:'1px solid rgba(75,85,99,0.5)', background:'rgba(255,255,255,0.02)',
              color:'rgb(163,163,163)', cursor:'pointer',
              display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:14,
            }}><i className="fa-solid fa-xmark" /></button>
          </div>
        </div>

        {/* Summary ribbon */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', borderBottom:'1px solid rgba(75,85,99,0.3)' }}>
          {[
            { kind:'AUM',     accent:'rgb(52,211,153)', opp:scaleStr(firm.mkt || D.totals.aum.opp), yours:scaleStr(firm.yours || D.totals.aum.yours), share:firm.share || D.totals.aum.share },
            { kind:'INFLOW',  accent:'rgb(96,165,250)', opp:scaleStr(D.totals.inflow.opp), yours:scaleStr(D.totals.inflow.yours), share:D.totals.inflow.share },
            { kind:'NET FLOW',accent:'rgb(250,204,21)', opp:scaleStr(D.totals.net.opp),    yours:scaleStr(D.totals.net.yours),    share:D.totals.net.share },
          ].map((s, i) => (
            <div key={i} style={{ padding:'18px 24px', borderRight: i<2 ? '1px solid rgba(75,85,99,0.3)' : 'none', position:'relative' }}>
              <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:s.accent }} />
              <div style={{ fontFamily:'Inter', fontSize:11, fontWeight:700, letterSpacing:0.8, color:s.accent, marginBottom:14 }}>{s.kind}</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14 }}>
                {[['Mkt Opp', s.opp], [s.kind === 'AUM' ? 'Yours' : (s.kind === 'INFLOW' ? 'Inflows' : 'Net Flows'), s.yours], ['Mkt Share', s.share]].map(([l, v], j) => (
                  <div key={j}>
                    <div style={{ fontFamily:'Inter', fontSize:10, color:'rgb(200,205,213)', textTransform:'uppercase', letterSpacing:0.4 }}>{l}</div>
                    <div style={{ fontFamily:'Inter Display, Inter', fontSize:20, fontWeight:700, color:'rgb(249,250,251)', letterSpacing:-0.4, marginTop:3, fontVariantNumeric:'tabular-nums' }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Hierarchical table */}
        <div style={{ flex:1, overflow:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontFamily:'Inter', fontSize:12.5 }}>
            <thead>
              <tr>
                <th style={{ width:360, padding:'10px 14px', borderBottom:'1px solid rgba(75,85,99,0.3)', borderRight:'1px solid rgba(75,85,99,0.3)', background:'rgb(11,21,32)', position:'sticky', top:0, zIndex:1 }}></th>
                <th colSpan={3} style={{ padding:'10px 14px', fontFamily:'Inter', fontSize:11, fontWeight:700, color:'rgb(52,211,153)', textTransform:'uppercase', letterSpacing:0.8, textAlign:'center', background:'linear-gradient(rgba(16,185,129,0.07), rgba(16,185,129,0.07)), rgb(11,21,32)', borderBottom:'1px solid rgba(75,85,99,0.3)', borderRight:'1px solid rgba(75,85,99,0.3)', position:'sticky', top:0, zIndex:1 }}>AUM</th>
                <th colSpan={3} style={{ padding:'10px 14px', fontFamily:'Inter', fontSize:11, fontWeight:700, color:'rgb(96,165,250)', textTransform:'uppercase', letterSpacing:0.8, textAlign:'center', background:'linear-gradient(rgba(59,130,246,0.07), rgba(59,130,246,0.07)), rgb(11,21,32)', borderBottom:'1px solid rgba(75,85,99,0.3)', borderRight:'1px solid rgba(75,85,99,0.3)', position:'sticky', top:0, zIndex:1 }}>Inflow</th>
                <th colSpan={3} style={{ padding:'10px 14px', fontFamily:'Inter', fontSize:11, fontWeight:700, color:'rgb(250,204,21)', textTransform:'uppercase', letterSpacing:0.8, textAlign:'center', background:'linear-gradient(rgba(234,179,8,0.07), rgba(234,179,8,0.07)), rgb(11,21,32)', borderBottom:'1px solid rgba(75,85,99,0.3)', position:'sticky', top:0, zIndex:1 }}>Net Flow</th>
              </tr>
              <tr>
                <th style={fbColTh('left', true)}>{isWF ? 'Vehicle › Category' : 'Platform › Vehicle › Category'}</th>
                <th style={fbColTh('right')}>Mkt Opp</th>
                <th style={fbColTh('right')}>Yours</th>
                <th style={fbColTh('right', true)}>Mkt Share</th>
                <th style={fbColTh('right')}>Mkt Opp</th>
                <th style={fbColTh('right')}>Yours</th>
                <th style={fbColTh('right', true)}>Mkt Share</th>
                <th style={fbColTh('right')}>Mkt Opp</th>
                <th style={fbColTh('right')}>Yours</th>
                <th style={fbColTh('right')}>Mkt Share</th>
              </tr>
            </thead>
            <tbody>
              {isWF ? (
                /* Fabrikam Financial: flat vehicle rows (no platform grouping).
                   Only MF has data; ETF/SMA/PRIV show blank "—" cells. */
                D.vehicles.map((v, vi) => (
                  <React.Fragment key={vi}>
                    <tr style={{ borderTop:'1px solid rgba(75,85,99,0.45)', borderBottom:'1px solid rgba(75,85,99,0.2)' }}>
                      <td style={{ padding:'12px 14px', background:'rgba(30,41,59,0.55)', borderRight:'1px solid rgba(75,85,99,0.45)' }}>
                        <span style={{ display:'inline-flex', alignItems:'center', gap:10 }}>
                          {fbBadge(v.code)}
                          <span style={{ fontFamily:'Inter', fontWeight:700, fontSize:13, color: v.blank ? 'rgb(136,153,170)' : 'rgb(232,237,243)' }}>{v.name}</span>
                          {v.blank && (
                            <span style={{
                              padding:'2px 8px', borderRadius:9999, fontSize:9.5, fontWeight:600,
                              color:'rgb(136,153,170)', background:'rgba(75,85,99,0.25)',
                              border:'1px solid rgba(75,85,99,0.4)', letterSpacing:0.3, textTransform:'uppercase',
                            }}>Not shared</span>
                          )}
                        </span>
                      </td>
                      {v.blank
                        ? <WFBlankCells />
                        : fbCellsBold(v.tot, scaleStr)}
                    </tr>
                    {!v.blank && v.subs && v.subs.map((s, si) => (
                      <tr key={si} className="fb-row" style={{ borderBottom:'1px solid rgba(75,85,99,0.15)' }}>
                        <td style={{ padding:'9px 14px', borderRight:'1px solid rgba(75,85,99,0.3)' }}>
                          <div style={{ paddingLeft:30, color:'rgb(163,180,200)', fontSize:12.5, display:'flex', alignItems:'center', gap:8 }}>
                            <span style={{ width:5, height:5, borderRadius:9999, background:'rgb(86,103,120)' }} />
                            {s[0]}
                          </div>
                        </td>
                        <FBCell val={ss(s[1])} dim />
                        <FBCell val={ss(s[2])} bold />
                        <FBShareCell pct={s[3]} fillColor="rgb(52,211,153)" boundary />
                        <FBCell val={ss(s[4])} dim />
                        <FBCell val={ss(s[5])} bold />
                        <FBShareCell pct={s[6]} fillColor="rgb(96,165,250)" boundary />
                        <FBCell val={ss(s[7])} dim />
                        <FBCell val={ss(s[8])} bold />
                        <FBShareCell pct={s[9]} fillColor="rgb(250,204,21)" />
                      </tr>
                    ))}
                  </React.Fragment>
                ))
              ) : (
              D.platforms.map((p, pi) => (
                <React.Fragment key={pi}>
                  {/* Platform row */}
                  <tr style={{ borderTop:'1px solid rgba(75,85,99,0.45)', borderBottom:'1px solid rgba(75,85,99,0.45)' }}>
                    <td style={{ padding:'14px', background:'rgba(30,41,59,0.55)', borderRight:'1px solid rgba(75,85,99,0.45)' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <span style={{ width:4, height:22, borderRadius:2, background:p.accent }} />
                        <i className="fa-solid fa-chevron-down" style={{ fontSize:8, color:'rgb(136,153,170)' }} />
                        <span style={{ fontFamily:'Inter', fontWeight:700, fontSize:13, color:'rgb(232,237,243)' }}>{p.name}</span>
                      </div>
                    </td>
                    {fbCellsBold(p.tot, scaleStr)}
                  </tr>
                  {p.vehicles.map((v, vi) => (
                    <React.Fragment key={vi}>
                      {/* Vehicle row */}
                      <tr style={{ borderBottom:'1px solid rgba(75,85,99,0.2)' }}>
                        <td style={{ padding:'9px 14px 9px 28px', background:'rgba(20,29,39,0.7)', borderRight:'1px solid rgba(75,85,99,0.3)' }}>
                          <span style={{ display:'inline-flex', alignItems:'center', gap:10 }}>
                            {fbBadge(v.code)}
                            <span style={{ fontFamily:'Inter', fontWeight:600, color:'rgb(232,237,243)' }}>{v.name}</span>
                          </span>
                        </td>
                        {fbCellsVeh(v.tot, scaleStr)}
                      </tr>
                      {v.subs.map((s, si) => (
                        <tr key={si} className="fb-row" style={{ borderBottom:'1px solid rgba(75,85,99,0.15)' }}>
                          <td style={{ padding:'9px 14px', borderRight:'1px solid rgba(75,85,99,0.3)' }}>
                            <div style={{ paddingLeft:58, color:'rgb(163,180,200)', fontSize:12.5, display:'flex', alignItems:'center', gap:8 }}>
                              <span style={{ width:5, height:5, borderRadius:9999, background:'rgb(86,103,120)' }} />
                              {s[0]}
                            </div>
                          </td>
                          <FBCell val={ss(s[1])} dim />
                          <FBCell val={ss(s[2])} bold />
                          <FBShareCell pct={s[3]} fillColor="rgb(52,211,153)" boundary />
                          <FBCell val={ss(s[4])} dim />
                          <FBCell val={ss(s[5])} bold />
                          <FBShareCell pct={s[6]} fillColor="rgb(96,165,250)" boundary />
                          <FBCell val={ss(s[7])} dim />
                          <FBCell val={ss(s[8])} bold />
                          <FBShareCell pct={s[9]} fillColor="rgb(250,204,21)" />
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </React.Fragment>
              ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{ padding:'12px 24px', borderTop:'1px solid rgba(75,85,99,0.3)', display:'flex', justifyContent:'space-between', alignItems:'center', fontFamily:'Inter', fontSize:11, color:'rgb(107,114,128)' }}>
          <div style={{ display:'flex', gap:14 }}>
            <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}><span style={{ width:9, height:9, borderRadius:9999, background:'rgb(52,211,153)' }} />AUM</span>
            <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}><span style={{ width:9, height:9, borderRadius:9999, background:'rgb(96,165,250)' }} />Inflow</span>
            <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}><span style={{ width:9, height:9, borderRadius:9999, background:'rgb(250,204,21)' }} />Net Flow</span>
          </div>
          <span>All figures in USD · Data as of Apr 24, 2026</span>
        </div>
      </div>
    </div>
  );
}

function fbColTh(align, boundary) {
  return {
    padding:'9px 14px', textAlign:align,
    fontFamily:'Inter', fontSize:10, fontWeight:600,
    color:'rgb(200,205,213)', textTransform:'uppercase', letterSpacing:0.5,
    background:'rgb(11,21,32)', borderBottom:'1px solid rgba(75,85,99,0.3)',
    borderRight: boundary ? '1px solid rgba(75,85,99,0.3)' : 'none',
    whiteSpace:'nowrap', position:'sticky', top:35, zIndex:1,
  };
}
function fbBadge(code) {
  const styleMap = {
    MF:   { bg:'rgba(59,130,246,0.18)', c:'rgb(110,168,254)' },
    ETF:  { bg:'rgba(16,185,129,0.18)', c:'rgb(52,211,153)' },
    SMA:  { bg:'rgba(234,179,8,0.18)',  c:'rgb(251,191,36)' },
    PRIV: { bg:'rgba(139,92,246,0.20)', c:'rgb(196,181,253)' },
  };
  const s = styleMap[code] || styleMap.MF;
  return <span style={{
    display:'inline-flex', alignItems:'center', justifyContent:'center',
    width:38, height:20, borderRadius:4, background:s.bg, color:s.c,
    fontFamily:'Inter', fontSize:10, fontWeight:700, letterSpacing:0.3,
  }}>{code}</span>;
}
function FBCell({ val, bold, dim }) {
  return <td style={{
    padding:'9px 14px', textAlign:'right', fontVariantNumeric:'tabular-nums',
    fontWeight: bold ? 700 : 400,
    color: bold ? 'rgb(232,237,243)' : dim ? 'rgb(136,153,170)' : 'rgb(209,213,219)',
  }}>{val}</td>;
}
function FBShareCell({ pct, fillColor, boundary }) {
  const numeric = Math.min(parseFloat(pct), 1);
  const widthPct = Math.max(8, (numeric / 1) * 100);
  return (
    <td style={{ padding:'9px 14px', textAlign:'right', borderRight: boundary ? '1px solid rgba(75,85,99,0.3)' : 'none' }}>
      <div style={{ display:'inline-flex', flexDirection:'column', alignItems:'flex-end', gap:3 }}>
        <span style={{ fontFamily:'Inter', fontSize:11, fontWeight:600, color:'rgb(180,192,208)', fontVariantNumeric:'tabular-nums' }}>{pct}</span>
        <div style={{ width:52, height:3, background:'rgba(75,85,99,0.4)', borderRadius:2, overflow:'hidden' }}>
          <div style={{ width:`${widthPct}%`, height:'100%', background:fillColor, borderRadius:2 }} />
        </div>
      </div>
    </td>
  );
}
function fbCellsBold(t, ss) {
  // Platform row — no bars, just emphasized values + plain share
  const cell = (val, bold, end) => (
    <td style={{
      padding:'14px', textAlign:'right', fontVariantNumeric:'tabular-nums',
      background:'rgba(30,41,59,0.55)',
      fontWeight: bold ? 700 : 400,
      color: bold ? 'rgb(232,237,243)' : 'rgb(136,153,170)',
      fontSize:13,
      borderRight: end ? '1px solid rgba(75,85,99,0.45)' : 'none',
    }}>{val}</td>
  );
  const share = (pct, end) => (
    <td style={{
      padding:'14px', textAlign:'right', background:'rgba(30,41,59,0.55)',
      borderRight: end ? '1px solid rgba(75,85,99,0.45)' : 'none',
    }}>
      <span style={{ fontFamily:'Inter', fontSize:12, fontWeight:600, color:'rgb(180,192,208)', fontVariantNumeric:'tabular-nums' }}>{pct}</span>
    </td>
  );
  return (<>
    {cell(ss(t.aOpp), false)}{cell(ss(t.aY), true)}{share(t.aS, true)}
    {cell(ss(t.iOpp), false)}{cell(ss(t.iY), true)}{share(t.iS, true)}
    {cell(ss(t.nOpp), false)}{cell(ss(t.nY), true)}{share(t.nS, false)}
  </>);
}
function WFBlankCells() {
  const dash = (key, end) => (
    <td key={key} style={{
      padding:'12px 14px', textAlign:'right',
      background:'rgba(30,41,59,0.55)',
      color:'rgb(95,106,122)', fontSize:13,
      borderRight: end ? '1px solid rgba(75,85,99,0.45)' : 'none',
    }}>—</td>
  );
  return (<>
    {dash(0)}{dash(1)}{dash(2, true)}
    {dash(3)}{dash(4)}{dash(5, true)}
    {dash(6)}{dash(7)}{dash(8)}
  </>);
}
function fbCellsVeh(t, ss) {
  const cell = (val, bold, end) => (
    <td style={{
      padding:'9px 14px', textAlign:'right', fontVariantNumeric:'tabular-nums',
      background:'rgba(20,29,39,0.7)',
      fontWeight: bold ? 700 : 400,
      color: bold ? 'rgb(232,237,243)' : 'rgb(136,153,170)',
      borderRight: end ? '1px solid rgba(75,85,99,0.3)' : 'none',
    }}>{val}</td>
  );
  const share = (pct, end) => (
    <td style={{
      padding:'9px 14px', textAlign:'right', background:'rgba(20,29,39,0.7)',
      borderRight: end ? '1px solid rgba(75,85,99,0.3)' : 'none',
    }}>
      <span style={{ fontFamily:'Inter', fontSize:11, fontWeight:600, color:'rgb(180,192,208)', fontVariantNumeric:'tabular-nums' }}>{pct}</span>
    </td>
  );
  return (<>
    {cell(ss(t.aOpp), false)}{cell(ss(t.aY), true)}{share(t.aS, true)}
    {cell(ss(t.iOpp), false)}{cell(ss(t.iY), true)}{share(t.iS, true)}
    {cell(ss(t.nOpp), false)}{cell(ss(t.nY), true)}{share(t.nS, false)}
  </>);
}

Object.assign(window, { OpportunityPage, VehicleBreakdownOverlay, FirmBreakdownOverlay, CompAdvOverlay, AdvDotButton, ALL_CATS });
