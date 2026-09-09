# Đánh giá sẵn sàng & kế hoạch triển khai Triple Connect

Ngày đánh giá: 2026-09-09

## 1. Kết luận điều hành

**Trạng thái: GO có điều kiện.** Kiến trúc Game Shell, catalog, session và renderer hiện tại đủ nền tảng để thêm game thứ ba, nhưng chưa nên bắt đầu nối Triple Connect vào menu chính cho đến khi Gate 0 hoàn tất.

Các điều kiện bắt buộc trước khi triển khai:

1. Khôi phục baseline `npm run check` về xanh.
2. Sửa hai lỗi lifecycle hiện hữu và chạy lại test mount/restart.
3. Chốt ba quy tắc còn có thể hiểu khác nhau: ngưỡng thua khi khay đã mở rộng, quy tắc Miss theo “chuỗi đang gom”, và hành vi Hoàn tác khi vị trí cũ bị che.
4. Chốt ngân sách hiệu suất và bộ dữ liệu seed để benchmark solver.

Không nên sao chép `linkController.js` hoặc `linkRenderer.js`. Hai module này đã lớn; Triple cần state/controller/board/renderer riêng và chỉ dùng các hợp đồng chung ổn định.

## 2. Baseline đã kiểm tra

### Build và kích thước hiện tại

- Production build: **thành công**, 83 module được chuyển đổi trong khoảng 5,17 giây.
- JavaScript đầu vào chính: **318,68 kB**, gzip **84,77 kB**.
- CSS đầu vào chính: **163,24 kB**, gzip **30,64 kB**.
- Toàn bộ `dist`: khoảng **16,10 MB**, 1.858 file.
- `public/assets`: khoảng **15,61 MB**, 1.851 file; manifest hiện lập chỉ mục 1.832 ảnh theme.
- Worktree sạch sau các phép kiểm tra.

### Chất lượng hiện tại

- `npm run check`: **không đạt** tại `check-memory-special.mjs`; `style.css` thiếu khai báo `gap: var(--shell-layout-gap)` mà contract đang yêu cầu.
- Các bước đã qua trước điểm dừng: cú pháp JS, catalog chung, migration tồn kho Hint, session timing, persistence/transaction và PWA.
- Playwright desktop audit/lifecycle: **5/7 đạt**.
- Hai lỗi hiện hữu:
  - trạng thái `paused` không còn sau chuỗi 20 mount;
  - restart round gặp active scope rỗng nên không đọc được `diagnostics()`.

Baseline này phải được lưu lại trước khi thêm bất kỳ mã Triple nào để lỗi mới không bị trộn với nợ kỹ thuật cũ.

## 3. Đánh giá kiến trúc

### Phần có thể tái sử dụng an toàn

- Game Shell: sáu vùng semantic, mount/unmount, layout, HUD patch, effect registry.
- `gameCatalog.js`: metadata game và mode.
- `sessionProgress.js`/`sessionTiming.js`: hợp đồng phiên theo game/mode, sau khi mở rộng normalizer cho snapshot Triple.
- Persistence một gói có revision và transaction.
- Theme/catalog ảnh, quyền sở hữu theme, Xu, settings, modal, âm thanh, popup và responsive tokens.
- Registry hiệu ứng đường nối/xóa thẻ nếu được đưa ra interface trung lập theo game.

### Phần đang gắn cứng hai game và phải tổng quát hóa

- `gameState.js` chỉ khởi tạo/hydrate `memoryMatch` và `linkConnect`.
- `appearance.js` ánh xạ mọi game không phải Link về Memory; nếu thêm Triple trực tiếp sẽ dùng sai namespace theme.
- `gameSelector.js`, `mainmenu.js`, `main.js` và `shop.js` có callback/nhánh riêng cho Memory/Link.
- Một số test chọn controller, selector và shop bằng toán tử hai nhánh; thêm game thứ ba sẽ làm nhánh mặc định trỏ sai.
- Bundle hiện tải một entry JS/CSS lớn; import tĩnh toàn bộ Triple sẽ tăng chi phí khởi động cho người chỉ chơi hai game cũ.

### Hướng kiến trúc đề xuất

```text
Game definition/adapter registry
        |
        +-- Memory adapter -> controller/shell/items hiện có
        +-- Link adapter   -> controller/shell/items hiện có
        +-- Triple adapter -> tripleController/tripleShell/tripleItems
                                  |
                                  +-- pure triple rules
                                  +-- board generator + solver worker/fallback
                                  +-- keyed renderer + tray renderer
```

Registry chỉ chứa callback điều hướng và metadata. Luật chơi, snapshot ván, board, solver và inventory Triple không đi vào module của Memory/Link.

## 4. Rủi ro và biện pháp kiểm soát

| Mức | Rủi ro | Tác động | Kiểm soát |
| --- | --- | --- | --- |
| Critical | Solver/generator nổ tổ hợp ở bàn 60 thẻ, nhất là sau xáo | Treo UI, nóng máy, màn không sinh được | solution-first; memoization; giới hạn node/thời gian/attempt; seed tái hiện; chạy worker khi cần; fallback sang layout đã xác nhận |
| Critical | Màn “có lời giải” nhưng solver mô phỏng khác luật runtime | Người chơi bị kẹt dù test pass | Một reducer luật thuần dùng chung cho runtime, generator và solver; property tests kiểm toàn vẹn |
| High | Lifecycle hiện chưa ổn định | timer/callback cũ sửa round mới, leak sau đổi game | sửa Gate 0; mọi async qua shell scope/`roundId`; test mount/restart/switch 20 lần |
| High | Tích hợp persistence làm mất hoặc ghi sai dữ liệu hai game cũ | mất tiến trình/tồn kho | thêm namespace `tripleConnect`; migration tương thích ngược; round-trip fixtures; rollback transaction |
| High | Logic selector/shop/appearance hai nhánh mặc định sai game | mở sai menu, sai kho/theme | adapter registry và mapping catalog; không dùng `else => Memory/Link` |
| High | Board nhiều lớp gây overlap/touch sai trên mobile | chọn nhầm thẻ, không chơi được | geometry thuần; hit target theo slot; kiểm 320x568, 390x844, landscape, safe area và thiết bị thật |
| High | Race khi thẻ bay vào khay, nhóm/xóa ba và người dùng tap nhanh | duplicate/remove sai, thua giả | transaction lượt; khóa ngắn theo phase; kiểm `roundId`; ưu tiên resolve bộ ba trước overflow |
| Medium | 60 ảnh DOM cùng shadow/animation và effect ba thẻ | drop frame, layout thrash | keyed patch; transform/opacity; đọc geometry theo batch; không dựng lại board khi HUD đổi; reduced motion |
| Medium | Undo đưa thẻ lên trên làm thay đổi đồ thị che phủ | phá lời giải hoặc tạo exploit | chốt luật; ưu tiên khôi phục snapshot layer chính xác hoặc solver kiểm lại trạng thái |
| Medium | Bundle đầu vào tăng vì import tĩnh game thứ ba | chậm tải lần đầu | dynamic import adapter Triple; CSS scope riêng; đo gzip ở mỗi gate |
| Medium | 1.832 ảnh theme được index/copy | build và storage tăng | không nhân bản asset; chỉ tham chiếu manifest chung; lazy-load ảnh theo màn |

## 5. Ba quyết định sản phẩm cần chốt trước khi viết luật

1. **Khay mở rộng:** đề xuất ngưỡng thua là số ô đang hoạt động (7 bình thường, 10 sau khi mở rộng), sau khi ưu tiên resolve bộ ba. Nếu vẫn thua ở 7 thì vật phẩm mở rộng không có tác dụng thực tế.
2. **Miss:** đề xuất lưu `streakType` và `streakCount` độc lập với việc tự nhóm khay. Chọn loại khác khi `streakCount` là 1 hoặc 2 tạo đúng một Miss rồi bắt đầu chuỗi mới; hoàn tất bộ ba đặt chuỗi về rỗng. Cần bổ sung bảng ví dụ cho `A-B-A`, `A-A-B-B-A`, và bộ ba hình thành từ thẻ đã có trong khay.
3. **Hoàn tác:** đề xuất trả tile về đúng slot/layer và tính lại exposed state, không tự nâng lên trên cùng. Nếu slot không thể phục hồi hợp lệ thì từ chối Undo và không trừ vật phẩm. Cách “đặt lên trên” phải được solver coi là một phép đổi board nếu vẫn giữ.

Các giá/mốc sao/tần suất lucky card có thể để sau vertical slice vì là tuning, không chặn kiến trúc lõi.

## 6. Ngân sách hiệu suất đề xuất

Đo trên production build, Chrome Android tầm trung và desktop; lưu p50/p95, không chỉ một lần chạy.

| Hạng mục | Gate chấp nhận |
| --- | --- |
| Tap đến phản hồi chọn thẻ | p95 <= 50 ms; phản hồi trực quan trong frame kế tiếp |
| Reducer một lượt | p95 <= 4 ms với 60 thẻ |
| Tính exposed state sau một lần xóa | p95 <= 3 ms; chỉ xét các slot có quan hệ che phủ |
| Patch DOM một lượt | p95 <= 8 ms; không rebuild toàn board |
| Animation | không có long task > 50 ms trong lượt chuẩn; mục tiêu 55–60 FPS, tối thiểu ổn định 30 FPS máy thấp |
| Solver easy 12 thẻ | p95 <= 20 ms |
| Solver hard 36 thẻ | p95 <= 100 ms |
| Solver 60 thẻ | p95 <= 300 ms trên worker; hard timeout 750 ms/attempt |
| Sinh lại/xáo | tối đa số attempt cấu hình; thất bại dùng layout đã xác nhận, không khóa UI vô hạn |
| DOM board + khay | <= 180 element ở bàn 60 thẻ; một `img` cho mỗi tile đang render |
| Heap sau 20 mount/unmount | trở về gần baseline; không còn timer/RAF/listener thuộc round cũ |
| Tăng JS gzip | vertical slice <= 25 kB; bản đầy đủ mục tiêu <= 45 kB; vượt phải review/code-split |
| Tăng CSS gzip | <= 8 kB |

## 7. Kế hoạch triển khai theo gate

### Gate 0 — Ổn định baseline

1. Sửa contract gap Memory hoặc cập nhật contract nếu thay đổi CSS là chủ đích.
2. Chẩn đoán và sửa pause/scope lifecycle; xác nhận mount/unmount/restart/switch.
3. Chạy toàn bộ `npm run check`, audit, lifecycle, layout và visual hiện hữu ở bốn viewport.
4. Lưu số đo build/DOM/heap hiện tại làm baseline.

**Hoàn tất khi:** check xanh, test hiện hữu xanh, build web xanh và không có diff visual ngoài thay đổi đã duyệt.

### Gate 1 — Luật thuần và mô hình dữ liệu

1. Tạo `tripleConfig.js`, `tripleRules.js`, `tripleState.js` và schema snapshot.
2. Định nghĩa tile/slot/layer/cover graph/tray bằng dữ liệu thuần, ID ổn định.
3. Viết reducer cho select, tray grouping, resolve triple, Miss/combo/score, win/lose và Undo.
4. Viết invariant/property tests: tổng tile luôn chia hết cho 3; không tile trùng/mất; tile chỉ ở board hoặc tray; resolve trước overflow; replay deterministic theo seed.

**Hoàn tất khi:** luật chạy không DOM, replay cùng seed cho cùng kết quả, coverage đủ mọi bảng chuyển trạng thái.

### Gate 2 — Generator và solver

1. Tạo layout template 12 thẻ/2 lớp trước; precompute quan hệ che phủ giữa slot.
2. Sinh solution-first từ chuỗi bộ ba hợp lệ, sau đó phân phối ngược lên layer.
3. Solver dùng đúng reducer runtime; canonicalize tray theo nhóm; memo hóa state; ưu tiên nước đi hoàn tất nhóm.
4. Thêm budget node/thời gian/attempt, telemetry development và seed lỗi.
5. Property test hàng nghìn seed easy; corpus cố định cho 24/36/60 thẻ; test shuffle và timeout/fallback.

**Hoàn tất khi:** mọi board phát hành có witness solution, không treo main thread, đạt ngân sách ở mục 6.

### Gate 3 — Vertical slice 12 thẻ

1. Tạo `tripleShell.js`, `tripleRenderer.js`, stylesheet scope riêng và adapter game.
2. Render keyed board/layer/tray một lần; patch theo instance ID.
3. Thêm chọn tile lộ, bay xuống khay, tự nhóm, line ba điểm, exit effect, thắng/thua.
4. Tích hợp HUD tối thiểu: Moves, Miss, Combo, Điểm, tiến trình bộ ba và timer.
5. Chưa nối shop, lucky card, endless/challenge hoặc 60 thẻ.

**Hoàn tất khi:** easy chơi trọn vòng trên desktop/mobile, reduced motion đúng, spam tap không phá state, 20 mount/unmount sạch.

### Gate 4 — Catalog, persistence và điều hướng

1. Thêm `triple-connect`/`tripleConnect` vào catalog và mapping rõ ràng.
2. Mở rộng hydrate/normalize/migration cho progress, items và sessions Triple.
3. Thay các nhánh selector/menu/shop/appearance hai game bằng registry hoặc mapping exhaustiveness.
4. Dynamic import adapter Triple khi người dùng chọn game.
5. Thêm test dữ liệu cũ không có Triple, dữ liệu lỗi, revision conflict và quota rollback.

**Hoàn tất khi:** bản lưu cũ mở bình thường; ba game đổi qua lại không lẫn state; reload/continue theo từng mode chính xác.

### Gate 5 — Responsive và các mode lớn

1. Mở lần lượt 24/3 lớp, 36/4 lớp, 60/5 lớp; mỗi mức phải qua solver/perf trước mức kế.
2. Thêm normal/hard/superHard, sau đó endless, cuối cùng challenge.
3. Tích hợp sao, thưởng Xu, popup đầu/tổng kết/hết giờ, pause và audio.
4. Kiểm keyboard/focus, touch target, safe area, fullscreen/orientation và ảnh lỗi/lazy-load.

**Hoàn tất khi:** bốn viewport tự động xanh, bàn 60 thẻ đạt budget, chơi thử điện thoại thật không overflow/tap sai/drop frame nghiêm trọng.

### Gate 6 — Vật phẩm

Thứ tự giảm rủi ro: Gợi ý -> Mở rộng khay -> Thêm thời gian -> Hoàn tác -> Xáo thẻ.

1. Mỗi vật phẩm có command thuần, inventory transaction và test không trừ khi hành động thất bại.
2. Hint chỉ đọc state; Expand là flag của round; Time không xuất hiện ở Endless.
3. Undo tuân theo quyết định ở mục 5 và có history giới hạn.
4. Shuffle giữ multiset tile, xóa undo history, chạy solver và rollback nguyên trạng nếu không tạo được board hợp lệ.

**Hoàn tất khi:** mua/dùng/reload/rollback đúng, không lẫn kho hai game, shuffle không tạo board vô nghiệm.

### Gate 7 — Cân bằng, phát hành và theo dõi

1. Chốt mốc sao, giá, thời gian, lucky frequency bằng dữ liệu chơi thử.
2. Chạy full check/UI/visual, production build web và Android sync/build.
3. Smoke test offline/PWA, upgrade dữ liệu, Android back button, pause/resume và thiết bị thật.
4. Phát hành sau feature flag; có thể tắt entry Triple mà không migration ngược hoặc ảnh hưởng hai game cũ.

**Hoàn tất khi:** không còn P0/P1, ngân sách đạt, QA sign-off, rollback đã diễn tập.

## 8. Ma trận kiểm thử tối thiểu

- Luật: 0/1/2/3 tile cùng loại, resolve khi tray vừa đầy, nhiều bộ ba có thể hình thành, Miss/combo, thắng sau match cuối.
- Exposure: che một phần/toàn phần, tile cùng layer, chuỗi mở khóa nhiều lớp, Undo.
- Solver: deterministic seed, unsolvable input, timeout, duplicate states, shuffle, 60 thẻ.
- Lifecycle: new/continue/replay/next/exit/switch/reload/background/resume, callback round cũ.
- Persistence: dữ liệu V1.1a cũ, field thiếu/sai kiểu/âm/quá giới hạn, quota, tab conflict.
- UI: 1024x900, 390x844, 320x568, 844x390; reduced motion; fullscreen; safe area; touch spam.
- Performance: tap/reducer/exposure/patch/solver/heap/bundle trên development và production.
- Tích hợp: shop/collection/theme/effect/sound/Xu của cả ba game; Memory và Link regression.

## 9. Phạm vi hoãn

- Thẻ đặc biệt và thẻ băng cho Triple.
- Biến thể luật/layer ngoài cấu hình đã duyệt.
- Tối ưu native riêng nếu benchmark web chưa chứng minh nhu cầu.
- Điều chỉnh giá/mốc sao/tần suất lucky trước khi có playtest.

## 10. Thứ tự thực hiện khuyến nghị

`Gate 0 -> quyết định sản phẩm -> Gate 1 -> Gate 2 -> Gate 3 -> review vertical slice -> Gate 4 -> Gate 5 -> Gate 6 -> Gate 7`.

Không mở game trong selector đại trà trước khi Gate 3 và Gate 4 cùng đạt. Không triển khai bàn 60 thẻ hoặc Shuffle trước khi solver có telemetry, timeout và corpus benchmark.
