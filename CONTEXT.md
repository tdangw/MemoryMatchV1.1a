# CONTEXT — Trạng thái hiện tại (2026-09-29)

Đọc file này khi bắt đầu task mới. Đây là snapshot điều hướng, không thay thế code/config và không chứa lịch sử triển khai chi tiết.

## Sản phẩm

- Ứng dụng JavaScript ES modules, lưu dữ liệu trên thiết bị bằng `localStorage`; Firebase chỉ dùng Hosting.
- Sản phẩm chưa phát hành. Chính sách active là một root save format hiện hành, không migration chain; save development cũ thiếu/sai version hoặc hỏng được reset về mặc định an toàn.
- Ba game có trong runtime/menu: Memory Match, Link Connect và Triple Connect.
- Memory Match, Link Connect và Triple Connect dùng Game Shell chung; state/session gameplay vẫn tách theo game và mode.
- Runtime Closure và Render Performance Closure đã hoàn tất ở phạm vi runtime: validation boundary Triple, scheduler HUD chung, benchmark/soak ba game và review closure đều có evidence trong `TASK_RUNTIME_CLOSURE_AND_SIMPLIFICATION_PLAN.md`. Không khôi phục kế hoạch runtime cũ từ Git history. Effect V2 runtime đã đạt; tinh chỉnh hình ảnh 21 line effect là việc tùy chọn tách riêng, không phải gate hay nội dung chưa hoàn tất.
- Hidden Piles, Tray Expansion, Milestone 10/30 và Effect V2 runtime đã được triển khai.
- Review gần nhất: `npm run check` pass, production build pass, smoke UI pass và release matrix 368 case đã chạy sau khi đóng các contract test stale.
- Mục tiêu hiện tại là hoàn thiện trải nghiệm web desktop/mobile. PWA/APK/Android/signing/store QA chỉ bắt đầu bằng task riêng sau khi người dùng xác nhận web ổn định.

## Contract dùng chung

- `js/gameCatalog.js` sở hữu game/mode/namespace; session lưu riêng theo game và mode.
- Game Shell sở hữu sáu vùng semantic, HUD patch, layout, lifecycle và effect registry; controller/renderer từng game sở hữu luật, tile và presentation đặc thù.
- Xu và nội dung sở hữu dùng chung khi catalog cho phép; item, session và appearance có namespace/capability theo game.
- Popup, modal, sound, shop, collection và persistence được tái sử dụng qua adapter; không dùng nhánh mặc định “game khác => Memory/Link”.
- Transaction Xu/item/appearance phải commit atomically và rollback RAM khi save fail.
- Timer/session checkpoint theo event có ý nghĩa; không ghi persistence theo frame/tick.

## Triple Connect hiện tại

- Tổng thẻ active: Easy 27, Normal 54, Hard 78, Super Hard/Endless 120.
- Layout, snapshot và milestone Triple chỉ dùng contract hiện hành; không có yêu cầu đọc save Triple development cũ.
- Xấp góc: Normal `9`; Hard `7 + 8`; Super Hard/Endless `6 × 4`. Thẻ ẩn không nằm trong DOM/a11y cho tới khi thành top.
- Khay cơ bản 7 ô; entitlement Mở rộng khay thêm 3 ô, giá release 3.000 Xu. Renderer tạo đúng 7 hoặc 10 node; mobile dọc dùng 5×2 khi có 10 ô.
- Milestone version 2 có 10 mốc, step 3, target 30. Lucky chỉ có trong Challenge.
- Challenge level 1–7 có tổng thẻ `18/27/42/51/66/75/93`; stage có xấp cũng dùng topology corner-safe mới.
- Profile responsive bắt buộc khi thay layout/presentation: desktop 1024×900, mobile 390×844, mobile hẹp 320×568 và landscape 844×390; geometry test còn có các viewport gameplay cụ thể.
- Effect V2 runtime đã hoàn tất với pool/cleanup/reduced-motion cho Link 2-target và Triple 3-target. Chỉ mở task mỹ thuật cho từng hiệu ứng khi người dùng yêu cầu; không nhắc lại như thiếu sót runtime.
- Triple tính mục tiêu sao theo số bộ thẻ và chỉ cộng time bonus một lần khi kết thúc màn timed.

## Theme selection hiện tại

- Image theme dùng manifest đệ quy, chọn weighted without replacement và lưu tối đa ba board gần nhất theo theme.
- Image selection dùng asset path; generated selection dùng stable ID. Memory/Link snapshot selection; Triple snapshot type → selection; Continue giữ mapping, round production mới có seed mới.
- Theme history và session commit/rollback atomically trên cả ba game.

## Điều hướng catalog hiện tại

- Cửa hàng và Bộ sưu tập lưu stable tab ID riêng theo `(gameId, shop/collection)`, khôi phục qua reopen/reload và fallback an toàn khi capability không còn.

## Tài liệu giữ lại

- `AGENTS.md`: chuẩn làm việc bắt buộc.
- `ARCHITECTURE.md`: ownership và contract kỹ thuật bền vững.
- `README.md`: cách chạy/build.
- `ADD_GAME.md`: checklist tích hợp game.
- `Memory Match.md`, `Link Connect.md`, `Triple Connect.md`: luật/thiết kế từng game.
- `themes.md`: catalog/chất lượng asset chủ đề.

Các kế hoạch Triple/Effect/Theme và Runtime Closure cũ đã được hợp nhất hoặc hoàn tất và bị xóa. Không khôi phục chúng từ Git history làm nguồn triển khai. `TASK_RUNTIME_CLOSURE_AND_SIMPLIFICATION_PLAN.md` là kế hoạch active duy nhất cho follow-up hiệu suất F1–F4 và gate visual hoãn; dùng code/config và tài liệu bền vững làm nguồn hiện hành.

## Quy tắc bàn giao

- Luôn đọc `git status` trước khi sửa; thay đổi có sẵn thuộc người dùng/agent khác và không được reset hoặc ghi đè.
- Chạy test mục tiêu trước, suite rộng ở gate cuối hoặc khi chạm shared owner.
- Mỗi contract có một test owner; không nhân mọi suite qua mọi viewport. Chỉ layout/hit target/overflow/presentation geometry cần matrix responsive.
- Test/build pass không thay thế visual review, số đo hiệu suất hoặc nghiệm thu thực tế của người dùng.
- `dist/`, `test-results/`, `playwright-report/`, `node_modules/` và manifest sinh là đầu ra có thể tạo lại, không phải source cần dọn thủ công trong task gameplay.
