/** One exclusive menu state per HUD mount, owned by its lifecycle scope. */
export function bindGameHudMenus(scope, entries) {
  let menus = entries;
  let current = null;
  const close = () => {
    for (const { trigger, panel } of menus) {
      panel.hidden = true;
      trigger.setAttribute("aria-expanded", "false");
      trigger.classList.remove("is-open");
    }
    current = null;
  };
  close();
  for (const entry of menus) {
    scope.listen(entry.trigger, "click", () => {
      const opening = current !== entry;
      close();
      if (!opening) return;
      current = entry;
      entry.panel.hidden = false;
      entry.trigger.setAttribute("aria-expanded", "true");
      entry.trigger.classList.add("is-open");
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
