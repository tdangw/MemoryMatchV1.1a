const isDevelopment = import.meta.env.DEV;

let layoutPasses = 0;

// Chỉ ghi số liệu khi chạy Vite development. Production không có log/đo đạc.
export function measureLinkRender(operation, render) {
  if (!isDevelopment) return render();
  const startedAt = performance.now();
  const result = render();
  const duration = performance.now() - startedAt;
  console.debug(
    `[Link Connect perf] ${operation}: ${duration.toFixed(1)}ms; layout passes: ${layoutPasses}`,
  );
  return result;
}

export function recordLinkLayoutPass() {
  if (isDevelopment) layoutPasses += 1;
}
