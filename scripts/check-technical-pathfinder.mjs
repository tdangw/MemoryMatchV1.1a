import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import * as candidate from '../js/linkConnect/pathfinder.js';
import { decideLinkSelection } from '../js/linkConnect/linkTurn.js';

// Freeze the pre-refactor implementation, including traversal/tie-break order.
const source = readFileSync(new URL('./fixtures/pathfinder-baseline.txt', import.meta.url), 'utf8')
  .replace('"./linkConfig.js"', JSON.stringify(new URL('../js/linkConnect/linkConfig.js', import.meta.url).href));
const baseline = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
let seed = 19102026;
const random = () => ((seed = (Math.imul(seed,1664525)+1013904223) >>> 0)/4294967296);
const boards = [];
for (const size of [4, 6, 8, 10]) for (let index=0; index<25; index++) {
  boards.push(Array.from({ length:size+2 }, (_,r) => Array.from({ length:size+2 }, (_,c) => r===0 || c===0 || r===size+1 || c===size+1 || random()<.25 ? null : { id: `image-${Math.floor(random()*8)}`, frozen:random()<.1 })));
}
for (const grid of [...boards, null, [], [[]], [[null],[]]]) {
  const expected = baseline.findAvailableConnections(grid);
  assert.deepEqual(candidate.findAvailableConnections(grid), expected);
  assert.equal(candidate.hasAvailableConnection(grid), expected.length>0);
  if (candidate.findFirstAvailableConnection) assert.deepEqual(candidate.findFirstAvailableConnection(grid), expected[0] || null);
  if (!grid?.length) continue;
  for (let index=0;index<30;index++) {
    const start = { row:Math.floor(random()*grid.length), column:Math.floor(random()*(grid[0]?.length || 1)) };
    const end = { row:Math.floor(random()*grid.length), column:Math.floor(random()*(grid[0]?.length || 1)) };
    assert.deepEqual(candidate.findConnectionPath(grid,start,end),baseline.findConnectionPath(grid,start,end));
  }
}
for (const grid of boards) {
  const board={grid};
  for (let index=0;index<20;index++) {
    const selected=index%3===0 ? null : {row:1,column:1};
    const position={row:1+index%(grid.length-2),column:1};
    const tile=grid[position.row][position.column], first=selected && grid[selected.row][selected.column];
    const path=first?.id===tile?.id && first && tile ? baseline.findConnectionPath(grid,selected,position) : null;
    const type=!tile || tile.frozen ? 'reject' : !selected ? 'select' : selected.row===position.row && selected.column===position.column ? 'deselect' : path ? 'match' : 'mismatch';
    assert.equal(decideLinkSelection({board,selected,position}).type,type);
    assert.equal(decideLinkSelection({board,selected,position,locked:true}).type,'reject');
    assert.equal(decideLinkSelection({board,selected,position,paused:true}).type,'reject');
  }
}
for (const [start,end] of [[null,null],[{row:-1,column:0},{row:1,column:1}],[{row:1,column:1},{row:1,column:1}]]) {
  assert.deepEqual(candidate.findConnectionPath(boards[0],start,end),baseline.findConnectionPath(boards[0],start,end));
}
const adjacent=[[null,null,null,null],[null,{id:'a'},{id:'a'},null],[null,null,null,null]];
const annotatedStart={row:1,column:1,annotation:'preserved-public-payload'};
assert.deepEqual(candidate.findConnectionPath(adjacent,annotatedStart,{row:1,column:2}),baseline.findConnectionPath(adjacent,annotatedStart,{row:1,column:2}));
function measure(implementation, method) {
  const samples=[];
  for(let repeat=0;repeat<7;repeat++) {
    const begin=performance.now();
    for(const board of boards) implementation[method](board);
    samples.push(performance.now()-begin);
  }
  samples.sort((a,b)=>a-b);
  return { p50:samples[3],p95:samples[6],p99:samples[6],samples };
}
// Warm both implementations before measuring; do not change RNG or game timing.
measure(baseline,'hasAvailableConnection'); measure(candidate,'hasAvailableConnection');
const report = { boards:boards.length, routeComparisons:3000, baseline:{boolean:measure(baseline,'hasAvailableConnection'),listing:measure(baseline,'findAvailableConnections')}, candidate:{boolean:measure(candidate,'hasAvailableConnection'),listing:measure(candidate,'findAvailableConnections')} };
const path=process.argv[2];
if(path) { mkdirSync(new URL('../docs/qa/technical-improvement/',import.meta.url),{recursive:true}); writeFileSync(path,JSON.stringify(report,null,2)); }
console.log(JSON.stringify(report,null,2));
