/** A finite six-particle response; no loop, canvas, or per-frame allocation. */
export function mountTouchDust(root, scope, { selector = ".adventure-dock button, .game-selector__choice, .adventure-map-node", cap = 24 } = {}) {
  const layer = document.createElement("div");
  layer.className = "adventure-touch-layer";
  layer.setAttribute("aria-hidden", "true");
  document.body.append(layer);
  scope.own(() => layer.remove(), "node");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  scope.listen(root, "pointerdown", event => {
    const target = event.target.closest(selector);
    if (!target || target.disabled || reduced.matches || document.querySelectorAll(".adventure-touch-particle").length + 6 > cap) return;
    for (let index = 0; index < 6; index += 1) {
      const particle = document.createElement("i");
      particle.className = "adventure-touch-particle";
      particle.style.left = `${event.clientX}px`;
      particle.style.top = `${event.clientY}px`;
      layer.append(particle);
      const release = scope.own(() => particle.remove(), "node");
      const angle = index * Math.PI / 3;
      const animation = particle.animate([
        { transform: "translate(-50%, -50%) scale(1)", opacity: .9 },
        { transform: `translate(${Math.cos(angle) * 26 - 2}px, ${Math.sin(angle) * 26 - 2}px) scale(.2)`, opacity: 0 },
      ], { duration: 600, easing: "cubic-bezier(.2,.7,.3,1)" });
      scope.animation(animation);
      animation.finished.then(release, release);
    }
  }, { passive: true });
  return layer;
}
