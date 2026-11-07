export const ACCOUNT_OPERATION_KEY = 'memoryMatchAccountOperation';
// Revocation belongs to this page: another tab clearing the durable journal must
// never reopen writes from callbacks that still hold the erased profile.
let writesRevoked = false;
export const ACCOUNT_SPACES = ['production','beta','test','local','production-waves1','beta-waves1','test-waves1','local-waves1'];
export function saveLocalAccountOperation(value) {
  localStorage.setItem(ACCOUNT_OPERATION_KEY, JSON.stringify(value));
  writesRevoked = true;
}
export function loadLocalAccountOperation() {
  // Pure rules also run without browser storage; persistence rejects writes there.
  if (typeof globalThis.localStorage === 'undefined') return null;
  const value = localStorage.getItem(ACCOUNT_OPERATION_KEY);
  if (!value) return null;
  const parsed = JSON.parse(value);
  if (!parsed || !['delete','reset','logout'].includes(parsed.kind) || typeof parsed.uid !== 'string' || !ACCOUNT_SPACES.includes(parsed.space)) throw new Error('Yêu cầu tài khoản không hợp lệ.');
  return parsed;
}
export function isLocalAccountDataLocked() {
  if (loadLocalAccountOperation()) writesRevoked = true;
  return writesRevoked;
}
// Only a fresh page may reopen writes after durable local erasure.
export function acknowledgeFinishedAccountOperation() {
  if (loadLocalAccountOperation()?.phase === 'finished') localStorage.removeItem(ACCOUNT_OPERATION_KEY);
  writesRevoked = false;
}
