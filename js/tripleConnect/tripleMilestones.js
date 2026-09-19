import { getTripleMilestoneReward, TRIPLE_PRODUCT_DECISIONS } from "./tripleConfig.js";

export function resolveTripleMilestoneProgress({ milestones, tileIds, mode }) {
  const contributed = [...new Set(tileIds || [])].filter((id) => typeof id === "string" && id);
  if (!contributed.length) return Object.freeze({ next: milestones, claimedTileIds: [], rewards: [] });
  const target = TRIPLE_PRODUCT_DECISIONS.milestones.target;
  const step = TRIPLE_PRODUCT_DECISIONS.milestones.step;
  let progress = Math.max(0, Math.min(target - 1, Math.floor(Number(milestones?.progress) || 0)));
  let cycleId = Math.max(0, Math.floor(Number(milestones?.cycleId) || 0));
  let claimedIds = Array.isArray(milestones?.claimedIds) ? [...new Set(milestones.claimedIds)] : [];
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
    next: Object.freeze({ progress, cycleId, claimedIds }),
    claimedTileIds: Object.freeze(contributed),
    rewards: Object.freeze(rewards),
  });
}
