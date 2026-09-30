# Kế hoạch active — HUD Unification Repair

Ngày lập: 2026-09-30  
Trạng thái: **Hoàn tất Gate 0–5 (2026-09-30)**

## 1. Mục tiêu

Hoàn thiện phần hợp nhất HUD của Memory Match, Link Connect và Triple Connect theo một ownership rõ ràng, không tạo regression về lifecycle hoặc gameplay. Đồng thời thiết kế lại thanh HUD theo mẫu đã duyệt: một khối ngang liền mạch, gọn và có tính hệ thống thay cho nhiều nút/ô rời rạc. Task xử lý năm nhóm nội dung đã xác nhận:

1. Hai menu HUD có thể cùng mở trong Memory Match và Link Connect.
2. CSS HUD dùng chung và CSS từng game còn chồng ownership; kiểm tra ownership hiện chưa bao phủ các file này.
3. Contract vùng `progress` của Game Shell và các test vẫn mô tả HUD cũ, trong khi runtime đã chuyển số liệu sang vùng HUD mới.
4. Adapter/controller còn giữ DOM reference và payload cho các phần tử HUD cũ đã bị xóa.
5. Thanh HUD hiện chia thành nhiều nút/ô bo riêng, tạo cảm giác rời rạc và chiếm khoảng trống; cần hợp nhất presentation nhưng giữ nguyên thông tin gameplay.

## 2. Ngoài phạm vi

- Không sửa luật game, mục tiêu sao, hiệu ứng line/xóa thẻ, asset, background hoặc điều hướng nền.
- Không đổi save schema, catalog ID, public API Game Shell hoặc dữ liệu người dùng.
- Không thêm hàng HUD thứ hai, bottom sheet, thanh cuộn ngang hoặc cơ chế ẩn chỉ số để giải quyết thiếu chỗ.
- Không thay đổi artwork, background hoặc phong cách riêng của board ngoài thanh HUD.
- Không xử lý tối ưu async controller/board startup trong task này.
- Không tạo hoặc duy trì test riêng cho viewport 320/360. Không xem việc ẩn/bị che sao ở kích thước giả lập quá nhỏ là lỗi của task này.

## 3. Baseline thiết bị và nguyên tắc responsive

- Viewport nghiệm thu hình học duy nhất: **412 × 915 CSS px, portrait**, đại diện Galaxy S22 Ultra ở chế độ trình duyệt mobile.
- Các kích thước nhỏ hơn một chút phải thích nghi bằng CSS fluid hiện có, nhưng không nhân thêm profile Playwright riêng nếu không có lỗi thực tế được tái hiện trên thiết bị mục tiêu.
- Test logic, lifecycle và accessibility không phụ thuộc viewport; chỉ test geometry/overflow/hit target dùng 412 × 915.
- Không thay đổi giao diện chỉ để làm pass một viewport không còn thuộc thiết bị mục tiêu.
- Thanh HUD phải giữ một hàng duy nhất và tự co giãn bằng grid/token; không wrap sang hàng mới.

## 4. Invariant phải giữ

- Mỗi game có đúng một HUD và tối đa một menu HUD đang mở.
- `aria-expanded`, trạng thái class và visibility luôn đồng bộ; Escape, click ngoài và đổi game đóng đúng menu.
- Mount/unmount/restart không nhân listener, timer, observer hoặc node.
- Cập nhật HUD không rebuild board và không ghi persistence thêm.
- Game Shell tiếp tục trả đủ sáu semantic region để giữ tương thích; vùng `progress` trở thành placeholder tương thích được định nghĩa rõ, không phải owner của số liệu HUD.
- CSS dùng chung chỉ có một owner; CSS từng game chỉ giữ theme, trạng thái và khác biệt có ngữ nghĩa.
- Mọi metric gameplay hiện có vẫn đọc được; thay đổi chỉ tổ chức lại presentation, không bỏ dữ liệu để tạo khoảng trống.

## 5. Các phương án đã cân nhắc

### 5.1. Điều phối menu

**Phương án chọn:** tạo một owner dùng chung trong Game Shell, nhận hai trigger/panel và lifecycle scope. Owner quản lý open/close, mutual exclusion, Escape, click ngoài, ARIA và cleanup; cả ba game dùng cùng contract qua adapter nhỏ.

- Ưu điểm: một state machine, không sao chép listener, dễ soak lifecycle và giữ hành vi ba game đồng nhất.
- Failure mode cần chặn: callback cũ tác động shell mới; xử lý bằng scope/generation hiện có và cleanup idempotent.

**Phương án loại:** vá riêng `gameMenu.js`, `linkShell.js` và `tripleShell.js`. Diff ban đầu nhỏ hơn nhưng duy trì ba state machine giống nhau, dễ tiếp tục lệch ARIA/cleanup.

### 5.2. Contract vùng `progress`

**Phương án chọn:** giữ `progress` trong sáu region công khai để không phá API, nhưng định nghĩa chính thức đây là placeholder ẩn/không chứa metric sau khi HUD thống nhất. Test số liệu chuyển sang `refs.hud`; test contract xác nhận placeholder tồn tại, rỗng và ẩn.

**Phương án loại:** xóa `progress` khỏi `regionNames`. Cách này sạch hơn về DOM nhưng là thay đổi public API, buộc migration caller/test không cần thiết cho task sửa lỗi.

### 5.3. Ownership CSS

**Phương án chọn:** `styles/game-shell/hud-unified.css` sở hữu geometry và layout HUD dùng chung; file CSS từng game chỉ sở hữu palette, trạng thái, pseudo-element và biến thể thực sự khác nhau. Mở rộng static check để kiểm tra các owner này.

**Phương án loại:** bỏ file unified và tiếp tục ba bản layout riêng. Cách này tránh refactor trước mắt nhưng giữ nguyên drift và trùng lặp là nguyên nhân gốc.

### 5.4. Thiết kế thanh HUD một hàng liền mạch

**Phương án chọn:** dùng một surface ngang duy nhất cho toàn bộ HUD. Chỉ khung ngoài được bo góc; nút menu ở đầu trái, nhóm metric ở giữa và nút công cụ ở đầu phải là các cell cùng một grid. Các cell không có nền pill/khung bo riêng mà chỉ phân cách bằng đường dọc mảnh.

- Nhãn: chữ in hoa, màu vàng/gold dùng chung để tương phản với nền xanh.
- Giá trị: trắng hoặc gần trắng, trọng lượng chữ cao hơn nhãn.
- Nền: xanh navy bán trong suốt/đậm thống nhất với game; không tạo nhiều lớp card lồng nhau.
- Hình học: menu và công cụ là hai cell tương tác ở hai đầu; cell thời gian được ưu tiên rộng hơn, các metric còn lại dùng `minmax(0, …)` và typography `clamp()` để co giãn.
- Trạng thái focus/pressed/selected dùng outline hoặc tint nhẹ trong cùng cell, không biến cell trở lại thành nút nổi rời rạc.
- Game adapter được phép thay nhãn/metric theo luật từng game, nhưng thứ tự, spacing, màu và cấu trúc thanh do shared HUD sở hữu.

**Phương án loại:** HUD hai tầng hoặc giữ từng metric thành pill/nút riêng. Hai tầng làm tăng số lớp phía trên board; các pill riêng tiếp tục gây rời rạc và lãng phí khoảng trống như giao diện hiện tại.

## 6. Gate triển khai

### Gate 0 — Chốt baseline và inventory

1. Ghi trạng thái/diff trước khi sửa; nhận diện thay đổi HUD có sẵn của người dùng/agent khác.
2. Lập bảng owner cho selector/property giữa:
   - `styles/game-shell/hud-unified.css`
   - `styles/hud.css`
   - `styles/link-connect.css`
   - `styles/triple-connect.css`
3. Liệt kê trigger, panel, listener và cleanup path của hai menu trong cả ba game.
4. Liệt kê toàn bộ caller của `refs.progress`, các DOM ID cũ và payload metric cũ.
5. Chụp baseline 412 × 915 cho ba game và ghi số listener/node liên quan HUD.

**Pass khi:** có owner map, call-site map và baseline tái lập được; chưa sửa hành vi.

### Gate 1 — Một owner cho hai menu HUD

1. Định nghĩa helper/controller dùng chung trong Game Shell với API nhỏ, không biết game cụ thể.
2. Chuyển Memory Match, Link Connect và Triple Connect sang adapter của owner này.
3. Bảo đảm hành vi:
   - mở menu A tự đóng menu B;
   - bấm lại trigger đóng menu hiện tại;
   - Escape/click ngoài đóng menu;
   - `aria-expanded` và class trạng thái cập nhật atomically;
   - unmount/restart/game switch cleanup đầy đủ.
4. Không dùng timeout hoặc cờ rời rạc để che race.

**Pass khi:** contract test ba game đạt và 20 chu kỳ mount/restart/switch không tăng listener hoặc giữ panel detached.

### Gate 2 — Đồng bộ Game Shell DOM contract và test

1. Tài liệu hóa `progress` là region tương thích ẩn; metric thật do `refs.hud` sở hữu.
2. Giữ nguyên danh sách sáu region và public ref.
3. Cập nhật test HUD/geometry/layout/chrome đang tìm metric trong vùng cũ để truy vấn owner mới.
4. Thêm assertion rằng `progress` tồn tại nhưng rỗng/ẩn, tránh code mới vô tình dùng lại hai nguồn metric.
5. Không nới assertion gameplay chỉ để test pass.

**Pass khi:** code, contract và test mô tả cùng một DOM; không còn test yêu cầu `progress` hiển thị.

### Gate 3 — Xóa reference và đường cập nhật HUD đã chết

1. Xóa các ID/ref cũ như hint, matched/total pairs và matched/total triples khỏi shell adapter khi node không còn tồn tại.
2. Thu hẹp payload cập nhật HUD ở controller về các metric còn sống; giữ item/tool state đang được dùng.
3. Kiểm tra không có query DOM lặp hoặc optional guard chỉ để che node bắt buộc bị thiếu.
4. Giữ gameplay state làm nguồn sự thật; chỉ loại bỏ presentation work không còn consumer.

**Pass khi:** tìm kiếm symbol/ID cũ không còn call site runtime, HUD vẫn cập nhật đúng và board không rerender do patch HUD.

### Gate 4 — Chốt CSS ownership và static guard

1. Chuyển shared geometry/layout sang `hud-unified.css` theo owner map.
2. Chuyển HUD sang một grid ngang liền mạch: một outer surface, không gap giữa cell, không nền/bo góc riêng cho từng metric.
3. Tạo token chung cho nền navy, nhãn vàng, giá trị trắng, divider, chiều cao, outer radius và spacing; CSS từng game chỉ override khi có lý do theme rõ ràng.
4. Phân bổ cell theo nội dung: hai nút đầu/cuối giữ hit target phù hợp; thời gian rộng hơn; label/value co giãn bằng `clamp()` mà không wrap hoặc ellipsis sai nghĩa.
5. Xóa đúng các declaration trùng/chồng khỏi CSS từng game; giữ modifier/theme có ngữ nghĩa riêng.
6. Dùng token chung cho khoảng cách milestone/HUD nếu cùng contract; không phục hồi magic number cũ.
7. Mở rộng `check-css-ownership` để đọc đủ bốn file HUD và fail khi một base selector/property có nhiều owner trái contract.
8. Cập nhật contract milestone cũ đang hard-code khoảng cách `-6px` để kiểm tra owner/token hiện hành và tính nhất quán ba game, không ép quay lại hình ảnh cũ.
9. Kiểm tra cascade, specificity, safe-area, focus và reduced-motion trong phạm vi selector bị chạm.

**Pass khi:** shared base property có đúng một owner, per-game CSS không cần thứ tự load ngẫu nhiên và static check bắt được một fixture xung đột có chủ đích.

### Gate 5 — Regression, đo và review độc lập

1. Chạy static JavaScript/CSS checks và contract test mục tiêu sau mỗi owner thay đổi.
2. Chạy Playwright mục tiêu cho:
   - menu mutual exclusion, Escape, click ngoài và ARIA;
   - HUD metric/tooltip/milestone của ba game;
   - thanh HUD luôn một hàng, các cell liền mạch và nhãn vàng/giá trị trắng đúng token;
   - restart, replay, đổi game và thao tác nhanh;
   - không rebuild board khi chỉ cập nhật HUD;
   - geometry, overflow và hit target ở **412 × 915 portrait**.
3. Soak tối thiểu 20 chu kỳ mount/unmount/restart/game switch và so sánh listener/node với baseline.
4. So sánh số node, style/layout work và long task HUD trước/sau; không chấp nhận regression có ý nghĩa trong đường cập nhật nóng.
5. Chạy `npm run check` và `npm run build` ở gate cuối.
6. Review diff độc lập với acceptance criteria, loại debug/code chết/thay đổi ngoài phạm vi.

**Pass khi:** toàn bộ kiểm tra kết thúc thành công; không dùng kết quả viewport 320/360 làm gate hoặc bằng chứng lỗi.

## 7. Phạm vi file dự kiến

- Shared owner: `js/gameShell/` và test contract tương ứng.
- Adapter/shell: `js/gameMenu.js`, `js/memoryMatch/memoryShell*.js`, `js/linkConnect/linkShell.js`, `js/tripleConnect/tripleShell.js` và controller call site trực tiếp nếu có payload chết.
- CSS: `styles/game-shell/hud-unified.css`, `styles/hud.css`, `styles/link-connect.css`, `styles/triple-connect.css`.
- Static checks/tests: `scripts/check-css-ownership.mjs`, contract milestone liên quan và các spec HUD/Game Shell hiện có.

Không format hàng loạt và không sửa file ngoài danh sách nếu dependency/test không chứng minh là cần thiết.

## 8. Acceptance criteria cuối

- Memory Match, Link Connect và Triple Connect chỉ có tối đa một menu HUD mở; ARIA và cleanup đúng.
- Shared HUD geometry có một owner; CSS riêng game không lặp/chồng base property.
- `hud-unified.css` là file owner cần thiết, không phải lớp override vá lỗi tải cuối.
- Thanh HUD là một surface một hàng: không pill rời cho từng metric, không hàng thứ hai, không wrap và không cuộn ngang.
- Menu và công cụ được tích hợp vào hai đầu thanh; metric phân cách bằng divider mảnh; nhãn vàng và giá trị trắng giữ độ tương phản tốt trên nền xanh.
- Contract `progress`/`hud` rõ ràng, giữ public API và mọi test dùng đúng owner.
- Không còn DOM ref/payload update cho phần tử HUD đã xóa.
- Ở 412 × 915 portrait: không overflow ngang, không che hit target/menu/milestone và giao diện giữ đúng bản đã nghiệm thu.
- 20 chu kỳ lifecycle không tăng listener/node/resource.
- `npm run check`, `npm run build` và suite mục tiêu pass.
- Không thay đổi save schema, catalog ID, luật game, effect runtime hoặc public Game Shell API.

## 9. Ranh giới rollback

- Mỗi gate là một diff review riêng: menu owner → DOM contract → dead refs → CSS ownership → regression.
- Nếu một gate gây regression, chỉ hoàn nguyên phần gate đó; không phục hồi CSS/HUD cũ hàng loạt.
- Không đánh dấu hoàn tất nếu thiếu baseline/final evidence hoặc còn test bị skip không có lý do.

## 10. Kết quả triển khai và bằng chứng

### Inventory Gate 0

Working tree đã có thay đổi HUD/board/background/effect và tài liệu trước task. Đã ghi `git status` và lưu diff ban đầu; không reset, commit hay sửa các thay đổi effect/background/board của người dùng. Mục tiêu trong yêu cầu trực tiếp và CONTEXT được dùng để giải quyết dòng “không có kế hoạch active” đã cũ trong AGENTS.

| Owner | Trước sửa | Sau sửa |
| --- | --- | --- |
| `hud-unified.css` | Geometry 30/34px override ba bản HUD, stats group/grid, combo rail, star crest | Một surface/grid, controls 44px, mọi base geometry/typography/palette/divider/panel, token spacing milestone, star crest và reduced-motion |
| `hud.css` | Nhiều lớp base HUD/menu/stats/progress, mobile/landscape overrides | Memory milestone, trạng thái preview và nội dung công cụ; icon/settings có sẵn được giữ |
| `link-connect.css` | Base HUD/stats/tools/progress lặp shared geometry | Freeze state, milestone/coin và item layout riêng Link; board/effect giữ nguyên |
| `triple-connect.css` | Base HUD/stats/tools/progress lặp shared geometry | Milestone/coin và item layout riêng Triple; board/tray giữ nguyên |
| `style.css`, `modals.css` | `#game-title`, `#game-title span`, `.game-stats .info` chồng display/font/layout | Chỉ gỡ các selector gây xung đột đã chứng minh bằng test; settings/global styles khác giữ nguyên |

| Game | Trigger → panel | Listener/cleanup trước | Sau |
| --- | --- | --- | --- |
| Memory | `btn-actions-menu` → `game-actions-menu`; `memory-tools-toggle` → `memory-tools-menu` | 6 listener app-global trong gameMenu, không theo mount; mutual exclusion một chiều | 6 listener menu theo scope mount, cleanup idempotent, adapter giữ API close |
| Link | `link-actions-menu-toggle` → `link-actions-menu`; `link-tools-toggle` → `link-tools-menu` | Toggle/actions/document click theo scope, thiếu Escape; controller tự sửa hidden/ARIA khi dùng item | Shared owner, adapter action/item riêng; mọi đường đóng menu đi qua owner |
| Triple | `triple-actions-menu-toggle` → `triple-actions-menu`; `triple-tools-toggle` → `triple-tools-menu` | State toggle/document/Escape/cleanup riêng controller | Shared owner, navigation/action và item semantics giữ trong controller |

Call-site map: test HUD tìm `.stat-moves` qua `refs.progress`, tooltip Memory và sao Triple tìm trong progress, layout tìm class progress cũ. Đã chuyển metric sang HUD, sao sang milestone và query placeholder bằng `data-shell-region`; contract xác nhận progress rỗng/ẩn. `memoryShell`, `linkShell`, `tripleShell` còn ref hint/pair/triple chết; payload từ `ui`, Memory controller/logic, Link controller và Triple controller đã được thu hẹp. Không xóa matched/total state dùng bởi luật game, session, mục tiêu sao hoặc summary. Hint Memory tiếp tục cập nhật inventory qua công cụ.

### Gate và kiểm tra

- Gate 0: ảnh và phép đo trước sửa cho cả ba game tại 412×915; scope listener baseline 3/8/15, node HUD 79/91/74. Memory còn 6 menu listener app-global nằm ngoài số scope này.
- Gate 1: contract menu ba game pass; 20 chu kỳ mỗi game, mỗi chu kỳ có mount/restart/switch. Node HUD giữ 79/91/74; listener scope mới ổn định 9/11/17; mọi resource trong scope đã dispose về 0. Listener menu Memory đã chuyển từ app-global về scope.
- Gate 2: sáu public region/ref giữ nguyên; progress luôn ẩn, `aria-hidden=true`, rỗng; metric/tooltip test dùng owner hiện hành.
- Gate 3: static search và contract guard không còn dead ref/payload hint/pair/triple; HUD patch skip repeated writes và không đổi board node.
- Gate 4: geometry/presentation pass cả ba game; 9 cell cùng một hàng và tiếp giáp, nút hai đầu 44×44, metric không có pill riêng, label gold/value white, timer rộng hơn; giá trị lớn vẫn vừa cell. Test chuyển shared stylesheet lên trước CSS game vẫn pass. Static guard kiểm tra đủ bốn owner và bốn negative fixtures, gồm cả nhóm base/state trộn nhau.
- Gate 5: lượt regression hoàn chỉnh **60/60 pass**, không skip; review sau implementation đọc lại diff và chạy lại menu **5/5 pass**, gồm test bổ sung owner cũ không đóng panel của mount mới. Suite lifecycle còn xác nhận 100 switch, CDP listener/node/heap sau các batch Memory/Link và restart giữa preview/loot/modal. `npm run check`, `npm run build`, `git diff --check` pass. Không có debug, timer mới, RAF mới, asset tạm, persistence write hoặc schema/API/effect ID thay đổi trong task.

Lệnh regression: `GAME_SHELL_TEST_PORT=4278 npx playwright test tests/ui/hud-repair.presentation.spec.js tests/ui/hud-repair.menus.spec.js tests/ui/hud-repair.probe.spec.js tests/ui/game-shell.hud.spec.js tests/ui/game-shell.geometry.spec.js tests/ui/game-shell.layout.spec.js tests/ui/game-shell.lifecycle.spec.js tests/ui/game-shell.cleanup.spec.js tests/ui/game-shell.link.spec.js tests/ui/game-shell.memory.spec.js tests/ui/game-shell.presentation.spec.js tests/ui/triple-connect.chrome.spec.js --config=playwright.hud.config.js` (biến môi trường được đặt bằng PowerShell khi chạy).

### Phép đo trước/sau

Scenario: Chrome headless development, 412×915, reduced-motion, Easy, 30 batch × 100 HUD moves patch; mỗi batch nhường một frame. Không dùng kết quả này để tuyên bố 60 FPS trên thiết bị thật.

| Game | Node trước/sau | JS patch tổng trước/sau (ms) | Layout tổng trước/sau (ms) | Style tổng trước/sau (ms) | Layout count trước/sau |
| --- | --- | --- | --- | --- | --- |
| Memory | 79 / 79 | 9.00 / 10.60 | 18.76 / 22.52 | 1.18 / 1.19 | 29 / 29 |
| Link | 91 / 91 | 7.60 / 10.90 | 8.21 / 12.96 | 0.96 / 1.32 | 29 / 29 |
| Triple | 74 / 74 | 7.70 / 7.80 | 10.06 / 13.04 | 2.09 / 1.92 | 29 / 29 |

Không có long task ở cả hai lần đo; board mutation 0 và node board giữ identity. Style count từ 30/29/30 thành 29/29/29. Sai khác layout tương đương dưới 0,17ms mỗi batch/frame và JS dưới 0,12ms mỗi 100 patch; không tăng số lượt work. Đây là phép đo workstation có nhiễu, không phải benchmark thống kê hoặc số đo Android/Galaxy thật. Ảnh final được đọc trực quan riêng sau test: không có wrap/overflow, menu tích hợp hai đầu, metric/milestone/star không che nhau.

Bằng chứng được lưu ngoài bundle tại `C:/Users/Dang/.codex/visualizations/2026/09/30/01a0f23c-aaeb-7013-aa75-43d7fed869e7/hud-repair/`: `initial-worktree.diff`, ảnh và `measurements.json` trong `hud-repair-baseline/` và `hud-repair-final/`.

Giới hạn: QA trên Chrome giả lập, chưa chạy thiết bị Galaxy thật. Khi chạy fixture navigation ở no-preference đã gặp chuyển cảnh background có sẵn không phát `transitionend`; background thuộc ngoài phạm vi và giữ nguyên. Các test lifecycle/effect chờ menu ở reduced-motion rồi bật lại no-preference trước scenario cần kiểm tra; menu HUD được kiểm tra ở cả hai chế độ motion. Không đánh dấu lỗi background là đã sửa. Review là một bước riêng sau implementation trong cùng phiên, không có reviewer bên ngoài hoặc agent phụ.
