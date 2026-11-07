import { isAppActive } from './appVisibility.js';
// js/sound.js
// Quản lý âm thanh của dự án
import { createGameShellLifecycle } from './gameShell/gameShellLifecycle.js';

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
// Measured onset of the supplied MP3; preserve its attack after the leading silence.
const GAME_START_AUDIO_OFFSET_SECONDS = 0.6;
sounds.gameStart.preload = 'auto';

const clampVolume = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(1, Math.max(0, parsed)) : fallback;
};

export function playGameStartSound(settings) {
  if (!settings?.sound || !isAppActive()) return;
  const audio = sounds.gameStart;
  audio.currentTime = GAME_START_AUDIO_OFFSET_SECONDS;
  audio.volume = clampVolume(settings.soundVolume, 0.4);
  try { void audio.play().catch(() => {}); } catch { /* Playback can be blocked by the browser. */ }
}

// Coin streams use a bounded voice pool; other cues keep a single voice.
const COIN_CUE_VOICES = 6;
const COIN_CUE_GAIN = 0.45;
const SUMMARY_AUDIO_OFFSET_SECONDS = 0.08;
const rewardCueFiles = Object.freeze({
  wheelSpin: 'wheel-spin.mp3',
  star1: 'star_1.ogg', star2: 'star_2.ogg', star3: 'star_3.ogg',
  reward: 'reward.ogg', openBox: 'open_box.ogg', thunder: 'explosion.ogg', summary: 'summary.mp3',
  frozenUnlock: 'unlock_1.mp3', coinDrop: 'coin_drop.mp3', coinCollect: 'coin-collect.mp3',
  hint: 'hint_1.mp3', shuffle: 'shuffle-cards-46455.mp3', wave: 'level-passed-143039.mp3', freeze: 'fx-time-freeze-107808.mp3',
  difficulty: 'game-ui-2.mp3',
  popupClose: 'click-pop-ui-2-262119.mp3',
});
const uiCueOwner = createGameShellLifecycle();
const rewardCues = new Map(['summary', 'hint', 'shuffle', 'wave', 'freeze', 'difficulty', 'popupClose'].map(name => {
  const audio = new Audio(assetUrl(`assets/sounds/${rewardCueFiles[name]}`));
  audio.preload = 'auto';
  return [name, [{ audio, stop: null, gain: 1 }]];
}));

export function playOwnedRewardCue(name, owner, settings) {
  if (!Object.hasOwn(rewardCueFiles, name)) throw new Error(`Unknown reward cue: ${name}`);
  const volume = settings?.sound ? clampVolume(settings.soundVolume, 0.4) : 0;
  if (!owner.active || !isAppActive() || !volume) return;
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
  audio.currentTime = name === 'summary' ? SUMMARY_AUDIO_OFFSET_SECONDS : 0;
  audio.volume = volume * cue.gain;
  let ended, failed, hidden, release;
  let currentOwner = owner;
  let active = true;
  const stop = () => {
    if (!active) return;
    active = false;
    release.forget();
    audio.removeEventListener('ended', ended);
    audio.removeEventListener('error', failed);
    document.removeEventListener('appvisibilitychange', hidden);
    audio.pause();
    audio.currentTime = 0;
    if (cue.stop === stop) cue.stop = null;
  };
  release = owner.own(stop);
  stop.transferOwner = nextOwner => {
    if (!active) return;
    release.forget();
    currentOwner = nextOwner;
    release = nextOwner.own(stop);
  };
  Object.defineProperty(stop, 'owner', { get: () => currentOwner });
  ended = () => { if (audio.ended) stop(); };
  failed = () => stop();
  hidden = () => { if (!isAppActive()) stop(); };
  audio.addEventListener('ended', ended);
  audio.addEventListener('error', failed);
  document.addEventListener('appvisibilitychange', hidden);
  cue.stop = stop;
  // A rejected, older play promise can only dispose its own voice.
  try { void audio.play().catch(stop); } catch { stop(); }
  return stop;
}

// A synchronous mount handoff keeps the clear cue playing across wave scopes,
// while restart, navigation, visibility and mute retain their normal stop paths.
export function mountWithWaveAudio(previousOwner, mount, continuing = false) {
  const cue = continuing ? rewardCues.get('wave').find(voice => voice.stop?.owner === previousOwner)?.stop : null;
  if (!cue) return mount();
  const bridge = createGameShellLifecycle();
  cue.transferOwner(bridge);
  try {
    const nextOwner = mount();
    cue.transferOwner(nextOwner);
    return nextOwner;
  } finally { bridge.dispose(); }
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
  if (!isAppActive()) {
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
  if (!theme || !settings?.music || !isAppActive()) return;

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

    if (interactive.classList.contains('app-modal__close')) {
      playOwnedRewardCue('popupClose', uiCueOwner, getSettings());
      return;
    }

    if (interactive.dataset.clickSound === 'gameStart') {
      playGameStartSound(getSettings());
      return;
    }

    sounds.click.currentTime = 0;
    sounds.click.play().catch(() => {});
  }, { capture: true });
}

// ✅ Unlock âm thanh sau tương tác đầu tiên
export function unlockSound() {
  const unlock = () => {
    Object.values(sounds).filter(sound => sound && sound !== sounds.gameStart).forEach((sound) => {
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
