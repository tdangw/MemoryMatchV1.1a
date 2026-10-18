import { expect, test } from '@playwright/test';
test.skip(process.env.GAME_SHELL_TEST_SERVER !== 'preview', 'Built application only.');
test('painted icons and CSS assets respect the built deployment base', async ({ page }) => {
  const prefix = process.env.UI_ART_TEST_BASE || '';
  await page.route(/googleapis\.com|google-analytics\.com|googletagmanager\.com/, route => route.abort());
  await page.goto(`${prefix}/`);
  await expect(page.locator('.game-selector__choice')).toHaveCount(3);
  const images = await page.locator('.adventure-dock svg image').evaluateAll(nodes => nodes.map(node => node.getAttribute('href')));
  expect(images).toHaveLength(5);
  for (const href of images) {
    expect(href).toMatch(new RegExp(`^${prefix}/assets/images/ui/v1/`));
    const response = await page.request.get(href);
    expect(response.ok()).toBe(true);
    expect(response.headers()['content-type']).toContain('image/webp');
  }
  const nameplate = await page.locator('.game-selector__label').first().evaluate(node => getComputedStyle(node).backgroundImage);
  expect(nameplate).toContain(`${prefix}/assets/images/ui/v1/garden-inset.webp`);
});
