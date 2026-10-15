import { GAMEPLAY_LIMITS } from '../gameplayTuning.js';
import { LINK_CONNECT_CONFIG, getLinkPremiumTypeDefinition, getLinkPremiumSupplyItem, isLinkEndlessMode, calculateLinkThunderPairPoints, getLinkSpecialMilestoneTooltip } from './linkConfig.js';
import { getLinkBoardTile, removeRandomLinkPair, removeLinkBoardPair, unlockFrozenLinkPairs, applyLinkGravityShift } from './linkBoard.js';

// The caller owns persistence and presentation. No timer or network work here.
export function resolveLinkPairRewards(state, items, { special, premiumType, luckyReward }, random = Math.random) {
  const rules = LINK_CONNECT_CONFIG.special;
  const presentation = { coins: 0, rewards: [], breaks: [], breakTileKeys: [], unlocked: [], energyProgress: null };
  const coins = value => { presentation.coins += value; presentation.rewards.push({ type: 'coins', value }); };
  const time = value => { state.remainingTime += value; presentation.rewards.push({ type: 'time', value }); };
  const grant = id => {
    if ((items[id] || 0) >= GAMEPLAY_LIMITS.itemCount) return false;
    items[id] = (items[id] || 0) + 1; presentation.rewards.push({ type: id, value: 1 }); return true;
  };
  const thaw = count => unlockFrozenLinkPairs(state.board, count, { onUnlock: ({ tileKeys }) => presentation.unlocked.push(...tileKeys) });
  const integer = range => range.min + Math.floor(random() * (range.max - range.min + 1));
  const breakPair = combo => {
    const pair = removeRandomLinkPair(state.board, { remove: false, eligiblePair: (candidate, board) => candidate.positions.every(position => {
      const tile = getLinkBoardTile(board, position); return tile && !tile.frozen && !tile.special && !tile.luckyReward;
    }) });
    if (!pair) { coins(rules.milestones.breakCoins); return; }
    presentation.breakTileKeys.push(pair.positions.map(position => getLinkBoardTile(state.board, position).instanceId));
    removeLinkBoardPair(state.board, ...pair.positions);
    state.matchedPairs++;
    if (combo) { state.combo++; state.score += calculateLinkThunderPairPoints(state.combo, { countsCombo: true }); }
    presentation.breaks.push(pair.positions);
    applyLinkGravityShift(state.board, state.gravityShift);
  };
  let redBreak = false;
  if (special) {
    const definition = getLinkPremiumTypeDefinition(premiumType);
    if (definition.id === 'blue') { if (random() < definition.effectChance) grant(getLinkPremiumSupplyItem(state.mode, random)); }
    else if (definition.id === 'red') redBreak = random() < definition.effectChance;
    else if (!thaw(1)) {
      if (isLinkEndlessMode(state.mode) || random() < .5) coins(integer(rules.frozenFallbackReward.coin));
      else time(integer(rules.frozenFallbackReward.time));
    }
  }
  if (luckyReward) {
    state.luckyAwards.push(luckyReward);
    if (luckyReward.type === 'coins') coins(luckyReward.value); else time(luckyReward.value);
  }
  applyLinkGravityShift(state.board, state.gravityShift);
  if (redBreak && state.matchedPairs < state.totalPairs) breakPair(true);
  if (special && state.specialProgress < rules.progressTarget) {
    if (state.specialNoEnergyDropStreak >= rules.energyDrop.guaranteeAfterMisses || random() < rules.energyDrop.chance) {
      state.specialNoEnergyDropStreak = 0;
      const progress = state.specialProgress + 1;
      presentation.energyProgress = progress; state.specialProgress = progress % rules.progressTarget;
      state.specialMilestoneRewards[progress] = getLinkSpecialMilestoneTooltip(progress);
      if ([1, 3, 9, 10].includes(progress)) {
        if (progress === 9 || progress === 10) grant('hint');
        if (progress === 10) { coins(rules.milestones.ten.coins); grant('reshuffle'); }
        breakPair(false);
      } else if (progress === 2) coins(rules.milestones.two.coins);
      else if (progress === 4) { if (isLinkEndlessMode(state.mode)) coins(rules.milestones.four.fallbackCoins); else time(integer(rules.milestones.four.time)); }
      else if (progress === 5) grant(random() < .5 ? 'hint' : 'reshuffle');
      else if (progress === 6) { if (!thaw(rules.milestones.six.frozenPairs)) coins(rules.milestones.six.fallbackCoins); }
      else if (progress === 7) { const seconds = integer(rules.milestones.seven.time); if (!isLinkEndlessMode(state.mode)) time(seconds); coins(rules.milestones.seven.coins); }
      else if (progress === 8) grant(isLinkEndlessMode(state.mode) ? rules.milestones.eight.endlessItem : rules.milestones.eight.standardItem);
    } else state.specialNoEnergyDropStreak++;
  }
  state.pendingEnergyCollections = 0; state.pendingSpecialMilestones = []; state.isResolvingSpecialMilestone = false;
  return presentation;
}
