const meteorQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const activeMeteors = new Set();
let meteorTimer;
let isMeteorEnabled = true;

function canAnimateMeteors() {
  return isMeteorEnabled && !document.hidden && !meteorQuery.matches;
}

function clearMeteorTimer() {
  clearTimeout(meteorTimer);
  meteorTimer = undefined;
}

function removeActiveMeteors() {
  activeMeteors.forEach((meteor) => meteor.remove());
  activeMeteors.clear();
}

function createMeteor() {
  if (!canAnimateMeteors() || activeMeteors.size >= 2) return;

  const meteor = document.createElement("div");
  meteor.className = "shooting-star";
  const isBright = Math.random() < 0.12;
  const duration = 1.2 + Math.random() * 1.3;
  meteor.style.left = `${Math.random() * window.innerWidth}px`;
  meteor.style.height = `${isBright ? 150 : 72 + Math.random() * 68}px`;
  meteor.style.opacity = String(isBright ? 0.92 : 0.45 + Math.random() * 0.3);
  meteor.style.animationDuration = `${duration}s`;

  if (isBright) {
    const head = document.createElement("div");
    head.className = "star-head";
    meteor.append(head);
  }

  activeMeteors.add(meteor);
  document.body.append(meteor);
  setTimeout(() => {
    meteor.remove();
    activeMeteors.delete(meteor);
  }, duration * 1000 + 100);
}

function scheduleMeteor() {
  clearMeteorTimer();
  if (!canAnimateMeteors()) return;
  meteorTimer = setTimeout(() => {
    createMeteor();
    scheduleMeteor();
  }, 3200 + Math.random() * 3800);
}

export function setMeteorEffectsEnabled(enabled) {
  isMeteorEnabled = Boolean(enabled);
  document.body.classList.toggle("meteor-effects-disabled", !isMeteorEnabled);
  if (!isMeteorEnabled) removeActiveMeteors();
  scheduleMeteor();
}

export function initializeMeteorEffects(enabled = true) {
  setMeteorEffectsEnabled(enabled);
}

document.addEventListener("visibilitychange", scheduleMeteor);
meteorQuery.addEventListener("change", scheduleMeteor);
