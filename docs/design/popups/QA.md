# Đồng bộ popup và nút thoát bản đồ

Ngày2026-10-15. [Kế hoạch](../../../POPUP_POLISH_PLAN.md).

## Kết quả

- Exit bản đồ gắn góc phải header56×60px như5tab; safe-area, map scroll và hành động về Home giữ nguyên.
- Popup gameplay bắt đầu tại mép trên region board của cả3trò. App modal và intro dùng cùng owner vị trí; popup bản đồ dùng mốc chrome Game Shell cùng cao độ gameplay, kể cả lần đầu; popup ngoài bản đồ/gameplay dùng lề trên16px. Không áp dụng vị trí dialog vào tab toàn màn hình, toast hoặc menu công cụ nhỏ.
- Resize/xoay/visualViewport/scroll cập nhật theo sự kiện, gộp tối đa một RAF đang chờ. ResizeObserver/listener/RAF bị hủy theo lifecycle. Nội dung dài cuộn trong chiều cao còn lại. Bỏ offset riêng intro/victory.
- Tạm dừng: Tiếp tục là hành động chính; Chơi lại/Lượt mới và Cài đặt cùng hàng; Thoát game ở dưới. Bỏ câu hướng dẫn thừa. Đổi surface xanh đậm, vàng dịu, close44px, nút nổi nhẹ, focus/reduced-motion và dùng flourish có sẵn. Intro bỏ glow xanh; không tạo bitmap mới, không animation loop.
- Không đổi public API, save/schema, Auth, điểm/sao/xếp hạng, inventory hoặc luật game. Không deploy Hosting/APK/Firebase.

## Phương án và review

Chọn region board semantic và một connection theo lifecycle thay top cố định theo từng game: chịu được HUD/rotate/scroll khác nhau, không thêm nhánh game vào shared module. Giữ DOM/handler exit thay dựng owner thứ hai. CSS/icon/flourish hiện có đủ thể hiện bề mặt và độ nổi, tránh tải thêm ảnh trang trí.

Review độc lập đọc diff ownership/cleanup, tiếp tục/async action guard, CSS cascade/reduced-motion và yêu cầu chứng minh footer fit. Đã bổ sung kiểm tra từng nút44px nằm trọn panel và icon theo màu nút. Không có finding blocker.

## Bằng chứng

| Phạm vi | Kết quả |
|---|---|
| Phase1 map exit |3/3 ở412×915,844×390,1024×900; mỗi ca cả3game/scroll/goHome |
| Phase2 vị trí |11/11:3game×3viewport/rotate, fallback/nested/replace/30cycles và summary thắng thật |
| Phase2 regression |9startup và9settings pass |
| Phase3 regression |68/68: placement11, exit6, startup9, HUD menu/lifecycle5, map3, settings9, Triple chrome8/tools10, victory7 |
| Delta hình thức cuối |11/11; từng nút pause nằm trọn panel,44px, focus Tiếp tục và không overflow |
| Steering popup bản đồ |3/3; mỗi ca cả3game, first visit map→play→pause ở412/844/1024, top lệch<2px, nút Chơi nằm trong viewport |
| Review độc lập trước steering |2/2browser: fallback/30cycles và victory; CSS ownership/diff pass |

Soak HUD20vòng mỗi game gồm restart/switch,120scope dispose đều trả tài nguyên về0. Placement30vòng disconnect observer/listener và hủy RAF; intro replace/destroy không giữ owner entry. Khi đo owner, đã chờ tác vụ tooltip focus hữu hạn bằng clock500ms; không coi snapshot giữa tác vụ là leak hoặc bỏ assertion. Bài fallback ban đầu chụp giữa animation nên sai vị trí tức thời; reduced-motion cho popup đã được xử lý, kiểm tra cuối đạt.

Ảnh runtime: [Tạm dừng dọc](qa/pause-link-connect-412.png), [Tạm dừng ngang](qa/pause-link-connect-844.png), [Memory](qa/pause-memory-match-412.png), [Triple](qa/pause-triple-connect-412.png), [Cài đặt ngang có cuộn](qa/settings-844.png), [Đầu màn](qa/intro-412.png), [Tổng kết](qa/victory.png), [Chọn độ khó cùng cao độ game](qa/map-preview-412.png). Dữ liệu gameplay trong ảnh là ván kiểm tra local; không tạo dữ liệu mẫu production.

Galaxy S22 Ultra thật còn chờ theo xác nhận người dùng; browser Windows không chứng minh60FPS hoặc bàn phím hệ thống trên điện thoại thật.
