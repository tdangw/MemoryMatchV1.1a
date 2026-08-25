const STORAGE_KEY = "memory-match-interstitial-cadence";
const COMPLETIONS_PER_INTERSTITIAL = 5;

function loadCompletions() {
  try {
    return Math.max(0, Number(window.localStorage.getItem(STORAGE_KEY)) || 0);
  } catch {
    return 0;
  }
}

function saveCompletions(value) {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(value));
  } catch {
    // Private browsing or a full storage quota must not block level progress.
  }
}

/** Records a completed level and returns true at each five-level interval. */
export function shouldShowLevelTransitionInterstitial() {
  const completions = loadCompletions() + 1;
  const shouldShow = completions >= COMPLETIONS_PER_INTERSTITIAL;
  saveCompletions(shouldShow ? 0 : completions);
  return shouldShow;
}
