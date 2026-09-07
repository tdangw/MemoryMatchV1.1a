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
  layout: { contentMaxWidth: px(700, 1), gap: px(10) },
  breakpoints: { mobile: px(600, 1), narrow: px(420, 1), landscapeHeight: px(500, 1) },
  board: { gap: px(6), narrowGap: px(4), padding: px(8), narrowPadding: px(6) },
  hud: {
    minHeight: px(34), mobileMinHeight: px(30), radius: px(9),
    sidePadding: px(74), mobileSidePadding: px(104),
    timerHeight: px(3), timerInset: px(6), timerOffset: px(8),
    menuOffset: px(6),
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
        || value < rule.min || (group === "layers" && !Number.isInteger(value))) {
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
