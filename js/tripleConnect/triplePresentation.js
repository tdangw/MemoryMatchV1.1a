import { playCoinRewardFlight } from "../coinRewards.js";
import { playLootDrop } from "../lootEffects.js";

const MATCH_DURATION_MS = 240;
const EXIT_DURATION_MS = 220;

export function presentTripleTransition({ shell, scope, next, events, effects = {}, render }) {
  const match = events.find((event) => event.type === "triple-resolved");
  const selected = events.find((event) => event.type === "tile-selected");
  if (!scope.active) { render(next); return Promise.resolve(); }
  if (!match && selected) return presentTrayFlight({ shell, scope, selected, render, next });
  if (!match) { render(next); return Promise.resolve(); }
  return presentResolvedTriple({ shell, scope, match, effects, render, next });
}

function presentResolvedTriple({ shell, scope, match, effects, render, next }) {
  const root = shell.refs.root;
  const surface = shell.refs.board;
  const line = root.querySelector(".triple-connect__line");
  const surfaceRect = surface.getBoundingClientRect();
  const sourceNodes = match.tileIds.map((id) => root.querySelector(`[data-tile-id="${id}"]`)).filter(Boolean);
  if (sourceNodes.length !== 3) { render(next); return Promise.resolve(); }
  const ghosts = sourceNodes.map((source) => createGhost(source, surfaceRect));
  render(next);
  line.className.baseVal = `triple-connect__line link-path-overlay ${effects.path?.className || "link-path-overlay--default"}`;
  ghosts.forEach((ghost) => surface.append(ghost));
  const cleanup = () => {
    line.replaceChildren();
    ghosts.forEach((ghost) => ghost.remove());
    root.querySelectorAll(".triple-connect__match-score").forEach((node) => node.remove());
  };
  const release = scope.own(cleanup, "node");
  if (prefersReducedMotion()) {
    showMatchScore({ shell, scope, ghosts, match, duration: 90 });
    return new Promise((resolve) => {
      scope.timeout(() => {
        presentMilestoneSequence({ shell, scope, source: ghosts[1] || ghosts[0], milestones: effects.milestones })
          .then(() => presentCommittedRewards(shell, ghosts[1] || ghosts[0], effects.rewards));
        cleanup();
        release.forget();
        resolve();
      }, 90);
    });
  }
  drawTripleLine(line, ghosts);
  const lineAnimation = line.animate(
    [{ opacity: 0 }, { opacity: 1, offset: 0.25 }, { opacity: 1, offset: 0.62 }, { opacity: 0 }],
    { duration: MATCH_DURATION_MS, easing: "ease-out", fill: "both" },
  );
  scope.animation(lineAnimation);
  const exits = ghosts.map((ghost) => playTripleExitEffect(scope, ghost, effects.exit?.id));
  showMatchScore({ shell, scope, ghosts, match, duration: EXIT_DURATION_MS });
  return Promise.all([lineAnimation.finished.catch(() => {}), ...exits.map((animation) => animation.finished.catch(() => {}))])
    .then(() => presentMilestoneSequence({ shell, scope, source: ghosts[1] || ghosts[0], milestones: effects.milestones }))
    .then(() => {
      presentCommittedRewards(shell, ghosts[1] || ghosts[0], effects.rewards);
      cleanup();
      release.forget();
    });
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

function drawTripleLine(line, ghosts) {
  const base = line.getBoundingClientRect();
  const points = ghosts.map((ghost) => {
    const rect = ghost.getBoundingClientRect();
    return `${rect.left + rect.width / 2 - base.left},${rect.top + rect.height / 2 - base.top}`;
  }).join(" ");
  const createPolyline = (className) => {
    const node = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    node.setAttribute("class", className);
    node.setAttribute("points", points);
    node.setAttribute("pathLength", "1");
    return node;
  };
  line.replaceChildren(createPolyline("link-path-overlay__glow"), createPolyline("link-path-overlay__beam"));
}

function playTripleExitEffect(scope, ghost, exitId = "default") {
  ghost.classList.add("is-removing", `triple-connect__exit--${exitId}`);
  const animation = ghost.animate(getExitFrames(exitId), {
    duration: EXIT_DURATION_MS, easing: "cubic-bezier(.2,.75,.25,1)", fill: "both",
  });
  scope.animation(animation);
  return animation;
}

function getExitFrames(exitId) {
  if (["burn", "finedust", "crumble"].includes(exitId)) return [
    { opacity: 1, filter: "saturate(1) brightness(1)", transform: "scale(1)" },
    { opacity: 0, filter: "saturate(.2) brightness(1.8)", transform: "translateY(-9px) scale(.72)" },
  ];
  if (["portal", "blackhole", "implode"].includes(exitId)) return [
    { opacity: 1, transform: "scale(1) rotate(0deg)" },
    { opacity: 0, transform: "scale(.08) rotate(160deg)" },
  ];
  if (["gravity", "ghost"].includes(exitId)) return [
    { opacity: 1, transform: "translateY(0)" },
    { opacity: 0, transform: "translateY(24px) scale(.88)" },
  ];
  if (exitId === "dissolve") return [
    { opacity: 1, filter: "blur(0px)" },
    { opacity: 0, filter: "blur(6px) brightness(1.4)", transform: "scale(1.08)" },
  ];
  if (exitId === "freeze") return [
    { opacity: 1, filter: "brightness(1) hue-rotate(0deg)" },
    { opacity: 0, filter: "brightness(2) hue-rotate(180deg)", transform: "scale(0.85)" },
  ];
  if (exitId === "bubble") return [
    { opacity: 1, transform: "translateY(0) scale(1)" },
    { opacity: 0, transform: "translateY(-22px) scale(1.15)" },
  ];
  if (["slice", "collide", "electric-shock"].includes(exitId)) return [
    { opacity: 1, transform: "scale(1) rotate(0deg)" },
    { opacity: 0, transform: "scale(0.65) rotate(-15deg)" },
  ];
  if (["split4", "split2", "split8", "triangles", "pixel", "origami"].includes(exitId)) return [
    { opacity: 1, transform: "scale(1)" },
    { opacity: 0, transform: "scale(0.2)" },
  ];
  return [{ opacity: 1, transform: "scale(1)" }, { opacity: 0, transform: "scale(.78)" }];
}

function showMatchScore({ shell, scope, ghosts, match, duration }) {
  const surface = shell.refs.board;
  const surfaceRect = surface.getBoundingClientRect();
  const rect = (ghosts[1] || ghosts[0]).getBoundingClientRect();
  const label = document.createElement("span");
  label.className = "triple-connect__match-score";
  label.textContent = `+${match.points}${match.combo > 1 ? ` · Combo x${match.combo}` : ""}`;
  label.style.left = `${rect.left + rect.width / 2 - surfaceRect.left}px`;
  label.style.top = `${rect.top + rect.height / 2 - surfaceRect.top}px`;
  surface.append(label);
  const remove = () => label.remove();
  const release = scope.own(remove, "node");
  const settle = () => { remove(); release.forget(); };
  if (prefersReducedMotion()) { scope.timeout(settle, duration); return; }
  const animation = label.animate([
    { opacity: 0, transform: "translate(-50%, -20%) scale(.85)" },
    { opacity: 1, transform: "translate(-50%, -80%) scale(1)" },
    { opacity: 0, transform: "translate(-50%, -135%) scale(.94)" },
  ], { duration, easing: "ease-out", fill: "both" });
  scope.animation(animation);
  animation.finished.catch(() => {}).then(settle);
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
  void target.offsetWidth;
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
  });
  surface.append(ghost);
  target.style.opacity = "0";
  const dx = targetRect.left - sourceRect.left;
  const dy = targetRect.top - sourceRect.top;
  const scaleX = sourceRect.width ? targetRect.width / sourceRect.width : 1;
  const scaleY = sourceRect.height ? targetRect.height / sourceRect.height : 1;
  const animation = ghost.animate([
    { transform: "translate(0, 0) scale(1)", opacity: 1 },
    { transform: `translate(${dx}px, ${dy}px) scale(${scaleX}, ${scaleY})`, opacity: 0.9 },
  ], { duration: 220, easing: "cubic-bezier(.2,.8,.2,1)", fill: "both" });
  scope.animation(animation);
  const cleanup = () => { ghost.remove(); target.style.removeProperty("opacity"); };
  const release = scope.own(cleanup, "node");
  return animation.finished.catch(() => {}).then(() => { cleanup(); release.forget(); });
}

function prefersReducedMotion() {
  return Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches);
}
