import { COSMETIC_TYPES, cosmeticDefinition } from './cosmeticCatalog.js';

export const COSMETIC_MAX_LEVEL = 21;
export const COSMETIC_FRAGMENT_PRICE = 100;
export const COSMETIC_FUSION_FEE = 20;
export const COSMETIC_FUSION_SIZE = 3;
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const integer = value => Number.isSafeInteger(value) && value >= 0;
const fail = message => { throw new Error(message || 'Tiến trình ngoại hình chưa toàn vẹn. Dữ liệu được giữ nguyên.'); };
const safe = value => { if (!integer(value)) fail('Số lượng vượt giới hạn.'); return value; };
const operationId = value => typeof value === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(value);
export function cosmeticForm(level) {
  if (!Number.isInteger(level) || level < 1 || level > COSMETIC_MAX_LEVEL) fail();
  return level < 7 ? 1 : level < 21 ? 2 : 3;
}
export function cosmeticLevelLabel(level) {
  cosmeticForm(level);
  return level === COSMETIC_MAX_LEVEL ? 'Level Max' : `Level ${level}`;
}
export function normalizeCosmeticProgress(value) {
  if (value === undefined) return { version: 1, levels: {}, fragments: { avatar: 0, frame: 0, badge: 0 }, sequence: 0, last: null };
  if (!record(value) || value.version !== 1 || !record(value.levels) || !record(value.fragments)
    || Object.keys(value).some(key => !['version', 'levels', 'fragments', 'sequence', 'last'].includes(key))
    || !integer(value.sequence) || Object.keys(value.fragments).length !== 3
    || COSMETIC_TYPES.some(type => !integer(value.fragments[type]))
    || Object.entries(value.levels).some(([id, level]) => !cosmeticDefinition(id) || !Number.isInteger(level) || level < 1 || level > COSMETIC_MAX_LEVEL)) fail();
  const last = value.last;
  if (last !== null) {
    if (!record(last) || !operationId(last.operation) || last.sequence !== value.sequence || last.version !== 1) fail();
    if (last.kind === 'sell') {
      if (!COSMETIC_TYPES.includes(last.type) || !integer(last.quantity) || last.quantity < 1
        || last.coins !== last.quantity * COSMETIC_FRAGMENT_PRICE || !integer(last.coins)
        || Object.keys(last).length !== 7) fail();
    } else if (last.kind === 'fuse') {
      validateIngredients(last.ingredients);
      if (!COSMETIC_TYPES.includes(last.chestType) || last.fee !== COSMETIC_FUSION_FEE
        || !Number.isFinite(last.roll) || last.roll < 0 || last.roll >= 1
        || selectCosmeticChest(last.roll) !== last.chestType || Object.keys(last).length !== 8) fail();
    } else fail();
  } else if (value.sequence !== 0) fail();
  return structuredClone(value);
}
/** Preserve existing ownership; never infer historical copies from old entitlement receipts. */
export function seedOwnedCosmetics(previous, ownedIds) {
  const state = normalizeCosmeticProgress(previous);
  for (const id of ownedIds) {
    if (!cosmeticDefinition(id)) fail('Vật phẩm chưa được hỗ trợ.');
    if (!Object.hasOwn(state.levels, id)) state.levels[id] = 1;
  }
  return state;
}
/** Called only for a newly committed grant, not from render or replay of an applied receipt. */
export function receiveCosmeticCopies(previous, itemId, quantity = 1) {
  const item = cosmeticDefinition(itemId);
  if (!item || !integer(quantity) || quantity < 1) fail('Quà ngoại hình không hợp lệ.');
  const state = normalizeCosmeticProgress(previous), before = state.levels[itemId] || 0;
  const used = Math.min(quantity, COSMETIC_MAX_LEVEL - before), fragments = quantity - used;
  state.levels[itemId] = before + used;
  state.fragments[item.type] = safe(state.fragments[item.type] + fragments);
  return { state, result: { itemId, type: item.type, quantity, previousLevel: before, level: state.levels[itemId], fragments } };
}
function validateIngredients(value) {
  if (!record(value) || Object.keys(value).length !== 3 || COSMETIC_TYPES.some(type => !integer(value[type]))
    || COSMETIC_TYPES.reduce((sum, type) => sum + value[type], 0) !== COSMETIC_FUSION_SIZE) fail('Chọn đủ 3 mảnh để ghép.');
}
export function selectCosmeticChest(roll) {
  if (!Number.isFinite(roll) || roll < 0 || roll >= 1) fail('Chưa chọn được rương.');
  return COSMETIC_TYPES[Math.floor(roll * COSMETIC_TYPES.length)];
}
/** Atomic projection: the caller commits wallet delta, chest delta and this state together. */
export function mutateCosmeticFragments(previous, command, coinsBalance) {
  const state = normalizeCosmeticProgress(previous);
  if (!operationId(command.operation) || !integer(coinsBalance)) fail();
  if (state.last?.operation === command.operation) return { state, result: state.last, coins: 0, chestType: null, applied: false };
  if (command.sequence !== state.sequence + 1) fail('Kho mảnh đã thay đổi. Hãy tải lại.');
  let result, coins, chestType = null;
  if (command.type === 'sellCosmeticFragments') {
    if (!COSMETIC_TYPES.includes(command.fragmentType) || !integer(command.quantity) || command.quantity < 1
      || state.fragments[command.fragmentType] < command.quantity) fail('Không đủ mảnh để bán.');
    coins = safe(command.quantity * COSMETIC_FRAGMENT_PRICE); safe(coinsBalance + coins);
    state.fragments[command.fragmentType] -= command.quantity;
    result = { kind: 'sell', type: command.fragmentType, quantity: command.quantity, coins };
  } else if (command.type === 'fuseCosmeticFragments') {
    validateIngredients(command.ingredients);
    if (coinsBalance < COSMETIC_FUSION_FEE) fail('Không đủ Xu để ghép mảnh.');
    for (const type of COSMETIC_TYPES) if (state.fragments[type] < command.ingredients[type]) fail('Không đủ mảnh đã chọn.');
    chestType = selectCosmeticChest(command.fusionRoll);
    for (const type of COSMETIC_TYPES) state.fragments[type] -= command.ingredients[type];
    coins = -COSMETIC_FUSION_FEE;
    result = { kind: 'fuse', ingredients: { ...command.ingredients }, chestType, fee: COSMETIC_FUSION_FEE, roll: command.fusionRoll };
  } else fail('Thao tác mảnh không hợp lệ.');
  state.sequence = safe(state.sequence + 1);
  state.last = { ...result, version: 1, operation: command.operation, sequence: state.sequence };
  return { state: normalizeCosmeticProgress(state), result: state.last, coins, chestType, applied: true };
}
