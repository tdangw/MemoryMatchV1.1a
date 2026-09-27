import { playCoinRewardFlight } from "../coinRewards.js";
import { playLootDrop } from "../lootEffects.js";
import { clearTripleEffects, presentTripleConnection, presentTripleExit } from "./tripleEffectAdapter.js";
import { showComboEffect, showScoreEffectAt } from "../ui.js";

const MATCH_DURATION_MS = 300;
const TRAY_FLIGHT_DURATION_MS = 300;
const MATCH_TRAY_HOLD_MS = 180;
const TRAY_COMPACTION_DURATION_MS = 210;

export function presentTripleTransition({ shell, scope, previous, next, events, effects = {}, render }) {
  const match = events.find((event) => event.type === "triple-resolved");
  const selected = events.find((event) => event.type === "tile-selected");
  if (!scope.active) { render(next); return Promise.resolve(); }
  if (!match && selected) return presentTrayFlight({ shell, scope, selected, render, next });
  if (!match) { render(next); return Promise.resolve(); }
  return presentResolvedTriple({ shell, scope, previous, next, match, selected, effects, render });
}

function presentResolvedTriple({ shell, scope, previous, next, match, selected, effects, render }) {
  if (prefersReducedMotion()) {
    return presentResolvedTripleExit({ shell, scope, match, effects, render, next });
  }
  const preview = createMatchTrayPreview(previous, next, match);
  return presentTrayFlight({ shell, scope, selected, render, next: preview })
    .then(() => delay(scope, MATCH_TRAY_HOLD_MS))
    .then(() => presentResolvedTripleExit({ shell, scope, match, effects, render, next }));
}

function presentResolvedTripleExit({ shell, scope, match, effects, render, next }) {
  const root = shell.refs.root;
  const surface = shell.refs.board;
  const line = root.querySelector(".triple-connect__line");
  const surfaceRect = surface.getBoundingClientRect();
  const sourceNodes = match.tileIds.map((id) => root.querySelector(`[data-tile-id="${id}"]`)).filter(Boolean);
  if (sourceNodes.length !== 3) { render(next); return Promise.resolve(); }
  if (prefersReducedMotion()) {
    render(next);
    return Promise.resolve();
  }
  const ghosts = sourceNodes.map((source) => createGhost(source, surfaceRect));
  // Capture feedback from the real tiles while their board rectangles still
  // exist. The committed render removes them before the exit ghosts begin.
  showMatchFeedback(sourceNodes, match);
  ghosts.forEach((ghost) => surface.append(ghost));
  sourceNodes.forEach((source) => source.classList.add("is-match-exiting"));
  const startVisualFeedback = scope.guard(() => {
    presentTripleConnection({ surface: line, targets: ghosts, effectId: effects.path?.id });
    presentTripleExit({ surface, targets: ghosts, effectId: effects.exit?.id });
  });
  let lineAnimation = null;
  const cleanup = () => {
    lineAnimation?.cancel();
    lineAnimation = null;
    clearTripleEffects(line);
    ghosts.forEach((ghost) => ghost.remove());
    sourceNodes.forEach((source) => source.classList.remove("is-match-exiting"));
  };
  const release = scope.own(cleanup, "node");
  lineAnimation = line.animate(
    [{ opacity: 0 }, { opacity: 1, offset: 0.25 }, { opacity: 1, offset: 0.62 }, { opacity: 0 }],
    { duration: MATCH_DURATION_MS, easing: "ease-out", fill: "both" },
  );
  scope.animation(lineAnimation);
  // The committed board/tray patch is the input response. Build the optional
  // line/exit/score visuals after the click task so they cannot delay it.
  queueMicrotask(startVisualFeedback);
  return Promise.all([lineAnimation.finished.catch(() => {})])
    .then(() => {
      const priorTrayRects = captureTrayRects(root);
      render(next);
      return animateTrayCompaction({ root, scope, priorTrayRects });
    })
    .then(() => presentMilestoneSequence({ shell, scope, source: ghosts[1] || ghosts[0], milestones: effects.milestones }))
    .then(() => {
      presentCommittedRewards(shell, ghosts[1] || ghosts[0], effects.rewards);
      cleanup();
      release.forget();
    });
}

function createMatchTrayPreview(previous, next, match) {
  const matchIds = new Set(match.tileIds);
  const tiles = Object.fromEntries(Object.entries(next.tiles).map(([id, tile]) => [
    id,
    matchIds.has(id) ? { ...tile, location: "tray" } : tile,
  ]));
  const tray = [];
  let insertedMatch = false;
  for (const tileId of previous.tray) {
    if (!matchIds.has(tileId)) {
      tray.push(tileId);
      continue;
    }
    if (!insertedMatch) {
      tray.push(...match.tileIds);
      insertedMatch = true;
    }
  }
  if (!insertedMatch) tray.push(...match.tileIds);
  return {
    ...next,
    presentationPreview: true,
    status: "playing",
    tiles,
    tray,
    combo: previous.combo,
    maxCombo: previous.maxCombo,
    score: previous.score,
    matchedTriples: previous.matchedTriples,
  };
}

function delay(scope, duration) {
  return new Promise((resolve) => scope.timeout(resolve, duration));
}

function captureTrayRects(root) {
  return new Map([...root.querySelectorAll(".triple-connect__tray .triple-connect__tile")]
    .map((node) => [node.dataset.tileId, node.getBoundingClientRect()]));
}

function animateTrayCompaction({ root, scope, priorTrayRects }) {
  const animations = [];
  for (const [tileId, before] of priorTrayRects) {
    const tile = root.querySelector(`.triple-connect__tray [data-tile-id="${tileId}"]`);
    const after = tile?.getBoundingClientRect();
    if (!after) continue;
    const shiftX = before.left - after.left;
    const shiftY = before.top - after.top;
    if (!shiftX && !shiftY) continue;
    const animation = tile.animate([
      { transform: `translate(${shiftX}px, ${shiftY}px)` },
      { transform: "translate(0, 0)" },
    ], { duration: TRAY_COMPACTION_DURATION_MS, easing: "cubic-bezier(.2,.8,.2,1)" });
    scope.animation(animation);
    animations.push(animation.finished.catch(() => {}));
  }
  return Promise.all(animations);
}

function presentMilestoneSequence({ shell, scope, source, milestones = [] }) {
  if (!source || !milestones.length || !scope.active) return Promise.resolve();
  const milestone = milestones[0];
  const track = shell.refs.root.querySelector("[data-triple-milestone-track]");
  const marker = shell.refs.root.querySelector(`[data-triple-milestone="${milestone.milestone}"]`);
  if (prefersReducedMotion()) {
    marker?.classList.add("is-milestone-pulse");
    scope.timeout(() => marker?.classList.remove("is-milestone-pulse"), 90);
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      marker?.classList.add("is-milestone-pulse");
      scope.timeout(() => marker?.classList.remove("is-milestone-pulse"), 260);
      resolve();
    };
    const loot = playLootDrop(source, {
      icon: "energy",
      preset: "linkItem",
      tier: "teal",
      holdMs: 0,
      target: track,
      timing: { dropMs: 160, flightMs: 180 },
      onCollected: finish,
    });
    if (!loot) finish();
    scope.timeout(finish, 400);
  });
}

function createGhost(source, surfaceRect) {
  const rect = source.getBoundingClientRect();
  const ghost = source.cloneNode(true);
  ghost.classList.add("triple-connect__ghost");
  Object.assign(ghost.style, {
    left: `${rect.left - surfaceRect.left}px`, top: `${rect.top - surfaceRect.top}px`,
    width: `${rect.width}px`, height: `${rect.height}px`,
  });
  return ghost;
}

function showMatchFeedback(tiles, match) {
  const rects = tiles.map((tile) => tile.getBoundingClientRect());
  const anchor = tiles[1] || tiles[0];
  const center = rects.reduce(
    (total, rect) => ({
      x: total.x + rect.left + rect.width / 2,
      y: total.y + rect.top + rect.height / 2,
    }),
    { x: 0, y: 0 },
  );
  showScoreEffectAt({ x: center.x / rects.length, y: center.y / rects.length }, match.points);
  showComboEffect(anchor, match.combo);
}

function presentCommittedRewards(shell, source, rewards = []) {
  if (!source || !Array.isArray(rewards) || !rewards.length) return;
  const root = shell.refs.root;
  const coins = rewards.filter((reward) => reward.type === "coins")
    .reduce((total, reward) => total + reward.amount, 0);
  const coinTarget = root.querySelector(".triple-connect__milestone-coins")
    || root.querySelector("[data-triple-milestone-coins]")
    || root.querySelector(".stat-points");
  if (coins > 0) playCoinRewardFlight(source, coinTarget, coins);
  for (const reward of rewards.filter((candidate) => candidate.type !== "coins")) {
    const itemId = reward.type === "time" ? "time" : reward.type;
    playLootDrop(source, {
      icon: itemId === "time" ? "timer" : itemId === "hint" ? "search" : itemId === "undo" ? "undo" : "shuffle", preset: "linkItem", tier: "blue", holdMs: 0,
      target: root.querySelector(`[data-triple-item="${itemId}"]`),
    });
  }
}

function presentTrayFlight({ shell, scope, selected, render, next }) {
  const surface = shell.refs.board;
  const surfaceRect = surface.getBoundingClientRect();
  const source = shell.refs.root.querySelector(`[data-tile-id="${selected.tileId}"]`);
  const sourceRect = source?.getBoundingClientRect();
  if (!sourceRect) {
    render(next);
    return Promise.resolve();
  }
  const priorTrayRects = new Map([...shell.refs.root.querySelectorAll(".triple-connect__tray .triple-connect__tile")]
    .map((node) => [node.dataset.tileId, node.getBoundingClientRect()]));
  render(next);
  const target = shell.refs.root.querySelector(`.triple-connect__tray [data-tile-id="${selected.tileId}"]`)
    || shell.refs.root.querySelector(`[data-tile-id="${selected.tileId}"]`);
  if (!target || prefersReducedMotion()) {
    target?.classList.add("is-tray-arrived");
    scope.timeout(() => target?.classList.remove("is-tray-arrived"), 90);
    return Promise.resolve();
  }
  const targetRect = target.getBoundingClientRect();
  for (const [tileId, before] of priorTrayRects) {
    const trayTile = shell.refs.root.querySelector(`.triple-connect__tray [data-tile-id="${tileId}"]`);
    const after = trayTile?.getBoundingClientRect();
    if (!after) continue;
    const shiftX = before.left - after.left;
    const shiftY = before.top - after.top;
    if (!shiftX && !shiftY) continue;
    scope.animation(trayTile.animate([
      { transform: `translate(${shiftX}px, ${shiftY}px)` }, { transform: "translate(0, 0)" },
    ], { duration: 210, easing: "cubic-bezier(.2,.8,.2,1)" }));
  }
  const ghost = source.cloneNode(true);
  ghost.classList.add("triple-connect__ghost", "triple-connect__tray-flight");
  Object.assign(ghost.style, {
    left: `${sourceRect.left - surfaceRect.left}px`,
    top: `${sourceRect.top - surfaceRect.top}px`,
    width: `${sourceRect.width}px`,
    height: `${sourceRect.height}px`,
    transformOrigin: "top left",
  });
  surface.append(ghost);
  target.classList.add("is-tray-flight-target");
  const dx = targetRect.left - sourceRect.left;
  const dy = targetRect.top - sourceRect.top;
  const scaleX = sourceRect.width ? targetRect.width / sourceRect.width : 1;
  const scaleY = sourceRect.height ? targetRect.height / sourceRect.height : 1;
  const lift = Math.min(34, Math.max(12, Math.abs(dy) * 0.16));
  const animation = ghost.animate([
    { transform: "translate(0, 0) scale(1)", opacity: 1 },
    {
      offset: 0.58,
      transform: `translate(${dx * 0.54}px, ${dy * 0.48 - lift}px) scale(${1 + (scaleX - 1) * 0.54}, ${1 + (scaleY - 1) * 0.54})`,
      opacity: 1,
    },
    { transform: `translate(${dx}px, ${dy}px) scale(${scaleX}, ${scaleY})`, opacity: 0.36 },
  ], { duration: TRAY_FLIGHT_DURATION_MS, easing: "cubic-bezier(.18,.82,.22,1)", fill: "both" });
  scope.animation(animation);
  const cleanup = () => {
    ghost.remove();
    target.classList.remove("is-tray-flight-target");
  };
  const release = scope.own(cleanup, "node");
  return animation.finished.catch(() => {}).then(() => {
    target.classList.add("is-tray-arrived");
    scope.timeout(() => target.classList.remove("is-tray-arrived"), 180);
    cleanup();
    release.forget();
  });
}

function prefersReducedMotion() {
  return Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches);
}
