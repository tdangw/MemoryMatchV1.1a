/** Source pixels to the positioning area of a centered cover background. */
export function coverGeometry(width, height, sourceWidth, sourceHeight) {
  if (![width, height, sourceWidth, sourceHeight].every(value => Number.isFinite(value) && value > 0)) return null;
  const scale = Math.max(width / sourceWidth, height / sourceHeight);
  return { scale, x: (width - sourceWidth * scale) / 2, y: (height - sourceHeight * scale) / 2 };
}

/** Keep the complete motion envelope visible and outside interactive regions. */
export function placeRegion(region, cover, viewport, exclusions = []) {
  if (!cover) return null;
  const rect = { x: cover.x + region.x * cover.scale, y: cover.y + region.y * cover.scale,
    width: region.width * cover.scale, height: region.height * cover.scale };
  if (rect.x < 0 || rect.y < 0 || rect.x + rect.width > viewport.width || rect.y + rect.height > viewport.height) return null;
  if (exclusions.some(other => rect.x < other.right && rect.x + rect.width > other.left && rect.y < other.bottom && rect.y + rect.height > other.top)) return null;
  return rect;
}

export function visibleMapTiles({ scrollTop, positionY, tileHeight, viewportHeight, maxSlots = 3 }) {
  if (![scrollTop, positionY, tileHeight, viewportHeight].every(Number.isFinite) || tileHeight <= 0 || viewportHeight <= 0) return [];
  const first = Math.floor((scrollTop - positionY) / tileHeight);
  const count = Math.min(maxSlots, Math.ceil((scrollTop + viewportHeight - positionY) / tileHeight) - first);
  return Array.from({ length: Math.max(0, count) }, (_, index) => first + index);
}
