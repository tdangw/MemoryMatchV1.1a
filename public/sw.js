const SHELL_CACHE = "memory-match-shell-v3";
const ASSET_CACHE = "memory-match-assets-v3";
const WORKER_STATE_CACHE = 'memory-match-worker-state-v1';
const ACTIVE_SHELL_KEY = './active-shell';
const APP_SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icons/memory-match-icon.svg"];
const MAX_CONCURRENT_ASSET_FETCHES = 6;
const MAX_PENDING_ASSET_FETCHES = 128;
const MAX_CACHED_ASSETS = 512;
const MAX_CACHED_ASSET_BYTES = 64 * 1024 * 1024;
let cachedAssetBytes = null;
let cacheWrites = Promise.resolve();
const inFlightAssetFetches = new Map();
const pendingAssetFetches = [];
let activeAssetFetches = 0;

self.addEventListener("install", (event) => {
  event.waitUntil((async()=>{
    await(await caches.open(SHELL_CACHE)).addAll(APP_SHELL);
    const active=await(await caches.open(WORKER_STATE_CACHE)).match(ACTIVE_SHELL_KEY);
    if(!active)return; // One-time migration from workers without an ownership marker.
    const activeName=await active.text(),names=await caches.keys();
    if(!activeName.startsWith('memory-match-shell-')||!names.includes(activeName))return;
    // Superseded waiting workers no longer own a client. Keep only the active
    // build and this fully cached candidate, even across many releases in one tab.
    await Promise.all(names.filter(name=>name.startsWith('memory-match-shell-')&&name!==activeName&&name!==SHELL_CACHE).map(name=>caches.delete(name)));
  })());
  // An update waits for existing clients to close; never replace a running game.
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async()=>{
    await(await caches.open(WORKER_STATE_CACHE)).put(ACTIVE_SHELL_KEY,new Response(SHELL_CACHE));
    const keys=await caches.keys();
    await Promise.all(keys.filter(key=>key.startsWith('memory-match-')&&![SHELL_CACHE,ASSET_CACHE,WORKER_STATE_CACHE].includes(key)).map(key=>caches.delete(key)));
    await self.clients.claim();
  })());
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

  event.respondWith(serveDocument(event.request));
});

async function cacheFirstAsset(request, event) {
  // These are build-pinned public files. A module's Origin header must not
  // make a precached copy miss on servers that send Vary: Origin.
  const shell = await (await caches.open(SHELL_CACHE)).match(request,{ignoreVary:true});
  if(shell)return shell;
  const cached = await (await caches.open(ASSET_CACHE)).match(request);
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
  if(!inFlightAssetFetches.has(key)&&inFlightAssetFetches.size>=MAX_CONCURRENT_ASSET_FETCHES+MAX_PENDING_ASSET_FETCHES)return Response.error();
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
      await cacheAsset(request,response);
    }
    return response;
  } catch {
    return Response.error();
  }
}

async function cacheAsset(request,response){
  const length=Number(response.headers.get('content-length'));
  if(length>MAX_CACHED_ASSET_BYTES)return;
  const bytes=await response.clone().arrayBuffer();
  if(bytes.byteLength>MAX_CACHED_ASSET_BYTES)return;
  const headers=new Headers(response.headers);headers.set('x-memory-cache-bytes',String(bytes.byteLength));
  const stored=new Response(bytes,{status:response.status,statusText:response.statusText,headers});
  const work=cacheWrites.then(async()=>{
    const cache=await caches.open(ASSET_CACHE);
    if(cachedAssetBytes===null){
      const entries=await Promise.all((await cache.keys()).map(key=>cache.match(key)));
      cachedAssetBytes=entries.reduce((sum,entry)=>sum+Number(entry?.headers.get('x-memory-cache-bytes')||0),0);
    }
    const old=await cache.match(request);
    if(old){cachedAssetBytes-=Number(old.headers.get('x-memory-cache-bytes')||0);await cache.delete(request);}
    await cache.put(request,stored);cachedAssetBytes+=bytes.byteLength;
    const keys=await cache.keys();
    while(keys.length>MAX_CACHED_ASSETS||cachedAssetBytes>MAX_CACHED_ASSET_BYTES){
      const key=keys.shift();if(!key)break;
      const removed=await cache.match(key);await cache.delete(key);
      cachedAssetBytes-=Number(removed?.headers.get('x-memory-cache-bytes')||0);
    }
  });
  cacheWrites=work.catch(error=>{cachedAssetBytes=null;console.warn('Offline asset cache could not be updated',error.name);});
  await cacheWrites;
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
    else if(pendingAssetFetches.length<MAX_PENDING_ASSET_FETCHES)pendingAssetFetches.push(run);
    else resolve(Response.error());
  });
}

async function serveDocument(request) {
  const path=new URL(request.url).pathname;
  // Keep HTML and its complete chunk set on the same build until the waiting
  // worker activates. An online reload must not pair new HTML with an old shell.
  if(request.destination==='document'&&(path.endsWith('/')||path.endsWith('/index.html'))){
    const shell=await(await caches.open(SHELL_CACHE)).match('./index.html',{ignoreVary:true});
    if(shell)return shell;
  }
  try {
    return await fetch(request);
  } catch {
    const shell=await caches.open(SHELL_CACHE);
    const cached = await shell.match(request,{ignoreVary:true});
    return cached || (await shell.match("./index.html",{ignoreVary:true})) || Response.error();
  }
}
