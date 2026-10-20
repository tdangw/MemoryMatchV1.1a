import { gameState } from './gameState.js';
import { saveSetting } from './persistence.js';
import { canLaunchGame } from './profileOperations.js';
import { createUiSkinController, normalizeUiSkin } from './uiSkinController.js';
import { UI_SKIN_ASSETS } from './uiSkinManifest.js';

const base = `${import.meta.env.BASE_URL}assets/ui/woodland/`;
const decoded = new Map();
let rewardLoad = null, rewardAbort = null, revision = 0;
let currentSkin = 'default';

function decodeAsset(id, signal) {
  if (signal.aborted) return Promise.reject(new DOMException('Cancelled', 'AbortError'));
  if (decoded.has(id)) return Promise.resolve();
  const asset = UI_SKIN_ASSETS.assets[id];
  return new Promise((resolve, reject) => {
    const image = new Image(); let settled = false;
    const clean = () => { image.onload = null; image.onerror = null; signal.removeEventListener('abort', abort); };
    const fail = error => { if (settled) return; settled = true; clean(); image.src = ''; reject(error); };
    const abort = () => fail(new DOMException('Cancelled', 'AbortError'));
    signal.addEventListener('abort', abort, { once: true });
    image.onerror = () => fail(new Error(`skin-image-failed:${id}`));
    image.onload = async () => {
      try {
        await image.decode();
        if (settled) return;
        if (image.naturalWidth !== asset.width || image.naturalHeight !== asset.height) throw new Error(`skin-image-size:${id}`);
        settled = true; clean(); decoded.set(id, image); resolve();
      } catch (error) { fail(error); }
    };
    image.src = new URL(asset.file, new URL(base, location.href)).href;
  });
}

async function loadBundle(bundle, signal) {
  const ids = UI_SKIN_ASSETS.bundles[bundle]; let index = 0;
  // Bound simultaneous image decode work, especially on mobile.
  await Promise.all(Array.from({ length: 4 }, async () => {
    while (index < ids.length && !signal.aborted) await decodeAsset(ids[index++], signal);
    if (signal.aborted) throw new DOMException('Cancelled', 'AbortError');
  }));
}

function clearRewards() {
  revision++; rewardAbort?.abort(); rewardAbort = null; rewardLoad = null;
  delete document.documentElement.dataset.uiRewards;
}

export function ensureUiSkinRewards() {
  if (currentSkin !== 'woodland') return Promise.resolve(false);
  if (rewardLoad) return rewardLoad;
  const token = revision, owner = gameState.settings, abort = new AbortController(); rewardAbort = abort;
  rewardLoad = loadBundle('rewards', abort.signal).then(() => {
    if (token !== revision || owner !== gameState.settings || currentSkin !== 'woodland') return false;
    document.documentElement.dataset.uiRewards = 'ready'; return true;
  }).catch(error => {
    abort.abort();
    if (error.name !== 'AbortError') console.warn('Reward skin unavailable', error.message);
    if (token === revision) rewardLoad = null;
    return false;
  });
  return rewardLoad;
}

const controller = createUiSkinController({
  captureOwner: () => gameState.settings,
  load: async (skin, signal) => {
    if (skin === 'default') return;
    await loadBundle('core', signal);
  },
  save: skin => gameState.settings.uiSkin === skin ? Promise.resolve(true) : saveSetting('uiSkin', skin),
  committed: skin => { gameState.settings.uiSkin = skin; },
  apply: skin => {
    clearRewards(); currentSkin = skin;
    document.documentElement.dataset.uiSkin = skin;
    if (skin === 'default') decoded.clear();
    else if (document.querySelector('.treasure-art, #level-summary-modal')) void ensureUiSkinRewards();
  },
});

export function getUiSkin() { return currentSkin; }
export async function selectUiSkin(value) {
  if (!canLaunchGame()) return { status: 'error', error: new Error('profile-changing') };
  const result = await controller.select(value);
  if (result.status === 'error' && currentSkin === 'default') decoded.clear();
  return result;
}
export async function restoreUiSkin() {
  clearRewards();
  const target = normalizeUiSkin(gameState.settings.uiSkin);
  const result = await controller.select(target, { persist: false });
  if (result.status === 'error') {
    // Keep the saved preference for retry, but show a complete default surface.
    currentSkin = 'default'; document.documentElement.dataset.uiSkin = 'default'; decoded.clear();
    console.warn('Skin unavailable; using default', result.error.message);
  }
  return result;
}

export function getUiSkinDiagnostics() {
  return { skin: currentSkin, decodedImages: decoded.size,
    decodedBytes: [...decoded.values()].reduce((sum, image) => sum + image.naturalWidth * image.naturalHeight * 4, 0) };
}
