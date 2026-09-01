import { openAppModal } from "./modal.js";

export function showThemeChangeNotice() {
  openAppModal({
    id: "theme-change-notice-modal",
    icon: "collection",
    title: "Đã đổi bộ sưu tập",
    content: "<p>Bộ sưu tập mới sẽ được áp dụng từ ván chơi tiếp theo.</p>",
    actions: [{ label: "Đã hiểu", variant: "primary" }],
  });
}
