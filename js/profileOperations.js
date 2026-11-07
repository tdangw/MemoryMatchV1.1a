import { loadLocalAccountOperation } from './accountOperationJournal.js';
let replacement = null;
export function canLaunchGame() { return replacement === null && !loadLocalAccountOperation(); }
export async function waitForProfileReplacement() { if (replacement) await replacement.done; }
/** One profile replacement includes durable import and RAM hydration; gameplay cannot mount halfway through it. */
export async function replaceProfileSafely(operation) {
  if (replacement) throw new Error("Đang xử lý một bản lưu khác.");
  let complete;
  const identity = { done: new Promise(resolve => { complete = resolve; }) };
  replacement = identity;
  try { return await operation(); }
  finally { if (replacement === identity) replacement = null; complete(); }
}
