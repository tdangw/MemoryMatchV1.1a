const STORAGE_KEYS = Object.freeze({
  coins: "coins",
  sound: "sound",
  music: "music",
  soundVolume: "soundVolume",
  musicVolume: "musicVolume",
  meteorEffects: "meteorEffects",
  boardCoordinates: "boardCoordinates",
  appearance: "appearance",
  progress: "progress",
});

export function loadPersistentGameData() {
  return {
    coins:
      Number.parseInt(localStorage.getItem(STORAGE_KEYS.coins) || "0", 10) || 0,
    appearance: loadAppearance(),
    progress: loadProgress(),
    settings: {
      sound: localStorage.getItem(STORAGE_KEYS.sound) !== "false",
      music: localStorage.getItem(STORAGE_KEYS.music) !== "false",
      soundVolume: Number(
        localStorage.getItem(STORAGE_KEYS.soundVolume) || 0.4,
      ),
      musicVolume: Number(
        localStorage.getItem(STORAGE_KEYS.musicVolume) || 0.35,
      ),
      meteorEffects: localStorage.getItem(STORAGE_KEYS.meteorEffects) !== "false",
      boardCoordinates: localStorage.getItem(STORAGE_KEYS.boardCoordinates) === "true",
    },
  };
}

function loadProgress() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.progress) || "{}"); } catch { return {}; }
}

export function saveProgress(progress) {
  localStorage.setItem(STORAGE_KEYS.progress, JSON.stringify(progress));
}

function loadAppearance() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.appearance) || "{}");
  } catch {
    return {};
  }
}

export function saveCoins(coins) {
  localStorage.setItem(
    STORAGE_KEYS.coins,
    String(Math.max(0, Math.floor(coins))),
  );
}

export function saveAppearance(appearance) {
  localStorage.setItem(STORAGE_KEYS.appearance, JSON.stringify(appearance));
}

export function clearPersistentGameData() {
  Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
}

export function saveSetting(key, value) {
  if (!Object.hasOwn(STORAGE_KEYS, key)) return;
  localStorage.setItem(STORAGE_KEYS[key], String(value));
}
