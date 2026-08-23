const STORAGE_KEYS = Object.freeze({
  highScore: 'highScore',
  sound: 'sound',
  music: 'music',
  soundVolume: 'soundVolume',
  musicVolume: 'musicVolume',
});

export function loadPersistentGameData() {
  return {
    highScore: Number.parseInt(localStorage.getItem(STORAGE_KEYS.highScore) || '0', 10) || 0,
    settings: {
      sound: localStorage.getItem(STORAGE_KEYS.sound) !== 'false',
      music: localStorage.getItem(STORAGE_KEYS.music) !== 'false',
      soundVolume: Number(localStorage.getItem(STORAGE_KEYS.soundVolume) || 0.4),
      musicVolume: Number(localStorage.getItem(STORAGE_KEYS.musicVolume) || 0.35),
    },
  };
}

export function saveHighScore(score) {
  localStorage.setItem(STORAGE_KEYS.highScore, String(score));
}

export function clearHighScore() {
  localStorage.removeItem(STORAGE_KEYS.highScore);
}

export function clearPersistentGameData() {
  Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
}

export function saveSetting(key, value) {
  if (!Object.hasOwn(STORAGE_KEYS, key)) return;
  localStorage.setItem(STORAGE_KEYS[key], String(value));
}
