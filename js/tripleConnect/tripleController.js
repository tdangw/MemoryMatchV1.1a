import { generateEasyTripleBoard } from "./tripleBoard.js";
import { reduceTripleCommand } from "./tripleRules.js";
import { createTripleRoundState } from "./tripleState.js";
import { createTripleRenderer } from "./tripleRenderer.js";
import { getTripleShell } from "./tripleShell.js";
import { presentTripleTransition } from "./triplePresentation.js";

const development = import.meta.env?.DEV === true;
let state = null;
let renderer = null;
let presenting = false;

export function startTripleConnectDevelopmentRound({ seed = "triple-dev" } = {}) {
  if (!development) throw new Error("Triple Connect development hook is unavailable in production.");
  const generated = generateEasyTripleBoard({ seed });
  state = createTripleRoundState(generated.board);
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
      .finally(() => { if (scope.active) presenting = false; });
  });
  return { generated, getState: () => state, shell };
}
