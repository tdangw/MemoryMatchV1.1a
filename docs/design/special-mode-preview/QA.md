# Popup Thử thách và Vô tận — 2026-10-15

## Thay đổi

Nút Thử thách/Vô tận trên bản đồ ba trò mở popup thông tin trước khi bắt đầu. Dùng chung renderer, vị trí, màu và nút Chơi với màn Hành trình; không thêm chọn độ khó cho chế độ đặc biệt. Chỉ xác nhận mới launch màn1, skipIntro bỏ popup bắt đầu trùng nhưng giữ reveal/gameplay. Hủy không thay tiến độ, session, item hoặc độ khó Hành trình.

Chọn mở rộng preview và dialog hiện có thay vì tạo riêng sáu popup: cùng owner/cleanup/submit guard, không sao chép bố cục hoặc luật game. `adventurePreview.js` lấy layout/time từ cấu hình thực tế: Memory/Link challenge12thẻ/60giây, Triple18thẻ/75giây; endless không giới hạn thời gian,60/60/120thẻ. Goal Vô tận không còn yêu cầu hoàn thành trước khi hết giờ. Thông tin khay/gợi ý/chủ đề lấy từ profile hiện tại. Không đổi save schema, API launch, luật xếp hạng hoặc luật sinh màn.

## Kiểm tra

- Pure preview contract pass: tất cả mode, cấu hình màn đầu, hint/tray, input sai, profile không bị mutate.
- UI:13ca mới đạt. Ba trò × bốn viewport320/412/844/1024; mỗi ca6lần mở/đóng, vị trí khớp popup thường, nút Chơi trong viewport, Escape trả focus, scope về baseline, bản lưu không đổi. Một ca launch trì hoãn/thất bại xác nhận chặn double click và retry được.
- Adventure-map32ca:31đạt ngay, gồm6case special xác nhận mới launch màn1,9case độ khó thường và keyboard/cleanup. Ca catalog còn yêu cầu tên game ở tiêu đề (đã bỏ theo yêu cầu trước). Cập nhật kiểm tra title Bộ sưu tập cùng tablist/panel đúng Triple, không sửa runtime catalog.
- Review độc lập: pure preview contract pass,14/14browser pass trên port riêng; gồm chạy lại catalog đã sửa assertion và13ca mới, approve không finding. Tổng45ca có kết quả đạt (44lần đầu,1catalog chạy lại).
- Ảnh đã kiểm trực quan: [Triple Thử thách](qa/triple-connect-challenge.png), [Memory Vô tận](qa/memory-match-endless.png). Không tạo ảnh mới hoặc thêm ornament.

Cổng cuối: `npm run check`, `npm run build`, `npm run build:android` đều exit0; `git diff --check` đạt. Không deploy hoặc build APK. Chưa đo thiết bị S22 Ultra thật; UI browser không đại diện FPS thiết bị.
