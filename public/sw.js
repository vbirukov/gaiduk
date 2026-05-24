const SHELL_CACHE = "gayduk-shell-v5";
const AUDIO_CACHE = "gayduk-audio-v1";
const STATIC_RE =
  /^\/(images|gaiduk|covers|brand|icons)\/|\.(webp|jpg|jpeg|svg|woff2?)$/i;

const isAudioRequest = (url) =>
  url.pathname.startsWith("/media/") || url.pathname.startsWith("/audio/");

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) =>
        cache.addAll(["./", "./index.html", "./manifest.webmanifest", "./icon.svg"]),
      )
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  const keep = new Set([SHELL_CACHE, AUDIO_CACHE]);
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => !keep.has(k)).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

async function cacheFirstAudio(request) {
  const cache = await caches.open(AUDIO_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    try {
      await cache.put(request, response.clone());
    } catch {
      /* quota */
    }
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => caches.match("./index.html")),
    );
    return;
  }

  if (isAudioRequest(url)) {
    event.respondWith(cacheFirstAudio(event.request));
    return;
  }

  const cacheable =
    url.pathname.includes("/assets/") || STATIC_RE.test(url.pathname);

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (cacheable && response.ok) {
          const copy = response.clone();
          caches.open(SHELL_CACHE).then((cache) => cache.put(event.request, copy));
        }
        return response;
      });
    }),
  );
});
