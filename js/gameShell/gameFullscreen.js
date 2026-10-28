import { Capacitor } from '@capacitor/core';
// Fullscreen belongs to the document so dialogs and level transitions stay visible.
// Controls/listeners belong to the current shell mount; there is no polling loop.
let focusMode = false;

export function mountGameFullscreen({ root, title }, scope) {
  if (Capacitor.isNativePlatform()) return;
  const button = document.createElement("button");
  button.type = "button";
  button.className = "shell-fullscreen-button";
  button.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path class="shell-fullscreen-expand" d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/><path class="shell-fullscreen-contract" d="M3 8h5V3m8 0v5h5M8 21v-5H3m13 5v-5h5"/></svg>';
  const status = document.createElement("span");
  status.className = "shell-fullscreen-status";
  status.setAttribute("role", "status");
  title.classList.add("shell-fullscreen-title");
  root.append(button, status);
  let busy = false;

  function update() {
    const fullscreen = Boolean(document.fullscreenElement);
    const supported = Boolean(document.fullscreenEnabled && document.documentElement.requestFullscreen);
    root.classList.toggle("shell-focus-mode", focusMode && !fullscreen);
    const active = fullscreen || focusMode;
    const label = fullscreen ? "Thoát toàn màn hình" : focusMode ? "Thoát chế độ tập trung"
      : supported ? "Toàn màn hình" : "Chế độ tập trung";
    button.setAttribute("aria-label", label);
    button.setAttribute("aria-pressed", String(active));
    button.title = label;
  }

  scope.listen(button, "click", async () => {
    if (busy) return;
    busy = true;
    button.disabled = true;
    status.textContent = "";
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (focusMode) focusMode = false;
      else if (document.fullscreenEnabled && document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      } else focusMode = true;
    } catch {
      // Some embedded browsers advertise the API but reject the actual request.
      if (scope.active && !document.fullscreenElement) {
        focusMode = true;
        status.textContent = "Không mở được toàn màn hình. Đã bật chế độ tập trung.";
      } else if (scope.active) status.textContent = "Chưa thoát được toàn màn hình. Hãy dùng nút thoát của trình duyệt.";
    } finally {
      if (scope.active) {
        busy = false;
        button.disabled = false;
        update();
      }
    }
  });
  scope.listen(document, "fullscreenchange", () => {
    focusMode = false;
    update();
  });
  scope.listen(document, "keydown", event => {
    if (event.key === "Escape" && focusMode) {
      focusMode = false;
      update();
    }
  });
  scope.own(() => {
    button.remove();
    status.remove();
    title.classList.remove("shell-fullscreen-title");
    root.classList.remove("shell-focus-mode");
  }, "node");
  update();
}
