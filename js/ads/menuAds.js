import { isAndroidAdsPlatform } from './platform.js';
import { AD_CONFIG } from './adConfig.js';
import { createAdService } from './adService.js';
import { createBannerController } from './bannerController.js';
import { createWebBannerController } from './webBannerController.js';
import { createGameShellLifecycle, clearShellTimeout } from '../gameShell/gameShellLifecycle.js';
import { suspendAmbientBackground } from '../backgroundEffects.js';
import { initializeAppVisibility, isAppActive } from '../appVisibility.js';
import { pauseGameAudio, syncDefaultMusic, isBackgroundMusicPlaying } from '../sound.js';
import { gameState } from '../gameState.js';

let target = null, runtime = null, starting = null;
const blockers = new Set();
const privacyListeners = new Set();
export function setMenuAdTarget(slot) { target = slot; runtime?.reconcile(); }
export function clearMenuAdTarget(slot) { if (target === slot) setMenuAdTarget(null); }
export function prepareLevelTransitionAd(isCurrent) {
  if (isAndroidAdsPlatform && isAppActive()) void initializeMenuAds().then(value => {
    if (value && isCurrent() && isAppActive()) value.service.completedLevel();
  });
}
export async function presentLevelTransitionAd(isCurrent) {
  if (!isAndroidAdsPlatform || !runtime || !isCurrent() || !isAppActive()) return;
  const resume = suspendMenuAds('level-transition');
  try {
    await runtime.controller.idle();
    await runtime.service.showInterstitialIfReady(() => isCurrent() && isAppActive());
  } finally { resume(); }
}
export function mountGameplayBanner(root, scope) {
  const slot = document.createElement('div');
  slot.className = 'adventure-ad-slot gameplay-ad-slot';
  slot.setAttribute('aria-hidden', 'true');
  root.dataset.gameplayAd = 'true';
  root.style.setProperty('--shell-ad-space', isAndroidAdsPlatform ? '0px' : `${AD_CONFIG.webBannerHeight + AD_CONFIG.interactionGap}px`);
  root.append(slot);
  setMenuAdTarget(slot);
  scope.own(() => {
    clearMenuAdTarget(slot);
    slot.remove();
    delete root.dataset.gameplayAd;
    root.style.removeProperty('--shell-ad-space');
  }, 'node');
}
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
  let retryTimer = null, retryCount = 0;
  function cancelRetry() { if (retryTimer !== null) clearShellTimeout(retryTimer); retryTimer = null; }
  function retryUnavailable() {
    if (!scope.active || !isAppActive() || !lastTarget || retryTimer !== null || retryCount >= AD_CONFIG.maxRetries) return;
    retryCount++;
    retryTimer = scope.timeout(() => {
      retryTimer = null;
      if (isAppActive() && !blockers.size && lastTarget?.isConnected) void controller.refresh();
    }, AD_CONFIG.retryDelayMs * retryCount);
  }
  const service = createAdService({ native: nativeAds, supported: isAndroidAdsPlatform, suspendPresentation: () => {
    const resumeBackground = suspendAmbientBackground();
    const resumeMusic = isBackgroundMusicPlaying();
    pauseGameAudio();
    return () => { resumeBackground(); if (resumeMusic && isAppActive()) syncDefaultMusic(gameState.settings); };
  } });
  const render = (slot, height) => {
    if (height > 0) cancelRetry();
    if (slot.isConnected) {
      slot.dataset.nativeAd = height > 0 ? 'visible' : 'empty';
      slot.style.setProperty('--ad-banner-height', `${height}px`);
      slot.style.setProperty('--ad-banner-gap', `${height > 0 ? AD_CONFIG.interactionGap : 0}px`);
      slot.closest('.adventure-page, .game-shell-root').style.setProperty('--menu-ad-space', `${height > 0 ? height + AD_CONFIG.interactionGap : 0}px`);
      if (slot.classList.contains('gameplay-ad-slot')) {
        slot.closest('.game-shell-root').style.setProperty('--shell-ad-space', `${height > 0 ? height + AD_CONFIG.interactionGap : 0}px`);
      }
    }
  };
  const controller = isAndroidAdsPlatform ? createBannerController({ service, render, onUnavailable: retryUnavailable }) : createWebBannerController({ render });
  let active = isAppActive(), lastTarget = null;
  let releaseNativeBackground = null;
  function setNativeForeground(value) {
    active = value;
    if (active) { if (releaseNativeBackground) releaseNativeBackground(); releaseNativeBackground = null; }
    else if (!releaseNativeBackground) releaseNativeBackground = suspendAmbientBackground();
  }
  scope.own(() => { if (releaseNativeBackground) releaseNativeBackground(); });
  function textEntry() {
    return document.activeElement?.matches('input:not([type="range"]):not([type="checkbox"]):not([type="radio"]), textarea, select, [contenteditable="true"]');
  }
  function reconcile() {
    const wanted = active && isAppActive() && !blockers.size && !textEntry() && target?.isConnected ? target : null;
    if (wanted === lastTarget) return;
    cancelRetry(); retryCount = 0;
    controller.setTarget(wanted);
    lastTarget = wanted;
  }
  await initializeAppVisibility(isAndroidAdsPlatform ? nativeApp : null);
  setNativeForeground(isAppActive());
  scope.listen(document, 'appvisibilitychange', () => { setNativeForeground(isAppActive()); reconcile(); });
  scope.listen(document, 'focusin', reconcile);
  scope.listen(document, 'focusout', () => { queueMicrotask(() => { if (scope.active) reconcile(); }); });
  scope.listen(window, 'online', () => { cancelRetry(); retryCount = 0; if (lastTarget) void controller.refresh(); else reconcile(); });
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
  scope.listen(window, 'pagehide', () => { if (isAndroidAdsPlatform) setNativeForeground(false); else active = false; reconcile(); });
  scope.listen(window, 'pageshow', () => {
    setNativeForeground(isAppActive()); reconcile();
  });
  reconcile();
  return runtime;
}
