import { shellTimeout as setTimeout } from "./gameShell/gameShellLifecycle.js";
import { gameState } from "./gameState.js";
import { GAMEPLAY_TIMING } from "./gameplayTuning.js";
import { showRevealTimerInHud } from "./ui.js";
import { shuffleArray } from "./utils.js";
import { memoryBoard } from './memoryMatch/memoryBoard.js';

export function revealMemoryTiles(
  count = "all",
  duration = GAMEPLAY_TIMING.shopRevealDurationMs,
  roundId = gameState.roundId,
) {
  if (gameState.roundId !== roundId || gameState.isPaused) return false;
  const grid = document.getElementById("grid-container");
  const candidates = Array.from(document.querySelectorAll('#grid-container .tile img.hidden'))
    .filter(image => memoryBoard.tiles.get(image.parentElement.id).matched === false);
  if (!candidates.length) return false;
  const selected = count === "all"
    ? candidates
    : shuffleArray(candidates).slice(0, Math.max(0, Math.floor(Number(count) || 0)));
  if (!selected.length) return false;

  gameState.isLocked = true;
  grid?.classList.add("is-locked");
  selected.forEach((img) => {
    img.classList.remove("hidden");
    img.classList.add("highlight-tile");
  });
  showRevealTimerInHud(duration / 1000, roundId);

  setTimeout(() => {
    if (gameState.roundId !== roundId) return;
    selected.forEach((img) => {
      if (img.isConnected && memoryBoard.tiles.get(img.parentElement.id).matched === false) img.classList.add("hidden");
      img.classList.remove("highlight-tile");
    });
    gameState.isLocked = false;
    grid?.classList.remove("is-locked");
  }, duration);
  return true;
}
