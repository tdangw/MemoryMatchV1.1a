import { expect, test } from "@playwright/test";

test("victory ducks background music and gameplay restores the selected volume", async ({ page }) => {
  await page.goto("/");
  const volume = await page.evaluate(async () => {
    const music = document.getElementById("bg-music");
    music.pause();
    const {
      duckBackgroundMusicForVictory,
      restoreBackgroundMusic,
      syncDefaultMusic,
    } = await import("/js/sound.js");
    const settings = { music: true, musicVolume: 0.6 };

    syncDefaultMusic(settings, false);
    const normalVolume = music.volume;
    duckBackgroundMusicForVictory(settings);
    const duckedVolume = music.volume;
    syncDefaultMusic({ ...settings, musicVolume: 0.4 }, false);
    const duckedAfterSettingsChange = music.volume;
    restoreBackgroundMusic({ ...settings, musicVolume: 0.4 });
    const restoredVolume = music.volume;
    music.pause();
    return { normalVolume, duckedVolume, duckedAfterSettingsChange, restoredVolume };
  });

  expect(volume.normalVolume).toBeCloseTo(0.6);
  expect(volume.duckedVolume).toBeCloseTo(0.12);
  expect(volume.duckedAfterSettingsChange).toBeCloseTo(0.08);
  expect(volume.restoredVolume).toBeCloseTo(0.4);
});
