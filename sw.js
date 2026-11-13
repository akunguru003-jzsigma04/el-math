/* EL MATH – Service Worker (mode offline). Ubah V setiap kali Anda merilis versi baru. */
const V = "elmath-v1";
const CORE = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "icon-maskable-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== "GET") return;                                   // POST ke GAS dll. tidak disentuh
  if (/(^|\.)script\.google(usercontent)?\.com$/.test(u.hostname)) return;   // data Google Sheets: jangan di-cache
  if (u.pathname.endsWith("guru.html")) return;                     // dashboard guru selalu online

  if (r.mode === "navigate") {                                      // halaman: jaringan dulu, cadangan dari cache
    e.respondWith(
      fetch(r)
        .then(x => { const cp = x.clone(); caches.open(V).then(c => c.put("index.html", cp)); return x; })
        .catch(() => caches.match("index.html").then(x => x || caches.match("./")))
    );
    return;
  }

  if (u.origin === self.location.origin || /(^|\.)fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)) {
    e.respondWith(                                                  // aset & font: cache dulu, perbarui di latar belakang
      caches.match(r).then(hit => {
        const net = fetch(r).then(x => {
          if (x && (x.ok || x.type === "opaque")) { const cp = x.clone(); caches.open(V).then(c => c.put(r, cp)); }
          return x;
        }).catch(() => hit);
        return hit || net;
      })
    );
  }
});
