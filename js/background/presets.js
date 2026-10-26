import { PILOT_PRESETS } from './pilotPresets.js';

// Independent source pixels, not coordinates derived from the other orientation.
export const SCENE_PRESETS = Object.freeze({
  'memory-match': PILOT_PRESETS.memory,
  'link-connect': {
    portrait: { source: '/assets/images/backgrounds/link-connect-portrait-9x20.webp', width: 1080, height: 2400, regions: [
      { kind: 'water', x: 98, y: 353, width: 26, height: 128 },
      { kind: 'water', x: 181, y: 2050, width: 28, height: 125 },
    ] },
    landscape: { source: '/assets/images/backgrounds/link-connect.webp', width: 1254, height: 1254, regions: [
      { kind: 'water', x: 79, y: 218, width: 18, height: 94 },
      { kind: 'water', x: 133, y: 1051, width: 20, height: 58 },
    ] },
  },
  'triple-connect': {
    portrait: { source: '/assets/images/backgrounds/triple-connect-portrait-9x20.webp', width: 1080, height: 2400, regions: [
      { kind: 'water', x: 122, y: 579, width: 20, height: 138 },
      { kind: 'water', x: 969, y: 995, width: 18, height: 135 },
      { kind: 'leaf', x: 39, y: 1470, width: 42, height: 105, color: '#9580ad', phase: 6000 },
    ] },
    landscape: { source: '/assets/images/backgrounds/triple-connect.webp', width: 1254, height: 1254, regions: [
      { kind: 'water', x: 133, y: 329, width: 16, height: 101 },
      { kind: 'water', x: 1148, y: 390, width: 19, height: 118 },
      { kind: 'leaf', x: 32, y: 714, width: 35, height: 90, color: '#9580ad', phase: 6000 },
    ] },
  },
});

export const MAP_SCENE = Object.freeze({ source: '/assets/adventure/moonlit-garden.webp', width: 1024, height: 1536,
  regions: [
    { kind: 'water', x: 181, y: 524, width: 22, height: 69 },
    { kind: 'water', x: 103, y: 716, width: 19, height: 64 },
    { kind: 'water', x: 869, y: 1149, width: 17, height: 50 },
    { kind: 'fish', x: 720, y: 883, width: 110, height: 36 },
    { kind: 'fish', x: 288, y: 616, width: 110, height: 36, phase: 2600 },
    { kind: 'fish', x: 488, y: 1350, width: 125, height: 36 },
    { kind: 'fish', x: 301, y: 1058, width: 110, height: 36 },
    { kind: 'firefly', x: 222, y: 375, width: 36, height: 42, phase: 4000 },
    { kind: 'firefly', x: 825, y: 1000, width: 36, height: 42, phase: 6000 },
    { kind: 'leaf', x: 260, y: 931, width: 40, height: 100, phase: 5000 },
    { kind: 'leaf', x: 751, y: 447, width: 40, height: 100, phase: 9000 },
  ],
});
