import { HOURLY_GIFT_MS, HOURLY_GIFT_TEST_TICKETS, HOURLY_GIFT_TEST_COINS } from '../js/liveops/hourlyGift.js';
import { LETTER_REWARD_ITEMS } from '../js/liveops/letterCatalog.generated.js';
import fs from 'node:fs/promises';
import { CHEST_POOLS, LEGACY_CHEST_POOLS, CHEST_SUPPORTS, FESTIVAL_VERSION, FESTIVAL_MILESTONES, LEGACY_FESTIVAL_MILESTONES } from '../js/liveops/chestConfig.js';
import { COSMETIC_ITEMS } from '../js/progression/cosmeticCatalog.js';
import { WHEEL_POOLS } from '../js/liveops/wheelCatalog.js';
import { LOGIN_REWARDS } from '../js/liveops/missionRewards.js';
import { DAILY } from '../js/liveops/model.js';
import { LETTER_SETS, LETTER_ALPHABET, LETTER_SELL_COINS, ACTIVE_EVENT_COLLECTION_ID, EVENT_COLLECTIONS } from '../js/liveops/config.js';
// The current rules source is separate from historical approval and the retired Functions package.
const file = 'firestore.rules';
let section = await fs.readFile('design/rewards-liveops/spark-rules.template.txt', 'utf8');
let cosmeticRules = await fs.readFile('design/rewards-liveops/cosmetic-rules.template.txt','utf8');
cosmeticRules=cosmeticRules.replace('COSMETIC_IDS',JSON.stringify(COSMETIC_ITEMS.map(item=>item.id)))
 .replace('COSMETIC_TYPE_LOOKUP',['avatar','frame','badge'].map(type=>`id.matches(${JSON.stringify('^('+COSMETIC_ITEMS.filter(item=>item.type===type).map(item=>item.id).join('|')+')$')}) ? '${type}' : `).join('')+"''")
 .replace('COSMETIC_SEED_HELPERS',Array.from({length:Math.ceil(COSMETIC_ITEMS.length/10)},(_,index)=>`    function cosmeticSeed${index}(c,added) { return ${COSMETIC_ITEMS.slice(index*10,index*10+10).map(item=>`(!added.hasAny(['${item.id}']) || c.levels['${item.id}'] == 1)`).join(' && ')}; }`).join('\n'))
 .replace('COSMETIC_SEED_VALUES',Array.from({length:Math.ceil(COSMETIC_ITEMS.length/10)},(_,index)=>`        && cosmeticSeed${index}(c,added)`).join('\n'));
section=section.replace('COSMETIC_CONTRACT',()=>cosmeticRules);
let chestRules = await fs.readFile('design/rewards-liveops/chest-rules.template.txt', 'utf8');
const festivalVersions=[[1,LEGACY_FESTIVAL_MILESTONES],[FESTIVAL_VERSION,FESTIVAL_MILESTONES]];
const festivalChoice=(render,fallback='0')=>festivalVersions.map(([version,items])=>`version == ${version} ? (${render(items)}) : `).join('')+fallback;
chestRules=chestRules.replaceAll('FESTIVAL_CURRENT_VERSION',String(FESTIVAL_VERSION))
  .replace('FESTIVAL_ALL_MASK',festivalChoice(items=>String((1<<items.length)-1)))
  .replace('FESTIVAL_THRESHOLD',festivalChoice(items=>items.map((item,index)=>`delta == ${1<<index} ? ${item.points} : `).join('')+'0'))
  .replace('FESTIVAL_CHEST',festivalChoice(items=>items.map((item,index)=>`delta == ${1<<index} ? '${item.chest||''}' : `).join('')+"''", "''"))
  .replace('FESTIVAL_MASK_REQUIREMENTS',festivalVersions.map(([version,items])=>`n.version == ${version} ? (${items.map((item,index)=>`(int(n.mask / ${1<<index}) % 2 == 0 || n.earnedTotal - n.completedCycles * 100 >= ${item.points})`).join(' && ')}) : `).join('')+'false');
const chestPoolChoice=pools=>Object.entries(pools).map(([type,ids])=>`r.chestType == '${type}' ? r.itemId.matches(${JSON.stringify('^('+ids.join('|')+')$')}) : `).join('')+'false';
chestRules=chestRules.replace('CHEST_POOL_ITEM',`r.poolVersion == 1 ? (${chestPoolChoice(LEGACY_CHEST_POOLS)}) : (${chestPoolChoice(CHEST_POOLS)})`);
chestRules = chestRules.replace('CHEST_SET_LOOKUP', LETTER_SETS.map(set=>`id == '${set.id}' ? '${set.chestType}' : `).join('') + "''")
  .replace('CHEST_POOL_LOOKUP', Object.entries(CHEST_POOLS).map(([type,ids])=>`(r.chestType == '${type}' ? ${JSON.stringify(ids)} : `).join('')+'[])'+')'.repeat(Object.keys(CHEST_POOLS).length-1))
  .replace('CHEST_SUPPORT_LOOKUP', Object.entries(CHEST_SUPPORTS).map(([game,items])=>`(r.gameId == '${game}' ? ${JSON.stringify(items.map(item=>item.key))} : `).join('')+'[])'+')'.repeat(Object.keys(CHEST_SUPPORTS).length-1));
chestRules = chestRules.replace('HOURLY_SUPPORT_LOOKUP', Object.entries(CHEST_SUPPORTS).map(([game,items])=>`(r.gameId == '${game}' ? ${JSON.stringify(items.map(item=>item.key))} : `).join('')+'[])'+')'.repeat(Object.keys(CHEST_SUPPORTS).length-1));
chestRules = chestRules.replaceAll('HOURLY_GIFT_SECONDS', String(HOURLY_GIFT_MS / 1000));
chestRules = chestRules.replaceAll('HOURLY_TEST_TICKETS',String(HOURLY_GIFT_TEST_TICKETS)).replaceAll('HOURLY_COIN_VALUES',JSON.stringify([...HOURLY_GIFT_TEST_COINS,100]));
section = section.replace('CHEST_CONTRACT',()=>chestRules);
let wheelRules = await fs.readFile('design/rewards-liveops/wheel-rules.template.txt','utf8');
// Exact generated alternation keeps catalog membership identical without spending
// one Rules expression per literal ID on the already-bounded late-ad path.
const poolPattern = ids => JSON.stringify(`^(${ids.map(id=>id.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|')})$`);
const wheelPoolChoice = Object.entries(WHEEL_POOLS).map(([type,ids])=>`w.box == '${type}' ? (w.version == 2 ? w.itemId.matches(${poolPattern(type==='cosmetic'?ids.filter(id=>!id.startsWith('starter-')):ids)}) : w.itemId.matches(${poolPattern(ids)})) : `).join('')+'false';
const mysteryPoolChoice = Object.entries(CHEST_POOLS).map(([type,ids])=>`w.chestType == '${type}' ? (w.version == 2 ? w.itemId.matches(${poolPattern(LEGACY_CHEST_POOLS[type])}) : w.itemId.matches(${poolPattern(ids)})) : `).join('')+'false';
wheelRules=wheelRules.replace('WHEEL_POOL_ITEM',`w.box == 'mystery' ? (${mysteryPoolChoice}) : (${wheelPoolChoice})`)
  .replace('WHEEL_POOL_EXISTS',`w.box == 'mystery' ? w.chestType in ${JSON.stringify(Object.keys(CHEST_POOLS).filter(type=>CHEST_POOLS[type].length))} : w.box in ${JSON.stringify(Object.keys(WHEEL_POOLS).filter(type=>WHEEL_POOLS[type].length))}`)
  .replace('WHEEL_SUPPORT_KEYS',Object.entries(CHEST_SUPPORTS).map(([game,items])=>`game == '${game}' ? ${JSON.stringify(items.map(item=>item.key))} : `).join('')+'[]')
  .replace('WHEEL_SUPPORT_LABEL',`${JSON.stringify(Object.fromEntries(Object.entries(CHEST_SUPPORTS).map(([game,items])=>[game,Object.fromEntries(items.map(item=>[item.key,item.label]))])))}.get(game,{}).get(key,'')`)
  .replace('WHEEL_PAST_AD_KEYS',[0,10,20].map(start=>{
    const indices=Array.from({length:Math.min(10,29-start)},(_,i)=>start+i),key=i=>`(ads[${i}].day * 11 + ads[${i}].ordinal)`;
    return `(count >= ${start+indices.length} ? [${indices.map(key).join(',')}] : [${indices.map(i=>`(count > ${i} ? ${key(i)} : -1)`).join(',')}])`;
  }).reduce((expression,group)=>expression?`${expression}.concat(${group})`:group,''))
  .replace('WHEEL_PAST_AD_FORBIDDEN',Array.from({length:10},(_,i)=>`ordinal == ${i+1} ? [${Array.from({length:10-i},(_,j)=>`base + ${i+j+1}`).join(',')}] : `).join('')+'[]');
section=section.replace('WHEEL_CONTRACT',()=>wheelRules);
let missionRules = await fs.readFile('design/rewards-liveops/mission-rules.template.txt','utf8');
missionRules = missionRules.replace('MISSION_LOGIN_COINS',JSON.stringify(LOGIN_REWARDS.map(reward=>reward.coins)))
  .replace('MISSION_LOGIN_HINT_GAMES',JSON.stringify(LOGIN_REWARDS.slice(0,6).map(reward=>reward.gameId)));
section=section.replace('MISSION_CONTRACT',()=>missionRules);
section=section.replaceAll('DAILY_NO_HINT_TARGET',String(DAILY.find(item=>item.id==='win-without-hint').target));
section = section.replaceAll('LETTER_REQUIREMENTS',JSON.stringify(Object.fromEntries(LETTER_SETS.map(set=>[set.id,set.required])))).replaceAll('LETTER_SET_IDS',JSON.stringify(LETTER_SETS.map(set=>set.id))).replaceAll('LETTER_REWARDS',JSON.stringify(LETTER_REWARD_ITEMS.map(item=>item.id)));
section = section.replaceAll('LETTER_SALE_PRICE', String(LETTER_SELL_COINS));
section=section.replaceAll('LETTER_REQUIREMENT_LOOKUP',LETTER_SETS.map(set=>`setId == '${set.id}' ? ${JSON.stringify(set.required)}.get(key,0) : `).join('')+'0');
section=section.replaceAll('LETTER_REQUIREMENT_MAP',LETTER_SETS.map(set=>`setId == '${set.id}' ? ${JSON.stringify(set.required)} : `).join('')+'{}');
section=section.replace('LETTER_EXCHANGE_VALUES',LETTER_ALPHABET.map(letter=>`        && (!keys.hasAny(['${letter}']) || rewardExchangeValue(n.counts.get('${letter}',0),o.counts.get('${letter}',0),required.get('${letter}',0)))`).join('\n'));
const letterKeys = `[${LETTER_ALPHABET.map(letter=>`'${letter}'`).join(',')}]`;
section = section.replaceAll('LETTER_KEY_COUNT',String(LETTER_ALPHABET.length)).replaceAll('LETTER_KEYS',letterKeys).replace('LETTER_VALUES',LETTER_ALPHABET.map(letter=>`        && (!changed.hasAny(['${letter}']) || rewardLetterValue(n,o,'${letter}'))`).join('\n'));
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
