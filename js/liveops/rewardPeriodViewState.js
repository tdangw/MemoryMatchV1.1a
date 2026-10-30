// Read-only view invalidation. The reward service remains the clock owner.
const listeners = new Set();
export function subscribeRewardPeriod(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
export function publishRewardPeriod() {
  for (const listener of listeners) {
    try { listener(); }
    catch (error) { console.error('Reward period subscriber failed',error); }
  }
}
