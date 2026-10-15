import { openAppModal, showAppToast } from "./modal.js";
import { getAccountService } from "./accountService.js";
import { getAppPageScope } from "./appPageLifecycle.js";
import { gameState } from "./gameState.js";
import { createIcon } from "./icons.js";
import { getProfileStatsService } from './profileStatsService.js';
import { formatProfilePlaytime } from './profileStatsModel.js';

let activeView = null;
let activeConflict = null;
export function closeCloudConflictDialog() {
  const previous = activeConflict;
  activeConflict = null;
  previous?.release?.forget(); previous?.modal.destroy();
}
export function showAccountPanel(surface = {}) {
  activeView?.dispose();
  const service = getAccountService();
  const content = document.createElement('div'); content.className = 'profile-view';
  const hero = document.createElement('section'); hero.className = 'tab-card tab-card--ornament profile-hero';
  const summary = document.createElement('div'); summary.className = 'profile-summary';
  const avatar = document.createElement('span'); avatar.className = 'profile-avatar'; avatar.setAttribute('aria-hidden', 'true');
  const identity = document.createElement('div');
  const playerName = document.createElement('h3'); playerName.className = 'profile-player-name';
  const accountType = document.createElement('p'); accountType.className = 'account-identity';
  identity.append(playerName, accountType);
  const edit = document.createElement('button'); edit.type = 'button'; edit.className = 'tab-button tab-button--quiet profile-edit';
  edit.setAttribute('aria-label', 'Sửa tên'); edit.setAttribute('aria-expanded', 'false'); edit.append(createIcon('edit'));
  summary.append(avatar, identity, edit); hero.append(summary);
  const form = document.createElement('form'); form.className = 'profile-name-form'; form.hidden = true;
  const label = document.createElement('label'); label.textContent = 'Tên hiển thị'; label.htmlFor = 'profile-player-name';
  const name = document.createElement('input'); name.id = 'profile-player-name'; name.className = 'account-name-input';
  name.type = 'text'; name.maxLength = 20; name.required = true; name.autocomplete = 'nickname';
  const saveName = document.createElement('button'); saveName.type = 'submit'; saveName.className = 'tab-button'; saveName.textContent = 'Lưu tên';
  const cancel = document.createElement('button'); cancel.type = 'button'; cancel.className = 'tab-button tab-button--quiet'; cancel.textContent = 'Hủy';
  const formActions = document.createElement('div'); formActions.className = 'profile-name-actions'; formActions.append(cancel, saveName);
  const error = document.createElement('p'); error.className = 'profile-error'; error.setAttribute('role', 'alert');
  form.append(label, name, error, formActions); hero.append(form);
  const stats = profileDetails(hero);
  const account = document.createElement('section'); account.className = 'tab-card profile-account';
  const heading = document.createElement('h3'); heading.className = 'tab-section-title'; heading.textContent = 'Tài khoản';
  const status = document.createElement('p'); status.className = 'account-status'; status.setAttribute('aria-live', 'polite');
  const google = document.createElement('button'); google.type = 'button'; google.className = 'tab-button profile-google';
  account.append(heading, status, google); content.append(hero, account);
  let disposed = false; let unsubscribe; let releaseOwner;
  let editingUid = null; let saving = false; let linking = false;
  const modal = openAppModal({ ...surface, id: 'account-modal', title: 'Hồ sơ', icon: 'account', content, onDestroy: dispose, onClose: dispose });
  function dispose() {
    if (disposed) return;
    disposed = true; unsubscribe?.(); stats.dispose(); releaseOwner?.forget(); modal.destroy();
    if (activeView?.modal === modal) activeView = null;
  }
  activeView = { modal, dispose };
  releaseOwner = (surface.owner || getAppPageScope())?.own(dispose, 'cleanup');
  function closeEditor(focus = false) {
    form.hidden = true; edit.setAttribute('aria-expanded', 'false'); error.textContent = ''; name.value = ''; editingUid = null;
    if (focus) edit.focus();
  }
  function renderState(state) {
    if (disposed) return;
    if (!form.hidden && editingUid !== state.uid) closeEditor();
    playerName.textContent = state.playerName || 'Người chơi';
    avatar.textContent = Array.from(playerName.textContent.trim())[0]?.toLocaleUpperCase('vi-VN') || '•';
    accountType.textContent = state.isAnonymous === false ? 'Đã liên kết Google' : 'Tài khoản khách';
    status.textContent = ({ connecting: 'Đang kết nối…', restoring: 'Đang tải tiến trình…', syncing: 'Đang lưu…', synced: 'Đã lưu tiến trình', waiting: 'Đang chờ lưu', offline: 'Chưa có kết nối', error: 'Chưa lưu được. Sẽ thử lại.', disabled: 'Tiến trình đã lưu trên thiết bị.', conflict: 'Đang tải tiến trình…' })[state.phase] || '';
    const busy = saving || linking || ['connecting', 'restoring', 'syncing', 'conflict'].includes(state.phase);
    edit.disabled = name.disabled = saveName.disabled = google.disabled = !service || !state.bound || busy;
    cancel.disabled = saving || linking;
    google.replaceChildren(createIcon('account'), document.createTextNode(state.isAnonymous === false ? 'Đổi tài khoản Google' : 'Liên kết Google'));
    google.hidden = !service || state.phase === 'disabled';
    if (busy) modal.panel.setAttribute('aria-busy', 'true');
    else modal.panel.removeAttribute('aria-busy');
  }
  edit.onclick = () => {
    const state = service.getState(); editingUid = state.uid; name.value = state.playerName || '';
    form.hidden = false; edit.setAttribute('aria-expanded', 'true'); name.focus(); name.select();
  };
  cancel.onclick = () => closeEditor(true);
  form.onsubmit = async event => {
    event.preventDefault(); if (saving || linking || saveName.disabled || form.hidden) return;
    const uid = editingUid; saving = true; error.textContent = ''; renderState(service.getState());
    try {
      if (await service.setPlayerName(name.value)) {
        if (!disposed && uid === service.getState().uid) { closeEditor(); showAppToast('Đã lưu tên hiển thị.'); }
      } else if (!disposed && uid === service.getState().uid) error.textContent = 'Chưa lưu được tên. Hãy thử lại.';
    } catch (failure) { if (!disposed && uid === service.getState().uid) error.textContent = failure.message; }
    finally { saving = false; if (!disposed) { renderState(service.getState()); if (form.hidden && !edit.disabled) edit.focus(); } }
  };
  google.onclick = async () => {
    if (linking || saving || google.disabled) return;
    linking = true; renderState(service.getState());
    try { await service.requestGoogleLogin(); }
    catch { if (!disposed) showAppToast('Chưa liên kết được tài khoản. Hãy thử lại.'); }
    finally { linking = false; if (!disposed) renderState(service.getState()); }
  };
  if (service) unsubscribe = service.subscribe(renderState);
  else renderState({ phase: 'disabled', isAnonymous: true, bound: false });
  if (!modal.panel.contains(document.activeElement)) modal.panel.focus();
  return modal;
}

function profileDetails(content) {
  const details = document.createElement('dl'); details.className = 'account-play-details';
  const joinedCard = document.createElement('div'); const timeCard = document.createElement('div');
  const joinedLabel = document.createElement('dt'); const joined = document.createElement('dd');
  const timeLabel = document.createElement('dt'); timeLabel.textContent = 'Thời gian chơi'; const time = document.createElement('dd');
  joinedCard.append(joinedLabel, joined); timeCard.append(timeLabel, time); details.append(joinedCard, timeCard);
  const since = document.createElement('p'); since.className = 'account-play-since';
  const status = document.createElement('p'); status.className = 'account-play-since'; status.setAttribute('aria-live', 'polite');
  content.append(details, since, status);
  const formatDate = value => new Date(value).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const stats = getProfileStatsService();
  const render = state => {
    joinedLabel.textContent = state.onlineAccount ? 'Tham gia' : 'Hồ sơ tạo ngày';
    joined.textContent = state.joinedAt ? formatDate(state.joinedAt) : '—';
    time.textContent = state.totalPlayMs === null ? '—' : formatProfilePlaytime(state.totalPlayMs);
    since.textContent = state.trackedSince ? `Từ ${formatDate(state.trackedSince)}` : '';
    status.textContent = state.phase === 'error' ? 'Chưa cập nhật được thời gian chơi.' : '';
  };
  render({ onlineAccount: false, totalPlayMs: null });
  const unsubscribe = stats?.subscribe(render);
  void stats?.syncNow();
  return { dispose: () => unsubscribe?.() };
}

export function showCloudConflictDialog({ root, cloud, choose }) {
  closeCloudConflictDialog();
  const content = document.createElement("div");
  content.className = "account-conflict";
  const local = document.createElement("p");
  const remote = document.createElement("p");
  local.textContent = describe("Bản máy", { coins: gameState.coins, progress: gameState.progress });
  remote.textContent = cloud ? describe("Bản cloud", cloud) : "Cloud chưa có bản lưu.";
  const note = document.createElement("p");
  note.textContent = "Chọn một bản để tiếp tục. Xu và vật phẩm không cộng gộp. Chọn cloud vẫn giữ bản máy trước đó để phục hồi; thành tích công khai đã gửi vẫn được giữ.";
  content.append(local, remote, note);
  const modal = openAppModal({ id: "cloud-conflict-modal", title: "Chọn bản lưu", icon: "account", content, dismissible: false, closeOnBackdrop: false, closeOnEscape: false, onClose: closeCloudConflictDialog, actions: [
    { label: "Dùng bản máy", variant: "primary", onClick: async close => { if (await choose("local")) close(); return false; } },
    ...(root ? [{ label: "Dùng bản cloud", onClick: async close => { if (await choose("cloud")) close(); return false; } }] : []),
  ] });
  const view = { modal, release: null };
  activeConflict = view;
  view.release = getAppPageScope()?.own(() => {
    if (activeConflict === view) activeConflict = null;
    modal.destroy();
  }, "cleanup");
  return modal;
}
function describe(label, data) {
  const stars = ["memoryMatch", "linkConnect", "tripleConnect"].reduce((sum, key) => sum + (data.progress[key]?.totalStars || 0), 0);
  return `${label}: ${data.coins.toLocaleString("vi-VN")} Xu · ${stars.toLocaleString("vi-VN")} sao`;
}
