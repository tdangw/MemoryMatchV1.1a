import { AD_CONFIG } from './adConfig.js';
// A local visual preview only; never requests ads or changes consent.
export function createWebBannerController({ render }) {
  let target = null, preview = null, disposed = false;
  function clear() {
    if (!target) return;
    preview.remove();
    render(target, 0);
    target = null;
    preview = null;
  }
  function refresh() {
    if (!target) return;
    // Representative standard banner; native height remains SDK-driven.
    render(target, AD_CONFIG.webBannerHeight);
  }
  return {
    setTarget(slot) {
      if (disposed || target === slot) return;
      clear();
      if (!slot) return;
      target = slot;
      preview = document.createElement('div');
      preview.className = 'menu-ad-preview';
      preview.textContent = 'Quảng cáo';
      target.append(preview);
      refresh();
    },
    refresh,
    async idle() {},
    async dispose() { disposed = true; clear(); },
    diagnostics() { return { phase: target ? 'visible' : 'idle', bannerCount: target ? 1 : 0, listenerCount: 0, disposed }; },
  };
}
