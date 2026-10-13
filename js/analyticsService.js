import { isSupported, getAnalytics, logEvent, setUserId } from 'firebase/analytics';
import { getFirebaseBackend } from './firebaseBackend.js';
import { getAccountService } from './accountService.js';
import { subscribeToPlaySegments } from './playMetrics.js';
import { createGameShellLifecycle } from './gameShell/gameShellLifecycle.js';
export function shouldEnableAnalytics(environment, emulator, env = {}) {
  return environment === 'production' && !emulator && env.VITE_FIREBASE_ANALYTICS_DISABLED !== '1';
}
export async function initializeAnalytics() {
  const backend = await getFirebaseBackend();
  if (!backend || !shouldEnableAnalytics(backend.environment, backend.emulator, import.meta.env || {}) || !await isSupported()) return null;
  const analytics = getAnalytics(backend.app);
  const scope = createGameShellLifecycle();
  const remainder = new Map();
  const waiting = [];
  let uid = null;
  scope.own(getAccountService().subscribe(() => {
    uid = getAccountService().getIdentity()?.uid || null;
    setUserId(analytics, uid);
    if (uid) for (const segment of waiting.splice(0)) record(segment);
  }), 'listener');
  function record(segment) {
    const identity = getAccountService().getIdentity();
    if (!identity) { waiting.push(segment); if (waiting.length > 32) waiting.shift(); return; }
    // A run started under a different account cannot become this account's playtime.
    if (!identity || (segment.owner?.uid ? segment.owner.uid !== uid : segment.owner?.profileId !== identity.profileId || identity.firstUid !== uid)) return;
    const key = `${uid}:${segment.gameId}:${segment.mode}`;
    const elapsed = (remainder.get(key) || 0) + segment.durationMs;
    const seconds = Math.floor(elapsed / 1000);
    remainder.set(key, elapsed % 1000);
    while (remainder.size > 24) remainder.delete(remainder.keys().next().value);
    if (seconds > 0) logEvent(analytics, 'active_play_time', { game_id: segment.gameId, game_mode: segment.mode, level_number: segment.level, active_seconds: seconds, ...(import.meta.env.VITE_FIREBASE_ANALYTICS_DEBUG === '1' ? { debug_mode: true } : {}) });
  }
  scope.own(subscribeToPlaySegments(record), 'listener');
  scope.listen(window, 'pagehide', event => { if (!event.persisted) scope.dispose(); });
  return { dispose: () => scope.dispose() };
}
