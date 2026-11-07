import { isAppActive } from '../appVisibility.js';
import { createPractice } from './practiceAdapters.js';
import { markTutorialFlag } from './tutorialProgress.js';
import { getThemeCards, getThemeSelectionAssets } from '../themeCatalog.js';
import { getGameDefinition } from '../gameCatalog.js';
import { openAppModal } from '../modal.js';
import { createGameShellLifecycle } from '../gameShell/gameShellLifecycle.js';
import { createIcon } from '../icons.js';
import { gameState } from '../gameState.js';
import { canLaunchGame } from '../profileOperations.js';
import '../../styles/tutorial.css';
export function openPractice(gameId, { owner, firstPlay = false } = {}) {
  const definition = getGameDefinition(gameId);
  if (!definition)
    throw new RangeError('Unknown practice game');
  const scope = createGameShellLifecycle(), identity = gameState.settings;
  const assets = getThemeCards('fruits', 3, { assetPaths: getThemeSelectionAssets('fruits').slice(0, 3).map(asset => asset.path) });
  if (assets.length !== 3)
    throw new Error('Practice illustrations unavailable');
  const art = Object.fromEntries(['A', 'B', 'C'].map((type, index) => [type, assets[index]]));
  let adapter = createPractice(gameId), saving = false, completionSaved = false, generation = 0;
  let settle;
  const result = new Promise(resolve => { settle = resolve; });
  const content = document.createElement('div');
  content.className = 'practice';
  const modal = openAppModal({ id: 'practice-modal', title: `Tập luyện ${definition.title}`, icon: 'book', content, owner, size: 'large', keepBanner: true, onDestroy: () => { scope.dispose(); settle('cancelled'); } });
  const current = () => scope.active && gameState.settings === identity && canLaunchGame();
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
  note.textContent = 'Bạn có thể thử tự do, không tốn vật phẩm.';
  const actions = document.createElement('div');
  actions.className = 'practice__actions';
  function proceed(outcome) {
    if (outcome === 'skipped') void markTutorialFlag('skipped', gameId).catch(error => console.warn('Tutorial skip unavailable', error.name));
    settle(outcome); modal.close();
  }
  const next = button('', () => { if (adapter.view().done) {
    if (firstPlay) proceed('completed'); else modal.close();
  } else { adapter.next(); draw('next'); } });
  next.classList.add('app-button--primary');
  const retryArt = button('Tải lại hình', () => draw('next'));
  retryArt.hidden = true;
  const replay = button('Xem lại', () => { generation++; adapter = createPractice(gameId); saving = false; completionSaved = false; draw('next'); });
  const skip = button('Bỏ qua', () => firstPlay ? proceed('skipped') : modal.close());
  const retrySave = button('Thử lưu lại', () => { if (!saving) void complete(); });
  retrySave.hidden = true;
  actions.append(next, retryArt, retrySave, replay, skip);
  content.append(heading, board, tray, feedback, actions, note);
  scope.listen(document, 'appvisibilitychange', () => { content.inert = !isAppActive(); });
  scope.listen(content, 'error', event => { if (event.target instanceof HTMLImageElement) {
    board.inert = true;
    next.disabled = true;
    feedback.textContent = 'Chưa tải được hình. Hãy thử lại.';
    retryArt.hidden = false;
  } }, true);
  scope.listen(board, 'click', event => { const target = event.target.closest('[data-practice-tile]'); if (!target || !current() || !isAppActive())
    return; adapter.select(target.dataset.practiceTile); draw(target.dataset.practiceTile); });
  function button(label, action) { const node = document.createElement('button'); node.type = 'button'; node.className = 'app-button'; node.textContent = label; scope.listen(node, 'click', () => {
    if (!current()) { modal.destroy(); return; }
    if (isAppActive()) action();
  }); return node; }
  function picture(type) { const image = document.createElement('img'); image.src = art[type].src; image.alt = {A:'Chùm quả tím', B:'Quả đỏ có hạt', C:'Quả xanh'}[type]; image.draggable = false; return image; }
  function draw(focusId) {
    if (!current()) {
      modal.destroy();
      return;
    }
    const view = adapter.view();
    content.dataset.step = String(view.step);
    content.dataset.complete = String(view.done);
    board.hidden = view.done;
    board.inert = false;
    retryArt.hidden = true;
    next.disabled = false;
    heading.textContent = view.instruction;
    feedback.textContent = view.feedback;
    board.style.setProperty('--practice-columns', String(view.columns));
    board.style.setProperty('--practice-rows', String(view.rows));
    const cells = view.done ? [] : Array.from({ length: view.rows * view.columns }, () => { const cell = document.createElement('div'); cell.className = 'practice__cell'; return cell; });
    for (const tile of view.done ? [] : view.tiles) {
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
      node.setAttribute('aria-label', tile.covered ? 'Ô đang bị che' : tile.faceUp ? {A:'Chùm quả tím', B:'Quả đỏ có hạt', C:'Quả xanh'}[tile.type] : `Thẻ ${Number(tile.id) + 1}`);
      node.setAttribute('aria-pressed', String(tile.selected === true));
      if (tile.faceUp)
        node.append(picture(tile.type));
      else
        node.append(createIcon('images'));
      if (tile.covered)
        node.append(createIcon('lock'));
      if (view.targets[0] === tile.id && !view.nextLabel) node.append(pointer());
      if (view.attempt?.blocker && tile.row === view.attempt.blocker.row && tile.column === view.attempt.blocker.column) node.classList.add('is-blocker');
      cells[tile.row * view.columns + tile.column].append(node);
    }
    board.replaceChildren(...cells);
    if (view.path?.length || view.attempt) {
      const route = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      route.classList.add('practice__path');
      if (view.attempt) route.classList.add('practice__path--blocked');
      route.setAttribute('viewBox', `0 0 ${view.columns * 100} ${view.rows * 100}`);
      route.setAttribute('aria-hidden', 'true');
      const line = document.createElementNS(route.namespaceURI, 'polyline');
      line.setAttribute('points', (view.attempt?.points || view.path).map(p => `${p.column * 100 + 50},${p.row * 100 + 50}`).join(' '));
      route.append(line);
      if (view.attempt) {
        const mark = document.createElementNS(route.namespaceURI, 'path');
        const x=view.attempt.blocker.column*100+50, y=view.attempt.blocker.row*100+50;
        mark.setAttribute('d', 'M'+(x-12)+' '+(y-12)+'l24 24m0 -24l-24 24');mark.classList.add('practice__block-mark');route.append(mark);
      }
      board.append(route);
    }
    tray.replaceChildren();
    tray.hidden = !view.capacity || view.done;
    if (view.capacity && !view.done) {
      const label = document.createElement('p');
      label.textContent = `Khay: ${view.tray.length}/${view.capacity}`;
      const slots = document.createElement('div');
      slots.className = 'practice__slots';
      slots.style.setProperty('--practice-capacity', String(view.capacity));
      for (let index = 0; index < view.capacity; index++) {
        const slot = document.createElement('span');
        if (view.tray[index])
          slot.append(picture(view.tray[index].type));
        slots.append(slot);
      }
      tray.append(label, slots);
    }
    next.hidden = !view.nextLabel && !view.done;
    next.textContent = view.done ? (firstPlay ? 'Bắt đầu chơi' : 'Xong') : view.nextLabel;
    if (!next.hidden) next.append(pointer());
    skip.hidden = view.done;
    retrySave.hidden = true;
    if (focusId)
      ((!next.hidden && next) || board.querySelector(".is-target:not(:disabled)") || board.querySelector(`[data-practice-tile="${focusId}"]:not(:disabled)`) || board.querySelector('button:not(:disabled)') || skip).focus();
    if (view.done && !completionSaved && !saving)
      void complete();
  }
  async function complete() {
    const run = generation;
    saving = true;
    retrySave.hidden = true;
    feedback.textContent = 'Bạn có thể bắt đầu chơi hoặc xem lại bài.';
    try {
      const saved = await markTutorialFlag('completed', gameId);
      if (!current()) { modal.destroy(); return; }
      if (run !== generation) return;
      completionSaved = saved;
      feedback.textContent = saved ? 'Bạn có thể xem lại hướng dẫn bất cứ lúc nào.' : 'Chưa lưu được hướng dẫn. Bạn vẫn có thể chơi hoặc thử lưu lại.';
    }
    catch (error) {
      if (current() && run === generation)
        feedback.textContent = 'Chưa lưu được hướng dẫn. Bạn vẫn có thể chơi hoặc thử lưu lại.';
      console.error('Practice progress failed', error.name);
    }
    finally {
      if (current() && run === generation) {
        saving = false;
        if (!completionSaved) {
          retrySave.hidden = false;
        }
      }
    }
  }
  draw();
  return { ...modal, result, diagnostics: () => scope.diagnostics() };
}

function pointer() {
  const node = document.createElementNS('http://www.w3.org/2000/svg','svg');
  node.classList.add('practice__pointer');node.setAttribute('viewBox','0 0 32 40');node.setAttribute('aria-hidden','true');
  node.innerHTML='<path d="M10 22V5a3 3 0 0 1 6 0v12l2-2 3 2 3-1 4 5v10l-5 7H12L3 26c-2-4 2-6 5-3l2 2" fill="#fff0ce" stroke="#754520" stroke-width="2"/>';
  return node;
}
