/* Shared pieces for the Field mobile prototype. */
const { createContext, useContext, useEffect, useRef, useState } = React;

export const DATA = window.__FIELD_DATA__;
export const TEAMS = DATA.teams;
export const Nav = createContext(null);
export const useNav = () => useContext(Nav);

export const reduceMotion = (() => {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; }
})();

/* Font Awesome Pro glyph. `r` switches to the regular weight. */
export function I({ n, r, className = '', style }) {
  return <i aria-hidden="true" className={`fa ${r ? 'fr ' : ''}fa-${n} ${className}`} style={style} />;
}

/* The Field mark, used as the assistant's avatar. */
export function FieldGlyph({ size = 14 }) {
  return (
    <svg viewBox="0 0 121.35 120.36" width={size} height={size} aria-hidden="true" style={{ display: 'block' }}>
      <g fill="currentColor">
        <path d="M89.9,0v23.16H23.16v66.74H0V0h89.9Z" />
        <path d="M31.45,120.36v-23.16h66.74V30.46h23.16v89.9H31.45Z" />
      </g>
    </svg>
  );
}

export function Pill({ children, tone = 'g', small }) {
  return <span className={`pill pill-${tone}${small ? ' pill-sm' : ''}`}>{children}</span>;
}

export function Seg({ options, value, onChange, label, full }) {
  return (
    <div className={`seg${full ? ' seg-full' : ''}`} role="tablist" aria-label={label}>
      {options.map(([k, l, ic]) => (
        <button key={k} type="button" role="tab" aria-selected={value === k} className={value === k ? 'on' : ''} onClick={() => onChange(k)}>
          {ic && <I n={ic} />}{l}
        </button>
      ))}
    </div>
  );
}

/* Team names in the briefs and answers open the FA/Team profile. */
export function TeamLink({ name, children, strong }) {
  const nav = useNav();
  if (!TEAMS[name]) return <span className={strong ? 'tl-plain-strong' : ''}>{children || name}</span>;
  return (
    <button type="button" className={`tl${strong ? ' tl-strong' : ''}`} onClick={(e) => { e.stopPropagation(); nav.openTeam(name); }}>
      {children || name}{strong && !children && <I n="chevron-right" className="tl-chev" />}
    </button>
  );
}

/* Inline markup for transcribed copy: [[Team]], **green**, !!amber!! */
export function RT({ text }) {
  const parts = [];
  const re = /\[\[([^\]]+)\]\]|\*\*([^*]+)\*\*|!!([^!]+)!!/g;
  let last = 0, m, k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[1]) parts.push(<TeamLink key={k++} name={m[1]} />);
    else if (m[2]) parts.push(<span key={k++} className="hi-g">{m[2]}</span>);
    else parts.push(<span key={k++} className="hi-a">{m[3]}</span>);
    last = re.lastIndex;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}

/* Answer copy from the desktop prototype arrives as small HTML strings
   (<b>, <strong> only); they are internal and render as-is. */
export function Html({ html, className }) {
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

export function ConfBar({ value }) {
  const tone = value >= 72 ? 'var(--green)' : value >= 60 ? 'var(--amber)' : 'var(--muted)';
  return (
    <span className="conf">
      <span className="conf-track"><span style={{ width: `${value}%`, background: tone }} /></span>
      <b>{value}</b>
    </span>
  );
}

export function SectionHead({ title, note, right }) {
  return (
    <div className="sec-head">
      <div className="sec-head-row">
        <h2>{title}</h2>
        {right}
      </div>
      {note && <p className="sec-note">{note}</p>}
    </div>
  );
}

export function Toast({ msg }) {
  return <div className={`toast${msg ? ' show' : ''}`} role="status" aria-live="polite">{msg}</div>;
}

/* Bottom sheet with a scrim; closes on scrim tap or Escape. */
export function Sheet({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return;
    const k = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [open, onClose]);
  return (
    <div className={`sheet-wrap${open ? ' open' : ''}`} aria-hidden={!open}>
      <div className="sheet-scrim" onClick={onClose} />
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title}>
        <div className="sheet-grab" />
        <div className="sheet-head">
          <h3>{title}</h3>
          <button type="button" className="icon-btn" aria-label="Close" onClick={onClose}><I n="xmark" /></button>
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  );
}

export function Avatar({ init, color, size = 36, ring }) {
  return (
    <span className={`avatar${ring ? ' ring' : ''}`} style={{ width: size, height: size, background: color, fontSize: Math.round(size * 0.34) }}>{init}</span>
  );
}

export function useStagger(count, active, step = 90) {
  const [n, setN] = useState(active ? 0 : count);
  useEffect(() => {
    if (!active) { setN(count); return; }
    if (reduceMotion) { setN(count); return; }
    setN(0);
    let i = 0;
    const t = setInterval(() => { i += 1; setN(i); if (i >= count) clearInterval(t); }, step);
    return () => clearInterval(t);
  }, [count, active]);
  return n;
}

export function usePrevious(v) {
  const r = useRef(v);
  useEffect(() => { r.current = v; });
  return r.current;
}

export const fmtM = (v) => {
  const s = v < 0 ? '−' : '';
  const a = Math.abs(v);
  if (a >= 1000) return `${s}$${(a / 1000).toFixed(2)}B`;
  if (a >= 100) return `${s}$${a.toFixed(0)}M`;
  return `${s}$${a.toFixed(1)}M`;
};
