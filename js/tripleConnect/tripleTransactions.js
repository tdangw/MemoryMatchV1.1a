import { gameState } from "../gameState.js";
import { savePersistentGameData } from "../persistence.js";
import { stageActiveSession } from "../sessionProgress.js";
import { GAMEPLAY_LIMITS } from "../gameplayTuning.js";
import { getTripleItemDefinition } from "./tripleItems.js";
import { equipTheme, ownTheme } from "../appearance.js";
import { THEMES } from "../themeCatalog.js";
import { LINK_EXIT_EFFECTS, LINK_PATH_EFFECTS } from "../linkConnect/linkEffects.js";
import { normalizeTripleTrayExpansionSlots, TRIPLE_PRODUCT_DECISIONS } from "./tripleConfig.js";

export function consumeTripleItemWithSession(itemId, session) {
  const item = getTripleItemDefinition(itemId);
  const items = gameState.progress.tripleConnect.items;
  if (!item || !session?.mode || !Number.isInteger(items[itemId]) || items[itemId] < 1) return false;
  const rollback = createRollbackPoint();
  items[itemId] -= 1;
  if (!stageActiveSession("triple-connect", session) || !savePersistentGameData({ coins: gameState.coins, progress: gameState.progress })) {
    restoreRollbackPoint(rollback);
    return false;
  }
  return true;
}

export function commitTripleRewardTransaction({ session, milestones, rewards }) {
  if (!session?.mode || !milestones || !Array.isArray(rewards)) return null;
  const rollback = createRollbackPoint();
  const granted = [];
  const items = gameState.progress.tripleConnect.items;
  let coins = 0;
  for (const entry of rewards) {
    const { type, amount, source = "milestone", overflowCoins } = entry || {};
    if (!Number.isInteger(amount) || amount < 1) continue;
    if (type === "coins") { coins += amount; granted.push({ type, amount, source }); continue; }
    if (type === "time") { granted.push({ type, amount, source }); continue; }
    if (!Object.hasOwn(items, type)) continue;
    const capacity = GAMEPLAY_LIMITS.itemCount - items[type];
    const accepted = Math.max(0, Math.min(capacity, amount));
    items[type] += accepted;
    if (accepted) granted.push({ type, amount: accepted, source });
    const overflow = amount - accepted;
    const fallback = Number.isInteger(overflowCoins)
      ? overflowCoins
      : TRIPLE_PRODUCT_DECISIONS.milestones.itemFallbackCoins[type] || 0;
    if (overflow && fallback) {
      const converted = overflow * fallback;
      coins += converted;
      granted.push({ type: "coins", amount: converted, source });
    }
  }
  gameState.coins += coins;
  gameState.progress.tripleConnect.milestones = milestones;
  if (!stageActiveSession("triple-connect", session) || !savePersistentGameData({ coins: gameState.coins, progress: gameState.progress })) {
    restoreRollbackPoint(rollback);
    return null;
  }
  return granted;
}

export function purchaseTripleItem(itemId) {
  const item = getTripleItemDefinition(itemId);
  const items = gameState.progress.tripleConnect.items;
  if (!item || !Number.isInteger(items[itemId]) || items[itemId] >= GAMEPLAY_LIMITS.itemCount || gameState.coins < item.price) return false;
  const rollback = createRollbackPoint();
  gameState.coins -= item.price;
  items[itemId] += 1;
  if (!savePersistentGameData({ coins: gameState.coins, progress: gameState.progress })) {
    restoreRollbackPoint(rollback);
    return false;
  }
  return true;
}

export function purchaseTripleTrayExpansion() {
  const profile = gameState.progress.tripleConnect;
  const expansion = TRIPLE_PRODUCT_DECISIONS.trayExpansion;
  const price = expansion.releasePrice;
  const currentSlots = normalizeTripleTrayExpansionSlots(profile.trayExpansionSlots);
  if (currentSlots >= expansion.bonusCapacity || gameState.coins < price) return false;
  const rollback = createRollbackPoint();
  gameState.coins -= price;
  profile.trayExpansionSlots = currentSlots + 1;
  profile.trayExpansionOwned = profile.trayExpansionSlots === expansion.bonusCapacity;
  if (!savePersistentGameData({ coins: gameState.coins, progress: gameState.progress })) {
    restoreRollbackPoint(rollback);
    return false;
  }
  globalThis.document?.dispatchEvent(new CustomEvent("triple-tray-expansion-purchased"));
  return true;
}

export function purchaseTripleTheme(themeId, price) {
  const theme = THEMES.find((candidate) => candidate.id === themeId);
  if (!theme || theme.price !== price) return false;
  return commitAppearancePurchase(price, (appearance) => ownTheme(appearance, "triple-connect", themeId));
}

export function purchaseTripleEffect(kind, effectId, price) {
  const effects = kind === "path" ? LINK_PATH_EFFECTS : kind === "exit" ? LINK_EXIT_EFFECTS : null;
  const effect = effects?.find((candidate) => candidate.id === effectId);
  if (!effect || effect.price !== price) return false;
  const key = kind === "path" ? "ownedTriplePathEffects" : "ownedTripleExitEffects";
  return commitAppearancePurchase(price, (appearance) => {
    if (appearance[key].includes(effectId)) return false;
    appearance[key] = [...appearance[key], effectId];
    return true;
  });
}

export function equipTripleTheme(themeId) {
  return commitAppearanceChange((appearance) => equipTheme(appearance, "triple-connect", themeId));
}

export function equipTripleEffect(kind, effectId) {
  if (kind !== "path" && kind !== "exit") return false;
  const ownedKey = kind === "path" ? "ownedTriplePathEffects" : "ownedTripleExitEffects";
  const equippedKey = kind === "path" ? "triplePathEffect" : "tripleExitEffect";
  return commitAppearanceChange((appearance) => {
    if (!appearance[ownedKey].includes(effectId)) return false;
    appearance[equippedKey] = effectId;
    return true;
  });
}

function commitAppearancePurchase(price, apply) {
  if (!Number.isInteger(price) || price < 0 || gameState.coins < price) return false;
  const rollback = createRollbackPoint();
  gameState.coins -= price;
  if (!apply(gameState.appearance) || !savePersistentGameData({ coins: gameState.coins, appearance: gameState.appearance })) {
    restoreRollbackPoint(rollback);
    return false;
  }
  return true;
}

function commitAppearanceChange(apply) {
  const rollback = createRollbackPoint();
  if (!apply(gameState.appearance) || !savePersistentGameData({ appearance: gameState.appearance })) {
    restoreRollbackPoint(rollback);
    return false;
  }
  return true;
}

function createRollbackPoint() {
  return {
    coins: gameState.coins,
    items: { ...gameState.progress.tripleConnect.items },
    sessionsByMode: { ...gameState.progress.tripleConnect.sessionsByMode },
    milestones: structuredClone(gameState.progress.tripleConnect.milestones),
    trayExpansionSlots: gameState.progress.tripleConnect.trayExpansionSlots,
    trayExpansionOwned: gameState.progress.tripleConnect.trayExpansionOwned,
    appearance: structuredClone(gameState.appearance),
  };
}

function restoreRollbackPoint(rollback) {
  gameState.coins = rollback.coins;
  gameState.progress.tripleConnect.items = rollback.items;
  gameState.progress.tripleConnect.sessionsByMode = rollback.sessionsByMode;
  gameState.progress.tripleConnect.milestones = rollback.milestones;
  gameState.progress.tripleConnect.trayExpansionSlots = rollback.trayExpansionSlots;
  gameState.progress.tripleConnect.trayExpansionOwned = rollback.trayExpansionOwned;
  gameState.appearance = rollback.appearance;
}
