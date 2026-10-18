import { createIcon } from "./icons.js";
import { createVictoryFlowerSceneMarkup } from "./victoryFlowerScene.js";
import { createGameShellLifecycle, getActiveGameScope } from "./gameShell/gameShellLifecycle.js";
import { getAppPageScope } from "./appPageLifecycle.js";
import { connectBannerClearance } from "./dialogPlacement.js";
import { mountTouchDust } from "./touchDust.js";
import { pauseVictoryFlowerTheme, playVictoryFlowerTheme, sounds } from "./sound.js";

let activeCelebration = null;
export function showVictoryCelebration({ level, completedChapter, onNext, onMenu, settings }) {
  activeCelebration?.dispose();
  const scope = createGameShellLifecycle();
  activeCelebration = scope;
  const owner = getActiveGameScope() || getAppPageScope();
  const releaseOwner = owner?.own(() => scope.dispose(), "cleanup");
  const overlay = document.createElement("section");
  overlay.id = "victory-celebration";
  overlay.className = "victory-flower-overlay";
  overlay.dataset.keepBanner = 'true';
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", "Chúc mừng hoàn thành chặng");
  overlay.innerHTML = `${createVictoryFlowerSceneMarkup()}<div class="victory-flower-message"><p class="victory-flower-eyebrow">HÀNH TRÌNH HOÀN THÀNH</p><h2>Chúc mừng!</h2><p class="victory-flower-caption"></p></div><div class="victory-flower-actions"></div>`;
  overlay.querySelector(".victory-flower-caption").textContent = `Bạn đã chinh phục đủ 100 màn của chặng ${completedChapter || Math.ceil(level / 100)}.`;
  const actions = overlay.querySelector(".victory-flower-actions");
  const buttons = [
    { label: "Về Menu", icon: "home", action: onMenu },
    { label: "Tiếp tục", icon: "arrow-right", action: onNext },
  ];
  let closing = false;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  for (const entry of buttons) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "victory-action";
    button.append(createIcon(entry.icon), document.createTextNode(entry.label));
    actions.append(button);
    scope.listen(button, "click", () => {
      if (closing) return;
      closing = true;
      for (const control of actions.children) control.disabled = true;
      const complete = () => { scope.dispose(); if (!owner || owner.active) entry.action?.(); };
      if (reduced.matches) return complete();
      scope.animation(overlay.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 180, fill: "forwards" }));
      scope.timeout(complete, 180);
    });
  }
  const animations = [];
  scope.own(() => {
    overlay.remove();
    releaseOwner?.forget();
    pauseVictoryFlowerTheme();
    sounds.congratulations.pause();
    sounds.congratulations.currentTime = 0;
    if (activeCelebration === scope) activeCelebration = null;
  }, "node");
  document.body.append(overlay);
  connectBannerClearance(overlay, scope);
  mountTouchDust(overlay, scope, { selector: ".victory-flower-scene, .victory-action" });
  if (!reduced.matches) {
    for (const [index, bloom] of [...overlay.querySelectorAll(".victory-flower-bloom")].entries()) {
      const animation = bloom.animate([
        { opacity: 0, transform: "scale(.88) rotate(-3deg)", offset: 0 },
        { opacity: 1, transform: "scale(1) rotate(1deg)", offset: .32 },
        { opacity: 1, transform: "scale(1) rotate(-1deg)", offset: .6 },
        { opacity: 1, transform: "scale(1) rotate(.7deg)", offset: .82 },
        { opacity: 1, transform: "scale(1) rotate(0deg)", offset: 1 },
      ], { duration: 5200, delay: index * 120, easing: "ease-in-out", fill: "backwards" });
      scope.animation(animation); animations.push(animation);
      if (document.hidden) animation.pause();
    }
  }
  scope.listen(reduced, "change", () => { if (reduced.matches) for (const animation of animations) animation.cancel(); });
  scope.listen(document, "visibilitychange", () => {
    for (const animation of animations) {
      if (animation.playState === "finished" || animation.playState === "idle") continue;
      if (document.hidden) animation.pause(); else animation.play();
    }
    if (document.hidden) { pauseVictoryFlowerTheme(); sounds.congratulations.pause(); }
  });
  scope.listen(document, "keydown", event => {
    if (!overlay.contains(document.activeElement)) return;
    if (event.key === "Tab") {
      event.preventDefault();
      const controls = [...actions.children];
      const index = controls.indexOf(document.activeElement);
      controls[(index + (event.shiftKey ? controls.length - 1 : 1)) % controls.length].focus();
    } else if (event.key === "Escape") actions.firstElementChild.click();
  });
  playVictoryFlowerTheme(settings);
  if (settings?.sound && !document.hidden) {
    sounds.congratulations.currentTime = 0;
    sounds.congratulations.play().catch(error => { if (error.name !== "NotAllowedError" && error.name !== "AbortError") console.warn("Victory audio unavailable", error.name); });
  }
  actions.querySelector("button").focus();
  return scope;
}
