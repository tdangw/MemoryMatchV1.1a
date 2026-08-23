const toggleButton = document.getElementById('btn-actions-menu');
const actionsMenu = document.getElementById('game-actions-menu');

export function closeGameMenu() {
  if (!toggleButton || !actionsMenu) return;
  actionsMenu.hidden = true;
  toggleButton.setAttribute('aria-expanded', 'false');
}

function openGameMenu() {
  if (!toggleButton || !actionsMenu) return;
  actionsMenu.hidden = false;
  toggleButton.setAttribute('aria-expanded', 'true');
}

if (toggleButton && actionsMenu) {
  toggleButton.addEventListener('click', (event) => {
    event.stopPropagation();
    if (actionsMenu.hidden) openGameMenu();
    else closeGameMenu();
  });

  actionsMenu.addEventListener('click', (event) => {
    if (event.target.closest('.game-action-item')) closeGameMenu();
  });

  document.addEventListener('click', (event) => {
    if (!actionsMenu.hidden && !event.target.closest('#game-title')) closeGameMenu();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeGameMenu();
  });
}
