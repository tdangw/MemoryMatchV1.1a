// logic.js - Xử lý logic của trò chơi
// chức năng của logic.js là xử lý logic của trò chơi, bao gồm việc xử lý sự kiện khi người chơi nhấp vào ô, kiểm tra xem hai ô có khớp nhau hay không, và kiểm tra xem người chơi đã hoàn thành cấp độ hay chưa. Nó cũng bao gồm các chức năng để khởi tạo logic và xử lý âm thanh khi người chơi tương tác với trò chơi.

import { increaseCoins, increaseScore, gameState } from "./gameState.js";
import { calculateCoinReward } from "./config.js";
import {
  updateScoreDisplay,
  updateTimerDisplay,
  updateMovesDisplay,
  updateMissesDisplay,
  updateComboDisplay,
  updatePairProgressDisplay,
  updateCoinDisplay,
  showComboEffect,
  highlightTarget,
  showLevelSummaryOverlay,
} from "./ui.js";
import { pauseBackgroundMusic, sounds } from "./sound.js"; // 📦 Tách âm thanh
import { saveCoins } from "./persistence.js";
import { getFlipAnimationClass } from "./appearance.js";
import { GAMEPLAY_TIMING, getComboTimeBonus } from "./gameplayTuning.js";

let selectedTiles = [];
let levelCompleteActions = { onNext: () => {}, onMenu: () => {} };
let pendingMismatch = null;

export function configureLogic(actions) {
  levelCompleteActions = { ...levelCompleteActions, ...actions };
}

function setInteractionLocked(locked, roundId = gameState.roundId) {
  if (gameState.roundId !== roundId) return;
  gameState.isLocked = locked;
  document
    .getElementById("grid-container")
    ?.classList.toggle("is-locked", locked);
}

function revealTile(img) {
  const animationClass = getFlipAnimationClass(gameState.appearance.flipEffect);
  img.classList.remove(
    "hidden",
    "appear-bounce",
    "appear-fade-scale",
    "appear-pop",
    "appear-slide-up",
    "appear-flip-y",
    "appear-zoom-rotate",
    "appear-blur-in",
  );
  void img.offsetWidth;
  img.classList.add(animationClass);
  setTimeout(
    () => img.classList.remove(animationClass),
    GAMEPLAY_TIMING.tileRevealAnimationMs,
  );
}

function hideTile(img, roundId, onHidden) {
  if (!img) return onHidden?.();

  img.classList.remove("appear-bounce", "hide-fade-scale");
  void img.offsetWidth;
  img.classList.add("hide-fade-scale");
  setTimeout(() => {
    if (gameState.roundId === roundId) img.classList.add("hidden");
    img.classList.remove("hide-fade-scale");
    onHidden?.();
  }, GAMEPLAY_TIMING.tileHideAnimationMs);
}

function resolvePendingMismatch({ immediately = false } = {}) {
  const mismatch = pendingMismatch;
  if (!mismatch) return;

  pendingMismatch = null;
  clearTimeout(mismatch.timeoutId);
  if (gameState.roundId !== mismatch.roundId) return;

  mismatch.tiles.forEach((tile) => tile.classList.remove("selected", "wrong"));
  if (immediately) {
    mismatch.tiles.forEach((tile) =>
      tile.querySelector("img")?.classList.add("hidden"),
    );
    setInteractionLocked(false, mismatch.roundId);
    return;
  }

  setInteractionLocked(true, mismatch.roundId);
  let remainingHides = mismatch.tiles.length;
  const unlockWhenHidden = () => {
    remainingHides -= 1;
    if (remainingHides === 0) setInteractionLocked(false, mismatch.roundId);
  };
  mismatch.tiles.forEach((tile) =>
    hideTile(tile.querySelector("img"), mismatch.roundId, unlockWhenHidden),
  );
}

/**
 * Khởi tạo logic và gán sự kiện click cho tất cả tile
 */
export function initLogic() {
  if (pendingMismatch) clearTimeout(pendingMismatch.timeoutId);
  pendingMismatch = null;
  selectedTiles = [];
  const tiles = document.querySelectorAll(".tile");
  tiles.forEach((tile) => {
    tile.onclick = () => handleTileClick(tile);
  });
}

/**
 * Xử lý khi người chơi click vào tile
 */
export function handleTileClick(tileElement) {
  // Chạm một thẻ mới trong lúc cặp sai đang hiện sẽ đóng cặp đó ngay.
  resolvePendingMismatch({ immediately: true });
  if (gameState.isLocked || selectedTiles.length >= 2) return;

  const imageId = tileElement.dataset.imageId;
  const img = tileElement.querySelector("img");

  // Ngăn double click hoặc click trùng
  if (
    tileElement.classList.contains("matched") ||
    tileElement.classList.contains("selected") ||
    !img
  )
    return;

  // 🎵 Phát âm click nếu bật sound
  if (gameState.settings?.sound) {
    sounds.click.currentTime = 0;
    sounds.click.play().catch(() => {});
  }

  revealTile(img);
  tileElement.classList.add("selected");

  selectedTiles.push({ element: tileElement, imageId });
  if (selectedTiles.length === 2) {
    gameState.moves++;
    updateMovesDisplay(gameState.moves);
    setInteractionLocked(true);
    checkMatch(gameState.roundId);
  }
}

// So khớp 2 tile được chọn
function checkMatch(roundId) {
  const [first, second] = selectedTiles;

  if (first.imageId === second.imageId) {
    first.element.classList.remove("selected");
    second.element.classList.remove("selected");
    first.element.classList.add("matched");
    second.element.classList.add("matched");

    const matchPoints = 1;
    const score = increaseScore(matchPoints);
    updateScoreDisplay(score);
    gameState.combo += 1;
    updateComboDisplay(gameState.combo);
    const comboTimeBonus = getComboTimeBonus(gameState.combo);
    if (comboTimeBonus > 0) {
      gameState.remainingTime += comboTimeBonus;
      updateTimerDisplay(gameState.remainingTime);
      highlightTarget("#timer");
    }
    gameState.matchedPairs++;
    updatePairProgressDisplay(gameState.matchedPairs);
    if (comboTimeBonus > 0) showComboEffect(second.element, gameState.combo);
    highlightTarget("#pair-progress");

    if (gameState.settings?.sound) {
      sounds.match.currentTime = 0;
      sounds.match.play().catch(() => {});
    }

    setInteractionLocked(false, roundId);
    checkLevelComplete();
  } else {
    gameState.misses++;
    gameState.combo = 0;
    updateMissesDisplay(gameState.misses);
    updateComboDisplay(gameState.combo);
    first.element.classList.add("wrong");
    second.element.classList.add("wrong");

    if (gameState.settings?.sound) {
      sounds.wrong.currentTime = 0;
      sounds.wrong.play().catch(() => {});
    }

    // Trong thời gian viền đỏ hiển thị, người chơi có thể chạm thẻ khác để ẩn ngay.
    setInteractionLocked(false, roundId);
    pendingMismatch = {
      roundId,
      tiles: [first.element, second.element],
      timeoutId: setTimeout(
        () => resolvePendingMismatch(),
        GAMEPLAY_TIMING.mismatchRevealMs,
      ),
    };
  }

  selectedTiles = [];
}

/**
 * Kiểm tra nếu đã matched hết → qua màn
 */
export function checkLevelComplete() {
  const allTiles = document.querySelectorAll(".tile");
  const matchedTiles = document.querySelectorAll(".tile.matched");

  if (allTiles.length > 0 && allTiles.length === matchedTiles.length) {
    setInteractionLocked(true);
    gameState.isPaused = true;
    const grossCoins = calculateCoinReward(
      gameState.settings.mode,
      gameState.remainingTime,
    );
    const coinPenalty = Math.min(grossCoins, gameState.misses);
    const coinsEarned = grossCoins - coinPenalty;
    const totalCoins = increaseCoins(coinsEarned);
    saveCoins(totalCoins);
    updateCoinDisplay(totalCoins);
    pauseBackgroundMusic();
    if (gameState.settings?.sound) {
      sounds.victory.currentTime = 0;
      sounds.victory.play().catch(() => {});
    }
    showLevelSummaryOverlay({
      level: gameState.currentLevel,
      remainingTime: gameState.remainingTime,
      moves: gameState.moves,
      misses: gameState.misses,
      coinsEarned,
      onNext: levelCompleteActions.onNext,
      onMenu: levelCompleteActions.onMenu,
    });
  }
}
