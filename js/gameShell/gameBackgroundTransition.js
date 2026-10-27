const BASE_PATH = import.meta.env.BASE_URL.endsWith("/")
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`;

const GAME_BACKGROUNDS = Object.freeze({
  "memory-match": Object.freeze({
    landscape: "memory-match.webp",
    portrait: "memory-match-portrait-9x20.webp",
  }),
  "link-connect": Object.freeze({
    landscape: "link-connect.webp",
    portrait: "link-connect-portrait-9x20.webp",
  }),
  "triple-connect": Object.freeze({
    landscape: "triple-connect.webp",
    portrait: "triple-connect-portrait-9x20.webp",
  }),
});

const preloadCache = new Map();
export const BACKGROUND_LOAD_DEADLINE_MS = 8000;
const BACKGROUND_FADE_MS = 220;
let transitionRevision = 0;
let settlePendingTransition = null;

export function preloadGameBackground(gameId) {
  const source = getGameBackgroundSource(gameId);
  return source ? preloadImage(source) : Promise.resolve(false);
}

/** Startup warms the same three sources navigation will use, not both orientations. */
export function preloadGameBackgrounds(signal) {
  return Promise.all(Object.keys(GAME_BACKGROUNDS).map(gameId =>
    preloadImage(getGameBackgroundSource(gameId), signal)));
}

export async function prepareGameBackgroundTransition(gameId) {
  const source = getGameBackgroundSource(gameId);
  if (!source) return "failed";

  const revision = ++transitionRevision;
  const loaded = await preloadImage(source);
  if (revision !== transitionRevision) return "cancelled";
  if (!loaded) return "failed";

  const layer = getTransitionLayer();
  layer.style.backgroundImage = `url("${source}")`;
  layer.classList.remove("is-visible");
  return (await fadeInLayer(layer, revision)) ? "ready" : "cancelled";
}

export function completeGameBackgroundTransition() {
  settlePendingTransition?.(false);
  settlePendingTransition = null;
  getTransitionLayer().classList.remove("is-visible");
}

export function cancelGameBackgroundTransition() {
  transitionRevision += 1;
  settlePendingTransition?.(false);
  settlePendingTransition = null;
  const layer = document.querySelector(".game-background-transition");
  layer?.classList.remove("is-visible");
}

export function getGameBackgroundSource(gameId) {
  const background = GAME_BACKGROUNDS[gameId];
  if (!background) return null;
  const orientation = window.matchMedia("(orientation: portrait)").matches
    ? "portrait"
    : "landscape";
  return `${BASE_PATH}assets/images/backgrounds/${background[orientation]}`;
}

function preloadImage(source, signal) {
  if (signal?.aborted) return Promise.resolve(false);
  if (preloadCache.has(source)) return preloadCache.get(source);
  const result = new Promise((resolve) => {
    const image = new Image();
    let settled = false;
    const finish = loaded => {
      if (settled) return;
      settled = true;
      clearTimeout(deadline);
      image.onload = null;
      image.onerror = null;
      signal?.removeEventListener('abort', abort);
      if (!loaded) image.src = '';
      resolve(loaded);
    };
    const abort = () => finish(false);
    const deadline = setTimeout(abort, BACKGROUND_LOAD_DEADLINE_MS);
    signal?.addEventListener('abort', abort, {once: true});
    image.decoding = "async";
    image.onload = async () => {
      try {
        if (typeof image.decode === "function") await image.decode();
        finish(true);
      } catch {
        finish(false);
      }
    };
    image.onerror = () => finish(false);
    image.src = source;
  });
  preloadCache.set(source, result);
  // A transient failure must not poison later navigation/retry for this source.
  void result.then(loaded => {
    if (!loaded && preloadCache.get(source) === result) preloadCache.delete(source);
  });
  return result;
}

function getTransitionLayer() {
  let layer = document.querySelector(".game-background-transition");
  if (layer) return layer;
  layer = document.createElement("div");
  layer.className = "game-background-transition";
  layer.setAttribute("aria-hidden", "true");
  document.body.prepend(layer);
  return layer;
}

function fadeInLayer(layer, revision) {
  return new Promise((resolve) => {
    const events = new AbortController();
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let animation = null;
    const settle = (completed) => {
      if (settlePendingTransition !== settle) return;
      settlePendingTransition = null;
      events.abort();
      completed = completed && revision === transitionRevision;
      if (completed) layer.classList.add('is-visible');
      if (animation) animation.cancel();
      resolve(completed);
    };
    settlePendingTransition?.(false);
    settlePendingTransition = settle;
    if (revision !== transitionRevision) { settle(false); return; }
    if (motion.matches || typeof layer.animate !== 'function') { settle(true); return; }
    // Native completion does not depend on the browser observing an initial
    // CSS style frame. No forced style flush or double-RAF navigation race.
    animation = layer.animate([{opacity:0},{opacity:1}], {duration:BACKGROUND_FADE_MS,easing:'ease-out',fill:'forwards'});
    void animation.finished.then(() => settle(true), error => {
      if (error.name !== 'AbortError') console.warn('Background fade unavailable', error.name);
      // The decoded image is still usable if its live fade is unavailable.
      // Owner cancellation already cleared settlePendingTransition/revision.
      settle(revision === transitionRevision);
    });
    const options = {signal:events.signal};
    motion.addEventListener('change', event => { if (event.matches) animation.finish(); }, options);
    document.addEventListener('visibilitychange', () => { if (document.hidden) animation.finish(); }, options);
    window.addEventListener('pagehide', () => animation.finish(), options);
    if (document.hidden) animation.finish();
  });
}
