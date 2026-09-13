export function presentTripleTransition({ shell, scope, previous, next, events, render }) {
  const match = events.find(event => event.type === "triple-resolved");
  if (!match || !scope.active) { render(next); return Promise.resolve(); }
  const line = shell.refs.root.querySelector(".triple-connect__line");
  const nodes = match.tileIds.map(id => shell.refs.root.querySelector(`[data-tile-id="${id}"]`)).filter(Boolean);
  if (nodes.length !== 3) { render(next); return Promise.resolve(); }
  const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  const ghosts = nodes.map(node => { const ghost = node.cloneNode(true); ghost.classList.add("triple-connect__ghost"); return ghost; });
  render(next);
  ghosts.forEach(node => shell.refs.board.append(node));
  const cleanup = () => { line.replaceChildren(); ghosts.forEach(node => node.remove()); };
  const release = scope.own(cleanup, "cleanup");
  if (reduced) { cleanup(); release.forget(); return Promise.resolve(); }
  const points = ghosts.map(node => { const rect = node.getBoundingClientRect(); const base = line.getBoundingClientRect(); return `${rect.left + rect.width / 2 - base.left},${rect.top + rect.height / 2 - base.top}`; });
  line.innerHTML = `<polyline points="${points.join(" ")}" />`;
  const animation = line.animate([{ opacity: 0 }, { opacity: 1 }, { opacity: 0 }], { duration: 240, fill: "both" });
  scope.animation(animation);
  return animation.finished.catch(() => {}).then(() => { cleanup(); release.forget(); });
}
