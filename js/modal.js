import { mountAppWallet } from './walletPresentation.js';
import { connectDialogPlacement } from './dialogPlacement.js';
import { suspendAmbientBackground } from './backgroundEffects.js';
import { createIcon } from "./icons.js";
import { UI_TIMING } from "./uiCatalog.js";
import { createGameShellLifecycle, getActiveGameScope } from "./gameShell/gameShellLifecycle.js";
import { getActivePlayMetrics } from "./playMetrics.js";

import { getAppPageScope } from "./appPageLifecycle.js";
import { ensureUiSkinRewards } from './uiSkin.js';
import { dismissContextGuide } from './tutorial/contextGuide.js';
import { getGameDefinition } from './gameCatalog.js';
import { decorateStorybookSurface } from './storybook/surface.js';
import { TUTORIAL_GAMES } from './tutorial/tutorialModel.js';

const modals = new Map();
import { suspendMenuAds } from './ads/menuAds.js';

export function openAppModal({
  id,
  icon = "",
  title,
  content = "",
  actions = [],
  size = "medium",
  showHeader = true,
  dismissible = true,
  closeOnBackdrop = true,
  closeOnEscape = true,
  onClose,
  onDestroy,
  onActionSettled,
  owner = getActiveGameScope() || getAppPageScope(),
  presentation = "modal",
  keepBanner = true,
  artwork = 'garden',
  alignment = "start",
  host = document.body,
  practiceGameId = null,
}) {
  dismissContextGuide();
  if (id && /summary|chest|treasure|collection|practice/.test(id)) void ensureUiSkinRewards({ tutorial: id === 'practice-modal' });
  const screen = presentation === 'screen';
  const previousFocus = document.activeElement;
  if (id) {
    modals.get(id)?.();
    document.getElementById(id)?.remove();
  }
  const lifecycle = createGameShellLifecycle();
  if (practiceGameId) {
    const games = practiceGameId === 'all' ? TUTORIAL_GAMES : [practiceGameId];
    actions = [...actions, ...games.map(gameId => ({
      label: practiceGameId === 'all' ? `Tập luyện ${getGameDefinition(gameId).title}` : 'Tập luyện',
      icon: 'book', variant: 'primary',
      onClick: async () => {
        const { openPractice } = await import('./tutorial/practice.js');
        if (lifecycle.active) openPractice(gameId, { owner: lifecycle });
        return true;
      },
    }))];
  }
  const metrics = getActivePlayMetrics();

  const overlay = document.createElement("div");
  const resumeMenuAds = screen || keepBanner ? null : suspendMenuAds(overlay);
  metrics?.clock.pause(overlay);
  overlay.className = screen ? 'app-screen-content' : "app-modal-overlay";
  if (keepBanner) overlay.dataset.keepBanner = 'true';
  if (alignment === 'center') overlay.dataset.dialogAlignment = 'center';
  if (id) overlay.id = id;

  const panel = document.createElement("section");
  panel.className = `app-modal app-modal--${size}`;
  if (!screen) panel.dataset.uiSurface = artwork;
  panel.setAttribute("role", screen ? 'region' : "dialog");
  if (!screen) panel.setAttribute("aria-modal", "true");
  else panel.setAttribute('aria-label', title);

  const header = document.createElement("header");
  header.className = "app-modal__header";

  const heading = document.createElement("h2");
  heading.className = "app-modal__title";
  if (icon) heading.appendChild(createIcon(icon));
  heading.appendChild(document.createTextNode(title));
  header.appendChild(heading);
  if (["shop-modal","collection-modal","rankings-modal","account-modal","settings-modal","missions-screen","events-screen"].includes(id)) {
    panel.classList.add('app-modal--functional'); header.classList.add('app-modal__header--functional');
    if (id !== 'settings-modal') mountAppWallet(header, lifecycle);
  }

  let closed = false;
  let destroyed = false;
  let resolveClosed;
  const whenClosed = new Promise(resolve => { resolveClosed = resolve; });
  let submitting = false;
  let releaseOwner;
  const destroy = (completedClose = false) => {
    if (destroyed) return;
    destroyed = closed = true;
    lifecycle.dispose();
    releaseOwner?.forget();
    const restoreFocus = overlay.contains(document.activeElement);
    overlay.remove();
    resolveClosed({ reason: completedClose === true ? 'closed' : 'destroyed' });
    if (resumeMenuAds) resumeMenuAds();
    if (restoreFocus && (!owner || owner.active) && previousFocus?.isConnected && typeof previousFocus.focus === "function") previousFocus.focus();
    metrics?.clock.resume(overlay);
    if (id && modals.get(id) === destroy) modals.delete(id);
    onDestroy?.();
  };
  releaseOwner = owner?.own(destroy, "node");
  if (id) modals.set(id, destroy);
  const close = () => {
    if (closed) return;
    closed = true;
    const dismissButton = panel.querySelector('.app-modal__close');
    // Keep focus inside the closing dialog until destroy restores its opener.
    if (document.activeElement === dismissButton) panel.focus();
    if (dismissButton) dismissButton.disabled = true;
    removeKeydown();
    overlay.classList.add("is-closing");
    lifecycle.timeout(() => {
      destroy(true);
      if (!owner || owner.active) onClose?.();
    }, UI_TIMING.modalCloseMs);
  };

  // Footer and custom content actions share the same modal-owned submission,
  // dismissal and cleanup boundary.
  const submit = async (onClick) => {
    if (submitting || closed) return;
    submitting = true;
    panel.setAttribute("aria-busy", "true");
    const controls = [...panel.querySelectorAll("button")].map(control => [control, control.disabled]);
    for (const [control] of controls) control.disabled = true;
    try {
      const result = await onClick?.(close);
      if (result === undefined || result === null) close();
    } catch (error) {
      console.error("Modal action failed", error.code || error.name);
      if (!destroyed) showAppToast("Thao tác chưa hoàn tất. Hãy thử lại.", { tone: "warning" });
    } finally {
      submitting = false;
      if (!destroyed) {
        panel.removeAttribute("aria-busy");
        for (const [control, disabled] of controls) control.disabled = disabled;
        onActionSettled?.();
      }
    }
  };

  if (dismissible && !screen) {
    const closeButton = document.createElement("button");
    closeButton.className = "app-modal__close";
    closeButton.type = "button";
    closeButton.setAttribute("aria-label", "Đóng");
    closeButton.append(createIcon('close'));
    lifecycle.listen(closeButton, "click", () => { if (!submitting) close(); });
    header.appendChild(closeButton);
  }

  const body = document.createElement("div");
  body.className = "app-modal__body";
  if (typeof content === "string") body.innerHTML = content;
  else if (content) body.appendChild(content);

  if (showHeader) panel.appendChild(header);
  panel.appendChild(body);

  if (actions.length > 0) {
    const footer = document.createElement("footer");
    footer.className = "app-modal__footer";
    actions.forEach(({ label, icon, variant = "secondary", sound, onClick }) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `app-button app-button--${variant}`;
      if (sound) button.dataset.clickSound = sound;
      if (icon) button.appendChild(createIcon(icon));
      button.appendChild(document.createTextNode(label));
      lifecycle.listen(button, "click", () => submit(onClick));
      footer.appendChild(button);
    });
    panel.appendChild(footer);
  }

  decorateStorybookSurface(panel, document.documentElement.dataset.uiSkin === 'storybook');
  overlay.appendChild(panel);
  host.appendChild(overlay);
  lifecycle.own(suspendAmbientBackground());
  if (!screen) connectDialogPlacement(overlay, panel, lifecycle);
  panel.tabIndex = -1;
  (panel.querySelector("button:not([disabled]), input:not([disabled]), select:not([disabled])") || panel).focus();

  function handleKeydown(event) {
    const top = [...document.querySelectorAll(".app-modal-overlay:not(.is-closing)")].at(-1);
    if (top !== overlay) return;
    if (event.key === "Tab") {
      const controls = [...panel.querySelectorAll("button:not([disabled]), input:not([disabled]), select:not([disabled]), a[href], [tabindex='0']")].filter(control => control.getClientRects().length);
      if (!controls.length) { event.preventDefault(); panel.focus(); return; }
      const index = controls.indexOf(document.activeElement);
      if (index < 0 || !event.shiftKey && index === controls.length - 1 || event.shiftKey && index === 0) {
        event.preventDefault(); controls[event.shiftKey ? controls.length - 1 : 0].focus();
      }
    }
    if (event.key === "Escape" && dismissible && closeOnEscape && !submitting) close();
  }

  const removeKeydown = screen ? () => {} : lifecycle.listen(document, "keydown", handleKeydown);
  if (closeOnBackdrop && dismissible && !screen) {
    lifecycle.listen(overlay, "click", (event) => {
      if (event.target === overlay && !submitting) close();
    });
  }

  return { overlay, panel, body, close, destroy, submit, whenClosed };
}

export function showAppToast(message, { tone = "info", duration = 1600, position = 'top' } = {}) {
  const centered = position === 'center';
  let region = document.querySelector(centered ? '.app-toast-region[data-position="center"]' : '.app-toast-region:not([data-position="center"])');
  if (!region) {
    region = document.createElement("div");
    region.className = "app-toast-region";
    if (centered) region.dataset.position = 'center';
    region.setAttribute("aria-live", "polite");
    document.body.appendChild(region);
  }

  const existing = centered && region.querySelector('.app-toast:not(.is-closing)');
  if (existing) { existing.textContent = message; return; }
  const toast = document.createElement("div");
  toast.className = `app-toast app-toast--${tone}`;
  toast.textContent = message;
  region.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("is-closing");
    setTimeout(() => {
      toast.remove();
      if (!region.children.length) region.remove();
    }, UI_TIMING.modalCloseMs);
  }, duration);
}
