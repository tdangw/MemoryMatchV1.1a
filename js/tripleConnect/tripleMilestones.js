import { groupEnergyChance, groupSupportChance } from '../progression/groupDropPolicy.js';
import { getTripleMilestoneReward, TRIPLE_PRODUCT_DECISIONS } from "./tripleConfig.js";

export function normalizeTripleMilestones(value = {}) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const { milestones } = TRIPLE_PRODUCT_DECISIONS;
  if (source.version !== milestones.version)
    return Object.freeze({ version: milestones.version, progress: 0, cycleId: 0, claimedIds: [] });
  const cycleId = normalizeNonNegativeInteger(source.cycleId);
  return Object.freeze({
    version: milestones.version,
    progress: Math.min(milestones.target - 1, normalizeNonNegativeInteger(source.progress)),
    cycleId,
    claimedIds: normalizeClaimIds(source.claimedIds, cycleId),
  });
}

export function resolveTripleMilestoneProgress({ milestones, tileIds, mode, special = false, legacy = false }, random = Math.random) {
  const contributed = [...new Set(tileIds || [])].filter((id) => typeof id === "string" && id);
  if (!contributed.length) return Object.freeze({ next: milestones, claimedTileIds: [], rewards: [] });
  const target = TRIPLE_PRODUCT_DECISIONS.milestones.target;
  const step = TRIPLE_PRODUCT_DECISIONS.milestones.step;
  const normalized = normalizeTripleMilestones(milestones);
  let progress = normalized.progress;
  let cycleId = normalized.cycleId;
  let claimedIds = [...normalized.claimedIds];
  const rewards = [];
  const energy = legacy || random() < groupEnergyChance(special);
  const support = !legacy && random() < groupSupportChance(special)
    ? ['hint', 'undo', 'shuffle', 'time-item'][Math.min(3, Math.floor(random() * 4))] : null;
  if (energy) progress += 1;
  if (energy && progress % step === 0) {
    const index = progress / step;
    const claimId = `${cycleId}:${index}`;
    if (!claimedIds.includes(claimId)) {
      claimedIds.push(claimId);
      rewards.push({ claimId, milestone: index, reward: getTripleMilestoneReward(index, mode, legacy ? 1 : 2) });
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
    energy, support,
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
