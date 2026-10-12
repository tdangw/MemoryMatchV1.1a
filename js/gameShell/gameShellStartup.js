// Startup work belongs to one mount; no image/node cache outlives the round.
export const STARTUP_LIMITS = Object.freeze({ decodeConcurrency: 4, batchBudgetMs: 8 });
class StartupCancelled extends Error {}

export function createGameShellStartup(scope, refs, onFailure) {
  let status = 'preparing';
  const phases = [];
  let failedImages = 0;
  let domReadyAt = null;
  let decodedSources = 0;
  let peakDecodeConcurrency = 0;
  let activeDecodes = 0;
  let ready;
  const pending = new Set();
  refs.root.dataset.shellStartup = status;
  refs.board.setAttribute('aria-busy', 'true');
  const controls = [...refs.hud.querySelectorAll('button:not(.game-menu-toggle):not(.game-action-item)')].map(node => ({ node, disabled: node.disabled }));
  controls.forEach(({ node }) => { node.disabled = true; });
  const finishUI = () => {
    refs.board.removeAttribute('aria-busy');
    delete refs.root.dataset.shellStartup;
    controls.forEach(({ node, disabled }) => { node.disabled = disabled; });
  };
  const dispose = scope.own(() => {
    if (status === 'preparing') status = 'cancelled';
    for (const cancel of [...pending]) cancel();
    pending.clear();
    finishUI();
  });
  const check = () => { if (!scope.active || status === 'cancelled') throw new StartupCancelled(); };
  const wait = work => new Promise((resolve, reject) => {
    let cleanup = () => {};
    const cancel = () => { cleanup(); pending.delete(cancel); reject(new StartupCancelled()); };
    pending.add(cancel);
    const settle = (error, value) => {
      if (!pending.delete(cancel)) return;
      cleanup();
      if (error) reject(error); else resolve(value);
    };
    try { cleanup = work(settle); }
    catch (error) { settle(error); }
  });
  const startup = {
    scope,
    get status() { return status; },
    get ready() { return ready; },
    check,
    async phase(name, work) {
      check();
      const begin = performance.now();
      try { return await work(); }
      finally { phases.push({ name, durationMs: performance.now() - begin }); }
    },
    async yield() {
      check();
      await wait(settle => {
        const channel = new MessageChannel();
        channel.port1.onmessage = () => settle(null);
        channel.port2.postMessage(null);
        return () => { channel.port1.onmessage = null; channel.port1.close(); channel.port2.close(); };
      });
      check();
    },
    async decodeBoard() {
      check();
      domReadyAt = performance.now();
      const groups = new Map();
      for (const image of refs.board.querySelectorAll('img')) {
        const source = image.getAttribute('src');
        if (!groups.has(source)) groups.set(source, []);
        groups.get(source).push(image);
      }
      const queue = [...groups.values()];
      let index = 0;
      await Promise.all(Array.from({ length: Math.min(STARTUP_LIMITS.decodeConcurrency, queue.length) }, async () => {
        while (index < queue.length) {
          check();
          const images = queue[index++];
          const image = images[0];
          const source = image.getAttribute('src');
          activeDecodes += 1;
          peakDecodeConcurrency = Math.max(peakDecodeConcurrency, activeDecodes);
          const decoded = await wait(settle => {
            image.decode().then(() => settle(null, true), () => settle(null, false));
            return () => {};
          });
          activeDecodes -= 1;
          decodedSources += 1;
          check();
          if (!decoded) {
            failedImages += 1;
            const fallback = image.getAttribute('src') !== source ? image.getAttribute('src') : createImageFallback(source);
            for (const node of images) {
              node.src = fallback;
              node.dataset.startupImageError = 'true';
            }
            await wait(settle => {
              image.decode().then(() => settle(null), error => settle(error));
              return () => {};
            });
            check();
          }
        }
      }));
    },
    async batch(items, apply) {
      let begin = performance.now();
      for (let index = 0; index < items.length; index++) {
        check();
        apply(items[index], index);
        if (index + 1 < items.length && performance.now() - begin >= STARTUP_LIMITS.batchBudgetMs) {
          await startup.yield();
          begin = performance.now();
        }
      }
      check();
    },
    run(work) {
      if (ready) throw new Error('Startup can only run once.');
      ready = (async () => {
        try {
          await startup.yield();
          const result = await work(startup);
          check();
          status = 'ready';
          finishUI();
          dispose.forget();
          return result;
        } catch (error) {
          if (error instanceof StartupCancelled) return null;
          status = 'failed';
          dispose();
          onFailure(error);
          return null;
        }
      })();
      return ready;
    },
    diagnostics() { return { status, failedImages, domReadyAt, decodedSources, peakDecodeConcurrency, phases: [...phases], pending: pending.size }; },
  };
  scope.startup = startup;
  return startup;
}

function createImageFallback(source) {
  let hash = 2166136261;
  for (let i = 0; i < source.length; i++) hash = Math.imul(hash ^ source.charCodeAt(i), 16777619);
  const label = (hash >>> 0).toString(16).toUpperCase().padStart(8, '0');
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160"><rect width="160" height="160" rx="16" fill="#243b64"/><text x="80" y="88" text-anchor="middle" fill="#fff" font-family="sans-serif" font-size="22">${label}</text></svg>`);
}
