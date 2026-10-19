export const GAMEPLAY_SEASON = 1;
export const GAMEPLAY_SPACE_SUFFIX = '-waves1';

/** Explicitly authorized reset of unreleased test saves, once per installation. */
export function gameplaySeasonReset(data) {
  const version = data?.progress?.gameplaySeason;
  if (version === GAMEPLAY_SEASON) return null;
  if (version !== undefined) throw new Error('Bản lưu thuộc phiên bản khác. Dữ liệu được giữ nguyên.');
  return { coins: 0, appearance: {}, progress: { gameplaySeason: GAMEPLAY_SEASON }, settings: { ...data?.settings } };
}

export function gameplaySpace(base) {
  if (!['local','test','beta','production'].includes(base)) throw new RangeError('Unknown Firebase environment.');
  return `${base}${GAMEPLAY_SPACE_SUFFIX}`;
}
