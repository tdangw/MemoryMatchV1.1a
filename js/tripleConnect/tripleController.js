import { openGameExitDialog } from "../gameExitDialog.js";
import { showFullVictoryCelebration } from "victory-presentation";
import { canLaunchGame } from "../profileOperations.js";
import { rememberRecentGame } from '../recentGame.js';
import {
  createTripleCoverGraph,
  generateEasyTripleBoard,
  generateChallengeTripleBoard,
  generateEndlessTripleBoard,
  generateHardTripleBoard,
  generateNormalTripleBoard,
  generateSuperHardTripleBoard,
  getTripleLayout,
} from "./tripleBoard.js";
import { requestTripleGeneration } from "./tripleGeneration.js";
import { reduceTrustedTripleCommand } from "./tripleRules.js";
import {
  createTripleRoundState,
  claimTripleLuckyRewards,
  claimTripleMilestoneTiles,
  createTripleStateSnapshot,
  restoreTripleStateSnapshot,
  restoreSerializedTripleRoundState,
  serializeTripleRoundState,
} from "./tripleState.js";
import { createTripleRenderer } from "./tripleRenderer.js";
import { getTripleShell } from "./tripleShell.js";
import { getTripleHud, getTripleHudElements } from "./tripleShell.js";
import { presentTripleTransition } from "./triplePresentation.js";
import {
  commitThemeSession,
  getActiveSession,
  saveActiveSession,
} from "../sessionProgress.js";
import { consumeTripleItem, getTripleItemCount } from "./tripleItems.js";
import { getTripleHintTileIds } from "./tripleHint.js";
import { endTripleRound } from "./tripleState.js";
import {
  getTripleChallengeStage,
  getTripleModeConfig,
  getTripleCompletionScore,
  getTripleTrayCapacity,
  getTripleStarProgress,
  TRIPLE_PRODUCT_DECISIONS,
  isTripleChallengeComplete,
} from "./tripleConfig.js";
import { shuffleTripleBoardState } from "./tripleShuffle.js";
import { getEquippedThemeId } from "../appearance.js";
import { gameState, recordTripleConnectResult } from "../gameState.js";
import { openAppModal, showAppToast } from "../modal.js";
import { unmountActiveGameShell } from "../gameShell/gameShell.js";
import { createGameShellStartup } from "../gameShell/gameShellStartup.js";
import { bindGameHudMenus } from "../gameShell/gameHudMenus.js";
import { commitTripleRewardTransaction, consumeTripleItemWithSession } from "./tripleTransactions.js";
import { renderHudTimer } from "../gameShell/gameShellHud.js";
import { savePersistentGameData, isPersistenceBlocked } from "../persistence.js";
import { beginPlayMetrics, resumePlayMetrics, snapshotPlayMetrics, finishPlayMetrics } from "../playMetrics.js";
import { prepareAdventureChapter, stageAdventureLevelStart, canAdvanceAdventure } from "../adventureLaunch.js";
import { getChapterNumber } from "../adventureProgress.js";
import { beginRankedAttempt, finalizeRankedRun, getRankedRun, stageRankedAttempt } from "../rankingRules.js";
import { stageActiveSession } from "../sessionProgress.js";
import { calculateTripleCoinReward } from "./tripleConfig.js";
import { getLinkExitEffect, getLinkPathEffect } from "../linkConnect/linkEffects.js";
import { duckBackgroundMusicForVictory, restoreBackgroundMusic, sounds } from "../sound.js";
import { getGameModeLabel } from "../gameCatalog.js";
import { getTheme, getThemeSelectionEligibility, selectThemeCards } from "../themeCatalog.js";
import { playCoinRewardFlight } from "../coinRewards.js";
import { resolveTripleMilestoneProgress } from "./tripleMilestones.js";
import { openTimeUpModal, showLevelRewardOverlay, showLevelSummaryOverlay } from "../ui.js";
import { openTripleTrayExpansionPurchase } from "../shop.js";
import { createHudTimerScheduler } from "../gameShell/gameTimerProgress.js";
import { getComboWindowMs } from "../gameplayTuning.js";
import { clearComboWindow as clearComboWindowPresentation, playComboWindow } from "../gameShell/comboWindowPresentation.js";
import { clearShellTimeout } from "../gameShell/gameShellLifecycle.js";

const development = import.meta.env?.DEV === true;
let state = null;
let renderer = null;
let presentationCount = 0;
let boardPresentationRevision = 0;
let pendingGeneration = null;
let hintedTileIds = new Set();
let currentMode = "easy";
let currentLayout = null;
let currentSeed = null;
let currentAssetPathsByType = {};
let remainingTime = 0;
let currentLevel = 1;
let terminalSettled = false;
let modalPaused = false;
let backgroundPaused = false;
let roundStarted = false;
let roundGeneration = 0;
let terminalReason = null;
let roundLuckyRewards = [];
let roundMilestoneRewards = [];
let roundSeedNonce = 0;
let rebaseTripleTimer = () => {};
let navigation = {
  showMenu: null,
  showCollection: null,
  showShop: null,
  showSettings: null,
  showHelp: null,
  showReset: null,
};

export function configureTripleConnectController(options = {}) {
  navigation = { ...navigation, ...options };
}

export async function startTripleConnectDevelopmentRound({
  seed = "triple-dev",
  mode = "easy",
} = {}) {
  if (!development)
    throw new Error(
      "Triple Connect development hook is unavailable in production.",
    );
  return prepareTripleStartup(startup => startTripleConnectRoundFromGenerated({
    generated: generateTripleBoard({ seed, mode, level: 1 }),
    mode,
    level: 1,
    skipIntro: true,
    explicitSeed: true,
    startup,
  }));
}

export function startTripleConnectRound({ seed, mode = "easy", level = 1, elapsedTime, skipIntro = false, reason = "new" } = {}) {
  if (!canLaunchGame()) return null;
  const normalizedLevel = normalizeLevel(level);
  if (mode === "challenge") getTripleChallengeStage(normalizedLevel);
  const roundSeed = seed || createRoundSeed(mode, normalizedLevel);
  cancelPendingTripleGeneration();
  return prepareTripleStartup(async startup => {
    let generated;
    let request;
    try {
      request = requestTripleGeneration({ mode, seed: roundSeed, level: normalizedLevel });
      pendingGeneration = request;
      const release = startup.scope.own(() => {
        request.cancel();
        if (pendingGeneration === request) pendingGeneration = null;
      });
      try { generated = await startup.phase('generation', () => request.promise); }
      finally { release.forget(); }
      startup.check();
      if (pendingGeneration !== request) return null;
      pendingGeneration = null;
    } catch (error) {
      startup.check();
      if (String(error.message).includes('cancelled')) return null;
      pendingGeneration = null;
      console.warn('Triple worker unavailable; using bounded generation fallback', error);
      await startup.yield();
      generated = await startup.phase('generation-fallback', () => generateTripleBoard({ mode, seed: roundSeed, level: normalizedLevel }));
    }
    await startup.yield();
    return startup.phase('prepare', async () => (await startTripleConnectRoundFromGenerated({
      generated, mode, level: normalizedLevel, elapsedTime, skipIntro,
      explicitSeed: seed !== undefined, startup,
      reason,
    })));
  });
}

function prepareTripleStartup(prepare) {
  if (!canLaunchGame()) return Promise.resolve(null);
  const shell = getTripleShell();
  const scope = shell.mount();
  const startup = createGameShellStartup(scope, shell.refs, error => {
    console.error('Triple startup failed', error);
    showAppToast('Không thể chuẩn bị bàn chơi. Hãy chơi lại.');
  });
  roundStarted = false;
  return startup.run(async () => {
    const mounted = await prepare(startup);
    startup.check();
    if (!mounted) return null;
    await startup.yield();
    await startup.phase('render', mounted.renderInitial);
    await startup.yield();
    await mounted.activate();
    startup.check();
    await startup.phase('images', () => startup.decodeBoard());
    startup.check();
    if (mounted.commitStart && !await mounted.commitStart()) return null;
    startup.check();
    await mounted.markStartupReady();
    startup.check();
    return mounted;
  });
}

export function cancelPendingTripleGeneration() {
  pendingGeneration?.cancel();
  pendingGeneration = null;
}

function generateTripleBoard({ seed, mode, level }) {
  const generators = {
    easy: generateEasyTripleBoard,
    normal: generateNormalTripleBoard,
    hard: generateHardTripleBoard,
    superHard: generateSuperHardTripleBoard,
    endless: generateEndlessTripleBoard,
    challenge: generateChallengeTripleBoard,
  };
  const generate = generators[mode];
  if (!generate)
    throw new TypeError(`Unsupported Triple development mode: ${mode}`);
  return generate({ seed, level });
}

async function startTripleConnectRoundFromGenerated({ generated, mode, level, elapsedTime, skipIntro, explicitSeed, startup, reason = "new" }) {
  if (!await prepareAdventureChapter("triple-connect", getChapterNumber(level), () => startup.scope.active)) return null;
  startup.check();
  const themeId = getTheme(getEquippedThemeId(gameState.appearance, "triple-connect")).id;
  const typeIds = [...new Set(generated.board.tiles.map((tile) => tile.type))].sort();
  const theme = getTheme(themeId);
  const eligibility = getThemeSelectionEligibility(themeId, typeIds.length);
  if (!eligibility.ok) {
    showAppToast("Chủ đề này chưa sẵn sàng cho chế độ đã chọn. Hãy chọn chủ đề khác hoặc chế độ khác.");
    return null;
  }
  const selectedAssets = selectThemeCards(themeId, typeIds.length, {
      // Explicit seeds are fixture/development inputs and must reproduce both
      // geometry and visual assignment regardless of prior play history.
      history: explicitSeed ? [] : gameState.progress.themeSelectionHistory[themeId],
      random: createSeededRandom(`${generated.seed}:assets`),
    });
  if (selectedAssets.length !== typeIds.length) {
    throw new RangeError(`Chủ đề ${theme.title} không đủ ${typeIds.length} ảnh khác nhau cho mode này.`);
  }
  currentAssetPathsByType = Object.fromEntries(typeIds.map((type, index) => [type, selectedAssets[index]?.path]).filter(([, path]) => path));
  state = createTripleRoundState({ ...generated.board, assetPathsByType: currentAssetPathsByType, trayCapacity: getEffectiveTripleTrayCapacity() });
  currentMode = mode;
  currentLevel = level;
  currentLayout = getTripleLayout(generated.layoutId);
  currentSeed = generated.seed;
  remainingTime =
    mode === "endless" && Number.isInteger(elapsedTime) && elapsedTime >= 0
      ? elapsedTime
      : getTripleLevelTime(mode, level);
  const mounted = (await mountTripleDevelopmentRound(generated, { skipIntro, startup }));
  mounted.commitStart = () => {
    beginRankedAttempt("triple-connect", mode, level, { reason });
    stageAdventureLevelStart("triple-connect", mode, level);
    return commitThemeSession("triple-connect", createSession(state, remainingTime), themeId, selectedAssets);
  };
  return mounted;
}

export function continueTripleConnectDevelopmentRound({ mode = "easy" } = {}) {
  if (!development)
    throw new Error(
      "Triple Connect development hook is unavailable in production.",
    );
  return continueTripleConnectSession(getActiveSession("triple-connect", mode));
}

export function continueTripleConnectSession(session) {
  if (!session) return null;
  cancelPendingTripleGeneration();
  return prepareTripleStartup(async startup => {
  if (!isValidTripleConnectSession(session)) throw new Error('Invalid Triple session.');
  try {
    state = restoreSerializedTripleRoundState(session.snapshot, { trayCapacity: getEffectiveTripleTrayCapacity() });
    const layout = getTripleLayout(session.layoutId);
    currentMode = session.mode;
    currentLevel = normalizeLevel(session.level);
    currentLayout = layout;
    currentSeed =
      typeof session.seed === "string" && session.seed
        ? session.seed
        : createRoundSeed(currentMode, currentLevel);
    currentAssetPathsByType = { ...(state.assetPathsByType || {}) };
    remainingTime = Number.isInteger(session.remainingTime)
      ? session.remainingTime
      : getTripleLevelTime(currentMode, currentLevel);
  } catch {
    return null;
  }
  const mounted = await mountTripleDevelopmentRound({
    seed: "restored",
    board: null,
    witness: [],
  }, { startup, metrics: session.metrics || {} });
  mounted.commitStart = () => {
    beginRankedAttempt("triple-connect", currentMode, currentLevel, { reason: "resume", savedRun: session.run });
    return Promise.resolve(true);
  };
  return mounted;
  });
}

export function isValidTripleConnectSession(session) {
  if (
    !session?.snapshot ||
    typeof session.layoutId !== "string" ||
    !getTripleModeConfigSafe(session.mode) ||
    !Number.isInteger(session.remainingTime) ||
    session.remainingTime < 0
  )
    return false;
  if (session.mode === "challenge") {
    try {
      getTripleChallengeStage(session.level);
    } catch {
      return false;
    }
  }
  try {
    const roundState = restoreSerializedTripleRoundState(session.snapshot, { trayCapacity: getEffectiveTripleTrayCapacity() });
    if (roundState.status !== "playing") return false;
    return isCompatibleTripleSession(
      roundState,
      getTripleLayout(session.layoutId),
    );
  } catch {
    return false;
  }
}

async function mountTripleDevelopmentRound(generated, { skipIntro = false, startup, metrics = null } = {}) {
  document.getElementById("menu-container")?.remove();
  const shell = getTripleShell();
  const scope = startup ? startup.scope : shell.mount();
  let commandQueue = Promise.resolve();
  let pendingCommands = 0;
  const runRoundCommand = operation => {
    if (!scope.active || isPersistenceBlocked() || pendingCommands >= 8) return Promise.resolve();
    pendingCommands += 1;
    const result = commandQueue.then(() => scope.active ? operation() : undefined);
    commandQueue = result.catch(error => {
      console.error("Triple command failed", error);
      if (scope.active) showAppToast("Thao tác chưa hoàn tất. Hãy tải lại để phục hồi bản lưu.", { tone: "warning" });
    }).finally(() => { pendingCommands -= 1; });
    return commandQueue;
  };
  beginPlayMetrics(scope, { gameId: "triple-connect", mode: currentMode, level: currentLevel }, metrics);
  presentationCount = 0;
  boardPresentationRevision = 0;
  hintedTileIds = new Set();
  shell.refs.root.dataset.triplePresenting = "false";
  terminalSettled = false;
  terminalReason = null;
  roundLuckyRewards = [];
  roundMilestoneRewards = [];
  modalPaused = false;
  backgroundPaused = false;
  const generation = ++roundGeneration;
  const startImmediately = !generated.board || skipIntro;
  roundStarted = startup ? false : startImmediately;
  let startupReady = !startup;
  let introComplete = false;
  let activated = false;
  renderer ||= createTripleRenderer(shell, {
    onLockedTraySlotClick: () => openTripleTrayExpansionPurchase(),
  });
  renderer.mountLayout(scope, currentLayout);
  const hudElements = getTripleHudElements();
  const hud = getTripleHud(hudElements);
  let comboExpiryTimer;
  let comboWindowRevision = 0;
  const render = (roundState, { boardState = roundState, startup: renderStartup } = {}) => {
    const pendingRender = renderer.render(
      boardState,
      currentLayout,
      getEquippedThemeId(gameState.appearance, "triple-connect"),
      renderStartup,
    );
    // Hint borders are presentation state with a deliberate, stable lifetime:
    // they remain until a new hint or a board-transforming tool replaces them.
    renderer.nodes.forEach((node, tileId) => {
      node.classList.toggle("is-hinted", hintedTileIds.has(tileId));
    });
    const starProgress = getTripleStarProgress({
      mode: currentMode,
      score: roundState.score,
      initialTileCount: roundState.initialTileCount,
    });
    hud.stats({
      level: currentLevel,
      moves: roundState.moves,
      misses: roundState.misses,
      combo: roundState.combo,
      score: roundState.score,
      totalStars: gameState.progress.tripleConnect.totalStars,
    });
    ["hint", "time", "undo", "shuffle"].forEach((itemId) => {
      hud.tool(itemId, { count: getTripleItemCount(itemId) });
    });
    hud.stars({
      earned: starProgress.stars,
      score: starProgress.score,
      target: starProgress.thresholds.three,
      totalScore: roundState.score,
    });
    const milestones = gameState.progress.tripleConnect.milestones;
    hud.coins(gameState.coins);
    hud.milestones({
      progress: milestones.progress,
      target: TRIPLE_PRODUCT_DECISIONS.milestones.target,
      descriptions: TRIPLE_PRODUCT_DECISIONS.milestones.rewards.map((reward) =>
        Object.entries(reward).filter(([key]) => key !== "endlessCoins").map(([key, value]) => `+${value} ${key === "coins" ? "Xu" : key === "time" ? "giây" : key === "hint" ? "Gợi ý" : key === "undo" ? "Hoàn tác" : "Xáo trộn"}`).join(" · ")),
    });
    updateTimer(shell, remainingTime, hudElements, hud);
    return pendingRender;
  };
  const stopComboWindow = () => {
    comboWindowRevision += 1;
    if (comboExpiryTimer !== undefined) clearShellTimeout(comboExpiryTimer);
    comboExpiryTimer = undefined;
    clearComboWindowPresentation(hudElements.comboCard);
  };
  const startComboWindow = () => {
    stopComboWindow();
    const revision = comboWindowRevision;
    const expectedRoundId = state.roundId;
    const durationMs = getComboWindowMs(Math.floor(state.initialTileCount / 3));
    playComboWindow(hudElements.comboCard, durationMs);
    comboExpiryTimer = scope.timeout(async () => {
      if (revision !== comboWindowRevision || !scope.active
        || state.roundId !== expectedRoundId || state.status !== "playing") return;
      comboExpiryTimer = undefined;
      const transition = reduceTrustedTripleCommand(state, { type: "expire-combo" });
      if (!transition.result.ok) {
        stopComboWindow();
        return;
      }
      state = transition.nextState;
      stopComboWindow();
      render(state);
      (await saveSession());
    }, durationMs);
  };
  scope.own(stopComboWindow, "cleanup");
  scope.listen(document, "triple-tray-expansion-purchased", () => {
    if (!state) return;
    const trayCapacity = getEffectiveTripleTrayCapacity();
    if (state.trayCapacity === trayCapacity) return;
    boardPresentationRevision += 1;
    state = restoreTripleStateSnapshot({
      ...createTripleStateSnapshot(state),
      trayCapacity,
    }, state.undoHistory);
    render(state);
  });
  if (!startup) render(state);
  const toolsToggle = shell.refs.root.querySelector("#triple-tools-toggle");
  const toolsMenu = shell.refs.root.querySelector("#triple-tools-menu");
  const actionsToggle = shell.refs.root.querySelector(
    "#triple-actions-menu-toggle",
  );
  const menus = bindGameHudMenus(scope, [{ trigger: toolsToggle, panel: toolsMenu }]);
  scope.listen(actionsToggle, 'click', () => { menus.close(); void runTripleGameAction('exit-dialog'); });
  scope.listen(document, "visibilitychange", async () => {
    if (document.hidden) {
      if (state.status !== "playing" || !roundStarted) return;
      backgroundPaused = true;
      rebaseTripleTimer();
      (await saveSession());
    } else if (backgroundPaused) {
      backgroundPaused = false;
      rebaseTripleTimer();
    }
  });
  scope.listen(shell.refs.board, "click", async (event) => {
return runRoundCommand(async () => {
    const tileId = event.target.closest("[data-tile-id]")?.dataset.tileId;
    if (!tileId || roundStarted !== true) return;
    const transition = reduceTrustedTripleCommand(state, {
      type: "select-tile",
      tileId,
    });
    if (!transition.result.ok) return;
    const previous = state;
    state = transition.nextState;
    const presentationRevision = ++boardPresentationRevision;
    const matchEvent = transition.events.find((event) => event.type === "triple-resolved");
    const luckyEvent = transition.events.find((event) => event.type === "lucky-resolved");
    const rewards = (await commitTripleResolutionRewards({ luckyEvent, matchEvent }));
    if (!scope.active || generation !== roundGeneration) return;
    if (!rewards) {
      state = previous;
      render(state);
      return;
    }
    roundLuckyRewards.push(...rewards.lucky);
    roundMilestoneRewards.push(...rewards.milestones);
    const roundWon = transition.events.some((event) => event.type === "round-won");
    if (roundWon) finishPlayMetrics();
    if (state.status !== "playing") stopComboWindow();
    else if (matchEvent) startComboWindow();
    else if (transition.events.some((event) => event.type === "miss")) stopComboWindow();
    const hasPresentation = transition.events.some((event) => event.type === "tile-selected");
    if (hasPresentation) {
      presentationCount += 1;
      shell.refs.root.dataset.triplePresenting = "true";
    }
    presentTripleTransition({
      shell,
      scope,
      previous,
      next: state,
      events: transition.events,
      effects: {
        path: getLinkPathEffect(gameState.appearance.triplePathEffect),
        exit: getLinkExitEffect(gameState.appearance.tripleExitEffect),
        rewards: [...rewards.lucky, ...rewards.milestones],
        milestones: rewards.milestoneEvents,
      },
      render,
      isCurrent: () => presentationRevision === boardPresentationRevision,
    }).finally(async () => {
      if (!scope.active) return;
      if (hasPresentation) presentationCount = Math.max(0, presentationCount - 1);
      shell.refs.root.dataset.triplePresenting = String(presentationCount > 0);
      (await saveSession());
      if (!scope.active || generation !== roundGeneration) return;
      if (roundWon) {
        duckBackgroundMusicForVictory(gameState.settings);
        playTripleSound("victory");
      }
      (await settleTerminalRound(shell, render));
    });
    playTripleEvents(transition.events);

});
});
  scope.listen(
    shell.refs.root.querySelector('[data-triple-item="hint"]'),
    "click",
    async () => {
return runRoundCommand(async () => {
      if (state.status !== "playing") return;
      const tileIds = getTripleHintTileIds(state);
      if (!tileIds.length || !(await consumeTripleItem("hint"))) return;
      if (!scope.active || generation !== roundGeneration) return;
      hintedTileIds = new Set(tileIds);
      render(state);

});
},
  );
  const timeButton = shell.refs.root.querySelector('[data-triple-item="time"]');
  timeButton.hidden = currentMode === "endless";
  scope.listen(timeButton, "click", async () => {
return runRoundCommand(async () => {
    if (
      state.status !== "playing" ||
      currentMode === "endless" ||
      getTripleItemCount("time") < 1
    )
      return;
    const nextRemainingTime = remainingTime + 1;
    if (
      !(await consumeTripleItemWithSession(
        "time",
        createSession(state, nextRemainingTime),
      ))
    )
      return;
    if (!scope.active || generation !== roundGeneration) return;
    remainingTime = nextRemainingTime;
    rebaseTripleTimer();
    render(state);

});
});
  scope.listen(
    shell.refs.root.querySelector('[data-triple-item="undo"]'),
    "click",
    async () => {
return runRoundCommand(async () => {
      if (state.status !== "playing") return;
      const transition = reduceTrustedTripleCommand(state, { type: "undo" });
      if (!transition.result.ok || !(await consumeTripleItem("undo"))) return;
      if (!scope.active || generation !== roundGeneration) return;
      state = transition.nextState;
      boardPresentationRevision += 1;
      hintedTileIds.clear();
      if (state.status !== "playing" || state.combo === 0) stopComboWindow();
      else if (comboExpiryTimer === undefined) startComboWindow();
      render(state);
      (await saveSession());

});
},
  );
  scope.listen(
    shell.refs.root.querySelector('[data-triple-item="shuffle"]'),
    "click",
    async () => {
return runRoundCommand(async () => {
      if (
        state.status !== "playing" ||
        getTripleItemCount("shuffle") < 1
      )
        return;
      const result = shuffleTripleBoardState(
        state,
        currentLayout,
        `${currentMode}:${currentLevel}:${state.moves}`,
        getShuffleBudget(currentMode),
      );
      if (!result || result.witness.length === 0) return;
      if (
        !(await consumeTripleItemWithSession(
          "shuffle",
          createSession(result.state, remainingTime),
        ))
      )
        return;
      if (!scope.active || generation !== roundGeneration) return;
      state = result.state;
      boardPresentationRevision += 1;
      hintedTileIds.clear();
      render(state);

});
},
  );
  const beginRound = async () => {
    if (roundStarted || !startupReady || (!startImmediately && !introComplete)) return;
    roundStarted = "starting";
    (await saveSession());
    if (!scope.active || generation !== roundGeneration) return;
    roundStarted = true;
    resumePlayMetrics("startup");
  void rememberRecentGame("triple-connect");
    startTripleTimer(scope, shell, render, hudElements, hud);
    if (state.combo > 0) startComboWindow();
  };
  const activate = async () => {
    if (activated) return;
    activated = true;
    if (startImmediately) (await beginRound());
    else showTripleStartModal({
      shell,
      scope,
      generation,
      render,
      hudElements,
      hud,
      onComplete: async () => {
        introComplete = true;
        (await beginRound());
      },
    });
  };
  const markStartupReady = async () => {
    startupReady = true;
    (await beginRound());
  };
  if (!startup) (await activate());
  return { generated, getState: () => state, whenIdle: () => commandQueue, shell, renderInitial: () => render(state, { startup }), activate, markStartupReady };
}

function showTripleStartModal({ shell, scope, generation, render, hudElements, hud, onComplete }) {
  const theme = getTheme(getEquippedThemeId(gameState.appearance, "triple-connect"));
  const totalTiles = Object.keys(state.tiles).length;
  showLevelRewardOverlay({
    level: currentLevel,
    mode: currentMode,
    themeId: theme.id,
    totalPairs: Math.floor(totalTiles / 3),
    remainingTime,
    targetText: `Mục tiêu: ${Math.floor(totalTiles / 3)} bộ thẻ`,
    assistText: `Gợi ý: ${getTripleItemCount("hint")}`,
    overlayId: "triple-round-start-modal",
    scope,
    onComplete: () => {
      if (generation !== roundGeneration || !scope.active) return;
      modalPaused = false;
      onComplete();
    },
  });
}

function startTripleTimer(scope, shell, render, hudElements, hud) {
  restoreBackgroundMusic(gameState.settings);
  let running = true;
  let checkpointSeconds = 0;
  let businessAccumulatorMs = 0;
  const progressScheduler = createHudTimerScheduler();
  const canDraw = () => running && scope.active && roundStarted
    && state.status === "playing" && !modalPaused && !backgroundPaused && !isPersistenceBlocked();
  const advanceBusinessSecond = () => {
    remainingTime += currentMode === "endless" ? 1 : -1;
    remainingTime = Math.max(0, remainingTime);
    checkpointSeconds += 1;
    if (currentMode !== "endless" && remainingTime === 0) {
      terminalReason = "time";
      state = endTripleRound(state);
      render(state);
      void saveSession();
      playTripleSound("defeat");
      void settleTerminalRound(shell, render);
    } else if (checkpointSeconds >= 10) {
      checkpointSeconds = 0;
      void saveSession();
    }
  };
  rebaseTripleTimer = () => {
    if (!canDraw()) {
      progressScheduler.pause();
      updateTimer(shell, remainingTime, hudElements, hud);
      return;
    }
    if (progressScheduler.active) progressScheduler.rebase();
    else progressScheduler.start(draw);
  };
  scope.own(() => {
    if (rebaseTripleTimer) rebaseTripleTimer = () => {};
  }, "cleanup");
  const draw = (elapsedMs = 0) => {
    if (!canDraw()) {
      updateTimer(shell, remainingTime, hudElements, hud);
      return false;
    }
    const elapsed = Math.max(0, elapsedMs);
    businessAccumulatorMs += elapsed;
    while (businessAccumulatorMs >= 1000 && state.status === "playing") {
      businessAccumulatorMs -= 1000;
      advanceBusinessSecond();
    }
    if (state.status !== "playing") return false;
    const visualTime = currentMode === "endless"
      ? remainingTime + businessAccumulatorMs / 1000
      : Math.max(0, remainingTime - businessAccumulatorMs / 1000);
    updateTimer(shell, visualTime, hudElements, hud);
    return true;
  };
  scope.own(() => { running = false; progressScheduler.stop(); }, "cleanup");
  progressScheduler.start(draw);
}

function playTripleEvents(events) {
  // Win audio waits for the final tile presentation, matching Memory and Link.
  if (events.some((event) => event.type === "round-won")) return;
  const name = events.some((event) => event.type === "round-lost") ? "defeat"
      : events.some((event) => event.type === "lucky-resolved") ? "bonus"
        : events.some((event) => event.type === "triple-resolved") ? "match"
          : events.some((event) => event.type === "miss") ? "wrong" : "click";
  playTripleSound(name);
}

function playTripleSound(name) {
  const sound = gameState.settings?.sound && sounds[name];
  if (!sound) return;
  sound.currentTime = 0;
  sound.play().catch(() => {});
}

export function runTripleGameAction(action) {
  if (action === 'exit-dialog') return openTripleModal(onClose => openGameExitDialog({ owner: getTripleShell().scope, trigger: getTripleShell().refs.root.querySelector('#triple-actions-menu-toggle'), onClose, onExit: returnTripleToMenu, onRestart: () => startTripleConnectRound({ mode: currentMode, level: currentLevel, reason: 'restart' }) }));
  if (action === 'menu') return returnTripleToMenu();
  if (action === 'restart') return startTripleConnectRound({ mode: currentMode, level: currentLevel, reason: 'restart' });
  const key = { collection: 'showCollection', shop: 'showShop', settings: 'showSettings', help: 'showHelp', reset: 'showReset' }[action];
  if (!key || typeof navigation[key] !== 'function') throw new RangeError('Unsupported Triple navigation action.');
  return openTripleModal(navigation[key]);
}

export function openTripleModal(open) {
  const scope = getTripleShell().scope;
  modalPaused = true;
  rebaseTripleTimer();
  return open(() => {
    if (!scope?.active) return;
    modalPaused = false;
    rebaseTripleTimer();
  });
}

async function saveSession() {
  if (state.status !== "playing") return false;
  return (await saveActiveSession(
    "triple-connect",
    createSession(state, remainingTime),
  ));
}

function createSession(roundState, sessionRemainingTime) {
  stageRankedAttempt("triple-connect", currentMode, roundState.score, roundState.status === "won");
  return {
    mode: currentMode,
    level: currentLevel,
    seed: currentSeed,
    layoutId: currentLayout.id,
    remainingTime: sessionRemainingTime,
    snapshot: serializeTripleRoundState(roundState),
    metrics: snapshotPlayMetrics({ gameId: "triple-connect", mode: currentMode, level: currentLevel }),
    run: getRankedRun("triple-connect", currentMode),
  };
}

function isCompatibleTripleSession(roundState, layout) {
  const slotsById = new Map(layout.slots.map((slot) => [slot.id, slot]));
  const tileIdsBySlot = new Map();
  Object.values(roundState.tiles).forEach((tile) => {
    const ids = tileIdsBySlot.get(tile.slotId) || [];
    ids.push(tile.id);
    tileIdsBySlot.set(tile.slotId, ids);
  });
  for (const tile of Object.values(roundState.tiles)) {
    const slot = slotsById.get(tile.slotId);
    if (!slot && !String(tile.slotId).startsWith("corner-stack-")) return false;
    if (slot && slot.layer !== tile.layer) return false;
  }
  const expectedBySlot = createTripleCoverGraph(layout);
  return Object.values(roundState.tiles).every((tile) => {
    const expected = (expectedBySlot[tile.slotId] || [])
      .flatMap((slotId) => tileIdsBySlot.get(slotId) || [])
      .sort();
    const actual = [...roundState.coverGraph[tile.id]].sort();
    return (
      expected.length === actual.length &&
      expected.every((id, index) => id === actual[index])
    );
  });
}

async function settleTerminalRound(shell, render) {
  if (terminalSettled || state.status === "playing" || !shell.scope?.active)
    return;
  terminalSettled = true;
  const generation = roundGeneration;
  const scope = shell.scope;
  presentationCount = 0;
  const settlement = (await commitTripleTerminalResult());
  if (!scope.active || generation !== roundGeneration) return;
  // A failed durable write is handled by the app-owned recovery modal. Do not cover its reload action.
  if (!settlement) return;
  // The terminal score includes the time bonus. Re-render from the committed
  // snapshot instead of updating a subset of HUD fields independently, so the
  // HUD, persisted best result, and summary always share one source of truth.
  render(state);
  const won = state.status === "won";
  const canAdvance = won && !(currentMode === "challenge" && isTripleChallengeComplete(currentLevel));
  const summary = createTripleSummary({
    settlement,
    luckyRewards: roundLuckyRewards.length ? roundLuckyRewards : getClaimedLuckyRewards(),
    milestoneRewards: roundMilestoneRewards,
  });
  const actions = [
    {
      label: "Menu",
      icon: "home",
      variant: "secondary",
      onClick: (close) => {
        close();
        returnTripleToMenu();
      },
    },
    {
      label: "Chơi lại",
      icon: "restart",
      variant: "secondary",
      onClick: (close) => {
        close();
        void startTripleConnectRound({ mode: currentMode, level: currentLevel, reason: "restart" });
      },
    },
    ...(canAdvance
      ? [{
        label: currentMode === "endless" ? "Tiếp tục" : "Màn tiếp theo",
        icon: "arrow-right",
        variant: "primary",
        onClick: (close) => {
          close();
          startNextTripleLevel(settlement.completedChapter ? gameState.progress.tripleConnect.adventure.firstLevel : currentLevel + 1);
        },
      }]
      : []),
  ];
  const openSummary = () => {
    if (!won) {
      return openTimeUpModal({
        title: "Bạn đã thua",
        icon: "warning",
        actions,
      });
    }
    return openAppModal({
    id: "triple-round-summary-modal",
    icon: won ? "trophy" : "warning",
    title: summary.title,
    content: summary.content,
    dismissible: false,
    closeOnBackdrop: false,
    actions,
  });
  };
  if (won) {
    showLevelSummaryOverlay({
      completedChapter: settlement.completedChapter,
      isVictoryCelebration: Boolean(settlement.completedChapter),
      onCelebrate: () => showFullVictoryCelebration({
        level: currentLevel, completedChapter: settlement.completedChapter, settings: gameState.settings,
        onMenu: returnTripleToMenu,
        onNext: () => startNextTripleLevel(gameState.progress.tripleConnect.adventure.firstLevel),
      }),
      fireworksContainerId: "triple-connect-container",
      level: currentLevel,
      remainingTime,
      moves: state.moves,
      misses: state.misses,
      coinsEarned: settlement.reward,
      score: state.score,
      stars: settlement.stars,
      timeBonus: settlement.timeBonus,
      luckyAwards: roundLuckyRewards,
      settings: { ...gameState.settings, mode: currentMode },
      onMenu: returnTripleToMenu,
      onNext: canAdvance
        ? () => startNextTripleLevel(settlement.completedChapter ? gameState.progress.tripleConnect.adventure.firstLevel : currentLevel + 1)
        : () => void startTripleConnectRound({ mode: currentMode, level: currentLevel }),
      nextLabel: canAdvance
        ? currentMode === "endless" ? "Tiếp tục" : "Màn tiếp theo"
        : "Chơi lại",
    });
    return;
  }
  const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  if (settlement.reward > 0 && !reduced) {
    const generation = roundGeneration;
    playCoinRewardFlight(
      shell.refs.board,
      shell.refs.root.querySelector(".stat-points"),
      settlement.reward,
    );
    shell.scope.timeout(() => {
      if (generation === roundGeneration && shell.scope.active) openSummary();
    }, 1700);
  } else {
    openSummary();
  }
}

async function commitTripleTerminalResult() {
  const generation = roundGeneration;
  const previousChapter = gameState.progress.tripleConnect.adventure?.currentChapter || 1;
  const rollback = {
    coins: gameState.coins,
    progress: structuredClone(gameState.progress.tripleConnect),
  };
  const won = state.status === "won";
  const completion = getTripleCompletionScore({
    mode: currentMode,
    score: state.score,
    remainingTime,
  });
  const stars = won
    ? getTripleStarProgress({
      mode: currentMode,
      score: completion.score,
      initialTileCount: state.initialTileCount,
    }).stars
    : 0;
  const reward = won ? calculateTripleCoinReward({ mode: currentMode, matchedTriples: state.matchedTriples, stars, maxCombo: state.maxCombo }) : 0;
  const settledState = won && completion.timeBonus > 0
    ? restoreTripleStateSnapshot({
      ...createTripleStateSnapshot(state),
      score: completion.score,
    }, state.undoHistory)
    : state;
  if (won) {
    gameState.coins += reward;
    recordTripleConnectResult({ mode: currentMode, level: currentLevel, score: completion.score, stars, durationMs: finishPlayMetrics() });
    stageRankedAttempt("triple-connect", currentMode, completion.score, true);
    if (currentMode === "challenge" && isTripleChallengeComplete(currentLevel)) finalizeRankedRun("triple-connect", currentMode, completion.score, "won");
  }
  delete gameState.progress.tripleConnect.sessionsByMode[currentMode];
  if ((await savePersistentGameData({ coins: gameState.coins, progress: gameState.progress, cloudEvent: won }))) {
    if (generation !== roundGeneration) return false;
    state = settledState;
    return { reward, stars, timeBonus: completion.timeBonus,
      completedChapter: gameState.progress.tripleConnect.adventure?.currentChapter > previousChapter ? previousChapter : null };
  }
  gameState.coins = rollback.coins;
  gameState.progress.tripleConnect = rollback.progress;
  return false;
}

function createTripleSummary({ settlement, luckyRewards, milestoneRewards }) {
  const title = `Hoàn thành Màn ${currentLevel}`;
  const earnedLucky = luckyRewards.length
    ? `<li>Lucky: ${luckyRewards.map(formatTripleReward).join(", ")}</li>`
    : "";
  const terminalReward = settlement.reward > 0
    ? `<li>Thưởng hoàn thành: ${settlement.reward} Xu</li>`
    : "";
  const earnedMilestones = milestoneRewards.length
    ? `<li>Mốc Triple: ${milestoneRewards.map(formatTripleReward).join(", ")}</li>`
    : "";
  const outcome = "Bạn đã dọn sạch bàn chơi.";
  return {
    title,
    content: `<div class="triple-round-summary"><p>${outcome}</p><p><strong>${getGameModeLabel(currentMode)} · Màn ${currentLevel}</strong></p><dl><div><dt>Sao</dt><dd>${settlement.stars}/3</dd></div><div><dt>Điểm</dt><dd>${state.score}</dd></div><div><dt>Combo cao nhất</dt><dd>x${state.maxCombo}</dd></div></dl><ul>${terminalReward}${earnedLucky}${earnedMilestones}</ul></div>`,
  };
}

function getClaimedLuckyRewards() {
  const claimed = new Set(state.claimedLuckyIds);
  return Object.values(state.tiles)
    .flatMap((tile) => (tile.lucky && claimed.has(tile.lucky.id) ? [tile.lucky.reward] : []));
}

function formatTripleReward(reward) {
  if (reward.type === "coins") return `${reward.amount} Xu`;
  if (reward.type === "time") return `+${reward.amount} giây`;
  if (reward.type === "hint") return `+${reward.amount} Gợi ý`;
  if (reward.type === "undo") return `+${reward.amount} Hoàn tác`;
  return `+${reward.amount} Xáo trộn`;
}

function startNextTripleLevel(targetLevel = currentLevel + 1) {
  if (currentMode === "challenge" && isTripleChallengeComplete(currentLevel)) return;
  const nextLevel = targetLevel;
  if (!canAdvanceAdventure("triple-connect", currentMode, nextLevel)) return returnTripleToMenu();
  const elapsedTime = currentMode === "endless" ? remainingTime : undefined;
  void startTripleConnectRound({ mode: currentMode, level: nextLevel, elapsedTime, reason: "advance" });
}

function returnTripleToMenu() {
  if (state.status === "lost") {
    finalizeRankedRun("triple-connect", currentMode, state.score);
    void savePersistentGameData({ progress: gameState.progress });
  } else if (state.status === "playing") void saveSession();
  cancelPendingTripleGeneration();
  unmountActiveGameShell();
  navigation.showMenu();
}

function updateTimer(shell, visualRemainingTime = remainingTime, elements = getTripleHudElements(), hud = getTripleHud(elements)) {
  hud.stats({ timer: remainingTime });
  const timeLimit = getTripleLevelTime(currentMode, currentLevel);
  renderHudTimer(elements.gameHud, {
    progress:
      currentMode === "endless" ? 1 : visualRemainingTime / Math.max(1, timeLimit),
    endless: currentMode === "endless",
  });
  shell.refs.root.dataset.tripleExpired = String(
    state.status === "lost" && remainingTime === 0,
  );
}

function normalizeLevel(level) {
  return Math.max(1, Math.floor(Number(level) || 1));
}

function getTripleLevelTime(mode, level) {
  return mode === "challenge"
    ? getTripleChallengeStage(level).timeSeconds
    : getTripleModeConfig(mode).timeSeconds;
}

async function commitTripleResolutionRewards({ luckyEvent, matchEvent }) {
  const generation = roundGeneration;
  const pendingLucky = (luckyEvent?.rewards || []).filter((lucky) => !state.claimedLuckyIds.includes(lucky.id));
  const freshTileIds = (matchEvent?.tileIds || []).filter((id) => !state.milestoneTileIds.includes(id));
  if (!pendingLucky.length && !freshTileIds.length) return { lucky: [], milestones: [], milestoneEvents: [] };
  const resolved = freshTileIds.length
    ? resolveTripleMilestoneProgress({ milestones: gameState.progress.tripleConnect.milestones, tileIds: freshTileIds, mode: currentMode })
    : { next: gameState.progress.tripleConnect.milestones, claimedTileIds: [], rewards: [] };
  let nextState = state;
  if (pendingLucky.length) nextState = claimTripleLuckyRewards(nextState, pendingLucky.map((lucky) => lucky.id));
  if (resolved.claimedTileIds.length) nextState = claimTripleMilestoneTiles(nextState, resolved.claimedTileIds);
  const requested = [
    ...pendingLucky.map((lucky) => ({ ...lucky.reward, source: "lucky", overflowCoins: 10 })),
    ...resolved.rewards.flatMap((milestone) => Object.entries(milestone.reward)
      .map(([type, amount]) => ({ type, amount, source: "milestone" }))),
  ];
  const time = requested.filter((reward) => reward.type === "time").reduce((total, reward) => total + reward.amount, 0);
  const committed = (await commitTripleRewardTransaction({
    session: createSession(nextState, remainingTime + time),
    milestones: resolved.next,
    rewards: requested,
  }));
  if (!committed) return null;
  if (generation !== roundGeneration) return null;
  state = nextState;
  remainingTime += time;
  return {
    lucky: committed.filter((reward) => reward.source === "lucky"),
    milestones: committed.filter((reward) => reward.source === "milestone"),
    milestoneEvents: resolved.rewards,
  };
}

function createRoundSeed(mode, level) {
  const entropy = globalThis.crypto?.randomUUID?.()
    || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  roundSeedNonce += 1;
  return `triple-${mode}-level-${level}-${roundSeedNonce}-${entropy}`;
}

function getEffectiveTripleTrayCapacity() {
  return getTripleTrayCapacity(gameState.progress.tripleConnect.trayExpansionSlots);
}

function createSeededRandom(seed) {
  let value = 2166136261;
  for (const character of String(seed)) value = Math.imul(value ^ character.codePointAt(0), 16777619) >>> 0;
  return () => {
    value ^= value << 13;
    value ^= value >>> 17;
    value ^= value << 5;
    return (value >>> 0) / 4294967296;
  };
}

function getTripleModeConfigSafe(mode) {
  try {
    return getTripleModeConfig(mode);
  } catch {
    return null;
  }
}

function getShuffleBudget(mode) {
  return mode === "superHard" || mode === "endless"
    ? { maxNodes: 100000, maxMemo: 40000, deadlineMs: 300 }
    : mode === "hard"
      ? { maxNodes: 50000, maxMemo: 20000, deadlineMs: 100 }
      : { maxNodes: 5000, maxMemo: 2000, deadlineMs: 20 };
}
