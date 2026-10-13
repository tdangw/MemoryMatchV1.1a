import { openAppModal, showAppToast } from "./modal.js";
import { getAccountService } from "./accountService.js";
import { getAppPageScope } from "./appPageLifecycle.js";
import { gameState } from "./gameState.js";
import { getLocalRestoreBackups } from "./persistence.js";
import { createIcon } from "./icons.js";

let activeView = null;
let activeConflict = null;
export function closeCloudConflictDialog() {
  const previous = activeConflict;
  activeConflict = null;
  previous?.release?.forget(); previous?.modal.destroy();
}
export function showAccountPanel() {
  activeView?.dispose();
  const service = getAccountService();
  if (!service) return openAppModal({ id: "account-modal", title: "Tài khoản", content: "<p>Bạn đang dùng bản lưu trên thiết bị. Kết nối cloud chưa được bật ở môi trường kiểm tra này.</p>" });
  const content = document.createElement("div");
  const identity = document.createElement("p");
  identity.className = "account-identity";
  const status = document.createElement("p");
  status.className = "account-status";
  status.setAttribute("aria-live", "polite");
  const name = document.createElement("input");
  name.type = "text"; name.maxLength = 20; name.autocomplete = "nickname";
  name.className = "account-name-input"; name.setAttribute("aria-label", "Tên hiển thị trên bảng xếp hạng");
  const label = document.createElement("label");
  label.textContent = "Tên hiển thị trên bảng xếp hạng";
  label.append(name);
  const saveName = document.createElement("button");
  saveName.type = "button"; saveName.className = "app-button"; saveName.textContent = "Lưu tên";
  const explanation = document.createElement("p");
  explanation.className = "account-explanation";
  explanation.textContent = "Guest cũng có bản sao lưu. Liên kết Google giúp lấy lại tài khoản trên thiết bị khác. Nếu Google đã có bản lưu riêng, bạn sẽ chọn bản máy hoặc bản cloud; Xu và vật phẩm không cộng gộp.";
  const restore = document.createElement("button");
  restore.type = "button"; restore.className = "app-button"; restore.textContent = "Phục hồi bản máy trước đó"; restore.hidden = true;
  content.append(identity, status, label, saveName, explanation, restore);
  const modal = openAppModal({ id: "account-modal", title: "Tài khoản", icon: "account", content, onClose: () => dispose(), onActionSettled: () => renderState(service.getState()), actions: [
    { label: "Google", icon: "account", variant: "primary", onClick: async () => { await service.requestGoogleLogin(); return false; } },
    { label: "Đồng bộ ngay", icon: "restart", onClick: async () => { await service.syncNow({ manual: true }); return false; } },
  ] });
  let releaseOwner;
  let unsubscribe;
  let disposed = false;
  function dispose() {
    if (disposed) return;
    disposed = true; unsubscribe?.(); releaseOwner?.forget(); modal.destroy();
    if (activeView?.modal === modal) activeView = null;
  }
  activeView = { modal, dispose };
  releaseOwner = getAppPageScope()?.own(dispose, "cleanup");
  function renderState(state) {
    if (disposed) return;
    identity.textContent = state.isAnonymous ? "Đang chơi với tài khoản Guest" : "Đã đăng nhập Google";
    status.textContent = state.message;
    if (document.activeElement !== name) name.value = state.playerName;
    const busy = ["connecting", "restoring", "syncing", "conflict"].includes(state.phase);
    name.disabled = saveName.disabled = !state.bound || busy;
    const google = modal.panel.querySelector(".app-modal__footer button");
    google.replaceChildren(createIcon("account"), document.createTextNode(state.isAnonymous ? "Liên kết Google" : "Đổi tài khoản Google"));
    google.disabled = !state.bound || busy;
    restore.disabled = busy;
  }
  unsubscribe = service.subscribe(renderState);
  saveName.onclick = async () => {
    saveName.disabled = true;
    try { if (await service.setPlayerName(name.value)) showAppToast("Đã lưu tên hiển thị."); }
    catch (error) { if (!disposed) showAppToast(error.message); }
    finally { if (!disposed) saveName.disabled = false; }
  };
  restore.onclick = () => openAppModal({ id: "restore-local-confirmation", title: "Phục hồi bản máy?", content: "<p>Bản máy trước khi dùng cloud sẽ thay dữ liệu hiện tại. Dữ liệu hiện tại cũng được giữ trong danh sách phục hồi.</p>", actions: [
    { label: "Giữ hiện tại", onClick: close => close() },
    { label: "Phục hồi", variant: "primary", onClick: async () => service.restoreLocalBackup() },
  ] });
  void getLocalRestoreBackups().then(backups => { if (!disposed) restore.hidden = !backups.length; }).catch(error => { if (!disposed) showAppToast(error.message); });
  return modal;
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
