import { readFileSync, writeFileSync } from 'node:fs';
import { PROFILE_COSMETIC_ITEMS } from '../js/progression/achievementModel.js';
const start = '    // BEGIN generated public cosmetic contract', end = '    // END generated public cosmetic contract';
const slots = ['avatar', 'frame', 'badge'];
const checks = slots.map(slot => `        && (data.${slot} == null || data.${slot} in [${PROFILE_COSMETIC_ITEMS.filter(item => item.type === slot).map(item => `'${item.id}'`).join(', ')}])`).join('\n');
const block = `${start}
    function validPublicCosmetics(data) {
      return data.keys().hasOnly(['version', 'avatar', 'frame', 'badge', 'updatedAt', 'levels'])
        && data.keys().hasAll(['version', 'avatar', 'frame', 'badge', 'updatedAt'])
        && data.version in [1,2] && data.updatedAt == request.time
        && (data.version == 1 ? !data.keys().hasAny(['levels'])
          : data.levels is map && data.levels.keys().hasAll(['avatar','frame','badge']) && data.levels.keys().hasOnly(['avatar','frame','badge'])
${slots.map(slot=>`          && data.levels.${slot} is int && (data.${slot} == null ? data.levels.${slot} == 0 : data.levels.${slot} >= 1 && data.levels.${slot} <= 21)`).join('\n')})
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
