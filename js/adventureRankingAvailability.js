// The backend contract must be released before enabling v4 on production.
export function adventureRankingEnabled() {
  const env = import.meta.env || {};
  return env.VITE_ADVENTURE_RANKING_V4 === '1' || env.VITE_ADVENTURE_RANKING_V4 !== '0'
    && (env.VITE_FIREBASE_USE_EMULATORS === '1' || env.DEV === true && env.VITE_FIREBASE_DISABLED === '1');
}
