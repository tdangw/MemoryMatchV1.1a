import { createStartupLoading } from './startupLoading.js';
import { preloadGameBackgrounds } from './gameShell/gameBackgroundTransition.js';
import { createStartupRecovery, isStartupNetworkError } from './startupRecovery.js';
import { acknowledgeFinishedAccountOperation } from './accountOperationJournal.js';

async function bootstrap() {
  let stage = 'modules';
  const loading = createStartupLoading({
    onSlow: () => { if (stage === 'modules') recovery.schedule(); },
    onRetry: () => { recovery.reset(); recovery.destroy(); window.location.reload(); },
  });
  const recovery = createStartupRecovery({ isWaiting: () => stage === 'modules', onExhausted: () => loading.fail('ST-NET-003') });
  const backgroundOwner = new AbortController();
  const backgrounds = preloadGameBackgrounds(backgroundOwner.signal);
  try {
    acknowledgeFinishedAccountOperation();
    const { initializeApplication } = await import('./main.js');
    stage = 'initialize'; recovery.destroy();
    loading.complete('modules');
    const ready = await initializeApplication(loading.complete);
    if (ready !== false) {
      loading.prepareHome();
      await backgrounds;
      loading.complete('home');
      await loading.finish();
    }
    recovery.reset();
    // A blocked save already has its existing recovery dialog: never cover it.
    loading.destroy();
    if (ready !== false) void import('./progression/achievementAnnouncements.js').then(module => module.resumeAchievementAnnouncements())
      .catch(error => console.error('Achievement announcement unavailable', error));
  } catch (error) {
    console.error('[Startup]', error);
    const network = stage === 'modules' && isStartupNetworkError(error);
    loading.fail(network ? 'ST-NET-001' : stage === 'modules' ? 'ST-MOD-001' : 'ST-INIT-001');
    if (network) recovery.schedule();
    else recovery.destroy();
  } finally {
    backgroundOwner.abort();
  }
}

bootstrap().catch(error => console.error('[Startup presentation]', error));
