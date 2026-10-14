/* Data Explorer — pivot grid, signal pills and the FA drill-through drawer. */

const EXS = {
  hi: 'rgb(249,250,251)', ink: 'rgb(209,213,219)', dim: 'rgb(163,163,163)', mute: 'rgb(120,128,141)',
  line: 'rgba(75,85,99,0.55)', lineSoft: 'rgba(75,85,99,0.32)', panel: 'rgba(17,24,39,0.72)', panelSolid: 'rgb(17,24,39)',
  acc: 'rgb(52,211,153)', accBg: 'rgba(16,185,129,0.14)', dimC: 'rgb(96,165,250)', calcC: 'rgb(251,191,36)', neg: 'rgb(248,113,113)',
  mono: 'ui-monospace, SFMono-Regular, Menlo, monospace',
};

function exSigMeta(type) {
  const m = (window.LV_SIG_META || {})[type];
  return m || { short: type, color: 'rgb(148,163,184)', icon: 'bolt' };
}

const EX_GRID_THEMES = {
  light: { bg: '#ffffff', hdr: '#f1f3f5', hdrInk: '#374151', letters: '#e9ecef', lettersInk: '#6b7280', line: '#d4d8dd', lineStrong: '#b8bec6', ink: '#1f2937', hi: '#111827', mute: '#9ca3af', sub: '#f7f8fa', subOpen: '#eef1f4', total: '#e3f4ec', totalLine: '#0e9f6e', acc: '#047857', neg: '#c81e1e', sel: 'rgba(16,185,129,0.10)', selLine: '#0e9f6e', rowHover: '#f3f9f6', pillBg: '#ffffff' },
  dark: { bg: 'rgb(15,24,37)', hdr: 'rgb(22,31,46)', hdrInk: EXS.dim, letters: 'rgb(26,36,52)', lettersInk: EXS.mute, line: EXS.lineSoft, lineStrong: EXS.line, ink: EXS.ink, hi: EXS.hi, mute: EXS.mute, sub: 'rgb(15,24,37)', subOpen: 'rgb(20,30,44)', total: 'rgb(16,44,44)', totalLine: 'rgba(52,211,153,0.4)', acc: EXS.acc, neg: EXS.neg, sel: 'rgba(16,185,129,0.08)', selLine: EXS.acc, rowHover: 'rgba(255,255,255,0.025)', pillBg: 'rgba(255,255,255,0.04)' },
};
const exColLetter = i => { let s = ''; i++; while (i > 0) { const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; };

function ExSigPill({ s, showFa, T = EX_GRID_THEMES.dark }) {
  const m = exSigMeta(s.type);
  return (
    <span title={s.type + (s.product ? ' · ' + s.product : '') + ' · ' + s.confidence + ' confidence' + (s.fa ? ' · ' + s.fa : '')} style={{
      display: 'inline-flex', alignItems: 'center', gap: 5, height: 20, padding: '0 7px', borderRadius: 4,
      background: T.pillBg, border: '1px solid ' + m.color + '88', color: T.ink, fontSize: 11, whiteSpace: 'nowrap',
    }}>
      <i className={'fa-solid fa-' + m.icon} style={{ fontSize: 9, color: m.color }} />
      {m.short}
      <span style={{ color: T === EX_GRID_THEMES.light ? T.hi : m.color, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{s.confidence}</span>
      {showFa && s.fa && <span style={{ color: T.mute, maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.fa}</span>}
    </span>
  );
}

function ExCell({ x, m, selected, onClick, bold, style, T }) {
  let body, color = T.ink, title;
  if (x.na) { body = 'n/a'; color = T.mute; title = m.label + ' is held at the FA grain and is not split by product dimensions. Remove the product field from Rows/Columns to see it.'; }
  else if (Array.isArray(x.v)) body = x.v.length ? <div style={{ display: 'flex', gap: 4 }}>{x.v.map(s => <ExSigPill key={s.id} s={s} T={T} />)}</div> : <span style={{ color: T.mute }}>—</span>;
  else {
    body = exFmt(x.v, m.fmt);
    if (typeof x.v === 'number' && x.v < 0 && (m.fmt === '$' || m.fmt === 'd1s' || m.fmt === 'pp' || m.fmt === 'pct2')) color = T.neg;
    if (x.v == null) color = T.mute;
  }
  const sig = m.fmt === 'sig';
  return (
    <td className={style && style.position === 'sticky' ? '' : 'ex-v'} onClick={onClick} title={title} style={{
      padding: '0 8px', height: 26, textAlign: sig ? 'left' : 'right', whiteSpace: 'nowrap', cursor: 'cell',
      fontVariantNumeric: 'tabular-nums', fontSize: 12, color, fontWeight: bold ? 600 : 400,
      borderBottom: '1px solid ' + T.line, borderRight: '1px solid ' + T.line,
      boxShadow: selected ? 'inset 0 0 0 2px ' + T.selLine : 'none', background: selected ? T.sel : undefined, ...style,
    }}>{body}</td>
  );
}

function ExGrid({ p, cfg, setSort, isOpen, toggle, selected, onSelect, onFa, running, limit = 600, theme = 'light' }) {
  const T = EX_GRID_THEMES[theme] || EX_GRID_THEMES.light;
  const cols = [];
  if (p.colKeys.length) { p.colKeys.forEach(ck => p.values.forEach(m => cols.push([ck, m]))); p.values.forEach(m => cols.push([null, m, true])); }
  else p.values.forEach(m => cols.push([null, m]));
  const flat = [];
  const walk = nodes => { for (const n of nodes) { if (flat.length >= limit) return; flat.push(n); if (!n.leaf && isOpen(n.id)) walk(n.kids()); } };
  walk(p.top);
  let total = 0; const cnt = nodes => nodes.forEach(n => { total++; if (!n.leaf && isOpen(n.id)) cnt(n.kids()); }); cnt(p.top);

  const sortIcon = key => {
    if (!cfg.sort || cfg.sort.col !== key) return <i className="fa-solid fa-sort" style={{ fontSize: 9, opacity: 0.35 }} />;
    return <i className={'fa-solid fa-sort-' + (cfg.sort.dir < 0 ? 'down' : 'up')} style={{ fontSize: 9, color: T.acc }} />;
  };
  const RN = 44, LH = 22, HH = 28;
  const th = { position: 'sticky', background: T.hdr, zIndex: 2, fontSize: 11.5, fontWeight: 600, color: T.hdrInk, padding: '0 8px', whiteSpace: 'nowrap', borderBottom: '1px solid ' + T.lineStrong, borderRight: '1px solid ' + T.line };
  const letter = { ...th, top: 0, height: LH, background: T.letters, color: T.lettersInk, fontWeight: 500, fontSize: 10.5, textAlign: 'center', padding: 0 };
  const rnCell = { position: 'sticky', left: 0, zIndex: 1, width: RN, minWidth: RN, background: T.letters, color: T.lettersInk, fontSize: 10.5, textAlign: 'center', borderRight: '1px solid ' + T.lineStrong, borderBottom: '1px solid ' + T.line, fontVariantNumeric: 'tabular-nums' };
  const corner = p.rowDims.length ? p.rowDims.map(d => d.label).join(' › ') : '';
  const hdrTop = LH + (p.colKeys.length ? HH : 0);
  const nLetters = 1 + cols.length;

  if (!p.values.length && !p.rowDims.length) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, background: T.bg }}>
        <div style={{ maxWidth: 380, textAlign: 'center', color: T.mute, fontSize: 12.5, lineHeight: 1.6 }}>
          <div style={{ color: T.hi, fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Build a pivot</div>
          Drag dimensions into Rows or Columns and measures into Values. Double-click a field to add it. Pick a saved view above to start from an example.
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, minHeight: 0, overflow: 'auto', position: 'relative', background: T.bg, opacity: running ? 0.6 : 1, transition: 'opacity 120ms' }}>
      <style>{'.ex-row-' + theme + ':hover td.ex-v{background-color:' + T.rowHover + ' !important}'}</style>
      <div style={{ display: 'inline-block', minWidth: '100%', verticalAlign: 'top' }}>
      <table style={{ borderCollapse: 'separate', borderSpacing: 0, minWidth: '100%', fontFamily: 'Inter' }}>
        <thead>
          <tr>
            <th style={{ ...letter, left: 0, zIndex: 5, width: RN, minWidth: RN, borderRight: '1px solid ' + T.lineStrong }} />
            {Array.from({ length: nLetters }, (_, i) => <th key={i} style={{ ...letter, ...(i === 0 ? { left: RN, zIndex: 5 } : {}) }}>{exColLetter(i)}</th>)}
          </tr>
          {p.colKeys.length > 0 && (
            <tr>
              <th rowSpan={2} style={{ ...rnCell, position: 'sticky', top: LH, zIndex: 5, background: T.letters }} />
              <th rowSpan={2} style={{ ...th, top: LH, left: RN, zIndex: 5, textAlign: 'left', minWidth: 240 }}>
                <button onClick={() => setSort('__label')} style={exHdrBtn}>{corner || 'Total'} {sortIcon('__label')}</button>
              </th>
              {p.colKeys.map(ck => (
                <th key={ck} colSpan={p.values.length} style={{ ...th, top: LH, height: HH, textAlign: 'center', color: T.hi }}>{ck.split(p.SEP).join(' · ')}</th>
              ))}
              <th colSpan={p.values.length} style={{ ...th, top: LH, height: HH, textAlign: 'center', color: T.acc }}>Total</th>
            </tr>
          )}
          <tr>
            {!p.colKeys.length && <th style={{ ...rnCell, position: 'sticky', top: LH, zIndex: 5, height: HH }} />}
            {!p.colKeys.length && (
              <th style={{ ...th, top: LH, left: RN, zIndex: 5, height: HH, textAlign: 'left', minWidth: 240 }}>
                <button onClick={() => setSort('__label')} style={exHdrBtn}>{corner || 'Total'} {sortIcon('__label')}</button>
              </th>
            )}
            {cols.map(([ck, m]) => {
              const key = m.id + '|' + (ck || '');
              return (
                <th key={key} title={m.def || m.expr} style={{ ...th, top: hdrTop, height: HH, textAlign: m.fmt === 'sig' ? 'left' : 'right', minWidth: m.fmt === 'sig' ? 260 : 104 }}>
                  <button onClick={() => setSort(key)} style={{ ...exHdrBtn, justifyContent: m.fmt === 'sig' ? 'flex-start' : 'flex-end', width: '100%' }}>
                    {m.group === 'Calculated' && <span style={{ color: '#b45309', fontFamily: EXS.mono, fontSize: 10, fontStyle: 'italic' }}>fx</span>}
                    {m.label} {m.fmt !== 'sig' && sortIcon(key)}
                  </button>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {flat.map((n, ri) => {
            const open = !n.leaf && isOpen(n.id);
            const sub = !n.leaf;
            const rowBg = sub ? (open ? T.subOpen : T.sub) : T.bg;
            return (
              <tr key={n.id} className={'ex-row-' + theme}>
                <td style={rnCell}>{ri + 1}</td>
                <td className="ex-v" style={{ position: 'sticky', left: RN, zIndex: 1, background: rowBg, padding: '0 8px 0 ' + (6 + n.depth * 18) + 'px', height: 26, borderBottom: '1px solid ' + T.line, borderRight: '1px solid ' + T.lineStrong, whiteSpace: 'nowrap', maxWidth: 360 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {sub ? (
                      <button onClick={() => toggle(n.id)} style={{ width: 14, height: 14, border: '1px solid ' + T.lineStrong, borderRadius: 2, background: T.bg, color: T.hdrInk, cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, lineHeight: 1, fontFamily: EXS.mono }}>{open ? '−' : '+'}</button>
                    ) : <span style={{ width: 14 }} />}
                    {n.dim.faLink ? (
                      <button onClick={() => onFa(n.rows[0].f)} style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', color: T.acc, fontSize: 12, fontWeight: 500, fontFamily: 'Inter', overflow: 'hidden', textOverflow: 'ellipsis', textDecoration: 'underline', textDecorationColor: T.acc + '55', textUnderlineOffset: 2 }}>{n.key}</button>
                    ) : (
                      <span style={{ fontSize: 12, color: sub ? T.hi : T.ink, fontWeight: sub ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.key}</span>
                    )}
                    {sub && <span style={{ fontSize: 10, color: T.mute }}>({n.kids().length})</span>}
                  </div>
                </td>
                {cols.map(([ck, m, isTot]) => {
                  const key = n.id + '|' + m.id + '|' + (ck || '');
                  return <ExCell key={key} T={T} x={p.value(n.rows, ck, m)} m={m} bold={sub || isTot} selected={selected && selected.key === key} onClick={() => onSelect({ key, node: n, ck, m })} style={{ background: selected && selected.key === key ? T.sel : isTot ? T.sub : rowBg }} />;
                })}
              </tr>
            );
          })}
          <tr>
            <td style={{ ...rnCell, bottom: 0, zIndex: 3, borderTop: '2px solid ' + T.totalLine }}>Σ</td>
            <td style={{ position: 'sticky', left: RN, bottom: 0, zIndex: 3, background: T.total, padding: '0 8px 0 26px', height: 28, borderTop: '2px solid ' + T.totalLine, borderRight: '1px solid ' + T.lineStrong, fontSize: 12, fontWeight: 700, color: T.hi }}>Grand total</td>
            {cols.map(([ck, m]) => {
              const key = '__total|' + m.id + '|' + (ck || '');
              return <ExCell key={key} T={T} x={p.value(p.rows, ck, m)} m={m} bold selected={selected && selected.key === key} onClick={() => onSelect({ key, node: null, ck, m })} style={{ position: 'sticky', bottom: 0, zIndex: 2, background: T.total, borderTop: '2px solid ' + T.totalLine, height: 28 }} />;
            })}
          </tr>
        </tbody>
      </table>
      </div>
      {total > flat.length && (
        <div style={{ position: 'sticky', left: 0, padding: '10px 14px', fontSize: 11.5, color: T.mute }}>
          Showing {flat.length.toLocaleString()} of {total.toLocaleString()} rows. Add a filter or collapse groups, or export to get every row.
        </div>
      )}
    </div>
  );
}
const exHdrBtn = { display: 'inline-flex', alignItems: 'center', gap: 6, border: 'none', background: 'transparent', color: 'inherit', font: 'inherit', cursor: 'pointer', padding: 0 };

/* ---- FA drill-through ----------------------------------------------------- */

function ExFaDrawer({ fa, onClose, onFilter, level }) {
  if (!fa) return null;
  const rows = EX_DATA.rows.filter(r => r.f === fa);
  const last = rows.filter(r => r.m === 5);
  const sum = k => last.reduce((a, r) => a + r[k], 0);
  const act = fa.l2.reduce((a, m) => ({ meet: a.meet + m.meet, call: a.call + m.call, email: a.email + m.email, event: a.event + m.event, camp: a.camp + m.camp }), { meet: 0, call: 0, email: 0, event: 0, camp: 0 });
  const kv = (k, v, hint) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '6px 0', borderBottom: `1px solid ${EXS.lineSoft}`, fontSize: 12 }}>
      <span style={{ color: EXS.dim }} title={hint}>{k}</span><span style={{ color: EXS.hi, textAlign: 'right' }}>{v}</span>
    </div>
  );
  const sec = t => <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: EXS.mute, margin: '18px 0 6px' }}>{t}</div>;
  return ReactDOM.createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 70 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 440, maxWidth: '100%', background: 'rgb(17,24,39)', borderLeft: `1px solid ${EXS.line}`, boxShadow: '-20px 0 40px -10px rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', fontFamily: 'Inter' }}>
        <div style={{ padding: '18px 20px 14px', borderBottom: `1px solid ${EXS.line}`, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: EXS.hi }}>{fa.name}</div>
            <div style={{ fontSize: 12, color: EXS.dim, marginTop: 3 }}>{fa.team} · {fa.firm} · {fa.city}, {fa.state}</div>
            <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
              {[`CRD ${fa.crd}`, fa.channel, ...(level >= 2 ? [fa.producer, fa.covered ? 'Covered' : 'Uncovered'] : []), ...(level >= 3 ? [`Segment ${fa.segment}`] : [])].map(t => (
                <span key={t} style={{ height: 20, padding: '0 8px', borderRadius: 5, border: `1px solid ${EXS.line}`, fontSize: 10.5, color: EXS.ink, display: 'inline-flex', alignItems: 'center' }}>{t}</span>
              ))}
            </div>
          </div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${EXS.line}`, background: 'transparent', color: EXS.dim, cursor: 'pointer' }}><i className="fa-solid fa-xmark" /></button>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '4px 20px 20px' }}>
          {sec(`Position · ${EX_MONTHS[5]}`)}
          {kv('Market AUM', exMoney(sum('aum')))}
          {kv('Client AUM', exMoney(sum('aumT')))}
          {kv('Market share · AUM', exFmt(sum('aumT') / sum('aum'), '%'))}
          {kv('Client gross sales (6 mo)', exMoney(rows.reduce((a, r) => a + r.gsT, 0)))}
          {sec('Signals · FA_SIGNALS')}
          {level < 3 ? <div style={{ fontSize: 12, color: EXS.dim }}>Turns on in Phase 3.</div> : fa.signals.length === 0 ? <div style={{ fontSize: 12, color: EXS.dim }}>No open signals.</div> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {fa.signals.map((s, i) => {
                const m = exSigMeta(s.type);
                return (
                  <div key={s.id} style={{ padding: '10px 12px', borderRadius: 9, border: `1px solid ${i < 3 ? m.color + '66' : EXS.lineSoft}`, background: 'rgba(255,255,255,0.025)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <i className={`fa-solid fa-${m.icon}`} style={{ fontSize: 11, color: m.color, width: 14 }} />
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: EXS.hi, flex: 1 }}>{s.type}</span>
                      {i < 3 && <span style={{ fontSize: 9.5, fontWeight: 700, color: EXS.acc, letterSpacing: 0.3 }}>TOP {i + 1}</span>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                      <div style={{ flex: 1, height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.08)' }}><div style={{ width: s.confidence + '%', height: '100%', borderRadius: 3, background: m.color }} /></div>
                      <span style={{ fontSize: 11.5, color: EXS.hi, fontVariantNumeric: 'tabular-nums', width: 22, textAlign: 'right' }}>{s.confidence}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 14, marginTop: 7, fontSize: 11, color: EXS.dim, flexWrap: 'wrap' }}>
                      {s.product && <span>{s.product}</span>}<span>{exMoney(s.opp)} expected</span><span>{s.method}</span><span>{s.source}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {level >= 2 && <>
            {sec('CRM activity · last 6 months')}
            {kv('Meetings', act.meet)}{kv('Calls', act.call)}{kv('Emails', act.email)}{kv('Events attended', act.event)}{kv('Campaign touches', act.camp)}
            {kv('Days since last meeting', fa.lastMeet == null ? '—' : fa.lastMeet + 'd')}
          </>}
          {sec('Provenance')}
          {kv('Source pack', fa.pack)}
          {kv('Secondary pack', fa.secondary)}
          {kv('Source grain', fa.grain)}
          {kv('FA derivation method', fa.faDeriv, 'Direct = advisor-native pack. ML-Attributed = allocated down by the FA Attribution Engine.')}
          {kv('Time derivation method', fa.timeDeriv)}
          {kv('FA attribution confidence', fa.attConf)}
          {kv('Confidence tier', `Tier ${fa.tier}`, '1 (highest) to 5, at the deepest record grain.')}
          {kv('Quality flag', fa.quality)}
          {kv('Data freshness', `${fa.freshness} mo`)}
        </div>
        <div style={{ padding: 14, borderTop: `1px solid ${EXS.line}`, display: 'flex', gap: 8 }}>
          <button onClick={() => onFilter(fa)} style={exBtn('primary')}><i className="fa-solid fa-filter" style={{ fontSize: 10 }} /> Filter pivot to this FA</button>
          <button onClick={onClose} style={exBtn()}>Close</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function exBtn(kind) {
  const pr = kind === 'primary';
  return {
    height: 30, padding: '0 12px', borderRadius: 7, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7, whiteSpace: 'nowrap',
    background: pr ? 'rgb(16,185,129)' : 'rgba(255,255,255,0.04)', border: `1px solid ${pr ? 'rgb(16,185,129)' : 'rgba(75,85,99,0.6)'}`,
    color: pr ? '#fff' : 'rgb(209,213,219)', fontFamily: 'Inter', fontSize: 12, fontWeight: pr ? 600 : 500,
  };
}

Object.assign(window, { EX_GRID_THEMES, EXS, ExGrid, ExFaDrawer, ExSigPill, exBtn, exSigMeta });
