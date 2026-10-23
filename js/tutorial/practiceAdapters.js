import { decideMemorySelection, decideMemoryPair } from '../memoryMatch/memoryBoard.js';
import { findConnectionPath } from '../linkConnect/pathfinder.js';
import { createTripleRoundState, isTripleTileExposed } from '../tripleConnect/tripleState.js';
import { reduceTripleCommand } from '../tripleConnect/tripleRules.js';
/** Local practice state only: these adapters have no persistence, inventory or round singleton. */
export function createPractice(gameId) {
  if (gameId === 'memory-match')
    return memoryPractice();
  if (gameId === 'link-connect')
    return linkPractice();
  if (gameId === 'triple-connect')
    return triplePractice();
  throw new RangeError('Unknown practice game');
}
function memoryPractice() {
  const board = { roundId: 1, tiles: new Map(['A', 'B', 'A', 'B'].map((imageId, index) => [String(index), { imageId, matched: false }])), selectedIds: [] };
  let step = 0, mismatch = false, feedback = '';
  const instructions = ['Lật thẻ đầu tiên để xem hình.', 'Lật thẻ bên cạnh. Hai hình có giống nhau không?', 'Ghi nhớ vị trí hai hình, rồi úp chúng lại.', 'Tìm và ghép hai thẻ có hình giống nhau.', 'Tự ghép cặp còn lại để dọn bàn.', 'Bạn đã sẵn sàng!'];
  return {
    view() { return { step, instruction: instructions[step], feedback, columns: 2, rows: 2, done: step === 5, nextLabel: mismatch ? 'Ghi nhớ và úp lại' : '', targets: step === 0 ? ['0'] : step === 1 ? ['1'] : step === 3 ? ['0', '2'].filter(id => !board.selectedIds.includes(id)).slice(0, 1) : [], tiles: [...board.tiles].map(([id, t]) => ({ id, type: t.imageId, row: Math.floor(Number(id) / 2), column: Number(id) % 2, faceUp: t.matched || board.selectedIds.includes(id), matched: t.matched, selected: board.selectedIds.includes(id) })) }; },
    select(id) {
      if (step === 5 || mismatch)
        return;
      if ((step === 0 && id !== '0') || (step === 1 && id !== '1')) {
        feedback = 'Hãy chọn thẻ đang được chỉ dẫn.';
        return;
      }
      const decision = decideMemorySelection(board, id, { roundId: 1, locked: false });
      if (decision === 'reject')
        return;
      if (decision === 'deselect') {
        board.selectedIds = board.selectedIds.filter(value => value !== id);
        return;
      }
      board.selectedIds.push(id);
      feedback = '';
      if (step === 0) {
        step = 1;
        return;
      }
      if (board.selectedIds.length < 2)
        return;
      const [a, b] = board.selectedIds.map(value => board.tiles.get(value));
      if (!decideMemoryPair(a, b, { combo: 0, lastMatchAt: 0, matchedAt: 0, comboWindowMs: 0 }).matched) {
        mismatch = true;
        step = 2;
        feedback = 'Hai hình khác nhau. Bạn đã thấy vị trí của cả hai.';
        return;
      }
      a.matched = b.matched = true;
      board.selectedIds = [];
      step = [...board.tiles.values()].every(tile => tile.matched) ? 5 : 4;
      feedback = 'Ghép đúng!';
    },
    next() { if (mismatch) {
      mismatch = false;
      board.selectedIds = [];
      step = 3;
      feedback = '';
    } },
  };
}
function linkPractice() {
  let step = 0, selected = null, path = [], attempt = null, feedback = '', phase = 'select';
  let grid = scene(0), pair = [];
  function scene(index) {
    if (index === 0) return [['A', null, 'A']];
    if (index === 1) return [['A', null], [null, 'A']];
    if (index === 2) return [[null, null, null], ['A', 'B', 'A'], [null, null, null]];
    return [['A', 'B', null], ['C', null, 'C'], [null, 'B', 'A']];
  }
  const instructions = ['Nối hai hình giống nhau trên một đường thẳng.', 'Nối cặp hình qua một góc rẽ.', 'Đường nối được rẽ tối đa hai lần. Nối vòng qua hình ở giữa.', 'Thử nối hai hình ở hai góc đối diện.', 'Dọn cặp hình ở giữa để mở đường.', 'Nối lại cặp hình ở hai góc.', 'Tự nối cặp còn lại để dọn bàn.', 'Bạn đã sẵn sàng!'];
  function targets() {
    if (phase !== 'select' || step >= 6) return [];
    const type = step === 4 ? 'B' : 'A';
    const ids = grid.flatMap((row,r) => row.flatMap((value,c) => value === type ? [r + ':' + c] : []));
    return ids.filter(id => id !== selected).slice(0,1);
  }
  return {
    view() { return { step, phase, instruction: instructions[step], feedback, columns: grid[0].length, rows: grid.length, done: step === 7,
      nextLabel: phase === 'blocked' ? 'Mở đường' : phase === 'matched' ? 'Tiếp tục' : '', path, attempt, targets: targets(),
      tiles: grid.flatMap((row,r) => row.map((type,c) => ({id:r+':'+c,type,row:r,column:c,faceUp:true,selected:selected===r+':'+c,matched:pair.includes(r+':'+c)}))) }; },
    select(id) {
      if (step === 7 || phase !== 'select') return;
      const [row,column] = id.split(':').map(Number);
      if (!grid[row]?.[column]) return;
      path = []; attempt = null;
      if (selected === id) { selected=null; feedback=''; return; }
      if (!selected) { selected=id;feedback='';return; }
      const firstId=selected, [r,c]=firstId.split(':').map(Number), type=grid[r][c]; selected=null;
      if (type !== grid[row][column]) { feedback='Hai hình khác nhau. Hãy chọn hai hình giống nhau.';return; }
      if (step < 6 && type !== (step === 4 ? 'B' : 'A')) {feedback='Hãy thử cặp hình đang được chỉ dẫn.';return;}
      const route=findConnectionPath(grid,{row:r,column:c},{row,column});
      if (!route) {
        feedback='Đường đang bị chặn. Hình ở giữa cản đường; hãy dọn cặp này trước.';
        // The sample's first horizontal leg stops at the occupied neighbour.
        const direction=column>c?1:-1, blocker={row:r,column:c+direction};
        attempt={points:[{row:r,column:c},blocker],blocker};
        if (step===3) phase='blocked';
        return;
      }
      path=route;pair=[firstId,id];phase='matched';feedback='Nối đúng! Đường nối có '+Math.max(0,route.length-2)+' lần rẽ.';
      if (step===6) { grid[r][c]=grid[row][column]=null;step=7;phase='done';path=[];pair=[];feedback='Bạn đã nối hết các cặp hình.'; }
    },
    next() {
      if (phase==='blocked') {step=4;phase='select';attempt=null;feedback='Hãy nối cặp hình ở giữa.';return;}
      if (phase!=='matched') return;
      for(const id of pair){const [r,c]=id.split(':').map(Number);grid[r][c]=null;}
      step++; if(step<=3) grid=scene(step);
      selected=null;path=[];attempt=null;pair=[];phase='select';feedback='';
    },
  };
}
function triplePractice() {
  const tiles = ['A', 'B', 'C'].flatMap((type, row) => Array.from({ length: 3 }, (_, column) => ({ id: `${type}${column}`, type, slotId: `${type}${column}`, layer: type === 'A' ? 1 : 0 })));
  let state = createTripleRoundState({ tiles, coverGraph: { B0: ['A0'], B1: ['A1'], B2: ['A2'] } }), step = 0, feedback = '';
  const instructions = ['Chọn một ô ở lớp trên đang mở.', 'Gom đủ ba hình giống nhau để xóa khỏi khay.', 'Bộ ba đã biến mất, lớp dưới đã mở. Hãy chọn một ô vừa lộ.', 'Dọn hết bàn. Gom cùng hình và giữ chỗ trống trong khay.', 'Bạn đã sẵn sàng!'];
  return {
    view() { return { step, instruction: instructions[step], feedback, columns: 3, rows: 2, done: state.status === 'won', nextLabel: '', capacity: state.trayCapacity, tray: state.tray.map(id => ({ id, type: state.tiles[id].type })), targets: step === 0 ? ['A0'] : step === 1 ? ['A1', 'A2'].filter(id => state.tiles[id].location === 'board').slice(0, 1) : step === 2 ? ['B0'] : [], tiles: Object.values(state.tiles).filter(tile => tile.location === 'board').map(tile => ({ id: tile.id, type: tile.type, row: tile.type === 'C' ? 1 : 0, column: Number(tile.id.slice(1)), layer: tile.layer, faceUp: true, covered: !isTripleTileExposed(state, tile.id) })) }; },
    select(id) {
      const tile = state.tiles[id];
      if (!tile || state.status !== 'playing')
        return;
      const result = reduceTripleCommand(state, { type: 'select-tile', tileId: id });
      if (!result.result.ok) {
        feedback = 'Ô này đang bị che. Hãy dọn lớp trên trước.';
        return;
      }
      if (step === 0 && id !== 'A0' || step === 1 && tile.type !== 'A' || step === 2 && tile.type !== 'B') {
        feedback = 'Hãy chọn ô đang được chỉ dẫn.';
        return;
      }
      state = result.nextState;
      feedback = state.matchedTriples ? 'Gom đúng bộ ba để dành chỗ trong khay.' : '';
      if (state.status === 'won')
        step = 4;
      else if (step === 0)
        step = 1;
      else if (step === 1 && state.matchedTriples === 1)
        step = 2;
      else if (step === 2)
        step = 3;
    }, next() { },
  };
}
