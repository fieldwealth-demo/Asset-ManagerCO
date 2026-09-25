/* Build tool, not loaded by the portal. Turns a preview email template
   (class-based flex/grid layout) into its "<name> - Outlook.html" twin:
   nested role="presentation" tables at 640px, inline styles only, solid
   colours, Segoe UI stack and a VML + link button. Re-run it after editing a
   preview template so the Outlook file stays in sync:
     outlookConvert(previewHtml, { preview: 'Morning Brief v2.html', hash: '#signals', extra: '' }) */
(function (G) {
  const FONT = "'Segoe UI',Helvetica,Arial,sans-serif";
  const TB = 'role="presentation" cellpadding="0" cellspacing="0" border="0"';
  const TS = 'border-collapse:separate;border-spacing:0;';
  const BLOCK = { DIV: 1, P: 1, H1: 1, H2: 1, H3: 1, SECTION: 1 };
  const KEEP = ['id', 'data-sec', 'data-role', 'data-scope'];
  const INH = ['color', 'font-size', 'font-weight', 'line-height', 'text-transform', 'letter-spacing', 'text-align', 'font-style', 'white-space'];
  const esc = t => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const parseStyle = s => { const o = {}; (s || '').split(';').forEach(d => { const i = d.indexOf(':'); if (i > 0) o[d.slice(0, i).trim().toLowerCase()] = d.slice(i + 1).trim(); }); return o; };
  const css = o => Object.entries(o).filter(([, v]) => v != null && v !== '').map(([k, v]) => `${k}:${v}`).join(';');
  const hx = n => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0').toUpperCase();
  function rgb(c) {
    c = (c || '').trim().toLowerCase(); let m;
    if (c === 'white' || c === '#fff') return [255, 255, 255, 1];
    if ((m = c.match(/^#([0-9a-f]{3})$/))) return [...m[1]].map(x => parseInt(x + x, 16)).concat(1);
    if ((m = c.match(/^#([0-9a-f]{6})$/))) return [0, 2, 4].map(i => parseInt(m[1].substr(i, 2), 16)).concat(1);
    if ((m = c.match(/^rgba?\(([^)]+)\)$/))) { const p = m[1].split(',').map(parseFloat); return [p[0], p[1], p[2], p[3] == null ? 1 : p[3]]; }
    return null;
  }
  const solid = (c, bg) => { const a = rgb(c); if (!a) return c; const b = rgb(bg) || [17, 25, 40, 1]; return '#' + [0, 1, 2].map(i => hx(a[i] * a[3] + b[i] * (1 - a[3]))).join(''); };
  const fixC = (v, bg) => (v || '').replace(/rgba?\([^)]+\)|#[0-9a-f]{6}\b|#[0-9a-f]{3}\b/gi, c => solid(c, bg));
  const px = v => (v == null ? 0 : parseFloat(v) || 0);
  function box4(v) { const p = (v || '0').split(/\s+/).map(px); return [p[0], p[1] ?? p[0], p[2] ?? p[0], p[3] ?? p[1] ?? p[0]]; }
  const spacer = h => h > 0 ? `<div style="height:${h}px;line-height:${h}px;font-size:1px;mso-line-height-rule:exactly">&nbsp;</div>` : '';

  function make(doc) {
    const rules = []; let n = 0;
    doc.querySelectorAll('style').forEach(st => {
      st.textContent.replace(/\/\*[\s\S]*?\*\//g, '').replace(/@font-face\s*\{[^}]*\}/g, '').replace(/([^{}]+)\{([^}]*)\}/g, (m, sel, body) => {
        sel.split(',').forEach(s => {
          s = s.trim(); if (!s || /:hover|embed|:root|^body$|^a$/.test(s)) return;
          rules.push({ sel: s, st: parseStyle(body), spec: (s.match(/[.#:\[]/g) || []).length * 10 + (s.match(/(^|[\s>+~])[a-z]/gi) || []).length, n: n++ });
        });
      });
    });
    rules.sort((a, b) => a.spec - b.spec || a.n - b.n);
    const cache = new Map();
    const UA = { H1: { 'font-weight': '700' }, H2: { 'font-weight': '700' }, B: { 'font-weight': '700' }, STRONG: { 'font-weight': '700' }, A: { color: '#31C48D', 'text-decoration': 'none' } };
    const S = el => {
      if (cache.has(el)) return cache.get(el);
      const o = { ...(UA[el.tagName] || {}) };
      rules.forEach(r => { try { if (el.matches(r.sel)) Object.assign(o, r.st); } catch (e) {} });
      Object.assign(o, parseStyle(el.getAttribute('style')));
      cache.set(el, o); return o;
    };
    return S;
  }

  /* Runs in the Outlook file before the download snapshots it (scripts are then
     stripped): applies the same URL settings as the preview, removing rather
     than hiding whatever is switched off. */
  function RT(week) {
    var p = new URLSearchParams(location.search), q = function (i) { return document.getElementById(i); }, rm = function (e) { if (e && e.parentNode) e.parentNode.removeChild(e); };
    var u = document.body.getAttribute('data-portal-url');
    if (u) {
      document.querySelectorAll('[data-portal-link]').forEach(function (a) { a.setAttribute('href', u); a.removeAttribute('data-portal-link'); });
      var w = document.createTreeWalker(document.body, NodeFilter.SHOW_COMMENT), c;
      while ((c = w.nextNode())) c.nodeValue = c.nodeValue.split('href="https://fieldwealth.ai" data-portal-link="1"').join('href="' + u + '"');
    }
    (p.get('hide') || '').split(',').filter(Boolean).forEach(function (k) { document.querySelectorAll('[data-sec="' + k + '"]').forEach(rm); });
    var role = p.get('role') || 'ext', scope = p.get('scope') || 'region';
    document.querySelectorAll('[data-role]').forEach(function (e) { if (e.getAttribute('data-role').split(' ').indexOf(role) < 0) rm(e); });
    document.querySelectorAll('[data-scope]').forEach(function (e) { if (e.getAttribute('data-scope').split(' ').indexOf(scope) < 0) rm(e); });
    try {
      var map = JSON.parse(p.get('sub') || '{}'), ks = Object.keys(map).sort(function (a, b) { return b.length - a.length; });
      if (ks.length) {
        var rx = new RegExp('\\b(' + ks.map(function (k) { return k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }).join('|') + ')\\b', 'g'), t = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT), n;
        while ((n = t.nextNode())) n.nodeValue = n.nodeValue.replace(rx, function (m) { return map[m]; });
      }
    } catch (e) {}
    var h1 = p.get('h1'); if (h1) document.querySelectorAll('h1').forEach(function (e) { e.textContent = h1; });
    if (week && p.get('v') === 'week') { for (var id in week.text) if (q(id)) q(id).textContent = week.text[id]; for (id in week.html) if (q(id)) q(id).innerHTML = week.html[id]; document.title = week.title; }
    var st = p.get('scopeText'), sl = st ? 'Scope: ' + st : { segA: 'Scope: Segment A FA/Teams', filters: 'Scope: current dashboard filters' }[p.get('scope')], e = q('hdr-scope');
    if (e) { if (sl) e.textContent = sl; else rm(e); }
  }

  function outlookConvert(src, opts = {}) {
    const doc = new DOMParser().parseFromString(src, 'text/html');
    const S = make(doc);
    const kids = el => [...el.childNodes].filter(c => c.nodeType === 1 ? !(S(c).display === 'none' && !c.id) : c.nodeType === 3 && c.nodeValue.trim());
    const ek = el => kids(el).filter(c => c.nodeType === 1);
    const raw = el => [...el.childNodes].filter(c => c.nodeType === 1 ? !(S(c).display === 'none' && !c.id) : c.nodeType === 3);
    const attrs = el => KEEP.filter(a => el.hasAttribute(a)).map(a => ` ${a}="${esc(el.getAttribute(a))}"`).join('');
    const inh = (ctx, s) => { const o = { ...ctx.inh }; INH.forEach(k => { if (s[k] != null) o[k] = s[k]; }); if (s['font-variant-numeric']) o['font-variant-numeric'] = s['font-variant-numeric']; return o; };
    const text = (i, bg) => {
      const fs = px(i['font-size']) || 16, lh = i['line-height'] || '1.5';
      const lpx = /px$/.test(lh) ? px(lh) : Math.round(fs * (parseFloat(lh) || 1.5));
      return { 'font-family': FONT, 'font-size': fs + 'px', 'line-height': lpx + 'px', color: fixC(i.color || '#FFFFFF', bg), 'font-weight': i['font-weight'] && i['font-weight'] !== '400' ? i['font-weight'] : null,
        'text-transform': i['text-transform'], 'letter-spacing': i['letter-spacing'], 'font-style': i['font-style'], 'white-space': i['white-space'] === 'nowrap' ? 'nowrap' : null, 'mso-line-height-rule': 'exactly' };
    };
    const isBox = s => !!(s.background || s['background-color'] || s.border || s['border-top'] || s['border-bottom'] || s.padding || s['padding-top'] || s['padding-bottom'] || s['padding-left']);
    const kindOf = (el, s) => {
      if (el.tagName === 'A' && el.classList.contains('btn')) return 'btn';
      if (el.children.length === 1 && el.children[0].tagName === 'I' && /%/.test(S(el.children[0]).width || '')) return 'bar';
      const d = s.display;
      if (d === 'grid') return s['grid-template-columns'] ? 'grid' : 'block';
      if (d === 'flex' || d === 'inline-flex') {
        if (s['justify-content'] === 'center' && s.width && s.height) return 'center';
        return /column/.test(s['flex-direction'] || '') ? 'col' : 'row';
      }
      if (s.width && s.height && !el.textContent.trim()) return 'dot';
      if (BLOCK[el.tagName] || d === 'block') return 'block';
      return 'inline';
    };
    const boxStyle = (s, bg) => {
      const nb = s.background || s['background-color'] ? solid(s.background || s['background-color'], bg) : null;
      const r = px(s['border-radius']);
      return {
        style: { padding: s.padding, 'padding-top': s['padding-top'], 'padding-bottom': s['padding-bottom'], 'padding-left': s['padding-left'], 'padding-right': s['padding-right'], background: nb,
          border: fixC(s.border, nb || bg), 'border-top': fixC(s['border-top'], nb || bg), 'border-bottom': fixC(s['border-bottom'], nb || bg), 'border-radius': r ? Math.min(r, 12) + 'px' : null },
        bg: nb || bg,
        pad: (() => { const p = box4(s.padding); if (s['padding-top']) p[0] = px(s['padding-top']); if (s['padding-bottom']) p[2] = px(s['padding-bottom']); if (s['padding-left']) p[3] = px(s['padding-left']); if (s['padding-right']) p[1] = px(s['padding-right']); return p; })(),
        bw: /\d+px/.test(s.border || '') ? 2 * px(s.border) : 0,
      };
    };

    function inline(node, ctx) {
      if (node.nodeType === 3) return esc(node.nodeValue.replace(/\s+/g, ' '));
      const s = S(node), k = kindOf(node, s);
      if (k !== 'inline') return conv(node, ctx);
      const st = { color: s.color ? fixC(s.color, ctx.bg) : null, 'font-weight': s['font-weight'], 'font-size': s['font-size'], 'text-decoration': s['text-decoration'], 'letter-spacing': s['letter-spacing'], 'text-transform': s['text-transform'] };
      if (s.background || s.border) Object.assign(st, { background: s.background ? solid(s.background, ctx.bg) : null, border: fixC(s.border, ctx.bg), padding: s.padding, 'border-radius': s['border-radius'] ? Math.min(px(s['border-radius']), 12) + 'px' : null, 'white-space': 'nowrap' });
      const tag = node.tagName.toLowerCase() === 'i' ? 'span' : node.tagName.toLowerCase();
      const href = tag === 'a' ? ` href="${esc(node.getAttribute('href') || '#')}" target="_blank"` : '';
      const inner = raw(node).map(c => inline(c, { ...ctx, inh: inh(ctx, s) })).join('');
      return `<${tag}${href}${attrs(node)} style="font-family:${FONT};${css(st)}">${inner}</${tag}>`;
    }
    // Content of an element with its own box already applied by the caller.
    function inner(el, s, ctx) {
      const k = kindOf(el, s), c = ek(el), all = kids(el);
      const ictx = { ...ctx, inh: inh(ctx, s) };
      if (k === 'grid') {
        const gap = px(s.gap || s['column-gap']), rgap = px(s['row-gap'] || s.gap);
        let tpl = s['grid-template-columns'].trim(), parts, m = tpl.match(/^repeat\(\s*(auto-fit|auto-fill|\d+)\s*,\s*(.+)\)$/);
        if (m) { if (/auto/.test(m[1])) { const mm = m[2].match(/minmax\(\s*(\d+)px/), min = mm ? +mm[1] : 200; parts = Array(Math.max(1, Math.min(c.length, Math.floor((ctx.w + gap) / (min + gap))))).fill('1fr'); } else parts = Array(+m[1]).fill(m[2].trim()); }
        else parts = tpl.match(/minmax\([^)]*\)|\S+/g);
        const fr = parts.map(p => { const q = p.match(/([\d.]+)fr/); return q ? +q[1] : 0; }), fx = parts.map(p => (/fr/.test(p) ? 0 : px(p)));
        const rest = ctx.w - gap * (parts.length - 1) - fx.reduce((a, b) => a + b, 0), tf = fr.reduce((a, b) => a + b, 0) || 1;
        const ws = parts.map((p, i) => (fr[i] ? Math.floor(rest * fr[i] / tf) : fx[i]));
        const va = { center: 'middle', end: 'bottom' }[s['align-items']] || 'top';
        const rows = []; for (let i = 0; i < c.length; i += parts.length) rows.push(c.slice(i, i + parts.length));
        return `<table ${TB} width="100%" style="${TS}">` + rows.map((r, ri) => (ri && rgap ? `<tr><td colspan="${parts.length * 2 - 1}" style="font-size:1px;line-height:${rgap}px;height:${rgap}px">&nbsp;</td></tr>` : '') + '<tr>' + r.map((ch, i) => (i && gap ? `<td width="${gap}" style="font-size:1px">&nbsp;</td>` : '') + cell(ch, ws[i], va, null, ictx)).join('') + '</tr>').join('') + '</table>';
      }
      if (k === 'row') {
        const gap = px(s.gap), sb = s['justify-content'] === 'space-between';
        const va = { center: 'middle', baseline: 'middle', 'flex-end': 'bottom' }[s['align-items'] || ''] || (s['align-items'] ? 'top' : 'top');
        const fixed = c.map(ch => { const cs = S(ch); return cs.width && /px/.test(cs.width) ? px(cs.width) + box4(cs.padding)[1] * 2 : 0; });
        let g = c.findIndex(ch => /^1|^1 /.test(S(ch).flex || ''));
        if (g < 0) g = sb ? 0 : c.reduce((b, ch, i) => (!fixed[i] && ch.textContent.length > (c[b] ? c[b].textContent.length : -1) ? i : b), 0);
        const est = c.map((ch, i) => fixed[i] || (i === g ? 0 : Math.min(200, ch.textContent.trim().length * 7 + 24)));
        const gw = ctx.w - est.reduce((a, b) => a + b, 0) - gap * (c.length - 1);
        const wrap = s['flex-wrap'] === 'wrap';
        return `<table ${TB}${wrap || (el.tagName === 'SPAN' && !sb) ? '' : ' width="100%"'} style="${TS}"><tr>` + c.map((ch, i) => (i && gap ? `<td width="${gap}" style="font-size:1px">&nbsp;</td>` : '') + cell(ch, i === g ? gw : est[i], va, i === g ? 'grow' : (sb && i > g ? 'right' : 'fit'), ictx)).join('') + '</tr></table>';
      }
      if (k === 'col') {
        const gap = px(s.gap);
        return all.map((ch, i) => { const mt = ch.nodeType === 1 ? px(S(ch)['margin-top'] || box4(S(ch).margin)[0]) : 0; const sp = i ? spacer(Math.max(0, gap + mt)) : ''; const at = ch.nodeType === 1 ? attrs(ch) : ''; return at && sp ? `<div${at}>${sp}${conv(ch, ictx, true)}</div>` : sp + conv(ch, ictx); }).join('');
      }
      // block: runs of inline content become text divs; blocks stack.
      if (all.every(ch => ch.nodeType === 3 || kindOf(ch, S(ch)) === 'inline')) return raw(el).map(ch => inline(ch, ictx)).join('').trim();
      let out = '', run = [];
      const flush = () => { if (run.some(x => x.nodeType === 1 || x.nodeValue.trim())) { out += `<div style="${css(text(ictx.inh, ctx.bg))}">${run.map(x => inline(x, ictx)).join('').trim()}</div>`; } run = []; };
      raw(el).forEach(ch => {
        if (ch.nodeType === 3 || kindOf(ch, S(ch)) === 'inline') { run.push(ch); return; }
        flush(); const cs = S(ch), mt = cs['margin-top'] ? px(cs['margin-top']) : box4(cs.margin)[0];
        out += spacer(mt) + conv(ch, ictx);
      });
      flush(); return out;
    }
    function cell(ch, w, va, mode, ctx) {
      const s = S(ch), k = kindOf(ch, s), tp = ch.nodeType === 1 ? (s['margin-top'] ? px(s['margin-top']) : 0) : 0;
      const al = s['text-align'] === 'right' || mode === 'right' ? ' align="right"' : '';
      const nw = mode === 'right' || (mode === 'fit' && ch.textContent.trim().length < 40) ? 'white-space:nowrap;' : '';
      const wa = mode === 'grow' ? '' : w ? ` width="${w}"` : '';
      if (ch.nodeType === 1 && isBox(s) && k !== 'inline' && k !== 'center' && k !== 'dot' && k !== 'bar') {
        const b = boxStyle(s, ctx.bg), iw = w - b.pad[1] - b.pad[3] - b.bw;
        return `<td${wa}${al} valign="${va}"${attrs(ch)} style="${nw}${css(text(inh(ctx, s), b.bg))};${css(b.style)}">${inner(ch, s, { ...ctx, w: iw, bg: b.bg })}</td>`;
      }
      const cs = ch.nodeType === 1 ? s : {};
      return `<td${wa}${al} valign="${va}" style="${nw}${tp ? `padding-top:${tp}px;` : ''}${css(text(inh(ctx, cs), ctx.bg))}">${ch.nodeType === 3 || k === 'inline' ? inline(ch, ctx) : conv(ch, { ...ctx, w })}</td>`;
    }
    function conv(el, ctx, bare) {
      if (el.nodeType === 3) return `<div style="${css(text(ctx.inh, ctx.bg))}">${esc(el.nodeValue.trim())}</div>`;
      const s = S(el), k = kindOf(el, s), at = bare ? '' : attrs(el);
      const i2 = inh(ctx, s);
      if (k === 'btn') {
        const label = esc(el.textContent.trim()), r = 8;
        return `<!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="https://fieldwealth.ai" data-portal-link="1" style="height:46px;v-text-anchor:middle;width:${ctx.w}px" arcsize="17%" stroke="f" fillcolor="#0E9F6E"><w:anchorlock/><center style="color:#ffffff;font-family:'Segoe UI',Arial,sans-serif;font-size:15px;font-weight:600">${label}</center></v:roundrect><![endif]--><!--[if !mso]><!--><a href="https://fieldwealth.ai" data-portal-link="1" target="_blank" style="font-family:${FONT};display:block;text-align:center;background:#0E9F6E;color:#ffffff;font-weight:600;font-size:15px;line-height:22px;border-radius:${r}px;padding:12px;text-decoration:none">${label}</a><!--<![endif]-->`;
      }
      if (k === 'bar') {
        const is = S(el.children[0]), pct = Math.max(1, Math.round(px(is.width))), h = px(s.height) || 8;
        const track = solid(s.background || '#374151', ctx.bg), fill = solid(is.background || '#0E9F6E', track);
        return `<table ${TB} width="100%"${at} style="${TS}background:${track};border-radius:${h / 2}px"><tr><td style="padding:0;font-size:1px;line-height:${h}px;height:${h}px"><table ${TB} width="${pct}%" style="${TS}background:${fill};border-radius:${h / 2}px"><tr><td height="${h}" style="font-size:1px;line-height:${h}px;height:${h}px">&nbsp;</td></tr></table></td></tr></table>`;
      }
      if (k === 'dot') {
        const w = px(s.width), h = px(s.height);
        return `<div${at} style="width:${w}px;height:${h}px;background:${solid(s.background || '#374151', ctx.bg)};border-radius:${Math.min(px(s['border-radius']), h / 2)}px;font-size:1px;line-height:${h}px">&nbsp;</div>`;
      }
      if (k === 'center') {
        const w = px(s.width), h = px(s.height), bg = solid(s.background || ctx.bg, ctx.bg);
        return `<table ${TB}${at} style="${TS}"><tr><td width="${w}" height="${h}" align="center" valign="middle" style="${css(text(i2, bg))};width:${w}px;height:${h}px;background:${bg};border-radius:${Math.min(px(s['border-radius']), h / 2)}px;line-height:${h}px">${kids(el).map(c => inline(c, { ...ctx, inh: i2, bg })).join('')}</td></tr></table>`;
      }
      if (k === 'inline') return `<div${at} style="${css(text(ctx.inh, ctx.bg))}">${inline(el, ctx)}</div>`;
      if (isBox(s)) {
        const b = boxStyle(s, ctx.bg), c = ek(el), iw = ctx.w - b.pad[1] - b.pad[3] - b.bw;
        const rowList = k === 'block' && c.length > 1 && c.length === kids(el).length && c.every(ch => { const cs = S(ch); return (cs.padding || cs['padding-top']) && kindOf(ch, cs) !== 'inline'; });
        const outer = { ...b.style }; if (rowList) { delete outer.padding; }
        if (rowList) {
          const rows = c.map((ch, i) => {
            const cs = S(ch), cb = boxStyle(cs, b.bg), last = i === c.length - 1;
            const st = { ...cb.style }; if (last) delete st['border-bottom'];
            return `<tr${attrs(ch)}><td style="${css(text(inh({ inh: i2 }, cs), cb.bg))};${css(st)}">${inner(ch, cs, { ...ctx, inh: i2, w: iw - cb.pad[1] - cb.pad[3], bg: cb.bg })}</td></tr>`;
          }).join('');
          return `<table ${TB} width="100%"${at} style="${TS}${css(outer)}">${rows}</table>`;
        }
        return `<table ${TB} width="100%"${at} style="${TS}"><tr><td style="${css(text(i2, b.bg))};${css(outer)}">${inner(el, s, { ...ctx, w: iw, bg: b.bg })}</td></tr></table>`;
      }
      const tag = /^H[1-3]$|^P$/.test(el.tagName) ? el.tagName.toLowerCase() : 'div';
      const body = inner(el, s, ctx);
      const onlyInline = kids(el).every(ch => ch.nodeType === 3 || kindOf(ch, S(ch)) === 'inline');
      return `<${tag}${at} style="margin:0;${onlyInline ? css(text(i2, ctx.bg)) : ''}">${body}</${tag}>`;
    }

    const root = doc.querySelector('.em');
    const rs = S(root), rootInh = inh({ inh: { color: '#FFFFFF', 'font-size': '16px', 'line-height': '1.5' } }, rs);
    const top = kids(root);
    const rows = top.map((ch, i) => `<tr${ch.nodeType === 1 ? attrs(ch) : ''}><td style="padding:0${i < top.length - 1 ? ' 0 32px' : ''}">${conv(ch, { w: 576, bg: '#111928', inh: rootInh }, true)}</td></tr>`).join('\n');
    const title = esc((doc.querySelector('title') || {}).textContent || 'Field');
    const runtime = `(${RT.toString()})(${JSON.stringify(opts.week || null)});`;
    return `<!DOCTYPE html>
<!-- Outlook build of emails/${opts.preview}. Keep text and figures in sync with that preview template (regenerate with emails/outlook-convert.js after editing it). -->
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="x-apple-disable-message-reformatting">
<title>${title}</title>
<!--[if mso]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml><style>table,td,div,span,a,p,h1,h2{font-family:'Segoe UI',Arial,sans-serif!important}</style><![endif]-->
<style>body{margin:0;padding:0;background:#0B1220}a{color:#31C48D;text-decoration:none}a:hover{color:#0E9F6E}</style>
</head>
<body data-portal-url="https://fieldwealth.ai" style="margin:0;padding:0;background:#0B1220">
<!-- PORTAL LINK: edit data-portal-url above. Placeholder until the portal is hosted; then use the hosted address + ${opts.hash || ''}. -->
<table ${TB} width="100%" style="${TS}background:#0B1220"><tr><td align="center" style="padding:24px 0"><table ${TB} width="640" style="${TS}background:#111928;width:640px"><tr><td style="padding:40px 32px"><table ${TB} width="100%" style="${TS}">
${rows}
</table></td></tr></table></td></tr></table>
<script>${runtime}</script>
</body></html>
`;
  }
  G.outlookConvert = outlookConvert;
})(typeof window !== 'undefined' ? window : this);
