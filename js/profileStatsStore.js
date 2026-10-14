import { doc, getDocFromServer, runTransaction, serverTimestamp } from 'firebase/firestore';
import { mergeProfileCounter } from './profileStatsModel.js';
function reference(database, environment, uid) { return doc(database, 'gamespaces', environment, 'profileStats', uid); }
export async function readPrivateProfileStats(database, environment, uid) {
  const snapshot = await getDocFromServer(reference(database, environment, uid));
  return snapshot.exists() ? snapshot.data() : null;
}
export async function publishProfileCounter({ database, environment, uid, local, isCurrent = () => true }) {
  const commit = () => runTransaction(database, async transaction => {
    if (!isCurrent()) throw new Error('Account changed');
    const ref = reference(database, environment, uid); const snapshot = await transaction.get(ref);
    if (!isCurrent()) throw new Error('Account changed');
    const previous = snapshot.exists() ? snapshot.data() : null;
    const next = mergeProfileCounter(previous, local.counterId, local.totalMs, local.trackedSince);
    if (!previous || next.totalPlayMs !== previous.totalPlayMs) transaction.set(ref, { ...next, counterId: local.counterId, updatedAt: serverTimestamp() });
    return next;
  });
  for (let attempt = 0; attempt < 3; attempt++) {
    try { return await commit(); }
    catch (error) { if (error.code !== 'permission-denied' || attempt === 2 || !isCurrent()) throw error; }
  }
}
