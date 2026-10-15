# Home hướng1 — nghiệm thu 2026-10-15

Home dùng Memory Match rộng phía trên, Link/Triple bên dưới; compact landscape dùng ba cột. Thêm trò chuyển sang lưới. Tên và điều hướng là DOM/native buttons để giữ bàn phím, responsive và fallback khi ảnh lỗi; không dùng screenshot làm UI. Không đổi API, catalog hoặc dữ liệu lưu.

Skill imagegen tạo ba tranh riêng theo concept đã chọn. Master PNG ngoài bundle, generator đóng gói WebP: Memory134.722bytes, Link100.752bytes, Triple113.944bytes; tổng349.418bytes ≤350KB. Nền Vườn đêm và flourish Home tái sử dụng. Ornament trên popup tạm dừng đã gỡ theo yêu cầu, không áp dụng art sheet mới vào game.

## Bằng chứng

- Home7/7:320×740,412×915,844×390,1024×900; đủ vùng bấm/tên, đúng game khi chọn, bàn phím, ảnh lỗi, fixture bốn trò,30vòng Home–bản đồ–tab.
- [Mobile](qa/home-412.png), [ngang](qa/home-844.png), [desktop](qa/home-1024.png), [ảnh lỗi](qa/home-fallback.png).
- [30vòng](qa/home-30-cycles.json): baseline18listener,0timer/interval/frame/animation; owner cũ về0, tiến độ bền vững không thay đổi.
- Popup correction20/20: placement và game-exit cho ba game; header bỏ ornament không tăng chiều cao.
- Regression37ca:35đạt ngay;2ca landscape dùng selector Cài đặt cũ sau khi cuộn cuối. Screenshot xác nhận nhóm Thông tin và dữ liệu ở cuối; cập nhật kiểm tra nút Xóa dữ liệu thay last settings-control, chạy lại2/2đạt. Không sửa runtime Cài đặt hoặc giảm yêu cầu viewport.
- Đã kiểm ảnh thực tế; sửa grid co theo intrinsic width do generic menu cũ, giữ tên một dòng trên ô hẹp, ẩn native broken-image icon qua scope error handler trước src. CSS có owner riêng và reduced-motion.

- Review độc lập đọc diff và chạy Home7/7 trên port riêng: approve, không finding; xem ảnh320/844, xác nhận sửa assertion Cài đặt phù hợp.
- Cổng cuối: `npm run check`, `npm run build`, `npm run build:android` đều exit0. Android ở đây là build web cho wrapper, không phải build APK hoặc nghiệm thu thiết bị.
- `git diff --check` đạt. Dữ liệu API/save/catalog không thay đổi.

## Giới hạn

Chưa đo trên Galaxy S22 Ultra thật; không tuyên bố60FPS thiết bị. Không deploy Hosting, APK hoặc Firebase. Các kiểm tra browser không thay thế nghiệm thu thiết bị thật.
