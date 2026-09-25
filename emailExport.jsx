/* Shared email download. Every send / test / "Email to" button calls
   emailOutlookDraft with the Outlook build of its template (<name> - Outlook.html).
   The template renders in a hidden frame so its URL settings apply (hide, role,
   scope, sub, h1, v), scripts are stripped, and the result downloads as an
   unsent .eml that opens in Outlook as a ready-to-send draft. */
function emailOutlookDraft({ url, subject = '', to = '', filename }) {
  return new Promise((resolve, reject) => {
    const f = document.createElement('iframe');
    f.style.cssText = 'position:fixed;left:-9999px;top:0;width:700px;height:400px;border:0';
    f.onload = () => {
      try {
        const doc = f.contentDocument.documentElement.cloneNode(true);
        doc.querySelectorAll('script').forEach(n => n.remove());
        const html = '<!DOCTYPE html>\n' + doc.outerHTML;
        const b64 = btoa(unescape(encodeURIComponent(html))).replace(/.{76}/g, '$&\r\n');
        const enc = v => '=?UTF-8?B?' + btoa(unescape(encodeURIComponent(v))) + '?=';
        const eml = ['X-Unsent: 1', 'To: ' + to, 'Subject: ' + enc(subject), 'MIME-Version: 1.0',
          'Content-Type: text/html; charset="utf-8"', 'Content-Transfer-Encoding: base64', '', b64].join('\r\n');
        const u = URL.createObjectURL(new Blob([eml], { type: 'message/rfc822' }));
        const a = document.createElement('a');
        a.href = u; a.download = (filename || subject || 'Brief').replace(/[\\/:*?"<>|·]+/g, '-').replace(/\s*-\s*/g, ' - ').slice(0, 80) + '.eml';
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(u), 4000);
        resolve();
      } catch (e) { reject(e); } finally { setTimeout(() => f.remove(), 100); }
    };
    f.src = url;
    document.body.appendChild(f);
  });
}
const emailAddressOf = name => (name ? name.toLowerCase().replace(/[^a-z ]/g, '').trim().replace(/\s+/g, '.') + '@fieldwealth.ai' : '');
const EMAIL_DRAFT_MSG = 'Outlook draft downloaded · open it to send';

Object.assign(window, { emailOutlookDraft, emailAddressOf, EMAIL_DRAFT_MSG });
