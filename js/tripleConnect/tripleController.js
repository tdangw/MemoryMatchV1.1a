import { generateEasyTripleBoard, generateEndlessTripleBoard, generateHardTripleBoard, generateNormalTripleBoard, generateSuperHardTripleBoard } from "./tripleBoard.js";
import { reduceTripleCommand } from "./tripleRules.js";
import { createTripleRoundState, restoreSerializedTripleRoundState, serializeTripleRoundState } from "./tripleState.js";
import { createTripleRenderer } from "./tripleRenderer.js";
import { getTripleShell } from "./tripleShell.js";
import { presentTripleTransition } from "./triplePresentation.js";
import { getActiveSession, saveActiveSession } from "../sessionProgress.js";

const development = import.meta.env?.DEV === true;
let state = null;
let renderer = null;
let presenting = false;

export function startTripleConnectDevelopmentRound({ seed = "triple-dev", mode = "easy" } = {}) {
  if (!development) throw new Error("Triple Connect development hook is unavailable in production.");
  const generators = { easy: generateEasyTripleBoard, normal: generateNormalTripleBoard, hard: generateHardTripleBoard, superHard: generateSuperHardTripleBoard, endless: generateEndlessTripleBoard };
  const generate = generators[mode];
  if (!generate) throw new TypeError(`Unsupported Triple development mode: ${mode}`);
  const generated = generate({ seed });
  state = createTripleRoundState(generated.board);
  return mountTripleDevelopmentRound(generated);
}

export function continueTripleConnectDevelopmentRound() {
  if (!development) throw new Error("Triple Connect development hook is unavailable in production.");
  const session = getActiveSession("triple-connect", "easy");
  if (!session?.snapshot) return null;
  state = restoreSerializedTripleRoundState(session.snapshot);
  return mountTripleDevelopmentRound({ seed: "restored", board: null, witness: [] });
}

function mountTripleDevelopmentRound(generated) {
  const shell = getTripleShell();
  const scope = shell.mount();
  presenting = false;
  renderer ||= createTripleRenderer(shell);
  renderer.render(state);
  scope.listen(shell.refs.board, "click", event => {
    const tileId = event.target.closest("[data-tile-id]")?.dataset.tileId;
    if (!tileId || presenting) return;
    const transition = reduceTripleCommand(state, { type: "select-tile", tileId });
    if (!transition.result.ok) return;
    const previous = state;
    state = transition.nextState;
    presenting = transition.events.some(event => event.type === "triple-resolved");
    presentTripleTransition({ shell, scope, previous, next: state, events: transition.events, render: renderer.render })
      .finally(() => {
        if (!scope.active) return;
        presenting = false;
        saveActiveSession("triple-connect", { mode: "easy", level: 1, snapshot: serializeTripleRoundState(state) });
      });
  });
  return { generated, getState: () => state, shell };
}
