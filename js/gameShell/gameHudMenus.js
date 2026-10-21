/** One exclusive menu state per HUD mount, owned by its lifecycle scope. */
import { getActivePlayMetrics } from "../playMetrics.js";
import { showContextGuide } from '../tutorial/contextGuide.js';
export function bindGameHudMenus(scope, entries) {
  let menus = entries;
  let current = null;
  let pausedMetrics = null;
  const pauseReason = {};
  const close = () => {
    for (const { trigger, panel } of menus) {
      panel.hidden = true;
      trigger.setAttribute("aria-expanded", "false");
      trigger.classList.remove("is-open");
    }
    current = null;
    pausedMetrics?.clock.resume(pauseReason);
    pausedMetrics = null;
  };
  close();
  for (const entry of menus) {
    scope.listen(entry.trigger, "click", () => {
      const opening = current !== entry;
      close();
      if (!opening) return;
      current = entry;
      pausedMetrics = getActivePlayMetrics();
      pausedMetrics?.clock.pause(pauseReason);
      entry.panel.hidden = false;
      entry.trigger.setAttribute("aria-expanded", "true");
      entry.trigger.classList.add("is-open");
      if (entry.trigger.id.includes('tools')) {
        const gameId = entry.trigger.id.startsWith('memory') ? 'memory-match' : entry.trigger.id.startsWith('link') ? 'link-connect' : 'triple-connect';
        showContextGuide(`tools:${gameId}`,entry.panel,scope);
      }
    });
    scope.listen(entry.panel, "click", event => {
      if (event.target.closest("button")) close();
    });
  }
  scope.listen(document, "click", event => {
    if (current && !current.trigger.contains(event.target) && !current.panel.contains(event.target)) close();
  });
  scope.listen(document, "keydown", event => {
    if (event.key !== "Escape" || !current) return;
    const trigger = current.trigger;
    close();
    trigger.focus();
  });
  scope.own(() => {
    close();
    menus = [];
  });
  return { close };
}
