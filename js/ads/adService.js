import { AD_CONFIG, AD_PRIVACY, validateAdConfig } from './adConfig.js';
import { presentRewarded } from './rewardedController.js';
import { createInterstitialController } from './interstitialController.js';

export function createAdService({ native, supported, config = AD_CONFIG, report = console.warn, suspendPresentation = () => () => {} }) {
  validateAdConfig(config);
  let consent = null;
  let initialized = false;
  let pending = null;
  let fullscreen = false;
  async function present(callback) {
    if (fullscreen) throw new Error('Advertisement already presenting');
    fullscreen = true;
    let release;
    try { release = suspendPresentation(); return await callback(); }
    finally { fullscreen = false; release?.(); }
  }
  const listeners = new Set();
  function snapshot() {
    return { supported, canRequestAds: consent?.canRequestAds === true,
      privacyRequired: consent?.privacyOptionsRequirementStatus === 'REQUIRED' };
  }
  function update(info) {
    consent = info;
    for (const listener of listeners) listener(snapshot());
  }
  async function refreshConsent() {
    let info = await native.requestConsentInfo(AD_PRIVACY.consent);
    if (info.status === 'REQUIRED' && info.isConsentFormAvailable) {
      const release = suspendPresentation();
      try { info = await native.showConsentForm(); } finally { release(); }
    }
    update(info);
    return info.canRequestAds === true;
  }
  const service = {
    supported,
    snapshot,
    subscribe(listener) { listeners.add(listener); listener(snapshot()); return () => listeners.delete(listener); },
    prepare() {
      if (!supported) return Promise.resolve(false);
      if (pending) return pending;
      if (initialized && consent?.canRequestAds) return Promise.resolve(true);
      pending = (async () => {
        try {
          if (!await refreshConsent()) return false;
          if (!initialized) { await native.initialize(AD_PRIVACY.initialization); initialized = true; }
          return true;
        } catch (error) {
          update(null);
          report('AdMob initialization unavailable', error);
          return false;
        } finally { pending = null; }
      })();
      return pending;
    },
    async showPrivacyOptions() {
      if (!supported || !snapshot().privacyRequired) return false;
      const release = suspendPresentation();
      try {
        await native.showPrivacyOptionsForm();
        await refreshConsent();
        return true;
      } catch (error) {
        // An uncertain consent state must not authorize another ad request.
        update(null);
        report('AdMob privacy options unavailable', error);
        return false;
      } finally { release(); }
    },
    listen(event, listener) { return native.addListener(event, listener); },
    show() {
      if (!supported || !initialized || !snapshot().canRequestAds) throw new Error('AdMob not ready');
      return native.showBanner({ adId: config.bannerId, adSize: 'ADAPTIVE_BANNER', position: 'BOTTOM_CENTER', margin: 0, npa: true });
    },
    remove() { return native.removeBanner(); },
    async showRewarded(options, onEarned, isCurrent) {
      if (!supported || !initialized || !snapshot().canRequestAds) throw new Error('AdMob not ready');
      return present(() => presentRewarded(native, options, onEarned, isCurrent));
    },
  };
  const interstitial = supported ? createInterstitialController({ native, config, report,
    prepare: () => service.prepare(), present }) : null;
  service.completedLevel = () => interstitial?.completedLevel();
  service.showInterstitialIfReady = isCurrent => interstitial ? interstitial.showIfReady(isCurrent) : Promise.resolve(false);
  return service;
}
