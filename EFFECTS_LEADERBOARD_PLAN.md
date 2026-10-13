# Kế hoạch hiệu ứng nền và bảng xếp hạng

Ngày: 2026-10-13. Trạng thái: đã khảo sát/lập kế hoạch, chưa triển khai runtime. Đây là kế hoạch hiện hành duy nhất; ADVENTURE_WEB_PLAN.md là hồ sơ đã hoàn tất.

## 1. Phạm vi và dữ kiện đã xác minh

- Tối ưu sao băng, thiết kế lại xếp hạng; phân tích cảnh hoàn thành chặng trước khi quyết định sửa hình ảnh. Giữ save/schema, luật thắng, mở khóa, thưởng và cách tính thành tích.
- backgroundEffects.js hiện tạo/xóa sao và đầu sáng, tối đa hai sao; có timer thu hồi từng sao. Chỉ kiểm tra cài đặt/tab ẩn/reduced-motion, chưa chặn gameplay; ẩn tab chưa thu hồi ngay sao đang bay.
- data-active-game không phân biệt map với gameplay: map cũng mang ID trò. Không dùng điều kiện activeGame=selector làm nguồn quyết định hiệu ứng.
- Cảnh hoa hiện tại có95 phần tử SVG, ba nhóm WAAPI hữu hạn5,2s với delay; không còn template hoa DOM cũ hoặc offsetWidth trong victoryCelebration.js. Cleanup theo scope đã có. Âm thanh dùng HTMLAudioElement tái sử dụng, không có AudioContext riêng để đóng.
- Luồng hiện tại: pháo hoa → tổng kết/confetti → bấm chúc mừng → hoa. Không khẳng định ba hiệu ứng cùng khởi chạy; confetti còn lại có thể chồng hoa khi bấm nhanh. fireworkEffect.js còn RAF/timer tự quản và wrapper confetti chưa có cancel handle của riêng lượt; cần kiểm chứng đường hủy.
- Xếp hạng online hiện là các select + top20 và kỷ lục riêng; chưa phân trang. Board thường riêng theo trò/độ khó/màn; Thử thách và Vô tận Triple xếp theo màn đạt tới rồi điểm lượt. Vô tận Memory/Link chưa đủ luật kết thúc để xếp hạng.

Loại khỏi đề xuất: khẳng định0 byte GC,100% GPU,60FPS mọi máy/dưới25FPS khi chưa đo; số200 node/50 loop/8 đợt và ép reflow của bản hoa cũ; bắt buộc thay hoa hoặc thêm Lottie/video; đóng audio context dùng chung. Đổi thành mục tiêu giảm cấp phát, giữ tài nguyên có giới hạn và chứng minh bằng profile. Transform/opacity giúp giảm layout/paint, không đảm bảo browser luôn compositor-only.

## 2. Gate1 — Sao băng có pool cố định

Chọn pool hai node + CSS animation thay tạo/xóa từng đợt; không cần Canvas/RAF cho hai vệt. Singleton initialize idempotent vì hydrate hiện có thể gọi khởi tạo nhiều lần.

- Một container nền, đúng hai node sao giữ suốt app; đầu sáng dùng pseudo-element. Pool sở hữu IDLE/ACTIVE, listener và một scheduler callback tái sử dụng; không timer thu hồi riêng, không listener/closure mới mỗi lượt.
- Mỗi3,5–7s chọn node IDLE; bận cả hai thì bỏ lượt. Giữ nét vệt/độ sáng hiện có. Chuẩn bị tọa độ/kích thước lúc IDLE; chỉ animate transform/opacity trong pha ACTIVE. Pha xuất hiện ngắn → bay/mờ1,2–2,5s → IDLE; animationend/animationcancel lọc đúng target/name và không thu hồi lượt mới bằng event cũ. Không ép reflow để chạy lại.
- Page/navigation/shell lifecycle thông báo eligibility; chỉ Home/map được chạy. Vào startup/gameplay, tab ẩn, reduced-motion hoặc tắt hiệu ứng: hủy scheduler, trả cả hai node IDLE, ẩn container. Các tab chức năng/cảnh chiến thắng không phát sao. Không polling/MutationObserver theo DOM để đoán route.
- Giữ cài đặt Hiệu ứng nền đang điều khiển cả mây/sương; scene guard mới chỉ sở hữu sao băng, không âm thầm đổi các lớp khác hoặc hứa giải phóng toàn bộ GPU của app.
- Listener cấp app đăng ký một lần, có dispose cho test/teardown; restart scheduler không nhân đôi. Không bật will-change toàn màn hình hoặc giữ layer khi IDLE nếu chưa có số đo.
- Chứng minh: danh tính hai node không đổi sau soak10 phút và100 lần chuyển menu/map/game; tối đa một timer; không sao ACTIVE/timer lúc bị chặn; bật/tắt nhanh và cancel gần animationend; heap không tăng dần. So sánh allocations/frame p95/long tasks và hình ảnh trước/sau, không gọi pool là Zero GC.

## 3. Gate2 — Bảng xếp hạng toàn màn hình

### Bố cục

- Header Bảng xếp hạng, Exit như navigation hiện hành. Ba tab trên: Memory Match / Link Connect / Triple Connect; mở từ map mặc định đúng trò, mở Home nhớ lựa chọn gần nhất trong phiên.
- Sáu mục: Dễ / Trung bình / Khó / Siêu khó / Thử thách / Vô tận. Mobile dùng3×2 để thấy đủ, C/B/A/S giữ nâu/xanh/vàng/tím. Vô tận Memory/Link hiển thị chưa hỗ trợ, không truy vấn/giả lập bảng; không tự thêm luật thua.
- Màn thường có bộ chọn Màn hợp lệ, mặc định màn đang chọn hoặc frontier; Thử thách/Vô tận ẩn bộ chọn màn. Đổi bộ lọc về trang1.
- Danh sách tối đa10 người/trang: số thứ tự, avatar dự phòng, tên, thời gian hoặc màn/điểm. Top3 dùng huy hiệu nhỏ ngay trong dòng; tô dòng của mình, không thêm podium lặp dữ liệu. Kỷ lục của bạn riêng bên dưới, không tính thành người thứ11 và không giả số hạng toàn cục khi chưa có dữ liệu.
- Header/bộ lọc/pager/dock giữ ổn định; danh sách cuộn khi viewport thấp, ẩn thanh cuộn nhưng giữ touch/wheel/keyboard/focus. Nút44px, tên dài được giới hạn, số thẳng cột, empty/loading/offline/error rõ và không có giải thích kỹ thuật cho người chơi. Chuyển tab nhẹ, reduced-motion tĩnh.

### Dữ liệu và phân trang

Chọn cursor Firestore thay offset hoặc tải toàn bộ bảng: phù hợp cache/quota, tiếp tục dùng board ID/comparator hiện hữu.

- Mỗi request tối đa11 entries, render10; mục dư chỉ xác định còn trang. Trang sau bắt đầu sau mục thứ10, không bỏ mất mục thăm dò. Sort time ASC hoặc levelReached DESC,totalScore DESC, cuối cùng UID/document ID ASC; cursor chứa đủ khóa.
- Pager Trước / Trang N / Sau, kèm nút số các trang đã có cursor; disable ở biên, không tự đoán tổng trang hoặc nhảy cuối khi chưa biết. Khi hết danh sách mới biết trang cuối; chưa thêm count query hoặc bảng tổng hợp chỉ để hiển thị tổng.
- Cache theo environment/board/UID/trang, tối đa12 board và5 trang gần nhất mỗi board; giữ cursor gọn cho tối đa100 trang/board, vượt giới hạn yêu cầu về trang1/làm mới. Kỷ lục riêng đọc một lần mỗi board/TTL, không mỗi trang. Không realtime listener cho danh sách, không polling; giữ TTL120s và giới hạn refresh15s.
- Tải trang giữ bộ lọc/cursor/scroll riêng của board, chỉ commit UI khi đúng request generation và UID; mở/đóng/đổi tab phải hủy owner và bỏ response cũ. Refresh xóa cursor/cache rồi về trang1. Các trang tải ở thời điểm khác nhau không phải snapshot nguyên tử: nếu phát hiện UID lặp hoặc thứ tự bất thường, đề nghị làm mới, không âm thầm bỏ dòng rồi gán hạng sai.
- Rules hiện giới hạn list≤20 nên request11 không cần nới quyền. Kiểm tra index thực tế, outbox/offline/best-only và receipt; không đổi schema để làm UI. Cùng metric dùng UID làm thứ tự hiển thị ổn định; không tự đổi luật đồng hạng/điểm phụ.

Nghiệm thu: fixtures0/1/10/11/20/21 người, trang cuối, tie UID, đổi bộ lọc nhanh/UID/offline, đóng khi đang tải, quota/cache và nội dung tên an toàn; emulator kiểm query/Rules. Layout412×915,640×360,1024×900; scrollbar ẩn vẫn thao tác được, focus/touch/reduced-motion. Giữ logic xếp hạng và dữ liệu cũ.

## 4. Gate3 — Phân tích cảnh thắng, giữ mỹ thuật

Người dùng đã thử mobile và thấy mượt; chưa có bằng chứng cần thay cảnh. Giữ hoa SVG/âm nhạc/timeline hiện tại làm baseline, không giảm độ đẹp bằng chỉ tiêu số node tùy ý.

- Ghi trace toàn luồng thắng đủ100 màn: pháo hoa, tổng kết, confetti, hoa, idle, đóng sớm; đo từng pha và overlap. So sánh thiết bị mobile mục tiêu có bật hiệu ứng với reduced-motion; ghi browser/DPR/frame p95/long tasks/heap/layer/repaint, không suy FPS từ số node.
- Audit close/dispose/đổi game/tab ẩn30 vòng: cancel RAF/timer/animation đúng owner, không summary xuất hiện muộn hoặc tiếp tục lượt cũ; nhạc cảnh dừng/reset, không đóng hoặc phá tài nguyên âm thanh app. Nếu phát hiện leak/callback mồ côi, sửa ownership riêng, giữ nguyên hình ảnh.
- Hai hướng chỉ cân nhắc khi có bottleneck: (A) giữ SVG, tối ưu allocation/paint và hủy đúng lượt, ưu tiên; (B) raster một phần tĩnh, giữ nhóm chuyển động/ánh sáng, chỉ khi so sánh hình ảnh và số đo cho lợi ích rõ. Không chọn rương/cúp/Lottie/video mặc định; ít DOM không đồng nghĩa nhẹ hơn.
- Trước bất kỳ sửa effect nào: xác nhận điểm nhấn, timeline, property, particle/node cap, repaint, cancel và fallback. Asset/thay mỹ thuật cần quyết định riêng. Nếu baseline sạch và đạt trên thiết bị mục tiêu, kết luận không cần đổi hình hoa là kết quả hợp lệ.

## 5. Thực hiện và nguồn

Gate0 khảo sát/tài liệu hoàn tất; Gate1–3 chưa triển khai trong lượt này. Khi được giao code: thực hiện tuần tự, commit từng gate; unit/lifecycle và browser mục tiêu, check/build cuối cùng, review độc lập khi thay owner. Không deploy/push hoặc thay dữ liệu bằng task này.

Nguồn dự án: backgroundEffects.js/style.css; appPageLifecycle.js/gameShellLifecycle.js; victoryCelebration.js/victoryFlowerScene.js/fireworkEffect.js/victoryPresentation.web.js/ui.js/sound.js; leaderboardPanel.js/leaderboardStore.js/rankingResult.js/firestore.rules.

Nguồn kỹ thuật kiểm tra2026-10-13: [Animation và rendering](https://web.dev/articles/animations-guide), [Firestore query cursors](https://firebase.google.com/docs/firestore/query-data/query-cursors). Không coi các hướng dẫn này là số đo của dự án.
