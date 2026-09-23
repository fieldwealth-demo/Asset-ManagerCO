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

Object.assign(window, { DIM_ORDER, DIM_LABEL });
