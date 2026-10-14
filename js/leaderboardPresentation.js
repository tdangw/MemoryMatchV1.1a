export function formatLeaderboardTime(durationMs) {
  if (!Number.isSafeInteger(durationMs) || durationMs <= 0) return '—';
  const centiseconds = Math.round(durationMs / 10);
  const seconds = Math.floor(centiseconds / 100);
  const minutes = Math.floor(seconds / 60);
  const fraction = String(centiseconds % 100).padStart(2, '0');
  const tail = `${String(seconds % 60).padStart(2, '0')},${fraction}`;
  return minutes < 60 ? `${String(minutes).padStart(2, '0')}:${tail}`
    : `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}:${tail}`;
}
export function formatLeaderboardNumber(value) {
  return Number.isSafeInteger(value) && value >= 0 ? value.toLocaleString('vi-VN') : '—';
}
