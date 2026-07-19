// service worker для офлайн-работы
const CACHE = "strelnikova-v6";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-180.png",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// навигация (HTML) - network-first, чтобы обновления доходили сразу;
// остальное (иконки, манифест) - cache-first ради скорости и офлайна
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const isNavigation =
    e.request.mode === "navigate" ||
    (e.request.destination === "document");

  if (isNavigation) {
    e.respondWith(
      fetch(e.request)
        .then((resp) => {
          // кэшируется под ключом самого запроса, иначе офлайн-навигация на "./"
          // продолжала бы отдавать копию времени установки; страницы ошибок не кэшируются
          if (resp.ok) {
            const copy = resp.clone();
            caches.open(CACHE).then((c) => c.put(e.request, copy));
          }
          return resp;
        })
        .catch(() => caches.match(e.request).then((r) => r || caches.match("./index.html")))
    );
    return;
  }

  e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request)));
});
