import { chromium } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
const browser = await chromium.launch({ channel: 'chrome' });
const output = 'docs/design/animated-backgrounds/qa';
const results = [];
try {
  for (const profile of [{ name: 'portrait', width: 412, height: 915, dpr: 3 }, { name: 'landscape', width: 844, height: 390, dpr: 2 }, { name: 'desktop', width: 1024, height: 900, dpr: 1 }]) {
    const context = await browser.newContext({ viewport: { width: profile.width, height: profile.height + 60 }, deviceScaleFactor: profile.dpr, reducedMotion: 'no-preference',
      ...(profile.name !== 'desktop' ? { recordVideo: { dir: `${output}/videos`, size: { width: profile.width, height: profile.height + 60 } } } : {}) });
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:4188/docs/design/animated-backgrounds/pilot.html');
    const frame = page.frames().find(frame => frame.parentFrame());
    await frame.waitForSelector('.game-selector__choice');
    await frame.locator('[data-game-id="memory-match"]').click();
    await frame.locator('.adventure-map-node[data-level="1"]').click();
    await frame.getByRole('button', { name: 'Chơi', exact: true }).click();
    await frame.getByRole('button', { name: 'Bỏ qua', exact: true }).click();
    await frame.waitForSelector('#grid-container .tile');
    await frame.waitForSelector('#grid-container:not(.is-locked)');
    if (await frame.locator('.tutorial-guide').isVisible()) {
      await frame.getByRole('button', { name: 'Đã hiểu', exact: true }).click();
      await frame.locator('.tutorial-guide').waitFor({ state: 'hidden' });
    }
    const cdp = await context.newCDPSession(page);
    let layers = [];
    cdp.on('LayerTree.layerTreeDidChange', event => { if (event.layers) layers = event.layers; });
    await cdp.send('LayerTree.enable');
    await page.evaluate(() => window.mountAmbientPilot('memory'));
    await page.waitForTimeout(1000);
    const ownedLayers = [];
    for (const layer of layers) {
      if (!layer.backendNodeId) continue;
      const { object } = await cdp.send('DOM.resolveNode', { backendNodeId: layer.backendNodeId });
      try {
        const response = await cdp.send('Runtime.callFunctionOn', { objectId: object.objectId,
          functionDeclaration: "function() { return this.nodeType === 1 && this.closest('.ambient-bg-pilot') ? this.getAttribute('class') : null; }", returnByValue: true });
        if (response.result.value) ownedLayers.push({ ...layer, owner: response.result.value });
      } finally { await cdp.send('Runtime.releaseObject', { objectId: object.objectId }); }
    }
    const diagnostics = await page.evaluate(() => window.ambientPilotDiagnostics());
    if (diagnostics.nodes > 24 || diagnostics.handles > 5 || ownedLayers.length > 6) throw new Error(`Light budget exceeded: ${JSON.stringify({ diagnostics, ownedLayers })}`);
    await frame.locator('body').screenshot({ path: `${output}/easy-${profile.name}-memory.png`, scale: 'css' });
    const release = await page.evaluate(() => {
      for (let i = 0; i < 100; i++) {
        const owner = window.mountAmbientPilot('memory'); owner.dispose(); owner.dispose();
        const data = owner.diagnostics();
        if (data.nodes || data.handles || data.pendingFrames || data.timers) throw new Error('Disposed owner retained resources');
      }
      return window.ambientPilotDiagnostics();
    });
    await page.evaluate(() => window.mountAmbientPilot('memory'));
    if (profile.name !== 'desktop') await page.waitForTimeout(12000);
    results.push({ profile, diagnostics, ownedLayers, estimatedLayerBytesAtDPR: ownedLayers.reduce((sum, layer) => sum + layer.width * layer.height * 4 * profile.dpr ** 2, 0), release });
    const video = page.video(); await context.close();
    if (video) { await video.saveAs(`${output}/pilot-easy-${profile.name}.webm`); await video.delete(); }
    await writeFile(`${output}/pilot-audit.json`, JSON.stringify(results, null, 2));
    console.log(`${profile.name}: ${diagnostics.kinds.join(',')} / ${ownedLayers.length} owned layers`);
  }
} finally { await browser.close(); }
