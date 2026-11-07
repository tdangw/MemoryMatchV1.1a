import { DAILY, WEEKLY, DAY_MS, periods } from './liveops/model.js';
import { LETTER_SETS } from './liveops/config.js';
import { FESTIVAL_MILESTONES, CHEST_TYPES } from './liveops/chestConfig.js';
import { getMasteryRewards } from './progression/masteryRewards.js';

const empty = () => ({ missions:false, events:false, treasure:false, collection:false });

/** Read-only eligibility, using the same catalog and mastery rules as each destination. */
export function adventureRewardReadiness({ current = true, spark, uid, period, online = false, enabled = false, festivalEnabled = false, completed = {}, claim, block } = {}) {
  const ready = empty();
  if (!current) return ready;
  if (Number.isSafeInteger(block) && block > 0 && Number.isSafeInteger(block * 10)) {
    const mastery = getMasteryRewards({ completed, level:block * 10, claim });
    ready.treasure = mastery.chestEligible;
    ready.collection = mastery.collectionEligible;
  }
  const state = spark?.state;
  const ownsRemote = enabled && online && uid && spark?.ownerUid === uid && state;
  if (ownsRemote && festivalEnabled && state.chests) ready.collection ||= CHEST_TYPES.some(type => state.chests.earned[type] > state.chests.spent[type]);
  if (!ownsRemote) return ready;
  const letters = state.letters.counts;
  const letterSet = LETTER_SETS.some(set => Object.entries(set.required).every(([letter, count]) => (letters[letter] || 0) >= count));
  const festival = festivalEnabled ? state.festival : null;
  const badgeMilestone = festival && FESTIVAL_MILESTONES.some((item, index) =>
    festival.earnedTotal - festival.completedCycles * 100 >= item.points && !(festival.mask & (1 << index)));
  // Tickets, recipes and badge milestones do not expire with the daily clock.
  ready.events = state.tickets > 0 || Boolean(state.pendingWheel) || letterSet || Boolean(badgeMilestone);
  if (period?.uid !== uid || state.day !== period.day
    || state.week !== periods(period.day * DAY_MS).week) return ready;
  ready.missions = state.loginDay !== state.day
    || DAILY.every(item=>state.daily[item.key]>=item.target) && !state.daily.claimed.includes('bonus')
    || DAILY.some(item => state.daily[item.key] >= item.target && !state.daily.claimed.includes(item.id))
    || WEEKLY.every(item => state.weekly[item.key] >= item.target) && !state.weekly.claimed.includes('bonus');
  ready.events ||= !state.spins.free;
  return ready;
}

/** The map owns all dots, subscriptions and the local period check. No network or save writes. */
export function mountAdventureRewardIndicators({ controls, owner, read, subscribeCommit, subscribeAccount, subscribePeriod, eventTarget = window, documentTarget = document }) {
  const dots = Object.fromEntries(Object.entries(controls).map(([key, control]) => {
    const dot = documentTarget.createElement('span'); dot.className = 'adventure-reward-dot';
    dot.setAttribute('aria-hidden','true'); dot.hidden = true; control.append(dot); return [key,dot];
  }));
  const descriptions = Object.fromEntries(Object.entries(controls).map(([key,control]) => [key,control.getAttribute('aria-description')]));
  let invalidated = false;
  const refresh = () => {
    if (!owner.active) return;
    const ready = invalidated ? empty() : adventureRewardReadiness(read());
    for (const [key, control] of Object.entries(controls)) {
      // Treasure art replaces its children when the viewed block changes.
      if (dots[key].parentNode !== control) control.append(dots[key]);
      dots[key].hidden = !ready[key]; control.dataset.rewardReady = String(ready[key]);
      const description = [descriptions[key],ready[key] ? 'Có quà chưa nhận' : ''].filter(Boolean).join(' · ');
      if (description) control.setAttribute('aria-description',description); else control.removeAttribute('aria-description');
    }
  };
  if (subscribeCommit) owner.own(subscribeCommit(({ patch }) => {
    // Reset/restore replaces the map's profile; this mounted map must not show its old rewards.
    if (patch.reset || patch.restored) invalidated = true;
    refresh();
  }));
  if (subscribeAccount) owner.own(subscribeAccount(refresh));
  if (subscribePeriod) owner.own(subscribePeriod(refresh));
  owner.listen(eventTarget,'online',refresh); owner.listen(eventTarget,'offline',refresh);
  owner.listen(documentTarget,'appvisibilitychange',refresh);
  owner.interval(refresh,60000);
  owner.own(() => {
    for (const [key,dot] of Object.entries(dots)) {
      dot.remove();
      if (descriptions[key]) controls[key].setAttribute('aria-description',descriptions[key]); else controls[key].removeAttribute('aria-description');
    }
  });
  refresh();
  return refresh;
}
