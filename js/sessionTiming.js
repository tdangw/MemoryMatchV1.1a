export function resolveSessionTiming({
  endless = false,
  reason = "new",
  newTime = 0,
  currentRemaining = 0,
  session = null,
  carryOnAdvance = false,
  advanceBonus = 0,
  maxCarryBonusTime = Infinity,
  restartTime,
} = {}) {
  if (endless) {
    const elapsed = reason === "resume" ? finiteTime(session?.remainingTime, 0) : 0;
    return { remainingTime: elapsed, timeLimit: Math.max(1, elapsed), levelStartTime: 0 };
  }

  const fallback = finiteTime(newTime, 0);
  if (reason === "advance" && carryOnAdvance) {
    const remaining = finiteTime(currentRemaining, 0);
    const initial = remaining + Math.min(finiteTime(advanceBonus, 0), Math.max(0, maxCarryBonusTime - remaining));
    return { remainingTime: initial, timeLimit: initial, levelStartTime: initial };
  }
  if (reason === "restart") {
    const rawInitial = finiteTime(
      restartTime ?? session?.levelStartTime,
      finiteTime(session?.timeLimit, fallback),
    );
    const initial = !carryOnAdvance && rawInitial <= 5 && fallback > 5
      ? fallback
      : rawInitial;
    return { remainingTime: initial, timeLimit: initial, levelStartTime: initial };
  }
  if (reason === "resume") {
    const remainingTime = finiteTime(session?.remainingTime, fallback);
    const savedTimeLimit = finiteTime(session?.timeLimit, fallback);
    const levelStartTime = finiteTime(session?.levelStartTime, savedTimeLimit);
    return {
      remainingTime,
      timeLimit: savedTimeLimit,
      levelStartTime,
    };
  }
  return { remainingTime: fallback, timeLimit: fallback, levelStartTime: fallback };
}

function finiteTime(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.floor(number)) : fallback;
}
