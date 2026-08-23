import { isBackgroundMusicPlaying, pauseBackgroundMusic, pauseGameAudio, sounds, syncDefaultMusic } from './sound.js';
import { openAppModal } from './modal.js';
import { GAME_CONFIG, getModeLayout } from './config.js';
import { createGrid } from './grid.js';
import {
  updateLevelDisplay,
  updateScoreDisplay,
  updateHighScoreDisplay,
  updateHintDisplay,
  updateTimerDisplay,
  updateMovesDisplay,
  updateMissesDisplay,
  updatePairProgressDisplay,
  showBonusOverlay,
  showLevelRewardOverlay,
} from './ui.js';
import { beginRound, gameState, invalidateRound, resetGame, increaseScore } from './gameState.js';
import { configureLogic } from './logic.js';
import { saveHighScore } from './persistence.js';

let countdownInterval;
let isAutoPaused = false;
let shouldResumeMusic = false;
let navigation = { showDifficulty: () => {}, createMenu: () => {} };

export function configureGameController(actions) {
  navigation = { ...navigation, ...actions };
}

export function initializeLevel(level) {
  stopCountdown();
  pauseBackgroundMusic();
  isAutoPaused = false;
  document.body.classList.remove('game-is-paused');
  const gameContainer = document.getElementById('game-container');
  if (gameContainer) gameContainer.style.display = 'flex';

  const layout = getModeLayout(gameState.settings.mode || 'easy', level);
  const roundId = beginRound();
  createGrid(layout, { roundId, onPreviewComplete: startCountdown });

  gameState.moves = 0;
  gameState.misses = 0;
  gameState.matchedPairs = 0;
  gameState.totalPairs = layout.tileCount / 2;

  updateLevelDisplay(level);
  updateScoreDisplay(gameState.score);
  updateHintDisplay(gameState.hints);
  updateMovesDisplay(gameState.moves);
  updateMissesDisplay(gameState.misses);
  updatePairProgressDisplay(gameState.matchedPairs, gameState.totalPairs);
  updateTimerDisplay(gameState.remainingTime);
  handleLevelReward();
}

function startCountdown(roundId = gameState.roundId) {
  if (gameState.roundId !== roundId) return;
  stopCountdown();
  syncDefaultMusic(gameState.settings);
  countdownInterval = setInterval(() => {
    if (gameState.roundId !== roundId) return stopCountdown();
    if (gameState.isPaused || gameState.isLocked) return;

    gameState.remainingTime -= 1;
    updateTimerDisplay(gameState.remainingTime);
    if (gameState.remainingTime <= 0) handleTimeUp();
  }, 1000);
}

function stopCountdown() {
  clearInterval(countdownInterval);
  countdownInterval = undefined;
}

function isGameVisible() {
  const gameContainer = document.getElementById('game-container');
  return gameContainer?.style.display === 'flex';
}

function pauseForBackground() {
  // Âm thanh phải dừng ở mọi màn hình, kể cả menu và popup.
  shouldResumeMusic = isBackgroundMusicPlaying();
  pauseGameAudio();

  if (!isGameVisible()) return;
  if (gameState.isPaused) return;

  isAutoPaused = true;
  gameState.isPaused = true;
  document.body.classList.add('game-is-paused');
}

function resumeFromBackground() {
  if (isAutoPaused) {
    isAutoPaused = false;
    gameState.isPaused = false;
    document.body.classList.remove('game-is-paused');
  }
  if (shouldResumeMusic) syncDefaultMusic(gameState.settings);
  shouldResumeMusic = false;
}

function handleTimeUp() {
  stopCountdown();
  invalidateRound();
  let actionSelected = false;

  const returnToMenu = () => {
    resetGame();
    document.getElementById('game-container')?.style.setProperty('display', 'none');
    navigation.createMenu();
    syncDefaultMusic(gameState.settings);
  };

  pauseBackgroundMusic();
  if (gameState.settings.sound) {
    sounds.defeat.currentTime = 0;
    sounds.defeat.play().catch(() => {});
  }

  openAppModal({
    id: 'time-up-modal',
    icon: 'timer',
    title: 'Hết giờ',
    content: '<p>Thời gian đã hết. Bạn có thể chơi lại hoặc quay về Menu.</p>',
    actions: [
      { label: 'Về Menu', variant: 'secondary', onClick: (close) => { actionSelected = true; close(); returnToMenu(); } },
      { label: 'Chơi lại', variant: 'primary', onClick: (close) => {
        actionSelected = true;
        close();
        gameState.fromDefeat = true;
        navigation.showDifficulty(true);
      } },
    ],
    onClose: () => { if (!actionSelected) returnToMenu(); },
  });
}

function handleLevelReward() {
  const { currentLevel: level, hints: hintCount, remainingTime } = gameState;
  const isFirstLevel = level === 1;
  const reward = isFirstLevel ? 0 : 10 + level * 2 + Math.floor(remainingTime / 10) + hintCount * 2;
  const hintGain = isFirstLevel ? 0 : 1;
  const extraTime = isFirstLevel ? 0 : 30 + Math.floor(level / 5) * 5;

  if (reward > 0) addScore(reward);
  gameState.hints += hintGain;
  gameState.remainingTime += extraTime;
  updateHintDisplay(gameState.hints);
  updateTimerDisplay(gameState.remainingTime);
  showLevelRewardOverlay({ reward, hintGain, timeBonus: extraTime });
}

function addScore(points) {
  const scoreUpdate = increaseScore(points);
  updateScoreDisplay(scoreUpdate.score);
  if (scoreUpdate.highScoreChanged) {
    saveHighScore(scoreUpdate.highScore);
    updateHighScoreDisplay(scoreUpdate.highScore);
  }
}

export function nextLevel() {
  gameState.currentLevel += 1;
  initializeLevel(gameState.currentLevel);
}

export function returnToMainMenu() {
  stopCountdown();
  isAutoPaused = false;
  document.body.classList.remove('game-is-paused');
  resetGame();
  document.getElementById('game-container')?.style.setProperty('display', 'none');
  navigation.createMenu();
  syncDefaultMusic(gameState.settings);
}

export function handleHintClick() {
  if (gameState.isLocked || gameState.isPaused) return;
  if (gameState.hints <= 0) return showBonusOverlay('Bạn đã hết lượt gợi ý.');
  if (document.querySelector('.tile.selected')) {
    showBonusOverlay('Hãy hoàn thành lượt chọn hiện tại trước khi dùng gợi ý.');
    return;
  }

  const tilePairs = {};
  document.querySelectorAll('.tile:not(.matched):not(.selected)').forEach((tile) => {
    const imageId = tile.dataset.imageId;
    (tilePairs[imageId] ||= []).push(tile);
  });

  const availablePairs = Object.values(tilePairs).filter((tiles) => tiles.length >= 2);
  const pair = availablePairs[Math.floor(Math.random() * availablePairs.length)];
  if (!pair) return showBonusOverlay('Hiện không có cặp thẻ phù hợp để gợi ý.');

  gameState.hints -= 1;
  updateHintDisplay(gameState.hints);
  revealHintPair(pair.slice(0, 2), gameState.roundId);
  showBonusOverlay('Đã lật 2 thẻ trong vài giây.');
}

function revealHintPair(tiles, roundId) {
  const grid = document.getElementById('grid-container');
  gameState.isLocked = true;
  grid?.classList.add('is-locked');

  tiles.forEach((tile) => {
    const image = tile.querySelector('img');
    if (image) {
      image.classList.remove('hidden', 'appear-bounce');
      void image.offsetWidth;
      image.classList.add('appear-bounce');
      setTimeout(() => image.classList.remove('appear-bounce'), 600);
    }
    tile.classList.add('hint-reveal');
  });

  setTimeout(() => {
    if (gameState.roundId !== roundId) return;

    tiles.forEach((tile) => {
      if (!tile.classList.contains('matched')) tile.querySelector('img')?.classList.add('hidden');
      tile.classList.remove('hint-reveal');
    });

    gameState.isLocked = false;
    grid?.classList.remove('is-locked');
  }, GAME_CONFIG.hintRevealDurationMs);
}

configureLogic({ onNext: nextLevel, onMenu: returnToMainMenu });

document.addEventListener('visibilitychange', () => {
  if (document.hidden) pauseForBackground();
  else resumeFromBackground();
});
