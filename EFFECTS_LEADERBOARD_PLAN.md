# Kế hoạch hiệu ứng nền và bảng xếp hạng

Ngày: 2026-10-13. Trạng thái: đã khảo sát/lập kế hoạch, chưa triển khai runtime. Đây là kế hoạch hiện hành duy nhất; ADVENTURE_WEB_PLAN.md là hồ sơ đã hoàn tất.

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

Gate0 khảo sát/tài liệu hoàn tất; Gate1–3 chưa triển khai trong lượt này. Khi được giao code: thực hiện tuần tự, commit từng gate; unit/lifecycle và browser mục tiêu, check/build cuối cùng, review độc lập khi thay owner. Không deploy/push hoặc thay dữ liệu bằng task này.

Nguồn dự án: backgroundEffects.js/style.css; appPageLifecycle.js/gameShellLifecycle.js; victoryCelebration.js/victoryFlowerScene.js/fireworkEffect.js/victoryPresentation.web.js/ui.js/sound.js; leaderboardPanel.js/leaderboardStore.js/rankingResult.js/firestore.rules.

Nguồn kỹ thuật kiểm tra2026-10-13: [Animation và rendering](https://web.dev/articles/animations-guide), [Firestore query cursors](https://firebase.google.com/docs/firestore/query-data/query-cursors). Không coi các hướng dẫn này là số đo của dự án.
