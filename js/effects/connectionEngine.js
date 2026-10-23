import { normalizePath } from "./effectGeometry.js";
import { createEffectRuntime } from "./effectRuntime.js";

const SVG_NS = "http://www.w3.org/2000/svg";
const MATRIX_DIGIT_COUNT = 16;
const MATRIX_DIGIT_STAGGER_MS = 24;
const CHAIN_LINK_COUNT = 6;
let rainbowGradientSequence = 0;

function svgNode(name, className) {
  const node = document.createElementNS(SVG_NS, name);
  node.setAttribute("class", className);
  return node;
}

function ensureSurface(surface) {
  let nodes = surface.__effectV2ConnectionNodes;
  if (nodes?.beam?.isConnected && Array.isArray(nodes.decorationNodes)
    && Array.isArray(nodes.chainLinkNodes) && Array.isArray(nodes.routeTravelerNodes)) return nodes;
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
  const matrixDigitNodes = Array.from({ length: MATRIX_DIGIT_COUNT }, (_, index) => {
    const node = svgNode("text", "effect-v2-connection__matrix-digit");
    node.dataset.effectMatrixDigit = String(index);
    node.setAttribute("display", "none");
    node.setAttribute("text-anchor", "middle");
    node.setAttribute("dominant-baseline", "middle");
    decoration.append(node);
    return node;
  });
  const chainLinkNodes = Array.from({ length: CHAIN_LINK_COUNT }, (_, index) => {
    const node = svgNode("ellipse", "effect-v2-connection__chain-link");
    node.dataset.effectChainLink = String(index);
    node.setAttribute("display", "none");
    decoration.append(node);
    return node;
  });
  const routeTravelerNodes = Array.from({ length: 2 }, (_, index) => {
    const node = svgNode("circle", "effect-v2-connection__route-traveler");
    const motion = svgNode("animateMotion", "effect-v2-connection__route-motion");
    node.dataset.effectRouteTraveler = String(index);
    node.setAttribute("display", "none");
    motion.setAttribute("begin", "indefinite");
    motion.setAttribute("repeatCount", "1");
    motion.setAttribute("fill", "freeze");
    node.append(motion);
    decoration.append(node);
    return { node, motion };
  });
  glow.setAttribute("pathLength", "1");
  beam.setAttribute("pathLength", "1");
  surface.replaceChildren(glow, beam, decoration);
  nodes = { glow, beam, decoration, decorationNodes, matrixDigitNodes, chainLinkNodes, routeTravelerNodes };
  surface.__effectV2ConnectionNodes = nodes;
  return nodes;
}

function hideMatrixDigits(nodes) {
  nodes?.matrixDigitNodes?.forEach((node) => node.setAttribute("display", "none"));
}

function samplePolyline(points, count) {
  const segments = points.slice(1).map((end, index) => {
    const start = points[index];
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    return { start, dx, dy, length: Math.hypot(dx, dy) || 1 };
  });
  const total = segments.reduce((sum, segment) => sum + segment.length, 0);
  return Array.from({ length: count }, (_, index) => {
    let remaining = total * (index + .5) / count;
    const segment = segments.find((candidate) => {
      if (remaining <= candidate.length) return true;
      remaining -= candidate.length;
      return false;
    }) || segments.at(-1);
    const progress = remaining / segment.length;
    return {
      x: segment.start.x + segment.dx * progress,
      y: segment.start.y + segment.dy * progress,
      tangentX: segment.dx / segment.length,
      tangentY: segment.dy / segment.length,
    };
  });
}

function hideChainLinks(nodes) {
  nodes?.chainLinkNodes?.forEach((node) => node.setAttribute("display", "none"));
}

function stopRouteTravelers(nodes) {
  nodes?.routeTravelerNodes?.forEach(({ node, motion }) => {
    if (typeof motion.endElement === "function") motion.endElement();
    node.setAttribute("display", "none");
  });
}

function renderChainLinks(nodes, points) {
  const samples = samplePolyline(points, nodes.chainLinkNodes.length);
  nodes.decoration.dataset.family = "chains";
  nodes.decorationNodes.forEach((node) => node.setAttribute("display", "none"));
  hideMatrixDigits(nodes);
  nodes.chainLinkNodes.forEach((node, index) => {
    const point = samples[index];
    const angle = Math.atan2(point.tangentY, point.tangentX) * 180 / Math.PI + (index % 2 ? 0 : 90);
    node.setAttribute("display", "");
    node.setAttribute("cx", point.x);
    node.setAttribute("cy", point.y);
    node.setAttribute("rx", "1.45");
    node.setAttribute("ry", ".72");
    node.setAttribute("transform", `rotate(${angle} ${point.x} ${point.y})`);
    node.style.setProperty("--effect-v2-chain-delay", `${index * 52}ms`);
  });
}

function renderRouteTravelers(nodes, points, effectId) {
  const travelerCount = ['meteor', 'link-effect-meteor-route'].includes(effectId) ? 2 : 1;
  const path = `M${points.map(({ x, y }) => `${x} ${y}`).join(" L")}`;
  const duration = effectId === 'link-effect-meteor-route' ? '140ms' : effectId === 'bullet' ? '260ms' : '420ms';
  const reducedMotion = Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches);
  nodes.routeTravelerNodes.forEach(({ node, motion }, index) => {
    const visible = index < travelerCount;
    node.setAttribute("display", visible ? "" : "none");
    if (!visible) return;
    node.setAttribute("class", `effect-v2-connection__route-traveler effect-v2-connection__route-traveler--${effectId}`);
    node.setAttribute("r", effectId === "bullet" ? "1.25" : String(1.12 - index * .2));
    motion.setAttribute("path", path);
    motion.setAttribute("dur", duration);
    if (reducedMotion || typeof motion.beginElementAt !== "function") {
      const point = points.at(-1);
      node.setAttribute("cx", point.x);
      node.setAttribute("cy", point.y);
      return;
    }
    node.setAttribute("cx", "0");
    node.setAttribute("cy", "0");
    motion.beginElementAt(index * (effectId === 'link-effect-meteor-route' ? .02 : .09));
  });
}

function renderMatrixDigits(nodes, points, seed) {
  let value = (seed >>> 0) || 1;
  const nextBit = () => {
    value = Math.imul(value, 1664525) + 1013904223 >>> 0;
    return value >>> 31;
  };
  const samples = samplePolyline(points, nodes.matrixDigitNodes.length);
  nodes.decoration.dataset.family = "matrix";
  nodes.decorationNodes.forEach((node) => node.setAttribute("display", "none"));
  nodes.matrixDigitNodes.forEach((node, index) => {
    const point = samples[index];
    node.setAttribute("display", "");
    node.setAttribute("x", point.x);
    node.setAttribute("y", point.y);
    node.style.setProperty("--effect-v2-matrix-delay", `${index * MATRIX_DIGIT_STAGGER_MS}ms`);
    node.textContent = String(nextBit());
  });
}

function stopHydroBubbles(nodes) {
  nodes?.hydroMotionNodes?.forEach((motion) => {
    if (typeof motion.endElement === "function") motion.endElement();
  });
}

function ensureHydroMotions(nodes) {
  if (nodes.hydroMotionNodes?.length) return nodes.hydroMotionNodes;
  nodes.hydroMotionNodes = nodes.decorationNodes.slice(0, 3).map((bubble) => {
    const motion = svgNode("animateMotion", "effect-v2-connection__hydro-motion");
    motion.setAttribute("begin", "indefinite");
    motion.setAttribute("repeatCount", "1");
    motion.setAttribute("fill", "freeze");
    bubble.append(motion);
    return motion;
  });
  return nodes.hydroMotionNodes;
}

function presentationDuration(surface, effect) {
  const duration = getComputedStyle(surface).getPropertyValue("--link-path-animation-duration").trim();
  return duration || `${effect.duration || 260}ms`;
}

function renderHydroBubbles(nodes, surface, points, effect) {
  const motions = ensureHydroMotions(nodes);
  const path = `M${points.map(({ x, y }) => `${x} ${y}`).join(" L")}`;
  const reducedMotion = Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches);
  const duration = presentationDuration(surface, effect);
  nodes.decoration.dataset.family = "hydro";
  nodes.decorationNodes.forEach((bubble, index) => {
    const visible = index < motions.length;
    bubble.setAttribute("display", visible ? "" : "none");
    if (!visible) return;
    bubble.setAttribute("class", "effect-v2-connection__decoration effect-v2-connection__decoration--hydro");
    bubble.setAttribute("r", String(.58 + index * .14));
    const motion = motions[index];
    motion.setAttribute("path", path);
    motion.setAttribute("dur", duration);
    if (reducedMotion || typeof motion.beginElementAt !== "function") {
      const point = points[Math.floor((index + 1) * points.length / (motions.length + 1))];
      bubble.setAttribute("cx", point.x);
      bubble.setAttribute("cy", point.y);
      return;
    }
    bubble.setAttribute("cx", "0");
    bubble.setAttribute("cy", "0");
    motion.beginElementAt(index * .12);
  });
}

function ensureRainbowGradient(surface, nodes) {
  if (nodes.rainbowGradient?.isConnected) return nodes.rainbowGradient.id;
  const defs = svgNode("defs", "effect-v2-connection__defs");
  const gradient = svgNode("linearGradient", "effect-v2-connection__rainbow-gradient");
  const id = `effect-v2-rainbow-gradient-${rainbowGradientSequence += 1}`;
  gradient.setAttribute("id", id);
  gradient.setAttribute("gradientUnits", "userSpaceOnUse");
  gradient.setAttribute("x1", "0");
  gradient.setAttribute("y1", "0");
  gradient.setAttribute("x2", "100");
  gradient.setAttribute("y2", "100");
  [
    ["0%", "#ff4f5d"], ["16%", "#ff9e35"], ["32%", "#ffe66b"],
    ["48%", "#67e89a"], ["64%", "#58cbff"], ["80%", "#7986ff"], ["100%", "#d88bff"],
  ].forEach(([offset, color]) => {
    const stop = svgNode("stop", "");
    stop.setAttribute("offset", offset);
    stop.setAttribute("stop-color", color);
    gradient.append(stop);
  });
  defs.append(gradient);
  surface.prepend(defs);
  nodes.rainbowGradient = gradient;
  return id;
}

function restartConnectionAnimations(nodes) {
  const animations = [nodes.glow, nodes.beam]
    .flatMap((node) => node.getAnimations({ subtree: false }));
  animations.forEach((animation) => {
    animation.currentTime = 0;
    animation.play();
  });
}

function seededLightning(points, seed, bounds, variant) {
  let value = (seed >>> 0) || 1;
  const next = () => {
    value = Math.imul(value, 1664525) + 1013904223 >>> 0;
    return value / 0x1_0000_0000;
  };
  const width = Math.max(1, bounds.width);
  const height = Math.max(1, bounds.height);
  return points.flatMap((point, index) => {
    const end = points[index + 1];
    if (!end) return [point];
    const dx = (end.x - point.x) * width / 100;
    const dy = (end.y - point.y) * height / 100;
    const distance = Math.hypot(dx, dy);
    const steps = Math.max(8, Math.floor(distance / (variant === "fire" ? 12 : 10)));
    const normalX = -dy / Math.max(1, distance);
    const normalY = dx / Math.max(1, distance);
    return Array.from({ length: steps + 1 }, (_, step) => {
      if (!step) return point;
      const progress = step / steps;
      if (step === steps) return end;
      const offset = (next() - .5) * (variant === "fire" ? 10 : 14);
      return {
        x: point.x + (end.x - point.x) * progress + normalX * offset * 100 / width,
        y: point.y + (end.y - point.y) * progress + normalY * offset * 100 / height,
      };
    });
  });
}

function renderFirePath(points, seed, bounds) {
  let value = (seed >>> 0) || 1;
  const next = () => {
    value = Math.imul(value, 1664525) + 1013904223 >>> 0;
    return value / 0x1_0000_0000;
  };
  const width = Math.max(1, bounds.width);
  const height = Math.max(1, bounds.height);
  return points.flatMap((point, index) => {
    const end = points[index + 1];
    if (!end) return [point];
    const pixelDx = (end.x - point.x) * width / 100;
    const pixelDy = (end.y - point.y) * height / 100;
    const distance = Math.hypot(pixelDx, pixelDy) || 1;
    const normalX = -pixelDy / distance;
    const normalY = pixelDx / distance;
    const steps = Math.min(18, Math.max(7, Math.ceil(distance / 13)));
    const phase = next() * Math.PI * 2;
    return Array.from({ length: steps + 1 }, (_, step) => {
      if (!step) return point;
      if (step === steps) return end;
      const progress = step / steps;
      const envelope = Math.sin(progress * Math.PI);
      const wave = Math.sin(progress * Math.PI * 3 + phase) * 2.8;
      const lick = (next() - .38) * 2.4;
      const offset = (wave + lick) * envelope;
      return {
        x: point.x + (end.x - point.x) * progress + normalX * offset * 100 / width,
        y: point.y + (end.y - point.y) * progress + normalY * offset * 100 / height,
      };
    });
  });
}

function renderPlasmaPath(points) {
  return points.flatMap((point, index) => {
    const end = points[index + 1];
    if (!end) return [point];
    const dx = end.x - point.x;
    const dy = end.y - point.y;
    const distance = Math.hypot(dx, dy) || 1;
    const normalX = -dy / distance;
    const normalY = dx / distance;
    const steps = Math.min(14, Math.max(5, Math.ceil(distance / 5)));
    return Array.from({ length: steps + 1 }, (_, step) => {
      if (!step) return point;
      if (step === steps) return end;
      const progress = step / steps;
      const offset = Math.sin(progress * Math.PI * 2) * .65;
      return {
        x: point.x + dx * progress + normalX * offset,
        y: point.y + dy * progress + normalY * offset,
      };
    });
  });
}

function renderSpiralPath(points) {
  return points.flatMap((point, index) => {
    const end = points[index + 1];
    if (!end) return [point];
    const dx = end.x - point.x;
    const dy = end.y - point.y;
    const distance = Math.hypot(dx, dy) || 1;
    const tangentX = dx / distance;
    const tangentY = dy / distance;
    const normalX = -dy / distance;
    const normalY = dx / distance;
    // A coil is drawn per legal route segment.  Each loop returns to the
    // segment centreline, which keeps the route corner itself exact.
    const coils = Math.min(5, Math.max(1, Math.round(distance / 12)));
    const steps = coils * 18;
    const pitch = distance / coils;
    const radius = Math.min(2.7, Math.max(1.05, pitch * .24), distance * .17);
    return Array.from({ length: steps + 1 }, (_, step) => {
      if (!step) return point;
      if (step === steps) return end;
      const progress = step / steps;
      const angle = progress * Math.PI * 2 * coils;
      const alongOffset = (Math.cos(angle) - 1) * radius;
      const sidewaysOffset = Math.sin(angle) * radius;
      return {
        x: point.x + dx * progress + tangentX * alongOffset + normalX * sidewaysOffset,
        y: point.y + dy * progress + tangentY * alongOffset + normalY * sidewaysOffset,
      };
    });
  });
}

function renderSonicPath(points) {
  return points.flatMap((point, index) => {
    const end = points[index + 1];
    if (!end) return [point];
    const dx = end.x - point.x;
    const dy = end.y - point.y;
    const distance = Math.hypot(dx, dy) || 1;
    const normalX = -dy / distance;
    const normalY = dx / distance;
    const waves = Math.min(5, Math.max(1, Math.round(distance / 14)));
    const steps = waves * 12;
    const amplitude = Math.min(1.15, distance * .075);
    return Array.from({ length: steps + 1 }, (_, step) => {
      if (!step) return point;
      if (step === steps) return end;
      const progress = step / steps;
      const offset = Math.sin(progress * Math.PI * 2 * waves) * amplitude;
      return {
        x: point.x + dx * progress + normalX * offset,
        y: point.y + dy * progress + normalY * offset,
      };
    });
  });
}

const DECORATION_COUNTS = Object.freeze({
  tracer: 1, jagged: 2, flame: 4, "dual-stroke": 0, sparks: 4, symbols: 3,
  packets: 4, gradient: 0, wave: 3, helix: 4, motes: 4, ribbon: 2,
  dash: 3, projectile: 2, charge: 2, rings: 3, links: 4, wavelets: 3,
  droplets: 4,
});

function renderDecorations(nodes, points, family, effectId) {
  hideMatrixDigits(nodes);
  hideChainLinks(nodes);
  const count = effectId === 'triple-effect-triad-converge' ? 3 : effectId === 'link-effect-meteor-route' ? 4 : ["spiral", "dashed", "bullet", "meteor", "chains"].includes(effectId)
    ? 0
    : DECORATION_COUNTS[family] || 1;
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
    const radius = family === "jagged" && endImpact
      ? "3.3"
      : family === "rings" || family === "wavelets"
        ? String(1.4 + index * .75)
        : family === "charge"
          ? String(1.5 + index)
          : "1.35";
    node.setAttribute("r", radius);
    node.style.setProperty("--effect-v2-decoration-delay", `${index * 48}ms`);
    const impactClass = family === "jagged" && endImpact
      ? " effect-v2-connection__decoration--impact"
      : "";
    node.setAttribute("class", `effect-v2-connection__decoration effect-v2-connection__decoration--${family} effect-v2-connection__decoration--${effectId}${impactClass}`);
  });
}

function renderFamilyPath(points, family, seed, bounds, effectId) {
  if (family === "jagged") return seededLightning(points, seed, bounds, effectId);
  if (family === "flame") return renderFirePath(points, seed, bounds);
  if (effectId === "plasma") return renderPlasmaPath(points);
  if (effectId === "spiral") return renderSpiralPath(points);
  if (effectId === "sonic") return renderSonicPath(points);
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
  const bounds = surface.getBoundingClientRect();
  const rendered = renderFamilyPath(normalized, family, seed, bounds, effect.id);
  const serialized = rendered.map(point => `${point.x},${point.y}`).join(" ");
  const nodes = ensureSurface(surface);
  stopHydroBubbles(nodes);
  stopRouteTravelers(nodes);
  if (effect.id !== "matrix") hideMatrixDigits(nodes);
  if (effect.id !== "chains") hideChainLinks(nodes);
  surface.setAttribute("viewBox", "0 0 100 100");
  surface.setAttribute("preserveAspectRatio", "none");
  surface.setAttribute("class", `link-path-overlay effect-v2-connection link-path-overlay--${effect.id}`);
  if (effect.impactDelayMs == null) surface.style.removeProperty("--effect-v2-connection-impact-delay");
  else surface.style.setProperty("--effect-v2-connection-impact-delay", `${effect.impactDelayMs}ms`);
  if (effect.id === "rainbow") {
    surface.style.setProperty("--effect-v2-rainbow-stroke", `url(#${ensureRainbowGradient(surface, nodes)})`);
  } else {
    surface.style.removeProperty("--effect-v2-rainbow-stroke");
  }
  nodes.glow.setAttribute("points", serialized);
  nodes.beam.setAttribute("points", serialized);
  if (effect.id === "hydro") renderHydroBubbles(nodes, surface, rendered, effect);
  else if (effect.id === "matrix") renderMatrixDigits(nodes, rendered, seed);
  else if (effect.id === "chains") renderChainLinks(nodes, rendered);
  else {
    renderDecorations(nodes, rendered, family, effect.id);
    if (["bullet", "meteor", 'link-effect-meteor-route'].includes(effect.id)) renderRouteTravelers(nodes, rendered, effect.id);
  }
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
  stopHydroBubbles(nodes);
  stopRouteTravelers(nodes);
  nodes?.glow?.removeAttribute("points");
  nodes?.beam?.removeAttribute("points");
  nodes?.decorationNodes?.forEach((node) => node.setAttribute("display", "none"));
  hideChainLinks(nodes);
  hideMatrixDigits(nodes);
  surface.classList.remove("is-visible");
}
