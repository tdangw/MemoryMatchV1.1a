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
let transitionRevision = 0;
let settlePendingTransition = null;

export function preloadGameBackground(gameId) {
  const source = getGameBackgroundSource(gameId);
  return source ? preloadImage(source) : Promise.resolve(false);
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

function getGameBackgroundSource(gameId) {
  const background = GAME_BACKGROUNDS[gameId];
  if (!background) return null;
  const orientation = window.matchMedia("(orientation: portrait)").matches
    ? "portrait"
    : "landscape";
  return `${BASE_PATH}assets/images/backgrounds/${background[orientation]}`;
}

function preloadImage(source) {
  if (preloadCache.has(source)) return preloadCache.get(source);
  const result = new Promise((resolve) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = async () => {
      try {
        if (typeof image.decode === "function") await image.decode();
        resolve(true);
      } catch {
        resolve(false);
      }
    };
    image.onerror = () => resolve(false);
    image.src = source;
  });
  preloadCache.set(source, result);
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
    const settle = (completed) => {
      if (settlePendingTransition !== settle) return;
      settlePendingTransition = null;
      layer.removeEventListener("transitionend", onTransitionEnd);
      resolve(completed);
    };
    const onTransitionEnd = (event) => {
      if (event.target === layer && event.propertyName === "opacity") settle(true);
    };
    settlePendingTransition?.(false);
    settlePendingTransition = settle;
    layer.addEventListener("transitionend", onTransitionEnd);
    requestAnimationFrame(() => {
      if (revision !== transitionRevision) {
        settle(false);
        return;
      }
      layer.classList.add("is-visible");
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) settle(true);
    });
  });
}
