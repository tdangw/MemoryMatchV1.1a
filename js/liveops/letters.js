import { CHEST_TYPES } from './chestConfig.js';
import { LETTER_REWARD_ITEMS } from './letterCatalog.generated.js';
import { LETTER_SETS, LETTER_FALLBACK_COINS, LETTER_ALPHABET, LETTER_SELL_COINS } from './config.js';
const integer = n=>Number.isSafeInteger(n)&&n>=0;
const record = n=>n!==null&&typeof n==='object'&&!Array.isArray(n);
export function normalizeLetterCounts(value = {}) {
  if(!record(value)||Object.keys(value).some(letter=>!LETTER_ALPHABET.includes(letter)||!integer(value[letter])))
    throw new Error('Bản lưu chữ chưa toàn vẹn. Dữ liệu được giữ nguyên.');
  return {...value};
}
export function normalizeLetters(value) {
  if(value===undefined)return {counts:{},earned:{},sequence:0,last:null};
  if(!record(value)||!integer(value.sequence)||!(value.last===null||record(value.last)&&value.last.sequence===value.sequence
    &&typeof value.last.operation==='string'&&/^[A-Za-z0-9_-]{1,128}$/.test(value.last.operation)))throw new Error('Bản lưu chữ chưa toàn vẹn.');
  const last=value.last;
  if(last){
    if(!['sell','fuse','exchange'].includes(last.kind))throw new Error('Kết quả đổi chữ chưa được hỗ trợ.');
    if(last.kind==='sell'&&(!LETTER_ALPHABET.includes(last.letter)||!integer(last.quantity)||last.quantity<1||last.coins!==last.quantity*LETTER_SELL_COINS))throw new Error('Kết quả bán chữ chưa toàn vẹn.');
    if(last.kind==='fuse'&&(!LETTER_ALPHABET.includes(last.letter)||!LETTER_ALPHABET.includes(last.received)||last.coins!==0))throw new Error('Kết quả ghép chữ chưa toàn vẹn.');
    if(last.kind==='exchange'&&!last.chestType&&(!LETTER_SETS.some(set=>set.id===last.setId)||(last.itemId===null?last.coins!==LETTER_FALLBACK_COINS:!LETTER_REWARD_ITEMS.some(item=>item.id===last.itemId)||last.coins!==0)))throw new Error('Kết quả đổi bộ chữ chưa toàn vẹn.');
  }
  if(last?.chestType && (last.kind!=='exchange'||!CHEST_TYPES.includes(last.chestType)||last.coins!==0||last.itemId!==null||!LETTER_SETS.some(set=>set.id===last.setId&&set.chestType===last.chestType)))throw new Error('Loại rương đổi chữ chưa toàn vẹn.');
  return {...structuredClone(value),counts:normalizeLetterCounts(value.counts),earned:normalizeLetterCounts(value.earned)};
}
export function creditLetters(previous, earned) {
  const state=normalizeLetters(previous),incoming=normalizeLetterCounts(earned);
  for(const letter of LETTER_ALPHABET){
    const total=incoming[letter]||0,old=state.earned[letter]||0;
    if(total<old)throw new Error('Cần khôi phục kho chữ mới nhất.');
    if(total>old){state.counts[letter]=(state.counts[letter]||0)+total-old;state.earned[letter]=total;
      if(!integer(state.counts[letter]))throw new Error('Kho chữ đã đầy.');}
  }
  return state;
}
export function mutateLetters(previous, command, randomLetter) {
  const state=normalizeLetters(previous);
  if(state.last?.operation===command.operation)return {state,coins:0,result:state.last};
  if(command.sequence!==state.sequence+1)throw new Error('Lượt đổi chữ đã được xử lý. Hãy tải lại kho chữ.');
  const count=state.counts[command.letter]||0;
  if(!LETTER_ALPHABET.includes(command.letter))throw new Error('Chữ không hợp lệ.');
  let coins=0,result;
  if(command.type==='sellLetter'){
    if(!Number.isSafeInteger(command.quantity)||command.quantity<1||command.quantity>count)throw new Error('Không đủ chữ để bán.');
    coins=command.quantity*LETTER_SELL_COINS;if(!integer(coins))throw new Error('Số Xu vượt giới hạn.');
    state.counts[command.letter]=count-command.quantity;
    result={kind:'sell',letter:command.letter,quantity:command.quantity,coins};
  }else if(command.type==='fuseLetter'){
    if(count<3||!LETTER_ALPHABET.includes(randomLetter))throw new Error('Cần đủ 3 chữ giống nhau.');
    state.counts[command.letter]=count-3;state.counts[randomLetter]=(state.counts[randomLetter]||0)+1;
    if(!integer(state.counts[randomLetter]))throw new Error('Kho chữ đã đầy.');
    result={kind:'fuse',letter:command.letter,received:randomLetter,coins:0};
  }else throw new Error('Thao tác chữ không hợp lệ.');
  state.sequence++;state.last={...result,sequence:state.sequence,operation:command.operation};
  return {state,coins,result:state.last};
}

/** Counts are previewed per recipe; no letter is reserved until the atomic exchange. */
export function letterSetSlots(set, counts) {
  const remaining=normalizeLetterCounts(counts);
  return [...set.label].map(letter=>{
    if(letter===' ')return {letter,space:true,filled:false};
    const filled=(remaining[letter]||0)>0;if(filled)remaining[letter]--;
    return {letter,space:false,filled};
  });
}
export function letterProgressLabel(set,counts){return letterSetSlots(set,counts).map(slot=>slot.space?' ':slot.filled?slot.letter:'-').join('');}

/** The pool has a stable display order; the exact next reward is visible before exchanging. */
export function nextLetterReward(ownedIds){const owned=new Set(ownedIds);return LETTER_REWARD_ITEMS.find(item=>!owned.has(item.id))||null;}
export function exchangeLetterSet(previous,command,ownedIds,{chestsEnabled=false}={}){
  const state=normalizeLetters(previous);
  if(state.last?.operation===command.operation)return {state,coins:0,item:null,result:state.last};
  if(command.sequence!==state.sequence+1)throw new Error('Lượt đổi chữ đã được xử lý. Hãy tải lại kho chữ.');
  const set=LETTER_SETS.find(v=>v.id===command.setId);if(!set)throw new Error('Bộ chữ không hợp lệ.');
  for(const [letter,amount]of Object.entries(set.required))if((state.counts[letter]||0)<amount)throw new Error('Chưa đủ chữ để đổi quà.');
  for(const [letter,amount]of Object.entries(set.required))state.counts[letter]-=amount;
  const item=chestsEnabled?null:nextLetterReward(ownedIds),coins=chestsEnabled?0:item?0:LETTER_FALLBACK_COINS;
  state.sequence++;state.last={kind:'exchange',setId:set.id,itemId:item?.id||null,coins,...(chestsEnabled?{chestType:set.chestType}:{}),sequence:state.sequence,operation:command.operation};
  return {state,coins,item,chestType:chestsEnabled?set.chestType:null,result:state.last};
}
