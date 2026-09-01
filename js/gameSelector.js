import { createIcon } from "./icons.js";
import { createMainMenu, showGameInfoModal } from "./mainmenu.js";
import { showSettingsPanel } from "./settings.js";

let activeGameId = null;

export function showGameSelector() {
  activeGameId = null;
  document.documentElement.dataset.activeGame = "selector";
  document.getElementById("menu-container")?.remove();
  document.getElementById("game-container")?.style.setProperty("display", "none");

  const overlay = createMenuOverlay("game-selector");
  const wrapper = createMenuWrapper("Chọn trò chơi", "Chọn cách bạn muốn rèn luyện hôm nay.");
  const choices = document.createElement("div");
  choices.className = "game-selector__choices";
  choices.append(
    createGameChoice({
      icon: "images",
      title: "Memory Match",
      description: "Ghi nhớ và tìm các cặp hình giống nhau khi lật thẻ.",
      onClick: () => openGameMenu("memory-match"),
    }),
    createGameChoice({
      icon: "puzzle",
      title: "Link Connect",
      description: "Quan sát và nối cặp hình giống nhau không có vật cản.",
      onClick: () => openGameMenu("link-connect"),
    }),
  );
  wrapper.append(choices);
  overlay.append(wrapper);
  document.body.append(overlay);
}

export function openGameMenu(gameId) {
  activeGameId = gameId;
  document.documentElement.dataset.activeGame = gameId;
  document.getElementById("menu-container")?.remove();

  if (gameId === "memory-match") {
    createMainMenu();
    return;
  }
  createLinkConnectMenu();
}

export function createActiveGameMenu() {
  if (!activeGameId) {
    showGameSelector();
    return;
  }
  openGameMenu(activeGameId);
}

function createLinkConnectMenu() {
  const overlay = createMenuOverlay("link-connect-menu");
  const wrapper = createMenuWrapper(
    "Link Connect",
    "Quan sát và nối cặp hình giống nhau không có vật cản.",
  );
  const menuList = document.createElement("ul");
  menuList.className = "menu-list";
  menuList.append(
    createMenuItem({
      icon: "play",
      text: "Bắt đầu",
      detail: "Sẵn sàng ở Phase 2",
      disabled: true,
    }),
    createMenuItem({
      icon: "settings",
      text: "Cài đặt",
      onClick: () => showSettingsPanel(),
    }),
    createMenuItem({
      icon: "book",
      text: "Hướng dẫn",
      onClick: () => showGameInfoModal(
        "Cách chơi Link Connect",
        "<p>Quan sát các hình đang mở và nối hai hình giống nhau bằng đường đi không có vật cản.</p><p>Đường nối có tối đa hai lần rẽ.</p>",
        "book",
      ),
    }),
    createMenuItem({
      icon: "restart",
      text: "Đổi trò chơi",
      onClick: showGameSelector,
    }),
  );
  wrapper.append(menuList);
  overlay.append(wrapper);
  document.body.append(overlay);
}

function createMenuOverlay(variant) {
  const overlay = document.createElement("div");
  overlay.id = "menu-container";
  overlay.className = `menu-overlay ${variant}`;
  return overlay;
}

function createMenuWrapper(titleText, description) {
  const wrapper = document.createElement("div");
  wrapper.className = "menu-wrapper";
  const title = document.createElement("h1");
  title.className = "game-title";
  title.textContent = titleText;
  const subtitle = document.createElement("p");
  subtitle.className = "menu-description";
  subtitle.textContent = description;
  wrapper.append(title, subtitle);
  return wrapper;
}

function createGameChoice({ icon, title, description, onClick }) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "game-selector__choice";
  button.append(createIcon(icon));
  const content = document.createElement("span");
  const heading = document.createElement("strong");
  heading.textContent = title;
  const copy = document.createElement("small");
  copy.textContent = description;
  content.append(heading, copy);
  button.append(content, createIcon("arrow-right"));
  button.addEventListener("click", onClick);
  return button;
}

function createMenuItem({ icon, text, detail, onClick, disabled = false }) {
  const item = document.createElement("li");
  item.className = "menu-item";
  item.append(createIcon(icon));
  const label = document.createElement("span");
  label.textContent = text;
  item.append(label);
  if (detail) {
    const note = document.createElement("small");
    note.textContent = detail;
    item.append(note);
  }
  if (disabled) {
    item.classList.add("is-disabled");
    item.setAttribute("aria-disabled", "true");
  } else {
    item.tabIndex = 0;
    item.addEventListener("click", onClick);
    item.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") onClick();
    });
  }
  return item;
}
