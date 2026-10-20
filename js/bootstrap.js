import { createStartupLoading } from './startupLoading.js';

async function bootstrap() {
  let loading = createStartupLoading();
  try {
    const { initializeApplication } = await import('./main.js');
    loading.complete('modules');
    const ready = await initializeApplication(loading.complete);
    if (ready !== false) {
      loading.prepareHome();
      loading.complete('home');
      await loading.finish();
    }
    // A blocked save already has its existing recovery dialog: never cover it.
    loading.destroy();
  } catch (error) {
    console.error('[Startup]', error);
    loading.fail();
  } finally {
    loading = null;
  }
}

bootstrap().catch(error => console.error('[Startup presentation]', error));
