export const GAME_CONFIG = Object.freeze({
  cardImages: Object.freeze({
    count: 1000,
    defaultTheme: 'default',
  }),
  modes: Object.freeze({
    easy: Object.freeze({ tileCount: 12, columns: 4, mobileColumns: 3 }),
    normal: Object.freeze({ tileCount: 24, columns: 6, mobileColumns: 4 }),
    hard: Object.freeze({ tileCount: 36, columns: 6, mobileColumns: 6 }),
    superHard: Object.freeze({
      tileCount: 48,
      columns: 6,
      mobileColumns: 6,
      expandedAtLevel: 10,
      expandedTileCount: 54,
    }),
  }),
  initialState: Object.freeze({
    hints: 3,
    score: 0,
    timeSeconds: 180,
  }),
  previewDurationMs: 5000,
  hintRevealDurationMs: 2500,
});

export function getModeLayout(mode = 'easy', level = 1) {
  const layout = GAME_CONFIG.modes[mode] || GAME_CONFIG.modes.easy;
  if (layout.expandedAtLevel && level >= layout.expandedAtLevel) {
    return { ...layout, tileCount: layout.expandedTileCount };
  }
  return layout;
}
