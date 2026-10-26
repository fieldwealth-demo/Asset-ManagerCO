/* Shared email + file saving.
   - ampSave(filename, data): saves a generated file. On claude.ai the page runs
     in a frame that can't download directly, so the save goes through the
     viewer's download prompt (the "downloads" capability); anywhere else it is
     a normal browser download.
   - emailOutlookDraft: every send / test / "Email to" button calls it with the
     Outlook build of its template (<name> - Outlook.html). The template renders
     in a hidden frame so its URL settings apply (hide, role, scope, sub, h1, v),
     is captured as an image and opens in a new-message window (ampCompose in
     brief-export.js) with the brief embedded. Outside claude.ai the window also
     offers the original Outlook draft (.eml) download. Resolves with the
     message to show ('' when discarded). */
const AMP_HOSTED = !!(window.claude && typeof window.claude.use === 'function');
const ampDownloads = AMP_HOSTED ? Promise.resolve().then(() => window.claude.use('downloads')).catch(() => null) : Promise.resolve(null);
const ampFileName = (t) => String(t || 'Brief').replace(/[\\/:*?"<>|·]+/g, '-').replace(/\s*-\s*/g, ' - ').replace(/\s+/g, ' ').trim().slice(0, 120);

function ampLinkSave(filename, data) {
  const blob = data instanceof Blob ? data : new Blob([data]);
  const u = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = u; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(u), 4000);
}

async function ampSave(filename, data) {
  const dl = await ampDownloads;
  if (dl) {
    try { await dl.save({ filename, data }); return 'saved'; }
    catch (e) {
      const c = e && e.code;
      if (c === 'declined') return 'declined';
      if (c === 'rate_limited') throw new Error('A save is already waiting for your OK');
      throw new Error(c === 'not_granted' || c === 'unavailable' ? 'Downloads are turned off for this page' : 'Could not save the file');
    }
  }
  ampLinkSave(filename, data);
  return 'saved';
}

function emailOutlookDraft({ url, subject = '', to = '', filename }) {
  return new Promise((resolve, reject) => {
    const f = document.createElement('iframe');
    f.style.cssText = 'position:fixed;left:-10000px;top:0;width:760px;height:4000px;border:0;opacity:0;pointer-events:none';
    f.onload = async () => {
      try {
        const image = await briefEmailImage(f);
        const doc = f.contentDocument.documentElement.cloneNode(true);
        doc.querySelectorAll('script').forEach(n => n.remove());
        const html = '<!DOCTYPE html>\n' + doc.outerHTML;
        const eml = () => {
          const b64 = btoa(unescape(encodeURIComponent(html))).replace(/.{76}/g, '$&\r\n');
          const enc = v => '=?UTF-8?B?' + btoa(unescape(encodeURIComponent(v))) + '?=';
          ampLinkSave(ampFileName(filename || subject) + '.eml', new Blob([['X-Unsent: 1', 'To: ' + to, 'Subject: ' + enc(subject), 'MIME-Version: 1.0',
            'Content-Type: text/html; charset="utf-8"', 'Content-Transfer-Encoding: base64', '', b64].join('\r\n')], { type: 'message/rfc822' }));
        };
        setTimeout(() => f.remove(), 100);
        resolve(await ampCompose({ to, subject, image, extra: AMP_HOSTED ? null : { label: 'Open in Outlook', icon: 'arrow-up-right-from-square', onClick: eml } }));
      } catch (e) { f.remove(); reject(e); }
    };
    f.src = url;
    document.body.appendChild(f);
  });
}
const emailAddressOf = name => (name ? name.toLowerCase().replace(/[^a-z ]/g, '').trim().replace(/\s+/g, '.') + '@fieldwealth.ai' : '');
const EMAIL_DRAFT_MSG = 'Test email sent';

Object.assign(window, { emailOutlookDraft, emailAddressOf, EMAIL_DRAFT_MSG, ampSave, ampFileName, AMP_HOSTED });
