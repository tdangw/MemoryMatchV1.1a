# CONTEXT — Trạng thái hiện tại (2026-10-16)

Đọc file này khi bắt đầu task mới. Đây là snapshot điều hướng, không thay thế code/config và không chứa lịch sử triển khai chi tiết.

Người dùng đã chọn tự xuất bản website và thông điệp AdMob ngày16/10. Bản nháp **Quyền riêng tư · Memory Match Adventure** đã lưu riêng, chưa bật; URL quyền riêng tư công khai vẫn mở trang chọn trò chơi. Phần chuẩn bị quảng cáo/APK đã bàn giao; phase5 nghiệm thu trên máy thật còn chờ các bước trong `docs/ads/HUONG_DAN_THU_APK.md`. Không tự deploy khi tiếp tục task.

## Sản phẩm

- Tab Sự kiện thay Bạn bè ngày2026-10-16: action events, tiêu đề/nhãn Sự kiện, biểu tượng lịch. Hiện Sắp ra mắt, chưa triển khai tính năng sự kiện. Giữ nền courtyard hiện có và lifecycle chung; không đổi save/schema/Auth. UI36/36, review độc lập3/3, check/build web/Android pass; QA tại `docs/design/app-tabs/QA.md`.

- Profile đã bỏ dòng “Tính từ…” theo yêu cầu ngày2026-10-16; chỉ hiển thị ngày tham gia/tạo hồ sơ và tổng thời gian chơi. trackedSince/counter vẫn giữ nội bộ, không đổi service/schema/save. UI5/5, review độc lập1/1, check/build web/Android pass. Ảnh và bằng chứng ở `docs/design/app-tabs/QA.md`.

- `HOME_CAROUSEL_PLAN.md` hoàn tất: Home một trò ở giữa, vuốt trái/phải, hé trò hai bên; mũi tên/chấm và bàn phím. Native scroll-snap, scope sở hữu frame/observer/listener, không clone/tự chạy; giữ art/save/catalog/navigation và nội dung tab/popup. Phase1 commit665dafb. Home/registry17ca, regression52/52, review cuối12/12 và touch lặp5/5 đạt; check/build web/Android pass. QA: `docs/design/home-carousel/QA.md`. Không còn gate triển khai active; S22 Ultra thật còn chờ.

- Popup Thử thách/Vô tận của cả3trò đã đồng bộ với popup màn Hành trình: xem thông tin màn1 rồi bấm Chơi, không chọn độ khó; thời gian/mục tiêu/gợi ý/khay/chủ đề theo config/profile. Vô tận ghi Không giới hạn, không lặp popup intro. Hủy không đổi save/session/độ khó thường; submit có guard/retry. QA45ca có kết quả đạt, review độc lập14/14; check/build web/build Android pass. Không đổi save schema/luật chơi. Chi tiết: `docs/design/special-mode-preview/QA.md`.

- Active: `ADS_APK_TEST_PLAN.md` — phase0–4 đã đạt: chỉ banner Home/map, giữ `com.memorymatch.adventure`, bảo vệ trẻ em cho mọi người chơi, không hỏi tuổi/không cá nhân hóa, nội dung G. Unit15/15, UI71/71 + chạy lại ads9/9, check/build web/Android/APK và review độc lập đạt. Không đổi save/API/Auth. APK debug đã tạo/cài giả lập; phase5 còn chờ thông điệp AdMob riêng và trang quyền riêng tư công khai: SDK hiện chặn request vì app chưa có form. Đã xác nhận đúng App ID/unit và đặt mức G riêng trên AdMob; không deploy website. S22 Ultra/Test Ad thật/Auth APK/hiệu suất chưa xác minh. Chi tiết `docs/ads/QA.md`, hướng dẫn dễ hiểu `docs/ads/HUONG_DAN_THU_APK.md`.

- `HOME_MENU_IMPLEMENTATION_PLAN.md` là hồ sơ Home bố cục1+2 ngày2026-10-15, đã được thay bằng carousel ngày2026-10-16. Ba WebP riêng tổng349.418bytes tiếp tục dùng; nguồn art ở `docs/design/home-assets/README.md`, QA cũ ở `docs/design/home-menu/QA.md`. Ornament ảnh trên pause popup đã gỡ theo yêu cầu.

- Sheet12vùng nền trò/popup/tiêu đề/khung ở `docs/design/home-assets/README.md` chỉ là nguồn tham khảo; runtime Home dùng ba tranh riêng có master lớn hơn, không dùng sheet làm nền cả màn. Carousel hiện không dùng flourish tiêu đề, không tạo thêm art.

- `POPUP_POLISH_PLAN.md`: phase1–5 hoàn tất trong phạm vi được giao, không còn kế hoạch triển khai active. Exit bản đồ và mọi screen chức năng (gồm Cửa hàng/Bộ sưu tập) gắn header; Xu giữa Cửa hàng; title Bộ sưu tập không lặp game. Popup bám board, bản đồ dùng cùng mốc chrome ngay lần đầu; menu tạm dừng Vườn đêm có Tiếp tục. QA: `docs/design/popups/QA.md`. Hai mẫu Home và prompt ở `docs/design/home-concepts/README.md`, là nguồn tham khảo cho Home hiện tại. Không deploy/đổi save; S22 Ultra thật còn chờ.

- Tinh chỉnh tab ngày2026-10-15: sửa tên ngay cạnh tên với bút/Lưu/Hủy, dòng ngày bắt đầu theo dõi đã được bỏ khỏi giao diện ngày2026-10-16; ẩn thông báo đồng bộ bình thường. Family xếp hạng canh giữa; top3 huy chương SVG, các hạng sau số sáng không khung. Header tối và exit gắn góc phải cố định trên cả5tab. UI/emulator/check/build đã đạt; chi tiết ở `docs/design/app-tabs/QA.md`. Không đổi API/schema/save/Auth.

- `APP_TABS_VISUAL_PLAN.md`: Phase0–5 đã hoàn tất, mỗi phase một commit; không còn kế hoạch triển khai active. Bốn nền WebP mới53–112KB; Profile có name editor và stats/account trong content; Cài đặt3nhóm cuộn gồm Help/Reset; Xếp hạng khôngrefresh thường trực, fresh khi mở, menu128px và familyheading. Giữ ranking v3/Auth/save/private stats. QA: `docs/design/app-tabs/QA.md`. Không Hosting/APK/Firebase rollout; S22 Ultra thật còn chờ.

- `LEVEL_PROGRESS_LEADERBOARD_PLAN.md`: Phase0–6 đã hoàn tất; kế hoạch level không còn active. Tài liệu giữ làm hồ sơ nghiệm thu, QA thiết bị thật còn chờ riêng theo xác nhận người dùng. Mỗi trò có ba bảng level Hành trình/Thử thách/Vô tận (v3); Hành trình gom bốn độ khó theo màn đã thắng. Hai mode đặc biệt mở lượt mới từ1 khi Chơi lại/Lượt mới; resume giữ bàn, run và thời gian. Sinh màn tiếp qua100.000 với trần tài nguyên. Dropdown từ từng nút trò thay mode strip/picker màn; điểm giữ cho sao, HUD kỷ lục đúng context, map không ghi điểm trên nút. Save formatVersion2, v1/v2/Xu/kho/theme/private profile được giữ; special v3 chỉ tính từ lượt mới, adventure migration theo batch và owner. Atomic pair settlement lưu bàn+Xu+thưởng trước presentation để reload không mất/nhân thưởng. Rules/index v3 đã rollout và index READY, không deploy Hosting/APK. Báo cáo/bằng chứng: `docs/design/leaderboard/LEVEL_RANKING_QA.md`.

- `LEADERBOARD_REDESIGN_PLAN.md` và `EFFECTS_LEADERBOARD_PLAN.md` là hồ sơ lịch sử. UI sáu mode/picker và ranking theo thời gian/điểm của các hồ sơ đó đã được thay bởi v3. Profile vẫn có ngày tham gia Auth và tổng thời gian chơi dùng chung ba trò, quyền đọc owner/admin. Galaxy S22 Ultra thật và dashboard admin ngoài repo vẫn chờ; chưa tuyên bố nghiệm thu thiết bị thật.

- Ứng dụng JavaScript ES modules; backend local chính là IndexedDB theo chặng, facade persistence bất đồng bộ. Firebase Firestore Singapore đã cấu hình Rules/indexes; Auth Guest/Google, sync, xếp hạng online và Analytics production-only đã triển khai. Chưa deploy Hosting trong task này; dashboard Analytics/OAuth hosted/thiết bị thật còn cần QA trước phát hành.
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

- Hồ sơ lịch sử: `EFFECTS_LEADERBOARD_PLAN.md` (2026-10-13); Gate1–3 triển khai/browser QA đã hoàn tất; Galaxy S22 Ultra thật còn chờ theo xác nhận người dùng2026-10-14. Gate1 pool sao băng; Gate2 UI xếp hạng ba trò × sáu mode,10 người/trang và cursor; Gate3 đo/audit cảnh thắng trước khi quyết định sửa mỹ thuật. ADVENTURE_WEB_PLAN.md phase0–20 đã hoàn tất và là hồ sơ lịch sử.
- Cảnh hoa hiện tại95 phần tử SVG/ba nhóm animation hữu hạn; người dùng đã thử mobile và thấy mượt. Kế hoạch giữ hình ảnh hiện có, đo allocations/frame/paint và audit confetti còn lại/RAF cleanup khi chuyển cảnh nhanh. Sao băng dùng eligibility từ page/navigation/shell lifecycle.

- Firebase Hosting dùng chung project `memorymatchv1-1a` với ba site: target `production` → `memorymatchv1-1a`, target `beta` → `memorymatchv1-1b`, target `test` → `memorymatch-test`. `npm run deploy`, `npm run deploy:beta` và `npm run deploy:test` chỉ deploy đúng site tương ứng. Mỗi URL có storage trình duyệt riêng vì khác origin.

- ADVENTURE_WEB_PLAN.md phase0–20 đã hoàn tất. Dữ liệu hành trình riêng từng trò, mở khóa tuần tự chung bốn độ khó/sao và điểm riêng;100 màn +10 rương/chặng, thắng đủ100 mới nối chặng. Auth/backup, xếp hạng, Analytics, UI và cảnh hoa đã triển khai. Nhiệm vụ/cơ chế gameplay mới tạm hoãn; thiết kế UI hiện hành theo mục20. Chi tiết nghiệm thu/giới hạn trước phát hành ở mục16/20 và README.
- Rương tạm dùng ba gói Xu có phần cố định + ngẫu nhiên: Nhỏ 60 + 20–40 (70%), Vừa 100 + 30–60 (25%), Lớn 150 + 50–100 (5%); catalog/grants có thể mở rộng vật phẩm sau. Backend ranking cơ bản/mọi thời gian/có gửi lại offline đã được người dùng đồng ý. Agent review chỉ dùng khi cần với thay đổi rủi ro, chỉ đọc/test, không sửa/commit.
- Dock hiện tại theo mục20 có năm mục ngoài gameplay, ẩn trong gameplay. Quảng cáo chỉ chừa vùng trên Home/map; chưa gắn provider/ad unit, deploy Hosting hoặc nâng billing.
- Tài liệu repository chỉ chứa thiết kế/kế hoạch của dự án. Nội dung nghiên cứu/tham khảo trò khác chỉ ở chat; không lưu tên, mô tả, bảng so sánh, đường dẫn hoặc tài nguyên của các trò đó vào dự án.
- Hướng menu hiện tại (mục20): ngoài gameplay dùng năm tab toàn màn hình. Home: Nhiệm vụ/Sự kiện/Profile/Xếp hạng/Cài đặt, hai mục đầu Sắp ra mắt. Chọn trò: Cửa hàng/Bộ sưu tập/Bản đồ/Xếp hạng/Cài đặt. Không profile/Xu trên header; Exit góc trên phải map/tab trở về Home. Gameplay giữ HUD/bàn/khay, ẩn dock; ba gạch mở Tạm dừng với Thoát game/Chơi lại/Cài đặt, giữ ván và pause trong Cài đặt. Quảng cáo chỉ Home/map. Mục20 là scope hiện hành, thay các mô tả UI cũ.
- Bản đồ dùng sao chưa sáng/sao sáng theo kết quả của độ khó đang xem; completion chung giữa độ khó vẫn là dữ liệu riêng, không suy từ số sao. Không có tìm/lọc màn; re-entry về frontier.
- Màn thường xếp hạng riêng theo trò/độ khó/màn, ưu tiên thời gian thực đang chơi ngắn nhất (loại tải/pause/menu/tab ẩn). Cho phép hỗ trợ, guest/Google; một kỷ lục mỗi UID/bảng. Backend cơ bản client-trusted đã triển khai, contract/quota cũ ở mục12 ADVENTURE_WEB_PLAN.md.
- Luật hiện hành v3 (2026-10-15): mỗi trò ba bảng Hành trình/Thử thách/Vô tận theo màn đã thắng. Hành trình gom bốn độ khó; special Chơi lại bắt đầu lượt mới từ1, resume giữ lượt và bàn. Checkpoint/điểm v2 giữ làm lịch sử, không import special cũ vào v3; luật restart giữ lượt của Gate2 cũ đã được thay thế theo kế hoạch level.
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
- Challenge level 1–7 có tổng thẻ `18/27/42/51/66/75/93`; stage có xấp cũng dùng topology corner-safe mới. Từ màn8 dùng ladder biến thể các template5–7 với seed theo level, giữ trần tài nguyên.
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

- `LEADERBOARD_REDESIGN_PLAN.md`: kế hoạch hiện hành làm lại UI ranking, nền và phase theo dõi profile riêng; mới hoàn thành lập kế hoạch/ảnh nguồn.
- `EFFECTS_LEADERBOARD_PLAN.md`: hồ sơ Gate1–3 code/browser QA đã đạt; số đo và QA thiết bị thật còn chờ, không phải kế hoạch triển khai active.
- `ADVENTURE_WEB_PLAN.md`: hồ sơ đã hoàn tất phase0–20 và quyết định UI/data hiện có.
- `AGENTS.md`: chuẩn làm việc bắt buộc.
- `ARCHITECTURE.md`: ownership và contract kỹ thuật bền vững.
- `README.md`: cách chạy/build.
- `ADD_GAME.md`: checklist tích hợp game.
- `Memory Match.md`, `Link Connect.md`, `Triple Connect.md`: luật/thiết kế từng game.
- `themes.md`: catalog/chất lượng asset chủ đề.
- `MAP_ART_NOTES.md`: atlas trang trí/rương bản đồ vườn đêm, quy tắc bố trí và prompt gốc.

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

Phase 4: bỏ scene202nodes/CSS infinite cũ; victoryFlowerScene tạo SVG nguyên bản, victoryCelebration sở hữu animation/audio/listener và được game/page owner hủy. Triple cũng có celebration đủ100 clear và tiếp tục101. Web/Android build pass (không build APK), 6 victory/music tests pass, review lifecycle pass.

Phase5 (2026-10-13): Firebase Anonymous/Google enabled, authorized domains production/beta/test + localhost. Private Rules/indexes deployed only, no Hosting/billing change. Guest offline/reload, same-UID link, existing Google cloud/local choice, recovery backup and conflict deferred during gameplay: emulator Auth3 pass; private CAS/GC/ownership pass. Cloud uses content-addressed 64KiB chunks + CAS manifest; local restore atomic with up to3 backups and UID/generation guards. check/build pass; navigation/catalog/cleanup12 pass; independent review findings fixed. Real Google OAuth popup and Android provider flow require device/domain QA; emulator credentials do not prove hosted OAuth.

Phase6: immutable public attempts/runs with start owner; per-UID durable outbox, cap2000 with deferred refill, max20/15s; top20+own cache12 boards/120s, refresh15s. Rules ownership/schema/query-limit and concurrent best pass; Auth/ranking5 browser tests pass. Basic client-trusted all-time; no leaderboard for Memory/Link Endless. Phase6 review data findings fixed; final reviewer execution later hit account usage limit.

Phase7: production-only Analytics active_play_time theo pause/end segment, không tick/Firestore; test/beta/local/emulator bị loại. Event-clock unit pass. Queue scan patch resident khi save thường, archive recovery khi boot/import/deferred; metadata no-op không ghi. Build JS chính517,06→420,42kB; Firebase chunks tối đa472,29kB, không circular/size warning; built-bundle smoke pass. Headless dev map40 switches: patch p95 6,3ms,735 DOM nodes, no long tasks, owner diagnostics stable; cold6.841.051/warm1.607.128 bytes (raw dev resources, không tương đương production gzip hoặc mobile FPS). Auth/ranking5 regression pass. DebugView/dashboard custom metric và OAuth/device thực chưa xác minh; hướng dẫn README, không đánh dấu verified.

## Tinh gọn bản đồ — 2026-10-13

Đã hoàn tất tinh chỉnh: bỏ nhãn/điều hướng chặng, tiến trình, chủ đề và mọi nút tiếp tục ngoài map; tên trò cùng hàng avatar/Xu ở trên; một nút chọn sáu chế độ; nút màn44px và đường SVG mảnh có hoa văn tĩnh. Mỗi lần vào map trở về màn cao nhất đang chơi được ở chặng hiện tại. Bấm màn hoặc chọn chế độ đặc biệt bắt đầu lượt mới; không tự xóa phiên chỉ vì về menu. Luật/đồng hồ/ranking/economy/schema save giữ nguyên. Kiểm tra mode/focus/keyboard, re-entry, seam/reward, vòng đời và ba viewport; check/build trước hoàn tất. Không thay gameplay, backend, nền bitmap hoặc quảng cáo.

Nghiệm thu tinh gọn: check/build pass; browser33/33 (map, progression, compact shell), bản đồ cuối20/20 gồm3 trò×6 mode/keyboard/seam; built-app smoke2/2. Registry/HUD/audit/geometry/menu38 kiểm tra pass ở lượt đầu, seed expectation được cập nhật đúng variant generator và pass khi chạy lại progression. Headless dev715 DOM nodes, mode patch p95 6,7ms, không long task; chưa đo FPS điện thoại thật. Skill làm rõ yêu cầu được dùng để chốt lựa chọn vào lượt mới; không thay schema save/backend/gameplay.

## Trang trí map — 2026-10-13

Task ADVENTURE_WEB_PLAN.md mục17 đã hoàn tất, không còn gate active. Atlas gốc vườn đêm gồm14 trang trí và2 trạng thái rương; layout thuần theo game/màn, ổn định khi nối chặng và tính Y tương đối để không mất chính xác ở số màn lớn. Giữ shared map/page ownership, không thêm listener/RAF/animation loop/backend/schema. Skill imagegen được dùng để tạo và chỉnh khoảng trống atlas; prompt/nguồn ở MAP_ART_NOTES.md. check/build pass;19 map contracts được xác minh qua lượt rộng/chạy lại reward, performance1 và built-smoke2 pass. Lượt cuối722 DOM nodes, mode patch p95 5,8ms, không long task; lượt trước có54–55ms trong cửa sổ toàn tải/đo. Chưa đo60FPS trên điện thoại thật.

## Popup chọn màn — 2026-10-13

Hồ sơ đã hoàn tất ADVENTURE_WEB_PLAN.md mục18 (thiết kế cuối theo mục20): bản đồ bấm màn mở preview và chọn bốn độ khó trước khi Chơi; hai nút Vô tận/Thử thách cố định riêng. Home trái/tài khoản phải ở map; theo yêu cầu mới tiếp theo, home cũng bỏ Xu và dời tài khoản phải, không thêm nút Home trên trang chủ. Xu vẫn xem trong cửa hàng. Bỏ Home trong Cài đặt. Profile silhouette SVG được vẽ lại đối xứng, chấm trạng thái absolute để không đẩy glyph lệch. Số nhiều chữ số bị lệch vì padding chung của button; sửa padding/căn giữa/font ở owner map. Gameplay/schema/luật/mở khóa/thưởng/ranking giữ nguyên. Skill làm rõ yêu cầu dùng để chốt phạm vi header trước khi người dùng cập nhật thêm. Không dùng bitmap mới, không đưa nội dung tham khảo ngoài dự án vào source.


Điều chỉnh popup cuối mục18: dùng huy hiệu C/B/A/S, bỏ sao và lịch sử; tiêu đề Màn N · độ khó; goal/time/assist/theme lấy từ config thật. Chỉ bắt đầu map thường skip intro; Memory reveal, decode/commit gating và intro ở các lối vào khác vẫn giữ. Mục19 được người dùng giao tiếp: menu trên chỉ mở popup Exit/Restart, Help/Reset xuống Settings; footer gọi hành động controller thay click vào dropdown cũ. Thực hiện tuần tự và commit từng phần, chưa push/deploy.

Mục18 và19 đã hoàn tất: check/build và44 UI/startup pass; built3 pass; review độc lập không finding ở phần này. Thiết kế và kết quả cuối theo mục20 bên dưới. Chưa nghiệm thu FPS máy thật; chưa push/deploy.

2026-10-13: Các gate mục19–20 ADVENTURE_WEB_PLAN.md đã hoàn tất; kế hoạch hiện hành mới là EFFECTS_LEADERBOARD_PLAN.md, chưa triển khai. Thiết kế hiện hành theo mục20: home Nhiệm vụ/Bạn bè/Profile/Xếp hạng/Cài đặt; map Cửa hàng/Bộ sưu tập/Bản đồ/Xếp hạng/Cài đặt; Exit góc trên phải map/tab, không profile/Xu trên header. Gameplay không dock; popup Tạm dừng có Thoát game/Chơi lại/Cài đặt. C/B/A/S nâu/xanh dương/vàng/tím. Các tab là screen region, không dialog; giữ map subtree/scroll, cleanup scope, Settings DOM và Account subscription. HUD khóa trong startup, tránh ghi đè pause. Check/build và lượt độc lập34/34 cùng built3/3 pass, review finding đã sửa. Mục20 có chi tiết matrix78 và benchmark chạy lại; chưa QA FPS/Google thật. Không đổi save/schema và không deploy/push.



Gate1 EFFECTS_LEADERBOARD_PLAN.md (2026-10-14): pool sao băng hai node/một scheduler và eligibility Home/map trực tiếp từ owner đã triển khai. Soak animation thật10 phút/114 lần hoàn tất,100 lần chuyển Home/map/game thật giữ node/timer ổn định; post-GC heap gần7MB. So sánh35s: allocations node6→0, frame p95 8,1→8,1ms/không long task trên Chrome155 Windows/DPR1. Check/build và browser tests pass, review độc lập. Chưa có số đo Galaxy S22 Ultra; không tuyên bố FPS thiết bị thật. Gate2/3 đã hoàn tất phần mềm; QA thiết bị thật còn chờ, xem hồ sơ bên dưới.


Hồ sơ lịch sử Gate2 EFFECTS_LEADERBOARD_PLAN.md (2026-10-14): checkpoint thắng v2 cho Challenge/Endless cả ba trò, best-only theo số màn thắng/điểm các màn thắng; stage cùng transaction settlement, thất bại không outbox, restart thay điểm/advance cộng một lần/finalize không gửi màn dở. runBestsV2 mới giữ runBestsv1 làm lịch sử; nhập v1 chỉ khi matching finalized run chứng minh totals. UI3trò×6mode/10người+own/cursor11entries, cache12board×5page/100cursor và UID/generation guard. Browser emulator10/10, UI/data/catalog12/12, Rules/pure/check/build pass, review độc lập findings đã sửa. Không deploy Rules hoặc Hosting; index hiện có đủ. Gate3 đã hoàn tất phần mềm; thiết bị thật chưa đo. Luật v2 trong đoạn này đã được v3 thay thế theo kế hoạch level.


Gate3 EFFECTS_LEADERBOARD_PLAN.md (2026-10-14): audit phát hiện orphan fireworks/confetti và continuation summary cũ cùng parent; đã sửa scope/cancel/generation, instance confetti riêng, counter motion/visibility cleanup. Giữ95SVGnode/nhạc/timeline/cap và màu. Final browser23/23 + profile2/2, independent review12+3tests, check/web/Android-wrapper build và built-smoke2/2 pass. Soak30vòng giữ1127node/76listener, heapdelta≈42KB; flower overlap canvas1→0. Chrome155 Windows/DPR3 mô phỏng có flower p95≈8,5ms/no long task; trace không chứng minh FPS điện thoại. Người dùng xác nhận không có thiết bị/remote debug và cho ghi QA Galaxy S22 Ultra còn chờ. Không còn gate code active; kế hoạch giữ làm hồ sơ có mục QA vật lý chưa xác minh. Không deploy/push hoặc APK.
