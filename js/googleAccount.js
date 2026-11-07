import { Capacitor, registerPlugin } from '@capacitor/core';
import { GoogleAuthProvider } from 'firebase/auth';
const nativeGoogle = registerPlugin('GoogleAccount');
export const isNativeGoogle = () => Capacitor.getPlatform() === 'android';
export async function clearNativeGoogleSession() {
  if (isNativeGoogle()) await nativeGoogle.clearSession();
}
export async function getNativeGoogleCredential() {
  const result = await nativeGoogle.credential();
  if (!result.idToken) throw new Error('Google credential is missing.');
  return GoogleAuthProvider.credential(result.idToken);
}
