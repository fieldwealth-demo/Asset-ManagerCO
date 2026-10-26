/* Brief exports, all rendered from the brief itself:
   - briefPdf / briefPptx open a preview window over the portal (pages or
     slides as images) with a Download button that saves the real file.
   - ampCompose opens a new-message window with the brief embedded as an image
     (used by emailOutlookDraft in emailExport.jsx). */
(function (G) {
  const libs = {};
  const load = (src) => libs[src] || (libs[src] = new Promise((ok, no) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = no; document.head.appendChild(s); }));
  const H2C = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
  const PPTX = 'https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js';
  const JSPDF = 'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js';
  const vis = (e) => e && e.offsetParent !== null && getComputedStyle(e).display !== 'none';
  const safe = (t) => t.replace(/[\\/:*?"<>|]+/g, '-').trim();
  const save = (name, blob) => (G.ampSave ? G.ampSave(name, blob) : Promise.reject(new Error('Saving is not ready yet')));
  const CONF = 'Confidential · For internal use only. Not for distribution to clients or the public.';
  const FONT = '"Segoe UI", Helvetica, Arial, sans-serif';
  const h2c = async (d) => {
    if (!d.defaultView.html2canvas) await new Promise((ok, no) => { const s = d.createElement('script'); s.src = H2C; s.onload = ok; s.onerror = no; d.head.appendChild(s); });
    if (d.fonts && d.fonts.ready) await d.fonts.ready;
  };
  const imgEl = (src) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src; });

  // Header (h1, lede, KPI cards) first; then every visible .sec and Part divider.
  function blocks(d) {
    const em = d.querySelector('.em'), out = [];
    let head = [];
    [...em.children].forEach((c) => {
      if (!vis(c) || c.classList.contains('btn') || (c.classList.contains('row') && (c === em.firstElementChild || c === em.lastElementChild))) return;
      if (c.classList.contains('sec')) { out.push({ els: [c], title: [...c.querySelectorAll(':scope>h2')].find(vis)?.textContent.trim() || '' }); return; }
      if (c.classList.contains('kpis') && !out.some(b => b.els)) { head.push(c); return; }
      if (c.classList.contains('part')) { out.push({ part: c.textContent.trim() }); return; }
      if (!out.length) head.push(c); else if (!/How this was built/.test(c.textContent)) out.push({ els: [c], title: '' });
    });
    return { head, list: out };
  }

  async function snap(els, d, keepTitles) {
    const wrap = d.createElement('div');
    const em = d.querySelector('.em');
    wrap.style.cssText = `position:absolute;left:-10000px;top:0;width:${em.clientWidth - 64}px;padding:24px;background:#111928;display:flex;flex-direction:column;gap:24px;color:#fff;line-height:1.5`;
    // html2canvas mis-measures word spacing with the local Inter TTFs, so the
    // capture uses the Outlook build's font stack.
    const fs = d.createElement('style');
    fs.textContent = '.brf-snap,.brf-snap *{font-family:"Segoe UI",Helvetica,Arial,sans-serif!important}';
    wrap.className = 'brf-snap'; wrap.appendChild(fs);
    els.forEach((e) => wrap.appendChild(e.cloneNode(true)));
    if (!keepTitles) wrap.querySelectorAll('.sec>h2').forEach((h) => (h.style.display = 'none'));
    wrap.querySelectorAll('.sec>h2+h2').forEach((h) => (h.style.display = 'none'));
    em.appendChild(wrap);
    try { return await d.defaultView.html2canvas(wrap, { backgroundColor: '#111928', scale: 2, logging: false }); }
    finally { wrap.remove(); }
  }

  // ---- canvas drawing helpers ----
  function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.fillStyle = '#111928'; x.fillRect(0, 0, w, h); return [c, x]; }
  function text(x, t, px, py, { size = 16, weight = 400, color = '#F9FAFB', maxW = 0, lh = 1.3, align = 'left', spacing = 0 } = {}) {
    x.font = `${weight} ${size}px ${FONT}`; x.fillStyle = color; x.textAlign = align; x.textBaseline = 'top';
    if ('letterSpacing' in x) x.letterSpacing = spacing + 'px';
    if (!maxW) { x.fillText(t, px, py); return py + size * lh; }
    const words = String(t).split(' '); let line = '', y = py;
    words.forEach((w) => { const test = line ? line + ' ' + w : w; if (x.measureText(test).width > maxW && line) { x.fillText(line, px, y); line = w; y += size * lh; } else line = test; });
    if (line) { x.fillText(line, px, y); y += size * lh; }
    if ('letterSpacing' in x) x.letterSpacing = '0px';
    return y;
  }
  function fitDraw(x, img, bx, by, bw, bh, top) {
    const r = Math.min(bw / img.width, bh / img.height), w = img.width * r, h = img.height * r;
    x.drawImage(img, bx + (bw - w) / 2, top ? by : by + (bh - h) / 2, w, h);
    return h;
  }
  function coverOn(x, W, H, s, c, mark) {
    const M = 0.45 * s;
    if (mark) x.drawImage(mark, M, 0.6 * s, 0.3 * s, 0.3 * s);
    text(x, 'Field', M + (mark ? 0.42 * s : 0), 0.62 * s, { size: 0.17 * s, weight: 700 });
    const midY = H * 0.47;
    x.fillStyle = '#31C48D'; x.fillRect(M, midY, W - 2 * M, Math.max(2, 0.025 * s));
    text(x, c.type.toUpperCase(), M, midY + 0.22 * s, { size: 0.15 * s, weight: 700, color: '#31C48D', spacing: 3 });
    let y = text(x, c.forWho, M, midY + 0.55 * s, { size: 0.42 * s, weight: 700, maxW: W - 2 * M, lh: 1.15 });
    text(x, c.period, M, y + 0.1 * s, { size: 0.21 * s, color: '#D1D5DB' });
    const my = H - 1.55 * s; x.fillStyle = '#374151'; x.fillRect(M, my, W - 2 * M, Math.max(1, 0.01 * s));
    const cw = (W - 2 * M) / 3;
    [['PREPARED FOR', c.forWho, c.forRole], ['POWERED BY', 'Field', 'fieldwealth.ai'], ['DATE', c.date, 'Reporting period: ' + c.period]].forEach(([k, v, sub], i) => {
      const px = M + i * cw;
      text(x, k, px, my + 0.18 * s, { size: 0.1 * s, weight: 700, color: '#9CA3AF', spacing: 1.5 });
      text(x, v || '', px, my + 0.38 * s, { size: 0.15 * s, weight: 700, maxW: cw - 0.15 * s });
      if (sub) text(x, sub, px, my + 0.62 * s, { size: 0.12 * s, color: '#9CA3AF', maxW: cw - 0.15 * s });
    });
    text(x, CONF, M, H - 0.6 * s, { size: 0.105 * s, color: '#9CA3AF', maxW: W - 2 * M });
  }

  // ---- PDF: letter pages at 150 px/in ----
  async function pdfPages(frame, cover) {
    const d = frame.contentDocument;
    await h2c(d);
    const S = 150, W = 8.5 * S, H = 11 * S, M = 0.45 * S, FOOT = 0.45 * S, CW = W - 2 * M;
    const pages = [];
    if (cover) { const [c, x] = canvas(W, H); coverOn(x, W, H, S, cover, await imgEl('assets/field-mark.png')); pages.push(c); }
    let cur = null, ctx = null, y = 0;
    const newPage = () => { [cur, ctx] = canvas(W, H); pages.push(cur); y = M; };
    const place = (img) => {
      let w = CW, h = (img.height / img.width) * CW;
      const maxH = H - M - FOOT - M;
      if (h > maxH) { h = maxH; w = (img.width / img.height) * h; }
      if (!cur || (y + h > H - FOOT - 0.1 * S && y > M)) newPage();
      ctx.drawImage(img, M + (CW - w) / 2, y, w, h); y += h + 0.12 * S;
    };
    const { head, list } = blocks(d);
    if (head.length) place(await snap(head, d, true));
    for (const b of list) {
      if (b.part) { if (!cur || y + 0.6 * S > H - FOOT) newPage(); text(ctx, b.part, M, y + 0.1 * S, { size: 0.24 * S, weight: 700, color: '#31C48D' }); y += 0.6 * S; continue; }
      place(await snap(b.els, d, true));
    }
    pages.forEach((p, i) => {
      if (cover && i === 0) return;
      const x = p.getContext('2d');
      x.fillStyle = '#374151'; x.fillRect(M, H - FOOT + 0.05 * S, CW, 1);
      text(x, 'Field · fieldwealth.ai', M, H - FOOT + 0.15 * S, { size: 0.11 * S, color: '#9CA3AF' });
      text(x, String(i + 1), W - M, H - FOOT + 0.15 * S, { size: 0.11 * S, color: '#9CA3AF', align: 'right' });
    });
    return pages;
  }
  async function pdfBlob(pages) {
    await load(JSPDF);
    const pdf = new G.jspdf.jsPDF({ unit: 'in', format: 'letter', orientation: 'portrait', compress: true });
    pages.forEach((p, i) => { if (i) pdf.addPage(); pdf.addImage(p.toDataURL('image/jpeg', 0.9), 'JPEG', 0, 0, 8.5, 11); });
    return pdf.output('blob');
  }

  // ---- PowerPoint: slide spec shared by the preview images and the .pptx ----
  async function deckSpec(frame, { title, subtitle, cover }) {
    const d = frame.contentDocument;
    await h2c(d);
    const { head, list } = blocks(d);
    const h1 = [...d.querySelectorAll('h1')].find(vis);
    const lede = h1 && [...h1.parentElement.querySelectorAll('p')].find(vis);
    const slides = [];
    if (cover) slides.push({ cover });
    const kp = head.filter((e) => e.classList.contains('kpis'));
    slides.push({ kicker: subtitle.toUpperCase(), title: h1 ? h1.textContent.trim() : title, lede: lede ? lede.textContent.trim() : '', img: kp.length ? await snap(kp, d) : null });
    for (const b of list) slides.push(b.part ? { part: b.part } : { title: b.title, img: await snap(b.els, d) });
    return { slides, title, mark: await imgEl('assets/field-mark.png') };
  }
  function slideImages(spec) {
    const S = 120, W = 13.333 * S, H = 7.5 * S;
    return spec.slides.map((sl, i) => {
      const [c, x] = canvas(W, H);
      if (sl.cover) { coverOn(x, W, H, S, sl.cover, spec.mark); return c; }
      x.fillStyle = '#374151'; x.fillRect(0.5 * S, 7.02 * S, W - S, 1);
      text(x, 'Field · fieldwealth.ai', 0.5 * S, 7.1 * S, { size: 0.14 * S, color: '#9CA3AF' });
      text(x, String(i + 1), W - 0.5 * S, 7.1 * S, { size: 0.14 * S, color: '#9CA3AF', align: 'right' });
      if (sl.part) { text(x, sl.part, 0.5 * S, 3.2 * S, { size: 0.5 * S, weight: 700, color: '#31C48D' }); return c; }
      if (sl.kicker) {
        text(x, sl.kicker, 0.5 * S, 0.45 * S, { size: 0.17 * S, weight: 700, color: '#31C48D', spacing: 2 });
        text(x, sl.title, 0.5 * S, 0.85 * S, { size: 0.44 * S, weight: 700, maxW: W - S });
        if (sl.lede) text(x, sl.lede, 0.5 * S, 1.7 * S, { size: 0.22 * S, color: '#9CA3AF', maxW: W - S, lh: 1.35 });
        if (sl.img) fitDraw(x, sl.img, 0.5 * S, 2.8 * S, W - S, 4.0 * S, true);
        return c;
      }
      if (sl.title) text(x, sl.title, 0.5 * S, 0.4 * S, { size: 0.33 * S, weight: 700 });
      if (sl.img) fitDraw(x, sl.img, 0.5 * S, (sl.title ? 1.15 : 0.5) * S, W - S, (sl.title ? 5.7 : 6.35) * S, true);
      return c;
    });
  }
  async function pptxBlob(spec) {
    await load(PPTX);
    const pptx = new G.PptxGenJS();
    pptx.layout = 'LAYOUT_WIDE'; pptx.title = spec.title;
    const W = 13.333, BG = '111928', INK = 'F9FAFB', MUT = '9CA3AF', GRN = '31C48D', F = 'Inter';
    pptx.defineSlideMaster({ title: 'FIELD', background: { color: BG }, objects: [
      { rect: { x: 0.5, y: 7.02, w: W - 1, h: 0.01, fill: { color: '374151' } } },
      { text: { text: 'Field · fieldwealth.ai', options: { x: 0.5, y: 7.07, w: 6, h: 0.3, fontFace: F, fontSize: 10, color: MUT } } },
    ], slideNumber: { x: W - 1.2, y: 7.07, w: 0.7, h: 0.3, fontFace: F, fontSize: 10, color: MUT, align: 'right' } });
    const fit = (c, x, y, mw, mh) => { const r = Math.min(mw / c.width, mh / c.height); return { data: c.toDataURL('image/png'), x: x + (mw - c.width * r) / 2, y, w: c.width * r, h: c.height * r }; };
    const markData = spec.mark ? (() => { const [c, x] = canvas(spec.mark.width, spec.mark.height); x.clearRect(0, 0, c.width, c.height); x.drawImage(spec.mark, 0, 0); return c.toDataURL('image/png'); })() : null;
    for (const sl of spec.slides) {
      if (sl.cover) {
        const cv = sl.cover, s = pptx.addSlide(); s.background = { color: BG };
        if (markData) s.addImage({ data: markData, x: 0.7, y: 0.6, w: 0.36, h: 0.36 });
        s.addText('Field', { x: 1.15, y: 0.58, w: 3, h: 0.4, fontFace: F, fontSize: 15, bold: true, color: INK, valign: 'middle' });
        s.addShape(pptx.ShapeType.rect, { x: 0.7, y: 2.45, w: W - 1.4, h: 0.03, fill: { color: GRN }, line: { color: GRN, width: 0 } });
        s.addText(cv.type.toUpperCase(), { x: 0.7, y: 2.7, w: W - 1.4, h: 0.4, fontFace: F, fontSize: 13, bold: true, color: GRN, charSpacing: 4 });
        s.addText(cv.forWho, { x: 0.7, y: 3.15, w: W - 1.4, h: 1.0, fontFace: F, fontSize: 44, bold: true, color: INK, valign: 'top' });
        s.addText(cv.period, { x: 0.7, y: 4.15, w: W - 1.4, h: 0.5, fontFace: F, fontSize: 20, color: 'D1D5DB' });
        s.addShape(pptx.ShapeType.rect, { x: 0.7, y: 5.55, w: W - 1.4, h: 0.01, fill: { color: '374151' }, line: { color: '374151', width: 0 } });
        const cw = (W - 1.4) / 3;
        [['PREPARED FOR', cv.forWho, cv.forRole], ['POWERED BY', 'Field', 'fieldwealth.ai'], ['DATE', cv.date, 'Reporting period: ' + cv.period]].forEach(([k, v, sub], i) => {
          const x = 0.7 + i * cw;
          s.addText(k, { x, y: 5.7, w: cw - 0.2, h: 0.28, fontFace: F, fontSize: 9.5, bold: true, color: MUT, charSpacing: 2 });
          s.addText(v, { x, y: 5.98, w: cw - 0.2, h: 0.34, fontFace: F, fontSize: 14, bold: true, color: INK });
          if (sub) s.addText(sub, { x, y: 6.3, w: cw - 0.2, h: 0.3, fontFace: F, fontSize: 11, color: MUT });
        });
        s.addText(CONF, { x: 0.7, y: 6.85, w: W - 1.4, h: 0.3, fontFace: F, fontSize: 9.5, color: MUT });
        continue;
      }
      const s = pptx.addSlide({ masterName: 'FIELD' });
      if (sl.part) { s.addText(sl.part, { x: 0.5, y: 3.1, w: W - 1, h: 1, fontFace: F, fontSize: 36, bold: true, color: GRN }); continue; }
      if (sl.kicker) {
        s.addText(sl.kicker, { x: 0.5, y: 0.45, w: W - 1, h: 0.35, fontFace: F, fontSize: 12, bold: true, color: GRN, charSpacing: 2 });
        s.addText(sl.title, { x: 0.5, y: 0.85, w: W - 1, h: 0.8, fontFace: F, fontSize: 32, bold: true, color: INK });
        if (sl.lede) s.addText(sl.lede, { x: 0.5, y: 1.7, w: W - 1, h: 0.9, fontFace: F, fontSize: 16, color: MUT, valign: 'top' });
        if (sl.img) s.addImage(fit(sl.img, 0.5, 2.8, W - 1, 4.0));
        continue;
      }
      s.addText(sl.title, { x: 0.5, y: 0.4, w: W - 1, h: 0.6, fontFace: F, fontSize: 24, bold: true, color: INK });
      if (sl.img) s.addImage(fit(sl.img, 0.5, sl.title ? 1.15 : 0.5, W - 1, sl.title ? 5.7 : 6.35));
    }
    return pptx.write({ outputType: 'blob' });
  }

  // ---- modal shell shared by the preview and the compose window ----
  const CSS = `.amx-ov{position:fixed;inset:0;z-index:1000;background:rgba(3,7,14,.72);display:flex;align-items:center;justify-content:center;animation:amxIn .16s ease-out}
@keyframes amxIn{from{opacity:0}to{opacity:1}}
.amx-pn{width:min(1100px,94vw);height:92vh;display:flex;flex-direction:column;border-radius:12px;overflow:hidden;box-shadow:0 30px 80px rgba(0,0,0,.6);font-family:Inter,${FONT}}
.amx-hd{display:flex;align-items:center;gap:10px;padding:12px 16px;background:rgb(31,41,55);border-bottom:1px solid rgba(75,85,99,.6);color:#F9FAFB}
.amx-tt{font-size:14px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.amx-sb{font-size:12px;color:#9CA3AF;white-space:nowrap}
.amx-sp{flex:1}
.amx-bt{height:32px;padding:0 13px;border-radius:8px;border:1px solid rgba(75,85,99,.8);background:transparent;color:#E5E7EB;font:600 12.5px Inter,${FONT};cursor:pointer;display:inline-flex;align-items:center;gap:7px;white-space:nowrap}
.amx-bt:hover{background:rgba(255,255,255,.06)}
.amx-pr{background:#10B981;border-color:#10B981;color:#fff}.amx-pr:hover{background:#059669}
.amx-x{width:32px;padding:0;justify-content:center}
.amx-bd{flex:1;overflow:auto;background:rgb(55,65,81);padding:28px 20px;display:flex;flex-direction:column;align-items:center;gap:22px}
.amx-pg{display:block;box-shadow:0 8px 24px rgba(0,0,0,.45);border-radius:2px;background:#111928}
.amx-ms{font-size:12px;color:#6EF0B4}
.amx-cm{width:min(860px,94vw);background:#fff;color:#111827}
.amx-cm .amx-hd{background:#F3F4F6;color:#111827;border-bottom:1px solid #E5E7EB}
.amx-cm .amx-bt{color:#374151;border-color:#D1D5DB}.amx-cm .amx-bt:hover{background:#E5E7EB}
.amx-cm .amx-pr{background:#2563EB;border-color:#2563EB;color:#fff}.amx-cm .amx-pr:hover{background:#1D4ED8}
.amx-fd{display:grid;grid-template-columns:70px 1fr;align-items:center;border-bottom:1px solid #E5E7EB;padding:0 16px;min-height:40px;font-size:13px}
.amx-fd span{color:#6B7280}.amx-fd input{border:none;outline:none;font:13px Inter,${FONT};color:#111827;padding:10px 0;background:transparent}
.amx-eb{flex:1;overflow:auto;padding:18px 16px;background:#fff}
.amx-eb p{margin:0 0 14px;font-size:13.5px;line-height:1.5;color:#111827}
.amx-eb img{display:block;width:640px;max-width:100%;border-radius:4px}`;
  function modal(cls) {
    if (!document.getElementById('amx-css')) { const st = document.createElement('style'); st.id = 'amx-css'; st.textContent = CSS; document.head.appendChild(st); }
    const ov = document.createElement('div'); ov.className = 'amx-ov';
    const pn = document.createElement('div'); pn.className = 'amx-pn ' + (cls || ''); ov.appendChild(pn);
    const close = () => { ov.remove(); document.removeEventListener('keydown', esc, true); };
    const esc = (e) => { if (e.key === 'Escape') { e.stopPropagation(); close(); } };
    document.addEventListener('keydown', esc, true);
    ov.addEventListener('mousedown', (e) => { if (e.target === ov) close(); });
    document.body.appendChild(ov);
    return { pn, close };
  }
  const btn = (label, icon, cls, onClick) => { const b = document.createElement('button'); b.className = 'amx-bt ' + (cls || ''); b.innerHTML = (icon ? `<i class="fa-solid fa-${icon}" style="font-size:11px"></i>` : '') + `<span>${label}</span>`; b.onclick = onClick; return b; };
  const esc = (t) => String(t || '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function preview({ title, sub, imgs, width, ext, icon, makeBlob }) {
    const { pn, close } = modal();
    pn.innerHTML = `<div class="amx-hd"><i class="fa-solid fa-${icon}" style="color:#34D399"></i><span class="amx-tt">${esc(title)}</span><span class="amx-sb">${esc(sub)}</span><span class="amx-sp"></span><span class="amx-ms"></span></div><div class="amx-bd"></div>`;
    const hd = pn.querySelector('.amx-hd'), ms = pn.querySelector('.amx-ms'), bd = pn.querySelector('.amx-bd');
    const dl = btn(`Download .${ext}`, 'download', 'amx-pr', async () => {
      dl.disabled = true; ms.textContent = 'Preparing file…';
      try { const r = await save(safe(title) + '.' + ext, await makeBlob()); ms.textContent = r === 'saved' ? 'Saved' : ''; }
      catch (e) { ms.textContent = (e && e.message) || 'Could not save the file'; }
      dl.disabled = false;
    });
    hd.appendChild(dl); hd.appendChild(btn('', 'xmark', 'amx-x', close));
    imgs.forEach((c) => { const im = document.createElement('img'); im.className = 'amx-pg'; im.src = c.toDataURL('image/jpeg', 0.92); im.style.width = `min(${width}px, 100%)`; bd.appendChild(im); });
  }

  async function briefPdf(frame, file, cover) {
    const pages = await pdfPages(frame, cover);
    preview({ title: file, sub: `PDF · ${pages.length} pages`, imgs: pages, width: 820, ext: 'pdf', icon: 'file-pdf', makeBlob: () => pdfBlob(pages) });
  }
  async function briefPptx(frame, opts) {
    const spec = await deckSpec(frame, opts);
    const imgs = slideImages(spec);
    preview({ title: opts.file, sub: `PowerPoint · ${imgs.length} slides`, imgs, width: 960, ext: 'pptx', icon: 'file-powerpoint', makeBlob: () => pptxBlob(spec) });
  }

  // Snapshot an email template (rendered in a frame) as one image.
  async function emailImage(frame) {
    const d = frame.contentDocument;
    await h2c(d);
    const el = d.querySelector('table[width="640"]') || d.querySelector('.em') || d.body;
    return d.defaultView.html2canvas(el, { backgroundColor: '#111928', scale: 2, logging: false, windowWidth: 760, windowHeight: Math.max(d.documentElement.scrollHeight, el.scrollHeight) + 40 });
  }

  // New-message window with the brief embedded as an image. Resolves with the
  // message to show in the portal ('' when discarded).
  function ampCompose({ to, subject, image, extra }) {
    return new Promise((resolve) => {
      const { pn, close } = modal('amx-cm');
      const done = (m) => { close(); resolve(m); };
      pn.innerHTML = `<div class="amx-hd"><i class="fa-solid fa-envelope" style="color:#2563EB"></i><span class="amx-tt">New message</span><span class="amx-sp"></span></div>
<div class="amx-fd"><span>From</span><div style="padding:10px 0;color:#374151">Field Briefs &lt;briefs@fieldwealth.ai&gt;</div></div>
<div class="amx-fd"><span>To</span><input class="amx-to" value="${esc(to)}" placeholder="Add recipients"></div>
<div class="amx-fd"><span>Subject</span><input class="amx-su" value="${esc(subject)}"></div>
<div class="amx-eb"><p>Sharing the latest brief below.</p></div>`;
      const hd = pn.querySelector('.amx-hd');
      if (extra) hd.appendChild(btn(extra.label, extra.icon, '', () => { extra.onClick(); }));
      hd.appendChild(btn('Discard', '', '', () => done('')));
      hd.appendChild(btn('Send', 'paper-plane', 'amx-pr', () => {
        const t = pn.querySelector('.amx-to').value.trim();
        done(t ? `Sent to ${t}` : 'Sent');
      }));
      const im = document.createElement('img'); im.src = image.toDataURL('image/png'); im.alt = subject;
      pn.querySelector('.amx-eb').appendChild(im);
      setTimeout(() => { const i = pn.querySelector('.amx-to'); if (i && !i.value) i.focus(); }, 50);
    });
  }

  G.briefPdf = briefPdf; G.briefPptx = briefPptx; G.ampCompose = ampCompose; G.briefEmailImage = emailImage;
})(window);
