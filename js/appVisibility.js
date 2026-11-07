// One foreground signal for native App events and browser visibility.
let nativeActive = true, observed = null, listening = false, initialization = null;
const pausedAnimations = new Set();
export const isAppActive = () => nativeActive && (typeof document === 'undefined' || !document.hidden);
function publish() {
  const active = isAppActive();
  document.documentElement.classList.toggle('app-in-background', !active);
  if (observed === active) return;
  observed = active;
  if (!active) {
    for (const animation of document.getAnimations()) {
      if (animation.playState === 'running') { animation.pause(); pausedAnimations.add(animation); }
    }
  } else {
    for (const animation of pausedAnimations) {
      if (animation.playState === 'paused' && animation.effect?.target?.isConnected) animation.play();
    }
    pausedAnimations.clear();
  }
  document.dispatchEvent(new Event('appvisibilitychange'));
}
export function initializeAppVisibility(nativeApp = null) {
  if (!listening) {
    listening = true;
    document.addEventListener('visibilitychange', publish);
    publish();
  }
  if (!nativeApp) return Promise.resolve();
  if (initialization) return initialization;
  nativeActive = false; publish();
  initialization = (async () => {
    let revision = 0;
    const handle = await nativeApp.addListener('appStateChange', state => { revision++; nativeActive = state.isActive; publish(); });
    try {
      const before = revision;
      const state = await nativeApp.getState();
      if (before === revision) { nativeActive = state.isActive; publish(); }
    } catch (error) { console.warn('App foreground state unavailable', error.code || error.name); }
    return handle;
  })().catch(error => { initialization = null; throw error; });
  return initialization;
}
