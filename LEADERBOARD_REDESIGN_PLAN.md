# Kế hoạch làm lại bảng xếp hạng

Ngày: 2026-10-14. Trạng thái: đã lập kế hoạch và vẽ nền; chưa triển khai UI hoặc dữ liệu hồ sơ. Đây là kế hoạch triển khai hiện hành duy nhất. EFFECTS_LEADERBOARD_PLAN.md là hồ sơ Gate1–3 đã hoàn tất ở phạm vi code/browser, còn QA thiết bị thật.

## 1. Mục tiêu và phạm vi

Làm lại bảng xếp hạng theo phong cách Vườn đêm, nội dung dành cho người chơi, đủ gọn trên Galaxy S22 Ultra 412×915. Giữ luật xếp hạng, kỷ lục, phiên chơi, Xu/vật phẩm và cơ chế gửi offline đang hoạt động.

- Không thêm cấp người chơi hoặc XP.
- Không thêm bảng chung cộng điểm của ba trò; tiếp tục tách theo trò/chế độ.
- Không làm lại gameplay, effect, dock dùng chung hoặc hệ thống đăng nhập.
- Không push/deploy Hosting, Firebase hoặc build APK trong phạm vi thiết kế.
- Theo dõi ngày tham gia và tổng thời gian chơi trong hồ sơ riêng, ở phase tách biệt sau UI. Không đưa hai dữ liệu này vào bảng public.
- Không xây mới hệ thống quản lý admin. Tích hợp màn quản lý cần nguồn và cơ chế quyền của hệ thống đó; repository hiện chưa có màn quản lý/role admin được xác minh.

## 2. Nguồn thiết kế và quyết định

- `docs/design/leaderboard/leaderboard-reference.png`: ảnh minh họa đã được người dùng đánh giá tốt hơn. Đây là tham chiếu mỹ thuật, không phải nguồn luật hoặc dữ liệu thật.
- `docs/design/leaderboard/night-garden-background-master.png`: nền mới, không chứa UI/chữ, nguồn PNG để xuất bản runtime sau.
- Điều chỉnh sau ảnh tham chiếu: chuyển ô chọn màn xuống cạnh phân trang; giữ phân trang ở giữa. Đặt nhãn nhỏ Màn N ở đầu bảng để vẫn nhận biết bảng đang xem.
- Việc chuyển ô chọn màn là phương án từ trao đổi gần nhất, được dùng làm mặc định của kế hoạch; không coi ảnh cũ đã minh họa chính xác footer mới.
- Không giữ wordmark MEMORY MATCH ADVENTURE phía trên; vẫn giữ ba tab chọn trò vì đây là chức năng.
- Chế độ normal hiện có nhãn Trung bình. Giữ nhãn catalog này trong runtime để nhất quán; ảnh tham chiếu dùng Thường chỉ là cách viết trên ảnh, không đổi ID hay nhãn toàn sản phẩm trong task này.

## 3. Bố cục cuối

### Header và bộ lọc

1. Header: icon cúp, Bảng xếp hạng; nút làm mới bằng icon và nút đóng theo navigation hiện tại. Không subtitle hoặc nhãn thương hiệu.
2. Ba tab: Memory Match / Link Connect / Triple Connect. Mở từ bản đồ dùng đúng trò; Home nhớ lựa chọn trong phiên theo hành vi hiện có.
3. Sáu nút nhỏ trên một hàng: Dễ / Trung bình / Khó / Siêu khó / Thử thách / Vô tận. Cuộn ngang bằng touch, wheel/trackpad và keyboard, ẩn thanh cuộn, không xuống hàng. Khi đổi chế độ hoặc focus bằng keyboard, đưa nút tương ứng vào vùng nhìn thấy; reduced-motion dùng cuộn tức thời.
4. Thu nhỏ hình thức, nhưng vùng bấm tối thiểu 44×44 CSS px. Không thêm hàng chữ Chế độ chơi hay hướng dẫn vuốt. Fade nhẹ ở mép khi còn nội dung, không cản pointer/focus.

### Bảng thành tích

- Màn thường: nhãn ngữ cảnh Màn N ở đầu bảng; cột Hạng / Người chơi / Thời gian. Hiển thị `mm:ss,cc`, không nối thêm giây vào từng dòng; từ 60 phút dùng `h:mm:ss,cc`. Làm tròn một lần đến centisecond để không xuất hiện giây 60 sai định dạng.
- Thử thách/Vô tận: cột Hạng / Người chơi / Màn / Điểm, hai số thành hai cột. Màn là số màn đã thắng trong lượt, không phải màn đang chơi.
- Tối đa 10 người/trang; top3 có huy hiệu nhỏ ngay trong dòng, không dựng podium riêng.
- Avatar dùng nguồn hợp lệ hiện có; khi chưa có nguồn ảnh công khai đã xác minh, dùng avatar dự phòng nhất quán. Không tự thêm trường ảnh vào record public chỉ để giống ảnh minh họa.
- Tên dài ellipsis và có tên đầy đủ cho accessibility; số căn phải, tabular numerals. Không nhét tên qua innerHTML.
- Dòng của chính chủ có viền/điểm nhấn vàng; vẫn giữ tên thật đã lưu, có thể thêm nhãn Bạn gọn khi cần nhận diện, không che tên.
- Không có 1–10 người chơi, Đã cập nhật, Kỷ lục đã tải gần đây hoặc một card lặp lại thành tích ngay dưới dòng của mình.
- Nếu chính chủ không nằm trong trang hiện tại và có kỷ lục riêng: một dòng gọn Thành tích của bạn nằm sau danh sách, không gán số hạng khi chưa biết và không tính vào 10 người. Nếu chưa có kỷ lục: không tạo card trống.

### Footer và chọn màn

- Một hàng dưới bảng: ô Màn N ở trái; cụm phân trang căn giữa theo chiều rộng panel, không căn giữa tổng hai cụm. Dùng grid ba cột cân đối, hai vùng biên cùng kích thước.
- Mobile: nút trước / Trang N / nút sau. Không hiển thị N/tổng khi chưa biết tổng số trang. Desktop có thể thêm số trang đã có cursor nếu còn chỗ mà không làm lệch tâm.
- Ô chọn màn giới hạn chiều rộng; số dài rút gọn khi cần và tên đầy đủ trong accessible label. Ẩn toàn bộ ô ở Thử thách/Vô tận, vị trí pager không thay đổi.
- Viewport thấp hoặc nội dung dài: danh sách cuộn riêng, header/footer/dock giữ ổn định, không chồng footer vào hàng cuối. Không ép nhét 10 dòng vào chiều cao thiếu.
- Bấm Màn N mở picker gọn có ô nhập số và nút Xem. Có thể nhập 212 rồi Enter/Xem, không sinh danh sách DOM từ 1 đến màn tối đa.
- Chấp nhận số nguyên từ 1 đến MAX_ADVENTURE_LEVEL theo contract; không tự giới hạn ở frontier, không cấm xem bảng màn chưa chơi. Màn hợp lệ chưa có dữ liệu trả trạng thái trống.
- Từ chối 0, âm, số thập phân, vượt giới hạn, ký tự lạ; giữ bảng hiện tại đến khi xác nhận hợp lệ. Không query khi mỗi ký tự được gõ.
- Đổi màn/mode/trò trở về trang1; refresh trở về trang1 theo contract hiện có. Đóng picker không đổi bảng; focus trả về ô chọn màn. Picker không làm mất owner của leaderboard.

### Trạng thái vận hành

- Loading chỉ hiển thị trong vùng dữ liệu; aria-busy và aria-live có owner rõ. Không bố trí một dòng status thường trực chiếm chỗ khi thành công.
- Empty: Chưa có thành tích.
- Offline: Chưa có kết nối. Nút thử lại/làm mới khi phù hợp; giữ dữ liệu cache đúng bảng, không trình bày dữ liệu bảng cũ như bảng mới.
- Error: Chưa tải được bảng. Thử lại. Không hiển thị mã lỗi nội bộ.
- Disabled ở biên trang và lúc đang tải; chống thao tác liên tiếp tạo trang không hợp lệ. Response cũ không ghi UI sau đổi bộ lọc, UID hoặc đóng.

## 4. Dữ liệu và ownership phải giữ

- `leaderboardPanel.js`: cấu trúc và tương tác, lifecycle/request generation, picker và presentation.
- `leaderboardStore.js`: truy vấn/cursor/cache, không đưa logic DOM vào store. `leaderboardService.js`: flush/outbox best-only giữ nguyên.
- Board thường: game/mode/level, duration tăng dần. Board lượt v2: levelReached giảm dần rồi totalScore giảm dần; UID cuối cùng để ổn định.
- Query 11, render10; cursor sau người thứ10; cache12 board×5 trang, TTL120s, refresh15s, cursor giới hạn100 trang. Không thêm count query/realtime polling chỉ để trang đẹp hơn.
- Không đổi board ID, Rules/schema public, API gameplay hoặc save vì thay bố cục. Không sửa logic checkpoint/restart và không nhập lại dữ liệu v1.
- CSS leaderboard tách owner rõ khỏi block trong adventure.css; xóa/move đúng selector cũ để tránh hai owner, không dọn CSS ngoài phạm vi.
- Nền tĩnh thuộc subtree leaderboard, dispose theo page/modal; không thêm sao băng/RAF/timer, không sửa backgroundEffects.js.

## 5. Nền Vườn đêm và tài nguyên

- Nền đã vẽ: lá xanh đậm quanh góc, chút ánh vàng, vùng giữa tối và trống. Bảng có surface tối ổn định và overlay nhẹ để chữ không phụ thuộc độ sáng nền.
- So sánh hai cách: một nền dọc cover cho mọi viewport đơn giản nhưng desktop crop dễ mất lá; nền dọc kết hợp màu nền và object-position theo viewport giữ chi phí thấp hơn nhiều ảnh gần giống. Chọn cách thứ hai, chỉ tạo bản ngang riêng khi visual QA chứng minh crop không đạt.
- Phase triển khai xuất WebP từ nguồn PNG, mobile tối đa khoảng 1080px chiều rộng; mục tiêu ≤350KB, ngân sách decode ≤12MB cho bản mobile. Nếu cần hạ kích thước/chất lượng, kiểm tra lá/gradient không banding trước khi chấp nhận.
- Nguồn master và prompt nằm trong docs/design, không import vào bundle. Runtime dùng tên ổn định `public/assets/images/backgrounds/leaderboard-night-garden.webp`.
- Fallback gradient cùng palette khi ảnh lỗi; không chặn mở bảng để đợi ảnh. Không blur/filter lớn toàn màn hình, không decode lại qua mỗi lần đổi mode/trang.
- Kiểm tra crop ở 412×915, landscape844×390 và desktop1024×900; tâm bảng ít chi tiết, hàng chữ/nút không mất tương phản; safe-area bottom và dock rõ.

## 6. Phase triển khai và commit

Mỗi phase triển khai có commit riêng sau kiểm tra/diff. Lượt này chỉ tạo kế hoạch và ảnh, không coi phase UI đã hoàn thành.

### Phase 1 — Nền và shell trình bày

- Xuất/nén nền, tách CSS owner leaderboard, đặt background/fallback trong panel.
- Xây header, tabs trò, strip mode cuộn ngang, khung bảng có heading, footer ba vùng và dock hiện hữu.
- Không đổi truy vấn/luật. Kiểm visual ba viewport, hit target/focus, reduced-motion, ảnh lỗi và re-open.
- Gate: không tràn ngang toàn trang; footer/pager thật sự ở tâm; không còn selector owner trùng; source master không vào bundle; ảnh đáp ứng ngân sách.
- Commit dự kiến: `feat: restyle leaderboard with night garden background`.

### Phase 2 — Dòng thành tích và trạng thái

- Format thời gian/điểm thuần, huy hiệu top3, avatar dự phòng, self highlight, tách cột Màn/Điểm.
- Loại text nội bộ/card lặp; xử lý own ngoài trang, empty/loading/offline/error đúng phạm vi.
- Test format cạnh biên, tên dài/ký tự nguy hiểm, dữ liệu0/1/10/11/21, tie và trang cuối; không đổi ranking comparator.
- Gate: dữ liệu/sort giống baseline; mọi số/nhãn đúng; self ngoài trang không được bịa hạng; đủ10 dòng khi có10record, cuộn được khi thấp.
- Commit dự kiến: `feat: simplify leaderboard records and states`.

### Phase 3 — Picker màn và phân trang

- Đặt ô màn dưới bảng, nhãn ngữ cảnh đầu bảng, picker nhập số trực tiếp, Enter/Escape/close/focus return.
- Pager mobile ‹ Trang N › căn giữa; desktop chỉ dùng các trang đã biết. Không dùng mock tổng3 trang trong ảnh làm dữ liệu thật.
- Test nhập212, MAX hợp lệ, vượt giới hạn, hủy picker, chưa có thành tích; tất cả6mode×3game có đúng kiểu bảng.
- Test đổi nhanh trò/mode/màn, refresh, close khi query pending, đổi UID, offline/retry; response cũ bị bỏ; số request không tăng do gõ/sửa layout.
- Lặp30 lần mở/đóng và chuyển tab; node/listener/subscription không tăng sau cleanup. Regression outbox/checkpoint hiện có phải pass.
- Gate: frontend giữ nguyên API/schema public/save; UI/footer/picker đã khớp layout và không rò lifecycle.
- Commit dự kiến: `feat: add compact leaderboard stage picker and pager`.

### Phase 4 — Theo dõi hồ sơ riêng, tách khỏi ranking

Yêu cầu đã giữ lại: ngày tham gia và tổng thời gian chơi của một profile dùng chung cả ba trò; chính chủ và admin trên hệ thống quản lý được xem. Không có XP/cấp.

- Dùng `playMetrics.js` làm nguồn thời gian active; loại startup, pause/menu, tab ẩn. Tính cả lượt thắng/thua/chơi lại vì đây là thời gian đã chơi, không chỉ tổng thời gian các kỷ lục.
- Không tạo clock thứ hai. Hiện subscriber segments phục vụ analytics và buffer không phải nguồn durable: không cộng từ bestByLevel hoặc tái sử dụng buffer như sổ thời gian.
- Trước code data, xác định contract delta/checkpoint với session và profile owner: cùng đoạn không được cộng hai lần do finish+cleanup, retry, reload hoặc đổi UID. Thời gian chưa commit cần một checkpoint phục hồi, không ghi mỗi frame/tick. Giới hạn mất đoạn do hard-kill phải ghi và test rõ.
- Cân nhắc hai phương án đồng bộ: tổng duy nhất trong snapshot dễ nhưng snapshot cũ có thể làm mất thời gian giữa thiết bị; counter riêng theo thiết bị/session có khóa idempotent rồi aggregate an toàn hơn. Ưu tiên phương án counter có giới hạn/compaction rõ, không ledger tăng vô hạn; chỉ chốt schema sau khi đọc đủ private cloud contract. Không lấy max(total) để giả vờ đã cộng đủ nhiều thiết bị.
- Ngày tham gia online lấy thời điểm tạo tài khoản từ nguồn Auth đáng tin cậy, không lấy ngày đăng nhập gần nhất hoặc ngày cài lại. Guest liên kết Google cùng UID giữ ngày; đổi sang UID khác theo tài khoản tương ứng. Hồ sơ chỉ local có ngày tạo hồ sơ local riêng, không gán thành ngày tạo tài khoản online.
- Với dữ liệu cũ thiếu tổng thời gian: không dựng lịch sử từ kỷ lục; bắt đầu theo dõi từ ngày triển khai và hiển thị mốc Từ ngày… để không gây hiểu nhầm. Ngày tham gia không được bịa nếu nguồn cũ thiếu.
- UI profile: Tham gia: dd/mm/yyyy; Thời gian chơi: X giờ Y phút; chỉ hiển thị profile hiện tại. Model lưu milliseconds nguyên không âm và timestamp chuẩn, normalize/migration bổ sung idempotent.
- Dữ liệu riêng không nằm trong document leaderboard public. Quyền admin phải từ trusted claim/backend, không flag người dùng tự ghi; chưa có hệ thống admin thì không mở rule đọc rộng hoặc xây màn giả. Ghi rõ phần tích hợp quản lý ngoài repo còn chờ nguồn hệ thống.
- Gate: old/missing/corruptdata, multi-device, retry/offline/reload, guest link/UID switch, pause/hidden/thua/restart, save failure/rollback; owner/admin/khác quyền đọc phải được emulator chứng minh trước backend deploy.
- Commit riêng profile và quyền dữ liệu nếu triển khai, không trộn với thay mỹ thuật ranking.

### Phase 5 — Review và nghiệm thu cuối

- Đọc diff đối chiếu mọi tiêu chí; review và implementation là hai bước riêng, chạy lại kiểm thử trọng yếu, không chỉ tin báo cáo trước đó.
- Chạy `npm run check`, `npm run build`; build Android wrapper khi chạm đường asset/runtime ảnh dùng chung, không build APK.
- Contract mục tiêu: check-leaderboard, ranking-rules, ranking-checkpoints, play-metrics; chapter/persistence/cloud tests nếu làm phase profile.
- Browser: leaderboard.spec.js, leaderboard-layout.spec.js, firebase-account.spec.js; regression navigation/cleanup liên quan. Layout test phải thật sự chạy412×915,844×390,1024×900, lưu ý config hiện không tự nhân leaderboard-layout sang project mobile.
- Emulator Rules/query kiểm khi có thay backend/profile; không deploy để chạy test.
- Ảnh nghiệm thu bản runtime cho time/run,212, own ngoài trang, tên dài, picker, trang cuối và offline. So sánh với mẫu theo hierarchy/palette/spacing, không sao chép tên/thành tích giả vào production.
- Kiểm ảnh không tạo loop và không tăng decode/request sau30lần mở; nếu đo frame time/heap phải ghi browser/DPR/scenario và kết quả thật, không tuyên bố60FPS từ headless desktop.
- Galaxy S22 Ultra thật: hiện chưa có thiết bị/remote debugging, nghiệm thu thực tế còn chờ theo xác nhận trước. Không đánh dấu pass thay bằng mô phỏng.
- Báo file/commit, pass/fail/skipped, ngân sách asset, schema/API có đổi hay không và phần admin/device chưa xác minh.

## 7. Checklist nghiệm thu sản phẩm

- [ ] Không có wordmark thừa, mô tả nội bộ hoặc XP/cấp.
- [ ] Một hàng6mode cuộn ngang, scrollbar ẩn, touch/keyboard hoạt động.
- [ ] Time/run đúng cột, sort đúng contract và top3/self rõ.
- [ ] Ô chọn màn cạnh pager phía dưới; nhập212 trực tiếp; nhãn đầu bảng đúng màn hiện tại.
- [ ] Pager ở tâm panel, không bịa tổng số trang, không tràn/chồng nhau.
- [ ] Empty/loading/error/offline/own ngoài trang không làm nhầm bảng hoặc hạng.
- [ ] Background tĩnh đủ tối; fallback/crop/asset budgets đạt, không vào gameplay.
- [ ] Không đổi public ranking schema/board IDs/API/save vì UI.
- [ ] Nếu triển khai profile: thống kê riêng bền vững, migration/đồng bộ/quyền đã test; phần admin ngoài repo được ghi đúng trạng thái.
- [ ] Check/build/browser/review pass; QA thiết bị thật được báo đúng.

## 8. Kết quả của lượt lập kế hoạch

- Đã đọc renderer, store contract trong hồ sơ hiện hành, CSS owner, account panel/service, playMetrics và cấu hình test.
- Repo sạch trước thao tác. Chỉ tạo tài liệu và ảnh tham chiếu, cập nhật CONTEXT/nhãn hồ sơ cũ; không sửa runtime, Rules, schema hoặc dữ liệu.
- Nền dùng skill imagegen với built-in tool; đã kiểm hình ảnh: không chữ/UI, vùng giữa tối, lá ở mép. Chưa nén WebP/chưa đo crop trong runtime, các việc đó thuộc Phase1.

## 9. Tiến độ triển khai

- Phase1: nền WebP36.046byte,940×1672, decode6.287MB; CSS ranking có owner riêng, một hàngmode cuộn ngang, footer ở tâm. StaticJS/CSS pass; browser layout/18filters/scroll/stale4/4 pass ở412×915,640×360,1024×900. Đã đọc ảnh runtime mobile. Chưa thay presentation record/picker, thuộc Phase2–3.
- Phase2: format time có carry centisecond/hour, sốvi-VN; run tách hai cột, huy hiệu top3 và avatar dự phòng; success không có status/card lặp. Contract presentation/ranking pass; browser layout4/4 và count0/1/10/11+own trong/ngoài trang4/4 pass, tên public chỉ text.
