import { groupEnergyChance, groupSupportChance } from '../progression/groupDropPolicy.js';
import { GAMEPLAY_LIMITS } from '../gameplayTuning.js';
import { LINK_CONNECT_CONFIG, getLinkPremiumTypeDefinition, getLinkPremiumSupplyItem, isLinkEndlessMode, getLinkMilestoneRewards, getLinkBreakMilestones, getLinkSpecialMilestoneTooltip } from './linkConfig.js';
import { getLinkBoardTile, removeRandomLinkPair, removeLinkBoardPair, unlockFrozenLinkPairs, applyLinkGravityShift, shuffleLinkBoard } from './linkBoard.js';
import { calculateGroupScore } from '../progression/gameplayRules.js';

// The caller owns persistence and presentation. No timer or network work here.
export function resolveLinkPairRewards(state, items, { special, premiumType, luckyReward }, random = Math.random) {
  const legacy = state.rewardPolicyVersion === 1;
  const rules = LINK_CONNECT_CONFIG.special;
  const presentation = { coins: 0, rewards: [], breaks: [], breakTileKeys: [], unlocked: [], energyProgress: null };
  const coins = value => { presentation.coins += value; presentation.rewards.push({ type: 'coins', value }); };
  const time = value => { state.remainingTime += value; presentation.rewards.push({ type: 'time', value }); };
  const grant = id => {
    if ((items[id] || 0) >= GAMEPLAY_LIMITS.itemCount) { coins(GAMEPLAY_LIMITS.itemOverflowCoins); return true; }
    items[id] = (items[id] || 0) + 1; presentation.rewards.push({ type: id, value: 1 }); return true;
  };
  const thaw = count => unlockFrozenLinkPairs(state.board, count, { onUnlock: ({ tileKeys }) => presentation.unlocked.push(...tileKeys) });
  const breakPair = () => {
    const pair = removeRandomLinkPair(state.board, { remove: false, eligiblePair: (candidate, board) => candidate.positions.every(position => {
      const tile = getLinkBoardTile(board, position); return tile && !tile.frozen && !tile.special && !tile.luckyReward;
    }) });
    if (!pair) { coins(rules.milestones.breakCoins); return; }
    presentation.breakTileKeys.push(pair.positions.map(position => getLinkBoardTile(state.board, position).instanceId));
    removeLinkBoardPair(state.board, ...pair.positions);
    state.matchedPairs++;
    state.score += calculateGroupScore({ combo: state.combo, automatic: true });
    presentation.breaks.push(pair.positions);
    applyLinkGravityShift(state.board, state.gravityShift);
  };
  let redBreak = false;
  if (special) {
    const definition = getLinkPremiumTypeDefinition(premiumType);
    if (definition.id === 'red') redBreak = random() < definition.effectChance;
    else if (definition.id === 'cyan' && !thaw(1)) {
      if (!legacy) coins(10);
      else if (isLinkEndlessMode(state.mode) || random() < .5) coins(5 + Math.floor(random() * 11));
      else time(2 + Math.floor(random() * 4));
    }
  }
  const supplyChance = legacy ? special && premiumType === 'blue' ? .5 : 0 : groupSupportChance(special || luckyReward, special && premiumType === 'blue');
  if (random() < supplyChance) grant(legacy && isLinkEndlessMode(state.mode) ? ['hint','reshuffle'][Math.floor(random() * 2)] : getLinkPremiumSupplyItem(state.mode, random));
  if (luckyReward) {
    state.luckyAwards.push(luckyReward);
    if (luckyReward.type === 'coins') coins(luckyReward.value); else time(luckyReward.value);
  }
  applyLinkGravityShift(state.board, state.gravityShift);
  if (redBreak && (!legacy || state.matchedPairs < state.totalPairs)) breakPair();
  if ((!legacy || special) && state.specialProgress < rules.progressTarget) {
    if (random() < (legacy ? 1 : groupEnergyChance(special || luckyReward))) {
      state.specialNoEnergyDropStreak = 0;
      const progress = state.specialProgress + 1;
      presentation.energyProgress = progress; state.specialProgress = progress % rules.progressTarget;
      state.specialMilestoneRewards[progress] = getLinkSpecialMilestoneTooltip(progress, state.mode, legacy ? 1 : 2);
      for (const [type, amount] of Object.entries(getLinkMilestoneRewards(progress, state.mode, legacy ? 1 : 2))) {
        if (type === 'coins') coins(amount);
        else for (let count = 0; count < amount; count++) grant(type);
      }
      if (getLinkBreakMilestones(legacy ? 1 : 2).includes(progress)) breakPair();
    } else state.specialNoEnergyDropStreak++;
  }
  if (!legacy && special && premiumType === 'red' && !redBreak && state.matchedPairs < state.totalPairs) shuffleLinkBoard(state.board, { required: false });
  state.pendingEnergyCollections = 0; state.pendingSpecialMilestones = []; state.isResolvingSpecialMilestone = false;
  return presentation;
}
