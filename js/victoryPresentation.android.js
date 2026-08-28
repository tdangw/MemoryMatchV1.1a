import "../styles/victory-mobile.css";
import { createIcon } from "./icons.js";
import { sounds } from "./sound.js";

export const canShowFullVictoryCelebration = true;

export function showSummaryFireworks() {
  return Promise.resolve();
}

export function launchSummaryConfetti() {}

export function showFullVictoryCelebration({
  level,
  onNext,
  onMenu,
  settings,
}) {
  document.getElementById("android-victory-celebration")?.remove();

  const overlay = document.createElement("section");
  overlay.id = "android-victory-celebration";
  overlay.className = "android-victory-celebration";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", "Chúc mừng chiến thắng");

  const panel = document.createElement("div");
  panel.className = "android-victory-celebration__panel";
  const emblem = document.createElement("div");
  emblem.className = "android-victory-celebration__emblem";
  emblem.setAttribute("aria-hidden", "true");
  emblem.append(createIcon("trophy"));

  const eyebrow = document.createElement("p");
  eyebrow.className = "android-victory-celebration__eyebrow";
  eyebrow.textContent = "HÀNH TRÌNH HOÀN THÀNH";
  const title = document.createElement("h2");
  title.textContent = "Chúc mừng!";
  const message = document.createElement("p");
  message.className = "android-victory-celebration__message";
  message.textContent = `Bạn đã chinh phục Màn ${level}.`;

  const actions = document.createElement("div");
  actions.className = "android-victory-celebration__actions";
  const menuButton = document.createElement("button");
  menuButton.type = "button";
  menuButton.className = "android-victory-action android-victory-action--secondary";
  menuButton.append(createIcon("home"), document.createTextNode("Về Menu"));
  const nextButton = document.createElement("button");
  nextButton.type = "button";
  nextButton.className = "android-victory-action android-victory-action--primary";
  nextButton.append(createIcon("restart"), document.createTextNode("Chơi lại"));
  actions.append(menuButton, nextButton);
  panel.append(emblem, eyebrow, title, message, actions);
  overlay.append(panel);

  let closed = false;
  const close = (callback) => {
    if (closed) return;
    closed = true;
    sounds.congratulations.pause();
    sounds.congratulations.currentTime = 0;
    overlay.classList.add("is-closing");
    setTimeout(() => {
      overlay.remove();
      callback?.();
    }, 180);
  };
  menuButton.addEventListener("click", () => close(onMenu));
  nextButton.addEventListener("click", () => close(onNext));

  document.body.append(overlay);
  requestAnimationFrame(() => overlay.classList.add("is-visible"));
  if (settings?.sound) {
    sounds.congratulations.currentTime = 0;
    sounds.congratulations.play().catch(() => {});
  }
}
