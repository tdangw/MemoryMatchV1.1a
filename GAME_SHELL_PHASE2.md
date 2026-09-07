# Game Shell — Phase 2: token và schema cấu hình

Ngày: 2026-09-07. Phase 1: commit `7d88d60`; baseline runtime trước tách token: `9e162b6`. Trong lúc làm việc, task khác đã commit phần chiến thắng Link level 100 tại `cf7a5bb`; phần đó không thuộc Phase 2.

**Trạng thái: hoàn tất. Check/build và 20/20 UI tests đạt.**

## Phạm vi và quyết định

Giữ nguyên giao diện hiện tại theo xác nhận chơi thử của người dùng. Mobile dọc là ưu tiên; thu gọn nút khi ngang sẽ do phase layout/HUD xử lý. Không áp dụng D1–D4 như một đợt sửa giao diện; không thêm Triple Connect, không đổi điểm, thời gian, kho hoặc persistence.

Nguồn mới: `js/gameShell/gameShellConfig.js` sở hữu `GAME_SHELL_SCHEMA`, `GAME_SHELL_DEFAULTS`, `normalizeGameShellConfig()` và `getGameShellCssVariables()`. Schema chỉ chứa dữ liệu trình bày: layout, breakpoints, board spacing, HUD, mốc, safe area, layers, motion. Mảng tools/callback, rows/columns runtime, luật thưởng và gameplay timing không thuộc schema.

`scripts/generate-game-shell-tokens.mjs` sinh `styles/game-shell/tokens.css`. CSS này được commit để có thể đọc/review, nhưng không sửa bằng tay. `npm run shell:sync` tái sinh; assets sync trước dev/build cũng sinh file và không ghi lại nếu nội dung không đổi. `--check` phát hiện file sinh bị lệch. Không thêm thư viện runtime/build.

File runtime thay đổi: `index.html`, `style.css`, `styles/gameplay-ui.css`, `styles/hud.css`, `styles/link-connect.css`, `js/grid.js`; `linkController.js` chỉ thêm class token trên root. Không đổi luồng controller, renderer hoặc DOM con. File test/tooling thay đổi: generator, config checks, static assertions cũ trong `check-memory-special.mjs`, Playwright config, audit và test CSS override.

## Hợp đồng cấu hình

`normalizeGameShellConfig(game.ui)` merge từng field được phép với defaults, trả snapshot được freeze sâu. Không mutate đầu vào/defaults, không đọc DOM/state/storage. Không ép chuỗi thành số. Số không hữu hạn, số âm, chiều rộng bằng 0, layer không nguyên, nhóm/key lạ hoặc object sai dạng đều không được đưa vào cấu hình. Giá trị 0 hợp lệ cho spacing/motion.

Development mặc định theo `import.meta.env.DEV`: lỗi ném `TypeError` có đường dẫn field. Production giữ field hợp lệ, fallback field sai về giá trị an toàn và cảnh báo một lần cho mỗi đường dẫn trong vòng đời module. `narrow` không được lớn hơn `mobile`; fallback giới hạn nó để cấu hình breakpoint vẫn nhất quán. Options `development`/`warn` cho phép kiểm tra nhánh production trong Node.

`getGameShellCssVariables(game.ui)` dùng cùng validation, trả map tên `--shell-*` với đơn vị `px`, `ms`, hoặc số layer. Adapter của các phase sau áp dụng map lên root; CSS derived safe-area/board variables được tính ở `.game-shell-tokens`, tránh resolve trên `:root` làm mất override riêng.

Hiện hai game dùng **defaults**; chưa có UI cho người chơi chỉnh config. Không có compatibility namespace `--game-content-max-width`/`--game-layout-gap` còn consumer. Các board-specific variables (`--grid-*`, `--link-*`, timer progress) giữ nguyên hợp đồng renderer cho tới phase di chuyển.

## Token đã chuyển và giới hạn scope

| Nhóm | Consumer hiện tại |
| --- | --- |
| Content width, shell gap | Root Memory/Link, Link toolbar, Memory grid fallback |
| Board gap/padding thường và hẹp | Memory grid đọc defaults; Link đọc CSS responsive sinh từ cùng defaults |
| HUD min-height, padding ngang, radius, timer height/inset/offset, menu offset | CSS HUD hiện có của hai trò |
| Mốc width, mobile width, track height, marker size, rail height | CSS mốc Memory/Link |
| Layers HUD/menu | Hai bộ CSS HUD/menu |
| Motion sao/fill/mốc | CSS presentation hiện tại; không chuyển combo duration hoặc gameplay timing |
| Safe-area | Root Link giữ nguyên inset hiện có; Memory chưa đổi cách fit viewport |
| Breakpoint narrow | JS grid và media query spacing Link sinh từ defaults; mobile được grid đọc từ schema |

Media query CSS cũ cho **các nhóm chưa di chuyển** (title, font, root padding, border board, landscape rules) vẫn giữ nguyên ở file cũ. CSS custom property không dùng trực tiếp trong điều kiện media query nên media query spacing mới được generator sinh. Override breakpoint theo từng adapter và phép đo safe area chung thuộc Phase 3; serializer không tự thay các media query legacy. Không tuyên bố đã có layout engine hay mọi override được nối vào controller hiện tại.

Rủi ro kiểm soát: thay specificity/cascade có thể đổi computed style; generated CSS có thể stale; JS/CSS dễ lệch default; override root có thể rò sang game khác; media query không thể dùng `var()`. Giải pháp: giữ selector cũ, sinh token từ schema, kiểm trong Node và trình duyệt, và so geometry trực tiếp với Phase 1.

## Kiểm chứng

- `npm run check`: đạt, gồm default/override hợp lệ, type/null/array sai, âm, `NaN`, `Infinity`, key lạ/prototype keys, immutability, production fallback và cảnh báo một lần.
- `npm run build`: đạt. CSS gzip 30.94 kB, JS gzip 78.11 kB, tổng 109.05 kB; so baseline 108.01 kB, tăng khoảng 1.04 kB, dưới ngân sách 5 kB. Chênh này gồm thay đổi victory được commit độc lập trong lúc làm việc, nên là giới hạn trên cho phần tăng của riêng Phase 2.
- Geometry/audit: bốn viewport × hai trò; mỗi region x/y/width/height không lệch quá 1px; số Element shell/board phải bằng baseline. Screenshot ổn định trong cùng lượt chụp, không đóng golden release.
- Kết quả đo cuối: độ lệch hình học lớn nhất **0px**; node shell/board, listener (Memory 96 / Link 104) và scheduler (0 timeout, 1 interval, 1 RAF) giữ nguyên trên cả bốn viewport.
- Test override CSS trên bốn viewport kiểm gap responsive, radius, safe area resolve đúng root và sibling giữ defaults.
- Số listener/scheduler là số đo kiểm tra, không chứng minh gate cleanup 20 lần. Phase này không thêm listener, timeout, RAF, observer hay hiệu ứng runtime.

Một lần chạy đầu dùng server chung bị reload/dừng bởi công việc đồng thời; audit mất instrumentation và các trang sau không kết nối được. Đã thêm `GAME_SHELL_TEST_PORT` để dùng server riêng, không sửa runtime để né test. Dùng cổng riêng đồng thời với thư mục output riêng:

```powershell
$env:GAME_SHELL_TEST_PORT = '4186'
npx playwright test tests/ui/game-shell.geometry.spec.js tests/ui/game-shell.audit.spec.js tests/ui/game-shell.config.spec.js --output=playwright-report/game-shell-phase2-final
```

Các ảnh khác hash giữa hai lần chạy được kiểm tra: phần thay đổi chỉ nằm trong dải timer do thời điểm frame nội suy; không có thay đổi pixel bên ngoài vùng timer ở lần đối chiếu trước kiểm cuối. Không dùng ảnh timer làm bằng chứng thay đổi hình học.

## Bàn giao

Check/build và 20/20 UI cuối đã đạt; lưu Phase 2 bằng commit riêng. Phase tiếp theo là **Phase 3 — Layout engine dùng chung**: nhận config và runtime rows/columns/viewport, đo một lần/frame, giữ board renderer riêng. Chưa triển khai Triple Connect.
