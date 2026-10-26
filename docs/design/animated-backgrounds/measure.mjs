import { chromium } from '@playwright/test';
import { writeFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import os from 'node:os';

const mode = process.argv[2] || 'baseline';
const baseline = mode.startsWith('baseline');
const origin = process.env.AMBIENT_ORIGIN || 'http://127.0.0.1:4188';
const output = 'docs/design/animated-backgrounds/qa';
const browser = await chromium.launch({ channel: 'chrome', args: ['--autoplay-policy=user-gesture-required'] });
const results = { mode, browser: browser.version(), platform: os.platform(), cpu: os.cpus()[0].model, samples: [], sources: [] };
const profiles = mode === 'pilot-memory' ? [{ name: 'desktop-portrait', width: 900, height: 1024, dpr: 1 }]
  : baseline || mode === 'inspect' ? [{ name: 'desktop', width: 1024, height: 900, dpr: 1 }]
  : [{ name: 'narrow', width: 320, height: 740, dpr: 2 }, { name: 'portrait', width: 412, height: 915, dpr: 3 },
    { name: 'landscape', width: 844, height: 390, dpr: 2 }, { name: 'desktop', width: 1024, height: 900, dpr: 1 },
    { name: 'wide', width: 1366, height: 768, dpr: 1 }];

async function sample(frame, cdp, duration) {
  const before = (await cdp.send('Performance.getMetrics')).metrics;
  const observation = await frame.evaluate(duration => new Promise(resolve => {
    const intervals = []; let last = performance.now(); const end = last + duration;
    const longTasks = [], supported = PerformanceObserver.supportedEntryTypes.includes('longtask');
    const observer = supported ? new PerformanceObserver(list => longTasks.push(...list.getEntries().map(entry => entry.duration))) : null;
    if (observer) observer.observe({ type: 'longtask' });
    function tick(now) {
      intervals.push(now - last); last = now;
      if (now < end) requestAnimationFrame(tick);
      else {
        if (observer) { longTasks.push(...observer.takeRecords().map(entry => entry.duration)); observer.disconnect(); }
        resolve({ frames: intervals, longTasks: supported ? longTasks : null });
      }
    }
    requestAnimationFrame(tick);
  }), duration);
  const after = (await cdp.send('Performance.getMetrics')).metrics;
  const sorted = observation.frames.slice(1).sort((a, b) => a - b), percentile = p => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))];
  const delta = Object.fromEntries(after.filter(item => /Duration|Count|JSHeapUsedSize/.test(item.name)).map(item => [item.name, item.value - (before.find(old => old.name === item.name)?.value || 0)]));
  return { duration, count: sorted.length, p50: percentile(.5), p95: percentile(.95), p99: percentile(.99), max: sorted.at(-1), above25ms: sorted.filter(ms => ms > 25).length / sorted.length, longTasks: observation.longTasks, cdpDelta: delta };
}
try {
  for (const profile of profiles) {
    const context = await browser.newContext({ viewport: { width: profile.width, height: profile.height + 60 }, deviceScaleFactor: profile.dpr,
      reducedMotion: 'no-preference', serviceWorkers: 'block', ...(mode !== 'baseline' && ['portrait', 'landscape'].includes(profile.name) ? { recordVideo: { dir: `${output}/videos`, size: { width: profile.width, height: profile.height } } } : {}) });
    const page = await context.newPage();
    const errors = []; page.on('pageerror', error => errors.push(String(error)));
    await page.goto(`${origin}/docs/design/animated-backgrounds/pilot.html`);
    const frame = page.frames().find(frame => frame.parentFrame());
    await frame.waitForSelector('.game-selector__choice');
    if (baseline) await frame.evaluate(() => {
      const toggle = document.getElementById('toggle-meteor-effects');
      if (toggle.checked) toggle.click();
    });
    const cdp = await context.newCDPSession(page); await cdp.send('Performance.enable'); await cdp.send('HeapProfiler.enable');
    let layers = [];
    cdp.on('LayerTree.layerTreeDidChange', event => { if (event.layers) layers = event.layers; });
    await cdp.send('LayerTree.enable');
    const environment = await frame.evaluate(() => ({ userAgent: navigator.userAgent, dpr: devicePixelRatio, width: innerWidth, height: innerHeight,
      screen: { width: screen.width, height: screen.height }, fog: document.querySelectorAll('.fog').length, clouds: document.querySelectorAll('.cloud').length, meteorSlots: document.querySelectorAll('.shooting-star').length }));
    for (const scene of ['baseline-memory', 'pilot-memory', 'inspect'].includes(mode) ? ['memory'] : ['home', 'memory']) {
      await page.evaluate(() => window.stopAmbientPilot());
      if (scene === 'memory') {
        await frame.locator('[data-game-id="memory-match"]').click();
        if (!['inspect', 'pilot-memory'].includes(mode)) await frame.locator('[data-special-mode="endless"]').click();
        else await frame.locator('.adventure-map-node[data-level="1"]').click();
        await frame.getByRole('button', { name: 'Chơi', exact: true }).click();
        await frame.getByRole('button', { name: 'Bỏ qua', exact: true }).click();
        if (mode === 'inspect') {
          await page.waitForTimeout(5000);
          console.log((await frame.locator('body').innerText()).slice(-2500));
          console.log(await frame.locator('#grid-container').evaluate(node => node.outerHTML.slice(0,1000)));
          await frame.locator('body').screenshot({ path: `${output}/navigation-inspect.png` });
          continue;
        }
        await frame.waitForSelector('#grid-container .tile');
        await frame.waitForSelector('#grid-container:not(.is-locked)');
        if (await frame.locator('.tutorial-guide').isVisible()) {
          await frame.getByRole('button', { name: 'Đã hiểu', exact: true }).click();
          await frame.locator('.tutorial-guide').waitFor({ state: 'hidden' });
        }
      }
      const row = { profile, environment, scene, scenario: scene === 'memory' ? (mode === 'pilot-memory' ? 'easy-idle' : 'endless-idle') : 'home-idle', errors, pairs: [] };
      if (baseline) {
        // This is the initial working tree: legacy clouds/meteors remain part of baseline.
        row.baseline = await sample(frame, cdp, 120000);
      } else {
        for (let pair = 0; pair < (profile.name.startsWith('desktop') ? 3 : 0); pair++) {
          const pairResult = {};
          for (const on of pair % 2 ? [true, false] : [false, true]) {
            await page.evaluate(({ scene, on }) => on ? window.mountAmbientPilot(scene) : window.stopAmbientPilot(), { scene, on });
            await page.waitForTimeout(500);
            if (pair === 0) await cdp.send('Tracing.start', { categories: 'devtools.timeline', transferMode: 'ReturnAsStream' });
            pairResult[on ? 'on' : 'off'] = await sample(frame, cdp, 10000);
            pairResult[on ? 'on' : 'off'].layers = layers.map(({ layerId, parentLayerId, width, height, drawsContent, paintCount, backendNodeId }) => ({ layerId, parentLayerId, width, height, drawsContent, paintCount, backendNodeId }));
            if (pair === 0) {
              const complete = new Promise(resolve => cdp.once('Tracing.tracingComplete', resolve));
              await cdp.send('Tracing.end'); const { stream } = await complete;
              let trace = '', eof = false;
              while (!eof) { const chunk = await cdp.send('IO.read', { handle: stream }); trace += chunk.data; eof = chunk.eof; }
              await cdp.send('IO.close', { handle: stream });
              const filename = `runtime/qa/animated-backgrounds/${scene}-${on ? 'on' : 'off'}.trace.json`;
              await writeFile(filename, trace);
              const events = JSON.parse(trace).traceEvents;
              pairResult[on ? 'on' : 'off'].trace = { filename, events: events.length,
                paintEvents: events.filter(event => event.name === 'Paint').length,
                layoutEvents: events.filter(event => event.name === 'Layout').length,
                longTasks: events.filter(event => event.name === 'RunTask' && event.dur > 50000).map(event => event.dur / 1000) };
            }
            if (on) {
              pairResult.resources = await page.evaluate(() => window.ambientPilotDiagnostics());
              if (mode === 'pilot-memory' && pairResult.resources.kinds.filter(kind => kind === 'fish').length !== 2) throw new Error('Two-fish performance sample was not active');
            }
          }
          row.pairs.push(pairResult);
        }
        await page.evaluate(scene => window.mountAmbientPilot(scene), scene);
        await page.waitForTimeout(1000);
        row.resources = await page.evaluate(() => window.ambientPilotDiagnostics());
        if (row.resources.handles > 5 || row.resources.nodes > 24 || row.resources.timers > 1) throw new Error('Light pilot exceeded budget');
        await frame.locator('body').screenshot({ path: `${output}/${profile.name}-${scene}.png`, scale: 'css' });
        if (['portrait', 'landscape'].includes(profile.name)) await page.waitForTimeout(12000);
        row.envelopes = await frame.locator('.ambient-bg-region').evaluateAll(nodes => nodes.map(node => ({ kind: node.className, rect: node.getBoundingClientRect().toJSON() })));
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.waitForTimeout(80);
        row.reduced = await page.evaluate(() => window.ambientPilotDiagnostics());
        if (row.reduced.handles || row.reduced.timers || row.reduced.nodes !== 1) throw new Error('Reduced-motion retained pilot resources');
        await page.emulateMedia({ reducedMotion: 'no-preference' });
        row.cycles = await page.evaluate(scene => {
          for (let i = 0; i < 100; i++) { const owner = window.mountAmbientPilot(scene); owner.dispose(); owner.dispose(); }
          window.stopAmbientPilot();
          const doc = document.querySelector('iframe').contentDocument;
          return { scenes: doc.querySelectorAll('.ambient-bg-pilot').length, animations: doc.getAnimations().filter(a => a.effect?.target?.closest('.ambient-bg-pilot')).length };
        }, scene);
        if (row.cycles.scenes || row.cycles.animations) throw new Error('Disposed pilot retained resources');
      }
      results.samples.push(row);
      console.log(`${mode} ${profile.name} ${scene}: captured`);
      await writeFile(`${output}/${mode}.json`, JSON.stringify(results, null, 2));
    }
    if (profile === profiles[0]) {
      for (const source of ['/assets/images/background-main.webp', '/assets/images/background-main-portrait.webp',
        ...['memory-match', 'link-connect', 'triple-connect'].flatMap(name => [`/assets/images/backgrounds/${name}.webp`, `/assets/images/backgrounds/${name}-portrait-9x20.webp`]), '/assets/adventure/moonlit-garden.webp', '/assets/images/backgrounds/leaderboard-night-garden.webp']) {
        const bytes = await readFile(`public${source}`);
        const geometry = await frame.evaluate(source => new Promise((resolve, reject) => { const image = new Image(); image.onload = () => resolve([image.naturalWidth, image.naturalHeight]); image.onerror = reject; image.src = source; }), source);
        results.sources.push({ source, bytes: bytes.length, geometry, sha256: createHash('sha256').update(bytes).digest('hex') });
      }
    }
    const video = page.video();
    await context.close();
    if (video) { await video.saveAs(`${output}/pilot-${profile.name}.webm`); await video.delete(); }
    await writeFile(`${output}/${mode}.json`, JSON.stringify(results, null, 2));
  }
} finally { await browser.close(); }
