import { GAMEPLAY_TIMING } from "./gameplayTuning.js";
import { showVictoryFireworks } from "./fireworkEffect.js";
import { createIcon } from "./icons.js";
import { createVictoryFlowerSceneMarkup } from "./victoryFlowerScene.js";
import {
  pauseVictoryFlowerTheme,
  playVictoryFlowerTheme,
  sounds,
} from "./sound.js";

/** Cảnh chiến thắng độc lập: chỉ hiển thị, không thay đổi gameState hay gameplay. */
export function showVictoryCelebration({
  level,
  onNext,
  onMenu,
  settings,
}) {
  document.getElementById("victory-celebration")?.remove();

  const { finalLevel, flowerGrowthDurationMs } = GAMEPLAY_TIMING.victoryCelebration;
  const isFinalVictory = level >= finalLevel;
  const overlay = document.createElement("section");
  overlay.id = "victory-celebration";
  overlay.className = "victory-flower-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", "Chúc mừng chiến thắng");

  overlay.innerHTML = `
    ${createVictoryFlowerSceneMarkup()}
    <div class="victory-flower-message" aria-live="polite">
      <button type="button" class="victory-flower-message__title" data-victory-toggle aria-expanded="false">
        <span class="victory-title-fireflies" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></span>
        <span>Congratulations!</span>
      </button>
      <div class="victory-flower-message__actions">
        <button type="button" class="victory-action victory-action--secondary" data-victory-action="menu"></button>
        <button type="button" class="victory-action victory-action--primary" data-victory-action="next"></button>
      </div>
    </div>`;

  const menuButton = overlay.querySelector('[data-victory-action="menu"]');
  menuButton.append(createIcon("home"), document.createTextNode("Về Menu"));
  const nextButton = overlay.querySelector('[data-victory-action="next"]');
  nextButton.append(
    createIcon(isFinalVictory ? "restart" : "arrow-right"),
    document.createTextNode(isFinalVictory ? "Chơi lại" : "Tiếp tục"),
  );
  const toggleButton = overlay.querySelector("[data-victory-toggle]");

  let closed = false;
  const swayTimeouts = new Set();
  const close = (callback) => {
    if (closed) return;
    closed = true;
    swayTimeouts.forEach(clearTimeout);
    swayTimeouts.clear();
    pauseVictoryFlowerTheme();
    overlay.classList.add("is-closing");
    setTimeout(() => {
      overlay.remove();
      callback?.();
    }, 300);
  };
  menuButton.addEventListener("click", () => close(onMenu));
  nextButton.addEventListener("click", () => close(onNext));
  toggleButton.addEventListener("click", () => {
    const isVisible = overlay.classList.toggle("is-actions-visible");
    toggleButton.setAttribute("aria-expanded", String(isVisible));
  });

  overlay.addEventListener("pointerdown", (event) => {
    if (!overlay.classList.contains("is-interactive")) return;
    const flower = event.target.closest(".flower");
    if (!flower || !overlay.contains(flower)) return;

    flower.classList.remove("is-touch-swaying");
    void flower.offsetWidth;
    flower.classList.add("is-touch-swaying");
    const timeoutId = setTimeout(
      () => {
        flower.classList.remove("is-touch-swaying");
        swayTimeouts.delete(timeoutId);
      },
      1000,
    );
    swayTimeouts.add(timeoutId);
  });

  document.body.appendChild(overlay);
  playVictoryFlowerTheme(settings);
  const startFlowerFireworks = () => showVictoryFireworks({
    durationMs: 3600,
    containerId: "victory-celebration",
    burstCount: 8,
    burstIntervalMs: 260,
  });
  const startFinaleFireworks = () => showVictoryFireworks({
    durationMs: 2200,
    containerId: "victory-celebration",
    burstCount: 3,
    burstIntervalMs: 360,
  });
  requestAnimationFrame(() => {
    overlay.classList.add("is-playing");
    overlay
      .querySelector(".victory-flower-overlay__source")
      ?.classList.add("is-playing");
  });
  setTimeout(() => {
    overlay.classList.add("is-message-visible", "is-interactive");
    if (settings?.sound) {
      sounds.congratulations.currentTime = 0;
      sounds.congratulations.play().catch(() => {});
      sounds.congratulations.addEventListener("ended", startFinaleFireworks, {
        once: true,
      });
    } else {
      setTimeout(startFinaleFireworks, 4000);
    }
  }, flowerGrowthDurationMs);
  setTimeout(startFlowerFireworks, Math.max(0, flowerGrowthDurationMs - 2000));
}
