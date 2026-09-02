# Cleanup audit — 2026-09-02

Phạm vi: mã nguồn, script build, dependency và asset runtime. Audit này không xóa CSS theo tên selector vì giao diện hiện chưa có bộ screenshot regression tự động.

## Kết quả đã xác nhận

- Không có asset runtime trùng byte: 1.752 WebP, 13 MP3 và 1 PNG trong `public/assets/` đều có checksum SHA-256 riêng.
- Các dependency hiện có đều có đường dùng: Vite, Firebase Hosting, GitHub Pages, Capacitor Android và `canvas-confetti` cho cảnh chiến thắng web.
- Các stylesheet chiến thắng được import theo đúng target: web dùng `victory-flower*.css`, Android dùng `victory-mobile.css`.
- Script build/check đang được gọi từ `package.json`; không có script mồ côi đã xác nhận.

## Giữ lại có chủ đích

- Migration `legacyTheme` và `legacySession` để dữ liệu `localStorage` từ bản cũ tiếp tục dùng được.
- CSS selector giao diện cũ/chung còn được ghi nhận trong `CONTEXT.md`; chỉ dọn sau khi có screenshot regression hoặc kiểm thử trực quan trên mobile.
- Android/Capacitor được giữ để build APK sau khi bản web được nghiệm thu.

## Điều kiện cho đợt dọn tiếp theo

1. Có checklist/screenshot regression cho menu, shop, HUD, popup và board ở viewport mobile.
2. Một selector hoặc asset chỉ được xóa khi tìm được bằng chứng không còn được render/import ở cả web và Android.
