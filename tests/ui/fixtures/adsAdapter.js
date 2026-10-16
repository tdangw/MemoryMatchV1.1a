// Browser-only native boundary; routed by ads-banner.spec.js, never bundled.
const listeners = new Map();
let appListener = null;
const state = window.__adsTest = {
  calls: [], count: 0, maximum: 0, active: true,
  emit(name, value) { for (const [callback, event] of listeners) if (event === name) callback(value); },
  foreground(value) { state.active = value; appListener({ isActive: value }); },
  listenerCount: () => listeners.size,
};
export const nativeAds = {
  async requestConsentInfo(options) {
    state.calls.push(['consent', options]);
    return { status: 'NOT_REQUIRED', canRequestAds: true, privacyOptionsRequirementStatus: 'REQUIRED' };
  },
  async initialize(options) { state.calls.push(['initialize', options]); },
  async showConsentForm() { throw new Error('Unexpected form in fixture'); },
  async showPrivacyOptionsForm() { state.calls.push(['privacy']); },
  async addListener(name, callback) {
    listeners.set(callback, name);
    return { async remove() { listeners.delete(callback); } };
  },
  async showBanner(options) {
    state.calls.push(['show', options]);
    state.count++; state.maximum = Math.max(state.maximum, state.count);
    if (window.__adsScenario === 'no-fill') {
      state.emit('bannerAdFailedToLoad', { code: 3 });
      return;
    }
    const overlay = document.createElement('aside');
    overlay.dataset.fakeNativeBanner = '';
    overlay.textContent = 'Quảng cáo';
    overlay.style.cssText = 'position:fixed;inset:auto 0 0;height:60px;background:#eee;color:#111;z-index:999999;text-align:center;font:12px/60px sans-serif';
    document.body.append(overlay);
    state.emit('bannerAdSizeChanged', { height: 60, width: innerWidth });
  },
  async removeBanner() {
    state.calls.push(['remove']);
    state.count = 0;
    document.querySelectorAll('[data-fake-native-banner]').forEach(node => node.remove());
    state.emit('bannerAdSizeChanged', { height: 0 });
  },
};
export const nativeApp = {
  async addListener(name, callback) { appListener = callback; return { async remove() { appListener = null; } }; },
  async getState() { return { isActive: state.active }; },
};
