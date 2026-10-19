import { getAdventureChestState, getChapterNumber } from "./adventureProgress.js";
import { getGameProgressKey } from "./gameCatalog.js";
import { gameState } from "./gameState.js";
import { savePersistentGameData, getPersistenceStatus, loadPersistentChapter } from "./persistence.js";
import { COLLECTION_REWARD_COINS } from './progression/masteryRewards.js';
import { GAMEPLAY_LIMITS } from './gameplayTuning.js';
import { getRankingOwner } from './rankingOwner.js';
import { canLaunchGame } from './profileOperations.js';

/** Grants are typed records so later catalogs can add item packs without changing claim storage. */
export const ADVENTURE_REWARD_PACKS = Object.freeze([
  Object.freeze({ id: "small", weight: 70, grants: Object.freeze([{ type: "coins", fixed: 60, min: 20, max: 40 }]) }),
  Object.freeze({ id: "medium", weight: 25, grants: Object.freeze([{ type: "coins", fixed: 100, min: 30, max: 60 }]) }),
  Object.freeze({ id: "large", weight: 5, grants: Object.freeze([{ type: "coins", fixed: 150, min: 50, max: 100 }]) }),
]);
const pendingClaims = new Set();
let claimQueue = Promise.resolve();

export function drawAdventureReward(random = secureRandom) {
  const totalWeight = ADVENTURE_REWARD_PACKS.reduce((sum, pack) => sum + pack.weight, 0);
  const draw = checkedRandom(random) * totalWeight;
  let threshold = 0;
  const pack = ADVENTURE_REWARD_PACKS.find(candidate => { threshold += candidate.weight; return draw < threshold; });
  return {
    catalogVersion: 1, packId: pack.id,
    grants: pack.grants.map(grant => ({ type: grant.type, amount: grant.fixed + grant.min + Math.floor(checkedRandom(random) * (grant.max - grant.min + 1)) })),
  };
}

// Existing callers retain outcome/null; the journey modal also receives a reliable failure cause.
export async function claimAdventureChest(gameId, chestNumber, { expectedTier } = {}) {
  const result = await enqueueClaim(gameId, chestNumber, 'chest', expectedTier);
  return result.ok ? result.outcome : null;
}
export async function claimAdventureCollection(gameId, chestNumber) {
  const result = await enqueueClaim(gameId, chestNumber, 'collection');
  return result.ok ? result.outcome : null;
}
export function claimJourneyTreasure(gameId, chestNumber, expectedTier) {
  if (!['C','B','A','S'].includes(expectedTier)) return Promise.resolve(failure('ineligible'));
  return enqueueClaim(gameId, chestNumber, 'chest', expectedTier);
}
const failure = reason => ({ ok: false, reason });
const ownerKey = () => JSON.stringify(getRankingOwner());
function enqueueClaim(gameId, chestNumber, kind, expectedTier) {
  const identity = gameId + ':' + chestNumber + ':' + kind;
  if (pendingClaims.has(identity)) return Promise.resolve(failure('busy'));
  const key = getGameProgressKey(gameId);
  const context = { key, profile: key && gameState.progress[key], owner: ownerKey() };
  pendingClaims.add(identity);
  const result = claimQueue.then(() => commitChestClaim(gameId, chestNumber, kind, expectedTier, context));
  claimQueue = result.then(() => {}, () => {});
  return result.finally(() => pendingClaims.delete(identity));
}

async function commitChestClaim(gameId, chestNumber, kind, expectedTier, context) {
  const { key, profile, owner } = context;
  const current = () => profile && gameState.progress[key] === profile && ownerKey() === owner && canLaunchGame();
  if (!current()) return failure('stale');
  if (getPersistenceStatus().blocked) return failure('save');
  const record = await loadPersistentChapter(key, getChapterNumber(chestNumber * 10));
  if (!current()) return failure('stale');
  if (getPersistenceStatus().blocked) return failure('save');
  // Canonical receipts win over an old in-memory copy after reload/conflict.
  const eligibility = getAdventureChestState(record.bestByLevel, chestNumber, record.claimedChests);
  if (expectedTier !== undefined && expectedTier !== eligibility.activeTier) return failure('stale-tier');
  if (kind === 'collection' ? !eligibility.collectionEligible : !eligibility.eligible) return failure('ineligible');
  const coins = kind === 'collection' ? COLLECTION_REWARD_COINS : eligibility.reward.coins;
  const hints = kind === 'collection' ? 0 : eligibility.reward.hints;
  if (profile.items.hint + hints > GAMEPLAY_LIMITS.itemCount) return failure('inventory-full');
  const outcome = { catalogVersion: 2, tier: kind === 'collection' ? 'collection' : eligibility.activeTier,
    grants: [{ type: 'coins', amount: coins }, ...(hints ? [{ type: 'hint', amount: hints }] : [])], claimedAt: Date.now() };
  const previousCoins = gameState.coins;
  const previousHints = profile.items.hint;
  profile.claimedChests ||= {};
  const previousClaim = profile.claimedChests[chestNumber];
  const canonical = record.claimedChests[chestNumber];
  const claim = canonical?.rulesVersion === 1 ? structuredClone(canonical) : { rulesVersion: 1, tiers: {} };
  if (!claim.tiers || typeof claim.tiers !== 'object' || Array.isArray(claim.tiers)) claim.tiers = {};
  if (kind === 'collection') claim.collection = outcome;
  else claim.tiers[outcome.tier] = outcome;
  profile.claimedChests[chestNumber] = claim;
  gameState.coins += coins;
  profile.items.hint += hints;
  let saved;
  try { saved = await savePersistentGameData({ coins: gameState.coins, progress: gameState.progress }); }
  catch (error) {
    rollback();
    throw error;
  }
  if (!saved) rollback();
  if (!current()) return failure('stale');
  return saved ? { ok: true, outcome } : failure('save');
  function rollback() {
    if (gameState.progress[key] !== profile) return;
    gameState.coins = previousCoins;
    profile.items.hint = previousHints;
    if (previousClaim === undefined) delete profile.claimedChests[chestNumber];
    else profile.claimedChests[chestNumber] = previousClaim;
  }
}
function secureRandom() {
  const buffer = new Uint32Array(1);
  crypto.getRandomValues(buffer);
  return buffer[0] / 4294967296;
}
function checkedRandom(random) {
  const value = random();
  if (!Number.isFinite(value) || value < 0 || value >= 1) throw new RangeError("Random reward sample must be in [0, 1).");
  return value;
}
