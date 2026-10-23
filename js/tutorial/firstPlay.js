import { openPractice } from './practice.js';
import { gameState } from '../gameState.js';
import { getGameProgressKey } from '../gameCatalog.js';
import { readTutorialProgress } from './tutorialProgress.js';
import { hasTutorialPlayEvidence } from './tutorialModel.js';
// Bounded by the lifetime of a settings profile. Failed preference writes cannot trap a player.
const acknowledged = new WeakMap();
export async function confirmFirstPlay(gameId, owner) {
  const settings = gameState.settings, key = getGameProgressKey(gameId), profile = gameState.progress[key];
  const current = () => owner.active && gameState.settings === settings && gameState.progress[key] === profile;
  if (!current()) return false;
  const flags = readTutorialProgress();
  if (flags.completed[gameId] || flags.skipped[gameId] || hasTutorialPlayEvidence(profile) || acknowledged.get(settings)?.has(gameId)) return true;
  const practice = openPractice(gameId, { owner, firstPlay: true });
  const outcome = await practice.result;
  if (!current() || outcome === 'cancelled') return false;
  let games = acknowledged.get(settings);
  if (!games) { games = new Set(); acknowledged.set(settings, games); }
  games.add(gameId);
  return true;
}
