// Probability per manually resolved group; independent samples, no pity.
export const GROUP_DROP_RATES = Object.freeze({ energy: Object.freeze({ normal: .2, special: .8 }), support: Object.freeze({ normal: .05, special: .1, supply: .3 }) });
export function groupEnergyChance(special) { return special ? GROUP_DROP_RATES.energy.special : GROUP_DROP_RATES.energy.normal; }
export function groupSupportChance(special, supply = false) { return supply ? GROUP_DROP_RATES.support.supply : special ? GROUP_DROP_RATES.support.special : GROUP_DROP_RATES.support.normal; }
