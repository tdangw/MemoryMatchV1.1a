# TASK — Hoàn thiện Triple Connect trên web

## Trạng thái và nguồn sự thật

Triple Connect đã có lõi gameplay, xuất hiện trong menu và chơi được. Kế hoạch implementation nền được xem là hoàn thành; task hiện tại chỉ hoàn thiện layout, giao diện, hiệu ứng, persistence liên quan và trải nghiệm web.

Thứ tự ưu tiên:

1. `AGENTS.md` và yêu cầu mới nhất của người dùng.
2. File này cho phạm vi, quyết định sản phẩm, thứ tự gate và acceptance.
3. `Triple Connect.md` cho luật gameplay không bị thay thế tại đây.
4. `ARCHITECTURE.md`, `ADD_GAME.md` và contract hiện có trong code.

`TASK_CSS_DEDUP_EFFECTS_V2_PLAN.md` là task active riêng, chưa thực hiện xong và không được coi là đã nhập vào file này. Các kế hoạch tạm/lịch sử khác đã bị loại bỏ và không còn là nguồn thực thi.

## Goal

Hoàn thiện Triple Connect để người dùng có thể chơi và nghiệm thu mượt trên web desktop/mobile:

- board V4 nhiều lớp có hình dạng đẹp, cover graph đúng và luôn có lời giải;
- ảnh hiện đầy đủ, board/tray không overflow hoặc co giãn;
- menu, picker, theme, HUD, timer, popup đầu/cuối màn đồng bộ Game Shell;
- hiệu ứng đưa thẻ xuống khay, nối, xóa, điểm, Xu và vật phẩm rõ ràng nhưng hữu hạn;
- milestone 15 mốc và kinh tế Triple đúng persistence;
- không có render loop, callback stale, listener/timer/RAF nhân đôi hoặc rò rỉ node;
- Memory Match và Link Connect không regression.

PWA/APK, Android lifecycle, signing và QA cửa hàng ứng dụng không thuộc task này.

## Quyết định sản phẩm đã khóa

### Mode và layout

| Mode | Thẻ | Lớp | Thời gian | Layout active |
|---|---:|---:|---:|---|
| Easy | 18 | 2 | 75 giây | `easy-18-v4` |
| Normal | 36 | 3 | 105 giây | `normal-36-v4` |
| Hard | 54 | 4 | 150 giây | `hard-54-v4` |
| Super Hard | 75 | 5 | 210 giây | `super-hard-75-v4` |
| Endless | 75 | 5 | đếm xuôi | topology 75 thẻ phù hợp level |

- Challenge: `18 -> 24 -> 36 -> 42 -> 54 -> 60 -> 75`.
- Phân bố V4 tham chiếu: Easy `12 + 6`; Normal `18 + 12 + 6`; Hard `24 + 15 + 9 + 6`; Super Hard/Endless `30 + 18 + 15 + 9 + 3`.
- Có thể điều chỉnh phân bố để đẹp hơn nếu vẫn đúng tổng/số lớp và pass validator, solver, UI witness, visual review.
- V1/V2/V3 và resolver tương ứng phải được giữ cho Continue save cũ; V4 chỉ active cho round mới.
- Khay luôn đúng 7 ô. Không có ô khóa hoặc mở rộng 10 ô.

### Item, sao, Lucky và phần thưởng

- Khởi đầu có 3 Gợi ý.
- Giá: Gợi ý 8 Xu; Thêm thời gian 2 Xu/giây; Hoàn tác 15 Xu; Xáo thẻ 15 Xu.
- Mốc sao mode đếm ngược: `12 / 18 / 25` điểm trên mỗi bộ ba.
- Mốc sao Endless: `10 / 15 / 20` điểm trên mỗi bộ ba.
- Lucky chỉ có trong Challenge; mỗi board có 1–3 Lucky Card, là metadata của tile instance và không đổi type/slot/blocker.
- RNG có seed chọn 1–3 Lucky thuộc các bộ ba khác nhau; mọi layer hợp lệ. Thưởng cố định: `10 Xu`, `+5 giây` hoặc `+1 Gợi ý`; Gợi ý đầy đổi thành `10 Xu`.
- Lucky claim đúng một lần. Shuffle giữ Lucky/reward/claim ledger; resolve Lucky xóa Undo history để không farm lại.
- `thunder`, `freeze`, `tray-expand`, Corner Deck và random reward drop ngoài contract không thuộc phase này.

### Xu cuối màn

`round(base + matchedTriples * perTriple + stars * 2 + min(maxCombo, 5))` với rate `perTriple/base`:

- Easy `.5/2`;
- Normal `.5/3`;
- Hard `.6/4`;
- Super Hard `.7/5`;
- Endless `.6/3`;
- Challenge `.5/3`.

Mọi call site phải truyền `matchedTriples`; HUD và popup chỉ hiển thị kết quả đã commit.

### Milestone 15/45

Mỗi bộ ba resolve hợp lệ tăng 1. Track có 15 marker tại `3, 6, ..., 45`, hiển thị `0/45`; mốc 15 grant xong mới tăng `cycleId` và rollover.

| Mốc | Điều kiện | Mode đếm ngược/Challenge | Endless |
|---:|---:|---|---|
| 1 | 3 | +2 Xu | +2 Xu |
| 2 | 6 | +2 giây | +2 Xu |
| 3 | 9 | +1 Gợi ý | +1 Gợi ý |
| 4 | 12 | +3 Xu | +3 Xu |
| 5 | 15 | +1 Hoàn tác | +1 Hoàn tác |
| 6 | 18 | +3 giây | +3 Xu |
| 7 | 21 | +5 Xu | +5 Xu |
| 8 | 24 | +1 Gợi ý | +1 Gợi ý |
| 9 | 27 | +1 Xáo trộn | +1 Xáo trộn |
| 10 | 30 | +10 Xu, +1 Gợi ý | +10 Xu, +1 Gợi ý |
| 11 | 33 | +3 Xu | +3 Xu |
| 12 | 36 | +1 Gợi ý | +1 Gợi ý |
| 13 | 39 | +5 Xu | +5 Xu |
| 14 | 42 | +1 Hoàn tác | +1 Hoàn tác |
| 15 | 45 | +15 Xu, +1 Gợi ý | +15 Xu, +1 Gợi ý |

Inventory đầy đổi Gợi ý thành 4 Xu, Hoàn tác/Xáo trộn thành 8 Xu. Reward gốc và fallback chỉ commit một lần. Undo không thu hồi reward đã commit; ledger tile ngăn match → Undo → match để farm. Lucky và milestone dùng chung transaction queue theo thứ tự: match/score → Lucky → milestone → win check → popup.

## Trạng thái code cần review, không được giả định

- HUD/CSS, tray flight và effect adapter đã có implementation; sửa phần chưa đạt thay vì làm lại toàn bộ.
- Working tree có config/layout V4 18/36/54/75 và test liên quan; không hoàn nguyên hàng loạt hoặc ghi đè thay đổi có sẵn.
- `npm run check` và build từng pass nhưng chưa chứng minh visual pass vì một số test cũng đã đổi theo contract mới.
- Lỗi/rủi ro đã quan sát: V4 còn dải hàng/khoảng trống; UI witness có thể gặp tile còn `disabled`; Challenge 75 timeout; ảnh đang dùng `cover`; nhiều exit ID dùng chung fade/scale; timer bar, popup, HUD, milestone và cleanup chưa có đủ bằng chứng.
- Test kỳ vọng 12 thẻ/60 giây, Challenge 48 hoặc 10/30 là lỗi thời. Tuy nhiên không được hạ minimum tile size, nới timeout hoặc làm yếu geometry/witness assertion để test pass.

## Files to inspect theo owner

Chỉ mở file của gate hiện tại và call site được chứng minh bằng import/test:

- Contract/config: `js/tripleConnect/tripleConfig.js`, `Triple Connect.md`.
- Board/solver/state: `tripleBoard.js`, `tripleSolver.js`, `tripleRules.js`, `tripleState.js`.
- UI/lifecycle: `tripleController.js`, `tripleRenderer.js`, `tripleShell.js`, `triplePresentation.js`, `styles/triple-connect.css`.
- Persistence/economy: `triplePersistence.js`, `tripleTransactions.js`, `tripleMilestones.js`, shared catalog/state boundary liên quan.
- Test: `scripts/check-triple-connect-*.mjs`, `tests/ui/triple-connect*.spec.js`, Playwright config chỉ khi gate cần đổi matrix.

Không quét toàn repository nếu owner/call site đã rõ.

## Thứ tự thực hiện

`Continuation 0 -> 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 Web Acceptance`.

Mỗi continuation là một gate/diff riêng. Terra phải tiếp tục đọc, sửa, chạy test, chẩn đoán và chạy lại đến khi toàn gate pass hoặc có blocker thật; không dừng sau một file, một test hay một profile.

Continuation 0–4 có thể tiếp tục độc lập. Trước Continuation 5, phải hoàn tất và review task CSS/effect V2 vì hai task cùng chạm effect catalog/runtime, `linkRenderer.js`, `triplePresentation.js` và CSS dùng chung. Continuation 5 chỉ tích hợp Triple vào runtime V2 đã đạt acceptance; không tạo một runtime thứ hai hoặc mở rộng adapter tạm hiện tại song song.

### Continuation 0 — Đồng bộ contract và test

1. Đồng bộ code/test với 18/36/54/75, Challenge mới, 15/45 và công thức Xu mới.
2. Xóa kỳ vọng cũ nhưng giữ/tăng độ chặt của geometry, image, input, persistence và timeout assertions.
3. Không sửa gameplay ngoài contract trong gate này.

**Pass:** chỉ còn một contract active; diff test không che clipping, hit target, solver, witness hoặc performance failure.

### Continuation 1 — Layout V4, cover graph và witness

1. Mỗi layer tạo silhouette có chủ ý: khung/chữ nhật, vòng/kim cương, dấu cộng, tam giác hoặc biến thể cân bằng; layer cao xen kẽ layer dưới theo bước nửa thẻ.
2. Không dàn thành dải hàng/cột để lấp chiều cao. Cùng layer không overlap; blocker chỉ đến từ layer cao giao hình học. Layer 4 có thể lớn hơn Layer 3; Layer 5 giữ footprint nhỏ.
3. Static solver và runtime dùng cùng cover graph/command rules. Chạy witness qua reducer và DOM; tile đến lượt không được còn `disabled`.
4. Challenge 75 phải hoàn thành trong budget. Xác định timeout do solver, witness hay presentation trước khi cân nhắc đổi budget.
5. Giữ ID/version layout cũ và test Continue fixture V1/V2/V3.

**Pass:** validator, solver và UI witness xanh cho corpus mọi mode/stage; screenshot cho thấy layer rõ, không khoảng trống/dải hàng vô nghĩa.

### Continuation 2 — Board, ảnh và responsive

1. Board/tray dùng `object-fit: contain`; giữ toàn ảnh, background/padding ổn định và fallback không đổi slot.
2. Fit từ bounds thật + tray reserve; không giảm minimum tile size hoặc tăng `min-height` theo viewport để che lỗi.
3. Tile bị che dùng opacity/overlay tĩnh; tile exposed sáng. Không blur/filter lớn trên từng tile.
4. Board/tray tách biệt, căn giữa. Compact landscape dùng Game Shell chung; desktop landscape giữ bố cục desktop có chủ ý.

**Pass:** mọi tile/ảnh/tray nằm trong surface, không crop/overflow/overlap ở matrix viewport được khóa.

### Continuation 3 — Menu, picker, HUD, popup và timer

1. Chỉ bổ sung phần còn thiếu sau review code: Cài đặt, Thông tin, Hướng dẫn, theme, mô tả mode, action/tools menu, popup đầu/cuối màn.
2. Dùng component/token chung qua Triple adapter; không sao chép markup/CSS/handler nếu shared owner đã hỗ trợ.
3. Timer số cập nhật theo giây; timer bar nội suy timestamp bằng đúng một RAF có owner/cleanup. Timer/input chỉ chạy sau Bắt đầu; pause/background/resume/purchase rebase đúng.
4. Continue không phát lại popup đầu của round đang dở. Popup cuối chờ transaction + presentation settle, phân biệt win/time-up/tray-full và mở đúng một lần.

**Pass:** parity UI không còn mục thiếu, timer mượt, theme/HUD/popup đồng bộ và không còn timer/RAF/modal stale sau restart/switch.

### Continuation 4 — Khay và tray flight

1. Dựng sẵn 7 slot cố định; rect khay không đổi từ 0–7 thẻ. Tile tray không kế thừa min-size board.
2. Flight/regroup dùng ghost/FLIP 180–240 ms, `transform`/`opacity`, geometry đọc theo batch và slot đích thật.
3. Không dùng `offsetWidth`/forced reflow. Reduced motion ≤100 ms; tap trong presentation không penalty; restart/menu/unmount cleanup toàn bộ.

**Pass:** geometry trước/sau bằng nhau, flight/regroup đúng và 20 chu kỳ không tăng ghost/node/listener/timer/RAF.

### Continuation 5 — Line, exit effect, điểm và reward visual

**Precondition:** `TASK_CSS_DEDUP_EFFECTS_V2_PLAN.md` đã pass các gate rollout Link và Triple adapter fixture liên quan.

1. Timeline: regroup → line qua ba tâm → exit effect → điểm/combo → reward visual đã commit → tiếp tục/popup.
2. Tối đa một line và ba ghost. Gameplay không phụ thuộc animation callback.
3. Các họ effect phải nhìn khác nhau: burn/finedust/crumble; portal/blackhole/implode; gravity/ghost; freeze; bubble; slice/collide/electric; split2/split4/split8/triangles/pixel/origami.
4. Effect tên split/pixel/crumble phải thể hiện đặc trưng tương ứng, không cùng một fade/scale. Fragment/particle có cap, cleanup, reduced-motion và fallback.
5. Coin/item flight chỉ chạy sau transaction commit; save fail không phát visual giả. Test kiểm recipe/timeline/cleanup, không chỉ class name.

**Pass:** phân biệt được các họ effect, đúng thứ tự, không long task/leak và cleanup về baseline.

### Continuation 6 — Milestone và kinh tế

1. Config/state/shell/persistence dùng 15/45; marker sinh từ config.
2. Áp dụng bảng reward, fallback inventory và công thức Xu đã khóa.
3. Test rollover, reload/Continue, Undo/Shuffle, inventory đầy, save fail, win trùng milestone cuối và không double grant.

**Pass:** HUD `0/45`, 15 marker, reward/Xu đúng một lần, popup khớp persistence và save cũ normalize an toàn.

### Continuation 7 — Web Acceptance

1. Chỉ bắt đầu sau Continuation 0–6.
2. Chạy `npm run check`, production build, Triple target suites và regression shared owner cho ba game.
3. Matrix UI mặc định duy nhất:
   - portrait `360×640`;
   - portrait `411×914`;
   - landscape `640×360`;
   - landscape `914×411`;
   - profile desktop landscape hiện có.
4. Không chạy/thêm `mobile-narrow 320×568` hoặc viewport nhỏ hơn nếu người dùng chưa cung cấp lỗi thật cần tái hiện. Quy tắc này áp dụng cho functional, geometry, screenshot, lifecycle và performance để tránh lãng phí thời gian/token.
5. Chơi thật Easy, board 75, Challenge stage 7, thắng/thua, theme/item/menu/popup/milestone; đo p50/p95, long task, DOM/heap và 20 chu kỳ lifecycle.
6. Không thực hiện PWA/APK/Android/signing/store QA.

**Pass:** không còn P0/P1 hoặc lỗi nhìn thấy trong phạm vi, hai chuẩn mobile và desktop chơi mượt, không leak/regression và người dùng xác nhận trải nghiệm web.

## Edge cases bắt buộc

- Tile thứ 7 tạo bộ ba phải resolve trước khi xét tray full; nếu không tạo bộ ba thì thua đúng một lần.
- Tile dưới nhiều blocker chỉ mở sau blocker cuối; tile disabled không phát command hoặc tăng Moves/Miss.
- Tap nhanh/multi-touch trong flight/regroup/line/delete; restart/switch/menu giữa mọi phase.
- Match cuối đồng thời milestone/Lucky/win; queue phải settle theo thứ tự đã khóa.
- Undo sau match, Shuffle, reload/Continue và inventory đầy không double grant.
- Promise/worker/callback round cũ không sửa round mới.
- Ảnh dọc/ngang/trong suốt/lỗi/tải chậm không đổi geometry.
- Orientation không đổi seed/slot/layer/cover graph/tray và không chạy generator/solver lại.
- Background/resume, reduced motion, fullscreen và save failure/quota/revision conflict.

## Performance constraints

- Mục tiêu 60 FPS; chỉ đánh dấu pass sau khi đo.
- Tap → phản hồi visual p95 ≤ 50 ms; reducer 75 tile p95 ≤ 4 ms; exposure p95 ≤ 3 ms; DOM patch p95 ≤ 8 ms.
- Không long task >50 ms trong lượt chuẩn.
- Solver Easy 18 p95 ≤20 ms; Hard 54 p95 ≤150 ms; 75 p95 ≤400 ms trên worker; timeout cứng 750 ms/attempt.
- Board + tray 75 tile mục tiêu ≤225 DOM element; một `img` cho mỗi tile đang render.
- Không allocation theo frame, animation layout, blur/filter vùng lớn, persistence write theo tick/frame hoặc cache/pool không giới hạn.
- Sau 20 chu kỳ, listener/timer/RAF/worker/node/heap trở về baseline trong sai số đã ghi.

## Acceptance criteria

- [ ] Chỉ một contract 18/36/54/75, Challenge 7 stage và milestone 15/45 còn hoạt động.
- [ ] Layout V4 có silhouette nhiều lớp, half-card offset, cover graph đúng và UI witness hoàn thành.
- [ ] V1/V2/V3 Continue đúng; không diễn giải save cũ bằng V4.
- [ ] Ảnh dùng `contain`, không crop; board/tray fit đúng matrix viewport.
- [ ] Khay 7 ô không co giãn; flight/regroup đúng slot và cleanup.
- [ ] Menu/picker/theme/HUD/timer/popup đầu-cuối đầy đủ và đồng bộ.
- [ ] Effect adapter tạo khác biệt thị giác thật, timeline hữu hạn và không leak.
- [ ] Lucky, milestone, Xu/item transaction commit/rollback đúng một lần.
- [ ] Không callback/listener/timer/RAF/worker/node stale sau restart/switch/orientation.
- [ ] Memory Match và Link Connect không regression.
- [ ] Check, build, test mục tiêu, số đo và web playtest đều pass.
- [ ] Không chạy đóng gói trước Web Acceptance và yêu cầu riêng của người dùng.

## Do not do

- Không quay về 12/24/36/60, Challenge 48 hoặc milestone 10/30.
- Không dùng `object-fit: cover`, DOM/z-index làm nguồn cover graph hoặc forced reflow để sửa flight.
- Không làm yếu test, tăng timeout hoặc thu nhỏ thẻ chỉ để pass.
- Không rebuild toàn board khi chỉ HUD/timer/tray/tile thay đổi.
- Không dùng timeout/sleep che race, callback animation quyết định gameplay hoặc catch rỗng che invariant.
- Không thêm nhánh Triple rải trong controller Memory/Link; dùng adapter/capability.
- Không đổi schema/API/save cũ nếu chưa có migration + test.
- Không trộn nhiều continuation trong một diff hoặc dọn file ngoài owner của gate.
- Không coi game mở được, check/build pass hoặc một thiết bị chưa thấy lỗi là Web Acceptance.
