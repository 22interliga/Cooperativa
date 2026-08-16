/* CoopVia service worker — network-first (sempre pega atualização) */
const CACHE = "coopvia-v2";
const ASSETS = ["login.html","index.html","empresa.html","motorista.html",
  "styles.css","db.js","ui.js","geo.js","manifest.json","coopvia-192.png","coopvia-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  // network-first: busca sempre a versão nova; cai no cache só se offline
  e.respondWith(
    fetch(e.request).then(res => {
      const cp = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, cp));
      return res;
    }).catch(() => caches.match(e.request).then(r => r || caches.match("login.html")))
  );
});
