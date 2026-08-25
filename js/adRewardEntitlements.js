const STORAGE_KEY = "memory-match-rewarded-ad-entitlements";
export const DAILY_REWARDED_LIMIT = 5;

function today() {
  return new Date().toLocaleDateString("en-CA");
}

function load() {
  try {
    const value = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}");
    return {
      day: value.day === today() ? value.day : today(),
      claims: value.day === today() ? Math.max(0, Number(value.claims) || 0) : 0,
    };
  } catch {
    return { day: today(), claims: 0 };
  }
}

export function getRemainingRewardedClaims() {
  return Math.max(0, DAILY_REWARDED_LIMIT - load().claims);
}

export function claimRewardedAdReward() {
  const current = load();
  if (current.claims >= DAILY_REWARDED_LIMIT) return false;
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ ...current, claims: current.claims + 1 }),
  );
  return true;
}
