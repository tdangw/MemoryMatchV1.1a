import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

export const RESET_PROJECT = 'memorymatchv1-1a';
const DOCUMENT_ROOT = `projects/${RESET_PROJECT}/databases/(default)/documents`;
const PREFIX = `${DOCUMENT_ROOT}/gamespaces/`;
const digest = value => createHash('sha256').update(value).digest('hex');

export function validateResetBackup(backup) {
  if (backup?.version !== 1 || backup.project !== RESET_PROJECT || backup.scope !== 'gamespaces'
    || !Array.isArray(backup.documents) || backup.documents.length > 100000) throw new Error('Invalid reset backup.');
  const seen = new Set();
  for (const doc of backup.documents) {
    if (typeof doc.name !== 'string' || !doc.name.startsWith(PREFIX) || seen.has(doc.name)
      || typeof doc.updateTime !== 'string' || !doc.fields || typeof doc.fields !== 'object') throw new Error('Backup contains an invalid or out-of-scope document.');
    seen.add(doc.name);
  }
  return backup;
}

export function resetDeletePlan(backup, current) {
  validateResetBackup(backup);
  const saved = new Map(backup.documents.map(doc => [doc.name,doc]));
  for (const doc of current) {
    if (saved.get(doc.name)?.updateTime !== doc.updateTime) throw new Error('Data changed after backup. Create a new backup before resetting.');
  }
  return [...current].sort((a,b)=>b.name.length-a.name.length);
}

async function run() {
  const args = process.argv.slice(2);
  const execute = args.includes('--execute');
  const backupIndex = args.indexOf('--backup');
  const backupPath = backupIndex >= 0 && args[backupIndex + 1];
  if (!backupPath || args.includes('--project') && args[args.indexOf('--project')+1] !== RESET_PROJECT)
    throw new Error('Use --backup <private-file> [--execute --sha256 <verified-hash>]. Project is fixed to memorymatchv1-1a.');
  const privateRoot = resolve('docs/qa/gameplay-progression/private');
  const path = resolve(backupPath);
  if (!path.startsWith(privateRoot + '\\') && !path.startsWith(privateRoot + '/')) throw new Error('Backup must stay inside the ignored private task folder.');
  const require = createRequire(import.meta.url);
  const auth = require('firebase-tools/lib/auth.js');
  const account = auth.getGlobalDefaultAccount();
  if (!account?.tokens?.refresh_token) throw new Error('Firebase CLI login is required.');
  async function request(method, resource, body) {
    const token = await auth.getAccessToken(account.tokens.refresh_token,['https://www.googleapis.com/auth/cloud-platform']);
    const response = await fetch(`https://firestore.googleapis.com/v1/${resource}`, {
      method, headers:{Authorization:`Bearer ${token.access_token}`,'Content-Type':'application/json'},
      ...(body ? {body:JSON.stringify(body)} : {}), signal:AbortSignal.timeout(30000),
    });
    if (!response.ok) throw new Error(`Firestore ${method} failed (${response.status}); no unverified deletion was attempted.`);
    return response.status === 204 ? {} : response.json();
  }
  async function inventory() {
    const documents = [];
    let visited = 0;
    async function collection(parent, id, depth) {
      if (depth > 32) throw new Error('Unexpected document depth.');
      let pageToken;
      do {
        const query = new URLSearchParams({pageSize:'1000',showMissing:'true',...(pageToken ? {pageToken} : {})});
        const response = await request('GET',`${parent}/${encodeURIComponent(id)}?${query}`);
        for (const doc of response.documents || []) {
          if (++visited > 100000) throw new Error('Inventory exceeds the bounded reset budget.');
          if (!doc.name.startsWith(PREFIX)) throw new Error('Inventory left the authorized gamespaces scope.');
          if (doc.updateTime) documents.push({name:doc.name,fields:doc.fields || {},updateTime:doc.updateTime,createTime:doc.createTime});
          let childToken;
          do {
            const children = await request('POST',`${doc.name}:listCollectionIds`,{pageSize:1000,...(childToken ? {pageToken:childToken} : {})});
            for (const child of children.collectionIds || []) await collection(doc.name,child,depth+1);
            childToken = children.nextPageToken;
          } while(childToken);
        }
        pageToken = response.nextPageToken;
      } while(pageToken);
    }
    await collection(DOCUMENT_ROOT,'gamespaces',0);
    return documents;
  }
  if (!execute) {
    const backup = {version:1,project:RESET_PROJECT,scope:'gamespaces',createdAt:new Date().toISOString(),documents:await inventory()};
    validateResetBackup(backup);
    const serialized = JSON.stringify(backup);
    await mkdir(privateRoot,{recursive:true});
    await writeFile(path,serialized,{flag:'wx'});
    console.log(JSON.stringify({project:RESET_PROJECT,scope:'gamespaces',documents:backup.documents.length,sha256:digest(serialized),backup:path}));
    return;
  }
  const serialized = await readFile(path,'utf8');
  const hash = args[args.indexOf('--sha256')+1];
  if (args.indexOf('--sha256') < 0 || hash !== digest(serialized)) throw new Error('Verified backup hash is required.');
  const backup = validateResetBackup(JSON.parse(serialized));
  const targets = resetDeletePlan(backup,await inventory());
  let deleted = 0;
  for(let offset=0;offset<targets.length;offset+=50) {
    const group=targets.slice(offset,offset+50);
    await request('POST',`projects/${RESET_PROJECT}/databases/(default)/documents:commit`,{
      writes:group.map(doc=>({delete:doc.name,currentDocument:{updateTime:doc.updateTime}})),
    });
    deleted += group.length;
    await writeFile(path+'.reset.json',JSON.stringify({project:RESET_PROJECT,backupSha256:hash,deleted,planned:targets.length,updatedAt:new Date().toISOString()}));
  }
  const remaining = (await inventory()).length;
  console.log(JSON.stringify({project:RESET_PROJECT,scope:'gamespaces',deleted,remaining,backupSha256:hash}));
  if (remaining) throw new Error('Clients wrote more data during reset. A fresh backup is required.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href)
  run().catch(error=>{console.error(error.message);process.exitCode=1;});
