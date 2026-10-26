// Seconds granted per wave in the four adventure difficulties.
const memory = Object.freeze({ easy: 75, normal: 110, hard: 150, superHard: 220 });
const connect = Object.freeze({ easy: 60, normal: 90, hard: 120, superHard: 180 });
export const STANDARD_WAVE_SECONDS = Object.freeze({
  'memory-match': memory,
  'link-connect': connect,
  'triple-connect': connect,
});

const PAIR_DIFFICULTY_CAPACITIES = Object.freeze({ easy: 6, normal: 12, hard: 18, superHard: 30 });
const TRIPLE_DIFFICULTY_CAPACITIES = Object.freeze({ easy: 9, normal: 18, hard: 26, superHard: 40 });

export function calculateChallengeWaveTime({ gameId, totalGroups }) {
  const capacities = gameId === 'triple-connect' ? TRIPLE_DIFFICULTY_CAPACITIES : PAIR_DIFFICULTY_CAPACITIES;
  const difficulty = Object.keys(capacities).find(mode => totalGroups <= capacities[mode]) || 'superHard';
  return STANDARD_WAVE_SECONDS[gameId][difficulty];
}

// Original v1 budgets remain valid in saved waves.
export function calculateOriginalWaveTime({ gameId, mode, totalGroups }) {
  const seconds = { 'memory-match': 6, 'link-connect': 4, 'triple-connect': 5 }[gameId];
  const factor = { easy: 1.2, normal: 1.1, hard: 1, superHard: 0.9, challenge: 1, endless: 1 }[mode];
  return mode === 'endless' ? 0 : 5 * Math.round((20 + totalGroups * seconds * factor) / 5);
}
