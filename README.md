# Memory Match Adventure — JavaScript thuần

Phiên bản hiển thị trong ứng dụng: **V1.1a**.

Ứng dụng web dùng HTML, CSS và JavaScript ES modules. Vite phục vụ và build bản web.

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

## Cấu trúc

- `index.html`: khung giao diện và entry `/js/main.js`.
- `js/`: các module gameplay, UI, âm thanh, shop và hiệu ứng.
- `js/config.js`: cấu hình tập trung cho số ảnh, chủ đề, số ô, thời gian và lượt gợi ý.
- `style.css`: giao diện.
- `public/assets/`: hình ảnh và âm thanh được sao chép nguyên trạng vào bản build.
- `public/assets/images/`: các ảnh giao diện WebP, gồm nền chính, nền lưới, tile và logo.
- `public/assets/images/themes/default/`: kho 1.000 ảnh thẻ WebP 256×256 dùng chung cho mọi level. Khi bổ sung chủ đề, tạo thư mục mới cạnh `default`; không nhân bản ảnh giữa các level.
- Hiện không có thư mục `source-assets/`. Khi tạo hoặc xuất lại ảnh, lưu bản nguồn ngoài `public/assets/`; chỉ asset runtime đã chuẩn bị mới được đưa vào bản web.
- `vite.config.js`: cấu hình web JavaScript thuần.

Ba chế độ giữ level độc lập theo mỗi lượt chơi: Dễ 12 ô, Trung bình 24 ô, Khó 36 ô. Qua level mới game chọn lại các cặp ngẫu nhiên từ kho ảnh của chủ đề. Lưới tự đổi từ 4×3, 6×4, 6×6 trên PC sang 3×4, 4×6, 6×6 trên mobile; kích thước thẻ được tính lại khi đổi kích thước hoặc xoay màn hình.
