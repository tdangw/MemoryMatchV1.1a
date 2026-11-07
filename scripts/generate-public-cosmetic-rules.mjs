import { readFileSync, writeFileSync } from 'node:fs';
import { PROFILE_COSMETIC_ITEMS } from '../js/progression/achievementModel.js';
const start = '    // BEGIN generated public cosmetic contract', end = '    // END generated public cosmetic contract';
const slots = ['avatar', 'frame', 'badge'];
const checks = slots.map(slot => `        && (data.${slot} == null || data.${slot} in [${PROFILE_COSMETIC_ITEMS.filter(item => item.type === slot).map(item => `'${item.id}'`).join(', ')}])`).join('\n');
const block = `${start}
    function validPublicCosmetics(data) {
      return data.keys().hasOnly(['version', 'avatar', 'frame', 'badge', 'updatedAt'])
        && data.keys().hasAll(['version', 'avatar', 'frame', 'badge', 'updatedAt'])
        && data.version == 1 && data.updatedAt == request.time
${checks};
    }
    match /gamespaces/{space}/publicCosmetics/{uid} {
      allow delete: if knownSpace(space) && erasing(space, uid);
      allow get: if knownSpace(space);
      allow list: if knownSpace(space) && request.query.limit != null && request.query.limit <= 20;
      allow create, update: if knownSpace(space) && owner(uid) && validPublicCosmetics(request.resource.data);
      allow delete: if false;
    }
${end}`;
const path = 'firestore.rules', old = readFileSync(path, 'utf8').replace(/\r\n/g, '\n');
const next = old.includes(start) ? old.slice(0, old.indexOf(start)) + block + old.slice(old.indexOf(end) + end.length)
  : old.replace('    match /{document=**}', `${block}\n    match /{document=**}`);
if (process.argv.includes('--check')) { if (next !== old) throw new Error('Public cosmetic rules are stale.'); }
else writeFileSync(path, next);
console.log('Public cosmetic catalog rules verified.');
