import {
  getTripleChallengeStage,
  TRIPLE_EASY_GENERATOR_BUDGET,
  TRIPLE_EASY_SOLVER_BUDGET,
  TRIPLE_HARD_SOLVER_BUDGET,
  TRIPLE_SUPER_HARD_SOLVER_BUDGET,
} from "./tripleConfig.js";

let nextRequestId = 0;

export function getTripleGenerationTimeoutMs({ mode, level = 1 } = {}) {
  const solverBudget = mode === "challenge"
    ? getTripleChallengeStage(level).solverBudget
    : mode === "hard"
      ? TRIPLE_HARD_SOLVER_BUDGET
      : ["superHard", "endless"].includes(mode)
        ? TRIPLE_SUPER_HARD_SOLVER_BUDGET
        : TRIPLE_EASY_SOLVER_BUDGET;
  const attempts = ["easy", "normal"].includes(mode)
    ? TRIPLE_EASY_GENERATOR_BUDGET.maxAttempts + 1
    : 2;
  // Covers bounded solver attempts plus worker start-up and a slow mobile
  // scheduling margin; it is intentionally derived from the same budget that
  // keeps solver validation deterministic.
  return solverBudget.deadlineMs * attempts + 4000;
}

export function requestTripleGeneration({ mode, seed, level, timeoutMs = getTripleGenerationTimeoutMs({ mode, level }), WorkerClass = globalThis.Worker } = {}) {
  if (typeof WorkerClass !== "function")
    throw new Error("Triple generation worker is unavailable.");
  const requestId = ++nextRequestId;
  const worker = new WorkerClass(new URL("./tripleGenerationWorker.js", import.meta.url), { type: "module" });
  let settled = false;
  let timeoutId = null;
  let rejectPending = null;
  const dispose = () => {
    if (timeoutId !== null) clearTimeout(timeoutId);
    timeoutId = null;
    worker.terminate();
  };
  const promise = new Promise((resolve, reject) => {
    rejectPending = reject;
    const settle = (callback, value) => {
      if (settled) return;
      settled = true;
      dispose();
      callback(value);
    };
    worker.addEventListener("message", ({ data }) => {
      if (data?.requestId !== requestId) return;
      if (data.ok) settle(resolve, data.generated);
      else settle(reject, new Error(data.error || "Triple generation failed."));
    });
    worker.addEventListener("error", (event) => {
      settle(reject, new Error(event.message || "Triple generation worker failed."));
    }, { once: true });
    timeoutId = setTimeout(() => {
      settle(reject, new Error("Triple generation timed out."));
    }, timeoutMs);
    worker.postMessage({ requestId, mode, seed, level });
  });
  return Object.freeze({ requestId, promise, cancel: () => {
    if (settled) return;
    settled = true;
    dispose();
    rejectPending?.(new Error("Triple generation cancelled."));
  } });
}
