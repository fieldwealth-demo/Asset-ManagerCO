/* Briefs & Reviews read in the portal. Same content as the subscribed emails,
   laid out wider. Wholesaler briefs switch by sales role; leadership briefs
   switch between the regional and national view. Names, signals and figures
   inside the brief open a pop-up (see brief-popup.jsx) over the brief. */

const BRF_AUD = {
  whole: {
    views: [['brief', 'Morning Brief', 'sun'], ['monthly', 'Monthly Review & Plan', 'chart-line']],
    pickKey: 'role', pickLs: 'amp_briefs_role',
    picks: [['ext', 'External'], ['int', 'Internal'], ['spec', 'Specialist']],
  },
  lead: {
    views: [['lbrief', 'Leadership Brief', 'sun'], ['lmonthly', 'Monthly Review & Plan', 'chart-line'], ['sabrief', 'Strategic Account Brief', 'building-columns']],
    pickKey: 'scope', pickLs: 'amp_lbriefs_scope2',
    picks: [['national', 'National']],
  },
};

function BrfSeg({ options, value, onChange, icons }) {
  return (
    <div style={{ display: 'inline-flex', padding: 3, borderRadius: 9, background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(75,85,99,0.5)', gap: 2 }}>
      {options.map(([k, l, ic]) => {
        const on = value === k;
        return (
          <button key={k} onClick={() => onChange(k)} style={{
            height: icons ? 32 : 28, padding: '0 13px', borderRadius: icons ? 7 : 9999, border: 'none', cursor: 'pointer',
            background: on ? 'rgba(16,185,129,0.18)' : 'transparent', color: on ? 'rgb(52,211,153)' : 'rgb(209,213,219)',
            fontFamily: 'Inter', fontSize: 12.5, fontWeight: on ? 600 : 500, display: 'inline-flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap',
          }}>{ic && <i className={`fa-solid fa-${ic}`} style={{ fontSize: 11 }} />}{l}</button>
        );
      })}
    </div>
  );
}

/* Leadership "view as" — the briefs are written for the Northeast team, the
   national view and Contoso Wealth; other regions, salespeople and firms are
   produced by swapping names into the same layout. */
const BRF_MGR = { Northeast: 'Dana Price', Southeast: 'Lee Ortega', Midwest: 'Pat Morrow', Southwest: 'Sam Rivers', West: 'Jess Lyle' };
const BRF_BASE = { ext: 'Morgan Vance', int: 'Alex Kim', spec: 'Blair Sutton' };
function brfRegionMap(rg) {
  const m = {}, T = ML_TEAM[rg], NE = ML_TEAM.Northeast;
  if (rg === 'Northeast') return m;
  m.Northeast = rg;
  m['Dana Price'] = BRF_MGR[rg]; m.Dana = BRF_MGR[rg].split(' ')[0];
  NE.ext.forEach((n, i) => { const t = T.ext[i % T.ext.length]; m[n] = t; m[n.split(' ')[0]] = t.split(' ')[0]; });
  NE.int.forEach((n, i) => { const t = T.int[i % T.int.length]; m[n] = t; m[n.split(' ')[0]] = t.split(' ')[0]; });
  const sp = ML_SPECS.find(x => x.regions.includes(rg));
  if (sp && sp.name !== 'Blair Sutton') { m['Blair Sutton'] = sp.name; m.Blair = sp.name.split(' ')[0]; }
  const sn = ML_SPECS.filter(x => x.regions.includes(rg)).length;
  m['3 externals, 2 internals, 1 specialist'] = `${T.ext.length} externals, ${T.int.length} internal${T.int.length === 1 ? '' : 's'}, ${sn} specialist${sn === 1 ? '' : 's'}`;
  return m;
}
function brfPersonMap(p) {
  const b = BRF_BASE[p.role];
  if (b === p.name) return {};
  return { [b]: p.name, [b.split(' ')[0]]: p.name.split(' ')[0], Northeast: p.regions.join(' & ') };
}
const brfH1 = (t) => '&h1=' + encodeURIComponent(t);
const brfSub = (m) => (Object.keys(m).length ? '&sub=' + encodeURIComponent(JSON.stringify(m)) : '');

function BrfSelect({ label, value, options, onChange }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
      <span style={{ fontFamily: 'Inter', fontSize: 10, fontWeight: 600, color: 'rgb(200,205,213)', textTransform: 'uppercase', letterSpacing: 0.6 }}>{label}</span>
      <MlPicker value={value} options={options} onChange={onChange} title={label} />
    </span>
  );
}

function BriefsPage({ subs, onEdit, audience = 'whole' }) {
  const A = BRF_AUD[audience];
  const vLs = audience === 'lead' ? 'amp_lbriefs_view' : 'amp_briefs_view';
  const [view, setView] = React.useState(() => {
    try { const v = localStorage.getItem(vLs); return A.views.some(x => x[0] === v) ? v : A.views[0][0]; } catch (e) { return A.views[0][0]; }
  });
  const [pick, setPick] = React.useState(() => {
    try { const v = localStorage.getItem(A.pickLs); return A.picks.some(x => x[0] === v) ? v : A.picks[0][0]; } catch (e) { return A.picks[0][0]; }
  });
  React.useEffect(() => { try { localStorage.setItem(vLs, view); localStorage.setItem(A.pickLs, pick); } catch (e) {} }, [view, pick]);
  const lead = audience === 'lead';
  const lsGet = (k, d) => { try { return localStorage.getItem(k) || d; } catch (e) { return d; } };
  const [region, setRegion] = React.useState(() => lsGet('amp_lbriefs_region', 'National'));
  const [person, setPerson] = React.useState(() => lsGet('amp_lbriefs_person', ''));
  const [firm, setFirm] = React.useState(() => lsGet('amp_lbriefs_firm', LV_ALL_FIRMS[0]));
  React.useEffect(() => { try { localStorage.setItem('amp_lbriefs_region', region); localStorage.setItem('amp_lbriefs_person', person); localStorage.setItem('amp_lbriefs_firm', firm); } catch (e) {} }, [region, person, firm]);
  const sub = subs.find(s => s.type === view);
  const shown = sub || subNew(view);
  let srcArgs;
  const P = lead && person ? ML_PEOPLE.find(p => p.name === person) : null;
  const hPre = view === 'lmonthly' ? 'September in review: ' : '';
  const roleName = P ? (ML_ROLE_ONE[P.role] === 'Wholesaler' ? 'External' : ML_ROLE_ONE[P.role]) : '';
  if (!lead) srcArgs = [shown, `&embed=1&${A.pickKey}=${pick}`];
  else if (view === 'sabrief') srcArgs = [shown, `&embed=1${brfSub(firm !== 'Contoso Wealth' ? { 'Contoso Wealth': firm, Contoso: firm.split(' ')[0] } : {})}`];
  else if (P) srcArgs = [subNew(view === 'lmonthly' ? 'monthly' : 'brief'), `&embed=1&role=${P.role}${brfSub(brfPersonMap(P))}${brfH1(`${hPre}${P.name} · ${roleName} · ${P.regions.join(' & ')}`)}`];
  else if (region !== 'National') srcArgs = [shown, `&embed=1&scope=region${brfSub(brfRegionMap(region))}${brfH1(`${hPre}${region} region · ${BRF_MGR[region]}`)}`];
  else srcArgs = [shown, '&embed=1&scope=national'];
  const src = subUrl(...srcArgs);
  const regionOpts = [{ key: 'National', label: 'National' }, ...ML_REGIONS.map(r => ({ key: r, label: r }))];
  const personOpts = [{ key: '', label: region === 'National' ? 'Whole team' : `All of ${region}` }, ...ML_ROLE_KEYS.flatMap(k => ML_PEOPLE.filter(p => p.role === k && (region === 'National' || p.regions.includes(region))).map(p => ({ key: p.name, label: `${p.name} · ${ML_ROLE_ONE[k] === 'Wholesaler' ? 'External' : ML_ROLE_ONE[k]}` })))];
  const firmOpts = LV_ALL_FIRMS.map(f => ({ key: f, label: f }));

  const ref = React.useRef(null);
  const [h, setH] = React.useState(1400);
  // Height comes from the brief's own content box, not the document's scroll
  // height, so the frame never feeds its own size back into the measurement.
  const measure = () => {
    try {
      const d = ref.current.contentDocument;
      d.documentElement.style.overflow = 'hidden'; d.body.style.overflow = 'hidden';
      const el = d.querySelector('.em') || d.body;
      const cs = d.defaultView.getComputedStyle(d.body);
      const nh = Math.ceil(el.getBoundingClientRect().bottom + d.defaultView.scrollY + parseFloat(cs.marginBottom || 0) + parseFloat(cs.paddingBottom || 0)) + 4;
      setH(prev => (Math.abs(prev - nh) > 2 ? nh : prev));
    } catch (e) {}
  };
  React.useEffect(() => {
    let ro;
    const onLoad = () => {
      measure();
      try { ro = new ResizeObserver(measure); ro.observe(ref.current.contentDocument.querySelector('.em') || ref.current.contentDocument.body); } catch (e) {}
    };
    const f = ref.current;
    f.addEventListener('load', onLoad);
    return () => { f.removeEventListener('load', onLoad); ro && ro.disconnect(); };
  }, [src]);

  const [drafted, setDrafted] = React.useState('');
  React.useEffect(() => setDrafted(''), [src]);
  const mailTo = !lead ? null : view === 'sabrief' ? null : P ? P.name : region !== 'National' ? BRF_MGR[region] : null;
  const mailWho = !lead ? '' : view === 'sabrief' ? firm : P ? P.name : region !== 'National' ? `${region} region` : 'National';
  const emailDraft = () => {
    const subj = `${SUB_TYPES[shown.type].label}${mailWho ? ' · ' + mailWho : ''}`;
    emailOutlookDraft({ url: subOutlookUrl(...srcArgs), to: emailAddressOf(mailTo), subject: subj }).then(() => setDrafted(mailTo || 'draft')).catch(() => {});
  };
  const status = !sub ? { c: 'rgb(107,114,128)', t: 'Not subscribed' }
    : !sub.active ? { c: 'rgb(107,114,128)', t: 'Paused' }
    : { c: 'rgb(52,211,153)', t: `Emailed ${subSchedule(sub)} ET · next ${subNextSend(sub).split(' · ')[0]}` };

  return (
    <div style={{ padding: '20px 24px 48px', display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 928, margin: '0 auto', boxSizing: 'border-box', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <BrfSeg icons options={A.views} value={view} onChange={setView} />
        <div style={{ flex: 1 }} />
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontFamily: 'Inter', fontSize: 11.5, color: 'rgb(163,163,163)' }}>
          <span style={{ width: 7, height: 7, borderRadius: 9999, background: status.c }} />{status.t}
        </span>
        {drafted && <span style={{ fontFamily: 'Inter', fontSize: 11.5, color: 'rgb(110,240,180)', display: 'inline-flex', alignItems: 'center', gap: 6 }}><i className="fa-solid fa-circle-check" />{EMAIL_DRAFT_MSG}{drafted !== 'draft' ? ` · to ${drafted}` : ''}</span>}
        <button onClick={emailDraft} title="Open this brief as an Outlook draft" style={{
          height: 32, padding: '0 12px', borderRadius: 8, cursor: 'pointer', border: '1px solid rgba(75,85,99,0.7)', background: 'transparent',
          color: 'rgb(229,231,235)', fontFamily: 'Inter', fontSize: 12, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 7,
        }}><i className="fa-solid fa-share" style={{ fontSize: 11 }} />{mailTo ? `Email to ${mailTo.split(' ')[0]}` : 'Email'}</button>
        <button onClick={() => onEdit(view)} style={{
          height: 32, padding: '0 12px', borderRadius: 8, cursor: 'pointer',
          border: `1px solid ${sub ? 'rgba(75,85,99,0.7)' : 'rgb(16,185,129)'}`, background: sub ? 'transparent' : 'rgb(16,185,129)',
          color: sub ? 'rgb(229,231,235)' : '#fff', fontFamily: 'Inter', fontSize: 12, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 7,
        }}><i className={`fa-solid fa-${sub ? 'sliders' : 'envelope'}`} style={{ fontSize: 11 }} />{sub ? 'Edit' : 'Subscribe'}</button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        {lead ? (view === 'sabrief' ? (
          <BrfSelect label="Firm" value={firm} options={firmOpts} onChange={setFirm} />
        ) : (
          <>
            <span style={{ fontFamily: 'Inter', fontSize: 10, fontWeight: 600, color: 'rgb(200,205,213)', textTransform: 'uppercase', letterSpacing: 0.6 }}>View as</span>
            <BrfSelect label="Region" value={region} options={regionOpts} onChange={v => { setRegion(v); setPerson(''); }} />
            <BrfSelect label="Salesperson" value={person} options={personOpts} onChange={setPerson} />
            {(region !== 'National' || person) && <button onClick={() => { setRegion('National'); setPerson(''); }} style={{ height: 24, padding: '0 9px', borderRadius: 6, cursor: 'pointer', background: 'transparent', border: '1px solid rgba(75,85,99,0.5)', color: 'rgb(209,213,219)', fontFamily: 'Inter', fontSize: 11 }}><i className="fa-solid fa-xmark" style={{ fontSize: 9, marginRight: 5 }} />National</button>}
          </>
        )) : (
          <>
            <span style={{ fontFamily: 'Inter', fontSize: 10, fontWeight: 600, color: 'rgb(200,205,213)', textTransform: 'uppercase', letterSpacing: 0.6 }}>Sales role</span>
            <BrfSeg options={A.picks} value={pick} onChange={setPick} />
          </>
        )}
        <div style={{ flex: 1 }} />
        <span style={{ fontFamily: 'Inter', fontSize: 11, color: 'rgb(107,114,128)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <i className="fa-solid fa-arrow-pointer" style={{ fontSize: 9.5 }} />Click a name, signal or figure to open it
        </span>
      </div>
      <iframe ref={ref} key={src} src={src} scrolling="no" title={A.views.find(v => v[0] === view)[1]}
        style={{ width: '100%', height: h, border: 0, background: 'transparent', colorScheme: 'dark', display: 'block' }} />
    </div>
  );
}

Object.assign(window, { BriefsPage });
