import { initializeApp, deleteApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator, terminate } from "firebase/firestore";

let initialization = null;
let connection = null;
export function getFirebaseEnvironment(hostname = globalThis.location?.hostname || "localhost", env = import.meta.env || {}) {
  if (["production", "beta", "test", "local"].includes(env.VITE_FIREBASE_ENV)) return env.VITE_FIREBASE_ENV;
  if (env.MODE === "android") return "production";
  if (["localhost", "127.0.0.1", "::1"].includes(hostname)) return "local";
  if (["memorymatchv1-1b.web.app", "memorymatchv1-1b.firebaseapp.com"].includes(hostname)) return "beta";
  if (["memorymatch-test.web.app", "memorymatch-test.firebaseapp.com"].includes(hostname)) return "test";
  return "production";
}
export function getFirebaseBackend() {
  if (!initialization) initialization = initializeBackend().catch(error => { initialization = null; throw error; });
  return initialization;
}
async function initializeBackend() {
  const env = import.meta.env || {};
  if (env.VITE_FIREBASE_DISABLED === "1") return null;
  const emulator = env.VITE_FIREBASE_USE_EMULATORS === "1";
  const config = emulator ? { apiKey: "demo-key", projectId: "demo-memory-match", authDomain: "localhost" } : {
    apiKey: env.VITE_FIREBASE_API_KEY, authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID, storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID, appId: env.VITE_FIREBASE_APP_ID,
    measurementId: env.VITE_FIREBASE_MEASUREMENT_ID,
  };
  if (!config.apiKey || !config.projectId || !config.authDomain) throw new Error("Thiếu cấu hình Firebase.");
  const app = initializeApp(config);
  const auth = getAuth(app);
  const database = getFirestore(app);
  if (emulator) {
    connectAuthEmulator(auth, "http://127.0.0.1:9199", { disableWarnings: true });
    connectFirestoreEmulator(database, "127.0.0.1", 8180);
  }
  connection = { app, auth, database, emulator, environment: getFirebaseEnvironment() };
  return connection;
}
export async function disposeFirebaseBackend() {
  if (connection) { await terminate(connection.database); await deleteApp(connection.app); }
  connection = initialization = null;
}
