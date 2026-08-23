// logic.js - Xử lý logic của trò chơi
// chức năng của logic.js là xử lý logic của trò chơi, bao gồm việc xử lý sự kiện khi người chơi nhấp vào ô, kiểm tra xem hai ô có khớp nhau hay không, và kiểm tra xem người chơi đã hoàn thành cấp độ hay chưa. Nó cũng bao gồm các chức năng để khởi tạo logic và xử lý âm thanh khi người chơi tương tác với trò chơi.

import { increaseScore, gameState } from './gameState.js';
import {
  updateScoreDisplay,
  updateHighScoreDisplay,
  updateMovesDisplay,
  updateMissesDisplay,
  updatePairProgressDisplay,
  showTilePointEffect,
  highlightTarget,
  showLevelSummaryOverlay,
} from './ui.js';
import { pauseBackgroundMusic, sounds } from './sound.js'; // 📦 Tách âm thanh
import { saveHighScore } from './persistence.js';

let selectedTiles = [];
let levelCompleteActions = { onNext: () => {}, onMenu: () => {} };
const TILE_HIDE_ANIMATION_MS = 180;

export function configureLogic(actions) {
  levelCompleteActions = { ...levelCompleteActions, ...actions };
}

function setInteractionLocked(locked, roundId = gameState.roundId) {
  if (gameState.roundId !== roundId) return;
  gameState.isLocked = locked;
  document.getElementById('grid-container')?.classList.toggle('is-locked', locked);
}

function revealTile(img) {
  img.classList.remove('hidden', 'appear-bounce');
  void img.offsetWidth;
  img.classList.add('appear-bounce');
  setTimeout(() => img.classList.remove('appear-bounce'), 600);
}

function hideTile(img, roundId, onHidden) {
  if (!img) return onHidden?.();

  img.classList.remove('appear-bounce', 'hide-fade-scale');
  void img.offsetWidth;
  img.classList.add('hide-fade-scale');
  setTimeout(() => {
    if (gameState.roundId === roundId) img.classList.add('hidden');
    img.classList.remove('hide-fade-scale');
    onHidden?.();
  }, TILE_HIDE_ANIMATION_MS);
}

/**
 * Khởi tạo logic và gán sự kiện click cho tất cả tile
 */
export function initLogic() {
  selectedTiles = [];
  const tiles = document.querySelectorAll('.tile');
  tiles.forEach((tile) => {
    tile.onclick = () => handleTileClick(tile);
  });
}

/**
 * Xử lý khi người chơi click vào tile
 */
export function handleTileClick(tileElement) {
  if (gameState.isLocked || selectedTiles.length >= 2) return;

  const imageId = tileElement.dataset.imageId;
  const img = tileElement.querySelector('img');

  // Ngăn double click hoặc click trùng
  if (tileElement.classList.contains('matched') || tileElement.classList.contains('selected') || !img) return;

  // 🎵 Phát âm click nếu bật sound
  if (gameState.settings?.sound) {
    sounds.click.currentTime = 0;
    sounds.click.play().catch(() => {});
  }

  revealTile(img);
  tileElement.classList.add('selected');

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
    first.element.classList.remove('selected');
    second.element.classList.remove('selected');
    first.element.classList.add('matched');
    second.element.classList.add('matched');

    const matchPoints = 2; // Cộng điểm khi match
    const scoreUpdate = increaseScore(matchPoints);
    updateScoreDisplay(scoreUpdate.score);
    if (scoreUpdate.highScoreChanged) {
      saveHighScore(scoreUpdate.highScore);
      updateHighScoreDisplay(scoreUpdate.highScore);
    }
    gameState.matchedPairs++;
    updatePairProgressDisplay(gameState.matchedPairs);
    showTilePointEffect(second.element, `+${matchPoints} điểm`);
    highlightTarget('#pair-progress');

    if (gameState.settings?.sound) {
      sounds.match.currentTime = 0;
      sounds.match.play().catch(() => {});
    }

    setInteractionLocked(false, roundId);
    checkLevelComplete();
  } else {
    gameState.misses++;
    updateMissesDisplay(gameState.misses);
    first.element.classList.add('wrong');
    second.element.classList.add('wrong');

    if (gameState.settings?.sound) {
      sounds.wrong.currentTime = 0;
      sounds.wrong.play().catch(() => {});
    }

    setTimeout(() => {
      if (gameState.roundId !== roundId) return;

      first.element.classList.remove('selected', 'wrong');
      second.element.classList.remove('selected', 'wrong');

      const img1 = first.element.querySelector('img');
      const img2 = second.element.querySelector('img');
      let pendingHides = 2;
      const onHidden = () => {
        pendingHides -= 1;
        if (pendingHides === 0) setInteractionLocked(false, roundId);
      };
      hideTile(img1, roundId, onHidden);
      hideTile(img2, roundId, onHidden);
    }, 800);
  }

  selectedTiles = [];
}

/**
 * Kiểm tra nếu đã matched hết → qua màn
 */
export function checkLevelComplete() {
  const allTiles = document.querySelectorAll('.tile');
  const matchedTiles = document.querySelectorAll('.tile.matched');

  if (allTiles.length > 0 && allTiles.length === matchedTiles.length) {
    setInteractionLocked(true);
    gameState.isPaused = true;
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
      onNext: levelCompleteActions.onNext,
      onMenu: levelCompleteActions.onMenu,
    });
  }
}
