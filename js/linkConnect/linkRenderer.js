const PATH_VIEWBOX = "0 0 100 100";

export function renderLinkBoard(board, { onTileClick } = {}) {
  const container = document.getElementById("link-board");
  if (!container) return;
  container.style.setProperty("--link-columns", String(board.columns));
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
      button.dataset.row = String(position.row);
      button.dataset.column = String(position.column);
      button.setAttribute("aria-label", tile.alt);
      const image = document.createElement("img");
      image.src = tile.src;
      image.alt = "";
      button.append(image);
      button.addEventListener("click", () => onTileClick?.(position));
      cell.append(button);
      container.append(cell);
    });
  });
}

export function setLinkTileSelected(position, selected) {
  getLinkTileButton(position)?.classList.toggle("is-selected", selected);
}

export function clearLinkTileSelection() {
  document.querySelectorAll(".link-tile.is-selected").forEach((tile) => {
    tile.classList.remove("is-selected");
  });
}

export function drawLinkPath(path, board) {
  const svg = document.getElementById("link-path-overlay");
  const boardElement = document.getElementById("link-board");
  if (!svg || !boardElement || !path) return;
  const points = path.map((position) => toPercentPoint(position, board, boardElement));
  if (points.some((point) => !point)) return;
  svg.setAttribute("viewBox", PATH_VIEWBOX);
  svg.replaceChildren();
  const polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
  polyline.setAttribute("points", points.map(({ x, y }) => `${x},${y}`).join(" "));
  polyline.classList.add("link-path-overlay__beam");
  svg.append(polyline);
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
  const firstTile = boardElement.querySelector(".link-tile");
  if (!firstTile) return null;
  const boardRect = boardElement.getBoundingClientRect();
  const tileRect = firstTile.getBoundingClientRect();
  const gap = readBoardGap(boardElement);
  const x = tileRect.left + (position.column - 1) * (tileRect.width + gap) + tileRect.width / 2;
  const y = tileRect.top + (position.row - 1) * (tileRect.height + gap) + tileRect.height / 2;
  return {
    x: ((x - boardRect.left) / boardRect.width) * 100,
    y: ((y - boardRect.top) / boardRect.height) * 100,
  };
}

function readBoardGap(boardElement) {
  return Number.parseFloat(getComputedStyle(boardElement).gap) || 0;
}
