# CONTEXT — Trạng thái hiện tại (2026-10-20)

## Triển khai Cổ tích và Thành tích — 23/10/2026

- Đã giao toàn bộ D0–Q1 trong `ILLUSTRATED_UI_ACHIEVEMENTS_PLAN.md`, commit từng phase; receipt chung: `STORYBOOK_IMPLEMENTATION_RECEIPT.md`. Các giới hạn chỉ chuẩn bị bên dưới là lịch sử của lượt trước.
- D0 đã duyệt 30 quà/thứ tự/hình, giữ 300 Xu và receipt cũ; sau màn 10 tiếp tục chơi nhưng chưa có quà mới. Duyệt Cổ tích/storybook, font miễn phí đủ dấu Việt, bản ghép thật 412×915 phải duyệt trước rollout.
- Bổ sung trực tiếp: avatar/khung/huy hiệu đang trang bị phải công khai trên BXH, đồng bộ khi lưu Hồ sơ; không thay điểm hay thứ tự xếp hạng. Thay quyết định cục bộ ban đầu. Chưa cho phép deploy dịch vụ/APK/push.

## Nghiệm thu giao diện toàn dự án — 22/10/2026

- GAME_UX_SKIN_PLAN.md G0–G10 đạt phạm vi web; trạng thái cũ phía dưới giữ làm lịch sử. Hồ sơ duy nhất: docs/design/advanced-ui/IMPLEMENTATION.md, phần G10 và runtime/qa/G10_SUMMARY.json.
- Đã ghép gỗ/giấy trên toàn ứng dụng, giữ Mặc định/Nâng cao; ba bài tập có bàn tay SVG tại Cài đặt→Hướng dẫn→Tập luyện. EXP/bốn rương/tranh giữ transaction và kinh tế hiện hữu.
- Production32/32 (1920state,3trò/2skin/4viewport/2motion/DPR2–3), hồ sơ8/8, offline1/1, mua thật2/2, đo4/4, thua thật8/8; check/build pass và review độc lập đã đóng P2 race lưu skin. Không xác nhận FPS điện thoại thật hoặc Google OAuth/Firebase live.
- Không APK/push/deploy hoặc server trùng; các thay đổi đồng thời của công việc khác được giữ ngoài commit UI.

## Kế hoạch hiện hành: giao diện toàn dự án, hướng dẫn và phần thưởng — 20/10/2026

- Nguồn kế hoạch hiện hành duy nhất cho công việc giao diện/hướng dẫn/phần thưởng này: [GAME_UX_SKIN_PLAN.md](GAME_UX_SKIN_PLAN.md). Chủ dự án xác nhận **phạm vi toàn bộ ứng dụng và cả ba trò**, không chỉ popup thắng. Lượt làm rõ này cập nhật kế hoạch/inventory, chưa triển khai toàn bộ skin vào sản phẩm.
- Phạm vi bắt buộc: startup/Home; dock Home (Nhiệm vụ, Sự kiện, Profile — đề xuất nhãn Hồ sơ, Xếp hạng, Cài đặt); dock từng trò (Cửa hàng, Bộ sưu tập, Bản đồ, Xếp hạng, Cài đặt) và nội dung/tab con; preview; HUD/menu/bàn/công cụ ba trò; mọi họ popup, toast/tooltip; tiến trình/rương/tranh/hướng dẫn. Kế hoạch có bảng owner, ảnh so với dữ liệu động, state, nhóm sheet và gate G0–G10. Nhiệm vụ/Sự kiện chỉ thiết kế trạng thái hiện hữu, không tự thêm chức năng.
- **Chủ dự án đã loại hướng Ngọc Lam vì quá giống mặc định.** Hướng mới theo mẫu gửi20/10: gỗ/giấy sáng, ribbon đỏ, sao vàng tròn, nút cam/xanh lá nổi khối. Giữ lựa chọn Mặc định/Nâng cao; không tiếp tục dùng palette Ngọc Lam làm nguồn triển khai.
- Nguồn mới: docs/design/advanced-ui/woodland (14asset, manifest, prompt và phép kiểm trên popup js/ui.js thật). **Đây chỉ là mẫu thử phong cách cho popup thắng, chưa phải catalog toàn dự án.** Test chụp mặc định rồi tiêm CSS review lên cùng DOM/kết quả ở3trò×4viewport; chỉ là fixture hiển thị, không phải lượt chơi thắng tự nhiên hoặc test grant thưởng. Kết quả cuối/giới hạn nằm trong README và qa/ của bộ mới; chưa đưa vào public/preload.
- Lượt xác nhận cuối bộ mới:12/12case đạt, gồm icon/nhãn/ô số không chồng, panel/nút trong viewport và body hiện đủ tiêu đề/ba hàng kết quả; đã sửa tràn ô số và clipping ở320px/landscape. Ảnh đối chiếu chính là woodland/qa/comparison-runtime.png, không phải comparison.png của bản HTML cũ.
- Bộ52asset và24case HTML độc lập Ngọc Lam giữ làm lịch sử thiết kế chưa duyệt; chúng **không chứng minh popup thắng sản phẩm**. Bản ghép cũ có bố cục/nút đóng khác thật; không dùng ảnh đó làm baseline nữa.
- Build web trong lượt thiết kế đạt; check chung trên working tree dừng tại sound.js:5(import.meta.env.MODE trong Node), ngoài thay đổi bộ ảnh. Không báo check toàn dự án đã đạt; giữ log trong QA của bộ thiết kế, không sửa/hoàn nguyên code âm thanh của công việc khác.
- Hướng dẫn tương tác ba trò và nâng trải nghiệm10mảnh/300xu là các luồng trong cùng kế hoạch hiện hành; không đổi luật/kinh tế hoặc coi Rương Sưu Tập là phần thưởng cộng thêm. Không đánh dấu UI toàn dự án hoàn tất nếu mới có popup thắng. Khi được giao triển khai toàn kế hoạch thì làm liên tục các gate chưa đạt trong phạm vi được giao; yêu cầu cập nhật kế hoạch hiện tại không tự cấp phạm vi sửa runtime toàn app.

## Gameplay nhiều đợt và Kho báu hành trình — 20/10/2026

- Chuyển wave hiện hành: thông báo khoảng 2 giây; thẻ mới hiện theo lớp với bốn hướng ngẫu nhiên, không quét sáng. Chờ bàn sẵn sàng mới chạy giờ; nhạc tiếp tục xuyên suốt, không đổi nguồn khi đồng bộ. Hiệu ứng có owner, cleanup và reduced-motion; không đổi gameplay/save.
- Hoàn tất P0–P9 và R0–R6 của kế hoạch tiến trình gameplay đã hoàn tất, commit từng phase. Dễ mở màn kế và độ khó kế; wave2/3/4/5 theo mốc1–10/11–50/51–90/91+, dùng đồng hồ chung và tiếp tế giữa wave cho timed. Đầu game/thay wave có notice giữa màn và chuyển bàn hữu hạn.
- Kho báu hành trình: mỗi trò ×10màn có Mầm Non/Lá Bạc/Hoa Vàng/Ánh Sao; EXP10/lần thắng đầu đúng độ khó,100/rương; thứ tự C→B→A→S, giữ tiến độ kiếm trước và receipt. Bốn thẻ cùng hiện, xem thưởng, Chơi tiếp qua preview, mở sau atomic commit; summary tên rương +kinh nghiệm thực. Tranh/300Xu riêng. SVG native cho rương, ba tranh của P7 dùng imagegen.
- Luật mới dùng gameplaySeason1/IndexedDB3 và gamespace *-waves1; wire rankingv3 giữ trong vùng riêng. Firestore Rules-only đã deploy theo chấp thuận. Reset toàn bộ gameplay Firebase đã backup87tài liệu rồi xóa/kiểm kê0; giữ Auth/Hosting/config, không lặp xóa dữ liệu mới. Backup riêng bị ignore.
- Đạt unit33/33, UI cuối60/60 +3boundary, check/build và production smoke2/2; review độc lập không còn P1/P2 xác nhận. UI/lifecycle/economy chi tiết ở docs/qa/gameplay-progression/RECEIPT.md. S22 Ultra thật còn chờ thiết bị; không APK/Hosting/push. Baseline UI/kỹ thuật của task khác vẫn giữ và không đưa vào commit gameplay.

Đọc file này khi bắt đầu task mới. Đây là snapshot điều hướng; code/config và ARCHITECTURE.md là nguồn contract hiện hành. Các kế hoạch đã hoàn tất hoặc bị thay thế đã được xóa theo yêu cầu chủ dự án; giữ nguyên receipt, log, baseline, ảnh QA và nguồn artwork. Không khôi phục kế hoạch lịch sử từ Git làm nguồn triển khai.

## Công việc hiện hành và giới hạn

- Kho báu hành trình R0–R6 đã hoàn tất trên web; xem phần gameplay cập nhật20/10 ở đầu file và receipt chung.

- Các gate kỹ thuật/UI cũ đã hoàn tất. Kế hoạch GAME_UX_SKIN_PLAN.md hiện bao phủ giao diện toàn dự án; mới có mẫu thử popup thắng, các màn/asset/runtime còn lại đang ở mức kế hoạch. Lượt hiện tại chỉ cập nhật phạm vi và đặc tả; không tự mở lại task cũ hoặc báo toàn bộ giao diện đã xong. Chủ dự án đang thử web.
- Kế hoạch tiến trình gameplay P0–P9 và R0–R6 đã hoàn tất và được xóa; contract hiện hành ở phần gameplay và ARCHITECTURE.md. Giữ giới hạn máy thật và ranh giới baseline của task khác.
- Giữ [kế hoạch quảng cáo/APK](ADS_APK_TEST_PLAN.md): phần mềm đã bàn giao, Gate5 quảng cáo thật/Galaxy S22 Ultra/Auth native/hiệu suất thiết bị còn chờ. Đây không phải chỉ thị tự tạo APK hoặc triển khai thêm quảng cáo.
- Người dùng chọn tự xuất bản website và thông điệp AdMob ngày16/10. Bản nháp Quyền riêng tư đã lưu riêng, chưa bật; URL công khai lần kiểm tra trước vẫn trả trang chọn trò chơi. Cần xác minh lại khi chủ dự án hoàn tất xuất bản. Hướng dẫn: [thử APK](docs/ads/HUONG_DAN_THU_APK.md), [QA quảng cáo](docs/ads/QA.md).
- Các lượt chỉnh hiện tại chỉ kiểm tra web. Không tự tạo APK, deploy, push, bật Publish, đổi dịch vụ hoặc nâng billing. APK chỉ khi người dùng yêu cầu rõ; APK cũ không chứa các chỉnh web mới.
- Chưa xác minh điện thoại vật lý, audio/SDK quảng cáo thật, OAuth hosted và dashboard Analytics/admin. Desktop/emulator không chứng minh FPS điện thoại.

## Kết quả gần nhất

- Chỉnh popup kết quả20/10: sao chưa đạt giảm sáng/độ nổi; sao giữa lớn thêm khoảng4px và nâng4px trên cả normal/reduced-motion. Chỉ presentation trong styles/modals.css, giữ artwork, số sao, timing và phần thưởng. Kiểm tra responsive và bằng chứng ghi chung trong receipt UI.

- Loading mở/tải lại ứng dụng19/10: cổng vườn tĩnh, không %, theo mốc tải thật; dải sáng báo xử lý và fade180ms theo phản hồi mới. Home không còn chờ toàn bộ ảnh; reduced-motion bỏ chuyển động/fade. Có retry, save recovery, cleanup và PWA late registration; không hiện lại khi đổi trò/màn. Nền/prompt/generator tại docs/design/loading/ASSETS.md; bằng chứng bổ sung chung trong receipt UI. Không đổi luật/API/save, không APK/deploy.

- Chỉnh web19/10: Hướng dẫn/thông tin và Giới thiệu & phiên bản căn giữa vùng popup khả dụng bằng alignment hiện hữu. Level chưa mở thêm ổ khóa SVG ở góc và mờ hơn; huy hiệu đã mở và logic tiến độ/đóng popup giữ nguyên. Bằng chứng chung ở receipt UI.

- Phản hồi web19/10: HUD cả ba trò trở về một hàng, màn dọc hẹp dùng chữ/nút gọn hơn (44px cao,36px rộng control, icon18px); giữ tất cả chỉ số. Popup chơi lại bỏ ribbon cũ, tiêu đề chữ24px đồng bộ; không đổi thời gian giới thiệu/hành vi. Bằng chứng bổ sung chung tại receipt UI.

- Kỹ thuật G0–G9, gồm G2A/G2B và G3A/G3B, đã hoàn tất cho cả ba trò. Memory có model theo ID; Link tách quyết định lượt/truy vấn đường; củng cố transaction booster và Triple cleanup, giữ Game Shell/Effect V2/reducer/worker/solver/ghost hiện hữu. Ngoại lệ hành vi duy nhất được chủ dự án duyệt: **Sấm sét không trừ kho nếu không có cặp hợp lệ**; lượt hợp lệ không đổi thứ tự/RNG/timing. [Receipt kỹ thuật](docs/qa/technical-improvement/RECEIPT.md).
- Kỹ thuật: check/build web đạt, responsive141/141, kiểm tra trọng yếu cuối19/19, production3/3, soak200chu kỳ/profile normal/reduced-motion. Link boolean fixture145,1832→4,2597ms (−97,1%), full listing154,2962→110,7714ms (−28,2%). Đây là số đo desktop deterministic, không phải FPS điện thoại.
- UI U0–U7 đã hoàn tất theo hướng vườn/gỗ/giấy, dịu màu và gọn. Icon chức năng SVG, exit/close/fullscreen và Chơi/CTA đồng bộ; dock selected có nền/indicator trong cùng box; HUD, công cụ, popup/summary/khay thống nhất. Giữ huy hiệu level đã mở; level khóa cùng kiểu trầm hơn, đường bản đồ xanh lam xám tách sao vàng. Giữ nền/tranh/cảnh hoa, không tạo raster mới. [Receipt UI](docs/design/ui-consistency/RECEIPT.md).
- UI: check/build cuối đạt; regression101/101, review trọng yếu23/23, responsive138/141 và3/3 chạy lại sau sửa, production4/4 và build subpath đạt. Soak100chu kỳ/profile,40restart/profile: tài nguyên owner sau dispose về0; heap có tăng warmup hữu hạn, không tuyên bố không bao giờ tăng bộ nhớ. Home A/B:16→2request ảnh UI,135.218→18.376byte truyền ảnh UI (−86,4%); DOM289→302 do vector. Main JS gzip154,92→154,88kB; CSS gzip37,94→37,62kB. Chưa có phản hồi chủ dự án duyệt từng màu trên bản mới.
- Luật/timing/seed/layout/phân phối, kinh tế/giá/drop/reward, public API/catalog/effect ID/save key/schema/format và tiếp tục phiên cũ vẫn tương thích, ngoài ngoại lệ Sấm sét đã duyệt. Không giảm delay, mở input sớm hoặc gộp save để đổi hành vi.

## Sản phẩm và điều hướng

- Ba trò Memory Match, Link Connect, Triple Connect dùng Game Shell chung; state/session theo từng game và mode. Controller/renderer mỗi trò sở hữu luật và presentation đặc thù, không import chéo controller.
- Home có Nhiệm vụ/Sự kiện/Profile/Xếp hạng/Cài đặt; map có Cửa hàng/Bộ sưu tập/Bản đồ/Xếp hạng/Cài đặt. Nhiệm vụ/Sự kiện hiện Sắp ra mắt, không triển khai hệ thống mới. Header không profile/Xu; Exit map/screen về Home; Xu xem trong Cửa hàng/HUD.
- Home dùng native scroll-snap nối vòng với cùng ba node; không clone/tự chạy/RAF loop. Memory dùng portraitv2, ba ảnh tổng323.366byte. Nguồn art và QA lịch sử giữ trong docs/design/home-assets và docs/design/home-carousel.
- Gameplay ẩn dock. Ba gạch mở Tạm dừng; Cài đặt giữ ván và pause. Popup neo theo board/visualViewport/safe-area, body dài cuộn và footer tới được; owner placement/focus/busy/cleanup giữ nguyên.
- Bản đồ riêng từng trò, mở khóa tuần tự chung bốn độ khó; sao/điểm theo độ khó, completion không suy từ sao. Mỗi chặng 100 màn có 10 mốc kho báu, mỗi mốc gồm 4 rương; đủ 100 màn mới nối chặng, re-entry về frontier. Preview chọn C/B/A/S; chỉ Chơi mới launch, không bỏ Memory reveal/readiness gating. Thử thách/Vô tận xem màn1 trước Chơi, không radio độ khó; Hủy giữ phiên.
- Rương hành trình dùng thưởng cố định từ `js/progression/masteryRewards.js`: C (Mầm Non) 30 xu + 1 Gợi ý; B (Lá Bạc) 60 xu + 2 Gợi ý; A (Hoa Vàng) 100 xu + 3 Gợi ý; S (Ánh Sao) 160 xu + 4 Gợi ý. Công cụ thuộc đúng trò; mỗi cấp nhận một lần theo cụm 10 màn và thứ tự C→B→A→S. Đủ 10 mảnh tranh nhận thêm 300 xu một lần, độc lập với rương. Gói ngẫu nhiên Nhỏ/Vừa/Lớn là cơ chế cũ, không dùng cho đường nhận rương hiện hành.
- Web chừa banner58px (50+8) trên mọi tab và gameplay ba trò; Android mọi tab, gameplay native tắt. Web ba cảnh SVG/CSS không chữ,6s/cảnh, reduced-motion tĩnh; dispose hủy scene/listener. Không biến web artwork thành xác nhận quảng cáo SDK thật.
- Profile sửa tên trong hàng, chỉ hiện ngày tham gia/tạo hồ sơ và tổng thời gian chơi; trackedSince vẫn nội bộ. Sự kiện thay Bạn bè, giữ tên asset courtyard để ổn định pipeline. Cửa hàng/Bộ sưu tập lưu stable tab ID riêng theo game/surface.

## Runtime, dữ liệu và dịch vụ

- ES modules HTML/CSS/JS; IndexedDB theo profile/chặng qua persistence bất đồng bộ, formatVersion2. Giữ nguồn v1 phục hồi; backend mới từng dùng thì không quay về v1. Dữ liệu hỏng/version lạ chặn ghi; failure rollback RAM và chặn snapshot phụ thuộc tới recovery. Không reset Xu/kho/theme/record/session khi chuyển định dạng.
- Snapshot theo game/mode; transaction bàn+ví+kho+thưởng bền vững trước presentation. Callback có round/generation guard, không cấp thưởng lại ở hoạt ảnh. Timer/checkpoint theo sự kiện/nhịp cấu hình, không persist mỗi frame/tick.
- Theme ảnh weighted without replacement, giữ tối đa ba board gần nhất theo theme. Image chọn asset path, generated chọn stable ID; snapshot mapping giữ qua Continue, round production mới có seed mới. Theme history/session commit và rollback cùng nhau.
- Xếp hạng v3: mỗi trò ba family Hành trình/Thử thách/Vô tận theo màn đã thắng; Hành trình gom bốn độ khó. Special Chơi lại/Lượt mới từ1, resume giữ bàn/run/thời gian. Điểm vẫn phục vụ HUD/sao. v1/v2 giữ lịch sử/tương thích, không chứng nhận special cũ thành v3. Rules/index v3 đã rollout; không deploy Hosting trong các task này. [QA ranking](docs/design/leaderboard/LEVEL_RANKING_QA.md).
- Firebase Guest/Google, backup chunk/hash/CAS, ranking outbox và Analytics production-only đã triển khai. Sync chỉ áp dụng ở menu, UID/generation guard; client-trusted ranking, không tự thêm anti-cheat/dịch vụ. OAuth thật/dashboard vẫn cần QA. Private playtime dùng counter monotonic owner/admin, checkpoint30s; hard-kill có thể mất phần chưa commit, không suy thời gian từ kỷ lục.
- Effect V2 runtime đã hoàn tất; tinh chỉnh mỹ thuật từng hiệu ứng chỉ khi yêu cầu mới. Sao băng pool hai node/một scheduler, chỉ Home/map đủ điều kiện. Cảnh thắng fireworks/confetti/hoa có cancellation và scope riêng; reduced-motion/visibility/dispose giữ cleanup. Browser/soak đã kiểm, thiết bị thật còn chờ.

## Triple Connect và nguồn cấu hình

- Reducer/events/worker/solver/ghost presentation là nền tảng hiện hữu, không viết lại. Tổng thẻ/ladder/xấp/topology/solver budget lấy từ config/model; không đổi trong refactor.
- Khay cơ bản7ô, mở rộng3.000Xu/ô tới10; renderer luôn10node, dọc10ô dùng5×2. Milestone v2:10mốc,step3,target30; Lucky chỉ Challenge. Challenge8+ dùng ladder template5–7, seed theo level và trần tài nguyên.
- Combo theo bộ ba/màn:≤8 là15s,9–15 là20s,≥16 là30s; match reset window, Miss/hết giờ reset current và giữ maxCombo. Time bonus chỉ cộng một lần khi kết thúc timed.
- Các giá trị trên là chỉ dẫn điều hướng; sửa config source, không sửa file generator output. Game Shell token sinh bằng shell:sync; asset manifest/URL do generator riêng sở hữu.

## Tài liệu và bằng chứng giữ lại

- [AGENTS.md](AGENTS.md): chuẩn làm việc; [ARCHITECTURE.md](ARCHITECTURE.md): ownership/contract; [README.md](README.md): chạy/build; [ADD_GAME.md](ADD_GAME.md): tích hợp trò.
- Memory Match.md, Link Connect.md, Triple Connect.md: luật/thiết kế; themes.md: catalog/chất lượng; MAP_ART_NOTES.md: nguồn atlas bản đồ.
- Receipt kỹ thuật/UI ở trên là nơi tra kết quả, baseline, phép đo và giới hạn. Các QA lịch sử trong docs/design và docs/ads vẫn giữ; ảnh cũ không thay thế trạng thái UI mới và không bị ghi đè khi dọn kế hoạch.
- Kế hoạch mới chỉ tạo khi task cần, xác định rõ trong CONTEXT.md. Không coi mục lịch sử chưa đánh dấu trong receipt cũ là yêu cầu triển khai mới.

## Quy tắc tiếp tục và bàn giao

- Kiểm tra Git status/diff, coi mọi thay đổi có sẵn là của người dùng; không reset/ghi đè, không dọn tiện .vscode hoặc ảnh QA.
- Test mục tiêu trước, suite rộng theo phạm vi shared owner; layout/hit target/overflow cần mobile hẹp, phổ biến, landscape và desktop. Galaxy S22 Ultra CSS412×915 là viewport tham chiếu, không thay thiết bị vật lý.
- Implementation và review sau implementation là hai bước riêng; đọc diff theo acceptance và chạy lại kiểm tra trọng yếu. Test/build không thay visual review hoặc số đo thiết bị.
- dist, test-results, playwright-report, node_modules và manifest sinh là output có thể tái tạo; không dọn thủ công ngoài phạm vi. Không tạo báo cáo riêng cho từng chỉnh web nhỏ; bổ sung bằng chứng chung phù hợp.

- Âm thanh/chuyển wave20/10: sao1–3 phát theo sao đã đạt, tổng kết không phát reward; reward dùng cho vật phẩm/thưởng bộ tranh/rương, open_box khi mở nắp, explosion cho Sấm sét. Voice hữu hạn theo owner, mute/volume/hidden/close được tôn trọng. Wave mới hiện theo lớp bốn hướng ngẫu nhiên, bỏ sweep/flash, chờ thẻ sẵn sàng mới chạy giờ; nhạc không đổi nguồn/chạy lại giữa wave. Build web, kiểm tra chức năng và lượt check toàn dự án sau khi đồng bộ hướng dẫn/tài liệu đều đạt. Các lần đo Triple biến động trước đó giữ trong receipt chung; không đổi generator/ngưỡng. Chi tiết chung tại docs/qa/gameplay-progression/RECEIPT.md. Không đổi schema/save, không APK/deploy.

- 20/10 — Quyết định hiện hành của chủ dự án: ghép thành công nhận cố định 2 xu mỗi cặp (Memory Match/Link Connect) hoặc bộ ba (Triple Connect), không tăng theo combo; giữ nguyên thưởng thắng màn và các nguồn thưởng riêng. MATCH_COINS_PER_GROUP tại js/progression/gameplayRules.js là nguồn chung; lưu ví cùng lượt ghép trước hiệu ứng. Triple dùng dấu đã nhận hiện hữu để không cấp lại khi hoàn tác/tiếp tục. Luật 0 xu cho ghép thường trong đợt nhiều wave ngày19/10 đã được thay bằng quyết định này. Âm unlock_1.mp3 dùng khi mở băng; coin_drop.mp3 dùng cho mỗi đợt xu rơi, theo cài đặt âm lượng/tắt tiếng.

- 22/10 — Âm thanh và phản hồi thẻ: tiếng hoàn thành đợt phát sau lượt ghép cuối đã lưu, tiếp tục phát hết qua bàn mới; chọn độ khó và nút đóng dùng âm riêng. Đóng băng Link Connect kéo dài 15 giây; xáo trộn Link/Triple dùng hai kiểu gom giữa và xoay vòng, có cleanup khi đổi màn/ẩn ứng dụng. Thẻ được chọn/Gợi ý nhô nhẹ ở cả ba trò; Triple nhô trước khi bay vào khay, tôn trọng giảm chuyển động. Không đổi schema/save hoặc luật thưởng.
