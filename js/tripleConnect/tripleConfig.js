export const TRIPLE_RULES = Object.freeze({
  trayCapacity: 7,
  matchSize: 3,
  baseMatchScore: 10,
  comboScoreStep: 3,
});
export const TRIPLE_EASY_CONFIG = Object.freeze({
  mode: "easy",
  tileCount: 27,
  layerCount: 3,
  timeSeconds: 93,
});
export const TRIPLE_NORMAL_CONFIG = Object.freeze({
  mode: "normal",
  tileCount: 45,
  layerCount: 4,
  timeSeconds: 133,
});
export const TRIPLE_HARD_CONFIG = Object.freeze({
  mode: "hard",
  tileCount: 63,
  layerCount: 5,
  timeSeconds: 178,
});
export const TRIPLE_SUPER_HARD_CONFIG = Object.freeze({
  mode: "superHard",
  tileCount: 96,
  layerCount: 6,
  timeSeconds: 262,
});
export const TRIPLE_ENDLESS_CONFIG = Object.freeze({
  mode: "endless",
  tileCount: 96,
  layerCount: 6,
  timeSeconds: 0,
});
export const TRIPLE_CHALLENGE_CONFIG = Object.freeze({
  mode: "challenge",
  tileCount: 12,
  layerCount: 2,
  timeSeconds: 60,
});
export const TRIPLE_LUCKY_REWARDS = Object.freeze([
  Object.freeze({ type: "coins", amount: 10 }),
  Object.freeze({ type: "time", amount: 5 }),
  Object.freeze({ type: "hint", amount: 1 }),
]);

const LAYOUT_EPSILON = 0.000001;
const HALF_CARD_WIDTH = 2;
const HALF_CARD_HEIGHT = 2;

function defineTemplate({ id, gridWidth, gridHeight, layerMasks }) {
  const slots = layerMasks.flatMap(({ layer, rows }) =>
    rows.flatMap(({ y, xs }) =>
      xs.map((x, index) =>
        Object.freeze({ id: `${id}-l${layer}-${y}-${index + 1}`, layer, x, y }),
      ),
    ),
  );
  return Object.freeze({
    id,
    coordinateUnit: "half-card",
    gridWidth,
    gridHeight,
    tileWidth: HALF_CARD_WIDTH,
    tileHeight: HALF_CARD_HEIGHT,
    overlapEpsilon: LAYOUT_EPSILON,
    layerCounts: Object.freeze(
      layerMasks.map(({ rows }) =>
        rows.reduce((count, row) => count + row.xs.length, 0),
      ),
    ),
    slots: Object.freeze(slots),
  });
}

// Kept exclusively so a saved v1 round is never interpreted using v2 coordinates.
export const TRIPLE_EASY_LAYOUT_V1 = Object.freeze({
  id: "easy-12-v1",
  tileWidth: 0.2,
  tileHeight: 0.24,
  overlapEpsilon: LAYOUT_EPSILON,
  slots: Object.freeze(
    [
      { id: "bottom-1", layer: 0, x: 0.08, y: 0.12 },
      { id: "bottom-2", layer: 0, x: 0.3, y: 0.12 },
      { id: "bottom-3", layer: 0, x: 0.52, y: 0.12 },
      { id: "bottom-4", layer: 0, x: 0.74, y: 0.12 },
      { id: "bottom-5", layer: 0, x: 0.08, y: 0.58 },
      { id: "bottom-6", layer: 0, x: 0.3, y: 0.58 },
      { id: "bottom-7", layer: 0, x: 0.52, y: 0.58 },
      { id: "bottom-8", layer: 0, x: 0.74, y: 0.58 },
      { id: "top-1", layer: 1, x: 0.19, y: 0.19 },
      { id: "top-2", layer: 1, x: 0.41, y: 0.19 },
      { id: "top-3", layer: 1, x: 0.52, y: 0.31 },
      { id: "top-4", layer: 1, x: 0.74, y: 0.31 },
    ].map(Object.freeze),
  ),
});
const legacySlots = (prefix, layer, count, columns, x, y, xStep, yStep) =>
  Array.from({ length: count }, (_, index) =>
    Object.freeze({
      id: `${prefix}-${layer}-${index + 1}`,
      layer,
      x: x + (index % columns) * xStep,
      y: y + Math.floor(index / columns) * yStep,
    }),
  );
export const TRIPLE_NORMAL_LAYOUT_V1 = Object.freeze({
  id: "normal-24-v1",
  tileWidth: 0.2,
  tileHeight: 0.22,
  overlapEpsilon: LAYOUT_EPSILON,
  slots: Object.freeze([
    ...legacySlots("normal", 0, 12, 4, 0.04, 0.08, 0.24, 0.23),
    ...legacySlots("normal", 1, 8, 4, 0.04, 0.18, 0.24, 0.23),
    ...legacySlots("normal", 2, 4, 4, 0.04, 0.3, 0.24, 0.23),
  ]),
});
export const TRIPLE_HARD_LAYOUT_V1 = Object.freeze({
  id: "hard-36-v1",
  tileWidth: 0.15,
  tileHeight: 0.17,
  overlapEpsilon: LAYOUT_EPSILON,
  slots: Object.freeze([
    ...legacySlots("hard", 0, 18, 6, 0.03, 0.05, 0.16, 0.18),
    ...legacySlots("hard", 1, 9, 6, 0.03, 0.14, 0.16, 0.18),
    ...legacySlots("hard", 2, 6, 6, 0.03, 0.25, 0.16, 0.18),
    ...legacySlots("hard", 3, 3, 6, 0.03, 0.36, 0.16, 0.18),
  ]),
});
export const TRIPLE_SUPER_HARD_LAYOUT_V1 = Object.freeze({
  id: "super-hard-60-v1",
  tileWidth: 0.145,
  tileHeight: 0.14,
  overlapEpsilon: LAYOUT_EPSILON,
  slots: Object.freeze([
    ...legacySlots("super", 0, 24, 6, 0.02, 0.03, 0.16, 0.14),
    ...legacySlots("super", 1, 15, 6, 0.02, 0.1, 0.16, 0.14),
    ...legacySlots("super", 2, 9, 6, 0.02, 0.19, 0.16, 0.14),
    ...legacySlots("super", 3, 6, 6, 0.02, 0.28, 0.16, 0.14),
    ...legacySlots("super", 4, 6, 6, 0.02, 0.37, 0.16, 0.14),
  ]),
});

// Giữ nguyên template v2 để Continue của phiên cũ không bị diễn giải lại.
export const TRIPLE_EASY_LAYOUT_V2 = defineTemplate({
  id: "easy-12-v2",
  gridWidth: 14,
  gridHeight: 9,
  layerMasks: [
    {
      layer: 0,
      rows: [
        { y: 1, xs: [1, 3, 5, 7] },
        { y: 5, xs: [1, 3, 5, 7] },
      ],
    },
    {
      layer: 1,
      rows: [
        { y: 2, xs: [2, 4, 6] },
        { y: 4, xs: [4] },
      ],
    },
  ],
});
export const TRIPLE_NORMAL_LAYOUT_V2 = defineTemplate({
  id: "normal-24-v2",
  gridWidth: 12,
  gridHeight: 11,
  layerMasks: [
    {
      layer: 0,
      rows: [
        { y: 1, xs: [1, 3, 5, 7] },
        { y: 4, xs: [1, 3, 5, 7] },
        { y: 7, xs: [1, 3, 5, 7] },
      ],
    },
    {
      layer: 1,
      rows: [
        { y: 2, xs: [2, 4, 6] },
        { y: 5, xs: [2, 6] },
        { y: 8, xs: [2, 4, 6] },
      ],
    },
    { layer: 2, rows: [{ y: 3, xs: [1, 3, 5, 7] }] },
  ],
});
export const TRIPLE_HARD_LAYOUT_V2 = defineTemplate({
  id: "hard-36-v2",
  gridWidth: 14,
  gridHeight: 10,
  layerMasks: [
    {
      layer: 0,
      rows: [
        { y: 1, xs: [1, 3, 5, 7, 9, 11] },
        { y: 3, xs: [1, 3, 5, 7, 9, 11] },
        { y: 5, xs: [1, 3, 5, 7, 9, 11] },
      ],
    },
    {
      layer: 1,
      rows: [
        { y: 0, xs: [1, 5, 9] },
        { y: 2, xs: [3, 7, 11] },
        { y: 6, xs: [1, 5, 9] },
      ],
    },
    {
      layer: 2,
      rows: [
        { y: 0, xs: [2, 6, 10] },
        { y: 3, xs: [2, 6, 10] },
      ],
    },
    { layer: 3, rows: [{ y: 1, xs: [2, 6, 10] }] },
  ],
});
export const TRIPLE_SUPER_HARD_LAYOUT_V2 = defineTemplate({
  id: "super-hard-60-v2",
  gridWidth: 14,
  gridHeight: 13,
  layerMasks: [
    {
      layer: 0,
      rows: [
        { y: 1, xs: [1, 3, 5, 7, 9, 11] },
        { y: 3, xs: [1, 3, 5, 7, 9, 11] },
        { y: 5, xs: [1, 3, 5, 7, 9, 11] },
        { y: 7, xs: [1, 3, 5, 7, 9, 11] },
      ],
    },
    {
      layer: 1,
      rows: [
        { y: 0, xs: [1, 5, 9] },
        { y: 2, xs: [3, 7, 11] },
        { y: 4, xs: [1, 5, 9] },
        { y: 6, xs: [3, 7, 11] },
        { y: 8, xs: [1, 5, 9] },
      ],
    },
    {
      layer: 2,
      rows: [
        { y: 1, xs: [2, 6, 10] },
        { y: 5, xs: [2, 6, 10] },
        { y: 9, xs: [2, 6, 10] },
      ],
    },
    {
      layer: 3,
      rows: [
        { y: 2, xs: [2, 6, 10] },
        { y: 6, xs: [2, 6, 10] },
        { y: 10, xs: [2, 6, 10] },
      ],
    },
    { layer: 4, rows: [{ y: 3, xs: [2, 6, 10] }] },
  ],
});

// v3 dùng silhouette có chủ ý thay cho các cụm cột lặp. Tất cả tọa độ vẫn
// theo nửa thẻ, cùng kích thước tile trong một board và cover graph được
// suy ra hoàn toàn từ hình học template.
export const TRIPLE_EASY_LAYOUT_V3 = defineTemplate({
  id: "easy-12-v3", gridWidth: 10, gridHeight: 8,
  layerMasks: [
    { layer: 0, rows: [{ y: 1, xs: [2, 4, 6] }, { y: 3, xs: [1, 3, 5, 7] }, { y: 5, xs: [2] }] },
    { layer: 1, rows: [{ y: 2, xs: [2, 4, 6] }, { y: 4, xs: [4] }] },
  ],
});
export const TRIPLE_NORMAL_LAYOUT_V3 = defineTemplate({
  id: "normal-24-v3", gridWidth: 12, gridHeight: 10,
  layerMasks: [
    { layer: 0, rows: [{ y: 1, xs: [3, 5] }, { y: 3, xs: [1, 3, 5, 7, 9] }, { y: 5, xs: [3, 5] }, { y: 7, xs: [3, 5, 7] }] },
    { layer: 1, rows: [{ y: 2, xs: [2, 4, 6, 8] }, { y: 4, xs: [2, 6] }, { y: 6, xs: [4, 6] }] },
    { layer: 2, rows: [{ y: 2, xs: [3, 7] }, { y: 6, xs: [3, 7] }] },
  ],
});
export const TRIPLE_HARD_LAYOUT_V3 = defineTemplate({
  id: "hard-36-v3", gridWidth: 14, gridHeight: 12,
  layerMasks: [
    { layer: 0, rows: [{ y: 1, xs: [3, 5, 7, 9] }, { y: 3, xs: [1, 3, 5, 7, 9, 11] }, { y: 5, xs: [1, 3, 5, 7, 9, 11] }, { y: 7, xs: [5, 7] }] },
    { layer: 1, rows: [{ y: 2, xs: [2, 6, 10] }, { y: 4, xs: [4, 8] }, { y: 6, xs: [2, 6, 10] }, { y: 8, xs: [6] }] },
    { layer: 2, rows: [{ y: 2, xs: [3, 7, 11] }, { y: 6, xs: [3, 7, 11] }] },
    { layer: 3, rows: [{ y: 3, xs: [4, 8, 12] }] },
  ],
});
export const TRIPLE_SUPER_HARD_LAYOUT_V3 = defineTemplate({
  id: "super-hard-60-v3", gridWidth: 14, gridHeight: 12,
  layerMasks: [
    { layer: 0, rows: [{ y: 1, xs: [1, 3, 5, 7, 9, 11] }, { y: 3, xs: [1, 5, 9] }, { y: 5, xs: [3, 7, 11] }, { y: 7, xs: [1, 3, 5, 7, 9, 11] }, { y: 9, xs: [1, 3, 5, 7, 9, 11] }] },
    { layer: 1, rows: [{ y: 0, xs: [1, 5, 9] }, { y: 2, xs: [3, 7, 11] }, { y: 4, xs: [1, 5, 9] }, { y: 6, xs: [3, 7, 11] }, { y: 8, xs: [1, 5, 9] }] },
    { layer: 2, rows: [{ y: 1, xs: [2, 6, 10] }, { y: 5, xs: [2, 6, 10] }, { y: 9, xs: [2, 6, 10] }] },
    { layer: 3, rows: [{ y: 2, xs: [2, 6, 10] }, { y: 6, xs: [2, 6, 10] }, { y: 10, xs: [2, 6, 10] }] },
    { layer: 4, rows: [{ y: 3, xs: [2, 6, 10] }] },
  ],
});

// V4 remains addressable by ID so Continue never reinterprets saved positions.
export const TRIPLE_EASY_LAYOUT_V4 = defineTemplate({
  id: "easy-18-v4", gridWidth: 10, gridHeight: 10,
  layerMasks: [
    { layer: 0, rows: [{ y: 0, xs: [2, 4] }, { y: 2, xs: [0, 2, 4, 6] }, { y: 5, xs: [0, 2, 4, 6] }, { y: 8, xs: [2, 4] }] },
    { layer: 1, rows: [{ y: 1, xs: [1, 3, 5] }, { y: 6, xs: [1, 3, 5] }] },
  ],
});
export const TRIPLE_NORMAL_LAYOUT_V4 = defineTemplate({
  id: "normal-36-v4", gridWidth: 12, gridHeight: 12,
  layerMasks: [
    { layer: 0, rows: [{ y: 0, xs: [2, 4, 6, 8] }, { y: 4, xs: [0, 2, 4, 6, 8, 10] }, { y: 8, xs: [0, 2, 4, 6, 8, 10] }, { y: 10, xs: [4, 6] }] },
    { layer: 1, rows: [{ y: 1, xs: [1, 3, 5, 7] }, { y: 5, xs: [1, 3, 5, 7] }, { y: 9, xs: [1, 3, 5, 7] }] },
    { layer: 2, rows: [{ y: 2, xs: [2, 6] }, { y: 6, xs: [2, 6] }, { y: 10, xs: [1, 7] }] },
  ],
});
export const TRIPLE_HARD_LAYOUT_V4 = defineTemplate({
  id: "hard-54-v4", gridWidth: 14, gridHeight: 14,
  layerMasks: [
    { layer: 0, rows: [{ y: 0, xs: [2, 4, 6, 8] }, { y: 3, xs: [0, 2, 4, 6, 8, 10, 12] }, { y: 7, xs: [0, 2, 4, 6, 8, 10, 12] }, { y: 11, xs: [2, 4, 6, 8, 10, 12] }] },
    { layer: 1, rows: [{ y: 1, xs: [1, 3, 5, 7, 9] }, { y: 4, xs: [1, 3, 5, 7, 9] }, { y: 8, xs: [1, 3, 5, 7, 9] }] },
    { layer: 2, rows: [{ y: 0, xs: [1, 5, 9] }, { y: 6, xs: [1, 5, 9] }, { y: 10, xs: [1, 5, 9] }] },
    { layer: 3, rows: [{ y: 3, xs: [1, 5, 9] }, { y: 9, xs: [1, 5, 9] }] },
  ],
});
export const TRIPLE_SUPER_HARD_LAYOUT_V4 = defineTemplate({
  id: "super-hard-75-v4", gridWidth: 14, gridHeight: 16,
  layerMasks: [
    { layer: 0, rows: [{ y: 0, xs: [0, 4, 6, 10] }, { y: 3, xs: [0, 2, 4, 6, 8, 10] }, { y: 7, xs: [0, 2, 4, 6, 8, 10, 12] }, { y: 11, xs: [0, 2, 4, 6, 8, 10, 12] }, { y: 14, xs: [0, 2, 4, 6, 8, 10] }] },
    { layer: 1, rows: [{ y: 1, xs: [1, 3, 5, 7, 9, 11] }, { y: 4, xs: [1, 3, 5, 7, 9, 11] }, { y: 8, xs: [1, 3, 5, 7, 9, 11] }] },
    { layer: 2, rows: [{ y: 0, xs: [1, 5, 9] }, { y: 5, xs: [1, 5, 9] }, { y: 9, xs: [1, 5, 9] }, { y: 12, xs: [1, 5, 9] }, { y: 14, xs: [1, 5, 9] }] },
    { layer: 3, rows: [{ y: 4, xs: [2, 6, 10] }, { y: 8, xs: [2, 6, 10] }, { y: 13, xs: [2, 6, 10] }] },
    { layer: 4, rows: [{ y: 7, xs: [3, 7, 11] }] },
  ],
});

// V5 adds one layer to every standard mode.  The masks deliberately retain
// staggered silhouettes rather than turning the boards into regular grids.
export const TRIPLE_EASY_LAYOUT = defineTemplate({
  id: "easy-27-v5", gridWidth: 10, gridHeight: 11,
  layerMasks: [
    { layer: 0, rows: [{ y: 0, xs: [2, 4] }, { y: 3, xs: [0, 2, 4, 6] }, { y: 6, xs: [0, 2, 4, 6] }, { y: 9, xs: [2, 4] }] },
    { layer: 1, rows: [{ y: 1, xs: [1, 3, 5] }, { y: 4, xs: [1, 3, 5] }, { y: 7, xs: [1, 3, 5] }] },
    { layer: 2, rows: [{ y: 1, xs: [0, 4] }, { y: 4, xs: [0, 4] }, { y: 7, xs: [0, 4] }] },
  ],
});
export const TRIPLE_NORMAL_LAYOUT = defineTemplate({
  id: "normal-45-v5", gridWidth: 12, gridHeight: 13,
  layerMasks: [
    { layer: 0, rows: [{ y: 0, xs: [2, 4, 6, 8] }, { y: 4, xs: [0, 2, 4, 6, 8, 10] }, { y: 8, xs: [0, 2, 4, 6, 8, 10] }, { y: 11, xs: [4, 6] }] },
    { layer: 1, rows: [{ y: 1, xs: [1, 3, 5, 7] }, { y: 5, xs: [1, 3, 5, 7] }, { y: 9, xs: [1, 3, 5, 7] }] },
    { layer: 2, rows: [{ y: 2, xs: [2, 4, 6] }, { y: 6, xs: [2, 6, 8] }, { y: 10, xs: [1, 5, 8] }] },
    { layer: 3, rows: [{ y: 3, xs: [3, 7] }, { y: 7, xs: [3, 7] }, { y: 11, xs: [2, 8] }] },
  ],
});
export const TRIPLE_HARD_LAYOUT = defineTemplate({
  id: "hard-63-v5", gridWidth: 14, gridHeight: 15,
  layerMasks: [
    { layer: 0, rows: [{ y: 0, xs: [2, 4, 6, 8] }, { y: 3, xs: [0, 2, 4, 6, 8, 10, 12] }, { y: 7, xs: [0, 2, 4, 6, 8, 10, 12] }, { y: 11, xs: [2, 4, 6, 8, 10, 12] }] },
    { layer: 1, rows: [{ y: 1, xs: [1, 3, 5, 7, 9] }, { y: 4, xs: [0, 2, 5, 7, 10] }, { y: 8, xs: [1, 3, 5, 7, 9] }] },
    { layer: 2, rows: [{ y: 0, xs: [0, 5, 9] }, { y: 5, xs: [1, 5, 9] }, { y: 9, xs: [0, 4, 8] }, { y: 12, xs: [3, 7, 11] }] },
    { layer: 3, rows: [{ y: 2, xs: [1, 4, 8] }, { y: 9, xs: [1, 5, 9] }] },
    { layer: 4, rows: [{ y: 6, xs: [1, 5, 9] }, { y: 13, xs: [3, 7, 11] }] },
  ],
});
export const TRIPLE_SUPER_HARD_LAYOUT = defineTemplate({
  id: "super-hard-96-v5", gridWidth: 14, gridHeight: 20,
  layerMasks: [
    { layer: 0, rows: [{ y: 0, xs: [0, 4, 6, 10] }, { y: 3, xs: [0, 2, 4, 6, 8, 12] }, { y: 7, xs: [0, 2, 4, 6, 8, 10, 12] }, { y: 11, xs: [0, 2, 4, 6, 8, 10, 12] }, { y: 15, xs: [0, 2, 4, 6, 8, 10] }] },
    { layer: 1, rows: [{ y: 1, xs: [1, 3, 5, 7, 9, 11] }, { y: 4, xs: [0, 2, 5, 7, 9, 12] }, { y: 8, xs: [1, 5, 9] }, { y: 12, xs: [1, 3, 5] }, { y: 16, xs: [1, 5, 9] }] },
    { layer: 2, rows: [{ y: 0, xs: [1, 5, 9] }, { y: 5, xs: [0, 4, 8] }, { y: 9, xs: [0, 4, 8] }, { y: 12, xs: [0, 4, 8] }, { y: 16, xs: [0, 4, 8] }, { y: 17, xs: [2, 6, 10] }] },
    { layer: 3, rows: [{ y: 3, xs: [1, 5, 10] }, { y: 6, xs: [1, 5, 9] }, { y: 10, xs: [1, 5, 9] }, { y: 14, xs: [1, 5, 9] }] },
    { layer: 4, rows: [{ y: 5, xs: [3, 7, 11] }, { y: 9, xs: [1, 5, 9] }, { y: 13, xs: [1, 5, 9] }] },
    { layer: 5, rows: [{ y: 8, xs: [0, 4, 8] }, { y: 18, xs: [1, 5, 9] }] },
  ],
});

export const TRIPLE_CHALLENGE_18_LAYOUT = defineTemplate({
  id: "challenge-18-v1",
  gridWidth: 12,
  gridHeight: 10,
  layerMasks: [
    {
      layer: 0,
      rows: [
        { y: 1, xs: [1, 3, 5, 7] },
        { y: 4, xs: [1, 3, 5, 7] },
        { y: 7, xs: [1, 3, 5, 7] },
      ],
    },
    {
      layer: 1,
      rows: [
        { y: 2, xs: [2, 4, 6] },
        { y: 5, xs: [2, 4, 6] },
      ],
    },
  ],
});

export const TRIPLE_CHALLENGE_24_LAYOUT = defineTemplate({
  id: "challenge-24-v2", gridWidth: 12, gridHeight: 12,
  layerMasks: [
    { layer: 0, rows: [{ y: 0, xs: [4, 6] }, { y: 2, xs: [2, 4, 6, 8] }, { y: 5, xs: [0, 2, 4, 6, 8, 10] }, { y: 8, xs: [2, 4, 6, 8] }] },
    { layer: 1, rows: [{ y: 1, xs: [3, 5, 7] }, { y: 4, xs: [1, 3, 5, 7, 9] }] },
  ],
});

export const TRIPLE_CHALLENGE_30_LAYOUT = defineTemplate({
  id: "challenge-30-v1",
  gridWidth: 14,
  gridHeight: 11,
  layerMasks: [
    {
      layer: 0,
      rows: [
        { y: 1, xs: [1, 3, 5, 7, 9, 11] },
        { y: 4, xs: [1, 3, 5, 7, 9, 11] },
        { y: 7, xs: [1, 3, 5, 7, 9, 11] },
      ],
    },
    {
      layer: 1,
      rows: [
        { y: 2, xs: [2, 4, 6] },
        { y: 5, xs: [2, 6] },
        { y: 8, xs: [2, 4, 6] },
      ],
    },
    { layer: 2, rows: [{ y: 3, xs: [1, 3, 5, 7] }] },
  ],
});

export const TRIPLE_CHALLENGE_42_LAYOUT = defineTemplate({
  id: "challenge-42-v1",
  gridWidth: 14,
  gridHeight: 11,
  layerMasks: [
    { layer: 0, rows: [{ y: 1, xs: [1, 3, 5, 7, 9, 11] }, { y: 3, xs: [1, 3, 5, 7, 9, 11] }, { y: 5, xs: [1, 3, 5, 7, 9, 11] }, { y: 8, xs: [1, 3, 5, 7, 9, 11] }] },
    { layer: 1, rows: [{ y: 0, xs: [1, 5, 9] }, { y: 2, xs: [3, 7, 11] }, { y: 6, xs: [1, 5, 9] }] },
    { layer: 2, rows: [{ y: 0, xs: [2, 6, 10] }, { y: 3, xs: [2, 6, 10] }] },
    { layer: 3, rows: [{ y: 1, xs: [2, 6, 10] }] },
  ],
});

export const TRIPLE_CHALLENGE_60_LAYOUT = defineTemplate({
  id: "challenge-60-v2", gridWidth: 14, gridHeight: 16,
  layerMasks: [
    { layer: 0, rows: [{ y: 0, xs: [0, 2, 4, 6, 8, 10] }, { y: 3, xs: [0, 2, 4, 6, 8, 10] }, { y: 7, xs: [0, 2, 4, 6, 8, 10] }, { y: 11, xs: [0, 2, 4, 6, 8, 10] }, { y: 14, xs: [0, 2, 4] }] },
    { layer: 1, rows: [{ y: 1, xs: [1, 3, 5, 7, 9] }, { y: 4, xs: [1, 3, 5, 7, 9] }, { y: 8, xs: [1, 3, 5, 7, 9] }] },
    { layer: 2, rows: [{ y: 0, xs: [1, 5, 9] }, { y: 5, xs: [1, 5, 9] }, { y: 9, xs: [1, 5, 9] }, { y: 13, xs: [1, 3, 5] }] },
    { layer: 3, rows: [{ y: 4, xs: [2, 6, 10] }, { y: 10, xs: [2, 6, 10] }] },
  ],
});

export const TRIPLE_CHALLENGE_48_LAYOUT = defineTemplate({
  id: "challenge-48-v1",
  gridWidth: 14,
  gridHeight: 10,
  layerMasks: [
    {
      layer: 0,
      rows: [
        { y: 1, xs: [1, 3, 5, 7, 9, 11] },
        { y: 3, xs: [1, 3, 5, 7, 9, 11] },
        { y: 5, xs: [1, 3, 5, 7, 9, 11] },
      ],
    },
    {
      layer: 1,
      rows: [
        { y: 0, xs: [1, 5, 9] },
        { y: 2, xs: [3, 7, 11] },
        { y: 4, xs: [1, 5, 9] },
        { y: 6, xs: [3, 7, 11] },
      ],
    },
    {
      layer: 2,
      rows: [
        { y: 1, xs: [2, 6, 10] },
        { y: 3, xs: [2, 6, 10] },
        { y: 5, xs: [2, 6, 10] },
      ],
    },
    {
      layer: 3,
      rows: [
        { y: 2, xs: [2, 6, 10] },
        { y: 6, xs: [2, 6, 10] },
      ],
    },
    { layer: 4, rows: [{ y: 7, xs: [2, 6, 10] }] },
  ],
});

export const TRIPLE_CHALLENGE_STAGES = Object.freeze([
  Object.freeze({ level: 1, tileCount: 18, layerCount: 2, layoutId: "easy-18-v4", timeSeconds: 75, solverBudget: Object.freeze({ maxNodes: 5000, maxMemo: 2000, deadlineMs: 20 }) }),
  Object.freeze({ level: 2, tileCount: 24, layerCount: 2, layoutId: "challenge-24-v2", timeSeconds: 85, solverBudget: Object.freeze({ maxNodes: 8000, maxMemo: 3000, deadlineMs: 30 }) }),
  Object.freeze({ level: 3, tileCount: 36, layerCount: 3, layoutId: "normal-36-v4", timeSeconds: 105, solverBudget: Object.freeze({ maxNodes: 15000, maxMemo: 6000, deadlineMs: 50 }) }),
  Object.freeze({ level: 4, tileCount: 42, layerCount: 4, layoutId: "challenge-42-v1", timeSeconds: 120, solverBudget: Object.freeze({ maxNodes: 30000, maxMemo: 12000, deadlineMs: 80 }) }),
  Object.freeze({ level: 5, tileCount: 54, layerCount: 4, layoutId: "hard-54-v4", timeSeconds: 150, solverBudget: Object.freeze({ maxNodes: 75000, maxMemo: 30000, deadlineMs: 150 }) }),
  Object.freeze({ level: 6, tileCount: 60, layerCount: 4, layoutId: "challenge-60-v2", timeSeconds: 175, solverBudget: Object.freeze({ maxNodes: 100000, maxMemo: 40000, deadlineMs: 250 }) }),
  Object.freeze({ level: 7, tileCount: 75, layerCount: 5, layoutId: "super-hard-75-v4", timeSeconds: 210, solverBudget: Object.freeze({ maxNodes: 150000, maxMemo: 60000, deadlineMs: 400 }) }),
]);

export const TRIPLE_EASY_SOLVER_BUDGET = Object.freeze({
  maxNodes: 5000,
  maxMemo: 2000,
  deadlineMs: 30,
});
export const TRIPLE_EASY_GENERATOR_BUDGET = Object.freeze({ maxAttempts: 12 });
export const TRIPLE_EASY_FALLBACK_SEED = "triple-easy-v2-fallback";
export const TRIPLE_HARD_SOLVER_BUDGET = Object.freeze({
  maxNodes: 50000,
  maxMemo: 20000,
  deadlineMs: 100,
});
export const TRIPLE_SUPER_HARD_SOLVER_BUDGET = Object.freeze({
  maxNodes: 150000,
  maxMemo: 60000,
  deadlineMs: 400,
});
export function getTripleModeConfig(mode) {
  const config = [
    TRIPLE_EASY_CONFIG,
    TRIPLE_NORMAL_CONFIG,
    TRIPLE_HARD_CONFIG,
    TRIPLE_SUPER_HARD_CONFIG,
    TRIPLE_ENDLESS_CONFIG,
    TRIPLE_CHALLENGE_CONFIG,
  ].find((candidate) => candidate.mode === mode);
  if (!config) throw new TypeError(`Unsupported Triple mode: ${mode}`);
  return config;
}

export function getTripleChallengeStage(level = 1) {
  const normalizedLevel = Math.floor(Number(level) || 0);
  const stage = TRIPLE_CHALLENGE_STAGES.find((candidate) => candidate.level === normalizedLevel);
  if (!stage) throw new RangeError(`Unsupported Triple Challenge level: ${level}`);
  return stage;
}

export function isTripleChallengeComplete(level) {
  return Number(level) >= TRIPLE_CHALLENGE_STAGES.at(-1).level;
}
export const TRIPLE_PRODUCT_DECISIONS = Object.freeze({
  trayCapacity: 7,
  initialItems: Object.freeze({ hint: 3 }),
  itemPrices: Object.freeze({
    hint: 8,
    timePerSecond: 2,
    undo: 15,
    shuffle: 15,
  }),
  starPointsPerTriple: Object.freeze({ one: 12, two: 18, three: 25 }),
  endlessStarPointsPerTriple: Object.freeze({ one: 10, two: 15, three: 20 }),
  excludedItems: Object.freeze(["thunder", "freeze", "tray-expand"]),
  milestones: Object.freeze({
    target: 45,
    step: 3,
    rewards: Object.freeze([
      Object.freeze({ coins: 2 }),
      Object.freeze({ time: 2, endlessCoins: 2 }),
      Object.freeze({ hint: 1 }),
      Object.freeze({ coins: 3 }),
      Object.freeze({ undo: 1 }),
      Object.freeze({ time: 3, endlessCoins: 3 }),
      Object.freeze({ coins: 5 }),
      Object.freeze({ hint: 1 }),
      Object.freeze({ shuffle: 1 }),
      Object.freeze({ coins: 10, hint: 1 }),
      Object.freeze({ coins: 3 }),
      Object.freeze({ hint: 1 }),
      Object.freeze({ coins: 5 }),
      Object.freeze({ undo: 1 }),
      Object.freeze({ coins: 15, hint: 1 }),
    ]),
    itemFallbackCoins: Object.freeze({ hint: 4, undo: 8, shuffle: 8 }),
  }),
});

export function getTripleMilestoneReward(index, mode) {
  const reward = TRIPLE_PRODUCT_DECISIONS.milestones.rewards[index - 1];
  if (!reward) throw new RangeError(`Unsupported Triple milestone: ${index}`);
  const { endlessCoins, ...standard } = reward;
  if (mode === "endless" && endlessCoins) {
    const { time, ...withoutTime } = standard;
    return Object.freeze({ ...withoutTime, coins: (withoutTime.coins || 0) + endlessCoins });
  }
  return standard;
}
export function calculateTripleMatchScore(combo) {
  const normalizedCombo = Math.max(1, Math.floor(Number(combo) || 0));
  return (
    TRIPLE_RULES.baseMatchScore +
    (normalizedCombo - 1) * TRIPLE_RULES.comboScoreStep
  );
}

export function getTripleStarProgress({ mode, score }) {
  const thresholds = mode === "endless"
    ? TRIPLE_PRODUCT_DECISIONS.endlessStarPointsPerTriple
    : TRIPLE_PRODUCT_DECISIONS.starPointsPerTriple;
  const normalizedScore = Math.max(0, Math.floor(Number(score) || 0));
  const stars = normalizedScore >= thresholds.three
    ? 3
    : normalizedScore >= thresholds.two
      ? 2
      : normalizedScore >= thresholds.one
        ? 1
        : 0;
  return Object.freeze({
    stars,
    score: normalizedScore,
    thresholds,
    nextThreshold: stars === 3 ? null : Object.values(thresholds)[stars],
  });
}

const TRIPLE_MODE_COIN_RATE = Object.freeze({
  easy: Object.freeze({ perTriple: 0.5, base: 2 }),
  normal: Object.freeze({ perTriple: 0.5, base: 3 }),
  hard: Object.freeze({ perTriple: 0.6, base: 4 }),
  superHard: Object.freeze({ perTriple: 0.7, base: 5 }),
  endless: Object.freeze({ perTriple: 0.6, base: 3 }),
  challenge: Object.freeze({ perTriple: 0.5, base: 3 }),
});

export function calculateTripleCoinReward({ mode, matchedTriples, stars, maxCombo }) {
  const rate = TRIPLE_MODE_COIN_RATE[mode] || TRIPLE_MODE_COIN_RATE.easy;
  const triples = Math.max(0, Math.floor(Number(matchedTriples) || 0));
  const starBonus = Math.max(0, Math.min(3, Math.floor(stars || 0))) * 2;
  const comboBonus = Math.max(0, Math.min(5, Math.floor(maxCombo || 0)));
  return Math.round(rate.base + triples * rate.perTriple + starBonus + comboBonus);
}
