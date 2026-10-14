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

export function compactLeaderboardPages(loadedPages, currentPage, compact = false) {
  const pages = [...new Set(loadedPages)].filter(page => Number.isSafeInteger(page) && page >= 1 && page <= 100).sort((a, b) => a - b);
  if (!pages.length) return [];
  const keep = new Set(compact ? [pages[0], currentPage, pages.at(-1)]
    : [pages[0], pages[1], currentPage - 1, currentPage, currentPage + 1, pages.at(-2), pages.at(-1)]);
  const visible = pages.filter(page => keep.has(page));
  const items = [];
  for (const page of visible) {
    const previous = items.at(-1);
    if (typeof previous === 'number' && page - previous > 1) {
      if (!compact && page - previous === 2 && pages.includes(previous + 1)) items.push(previous + 1);
      else items.push('ellipsis');
    }
    items.push(page);
  }
  return items;
}
