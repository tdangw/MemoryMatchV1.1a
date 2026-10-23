import { getMasteryRewards, MASTERY_CHEST_REWARDS } from './masteryRewards.js';
import { hasCertifiedCompletion, getDifficultyAccess } from './difficultyProgress.js';
import { TREASURE_CATALOG } from './treasureCatalog.js';

/** Read-only projection. EXP and claim states always come from certified records and receipts. */
export function projectJourneyTreasure({ completed, block, claim = {} }) {
  if (!Number.isSafeInteger(block) || block < 1 || !Number.isSafeInteger(block * 10)) throw new RangeError('Invalid treasure block.');
  const mastery = getMasteryRewards({ completed, level: block * 10, claim });
  const receipts = claim?.rulesVersion === 1 ? claim.tiers || {} : {};
  const activeName = TREASURE_CATALOG.find(item => item.tier === mastery.activeTier)?.name;
  const chests = mastery.tiers.map((progress,index) => {
    const definition = TREASURE_CATALOG[index];
    const state = receipts[progress.tier] ? 'claimed' : progress.complete ? progress.tier === mastery.activeTier ? 'ready' : 'waiting' : 'progress';
    return Object.freeze({ ...progress, ...definition, state, previousName: activeName,
      reward: MASTERY_CHEST_REWARDS[index] });
  });
  return Object.freeze({ block, firstLevel: mastery.firstLevel, lastLevel: mastery.lastLevel,
    fragmentCount: mastery.fragmentLevels.length, activeTier: mastery.activeTier, allClaimed: mastery.activeTier === null, chests: Object.freeze(chests) });
}

/** Locate the next missing certification, including any prerequisite, without changing a session. */
export function nextTreasureLevel({ completed, block, tier, unlockedThrough }) {
  const definition = TREASURE_CATALOG.find(item => item.tier === tier);
  if (!definition) throw new RangeError('Invalid treasure tier.');
  const view = projectJourneyTreasure({completed,block});
  for (let level = view.firstLevel; level <= view.lastLevel; level++) {
    if (hasCertifiedCompletion(completed, definition.mode, level)) continue;
    if (Number.isSafeInteger(unlockedThrough) && level > unlockedThrough) return {level:unlockedThrough,mode:'easy'};
    const access = getDifficultyAccess({completed,level,mode:definition.mode});
    return access.unlocked ? {level,mode:definition.mode} : {...access.requires};
  }
  return null;
}

