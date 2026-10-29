import { LETTER_REWARD_ITEMS } from '../js/liveops/letterCatalog.generated.js';
import fs from 'node:fs/promises';
import { CHEST_POOLS, CHEST_SUPPORTS } from '../js/liveops/chestConfig.js';
import { LETTER_SETS, LETTER_ALPHABET, LETTER_SELL_COINS, ACTIVE_EVENT_COLLECTION_ID, EVENT_COLLECTIONS } from '../js/liveops/config.js';
// The current rules source is separate from historical approval and the retired Functions package.
const file = 'firestore.rules';
let section = await fs.readFile('design/rewards-liveops/spark-rules.template.txt', 'utf8');
let chestRules = await fs.readFile('design/rewards-liveops/chest-rules.template.txt', 'utf8');
chestRules = chestRules.replace('CHEST_SET_LOOKUP', LETTER_SETS.map(set=>`id == '${set.id}' ? '${set.chestType}' : `).join('') + "''")
  .replace('CHEST_POOL_LOOKUP', Object.entries(CHEST_POOLS).map(([type,ids])=>`(r.chestType == '${type}' ? ${JSON.stringify(ids)} : `).join('')+'[])'+')'.repeat(Object.keys(CHEST_POOLS).length-1))
  .replace('CHEST_SUPPORT_LOOKUP', Object.entries(CHEST_SUPPORTS).map(([game,items])=>`(r.gameId == '${game}' ? ${JSON.stringify(items.map(item=>item.key))} : `).join('')+'[])'+')'.repeat(Object.keys(CHEST_SUPPORTS).length-1));
chestRules = chestRules.replace('HOURLY_SUPPORT_LOOKUP', Object.entries(CHEST_SUPPORTS).map(([game,items])=>`(r.gameId == '${game}' ? ${JSON.stringify(items.map(item=>item.key))} : `).join('')+'[])'+')'.repeat(Object.keys(CHEST_SUPPORTS).length-1));
section = section.replace('CHEST_CONTRACT',()=>chestRules);
section = section.replaceAll('LETTER_REQUIREMENTS',JSON.stringify(Object.fromEntries(LETTER_SETS.map(set=>[set.id,set.required])))).replaceAll('LETTER_SET_IDS',JSON.stringify(LETTER_SETS.map(set=>set.id))).replaceAll('LETTER_REWARDS',JSON.stringify(LETTER_REWARD_ITEMS.map(item=>item.id)));
section = section.replaceAll('LETTER_SALE_PRICE', String(LETTER_SELL_COINS));
section=section.replaceAll('LETTER_REQUIREMENT_LOOKUP',LETTER_SETS.map(set=>`setId == '${set.id}' ? ${JSON.stringify(set.required)}.get(key,0) : `).join('')+'0');
section=section.replaceAll('LETTER_REQUIREMENT_MAP',LETTER_SETS.map(set=>`setId == '${set.id}' ? ${JSON.stringify(set.required)} : `).join('')+'{}');
section=section.replace('LETTER_EXCHANGE_VALUES',LETTER_ALPHABET.map(letter=>`        && (!required.keys().hasAny(['${letter}']) || rewardExchangeValue(n.counts.get('${letter}',0),o.counts.get('${letter}',0),required.get('${letter}',0)))`).join('\n'));
const letterKeys = `[${LETTER_ALPHABET.map(letter=>`'${letter}'`).join(',')}]`;
section = section.replaceAll('LETTER_KEYS',letterKeys).replace('LETTER_VALUES',LETTER_ALPHABET.map(letter=>`        && (!changed.hasAny(['${letter}']) || rewardLetterValue(n,o,'${letter}'))`).join('\n'));
section = section.replace('LETTER_CREDITS',LETTER_ALPHABET.map(letter=>`        && (!changed.hasAny(['${letter}']) || rewardLetterCreditValue(n.counts.get('${letter}',0),o.counts.get('${letter}',0),n.earned.get('${letter}',0),o.earned.get('${letter}',0)))`).join('\n'));
const ids = EVENT_COLLECTIONS.map(item => `'${item.id}'`).join(',');
section = section.replace("n.cosmetics.collectionId == 'firefly-festival-01'", `n.cosmetics.collectionId == '${ACTIVE_EVENT_COLLECTION_ID}'`)
  .replace("n.cosmetics.granted.hasOnly(['firefly-festival-01'])", `n.cosmetics.granted.hasOnly([${ids}])`)
  .replace('n.cosmetics.granted.size() <= 1', `n.cosmetics.granted.size() <= ${EVENT_COLLECTIONS.length}`);
const rules = await fs.readFile(file, 'utf8');
const next = rules.replace(/    \/\/ BEGIN Spark reward contract[\s\S]*?    \/\/ END Spark reward contract/, () => `    // BEGIN Spark reward contract\n${section}    // END Spark reward contract`);
if (process.argv.includes('--check')) { if (next !== rules) throw new Error('Spark rules source changed; regenerate.'); }
else await fs.writeFile(file, next);
console.log('Spark reward rules match current configuration.');
