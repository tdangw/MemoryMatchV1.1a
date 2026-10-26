// G1 candidates only. No product caller imports these before art approval.
// Portrait and landscape are independently authored source coordinates.
export const PILOT_PRESETS = Object.freeze({
  home: {
    landscape: { source: '/assets/images/background-main.webp', width: 1536, height: 1024,
      regions: [{ kind: 'water', x: 72, y: 199, width: 15, height: 78 }] },
    portrait: { source: '/assets/images/background-main-portrait.webp', width: 1080, height: 2400,
      regions: [{ kind: 'water', x: 92, y: 230, width: 15, height: 87 }] },
  },
  memory: {
    landscape: { source: '/assets/images/backgrounds/memory-match.webp', width: 1254, height: 1254,
      regions: [
        { kind: 'fish', x: 105, y: 770, width: 78, height: 34 },
        { kind: 'fish', x: 500, y: 1050, width: 140, height: 38 },
        { kind: 'firefly', x: 29, y: 645, width: 25, height: 32 },
        { kind: 'leaf', x: 50, y: 745, width: 34, height: 90 },
      ] },
    portrait: { source: '/assets/images/backgrounds/memory-match-portrait-9x20.webp', width: 1080, height: 2400,
      regions: [
        { kind: 'fish', x: 158, y: 1440, width: 120, height: 38 },
        { kind: 'fish', x: 480, y: 1700, width: 140, height: 38 },
        { kind: 'firefly', x: 30, y: 1330, width: 32, height: 40 },
        { kind: 'leaf', x: 48, y: 1450, width: 40, height: 100 },
      ] },
  },
});
