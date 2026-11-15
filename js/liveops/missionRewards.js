import { CHEST_SUPPORTS } from './chestConfig.js';

export const WEEKLY_JOURNEY_REWARDS = Object.freeze([
  {points:20,coins:5},{points:50,coins:10},{points:80,coins:10},
].map(reward=>Object.freeze(reward)));

export const LOGIN_REWARDS = Object.freeze([
  [10,'link-connect'],[10,'memory-match'],[15,'triple-connect'],
  [15,'memory-match'],[20,'triple-connect'],[25,'link-connect'],[50,null],
].map(([coins,gameId])=>Object.freeze({coins,gameId})));
const games=Object.freeze(Object.keys(CHEST_SUPPORTS));
const invalid=()=>{throw new Error('Quà điểm danh chưa toàn vẹn. Quà được giữ nguyên.');};
export function createLoginCandidate(index,rolls){
  if(!Number.isInteger(index)||index<0||index>6||!Array.isArray(rolls)||rolls.length!==3||rolls.some(n=>!Number.isFinite(n)||n<0||n>=1))invalid();
  const reward=LOGIN_REWARDS[index];
  return {version:1,index,coins:reward.coins,supports:reward.gameId?[{gameId:reward.gameId,key:'hint'}]:games.map((gameId,i)=>({gameId,key:CHEST_SUPPORTS[gameId][Math.floor(rolls[i]*CHEST_SUPPORTS[gameId].length)].key}))};
}
export function normalizeLoginCandidate(value){
  if(!value||Object.keys(value).length!==4||value.version!==1||!Number.isInteger(value.index)||value.index<0||value.index>6||value.coins!==LOGIN_REWARDS[value.index].coins||!Array.isArray(value.supports))invalid();
  const expected=LOGIN_REWARDS[value.index].gameId;
  if(value.supports.length!==(expected?1:3))invalid();
  for(const [i,support]of value.supports.entries())if(!support||Object.keys(support).length!==2||support.gameId!==(expected||games[i])||!CHEST_SUPPORTS[support.gameId].some(item=>item.key===support.key)||expected&&support.key!=='hint')invalid();
  return structuredClone(value);
}
export function normalizeLoginReward(value){
  if(!value||Object.keys(value).length!==6||!Number.isSafeInteger(value.day)||value.day<0||typeof value.operation!=='string'||!/^[A-Za-z0-9_-]{1,128}$/.test(value.operation))invalid();
  const {day,operation,...candidate}=value;return {...normalizeLoginCandidate(candidate),day,operation};
}
