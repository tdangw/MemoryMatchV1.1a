import { collection, collectionGroup, doc, documentId, getDocFromServer, getDocsFromServer, limit, orderBy, query, serverTimestamp, setDoc, startAfter, writeBatch } from 'firebase/firestore';

export { ACCOUNT_OPERATION_KEY, saveLocalAccountOperation, loadLocalAccountOperation } from './accountOperationJournal.js';
import { ACCOUNT_SPACES } from './accountOperationJournal.js';
export { ACCOUNT_SPACES };
const PAGE_SIZE = 100;
export function operationRef(database, uid) { return doc(database, 'accountOperations', uid); }
export async function readAccountOperation(database, uid) {
  const snapshot = await getDocFromServer(operationRef(database, uid));
  return snapshot.exists() ? snapshot.data() : null;
}
// No Auth deletion here: the caller removes the identity only after every batch succeeds.
export async function eraseAccountData(database, uid, operation, isCurrent) {
  if (operation.phase && operation.phase !== 'erasing') return;
  const spaces = operation.kind === 'reset' ? [operation.space] : ACCOUNT_SPACES;
  for (const space of spaces) {
    for (;;) {
      if (!isCurrent()) throw new Error('Tài khoản đã thay đổi.');
      const objects = await getDocsFromServer(query(collection(database, 'gamespaces', space, 'players', uid, 'objects'), limit(PAGE_SIZE)));
      if (objects.empty) break;
      const batch = writeBatch(database);
      objects.docs.forEach(item => batch.delete(item.ref));
      await batch.commit();
    }
    if (!isCurrent()) throw new Error('Tài khoản đã thay đổi.');
    const batch = writeBatch(database);
    for (const name of ['players', 'profileStats', 'publicCosmetics', 'liveops']) batch.delete(doc(database, 'gamespaces', space, name, uid));
    await batch.commit();
  }
  // Legacy boards have no UID field or parent documents. Scan public entries in
  // bounded pages; store the cursor atomically with deletions for safe resumption.
  let cursor = operation.cursor || '';
  let pages = 0;
  for (;;) {
    if (!isCurrent()) throw new Error('Tài khoản đã thay đổi.');
    if (++pages > 100) throw new Error('Đã lưu tiến độ xóa. Hãy tiếp tục yêu cầu để hoàn tất.');
    const clauses = [orderBy(documentId()), ...(cursor ? [startAfter(cursor)] : []), limit(PAGE_SIZE)];
    const page = await getDocsFromServer(query(collectionGroup(database, 'entries'), ...clauses));
    if (page.empty) break;
    const batch = writeBatch(database);
    for (const item of page.docs) {
      const path = item.ref.path.split('/');
      if (path.length === 6 && path[0] === 'gamespaces' && spaces.includes(path[1]) && path[2] === 'leaderboards' && item.id === uid) batch.delete(item.ref);
    }
    cursor = page.docs.at(-1).ref.path;
    batch.update(operationRef(database, uid), { cursor });
    await batch.commit();
  }
  await setDoc(operationRef(database, uid), { phase: 'data-erased', cursor: '' }, { merge: true });
}

export async function startAccountOperation(database, operation) {
  await setDoc(operationRef(database, operation.uid), {
    kind: operation.kind, space: operation.space, phase: 'erasing', cursor: '', createdAt: serverTimestamp(),
  });
}
