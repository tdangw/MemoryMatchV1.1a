# Kế hoạch chuẩn hóa Game Shell dùng chung

## 1. Mục tiêu và phạm vi đã chốt

Đợt này xây hạ tầng giao diện/gameplay dùng chung đủ ổn định cho **Memory Match**, **Link Connect**, **Triple Connect** và các game 4–5 trong tương lai. Chỉ chuyển hai game hiện có sang hạ tầng mới; chưa triển khai Triple Connect và không thay đổi luật, kinh tế hoặc dữ liệu người chơi.

Link Connect là mốc tham chiếu hình học ban đầu vì bố cục hiện tại gọn và ổn định hơn. Mốc tham chiếu không ngăn từng game tùy chỉnh hợp lệ qua config.

Ưu tiên được người dùng chốt ngày 2026-09-07: **mobile màn hình dọc là bố cục chính**. Khi xoay ngang, thu gọn các nút tính năng cho vừa không gian, không chồng lên chỉ số và vẫn truy cập đủ chức năng. Có thể gom nút vào menu công cụ khi cần; không ép toolbar ngang rộng như desktop hoặc thu nhỏ vùng chạm chỉ để giữ mọi nút cùng hiện. Quy tắc này đi qua cấu hình responsive chung, không đổi luật chơi.

### Ngoài phạm vi

- Không thêm gameplay Triple Connect.
- Không cân bằng lại điểm, Xu, vật phẩm, thời gian hoặc tỷ lệ thưởng.
- Không viết lại persistence, controller hoặc renderer riêng nếu chúng không cản trở hợp đồng dùng chung.
- Không thay framework và không đưa thư viện kiểm thử vào bundle production.

## 2. Nguyên tắc bắt buộc

1. **Mặc định dùng chung, khác biệt qua config:** không thêm margin, timing hoặc kích thước bí mật trong CSS/controller riêng.
2. **Dữ liệu trước, hiệu ứng sau:** UI và animation chỉ trình bày trạng thái; không quyết định phần thưởng hoặc gameplay.
3. **Không nhánh theo tên game trong lõi:** component chung nhận cấu hình/callback; luật riêng nằm trong adapter của game.
4. **DOM ổn định:** Game Shell tạo node một lần và patch phần thay đổi; board renderer không bị ép render lại toàn bàn.
5. **Không compatibility layer vĩnh viễn:** adapter tạm phải có phase xóa và test chứng minh đã hết người dùng cũ.
6. **Không chuyển phase khi gate chưa đạt:** lỗi chức năng, hiệu suất, accessibility, build hoặc tài liệu phải xử lý ngay trong phase phát sinh.
7. **Mỗi phase một commit riêng:** commit chỉ chứa phạm vi phase, worktree sạch trước khi chuyển tiếp.

## 3. Kiến trúc đích

```text
js/gameShell/
├── gameShell.js          # tạo/hủy shell và các vùng cố định
├── gameShellConfig.js    # schema, mặc định và merge override
├── gameShellHud.js       # patch chỉ số, sao, timer, Xu và mốc
├── gameShellLayout.js    # đo viewport và tính hình học board
├── gameShellEffects.js   # đăng ký target và vòng đời hiệu ứng chung
└── gameShellLifecycle.js # pause/resume/round cleanup/navigation cleanup

styles/game-shell/
├── tokens.css            # kích thước, màu, layer, motion token
├── shell.css             # cấu trúc HUD → mốc → board
├── hud.css               # component HUD dùng chung
└── responsive.css        # breakpoint/viewport/safe-area dùng chung
```

Mỗi game cung cấp adapter gồm `id`, `title`, `hudDefinition`, `tools`, `layout`, formatter, callback hành động và board adapter.

### Ba tầng cấu hình

1. `GAME_SHELL_DEFAULTS`: tiêu chuẩn chung.
2. `game.ui`: override có tên và được schema cho phép.
3. Giá trị runtime: hàng/cột, viewport, safe area và trạng thái HUD.

Override không thuộc schema phải gây lỗi trong development. Production dùng mặc định an toàn và ghi cảnh báo một lần.

## 4. Ngân sách chất lượng và hiệu suất

### Hình học

- Chênh lệch cùng component giữa hai game: tối đa 1px tại cùng viewport, trừ override đã khai báo.
- Không giao nhau giữa timer, thanh mốc và board.
- Board không vượt viewport; safe area được tính trên mobile.
- Không có nút, mốc hoặc tooltip bị cắt ở 320px chiều rộng.

### Render

- Cập nhật HUD không được gọi renderer toàn board.
- Layout read và write được gom theo frame; không xen kẽ vòng lặp đọc/ghi gây forced reflow.
- `ResizeObserver` chỉ lên lịch tối đa một lần đo trong mỗi animation frame.
- Timer chỉ ghi một custom property transform; dừng khi pause/hidden/round kết thúc.
- Tile Link tiếp tục tái sử dụng theo `instanceId`; Memory giữ node ổn định khi chỉ đổi HUD.

### Hiệu ứng

- Chỉ dùng `transform`/`opacity` cho phần tử bay hoặc dịch chuyển thông thường.
- Mọi animation, timeout và node tạm phải được đăng ký và dọn khi đổi round/game.
- `prefers-reduced-motion` có đường đi không animation nhưng vẫn cập nhật kết quả.
- Không giữ `will-change` thường trực ngoài phần tử đang animation.

### Bundle và bộ nhớ

- Sau khi di chuyển xong, tổng CSS/JS không tăng quá 5KB gzip nếu không có lý do ghi trong báo cáo phase.
- Không thêm ảnh, font hoặc dependency runtime cho Game Shell.
- Sau 20 lần chuyển game, số listener, timer và node hiệu ứng tạm phải trở về baseline.

## 5. Quy trình bắt buộc cho mọi phase

**Điều chỉnh theo yêu cầu người dùng ngày 2026-09-08:** từ Phase 5, chỉ đọc dữ liệu liên quan và kiểm thử đúng phạm vi thay đổi. Tái sử dụng baseline đã có; không lặp full suite, build hoặc audit nếu không có thay đổi/lỗi mới cần kiểm chứng. Các bước trải nghiệm trên thiết bị có thể bàn giao bằng checklist thủ công và ghi rõ gate còn chờ. Quy tắc này thay các yêu cầu chạy lặp mặc định bên dưới.

### Trước khi sửa

1. Worktree sạch; ghi commit gốc.
2. Chạy `npm run check`, `npm run build` và test UI liên quan.
3. Ghi baseline: bundle gzip, số node shell, số listener/timer đo được và hình học bốn viewport.
4. Liệt kê file sẽ sửa, hành vi phải giữ và rủi ro riêng của phase.

### Sau khi sửa

1. Review diff để tìm mã trùng, selector quá rộng, hard-code và API bị rò rỉ luật game.
2. Chạy unit/static checks, test UI hình học, test chức năng mục tiêu và production build.
3. So sánh hiệu suất với baseline; nếu vượt ngân sách thì sửa trước khi tiếp tục.
4. Kiểm tra đổi game/round trong lúc timer, tooltip hoặc animation đang hoạt động.
5. Cập nhật tài liệu đúng nguồn sở hữu; xóa code, selector, import và adapter tạm không còn dùng.
6. Commit phase; xác nhận worktree sạch.

## 6. Các phase triển khai

### Phase 0 — Baseline và công cụ kiểm thử

**Trạng thái: hoàn tất ngày 2026-09-07**

- Đã cài `@playwright/test` và Chromium-only; browser dùng cache chung ngoài repository.
- `npm run test:ui:geometry`: 8/8 kiểm tra đạt trên bốn viewport cho Memory Match và Link Connect.
- `npm run check` và `npm run build`: đạt; Playwright không nằm trong bundle production.
- `npm audit --omit=dev`: 0 lỗ hổng production. Còn 12 cảnh báo mức vừa chỉ trong dependency phát triển của Firebase/Capacitor; không chạy sửa tự động vì npm đề xuất thay đổi có nguy cơ breaking.
- Bước tiếp theo được theo dõi tại trạng thái Phase 1 bên dưới; chưa triển khai Triple Connect.

**Thực hiện**

- Cài `@playwright/test` và Chromium-only dưới dạng dev dependency.
- Tạo lệnh thủ công `test:ui:geometry`; không nối vào build hoặc `npm run check`.
- Cấu hình 1024×900, 390×844, 320×568 và 844×390.
- Khi đạt chỉ in kết quả ngắn; screenshot/trace chỉ giữ khi lỗi.
- Chặn service worker và dùng reduced motion để giảm nhiễu.
- Đo HUD, timer, thanh mốc, board và viewport của cả hai game.

**Gate**

- Chromium khởi chạy được trên máy hiện tại.
- Test chạy độc lập và không sửa bản lưu thật của người chơi.
- Build/check không phụ thuộc Playwright; report/cache không được commit.

**Rủi ro và xử lý**

- Ảnh/font khác hệ điều hành: chưa dùng golden screenshot ở phase này.
- Test phụ thuộc animation: chờ phần tử mục tiêu, không sleep cố định.
- Tăng dung lượng: chỉ Chromium; browser nằm ngoài repository.

### Phase 1 — Khảo sát ownership và đóng băng hành vi

**Trạng thái: hoàn tất ngày 2026-09-07, người dùng xác nhận tiếp tục Phase 2.**

- Ownership và hợp đồng: `GAME_SHELL_PHASE1.md`; số đo: `tests/ui/baselines/phase1-measurements.json`.
- Người dùng chơi thử thấy giao diện ổn, chưa thấy chồng nút. Giữ nguyên giao diện hiện tại làm baseline bảo toàn; ảnh mô phỏng không được xem là lỗi đã xác nhận trên thiết bị thật.
- Ưu tiên mobile dọc; khi ngang có thể thu gọn nút cho phù hợp ở phase layout/HUD. Không ép mở rộng toolbar hoặc đổi style trong Phase 2.
- Check, build và geometry/audit được chạy lại trên runtime `9e162b6`; không có thay đổi gameplay trong commit Phase 1.
- Ảnh kiểm soát dùng để so sánh trước/sau; golden visual phát hành vẫn thuộc Phase 9. Đã đủ gate bắt đầu Phase 2, chưa triển khai Triple Connect.
**Thực hiện**

- Lập bản đồ DOM/CSS/controller của hai shell hiện tại.
- Đánh dấu selector dùng chung, selector xung đột và giá trị trùng lặp.
- Chốt hợp đồng HUD, timer, mốc, Xu, tools, board slot và lifecycle.
- Chụp baseline có kiểm soát sau khi hình học hiện tại được duyệt.
- Ghi override hợp lệ; khác biệt không có lý do được xem là lỗi.

**Gate và rủi ro**

- Không đổi runtime trong phase này; mọi node/rule có owner và danh sách xóa cụ thể.
- Baseline không chứa dữ liệu ngẫu nhiên, nền động hoặc animation đang chạy.
- Tránh đóng băng lỗi cũ bằng cách ưu tiên geometry contract và duyệt ảnh trước.

### Phase 2 — Token và schema cấu hình chung

**Trạng thái: hoàn tất ngày 2026-09-07.**

- `js/gameShell/gameShellConfig.js` là nguồn schema/defaults/normalize/allowlist; token CSS sinh tự động, không có dependency runtime mới.
- Đã chuyển nhóm width/gap/height/radius/safe-area/layer/motion và board spacing responsive; giữ nguyên selector và hình học. Media query/thuật toán layout cũ chưa di chuyển thuộc Phase 3/7/8.
- `npm run check`, build và 20/20 UI tests đạt (geometry, audit baseline, CSS override theo root trên bốn viewport). Bundle CSS+JS gzip tăng khoảng 1.04 kB so với baseline, dưới 5 kB; bao gồm phần victory task khác commit độc lập.
- Chi tiết hợp đồng, giới hạn override hiện tại, kiểm chứng và cách chạy server test riêng: `GAME_SHELL_PHASE2.md`.
- Bước tiếp theo: Phase 3. Vẫn ưu tiên mobile dọc; chưa triển khai Triple Connect.

**Thực hiện**

- Tách token width, gap, height, radius, breakpoint, safe-area, z-index và motion.
- Tạo `gameShellConfig.js` với defaults, normalize, validation và override allowlist.
- Chuyển số dùng chung khỏi CSS/controller riêng.
- Gameplay timing vẫn thuộc `gameplayTuning.js`; không trộn luật chơi với timing trình bày.

**Gate và rủi ro**

- Test default, override hợp lệ, kiểu sai, số âm, `NaN`, key lạ và fallback production.
- Không còn bản sao của token đã chuyển; geometry không đổi quá 1px.
- Chuyển từng nhóm token và kiểm computed style trước khi xóa rule cũ.
- Không biến mọi thuộc tính CSS thành config.

### Phase 3 — Layout engine dùng chung

**Trạng thái: hoàn tất ngày 2026-09-07.**

- Hai board dùng chung phép đo/fit, adapter giữ tile và đường nối riêng. Cleanup bộ đo khi về Menu; không còn listener resize riêng của hai board.
- Check/build và 108/108 UI tests đạt; bundle CSS+JS 110.91 kB gzip, dưới ngân sách. HUD giữ baseline; sửa riêng hình học ô Link để vừa khung đã clamp. Chi tiết trong `GAME_SHELL_PHASE3.md`.
- Bước tiếp theo: Phase 4 — DOM và lifecycle. Chưa triển khai Triple Connect.

**Thực hiện**

- Một phép đo cho title → progress HUD → menu HUD → milestones → board.
- Tính board từ `boardTop`, viewport, safe area, hàng/cột, gap, padding và max width.
- Gom read/write theo `requestAnimationFrame`; dùng một `ResizeObserver` trên shell.
- Board adapter chỉ nhận `{ tileSize, boardWidth, boardHeight, gap, padding }`.

**Gate và rủi ro**

- Bốn viewport × sáu mode × bật/tắt tọa độ nếu có.
- Xoay màn hình, resize nhanh, mở/đóng modal và đổi game 20 lần.
- Không overflow, overlap, ResizeObserver loop hoặc layout thrashing; tối đa một layout/frame.
- Đo lại có giới hạn sau khi font/asset sẵn sàng; dùng `visualViewport` với fallback an toàn.

### Phase 4 — Game Shell DOM và lifecycle

**Trạng thái: hoàn tất ngày 2026-09-08.**

- Shell có semantic regions, refs ổn định và mount/update/unmount; scope sở hữu tài nguyên/callback theo round, modal có cleanup riêng. Adapter ID cũ có kiểm tra và lịch xóa ở Phase 7–8.
- 128/128 UI đạt, sau hai sửa cleanup cuối chạy lại 28/28 lifecycle/cleanup (136 trường hợp riêng biệt tổng cộng). Check/build đạt; số node/listener về baseline sau 20 lượt.
- Bundle so cùng danh sách asset gốc: 112.73 kB gzip, tăng 4.72 kB so baseline, trong ngân sách. Workspace có thêm asset thuộc công việc khác; xem cách tách số đo và báo cáo tại `GAME_SHELL_PHASE4.md`.
- Bước tiếp theo: Phase 5 — HUD component dùng chung. Chưa triển khai Triple Connect.

**Thực hiện**

- Tạo cấu trúc semantic chung và trả reference để controller không query DOM lặp lại.
- API mount/update/unmount rõ ràng; ID cũ chỉ ở adapter tương thích tạm.
- Lifecycle registry quản lý listener, timeout, animation frame, Web Animation và node tạm.
- Cleanup idempotent khi đổi game hoặc round.

**Gate và rủi ro**

- Mount/unmount 20 lần không tăng node/listener/timer.
- Đổi game khi preview, loot, coin, tooltip và modal đang chạy.
- Callback cũ không sửa DOM/state mới; gameplay callback vẫn kiểm tra `roundId`.
- Adapter ID cũ phải có test và phase xóa cụ thể.

### Phase 5 — HUD component dùng chung

**Trạng thái:** triển khai và kiểm tra tự động đạt (16/16 ca liên quan, check/build). Còn xác nhận thủ công trên điện thoại, pause/resume và nhấn giữ trước Phase 6; xem `GAME_SHELL_PHASE5.md`. Chưa triển khai Triple Connect.

**Thực hiện**

- Component hóa stats, sao, điểm, level, timer, tổng sao, Xu, tools và mốc.
- Timer/combo dùng custom property chung; cache giá trị để bỏ DOM write không đổi.
- Tooltip lấy copy từ definition/config, không phụ thuộc ID game.
- Game khai báo component nào xuất hiện và formatter riêng khi cần.

**Gate và rủi ro**

- Update một stat không thay node khác và không render board.
- Kiểm timer bốn trạng thái, pause/resume, tooltip chuột/bàn phím/nhấn giữ.
- Hình học hai game sai tối đa 1px nếu không có override.
- HUD không import state game và không trở thành controller tổng hợp.

### Phase 6 — Motion và hiệu ứng dùng chung

**Trạng thái:** đã triển khai registry/API và adapter hiệu ứng, 6 ca liên quan và build đạt. Chờ kiểm tra cảm nhận/chuyển trò/giảm chuyển động trên điện thoại trước Phase 7; xem `GAME_SHELL_PHASE6.md`.

**Thực hiện**

- Chuẩn hóa API loot, coin, score/combo, item collect, target highlight và FLIP.
- Tách quỹ đạo/timing khỏi luật thưởng; game chỉ cung cấp source, target, type và amount.
- Thêm effect registry, giới hạn đồng thời có cấu hình và cleanup thống nhất.
- Canvas chuyên biệt ở renderer riêng nhưng dùng lifecycle chung.

**Gate và rủi ro**

- Spam match/reward, đổi game giữa animation và reduced motion.
- Không node tạm tồn tại; không callback cập nhật sai game.
- DOM effect chỉ transform/opacity; kiểm tra số phần tử đồng thời và layer promotion.
- Phong cách riêng đi qua preset/strategy có schema, không copy animation.

### Phase 7 — Di chuyển Memory Match

**Trạng thái:** đã triển khai module giao diện/HUD Memory và xóa nhánh adapter legacy tương ứng. Đã sửa lỗi thiếu cấu hình canvas Link từ Phase 6; kiểm chứng và gate thủ công trong `GAME_SHELL_PHASE7.md`.

**Thực hiện**

- Memory dùng Game Shell, HUD/layout/effect adapter chung.
- Giữ controller, logic, preview, special, session và board gameplay.
- Xóa CSS/DOM/helper cũ sau khi không còn import/người dùng.

**Gate và rủi ro**

- Sáu mode; chơi mới/chơi lại/tiếp tục; reload Challenge; thắng/thua.
- Chọn/bỏ chọn, combo, sao/điểm, timer, 10 mốc, Xu và kho.
- Board mobile 4×3, bàn lớn, tọa độ, orientation và màn hình hẹp.
- Không render board khi chỉ HUD/reward đổi; geometry/visual/build đạt.

### Phase 8 — Di chuyển Link Connect

**Thực hiện**

- Link dùng Game Shell/HUD/layout/effect contracts.
- Giữ renderer `instanceId`, pathfinder, shift, băng, thẻ cao cấp và chống kẹt riêng.
- Xóa markup/CSS HUD dựng thủ công trong controller khi adapter ổn định.

**Gate và rủi ro**

- Sáu mode, board nhỏ/lớn/6 cột, level 1–28+ và mọi hướng dịch chuyển.
- Có/không đặc biệt, nhiều băng, mở băng cuối, hết nước đi, shuffle và thunder.
- Timer/combo/mốc/tooltips/coin/reward; đổi game giữa path/effect.
- Patch metrics không xấu hơn baseline; không full render ngoài tạo board mới.
- Shell chỉ cấp mount/layout, không sở hữu tile hoặc path.

### Phase 9 — Xóa tương thích tạm và khóa contract

**Thực hiện**

- Xóa selector, helper, markup, token và adapter tạm không còn người dùng.
- Kiểm import chết, duplicate ID, selector không khớp và hard-code bị cấm.
- Thêm visual snapshots ổn định cho bốn viewport; chỉ cập nhật khi có review.
- Cập nhật tài liệu và checklist “Add a game” cho Triple/game 4–5.

**Gate cuối**

- `npm run check`, geometry, visual tests và production build đạt.
- Worktree sạch; không TODO tạm, code chết hoặc compatibility layer vô chủ.
- Bundle, DOM, layout pass và cleanup đạt ngân sách.
- Chơi thử trên ít nhất một mobile thật trước khi khóa phiên bản.

## 7. Chiến lược commit và hoàn tác

1. `test: add opt-in game shell geometry checks`
   - Phase 1: `docs: map game shell ownership and capture review candidates` (ghi rõ gate còn mở nếu đang chờ duyệt).
2. `refactor: centralize game shell tokens and config`
3. `refactor: add shared game shell layout engine`
4. `refactor: add game shell lifecycle and DOM contract`
5. `refactor: share game hud components`
6. `refactor: consolidate gameplay motion effects`
7. `refactor: migrate memory match to game shell`
8. `refactor: migrate link connect to game shell`
9. `test: lock game shell contracts and visual baselines`

Nếu gate thất bại, sửa trong commit phase hiện tại hoặc hoàn tác đúng commit đó; không chồng phase sau lên lỗi chưa xử lý.

## 8. Điều kiện phải hỏi lại người dùng

Dừng phase và hỏi trước khi:

- Một khác biệt giao diện không xác định được là lỗi hay chủ ý.
- Cần đổi luật, kinh tế, dữ liệu lưu hoặc trải nghiệm người chơi.
- Baseline mới khác hình ảnh đã duyệt quá 1px ở component chuẩn.
- Cần dependency runtime, bundle vượt ngân sách hoặc đổi hỗ trợ trình duyệt.
- Phải bỏ hiệu ứng/tính năng để đạt hiệu suất.
- Test mobile thật khác mô phỏng Chromium.

## 9. Cách bắt đầu ở chat mới

Chat mới đọc theo thứ tự:

1. `CONTEXT.md`
2. `ARCHITECTURE.md`
3. `GAME_SHELL_PLAN.md`
4. `Memory Match.md` và `Link Connect.md` khi tới phase tương ứng

Sau đó bắt đầu từ phase chưa hoàn tất gần nhất, kiểm tra commit/worktree trước khi sửa và không tự động triển khai Triple Connect.
