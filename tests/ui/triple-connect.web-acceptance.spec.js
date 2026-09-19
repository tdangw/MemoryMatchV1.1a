import { expect, test } from "@playwright/test";

const P95_TAP_FEEDBACK_MS = 50;
const P95_DOM_PATCH_MS = 8;

function percentile(values, fraction) {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * fraction) - 1)];
}

test("production Triple Connect keeps interaction, DOM, long-task and heap budgets", async ({ page }, testInfo) => {
  test.setTimeout(60000);
  await page.addInitScript(() => {
    localStorage.clear();
    window.__tripleLongTasks = [];
    try {
      new PerformanceObserver((list) => {
        window.__tripleLongTasks.push(...list.getEntries().map((entry) => entry.duration));
      }).observe({ type: "longtask", buffered: true });
    } catch {
      // Long-task observation is optional in browsers that do not expose it.
    }
  });
  await page.goto("/");
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("HeapProfiler.collectGarbage");
  const before = {
    dom: await cdp.send("Memory.getDOMCounters"),
    heap: await cdp.send("Runtime.getHeapUsage"),
  };

  await page.locator(".game-selector__choice").filter({ hasText: "Triple Connect" }).click();
  await page.getByText("Bắt đầu", { exact: true }).click();
  await page.getByRole("button", { name: "Siêu khó" }).click();
  await page.locator("#triple-round-start-modal").getByRole("button", { name: "Bắt đầu" }).click();
  await page.evaluate(async () => {
    await Promise.all([...document.images].map((image) => image.decode().catch(() => {})));
  });
  const feedback = [];
  const patches = [];
  const longTasks = [];
  for (let index = 0; index < 20; index += 1) {
    await page.evaluate(async () => {
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      window.__tripleLongTasks = [];
    });
    const sample = await page.evaluate(async () => {
      const tile = document.querySelector(".triple-connect__board .triple-connect__tile:not(:disabled)");
      if (!tile) throw new Error("Expected an exposed Triple tile for production interaction measurement.");
      const trayBefore = document.querySelectorAll(".triple-connect__tray .triple-connect__tile").length;
      const start = performance.now();
      tile.click();
      const patchAt = performance.now();
      const trayAfter = document.querySelectorAll(".triple-connect__tray .triple-connect__tile").length;
      if (trayAfter !== trayBefore + 1) throw new Error("Triple tile selection did not patch the tray synchronously.");
      await new Promise((resolve) => requestAnimationFrame(resolve));
      return {
        feedback: performance.now() - start,
        patch: patchAt - start,
        longTasks: [...window.__tripleLongTasks],
      };
    });
    feedback.push(sample.feedback);
    patches.push(sample.patch);
    longTasks.push(...sample.longTasks);
    if (index === 19) break;
    await page.locator("#triple-actions-menu-toggle").click();
    await page.locator("#triple-actions-menu").getByRole("button", { name: "Chơi lại" }).click();
    await page.locator("#triple-round-start-modal").getByRole("button", { name: "Bắt đầu" }).click();
  }
  const measured = await page.evaluate(({ feedback, patches, longTasks }) => ({
    feedback,
    patches,
    longTasks,
    domNodes: document.querySelectorAll("*").length,
    bundleResources: performance.getEntriesByType("resource")
      .filter((entry) => entry.name.includes("/assets/"))
      .map((entry) => ({ name: entry.name, transferSize: entry.transferSize })),
  }), { feedback, patches, longTasks });

  await page.locator("#triple-actions-menu-toggle").click();
  await page.locator("#triple-actions-menu").getByRole("button", { name: "Menu" }).click();
  await page.locator("#menu-container").getByText("Home", { exact: true }).click();
  await expect(page.locator(".game-selector__choice").first()).toBeVisible();

  await cdp.send("HeapProfiler.collectGarbage");
  const after = {
    dom: await cdp.send("Memory.getDOMCounters"),
    heap: await cdp.send("Runtime.getHeapUsage"),
  };
  await cdp.detach();

  const metrics = {
    p50TapFeedbackMs: percentile(measured.feedback, 0.5),
    p95TapFeedbackMs: percentile(measured.feedback, 0.95),
    p50DomPatchMs: percentile(measured.patches, 0.5),
    p95DomPatchMs: percentile(measured.patches, 0.95),
    longTaskMaxMs: Math.max(0, ...measured.longTasks),
    domNodes: measured.domNodes,
    bundleBytes: measured.bundleResources.reduce((total, entry) => total + entry.transferSize, 0),
    heapDeltaBytes: after.heap.usedSize - before.heap.usedSize,
    domDelta: {
      nodes: after.dom.nodes - before.dom.nodes,
      listeners: after.dom.jsEventListeners - before.dom.jsEventListeners,
    },
  };
  await testInfo.attach("triple-production-web-metrics.json", {
    body: JSON.stringify(metrics, null, 2),
    contentType: "application/json",
  });
  expect(metrics.p95TapFeedbackMs).toBeLessThanOrEqual(P95_TAP_FEEDBACK_MS);
  expect(metrics.p95DomPatchMs).toBeLessThanOrEqual(P95_DOM_PATCH_MS);
  expect(metrics.longTaskMaxMs).toBeLessThanOrEqual(50);
  expect(metrics.heapDeltaBytes).toBeLessThanOrEqual(2 * 1024 * 1024);
});
