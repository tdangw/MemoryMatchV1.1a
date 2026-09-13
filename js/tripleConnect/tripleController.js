import { generateEasyTripleBoard, generateEndlessTripleBoard, generateHardTripleBoard, generateNormalTripleBoard, generateSuperHardTripleBoard, getTripleLayout } from "./tripleBoard.js";
import { reduceTripleCommand } from "./tripleRules.js";
import { createTripleRoundState, restoreSerializedTripleRoundState, serializeTripleRoundState } from "./tripleState.js";
import { createTripleRenderer } from "./tripleRenderer.js";
import { getTripleShell } from "./tripleShell.js";
import { presentTripleTransition } from "./triplePresentation.js";
import { getActiveSession, saveActiveSession } from "../sessionProgress.js";
import { consumeTripleItem, getTripleItemCount } from "./tripleItems.js";
import { getTripleHintTileIds } from "./tripleHint.js";

const development = import.meta.env?.DEV === true;
let state = null;
let renderer = null;
let presenting = false;
let currentMode = "easy";
let currentLayout = null;

export function startTripleConnectDevelopmentRound({ seed = "triple-dev", mode = "easy" } = {}) {
  if (!development) throw new Error("Triple Connect development hook is unavailable in production.");
  const generators = { easy: generateEasyTripleBoard, normal: generateNormalTripleBoard, hard: generateHardTripleBoard, superHard: generateSuperHardTripleBoard, endless: generateEndlessTripleBoard };
  const generate = generators[mode];
  if (!generate) throw new TypeError(`Unsupported Triple development mode: ${mode}`);
  const generated = generate({ seed });
  state = createTripleRoundState(generated.board);
  currentMode = mode;
  currentLayout = getTripleLayout(generated.layoutId);
  return mountTripleDevelopmentRound(generated);
}

export function continueTripleConnectDevelopmentRound({ mode = "easy" } = {}) {
  if (!development) throw new Error("Triple Connect development hook is unavailable in production.");
  const session = getActiveSession("triple-connect", mode);
  if (!session?.snapshot) return null;
  state = restoreSerializedTripleRoundState(session.snapshot);
  currentMode = mode;
  currentLayout = getTripleLayout(session.layoutId || inferLayoutId(state));
  return mountTripleDevelopmentRound({ seed: "restored", board: null, witness: [] });
}

function mountTripleDevelopmentRound(generated) {
  const shell = getTripleShell();
  const scope = shell.mount();
  presenting = false;
  renderer ||= createTripleRenderer(shell);
  const render = (roundState) => renderer.render(roundState, currentLayout, { hint: getTripleItemCount("hint") });
  render(state);
  scope.listen(shell.refs.board, "click", event => {
    const tileId = event.target.closest("[data-tile-id]")?.dataset.tileId;
    if (!tileId || presenting) return;
    const transition = reduceTripleCommand(state, { type: "select-tile", tileId });
    if (!transition.result.ok) return;
    const previous = state;
    state = transition.nextState;
    presenting = transition.events.some(event => event.type === "triple-resolved");
    presentTripleTransition({ shell, scope, previous, next: state, events: transition.events, render })
      .finally(() => {
        if (!scope.active) return;
        presenting = false;
        saveActiveSession("triple-connect", { mode: currentMode, level: 1, layoutId: currentLayout.id, snapshot: serializeTripleRoundState(state) });
      });
  });
  scope.listen(shell.refs.root.querySelector('[data-triple-item="hint"]'), "click", () => {
    if (presenting || state.status !== "playing") return;
    const tileIds = getTripleHintTileIds(state);
    if (!tileIds.length || !consumeTripleItem("hint")) return;
    tileIds.forEach((tileId) => renderer.nodes.get(tileId)?.classList.add("is-hinted"));
    render(state);
    scope.timeout(() => tileIds.forEach((tileId) => renderer.nodes.get(tileId)?.classList.remove("is-hinted")), 900);
  });
  return { generated, getState: () => state, shell };
}

function inferLayoutId(roundState) {
  const count = Object.keys(roundState.tiles).length;
  if (count === 12) return "easy-12-v1";
  if (count === 24) return "normal-24-v1";
  if (count === 36) return "hard-36-v1";
  return "super-hard-60-v1";
}
