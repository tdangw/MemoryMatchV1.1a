/** One cached ad and one presentation; a late load never starts a presentation. */
export function createInterstitialController({ native, prepare, present, config, now = Date.now, report = console.warn }) {
  let loading = null, loadedAt = null, presenting = false;
  let completions = 0, lastCompletion = null, lastPresented = null;
  const eligible = () => lastCompletion === null || completions - lastCompletion >= config.interstitialLevelGap
    && now() - lastPresented >= config.interstitialGapMs;
  const ready = () => loadedAt !== null && now() - loadedAt < config.interstitialMaxAgeMs;
  function preload() {
    if (loading || ready() || presenting || !eligible()) return loading;
    loadedAt = null;
    loading = (async () => {
      if (await prepare()) {
        await native.prepareInterstitial({ adId: config.interstitialId, npa: true });
        loadedAt = now();
      }
    })().catch(error => report('Interstitial unavailable', error.code || error.name))
      .finally(() => { loading = null; });
    return loading;
  }
  return {
    completedLevel() { completions++; void preload(); },
    async showIfReady(isCurrent = () => true) {
      if (presenting || !ready() || !eligible() || !isCurrent()) return false;
      presenting = true;
      try {
        return await present(async () => {
          if (!isCurrent()) return false;
          loadedAt = null;
          const handles = [];
          let finish, settled = false;
          const outcome = new Promise(resolve => { finish = value => {
            if (settled) return;
            settled = true; resolve(value);
          }; });
          try {
            for (const [event, result] of [['interstitialAdDismissed', true], ['interstitialAdFailedToShow', false]]) {
              handles.push(await native.addListener(event, () => finish(result)));
            }
            if (!isCurrent()) return false;
            lastCompletion = completions; lastPresented = now();
            void native.showInterstitial({ adId: config.interstitialId }).catch(() => finish(false));
            return await outcome;
          } finally { await Promise.all(handles.map(handle => handle.remove())); }
        });
      } catch (error) {
        report('Interstitial presentation unavailable', error.code || error.name);
        return false;
      } finally { presenting = false; }
    },
  };
}
