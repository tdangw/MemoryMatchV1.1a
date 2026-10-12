# CONTEXT — Trạng thái hiện tại (2026-10-13)

Đọc file này khi bắt đầu task mới. Đây là snapshot điều hướng, không thay thế code/config và không chứa lịch sử triển khai chi tiết.

## Sản phẩm

- Ứng dụng JavaScript ES modules; backend local chính là IndexedDB theo chặng, facade persistence bất đồng bộ. Firebase hiện dùng Hosting; database Firestore Singapore đã được người dùng tạo, Auth/sync/xếp hạng/Analytics được triển khai ở các phase sau.
- Sản phẩm chưa phát hành. Yêu cầu ngày 2026-10-13 thay chính sách reset development: giữ Xu/vật phẩm/chủ đề/kỷ lục/session khi chuyển định dạng. Bản nguồn formatVersion=1 được giữ làm phục hồi; formatVersion=2 dùng transaction profile + chapter, cache giới hạn theo chặng đang xem/phiên. Không fallback sang v1 khi backend mới từng được dùng; dữ liệu hỏng/version lạ chặn ghi. Ghi thất bại chặn các snapshot phụ thuộc và yêu cầu tải lại bản đã commit, không tiếp tục ghi dữ liệu RAM chưa bền vững.
- Ba game có trong runtime/menu: Memory Match, Link Connect và Triple Connect.
- Memory Match, Link Connect và Triple Connect dùng Game Shell chung; state/session gameplay vẫn tách theo game và mode.
- Runtime Closure và Render Performance Closure đã hoàn tất ở phạm vi runtime: validation boundary Triple, scheduler HUD chung, benchmark/soak ba game và review closure đều đã đạt trước khi kế hoạch triển khai được xóa. Không khôi phục kế hoạch runtime cũ từ Git history. Effect V2 runtime đã đạt; tinh chỉnh hình ảnh 21 line effect là việc tùy chọn tách riêng, không phải gate hay nội dung chưa hoàn tất.
- Hidden Piles, Tray Expansion, Milestone 10/30 và Effect V2 runtime đã được triển khai.
- Review runtime gần nhất ngày 2026-09-29: `npm run check` pass; Effect V2 24/24 pass sau khi bỏ brightness ngoài contract của Dissolve; lifecycle 100 vòng ba game và Triple Worker 20 chu kỳ cancel đều trả resource về baseline. Hai test Triple HUD đang thay đổi song song chưa thuộc kết luận runtime này.
- Mục tiêu hiện tại là hoàn thiện trải nghiệm web desktop/mobile. PWA/APK/Android/signing/store QA chỉ bắt đầu bằng task riêng sau khi người dùng xác nhận web ổn định.
- Gate renderer Board Startup trước đây đã hoàn tất: Link batch DOM ban đầu và cải thiện board-ready CPU 6× khoảng 20%; thử nghiệm Memory không tạo lợi ích rõ và Triple batching bị loại do làm xấu số đo. Phần async controller chưa được giao lại và không còn là kế hoạch active; nếu cần phải lập task riêng sau HUD.
- HUD dùng một owner menu theo scope cho ba game; progress là placeholder rỗng/ẩn, metric/ref chết đã loại và CSS shared sở hữu thanh ngang liền mạch với nút 44px, nhãn vàng/giá trị trắng. Regression HUD 60/60, review menu 5/5, check/build và nghiệm thu Galaxy S22 Ultra đã pass; soak không tăng resource. Chuyển cảnh background no-preference có lỗi có sẵn ngoài phạm vi, chưa được thay đổi.

## Contract dùng chung

- Firebase Hosting dùng chung project `memorymatchv1-1a` với ba site: target `production` → `memorymatchv1-1a`, target `beta` → `memorymatchv1-1b`, target `test` → `memorymatch-test`. `npm run deploy`, `npm run deploy:beta` và `npm run deploy:test` chỉ deploy đúng site tương ứng. Mỗi URL có storage trình duyệt riêng vì khác origin.

- Kế hoạch hiện hành duy nhất: `ADVENTURE_WEB_PLAN.md` (2026-10-12), đã được giao triển khai toàn bộ phase 0–8 ngày 2026-10-13, kiểm tra/review và commit từng phase; phase 0–3 đã pass, bắt đầu phase 4 cảnh/UI. Phạm vi: hành trình riêng từng trò; map bốn độ khó thường dùng chung mở khóa N+3, sao/điểm riêng; 100 màn + 10 rương mỗi chặng; thắng đủ 100 màn mới mở chặng sau; luôn đếm ngược; guest backup/Google link; Analytics; UI và cảnh chiến thắng nhẹ. Nhiệm vụ/cơ chế gameplay mới tạm hoãn để người dùng nghiên cứu; giữ luật và điều kiện thắng hiện hữu, không triển khai early-win hoặc HUD nhiệm vụ trong task menu/map. Trọng tâm phân tích hiện tại là bản đồ so với luồng chọn mode/session và thiết kế lại menu mobile. Các quyết định còn chờ và gate được ghi trong kế hoạch, không tự coi đề xuất là scope đã duyệt.
- Rương tạm dùng ba gói Xu có phần cố định + ngẫu nhiên: Nhỏ 60 + 20–40 (70%), Vừa 100 + 30–60 (25%), Lớn 150 + 50–100 (5%); catalog/grants có thể mở rộng vật phẩm sau. Backend ranking cơ bản/mọi thời gian/có gửi lại offline đã được người dùng đồng ý. Agent review chỉ dùng khi cần với thay đổi rủi ro, chỉ đọc/test, không sửa/commit.
- Yêu cầu triển khai mới: bốn nút đáy đồng nhất Cửa hàng → Bộ sưu tập → Xếp hạng → Cài đặt trên menu chính, bản đồ và gameplay. Menu chính/bản đồ chừa vùng quảng cáo riêng dưới dãy nút; gameplay ẩn cả vùng quảng cáo để lấy lại diện tích. Chưa gắn ad provider/ad unit và chưa được giao deploy Hosting hoặc nâng billing. Baseline trước sửa: npm run check/build pass; Firebase web app/CLI đã có, Firestore databases:list trả danh sách trống.
- Tài liệu repository chỉ chứa thiết kế/kế hoạch của dự án. Nội dung nghiên cứu/tham khảo trò khác chỉ ở chat; không lưu tên, mô tả, bảng so sánh, đường dẫn hoặc tài nguyên của các trò đó vào dự án.
- Hướng menu hiện tại: menu chính có tài khoản/Xu ở trên, tên app và ba trò ở giữa, Cài đặt/Cửa hàng/Bộ sưu tập/Xếp hạng ở đáy. Chọn trò vào thẳng bản đồ với tên trò phía trên, chọn độ khó và chức năng phía dưới. Gameplay giữ nguyên HUD/board/khay/công cụ và cách trình bày hiện hữu, chỉ thêm dãy nút chức năng ở đáy với diện tích riêng; không dùng bố cục gameplay trong minh họa để triển khai. Không sửa lại minh họa; tiếp tục trao đổi và chốt thiết kế. Chưa triển khai runtime/backend xếp hạng.
- Người dùng xác nhận ba trò có khoảng trống dưới game để thêm thanh nút, không cần sắp xếp lại phần phía trên. Bản đồ dùng sao chưa sáng/sao sáng theo kết quả của độ khó đang xem; người chơi tự vuốt tìm màn, không có nút tìm/lọc/nhảy tới màn chưa clear. Completion chung giữa độ khó vẫn là dữ liệu riêng, không suy từ số sao.
- Xếp hạng được bổ sung vào kế hoạch: màn thường riêng theo trò/độ khó/màn, ưu tiên thời gian thực đang chơi ngắn nhất (loại tải/pause/menu/tab ẩn, không suy từ countdown). Thử thách giữ luật hiện tại và Vô tận Triple xếp theo màn đạt tới rồi tổng điểm đúng lượt; Triple hoàn tất Thử thách 7 cũng là kết thúc hợp lệ. Cho phép hỗ trợ, guest và Google; một kỷ lục mỗi UID trên mỗi bảng. Vô tận Memory/Link chưa xếp hạng, chờ task điều kiện thua riêng. Cần duration/run metadata độc lập với totalScore kỷ lục hiện hữu; roadmap đề xuất dữ liệu local/bản đồ → Auth/sync → xếp hạng online. Chưa bật dịch vụ hoặc đổi code/schema; các đề xuất backend, quota, trust và quyết định còn chờ ở mục 12 của ADVENTURE_WEB_PLAN.md.
- Quy tắc kết thúc lượt xếp hạng đã chốt: mua thêm giờ sau hết giờ hoặc chơi lại màn chưa kết thúc ván thì giữ cùng lượt và vẫn được xếp hạng khi kết thúc thật; không gửi ngay ở popup hết giờ/restart. Ví dụ chơi lại màn 10 rồi kết thúc ở 15 vẫn ghi thành tích 15. Điểm lần chơi lại thay phần điểm màn hiện tại, không cộng lặp; điểm các màn trước giữ. Chưa thay hành vi controller hoặc schema trong lượt lập kế hoạch.
- Startup ba game hiển thị popup đầu màn ngay khi HUD/board DOM sẵn sàng, decode ảnh tiếp tục nền, không có nhãn loading và input/timer chỉ mở sau khi readiness hoàn tất. Startup regression 9/9, contract popup/timer Triple 1/1, check/build và nghiệm thu Galaxy S22 Ultra đã pass. Trace cold board-ready có nhiễu profiler được giữ làm dữ liệu tham khảo, không phải lỗi mở.

- Tinh chỉnh HUD ngày 2026-09-30: bỏ animation `pulse-red` phóng to ô timer, giữ cảnh báo màu tĩnh; nút menu hệ thống có nền xanh dương, công cụ gameplay có nền tím và icon sáng, cùng viền inset, không đổi kích thước 44px. Regression HUD/menu/presentation 10/10 ở 412×915; sau khi tách màu nút, presentation 3/3 và check/build pass; API/save không đổi. Chưa kiểm tra trên thiết bị thật.

- `js/gameCatalog.js` sở hữu game/mode/namespace; session lưu riêng theo game và mode.
- Game Shell sở hữu sáu vùng semantic, HUD patch, layout, lifecycle và effect registry; controller/renderer từng game sở hữu luật, tile và presentation đặc thù.
- Xu và nội dung sở hữu dùng chung khi catalog cho phép; item, session và appearance có namespace/capability theo game.
- Popup, modal, sound, shop, collection và persistence được tái sử dụng qua adapter; không dùng nhánh mặc định “game khác => Memory/Link”.
- Transaction Xu/item/appearance phải commit atomically và rollback RAM khi save fail.
- Timer/session checkpoint theo event có ý nghĩa; không ghi persistence theo frame/tick.

## Triple Connect hiện tại

- Tổng thẻ active: Easy 27, Normal 54, Hard 78, Super Hard/Endless 120.
- Layout, snapshot và milestone Triple chỉ dùng contract hiện hành; không có yêu cầu đọc save Triple development cũ.
- Xấp góc: Normal `9`; Hard `7 + 8`; Super Hard/Endless `6 × 4`. Thẻ ẩn không nằm trong DOM/a11y cho tới khi thành top.
- Khay cơ bản 7 ô; mỗi lần mua Mở rộng khay thêm 1 ô, giá 3.000 Xu, tối đa 10 ô. Renderer luôn tạo 10 node và khóa các ô chưa mua; mobile dọc dùng 5×2 khi có 10 ô.
- Milestone version 2 có 10 mốc, step 3, target 30. Lucky chỉ có trong Challenge.
- Challenge level 1–7 có tổng thẻ `18/27/42/51/66/75/93`; stage có xấp cũng dùng topology corner-safe mới.
- Baseline nghiệm thu HUD/mobile UI hiện tại là Galaxy S22 Ultra ở viewport CSS 412×915 portrait. Không tạo gate hoặc profile test riêng cho viewport 320/360; kích thước nhỏ hơn một chút dùng responsive fluid và chỉ mở test mới khi có lỗi thực tế trên thiết bị mục tiêu.
- Effect V2 runtime đã hoàn tất với pool/cleanup/reduced-motion cho Link 2-target và Triple 3-target. Chỉ mở task mỹ thuật cho từng hiệu ứng khi người dùng yêu cầu; không nhắc lại như thiếu sót runtime.
- Triple tính mục tiêu sao theo số bộ thẻ và chỉ cộng time bonus một lần khi kết thúc màn timed.
- Combo Triple dùng cùng cửa sổ với Memory/Link theo số bộ ba trong màn (≤8: 15s; 9–15: 20s; ≥16: 30s); ghép ba thẻ khởi động lại, Miss hoặc hết giờ đặt combo hiện tại về 0 nhưng giữ maxCombo.

## Theme selection hiện tại

- Image theme dùng manifest đệ quy, chọn weighted without replacement và lưu tối đa ba board gần nhất theo theme.
- Image selection dùng asset path; generated selection dùng stable ID. Memory/Link snapshot selection; Triple snapshot type → selection; Continue giữ mapping, round production mới có seed mới.
- Theme history và session commit/rollback atomically trên cả ba game.

## Điều hướng catalog hiện tại

- Cửa hàng và Bộ sưu tập lưu stable tab ID riêng theo `(gameId, shop/collection)`, khôi phục qua reopen/reload và fallback an toàn khi capability không còn.

## Tài liệu giữ lại

- `ADVENTURE_WEB_PLAN.md`: kế hoạch thiết kế hiện hành; các gate code chưa được triển khai.
- `AGENTS.md`: chuẩn làm việc bắt buộc.
- `ARCHITECTURE.md`: ownership và contract kỹ thuật bền vững.
- `README.md`: cách chạy/build.
- `ADD_GAME.md`: checklist tích hợp game.
- `Memory Match.md`, `Link Connect.md`, `Triple Connect.md`: luật/thiết kế từng game.
- `themes.md`: catalog/chất lượng asset chủ đề.

Các kế hoạch HUD, Startup, Triple/Effect/Theme, Runtime Closure và Board Startup cũ đã được hợp nhất, hoàn tất hoặc ngừng active và bị xóa. Không khôi phục chúng từ Git history làm nguồn triển khai; dùng code/config và các tài liệu bền vững ở trên làm nguồn hiện hành.

## Quy tắc bàn giao

- Luôn đọc `git status` trước khi sửa; thay đổi có sẵn thuộc người dùng/agent khác và không được reset hoặc ghi đè.
- Chạy test mục tiêu trước, suite rộng ở gate cuối hoặc khi chạm shared owner.
- Mỗi contract có một test owner; không nhân mọi suite qua mọi viewport. Chỉ layout/hit target/overflow/presentation geometry cần matrix responsive.
- Test/build pass không thay thế visual review, số đo hiệu suất hoặc nghiệm thu thực tế của người dùng.
- `dist/`, `test-results/`, `playwright-report/`, `node_modules/` và manifest sinh là đầu ra có thể tạo lại, không phải source cần dọn thủ công trong task gameplay.

Phase 1 (2026-10-13): check/build pass; browser adventure-data + cleanup 6/6 pass, review độc lập. Bundle JS 505,10 kB (gzip 138,91), sẽ tách tải ở phase 7; chưa tuyên bố FPS thiết bị thật.

Phase 2: appPageLifecycle sở hữu trang menu/modal; game shell sở hữu dock, fit board trừ dock bound; 3 viewport pass, 100 lần chuyển trò pass. Header wallet/account và dock Shop → Collection → Ranking → Settings; menu chừa slot quảng cáo, gameplay không có slot.

Phase 3: adventureMap sở hữu một chặng 110 node, patch mode không remount/đổi scroll; native scroll, không finder. Adapter launch/resume từng trò, preview cảnh báo thay session cùng mode; rương commit rồi mới xác nhận. LastPlayedGameId có check concurrency với catalogTabs. Map chapter navigation 5 vòng giữ diagnostics/page resources ổn định.
