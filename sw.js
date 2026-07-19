// service worker для офлайн-работы
const CACHE = "strelnikova-v7";
// сколько ждать сеть при загрузке HTML, прежде чем откатиться на кэш
const NAV_TIMEOUT_MS = 3000;
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
    e.respondWith((async () => {
      // network-first с таймаутом: на еле живой сети старт не висит до сетевого таймаута
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), NAV_TIMEOUT_MS);
      try {
        const resp = await fetch(e.request, { signal: ctrl.signal });
        clearTimeout(timer);
        // кэшируется под ключом самого запроса, иначе офлайн-навигация на "./"
        // продолжала бы отдавать копию времени установки; страницы ошибок не кэшируются
        if (resp.ok) {
          const copy = resp.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return resp;
      } catch (_) {
        clearTimeout(timer);
        const cached = await caches.match(e.request);
        return cached || caches.match("./index.html");
      }
    })());
    return;
  }

  e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request)));
});
