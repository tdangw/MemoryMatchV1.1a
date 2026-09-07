# Game Shell — Phase 1: ownership và hợp đồng

Ngày khảo sát: 2026-09-07. Commit runtime gốc: `bc44cf6538f7dc8634776c96fc5c790b9b8b5579`.
Worktree sạch trước khảo sát. Phase này chỉ thêm tài liệu và công cụ kiểm thử; không sửa HTML/CSS/JS production, luật chơi hay bản lưu.

**Trạng thái: hoàn tất Phase 1; người dùng xác nhận chơi thử ổn và cho tiếp tục Phase 2 ngày 2026-09-07.**

Thay đổi gameplay đồng thời sau lượt đo đầu đã được lưu riêng ở commit `9e162b6` (`fix: keep gameplay active through link effects`), không thuộc Phase 1. Số đo/build ở mục 6 vẫn gắn với commit runtime gốc; ảnh gửi lại sau phản hồi người dùng được chụp trên runtime mới. Không suy diễn kết quả check/build cũ cho commit mới.

Quyết định người dùng ngày 2026-09-07: game ưu tiên màn hình dọc trên mobile; khi ngang, thu gọn nút tính năng cho phù hợp. Đây là chốt hướng responsive, không phải duyệt ảnh (người dùng chưa thấy ảnh ở lượt trước). Thu gọn có thể gom vào menu công cụ; vẫn giữ đủ chức năng, vùng chạm sử dụng được và LV/timer/sao dễ đọc. Không bắt buộc kéo toolbar ngang rộng như desktop. Phase 3–5 thiết kế responsive này trong layout/HUD chung; Phase 7–8 áp dụng qua adapter của hai game.

## 1. Phạm vi file và rủi ro

File thay đổi trong phase: tài liệu này, `GAME_SHELL_PLAN.md`, `CONTEXT.md`, `ARCHITECTURE.md`, `package.json`, `tests/ui/game-shell.audit.spec.js` và số đo `tests/ui/baselines/phase1-measurements.json`.
Ảnh review nằm trong `test-results/`, bị Git bỏ qua. Chỉ thêm lệnh thủ công `npm run test:ui:audit`, không nối vào check/build.

Giữ nguyên sáu mode, preview, popup, thời gian phiên, điểm/combo/sao, Xu, mốc năng lượng, kho riêng và renderer của mỗi trò. Không có Triple Connect trong runtime/menu.
Rủi ro chính: CSS đã chồng nhiều lớp, test Easy hiện tại không chứng minh toàn bộ mode/accessibility/cleanup; ảnh hiện trạng không đồng nghĩa thiết kế đã được duyệt.

## 2. Ownership DOM và người ghi dữ liệu

Mọi node con trong từng vùng dưới đây kế thừa owner của vùng, trừ board/tile và hiệu ứng tạm được tách rõ. Icon SVG do `icons.js` tạo, không thuộc luật game.

| Vùng | Memory Match hiện tại | Link Connect hiện tại | Owner đích / thời điểm xóa bản cũ |
| --- | --- | --- | --- |
| Root và tên | `index.html`: `#game-container`, `#game-logo`; controller bật/tắt `display` | `showLinkGame()` trong `linkController.js` tạo một lần `#link-connect-container`, `#link-game-logo`, bật/tắt `hidden` | `gameShell.js`; bỏ markup Memory Phase 7, Link Phase 8 |
| Progress HUD | `#game-progress-hud`: moves, misses, combo, 3 sao, score, pairs, hint; `ui.js` cập nhật | `.link-game-progress-hud`, ID `link-*`; `updateLinkHud()` và `getLinkHudElements()` | `gameShellHud.js` Phase 5; bỏ writer/ID adapter tương ứng Phase 7–8, kiểm sạch Phase 9 |
| Menu HUD | `#game-title`, `.game-stats`: level, timer, total-stars; `ui.js` ghi | `#link-game-title`: cùng ba chỉ số; `updateLinkTimerHud()`, `updateLinkStarsHud()` | Shell cấp reference, HUD patch; controller chỉ cấp snapshot |
| Menu hành động | `#btn-actions-menu`, `#game-actions-menu`; `gameMenu.js` quản lý mở/đóng, `main.js` nối hành động | `#link-actions-menu-toggle`, `#link-actions-menu`; `configureLinkGameActions()` và callback trong controller | Shell quản lý tương tác; callback điều hướng vẫn ở adapter. Xóa listener cũ Phase 7–8 |
| Tools | `#btn-buy-time`, `#btn-preview-cards`, `#btn-hint`, `.game-quick-actions`; `main.js`, shop/kho và controller | `.link-tools-toggle`, `.link-tools-menu`, `.link-tool-list`; `useLinkItem()` | Definition/callback của từng game; Shell chỉ render nút, trạng thái, số lượng |
| Xu và mốc | `#memory-special-hud`, `#memory-game-coins`, `#memory-coin-balance`, `#memory-special-milestones`, `[data-memory-special-milestone]`; `ui.js` | `.link-special-hud`, `#link-special-coins`, `#link-coin-balance`, `[data-link-special-milestone]`; `updateLinkSpecialMilestones()` | HUD chung; luật phần thưởng ở `memorySpecial.js`/`linkController.js`, không chuyển vào Shell |
| Timer/combo trực quan | `ui.js`: `--game-timer-progress`; `logic.js` kích hoạt combo | `linkController.js`: cùng timer property, combo property riêng | `gameShellHud.js`; nguồn thời gian và timeout hết combo vẫn do game quyết định |
| Board slot | `#grid-board-frame`, tọa độ hàng/cột, `#grid-container`; `grid.js` tạo thẻ | `#link-board-frame`, `#link-board`, path overlay; `linkRenderer.js` patch `instanceId` | Shell sở hữu slot ngoài; renderer giữ toàn bộ node bên trong, đường nối và tọa độ |
| Popup/tooltip | `ui.js`, `modal.js`, `tooltips.js` gắn ngoài root, copy từ `uiCatalog.js`/game | Dùng cùng modal/tooltip; controller pause/resume riêng | Giữ dịch vụ chung; registry Phase 4/6 đăng ký cleanup, không nhân bản modal |

Layout Memory: `grid.js:updateGridLayout()` đọc boardTop/viewport, chọn cột mobile, làm tròn tile xuống pixel nguyên (giới hạn 36–180), ghi grid variables và `--board-width` cho HUD. Listener resize tồn tại ở cấp module.
Layout Link: `linkRenderer.js:updateLinkBoardLayout()` đọc kích thước root/chrome/gap/inset, làm tròn tile tới 0.001px, ghi tile size và frame width; dùng resize listener + ResizeObserver. HUD hiện có chiều rộng độc lập với board.
Cả hai sẽ nhường phép đo cho Phase 3; tọa độ và cột/mode vẫn là dữ liệu adapter. Không chuyển pathfinder, dịch chuyển, preview hoặc tạo board vào lõi chung.

## 3. Ownership CSS, xung đột và danh sách xóa

Thứ tự nạp liên quan trong `index.html`: `style.css` → `board.css` → `gameplay-ui.css` → `hud.css` → `modals.css` → `gameplay-effects.css` → `link-connect.css` → `tooltips.css` (các sheet menu/settings/shop xen giữa vẫn giữ owner riêng).

| Nhóm selector/rule | Hiện trạng / xung đột | Owner đích và thao tác xóa |
| --- | --- | --- |
| `html`, `body`, `.main-wrapper` trong `style.css` | Viewport, nền, touch, overflow dùng toàn ứng dụng | Giữ owner trang; chỉ tách phần hình học Shell, không xóa nền/menu |
| `#game-container`, `#game-logo`, `#game-title`, `.info` trong `style.css` và media queries | Rule cũ tiếp tục cascade vào HUD mới; ID specificity cao | Phase 7 bỏ rule gameplay sau chuyển Memory; giữ selector còn dùng ngoài Shell |
| `:root` content width/gap trong `gameplay-ui.css`; các fallback cùng tên trong JS/CSS | Width 700px, gap 10px lặp nhiều nguồn | `tokens.css` Phase 2; xóa fallback trùng đã chuyển sau kiểm computed style |
| `#game-logo.game-name`, `#game-title.game-hud` và descendants trong `hud.css` | Nhiều lần ghi lại stats, màu nền, font, khoảng cách: các nhóm đầu file, 574+, 633+, 697+, 769+ | `shell.css`/`hud.css` mới; bỏ cả chuỗi override cũ Phase 7, không chỉ bỏ rule cuối |
| `.game-progress-hud`, `.info`, `.stat-*`, `.star-progress__*` trong `hud.css` | Link kế thừa rồi chép lại ở `link-connect.css` 598–722; sao cần grid ưu tiên hơn flex `.info` | Component chung Phase 5; bỏ bản Memory Phase 7, bản Link Phase 8 |
| `.game-stats` trong `hud.css` | `flex-wrap: wrap` dùng chung; Memory ghi `nowrap` qua ID, Link không ghi lại. Link 320px xuống dòng | Điểm D1 cần duyệt. Cấu trúc stats thuộc HUD chung, không tạo override bí mật theo game |
| `.game-hud.has-timer-progress::after` và tone classes trong `gameplay-ui.css` | Đã dùng chung, cao 3px, `scaleX(--game-timer-progress)` | Chuyển nguyên contract sang HUD/token; bỏ nguồn cũ sau hai consumer chuyển |
| `.memory-special-hud*` và `.link-special-hud*` | Trùng thanh 260/220px, height, border, mốc và Xu; Link thêm glow/transition | HUD chung; bỏ Memory Phase 7, Link Phase 8. Glow chưa được coi là override đã duyệt |
| `.game-menu-toggle`, `.game-actions-menu`, `.game-quick-action`, `.game-hint-fab` | Shared appearance nhưng vị trí chịu override ID; Link tools có CSS riêng | Shell/HUD + tools definition; chỉ xóa CSS nút cũ khi consumer đã chuyển |
| `.link-game-name`, `.link-game-progress-hud`, `.link-game-hud` trong `link-connect.css` 587–772 và media 999+ | Bản chép shell; min-height không phải chiều cao thực do padding/card/wrap kế thừa | Phase 8 xóa sau chuyển; không xóa tile/path CSS nằm xen kẽ |
| `#grid-container` z-index trong `hud.css`, layout trong `board.css` | Ownership board bị rải sang HUD | Chuyển layer/slot tới Shell, giữ style mặt thẻ/tọa độ trong renderer CSS |
| `.link-connect-game` root, `.link-board*` trong `link-connect.css` | Root grid + safe area thuộc Shell; board insets/path layer vẫn riêng | Phase 3/8 tách root/layout; giữ tile/băng/path/canvas và animation chuyên biệt |
| `.tile-score-effect`, `.tile-combo-effect`, `.game-coin-hud.is-gaining`, loot/reward trong `gameplay-effects.css` và `link-connect.css` | Hiệu ứng dùng chung và riêng xen kẽ | Phase 6 gom preset/registry; Phase 7–8 bỏ selector hết consumer |
| Tooltip/modal/pause selectors trong `tooltips.css`, `modals.css` | Pause hiện phụ thuộc root ID (`body.game-is-paused ...`) | Phase 4 cấp root semantic; Phase 9 bỏ ID tạm khi cả hai game đã chuyển |

Các giá trị lặp cần token hóa theo nhóm, không tự động biến tất cả CSS thành schema: width 700; gap 10; breakpoint 600; HUD min-height 34/30; padding 74/104; radius 9; menu offset 6; layer 5000/6000; timer height 3; mốc 260/220, track 19, marker 15, rail 2, spacing 5%–95%; board gap 6/4, padding 8/6. Đây là inventory hiện trạng, **không phải bảng default đã duyệt**. Gameplay timing/combo/reward vẫn lấy từ config và `gameplayTuning.js`.

Không xóa nguyên `hud.css` vì còn settings/version/summary styles. Không xóa nguyên `link-connect.css` vì chứa renderer/effects. Phase 9 phải tìm người dùng bằng selector/import trước khi xóa, kiểm duplicate ID và không còn compatibility adapter.

## 4. Hợp đồng đích đã xác định về trách nhiệm

Đây là specification cho các phase sau, chưa có module runtime mới.

| Hợp đồng | Input / output và bất biến |
| --- | --- |
| Adapter | `id`, `title`, `hudDefinition`, `tools`, `layout`, formatter, action callbacks, board adapter. Lõi không import state/config game và không nhánh theo tên game |
| Mount/update/unmount | Mount tạo node một lần, trả reference vùng/target; update chỉ patch giá trị thay đổi; unmount idempotent. Không dùng `innerHTML` toàn shell khi đổi stat |
| HUD snapshot | moves, misses, combo, score, matched/total pairs, hint count, level, total stars, earned stars + fill ratio. Adapter tính điểm/mốc; HUD chỉ format/render, giữ aria-label đồng bộ |
| Timer | Snapshot thời gian, tỷ lệ, tone và trạng thái countdown/endless/preview/stopped; pause/hidden/lock do controller xác định. Một custom property transform mỗi frame, text khi giá trị giây đổi; không tạo gameplay interval thứ hai |
| Combo | Adapter cấp tỷ lệ/thời gian và active state. Hết cửa sổ do luật game, hiệu ứng không được reset combo hoặc trao thưởng |
| Mốc | Danh sách marker, progress, earned/next, tooltip copy và effect target. Vòng 10 mốc và thưởng do game; snapshot không thực thi reward |
| Xu | Giá trị chung + target bay, formatter, sự kiện trình bày tăng Xu. Persistence đã xong trước animation; hủy animation vẫn hiển thị balance mới nhất |
| Tools/menu | Definition chứa icon, label, count, visible/disabled, callback. Mobile dọc là chính; ngang cho phép gom các nút vào menu công cụ qua config, giữ đủ chức năng và vùng chạm, không chồng chỉ số. Nút thật, focus-visible, aria-expanded/controls; Escape/click ngoài đóng; tooltip chuột/focus/nhấn giữ; disabled không gọi action |
| Layout | Runtime viewport/safe area/rows/columns + config → `{ tileSize, boardWidth, boardHeight, gap, padding }`. Đo vùng một lần/frame, write sau read; cập nhật HUD không gọi board renderer |
| Board | Renderer sở hữu node thẻ và thao tác; Memory giữ node khi HUD đổi, Link giữ `instanceId`. Slot không biết ghép cặp/băng/dịch chuyển |
| Effects | Game cấp source/target/type/amount/preset; registry hủy timeout/RAF/WAAPI/node tạm. Reduced motion vẫn hoàn tất biểu diễn kết quả; không gọi luật thưởng từ callback animation |

Override có lý do sản phẩm: title; danh sách/cách dùng tools riêng; preview ở ô timer của Memory; hàng/cột theo game/mode; tọa độ Memory; route inset/path layer/FLIP của Link. Chỉ chấp nhận các khác biệt này qua definition/adapter có tên. Chưa có override được duyệt cho HUD xuống dòng, chiều cao card, width toolbar, glow hoặc title landscape.

## 5. Lifecycle hiện tại và kế hoạch chuyển owner

| Resource | Owner hiện tại | Quyết định |
| --- | --- | --- |
| Gameplay interval, checkpoint, hidden/pagehide | `gameController.js`, `linkController.js` | Giữ controller/session timing. Shell nhận pause/resume và round token, không nhân đôi checkpoint |
| Timer RAF, preview interval | `ui.js`; Link controller tự quản lý RAF | Chuyển presentation sang HUD/lifecycle Phase 4–5; preview completion vẫn callback có kiểm round |
| Resize listener, queued RAF, observer | `grid.js`, `linkRenderer.js` | Phase 3 gom một phép đo; Phase 4 disconnect/cancel khi unmount |
| Menu/tools listeners | `main.js`, `gameMenu.js`, `configureLinkGameActions()` | Adapter đăng ký action một lần; registry gỡ khi unmount, không gỡ listener dịch vụ toàn app |
| Tooltip press/hide timer, DOM tooltip | `tooltips.js` document/window delegation | Giữ một dịch vụ toàn app; cleanup tooltip của shell/round đang rời, không đăng ký thêm mỗi mount |
| Coin/loot nodes và animation | `coinRewards.js`, `lootEffects.js` có hàm clear riêng | Phase 6 registry chung gọi cleanup; animation chỉ phản ánh balance/state đã ghi |
| Link effect timers, tile WAAPI, canvas/path | `linkRenderer.js` có transient sets và `clearLinkTransientEffects()` | Renderer giữ hiệu ứng chuyên biệt, đăng ký chung theo round; không rebuild board |
| Popup delayed completion, score/combo nodes | `ui.js`, controller và logic có timeout rải rác | Phase 4/6 quản lý theo round; callback cũ không được sửa round mới |
| Meteor, sound, app listeners | `backgroundEffects.js`, `sound.js`, `main.js` | Owner toàn app giữ nguyên; không tính là leak theo số lần mount Shell |

Cleanup đích theo thứ tự: checkpoint controller → vô hiệu round cũ → dừng scheduler/effects/tooltip/modal thuộc round → unmount adapter → mount mới. Gọi cleanup lặp không throw. Pause do modal và hidden phải giữ nguyên lý do để không resume nhầm. Hiện chưa có bằng chứng test 20 lần chuyển game; đó là gate Phase 3–4, không suy ra từ số đếm một màn.

## 6. Số đo và phương pháp tái tạo

`npm run check`: đạt. `npm run build`: đạt khi chạy ngoài sandbox (esbuild bị chặn đọc thư mục cha trong sandbox). Bundle production: CSS 162.13 kB / gzip 30.44 kB; JS 298.47 kB / gzip 77.37 kB. Tổng CSS+JS gzip khoảng 107.81 kB; không thêm dependency runtime.

`npm run test:ui:geometry`: 8/8, chỉ Easy × 2 game × 4 viewport. Test này chỉ kiểm vùng theo trục dọc và board trong viewport, **không** kiểm parity component, mọi nút/tooltip hoặc mọi mode.

`npm run test:ui:audit`: ảnh hiện trạng có kiểm soát, không có golden update. Browser context mới, storage test riêng; seed cố định, thời gian cố định, advance đồng hồ ảo 15 giây sau chọn Easy; đợi hết popup/preview và ảnh/font decode; âm thanh/meteor tắt, reduced motion, CSS animation/transition tắt chỉ trong test. Pointer ở ngoài HUD, bỏ focus trước settle. Hai lần chụp liên tiếp phải bằng byte; chưa khẳng định ảnh portable giữa OS/browser/font khác nhau.

Ảnh/JSON mỗi run ở `test-results/game-shell.audit-*/`. JSON kiểm vào repo là số đo điều tra, không phải ngưỡng visual đã duyệt. CDP listener/node là **toàn document sau GC**, gồm phần ẩn, text/SVG; số shell là Element kể cả root, trừ toàn board subtree. Scheduler chỉ đếm đăng ký từ sau menu load, không đo timer trước instrumentation hay scheduler bên trong browser/worker. Không dùng số này để khẳng định zero leak.

| Viewport | HUD Memory W×H | HUD Link W×H | Board top Memory / Link |
| --- | --- | --- | --- |
| 1024×900 | 698×34 | 700×36 | 205.047 / 199.047 |
| 390×844 | 368×30 | 378×32 | 174.594 / 182.594 |
| 320×568 | 300×30 | 308×68 | 167.672 / 211.672 |
| 844×390 | 294×34 | 700×36 | 156.750 / 191.141 |

Shell Element (không board): Memory 119, Link 135. Board subtree: Memory 29, Link 41. Timer rail: cả hai 3px. Scheduler khi settle: 1 gameplay interval + 1 timer RAF mỗi game. Listener toàn document: Memory 96, Link 104. Chênh số node hợp lệ do tools/renderer khác nhau, không yêu cầu hai game có cùng node count.

## 7. Điểm cần duyệt trước khi đóng Phase 1

| ID | Bằng chứng | Đề xuất |
| --- | --- | --- |
| D1 | Link 320px: total stars xuống hàng hai, HUD 68px; Memory 30px. `.game-stats` kế thừa wrap; Link padding ngang 104px làm phần giữa hẹp | Coi đây là lỗi chuẩn hóa, dùng một hàng LV/timer/tổng sao trên cả hai game; không lưu 68px thành override |
| D2 | Link HUD 36/32px so với Memory 34/30px; progress mobile 31px so với 29px | Chuẩn hóa geometry component, lấy **computed style** sau duyệt; không chỉ sao chép min-height |
| D3 | Memory toolbar bám board, Link bám content width. Landscape: 294px so với 700px; Memory title thu nhỏ, Link giữ lớn; nút kho Memory chồng LV/tổng sao do toolbar quá hẹp | Đã thay theo quyết định người dùng: ưu tiên mobile dọc; ngang thu gọn/gom nút tính năng cho vừa không gian. Không bắt buộc toolbar rộng 700px; title có thể gọn để dành diện tích board |
| D4 | Link có glow mốc/combo/coin khác Memory, dù cùng cơ chế trình bày | Dùng chung style Link cho component tương đương; giữ khác biệt công cụ/board nêu ở mục 4 |

Ảnh được tạo để review hiện trạng, chưa phải ảnh chuẩn được duyệt. Hướng responsive đã chốt như D3; không hỏi lại hướng này. D1/D2/D4 là điểm cần đối chiếu khi chuẩn hóa component, chưa coi từng chi tiết style/pixel được duyệt. Ảnh gửi trực tiếp qua đường dẫn ổn định ngoài `test-results` vì thư mục test bị dọn ở lần chạy tiếp theo. Không tự sửa runtime trong phase khảo sát.


## 8. Kết luận sau chơi thử và mốc vào Phase 2

Người dùng đã chơi thử, chưa thấy nút chồng chỉ số, và yêu cầu tiếp tục Phase 2. D1–D4 ở trên là quan sát/đề xuất từ mô phỏng, không phải lỗi thiết bị thật đã xác nhận. Chốt giữ nguyên hình học và style hiện tại trong Phase 2; không tự đổi toolbar, glow hoặc ép HUD một hàng. Ưu tiên mobile dọc, thu gọn nút khi ngang ở phase layout/HUD vẫn có hiệu lực. Chỉ cần hỏi lại nếu phát sinh thay đổi trải nghiệm ngoài hướng đã chốt.

Baseline kiểm tra lại tại runtime `9e162b6`: CSS gzip 30.44 kB, JS gzip 77.57 kB (tổng 108.01 kB); check/build đạt. Phase 1 được đóng sau geometry/audit đạt. Golden visual phát hành sẽ khóa ở Phase 9; ảnh hiện trạng phục vụ so sánh bảo toàn trong các phase trung gian.
