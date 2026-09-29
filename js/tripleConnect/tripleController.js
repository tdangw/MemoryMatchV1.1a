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
  getTripleStarProgress,
  TRIPLE_PRODUCT_DECISIONS,
  isTripleChallengeComplete,
} from "./tripleConfig.js";
import { shuffleTripleBoardState } from "./tripleShuffle.js";
import { getEquippedThemeId } from "../appearance.js";
import { gameState, recordTripleConnectResult } from "../gameState.js";
import { openAppModal, showAppToast } from "../modal.js";
import { unmountActiveGameShell } from "../gameShell/gameShell.js";
import { commitTripleRewardTransaction, consumeTripleItemWithSession } from "./tripleTransactions.js";
import { renderHudTimer } from "../gameShell/gameShellHud.js";
import { savePersistentGameData } from "../persistence.js";
import { stageActiveSession } from "../sessionProgress.js";
import { calculateTripleCoinReward } from "./tripleConfig.js";
import { getLinkExitEffect, getLinkPathEffect } from "../linkConnect/linkEffects.js";
import { sounds } from "../sound.js";
import { getGameModeLabel } from "../gameCatalog.js";
import { getTheme, getThemeSelectionEligibility, selectThemeCards } from "../themeCatalog.js";
import { playCoinRewardFlight } from "../coinRewards.js";
import { resolveTripleMilestoneProgress } from "./tripleMilestones.js";
import { openTimeUpModal, showLevelRewardOverlay, showLevelSummaryOverlay } from "../ui.js";
import { openTripleTrayExpansionPurchase } from "../shop.js";
import { createHudTimerScheduler } from "../gameShell/gameTimerProgress.js";

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

export function startTripleConnectDevelopmentRound({
  seed = "triple-dev",
  mode = "easy",
} = {}) {
  if (!development)
    throw new Error(
      "Triple Connect development hook is unavailable in production.",
    );
  return startTripleConnectRoundFromGenerated({
    generated: generateTripleBoard({ seed, mode, level: 1 }),
    mode,
    level: 1,
    skipIntro: true,
    explicitSeed: true,
  });
}

export async function startTripleConnectRound({
  seed,
  mode = "easy",
  level = 1,
  elapsedTime,
  skipIntro = false,
} = {}) {
  const normalizedLevel = normalizeLevel(level);
  if (mode === "challenge") getTripleChallengeStage(normalizedLevel);
  const roundSeed = seed || createRoundSeed(mode, normalizedLevel);
  cancelPendingTripleGeneration();
  let request;
  try {
    request = requestTripleGeneration({ mode, seed: roundSeed, level: normalizedLevel });
  } catch {
    return startTripleConnectRoundFromGenerated({
      generated: generateTripleBoard({ mode, seed: roundSeed, level: normalizedLevel }),
      mode,
      level: normalizedLevel,
      elapsedTime,
      skipIntro,
      explicitSeed: seed !== undefined,
    });
  }
  pendingGeneration = request;
  try {
    const generated = await request.promise;
    if (pendingGeneration !== request) return null;
    pendingGeneration = null;
    return startTripleConnectRoundFromGenerated({
      generated,
      mode,
      level: normalizedLevel,
      elapsedTime,
      skipIntro,
      explicitSeed: seed !== undefined,
    });
  } catch (error) {
    if (pendingGeneration !== request) return null;
    pendingGeneration = null;
    if (String(error?.message).includes("cancelled")) return null;
    return startTripleConnectRoundFromGenerated({
      generated: generateTripleBoard({ mode, seed: roundSeed, level: normalizedLevel }),
      mode,
      level: normalizedLevel,
      elapsedTime,
      skipIntro,
      explicitSeed: seed !== undefined,
    });
  }
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

function startTripleConnectRoundFromGenerated({ generated, mode, level, elapsedTime, skipIntro, explicitSeed }) {
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
  const mounted = mountTripleDevelopmentRound(generated, { skipIntro });
  if (selectedAssets.length) {
    commitThemeSession("triple-connect", createSession(state, remainingTime), themeId, selectedAssets);
  }
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
  if (!isValidTripleConnectSession(session)) return null;
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
  return mountTripleDevelopmentRound({
    seed: "restored",
    board: null,
    witness: [],
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

function mountTripleDevelopmentRound(generated, { skipIntro = false } = {}) {
  document.getElementById("menu-container")?.remove();
  const shell = getTripleShell();
  const scope = shell.mount();
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
  roundStarted = !generated.board || skipIntro;
  renderer ||= createTripleRenderer(shell, {
    onLockedTraySlotClick: () => openTripleTrayExpansionPurchase(),
  });
  renderer.mountLayout(scope, currentLayout);
  const hudElements = getTripleHudElements();
  const hud = getTripleHud(hudElements);
  const render = (roundState, { boardState = roundState } = {}) => {
    renderer.render(
      boardState,
      currentLayout,
      getEquippedThemeId(gameState.appearance, "triple-connect"),
    );
    // Hint borders are presentation state with a deliberate, stable lifetime:
    // they remain until a new hint or a board-transforming tool replaces them.
    renderer.nodes.forEach((node, tileId) => {
      node.classList.toggle("is-hinted", hintedTileIds.has(tileId));
    });
    const totalTriples = Math.max(1, Object.keys(roundState.tiles).length / 3);
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
      matchedTriples: roundState.matchedTriples,
      totalTriples,
      hint: getTripleItemCount("hint"),
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
  };
  scope.listen(document, "triple-tray-expansion-purchased", () => {
    if (!state || state.status !== "playing") return;
    const trayCapacity = getEffectiveTripleTrayCapacity();
    if (state.trayCapacity === trayCapacity) return;
    boardPresentationRevision += 1;
    state = restoreTripleStateSnapshot({
      ...createTripleStateSnapshot(state),
      trayCapacity,
    }, state.undoHistory);
    render(state);
  });
  render(state);
  const toolsToggle = shell.refs.root.querySelector("#triple-tools-toggle");
  const toolsMenu = shell.refs.root.querySelector("#triple-tools-menu");
  const actionsToggle = shell.refs.root.querySelector(
    "#triple-actions-menu-toggle",
  );
  const actionsMenu = shell.refs.root.querySelector("#triple-actions-menu");
  const closeMenus = () => {
    toolsMenu.hidden = true;
    actionsMenu.hidden = true;
    toolsToggle.setAttribute("aria-expanded", "false");
    actionsToggle.setAttribute("aria-expanded", "false");
  };
  const navigationActions = {
    collection: "showCollection",
    shop: "showShop",
    settings: "showSettings",
    help: "showHelp",
    reset: "showReset",
  };
  actionsMenu.querySelectorAll("[data-triple-action]").forEach((button) => {
    const navigationKey = navigationActions[button.dataset.tripleAction];
    button.hidden = Boolean(
      navigationKey && typeof navigation[navigationKey] !== "function",
    );
  });
  scope.listen(toolsToggle, "click", (event) => {
    event.stopPropagation();
    toolsMenu.hidden = !toolsMenu.hidden;
    toolsToggle.setAttribute("aria-expanded", String(!toolsMenu.hidden));
    actionsMenu.hidden = true;
    actionsToggle.setAttribute("aria-expanded", "false");
  });
  scope.listen(document, "click", (event) => {
    if (!toolsMenu.hidden && !event.target.closest(".triple-connect__hud")) {
      toolsMenu.hidden = true;
      toolsToggle.setAttribute("aria-expanded", "false");
    }
    if (!actionsMenu.hidden && !event.target.closest(".triple-connect__hud")) {
      actionsMenu.hidden = true;
      actionsToggle.setAttribute("aria-expanded", "false");
    }
  });
  scope.listen(actionsToggle, "click", (event) => {
    event.stopPropagation();
    actionsMenu.hidden = !actionsMenu.hidden;
    actionsToggle.setAttribute("aria-expanded", String(!actionsMenu.hidden));
    toolsMenu.hidden = true;
    toolsToggle.setAttribute("aria-expanded", "false");
  });
  scope.listen(actionsMenu, "click", (event) => {
    const action = event.target.closest("button")?.dataset.tripleAction;
    if (!action) return;
    actionsMenu.hidden = true;
    actionsToggle.setAttribute("aria-expanded", "false");
    if (action === "menu") return returnTripleToMenu();
    if (action === "restart")
      return void startTripleConnectRound({
        mode: currentMode,
        level: currentLevel,
      });
    if (action === "collection" && navigation.showCollection)
      return openTripleModal(navigation.showCollection);
    if (action === "shop" && navigation.showShop)
      return openTripleModal(navigation.showShop);
    if (action === "settings" && navigation.showSettings)
      return openTripleModal(navigation.showSettings);
    if (action === "help" && navigation.showHelp)
      return openTripleModal(navigation.showHelp);
    if (action === "reset" && navigation.showReset)
      return navigation.showReset();
  });
  scope.listen(document, "keydown", (event) => {
    if (event.key === "Escape") closeMenus();
  });
  scope.listen(document, "visibilitychange", () => {
    if (document.hidden) {
      if (state.status !== "playing" || !roundStarted) return;
      backgroundPaused = true;
      rebaseTripleTimer();
      saveSession();
    } else if (backgroundPaused) {
      backgroundPaused = false;
      rebaseTripleTimer();
    }
  });
  scope.own(closeMenus, "triple-hud-menu-cleanup");
  scope.listen(shell.refs.board, "click", (event) => {
    const tileId = event.target.closest("[data-tile-id]")?.dataset.tileId;
    if (!tileId || !roundStarted) return;
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
    const rewards = commitTripleResolutionRewards({ luckyEvent, matchEvent });
    if (!rewards) {
      state = previous;
      render(state);
      return;
    }
    roundLuckyRewards.push(...rewards.lucky);
    roundMilestoneRewards.push(...rewards.milestones);
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
    }).finally(() => {
      if (!scope.active) return;
      if (hasPresentation) presentationCount = Math.max(0, presentationCount - 1);
      shell.refs.root.dataset.triplePresenting = String(presentationCount > 0);
      saveSession();
      settleTerminalRound(shell, render);
    });
    playTripleEvents(transition.events);
  });
  scope.listen(
    shell.refs.root.querySelector('[data-triple-item="hint"]'),
    "click",
    () => {
      if (state.status !== "playing") return;
      const tileIds = getTripleHintTileIds(state);
      if (!tileIds.length || !consumeTripleItem("hint")) return;
      hintedTileIds = new Set(tileIds);
      render(state);
    },
  );
  const timeButton = shell.refs.root.querySelector('[data-triple-item="time"]');
  timeButton.hidden = currentMode === "endless";
  scope.listen(timeButton, "click", () => {
    if (
      state.status !== "playing" ||
      currentMode === "endless" ||
      getTripleItemCount("time") < 1
    )
      return;
    const nextRemainingTime = remainingTime + 1;
    if (
      !consumeTripleItemWithSession(
        "time",
        createSession(state, nextRemainingTime),
      )
    )
      return;
    remainingTime = nextRemainingTime;
    rebaseTripleTimer();
    render(state);
  });
  scope.listen(
    shell.refs.root.querySelector('[data-triple-item="undo"]'),
    "click",
    () => {
      if (state.status !== "playing") return;
      const transition = reduceTrustedTripleCommand(state, { type: "undo" });
      if (!transition.result.ok || !consumeTripleItem("undo")) return;
      state = transition.nextState;
      boardPresentationRevision += 1;
      hintedTileIds.clear();
      render(state);
      saveSession();
    },
  );
  scope.listen(
    shell.refs.root.querySelector('[data-triple-item="shuffle"]'),
    "click",
    () => {
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
        !consumeTripleItemWithSession(
          "shuffle",
          createSession(result.state, remainingTime),
        )
      )
        return;
      state = result.state;
      boardPresentationRevision += 1;
      hintedTileIds.clear();
      render(state);
    },
  );
  if (roundStarted) {
    saveSession();
    startTripleTimer(scope, shell, render, hudElements, hud);
  } else {
    showTripleStartModal({ shell, scope, generation, render, hudElements, hud });
  }
  return { generated, getState: () => state, shell };
}

function showTripleStartModal({ shell, scope, generation, render, hudElements, hud }) {
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
      roundStarted = true;
      saveSession();
      startTripleTimer(scope, shell, render, hudElements, hud);
    },
  });
}

function startTripleTimer(scope, shell, render, hudElements, hud) {
  let running = true;
  let checkpointSeconds = 0;
  let businessAccumulatorMs = 0;
  const progressScheduler = createHudTimerScheduler();
  const canDraw = () => running && scope.active && roundStarted
    && state.status === "playing" && !modalPaused && !backgroundPaused;
  const advanceBusinessSecond = () => {
    remainingTime += currentMode === "endless" ? 1 : -1;
    remainingTime = Math.max(0, remainingTime);
    checkpointSeconds += 1;
    if (currentMode !== "endless" && remainingTime === 0) {
      terminalReason = "time";
      state = endTripleRound(state);
      render(state);
      saveSession();
      playTripleSound("defeat");
      settleTerminalRound(shell, render);
    } else if (checkpointSeconds >= 10) {
      checkpointSeconds = 0;
      saveSession();
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
  const name = events.some((event) => event.type === "round-won") ? "victory"
    : events.some((event) => event.type === "round-lost") ? "defeat"
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

function openTripleModal(open) {
  modalPaused = true;
  rebaseTripleTimer();
  open(() => {
    modalPaused = false;
    rebaseTripleTimer();
  });
}

function saveSession() {
  if (state.status !== "playing") return false;
  return saveActiveSession(
    "triple-connect",
    createSession(state, remainingTime),
  );
}

function createSession(roundState, sessionRemainingTime) {
  return {
    mode: currentMode,
    level: currentLevel,
    seed: currentSeed,
    layoutId: currentLayout.id,
    remainingTime: sessionRemainingTime,
    snapshot: serializeTripleRoundState(roundState),
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

function settleTerminalRound(shell, render) {
  if (terminalSettled || state.status === "playing" || !shell.scope?.active)
    return;
  terminalSettled = true;
  presentationCount = 0;
  const settlement = commitTripleTerminalResult();
  if (!settlement) {
    openAppModal({
      id: "triple-terminal-save-failed-modal",
      icon: "warning",
      title: "Chưa thể lưu kết quả",
      content:
        "<p>Vòng chơi vẫn được khóa để tránh mất đồng bộ. Hãy thử lưu lại trước khi tiếp tục.</p>",
      dismissible: false,
      closeOnBackdrop: false,
      actions: [
        {
          label: "Thử lại",
          icon: "restart",
          variant: "primary",
          onClick: (close) => {
            close();
            terminalSettled = false;
            settleTerminalRound(shell, render);
          },
        },
      ],
    });
    return;
  }
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
        void startTripleConnectRound({ mode: currentMode, level: currentLevel });
      },
    },
    ...(canAdvance
      ? [{
        label: currentMode === "endless" ? "Tiếp tục" : "Màn tiếp theo",
        icon: "arrow-right",
        variant: "primary",
        onClick: (close) => {
          close();
          startNextTripleLevel();
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
        ? startNextTripleLevel
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

function commitTripleTerminalResult() {
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
    recordTripleConnectResult({ mode: currentMode, level: currentLevel, score: completion.score, stars });
  }
  delete gameState.progress.tripleConnect.sessionsByMode[currentMode];
  if (savePersistentGameData({ coins: gameState.coins, progress: gameState.progress })) {
    state = settledState;
    return { reward, stars, timeBonus: completion.timeBonus };
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

function startNextTripleLevel() {
  if (currentMode === "challenge" && isTripleChallengeComplete(currentLevel)) return;
  const nextLevel = currentLevel + 1;
  const elapsedTime = currentMode === "endless" ? remainingTime : undefined;
  void startTripleConnectRound({ mode: currentMode, level: nextLevel, elapsedTime });
}

function returnTripleToMenu() {
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

function commitTripleResolutionRewards({ luckyEvent, matchEvent }) {
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
  const committed = commitTripleRewardTransaction({
    session: createSession(nextState, remainingTime + time),
    milestones: resolved.next,
    rewards: requested,
  });
  if (!committed) return null;
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
  const expansion = TRIPLE_PRODUCT_DECISIONS.trayExpansion;
  return expansion.baseCapacity + (gameState.progress.tripleConnect.trayExpansionOwned ? expansion.bonusCapacity : 0);
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
