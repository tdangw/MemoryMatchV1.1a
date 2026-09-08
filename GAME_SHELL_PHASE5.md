# Game Shell — Phase 5

## Thay đổi

`gameShellHud.js` cung cấp bộ cập nhật stats, sao/điểm, Xu, tools, mốc năng lượng và trạng thái thanh thời gian. Component nhận reference, giá trị và formatter; không import gameplay/state, không tạo lại bàn. Reference nhóm sao/mốc được giữ lại, text/attribute/style/class được so với giá trị hiện có trước khi ghi để tránh cập nhật thừa và vẫn tương thích với hoạt ảnh Xu.

`legacyHudAdapters.js` khai báo component và tooltip của từng game. Memory giữ định dạng combo `xN`, Link giữ số; công thức sao, thưởng mốc, tồn kho và đồng hồ vẫn ở game. Ánh xạ ID được xóa cùng markup legacy ở Phase 7–8. Phase này giữ cấu trúc và CSS hình học hiện tại.

Hai trò dùng cùng biến progress timer, progress năng lượng và thời lượng combo. Tooltip HUD đọc definition qua `data-tooltip`, không còn chọn copy theo ID game trong `tooltips.js`; thông tin sao/mốc có thể focus bằng bàn phím. Các tooltip ngoài HUD và tên ảnh thuộc phần khác được giữ nguyên.

## Kiểm tra có chọn lọc

Theo yêu cầu tiết kiệm ngày 2026-09-08, dùng lại baseline Phase 4, không chạy lặp bộ 136 ca. Chỉ chạy audit bốn viewport/hai game và kiểm tra HUD: cập nhật cục bộ, bỏ ghi trùng, node bàn ổn định, bốn trạng thái màu timer và tooltip chuột/bàn phím. Không chạy lại kiểm tra đã đạt khi không có thay đổi liên quan.

Kết quả: 16/16 ca UI đạt (8 audit bố cục, 8 HUD), kiểm tra mã và production build đạt. Một assertion selector cũ được cập nhật theo contract tooltip mới. Bundle hiện tại: CSS gzip 31,03 kB + JS gzip 82,31 kB = 113,34 kB, tăng 0,23 kB so với build Phase 4 cùng bộ ảnh trong workspace; số này bao gồm thay đổi ảnh đang được thực hiện riêng.

## Kiểm tra thủ công còn lại

1. Trên điện thoại, xoay dọc/ngang ở một màn nhỏ và một màn lớn; nhìn các chỉ số, mốc và nút hỗ trợ.
2. Khi đang chơi, mở/đóng menu hoặc cài đặt, chuyển ứng dụng rồi quay lại; kiểm đồng hồ dừng/chạy tiếp đúng.
3. Nhấn giữ mốc và nút hỗ trợ: tooltip rõ, không bị cắt, không vô tình dùng vật phẩm. Thử dùng một vật phẩm và ghép một cặp để xem số lượng, điểm, sao và Xu cập nhật.

Đây là các gate cần xác nhận thủ công trước Phase 6; không tuyên bố đã thử thiết bị thật. Chưa triển khai Triple Connect.
