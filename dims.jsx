/* Shared dimension vocabulary — every dimension dropdown in the portal offers
   exactly these nine, in this order, with these labels. Individual grids choose
   their own default, but never their own list. */
const DIM_ORDER = [
  { key:'channels', label:'Channel' },
  { key:'firms',    label:'Firm' },
  { key:'cities',   label:'City' },
  { key:'offices',  label:'Office' },
  { key:'teams',    label:'Team/FA' },
  { key:'vehicles', label:'Vehicle' },
  { key:'cats',     label:'Category' },
  { key:'regions',  label:'Region' },
  { key:'reps',     label:'Salesperson' },
];
const DIM_LABEL = DIM_ORDER.reduce((a, d) => (a[d.key] = d.label, a), {});

/* The asset manager's pre-designated focus strategies (the categories flagged
   on the Opportunity treemap). Datasets name categories slightly differently,
   so matching is on a normalised name: "Int. Core-Plus" and "Intermediate
   Core Plus" both count as Core Plus. */
const FOCUS_STRATEGIES = ['Large Growth', 'Core Plus', 'Private Credit'];
const focusNorm = (n) => String(n || '').toLowerCase().replace(/^(int\.|intermediate)\s*/, '').replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
/* Focus categories can also be grouped by the effort behind them. */
const FOCUS_GROUPS = [
  { key: 'Franchise', desc: 'Flagship strength, defend and grow share', cats: ['Large Growth'] },
  { key: 'Scale', desc: 'Broad distribution, win on breadth', cats: ['Core Plus'] },
  { key: 'Tactical', desc: 'Time-bound push this year', cats: ['Private Credit'] },
];
const FOCUS_GROUP_OF = FOCUS_GROUPS.reduce((a, g) => (g.cats.forEach(c => { a[c] = g.key; }), a), {});
/* The active subset is chosen in each dashboard's filter drawer (all focus
   categories by default). FOCUS_VER bumps on every change so focus caches
   can tell they are stale. */
let FOCUS_NORM = new Set(FOCUS_STRATEGIES.map(focusNorm));
const isFocusCat = (n) => FOCUS_NORM.has(focusNorm(n));
function setFocusActive(list) {
  const l = list && list.length ? list : FOCUS_STRATEGIES;
  FOCUS_NORM = new Set(l.map(focusNorm));
  window.FOCUS_VER = (window.FOCUS_VER || 0) + 1;
}
window.FOCUS_VER = 0;

Object.assign(window, { DIM_ORDER, DIM_LABEL, FOCUS_STRATEGIES, FOCUS_GROUPS, FOCUS_GROUP_OF, isFocusCat, setFocusActive });
