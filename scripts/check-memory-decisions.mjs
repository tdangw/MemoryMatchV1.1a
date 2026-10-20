import assert from 'node:assert/strict';
import { memoryBoard, mountMemoryBoard, clearMemoryBoard, decideMemorySelection, decideMemoryPair, snapshotMemoryTiles } from '../js/memoryMatch/memoryBoard.js';

mountMemoryBoard([{id:'a'},{id:'b'},{id:'a',special:true},{id:'c',matched:true}],7);
const eligibility={roundId:7,locked:false};
assert.equal(decideMemorySelection(memoryBoard,'tile-0',eligibility),'select');
assert.equal(decideMemorySelection(memoryBoard,'tile-3',eligibility),'reject');
assert.equal(decideMemorySelection(memoryBoard,'tile-0',{...eligibility,roundId:8}),'reject');
assert.equal(decideMemorySelection(memoryBoard,'tile-0',{...eligibility,locked:true}),'reject');
assert.equal(decideMemorySelection(memoryBoard,'tile-0',{...eligibility,hasImage:false}),'reject');
memoryBoard.selectedIds=['tile-0'];
assert.equal(decideMemorySelection(memoryBoard,'tile-0',eligibility),'deselect');
assert.equal(decideMemorySelection(memoryBoard,'unknown',eligibility),'reject');
const first=memoryBoard.tiles.get('tile-0');
for (const delta of [0,999,1000,1001,3000]) for (const lastMatchAt of [0,1,10000]) for (const combo of [0,1,10]) {
  const params={combo,lastMatchAt,matchedAt:lastMatchAt+delta,comboWindowMs:1000};
  const expected=lastMatchAt && params.matchedAt-lastMatchAt<=1000 ? combo+1 : 1;
  assert.deepEqual(decideMemoryPair(first,memoryBoard.tiles.get('tile-2'),params),{matched:true,combo:expected});
  assert.deepEqual(decideMemoryPair(first,memoryBoard.tiles.get('tile-1'),params),{matched:false,combo:0});
}
assert.deepEqual(snapshotMemoryTiles(),[{id:'a',special:false,matched:false},{id:'b',special:false,matched:false},{id:'a',special:true,matched:false},{id:'c',special:false,matched:true}]);
clearMemoryBoard(); clearMemoryBoard();
assert.equal(memoryBoard.tiles.size,0); assert.deepEqual(memoryBoard.selectedIds,[]);
console.log('Memory pure selection/pair clock boundaries, snapshot format and idempotent cleanup passed.');
