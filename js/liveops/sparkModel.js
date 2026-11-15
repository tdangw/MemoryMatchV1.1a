import { normalizeHourlyGift, claimHourlyGift, hourlyGiftTicketCount } from './hourlyGift.js';
import {normalizeStorageUnlocks,unlockStorageSlot} from './storageCapacity.js';
import {assertStorageAccess} from './storageModel.js';
import { normalizeChests, normalizeFestival, earnChest, claimFestival, openChest, sellChest, creditSourceChests } from './chests.js';
import { normalizeLetterCounts, normalizeLetters, creditLetters, mutateLetters, exchangeLetterSet, nextLetterReward } from './letters.js';
import { GROUP_LOOT_DROP_RATES, LETTER_ALPHABET, ACTIVE_EVENT_COLLECTION_ID, eventCollection } from './config.js';
import { DAY_MS, DAILY, WEEKLY, LOGIN, WHEEL, periods, normalizeFact } from './model.js';
import { normalizeWheelCandidate, resolveWheelCandidate, supportedWheelVersion, WHEEL_VERSION } from './wheelRewards.js';
import { cosmeticDefinition } from '../progression/cosmeticCatalog.js';
import { normalizeCosmeticProgress, seedOwnedCosmetics, receiveCosmeticCopies, mutateCosmeticFragments } from '../progression/cosmeticProgression.js';
import { GAMEPLAY_LIMITS } from '../gameplayTuning.js';
import { normalizeLoginCandidate, normalizeLoginReward, WEEKLY_JOURNEY_REWARDS } from './missionRewards.js';
export const AD_DAILY_LIMIT = 10;
export const EVENT_ID = 'firefly-festival-01';
export const MAX_LOCAL_REWARD_OPERATIONS = 512;
const record = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const integer = v => Number.isSafeInteger(v) && v >= 0;
const id = v => typeof v === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(v);
const counters = () => ({ wins: 0, matches: 0, noHint: 0, visits: 0, claimed: [] });
const fail = () => { throw new Error('Bản lưu phần thưởng chưa toàn vẹn. Dữ liệu được giữ nguyên.'); };
export function initialSparkState(now) {
  const p = periods(now);
  return { version: 1, revision: 0, ...p, daily: counters(), weekly: counters(), loginNext: 0, loginDay: -1,
    letters:normalizeLetters(),
    spins: { free: null, ads: [], pastAds: [], ticket: null }, tickets: 0, ticketEarned: 0, ticketSpent: 0,
    cosmetics: { collectionId: ACTIVE_EVENT_COLLECTION_ID, week:p.week, points:0, granted:[] },
    event: { id: EVENT_ID, week: p.week, points: 0, day: p.day, dailyPoints: 0, claimed: [] } };
}
export function normalizeSparkState(value) {
  if (!record(value) || value.version !== 1 || !integer(value.revision) || !integer(value.day) || !integer(value.week)
    || !integer(value.tickets) || !integer(value.ticketEarned) || !integer(value.ticketSpent)
    || !Number.isInteger(value.loginNext) || value.loginNext < 0 || value.loginNext > 6
    || !Number.isInteger(value.loginDay) || value.loginDay < -1 || value.loginDay > value.day) fail();
  for (const [name, catalog] of [['daily', DAILY], ['weekly', WEEKLY]]) {
    const v = value[name];
    if (!record(v) || !['wins', 'matches', 'noHint', 'visits'].every(k => integer(v[k]) && v[k] <= 1000000)
      || !Array.isArray(v.claimed) || new Set(v.claimed).size !== v.claimed.length
      || v.claimed.some(k => k !== 'bonus' && !catalog.some(item => item.id === k))) fail();
  }
  const e = value.event, s = value.spins;
  if (!record(e) || e.id !== EVENT_ID || !integer(e.week) || !integer(e.day)
    || !integer(e.points) || e.points > 100
    || !integer(e.dailyPoints) || e.dailyPoints > 40
    || !Array.isArray(e.claimed) || e.claimed.some(n => ![20, 50, 80].includes(n)) || new Set(e.claimed).size !== e.claimed.length
    || !record(s) || !Array.isArray(s.ads) || s.ads.length > AD_DAILY_LIMIT || !Array.isArray(s.pastAds) || s.pastAds.length > 3 * AD_DAILY_LIMIT) fail();
  const c = value.cosmetics;
  if (!record(c) || !eventCollection(c.collectionId) || !integer(c.week) || !integer(c.points) || c.points > 100
    || !Array.isArray(c.granted) || c.granted.some(key => !eventCollection(key)) || new Set(c.granted).size !== c.granted.length) fail();
  const results = [s.free, ...s.ads, ...s.pastAds, s.ticket].filter(Boolean);
  for (const r of results) {
    if (!record(r) || !id(r.operation) || !['free','ad','ticket'].includes(r.source)||!integer(r.day))fail();
    if(Object.hasOwn(r,'wheel')){const prize=normalizeWheelCandidate(r.wheel);if(r.sector!==prize.sector||r.coins!==prize.coins)fail();}
    else if(!Number.isInteger(r.sector)||r.sector<0||r.sector>=8||r.coins!==WHEEL[r.sector])fail();
  }
  if (s.free && s.free.source !== 'free' || s.ticket && (s.ticket.source !== 'ticket' || s.ticket.sequence !== value.ticketSpent)
    || s.ads.some((r, i) => r.source !== 'ad' || r.ordinal !== i + 1)) fail();
  const { rootRevision, fingerprint, updatedAt, ...state } = structuredClone(value);
  state.letters = normalizeLetters(value.letters);
  if(value.storageUnlocks!==undefined)state.storageUnlocks=normalizeStorageUnlocks(value.storageUnlocks);
  if(value.cosmeticProgress!==undefined)state.cosmeticProgress=normalizeCosmeticProgress(value.cosmeticProgress);
  if(value.loginReward!==undefined&&value.loginReward!==null){state.loginReward=normalizeLoginReward(value.loginReward);if(state.loginReward.day>state.day)fail();}
  if (value.hourlyGift !== undefined) state.hourlyGift = normalizeHourlyGift(value.hourlyGift);
  if(value.pendingWheel!==undefined&&value.pendingWheel!==null){
    const pending=value.pendingWheel;
    const reserved=pending.phase==='reserved-ad';
    if(!record(pending)||Object.keys(pending).length!==(reserved?6:3)||!id(pending.operation)||!integer(pending.day)||pending.day>value.day)fail();
    const prize=normalizeWheelCandidate(pending.wheel);if(!reserved&&prize.kind!=='support')fail();
    if(reserved&&(!Number.isInteger(pending.ordinal)||pending.ordinal<1||pending.ordinal>10||!integer(pending.earnedAt)))fail();
    state.pendingWheel=reserved?{...pending,wheel:prize}:{operation:pending.operation,day:pending.day,wheel:prize};
  }
  if(value.chests!==undefined||value.festival!==undefined){ if(value.chests===undefined||value.festival===undefined)fail(); state.chests=normalizeChests(value.chests);state.festival=normalizeFestival(value.festival); }
  return state;
}
export function normalizeSparkSave(value) {
  if (value === undefined) return { version: 1, ownerUid: null, economyRevision:0, state: null, ticketEarned: 0, fireflyEarned:0, letterEarned:{}, drops: {}, settled: {} };
  if (!record(value) || value.version !== 1 || value.ownerUid !== null && !id(value.ownerUid) || !integer(value.ticketEarned) || !record(value.drops) || !record(value.settled)
    || Object.keys(value.drops).length > 18 || Object.keys(value.settled).length > 18) fail();
  if(value.syncPolicy!==undefined&&value.syncPolicy!=='snapshot-v1')fail();
  if(value.economyRevision !== undefined && !integer(value.economyRevision))fail();
  const state = value.state === null ? null : normalizeSparkState(value.state);
  if(value.offline!==undefined){
    const out=value.offline;
    if(!record(out)||out.version!==1||!id(out.uid)||!id(out.profileId)||!integer(out.baseRevision)
      ||out.environment!==undefined&&!id(out.environment)
      ||!Array.isArray(out.ownedIds)||!Array.isArray(out.wheelOwnedIds)||out.ownedIds.length>101||out.wheelOwnedIds.length>1024
      ||out.ownedIds.some(v=>!cosmeticDefinition(v))||out.wheelOwnedIds.some(v=>typeof v!=='string')
      ||!Array.isArray(out.operations)||out.operations.length<1||out.operations.length>MAX_LOCAL_REWARD_OPERATIONS)fail();
    const ids=new Set();
    for(const entry of out.operations){
      if(!record(entry)||!record(entry.command)||!id(entry.command.operation)||ids.has(entry.command.operation)
        ||!integer(entry.now)||!integer(entry.coinsBalance)||!integer(entry.supportCount)||entry.supportCount>GAMEPLAY_LIMITS.itemCount
        ||typeof entry.outcome!=='string'||entry.outcome.length>32768)fail();
      ids.add(entry.command.operation);
    }
  }
  for (const [key, marker] of Object.entries(value.drops)) {
    if (!/^(memory-match|link-connect|triple-connect):(easy|normal|hard|superHard|challenge|endless)$/.test(key)
      || !record(marker) || !id(marker.attempt) || !integer(marker.wave) || marker.wave < 1
      || !Array.isArray(marker.groups) || marker.groups.length > 1000 || marker.groups.some(g => typeof g !== 'string' || g.length > 400)) fail();
  }
  for (const [key, attempt] of Object.entries(value.settled))
    if (!/^(memory-match|link-connect|triple-connect):(easy|normal|hard|superHard|challenge|endless)$/.test(key) || !id(attempt)) fail();
  if (value.state && value.ticketEarned < value.state.ticketEarned || !integer(value.fireflyEarned??0) || (value.fireflyEarned??0)<(value.state?.festival?.earnedTotal||0)) fail();
  return { ...structuredClone(value), state, economyRevision:value.economyRevision||0, letterEarned:normalizeLetterCounts(value.letterEarned),fireflyEarned:value.fireflyEarned??0 };
}
export function mergeSparkSave(previous, incoming) {
  const a = normalizeSparkSave(previous), b = normalizeSparkSave(incoming);
  if ((b.state?.revision || 0) < (a.state?.revision || 0)) return a;
  if(a.offline&&b.offline&&b.offline.baseRevision<a.offline.baseRevision)return a;
  if(!a.offline&&b.offline&&b.offline.baseRevision<(a.state?.revision||0)&&(b.state?.revision||0)<=(a.state?.revision||0))return a;
  // Persistence owns drop/settlement checkpoints. Stale appearance edits cannot undo them.
  const letterEarned = {...b.letterEarned};
  for(const [letter,amount] of Object.entries(a.letterEarned))letterEarned[letter]=Math.max(amount,letterEarned[letter]||0);
  return { ...b, fireflyEarned:Math.max(a.fireflyEarned,b.fireflyEarned), economyRevision:Math.max(a.economyRevision,b.economyRevision), letterEarned, ticketEarned: Math.max(a.ticketEarned, b.ticketEarned), drops: { ...b.drops, ...a.drops }, settled: { ...b.settled, ...a.settled } };
}
export function applyTicketDrop(previous, input, random = secureUnit) {
  return applySpecialDrop(previous,input,{ticketRandom:random,dropLetters:false});
}
export function applySpecialDrop(previous, { gameId, mode, attempt, wave, group, special }, {ticketRandom=secureUnit,letterRandom=secureUnit,fireflyRandom=secureUnit,dropLetters=true,dropFireflies=false}={}) {
  const save = normalizeSparkSave(previous);
  const rates = GROUP_LOOT_DROP_RATES[special ? 'special' : 'normal'];
  const key = `${gameId}:${mode}`;
  if (!/^(memory-match|link-connect|triple-connect):(easy|normal|hard|superHard|challenge|endless)$/.test(key)
    || !id(attempt) || !integer(wave) || wave < 1 || typeof group !== 'string' || !group || group.length > 400) fail();
  let marker = save.drops[key];
  if (!marker || marker.attempt !== attempt || marker.wave !== wave) marker = { attempt, wave, groups: [] };
  if (marker.groups.includes(group)) return { save, dropped: false };
  if (marker.groups.length >= 1000) fail();
  const sample = ticketRandom(); if (!(sample >= 0 && sample < 1)) fail();
  const dropped = sample < rates.ticket;
  marker.groups.push(group); save.drops[key] = marker;
  if (dropped) { save.ticketEarned++; if (!integer(save.ticketEarned)) fail(); }
  let letter=null;
  if(dropLetters){
    const chance=letterRandom();if(!(chance>=0&&chance<1))fail();
    if(chance<rates.letter){const choice=letterRandom();if(!(choice>=0&&choice<1))fail();
      letter=LETTER_ALPHABET[Math.floor(choice*LETTER_ALPHABET.length)];save.letterEarned[letter]=(save.letterEarned[letter]||0)+1;
      if(!integer(save.letterEarned[letter]))fail();}
  }
  let firefly=false;
  if(dropFireflies){const chance=fireflyRandom();if(!(chance>=0&&chance<1))fail();firefly=chance<rates.badge;if(firefly){save.fireflyEarned++;if(!integer(save.fireflyEarned))fail();}}
  return { save, dropped, letter, firefly };
}
export function secureUnit() { const bytes = new Uint32Array(1); crypto.getRandomValues(bytes); return bytes[0] / 4294967296; }
export const secureSector = () => Math.floor(secureUnit() * 8);
/** No I/O or presentation. The published snapshot carries all entitlement markers. */
export function transitionSpark(previous, command, { uid, now, sector = 0, ticketEarned = 0, letterEarned = {}, randomLetter = LETTER_ALPHABET[0], ownedItemIds = [], ownedWheelItemIds=ownedItemIds, wheelCandidate, facts = [], festivalEnabled=false, fireflyEarned=0, supportCount=0, loginSupportCounts=[], sourceEarned, cosmeticEnabled=false, coinsBalance } = {}) {
  if (!id(uid) || !integer(ticketEarned)) fail();
  const state = previous ? normalizeSparkState(previous) : initialSparkState(now), receipts = [];
  if(cosmeticEnabled)state.cosmeticProgress=seedOwnedCosmetics(state.cosmeticProgress,ownedItemIds.filter(id=>cosmeticDefinition(id)));
  if(festivalEnabled){state.chests=normalizeChests(state.chests);if(sourceEarned)state.chests=creditSourceChests(state.chests,sourceEarned);state.festival=normalizeFestival(state.festival);if(!integer(fireflyEarned)||fireflyEarned<state.festival.earnedTotal)fail();state.festival.earnedTotal=fireflyEarned;}
  const p = periods(now); if (p.day < state.day || ticketEarned < state.ticketEarned) fail();
  const grant = (key, coins, extra = {}) => receipts.push({ receiptId: `${uid}:${key}`, ownerUid: uid, coins, grantedAt: now, ...extra });
  const addTickets = n => { state.tickets += n; if (!integer(state.tickets)) fail(); };
  const dailyBonus = () => {
    if (DAILY.every(item => state.daily[item.key]>=item.target) && !state.daily.claimed.includes('bonus')) {
      state.daily.claimed.push('bonus'); addTickets(1); grant(`daily:${state.day}:bonus`, 10);
    }
  };
  const claimMission = (period,item) => {
    const missions=state[period],date=period==='daily'?state.day:state.week;
    if (missions[item.key] >= item.target && !missions.claimed.includes(item.id)) {
      missions.claimed.push(item.id); grant(`${period}:${date}:${item.id}`, item.coins);
    }
  };
  const claimWeekly = () => {
    if (WEEKLY.every(item => state.weekly[item.key] >= item.target) && !state.weekly.claimed.includes('bonus')) {
      state.weekly.claimed.push('bonus'); addTickets(2); grant(`weekly:${state.week}:bonus`, 50);
    }
  };
  const eventCoins = () => {
    for(const {points,coins} of WEEKLY_JOURNEY_REWARDS)if(state.event.points>=points&&!state.event.claimed.includes(points)){
      state.event.claimed.push(points);grant(`event:${EVENT_ID}:${state.event.week}:${points}`,coins);
    }
  };
  eventCoins();
  if (p.day !== state.day) { DAILY.forEach(item=>claimMission('daily',item)); dailyBonus(); state.daily = counters(); state.spins.free = null;
    state.spins.pastAds = [...state.spins.pastAds, ...state.spins.ads].filter(r => r.day >= p.day - 3);
    state.spins.ads = []; }
  if (p.week !== state.week) {
    WEEKLY.forEach(item=>claimMission('weekly',item));claimWeekly(); state.weekly = counters(); state.event.points = 0; state.event.claimed = []; state.event.week = p.week; state.cosmetics.week = p.week; state.cosmetics.points = 0;
  }
  if (state.event.day !== p.day) { state.event.day = p.day; state.event.dailyPoints = 0; }
  if (state.cosmetics.collectionId !== ACTIVE_EVENT_COLLECTION_ID) {
    state.cosmetics.collectionId = ACTIVE_EVENT_COLLECTION_ID; state.cosmetics.points = 0;
  }
  Object.assign(state, p);
  state.letters = creditLetters(state.letters,letterEarned);
  addTickets(ticketEarned - state.ticketEarned); state.ticketEarned = ticketEarned;
  for (const item of facts) {
    const fact = normalizeFact(item);
    if (fact.day === null) throw new Error('Ván chơi đang chờ xác nhận kỳ nhiệm vụ.');
    if (fact.day !== p.day) continue;
    for (const target of [state.daily, state.weekly]) {
      target.wins = Math.min(1000000, target.wins + (fact.wins??1)); target.matches = Math.min(1000000, target.matches + fact.matches);
      target.noHint = Math.min(1000000, target.noHint + (fact.noHintWins??Number(fact.noHint)));
    }
    const points=Math.min(40-state.event.dailyPoints,fact.points??(({easy:5,normal:7,hard:9,superHard:12})[fact.mode]||5));
    state.event.dailyPoints+=points;state.event.points=Math.min(100,state.event.points+points);
  }
  eventCoins();
  let spin = null, letterResult = null, chestResult = null, hourlyGiftResult = null, hourlyGiftApplied = false;
  let wheelReward=null,spinApplied=false,wheelApplied=false;
  let loginResult=null,loginApplied=false,bonusApplied=false;
  let cosmeticResult=null,fragmentResult=null;
  const ownedLetters = new Set(ownedItemIds);
  const receiveCopy=itemId=>{
    const received=receiveCosmeticCopies(state.cosmeticProgress,itemId);
    state.cosmeticProgress=received.state;cosmeticResult=received.result;
  };
  const grantWheel=(prize,operation)=>{
    if(prize.kind==='item'){
      const hadItem=ownedLetters.has(prize.itemId);
      if(prize.version===WHEEL_VERSION&&cosmeticDefinition(prize.itemId)){
        if(!cosmeticEnabled)fail();receiveCopy(prize.itemId);
      }
      ownedLetters.add(prize.itemId);
      if(!hadItem)grant(`wheel:item:${prize.itemId}`,0,{acquisition:{sourceKind:'wheel',sourceId:'wheel-v2',items:[prize.itemId]}});
    }else grant(`wheel:${operation}`,prize.coins,prize.kind==='support'?{support:{gameId:prize.gameId,key:prize.key}}:{});
    wheelApplied=true;
  };
  const supportFull=prize=>{
    if(prize.kind!=='support')return false;
    if(!integer(supportCount)||supportCount>GAMEPLAY_LIMITS.itemCount)fail();
    return supportCount===GAMEPLAY_LIMITS.itemCount;
  };
  assertStorageAccess(state,command);
  switch (command.type) {
    case 'reserveAd': {
      if(!id(command.operation)||command.source!=='ad'||!command.earned||!integer(command.day)||command.day>=p.day||command.day<p.day-3
        ||!integer(command.earnedAt)||now<command.earnedAt||now-command.earnedAt>2*DAY_MS
        ||periods(command.earnedAt).day<command.day||periods(command.earnedAt).day>command.day+1
        ||command.ordinal!==state.spins.pastAds.filter(r=>r.day===command.day).length+1||command.ordinal>10)fail();
      const pending={operation:command.operation,day:command.day,wheel:normalizeWheelCandidate(command.wheelCandidate),phase:'reserved-ad',ordinal:command.ordinal,earnedAt:command.earnedAt};
      if(state.pendingWheel&&JSON.stringify(state.pendingWheel)!==JSON.stringify(pending))fail();
      state.pendingWheel=pending;break;
    }
    case 'cancelReservedAd': {
      if(state.pendingWheel?.phase!=='reserved-ad'||state.pendingWheel.operation!==command.operation)fail();
      state.pendingWheel=null;break;
    }
    case 'claimWheelReward': {
      if(!id(command.wheelOperation))fail();
      const pending=state.pendingWheel;if(!pending||pending.operation!==command.wheelOperation)break;
      if(pending.phase==='reserved-ad')fail();
      wheelReward=normalizeWheelCandidate(pending.wheel);
      if(supportFull(wheelReward))break;
      grantWheel(wheelReward,pending.operation);state.pendingWheel=null;break;
    }
    case 'claimHourlyGift': {
      const claimed = claimHourlyGift(state.hourlyGift,command,command.claimedAt??now,supportCount);
      state.hourlyGift = claimed.state; hourlyGiftResult = claimed.result; hourlyGiftApplied = claimed.applied;
      if (claimed.applied) {
        if (claimed.result.kind === 'chest') {
          state.chests=earnChest(state.chests,claimed.result.chestType);
          state.festival=normalizeFestival(state.festival);
        }
        if (claimed.result.kind === 'ticket') addTickets(hourlyGiftTicketCount(claimed.result));
        grant(`hourly:${command.operation}`,claimed.result.coins,claimed.result.kind === 'support' ? {support:{gameId:claimed.result.gameId,key:claimed.result.key}} : {});
      }
      break;
    }
    case 'unlockStorageSlot': {
      const unlocked=unlockStorageSlot(state.storageUnlocks,command,coinsBalance);
      if(unlocked.applied){state.storageUnlocks=unlocked.state;grant(`storage-slot:${command.operation}`,-unlocked.price);}
      break;
    }
    case 'status': break;
    case 'login': if ((!state.loginReward||state.loginReward.operation!==command.operation)&&state.loginDay !== p.day) {
      if(command.loginVersion===2){
        const candidate=normalizeLoginCandidate(command.loginCandidate);if(candidate.index!==state.loginNext||!id(command.operation))fail();
        if(loginSupportCounts.length!==candidate.supports.length||loginSupportCounts.some(n=>!integer(n)||n>GAMEPLAY_LIMITS.itemCount))fail();
        if(loginSupportCounts.some(n=>n===GAMEPLAY_LIMITS.itemCount))throw Object.assign(new Error('Kho hỗ trợ đã đầy. Hãy dùng bớt vật phẩm rồi nhận lại quà điểm danh.'),{code:'rewards/inventory-full'});
        loginResult={...candidate,day:p.day,operation:command.operation};state.loginReward=loginResult;
        grant(`login:${p.day}`,candidate.coins);
        for(const support of candidate.supports)grant(`login:${p.day}:support:${support.gameId}`,0,{support});
      }else if(command.loginVersion!==undefined)fail();
      else grant(`login:${p.day}`, LOGIN[state.loginNext]);
      loginApplied=true;state.loginDay = p.day; state.loginNext = (state.loginNext + 1) % 7;
      state.weekly.visits = Math.min(3, state.weekly.visits + 1);
    } break;
    case 'daily': { const item = DAILY.find(v => v.id === command.id); if (!item) fail(); claimMission('daily',item); break; }
    case 'dailyBonus': {const received=state.daily.claimed.includes('bonus');dailyBonus();bonusApplied=!received&&state.daily.claimed.includes('bonus');break;}
    case 'weekly': {
      if(command.id!==undefined){const item=WEEKLY.find(item=>item.id===command.id);if(!item)fail();claimMission('weekly',item);}
      else{const received=state.weekly.claimed.includes('bonus');claimWeekly();bonusApplied=!received&&state.weekly.claimed.includes('bonus');}
      break;
    }
    case 'sellLetter':
    case 'fuseLetter': {
      const changed=mutateLetters(state.letters,command,randomLetter,coinsBalance);state.letters=changed.state;letterResult=changed.result;
      if(changed.coins)grant(`letters:${command.operation}`,changed.coins);
      break;
    }
    case 'sellCosmeticFragments':
    case 'fuseCosmeticFragments': {
      if(!cosmeticEnabled||!festivalEnabled)fail();
      const changed=mutateCosmeticFragments(state.cosmeticProgress,command,coinsBalance);
      state.cosmeticProgress=changed.state;fragmentResult=changed.result;
      if(changed.applied){
        if(changed.chestType)state.chests=earnChest(state.chests,changed.chestType);
        grant(`cosmetic-fragments:${command.operation}`,changed.coins);
      }
      break;
    }
    case 'exchangeLetterSet': {
      const exchanged=exchangeLetterSet(state.letters,command,ownedLetters,{chestsEnabled:festivalEnabled});state.letters=exchanged.state;letterResult=exchanged.result;
      if(exchanged.chestType && previous?.letters?.last?.operation!==command.operation)state.chests=earnChest(state.chests,exchanged.chestType);
      if(exchanged.item){ownedLetters.add(exchanged.item.id);grant(`letters:${exchanged.item.id}`,0,{acquisition:{sourceKind:'letters',sourceId:'letters-collection-01',items:[exchanged.item.id]}});}
      else if(exchanged.coins)grant(`letters:${command.operation}`,exchanged.coins);
      break;
    }
    case 'claimFestival': {
      if(!festivalEnabled)fail();
      const claimed=claimFestival(state.festival,state.chests,command);state.festival=claimed.festival;state.chests=claimed.chests;
      if(claimed.coins)grant(`festival:${command.cycle}:${command.points}`,claimed.coins);
      break;
    }
    case 'openChest': {
      if(!festivalEnabled)fail();
      const opened=openChest(state.chests,command,ownedItemIds,supportCount);state.chests=opened.chests;chestResult=opened.result;
      if(opened.applied){
        if(chestResult.kind==='item'){
          if(chestResult.poolVersion===2){if(!cosmeticEnabled)fail();receiveCopy(chestResult.itemId);}
          if(!ownedLetters.has(chestResult.itemId))grant(`chest:item:${chestResult.itemId}`,0,{acquisition:{sourceKind:'chest',sourceId:'shared-chests-v1',items:[chestResult.itemId]}});
          ownedLetters.add(chestResult.itemId);
        }else grant(`chest:${command.operation}`,chestResult.coins,chestResult.kind==='support'?{support:{gameId:chestResult.gameId,key:chestResult.key}}:{});
      }
      break;
    }
    case 'sellChest': {
      if(!festivalEnabled)fail();
      const sold=sellChest(state.chests,command,coinsBalance);state.chests=sold.chests;chestResult=sold.result;
      if(sold.applied)grant(`chest-sale:${command.operation}`,sold.coins);
      break;
    }
    case 'spin': {
      if (!id(command.operation) || !['free','ad','ticket'].includes(command.source)) fail();
      spin = [state.spins.free, ...state.spins.ads, ...state.spins.pastAds, state.spins.ticket].find(r => r?.operation === command.operation);
      if (spin) {wheelReward=spin.wheel||null;break;}
      const reserved=state.pendingWheel?.phase==='reserved-ad'?state.pendingWheel:null;
      if(state.pendingWheel&&(!reserved||reserved.operation!==command.operation||reserved.day!==command.day||reserved.ordinal!==command.ordinal||reserved.earnedAt!==command.earnedAt
        ||JSON.stringify(reserved.wheel)!==JSON.stringify(normalizeWheelCandidate(command.wheelCandidate))))throw Object.assign(new Error('Bạn còn một phần quà đang chờ. Hãy nhận quà trước khi quay tiếp.'),{code:'rewards/wheel-pending'});
      const lateAd = command.source === 'ad' && command.day < p.day;
      if (!integer(command.day) || command.day > p.day || command.day !== p.day && !lateAd) throw new Error('Lượt quay thuộc ngày trước.');
      const adList = lateAd ? state.spins.pastAds.filter(r => r.day === command.day) : state.spins.ads;
      if (lateAd && (!integer(command.earnedAt) || (periods(command.earnedAt).day < command.day || periods(command.earnedAt).day > command.day + 1)
        || now < command.earnedAt || now - command.earnedAt > 2 * DAY_MS)) fail();
      if (command.source === 'free' && state.spins.free) { spin = state.spins.free;wheelReward=spin.wheel||null;break; }
      if (command.source === 'ad' && (!command.earned || command.ordinal !== adList.length + 1 || command.ordinal > AD_DAILY_LIMIT)) fail();
      if (command.source === 'ticket') {
        if (command.sequence !== state.ticketSpent + 1 || state.tickets < 1) fail();
        state.tickets--; state.ticketSpent++; if (!integer(state.ticketSpent)) fail();
      }
      const candidate=wheelCandidate===undefined?command.wheelCandidate:wheelCandidate;
      if(command.wheelVersion!==undefined&&(!supportedWheelVersion(command.wheelVersion)||candidate===undefined||command.wheelVersion!==candidate.version))fail();
      if(candidate!==undefined){
        wheelReward=resolveWheelCandidate(candidate,ownedWheelItemIds);
        spin={source:command.source,day:command.day,sector:wheelReward.sector,coins:wheelReward.coins,operation:command.operation,wheel:wheelReward};
      }else{
        if (!Number.isInteger(sector) || sector < 0 || sector >= 8) fail();
        spin = { source: command.source, day: command.day, sector, coins: WHEEL[sector], operation: command.operation };
      }
      if (command.source === 'ad') { spin.ordinal = command.ordinal; (lateAd ? state.spins.pastAds : state.spins.ads).push(spin); }
      else if (command.source === 'ticket') { spin.sequence = state.ticketSpent; state.spins.ticket = spin; }
      else state.spins.free = spin;
      spinApplied=true;
      if(wheelReward){
        state.pendingWheel=null;
        if(supportFull(wheelReward))state.pendingWheel={operation:command.operation,day:command.day,wheel:wheelReward};
        else grantWheel(wheelReward,command.operation);
      }else{grant(`wheel:${command.operation}`, spin.coins);wheelApplied=true;}
      break;
    }
    default: fail();
  }
  return { state: normalizeSparkState(state), receipts, spin, spinApplied, wheelReward, wheelApplied, loginResult,loginApplied,bonusApplied,letterResult, chestResult, cosmeticResult,fragmentResult, hourlyGiftResult, hourlyGiftApplied, ownedItemIds:[...ownedLetters], nextLetterRewardId:nextLetterReward(ownedLetters)?.id||null, ownedLetterIds:[...ownedLetters], serverNow: now };
}

/** Resolve a durable pending operation against canonical state before a new action. */
export function resolveSparkOperation(state, operation, now) {
  if (!operation) return { command:{type:'status'}, discarded:false };
  const day = periods(now).day;
  const existing = state && [state.spins.free,...state.spins.ads,...state.spins.pastAds,state.spins.ticket].find(r=>r?.operation === operation.operation);
  if (existing) return { command:operation, discarded:false };
  if(operation.type==='login'&&operation.loginVersion===2){
    const changedIndex=operation.loginCandidate&&operation.loginCandidate.index!==state?.loginNext&&state?.loginReward?.operation!==operation.operation;
    return changedIndex?{command:{type:'status'},discarded:true}:{command:{...operation,day},discarded:false};
  }
  if(operation.type==='claimWheelReward')return {command:operation,discarded:false};
  if(operation.type==='claimHourlyGift'){if(operation.sequence!==undefined&&operation.sequence<=(state?.hourlyGift?.sequence||0)&&state?.hourlyGift?.last.operation!==operation.operation)return {command:{type:'status'},discarded:true};return {command:operation,discarded:false};}
  if(operation.type==='claimFestival')return {command:operation,discarded:false};
  if(operation.type==='unlockStorageSlot')return operation.sequence<=(state?.storageUnlocks?.sequence||0)&&!state?.storageUnlocks?.slots.includes(operation.slot)?{command:{type:'status'},discarded:true}:{command:operation,discarded:false};
  if(['openChest','sellChest'].includes(operation.type)){if(operation.sequence!==undefined&&operation.sequence<=(state?.chests?.sequence||0)&&state?.chests?.last?.operation!==operation.operation)return {command:{type:'status'},discarded:true};return {command:operation,discarded:false};}
  if(['sellCosmeticFragments','fuseCosmeticFragments'].includes(operation.type)){
    if(operation.sequence!==undefined&&operation.sequence<=(state?.cosmeticProgress?.sequence||0)&&state?.cosmeticProgress?.last?.operation!==operation.operation)return {command:{type:'status'},discarded:true};
    return {command:operation,discarded:false};
  }
  if (['sellLetter','fuseLetter','exchangeLetterSet'].includes(operation.type)) {
    if(operation.sequence !== undefined && operation.sequence <= (state?.letters.sequence || 0) && state?.letters.last?.operation !== operation.operation) return {command:{type:'status'},discarded:true};
    return {command:operation,discarded:false};
  }
  if (operation.source === 'ticket') {
    if (operation.sequence !== undefined && operation.sequence <= (state?.ticketSpent || 0)) return { command:{type:'status'}, discarded:true };
    return { command:{...operation,day}, discarded:false };
  }
  const expiredAd = operation.source === 'ad' && (!integer(operation.earnedAt) || now - operation.earnedAt > 2 * DAY_MS);
  if (expiredAd || operation.day !== undefined && operation.day < day && operation.source !== 'ad')
    return { command:{type:'status'}, discarded:true };
  return { command:operation, discarded:false };
}
