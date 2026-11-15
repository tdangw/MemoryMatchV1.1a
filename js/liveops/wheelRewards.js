import { CHEST_POLICY, CHEST_POOLS, LEGACY_CHEST_POOLS, CHEST_SUPPORTS } from './chestConfig.js';
import { WHEEL_POOLS, wheelItem } from './wheelCatalog.js';

export const WHEEL_VERSION = 3;
export const WHEEL_ODDS_VERSION = 2;
const LEGACY_WEIGHTS = Object.freeze([40,25,15,1,2,2,1,2,2,10]);
export const supportedWheelVersion = version => version === 2 || version === WHEEL_VERSION;
export const WHEEL_ANGLE = 36;
export const WHEEL_ROLL_COUNT = 6;
export const MYSTERY_CHEST_TYPES = Object.freeze(['c','avatar','frame','badge']);
export const WHEEL_SLOTS = Object.freeze([
  {id:'coins-five',kind:'coins',coins:5,weight:30,label:'5 Xu'},
  {id:'coins-ten',kind:'coins',coins:10,weight:25,label:'10 Xu'},
  {id:'coins-random',kind:'randomCoins',weight:20,label:'Rương Xu'},
  {id:'box-mystery',kind:'box',box:'mystery',weight:1,label:'Rương Ngẫu nhiên'},
  {id:'box-cosmetic',kind:'box',box:'cosmetic',weight:2,label:'Rương Ngoại hình'},
  {id:'box-flip',kind:'box',box:'flip',weight:2,label:'Rương Lật thẻ'},
  {id:'box-theme',kind:'box',box:'theme',weight:1,label:'Rương Chủ đề'},
  {id:'box-path',kind:'box',box:'path',weight:2,label:'Rương Đường nối'},
  {id:'box-exit',kind:'box',box:'exit',weight:2,label:'Rương Xóa thẻ'},
  {id:'box-support',kind:'box',box:'support',weight:15,label:'Rương Hỗ trợ'},
].map(Object.freeze));
const GAMES = Object.freeze(Object.keys(CHEST_SUPPORTS));
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const unit = value => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value < 1;
const invalid = () => {throw new Error('Quà vòng quay chưa toàn vẹn. Dữ liệu được giữ nguyên.');};
const choose = (items,roll) => items[Math.floor(roll * items.length)];

export function createWheelRolls(random) {
  const rolls=Array.from({length:WHEEL_ROLL_COUNT},()=>random());
  if(!rolls.every(unit))invalid();
  return rolls;
}
export function wheelSector(roll,oddsVersion=WHEEL_ODDS_VERSION) {
  if(!unit(roll)||![1,WHEEL_ODDS_VERSION].includes(oddsVersion))invalid();
  let cumulative=0;
  for(let i=0;i<WHEEL_SLOTS.length;i++){
    cumulative+=oddsVersion===1?LEGACY_WEIGHTS[i]:WHEEL_SLOTS[i].weight;
    if(roll*100<cumulative)return i;
  }
  invalid();
}
/** Pure replay of durable entropy. Call once using canonical ownership, then save the candidate. */
export function createWheelCandidate(rolls,ownedIds=[],version=WHEEL_VERSION,oddsVersion=WHEEL_ODDS_VERSION) {
  if(!supportedWheelVersion(version))invalid();
  if(!Array.isArray(rolls)||rolls.length!==WHEEL_ROLL_COUNT||!Array.from(rolls).every(unit))invalid();
  const sector=wheelSector(rolls[0],oddsVersion),slot=WHEEL_SLOTS[sector],base={version,sector};
  if(slot.kind==='coins')return {...base,kind:'coins',coins:slot.coins};
  if(slot.kind==='randomCoins')return {...base,kind:'coins',coins:5+Math.floor(rolls[1]*46)};
  const owned=new Set(ownedIds),box={...base,box:slot.box};
  const support=(gameRoll,itemRoll)=>{const gameId=choose(GAMES,gameRoll),item=choose(CHEST_SUPPORTS[gameId],itemRoll);return {...box,kind:'support',coins:0,gameId,key:item.key};};
  if(slot.box==='support')return support(rolls[1],rolls[2]);
  const item=(pool,roll)=>{
    if(version===WHEEL_VERSION&&pool.some(id=>wheelItem(id)?.category==='cosmetic'))return {...box,kind:'item',coins:0,itemId:choose(pool,roll)};
    const missing=pool.filter(id=>!owned.has(id));
    return missing.length?{...box,kind:'item',coins:0,itemId:choose(missing,roll)}:{...box,kind:'coins',coins:100,reason:'full'};
  };
  if(slot.box!=='mystery')return item(version===2&&slot.box==='cosmetic'?WHEEL_POOLS.cosmetic.filter(id=>!id.startsWith('starter-')):WHEEL_POOLS[slot.box],rolls[1]);
  box.chestType=choose(MYSTERY_CHEST_TYPES,rolls[1]);
  const policy=CHEST_POLICY[box.chestType],pool=(version===2?LEGACY_CHEST_POOLS:CHEST_POOLS)[box.chestType];
  if(version===2&&pool&&pool.every(id=>owned.has(id)))return {...box,kind:'coins',coins:100,reason:'full'};
  if(rolls[2]<policy.coinChance)return {...box,kind:'coins',coins:policy.coins,reason:'coins'};
  if(rolls[2]<policy.coinChance+policy.supportChance)return support(rolls[3],rolls[4]);
  return item(pool,rolls[4]);
}

export function wheelCandidatePool(candidate) {
  if(candidate.box==='mystery')return (candidate.version===2?LEGACY_CHEST_POOLS:CHEST_POOLS)[candidate.chestType]||[];
  const pool=WHEEL_POOLS[candidate.box]||[];
  return candidate.version===2&&candidate.box==='cosmetic'?pool.filter(id=>!id.startsWith('starter-')):pool;
}
/** Historical receipts validate without needing today's ownership. No unknown fields survive. */
export function normalizeWheelCandidate(value) {
  if(!record(value)||!supportedWheelVersion(value.version)||!Number.isInteger(value.sector)||value.sector<0||value.sector>=WHEEL_SLOTS.length
    ||!['coins','item','support'].includes(value.kind)||!Number.isSafeInteger(value.coins)||value.coins<0)invalid();
  const slot=WHEEL_SLOTS[value.sector],fields=['version','sector','kind','coins'];
  if(slot.kind==='coins'||slot.kind==='randomCoins'){
    if(value.kind!=='coins'||(slot.kind==='coins'?value.coins!==slot.coins:value.coins<5||value.coins>50))invalid();
  }else{
    fields.push('box');if(value.box!==slot.box)invalid();
    if(value.box==='mystery'){fields.push('chestType');if(!MYSTERY_CHEST_TYPES.includes(value.chestType))invalid();}
    if(value.kind==='support'){
      fields.push('gameId','key');
      if(value.box!=='support'&&value.box!=='mystery'||value.coins!==0||!GAMES.includes(value.gameId)||!CHEST_SUPPORTS[value.gameId].some(item=>item.key===value.key))invalid();
      if(Object.hasOwn(value,'label')){fields.push('label');if(value.label!==CHEST_SUPPORTS[value.gameId].find(item=>item.key===value.key).label)invalid();}
    }else{
      if(value.box==='support')invalid();
      const pool=wheelCandidatePool(value);
      if(value.kind==='item'){
        fields.push('itemId');if(value.coins!==0||!pool.includes(value.itemId))invalid();
      }else{
        fields.push('reason');
        if(value.reason==='coins'){
          if(value.box!=='mystery'||value.coins!==CHEST_POLICY[value.chestType].coins)invalid();
        }else if(value.reason==='full'){
          if(value.version===WHEEL_VERSION&&(value.box==='cosmetic'||value.box==='mystery'))invalid();
          if(!pool.length||value.coins!==100)invalid();
        }else if(value.reason==='duplicate'){
          if(value.version===WHEEL_VERSION&&(value.box==='cosmetic'||value.box==='mystery'))invalid();
          fields.push('itemId');if(value.coins!==100||!pool.includes(value.itemId))invalid();
        }else invalid();
      }
    }
  }
  if(Object.keys(value).length!==fields.length||Object.keys(value).some(key=>!fields.includes(key)))invalid();
  return structuredClone(value);
}
/** Ownership races convert the saved item; they never pick another item or another sector. */
export function resolveWheelCandidate(value,ownedIds=[]) {
  const candidate=normalizeWheelCandidate(value),owned=new Set(ownedIds);
  if(candidate.kind==='item'&&owned.has(candidate.itemId)&&!(candidate.version===WHEEL_VERSION&&wheelItem(candidate.itemId)?.category==='cosmetic'))return normalizeWheelCandidate({...candidate,kind:'coins',coins:100,reason:'duplicate'});
  if(candidate.kind==='coins'&&candidate.reason==='full'&&!wheelCandidatePool(candidate).every(id=>owned.has(id)))invalid();
  if(candidate.kind==='coins'&&candidate.reason==='duplicate'&&!owned.has(candidate.itemId))invalid();
  return candidate;
}
