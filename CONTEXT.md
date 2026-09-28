# CONTEXT — Trạng thái hiện tại (2026-09-28)

Đọc file này khi bắt đầu task mới. Đây là snapshot điều hướng, không thay thế code/config và không chứa lịch sử triển khai chi tiết.

## Sản phẩm

- Ứng dụng JavaScript ES modules, lưu dữ liệu trên thiết bị bằng `localStorage`; Firebase chỉ dùng Hosting.
- Ba game có trong runtime/menu: Memory Match, Link Connect và Triple Connect.
- Memory Match, Link Connect và Triple Connect dùng Game Shell chung; state/session gameplay vẫn tách theo game và mode.
- Kế hoạch active duy nhất là `TASK_RUNTIME_CLOSURE_AND_SIMPLIFICATION_PLAN.md`.
- Hidden Piles, Tray Expansion, Milestone 10/30 và Effect V2 runtime đã được triển khai; visual polish 21 line effect vẫn deferred.
- Review gần nhất: `npm run check` pass, production build pass, target Playwright 284/312 pass. 24 fail là contract test cũ; 4 fail là presentation test dùng fixed wait/direct DOM click. Không coi full regression đã pass cho tới khi kế hoạch active đóng các lỗi này.
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
- Base layout V5: 27/45/63/96 slot. Round có xấp dùng topology V6 để dành lane riêng cho xấp góc; V1–V5 vẫn phải đọc được cho save cũ.
- Xấp góc: Normal `9`; Hard `7 + 8`; Super Hard/Endless `6 × 4`. Thẻ ẩn không nằm trong DOM/a11y cho tới khi thành top.
- Khay cơ bản 7 ô; entitlement Mở rộng khay thêm 3 ô, giá release 3.000 Xu. Renderer tạo đúng 7 hoặc 10 node; mobile dọc dùng 5×2 khi có 10 ô.
- Milestone version 2 có 10 mốc, step 3, target 30. Lucky chỉ có trong Challenge.
- Challenge level 1–7 có tổng thẻ `18/27/42/51/66/75/93`; stage có xấp cũng dùng topology corner-safe mới.
- Profile responsive bắt buộc khi thay layout/presentation: desktop 1024×900, mobile 390×844, mobile hẹp 320×568 và landscape 844×390; geometry test còn có các viewport gameplay cụ thể.
- Effect V2 runtime đã có pool/cleanup/reduced-motion cho Link 2-target và Triple 3-target. Chất lượng hình ảnh từng line effect chưa phải acceptance đã hoàn tất.

## Theme selection hiện tại

- Image theme dùng manifest đệ quy, chọn weighted without replacement và lưu tối đa ba board gần nhất theo theme.
- Memory/Link snapshot asset path; Triple snapshot type → asset path; Continue giữ mapping, round production mới có seed mới.
- Thiếu sót active: generated theme chưa có stable selection ID/history/snapshot tương đương image theme; transaction history + session khi save fail chưa có bằng chứng rollback đầy đủ.

## Tài liệu giữ lại

- `AGENTS.md`: chuẩn làm việc bắt buộc.
- `ARCHITECTURE.md`: ownership và contract kỹ thuật bền vững.
- `README.md`: cách chạy/build.
- `ADD_GAME.md`: checklist tích hợp game.
- `Memory Match.md`, `Link Connect.md`, `Triple Connect.md`: luật/thiết kế từng game.
- `TASK_RUNTIME_CLOSURE_AND_SIMPLIFICATION_PLAN.md`: kế hoạch active duy nhất, gồm regression closure, generated theme, transaction và thu gọn test matrix.
- `themes.md`: catalog/chất lượng asset chủ đề.

Các kế hoạch Triple/Effect/Theme cũ đã được hợp nhất hoặc hoàn tất và bị xóa. Không khôi phục chúng từ Git history làm nguồn triển khai; dùng code/config, tài liệu bền vững và kế hoạch active ở trên.

## Quy tắc bàn giao

- Luôn đọc `git status` trước khi sửa; thay đổi có sẵn thuộc người dùng/agent khác và không được reset hoặc ghi đè.
- Chạy test mục tiêu trước, suite rộng ở gate cuối hoặc khi chạm shared owner.
- Mỗi contract có một test owner; không nhân mọi suite qua mọi viewport. Chỉ layout/hit target/overflow/presentation geometry cần matrix responsive.
- Test/build pass không thay thế visual review, số đo hiệu suất hoặc nghiệm thu thực tế của người dùng.
- `dist/`, `test-results/`, `playwright-report/`, `node_modules/` và manifest sinh là đầu ra có thể tạo lại, không phải source cần dọn thủ công trong task gameplay.
