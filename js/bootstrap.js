import { createStartupLoading } from './startupLoading.js';
import { preloadGameBackgrounds } from './gameShell/gameBackgroundTransition.js';

async function bootstrap() {
  let loading = createStartupLoading();
  const backgroundOwner = new AbortController();
  const backgrounds = preloadGameBackgrounds(backgroundOwner.signal);
  try {
    const { initializeApplication } = await import('./main.js');
    loading.complete('modules');
    const ready = await initializeApplication(loading.complete);
    if (ready !== false) {
      loading.prepareHome();
      await backgrounds;
      loading.complete('home');
      await loading.finish();
    }
    // A blocked save already has its existing recovery dialog: never cover it.
    loading.destroy();
    if (ready !== false) void import('./progression/achievementAnnouncements.js').then(module => module.resumeAchievementAnnouncements())
      .catch(error => console.error('Achievement announcement unavailable', error));
  } catch (error) {
    console.error('[Startup]', error);
    loading.fail();
  } finally {
    backgroundOwner.abort();
    loading = null;
  }
}

bootstrap().catch(error => console.error('[Startup presentation]', error));
