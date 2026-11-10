# CONTEXT — trạng thái hiện hành 07/11/2026

## Phạm vi hiện tại và nguồn sự thật

- BXHv4 đã phát hành web test10/11 theo `LEADERBOARD_REFRESH_PLAN.md`: https://memorymatch-test.web.app, build87b12ffae370b5bf, data test-waves1. Rules dùng chung chỉ bổ sungBXH, rulesetd6bbe9d7-ab3c-4736-81a9-ad2b620f83d3 đã đọc lại đúng; indexCICAgOi3kJAK READY. 12board live tải được; ghép thẻ/lưu máy/dùng gợi ý vẫn đạt khi offline, giữ sửa local-first của chat mốc thưởng. Commit riêng phần BXH; không phát hành Hosting production/APK. Chi tiết QA/receipt/rollout trong kế hoạch; không đưa runtime/log/ảnh vào commit.

- Các task triển khai đã giao về gameplay/runtime, nền động, sự kiện, vòng quay, nhiệm vụ, ghép chữ, tài khoản, quảng cáo và Android đã hoàn tất trong phạm vi được duyệt. Các kế hoạch cũ đã đóng; không dùng chúng để triển khai lại.
- Lượt trang chủ mới đang có thay đổi riêng ở gameSelector/home-menu, ảnh adventure-cover và các test liên quan. Không đưa phần đang làm này vào commit Android hoặc coi là bản đã kiểm thử/bàn giao; người phụ trách lượt đó cập nhật trạng thái khi xong.
- Đã xóa 10 kế hoạch hoàn tất/bị thay thế; không phục hồi chúng từ Git làm lệnh thực thi. Task mới cần kế hoạch thì tạo một kế hoạch hiện hành và ghi rõ tại đây. Giới hạn kiểm thử thiết bị hoặc các mục Play để sau không tự mở lại task cũ.
- CONTEXT chỉ giữ trạng thái mới nhất; contract phải đối chiếu code/config, ARCHITECTURE và ba tài liệu game. Receipt/audit là bằng chứng tại thời điểm ghi, không phải chính sách mới hoặc quyền triển khai.
- Android/tài khoản/quảng cáo/lifecycle và regression đã commit trong57e81a8; mốc nhiệm vụ/quà trước đó e1059f2. Lượt này chỉ commit phần đã hoàn tất và dọn tài liệu, không build/deploy/upload. Thay đổi Home mới vẫn ngoài commit; không coi HEAD là toàn bộ nguồn đang có trên máy.

## Nguồn, APK, web test và Play là các mốc khác nhau

- Nguồn hiện tại đã có nhiệm vụ không Gợi ý 3 ván, tinh chỉnh UI nhiệm vụ/chữ/kim quay và quà test bốn nhóm (commits 2471d41, 9cb579d, fba70cb, 680012e, e1059f2). Các phần này hoàn tất; không còn agent UI đang chặn bản quảng cáo.
- APK gần nhất đã giao: runtime/releases/MemoryMatchAdventure-1.1a.2-ads-profile-test.apk; 43.411.501 byte; SHA256 0b328ad726e3b3f6c41c2a569192b8f97998538410a60add8900abd6d1a0e2c7. Release tối ưu R8/shrinkResources, ký upload key cũ và đã xác minh 3.229 assets. Biên bản: ANDROID_RELEASE_RECEIPT.md.
- APK này chốt ở 957fe2c cộng sửa tài khoản/quảng cáo/Android, snapshot runtime/ads-profile-frozen. **Chưa chứa các thay đổi nhiệm vụ/quà test/UI mới nêu trên.** Snapshot chỉ để tái hiện bản bàn giao, không là nguồn phát triển mới.
- Hosting memorymatch-test.web.app được cập nhật từ cùng mốc chốt APK; chưa phát hành lại các thay đổi nguồn mới. Ba URL pháp lý /legal/privacy.html, /legal/terms.html, /legal/delete-account.html đã kiểm HTTP200. Không đổi production Hosting.
- Rules nhiệm vụ ngưỡng 3 và quà test mới đã được các lượt sau phát hành/đọc lại khớp theo biên bản task. Không gọi hash rules 673057c5… của APK cũ là rules live hiện tại. Lượt dọn tài liệu này không truy cập lại dịch vụ.
- Do nguồn/rules đã tiến lên sau APK/web, không dùng APK cũ để xác nhận tính đúng của luật mới. Lần đóng gói được giao tiếp theo cần kiểm tích hợp nguồn và rules hiện hành, nhất là mốc nhận nhiệm vụ/quà; không tự build trong lượt tài liệu.
- Play được xác nhận gần nhất vẫn kênh nội bộ **1.1a (1)**, phát hành 06/11/2026 lúc 20:55 giờ Việt Nam. Chưa upload AAB mới cho các sửa sau đó. Link thử: https://play.google.com/apps/internaltest/4701301147015043710.

## Quy định đóng gói và phát hành

- APK chỉ để test **không tăng phiên bản**; hiện giữ versionName1.1a.2/versionCode2. Chỉ cập nhật phiên bản khi làm AAB đưa Store; versionCode phải lớn hơn mọi mã từng upload. Không tự tăng sau mỗi build.
- Từ thư mục dự án: npm run android:apk:release tạo android/app/build/outputs/apk/release/app-release.apk; npm run android:aab tạo android/app/build/outputs/bundle/release/app-release.aab. Cả hai build web Android, sync rồi build Release và cần cấu hình khóa ký hiện có.
- npm run android:apk là Debug, khác lệnh Release. Không thay hoặc tạo lại khóa upload. Khóa/mật khẩu nằm ngoài Git; không đưa vào báo cáo hoặc bundle.
- Chỉ tạo APK khi được yêu cầu; không tạo sau mỗi chỉnh nhỏ. Chờ chủ dự án test và xác nhận riêng trước upload Play. Không tự deploy/push/production/billing từ tài liệu này.
- APK ký upload key khác Play App Signing; thay bản khác chữ ký có thể cần gỡ và mất dữ liệu máy. Xác nhận dữ liệu cần giữ đã đồng bộ Google trước khi gỡ.

## Tài khoản, bảo mật, quảng cáo và Android

- Firebase Guest/Google, Credential Manager Android đã tích hợp; chưa cần email/password. Hồ sơ sửa tên tại chỗ, UID 6đầu…4cuối/copy đầy đủ; avatar/khung/huy hiệu chọn lại để bỏ trang bị. Chỉ ngày tạo hồ sơ/tổng thời gian chơi hiện ra ngoài, trackedSince nội bộ.
- Nút Google/Đăng xuất/Xóa tài khoản xếp cột đều, nút 48px; khách không hiện Đăng xuất. Logout lưu xong rồi dọn local/tạo khách sạch, không chép Xu cũ vào khách. Mất mạng không giả thành công.
- Reset xóa tiến trình cả ba trò, Xu/vật phẩm/stats/thứ hạng, giữ UID/tên/đăng nhập. Xóa tài khoản xóa cả dữ liệu trực tuyến và thiết bị, rồi Auth. Journal phục hồi khi gián đoạn; marker accountOperations giữ khóa writer/thiết bị cũ, không tuyên bố xóa mọi dấu vết. Không Functions/TTL/worker trả phí.
- UI xóa/reset: đáp án → xác nhận phạm vi → 10 giây có thể hủy; chờ chỉ chạy foreground, guard UID và cleanup idempotent. Không đổi schema save vì đổi giao diện.
- AdMob đã bật Android: banner menu/tab/ba bàn chơi; video nhận thưởng có quà thật sau earned; interstitial chỉ Chơi tiếp khi sẵn sàng, cách ít nhất 3 màn/120 giây. Không chèn toàn màn hình giữa ván, khi mở app hoặc khi thoát; không có ad thì đi tiếp ngay.
- Một khóa quảng cáo toàn màn hình, banner/âm thanh/nền tạm dừng và phục hồi theo owner; quota video10/ngày, journal chống cấp trùng và nhận lại sau mất mạng. RewardedBridge kết thúc cả xem dở, earned trễ vẫn ghi đúng một lần. Chủ dự án chấp nhận xác nhận từ client trên Spark; không SSV/chống app sửa đổi hoàn toàn.
- Tài khoản AdMob flappycyberpunk@gmail.com; publisher pub-2780380420199964; app~5572977569, banner/4149796201, rewarded/3309776306, interstitial/4262880842. Bảo vệ trẻ em cho mọi người chơi, không cá nhân hóa, mức G; manifest loại AD_ID/AdServices.
- Web chỉ dùng artwork banner SVG/CSS không chữ, không tải SDK Android; không vẽ đè nhãn/quảng cáo Google thật. Cả hai nền tảng giữ khoảng trống phù hợp; nền/bàn phím/popup nhạy cảm ẩn quảng cáo theo owner.
- Capacitor Android/core8.5.1 đã vá dependency được rà; release WebView không debug/mixed content, allowBackup=false. Không gọi đây là chứng nhận bảo mật tuyệt đối. Audit trước vá trong ADS_SECURITY_ACCOUNT_AUDIT.md chỉ là lịch sử.
- Launcher đã giữ trọn icon; Home có nút thoát góc phải, Back đóng popup/màn trước rồi hỏi thoát ở Home. Khi Home/nền dừng clock/audio/effect/owner liên quan; Android có pháo hoa/confetti thắng với cleanup/reduced-motion.
- Kiểm thử APK ở nguồn chốt: check259module,37unit ads/liveops,29UI bố cục/xóa/reset/Cài đặt/Nhiệm vụ,12UI tài khoản/quảng cáo Firebase cục bộ,1smoke Android đạt;16banner/victory trước đó đạt. Chưa có bằng chứng AdMob/Google login/pin/nhiệt/FPS điện thoại thật.

## Nhiệm vụ, vòng quay và quà test hiện hành

- Nhiệm vụ ngày: thắng3ván/ghép30nhóm/thắng3ván không Gợi ý, thưởng5/5/10Xu. Mục tiêu không Gợi ý mới không thu hồi/cấp lại quà đã nhận theo mốc cũ. Hoàn thành đủ3mục bấm rương nhận10Xu+1vé; tuần đủ4mục bấm rương50Xu+2vé, không cần nhận từng quà trước.
- Hành trình Xu tuần giữ mốc20/50/80 → 5/10/10Xu, tối đa40điểm/ngày; tách khỏi Sưu tập huy hiệu, không cấp ngoại hình ở100điểm.
- Điểm danh bấm trực tiếp ô ngày; ngày chưa tới khóa/mờ, đã nhận dấu kiểm. Ngày1..7 thưởng10/10/15/15/20/25/50Xu; ngày1..6 thêm1hint Link/Memory/Triple/Memory/Triple/Link; ngày7 mở ngay3hỗ trợ, mỗi trò1món chọn đều. Kho đầy giữ toàn bộ candidate để nhận lại, không trừ lượt/bốc lại. Bảy lần thực nhận, bỏ ngày giữ lượt; reset07:00 Việt Nam, tuần thứ Hai.
- Nhiệm vụ/Sự kiện tab chữ nhật bo góc chia đều 2/3cột, đủ tên trên5skin/320px. Tiến độ ở giữa thanh, reset dưới tab; nhận bằng nút sốXu+icon, không thông báo Xu trùng toast. Giữ LOGIN legacy, Spark.version1, receipt loginReward có version/operation/day/index/supports; không cấp bù ngày đã nhận.
- Vòng quay10ô bằng nhau, tỷ lệ thực trong Thể lệ:5Xu40%;10Xu25%;Xu5–50 nguyên đều15%;rương ngẫu nhiên C/Avatar/Khung/Huy hiệu1%;Ngoại hình2%;Lật thẻ2%;Chủ đề1%;Đường nối2%;Xóa thẻ2%;Hỗ trợ10%. Ngoại hình chọn đều món chưa có, đủ bộ/trùng do race đổi100Xu; không tự trang bị.
- Nút tâm ưu tiên1free/ngày → vé1/lượt → quảng cáo tối đa10/ngày. Rương mở ngay sau khi quay, dùng ảnh đóng/mở theo skin. Hỗ trợ chọn đều3trò rồi loại trong trò; kho đầy giữ một pendingWheel qua ngày, không quay mới đến khi nhận. Spark.version1, receipt8ô cũ vẫn đọc, wheel.version2/pending tương thích.
- Kim xanh tương phản giật38°/hồi8° theo vạch, audio wheel-spin theo owner; tối đa202keyframe hữu hạn, không loop. Reduced-motion/hidden/close dừng. Dưới vòng chỉ bốn hàng ảnh chữ; toast thưởng giữa màn hình một hàng.
- **Quà tặng bất ngờ đang ở cấu hình test:** chờ10giây, lần đầu ngay; mỗi lần đúng1trong4nhóm đều25%:10vé /5Xu /10Xu /1hỗ trợ. Hỗ trợ chọn đều3trò rồi loại; đầy đổi10Xu. Online, không tích lượt, chống nhận trùng; tick không gọi Firebase.
- Quà cũ đã lưu1vé/100Xu vẫn nhận theo kết quả cũ, không bốc lại/chuyển số dư. Giữ hourlyGift.version1. Kết thúc test phải chốt lại thời gian/bảng quà với chủ dự án, không tự quay về bảng cũ hoặc60phút.
- Bằng chứng lượt mới: nhiệm vụ/chữ/wheel61unit+37UI,147yêu cầu giả bị rules chặn,check/build đạt; quà test34unit+7UI+emulator/check/build đạt. Không Hosting/APK các lượt này. HOURLY_GIFT_RECEIPT.md giữ nghiệm thu cũ, không lấy bảng quà cũ làm luật mới.

## Chữ, rương và thưởng gameplay

- Bộ chữ mẫu 02 — 08/11: đã thay 17 glyph bằng vàng sáng nét dày bo tròn, viền đồng mảnh; đồng bộ kho/bốn bộ/ghép/bán và nhận chữ trong ba trò. Atlas `letters-v2-128.webp` + `letters-v2-256.webp` tổng304.352byte, tên mới tránh cache immutable; đã bỏ atlas cũ khỏi bundle. Tăng độ rõ chữ chưa có, giữ bố cục/cỡ ô và save/luật/API. Nguồn/prompt/generator tại `design/rewards-letters/drop/` và `scripts/prepare-letter-drop-atlas.mjs`. 7UI mục tiêu + JS/CSS/diff/build đạt; không deploy/APK.

- UI chữ/rương 07/11: bốn bộ dùng cùng cỡ ảnh chữ theo TRIPLE CONNECT, một hàng cạnh rương, không tên quà/nút Đổi quà. Rương khóa khi thiếu chữ; đủ bộ bấm rương đổi chữ một lần rồi mở chọn trò nhận hỗ trợ. Đóng màn chọn giữ rương trong kho; tiếp tục dùng giao dịch đổi/mở hiện hữu, không đổi save/schema/luật thưởng.
- Ảnh rương sự kiện/kho: 12 hình nhận diện riêng × đóng/mở = 24 WebP trong suốt 256×256 (459.428 byte), dùng chung theo loại trên mọi skin; đã thay bản SVG thử. Bốn mẫu dự phòng Băng/Lửa/Rừng/Thiên văn ở `design/chests/reserve`, không vào bundle. Xem `design/chests/README.md`; nguồn/prompt ở `runtime/art-source/chests`. Rương cấp bậc bản đồ giữ bộ ảnh riêng. 56 bài UI liên quan đã đạt qua lượt chính và chạy lại 9 bài sau sửa cuối; JS/CSS/diff/build đạt. Không deploy/APK, chưa đo điện thoại thật.

- Drop trên nhóm thủ công hợp lệ: thường chữ5%/vé2%/huy hiệu6%; đặc biệt/Lucky/Magnet25%/10%/30%, ba nhánh độc lập. Giữ2Xu/nhóm, marker cả trúng/trượt theo attempt/wave/group, không farm undo/reload/phá phụ. Năng lượng80%đặc biệt/20%thường; hỗ trợ thường5%/đặc biệt10%, Memory Special và Link Blue30% thay nhánh chung.
- Sưu tập huy hiệu cá nhân, không mùa/capngày/reset.25huy hiệu=50Xu;50=100Xu+1rươngC;75=1rươngKhung;100=1rươngAvatar. Nhận đủ4mốc bất kỳ thứ tự sang vòng tiếp, giữ dư. ID firefly/festival cũ vẫn dùng cho tương thích; không reset/migration.
- Rương kho chung C/Khung/Avatar/Huy hiệu trong tab thứ5 Bộ sưu tập; trong ván chỉ xem. C40%50Xu/60%hỗtrợ; Khung40%100Xu/40%hỗtrợ/20%khung; Avatar40%150Xu/40%hỗtrợ/20%avatar; Huy hiệu như Khung. Ngoại hình chọn đều món chưa có đúng nhóm, trùng/full100Xu; không tự trang bị. Hỗ trợ vượt9999 đổi10Xu/đơn vị. Không thêm loại rương tồn kho cho quà mở ngay.
- Kho chữ17loại, bốn bộ: MEMORY MATCH→Avatar,LINK CONNECT→Khung,TRIPLE CONNECT→Huy hiệu,ADVENTURE→Avatar. Công thức tiêu đúng số chữ lặp; bán10Xu/chữ, receipt bán1000Xu cũ còn đọc được. Bán dùng slider1..tồn, không persist khi kéo, chỉ giao dịch khi xác nhận.
- Ghép3đơnvị chữ bất kỳ, được lặp nếu đủ tồn; ưu tiên chọn đều chữ count0 **trước tiêu hao**, đủ17loại mới đều17. Nút tâm3D đồng tâm, ba ô cách120°/bán kính84px; kho6cột/3hàng. Entropy/candidate bền qua retry/CAS; legacy ghép cùng chữ giữ kết quả cũ, không migration/reset.
- Ghép trình bày tia SVG tại3ô, hút chữ/hiện kết quả ở tâm+toast; âm thunder→frozenUnlock→coinCollect. Không chữ rơi thêm/không phát receive trùng; owner/mute/hidden/reduced-motion/close cleanup, animation không cấp quà.
- Thưởng luôn commit trước presentation. Coin particle theo số thực nhận,cap32; item/energy/letter chungcap12. Toast nhỏ1hàng, rơi900/dừng900/bay850ms ở đường loot chung; ngoại lệ ghép dùng tâm+toast. Chấm quà từ canonical state đúng UID/kỳ máy chủ, không thêm polling/write theo tick.
- Giá hỗ trợ dùng calculateConsumablePrice trong shopCatalog: round(giá gốc×8×0,9). Memory tăng giờ30/45/60s giá360/504/648; hint58/108/151/216,preview58/108/158/216;Linkhint58/shuffle108/thunder180/freeze30s288;Triplehint58/+30s360/undo108/shuffle108. time10 cũ dùng30s khi còn tồn, không xóa/chuyển số lượng. Popup thua Memory/Link bán30s360/60s648; Triple chưa có mua giờ khi thua.
- Thử thách chọn độ khó nhỏ nhất chứa bàn: Memory75/110/150/220s,Link/Triple60/90/120/180s theo đợt, giữ dư; calculateChallengeWaveTime là nguồn. Không đổi ngân sách phiên cũ đã cấp. Chưa có số liệu cân bằng chơi thật; GAMEPLAY_ECONOMY_AUDIT.md là lịch sử, không tự điều chỉnh kinh tế từ đề xuất cũ.

## Sản phẩm, điều hướng và runtime

- Ba trò Memory Match/Link Connect/Triple Connect dùng Game Shell chung; controller/renderer giữ luật riêng, không import chéo. Home dock Nhiệm vụ/Sự kiện/Hồ sơ/Xếp hạng/Cài đặt; các mục đã hoạt động, không còn “Sắp ra mắt”. Map có Cửa hàng/Bộ sưu tập/Bản đồ/Xếp hạng/Cài đặt.
- Home ở baseline đã kiểm thử dùng scroll-snap native nối vòng với đúng3node, không clone/autoRAF; ảnh portraitv2 tổng323.366byte. Lượt Home mới đang đổi giao diện, chưa dùng làm baseline bàn giao. Gameplay ẩn dock, ba gạch mở Tạm dừng. Modal placement theo board/visualViewport/safearea, nội dung dài cuộn/footer tới được, giữ focus/busy/cleanup.
- Tab chức năng Xu trái/tên giữa/X phải, Cài đặt không ví; Home có ví và nút thoát Android. Map avatar trái/tên giữa/X phải, ví dướiX; shortcut cặp dọc Kho báu/Bộ sưu tập, Nhiệm vụ/Sự kiện, Vô tận/Thử thách, Gift. Mở từ map đóng về đúng map/chặng/vị trí, không tạo lại map.
- Tab chung một hàng, không xuống dòng, nhiều thì cuộn ngang/ẩn scrollbar; tab active đưa vào vùng nhìn thấy, không kéo dọc. Sự kiện/Nhiệm vụ riêng3/2cột chia đều; BXH3trò chia đều. Giữ roving focus/ARIA/preference tab cũ.
- Bản đồ100màn/chặng,4độ khó,10mốc kho báu×4rương; mở tuần tự, completion không suy sao. Preview chọnC/B/A/S, chỉ Chơi launch; Thử thách/Vô tận xemmàn1 trước, hủy giữ phiên, không bỏ Memory reveal/readiness gating.
- Rương hành trình masteryRewards:C30Xu+1hint/B60+2/A100+3/S160+4, đúng trò, nhận1lần/nhóm10màn theoC→B→A→S. Đủ10mảnh nhận300Xu riêng. Không dùng gói Nhỏ/Vừa/Lớn cũ cho đường claim này.
- ESmodules/IndexedDB bất đồng bộ formatVersion2, giữ nguồnv1 phục hồi; backend mới đã dùng không fallback ghi vềv1. Normalize tại boundary, dữ liệu hỏng/versionlạ chặn ghi; transaction/rollback/profileUID/generation bảo vệ snapshot, wallet, inventory và thưởng. Không đổi key/schema/catalog/effectID nếu không được giao.
- Firebase Spark hiện có Guest/Google, backup chunk/hash/CAS, ranking outbox, Analytics production-only; chỉ sync menu. Rankingv3 mỗi trò3family, theo màn thắng; specialreplay từ1/resume giữrun. Client-trustedranking, không chứng nhận chống gian lận. Privateplaytime monotonic/checkpoint30s; hardkill có thể mất phần chưa commit.
- Triple reducer/worker/solver/ghost là nền hiện hữu; config/model sở hữu thẻ/topology/budget. Khay cơ bản7ô, mua3.000Xu/ô tới10, DOM luôn10node, dọc5×2; milestone10mốc×3,target30. Lucky chỉ Challenge15giây, Magnet1/đợt; Challenge8+ dùng ladder5–7. Combo≤8:15giây,9–15:20giây,≥16:30giây; miss/hết giờ reset current, giữ max; time bonus chỉ cuối timed.
- Memory Lucky mọi mode1–3cặp chỉ đợt đầu; Challenge/Endless màn1/đợt1, Continue giữ quà. Lucky thời gian đổi10Xu Memory/50Xu Link ở mode không dùng thời gian; không tự đồng nhất các hỗ trợ khác tác dụng.
- Theme ảnh chọn có trọng số, không lặp trong cùng lần bốc, giữ3board gần nhất/theme; ảnh dùng asset path, generated dùng stable ID, snapshot giữ mapping; seed mới cho round mới. Sửa generator, không sửa generated output; shell:sync sinh tokens, assets:sync sinh manifest/pháp lý.
- Effect V2 đã hoàn tất runtime/lifecycle/cleanup/reduced-motion. Nền động singleton/scene owner với Light/Standard/Static; giữ master meteorEffects, hidden/modal/startup/cancel đều cleanup; Home tĩnh khi không có vùng an toàn. Sao băng pool2node/1scheduler. Mỹ thuật effect là task riêng khi được yêu cầu, không mở lại gate runtime.
- Nhạc không khởi động lại giữa đợt; open_box mở nắp, reward nhận quà, coin_drop/coinCollect theo pha, unlock_1 mở băng. Audio owner/hidden/mute/cancel; không phát lại khi recovery không có committedRewards. Không ghi Firebase theo frame/tick.

## Còn chờ chủ dự án hoặc kiểm chứng ngoài phạm vi đã đóng

- Điện thoại thật: Google login bản Play/APK, banner/video/interstitial/nhận quà, Home/Back/foreground, hao pin/nhiệt, FPS và cảm nhận âm thanh. Kết quả browser/CPU6x không chứng nhận S22/60FPS.
- Hoàn thiện AdMob liên kết cửa hàng/phê duyệt/app-ads.txt/thông điệp EU; trạng thái hạn chế/nháp trong lần Console trước chỉ là lịch sử, cần đọc lại khi được giao kiểm tra.
- Reviewer Google account/quyền truy cập; đối tượng đã chốt gồm dưới13 nhưng biểu mẫu còn phụ thuộc reviewer; Data Safety, phân loại nội dung và điều kiện phát hành công khai chưa hoàn tất. Không đánh dấu truy cập đầy đủ hoặc không thu thập dữ liệu sai.
- Quyền nhân vật Pokémon chưa có tài liệu kiểm chứng; chủ dự án yêu cầu tiếp tục nội bộ và thay/bổ sung sau nếu cần. Không kết luận đã có license hoặc tự sửa art khi chỉ dọn tài liệu.
- Kết thúc thử quà10giây/bốn nhóm cần quyết định sản phẩm mới. Không coi các mục chờ này là kế hoạch active hoặc quyền tự build/upload/deploy.

## Quy tắc làm việc và bằng chứng

- AGENTS quản workflow; README/ADD_GAME quản chạy/tích hợp. Chỉ test/build theo rủi ro, không sau mỗi chỉnh nhỏ; tài liệu thuần chỉ rà diff/liên kết, không chạy check/build. Gom commit theo phase khi được giao; không stage ảnh/log QA/khóa/snapshot hoặc thay đổi người khác.
- Nội dung người chơi dùng ngôn ngữ sản phẩm, không ghi nội bộ/debug/mock/SDK/API; minh họa không emoji/font, trừ chữ/số gameplay cần thiết. Không đưa hạn chế kỹ thuật/bản thử vào giao diện.
- Bằng chứng Android/Play: ANDROID_RELEASE_RECEIPT.md. Bằng chứng gameplay/UI trước: COSMETIC_COMPLETION_GROUP_DROPS_RECEIPT.md,HOURLY_GIFT_RECEIPT.md,EVENTS_MOBILE_FESTIVAL_RECEIPT.md,DROP_ENERGY_SPECIAL_CARDS_RECEIPT.md,MENU_SHOP_PREVIEW_UI_RECEIPT.md,ANIMATED_BACKGROUNDS_IMPLEMENTATION_RECEIPT.md,docs/qa/technical-improvement/RECEIPT.md,docs/design/ui-consistency/RECEIPT.md. Audit lịch sử giữ nguyên vai trò bằng chứng, không là backlog.
- Không xóa APK/AAB,cache,dist,node_modules,assets,khóa hay QA chỉ vì dọn task. Lượt đồng bộ này chỉ thay tài liệu và xóa kế hoạch đã đóng.
- Theo yêu cầu commit: thư mục docs ngừng được Git theo dõi, vẫn giữ đầy đủ trên máy và được ignore. Tài liệu gốc điều hướng (CONTEXT/README/ARCHITECTURE), biên bản Android hợp nhất và việc xóa plan cũ vẫn commit; audit cũ/ảnh giao Play trong ADS_SECURITY_ACCOUNT_AUDIT.md và design/google-play là tài liệu local được ignore.


## Phát hành BXH lên web test — 10/11/2026

- Site memorymatch-test, build87b12ffae370b5bf, VITE_ADVENTURE_RANKING_V4=1 và VITE_FIREBASE_ENV=test. Không thay Hosting production; build riêng trong runtime để không ghi đè dist.
- Backend dùng chung memorymatchv1-1a: chỉ thêm Rules BXH v4 và một index. Ruleset d6bbe9d7-ab3c-4736-81a9-ad2b620f83d3, SHA25611473f0e5cb75c9ab040082a4face7da8ef330bef7cd99ab2bcfbc36b2d2ec9a; indexCICAgOi3kJAK READY, không xóa index cũ. CLI Rules503 đã được xử lý qua retry/API tạo-biên dịch và phát hành, sau đó đọc lại đúng.
- Xác minh12/12board, đúng test-waves1; bảng rỗng là dữ liệu thực, không tạo record giả. Trên bản test khi tắt mạng vẫn ghép được cặp, lưu sessionIndexedDB và dùng gợi ý trừ kho đúng; BXH dùng cache offline; pageErrors0. Không đồng nhất ca này với toàn bộ QA asset/cold-start hoặc máy S22U thật.
- Commit chỉ chứa BXH, gồm các hunk riêng trong gameState/Rules và dòng context của BXH. Luồng thưởng local-first/ngoại hình/UI trước đó của chat khác vẫn giữ ngoài commit. Không đưa runtime/log/ảnh QA vào lịch sử. Nguồn thực thi và bằng chứng ngắn ở LEADERBOARD_REFRESH_PLAN.md.
