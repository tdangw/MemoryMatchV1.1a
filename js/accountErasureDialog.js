import { openAppModal } from './modal.js';
import { getAccountService } from './accountService.js';
import { loadLocalAccountOperation } from './accountDataOperations.js';
import { createGameShellLifecycle, getActiveGameScope, clearShellTimeout } from './gameShell/gameShellLifecycle.js';
import { isAppActive } from './appVisibility.js';
import { createIcon } from './icons.js';

const GRACE_MS = 10000;
function element(tag, className, text) {
  const node = document.createElement(tag); node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
function challenge() {
  const left = 2 + Math.floor(Math.random() * 8), right = 2 + Math.floor(Math.random() * 8);
  const answer = left + right, options = [answer - 1, answer, answer + 2];
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1)); [options[i], options[j]] = [options[j], options[i]];
  }
  return { question: `${left} + ${right} = ?`, answer, options };
}

export function showAccountErasureDialog(kind, { onClose } = {}) {
  if (!['delete', 'reset'].includes(kind)) throw new Error('Unknown account erasure action');
  if (getActiveGameScope()) return openAppModal({ id: 'reset-modal', title: 'Xóa dữ liệu', content: '<p>Hãy về trang chính rồi mở Cài đặt để xóa dữ liệu và bắt đầu lại từ đầu.</p>', keepBanner: false, onClose });
  const pending = loadLocalAccountOperation();
  if (pending?.kind === 'logout') return openAppModal({ id: 'reset-modal', title: 'Tài khoản đang đăng xuất', content: '<p>Hãy mở Hồ sơ để hoàn tất đăng xuất trước khi thực hiện yêu cầu xóa.</p>', keepBanner: false, onClose });
  if (pending) kind = pending.kind;
  const deleting = kind === 'delete', service = getAccountService();
  const originalUid = service?.getState().uid || pending?.uid;
  const title = deleting ? 'Xóa tài khoản' : 'Xóa dữ liệu để chơi lại';
  const scope = createGameShellLifecycle(), puzzle = challenge();
  let phase = 'challenge', selected = null, message = '', timer = null;
  let remaining = GRACE_MS, startedAt = null, progressAnimation = null;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const content = element('div', 'account-erasure');
  const stage = element('div', 'account-erasure__stage');
  const error = element('p', 'account-erasure__error'); error.setAttribute('role', 'alert');
  const actions = element('div', 'account-erasure__actions'); content.append(stage, error, actions);
  const owns = () => Boolean(originalUid && service?.getState().uid === originalUid);
  function stopTimer() { if (timer !== null) clearShellTimeout(timer); timer = null; }
  function cancel() {
    if (phase === 'submitting') return;
    phase = 'cancelled'; stopTimer(); progressAnimation?.cancel(); progressAnimation = null; modal.close();
  }
  const modal = openAppModal({ id: 'reset-modal', title, content, keepBanner: false,
    dismissible: false, closeOnBackdrop: false, onClose, onDestroy: () => scope.dispose() });
  modal.panel.classList.add('account-erasure-dialog'); modal.panel.dataset.erasureKind = kind;
  scope.own(stopTimer);
  scope.listen(document, 'keydown', event => {
    if (event.key === 'Escape' && [...document.querySelectorAll('.app-modal-overlay:not(.is-closing)')].at(-1) === modal.overlay) {
      event.preventDefault(); cancel();
    }
  });
  function button(label, variant, callback) {
    const control = element('button', `app-button app-button--${variant}`, label); control.type = 'button';
    const renderedPhase = phase;
    control.onclick = () => { if (scope.active && phase === renderedPhase) callback(); };
    return control;
  }
  function warning() {
    const badge = element('div', 'account-erasure__badge'); badge.append(createIcon(deleting ? 'trash' : 'restart'));
    const copy = element('p', 'account-erasure__warning', 'Thao tác này không thể hoàn tác.');
    const list = element('ul', 'account-erasure__losses');
    for (const text of ['Tiến trình của cả ba trò', 'Xu và toàn bộ vật phẩm', 'Thống kê và thứ hạng']) list.append(element('li', '', text));
    const identity = element('p', 'account-erasure__identity', deleting
      ? 'Tài khoản đăng nhập và dữ liệu trò chơi trên thiết bị này cũng sẽ bị xóa.'
      : 'Bạn vẫn giữ đăng nhập và tên tài khoản để chơi lại từ đầu.');
    stage.append(badge, copy, list, identity);
  }
  function render() {
    if (!scope.active) return;
    modal.panel.dataset.erasurePhase = phase;
    stage.replaceChildren(); actions.replaceChildren(); error.textContent = message;
    if (phase === 'challenge' || phase === 'review') {
      stage.append(element('p', 'account-erasure__step', phase === 'challenge' ? 'Bước 1 / 3' : 'Bước 2 / 3'));
      warning();
      if (phase === 'challenge') {
        const fieldset = element('fieldset', 'account-erasure__challenge');
        fieldset.append(element('legend', '', 'Chọn đáp án để tiếp tục'));
        fieldset.append(element('p', 'account-erasure__question', puzzle.question));
        const options = element('div', 'account-erasure__options');
        for (const value of puzzle.options) {
          const option = button(String(value), 'secondary', () => {
            selected = value; message = value === puzzle.answer ? '' : 'Chưa đúng. Hãy chọn lại đáp án.';
            for (const node of options.children) node.setAttribute('aria-pressed', String(node === option));
            error.textContent = message; next.disabled = value !== puzzle.answer;
          });
          option.setAttribute('aria-pressed', 'false'); options.append(option);
        }
        fieldset.append(options); stage.append(fieldset);
        const next = button('Tiếp tục', 'primary', () => {
          if (selected !== puzzle.answer) return;
          phase = 'review'; message = ''; render(); actions.lastElementChild.focus();
        }); next.disabled = true;
        actions.append(button('Hủy', 'secondary', cancel), next);
      } else {
        stage.append(element('p', 'account-erasure__final', pending
          ? 'Một phần dữ liệu có thể đã được xóa trong yêu cầu trước. Chỉ tiếp tục nếu bạn muốn hoàn tất yêu cầu này.'
          : 'Đây là lần xác nhận cuối. Sau khi chọn xóa, bạn còn 10 giây để đổi ý.'));
        stage.append(element('p', 'account-erasure__connection', 'Cần kết nối mạng. Bạn có thể cần xác minh lại tài khoản Google.'));
        const confirm = button(pending ? 'Tiếp tục xóa' : deleting ? 'Xóa tài khoản' : 'Xóa dữ liệu', 'danger', () => {
          if (!owns()) { message = 'Tài khoản đã thay đổi. Hãy đóng cửa sổ này và thử lại từ Hồ sơ.'; render(); return; }
          phase = 'grace'; remaining = GRACE_MS; message = ''; render(); startGrace(); actions.firstElementChild.focus();
        }); confirm.disabled = !owns();
        actions.append(button('Hủy', 'secondary', cancel), confirm);
      }
    } else if (phase === 'grace' || phase === 'submitting') {
      stage.append(element('p', 'account-erasure__step', 'Bước 3 / 3'));
      const badge = element('div', 'account-erasure__badge'); badge.append(createIcon(deleting ? 'trash' : 'restart')); stage.append(badge);
      stage.append(element('h3', 'account-erasure__grace-title', phase === 'grace' ? 'Bạn vẫn có thể hủy' : 'Đang xóa…'));
      stage.append(element('p', 'account-erasure__grace-copy', phase === 'grace'
        ? `${deleting ? 'Tài khoản' : 'Dữ liệu trò chơi'} sẽ được xóa sau thời gian chờ. Chọn Hủy nếu bạn muốn giữ lại.`
        : 'Vui lòng giữ kết nối. Nếu bị gián đoạn, hãy mở Hồ sơ để tiếp tục.'));
      if (phase === 'grace') {
        const countdown = element('p', 'account-erasure__countdown');
        countdown.append(element('strong', '', '10'), document.createTextNode(' giây'));
        const track = element('div', 'account-erasure__progress'); track.setAttribute('role', 'progressbar');
        track.setAttribute('aria-label', 'Thời gian chờ trước khi xóa'); track.setAttribute('aria-valuemin', '0'); track.setAttribute('aria-valuemax', '10');
        track.append(element('span', 'account-erasure__progress-fill')); stage.append(countdown, track);
        actions.append(button('Hủy thao tác xóa', 'secondary', cancel));
      }
    }
  }
  function updateGrace() {
    const value = Math.ceil(remaining / 1000);
    stage.querySelector('.account-erasure__countdown strong').textContent = String(value);
    stage.querySelector('.account-erasure__progress').setAttribute('aria-valuenow', String(10 - value));
    stage.querySelector('.account-erasure__progress-fill').style.transform = `scaleX(${1 - remaining / GRACE_MS})`;
  }
  function consumeTime() {
    if (startedAt !== null) { remaining = Math.max(0, remaining - (performance.now() - startedAt)); startedAt = null; }
  }
  async function erase() {
    if (!scope.active || phase !== 'grace' || !isAppActive()) return;
    phase = 'submitting'; stopTimer(); progressAnimation?.cancel(); progressAnimation = null; render();
    await modal.submit(async () => {
      try {
        if (!owns()) throw Object.assign(new Error('Account changed'), { code: 'account/changed' });
        await service.eraseCurrentAccount(kind);
      } catch (failure) {
        if (scope.active) {
          phase = 'review'; message = failure.code === 'account/changed'
            ? 'Tài khoản đã thay đổi. Hãy đóng cửa sổ này và thử lại từ Hồ sơ.'
            : failure.code === 'auth/popup-closed-by-user' ? 'Bạn đã hủy xác minh. Chưa hoàn tất yêu cầu xóa.'
            : 'Chưa hoàn tất yêu cầu xóa. Kiểm tra kết nối và thử lại; nếu đã bắt đầu xóa, hãy mở Hồ sơ để tiếp tục.';
          render();
        }
      }
      return false;
    });
  }
  function startGrace() {
    if (!scope.active || phase !== 'grace') return;
    stopTimer(); consumeTime(); updateGrace();
    if (!isAppActive()) { progressAnimation?.pause(); return; }
    if (remaining <= 0) { void erase(); return; }
    startedAt = performance.now();
    if (!reduced.matches && !progressAnimation) {
      progressAnimation = stage.querySelector('.account-erasure__progress-fill').animate(
        [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: GRACE_MS, fill: 'forwards' });
      scope.animation(progressAnimation);
    }
    if (progressAnimation) { progressAnimation.currentTime = GRACE_MS - remaining; progressAnimation.play(); }
    timer = scope.timeout(() => { timer = null; startGrace(); }, Math.min(1000, remaining));
  }
  scope.listen(document, 'appvisibilitychange', () => { if (phase === 'grace') startGrace(); });
  scope.listen(reduced, 'change', () => {
    if (phase !== 'grace') return;
    progressAnimation?.cancel(); progressAnimation = null; startGrace();
  });
  render(); actions.firstElementChild.focus();
  return modal;
}
