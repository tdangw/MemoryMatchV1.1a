import { doc, getDocFromServer, runTransaction, serverTimestamp } from 'firebase/firestore';
import { normalizeSparkState } from './sparkModel.js';
export const sparkRef = (database, environment, uid) => doc(database, 'gamespaces', environment, 'liveops', uid);
export async function readSparkState(database, environment, uid) {
  const snapshot = await getDocFromServer(sparkRef(database, environment, uid));
  if (!snapshot.exists()) return { state: null, timestamp: null };
  const data = snapshot.data();
  return { state: data.revision === 0 ? null : normalizeSparkState(data), timestamp: data.updatedAt?.toMillis() || null,
    link:{rootRevision:data.rootRevision??null,fingerprint:data.fingerprint??null} };
}
/** One server clock confirmation per account session, never polling or on every page mount. */
export async function confirmSparkClock(database, environment, uid, isCurrent) {
  const ref = sparkRef(database, environment, uid);let reads=0;
  await runTransaction(database, async transaction => {
    const snapshot = await transaction.get(ref);reads++;
    if (!isCurrent()) throw new Error('Tài khoản đã thay đổi.');
    if (snapshot.exists()) transaction.update(ref, { updatedAt: serverTimestamp() });
    else transaction.set(ref, { version: 1, revision: 0, updatedAt: serverTimestamp() });
  });
  return {...await readSparkState(database, environment, uid),operations:{reads:reads+1,writes:1}};
}
