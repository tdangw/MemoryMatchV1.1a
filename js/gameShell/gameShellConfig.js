// Presentation only. Gameplay rules and clocks remain in gameplayTuning/config.
const px = (value, min = 0) => ({ value, unit: "px", min });
const ms = value => ({ value, unit: "ms", min: 0 });

function freeze(value) {
  Object.values(value).forEach(child => {
    if (child && typeof child === "object") freeze(child);
  });
  return Object.freeze(value);
}

export const GAME_SHELL_SCHEMA = freeze({
  layout: {
    contentMaxWidth: px(700, 1), gap: px(10), bottomInset: px(0),
    widthRatio: { value: 1, unit: "", min: 0.01, max: 1 },
    mobileWidthRatio: { value: 1, unit: "", min: 0.01, max: 1 },
    sideInset: px(0), mobileSideInset: px(0),
    maxTileSize: px(10000, 1), coordinateGutter: px(0), compactLandscapeMaxRows: { value: 6, unit: "", min: 1, max: 100, integer: true },
    tilePrecision: { value: 1000, unit: "", min: 1, max: 1000, integer: true },
    edgeInsetMin: px(4), edgeInsetMax: px(8),
    edgeInsetRatio: { value: 0.01, unit: "", min: 0, max: 1 },
  },
  breakpoints: { mobile: px(600, 1), narrow: px(420, 1), landscapeHeight: px(600, 1) },
  board: { gap: px(5), narrowGap: px(4), padding: px(8), narrowPadding: px(6) },
  frame: { sidePadding: px(14), narrowSidePadding: px(9), narrowGap: px(9) },
  title: {
    minHeight: px(44), marginBottom: px(8), mobileMarginBottom: px(6),
    fontMin: px(21.6), fontMax: px(44.8), fontFluid: { value: 4, unit: "vw", min: 0 },
    lineHeight: { value: 1.1, unit: "", min: 0.1 }, letterSpacing: px(0.8),
  },
  fullscreen: { size: px(44, 1), iconSize: px(22, 1), radius: px(10), titleGap: px(6), focusFontSize: px(17.6) },
  hud: {
    minHeight: px(34), mobileMinHeight: px(30), radius: px(9),
    sidePadding: px(74), mobileSidePadding: px(104),
    timerHeight: px(3), timerInset: px(6), timerOffset: px(8),
    menuOffset: px(6), landscapeMinWidth: px(390), compactLandscapeWidthRatio: { value: 0.9, unit: "", min: 0.01, max: 1 },
  },
  milestones: { width: px(260, 1), mobileWidth: px(220, 1), trackHeight: px(19), markerSize: px(15), railHeight: px(2) },
  safeArea: { top: px(14), bottom: px(16) },
  layers: { hud: { value: 5000, unit: "", min: 0 }, menu: { value: 6000, unit: "", min: 0 } },
  motion: { star: ms(180), starFill: ms(240), milestoneFill: ms(260), milestoneState: ms(160) },
});

export const GAME_SHELL_DEFAULTS = freeze(Object.fromEntries(
  Object.entries(GAME_SHELL_SCHEMA).map(([group, fields]) => [group,
    Object.fromEntries(Object.entries(fields).map(([name, rule]) => [name, rule.value])),
  ]),
));

const warnedPaths = new Set();
const isRecord = value => value !== null && typeof value === "object"
  && [Object.prototype, null].includes(Object.getPrototypeOf(value));

/** Normalize game.ui overrides; unknown/invalid leaves never reach CSS or layout. */
export function normalizeGameShellConfig(overrides = {}, {
  development = import.meta.env?.DEV ?? true,
  warn = message => console.warn(message),
} = {}) {
  const result = Object.fromEntries(Object.entries(GAME_SHELL_DEFAULTS).map(([group, values]) => [group, { ...values }]));
  const reject = path => {
    const message = `[GameShell] Invalid UI override: ${path}`;
    if (development) throw new TypeError(message);
    if (!warnedPaths.has(path)) {
      warnedPaths.add(path);
      warn(message);
    }
  };
  if (!isRecord(overrides)) {
    reject("ui");
    return freeze(result);
  }
  for (const [group, fields] of Object.entries(overrides)) {
    if (!Object.hasOwn(GAME_SHELL_SCHEMA, group) || !isRecord(fields)) {
      reject(group);
      continue;
    }
    for (const [name, value] of Object.entries(fields)) {
      const rule = GAME_SHELL_SCHEMA[group][name];
      if (!Object.hasOwn(GAME_SHELL_SCHEMA[group], name)
        || typeof value !== "number" || !Number.isFinite(value)
        || value < rule.min || value > (rule.max ?? Infinity)
        || ((group === "layers" || rule.integer) && !Number.isInteger(value))) {
        reject(`${group}.${name}`);
        continue;
      }
      result[group][name] = value;
    }
  }
  if (result.breakpoints.narrow > result.breakpoints.mobile) {
    reject("breakpoints.narrow");
    result.breakpoints.narrow = Math.min(GAME_SHELL_DEFAULTS.breakpoints.narrow, result.breakpoints.mobile);
  }
  if (result.layout.edgeInsetMin > result.layout.edgeInsetMax) {
    reject("layout.edgeInsetMin");
    result.layout.edgeInsetMin = result.layout.edgeInsetMax;
  }
  return freeze(result);
}

const kebab = name => name.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);

/** Pure serialization; adapters can apply the returned variables to their root. */
export function getGameShellCssVariables(overrides, options) {
  const config = normalizeGameShellConfig(overrides, options);
  return Object.fromEntries(Object.entries(GAME_SHELL_SCHEMA).flatMap(([group, fields]) =>
    Object.entries(fields).map(([name, rule]) => [`--shell-${kebab(group)}-${kebab(name)}`, `${config[group][name]}${rule.unit}`]),
  ));
}
