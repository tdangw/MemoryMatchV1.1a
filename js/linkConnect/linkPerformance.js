const isDevelopment = import.meta.env.DEV;

let layoutPasses = 0;
let latestPatch = null;

// Chỉ ghi số liệu khi chạy Vite development. Production không có log/đo đạc.
export function measureLinkRender(operation, render) {
  if (!isDevelopment) return render();
  const startedAt = performance.now();
  const result = render();
  const duration = performance.now() - startedAt;
  console.debug(
    `[Link Connect perf] ${operation}: ${duration.toFixed(1)}ms; ${formatLatestPatch()}; layout passes: ${layoutPasses}`,
  );
  return result;
}

export function recordLinkLayoutPass() {
  if (isDevelopment) layoutPasses += 1;
}

export function recordLinkPatch(patch) {
  if (isDevelopment) latestPatch = patch;
}

function formatLatestPatch() {
  if (!latestPatch) return "no DOM patch";
  return `cells: ${latestPatch.changedCells}, tiles: ${latestPatch.updatedTiles}, new images: ${latestPatch.createdTiles}`;
}
