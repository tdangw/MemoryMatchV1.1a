import { gameState } from '../gameState.js';
import { saveSetting } from '../persistence.js';
import { normalizeTutorialProgress, TUTORIAL_GAMES, TUTORIAL_TOPICS } from './tutorialModel.js';
let pending = Promise.resolve();
export function readTutorialProgress() { return normalizeTutorialProgress(gameState.settings.tutorialProgress); }
export function markTutorialFlag(group, key) {
  if (!(group === 'completed' ? TUTORIAL_GAMES : group === 'seen' ? TUTORIAL_TOPICS : []).includes(key))
    throw new RangeError('Unknown tutorial flag');
  const owner = gameState.settings;
  const result = pending.then(async () => {
    if (owner !== gameState.settings)
      return false;
    const next = normalizeTutorialProgress(owner.tutorialProgress);
    if (next[group][key])
      return true;
    next[group][key] = true;
    if (!await saveSetting('tutorialProgress', next) || owner !== gameState.settings)
      return false;
    owner.tutorialProgress = next;
    return true;
  });
  pending = result.then(() => { }, () => { });
  return result;
}
