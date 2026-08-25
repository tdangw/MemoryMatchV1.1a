import { gameState } from "./gameState.js";
import { openAppModal } from "./modal.js";
import { applyEffectsSettings, syncDefaultMusic } from "./sound.js";
import { saveSetting } from "./persistence.js";
import { APP_VERSION } from "./appMeta.js";
import { setMeteorEffectsEnabled } from "./backgroundEffects.js";

const settingsContainer = document.getElementById("settings-container");
const settingsHome = settingsContainer?.parentElement;
const soundToggle = document.getElementById("toggle-sound");
const musicToggle = document.getElementById("toggle-music");
const meteorEffectsToggle = document.getElementById("toggle-meteor-effects");
const soundVolume = document.getElementById("sound-volume");
const musicVolume = document.getElementById("music-volume");
const soundVolumeValue = document.getElementById("sound-volume-value");
const musicVolumeValue = document.getElementById("music-volume-value");
const versionInfoButton = document.getElementById("version-info");
const versionValue = document.getElementById("settings-version-value");

let onCloseFromMenu = () => {};

export function configureSettings({ onCloseMenu } = {}) {
  onCloseFromMenu = onCloseMenu || onCloseFromMenu;
}

function saveGameSetting(key, value) {
  gameState.settings[key] = value;
  saveSetting(key, value);
}

function updateVolumeLabel(output, value) {
  if (output) output.textContent = `${Math.round(value * 100)}%`;
}

function syncSettingsControls() {
  const settings = gameState.settings;
  if (soundToggle) soundToggle.checked = settings.sound;
  if (musicToggle) musicToggle.checked = settings.music;
  if (meteorEffectsToggle) meteorEffectsToggle.checked = settings.meteorEffects;
  if (soundVolume) soundVolume.value = Math.round(settings.soundVolume * 100);
  if (musicVolume) musicVolume.value = Math.round(settings.musicVolume * 100);
  if (soundVolume) soundVolume.disabled = !settings.sound;
  if (musicVolume) musicVolume.disabled = !settings.music;
  updateVolumeLabel(soundVolumeValue, settings.soundVolume);
  updateVolumeLabel(musicVolumeValue, settings.musicVolume);
}

function bindSettingsControls() {
  if (soundToggle) {
    soundToggle.onchange = () => {
      saveGameSetting("sound", soundToggle.checked);
      if (soundVolume) soundVolume.disabled = !soundToggle.checked;
      applyEffectsSettings(gameState.settings);
    };
  }

  if (musicToggle) {
    musicToggle.onchange = () => {
      saveGameSetting("music", musicToggle.checked);
      if (musicVolume) musicVolume.disabled = !musicToggle.checked;
      syncDefaultMusic(gameState.settings, musicToggle.checked);
    };
  }

  if (meteorEffectsToggle) {
    meteorEffectsToggle.onchange = () => {
      saveGameSetting("meteorEffects", meteorEffectsToggle.checked);
      setMeteorEffectsEnabled(meteorEffectsToggle.checked);
    };
  }

  if (soundVolume) {
    soundVolume.oninput = () => {
      const value = Number(soundVolume.value) / 100;
      saveGameSetting("soundVolume", value);
      updateVolumeLabel(soundVolumeValue, value);
      applyEffectsSettings(gameState.settings);
    };
  }

  if (musicVolume) {
    musicVolume.oninput = () => {
      const value = Number(musicVolume.value) / 100;
      saveGameSetting("musicVolume", value);
      updateVolumeLabel(musicVolumeValue, value);
      syncDefaultMusic(gameState.settings, gameState.settings.music);
    };
  }
}

function showVersionInfo() {
  openAppModal({
    id: "version-modal",
    icon: "info",
    title: `Phiên bản ${APP_VERSION}`,
    content: `
      <ul class="app-feature-list">
        <li>Ba mức độ phù hợp với nhiều cách chơi</li>
        <li>Hình ảnh được thay đổi ngẫu nhiên sau mỗi màn</li>
        <li>Gợi ý lật nhanh một cặp thẻ khi cần</li>
        <li>Chơi thuận tiện trên điện thoại và máy tính</li>
      </ul>
    `,
  });
}

applyEffectsSettings(gameState.settings);
bindSettingsControls();
if (versionValue) versionValue.textContent = APP_VERSION;
versionInfoButton?.addEventListener("click", showVersionInfo);

export function showSettingsPanel(fromGame = false) {
  if (!settingsContainer || !settingsHome) return;

  settingsContainer.style.display = "grid";
  gameState.isPaused = fromGame;
  syncSettingsControls();

  openAppModal({
    id: "settings-modal",
    icon: "settings",
    title: "Cài đặt",
    content: settingsContainer,
    size: "medium",
    onClose: () => {
      settingsContainer.style.display = "none";
      settingsHome.appendChild(settingsContainer);
      gameState.isPaused = false;
      if (!fromGame) onCloseFromMenu();
    },
  });
}
