import { getActiveGameScope } from './gameShell/gameShellLifecycle.js';

// Dialogs and the chapter scene share the same visible banner and cleanup owner.
export function connectBannerClearance(overlay, lifecycle, onResize) {
  const banner = overlay.dataset.keepBanner
    ? [...document.querySelectorAll('.adventure-ad-slot')].reverse().find(slot => slot.getClientRects().length && !slot.closest('[hidden]'))
    : null;
  const readSpace = () => banner?.getBoundingClientRect().height || 0;
  function update() {
    if (!lifecycle.active || !overlay.isConnected) return;
    overlay.style.setProperty('--dialog-banner-space', `${readSpace()}px`);
    onResize?.();
  }
  overlay.style.setProperty('--dialog-banner-space', `${readSpace()}px`);
  if (banner) {
    const observer = new ResizeObserver(update);
    observer.observe(banner);
    lifecycle.own(() => observer.disconnect());
  }
  return readSpace;
}

// Each dialog owns its observers/listeners through its existing lifecycle.
export function connectDialogPlacement(overlay, panel, lifecycle) {
  const root = getActiveGameScope()?.active
    ? [...document.querySelectorAll('.game-shell-root')].find(node => node.getClientRects().length && !node.hidden)
    : null;
  const board = root?.querySelector('[data-shell-region="board"]');
  const map = !board && document.querySelector('.adventure-map-page:not([hidden])');
  const readBannerSpace = connectBannerClearance(overlay, lifecycle, schedule);
  const viewport = window.visualViewport;
  const edge = 16;
  let pending = false;
  overlay.dataset.dialogPlacement = board ? 'board' : map ? 'map' : 'viewport';
  if (map) overlay.classList.add('game-shell-tokens');
  function update() {
    pending = false;
    if (!lifecycle.active || !overlay.isConnected) return;
    const style = getComputedStyle(overlay);
    const safeTop = parseFloat(style.getPropertyValue('--dialog-safe-top')) || 0;
    const safeBottom = parseFloat(style.paddingBottom) || 0;
    const viewportTop = viewport?.offsetTop || 0;
    const viewportBottom = viewportTop + (viewport?.height || window.innerHeight);
    const bannerSpace = readBannerSpace();
    const bottom = viewportBottom - safeBottom - bannerSpace;
    overlay.style.setProperty('--dialog-banner-space', `${bannerSpace}px`);
    const referenceTop = overlay.dataset.dialogAlignment === 'center' ? 0
      : board ? board.getBoundingClientRect().top : map ? parseFloat(getComputedStyle(overlay, '::before').top) : 0;
    const top = Math.min(Math.max(viewportTop + Math.max(edge, safeTop), referenceTop), bottom - edge);
    overlay.style.setProperty('--dialog-top', `${top}px`);
    panel.style.maxHeight = `${Math.max(0, bottom - top)}px`;
  }
  function schedule() {
    if (pending || !lifecycle.active) return;
    pending = true;
    lifecycle.frame(update);
  }
  lifecycle.listen(window, 'resize', schedule);
  lifecycle.listen(window, 'scroll', schedule, true);
  if (viewport) {
    lifecycle.listen(viewport, 'resize', schedule);
    lifecycle.listen(viewport, 'scroll', schedule);
  }
  if (board) {
    const observer = new ResizeObserver(schedule);
    observer.observe(board); observer.observe(root);
    lifecycle.own(() => observer.disconnect());
  }
  update();
}
