# CONTEXT — Trạng thái hiện tại (2026-10-27)

## Kế hoạch mới: rơi vật phẩm, năng lượng và thẻ đặc biệt ba trò — 27/10/2026

- Chỉ lập kế hoạch theo yêu cầu mới; nguồn duy nhất của task gameplay này: `DROP_ENERGY_SPECIAL_CARDS_PLAN.md`. Chưa sửa code/config/save/rules/asset, chưa test/build/deploy/APK/commit. Giữ task Sự kiện/Nhiệm vụ và nền động riêng, không thay plan hoặc nghiệm thu của chúng.
- Chủ dự án đã chốt và duyệt cân bằng bổ sung 27/10: mỗi nhóm ghép đặc biệt 80% nhận 1 năng lượng, thường 20%; hỗ trợ độc lập **thường 5%, đặc biệt thông thường 10%, Memory Special/Link Blue 30% thay nhánh chung**, thay bảng hỗ trợ 20%/50% trước đó. Memory Special cũng theo 80%, không chắc chắn +1; không pity. Đồ mạnh hiếm hơn, previewAll chỉ mốc 10; trọng số số học còn P0. Memory Lucky mọi chế độ 1–3 cặp mỗi ván, quà +15 giây/+1 Gợi ý/+10 Xu; Triple Lucky chỉ Thử thách, chọn +15 giây thay dòng +5 giây. Magnet 1 thẻ mỗi đợt mọi chế độ Triple; chỉ chọn khi bóc được, hút đồng loại từ khay hoặc mọi lớp board. Vô tận vẫn cấp item thời gian/đóng băng vào kho, Lucky cộng thời gian trực tiếp đổi Xu; mức đổi chưa chốt.
- Link đổi Cyan không băng +10 Xu, Blue tiếp tế 30%, Red 50% phá cặp thường/50% tự xáo miễn phí; Lucky 50 Xu hoặc 30 giây. Mốc 1–10 mới: 10 Xu / phá cặp / 20 Xu / Gợi ý / 30 Xu / Xáo trộn / 40 Xu / Sấm sét / 50 Xu / phá cặp +100 Xu +Đóng băng vào kho. Tổng cơ bản 250 Xu +4 item +2 lần phá, không giữ phá mốc 1/3/9 như cũ. Memory 10 mốc gần như đã khớp, giữ 210 Xu +4 preview +2 hint +3 time30/vòng, item mốc vào kho cả Vô tận.
- Kế hoạch nêu các đề xuất chưa chốt: pool/trọng số hỗ trợ và Lucky (Memory tier 60/30/10 là đề xuất mới, chưa duyệt số), Lucky có tính đặc biệt cho năng lượng, quy đổi Vô tận, kho 999/no-pair fallback, phạm vi 1–3 Lucky với ván nhiều đợt, giữ Triple target30/step3 và adapter Magnet cho vé/chữ/đom đóm. Không tự đổi tỷ lệ sinh thẻ 80/20; không dùng chung RNG hai nhánh hoặc cộng nhánh tiếp tế, không cho cặp phá phụ kích hoạt chuỗi drop. Dấu đã bốc ghi cả lần trượt, giữ qua undo/restore; Magnet xử lý bộ ba nguyên tử trước xét đầy khay và cập nhật solver/witness. Phase P0/D0/D1/L1/M1/T1/T2/Q1 và acceptance/data/lifecycle/perf nằm trong plan; chưa triển khai.
- Bổ sung đánh giá cân bằng: giữ Lucky/Magnet, mốc và giá shop trong lần thử đầu; đo quà nhận/dùng/tồn, mốc/phút và thắng/đầy khay theo trò/mode/thời lượng, không tự ép Triple từ 30/3 thành 10/1. Prompt bàn giao triển khai đầy đủ ở **mục 13 của plan**; chỉ viết prompt và cập nhật tài liệu trong lượt này, không chạy prompt hoặc bắt đầu code. Tỷ lệ năng lượng/hỗ trợ đã duyệt không hỏi lại ở P0.

## Kế hoạch mới: trang Sự kiện, Nhiệm vụ mobile/Lễ hội vô hạn — 27/10/2026

- Chỉ phân tích/lập kế hoạch theo bản đính kèm và yêu cầu mới; chưa triển khai. Nguồn duy nhất của task Sự kiện/Nhiệm vụ mới: `EVENTS_MOBILE_FESTIVAL_PLAN.md`. Không sửa/đổi trạng thái task nền động G4/G5 đang làm bên dưới.
- Đối chiếu thấy Events đang gộp wheel/chữ/kho, select/input; kho thực có17chữ nên4×3không đủ. Missions đã có ngày/tuần,20/50/80Xu đang là hành trình tuần, không lấy làm event vô hạn. Concept chỉ bằng chữ, không phê duyệt quà/mức tiền/countdown mới trong đó.
- Làm rõ cuối27/10: **bốn loại rương chung C/Avatar/Khung/Huy hiệu**, không rương gắn mónA. C cóXu/hỗ trợ, ba loại ngoại hình cóXu/hỗ trợ/món ngẫu nhiên trong pool đúng loại. Quà ngoại hình chưa nhận của Thành tích/chữ/Lễ hội chuyển thành rương tương ứng; nhận rương cập nhật bước thưởng, mở sau. Đồ/grant cũ giữ nguyên. Pool dùng được món từ các bộ khác; trùng ngoại hình đổiXu, hỗ trợ cộng kho. Đủ pool của loại thì mở loại đó đổi thẳngXu, không rươngXu10.000 riêng. Quyết định này thay câu trả lời trước về đợi trúng món mục tiêu/đủ12món.
- Lễ hội chốt bốn mốc điểm: 25 nhận Xu; 50 nhận Xu + Rương C; 75 nhận Rương Khung; 100 nhận Rương Avatar (mức Xu trực tiếp chưa duyệt). Nhận đủ bốn mốc sang vòng mới, giữ dư, không cần mở rương. Đom đóm 1 con/nhóm đặc biệt, 100% thử rồi dự kiến 10%, độc lập chữ/vé; nhận ngay kể cả thua/offline, không cap ngày/hết hạn. State earned/cycle/mask 4 mốc và kho 4 counter/sequence hữu hạn, không document từng vòng/rương. Icon SVG + loot sau durable commit như vé, không giữa màn.
- Phê duyệt bổ sung 27/10 theo yêu cầu “Áp dụng như đề xuất trên vào kế hoạch”: **Kho rương chung trong Bộ sưu tập**, lưới 2×2 bốn loại gộp số lượng, xem quà/tỷ lệ/chọn trò hỗ trợ/Mở 1; Sự kiện và Thành tích dẫn cùng kho. Xu vào ví, hỗ trợ vào kho trò đã chọn, ngoại hình vào đồ Hồ sơ; nhận rương chuyển bước thưởng, mở sau. **Bảng rương đã duyệt:** C 40%→50 Xu/60%→1 hỗ trợ; Khung 40%→100 Xu/40%→1 hỗ trợ/20%→1 khung; Avatar 40%→150 Xu/40%→1 hỗ trợ/20%→1 avatar; Huy hiệu như Khung với nhánh huy hiệu. Đổi trùng hoặc đủ pool theo loại: Khung 200/Avatar 300/Huy hiệu 200 Xu; đủ pool mở đổi thẳng, C vẫn 40/60. Không hỏi duyệt lại bảng này hoặc bố cục kho ở P0.
- UI ba tab Events, Xu trực tiếp mốc 25/50, subpool hỗ trợ, whitelist/trọng số, chu kỳ loại rương chữ, policy kho 999 và mẫu mỹ thuật còn ở mức đề xuất/đặc tả. Trong ván đề xuất xem kho, mở ngoài ván theo guard kinh tế hiện có. Chỉ cập nhật kế hoạch, chưa sửa config/code/save/rules/test/build/deploy/icon. Giữ free 1/ad 10/vé/recipes/điểm danh/weekly/300 Xu/rương độ khó/sáu effect, chưa động task nền.

- Bổ sung trang Nhiệm vụ 27/10: mục 3A và phase U3 bao phủ cả Hôm nay/Tuần này theo khu vườn đêm, 7 ô điểm danh dạng 4+3, thẻ có tiến độ/CTA, thưởng trọn bộ và countdown. Chủ dự án xác nhận **giữ Xu điểm danh hiện tại, chỉ cải tiến giao diện**: 10/10/15/10/15/20/25 Xu; không vé ngày 4–6/rương ngày 7. Giữ ba nhiệm vụ ngày thưởng 5/5/10 Xu, bonus tự cấp khi nhận đủ ba quà là 10 Xu + 1 vé; tuần bốn mục tiêu, nhận bonus 50 Xu + 2 vé. Hình rương trọn bộ chỉ minh họa thưởng cố định, không thêm rương vào kho. Chơi dẫn menu trò gần nhất; visits dẫn điểm danh; giữ tiến độ theo ván thắng. Countdown từ cùng kỳ UTC (07:00 Việt Nam), một timer UI tối đa mỗi phút khi hiện, không polling/ghi Firebase. Giữ tuần 20/50/80 và vòng điểm danh, không thêm state/schema/backend. Đã bổ sung tiêu chí mobile/PC/S22, offline/đổi kỳ/nhận lặp/lifecycle/reduced-motion; chưa code/test/build/deploy. Phần này thay phạm vi cũ chỉ đánh giá Nhiệm vụ, không tạo kế hoạch riêng.

## Nền động nhẹ — triển khai G0–G5 đã bàn giao local, còn xác minh S22

- Bổ sung27/10 đã bật mặc định **chỉ ở bản đồ** sau khi chủ dự án duyệt video32s: đèn sáng/tối, đom đóm rõ hơn, gợn hồ và ếch nghỉ/nhảy/bơi/về lá. M1 commit62d1156; M2 rollout giữ nguyên ba màn chơi/Home, API/save/Firebase/meteorEffects và ngân sách. Có fallback vùng chật, reserved-slot cho lá tĩnh để sao băng vẫn đúng eligibility/capacity. Đạt13unit/19UI,90tổ hợp3map×5skin×3khổdọc tại2pose,100chu kỳ mỗi khổ,100mount p952ms vàsoak10phút plateau2.604B/listener131 ổn định. A/B rollout3cặp32s/arm: delta p95≤+0,2ms/p99≤+0,3ms/input≤+0,6ms,layer+5≤6. Check/build/tự review riêng đạt; cùng plan/receipt cũ, không nhận review độc lập hoặc physical GPU. S22 kiểm ADB vẫn không có thiết bị; ngang chủ dự án tự kiểm. Không APK/deploy/push/rules, không stage log/ảnh QA hay task gameplay đồng thời.

- Nguồn kế hoạch hiện hành duy nhất: `ANIMATED_BACKGROUNDS_PLAN.md`. Chủ dự án đã giao toàn bộ G0–G5 và yêu cầu commit từng phase. Các ghi chú chỉ lập kế hoạch trước đây là lịch sử. Receipt chung: `ANIMATED_BACKGROUNDS_IMPLEMENTATION_RECEIPT.md`. Không deploy/APK/push/rules.
- Đã chốt trang chủ/bản đồ/cả ba màn chơi; giữ ảnh nền hiện có, chuyển động nhẹ theo cảnh; thiết bị thử Web PC và Samsung S22 Android. Thác Home/Link/Triple/map, cá ở hồ Memory/map, đom đóm/lá theo vùng cây; không dồn mọi nhóm vào mọi nền hoặc chạy qua bàn/HUD/khay/node/quảng cáo.
- Phương án đề xuất: lớp nhỏ DOM/SVG/texture tĩnh + WAAPI transform/opacity, scope/page/round và coordinator hữu hạn; master setting `meteorEffects`/UI Hiệu ứng nền giữ nguyên. Không video/GIF/WebGL/RAF nền liên tục, không scheduler sao băng chạy chồng. Có Light/Standard/Static, reduced-motion/hidden/modal/pause/cancel, crop dọc/ngang/map lặp và fallback vùng không an toàn.
- G0 có snapshot working tree, inventory owner/crop/stack/map và hai mẫu PC120s Home/Memory (Vô tận), motion master off; Chrome155, RAF khoảng6,9ms. Home có outlier597,2ms được giữ trong JSON, chưa chứng nhận steady-state/GPU. ADB không có thiết bị nên S22 chưa đo. Ngân sách không đổi; chưa thêm sampler tự hạ quality khi chưa có bằng chứng cần.
- G1 mẫu Memory đã được chủ dự án duyệt trong chat:1cá/2đom đóm/1lá nhẹ trên nền thật dọc/ngang. Home được chốt giữ ảnh vườn hiện tại và tĩnh khi không có vùng phù hợp (home-menu.css đang che body sao/thác). Mẫu riêng chưa rollout vào sản phẩm; G2 tiếp theo gom lifecycle/ownership, G3 phủ cảnh. G4/G5 và100chu kỳ toàn app/10phút soak/A-B đầy đủ còn nguyên. Không gọi số đo PC là S22 hay review tự thực hiện là độc lập.
- G1:2/2unit,8/8Playwright4viewport, check pass; A/B PC sơ bộ3cặp10s sau preview/guide boundary, delta p95≈0/p99≤0,3ms,4layer nền nhỏ được phân loại bằng backendNodeId. Pilot11node/4handle/0timer;100lần tạo/hủy về0. Evidence/video/trace nén ở docs/design/animated-backgrounds/qa; đây chưa là nghiệm thu G4.
- Điều chỉnh G1 theo yêu cầu tiếp: cá đầu đi trước, thêm cá giữa hồ lộ/bớt1đom đóm, tổng vẫn4animation/4layer,12node.6/6Playwright dọc320/412/900pass; A/B900×1024 có assertion đủ2cá active, delta p95/p99 không tăng trong3cặp10s. Game thưa, ưu tiên hoàn thiện bản đồ. Từ mốc này chỉ agent kiểm dọc; ngang chủ dự án tự kiểm.
- G2 owner/scheduler và token popup/ad đã triển khai; đang chốt unit/regression và commit trước G3. Giữ facade cũ/hai slot sao băng; remove fog/cloud khởi tạo vô chủ. Không stage log/ảnh QA hoặc file task khác theo quy định27/10.
- G2 commit `dfea4bd`. G3 đã phủ Home tĩnh, map và ba game bằng renderer SVG/CSS dùng chung; preset theo source dọc/ngang độc lập, source lock7ảnh; không bitmap mới. Map tối đa3tile/5target, clip viewport và tránh hull đường/node/rương; scrollend có fallback dùng chung scheduler. Scope/startup/pause và đổi nguồn nối owner, abort chuẩn bị map khi bị hủy.
- G3:9/9matrix dọc320/412/900pass;4/4portrait kiểm lại gồm404/tải chậm/staleowner;10/10unit geometry/runtime pass, build sản phẩm pass. Đang chuyển G4 regression/hiệu suất/soak; chưa nhận đạt S22 hoặc kiểm ngang mới.
- G3 commit `7dfbd9c`. G4 production cùng build đã có60mẫu120s/30cặp A/B: delta frame/input-dispatch đều trong ngưỡng,0LongTask>50ms. Giữ outlier Triple on1006,8ms/scripts rỗng trong receipt; chưa gọi là GPU FPS.90tổ hợp dọc×skin×map/game và600mount warm đã qua; đang chạy100chu kỳ cảnh active/soak10phút và regression cuối.
- G4 sửa transition có thể chờ vô hạn khi CSS frame bị gộp bằng fade WAAPI hữu hạn220ms; refresh scene sau commit source. Map host chuyển thành con cuối scroller để bỏ backing layer dài10461px; vẫn clip/đồng bộ cuộn và tránh UI. Không đổi gameplay/save/API/Firebase. S22 kiểm ADB lại27/10 vẫn không có thiết bị; phần physical presentation/GPU allocation/pin chưa đo. Không stage QA/log/ảnh mới.
- Chủ dự án hỏi vì mới thấy cá: đã giải thích pilot cũ không phải rollout đầy đủ; thác/đom đóm/lá đã có, gợn sóng/cây lắc lư chưa thuộc scope chốt. Đang tăng nhận biết chỉ ở map (nước opacity0,20 trong ngân sách, đom đóm6px, lá sáng hơn), không tăng slot/nhịp hoặc mật độ trong game. Texture nước giữ cạnh tĩnh để chu kỳ32px nối khít; không bitmap mới. Preview hiện tại4194, ảnh/video chỉ ở runtime/qa.
- G4 kiểm chứng PC đã chốt: thêm3cặp120s với5target sau chỉnh hình/thanh cuộn đạt (p95+0,20ms,p99≈0,dispatch+0,60ms), layer+6 không vượt Light.100chu kỳ/20restart,soak Home/map/Triple10phút,75regression,29unit và16case dọc/90tổ hợp skin pass. Sprite fit toàn envelope sau xoay; ẩn scrollbar nhưng giữ wheel/cảm ứng. Source/fade lỗi fallback tĩnh, không retry sau popup. S22 vẫn thiếu; G5 review/check/build đang chốt. Không stage phần CONTEXT của task Sự kiện/Nhiệm vụ khác.
- G4 commit `c43e087`. G5 đã tự review diff riêng sau implementation,29unit/source-lock7nguồn/check/build và critical UI16pass/8skip qua3profile dọc đều exit0. Build thường không có QA probe, không API/save/gameplay/Firebase migration. Không nhận tự review là độc lập; không nhận PC/RAF là S22/GPU physical. Chưa có S22 thật/Android-native-ad/pin/nhiệt độ; ngang chủ dự án tự kiểm. Không APK/deploy/push/rules. Receipt chung là nguồn chi tiết, các ghi chú đang làm phía trên là lịch sử tiến độ.

## Quy tắc làm việc bổ sung —26/10/2026

Chỉ test/build khi thay đổi hoặc rủi ro cần đến, không tự deploy mỗi lượt. Commit theo phase hoàn chỉnh; loại file thử tạm/log/ảnh QA không cần thiết, giữ các kiểm thử hiện hữu cần cập nhật theo hành vi. Lượt gom commit lịch sử không bao gồm nền động đang làm.

## Popup Hồ sơ, UID và bỏ trang bị —26/10/2026

Chủ dự án yêu cầu ẩn scrollbar trong popup nhưng vẫn cuộn, tên hiện đủ/bút nhỏ không viền, chọn lại để bỏ avatar/khung/huy hiệu. Bổ sung ảnh mẫu bố cục và UID: đã chốt dùng UID Firebase hiện có, hiển thị6ký tự đầu…4cuối, copy toàn bộ; không cấp mã ngắn riêng.

Đã chỉnh accountPanel/profileCSS theo tên+bút, UID+copy, loại tài khoản; nút bút/copySVG14px không viền. Chỉ hiển thị UID khi state có uid, không tự tạoID từ profilelocal. Clipboard async giữ UID tại click, guard dispose/UID switch, có fallback khi API thiếu và thông báo lỗi tự nhiên. UID không ghi thêm vào save hoặc publicprojection.

Customization click món đang chọn ->null, click lại ->itemID, không mất kho/quà; model/save/publicprojection đã hỗ trợ null nên không đổi schema/rules. Focus giữ ở đúng item sau render. Scrollbar CSS chỉ áp popup/dialog và descendants, overflow không đổi.

UI9case đạt (4viewport, popup×5skin,30mountclosecycles, rename/UIDswitch, copyfull, nullsave/reload/reequip, scrollwheel/nested), thêm1casecopyfallback/permissionfailure đạt. npm run check đạt ở lần chạy lại (lần đầu benchmark Triple vượt ngưỡng, giữ log); không build/deploy lượt Hồ sơ theo quy tắc mới. KhôngAPK.

## Tinh chỉnh avatar, popup Màn và nhãn Bộ sưu tập —26/10/2026

Yêu cầu tiếp theo đã triển khai: avatar thành button52px không border/padding, portraitscale1.1 giữ nguyên hệ tọa độ avatar/khung/huy hiệu; bấm mở popup Hồ sơ hiện có trên map và game. Mỗi adapter cung cấp pauseForProfile theo cờ/scheduler pause cũ; chờ whenClosed rồi resume nếu scope còn active. Có guard startup/doubleopen/async owner. Không đổi save/API dữ liệu.

Popup đầu đợt nay Màn1-1/Màn2-1…, enter scale.86→1, giữ1.800ms, exit phóng tối đa1.5/fade500ms. Giới hạn zoom theo mép viewport và origin center top để không vượt vùng nhìn; reduced-motion tĩnh. Đã bỏ badge số1/10 khỏi nút Bộ sưu tập và các selector chỉ phục vụ badge.

Ba UI matrix avatar/profile/map/game (4viewport×5skin,20cycles), dừng countdown3giây và resume cả ba trò đạt;12case wave presentation/reduced-motion/cancellation đạt,6wave regression đạt. Check/build exit0, Hosting test đã cập nhật đúng main-Du3aOr0A.js. Smoke live bấm avatar mở/đóng Hồ sơ/không tooltip sót và không badge đạt. Bằng chứng receipt chung. KhôngAPK.

## Avatar trên thanh tên và gộp Màn-Đợt —26/10/2026

Yêu cầu UI: bỏ badge Đợt1/2 cạnh tên game; số HUD hiển thị1-1,9-2… dưới nhãn MÀN, giữ popup đầu đợt. Đã dùng formatWaveLevel cho cả ba adapter, metadata wave/session không đổi. Guide vẫn neo thanh tên để không che thao tác bàn. Avatar/khung/huy hiệu đang trang bị xuất hiện bên trái thanh tên trong game và bản đồ; landscape compact vẫn ẩn cùng thanh tên theo layout cũ. Không thêm thao tác bấm avatar.

Shared mountPlayerHeaderPortrait theo scope có1subscriber, chỉ thay DOM khi3ID trang bị đổi; unmount gỡ node/subscriber. Helper cosmeticPortrait chuyển sang profilePortrait.js và reexport ở profileCosmetics.js để giữ API cũ, không kéo luồng chỉnh ngoại hình vào shared shell. Không tạo ảnh mới/ghi save hoặc đổi quy tắc chơi.

Matrix mới ba trò×4viewport×5skin và20lần chuyển map/game mỗi trò đạt, scope cũ diagnostics về0. Sáu wave regression gồm1-2/reload/tiếp tục đạt, tổng9case trong scope đạt; check exit0. Suite13Triplelegacy launch quá sớm trả run/session null chưa đạt, giữ bằng chứng ngoài scope tại player-header-ui-final.log. Build exit0; Hosting test đã cập nhật và đọc lại đúng main-Cyh60Pko.js có avatar header. Bằng chứng chung receipt nhiệm vụ hiện có. KhôngAPK.

## Vé rơi như vật phẩm và chữ2,5giây —26/10/2026

Đã chốt chỉ chữ hiện giữa màn; vé dùng playLootDrop như năng lượng/vật phẩm, không central toast. Tỷ lệ vé5% từ nhóm đặc biệt không đổi, độc lập chữ. Renderer trước chỉ đọc outcome.letter nên vé cộng kho mà không thấy rơi; nay đọc ticket sau durable commit, iconSVG vé vàng/vòng quay dùng chung số dư Events. Guard active scope, cùng poolitem12/cleanup/reduced-motion cũ, không thêm write/schema/rules. Chữ tăng2.500ms; reduced-motion vẫn1.100ms. UI9/9 gồm ghép thật cả ba trò, vé/chữ cùng lúc,20scope cycles đạt; unit38/38,layout2/2,check/build/review đạt. Đã cập nhật Hosting test và đọc lại đúng bundle main-CDnLQn5r.js có vé rơi/chữ2500ms. Chi tiết receipt chung. KhôngAPK.

## Hiệu ứng nhận chữ trong màn chơi —26/10/2026

Phản hồi tiếp theo: bỏ preload sheet chữ khỏi trang chủ để không cảnh báo unused preload; CSS image-set tải khi dùng. Keyframes mới phóng nhẹ116% sau khi về giữa, sau đó thu nhỏ dần108%→85%→35% và fade;Chủ dự án yêu cầu tan chậm thêm: đã tăng tổng1.700→2.200ms, reduced-motion giữ tĩnh. UI3/3 và check tổng thể đạt trước khi tăng thời lượng; kiểm tra lại thời lượng và bằng chứng cuối theo receipt; kiểm tra lại UI3/3, syntax/build đạt; đã cập nhật web thử và đọc lại không preload chữ, đúng pulse116%/duration2200ms. Chi tiết/dao động benchmark trong receipt chung.


Chủ dự án yêu cầu sheet chữ và chữ rơi tại nhóm ghép, tự thu thập rồi hiện lớn giữa màn và tự ẩn. Đã chốt cộng kho ngay, không chạm nhặt/đổi luật rơi. Dùng skill imagegen tạo17glyph vàng–men xanh, source/prompt/crop tại `design/rewards-letters/drop/source.json`, atlas128/256px do `scripts/prepare-letter-drop-atlas.mjs` sinh. Renderer chung `js/liveops/letterDropFeedback.js` nhận callback sau durable commit từ ba trò; tối đa5entry, transform/opacity1.700ms, reduced-motion tĩnh1.100ms, scope cleanup hủy toàn bộ. Vị trí chỉ capture cho nhóm đặc biệt hợp lệ. Không đổi save/rules/kinh tế hoặc write cloud.

UI matrix mới15/15 đạt, gồm bốn viewport/hai motion/20scope, durable/dedup/aborted và ghép thật ba trò, wave regression. 25unit mục tiêu đạt; review độc lập không còn P1/P2 xác nhận. Check/build exit0, đã cập nhật https://memorymatch-test.web.app và đọc lại entry/bundle/atlas mới khớp build. Bằng chứng cuối trong receipt chung; chưaAPK. Kế hoạch hiện hành vẫn REWARDS_MISSIONS_EVENTS_PLAN.md, mục10 bổ sung acceptance.

## Bật web dùng Firebase thật —26/10/2026

Chủ dự án đã yêu cầu deploy rules và bật môi trường thật để thử web trước APK. Đã phát hành Firestore rules Spark/12ID mới lên memorymatchv1-1a và đọc lại khớp SHA256662edab10b2cbfb626c60c32931ed0009a82e40ca6a398e90e0a8136263a2f7a. Bật VITE_LIVEOPS_ENABLED=1 trong .env.local, giữ public expansion=1; build thành công, Hosting test đã phát hành tại https://memorymatch-test.web.app. Production/beta Hosting không đổi; không Functions/billing/push/APK. Smoke trên URL đã phát hành PASS: tải nhiệm vụ/chữ, quay free thật ở guest mới, reload giữ quota; cần Tải lại tiến độ nếu mở modal trước khi tài khoản kết nối. Bằng chứng live trong receipt chung. Các câu production tắt/chưa deploy bên dưới là trạng thái trước quyền bổ sung này.

## Spark và sưu tập chữ — kết quả hiện hành

- Kế hoạch duy nhất: `REWARDS_MISSIONS_EVENTS_PLAN.md`. Toàn bộ S0–S5 đã được giao; implementation và nghiệm thu source/web/emulator đã hoàn tất; bằng chứng trong receipt chung `REWARDS_MISSIONS_EVENTS_IMPLEMENTATION_RECEIPT.md`. Các đoạn bên dưới là lịch sử, không dùng phục hồi Functions/SSV hoặc quà100điểm.
- Đã đủ quyết định sản phẩm: MEMORY MATCH/LINK CONNECT/TRIPLE CONNECT/ADVENTURE cùng kho chữ và toàn bộ12món riêng (4avatar/4khung/4huy hiệu); mỗi lần đổi tiêu công thức nhận1món chưa có, hết12món nhận rương10.000Xu. Không lấy quà Thành tích. Chọn món theo catalog ổn định, xem trước trước đổi. Mỹ thuật rừng/ký ức, đèn lồng, pha lê, hoàng gia đã duyệt.
- Trial100% rơi1chữ/nhóm đặc biệt ở mọi trò, chọn đều bảng chữ chung;20% chỉ dự kiến. Vé5% độc lập, nhận ngay kể cả thua. Kho không hết hạn.2M+1A hiển thị `M-M--- -A---`; bán1chữ1.000Xu, ghép3chữ giống nhau ra1chữ đều, có thể trùng. Đổi nhiều lần, đồ sở hữu vĩnh viễn.
- Nhiệm vụ reset07:00ngày/thứHai tuần; giữ Xu/bonus1vé ngày+2vé tuần, điểm danh7ô. Mốc Xu tuần20/50/80→5/10/10 chuyển vào Nhiệm vụ; điểm reset tuần, không cấp đồ ở100. Free1/ad earned10/ngày chung tài khoản; vé dùng riêng không cap. Các bảng thưởng Xu cũ giữ nguyên.
- Auth+Firestore, một private state và root snapshot cùng CAS transaction, queue account/persistence dùng chung. Không Functions/SSV hoặc collection từng ván. Pending/RNG bền, chữ sync tối đa4loại/publication; retry/restore/UID/chuyển ngày có guard. Backup Spark phải đối chiếu canonical trước hydrate, không hoàn Xu đã tiêu. Giữ save key/formatVersion2/API legacy; thêm optionalfields có normalizer và12ID được duyệt.
- Đã đạt38unit, emulator matrix,15web(account/liveops/ba trò),2layout/lifecycle(4viewport×5skin,20chu kỳ), alpha1.521cặp, assetbudget dưới24MiB, build. Review độc lập không thấy P1/P2. Check tổng thể và build exit0; chi tiết/giới hạn theo receipt; không dùng kết quả lịch sử thay bằng chứng mới.
- Production vẫn tắt, rules và12ID mới chưa deploy, khôngAPK/push/Hosting/billing. Native ad provider/điện thoại/live hai thiết bị chưa kiểm. Rules public đã deploy ở task trước không chứng nhận12ID mới. Không còn câu hỏi sản phẩm chờ.

## Lịch sử trước kết quả Spark hiện hành

## Nghiệm thu Nhiệm vụ/Sự kiện và rules — 25/10/2026

- Giữ P0/mẫu đã duyệt theo xác nhận trực tiếp trong lượt này. Đã tiếp quản65source, chạy lại pack/alpha1.225/1.225cặp; catalog90 +2event +3cơ bản, giữ30mapping/receipt/sáu effect/300Xu. Source/generator/backfill/acquisition/public ID và phân trang đã triển khai. Receipt duy nhất: `REWARDS_MISSIONS_EVENTS_IMPLEMENTATION_RECEIPT.md`.
- Đã có policy/callable transaction, ledger ví/receipt, facts ba adapter sau settlement, nhiệm vụ/điểm danh, vòng quay/rewarded/SSV và pilot chưa có lịch. Giao diện qua owner/dock hiện có, không PNG cả trang. Avatar Hồ sơ104–116px, BXH56px; đồ cơ bản ở đầu từng nhóm theo yêu cầu bổ sung. Không tự trang bị lại đồ của save cũ.
- Unit/contract36/36, art/page/profile8/8 (bốn viewport/năm skin/20chu kỳ), regression ba trò/BXH22case đã có kết quả đạt sau chạy lại ba bài;30chu kỳ BXH giữ node364/listener26. Emulator hai tài khoản/two-device quota/round dedup và browser quay/ngắt/reload/reduced-motion đạt. Decode ước tính15.812.384B dưới24MiB; không tuyên bố60FPSđiện thoại thật. Chi tiết/log/giới hạn trong receipt.
- Chủ dự án đã cho phép **riêng deploy rules**: đã phát hành lên `memorymatchv1-1a`, đọc lại source live khớp SHA256 `20193fd2962846639c7d1403260676fb93bc8df099ff47dce113e1f3c2eef364`, ruleset `86ce11fd-9f35-4b4b-8317-885363665cc4`. Đã bật ID public mới bằng `VITE_REWARDS_PUBLIC_EXPANSION_ENABLED=1` trong `.env.local`. Reload web để gửi lại đồ đang trang bị; chưa kiểm hai người chơi live sau deploy.
- **Chưa được deploy Functions/Hosting/APK/push.** Liveops mặc định không gọi Function chưa phát hành (đã sửa nguyên nhân CORS trong log người dùng). Emulator tự bật; chỉ bật `VITE_LIVEOPS_ENABLED=1` sau phát hành backend được duyệt riêng. Rewarded thật còn cần ad unit/SSV cấu hình; web không provider không giả thưởng. Pilot không tự bắt đầu/countdown. Native provider, cloud hai thiết bị live và điện thoại thật chưa xác minh.
- Tự review diff riêng, không nhận review từ agent độc lập. Không sửa quyền/ignore, không stage/commit hoặc ghi đè thay đổi cân bằng của công việc khác. Những trạng thái “A1 đang làm/chưa runtime/chưa deploy rules” bên dưới là lịch sử trước nghiệm thu và quyền bổ sung.
- Cổng cuối sau mọi sửa recovery/outbox: `npm run check` và `npm run build` exit0; generated server policy khớp source, catalog regenerate không đổi hash, diff whitespace đạt. Rules đã deploy không kèm backend/Hosting.

## Tiếp tục Nhiệm vụ/Sự kiện — 25/10/2026

- Chủ dự án xác nhận giữ phê duyệt P0 và mẫu đại diện trong receipt24/10, giao tiếp tục toàn bộ A1–Q2, gồm ba đồ hồ sơ cơ bản và matrix1.225cặp. Kế hoạch hiện hành duy nhất: `REWARDS_MISSIONS_EVENTS_PLAN.md`; nguồn đã duyệt ở `design/rewards-liveops/approval.json`, `catalog.source.json`, `liveops.source.json`. Các đoạn “chỉ chuẩn bị/chờ P0” bên dưới là lịch sử.
- A1 đã có65nguồn riêng (60thành tích+2event+3cơ bản), pack và kiểm1.225/1.225cặp alpha đạt; đang nghiệm thu hình/renderer. A2–Q2 chưa nghiệm thu. Receipt chung: `REWARDS_MISSIONS_EVENTS_IMPLEMENTATION_RECEIPT.md`. Không APK/push/Hosting/backend/rules deploy; giữ các thay đổi cân bằng/gameplay đồng thời ngoài phạm vi.

- 24/10 — Link Đóng băng: nhãn/số đồng hồ dùng xanh đậm #06344d trên lớp băng được làm sáng đều để giữ tương phản; selector trực tiếp giữ màu rõ cả khi timer-warning hoặc đổi skin. Chỉ sửa CSS tại styles/link-connect.css, không đổi timing/lifecycle/save. Kiểm tra ownership CSS đạt; chưa kiểm lại giao diện browser, không build/APK.

## Điều chỉnh cân bằng bổ sung — 24/10/2026 (đã cập nhật dữ liệu)

- Thử thách theo kích thước bàn: chọn độ khó nhỏ nhất chứa đủ số thẻ, dùng mốc Memory75/110/150/220s hoặc Link/Triple60/90/120/180s mỗi đợt, giữ giờ dư. Ngưỡng Memory/Link12/24/36/60thẻ, Triple27/54/78/120thẻ; trên ngưỡng lớn nhất dùng Siêu khó. Nguồn `calculateChallengeWaveTime` trong `js/progression/waveTiming.js`; phiên cũ giữ ngân sách đã cấp. Thay quyết định Thử thách không đổi của lượt trước bên dưới.
- Vật phẩm tăng giờ mới chỉ còn30/45/60s ở Memory; Triple dùng30s. Bỏ gói10s khỏi cửa hàng và nguồn thưởng Memory mới; mốc thưởng từng cấp10s chuyển sang30s. Giữ key `time10` của kho cũ nhưng mỗi món dùng được30s, chỉ hiện lựa chọn này khi còn tồn kho, không chuyển/xóa số lượng. Không đổi schema/save/catalog ID còn dùng. Xem trước5s, Gợi ý2,5s và các khoản cộng giờ trực tiếp từ thẻ may mắn/Phá Băng/combo giữ nguyên vì không phải vật phẩm tăng giờ trong kho.
- Giá chỉ vật phẩm tiêu hao của cả ba trò: `round(giá gốc × 8 × 90 / 100)` Xu, làm tròn một lần đến Xu nguyên. `CONSUMABLE_PRICE_MULTIPLIER=8` là hệ số gốc, `CONSUMABLE_DISCOUNT_PERCENT=10` là mức giảm; không giảm lần nữa ở UI/giao dịch. Nguồn `calculateConsumablePrice`, `SHOP_ITEMS`, `TIME_ITEM_PRICES` trong `js/shopCatalog.js`. Không đổi giá chủ đề, ngoại hình, hiệu ứng, mở rộng khay hay thưởng Xu.
- Giá hiện hành Memory: +30s360/+45s504/+60s648; Gợi ý1/2/3/5lượt58/108/151/216; Xem trước4/8/12/tất cả58/108/158/216Xu. Link: Gợi ý58/Xáo108/Sấm sét180/Đóng băng30s288Xu. Đóng băng tăng15→30s nên giá gốc tăng theo tỷ lệ2 rồi giảm10% (`160×2×0,9=288`). Triple: Gợi ý58/+30s360/Hoàn tác108/Xáo108Xu; giá30s lấy trực tiếp bảng chung, `timePerSecond=12` là đơn giá suy ra từ gói30s, không áp lại giảm10%.
- Popup thua Memory/Link bán30s360Xu và60s648Xu, cùng giá cửa hàng; Triple chưa có mua giờ khi thua và chủ dự án chốt chưa bổ sung. Khác biệt còn giữ: cộng giờ trực tiếp từ may mắn/Phá Băng có thể dưới30s, thời gian Xem trước/Gợi ý khác tác dụng tăng giờ, từng game có danh sách công cụ riêng. Không tự đồng nhất các phần này.
- Đã đối chiếu source/diff và cập nhật các kỳ vọng dữ liệu liên quan trong kiểm thử hiện hữu; **không chạy build/check/test** theo yêu cầu. Kết quả kiểm thử của lượt trước bên dưới không chứng nhận lần sửa dữ liệu này. Không APK/deploy. Skill làm rõ yêu cầu đã giúp chốt cách tính Thử thách, phạm vi vật phẩm và giảm giá; không còn quyết định chờ ở lượt cân bằng này.

## Cập nhật thời gian mỗi đợt — 24/10/2026

- Chủ dự án chốt Dễ/Trung bình/Khó/Siêu khó: Memory Match **75/110/150/220 giây**; Link Connect và Triple Connect **60/90/120/180 giây**. Mỗi đợt được cấp đúng mốc này, giữ thời gian dư; Thử thách/Vô tận không đổi.
- Nguồn chung `js/progression/waveTiming.js`, dùng cho runtime, preview và ba config. Phiên cũ giữ nguyên thời gian đã cấp/còn lại, nhận mốc mới từ đợt sau; validator chỉ chấp nhận tổng ngân sách cũ/mới hợp lệ, không đổi schema/key/rulesVersion/API hiện hữu.
- Nghiệm thu web: `npm run check` và `npm run build` đạt; 23/23 unit/contract, 6/6 Playwright desktop (12 tổ hợp trò/độ khó và ba lượt hoàn tất nhiều đợt; Memory/Link tải lại giữa đợt). Log tại `runtime/qa/wave-timing-{unit,check,build,ui-final}.log`; tự review diff riêng, chưa kiểm điện thoại thật, không APK/deploy. Skill làm rõ yêu cầu đã giúp chốt mốc Memory và phạm vi mỗi đợt; nguồn chung được chọn thay cho sửa riêng bảng cũ vốn không điều khiển giờ runtime.

## Kế hoạch đề xuất mới: mở rộng quà, Nhiệm vụ và Sự kiện

- Nguồn hiện hành của yêu cầu mới: [REWARDS_MISSIONS_EVENTS_PLAN.md](REWARDS_MISSIONS_EVENTS_PLAN.md). Lượt này chỉ đánh giá, lập kế hoạch và tạo hai concept; chưa sửa game/save/quảng cáo/rules. Cổ tích D0–Q1 bên dưới đã hoàn tất, không mở lại.
- Đề xuất màn11–30 mỗi trò: thêm60quà riêng (24avatar/24khung/12huy hiệu), tổng90thành tích; giữ30quà/sáu effect/rương/300Xu hiện có. Danh sách đủ tên, ID, level, brief tại `docs/design/rewards-liveops/expansion-catalog.proposal.json`;60sprite mới chưa vẽ.
- Chủ dự án đã chốt vòng quay1lượt miễn phí/ngày+1lượt quảng cáo tùy chọn/ngày. Đề xuất điểm danh/nhiệm vụ/vòng quay dùng chung tài khoản, event7ngày và hai quà event riêng. MứcXu, clock/backend, bảng60món và mỹ thuật còn để duyệt trước triển khai; không suy từ số trong concept thành kinh tế đã chốt.
- Hai ảnh chọn: `docs/design/rewards-liveops/review-v1/01-missions-daily-login-v2.png` và `02-events-wheel.png`. [Review/kiểm tra](docs/design/rewards-liveops/REVIEW_AND_PREPARATION.md), [prompt bàn giao](docs/design/rewards-liveops/IMPLEMENTATION_PROMPT.md). Đã chạy lại8unit/contract đạt; kiểm60mapping và ngân sách đề xuất đạt. Không nhận đã chạy lại toàn bộ web hoặc kiểm điện thoại/live.

## Triển khai Cổ tích và Thành tích — 23/10/2026

- Đã giao toàn bộ D0–Q1 trong `ILLUSTRATED_UI_ACHIEVEMENTS_PLAN.md`, commit từng phase; receipt chung: `STORYBOOK_IMPLEMENTATION_RECEIPT.md`. Các giới hạn chỉ chuẩn bị bên dưới là lịch sử của lượt trước.
- D0 đã duyệt 30 quà/thứ tự/hình, giữ 300 Xu và receipt cũ; sau màn 10 tiếp tục chơi nhưng chưa có quà mới. Duyệt Cổ tích/storybook, font miễn phí đủ dấu Việt, bản ghép thật 412×915 phải duyệt trước rollout.
- Bổ sung trực tiếp: avatar/khung/huy hiệu đang trang bị phải công khai trên BXH, đồng bộ khi lưu Hồ sơ; không thay điểm hay thứ tự xếp hạng. Thay quyết định cục bộ ban đầu. Đã duyệt triển khai riêng Firestore rules; chưa cho phép publish Hosting/APK/push.
- D0/D1/D2/S1/S2/F1/F2/F3 đã commit riêng; baseline có sẵn đã được chủ dự án cho phép commit riêng `3aaf0e7`. D2 ba bản ghép đã duyệt. F3: `14f20fc`, đủ Hồ sơ/Thành tích/sáu motion/public sync; Q1 code/web check/build và kiểm thử đạt, receipt chung ghi bằng chứng và giới hạn.
- Public sync đã qua hai tài khoản Auth/Firestore emulator, offline→online, quyền owner/private, rank bất biến. Q1 commit `5e1c22b`. Chủ dự án duyệt riêng Firestore rules; đã phát hành lên `memorymatchv1-1a` và đọc lại ruleset đang hoạt động, source khớp SHA256 `290cf190d6958ca19256d01dfe7eb879f9622a66ba1b16d0b30d944c1ee9d35a`. Không publish Hosting/APK/push; chưa kiểm end-to-end người chơi live trên web mới. Phạm vi code/nghiệm thu/rules đã hoàn tất. Các mục chuẩn bị/chờ duyệt bên dưới là lịch sử trước lượt triển khai này.

## Kế hoạch mới: Cổ tích và Thành tích — chuẩn bị23/10/2026

- Nguồn hiện hành của yêu cầu mới: [ILLUSTRATED_UI_ACHIEVEMENTS_PLAN.md](ILLUSTRATED_UI_ACHIEVEMENTS_PLAN.md). Lượt này **chỉ lập kế hoạch và vẽ bộ thưởng**, chưa thêm skin/runtime hoặc thay save. Giao diện mới đề xuất Cổ tích/storybook cạnh4skin đang có; mục tiêu dùng artwork đa lớp và slot chữ thật để sát mẫu, không chỉ đổi màu hộp CSS cũ. Các nghiệm thu UI trước vẫn là lịch sử, không thay acceptance mới.
- Mỗi trò×màn đủ4độkhó lầnđầu nhận riêng một lần. Quà tự lưu; summary→thẻ thưởng chỉTiếp tục→đích đãchọn, không Nhậnquà/Dùngngay. Avatar/frame/badge qua chạmavatar trongHồsơ; ngoại hình/effect trongBộsưutập đúngtrò. Giữ rương, dữliệu/300Xuđãnhận và chỉ hướngdẫn nơi tìmquà lầnđầu; policy300Xu khi thaybộtranh cầnchốt trước migration.
- Chủ dự án chốt **10màn mỗi trò —30thành tích**, đã chuẩn bị30ảnh rời tại `docs/design/achievements/art-kit-v1`:9avatar/9frame/6badge/6coverhiệuứng; nguồn riêng, WebP512/256/128 vàmetadata ghéplớp. [Bảng quà](docs/design/achievements/REWARD_CATALOG.md) và `reward-distribution.json` gán một món cho mỗi màn1–10 riêng từng trò; mỹ thuật/thứtự gán còn đểduyệt. Previewcover chưa là effectmotion, chrome toànapp còn gateD1–D2; policy sau màn10/300Xu cũ cầnchốt trước phần phụthuộc. [Prompt agent](docs/design/achievements/IMPLEMENTATION_PROMPT.md), [slotdraft](docs/design/achievements/layout-contract.draft.json), [copyngườichơi](docs/design/achievements/player-copy.vi.json).

## Bổ sung tải nền lúc khởi động

- Bootstrap đã warm/decode ba nền Memory/Link/Triple theo chiều màn hình trong loading, dùng cache/owner navigation hiện hữu. Chờ tối đa8giây; lỗi/hủy không khóa startup và được retry, không tải cả sáu bản dọc/ngang. Không đổi gameplay/save/skin.
- Browser7/7 (320/412/844, ba trò vào ngay, decode pending, lỗi/timeout/abort/retry); `npm run check` và `npm run build` exit0. Check đầu vấp benchmark Triple khi chạy đồng thời đã giữ log và chạy riêng đạt, không sửa ngưỡng. Bằng chứng chung: `docs/design/advanced-ui/IMPLEMENTATION.md`, mục bổ sung tải nền; log/output `runtime/qa/startup-backgrounds-*`. Chưa đo điện thoại thật, không APK/commit/deploy.

## Tích hợp hai giao diện — hoàn tất phạm vi web I0–I5, 22/10/2026

- Theo yêu cầu tích hợp mới, Cài đặt có bốn lựa chọn: Mặc định/default, Nâng cao/woodland, Giấy cắt nhiều lớp/papercut, Phi thuyền vũ trụ/starship. Mở rộng owner hiện hữu, giữ key/schema save, geometry, ván đang chơi, luật và kinh tế; summary không thêm lại EXP/rương/mảnh.
- Kế hoạch tích hợp: [PLAN.md](docs/design/ui-style-expansion/PLAN.md). Receipt duy nhất của lượt: [IMPLEMENTATION.md](docs/design/ui-style-expansion/IMPLEMENTATION.md), có kết quả loader/save/lifecycle/coverage, ảnh game thật và giới hạn hiệu suất. Phần chuẩn bị tài nguyên dưới đây là lịch sử trước khi được giao tích hợp, không còn là lệnh cấm runtime của lượt hiện tại.
- Nguồn kit docs bị ignore; runtime chỉ mang 52WebP+66SVG mỗi bộ trong public, không atlas/source/QA. Generator `scripts/generate-ui-style-packs.mjs` chạy riêng khi có đúng kit nguồn. Không sửa ignore/force-add; không stage/commit/APK/push/deploy.
- Kiểm tra web có baseline rect, 3game khi đổi skin, 6bài hướng dẫn, natural Memory wins, reward ledger/thu thập, lỗi/hủy/cache và bản build. Check/build đạt. Chưa đo FPS/GPU trên điện thoại thật; sample cold mixed có long task53ms, đã lưu đúng giới hạn trong receipt. Review là tự review riêng theo AGENT_PROMPT, không nhận là review độc lập.

## Hai bộ giao diện bổ sung — tài nguyên và kế hoạch22/10/2026

- Chủ dự án chốt **Giấy cắt nhiều lớp** (`papercut`) và **Phi thuyền vũ trụ** (`starship`), **chỉ tạo tài nguyên + kế hoạch, tích hợp sau**. Nguồn duy nhất của phần chuẩn bị mới: [PLAN.md](docs/design/ui-style-expansion/PLAN.md); tài nguyên/manifest/preview/prompt agent nằm cùng thư mục `docs/design/ui-style-expansion`. Không tự thêm vào Cài đặt hoặc sửa runtime trong lượt tài nguyên.
- Kiểm kê:2skin runtime default/woodland;0bộ toàn app hoàn chỉnh khác sẵn nhưng chưa áp dụng. Ngọc Lam52ID là ứng viên đã bị loại, Woodland14ID là pilot lịch sử; các nhóm art theo màn không là skin độc lập. Hai bộ mới mỗi bộ52bitmap+66vector, cùng ID/frame; xem README và kết quả kiểm tra của kit, không nhận kit là skin game đã nghiệm thu.
- Chủ dự án chốt thêm: khi geometry/owner của skin đầu đã đúng, bộ ảnh sau giữ contract chỉ cần kiểm kích thước/cắt/alpha và xem nhanh thành phần tiêu biểu. Không chạy lại toàn bộ game cho mỗi skin; mở rộng regression chỉ theo loader/save/CSS/lifecycle hoặc tải/animation thực sự thay đổi. Gate I0–I5 dành cho lượt tích hợp được giao sau, chưa thực hiện runtime. Giữ luật, save/API, hình mặt thẻ, tranh và kinh tế hiện hành.

## Kế hoạch hiện hành: nhập môn, câu chữ và phần thưởng — 22/10/2026

- Bổ sung tranh thực hiện sau: [COLLECTION_ART_ADDENDUM.md](docs/design/collection-art/COLLECTION_ART_ADDENDUM.md). Sau lần tạm dừng, chủ dự án cho phép tạo đúng3ảnh nữ châu Á trưởng thành18tuổi để đủ10ảnh dùng chung tính cả3legacy+7mới; ảnh mới lưu ở docs/design/collection-art/review-v1, không thay3ảnh public hoặc catalog hiện tại. Hướng mới: phong cảnh lãng mạn, nhân vật nữ trưởng thành. Lưu ý modulo theo length hiện tại có thể đổi tranh cũ nếu chỉ append catalog; phải giữ mapping/quyền sở hữu khi tích hợp sau. Đủ tài nguyên dùng thử không đồng nghĩa đã duyệt mỹ thuật cuối hoặc tích hợp runtime.

- Nguồn thực thi hiện hành duy nhất cho yêu cầu UX mới: [UI_UX_ONBOARDING_REWARDS_PLAN.md](UI_UX_ONBOARDING_REWARDS_PLAN.md), R0–R8 đã triển khai và nghiệm thu phạm vi web; giới hạn và bằng chứng mới ở hồ sơ bên dưới. [Prompt bàn giao](docs/design/advanced-ui/ONBOARDING_REWARDS_AGENT_PROMPT.md).
- Chủ dự án yêu cầu nhập môn tự động lần đầu ba trò, bàn tay từng bước, sửa phản hồi nối sai/bàn trống, rà câu chữ toàn app; popup thắng bỏ EXP/rương/mảnh, tiến trình về bản đồ/Kho báu và Bộ sưu tập. Giữ kinh tế, transaction và dữ liệu cũ; tranh hiện có chưa chốt mỹ thuật. Hoạt ảnh cảnh nền bản đồ tạm ngoài phạm vi.
- Kết quả thực hiện22/10: ba trò có first-play/replay cùng bài, một bàn tay SVG đúng thao tác; Link giữ hình sau match và có đường/điểm chặn. Summary chỉ kết quả+Bản đồ/Chơi tiếp; tiến trình về map/Kho báu, bộ tranh có mảnh thiếu/đường chơi hợp lệ/300Xu một lần/xem lại. Chặn nút nhận thưởng của hồ sơ cũ và mở đúng bộ theo cụm bản đồ đang xem. Giữ luật, kinh tế, transaction, save key/formatVersion; chỉ mở rộng tương thích skipped trong tutorialProgress version1.
- Hồ sơ mới: [IMPLEMENTATION.md](docs/design/advanced-ui/IMPLEMENTATION.md), phần R0–R8 và `runtime/qa/ONBOARDING_REWARDS_SUMMARY.json`.32profile/2016state có bằng chứng mới (lượt đầu31/32, profile carousel còn thiếu chạy lại3/3 theo điều khiển chọn trò rồi thẻ giữa);16profile bài,6thắng thật,8thua thật, lỗi/lifecycle/200cleanup và đo cùng build. Sau sửa range,19source và12compiled closure đạt; check/build cuối exit0. Không nhận mọi lượt click thẻ ngoài tâm đều đã được chứng minh; giữ lỗi đầu và trace trong hồ sơ.
- Review cuối là tự review riêng, không nhận review độc lập. Mỹ thuật tranh chưa chốt, runtime giữ ba tranh cũ/mapping; nhánh collection-art review không tích hợp trong task UX này. Chưa xác nhận FPS điện thoại thật, keyboard Android thật hoặc Google OAuth/Firebase live. Không stage/commit, APK/push/deploy, server trùng hoặc sửa quyền; giữ công việc đồng thời của các agent khác.
- G0–G10 UI cũ là nền tảng đã triển khai, không đại diện acceptance UX mới; ghi R0–R8 vào cùng `docs/design/advanced-ui/IMPLEMENTATION.md`. Bằng chứng trực tiếp lần đánh giá: Link→Cài đặt→Hướng dẫn→Tập luyện thiếu pointer ở hai bước đầu, sau nối đúng chỉ còn path, nối bị chặn chỉ hiện chữ. Không tự mở lại toàn bộ skin hoặc task effect/âm thanh của agent khác.

## Nghiệm thu giao diện toàn dự án — 22/10/2026

- GAME_UX_SKIN_PLAN.md G0–G10 đạt phạm vi web; trạng thái cũ phía dưới giữ làm lịch sử. Hồ sơ duy nhất: docs/design/advanced-ui/IMPLEMENTATION.md, phần G10 và runtime/qa/G10_SUMMARY.json.
- Đã ghép gỗ/giấy trên toàn ứng dụng, giữ Mặc định/Nâng cao; ba bài tập có bàn tay SVG tại Cài đặt→Hướng dẫn→Tập luyện. EXP/bốn rương/tranh giữ transaction và kinh tế hiện hữu.
- Production32/32 (1920state,3trò/2skin/4viewport/2motion/DPR2–3), hồ sơ8/8, offline1/1, mua thật2/2, đo4/4, thua thật8/8; check/build pass và review độc lập đã đóng P2 race lưu skin. Không xác nhận FPS điện thoại thật hoặc Google OAuth/Firebase live.
- Không APK/push/deploy hoặc server trùng; các thay đổi đồng thời của công việc khác được giữ ngoài commit UI.

## Thao tác liên tiếp — phase sửa 21–22/10/2026

- Phạm vi chủ dự án giới hạn: kết thúc phase đang sửa, kiểm tra lỗi thẻ cũ chưa xóa mà thẻ mới đã dồn vào; không mở phase giao diện khác. Link bàn đứng yên nhận lượt mới sau commit, hiệu ứng dùng bản sao không tương tác; bàn dồn/tự xáo và kết thúc đợt giữ thẻ gốc chạy xóa rồi mới thay vị trí. Memory giải phóng lựa chọn ngay sau commit, bỏ ghi lặp và không khóa toàn bàn trong hiệu ứng úp cặp sai. Triple chỉ kiểm chứng trong phase này.
- 37 ca hành vi đạt, build web đạt; kiểm tra tổng cuối vướng câu chữ `UI_COPY.timeUpPrompt` do thay đổi ngoài phase. Ngân sách đường nối 3ms chưa đạt ổn định: đối chiếu xen kẽ bộ xóa cũ/mới có p95 3,7/3,5ms. Không đánh dấu hiệu năng toàn dự án đạt. Chi tiết, ownership và giới hạn tại `docs/qa/technical-improvement/RECEIPT.md`, mục phase 21–22/10. Không commit, APK, deploy hoặc sửa thay đổi của agent khác.

## Thực hiện giao diện toàn dự án — 21/10/2026

- Chủ dự án giao thực hiện `GAME_UX_SKIN_PLAN.md`, commit từng phase. G0 đã đối chiếu owner/call site và token; hồ sơ duy nhất tại `docs/design/advanced-ui/IMPLEMENTATION.md`, inventory 128 call site tại `inventory.json` (source inventory, không phải branch coverage).
- G1 đang dựng bản ghép các màn thật, chưa tích hợp runtime. `docs/design/advanced-ui/woodland/README.md` yêu cầu G1 được duyệt trước tích hợp; bộ popup thắng cũ không thay cho duyệt toàn bộ màn. G2–G10 chưa đạt.
- Trong lượt làm xuất hiện thay đổi ngoài task ở `js/config.js`, `js/memoryMatch/pairRewards.js`, `js/ui.js`; giữ nguyên và không đưa chúng vào commit giao diện.

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

## Triển khai Sự kiện/Nhiệm vụ/Kho rương — 27/10/2026

- Nguồn active: EVENTS_MOBILE_FESTIVAL_PLAN.md, giao toàn bộ P0–Q1 và commit từng phase. Chủ dự án đã duyệt toàn bộ đề xuất còn lại P0 trong chat: 50/100 Xu, subpool chia đều, đầy 999 giữ candidate, pool Thành tích/chữ/event bỏ starter/effect, loại rương chữ lặp 12 slot, trong ván chỉ xem, SVG tĩnh khu vườn đêm. Receipt chung EVENTS_MOBILE_FESTIVAL_RECEIPT.md. Các đoạn chỉ lập kế hoạch ở trên là lịch sử; không tự deploy/rules live/APK/push và không trộn task thẻ đặc biệt.

