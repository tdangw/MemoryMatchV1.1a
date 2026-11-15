# CONTEXT — trạng thái hiện hành 11/11/2026

## Cập nhật hiện trạng 16/11/2026

Kho lưu trữ hiện theo quyết định 5 trang chính + Kho tạm chỉ xem (mục16, bổ sung 16/11 trong IMPLEMENTATION_NOTES.md); phần mô tả 3 trang/64 ô và Kho tạm thao tác được bên dưới là lịch sử trước đó. Khôi phục snapshot/O6 chạy lại trên emulator đạt: offline/online, mất ACK rồi reload, server faults, hai thiết bị; `npm run check` và `npm run build` đều PASS. Âm thanh đạt 29 PASS/2 SKIP. Art manifest 202/202 sẵn sàng và profile UI đã decode 202 ảnh. Gate6/O6/Gate7 vẫn mở vì chưa có reviewer độc lập và chứng nhận hiệu năng trên Android vật lý; không coi toàn task đã nghiệm thu. Chi tiết bằng chứng và giới hạn trong `design/expedition/IMPLEMENTATION_NOTES.md` và phần bổ sung của `design/expedition/COSMETIC_ACCEPTANCE_2026-11-11.md`.

## Phạm vi hiện tại và nguồn sự thật

- 11/11 — Hoàn tất bổ sung Kho từng rương/mua ô (mục16 kế hoạch hiện hành):3trang×24ô,8ô miễn phí,64ô mua riêng1000Xu; phần dư vẫn nhận và dùng được. Mở/Bán đúng1rương, bỏ slider rương, có hiệu ứng mở/rơi quà sau commit; mảnh giữ luồng cũ. Popup mô tả Mở rộng thêm ô lưu trữ, giá riêng, Hủy–Mua96×44px cách10px; toast−1000Xu ôm chữ/bay lên. Trang trí hồ sơ bỏ tick, dùng viền chọn; khóa/Level chung góc phải, không che tên/ảnh.27unit,36UI,1worker offline và build/static đạt; bằng chứng trong IMPLEMENTATION_NOTES.md. Không deploy/Rules/APK/commit; không đóng thay bộ202hình thái.

- 11/11 — Theo yêu cầu thử giftbox: Quà tặng đang dùng90% nhận1rương, chia đều C/Avatar/Khung/Huy hiệu22,5%mỗi loại;10%còn lại giữ tỷ lệ cũ giữa vé/Xu/hỗ trợ. Giữ cooldown thử10giây và giao dịch/receipt cũ; rương vào Kho lưu trữ, không tự mở. Nhãn cấp hồ sơ đổi bạc ởLevel7–20, vàng ởLevelMax21, cùng nguồn cosmeticForm với ảnh.22unit và12UI mục tiêu đạt; chưa deploy/APK.

- 11/11 — Memory Match giảm20% mốc điểm2–3sao trên cả6mode, tính bằng ceil(mốc cũ×80/100). Ví dụ Dễ màn1:2sao156→125,3sao198→159; Vô tận màn1:3sao930→744. Popup Mục tiêu/HUD sao/kết quả cuối màn cùng dùng gameplayRules với gameId memory-match. Luật qua màn và1sao khi thắng giữ nguyên; Link/Triple và thành tích cũ không đổi. Đây là chính sách mới thay các ghi nhận “giữ nguyên mốc sao” trước đó. Đã kiểm tra local; chưa deploy.

- 11/11 — Hoàn tất mục15 Cửa hàng/Bộ sưu tập4cột:94hình dùng chung, launcher mặc định, toast tải giao diện giữa màn hình và bỏ popup Ô may mắn. Check/build, ma trận5skin/3trò/6viewport, mua từng gói, rollback/lifecycle và worker offline đạt; bằng chứng tại design/expedition/IMPLEMENTATION_NOTES.md. Không deploy/APK, không đóng thay bộ202hình thái.

- BXHv4 đã phát hành web test10/11 theo `LEADERBOARD_REFRESH_PLAN.md`: https://memorymatch-test.web.app, build87b12ffae370b5bf, data test-waves1. Rules dùng chung chỉ bổ sungBXH, rulesetd6bbe9d7-ab3c-4736-81a9-ad2b620f83d3 đã đọc lại đúng; indexCICAgOi3kJAK READY. 12board live tải được; ghép thẻ/lưu máy/dùng gợi ý vẫn đạt khi offline, giữ sửa local-first của chat mốc thưởng. Commit riêng phần BXH; không phát hành Hosting production/APK. Chi tiết QA/receipt/rollout trong kế hoạch; không đưa runtime/log/ảnh vào commit.

- Phác thảo riêng: `NEW_GAMES_OUTLINE.md` — Match 3 Connect và Memory Sequence là hai nút menu chính, vào tự do, chưa triển khai; cần phân tích luật/UX/dữ liệu chi tiết sau. Không thay thế kế hoạch ngoại hình đang thực hiện.

- Kế hoạch ngoại hình/offline hiện hành: `COSMETIC_UPGRADE_IMPLEMENTATION_PLAN.md` —101ngoại hình,Level1–21,đổi hình7/21,sauMax→1mảnh đúng loại,bán100Xu/mảnh,ghép3mảnh+20Xu→rươngđều1/3,ghép3chữ+10Xu;nguồn cả mới/đãcó101món. Kho rương đổi nhãnKho lưu trữ (giữ tabID),lưới4×6hoặc6×6phân trang,ôchỉicon,tên/sốlượng trongpopup. Rương popupTỷ lệ/Mở/Bán,mảnh Bán/Ghép;slider mở/bán,mởnhiều tuần tự+popup tổng,chưa mở giữkho. BánAvatar/Khung/Huyhiệu200Xu/rương;giámua dựkiến10000Xu,chưa tự mở rộngshop. RươngC bán58Xu=round(1/2 giátrịquà trungbình115,1333Xu).
- Bổ sung offline/local-first vào chính kế hoạch trên,mục13/gateO0–O6;O0audit đã ghi, runtime chưa đạt. Tận dụngpersistence/ledger/journal/CAS,không tạo ví/save/sync song song. Gameplay/checkpoint/facts phải lưu máy trước,đồng bộ nền;asset chờserver chưa được báođãnhận/tiêu;clockmáy không cấpquà ngày. Đã chốt dùng offline hỗ trợ được máy chủ giữ riêng cho thiết bị, bảo toàn tổng tồn, journal dùng bền trước tác dụng, không cấp lại/trả về kho chung khi chưa xác nhận. TiêuXu/quà mới chưa xác nhận vẫn chờ mạng. Đã chốt rawfacts offline không xác định được ngày tính vào nhiệm vụ của ngày máy chủ xác nhận, chỉ hạn mức kỳ đó; không cấp bù quà ngày cũ/điểm danh, ID ván và kỳ được xác nhận phải lưu bền để retry không tính lại hoặc chuyển kỳ. Phát hiện `commitSparkOperation` giữqueueghi trong I/O mạng, `runRewardOperation` giữreplacement khóa launch, `settlementAdapters` bỏfact khi thiếu trustedclock. Cloudconflict hiện chọn toàn bản chưa đáp ứngmerge hai thiết bị;worker mớicache asset đã tải,DEV không làQAoffline.
- Bàn giao mới nhất: hai agent ở hai chat mới. Agent A tạo/QA ảnh theo `design/expedition/HANDOFF_ART_AGENT.md`; Agent B làm logic+UI+offline theo `design/expedition/HANDOFF_LOGIC_AGENT.md`, cùng một kế hoạch active ở trên. Chat hiện tại chỉ hoàn thiện bàn giao. Bằng chứng kỹ thuật/source đang dở: `design/expedition/IMPLEMENTATION_NOTES.md`. 50 unit đạt, chưa có test chuyên biệt bán rương; emulator nhận ngoại hình đang fail giới hạn1000biểu thức, chưa nghiệm thu/không deploy. Đã lưu12master ứng viên cho6món (6mẫuA0 cũ +6ảnh bộCúSapphire), journal/hash/nguồn ở `design/expedition/art-production/`; còn190thiết kế chưa có ứng viên, cả12ảnh đã có vẫn cần QA. Chưa có606export sản phẩm đạtQA. Sáu prompt thực tế đã lưu ởprompts.json; prompt gốc của6mẫuA0 không có archive nguyên văn, không được bịa thành prompt cũ; hướng dẫn tạo tiếp ởPROMPT_GUIDE.md. Giữ đủ202thiết kế/606export và303file gốc. Không APK/deploy.

- Follow-up `MAP_VISUAL_REFRESH_PLAN.md` đã hoàn tất: sửa ảnh ở mép lặp và giảm chói Link/Triple;7 kiểm tra liên quan đạt, mối nối forest cuối2/2 đạt, build đạt. Giữ nguyên ảnh/hoạt ảnh moonlit cũ cho khả năng tái dùng event; chưa triển khai event. Không còn gate active của lượt hình ảnh này.

- Đã hoàn tất phạm vi hình ảnh trong `MAP_VISUAL_REFRESH_PLAN.md`: nền/trang trí riêng ba bản đồ, hoạt ảnh tối đa5timeline/24node và menu chính giữ tỉ lệ trên PC/ngang. Check/build đạt;10 kiểm tra riêng đạt. Bộ regression cũ còn9 lỗi tiêu đề/hướng dẫn lần đầu đã đối chiếu baseline; chi tiết trong kế hoạch. Không sửa tab chức năng, không đổi save/API, chưa APK/deploy. Không còn gate triển khai hình ảnh active.

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

- Sưu tập huy hiệu 08/11: nguồn đã đổi sang thanh ngang, huy hiệu trái, đếm trong thanh và icon phần thưởng bấm trực tiếp, khóa/mờ khi thiếu; bỏ số vòng/thẻ thưởng/nút cuối/hướng dẫn mẫu. Festival v2 dùng mốc10/25/50/75/100 →50Xu/100Xu/rươngC/Khung/Avatar. Lượt festival v1 đang dở giữ bốn mốc cũ, chỉ chuyển v2 cùng giao dịch nhận nốt lượt đó; tiếp tục lặp100 và giữ dư. Bấm rương nhận vào kho rồi popup Xem tỷ lệ/Mở quà; mở chọn đều ba trò, lưu lựa chọn vào journal trước retry, không hiện chọn trò. Config/model/rules từ template đã đồng bộ cục bộ. 41unit +22UI +1UI dịch vụ thật trên emulator và check/build đạt; bằng chứng `BADGE_REWARDS_REFRESH_PLAN.md` đã đóng, không còn gate active. Chưa deploy rules/web/APK; cần phối hợp client/rules khi phát hành.

- Bộ chữ mẫu 02 — 08/11: đã thay 17 glyph bằng vàng sáng nét dày bo tròn, viền đồng mảnh; đồng bộ kho/bốn bộ/ghép/bán và nhận chữ trong ba trò. Atlas `letters-v2-128.webp` + `letters-v2-256.webp` tổng304.352byte, tên mới tránh cache immutable; đã bỏ atlas cũ khỏi bundle. Tăng độ rõ chữ chưa có, giữ bố cục/cỡ ô và save/luật/API. Nguồn/prompt/generator tại `design/rewards-letters/drop/` và `scripts/prepare-letter-drop-atlas.mjs`. 7UI mục tiêu + JS/CSS/diff/build đạt; không deploy/APK.

- UI chữ/rương 07/11: bốn bộ dùng cùng cỡ ảnh chữ theo TRIPLE CONNECT, một hàng cạnh rương, không tên quà/nút Đổi quà. Rương khóa khi thiếu chữ; đủ bộ bấm rương đổi chữ một lần rồi mở chọn trò nhận hỗ trợ. Đóng màn chọn giữ rương trong kho; tiếp tục dùng giao dịch đổi/mở hiện hữu, không đổi save/schema/luật thưởng.
- Ảnh rương sự kiện/kho: 12 hình nhận diện riêng × đóng/mở = 24 WebP trong suốt 256×256 (459.428 byte), dùng chung theo loại trên mọi skin; đã thay bản SVG thử. Bốn mẫu dự phòng Băng/Lửa/Rừng/Thiên văn ở `design/chests/reserve`, không vào bundle. Xem `design/chests/README.md`; nguồn/prompt ở `runtime/art-source/chests`. Rương cấp bậc bản đồ giữ bộ ảnh riêng. 56 bài UI liên quan đã đạt qua lượt chính và chạy lại 9 bài sau sửa cuối; JS/CSS/diff/build đạt. Không deploy/APK, chưa đo điện thoại thật.

- Drop trên nhóm thủ công hợp lệ: thường chữ5%/vé2%/huy hiệu6%; đặc biệt/Lucky/Magnet25%/10%/30%, ba nhánh độc lập. Giữ2Xu/nhóm, marker cả trúng/trượt theo attempt/wave/group, không farm undo/reload/phá phụ. Năng lượng80%đặc biệt/20%thường; hỗ trợ thường5%/đặc biệt10%, Memory Special và Link Blue30% thay nhánh chung.
- Sưu tập huy hiệu cá nhân, không mùa/capngày/reset. Lượt v1 đang dở:25=50Xu;50=100Xu+1rươngC;75=Khung;100=Avatar, nhận đủ4mốc sang v2. Lượt v2:10=50Xu;25=100Xu;50=rươngC;75=Khung;100=Avatar, nhận đủ5mốc sang lượt mới, giữ dư. ID firefly/festival giữ tương thích, không đặt lại tiến độ.
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


## Cập nhật bố cục B/A trên điện thoại — 08/11/2026

- Memory Match và Link Connect: điện thoại dọc (breakpoint mobile của shell) dùng B 4 cột × 6 hàng, A 4 cột × 9 hàng. Memory B đã có 4 cột; cập nhật Memory A và Link B/A. Giữ nguyên desktop/ngang và các độ khó khác; Triple Connect ngoài phạm vi.
- Link đổi topology qua reflow hiện hành, giữ tile identity/lựa chọn, chờ unlock nếu đang xử lý lượt; adapter theo dõi cả orientation và breakpoint mobile. Giữ baseColumns để tiếp tục checkpoint cũ, không đổi public API hoặc schema save.
- QA chuẩn S22 Ultra dùng viewport giả lập 384×824; có kiểm tra 384×740, 320×740, 412×915, portrait rộng và landscape. Đây không phải đo thiết bị thật. Bằng chứng local: runtime/qa-board-layout-full, runtime/qa-board-layout-saved, runtime/qa-board-layout-acceptance. 45 ca UI đạt (28 layout desktop, 13 mobile, 4 banner/tiếp tục ván); npm run check và npm run build đạt. Không deploy hoặc tạo APK.


## Âm thanh localhost — 08/11/2026

- Báo lỗi Chrome ERR_CACHE_OPERATION_NOT_SUPPORTED cho coin-collect.mp3: file tồn tại, server trước sửa dùng no-cache và hỗ trợ Range. Chưa tái hiện mã lỗi trên browser profile mới; không kết luận file hỏng hoặc service worker là nguyên nhân.
- vite.config.js đặt no-store riêng assets/sounds (mp3/ogg/wav/m4a) cho dev/preview, tránh dùng lại HTTP disk-cache entry âm thanh cục bộ; không đổi production Hosting, service worker, sound runtime hay save. Kiểm tra full 200, range 206/1024 bytes và 60 lượt phát lại đạt ở cả dev và preview. Bằng chứng local runtime/qa-local-audio-after và runtime/qa-local-audio-preview. Máy chủ 4173 không khả dụng từ phiên kiểm tra; người dùng cần khởi động lại máy chủ và tải lại trang để áp dụng.


## Căn mốc sưu tập huy hiệu — 08/11/2026

- Bỏ số xu 50/100 dưới icon; vẫn giữ giá trị quà trong nhãn truy cập. Đổi vị trí icon/mốc từ grid chia đều sang đúng phần trăm points trên cùng trục với thanh tiến trình, có khoảng chừa hai đầu. Không đổi quà, claim, version hoặc dữ liệu lưu.
- QA: căn tâm icon/nhãn lệch dưới 1.1px trên 4 viewport × 5 skin; kiểm tra nhận quà và vùng bấm 320px đạt. node --check presentation, CSS ownership và diff check đạt. Bằng chứng local runtime/qa-badge-alignment-final. Không build/deploy cho chỉnh UI nhỏ này.

- Bổ sung vạch nối và dấu kim cương tại từng mốc huy hiệu, cùng tâm icon/nhãn và đúng tỷ lệ thanh. Mốc chưa đạt mờ, đạt vàng, đã nhận xanh; trạng thái lấy trực tiếp từ reward hiện hành, không thêm animation/listener/save. QA 4 viewport × 5 skin, nhận quà và lượt v1→v2 đạt (3 ca), syntax/CSS ownership/diff đạt; bằng chứng local runtime/qa-badge-markers.


## Thời gian làm mới điểm danh — 08/11/2026

- Chuyển countdown ngày vào góc phải cùng dòng tiêu đề Điểm danh 7 ngày, dùng icon restart SVG và HH:MM (thời gian còn lại, không đổi lịch reset). Tooltip/nhãn truy cập vẫn mô tả đầy đủ Làm mới sau … giờ … phút. Giữ countdown tuần hiện tại và timer/lifecycle/service/save.
- UI kiểm tra 13:57, không chồng tiêu đề và không tràn ở 320/412/844px × 5 skin đạt (3 ca). Syntax, CSS ownership và diff check đạt; ảnh local runtime/qa/events-visual-v2, test runtime/qa-login-countdown. Không build/deploy.


## Kho chữ tối giản — 08/11/2026

- Chỉ sửa styles/liveops.css: bỏ nền/viền/shadow từng ô kho chữ và viền viên số lượng; giữ một viền mảnh cho chữ được chọn và outline bàn phím. Số lượng nằm dưới để không chồng hình chữ. Chữ chưa sở hữu grayscale và opacity .22, số đếm mờ .5. Không đổi artwork, ghép/bán/đổi, API hoặc dữ liệu lưu; không áp dụng sang bộ chữ trong bộ sưu tập/popup.
- Kiểm tra 320/412/1024px × 5 skin: 17 chữ, ô bấm ít nhất 44px cao, không tràn, trạng thái trống/chọn và focus bàn phím đạt. CSS ownership/diff đạt. Bằng chứng local runtime/qa-letter-inventory-tests, runtime/qa-letter-inventory/default-412.png. Không build/deploy.

- Đồng bộ chữ chưa đủ trong bộ sưu tập phía trên và phần xem trước bốn bộ dưới vòng quay về grayscale/opacity .22 như kho chữ. Cả hai dùng chung letterSlots và selector liveops__letter-slot; chữ đủ vẫn opacity 1/filter none. Chỉ chỉnh opacity CSS, rà selector/diff; không chạy lại suite/build/deploy.


## Popup Thành tích riêng trên bản đồ — 08/11/2026

- Nút tắt góc trái bản đồ đổi nhãn Thành tích, mở progression/achievementModal.js trực tiếp thay vì điều hướng sang Bộ sưu tập. Popup chỉ tái sử dụng renderAchievementCollection theo game/nhóm đang xem, không có tab trang bị/chủ đề/Kho rương; không sửa popup Bộ sưu tập/mainmenu hoặc logic ngoại hình của task khác.
- Popup có scope con được bản đồ sở hữu; đóng/reopen/rời bản đồ hủy đúng owner và giữ guard async của renderer hiện có. Dấu báo nút Thành tích chỉ phản ánh quà thành tích của nhóm hiện tại, không bị rương tồn kho kích hoạt (collectionIncludesChests=false riêng map; mặc định nơi khác giữ nguyên).
- Kiểm tra 2 unit mục tiêu và 3 UI đạt: 3 game × 320/412/1024px, nhấn nhanh/mở đóng 9 lượt không tăng tài nguyên, dấu báo quà và Bộ sưu tập từ dock giữ đúng. Syntax/diff đạt; QA local runtime/qa-map-achievements và runtime/qa-map-achievements-collection. Không đổi schema save, không build/deploy/commit ngoài yêu cầu.


## Avatar và tên game đầu bản đồ — 08/11/2026

- Chỉ CSS map: vùng avatar tăng 52→60px, phóng lớp portrait vừa đủ và xử lý riêng avatar không khung để tận dụng khoảng trong suốt; giữ tỷ lệ các lớp avatar/khung/huy hiệu, không sửa component/dữ liệu ngoại hình. Chừa hai bên tiêu đề 60px.
- Tên game tăng lên clamp(19px,5vw,26px): Memory serif vàng ấm, Link uppercase nghiêng xanh ngọc có nét nối, Triple đậm tím sáng với ba nét nhấn. Dùng font hệ thống, không tải asset/font hoặc thêm animation; gameplay header không đổi.
- QA 3 trò × 4 viewport (320/384/412/1024) × 5 skin = 60 tổ hợp đạt: avatar trong header, tên không cắt/chồng nút, không tràn. Đã xem ảnh 3 header tại runtime/qa-map-header; test runtime/qa-map-header-tests. CSS ownership/diff đạt. Không build/deploy.


## Popup chọn màn và trang bị trước khi chơi — 08/11/2026

- Cả 3 trò/6 mode: phần thông số chỉ còn Thời gian/Mục tiêu; bỏ Gợi ý, Xem trước, Khay thẻ và đoạn mô tả đặc biệt dài. Giữ chọn Chủ đề, thêm Mặt lưng thẻ/Hiệu ứng lật cho Memory và Đường nối/Xóa thẻ cho Link/Triple. Các mục dùng giá trị đang trang bị, cập nhật sau đóng bảng chọn và giữ qua khởi động ván.
- showCollectionModal bổ sung selectionTab tùy chọn để mở riêng nhóm đã sở hữu, không mount tab catalog/chest hoặc ghi lựa chọn tab. Tái sử dụng renderer và saveAppearance hiện có; API cũ giữ hành vi, không đổi schema/save/luật sở hữu hay logic ngoại hình mới. Bảng chọn con thuộc previewScope, đóng parent hủy child; khóa mở lặp và phục hồi focus khi đóng.
- QA: 3 ca loadout kiểm tra 18 game/mode × 3 viewport; 1 ca skins/cleanup kiểm tra 30 lần đóng parent khi child mở ở 5 skin; 18 ca hồi quy hiện có đạt (10 launch/guard thường, 6 special, keyboard/owner, collection). Ca special đã thêm thao tác Bỏ qua hướng dẫn lần đầu vào fixture; không bỏ guard sản phẩm. JS264 module/CSS ownership/diff/build web đạt. Không deploy/APK.
- Bằng chứng local: runtime/qa-pre-game-loadout-tests, runtime/qa-pre-game-loadout, runtime/qa-pre-game-skins, runtime/qa-pre-game-special-regression; kết quả launch thường trong runtime/qa-pre-game-launch-regression (các fail special cũ được chạy lại và pass ở thư mục special-regression).

## Tiếp nhận logic/offline 08/11 — bằng chứng mới

Lỗi emulator1000biểu thức ở Level20→Max đã sửa bằng validation delta của spent, giữ invariant và cosmetic copy atomic; generator tách pool legacy98/mới101.51unit đạt; emulator mở/bán rương, phí, overflow, CAS và denial/recovery đạt exit0. Chi tiết trong IMPLEMENTATION_NOTES.md. Chưa nghiệm thu toàn Gate3, UI/offline/ảnh chưa đạt; không deploy/APK. Đang chờ quyết định cơ chế phân bổ hỗ trợ offline (tự giữ1mỗi loại hay người chơi chọn số lượng); không hỏi lại hai policy đã chốt.

## Chốt lại ưu tiên offline — 08/11/2026

Theo chủ dự án: lưu máy trước, đồng bộ nền thông minh không ngăn phiên chơi; cho mở quà/quay offline, chỉ xem quảng cáo thêm vé cần mạng. Bỏ yêu cầu giữ riêng hỗ trợ từng thiết bị và việc mọi quà chưa server xác nhận đều không được tiêu. Giữ journal/ID/entropy/chống retry trùng, bảo vệ dữ liệu và kỳ nhiệm vụ raw facts đã chốt. Chấp nhận trường hợp hiếm hai máy dùng cùng cached hỗ trợ offline. Mục Chính sách offline thay thế cuối COSMETIC_UPGRADE_IMPLEMENTATION_PLAN.md là nguồn ưu tiên hiện hành; câu hỏi phân bổ trước đã hết hiệu lực. Agent tiếp tục toàn phạm vi logic/UI/offline, không chờ lựa chọn phân bổ.


## Thành tích và Kho báu hành trình toàn màn hình — 08/11/2026

- Từ nút tắt và rương trên bản đồ, Thành tích/Kho báu dùng shared adventure-screen như Nhiệm vụ/Sự kiện: header 60px có số Xu, body cuộn, dock/banner và nút đóng về bản đồ. Tích hợp qua renderer tùy chọn của openMenuDestination, giữ default navigation cũ. Helper achievement/treasure nhận surface tùy chọn, mặc định modal cho caller cũ.
- Khung trang sở hữu scope con và tự quay về bản đồ khi nội dung đóng; callback nhập module cũ không mount vào trang đã hủy. Chơi tiếp từ rương đóng trang trước khi mở preview đúng màn; liên kết Xem thành tích mở trang Thành tích cùng nhóm. Không đổi claim/receipt/save/rules hoặc logic ngoại hình của task khác.
- QA18 ca đạt: 4 ca mới kiểm tra 90 tổ hợp 3game×5skin×3viewport×2trang và handoff chính xác nhóm1, 10 lifecycle (30 lượt + đóng/chuyển trò/reload/background/reduced-motion/đổi tài khoản/read retry/save failure), 3 layout/achievement và 1 navigation chung. Fixture lifecycle xác nhận thông báo thành tích qua UI thật bằng locator handler, không tắt logic thông báo. Các control ở landscape được kiểm tra cuộn tới thay vì giả định toàn bộ nội dung cùng nằm trên màn.
- JS264 module, CSS ownership, diff và build web đạt. Ảnh local runtime/qa-adventure-screens; test ở runtime/qa-adventure-screens-tests, runtime/qa-adventure-screens-other-games, runtime/qa-adventure-screen-handoff, runtime/qa-adventure-screen-lifecycle-final, runtime/qa-adventure-screen-layout, runtime/qa-adventure-screen-navigation. Không deploy/APK.

## Ngoại hình và offline — tiến độ 09/11/2026

Task tiếp tục trong COSMETIC_UPGRADE_IMPLEMENTATION_PLAN.md; không tạo kế hoạch thứ hai. Đã triển khai model101 món/Level7–21/mảnh/giá và phí, Kho lưu trữ/popup/slider/mở nhiều, profile/public level v2, generator ảnh ready. Offline dùng cùng IndexedDB writer + Spark outbox/receipt/CAS, lưu và dùng quà trên máy trước; không chia hỗ trợ theo thiết bị. Có raw fact day=null bind bền vững, batch khi queue đầy, và publication fingerprint để mất phản hồi không nhận quà/tính ván lại. Lỗi403 và conflict không khóa chơi hoặc tự ghi đè bản máy.

Bằng chứng và hợp đồng schema mới ghi chung trong design/expedition/IMPLEMENTATION_NOTES.md. Đã có73 unit, matrix UI kho/profile/events/lifecycle,7 ca service Firebase+IndexedDB thật, chơi thắng/qua màn/resume offline và production worker cold-boot đạt. Đang chạy hồi quy rules cũ+mới và check/build cuối; chưa đánh dấu toàn task hoàn tất.

Agent ảnh đã xác nhận10/202 form,30/606 exports ready, hợp đồng evolution/v1 không đổi và phiên tạo ảnh đang tạm dừng. Logic không sửa nguồn ảnh của họ. Còn thiếu ảnh/tích hợp toàn bộ và chứng nhận hiệu suất Android vật lý; không coi ảnh gốc fallback là đủ thiết kế.

Chủ dự án cho phép deploy rules nếu cần cập nhật. Chỉ Firestore rules của memorymatchv1-1a, không Hosting/indexes/APK. Đã đọc và lưu rules đang dùng để đối chiếu; prefix quyền tài khoản/private save/ranking giữ nguyên. Chưa triển khai ở thời điểm ghi mục này; kết quả sẽ bổ sung sau kiểm tra cuối.

### Kết quả chốt phần logic/UI/offline — 09/11/2026

74/74 unit,8/8 nhóm Rules emulator,8/8 ca service Firebase+IndexedDB thật,40/40 UI collection/events/forms/profile,11/11 storage,19/19 shared lifecycle, win/next/resume offline và production worker cold boot offline đều PASS. `npm run check`, `npm run build`, generator checks và diff check cuối PASS. Kết quả chi tiết/giới hạn và đường dẫn log ghi chung ở IMPLEMENTATION_NOTES.md; không cộng các suite chồng phạm vi thành tổng ca duy nhất.

Đã deploy riêng Firestore rules vào memorymatchv1-1a theo quyền mới. Release cloud.firestore ruleset `28a5e576-4e28-4213-b2cb-b972183e4861`, SHA256 `c568d95bb3a781bc948568091e6f09b796e0b8b7cd0f1c26cf7f89335ffeb282`; API đọc lại trùng file đã kiểm. Có backup rules trước và metadata release trong runtime. Lần503 đầu đã được retry thành công, không bỏ validation. Không deploy Hosting/indexes hoặc tạo APK.

Gate0–4/O1–O5 ghi nhận đã đạt phần implementation và kiểm chứng web/emulator. Gate5, phần ảnh/Android thực của Gate6/O6 và Gate7 chung vẫn mở: chỉ10/202 form,30/606 exports ready; agent ảnh đã xác nhận phiên đang tạm dừng. Không tự sinh ảnh hoặc sửa manifest/master/prompt/journal của họ. Mã hiện có sẵn để nhận lô ready tiếp qua generator; không coi fallback ảnh gốc là đủ ảnh hoặc toàn task đã hoàn tất.


## Đồng bộ tên game bản đồ/màn chơi — 09/11/2026

- Tách định dạng tên ba trò từ map-themes.css sang styles/game-wordmark.css dùng chung, nạp qua index.html. Bản đồ và title DOM của Memory/Link/Triple dùng cùng span game-wordmark + data-wordmark-game; không sửa shared runtime, avatar component hay logic ngoại hình đang được agent khác phát triển.
- Kiểu chữ/màu/đậm/nghiêng/kích thước/nét nhấn khớp giữa map và gameplay. Giới hạn tên một dòng trong vùng giữa avatar và nút fullscreen; giữ quy tắc ẩn title trên compact landscape của shell.
- QA3 ca đạt: so sánh computed style map/game ở 3 trò × 5 skin; 60 tổ hợp viewport 320/384/412/1024px không cắt/chồng/tràn sau khi board layout ổn định; xoay ngang rồi quay lại đúng. Syntax, CSS ownership, diff và build web đạt. Ảnh runtime/qa-game-wordmark, test runtime/qa-game-wordmark-tests; không deploy/APK.

## Triple nhiều lớp, xấp thẻ và trang pháp lý — 09/11/2026

- Chốt hình thức: từng lớp có các hàng/vị trí riêng trải xen kẽ trên bàn; chỉ sáng và chọn được khi không còn bất kỳ thẻ phía trên che, kể cả một góc. Bốn xấp kín giữ giấu hình; thêm cạnh trang tĩnh như sách, độ dày giảm theo số thẻ còn lại, chỉ render thẻ trên cùng.
- Nguyên nhân bố cục cũ: compiler dùng cùng tập điểm cho mọi lớp với lệch .06 half-card. Loại phương án lặp điểm rồi xòe từng chồng. Compiler v2 giữ 20 mask, phân bổ riêng mỗi lớp theo layerCounts gốc, chọn điểm có hỗ trợ và bảo toàn phần mặt thẻ dưới; vòng lặp/cache đều giới hạn. ID matrix-v2 dành cho ván mới; toàn bộ 240 matrix ID cũ giữ hình học byte-identical, không đổi format save/API đang dùng hay luật cover graph.
- Renderer/CSS tăng phân biệt độ sâu và vẽ cạnh xấp bằng pseudo-element, không thêm ảnh/RAF/timer. Bài kiểm tra xác nhận thẻ còn bị che không nhận click, mở sáng sau blocker cuối, bốn xấp không lộ identity bên trong và mỏng dần khi lấy thẻ.
- Điều khoản/Quyền riêng tư trong Cài đặt dùng size fullscreen của modal chung: header cố định, body cuộn, safe-area, focus/Escape và ownership hiện có. Trang con được hủy cùng Cài đặt; bỏ khung trang trí hộp nhỏ ở fullscreen để tránh tràn skin Cổ tích. Không sửa nội dung pháp lý.
- Nghiệm thu web: 4 unit đạt (120 pattern/mode có witness, 7 Challenge, 240 bố cục cũ và 240 mới, hàng riêng/diện tích lộ); 5 UI Triple đạt tại 320/384/844px và resume v1/v2; 2 UI pháp lý đạt với 5 skin × 4 viewport × 2 trang, focus và 5 chu kỳ mở/đóng trong game. Board/rules, syntax 270 module, CSS ownership, diff và build web 385 module đạt. Bằng chứng runtime/qa-triple-distributed-tests, runtime/qa-triple-interleaved và runtime/qa-legal-tests. Chưa đo FPS/Android/S22U thật; không deploy/APK/commit và không sửa phần ngoại hình/offline của agent khác.


## Tăng chiều sâu và ổn định kích thước khay Triple — 09/11/2026

- Thẻ bị che chuyển grayscale hoàn toàn, opacity theo độ sâu 0.40/0.24/0.15/0.10/0.07; thẻ thao tác được giữ sáng và đủ màu. Không sửa cover graph, luật chọn, bố cục hay save.
- Xác nhận lỗi thật ở 384px trước sửa: bản sao một thẻ lấy lúc còn animation chỉ rộng25.317px so với thẻ ổn định30.71875px. Bản sao còn kế thừa min-width/min-height44px và thẻ thứ ba bay theo bounds cả ô khay. Chọn giữ một snapshot kích thước thật từ thẻ thay vì ép lại kích thước cả bàn/khay: ghost min0, border-box, gỡ trạng thái tạm/viền xấp/hint và đo đích từ thẻ preview thật. Bỏ scale0.72→1.10 của arrival, chỉ giữ fade; effect ID/timeline xóa dùng như cũ. Dùng chung createGhost cho flight và removal; không thêm timer/listener/resource mới.
- Cập nhật contract đáp xuống thẻ thật thay vì cả ô. 36 UI đạt ở desktop/mobile/landscape, gồm kích thước CSS và offsetWidth/offsetHeight tại320/384/412/1024px, khay không đổi bounds, thao tác nhanh, reduced-motion, hủy khi unmount và20 chu kỳ mount. 5 ca lớp thẻ/save/xấp vẫn đạt trong36ca. Syntax, CSS ownership, diff và build web385module đạt. Chứng cứ runtime/qa-triple-tray-before (fail trước sửa), runtime/qa-triple-depth-tray (36pass); ảnh runtime/qa-triple-interleaved/easy-384.png đã xem. Chưa đo trên S22U thật; không deploy/APK/commit, không sửa engine hiệu ứng chung hoặc phần ngoại hình/offline.

09/11: Chủ dự án giao khắc phục local-first và deploy. Theo mục “Khắc phục local-first và phát hành” trong COSMETIC_UPGRADE_IMPLEMENTATION_PLAN.md, dùng snapshot backup thay replay thưởng bắt buộc. Task đang triển khai; chưa nghiệm thu/deploy.

10/11/2026: Khắc phục local-first L1–L4 đã hoàn tất và deploy Hosting production từ `runtime/local-first-release`, tách khỏi BXH v4 đang phát triển. Reward status/nhận/dùng quà commit trên máy; syncPolicy snapshot-v1 sao lưu cùng root CAS, không replay bắt buộc, lịch sử512không khóa quà. Pending cũ giữ nguyên; proof quảng cáo earned áp dụng một lần và lỗi recovery không che kho. Calendar rawfacts giữ policy đã chốt.22unit, các UI/network/queue/3game/quảng cáo, account backup với Auth+Firestore+IndexedDB thật, production offline worker, fullcheck và build đạt. HTTPS index/sw/hai bundle khớp SHA256 release; https://memorymatchv1-1a.web.app. Không deploy Rules/indexes/APK và không đưa BXH v4 vào artifact. Báo cáo chung: design/expedition/IMPLEMENTATION_NOTES.md mục Khắc phục bắt buộc-online.


## Phát hành BXH lên web test — 10/11/2026

- Site memorymatch-test, build87b12ffae370b5bf, VITE_ADVENTURE_RANKING_V4=1 và VITE_FIREBASE_ENV=test. Không thay Hosting production; build riêng trong runtime để không ghi đè dist.
- Backend dùng chung memorymatchv1-1a: chỉ thêm Rules BXH v4 và một index. Ruleset d6bbe9d7-ab3c-4736-81a9-ad2b620f83d3, SHA25611473f0e5cb75c9ab040082a4face7da8ef330bef7cd99ab2bcfbc36b2d2ec9a; indexCICAgOi3kJAK READY, không xóa index cũ. CLI Rules503 đã được xử lý qua retry/API tạo-biên dịch và phát hành, sau đó đọc lại đúng.
- Xác minh12/12board, đúng test-waves1; bảng rỗng là dữ liệu thực, không tạo record giả. Trên bản test khi tắt mạng vẫn ghép được cặp, lưu sessionIndexedDB và dùng gợi ý trừ kho đúng; BXH dùng cache offline; pageErrors0. Không đồng nhất ca này với toàn bộ QA asset/cold-start hoặc máy S22U thật.
- Commit chỉ chứa BXH, gồm các hunk riêng trong gameState/Rules và dòng context của BXH. Luồng thưởng local-first/ngoại hình/UI trước đó của chat khác vẫn giữ ngoài commit. Không đưa runtime/log/ảnh QA vào lịch sử. Nguồn thực thi và bằng chứng ngắn ở LEADERBOARD_REFRESH_PLAN.md.

10/11/2026: Kế hoạch BXH đã hoàn tất phát hành theo yêu cầu trực tiếp. Backend ruleset d6bbe9d7-ab3c-4736-81a9-ad2b620f83d3 khớp source,3index READY trước rollout nên không ghi đè backend. Hosting production từ runtime/leaderboard-release đã bật VITE_ADVENTURE_RANKING_V4=1; cờ lưu trong .env.production.35UI+4UI Firebase thật+4UI production, Rules mới/cũ/snapshot backup, fullcheck và387module build đạt. Query production12boardv4+6boardv3 thành công, không ghi thành tích giả và đã xóa auth kiểm tra. Index/sw/hai bundle public khớp SHA256;12filter hiện đúng trên trang public. Giữ nguyên bản local-first/mốc thưởng. Bằng chứng/rollback ở LEADERBOARD_REFRESH_PLAN.md mục phát hành cuối. Không APK/commit.

10/11: Chủ dự án xác nhận đang thử localhost4173. Đã bật VITE_ADVENTURE_RANKING_V4=1 trong .env.local ngoài cờ production trước đó. Vite đã đọc lại; browser local xác nhận4độ khó cho3trò. Không deploy lại hoặc xóa save.

10/11: Theo chỉnh UI mới, bộ chọn family BXH nằm trái, C/B/A/S thu gọn36×44px nằm phải trên cùng hàng; bỏ nhánh xếp dọc ≤360px. Matrix30skin/viewport (5skin ×320/384/390/412/844/1024) và CSS ownership/diff đạt. Chỉ sửa styles/leaderboard.css và assertion bố cục; không logic/build/deploy/APK.

## Gom commit và loại dữ liệu cục bộ — 10/11/2026

Theo yêu cầu chủ dự án, phần còn lại được gom theo chức năng: `25f04ab` cho giao diện/bản đồ/popup/bố cục Triple; `a290feb` cho ngoại hình/kho/phần thưởng và lưu máy trước đồng bộ. Giữ các module phụ thuộc chung của ngoại hình và offline trong một nhóm để không tách mất hợp đồng dữ liệu. Nhóm tài liệu lưu context, kết quả phát hành BXH và nguồn bàn giao đang dùng.

Không xóa ảnh hoặc nguồn đang làm của chat khác. Bổ sung ignore cho bản vẽ thử, ảnh QA, ứng viên chưa duyệt, kết quả chạy lô và script checkpoint tạm trong design/expedition; chúng vẫn ở máy. Chỉ đưa 10 master đã duyệt, manifest/generator và 30 WebP sản phẩm vào nhóm nguồn ảnh. Chưa hoàn tất 202 form; không đánh dấu task ảnh/Android hoàn thành. Runtime/log/ảnh QA, thông tin môi trường và build output vẫn ngoài commit.

Kiểm tra lượt gom commit: `npm run check` PASS; `npm run build` PASS (17,32s); cosmetic forms 10/202, public cosmetic rules và Spark rules generator checks PASS; staged diff check PASS. Đã bỏ một dòng trắng thừa ở cuối template cosmetic rồi sinh lại Rules, không đổi logic Rules. Không deploy, không push Git, không tạo APK trong lượt này.

## Đồng bộ icon rương — 10/11/2026

- Vòng quay dùng createChestArt cho cả ảnh đóng/mở, chung URL và ảnh SVG dự phòng với Kho lưu trữ. Giữ class/đích animation cũ; đổi skin chỉ cập nhật dấu skin, không tạo lại node hoặc gán lại URL đã lỗi.
- chestArtFallback.js là nguồn vector duy nhất cho fallback ảnh và icon chest/chest-open trong icons.js, có hai trạng thái đóng/mở. Khi ảnh lỗi, icon rương không còn trở thành biểu tượng thông tin. Callback lỗi của icon cũ không sửa subtree sau lần đổi skin mới.
- Chỉ đổi cách tái sử dụng icon; không sửa asset ảnh gốc, CSS, animation timeline, logic quay/quà, API hiện hữu hoặc save/rules. Đã rà diff/call sites/owner và diff check. Theo yêu cầu27/10 về icon thuần giao diện: không chạy test, build hoặc deploy trong lượt này.


## Kho 4x6, quà rương và phát hành web — 10/11/2026

Theo yêu cầu đã chốt: Kho cố định 4 cột × 6 hàng, 24 ô kể cả khi trống; mỗi loại một ô, số lượng gộp. Bỏ dòng trạng thái thành công “Kho lưu trữ” bị lặp và hai nút tải lại/xem hồ sơ; vẫn giữ trạng thái tải/lỗi và cập nhật tự động. Phần thưởng Xu trong Sưu tập huy hiệu dùng ảnh rương Xu.

Giftbox: 20% nhận đúng 1 rương, chia đều C/Khung/Avatar/Huy hiệu (mỗi loại 5%); 4 nhóm quà cũ mỗi nhóm 20%. Chọn một lần khi chuẩn bị giao dịch, cộng earned qua earnChest trong cùng lần lưu local; replay cùng operation không cộng lại. Giữ key/version save và đọc quà cũ; bổ sung kind chest trong reward hiện hữu, không đổi Rules hoặc yêu cầu online. Khởi tạo festival cùng chests để giữ invariant của bản lưu cũ chưa có Kho. Dùng chung ảnh rương; chỉ một particle và giữ nguyên cleanup/reduced-motion của giftbox.

Nghiệm thu: 39 unit (hourly gift/local rewards/Spark/festival) PASS; 12 UI Kho PASS; 8 UI giftbox PASS, gồm nhận rương, hủy/chuyển trang/reduced-motion; npm run check PASS và build PASS trong runtime/storage-gift-release. Lần check đầu chạm p95 Triple 21.24ms/20ms khi chạy chung QA; chạy lại đầy đủ PASS. Test UI được sửa để đợi cleanup hoàn tất và bật motion cho ca yêu cầu particle, không nới invariant. Rà diff/ownership PASS. Bản phát hành lấy HEAD + các source thuộc task; không đưa các chỉnh icon/fallback của chat khác còn đang sửa vào.

Đã deploy hosting production rồi test; cả https://memorymatchv1-1a.web.app và https://memorymatch-test.web.app khớp index/sw/assets của build (index SHA256 78c3bd15f7a71086453820f636602cf054f923396a399a24589107e9fe54da0d). Browser public 384px xác nhận 24 ô/4 cột, status rỗng, không nút thừa, bộ lọc BXH cùng hàng, 4 độ khó và pageErrors 0. Bằng chứng chung runtime/qa/storage-gift-*; không APK/commit.

Rương thử hồ sơ local: chưa cộng vào Chrome của chủ dự án vì công cụ không xác định được URL phiên trình duyệt. Có trang chỉ chạy trên localhost tại runtime/qa/receive-chests.html: người dùng bấm nhận 2 rương mỗi loại, lưu backup trước, dùng writer hiện hữu, kiểm tra owner và earned, có marker chống cấp lặp. Đã thử hồ sơ trình duyệt tách biệt: đủ 8 rương và bấm lại không cộng thêm. Trang này nằm ngoài public/dist và không deploy. Không đánh dấu đã cấp rương cho hồ sơ thật. Các gợi ý huy hiệu chỉ đề xuất, chưa triển khai; task tạo ảnh nâng cấp vẫn riêng.

10/11 — Tooltip tỷ lệ rương (local): thay nút chữ dưới ảnh bằng icon thông tin SVG 44×44px ở bên phải tiêu đề. Tooltip nằm trong header, hiện khi hover/focus bàn phím/click/tap, đóng khi rời chuột, blur, bấm ngoài hoặc Escape; Escape khi đang xem tooltip không đóng popup rương. Dùng lifecycle riêng của popup để dọn listener/node, không sửa tooltip toàn ứng dụng hoặc logic/xác suất/save. Không thêm timer/animation. JS static 273 module, CSS ownership và diff check PASS; 13 UI Kho PASS, gồm 5 viewport 320/384/412/844/1024, hover/click/bàn phím, cảm ứng và 8 chu kỳ mở/đóng, mở/bán/ghép cùng các ca hủy/offline/reduced-motion. Đã xem ảnh 384px; bằng chứng runtime/qa/storage-tooltip.log và cosmetic-upgrade/storage-info-384.png. Chỉ cập nhật local theo lượt chỉnh giao diện; không build/deploy/APK/commit. Các chỉnh sửa có sẵn của task khác được giữ nguyên.

## Tab Cửa hàng/Bộ sưu tập và tooltip — 10/11/2026

Theo yêu cầu giao diện: bỏ tab Thành tích khỏi Bộ sưu tập ở cả3trò, giữ lối mở từ biểu tượng Thành tích trên bản đồ. Bỏ hai dòng tên trò và “Làm chủ từng màn” trong nội dung Thành tích dùng chung. Cửa hàng/Bộ sưu tập dùng cùng owner shop.css, dải tab liền kiểu Sự kiện (viền ngoài14px, gap2px, nút44px), giữ cuộn ngang và bàn phím. Chọn giữ mountCatalogTabs thay vì chuyển sang createTabs của Sự kiện để bảo toàn lựa chọn đã lưu và điều hướng Kho. ID/schema/save không đổi; pictures cũ fallback sang mục đầu mà không ghi đè preference.

Tooltip của các mục trong hai màn căn theo tâm vùng nội dung, giới hạn rộng240px và bề rộng vùng chứa, chỉ chọn trên/dưới; thẻ gameplay giữ thuật toán tránh HUD cũ. Không tạo owner/listener/timer mới. Giữ nguyên phần icon rương đang sửa và mọi source/manifest/prompt/journal của chat ảnh.

Bằng chứng:20ca UI liên quan đã đạt qua các lượt kiểm tra mục tiêu:4catalog preferences,7collection/chest/lifecycle (30lần đổi tab),4presentation mới (90 tổ hợp320/412/1024px ×5skin ×3trò ×2màn và180tooltip, preference pictures cũ và biểu tượng Thành tích),3nhận thưởng Thành tích,1mission/collection scroll,1reward audio. Syntax3module, CSS ownership và diff check PASS. Ảnh default/storybook đã xem tại runtime/qa/catalog-tabs. Kết quả ở runtime/qa/catalog-tabs-results (các ca cũ đạt), catalog-tabs-final (mission/audio đạt), catalog-tabs-verified (412/1024 và nhận thưởng đạt), catalog-tabs-320 (320 đạt). Các lần đầu của kịch bản mới đã sửa: Cửa hàng không trả modal handle; màn Thành tích đóng bằng dock; kiểm tra tràn đo vùng nội dung thay vì họa tiết lá Storybook nhô15px có sẵn; đợi cuộn và aria-describedby trước đo tooltip. Không nới kiểm tra nội dung hay sửa họa tiết ngoài phạm vi. Không build/deploy/APK trong lượt chỉnh UI này.

## Thu gọn nút mua, xác nhận/thoát và tiến trình xóa — 10/11/2026

Theo yêu cầu UI: giảm đệm dọc nút mua (44px vùng chạm,6px đệm nút nổi và4px nút trang bị), bỏ margin đáy thừa; popup mua và thoát ứng dụng dùng chung app-modal--confirmation với hai nút44px, rộng bằng nhau/tối đa140px, cùng hàng. Nút Hủy tái dùng kiểu nút nổi phụ, hành động chính tái dùng ui-raised-action; không sửa nút Chơi của level preview. Loại quy tắc48px riêng của shop-confirm và cho cặp xác nhận dùng owner chung thay vì kiểu56px của compositor Storybook. Popup thoát ứng dụng và tạm dừng ba trò dùng alignment center hiện hữu; banner vẫn được chừa chỗ khi đang chơi. Hủy thay nhãn Ở lại ở popup thoát; kiểm tra lưu trước thoát giữ nguyên.

Xóa tài khoản/xóa dữ liệu: thay chữ Bước1/3 và icon lớn bằng thanh3đoạn Kiểm tra/Xác nhận/Thực hiện, aria-current=step; trạng thái lấy trực tiếp từ phase hiện hữu. Viết lại cảnh báo/hướng dẫn cho người chơi; giữ phân biệt xóa tài khoản với chơi lại, giới hạn không thể khôi phục, mạng/xác minh, cảnh báo yêu cầu trước dở dang, câu hỏi xác nhận và10giây hủy. Không tạo luồng xóa, timer, listener, animation hay schema mới.

Nghiệm thu:18ca UI liên quan PASS qua các lượt mục tiêu:8erasure(lưu ý30chu kỳ hủy/destroy, background pause/resume, lỗi/retry, đổi tài khoản),1matrix stepper30tổ hợp3width×5skin×2loại,3matrix mua/thoát15tổ hợp3width×5skin,1Android Back/thoát,4mua toàn catalog trước/trong game và1menu tạm dừng3trò×2hướng màn hình. Bằng chứng runtime/qa/confirmation-results (8erasure đạt), confirmation-final (9ca đạt; ca mới pause dùng selector menu cũ đã sửa sang helper hiện hành), confirmation-pause và confirmation-pause-clean. Kịch bản inventory cũ đếm cứng12món nay đối chiếu đúng catalog hiện hành11món và vẫn mua/kiểm tra từng món, số Xu, tồn kho và reload. Các lượt matrix đầu phát hiện lớp48px riêng và compositor Storybook56px ghi đè; đã xử lý owner, không nới kích thước để pass. Syntax4module, CSS ownership và diff check PASS. Đã xem ảnh mua/thoát mặc định và Storybook, xóa tài khoản mặc định/Storybook và tạm dừng ngang. Không build/deploy/APK; không sửa dữ liệu người chơi, logic mua/xóa/thoát hay nguồn ảnh của chat khác.

Rà ảnh cuối phát hiện thông báo vào màn (z30500) có thể hiện sau khi mở tạm dừng và che menu (z30000), kể cả khi test đã kiểm tra chưa có thông báo trước đó. Đã hạ đúng owner styles/progression.css xuống29900 để thông báo gameplay nằm dưới modal; không ẩn bằng trạng thái mới hoặc đổi timer. Ca pause thêm assertion thứ tự lớp và chạy lại PASS ở3trò×2viewport; ảnh ngang đã xem lại sạch tại runtime/qa/confirmation/pause-triple-connect-844.png. Bằng chứng cuối runtime/qa/confirmation-pause-layer; CSS ownership/diff check PASS sau thay đổi này.

10/11 — Thu gọn Trang trí hồ sơ theo yêu cầu: bỏ nút Xem hình thái và handler/popup/CSS chỉ phục vụ nút đó; bỏ câu hướng dẫn chọn/trang bị và ghi chú nguồn trò/Màn dưới từng vật phẩm. Giữ tên, Level, ảnh hình thái theo cấp đang có, khóa/đang trang bị và luồng lưu. Căn lại huy hiệu khóa/check sau khi bỏ dòng nhỏ. Không sửa model/manifest/ảnh hoặc save.4UI cosmetic-forms PASS tại320/412/1024, gồm3lớp portrait, Level7/Max, fallback khi ảnh lỗi và lưu trang bị; đã xem ảnh runtime/qa/profile-compact-inventory.png. Syntax/CSS ownership/diff check PASS; kết quả runtime/qa/profile-compact-results. Không build/deploy/APK.

10/11 — Popup chọn màn (local): chủ dự án chốt hiển thị “Điểm đạt 3 sao”, giữ nguyên luật ghép hết thẻ để qua màn. adventurePreview thêm threeStarScore tính bằng getProgressionStarTargets trên toàn bộ số nhóm × số đợt, đúng cùng công thức HUD cho cả ba trò và sáu chế độ; giữ target cũ cho tương thích và không đổi save/luật. adventureMap hiển thị nhãn rõ với icon sao, số điểm theo định dạng Việt Nam. Ô thời gian Vô tận dùng modifier riêng, icon/khoảng cách và font thu gọn, “Không giới hạn” luôn một dòng, không cắt chữ. Không thay bố cục chung hoặc font toàn game.

Nghiệm thu: check-adventure-preview PASS (144 tổ hợp 3 trò × 6 mode × 8 mốc màn, kiểm tra số cố định 198/297/930/1240 và không sửa profile); JS static 276 module, CSS ownership, diff check PASS. 8 UI trọng yếu PASS (3 trò/6 mode/320,384,844,1024; 5 skin ở 320 và 844, đổi độ khó đổi điểm, bàn phím và lifecycle lặp). Matrix phát hiện chữ tràn ở skin Sách truyện 320 và đã sửa khoảng cách ô thời gian; chạy lại đủ matrix PASS. Cập nhật fixture và kỳ vọng UI cũ về tiêu đề, mục tiêu và tên nút Trang bị có tên vật phẩm; không làm yếu các kiểm tra ownership. Bằng chứng runtime/qa/preview-score-final.log và preview-score/endless-320.png. Chỉ local, không build/deploy/APK/commit; không sửa các task đang làm ở module khác.

10/11 — Bỏ lớp trang trí tĩnh trên bản đồ (local): theo yêu cầu ưu tiên đơn giản, adventureMap không tạo thêm sprite cành cỏ/giỏ quà/pha lê trên nền của cả ba trò. Nguyên nhân là tọa độ sprite không bám theo tiểu cảnh trong ảnh nền; chọn bỏ lớp này thay vì thêm thuật toán canh vị trí. Xóa selector/biến --map-decor không còn dùng trong adventure.css và map-themes.css; giữ ảnh nền, đường đi, tọa độ nút màn/rương và API layout cũ. Hiệu ứng nền nhẹ hiện có vẫn dùng owner/lifecycle/budget/reduced-motion cũ, không thêm animation, timer hoặc asset. Không sửa schema/save hay phần thưởng.

Kiểm tra: node --check adventureMap, CSS ownership, check-adventure-map-layout và diff check PASS. 4 UI PASS: ba bản đồ ở 320/412/1024 qua nhiều chu kỳ mở/đóng, 0 decoration/0 request SVG decor, vẫn 100 nút màn + 10 rương + 1 đường đi; ambient một scene, <=24 node/<=5 handle, cleanup khi đóng và reduced-motion tắt host; ca cuộn/popup/tắt hiệu ứng PASS. Test chuyển động cũ được bật no-preference rõ ràng vì cấu hình QA mặc định reduce; giữ nguyên các assert ngân sách. Đã xem ảnh thực tế cả ba bản đồ. Bằng chứng runtime/qa/map-scenery.log và map-scenery/*.png. Chỉ local, không build/deploy/APK/commit; giữ thay đổi có sẵn của các task khác.

10/11 — Chỉnh câu chữ popup chọn màn: theo yêu cầu trực tiếp, nhãn người chơi thấy dùng “Mục tiêu”, thay “Điểm đạt 3 sao”. Giữ nguyên số điểm, công thức mốc sao và luật chơi. Đồng bộ kỳ vọng câu chữ trong test; chỉ rà diff, không chạy lại test/build/deploy cho thay đổi nhãn thuần túy. Ghi nhận ưu tiên câu chữ sản phẩm ngắn, tự nhiên; không diễn giải cách triển khai vào giao diện.

10/11 — Nhiệm vụ ngày/tuần và tan băng Link (local): sửa nguyên nhân đánh dấu nhận nhầm ở missionsPresentation: trước đây icon bonus dùng check cả khi mới eligible. Nay claimed/bonus là nguồn xác nhận duy nhất cho received; locked có khóa/disabled, available không khóa và không check, received disabled/mờ/check. Nhận lỗi vẫn available, không tự đánh dấu hoặc cấp thêm quà; giữ nguyên luật trả thưởng và save. Đổi nhãn khối thưởng thành “Thưởng nhiệm vụ”. Đồng bộ bố cục ngày/tuần: icon 36px, cột quà 64px, thanh tiến trình 16px, nút >=44px, cùng nền xanh/viền/bo tròn; không thêm thưởng riêng cho nhiệm vụ tuần. Giữ trạng thái hoàn thành nhiệm vụ tuần tách khỏi nhận rương tổng.

Theo yêu cầu bổ sung: bỏ riêng toast tự mở toàn bộ cặp băng trong recoverBlockedLinkBoard, giữ xử lý mở/xáo và các thông báo khác. LINK_CONNECT_TIMING.frozenPairUnlockMs 800→600ms; cùng timeline/owner/cleanup/reduced-motion, không thay luật băng, khóa thời gian hoặc save.

Nghiệm thu: 9 unit mission/model/presentation PASS; 8 UI liên quan PASS gồm nhận đúng số Xu, khóa/đủ/nhận, nhận lỗi/reopen/chống trùng, đóng giữa animation, tan băng 0.6s qua 10 chu kỳ và reduced-motion. Sau chỉnh kiểu nút cuối, 2 UI trạng thái + matrix 5 skin ×320/412/1024×2 tab chạy lại PASS. JS parse của owner, Link board contract, CSS ownership và diff check PASS. Đã xem ảnh ngày/tuần 412px; bằng chứng runtime/qa/mission-ice.log, mission-polish.log và mission-daily/weekly-412.png. Chỉ local, không build/deploy/APK/commit. Giữ các thay đổi đang làm của task khác.

10/11 — Đồng hồ Nhiệm vụ và Hành trình tuần (local): nguyên nhân đồng hồ trống là createTabs dựng lại countdown span khi đổi tab nhưng tick chỉ chạy từ renderMissions ngoài hoặc interval 60s. Nay mỗi lần dựng panel gọi updateMissionCountdown ngay bằng getNow dùng chung mốc serverNow + performance.now của owner; giữ một interval, không thêm timeout/flag và không phụ thuộc mạng. Cả ngày/tuần dùng header có đồng hồ compact bên phải, chừa đủ 6 ký tự cho số giờ tuần, aria-label đầy đủ. Thay khối mô tả Hành trình tuần bằng thanh 3 mốc rương Xu 20/50/80 với 5/10/10 Xu, khóa/check theo state.event.claimed thật, không thêm thao tác nhận giả. Thưởng vẫn tự trao theo luật hiện hữu. Đưa catalog mốc vào missionRewards để renderer và Spark dùng chung; không đổi giá trị, API/save/schema hoặc Rules.

Nghiệm thu: 24 unit mission/presentation/Spark PASS, gồm tự trao đủ 25 Xu và không trao trùng; 5 UI PASS gồm 12 lần đổi tab đồng hồ có số ngay, fast-forward kiểm tra tiếp tục giảm, mốc 20/49/50/79/80/100 đúng trạng thái, regression rương trước/sau nhận, matrix 5 skin×320/412/844/1024×2 tab không tràn/đè chữ. Parse owner/CSS ownership/diff check PASS. Đã xem ảnh ngày/tuần thực tế tại runtime/qa/mission-timer-daily.png và mission-timer-weekly.png; log mission-timer.log, mission-timer-unit.log. Cập nhật kỳ vọng timer cũ cho đúng vị trí trong header. Không build/deploy/APK/commit; giữ thay đổi task khác.

10/11 — Thu gọn tích lũy và thêm thưởng riêng nhiệm vụ tuần (local): bỏ tiêu đề “Hành trình tuần” và số Xu dưới từng rương, giữ ảnh/mốc/thanh tiến trình cùng nhãn hỗ trợ đọc màn hình. Chủ dự án đã chốt thêm thưởng riêng 20/20/10/10 Xu theo 4 nhiệm vụ tuần và giữ rương chung 50 Xu +2 vé quay. WEEKLY catalog là nguồn số tiền; lệnh weekly có id nhận từng mục, không id vẫn là rương chung (tương thích hành vi cũ). Dùng cùng helper claimMission cho ngày/tuần và claimed ID có sẵn để không có nguồn xác nhận thứ hai, không đổi save schema/key/version. Từng mục đã nhận không nhận lại, chưa đủ không nhận; rương chung độc lập, không tự nhận khi lấy thưởng mục cuối. Khi chuyển tuần, nhiệm vụ đủ điều kiện chưa nhận được bảo toàn qua lần chuyển kỳ hiện hữu, không cộng lại mục đã nhận; bản lưu cũ đã nhận bonus vẫn có thể nhận các thưởng riêng mới chưa từng được trả. Không thêm giao dịch Firebase; dùng writer local và snapshot backup hiện hữu.

Đã giải thích điểm danh cho chủ dự án: phải bấm ô quà ngày đang sáng trong Hôm nay (mỗi kỳ ngày một lần); chỉ mở game không tăng weekly.visits. Ngày1–7 là thứ tự vòng quà, không phải thứ trong tuần; bỏ lỡ vẫn giữ thứ tự. Nhiệm vụ điểm danh tuần cần nhận quà trong 3 ngày của cùng tuần, không yêu cầu liên tiếp. Chưa đổi luật điểm danh.

Nghiệm thu: 37 unit mission/Spark/local-rewards PASS, có thưởng đúng từng mục, nhận lại/khôi phục bản lưu, bonus độc lập, rollover đủ/thiếu/chỉ một số mục đã nhận và IndexedDB thực giả lập lưu đủ 60 Xu +50 Xu/2 vé không trùng. 6 UI PASS gồm nút Xu tuần đúng tiền, bấm đôi không gửi thêm, nhận rồi disabled/Đã nhận, bonus vẫn riêng, trạng thái nhận lỗi, mốc tích lũy/đồng hồ và matrix 5 skin×320/412/844/1024; CSS ownership, parse/diff check PASS. Đã xem ảnh tuần cuối. Bằng chứng runtime/qa/weekly-task-unit.log, weekly-task-ui.log và mission-timer-weekly.png. Cập nhật kỳ vọng rollover cũ để tính thêm 60 Xu đã được duyệt. Không build/deploy/APK/commit; không sửa Rules hoặc bỏ các chỉnh sửa khác.

11/11 — Icon thông tin rương Nhiệm vụ (local): theo yêu cầu không thêm bước nhận quà, thêm icon SVG info 14px (vùng bấm 24px) ở góc khung rương ngày/tuần và các mốc tích lũy. Button info là sibling của nút nhận, luôn dùng được cả khi rương khóa/đã nhận; không lồng button, không thay kích thước cột/khung. Nội dung tooltip đúng quà cố định (10 Xu +1 vé /50 Xu +2 vé /5,10,10 Xu); không bịa tỷ lệ cho phần thưởng cố định. Bấm rương vẫn nhận trực tiếp.

Chọn tái sử dụng singleton tooltip hiện có thay vì tạo popup hoặc listener/timer riêng cho từng icon. data-tooltip-info chỉ thêm nhánh click/tap hiển thị thông tin, bỏ long-press cho riêng loại icon này; hover/focus dùng cơ chế cũ. Không thay nhánh các tooltip khác đang được sửa bởi chat khác. Owner Nhiệm vụ clear tooltip khi đổi tab, render lại và dispose để không còn thông tin mồ côi. Không đổi quà/save/API mạng.

Nghiệm thu: 6 UI PASS gồm chuột/cảm ứng/bàn phím, info ở đủ 3 trạng thái rương, toàn bộ mốc, không tăng calls/không sửa state, không đổi kích thước khung, nhận trực tiếp vẫn đúng, đổi tab/đóng và nhiều chu kỳ không sót tooltip; regression kiểu nút/đồng hồ/matrix skin/viewport PASS. JS parse, CSS ownership và diff check PASS. Đã xem ảnh 320px runtime/qa/mission-chest-info-320.png; log mission-info.log. Chỉ local, không build/deploy/APK/commit.

## 11/11 — Kết nối Firestore, tỷ lệ vòng quay và thông tin mọi rương

Theo yêu cầu ưu tiên trải nghiệm: chỉ thay getFirestore bằng initializeFirestore với experimentalForceLongPolling:true trên bản dùng Firebase thật; emulator giữ mặc định. Dùng tùy chọn SDK công khai để đóng phản hồi WebChannel sau khi nhận dữ liệu, tránh giữ stream dài. Không thêm retry loop, tầng bảo mật, App Check, Functions, nâng billing, đổi Rules hoặc ép gameplay phụ thuộc mạng. Nguồn Firebase: https://firebase.google.com/docs/reference/js/firestore.firestoresettings#firestoresettingsexperimentalforcelongpolling . Đây là khắc phục tương thích đường truyền ở phía ứng dụng; không tắt QUIC của Chrome và chưa tái hiện lỗi QUIC_TOO_MANY_RTOS trên đúng mạng chủ dự án. Không khẳng định lỗi đường mạng đã hết trên mọi máy.

Vòng quay đã đổi 5 Xu30%,10 Xu25%,rương Xu20%,rương hỗ trợ15%; sáu loại còn lại giữ1/2/2/1/2/2%, tổng100%. Giữ WHEEL_VERSION3 và catalog/giải thưởng, không đổi ID. wheelOddsVersion2 được ghi trong command mới; entropy cũ không có marker dùng bảng cũ, candidate đã chốt không tính lại. Lượt quảng cáo mới ghi marker lúc chuẩn bị, lượt cũ đã earned vẫn giữ bảng cũ và nhận lại không cấp thêm. Chỉ thêm metadata tương thích trong command của nhật ký hiện có, không đổi formatVersion hoặc key save.

Mở rộng cùng icon thông tin tới rương Nhiệm vụ/tích lũy, quà điểm danh ngày7, tám rương trên vòng quay, Sưu tập chữ/huy hiệu, Kho, kho báu bản đồ/sidebar, bốn rương chọn và hero kho báu, rương trong Thành tích/thông báo. Hình rương đang bay/mở ngắn trong hoạt ảnh không gắn nút tương tác. rewardInfo.js/reward-info.css là một owner chung; chestInfo.js lấy nội dung từ catalog hiện hữu. Button info luôn là sibling, không lồng trong button nhận/disabled, không làm thay đổi thao tác mở/nhận. Nội dung là quà cố định hoặc tỷ lệ đúng theo từng nguồn, không có popup phụ. Các owner dọn tooltip khi đổi tab/render/đóng; không có listener/timer riêng cho mỗi rương. Giữ nguyên công việc khác đang sửa trên mainmenu/storybook/tooltips và các file dùng chung.

Nghiệm thu cuối:43 unit wheel/cosmetic/local rewards/mission/mastery PASS; tổng21 UI trọng yếu PASS (13 rương/Kho/Nhiệm vụ,3 thành tích+kho báu hẹp/ngang,1 thao tác chạm vòng quay,1 SDK Firestore thật khởi tạo/cache/dispose3 lần không viết production,3 trò offline lưu checkpoint). Đã sửa overflow do icon nằm ngoài ô và cập nhật selector QA theo wrapper sibling; không nới invariant kích thước nút chính hoặc mốc thưởng. CSS ownership/JS parse/diff PASS; npm run build PASS14.96s. Đã xem ảnh vòng quay412px có tooltip, Kho và các bề mặt liên quan. Bằng chứng chung runtime/qa/firestore-chest-final-unit.log, chest-info-all.log, chest-extra.log, chest-final.log, firestore-wheel-build.log, wheel-chest-info-412.png. Không fake account/record production, không deploy/Rules/APK/commit. Thay đổi hiện ở local; lỗi QUIC trên mạng thực vẫn cần quan sát lại sau tải lại phiên local mới.

## 11/11 — Thông tin tọa độ bàn cờ trong Cài đặt

Thêm icon SVG thông tin cạnh nhãn Tọa độ bàn cờ, hover/click/tap hiện đúng “Tính năng chỉ khả dụng trong Memory Match.” Dùng factory và tooltip dùng chung thay vì popup/listener riêng; button là sibling của label, không kích hoạt công tắc. Settings dọn tooltip khi destroy. Không đổi luật chơi, API, key/schema save hoặc mở rộng tọa độ sang trò khác. Link Connect có lưới nhưng gravity/dồn/tách/đổi chỗ/xoay khiến vị trí thẻ đổi sau ghép: có thể cân nhắc tùy chọn phụ, lợi ích thấp hơn Memory. Triple dùng hình học nhiều lớp/cover graph nên tọa độ hàng-cột không phù hợp để diễn tả thẻ chồng nhau.

Nghiệm thu: 4 Playwright PASS (320/412/1024px, mỗi viewport mở/đóng 3 lần, hover/click không đổi switch và không dư tooltip/icon; thêm touch320px). Đã xem ảnh runtime/qa/settings-coordinate-info.png. Hai lần chạy trong môi trường hạn chế không kết nối được server local; chạy ngoài giới hạn đã pass13.1s. JS parse và diff check theo phạm vi; chỉ local, không build/deploy/APK/commit.

## 11/11 — Trang trí hồ sơ áp dụng ngay

Ô Khung viền chỉ dùng ảnh khung riêng, không ghép avatar bên trong; hero phía trên vẫn ghép avatar/khung/huy hiệu. Bỏ nút Lưu thay đổi cho cả ba tab: mỗi lần chọn/bỏ chọn đi qua onSave hiện có và modal.submit, chỉ cập nhật lựa chọn/hero khi local save thành công. Chọn lưu theo từng click thay vì dồn lúc đóng vì người chơi đã yêu cầu áp dụng ngay; dùng submit sẵn có thay vì thêm hàng đợi/cờ bận riêng. Submit chống trùng, khóa đóng trong transaction; thất bại giữ lựa chọn đã lưu và cho thử lại; scope guard ngăn callback cũ sửa modal mới sau destroy. Không đổi API, schema/key save hoặc cơ chế đồng bộ.

Nghiệm thu 7 Playwright PASS17.1s: chọn/bỏ cả ba loại, kiểm tra dữ liệu sau mỗi loại và sau reload, khung riêng/hero ba lớp tại320/412/1024, fallback ảnh, lưu chậm/false/thành công/destroy khi chờ, scroll. JS parse/diff check PASS; đã xem runtime/qa/profile-compact-inventory.png. Chỉ local, không build/deploy/APK/commit. Các test hồ sơ có sẵn trong thư mục tests bị ignore được cập nhật tại chỗ, không force-add.

## 11/11 — Giảm điểm mục tiêu Memory Match 20%

Nguồn sự thật là getProgressionStarTargets/calculateProgressionStars trong gameplayRules.js, thêm tham số gameId tùy chọn tương thích ngược. Chọn tỷ lệ riêng theo game trong nguồn luật chung thay vì nhân0.8 ở từng màn hình, tránh popup/HUD/kết quả lệch nhau hoặc giảm nhầm Link/Triple. Giảm ngưỡng2/3sao của Memory còn80%, làm tròn lên số nguyên; không giảm điểm kiếm được, thời gian hoặc thay luật ghép hết thẻ qua màn/1sao khi thắng. Truyền gameId từ preview, logic Memory, HUD và script mô phỏng; HUD không còn lấy công thức legacy khi chưa có wave. Không tính lại hay xóa sao/điểm đã lưu, không đổi key/schema/rulesVersion. API cũ không truyền gameId giữ hành vi trước.

Nghiệm thu:7 unit wave-progress PASS, gồm biên dưới/đúng mốc2/3sao trên6mode×7cỡ nhóm và giữ nguyên Link/Triple; check-adventure-preview PASS144tổ hợp, check-game-core PASS;2 UI PASS xác nhận popup/HUD và ghép cặp thật nhận3sao ở mốc159/744. Lần UI đầu thiếu thời gian chờ xem trước Vô tận8giây; sửa deadline chờ trạng thái, không sửa timing sản phẩm, chạy lại cả2PASS23.1s. JS parse/diff check PASS. Không build/deploy/APK/commit; dữ liệu và công việc có sẵn được giữ nguyên.

## 11/11 — Thu gọn lựa chọn giao diện

Tên Mặc định/Nâng cao/Giấy cắt/Vũ trụ/Cổ tích nằm trong nhãn xem trước, bỏ tên và mô tả bên dưới. Mỗi mẫu cố định màu chữ/font của chính nó, không kế thừa font từ skin đang chọn: bốn mẫu dùng Segoe UI hiện hành, Cổ tích dùng Storybook Nunito900. Giữ focus/aria-pressed và dấu chọn CSS; vùng mẫu54px, không đổi ID giao diện, cách tải/lưu hoặc schema. Đồng bộ tên ngắn trong UI_SKIN_CHOICES để thông báo tải lỗi không dùng tên cũ. 3 UI PASS16.8s tại320/412/1024px×5skin, chữ một dòng nằm trong nhãn, không overflow, chọn và lưu vẫn đúng; CSS ownership/diff check PASS. Đã xem runtime/qa/settings-skin-labels-412.png. Chỉ local, không build/deploy/APK/commit.

## 11/11 — Tương phản quà điểm danh trên5giao diện

Nguyên nhân: Gợi ý dùng dialog-gold nhạt trên nền thẻ sáng, disabled/received làm mờ toàn subtree; các CSS skin còn thay SVG vector bằng background riêng. Sửa trong owner missionsPresentation/liveops.css: Gợi ý và dấu khóa/check dùng vector với màu lo-task-ink, scope override background/visibility của skin riêng trong ô điểm danh; Xu/rương vẫn dùng hình của từng skin. Bỏ opacity/grayscale toàn ô, phân biệt received bằng nền pha xanh/dấu check; locked nền trầm hơn+viền nét đứt/khóa; available giữ nhấn viền. Không thêm node/listener/timer hoặc đổi logic/phần thưởng/save/API. So với thêm nền riêng sau từng icon, chọn màu đậm cho nét SVG vì không tăng bố cục/nhiễu thị giác. QA phát hiện Cổ tích320px tràn hai icon và nhãn/dấu trạng thái chen nhau: chỉnh gap/icon responsive, tên ngày một dòng có khoảng dành cho dấu trạng thái.

Nghiệm thu:3 UI PASS15.9s phủ5skin×3viewport320/412/1024, ba trạng thái locked/available/received, đổi tab/rerender, giữ ô khóa không gửi nhận quà. Tương phản chữ và nét SVG nhỏ nhất6.60:1 (default7.21,woodland6.79,papercut6.94,starship6.60,storybook8.73), đo trên nền ô thực và hai đầu gradient; đây không phải số đo pixel của ảnh Xu/rương, các ảnh đó được xem trực tiếp ở đủ5skin. Test nhận đầy đủ7ngày và hỗ trợ ngày7 PASS8.8s. JS parse/CSS ownership/diff PASS. Ảnh runtime/qa/checkin-contrast-{skin}-412.png và storybook-320.png đã xem. Không build/deploy/APK/commit; chỉ local.

## 11/11 — Giảm khung màn thắng và số quà điểm danh

Theo yêu cầu: bỏ border/background riêng ở các giá trị strong bên phải của màn thắng (Xu, thời gian, điểm), giữ hàng thông số và căn cột hiện có. Điểm danh bỏ toàn bộ số bên dưới hình Xu/hỗ trợ, giữ hình và trạng thái; aria-label vẫn chứa đúng quà/số lượng cho trình đọc màn hình. Xóa CSS số nhỏ không còn dùng. Không sửa phần thưởng, luật nhận, API/schema hoặc hiệu ứng.

Phần xem số Xu chỉ phân tích, chưa triển khai: đề xuất hover icon Xu trên desktop/chạm giữ trên điện thoại để hiện tooltip ngắn “10 Xu”, không thêm nhãn/nút hay popup. Chạm ngắn ô vẫn nhận trực tiếp; nếu triển khai sau phải chặn nhận sau chạm giữ và hỗ trợ xem cả ô disabled, không đặt button trong button. Đây chưa phải yêu cầu triển khai đã chốt.

Nghiệm thu6 UI PASS26.1s: điểm danh5skin×320/412/1024 với tương phản/số dưới icon bằng0/giữ aria và khóa; màn thắng5skin×320/412/844ngang xác nhận3giá trị đúng và nền/viền trong suốt, không tràn, đóng qua Bản đồ. JS parse/CSS ownership/diff PASS. Đã xem runtime/qa/summary-values-simple.png và checkin-contrast-default-412.png. Chỉ local, không build/deploy/APK/commit.

## 11/11 — Vị trí icon thông tin rương vòng quay

Chỉ chỉnh CSS scope liveops__sector: icon thông tin của8rương chuyển ra góc trên phải ngoài hình rương (top:-8px,right:-22px; giữ nút24px và hình14px, phần hình icon nằm ngoài cạnh phải rương). Cùng quay theo ô thưởng, không đổi hình/kích thước rương, tooltip, tỷ lệ hay thao tác vòng quay và không ảnh hưởng thông tin rương nơi khác. Theo quy định27/10 cho chỉnh icon thuần giao diện: chỉ rà diff, không test/build/deploy/APK/commit. Chưa xác minh trực quan bằng browser ở lượt này.

## 11/11 — Căn icon vòng quay theo cạnh rương

Thay vị trí top:-8/right:-22 vừa chỉnh bằng left:100%,top:50%,right:auto,translateY(-50%) trong scope sector. Host có cùng kích thước hình rương100% nên cạnh trái nút info neo vào cạnh phải khung rương và tâm nút căn giữa chiều cao; không dịch theo góc trên nữa. Giữ nút24px/icon14px, không đo DOM bằng JS hoặc thêm listener. CSS tiếp tục xoay cùng ô thưởng. Ghi nhận này thay vị trí ở mục trước. Theo quy định chỉnh icon: chỉ rà diff, không test/build/deploy/APK/commit; chưa xem lại browser ở lượt này.

## 11/11 — Nội dung ghép/bán chữ, toast nhận chữ và hiệu ứng phí

Ghép dùng mô tả “Chọn 3 chữ để đổi lấy 1 chữ ngẫu nhiên.”; phí10Xu nằm ngay dưới nút tròn, bỏ trạng thái Đã chọn x/3 (vẫn giữ lỗi/thiếu tiền/kết quả cần thiết). Bán có cùng sprite chữ80px như menu chữ, mô tả “Chọn số chữ X muốn bán.”; nút Bán {tổng} Xu thay Xác nhận bán và cập nhật theo slider, không lặp giá trong mô tả. Tương thích luật nguyên liệu/ưu tiên chữ thiếu/phí đang có, không đổi xác suất, schema hay giao dịch.

Bổ sung toast gameplay “Đã nhận chữ N” dùng width:max-content, nowrap và căn giữa theo hình chữ, không thay timing/cleanup. Bổ sung hiệu ứng phí ngay tại dòng dưới nút Ghép khi receipt xác nhận coins<0: Phí10Xu chuyển thành −10Xu, hiện lên8px+opacity trong480ms bằng animation có scope; không thêm particle/node/timer, không đợi hoạt ảnh để cập nhật tiền. Reduced-motion dùng chữ tĩnh. Receipt.sequence chặn trình diễn phí trùng; giao dịch lỗi giữ Phí10Xu, recovery chỉ hiển thị phí khi xác nhận đã trừ, đóng/đổi owner hủy animation. Dòng −10Xu giữ lại cùng kết quả, chọn công thức mới trở về Phí10Xu. Không trừ tiền trực tiếp từ presentation.

Nghiệm thu9 UI khác nhau PASS:4ma trận ghép320/412/844/1024×5skin×2motion (mô tả/phí/căn dưới/không tràn), ghép3nguyên liệu và ghép tiếp, bán250chữ/slider/giá/không bán hai lần/hủy, toast1dòng4viewport×2motion,2debit tests dùng mutateLetters paid policy thật (lỗi không trừ, hồi phục, thành công100→90, đóng cleanup). 10unit ingredients/missing-first PASS, JS parse/CSS ownership/diff PASS. Lần đầu2test cũ fail do aria-label Ghép·10Xu và fixture0Xu chưa cập nhật, thêm vốn thử và selector đúng; QA cũng bắt sprite bán height100% bị ghi đè, đã tăng specificity đúng owner và chạy lại đạt. Đã xem runtime/qa/letter-sale-updated.png, letter-toast-line.png, letter-fusion-fee-debit.png. Không build/deploy/APK/commit; chỉ local.

## 11/11 — QUIC_TOO_MANY_RTOS vẫn xuất hiện gián đoạn

Chủ dự án báo Listen/Write có ERR_QUIC_PROTOCOL_ERROR.QUIC_TOO_MANY_RTOS dù đã bật long-polling. Đã đọc lại firebaseBackend/cloudStore/accountService: cấu hình experimentalForceLongPolling:true vẫn có; long-polling thay cách WebChannel giữ phản hồi, không ép HTTP/2 hoặc tắt QUIC của browser. Không suy ra chắc chắn máy chủ đã ghi thành công chỉ từ200OK vì body/channel vẫn có thể gián đoạn. Không đổi Rules/Auth/billing, dùng cờ private, thêm retry loop, che Console hoặc chuyển toàn bộ transport chỉ dựa vào log. Chưa tái hiện trên mạng/tab thật của chủ dự án nên chưa khẳng định đã xử lý dứt điểm; đã hỏi lỗi chỉ ở Console hay làm kẹt đồng bộ/BXH/game để quyết định theo ảnh hưởng thực tế.

Xác nhận4UI PASS10.5s: SDK thật khởi tạo/cache/dispose3lần forceLongPolling=true auto=false (không gửi production); Memory/Link/Triple vẫn khởi động và lưu board khi network offline cùng pending reward cũ. Test chạy trên fixture độc lập, không xác minh cấu hình của tab chủ dự án đang mở và không tái hiện chính lỗi QUIC mạng thật. Tài liệu đối chiếu Firebase FirestoreSettings experimentalForceLongPolling và Chromium QUIC protocol error. Lượt này chỉ chẩn đoán/ghi nhận, không sửa code sản phẩm/deploy/build/APK/commit.


## 11/11 — Bàn giao ngoại hình đầy đủ, bản test và APK

Theo yêu cầu mới: gom toàn bộ thay đổi hiện có để commit/push và cập nhật Hosting test; tạo APK đã ký, chủ dự án tự kiểm Android thật. Đã xuất/tích hợp202 hình thái mới/606WebP, giữ303ảnh gốc, manifest complete.269unit/check/build,49targetedUI+5art/formsUI+3production-offlineUI+1emulatorgameplay đạt; ba suite emulator backend đạt. Expanded regression90/98 đạt; forge stale label sửa và retry đạt,7audio chưa nghiệm thu; UI sao lưu tài khoản emulator timeout chưa xác minh dù backend snapshot/CAS đạt. Không đóng Gate6/O6/Gate7 toàn phần, không deploy production/rules. Báo cáo chung: design/expedition/COSMETIC_ACCEPTANCE_2026-11-11.md. Sau bàn giao bản test/APK tạm dừng theo yêu cầu, giữ rõ tồn đọng để tiếp tục sau.
