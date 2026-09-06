const SHELL_CACHE = "memory-match-shell-v2";
const ASSET_CACHE = "memory-match-assets-v2";
const APP_SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icons/memory-match-icon.svg"];
const MAX_CONCURRENT_ASSET_FETCHES = 6;
const inFlightAssetFetches = new Map();
const pendingAssetFetches = [];
let activeAssetFetches = 0;

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== SHELL_CACHE && key !== ASSET_CACHE)
          .map((key) => caches.delete(key)),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (
    event.request.method !== "GET" ||
    event.request.headers.has("range") ||
    new URL(event.request.url).origin !== self.location.origin
  ) return;

  const isAsset = ["audio", "font", "image", "script", "style"].includes(
    event.request.destination,
  );

  if (isAsset) {
    event.respondWith(cacheFirstAsset(event.request, event));
    return;
  }

  event.respondWith(networkFirstDocument(event.request));
});

async function cacheFirstAsset(request, event) {
  const cached = await caches.match(request);
  if (cached) {
    // Phục vụ ngay từ cache, nhưng vẫn làm mới ngầm để asset public cùng URL
    // không bị kẹt ở phiên bản cũ sau lần phát hành tiếp theo.
    event.waitUntil(refreshAsset(request));
    return cached;
  }

  return refreshAsset(request);
}

async function refreshAsset(request) {
  const key = request.url;
  if (!inFlightAssetFetches.has(key)) {
    const requestPromise = withAssetFetchSlot(() => fetchAndCacheAsset(request))
      .finally(() => inFlightAssetFetches.delete(key));
    inFlightAssetFetches.set(key, requestPromise);
  }
  const response = await inFlightAssetFetches.get(key);
  return response.clone();
}

async function fetchAndCacheAsset(request) {
  try {
    const response = await fetch(request);
    if (response.status === 200) {
      const cache = await caches.open(ASSET_CACHE);
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    return Response.error();
  }
}

function withAssetFetchSlot(task) {
  return new Promise((resolve, reject) => {
    const run = async () => {
      activeAssetFetches += 1;
      try {
        resolve(await task());
      } catch (error) {
        reject(error);
      } finally {
        activeAssetFetches -= 1;
        pendingAssetFetches.shift()?.();
      }
    };
    if (activeAssetFetches < MAX_CONCURRENT_ASSET_FETCHES) run();
    else pendingAssetFetches.push(run);
  });
}

async function networkFirstDocument(request) {
  try {
    return await fetch(request);
  } catch {
    const cached = await caches.match(request);
    return cached || (await caches.match("./index.html")) || Response.error();
  }
}
