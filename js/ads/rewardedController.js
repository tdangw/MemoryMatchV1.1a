const EVENTS = { earned: 'onRewardedVideoAdReward', dismiss: 'onRewardedVideoAdDismissed',
  error: 'onRewardedVideoAdFailedToShow', noFill: 'onRewardedVideoAdFailedToLoad' };
/** Native presentation reports outcomes only; it never grants coins. */
export async function presentRewarded(native, options, onEarned = () => {}, isCurrent = () => true) {
  const handles = []; let earned = false, settled = false, finish;
  const markEarned = () => {
    if (earned) return;
    earned = true;
    Promise.resolve().then(onEarned).catch(error => console.warn('Rewarded confirmation awaits recovery', error.code || error.name));
  };
  const outcome = new Promise(resolve => { finish = type => {
    if (settled) return; settled = true; resolve({ type, earned });
  }; });
  try {
    for (const [type, event] of Object.entries(EVENTS)) handles.push(await native.addListener(event, () => {
      if (type === 'earned') markEarned();
      else finish(type);
    }));
    try { await native.prepareRewardVideoAd(options); }
    catch (error) { finish(error.code === '3' || error.code === 3 ? 'noFill' : 'error'); }
    if (!settled && !isCurrent()) finish('cancelled');
    if (!settled) void native.showRewardVideoAd({ adId: options.adId }).then(result => {
      if (result?.earned === true) markEarned();
      finish('dismiss');
    }, () => finish('error'));
    return await outcome;
  } finally {
    await Promise.all(handles.map(handle => handle.remove()));
  }
}
