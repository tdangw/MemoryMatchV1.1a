import { Capacitor } from '@capacitor/core';
export const isAndroidAdsPlatform = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
