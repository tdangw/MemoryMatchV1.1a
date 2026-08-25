import { gameState, increaseCoins, spendCoins } from "./gameState.js";
import {
  updateCoinDisplay,
  updateHintDisplay,
  updateTimerDisplay,
  showShopMessage,
  animateIconToTarget,
  showRevealTimerInHud,
} from "./ui.js";
import { openAppModal } from "./modal.js";
import { createIcon } from "./icons.js";
import { shuffleArray } from "./utils.js";
import { saveAppearance, saveCoins } from "./persistence.js";
import { CARD_BACKS, FLIP_EFFECTS, getCardBackClass } from "./appearance.js";
import { SHOP_ITEMS, getShopItemPrice } from "./shopCatalog.js";
import { GAMEPLAY_TIMING } from "./gameplayTuning.js";

export function openShopOverlay() {
  if (gameState.isLocked || gameState.isPaused) return;

  const roundId = gameState.roundId;
  gameState.isPaused = true;

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
      if (gameState.roundId === roundId) gameState.isPaused = false;
    },
  });

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

  const refreshConsumables = () =>
    renderConsumables(grid, roundId, modal, refreshConsumables);
  const consumableTab = createTab("Vật phẩm", true, refreshConsumables);
  const appearanceTab = createTab("Ngoại hình", false, () =>
    renderAppearance(grid, roundId, modal),
  );
  tabs.append(consumableTab, appearanceTab);
  renderConsumables(grid, roundId, modal, refreshConsumables);
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

function renderConsumables(grid, roundId, modal, refresh) {
  grid.className = "shop-item-grid shop-item-grid--consumables";
  grid.replaceChildren();
  SHOP_ITEMS.forEach((item) => {
    const price = getShopItemPrice(item, {
      unmatchedTileCount: document.querySelectorAll(".tile:not(.matched)")
        .length,
    });
    const card = document.createElement("div");
    card.className = "shop-item";

    const title = document.createElement("div");
    title.className = "shop-item-title";
    title.append(createIcon(item.icon), document.createTextNode(item.title));

    const button = document.createElement("button");
    button.className = "app-button app-button--purchase shop-buy-button";
    button.append(document.createTextNode(String(price)), createIcon("coin"));
    button.onclick = () =>
      openPurchaseConfirmation({ ...item, price }, roundId, modal);

    card.appendChild(title);
    card.appendChild(button);
    grid.append(card);
  });
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
  renderAppearanceGroup(
    grid,
    "Hiệu ứng lật",
    "flipEffect",
    FLIP_EFFECTS,
    roundId,
    modal,
  );
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
    const equipped = gameState.appearance[type] === item.id;
    const card = document.createElement("article");
    card.className = `appearance-choice${equipped ? " is-equipped" : ""}`;
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
    if (equipped) {
      button.classList.add("appearance-action--equipped");
      button.textContent = "Đang dùng";
      button.disabled = true;
    } else if (owned) {
      button.classList.add("appearance-action--equip");
      button.textContent = "Trang bị";
      button.onclick = () =>
        equipAppearance(type, item.id, roundId, grid, modal);
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
        );
    }
    card.append(name, button);
    choices.append(card);
  });
  group.append(heading, choices);
  grid.append(group);
}

function openPurchaseConfirmation(item, roundId, shopModal) {
  let isSubmitting = false;
  const content = document.createElement("div");
  content.className = "shop-confirmation";

  const message = document.createElement("p");
  message.textContent =
    item.type === "appearance"
      ? `Mua và trang bị ${item.title}?`
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
          if (!handleBuyItem(item, roundId)) {
            isSubmitting = false;
            return true;
          }
          closeConfirmation();
          shopModal.close();
          return true;
        },
      },
    ],
  });
}

// Mua vật phẩm
function handleBuyItem(item, roundId) {
  if (gameState.roundId !== roundId || gameState.isLocked) return false;

  if (item.type === "appearance") {
    const ownedKey =
      item.appearanceType === "cardBack"
        ? "ownedCardBacks"
        : "ownedFlipEffects";
    if (gameState.appearance[ownedKey].includes(item.id)) {
      showShopMessage("Bạn đã sở hữu vật phẩm này.", "info");
      return false;
    }
  }

  if (!spendCoins(item.price)) {
    showShopMessage("Bạn không đủ Xu để mua vật phẩm này.", "error");
    return false;
  }

  saveCoins(gameState.coins);
  updateCoinDisplay(gameState.coins);

  if (item.type === "appearance") {
    const ownedKey =
      item.appearanceType === "cardBack"
        ? "ownedCardBacks"
        : "ownedFlipEffects";
    if (!gameState.appearance[ownedKey].includes(item.id))
      gameState.appearance[ownedKey].push(item.id);
    gameState.appearance[item.appearanceType] = item.id;
    saveAppearance(gameState.appearance);
    if (item.appearanceType === "cardBack") applyEquippedCardBack();
    showShopMessage(`Đã trang bị ${item.title}`);
    return true;
  }

  switch (item.type) {
    case "time":
      gameState.remainingTime += item.value;
      updateTimerDisplay(gameState.remainingTime);
      animateIconToTarget("timer", "#timer");
      showShopMessage(`+${item.value}s thời gian`);
      break;
    case "hint":
      gameState.hints += item.value;
      updateHintDisplay(gameState.hints);
      animateIconToTarget("search", "#hint");
      showShopMessage(`+${item.value} gợi ý`);
      break;
    case "reveal-random":
      revealRandomTiles(
        item.value,
        GAMEPLAY_TIMING.shopRevealDurationMs,
        roundId,
      );
      showShopMessage(`Đang xem trước ${item.value} thẻ`);
      break;
    case "reveal-all":
      revealAllTiles(GAMEPLAY_TIMING.shopRevealDurationMs, roundId);
      showShopMessage("Đang xem trước tất cả thẻ");
      break;
  }

  return true;
}

function equipAppearance(type, id, roundId, grid, modal) {
  if (gameState.roundId !== roundId) return;
  gameState.appearance[type] = id;
  saveAppearance(gameState.appearance);
  if (type === "cardBack") applyEquippedCardBack();
  const item = (type === "cardBack" ? CARD_BACKS : FLIP_EFFECTS).find(
    (entry) => entry.id === id,
  );
  showShopMessage(`Đã trang bị ${item?.title || "ngoại hình"}`);
  renderAppearance(grid, roundId, modal);
}

function applyEquippedCardBack() {
  const backClasses = CARD_BACKS.map((item) => item.previewClass);
  const equippedClass = getCardBackClass(gameState.appearance.cardBack);
  document.querySelectorAll(".tile").forEach((tile) => {
    tile.classList.remove(...backClasses);
    tile.classList.add(equippedClass);
  });
}

// Hỗ trợ hiệu ứng
function revealRandomTiles(
  count,
  duration = GAMEPLAY_TIMING.shopRevealDurationMs,
  roundId = gameState.roundId,
) {
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
  }, duration);
}

function revealAllTiles(
  duration = GAMEPLAY_TIMING.shopRevealDurationMs,
  roundId = gameState.roundId,
) {
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
  }, duration);
}
