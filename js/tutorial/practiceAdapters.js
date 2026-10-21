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
  const instructions = ['Lật thẻ đầu tiên để xem hình.', 'Lật thẻ bên cạnh. Hai hình có giống nhau không?', 'Ghi nhớ vị trí hai hình, rồi úp chúng lại.', 'Tìm và ghép hai thẻ có hình giống nhau.', 'Tự ghép cặp còn lại để dọn bàn.', 'Bạn đã biết ghi nhớ và ghép cặp!'];
  return {
    view() { return { step, instruction: instructions[step], feedback, columns: 2, rows: 2, done: step === 5, nextLabel: mismatch ? 'Ghi nhớ và úp lại' : '', targets: step === 0 ? ['0'] : step === 1 ? ['1'] : step === 3 ? ['0', '2'] : [], tiles: [...board.tiles].map(([id, t]) => ({ id, type: t.imageId, row: Math.floor(Number(id) / 2), column: Number(id) % 2, faceUp: t.matched || board.selectedIds.includes(id), matched: t.matched, selected: board.selectedIds.includes(id) })) }; },
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
  let step = 0, selected = null, path = [], feedback = '', matched = false, blockedTried = false;
  let grid = scene(0);
  function scene(index) { return index === 0 ? [[null, null, null], ['A', null, 'A'], [null, null, null]] : index === 1 ? [[null, null, null, null], [null, 'A', null, null], [null, null, 'A', null], [null, null, null, null]] : [['A', 'B', null], ['C', null, 'C'], [null, 'B', 'A']]; }
  const instructions = ['Nối hai hình giống nhau trên một đường thẳng.', 'Nối cặp hình qua một góc rẽ.', 'Thử nối hai hình ở hai góc đối diện để thấy đường bị chặn.', 'Dọn cặp hình ở giữa để mở đường.', 'Nối lại cặp hình ở hai góc.', 'Tự nối cặp còn lại để dọn bàn.', 'Bạn đã biết mở đường và nối cặp!'];
  return {
    view() { const columns = grid[0].length; return { step, instruction: instructions[step], feedback, columns, rows: grid.length, done: step === 6, nextLabel: matched && step < 2 ? 'Tiếp tục' : '', path, targets: step === 2 ? ['0:0', '2:2'] : step === 3 ? ['0:1', '2:1'] : [], tiles: grid.flatMap((row, r) => row.map((type, c) => ({ id: `${r}:${c}`, type, row: r, column: c, faceUp: true, selected: selected === `${r}:${c}` }))) }; },
    select(id) {
      if (step === 6 || matched)
        return;
      const [row, column] = id.split(':').map(Number);
      if (!grid[row]?.[column])
        return;
      if (selected === id) {
        selected = null;
        return;
      }
      if (!selected) {
        selected = id;
        path = [];
        feedback = '';
        return;
      }
      const [r, c] = selected.split(':').map(Number), first = grid[r][c], second = grid[row][column];
      selected = null;
      if (first !== second) {
        feedback = 'Hãy chọn hai hình giống nhau.';
        return;
      }
      const route = findConnectionPath(grid, { row: r, column: c }, { row, column });
      if (!route) {
        feedback = 'Đường đang bị chặn. Hãy dọn cặp hình ở giữa trước.';
        if (step === 2) {
          blockedTried = true;
          step = 3;
        }
        return;
      }
      if (step === 2 && !blockedTried) {
        feedback = 'Trước tiên, hãy thử cặp hình ở hai góc đang được chỉ dẫn.';
        return;
      }
      if (step === 3 && first !== 'B') {
        feedback = 'Hãy dọn cặp hình ở giữa trước.';
        return;
      }
      if (step === 4 && first !== 'A') {
        feedback = 'Đường đã mở. Hãy nối lại hai hình ở góc.';
        return;
      }
      grid[r][c] = grid[row][column] = null;
      path = route;
      feedback = 'Nối đúng!';
      if (step < 2)
        matched = true;
      else if (step === 3)
        step = 4;
      else if (step === 4)
        step = 5;
      else
        step = 6;
    },
    next() { if (matched && step < 2) {
      step++;
      grid = scene(step);
      matched = false;
      selected = null;
      path = [];
      feedback = '';
    } },
  };
}
function triplePractice() {
  const tiles = ['A', 'B', 'C'].flatMap((type, row) => Array.from({ length: 3 }, (_, column) => ({ id: `${type}${column}`, type, slotId: `${type}${column}`, layer: type === 'A' ? 1 : 0 })));
  let state = createTripleRoundState({ tiles, coverGraph: { B0: ['A0'], B1: ['A1'], B2: ['A2'] } }), step = 0, feedback = '';
  const instructions = ['Chọn một ô ở lớp trên đang mở.', 'Gom đủ ba hình giống nhau để xóa khỏi khay.', 'Bộ ba đã biến mất, lớp dưới đã mở. Hãy chọn một ô vừa lộ.', 'Dọn hết bàn. Gom cùng hình và giữ chỗ trống trong khay.', 'Bạn đã biết ghép bộ ba và mở lớp dưới!'];
  return {
    view() { return { step, instruction: instructions[step], feedback, columns: 3, rows: 2, done: state.status === 'won', nextLabel: '', capacity: state.trayCapacity, tray: state.tray.map(id => ({ id, type: state.tiles[id].type })), targets: step === 0 ? ['A0'] : step === 1 ? ['A1', 'A2'] : step === 2 ? ['B0', 'B1', 'B2'] : [], tiles: Object.values(state.tiles).filter(tile => tile.location === 'board').map(tile => ({ id: tile.id, type: tile.type, row: tile.type === 'C' ? 1 : 0, column: Number(tile.id.slice(1)), layer: tile.layer, faceUp: true, covered: !isTripleTileExposed(state, tile.id) })) }; },
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
