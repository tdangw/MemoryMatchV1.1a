# Bộ chữ mẫu 02 — 08/11/2026

- Chủ dự án chọn mẫu 02 trong bảng 12 thiết kế: chữ vàng sáng, sans-serif đậm bo tròn, viền đồng mảnh và nổi nhẹ; không hoa văn, không nền quân chữ.
- Giữ đúng 17 ký tự `A C D E H I K L M N O P R T U V Y`, thứ tự và vị trí sprite như trước. Nguồn `letters-source.png` tạo bằng image_gen tích hợp; prompt và lần sửa ảnh nằm trong `source.json`.
- Ảnh nguồn dùng ô vuông 5×5; generator kiểm tra biên từng chữ rồi ghép thành atlas chạy 5×4. Chiều cao chữ bằng nhau, giữ đúng tỉ lệ của chữ hẹp như I.
- Chạy `node scripts/prepare-letter-drop-atlas.mjs` với module `sharp` có sẵn; có thể chỉ định đường dẫn module qua `UI_SKIN_SHARP_MODULE`.
- Hai file chạy là `letters-v2-128.webp` (87.148 byte) và `letters-v2-256.webp` (217.204 byte). Tên v2 tránh dùng lại cache ảnh cũ trên Hosting. Không giữ atlas cũ trong bundle; bản cũ lưu cục bộ ở `runtime/art-source/letters-legacy/`.
- Các nơi dùng chung: kho chữ, bốn bộ sưu tập, popup thao tác/ghép/bán, chữ rơi khi chơi và hiệu ứng nhận thưởng. Chữ chưa có vẫn đủ sáng để đọc, chữ đã có giữ màu vàng đầy đủ. Không đổi kích thước bố cục, luật chơi, ID, API hoặc dữ liệu lưu.
- Kiểm tra: 17 chữ đủ, ba ô cuối atlas trống, alpha giữ nguyên, chiều cao phần chữ ở atlas 256 nằm trong 213–215px; 7 bài UI mục tiêu đạt trên năm skin, màn hình 320–1024px và hai chế độ chuyển động. JavaScript/CSS/diff/build đạt; chưa deploy/APK hoặc đo FPS điện thoại thật.
