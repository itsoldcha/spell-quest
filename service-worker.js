const CACHE_VERSION = "spell-quest-v1";
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const MEDIA_CACHE = `${CACHE_VERSION}-media`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

const CORE_ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./game.js",
  "./pwa.js",
  "./manifest.webmanifest",
  "./assets/data/vocabulary.js",
  "./assets/data/vocabulary.csv",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/icons/icon-maskable-512.png",
  "./assets/icons/apple-touch-icon.png",
  "./assets/layers/bg-clean.png",
  "./assets/layers/regions/bg-region-grassland.png",
  "./assets/layers/cannon-left.png",
  "./assets/layers/cannon-right.png",
  "./assets/audio/bgm/bgm-01-title-theme.mp3",
  "./assets/audio/bgm/bgm-03-sunny-grassland.mp3"
];

const STAGES = ["baby", "rookie", "ultimate"];
const ACTIONS = ["idle-1", "idle-2", "entrance", "hit", "defeat", "capture", "evolution"];
const FIRST_REGION_ASSETS = [];

for (let index = 0; index < 6; index += 1) {
  const id = String(index).padStart(2, "0");
  FIRST_REGION_ASSETS.push(`./assets/monsters/monster-${id}.png`);
  for (const stage of STAGES) {
    FIRST_REGION_ASSETS.push(`./assets/evolutions/monster-${id}-${stage}.png`);
    for (const action of ACTIONS) {
      FIRST_REGION_ASSETS.push(`./assets/monster-packs/monster-${id}/${stage}/${action}.png`);
    }
  }
}

function scopedUrl(path) {
  return new URL(path, self.registration.scope).href;
}

async function warmCache(cacheName, paths) {
  const cache = await caches.open(cacheName);
  await Promise.allSettled(
    paths.map(async (path) => {
      const url = scopedUrl(path);
      const response = await fetch(url, { cache: "reload" });
      if (response.ok) {
        await cache.put(url, response);
      }
    })
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(CORE_ASSETS.map(scopedUrl)))
      .then(() => warmCache(MEDIA_CACHE, FIRST_REGION_ASSETS))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("spell-quest-") && ![SHELL_CACHE, MEDIA_CACHE, RUNTIME_CACHE].includes(key))
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request, { ignoreSearch: true });
  if (cached) {
    return cached;
  }
  const response = await fetch(request);
  if (response.ok && response.status === 200) {
    cache.put(request, response.clone());
  }
  return response;
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request, { ignoreSearch: true });
  const network = fetch(request)
    .then((response) => {
      if (response.ok && response.status === 200) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached);
  return cached || network;
}

async function navigationResponse(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(SHELL_CACHE);
      cache.put(scopedUrl("./index.html"), response.clone());
    }
    return response;
  } catch {
    const cache = await caches.open(SHELL_CACHE);
    return (await cache.match(scopedUrl("./index.html"))) || Response.error();
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(navigationResponse(request));
    return;
  }

  if (request.headers.has("range")) {
    return;
  }

  if (request.destination === "image" || request.destination === "audio") {
    event.respondWith(cacheFirst(request, MEDIA_CACHE));
    return;
  }

  event.respondWith(staleWhileRevalidate(request));
});
