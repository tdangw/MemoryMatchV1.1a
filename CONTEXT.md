# CONTEXT — Trạng thái hiện tại

Đọc file này khi bắt đầu task mới. Chỉ mở `ARCHITECTURE.md`, tài liệu game hoặc kế hoạch Triple khi công việc liên quan; không tải lại lịch sử đã hoàn thành.

## Sản phẩm

- Ứng dụng JavaScript ES modules, lưu dữ liệu trên thiết bị bằng `localStorage`; Firebase chỉ dùng Hosting.
- Ba game có trong runtime/menu: Memory Match, Link Connect và Triple Connect.
- Memory Match và Link Connect đang ổn định trên Game Shell chung.
- Triple Connect chơi được nhưng chưa đạt Web Acceptance; kế hoạch gameplay/UI đang hoạt động là `TASK_TRIPLE_CONNECT_IMPLEMENTATION_PLAN.md`.
- `TASK_CSS_DEDUP_EFFECTS_V2_PLAN.md` vẫn là task active riêng và chưa hoàn tất; task này sở hữu CSS dedup toàn ứng dụng và Effect V2 dùng chung, không được coi là đã nhập hết vào kế hoạch Triple.
- Mục tiêu hiện tại là hoàn thiện trải nghiệm web desktop/mobile. PWA/APK/Android/signing/store QA chỉ bắt đầu bằng task riêng sau khi người dùng xác nhận web ổn định.

## Contract dùng chung

- `js/gameCatalog.js` sở hữu game/mode/namespace; session lưu riêng theo game và mode.
- Game Shell sở hữu sáu vùng semantic, HUD patch, layout, lifecycle và effect registry; controller/renderer từng game sở hữu luật, tile và presentation đặc thù.
- Xu và nội dung sở hữu dùng chung khi catalog cho phép; item, session và appearance có namespace/capability theo game.
- Popup, modal, sound, shop, collection và persistence được tái sử dụng qua adapter; không dùng nhánh mặc định “game khác => Memory/Link”.
- Transaction Xu/item/appearance phải commit atomically và rollback RAM khi save fail.
- Timer/session checkpoint theo event có ý nghĩa; không ghi persistence theo frame/tick.

## Triple Connect hiện tại

- Contract mới: Easy/Normal/Hard/Super Hard/Endless dùng 18/36/54/75/75 thẻ; Challenge `18/24/36/42/54/60/75`; khay cố định 7 ô.
- Layout active là V4; V1/V2/V3 phải tiếp tục đọc được cho save cũ.
- Milestone có 15 mốc, target 45. Lucky chỉ có trong Challenge, 1–3 tile mỗi board.
- Các phần cần hoàn thiện: silhouette/cover graph/UI witness V4, ảnh `contain`, responsive, menu/HUD/popup/timer, tray flight, exit effect chất lượng, milestone/economy và lifecycle/performance review.
- Không dùng `mobile-narrow 320×568`. Matrix Triple chỉ gồm 360×640, 411×914, hai chiều xoay tương ứng và desktop landscape hiện có, trừ khi người dùng cung cấp lỗi thật ở kích thước khác.

## Tài liệu giữ lại

- `AGENTS.md`: chuẩn làm việc bắt buộc.
- `ARCHITECTURE.md`: ownership và contract kỹ thuật bền vững.
- `README.md`: cách chạy/build.
- `ADD_GAME.md`: checklist tích hợp game.
- `Memory Match.md`, `Link Connect.md`, `Triple Connect.md`: luật/thiết kế từng game.
- `TASK_TRIPLE_CONNECT_IMPLEMENTATION_PLAN.md`: kế hoạch active cho gameplay/UI Triple.
- `TASK_CSS_DEDUP_EFFECTS_V2_PLAN.md`: kế hoạch active riêng cho CSS ownership và Effect V2.
- `themes.md`: catalog/chất lượng asset chủ đề.

Các kế hoạch baseline, readiness, compact landscape và Game Shell phase lịch sử đã hoàn tất và bị xóa. Không khôi phục chúng từ Git history để dùng làm nguồn triển khai.

## Quy tắc bàn giao

- Luôn đọc `git status` trước khi sửa; thay đổi có sẵn thuộc người dùng/agent khác và không được reset hoặc ghi đè.
- Chạy test mục tiêu trước, suite rộng ở gate cuối hoặc khi chạm shared owner.
- Test/build pass không thay thế visual review, số đo hiệu suất hoặc nghiệm thu thực tế của người dùng.
- `dist/`, `test-results/`, `playwright-report/`, `node_modules/` và manifest sinh là đầu ra có thể tạo lại, không phải source cần dọn thủ công trong task gameplay.
