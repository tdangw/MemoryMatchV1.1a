import { getActiveLinkConnectionEffect } from "./linkEffects.js";

const PATH_VIEWBOX = "0 0 100 100";
const ELECTRIC_JITTER_PERCENT = 0.65;
const ELECTRIC_SEGMENT_LENGTH_PERCENT = 7;
let layoutFrame;

window.addEventListener("resize", () => {
  cancelAnimationFrame(layoutFrame);
  layoutFrame = requestAnimationFrame(updateLinkBoardLayout);
});

export function renderLinkBoard(board, { onTileClick } = {}) {
  const container = document.getElementById("link-board");
  if (!container) return;
  container.style.setProperty("--link-columns", String(board.columns));
  container.style.setProperty("--link-rows", String(board.grid.length - 2));
  container.replaceChildren();
  board.grid.slice(1, -1).forEach((row, rowIndex) => {
    row.slice(1, -1).forEach((tile, columnIndex) => {
      const position = { row: rowIndex + 1, column: columnIndex + 1 };
      const cell = document.createElement("div");
      cell.className = "link-board__cell";
      cell.dataset.row = String(position.row);
      cell.dataset.column = String(position.column);
      if (!tile) {
        cell.classList.add("is-empty");
        container.append(cell);
        return;
      }
      const button = document.createElement("button");
      button.type = "button";
      button.className = "link-tile";
      if (tile.special) button.classList.add("is-special");
      if (tile.iceBreaker) button.classList.add("is-ice-breaker");
      if (tile.luckyReward) button.classList.add("is-lucky");
      if (tile.frozen) {
        button.classList.add("is-frozen");
      }
      button.dataset.row = String(position.row);
      button.dataset.column = String(position.column);
      button.setAttribute(
        "aria-label",
        tile.frozen ? `${tile.alt} · thẻ đóng băng`
          : tile.iceBreaker ? `${tile.alt} · thẻ phá băng`
            : tile.alt,
      );
      const image = document.createElement("img");
      image.src = tile.src;
      image.alt = "";
      button.append(image);
      button.addEventListener("click", () => onTileClick?.(position));
      cell.append(button);
      container.append(cell);
    });
  });
  updateLinkBoardLayout();
}

export function setLinkTileSelected(position, selected) {
  getLinkTileButton(position)?.classList.toggle("is-selected", selected);
}

export function clearLinkTileSelection() {
  document.querySelectorAll(".link-tile.is-selected").forEach((tile) => {
    tile.classList.remove("is-selected");
  });
}

export function playLinkMatchExit(start, end) {
  const effect = getActiveLinkConnectionEffect();
  [start, end].forEach((position) => {
    getLinkTileButton(position)?.classList.add("is-removing", effect.exitClass);
  });
}

// Giữ nguyên các thẻ còn lại sau khi ghép đúng để tránh nháy do dựng lại ảnh.
export function clearLinkMatchedPair(start, end) {
  [start, end].forEach((position) => {
    const cell = getLinkBoardCell(position);
    if (!cell) return;
    cell.replaceChildren();
    cell.classList.add("is-empty");
  });
}

export function drawLinkPath(path, board) {
  const svg = document.getElementById("link-path-overlay");
  const boardElement = document.getElementById("link-board");
  if (!svg || !boardElement || !path) return;
  const points = path.map((position) => toPercentPoint(position, board, boardElement));
  if (points.some((point) => !point)) return;
  const electricPoints = createElectricPoints(points);
  const effect = getActiveLinkConnectionEffect();
  const serializedPoints = electricPoints.map(({ x, y }) => `${x},${y}`).join(" ");
  svg.setAttribute("viewBox", PATH_VIEWBOX);
  svg.setAttribute("preserveAspectRatio", "none");
  svg.setAttribute("class", `link-path-overlay ${effect.pathClass}`);
  svg.replaceChildren();
  const glow = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
  glow.setAttribute("points", serializedPoints);
  glow.setAttribute("pathLength", "1");
  glow.classList.add("link-path-overlay__glow");
  const polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
  polyline.setAttribute("points", serializedPoints);
  polyline.setAttribute("pathLength", "1");
  polyline.classList.add("link-path-overlay__beam");
  svg.append(glow, polyline);
  svg.classList.add("is-visible");
}

export function clearLinkPath() {
  const svg = document.getElementById("link-path-overlay");
  if (!svg) return;
  svg.replaceChildren();
  svg.classList.remove("is-visible");
}

function getLinkTileButton(position) {
  return document.querySelector(
    `.link-tile[data-row="${position.row}"][data-column="${position.column}"]`,
  );
}

function toPercentPoint(position, board, boardElement) {
  const boardRect = boardElement.getBoundingClientRect();
  const cell = getLinkBoardCell(position);
  if (cell) return toPercent(cell.getBoundingClientRect(), boardRect);

  const firstCell = getLinkBoardCell({ row: 1, column: 1 });
  if (!firstCell) return null;
  const cellRect = firstCell.getBoundingClientRect();
  const gap = readBoardGap(boardElement);
  const x = cellRect.left + (position.column - 1) * (cellRect.width + gap) + cellRect.width / 2;
  const y = cellRect.top + (position.row - 1) * (cellRect.height + gap) + cellRect.height / 2;
  return {
    x: ((x - boardRect.left) / boardRect.width) * 100,
    y: ((y - boardRect.top) / boardRect.height) * 100,
  };
}

function getLinkBoardCell(position) {
  return document.querySelector(
    `.link-board__cell[data-row="${position.row}"][data-column="${position.column}"]`,
  );
}

function toPercent(cellRect, boardRect) {
  return {
    x: ((cellRect.left + cellRect.width / 2 - boardRect.left) / boardRect.width) * 100,
    y: ((cellRect.top + cellRect.height / 2 - boardRect.top) / boardRect.height) * 100,
  };
}

function createElectricPoints(points) {
  return points.flatMap((point, index) => {
    if (index === points.length - 1) return [point];
    const next = points[index + 1];
    const horizontal = Math.abs(next.x - point.x) >= Math.abs(next.y - point.y);
    const distance = horizontal ? Math.abs(next.x - point.x) : Math.abs(next.y - point.y);
    const steps = Math.max(2, Math.round(distance / ELECTRIC_SEGMENT_LENGTH_PERCENT));
    const segmentPoints = index === 0 ? [point] : [];
    for (let step = 1; step < steps; step += 1) {
      const progress = step / steps;
      const jitter = (Math.random() * 2 - 1) * ELECTRIC_JITTER_PERCENT;
      segmentPoints.push(horizontal
        ? { x: interpolate(point.x, next.x, progress), y: point.y + jitter }
        : { x: point.x + jitter, y: interpolate(point.y, next.y, progress) });
    }
    segmentPoints.push(next);
    return segmentPoints;
  });
}

function interpolate(start, end, progress) {
  return start + (end - start) * progress;
}

function readBoardGap(boardElement) {
  return Number.parseFloat(getComputedStyle(boardElement).gap) || 0;
}

function updateLinkBoardLayout() {
  const game = document.getElementById("link-connect-container");
  const board = document.getElementById("link-board");
  const frame = document.getElementById("link-board-frame");
  if (!game || !board || !frame || game.hidden) return;

  const columns = Number.parseInt(board.style.getPropertyValue("--link-columns"), 10);
  const rows = Number.parseInt(board.style.getPropertyValue("--link-rows"), 10);
  if (!columns || !rows) return;

  const boardStyles = getComputedStyle(board);
  const gameStyles = getComputedStyle(game);
  const gap = readBoardGap(board);
  const horizontalPadding = Number.parseFloat(boardStyles.paddingLeft) || 0;
  const verticalPadding = Number.parseFloat(boardStyles.paddingTop) || 0;
  const gamePadding = (Number.parseFloat(gameStyles.paddingTop) || 0)
    + (Number.parseFloat(gameStyles.paddingBottom) || 0);
  const gameGap = Number.parseFloat(gameStyles.rowGap) || 0;
  const chromeHeight = [
    ".link-connect-game__header",
    ".link-connect-game__stats",
    ".link-connect-game__footer",
    ".link-connect-game__items",
  ].reduce((total, selector) => total + (game.querySelector(selector)?.getBoundingClientRect().height || 0), 0);
  const availableWidth = Math.min(700, game.clientWidth);
  const availableHeight = Math.max(
    168,
    window.innerHeight - chromeHeight - gamePadding - gameGap * 4,
  );
  const tileByWidth = (availableWidth - horizontalPadding * 2 - gap * (columns - 1)) / columns;
  const tileByHeight = (availableHeight - verticalPadding * 2 - gap * (rows - 1)) / rows;
  const tileSize = Math.max(28, Math.floor(Math.min(tileByWidth, tileByHeight)));
  const boardWidth = tileSize * columns + gap * (columns - 1) + horizontalPadding * 2;

  board.style.setProperty("--link-tile-size", `${tileSize}px`);
  frame.style.width = `${boardWidth}px`;
}
