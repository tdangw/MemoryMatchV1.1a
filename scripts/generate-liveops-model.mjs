import { HOURLY_GIFT_MS } from '../js/liveops/hourlyGift.js';
import { LETTER_REWARD_ITEMS } from '../js/liveops/letterCatalog.generated.js';
import fs from 'node:fs/promises';
import { CHEST_POOLS, CHEST_SUPPORTS } from '../js/liveops/chestConfig.js';
import { WHEEL_POOLS } from '../js/liveops/wheelCatalog.js';
import { LETTER_SETS, LETTER_ALPHABET, LETTER_SELL_COINS, ACTIVE_EVENT_COLLECTION_ID, EVENT_COLLECTIONS } from '../js/liveops/config.js';
// The current rules source is separate from historical approval and the retired Functions package.
const file = 'firestore.rules';
let section = await fs.readFile('design/rewards-liveops/spark-rules.template.txt', 'utf8');
let chestRules = await fs.readFile('design/rewards-liveops/chest-rules.template.txt', 'utf8');
chestRules = chestRules.replace('CHEST_SET_LOOKUP', LETTER_SETS.map(set=>`id == '${set.id}' ? '${set.chestType}' : `).join('') + "''")
  .replace('CHEST_POOL_LOOKUP', Object.entries(CHEST_POOLS).map(([type,ids])=>`(r.chestType == '${type}' ? ${JSON.stringify(ids)} : `).join('')+'[])'+')'.repeat(Object.keys(CHEST_POOLS).length-1))
  .replace('CHEST_SUPPORT_LOOKUP', Object.entries(CHEST_SUPPORTS).map(([game,items])=>`(r.gameId == '${game}' ? ${JSON.stringify(items.map(item=>item.key))} : `).join('')+'[])'+')'.repeat(Object.keys(CHEST_SUPPORTS).length-1));
chestRules = chestRules.replace('HOURLY_SUPPORT_LOOKUP', Object.entries(CHEST_SUPPORTS).map(([game,items])=>`(r.gameId == '${game}' ? ${JSON.stringify(items.map(item=>item.key))} : `).join('')+'[])'+')'.repeat(Object.keys(CHEST_SUPPORTS).length-1));
chestRules = chestRules.replaceAll('HOURLY_GIFT_SECONDS', String(HOURLY_GIFT_MS / 1000));
section = section.replace('CHEST_CONTRACT',()=>chestRules);
let wheelRules = await fs.readFile('design/rewards-liveops/wheel-rules.template.txt','utf8');
// Exact generated alternation keeps catalog membership identical without spending
// one Rules expression per literal ID on the already-bounded late-ad path.
const poolPattern = ids => JSON.stringify(`^(${ids.map(id=>id.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|')})$`);
const wheelPoolChoice = Object.entries(WHEEL_POOLS).map(([type,ids])=>`w.box == '${type}' ? w.itemId.matches(${poolPattern(ids)}) : `).join('')+'false';
const mysteryPoolChoice = Object.entries(CHEST_POOLS).map(([type,ids])=>`w.chestType == '${type}' ? w.itemId.matches(${poolPattern(ids)}) : `).join('')+'false';
wheelRules=wheelRules.replace('WHEEL_POOL_ITEM',`w.box == 'mystery' ? (${mysteryPoolChoice}) : (${wheelPoolChoice})`)
  .replace('WHEEL_POOL_EXISTS',`w.box == 'mystery' ? w.chestType in ${JSON.stringify(Object.keys(CHEST_POOLS).filter(type=>CHEST_POOLS[type].length))} : w.box in ${JSON.stringify(Object.keys(WHEEL_POOLS).filter(type=>WHEEL_POOLS[type].length))}`)
  .replace('WHEEL_SUPPORT_KEYS',Object.entries(CHEST_SUPPORTS).map(([game,items])=>`game == '${game}' ? ${JSON.stringify(items.map(item=>item.key))} : `).join('')+'[]')
  .replace('WHEEL_SUPPORT_LABEL',`${JSON.stringify(Object.fromEntries(Object.entries(CHEST_SUPPORTS).map(([game,items])=>[game,Object.fromEntries(items.map(item=>[item.key,item.label]))])))}.get(game,{}).get(key,'')`)
  .replace('WHEEL_PAST_AD_ORDINAL',[0,10,20].map(start => { const indices=Array.from({length:Math.min(10,29-start)},(_,offset)=>start+offset); const compare=i=>`(ads[${i}].day != day || ads[${i}].ordinal < ordinal)`; return `(count >= ${start+indices.length} ? ${indices.map(compare).join(' && ')} : ${indices.map(i=>`(count <= ${i} || ${compare(i)})`).join(' && ')})`; }).join(' && '));
section=section.replace('WHEEL_CONTRACT',()=>wheelRules);
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
