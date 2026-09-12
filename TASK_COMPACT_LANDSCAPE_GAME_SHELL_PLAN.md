# TASK

## Goal

Tạo chế độ giao diện ngang gọn dùng chung cho **Memory Match, Link Connect và mọi game sau này sử dụng Game Shell**:

- ẩn vùng tên game;
- ẩn HUD tiến trình phía trên;
- ẩn HUD mốc/xu phía dưới;
- giữ nguyên toàn bộ thanh HUD xanh chính và mọi chức năng tương tác bên trong;
- giảm chiều rộng thanh HUD xanh còn đúng **90% chiều rộng mà nó sẽ có ở layout hiện tại**;
- nhường thêm chiều cao cho bàn chơi mà không thay đổi luật game, state, timer, inventory hoặc dữ liệu lưu.

Trong Link Connect hiện tại, thanh được giữ gồm 5 nhóm nhìn thấy trong ảnh: menu, level, thời gian, tổng sao và công cụ. Với Memory Match và game tương lai, yêu cầu được hiểu theo semantic region: giữ toàn bộ `[data-shell-region="hud"]`, không ép mọi game phải có đúng 5 node con.

Phạm vi đánh giá: ảnh Link Connect đính kèm, cấu trúc Game Shell dùng chung, Memory Match hiện tại và Link Connect hiện tại.

## Problem

Giao diện ngang hiện vẫn xếp bốn vùng chrome trước bàn chơi: `title`, `progress`, `hud`, `milestones`. Trên màn hình thấp, các vùng này chiếm nhiều chiều cao nên bàn chơi bị thu nhỏ dù chiều ngang còn dư.

Các giới hạn và nguy cơ đã xác định:

- Hai game đã dùng cùng contract `data-shell-region`, nên vá riêng `#game-title` và `#link-game-title` sẽ tạo trùng lặp và game mới không tự nhận hành vi.
- Chiều rộng HUD hiện được sở hữu riêng tại `styles/hud.css` và `styles/link-connect.css`. Cần một override dùng chung ở lớp Game Shell, không sao chép thêm hai media query.
- Breakpoint landscape hiện là `height <= 500px`, nhưng ảnh tham chiếu cao khoảng 519 px. Nếu giữ ngưỡng cũ, giao diện trong ảnh có thể không kích hoạt compact mode. Đề xuất chuẩn hóa compact landscape thành `orientation: landscape` và `height <= 600px`; ngưỡng cuối phải được xác nhận bằng test trên viewport thật trước khi merge.
- Giá trị trong CSS media query là **CSS pixel**, không phải số pixel vật lý của tấm nền. Với `<meta name="viewport" content="width=device-width, initial-scale=1.0">` hiện có, điện thoại 1920×1080 hoặc 2400×1080 thường báo viewport landscape chỉ khoảng 640×360, 800×360 hoặc 914×411 CSS px tùy DPR/browser, nên vẫn thỏa `height <= 600px`. Ngược lại, desktop có viewport thật 1920×1080 CSS px sẽ không compact; đây là chủ ý để không làm mất HUD trên màn hình lớn.
- Một số media query landscape đang lặp literal `500px` ở nhiều file, có nguy cơ mất đồng bộ với `gameShellConfig.js`.
- Layout engine đang nhận cả bốn vùng chrome để đo. Khi ba vùng chuyển sang `display: none`, test hình học hiện tại phải hiểu rect bằng 0 là hợp lệ trong compact mode và vẫn chứng minh bàn được đo lại đúng.
- Nút fullscreen hiện nằm trong vùng title. Khi title bị ẩn, nút này cũng bị ẩn. Không được để người chơi mắc kẹt trong fullscreen: phải xác minh Escape/Back/native exit; nếu sản phẩm yêu cầu nút thoát trực tiếp thì thêm action fullscreen vào menu trong một task riêng sau khi được duyệt.
- Menu và tools popup neo vào hai mép HUD. Khi HUD hẹp 10%, popup vẫn có thể vượt visual viewport/safe-area nếu không kiểm tra.

## Files to inspect

- `AGENTS.md`
- `js/gameShell/gameShellConfig.js`
- `scripts/generate-game-shell-tokens.mjs`
- `styles/game-shell/tokens.css` — generated, không sửa tay
- `styles/game-shell/presentation.css`
- `js/gameShell/gameShellLayout.js`
- `js/gameShell/gameShell.js`
- `js/gameShell/gameFullscreen.js`
- `js/memoryMatch/memoryShellDom.js`
- `js/linkConnect/linkShell.js`
- `styles/hud.css`
- `styles/gameplay-ui.css`
- `styles/link-connect.css`
- `tests/ui/game-shell.config.spec.js`
- `tests/ui/game-shell.geometry.spec.js`
- `tests/ui/game-shell.layout.spec.js`
- `tests/ui/game-shell.presentation.spec.js`
- `tests/ui/game-shell.audit.spec.js`
- `tests/ui/challenge-fullscreen.spec.js`
- `playwright.config.js`

Chỉ mở rộng sang file khác khi import/call site hoặc test fail chứng minh cần thiết; không quét lại toàn dự án.

## Required changes

1. **Chốt contract compact landscape dùng chung.**
   - Điều kiện: `orientation: landscape` và chiều cao viewport không quá 600 px. Kiểm tra tại hai viewport CSS chuẩn đã chốt: 640×360 và 914×411; không làm biến đổi desktop 1024×900.
   - Mọi so sánh breakpoint dùng kích thước CSS viewport (`visualViewport` khi có, nếu không dùng `innerWidth/innerHeight`), không dùng `screen.width`, độ phân giải ảnh chụp hoặc pixel vật lý.
   - Contract dựa trên `[data-shell-region]`, không dựa trên ID của từng game.
   - Ẩn `title`, `progress`, `milestones`; giữ `hud`, `frame`, `board`.
   - Không xóa node khỏi DOM và không tạo lại shell khi xoay màn hình.

2. **Đưa cấu hình 90% và breakpoint về một nguồn sự thật.**
   - Thêm token cấu hình có tên rõ, ví dụ `hud.compactLandscapeWidthRatio = 0.9`.
   - Dùng `breakpoints.landscapeHeight` làm nguồn ngưỡng; nếu đổi từ 500 lên 600 phải cập nhật test config/token đồng bộ.
   - Cập nhật generator rồi sinh lại `styles/game-shell/tokens.css`; tuyệt đối không chỉnh tay file generated.
   - Thêm contract test để ngăn token/breakpoint generated lệch config.

3. **Đặt presentation rule ở owner dùng chung.**
   - Thêm compact-landscape rules tại lớp `styles/game-shell/presentation.css` hoặc output responsive dùng chung do generator sở hữu.
   - Selector chỉ tác động game shell đang hiển thị và chỉ các region đã định nghĩa.
   - Không thêm hai bản tương đương trong `hud.css` và `link-connect.css`.
   - Rà soát các media query landscape cũ; chỉ bỏ/thu gọn rule bị shared rule thay thế, giữ rule game-specific còn cần thiết.

4. **Giảm đúng chiều rộng, không scale toàn bộ HUD.**
   - Tính chiều rộng compact bằng 90% used width của HUD bình thường, vẫn clamp theo visual viewport và safe-area.
   - Không dùng `transform: scale(.9)` vì sẽ làm mờ chữ, giảm hit target, không trả lại layout width thật và làm sai tọa độ popup.
   - Không giảm chiều cao, font hoặc kích thước vùng chạm chỉ để ép vừa. Nút chạm phải giữ tối thiểu theo kích thước hiện có; mục tiêu 44 CSS px khi không phá thiết kế, và không thấp hơn contract hiện tại của game.
   - Nếu nội dung không vừa tại một viewport cực hẹp, ưu tiên tăng width đến mức tối thiểu cần tương tác hoặc dùng layout có kiểm soát; không overflow/đè nút.

5. **Giữ nguyên tương tác trong HUD.**
   - Memory Match: menu, kho thời gian, xem trước, hint, level, timer và sao vẫn dùng được.
   - Link Connect: menu, level, timer, sao và tools vẫn dùng được.
   - Game mới: mọi control đặt trong region `hud` tự được giữ mà không cần selector riêng.
   - Không tắt update HUD khi vùng progress/milestones bị ẩn; state phải tiếp tục chính xác để hiện lại ngay khi xoay dọc.

6. **Bảo đảm popup nằm trong viewport.**
   - Kiểm tra actions menu bên trái và tool/inventory menu bên phải tại safe-area có notch.
   - Popup vẫn neo với control tương ứng nhưng clamp vào visual viewport; không dùng tọa độ hard-code theo chiều rộng cũ.
   - Mở một menu phải giữ nguyên quy tắc đóng/mở, `aria-expanded`, click ngoài và Escape hiện có.

7. **Đồng bộ layout khi đổi orientation/viewport.**
   - Tận dụng đúng một connection, một resize scheduling path và tối đa một layout pass/frame hiện có.
   - Khi compact state đổi, board phải được đo lại sau khi CSS visibility đã có hiệu lực.
   - Không thêm listener, `ResizeObserver`, polling hoặc `requestAnimationFrame` riêng cho mỗi game.
   - Xoay ngang/dọc không rebuild board, không mất selection, timer, combo, freeze state hoặc inventory.

8. **Khả năng truy cập.**
   - Dùng `display: none` cho ba region cần ẩn để chúng không chiếm layout và không tạo focus target ẩn.
   - HUD còn lại giữ thứ tự focus, label và trạng thái `aria-expanded`.
   - Xác minh đường thoát fullscreen bằng keyboard/OS. Nếu không bảo đảm được, báo blocker thay vì tự nhét nút thứ sáu vào HUD trái yêu cầu.

9. **Cập nhật test theo hai contract tách biệt.**
   - Portrait/desktop không compact: bốn vùng chrome vẫn hiển thị và giữ hình học hiện tại.
   - Compact landscape: ba vùng bị ẩn, HUD hiển thị, HUD rộng xấp xỉ 90% baseline tương ứng, board không overflow.
   - Không cập nhật visual baseline trước khi assertions hành vi và hình học đã pass.

10. **Triển khai theo gate độc lập.**
    - Điều kiện trước: baseline trong `TASK_FIX_PRE_TRIPLE_BASELINE.md` phải xanh. Không cần hoàn thành kế hoạch CSS/effect trước; chỉ kiểm tra ownership của đúng các selector/region landscape liên quan và đặt rule mới tại shared Game Shell. Trong thời gian thực hiện, không để task CSS/effect khác sửa cùng các file hoặc selector song song.
    - Gate A: baseline screenshot/geometry của cả hai game ở portrait, desktop và landscape.
    - Gate B: config/token + shared presentation rule.
    - Gate C: popup/safe-area/fullscreen/accessibility.
    - Gate D: test orientation, lifecycle và performance.
    - Gate E: review độc lập theo `AGENTS.md`; chỉ sau khi pass mới cập nhật baseline ảnh nếu cần.

Sau Gate E, coi compact-landscape contract là đầu vào bắt buộc của `TASK_CSS_DEDUP_EFFECTS_V2_PLAN.md`: việc gom CSS sau đó phải bảo toàn rule dùng chung và toàn bộ test landscape đã pass.

## Edge cases

- Viewport CSS chuẩn 640×360 và 914×411.
- Desktop rộng nhưng cao 768/900 px không bị compact ngoài ý muốn.
- Xoay qua lại nhiều lần tại hai viewport CSS chuẩn đã chốt.
- Visual viewport thay đổi do thanh địa chỉ mobile hoặc bàn phím ảo.
- Điện thoại vật lý 1920×1080 và 2400×1080 với các DPR phổ biến; xác nhận bằng CSS viewport thực tế thay vì hard-code theo độ phân giải tấm nền.
- Safe-area trái/phải trên thiết bị notch.
- Memory Match có nhiều control hơn Link Connect nhưng không chồng lấn sau khi HUD còn 90%.
- Menu trái và tools phải mở được đồng thời theo đúng policy hiện tại, không tràn màn hình.
- Timer đang freeze/preview, combo đang chạy hoặc animation đang dở khi xoay màn hình.
- Challenge/board lớn, coordinate labels bật và level cao.
- `prefers-reduced-motion` bật.
- Vào/thoát browser fullscreen trong landscape.
- Game tương lai có đủ sáu `data-shell-region` nhưng nội dung HUD rộng hơn hiện tại.

## Performance constraints

- Giữ mục tiêu 60 FPS; không thêm animation cho việc ẩn/hiện chrome trong task này.
- Orientation/resize phải đi qua scheduler hiện có, tối đa một layout pass trong một frame.
- Không rebuild board hoặc recreate HUD khi media state đổi.
- Không tạo allocation mỗi frame, polling, interval hay listener theo game.
- Không đọc layout xen kẽ nhiều lần ghi style; compact state phải được áp dụng trước pha đo ổn định.
- Không tăng DOM node, network request, asset decode, localStorage/Firebase write.
- Sau 20 chu kỳ đổi game và 20 chu kỳ xoay, số observer/listener/pending frame phải trở về baseline; không có detached HUD/menu giữ reference.

## Tests required

- `npm run shell:sync` sau khi đổi source token/generator.
- `npm run check`.
- `npm run build`.
- `npm run test:ui:geometry`.
- `npm run test:ui:layout`.
- `npm run test:ui:lifecycle`.
- `npm run test:ui:audit`.
- Playwright test mới hoặc mở rộng cho compact-landscape contract trên cả Memory Match và Link Connect.
- Assertions bắt buộc:
  - `title`, `progress`, `milestones` có `display: none` trong compact landscape;
  - `hud`, `frame`, `board` hiển thị và nằm trong visual viewport;
  - HUD compact có used width bằng 90% HUD không compact tương ứng, cho phép sai số tối đa 1 px do rounding;
  - toàn bộ control trong HUD có bounding box hợp lệ, không overlap và nhận click/keyboard;
  - actions/tools popup không vượt safe-area;
  - xoay về portrait khôi phục đủ vùng và dữ liệu HUD mới nhất;
  - `active = 1`, `observers = 1`, `pendingFrames = 0`, `maxPassesPerFrame <= 1` sau settle;
  - unmount trả `active/observers/listeners/pendingFrames` về 0.
- Contract test giữ breakpoint 600 px đồng bộ giữa config và token generated.
- Test fullscreen/Escape hoặc Android Back phù hợp khả năng harness.
- Visual screenshots tối thiểu: hai game × portrait, 640×360 và 914×411.

## Acceptance criteria

- [ ] Memory Match và Link Connect đều dùng cùng một compact-landscape contract ở Game Shell.
- [ ] Game mới tuân thủ `data-shell-region` tự nhận hành vi, không cần CSS theo ID game.
- [ ] Landscape compact chỉ hiển thị thanh HUD xanh, frame và board; tên/progress/milestones không chiếm không gian.
- [ ] Toàn bộ nội dung tương tác hiện có bên trong thanh HUD vẫn còn và hoạt động.
- [ ] Thanh HUD rộng đúng 90% baseline, không dùng transform scale.
- [ ] Không overflow, overlap hoặc mất vùng chạm ở các viewport bắt buộc.
- [ ] Xoay ngang/dọc không mất state và không rebuild board.
- [ ] Popup menu/tools nằm trong visual viewport và safe-area.
- [ ] Không mất đường thoát hợp lệ khi đang fullscreen.
- [ ] Không thêm render loop, listener/observer/RAF trùng hoặc memory leak.
- [ ] Desktop/portrait không regression.
- [ ] Build pass, check pass và toàn bộ test bắt buộc pass.
- [ ] Review độc lập xác nhận diff đúng phạm vi và các số đo lifecycle/performance đạt yêu cầu.

## Do not do

- Không sửa riêng từng game bằng selector ID nếu shared Game Shell có thể sở hữu hành vi.
- Không dùng `transform: scale(.8)` để giả lập giảm chiều rộng.
- Không giảm font/icon/hit target 10% cùng với chiều rộng.
- Không xóa node HUD khỏi DOM hoặc tạo lại shell khi xoay.
- Không dừng timer/state update chỉ vì region đang ẩn.
- Không thêm resize listener, observer hoặc RAF mới cho mỗi game.
- Không hard-code breakpoint khác nhau giữa JS, generated token và CSS.
- Không sửa tay `styles/game-shell/tokens.css`.
- Không đổi luật game, public API, save schema, ID catalog hoặc format dữ liệu.
- Không gộp task này với dọn CSS toàn dự án, effect V2 hoặc Triple Connect.
- Không cập nhật baseline ảnh để che regression.
- Không đánh dấu hoàn thành nếu chưa kiểm tra cả hai game và đường mở rộng cho game mới.
