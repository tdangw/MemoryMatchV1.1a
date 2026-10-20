import { LINK_CONNECT_CONFIG } from "./linkConfig.js";

const DIRECTIONS = Object.freeze([
  Object.freeze({ row: -1, column: 0 }),
  Object.freeze({ row: 0, column: 1 }),
  Object.freeze({ row: 1, column: 0 }),
  Object.freeze({ row: 0, column: -1 }),
]);

export function findConnectionPath(grid, start, end, {
  maxTurns = LINK_CONNECT_CONFIG.pathfinding.maxTurns,
} = {}) {
  if (!isValidGrid(grid) || !isValidPosition(grid, start) || !isValidPosition(grid, end)) return null;
  if (samePosition(start, end) || !grid[start.row][start.column] || !grid[end.row][end.column]) return null;

  const queue = [{ ...start, direction: -1, turns: 0, parent: null }];
  const visited = new Map();

  for (let head = 0; head < queue.length; head += 1) {
    const current = queue[head];
    for (let direction = 0; direction < DIRECTIONS.length; direction += 1) {
      const next = {
        row: current.row + DIRECTIONS[direction].row,
        column: current.column + DIRECTIONS[direction].column,
      };
      if (!isValidPosition(grid, next) || !isTraversable(grid, next, end)) continue;

      const turns = current.direction < 0 || current.direction === direction
        ? current.turns
        : current.turns + 1;
      if (turns > maxTurns) continue;

      if (samePosition(next, end)) return compressRoute(reconstructRoute(current, next, start));

      const key = `${next.row}:${next.column}:${direction}`;
      if ((visited.get(key) ?? Infinity) <= turns) continue;
      visited.set(key, turns);
      queue.push({ ...next, direction, turns, parent: current });
    }
  }
  return null;
}

function collectConnections(grid, firstOnly) {
  if (!isValidGrid(grid)) return [];
  const positionsById = new Map();
  grid.forEach((row, rowIndex) => row.forEach((tile, columnIndex) => {
    if (!tile?.id || tile.frozen) return;
    const positions = positionsById.get(tile.id) || [];
    positions.push({ row: rowIndex, column: columnIndex });
    positionsById.set(tile.id, positions);
  }));

  const connections = [];
  for (const [id, positions] of positionsById) {
    for (let left = 0; left < positions.length - 1; left += 1) {
      for (let right = left + 1; right < positions.length; right += 1) {
        const path = findConnectionPath(grid, positions[left], positions[right]);
        if (path) {
          const connection = { id, start: positions[left], end: positions[right], path };
          if (firstOnly) return [connection];
          connections.push(connection);
        }
      }
    }
  }
  return connections;
}

export function findAvailableConnections(grid) {
  return collectConnections(grid, false);
}

export function findFirstAvailableConnection(grid) {
  return collectConnections(grid, true)[0] || null;
}

export function hasAvailableConnection(grid) {
  return findFirstAvailableConnection(grid) !== null;
}

function compressRoute(route) {
  if (route.length <= 2) return route;
  const points = [route[0]];
  for (let index = 1; index < route.length - 1; index += 1) {
    const previous = route[index - 1];
    const current = route[index];
    const next = route[index + 1];
    const changedDirection = previous.row - current.row !== current.row - next.row
      || previous.column - current.column !== current.column - next.column;
    if (changedDirection) points.push(current);
  }
  points.push(route.at(-1));
  return points;
}

function reconstructRoute(current, end, start) {
  const route = [end];
  for (let node = current; node; node = node.parent) route.push(node.parent ? { row: node.row, column: node.column } : { ...start });
  return route.reverse();
}

function isTraversable(grid, position, end) {
  return samePosition(position, end) || grid[position.row][position.column] === null;
}

function isValidGrid(grid) {
  return Array.isArray(grid)
    && grid.length > 0
    && grid.every((row) => Array.isArray(row) && row.length === grid[0].length);
}

function isValidPosition(grid, position) {
  return Number.isInteger(position?.row)
    && Number.isInteger(position?.column)
    && position.row >= 0
    && position.row < grid.length
    && position.column >= 0
    && position.column < grid[0].length;
}

function samePosition(left, right) {
  return left.row === right.row && left.column === right.column;
}
