# Game Shell — Phase 7

## Triển khai

Memory có module sở hữu giao diện `js/memoryMatch/memoryShellDom.js`, dựng một lần trước khi module game gắn listener. Markup Memory được chuyển khỏi `index.html`; cài đặt và audio toàn ứng dụng vẫn ở HTML. `memoryShell.js` khai báo các vùng semantic và HUD của Memory, dùng Game Shell/layout/effects đã có. Xóa nhánh Memory khỏi hai adapter legacy; Link giữ adapter đến Phase 8.

Giữ ID đang được gameplay, CSS và kiểm thử sử dụng; đây là DOM hook còn hoạt động, không xóa chỉ để đổi tên. Giữ cấu trúc/hình học Memory. Xóa CSS highlight cũ và đoạn cleanup tương ứng vì Phase 6 đã thay bằng animation chung.

## Sửa lỗi Phase 6

Khôi phục `FRAGMENT_LAYOUTS` và `CANVAS_EXIT_EFFECTS` bị xóa nhầm khi thay hàm thu vật phẩm Link. Lỗi xảy ra ngay khi ghép cặp vì renderer vẫn gọi chúng, không phụ thuộc Phase 8. Thêm ca chạy cả bảy preset canvas với ảnh đã decode và thao tác ghép cặp thực, đợi callback hoàn tất trước khi kiểm kết quả.

## Kiểm chứng

- 10 ca desktop liên quan: HUD, tooltip, vòng đời 20 lượt, đổi trò giữa hiệu ứng, modal, giữ node khi chơi lại, sáu mode Memory, reload Challenge, kho Gợi ý và ghép cặp Link/preset canvas.
- Audit bốn viewport so với baseline Phase 1 được chạy riêng với `GAME_SHELL_AUDIT_WITHOUT_FULLSCREEN=1`. Nút fullscreen đang được phát triển riêng làm tăng node và chiều cao tiêu đề; tùy chọn chỉ loại nút/class fullscreen khỏi phép đo, không thay bản game hoặc baseline. Audit mặc định có fullscreen không đạt baseline cũ vì khác biệt này.
- Kết quả: 10 ca chức năng và 4 audit tách fullscreen đạt; check/build đạt. Bundle workspace gồm cả fullscreen/ảnh đang làm riêng: CSS gzip 31,25 kB, JS gzip 84,91 kB; HTML gzip 1,05 kB sau khi chuyển markup vào module.

## Kiểm tra thủ công trước Phase 8

1. Memory trên điện thoại dọc/ngang: bàn nhỏ/lớn, tọa độ, chọn/bỏ chọn, dùng kho và xem chỉ số.
2. Hoàn tất/thua một màn, Chơi lại/Tiếp tục; nhận mốc năng lượng, sao và Xu, kiểm popup và âm thanh.
3. Kiểm tra bố cục có nút fullscreen cùng thay đổi của task fullscreen; chưa xem baseline cũ là xác nhận cho tính năng mới đó.

Chưa triển khai Triple Connect.
