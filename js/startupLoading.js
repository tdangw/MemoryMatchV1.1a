const PHASES = ['modules', 'save', 'interface', 'home'];
const SLOW_START_MS = 15000;
const EXIT_MS = 180;

// One document boot owns this presentation; it never mounts on game navigation.
export function createStartupLoading({ onSlow = () => {}, onRetry = () => window.location.reload() } = {}) {
  const root = document.getElementById('app-loading');
  if (!root) throw new Error('Missing startup presentation');
  root.dataset.controlled = 'true';
  const progress = root.querySelector('[role="progressbar"]');
  const message = root.querySelector('[data-loading-message]');
  const percentage = root.querySelector('[data-loading-percent]');
  const retry = root.querySelector('[data-loading-retry]');
  const owner = new AbortController();
  let state = 'loading';
  let completed = 0;
  let home = null;
  let exitPromise = null;
  const syncVisibility = () => {
    root.toggleAttribute('data-background', document.hidden);
    if (document.hidden && state === 'exiting') destroy();
  };
  document.addEventListener('visibilitychange', syncVisibility, {signal:owner.signal});
  window.addEventListener('pagehide', destroy, {once:true, signal:owner.signal});
  syncVisibility();
  root.tabIndex = -1;
  root.focus({preventScroll: true});
  let slowStart = null;
  function watchSlowStart() {
    clearTimeout(slowStart);
    slowStart = setTimeout(() => {
      if (state !== 'loading') return;
      state = 'slow';
      root.dataset.slow = 'true';
      message.textContent = 'Mã lỗi: ST-LOAD-002';
      retry.hidden = false;
      onSlow();
    }, SLOW_START_MS);
  }
  watchSlowStart();
  retry.addEventListener('click', onRetry, {signal: owner.signal});

  function complete(phase) {
    if (state === 'disposed' || state === 'failed') return;
    const next = PHASES.indexOf(phase) + 1;
    if (next <= completed) return;
    if (next !== completed + 1) throw new Error('Startup phases out of order');
    completed = next;
    const percent = Math.round(completed / PHASES.length * 100);
    progress.setAttribute('aria-valuenow', String(percent));
    progress.setAttribute('aria-valuetext', `${percent}%`);
    percentage.textContent = `${percent}%`;
    progress.style.setProperty('--startup-progress', String(completed / PHASES.length));
    if (completed === PHASES.length) root.dataset.complete = 'true';
    if (state === 'slow') { state = 'loading'; root.removeAttribute('data-slow'); message.textContent = 'Đang tải…'; retry.hidden = true; }
    if (completed < PHASES.length) watchSlowStart();
    else clearTimeout(slowStart);
  }
  function destroy() {
    if (state === 'disposed') return;
    state = 'disposed';
    clearTimeout(slowStart);
    owner.abort();
    retry.onclick = null;
    if (home) home.inert = false;
    const restoreFocus = root.contains(document.activeElement);
    root.remove();
    if (restoreFocus && !document.hidden) home?.querySelector('.game-selector__choice[tabindex="0"]')?.focus({preventScroll: true});
  }
  function fail(code = 'ST-INIT-001') {
    if (state === 'disposed') return;
    state = 'failed';
    clearTimeout(slowStart);
    owner.abort();
    // Keep a working retry after releasing any pending resource listeners.
    retry.onclick = onRetry;
    progress.hidden = true;
    message.textContent = `Mã lỗi: ${code}`;
    retry.hidden = false;
  }
  function prepareHome() {
    home = document.querySelector('.game-selector');
    if (!home) throw new Error('Home was not mounted');
    home.inert = true;
  }
  function finish() {
    if (state === 'disposed') return Promise.resolve();
    if (exitPromise) return exitPromise;
    clearTimeout(slowStart);
    if (document.hidden || matchMedia('(prefers-reduced-motion: reduce)').matches || typeof root.animate !== 'function') {
      destroy(); return Promise.resolve();
    }
    state = 'exiting';
    exitPromise = new Promise(resolve => {
      const animation = root.animate([{opacity:1}, {opacity:0}], {duration:EXIT_MS, easing:'ease-out', fill:'forwards'});
      owner.signal.addEventListener('abort', () => {animation.cancel(); resolve();}, {once:true});
      animation.finished.then(() => {destroy(); resolve();}, () => {destroy(); resolve();});
    });
    return exitPromise;
  }
  return {complete, prepareHome, finish, destroy, fail};
}
