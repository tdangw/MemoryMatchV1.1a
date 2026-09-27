import { gameState, spendCoins } from "./gameState.js";
import {
  updateCoinDisplay,
  updateHintDisplay,
  updateTimerDisplay,
  syncMemoryTimeProgress,
  showShopMessage,
  animateIconToTarget,
  updateMemoryAssistInventoryDisplay,
} from "./ui.js";
import { openAppModal } from "./modal.js";
import { createIcon } from "./icons.js";
import { savePersistentGameData } from "./persistence.js";
import { CARD_BACKS, FLIP_EFFECTS } from "./appearance.js";
import { SHOP_ITEMS, getShopItemPrice } from "./shopCatalog.js";
import { getOwnedThemeIds, ownTheme } from "./appearance.js";
import { GAMEPLAY_LIMITS, GAMEPLAY_TIMING } from "./gameplayTuning.js";
import { THEMES, getTheme, isThemePlayable } from "./themeCatalog.js";
import { buyLinkItem, getLinkItemCount, LINK_ITEMS } from "./linkConnect/linkItems.js";
import { LINK_EXIT_EFFECTS, LINK_PATH_EFFECTS } from "./linkConnect/linkEffects.js";
import { stageMemorySession } from "./memorySession.js";
import {
  MEMORY_ITEMS,
  changeMemoryItemCount,
  getMemoryItemCount,
  getMemoryItemId,
} from "./memoryItems.js";
import { revealMemoryTiles } from "./memoryPreview.js";
import { TRIPLE_ITEMS, getTripleItemCount } from "./tripleConnect/tripleItems.js";
import {
  purchaseTripleEffect,
  purchaseTripleItem,
  purchaseTripleTrayExpansion,
  purchaseTripleTheme,
} from "./tripleConnect/tripleTransactions.js";
import { TRIPLE_PRODUCT_DECISIONS } from "./tripleConnect/tripleConfig.js";

export function openQuickAssistOverlay(kind) {
  if (gameState.isLocked || gameState.isPaused) return;
  if (document.querySelector(".tile.selected")) {
    showShopMessage("Hãy hoàn thành lượt chọn hiện tại trước khi dùng vật phẩm.", "info");
    return;
  }

  const roundId = gameState.roundId;
  const isTime = kind === "time";
  const items = MEMORY_ITEMS.filter((item) => item.type === kind);
  if (!items.length) return;
  let pendingPreviewItem = null;

  gameState.isPaused = true;
  const content = document.createElement("div");
  content.className = "quick-assist";
  const choices = document.createElement("div");
  choices.className = "quick-assist__choices";
  content.append(choices);

  const modal = openAppModal({
    id: `quick-${kind}-modal`,
    icon: isTime ? "timer" : "eye",
    title: isTime ? "Kho thời gian" : "Kho xem trước",
    content,
    size: "small",
    onClose: () => {
      if (gameState.roundId !== roundId) return;
      gameState.isPaused = false;

      if (pendingPreviewItem) {
        const item = pendingPreviewItem;
        pendingPreviewItem = null;
        revealMemoryTiles(item.value, GAMEPLAY_TIMING.shopRevealDurationMs, roundId);
      }
    },
  });

  items.forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `quick-assist__choice quick-assist__choice--${item.tier}`;
    const count = getMemoryItemCount(item.id);
    button.disabled = count <= 0;
    const label = document.createElement("strong");
    label.textContent = item.title;
    const quantity = document.createElement("span");
    quantity.textContent = `Đang có: ${count}`;
    button.append(createIcon(item.icon), label, quantity);
    button.addEventListener("click", () => {
      if (!useMemoryAssistItem(item, roundId)) return;
      if (item.type === "preview") pendingPreviewItem = item;
      modal.close();
    });
    choices.append(button);
  });
}

function useMemoryAssistItem(item, roundId) {
  if (gameState.roundId !== roundId || getMemoryItemCount(item.id) <= 0) return false;
  const previousItems = { ...gameState.progress.memoryMatch.items };
  const previousTime = gameState.remainingTime;
  const sessions = (gameState.progress.memoryMatch.sessionsByMode ||= {});
  const mode = gameState.settings.mode;
  const previousSession = sessions[mode] ? { ...sessions[mode] } : null;
  if (!changeMemoryItemCount(item.id, -1)) return false;
  if (item.type === "time") {
    gameState.remainingTime += item.value;
    stageMemorySession();
  }
  if (!savePersistentGameData({ progress: gameState.progress })) {
    gameState.progress.memoryMatch.items = previousItems;
    gameState.remainingTime = previousTime;
    if (previousSession) sessions[mode] = previousSession;
    else delete sessions[mode];
    showShopMessage("Không thể lưu. Vật phẩm chưa được sử dụng.", "error");
    return false;
  }
  updateMemoryAssistInventoryDisplay();
  if (item.type === "time") {
    updateTimerDisplay(gameState.remainingTime);
    syncMemoryTimeProgress({ remainingSeconds: gameState.remainingTime, timeLimit: gameState.timeLimit });
    animateIconToTarget("timer", "#timer");
  }
  return true;
}

export function openShopOverlay({ fromMenu = false, gameId = "memory-match", linkConnect = false, onClose = () => {} } = {}) {
  const tripleConnect = gameId === "triple-connect";
  if (!fromMenu && !linkConnect && !tripleConnect && (gameState.isLocked || gameState.isPaused)) return;

  const roundId = gameState.roundId;
  if (!fromMenu && !linkConnect && !tripleConnect) gameState.isPaused = true;

  const content = document.createElement("div");
  content.className = "shop-content";
  const tabs = document.createElement("div");
  tabs.className = "shop-tabs";
  tabs.setAttribute("role", "tablist");
  const grid = document.createElement("div");
  grid.className = "shop-item-grid";
  content.append(tabs, grid);

  const modal = openAppModal({
    id: "shop-modal",
    icon: "shop",
    title: "Cửa hàng",
    content,
    size: "large",
    onClose: () => {
      if (!fromMenu && !linkConnect && !tripleConnect && gameState.roundId === roundId) gameState.isPaused = false;
      onClose();
    },
  });
  modal.overlay.dataset.fromMenu = String(fromMenu);

  const wallet = document.createElement("div");
  wallet.className = "shop-wallet";
  wallet.setAttribute("aria-label", "Số Xu hiện có");
  const walletValue = document.createElement("span");
  walletValue.id = "coin-balance";
  walletValue.textContent = String(gameState.coins);
  wallet.append(walletValue, createIcon("coin"));
  const closeButton = modal.panel.querySelector(".app-modal__close");
  modal.panel
    .querySelector(".app-modal__header")
    .insertBefore(wallet, closeButton);

  if (gameId === "link-connect") {
    const itemsTab = createTab("Vật phẩm", true, () => renderLinkItems(grid, roundId, modal));
    const pathEffectsTab = createTab("Đường nối", false, () =>
      renderLinkEffectShop(grid, "Hiệu ứng đường nối", "linkPathEffect", "ownedLinkPathEffects", LINK_PATH_EFFECTS, roundId, modal),
    );
    const exitEffectsTab = createTab("Xóa thẻ", false, () =>
      renderLinkEffectShop(grid, "Hiệu ứng xóa thẻ", "linkExitEffect", "ownedLinkExitEffects", LINK_EXIT_EFFECTS, roundId, modal),
    );
    const themesTab = createTab("Chủ đề", false, () => renderThemes(grid, roundId, modal, gameId));
    tabs.append(itemsTab, pathEffectsTab, exitEffectsTab, themesTab);
    renderLinkItems(grid, roundId, modal);
  } else if (tripleConnect) {
    const itemsTab = createTab("Vật phẩm", true, () => renderTripleItems(grid, roundId, modal));
    const pathEffectsTab = createTab("Đường nối", false, () =>
      renderTripleEffectShop(grid, "Hiệu ứng đường nối", "path", "ownedTriplePathEffects", LINK_PATH_EFFECTS, roundId, modal),
    );
    const exitEffectsTab = createTab("Xóa thẻ", false, () =>
      renderTripleEffectShop(grid, "Hiệu ứng xóa thẻ", "exit", "ownedTripleExitEffects", LINK_EXIT_EFFECTS, roundId, modal),
    );
    const themesTab = createTab("Chủ đề", false, () => renderThemes(grid, roundId, modal, gameId));
    tabs.append(itemsTab, pathEffectsTab, exitEffectsTab, themesTab);
    renderTripleItems(grid, roundId, modal);
  } else {
    const itemsTab = createTab("Vật phẩm", true, () => renderMemoryItems(grid, roundId, modal));
    const appearanceTab = createTab("Ngoại hình", false, () =>
      renderAppearance(grid, roundId, modal),
    );
    const flipEffectsTab = createTab("Hiệu ứng lật", false, () =>
      renderFlipEffects(grid, roundId, modal),
    );
    const themesTab = createTab("Chủ đề", false, () =>
      renderThemes(grid, roundId, modal, gameId),
    );
    tabs.append(itemsTab, appearanceTab, flipEffectsTab, themesTab);
    renderMemoryItems(grid, roundId, modal);
  }
}

function renderLinkEffectShop(grid, title, equippedKey, ownedKey, effects, roundId, modal) {
  grid.className = "shop-item-grid shop-item-grid--appearance";
  grid.replaceChildren();
  const group = document.createElement("section");
  group.className = "appearance-group";
  const heading = document.createElement("h3");
  heading.textContent = title;
  const choices = document.createElement("div");
  choices.className = "appearance-choice-grid";
  effects.forEach((item) => {
    const owned = gameState.appearance[ownedKey].includes(item.id);
    const card = document.createElement("article");
    card.className = "appearance-choice";
    const preview = document.createElement("div");
    preview.className = `link-effect-preview ${item.className}`;
    preview.append(createIcon(item.icon));
    const name = document.createElement("strong");
    name.textContent = item.title;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "app-button app-button--purchase shop-buy-button";
    if (owned) {
      button.classList.add("appearance-action--equipped");
      button.textContent = "Đã sở hữu";
      button.disabled = true;
    } else {
      button.append(document.createTextNode(String(item.price)), createIcon("coin"));
      button.onclick = () => openPurchaseConfirmation(
        { ...item, type: "link-effect", equippedKey, ownedKey },
        roundId,
        modal,
        () => renderLinkEffectShop(grid, title, equippedKey, ownedKey, effects, roundId, modal),
      );
    }
    card.append(preview, name, button);
    choices.append(card);
  });
  group.append(heading, choices);
  grid.append(group);
}

function renderMemoryItems(grid, roundId, modal) {
  const items = SHOP_ITEMS;
  renderInventoryItems(grid, roundId, modal, items, "Vật phẩm Memory Match", item => {
    if (item.type === "hint") return gameState.hints;
    const id = item.type === "time"
      ? getMemoryItemId("time", item.value)
      : getMemoryItemId("preview", item.type === "reveal-all" ? "all" : item.value);
    return getMemoryItemCount(id);
  }, () => renderMemoryItems(grid, roundId, modal));
}

function renderLinkItems(grid, roundId, modal) {
  renderInventoryItems(grid, roundId, modal,
    LINK_ITEMS.map(item => ({ ...item, type: "link-item" })),
    "Vật phẩm Link Connect", item => getLinkItemCount(item.id),
    () => renderLinkItems(grid, roundId, modal));
}

function renderTripleItems(grid, roundId, modal) {
  renderInventoryItems(
    grid,
    roundId,
    modal,
    TRIPLE_ITEMS.map((item) => ({ ...item, type: "triple-item" })),
    "Vật phẩm Triple Connect",
    (item) => getTripleItemCount(item.id),
    () => renderTripleItems(grid, roundId, modal),
  );
  const expansion = TRIPLE_PRODUCT_DECISIONS.trayExpansion;
  const group = document.createElement("section");
  group.className = "appearance-group";
  const heading = document.createElement("h3");
  heading.textContent = "Nâng cấp vĩnh viễn";
  const choices = document.createElement("div");
  choices.className = "appearance-choice-grid";
  const card = document.createElement("article");
  card.className = "appearance-choice";
  const preview = document.createElement("div");
  preview.className = "appearance-preview theme-preview";
  preview.append(createIcon("collection"));
  const name = document.createElement("strong");
  name.textContent = "Mở rộng khay";
  const description = document.createElement("small");
  description.textContent = `${expansion.baseCapacity} → ${expansion.baseCapacity + expansion.bonusCapacity} ô · dùng cho mọi chế độ`;
  const button = document.createElement("button");
  button.type = "button";
  button.className = "app-button app-button--purchase shop-buy-button";
  if (gameState.progress.tripleConnect.trayExpansionOwned) {
    button.classList.add("appearance-action--equipped");
    button.textContent = "Đã sở hữu";
    button.disabled = true;
  } else {
    button.append(document.createTextNode(String(expansion.releasePrice)), createIcon("coin"));
    button.onclick = () => openPurchaseConfirmation(
      { id: "tray-expansion", type: "triple-tray-expansion", title: "Mở rộng khay vĩnh viễn", price: expansion.releasePrice },
      roundId,
      modal,
      () => renderTripleItems(grid, roundId, modal),
    );
  }
  card.append(preview, name, description, button);
  choices.append(card);
  group.append(heading, choices);
  grid.append(group);
}

function renderTripleEffectShop(grid, title, kind, ownedKey, effects, roundId, modal) {
  grid.className = "shop-item-grid shop-item-grid--appearance";
  grid.replaceChildren();
  const group = document.createElement("section");
  group.className = "appearance-group";
  const heading = document.createElement("h3");
  heading.textContent = title;
  const choices = document.createElement("div");
  choices.className = "appearance-choice-grid";
  effects.forEach((item) => {
    const owned = gameState.appearance[ownedKey].includes(item.id);
    const card = document.createElement("article");
    card.className = "appearance-choice";
    const preview = document.createElement("div");
    preview.className = `link-effect-preview ${item.className}`;
    preview.append(createIcon(item.icon));
    const name = document.createElement("strong");
    name.textContent = item.title;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "app-button app-button--purchase shop-buy-button";
    if (owned) {
      button.classList.add("appearance-action--equipped");
      button.textContent = "Đã sở hữu";
      button.disabled = true;
    } else {
      button.append(document.createTextNode(String(item.price)), createIcon("coin"));
      button.onclick = () => openPurchaseConfirmation(
        { ...item, type: "triple-effect", effectKind: kind },
        roundId,
        modal,
        () => renderTripleEffectShop(grid, title, kind, ownedKey, effects, roundId, modal),
      );
    }
    card.append(preview, name, button);
    choices.append(card);
  });
  group.append(heading, choices);
  grid.append(group);
}

function renderInventoryItems(grid, roundId, modal, items, title, getCount, refresh) {
  grid.className = "shop-item-grid shop-item-grid--appearance";
  grid.replaceChildren();
  const group = document.createElement("section");
  group.className = "appearance-group";
  const heading = document.createElement("h3");
  heading.textContent = title;
  const choices = document.createElement("div");
  choices.className = "appearance-choice-grid";
  items.forEach((item) => {
    const card = document.createElement("article");
    card.className = "appearance-choice";
    const preview = document.createElement("div");
    preview.className = "appearance-preview theme-preview";
    preview.append(createIcon(item.icon));
    const name = document.createElement("strong");
    name.textContent = item.title;
    const count = document.createElement("small");
    count.textContent = `Đang có: ${getCount(item)}`;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "app-button app-button--purchase shop-buy-button";
    button.append(document.createTextNode(String(item.price)), createIcon("coin"));
    button.onclick = () => openPurchaseConfirmation(
      { ...item, price: getShopItemPrice(item) },
      roundId,
      modal,
      refresh,
    );
    card.append(preview, name, count, button);
    choices.append(card);
  });
  group.append(heading, choices);
  grid.append(group);
}

function createTab(label, selected, onSelect) {
  const tab = document.createElement("button");
  tab.type = "button";
  tab.className = "shop-tab";
  tab.textContent = label;
  tab.setAttribute("role", "tab");
  tab.setAttribute("aria-selected", String(selected));
  tab.onclick = () => {
    tab.parentElement.querySelectorAll(".shop-tab").forEach((button) => {
      button.classList.toggle("is-active", button === tab);
      button.setAttribute("aria-selected", String(button === tab));
    });
    onSelect();
  };
  if (selected) tab.classList.add("is-active");
  return tab;
}

function renderAppearance(grid, roundId, modal) {
  grid.className = "shop-item-grid shop-item-grid--appearance";
  grid.replaceChildren();
  renderAppearanceGroup(
    grid,
    "Mặt lưng thẻ",
    "cardBack",
    CARD_BACKS,
    roundId,
    modal,
  );
}

function renderFlipEffects(grid, roundId, modal) {
  grid.className = "shop-item-grid shop-item-grid--appearance";
  grid.replaceChildren();
  renderAppearanceGroup(
    grid,
    "Hiệu ứng lật",
    "flipEffect",
    FLIP_EFFECTS,
    roundId,
    modal,
  );
}

function renderThemes(grid, roundId, modal, gameId) {
  grid.className = "shop-item-grid shop-item-grid--themes";
  grid.replaceChildren();
  const group = document.createElement("section");
  group.className = "appearance-group theme-group";
  const heading = document.createElement("h3");
  heading.textContent = "Chủ đề thẻ";
  const choices = document.createElement("div");
  choices.className = "theme-choice-grid";

  THEMES.forEach((theme) => {
    const owned = getOwnedThemeIds(gameState.appearance, gameId).includes(theme.id);
    const playable = isThemePlayable(theme);
    const card = document.createElement("article");
    card.className = "theme-choice";
    const preview = document.createElement("div");
    preview.className = "appearance-preview theme-preview";
    preview.append(createIcon(theme.icon));
    const name = document.createElement("strong");
    name.textContent = theme.title;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "app-button app-button--purchase shop-buy-button";

    if (owned) {
      button.classList.add("appearance-action--equipped");
      button.textContent = "Đã sở hữu";
      button.disabled = true;
    } else if (theme.comingSoon) {
      button.textContent = "Sắp có";
      button.disabled = true;
    } else if (!playable) {
      button.textContent = "Chờ ảnh";
      button.disabled = true;
    } else {
      button.append(document.createTextNode(String(theme.price)), createIcon("coin"));
      button.onclick = () =>
        openPurchaseConfirmation(
          { ...theme, type: gameId === "triple-connect" ? "triple-theme" : "theme", gameId },
          roundId,
          modal,
          () => renderThemes(grid, roundId, modal, gameId),
        );
    }
    card.append(preview, name, button);
    choices.append(card);
  });
  group.append(heading, choices);
  grid.append(group);
}

function renderAppearanceGroup(grid, title, type, items, roundId, modal) {
  const group = document.createElement("section");
  group.className = "appearance-group";
  const heading = document.createElement("h3");
  heading.textContent = title;
  const choices = document.createElement("div");
  choices.className = "appearance-choice-grid";

  items.forEach((item) => {
    const ownedKey =
      type === "cardBack" ? "ownedCardBacks" : "ownedFlipEffects";
    const owned = gameState.appearance[ownedKey].includes(item.id);
    const card = document.createElement("article");
    card.className = "appearance-choice";
    if (type === "cardBack") {
      const preview = document.createElement("div");
      preview.className = `appearance-preview ${item.previewClass}`;
      preview.setAttribute("aria-hidden", "true");
      card.append(preview);
    } else {
      const preview = document.createElement("div");
      preview.className = "appearance-effect-preview";
      preview.textContent = "A";
      preview.classList.add(item.animationClass);
      card.append(preview);
    }
    const name = document.createElement("strong");
    name.textContent = item.title;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "app-button app-button--purchase shop-buy-button";
    if (owned) {
      button.classList.add("appearance-action--equipped");
      button.textContent = "Đã sở hữu";
      button.disabled = true;
    } else {
      button.append(
        document.createTextNode(String(item.price)),
        createIcon("coin"),
      );
      button.onclick = () =>
        openPurchaseConfirmation(
          { ...item, type: "appearance", appearanceType: type },
          roundId,
          modal,
          () => renderAppearance(grid, roundId, modal),
        );
    }
    card.append(name, button);
    choices.append(card);
  });
  group.append(heading, choices);
  grid.append(group);
}

function openPurchaseConfirmation(item, roundId, shopModal, onPurchase) {
  let isSubmitting = false;
  const content = document.createElement("div");
  content.className = "shop-confirmation";

  const message = document.createElement("p");
  message.textContent =
    item.type === "appearance" || item.type === "theme"
      ? item.type === "theme" && !isThemePlayable(item)
        ? `Mua trước ${item.title}? Chủ đề sẽ mở khi đủ ảnh.`
        : `Mua ${item.title}?`
      : `Mua ${item.title}?`;

  const price = document.createElement("strong");
  price.className = "shop-confirmation__price";
  price.append(document.createTextNode(String(item.price)), createIcon("coin"));
  content.append(message, price);

  openAppModal({
    id: "shop-confirm-modal",
    icon: "shop",
    title: "Xác nhận mua",
    content,
    size: "small",
    actions: [
      { label: "Hủy", variant: "secondary" },
      {
        label: "Mua ngay",
        icon: "coin",
        variant: "primary",
        onClick: (closeConfirmation) => {
          if (isSubmitting) return true;
          isSubmitting = true;
          if (!handleBuyItem(item, roundId, shopModal.overlay.dataset.fromMenu === "true")) {
            isSubmitting = false;
            return true;
          }
          closeConfirmation();
          onPurchase?.();
          return true;
        },
      },
    ],
  });
}

// Mua vật phẩm
function handleBuyItem(item, roundId, fromMenu = false) {
  const tripleType = item.type === "triple-item" || item.type === "triple-theme" || item.type === "triple-effect" || item.type === "triple-tray-expansion";
  if (item.type !== "link-item" && !tripleType && (gameState.roundId !== roundId || (!fromMenu && gameState.isLocked))) return false;

  if (item.type === "triple-item") {
    if (!purchaseTripleItem(item.id)) {
      showShopMessage(gameState.coins < item.price ? "Bạn không đủ Xu để mua vật phẩm này." : "Không thể mua vật phẩm này.", gameState.coins < item.price ? "error" : "info");
      return false;
    }
    updateCoinDisplay(gameState.coins);
    showShopMessage(`Đã mua ${item.title}`);
    return true;
  }
  if (item.type === "triple-theme") {
    if (!purchaseTripleTheme(item.id, item.price)) {
      showShopMessage("Không thể mua chủ đề này.", "error");
      return false;
    }
    updateCoinDisplay(gameState.coins);
    showShopMessage(`Đã mua chủ đề ${item.title}`);
    return true;
  }
  if (item.type === "triple-effect") {
    if (!purchaseTripleEffect(item.effectKind, item.id, item.price)) {
      showShopMessage("Không thể mua hiệu ứng này.", "error");
      return false;
    }
    updateCoinDisplay(gameState.coins);
    showShopMessage(`Đã mua ${item.title}`);
    return true;
  }
  if (item.type === "triple-tray-expansion") {
    if (!purchaseTripleTrayExpansion()) {
      showShopMessage(gameState.progress.tripleConnect.trayExpansionOwned ? "Bạn đã sở hữu nâng cấp này." : "Không thể lưu giao dịch. Xu và nâng cấp chưa thay đổi.", "error");
      return false;
    }
    updateCoinDisplay(gameState.coins);
    showShopMessage("Khay đã mở rộng lên 10 ô cho mọi chế độ Triple Connect.");
    return true;
  }

  if (item.type === "appearance" || item.type === "link-effect") {
    const ownedKey =
      item.type === "link-effect" ? item.ownedKey : item.appearanceType === "cardBack"
        ? "ownedCardBacks"
        : "ownedFlipEffects";
    if (gameState.appearance[ownedKey].includes(item.id)) {
      showShopMessage("Bạn đã sở hữu vật phẩm này.", "info");
      return false;
    }
  }
  if (item.type === "theme" && getOwnedThemeIds(gameState.appearance, item.gameId).includes(item.id)) {
    showShopMessage("Bạn đã sở hữu chủ đề này.", "info");
    return false;
  }

  if (item.type === "link-item" && getLinkItemCount(item.id) >= GAMEPLAY_LIMITS.itemCount) {
    showShopMessage(`Bạn đã đạt giới hạn ${GAMEPLAY_LIMITS.itemCount} vật phẩm này.`, "info");
    return false;
  }
  if (item.type === "hint" && gameState.hints >= GAMEPLAY_LIMITS.itemCount) {
    showShopMessage(`Bạn đã đạt giới hạn ${GAMEPLAY_LIMITS.itemCount} lượt gợi ý.`, "info");
    return false;
  }

  if (gameState.coins < item.price) {
    showShopMessage("Bạn không đủ Xu để mua vật phẩm này.", "error");
    return false;
  }

  if (item.type === "link-item") {
    if (!buyLinkItem(item.id)) {
      showShopMessage("Không thể lưu giao dịch. Xu và vật phẩm chưa thay đổi.", "error");
      return false;
    }
    updateCoinDisplay(gameState.coins);
    showShopMessage(`Đã mua ${item.title}`);
    return true;
  }

  const previousCoins = gameState.coins;
  if (!spendCoins(item.price)) {
    showShopMessage("Bạn không đủ Xu để mua vật phẩm này.", "error");
    return false;
  }

  if (item.type === "appearance" || item.type === "link-effect") {
    const ownedKey =
      item.type === "link-effect" ? item.ownedKey : item.appearanceType === "cardBack"
        ? "ownedCardBacks"
        : "ownedFlipEffects";
    if (!gameState.appearance[ownedKey].includes(item.id))
      gameState.appearance[ownedKey].push(item.id);
    if (!savePersistentGameData({ coins: gameState.coins, appearance: gameState.appearance })) {
      gameState.coins = previousCoins;
      gameState.appearance[ownedKey] = gameState.appearance[ownedKey].filter((id) => id !== item.id);
      showShopMessage("Không thể lưu giao dịch. Xu và vật phẩm chưa thay đổi.", "error");
      return false;
    }
    updateCoinDisplay(gameState.coins);
    showShopMessage(`Đã mua ${item.title}`);
    return true;
  }

  if (item.type === "theme") {
    ownTheme(gameState.appearance, item.gameId, item.id);
    const theme = getTheme(item.id);
    if (!savePersistentGameData({ coins: gameState.coins, appearance: gameState.appearance })) {
      gameState.coins = previousCoins;
      gameState.appearance.ownedThemes = getOwnedThemeIds(gameState.appearance, item.gameId)
        .filter((id) => id !== item.id);
      showShopMessage("Không thể lưu giao dịch. Xu và chủ đề chưa thay đổi.", "error");
      return false;
    }
    updateCoinDisplay(gameState.coins);
    showShopMessage(
      isThemePlayable(theme)
        ? `Đã mua chủ đề ${item.title}`
        : `Đã mua trước ${item.title}. Chủ đề sẽ mở khi đủ ảnh.`,
    );
    return true;
  }

  if (item.type === "time" || item.type === "reveal-random" || item.type === "reveal-all") {
    const memoryItemId = item.type === "time"
      ? getMemoryItemId("time", item.value)
      : getMemoryItemId("preview", item.type === "reveal-all" ? "all" : item.value);
    const previousItems = { ...gameState.progress.memoryMatch.items };
    if (!changeMemoryItemCount(memoryItemId, 1)) {
      gameState.coins = previousCoins;
      showShopMessage("Kho vật phẩm này đã đầy.", "info");
      return false;
    }
    if (!savePersistentGameData({ coins: gameState.coins, progress: gameState.progress })) {
      gameState.coins = previousCoins;
      gameState.progress.memoryMatch.items = previousItems;
      showShopMessage("Không thể lưu giao dịch. Xu và vật phẩm chưa thay đổi.", "error");
      return false;
    }
    updateCoinDisplay(gameState.coins);
    updateMemoryAssistInventoryDisplay();
    showShopMessage(`Đã thêm ${item.title} vào kho`);
    return true;
  }

  if (item.type === "hint") {
    const previousHints = gameState.hints;
    gameState.hints = Math.min(GAMEPLAY_LIMITS.itemCount, gameState.hints + item.value);
    if (!savePersistentGameData({ coins: gameState.coins, progress: gameState.progress })) {
      gameState.coins = previousCoins;
      gameState.hints = previousHints;
      showShopMessage("Không thể lưu giao dịch. Xu và hỗ trợ chưa thay đổi.", "error");
      return false;
    }
    updateCoinDisplay(gameState.coins);
    const grantedHints = gameState.hints - previousHints;
    updateHintDisplay(gameState.hints);
    if (!fromMenu) animateIconToTarget("search", "#hint");
    showShopMessage(`Đã mua +${grantedHints} gợi ý`);
    return true;
  }

  return true;
}
