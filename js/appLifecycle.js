import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";

function isNativeAndroid() {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
}

export function initializeNativeAppLifecycle() {
  if (!isNativeAndroid()) return;
  App.addListener("appStateChange", ({ isActive }) => {
    document.dispatchEvent(
      new CustomEvent("memory-match-app-state", { detail: { isActive } }),
    );
  });
}

export async function exitApplication() {
  if (isNativeAndroid()) {
    await App.exitApp();
    return;
  }
  window.close();
}
