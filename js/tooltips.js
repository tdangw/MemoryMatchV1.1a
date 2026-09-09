import { formatItemNameFromSrc } from "./itemNameFormatter.js";
import { gameState } from "./gameState.js";

import { shellTimeout as setTimeout, clearShellTimeout as clearTimeout, shellFrame as requestAnimationFrame } from "./gameShell/gameShellLifecycle.js";

const TOOLTIP_DELAY_MS = 450;
const TOOLTIP_HIDE_MS = 2200;
const VIEWPORT_GAP = 8;
const TOOLTIP_GAP = 4;
// Delay trước khi hiện tooltip khi chuột dừng trên thẻ game (tránh hiện khi lia nhanh).
const TILE_HOVER_DELAY_MS = 450;

const INFO_ONLY_SELECTOR = "[data-hud-info], .link-tile.is-frozen";

let tooltip;
let activeAnchor;
let hideTimer;
let pressTimer;
let pressAnchor;
let suppressClickFor;
let tileHoverTimer;

function getTooltipText(element) {
  if (!element) return "";
  // Thẻ game được xử lý trước — tên ảnh ưu tiên hơn mọi dataset.tooltip chức năng.
  if (element.matches(".link-tile, .tile")) return gameState.settings.cardDescriptions ? getTileName(element) : "";
  if (element.dataset.tooltip) return element.dataset.tooltip;
  if (element.matches(".link-tile.is-frozen")) return "Thẻ đang bị khóa.";
  if (element.matches("#toggle-meteor-effects")) return "Bật hoặc tắt hiệu ứng nền.";
  if (element.matches("#toggle-board-coordinates")) return "Hiện hàng và cột trên bàn cờ.";
  if (element.matches("#version-info")) return "Xem phiên bản trò chơi.";
  if (element.matches(".app-modal__close")) return "Đóng.";
  if (element.matches(".shop-tab")) return getTabTooltip(element.textContent.trim());
  if (element.matches(".appearance-choice, .theme-choice")) return getCatalogTooltip(element);
  if (element.matches(".shop-buy-button:disabled")) return getDisabledButtonTooltip(element);
  return "";
}

function getTabTooltip(label) {
  return {
    "Ngoại hình": "Đổi mặt sau của thẻ.",
    "Hiệu ứng lật": "Đổi cách thẻ mở ra.",
    "Chủ đề": "Đổi bộ hình cho ván sau.",
    "Vật phẩm": "Mua vật phẩm hỗ trợ.",
    "Đường nối": "Đổi hiệu ứng đường nối.",
    "Xóa thẻ": "Đổi hiệu ứng khi ghép đúng.",
  }[label] || "Xem thêm lựa chọn.";
}

function getCatalogTooltip(element) {
  const modal = element.closest("#shop-modal, #collection-modal");
  const activeTab = modal?.querySelector(".shop-tab.is-active")?.textContent.trim();
  if (activeTab === "Ngoại hình") return "Đổi mặt sau của thẻ.";
  if (activeTab === "Hiệu ứng lật") return "Đổi cách thẻ mở ra.";
  if (activeTab === "Chủ đề") return "Đổi bộ hình cho ván sau.";
  if (activeTab === "Đường nối") return "Đổi hiệu ứng đường nối.";
  if (activeTab === "Xóa thẻ") return "Đổi hiệu ứng khi ghép đúng.";
  if (activeTab === "Vật phẩm") return "Dùng khi cần trợ giúp.";
  return "Xem lựa chọn này.";
}

function getTileName(element) {
  // Memory Match: Chỉ hiện tên khi thẻ đang ngửa (img không có class 'hidden') hoặc đã ghép (class 'matched').
  // Kiểm tra này ngăn người chơi xem tên thẻ úp để gian lận.
  if (element.matches(".tile")) {
    const img = element.querySelector("img");
    if (!img || (img.classList.contains("hidden") && !element.classList.contains("matched"))) return "";
    return formatItemNameFromSrc(img.src, img.alt);
  }
  // Link Connect: Mọi thẻ đều ngửa, hiện tên + trạng thái khóa nếu có.
  if (element.matches(".link-tile")) {
    const img = element.querySelector("img:not(.link-tile__frost-overlay)");
    if (!img?.src) return "";
    const name = formatItemNameFromSrc(img.src, img.alt);
    if (!name) return "";
    return element.classList.contains("is-frozen") ? `${name} (Đang bị khóa)` : name;
  }
  return "";
}

function getDisabledButtonTooltip(element) {
  const label = element.textContent.trim();
  if (label === "Chờ ảnh") return "Chủ đề này đang được hoàn thiện.";
  if (label === "Sắp có") return "Nội dung này sẽ sớm xuất hiện.";
  return "Bạn đã có lựa chọn này.";
}

function getAnchor(target) {
  const candidate = target instanceof Element
    ? target.closest("[data-tooltip], .link-tile, .tile, #toggle-meteor-effects, #toggle-board-coordinates, #version-info, .app-modal__close, .shop-tab, .appearance-choice, .theme-choice, .shop-buy-button:disabled")
    : null;
  return candidate && getTooltipText(candidate) ? candidate : null;
}

function ensureTooltip() {
  if (tooltip) return tooltip;
  tooltip = document.createElement("div");
  tooltip.id = "app-tooltip";
  tooltip.className = "app-tooltip";
  tooltip.setAttribute("role", "tooltip");
  tooltip.hidden = true;
  document.body.append(tooltip);
  return tooltip;
}

function showTooltip(anchor, { autoHide = false } = {}) {
  const text = getTooltipText(anchor);
  if (!text) return;
  clearTimeout(hideTimer);
  const element = ensureTooltip();
  activeAnchor?.removeAttribute("aria-describedby");
  activeAnchor = anchor;
  anchor.setAttribute("aria-describedby", element.id);
  element.textContent = text;
  element.hidden = false;
  element.classList.remove("is-visible");
  positionTooltip(anchor, element);
  requestAnimationFrame(() => element.classList.add("is-visible"));
  if (autoHide) hideTimer = setTimeout(hideTooltip, TOOLTIP_HIDE_MS);
}

function hideTooltip() {
  clearTimeout(hideTimer);
  if (!tooltip || tooltip.hidden) return;
  activeAnchor?.removeAttribute("aria-describedby");
  activeAnchor = null;
  tooltip.classList.remove("is-visible");
  setTimeout(() => {
    if (!tooltip.classList.contains("is-visible")) tooltip.hidden = true;
  }, 120);
}

export function clearTooltip() {
  clearTimeout(hideTimer);
  clearTimeout(pressTimer);
  activeAnchor?.removeAttribute("aria-describedby");
  activeAnchor = pressAnchor = suppressClickFor = null;
  // Keep the singleton DOM node; callbacks from the disposed round cannot show it.
  if (tooltip) {
    tooltip.classList.remove("is-visible");
    tooltip.hidden = true;
    tooltip.textContent = "";
  }
}

function positionTooltip(anchor, element) {
  element.style.left = "0px";
  element.style.top = "0px";
  const rect = anchor.getBoundingClientRect();
  const size = element.getBoundingClientRect();
  const candidates = [
    { placement: "top", left: rect.left + (rect.width - size.width) / 2, top: rect.top - size.height - TOOLTIP_GAP },
    { placement: "bottom", left: rect.left + (rect.width - size.width) / 2, top: rect.bottom + TOOLTIP_GAP },
    { placement: "right", left: rect.right + TOOLTIP_GAP, top: rect.top + (rect.height - size.height) / 2 },
    { placement: "left", left: rect.left - size.width - TOOLTIP_GAP, top: rect.top + (rect.height - size.height) / 2 },
  ];
  const viewportWidth = document.documentElement.clientWidth;
  const viewportHeight = document.documentElement.clientHeight;
  const overflow = (candidate) => Math.max(0, VIEWPORT_GAP - candidate.left)
    + Math.max(0, candidate.left + size.width - (viewportWidth - VIEWPORT_GAP))
    + Math.max(0, VIEWPORT_GAP - candidate.top)
    + Math.max(0, candidate.top + size.height - (viewportHeight - VIEWPORT_GAP));
  const candidate = candidates.find((item) => overflow(item) === 0)
    || candidates.reduce((best, item) => overflow(item) < overflow(best) ? item : best);
  const left = Math.min(Math.max(candidate.left, VIEWPORT_GAP), viewportWidth - size.width - VIEWPORT_GAP);
  const top = Math.min(Math.max(candidate.top, VIEWPORT_GAP), viewportHeight - size.height - VIEWPORT_GAP);
  element.dataset.placement = candidate.placement;
  element.style.left = `${Math.round(left)}px`;
  element.style.top = `${Math.round(top)}px`;
}

function isInfoOnly(anchor) {
  return anchor.matches(INFO_ONLY_SELECTOR);
}

function isCatalogAnchor(anchor) {
  return anchor.matches(".shop-tab, .appearance-choice, .theme-choice");
}

document.addEventListener("pointerover", (event) => {
  if (event.pointerType !== "mouse") return;
  const anchor = getAnchor(event.target);
  if (!anchor) return;
  // Thẻ game: Hiện sau khi chuột dừng lại để tránh bật tooltip khi lia nhanh qua bàn.
  if (anchor.matches(".tile, .link-tile")) {
    clearTimeout(tileHoverTimer);
    tileHoverTimer = setTimeout(() => showTooltip(anchor, { autoHide: true }), TILE_HOVER_DELAY_MS);
  } else {
    showTooltip(anchor);
  }
});

document.addEventListener("pointerout", (event) => {
  if (event.pointerType !== "mouse") return;
  const anchor = getAnchor(event.target);
  if (anchor?.matches(".tile, .link-tile")) clearTimeout(tileHoverTimer);
  if (anchor && !anchor.contains(event.relatedTarget)) hideTooltip();
});

document.addEventListener("focusin", (event) => {
  const anchor = getAnchor(event.target);
  // Chỉ hiển thị khi điều hướng bằng bàn phím. Focus phát sinh sau một cú chạm
  // không được phép bật tooltip che bàn chơi.
  if (anchor && anchor.matches(":focus-visible")) {
    showTooltip(anchor, { autoHide: anchor.matches(".tile, .link-tile") });
  }
});

document.addEventListener("focusout", (event) => {
  if (getAnchor(event.target)) hideTooltip();
});

document.addEventListener("pointerdown", (event) => {
  if (event.pointerType !== "touch") return;
  const anchor = getAnchor(event.target);
  if (!anchor) return;
  pressAnchor = anchor;
  clearTimeout(pressTimer);
  pressTimer = setTimeout(() => {
    suppressClickFor = anchor;
    showTooltip(anchor, { autoHide: true });
  }, isInfoOnly(anchor) ? 0 : TOOLTIP_DELAY_MS);
}, true);

document.addEventListener("pointerup", (event) => {
  if (event.pointerType !== "touch") return;
  clearTimeout(pressTimer);
  const anchor = getAnchor(event.target);
  if (anchor && anchor === pressAnchor && isInfoOnly(anchor)) {
    suppressClickFor = anchor;
    showTooltip(anchor, { autoHide: true });
  }
  pressAnchor = null;
}, true);

document.addEventListener("pointercancel", () => {
  clearTimeout(pressTimer);
  pressAnchor = null;
}, true);

document.addEventListener("click", (event) => {
  if (suppressClickFor && suppressClickFor.contains(event.target)) {
    event.preventDefault();
    event.stopImmediatePropagation();
    suppressClickFor = null;
    return;
  }
  const anchor = getAnchor(event.target);
  // Vùng thẻ trong cửa hàng/bộ sưu tập không có hành động trực tiếp, nên chạm
  // một lần vào đó có thể hiện giải thích ngay. Nút Mua/Trang bị vẫn giữ click gốc.
  if (anchor && isCatalogAnchor(anchor) && !event.target.closest("button:not(.shop-tab)")) {
    showTooltip(anchor, { autoHide: true });
  }
  if (activeAnchor && !activeAnchor.contains(event.target)) hideTooltip();
}, true);

document.addEventListener("contextmenu", (event) => {
  if (suppressClickFor && suppressClickFor.contains(event.target)) event.preventDefault();
}, true);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") hideTooltip();
});

window.addEventListener("resize", () => {
  if (tooltip && activeAnchor && !tooltip.hidden) positionTooltip(activeAnchor, tooltip);
});
window.addEventListener("scroll", hideTooltip, true);
