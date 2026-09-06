import assert from "node:assert/strict";
import { resolveSessionTiming } from "../js/sessionTiming.js";

assert.deepEqual(resolveSessionTiming({ reason: "new", newTime: 60 }), {
  remainingTime: 60,
  timeLimit: 60,
  levelStartTime: 60,
});
assert.deepEqual(resolveSessionTiming({
  reason: "resume",
  newTime: 60,
  session: { remainingTime: 23, timeLimit: 60, levelStartTime: 60 },
}), { remainingTime: 23, timeLimit: 60, levelStartTime: 60 });
assert.deepEqual(resolveSessionTiming({
  reason: "restart",
  newTime: 60,
  session: { remainingTime: 23, timeLimit: 60, levelStartTime: 55 },
}), { remainingTime: 55, timeLimit: 55, levelStartTime: 55 });
assert.deepEqual(resolveSessionTiming({
  reason: "advance",
  newTime: 60,
  currentRemaining: 19,
  carryOnAdvance: true,
  advanceBonus: 10,
}), { remainingTime: 29, timeLimit: 29, levelStartTime: 29 });
assert.deepEqual(resolveSessionTiming({
  endless: true,
  reason: "resume",
  session: { remainingTime: 81 },
}), { remainingTime: 81, timeLimit: 81, levelStartTime: 0 });
assert.deepEqual(resolveSessionTiming({
  reason: "resume",
  newTime: 45,
  session: { remainingTime: "bad", timeLimit: NaN },
}), { remainingTime: 45, timeLimit: 45, levelStartTime: 45 });

console.log("Session timing checks passed.");
