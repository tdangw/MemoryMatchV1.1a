export function gameRecordLabel(progress, mode, level) {
  if (mode === 'challenge' || mode === 'endless') return `Kỷ lục: Màn ${(progress.levelBestsV3?.[mode]?.levelReached || 0).toLocaleString('vi-VN')}`;
  return `Kỷ lục: ${(progress.bestByLevel?.[`${mode}:${level}`]?.score || 0).toLocaleString('vi-VN')} điểm`;
}
