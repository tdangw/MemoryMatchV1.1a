import assert from 'node:assert/strict';
import { formatLeaderboardTime, formatLeaderboardNumber } from '../js/leaderboardPresentation.js';
for (const [ms, expected] of [[1, '00:00,00'], [41810, '00:41,81'], [59999, '01:00,00'], [3599999, '1:00:00,00'], [3661230, '1:01:01,23'], [0, '—'], [NaN, '—'], [-1, '—']]) assert.equal(formatLeaderboardTime(ms), expected);
assert.equal(formatLeaderboardNumber(128640), '128.640');
assert.equal(formatLeaderboardNumber(-1), '—');
console.log('Leaderboard presentation checks passed.');
