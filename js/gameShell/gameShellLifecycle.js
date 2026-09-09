let activeScope = null;
const pending = { timeout: new Map(), interval: new Map(), frame: new Map() };

/** Resources belong to a mount/round, never to the next game using the same DOM. */
export function createGameShellLifecycle() {
  let alive = true;
  const resources = new Map();
  const scope = {
    get active() { return alive; },
    own(cleanup, kind = "cleanup") {
      let owned = true;
      const dispose = () => {
        if (!owned) return;
        dispose.forget();
        cleanup();
      };
      dispose.forget = () => { owned = false; resources.delete(dispose); };
      if (alive) resources.set(dispose, kind);
      else dispose();
      return dispose;
    },
    guard(callback) { return (...args) => { if (alive) return callback(...args); }; },
    listen(target, type, callback, options) {
      const guarded = scope.guard((...args) => {
        if (options?.once) dispose.forget();
        return callback(...args);
      });
      if (alive) target.addEventListener(type, guarded, options);
      const dispose = scope.own(() => target.removeEventListener(type, guarded, options), "listener");
      return dispose;
    },
    timeout(callback, delay, ...args) { return schedule(scope, "timeout", callback, delay, args); },
    interval(callback, delay, ...args) { return schedule(scope, "interval", callback, delay, args); },
    frame(callback) { return schedule(scope, "frame", callback); },
    animation(animation) {
      const dispose = scope.own(() => animation.cancel(), "animation");
      animation.finished.then(dispose.forget, dispose.forget);
      return animation;
    },
    diagnostics() {
      const counts = { listener: 0, timeout: 0, interval: 0, frame: 0, animation: 0, node: 0, cleanup: 0 };
      for (const kind of resources.values()) counts[kind] += 1;
      return { active: alive, ...counts };
    },
    dispose() {
      if (!alive) return;
      alive = false;
      if (activeScope === scope) activeScope = null;
      // A failed owner must not prevent the rest of the round from being released.
      for (const dispose of [...resources.keys()].reverse()) {
        try { dispose(); } catch (error) { console.error("Game Shell cleanup failed", error); }
      }
    },
  };
  return scope;
}

export function getActiveGameScope() { return activeScope; }
export function activateGameScope(scope) {
  if (activeScope !== scope) activeScope?.dispose();
  activeScope = scope;
}

function cancel(kind, handle) {
  const dispose = pending[kind].get(handle);
  if (dispose) dispose();
  else nativeCancel(kind, handle);
}
function nativeCancel(kind, handle) {
  if (kind === "frame") globalThis.cancelAnimationFrame(handle);
  else if (kind === "interval") globalThis.clearInterval(handle);
  else globalThis.clearTimeout(handle);
}
function schedule(scope, kind, callback, delay, args = []) {
  if (scope && !scope.active) return undefined;
  let dispose;
  const wrapped = (...values) => {
    if (kind !== "interval") { pending[kind].delete(handle); dispose?.forget(); }
    if (!scope || scope.active) callback(...values);
  };
  const handle = kind === "frame" ? globalThis.requestAnimationFrame(wrapped)
    : kind === "interval" ? globalThis.setInterval(wrapped, delay, ...args)
      : globalThis.setTimeout(wrapped, delay, ...args);
  if (scope) {
    dispose = scope.own(() => { pending[kind].delete(handle); nativeCancel(kind, handle); }, kind);
    pending[kind].set(handle, dispose);
  }
  return handle;
}

// App scheduling: game work belongs to the active round; menu work may have no shell.
export const shellTimeout = (callback, delay, ...args) => schedule(activeScope, "timeout", callback, delay, args);
export const shellInterval = (callback, delay, ...args) => schedule(activeScope, "interval", callback, delay, args);
export const shellFrame = callback => schedule(activeScope, "frame", callback);
export const clearShellTimeout = handle => cancel("timeout", handle);
export const clearShellInterval = handle => cancel("interval", handle);
export const cancelShellFrame = handle => cancel("frame", handle);
