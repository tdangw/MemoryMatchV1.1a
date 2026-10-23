import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizePublicCosmetics, publicCosmeticFingerprint, publicCosmeticSelection } from '../../js/progression/publicCosmeticModel.js';
import { ACHIEVEMENT_ITEMS } from '../../js/progression/achievementModel.js';
test('Public cosmetic projection exposes only version and three known slot IDs', () => {
  const value = Object.fromEntries(['avatar','frame','badge'].map(slot=>[slot,ACHIEVEMENT_ITEMS.find(item=>item.type===slot).id]));
  assert.deepEqual(publicCosmeticSelection({profileCosmetics:value,email:'private',coins:900}), {version:1,...value});
  const empty={avatar:null,frame:null,badge:null};
  for(const input of [undefined,null,{},[],{version:2,...value},{version:1,avatar:'https://foreign/image',frame:value.avatar,badge:'unknown'}]) assert.deepEqual(normalizePublicCosmetics(input),empty);
  assert.equal(publicCosmeticFingerprint({version:1,...value}),publicCosmeticFingerprint({version:1,...value,updatedAt:123,email:'ignored'}));
});
