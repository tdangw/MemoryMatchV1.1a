import { createPractice } from './practiceAdapters.js';
import { markTutorialFlag } from './tutorialProgress.js';
import { getThemeCards, getThemeSelectionAssets } from '../themeCatalog.js';
import { getGameDefinition } from '../gameCatalog.js';
import { openAppModal } from '../modal.js';
import { createGameShellLifecycle } from '../gameShell/gameShellLifecycle.js';
import { createIcon } from '../icons.js';
import { gameState } from '../gameState.js';
import '../../styles/tutorial.css';
export function openPractice(gameId, { owner } = {}) {
  const definition = getGameDefinition(gameId);
  if (!definition)
    throw new RangeError('Unknown practice game');
  const scope = createGameShellLifecycle(), identity = gameState.settings;
  const assets = getThemeCards('fruits', 3, { assetPaths: getThemeSelectionAssets('fruits').slice(0, 3).map(asset => asset.path) });
  if (assets.length !== 3)
    throw new Error('Practice illustrations unavailable');
  const art = Object.fromEntries(['A', 'B', 'C'].map((type, index) => [type, assets[index]]));
  let adapter = createPractice(gameId), saving = false, completionSaved = false, generation = 0;
  const content = document.createElement('div');
  content.className = 'practice';
  const modal = openAppModal({ id: 'practice-modal', title: `Tập luyện ${definition.title}`, icon: 'book', content, owner, size: 'large', keepBanner: false, onDestroy: () => scope.dispose() });
  const current = () => scope.active && gameState.settings === identity;
  const heading = document.createElement('h3');
  heading.className = 'practice__instruction';
  heading.id = 'practice-instruction';
  const board = document.createElement('div');
  board.className = 'practice__board';
  board.setAttribute('role', 'group');
  board.setAttribute('aria-labelledby', heading.id);
  const tray = document.createElement('div');
  tray.className = 'practice__tray';
  tray.setAttribute('aria-label', 'Khay tập luyện');
  const feedback = document.createElement('p');
  feedback.className = 'practice__feedback';
  feedback.setAttribute('role', 'status');
  const note = document.createElement('p');
  note.className = 'app-modal__note';
  note.textContent = 'Bạn có thể thử thoải mái. Bài tập không dùng vật phẩm và không tính phần thưởng.';
  const actions = document.createElement('div');
  actions.className = 'practice__actions';
  const next = button('', () => { if (adapter.view().done) {
    if (!saving)
      void complete();
  }
  else {
    adapter.next();
    draw();
  } });
  next.classList.add('app-button--primary');
  const retryArt = button('Tải lại hình', () => draw());
  retryArt.hidden = true;
  const replay = button('Xem lại', () => { generation++; adapter = createPractice(gameId); saving = false; completionSaved = false; draw(); });
  const skip = button('Bỏ qua', () => modal.close());
  actions.append(next, retryArt, replay, skip);
  content.append(heading, board, tray, feedback, actions, note);
  scope.listen(content, 'error', event => { if (event.target instanceof HTMLImageElement) {
    board.inert = true;
    next.disabled = true;
    feedback.textContent = 'Chưa tải được hình. Hãy thử lại.';
    retryArt.hidden = false;
  } }, true);
  scope.listen(board, 'click', event => { const target = event.target.closest('[data-practice-tile]'); if (!target || !current() || document.hidden)
    return; adapter.select(target.dataset.practiceTile); draw(target.dataset.practiceTile); });
  function button(label, action) { const node = document.createElement('button'); node.type = 'button'; node.className = 'app-button'; node.textContent = label; scope.listen(node, 'click', () => { if (current())
    action(); }); return node; }
  function picture(type) { const image = document.createElement('img'); image.src = art[type].src; image.alt = art[type].alt; image.draggable = false; return image; }
  function draw(focusId) {
    if (!current()) {
      modal.destroy();
      return;
    }
    const view = adapter.view();
    content.dataset.step = String(view.step);
    content.dataset.complete = String(view.done);
    board.inert = false;
    retryArt.hidden = true;
    next.disabled = false;
    heading.textContent = view.instruction;
    feedback.textContent = view.feedback;
    board.style.setProperty('--practice-columns', String(view.columns));
    board.style.setProperty('--practice-rows', String(view.rows));
    const cells = Array.from({ length: view.rows * view.columns }, () => { const cell = document.createElement('div'); cell.className = 'practice__cell'; return cell; });
    for (const tile of view.tiles) {
      if (!tile.type)
        continue;
      const node = document.createElement('button');
      node.type = 'button';
      node.dataset.practiceTile = tile.id;
      node.className = 'practice__tile';
      node.classList.toggle('is-covered', tile.covered === true);
      node.classList.toggle('is-selected', tile.selected === true);
      node.classList.toggle('is-matched', tile.matched === true);
      node.classList.toggle('is-target', view.targets.includes(tile.id));
      node.classList.toggle('is-dimmed', view.targets.length > 0 && !view.targets.includes(tile.id));
      node.disabled = tile.matched === true || tile.covered === true || view.done;
      if (tile.layer !== undefined) {
        node.style.setProperty('--practice-layer', String(tile.layer));
        node.classList.add('is-layered');
      }
      node.setAttribute('aria-label', tile.covered ? 'Ô đang bị che' : tile.faceUp ? art[tile.type].alt : `Thẻ ${Number(tile.id) + 1}`);
      node.setAttribute('aria-pressed', String(tile.selected === true));
      if (tile.faceUp)
        node.append(picture(tile.type));
      else
        node.append(createIcon('images'));
      if (tile.covered)
        node.append(createIcon('lock'));
      if (view.targets.includes(tile.id)) {
        const pointer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        pointer.classList.add('practice__pointer');
        pointer.setAttribute('viewBox', '0 0 32 40');
        pointer.setAttribute('aria-hidden', 'true');
        pointer.innerHTML = '<path d="M10 22V5a3 3 0 0 1 6 0v12l2-2 3 2 3-1 4 5v10l-5 7H12L3 26c-2-4 2-6 5-3l2 2" fill="#fff0ce" stroke="#754520" stroke-width="2"/>';
        node.append(pointer);
      }
      cells[tile.row * view.columns + tile.column].append(node);
    }
    board.replaceChildren(...cells);
    if (view.path?.length) {
      const route = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      route.classList.add('practice__path');
      route.setAttribute('viewBox', `0 0 ${view.columns * 100} ${view.rows * 100}`);
      route.setAttribute('aria-hidden', 'true');
      const line = document.createElementNS(route.namespaceURI, 'polyline');
      line.setAttribute('points', view.path.map(p => `${p.column * 100 + 50},${p.row * 100 + 50}`).join(' '));
      route.append(line);
      board.append(route);
    }
    tray.replaceChildren();
    tray.hidden = !view.capacity;
    if (view.capacity) {
      const label = document.createElement('p');
      label.textContent = `Khay: ${view.tray.length}/${view.capacity}`;
      const slots = document.createElement('div');
      slots.className = 'practice__slots';
      for (let index = 0; index < view.capacity; index++) {
        const slot = document.createElement('span');
        if (view.tray[index])
          slot.append(picture(view.tray[index].type));
        slots.append(slot);
      }
      tray.append(label, slots);
    }
    next.hidden = !view.nextLabel;
    next.textContent = view.nextLabel;
    skip.textContent = view.done ? 'Xong' : 'Bỏ qua';
    if (focusId)
      (board.querySelector(`[data-practice-tile="${focusId}"]:not(:disabled)`) || (!next.hidden && next) || board.querySelector('button:not(:disabled)') || skip).focus();
    if (view.done && !completionSaved && !saving)
      void complete();
  }
  async function complete() {
    const run = generation;
    saving = true;
    feedback.textContent = 'Đang lưu bài đã học…';
    try {
      const saved = await markTutorialFlag('completed', gameId);
      if (!current() || run !== generation)
        return;
      completionSaved = saved;
      feedback.textContent = saved ? 'Đã hoàn thành bài tập. Bạn có thể xem lại bất cứ lúc nào.' : 'Chưa lưu được bài đã học. Hãy thử lại.';
    }
    catch (error) {
      if (current() && run === generation)
        feedback.textContent = 'Chưa lưu được bài đã học. Hãy thử lại.';
      console.error('Practice progress failed', error.name);
    }
    finally {
      if (current() && run === generation) {
        saving = false;
        if (!completionSaved) {
          next.hidden = false;
          next.textContent = 'Thử lưu lại';
        }
      }
    }
  }
  draw();
  return { ...modal, diagnostics: () => scope.diagnostics() };
}
