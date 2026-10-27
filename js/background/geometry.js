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

/** Fit the complete rotated sprite, not just its unrotated top-left point. */
export function boundedSpriteMotion(kind, rect, map = false) {
  if (![rect.width,rect.height].every(n=>Number.isFinite(n)&&n>0)) throw new RangeError('Invalid ambient sprite envelope');
  if(kind==='fish') {
    const scale=Math.min(1,rect.width/22,rect.height/18);
    return {width:20*scale,height:13*scale,left:.5*scale,top:scale,
      endX:Math.max(0,rect.width-22*scale),endY:3*scale,rotation:-4};
  }
  if(kind==='leaf') {
    // A 12×9 box has a maximum rotated extent of 15 in either axis.
    const scale=Math.min(1,rect.width/15,rect.height/15);
    return {width:12*scale,height:9*scale,left:1.5*scale,top:3*scale,
      endX:Math.min(8,Math.max(0,rect.width-15*scale)),endY:Math.max(0,rect.height-15*scale),rotation:55};
  }
  if(kind==='firefly') {
    const size=Math.min(map?6:5,rect.width,rect.height);
    return {width:size,height:size,left:0,top:0,endX:Math.min(9,rect.width-size),endY:Math.min(12,rect.height-size),rotation:0};
  }
  throw new RangeError('Unknown ambient sprite');
}
