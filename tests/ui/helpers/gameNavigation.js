// Navigation waits for a decoded background before mounting its menu. Tests
// await that DOM boundary before issuing gameplay commands, as real clicks do.
export async function openReadyGameMenu(id) {
  const { openGameMenu } = await import("/js/gameSelector.js");
  const { getActiveGameScope } = await import('/js/gameShell/gameShellLifecycle.js');
  const applicationReady = () => getActiveGameScope()?.active || document.querySelector('.game-selector__choice, #menu-container[data-map-ready="true"]');
  if (!applicationReady()) await new Promise(resolve => {
    const observer = new MutationObserver(() => {
      if (!applicationReady()) return;
      observer.disconnect(); resolve();
    });
    observer.observe(document.documentElement, { attributes: true, childList: true, subtree: true });
  });
  const previous = document.getElementById("menu-container");
  await new Promise((resolve, reject) => {
    const ready = () => document.getElementById("menu-container") !== previous && document.querySelector(`#menu-container.${id}-menu[data-map-ready="true"]`);
    const observer = new MutationObserver(() => {
      if (!ready()) return;
      observer.disconnect();
      resolve();
    });
    observer.observe(document.documentElement, { attributes: true, childList: true, subtree: true });
    if (!openGameMenu(id)) {
      observer.disconnect();
      reject(new Error(`Unknown game: ${id}`));
    }
  });
}
