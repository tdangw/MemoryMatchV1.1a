export function prefersReducedMotion() {
  return typeof window !== "undefined"
    && Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches);
}

export function readCssTimeMs(value, fallback = 0) {
  const normalized = String(value || "").trim();
  const parsed = Number.parseFloat(normalized);
  if (!Number.isFinite(parsed)) return fallback;
  return normalized.endsWith("s") && !normalized.endsWith("ms") ? parsed * 1000 : parsed;
}

// Tiện ích FLIP dùng chung: renderer chỉ cần cung cấp hai DOMRect cùng hệ tọa độ.
export function calculateMotionDelta(previousRect, nextRect) {
  const x = Number(previousRect?.left) - Number(nextRect?.left);
  const y = Number(previousRect?.top) - Number(nextRect?.top);
  return {
    x: Number.isFinite(x) ? x : 0,
    y: Number.isFinite(y) ? y : 0,
  };
}
