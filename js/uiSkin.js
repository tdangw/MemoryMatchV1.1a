import { gameState } from './gameState.js';
import { saveSetting } from './persistence.js';
import { canLaunchGame } from './profileOperations.js';
import { createUiSkinController, normalizeUiSkin } from './uiSkinController.js';
import { getUiSkinPack, uiSkinAssetUrl } from './uiSkinRegistry.js';
import { decorateTreasureSkin, clearTreasureSkins } from './progression/treasureSkin.js';

const decoded = new Map();
let rewardLoad = null, rewardAbort = null, revision = 0;
let currentSkin = 'default';
let selectionRevision = 0;

function retainSkins(...skins) {
  const keep = new Set(skins);
  for (const key of decoded.keys()) if (!keep.has(key.split('/')[0])) decoded.delete(key);
}

function decodeAsset(skin, id, signal) {
  if (signal.aborted) return Promise.reject(new DOMException('Cancelled', 'AbortError'));
  const key = `${skin}/${id}`;
  if (decoded.has(key)) return Promise.resolve();
  const asset = getUiSkinPack(skin).assets[id];
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
        settled = true; clean(); decoded.set(key, image); resolve();
      } catch (error) { fail(error); }
    };
    image.src = uiSkinAssetUrl(skin, id);
  });
}

async function loadBundle(skin, bundle, signal) {
  const ids = getUiSkinPack(skin).bundles[bundle]; let index = 0;
  // Bound simultaneous image decode work, especially on mobile.
  await Promise.all(Array.from({ length: 4 }, async () => {
    while (index < ids.length && !signal.aborted) await decodeAsset(skin, ids[index++], signal);
    if (signal.aborted) throw new DOMException('Cancelled', 'AbortError');
  }));
}

function clearRewards() {
  revision++; rewardAbort?.abort(); rewardAbort = null; rewardLoad = null;
  delete document.documentElement.dataset.uiRewards;
  clearTreasureSkins();
}

export function ensureUiSkinRewards({ tutorial = false } = {}) {
  const pack = getUiSkinPack(currentSkin);
  if (!pack || tutorial && !pack.palette || controller.busy) return Promise.resolve(false);
  if (rewardLoad) return rewardLoad;
  const token = revision, skin = currentSkin, owner = gameState.settings, abort = new AbortController(); rewardAbort = abort;
  rewardLoad = loadBundle(skin, 'rewards', abort.signal).then(() => {
    if (token !== revision || owner !== gameState.settings || currentSkin !== skin) return false;
    document.documentElement.dataset.uiRewards = 'ready';
    document.querySelectorAll('.treasure-art').forEach(decorateTreasureSkin);
    return true;
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
    clearRewards(); retainSkins(currentSkin, skin);
    if (skin === 'default') return;
    await loadBundle(skin, 'core', signal);
  },
  save: skin => canLaunchGame() ? saveSetting('uiSkin', skin) : Promise.resolve(false),
  committed: skin => { gameState.settings.uiSkin = skin; },
  apply: skin => {
    clearRewards(); currentSkin = skin;
    document.documentElement.dataset.uiSkin = skin;
    retainSkins(skin);
  },
});

export function getUiSkin() { return currentSkin; }
function restoreVisibleRewards() {
  if (document.querySelector('.treasure-art, #level-summary-modal, .mastery-collection')) void ensureUiSkinRewards();
  else if (document.querySelector('#practice-modal')) void ensureUiSkinRewards({ tutorial: true });
}
export async function selectUiSkin(value) {
  if (!canLaunchGame()) return { status: 'error', error: new Error('profile-changing') };
  // A RAM equality check is safe only before a new request and with no pending
  // durable commit. A superseded save may already be writing a different skin.
  if (!controller.busy && normalizeUiSkin(value) === currentSkin && gameState.settings.uiSkin === currentSkin) {
    restoreVisibleRewards();
    return { status: 'applied', skin: currentSkin };
  }
  const token = ++selectionRevision;
  const result = await controller.select(value);
  if (token === selectionRevision) { retainSkins(currentSkin); restoreVisibleRewards(); }
  return result;
}
export async function restoreUiSkin() {
  const token = ++selectionRevision;
  clearRewards();
  const target = normalizeUiSkin(gameState.settings.uiSkin);
  const result = await controller.select(target, { persist: false });
  if (result.status === 'error') {
    // Keep the saved preference for retry, but show a complete default surface.
    currentSkin = 'default'; document.documentElement.dataset.uiSkin = 'default'; decoded.clear();
    console.warn('Skin unavailable; using default', result.error.message);
  }
  if (token === selectionRevision) { retainSkins(currentSkin); restoreVisibleRewards(); }
  return result;
}

export function getUiSkinDiagnostics() {
  return { skin: currentSkin, decodedImages: decoded.size,
    decodedBytes: [...decoded.values()].reduce((sum, image) => sum + image.naturalWidth * image.naturalHeight * 4, 0),
    retainedSkins: [...new Set([...decoded.keys()].map(key => key.split('/')[0]))] };
}
