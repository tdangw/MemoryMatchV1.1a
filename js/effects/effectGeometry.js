export function centerOf(rect) {
  return Object.freeze({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
}

export function targetCentroid(rects) {
  if (!Array.isArray(rects) || rects.length < 2) throw new TypeError("Effect requires at least two target rects");
  const centers = rects.map(centerOf);
  return Object.freeze({
    x: centers.reduce((sum, point) => sum + point.x, 0) / centers.length,
    y: centers.reduce((sum, point) => sum + point.y, 0) / centers.length,
  });
}

export function normalizePath(points) {
  if (!Array.isArray(points) || points.length < 2) throw new TypeError("Connection needs two or more points");
  return Object.freeze(points.reduce((result, point) => {
    if (!Number.isFinite(point?.x) || !Number.isFinite(point?.y)) throw new TypeError("Invalid connection point");
    const previous = result.at(-1);
    if (!previous || previous.x !== point.x || previous.y !== point.y) result.push(Object.freeze({ x: point.x, y: point.y }));
    return result;
  }, []));
}
