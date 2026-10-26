import { normalizeAppearance } from './appearance.js';
import { getAdventureSummary } from './adventureProgress.js';
import { stableJSON } from './cloudSnapshot.js';
import { TRIPLE_PRODUCT_DECISIONS } from './tripleConnect/tripleConfig.js';
const DEFAULT_ADVENTURE = Object.freeze(getAdventureSummary({}));

/** Session checkpoints stay local; only durable player accomplishments/economy trigger uploads. */
export function createCloudSaveEventFilter(initial = {}, coins = null, appearance = null) {
  let previous = signature(initial);
  let previousCoins = coins;
  let previousAppearance = stableJSON(appearance);
  return patch => {
    if (patch.rewardPublished) {
      previousCoins = patch.coins; previousAppearance = stableJSON(patch.appearance); return false;
    }
    let changed = Boolean(patch.cloudEvent || patch.reset || patch.restored);
    if (Object.hasOwn(patch, "coins")) {
      changed ||= patch.coins !== previousCoins;
      previousCoins = patch.coins;
    }
    if (patch.appearance) {
      const next = stableJSON(patch.appearance);
      changed ||= next !== previousAppearance;
      previousAppearance = next;
    }
    if (patch.progress) {
      const next = signature(patch.progress);
      changed ||= next !== previous;
      previous = next;
    }
    return changed;
  };
}
function signature(progress) {
  return stableJSON(["memoryMatch", "linkConnect", "tripleConnect"].map(game => {
    const value = progress[game] || {};
    const items = { ...(game === "tripleConnect" ? { hint: TRIPLE_PRODUCT_DECISIONS.initialItems.hint } : {}), ...value.items };
    return [game,
    value.adventure || DEFAULT_ADVENTURE,
    Object.entries(items).filter(([, amount]) => amount > 0).sort(([a], [b]) => a.localeCompare(b)),
    value.trayExpansionSlots || 0,
    value.highScore || 0, value.totalScore || 0, value.totalStars || 0,
    ];
  }));
}
export function cloudSaveEventSignature(data) {
  return stableJSON([data.coins || 0, normalizeAppearance(data.appearance), signature(data.progress || {})]);
}
