/* FA/Team profile (clientdetail.jsx on desktop), restacked for a phone. */
import { TEAMS, I, Pill, Seg, Html, ConfBar, SectionHead, Avatar, fmtM } from './ui.jsx';
const { useEffect, useMemo, useRef, useState } = React;

const ALLOC = {
  equities: 'rgb(16,185,129)', fixedIncome: 'rgb(59,130,246)', alternatives: 'rgb(139,92,246)', private: 'rgb(249,115,22)',
  realEstate: 'rgb(239,68,68)', cash: 'rgb(20,184,166)', hedge: 'rgb(234,179,8)', other: 'rgb(14,165,233)',
};
const VEH_SHORT = { 'Mutual Funds': 'MF', 'ETFs': 'ETF', 'SMAs': 'SMA', 'Privates': 'PRIV' };
const crmHref = (kind, name) => `https://yourfirm.lightning.force.com/lightning/r/${kind}/${String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}/view`;
// The repo repeats one real-looking number across every contact; the phone build uses 555-01xx numbers.
const phoneOf = (i) => `555-01${String(10 + i * 3).padStart(2, '0')}`;

function VehicleBadge({ v }) {
  return <span className={`veh veh-${v.toLowerCase().replace(/[^a-z]/g, '')}`}>{v}</span>;
}

function Donut({ segs, total, size = 148 }) {
  const r = 52, c = 2 * Math.PI * r;
  let acc = 0;
  return (
    <svg viewBox="0 0 140 140" width={size} height={size} role="img" aria-label={`Allocation, ${total} total`}>
      <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="18" />
      {segs.map((s) => {
        const len = Math.max(0, s.pct * c - 1.5);
        const el = <circle key={s.name} cx="70" cy="70" r={r} fill="none" stroke={s.color} strokeOpacity="0.85" strokeWidth="18"
          strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-acc * c} transform="rotate(-90 70 70)" />;
        acc += s.pct;
        return el;
      })}
      <text x="70" y="68" textAnchor="middle" className="donut-total">{total}</text>
      <text x="70" y="86" textAnchor="middle" className="donut-cap">market opp.</text>
    </svg>
  );
}

function allocations(d) {
  const T = d.raw.mktOppAum, Y = d.raw.yoursAum;
  const row = (name, color, pct, shr, tag) => ({ name, color, pct, mkt: fmtM(T * pct), yrs: fmtM(Y * pct), shr, tag });
  return {
    vehicle: [
      row('Mutual Funds', ALLOC.equities, 0.42, '19.9%'), row('ETFs', ALLOC.fixedIncome, 0.24, '19.9%'),
      row('Privates', ALLOC.alternatives, 0.18, '19.9%'), row('UMA', ALLOC.private, 0.16, '19.9%'),
    ],
    platform: [
      row('UMA FA Discretionary', ALLOC.equities, 0.36, '55.4%'), row('Portfolio Management', ALLOC.fixedIncome, 0.24, '34.3%'),
      row('UMA Non Discretionary', ALLOC.alternatives, 0.18, '36.9%'), row('UMA Firm Discretionary', ALLOC.cash, 0.12, '39.2%', 'New Mod'),
      row('Consulting & Evaluation', ALLOC.private, 0.05, '36.1%'), row('Consulting Group Advisor', ALLOC.realEstate, 0.04, '33.3%'),
      row('Standard Brokerage', ALLOC.hedge, 0.01, '45.8%'),
    ],
    category: [
      row('Large Growth', ALLOC.fixedIncome, 0.22, '21.4%'), row('Large Blend', ALLOC.equities, 0.16, '18.7%'),
      row('Intermediate Core-Plus', ALLOC.alternatives, 0.14, '24.2%'), row('Multisector Bond', ALLOC.cash, 0.12, '17.0%'),
      row('Large Value', ALLOC.private, 0.10, '15.5%'), row('Foreign Large Blend', ALLOC.other, 0.09, '19.9%'),
      row('Moderate Allocation', ALLOC.realEstate, 0.07, '22.6%'), row('Mid-Cap Growth', ALLOC.hedge, 0.06, '14.8%'),
      row('Other', 'rgb(156,163,175)', 0.04, '—'),
    ],
  };
}

const COMP_ADV = [
  { vehicle: 'MF', cat: 'Intermediate Core-Plus', c: ALLOC.alternatives, tot: '$17.0M', perf: '$10.1M', risk: -3.1, fee: '25.0', feeVar: '0.0', net: '$0.9M', mgrs: 5, rank: 18 },
  { vehicle: 'MF', cat: 'Large Bond', c: ALLOC.cash, tot: '$5.4M', perf: '$2.7M', risk: 1.5, fee: '61.8', feeVar: '30.5', net: '$0.3M', mgrs: 7, rank: 3 },
  { vehicle: 'ETF', cat: 'Moderate Allocation', c: ALLOC.realEstate, tot: '$4.7M', perf: '$2.7M', risk: 1.6, fee: '22.9', feeVar: '−3.0', net: '$0.34M', mgrs: 8, rank: 2 },
  { vehicle: 'MF', cat: 'Multisector Bond', c: ALLOC.cash, tot: '$3.8M', perf: '$1.4M', risk: 0.3, fee: '25.8', feeVar: '0.0', net: '$0.2M', mgrs: 7, rank: 5 },
  { vehicle: 'SMA', cat: 'Moderate Allocation', c: ALLOC.realEstate, tot: '$2.1M', perf: '$1.5M', risk: 1.2, fee: '35.0', feeVar: '8.2', net: '$0.05M', mgrs: 11, rank: 6 },
  { vehicle: 'MF', cat: 'Large Value', c: ALLOC.fixedIncome, tot: '$1.8M', perf: '$1.5M', risk: 2.6, fee: '62.8', feeVar: '0.0', net: '$0.05M', mgrs: 13, rank: 1 },
];

const MONEY = [
  { name: 'Large Growth', c: ALLOC.fixedIncome, vehicle: 'Mutual Fund', cur: '$92M', prior: '$79M', delta: '+$13M', pct: '+17.4%', sub: [['MF', '$53M', '+$8M', '+17.8%'], ['ETF', '$28M', '+$3M', '+12.0%'], ['SMA', '$11M', '+$2M', '+22.2%']] },
  { name: 'Multisector Bond', c: ALLOC.cash, vehicle: 'Mutual Fund', cur: '$67M', prior: '$59M', delta: '+$8M', pct: '+9.2%', sub: [['MF', '$42M', '+$6M', '+16.7%'], ['CIT', '$15M', '+$1M', '+7.1%'], ['ETF', '$10M', '+$1M', '+11.1%']] },
  { name: 'Alternatives — Private Credit', c: ALLOC.alternatives, vehicle: 'Alternative', cur: '$54M', prior: '$48M', delta: '+$6M', pct: '+10.7%', sub: [['Interval Fund', '$31M', '+$5M', '+19.2%'], ['BDC', '$14M', '+$1M', '+7.7%'], ['Private Fund', '$9M', '$0M', '+0.0%']] },
  { name: 'Large Blend', c: ALLOC.fixedIncome, vehicle: 'ETF', cur: '$40M', prior: '$45M', delta: '−$5M', pct: '−11.1%', sub: [['ETF', '$22M', '−$4M', '−15.4%'], ['MF', '$13M', '−$1M', '−7.1%'], ['SMA', '$5M', '$0M', '+0.0%']] },
  { name: 'Intermediate Core-Plus', c: ALLOC.alternatives, vehicle: 'Mutual Fund', cur: '$30M', prior: '$31M', delta: '−$1M', pct: '−3.2%', sub: [['MF', '$22M', '−$2M', '−8.3%'], ['ETF', '$8M', '+$1M', '+14.3%']] },
  { name: 'Foreign Large Blend', c: ALLOC.other, vehicle: 'Mutual Fund', cur: '$32M', prior: '$30M', delta: '+$2M', pct: '+6.7%', sub: [['MF', '$19M', '+$1M', '+5.6%'], ['ETF', '$10M', '+$1M', '+11.1%'], ['ADR', '$3M', '$0M', '+0.0%']] },
  { name: 'Mid-Cap Growth', c: ALLOC.cash, vehicle: 'ETF', cur: '$23M', prior: '$22M', delta: '+$1M', pct: '+4.5%', sub: [['ETF', '$14M', '+$1M', '+7.7%'], ['MF', '$9M', '$0M', '+0.0%']] },
  { name: 'Real Estate', c: ALLOC.private, vehicle: 'Mutual Fund', cur: '$24M', prior: '$25M', delta: '−$1M', pct: '−4.0%', sub: [['REIT MF', '$13M', '−$2M', '−13.3%'], ['Private', '$8M', '+$1M', '+14.3%'], ['ETF', '$3M', '$0M', '+0.0%']] },
];
const neg = (s) => /^[−-]/.test(s);

/* ---------- sections ---------- */
function NbaCarousel({ sigs }) {
  if (!sigs.length) return null;
  const tot = sigs.reduce((a, s) => a + s.oppM, 0);
  return (
    <section>
      <SectionHead title="Next best actions" note={`${sigs.length} applicable · $${Math.round(tot)}M signal opp. · ranked by confidence`} />
      <div className="snap">
        {sigs.map((s, i) => (
          <article key={s.type + i} className={`card nba${i === 0 ? ' first' : ''}`} style={{ '--sig': s.color }}>
            <div className="nba-top">
              <span className="nba-label"><I n={s.icon} />{s.label}</span>
              {i === 0 && <span className="next-best">Next best</span>}
            </div>
            <div className="sub">{s.type}{s.when ? ` · ${s.when}` : ''}</div>
            <p className="nba-desc"><Html html={s.desc} /></p>
            <div className="nba-foot">
              <span>Signal opp. <b className="g">{s.opp}</b></span>
              <span>Confidence <ConfBar value={s.confidence} /></span>
              {s.product && <span className="nba-prod">Product <b>{s.product}</b></span>}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Members({ d }) {
  const [all, setAll] = useState(false);
  const list = all ? d.members : d.members.slice(0, 3);
  return (
    <section>
      <SectionHead title="Team members" note={d.branch} />
      <div className="card list">
        {list.map((m, i) => {
          const dm = i === 0;
          const phone = phoneOf(i);
          return (
            <div key={m.name} className={`person${dm ? ' dm' : ''}`}>
              <Avatar init={m.init} color={m.avatar} size={40} ring={dm} />
              <div className="person-main">
                <div className="person-name">{m.name}{dm && <span className="cio">CIO</span>}</div>
                <div className={`person-role${dm ? ' g' : ''}`}>{dm ? 'Investment decision maker' : m.role}</div>
                <div className="person-meta">{m.crd ? `CRD # ${m.crd} · ` : ''}{phone}</div>
              </div>
              <a className="icon-btn" href={`tel:${phone}`} aria-label={`Call ${m.name}, ${phone}`}><I n="phone" /></a>
            </div>
          );
        })}
        {d.members.length > 3 && (
          <button type="button" className="more-row" onClick={() => setAll(a => !a)}>
            {all ? 'Show fewer' : `Show all ${d.members.length}`}<I n={all ? 'chevron-up' : 'chevron-down'} />
          </button>
        )}
      </div>
    </section>
  );
}

function OtherAdvisors({ d }) {
  return (
    <section>
      <SectionHead title="Other advisors in the branch" />
      <div className="card list">
        <div className="oa-key">Your AUM · market share of their total AUM</div>
        {d.others.map(o => (
          <div key={o.name} className="oa">
            <div className="oa-who">
              <Avatar init={o.init} color={o.col} size={32} />
              <div><div className="oa-name">{o.name}</div><div className="sub">{o.role}</div></div>
            </div>
            <div className="oa-nums">
              <b>{o.yourShare}</b>
              <span><em>{o.mktShare}</em> of {o.yourAum}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ActualSales({ t }) {
  const [flow, setFlow] = useState('inflow');
  const hs = t.holdings;
  if (!hs.length) {
    return (
      <section>
        <SectionHead title="Your actual AUM & sales" />
        <div className="card pad"><p className="meet-b">No production on file. This FA/Team is a prospect, so the opportunity below is all addressable.</p></div>
      </section>
    );
  }
  const total = hs.reduce((a, h) => a + h.aumM, 0);
  const max = Math.max(...hs.flatMap(h => h[flow].map(Math.abs)), 0.01);
  const fmt = (v) => (flow === 'net' ? (v >= 0 ? '+' : '−') + fmtM(Math.abs(v)).replace('−', '') : fmtM(v));
  const r12 = hs.reduce((a, h) => a + h.r12[flow], 0);
  return (
    <section>
      <SectionHead title="Your actual AUM & sales" note={`From your own sales system · ${hs.length} product${hs.length === 1 ? '' : 's'} · ${fmtM(total)} current AUM`} />
      <Seg full label="Flow type" value={flow} onChange={setFlow} options={[['inflow', 'Inflows'], ['redemption', 'Redemptions'], ['net', 'Net flows']]} />
      <div className="card list as">
        {hs.map(h => (
          <div key={h.name} className="as-row">
            <div className="as-top">
              <div className="as-name"><VehicleBadge v={VEH_SHORT[h.vehicle] || 'PRIV'} /><span>{h.name}</span></div>
              <div className="as-aum"><b>{fmtM(h.aumM)}</b><span>AUM</span></div>
            </div>
            <div className="as-years">
              {h[flow].map((v, i) => (
                <div key={i} className="as-y">
                  <span className="as-bar"><span className={v < 0 ? 'neg' : ''} style={{ height: `${Math.max(4, (Math.abs(v) / max) * 100)}%` }} /></span>
                  <span className="as-yl">{i === 4 ? `${String(t.years[i]).slice(2)} YTD` : `’${String(t.years[i]).slice(2)}`}</span>
                </div>
              ))}
              <div className="as-r12"><span>R12</span><b className={h.r12[flow] < 0 ? 'r' : 'g'}>{fmt(h.r12[flow])}</b></div>
            </div>
          </div>
        ))}
        <div className="as-total"><span>Total R12 {flow === 'inflow' ? 'inflows' : flow === 'redemption' ? 'redemptions' : 'net flows'}</span><b className={r12 < 0 ? 'r' : 'g'}>{fmt(r12)}</b></div>
      </div>
    </section>
  );
}

function MarketKpis({ d }) {
  const cards = [['AUM', 'rgb(52,211,153)', d.kpi.aum], ['Inflows (YTD)', 'rgb(96,165,250)', d.kpi.inflow], ['Net flows (YTD)', 'rgb(249,115,22)', d.kpi.netflow]];
  return (
    <div className="snap kpi-snap">
      {cards.map(([l, c, k]) => (
        <div key={l} className="card mk">
          <span className="mk-l" style={{ color: c }}>{l}</span>
          <div className="mk-h"><b>{k.headline}</b><span className="g">{k.priorDelta}</span></div>
          <div className="mk-sub">
            <div><span>Mkt opp</span><b>{k.mktOpp}</b></div>
            <div><span>Yours</span><b>{k.yours}</b></div>
            <div><span>Mkt share</span><b style={{ color: c }}>{k.share}</b></div>
          </div>
        </div>
      ))}
    </div>
  );
}

function Allocation({ d }) {
  const [kind, setKind] = useState('vehicle');
  const A = useMemo(() => allocations(d), [d]);
  const rows = A[kind];
  return (
    <section>
      <SectionHead title="Allocation" note="Market opportunity by slice, with your AUM and market share in each." />
      <Seg full label="Allocation by" value={kind} onChange={setKind} options={[['vehicle', 'Vehicle'], ['platform', 'Platform'], ['category', 'Category']]} />
      <div className="card alloc">
        <div className="alloc-donut"><Donut total={fmtM(d.raw.mktOppAum)} segs={rows} /></div>
        {rows.map(r => (
          <div key={r.name} className="alloc-row">
            <span className="alloc-name"><i className="dot" style={{ background: r.color }} />{r.name}{r.tag && <em className="tag-new">{r.tag}</em>}</span>
            <span className={`alloc-share${r.shr === '—' ? ' m' : ''}`}>{r.shr}</span>
            <span className="alloc-nums">Yours <b>{r.yrs}</b> of {r.mkt} market opp.</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function CompAdvantage() {
  return (
    <section>
      <SectionHead title="Competitive advantage" note="By vehicle and Morningstar category, against the competing holds." />
      <div className="stack">
        {COMP_ADV.map((r, i) => (
          <div key={i} className="card ca">
            <div className="ca-top">
              <VehicleBadge v={r.vehicle} />
              <span className="ca-cat"><i className="dot" style={{ background: r.c }} />{r.cat}</span>
              <span className={`rank-b${r.rank <= 3 ? ' top' : ''}`} aria-label={`Rank ${r.rank}`}>#{r.rank}</span>
            </div>
            <div className="ca-grid">
              <div><span>Total AUM</span><b>{r.tot}</b></div>
              <div><span>Perf adv AUM</span><b className="w">{r.perf}</b></div>
              <div><span>Asset-wtd perf</span><b><i className="dot" style={{ background: r.risk > 0 ? 'var(--green)' : 'var(--red)' }} />{r.risk > 0 ? '+' : ''}{r.risk}</b></div>
              <div><span>Fee (bps)</span><b>{r.fee}<em>{r.feeVar !== '0.0' ? ` ${neg(r.feeVar) ? '' : '+'}${r.feeVar}` : ''}</em></b></div>
              <div><span>Net flows</span><b>{r.net}</b></div>
              <div><span># Mgrs</span><b>{r.mgrs}</b></div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function MoneyInMotion() {
  const [open, setOpen] = useState(new Set(['Large Growth']));
  const tog = (k) => setOpen(s => { const n = new Set(s); n.has(k) ? n.delete(k) : n.add(k); return n; });
  return (
    <section>
      <SectionHead title="Money in motion" note="Current AUM against the prior period, by Morningstar category. Tap a category for the vehicle breakdown." />
      <div className="card list">
        {MONEY.map(r => {
          const isOpen = open.has(r.name);
          return (
            <div key={r.name} className="mm">
              <button type="button" className="mm-row" aria-expanded={isOpen} onClick={() => tog(r.name)}>
                <I n={isOpen ? 'chevron-down' : 'chevron-right'} className="mm-chev" />
                <span className="mm-name"><i className="dot" style={{ background: r.c }} />{r.name}<span className="sub">{r.vehicle} · prior {r.prior}</span></span>
                <span className="mm-nums"><b>{r.cur}</b><em className={neg(r.delta) ? 'r' : 'g'}>{r.delta} · {r.pct}</em></span>
              </button>
              {isOpen && (
                <div className="mm-sub">
                  {r.sub.map(([v, cur, dl, pc]) => (
                    <div key={v} className="mm-subrow"><VehicleBadge v={v} /><span>{cur}</span><em className={neg(dl) ? 'r' : dl === '$0M' ? 'm' : 'g'}>{dl} · {pc}</em></div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ---------- screen ---------- */
export function TeamScreen({ name, onClose, depth }) {
  const t = TEAMS[name];
  const scRef = useRef(null);
  const [scrolled, setScrolled] = useState(false);
  const [closing, setClosing] = useState(false);
  useEffect(() => { scRef.current && scRef.current.focus({ preventScroll: true }); }, []);
  useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, []);
  const close = () => { setClosing(true); setTimeout(onClose, 200); };
  if (!t) return null;
  const d = t.detail;
  const sigs = t.signals;
  const dm = d.members[0];
  const dmPhone = phoneOf(0);
  return (
    <div className={`team-screen${closing ? ' closing' : ''}`} style={{ zIndex: 40 + depth }} role="dialog" aria-modal="true" aria-label={d.fullName}>
      <div className="team-scroll" ref={scRef} tabIndex={-1} onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 90)}>
        <header className={`team-bar${scrolled ? ' solid' : ''}`}>
          <button type="button" className="back" aria-label="Back" onClick={close}><I n="chevron-left" /></button>
          <span className="team-bar-title">{d.fullName}</span>
          <a className="icon-btn sf" href={crmHref('Account', d.fullName)} target="_blank" rel="noopener noreferrer" aria-label="Open account in Salesforce"><I n="cloud" /></a>
        </header>

        <div className="gutter team-body">
          <div className="profile">
            <div className="firm-logo" aria-hidden="true">{d.firm}</div>
            <div className="profile-main">
              <h1>{d.fullName}</h1>
              <div className="profile-sub">
                <span>{d.firm}</span>
                {t.segment && t.segment !== 'N' && <span className={`seg-badge s-${t.segment}`}>{t.segment}</span>}
                {t.segment && t.segment !== 'N' && <span>Segment {t.segment}</span>}
              </div>
            </div>
          </div>
          <div className="chip-scroll badges">
            {d.badges.map((b, i) => <span key={b} className={`badge-chip${i >= 4 ? ' blue' : ''}`}>{b}</span>)}
          </div>
          <div className="card hq">
            <I n="building" className="b" />
            <div className="hq-main"><b>{d.address.label}</b><span>{d.address.line1}, {d.address.line2}</span></div>
            <span className="hq-since">Since {d.activeSince}</span>
          </div>
          <div className="quick">
            <a className="btn btn-primary" href={`tel:${dmPhone}`}><I n="phone" />Call {dm.name.split(' ')[0]}</a>
            <a className="btn" href={crmHref('Account', d.fullName)} target="_blank" rel="noopener noreferrer"><I n="cloud" />Salesforce</a>
          </div>
          <p className="quick-note">{dm.name} · {dmPhone}{t.activityDays != null ? ` · last external touch ${t.activityDays} days ago` : ''}</p>

          <NbaCarousel sigs={sigs} />
          <Members d={d} />
          <OtherAdvisors d={d} />
          <ActualSales t={t} />

          <section>
            <SectionHead title="Market opportunity" note="From your data packs: this FA/Team's total AUM and flows across all asset managers, and your share." />
            <MarketKpis d={d} />
          </section>
          <Allocation d={d} />
          <CompAdvantage />
          <MoneyInMotion />
          <p className="how">Showing 8 of 10+ Morningstar categories. Market data from monthly data packs.</p>
        </div>
      </div>
    </div>
  );
}
