// Legacy pure policy retained for compatibility tests. Spark runtime uses sparkModel.js; views never grant.
export const DAY_MS = 86400000;
export const WHEEL = Object.freeze([5, 10, 10, 15, 15, 20, 20, 25]);
export const LOGIN = Object.freeze([10, 10, 15, 10, 15, 20, 25]);
export const DAILY = Object.freeze([
  { id: 'win-three', label: 'Thắng 3 ván', key: 'wins', target: 3, coins: 5 },
  { id: 'match-thirty', label: 'Ghép đúng 30 lần', key: 'matches', target: 30, coins: 5 },
  { id: 'win-without-hint', label: 'Thắng không dùng gợi ý', key: 'noHint', target: 3, coins: 10 },
]);
export const WEEKLY = Object.freeze([
  { id: 'weekly-wins', label: 'Thắng 12 ván', key: 'wins', target: 12 },
  { id: 'weekly-matches', label: 'Ghép đúng 120 lần', key: 'matches', target: 120 },
  { id: 'weekly-no-hint', label: 'Thắng 3 ván không dùng Gợi ý', key: 'noHint', target: 3 },
  { id: 'weekly-visits', label: 'Điểm danh 3 ngày', key: 'visits', target: 3 },
]);
export function periods(now) {
  if (!Number.isSafeInteger(now) || now < 0) throw new Error('Invalid service time');
  const day = Math.floor(now / DAY_MS);
  return { day, week: day - ((day + 3) % 7) };
}
const counter = () => ({ wins: 0, matches: 0, noHint: 0, visits: 0, claimed: [] });
export function initialLiveops(now) {
  return { version: 1, ...periods(now), daily: counter(), weekly: counter(), loginNext: 0, loginDay: -1,
    spins: {}, event: { id: 'firefly-festival-01', points: 0, day: -1, dailyPoints: 0, claimed: [] } };
}
export function normalizeFact(fact) {
  if (!fact || !['memory-match', 'link-connect', 'triple-connect'].includes(fact.gameId)
    || !['easy', 'normal', 'hard', 'superHard', 'challenge', 'endless'].includes(fact.mode)
    || !/^[A-Za-z0-9_-]{1,120}$/.test(fact.roundId || '')
    || !Number.isSafeInteger(fact.matches) || fact.matches < 1 || fact.matches > 1000000
    || typeof fact.noHint !== 'boolean' || !Number.isSafeInteger(fact.day) || fact.day < 0) throw new Error('Invalid settled round');
  return { roundId: fact.roundId, gameId: fact.gameId, mode: fact.mode, matches: fact.matches, noHint: fact.noHint, day: fact.day };
}
/** Deterministic transition, committed with all emitted receipts by the backend. */
export function transitionLiveops(previous, command, { uid, now, sector, eventStartAt = null, adEarned = false }) {
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(uid)) throw new Error('Invalid reward owner');
  const state = structuredClone(previous || initialLiveops(now)), emitted = [];
  if (state.version !== 1) throw new Error('Unsupported reward state');
  const period = periods(now);
  if (period.day < state.day) throw new Error('Service clock moved backwards');
  const grant = (key, coins, extra = {}) => emitted.push({ receiptId: `${uid}:${key}`, ownerUid: uid, coins, grantedAt: now, configVersion: 1, ...extra });
  const dailyBonus = () => {
    if (DAILY.every(item => state.daily.claimed.includes(item.id)) && !state.daily.claimed.includes('bonus')) {
      state.daily.claimed.push('bonus'); grant(`daily:${state.day}:bonus`, 10);
    }
  };
  const claimDaily = item => {
    if (state.daily[item.key] < item.target || state.daily.claimed.includes(item.id)) return;
    state.daily.claimed.push(item.id); grant(`daily:${state.day}:${item.id}`, item.coins);
  };
  const claimWeekly = () => {
    if (WEEKLY.every(item => state.weekly[item.key] >= item.target) && !state.weekly.claimed.includes('bonus')) {
      state.weekly.claimed.push('bonus'); grant(`weekly:${state.week}:bonus`, 50);
    }
  };
  if (period.day !== state.day) {
    DAILY.forEach(claimDaily); dailyBonus(); state.daily = counter(); state.spins = {};
  }
  if (period.week !== state.week) { claimWeekly(); state.weekly = counter(); }
  Object.assign(state, period);
  switch (command.type) {
    case 'status': break;
    case 'fact': {
      const fact = normalizeFact(command.fact);
      if (fact.day !== state.day) throw new Error('Round period expired');
      for (const target of [state.daily, state.weekly]) {
        target.wins = Math.min(1000000, target.wins + 1);
        target.matches = Math.min(1000000, target.matches + fact.matches);
        target.noHint = Math.min(1000000, target.noHint + Number(fact.noHint));
      }
      const end = eventStartAt === null ? null : eventStartAt + 7 * DAY_MS;
      if (end !== null && now >= eventStartAt && now < end) {
        if (state.event.day !== state.day) { state.event.day = state.day; state.event.dailyPoints = 0; }
        const earned = Math.min(40 - state.event.dailyPoints, ({ easy: 5, normal: 7, hard: 9, superHard: 12 })[fact.mode] || 5);
        state.event.dailyPoints += earned; state.event.points = Math.min(100, state.event.points + earned);
      }
      break;
    }
    case 'login':
      if (state.loginDay !== state.day) {
        grant(`login:${state.day}`, LOGIN[state.loginNext]);
        state.loginNext = (state.loginNext + 1) % LOGIN.length; state.loginDay = state.day;
        state.weekly.visits = Math.min(3, state.weekly.visits + 1);
      }
      break;
    case 'daily': {
      const item = DAILY.find(item => item.id === command.id);
      if (!item) throw new Error('Unknown mission');
      claimDaily(item); dailyBonus(); break;
    }
    case 'weekly': claimWeekly(); break;
    case 'spin': {
      if (!['free', 'ad'].includes(command.source)) throw new Error('Unknown spin source');
      if (state.spins[command.source]) break;
      if (command.source === 'ad' && !adEarned) throw new Error('Reward verification required');
      if (!Number.isInteger(sector) || sector < 0 || sector >= WHEEL.length) throw new Error('Invalid sector');
      const result = { sector, coins: WHEEL[sector], source: command.source, day: state.day };
      state.spins[command.source] = result;
      grant(`wheel:${state.day}:${command.source}`, result.coins, { spin: result }); break;
    }
    default: throw new Error('Unknown liveops action');
  }
  // Event entitlement is committed on settlement, independent of a page or animation.
  if (eventStartAt !== null && now < eventStartAt + 9 * DAY_MS) {
    for (const [points, coins] of [[20, 5], [50, 10], [80, 10], [100, 0]]) {
      if (state.event.points < points || state.event.claimed.includes(points)) continue;
      state.event.claimed.push(points);
      grant(`event:${state.event.id}:${points}`, coins, points === 100 ? {
        acquisition: { sourceKind: 'event', sourceId: state.event.id, milestone: 100,
          items: ['event-avatar-lantern-otter', 'event-frame-firefly-glow'] },
      } : {});
    }
  }
  return { state, receipts: emitted, serverNow: now, eventStartAt };
}
