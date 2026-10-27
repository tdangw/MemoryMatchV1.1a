import { mountAmbientBackground, refreshAmbientBackground, suspendAmbientBackground, scheduleAmbientIdle } from '../backgroundEffects.js';
import { getGameBackgroundSource, preloadGameBackground, BACKGROUND_LOAD_DEADLINE_MS } from '../gameShell/gameBackgroundTransition.js';
import { createGameShellLifecycle } from '../gameShell/gameShellLifecycle.js';

const SCROLL_IDLE_MS = 140;
let mapReadiness = null;
const scopeScenes = new WeakMap();

function prepareMapTexture(signal) {
  if (signal.aborted) return Promise.resolve(false);
  if (mapReadiness) return mapReadiness.promise;
  const source = `${import.meta.env.BASE_URL}assets/adventure/moonlit-garden.webp`;
  const entry = { promise: null }; mapReadiness = entry;
  const promise = new Promise(resolve => {
    const image = new Image(); let settled = false;
    const finish = loaded => {
      if (settled) return; settled = true; clearTimeout(deadline);
      signal.removeEventListener('abort', abort);
      image.onload = image.onerror = null; if (!loaded) image.src = '';
      if (!loaded && mapReadiness === entry) mapReadiness = null;
      resolve(loaded);
    };
    const deadline = setTimeout(() => finish(false), BACKGROUND_LOAD_DEADLINE_MS);
    const abort = () => finish(false);
    signal.addEventListener('abort', abort, {once:true});
    image.onload = () => { if (typeof image.decode !== 'function') { finish(false); return; } void image.decode().then(() => finish(true), () => finish(false)); };
    image.onerror = () => finish(false); image.src = source;
  });
  entry.promise = promise;
  return promise;
}

export function mountGameplayAmbient(scope, root, kind) {
  const control = mountAmbientBackground({ scope, root, kind, meteorsVisible: false,
    prepare: async signal => {
      const initialSource = getGameBackgroundSource(kind);
      const [loaded, module] = await Promise.all([preloadGameBackground(kind), import('./scene.js')]);
      if (!loaded || signal.aborted) return null;
      return options => module.createAmbientScene({ document, root, kind, initialSource, prepareSource: () => preloadGameBackground(kind), ...options });
    },
  });
  scopeScenes.set(scope, control); scope.own(() => scopeScenes.delete(scope));
  return control;
}
export function setAmbientPaused(scope, value) { const control = scopeScenes.get(scope); if (control) control.setPaused(value); }

export function mountHomeAmbient(scope, root) {
  return mountAmbientBackground({ scope, root, kind: 'home', static: true, meteorsVisible: false });
}

export function mountMapAmbient(scope, root, trail, scroll, { mapDetails = true } = {}) {
  const binding = createGameShellLifecycle();
  const releaseParent = scope.own(() => binding.dispose());
  binding.own(() => releaseParent.forget());
  let resumeScroll = null, cancelIdle = null;
  function endScroll() {
    if (cancelIdle) cancelIdle(); cancelIdle = null;
    const resume = resumeScroll; resumeScroll = null;
    if (resume) resume();
    if (resume && scope.active) refreshAmbientBackground(scope);
  }
  const control = mountAmbientBackground({ scope, root, kind: 'map', onInactive: endScroll, onDispose: () => binding.dispose(), bindingListeners: 2,
    prepare: async signal => {
      const [loaded, module] = await Promise.all([prepareMapTexture(signal), import('./scene.js')]);
      if (!loaded || signal.aborted) return null;
      return options => module.createAmbientScene({ document, kind: 'map', root, trail, scroll, initialSource: '', mapDetails, ...options });
    },
  });
  binding.listen(scroll, 'scroll', () => {
    if (!resumeScroll) resumeScroll = suspendAmbientBackground();
    if (!('onscrollend' in scroll)) cancelIdle = scheduleAmbientIdle(endScroll, SCROLL_IDLE_MS);
  }, { passive: true });
  binding.listen(scroll, 'scrollend', endScroll);
  binding.own(endScroll);
  return control;
}
