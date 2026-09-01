import { createIcon } from "./icons.js";
import { createMainMenu, showGameInfoModal } from "./mainmenu.js";
import { showSettingsPanel } from "./settings.js";
import { openAppModal } from "./modal.js";
import { getActiveSessions } from "./sessionProgress.js";

let activeGameId = null;
let onStartLinkConnect = () => {};
let onOpenLinkCollection = () => {};
let onOpenLinkShop = () => {};
let onContinueLinkConnect = () => {};

export function configureGameSelector({ startLinkConnect, openLinkCollection, openLinkShop, continueLinkConnect } = {}) {
  onStartLinkConnect = startLinkConnect || onStartLinkConnect;
  onOpenLinkCollection = openLinkCollection || onOpenLinkCollection;
  onOpenLinkShop = openLinkShop || onOpenLinkShop;
  onContinueLinkConnect = continueLinkConnect || onContinueLinkConnect;
}

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
      description: "Thử thách cách mà bạn ghi nhớ.",
      onClick: () => openGameMenu("memory-match"),
    }),
    createGameChoice({
      icon: "puzzle",
      title: "Link Connect",
      description: "Thử thách cách mà bạn quan sát.",
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
    "Thử thách cách mà bạn quan sát.",
  );
  const menuList = document.createElement("ul");
  menuList.className = "menu-list";
  menuList.append(
    ...(getActiveSessions("link-connect").length ? [createMenuItem({
      icon: "play",
      text: "Tiếp tục",
      onClick: () => showLinkSessionPicker(onContinueLinkConnect),
    })] : []),
    createMenuItem({
      icon: "play",
      text: "Bắt đầu",
      onClick: onStartLinkConnect,
    }),
    createMenuItem({
      icon: "collection",
      text: "Bộ sưu tập",
      onClick: onOpenLinkCollection,
    }),
    createMenuItem({
      icon: "shop",
      text: "Cửa hàng",
      onClick: onOpenLinkShop,
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
      icon: "settings",
      text: "Cài đặt",
      onClick: () => showSettingsPanel(),
    }),
    createMenuItem({
      icon: "info",
      text: "Thông tin",
      onClick: () => showGameInfoModal(
        "Giới thiệu",
        "<p><strong>Link Connect</strong> là trò chơi nối cặp hình giúp rèn luyện khả năng quan sát.</p>",
      ),
    }),
    createMenuItem({
      icon: "home",
      text: "Home",
      onClick: showGameSelector,
    }),
  );
  wrapper.append(menuList);
  overlay.append(wrapper);
  document.body.append(overlay);
}

function showLinkSessionPicker(onContinue) {
  const content = document.createElement("div");
  content.className = "difficulty-options";
  getActiveSessions("link-connect").forEach((session) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "difficulty-option";
    button.textContent = `${modeLabel(session.mode)} · Cấp ${session.level}`;
    button.onclick = () => {
      document.getElementById("continue-link-session-modal")?.remove();
      onContinue(session);
    };
    content.append(button);
  });
  openAppModal({ id: "continue-link-session-modal", icon: "play", title: "Tiếp tục hành trình", content });
}

function modeLabel(mode) {
  return ({ easy: "Dễ", normal: "Trung bình", hard: "Khó", superHard: "Siêu khó", endless: "Vô tận", challenge: "Thử thách" })[mode] || mode;
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
