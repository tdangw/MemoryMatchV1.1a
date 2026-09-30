// Navigation waits for a decoded background before mounting its menu. Tests
// await that DOM boundary before issuing gameplay commands, as real clicks do.
export async function openReadyGameMenu(id) {
  const { openGameMenu } = await import("/js/gameSelector.js");
  const previous = document.getElementById("menu-container");
  await new Promise((resolve, reject) => {
    const ready = () => document.documentElement.dataset.activeGame === id && document.getElementById("menu-container") !== previous && document.querySelector("#menu-container .menu-item");
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
