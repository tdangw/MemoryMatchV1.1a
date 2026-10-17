import { connectDialogPlacement } from './dialogPlacement.js';
import { createIcon } from "./icons.js";
import { UI_TIMING } from "./uiCatalog.js";
import { createGameShellLifecycle, getActiveGameScope } from "./gameShell/gameShellLifecycle.js";
import { getActivePlayMetrics } from "./playMetrics.js";

import { getAppPageScope } from "./appPageLifecycle.js";

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
  keepBanner = false,
  alignment = "start",
  host = document.body,
}) {
  const screen = presentation === 'screen';
  const previousFocus = document.activeElement;
  if (id) {
    modals.get(id)?.();
    document.getElementById(id)?.remove();
  }
  const lifecycle = createGameShellLifecycle();
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

  let closed = false;
  let destroyed = false;
  let submitting = false;
  let releaseOwner;
  const destroy = () => {
    if (destroyed) return;
    destroyed = closed = true;
    lifecycle.dispose();
    releaseOwner?.forget();
    const restoreFocus = overlay.contains(document.activeElement);
    overlay.remove();
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
    removeKeydown();
    overlay.classList.add("is-closing");
    lifecycle.timeout(() => {
      destroy();
      if (!owner || owner.active) onClose?.();
    }, UI_TIMING.modalCloseMs);
  };

  if (dismissible && !screen) {
    const closeButton = document.createElement("button");
    closeButton.className = "app-modal__close";
    closeButton.type = "button";
    closeButton.setAttribute("aria-label", "Đóng");
    closeButton.textContent = "×";
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
    actions.forEach(({ label, icon, variant = "secondary", onClick }) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `app-button app-button--${variant}`;
      if (icon) button.appendChild(createIcon(icon));
      button.appendChild(document.createTextNode(label));
      lifecycle.listen(button, "click", async () => {
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
      });
      footer.appendChild(button);
    });
    panel.appendChild(footer);
  }

  overlay.appendChild(panel);
  host.appendChild(overlay);
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

  return { overlay, panel, body, close, destroy };
}

export function showAppToast(message, { tone = "info", duration = 1600 } = {}) {
  let region = document.querySelector(".app-toast-region");
  if (!region) {
    region = document.createElement("div");
    region.className = "app-toast-region";
    region.setAttribute("aria-live", "polite");
    document.body.appendChild(region);
  }

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
