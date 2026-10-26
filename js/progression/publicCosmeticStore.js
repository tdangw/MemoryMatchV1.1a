import { doc, collection, query, where, documentId, limit, getDocsFromServer, runTransaction, serverTimestamp } from 'firebase/firestore';
import { normalizePublicCosmetics } from './publicCosmeticModel.js';
import { canPublishCosmetics, expandedPublicCosmeticsEnabled } from '../liveops/availability.js';
const cache = new Map(), MAX_CACHE = 100, TTL_MS = 30000;
const key = (environment, uid) => `${environment}:${uid}`;
function remember(environment, uid, selection) {
  const id = key(environment, uid); cache.delete(id); cache.set(id, { selection, at: Date.now() });
  while (cache.size > MAX_CACHE) cache.delete(cache.keys().next().value);
}
export async function publishPublicCosmetics({ database, environment, uid, selection, isCurrent = () => true, expanded = expandedPublicCosmeticsEnabled() }) {
  const normalized = normalizePublicCosmetics(selection);
  if (!canPublishCosmetics(normalized, expanded)) throw Object.assign(new Error('New public cosmetics await release.'), { code: 'cosmetics/not-enabled' });
  const ref = doc(database, 'gamespaces', environment, 'publicCosmetics', uid);
  await runTransaction(database, async transaction => {
    if (!isCurrent()) throw new DOMException('Stale cosmetic owner.', 'AbortError');
    const previous = await transaction.get(ref);
    if (!isCurrent()) throw new DOMException('Stale cosmetic owner.', 'AbortError');
    if (previous.exists() && previous.data().version === 1 && ['avatar', 'frame', 'badge'].every(slot => previous.data()[slot] === normalized[slot])) return;
    transaction.set(ref, { version: 1, ...normalized, updatedAt: serverTimestamp() });
  });
  if (!isCurrent()) return false;
  remember(environment, uid, normalized); return true;
}
export async function readPublicCosmetics({ database, environment, uids, refresh = false, offline = false }) {
  const ids = [...new Set(uids)].filter(uid => typeof uid === 'string' && uid.length > 0);
  if (ids.length > 20) throw new RangeError('Public cosmetic page exceeds its read budget.');
  const selections = new Map(), missing = [];
  for (const uid of ids) {
    const cached = cache.get(key(environment, uid));
    if (cached && (offline || !refresh && Date.now() - cached.at < TTL_MS)) selections.set(uid, cached.selection);
    else missing.push(uid);
  }
  if (offline || !missing.length) return { selections, available: true };
  try {
    for (let offset = 0; offset < missing.length; offset += 10) {
      const batch = missing.slice(offset, offset + 10);
      const snapshot = await getDocsFromServer(query(collection(database, 'gamespaces', environment, 'publicCosmetics'), where(documentId(), 'in', batch), limit(20)));
      const values = new Map(snapshot.docs.map(row => [row.id, normalizePublicCosmetics(row.data())]));
      for (const uid of batch) { const selection = values.get(uid) || normalizePublicCosmetics(null); remember(environment, uid, selection); selections.set(uid, selection); }
    }
    return { selections, available: true };
  } catch (error) {
    console.warn('Public cosmetic read unavailable', error.code || error.name);
    return { selections, available: false };
  }
}
export const getPublicCosmeticCacheSize = () => cache.size;
