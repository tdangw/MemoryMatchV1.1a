import { normalizePath } from "./effectGeometry.js";
import { createEffectRuntime } from "./effectRuntime.js";

const SVG_NS = "http://www.w3.org/2000/svg";

function svgNode(name, className) {
  const node = document.createElementNS(SVG_NS, name);
  node.setAttribute("class", className);
  return node;
}

function ensureSurface(surface) {
  let nodes = surface.__effectV2ConnectionNodes;
  if (nodes?.beam?.isConnected && Array.isArray(nodes.decorationNodes)) return nodes;
  const glow = svgNode("polyline", "link-path-overlay__glow");
  const beam = svgNode("polyline", "link-path-overlay__beam");
  const decoration = svgNode("g", "effect-v2-connection__decorations");
  const decorationNodes = Array.from({ length: 8 }, (_, index) => {
    const node = svgNode("circle", "effect-v2-connection__decoration");
    node.dataset.effectDecoration = String(index);
    node.setAttribute("display", "none");
    decoration.append(node);
    return node;
  });
  glow.setAttribute("pathLength", "1");
  beam.setAttribute("pathLength", "1");
  surface.replaceChildren(glow, beam, decoration);
  nodes = { glow, beam, decoration, decorationNodes };
  surface.__effectV2ConnectionNodes = nodes;
  return nodes;
}

function restartConnectionAnimations(nodes) {
  const animations = [nodes.glow, nodes.beam]
    .flatMap((node) => node.getAnimations({ subtree: false }));
  animations.forEach((animation) => {
    animation.currentTime = 0;
    animation.play();
  });
}

function seededJitter(points, seed) {
  let value = (seed >>> 0) || 1;
  const next = () => {
    value = Math.imul(value, 1664525) + 1013904223 >>> 0;
    return value / 0x1_0000_0000;
  };
  return points.flatMap((point, index) => {
    const end = points[index + 1];
    if (!end) return [point];
    const horizontal = Math.abs(end.x - point.x) >= Math.abs(end.y - point.y);
    const distance = horizontal ? Math.abs(end.x - point.x) : Math.abs(end.y - point.y);
    const steps = Math.max(1, Math.ceil(distance / 7));
    return Array.from({ length: steps }, (_, step) => {
      if (!step) return point;
      const progress = step / steps;
      const jitter = (next() - .5) * 1.3;
      return horizontal
        ? { x: point.x + (end.x - point.x) * progress, y: point.y + jitter }
        : { x: point.x + jitter, y: point.y + (end.y - point.y) * progress };
    });
  });
}

const DECORATION_COUNTS = Object.freeze({
  tracer: 1, jagged: 2, "dual-stroke": 0, sparks: 4, symbols: 3,
  packets: 4, gradient: 0, wave: 3, helix: 4, motes: 4, ribbon: 2,
  dash: 3, projectile: 2, charge: 2, rings: 3, links: 4, wavelets: 3,
  droplets: 4,
});

function renderDecorations(nodes, points, family) {
  const count = DECORATION_COUNTS[family] || 1;
  const last = points.at(-1);
  nodes.decoration.dataset.family = family;
  nodes.decorationNodes.forEach((node, index) => {
    const visible = index < count && last;
    node.setAttribute("display", visible ? "" : "none");
    if (!visible) return;
    const source = points[Math.min(points.length - 1, Math.floor((index + 1) * points.length / (count + 1)))];
    const endImpact = index === count - 1;
    const x = endImpact ? last.x : source.x;
    const y = endImpact ? last.y : source.y;
    node.setAttribute("cx", x);
    node.setAttribute("cy", y);
    node.setAttribute("r", family === "rings" || family === "wavelets" ? String(1.4 + index * .75) : family === "charge" ? String(1.5 + index) : "1.35");
    node.setAttribute("class", `effect-v2-connection__decoration effect-v2-connection__decoration--${family}`);
  });
}

function renderFamilyPath(points, family, seed) {
  if (family === "jagged") return seededJitter(points, seed);
  if (["helix", "wave", "wavelets", "ribbon"].includes(family)) {
    return points.flatMap((point, index) => {
      const end = points[index + 1];
      if (!end) return [point];
      const steps = Math.min(8, Math.max(2, Math.ceil(Math.hypot(end.x - point.x, end.y - point.y) / 12)));
      return Array.from({ length: steps }, (_, step) => {
        if (!step) return point;
        const progress = step / steps;
        const amplitude = family === "ribbon" ? 1.2 : family === "helix" ? 1.8 : 1;
        const offset = Math.sin(progress * Math.PI * (family === "helix" ? 4 : 2)) * amplitude;
        return { x: point.x + (end.x - point.x) * progress + (end.y - point.y) * offset / 20, y: point.y + (end.y - point.y) * progress - (end.x - point.x) * offset / 20 };
      });
    });
  }
  return points;
}

export function renderConnectionV2({ surface, points, effect, seed = 1 }) {
  if (!surface || !effect) return false;
  const normalized = normalizePath(points);
  const family = effect.family || "tracer";
  const rendered = renderFamilyPath(normalized, family, seed);
  const serialized = rendered.map(point => `${point.x},${point.y}`).join(" ");
  const nodes = ensureSurface(surface);
  surface.setAttribute("viewBox", "0 0 100 100");
  surface.setAttribute("preserveAspectRatio", "none");
  surface.setAttribute("class", `link-path-overlay effect-v2-connection link-path-overlay--${effect.id}`);
  nodes.glow.setAttribute("points", serialized);
  nodes.beam.setAttribute("points", serialized);
  renderDecorations(nodes, rendered, family);
  restartConnectionAnimations(nodes);
  surface.classList.add("is-visible");
  surface.__effectV2ConnectionHandle?.dispose();
  surface.__effectV2ConnectionHandle = createEffectRuntime().run({
    type: "connection",
    duration: effect.duration || (effect.id === "bullet" ? 180 : 320),
  });
  return true;
}

export function clearConnectionV2(surface) {
  if (!surface) return;
  surface.__effectV2ConnectionHandle?.dispose();
  surface.__effectV2ConnectionHandle = null;
  const nodes = surface.__effectV2ConnectionNodes;
  nodes?.glow?.removeAttribute("points");
  nodes?.beam?.removeAttribute("points");
  nodes?.decorationNodes?.forEach((node) => node.setAttribute("display", "none"));
  surface.classList.remove("is-visible");
}
