/* Competitive Advantage Dashboard */

// Each client has Total AUM, Total Comp Adv (which equals Perf + Fee), Inflow, Net
// All numbers in $M. The 5 top tiles are derived by summing the visible client rows
// so everything always ties.
const CLIENT_ADV_ROWS = [
  { name:'Mckenley Financial',         aum: 30.7, perf: 4.6, fee: 3.4, inflow: 41.4, net: 31.1, city:'Fort Worth',  st:'TX' },
  { name:'John Moore & Associates',    aum: 24.2, perf: 3.5, fee: 2.4, inflow: 32.6, net: 23.7, city:'Charlotte',   st:'NC' },
  { name:'Legacy Financial Holdings',  aum: 18.6, perf: 2.8, fee: 2.1, inflow: 24.3, net: 17.4, city:'Atlanta',     st:'GA' },
  { name:'Kaplan Wealth Mgmt.',        aum: 14.8, perf: 2.0, fee: 1.6, inflow: 19.1, net: 13.8, city:'Tampa',       st:'FL' },
  { name:'BVT Advisory Services',      aum: 12.2, perf: 1.7, fee: 1.3, inflow: 15.4, net: 11.0, city:'Boston',      st:'MA' },
  { name:'Aspen Financial Bros.',      aum: 10.4, perf: 1.5, fee: 1.1, inflow: 13.2, net:  9.4, city:'Denver',      st:'CO' },
  { name:'Wealth Management II',       aum:  8.8, perf: 1.3, fee: 0.9, inflow: 11.1, net:  8.0, city:'Phoenix',     st:'AZ' },
  { name:'Kilt Financial, LLC',        aum:  7.2, perf: 1.0, fee: 0.7, inflow:  9.0, net:  6.4, city:'Tampa',       st:'FL' },
  { name:'Jasper Ridge Partners',      aum: 22.9, perf: 3.2, fee: 2.2, inflow: 30.1, net: 21.4, city:'Fort Worth',  st:'TX' },
  { name:'Forge Financial',            aum: 17.4, perf: 2.4, fee: 1.9, inflow: 22.8, net: 16.2, city:'Edmond',      st:'OK' },
  { name:'Fisher Investments',         aum: 16.1, perf: 2.3, fee: 1.7, inflow: 20.4, net: 14.6, city:'Plano',       st:'TX' },
  { name:'Brogan Financial',           aum: 13.9, perf: 1.9, fee: 1.5, inflow: 17.6, net: 12.7, city:'Knoxville',   st:'TN' },
  { name:'Purshe Kaplan Sterling',     aum: 12.8, perf: 1.8, fee: 1.4, inflow: 16.2, net: 11.6, city:'Chicago',     st:'IL' },
  { name:'Empower Financial Adv.',     aum: 11.6, perf: 1.6, fee: 1.2, inflow: 14.7, net: 10.5, city:'Glastonbury', st:'CT' },
  { name:'Summit Advisory Partners',   aum:  9.7, perf: 1.4, fee: 1.0, inflow: 12.3, net:  8.8, city:'Seattle',     st:'WA' },
  { name:'Keystone Wealth Group',      aum:  8.1, perf: 1.1, fee: 0.8, inflow: 10.2, net:  7.3, city:'Pittsburgh',  st:'PA' },
  { name:'Harbor Point Advisors',      aum:  6.4, perf: 0.9, fee: 0.6, inflow:  8.1, net:  5.8, city:'Baltimore',   st:'MD' },
  { name:'Cedar Ridge Financial',      aum:  5.6, perf: 0.8, fee: 0.5, inflow:  7.0, net:  5.0, city:'Nashville',   st:'TN' },
  { name:'Lakeshore Wealth Mgmt.',     aum:  4.8, perf: 0.7, fee: 0.4, inflow:  6.1, net:  4.4, city:'Milwaukee',   st:'WI' },
];

// Numbers shown across the top: derived from rows so things always tie.
// Returns five tiles in this order: Total Comp Adv AUM | Perf Adv AUM | Fee Adv AUM | Total Inflow | Total Net Flow.
function aggregateKpis(rows) {
  const sum = (k) => rows.reduce((a, r) => a + (r[k] || 0), 0);
  // Round perf and fee to 1 decimal each so the displayed Total Comp Adv = displayed Perf + displayed Fee.
  // (Without this, fmtM's per-value rounding can introduce $0.1M drift.)
  const round1 = (v) => Math.round(v * 10) / 10;
  const perf = round1(sum('perf'));
  const fee  = round1(sum('fee'));
  const totalCompAdv = round1(perf + fee);
  return [
    { label:'TOTAL COMP ADV AUM', value: fmtM(totalCompAdv), sub:`${rows.length} Team${rows.length !== 1 ? 's' : ''}/FA · Perf + Fee` },
    { label:'PERF ADV AUM',        value: fmtM(perf),         sub:'↑ 6.2% YoY' },
    { label:'FEE ADV AUM',         value: fmtM(fee),          sub:'↑ 3.8% YoY' },
    { label:'INFLOWS',             value: fmtM(round1(sum('inflow'))), sub:'↑ 11.2% YoY' },
    { label:'NET FLOWS',           value: fmtM(round1(sum('net'))),    sub:'↑ 18.4% YoY' },
  ];
}

function fmtM(v) {
  if (v == null || isNaN(v)) return '—';
  if (v >= 1000) return `$${(v/1000).toFixed(1)}B`;
  if (v >= 100)  return `$${v.toFixed(0)}M`;
  return `$${v.toFixed(1)}M`;
}


/* Multi-select cross-filter: any number of Teams/FAs and any number of
   categories. A grid never filters itself — selections narrow the OTHER tiles. */
function advKpis(sel) {
  // Row-level picks (Team/FA × category) resolve to their distinct Teams/FAs.
  if (sel.rows.length > 0) {
    const names = new Set(sel.rows.map(k => k.split('|')[0]));
    const rows = CLIENT_ADV_ROWS.filter(r => names.has(r.name));
    if (rows.length) return aggregateKpis(rows);
  }
  if (sel.clients.length > 0) {
    const rows = CLIENT_ADV_ROWS.filter(r => sel.clients.includes(r.name));
    if (rows.length) return aggregateKpis(rows);
  }
  if (sel.cats.length > 0) {
    const holders = new Set(sel.cats.flatMap(c => CLIENTS_BY_CAT[c] || []));
    const rows = CLIENT_ADV_ROWS.filter(r => holders.has(r.name));
    if (rows.length) return aggregateKpis(rows);
  }
  return aggregateKpis(CLIENT_ADV_ROWS);
}

/* Build a ClientDetailPage-compatible row from a Team/FA advantage row so the
   drill-in opens the same profile the other dashboards use. */
function advClientRow(r) {
  const f = (v) => `$${v.toFixed(1)}M`;
  const oppM = r.aum / 0.19;   // your AUM is ~19% of the Mkt Opp
  const strong = r.perf + r.fee >= 5, mod = r.perf + r.fee >= 2.5;
  return {
    type:'Teams', name:r.name, firm:`${r.city || '—'}, ${r.st || '—'}`,
    adv: strong ? 'Strong' : mod ? 'Moderate' : 'Developing',
    advDot: strong ? 'rgb(52,211,153)' : mod ? 'rgb(250,204,21)' : 'rgb(248,113,113)',
    opp: f(oppM), yours: f(r.aum), share: `${(r.aum / oppM * 100).toFixed(1)}%`,
    iOpp: f(r.inflow / 0.18), iYours: f(r.inflow * 0.18), iShare:'18.0%',
    nOpp: '+' + f(r.net / 0.2), nYours: '+' + f(r.net * 0.2), nShare:'20.0%',
    ca: f(r.perf + r.fee), perf: f(r.perf), fee: f(r.fee),
    totInflow: f(r.inflow), netFlow: '+' + f(r.net),
  };
}

function AdvantagePage({ onSelectionsChange, onViewClient, focus }) {
  const [sel, setSel] = React.useState({ clients: [], cats: [], rows: [] });
  const toggleIn = (key, val) => setSel(prev => ({
    ...prev,
    [key]: prev[key].includes(val) ? prev[key].filter(x => x !== val) : [...prev[key], val],
  }));
  const onClientClick = (name) => toggleIn('clients', name);
  const onCatClick = (name) => toggleIn('cats', name);
  // The asset-class grid's own unit is a Team/FA × category ROW, so it selects
  // row identities — not the row's category, which would light up every row
  // sharing it.
  const onWideRowClick = (r) => toggleIn('rows', `${r.name}|${r.cat}`);

  // Focus strategies only: categories narrow to the focus strategies (kept to
  // the user's own picks where they overlap), and every tile reads from that.
  const focusCats = React.useMemo(() => Object.keys(CLIENTS_BY_CAT).filter(isFocusCat), [focus]);
  const selEff = React.useMemo(() => {
    if (!focus) return sel;
    const inter = sel.cats.filter(c => focusCats.includes(c));
    return { ...sel, cats: inter.length ? inter : focusCats };
  }, [sel, focus, focusCats]);
  const kpis = advKpis(selEff);

  // Report selections up to the top bar so they sit beside the page header and
  // nothing on the page shifts.
  React.useEffect(() => {
    if (!onSelectionsChange) return;
    const out = [
      ...sel.clients.map(c => ({ key:`client:${c}`, label:c, icon:'user-tie', onRemove: () => toggleIn('clients', c) })),
      ...sel.cats.map(c => ({ key:`cat:${c}`, label:c, icon:'layer-group', onRemove: () => toggleIn('cats', c) })),
      ...sel.rows.map(k => ({ key:`row:${k}`, label: k.replace('|', ' · '), icon:'table-cells', onRemove: () => toggleIn('rows', k) })),
    ];
    onSelectionsChange(out);
  }, [sel, onSelectionsChange]);

  return (
    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* 5 KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
        {kpis.map((k,i) => <AdvKpi key={i} label={k.label} value={k.value} sub={k.sub} />)}
      </div>

      {/* Top row: Team/FA view + asset class treemap */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Tile title="Team / FA" subtitle="All Teams / FAs by AUM · click rows to multi-select" right={<TabPillsLocal />} pad={0} style={{ minHeight: 260 }}>
          <ClientAdvTable sel={selEff} onRowClick={onClientClick} onViewClient={onViewClient} />
        </Tile>
        <Tile title="Asset Class by AUM" subtitle="Breakdown by category" right={<TabPillsLocal />} style={{ minHeight: 260 }}>
          <LargeTreemap sel={selEff} onCellClick={onCatClick} />
        </Tile>
      </div>

      {/* Team/FA asset-class level Comp Advantage - wide table */}
      <Tile title="Team / FA Asset Class" subtitle="Breakdown by category" right={
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          <i className="fa-solid fa-download" style={{ fontSize: 12, color:'rgb(163,163,163)' }} />
          <TabPills options={['Classes','Holds']} value={'Classes'} onChange={()=>{}} />
        </div>
      } pad={0} style={{ minHeight: 240 }}>
        <WideAdvTable sel={selEff} onRowClick={onWideRowClick} onViewClient={onViewClient} />
      </Tile>

      {/* Competitive Positioning Analysis - bubble chart */}
      <Tile title="Competitive Positioning Analysis" style={{ minHeight: 420 }}>
        <BubbleChartSection sel={selEff} onClientClick={onClientClick} />
      </Tile>

      {/* Rolling Performance */}
      <Tile title="Rolling Performance Comparison" style={{ minHeight: 220 }}>
        <RollingPerf />
      </Tile>

      {/* Fee Trends */}
      <Tile title="Fee Trends Over Time" style={{ minHeight: 300 }}>
        <FeeTrends />
      </Tile>
    </div>
  );
}

function TabPillsLocal() {
  const [v, setV] = React.useState('AUM');
  return <TabPills options={['AUM','Inflow','Net Flow']} labels={{Inflow:'Inflows','Net Flow':'Net Flows'}} value={v} onChange={setV} />;
}

function AdvKpi({ label, value, sub }) {
  return (
    <Tile pad={14}>
      <div style={{ fontFamily:'Inter', fontSize: 10, color:'rgb(200,205,213)', textTransform:'uppercase', letterSpacing:0.5, marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily:'Inter Display, Inter', fontWeight:700, fontSize: 22, color:'rgb(249,250,251)', fontVariantNumeric:'tabular-nums' }}>{value}</div>
      <div style={{ fontFamily:'Inter', fontSize: 10.5, color:'rgb(52,211,153)', marginTop: 4 }}>{sub}</div>
    </Tile>
  );
}

// Which clients hold each category (drives ClientAdvTable highlighting + wide-table cat view)
const CLIENTS_BY_CAT = {
  'Large Growth':            ['Mckenley Financial', 'John Moore & Associates', 'Legacy Financial Holdings', 'Aspen Financial Bros.'],
  'Large Value':             ['Mckenley Financial', 'Kaplan Wealth Mgmt.', 'BVT Advisory Services', 'Purshe Kaplan Sterling'],
  'Large Blend':             ['Mckenley Financial', 'John Moore & Associates', 'BVT Advisory Services', 'Empower Financial Adv.'],
  'Multi-sector Bond':       ['Mckenley Financial', 'Legacy Financial Holdings', 'Kilt Financial, LLC', 'Fisher Investments'],
  'Moderate Alloc.':         ['John Moore & Associates', 'Kaplan Wealth Mgmt.', 'Forge Financial', 'Brogan Financial'],
  'Moderate Allocation':     ['John Moore & Associates', 'Kaplan Wealth Mgmt.', 'Forge Financial', 'Brogan Financial'],
  'Mid-Cap Growth':          ['Aspen Financial Bros.', 'Wealth Management II'],
  'Small Blend':              ['Wealth Management II', 'Kilt Financial, LLC'],
  'Mid-Cap Value':           ['Kilt Financial, LLC'],
  'Div Emer Mrkts':          ['Aspen Financial Bros.', 'BVT Advisory Services'],
  'Intermediate Core Plus':  ['Mckenley Financial', 'Jasper Ridge Partners'],
  'Core Plus Municipal':     ['Mckenley Financial'],
};

// Shared table style constants (each Babel script has its own scope)
const tableStyle = { width:'100%', borderCollapse:'collapse', fontFamily:'Inter', fontSize:12 };
const thTr = {};
const th = { textAlign:'left', fontSize:10, fontWeight:500, color:'rgb(200,205,213)', letterSpacing:0.5, textTransform:'uppercase', padding:'10px 16px 8px' };
const thN = { ...th, textAlign:'right' };
const tdTr = { borderTop: '1px solid rgba(75,85,99,0.2)' };
const tdCell = { padding:'10px 16px', color:'rgb(209,213,219)' };
const tdN = { padding:'10px 16px', textAlign:'right', color:'rgb(163,163,163)', fontVariantNumeric:'tabular-nums' };
const tdNStrong = { ...tdN, color:'rgb(52,211,153)' };
// Compact variant for the wide Team/FA asset-class table: 17 columns fit the
// tile without a horizontal scroll by tightening padding and letting long
// header labels wrap onto two lines.
const wTh = { ...th, fontSize: 9, letterSpacing: 0.3, padding: '8px 5px 6px', whiteSpace: 'normal', lineHeight: 1.2, verticalAlign: 'bottom', position: 'sticky', top: 0, background: 'rgb(20,28,42)', zIndex: 1 };
const wThN = { ...wTh, textAlign: 'right' };
const wTdCell = { ...tdCell, padding: '8px 5px' };
const wTdN = { ...tdN, padding: '8px 5px', whiteSpace: 'nowrap' };
const wTdNStrong = { ...wTdN, color: 'rgb(52,211,153)' };

function ClientAdvTable({ sel, onRowClick, onViewClient }) {
  // Narrowed by category selections only — never by its own Team/FA selection,
  // so multi-select stays reachable.
  const rows = React.useMemo(() => {
    let list = [...CLIENT_ADV_ROWS];
    if (sel.cats.length) {
      const holders = new Set(sel.cats.flatMap(c => CLIENTS_BY_CAT[c] || []));
      list = list.filter(r => holders.has(r.name) || sel.clients.includes(r.name));
    }
    return list.sort((p,q) => q.aum - p.aum);
  }, [sel.cats, sel.clients]);
  return (
    <div style={{ overflow:'auto', height: 396 }}>
      <table style={tableStyle}>
        <thead style={{ position:'sticky', top:0, background:'rgb(20,28,42)', zIndex:1 }}>
          <tr style={thTr}>
            <th style={th}>TEAM/FA</th>
            <th style={thN}>AUM</th>
            <th style={thN}>TOTAL COMP ADV</th>
            <th style={thN}>PERF ADV</th>
            <th style={thN}>FEE ADV</th>
            <th style={thN}>INFLOWS</th>
            <th style={thN}>NET FLOWS</th>
            <th style={{ ...thN, width:34 }}></th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr><td colSpan={8} style={{ padding:'22px 16px', textAlign:'center', fontFamily:'Inter', fontSize:11.5, color:'rgb(107,114,128)' }}>
              No Teams/FAs match the current selection
            </td></tr>
          )}
          {rows.map((r,i) => {
            const on = sel.clients.includes(r.name);
            const compAdv = r.perf + r.fee;
            return (
              <tr
                key={i}
                onClick={() => onRowClick(r.name)}
                style={{
                  ...tdTr,
                  cursor:'pointer',
                  background: on ? 'rgba(16,185,129,0.10)' : 'transparent',
                  transition:'background .15s',
                }}
              >
                <td style={{...tdCell, borderLeft: on ? '3px solid rgb(16,185,129)' : '3px solid transparent'}}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{
                      width:12, height:12, borderRadius:3, flexShrink:0,
                      border:`1px solid ${on ? 'rgb(16,185,129)' : 'rgba(107,114,128,0.6)'}`,
                      background: on ? 'rgb(16,185,129)' : 'transparent',
                      display:'inline-flex', alignItems:'center', justifyContent:'center',
                    }}>{on && <i className="fa-solid fa-check" style={{ fontSize:6.5, color:'#fff' }} />}</span>
                    <span style={{ fontWeight: on ? 700 : 500, color:'rgb(249,250,251)', whiteSpace:'nowrap' }}>{r.name}</span>
                  </div>
                </td>
                <td style={tdNStrong}>{fmtM(r.aum)}</td>
                <td style={tdN}>{fmtM(compAdv)}</td>
                <td style={tdN}>{fmtM(r.perf)}</td>
                <td style={tdN}>{fmtM(r.fee)}</td>
                <td style={tdN}>{fmtM(r.inflow)}</td>
                <td style={tdN}>{fmtM(r.net)}</td>
                <td style={{ ...tdN, padding:'6px 10px', textAlign:'center' }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); onViewClient && onViewClient(advClientRow(r)); }}
                    title={`Open ${r.name} detail`}
                    style={{
                      width:26, height:24, padding:0, borderRadius:5, cursor:'pointer',
                      background:'rgba(96,165,250,0.10)', border:'1px solid rgba(96,165,250,0.35)',
                      color:'rgb(147,197,253)',
                      display:'inline-flex', alignItems:'center', justifyContent:'center',
                    }}
                  ><i className="fa-regular fa-eye" style={{ fontSize:11 }} /></button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// Treemap layouts — global (all clients) vs per-client view
const TREEMAP_GLOBAL = [
  { name:'Large Growth',      val:'$32.6M', color:'rgb(70,120,220)',  size:'lg' },
  { name:'Large Value',       val:'$24.2M', color:'rgb(90,140,230)',  size:'md' },
  { name:'Multi-sector Bond', val:'$18.6M', color:'rgb(160,140,230)', size:'sm' },
  { name:'Moderate Alloc.',   val:'$14.2M', color:'rgb(180,130,220)', size:'sm' },
  { name:'Large Blend',       val:'$12.8M', color:'rgb(80,140,220)',  size:'sm' },
  { name:'Mid-Cap Growth',    val:'$10.2M', color:'rgb(240,90,50)',   size:'sm' },
  { name:'Small Blend',       val:'$8.4M',  color:'rgb(249,115,22)',  size:'sm' },
  { name:'Mid-Cap Value',     val:'$7.6M',  color:'rgb(245,120,140)', size:'xs' },
  { name:'Div Emer Mrkts',    val:'$6.1M',  color:'rgb(20,184,166)',  size:'xs' },
];

// Per-client breakdowns (Mckenley + a couple others sketched in)
const TREEMAP_BY_CLIENT = {
  'Mckenley Financial': [
    { name:'Intermediate Core Plus', val:'$12.8M', color:'rgb(160,140,230)', size:'lg' },
    { name:'Large Blend',            val:'$8.4M',  color:'rgb(80,140,220)',  size:'md' },
    { name:'Core Plus Municipal',    val:'$4.2M',  color:'rgb(20,184,166)',  size:'sm' },
    { name:'Multi-sector Bond',      val:'$3.2M',  color:'rgb(160,140,230)', size:'sm' },
    { name:'Large Value',            val:'$2.1M',  color:'rgb(90,140,230)',  size:'sm' },
  ],
};

function LargeTreemap({ sel, onCellClick }) {
  // A single selected Team/FA drives a per-Team/FA breakdown; several show the book.
  const clientScope = sel.clients.length === 1 ? sel.clients[0] : null;

  if (clientScope) {
    // Use explicit per-client data if available, otherwise auto-generate from CLIENTS_BY_CAT
    let data = TREEMAP_BY_CLIENT[clientScope];
    if (!data) {
      const row = CLIENT_ADV_ROWS.find(r => r.name === clientScope);
      const cats = Object.entries(CLIENTS_BY_CAT)
        .filter(([cat, holders]) => holders.includes(clientScope))
        .map(([cat]) => cat);
      const list = cats.length > 0 ? cats : ['Large Blend','Large Growth','Multi-sector Bond'];
      const weights = [0.42, 0.26, 0.16, 0.10, 0.06];
      const totalW = list.slice(0, 5).reduce((s, _, i) => s + (weights[i] || 0.04), 0);
      const baseAum = (row && row.aum) || 20;
      data = list.slice(0, 5).map((cat, idx) => ({
        name: cat,
        val: `$${(baseAum * ((weights[idx] || 0.04) / totalW)).toFixed(1)}M`,
        color: CAT_COLOR[cat] || ['rgb(70,120,220)','rgb(160,140,230)','rgb(20,184,166)','rgb(180,130,220)','rgb(80,140,220)'][idx % 5],
      }));
    }
    while (data.length < 5) data.push({ name: '—', val: '—', color: 'rgba(75,85,99,0.3)' });
    return (
      <div style={{ height: 260, display:'grid', gridTemplateColumns:'2fr 1.3fr 1fr', gridTemplateRows:'1.4fr 1fr', gap: 6 }}>
        <TreeCellLg sel={sel} onClick={onCellClick} {...data[0]} size="lg" />
        <TreeCellLg sel={sel} onClick={onCellClick} {...data[1]} size="md" />
        <div style={{ display:'grid', gridTemplateRows:'1fr 1fr', gap:6 }}>
          <TreeCellLg sel={sel} onClick={onCellClick} {...data[2]} size="sm" />
          <TreeCellLg sel={sel} onClick={onCellClick} {...data[3]} size="sm" />
        </div>
        <TreeCellLg sel={sel} onClick={onCellClick} {...data[4]} size="sm" />
      </div>
    );
  }

  return (
    <div style={{ height: 260, display:'grid', gridTemplateColumns:'1.4fr 1fr 1.1fr', gridTemplateRows:'1.5fr 1fr', gap: 6 }}>
      <TreeCellLg sel={sel} onClick={onCellClick} color="rgb(70,120,220)" name="Large Growth" val="$32.6M" size="lg" />
      <TreeCellLg sel={sel} onClick={onCellClick} color="rgb(90,140,230)" name="Large Value" val="$24.2M" size="md" />
      <div style={{ display:'grid', gridTemplateRows:'1fr 1fr', gap:6 }}>
        <TreeCellLg sel={sel} onClick={onCellClick} color="rgb(160,140,230)" name="Multi-sector Bond" val="$18.6M" size="sm" />
        <TreeCellLg sel={sel} onClick={onCellClick} color="rgb(180,130,220)" name="Moderate Alloc." val="$14.2M" size="sm" />
      </div>

      <TreeCellLg sel={sel} onClick={onCellClick} color="rgb(80,140,220)" name="Large Blend" val="$12.8M" size="sm" />
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
        <TreeCellLg sel={sel} onClick={onCellClick} color="rgb(240,90,50)" name="Mid-Cap Growth" val="$10.2M" size="sm" />
        <TreeCellLg sel={sel} onClick={onCellClick} color="rgb(249,115,22)" name="Small Blend" val="$8.4M" size="sm" />
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
        <TreeCellLg sel={sel} onClick={onCellClick} color="rgb(245,120,140)" name="Mid-Cap Value" val="$7.6M" size="xs" />
        <TreeCellLg sel={sel} onClick={onCellClick} color="rgb(20,184,166)" name="Div Emer Mrkts" val="$6.1M" size="xs" />
      </div>
    </div>
  );
}

function TreeCellLg({ color, name, val, size, sel, onClick }) {
  const f = size === 'lg' ? 16 : size === 'md' ? 13 : size === 'sm' ? 11 : 10;
  const fv = size === 'lg' ? 22 : size === 'md' ? 17 : size === 'sm' ? 13 : 11;
  // Highlight on this cell's own selection. The treemap is the category grid,
  // so it never removes its own cells - multi-select stays reachable.
  const on = !!(sel && sel.cats.includes(name));
  return (
    <div
      onClick={() => onClick && onClick(name)}
      style={{
        background: color, borderRadius: 4, padding: 10,
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        color: 'rgba(255,255,255,0.95)', overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        outline: on ? '3px solid rgb(16,185,129)' : 'none',
        outlineOffset: on ? -3 : 0,
        transition:'opacity .15s, outline .15s',
      }}
    >
      <div style={{ fontFamily:'Inter', fontWeight:600, fontSize:f }}>{name}</div>
      <div style={{ fontFamily:'Inter Display, Inter', fontWeight:700, fontSize:fv, fontVariantNumeric:'tabular-nums' }}>{val}</div>
    </div>
  );
}

const CAT_COLOR = {
  'Intermediate Core Plus': 'rgb(160,140,230)',
  'Large Blend':            'rgb(80,140,220)',
  'Large Growth':           'rgb(70,120,220)',
  'Large Value':            'rgb(90,140,230)',
  'Multi-sector Bond':      'rgb(160,140,230)',
  'Moderate Allocation':    'rgb(180,130,220)',
  'Mid-Cap Growth':         'rgb(240,90,50)',
  'Core Plus Municipal':    'rgb(20,184,166)',
  'Div Emer Mrkts':         'rgb(20,184,166)',
  'Small Blend':            'rgb(249,115,22)',
  'Mid-Cap Value':          'rgb(245,120,140)',
};

const VEHICLE_COLOR = {
  'MF':  { bg:'rgba(139,92,246,0.18)', fg:'rgb(196,181,253)' },
  'ETF': { bg:'rgba(59,130,246,0.18)', fg:'rgb(147,197,253)' },
  'SMA': { bg:'rgba(52,211,153,0.18)', fg:'rgb(110,231,183)' },
  'CIT': { bg:'rgba(234,179,8,0.18)',  fg:'rgb(253,224,71)'  },
  'MM':  { bg:'rgba(20,184,166,0.18)', fg:'rgb(94,234,212)'  },
};

// Default rows: one row per client across various vehicles
const WIDE_DEFAULT = [
  { name:'Jasper Ridge Partners',  city:'Fort Worth',  st:'TX', vehicle:'MF',  cat:'Intermediate Core Plus', aum:'$368.4M', perfAdv:'$0.0M', wtd:'3.1', wtdDir:'↑', perfVar:'0.0', feeAdv:'$0.0M', fee:'25.0', feeVar:'0.0', infl:'$55.4M', outfl:'($87.8M)', net:'($32.4M)', mgrs:5, rank:10 },
  { name:'Empower Financial Adv.', city:'Glastonbury', st:'CT', vehicle:'ETF', cat:'Large Blend',            aum:'$199.7M', perfAdv:'$0.0M', wtd:'1.6', wtdDir:'↑', perfVar:'-2.0', feeAdv:'$0.6M', fee:'81.0', feeVar:'36.0', infl:'$31.1M', outfl:'($11.2M)', net:'$19.9M', mgrs:6, rank:3 },
  { name:'Mckenley Financial',     city:'Fort Worth',  st:'TX', vehicle:'ETF', cat:'Large Blend',            aum:'$84.6M',  perfAdv:'$1.6M', wtd:'6.2', wtdDir:'↑', perfVar:'1.6',  feeAdv:'$0.2M', fee:'42.0', feeVar:'2.0',  infl:'$14.2M', outfl:'($3.8M)',  net:'$10.4M', mgrs:7,  rank:1 },
  { name:'John Moore & Associates',city:'Charlotte',   st:'NC', vehicle:'MF',  cat:'Large Blend',            aum:'$62.3M',  perfAdv:'$3.4M', wtd:'4.8', wtdDir:'↑', perfVar:'0.9',  feeAdv:'$0.4M', fee:'58.0', feeVar:'12.0', infl:'$9.6M',  outfl:'($4.1M)',  net:'$5.5M',  mgrs:9,  rank:2 },
  { name:'BVT Advisory Services',  city:'Boston',      st:'MA', vehicle:'SMA', cat:'Large Blend',            aum:'$48.1M',  perfAdv:'$0.0M', wtd:'2.1', wtdDir:'↑', perfVar:'-0.4', feeAdv:'$0.0M', fee:'35.0', feeVar:'-2.0', infl:'$7.2M',  outfl:'($2.0M)',  net:'$5.2M',  mgrs:5,  rank:4 },
  { name:'Aspen Financial Bros.',  city:'Denver',      st:'CO', vehicle:'CIT', cat:'Large Blend',            aum:'$31.8M',  perfAdv:'$2.1M', wtd:'3.4', wtdDir:'↑', perfVar:'0.2',  feeAdv:'$0.1M', fee:'48.0', feeVar:'6.0',  infl:'$5.4M',  outfl:'($3.2M)',  net:'$2.2M',  mgrs:6,  rank:5 },
  { name:'Kilt Financial, LLC',    city:'Tampa',       st:'FL', vehicle:'ETF', cat:'Large Blend',            aum:'$22.4M',  perfAdv:'$0.0M', wtd:'1.8', wtdDir:'↓', perfVar:'-1.2', feeAdv:'$0.0M', fee:'29.0', feeVar:'-4.0', infl:'$2.8M',  outfl:'($4.6M)',  net:'($1.8M)',mgrs:4,  rank:6 },
  { name:'Wealth Management II',   city:'Phoenix',     st:'AZ', vehicle:'MF',  cat:'Large Blend',            aum:'$18.6M',  perfAdv:'$1.2M', wtd:'2.9', wtdDir:'↑', perfVar:'0.6',  feeAdv:'$0.2M', fee:'52.0', feeVar:'8.0',  infl:'$3.4M',  outfl:'($1.1M)',  net:'$2.3M',  mgrs:5,  rank:7 },
  { name:'Legacy Financial Hold.', city:'Atlanta',     st:'GA', vehicle:'SMA', cat:'Large Blend',            aum:'$14.2M',  perfAdv:'$0.0M', wtd:'1.4', wtdDir:'↑', perfVar:'-1.6', feeAdv:'$0.0M', fee:'31.0', feeVar:'-3.0', infl:'$2.1M',  outfl:'($0.8M)',  net:'$1.3M',  mgrs:3,  rank:8 },
  { name:'Forge Financial',        city:'Edmond',      st:'OK', vehicle:'SMA', cat:'Moderate Allocation',    aum:'$172.7M', perfAdv:'$0.0M', wtd:'1.6', wtdDir:'↑', perfVar:'-1.8', feeAdv:'$0.0M', fee:'22.0', feeVar:'-3.0', infl:'$24.8M', outfl:'($5.7M)',  net:'$19.1M', mgrs:8, rank:5 },
  { name:'Fisher Investments',     city:'Plano',       st:'TX', vehicle:'CIT', cat:'Multi-sector Bond',      aum:'$110.4M', perfAdv:'$8.2M', wtd:'0.3', wtdDir:'↓', perfVar:'-1.8', feeAdv:'$0.0M', fee:'25.0', feeVar:'0.0', infl:'$0.6M',  outfl:'($0.4M)',  net:'$0.2M',  mgrs:7, rank:5 },
  { name:'Brogan Financial',       city:'Knoxville',   st:'TN', vehicle:'MF',  cat:'Moderate Allocation',    aum:'$108.5M', perfAdv:'$0.0M', wtd:'1.2', wtdDir:'↑', perfVar:'-2.4', feeAdv:'$0.0M', fee:'35.0', feeVar:'8.2', infl:'$14.3M', outfl:'($9.2M)',  net:'$5.0M',  mgrs:8, rank:5 },
  { name:'Purshe Kaplan Sterling', city:'Chicago',     st:'IL', vehicle:'ETF', cat:'Large Value',            aum:'$98.2M',  perfAdv:'$0.0M', wtd:'2.8', wtdDir:'↑', perfVar:'1.2',  feeAdv:'$0.0M', fee:'42.0', feeVar:'5.0', infl:'$106.2M', outfl:'($24.3M)', net:'$82.0M', mgrs:13, rank:1 },
];

// Per-client breakdown — when a client is selected, show their asset class breakdown across vehicles
const WIDE_BY_CLIENT = {
  'Mckenley Financial': [
    { name:'Mckenley Financial', city:'Fort Worth', st:'TX', vehicle:'MF',  cat:'Intermediate Core Plus', aum:'$12.8M', perfAdv:'$2.4M', wtd:'4.5', wtdDir:'↑', perfVar:'1.8',  feeAdv:'$0.4M', fee:'45.0', feeVar:'-12.0', infl:'$4.2M',  outfl:'($1.2M)', net:'$3.0M',  mgrs:3, rank:2 },
    { name:'Mckenley Financial', city:'Fort Worth', st:'TX', vehicle:'ETF', cat:'Large Blend',            aum:'$8.4M',  perfAdv:'$1.6M', wtd:'6.2', wtdDir:'↑', perfVar:'1.6',  feeAdv:'$0.2M', fee:'45.0', feeVar:'-8.0',  infl:'$8.0M',  outfl:'($2.1M)', net:'$5.9M',  mgrs:2, rank:1 },
    { name:'Mckenley Financial', city:'Fort Worth', st:'TX', vehicle:'SMA', cat:'Core Plus Municipal',    aum:'$4.2M',  perfAdv:'$1.8M', wtd:'5.8', wtdDir:'↑', perfVar:'1.3',  feeAdv:'$0.3M', fee:'47.0', feeVar:'-5.0',  infl:'$8.2M',  outfl:'($0.8M)', net:'$7.4M',  mgrs:2, rank:3 },
    { name:'Mckenley Financial', city:'Fort Worth', st:'TX', vehicle:'MF',  cat:'Multi-sector Bond',      aum:'$3.2M',  perfAdv:'$1.2M', wtd:'5.1', wtdDir:'↑', perfVar:'1.1',  feeAdv:'$0.1M', fee:'32.0', feeVar:'-2.0',  infl:'$4.8M',  outfl:'($1.0M)', net:'$3.8M',  mgrs:1, rank:4 },
    { name:'Mckenley Financial', city:'Fort Worth', st:'TX', vehicle:'CIT', cat:'Large Value',            aum:'$2.1M',  perfAdv:'$1.0M', wtd:'5.0', wtdDir:'↓', perfVar:'-2.4', feeAdv:'$0.0M', fee:'38.0', feeVar:'4.0',   infl:'$16.2M', outfl:'($5.2M)', net:'$11.0M', mgrs:2, rank:6 },
  ],
};

// Build a synthetic per-client breakdown for clients without a hand-crafted entry.
// Uses TREEMAP_BY_CLIENT if available, otherwise falls back to CLIENTS_BY_CAT.
function buildClientBreakdown(clientName) {
  if (WIDE_BY_CLIENT[clientName]) return WIDE_BY_CLIENT[clientName];
  const row = CLIENT_ADV_ROWS.find(r => r.name === clientName);
  if (!row) return [];
  // Find the cats this client holds
  const cats = Object.entries(CLIENTS_BY_CAT)
    .filter(([cat, holders]) => holders.includes(clientName))
    .map(([cat]) => cat);
  const list = cats.length > 0 ? cats : ['Large Blend','Large Growth','Multi-sector Bond'];
  // Distribute the client's total AUM across their cats: 40%, 24%, 14%, 10%, 7%, 5%…
  const weights = [0.40, 0.24, 0.14, 0.10, 0.07, 0.05, 0.03, 0.02];
  const total = list.reduce((sum, _, i) => sum + (weights[i] || 0.02), 0);
  return list.map((cat, idx) => {
    const w = (weights[idx] || 0.02) / total;
    const aumNum = row.aum * w;
    const perfNum = row.perf * w;
    const feeNum = row.fee * w;
    const inflNum = row.inflow * w;
    const netNum = row.net * w;
    const outflNum = inflNum - netNum;
    return {
      name: row.name, city: row.city || '—', st: row.st || '—',
      vehicle: ['MF','ETF','SMA','CIT','PRIV'][idx % 5], cat,
      aum: `$${aumNum.toFixed(1)}M`,
      perfAdv: `$${perfNum.toFixed(1)}M`,
      wtd: (3 + idx*0.3).toFixed(1),
      wtdDir: idx === 0 ? '↑' : (idx % 4 === 3 ? '↓' : '↑'),
      perfVar: (1.4 - idx*0.4).toFixed(1),
      feeAdv: `$${feeNum.toFixed(1)}M`,
      fee: (40 + idx*3).toFixed(1),
      feeVar: (idx*2 - 6).toFixed(1),
      infl: `$${inflNum.toFixed(1)}M`,
      outfl: `($${outflNum.toFixed(1)}M)`,
      net: `$${netNum.toFixed(1)}M`,
      mgrs: 3 + idx,
      rank: idx + 1,
    };
  });
}

function WideAdvTable({ sel, onRowClick, onViewClient }) {
  // Cross-product grid (Team/FA x category), so both selections narrow it.
  const clientScope = sel.clients.length === 1 ? sel.clients[0] : null;
  let rows;
  if (clientScope) {
    // Always show ONLY the selected client's rows — never mix with other clients' rows
    rows = buildClientBreakdown(clientScope);
    // If categories are also selected, narrow further
    if (sel.cats.length) rows = rows.filter(r => sel.cats.includes(r.cat));
  } else if (sel.clients.length > 1) {
    // Several Teams/FAs picked: concatenate each one's breakdown.
    rows = sel.clients.flatMap(n => buildClientBreakdown(n));
    if (sel.cats.length) rows = rows.filter(r => sel.cats.includes(r.cat));
  } else if (sel.cats.length) {
    // Categories selected with no Team/FA context: default rows in those categories
    rows = WIDE_DEFAULT.filter(r => sel.cats.includes(r.cat));
    if (rows.length === 0) {
      const holders = Array.from(new Set(sel.cats.flatMap(c => CLIENTS_BY_CAT[c] || [])));
      rows = holders.map((name, idx) => ({
        name, city: '—', st: '—', vehicle: ['MF','ETF','SMA','CIT'][idx % 4], cat: sel.cats[idx % sel.cats.length],
        aum: ['$24.4M','$18.2M','$12.8M','$8.4M','$5.2M','$3.1M'][idx] || '$2.0M',
        perfAdv:'$1.2M', wtd:(2 + idx*0.4).toFixed(1), wtdDir: idx % 5 === 0 ? '↓' : '↑',
        perfVar: (1.0 - idx*0.4).toFixed(1), feeAdv:'$0.2M', fee:(40 + idx*3).toFixed(1), feeVar:(idx*2 - 4).toFixed(1),
        infl:'$8.4M', outfl:'($2.1M)', net:'$6.3M', mgrs: 4 + idx, rank: idx + 1,
      }));
    }
  } else {
    rows = WIDE_DEFAULT;
  }
  return (
    <div style={{ overflow:'auto', height: 420 }}>
      <table style={{ ...tableStyle, fontSize: 11, tableLayout: 'auto' }}>
        <thead>
          <tr style={thTr}>
            <th style={wTh}>TEAM/FA</th><th style={wThN}>VEHICLE</th><th style={wTh}>CATEGORY</th>
            <th style={wThN}>AUM</th><th style={wThN}>PERF ADV AUM</th><th style={wThN}>ASST WTD PERF</th><th style={wThN}>PERF VARIANCE</th>
            <th style={wThN}>FEE ADV AUM</th><th style={wThN}>FEE</th><th style={wThN}>FEE VARIANCE</th>
            <th style={wThN}>INFLOWS</th><th style={wThN}>OUTFLOWS</th><th style={wThN}>NET FLOWS</th>
            <th style={wThN}># MGRS</th><th style={wThN}>RANK</th>
          </tr>
        </thead>
        <tbody>
          {rows.filter(r => !sel.clients.length || sel.clients.includes(r.name))
               .map((r,i) => {
            // Highlight the specific row identity that was clicked — never every
            // row sharing its category. This grid also never narrows itself.
            const on = sel.rows.includes(r.name + '|' + r.cat);
            const catColor = CAT_COLOR[r.cat] || 'rgb(139,92,246)';
            const veh = VEHICLE_COLOR[r.vehicle] || VEHICLE_COLOR['MF'];
            const wtdColor = r.wtdDir === '↑' ? 'rgb(52,211,153)' : 'rgb(249,115,22)';
            const perfVarNum = parseFloat(r.perfVar);
            const perfVarColor = perfVarNum > 0 ? 'rgb(52,211,153)' : perfVarNum < 0 ? 'rgb(249,115,22)' : 'rgb(163,163,163)';
            const feeVarNum = parseFloat(r.feeVar);
            const feeVarColor = feeVarNum > 0 ? 'rgb(249,115,22)' : feeVarNum < 0 ? 'rgb(52,211,153)' : 'rgb(163,163,163)';
            const rankColor = r.rank <= 3 ? 'rgb(234,179,8)' : 'rgb(156,163,175)';
            const rankBg = r.rank <= 3 ? 'rgba(245,200,90,0.15)' : 'rgba(75,85,99,0.2)';
            return (
            <tr key={i} onClick={() => onRowClick && onRowClick(r)} style={{
              ...tdTr, cursor:'pointer',
              background: on ? 'rgba(16,185,129,0.10)' : 'transparent',
              transition:'background .15s',
            }}>
              <td style={{...wTdCell, borderLeft: on ? '3px solid rgb(16,185,129)' : '3px solid transparent'}}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{
                    width:12, height:12, borderRadius:3, flexShrink:0,
                    border:`1px solid ${on ? 'rgb(16,185,129)' : 'rgba(107,114,128,0.6)'}`,
                    background: on ? 'rgb(16,185,129)' : 'transparent',
                    display:'inline-flex', alignItems:'center', justifyContent:'center',
                  }}>{on && <i className="fa-solid fa-check" style={{ fontSize:6.5, color:'#fff' }} />}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); const base = CLIENT_ADV_ROWS.find(x => x.name === r.name); if (base && onViewClient) onViewClient(advClientRow(base)); }}
                    title={"Open " + r.name + " detail"}
                    style={{
                      width:22, height:20, padding:0, borderRadius:4, cursor:'pointer', flexShrink:0,
                      background:'rgba(96,165,250,0.10)', border:'1px solid rgba(96,165,250,0.35)',
                      color:'rgb(147,197,253)',
                      display:'inline-flex', alignItems:'center', justifyContent:'center',
                    }}
                  ><i className="fa-regular fa-eye" style={{ fontSize:10 }} /></button>
                  <span style={{ display:'flex', flexDirection:'column', minWidth:0 }}>
                    <span title={r.name} style={{ color:'rgb(249,250,251)', fontWeight: on ? 700 : 500, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:140 }}>{r.name}</span>
                    <span style={{ color:'rgb(107,114,128)', fontSize:10, whiteSpace:'nowrap' }}>{r.city}, {r.st}</span>
                  </span>
                </div>
              </td>
              <td style={wTdN}><span style={{ padding:'2px 6px', borderRadius:4, background: veh.bg, color: veh.fg, fontSize:10, fontWeight:600 }}>{r.vehicle}</span></td>
              <td style={wTdCell}>
                <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
                  <span style={{ width:8, height:8, borderRadius:2, background: catColor, display:'inline-block' }} />
                  <span title={r.cat} style={{ color:'rgb(209,213,219)', fontSize:10.5, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:104, display:'inline-block', verticalAlign:'bottom' }}>{r.cat}</span>
                </span>
              </td>
              <td style={wTdNStrong}>{r.aum}</td>
              <td style={wTdN}>{r.perfAdv}</td>
              <td style={wTdN}><span style={{ color: wtdColor }}>● </span><span style={{ color:'rgb(249,250,251)' }}>{r.wtd}</span></td>
              <td style={wTdN}><span style={{ color: perfVarColor }}>{r.perfVar}</span></td>
              <td style={wTdN}>{r.feeAdv}</td>
              <td style={wTdN}><span style={{ color:'rgb(249,250,251)' }}>{r.fee}</span><span style={{ color:'rgb(107,114,128)', fontSize:9, marginLeft:2 }}>bps</span></td>
              <td style={wTdN}><span style={{ color: feeVarColor }}>{r.feeVar}</span></td>
              <td style={wTdN}>{r.infl}</td>
              <td style={wTdN}><span style={{ color:'rgb(249,115,22)' }}>{r.outfl}</span></td>
              <td style={wTdN}><span style={{ color: r.net.startsWith('(') ? 'rgb(249,115,22)' : 'rgb(52,211,153)' }}>{r.net}</span></td>
              <td style={wTdN}>{r.mgrs}</td>
              <td style={wTdN}><span style={{ padding:'2px 8px', borderRadius:9999, background: rankBg, color: rankColor, fontSize:10, fontWeight:600 }}>{r.rank}</span></td>
            </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function BubbleChartSection({ sel, onClientClick }) {
  const [xAxis, setXAxis] = React.useState('Pricing (Fees)');
  return (
    <>
      <div style={{ display:'flex', gap: 10, marginBottom: 10 }}>
        <TabPills options={['Y-Axis','AUM','Gross Sales','Net Sales']} value={'Y-Axis'} onChange={()=>{}} />
      </div>
      <div style={{ height: 320 }}>
        <Bubble sel={sel} onClientClick={onClientClick} />
      </div>
      <div style={{ textAlign:'center', marginTop: 6, fontFamily:'Inter', fontSize: 11, color:'rgb(163,163,163)' }}>
        X-Axis: <TabPills options={['Pricing (Fees)','Market Share']} value={xAxis} onChange={setXAxis} />
      </div>
      <div style={{
        marginTop: 10, padding: 10, background:'rgba(0,0,0,0.25)', border:'1px solid rgba(75,85,99,0.3)', borderRadius: 8,
        display:'flex', alignItems:'center', gap: 14, flexWrap:'wrap',
      }}>
        <span style={{ fontFamily:'Inter', fontSize:11, color:'rgb(163,163,163)' }}>Size:</span>
        <TabPills options={['Clients','Categories','Vehicles']} value="Clients" onChange={()=>{}} />
        {[
          {c:'rgb(52,211,153)', l:'Mckenley Financial'},
          {c:'rgb(59,130,246)', l:'John Moore & Associates'},
          {c:'rgb(139,92,246)', l:'Legacy Financial Holdings'},
          {c:'rgb(234,179,8)', l:'Kaplan Wealth Mgmt.'},
          {c:'rgb(249,115,22)', l:'BVT Advisory Services'},
          {c:'rgb(20,184,166)', l:'Aspen Financial Bros.'},
          {c:'rgb(217,119,6)', l:'Kilt Financial, LLC'},
        ].map((d,i) => (
          <span key={i} style={{ display:'inline-flex', alignItems:'center', gap: 6, fontFamily:'Inter', fontSize:11, color:'rgb(209,213,219)' }}>
            <span style={{ width:8, height:8, borderRadius:9999, background:d.c }} />{d.l}
          </span>
        ))}
      </div>
    </>
  );
}

function Bubble({ sel, onClientClick }) {
  const opts = React.useMemo(() => {
    const series = [
      { name:'Mckenley Financial', x:0.68, y:3.6, z:70, color:'rgb(52,211,153)' },
      { name:'Kaplan Wealth Mgmt.',  x:0.72, y:2.2, z:30, color:'rgb(234,179,8)' },
      { name:'John Moore & Associates', x:0.75, y:3.0, z:55, color:'rgb(59,130,246)' },
      { name:'Legacy Financial Holdings', x:0.77, y:3.3, z:40, color:'rgb(139,92,246)' },
      { name:'BVT Advisory Services', x:0.80, y:2.6, z:45, color:'rgb(249,115,22)' },
      { name:'Aspen Financial Bros.', x:0.88, y:2.1, z:25, color:'rgb(20,184,166)' },
      { name:'Kilt Financial, LLC',   x:0.90, y:2.9, z:28, color:'rgb(217,119,6)' },
    ];
    return ({
    chart: { type:'bubble', height: 320, backgroundColor:'transparent', zoomType:'xy' },
    xAxis: { min:0.65, max:0.95, gridLineColor:'rgba(75,85,99,0.2)', gridLineDashStyle:'Dash', gridLineWidth:1,
      labels: { formatter: function() { return (this.value * 100).toFixed(3) + '%'; }, style:{color:'rgb(163,163,163)', fontSize:'10px'} } },
    yAxis: { min:1.5, max:4.5, gridLineColor:'rgba(75,85,99,0.2)', gridLineDashStyle:'Dash',
      labels: { formatter: function() { return '$' + this.value.toFixed(1); }, style:{color:'rgb(163,163,163)', fontSize:'10px'} } },
    legend: { enabled: false },
    plotOptions: {
      bubble: { minSize: 20, maxSize: 60 },
      series: {
        cursor: 'pointer',
        events: {
          click: function(e) {
            if (onClientClick && e.point) onClientClick(e.point.series.name);
          }
        },
      }
    },
    series: series.map(s => {
      // The bubble chart IS the Team/FA view - it outlines its own selections
      // rather than dropping every other bubble.
      const on = sel.clients.includes(s.name);
      return {
        name: s.name, color: s.color,
        data: [{ x: s.x, y: s.y, z: s.z, color: s.color, marker: on ? { lineWidth: 3, lineColor: 'rgb(16,185,129)' } : undefined }],
      };
    }),
  });
  }, [sel, onClientClick]);
  return <HC options={opts} />;
}

function RollingPerf() {
  const periods = [
    { label:'1 Year', yours:'16.4%', comp:'13.2%', diff:'+3.2 pp' },
    { label:'3 Year Annualized', yours:'14.4%', comp:'13.6%', diff:'+0.8 pp' },
    { label:'5 Year Annualized', yours:'14.2%', comp:'11.6%', diff:'+2.6 pp' },
    { label:'10 Year Annualized', yours:'12.0%', comp:'10.5%', diff:'+1.5 pp' },
  ];
  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:16 }}>
        {periods.map((p,i) => (
          <div key={i} style={{ textAlign:'center', display:'flex', flexDirection:'column', gap:6 }}>
            <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'center', gap:8, height: 110 }}>
              <Bar height={Math.round(parseFloat(p.yours)*5)} label={p.yours} color="rgb(52,211,153)" />
              <Bar height={Math.round(parseFloat(p.comp)*5)} label={p.comp} color="rgb(59,130,246)" />
            </div>
            <div style={{ fontFamily:'Inter', fontSize:11.5, fontWeight:500, color:'rgb(209,213,219)' }}>{p.label}</div>
            <div style={{ fontFamily:'Inter', fontSize:10.5, color:'rgb(52,211,153)' }}>● {p.diff}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 16, display:'flex', justifyContent:'center', gap: 20, fontFamily:'Inter', fontSize:11, color:'rgb(163,163,163)' }}>
        <span style={{display:'inline-flex',alignItems:'center',gap:6}}><span style={{width:10,height:10,borderRadius:2,background:'rgb(52,211,153)'}}/>Your Fund Large Cap Growth</span>
        <span style={{display:'inline-flex',alignItems:'center',gap:6}}><span style={{width:10,height:10,borderRadius:2,background:'rgb(59,130,246)'}}/>Competitor Average</span>
      </div>
    </div>
  );
}

function Bar({ height, label, color }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
      <div style={{ fontFamily:'Inter', fontSize:10.5, color:'rgb(249,250,251)', fontVariantNumeric:'tabular-nums' }}>{label}</div>
      <div style={{ width: 36, height, background: color, borderRadius: 2 }} />
    </div>
  );
}

function FeeTrends() {
  const opts = React.useMemo(() => ({
    chart: { type:'spline', height: 230, backgroundColor:'transparent' },
    xAxis: { categories: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'], lineColor:'rgba(75,85,99,0.3)' },
    yAxis: { labels: { formatter: function() { return this.value.toFixed(2) + '%'; }, style:{color:'rgb(163,163,163)', fontSize:'10px'} },
      gridLineColor:'rgba(75,85,99,0.2)', gridLineDashStyle:'Dash', min:0.70, max:0.85 },
    legend: { enabled: true, itemStyle:{color:'rgb(209,213,219)', fontSize:'10.5px'} },
    series: [
      { name:'Market Average Fee', data:[0.83,0.83,0.82,0.82,0.81,0.81,0.80,0.80,0.79,0.79,0.79,0.79], color:'rgb(59,130,246)', marker:{radius:4} },
      { name:'Your Average Fee', data:[0.77,0.77,0.76,0.76,0.75,0.75,0.74,0.73,0.72,0.72,0.71,0.71], color:'rgb(52,211,153)', marker:{radius:4} },
    ],
  }), []);
  return <div style={{ height: 230 }}><HC options={opts} /></div>;
}

Object.assign(window, { AdvantagePage });
