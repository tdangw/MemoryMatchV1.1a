import test from 'node:test';
import assert from 'node:assert/strict';
import { gameState, hydrateGameState, recordMemoryMatchResult } from '../../js/gameState.js';
import { stageActiveSession, getActiveSession } from '../../js/sessionProgress.js';
import { createWaveProgress, completeWave, activateNextWave } from '../../js/progression/waveProgress.js';
import { indexedDB } from 'fake-indexeddb';
import { openChapterDatabase, writeChapterProfile, hydrateChapterProfile, readChapterProfile } from '../../js/chapterStore.js';
import { createLinkBoard } from '../../js/linkConnect/linkBoard.js';
import { generatePatternTripleBoard } from '../../js/tripleConnect/tripleBoard.js';
import { createTripleRoundState, serializeTripleRoundState } from '../../js/tripleConnect/tripleState.js';

const wave = (gameId = 'memory-match') => createWaveProgress({ attemptId: 'attempt-session', gameId, mode: 'easy', level: 1, groupsPerWave: 6 });

test('wave metadata must agree with the pair board at stage and hydration boundaries',()=>{
  const common={version:1,seed:'fixture',themeId:'default',score:0,moves:0,misses:0,combo:0,matchedPairs:0,totalPairs:6,luckyAwards:[]};
  const cards=Array.from({length:6},(_,i)=>({id:`pair-${i}`,src:'/assets/fixture.webp',alt:'Card'}));
  const snapshots={
    'memory-match':{...common,gameId:'memory-match',tiles:cards.flatMap(card=>[0,1].map(()=>({id:card.id,matched:false,special:false}))),luckyRewards:[]},
    'link-connect':{...common,gameId:'link-connect',board:createLinkBoard({layout:{tileCount:12,columns:4},cardProvider:()=>cards,random:()=>.5})},
  };
  for(const [gameId,pairSnapshot] of Object.entries(snapshots)) {
    hydrateGameState();
    const session={mode:'easy',level:1,pairSnapshot,wave:wave(gameId)};
    assert.equal(stageActiveSession(gameId,session),true);
    const corrupt={...session,wave:createWaveProgress({attemptId:'mismatch',gameId,mode:'easy',level:1,groupsPerWave:7})};
    assert.equal(stageActiveSession(gameId,corrupt),false);
    const key=gameId==='memory-match'?'memoryMatch':'linkConnect';
    hydrateGameState({progress:{[key]:{sessionsByMode:{easy:corrupt}}}});
    assert.equal(getActiveSession(gameId,'easy').waveInvalid,true);
  }
});

test('Triple playing checkpoint also validates group count, not just won checkpoints',()=>{
  hydrateGameState();
  const generated=generatePatternTripleBoard({mode:'easy',patternIndex:0,seed:'checkpoint'});
  const state=createTripleRoundState(generated.board);
  const session={mode:'easy',level:1,layoutId:generated.layoutId,snapshot:serializeTripleRoundState(state),remainingTime:75,
    wave:createWaveProgress({attemptId:'triple',gameId:'triple-connect',mode:'easy',level:1,groupsPerWave:9})};
  assert.equal(stageActiveSession('triple-connect',session),true);
  const corrupt={...session,wave:createWaveProgress({attemptId:'mismatch',gameId:'triple-connect',mode:'easy',level:1,groupsPerWave:10})};
  assert.equal(stageActiveSession('triple-connect',corrupt),false);
  hydrateGameState({progress:{tripleConnect:{sessionsByMode:{easy:corrupt}}}});
  assert.equal(getActiveSession('triple-connect','easy'),null);
});

test('wave checkpoint survives the normal persistence/hydration boundary without losing phase or budget', () => {
  hydrateGameState();
  const advanced = completeWave(wave(), { score: 60, moves: 12, misses: 0, matchedGroups: 6 }).progress;
  assert.equal(stageActiveSession('memory-match', { mode: 'easy', level: 1, wave: advanced, remainingTime: 80 }), true);
  hydrateGameState({ progress: JSON.parse(JSON.stringify(gameState.progress)) });
  const restored = getActiveSession('memory-match', 'easy');
  assert.deepEqual(restored.wave, advanced);
  assert.equal(restored.remainingTime, 80);
  assert.equal(restored.wave.phase, 'advance');
  assert.equal(stageActiveSession('memory-match', { ...restored, wave: { ...advanced, allocatedSeconds: 999 } }), false);
  assert.deepEqual(getActiveSession('memory-match', 'easy'), restored);
  assert.equal(stageActiveSession('link-connect', { mode: 'easy', level: 1, wave: advanced }), false);
});

test('original budgets hydrate with the exact saved clock and receive the new next-wave grant', () => {
  for (const [gameId, oldBudget, newBudget] of [['memory-match', 65, 75], ['link-connect', 50, 60],
    ['triple-connect', 75, 60]]) {
    hydrateGameState();
    const saved = { mode: 'easy', level: 1, remainingTime: 23, timeLimit: oldBudget,
      levelStartTime: oldBudget, wave: { ...wave(gameId), allocatedSeconds: oldBudget } };
    if (gameId === 'triple-connect') {
      const generated = generatePatternTripleBoard({ mode: 'easy', patternIndex: 0, seed: 'legacy-clock' });
      saved.layoutId = generated.layoutId;
      saved.snapshot = serializeTripleRoundState(createTripleRoundState(generated.board));
      saved.wave.groupsPerWave = 9;
    }
    assert.equal(stageActiveSession(gameId, saved), true);
    hydrateGameState({ progress: JSON.parse(JSON.stringify(gameState.progress)) });
    const restored = getActiveSession(gameId, 'easy');
    assert.equal(restored.remainingTime, 23);
    if (gameId !== 'triple-connect') assert.equal(restored.timeLimit, oldBudget);
    assert.equal(restored.wave.allocatedSeconds, oldBudget);
    const next = completeWave(restored.wave, { score: 60, moves: 12, misses: 0, matchedGroups: restored.wave.groupsPerWave });
    assert.equal(next.bonusSeconds, newBudget);
    assert.equal(next.progress.allocatedSeconds, oldBudget + newBudget);
  }
});

test('corrupt wave input blocks resume rather than silently replacing it with a single-wave game', () => {
  hydrateGameState({ progress: { memoryMatch: { sessionsByMode: { easy: { mode: 'easy', level: 1, wave: { ...wave(), version: 99 } } } } } });
  assert.equal(getActiveSession('memory-match', 'easy').waveInvalid, true);
  hydrateGameState({ progress: JSON.parse(JSON.stringify(gameState.progress)) });
  assert.equal(getActiveSession('memory-match', 'easy').waveInvalid, true);
  assert.equal(stageActiveSession('memory-match', getActiveSession('memory-match', 'easy')), false);
});

test('wave and its granted budget share the durable chapter-profile revision', async () => {
  globalThis.indexedDB = indexedDB;
  hydrateGameState();
  const advanced = completeWave(wave(), { score: 60, moves: 12, misses: 0, matchedGroups: 6 }).progress;
  assert(stageActiveSession('memory-match', { mode: 'easy', level: 1, wave: advanced, remainingTime: 83 }));
  const database = await openChapterDatabase();
  try {
    const envelope = { formatVersion: 2, revision: 1, data: structuredClone({ coins: gameState.coins,
      settings: gameState.settings, appearance: gameState.appearance, progress: gameState.progress }) };
    await writeChapterProfile(database, envelope, 0);
    const restored = await hydrateChapterProfile(database, await readChapterProfile(database));
    assert.deepEqual(restored.progress.memoryMatch.sessionsByMode.easy.wave, advanced);
    assert.equal(restored.progress.memoryMatch.sessionsByMode.easy.remainingTime, 83);
    await assert.rejects(writeChapterProfile(database, { ...envelope, revision: 2 }, 0));
    const durable = await readChapterProfile(database);
    const afterFailure = await hydrateChapterProfile(database, durable);
    assert.equal(durable.revision, 1);
    assert.equal(afterFailure.progress.memoryMatch.sessionsByMode.easy.remainingTime, 83);
  } finally { database.close(); }
});

test('only terminal multi-wave results certify progress, and duplicate settlements are rejected', () => {
  hydrateGameState();
  const first = completeWave(wave(), { score: 60, moves: 12, misses: 0, matchedGroups: 6 }).progress;
  assert.throws(() => recordMemoryMatchResult({ mode: 'easy', level: 1, score: 60, stars: 1, wave: first }));
  const terminal = completeWave(activateNextWave(first), { score: 120, moves: 24, misses: 0, matchedGroups: 6 }).progress;
  const firstWin = recordMemoryMatchResult({ mode: 'easy', level: 1, score: 120, stars: 1, wave: terminal });
  assert.deepEqual(firstWin.mastery, { expGained:10, fragmentGained:false, gameId:'memory-match',block:1,tier:'C',beforeExp:0,afterExp:10 });
  assert.equal(gameState.progress.memoryMatch.bestByLevel['easy:1'].completedWaves, 2);
  const previous = structuredClone(gameState.progress.memoryMatch);
  assert.throws(() => recordMemoryMatchResult({ mode: 'easy', level: 1, score: 120, stars: 1, wave: terminal }));
  assert.deepEqual(gameState.progress.memoryMatch, previous);
  hydrateGameState({ progress: JSON.parse(JSON.stringify(gameState.progress)) });
  assert.equal(gameState.progress.memoryMatch.bestByLevel['easy:1'].rulesVersion, 1);
  assert.equal(gameState.progress.memoryMatch.settledAttempts.easy, terminal.attemptId);
  const replay = recordMemoryMatchResult({ mode: 'easy', level: 1, score: 100, stars: 1, wave: { ...terminal, attemptId: 'replay' } });
  assert.deepEqual(replay.mastery, { expGained: 0, fragmentGained: false });
  for (const mode of ['normal','hard']) gameState.progress.memoryMatch.bestByLevel[`${mode}:1`] = { rulesVersion:1, cleared:true, score:120, stars:1, completedWaves:2 };
  const mastered = recordMemoryMatchResult({ mode:'superHard', level:1, score:120, stars:1,
    wave:{...terminal, mode:'superHard', attemptId:'mastery', allocatedSeconds:100} });
  assert.deepEqual(mastered.mastery, { expGained:10, fragmentGained:true, gameId:'memory-match',block:1,tier:'S',beforeExp:0,afterExp:10 });
});
