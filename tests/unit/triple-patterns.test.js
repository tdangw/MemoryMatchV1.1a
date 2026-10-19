import test from 'node:test';
import assert from 'node:assert/strict';
import { TRIPLE_PATTERN_MASKS } from '../../js/tripleConnect/triplePatterns.js';
import { generatePatternTripleBoard, getTripleLayout, replayTripleWitness, validateTripleLayout } from '../../js/tripleConnect/tripleBoard.js';
import { getTripleModeConfig, getTripleChallengeStage } from '../../js/tripleConnect/tripleConfig.js';

test('twenty independently masked silhouettes preserve counts, layering, piles and solvability', () => {
  assert.equal(TRIPLE_PATTERN_MASKS.length, 20);
  const signatures = new Set();
  for (let patternIndex = 0; patternIndex < 20; patternIndex++) {
    for (const mode of ['easy','normal','hard','superHard','endless','challenge']) {
      const config = mode === 'challenge' ? getTripleChallengeStage(1) : getTripleModeConfig(mode);
      const generated = generatePatternTripleBoard({ mode, patternIndex, seed: `matrix-${patternIndex}-${mode}` });
      const layout = getTripleLayout(generated.layoutId);
      assert.doesNotThrow(() => validateTripleLayout(layout));
      assert.equal(generated.board.tiles.length, config.tileCount);
      assert.equal(replayTripleWitness(generated.board, generated.witness).ok, true);
      if (mode === 'easy') {
        const points = layout.slots.filter(slot => slot.layer === 0).map(({x,y}) => [x,y]);
        const variants = [false,true].flatMap(swap => [1,-1].flatMap(dx => [1,-1].map(dy => {
          const transformed = points.map(([x,y]) => swap ? [y*dx,x*dy] : [x*dx,y*dy]);
          const minX=Math.min(...transformed.map(p=>p[0])), minY=Math.min(...transformed.map(p=>p[1]));
          return JSON.stringify(transformed.map(([x,y])=>[Math.round((x-minX)*100),Math.round((y-minY)*100)]).sort((a,b)=>a[0]-b[0]||a[1]-b[1]));
        })));
        const signature=variants.sort()[0];
        assert(!signatures.has(signature), `Pattern ${patternIndex} duplicates another silhouette by rotation/reflection.`);
        signatures.add(signature);
      }
    }
  }
  assert.equal(signatures.size, 20);
});

test('all challenge stages use the same bounded pattern registry and retain lucky rewards', () => {
  for (let level = 1; level <= 7; level++) {
    const generated = generatePatternTripleBoard({ mode: 'challenge', level, patternIndex: level + 10, seed: `stage-${level}` });
    assert.equal(generated.board.tiles.length, getTripleChallengeStage(level).tileCount);
    assert(generated.board.tiles.filter(tile => tile.lucky).length >= 1);
    assert(replayTripleWitness(generated.board, generated.witness).ok);
  }
  assert.throws(() => getTripleLayout('matrix-99-easy'));
});
