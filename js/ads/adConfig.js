// Public identifiers for this Android application, not credentials.
export const AD_CONFIG = Object.freeze({
  appId: 'ca-app-pub-2780380420199964~5572977569',
  bannerId: 'ca-app-pub-2780380420199964/4149796201',
  rewardedId: 'ca-app-pub-2780380420199964/3309776306',
  interstitialId: 'ca-app-pub-2780380420199964/4262880842',
  interstitialLevelGap: 3,
  interstitialGapMs: 120000,
  interstitialMaxAgeMs: 55 * 60000,
  interactionGap: 8,
  webBannerHeight: 50,
  retryDelayMs: 60000,
  maxRetries: 3,
});

export function validateAdConfig(config = AD_CONFIG) {
  if (!/^ca-app-pub-\d{16}~\d{10}$/.test(config.appId) ||
      !/^ca-app-pub-\d{16}\/\d{10}$/.test(config.bannerId) ||
      config.appId.split('~')[0] !== config.bannerId.split('/')[0]) {
    throw new Error('Invalid Android AdMob application/banner configuration');
  }
  for (const key of ['rewardedId', 'interstitialId']) {
    if (config[key] !== undefined && (!/^ca-app-pub-\d{16}\/\d{10}$/.test(config[key]) || config[key].split('/')[0] !== config.appId.split('~')[0])) {
      throw new Error('Invalid Android fullscreen ad configuration');
    }
  }
  return config;
}

// The owner selected child protection for every player, without collecting age.
export const AD_PRIVACY = Object.freeze({
  consent: Object.freeze({ tagForUnderAgeOfConsent: true }),
  initialization: Object.freeze({ tagForChildDirectedTreatment: true, maxAdContentRating: 'General' }),
});
