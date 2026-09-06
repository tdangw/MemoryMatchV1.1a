import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const cacheStores = new Map([
  ["memory-match-shell-v1", new Map([["./index.html", new Response("old")]])],
  ["memory-match-assets-v1", new Map()],
]);
const handlers = {};
let offline = true;
let networkRequests = 0;
const caches = {
  async open(name) {
    if (!cacheStores.has(name)) cacheStores.set(name, new Map());
    const store = cacheStores.get(name);
    return {
      async addAll(urls) {
        urls.forEach((url) => store.set(String(url), new Response(`shell:${url}`)));
      },
      async put(request, response) {
        store.set(String(request.url || request), response);
      },
    };
  },
  async keys() {
    return [...cacheStores.keys()];
  },
  async delete(name) {
    return cacheStores.delete(name);
  },
  async match(request) {
    const key = String(request.url || request);
    for (const store of cacheStores.values()) {
      if (store.has(key)) return store.get(key).clone();
    }
    return undefined;
  },
};
const self = {
  location: new URL("https://example.test/"),
  clients: { claim: async () => {} },
  skipWaiting() {},
  addEventListener(type, listener) {
    handlers[type] = listener;
  },
};
const source = await readFile(new URL("../public/sw.js", import.meta.url), "utf8");
vm.runInNewContext(source, {
  self,
  caches,
  fetch: async () => {
    networkRequests += 1;
    if (offline) throw new Error("offline");
    return new Response("asset", { status: 200 });
  },
  URL,
  Response,
  Promise,
});

let pending;
handlers.install({ waitUntil(value) { pending = value; } });
await pending;
assert.equal(cacheStores.has("memory-match-shell-v2"), true);

handlers.activate({ waitUntil(value) { pending = value; } });
await pending;
assert.equal(cacheStores.has("memory-match-shell-v1"), false);
assert.equal(cacheStores.has("memory-match-assets-v1"), false);
assert.equal(cacheStores.has("memory-match-shell-v2"), true);

let responsePromise;
handlers.fetch({
  request: {
    method: "GET",
    url: "https://example.test/deep-link",
    destination: "document",
    headers: new Headers(),
  },
  respondWith(value) { responsePromise = value; },
});
const offlineDocument = await responsePromise;
assert.equal(await offlineDocument.text(), "shell:./index.html");

offline = false;
networkRequests = 0;
const assetRequest = {
  method: "GET",
  url: "https://example.test/assets/card.webp",
  destination: "image",
  headers: new Headers(),
};
const assetResponses = [];
for (let index = 0; index < 2; index += 1) {
  handlers.fetch({
    request: assetRequest,
    respondWith(value) { assetResponses.push(value); },
    waitUntil() {},
  });
}
await Promise.all(assetResponses);
assert.equal(networkRequests, 1, "Hai thẻ cùng ảnh không được tạo hai yêu cầu mạng đồng thời.");

console.log("PWA offline upgrade checks passed.");
