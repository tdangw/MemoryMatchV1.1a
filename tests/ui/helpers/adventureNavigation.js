import { expect } from '@playwright/test';

export async function previewMapLevel(page, level = 1, mode = null) {
  await page.locator(`[data-level="${level}"]`).click();
  await expect(page.locator('#adventure-level-modal')).toBeVisible();
  if (mode) await page.locator(`#adventure-level-modal input[value="${mode}"]`).check();
}
export async function startMapLevel(page, level = 1, mode = null) {
  await previewMapLevel(page, level, mode);
  await page.locator('#adventure-level-modal').getByRole('button', { name: 'Chơi', exact: true }).click();
}
export async function closeLevelPreview(page) {
  await page.locator('#adventure-level-modal .app-modal__close').click();
  await expect(page.locator('#adventure-level-modal')).toHaveCount(0);
}
