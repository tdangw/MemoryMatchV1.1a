# Nghiệm thu gameplay progression

Ngày: 19/10/2026. Phạm vi được giao: toàn bộ GAMEPLAY_PROGRESSION_PLAN.md, với điều kiện không xung đột task UI. Trạng thái: P0 chờ quyết định; P1 hoàn tất phần model độc lập, chưa bật runtime; chưa hoàn tất toàn kế hoạch.

## Ranh giới và phương án

- Baseline working tree đã có nhiều thay đổi UI/kỹ thuật/tài liệu. Không stage, hoàn nguyên hoặc format các thay đổi đó.
- Đọc trạng thái task `Triển khai kế hoạch cải tiến G0–G9`: lượt hiện tại chỉ đang sửa HUD một hàng/tiêu đề popup và kiểm UI. Không gửi tin hay can thiệp task đó. Phần gameplay này chỉ tạo model/test mới, không sửa controller/CSS/UI/package.
- Chọn module thuần dùng chung, tách khỏi cấu hình runtime cũ; tránh sửa ba config đang hoạt động riêng lẻ rồi để save/settlement chạy nửa luật mới nửa luật cũ. Việc bật phiên bản luật phải đi cùng persistence và controller sau khi chốt P0.
- Model không có DOM/listener/timer/cache/IO; không đổi API, ID hay save/schema hiện tại. Các accessor nhận dữ liệu đã chuẩn hóa tại boundary tương lai, không tự suy ra win hợp lệ từ score/sao cũ.

## Đã thực hiện

- `js/progression/gameplayRules.js`: wave 2/3/4/5, điểm combo 10/12/14/16/18, auto-match 10 điểm, xu toàn màn với tỷ lệ số nguyên để tránh sai số decimal.
- `js/progression/difficultyProgress.js`: luật Dễ mở màn sau và độ khó mở theo cùng màn; tiến độ mười màn theo bốn độ khó và mảnh khi đủ bốn kết quả đã chứng nhận. Không grant, claim hoặc quyết định chính sách EXP replay.
- `tests/unit/progression.test.js`: golden examples xu ba trò; biên wave, combo, automatic, invalid/unsafe inputs; unlock, legacy record không tự được chứng nhận, tiến độ rương/mảnh và tính bất biến. Truy cập cụm xa đọc đúng 40 record, không scan lịch sử.
- Chưa thực hiện: wave runtime, migration, cấp thưởng, 20 layout, trọng lực mới, UI hoặc luật thời gian chưa duyệt.

## Kiểm tra

- `node --test tests/unit/progression.test.js`: 9/9 đạt lần đầu và sau bước đọc/kiểm lại source (log `unit-review.log`).
- Đối chiếu số học riêng: 16.200 tổ hợp game/mode/N/sao khớp bảng hệ số; chuỗi 30 nhóm cho 520 điểm (log `arithmetic-review.log`). Đây là kiểm lại bởi cùng agent, không phải review độc lập của người/agent thứ hai; gate review toàn kế hoạch chưa được đánh dấu đạt.
- `node --check` hai module mới đạt; `git diff --check` đạt. Không tìm thấy import model mới trong runtime đang hoạt động.
- `npm run check`: lần đầu không đạt kiểm hiệu năng generator Triple có sẵn p95=29,25ms >20ms; chạy riêng lần hai=21,32ms >20ms. Không sửa generator/solver/test hoặc nới ngưỡng. Lần chạy tổng cuối đạt toàn bộ, gồm technical checks và ads15/15 (`check-final.log`, exit0). Ngưỡng hiệu năng nhạy tải máy, giữ hai log fail làm bằng chứng; không suy từ lần pass thành số đo điện thoại.
- `npm run build`: đạt, Vite build23,34s, 244module (`build.log`, exit0). Build này chưa bao gồm gameplay mới vì module chưa được bật.
- Không chạy UI cho file chưa được nối runtime; không tuyên bố các luồng wave/claim/save đã được nghiệm thu.

## Quyết định đang chờ

Đã hỏi qua công cụ: EXP chỉ lần đầu hay replay; ngân sách và tiếp tế wave/bỏ giây combo/kích thước bàn; cách bảo toàn/tách tiến độ luật cũ; chọn mảnh tranh/bản đồ kho báu và duyệt bảng thưởng. Các câu trả lời ảnh hưởng behavior/schema/kinh tế nên chưa tự chọn để tích hợp. Các vấn đề chi tiết còn lại theo P0 trong kế hoạch.

Không phải blocker UI đối với các model đã làm. P2 và việc bật P3–P9 phụ thuộc các quyết định sản phẩm/dữ liệu chưa có câu trả lời; không lấy yêu cầu triển khai làm quyết định reset dữ liệu hoặc giá trị đồ thưởng. Không dừng vì hết gate hay vì một lần test fail.

## P0/P1 — cập nhật sau khi chủ dự án trả lời

Đã duyệt EXP lần đầu, full board mỗi wave, bỏ giây combo, ngân sách wave sau cộng vào giây dư; reset dữ liệu thử toàn dự án Firebase; mảnh tranh và bảng thưởng C30/B60/A100/S160xu +1/2/3/4gợi ý, bộ300xu. Không còn blocker sản phẩm ở những mục này. Quyền project Firebase đã kiểm tra qua CLI (không xuất thông tin tài khoản lên chat), chưa xóa gì.

P1 bổ sung model wave/snapshot chuẩn hóa/chuyển trạng thái, ngân sách và thưởng nhanh toàn màn, sao, chuỗi rương/giá trị thưởng đã duyệt. `node --test tests/unit/progression.test.js tests/unit/wave-progress.test.js tests/unit/mastery-rewards.test.js`:15/15 đạt. Có ma trận3game×6mode×4mốcwave, serialize/restore giữa mọi bước và chặn clear lặp. Chưa tuyên bố runtime/schema/claim đã được nghiệm thu.

## P2 — boundary dữ liệu wave và kết quả

`sessionProgress`/`gameState` giữ metadata wave có version; dữ liệu wave sai bị từ chối khi stage và được đánh dấu chặn resume khi hydrate, không tự chuyển về luật một board. Triple có thể giữ checkpoint board won ở biên wave khi metadata hợp lệ. Best có chứng nhận số wave, settled attempt theo mode có giới hạn để chặn quyết toán trùng; không scan attempt history.

Unit mới và trước đó19/19 đạt. Thêm test IndexedDB thật qua fake-indexeddb: metadata wave + giây tiếp tế cùng revision, conflict write không sửa checkpoint. Các script persistence, chapter-store, migration-recovery hiện có đều đạt. Hai lỗi phát hiện trong lúc thêm test (flag invalid chỉ chặn save nhưng chưa chặn stage, test gọi sai contract hydrateChapterProfile) đã sửa và chạy lại. Chưa thực hiện reset thực hoặc grant mới ở runtime. Các public API cũ vẫn nhận session không có wave để bảo toàn khả năng đọc trước rollout/reset.

## P3 — Memory wave runtime

Memory dùng ngân sách wave, giữ điểm/moves/miss và playMetrics xuyên wave, combo reset; lưu checkpoint advance cùng giây tiếp tế, sinh board mới sau durability. Wave đầu không chứng nhận ranking hoặc record màn; chỉ wave cuối chốt xu/sao/kỷ lục. Bỏ xu/giây combo và điểm nhân special, next Hành trình về Dễ màn sau. Session invalid chặn resume; pending advance tiếp tục không cấp giây lần hai.

Playwright `progression-waves.spec.js` desktop:1/1 đạt với12cặp ghép qua adapter DOM thật, tải lại sau wave1, resume wave2, kiểm budget130giây không cấp lại, kết quả chứng nhận2wave và gọi settle lại không tăng xu. Lần chạy sandbox không khởi động Vite ổn định đã dừng; chạy browser ngoài sandbox thành công. Hai lỗi fixture (chờ5s không bao gồm preview+hide, truyền model thay DOM vào adapter) đã sửa bằng chờ readiness và node thật; không giảm delay runtime. Source parse đạt. Chưa tuyên bố gate regression/UI/performance cuối đạt.

Working tree có baseline kỹ thuật/UI chưa commit từ task khác. Commit P3 chọn riêng hunk gameplay; Hint/model selection và thứ tự patch UI sau persistence của task khác vẫn unstaged. Không đưa các file cũ hoặc controller hunk của họ vào commit; test thực hiện trên working tree tích hợp, không tuyên bố snapshot HEAD bỏ baseline của task khác đã được nghiệm thu độc lập.

## P4 — Link wave và trọng lực

Link giữ điểm/moves/miss, timer và freeze qua wave; checkpoint advance không đánh dấu run thắng; đủ wave mới chốt record/xu. Nhóm người chơi ghép dùng score có trần, không xu combo; nhóm tự phá luôn10điểm không tăng combo. Hai trọng lực bổ sung: dồn chéo xuống/phải theo hai bước cố định, và dồn về tâm riêng của bốn phần tư; vào pool màn28+.

Unit progression21/21, board contract và pair-reward contracts đạt. Bài board cũ dự đoán roll0.999 ra kiểu cuối cũ đã được cập nhật sang kiểu mới của catalog và bổ sung roll dồn chéo, không nới tiêu chí bảo toàn/chống kẹt. Test trọng lực kiểm12/16/24/30/60thẻ, giữ instance/state/biên rỗng và fixed-point, recovery tìm được đường nối.

Playwright2/2 đạt: ghép thật Memory và Link qua hai wave, reload/resume sau wave đầu, chưa có best ở wave đầu và chỉ ghi sau wave cuối. Link giữ tổng ngân sách100giây cho hai wave Dễ. Chưa đo mobile/ma trận special hoặc nghiệm thu gate cuối.

Commit P4 chỉ chứa delta wave/gravity và test/receipt; preflight Sấm sét, Link selection/Hint và alignment popup của task khác vẫn ở working tree, không được stage.

## P5 — Triple waves và thư viện hình

Có 20 mặt nạ hình học, compiler xác định theo màn/wave, cache LRU 24; giữ số thẻ/lớp, góc pile và solver có giới hạn. Kiểm signature dưới cả xoay/lật ở cấu hình Dễ đã bắt hai mẫu trùng và đã thay mẫu. Triple giữ checkpoint board vừa hết, score/moves/miss/time xuyên wave và chỉ quyết toán sau wave cuối; checkpoint không hợp lệ bị chặn tiếp tục.

Unit model 22/22, Triple patterns 2/2 (20 mẫu × 6 mode, witness/geometry, 7 stage thử thách) đạt. Playwright 4/4 đạt: contact sheet hình học và ba lượt chơi thật hai wave, reload ở Memory/Link. Contact sheet chỉ là bằng chứng hình học, chưa thay kiểm tra render/hit-target mọi viewport. Commit chỉ chứa delta gameplay của controller, không stage chỉnh popup/presentation của task khác.

## P6 — chọn độ khó và thông tin đợt

Popup chỉ cho chọn độ khó đã mở, trở về Dễ khi độ khó đang nhớ bị khóa; launch kiểm tra lại. Controller bị gọi trực tiếp với độ khó khóa trả về menu, không để shell trống. Đọc thêm đúng record Dễ cuối chặng trước để không chặn màn101/201. Preview dùng ngân sách mới, mục tiêu đủ số đợt; HUD có nhãn Đợt i/n dùng lại node theo shell, không thêm timer/listener.

Static156module và preview contract đạt; unit model20/20 đạt. Playwright ba lượt hai wave đạt sau thay HUD; khóa/mở Normal ở3trò3/3 đạt. Test lần đầu dùng nhầm nhãn Thường thay vì Trung bình, đã sửa fixture đúng sản phẩm và chạy lại. Kiểm responsive/summary và regression cuối vẫn thuộc P9; chưa coi các ảnh trên desktop là nghiệm thu mọi viewport.

## P7 — EXP, rương và tranh

EXP/mảnh dẫn xuất từ thắng có chứng nhận, không tăng lại khi replay; summary hiện +10EXP và +1mảnh chỉ khi lần đầu đủ bốn độ khó. Rương mỗi cụm10màn nhận C→B→A→S, đọc chapter canonical, queue chung với thưởng bộ, lưu nguyên tử coins/items/claim; đủ kho mới cho nhận, lỗi lưu rollback cả xu/gợi ý/claim, không rollback vào profile đã thay. Claim numeric block cũ nay chứa rulesVersion/tiers/collection; record legacy không cấp rương mới.

Ba tranh thương mại tạo bằng imagegen tích hợp, WebP1500×600 tổng1.16MB, mười mảnh dùng crop một ảnh; catalog có giới hạn dùng tuần hoàn theo bộ, receipt thưởng vẫn độc lập. Prompt và provenance ở docs/design/mastery-art.md. Bộ sưu tập thêm tab Tranh, một bộ được mount/đọc mỗi lần, có chặn kết quả tải muộn khi tab đóng/chuyển.

Unit model20/20, script reward (chuỗi giá trị, concurrent duplicate, reload, đầy kho, rollback), adventure progress/preview và static157module đạt. Playwright6/6: nhận4rương +300xu bộ ở cả3trò, chặn nhận lại, chụp bốnviewport320/412/844/1024 không tràn ngang; hồi quy chơi thật2wave cả3trò đạt. Đã xem ảnh412: tranh ghép đầy, chữ tự nhiên và bố cục trong skin hiện hành. Chưa chạy gate regression cuối hoặc reset Firebase thực.

## Bổ sung P6 theo yêu cầu mới — ổ khóa và toast

Mức khó khóa có biểu tượng SVG ổ khóa và huy hiệu làm mờ; label vẫn nhận chạm/Enter/Space để xem điều kiện, radio không được chọn. Câu thông báo nêu đúng mức còn thiếu (C/B/A) và màn khi cần; toast ở giữa viewport, chạm liên tục dùng lại một toast. Listener riêng được gỡ khi đóng popup. API toast chỉ thêm tùy chọn position, giữ mặc định các toast khác.

Playwright3/3 đạt ở cả ba trò: khóa3mức, chạm và bàn phím, câu chữ đúng, tâm toast lệch dưới2px, không đổi mức đang chọn hoặc nhân toast. CSS ownership đạt. Đã deploy riêng Firestore Rules theo chấp thuận mới của chủ dự án; không deploy Hosting.

## P8 — cân bằng, vùng dữ liệu mới và reset

Luật nhiều đợt dùng gamespace riêng local/test/beta/production-waves1; giữ wire ranking v3 trong namespace riêng để client cũ không đưa kết quả một board hoặc cloud cũ vào lượt mới. Local reset một lần qua gameplaySeason=1, clear chapters/metadata/backups cùng CAS revision; IndexedDB nâng3 để client cũ mở version2 bị chặn. Import bản trước mùa bị từ chối; reset trong Cài đặt giữ marker mùa để không xóa lần nữa vào lần mở sau. Auth nằm ngoài dữ liệu chơi và được giữ.

Đã duyệt và deploy riêng Firestore Rules lên memorymatchv1-1a, biên dịch/phát hành thành công; không Hosting. Giả lập4vùngmới×9bảng + cloud/profileStats và các suite Rules cũ đều đạt. Unit season/reset4/4 đạt, test trình duyệt reset một lần/reload1/1 đạt. Hồi quy mở khóa/thưởng/wave9/9 đạt; npm run check đạt trên working tree tích hợp. Khi audit sửa thanh sao Memory còn dùng ngưỡng một board cũ sang ngưỡng toàn wave; bỏ import legacy không dùng của Link. Các helper luật một board còn xuất để tương thích API cũ; runtime đa wave dùng duy nhất progression/gameplayRules.

Firebase: backup riêng được .gitignore, không commit dữ liệu người chơi hoặc token. Backup đầu84tài liệu; preflight phát hiện thay đổi và dừng trước xóa. Backup mới87tài liệu, SHA256 8cf6388905542febf2fb6be046b5db4d595fa43e0e0150ff4a06c75f56703103. Reset có precondition updateTime cho từng tài liệu, xóa87, kiểm kê lại0. Phạm vi gamespaces của mọi người chơi; không xóa Auth, Hosting hoặc cấu hình. Client đang mở có thể tạo dữ liệu chơi mới sau mốc reset; dữ liệu mới không phải tài liệu chưa được xóa.

Mô phỏng432kịch bản lưu economy.csv:3game×6mode×4mốcwave×3nhịpchơi×có/không hỗ trợ tự phá. Đây là ước tính active time, không phải số đo người thật và không gồm preview/intro/quảng cáo. Dễ màn1 Memory/Link:24–26xu,1–2sao ở ba nhịp giả định; Triple34–38xu,1–3sao. Với Memory/Link6cặp/đợt,3sao cần combo tốt và thời gian chủ động khoảng40%ngân sách hoặc nhanh hơn; mức quick giả định45%chưa đạt. Không tự nới ngưỡng đã duyệt để làm bảng đẹp. Màn91+Siêu khó có thể có ngân sách nhiều phút do5bàn đầy, đúng yêu cầu; chưa có đo người thật để tune tiếp.

Thưởng phụ giữ nguyên: Memory mốc năng lượng có20xu/cycle và lucky1–10xu; Link mốc năng lượng30xu/cycle và các drop đặc biệt/lucky riêng; Triple mốc chu kỳ46xu (Endless cộng thêm5xu thay thời gian) và lucky riêng. Các khoản này không phát lại ở bước chuyển wave, nhưng lượt chơi dài thu được nhiều chu kỳ hơn; economy.csv chỉ báo xu thắng màn để không trộn giả định xác suất phụ vào số đo. Không cấp EXP/mảnh lại khi farm replay.

## P9 — nghiệm thu luật nhiều đợt và phản hồi Wave

Đầu lượt hiện Wave 1; sau checkpoint bền vững, bàn cũ mờ 140 ms và bàn mới vào 240 ms với thông báo Wave 2 ở giữa màn hình. Notice không chặn timer/input, dedupe theo round, animation/timer thuộc scope, reduced-motion bỏ chuyển động. Review độc lập đã đọc diff và chạy lại test trọng yếu, không còn lỗi P1/P2 được xác nhận.

Sửa boundary: metadata số nhóm wave phải khớp snapshot board và cấu hình trước resume; fallback localStorage nạp revision trước kiểm mùa; URL tranh dùng BASE_URL. Thanh sao ba trò dành đủ khoảng hai bên ở 320 px, xử lý tràn tại nguồn.

Đạt: 31/31 unit mục tiêu; 17/17 UI wave/matrix/presentation (3 trò, 6 mode, 4 viewport, normal/reduced-motion, 20 pattern Triple có hit target); 15/15 UI lifecycle/access/rewards/reset, gồm 100 lần chuyển trò và baseline tài nguyên. npm run check và npm run build đều đạt; build có cảnh báo kích thước chunk hiện hữu. Bằng chứng dựa trên working tree tích hợp, không đồng nghĩa mọi hunk UI chưa commit đã thuộc task này. Hoàn thành chơi thật hai wave ở cả ba trò; ma trận 3–5 wave kiểm model/layout, không tuyên bố đã chơi hết mọi cấu hình. Galaxy S22 Ultra thật còn chờ thiết bị; số đo headless không thay nghiệm thu 60 FPS máy thật. Không APK/Hosting/push.

## R0–R6 — Kho báu hành trình, hoàn tất20/10

R0 chốt contract/copy (`b39faa6`); R1 mẫu SVG/bố cục (`a3e6940`); R2 projection và exact-tier (`5e64ca1`); R3 map/modal/preview (`05083a8`); R4 summary/mở rương (`c3dfc86`); R5 responsive/cancellation/retry (`7016a75`); R6 là commit nghiệm thu/tài liệu tiếp theo. Phần Wave/P9 đã commit `7494484` trước khi bắt đầu mục12.

Một marker/mười màn mở bảng bốn rương có tên Mầm Non/Lá Bạc/Hoa Vàng/Ánh Sao, xem EXP thực từng độ khó, phần thưởng và trạng thái. Chơi tiếp tìm màn thiếu/prerequisite qua adapter, không ghi đè session bằng thao tác DOM. Claim nhận đúng tier trên receipt canonical, giữ API outcome/null cũ qua wrapper tương thích; kết quả chi tiết phân biệt đầy kho với lỗi lưu, stale và chưa đủ điều kiện. Giữ nguyên kinh tế/claim key/save ở R0–R6. Summary chỉ hiển thị delta lần thắng đầu, tên rương và trước→sau; có thông báo sẵn sàng/chờ cấp trước và Xem kho báu. Tranh/300Xu riêng.

Chọn native SVG thay tám raster: cùng silhouette, bốn vật liệu/ornament riêng; không fetch ảnh rương, không có đường lỗi decode. Icon thưởng dùng hệ SVG/ảnh hiện hành với fallback. Bốn animation transform/opacity hữu hạn, không particle/node hiệu ứng mới; commit trước presentation. Sau thành công giữ rương vừa mở và thưởng, không tự chuyển/claim cấp sau. Reduced-motion chuyển thẳng kết quả; close/background/supersede/profile change hủy hoặc hoàn tất presentation, không phát lại grant. Dọn cả WAAPI đã finished/fill-forwards. Audio hữu hạn có owner và dừng khi đóng/nền.

Đã sửa từ bằng chứng: retry tải chồng không để read cũ đóng/ghi lỗi lên modal mới; CTA chờ navigation và bắt Promise rejection với page/profile/UID/generation guard; giữ khóa radio sau một launch trả false; layout ngang có cả bốn thẻ, action và link bộ sưu tập trong vùng nội dung. Fixture cũ được chuyển sang chứng nhận nhiều wave và season1; giữ kiểm tra keyboard, chặng/scroll/seam, mount và transaction, không nới luật để chạy test.

**Nghiệm thu:**

- Unit33/33: progression/wave/session/mastery/season/gravity/20patterns +projection/claims. Projection0/10/70/90/100, chờ C với B/A/S100, tất cả đã nhận, replay/special/legacy, biên10/11/100/101; exact-tier, duplicate, canonical receipt, quota/CAS, profile/UID và rollback. `unit-r6.log`.
- UI cuối60/60: map32, journey7, layout14 và lifecycle7. Bấm marker/nút thật nhận đủ4rương ở ba trò, kiểm Xu/kho/receipt và reload; summary90→100 và CTA/rejection/supersede; sáu trạng thái×3game×4viewport320/412/844/1024, chữ lớn/keyboard và DPR3; raster fail. `ui-r6-final.log`.
- Boundary3/3: thay modal khi đang opening, UID đổi và savefalse không mở rương/partial grant rồi retry thành công. `ui-r6-boundaries.log`.
- Hồi quy dialog14/access3/collection3 đã đạt trong `ui-r6-regression.log`; hai map fixture lỗi trong lần đó được sửa rồi chạy lại toàn bộ32map trong60/60 trên. Full-wave thật ba trò3/3 đã đạt ở R4, score/EXP chỉ settle cuối màn. P9 layout/motion17 và lifecycle/access/reward/reset15 đã ghi ở trên.
- `npm run check` đạt (gồm ads15/15), `npm run build` đạt; cảnh báo chunk>500kB còn hiện hữu (main519.66kB/167.41kB gzip), không là lỗi build. Production smoke2/2 trên dist đạt, chặn các endpoint production trong test. Log `check-r6.log`, `build-r6.log`, `production-r6.log`.
- Review độc lập chỉ đọc: reviewer trực tiếp chạy lại9/9 unit trọng yếu và contract thưởng, đọc diff/plan/acceptance/log và ảnh; xác nhận không còn P1/P2 đã kiểm chứng. Reviewer không tự chạy browser/build; kết quả browser/build ở trên do agent chính chạy và chờ kết thúc.

**Đo desktop headless:** sau30vòng mở/đóng và chờ hiệu ứng chạm600ms kết thúc trước đo, owner listener15, node2, cleanup4, timeout/interval/frame/animation0 giữ nguyên. CDP listener95→95, node5901→5900, heap9,368,544→9,609,976bytes (+241,432). Một mẫu mở: tap→busy2.1ms; commit22ms; presentation867.5ms; framep95 8.4ms, không long task trong mẫu. Raw `treasure-desktop-metrics.json`. Đây không là bằng chứng60FPS điện thoại hoặc đo mạng thật. Không có S22 Ultra vật lý; phần đó còn chờ như chủ dự án đã chấp thuận.

Ảnh thật được xem: mẫu C sẵn sàng, S chờ, mở trọn bộ và ngang. Tên ảnh trạng thái được chụp trước/khôi phục selection keyboard để phản ánh đúng trạng thái. Ảnh hồi quy popup lưu riêng dưới QA gameplay;19ảnh lịch sử vốn sạch đã được khôi phục sau test xuất ảnh. Không đưa ảnh/log của task UI khác vào commit. Không APK, Hosting deploy/publish/push, không reset Firebase thêm lần nào. CONTEXT/ARCHITECTURE/plan được cập nhật bằng hunk riêng, giữ working tree tích hợp và baseline task khác.

## Chỉnh Wave theo phản hồi20/10

Thông báo tăng từ900ms+180ms fade lên1800ms+220ms fade (khoảng2giây). Bàn mới nâng/hiện trong520ms, ánh sáng quét700ms giới hạn đúng vùng board; chọn một board animation và scene2node thay stagger từng thẻ để giữ số animation hữu hạn. Không dùng ảnh, emoji, blur lớn hoặc loop. Scene có child scope, dọn xong và hủy khi dispose/reduced-motion/resize/scroll/background; không chèn node vào tile tree hoặc đổi timer/checkpoint/luật/save/API. Thông báo không chặn input.

Đạt14bài UI: notice/dedupe/thời lượng/60lượt hủy, cả3trò normal/reduced, chơi thật2wave cả3trò, footprint320/844/1024 và ảnh412đúng Wave2/Đợt2. Review độc lập chỉ đọc không thấy P1/P2, static/diff đạt; npm run check và npm run build đạt. Logs ui-wave-polish.log(12), ui-wave-footprint.log(1), ui-wave-visual.log(1). Máy thật chưa đo; không suy số đo/FPS. Không APK/deploy/push; giữ nguyên baseline task khác.


## 20/10 — âm thanh thưởng và chuyển wave theo lớp

Theo phản hồi cuối: popup tổng kết **chỉ thêm ba âm sao**, không có reward. `star_1/2/3.ogg` đi cùng các sao đạt tại420/800/1180ms; các hằng dùng chung với timeline hình. `reward.ogg` dùng khi nhận vật phẩm từ thẻ đặc biệt/may mắn/mốc thưởng của ba trò, nhận300xu bộ tranh và nhận thưởng rương; một cue cho mỗi batch thưởng, không gọi lại ở drop/flight. `open_box.ogg` khi mở nắp rương, `explosion.ogg` khi Sấm sét thực sự có mục tiêu hợp lệ (vẫn có âm khi reduced-motion). Sáu asset có sẵn do chủ dự án cung cấp, không sinh thêm ảnh/asset. Không thay luật hay transaction: cue chỉ chạy sau commit thành công và guard round/owner; claim thất bại không phát.

Chọn bank tối đa6Audio, mỗi cue một voice thay vì clone vô hạn. Owner đóng/mute/background dừng voice, bỏ listener và reset; ended/error/play rejection có cleanup; Promise rejection cũ không dừng voice thay thế. Cài đặt effects volume cập nhật trực tiếp; cue trễ đọc settings và guard danh tính. Giữ nhạc liên tục bằng so sánh URL đã chuẩn hóa (trước đó relative!=absolute khiến gán lại src mỗi sync), không play lại nếu đang phát, Memory không pause khi reason=wave.

Wave: thay board scale/light sweep bằng opacity của từng lớp vị trí, bốn hướng trái/phải/trên/dưới ngẫu nhiên.340ms mỗi thẻ, tối đa560ms dàn lớp, không thêm node/particle. Board mới ẩn đến decode/commit và đăng ký animation, giữ exit fill đến old-owner dispose để tránh flash. Mỗi card có tối đa một animation do arrival tạo; finish finite renderer entrance trước handoff. Reduced-motion hiện ngay; resize/hidden/unmount hủy, khôi phục visibility/inert. Cả ba adapter chờ arrival readiness rồi mới preview/input/countdown/active metrics, không chờ notice2giây. Không thay API/save/schema hiện hữu ngoài các helper presentation nội bộ và option owner bổ sung tương thích.

Nghiệm thu:

- 19 browser audio đạt:3sao đúng thứ tự, không âm reward ở summary, only earned, supersede, volume/mute/zero,30voice replacements/bounded cleanup, hidden/rejection/stale Promise/UID, rương success/failure/reopen, bộ tranh, Sấm sét normal/reduced, vật phẩm Memory/Link success/failure và milestone Triple. Sáu OGG decode và bắt đầu playback native sau click thật; không dùng spy để khẳng định khả năng phát thật. Không tuyên bố đã nghe/đo âm trên thiết bị Android. `ui-audio-wave-acceptance.log` (19audio pass);7focused sau chỉnh fixture không phụ thuộc module untracked đạt trong `ui-audio-wave-focused.log`.
- 12 browser wave-presentation +5pair +7victory/lifecycle đạt trong `ui-audio-wave-regression.log`:3game×2motion×4viewport320/412/844/1024×4hướng, layer delay đúng chiều, không thêm node/overflow, cleanup30chu kỳ và dừng giữa animation, natural completion/motion/resize, nhạc giữ nguồn/vị trí qua Memory wave thật. Link/Triple active play clock không tăng trong entrance.3full-wave thật cả ba trò qua reload và chỉ settle cuối màn đạt trong `ui-audio-wave-acceptance.log`.
- Sửa đúng một expectation xu của fixture pair từ17 thành15 (=10lucky+5milestone): HEAD đã có matchCoins/baseCoins=0, không đổi công thức. Hai fail cũ trong acceptance log là fixture này; đã chạy lại toàn bộ5pair và đạt ở regression log. Không xóa/nới assertion về transaction/rollback.
- Review độc lập chỉ đọc đối chiếu diff/index, lifecycle, cleanup, source timing và chạy lại10/10 unit wave-progress+wave-sessions;7JS index syntax và diff-check đạt. Reviewer phát hiện clock chạy khi inert, đã sửa readiness như trên và kiểm lại; không còn P1/P2 đã xác nhận trong diff.
- `npm run build` đạt (`build-audio-wave.log`, main523.44kB/168.90kB gzip; cảnh báo chunk>500kB còn hiện hữu). Các cổng check trước/sau checker Triple đạt khi chạy riêng phần còn lại, gồm technical checks và ads15/15 (`check-audio-remaining.log`). **Không đánh dấu npm run check tổng pass**: ba lần native Easy p95=21.04/40.50/26.73ms vượt20; thử default sandbox Easy qua nhưng Hard209.32ms vượt200. Logs `check-audio-wave.log`, `check-audio-wave-final.log`, `check-triple-audio-isolated.log`, `check-audio-default.log`. Không sửa generator/solver/checker hay đổi ngưỡng; đây là gate hiệu suất chưa đạt, ngoài các module âm thanh/presentation đã sửa. Không có số đo60FPS thiết bị thật; S22 Ultra vẫn chờ như đã thống nhất.

Đã xem ảnh browser của lớp thẻ Memory/Triple trên412px. Không thêm chữ kỹ thuật vào UI. Chỉ commit các hunk của task, giữ nguyên baseline giao diện/kỹ thuật khác; không APK, Firebase/Hosting deploy hay push.
