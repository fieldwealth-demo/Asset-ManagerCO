/* Shared by every brief / review email.
   - ?role=ext|int|spec shows the matching [data-role] blocks (wholesaler emails)
   - ?scope=region|national shows the matching [data-scope] blocks (leadership emails)
   - ?embed=1 (read inside the portal) turns names, signal pills and figures into
     links: clicking posts {ampGo: target} to the portal, which opens the team
     profile or the pre-filtered dashboard in a pop-up over the brief. */
(function () {
  var p = new URLSearchParams(location.search);
  var role = p.get('role') || 'ext', scope = p.get('scope') || 'region';
  // ?sub={"From":"To",...} swaps names into the same layout (other regions,
  // salespeople and firms). One pass, longest names first, so swaps never chain.
  try {
    var map = JSON.parse(p.get('sub') || '{}'), keys = Object.keys(map).sort(function (a, b) { return b.length - a.length; });
    if (keys.length) {
      var rx = new RegExp('\\b(' + keys.map(function (k) { return k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }).join('|') + ')\\b', 'g');
      var sw = function (t) { return t.replace(rx, function (m) { return map[m]; }); };
      var w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT), n;
      while ((n = w.nextNode())) n.nodeValue = sw(n.nodeValue);
      document.querySelectorAll('[data-go],[data-label]').forEach(function (e) {
        ['data-go', 'data-label'].forEach(function (a) { if (e.hasAttribute(a)) e.setAttribute(a, sw(e.getAttribute(a))); });
      });
    }
  } catch (e) {}
  // ?h1= replaces the greeting when a leader views someone else's brief.
  var h1 = p.get('h1');
  if (h1) document.querySelectorAll('h1').forEach(function (e) { e.textContent = h1; });
  document.querySelectorAll('[data-role]').forEach(function (e) {
    if (e.getAttribute('data-role').split(' ').indexOf(role) < 0) e.style.display = 'none';
  });
  document.querySelectorAll('[data-scope]').forEach(function (e) {
    if (e.getAttribute('data-scope').split(' ').indexOf(scope) < 0) e.style.display = 'none';
  });
  if (!p.get('embed')) return;
  var SIG = { 'Upsell': 'Upsell', 'Cross-sell': 'Cross-sell', 'Perf adv.': 'Performance Advantage', 'Fee adv.': 'Fee Advantage', 'Focus': 'Focus', 'Retention': 'Retention Risk', 'Risk': 'Retention Risk', 'Recovery': 'Fallen Angel', 'Coverage': 'activity:segA' };
  document.querySelectorAll('.nm').forEach(function (e) {
    if (e.hasAttribute('data-go') || e.hasAttribute('data-nolink')) return;
    e.setAttribute('data-go', 'team:' + e.textContent.split(' · ')[0].trim());
  });
  document.querySelectorAll('.add b').forEach(function (e) { if (!e.hasAttribute('data-go')) e.setAttribute('data-go', 'team:' + e.textContent.trim()); });
  document.querySelectorAll('.pill').forEach(function (e) {
    if (e.hasAttribute('data-go')) return;
    var k = e.textContent.split(' · ')[0].trim(), t = SIG[k];
    if (t) e.setAttribute('data-go', t.indexOf(':') > 0 ? t : 'signal:' + t);
  });
  var st = document.createElement('style');
  st.textContent = '[data-go]{cursor:pointer;transition:color .12s,filter .12s}' +
    '.nm[data-go]:hover,b[data-go]:hover,span[data-go]:not(.pill):hover{color:#31C48D;text-decoration:underline;text-underline-offset:3px}' +
    '.pill[data-go]:hover{filter:brightness(1.35)}' +
    '.card[data-go]:hover,.kpi[data-go]:hover{border-color:#31C48D}' +
    '.item[data-go]:hover .ttl{color:#31C48D}' +
    '.go-hint{font-size:11px;color:#6B7280;margin-left:6px}';
  document.head.appendChild(st);
  document.addEventListener('click', function (ev) {
    var a = ev.target.closest('[data-go]');
    if (!a) { if (ev.target.closest('a[href="#"]')) ev.preventDefault(); return; }
    ev.preventDefault(); ev.stopPropagation();
    try { window.parent.postMessage({ ampGo: a.getAttribute('data-go'), label: (a.getAttribute('data-label') || a.textContent || '').trim().slice(0, 80) }, '*'); } catch (e) {}
  }, true);
})();
