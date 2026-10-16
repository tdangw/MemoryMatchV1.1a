// Public identifiers for this Android application, not credentials.
export const AD_CONFIG = Object.freeze({
  appId: 'ca-app-pub-2780380420199964~5572977569',
  bannerId: 'ca-app-pub-2780380420199964/4149796201',
  interactionGap: 8,
  webBannerHeight: 50,
});

export function validateAdConfig(config = AD_CONFIG) {
  if (!/^ca-app-pub-\d{16}~\d{10}$/.test(config.appId) ||
      !/^ca-app-pub-\d{16}\/\d{10}$/.test(config.bannerId) ||
      config.appId.split('~')[0] !== config.bannerId.split('/')[0]) {
    throw new Error('Invalid Android AdMob application/banner configuration');
  }
  return config;
}

// The owner selected child protection for every player, without collecting age.
export const AD_PRIVACY = Object.freeze({
  consent: Object.freeze({ tagForUnderAgeOfConsent: true }),
  initialization: Object.freeze({ tagForChildDirectedTreatment: true, maxAdContentRating: 'General' }),
});
