import { createGameShellLifecycle } from '../gameShell/gameShellLifecycle.js';
import { readTutorialProgress, markTutorialFlag } from './tutorialProgress.js';
import { suspendAmbientBackground } from '../backgroundEffects.js';
import '../../styles/tutorial.css';
const shown = new WeakMap();
let active = null, activeAnchor = null;
const copy = {
  chests: 'Mở rương lần lượt từ Mầm Non đến Ánh Sao. Tiến trình ở mọi độ khó đều được giữ.',
  pieces: 'Chọn mảnh còn thiếu để xem cách kiếm. Đủ 10 mảnh, hoàn thiện tranh và nhận 300 Xu một lần.',
};
export function dismissContextGuide(root) { if (!root || root.contains(activeAnchor))
  active?.dispose(); }
/** One static guide. Inline in dialogs; floating guides track their actual DOM anchor. */
export function showContextGuide(topic, anchor, owner) {
  if (!anchor || !owner?.active || document.hidden || readTutorialProgress().seen[topic])
    return;
  const inline = !!anchor.closest('.app-modal');
  if (!inline && document.querySelector('.app-modal-overlay:not(.is-closing)'))
    return;
  let presented = shown.get(owner);
  if (!presented) {
    presented = new Set();
    shown.set(owner, presented);
  }
  if (presented.has(topic))
    return;
  presented.add(topic);
  const text = copy[topic] || (topic.startsWith('wave:') ? 'Một màn có nhiều đợt. Dọn hết đợt hiện tại để mở bàn tiếp theo; thời gian được dùng chung trong màn.' : topic.startsWith('tools:') ? 'Chọn công cụ để xem tác dụng và số lượt còn lại. Mỗi lần dùng tốn một lượt của công cụ đó.' : '');
  if (!text)
    return;
  dismissContextGuide();
  const scope = createGameShellLifecycle();
  scope.own(suspendAmbientBackground());
  active = scope;
  activeAnchor = anchor;
  const release = owner.own(() => scope.dispose(), 'cleanup');
  const guide = document.createElement('aside');
  guide.className = 'tutorial-guide';
  guide.setAttribute('aria-label', 'Gợi ý cách chơi');
  guide.dataset.guideTopic = topic;
  const paragraph = document.createElement('p');
  paragraph.textContent = text;
  const close = document.createElement('button');
  close.type = 'button';
  close.textContent = 'Đã hiểu';
  guide.append(paragraph, close);
  if (inline) {
    guide.classList.add('tutorial-guide--inline');
    anchor.before(guide);
  }
  else {
    document.body.append(guide);
    guide.classList.add('tutorial-guide--floating');
  }
  anchor.classList.add('has-context-guide');
  scope.own(() => { release.forget(); anchor.classList.remove('has-context-guide'); guide.remove(); if (active === scope) {
    active = null;
    activeAnchor = null;
  } }, 'node');
  scope.listen(close, 'click', async () => { close.disabled = true; try {
    await markTutorialFlag('seen', topic);
  }
  catch (error) {
    console.warn('Guide preference unavailable', error.name);
  }
  finally {
    scope.dispose();
  } });
  scope.listen(document, 'visibilitychange', () => { if (document.hidden)
    scope.dispose(); });
  if (!inline) {
    let scheduled = false;
    function position() { scheduled = false; if (!anchor.isConnected || !anchor.getClientRects().length) {
      scope.dispose();
      return;
    } const a = anchor.getBoundingClientRect(), b = guide.getBoundingClientRect(), viewport = window.visualViewport, left = viewport?.offsetLeft || 0, top = viewport?.offsetTop || 0, width = viewport?.width || innerWidth, height = viewport?.height || innerHeight; guide.style.left = `${Math.max(left + 8, Math.min(a.left + a.width / 2 - b.width / 2, left + width - b.width - 8))}px`; guide.style.top = `${Math.max(top + 8, Math.min(a.bottom + 8, top + height - b.height - 8))}px`; }
    function schedule() { if (!scheduled && scope.active) {
      scheduled = true;
      scope.frame(position);
    } }
    scope.listen(window, 'resize', schedule);
    scope.listen(window, 'scroll', schedule, true);
    if (window.visualViewport) {
      scope.listen(window.visualViewport, 'resize', schedule);
      scope.listen(window.visualViewport, 'scroll', schedule);
    }
    const observer = new ResizeObserver(schedule);
    observer.observe(anchor);
    observer.observe(guide);
    scope.own(() => observer.disconnect());
    position();
  }
  return { dispose: () => scope.dispose(), diagnostics: () => scope.diagnostics() };
}
