import { createIcon } from "./icons.js";
import { UI_TIMING } from "./uiCatalog.js";

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
}) {
  if (id) document.getElementById(id)?.remove();

  const overlay = document.createElement("div");
  overlay.className = "app-modal-overlay";
  if (id) overlay.id = id;

  const panel = document.createElement("section");
  panel.className = `app-modal app-modal--${size}`;
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-modal", "true");

  const header = document.createElement("header");
  header.className = "app-modal__header";

  const heading = document.createElement("h2");
  heading.className = "app-modal__title";
  if (icon) heading.appendChild(createIcon(icon));
  heading.appendChild(document.createTextNode(title));
  header.appendChild(heading);

  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    document.removeEventListener("keydown", handleKeydown);
    overlay.classList.add("is-closing");
    setTimeout(() => {
      onClose?.();
      overlay.remove();
    }, UI_TIMING.modalCloseMs);
  };

  if (dismissible) {
    const closeButton = document.createElement("button");
    closeButton.className = "app-modal__close";
    closeButton.type = "button";
    closeButton.setAttribute("aria-label", "Đóng");
    closeButton.textContent = "×";
    closeButton.addEventListener("click", close);
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
      button.addEventListener("click", () => onClick?.(close) ?? close());
      footer.appendChild(button);
    });
    panel.appendChild(footer);
  }

  overlay.appendChild(panel);
  document.body.appendChild(overlay);

  function handleKeydown(event) {
    if (event.key === "Escape" && dismissible && closeOnEscape) close();
  }

  document.addEventListener("keydown", handleKeydown);
  if (closeOnBackdrop && dismissible) {
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) close();
    });
  }

  return { overlay, panel, body, close };
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
