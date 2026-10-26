# Giao diện Cổ tích và phần thưởng Thành tích

> Trạng thái hiện hành: D0–Q1 đã triển khai và nghiệm thu theo [STORYBOOK_IMPLEMENTATION_RECEIPT.md](STORYBOOK_IMPLEMENTATION_RECEIPT.md). Các đoạn “chờ duyệt/chỉ chuẩn bị” bên dưới ghi lịch sử lúc lập kế hoạch. Yêu cầu mới về màn11–30, Nhiệm vụ và Sự kiện dùng [REWARDS_MISSIONS_EVENTS_PLAN.md](REWARDS_MISSIONS_EVENTS_PLAN.md); không thực hiện lại các gate cũ.

Ngày23/10/2026. **Nguồn kế hoạch hiện hành cho yêu cầu này.** Phạm vi lượt chuẩn bị: phân tích, thiết kế hợp đồng giao diện, vẽ/đóng gói bộ thưởng để duyệt, viết kế hoạch và prompt tích hợp. **Không triển khai runtime trong lượt chuẩn bị.** Không mở lại các kế hoạch UI/runtime đã hoàn tất.

## 1. Mục tiêu và quyết định đã chốt

- Thêm giao diện bám sát ba mẫu được chủ dự án đánh giá tốt: `docs/design/achievements/review-v1/01-victory-achievement.png`, `02-profile-customization-v2.png`, `03-achievements-effect-collection-v2.png`.
- Tên đề xuất cho lựa chọn mới: **Cổ tích**, ID `storybook`. Giữ Mặc định/default, Nâng cao/woodland, Giấy cắt nhiều lớp/papercut, Phi thuyền vũ trụ/starship. Không thay artwork hoặc ép đổi lựa chọn đang dùng của người chơi.
- Bố cục có chiều sâu bằng artwork: gỗ chạm, giấy kem, ribbon đỏ, nút xanh/cam, icon minh họa, viền vàng và trang trí lá. Đồ cá nhân hóa giữ bản sắc khi đổi skin; chrome popup/nút theo skin đang chọn.
- Mỗi **trò×màn** hoàn thành đủ bốn độ khó lần đầu là một thành tích và nhận quà một lần. Không cộng thành một lộ trình thưởng chung của ba trò. Không lấy ba sao làm điều kiện thay thế cho chứng nhận đã thắng.
- Chủ dự án chốt bộ đầu **10 màn mỗi trò, tổng 30 thành tích riêng**. Mỗi màn có một món được chỉ định; bộ đầu gồm 9 avatar, 9 khung viền, 6 huy hiệu và 6 mẫu hiệu ứng. Số lượng đã chốt; tên/mỹ thuật và thứ tự món trong bảng phân phối là đề xuất để duyệt.
- Quà tự lưu vào kho trước presentation. ThắngS làm đủ điều kiện → popup chiến thắng hiện hữu → sau khi người chơi đóng/chọn đích đến, popup thưởng thành tích → **Tiếp tục** → đến đích đã chọn. Không có Nhận quà/Dùng ngay, không tự trang bị.
- Avatar/khung/huy hiệu mở qua **Hồ sơ → chạm avatar → popup Trang trí hồ sơ**, ba nhóm và một preview. Hiệu ứng/ngoại hình vào Bộ sưu tập đúng trò. Thay mục Tranh bằng Thành tích, không thêm màn xem tranh mới.
- Chỉ hướng dẫn nơi tìm quà ở lần đầu theo nhóm; không hiển thị lời hướng dẫn phát triển trên giao diện.
- Rương mốc C/B/A/S giữ nguyên cơ chế, tiền/thưởng/receipt. Không đưa EXP/rương/mảnh trở lại popup thắng.

## 2. Hiện trạng đã đối chiếu code

| Owner | Hiện trạng | Hệ quả thiết kế |
|---|---|---|
| `js/uiSkinController.js`, `uiSkinRegistry.js`, `uiSkin.js` |4skin, loader có abort/generation/queue và cache | Mở rộng registry/pack hiện hữu, không tạo skin manager thứ hai |
| `styles/ui-skin-woodland.css` | Nút có ảnh nhưng nhiều header/modal/tab/input/inset vẫn CSS gradient/solid/radius | Chỉ thêm ảnh nền sẽ chưa giống mẫu; cần phân lớp chrome và slot nội dung |
| `styles/ui-style-packs.css` | Hai bộ mới ưu tiên giữ nguyên geometry cũ và thay vật liệu | Không dùng cách đổi màu/viền cũ làm chuẩn mỹ thuật của Cổ tích |
| `js/modal.js`, `dialogPlacement.js` | Owner chung cho focus, pause, banner, close/submit và placement | Thêm presentation adapter/skin parts qua owner, không mở popup bằng DOM overlay rời |
| `js/ui.js` showLevelSummaryOverlay | Một nguồn popup thắng chung, có continuation guard | Nối chuỗi thưởng sau summary bằng callback/queue có owner, không dùng sleep/timeout đoán thời điểm |
| `logic.js`, `linkController.js`, `tripleController.js` | Mỗi trò commit thắng qua persistence | Tính transition thành tích trong settlement trước save; presentation chỉ đọc receipt |
| `progression/difficultyProgress.js` | `hasCertifiedCompletion`, bốn mode, `fragmentLevels` đang biểu diễn màn đã làm chủ | Tái sử dụng điều kiện thuần; không lấy DOM hoặc suy từS/điểm/sao |
| `progression/masteryCollection.js` |3tranh, chia10mảnh, modulo theo độ dài catalog | Không append tranh để thay chức năng; chuyển UI nhưng giữ quyền lợi/dữ liệu lịch sử |
| `adventureRewards.js`, `masteryRewards.js` | Rương và300Xu bộ cũ có receipt/save/rollback | Không xóa hoặc cấp lại300Xu; thay đổi phải có migration riêng đã duyệt |
| `appearance.js`, `mainmenu.js`, `shop.js` | Sở hữu/trang bị theme và effect, normalize chỉ giữ ID đã biết | Catalog độc quyền thành tích phải được đăng ký trước normalize; không biến thành hàng bán có giáundefined |
| `accountPanel.js`, `leaderboardPanel.js` | Avatar là chữ cái đầu tên, chưa có cosmetic avatar/frame/badge | Đây là tính năng mới, không thể chỉ thay fileảnh |
| `gameState.js`, `chapterStore.js`, `cloudSnapshot.js` | Normalize chặt, save theo profile/chapter, backup có phiên bản | Cần tương thích field mới và ghi nhận một lần; không chỉ thêm RAM rồi mất khi reload |

Không có fontwoff/ttf trong public khi kiểm tra. Trước reference chữ phải chọn một font có đủ dấu tiếng Việt và quyền dùng, đóng gói subset cần thiết, chờ font ready trước chụp. Chưa chốt font thương mại hoặc thêm dependency trong lượt này.

Đọc sâu hơn thấy summary hiện đang chờ200ms trong `afterClose` trước callback điều hướng. GateF2 cần thay chỗ nối mới bằng tín hiệu đã đóng thật từ modal owner, giữ API caller tương thích; không cộng thêm một timeout để nối popup thành tích. Đây là nguyên nhân race cần giải quyết trong scope queue, không phải quyền refactor mọi modal.

## 3. “Giống100%” được thực hiện và nghiệm thu thế nào

Ảnh minh họa là ảnh phẳng có chữ/ánh sáng/bố cục đã vẽ liền. Không hứa pixel tuyệt đối giống cùng lúc trên mọi tỷ lệ màn hình. Mục tiêu thực thi là **giữ đúng artwork và bố cục đã duyệt tại kích thước tham chiếu**, rồi co giãn theo quy tắc xác định.

1. Chốt reference cho từng component, không chỉ palette. Bản tổng hợp thực sự làm từ asset tách+font thật sẽ thành golden reference sau duyệt; không dùng một HTML dựng khác game làm bằng chứng sản phẩm.
2. Logical viewport ban đầu412×915; kiểm thêm320×740, landscape844×390 và desktop1024×768 ở thời điểm thay component. Ảnh review có tỷ lệ crop khác nhau; không kéo giãn cả ảnh để giả làm screenshot đúng kích thước.
3. Mỗi popup có logical box, layer stack, paint bounds, content bounds, text baselines, action slots, close target, scroll viewport và pivot. Các tọa độ lưu trong hợp đồng, không rải magic number ở nhiều CSS file.
4. Tại reference: sai số slot/điểm neo mục tiêu≤1CSSpx; không có chữ tràn khỏi safe content, ảnh bị crop ngoài ý muốn, nối sai cap hoặc góc bị kéo. Pixel-diff áp cho artwork trên cùng renderer/DPR; vùng chữ đối chiếu font/line-height/baseline do anti-aliasing khác nhau.
5. Ở kích thước khác: giữ aspect/cap/điểm neo; bài dài cuộn body, footer và close luôn tới được. Không dùng absolute mọi thứ khiến bản dịch/chữ lớn che nút. Không scale cả app xuống chỉ để khớp ảnh.
6. Không dùng screenshot có chữ làm một button/popup. Tất cả nhãn, số liệu, tên món và điều kiện nhận là DOM, chọn được về ngữ nghĩa và đọc bằng assistive technology.

## 4. Phương án presentation và cấu trúc ảnh

**Chọn:** component owner hiện hữu +lớp vẽ riêng +slot nội dung từ contract. Artwork chính do imagegen tạo; packing/layout đo đạc có tính xác định. Tách ảnh theo ngữ nghĩa thay vì crop tùy ý cả tấm minh họa.

**Không chọn:** đắp thêm nhiều CSS gradient/shadow lên hộp cũ, vì không có các silhouette/ornament trong mẫu. **Không chọn:** một PNG chứa trọn popup rồi chồng các button trong suốt không có semantic, vì khó responsive, text/localization và focus. Full-panel art có thể dùng riêng cho khung có tỷ lệ cố định; content/button vẫn là DOM và owner cũ.

Layer order chuẩn: backdrop → shadow/frame body → paper/inset → ornament cố định/caps → ribbon/titleplate → nội dung/ảnh thưởng → control art → chữ/control semantic → focus/tooltip. Trang trí `pointer-events:none`; z-index theo component, không đẩy lên toàn app tùy ý.

| Loại ảnh | Cách áp | Không được làm |
|---|---|---|
| Popup body nền giấy |9slice hoặc fill tile có viền độc lập | Kéo cả góc gỗ/lá theo chiều cao |
| Góc/viền gỗ, lá | Corner caps và edge strips/piece có neo | Dùng generic border-image slice cắt xuyên ornament |
| Ribbon |3slice ngang; tails/crest cố định | Kéo cao ribbon theo số dòng chữ |
| Nút | Normal/pressed/disabled cùng canvas, text zone;9slice khi mặt trơn | Đổi kích thước hitbox khi pressed hoặc trim mỗi state khác nhau |
| Icon chức năng | Raster rõ silhouette, có vector fallback cùng nghĩa | Thay bằng emoji hoặc ký tựfont khi thiếuảnh |
| Avatar | Portrait có mask riêng, không baked khung | Gộp avatar với frame khiến đổi khung bị chồng viền |
| Khung avatar | Alpha thật, lòng trong đo đúng center/radius, pivot chung | Auto-trim theo ornament lệch tâm rồi fitbbox tùy ý |
| Huy hiệu | Canvas/pivot/baseline ổn định, ảnhchân dung không chứa | Viền/đồ trang trí che tên/ngày/thuộc tính hồ sơ |
| Preview hiệu ứng | Cover art trong catalog; motion dùng engine thật | Coi coverPNG là một hiệu ứng đã triển khai |

## 5. Hợp đồng neo và nội dung

Mỗi asset có ID ổn định, source/hash/native size/sourceBounds, export frame, contentRect, pivot, renderMode, cap/slice, text-safe zones và alpha/mask/hole metadata nếu có. Với reward thêm gameId/type/equipSlot; thông tin kỹ thuật không được tự render lên UI.

Mỗi component contract có `logicalSize`, `safeInsets`, `layers`, `slots`, `textStyles`, `scrollRegion`, `min/maxWidth`, `compactRules`, `safeArea/bannerPolicy`. Slot gồm rect/anchor, align, maxLines, overflow và accessible target. Rect ảnh và hitbox là hai khái niệm riêng.

Ví dụ popup thưởng tại412CSSpx: modal widthmin(380, viewport−24), inner safe inset24; title ribbon neo top-center, có vùng bleed được owner tính; hero reward128CSSpx có frame riêng; heading/time/body chia dòng theo font thật; footer Tiếp tục min44CSSpx. Đây là token khởi điểm để compositor duyệt, không khẳng định screenshot hiện có đã đo ra tọa độ này. Slot cuối phải được xuất từ bản ghép đã duyệt trước khi tích hợp.

Hồ sơ: avatar, frame và badge có cùng local coordinate system; `avatarMask`, `frameInnerCircle`, `badgeAnchor` được packager xuất. Frame có phần trang trí bất đối xứng không làm tâm avatar nhảy. Hiển thị frame/portrait đúng tỷ lệ ở hero, tile, reward và leaderboard; không vẽ avatar nằm sẵn trong frame source.

## 6. Inventory ảnh cho giao diện mới

Nguồn cần tạo/đối chiếu ở gateD1–D2, không nhận bộ thưởng hiện tại là đủ chrome toàn app:

- Surface: popup wood/paper frame, header ribbon, titleplate, inset/value well, list/card backing, HUD plate, bottom dock, selected tab, toast, tooltip, input field, tray/board frame, avatar preview pedestal.
- Controls: primarygreen/secondaryorange/danger/square normal-pressed-disabled; close, next/back, toggle, sliderthumb/track, checkbox, focus/selected/locked/busy states.
- Illustrated icon family: cửa hàng, bộ sưu tập, bản đồ, cúp, cài đặt, hồ sơ, sách/hướng dẫn, chơi, thoát, tạm dừng, chơi lại, tiếp tục, gợi ý, xáo, úp/lật, hoàn tác, đóng băng, đồng hồ, xu, sao có/khuyết, xác nhận, khóa, âm thanh/nhạc và các vai trò thực trong inventory cuối. Alias dùng cùng nghĩa, không tạo hình mới chỉ khác tên.
- Reward chrome: aura tĩnh, earned/check marker, new marker, source tag, preview viewport, bộ4độ khó có nhãn. Không có chest mới gắn vào thành tích.
- Decorative artwork gắn với neo: ribbon tails, golden leaves, top crest, corner ornaments. Không tự động thêm animation loop.

## 7. Ma trận phủ toàn dự án

| Bề mặt | Thay đổi presentation | Ràng buộc |
|---|---|---|
| Loading/Home/chọn trò | Khung/titleplate/buttons/icon | Giữ3node carousel, không tạo cảnh/loading giả |
| Cửa hàng | Panel, item card, price area, control state | Không bán vật phẩm achievement-only hoặc thay giá |
| Bộ sưu tập | Thay Tranh bằng Thành tích; giữ nhóm theme/effect theo trò | Không thêm một tab chính thứ6 hoặc một kho đồ song song |
| Bản đồ | Header, dock, preview, node frame, tooltips | Giữ map geometry, chặng và rương hiện hành |
| Xếp hạng | Panel/list/avatar+frame gọn | Không tự thay query/rank policy; cosmetic công khai cần wire support |
| Cài đặt | Thêm Cổ tích vào4skin cũ, control chrome | Giữ key lựa chọn và fallback, không ép đổi skin |
| Hồ sơ | Avatar bấm được mở popup Trang trí hồ sơ | Còn giữ tên/đăng nhập/stats và scope tài khoản hiện hữu |
| HUD/menu3trò | Plate/icon/booster/tray/frame | Giữ tốc độ thao tác, hình mặt thẻ, đường nối và input owner |
| Thắng/thua/pause/preview/confirm/help | Khung đa lớp, title và actionslot | Nội dung động/scroll/focus/pause đúng owner |
| Toast/tooltip/tutorial | Chrome và pointer asset nếu phù hợp | Không che mục tiêu, không tạo onboarding thứ hai |
| Rương/thưởng mốc | Cùng mỹ thuật chrome mới | Giữ mọi receipt/cấp/điều kiện/kinh tế |

Features Thành tích/Hồ sơ phải sử dụng được ở cả5skin; chỉ Cổ tích dùng chrome mới sát hình. Không cần vẽ lại mỗi avatar/khung/huy hiệu theo5skin.

## 8. Luật Thành tích và phân phối quà

Nguồn điều kiện là completed records được chứng nhận. Settlement so sánh trước/sau: chưa đủ4 →đủ4, thành tích cùng chủ sở hữu và `gameId+level` chưa có receipt, thì tạo grant. Version catalog/rules chỉ lưu để truy nguyên quà đã cấp, không cho phép tăng version rồi nhận lại thành tích cũ. Điều kiện thường xuất hiện khi thắngS; không chỉ dựa vào tênmode nếu save/import có lịch sử khác.

- Bốn độ khó cùng một màn của một trò. Cùng số màn ở trò khác có thành tích/receipt/quà riêng.
- Grant định trước từ catalog có version, không random, không modulo theo độ dài catalog, không đếm tổngmàn3trò.
- Profile cosmetics dùng kho chung theo tài khoản; từng món có sourceGame/sourceLevel và ID riêng. Không tạo ba bản trùng hệt một avatar chỉ khác ID để giả có quà mới.
- Ngoại hình/effect được ghi vào owned/equip slot của đúng trò. Chỉ sở hữu, không tự thay món đang dùng.
- Bộ đầu có đúng một grant/màn, từ màn 1–10 của từng trò. `art-kit-v1/reward-distribution.json` là nguồn duy nhất của bảng gán; manifest và bảng xem trước sinh từ đó. Duyệt bảng này trước khi phát hành; không đổi ID hoặc phần thưởng của receipt đã được cấp khi mở rộng catalog.
- Catalog tương ứng bộ artwork đầu và policy ngoài phạm vi được chốt ở phụ lục. Không khóa quà đã mua/sở hữu, không âm thầm chuyển một effect đang bán thành độc quyền rồi trao lại bản giống nhau.
- Không thêm tiền tệ, mảnh ghép, crafting, random box hoặc stat bonus. Vật phẩm hiệu ứng là cosmetic, không tăngmoves/time/tray/score.

### Dữ liệu và giao dịch

Đề xuất ownership mới trong model appearance/profilecosmetics, receipts theo game/chapter để không tăng một mảng global vô hạn. Model gồm catalogVersion, owned IDs, selected avatar/frame/badge, nguồn nhận và receipt identity; dùng normalizer ở boundary. Tên field/schema cuối phải phù hợp chapterStore/backup hiện hành, không chỉ thêm vàoRAM.

Chứng nhận màn +grant receipt +owned items +pending announcement phải commit cùng settlement transaction. Nếu save fail thì rollback, không báo đã nhận. UI không cấp vật phẩm. Đóng app/đổi tài khoản/callback muộn không cấp lại hoặc áp đồ của người khác.

Register catalog trước normalize, giữ unknown future IDs bằng policy tương thích đã test hoặc chặn ghi an toàn; không để ownedIds filter xóa vật phẩm mới. Dữ liệu owned và equipped tách biệt; equip chỉ nhận ID đã sở hữu và đúngslot/game. Save bị lỗi giữ lựa chọn cũ và thông báo sản phẩm ngắn.

## 9. Chuỗi popup và lifecycle

1. Kết thúc round theo luật hiện hữu, commit dữ liệu.
2. Hiện summary chỉ sao/xu/thời gian/điểm và hành động hiện hữu.
3. Người chơi chọn Bản đồ/Chơi tiếp; lưu pending destination, đóng summary thật.
4. Qua callback/queue của modal owner, hiện duy nhất một popup achievement có các món đã grant. Không dùng setTimeout để đoán summary đã hết.
5. Popup có Tiếp tục; không Nhận quà/Dùng ngay/Trang bị. Không cho round mới chạy phía sau. Nhận quà không phụ thuộc chạy hết animation hay đọc thông báo.
6. Sau đóng, đi đúng destination; generation/profile/page guards giữ toàn tuyến. Nếu owner hủy, quà vẫn giữ, thông báo chưa xem có thể phục hồi qua queue hiện hữu/phầnMới trong kho.

Đánh dấu đã thấy notification khác receipt đã nhận; không dùng chung cờ. Quà hồi tố/import nhiều món gom một thông báo sản phẩm, không mở hàng chục popup. Hướng dẫn nơi tìm quà lưu một lần cho nhómHồ sơ và từng trò/nhómEffect để đúng cửa vào; không ghi chữdebug hoặc migration lên card.

## 10. Hồ sơ và nơi sử dụng

- Bấm avatar trong Hồ sơ mở popup con cùng owner; close/Back trở lại Hồ sơ, focus vềavatar. Avatar phải là button có accessible name, không còn span trang trí không tương tác.
- Ba tab: Ảnh đại diện, Khung viền, Huy hiệu; grid có owned/new/selected/locked rõ. Top preview cùng một coordinate system. Một avatar, một frame và một badge được chọn ở bản đầu.
- Lưu thay đổi chỉ ở nơi tùy chỉnh, có working selection và cancel an toàn; chỉpersist sau xác nhận lưu và xử lý failure. Không tạo buttonNhận quà ở đây.
- Kho item đã nhận không trộn với điều kiện trả tiền. Trong Bộ sưu tập trò, effect có Trang bị/Đang dùng; ảnhpreview không chạy animation loop mọi tile.
- Avatar/frame trên leaderboard cần cập nhật public cosmetic fields của outbox/model/rules tương thích nếu muốn người khác thấy. Không suy từ cloud backup private; không tự deploy Firestore rule. Nếu chưa được giao backend, localprofile làm trước và ghi giới hạn, không nhận đã hỗ trợ public.

## 11. Chuyển từ bộ tranh

Không xóa3tranh public hoặc quà300Xu đã nhận; không reset tiến trình. Giữ receipt collection lịch sử, tiền/kho và quyền đã có. Mục Tranh được thay trình bày Thành tích, nhưng model tương thích vẫn đọc save cũ.

Chính sách đề xuất để duyệt: giữ300Xu theo điều kiện10mànđủ4độkhó hiện hữu, một lần/cụm, thể hiện như phần thưởng nhóm thành tích, không cần Xem tranh. Không tăng/giảm giá trị hay cấp lại nhóm đã nhận. Nếu muốn bỏ/đổi khoản này phải có quyết định riêng trước gateF1.

Backfill dựa chứng nhận đầy đủ +catalogversion: tạo receipt/quyền sở hữu một lần, không yêu cầu chơi lại. Không trình diễn mộtpopup/màncũ. Restore/save/version lạ, lỗi quota và rollback giữa backfill phải test; không nhập dữ liệu hỏng làm thành tích hợp lệ.

## 12. Câu chữ dành cho người chơi

Chỉ render field copy được cho phép, không dump metadata/ID/status kỹ thuật. Câu mẫu:

- “Thành tích hoàn tất”
- “Link Connect · Màn5”
- “Đã hoàn thành cả bốn độ khó”
- “Đã thêm vào Hồ sơ” / “Đã thêm vào Bộ sưu tập Link Connect”
- “Chạm ảnh đại diện trong Hồ sơ để thay đổi.” (lần đầu)
- “Bạn có thể chọn hiệu ứng trong Bộ sưu tập Link Connect.” (lần đầu)
- “Ảnh đại diện”, “Khung viền”, “Huy hiệu”, “Lưu thay đổi”, “Trang bị”, “Đang dùng”, “Chưa mở khóa”, “Tiếp tục”.

Không hiện: runtime, schema, ledger, receipt, generated, source, adapter, gate, profileId, phiênbảnthử, mock, placeholder, debug, SDK/API, ghi chú/giải thích choagent. Technicalcopy chỉ nằm trong tài liệu. Nội dung hướng dẫn thao tác cần thiết cho người chơi vẫn được phép; không bỏ hướng dẫn lần đầu đã chốt vì hiểu nhầm cấm mọi hướng dẫn.

Ảnhreward/chrome không chứa chữ/số/giá; tên món bằngDOM. Các nhãn ngoài khung trong concept board phục vụ review, không mang vào game. Kiểm cả copy trong screenshot thật và lỗi/fallback/empty/loading state.

## 13. Hiệu suất và hoạt ảnh

Đề xuất ngân sách ban đầu để đo khi triển khai: core chrome nén≤1MiB, rewardthumbnail theo bề mặt≤500KiB, hero lazy≤300KiB/món; decode live củaskin/cosmetic đang hiển thị≤24MiB chưa tínhgame art/GPU. Nếu artwork chưa đạt phải báo số thật, không nâng trần âm thầm.

Không preload toàn bộ5skin hoặc hết inventoryhero. Avatarthumbnail128/256, hero512 theo độ lớn; frame/badge có alphaWebP. Cache current+candidate lúc đổi, giải phóng candidate cũ. Không tải cảsheet nếu chỉ dùng vài món; không loadPNGsource/QA vào bundle.

Celebration achievement đề xuất hữu hạn: entryopacity/scale nhẹ120–180ms; accent sparkle/aura ngắn300–600ms, tốiđa8sparkle nodes trong vùnghero; resolve tĩnh. Nút có thể dùng ngay, không chờtimeline. Reduced-motion dùng trạng thái tĩnh; callback grant không chờanimation. Tái sử dụnglifecycle hiện có, không timer/RAF riêng trên mỗi tilekho. Effectgameplay sẽ có timeline/cleanup/quality theo engine, previewcover không chứng minh runtimeđãđạt.

## 14. Gate triển khai sau khi kế hoạch/art được giao thực hiện

| Gate | Công việc | Điều kiện đạt |
|---|---|---|
| D0 | Dùng phạm vi đã chốt 10 màn/trò; duyệt thứ tự quà, policy ngoài catalog,300Xu, tênskin và referencefont/layout | Không hỏi lại số lượng; không còn quyết định quà/schema làm thay đổi thiết kế bị tự đoán |
| D1 | Inventorychrome/icon/state toàn app và componentcontracts | Mỗi role có owner/asset/renderMode/slot, không thiếu popup ngoài thắng |
| D2 | Vẽ/cắtchrome, ghépUI thực từasset+DOM, duyệtgoldenreference | Khớp đúng layer/corner/text, đặc biệt reward/profile/collection; không dùngfullscreenshot giả|
| S1 | Thêm storybook qua registry/loader/generator |5skin cũ/mới lưu được, lỗi/hủy/fallback/cleanup đúng; không sửa output tay|
| S2 | Áp chrome toàn Home/5tab/HUD/menu/popup/toast/tutorial | Coverage đủ, safe-area/scroll/footer/anchors đúng; không chỉ popupthắng|
| F1 | Catalog, normalizer, grants, settlement, receipts và migration | Mỗi game×mànmột lần, reload/restore/rollback đúng, không mấtđồ/300Xu cũ|
| F2 | Queue summary→achievement→destination và hướng dẫn lầnđầu | Không popupchồng/roundchạyphía sau/nhậntrùng/đợi animation|
| F3 | Popupcosmetic Hồ sơ, collection/equip và publicavatar scope nếu giao | Previewđúngneo, owned/equippedđúngslot, save/cancel/failure chuẩn|
| Q1 | Self-reviewriêng hoặc reviewđộclập nếu cóphâncông; check/build/bằngchứng | Báođúng phạmvi, không nhận ảnhpreviewlà runtime; không còn bước được giao bỏlại|

Ở lượt chuẩn bị chỉ đóng gate tài nguyên/kế hoạch tương ứng; bảng trên là công việc tương lai, chưa đánh dấu pass runtime.

## 15. Kiểm tra đúng phạm vi

Một bộ geometry đã đúng thì artwork cùng contract chỉ kiểm asset metadata/alpha/crop và xem nhanh vài thành phần; không chơi lại cả game cho mỗi ảnh. Thay loader/model/settlement/persistence trong task này có rủi ro thực, nên test đúng các invariant đó.

- Asset: ID/hash/frame/mask/hole/pivot/cap/state/textsafe; các layer avatar+frame+badge phải composite trên nền sáng/tối ở các kích thước dùng.
- Logic:3game táchreceipt, trước3/4sau4/4, clearSnhưngthiếuchứngnhận khác, replay, pendingdoubleclick, ownedtrùng, unknowncatalog, catalogversion không làmđổi quà đãgrant.
- Persistence: savecũ/thiếufield/hỏng, rollback, reload, offline, restoreUIDđổi/ownerhủy, backfillnhiều chương, claim300Xuđãnhận. Unit/contract trước UI.
- UI thật: thắngS→summary→reward→next/map, chỉTiếptục, hướngdẫnmộtlần, avatarclick/popup3tab/equip/cancel/savefail, effectđúngtrò, keyboard/Back/focus, narrowtext/scroll/safearea.
- Khi sửa componentchung kiểm5skin và baadapter đúngđườngảnhhưởng; reference412 trước, hẹp320, landscape844/desktop1024khiresponsiveđổi. Không nhânfullmatrix khôngliênquan sau mỗiartefact.
- Lifecycle: restart/đổimode/đổiUIDgiữanimation/đổiskin nhanh,20chu kỳrelevantscope; node/listener/timer/cache ổn định. Hiệu suất đo cùngbuild/scenario khi tăngtảidecode/chuyểngiao; không nhận60FPS từPNG.
- Gatecuối code sản phẩm: `npm run check`, `npm run build`, tests mục tiêu và reviewdiff; không APK/push/deploy trừ khi cóyêucầuriêng. Một receipt chung cho task.

## 16. Đầu ra và giới hạn của lượt chuẩn bị

Kế hoạch này +nguồn/bộ thưởng trong `docs/design/achievements/art-kit-v1` +prompt agent bàn giao. Artkit là ứng viên để duyệt, không phải generatedruntime đã tích hợp; effectcover không phải effectengine. UI chrome toànapp vẫn cần vẽ/tách/duyệt ởD1–D2. Không có thayđổi model/schema/API/save hoặc assetpublic trong lượt này.

Đầu ra bổ sung: `layout-contract.draft.json` có16slot trong biên component, `player-copy.vi.json` chỉ copy người chơi, `IMPLEMENTATION_PROMPT.md`, `art-kit-v1/qa/validation.json` vàreceipt cùng thư mụcachievements. Bộ đầu hiện30hình rời: 12món lõi giữ nguyên và18món bổ sung, đã có bảng gán màn1–10 từng trò. Ảnh đại diện hiệu ứng là cover tĩnh; engine và ảnh chrome toàn ứng dụng chưa được tạo trong lượt này. Xem `REWARD_CATALOG.md` để duyệt phân phối và thiết kế motion cần triển khai.

Thư mụcdocs đangignore theo cấu hình cósẵn. Giữ nguồn trên checkout; agent/worktree khác phải mang đúngkit, không force-add toàn bộdocs hoặc giả định Gitđã cóảnh. Không sửa file của agent khác.

## Phụ lục A — Phạm vi bộ thưởng

Ngày23/10/2026 chủ dự án chọn **10 màn mỗi trò — 30 thành tích**. Mỗi trò có3avatar,3khung,2huy hiệu,2hiệu ứng; không dùng tổng số màn của cả ba trò để mở thưởng. Bảng quà chi tiết: [REWARD_CATALOG.md](docs/design/achievements/REWARD_CATALOG.md); nguồn gán: [reward-distribution.json](docs/design/achievements/art-kit-v1/reward-distribution.json). Các ảnh mới được vẽ bằng imagegen, dùng chung canvas/pivot với bộ lõi.

Số lượng này không tự phê duyệt mỹ thuật từng món, thứ tự gán, thay đổi300Xu hoặc chính sách cho màn11trở đi. D0 phải chốt các phần còn mở trước khi triển khai phần phụ thuộc. Không chặn chơi ở màn11; không tự hứa quà mới, quay vòng catalog hoặc tự thêm tiền bù. Nếu màn hiện có vượt10, cần duyệt phạm vi phát hành và cách trình bày Thành tích tương ứng.
