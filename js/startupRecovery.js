const RETRY_KEY = 'memoryMatchStartupRetry';
const RETRY_DELAYS_MS = [1500, 3000];

export function isStartupNetworkError(error) {
  const message = error && typeof error.message === 'string' ? error.message : '';
  return !navigator.onLine || /failed to fetch dynamically imported module|error loading dynamically imported module|importing a module script failed|failed to load module script|unable to preload css for/i.test(message);
}

// Only reload before application initialization; never run initialization twice.
export function createStartupRecovery({ isWaiting, onExhausted, reload = () => window.location.reload() }) {
  const owner = new AbortController();
  let state = 'idle';
  let timer = null;
  window.addEventListener('pagehide', destroy, { once: true, signal: owner.signal });

  function readAttempts() {
    try {
      const attempts = Number(sessionStorage.getItem(RETRY_KEY) || 0);
      return Number.isSafeInteger(attempts) && attempts >= 0 ? attempts : RETRY_DELAYS_MS.length;
    } catch (error) {
      console.warn('[Startup retry storage]', error.name);
      return RETRY_DELAYS_MS.length;
    }
  }
  function attempt() {
    timer = null;
    if (!isWaiting()) { destroy(); return; }
    if (!navigator.onLine) {
      state = 'waiting';
      window.addEventListener('online', scheduleAfterOnline, { once: true, signal: owner.signal });
      return;
    }
    const attempts = readAttempts();
    if (attempts >= RETRY_DELAYS_MS.length) { destroy(); onExhausted(); return; }
    try { sessionStorage.setItem(RETRY_KEY, String(attempts + 1)); }
    catch (error) { console.warn('[Startup retry storage]', error.name); destroy(); onExhausted(); return; }
    destroy(); reload();
  }
  function scheduleAfterOnline() {
    state = 'idle'; schedule();
  }
  function schedule() {
    if (state === 'disposed' || !isWaiting()) return false;
    if (state !== 'idle') return true;
    const attempts = readAttempts();
    if (attempts >= RETRY_DELAYS_MS.length) { destroy(); onExhausted(); return false; }
    state = 'scheduled';
    timer = setTimeout(attempt, RETRY_DELAYS_MS[attempts]);
    return true;
  }
  function reset() {
    try { sessionStorage.removeItem(RETRY_KEY); }
    catch (error) { console.warn('[Startup retry storage]', error.name); }
  }
  function destroy() {
    if (state === 'disposed') return;
    state = 'disposed'; clearTimeout(timer); timer = null; owner.abort();
  }
  return { schedule, reset, destroy };
}
