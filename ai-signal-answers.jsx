/* Ask Field answers for the Level 2 / Level 3 suggested prompts. Content comes
   from the same sources the wholesaler sees elsewhere: the Morning Brief, the
   Monthly Review & Plan, and the live Segmentation & Signals book. */

const AIS_TONE = {
  g: ['rgb(52,211,153)', 'rgba(52,211,153,0.14)', 'rgba(52,211,153,0.45)'],
  a: ['rgb(251,191,36)', 'rgba(251,191,36,0.14)', 'rgba(251,191,36,0.45)'],
  r: ['rgb(248,113,113)', 'rgba(248,113,113,0.13)', 'rgba(248,113,113,0.45)'],
  b: ['rgb(96,165,250)', 'rgba(96,165,250,0.13)', 'rgba(96,165,250,0.45)'],
  p: ['rgb(167,139,250)', 'rgba(167,139,250,0.13)', 'rgba(167,139,250,0.45)'],
};
const AIS_BRIEF = { label: 'Morning Brief · Tue, Sep 22', icon: 'sun' };
const AIS_MONTHLY = { label: 'Monthly Review & Plan · September', icon: 'chart-line' };
const AIS_LIVE = { label: 'Segmentation & Signals · live book', icon: 'wave-pulse' };
const aisCta = {
  brief: { label: 'Open Morning Brief', icon: 'sun', nav: 'briefs', briefView: 'brief' },
  monthly: { label: 'Open Monthly Review & Plan', icon: 'chart-line', nav: 'briefs', briefView: 'monthly' },
  l3: { label: 'Open Segmentation & Signals', icon: 'wave-pulse', nav: 'l3intel' },
  l2: { label: 'Open Territory Analytics', icon: 'handshake', nav: 'l2sales' },
};

const AIS_STATIC = {
  'who should i call first today, and what should i lead with': {
    source: AIS_BRIEF,
    summary: 'Five calls for today, ranked by signal confidence × expected opportunity. Start with <b>The Doe Wealth Group</b>: Muni Ladder SMA at 88 confidence, $15.2M expected.',
    items: [
      { rank: 1, title: 'The Doe Wealth Group', sub: 'Contoso Wealth · New York, NY · Segment A', pill: ['88', 'g'], body: 'Introduce <b>Muni Ladder SMA</b> · $15.2M expected. Largest producer in the territory ($72.9M R12) with no Muni SMA position. Upsell (87) and Fee Advantage (73) are also open.', tags: ['Best touch: In-person · 2.4x', 'External: 192 days', 'Internal: 7 days'] },
      { rank: 2, title: 'Alpine Partners', sub: 'Northwind Securities · Boston, MA · Segment A', pill: ['88', 'g'], body: "Introduce <b>Muni Ladder SMA</b> · $9.4M expected. Attended Thursday's webinar. Performance Advantage (83) adds $12.8M on Core Equity ETF.", tags: ['Best touch: Webinar follow-up ≤48h · 1.8x', 'External: 127 days'] },
      { rank: 3, title: 'The Brown Group', sub: 'Contoso Wealth · New York, NY · Segment A', pill: ['82', 'g'], body: 'Introduce <b>Private Credit Fund</b> · $7.1M expected. Also carries Retention Risk on $4.6M of net redemptions, so open with performance.', tags: ['Best touch: In-person · 2.4x', 'External: 171 days'] },
      { rank: 4, title: 'Harbor Point Advisors', sub: 'Litware Advisors · Greenwich, CT · Segment A', pill: ['78', 'g'], body: 'Introduce <b>Core Equity ETF</b> · $5.6M expected. Bought Muni Ladder SMA yesterday after your Sep 9 meeting. Keep the momentum.', tags: ['Best touch: Call after a sale · 1.4x', 'External: 13 days'] },
      { rank: 5, title: 'The Smith Group II', sub: 'Adatum Partners · White Plains, NY · Segment A', pill: ['78', 'g'], body: 'Introduce <b>Private Credit Fund</b> · $5.6M expected. Webinar attendee. Core Equity ETF focus signal (77) is close behind.', tags: ['Best touch: Webinar follow-up ≤48h · 1.8x', 'External: 28 days'] },
    ],
    insights: [
      { icon: 'calendar-check', color: 'rgb(167,139,250)', title: 'Two of the five are webinar attendees', body: 'Alpine Partners and The Smith Group II attended Thursday. A follow-up inside 48 hours has lifted sales 1.8x in your territory.' },
      { icon: 'shield-halved', color: 'rgb(248,113,113)', title: 'Open The Brown Group with performance', body: 'Net redemptions of $4.6M sit alongside the Private Credit opportunity.' },
    ],
    ctas: [aisCta.brief, aisCta.l3],
  },
  'which webinar attendees have i not followed up with inside 48 hours': {
    source: AIS_BRIEF,
    summary: "Three FA/Teams attended Thursday's <b>Muni Ladder SMA webinar</b> and none has been contacted yet. The 48-hour window closes <b>Friday</b>.",
    items: [
      { title: 'Alpine Partners', sub: 'Northwind Securities · Boston, MA · Segment A', pill: ['Due Fri', 'a'], body: 'Meeting Opportunity signal. Introduce <b>Muni Ladder SMA</b> · $9.4M expected at 88 confidence.', tags: ['External: 127 days', 'Open slot: Wed 11:30 AM in Boston'] },
      { title: 'The Brown Group', sub: 'Contoso Wealth · New York, NY · Segment A', pill: ['Due Fri', 'a'], body: 'Introduce <b>Private Credit Fund</b> · $7.1M expected at 82. Also carries Retention Risk on $4.6M of net redemptions, so open with performance.', tags: ['External: 171 days'] },
      { title: 'The Smith Group II', sub: 'Adatum Partners · White Plains, NY · Segment A', pill: ['Due Fri', 'a'], body: 'Introduce <b>Private Credit Fund</b> · $5.6M expected at 78. Core Equity ETF focus signal (77) is close behind.', tags: ['External: 28 days'] },
    ],
    insights: [
      { icon: 'chart-line', color: 'rgb(52,211,153)', title: 'Follow-up is what makes webinars pay off', body: 'Webinar plus follow-up inside 48 hours lifted sales 1.8x over the trailing 90 days. Without a follow-up, lift was 1.1x, close to email.' },
    ],
    ctas: [aisCta.brief, aisCta.monthly],
  },
  'which segment a producers have had no external meeting in 6 months': {
    source: AIS_BRIEF,
    summary: 'Three Segment A producers have gone <b>6 months or more</b> without an external meeting, between 245 and 333 days.',
    items: [
      { title: 'Summit Advisory', sub: 'Tailspin Capital · Stamford, CT', pill: ['333 days', 'a'], body: 'Fallen Angel. Production fell from $9.3M to $1.8M over 12 months. Performance Advantage on <b>Core Equity ETF</b> (79) is the reason to call.', tags: ['Last external: Oct 24, 2025 · In-person meeting'] },
      { title: 'Charter Oak Advisors', sub: 'Litware Advisors · Hartford, CT', pill: ['305 days', 'a'], body: '$8.6M R12 and $29.6M in your funds, still growing without coverage. Upsell on <b>Core Equity ETF</b> (77).', tags: ['Last external: Nov 21, 2025 · Conference'] },
      { title: 'Doe & Roe Advisors', sub: 'Proseware Group · Hartford, CT', pill: ['245 days', 'a'], body: '$14.9M R12. Two focus signals open at 81: <b>Core Equity ETF</b> and <b>Muni Ladder SMA</b>.', tags: ['Last external: Jan 20, 2026 · Virtual meeting'] },
    ],
    insights: [
      { icon: 'route', color: 'rgb(96,165,250)', title: 'One Connecticut day covers all three', body: 'They are within an hour of each other, and the same trip reaches Harbor Point Advisors in Greenwich.' },
    ],
    ctas: [aisCta.brief, aisCta.l3],
  },
  'which touch types have lifted sales most in my territory': {
    source: AIS_MONTHLY,
    summary: '<b>In-person meetings</b> lifted sales most: 2.4x across 34 touches. Email was flat at 1.0x. Lift compares each FA/Team\u2019s daily sales run rate in the 30 days after a touch with the 30 days before, trailing 90 days.',
    bars: [['In-person meeting', 34, 2.4], ['Conference / event', 6, 1.9], ['Webinar + follow-up ≤48h', 11, 1.8], ['Virtual meeting', 19, 1.5], ['Phone call', 41, 1.2], ['Webinar, no follow-up', 14, 1.1], ['Email', 58, 1.0]],
    insights: [
      { icon: 'calendar-check', color: 'rgb(167,139,250)', title: 'Webinars only work with a follow-up', body: 'With a follow-up inside 48 hours, webinars lifted sales 1.8x. Without one, 1.1x.' },
      { icon: 'bullseye', color: 'rgb(52,211,153)', title: 'Leading with the next best action matters too', body: 'Meetings where you led with the next best action lifted sales 2.3x (22 meetings), against 1.3x for meetings on another topic (31).' },
    ],
    ctas: [aisCta.monthly, aisCta.l2],
  },
  "which nearby fa/teams should i add to this week's meetings": {
    source: AIS_BRIEF,
    summary: 'You have <b>4 meetings this week</b>. Two of the trips have an open slot near an FA/Team with a strong signal.',
    items: [
      { title: 'Alpine Partners', sub: 'Northwind Securities · Boston, MA', pill: ['Wed 11:30 AM open', 'g'], body: 'Between The Smith Group (10:00 AM) and John Doe (2:00 PM) in Boston. <b>Muni Ladder SMA</b> at 88 confidence, $9.4M. Webinar attendee, no external meeting in 127 days.', tags: ['Wed, Sep 23 · Boston, MA'] },
      { title: 'Robert Jones', sub: 'Fabrikam Financial · Philadelphia, PA', pill: ['Thu 2:30 PM open', 'g'], body: 'After Keystone Wealth (11:00 AM) in Philadelphia. <b>Core Equity ETF</b> at 75, plus Retention Risk on $1.0M of net redemptions.', tags: ['Thu, Sep 24 · Philadelphia, PA'] },
    ],
    insights: [
      { icon: 'video', color: 'rgb(96,165,250)', title: 'Friday is virtual', body: 'Blue Line Wealth at 9:30 AM has no travel attached, so there is nothing nearby to add.' },
      { icon: 'route', color: 'rgb(96,165,250)', title: 'Consider a Connecticut day', body: 'Summit Advisory, Charter Oak Advisors and Doe & Roe Advisors are Segment A relationships going cold, all within an hour of each other, and the same trip reaches Harbor Point Advisors.' },
    ],
    ctas: [aisCta.brief, aisCta.l3],
  },
};

/* Retention Risk is answered from the live book, so it matches the dashboard. */
function aisRetention() {
  const rows = (window.LV_ROWS || []).map(p => ({ p, s: p.signals.find(x => x.type === 'Retention Risk') })).filter(x => x.s)
    .sort((a, b) => b.s.oppMax - a.s.oppMax);
  if (!rows.length) return null;
  const fmt = window.distFmtM || (v => `$${v}M`);
  const total = rows.reduce((a, x) => a + x.s.oppMax, 0);
  const segA = rows.filter(x => x.p.segment === 'A');
  const top = rows[0];
  return {
    source: AIS_LIVE,
    summary: `<b>${rows.length} FA/Teams</b> carry a Retention Risk signal, with <b>${fmt(total)}</b> of your AUM exposed. The largest is <b>${top.p.name}</b> at ${fmt(top.s.oppMax)}.`,
    items: rows.slice(0, 6).map(({ p, s }) => aisSigItem(p, s, [`${aisFmt(s.oppMax)} exposed`, 'r'])),
    insights: [
      { icon: 'layer-group', color: 'rgb(248,113,113)', title: `${segA.length} of ${rows.length} are Segment A`, body: `${fmt(segA.reduce((a, x) => a + x.s.oppMax, 0))} of the exposed AUM sits with your largest relationships.` },
      { icon: 'circle-info', color: 'rgb(163,163,163)', title: 'How it is sized', body: 'Net redemptions in two of the last three months, or a competitor repricing inside a model sleeve they hold. Sized on the AUM exposed rather than the upside.' },
    ],
    ctas: [aisCta.l3],
  };
}

/* Live answers read the Segmentation & Signals book, so every row is a signal
   (what to do, on which product, how big, how sure) with the FA/Team linked. */
const aisFmt = (v) => (window.distFmtM ? distFmtM(v) : `$${v}M`);
function aisSigItem(p, s, pill) {
  const a = window.lvActivity ? lvActivity(p) : { days: null };
  return {
    sig: s, title: p.name, sub: `${p.firm} · ${p.city} · Segment ${p.segment}`,
    pill: pill || [`${s.confidence} conf.`, s.confidence >= 72 ? 'g' : 'a'], body: s.desc,
    tags: [`Signal opp. ${aisFmt(s.oppMax)}`, ...(s.product ? [s.product] : []), a.days == null ? 'No external meeting on record' : `External: ${a.days} days`],
  };
}
function aisSegACorePlus() {
  const cp = new Set(LV_CATALOG.filter(c => /core.?plus/i.test(c.cat)).map(c => c.name.replace(/^Field /, '')));
  const rows = (window.LV_ROWS || []).filter(p => p.segment === 'A')
    .map(p => ({ p, s: p.signals.filter(s => s.product && cp.has(s.product)).sort((a, b) => b.confidence - a.confidence)[0] }))
    .filter(x => x.s).sort((a, b) => b.s.confidence - a.s.confidence || b.s.oppMax - a.s.oppMax);
  if (!rows.length) return null;
  const noHold = rows.filter(x => !(x.p.holdings || []).some(h => cp.has(h.product.replace(/^Field /, ''))));
  const tot = rows.reduce((a, x) => a + x.s.oppMax, 0);
  return {
    source: AIS_LIVE,
    summary: `<b>${rows.length} Segment A FA/Teams</b> carry a Core Plus signal, worth <b>${aisFmt(tot)}</b>. ${noHold.length} hold no Core Plus product with you today. Ranked by confidence.`,
    items: rows.slice(0, 8).map(({ p, s }) => aisSigItem(p, s)),
    insights: [
      { icon: 'layer-group', color: 'rgb(96,165,250)', title: 'Core Plus runs in three vehicles', body: 'Strategic Income Fund, Core Plus Bond ETF and Core Plus SMA. Each signal names the vehicle that fits the FA/Team’s platform and holdings.' },
    ],
    ctas: [aisCta.l3],
  };
}
function aisTopNba() {
  const rows = (window.LV_ROWS || []).filter(p => p.signals.length).map(p => ({ p, s: p.signals[0] }))
    .sort((a, b) => b.s.confidence - a.s.confidence || b.s.oppMax - a.s.oppMax);
  if (!rows.length) return null;
  const top = rows.slice(0, 8);
  const tot = top.reduce((a, x) => a + x.s.oppMax, 0);
  const byType = {};
  top.forEach(x => { byType[x.s.type] = (byType[x.s.type] || 0) + 1; });
  const lead = Object.entries(byType).sort((a, b) => b[1] - a[1])[0];
  return {
    source: AIS_LIVE,
    summary: `The <b>${top.length} next best actions</b> most likely to convert this month, worth <b>${aisFmt(tot)}</b> together. ${lead[1]} of them are ${lead[0]} signals.`,
    items: top.map(({ p, s }, i) => ({ ...aisSigItem(p, s), rank: i + 1 })),
    insights: [
      { icon: 'circle-info', color: 'rgb(163,163,163)', title: 'How they are ranked', body: 'Each FA/Team’s next best action is its highest-confidence open signal. Confidence blends holdings fit, recent flows and platform availability.' },
    ],
    ctas: [aisCta.l3],
  };
}

function aiSignalAnswer(prompt) {
  const k = (prompt || '').trim().toLowerCase().replace(/[?.!]+$/, '').replace(/\u2019/g, "'");
  if (k === 'where are my retention risk signals, and how much aum is exposed') return aisRetention();
  if (k === 'which segment a prospects are most likely to buy core plus') return aisSegACorePlus();
  if (k === 'which next best actions are most likely to convert this month') return aisTopNba();
  const st = AIS_STATIC[k];
  if (!st || !st.items) return st || null;
  // Lead each static row with its signal too, when the body names one.
  return { ...st, items: st.items.map(it => {
    if (it.sig) return it;
    const m = /Introduce <b>([^<]+)<\/b>/.exec(it.body || '');
    const t = /^(Meeting Opportunity|Fallen Angel|Retention Risk|Upsell|Cross-sell|Performance Advantage|Fee Advantage)/.exec((it.body || '').replace(/<[^>]+>/g, ''));
    if (m) return { ...it, sig: { type: `Focus: ${m[1]}`, product: m[1] } };
    if (t) return { ...it, sig: { type: t[1], product: null } };
    return it;
  }) };
}

function AISPill({ text, tone }) {
  const [c, bg, bd] = AIS_TONE[tone] || AIS_TONE.g;
  return <span style={{ flexShrink: 0, fontFamily: 'Inter', fontSize: 11, fontWeight: 700, color: c, background: bg, border: `1px solid ${bd}`, borderRadius: 9999, padding: '2px 9px', whiteSpace: 'nowrap' }}>{text}</span>;
}

function AISignalAnswer({ prompt, answer, onNav }) {
  const go = (c) => {
    if (c.briefView) { try { localStorage.setItem('amp_briefs_view', c.briefView); } catch (e) {} }
    onNav && onNav(c.nav);
  };
  const maxLift = answer.bars ? Math.max(...answer.bars.map(b => b[2])) : 1;
  const sec = { fontFamily: 'Inter', fontSize: 10.5, fontWeight: 500, color: 'rgb(115,115,115)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, paddingBottom: 8, borderBottom: '1px solid rgba(75,85,99,0.3)' };
  return (
    <div style={{ width: '100%', maxWidth: 920, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(75,85,99,0.4)', borderRadius: 14, padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 18, boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <i className="fa-solid fa-sparkles" style={{ fontSize: 13, color: 'rgb(52,211,153)' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'Inter', fontSize: 11, color: 'rgb(115,115,115)', marginBottom: 3 }}><i className="fa-solid fa-user" style={{ fontSize: 9, marginRight: 6 }} />You asked</div>
          <div style={{ fontFamily: 'Inter', fontSize: 14, color: 'rgb(229,231,235)' }}>{prompt}</div>
        </div>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0, fontFamily: 'Inter', fontSize: 10.5, color: 'rgb(163,163,163)', border: '1px solid rgba(75,85,99,0.5)', borderRadius: 6, padding: '3px 8px', whiteSpace: 'nowrap' }}>
          <i className={`fa-solid fa-${answer.source.icon}`} style={{ fontSize: 9, color: 'rgb(52,211,153)' }} />From {answer.source.label}
        </span>
      </div>

      <div style={{ fontFamily: 'Inter', fontSize: 13.5, color: 'rgb(229,231,235)', lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: answer.summary }} />

      {answer.items && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {answer.items.map((it, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(75,85,99,0.35)', borderRadius: 10 }}>
              {it.rank && <div style={{ flexShrink: 0, width: 24, height: 24, borderRadius: 9999, background: 'rgb(14,159,110)', color: '#fff', fontFamily: 'Inter', fontSize: 11.5, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{it.rank}</div>}
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {it.sig && (() => { const m = (window.LV_SIG_META || {})[it.sig.type] || { color: 'rgb(167,139,250)', icon: 'bolt' }; return (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: m.color, fontFamily: 'Inter', fontSize: 13, fontWeight: 700 }}><i className={`fa-solid fa-${m.icon}`} style={{ fontSize: 11 }} />{window.lvNbaLabel ? lvNbaLabel(it.sig) : it.sig.type}</span>
                        <span style={{ fontFamily: 'Inter', fontSize: 10.5, color: 'rgb(140,148,160)' }}>{it.sig.type}</span>
                      </div>); })()}
                    <button onClick={() => window.postMessage({ ampGo: 'team:' + it.title }, '*')} title="Open FA/Team profile" className="ais-fa" style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', textAlign: 'left', fontFamily: 'Inter', fontSize: it.sig ? 12.5 : 13, fontWeight: 600, color: it.sig ? 'rgb(229,231,235)' : 'rgb(249,250,251)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      {it.title}<i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: 9, color: 'rgb(52,211,153)' }} />
                    </button>
                    <div style={{ fontFamily: 'Inter', fontSize: 11, color: 'rgb(163,163,163)', marginTop: 1 }}>{it.sub}</div>
                  </div>
                  <AISPill text={it.pill[0]} tone={it.pill[1]} />
                </div>
                <div className="ais-body" style={{ fontFamily: 'Inter', fontSize: 12.5, lineHeight: 1.55, color: 'rgb(209,213,219)' }} dangerouslySetInnerHTML={{ __html: it.body }} />
                {it.tags && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {it.tags.map(t => <span key={t} style={{ fontFamily: 'Inter', fontSize: 10.5, color: 'rgb(209,213,219)', border: '1px solid rgba(75,85,99,0.55)', borderRadius: 4, padding: '1px 7px', whiteSpace: 'nowrap' }}>{t}</span>)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {answer.bars && (
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(75,85,99,0.35)', borderRadius: 10, padding: '6px 14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.4fr) 36px minmax(0,1.6fr) 44px', gap: 12, padding: '8px 0', fontFamily: 'Inter', fontSize: 9.5, fontWeight: 600, color: 'rgb(200,205,213)', textTransform: 'uppercase', letterSpacing: 0.6, borderBottom: '1px solid rgba(75,85,99,0.3)' }}>
            <span>Touch type</span><span style={{ textAlign: 'right' }}>n</span><span /><span style={{ textAlign: 'right' }}>Lift</span>
          </div>
          {answer.bars.map(([l, n, v]) => {
            const strong = v >= 1.5;
            return (
              <div key={l} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.4fr) 36px minmax(0,1.6fr) 44px', gap: 12, alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(75,85,99,0.18)', fontFamily: 'Inter', fontSize: 12.5 }}>
                <span style={{ color: 'rgb(229,231,235)' }}>{l}</span>
                <span style={{ textAlign: 'right', color: 'rgb(107,114,128)', fontVariantNumeric: 'tabular-nums' }}>{n}</span>
                <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}><div style={{ width: `${(v / maxLift) * 100}%`, height: '100%', borderRadius: 3, background: strong ? 'rgb(16,185,129)' : 'rgb(107,114,128)' }} /></div>
                <span style={{ textAlign: 'right', fontWeight: 700, color: strong ? 'rgb(52,211,153)' : 'rgb(156,163,175)', fontVariantNumeric: 'tabular-nums' }}>{v.toFixed(1)}x</span>
              </div>
            );
          })}
        </div>
      )}

      {answer.insights && (
        <div>
          <div style={sec}>Key insights</div>
          {answer.insights.map((ins, i) => <AIInsight key={i} insight={ins} />)}
        </div>
      )}

      {answer.ctas && onNav && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {answer.ctas.map((c, i) => (
            <button key={c.label} onClick={() => go(c)} style={{
              height: 32, padding: '0 14px', borderRadius: 8, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8,
              border: `1px solid ${i === 0 ? 'rgb(16,185,129)' : 'rgba(75,85,99,0.6)'}`, background: i === 0 ? 'rgba(16,185,129,0.15)' : 'transparent',
              color: i === 0 ? 'rgb(52,211,153)' : 'rgb(229,231,235)', fontFamily: 'Inter', fontSize: 12, fontWeight: 600,
            }}><i className={`fa-solid fa-${c.icon}`} style={{ fontSize: 11 }} />{c.label}</button>
          ))}
        </div>
      )}
      <style>{'.ais-body b,.ais-body strong{color:rgb(52,211,153);font-weight:600}.ais-fa:hover{color:rgb(52,211,153)!important;text-decoration:underline}'}</style>
    </div>
  );
}

Object.assign(window, { aiSignalAnswer, AISignalAnswer });
