/* Data Explorer engine — the browser stand-in for the semantic layer.
   Every measure carries its governed aggregation rule (point-in-time AUM,
   ratio market share, sales-weighted matchups, FA-grain CRM and signals),
   so a pivot can roll up any way without producing a wrong total. In
   production this file's job is done by MetricFlow compiling to Snowflake
   SQL; exSQL() shows what that compiled query looks like. */

const EX_FIELDS = [...EX_DIMS, ...EX_MEASURES];

function exFieldMap(calc) {
  const m = {};
  EX_FIELDS.forEach(f => (m[f.id] = f));
  (calc || []).forEach(c => (m[c.id] = { ...c, kind: 'measure', group: 'Calculated', agg: 'calc' }));
  return m;
}

/* ---- formatting ---------------------------------------------------------- */

function exMoney(v) {
  if (v == null || isNaN(v)) return '—';
  const a = Math.abs(v), s = v < 0 ? '-' : '';
  if (a >= 1e9) return `${s}$${(a / 1e9).toFixed(2)}B`;
  if (a >= 1e6) return `${s}$${(a / 1e6).toFixed(1)}M`;
  if (a >= 1e3) return `${s}$${(a / 1e3).toFixed(0)}K`;
  return `${s}$${a.toFixed(0)}`;
}
function exFmt(v, fmt) {
  if (v == null || (typeof v === 'number' && !isFinite(v))) return '—';
  const sg = x => (x > 0 ? '+' : '');
  switch (fmt) {
    case '$': return exMoney(v);
    case '%': return (v * 100).toFixed(1) + '%';
    case 'pct2': return sg(v) + v.toFixed(2) + '%';
    case 'pp': return sg(v) + v.toFixed(1) + ' pp';
    case 'd1s': return sg(v) + v.toFixed(1);
    case 'd1': return v.toFixed(1);
    case 'd0': return Math.round(v).toString();
    case 'days': return Math.round(v) + 'd';
    case 'n': return Math.round(v).toLocaleString('en-US');
    default: return Math.abs(v) >= 1000 ? Math.round(v).toLocaleString('en-US') : (+v.toFixed(2)).toString();
  }
}

/* ---- semantic aggregation ------------------------------------------------ */

function exUniqFa(rows) { const s = new Map(); rows.forEach(r => s.set(r.f.idx, r.f)); return [...s.values()]; }

function exCompute(meas, rows, F, cache) {
  if (!meas) return null;
  let c = cache && cache.get(rows);
  if (cache && !c) { c = {}; cache.set(rows, c); }
  if (c && meas.id in c) return c[meas.id];
  let v = null;
  switch (meas.agg) {
    case 'sum': v = 0; for (const r of rows) v += meas.fn(r); break;
    case 'last': { let mx = -1; for (const r of rows) if (r.m > mx) mx = r.m; v = 0; for (const r of rows) if (r.m === mx) v += meas.fn(r); break; }
    case 'ratio': { const n = exCompute(F[meas.num], rows, F, cache), d = exCompute(F[meas.den], rows, F, cache); v = d ? n / d : null; break; }
    case 'wavg': { let a = 0, w = 0; for (const r of rows) { a += meas.fn(r) * r.gs; w += r.gs; } v = w ? a / w : null; break; }
    case 'count': v = rows.length; break;
    case 'countd': v = exUniqFa(rows).length; break;
    case 'faAvg': { const fs = exUniqFa(rows); v = fs.length ? fs.reduce((a, f) => a + meas.fn(f), 0) / fs.length : null; break; }
    case 'faMin': { const xs = exUniqFa(rows).map(meas.fn).filter(x => x != null); v = xs.length ? Math.min(...xs) : null; break; }
    case 'faMonth': { const seen = new Set(); v = 0; for (const r of rows) { const k = r.f.idx * 16 + r.m; if (!seen.has(k)) { seen.add(k); v += r.f.l2[r.m][meas.k]; } } break; }
    case 'sig': {
      const sigs = exUniqFa(rows).flatMap(f => f.signals);
      v = meas.k === 'count' ? sigs.length : meas.k === 'hi' ? sigs.filter(s => s.confidence >= 75).length : meas.k === 'opp' ? sigs.reduce((a, s) => a + s.opp, 0) : sigs.length ? sigs.reduce((a, s) => a + s.confidence, 0) / sigs.length : null;
      break;
    }
    case 'top3': {
      const fs = exUniqFa(rows);
      v = fs.flatMap(f => f.signals.map(s => ({ ...s, fa: f.name }))).sort((a, b) => b.confidence - a.confidence).slice(0, 3);
      break;
    }
    case 'calc': {
      try { v = exEval(meas.ast || exParse(meas.expr), rows, F, cache); } catch (e) { v = null; }
      break;
    }
  }
  if (c) c[meas.id] = v;
  return v;
}

/* Row-level value of a measure — what SUM()/AVG()/MIN()/MAX() iterate over. */
function exRowVal(meas, r) {
  if (meas.fn && (meas.agg === 'sum' || meas.agg === 'last' || meas.agg === 'wavg')) return meas.fn(r);
  return exCompute(meas, [r], exFieldMap([]), null);
}

/* ---- formula language (base set) -----------------------------------------
   [Field Name] references any governed measure or dimension. A bare measure
   reference uses its governed rollup; SUM/AVG/MIN/MAX/COUNT iterate rows.  */

const EX_FUNCS = [
  { name: 'SUM', sig: 'SUM([Measure])', desc: 'Sum of the row-level values.' },
  { name: 'AVG', sig: 'AVG([Measure])', desc: 'Average of the row-level values.' },
  { name: 'MIN', sig: 'MIN([Measure]) or MIN(a, b)', desc: 'Smallest value.' },
  { name: 'MAX', sig: 'MAX([Measure]) or MAX(a, b)', desc: 'Largest value.' },
  { name: 'COUNT', sig: 'COUNT()', desc: 'Number of records.' },
  { name: 'COUNTD', sig: 'COUNTD([Dimension])', desc: 'Number of distinct values.' },
  { name: 'DIVIDE', sig: 'DIVIDE(a, b)', desc: 'a ÷ b, blank when b is 0.' },
  { name: 'IF', sig: 'IF(condition, then, else)', desc: 'Conditional value.' },
  { name: 'AND', sig: 'AND(a, b, …)', desc: 'True when every argument is true.' },
  { name: 'OR', sig: 'OR(a, b, …)', desc: 'True when any argument is true.' },
  { name: 'ABS', sig: 'ABS(x)', desc: 'Absolute value.' },
  { name: 'ROUND', sig: 'ROUND(x, digits)', desc: 'Round to digits.' },
  { name: 'IFNULL', sig: 'IFNULL(x, fallback)', desc: 'Fallback when x is blank.' },
];

function exTokenize(s) {
  const t = []; let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (/\s/.test(c)) { i++; continue; }
    if (c === '[') { const j = s.indexOf(']', i); if (j < 0) throw new Error('Missing ] after field name'); t.push({ k: 'ref', v: s.slice(i + 1, j).trim() }); i = j + 1; continue; }
    if (/[0-9.]/.test(c)) { let j = i; while (j < s.length && /[0-9.]/.test(s[j])) j++; t.push({ k: 'num', v: parseFloat(s.slice(i, j)) }); i = j; continue; }
    if (/[A-Za-z_]/.test(c)) { let j = i; while (j < s.length && /[A-Za-z_0-9]/.test(s[j])) j++; t.push({ k: 'id', v: s.slice(i, j).toUpperCase() }); i = j; continue; }
    if (c === '"' || c === "'") { const j = s.indexOf(c, i + 1); if (j < 0) throw new Error('Unclosed text'); t.push({ k: 'str', v: s.slice(i + 1, j) }); i = j + 1; continue; }
    const two = s.slice(i, i + 2);
    if (['>=', '<=', '<>', '!='].includes(two)) { t.push({ k: 'op', v: two === '!=' ? '<>' : two }); i += 2; continue; }
    if ('+-*/(),><=%'.includes(c)) { t.push({ k: 'op', v: c }); i++; continue; }
    throw new Error(`Unexpected "${c}"`);
  }
  return t;
}

function exParse(src) {
  const t = exTokenize(src || ''); let p = 0;
  if (!t.length) throw new Error('Enter a formula');
  const peek = () => t[p], eat = v => { const x = t[p]; if (!x || (v && x.v !== v)) throw new Error(`Expected ${v || 'value'}`); p++; return x; };
  const isOp = v => t[p] && t[p].k === 'op' && t[p].v === v;
  function expr() { let a = add(); while (t[p] && t[p].k === 'op' && ['>', '<', '>=', '<=', '=', '<>'].includes(t[p].v)) { const o = t[p++].v; a = { t: 'bin', o, a, b: add() }; } return a; }
  function add() { let a = mul(); while (isOp('+') || isOp('-')) { const o = t[p++].v; a = { t: 'bin', o, a, b: mul() }; } return a; }
  function mul() { let a = un(); while (isOp('*') || isOp('/')) { const o = t[p++].v; a = { t: 'bin', o, a, b: un() }; } return a; }
  function un() { if (isOp('-')) { p++; return { t: 'neg', a: un() }; } let a = prim(); if (isOp('%')) { p++; a = { t: 'bin', o: '/', a, b: { t: 'num', v: 100 } }; } return a; }
  function prim() {
    const x = peek(); if (!x) throw new Error('Formula ends early');
    if (x.k === 'num') { p++; return { t: 'num', v: x.v }; }
    if (x.k === 'str') { p++; return { t: 'str', v: x.v }; }
    if (x.k === 'ref') { p++; return { t: 'ref', v: x.v }; }
    if (x.k === 'id') {
      p++;
      if (x.v === 'TRUE' || x.v === 'FALSE') return { t: 'num', v: x.v === 'TRUE' ? 1 : 0 };
      if (!EX_FUNCS.some(f => f.name === x.v)) throw new Error(`Unknown function ${x.v}`);
      eat('('); const args = [];
      if (!isOp(')')) { args.push(expr()); while (isOp(',')) { p++; args.push(expr()); } }
      eat(')'); return { t: 'fn', n: x.v, args };
    }
    if (isOp('(')) { p++; const e = expr(); eat(')'); return e; }
    throw new Error(`Unexpected "${x.v}"`);
  }
  const e = expr();
  if (p < t.length) throw new Error(`Unexpected "${t[p].v}"`);
  return e;
}

function exResolve(name, F) {
  const n = name.toLowerCase();
  return Object.values(F).find(f => f.label.toLowerCase() === n || f.id.toLowerCase() === n);
}

function exRefs(ast, out = []) {
  if (!ast) return out;
  if (ast.t === 'ref') out.push(ast.v);
  if (ast.a) exRefs(ast.a, out); if (ast.b) exRefs(ast.b, out);
  (ast.args || []).forEach(a => exRefs(a, out));
  return out;
}

function exValidate(expr, F, selfId) {
  const ast = exParse(expr);
  exRefs(ast).forEach(r => {
    const f = exResolve(r, F);
    if (!f) throw new Error(`No field named [${r}]`);
    if (f.id === selfId) throw new Error('A field cannot reference itself');
    if (f.agg === 'top3') throw new Error(`[${r}] is a display field and cannot be used in math`);
  });
  return ast;
}

function exEval(n, rows, F, cache) {
  const ev = x => exEval(x, rows, F, cache);
  switch (n.t) {
    case 'num': case 'str': return n.v;
    case 'neg': { const a = ev(n.a); return a == null ? null : -a; }
    case 'ref': {
      const f = exResolve(n.v, F); if (!f) throw new Error('ref');
      if (f.kind === 'dim') { const vs = new Set(rows.map(f.get)); return vs.size === 1 ? [...vs][0] : null; }
      return exCompute(f, rows, F, cache);
    }
    case 'bin': {
      const a = ev(n.a), b = ev(n.b);
      if (n.o === '=') return a === b ? 1 : 0; if (n.o === '<>') return a !== b ? 1 : 0;
      if (a == null || b == null) return null;
      switch (n.o) { case '+': return a + b; case '-': return a - b; case '*': return a * b; case '/': return b ? a / b : null; case '>': return a > b ? 1 : 0; case '<': return a < b ? 1 : 0; case '>=': return a >= b ? 1 : 0; case '<=': return a <= b ? 1 : 0; }
      return null;
    }
    case 'fn': {
      const A = n.args;
      const series = () => { const r = A[0] && A[0].t === 'ref' && exResolve(A[0].v, F); if (!r || r.kind !== 'measure') return null; return rows.map(x => exRowVal(r, x)).filter(v => v != null); };
      switch (n.n) {
        case 'SUM': { const s = series(); return s ? s.reduce((a, b) => a + b, 0) : ev(A[0]); }
        case 'AVG': { const s = series(); return s ? (s.length ? s.reduce((a, b) => a + b, 0) / s.length : null) : ev(A[0]); }
        case 'MIN': case 'MAX': {
          if (A.length > 1) { const vs = A.map(ev).filter(v => v != null); return vs.length ? Math[n.n.toLowerCase()](...vs) : null; }
          const s = series(); return s && s.length ? Math[n.n.toLowerCase()](...s) : null;
        }
        case 'COUNT': return rows.length;
        case 'COUNTD': { const d = A[0] && exResolve(A[0].v, F); return d && d.kind === 'dim' ? new Set(rows.map(d.get)).size : exUniqFa(rows).length; }
        case 'DIVIDE': { const a = ev(A[0]), b = ev(A[1]); return a == null || !b ? null : a / b; }
        case 'IF': return ev(A[0]) ? ev(A[1]) : (A[2] ? ev(A[2]) : null);
        case 'AND': return A.every(x => ev(x)) ? 1 : 0;
        case 'OR': return A.some(x => ev(x)) ? 1 : 0;
        case 'ABS': { const a = ev(A[0]); return a == null ? null : Math.abs(a); }
        case 'ROUND': { const a = ev(A[0]), d = A[1] ? ev(A[1]) : 0; return a == null ? null : Math.round(a * 10 ** d) / 10 ** d; }
        case 'IFNULL': { const a = ev(A[0]); return a == null ? ev(A[1]) : a; }
      }
    }
  }
  return null;
}

/* ---- pivot --------------------------------------------------------------- */

function exSortVals(vals, dim) {
  if (dim.order) return vals.sort((a, b) => (dim.order.indexOf(a) + 1 || 99) - (dim.order.indexOf(b) + 1 || 99));
  return vals.sort((a, b) => String(a).localeCompare(String(b)));
}

function exFilterRows(data, cfg, F) {
  const fl = Object.entries(cfg.filters || {}).filter(([k, v]) => F[k] && v && v.length);
  if (!fl.length) return data;
  const sets = fl.map(([k, v]) => [F[k], new Set(v)]);
  return data.filter(r => sets.every(([d, s]) => s.has(d.get(r))));
}

function exPivot(data, cfg, F) {
  const rows = exFilterRows(data, cfg, F);
  const rowDims = cfg.rows.map(id => F[id]).filter(Boolean);
  const colDims = cfg.cols.map(id => F[id]).filter(Boolean);
  const values = cfg.values.map(id => F[id]).filter(Boolean);
  const cache = new WeakMap();
  const SEP = '\u0001';
  const colKeyOf = r => colDims.map(d => d.get(r)).join(SEP);
  let colKeys = [];
  if (colDims.length) {
    const ks = new Map(); rows.forEach(r => { const k = colKeyOf(r); if (!ks.has(k)) ks.set(k, k.split(SEP)); });
    colKeys = [...ks.values()].sort((a, b) => {
      for (let i = 0; i < colDims.length; i++) { const d = colDims[i]; const o = exSortVals([a[i], b[i]], d); if (a[i] !== b[i]) return o[0] === a[i] ? -1 : 1; }
      return 0;
    }).map(p => p.join(SEP));
  }
  const prodSplit = [...rowDims, ...colDims].some(d => d.prod);
  const byColCache = new WeakMap();
  const byCol = rs => {
    let m = byColCache.get(rs); if (m) return m;
    m = new Map(); rs.forEach(r => { const k = colKeyOf(r); if (!m.has(k)) m.set(k, []); m.get(k).push(r); });
    byColCache.set(rs, m); return m;
  };
  const value = (rs, colKey, meas) => {
    if (meas.grain === 'fa' && prodSplit) return { na: true };
    const sub = colKey == null ? rs : (byCol(rs).get(colKey) || []);
    if (!sub.length) return { v: null };
    return { v: exCompute(meas, sub, F, cache) };
  };
  const sortVal = (rs) => {
    if (!cfg.sort) return 0;
    const [mid, ck] = cfg.sort.col.split('|'); const m = F[mid]; if (!m) return 0;
    const x = value(rs, ck ? ck : null, m).v; return typeof x === 'number' ? x : -Infinity;
  };
  const build = (rs, depth, path) => {
    if (depth >= rowDims.length) return [];
    const d = rowDims[depth], g = new Map();
    rs.forEach(r => { const k = d.get(r); if (!g.has(k)) g.set(k, []); g.get(k).push(r); });
    let keys = exSortVals([...g.keys()], d);
    if (cfg.sort) keys = keys.map(k => [k, sortVal(g.get(k))]).sort((a, b) => (b[1] - a[1]) * -cfg.sort.dir).map(x => x[0]);
    if (cfg.sort && cfg.sort.col === '__label') keys = exSortVals([...g.keys()], d); if (cfg.sort && cfg.sort.col === '__label' && cfg.sort.dir > 0) keys.reverse();
    return keys.map(k => {
      const id = path + SEP + k; let kids = null;
      return { id, key: k, dim: d, depth, rows: g.get(k), leaf: depth === rowDims.length - 1, kids: () => (kids || (kids = build(g.get(k), depth + 1, id))) };
    });
  };
  const top = build(rows, 0, '');
  return { rows, rowDims, colDims, values, colKeys, top, value, prodSplit, SEP, cache };
}

/* Runtime query confidence: aggregating up returns to directly-sourced
   levels, so the answer is usually more confident than the deepest records. */
function exQueryConfidence(p) {
  const fs = exUniqFa(p.rows); if (!fs.length) return null;
  const base = fs.reduce((a, f) => a + f.tier, 0) / fs.length;
  const all = [...p.rowDims, ...p.colDims];
  let adj = base - (all.some(d => d.id === 'fa' || d.id === 'crd') ? 0 : 0.6) - (all.some(d => d.prod) ? 0 : 0.7) - (all.some(d => d.id === 'month') ? 0 : 0.3);
  adj = Math.max(1, Math.min(5, adj));
  return { tier: adj, label: adj <= 2.2 ? 'High' : adj <= 3.3 ? 'Medium' : 'Low' };
}

/* ---- compiled SQL + semantic query -------------------------------------- */

function exSQL(cfg, F) {
  const dims = [...cfg.rows, ...cfg.cols].map(id => F[id]).filter(Boolean);
  const vals = cfg.values.map(id => F[id]).filter(Boolean);
  const col = d => (d.sql.startsWith('crm.') || d.sql.startsWith('sig.') ? d.sql : 'f.' + d.sql);
  const usesCrm = [...dims, ...vals].some(x => (x.level || 1) === 2 || (x.sql || '').startsWith('crm.'));
  const usesSig = [...dims, ...vals].some(x => x.level === 3);
  const mSql = m => {
    switch (m.agg) {
      case 'sum': return `SUM(${m.sql.replace(/(\b[a-z_]+\b)/g, 'f.$1')})`;
      case 'last': return `SUM(IFF(f.period_month = lm.max_month, ${m.sql.replace(/(\b[a-z_]+\b)/g, 'f.$1')}, 0))`;
      case 'ratio': return `DIV0(${mSql(F[m.num])}, ${mSql(F[m.den])})`;
      case 'wavg': return `DIV0(SUM(f.${m.sql} * f.gross_sales), SUM(f.gross_sales))`;
      case 'count': return 'COUNT(*)';
      case 'countd': return 'COUNT(DISTINCT f.fa_crd)';
      case 'faAvg': return m.id === 'coverRate' ? "AVG(IFF(crm.coverage_status = 'Covered', 1, 0))" : 'AVG(f.overall_confidence_tier)';
      case 'faMin': return 'MIN(crm.days_since_last_meeting)';
      case 'faMonth': return `SUM(crm.${m.k}_count)`;
      case 'sig': return m.k === 'count' ? 'COUNT(DISTINCT sig.signal_id)' : m.k === 'hi' ? 'COUNT(DISTINCT IFF(sig.confidence >= 75, sig.signal_id, NULL))' : m.k === 'opp' ? 'SUM(sig.expected_opportunity)' : 'AVG(sig.confidence)';
      case 'top3': return "ARRAY_SLICE(ARRAY_AGG(OBJECT_CONSTRUCT('type', sig.signal_type, 'confidence', sig.confidence)) WITHIN GROUP (ORDER BY sig.confidence DESC), 0, 3)";
      case 'calc': return `/* calculated: ${m.expr} */`;
    }
    return 'NULL';
  };
  const where = Object.entries(cfg.filters || {}).filter(([k, v]) => F[k] && v && v.length).map(([k, v]) => `${col(F[k])} IN (${v.map(x => `'${String(x).replace(/'/g, "''")}'`).join(', ')})`);
  const gs = [];
  for (let i = cfg.rows.length; i >= 0; i--) gs.push('(' + [...cfg.rows.slice(0, i), ...cfg.cols].map(id => F[id] && col(F[id])).filter(Boolean).join(', ') + ')');
  const lines = [
    'WITH lm AS (SELECT MAX(period_month) AS max_month FROM FIELD_EGRESS.UNIFIED_FEED f' + (where.length ? ' WHERE ' + where.join(' AND ') : '') + ')',
    'SELECT',
    ...dims.map(d => `  ${col(d)},`),
    ...vals.map((m, i) => `  ${mSql(m)} AS ${m.metric || m.id}${i < vals.length - 1 ? ',' : ''}`),
    'FROM FIELD_EGRESS.UNIFIED_FEED f',
    'CROSS JOIN lm',
    ...(usesCrm ? ['LEFT JOIN FIELD_EGRESS.FA_CRM_MONTHLY crm ON crm.fa_crd = f.fa_crd AND crm.period_month = f.period_month'] : []),
    ...(usesSig ? ['LEFT JOIN FIELD_EGRESS.FA_SIGNALS sig ON sig.fa_crd = f.fa_crd AND sig.status = \'open\''] : []),
    ...(where.length ? ['WHERE ' + where.join('\n  AND ')] : []),
    ...(dims.length ? ['GROUP BY GROUPING SETS (' + gs.join(', ') + ')'] : []),
  ];
  const sl = `dbt sl query --metrics ${vals.filter(m => m.metric).map(m => m.metric).join(',') || '…'}` +
    (dims.length ? ` --group-by ${dims.map(d => (d.prod ? 'product__' : d.group === 'Time' ? 'metric_time__' : 'fa__') + d.sql.replace(/^(crm|sig)\./, '')).join(',')}` : '') +
    (where.length ? ` --where "${Object.entries(cfg.filters).filter(([, v]) => v && v.length).map(([k]) => `{{ Dimension('fa__${F[k] ? F[k].sql.replace(/^(crm|sig)\./, '') : k}') }} IN (…)`).join(' AND ')}"` : '');
  return { sql: lines.join('\n'), sl };
}

/* ---- export -------------------------------------------------------------- */

function exPivotAOA(p, F) {
  const head = [...p.rowDims.map(d => d.label)];
  const cols = [];
  if (p.colKeys.length) {
    p.colKeys.forEach(ck => p.values.forEach(m => { cols.push([ck, m]); head.push(`${ck.split(p.SEP).join(' · ')} · ${m.label}`); }));
    p.values.forEach(m => { cols.push([null, m]); head.push(`Total · ${m.label}`); });
  } else p.values.forEach(m => { cols.push([null, m]); head.push(m.label); });
  const out = [head];
  const cellOut = (rs, ck, m) => {
    const x = p.value(rs, ck, m);
    if (x.na) return 'n/a';
    if (Array.isArray(x.v)) return x.v.map(s => `${s.type} (${s.confidence})`).join('; ');
    return x.v == null ? '' : (m.fmt === '%' ? +x.v.toFixed(4) : +(+x.v).toFixed(2));
  };
  const walk = nodes => nodes.forEach(n => {
    const line = p.rowDims.map((_, i) => (i === n.depth ? n.key : i < n.depth ? '' : ''));
    if (!n.leaf) line[n.depth] = n.key + ' (subtotal)';
    out.push([...line, ...cols.map(([ck, m]) => cellOut(n.rows, ck, m))]);
    if (!n.leaf) walk(n.kids());
  });
  walk(p.top);
  out.push(['Grand total', ...p.rowDims.slice(1).map(() => ''), ...cols.map(([ck, m]) => cellOut(p.rows, ck, m))]);
  return out;
}

function exFlatAOA(rows) {
  const dimCols = EX_DIMS.filter(d => !d.level);
  const head = ['period_month', ...dimCols.filter(d => d.id !== 'month').map(d => d.sql), 'aum', 'aum_tenant', 'gross_sales', 'gross_sales_tenant', 'redemptions', 'redemptions_tenant', 'net_flow', 'net_flow_tenant', 'comp_rating_matchup', 'comp_fee_matchup', 'comp_performance_matchup_3yr'];
  const out = [head];
  rows.forEach(r => out.push([EX_MONTH_ISO[r.m], ...dimCols.filter(d => d.id !== 'month').map(d => d.get(r)), Math.round(r.aum), Math.round(r.aumT), Math.round(r.gs), Math.round(r.gsT), Math.round(r.rd), Math.round(r.rdT), Math.round(r.gs - r.rd), Math.round(r.gsT - r.rdT), r.rm, r.fm, r.pm]));
  return out;
}

function exDownload(name, sheets) {
  if (window.XLSX) {
    const wb = XLSX.utils.book_new();
    sheets.forEach(([n, aoa]) => XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), n.slice(0, 31)));
    XLSX.writeFile(wb, name + '.xlsx');
    return;
  }
  const csv = sheets[0][1].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = name + '.csv'; a.click();
}

Object.assign(window, { EX_FIELDS, EX_FUNCS, exFieldMap, exFmt, exMoney, exCompute, exParse, exValidate, exResolve, exPivot, exFilterRows, exQueryConfidence, exSQL, exPivotAOA, exFlatAOA, exDownload, exSortVals, exUniqFa });
