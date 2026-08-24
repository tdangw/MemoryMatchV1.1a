const STORAGE_KEYS = Object.freeze({
  coins: "coins",
  sound: "sound",
  music: "music",
  soundVolume: "soundVolume",
  musicVolume: "musicVolume",
  appearance: "appearance",
});

export function loadPersistentGameData() {
  // Dọn dữ liệu kỷ lục cũ: điểm hiện chỉ đại diện cho lượt chơi đang diễn ra.
  localStorage.removeItem("highScore");
  return {
    coins:
      Number.parseInt(localStorage.getItem(STORAGE_KEYS.coins) || "0", 10) || 0,
    appearance: loadAppearance(),
    settings: {
      sound: localStorage.getItem(STORAGE_KEYS.sound) !== "false",
      music: localStorage.getItem(STORAGE_KEYS.music) !== "false",
      soundVolume: Number(
        localStorage.getItem(STORAGE_KEYS.soundVolume) || 0.4,
      ),
      musicVolume: Number(
        localStorage.getItem(STORAGE_KEYS.musicVolume) || 0.35,
      ),
    },
  };
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
  localStorage.removeItem("highScore");
}

export function saveSetting(key, value) {
  if (!Object.hasOwn(STORAGE_KEYS, key)) return;
  localStorage.setItem(STORAGE_KEYS[key], String(value));
}
