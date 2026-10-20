export function registerProgressiveWebApp() {
  if (!("serviceWorker" in navigator)) return;

  if (import.meta.env.DEV) {
    // Tránh service worker giữ CSS/JS cũ khi kiểm tra giao diện cục bộ.
    navigator.serviceWorker.getRegistrations().then((registrations) =>
      Promise.all(registrations.map((registration) => registration.unregister())),
    );
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => caches.delete(key))),
    );
    return;
  }

  const register = () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`)
      .catch((error) => console.warn("Không thể khởi tạo chế độ chơi offline:", error));
  };
  if (document.readyState === 'complete') register();
  else window.addEventListener("load", register, {once: true});
}
