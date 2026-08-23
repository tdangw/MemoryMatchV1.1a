import { gameState, spendCoins } from "./gameState.js";
import {
  updateCoinDisplay,
  updateHintDisplay,
  updateTimerDisplay,
  showShopMessage,
  animateIconToTarget,
} from "./ui.js";
import { showRevealTimerNextToHint } from "./ui.js";
import { openAppModal } from "./modal.js";
import { createIcon } from "./icons.js";
import { shuffleArray } from "./utils.js";
import { saveCoins } from "./persistence.js";

// Danh sách vật phẩm
const shopData = [
  {
    id: "time-10",
    icon: "timer",
    title: "10 giây",
    price: 25,
    type: "time",
    value: 10,
  },
  {
    id: "time-30",
    icon: "timer",
    title: "30 giây",
    price: 70,
    type: "time",
    value: 30,
  },
  {
    id: "time-45",
    icon: "timer",
    title: "45 giây",
    price: 110,
    type: "time",
    value: 45,
  },
  {
    id: "time-60",
    icon: "timer",
    title: "60 giây",
    price: 150,
    type: "time",
    value: 60,
  },
  {
    id: "hint-1",
    icon: "search",
    title: "1 lượt gợi ý",
    price: 35,
    type: "hint",
    value: 1,
  },
  {
    id: "hint-2",
    icon: "search",
    title: "2 lượt gợi ý",
    price: 65,
    type: "hint",
    value: 2,
  },
  {
    id: "hint-3",
    icon: "search",
    title: "3 lượt gợi ý",
    price: 90,
    type: "hint",
    value: 3,
  },
  {
    id: "reveal-4",
    icon: "puzzle",
    title: "Xem trước 4 thẻ",
    price: 60,
    type: "reveal-random",
    value: 4,
  },
  {
    id: "reveal-8",
    icon: "puzzle",
    title: "Xem trước 8 thẻ",
    price: 110,
    type: "reveal-random",
    value: 8,
  },
  {
    id: "reveal-all",
    icon: "puzzle",
    title: "Xem trước tất cả thẻ",
    price: 250,
    type: "reveal-all",
  },
];

export function openShopOverlay() {
  if (gameState.isLocked || gameState.isPaused) return;

  const roundId = gameState.roundId;
  gameState.isPaused = true;

  const grid = document.createElement("div");
  grid.className = "shop-item-grid";

  const modal = openAppModal({
    id: "shop-modal",
    icon: "shop",
    title: "Cửa hàng",
    content: grid,
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
  wallet.append(createIcon("coin"), walletValue);
  const closeButton = modal.panel.querySelector(".app-modal__close");
  modal.panel
    .querySelector(".app-modal__header")
    .insertBefore(wallet, closeButton);

  shopData.forEach((item) => {
    const card = document.createElement("div");
    card.className = "shop-item";

    const title = document.createElement("div");
    title.className = "shop-item-title";
    title.append(createIcon(item.icon), document.createTextNode(item.title));

    const button = document.createElement("button");
    button.className = "app-button app-button--purchase shop-buy-button";
    button.append(
      document.createTextNode(String(item.price)),
      createIcon("coin"),
    );
    button.onclick = () => openPurchaseConfirmation(item, roundId, modal);

    card.appendChild(title);
    card.appendChild(button);
    grid.appendChild(card);
  });
}

function openPurchaseConfirmation(item, roundId, shopModal) {
  const content = document.createElement("div");
  content.className = "shop-confirmation";

  const message = document.createElement("p");
  message.textContent = `Mua ${item.title}?`;

  const price = document.createElement("strong");
  price.className = "shop-confirmation__price";
  price.append(createIcon("coin"), document.createTextNode(`${item.price} Xu`));
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
          if (!handleBuyItem(item, roundId)) return true;
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

  if (!spendCoins(item.price)) {
    showShopMessage("Bạn không đủ Xu để mua vật phẩm này.", "error");
    return false;
  }

  saveCoins(gameState.coins);
  updateCoinDisplay(gameState.coins);

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
      revealRandomTiles(item.value, 5000, roundId);
      showShopMessage(`Đang xem trước ${item.value} thẻ`);
      break;
    case "reveal-all":
      revealAllTiles(5000, roundId);
      showShopMessage("Đang xem trước tất cả thẻ");
      break;
  }

  return true;
}

// Hỗ trợ hiệu ứng
function revealRandomTiles(
  count,
  duration = 5000,
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
  showRevealTimerNextToHint(duration / 1000);

  setTimeout(() => {
    if (gameState.roundId !== roundId) return;

    selected.forEach((img) => {
      img.classList.add("hidden");
      img.classList.remove("highlight-tile");
    });
  }, duration);
}

function revealAllTiles(duration = 5000, roundId = gameState.roundId) {
  const tiles = document.querySelectorAll(".tile:not(.matched) img.hidden");

  tiles.forEach((img) => {
    img.classList.remove("hidden");
    img.classList.add("highlight-tile");
  });
  showRevealTimerNextToHint(duration / 1000);

  setTimeout(() => {
    if (gameState.roundId !== roundId) return;

    tiles.forEach((img) => {
      img.classList.add("hidden");
      img.classList.remove("highlight-tile");
    });
  }, duration);
}
