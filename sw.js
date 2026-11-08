// Guarda o app no aparelho para abrir mesmo sem internet.
const V = 'wjr-v8';
const SHELL = ['./', './index.html', './app.js', './manifest.webmanifest',
  './icones/logo-claro.png', './icones/logo-escuro.png', './icones/icone-180.png', './icones/icone-192.png', './icones/icone-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  const mesmo = u.origin === location.origin;
  const cdn = ['cdn.jsdelivr.net', 'fonts.googleapis.com', 'fonts.gstatic.com'].includes(u.hostname);
  if (!mesmo && !cdn) return; // banco de dados, mapas etc. vão direto para a internet
  if (mesmo && r.mode === 'navigate') {
    e.respondWith(fetch(r).then(res => {
      const c = res.clone(); caches.open(V).then(ca => ca.put('./index.html', c)); return res;
    }).catch(() => caches.match('./index.html')));
    return;
  }
  if (mesmo) { // arquivos do app: versão mais nova quando há internet; a guardada quando não há
    e.respondWith(fetch(r, { cache: 'no-cache' }).then(res => {
      if (res.ok) { const c = res.clone(); caches.open(V).then(ca => ca.put(r, c)); }
      return res;
    }).catch(() => caches.match(r, { ignoreSearch: true })));
    return;
  }
  e.respondWith(caches.match(r).then(hit => {
    const net = fetch(r).then(res => {
      if (res.ok || res.type === 'opaque') { const c = res.clone(); caches.open(V).then(ca => ca.put(r, c)); }
      return res;
    }).catch(() => hit);
    return hit || net;
  }));
});
