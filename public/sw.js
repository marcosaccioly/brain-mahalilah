const CACHE_NAME = "padma-v2";
// HTML nunca entra no cache — sempre vem da rede para garantir atualizações imediatas
const STATIC_ASSETS = ["/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
        )
      )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Chamadas de API: sem cache (deixar passar direto)
  if (url.pathname.startsWith("/api/")) return;

  // HTML: sempre buscar da rede (network-first)
  if (event.request.destination === "document") return;

  // Demais recursos estáticos: cache-first
  event.respondWith(
    caches
      .match(event.request)
      .then((cached) => cached || fetch(event.request))
  );
});
