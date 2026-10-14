import assert from 'node:assert/strict';
import { formatLeaderboardTime, formatLeaderboardNumber, compactLeaderboardPages } from '../js/leaderboardPresentation.js';
for (const [ms, expected] of [[1, '00:00,00'], [41810, '00:41,81'], [59999, '01:00,00'], [3599999, '1:00:00,00'], [3661230, '1:01:01,23'], [0, '—'], [NaN, '—'], [-1, '—']]) assert.equal(formatLeaderboardTime(ms), expected);
assert.equal(formatLeaderboardNumber(128640), '128.640');
assert.equal(formatLeaderboardNumber(-1), '—');
const hundred = Array.from({ length: 100 }, (_, i) => i + 1);
assert.deepEqual(compactLeaderboardPages(hundred, 11), [1, 2, 'ellipsis', 10, 11, 12, 'ellipsis', 99, 100]);
assert.deepEqual(compactLeaderboardPages(hundred, 11, true), [1, 'ellipsis', 11, 'ellipsis', 100]);
assert.deepEqual(compactLeaderboardPages([1], 1), [1]);
assert.deepEqual(compactLeaderboardPages([1, 2, 3], 2), [1, 2, 3]);
assert.deepEqual(compactLeaderboardPages([1, 2, 3, 4, 5], 1), [1, 2, 3, 4, 5]);
for (let current = 1; current <= 100; current++) {
  const items = compactLeaderboardPages(hundred, current);
  const numbers = items.filter(item => typeof item === 'number');
  assert(numbers.includes(current)); assert.equal(numbers[0], 1); assert.equal(numbers.at(-1), 100);
  assert.equal(new Set(numbers).size, numbers.length); assert(items.length <= 9);
  assert(compactLeaderboardPages(hundred, current, true).length <= 5);
}
console.log('Leaderboard presentation checks passed.');
