import { CHEST_SUPPORTS } from './chestConfig.js';
import { GAMEPLAY_LIMITS } from '../gameplayTuning.js';
// Temporary 10-second interval requested for gift testing; production policy is 60 minutes.
export const HOURLY_GIFT_MS = 10 * 1000;
export const HOURLY_GIFT_TEST_TICKETS = 10;
export const HOURLY_GIFT_TEST_COINS = Object.freeze([5,10]);
const readableCoins = [...HOURLY_GIFT_TEST_COINS,100];
export const hourlyGiftTicketCount = reward => reward.kind === 'ticket' ? reward.tickets ?? 1 : 0;
const games = Object.freeze(Object.keys(CHEST_SUPPORTS));
const integer = n => Number.isSafeInteger(n) && n >= 0;
const operationId = value => typeof value === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(value);
const invalid = () => { throw Object.assign(new Error('Quà tặng chưa toàn vẹn.'), {code:'rewards/invalid-operation'}); };
export function validGiftReward(value) {
  if (!value || !['coins','ticket','support'].includes(value.kind) || !integer(value.coins)) return false;
  if(Object.hasOwn(value,'tickets')&&(value.kind!=='ticket'||value.tickets!==HOURLY_GIFT_TEST_TICKETS))return false;
  const support = CHEST_SUPPORTS[value.gameId]?.some(item => item.key === value.key);
  return value.kind === 'support' ? value.coins === 0 && support
    : value.kind === 'ticket' ? value.coins === 0 && value.gameId === null && value.key === null
    : readableCoins.includes(value.coins) && value.gameId === null && value.key === null || value.coins === GAMEPLAY_LIMITS.itemOverflowCoins && support;
}
export function normalizeHourlyGift(value) {
  if (value === undefined) return null;
  const claimedAt = typeof value?.claimedAt?.toMillis === 'function' ? Math.ceil(value.claimedAt.toMillis()) : value?.claimedAt;
  if (!value || value.version !== 1 || !integer(value.sequence) || value.sequence < 1 || !integer(claimedAt)
    || !validGiftReward(value.last) || value.last.sequence !== value.sequence || !operationId(value.last.operation)) invalid();
  return {version:1, sequence:value.sequence, claimedAt, last:{...value.last}};
}
export function hourlyGiftCandidate(random) {
  const sample = () => { const n = random(); if (!(n >= 0 && n < 1)) invalid(); return n; };
  const slot = Math.floor(sample()*4);
  if(slot===0)return {kind:'ticket',tickets:HOURLY_GIFT_TEST_TICKETS,coins:0,gameId:null,key:null};
  if(slot<3)return {kind:'coins',coins:HOURLY_GIFT_TEST_COINS[slot-1],gameId:null,key:null};
  const gameId = games[Math.floor(sample()*games.length)];
  return {kind:'support',coins:0,gameId,key:CHEST_SUPPORTS[gameId][Math.floor(sample()*CHEST_SUPPORTS[gameId].length)].key};
}
export function claimHourlyGift(previous, command, now, supportCount = 0) {
  const gift = normalizeHourlyGift(previous);
  if (gift?.last.operation === command.operation) return {state:gift,result:gift.last,applied:false};
  if (gift && now < gift.claimedAt + HOURLY_GIFT_MS) throw Object.assign(new Error('Chưa đến giờ nhận quà tiếp theo.'),{code:'rewards/gift-cooldown'});
  if (!integer(now) || !operationId(command.operation) || command.sequence !== (gift?.sequence || 0)+1 || !validGiftReward(command.candidate)) invalid();
  let result = {...command.candidate,operation:command.operation,sequence:command.sequence};
  if (result.kind === 'support') {
    if (!integer(supportCount) || supportCount > GAMEPLAY_LIMITS.itemCount) invalid();
    if (supportCount === GAMEPLAY_LIMITS.itemCount) result = {...result,kind:'coins',coins:GAMEPLAY_LIMITS.itemOverflowCoins};
  }
  return {state:{version:1,sequence:command.sequence,claimedAt:now,last:result},result,applied:true};
}
