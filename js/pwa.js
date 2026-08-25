export function registerProgressiveWebApp() {
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`)
      .catch((error) => console.warn("Không thể khởi tạo chế độ chơi offline:", error));
  });
}
