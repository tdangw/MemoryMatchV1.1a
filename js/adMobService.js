import {
  AdMob,
  AdmobConsentStatus,
  BannerAdPluginEvents,
  BannerAdPosition,
  BannerAdSize,
  MaxAdContentRating,
} from "@capacitor-community/admob";
import { Capacitor } from "@capacitor/core";

const BANNER_GUARD_PX = 16;
const ADMOB_ANDROID_IDS = Object.freeze({
  banner: import.meta.env.VITE_ADMOB_ANDROID_BANNER_ID?.trim(),
  rewarded: import.meta.env.VITE_ADMOB_ANDROID_REWARDED_ID?.trim(),
  interstitial: import.meta.env.VITE_ADMOB_ANDROID_INTERSTITIAL_ID?.trim(),
});

let initialization;
let bannerSizeListener;

export function isNativeAdMobSupported() {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
}

function setBannerReserveHeight(height = 50) {
  const placeholder = document.getElementById("ad-banner-placeholder");
  if (!placeholder) return;
  placeholder.classList.add("is-native-admob");
  placeholder.style.height = `${Math.max(50, Math.min(100, height)) + BANNER_GUARD_PX}px`;
  window.dispatchEvent(new Event("resize"));
}

async function initializeAdMob() {
  if (!isNativeAdMobSupported()) return false;
  if (initialization) return initialization;

  initialization = (async () => {
    try {
      await AdMob.initialize({ maxAdContentRating: MaxAdContentRating.General });
      let consentInfo = await AdMob.requestConsentInfo();
      if (
        !consentInfo.canRequestAds &&
        consentInfo.status === AdmobConsentStatus.REQUIRED &&
        consentInfo.isConsentFormAvailable
      ) {
        consentInfo = await AdMob.showConsentForm();
      }
      return consentInfo.canRequestAds;
    } catch (error) {
      console.warn("AdMob initialization or consent failed:", error);
      return false;
    }
  })();

  return initialization;
}

/** Shows the Android-only adaptive banner while a game board is visible. */
export async function showGameplayBanner() {
  if (!(await initializeAdMob()) || !ADMOB_ANDROID_IDS.banner) return false;

  try {
    if (!bannerSizeListener) {
      bannerSizeListener = await AdMob.addListener(
        BannerAdPluginEvents.SizeChanged,
        ({ height }) => setBannerReserveHeight(height),
      );
    }
    await AdMob.showBanner({
      adId: ADMOB_ANDROID_IDS.banner,
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 0,
    });
    setBannerReserveHeight();
    return true;
  } catch (error) {
    console.warn("AdMob banner failed:", error);
    return false;
  }
}

export async function hideGameplayBanner() {
  if (!isNativeAdMobSupported()) return;
  try {
    await AdMob.removeBanner();
  } catch {
    // The banner may not have been created yet.
  }
}

export const adMobUnitIdsConfigured = Object.freeze({
  rewarded: Boolean(ADMOB_ANDROID_IDS.rewarded),
  interstitial: Boolean(ADMOB_ANDROID_IDS.interstitial),
});
