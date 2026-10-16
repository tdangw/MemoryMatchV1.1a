import { isAndroidAdsPlatform } from './platform.js';
import { AD_CONFIG } from './adConfig.js';
import { createAdService } from './adService.js';
import { createBannerController } from './bannerController.js';
import { createWebBannerController } from './webBannerController.js';
import { createGameShellLifecycle } from '../gameShell/gameShellLifecycle.js';

let target = null, runtime = null, starting = null;
const blockers = new Set();
const privacyListeners = new Set();
export function setMenuAdTarget(slot) { target = slot; runtime?.reconcile(); }
export function clearMenuAdTarget(slot) { if (target === slot) setMenuAdTarget(null); }
export function suspendMenuAds(reason) {
  blockers.add(reason); runtime?.reconcile();
  let released = false;
  return () => { if (released) return; released = true; blockers.delete(reason); runtime?.reconcile(); };
}
export function subscribeAdPrivacy(listener) {
  privacyListeners.add(listener);
  listener(runtime?.service.snapshot() || { supported: false, privacyRequired: false });
  return () => privacyListeners.delete(listener);
}
export async function openAdPrivacyOptions() {
  if (!runtime) return false;
  const resume = suspendMenuAds('privacy-options');
  await runtime.controller.idle();
  try { return await runtime.service.showPrivacyOptions(); }
  finally { resume(); }
}

export function initializeMenuAds() {
  if (runtime) return Promise.resolve(runtime);
  if (starting) return starting;
  starting = start().catch(error => { console.warn('Menu advertisements unavailable', error); return null; })
    .finally(() => { starting = null; });
  return starting;
}

async function start() {
  const { nativeAds, nativeApp } = isAndroidAdsPlatform ? await import('./nativeAdapter.js') : {};
  const scope = createGameShellLifecycle();
  const service = createAdService({ native: nativeAds, supported: isAndroidAdsPlatform });
  const render = (slot, height) => {
    if (slot.isConnected) {
      slot.dataset.nativeAd = height > 0 ? 'visible' : 'empty';
      slot.style.setProperty('--ad-banner-height', `${height}px`);
      slot.style.setProperty('--ad-banner-gap', `${height > 0 ? AD_CONFIG.interactionGap : 0}px`);
      slot.closest('.adventure-page').style.setProperty('--menu-ad-space', `${height > 0 ? height + AD_CONFIG.interactionGap : 0}px`);
    }
  };
  const controller = isAndroidAdsPlatform ? createBannerController({ service, render }) : createWebBannerController({ render });
  let active = !isAndroidAdsPlatform, nativeRevision = 0, lastTarget = null;
  function textEntry() {
    return document.activeElement?.matches('input:not([type="range"]):not([type="checkbox"]):not([type="radio"]), textarea, select, [contenteditable="true"]');
  }
  function reconcile() {
    const wanted = active && document.visibilityState !== 'hidden' && !blockers.size && !textEntry() && target?.isConnected ? target : null;
    if (wanted === lastTarget) return;
    controller.setTarget(wanted);
    lastTarget = wanted;
  }
  if (isAndroidAdsPlatform) {
    const handle = await nativeApp.addListener('appStateChange', state => { nativeRevision++; active = state.isActive; reconcile(); });
    scope.own(() => { void handle.remove().catch(error => console.warn('AdMob foreground listener cleanup failed', error)); });
    try {
      const before = nativeRevision;
      const state = await nativeApp.getState();
      if (before === nativeRevision) active = state.isActive;
    } catch (error) {
      console.warn('AdMob foreground state unavailable', error);
      // Fail closed until an actual foreground event arrives.
    }
  }
  scope.listen(document, 'visibilitychange', reconcile);
  scope.listen(document, 'focusin', reconcile);
  scope.listen(document, 'focusout', () => { queueMicrotask(() => { if (scope.active) reconcile(); }); });
  scope.listen(window, 'online', () => { if (lastTarget) void controller.refresh(); else reconcile(); });
  let width = window.innerWidth;
  scope.listen(window, 'resize', () => {
    if (width === window.innerWidth) return;
    width = window.innerWidth;
    if (lastTarget) void controller.refresh();
  });
  scope.own(service.subscribe(state => { for (const listener of privacyListeners) listener(state); }));
  runtime = { service, controller, reconcile, async dispose() {
    scope.dispose();
    await controller.dispose();
    runtime = null;
  } };
  scope.listen(window, 'pagehide', () => { active = false; reconcile(); });
  scope.listen(window, 'pageshow', () => {
    if (!isAndroidAdsPlatform) { active = true; reconcile(); return; }
    const before = nativeRevision;
    void nativeApp.getState().then(state => {
      if (scope.active && before === nativeRevision) { active = state.isActive; reconcile(); }
    }).catch(error => console.warn('AdMob foreground recovery unavailable', error));
  });
  reconcile();
  return runtime;
}
