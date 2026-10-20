// js/sound.js
// Quản lý âm thanh của dự án

const assetUrl = (path) => `${import.meta.env.BASE_URL}${path}`;
const isAndroidBuild = import.meta.env.MODE === "android";

export const sounds = {
  click: new Audio(assetUrl("assets/sounds/click.mp3")),
  gameStart: new Audio(assetUrl("assets/sounds/game-start-317318.mp3")),
  match: new Audio(assetUrl("assets/sounds/match.mp3")),
  wrong: new Audio(assetUrl("assets/sounds/wrong.mp3")),
  overlay: new Audio(assetUrl("assets/sounds/overlay.mp3")),
  bonus: new Audio(assetUrl("assets/sounds/bonus.mp3")),
  congratulations: new Audio(assetUrl("assets/sounds/congratulations.mp3")),
  victory: new Audio(assetUrl("assets/sounds/victory.mp3")),
  defeat: new Audio(assetUrl("assets/sounds/defeat.mp3")),
  confirm: new Audio(assetUrl("assets/sounds/confirm.mp3")),
  timerunningout: new Audio(assetUrl("assets/sounds/time-running-out.mp3")),
  victoryFlowerTheme: isAndroidBuild
    ? null
    : new Audio(assetUrl("assets/sounds/victory-flower-theme.mp3")),
};

export const MENU_MUSIC_TRACKS = Object.freeze([
  assetUrl("assets/sounds/menu1.mp3"),
  assetUrl("assets/sounds/menu2.mp3"),
]);

let selectedMenuTrack = null;
let victoryMusicDuckActive = false;
const VICTORY_MUSIC_DUCK_RATIO = 0.2;

const clampVolume = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(1, Math.max(0, parsed)) : fallback;
};

export function playGameStartSound(settings) {
  if (!settings?.sound || document.hidden) return;
  const audio = sounds.gameStart;
  audio.currentTime = 0;
  audio.volume = clampVolume(settings.soundVolume, 0.4);
  try { void audio.play().catch(() => {}); } catch { /* Playback can be blocked by the browser. */ }
}

// Coin streams use a bounded voice pool; other cues keep a single voice.
const COIN_CUE_VOICES = 6;
const COIN_CUE_GAIN = 0.45;
const rewardCueFiles = Object.freeze({
  star1: 'star_1.ogg', star2: 'star_2.ogg', star3: 'star_3.ogg',
  reward: 'reward.ogg', openBox: 'open_box.ogg', thunder: 'explosion.ogg',
  frozenUnlock: 'unlock_1.mp3', coinDrop: 'coin_drop.mp3', coinCollect: 'coin-collect.mp3',
});
const rewardCues = new Map();

export function playOwnedRewardCue(name, owner, settings) {
  if (!Object.hasOwn(rewardCueFiles, name)) throw new Error(`Unknown reward cue: ${name}`);
  const volume = settings?.sound ? clampVolume(settings.soundVolume, 0.4) : 0;
  if (!owner.active || document.hidden || !volume) return;
  const isCoin = name === 'coinDrop' || name === 'coinCollect';
  let pool = rewardCues.get(name);
  if (!pool) {
    pool = [];
    rewardCues.set(name, pool);
  }
  let cue = pool.find(voice => !voice.stop);
  if (!cue && pool.length < (isCoin ? COIN_CUE_VOICES : 1)) {
    cue = { audio: new Audio(assetUrl(`assets/sounds/${rewardCueFiles[name]}`)), stop: null,
      gain: isCoin ? COIN_CUE_GAIN : 1 };
    pool.push(cue);
  }
  if (!cue) {
    cue = pool.shift();
    pool.push(cue);
  }
  cue.stop?.();
  const audio = cue.audio;
  audio.currentTime = 0;
  audio.volume = volume * cue.gain;
  let ended, failed, hidden;
  const stop = owner.own(() => {
    audio.removeEventListener('ended', ended);
    audio.removeEventListener('error', failed);
    document.removeEventListener('visibilitychange', hidden);
    audio.pause();
    audio.currentTime = 0;
    if (cue.stop === stop) cue.stop = null;
  });
  ended = () => { if (audio.ended) stop(); };
  failed = () => stop();
  hidden = () => { if (document.hidden) stop(); };
  audio.addEventListener('ended', ended);
  audio.addEventListener('error', failed);
  document.addEventListener('visibilitychange', hidden);
  cue.stop = stop;
  // A rejected, older play promise can only dispose its own voice.
  try { void audio.play().catch(stop); } catch { stop(); }
  return stop;
}

export function applyEffectsSettings(settings) {
  const volume = settings?.sound ? clampVolume(settings.soundVolume, 0.4) : 0;
  Object.values(sounds).filter(Boolean).forEach((sound) => {
    sound.volume = volume;
  });
  for (const cue of [...rewardCues.values()].flat()) {
    cue.audio.volume = volume * cue.gain;
    if (!volume) cue.stop?.();
  }
}

export function syncDefaultMusic(settings, shouldPlay = true) {
  const music = document.getElementById("bg-music");
  if (!music) return;

  if (!selectedMenuTrack) {
    selectedMenuTrack =
      MENU_MUSIC_TRACKS[Math.floor(Math.random() * MENU_MUSIC_TRACKS.length)];
  }
  if (music.src !== new URL(selectedMenuTrack, document.baseURI).href) music.src = selectedMenuTrack;
  music.loop = true;
  music.volume = getBackgroundMusicVolume(settings);

  if (!settings?.music) {
    music.pause();
    return;
  }

  // Không được khởi động lại âm thanh khi tab/app đang ở nền.
  if (document.hidden) {
    music.pause();
    return;
  }

  if (shouldPlay && music.paused) music.play().catch(() => {});
}

export function duckBackgroundMusicForVictory(settings) {
  victoryMusicDuckActive = true;
  const music = document.getElementById("bg-music");
  if (music) music.volume = getBackgroundMusicVolume(settings);
}

export function restoreBackgroundMusic(settings) {
  victoryMusicDuckActive = false;
  const music = document.getElementById("bg-music");
  if (music) music.volume = getBackgroundMusicVolume(settings);
}

function getBackgroundMusicVolume(settings) {
  const configuredVolume = clampVolume(settings?.musicVolume, 0.35);
  return configuredVolume * (victoryMusicDuckActive ? VICTORY_MUSIC_DUCK_RATIO : 1);
}

export function playVictoryFlowerTheme(settings) {
  const theme = sounds.victoryFlowerTheme;
  if (!theme || !settings?.music || document.hidden) return;

  theme.pause();
  theme.currentTime = 0;
  theme.loop = false;
  theme.volume = clampVolume(settings.musicVolume, 0.35);
  theme.play().catch(() => {});
}

export function pauseVictoryFlowerTheme() {
  const theme = sounds.victoryFlowerTheme;
  if (!theme) return;
  theme.pause();
  theme.currentTime = 0;
}

export function pauseGameAudio() {
  pauseBackgroundMusic();
  Object.values(sounds).filter(Boolean).forEach((sound) => sound.pause());
  for (const pool of rewardCues.values()) for (const cue of pool) cue.stop?.();
}

export function pauseBackgroundMusic() {
  document.getElementById("bg-music")?.pause();
}

export function isBackgroundMusicPlaying() {
  const music = document.getElementById("bg-music");
  return Boolean(music && !music.paused && !music.ended);
}

export function enableButtonClickSounds(getSettings) {
  document.addEventListener("click", (event) => {
    const interactive = event.target.closest(
      'button, .menu-item, [role="button"]',
    );
    if (!interactive || interactive.disabled || !getSettings?.()?.sound) return;

    sounds.click.currentTime = 0;
    sounds.click.play().catch(() => {});
  });
}

// ✅ Unlock âm thanh sau tương tác đầu tiên
export function unlockSound() {
  const unlock = () => {
    Object.values(sounds).filter(Boolean).forEach((sound) => {
      try {
        sound.play().catch(() => {});
        sound.pause();
        sound.currentTime = 0;
      } catch {
        // ignore error
      }
    });
    document.removeEventListener("click", unlock);
    document.removeEventListener("touchstart", unlock);
  };

  document.addEventListener("click", unlock, { once: true });
  document.addEventListener("touchstart", unlock, { once: true });
}
