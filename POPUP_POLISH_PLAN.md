# Đồng bộ popup và nút thoát — 2026-10-15

Phạm vi đã giao: exit bản đồ gắn góc như5tab; popup bắt đầu tại mép trên board trong cả3game; menu tạm dừng theo Vườn đêm. Ngoài gameplay, popup dùng lề trên an toàn. Không đổi dữ liệu, API công khai, save, luật game, thưởng hoặc thời gian pause. Toast, hiệu ứng thưởng và menu công cụ nhỏ giữ vai trò hiện tại.

## Phase1 — Exit bản đồ (hoàn tất)
- Giữ một DOM/handler navigation, thay hình dạng/vị trí trong header bản đồ.
- Kiểm tra3game, mobile/ngang/desktop, scroll và goHome; commit.

## Phase2 — Vị trí popup
- Một owner positioning dùng region board semantic, không nhánh theo game; dùng chung cho app modal và intro.
- Theo resize/visualViewport/scroll, giới hạn chiều cao còn lại, nội dung cuộn; cleanup observer/listener/frame khi destroy, replace hoặc round bị hủy.
- So sánh hai hướng: CSS top cố định đơn giản nhưng sai khi HUD/viewport thay đổi; đo semantic board theo sự kiện chính xác hơn, chỉ chạy khi popup còn sống. Chọn hướng thứ hai, không vòng lặp frame.
- Kiểm tra intro/menu/settings/help/summary, viewport, nested/replacement/dispose và tài nguyên; commit.

## Phase3 — Đồng bộ hình thức và nghiệm thu
- Menu tạm dừng xanh đậm/viền vàng, hierarchy rõ, nút nổi nhẹ, không câu hướng dẫn thừa. Dùng CSS/icon hiện có, không ảnh mới vì art không bổ sung thông tin cần thiết.
- Đồng bộ surface/header/close/button chung, giữ nội dung và bố cục riêng của popup chức năng; reduced-motion, focus, pause/handoff.
- Review độc lập, UI mục tiêu, npm run check, build web/Android, ảnh runtime và cập nhật CONTEXT/ARCHITECTURE; commit.

Thiết bị S22 Ultra thật vẫn chờ theo xác nhận trước đó; không deploy Hosting/APK/Firebase.

Phase1: UI3/3pass ở412/844/1024, mỗi ca cả3game; scroll cố định và goHome đúng.
