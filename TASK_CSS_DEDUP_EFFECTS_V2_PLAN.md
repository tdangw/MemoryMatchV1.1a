# TASK

## Goal

Rà soát và tổ chức lại CSS/JavaScript bị trùng hoặc sai ownership, sau đó thiết kế lại hệ thống **hiệu ứng nối** và **hiệu ứng xóa thẻ V2** với chất lượng thị giác cao, vòng đời an toàn và hiệu suất ổn định trước khi tích hợp Triple Connect.

Phạm vi theo game:

- **Memory Match:** dọn CSS legacy, namespace animation lật/xuất hiện và feedback; không có hiệu ứng nối. Không thay đổi luật ghép cặp.
- **Link Connect:** là game đang sở hữu 21 hiệu ứng nối và 21 hiệu ứng xóa thử nghiệm; đây là đối tượng chính của việc viết lại V2.
- **Triple Connect:** chưa triển khai gameplay trong task này; chỉ định nghĩa adapter để sau này dùng chung effect ID/ownership và phát hiệu ứng trên ba thẻ trong khay.
- **Game Shell/UI chung:** sở hữu runtime lifecycle, quality tier, effect registry, token và primitive dùng chung.
- **Victory presentation:** là cảnh độc lập, không gộp vào gameplay effects; chỉ kiểm tra lại phạm vi CSS và cơ chế tải động.

Kết quả cần đạt:

- Loại bỏ xung đột cascade/keyframe và phụ thuộc CSS ngầm theo thứ tự tải.
- Gom các rule thực sự cùng trách nhiệm; tách rõ shared, Memory, Link, victory và generated source.
- Giữ nguyên effect ID, quyền sở hữu và save cũ.
- Hiệu ứng V2 dễ mở rộng bằng dữ liệu/preset, không nhét thêm nhánh vào `linkRenderer.js`.
- Không allocation theo frame, không leak timer/RAF/animation/canvas/DOM và không rebuild board.
- Giữ 60 FPS trên thiết bị mục tiêu trong lượt ghép thông thường.

## Problem

### Baseline kích thước

- 18 file CSS, khoảng **7.422 dòng / 203.860 byte** nguồn.
- 64 file JavaScript, khoảng **18.712 dòng / 583.355 byte** nguồn.
- `styles/link-connect.css`: **893 dòng / 35.052 byte**.
- `js/linkConnect/linkRenderer.js`: **966 dòng / 39.730 byte**.
- `js/linkConnect/linkController.js`: **1.338 dòng / 51.319 byte**.
- Production bundle hiện tại: JS **318,68 kB raw / 84,77 kB gzip**; CSS **163,24 kB raw / 30,64 kB gzip**.
- `themeAssetManifest.js` và `victory-flower-source.css` là nguồn sinh/template lớn; kích thước lớn không đồng nghĩa được phép gộp vào file gameplay.

### CSS trùng/xung đột đã xác nhận

1. `@keyframes pop` được định nghĩa **hai lần trong `styles/gameplay-ui.css`** với chuyển động khác nhau. Định nghĩa sau thắng toàn cục, nên `.reward-container` không chạy đúng keyframe đặt cạnh nó.
2. `@keyframes shimmer` tồn tại ở `styles/board.css` và `styles/gameplay-ui.css`, một bản animate shadow/scale, một bản animate background-position. Tên toàn cục giống nhau nhưng ý nghĩa khác nhau.
3. `@keyframes slideUp` tồn tại ở `style.css` và `styles/board.css`, một bản thoát lên trên, một bản xuất hiện từ dưới. Thứ tự tải quyết định nghĩa thực tế.
4. `fadein` được định nghĩa trong `style.css` nhưng được dùng nhiều lần trong `styles/gameplay-ui.css`, tạo phụ thuộc ngầm giữa hai file.
5. `.bonus-overlay` tồn tại trong `style.css` như popup nhỏ ở giữa màn, nhưng trong `styles/gameplay-ui.css` là overlay toàn viewport. Hai shape không tương thích.
6. Rule shop tồn tại đồng thời trong `style.css`, `styles/modals.css` và `styles/shop.css`. File tải sau đang âm thầm ghi đè file trước.
7. `.info`, HUD, quick action và modal có nhiều lớp override nối tiếp trong cùng file/khác file; một phần là responsive có chủ đích, một phần là patch tích lũy.
8. CSS đang được nạp bằng nhiều `<link>` theo thứ tự cố định. Một số behavior đúng chỉ vì file sau thắng, không phải vì selector có ownership rõ.

### JavaScript trùng và ownership chưa hợp lý

- Memory/Link có các vòng start/stop countdown, start/restart/return và HUD update tương tự nhưng không nên gộp gameplay controller; chỉ nên gom primitive lifecycle/timer thực sự giống nhau.
- Các helper nhỏ như `clamp`, `randomInteger`, `positionKey` xuất hiện ở nhiều file. Không phải mọi helper trùng tên đều đáng gom; chỉ gom khi semantics và dependency giống hệt.
- `linkRenderer.js` đang sở hữu đồng thời board patch, FLIP, tile state, SVG path, canvas exit, thunder, particle generation và cleanup.
- Effect catalog, CSS class và renderer liên kết bằng chuỗi class/ID; thiếu validation xác nhận mỗi ID có renderer/preset đầy đủ.

### Hệ hiệu ứng Link Connect hiện là bản thử nghiệm

- Catalog có 21 path và 21 exit effect, nhưng phần lớn path chỉ đổi màu/stroke/filter trên cùng một beam.
- `drawLinkPath()` xóa rồi tạo lại SVG path/glow/beam/decorations và ID ngẫu nhiên ở mỗi lượt.
- Canvas exit tạo particle object/fragment array mới cho mỗi match; mỗi frame duyệt object và thực hiện nhiều `save()/restore()`.
- Một số effect có tên khác nhưng cùng chuyển động: `blackhole` và `implode` đang dùng chung `link-tile-portal`.
- `collide` cần biết quan hệ giữa hai thẻ nhưng hiện chỉ animate từng tile gần như độc lập.
- `pixel` vừa có canvas fragment preset vừa có CSS animation, làm ownership hình ảnh khó hiểu.
- Reduced motion bỏ canvas exit nhưng chưa vô hiệu hóa toàn bộ `.link-tile.is-removing` exit animation.
- Controller tháo cặp theo delay tổng quát; renderer và gameplay timing có thể mất đồng bộ nếu từng effect V2 có nhịp khác nhau.
- Hiệu ứng path và exit chưa có quality tier; cùng mật độ filter/particle được áp dụng quá gần nhau giữa desktop và mobile.

### Điểm mất đồng bộ cần xử lý

- CSS name ↔ visual behavior: `pop`, `shimmer`, `slideUp` không đồng nhất.
- Effect ID ↔ renderer: nhiều ID thực tế chỉ là skin; `blackhole`/`implode` chưa đúng mô tả.
- Effect timing ↔ controller resolve: thời gian gameplay phụ thuộc max delay cấu hình chung thay vì timeline effect đã xác nhận.
- Reduced motion ↔ canvas/CSS: hai backend không giảm chuyển động theo cùng một chính sách.
- Catalog ↔ tests: test đang khóa cứng đúng 21/21 effect nhưng chưa kiểm mỗi effect render/cleanup đúng.
- Shared appearance ↔ Triple tương lai: save hiện có `linkPathEffect`/`linkExitEffect`; cần giữ key cũ nhưng runtime V2 phải nhận adapter target count 2 hoặc 3.
- File ownership ↔ cascade: shop/modal/HUD rule bị phân tán và đúng nhờ load order.
- Generated/source CSS ↔ editable CSS: token và victory source không được phân biệt rõ trong audit đơn giản.
- Timer freeze state ↔ CSS animation: thay đổi đang có trong worktree khởi động lại animation bằng `offsetWidth` cưỡng bức layout và dùng thời lượng CSS theo `freezeSeconds`; khi pause/background/tick bị trễ, lớp băng có thể không còn đồng bộ với state countdown.

### Cảnh báo trạng thái worktree trong lúc audit

Trong lúc lập kế hoạch, worktree xuất hiện thay đổi ngoài task này ở 10 file: `index.html`, `gameState.js`, `linkController.js`, `linkShell.js`, `persistence.js`, `settings.js`, `tooltips.js`, `link-connect.css`, `modals.css`, `tooltips.css` (khoảng 129 dòng thêm/10 dòng xóa). Các thay đổi được giữ nguyên, không bị ghi đè.

Phần Link mới thêm hiệu ứng đóng băng icon đồng hồ. Trước khi bắt đầu Gate A phải:

- chốt snapshot/commit nguồn đang đánh giá;
- chạy lại inventory và baseline sau khi các thay đổi song song kết thúc;
- thay cơ chế restart animation bằng state-driven progress hoặc WAAPI handle, tránh `void element.offsetWidth` gây forced synchronous layout;
- kiểm pause/background/reuse Freeze để đảm bảo lớp băng kết thúc đúng lúc `freezeSeconds` về 0.

## Files to inspect

- `index.html`
- `style.css`
- `styles/board.css`
- `styles/gameplay-ui.css`
- `styles/gameplay-effects.css`
- `styles/hud.css`
- `styles/modals.css`
- `styles/shop.css`
- `styles/link-connect.css`
- `styles/game-shell/tokens.css`
- `styles/game-shell/presentation.css`
- `styles/victory-flower.css`
- `styles/victory-flower-source.css`
- `styles/victory-flower-palette.css`
- `styles/victory-mobile.css`
- `js/linkConnect/linkEffects.js`
- `js/linkConnect/linkRenderer.js`
- `js/linkConnect/linkController.js`
- `js/linkConnect/linkPerformance.js`
- `js/linkConnect/linkConfig.js`
- `js/appearance.js`
- `js/gameShell/gameShellEffects.js`
- `js/gameShell/gameShellLifecycle.js`
- `js/motion.js`
- `js/logic.js`
- `js/grid.js`
- `js/ui.js`
- `js/lootEffects.js`
- `js/coinRewards.js`
- `js/victoryPresentation.web.js`
- `js/victoryPresentation.android.js`
- `scripts/check-js.mjs`
- `scripts/check-link-connect-core.mjs`
- `scripts/check-game-shell-contract.mjs`
- `tests/ui/game-shell.effects.spec.js`
- `tests/ui/game-shell.lifecycle.spec.js`
- `tests/ui/game-shell.layout.spec.js`
- `tests/ui/game-shell.audit.spec.js`
- `tests/ui/game-shell.memory.spec.js`
- `tests/ui/game-shell.link.spec.js`
- `tests/ui/visual-candidates/**`

## Required changes

### 1. Lập inventory trước khi di chuyển hoặc xóa

1. Trích danh sách selector, custom property, keyframe, class tạo từ JavaScript và file sử dụng.
2. Phân loại mỗi rule: `shared-base`, `shared-component`, `memory`, `link`, `victory`, `generated`, `legacy-candidate`.
3. Đánh dấu rule trùng là một trong ba loại:
   - trùng thật, có thể hợp nhất;
   - override responsive/state có chủ đích, phải giữ gần rule gốc;
   - xung đột tên/ownership, phải namespace hoặc tách.
4. Chạy CSS coverage trên selector, menu, shop/collection, tất cả mode của Memory/Link, thắng/thua/fullscreen; rule không hit chỉ là ứng viên, chưa được xóa ngay.
5. Lưu ảnh và computed-style baseline trước khi thay đổi cascade.

### 2. Chuẩn hóa cấu trúc CSS

Tổ chức mục tiêu:

```text
styles/
├── base.css                         # html/body/reset và primitive toàn app
├── components/
│   ├── hud.css
│   ├── modal.css
│   ├── menu.css
│   ├── shop.css
│   ├── tooltip.css
│   └── gameplay-feedback.css
├── game-shell/
│   ├── tokens.css                  # generated
│   └── presentation.css
├── memory/
│   ├── board.css
│   └── effects.css
├── link/
│   ├── board.css
│   └── effects.css
└── victory/                        # giữ tách và lazy-load theo target
```

Không bắt buộc đổi tên toàn bộ file trong một commit. Di chuyển theo từng ownership slice, mỗi slice có visual diff riêng.

Quy tắc:

- Keyframe shared phải có prefix `app-` hoặc `shell-`; Memory dùng `memory-`; Link dùng `link-`; victory dùng `victory-`.
- Mỗi keyframe chỉ có một định nghĩa.
- Component class chỉ có một file sở hữu base rule; media/state override đặt trong cùng file.
- Không để `style.css` sở hữu shop/modal/game-specific effect sau khi migration hoàn tất.
- Generated token và victory source không chỉnh tay/không gom vào base.
- Dùng cascade layers nếu browser target đã xác nhận, ví dụ `reset, tokens, components, games, utilities`; nếu không dùng layer thì kiểm load order bằng test.

### 3. Khắc phục các xung đột CSS đã biết

1. Đổi hai `pop` thành keyframe có nghĩa rõ: `app-level-intro-enter` và `app-dialog-pop-enter`.
2. Đổi `shimmer` thành `memory-lucky-shimmer` và `app-loading-shimmer`.
3. Đổi `slideUp` thành `app-feedback-exit-up` và `memory-card-enter-up`.
4. Di chuyển/đổi `fadein` thành primitive `app-fade-in` trong file component sở hữu hoặc tạo keyframe cục bộ có prefix.
5. Tách `.bonus-overlay` thành hai component đúng nghĩa; không để cùng class mô tả cả panel nhỏ lẫn backdrop toàn màn.
6. Xóa rule shop legacy trong `style.css` và `modals.css` chỉ sau khi `styles/shop.css` đã bao phủ đủ shop/collection ở mọi viewport.
7. Gom rule HUD/quick action bị lặp trong cùng breakpoint mà không thay đổi computed style.
8. Đưa hiệu ứng freeze timer mới về owner Link HUD/effect runtime; không restart CSS animation bằng forced reflow và không để clock CSS chạy lệch clock gameplay.

### 4. Tách renderer Link Connect theo trách nhiệm

```text
js/effects/
├── effectRuntime.js          # owner, quality, pooling, cleanup, reduced motion
├── effectCatalog.js          # metadata/preset trung lập; adapter migration từ Link IDs
├── connectionEngine.js       # SVG path + decorations
├── exitEngine.js             # WAAPI/CSS + canvas particle/fragment families
├── effectGeometry.js         # rect/path/normal/tangent; pure
├── particlePool.js           # typed arrays/pool; không allocation theo frame
└── effectQuality.js          # low/medium/high/auto budget

js/linkConnect/
├── linkRenderer.js           # board/tile patch và gọi adapter
└── linkEffectAdapter.js      # chuyển pathfinder positions + 2 tiles sang effect request
```

- `linkRenderer.js` không còn chứa catalog, particle generation, canvas draw loop hoặc CSS selector theo từng effect.
- Runtime nhận `ownerScope`, `effectId`, `targets[]`, `pathPoints[]`, `bounds`, `seed`, `quality`, `onVisualComplete`.
- Gameplay không chờ animation promise để xác nhận match; logic match được quyết định trước. Visual completion chỉ điều khiển thời điểm tháo node/khóa tương tác theo timeline đã clamp.
- Public effect IDs và appearance save key cũ được giữ nguyên.

### 5. Backend render V2

- **SVG dùng cho hiệu ứng nối:** một SVG overlay persistent cho mỗi board/tray, tái sử dụng node `path`, `glow`, `decorations`; không `replaceChildren()` toàn bộ mỗi match nếu topology không đổi.
- **Web Animations API dùng cho exit đơn giản:** transform/opacity; clone/snapshot tile chỉ khi cần giữ hình sau khi state board đổi.
- **Canvas 2D dùng cho particle/mảnh vỡ:** một canvas pooled theo effect surface; DPR clamp; typed arrays hoặc struct-of-arrays; precompute particle parameters khi effect bắt đầu, không tạo object trong frame loop.
- Không thêm WebGL/dependency mới trong V2. Chỉ cân nhắc WebGL sau benchmark chứng minh Canvas 2D không đạt budget.
- Dùng `transform`/`opacity` làm trục chính; filter/blur chỉ ở số layer nhỏ và có quality fallback.
- Tất cả RAF/animation/node đăng ký vào Game Shell scope và effect registry.

### 6. Effect quality tiers

| Tier | Connection | Exit | Mục tiêu |
| --- | --- | --- | --- |
| Low | core + glow, tối đa 1 decoration | 0–12 particle hoặc WAAPI | mobile yếu/reduced power |
| Medium | core + glow + 2–3 decorations | 12–28 particle/mảnh | mặc định mobile |
| High | thêm secondary trail/impact | 24–48 particle/mảnh | desktop/mobile mạnh |
| Reduced | line/fade tĩnh 120–180 ms | fade/scale ngắn, không flash mạnh | accessibility |

Auto tier phải quyết định một lần khi mount dựa trên feature/capability và kết quả benchmark nhẹ; không đổi tier liên tục trong frame. Khi frame budget xấu liên tiếp, chỉ giảm tier ở effect kế tiếp.

### 7. Thiết kế 21 hiệu ứng nối V2 — Link Connect, dùng lại cho Triple qua adapter

| ID | Mô tả thị giác chuẩn | Backend/gia đình |
| --- | --- | --- |
| `default` | Vệt sáng xanh-trắng chạy từ thẻ đầu tới thẻ cuối, glow nở nhẹ ở các góc, chấm sáng dừng tại đích | SVG tracer |
| `electric` | Tia điện gãy khúc, lõi trắng, viền cyan, 1–2 nhánh phụ lóe ngắn; không rung toàn đường mỗi frame | SVG jagged, seeded |
| `laser` | Lõi laser hồng-trắng rất thẳng, bật sáng nhanh, giữ một nhịp rồi co chiều rộng về 0 | SVG dual stroke |
| `fire` | Đầu lửa vàng cam chạy theo đường, để lại ember nhỏ tắt dần; điểm đích bùng vòng nhiệt | SVG + pooled sparks |
| `magic` | Dải tím mềm với hạt sao xoay chậm quanh tiếp tuyến, kết thúc bằng glyph/sparkle nhỏ | SVG + symbols |
| `cyber` | Xung cyan đi theo từng đoạn vuông, packet hình chữ nhật chạy theo nhịp, impact dạng scanline | SVG stepped packets |
| `rainbow` | Lõi trắng trên dải gradient phổ màu dịch chuyển một lần theo hướng đi; tránh filter nhiều lớp | SVG gradient |
| `hydro` | Dòng nước xanh hai lớp, đầu giọt bo tròn và hai gợn tròn nhỏ tại đích | SVG wave + rings |
| `plasma` | Hai sợi tím/xanh bện quanh lõi, biên độ nhỏ và ổn định; đầu plasma phát sáng | SVG dual sinusoid |
| `holy` | Tia vàng ấm mở dần, hạt bụi đi lên và một dấu thập/flare mềm ở đích, không flash trắng toàn màn | SVG + light motes |
| `shadow` | Dải tối bán trong suốt có viền đỏ tím, hút glow xung quanh rồi thu vào đích | SVG ribbon/mask |
| `spiral` | Hai sợi cyan xoắn đối pha quanh đường chính, số vòng tỷ lệ chiều dài nhưng có giới hạn | SVG helix |
| `dashed` | Các đoạn năng lượng xanh chạy nối tiếp với khoảng cách đều, tăng tốc nhẹ về đích | SVG dash offset |
| `bullet` | Đầu đạn vàng nhỏ chạy rất nhanh, trail ngắn và impact chớp hình sao; tổng thời lượng ngắn nhất | SVG projectile |
| `kame` | Nạp cầu sáng 100–140 ms ở thẻ đầu, sau đó beam xanh-trắng dày quét tới đích và co lại | SVG charge + beam |
| `halo` | Các vòng vàng nhỏ di chuyển dọc đường và bung thành halo lớn ở đích | SVG reused rings |
| `matrix` | Packet ký hiệu xanh chạy theo đường vuông, mờ dần từ sau ra trước; giới hạn số glyph | SVG symbols |
| `sonic` | Lõi xanh tím mảnh kèm 2–3 sóng vòng cung lan theo hướng đi; impact là vòng âm mở rộng | SVG wavelets |
| `chains` | Các mắt xích vàng hiện tuần tự theo chiều đường, căng một nhịp rồi tan thành spark | SVG repeated symbol |
| `meteor` | Đầu sao băng trắng-vàng với trail cam, tăng tốc nhẹ và tạo burst có hướng tại đích | SVG + pooled impact sparks |
| `poison` | Dòng acid xanh có blob tròn di chuyển, vài giọt tách xuống theo trọng lực và bọt nổ ở đích | SVG + pooled droplets |

Quy tắc hình ảnh chung:

- Đường nối phải đọc được topology tối đa hai lần rẽ; decoration không che góc rẽ.
- Core line luôn rõ hơn glow; không dùng blur lớn để giả độ sáng.
- Impact nằm trong board frame, không che HUD.
- Triple adapter dùng cùng preset nhưng path là thẻ 1 -> thẻ 2 -> thẻ 3 trong khay; mật độ decoration không nhân ba.

### 8. Thiết kế 21 hiệu ứng xóa V2 — Link Connect trước, Triple dùng nhiều target sau

| ID | Mô tả thị giác chuẩn | Backend/gia đình |
| --- | --- | --- |
| `default` | Viền thẻ lóe theo màu path, ảnh co 0,92 và tan sạch trong 220–280 ms | WAAPI |
| `dissolve` | Ảnh mất dần theo mặt nạ từ rìa vào tâm, kèm ít khói/bụi mờ đi lên | Canvas mask + particles |
| `finedust` | 24–48 hạt sáng rất nhỏ tách từ ảnh, drift lên/xéo theo seeded velocity và tan mềm | Canvas particles |
| `split4` | Thẻ vỡ thành 4 mảnh giữ đúng texture; mảnh tách theo bốn hướng rồi xoay nhẹ | Canvas fragments |
| `split2` | Một đường cắt lóe, hai nửa trượt ngược hướng theo pháp tuyến đường cắt | Canvas/clip fragments |
| `split8` | 8 mảnh texture nhỏ bung có hướng, tốc độ giảm dần; không quá 8 drawImage/frame/target | Canvas fragments |
| `triangles` | 4–6 mảnh tam giác cắt chéo, xen kẽ xoay thuận/ngược và tan trước khi ra khỏi ô | Canvas clipped fragments |
| `crumble` | Thẻ nứt từ trên xuống thành vụn, rơi ngắn theo trọng lực và biến mất trong ô lân cận | Canvas particles |
| `gravity` | Thẻ chùng nhẹ, rơi xuống với gia tốc và fade trước mép frame; bóng tách khỏi thẻ | WAAPI |
| `collide` | Hai thẻ cùng lao về trung điểm của cặp, squash tại va chạm rồi nổ thành 8–16 mảnh chung | Pair-aware canvas/WAAPI |
| `portal` | Vòng portal mở sau thẻ, ảnh xoáy/co theo tâm vòng và portal khép lại | WAAPI + SVG ring |
| `blackhole` | Tâm đen-tím xuất hiện giữa target group, các thẻ bị kéo cong/quay vào tâm, halo co cuối | Group-aware canvas/WAAPI |
| `freeze` | Lớp băng phủ nhanh, hiện 2–3 vết nứt, sau đó vỡ thành shard xanh trong suốt | Canvas shards + overlay |
| `burn` | Mép ảnh cháy từ dưới lên bằng mask, ember bay lên; phần đã cháy chuyển tối trước khi tan | Canvas mask + particles |
| `pixel` | Ảnh tách thành block 4–6 px theo quality, block glitch ngang một nhịp rồi tắt theo cụm | Canvas pixel blocks |
| `implode` | Thẻ nén cực nhanh vào tâm, tạo vòng shockwave mảnh lan ra; khác hẳn portal/blackhole | WAAPI + SVG ring |
| `slice` | Vệt kiếm chéo đi qua trước, ảnh tách hai nửa theo đúng góc cắt và trượt sạch | Canvas clip + SVG slash |
| `bubble` | Thẻ phồng thành mặt cầu trong suốt, highlight chạy qua, sau đó pop thành 8–12 giọt | WAAPI + canvas droplets |
| `origami` | Ảnh gập 2–3 nếp quanh trục Y/X, thu thành dải mỏng rồi bay khỏi tâm | WAAPI/clip layers |
| `electric-shock` | Arc điện ôm viền, ảnh giật 2 nhịp rất ngắn, flash cục bộ rồi phân rã thành spark | SVG arcs + WAAPI |
| `ghost` | Bản silhouette bán trong suốt tách khỏi ảnh và bay lên; thẻ gốc fade/co xuống | DOM clone + WAAPI |

Quy tắc multi-target:

- Link: effect nhận đúng hai target và có thể dùng midpoint/tangent của cặp.
- Triple: effect nhận ba target đã nhóm; các effect group-aware dùng centroid của ba thẻ, không chạy ba canvas độc lập.
- Particle budget là theo **một match**, không nhân tuyến tính theo số target.
- Gameplay state xóa một lần; visual snapshot giữ ảnh độc lập cho tới khi effect kết thúc.

### 9. Đồng bộ catalog, timeline và save

1. Giữ nguyên 21 path ID, 21 exit ID, title/ownership hiện có trừ khi có quyết định sản phẩm riêng.
2. Catalog V2 thêm metadata: `family`, `duration`, `qualityCost`, `reducedPreset`, `supportsTargetCounts`, palette và preset params.
3. Validation build phải đảm bảo:
   - ID duy nhất;
   - migration đích tồn tại;
   - mọi effect có renderer family;
   - reduced preset tồn tại;
   - duration nằm trong giới hạn;
   - target count 2 được hỗ trợ; target count 3 được khai báo trước khi Triple bật.
4. Controller dùng timeline chuẩn từ catalog/runtime, không đọc duration từ CSS rải rác.
5. Không đổi `appearance.linkPathEffect`, `appearance.linkExitEffect`, `ownedLinkPathEffects`, `ownedLinkExitEffects` hoặc giá trị ID đã lưu.

### 10. Cleanup và pooling

- Một effect handle có `cancel()`, `finished`, `dispose()` idempotent.
- Effect runtime đăng ký handle vào shell owner; đổi game/restart hủy toàn bộ.
- Persistent SVG/canvas surface được tái sử dụng; pool có max size và xóa reference ảnh/target khi trả về pool.
- Canvas resize chỉ khi frame geometry/DPR thay đổi, không mỗi match.
- Mọi draw loop dừng khi progress đủ, owner chết, surface disconnect hoặc document hidden theo policy.
- `ImageBitmap`/snapshot nếu dùng phải `close()` sau effect; canvas phải clear và bỏ reference source.
- Không lưu DOMRect/DOM node trong cache lâu hơn round.

### 11. Trình tự triển khai theo gate

#### Gate A — Baseline và audit

- Hoàn tất task lifecycle baseline trước.
- Lưu CSS inventory, coverage, screenshot, computed styles, bundle/heap/frame baseline.

#### Gate B — CSS collision fixes

- Namespace keyframe, tách bonus overlay, gom shop ownership và giữ pixel output tương đương.
- Mỗi nhóm thay đổi chạy visual regression riêng.

#### Gate C — Effect runtime V2 song song

- Xây runtime/geometry/quality/pool không nối gameplay.
- Tạo effect lab nội bộ hoặc fixture test render mọi preset bằng seed cố định.

#### Gate D — Connection effects

- Chuyển `default`, `electric`, `laser` trước; benchmark.
- Chuyển theo family; giữ adapter fallback về V1 trong development cho đến khi đủ 21 ID.

#### Gate E — Exit effects

- Chuyển WAAPI effects trước, canvas fragment/particle sau, cuối cùng pair/group-aware.
- So khớp timeline controller và cleanup sau mỗi family.

#### Gate F — Link Connect rollout

- V2 mặc định sau khi toàn bộ catalog/test/perf xanh.
- Xóa V1 code/CSS chỉ trong commit riêng sau khi không còn reference và save cũ đã được thử.

#### Gate G — Triple readiness

- Kiểm adapter ba target bằng fixture khay giả lập; chưa cần gameplay Triple.
- Chỉ cho Triple dùng V2, không sao chép Link renderer/CSS.

## Edge cases

- Đường nối 0, 1 hoặc 2 lần rẽ; đoạn rất ngắn; đường sát biên board.
- Board resize/orientation/fullscreen trong lúc effect chạy.
- Hai match tự động nối tiếp nhanh hoặc thunder xóa nhiều cặp.
- Target bị tháo khỏi DOM ngay sau khi visual snapshot được tạo.
- Ảnh chưa decode, lỗi ảnh hoặc natural size bằng 0.
- DPR thay đổi; DPR rất cao; canvas context không tạo được.
- Reduced motion bật trước game hoặc đổi khi app đang chạy.
- Tab background/resume; frame timestamp nhảy xa.
- Scope bị dispose giữa `requestAnimationFrame` và draw.
- Effect bị hủy hai lần hoặc hoàn tất đồng thời với restart.
- Low tier không có particle nhưng callback gameplay vẫn chạy đúng một lần.
- Filter/SVG mask không hỗ trợ đầy đủ trên Android WebView mục tiêu.
- Path length bằng 0 hoặc có hai điểm trùng nhau.
- Triple có ba thẻ với khoảng cách không đều trong khay.
- `collide`/`blackhole`/`implode` có target count khác preset hỗ trợ.
- Pool đạt giới hạn trong thunder/auto-clear; effect phải degrade thay vì cấp phát vô hạn.
- Save chứa effect ID cũ/migration ID hoặc ID không tồn tại.
- CSS V1 và V2 cùng tồn tại trong giai đoạn chuyển đổi; selector phải scope để không chạy hai animation.
- Victory animation đang chạy khi vào/ra game; không dùng chung surface/pool của gameplay.

## Performance constraints

- Mục tiêu 60 FPS; frame effect p95 <= 8 ms, tuyệt đối không có long task > 50 ms trong match chuẩn.
- Connection setup p95 <= 3 ms; exit setup p95 <= 4 ms cho 2 target và <= 6 ms cho 3 target.
- Không allocation object/array/string mới trong RAF draw loop; precompute trước khi bắt đầu.
- Tối đa một persistent SVG connection surface và một pooled canvas exit surface trên mỗi game shell.
- Canvas DPR clamp <= 2; low tier <= 1,5 nếu cần.
- Particle/mảnh tối đa mỗi match: low 12, medium 28, high 48; effect đặc biệt muốn vượt phải có benchmark riêng.
- SVG decoration node: low <= 3, medium <= 8, high <= 14; tái sử dụng node.
- Không animate layout properties (`top`, `left`, `width`, `height`) theo frame; dùng transform/opacity.
- Không đọc `getBoundingClientRect()` sau khi đã bắt đầu ghi DOM trong cùng frame; batch read rồi batch write.
- Không blur/filter diện rộng trên toàn board; glow giới hạn trong effect surface.
- Không rebuild board/tile khi đổi effect hoặc khi effect kết thúc.
- Sau effect, registry/pool không giữ target DOM, DOMRect, image source hoặc callback của round cũ.
- Sau 100 match và GC: node/listener/canvas count trở về baseline, heap không tăng đơn điệu.
- Không tăng persistence/Firebase write khi xem preview, chạy effect hoặc đổi quality tự động.
- CSS V2 gzip mục tiêu không vượt CSS hiệu ứng hiện tại; JS V2 gzip tăng ròng <= 15 kB sau khi xóa V1.
- Trang đầu không tải asset riêng cho effect chưa dùng; effect code có thể lazy-load theo game/family nếu bundle budget yêu cầu.

## Tests required

- **Static CSS audit**
  - Không có keyframe trùng tên ngoài allowlist generated đã duyệt.
  - Không có component base selector thuộc nhiều file owner.
  - Không có `animation-name` trỏ tới keyframe không tồn tại.
  - Không có class tạo từ JS thiếu CSS hoặc CSS effect class thiếu catalog ID.

- **Catalog/unit tests**
  - 21 path và 21 exit ID vẫn tồn tại, duy nhất và migrate đúng.
  - Mọi ID resolve đúng family/preset/reduced preset/timeline.
  - Seed giống nhau tạo geometry/particle params giống nhau.
  - Geometry path 0/1/2 góc và target count 2/3 đúng.
  - Pool acquire/release/cap/degrade và dispose idempotent.

- **Visual effect fixtures**
  - Screenshot từng effect tại 0%, khoảng 35–50% và 100% với clock cố định.
  - Nền sáng, nền tối, tile sáng/tối và bốn viewport.
  - Link path phải thể hiện rõ mọi góc rẽ.
  - Triple fixture phải đi qua chính giữa ba thẻ trong khay.
  - Không update golden tự động; mọi diff phải được xem.

- **Integration**
  - Match thường, combo nhanh, hint path, thunder nhiều cặp, shuffle/restart/switch.
  - State match/xu/điểm chỉ thay đổi một lần dù effect bị skip/cancel.
  - Target tháo sớm không tạo exception hoặc callback trễ.
  - Save cũ trang bị từng effect vẫn mở đúng ID.

- **Reduced motion/accessibility**
  - Tất cả 42 effect có reduced representation ngắn, không canvas particle, không flash mạnh.
  - Không animation vô hạn thuộc gameplay.
  - Effect không chặn focus/touch và có `pointer-events: none`.

- **Performance/leak**
  - Trace 100 match default và ba effect nặng nhất trên desktop/mobile emulation.
  - Android WebView thật: medium tier, board lớn, thunder và chuyển orientation.
  - Ghi p50/p95 setup/frame, dropped frames, canvas/node count, heap sau GC.
  - Mount/unmount/restart 20 và 100 vòng; diagnostics về 0.

- **Regression suite**
  - `npm run check`.
  - Toàn bộ game-shell lifecycle/cleanup/effects/layout/audit/presentation tests.
  - Memory/Link UI tests ở desktop, mobile, mobile-narrow, landscape.
  - `npm run test:ui:visual`.
  - `npm run build` và Android build/sync ở gate phát hành.

## Acceptance criteria

- [ ] Baseline lifecycle task đã xanh trước khi chuyển effect V2 vào gameplay.
- [ ] Không còn keyframe `pop`, `shimmer`, `slideUp`, `fadein` toàn cục mơ hồ.
- [ ] `.bonus-overlay`, shop, modal, HUD và quick action có đúng một file sở hữu base rule.
- [ ] Không còn CSS behavior phụ thuộc ngoài ý muốn vào thứ tự `<link>`.
- [ ] CSS coverage và visual diff xác nhận không mất style cần thiết.
- [ ] Memory Match giữ nguyên luật/appearance/save và không regression hình học.
- [ ] Link Connect vẫn có đủ 21 path và 21 exit ID, quyền sở hữu và trang bị cũ.
- [ ] `blackhole`, `implode` và `portal` có ba chuyển động khác nhau đúng mô tả.
- [ ] `collide` hoạt động theo cặp; Triple fixture hoạt động theo nhóm ba.
- [ ] Mọi effect có reduced-motion representation đúng.
- [ ] Renderer board Link không còn chứa particle/canvas/path catalog implementation.
- [ ] Effect runtime cleanup hoàn toàn khi finish/cancel/restart/switch/unmount.
- [ ] Không còn canvas/SVG decoration/animation/listener của round cũ.
- [ ] Không allocation trong RAF draw loop theo profile.
- [ ] Connection setup p95 <= 3 ms và exit setup đạt budget.
- [ ] Frame effect p95 <= 8 ms; không long task > 50 ms trong scenario chuẩn.
- [ ] 60 FPS trên desktop và thiết bị Android mục tiêu với medium tier; low tier giữ trải nghiệm ổn định trên máy yếu.
- [ ] Sau 100 match/mount cycle, heap/node/listener không tăng đơn điệu sau GC.
- [ ] Không tăng persistence hoặc Firebase write do effect.
- [ ] Save V1.1a cũ đọc đúng; không đổi schema/key/ID.
- [ ] CSS/JS gzip nằm trong ngân sách.
- [ ] Full check, UI, visual, production build và Android smoke test đều pass.
- [ ] Chỉ sau khi Link V2 đạt toàn bộ tiêu chí mới cho Triple Connect sử dụng adapter chung.

## Do not do

- Không gộp tất cả CSS vào một file lớn chỉ để giảm số lượng file.
- Không coi file generated/template lớn là trùng lặp và chỉnh/xóa thủ công.
- Không xóa CSS chỉ dựa trên một lần coverage hoặc tìm kiếm text.
- Không thay đổi gameplay, scoring, pathfinding, item, shop price hoặc reward trong task này.
- Không đổi effect ID, appearance key, owned list hoặc save schema.
- Không refactor toàn bộ Memory/Link controller vì có function tên giống nhau.
- Không sao chép Link V2 vào Triple; dùng adapter target/path.
- Không thêm WebGL, thư viện particle hoặc dependency runtime mới trước khi benchmark chứng minh cần.
- Không tạo canvas mới cho mỗi target/mỗi frame.
- Không dùng `filter: blur()` lớn, box-shadow nhiều lớp hoặc DOM particle không giới hạn.
- Không dùng timer/RAF ngoài Game Shell lifecycle cho gameplay effects.
- Không gắn gameplay completion vào việc animation có chạy hay không.
- Không che lỗi effect bằng timeout dài hơn hoặc khóa input lâu hơn.
- Không update visual snapshots tự động để làm test xanh.
- Không giữ đồng thời V1 và V2 production path sau khi rollout hoàn tất.
- Không tải victory source/effect nặng vào gameplay bundle nếu người dùng chưa đi tới luồng đó.
