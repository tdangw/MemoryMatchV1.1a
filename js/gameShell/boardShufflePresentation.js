import { isAppActive } from '../appVisibility.js';
import { createGameShellLifecycle } from './gameShellLifecycle.js';
import { prefersReducedMotion } from '../motion.js';

export const BOARD_SHUFFLE_TIMING = Object.freeze({ duration: 720, maxCards: 256 });
const presentations = new WeakMap();
const lastPatterns = new WeakMap();

export function captureShuffleCards(elements) {
  return new Map([...elements].map(element => [element, element.getBoundingClientRect()]));
}

export function cancelBoardShuffle(board) { presentations.get(board)?.cancel(); }

/** Animate the real, updated board; cancellation always reveals its final state. */
export function presentBoardShuffle({ board, before, elements, owner, duration = BOARD_SHUFFLE_TIMING.duration }) {
  cancelBoardShuffle(board);
  const nodes = [...elements];
  if (!owner.active || prefersReducedMotion() || !isAppActive() || !nodes.length
    || nodes.length > BOARD_SHUFFLE_TIMING.maxCards || typeof board.animate !== 'function') {
    return { duration: 0, finished: Promise.resolve(), cancel() {} };
  }
  const bounds = board.getBoundingClientRect();
  const center = { x: bounds.left + bounds.width / 2, y: bounds.top + bounds.height / 2 };
  // Batch all geometry/style reads before starting compositor-only animations.
  const cards = nodes.map(element => ({ element, next: element.getBoundingClientRect(),
    previous: before.get(element), opacity: getComputedStyle(element).opacity }));
  const pattern = lastPatterns.get(board) === 'gather' ? 'orbit'
    : lastPatterns.get(board) === 'orbit' ? 'gather' : Math.random() < .5 ? 'gather' : 'orbit';
  lastPatterns.set(board, pattern);
  const direction = Math.random() < .5 ? -1 : 1;
  const scope = createGameShellLifecycle();
  const release = owner.own(() => scope.dispose());
  const wasInert = board.inert;
  board.inert = true;
  board.dataset.shufflePattern = pattern;
  let resolve;
  const finished = new Promise(done => { resolve = done; });
  const presentation = { duration, finished, cancel: () => scope.dispose() };
  presentations.set(board, presentation);
  scope.own(() => {
    release.forget();
    if (presentations.get(board) === presentation) {
      presentations.delete(board);
      board.inert = wasInert;
      delete board.dataset.shufflePattern;
    }
    resolve();
  });
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  scope.listen(motion, 'change', () => { if (motion.matches) scope.dispose(); });
  scope.listen(document, 'appvisibilitychange', () => { if (!isAppActive()) scope.dispose(); });
  scope.listen(window, 'resize', () => scope.dispose());
  try {
    const animations = cards.map(({ element, next, previous = next, opacity }, index) => {
      const frames = shuffleFrames({ previous, next, center, pattern, direction, index,
        maxRadius: Math.min(bounds.width, bounds.height) * .28 });
      frames.forEach(frame => { frame.opacity = opacity; });
      const animation = element.animate(frames, { duration, fill: 'both', easing: 'linear' });
      scope.animation(animation);
      scope.own(() => animation.cancel());
      return animation;
    });
    Promise.all(animations.map(animation => animation.finished)).then(() => scope.dispose(), error => {
      scope.dispose();
      if (error.name !== 'AbortError') console.error('Board shuffle animation failed', error);
    });
  } catch (error) {
    scope.dispose();
    throw error;
  }
  return presentation;
}

function shuffleFrames({ previous, next, center, pattern, direction, index, maxRadius }) {
  const destination = { x: next.left + next.width / 2, y: next.top + next.height / 2 };
  const source = { x: previous.left + previous.width / 2, y: previous.top + previous.height / 2 };
  const frame = (point, scale, rotate, offset, easing = 'ease-in-out') => ({
    transform: `translate(${point.x - destination.x}px, ${point.y - destination.y}px) rotate(${rotate}deg) scale(${scale})`, offset, easing,
  });
  const start = frame(source, 1, 0, 0);
  const end = frame(destination, 1, 0, 1);
  if (pattern === 'gather') {
    const stack = { x: center.x + (index % 5 - 2) * 2, y: center.y + (index % 3 - 1) * 2 };
    return [start, frame(stack, .24, direction * 12, .30),
      frame(stack, .28, -direction * 10, .48), end];
  }
  const radiusScale = Math.min(.52, maxRadius / Math.max(1, Math.hypot(source.x - center.x, source.y - center.y)));
  const radius = { x: (source.x - center.x) * radiusScale, y: (source.y - center.y) * radiusScale };
  const orbit = [0, 1, 2, 3, 4].map(quarter => {
    const angle = quarter * Math.PI / 2 * direction;
    return frame({ x: center.x + radius.x * Math.cos(angle) - radius.y * Math.sin(angle),
      y: center.y + radius.x * Math.sin(angle) + radius.y * Math.cos(angle) },
    .60, quarter * 90 * direction, .12 + quarter * .16, 'linear');
  });
  // Finish rotation at 360 degrees so spreading out never spins backwards.
  return [start, ...orbit, frame(destination, 1, direction * 360, 1)];
}
