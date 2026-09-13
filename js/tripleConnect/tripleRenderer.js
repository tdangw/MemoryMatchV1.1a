export function createTripleRenderer(shell) {
  const root = shell.refs.root;
  const board = root.querySelector(".triple-connect__board");
  const tray = root.querySelector(".triple-connect__tray");
  const nodes = new Map();
  function render(state, layout, itemCounts = {}) {
    const slots = new Map(layout.slots.map(slot => [slot.id, slot]));
    const live = new Set();
    for (const tile of Object.values(state.tiles)) {
      if (tile.location === "removed") continue;
      live.add(tile.id);
      let node = nodes.get(tile.id);
      if (!node) {
        node = document.createElement("button"); node.type = "button"; node.className = "triple-connect__tile"; node.dataset.tileId = tile.id; node.textContent = tile.type;
        nodes.set(tile.id, node);
      }
      const exposed = tile.location === "board" && state.coverGraph[tile.id].every(id => state.tiles[id].location !== "board");
      node.disabled = !exposed; node.setAttribute("aria-disabled", String(!exposed));
      if (tile.location === "tray") tray.append(node);
      else {
        const slot = slots.get(tile.slotId);
        if (!slot) throw new Error(`Missing Triple layout slot: ${tile.slotId}`);
        node.style.setProperty("--x", slot.x); node.style.setProperty("--y", slot.y); node.style.zIndex = String(tile.layer + 1); board.append(node);
      }
    }
    for (const [id, node] of nodes) if (!live.has(id)) { node.remove(); nodes.delete(id); }
    for (const [name, value] of Object.entries({ moves: state.moves, misses: state.misses, combo: state.combo, score: state.score, matched: state.matchedTriples })) {
      const target = root.querySelector(`[data-triple-stat="${name}"]`); if (target?.textContent !== String(value)) target.textContent = String(value);
    }
    for (const [id, count] of Object.entries(itemCounts)) {
      const target = root.querySelector(`[data-triple-item-count="${id}"]`);
      if (target?.textContent !== String(count)) target.textContent = String(count);
    }
  }
  return { render, nodes };
}
