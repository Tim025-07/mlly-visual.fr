(() => {
  'use strict';
  if (navigator.doNotTrack === '1' || navigator.globalPrivacyControl === true || navigator.webdriver) return;
  const rnd = () => Array.from(crypto.getRandomValues(new Uint8Array(8)), (b) => b.toString(16).padStart(2, '0')).join('');
  let visit;
  try {
    const raw = sessionStorage.getItem('mv_v');
    const now = Date.now();
    const o = raw ? JSON.parse(raw) : null;
    visit = o && now - o.t < 1800000 ? o.v : rnd();
    sessionStorage.setItem('mv_v', JSON.stringify({ v: visit, t: now }));
  } catch (e) {
    visit = rnd();
  }
  const pv = rnd();
  const send = (data, beacon) => {
    const body = JSON.stringify(Object.assign({ v: visit, id: pv }, data));
    if (beacon && navigator.sendBeacon) { navigator.sendBeacon('/_v.php', new Blob([body], { type: 'text/plain' })); return; }
    fetch('/_v.php', { method: 'POST', body, headers: { 'Content-Type': 'text/plain' }, keepalive: true, credentials: 'omit' }).catch(() => {});
  };
  const qs = new URLSearchParams(location.search);
  let ref = '';
  try { ref = document.referrer ? new URL(document.referrer).origin + new URL(document.referrer).pathname : ''; } catch (e) { ref = ''; }
  send({ t: 'pv', p: location.pathname, r: ref, s: qs.get('utm_source') || '' });
  const sent = new Set();
  const ev = (k) => { if (!sent.has(k)) { sent.add(k); send({ t: 'ev', k }); } };
  let visible = document.visibilityState === 'visible' ? Date.now() : 0;
  let total = 0;
  const tick = () => { if (visible) { total += Date.now() - visible; visible = Date.now(); } if (total >= 30000) ev('engaged'); };
  const timer = setInterval(tick, 5000);
  const end = () => { tick(); send({ t: 'end', d: Math.round(total / 1000) }, true); };
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') { end(); visible = 0; } else { visible = Date.now(); }
  });
  window.addEventListener('pagehide', () => { clearInterval(timer); end(); });
  const contact = document.getElementById('contact');
  if (contact && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { ev('contact_open'); io.disconnect(); } }, { threshold: 0.35 });
    io.observe(contact);
  }
  document.addEventListener('click', (e) => {
    const a = e.target instanceof Element ? e.target.closest('a[href]') : null;
    if (!a) return;
    if (/instagram\.com/i.test(a.href)) ev('insta_click');
    if (/formation\.html#acheter|achat\.php/i.test(a.href)) ev('guide_click');
  }, { capture: true, passive: true });
  window.addEventListener('mv:contact-sent', () => ev('contact_sent'));
})();
