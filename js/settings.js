import { gameState } from "./gameState.js";
import { openAppModal } from "./modal.js";
import { applyEffectsSettings, syncDefaultMusic } from "./sound.js";
import { saveSetting } from "./persistence.js";
import { APP_VERSION } from "./appMeta.js";
import { setMeteorEffectsEnabled } from "./backgroundEffects.js";
import { setBoardCoordinatesVisible } from "./grid.js";
import { clearTooltip } from "./tooltips.js";

const settingsContainer = document.getElementById("settings-container");
const settingsHome = settingsContainer?.parentElement;
const soundToggle = document.getElementById("toggle-sound");
const musicToggle = document.getElementById("toggle-music");
const meteorEffectsToggle = document.getElementById("toggle-meteor-effects");
const boardCoordinatesToggle = document.getElementById("toggle-board-coordinates");
const cardDescriptionsToggle = document.getElementById("toggle-card-descriptions");
const soundVolume = document.getElementById("sound-volume");
const musicVolume = document.getElementById("music-volume");
const soundVolumeValue = document.getElementById("sound-volume-value");
const musicVolumeValue = document.getElementById("music-volume-value");
const versionInfoButton = document.getElementById("version-info");
const versionValue = document.getElementById("settings-version-value");

let onCloseFromMenu = () => {};
let navigation = {};

export function configureSettings({ onCloseMenu, onHelp, onReset } = {}) {
  onCloseFromMenu = onCloseMenu || onCloseFromMenu;
  navigation = { onHelp, onReset };
}

async function saveGameSetting(key, value) {
  gameState.settings[key] = value;
  (await saveSetting(key, value));
}

function updateVolumeControl(input, output, value) {
  if (input) input.style.setProperty('--settings-volume', `${Math.round(value * 100)}%`);
  if (output) output.textContent = `${Math.round(value * 100)}%`;
}

function syncSettingsControls() {
  const settings = gameState.settings;
  if (soundToggle) soundToggle.checked = settings.sound;
  if (musicToggle) musicToggle.checked = settings.music;
  if (meteorEffectsToggle) meteorEffectsToggle.checked = settings.meteorEffects;
  if (boardCoordinatesToggle) boardCoordinatesToggle.checked = settings.boardCoordinates;
  if (cardDescriptionsToggle) cardDescriptionsToggle.checked = settings.cardDescriptions;
  if (soundVolume) soundVolume.value = Math.round(settings.soundVolume * 100);
  if (musicVolume) musicVolume.value = Math.round(settings.musicVolume * 100);
  if (soundVolume) soundVolume.disabled = !settings.sound;
  if (musicVolume) musicVolume.disabled = !settings.music;
  updateVolumeControl(soundVolume, soundVolumeValue, settings.soundVolume);
  updateVolumeControl(musicVolume, musicVolumeValue, settings.musicVolume);
}

function bindSettingsControls() {
  if (soundToggle) {
    soundToggle.onchange = async () => {
      (await saveGameSetting("sound", soundToggle.checked));
      if (soundVolume) soundVolume.disabled = !soundToggle.checked;
      applyEffectsSettings(gameState.settings);
    };
  }

  if (musicToggle) {
    musicToggle.onchange = async () => {
      (await saveGameSetting("music", musicToggle.checked));
      if (musicVolume) musicVolume.disabled = !musicToggle.checked;
      syncDefaultMusic(gameState.settings, musicToggle.checked);
    };
  }

  if (meteorEffectsToggle) {
    meteorEffectsToggle.onchange = async () => {
      (await saveGameSetting("meteorEffects", meteorEffectsToggle.checked));
      setMeteorEffectsEnabled(meteorEffectsToggle.checked);
    };
  }

  if (boardCoordinatesToggle) {
    boardCoordinatesToggle.onchange = async () => {
      (await saveGameSetting("boardCoordinates", boardCoordinatesToggle.checked));
      setBoardCoordinatesVisible(boardCoordinatesToggle.checked);
    };
  }

  if (cardDescriptionsToggle) {
    cardDescriptionsToggle.onchange = async () => {
      (await saveGameSetting("cardDescriptions", cardDescriptionsToggle.checked));
      if (!cardDescriptionsToggle.checked) clearTooltip();
    };
  }

  if (soundVolume) {
    soundVolume.oninput = async () => {
      const value = Number(soundVolume.value) / 100;
      (await saveGameSetting("soundVolume", value));
      updateVolumeControl(soundVolume, soundVolumeValue, value);
      applyEffectsSettings(gameState.settings);
    };
  }

  if (musicVolume) {
    musicVolume.oninput = async () => {
      const value = Number(musicVolume.value) / 100;
      (await saveGameSetting("musicVolume", value));
      updateVolumeControl(musicVolume, musicVolumeValue, value);
      syncDefaultMusic(gameState.settings, gameState.settings.music);
    };
  }
}

function showVersionInfo() {
  openAppModal({
    id: "version-modal",
    icon: "info",
    title: "Giới thiệu & phiên bản",
    content: `
      <p><strong>Memory Match Adventure</strong> gồm ba trò chơi rèn luyện trí nhớ và quan sát.</p>
      <ul class="app-feature-list">
        <li><strong>Memory Match:</strong> ghép các cặp thẻ giống nhau.</li>
        <li><strong>Link Connect:</strong> nối các cặp thẻ theo đường đi hợp lệ.</li>
        <li><strong>Triple Connect:</strong> ghép bộ ba trên bàn nhiều lớp.</li>
      </ul>
      <p class="app-modal__note">Tác giả: Đăng · Phiên bản ${APP_VERSION}</p>
    `,
  });
}

applyEffectsSettings(gameState.settings);
bindSettingsControls();
if (versionValue) versionValue.textContent = APP_VERSION;
versionInfoButton?.addEventListener("click", showVersionInfo);

export function showSettingsPanel(fromGame = false, onClose = () => {}, actions = navigation, surface = {}) {
  if (!settingsContainer || !settingsHome) return;

  gameState.isPaused = fromGame;
  syncSettingsControls();
  let nextAction = null;

  const modal = openAppModal({
    ...surface,
    id: "settings-modal",
    icon: "settings",
    title: "Cài đặt",
    content: settingsContainer,
    size: "medium",
    onDestroy: () => {
      settingsContainer.style.display = "none";
      settingsHome.appendChild(settingsContainer);
      document.getElementById('settings-help').onclick = null;
      document.getElementById('settings-reset').onclick = null;
    },
    onClose: () => {
      settingsContainer.style.display = "none";
      settingsHome.appendChild(settingsContainer);
      gameState.isPaused = false;
      if (!fromGame) onCloseFromMenu();
      onClose();
      nextAction?.();
    },
  });
  settingsContainer.style.display = "grid";
  if (!modal.panel.contains(document.activeElement)) (settingsContainer.querySelector('input:not(:disabled)') || modal.panel).focus();
  for (const [id, action] of [['settings-help', actions.onHelp], ['settings-reset', actions.onReset]]) {
    const control = document.getElementById(id);
    control.hidden = typeof action !== 'function';
    control.onclick = () => {
      if (surface.presentation === 'screen') action();
      else { nextAction = action; modal.close(); }
    };
  }
  return modal;
}
