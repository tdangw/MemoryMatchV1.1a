import { getTripleMilestoneReward, TRIPLE_LEGACY_MILESTONE_CONTRACT, TRIPLE_PRODUCT_DECISIONS } from "./tripleConfig.js";

export function normalizeTripleMilestones(value = {}) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const { milestones } = TRIPLE_PRODUCT_DECISIONS;
  const cycleId = normalizeNonNegativeInteger(source.cycleId);
  if (source.version === milestones.version) {
    return Object.freeze({
      version: milestones.version,
      progress: Math.min(milestones.target - 1, normalizeNonNegativeInteger(source.progress)),
      cycleId,
      claimedIds: normalizeClaimIds(source.claimedIds, cycleId),
    });
  }
  const legacyProgress = Math.min(TRIPLE_LEGACY_MILESTONE_CONTRACT.target - 1, normalizeNonNegativeInteger(source.progress));
  const progress = Math.floor(legacyProgress * milestones.target / TRIPLE_LEGACY_MILESTONE_CONTRACT.target);
  // Every new milestone already passed by the old progress is marked claimed.
  // This migration intentionally grants nothing retroactively.
  const claimedIds = Array.from(
    { length: Math.floor(progress / milestones.step) },
    (_, index) => `${cycleId}:${index + 1}`,
  );
  return Object.freeze({ version: milestones.version, progress, cycleId, claimedIds });
}

export function resolveTripleMilestoneProgress({ milestones, tileIds, mode }) {
  const contributed = [...new Set(tileIds || [])].filter((id) => typeof id === "string" && id);
  if (!contributed.length) return Object.freeze({ next: milestones, claimedTileIds: [], rewards: [] });
  const target = TRIPLE_PRODUCT_DECISIONS.milestones.target;
  const step = TRIPLE_PRODUCT_DECISIONS.milestones.step;
  const normalized = normalizeTripleMilestones(milestones);
  let progress = normalized.progress;
  let cycleId = normalized.cycleId;
  let claimedIds = [...normalized.claimedIds];
  const rewards = [];
  progress += 1;
  if (progress % step === 0) {
    const index = progress / step;
    const claimId = `${cycleId}:${index}`;
    if (!claimedIds.includes(claimId)) {
      claimedIds.push(claimId);
      rewards.push({ claimId, milestone: index, reward: getTripleMilestoneReward(index, mode) });
    }
  }
  if (progress === target) {
    progress = 0;
    cycleId += 1;
    claimedIds = [];
  }
  return Object.freeze({
    next: Object.freeze({ version: TRIPLE_PRODUCT_DECISIONS.milestones.version, progress, cycleId, claimedIds }),
    claimedTileIds: Object.freeze(contributed),
    rewards: Object.freeze(rewards),
  });
}

function normalizeClaimIds(value, cycleId) {
  const maximum = TRIPLE_PRODUCT_DECISIONS.milestones.rewards.length;
  return [...new Set((Array.isArray(value) ? value : []).filter((id) => {
    const match = /^(\d+):(\d+)$/.exec(id);
    return Boolean(match && Number(match[1]) === cycleId && Number(match[2]) >= 1 && Number(match[2]) <= maximum);
  }))];
}

function normalizeNonNegativeInteger(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.floor(number)) : 0;
}
