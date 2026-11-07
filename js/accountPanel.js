import { openAppModal, showAppToast } from "./modal.js";
import { cosmeticPortrait, openProfileCustomization } from './progression/profileCosmetics.js';
import { createGameShellLifecycle } from './gameShell/gameShellLifecycle.js';
import { getPublicCosmeticSync } from './progression/publicCosmeticSync.js';
import { getAccountService } from "./accountService.js";
import { showAccountErasureDialog } from './accountErasureDialog.js';
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
  const hero = document.createElement('section'); hero.className = 'tab-card profile-hero';
  const summary = document.createElement('div'); summary.className = 'profile-summary';
  const avatar = document.createElement('button'); avatar.type = 'button'; avatar.className = 'profile-avatar'; avatar.setAttribute('aria-label', 'Trang trí hồ sơ');
  const identity = document.createElement('div');
  const playerName = document.createElement('h3'); playerName.className = 'profile-player-name';
  const accountType = document.createElement('p'); accountType.className = 'account-identity';
  identity.className = 'profile-identity';
  const nameRow = document.createElement('div'); nameRow.className = 'profile-name-row';
  const uidRow=document.createElement('div');uidRow.className='profile-uid';uidRow.hidden=true;
  const uidLabel=document.createElement('span');uidLabel.textContent='UID:';
  const uidValue=document.createElement('span');uidValue.className='profile-uid__value';
  const copyUid=document.createElement('button');copyUid.type='button';copyUid.className='profile-copy-uid';copyUid.setAttribute('aria-label','Sao chép UID');copyUid.append(createIcon('copy'));
  uidRow.append(uidLabel,uidValue,copyUid);
  const identityMeta=document.createElement('div');identityMeta.className='profile-identity-meta';
  identityMeta.append(accountType);identity.append(nameRow,uidRow,identityMeta);
  const edit = document.createElement('button'); edit.type = 'button'; edit.className = 'profile-edit';
  edit.setAttribute('aria-label', 'Sửa tên'); edit.setAttribute('aria-expanded', 'false'); edit.append(createIcon('edit'));
  summary.append(avatar, identity); hero.append(summary);
  const form = document.createElement('form'); form.className = 'profile-name-form'; form.hidden = true;
  const label = document.createElement('label'); label.className = 'profile-name-label'; label.textContent = 'Tên hiển thị'; label.htmlFor = 'profile-player-name';
  const name = document.createElement('input'); name.id = 'profile-player-name'; name.className = 'account-name-input';
  name.type = 'text'; name.maxLength = 20; name.required = true; name.autocomplete = 'nickname';
  const saveName = document.createElement('button'); saveName.type = 'submit'; saveName.className = 'profile-name-action'; saveName.textContent = 'Lưu'; saveName.setAttribute('aria-label', 'Lưu tên');
  const cancel = document.createElement('button'); cancel.type = 'button'; cancel.className = 'profile-name-action'; cancel.textContent = 'Hủy';
  const nameActions = document.createElement('div'); nameActions.className = 'profile-name-actions'; nameActions.append(cancel, saveName);
  const error = document.createElement('p'); error.className = 'profile-error'; error.setAttribute('role', 'alert');
  form.append(label, name, nameActions); nameRow.append(playerName, form,edit); identity.append(error);
  const stats = profileDetails(hero);
  const account = document.createElement('section'); account.className = 'tab-card profile-account';
  const heading = document.createElement('h3'); heading.className = 'tab-section-title'; heading.textContent = 'Tài khoản';
  const status = document.createElement('p'); status.className = 'account-status'; status.setAttribute('aria-live', 'polite');
  const google = document.createElement('button'); google.type = 'button'; google.className = 'tab-button profile-google';
  const logout = document.createElement('button'); logout.type = 'button'; logout.className = 'tab-button profile-logout'; logout.textContent = 'Đăng xuất';
  logout.onclick = () => {
    const note = document.createElement('p');
    note.textContent = 'Tiến trình sẽ được lưu vào tài khoản trước khi đăng xuất. Dữ liệu trò chơi trên thiết bị này sẽ được xóa và bạn sẽ bắt đầu bằng tài khoản khách mới. Bạn có thể đăng nhập lại Google để khôi phục tiến trình.';
    const failure = document.createElement('p'); failure.className = 'profile-error'; failure.setAttribute('role', 'alert');
    const body = document.createElement('div'); body.append(note, failure);
    openAppModal({ id: 'logout-modal', title: 'Đăng xuất tài khoản?', content: body, keepBanner: false,
      actions: [{ label: 'Hủy', onClick: close => close() }, { label: 'Đăng xuất', onClick: async () => {
        try { await service.logout(); }
        catch { failure.textContent = 'Chưa đăng xuất được. Kiểm tra kết nối và thử lại; tiến trình vẫn được giữ.'; }
        return false;
      } }],
    });
  };
  const erase = document.createElement('button'); erase.type = 'button'; erase.className = 'tab-button profile-delete'; erase.textContent = 'Xóa tài khoản';
  erase.onclick = () => showAccountErasureDialog('delete');
  const accountActions = document.createElement('div'); accountActions.className = 'profile-account-actions';
  accountActions.append(google, logout, erase);
  account.append(heading, status, accountActions); content.append(hero, account);
  let disposed = false; let unsubscribe; let releaseOwner;let currentUid=null,copyingUid=false;
  const cosmeticScope = createGameShellLifecycle();
  const cosmeticsStatus = document.createElement('p'); cosmeticsStatus.className = 'profile-cosmetics-status'; cosmeticsStatus.setAttribute('role', 'status'); hero.append(cosmeticsStatus);
  const sync = getPublicCosmeticSync();
  if (sync) cosmeticScope.own(sync.subscribe(state => { cosmeticsStatus.textContent = state.message; }), 'listener');
  let editingUid = null; let saving = false; let linking = false;
  const modal = openAppModal({ ...surface, id: 'account-modal', title: 'Hồ sơ', icon: 'account', content, onDestroy: dispose, onClose: dispose });
  function dispose() {
    if (disposed) return;
    disposed = true; unsubscribe?.(); stats.dispose(); cosmeticScope.dispose(); releaseOwner?.forget(); modal.destroy();
    if (activeView?.modal === modal) activeView = null;
  }
  activeView = { modal, dispose };
  avatar.onclick = () => openProfileCustomization({ playerName: playerName.textContent, owner: cosmeticScope,
    onSaved: () => { if (!disposed) avatar.replaceChildren(cosmeticPortrait(gameState.appearance.profileCosmetics, { label: playerName.textContent, size: 256 })); } });
  releaseOwner = (surface.owner || getAppPageScope())?.own(dispose, 'cleanup');
  function closeEditor(focus = false) {
    form.hidden = true; playerName.hidden = false; edit.hidden = false; edit.setAttribute('aria-expanded', 'false'); error.textContent = ''; name.value = ''; editingUid = null;
    if (focus) edit.focus();
  }
  function renderState(state) {
    if (disposed) return;
    if (!form.hidden && editingUid !== state.uid) closeEditor();
    playerName.textContent = state.playerName || 'Người chơi';
    currentUid=typeof state.uid==='string'&&state.uid ? state.uid : null;
    uidRow.hidden=!currentUid;
    uidValue.textContent=currentUid&&currentUid.length>14 ? `${currentUid.slice(0,6)}…${currentUid.slice(-4)}` : currentUid||'';
    copyUid.disabled=!currentUid||copyingUid;
    avatar.replaceChildren(cosmeticPortrait(gameState.appearance.profileCosmetics, { label: playerName.textContent, size: 256 }));
    accountType.textContent = state.isAnonymous === false ? 'Đã liên kết Google' : 'Tài khoản khách';
    status.textContent = ({ connecting: 'Đang kết nối…', restoring: 'Đang tải tiến trình…', syncing: 'Đang lưu…', synced: '', waiting: 'Đang chờ lưu', offline: 'Chưa có kết nối', error: 'Chưa lưu được. Sẽ thử lại.', disabled: '', conflict: 'Đang tải tiến trình…' })[state.phase] || '';
    const busy = saving || linking || ['connecting', 'restoring', 'syncing', 'conflict'].includes(state.phase);
    const erasing = ['erasing', 'erasure-pending'].includes(state.phase);
    const signingOut = ['signing-out', 'logout-pending'].includes(state.phase);
    logout.hidden = !service || state.isAnonymous !== false && !signingOut;
    logout.replaceChildren(createIcon('exit'), document.createTextNode(state.phase === 'logout-pending' ? 'Tiếp tục đăng xuất' : 'Đăng xuất'));
    logout.disabled = saving || linking || busy || erasing || state.phase === 'signing-out';
    erase.replaceChildren(createIcon('trash'), document.createTextNode(state.phase === 'erasure-pending' ? 'Tiếp tục yêu cầu xóa' : 'Xóa tài khoản'));
    erase.hidden = !service || !state.uid;
    erase.disabled = saving || linking || busy || state.phase === 'erasing';
    if (signingOut) { erase.disabled = true; status.textContent = state.message; }
    edit.disabled = name.disabled = saveName.disabled = google.disabled = !service || !state.bound || busy;
    cancel.disabled = saving || linking;
    if (erasing || signingOut) { edit.disabled = name.disabled = saveName.disabled = google.disabled = true; status.textContent = state.message; }
    google.replaceChildren(createIcon('account'), document.createTextNode(state.isAnonymous === false ? 'Đổi tài khoản Google' : 'Liên kết Google'));
    google.hidden = !service || state.phase === 'disabled';
    account.hidden = google.hidden && !status.textContent;
    if (busy) modal.panel.setAttribute('aria-busy', 'true');
    else modal.panel.removeAttribute('aria-busy');
  }
  copyUid.onclick=async()=>{
    if(!currentUid||copyingUid)return;
    const uid=currentUid;copyingUid=true;copyUid.disabled=true;
    try{
      if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(uid);
      else{
        const input=document.createElement('textarea');input.value=uid;input.setAttribute('readonly','');input.style.cssText='position:fixed;top:0;left:0;opacity:0;pointer-events:none';
        document.body.append(input);
        try{input.focus({preventScroll:true});input.select();if(!document.execCommand('copy'))throw new Error('Clipboard unavailable');}
        finally{input.remove();if(!disposed)copyUid.focus({preventScroll:true});}
      }
      if(!disposed&&currentUid===uid)showAppToast('Đã sao chép UID.');
    }catch(error){if(!disposed)showAppToast('Chưa sao chép được UID. Hãy thử lại.');console.warn('Profile UID copy unavailable',error.name);}
    finally{copyingUid=false;if(!disposed)copyUid.disabled=!currentUid;}
  };
  edit.onclick = () => {
    const state = service.getState(); editingUid = state.uid; name.value = state.playerName || '';
    form.hidden = false; playerName.hidden = true; edit.hidden = true; edit.setAttribute('aria-expanded', 'true'); name.focus(); name.select();
  };
  cancel.onclick = () => closeEditor(true);
  form.onsubmit = async event => {
    event.preventDefault(); if (saving || linking || saveName.disabled || form.hidden) return;
    const uid = editingUid; saving = true; error.textContent = ''; renderState(service.getState());
    try {
      if (await service.setPlayerName(name.value)) {
        if (!disposed && uid === service.getState().uid) { closeEditor(); showAppToast('Đã lưu tên hiển thị.'); }
      } else if (!disposed && uid === service.getState().uid) error.textContent = 'Chưa lưu được tên. Hãy thử lại.';
    } catch (failure) { if (!disposed && uid === service.getState().uid) error.textContent = failure.message === 'Tên hiển thị cần từ 1–20 ký tự.' ? failure.message : 'Chưa lưu được tên. Kiểm tra kết nối và thử lại.'; }
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
  const timeValue = document.createElement('span'); time.append(timeValue);
  joinedCard.append(joinedLabel, joined); timeCard.append(timeLabel, time); details.append(joinedCard, timeCard);
  const status = document.createElement('p'); status.className = 'account-play-since'; status.setAttribute('aria-live', 'polite');
  content.append(details, status);
  const formatDate = value => new Date(value).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const stats = getProfileStatsService();
  const render = state => {
    joinedLabel.textContent = state.onlineAccount ? 'Tham gia' : 'Hồ sơ tạo ngày';
    joined.textContent = state.joinedAt ? formatDate(state.joinedAt) : '—';
    timeValue.textContent = state.totalPlayMs === null ? '—' : formatProfilePlaytime(state.totalPlayMs);
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
  local.textContent = describe("Trên thiết bị", { coins: gameState.coins, progress: gameState.progress });
  remote.textContent = cloud ? describe("Trực tuyến", cloud) : "Chưa có tiến trình trực tuyến.";
  const note = document.createElement("p");
  note.textContent = "Chọn tiến trình để tiếp tục. Xu và vật phẩm không cộng gộp. Khi chọn bản trực tuyến, tiến trình trên thiết bị vẫn được giữ để khôi phục; thành tích trên bảng xếp hạng không thay đổi.";
  content.append(local, remote, note);
  const modal = openAppModal({ id: "cloud-conflict-modal", title: "Chọn tiến trình", icon: "account", content, keepBanner: false, dismissible: false, closeOnBackdrop: false, closeOnEscape: false, onClose: closeCloudConflictDialog, actions: [
    { label: "Trên thiết bị", variant: "primary", onClick: async close => { if (await choose("local")) close(); return false; } },
    ...(root ? [{ label: "Trực tuyến", onClick: async close => { if (await choose("cloud")) close(); return false; } }] : []),
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
