# Nghiệm thu mở rộng quà, Nhiệm vụ và Sự kiện

## Popup Hồ sơ gọn, UID sao chép và tùy chọn bỏ trang bị —26/10/2026

Theo ảnh mẫu mới, tên dùng flex wrapping không cắt chữ, bútSVG14px/nút28px bỏ viền nền, UID nằm dưới tên, trạng thái tài khoản dưới UID. Chủ dự án chốt **UID Firebase hiện có**, hiển thị6ký tự đầu…4cuối cho gọn nhưng copy đủ giá trị state.uid; không tạo mã6số hoặc thêm field/schema. UID thiếu thì ẩn dòng/copy, không bịa UID từ profilelocal.

Clipboard chụp UID tại click, async giữ nút bận, không toast/cập nhật view đã dispose; UID đổi thì không báo thành công cho tài khoản mới. Fallback textarea chỉ khi Clipboard API không có, focus/select tại vị trí cố định, gỡ trong finally và trả focus nút; lỗi permission có toast tự nhiên, không làm kẹt copy. Không log UID đầy đủ. Dùng iconcopy vector trong thư viện hiện có.

Ẩn thanh cuộn ở app-modal/dialog/rewardpopup và descendants bằng scrollbar-width:none + WebKit pseudo; giữ overflow và mọi cơ chế cuộn. Không ẩn scrollbar của bản đồ/toàn trang ngoài popup. Model sở hữu/null đã có nên chọn lại món đang chọn đặt slot null, lưu giữ qua reload/publicprojection và vẫn chọn lại được; không xóa item/receipt hoặc ép về món starter. Grid tiếp tục chặn đồ chưa sở hữu, focus trả lại item sau render, hướng dẫn thao tác ngắn dùng ngôn ngữ sản phẩm.

Bằng chứng: **9/9UI PASS** profile-preferences-ui-final.log, gồm4viewport/5skin đúng popup và trang, tên dài/bút, UID rút gọn/copy đủ,30mount-close unsubscribe, draft/failure/UIDswitch; bỏ cả3slot rồisave/reload/publicnull và trang bị lại; cuộnwheel/nested vẫn chạy. **1/1fallback/error case PASS** profile-uid-fallback-ui.log; native system clipboard/WebView chưa kiểm, testinject Clipboard API để đối chiếu payload. Đã nhìn ảnh profile-modal-320/412.png và profile-inline-320/412.png. Storybook có trang trí vượt khung popup có chủ đích, nên kiểm viewport thực/không cuộn ngang trang và text không cắt thay so scrollWidth của khung có decorations. Không tăng ngưỡng overflow hoặc sửa art để test pass.

Review độc lập không P1/P2. Một lần apply bị hệ thống duyệt báo hết hạn mức trước khi thực thi; sau user Tiếp tục đã xác nhận file chưa đổi và sửa bình thường, không bypass review. npm run check PASS ở lần chạy lại (profile-preferences-check-retry.log); lần đầu benchmark Triple p95 227,62ms vượt200ms, giữ nguyên ngưỡng và log. Không build/deploy lượt Hồ sơ theo chỉ dẫn26/10; khôngAPK/rules/data migration.

## Tinh chỉnh avatar có tương tác và popup Màn —26/10/2026

Theo hình/phản hồi tiếp theo: avatar giảm tối đa viền/đệm ngoài, button52px (trước44), compositeportrait scale1.1 giữ nguyên tọa độ/crop avatar–khung–badge, không cắt riêng ảnh để tránh lệch khung. Hai bên title dành56px để tên không đè avatar/nút fullscreen. Button có tên Mở hồ sơ, focus-visible và mở popup Hồ sơ thật, không phải trang trí tĩnh.

Dùng account handler/modal hiện có qua openPlayerProfile, owner guard sau async. Header chặn doubleopen/startup chưa ready. Mỗi adapter pauseForProfile dùng pause state/scheduler riêng hiện có, giữ trạng thái trước mở; khi modal.whenClosed resolve (đóng/hủy), chỉ resume scope còn active. Đồng hồ business/countdown và active playtime đều được kiểm, không chỉ dừng thống kê. Component chỉ thêm listener scope-owned, không viết save hay cloud.

Popup đầu đợt đổi toàn bộ text sang **Màn level-index**, ví dụMàn1-1/Màn2-1. Giữ popup và metadata số đợt. Enter260ms scale.86→1; hold theo mốc1.800ms; exit500ms scale1→1.12→tối đa1.5/fade0, không di chuyển ngang/dọc hoặc tạo particle/loop. Review phát hiện nguy cơ nở ra ngoài mép trên khi popup clamped8px; đã dùng transform-origin center top và clampzoom theo khoảng trống ngang/dọc thực. Reduced-motion không scale; owner cleanup/cancel vẫn idempotent.

Bỏ riêng badge1/10 trên nút Bộ sưu tập từng trò, không bỏ nút hoặc tiến độ trong nội dung Bộ sưu tập/rương. Đã xóa DOM/aria count và CSS chỉ dùng cho badge; generated styles không sửa tay.

Bằng chứng UI:3/3 player-header-profile-ui.log (4viewport×5skin×3trò,20cycles mỗi trò, mở/đóng Hồ sơ tại map/game, fastForward3giây countdown không đổi, runFor1,2giây sau đóng countdown chạy tiếp);12/12 player-header-notice-ui-final.log (popup, reduced-motion, motion change/resize,30lần cancellation, reveal layers);6wave regression trong lần chạy rộng đạt. Các fail đầu về so sánh innerText/textContent hoặc đọc preview timer5s thay countdown business đã sửa fixture, không nới assertion. Fixture announceWave thủ công bổ sung level/gameId đầy đủ cho nhãn mới. Syntax/CSS/diff đạt; npm run check exit0 (player-header-polish-check.log), npm run build exit0 (player-header-polish-build.log). Review độc lập đã kiểm pause/async owner và clampzoom, không còn P1/P2 xác nhận. Điều chỉnh này thay lựa chọn avatar chỉ để hiển thị ở lượt trước. Hosting test deploy thành công (player-header-polish-deploy.log), đọc lại đúng main-Du3aOr0A.js. Smoke trên URL thật với guest mới PASS: bấm avatar mở Hồ sơ, đóng về map, không tooltip sót, badge Bộ sưu tập không còn; player-header-polish-live-smoke.json/log và ảnh player-header-polish-live.png. Kiểm web đã phát hiện tooltip Đóng còn giữ anchor cũ, đã clearTooltip khi profile.whenClosed và xóa reference modal; target UI Memory matrix chạy lại1/1PASS (player-header-tooltip-ui.log), syntax/diff/build cuối đạt. KhôngAPK/rules/data change.

## Thanh tên có avatar và HUD Màn-Đợt —26/10/2026

Đã bỏ badge Đợt1/2 bên cạnh tên game. HUD giữ nhãn MÀN, giá trị dạng1-1/1-2/9-2 qua formatter chung, không đổi level/wave/session. Popup đầu đợt vẫn giữ. Guide neo thanh tên để tránh che bàn khi chuyển xuống HUD. Không bỏ hướng dẫn hoặc thay luật chơi.

Avatar/khung/huy hiệu đang trang bị hiển thị44px bên trái thanh tên của cả ba trò và bản đồ, đối xứng với nút fullscreen/thoát bên phải. Bản landscape compact tiếp tục ẩn thanh tên/avatar theo bố cục cũ. Avatar dùng cùng portrait/crop/catalog hiện có, không tạo ảnh hoặc tự trang bị. Không thêm nút bấm mở hồ sơ.

Chọn component chung mountPlayerHeaderPortrait thay lặp DOM/subscription theo từng game. Mỗi scope có1subscriber và1host, chỉ dựng lại khi3ID trang bị đổi; unmount dọn cả hai. Helper cosmeticPortrait tách sang profilePortrait.js, reexport từ profileCosmetics.js để giữ API cũ và tránh kéo luồng chỉnh hồ sơ vào shared shell. Không ghi save/network hoặc rebuild board khi HUD cập nhật. Wave metadata/aria chỉ ghi khi khác để tránh mutation lặp mỗi tick.

Kiểm tra trực quan: runtime/qa/player-header/{memory-match,link-connect,triple-connect}-{map,game}.png, ảnh hiện đúng quà hoàng gia đã trang bị. Ba case mới bao phủ4viewport320/412/844/1024×5skin×3trò,20chu kỳ map/game mỗi trò; owner cũ diagnostics về0, không portrait nhân đôi, không tràn sau layout ổn định. Sáu wave regression ba trò đạt, gồm nhãn1-2 và reload/continue. **9case trong phạm vi đạt** tại player-header-ui-final.log; targeted4case trước đó cũng đạt player-header-targeted.log. Reviewer độc lập không P1/P2 trong implementation.

Lần chạy mở rộng cùng suite Triple progression cũ có13case FAIL trước launch (gọi controller ngay sau goto khi app chưa sẵn sàng, run/session null), không được tính đạt. Các case này dùng fixture cũ; không sửa runtime để né launch guard hoặc đưa việc sửa suite legacy ngoài phạm vi UI vào task. Các kỳ vọng text level trong suite đã cập nhật đúng dạng mới; giữ fail và bằng chứng ở player-header-ui-final.log. Regression waves hiện hành có chờ startup và chơi đủ nhiều đợt đạt cả ba trò.

Hai fail bố cục lượt đầu là fixture đo trước ResizeObserver/layout hoàn tất; đã chờ font và hai animation frame theo test geometry hiện có, không tăng ngưỡng overflow. Một fail guide che click sau đổi anchorHUD đã xử lý về thanh tên, rồi chơi đủ2đợtTriple đạt. Check tổng thể exit0 (player-header-check.log), build exit0 (player-header-build.log). Hosting test đã cập nhật (player-header-deploy.log); đọc lại web đúng bundle main-Cyh60Pko.js có shared portrait, player-header-live-verified.json PASS. Không rules/data/API/save change, khôngAPK.

## Vé quay rơi như vật phẩm, chữ2,5giây —26/10/2026

Yêu cầu cuối đã chốt: vé chỉ rơi/thu như năng lượng và hỗ trợ, **không hiện lên giữa màn hình**; chỉ chữ hiện giữa. Chữ tăng tổng2.500ms, reduced-motion vẫn tĩnh1.100ms. Tỷ lệ vé giữ5%/nhóm ghép đặc biệt hợp lệ, độc lập chữ/thưởng khác; không đổi cấu hình rơi hoặc kho.

Nguyên nhân: model/persistence đã cộng ticketEarned và callback mang ticket:true, nhưng presentation chỉ xử lý letter. Đã thêm nhánh ticket ở callback sau durable commit, dùng playLootDrop hiện có (preset linkItem, tier gold), thay thêm animation/pool riêng. Vé bật/rơi620ms, giữ450ms, tự thu/fade theo runtime vật phẩm; targetEvents nếu hiện, ẩn thì thu tại chỗ. Guard đúng active scope cũ, source point đã capture trước khi thay board. Cap chung item12, cleanup idempotent, reduced-motion theo runtime vật phẩm. Không central ticket entry/toast, không thêm mạng/save/schema/rules.

Hình mới: **SVG vé vàng có vòng quay bên trong**, key createIcon('ticket') tại js/icons.js, dùng cùng trong loot và số dư vé ở Sự kiện. Đồ họa vector theo thư viện icon hiện có, không emoji hoặc bitmap tạm. Đã nhìn lại ảnh ghép thật và reviewer kiểm fallback các skin; labels số vé vẫn là chữ thật.

Nghiệm thu:38/38unitPASS (rewards-ticket-feedback-unit.log),9/9UI PASS (rewards-ticket-feedback-ui.log): RNG inject chỉ test để đảm bảo rơi vé, ghép thật cả ba trò nhận đúng1vé +1chữ, vé không vào central stage,20scope cycles/reduced-motion/duplicate/aborted/failure rollback. Script check tổng thể exit0 (rewards-ticket-feedback-check.log), whitespace đạt. Review độc lập không P1/P2 mới. Bố cục2/2PASS (rewards-ticket-feedback-layout.log):4viewport×5skin,20cycles. Build exit0 (rewards-ticket-feedback-build.log). Hosting test đã deploy (rewards-ticket-feedback-deploy.log); đọc lại URL thật đúng bundle main-CDnLQn5r.js, có ticket loot và duration2500ms, không letter preload; rewards-letter-feedback-live-verified.json PASS. Không deploy rules, không thử cấp vé giả trên tài khoản thật, chưaAPK.

Không cần thay backend, khôngAPK. Chữ/vé đã sở hữu vẫn giữ; hiệu ứng không phát lại quà cũ.

## Bổ sung hiệu ứng nhận chữ —26/10/2026

Điều chỉnh tiếp theo26/10 theo phản hồi chủ dự án: đã bỏ link preload sheet chữ trong index.html; cảnh báo xuất phát từ preload toàn cục không dùng sớm ở trang chủ, không phải sai as. CSS image-set tải khi xuất hiện effect. Chữ đến giữa màn tăng lên116%, rồi thu nhỏ liên tục108%→85%→35% và mờ đi; chủ dự án tiếp tục yêu cầu tan chậm hơn nên đã tăng tổng1.700→2.200ms. Giảm chuyển động vẫn tĩnh1.100ms. Không đổi renderer owner/cleanup/kho/rules. UI sau thời lượng2.200ms:3/3PASS (runtime/qa/rewards-letter-feedback-adjust-ui.log), syntax211modules/diff đạt. Check tổng thể exit0 ở rewards-letter-feedback-adjust-check-retry.log; benchmark Triple p9514,77ms dưới20ms. Hai lượt trước dao động38,06/23,60ms và fail, source tạo bàn/threshold không đổi. Build exit0 (rewards-letter-feedback-adjust-build.log), Hosting test deploy thành công (rewards-letter-feedback-adjust-deploy.log). Đã đọc lại web: không còn preload chữ, bundle main-Cjb7qMGE.js có pulse116%/duration2200ms, atlas được phục vụ đúng; rewards-letter-feedback-live-verified.json PASS. Vite có warning nội bộ public-asset token khi xử lý image-set nhưng CSS output đã kiểm và cả hai URL atlas đều được resolve đúng. Review độc lập không phát hiện P1/P2; khôngAPK/rules/data change.


Yêu cầu mới đã chốt tự thu thập, cộng kho ngay. Đã vẽ sheet17chữ vàng–men xanh bằng skill imagegen (built-in), cắt/resize/pack thành atlas5×4. Source và **prompt chính xác** ở `design/rewards-letters/drop/source.json`, PNG cùng thư mục; generator `scripts/prepare-letter-drop-atlas.mjs` tạo `public/assets/rewards/letters/letters-{128,256}.webp`. Đã nhìn lại toàn bộ17glyph sau crop để tránh cắt nét/lẫn chữ cạnh. Không dùng font/emoji giả ảnh vật phẩm.

Khi nhóm đặc biệt cấp chữ thành công ở Memory/Link/Triple, icon40px bật từ vị trí ghép, bay về vùng giữa, phóng56–80px, caption “Đã nhận chữ X”, giữ gần1giây rồi tự ẩn. Tổng1.700ms, transform/opacity; reduced-motion tĩnh1.100ms. Đã chỉnh caption lên trên để không bị toast May mắn che. Không chặn thao tác hoặc chờ animation để cấp thưởng.

Chọn optional callback **sau durable commit** thay đọc delta kho ở renderer/reroll trong effect. `savePersistentGameData` vẫn trả boolean; callback không được ghi vào save và lỗi presentation không làm rollback/block bản lưu đã commit. Ba controller chỉ capture rect khi nhóm đặc biệt hợp lệ, Triple đi qua transaction hiện có. Không thay schema/key/kinh tế/rules/API cũ; không thêm cloud write.

Renderer chung `js/liveops/letterDropFeedback.js`/CSS riêng, scope round sở hữu root và cleanup. Max5entry/16DOM nodes/10animation hoặc5timer; entry cũ nhất thay presentation khi quá giới hạn, kho không đổi. Không RAF/particle loop; stale scope/duplicate/aborted không vẽ lại. Root được dọn khi unmount/restart; entry cleanup idempotent. Atlas tải khi cần hiển thị, chọn đúng DPR, cache hai kích thước hữu hạn:120.854B/346.626B; decoded sheet lớn5.242.880B. Không xác nhận FPS/memory điện thoại thật.

Nghiệm thu:

- Unit Spark/persistence/letters **25/25PASS**, `runtime/qa/rewards-letter-feedback-unit.log`.
- Playwright **15/15PASS**, `runtime/qa/rewards-letter-feedback-ui-final.log`:4viewport320/412/844/1024×2motion,20scope cycles mỗi cấu hình, rapid17requests luôn≤5entry, cleanup hủy animation/timer/DOM; callback sau commit, dedup/aborted; chữ hiển thị đúng chữ lưu từ ghép thật cả ba trò; failure rollback và wave regression.
- Các fixture cũ đã sửa đúng nguyên nhân: pair coin15→12 theo MATCH_COINS2 hiện hành; Memory phải set special ở board model chứ chỉ DOM không có hiệu lực; Link blue supply +mốc2 cấp2hint; Triple chờ app/menu sẵn sàng trước launch. Không đổi luật game để test pass. Test persistence mới cũng chờ startup/season initialization, tránh fixture ghi chữ trước seasonal reset.
- `npm run check` **exit0**, `runtime/qa/rewards-letter-feedback-check.log`; diff whitespace đạt. Review độc lập không còn P1/P2 xác nhận; đã xử lý góp ý tránh đọc layout ở các click/nhóm thường.
- Ảnh thật đã kiểm: `design/rewards-letters/drop/review/{memory-match,link-connect,triple-connect}-gameplay.png`; bản mobile nhiều chữ: `feedback-mobile.png`. Source atlas nền trong suốt và chữ nhỏ vẫn đọc được.
- `npm run build` exit0 (`runtime/qa/rewards-letter-feedback-build.log`), deploy `hosting:test` thành công (`rewards-letter-feedback-deploy.log`). Đã đọc lại URL https://memorymatch-test.web.app, entry/bundle `main-qy6hl2Jy.js` khớp build, có renderer mới và atlas128 được phục vụ đúng120.854B; `runtime/qa/rewards-letter-feedback-live-verified.json` PASS. Không thực hiện grant chữ giả trên tài khoản thật để thử animation; gameplay ba trò được kiểm bằng browser cục bộ với pipeline persistence thật.

Không APK, không deploy rules hoặc sửa dữ liệu thật cho phần effect; cập nhật Hosting test theo quyền thử web đã có. Không cần người chơi lấy lại các chữ cũ, chúng vẫn trong kho; effect chỉ báo chữ mới vừa nhặt.

## Phát hành web dùng Firebase thật —26/10/2026

Theo yêu cầu trực tiếp của chủ dự án sau nghiệm thu cục bộ: deploy rules và bật môi trường thật để thử web trước, APK sau khi web ổn. Quyền này thay giới hạn chưa deploy/bật trong các phần lịch sử bên dưới.

- Đã deploy riêng `firestore:rules` lên **memorymatchv1-1a**, gồm contract Spark và12public cosmetic ID mới. Compilation/release thành công. Đọc lại rules live khớp source: SHA256 `662edab10b2cbfb626c60c32931ed0009a82e40ca6a398e90e0a8136263a2f7a`, ruleset `6cae8569-b8b4-47bf-9d11-9f3e291a3bd7`. Log `runtime/qa/rewards-spark-live-rules-{deploy,verify}.log`.
- Bật `VITE_LIVEOPS_ENABLED=1` trong `.env.local`, giữ public expansion=1, không emulator. `npm run build` exit0, `runtime/qa/rewards-spark-live-web-build.log`.
- Deploy **hosting:test** thành công: **https://memorymatch-test.web.app**. Hosting beta/production không phát hành trong lượt này; Firestore rules dùng chung project đã cập nhật thật. Log `runtime/qa/rewards-spark-live-web-deploy.log`.
- Smoke trên đúng URL đã phát hành, Chrome viewport412×915, tài khoản khách mới trong context riêng: tải nhiệm vụ thật, thấy bốn bộ chữ, quay miễn phí commit thật, reload giữ đã dùng lượt. **PASS**, không pageError. Kết quả `runtime/qa/rewards-spark-live-web-smoke.json`, ảnh `runtime/qa/rewards-spark-live-web.png`. Không dùng tài khoản/bản lưu của chủ dự án.
- Khi mở modal ngay trước khi tài khoản kết nối xong, modal có thể giữ trạng thái chưa tải dù account đã kết nối; lượt smoke đầu chờ nút tự mở đã timeout. Dùng **Tải lại tiến độ** sau kết nối đã tải được và kiểm chứng giao dịch thật; chưa sửa cơ chế tự refresh modal trong lượt chỉ phát hành này. Không quy lỗi đó cho rules hoặc dùng kết quả emulator thay smoke live.
- Không Functions/SSV/billing/push/APK. Quảng cáo earned native và điện thoại vật lý vẫn chưa kiểm. APK chờ chủ dự án thử web ổn rồi yêu cầu đóng gói.

## Kết quả hiện hành — 26/10/2026: S0–S5 hoàn tất trong phạm vi source/web/emulator

Phần này thay các ghi chú đang làm/chờ quyết định/lỗi emulator bên dưới. Kế hoạch duy nhất đã viết lại theo quyết định cuối tại `REWARDS_MISSIONS_EVENTS_PLAN.md`. Không còn câu hỏi sản phẩm chờ. Production vẫn tắt; không deploy rules/Hosting, push, APK hoặc thay billing.

### Hành vi bàn giao

- Nhiệm vụ/điểm danh theo ngày/tuần giữ bảng Xu đã duyệt, bonus ngày1vé và tuần2vé. Giữ mốc Xu tuần20/50/80→5/10/10 trong Nhiệm vụ, reset thứHai07:00; không cấp đồ ở100điểm. Đồ hồ sơ sở hữu không reset.
- Free1 + ad earned10/ngày, vé riêng không hết hạn/cap; tám ô5/10/10/15/15/20/20/25Xu. Web không giả earned. Pending/retry/late earned sát reset dùng đúng quota ngày chuẩn bị, phục hồi tối đa48h sau earned, history tối đa30mục.
- Bốn bộ MEMORY MATCH/LINK CONNECT/TRIPLE CONNECT/ADVENTURE dùng chung chữ và toàn bộ12món riêng, mỗi lần đổi đúng1món chưa sở hữu; hết12món nhận rương10.000Xu. Không lấy quà Thành tích. Chọn món theo catalog ổn định và xem trước trước đổi.
- Trial100% rơi1chữ/nhóm đặc biệt ở mọi trò, đều bảng chữ chung; độc lập vé5%.20% chỉ dự kiến, chưa áp dụng. Chữ không hết hạn;2M+1A hiển thị `M-M--- -A---`. Bán1chữ1.000Xu, ghép3chữ giống nhau ra1chữ đều, có thể trùng. Nhận ngay dù sau đó thua; checkpoint ngăn cấp lại qua callback/Hoàn tác/reload.

### Ownership, tương thích và phương án

Chọn một private state Firestore có cấu trúc công bố nguyên tử cùng root snapshot, thay Functions/SSV và log từng ván. So với chỉ snapshot base64, rules kiểm được kỳ/quota/sequence. Gameplay/RNG/earned vẫn tin app theo mức bảo mật cơ bản đã chốt, không bảo chứng chống app sửa đổi.

Account/persistence queue có chung owner và giữ khóa xuyên stage/commit/apply, RNG/pending bền trước commit, cleanup không mất job lỗi. Conflict dùng canonical thay nâng revision rồi đè ví cũ. Backup Spark cần fingerprint canonical trước hydrate; durable restoreNeedsReconcile chặn đường import thấp tầng bypass. Root reward/economy revision là guard bổ sung. UID mới không thừa hưởng thưởng đã ràng buộc UID cũ, bản phục hồi giữ lại.

Để giữ rules dưới1000biểu thức mà không nới invariant, sync chia progress/vé rồi tối đa4loại chữ/publication. Mỗi phase atomic root+state, watermark chỉ ack phần đã công bố, crash giữ pending chưa gửi. Trade-off là tăng publication cho backlog nhiều loại chữ. Không ghi theo frame/tick/cú ghép hoặc tạo document từng chữ/vé/ván.

Owner chính: `js/liveops/{sparkModel,letters,dropAdapters,store,service,presentation,config}.js`; `accountService/cloudStore/persistence` cho queue/CAS/restore; ba adapter gameplay cho drop; appearance/chapter/progression cho normalize/acquisition/catalog; `styles/liveops.css` cho UI. Rules sửa qua `design/rewards-liveops/spark-rules.template.txt` và generator. Đã gỡ source/package/config Functions sau replacement đạt. Public generator kiểm bình thường cả LF/CRLF.

Giữ save key/formatVersion2 và API legacy; optional Spark fields có normalizer/version,12catalog ID và source acquisition letters mới đúng phạm vi được duyệt. Giữ90Thành tích/30mapping cũ/sáu effect/300Xu/backfill/public projection. Không hoàn nguyên/format lại các thay đổi có sẵn ngoài task.

### Cổng nghiệm thu cuối

| Gate | Kết quả | Bằng chứng |
|---|---|---|
| S0 | PASS | 38/38unit: legacy, Spark, persistence, letters; save/corrupt/future, quota/reset, retry, sell/fuse/exchange12/chest |
| S1 | PASS | Auth/Firestore emulator matrix exit0: login/free/vé cuối race, ad1–10/11, private/deny, linkage/stale restore, letter phases,12đổi/chest, public mới và rollover7ngày |
| S2 | PASS | Unit adapter flags/Lucky ba trò, noHint/bonus/weekly coins, immediate/dedup/persistence; browser sáu case wave ba trò |
| S3 | PASS | Browser interruption/reload/UID/letterUI/equip/stale backup/20cycles, earned reset/recovery pure/emulator; native provider chưa kiểm |
| S4 | PASS | Không callable/firebase-functions runtime hoặc package backend; rules source/public generator check đạt; build không cần Functions |
| S5 | PASS | 15/15web tổng hợp,2/2layout/lifecycle,assetalpha/budget,check/build và review độc lập |

Lệnh và bằng chứng:

- `node --test tests/unit/liveops.test.js tests/unit/liveops-spark.test.js tests/unit/liveops-persistence.test.js tests/unit/liveops-letters.test.js`:38/38PASS, reviewer độc lập chạy lại.
- Emulator `emulators:exec --only auth,firestore --project demo-memory-match "node scripts/check-liveops-emulator.mjs"`:exit0. Log `runtime/qa/rewards-spark-emulator.log`.
- Emulator web `node scripts/check-liveops-web.mjs tests/ui/liveops-online.spec.js tests/ui/firebase-account.spec.js tests/ui/progression-waves.spec.js`:15/15PASS, `runtime/qa/rewards-spark-web-final.log`. Account cases gồm offline/reconnect, linkUID/conflict/backup, canonical snapshot sau tiền tiêu.
- Playwright config `design/rewards-liveops/playwright.config.cjs`, grep `missions/events|twenty page`:2/2PASS, `runtime/qa/rewards-spark-layout-final.log`;320/412/844/1024×5skin,20chu kỳ. Enabled browser test kiểm riêng20normal +20reduced-motion, không tăng rootrevision khi chỉ mở trang, owner/node ổn định.
- `npm run check`:exit0, `runtime/qa/rewards-spark-check-final.log`. Lượt đầu chạy trùng browser vướng p95 Easy37,76ms>20ms; chạy riêng toàn bộ đã đạt, không đổi threshold/test. Các thông báo lỗi storage/quota có chủ đích thuộc test failure-injection.
- `npm run build`:exit0, `runtime/qa/rewards-spark-build-final.log`.
- Spark/public rules generator `--check`, diff whitespace:PASS. Reviewer độc lập không phát hiện P1/P2 mới, kiểm lại38unit/source generator và các guard restore/clock/recovery/quota.

### Artwork và kiểm tra hình

Đã dùng skill `imagegen` để tạo12ảnh riêng theo hướng Cổ tích đã duyệt. Prompt/brief chính xác lưu tại `design/rewards-letters/catalog.source.json`; PNG nguồn trong `sources/`, generator catalog và pipeline pack hiện có sinh WebP128/256/512, không thay bằng emoji hoặc ảnh trang nguyên tấm.

Alpha **1.521/1.521cặp PASS** (39avatar×39frame), `design/rewards-letters/review/alpha-validation.json`. Assetbudget PASS:core+icons515.780B, surface lớn nhất187.032B, hero98.506B, decode ước tính15.812.384B<24MiB, `runtime/qa/rewards-letters-budget.log`. Đã nhìn trực tiếp contact sheet nền sáng/tối và screenshot runtime, câu chữ/bố cục đọc được. Ảnh tổng hợp: `design/rewards-letters/review/representatives-light.png`, `representatives-dark.png`; UI thật: `events-earned-runtime.png`, `design/rewards-liveops/review/missions-runtime.png`. Không tuyên bố60FPS trên điện thoại từ số đo desktop/ước tính decode.

### Chi phí, kinh tế và giới hạn

Fixture emulator gộp10facts/50facts đều1publication,6reads/4writes,5.937/5.939B. Tổng matrix50publications:301reads/200writes/136.457B, `runtime/qa/rewards-spark-operation-counts.json`. Chỉ đếm SDK trên fixture nhỏ, không tính rules-dependent billed reads, transport/Auth/BXH/tính năng khác, không phải hóa đơn/quota live. Publication thật tùy chunk/retry/phase chữ/cleanup/clock. Không cam kết DAU hoặc tự cap vé để vừa Spark.

Giữ495Xu kỳ vọng/tuần chưa ad/vé;1.545khi70ad. Thêm9vé nhiệm vụ nếu dùng hết thành630/1.680kỳ vọng; cực đại tương ứng790/2.540, chưa vé rơi/tích lũy/bán chữ/rương. Không có trần tuần toàn hệ thống; trial100% có ảnh hưởng thu nhập, không dự báo theo20% chưa bật.

**Chưa xác minh ngoài phạm vi:** SDK/provider quảng cáo thật, điện thoại vật lý, hai thiết bị live, quota/billing console và rules production mới. Production vẫn tắt;12public ID mới chưa phát hành rules. Không thử mutate dữ liệu thật hoặc dùng emulator thay chứng nhận native earned. Skill làm rõ yêu cầu đã giúp chốt sản phẩm; skill imagegen đã tạo tài nguyên bàn giao. Không APK/deploy/push.

## Lịch sử triển khai trước kết quả hiện hành

## Tiến độ Spark và thay đổi sưu tập chữ — 25/10/2026, chưa nghiệm thu toàn task

Chủ dự án đã giao toàn bộS0–S5, sau đó đổi hướng đồ hồ sơ sang bộ chữ MEMORY MATCH/LINK CONNECT/TRIPLE CONNECT và ADVENTURE. Chưa chốt phạm vi thực hiện ngay, nguồn/tỷ lệ rơi, giá bán, luật ghép/tiêu chữ/nhận quà. Phần đồ hồ sơ theo điểm tuần tạm dừng; kế hoạch đã ghi rõ hướng cũ không còn là acceptance cho phần đó. Chưa triển khai chữ hoặc tự đặt kinh tế.

Source đang làm: model Spark/quota1free+10ad/vé, Firestore state+root snapshot cùng transaction, queue persistence/account, UID ownership và backup khi chuyển UID, adapter vé thẻ thường/May mắn ở ba trò; giữ ledger cũ. Tách model/config/adapter, source rules và generator. Runtime production vẫn tắt; chưa gỡ package Functions vì replacement chưa đạt đầy đủ.

Bằng chứng hiện có: unit Spark+legacy persistence17/17PASS; layout4viewport×5skin và20chu kỳ2/2PASS; browser Auth/Firestore2/2PASS (điểm danh/quay/ngắt/reload/reduced-motion/public cosmetic và đổi UID cùng storage giữ backup, không chuyển quyền thưởng). Emulator lượt đầu PASS race login/free/ticket cuối, ad1–10/11, quyền private, root linkage/stale restore/read-only. Khi bổ sung scenario facts+claim toàn bộ vào cùng matrix, emulator còn FAIL max1000expressions ở cập nhật facts; chưa coi S1 hoàn tất. Log hiện hành rewards-spark-emulator.log chứa lỗi này, không dùng lượt pass hẹp trước đó làm bằng chứng toàn matrix.

Build web và npm run check hiện hành đềuPASS (exit0). Diff whitespacePASS. Không deploy/rules live/Hosting/APK/push. Chưa kiểm SDK quảng cáo thật, thiết bị thật hoặc bộ chữ. Review đọc source và chạy model độc lập đã phát hiện Lucky nằm ngoài cờspecial, earned xuyên reset, pending hết hạn và đổi UID; đã sửa nguồn và bổ sung test liên quan. Finding deadlock đã rút vì updateSyncMetadata không enqueue; rewardPublished được filter trong cloudSaveEvents nên không tự upload lần2.

Các log tập trung runtime/qa/rewards-spark-*. Source và số đo hiện tại là tiến độ, không phải nghiệm thuS0–S5.

## Điều chỉnh sự kiện theo tuần — 25/10/2026, chỉ tài liệu

Chủ dự án xác nhận giữ kế hoạch Spark: nhận/quay cần mạng,10lượt quảng cáo/ngày và vé tích lũy. Sự kiện không có ngày kết thúc; điểm reset thứHai07:00 Việt Nam, mốc20/50/80 nhận lại5/10/10Xu mỗi tuần. Avatar/khung đã nhận giữ vĩnh viễn, không cấp trùng. Kế hoạch đã tách marker Xu theo tuần khỏi acquisition đồ, bổ sung rollover/recovery/test và cập nhật ý nghĩa25Xu/tuần trong dự toán. Bỏ lịch pilot7ngày/grace48h cũ.

Skill làm rõ yêu cầu được dùng để chốt reset và thưởng Xu lặp. Chỉ sửa kế hoạch/CONTEXT/receipt, không đổi runtime/save/rules/API hoặc phát hành. Chưa chạy check/build vì thay đổi chỉ tài liệu; S0–S5 chưa nghiệm thu. Phạm vi triển khai đang chờ câu trả lời còn lại.

## Bổ sung Vé quay miễn phí — 25/10/2026, đã chốt trong kế hoạch

Đã dùng skill làm rõ yêu cầu và nhận câu trả lời trực tiếp:1vé =1lượt,
tích lũy không hết hạn/dùng riêng quota1free +10ad; bonus ngày thêm1vé,
tuần thêm2vé và giữ Xu. Chủ dự án mở rộng nguồn rơi sang **mọi thẻ đặc
biệt của ba trò, không giới hạn vé**, thay đề xuất chỉ thẻ may mắn/cap2.
Giữ5% rơi1vé mỗi nhóm ghép hợp lệ và nhận ngay kể cả sau đó thua theo
câu hỏi đã nêu; không cap vé rơi/ngày, kho hoặc lượt dùng vé/ngày.

Đã đối chiếu owner ghép Memory/Link/Triple và validator snapshot: các cờ
may mắn/năng lượng/đặc biệt khác nhau, không được thêm một giá trị vào
bảng rồi coi đồng bộ/restore đã đúng. Kế hoạch yêu cầu một roll/nhóm,
marker bền vững qua Hoàn tác/reload, không biến bộ ba thường thành thẻ
đặc biệt; cấp vé cùng giao dịch ghép và giữ qua thua/offline. Không áp
điều kiện thắng/thời hạn facts nhiệm vụ lên vé rơi không hết hạn.

State/bản lưu/transaction chung quản số vé và tiêu vé cùng kết quả/Xu;
không document từng vé hoặc mảng kết quả tăng vô hạn. Đã bổ sung S0–S3,
test hai máy/vé cuối/retry/crash/restore, cấp hơn2vé và dùng hơn10vé/ngày.
Ngân sách9vé nhiệm vụ/tuần nếu dùng hết thêm135Xu kỳ vọng/225Xu tối đa:
không ad630/790Xu, đủ70ad1.680/2.540Xu, chưa tính vé rơi/để dành. Không
coi các số này là trần hệ thống vì vé không cap; mỗi lượt dùng vẫn có
chi phí commit Firestore, không tự thêm cap để ép vừa Spark.

Chỉ sửa kế hoạch/CONTEXT/receipt; không sửa code/save/rules/cấu hình,
không deploy hoặc chạy game test/build. Kiểm tra tài liệu và đối chiếu
phép tính, không nhận là đã nghiệm thu tính năng. Skill thực dùng:
`clarify-ambiguous-requirements` để chốt luật/kinh tế vé.

## Bổ sung quota quảng cáo thật — 25/10/2026, chỉ cập nhật kế hoạch

Chủ dự án tăng giới hạn quảng cáo lên **10 lượt/ngày**, giữ **1 lượt quay
miễn phí/ngày**, dùng chung tài khoản/cả ba trò/mọi thiết bị. Mỗi earned
hợp lệ cho một lượt quay thêm; retry/duplicate không tiêu lượt mới. Kế
hoạch đã bổ sung thứ tự lượt1–10, counter/quota, hai máy tranh lượt cuối,
ngày dùng đủ11lượt quay và chi phí tương ứng. Không đổi thưởng mỗi ô.

Ngân sách không ad vẫn kỳ vọng495Xu/tuần, tối đa565Xu; xem đủ70quảng cáo
trong tuần thêm kỳ vọng1.050Xu, tổng1.545Xu, tối đa2.315Xu nếu mọi lượt
quay đều25Xu. Giả định đủ nhiệm vụ/điểm danh/một pilot như kế hoạch trước.
Chỉ cập nhật kế hoạch/CONTEXT/receipt, không sửa runtime/source phê duyệt
lịch sử hoặc deploy. Không chạy game test/build cho thay đổi chỉ tài liệu.

## Điều chỉnh kế hoạch Firebase Spark — 25/10/2026, chưa triển khai thay thế

Theo yêu cầu mới nhất, đã phân tích lại kế hoạch và code backend/liveops,
đường snapshot/account conflict, persistence/rules, nguồn phê duyệt và ngân
sách Firebase chính thức. Kế hoạch hiện hành đã viết lại tại
`REWARDS_MISSIONS_EVENTS_PLAN.md`; S0–S5 còn chờ lượt triển khai được giao.
Các kết quả runtime/emulator trước đó bên dưới là lịch sử kiến trúc cũ.

Nguyên nhân phức tạp: callable cho cả status/fact/claim, document mỗi ván,
receipt sequence truy vấn lại, áp sổ server vào ví local, ticket/SSV và
package policy backend. Functions production cần Blaze, không phù hợp
Spark dù Blaze có free allowance. Không chọn giữ Functions giảm log hoặc
chỉ nhét quota vào snapshot base64 mà rules không đọc được.

Chọn Auth + Firestore trực tiếp, một state thưởng riêng tư/tài khoản,
state và root snapshot công bố cùng transaction; ví hiện hữu vẫn duy nhất.
Không server ledger/round collection/SSV. Chủ dự án xác nhận dùng earned
của SDK thật; bỏ qua/dismiss/error không là earned. Rules bảo vệ owner,
kỳ/quota và cấu trúc; không xác minh gameplay/RNG/callback trước app sửa.
Đã ghi rõ crash trước callback không có SSV để bảo đảm phục hồi.

Giữ nội dung/kinh tế/mỹ thuật đã duyệt,90Thành tích/ba starter/hai đồ event,
300Xu/sáu effect và lịch reset; không tự chạy pilot. Có yêu cầu sửa đường
conflict hiện đang nâng revision rồi gửi lại bản máy: không dùng cách này
cho thưởng, không cộng/max hai ví. Giữ recovery/UID/restore và yêu cầu
test hai máy, atom publish, checkpoint dedup hữu hạn trước nghiệm thu mới.

Chỉ sửa ba tài liệu: kế hoạch, CONTEXT và mục receipt này; giữ JSON phê
duyệt lịch sử và mọi thay đổi code có sẵn. Không đổi API/key/save format,
rules/config, không xóa Functions/data hoặc bật feature. Không deploy/APK/
push. Không chạy check/build/test game cho lượt chỉ tài liệu, không nhận
kết quả cũ là bằng chứng passS0–S5. Quota trong kế hoạch là dự toán từ
tài liệu chính thức, chưa đo usage live/toàn app hoặc kiểm billing console.
Skill thực dùng: `clarify-ambiguous-requirements` để chốt tin cậy SDK.

Nguồn phạm vi: `REWARDS_MISSIONS_EVENTS_PLAN.md` cùng bộ chuẩn bị trong
`docs/design/rewards-liveops`. Cổ tích/D0–Q1 và30quà cũ đã hoàn tất; không mở lại.

## Sửa lỗi ưu tiên — thống kê Hồ sơ,24/10/2026

Người dùng báo `Private profile statistics unavailable Error` và yêu cầu
sửa trước khi triển khai kế hoạch. Tái hiện tại normalizer: marker liên kết
đã lưu environment hiện hành như `local-waves1`, nhưng whitelist cũ chỉ có
local/test/beta/production, gây `Invalid linked profile owner` khi reload.
Contract mới được chạy trước sửa và thất bại đúng lỗi này.

Đã cân nhắc thêm cứng tám tên môi trường hoặc tái dùng nguồn season hiện có;
chọn `gameplaySpace` để giữ whitelist chính xác, không lặp suffix. Chấp nhận
đúng môi trường cũ và hiện hành, vẫn từ chối môi trường lạ/future. Chặn tạo
marker không hợp lệ ngay tại adoption; không reset/migrate/cộng lại thời gian.
Warning giữ nguyên failure path, bổ sung message để phân biệt lỗi gốc.

Phạm vi sửa: `profileStatsModel.js`, diagnostic trong `profileStatsService.js`
và regression tương ứng. Không đổi API/schema/keys, rule quyền riêng tư,
UID owner, rank, ví, gameplay hoặc bộ quà.

Đã đạt:

- `node scripts/check-profile-stats.mjs`: PASS, bao gồm8environment,
  replay/adoption, counter cũ, quota rollback, metadata pair và clock owner.
- `profile-stats.spec.js`:6/6 PASS; marker hiện hành qua3reload vẫn giữ
  60000ms, không warning/nhận lại; dữ liệu hỏng được giữ, retry đúng.
- `profile-stats-online.spec.js`:2/2 PASS với Auth/Firestore emulator;
  offline/reload, hai thiết bị cộng đúng180000ms, linking giữ ngày tạo,
  UID mới không bị kết quả/lỗi cũ sửa trạng thái.

`npm run check`: PASS khi chạy ngoài sandbox (Easy p95=10,96ms). Hai lần
trong sandbox lần lượt vấp benchmark Normal114,18ms >100ms và Easy20,68ms
>20ms; không đổi generator/ngưỡng. Benchmark không import module thống kê.
Kết quả tách môi trường cho thấy không cần sửa Triple để xử lý lỗi Hồ sơ.
`npm run build`: PASS,298modules. Cảnh báo chia chunk sound có sẵn, không
lỗi build. Tự review diff riêng sau kiểm thử: whitelist vẫn đóng, dữ liệu
marker/counter được giữ, không retry/timer mới hoặc ghi vào UID khác;
không có thay đổi ngoài phạm vi sửa thống kê. Không deploy hoặc APK/push/Hosting.

## P0 — đã duyệt, 24/10/2026

Đã đọc review, hai proposal JSON, inventory và xem trực tiếp hai ảnh được
chọn trong `review-v1/selected-images.json`. Chưa có60sprite mới hoặc runtime
liveops tại thời điểm chuẩn bị. Chủ dự án đã duyệt cả ba nhóm: hai concept,
toàn bộ 60 tên/brief/mapping và hai quà event; nguyên kinh tế proposal;
clock/account/backend và facts offline. Bản nguồn đã duyệt được chụp riêng
tại `design/rewards-liveops/{catalog.source,liveops.source,approval}.json`,
kèm hash nguồn chuẩn bị; không sửa hay commit tài liệu có sẵn của người dùng.

Reset ngày 07:00 Việt Nam, tuần thứ Hai 07:00, chung tài khoản ba trò.
Facts offline chỉ tính trong kỳ server đã xác nhận và gửi trước khi kỳ hết;
nhận cần mạng, nhiệm vụ đủ điều kiện chưa nhận chốt một lần khi reset.
Backend chỉ code/emulator. Pilot chung bảy ngày, chưa có ngày bắt đầu;
không tự chạy hoặc đếm ngược. Không APK/push/Hosting/backend/rules deploy.

P0 mỹ thuật duyệt concept/brief; bước mẫu avatar/khung/huy hiệu đại diện
trước sáu lô vẫn theo mục 3 của kế hoạch. Không coi ảnh concept là sprite
hoặc golden runtime. Giữ nguyên 30 mapping/receipt, sáu hiệu ứng và 300 Xu.

Giữ nguyên các thay đổi có sẵn: `CONTEXT.md`,
`ILLUSTRATED_UI_ACHIEVEMENTS_PLAN.md`, `REWARDS_MISSIONS_EVENTS_PLAN.md`;
không đưa chúng vào commit sửa thống kê.

Skill thực dùng: `clarify-ambiguous-requirements` để chốt P0; `imagegen`
ở chế độ built-in, từng món một, alpha thật và giữ nguồn/prompt khi làm A1.

## A1 — mẫu đại diện đã duyệt

Chủ dự án duyệt Sóc Thư Sinh, Trang Sách Vàng, Dấu Ấn Tri Thức làm chuẩn
và giao tiếp tục toàn bộ kế hoạch. Mẫu đã pack 512/256/128 bằng source
generator `scripts/prepare-reward-expansion.mjs`; canvas/pivot/avatarRect
theo manifest bộ cũ, không upscale. Khung được imagegen chỉnh hai lần:
thêm margin, rồi sửa lòng 838×752 vượt circularity limit cũ. Giữ ngưỡng,
không sửa PNG bằng tay hoặc dùng ảnh chân dung gộp vào khung.

Alpha/geometry: 100 cặp (10 avatar × 10 khung, gồm đồ cũ và mẫu mới) PASS,
không hở lòng/nhô chân dung ra ngoài. Đã xem nền sáng/tối, mọi avatar cũ
qua khung mới và avatar mới qua mọi khung cũ. Chưa thay cho matrix 1.156
cặp cuối. Playwright mẫu 5/5 PASS: modal Hồ sơ bốn viewport 412/320/844/
1024, ba hero và renderer chân dung 30px của BXH. Đây là QA presentation,
chưa phải đồng bộ ID mới qua hai tài khoản. Bằng chứng tại
`design/rewards-liveops/review`; chưa ghi catalog/runtime/quyền sở hữu mới.

### Bổ sung trực tiếp của chủ dự án

Sau khi tạo bộ quà, thêm bộ hồ sơ cơ bản sẵn trong kho: Chim Sẻ Nhỏ,
Vòng Gỗ Mộc, Lá Đầu Tiên. Nguồn riêng trong `cosmetic-extras.source.json`;
không chiếm mapping của 90 thành tích, không giả receipt hoặc tự đổi đồ
đang trang bị. Kiểm cuối tăng thành 35 avatar × 35 khung = 1.225 cặp.

### Lô 1 — Thư viện Ánh Sao

Đủ 10 món màn 11–20 Memory Match, PNG alpha và WebP 128/256/512.
169 cặp (13×13, gồm đồ cũ) PASS. Hươu được vẽ lại để sừng không vượt
ảnh tròn; Mây Lụa được rút ngắn ornament dưới để giữ canvas chuẩn.
Không nới ngưỡng hoặc đổi geometry cũ. Chỉ nguồn/pack/QA, chưa runtime.

### Lô 2 — Khu rừng Bốn Mùa

Đủ thêm 10 món màn 21–30 Memory Match; tổng mới 20 PNG và 60 WebP.
289 cặp (17×17 gồm đồ cũ) PASS. Sửa hạt dẻ đúng brief và thu gọn lá khung
qua imagegen; không vẽ sửa bằng code. Một lần tạo Gấu bị moderation output
từ chối, tạo lại built-in với mô tả động vật rừng rõ ràng và thành công.
Nguồn native giữ nguyên; crop theo alpha >8 của pipeline cũ, kiểm corner
alpha=0 trên sprite xuất, kiểm alpha/kích thước mọi WebP. Chưa runtime.

Trong A1 xuất hiện thay đổi gameplay/shop/cấu hình ngoài task. Giữ ngoài
commit và đã hỏi owner còn hoạt động trước khi nối facts ở các gate sau.

### Lô 3 — Vịnh Nguyệt Quang

Đủ 10 món màn 11–20 Link Connect; tổng 30 PNG/90 WebP mới. 441 cặp
(21×21 gồm đồ cũ) PASS. Hải Mã được imagegen sửa để mào nằm trong đĩa
chân dung, không còn hở lòng ở ba khung cũ. Source contracts 5/5 PASS,
kèm lock bất biến của 30 mapping/files cũ trước khi mở rộng runtime.

Đã cân nhắc vẽ lại mọi crest lệch vài pixel hoặc fit đều theo extent ngoài;
chọn fit đều cho sai lệch nhỏ vì radius144 là reference trong contract.
Giữ canvas512/pivot256/avatarRect97/97/318/318 và padding8. Aperture sau
fit phải >=95% nominal, nếu không vẫn yêu cầu vẽ lại. Giữ kiểm alpha thực
mọi cặp, không hở lòng hoặc leak ra ngoài. Bộ cũ không được regenerate.

## Tiếp quản và triển khai tiếp — 25/10/2026

Chủ dự án xác nhận trực tiếp giữ phê duyệt P0/mẫu đại diện, tiếp tục toàn bộ
A1–Q2; bổ sung tăng avatar Hồ sơ, giảm khoảng dư, đưa đồ cơ bản lên đầu,
làm rõ avatar BXH. Không APK, commit/push, Hosting, backend/rules deploy.

### A1–A2

- Tiếp quản đủ 65 nguồn riêng: 60 Thành tích + hai event + ba cơ bản;
  không tạo lại ảnh. Đã xem toàn bộ contact sheet sáng/tối và ảnh renderer.
  Alpha report: 35 avatar × 35 khung = **1.225/1.225 PASS**.
- Catalog 90 game/level, năm extras độc lập; 30 mapping/file/receipt và sáu
  effect giữ nguyên. Coverage revision=2 tách grant catalogVersion=1;
  marker cũ, chapter2+, archive/restore và 300 Xu đã có contract chạy lại.
- Hồ sơ phân trang 12 món, dùng thumbnail128 và hero256; bộ cơ bản đứng
  đầu từng nhóm. Avatar Hồ sơ 104/116px, BXH56px, không tự đổi đồ đang dùng.
  Đã kiểm thực bốn viewport; màn320 tên xuống dòng theo từ, không ép tên
  cạnh nút sửa trong một hàng quá hẹp.
- Public catalog/rules có 89 ID đồ hồ sơ (90 trừ sáu effect + năm extras).
  Emulator hai tài khoản kiểm từng ID, deny ghi chéo UID/private data,
  giữ thứ hạng, projection chỉ ba món đang trang bị; cache tối đa100.

### L1–L4 — source/runtime và authority

- `js/liveops/model.js` là policy thuần; generator chép sang package
  Functions để không có hai bản policy sửa tay. Callable dùng thời gian
  server, RNG crypto tám ô đều, Firestore transaction cho quota/kết quả/
  receipt. Round document chống đếm trùng, không giữ mọi round trong RAM.
- Ba settlement adapter lấy attempt ID bền vững và tổng pair/triad của
  wave đã thắng. Facts cùng commit kết quả; tutorial/hủy không qua boundary.
  Cờ hintUsed giữ qua wave/session; save cũ thiếu lịch sử không được suy
  là chưa dùng Gợi ý. Offline chỉ kỳ đã xác nhận, gửi trước kỳ hết.
- Local sequence theo UID, ví và marker áp receipt cùng giao dịch. Restore
  đọc lại những sequence còn thiếu; gap/UID sai/future ledger bị từ chối.
  Giữ delta thưởng nếu snapshot mua hàng được xếp hàng trong lúc grant
  đang commit. Khi đang chơi chỉ gửi/ack facts, hoãn áp ví đến ngoài game.
- Ngày UTC00:00, tuần thứ Hai; điểm danh bảy ngày nhận thực. Claim nhiệm vụ
  thủ công, bonus cùng lần claim cuối; reset chốt phần đã đạt đúng một lần.
  Thông báo gộp Xu thực đã áp, không thêm EXP/rương vào summary.
- Nhiệm vụ/Sự kiện đi qua entry/page/modal/dock hiện hữu; DOM cho chữ/số,
  body cuộn, focus/close/banner/safe-area theo owner cũ. Một rotor transform
  2,4s hữu hạn, reduced-motion tĩnh; đóng trang không quyết định cấp quà.
- Pilot vẫn chưa có lịch bắt đầu: không tự chạy/countdown. Policy kiểm
  cap40/ngày, mốc100 và acquisition receipt riêng, grace48h. UI có thể lệ,
  quà rời và Xem hành trình; không dùng PNG cả trang.
- Rewarded dùng consent service/native adapter hiện hữu, earned/dismiss/
  error/no-fill tách biệt, 20 chu kỳ cleanup và late-earned được test.
  Client không cấp Xu; SSV kiểm ECDSA trên query encoded, transaction ID
  và ticket UID/ngày. Callback trùng hội tụ receipt wheel:UID/day/ad.
  Earned chờ SSV được ghi theo UID, không bắt xem lại sau reload.

### Lỗi Firebase báo trong khi thử web

- Lời gọi liveops đã bị nối trước khi Function được phát hành, gây lỗi
  preflight/CORS. Đã sửa bằng release capability: mặc định không gọi
  Function chưa bật; emulator tự bật. Không nới CORS hoặc giả thưởng.
- Rules live cũ từ chối ba starter ID mới. Đã chặn gửi ID mở rộng trước
  khi rules tương ứng sẵn sàng; giữ lựa chọn/kho trên máy và đồ public cũ.
  Sau khi chủ dự án deploy rules, bật `VITE_REWARDS_PUBLIC_EXPANSION_ENABLED=1`
  trong bản web rồi kiểm lại. Không tự deploy trong lượt này.
- Rules source đã qua emulator; SHA256:
  `20193FD2962846639C7D1403260676FB93BC8DF099FF47DCE113E1F3C2EEF364`.
  Deploy rules không phát hành Cloud Function. `VITE_LIVEOPS_ENABLED=1`
  chỉ bật sau khi backend đã được duyệt/phát hành riêng.
- Native rewarded còn cần ad unit thật `VITE_ADMOB_REWARDED_ID`, cấu hình
  SSV callback và `ADMOB_REWARDED_UNIT` khớp ad_unit nhận từ Google. Chưa
  thử provider thật; web không provider không cho quảng cáo giả cấp quà.

### Bằng chứng Q2 và giới hạn

- Unit/contract mới + bộ achievement/public cũ: **36/36 PASS**, không skip.
  Bao gồm restore, replay/gap/UID, giao dịch ví, queue, UTC reset, offline,
  quota/sector, pilot, SSV signature/tamper và native late/duplicate/error.
  Outbox hữu hạn4096 round, có test200 round/ngày; ack kỳ hết hạn được
  dọn cả khi đang chơi mà không chạm ví RAM, không có ngưỡng100 ván cũ.
- Art/profile/page UI: **8/8 PASS**, bốn viewport, năm skin và 20 chu kỳ.
  Profile đo ảnh đang mount <=256px, tối đa12 món/trang.
- Regression BXH + ba game: lượt đầu19/22; ba bài chạy lại **3/3 PASS**.
  Một lỗi artifact do hai runner dùng chung output (đã tách đường output),
  một bộ đệm resource timing250 bị đầy (test dùng2000), một kỳ vọng mười
  hàng luôn vừa màn đã chuyển thành kiểm cuộn được tới hàng cuối cho avatar
  lớn. Giữ mọi kiểm rank/query/focus/cleanup; 30 chu kỳ node364/listener26
  trước/sau bằng nhau, nền tải một lần, không decode lặp trong trace.
- Browser + Auth/Firestore/Functions emulator: **1/1 PASS**, điểm danh,
  quay/ngắt/reload giữ Xu và kết quả, tài khoản khác đọc starter selection.
  Emulator Node cũng PASS hai thiết bị tranh quota, round trùng, UID riêng
  và quyền private; không dùng Firebase live để test.
- Ngân sách giữ nguyên ngưỡng: core+icons515.780B, trang thumbnail+preview
  tối đa185.678B, hero91.802B, estimated live decode15.812.384B (<24MiB).
  Phép tính theo trang12 thumbnail128 đã được chủ dự án duyệt riêng; không
  nới ngưỡng sau lỗi. Không xem ước tính này là GPU/heap trên điện thoại.
- Sample desktop Chromium quanh thao tác quay/ngắt:70 frame, p95 khoảng
  13,8ms, max124,73ms gồm lúc bắt đầu/network; long-task observer không có
  entry, JS heap28.732.313→29.270.466B. Không tuyên bố đạt60FPS mobile.
- Chủ dự án duyệt sửa hai kỳ vọng baseline cũ: Gợi ý còn42Xu sau mua từ100,
  thưởng mới time30 thay time10 và xác nhận time10 cũ không đổi. Test thời
  gian Thử thách đối chiếu chính xác60/90/120/180 theo size đã duyệt; không
  sửa runtime cân bằng đồng thời. Normalizer test bổ sung ledger mặc định.
- `npm run check` và `npm run build` cuối sau chỉnh recovery đều PASS
  (exit0). Một lần benchmark Easy20,33ms>20 khi chạy đồng thời
  browser được lưu ở log timing-failure; không đổi ngưỡng.

Log/đo tập trung tại `runtime/qa/rewards-liveops-*`; ảnh tại
`design/rewards-liveops/review`. Review riêng đọc lại diff, boundary, cleanup,
gating phát hành; không nhận là review từ agent độc lập. Không API/key/save
formatVersion mới; chỉ field tương thích rewards/acquisitions/coverage/hintUsed.
Chưa xác minh điện thoại thật, provider quảng cáo/SSV live, cloud hai thiết
bị live hoặc backend mới trên production. Skill OpenAI Docs đã dùng
để tra lỗi kết nối; chưa có log phiên mất kết nối để chốt nguyên nhân, không
kết luận do số ảnh hoặc hết hạn mức. Lượt này không gọi imagegen tạo lại.

### Quyền phát hành rules bổ sung — 25/10/2026

Sau phần chuẩn bị, chủ dự án nói rõ **“Cho phép deploy rules”**. Đã chạy
deploy **chỉ firestore:rules**, project `memorymatchv1-1a`; exit0, compiled
và released thành công. Không deploy Hosting/Functions/APK/push.

Đã đọc lại release `projects/memorymatchv1-1a/releases/cloud.firestore`,
ruleset `86ce11fd-9f35-4b4b-8317-885363665cc4`; source live khớp byte với
`firestore.rules`, SHA256 `20193fd2962846639c7d1403260676fb93bc8df099ff47dce113e1f3c2eef364`.
Log `rewards-liveops-rules-deploy.log` và readback JSON cùng thư mục QA.

Đã bật `VITE_REWARDS_PUBLIC_EXPANSION_ENABLED=1` trong `.env.local` (chỉ
field mới, không đọc/in/đổi credentials trong `.env`). Web cục bộ/build
nhận ID mới, cần reload bản web đang mở để gửi lại lựa chọn của người chơi.
Phần “chưa deploy rules/chặn ID mới” bên trên là lịch sử trước quyền bổ sung.
Không nhận đã quan sát hai người chơi production trực tiếp sau phát hành;
hai tài khoản/emulator và nguồn rules live là hai bằng chứng riêng.

## Gom commit lịch sử —26/10/2026

Chủ dự án yêu cầu rà soát và commit các lượt đã hoàn tất, trừ nền động. Gom ba phase: cân bằng giờ/giá vật phẩm; phần thưởng Spark/nhiệm vụ/sưu tập chữ cùng nguồn ảnh và generator; giao diện Hồ sơ/avatar/HUD. Chỉ rà diff/phụ thuộc/file được stage, không sửa behavior hoặc chạy lại test/build/deploy. Giữ kiểm thử hiện hữu gắn với hành vi đã đổi và script kiểm tra tái sử dụng; không đưa runtime/log/ảnh QA, harness cục bộ hoặc bộ test mới không cần thiết. Bộ Triple progression cũ còn kỳ vọng thời gian lỗi thời nên giữ chỉnh sửa cục bộ, không nhận là regression đã pass. Phần nền động và ghi chú active của nó được giữ ngoài commit.
