# Memory Match Adventure — JavaScript thuần

Phiên bản hiển thị trong ứng dụng: **V1.1a**.

Ứng dụng web dùng HTML, CSS và JavaScript ES modules. Vite phục vụ/build bản web; Capacitor đóng gói cùng bản build thành ứng dụng Android.

## Yêu cầu

- Node.js 22 trở lên và npm (Capacitor 8 yêu cầu Node.js `>=22`).
- Chỉ khi làm Android: Android Studio, Android SDK và Java theo yêu cầu của Capacitor 8.

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

Tạo Android project một lần:

```powershell
npm run android:add
```

Sau khi sửa mã web, đồng bộ lại:

```powershell
npm run android:sync
npm run android:open
```

Tạo APK debug để cài thử:

```powershell
npm run android:apk
```

Google Play dùng Android App Bundle đã ký. Mở Android Studio bằng `npm run android:open`, cập nhật app ID/version/icon và chọn **Build > Generate Signed Bundle / APK**. Lệnh `npm run android:aab` chỉ thành công sau khi cấu hình chữ ký release.

## Cấu trúc

- `index.html`: khung giao diện và entry `/js/main.js`.
- `js/`: các module gameplay, UI, âm thanh, shop và hiệu ứng.
- `js/config.js`: cấu hình tập trung cho số ảnh, chủ đề, số ô, thời gian và lượt gợi ý.
- `style.css`: giao diện.
- `public/assets/`: hình ảnh và âm thanh được sao chép nguyên trạng vào bản build.
- `public/assets/images/`: các ảnh giao diện WebP, gồm nền chính, nền lưới, tile và logo.
- `public/assets/images/themes/default/`: kho 1.000 ảnh thẻ WebP 256×256 dùng chung cho mọi level. Khi bổ sung chủ đề, tạo thư mục mới cạnh `default`; không nhân bản ảnh giữa các level.
- `source-assets/images/themes/default/`: PNG gốc để chỉnh sửa hoặc xuất lại ảnh; thư mục này không được đưa vào bản web/Android.
- `vite.config.js`: cấu hình web JavaScript thuần.
- `capacitor.config.js`: cấu hình Android container.

Ba chế độ giữ level độc lập theo mỗi lượt chơi: Dễ 12 ô, Trung bình 24 ô, Khó 36 ô. Qua level mới game chọn lại các cặp ngẫu nhiên từ kho ảnh của chủ đề. Lưới tự đổi từ 4×3, 6×4, 6×6 trên PC sang 3×4, 4×6, 6×6 trên mobile; kích thước thẻ được tính lại khi đổi kích thước hoặc xoay màn hình.
