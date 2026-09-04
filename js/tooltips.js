const TOOLTIP_DELAY_MS = 450;
const TOOLTIP_HIDE_MS = 3000;
const VIEWPORT_GAP = 8;
const TOOLTIP_GAP = 10;

const INFO_ONLY_SELECTOR = [
  ".stat-star-progress",
  ".stat-points",
  ".link-special-hud__milestones span",
  ".link-tile.is-frozen",
].join(", ");

let tooltip;
let activeAnchor;
let hideTimer;
let pressTimer;
let pressAnchor;
let suppressClickFor;

function getTooltipText(element) {
  if (!element) return "";
  if (element.dataset.tooltip) return element.dataset.tooltip;
  if (element.matches("#btn-buy-time")) return "Mua thêm thời gian để không bị thua.";
  if (element.matches("#btn-preview-cards")) return "Xem nhanh các thẻ bạn đã vô tình quên.";
  if (element.matches("#btn-hint")) return "Lật 2 thẻ để bạn ghi nhớ.";
  if (element.matches(".stat-star-progress")) return "Điểm càng cao, càng nhiều sao.";
  if (element.matches("#link-tools-toggle")) return "Dùng vật phẩm khi cần trợ giúp.";
  if (element.matches(".link-connect-game__item")) {
    return {
      hint: "Chỉ ra hai thẻ nối được.",
      reshuffle: "Đổi chỗ thẻ để tìm đường mới.",
      thunder: "Xóa ngẫu nhiên vài cặp thẻ.",
      freeze: "Dừng thời gian trong chốc lát.",
    }[element.dataset.item] || "Dùng vật phẩm khi cần trợ giúp.";
  }
  if (element.matches(".link-special-hud__milestones span")) return "Phần thưởng mốc đặc biệt.";
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

function getDisabledButtonTooltip(element) {
  const label = element.textContent.trim();
  if (label === "Chờ ảnh") return "Chủ đề này đang được hoàn thiện.";
  if (label === "Sắp có") return "Nội dung này sẽ sớm xuất hiện.";
  return "Bạn đã có lựa chọn này.";
}

function getAnchor(target) {
  const candidate = target instanceof Element
    ? target.closest("#btn-buy-time, #btn-preview-cards, #btn-hint, .stat-star-progress, .stat-points, #link-tools-toggle, .link-connect-game__item, .link-special-hud__milestones span, .link-tile.is-frozen, #toggle-meteor-effects, #toggle-board-coordinates, #version-info, .app-modal__close, .shop-tab, .appearance-choice, .theme-choice, .shop-buy-button:disabled")
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
  if (anchor) showTooltip(anchor);
});

document.addEventListener("pointerout", (event) => {
  if (event.pointerType !== "mouse") return;
  const anchor = getAnchor(event.target);
  if (anchor && !anchor.contains(event.relatedTarget)) hideTooltip();
});

document.addEventListener("focusin", (event) => {
  const anchor = getAnchor(event.target);
  if (anchor) showTooltip(anchor);
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
