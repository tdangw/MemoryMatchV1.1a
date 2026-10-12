# CONTEXT — Trạng thái hiện tại (2026-10-12)

Đọc file này khi bắt đầu task mới. Đây là snapshot điều hướng, không thay thế code/config và không chứa lịch sử triển khai chi tiết.

## Sản phẩm

- Ứng dụng JavaScript ES modules, lưu dữ liệu trên thiết bị bằng `localStorage`; Firebase chỉ dùng Hosting.
- Sản phẩm chưa phát hành. Chính sách active là một root save format hiện hành, không migration chain; save development cũ thiếu/sai version hoặc hỏng được reset về mặc định an toàn.
- Ba game có trong runtime/menu: Memory Match, Link Connect và Triple Connect.
- Memory Match, Link Connect và Triple Connect dùng Game Shell chung; state/session gameplay vẫn tách theo game và mode.
- Runtime Closure và Render Performance Closure đã hoàn tất ở phạm vi runtime: validation boundary Triple, scheduler HUD chung, benchmark/soak ba game và review closure đều đã đạt trước khi kế hoạch triển khai được xóa. Không khôi phục kế hoạch runtime cũ từ Git history. Effect V2 runtime đã đạt; tinh chỉnh hình ảnh 21 line effect là việc tùy chọn tách riêng, không phải gate hay nội dung chưa hoàn tất.
- Hidden Piles, Tray Expansion, Milestone 10/30 và Effect V2 runtime đã được triển khai.
- Review runtime gần nhất ngày 2026-09-29: `npm run check` pass; Effect V2 24/24 pass sau khi bỏ brightness ngoài contract của Dissolve; lifecycle 100 vòng ba game và Triple Worker 20 chu kỳ cancel đều trả resource về baseline. Hai test Triple HUD đang thay đổi song song chưa thuộc kết luận runtime này.
- Mục tiêu hiện tại là hoàn thiện trải nghiệm web desktop/mobile. PWA/APK/Android/signing/store QA chỉ bắt đầu bằng task riêng sau khi người dùng xác nhận web ổn định.
- Gate renderer Board Startup trước đây đã hoàn tất: Link batch DOM ban đầu và cải thiện board-ready CPU 6× khoảng 20%; thử nghiệm Memory không tạo lợi ích rõ và Triple batching bị loại do làm xấu số đo. Phần async controller chưa được giao lại và không còn là kế hoạch active; nếu cần phải lập task riêng sau HUD.
- HUD dùng một owner menu theo scope cho ba game; progress là placeholder rỗng/ẩn, metric/ref chết đã loại và CSS shared sở hữu thanh ngang liền mạch với nút 44px, nhãn vàng/giá trị trắng. Regression HUD 60/60, review menu 5/5, check/build và nghiệm thu Galaxy S22 Ultra đã pass; soak không tăng resource. Chuyển cảnh background no-preference có lỗi có sẵn ngoài phạm vi, chưa được thay đổi.

## Contract dùng chung

- Firebase Hosting dùng chung project `memorymatchv1-1a` với ba site: target `production` → `memorymatchv1-1a`, target `beta` → `memorymatchv1-1b`, target `test` → `memorymatch-test`. `npm run deploy`, `npm run deploy:beta` và `npm run deploy:test` chỉ deploy đúng site tương ứng. Mỗi URL có storage trình duyệt riêng vì khác origin.

- Hiện không có kế hoạch active. Startup ba game hiển thị popup đầu màn ngay khi HUD/board DOM sẵn sàng, decode ảnh tiếp tục nền, không có nhãn loading và input/timer chỉ mở sau khi readiness hoàn tất. Startup regression 9/9, contract popup/timer Triple 1/1, check/build và nghiệm thu Galaxy S22 Ultra đã pass. Trace cold board-ready có nhiễu profiler được giữ làm dữ liệu tham khảo, không phải lỗi mở.

- Tinh chỉnh HUD ngày 2026-09-30: bỏ animation `pulse-red` phóng to ô timer, giữ cảnh báo màu tĩnh; nút menu hệ thống có nền xanh dương, công cụ gameplay có nền tím và icon sáng, cùng viền inset, không đổi kích thước 44px. Regression HUD/menu/presentation 10/10 ở 412×915; sau khi tách màu nút, presentation 3/3 và check/build pass; API/save không đổi. Chưa kiểm tra trên thiết bị thật.

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
- Khay cơ bản 7 ô; mỗi lần mua Mở rộng khay thêm 1 ô, giá 3.000 Xu, tối đa 10 ô. Renderer luôn tạo 10 node và khóa các ô chưa mua; mobile dọc dùng 5×2 khi có 10 ô.
- Milestone version 2 có 10 mốc, step 3, target 30. Lucky chỉ có trong Challenge.
- Challenge level 1–7 có tổng thẻ `18/27/42/51/66/75/93`; stage có xấp cũng dùng topology corner-safe mới.
- Baseline nghiệm thu HUD/mobile UI hiện tại là Galaxy S22 Ultra ở viewport CSS 412×915 portrait. Không tạo gate hoặc profile test riêng cho viewport 320/360; kích thước nhỏ hơn một chút dùng responsive fluid và chỉ mở test mới khi có lỗi thực tế trên thiết bị mục tiêu.
- Effect V2 runtime đã hoàn tất với pool/cleanup/reduced-motion cho Link 2-target và Triple 3-target. Chỉ mở task mỹ thuật cho từng hiệu ứng khi người dùng yêu cầu; không nhắc lại như thiếu sót runtime.
- Triple tính mục tiêu sao theo số bộ thẻ và chỉ cộng time bonus một lần khi kết thúc màn timed.
- Combo Triple dùng cùng cửa sổ với Memory/Link theo số bộ ba trong màn (≤8: 15s; 9–15: 20s; ≥16: 30s); ghép ba thẻ khởi động lại, Miss hoặc hết giờ đặt combo hiện tại về 0 nhưng giữ maxCombo.

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

Các kế hoạch HUD, Startup, Triple/Effect/Theme, Runtime Closure và Board Startup cũ đã được hợp nhất, hoàn tất hoặc ngừng active và bị xóa. Không khôi phục chúng từ Git history làm nguồn triển khai; dùng code/config và các tài liệu bền vững ở trên làm nguồn hiện hành.

## Quy tắc bàn giao

- Luôn đọc `git status` trước khi sửa; thay đổi có sẵn thuộc người dùng/agent khác và không được reset hoặc ghi đè.
- Chạy test mục tiêu trước, suite rộng ở gate cuối hoặc khi chạm shared owner.
- Mỗi contract có một test owner; không nhân mọi suite qua mọi viewport. Chỉ layout/hit target/overflow/presentation geometry cần matrix responsive.
- Test/build pass không thay thế visual review, số đo hiệu suất hoặc nghiệm thu thực tế của người dùng.
- `dist/`, `test-results/`, `playwright-report/`, `node_modules/` và manifest sinh là đầu ra có thể tạo lại, không phải source cần dọn thủ công trong task gameplay.
