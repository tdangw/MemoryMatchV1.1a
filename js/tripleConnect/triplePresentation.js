import { playCoinRewardFlight } from "../coinRewards.js";
import { playLootDrop } from "../lootEffects.js";
import { clearTripleEffects, presentTripleConnection, presentTripleExit } from "./tripleEffectAdapter.js";
import { showComboEffect, showScoreEffectAt } from "../ui.js";

const MATCH_DURATION_MS = 300;
const TRAY_FLIGHT_DURATION_MS = 300;
const TRAY_COMPACTION_DURATION_MS = 210;
const REDUCED_TRAY_ARRIVAL_MS = 60;
let activeMatchCleanup = null;

export function presentTripleTransition({ shell, scope, previous, next, events, effects = {}, render, isCurrent = () => true }) {
  const match = events.find((event) => event.type === "triple-resolved");
  const selected = events.find((event) => event.type === "tile-selected");
  if (!scope.active) { render(next); return Promise.resolve(); }
  if (!match && selected) return presentTrayFlight({ shell, scope, selected, render, next });
  if (!match) { render(next); return Promise.resolve(); }
  return presentResolvedTriple({ shell, scope, previous, next, match, selected, effects, render, isCurrent });
}

function presentResolvedTriple({ shell, scope, previous, next, match, selected, effects, render, isCurrent }) {
  // The rule state is committed already. Preserve the visual sequence with
  // ghosts: the selected card reaches the tray before the three-card exit,
  // while the live board stays available for the next input.
  return presentResolvedTripleExit({ shell, scope, previous, match, selected, effects, render, next, isCurrent });
}

function presentResolvedTripleExit({ shell, scope, previous, match, selected, effects, render, next, isCurrent }) {
  const root = shell.refs.root;
  const surface = shell.refs.board;
  const line = root.querySelector(".triple-connect__line");
  // A previous match may have been interrupted after its connection SVG was
  // painted but before its promise chain reached cleanup. Reset that surface
  // before taking the next visual snapshot so old paths can never ghost into
  // a later match.
  activeMatchCleanup?.();
  activeMatchCleanup = null;
  clearTripleEffects(line);
  const surfaceRect = surface.getBoundingClientRect();
  const sourceNodes = match.tileIds.map((id) => root.querySelector(`[data-tile-id="${id}"]`)).filter(Boolean);
  if (sourceNodes.length !== 3) { render(next); return Promise.resolve(); }
  if (prefersReducedMotion()) {
    render(next);
    return Promise.resolve();
  }
  const ghosts = sourceNodes.map((source) => createGhost(source, surfaceRect));
  ghosts.forEach((ghost) => surface.append(ghost));
  sourceNodes.forEach((source) => source.classList.add("is-match-exiting"));
  const visualPreview = createMatchTrayPreview(previous, next, match);
  // Keep the resolved group in the tray for the visual sequence, but feed the
  // HUD from the committed state so score and game rules never wait on it.
  render(next, { boardState: visualPreview });
  const priorTrayRects = captureTrayRects(root);
  const selectedGhost = ghosts[sourceNodes.findIndex((node) => node.dataset.tileId === selected?.tileId)];
  const targetSlot = root.querySelectorAll(".triple-connect__tray-slot")[
    getResolvedTrayTargetIndex(previous, selected?.tileId)
  ];
  const trayFlight = presentResolvedTrayFlight({
    scope,
    ghost: selectedGhost,
    targetRect: targetSlot?.getBoundingClientRect(),
  });
  let lineAnimation = null;
  let superseded = false;
  const cleanup = () => {
    superseded = true;
    lineAnimation?.cancel();
    lineAnimation = null;
    line?.getAnimations({ subtree: true }).forEach((animation) => animation.cancel());
    line?.style.removeProperty("opacity");
    if (activeMatchCleanup === cleanup) {
      clearTripleEffects(line);
      activeMatchCleanup = null;
    }
    ghosts.forEach((ghost) => ghost.remove());
    sourceNodes.forEach((source) => source.classList.remove("is-match-exiting"));
  };
  activeMatchCleanup = cleanup;
  const release = scope.own(cleanup, "node");
  return trayFlight
    .then(() => {
      if (superseded) return false;
      showMatchFeedback(ghosts, match);
      presentTripleConnection({ surface: line, targets: ghosts, effectId: effects.path?.id });
      presentTripleExit({ surface, targets: ghosts, effectId: effects.exit?.id });
      lineAnimation = line.animate(
        [{ opacity: 0 }, { opacity: 1, offset: 0.25 }, { opacity: 1, offset: 0.62 }, { opacity: 0 }],
        { duration: MATCH_DURATION_MS, easing: "ease-out", fill: "both" },
      );
      scope.animation(lineAnimation);
      return lineAnimation.finished.catch(() => {}).then(() => true);
    })
    .then(() => {
      if (superseded || !isCurrent()) return false;
      render(next);
      return animateTrayCompaction({ root, scope, priorTrayRects }).then(() => true);
    })
    .then((ready) => (ready && !superseded
      ? presentMilestoneSequence({ shell, scope, source: ghosts[1] || ghosts[0], milestones: effects.milestones })
      : false))
    .then(() => {
      if (superseded) return;
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

function getResolvedTrayTargetIndex(previous, selectedTileId) {
  const selectedType = previous.tiles[selectedTileId]?.type;
  if (!selectedType) return previous.tray.length;
  return previous.tray.reduce(
    (lastIndex, tileId, index) => (previous.tiles[tileId]?.type === selectedType ? index : lastIndex),
    -1,
  ) + 1;
}

function presentResolvedTrayFlight({ scope, ghost, targetRect }) {
  if (!ghost || !targetRect || prefersReducedMotion()) return Promise.resolve();
  const sourceRect = ghost.getBoundingClientRect();
  const dx = targetRect.left - sourceRect.left;
  const dy = targetRect.top - sourceRect.top;
  const scaleX = sourceRect.width ? targetRect.width / sourceRect.width : 1;
  const scaleY = sourceRect.height ? targetRect.height / sourceRect.height : 1;
  const lift = Math.min(34, Math.max(12, Math.abs(dy) * 0.16));
  const finalTransform = `translate(${dx}px, ${dy}px) scale(${scaleX}, ${scaleY})`;
  ghost.classList.add("triple-connect__tray-flight");
  ghost.style.transformOrigin = "top left";
  const animation = ghost.animate([
    { transform: "translate(0, 0) scale(1)", opacity: 1 },
    {
      offset: 0.58,
      transform: `translate(${dx * 0.54}px, ${dy * 0.48 - lift}px) scale(${1 + (scaleX - 1) * 0.54}, ${1 + (scaleY - 1) * 0.54})`,
      opacity: 1,
    },
    { transform: finalTransform, opacity: 1 },
  ], { duration: TRAY_FLIGHT_DURATION_MS, easing: "cubic-bezier(.18,.82,.22,1)", fill: "both" });
  scope.animation(animation);
  return animation.finished.catch(() => {}).then(() => {
    // A finished Web Animation with fill: both continues to composite its
    // transform. Commit the landing geometry, then cancel the flight before
    // the removal effect starts. This gives every ghost one transform owner
    // and prevents the flown card from being blurred or jumping backward.
    ghost.style.left = `${Number.parseFloat(ghost.style.left) + dx}px`;
    ghost.style.top = `${Number.parseFloat(ghost.style.top) + dy}px`;
    ghost.style.width = `${targetRect.width}px`;
    ghost.style.height = `${targetRect.height}px`;
    ghost.style.removeProperty("transform");
    animation.cancel();
    ghost.classList.remove("triple-connect__tray-flight");
  });
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
  showScoreEffectAt({
    x: center.x / rects.length,
    // Place the label just above the top tray card, rather than high above
    // the average of the old board and tray positions.
    y: Math.min(...rects.map((rect) => rect.top)) - 8,
  }, match.points);
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
    scope.timeout(() => target?.classList.remove("is-tray-arrived"), REDUCED_TRAY_ARRIVAL_MS);
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
