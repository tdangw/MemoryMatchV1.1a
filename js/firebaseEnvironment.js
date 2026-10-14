export function getFirebaseEnvironment(hostname = globalThis.location?.hostname || 'localhost', env = import.meta.env || {}) {
  if (['production', 'beta', 'test', 'local'].includes(env.VITE_FIREBASE_ENV)) return env.VITE_FIREBASE_ENV;
  if (env.MODE === 'android') return 'production';
  if (['localhost', '127.0.0.1', '::1'].includes(hostname)) return 'local';
  if (['memorymatchv1-1b.web.app', 'memorymatchv1-1b.firebaseapp.com'].includes(hostname)) return 'beta';
  if (['memorymatch-test.web.app', 'memorymatch-test.firebaseapp.com'].includes(hostname)) return 'test';
  return 'production';
}
