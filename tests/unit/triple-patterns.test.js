import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
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


test('versioned interleaving preserves all 240 legacy layouts byte for byte', () => {
  const configs=[...['easy','normal','hard','superHard','endless'].map(getTripleModeConfig),...Array.from({length:7},(_,i)=>getTripleChallengeStage(i+1))];
  const digest=createHash('sha256');
  for(let index=0;index<20;index++)for(const config of configs){
    const baseId=config.layoutId||(config.mode==='superHard'?'super-hard':config.mode);
    const old=getTripleLayout(`matrix-${String(index).padStart(2,'0')}-${baseId}`);
    digest.update(JSON.stringify(old));
    const current=getTripleLayout(`matrix-v2-${String(index).padStart(2,'0')}-${baseId}`);
    assert.doesNotThrow(()=>validateTripleLayout(current));
    assert.equal(current.slots.length,old.slots.length);
  }
  assert.equal(digest.digest('hex'),'6f835e2a93b4c27f139e7f68f5ef4b562e333bb2308053d2fc8a4ae436862e15');
});

test('new layers have independent row layouts and reveal their lower faces',()=>{
  for(let index=0;index<20;index++){
    const layout=getTripleLayout(`matrix-v2-${String(index).padStart(2,'0')}-easy`);
    assert.deepEqual(layout.layerCounts,[12,9,6]);
    const signatures=[0,1,2].map(layer=>{
      const slots=layout.slots.filter(slot=>slot.layer===layer);
      assert(new Set(slots.map(slot=>slot.y)).size>=3,'Every layer must span several rows.');
      const minX=Math.min(...slots.map(slot=>slot.x)),minY=Math.min(...slots.map(slot=>slot.y));
      return new Set(slots.map(slot=>`${Math.round((slot.x-minX)*100)},${Math.round((slot.y-minY)*100)}`));
    });
    for(let layer=1;layer<3;layer++)assert([...signatures[layer]].some(point=>!signatures[layer-1].has(point)),
      'A layer must not repeat a translated subset of the preceding layer.');
    let visible=0,total=0;
    for(const slot of layout.slots.filter(slot=>slot.layer<2))for(let x=0;x<20;x++)for(let y=0;y<20;y++){
      const px=slot.x+layout.tileWidth*(x+.5)/20,py=slot.y+layout.tileHeight*(y+.5)/20;total++;
      if(!layout.slots.some(other=>other.layer>slot.layer&&px>=other.x&&px<other.x+layout.tileWidth&&py>=other.y&&py<other.y+layout.tileHeight))visible++;
    }
    assert(visible/total>.25,`${layout.id} exposes too little of its lower cards: ${visible/total}`);
  }
});
