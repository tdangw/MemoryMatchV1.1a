import { getAdventureChestState } from "./adventureProgress.js";
import { getGameProgressKey } from "./gameCatalog.js";
import { gameState } from "./gameState.js";
import { savePersistentGameData, getPersistenceStatus } from "./persistence.js";

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

export function claimAdventureChest(gameId, chestNumber) {
  const identity = `${gameId}:${chestNumber}`;
  if (pendingClaims.has(identity)) return Promise.resolve(null);
  pendingClaims.add(identity);
  const result = claimQueue.then(() => commitChestClaim(gameId, chestNumber));
  claimQueue = result.then(() => {}, () => {});
  return result.finally(() => pendingClaims.delete(identity));
}

async function commitChestClaim(gameId, chestNumber) {
  const key = getGameProgressKey(gameId);
  const profile = key && gameState.progress[key];
  if (!profile || getPersistenceStatus().blocked) return null;
  const eligibility = getAdventureChestState(profile.bestByLevel, chestNumber, profile.claimedChests);
  if (!eligibility.eligible) return null;
  const outcome = { ...drawAdventureReward(), claimedAt: Date.now() };
  const previousCoins = gameState.coins;
  profile.claimedChests ||= {};
  profile.claimedChests[chestNumber] = outcome;
  gameState.coins += outcome.grants.reduce((sum, grant) => sum + grant.amount, 0);
  if (await savePersistentGameData({ coins: gameState.coins, progress: gameState.progress })) return outcome;
  gameState.coins = previousCoins;
  delete profile.claimedChests[chestNumber];
  return null;
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
