import { gameState, spendCoins } from "./gameState.js";
import {
  updateCoinDisplay,
  updateHintDisplay,
  updateTimerDisplay,
  syncMemoryTimeProgress,
  showShopMessage,
  animateIconToTarget,
  showRevealTimerInHud,
} from "./ui.js";
import { openAppModal } from "./modal.js";
import { createIcon } from "./icons.js";
import { shuffleArray } from "./utils.js";
import { saveCoins, savePersistentGameData } from "./persistence.js";
import { CARD_BACKS, FLIP_EFFECTS } from "./appearance.js";
import { SHOP_ITEMS, getShopItemPrice } from "./shopCatalog.js";
import { getOwnedThemeIds, ownTheme } from "./appearance.js";
import { GAMEPLAY_LIMITS, GAMEPLAY_TIMING } from "./gameplayTuning.js";
import { THEMES, getTheme, isThemePlayable } from "./themeCatalog.js";
import { buyLinkItem, getLinkItemCount, LINK_ITEMS } from "./linkConnect/linkItems.js";
import { LINK_EXIT_EFFECTS, LINK_PATH_EFFECTS } from "./linkConnect/linkEffects.js";
import { stageActiveSession } from "./sessionProgress.js";

export function openQuickAssistOverlay(kind) {
  if (gameState.isLocked || gameState.isPaused) return;

  const roundId = gameState.roundId;
  const isTime = kind === "time";
  const items = SHOP_ITEMS.filter((item) =>
    kind === "time"
      ? item.type === "time" || item.type === "hint"
      : item.type.startsWith("reveal-"),
  ).map((item) => ({
    ...item,
    price: getShopItemPrice(item, {
      unmatchedTileCount: document.querySelectorAll(".tile:not(.matched)").length,
    }),
  }));
  if (!items.length) return;

  gameState.isPaused = true;
  const content = document.createElement("div");
  content.className = "quick-assist";
  const choices = document.createElement("div");
  choices.className = "quick-assist__choices";
  content.append(choices);

  const modal = openAppModal({
    id: `quick-${kind}-modal`,
    icon: isTime ? "timer" : "eye",
    title: isTime ? "Mua thời gian" : "Xem trước thẻ",
    content,
    size: "small",
    onClose: () => {
      if (gameState.roundId === roundId) gameState.isPaused = false;
    },
  });

  const wallet = document.createElement("div");
  wallet.className = "shop-wallet quick-assist-wallet";
  wallet.setAttribute("aria-label", "Số Xu hiện có");
  wallet.append(document.createTextNode(String(gameState.coins)), createIcon("coin"));
  const closeButton = modal.panel.querySelector(".app-modal__close");
  modal.panel
    .querySelector(".app-modal__header")
    .insertBefore(wallet, closeButton);

  items.forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "quick-assist__choice";
    const label = document.createElement("strong");
    label.textContent = item.type === "time" ? `+${item.value} giây` : item.title;
    const price = document.createElement("span");
    price.append(document.createTextNode(`${item.price} `), createIcon("coin"));
    button.append(createIcon(item.icon), label, price);
    button.addEventListener("click", () => {
      if (!handleBuyItem(item, roundId)) return;
      modal.close();
    });
    choices.append(button);
  });
}

export function openShopOverlay({ fromMenu = false, gameId = "memory-match", linkConnect = false, onClose = () => {} } = {}) {
  if (!fromMenu && !linkConnect && (gameState.isLocked || gameState.isPaused)) return;

  const roundId = gameState.roundId;
  if (!fromMenu && !linkConnect) gameState.isPaused = true;

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
      if (!fromMenu && !linkConnect && gameState.roundId === roundId) gameState.isPaused = false;
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
  } else {
    const appearanceTab = createTab("Ngoại hình", true, () =>
      renderAppearance(grid, roundId, modal),
    );
    const flipEffectsTab = createTab("Hiệu ứng lật", false, () =>
      renderFlipEffects(grid, roundId, modal),
    );
    const themesTab = createTab("Chủ đề", false, () =>
      renderThemes(grid, roundId, modal, gameId),
    );
    tabs.append(appearanceTab, flipEffectsTab, themesTab);
    renderAppearance(grid, roundId, modal);
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

function renderLinkItems(grid, roundId, modal) {
  grid.className = "shop-item-grid shop-item-grid--appearance";
  grid.replaceChildren();
  const group = document.createElement("section");
  group.className = "appearance-group";
  const heading = document.createElement("h3");
  heading.textContent = "Vật phẩm Link Connect";
  const choices = document.createElement("div");
  choices.className = "appearance-choice-grid";
  LINK_ITEMS.forEach((item) => {
    const card = document.createElement("article");
    card.className = "appearance-choice";
    const preview = document.createElement("div");
    preview.className = "appearance-preview theme-preview";
    preview.append(createIcon(item.icon));
    const name = document.createElement("strong");
    name.textContent = item.title;
    const count = document.createElement("small");
    count.textContent = `Đang có: ${getLinkItemCount(item.id)}`;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "app-button app-button--purchase shop-buy-button";
    button.append(document.createTextNode(String(item.price)), createIcon("coin"));
    button.onclick = () => openPurchaseConfirmation(
      { ...item, type: "link-item" },
      roundId,
      modal,
      () => renderLinkItems(grid, roundId, modal),
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
          { ...theme, type: "theme", gameId },
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
  if (item.type !== "link-item" && (gameState.roundId !== roundId || (!fromMenu && gameState.isLocked))) return false;

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

  if (item.type === "time" || item.type === "hint") {
    const previousRemainingTime = gameState.remainingTime;
    const previousHints = gameState.hints;
    const sessions = (gameState.progress.memoryMatch.sessionsByMode ||= {});
    const mode = gameState.settings.mode;
    const previousSession = sessions[mode] ? { ...sessions[mode] } : null;
    if (item.type === "time") gameState.remainingTime += item.value;
    else gameState.hints = Math.min(GAMEPLAY_LIMITS.itemCount, gameState.hints + item.value);
    stageActiveSession("memory-match", {
      ...(previousSession || {}),
      mode,
      level: gameState.currentLevel,
      remainingTime: gameState.remainingTime,
      timeLimit: gameState.timeLimit,
      levelStartTime: gameState.levelStartTime,
      hints: gameState.hints,
    });
    if (!savePersistentGameData({ coins: gameState.coins, progress: gameState.progress })) {
      gameState.coins = previousCoins;
      gameState.remainingTime = previousRemainingTime;
      gameState.hints = previousHints;
      if (previousSession) sessions[mode] = previousSession;
      else delete sessions[mode];
      showShopMessage("Không thể lưu giao dịch. Xu và hỗ trợ chưa thay đổi.", "error");
      return false;
    }
    updateCoinDisplay(gameState.coins);
    if (item.type === "time") {
      updateTimerDisplay(gameState.remainingTime);
      syncMemoryTimeProgress({ remainingSeconds: gameState.remainingTime, timeLimit: gameState.timeLimit });
      animateIconToTarget("timer", "#timer");
      showShopMessage(`Đã mua +${item.value}s thời gian`);
    } else {
      const grantedHints = gameState.hints - previousHints;
      updateHintDisplay(gameState.hints);
      animateIconToTarget("search", "#hint");
      showShopMessage(`Đã mua +${grantedHints} gợi ý`);
    }
    return true;
  }

  if (!saveCoins(gameState.coins)) {
    gameState.coins = previousCoins;
    showShopMessage("Không thể lưu giao dịch. Xu chưa bị trừ.", "error");
    return false;
  }
  updateCoinDisplay(gameState.coins);

  switch (item.type) {
    case "reveal-random":
      revealRandomTiles(
        item.value,
        GAMEPLAY_TIMING.shopRevealDurationMs,
        roundId,
      );
      showShopMessage(`Đã mua xem trước ${item.value} thẻ`);
      break;
    case "reveal-all":
      revealAllTiles(GAMEPLAY_TIMING.shopRevealDurationMs, roundId);
      showShopMessage("Đã mua xem trước tất cả thẻ");
      break;
  }

  return true;
}

// Hỗ trợ hiệu ứng
function revealRandomTiles(
  count,
  duration = GAMEPLAY_TIMING.shopRevealDurationMs,
  roundId = gameState.roundId,
) {
  const grid = document.getElementById("grid-container");
  gameState.isLocked = true;
  grid?.classList.add("is-locked");
  const tiles = Array.from(
    document.querySelectorAll(".tile:not(.matched) img.hidden"),
  );
  shuffleArray(tiles);
  const selected = tiles.slice(0, count);

  selected.forEach((img) => {
    img.classList.remove("hidden");
    img.classList.add("highlight-tile");
  });
  showRevealTimerInHud(duration / 1000, roundId);

  setTimeout(() => {
    if (gameState.roundId !== roundId) return;

    selected.forEach((img) => {
      img.classList.add("hidden");
      img.classList.remove("highlight-tile");
    });
    gameState.isLocked = false;
    grid?.classList.remove("is-locked");
  }, duration);
}

function revealAllTiles(
  duration = GAMEPLAY_TIMING.shopRevealDurationMs,
  roundId = gameState.roundId,
) {
  const grid = document.getElementById("grid-container");
  gameState.isLocked = true;
  grid?.classList.add("is-locked");
  const tiles = document.querySelectorAll(".tile:not(.matched) img.hidden");

  tiles.forEach((img) => {
    img.classList.remove("hidden");
    img.classList.add("highlight-tile");
  });
  showRevealTimerInHud(duration / 1000, roundId);

  setTimeout(() => {
    if (gameState.roundId !== roundId) return;

    tiles.forEach((img) => {
      img.classList.add("hidden");
      img.classList.remove("highlight-tile");
    });
    gameState.isLocked = false;
    grid?.classList.remove("is-locked");
  }, duration);
}
