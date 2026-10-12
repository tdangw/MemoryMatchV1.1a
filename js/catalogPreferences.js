import { gameState } from "./gameState.js";
import { savePersistentGameData } from "./persistence.js";

const SURFACES = new Set(["shop", "collection"]);
const TAB_IDS = new Set(["items", "appearance", "flip", "themes", "path", "exit"]);

export function getCatalogTab(gameId, surface, availableTabs) {
  const tab = gameState.settings.catalogTabs?.[`${gameId}:${surface}`];
  return availableTabs.includes(tab) ? tab : availableTabs[0];
}

export async function setCatalogTab(gameId, surface, tabId) {
  if (!SURFACES.has(surface) || !TAB_IDS.has(tabId)) return false;
  const key = `${gameId}:${surface}`;
  if (gameState.settings.catalogTabs?.[key] === tabId) return true;
  const previous = gameState.settings.catalogTabs || {};
  gameState.settings.catalogTabs = { ...previous, [key]: tabId };
  if ((await savePersistentGameData({ settings: gameState.settings }))) return true;
  gameState.settings.catalogTabs = previous;
  return false;
}

/**
 * Owns the catalog tab UI for both Shop and Collection. Rendering a tab never
 * changes the preference: only an explicit user selection is persisted.
 */
export async function mountCatalogTabs({ gameId, surface, tabs, tablist, panel }) {
  const availableTabs = tabs.map(({ id }) => id).filter((id) => TAB_IDS.has(id));
  if (!SURFACES.has(surface) || !availableTabs.length) {
    throw new Error("Catalog navigation requires a supported surface and tab.");
  }

  const baseId = `catalog-${surface}-${gameId}`;
  tablist.id = `${baseId}-tabs`;
  panel.id = `${baseId}-panel`;
  panel.setAttribute("role", "tabpanel");
  panel.setAttribute("aria-labelledby", `${baseId}-tab-${getCatalogTab(gameId, surface, availableTabs)}`);

  const buttons = new Map();
  let selectedId = getCatalogTab(gameId, surface, availableTabs);
  const activate = async (tabId, { persist = false, focus = false } = {}) => {
    if (!availableTabs.includes(tabId)) return false;
    const previousId = selectedId;
    const saving = persist ? setCatalogTab(gameId, surface, tabId) : Promise.resolve(true);
    selectedId = tabId;
    for (const [id, button] of buttons) {
      const selected = id === tabId;
      button.classList.toggle("is-active", selected);
      button.setAttribute("aria-selected", String(selected));
      button.tabIndex = selected ? 0 : -1;
    }
    panel.setAttribute("aria-labelledby", `${baseId}-tab-${tabId}`);
    tabs.find(({ id }) => id === tabId).render();
    if (focus) buttons.get(tabId).focus();
    if (!await saving) {
      await activate(previousId);
      return false;
    }
    return true;
  };

  for (const { id, label } of tabs) {
    const button = document.createElement("button");
    button.type = "button";
    button.id = `${baseId}-tab-${id}`;
    button.className = "shop-tab";
    button.textContent = label;
    button.setAttribute("role", "tab");
    button.setAttribute("aria-controls", panel.id);
    button.addEventListener("click", async () => (await activate(id, { persist: true })));
    button.addEventListener("keydown", async (event) => {
      const index = availableTabs.indexOf(id);
      const nextIndex = event.key === "ArrowRight" || event.key === "ArrowDown"
        ? (index + 1) % availableTabs.length
        : event.key === "ArrowLeft" || event.key === "ArrowUp"
          ? (index - 1 + availableTabs.length) % availableTabs.length
          : event.key === "Home" ? 0 : event.key === "End" ? availableTabs.length - 1 : null;
      if (nextIndex === null) return;
      event.preventDefault();
      (await activate(availableTabs[nextIndex], { persist: true, focus: true }));
    });
    buttons.set(id, button);
    tablist.append(button);
  }

  (await activate(selectedId));
  return Object.freeze({ selectedId: () => selectedId, activate });
}
