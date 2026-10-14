# Kế hoạch hiệu ứng nền và bảng xếp hạng

Ngày: 2026-10-13. Trạng thái: triển khai Gate1–3 và nghiệm thu browser/emulator đã hoàn tất. Nghiệm thu Galaxy S22 Ultra thật còn chờ theo xác nhận người dùng2026-10-14; không còn gate code đang mở. Từ2026-10-14 đây là hồ sơ đã hoàn tất ở phạm vi code/browser; kế hoạch triển khai hiện hành duy nhất là LEADERBOARD_REDESIGN_PLAN.md. Bố cục ranking mới theo kế hoạch đó thay mục Bố cục cũ dưới đây; luật checkpoint/query đã triển khai vẫn được giữ.

## 1. Phạm vi và dữ kiện đã xác minh

- Tối ưu sao băng, thiết kế lại xếp hạng; phân tích cảnh hoàn thành chặng trước khi quyết định sửa hình ảnh. Giữ dữ liệu cũ, luật thắng, mở khóa và thưởng. Quy tắc gửi/xếp hạng Thử thách/Vô tận thay đổi theo mục3.1 bên dưới, cần version tương thích riêng.
- backgroundEffects.js hiện tạo/xóa sao và đầu sáng, tối đa hai sao; có timer thu hồi từng sao. Chỉ kiểm tra cài đặt/tab ẩn/reduced-motion, chưa chặn gameplay; ẩn tab chưa thu hồi ngay sao đang bay.
- Cảnh hoa hiện tại có95 phần tử SVG, ba nhóm WAAPI hữu hạn5,2s với delay; cleanup theo scope. Âm thanh dùng HTMLAudioElement tái sử dụng.
- Luồng hiện tại: pháo hoa → tổng kết/confetti → bấm chúc mừng → hoa; cần đo phần confetti còn lại khi chuyển nhanh. fireworkEffect.js còn RAF/timer tự quản và wrapper confetti cần cancel handle của riêng lượt.
- Xếp hạng online hiện dùng các select + top20 và kỷ lục riêng, chưa phân trang. Board thường riêng theo trò/độ khó/màn.

Mục tiêu: giảm cấp phát, giữ tài nguyên có giới hạn và kiểm chứng allocations/frame time/paint bằng profile. Chuyển động ưu tiên transform/opacity.

## 2. Gate1 — Sao băng có pool cố định

Dùng pool hai node + CSS animation. Singleton initialize idempotent vì hydrate hiện có thể gọi khởi tạo nhiều lần.

- Một container nền, đúng hai node sao giữ suốt app; đầu sáng dùng pseudo-element. Pool sở hữu IDLE/ACTIVE, listener và một scheduler callback tái sử dụng; không timer thu hồi riêng, không listener/closure mới mỗi lượt.
- Mỗi3,5–7s chọn node IDLE; bận cả hai thì bỏ lượt. Giữ nét vệt/độ sáng hiện có. Chuẩn bị tọa độ/kích thước lúc IDLE; chỉ animate transform/opacity trong pha ACTIVE. Pha xuất hiện ngắn → bay/mờ1,2–2,5s → IDLE; animationend/animationcancel lọc đúng target/name và không thu hồi lượt mới bằng event cũ. Không ép reflow để chạy lại.
- Page/navigation/shell lifecycle thông báo eligibility; chỉ Home/map được chạy. Vào startup/gameplay, tab ẩn, reduced-motion hoặc tắt hiệu ứng: hủy scheduler, trả cả hai node IDLE, ẩn container. Các tab chức năng/cảnh chiến thắng không phát sao. Không polling/MutationObserver theo DOM để đoán route.
- Giữ cài đặt Hiệu ứng nền đang điều khiển cả mây/sương; scene guard mới chỉ sở hữu sao băng.
- Listener cấp app đăng ký một lần, có dispose cho test/teardown; restart scheduler không nhân đôi. Không bật will-change toàn màn hình hoặc giữ layer khi IDLE nếu chưa có số đo.
- Chứng minh: danh tính hai node không đổi sau soak10 phút và100 lần chuyển menu/map/game; tối đa một timer; không sao ACTIVE/timer lúc bị chặn; bật/tắt nhanh và cancel gần animationend; heap không tăng dần. So sánh allocations/frame p95/long tasks và hình ảnh trước/sau.

## 3. Gate2 — Bảng xếp hạng toàn màn hình

### 3.1. Quy tắc Thử thách/Vô tận đã chốt bổ sung

- Áp dụng cho cả ba trò: sau mỗi màn thắng đã commit dữ liệu thành công, chụp thành tích bất biến và cập nhật kỷ lục.
- Ưu tiên số màn đã thắng trong đúng lượt (từ màn1, liên tiếp), rồi tổng điểm các màn thắng của lượt đó. Clear màn10 ghi10; đang chơi/thua màn11 vẫn giữ10 và điểm đến màn10. Không cộng điểm của màn chưa thắng hoặc kỷ lục từ lượt khác. Màn thường vẫn xếp thời gian riêng từng màn/độ khó.
- Snapshot thắng không finalize run: tiếp tục màn sau, mua giờ hoặc chơi lại giữ identity của lượt. Restart không gửi ngay; khi thắng lại, điểm màn hiện tại thay lần trước, không cộng lặp. Kỷ lục public best-only không giảm khi lượt mới/yếu hơn được ghi.
- Thua/thoát/kết thúc Thử thách chỉ đóng lượt theo luật hiện hữu; không gửi thêm điểm màn dở, không tạo record trùng checkpoint cuối. Thắng hết7 màn Thử thách Triple ghi7 như bình thường.
- Một kỷ lục mỗi UID/trò/mode, guest và Google đều dùng được; snapshot durable trước outbox, retry offline idempotent, giữ owner khi đổi tài khoản. Chỉ ghi khi có kỷ lục tốt hơn sau clear, không theo tick/score đang tăng; giữ batch/rate limit hiện có.
- Bảng Thử thách/Vô tận dùng version2 cho cả ba trò; board thời gian v1 giữ nguyên. Giữ nguyên dữ liệu/bảng v1 làm lịch sử. Chuẩn hóa session/run tương thích; chỉ nhập kỷ lục vào v2 khi có đủ dữ liệu các màn thắng, nếu thiếu thì lượt mới bắt đầu ghi v2. Giữ Xu/vật phẩm/tiến trình.
- Gate2 phải cập nhật rankingRules/rankingResult, serializer/normalizer, controller settlement, leaderboardService/store, Rules/indexes và kiểm thử phiên bản; tách bước logic/version khỏi bước UI. Đây là thay đổi dự kiến, chưa sửa runtime.

Nghiệm thu thêm: clear10→checkpoint10→restart10→clear lại→clear11; thua/mua giờ không nâng số màn thắng; điểm không cộng lặp; retry/reload/offline/đổi UID không gửi trùng hoặc sai owner; v1 không ghi vào v2; save thất bại không gửi; đủ sáu bảng hợp lệ cho cả ba trò.

### Bố cục

- Header Bảng xếp hạng, Exit như navigation hiện hành. Ba tab trên: Memory Match / Link Connect / Triple Connect; mở từ map mặc định đúng trò, mở Home nhớ lựa chọn gần nhất trong phiên.
- Sáu mục đều hoạt động cho cả ba trò: Dễ / Trung bình / Khó / Siêu khó / Thử thách / Vô tận. Mobile dùng3×2 để thấy đủ, C/B/A/S giữ nâu/xanh/vàng/tím. Thử thách/Vô tận dùng checkpoint màn thắng, không tự thêm luật thua.
- Màn thường có bộ chọn Màn hợp lệ, mặc định màn đang chọn hoặc frontier; Thử thách/Vô tận ẩn bộ chọn màn. Đổi bộ lọc về trang1.
- Danh sách tối đa10 người/trang: số thứ tự, avatar dự phòng, tên, thời gian hoặc màn/điểm. Top3 dùng huy hiệu nhỏ ngay trong dòng; tô dòng của mình, không thêm podium lặp dữ liệu. Kỷ lục của bạn riêng bên dưới, không tính thành người thứ11 và không giả số hạng toàn cục khi chưa có dữ liệu.
- Header/bộ lọc/pager/dock giữ ổn định; danh sách cuộn khi viewport thấp, ẩn thanh cuộn nhưng giữ touch/wheel/keyboard/focus. Nút44px, tên dài được giới hạn, số thẳng cột, empty/loading/offline/error rõ và không có giải thích kỹ thuật cho người chơi. Chuyển tab nhẹ, reduced-motion tĩnh.

### Dữ liệu và phân trang

Phân trang dùng cursor Firestore với cache giới hạn. Board thời gian/comparator giữ nguyên; bảng lượt dùng version2 và metric màn đã thắng theo mục3.1.

- Mỗi request tối đa11 entries, render10; mục dư chỉ xác định còn trang. Trang sau bắt đầu sau mục thứ10, không bỏ mất mục thăm dò. Sort time ASC hoặc levelReached DESC,totalScore DESC, cuối cùng UID/document ID ASC; cursor chứa đủ khóa.
- Pager Trước / Trang N / Sau, kèm nút số các trang đã có cursor; disable ở biên, không tự đoán tổng trang hoặc nhảy cuối khi chưa biết. Khi hết danh sách mới biết trang cuối; chưa thêm count query hoặc bảng tổng hợp chỉ để hiển thị tổng.
- Cache theo environment/board/UID/trang, tối đa12 board và5 trang gần nhất mỗi board; giữ cursor gọn cho tối đa100 trang/board, vượt giới hạn yêu cầu về trang1/làm mới. Kỷ lục riêng đọc một lần mỗi board/TTL, không mỗi trang. Không realtime listener cho danh sách, không polling; giữ TTL120s và giới hạn refresh15s.
- Tải trang giữ bộ lọc/cursor/scroll riêng của board, chỉ commit UI khi đúng request generation và UID; mở/đóng/đổi tab phải hủy owner và bỏ response cũ. Refresh xóa cursor/cache rồi về trang1. Các trang tải ở thời điểm khác nhau không phải snapshot nguyên tử: nếu phát hiện UID lặp hoặc thứ tự bất thường, đề nghị làm mới, không âm thầm bỏ dòng rồi gán hạng sai.
- Rules hiện giới hạn list≤20 nên request11 không cần nới quyền đọc. Mở quyền ghi đúng format bảng lượt v2/mode của ba trò, không mở rộng sang dữ liệu khác. Kiểm tra index thực tế, outbox/offline/best-only và receipt; thay format chỉ cho quy tắc checkpoint/version, không vì bố cục UI. Cùng metric dùng UID làm thứ tự hiển thị ổn định; không tự đổi luật đồng hạng/điểm phụ.

Nghiệm thu: fixtures0/1/10/11/20/21 người, trang cuối, tie UID, đổi bộ lọc nhanh/UID/offline, đóng khi đang tải, quota/cache và nội dung tên an toàn; emulator kiểm query/Rules. Layout412×915,640×360,1024×900; scrollbar ẩn vẫn thao tác được, focus/touch/reduced-motion. Giữ dữ liệu cũ, xác minh riêng quy tắc checkpoint mới.

## 4. Gate3 — Phân tích cảnh thắng, giữ mỹ thuật

Người dùng đã thử mobile và thấy mượt; chưa có bằng chứng cần thay cảnh. Giữ hoa SVG/âm nhạc/timeline hiện tại làm baseline, không giảm độ đẹp bằng chỉ tiêu số node tùy ý.

- Ghi trace toàn luồng thắng đủ100 màn: pháo hoa, tổng kết, confetti, hoa, idle, đóng sớm; đo từng pha và overlap. So sánh thiết bị mobile mục tiêu có bật hiệu ứng với reduced-motion; ghi browser/DPR/frame p95/long tasks/heap/layer/repaint, không suy FPS từ số node.
- Audit close/dispose/đổi game/tab ẩn30 vòng: cancel RAF/timer/animation đúng owner, không summary xuất hiện muộn hoặc tiếp tục lượt cũ; nhạc cảnh dừng/reset, không đóng hoặc phá tài nguyên âm thanh app. Nếu phát hiện leak/callback mồ côi, sửa ownership riêng, giữ nguyên hình ảnh.
- Hai hướng cân nhắc khi có bottleneck: (A) giữ SVG, tối ưu allocation/paint và hủy đúng lượt, ưu tiên; (B) raster một phần tĩnh, giữ nhóm chuyển động/ánh sáng, chỉ khi so sánh hình ảnh và số đo cho lợi ích rõ.
- Trước bất kỳ sửa effect nào: xác nhận điểm nhấn, timeline, property, particle/node cap, repaint, cancel và fallback. Asset/thay mỹ thuật cần quyết định riêng. Nếu baseline sạch và đạt trên thiết bị mục tiêu, kết luận không cần đổi hình hoa là kết quả hợp lệ.

## 5. Thực hiện và nguồn

Gate0 khảo sát/tài liệu hoàn tất; Gate1–3 đã triển khai/nghiệm thu browser và emulator; đo thiết bị thật được người dùng cho ghi còn chờ. Khi được giao code: thực hiện tuần tự, commit từng gate; unit/lifecycle và browser mục tiêu, check/build cuối cùng, review độc lập khi thay owner. Không deploy/push hoặc thay dữ liệu bằng task này.

Nguồn dự án: backgroundEffects.js/style.css; appPageLifecycle.js/gameShellLifecycle.js; victoryCelebration.js/victoryFlowerScene.js/fireworkEffect.js/victoryPresentation.web.js/ui.js/sound.js; leaderboardPanel.js/leaderboardStore.js/rankingResult.js/firestore.rules.

Nguồn kỹ thuật kiểm tra2026-10-13: [Animation và rendering](https://web.dev/articles/animations-guide), [Firestore query cursors](https://firebase.google.com/docs/firestore/query-data/query-cursors). Không coi các hướng dẫn này là số đo của dự án.


## Nhật ký thực hiện — 2026-10-14

### Gate1

Pool hai node, pseudo-element đầu sáng, IDLE/ACTIVE và một scheduler; eligibility trực tiếp từ page/navigation/game shell. Init/dispose idempotent; tab ẩn/reduced-motion/cài đặt thu hồi ngay. Không đổi save/API cũ hay điều khiển mây/sương.

Browser Chrome155 Windows, viewport412×915/DPR1: 4/4 tests pass, gồm soak CSS animation thật10 phút (114 lần kết thúc),100 lần Home/map/startup/gameplay thật qua ba trò, visibility và stale animationend. Danh tính hai node giữ nguyên; tối đa một timer; post-GC heap6.962→7.044MB, phút2–10 dao động15.120bytes. Đây là số đo browser trên máy tính, không phải FPS/heap của Galaxy S22 Ultra.

So sánh hai cửa sổ35s: baseline tạo6/xóa5 node sao; pool tạo0/xóa0. Frame p95 cả hai8,1ms, không long task; phép đo không chứng minh tăng FPS. Profile1/1 và navigation responsive3/3 pass. Lần soak đầu bị lỗi lưu trace do dùng chung outputDir; đã chạy lại thư mục riêng và pass đầy đủ. Review độc lập đọc diff/chạy test và yêu cầu thêm soak/navigation thật; đã bổ sung bằng chứng. Check/build pass trước commit. Không deploy/push.

Gate2 tiếp tục trong cùng task: logic/version trước UI, kỷ lục v1 giữ lịch sử, checkpoint v2 tách riêng trong transaction thắng.


### Gate2

Checkpoint v2 cho Thử thách/Vô tận cả ba trò được stage cùng settlement thắng và chỉ vào outbox sau durability. Restart thay attemptScore, advance cộng đúng một lần; finalize chỉ đóng run, không gửi điểm màn dở. `runBestsV2` tách khỏi `runBests` lịch sử; formatVersion2, Xu/item/appearance/chặng và board thời gianv1 giữ nguyên. Chỉ nhập v1 khi finalized run khớp ID/owner/level/total/outcome chứng minh phần đã thắng; lost bỏ current attempt, thiếu proof không nhập. Dùng ID cũ ở board v2 riêng giúp nhập idempotent. Đây là extension ranking/session được kế hoạch cho phép, không reset save.

UI ba tab trò/sáu mode, badgeC/B/A/S, frontier mặc định,10 dòng/trang + own riêng, avatar dự phòng, tên an toàn. Store query11/startAfter mục10 với đủ sort keys + UID; cache12board/5page và100cursor, own một lần/TTL, request generation/UID guard và stale-order/duplicate warning. Không polling/count query/realtime list. Rules cho đúng v2sáu mode, v1historical/time giữ nguyên; composite index hiện có đã đủ, không cần đổi indexfile.

Nghiệm thu: emulator browser10/10 (sáu controller-mode settlement thật, quota-failure rollback/no outbox, offline/reload/receipt, UIDv2, time regression). Rules fixtures0/1/10/11/20/21,tieUID,version isolation,best-only/concurrent,cache12/TTL/refresh pass; reviewer chạy độc lập Rules và pure compatibility. UI/data/catalog regression12/12, gồm412×915,640×360,1024×900,stale/error/close/name safety. Review phát hiện pager clipping ở landscape và khóa nút Trước khi lỗi; đã sửa/rerun4/4 độc lập. Check/build pass trước commit. Không deploy Rules/Hosting hoặc push; môi trường hosted cần Rules mới khi phát hành bằng task riêng.

### Chuẩn bị Gate3 — giữ mỹ thuật

Baseline audit chứng minh owner.dispose để lại canvas pháo hoa1 và confetti1; mở hoa nhanh vẫn có canvas confetti chồng lên. Chọn A: giữ SVG/renderers hiện có, sửa owner/cancellation; không chọn raster vì chưa có bằng chứng bottleneck của hoa. Luồng giữ pháo hoa3,6s → tổng kết/confetti150hạt → hoa3nhóm5,2s/delay120ms. Fireworks giữ cap175/250, DPR1,25/1,5 và repaint canvas fullscreen; hoa chỉ opacity/transform, không đổi95SVGnode. Confetti tối đa một canvas của riêng summary. Interrupt cancel RAF/timer/canvas theo đúng owner; reduced-motion bỏ canvas/chuyển động và giữ thông tin tĩnh. Nhạc cảnh dừng/reset riêng, không phá audio app. So sánh timeline/hìnhảnh và trace, heap/resources30vòng; chưa có quyền truy cập thiết bị Galaxy S22 Ultra thật để đo GPU/FPS vật lý.


### Gate3 — nghiệm thu browser, thiết bị thật còn chờ

Đã xử lý nguyên nhân: pháo hoa không có owner/cancel promise và confetti global không thuộc popup. fireworkEffect có scope/RAF/timer cleanup idempotent, replacement trả cancellation để không mở summary cũ, tab ẩn pause/resume không nhân scheduler. Confetti dùng instance/canvas riêng theo summary, reset chỉ instance đó khi đóng/chuyển/ẩn/reduced-motion; không can thiệp confetti khác. SDK dùng Worker singleton/reset chung; chọn instance useWorker=false trên main thread để có cancellation riêng, giữ150hạt. Đó là trade-off ownership/CPU, cần đo điện thoại thật trước khi kết luận budget mobile. ui.js có owner riêng cho toàn pipeline và counter; continuation có actionScope riêng của parent, bị hủy khi thay summary/parent dispose, có generation guard. Review độc lập đã phát hiện callback cũ trong cùng parent; fix có regression riêng. Counter chuyển tĩnh khi reduced-motion/tab ẩn.

Giữ nguyên SVG95node/nhóm/timeline, fireworks cap/đường bay và confetti150hạt/màu, âm thanh dùng chung. Chọn ownership optimization (A), không raster (B). Các hàm giữ lối gọi cũ, thêm owner/cancellation; effect/catalog ID và format save không đổi ở phase này.

Bằng chứng: baseline test owner.dispose còn canvas pháo hoa1 + confetti1; sau sửa0/0. Trace full thắng100→summary/confetti→hoa→idle→menu ở Chrome155 Windows, viewport412×915/DPR3 mô phỏng: overlap canvas khi mở hoa1→0, thoát canvas0; no-preference max21layers, reduced17. Trace Paint events trước/sau lần lượt1629/1588 (motion) và139/136 (reduced) ở lượt final; không diễn giải thành cải thiện paint hay GPU vì thời điểm chụp/driver khác nhau. Frame p95 hoa8,4→8,5ms; không long task trong hai trace. Summary p95 có nhiễu screenshot/driver (55,4ms trước/32,1ms ở lượt final; reduced final55,5ms), không dùng để tuyên bố FPS hay đạt16,7ms trên thiết bị thật. post-GC heap full-flow khoảng7,3→9,4MB có lazy imports/warmup; không gọi đó là leak hoặc giảm heap. Soak30vòng sau warmup7.611→7.653MB (delta42.392bytes), nodes1127/listeners76 giữ nguyên; owned resources về0. Có trace JSON và metrics trong test-results/victory-profile-before/final, không đưa output vào bundle/Git.

Kiểm cuối23/23 browser (shared shell cleanup/lifecycle100switches, chapter đủ100 cả ba trò→101, audio,30cycle ownership/hidden/close, media changes, natural completion, summary replacement và actual restart ba trò×3vòng); profile2/2 pass. Reviewer chạy độc lập12tests và3targeted cuối, không finding còn mở. npm run check, npm run build, npm run build:android pass (chỉ wrapper, không APK); built web smoke2/2 pass. Diff không debug/asset thử nghiệm; không deploy/push.

Người dùng xác nhận2026-10-14 chưa có thiết bị/remote debugging và yêu cầu ghi nghiệm thu thiết bị thật còn chờ. Vì vậy browser QA/code đã đóng; chưa xác minh frame/heap/GPU/repaint trên Galaxy S22 Ultra và không tuyên bố60FPS điện thoại. Hình hoa không cần đổi theo bằng chứng browser hiện có; đánh giá vật lý sẽ là QA sau, không mở thêm task mỹ thuật tự động.
