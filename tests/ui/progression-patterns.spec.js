import { test, expect } from '@playwright/test';

test('twenty Triple silhouettes have a contact sheet for visual review', async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 1280 });
  await page.goto('/');
  const layouts = await page.evaluate(async () => {
    const { getTripleLayout } = await import('/js/tripleConnect/tripleBoard.js');
    return Array.from({ length: 20 }, (_, index) => getTripleLayout(`matrix-${String(index).padStart(2,'0')}-easy`));
  });
  expect(new Set(layouts.map(layout => layout.patternId)).size).toBe(20);
  await page.setContent(`<main style="display:grid;grid-template-columns:repeat(5,1fr);gap:16px;background:#0c2732;padding:20px;color:#ffe1a1;font:16px sans-serif">${layouts.map((layout,index) => `<section style="background:#163945;border-radius:12px;padding:12px;text-align:center"><div>${index+1}. ${layout.patternId}</div><svg width="260" height="235" viewBox="-1 -1 ${layout.gridWidth+2} ${layout.gridHeight+2}">${layout.slots.map(slot => `<rect x="${slot.x}" y="${slot.y}" width="2" height="2" rx=".2" fill="${['#497379','#b29456','#f2dca5'][slot.layer]}" stroke="#09232b" stroke-width=".035"/>`).join('')}</svg></section>`).join('')}</main>`);
  await page.locator('main').first().screenshot({ path: 'docs/qa/gameplay-progression/triple-patterns-contact.png' });
});
