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
  if (nodes?.beam?.isConnected) return nodes;
  const glow = svgNode("polyline", "link-path-overlay__glow");
  const beam = svgNode("polyline", "link-path-overlay__beam");
  const decoration = svgNode("g", "effect-v2-connection__decorations");
  glow.setAttribute("pathLength", "1");
  beam.setAttribute("pathLength", "1");
  surface.replaceChildren(glow, beam, decoration);
  nodes = { glow, beam, decoration };
  surface.__effectV2ConnectionNodes = nodes;
  return nodes;
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

function appendDecoration(parent, effectId, point) {
  if (!point || ["default", "laser", "rainbow"].includes(effectId)) return;
  const node = svgNode(effectId === "chains" ? "rect" : "circle", `effect-v2-connection__impact effect-v2-connection__impact--${effectId}`);
  node.setAttribute("cx", point.x);
  node.setAttribute("cy", point.y);
  if (node.tagName === "rect") {
    node.setAttribute("x", point.x - 1.8);
    node.setAttribute("y", point.y - 1.8);
    node.setAttribute("width", "3.6");
    node.setAttribute("height", "3.6");
  } else node.setAttribute("r", effectId === "kame" ? "3" : "1.8");
  parent.append(node);
}

export function renderConnectionV2({ surface, points, effect, seed = 1 }) {
  if (!surface || !effect) return false;
  const normalized = normalizePath(points);
  const rendered = ["electric", "spiral", "plasma"].includes(effect.id)
    ? seededJitter(normalized, seed) : normalized;
  const serialized = rendered.map(point => `${point.x},${point.y}`).join(" ");
  const nodes = ensureSurface(surface);
  surface.setAttribute("viewBox", "0 0 100 100");
  surface.setAttribute("preserveAspectRatio", "none");
  surface.setAttribute("class", `link-path-overlay effect-v2-connection link-path-overlay--${effect.id}`);
  nodes.glow.setAttribute("points", serialized);
  nodes.beam.setAttribute("points", serialized);
  nodes.decoration.replaceChildren();
  appendDecoration(nodes.decoration, effect.id, rendered.at(-1));
  surface.classList.add("is-visible");
  surface.__effectV2ConnectionHandle?.dispose();
  surface.__effectV2ConnectionHandle = createEffectRuntime().run({
    type: "connection",
    duration: effect.id === "bullet" ? 180 : 320,
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
  nodes?.decoration?.replaceChildren();
  surface.classList.remove("is-visible");
}
