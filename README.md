# Memory Match Adventure — JavaScript thuần

Kiến trúc giao diện dùng chung: [`ARCHITECTURE.md`](ARCHITECTURE.md). Trạng thái mới nhất và kế hoạch active, nếu có, được ghi trong [`CONTEXT.md`](CONTEXT.md).

Phiên bản hiển thị trong ứng dụng: **V1.1a**.

Ứng dụng web/PWA dùng HTML, CSS và JavaScript ES modules. Vite phục vụ và build bản web; Capacitor đóng gói bản Android từ cùng mã nguồn khi cần.

## Yêu cầu

- Node.js và npm.

## Cài lại phụ thuộc

Tại thư mục dự án:

Để cài sạch đúng các phiên bản đã khóa trong dự án:

```powershell
npm ci
```

Khi chủ động thay đổi/thêm thư viện, dùng `npm install` để cập nhật cả `node_modules` và `package-lock.json`. Không cần tải hay chép thư viện JavaScript thủ công, và không xoá `public/assets` vì đây là toàn bộ hình ảnh và âm thanh của game.

## Chạy bản web

```powershell
npm run dev
```

Mở địa chỉ Vite hiển thị trong cửa sổ lệnh, mặc định của dự án là `http://localhost:4173`.

Các lệnh kiểm tra:

```powershell
npm run check
npm run build
npm run preview
```

- `check`: kiểm tra cú pháp tất cả module trong `js/`.
- `build`: tạo bản phát hành web trong `dist/`.
- `preview`: chạy thử nội dung đã build.

## Android

Project Capacitor Android được giữ trong `android/`. Sau khi cài Android SDK và đặt `android/local.properties`, dùng:

```powershell
npm run android:apk
```

Để build release, cấu hình keystore theo `android/keystore.properties.example` rồi chạy `npm run android:apk:release`.

## Cấu trúc

- `index.html`: khung giao diện và entry `/js/main.js`.
- `js/`: các module gameplay, UI, âm thanh, shop và hiệu ứng.
- `js/config.js`: cấu hình gameplay của Memory Match.
- `js/linkConnect/linkConfig.js`: cấu hình gameplay của Link Connect.
- `js/gameplayTuning.js`: giới hạn và thời lượng dùng chung giữa các trò.
- `style.css`: giao diện.
- `public/assets/`: hình ảnh và âm thanh được sao chép nguyên trạng vào bản build.
- `public/assets/images/`: các ảnh giao diện WebP, gồm nền chính, nền lưới, tile và logo.
- `public/assets/images/themes/default/`: kho 1.000 ảnh thẻ WebP 256×256 dùng chung cho mọi level. Khi bổ sung chủ đề, tạo thư mục mới cạnh `default`; không nhân bản ảnh giữa các level.
- Ảnh theme mới dùng tên English `kebab-case.webp` và đặt tại `public/assets/images/themes/<theme-id>/`. Chạy `npm run assets:sync` sau khi thêm/xóa ảnh; game tự lập chỉ mục tệp, không cần cập nhật danh sách filename trong code.
- Hiện không có thư mục `source-assets/`. Khi tạo hoặc xuất lại ảnh, lưu bản nguồn ngoài `public/assets/`; chỉ asset runtime đã chuẩn bị mới được đưa vào bản web.
- `vite.config.js`: cấu hình web JavaScript thuần.

Mỗi game có sáu mode và giữ session độc lập theo mode. `js/gameCatalog.js` là catalog chung cho selector và namespace tiến trình. Xem trạng thái sản phẩm trong `CONTEXT.md`, kiến trúc module trong `ARCHITECTURE.md`, và thiết kế chi tiết trong `Memory Match.md`/`Link Connect.md`/`Triple Connect.md`.
