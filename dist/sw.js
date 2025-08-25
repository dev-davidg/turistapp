// Basic offline with network-first for pages, cache-first for others.
// Bump version on deploys to avoid stale caches.
const CACHE = "turistapp-v3"; // <— zvýšené číslo

const ASSETS = ["/", "/index.html"];

self.addEventListener("install", (event) => {
  // sťahuj základ, a okamžite aktivuj novú verziu SW
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  // vyčisti staré cache a okamžite zober kontrolu
  event.waitUntil(
    Promise.all([
      caches.keys().then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      ),
      self.clients.claim(),
    ])
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Network-first pre navigácie (HTML)
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put("/", copy));
          return res;
        })
        .catch(() => caches.match("/"))
    );
    return;
  }

  // Cache-first pre ostatné (CSS/JS/IMG)
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        // neukladaj odpovede bez typu/opaque chybové atď.
        if (!res || res.status !== 200 || res.type === "opaque") return res;
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      });
    })
  );
});
