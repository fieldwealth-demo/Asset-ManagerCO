/* Sales Leadership — "What worked": two side-by-side sales-lift panels.
   Left: Activity type ⇄ Conferences. Right: Signals ⇄ Segmentation (Level 3).
   Lift = actual sales since the activity ÷ expected sales, where expected is the
   FA/Team's prior-12-month daily run rate × days elapsed since the activity. */

const ML_LIFT_PERIODS = { T30: { label: 'Trailing 30 days', nx: 0.34, lx: 0.94, bx: 0.45 }, T90: { label: 'Trailing 90 days', nx: 1, lx: 1, bx: 1 }, R12: { label: 'Rolling 12 months', nx: 3.9, lx: 1.04, bx: 2.2 } };
// n = activities in trailing 90 days (full book), lift, base = avg expected $K per activity
const ML_LIFT_DATA = {
  touch: { label: 'Activity type', rows: [
    ['In-person meeting', 340, 2.4, 42], ['Conference / event', 60, 1.9, 38], ['Webinar + follow-up ≤48h', 110, 1.8, 30],
    ['Virtual meeting', 190, 1.5, 34], ['Phone call', 410, 1.2, 26], ['Webinar, no follow-up', 140, 1.1, 22], ['Email', 580, 1.0, 18]] },
  signal: { label: 'Signals', rows: [
    ['Performance Advantage', 150, 2.6, 46], ['Upsell', 120, 2.2, 40], ['Focus: Muni Ladder SMA', 90, 1.9, 36],
    ['Focus: Core Equity ETF', 105, 1.7, 32], ['Recovery', 70, 1.4, 30], ['Fee Advantage', 85, 1.2, 28]] },
  segment: { label: 'Segmentation', rows: [
    ['Segment A', 420, 2.1, 52], ['Segment B', 560, 1.6, 34], ['Segment C', 510, 1.2, 22], ['Segment D', 340, 1.0, 14]] },
};
// [name, FAs attending, attendees with a follow-up activity after the event, cost $K, lift, base $K per activity]
const ML_CONFERENCES = [
  ['Regional Advisor Summit · Boston', 64, 41, 85, 2.3, 40], ['Wealth Management EDGE', 48, 29, 120, 1.9, 44],
  ['Muni Income Forum · Chicago', 31, 24, 42, 2.1, 36], ['Financial Advisor Expo · Dallas', 55, 18, 64, 1.4, 30],
  ['Retirement Planning Roundtable', 22, 9, 18, 1.2, 26],
];

const mlLiftFmt = k => (k >= 1000 ? `$${(k / 1000).toFixed(1)}M` : `$${Math.round(k)}K`);
const mlLiftGood = l => l >= 1.5;
const mlLiftTh = { fontFamily: 'Inter', fontSize: 9.5, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', color: ML_DIM, textAlign: 'right', whiteSpace: 'nowrap' };
const mlLiftNum = { fontFamily: 'Inter', fontSize: 12, fontVariantNumeric: 'tabular-nums', textAlign: 'right', whiteSpace: 'nowrap' };

/* Sortable lift table. cols: [{k, label, f, c?, bar?}] — first col is the label. */
function MlLiftTable({ items, cols, total, firstLabel }) {
  const [sort, setSort] = React.useState({ k: 'lift', d: -1 });
  React.useEffect(() => { if (!cols.some(c => c.k === sort.k)) setSort({ k: 'lift', d: -1 }); }, [cols.map(c => c.k).join()]);
  const list = items.slice().sort((a, b) => (sort.k === 'label' ? a.label.localeCompare(b.label) : a[sort.k] - b[sort.k]) * sort.d);
  const maxL = Math.max(...items.map(x => x.lift), 1);
  const onSort = k => setSort(s => (s.k === k ? { k, d: -s.d } : { k, d: k === 'label' ? 1 : -1 }));
  const caret = k => sort.k === k && <i className={`fa-solid fa-caret-${sort.d > 0 ? 'up' : 'down'}`} style={{ marginLeft: 4, fontSize: 9 }} />;
  const cell = (c, x, isTot) => {
    const v = x[c.k];
    if (c.bar) return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
        {!isTot && <div style={{ width: 56, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}><div style={{ width: `${(v / maxL) * 100}%`, height: '100%', background: mlLiftGood(v) ? 'rgb(16,185,129)' : 'rgb(107,114,128)' }}></div></div>}
        <span style={{ fontWeight: 700, color: mlLiftGood(v) ? 'rgb(52,211,153)' : 'rgb(209,213,219)' }}>{v.toFixed(1)}x</span>
      </div>);
    return <span style={{ color: c.c ? c.c(v) : 'rgb(209,213,219)', fontWeight: isTot || c.b ? 600 : 400 }}>{c.f(v)}</span>;
  };
  const td = { padding: '9px 8px', borderBottom: '1px solid rgba(75,85,99,0.16)' };
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead><tr>
          <th onClick={() => onSort('label')} style={{ ...mlLiftTh, textAlign: 'left', padding: '10px 8px 10px 18px', cursor: 'pointer', color: sort.k === 'label' ? 'rgb(52,211,153)' : ML_DIM, borderBottom: `1px solid ${ML_LINE}` }}>{firstLabel}{caret('label')}</th>
          {cols.map((c, i) => <th key={c.k} title={c.tip} onClick={() => onSort(c.k)} style={{ ...mlLiftTh, padding: '10px 8px', paddingRight: i === cols.length - 1 ? 18 : 8, width: '1%', cursor: 'pointer', color: sort.k === c.k ? 'rgb(52,211,153)' : ML_DIM, borderBottom: `1px solid ${ML_LINE}` }}>{c.label}{caret(c.k)}</th>)}
        </tr></thead>
        <tbody>
          {list.map(x => (
            <tr key={x.label}>
              <td style={{ ...td, paddingLeft: 18, fontFamily: 'Inter', fontSize: 12.5, color: ML_INK, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={x.label}>{x.label}</td>
              {cols.map((c, i) => <td key={c.k} style={{ ...td, ...mlLiftNum, paddingRight: i === cols.length - 1 ? 18 : 8 }}>{cell(c, x)}</td>)}
            </tr>
          ))}
          <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
            <td style={{ ...td, paddingLeft: 18, borderBottom: 'none', fontFamily: 'Inter', fontSize: 12, fontWeight: 700, color: ML_INK }}>Total</td>
            {cols.map((c, i) => <td key={c.k} style={{ ...td, ...mlLiftNum, borderBottom: 'none', paddingRight: i === cols.length - 1 ? 18 : 8 }}>{cell(c, total, true)}</td>)}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function MlLiftPanel({ title, tabs, value, onChange, children }) {
  return (
    <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', border: `1px solid ${ML_LINE}`, borderRadius: 10, background: 'rgba(255,255,255,0.015)', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', padding: '12px 18px', borderBottom: `1px solid ${ML_LINE}` }}>
        <span style={{ fontFamily: 'Inter', fontSize: 12, fontWeight: 600, color: ML_INK }}>{title}</span>
        {tabs && <TabPills options={tabs.map(t => t.key)} labels={Object.fromEntries(tabs.map(t => [t.key, t.label]))} value={value} onChange={onChange} />}
      </div>
      {children}
    </div>
  );
}

function MlSalesLift({ rows, level }) {
  const L3 = level >= 3;
  const [period, setPeriod] = React.useState('T90');
  const [left, setLeft] = React.useState('touch');
  const [right, setRight] = React.useState('signal');
  const p = ML_LIFT_PERIODS[period];
  const scale = rows.length / Math.max(1, ML_ROWS.length);
  const liftAdj = l0 => Math.max(0.8, Math.round((1 + (l0 - 1) * p.lx) * 10) / 10);
  const totals = (items, extra = {}) => {
    const exp = items.reduce((a, x) => a + x.exp, 0), act = items.reduce((a, x) => a + x.act, 0);
    const t = { n: 0, lift: exp ? act / exp : 0, usd: act - exp, ...extra };
    items.forEach(x => { t.n += x.n; Object.keys(extra).forEach(k => { t[k] += x[k]; }); });
    return t;
  };
  const build = key => {
    const items = ML_LIFT_DATA[key].rows.map(([label, n0, l0, base]) => {
      const n = Math.max(0, Math.round(n0 * p.nx * scale)), lift = liftAdj(l0), exp = n * base * p.bx;
      return { label, n, lift, exp, act: exp * lift, usd: exp * (lift - 1) };
    });
    return { items, total: totals(items) };
  };
  const conf = (() => {
    const items = ML_CONFERENCES.map(([label, fa0, fu0, cost0, l0, base]) => {
      const k = Math.min(p.nx, 2.4) * scale, fas = Math.max(0, Math.round(fa0 * k)), fu = Math.min(fas, Math.max(0, Math.round(fu0 * k)));
      const lift = liftAdj(l0), exp = fas * base * p.bx;
      return { label, fas, fu, n: 0, cost: cost0 * Math.min(p.nx, 3.9) * Math.max(scale, 0.25), lift, exp, act: exp * lift, usd: exp * (lift - 1) };
    });
    return { items, total: totals(items, { fas: 0, fu: 0, cost: 0 }) };
  })();
  const usdCol = { k: 'usd', label: 'Lift $', f: v => (v > 0 ? `+${mlLiftFmt(v)}` : '$0'), c: v => (v > 0 ? 'rgb(52,211,153)' : ML_MUT), b: true };
  const liftCol = { k: 'lift', label: 'Lift', bar: true };
  const nCol = { k: 'n', label: 'Activities', f: v => v.toLocaleString() };
  const baseCols = [nCol, liftCol, usdCol];
  const confCols = [{ k: 'fas', label: 'FAs', f: v => v.toLocaleString(), tip: 'FA/Teams reached at the conference' }, { k: 'fu', label: 'Follow-up', f: v => v.toLocaleString(), tip: 'Attendees the sales team had an activity with after the event' }, { k: 'cost', label: 'Cost', f: mlLiftFmt, tip: 'Sponsorship, booth and travel' }, liftCol, usdCol];
  const L = left === 'conf' && L3 ? conf : build('touch');
  const R = build(right);
  const confPanel = (
    <MlLiftPanel title="Conferences">
      <MlLiftTable items={conf.items} total={conf.total} firstLabel="Conference" cols={confCols} />
    </MlLiftPanel>
  );

  return (
    <Tile title="What worked" subtitle={`Sales lift: actual sales since each activity vs. the FA/Team's expected sales · ${p.label}`}
      right={<TabPills options={['T30', 'T90', 'R12']} labels={{ T30: 'Trailing 30', T90: 'Trailing 90', R12: 'Rolling 12' }} value={period} onChange={setPeriod} />} pad={0}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(420px,1fr))', gap: 16, padding: 16 }}>
        <MlLiftPanel title="Activities" tabs={L3 ? [{ key: 'touch', label: 'Activity type' }, { key: 'conf', label: 'Conferences' }] : null} value={left} onChange={setLeft}>
          <MlLiftTable items={L.items} total={L.total} firstLabel={L3 && left === 'conf' ? 'Conference' : 'Activity type'} cols={L3 && left === 'conf' ? confCols : baseCols} />
        </MlLiftPanel>
        {!L3 && confPanel}
        {L3 && (
          <MlLiftPanel title={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>Signals & segments <MlL3Tag /></span>} tabs={[{ key: 'signal', label: 'Signals' }, { key: 'segment', label: 'Segmentation' }]} value={right} onChange={setRight}>
            <MlLiftTable items={R.items} total={R.total} firstLabel={right === 'signal' ? 'Signal acted on' : 'Segment tier'} cols={baseCols} />
          </MlLiftPanel>
        )}
      </div>
      <div style={{ padding: '12px 18px 16px', borderTop: `1px solid ${ML_LINE}`, fontFamily: 'Inter', fontSize: 11, lineHeight: 1.55, color: ML_MUT, textWrap: 'pretty' }}>
        <strong style={{ color: 'rgb(209,213,219)', fontWeight: 600 }}>Sales lift</strong> compares actual sales since the activity with expected sales, where expected = the FA/Team's daily run rate over the 12 months before the activity (12-month sales ÷ 365) × days elapsed since the activity. Lift = actual ÷ expected; Lift $ = actual − expected. Conference lift is measured across the FA/Teams reached.
      </div>
    </Tile>
  );
}

Object.assign(window, { MlSalesLift });
