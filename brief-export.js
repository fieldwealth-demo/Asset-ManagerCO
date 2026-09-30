/* Save a brief shown in the portal as PDF (browser print → Save as PDF) or
   PowerPoint (one slide per section, rendered from the brief itself). */
(function (G) {
  const libs = {};
  const load = (src) => libs[src] || (libs[src] = new Promise((ok, no) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = no; document.head.appendChild(s); }));
  const H2C = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
  const PPTX = 'https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js';
  const vis = (e) => e && e.offsetParent !== null && getComputedStyle(e).display !== 'none';
  const safe = (t) => t.replace(/[\\/:*?"<>|]+/g, '-').trim();

  function printCss(d) {
    if (d.getElementById('brf-print')) return;
    const st = d.createElement('style'); st.id = 'brf-print';
    st.textContent = '@page{size:letter;margin:0.35in}@media print{html,body{background:#111928!important;-webkit-print-color-adjust:exact;print-color-adjust:exact}.embed .em{border:0!important;border-radius:0!important;max-width:none!important;padding:8px 4px!important}.card,.sr,.tt,.item,.pr2{break-inside:avoid}.sec>h2{break-after:avoid}.part{break-before:auto}[data-go]{cursor:default}}';
    d.head.appendChild(st);
  }

  const esc = (t) => String(t || '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const CONF = 'Confidential · For internal use only. Not for distribution to clients or the public.';

  // Print-only cover page, first page of the PDF.
  function pdfCover(d, c) {
    d.querySelector('.brf-cover')?.remove();
    if (!d.getElementById('brf-cover-css')) {
      const st = d.createElement('style'); st.id = 'brf-cover-css';
      st.textContent = '.brf-cover{display:none}@media print{.brf-cover{display:flex;flex-direction:column;height:10.2in;padding:.5in .45in .35in;box-sizing:border-box;break-after:page;font-family:Inter,sans-serif;color:#F9FAFB}.brf-cover .cv-top{display:flex;align-items:center;gap:10px;font-size:13px;font-weight:600;letter-spacing:.02em}.brf-cover .cv-top img{width:26px;height:26px}.brf-cover .cv-mid{margin-top:auto;border-top:2px solid #31C48D;padding-top:28px}.brf-cover .cv-eb{font-size:12px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:#31C48D;margin:0 0 14px}.brf-cover h1.cv-t{font-size:44px;line-height:1.1;font-weight:700;margin:0 0 10px;color:#F9FAFB}.brf-cover .cv-p{font-size:20px;color:#D1D5DB;margin:0}.brf-cover .cv-meta{margin-top:auto;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:24px;border-top:1px solid #374151;padding-top:18px}.brf-cover .cv-meta div{display:flex;flex-direction:column;gap:4px}.brf-cover .cv-meta span{font-size:10px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:#9CA3AF}.brf-cover .cv-meta b{font-size:14px;font-weight:600;color:#F9FAFB}.brf-cover .cv-meta i{font-style:normal;font-size:12px;color:#9CA3AF}.brf-cover .cv-conf{margin:22px 0 0;font-size:10.5px;color:#9CA3AF}}';
      d.head.appendChild(st);
    }
    const el = d.createElement('div'); el.className = 'brf-cover';
    el.innerHTML = `<div class="cv-top"><img src="../assets/field-mark.png" alt="">Field</div><div class="cv-mid"><p class="cv-eb">${esc(c.type)}</p><h1 class="cv-t">${esc(c.forWho)}</h1><p class="cv-p">${esc(c.period)}</p></div><div class="cv-meta"><div><span>Prepared for</span><b>${esc(c.forWho)}</b>${c.forRole ? `<i>${esc(c.forRole)}</i>` : ''}</div><div><span>Powered by</span><b>Field</b><i>fieldwealth.ai</i></div><div><span>Date</span><b>${esc(c.date)}</b><i>Reporting period: ${esc(c.period)}</i></div></div><p class="cv-conf">${CONF}</p>`;
    const em = d.querySelector('.em'); em.insertBefore(el, em.firstChild);
    return el;
  }

  function briefPdf(frame, title, cover) {
    const w = frame.contentWindow, d = frame.contentDocument;
    printCss(d);
    const cv = cover && pdfCover(d, cover);
    const t0 = d.title; d.title = safe(title);
    const done = () => { d.title = t0; cv && cv.remove(); w.removeEventListener('afterprint', done); };
    w.addEventListener('afterprint', done);
    w.focus(); w.print();
  }

  // Header (h1, lede, KPI cards) becomes the title slide; every visible .sec
  // and Part divider after it becomes its own slide.
  function blocks(d) {
    const em = d.querySelector('.em'), out = [];
    let head = [];
    [...em.children].forEach((c) => {
      if (!vis(c) || c.classList.contains('btn') || c.classList.contains('brf-cover') || (c.classList.contains('row') && (c === em.firstElementChild || c === em.lastElementChild))) return;
      if (c.classList.contains('sec')) { out.push({ els: [c], title: [...c.querySelectorAll(':scope>h2')].find(vis)?.textContent.trim() || '' }); return; }
      if (c.classList.contains('kpis') && !out.some(b => b.els)) { head.push(c); return; }
      if (c.classList.contains('part')) { out.push({ part: c.textContent.trim() }); return; }
      if (!out.length) head.push(c); else if (!/How this was built/.test(c.textContent)) out.push({ els: [c], title: '' });
    });
    return { head, list: out };
  }

  async function snap(els, d) {
    const wrap = d.createElement('div');
    const em = d.querySelector('.em');
    wrap.style.cssText = `position:absolute;left:-10000px;top:0;width:${em.clientWidth - 64}px;padding:24px;background:#111928;display:flex;flex-direction:column;gap:24px;color:#fff;line-height:1.5`;
    // html2canvas mis-measures word spacing with the local Inter TTFs, so the
    // capture uses the Outlook build's font stack.
    const fs = d.createElement('style');
    fs.textContent = '.brf-snap,.brf-snap *{font-family:"Segoe UI",Helvetica,Arial,sans-serif!important}';
    wrap.className = 'brf-snap'; wrap.appendChild(fs);
    els.forEach((e) => wrap.appendChild(e.cloneNode(true)));
    wrap.querySelectorAll('.sec>h2').forEach((h) => (h.style.display = 'none'));
    wrap.querySelectorAll('.sec>h2+h2').forEach((h) => (h.style.display = 'none'));
    em.appendChild(wrap);
    try { return await d.defaultView.html2canvas(wrap, { backgroundColor: '#111928', scale: 2, logging: false }); }
    finally { wrap.remove(); }
  }

  async function briefPptx(frame, { title, subtitle, file, cover }) {
    await load(PPTX);
    const d = frame.contentDocument;
    // html2canvas must run in the brief's own window so text is measured with
    // the brief's fonts; run from the portal it drops word spaces.
    if (!d.defaultView.html2canvas) await new Promise((ok, no) => { const s = d.createElement('script'); s.src = H2C; s.onload = ok; s.onerror = no; d.head.appendChild(s); });
    if (d.fonts && d.fonts.ready) await d.fonts.ready;
    const { head, list } = blocks(d);
    const pptx = new G.PptxGenJS();
    pptx.layout = 'LAYOUT_WIDE'; pptx.title = title;
    const W = 13.333, BG = '111928', INK = 'F9FAFB', MUT = '9CA3AF', GRN = '31C48D', F = 'Inter';
    pptx.defineSlideMaster({ title: 'FIELD', background: { color: BG }, objects: [
      { rect: { x: 0.5, y: 7.02, w: W - 1, h: 0.01, fill: { color: '374151' } } },
      { text: { text: 'Field · fieldwealth.ai', options: { x: 0.5, y: 7.07, w: 6, h: 0.3, fontFace: F, fontSize: 10, color: MUT } } },
    ], slideNumber: { x: W - 1.2, y: 7.07, w: 0.7, h: 0.3, fontFace: F, fontSize: 10, color: MUT, align: 'right' } });
    const fit = (c, x, y, mw, mh) => { const r = Math.min(mw / c.width, mh / c.height); return { data: c.toDataURL('image/png'), x: x + (mw - c.width * r) / 2, y, w: c.width * r, h: c.height * r }; };

    const h1 = [...d.querySelectorAll('h1')].find(vis);
    const lede = h1 && [...h1.parentElement.querySelectorAll('p')].find(vis);
    let s;
    if (cover) {
      s = pptx.addSlide(); s.background = { color: BG };
      s.addImage({ path: 'assets/field-mark.png', x: 0.7, y: 0.6, w: 0.36, h: 0.36 });
      s.addText('Field', { x: 1.15, y: 0.58, w: 3, h: 0.4, fontFace: F, fontSize: 15, bold: true, color: INK, valign: 'middle' });
      s.addShape(pptx.ShapeType.rect, { x: 0.7, y: 2.45, w: W - 1.4, h: 0.03, fill: { color: GRN }, line: { color: GRN, width: 0 } });
      s.addText(cover.type.toUpperCase(), { x: 0.7, y: 2.7, w: W - 1.4, h: 0.4, fontFace: F, fontSize: 13, bold: true, color: GRN, charSpacing: 4 });
      s.addText(cover.forWho, { x: 0.7, y: 3.15, w: W - 1.4, h: 1.0, fontFace: F, fontSize: 44, bold: true, color: INK, valign: 'top' });
      s.addText(cover.period, { x: 0.7, y: 4.15, w: W - 1.4, h: 0.5, fontFace: F, fontSize: 20, color: 'D1D5DB' });
      s.addShape(pptx.ShapeType.rect, { x: 0.7, y: 5.55, w: W - 1.4, h: 0.01, fill: { color: '374151' }, line: { color: '374151', width: 0 } });
      const cw = (W - 1.4) / 3;
      [['PREPARED FOR', cover.forWho, cover.forRole], ['POWERED BY', 'Field', 'fieldwealth.ai'], ['DATE', cover.date, 'Reporting period: ' + cover.period]].forEach(([k, v, sub], i) => {
        const x = 0.7 + i * cw;
        s.addText(k, { x, y: 5.7, w: cw - 0.2, h: 0.28, fontFace: F, fontSize: 9.5, bold: true, color: MUT, charSpacing: 2 });
        s.addText(v, { x, y: 5.98, w: cw - 0.2, h: 0.34, fontFace: F, fontSize: 14, bold: true, color: INK });
        if (sub) s.addText(sub, { x, y: 6.3, w: cw - 0.2, h: 0.3, fontFace: F, fontSize: 11, color: MUT });
      });
      s.addText(CONF, { x: 0.7, y: 6.85, w: W - 1.4, h: 0.3, fontFace: F, fontSize: 9.5, color: MUT });
    }
    s = pptx.addSlide({ masterName: 'FIELD' });
    s.addText(subtitle.toUpperCase(), { x: 0.5, y: 0.45, w: W - 1, h: 0.35, fontFace: F, fontSize: 12, bold: true, color: GRN, charSpacing: 2 });
    s.addText(h1 ? h1.textContent.trim() : title, { x: 0.5, y: 0.85, w: W - 1, h: 0.8, fontFace: F, fontSize: 32, bold: true, color: INK });
    if (lede) s.addText(lede.textContent.trim(), { x: 0.5, y: 1.7, w: W - 1, h: 0.9, fontFace: F, fontSize: 16, color: MUT, valign: 'top' });
    const kp = head.filter((e) => e.classList.contains('kpis'));
    if (kp.length) s.addImage(fit(await snap(kp, d), 0.5, 2.8, W - 1, 4.0));

    for (const b of list) {
      s = pptx.addSlide({ masterName: 'FIELD' });
      if (b.part) { s.addText(b.part, { x: 0.5, y: 3.1, w: W - 1, h: 1, fontFace: F, fontSize: 36, bold: true, color: GRN }); continue; }
      s.addText(b.title, { x: 0.5, y: 0.4, w: W - 1, h: 0.6, fontFace: F, fontSize: 24, bold: true, color: INK });
      s.addImage(fit(await snap(b.els, d), 0.5, b.title ? 1.15 : 0.5, W - 1, b.title ? 5.7 : 6.35));
    }
    await pptx.writeFile({ fileName: safe(file) + '.pptx' });
  }

  G.briefPdf = briefPdf; G.briefPptx = briefPptx;
})(window);
