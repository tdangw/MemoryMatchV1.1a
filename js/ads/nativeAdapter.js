import { registerPlugin } from '@capacitor/core';
import { AdMob } from '@capacitor-community/admob';
import { App } from '@capacitor/app';

// The upstream plugin resolves removeBanner before its UI-thread work ends.
// Forward both mutations on Android's UI thread so serialized JS operations
// cannot create a new banner before the previous one has actually been removed.
const BannerBridge = registerPlugin('BannerBridge');
const RewardedBridge = registerPlugin('RewardedBridge');
const rewardEvents = new Set(['onRewardedVideoAdReward', 'onRewardedVideoAdDismissed', 'onRewardedVideoAdFailedToShow']);
export const nativeAds = {
  requestConsentInfo: options => AdMob.requestConsentInfo(options),
  showConsentForm: () => AdMob.showConsentForm(),
  initialize: options => AdMob.initialize(options),
  showPrivacyOptionsForm: () => AdMob.showPrivacyOptionsForm(),
  addListener: (event, listener) => rewardEvents.has(event) ? RewardedBridge.addListener(event, listener) : AdMob.addListener(event, listener),
  showBanner: options => BannerBridge.showBanner(options),
  removeBanner: () => BannerBridge.removeBanner(),
  prepareRewardVideoAd: options => AdMob.prepareRewardVideoAd(options),
  showRewardVideoAd: options => RewardedBridge.showRewardVideoAd(options),
  prepareInterstitial: options => AdMob.prepareInterstitial(options),
  showInterstitial: options => AdMob.showInterstitial(options),
};
export const nativeApp = App;
