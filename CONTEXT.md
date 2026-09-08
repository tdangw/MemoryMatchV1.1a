# CONTEXT — Trạng thái hiện tại

Tài liệu này chỉ ghi trạng thái sản phẩm và các quy tắc đang có hiệu lực. Chi tiết kiến trúc nằm trong `ARCHITECTURE.md`; cách chạy/build nằm trong `README.md`; thiết kế từng trò nằm trong tài liệu cùng tên.

## Sản phẩm

- Game viết bằng JavaScript ES modules, chạy trên web/PWA và có thể đóng gói Android bằng Capacitor.
- Hai trò đã hoạt động độc lập: **Memory Match** và **Link Connect**.
- **Triple Connect** mới là thiết kế trong `Triple Connect.md`, chưa có trong runtime hoặc menu.
- Không có backend, Firebase Web SDK hay quảng cáo. Dữ liệu người chơi được lưu trên thiết bị bằng `localStorage`.

## Quy tắc dùng chung

- Cả hai trò có sáu chế độ: Dễ, Trung bình, Khó, Siêu khó, Vô tận và Thử thách.
- Xu, chủ đề và nội dung đã sở hữu được dùng chung; chủ đề đang trang bị và vật phẩm hỗ trợ được quản lý riêng theo từng trò.
- Phiên chơi được lưu riêng theo trò và chế độ. **Tiếp tục** khôi phục level và thời gian checkpoint; **Chơi lại** dùng thời gian đầu màn; **Chơi mới** thay thế phiên của chế độ đã chọn.
- Điểm mỗi cặp là `10 + (combo - 1) × 3`. Mốc sao dựa trên số cặp; màn đếm ngược cộng thời gian còn lại vào điểm trước khi xét sao.
- Giới hạn thử nghiệm của vật phẩm tích trữ là `999`, lấy từ `GAMEPLAY_LIMITS.itemCount`.
- Popup đầu màn, tổng kết, hết giờ, HUD, Xu, âm thanh, tooltip và hệ modal được dùng chung khi phù hợp.

## Memory Match

- Người chơi lật hai thẻ để tìm cặp giống nhau. Ghép sai hoặc để hết cửa sổ combo đặt combo về 0. Cửa sổ dùng chung theo kích thước bàn là 15/20/30 giây; chạm lại cùng thẻ chỉ bỏ chọn và không làm mất combo.
- Dễ/Trung bình/Khó/Siêu khó dùng bàn cố định; Thử thách tăng kích thước theo level; Vô tận đếm thời gian xuôi.
- Ô may mắn của Thử thách có thể thưởng thời gian, Gợi ý hoặc Xu.
- Cặp đặc biệt có thể rơi năng lượng và hỗ trợ. Năng lượng chạy vòng 10 mốc riêng của Memory Match; tỷ lệ đang là 100% để kiểm thử. Gói Xem trước rơi ra tự dùng và được phân biệt bằng màu, không hiện nhãn số trên vật phẩm.
- Kho Memory Match lưu riêng các gói Xem trước 4/8/12/tất cả và Thời gian 10/30/45/60 giây. Mua trong cửa hàng chỉ thêm vào kho; hai nút HUD mở kho để dùng. Gợi ý giữ luồng sử dụng hiện tại.
- Hoàn thành màn 100 chạy cảnh chiến thắng cuối; thời lượng và trình tự hiệu ứng lấy từ `js/gameplayTuning.js` và `js/victoryCelebration.js`.
- Cấu hình và công thức chính nằm trong `js/config.js`; luồng chơi nằm trong `js/gameController.js`, `js/logic.js` và `js/grid.js`.

## Link Connect

- Ghép hai hình giống nhau bằng đường trực giao tối đa hai lần rẽ; đường nối được phép đi qua lớp trống ngoài biên.
- Sau mỗi cặp, thẻ có thể giữ nguyên hoặc dịch chuyển theo quy tắc của level. Từ level 28, quy tắc được chọn ngẫu nhiên trong toàn bộ nhóm đã mở.
- Nếu thẻ không-băng không còn đường nối, game tự xáo. Nếu toàn bộ thẻ còn lại đều bị khóa băng, tất cả cặp băng được mở cùng lúc.
- Thẻ cao cấp gồm Cyan – Phá Băng, Xanh dương – Tiếp Tế và Đỏ – Bùng Nổ. Sấm sét từ thẻ cao cấp tiếp tục combo; Sấm sét từ vật phẩm chỉ tính điểm cơ bản.
- Năng lượng từ thẻ cao cấp kích hoạt vòng 10 mốc thưởng. Tiến trình và chuỗi không-rơi được lưu theo phiên: qua màn, thua/Chơi lại và quay Menu/Tiếp tục đều giữ; chỉ Chơi mới reset. Sau mốc 10, tiến trình quay về đầu và lặp vòng mới.
- Tỷ lệ năng lượng đang tạm là `100%` để kiểm thử; cấu hình phát hành dự kiến là `20%`, bảo hiểm ở lần thứ 10 sau 9 lần không rơi.
- Không có popup giải thích quy tắc khi vào màn. Mục **Hướng dẫn** trong Menu chứa bản tóm tắt dành cho người chơi.
- Cấu hình và quy tắc chi tiết nằm trong `js/linkConnect/linkConfig.js` và `Link Connect.md`.

## Lưu dữ liệu và hiệu suất

- Bản lưu dùng một gói có `schemaVersion` và `revision`; giao dịch Xu + vật phẩm/ngoại hình ghi cùng lần và hoàn tác RAM nếu ghi thất bại.
- Lỗi đọc/ghi storage không làm ngắt khởi động. Tab cũ không được ghi đè revision mới; khi đang chơi, ứng dụng yêu cầu tải lại trước khi ghi tiếp.
- Thời gian phiên được checkpoint mỗi 5 giây và khi ẩn/rời trang. Thanh thời gian dùng `transform`, dừng theo trạng thái pause/lock; hiệu ứng vật phẩm rơi dùng Web Animations và không dựng lại board.
- Catalog chỉ giữ metadata đường dẫn. Trình duyệt chỉ giải mã ảnh của bàn hiện tại; service worker gộp URL trùng và giới hạn 6 yêu cầu tài nguyên đang tải.

## Phần còn cần kiểm tra

- Game Shell: Phase 1–4 đã hoàn tất; bước tiếp theo là Phase 5 (HUD component dùng chung). Hai game dùng chung layout, contract DOM và scope tài nguyên theo round; đổi game/chơi lại hủy callback, timer, modal và hiệu ứng cũ. 136 trường hợp UI, check/build đạt; node/listener về baseline sau 20 lượt. Mobile dọc vẫn ưu tiên, HUD giữ hình học hiện có. Chi tiết trong `GAME_SHELL_PHASE4.md`.

1. Rà trực quan từng hiệu ứng đường nối và xóa thẻ trong Bộ sưu tập trước khi coi là đạt chất lượng phát hành.
2. Kiểm thử Link Connect trên thiết bị mobile hẹp, bàn 6 cột và level cao với mọi kiểu dịch chuyển.
3. Một số selector giao diện cũ vẫn chồng lấn giữa các file CSS; không xóa hàng loạt trước khi kiểm thử hiển thị.
4. Cần bổ sung bộ E2E trình duyệt thật cho toàn bộ luồng DOM hoàn thành màn và chuyển game giữa lúc preview/hiệu ứng đang chạy.

## Ngoài phạm vi hiện tại

- Link Connect chưa có đá, cổng không gian, Adventure 100 bàn riêng, Time Rush, Zen Mode hoặc Fever.
- Danh sách và tình trạng asset chủ đề được theo dõi riêng trong `themes.md`.
