# TASK

## Goal

Đưa toàn bộ baseline kỹ thuật hiện tại của Memory Match và Link Connect về trạng thái ổn định trước khi triển khai Triple Connect:

- `npm run check` hoàn tất không lỗi.
- Toàn bộ lifecycle của Game Shell đúng khi mount, unmount, restart và chuyển qua lại giữa hai game.
- Không còn timer, interval, RAF, animation, listener, modal, effect node hoặc DOM rời thuộc round cũ.
- Không tăng số lần ghi persistence/Firebase Hosting workflow và không thay đổi dữ liệu người chơi.
- Thiết lập số đo hiệu suất, DOM và heap có thể dùng làm mốc so sánh khi thêm game thứ ba.

Task này chỉ sửa ba nhóm lỗi baseline đã quan sát được:

1. Contract CSS khoảng cách Game Shell của Memory Match.
2. `shell.update()` không cập nhật `data-shell-paused` trong chuỗi mount/unmount.
3. `shell.scope` có thể là `null` hoặc không còn active khi test restart một round đang hiển thị.

## Problem

### 1. Static check CSS đang thất bại

`scripts/check-memory-special.mjs` yêu cầu `#game-container` khai báo trực tiếp `gap: var(--shell-layout-gap)`, nhưng `style.css` không còn khai báo này. Token vẫn tồn tại trong `styles/game-shell/tokens.css` và Link Connect vẫn dùng token chung.

Nguyên nhân dự kiến:

- CSS Memory đã được chuyển một phần sang token `--shell-active-frame-gap`, nhưng static contract chưa được cập nhật đồng bộ; hoặc
- khai báo `gap` của root Memory bị mất trong một lần hợp nhất CSS.

Cần xác minh computed style và ý định layout trước khi chọn sửa CSS hay sửa contract. Không được chỉ đổi regex để bỏ qua lỗi.

### 2. Lifecycle test mất trạng thái pause

Trong test lặp 20 lần, `shell.update({ paused: true })` đôi lúc không tạo `root.dataset.shellPaused`. `createGameShell.update()` hiện bỏ qua cập nhật nếu `scope` không active, vì vậy biểu hiện này cho thấy shell được chọn theo `document.documentElement.dataset.activeGame` không sở hữu một scope active tại thời điểm root của nó vẫn đang hiển thị.

Nguyên nhân dự kiến cần kiểm chứng:

- trạng thái `activeShell`, `activeScope`, `shell.scope` và `data-active-game` lệch nhau trong một nhánh mount/unmount;
- một cleanup bất đồng bộ hoặc lời gọi mount khác đã dispose scope của shell hiện tại;
- test chỉ đợi board hiển thị nhưng chưa đợi điều kiện lifecycle active, làm lộ race giữa intro overlay/start flow và assertion;
- contract của `update()` đang che lỗi ownership bằng cách silently return thay vì phát hiện shell hiển thị nhưng scope chết.

### 3. Restart test gặp `shell.scope === null`

Sau khi bắt đầu game và tiến đồng hồ ảo, test restart đọc `previous.diagnostics()` nhưng `previous` là `null`, dù trang vẫn hiển thị board Memory Match. Đây là vi phạm invariant: một Game Shell đang hiển thị phải có đúng một scope active và scope đó phải trùng `getActiveGameScope()`.

Nguyên nhân dự kiến cần kiểm chứng:

- helper test xác định game/shell chưa đủ chặt;
- luồng intro hoặc clock ảo kết thúc ở thời điểm không ổn định;
- shell instance/root hiển thị bị lệch với controller sở hữu round;
- mount/unmount hiện không kiểm tra hoặc không công bố invariant active shell/scope.

### 4. Nguy cơ rò rỉ/rác

Lifecycle chung quản lý timer, interval, RAF, animation và listener qua scope; effect/modal lại có lifecycle con. Nếu ownership lệch, callback cũ có thể chạy vào round mới, node hiệu ứng có thể bị giữ lại, hoặc active scope bị thay thế ngoài ý muốn. Đây là rủi ro trực tiếp khi thêm game thứ ba.

## Files to inspect

- `js/gameShell/gameShell.js`
- `js/gameShell/gameShellLifecycle.js`
- `js/gameShell/gameShellEffects.js`
- `js/gameShell/gameFullscreen.js`
- `js/gameController.js`
- `js/linkConnect/linkController.js`
- `js/memoryMatch/memoryShell.js`
- `js/memoryMatch/memoryShellDom.js`
- `js/linkConnect/linkShell.js`
- `js/gameSelector.js`
- `js/ui.js`
- `js/modal.js`
- `js/lootEffects.js`
- `js/coinRewards.js`
- `js/tooltips.js`
- `style.css`
- `styles/link-connect.css`
- `styles/game-shell/tokens.css`
- `scripts/generate-game-shell-tokens.mjs`
- `scripts/check-memory-special.mjs`
- `scripts/check-game-shell-lifecycle.mjs`
- `tests/ui/game-shell.lifecycle.spec.js`
- `tests/ui/game-shell.cleanup.spec.js`
- `tests/ui/game-shell.effects.spec.js`
- `tests/ui/game-shell.audit.spec.js`
- `tests/ui/game-shell.layout.spec.js`
- `tests/ui/game-shell.presentation.spec.js`
- `tests/ui/challenge-fullscreen.spec.js`
- `playwright.config.js`

## Required changes

1. **Tạo reproducer xác định cho từng lỗi trước khi sửa.**
   - Ghi lại game ID, root ID, `root.hidden`, computed display, `activeShell`, `shell.scope`, `getActiveGameScope()` và diagnostics tại các mốc mount/start/intro complete/restart/unmount.
   - Dùng seed cố định và clock ảo như test hiện tại.
   - Xác định lỗi nằm ở production lifecycle hay điều kiện chờ của test; không phỏng đoán từ một lần chạy.

2. **Khôi phục contract CSS Memory theo nguồn dữ liệu duy nhất.**
   - Xác minh khoảng cách mong muốn giữa các vùng shell bằng computed style ở bốn viewport.
   - Nếu root Memory phải sở hữu gap, thêm `gap: var(--shell-layout-gap)` vào đúng selector `#game-container` và tránh khai báo trùng.
   - Nếu `--shell-active-frame-gap` mới là contract chính thức, cập nhật generator/tài liệu/check cùng lúc và kiểm chứng cả Memory lẫn Link dùng cùng nguồn token.
   - Không sửa trực tiếp `styles/game-shell/tokens.css` nếu file này được sinh; sửa nguồn generator rồi chạy `npm run shell:sync`.

3. **Thiết lập invariant một shell hiển thị = một scope active.**
   - Sau `shell.mount()`, `shell.scope` phải tồn tại, `shell.scope.active === true` và trùng `getActiveGameScope()`.
   - Sau `shell.unmount()`, scope cũ phải inactive, mọi diagnostics resource bằng 0 và `getActiveGameScope()` phải là `null` hoặc scope của shell mới.
   - Khi mount shell mới, dispose shell cũ đúng một lần trước khi kích hoạt scope mới.
   - Không tạo DOM shell mới mỗi round; giữ ổn định `shell.refs` và board root.

4. **Làm rõ và siết ownership giữa `activeShell` và `activeScope`.**
   - Không cho phép hai biến toàn cục trỏ tới hai vòng đời khác nhau.
   - Cleanup của scope cũ không được xóa hoặc dispose scope mới.
   - `unmount()` phải idempotent, kể cả gọi hai lần hoặc gọi sau khi scope đã bị thay thế.
   - Nếu shell root đang hiển thị nhưng scope chết, development mode phải báo invariant rõ ràng thay vì silently bỏ qua `update()`.
   - Giữ nguyên chữ ký public của `createGameShell`, `mount`, `update`, `unmount`, `activateGameScope`, `getActiveGameScope` và các helper scheduler.

5. **Sửa luồng Memory restart theo thứ tự lifecycle an toàn.**
   - Scope cũ phải được dispose trước khi round mới đăng ký timer/listener.
   - Snapshot cần lưu phải được chụp trước khi state bị reset/invalidate.
   - `roundId` cũ phải mất hiệu lực; callback preview, reward, tooltip và modal cũ không được chạy vào round mới.
   - Sau restart chỉ có một countdown interval và một bộ listener điều khiển game.

6. **Sửa luồng Link start/restart để không unmount/mount dư.**
   - Rà soát việc `startLinkLevel()` gọi `unmountActiveGameShell()` trước khi `showLinkGame()` lại mount shell.
   - Bảo đảm cleanup không persist hai lần, không increment round ID hai lần và không tạo khoảng trạng thái root hiển thị nhưng scope rỗng.
   - Giữ nguyên hành vi gameplay, gravity, session timing và board hiện tại.

7. **Quản lý toàn bộ tài nguyên bất đồng bộ theo owner.**
   - Timer/interval/RAF của round phải đăng ký vào scope round.
   - Animation/effect/modal con phải được owner dispose và tự gỡ ownership khi hoàn tất.
   - Callback hoàn tất phải được guard bằng scope hoặc `roundId` thích hợp.
   - Không dùng timer toàn cục mới cho công việc thuộc gameplay.
   - Các node tạm (`level-reward-overlay`, loot, coin flight, tooltip, modal, canvas/effect) phải bị xóa khi restart, đổi game và về selector.

8. **Làm test chờ đúng trạng thái thay vì chỉ chờ board visible.**
   - Helper start phải xác nhận đúng game ID, đúng root visible, shell scope active và active scope trùng nhau.
   - Khi test timer đang chạy, đợi intro hoàn tất bằng trạng thái ứng dụng hoặc clock có kiểm soát, không dùng delay wall-clock tùy ý.
   - Test phải thất bại với thông báo invariant cụ thể nếu scope null; không che lỗi bằng optional chaining.

9. **Bổ sung diagnostics không gây overhead production.**
   - Cho phép test đọc tổng resource theo loại và identity của active scope/shell trong development/test.
   - Không log mỗi frame và không duyệt toàn DOM trong production.
   - Diagnostics không giữ strong reference tới shell/DOM đã dispose lâu hơn vòng test.

10. **Giữ nguyên persistence và public behavior.**
    - Không tăng `SAVE_SCHEMA_VERSION`.
    - Không đổi `progress.memoryMatch`, `progress.linkConnect`, session snapshot hoặc appearance format.
    - Không thêm lần ghi khi chỉ pause/update HUD/mount layout.
    - Restart/exit vẫn dùng transaction và rollback hiện có.

11. **Cập nhật tài liệu baseline sau khi tất cả test xanh.**
    - Ghi kết quả build, JS/CSS gzip, DOM counters, listener count và lifecycle diagnostics.
    - Chỉ cập nhật visual baseline nếu có thay đổi hình học được xác nhận là chủ đích; phải xem diff trước.

## Edge cases

- Gọi `mount()` hai lần liên tiếp trên cùng một shell.
- Mount Memory khi Link đang active và ngược lại.
- Gọi `unmount()` hai lần; gọi unmount sau khi scope đã được dispose.
- Restart trong lúc level intro overlay chưa kết thúc.
- Restart đúng lúc countdown interval đang tick.
- Restart trong lúc loot/coin/tooltip/modal/animation đang chạy.
- Chuyển game trong callback đóng modal hoặc callback effect hoàn tất.
- Callback của round cũ đã nằm trong queue trước khi dispose.
- `prefers-reduced-motion` bật, khiến animation hoàn tất đồng bộ hoặc không được tạo.
- Tab/app vào background rồi resume trong intro, đang chơi hoặc đang pause.
- Root visible nhưng `data-active-game` sai; `data-active-game` đúng nhưng root hidden.
- Scope active nhưng không phải scope của shell đang hiển thị.
- Timer handle đã hoàn tất rồi mới bị clear.
- Animation promise resolve/reject sau khi owner đã dispose.
- Cleanup callback ném exception; các cleanup còn lại vẫn phải chạy.
- Ảnh đang tải khi tile/node bị tháo; không giữ detached image sau network idle và GC.
- Fullscreen đang bật khi restart, đổi game hoặc về selector.
- Modal cùng ID được thay thế nhiều lần.
- Storage quota/conflict xảy ra trong cleanup persist; lifecycle mới vẫn phải mount được và state runtime không bị phá.

## Performance constraints

- Giữ mục tiêu 60 FPS; không tạo long task trên 50 ms trong start/restart/switch thông thường.
- `mount()`, `update()` và `unmount()` không duyệt toàn board hoặc dựng lại tile.
- Không tạo allocation mỗi frame cho diagnostics, cleanup registry hoặc pause state.
- Không thêm interval polling để phát hiện active shell/scope.
- Không thêm `MutationObserver` toàn trang nếu không chứng minh cần thiết; ưu tiên invariant tại điểm chuyển trạng thái.
- Mỗi round chỉ có đúng một countdown interval đang chạy.
- Sau unmount, diagnostics của scope cũ phải có 0 listener, timeout, interval, frame, animation, node và cleanup.
- Sau 20 và 100 chu kỳ mount/unmount, số node và JS event listener sau GC không vượt baseline ngoài sai số được định nghĩa trước.
- Không giữ detached DOM/image/canvas qua strong reference trong module-level Map/Set sau cleanup.
- Không tăng số lần ghi `localStorage`; không có ghi khi chỉ `shell.update({ paused })`.
- Không tạo Firebase write mới; Firebase vẫn chỉ phục vụ Hosting theo kiến trúc hiện tại.
- Thay đổi JavaScript gzip mục tiêu <= 2 kB; CSS gzip mục tiêu <= 0,5 kB cho task sửa baseline.
- Diagnostics chi tiết chỉ bật trong development/test và không log theo frame ở production.

## Tests required

- **Static/module checks**
  - `npm run check`.
  - Kiểm tra file token sinh ra không có diff ngoài thay đổi chủ đích.
  - Kiểm tra import/cú pháp toàn bộ module.

- **Lifecycle unit checks**
  - `node scripts/check-game-shell-lifecycle.mjs`.
  - Mount -> update pause -> unmount -> remount cùng shell.
  - Kích hoạt scope mới phải dispose scope cũ đúng một lần.
  - Cleanup ném lỗi không ngăn các resource khác được giải phóng.
  - Callback queued của scope chết không được chạy.

- **Playwright integration**
  - `tests/ui/game-shell.lifecycle.spec.js`.
  - `tests/ui/game-shell.cleanup.spec.js`.
  - `tests/ui/game-shell.effects.spec.js`.
  - `tests/ui/game-shell.presentation.spec.js`.
  - `tests/ui/challenge-fullscreen.spec.js`.
  - Bổ sung stress 100 vòng Memory <-> Link trong một test riêng hoặc profile riêng; kiểm scope identity, stale callback, duplicate ID, node và listener sau GC.

- **Layout/visual**
  - `tests/ui/game-shell.layout.spec.js`.
  - `tests/ui/game-shell.geometry.spec.js`.
  - `tests/ui/game-shell.audit.spec.js`.
  - `npm run test:ui:visual`; không tự động update snapshot.
  - Xác minh computed gap giữa các vùng shell bằng token chung.

- **Viewport/device cases**
  - Desktop: 1024x900.
  - Mobile: 390x844.
  - Mobile narrow: 320x568.
  - Landscape: 844x390.
  - Normal motion và reduced motion.
  - Fullscreen on/off, orientation change và safe-area giả lập.
  - Chơi thử ít nhất một Android thật sau khi test trình duyệt xanh.

- **Persistence regression**
  - `scripts/check-persistence.mjs`.
  - `scripts/check-session-timing.mjs`.
  - Defeat -> Menu giữ đúng session đã chụp.
  - Restart/exit không tăng số lần ghi ngoài checkpoint hiện hữu.
  - Quota/conflict không để shell mới ở trạng thái nửa mount.

- **Build/performance**
  - `npm run build`.
  - `npm run build:android` hoặc `npm run android:sync` ở gate phát hành phù hợp.
  - Ghi lại JS/CSS raw+gzip và so với baseline: JS 318,68 kB raw/84,77 kB gzip; CSS 163,24 kB raw/30,64 kB gzip.
  - Chrome DevTools/Playwright CDP: DOM node, JS listener và heap sau GC ở baseline, 20 vòng và 100 vòng.
  - Trace start/restart/switch để xác nhận không có long task > 50 ms và không có layout lặp bất thường.

## Acceptance criteria

- [ ] `npm run check` hoàn tất không lỗi.
- [ ] Contract CSS Memory và Link dùng cùng nguồn token; computed layout đúng ở bốn viewport.
- [ ] `shell.update({ paused: true })` luôn đặt `data-shell-paused="true"` khi shell đang active.
- [ ] Shell đang hiển thị luôn có `shell.scope` active và trùng `getActiveGameScope()`.
- [ ] Restart tạo scope mới, dispose scope cũ và giữ nguyên `shell.refs`/board root.
- [ ] Chỉ có một countdown interval sau start hoặc restart.
- [ ] Callback/timer/RAF/animation của round cũ không chạy sau restart, đổi game hoặc về selector.
- [ ] Diagnostics của scope đã dispose đều bằng 0.
- [ ] Không còn modal, tooltip, loot, coin flight, overlay, canvas hoặc effect node thuộc round cũ.
- [ ] Sau 20 và 100 chu kỳ mount/unmount, không tăng detached nodes hoặc JS listeners sau network idle và GC.
- [ ] Không có duplicate DOM ID.
- [ ] Memory Match không regression về gameplay, pause, preview, reward, defeat, continue hoặc persistence.
- [ ] Link Connect không regression về gameplay, pause, shift, effect, restart hoặc persistence.
- [ ] Dữ liệu lưu V1.1a cũ đọc/ghi không thay đổi format và không cần migration mới.
- [ ] Không tăng số lần ghi persistence trong start/restart/switch ngoài hành vi đã có.
- [ ] Tất cả test lifecycle/cleanup/effects/layout/audit/visual qua ở bốn viewport.
- [ ] Production build pass và kích thước tăng trong ngân sách.
- [ ] Start/restart/switch không có long task > 50 ms trong scenario kiểm chuẩn.
- [ ] Giữ 60 FPS trong animation gameplay chuẩn; reduced motion không tạo animation thừa.
- [ ] Android smoke test pass trên ít nhất một thiết bị thật.
- [ ] Chỉ sau khi mọi mục trên đạt mới bắt đầu Gate 1 của Triple Connect.

## Do not do

- Không triển khai hoặc nối Triple Connect trong task này.
- Không refactor selector, shop, persistence hoặc gameplay ngoài phần cần thiết để sửa lifecycle baseline.
- Không đổi public API của Game Shell/lifecycle/controller.
- Không đổi format dữ liệu, namespace, storage key hoặc `SAVE_SCHEMA_VERSION`.
- Không sửa assertion/test chỉ để chuyển đỏ thành xanh khi invariant production vẫn sai.
- Không dùng optional chaining để che `null scope` trong test.
- Không thêm delay/sleep tùy ý để né race; phải chờ trạng thái ứng dụng xác định.
- Không cập nhật visual snapshots tự động hoặc chấp nhận diff chưa xem.
- Không dựng lại board khi update pause/HUD.
- Không thêm polling interval, global timer hoặc listener không có owner.
- Không giữ DOM node đã tháo trong Map/Set/cache module-level.
- Không thêm dependency runtime mới.
- Không tạo Firebase/database write hoặc backend mới.
- Không tối ưu bằng cách tắt animation/effect ở normal motion; reduced motion phải là nhánh accessibility riêng.
- Không thay đổi luật, điểm, thời gian, phần thưởng, tồn kho hoặc giao diện người chơi ngoài sửa sai lệch gap đã được xác nhận.
