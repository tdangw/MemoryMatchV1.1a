// Read-only model of the current configuration, not a player-behaviour simulation.
// Run: node scripts/analyze-game-economy.mjs
import { GROUP_DROP_RATES } from '../js/progression/groupDropPolicy.js';
import { GAME_CONFIG } from '../js/config.js';
import { LINK_CONNECT_CONFIG } from '../js/linkConnect/linkConfig.js';
import { TRIPLE_PRODUCT_DECISIONS } from '../js/tripleConnect/tripleConfig.js';
import { GROUP_LOOT_DROP_RATES, LETTER_SELL_COINS, LETTER_SETS } from '../js/liveops/config.js';
import { CHEST_POOLS, CHEST_POLICY, FESTIVAL_MILESTONES } from '../js/liveops/chestConfig.js';
import { WHEEL } from '../js/liveops/model.js';
import { SHOP_ITEMS } from '../js/shopCatalog.js';

const total = (values, select) => values.reduce((sum, value) => sum + select(value), 0);
const memoryRewards = GAME_CONFIG.special.milestones.flat();
const memoryCycle = {
  energy: GAME_CONFIG.special.progressTarget,
  coins: total(memoryRewards, reward => reward.type === 'coins' ? reward.value : 0),
  items: total(memoryRewards, reward => reward.type === 'coins' ? 0 : reward.type === 'hint' ? reward.value : 1),
};
const cycle = config => ({ energy: config.target, coins: total(config.rewards, reward => reward.coins || 0),
  items: total(config.rewards, reward => total(Object.entries(reward), ([type, amount]) => type === 'coins' ? 0 : amount)) });
const linkCycle = cycle({ target: LINK_CONNECT_CONFIG.special.progressTarget, rewards: LINK_CONNECT_CONFIG.special.milestones.rewards });
const tripleCycle = cycle(TRIPLE_PRODUCT_DECISIONS.milestones);
const wheelMean = total(WHEEL, value => value) / WHEEL.length;
const blueShare = LINK_CONNECT_CONFIG.special.premiumTypes.find(type => type.id === 'blue').weight;
const cosmeticChance = policy => 1-policy.coinChance-policy.supportChance;
const harmonic = n => Array.from({ length:n }, (_, index) => 1 / (index + 1)).reduce((a,b) => a+b, 0);
const round = n => Math.round(n * 1000) / 1000;
const scenarios = [.05,.1,.25,.4].map(specialShare => {
  const energy = 100 * ((1-specialShare)*GROUP_DROP_RATES.energy.normal + specialShare*GROUP_DROP_RATES.energy.special);
  const support = supplyShare => 100 * ((1-specialShare)*GROUP_DROP_RATES.support.normal
    + specialShare*GROUP_DROP_RATES.support.special + supplyShare*(GROUP_DROP_RATES.support.supply-GROUP_DROP_RATES.support.special));
  const loot = source => 100 * ((1-specialShare)*GROUP_LOOT_DROP_RATES.normal[source] + specialShare*GROUP_LOOT_DROP_RATES.special[source]);
  return { specialShare, expectedEnergy:round(energy),
    // Memory assumes every special group is Special rather than Lucky-only;
    // Link assumes the configured Blue share. These are scenarios, not telemetry.
    directItems:{ memory:round(support(specialShare)), link:round(support(specialShare*blueShare)), triple:round(support(0)) },
    milestoneCoinsLongRun:Object.fromEntries(Object.entries({ memory:memoryCycle,link:linkCycle,triple:tripleCycle })
      .map(([game, value]) => [game, round(energy/value.energy*value.coins)])),
    expectedLetters:round(loot('letter')), letterSaleCoins:round(loot('letter')*LETTER_SELL_COINS),
    expectedTickets:round(loot('ticket')), ticketCoinsLongRun:round(loot('ticket')*wheelMean),
    expectedBadges:round(loot('badge')) };
});
const recipeSaleCosts = LETTER_SETS.map(set => ({ recipe:set.label,
  letters:total(Object.values(set.required), n => n), chest:set.chestType,
  saleAlternative:total(Object.values(set.required), n => n)*LETTER_SELL_COINS }));
const cosmeticCompletionFromEmpty = Object.entries(CHEST_POOLS).map(([type, ids]) => ({ type,items:ids.length,
  baselineRepeatPoolExpectedChests:round(ids.length*harmonic(ids.length)/cosmeticChance(CHEST_POLICY[type])),
  legacyUnownedPoolExpectedChests:round(ids.length/cosmeticChance(CHEST_POLICY[type])),
  expectedChests:round(ids.length*harmonic(ids.length)/cosmeticChance(CHEST_POLICY[type])) }));
const festivalDirect = total(FESTIVAL_MILESTONES, item => item.coins);
const festivalBeforeCosmetics = festivalDirect + CHEST_POLICY.c.coinChance*CHEST_POLICY.c.coins
  + CHEST_POLICY.frame.coinChance*CHEST_POLICY.frame.coins + CHEST_POLICY.avatar.coinChance*CHEST_POLICY.avatar.coins;
const festivalFull = festivalDirect + CHEST_POLICY.c.coinChance*CHEST_POLICY.c.coins
  + CHEST_POLICY.frame.duplicate + CHEST_POLICY.avatar.duplicate;
console.log(JSON.stringify({ assumptions:'Long-run expectations per 100 fresh manual groups. Excludes separate Lucky coin/item rewards, automatic-break fallbacks, victory coins and spending. No claim of equal groups/minute across games.',
  rates:GROUP_DROP_RATES, cycles:{ memory:memoryCycle,link:linkCycle,triple:tripleCycle },
  lootRates:GROUP_LOOT_DROP_RATES,
  lootProbabilities:Object.fromEntries(Object.entries(GROUP_LOOT_DROP_RATES).map(([group,rates]) => [group, {
    any:1-Object.values(rates).reduce((product, chance) => product*(1-chance),1),
    all:Object.values(rates).reduce((product,chance) => product*chance,1),
  }])),
  letterPolicy:{ saleCoins:LETTER_SELL_COINS },
  wheelMean, expectedTicketCoinsPerSpecial:GROUP_LOOT_DROP_RATES.special.ticket*wheelMean,
  shop:SHOP_ITEMS.map(({id,price}) => ({id,price})), recipeSaleCosts, scenarios,
  festival:{ directCoins:festivalDirect, expectedCoinsNoDuplicates:festivalBeforeCosmetics,
    baselineRepeatPoolAllDuplicatesCoins:festivalBeforeCosmetics+cosmeticChance(CHEST_POLICY.frame)*CHEST_POLICY.frame.duplicate+cosmeticChance(CHEST_POLICY.avatar)*CHEST_POLICY.avatar.duplicate,
    expectedCoinsFullPools:festivalFull, supportItemsBeforeFull:1.4,supportItemsFullPools:.6 },
  cosmeticCompletionFromEmpty }, null, 2));
