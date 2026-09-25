/* Email subscriptions — Subscribe drawer (config + live email preview),
   Settings › Email subscriptions page, and the Home "brief is ready" card.
   One subscription per email type; recipients can include team wholesalers. */

const SUB_LINE = 'rgba(75,85,99,0.5)';
const SUB_GREEN = 'rgb(16,185,129)';
const SUB_GREEN_TXT = 'rgb(52,211,153)';
const SUB_INK = 'rgb(249,250,251)';
const SUB_INK2 = 'rgb(209,213,219)';
const SUB_MUTED = 'rgb(163,163,163)';
const SUB_DIM = 'rgb(107,114,128)';
const SUB_LS = 'amp_subs_v1';
const SUB_ME = 'morgan.vance@fieldwealth.ai';
const SUB_TEAM = ['John Doe', 'Jane Smith', 'Mary Roe', 'Robert Sample', 'Linda Public'];
const SUB_TIMES = ['6:00 AM', '6:30 AM', '7:00 AM', '7:30 AM', '8:00 AM'];
const SUB_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const SUB_TYPES = {
  brief: {
    label: 'Morning Brief', cadence: 'Daily', icon: 'sun',
    desc: "Overnight sales, this week's meetings and today's priority calls",
    file: 'emails/Morning Brief v2.html',
    outlook: 'emails/Morning Brief v2 - Outlook.html',
    subject: 'Morning Brief · 4 meetings this week, 5 priority calls',
    sections: [['overnight', 'What changed overnight'], ['meetings', 'Your meetings this week'], ['calls', "Today's priority calls"], ['cold', 'Relationships going cold'], ['followup', 'Follow up within 48 hours']],
  },
  week: {
    label: 'Week Ahead', cadence: 'Weekly', icon: 'calendar-week',
    desc: 'Booked meetings with the signal to lead with, open slots and trips',
    file: 'emails/Morning Brief v2.html?v=week',
    outlook: 'emails/Morning Brief v2 - Outlook.html?v=week',
    subject: 'Week Ahead · 4 meetings booked, 2 open slots',
    sections: [['meetings', 'Meetings this week'], ['calls', 'Priority calls'], ['cold', 'Relationships going cold'], ['followup', 'Follow-ups due']],
  },
  monthly: {
    label: 'Monthly Review & Plan', cadence: 'Monthly', icon: 'chart-line',
    desc: 'Last month\u2019s results, what worked, and next month\u2019s plan',
    file: 'emails/Monthly Review v2.html',
    outlook: 'emails/Monthly Review v2 - Outlook.html',
    subject: 'September review & October plan',
    sections: [['sales', 'Sales by product'], ['worked', 'Sales lift by touch'], ['signals', 'Signals that converted'], ['wins', 'Top wins'], ['attention', 'Needs attention'], ['booked', 'Booked meetings'], ['trip', 'Suggested trip'], ['focus', 'Focus products']],
  },
  lbrief: {
    label: 'Leadership Brief', cadence: 'Daily', icon: 'user-tie', aud: 'lead',
    desc: 'Team sales against plan, who to recognize, what to monitor and act on',
    file: 'emails/Leadership Brief.html',
    outlook: 'emails/Leadership Brief - Outlook.html',
    subject: 'Leadership Brief · Northeast at 104% of plan, 3 items to act on',
    sections: [['overnight', 'What changed overnight'], ['recognize', 'Recognize'], ['monitor', 'Monitor'], ['act', 'Act on today'], ['team', 'Team scorecard']],
  },
  lmonthly: {
    label: 'Leadership Monthly Review', cadence: 'Monthly', icon: 'chart-column', aud: 'lead',
    desc: 'Month results by salesperson or region, focus categories and next month’s plan',
    file: 'emails/Leadership Review.html',
    outlook: 'emails/Leadership Review - Outlook.html',
    subject: 'September leadership review & October plan',
    sections: [['team', 'Results by salesperson'], ['focus', 'Focus categories'], ['worked', 'What worked and didn’t'], ['recognize', 'Recognize'], ['attention', 'Needs attention'], ['plan', 'October plan']],
  },
  sabrief: {
    label: 'Strategic Account Brief', cadence: 'Daily', icon: 'building-columns', aud: 'lead',
    desc: 'One firm across every region: sales, coverage, signals and what to act on',
    file: 'emails/Strategic Account Brief.html',
    outlook: 'emails/Strategic Account Brief - Outlook.html',
    subject: 'Strategic Account Brief · Contoso Wealth up 9% MTD, 3 items to act on',
    sections: [['overnight', 'What changed overnight'], ['regions', 'By region'], ['teams', 'Top FA/Teams'], ['signals', 'Open signals'], ['act', 'Act on today']],
  },
  dash: {
    label: 'Current dashboard', cadence: 'Custom', icon: 'table-cells-large', dash: true,
    desc: 'A snapshot of the dashboard you are on, with its filters',
    sections: [['kpis', 'Headline figures'], ['tiles', 'Charts and tiles'], ['grid', 'FA/Team grid'], ['pdf', 'PDF attachment']],
  },
};
const SUB_SEGS = ['A', 'B', 'C'];
const SUB_FREQ_EFF = { Daily: 'brief', Weekly: 'week', Monthly: 'monthly' };
const subEff = s => (s.type === 'dash' ? SUB_FREQ_EFF[s.freq] || 'week' : s.type === 'lbrief' || s.type === 'sabrief' ? 'brief' : s.type === 'lmonthly' ? 'monthly' : s.type);
const subEmptyScope = () => ({ segments: [], firms: [], focus: [] });
function subScopeNorm(sc) {
  if (sc && typeof sc === 'object') return { segments: sc.segments || [], firms: sc.firms || [], focus: sc.focus || [] };
  return { ...subEmptyScope(), segments: sc === 'segA' ? ['A'] : [] };
}
function subRows() { return window.LV_ROWS || []; }
function subFirmList() {
  const n = {};
  subRows().forEach(p => { if (p.firm) n[p.firm] = (n[p.firm] || 0) + 1; });
  return Object.keys(n).sort((a, b) => n[b] - n[a]).slice(0, 10);
}
function subFocusList() { return (window.LV_SIG_TYPES || []).filter(t => t.startsWith('Focus: ')).map(t => t.slice(7)); }
function subScopeCount(sc) {
  return subRows().filter(p => (!sc.segments.length || sc.segments.includes(p.segment))
    && (!sc.firms.length || sc.firms.includes(p.firm))
    && (!sc.focus.length || (p.signals || []).some(g => g.type.startsWith('Focus: ') && sc.focus.includes(g.type.slice(7))))).length;
}
function subScopeLabel(s) {
  if (s.type === 'dash') return s.dash && s.dash.chips.length ? `${s.dash.chips.length} dashboard filter${s.dash.chips.length === 1 ? '' : 's'}` : 'Whole dashboard';
  const sc = subScopeNorm(s.scope), parts = [];
  if (sc.segments.length) parts.push(`Segment ${sc.segments.join(', ')}`);
  if (sc.firms.length) parts.push(sc.firms.length === 1 ? sc.firms[0] : `${sc.firms.length} firms`);
  if (sc.focus.length) parts.push(sc.focus.length === 1 ? sc.focus[0] : `${sc.focus.length} focus products`);
  return parts.length ? parts.join(' · ') : 'My territory';
}
function subName(s) { return s.type === 'dash' ? `${(s.dash || {}).view || 'Dashboard'} snapshot` : SUB_TYPES[s.type].label; }

function subNew(type, ctx) {
  const sections = {};
  SUB_TYPES[type].sections.forEach(([k]) => { sections[k] = true; });
  return {
    id: null, type, active: true, time: type === 'monthly' || type === 'lmonthly' ? '7:00 AM' : '6:30 AM',
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], weekday: 'Mon', monthDay: '1st business day',
    skipQuiet: false, inApp: true, sections, scope: subEmptyScope(), recipients: ['me'],
    ...(type === 'dash' ? { freq: 'Weekly', dash: ctx || { view: 'Dashboard', chips: [] } } : {}),
  };
}
/* Wholesalers are subscribed to the Morning Brief and the Monthly Review by
   default, so neither needs any set-up. */
function subLoad() {
  let v = null;
  try { v = JSON.parse(localStorage.getItem(SUB_LS)); } catch (e) {}
  if (!Array.isArray(v)) return [{ ...subNew('brief'), id: 'brief' }, { ...subNew('monthly'), id: 'monthly' }, { ...subNew('lbrief'), id: 'lbrief' }, { ...subNew('lmonthly'), id: 'lmonthly' }];
  v = v.map(s => ({ ...s, scope: subScopeNorm(s.scope) }));
  try {
    if (!localStorage.getItem('amp_subs_mig2')) {
      localStorage.setItem('amp_subs_mig2', '1');
      if (!v.some(s => s.type === 'monthly')) v.push({ ...subNew('monthly'), id: 'monthly' });
    }
    if (!localStorage.getItem('amp_subs_mig3')) {
      localStorage.setItem('amp_subs_mig3', '1');
      ['lbrief', 'lmonthly'].forEach(t => { if (!v.some(s => s.type === t)) v.push({ ...subNew(t), id: t }); });
    }
  } catch (e) {}
  return v;
}
function subSave(subs) { try { localStorage.setItem(SUB_LS, JSON.stringify(subs)); } catch (e) {} }
function subUrl(s, extra = '') {
  const t = SUB_TYPES[s.type];
  const hide = t.sections.map(([k]) => k).filter(k => !s.sections[k]);
  const lbl = subScopeLabel(s);
  return t.file + (t.file.includes('?') ? '&' : '?') + 'hide=' + hide.join(',') + (lbl !== 'My territory' ? '&scopeText=' + encodeURIComponent(lbl) : '') + extra;
}
// Same settings as subUrl, pointed at the Outlook build (embed is preview-only).
function subOutlookUrl(s, extra = '') {
  const t = SUB_TYPES[s.type];
  return t.outlook + subUrl(s, extra).slice(t.file.length).replace(/&embed=1/g, '');
}
function subNextSend(s) {
  const D = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const M = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();
  const e = subEff(s);
  if (e === 'monthly') {
    const d = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return `${M[d.getMonth()]} 1 · ${s.time}`;
  }
  const days = e === 'week' ? [s.weekday] : s.days;
  for (let i = 1; i <= 7; i++) {
    const d = new Date(now); d.setDate(now.getDate() + i);
    if (days.includes(D[d.getDay()])) return `${i === 1 ? 'Tomorrow' : `${D[d.getDay()]}, ${M[d.getMonth()]} ${d.getDate()}`} · ${s.time}`;
  }
  return 'No days selected';
}
function subSchedule(s) {
  const e = subEff(s);
  if (e === 'monthly') return `${s.monthDay} · ${s.time}`;
  if (e === 'week') return `Every ${s.weekday} · ${s.time}`;
  const wk = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const d = s.days.length === 5 && wk.every(x => s.days.includes(x)) ? 'Weekdays' : s.days.length === 7 ? 'Every day' : s.days.join(', ');
  return `${d} · ${s.time}`;
}
function subRecipLabel(s) {
  const others = s.recipients.filter(r => r !== 'me');
  const me = s.recipients.includes('me');
  if (!others.length) return 'You';
  return (me ? 'You + ' : '') + (others.length === 1 ? others[0] : `${others.length} wholesalers`);
}

const subLabel = { fontFamily: 'Inter', fontSize: 10, fontWeight: 600, color: SUB_MUTED, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 };

function SubSwitch({ on, onClick, small }) {
  const w = small ? 28 : 32, h = small ? 16 : 18;
  return (
    <button onClick={onClick} style={{
      width: w, height: h, borderRadius: 9999, border: 'none', padding: 0, cursor: 'pointer', flexShrink: 0,
      background: on ? SUB_GREEN : 'rgba(107,114,128,0.55)', position: 'relative', transition: 'background .15s',
    }}>
      <span style={{ position: 'absolute', top: 2, left: on ? w - h + 2 : 2, width: h - 4, height: h - 4, borderRadius: 9999, background: '#fff', transition: 'left .15s' }} />
    </button>
  );
}

function SubChip({ on, onClick, children, disabled }) {
  return (
    <button onClick={disabled ? undefined : onClick} style={{
      height: 28, padding: '0 11px', borderRadius: 9999, cursor: disabled ? 'default' : 'pointer',
      border: `1px solid ${on ? SUB_GREEN : SUB_LINE}`,
      background: on ? 'rgba(16,185,129,0.18)' : 'transparent',
      color: on ? SUB_GREEN_TXT : SUB_INK2, fontFamily: 'Inter', fontSize: 11.5, fontWeight: on ? 600 : 400,
      display: 'inline-flex', alignItems: 'center', gap: 6, opacity: disabled ? 0.9 : 1,
    }}>{children}</button>
  );
}

function SubCheck({ on, onClick, label }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', textAlign: 'left', padding: '7px 8px', borderRadius: 6, border: 'none',
      background: on ? 'rgba(16,185,129,0.10)' : 'transparent', cursor: 'pointer',
      display: 'flex', alignItems: 'center', gap: 9, fontFamily: 'Inter', fontSize: 12,
      color: on ? SUB_INK : SUB_MUTED,
    }}>
      <span style={{
        width: 14, height: 14, borderRadius: 3, flexShrink: 0,
        border: `1px solid ${on ? SUB_GREEN : 'rgba(107,114,128,0.7)'}`, background: on ? SUB_GREEN : 'transparent',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      }}>{on && <i className="fa-solid fa-check" style={{ fontSize: 8, color: '#fff' }} />}</span>
      {label}
    </button>
  );
}

function SubToggleRow({ on, onClick, title, sub }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'Inter', fontSize: 12, color: SUB_INK }}>{title}</div>
        {sub && <div style={{ fontFamily: 'Inter', fontSize: 10.5, color: SUB_MUTED, marginTop: 1 }}>{sub}</div>}
      </div>
      <SubSwitch on={on} onClick={onClick} />
    </div>
  );
}

function SubSelect({ value, options, onChange }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={{
      height: 32, padding: '0 10px', borderRadius: 6, border: `1px solid ${SUB_LINE}`,
      background: 'rgba(0,0,0,0.35)', color: SUB_INK, fontFamily: 'Inter', fontSize: 12, cursor: 'pointer',
    }}>{options.map(o => <option key={o} value={o}>{o}</option>)}</select>
  );
}

function SubMailHeader({ sub, subject }) {
  return (
    <div style={{ width: 640, maxWidth: '100%', boxSizing: 'border-box', borderRadius: 10, border: `1px solid ${SUB_LINE}`, background: 'rgba(255,255,255,0.03)', padding: '10px 14px', display: 'grid', gridTemplateColumns: '56px minmax(0,1fr)', rowGap: 4, fontFamily: 'Inter', fontSize: 11.5 }}>
      <span style={{ color: SUB_DIM }}>From</span><span style={{ color: SUB_INK2 }}>Field Briefs &lt;briefs@fieldwealth.ai&gt;</span>
      <span style={{ color: SUB_DIM }}>To</span><span style={{ color: SUB_INK2 }}>{sub.recipients.includes('me') ? SUB_ME : sub.recipients.join(', ')}{sub.recipients.includes('me') && sub.recipients.length > 1 ? ` + ${sub.recipients.length - 1} more` : ''}</span>
      <span style={{ color: SUB_DIM }}>Subject</span><span style={{ color: SUB_INK, fontWeight: 600 }}>{subject}</span>
    </div>
  );
}

/* Dashboard snapshot email — the dashboard's tiles in the order chosen, with
   the filters it was subscribed under. */
function SubDashPreview({ sub }) {
  const d = sub.dash || { view: 'Dashboard', chips: [] };
  const on = SUB_TYPES.dash.sections.filter(([k]) => sub.sections[k]);
  const ph = { borderRadius: 10, border: '1px solid #374151', background: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.035) 0 8px, transparent 8px 16px)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 11, color: SUB_MUTED };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
      <SubMailHeader sub={sub} subject={`${d.view} · ${sub.freq.toLowerCase()} snapshot`} />
      <div style={{ width: 640, maxWidth: '100%', boxSizing: 'border-box', background: '#111928', borderRadius: 8, padding: '32px 28px', display: 'flex', flexDirection: 'column', gap: 18, boxShadow: '0 10px 40px rgba(0,0,0,0.45)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: '#0E9F6E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16, color: '#fff' }}>F</div>
          <span style={{ fontFamily: 'Inter', fontSize: 18, fontWeight: 700, color: '#fff' }}>Field</span>
          <span style={{ flex: 1 }} />
          <span style={{ fontFamily: 'Inter', fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.8 }}>{sub.freq} snapshot</span>
        </div>
        <div>
          <div style={{ fontFamily: 'Inter', fontSize: 26, fontWeight: 700, color: '#fff', letterSpacing: -0.4 }}>{d.view}</div>
          <div style={{ fontFamily: 'Inter', fontSize: 14, color: '#9CA3AF', marginTop: 6 }}>Rebuilt from your latest data before each send, using the filters below.</div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {d.chips.length ? d.chips.map(c => <span key={c} style={{ fontFamily: 'Inter', fontSize: 12, color: SUB_GREEN_TXT, border: '1px solid rgba(16,185,129,0.45)', background: 'rgba(16,185,129,0.1)', borderRadius: 9999, padding: '2px 10px' }}>{c}</span>)
            : <span style={{ fontFamily: 'Inter', fontSize: 12, color: '#9CA3AF' }}>No filters · whole territory</span>}
        </div>
        {on.filter(([k]) => k !== 'pdf').map(([k, l]) => <div key={k} style={{ ...ph, height: k === 'kpis' ? 72 : 150 }}>{l.toLowerCase()}</div>)}
        {sub.sections.pdf && <div style={{ fontFamily: 'Inter', fontSize: 12.5, color: '#D1D5DB', display: 'flex', alignItems: 'center', gap: 8 }}><i className="fa-solid fa-paperclip" style={{ color: '#9CA3AF' }} />{d.view}.pdf attached</div>}
        <div style={{ textAlign: 'center', background: '#0E9F6E', color: '#fff', fontFamily: 'Inter', fontWeight: 600, fontSize: 15, borderRadius: 8, padding: 12 }}>Open {d.view}</div>
      </div>
    </div>
  );
}

/* Email preview — the actual email file, with section toggles applied. */
function SubEmailPreview({ sub }) {
  const ref = React.useRef(null);
  const [h, setH] = React.useState(1600);
  const t = SUB_TYPES[sub.type];
  const onLoad = () => { try { setH(ref.current.contentDocument.documentElement.scrollHeight); } catch (e) {} };
  if (t.dash) return <SubDashPreview sub={sub} />;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
      <SubMailHeader sub={sub} subject={t.subject} />
      <iframe ref={ref} key={subUrl(sub)} src={subUrl(sub)} onLoad={onLoad} title="Email preview"
        style={{ width: 640, maxWidth: '100%', height: h, border: 0, borderRadius: 8, background: '#111928', boxShadow: '0 10px 40px rgba(0,0,0,0.45)' }} />
    </div>
  );
}

function SubScopeGroup({ label, options, value, onToggle, fmt }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ fontFamily: 'Inter', fontSize: 11, color: SUB_MUTED }}>{label}</div>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
        {options.map(o => <SubChip key={o} on={value.includes(o)} onClick={() => onToggle(o)}>{fmt ? fmt(o) : o}</SubChip>)}
      </div>
    </div>
  );
}

function SubscribeDrawer({ open, initial, ctx, onClose, onSave, onDelete }) {
  const [s, setS] = React.useState(initial || subNew('brief'));
  const [tested, setTested] = React.useState(false);
  React.useEffect(() => { if (open && initial) { setS(initial); setTested(false); } }, [open, initial]);
  const set = (patch) => setS(prev => ({ ...prev, ...patch }));
  const t = SUB_TYPES[s.type];
  const isNew = !s.id;
  const pickType = (type) => {
    if (type === s.type) return;
    if (type === 'dash' && !ctx) return;
    const base = subNew(type, ctx);
    setS({ ...base, id: s.id && s.type === type ? s.id : null, recipients: s.recipients, scope: subScopeNorm(s.scope), inApp: s.inApp });
  };
  const eff = subEff(s);
  const scope = subScopeNorm(s.scope);
  const togScope = (k, v) => set({ scope: { ...scope, [k]: scope[k].includes(v) ? scope[k].filter(x => x !== v) : [...scope[k], v] } });
  const scopeAny = scope.segments.length + scope.firms.length + scope.focus.length > 0;
  const toggleDay = (d) => set({ days: s.days.includes(d) ? s.days.filter(x => x !== d) : SUB_DAYS.filter(x => x === d || s.days.includes(x)) });
  const toggleRecip = (r) => set({ recipients: s.recipients.includes(r) ? s.recipients.filter(x => x !== r) : [...s.recipients, r] });
  const secOn = t.sections.filter(([k]) => s.sections[k]).length;
  const canSave = s.recipients.length > 0 && secOn > 0 && (eff !== 'brief' || s.days.length > 0);

  return (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 90,
        opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none', transition: 'opacity .22s ease-out',
      }} />
      <aside style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 'min(1160px, calc(100vw - 72px))', zIndex: 100,
        background: 'rgb(17,24,39)', borderLeft: '1px solid rgba(75,85,99,0.6)',
        transform: open ? 'translateX(0)' : 'translateX(100%)', transition: 'transform .26s cubic-bezier(.2,.8,.2,1)',
        display: 'flex', flexDirection: 'column', boxShadow: open ? '-20px 0 60px rgba(0,0,0,0.5)' : 'none', visibility: open ? 'visible' : 'hidden', transitionProperty: 'transform, visibility', transitionDelay: open ? '0s' : '0s, .26s',
      }}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid rgba(75,85,99,0.4)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <i className="fa-solid fa-envelope" style={{ color: SUB_GREEN_TXT }} />
          <div>
            <div style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 16, color: SUB_INK }}>{isNew ? 'Subscribe to email' : `Edit ${subName(s)}`}</div>
            <div style={{ fontFamily: 'Inter', fontSize: 10.5, color: SUB_MUTED, marginTop: 1 }}>Built nightly from your sales, CRM activity, calendar and signals</div>
          </div>
          <div style={{ flex: 1 }} />
          <button onClick={onClose} style={{ width: 28, height: 28, border: `1px solid ${SUB_LINE}`, borderRadius: 6, background: 'transparent', color: SUB_MUTED, cursor: 'pointer' }}><i className="fa-solid fa-xmark" /></button>
        </div>

        <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
          <div style={{ width: 400, flexShrink: 0, overflowY: 'auto', padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 22, borderRight: '1px solid rgba(75,85,99,0.4)' }}>
            <div>
              <div style={subLabel}>Email</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {Object.entries(SUB_TYPES).map(([k, v]) => {
                  const on = s.type === k;
                  const off = v.dash && !ctx;
                  const dc = on ? s.dash : ctx;
                  const desc = v.dash ? (dc ? `${dc.view} · ${dc.chips.length ? `${dc.chips.length} filter${dc.chips.length === 1 ? '' : 's'} applied` : 'no filters applied'}` : 'Open Subscribe from a dashboard to use this') : v.desc;
                  return (
                    <button key={k} onClick={() => pickType(k)} disabled={off} style={{
                      textAlign: 'left', padding: '10px 12px', borderRadius: 8, cursor: off ? 'default' : 'pointer', opacity: off ? 0.5 : 1,
                      border: `1px solid ${on ? SUB_GREEN : SUB_LINE}`, background: on ? 'rgba(16,185,129,0.12)' : 'rgba(0,0,0,0.25)',
                      display: 'flex', alignItems: 'center', gap: 12,
                    }}>
                      <i className={`fa-solid fa-${v.icon}`} style={{ width: 16, fontSize: 13, color: on ? SUB_GREEN_TXT : SUB_DIM }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontFamily: 'Inter', fontSize: 12.5, fontWeight: 600, color: SUB_INK }}>{v.label}</span>
                          <span style={{ fontFamily: 'Inter', fontSize: 9, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', color: on ? SUB_GREEN_TXT : SUB_DIM, border: `1px solid ${on ? 'rgba(16,185,129,0.5)' : SUB_LINE}`, borderRadius: 4, padding: '1px 5px' }}>{v.dash && on ? s.freq : v.cadence}</span>
                        </div>
                        <div style={{ fontFamily: 'Inter', fontSize: 10.5, color: SUB_MUTED, marginTop: 2 }}>{desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div style={subLabel}>Delivery</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {s.type === 'dash' && (
                  <div style={{ display: 'flex', gap: 6 }}>
                    {Object.keys(SUB_FREQ_EFF).map(f => <SubChip key={f} on={s.freq === f} onClick={() => set({ freq: f, weekday: 'Mon', time: '6:30 AM' })}>{f}</SubChip>)}
                  </div>
                )}
                {eff === 'brief' && (
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    {SUB_DAYS.map(d => <SubChip key={d} on={s.days.includes(d)} onClick={() => toggleDay(d)}>{d}</SubChip>)}
                  </div>
                )}
                {eff === 'week' && (
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[['Sun', 'Sunday evening'], ['Mon', 'Monday morning']].map(([d, l]) => <SubChip key={d} on={s.weekday === d} onClick={() => set({ weekday: d, time: d === 'Sun' ? '6:00 PM' : '6:30 AM' })}>{l}</SubChip>)}
                  </div>
                )}
                {eff === 'monthly' && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {['1st business day', '1st of the month'].map(d => <SubChip key={d} on={s.monthDay === d} onClick={() => set({ monthDay: d })}>{d}</SubChip>)}
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontFamily: 'Inter', fontSize: 12, color: SUB_INK2 }}>Arrives at</span>
                  <SubSelect value={s.time} options={eff === 'week' && s.weekday === 'Sun' ? ['5:00 PM', '6:00 PM', '7:00 PM'] : SUB_TIMES} onChange={v => set({ time: v })} />
                  <span style={{ fontFamily: 'Inter', fontSize: 11, color: SUB_DIM }}>ET</span>
                </div>
                {s.type === 'brief' && <SubToggleRow on={s.skipQuiet} onClick={() => set({ skipQuiet: !s.skipQuiet })} title="Skip days with no meetings or new signals" />}
                <SubToggleRow on={s.inApp} onClick={() => set({ inApp: !s.inApp })} title="Also show on Ask Field home" sub="Read it in the portal as well as your inbox" />
              </div>
            </div>

            <div>
              <div style={{ ...subLabel, display: 'flex' }}><span style={{ flex: 1 }}>Sections</span><span style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 400, color: SUB_DIM }}>{secOn} of {t.sections.length}</span></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {t.sections.map(([k, l]) => <SubCheck key={k} on={!!s.sections[k]} label={l} onClick={() => set({ sections: { ...s.sections, [k]: !s.sections[k] } })} />)}
              </div>
            </div>

            <div>
              <div style={{ ...subLabel, display: 'flex' }}><span style={{ flex: 1 }}>Scope</span>{s.type !== 'dash' && scopeAny && <button onClick={() => set({ scope: subEmptyScope() })} style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', color: SUB_GREEN_TXT, fontFamily: 'Inter', fontSize: 10.5, textTransform: 'none', letterSpacing: 0 }}>Clear</button>}</div>
              {s.type === 'dash' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ fontFamily: 'Inter', fontSize: 12, color: SUB_INK2 }}>Uses the filters on {s.dash.view} when you subscribed.</div>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    {s.dash.chips.length ? s.dash.chips.map(c => <SubChip key={c} on disabled>{c}</SubChip>) : <span style={{ fontFamily: 'Inter', fontSize: 11.5, color: SUB_DIM }}>No filters · whole territory</span>}
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(75,85,99,0.35)' }}>
                    <span style={{ flex: 1, fontFamily: 'Inter', fontSize: 12, color: SUB_INK }}>{window.LV_TERRITORY || 'My'} territory{scopeAny ? ', filtered' : ''}</span>
                    <span style={{ fontFamily: 'Inter', fontSize: 11, color: scopeAny ? SUB_GREEN_TXT : SUB_DIM, fontVariantNumeric: 'tabular-nums' }}>{subScopeCount(scope)} of {subRows().length} FA/Teams</span>
                  </div>
                  <SubScopeGroup label="Segment" options={SUB_SEGS} value={scope.segments} onToggle={v => togScope('segments', v)} fmt={v => `Segment ${v}`} />
                  <SubScopeGroup label="Focus categories" options={subFocusList()} value={scope.focus} onToggle={v => togScope('focus', v)} />
                  <SubScopeGroup label="Firms" options={subFirmList()} value={scope.firms} onToggle={v => togScope('firms', v)} />
                </div>
              )}
            </div>

            <div>
              <div style={subLabel}>Recipients</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <SubChip on={s.recipients.includes('me')} onClick={() => toggleRecip('me')}><i className="fa-solid fa-user" style={{ fontSize: 9 }} />Me</SubChip>
                {SUB_TEAM.map(n => <SubChip key={n} on={s.recipients.includes(n)} onClick={() => toggleRecip(n)}>{n}</SubChip>)}
              </div>
              <div style={{ fontFamily: 'Inter', fontSize: 10.5, color: SUB_DIM, marginTop: 8, lineHeight: 1.5 }}>Each wholesaler gets a version built from their own territory, meetings and signals.</div>
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', background: 'rgb(11,18,32)', padding: '18px 24px 40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, fontFamily: 'Inter', fontSize: 10, fontWeight: 600, color: SUB_MUTED, textTransform: 'uppercase', letterSpacing: 0.6 }}>
              <i className="fa-solid fa-eye" style={{ fontSize: 10 }} />Preview
              <span style={{ flex: 1 }} />
              <span style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 400, color: SUB_DIM }}>Next send: {subNextSend(s)}</span>
            </div>
            <SubEmailPreview sub={s} />
          </div>
        </div>

        <div style={{ padding: '14px 22px', borderTop: '1px solid rgba(75,85,99,0.4)', display: 'flex', gap: 10, alignItems: 'center' }}>
          <button onClick={() => { if (s.type === 'dash') { setTested(true); return; } emailOutlookDraft({ url: subOutlookUrl(s), to: SUB_ME, subject: `[Test] ${t.subject}`, filename: `Test - ${t.label}` }).then(() => setTested(true)); }} style={{
            height: 38, padding: '0 14px', borderRadius: 8, border: `1px solid ${SUB_LINE}`, background: 'transparent',
            color: SUB_INK2, fontFamily: 'Inter', fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8,
          }}><i className="fa-solid fa-paper-plane" style={{ fontSize: 11 }} />Send me a test</button>
          {tested && <span style={{ fontFamily: 'Inter', fontSize: 11.5, color: 'rgb(110,240,180)', display: 'inline-flex', alignItems: 'center', gap: 6 }}><i className="fa-solid fa-circle-check" />{s.type === 'dash' ? `Test sent to ${SUB_ME}` : EMAIL_DRAFT_MSG}</span>}
          {!isNew && <button onClick={() => onDelete(s)} style={{ height: 38, padding: '0 10px', border: 'none', background: 'transparent', color: 'rgb(249,128,128)', fontFamily: 'Inter', fontSize: 12.5, cursor: 'pointer' }}>Unsubscribe</button>}
          <div style={{ flex: 1 }} />
          <button onClick={onClose} style={{ height: 38, padding: '0 16px', borderRadius: 8, border: '1px solid rgba(75,85,99,0.6)', background: 'transparent', color: SUB_INK2, fontFamily: 'Inter', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
          <button disabled={!canSave} onClick={() => onSave(s)} style={{
            height: 38, padding: '0 20px', borderRadius: 8, border: `1px solid ${canSave ? SUB_GREEN : SUB_LINE}`,
            background: canSave ? SUB_GREEN : 'transparent', color: canSave ? '#fff' : SUB_DIM,
            fontFamily: 'Inter', fontSize: 13, fontWeight: 600, cursor: canSave ? 'pointer' : 'not-allowed',
          }}>{isNew ? 'Subscribe' : 'Save changes'}</button>
        </div>
      </aside>
    </>
  );
}

/* Read an email inside the portal (Home card → Read brief). */
function SubEmailModal({ sub, onClose, onManage }) {
  if (!sub) return null;
  const t = SUB_TYPES[sub.type];
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 110, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', overflowY: 'auto', padding: '40px 20px' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 700, maxWidth: '100%', height: 'fit-content', background: 'rgb(17,24,39)', border: '1px solid rgba(75,85,99,0.6)', borderRadius: 14, padding: '16px 20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <i className={`fa-solid fa-${t.icon}`} style={{ color: SUB_GREEN_TXT }} />
          <span style={{ fontFamily: 'Inter', fontSize: 15, fontWeight: 600, color: SUB_INK }}>{t.label}</span>
          <span style={{ fontFamily: 'Inter', fontSize: 11.5, color: SUB_MUTED }}>Delivered today · {sub.time}</span>
          <div style={{ flex: 1 }} />
          <button onClick={onManage} style={{ height: 28, padding: '0 10px', borderRadius: 6, border: `1px solid ${SUB_LINE}`, background: 'transparent', color: SUB_INK2, fontFamily: 'Inter', fontSize: 11.5, cursor: 'pointer' }}>Edit subscription</button>
          <button onClick={onClose} style={{ width: 28, height: 28, border: `1px solid ${SUB_LINE}`, borderRadius: 6, background: 'transparent', color: SUB_MUTED, cursor: 'pointer' }}><i className="fa-solid fa-xmark" /></button>
        </div>
        <SubEmailPreview sub={sub} />
      </div>
    </div>
  );
}

/* Home — today's brief, or an invitation to subscribe. */
function HomeBriefCard({ subs, onRead, onSubscribe }) {
  const sub = subs.find(s => s.type === 'brief' && s.active && s.inApp && s.recipients.includes('me'));
  const box = { width: 620, maxWidth: '100%', boxSizing: 'border-box', borderRadius: 14, border: '1px solid rgba(16,185,129,0.35)', background: 'rgba(16,185,129,0.06)', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 };
  if (!sub) {
    return (
      <div style={{ ...box, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <i className="fa-solid fa-sun" style={{ fontSize: 16, color: SUB_GREEN_TXT }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'Inter', fontSize: 13, fontWeight: 600, color: SUB_INK }}>Start each day with a Morning Brief</div>
          <div style={{ fontFamily: 'Inter', fontSize: 11.5, color: SUB_MUTED, marginTop: 2 }}>Overnight sales, this week's meetings with the signal to lead with, and today's priority calls.</div>
        </div>
        <button onClick={() => onSubscribe('brief')} style={{ height: 32, padding: '0 14px', borderRadius: 8, border: `1px solid ${SUB_GREEN}`, background: SUB_GREEN, color: '#fff', fontFamily: 'Inter', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>Subscribe</button>
      </div>
    );
  }
  const items = [
    ['circle', 'rgb(49,196,141)', '$2.35M in sales yesterday from 4 FA/Teams'],
    ['circle', 'rgb(167,139,250)', '4 meetings this week, each matched to a signal'],
    ['circle', 'rgb(227,160,8)', '3 Segment A relationships going cold'],
  ];
  return (
    <div style={box}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <i className="fa-solid fa-sun" style={{ fontSize: 13, color: SUB_GREEN_TXT }} />
        <span style={{ fontFamily: 'Inter', fontSize: 13, fontWeight: 600, color: SUB_INK }}>Your Morning Brief is ready</span>
        <span style={{ fontFamily: 'Inter', fontSize: 11, color: SUB_MUTED }}>Delivered {sub.time} · also in your inbox</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {items.map(([ic, c, txt]) => (
          <div key={txt} style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'Inter', fontSize: 12.5, color: SUB_INK2 }}>
            <span style={{ width: 7, height: 7, borderRadius: 9999, background: c, flexShrink: 0 }} />{txt}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button onClick={() => onRead(sub)} style={{ height: 30, padding: '0 14px', borderRadius: 8, border: `1px solid ${SUB_GREEN}`, background: SUB_GREEN, color: '#fff', fontFamily: 'Inter', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>Read brief<i className="fa-solid fa-chevron-right" style={{ fontSize: 9 }} /></button>
        <button onClick={() => onSubscribe('brief')} style={{ height: 30, padding: '0 12px', borderRadius: 8, border: `1px solid ${SUB_LINE}`, background: 'transparent', color: SUB_INK2, fontFamily: 'Inter', fontSize: 12, cursor: 'pointer' }}>Edit</button>
      </div>
    </div>
  );
}

/* Settings › Email subscriptions */
function SubscriptionsPage({ subs, setSubs, onEdit }) {
  const card = { border: `1px solid ${SUB_LINE}`, borderRadius: 12, background: 'rgba(255,255,255,0.025)' };
  const byType = (type) => subs.find(s => s.type === type);
  const toggleTeam = (name, type) => {
    const ex = byType(type);
    if (!ex) { setSubs([...subs, { ...subNew(type), id: type, recipients: [name] }]); return; }
    const has = ex.recipients.includes(name);
    const recipients = has ? ex.recipients.filter(r => r !== name) : [...ex.recipients, name];
    setSubs(recipients.length ? subs.map(s => s === ex ? { ...s, recipients } : s) : subs.filter(s => s !== ex));
  };
  const setActive = (s, v) => setSubs(subs.map(x => x === s ? { ...x, active: v } : x));
  const unsubscribed = Object.keys(SUB_TYPES).filter(k => !SUB_TYPES[k].dash && !byType(k));
  const dashSubs = subs.filter(s => s.type === 'dash');
  const rowGrid = { display: 'grid', gridTemplateColumns: 'minmax(0,1.5fr) minmax(0,1.1fr) minmax(0,1fr) 150px', gap: 16, alignItems: 'center', padding: '14px 16px' };
  const stdTypes = Object.entries(SUB_TYPES).filter(([, t]) => !t.dash);
  const teamTypes = stdTypes.filter(([, t]) => !t.aud);
  return (
    <div style={{ padding: '28px 32px 60px', maxWidth: 980, display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 260 }}>
          <div style={{ fontFamily: 'Inter', fontSize: 22, fontWeight: 600, color: SUB_INK }}>Email subscriptions</div>
          <div style={{ fontFamily: 'Inter', fontSize: 12.5, color: SUB_MUTED, marginTop: 4 }}>Emails built nightly from your sales, CRM activity, calendar and signals.</div>
        </div>
        {unsubscribed.length > 0 && (
          <button onClick={() => onEdit(unsubscribed[0])} style={{ height: 34, padding: '0 14px', borderRadius: 8, border: `1px solid ${SUB_GREEN}`, background: SUB_GREEN, color: '#fff', fontFamily: 'Inter', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}><i className="fa-solid fa-plus" style={{ fontSize: 10 }} />New subscription</button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={subLabel}>Subscriptions</div>
        <div style={card}>
          {stdTypes.map(([k, t], i) => {
            const s = byType(k);
            return (
              <div key={k} style={{ ...rowGrid, borderTop: i ? '1px solid rgba(75,85,99,0.35)' : 'none', opacity: s && !s.active ? 0.6 : 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: s ? 'rgba(16,185,129,0.14)' : 'rgba(255,255,255,0.04)', border: `1px solid ${s ? 'rgba(16,185,129,0.4)' : SUB_LINE}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className={`fa-solid fa-${t.icon}`} style={{ fontSize: 12, color: s ? SUB_GREEN_TXT : SUB_DIM }} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: 'Inter', fontSize: 13, fontWeight: 600, color: SUB_INK }}>{t.label}</div>
                    <div style={{ fontFamily: 'Inter', fontSize: 11, color: SUB_MUTED, marginTop: 1 }}>{s ? `${t.sections.filter(([x]) => s.sections[x]).length} of ${t.sections.length} sections · ${subScopeLabel(s)}` : t.desc}</div>
                  </div>
                </div>
                <div style={{ fontFamily: 'Inter', fontSize: 12, color: SUB_INK2 }}>
                  {s ? subSchedule(s) : <span style={{ color: SUB_DIM }}>Not subscribed</span>}
                  {s && <div style={{ fontSize: 11, color: s.active ? SUB_GREEN_TXT : SUB_DIM, marginTop: 2 }}>{s.active ? `Next: ${subNextSend(s)}` : 'Paused'}</div>}
                </div>
                <div style={{ fontFamily: 'Inter', fontSize: 12, color: SUB_INK2 }}>{s ? subRecipLabel(s) : ''}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'flex-end' }}>
                  {s ? (
                    <>
                      <SubSwitch on={s.active} onClick={() => setActive(s, !s.active)} />
                      <button onClick={() => onEdit(k)} style={{ height: 28, padding: '0 12px', borderRadius: 6, border: `1px solid ${SUB_LINE}`, background: 'transparent', color: SUB_INK2, fontFamily: 'Inter', fontSize: 11.5, cursor: 'pointer' }}>Edit</button>
                    </>
                  ) : (
                    <button onClick={() => onEdit(k)} style={{ height: 28, padding: '0 12px', borderRadius: 6, border: `1px solid ${SUB_GREEN}`, background: 'rgba(16,185,129,0.15)', color: SUB_GREEN_TXT, fontFamily: 'Inter', fontSize: 11.5, fontWeight: 600, cursor: 'pointer' }}>Subscribe</button>
                  )}
                </div>
              </div>
            );
          })}
          {dashSubs.map(s => (
            <div key={s.id} style={{ ...rowGrid, borderTop: '1px solid rgba(75,85,99,0.35)', opacity: s.active ? 1 : 0.6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: 'rgba(16,185,129,0.14)', border: '1px solid rgba(16,185,129,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="fa-solid fa-table-cells-large" style={{ fontSize: 12, color: SUB_GREEN_TXT }} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: 'Inter', fontSize: 13, fontWeight: 600, color: SUB_INK }}>{subName(s)}</div>
                  <div style={{ fontFamily: 'Inter', fontSize: 11, color: SUB_MUTED, marginTop: 1 }}>{s.freq} · {subScopeLabel(s)}</div>
                </div>
              </div>
              <div style={{ fontFamily: 'Inter', fontSize: 12, color: SUB_INK2 }}>
                {subSchedule(s)}
                <div style={{ fontSize: 11, color: s.active ? SUB_GREEN_TXT : SUB_DIM, marginTop: 2 }}>{s.active ? `Next: ${subNextSend(s)}` : 'Paused'}</div>
              </div>
              <div style={{ fontFamily: 'Inter', fontSize: 12, color: SUB_INK2 }}>{subRecipLabel(s)}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'flex-end' }}>
                <SubSwitch on={s.active} onClick={() => setActive(s, !s.active)} />
                <button onClick={() => onEdit('dash', s.dash)} style={{ height: 28, padding: '0 12px', borderRadius: 6, border: `1px solid ${SUB_LINE}`, background: 'transparent', color: SUB_INK2, fontFamily: 'Inter', fontSize: 11.5, cursor: 'pointer' }}>Edit</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={subLabel}>Your team</div>
        <div style={{ fontFamily: 'Inter', fontSize: 12, color: SUB_MUTED, marginTop: -4 }}>Subscribe your wholesalers. Each receives a version built from their own territory.</div>
        <div style={card}>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) repeat(3, 110px)', gap: 16, padding: '10px 16px', borderBottom: '1px solid rgba(75,85,99,0.35)', fontFamily: 'Inter', fontSize: 10, fontWeight: 600, color: SUB_DIM, textTransform: 'uppercase', letterSpacing: 0.6 }}>
            <span>Wholesaler</span>
            {teamTypes.map(([, t]) => <span key={t.label} style={{ textAlign: 'center' }}>{t.cadence}</span>)}
          </div>
          {SUB_TEAM.map((n, i) => (
            <div key={n} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) repeat(3, 110px)', gap: 16, alignItems: 'center', padding: '11px 16px', borderTop: i ? '1px solid rgba(75,85,99,0.25)' : 'none' }}>
              <span style={{ fontFamily: 'Inter', fontSize: 12.5, color: SUB_INK }}>{n}</span>
              {teamTypes.map(([k]) => {
                const s = byType(k);
                return <span key={k} style={{ display: 'flex', justifyContent: 'center' }}><SubSwitch small on={!!(s && s.recipients.includes(n))} onClick={() => toggleTeam(n, k)} /></span>;
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SubToast({ msg }) {
  return (
    <div style={{
      position: 'fixed', left: '50%', bottom: 28, zIndex: 120, transform: `translateX(-50%) translateY(${msg ? 0 : 20}px)`,
      opacity: msg ? 1 : 0, pointerEvents: 'none', transition: 'opacity .2s, transform .2s',
      padding: '10px 16px', borderRadius: 10, background: 'rgb(17,24,39)', border: '1px solid rgba(16,185,129,0.5)',
      boxShadow: '0 10px 30px rgba(0,0,0,0.45)', fontFamily: 'Inter', fontSize: 12.5, color: SUB_INK,
      display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap',
    }}><i className="fa-solid fa-circle-check" style={{ color: SUB_GREEN_TXT }} />{msg}</div>
  );
}

/* App-level state hook so App stays thin. */
function useSubscriptions() {
  const [subs, setSubsRaw] = React.useState(subLoad);
  const setSubs = (v) => { setSubsRaw(v); subSave(v); };
  const [editing, setEditing] = React.useState(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [reading, setReading] = React.useState(null);
  const [toast, setToast] = React.useState('');
  const [ctx, setCtx] = React.useState(null);
  const flash = (m) => { setToast(m); clearTimeout(window.__subToastT); window.__subToastT = setTimeout(() => setToast(''), 3200); };
  const subId = s => (s.type === 'dash' ? `dash:${s.dash.view}` : s.type);
  // ctx = { view, chips } for the dashboard the drawer was opened from; it
  // enables the "Current dashboard" option.
  const open = (type = 'brief', c = null) => {
    const ex = type === 'dash' && c ? subs.find(s => s.id === `dash:${c.view}`) : subs.find(s => s.type === type);
    setCtx(c);
    setEditing(ex ? { ...ex, scope: subScopeNorm(ex.scope) } : subNew(type, c));
    setReading(null);
    setDrawerOpen(true);
  };
  const save = (s) => {
    const id = subId(s);
    const saved = { ...s, id };
    const rest = subs.filter(x => x.id !== id && (s.type === 'dash' || x.type !== s.type));
    setSubs([...rest, saved]);
    setDrawerOpen(false);
    flash(`${s.id ? 'Saved' : 'Subscribed to'} ${subName(s)} · next send ${subNextSend(saved)}`);
  };
  const remove = (s) => {
    setSubs(subs.filter(x => x.id !== s.id));
    setDrawerOpen(false);
    flash(`Unsubscribed from ${subName(s)}`);
  };
  const ui = (
    <>
      <SubscribeDrawer open={drawerOpen} initial={editing} ctx={ctx} onClose={() => setDrawerOpen(false)} onSave={save} onDelete={remove} />
      <SubEmailModal sub={reading} onClose={() => setReading(null)} onManage={() => open(reading.type)} />
      <SubToast msg={toast} />
    </>
  );
  return { subs, setSubs, open, read: setReading, ui, subscribed: subs.some(s => s.active) };
}

Object.assign(window, { SubscribeDrawer, SubscriptionsPage, HomeBriefCard, SubEmailModal, SubToast, useSubscriptions, SUB_TYPES, subNew, subUrl, subOutlookUrl, subSchedule, subNextSend, subScopeLabel });
