// Current product policy. Historical approval JSON remains unchanged.
export const EVENT_COLLECTIONS = Object.freeze([
  Object.freeze({ id: 'firefly-festival-01', name: 'Sưu tập huy hiệu', target: 100,
    items: Object.freeze(['event-avatar-lantern-otter', 'event-frame-firefly-glow']) }),
]);
export const ACTIVE_EVENT_COLLECTION_ID = 'firefly-festival-01';
export function eventCollection(id) { return EVENT_COLLECTIONS.find(collection => collection.id === id); }

// Per eligible manual pair/triple. Each source is sampled independently.
export const GROUP_LOOT_DROP_RATES = Object.freeze({
  normal: Object.freeze({ letter: .05, ticket: .02, badge: .06 }),
  special: Object.freeze({ letter: .25, ticket: .10, badge: .30 }),
});
// Compatibility export for callers describing the special-group policy.
export const LETTER_DROP_CHANCE = GROUP_LOOT_DROP_RATES.special.letter;
export const LETTER_SELL_COINS = 10;
export const LETTER_FUSION_FEE = 10;
// Historical sale receipts remain readable; new sales always use LETTER_SELL_COINS.
export const LETTER_SALE_RECEIPT_PRICES = Object.freeze([LETTER_SELL_COINS, 1000]);
export const LETTER_FALLBACK_COINS = 100;
export const LETTER_SETS = Object.freeze([
  { id:'memory-match', label:'MEMORY MATCH', chestType:'avatar' }, { id:'link-connect', label:'LINK CONNECT', chestType:'frame' },
  { id:'triple-connect', label:'TRIPLE CONNECT', chestType:'badge' }, { id:'adventure', label:'ADVENTURE', chestType:'avatar' },
].map(set=>Object.freeze({ ...set, required:Object.freeze([...set.label.replaceAll(' ','')].reduce((counts,letter)=>{
  counts[letter]=(counts[letter]||0)+1; return counts;
},{})) })));
export const LETTER_ALPHABET = Object.freeze([...new Set(LETTER_SETS.flatMap(set=>Object.keys(set.required)))].sort());

export const LETTER_SYNC_KEYS_PER_COMMIT = 4;
