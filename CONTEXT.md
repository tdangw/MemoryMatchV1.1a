# CONTEXT — Trạng thái hiện tại (2026-11-01)

## Sưu tập chữ và ghép bất kỳ — hoàn tất 01/11/2026

- Không còn kế hoạch active. LETTER_COLLECTION_FUSION_PLAN.md đã đóng,
  lưu phạm vi và bằng chứng của task này; không dùng làm task còn chờ.
- Bốn bộ chữ là tab nhỏ một hàng cuộn ngang, ẩn thanh cuộn; tab đang
  chọn được đưa vào vùng nhìn thấy. Rương đúng bộ ở cột phải, kho17chữ
  bên dưới dùng atlas hiện có. Chạm chữ mở Ghép/Bán/X.
- Ghép chọn3đơn vị chữ bất kỳ, được lặp khi đủ tồn; bỏ/chọn lại trước
  xác nhận không trừ kho. Ba ô quanh tâm, ra1chữ chọn đều17loại/có thể
  trùng; Ghép tiếp bắt đầu lựa chọn mới. Giá bán10Xu và bảng rương giữ.
- Receipt mới thêm ingredients[3], giữ letter=ingredients[0] làm hint
  cho client cũ đọc; mọi lượng tiêu hao mới chỉ tính từ ingredients.
  Lệnh/receipt/pending ghép cùng chữ cũ vẫn hợp lệ; không tăng version,
  reset hay migration dữ liệu. Command có cả letter và ingredients bị
  từ chối. Rules chứng minh đúng delta từng chữ, earned và Xu không đổi.
- Giao dịch chỉ gửi khi xác nhận, khóa bấm đôi/chọn mới lúc đang lưu;
  retry khôi phục kết quả đã lưu trước khi cho gửi lại. Đóng hoặc đổi
  tài khoản hủy trình bày cũ, không hủy phần thưởng đã commit. Animation
  hữu hạn, owner cleanup và hidden/reduced-motion; grant không chờ FX.
- Thông báo kết nối và Thử lại căn giữa vùng nội dung khi chưa tải được
  kho chữ/Nhiệm vụ. Bỏ Tải lại tiến độ ở Nhiệm vụ; Thử lại chỉ xuất hiện
  theo lỗi/đổi tài khoản/kỳ hết hiệu lực, không thêm polling.
- Nghiệm thu:6unit mới + policy/generator đạt; hai emulator đạt cả giao
  dịch cũ/mới, CAS/recovery/UID và12 dữ liệu giả bị từ chối. UI22ca đạt,
  thêm4ca sau chỉnh kết nối đạt; gồm40 tổ hợp5skin×4viewport×2motion,
  keyboard,20vòng cleanup, đóng khi đang lưu và phục hồi mất phản hồi.
  npm run check đạt; static/CSS và build cuối đạt. Online browser suite
  cần cả Auth emulator chưa chạy ở lượt này; giao dịch Firestore đã
  kiểm qua emulator riêng. Chưa đo FPS trên thiết bị thật.
- Firestore rules đã phát hành thành công tới memorymatchv1-1a theo
  quyền chủ dự án cấp. Không deploy Hosting hoặc tạo APK. Quà10giây để
  test vẫn giữ. Không đưa ảnh/log thử vào commit.

## Số mảnh Xu và ảnh Kho chữ — cập nhật31/10/2026

- Hiệu ứng Xu của Gift/Nhiệm vụ/Sự kiện lấy số Xu thực nhận thay6mảnh
  cố định. Dùng chung COIN_PARTICLE_LIMIT=32 với coinRewards và registry
  gameplay:25Xu=25mảnh, khoản lớn hơn32 hiện tối đa32mảnh, toast/ví vẫn
  ghi đủ giá trị. Item vẫn cap12 riêng; batch có thể32coin+12item như game.
  Scatter hữu hạn trong viewport, giữ âm thanh/timeline/cleanup hiện hành.
- Bỏ Tải lại tiến độ ở trang Sự kiện (Vòng quay/Sưu tập chữ) và Xem Kho
  rương ở hai tab đó. Khi lỗi/đổi tài khoản/kỳ không còn hợp lệ, chỉ hiện
  Thử lại theo ngữ cảnh; không thêm polling/network hoặc đổi giao dịch.
  Kho rương vẫn có trong Bộ sưu tập và lối đi Sưu tập huy hiệu hiện hữu.
- Kho chữ và ô bộ chữ dùng atlas letters-128/256.webp giống chữ rơi,
  cùng LETTER_ALPHABET/index/backgroundPosition; không tạo asset mới.
  Giữ số lượng, selected/empty state và aria-label trên từng chữ.
- UI18test mục tiêu đạt (Gift7, feedback5, wheel3, ảnh/chip/coin3), gồm
  count1/5/25/32/100/1000 đối chiếu game,5skin và mobile hẹp/ngang,
  retry và cleanup. Audio tail chờ ended trước so baseline tài nguyên.
  Check/build/CSS đạt. Lượt check đầu Easy generator p95=29,47ms>20ms
  khi chạy đồng thời Chrome/build; chạy lại yên đạt, không sửa benchmark.
- Không đổi luật thưởng, schema, số dư hay rules; không deploy/APK.
  Chu kỳ quà10giây để test vẫn giữ. Không commit ảnh/log thử.

## Vòng quay với nút tâm — cập nhật31/10/2026

- Bỏ tiêu đề lặp “Vòng quay may mắn” và dòng báo Xu thành công phía
  trên vòng quay; chỉ giữ toast thưởng. Lỗi kết nối vẫn hiển thị rõ.
- Một nút ở tâm tự chọn miễn phí → vé → xem quảng cáo. Chỉ trừ lượt
  khi bấm và service xác nhận; khóa lúc bận, giữ focus sau khi quay.
  Giữ8ô/12,5%,1free/ngày,10ad/ngày, quota và giao dịch hiện hành.
- Vé quay nằm góc trái ngay dưới tab, trong khoảng riêng trên vòng;
  icon thông tin(i) góc phải mở popup Thể lệ, không còn ba nút dưới vòng.
- Xu rơi từ tọa độ ô trúng sau khi rotor dừng; tiếp tục dùng nhịp
  900/900/850ms, toast một hàng và âm thanh nhận/rơi/thu hiện hành.
- UI kiểm5skin×4viewport, thứ tự nguồn lượt, chống bấm đôi, quotaad,
  tọa độ ô trúng, reduced-motion/đóng giữa vòng và focus bàn phím.
  UI4test mục tiêu/CSS/syntax/build đạt. Assertion giao diện của test
  online được cập nhật, không chạy lại emulator vì không đổi giao dịch.
  Không đổi schema/save/rules, không deploy hoặc tạo APK.

## Báo quà Sự kiện/Nhiệm vụ và âm thanh — cập nhật31/10/2026

- Sửa chấm Sự kiện khi còn vé: vé/bộ chữ/mốc huy hiệu không bị chặn
  vì chưa có kỳ giờ máy chủ. Lượt miễn phí và quà nhiệm vụ vẫn dùng kỳ
  đúng UID đã xác nhận. Gắn chấm cả HOME/dock chức năng và map; bus
  xác nhận giờ đánh thức UI ngay cả status không tạo local commit.
  Không thêm gọi mạng hoặc save; nhận/tiêu quà cập nhật chấm theo state.
- Nhiệm vụ/Sự kiện có rơi900ms/dừng900ms/bay850ms, toast nhỏ một dòng,
  tối đa12particle. Xu/vé/rương/chữ/ngoại hình/hỗ trợ lấy từ facts vừa
  commit. Vòng quay đợi dừng mới hiện quà; status/replay không phát lại.
- Service trả committedRewards tạm, gom qua các pass đã publish; không
  persist, không gửi lên Firebase, không đổi schema/quota/luật thưởng.
  Tách visual owner theo trang thay vì dùng registry gameplay toàn cục.
- Dùng âm thanh hiện có reward.ogg/coin_drop.mp3/coin-collect.mp3 cho
  nhận/rơi/thu. Shared rewardAudio gom pha đồng thời100ms theo owner;
  đồng bộ loot ba trò, chữ/vé/huy hiệu, Gift và quà Nhiệm vụ/Sự kiện.
  Giữ coin-flight cũ đã có âm thanh; không thêm asset âm thanh. Âm cuối
  thuộc page/round để không bị cắt khi node biến mất, đóng trang/ẩn/mute
  vẫn dừng theo lifecycle và cài đặt âm lượng hiện hành.
- Check/build đạt;37unit mục tiêu (7indicator+30rewards) và20UI
  (4notification+5feedback+11Gift/letter) đạt, gồm600chu kỳ batch và
  20lần HOME/map. Kiểm thứ tự âm thanh bằng audio-play spy, muted/close;
  chưa đánh giá cảm nhận loa thiết bị thật. Không tăng I/O/Firebase writes.
- Không deploy rules/Hosting/APK; chu kỳ Gift10giây test vẫn giữ.

## Nhận quà gọn trên bản đồ — cập nhật31/10/2026

- Bỏ nền/viền/khung lớn và tiêu đề “Quà của bạn” sau khi nhận.
  Chỉ giữ toast nhỏ theo màu skin, icon22px/chữ12px, một hàng không xuống dòng.
- Hộp quà mờ hết trước mốc700ms khi vật phẩm bắt đầu hiện; giữ chỗ hình
  để toast không nhảy. Khi đã mở giữ hộp ẩn, không che pha rơi/dừng.
  Giữ timing900/900/850ms, owner/cleanup và reduced-motion; không đổi quà,
  thời gian10giây test, dữ liệu hoặc rules. Popup trước mở vẫn giữ.
- UI7/7 đạt; kiểm mọi tên hỗ trợ của3trò trên5skin ở320px đều một
  hàng/trọn chữ, hộp ẩn trong pha dừng. CSS/syntax/build đạt.

## Popup chọn màn — mỹ thuật31/10/2026

- Mô tả Vô tận/Thử thách bỏ khung/nền, chữ đậm vừa và cân dòng;
  khoảng cách + đường phân cách mảnh tách khỏi các chỉ số. Không đổi nội dung.
- Mọi popup chọn màn của3trò có họa tiết SVG đối xứng cạnh tiêu đề,
  màu theo skin; không thêm nhân vật, thông tin hoặc hoạt ảnh từ ảnh tham khảo.
- Giữ căn giữa, nút Chơi gọn và layout ngang hiện hành; không đổi logic/save.
- UI180popup (3trò×3mode×5skin×4viewport), CSS ownership và build đạt.
  Không deploy/APK hoặc thêm asset/animation.

## Chấm báo quà và hiệu ứng nhận — cập nhật31/10/2026

- Sửa nguyên nhân chấm Gift nằm cạnh Nhiệm vụ: từng shortcut có
  position:relative, chấm đặt theo nút48px của chính icon, không theo nav.
- Map Nhiệm vụ báo điểm danh/quà ngày/thưởng tuần chưa nhận; Sự kiện
  báo lượt quay miễn phí/vé/bộ chữ đủ/mốc huy hiệu. Không báo quảng cáo,
  bán hoặc ghép chữ. Chỉ dùng state đúng UID và kỳ máy chủ đã xác nhận.
- Kho báu báo tier rương đủ điều kiện của nhóm10màn đang xem; Bộ sưu tập
  báo300Xu bộ đủ của nhóm đó hoặc rương tồn kho chưa mở đúng tài khoản.
  Theo đúng nơi shortcut mở, không quét thêm các chương cũ hoặc gọi mạng.
  Sau commit/chuyển nhóm/đổi tài khoản/trở lại trang cập nhật chấm; map
  sở hữu listener/timer/dot và hủy cùng map. Không đổi schema/save/quà.
- Thẻ “Quà của bạn” dùng nền/viền/chữ theo skin, chữ thưởng kế thừa màu
  tường minh. Đã kiểm màu trên5skin, tương phản>=4,5:1. Hiệu ứng dùng
  timing Memory900msrơi/900msdừng/850msbay; tối đa6particle, hữu hạn,
  hủy theo map/ẩn tab/giảm chuyển động; lưu thưởng trước hình ảnh.
- Unit10/10 và UI7/7 đạt (gồm5skin×3viewport gift,10giây thật,
  tương phản/timing, hủy/retry; Rương/Bộ sưu tập3trò×3viewport bật/tắt
  sau nhận và vị trí chấm). JS/CSS/lifecycle/map-layout/build đạt;
  review độc lập không phát hiện lỗi. Không rules/Hosting/APK lượt này;
  chu kỳ10giây test vẫn giữ. Không commit ảnh/log thử.

## Quà tặng và popup — cập nhật31/10/2026

- Chủ dự án yêu cầu tạm đổi chu kỳ Quà tặng bất ngờ từ60phút xuống
  **10giây để test**. `HOURLY_GIFT_MS` là nguồn chung, generator sinh
  thời gian rules từ đó; không đổi schema, quà, trọng số hoặc số dư.
  Khi kết thúc test trả constant về60phút, sinh và deploy rules đồng bộ.
- Rules10giây đã deploy thành công lên memorymatchv1-1a ngày31/10,
  dùng quyền cập nhật rules tính năng quà đã được chủ dự án cho phép.
  Không deploy Hosting hoặc tạo APK.
- Tham khảo mã gift của Block Gems: icon mờ/khóa trong countdown, đủ
  giờ chỉ hiện chấm báo, không chữ “Sẵn sàng”. Giữ vùng bấm48px và vị
  trí đồng hồ. Khóa do tải map/import không bị tick mở lại.
- Bấm icon mở popup; bấm Mở quà lưu xong mới đóng và mở hộp ở giữa
  màn hình, rung/nắp mở rồi quà rơi/thu về đích. Tối đa6particle,
  animation hữu hạn/owner map, reduced-motion/hidden/đổi trang hủy an toàn.
- Chơi/Mở quà và nút footer popup gọn theo nội dung, căn giữa, giữ
  chiều cao bấm44–48px. Rà popup: thay HUD/Chờ ảnh/sắp mở/Quyền nhận/
  bản cloud bằng câu chữ sản phẩm; giữ thông báo kết nối/lưu thực tế.
- Unit quà5/5, emulator quà (sớm/backdate/replay/race/các loại quà),
  generator, CSS ownership, preview contract, JS và build web đạt.
  UI quà kiểm5skin/3viewport, chờ10giây thật, retry/hủy; Play kiểm
  3trò×5skin×4viewport (60popup). Ảnh/log thử không đưa vào commit.

## Rương ưu tiên chưa có và drop theo nhóm — hoàn tất30/10/2026

- P0/C1/D1/V1/Q1 hoàn tất; không còn kế hoạch triển khai active.
- Nguồn phạm vi `COSMETIC_COMPLETION_GROUP_DROPS_PLAN.md`; bằng chứng
  `COSMETIC_COMPLETION_GROUP_DROPS_RECEIPT.md`. Chủ dự án giao toàn bộ,
  commit P0/C1/D1/V1/Q1 và phần tracked còn sót; không deploy/APK.
- Rương giữ20% nhánh ngoại hình, chọn đều món chưa sở hữu đúng loại;
  full pool100Xu. Giữ nhánh Xu/hỗ trợ/C, candidate bền, legacy và race
  đổi trùng100Xu; không reroll hoặc auto-equip.
- Thường chữ5%/vé2%/huy hiệu6%; đặc biệt–Lucky–Magnet25%/10%/30%,
  ba RNG độc lập cho cả ba trò. Giữ bán10Xu/chữ, năng lượng80/20,
  hỗ trợ5/10/30, mốc thưởng và Quà tặng bất ngờ.
- Marker cả trúng/trượt theo attempt/wave/group; không cấp hồi tố hoặc
  farm qua undo/reload. Feedback cả normal/special sau lưu, đo origin
  một lần khi trúng trước tháo DOM; item/energy/letter chung cap12.
- Không đổi save/schema/rules/catalog. Quà60phút đã hoàn tất, nguồn
  `HOURLY_GIFT_RECEIPT.md`; giữ cooldown và server timestamp hiện hành.
- Check/build,13UI (5mới+8regression),100unit reviewer và ba emulator
  đạt. PC mixedloot cap12/cleanup đạt; P95=21ms, không chứng nhận60FPS
  hoặc S22. Chi tiết read/write/byte và giới hạn trong receipt chung.

## Rà soát hai task, cân bằng và dọn tài liệu — 29/10/2026

- Sự kiện/Nhiệm vụ/Kho rương và rơi vật phẩm/năng lượng/Nam châm đã hoàn tất chức năng web local; không còn kế hoạch triển khai active của hai task. Đánh giá hiện hành: `GAMEPLAY_ECONOMY_AUDIT.md`; bằng chứng trước: `EVENTS_MOBILE_FESTIVAL_RECEIPT.md`, `DROP_ENERGY_SPECIAL_CARDS_RECEIPT.md`.
- Rà mới: 76 unit, 33 UI, 2 Magnet (40 chu kỳ), CPU6x và hai Firestore emulator suite đạt; check/build cuối được ghi trong audit. Chưa có S22 vật lý, chưa chứng nhận60FPS hoặc tiêu hao thật. UI fixture không chứng minh OAuth/quảng cáo/live hai thiết bị.
- Cập nhật được duyệt29/10 sau audit: chữ rơi30% trên nhóm đặc biệt/Lucky/Magnet hợp lệ, bán10Xu/chữ, áp dụng cả ba trò. Thay100%/1000Xu trước đây; không đổi Xu đã có, số chữ/kho hoặc giao dịch cũ. Bản lưu vẫn đọc receipt bán1000Xu/chữ, giao dịch mới dùng10Xu. Đây là baseline29/10; bảng mới và luật rương triển khai30/10 được ghi tại mục đầu và mục9 GAMEPLAY_ECONOMY_AUDIT.md.
- Dọn code an toàn: Magnet reducer/Gợi ý dùng chung chọn hai đồng loại, ưu tiên khay rồi ID board, chỉ sort các mục tiêu hợp lệ. Giữ API/ledger/save/nhánh legacy. `node scripts/analyze-game-economy.mjs` đọc cấu hình và xuất kỳ vọng, không ghi dữ liệu hoặc truy cập Firebase.
- Đã xóa năm kế hoạch hoàn tất về gameplay, nền động, UI skin, Cổ tích và nhập môn. Không phục hồi chúng từ Git làm nguồn thực thi. Nguồn thiết kế hiện hành: ba tài liệu game, ARCHITECTURE và mục sản phẩm dưới đây; receipt là lịch sử. `ADS_APK_TEST_PLAN.md` chỉ còn checklist thiết bị/provider thật chưa xác minh, không phải quyền tự tạo APK/phát hành.
- Lượt này được phép commit phần triển khai hai task và cleanup đã rà; không stage ảnh/log QA hoặc thay đổi không liên quan. Không tự push/Hosting/rules/APK/billing.

## Quà tặng bất ngờ — hoàn tất 29/10/2026

- Đã duyệt ba nhóm vé/100Xu/hỗ trợ
  mỗi nhóm1/3; hỗ trợ chọn đều trò rồi đều loại trong pool rương. Lần đầu
  nhận ngay, sau đó60phút thực tế, không cộng dồn, nhận khi online.
- A đã kiểm tra: mốc máy chủ trong liveops, giao dịch root/snapshot hiện có,
  candidate bền vững/replay, kho đầy đổi10Xu. Unit5/5; emulator riêng đạt
  vé/Xu/hỗ trợ ba trò, nhận song song, chặn sớm/backdate và thao tác cũ.
- Icon dưới Sự kiện, đồng hồ nhỏ dưới icon trong vùng bấm48px; không tăng
  kích thước nút/khung. Popup “Quà tặng bất ngờ” chỉ hộp quà và nút “Mở quà”.
  Đợi hết cooldown mới mở; lỗi kết nối đổi chính nút đó thành “Thử lại”.
- Lưu thành công rồi đóng popup, mới mở hộp/rơi/thu quà trên map. Sáu particle
  Xu hoặc một vé/vật phẩm, hiệu ứng khoảng1,3s và thông báo ngắn; owner là
  map, hủy khi rời map. Reduced-motion tĩnh; animation không cấp thưởng.
- Rules đã deploy thành công lên memorymatchv1-1a ngày29/10 theo cho phép
  trực tiếp của chủ dự án sau lỗi403. Không Hosting/APK. Build web, unit5/5,
  UI matrix năm skin/ba viewport và hủy/đóng/thử lại/bấm nhanh đã đạt.
- Nguồn hiện hành nằm ở đây và HOURLY_GIFT_RECEIPT.md; plan hoàn tất đã xóa.

## Menu/Cửa hàng/Preview — hoàn tất 28/10/2026

- Bổ sung29/10: ẩn thanh cuộn toàn giao diện tại style.css (chuẩn và WebKit),
  bao gồm menu chính/tab/popup; giữ overflow, cuộn ngang/dọc và snap hiện có.
- Tiêu đề bảy tab chức năng căn giữa cả nội dung flex, không chỉ ô grid;
  header60px đồng bộ tên game, áp dụng trang menu và popup trong game.
- Tab chức năng: **Xu trái, tên giữa, X phải**; Cài đặt không có Xu.
  Ví chung có owner/subscription; không còn callback data.coins. Đọc
  patch.coins (kể cả0); reset/restore tải canonical có generation guard,
  không commit hoặc cấp thưởng từ renderer. Số dư hiển thị vi-VN.
- Home có ví phía trên. Bản đồ: avatar trái/tên game giữa/X phải; ví dưới
  X góc phải, dưới ví là cặp icon dọc Nhiệm vụ/Sự kiện. Trên trái có
  cặp icon Kho báu/Bộ sưu tập; dưới trái là cặp icon Vô tận/Thử thách.
  Không banner rương ngang, không chữ dài trên lối tắt; chi tiết/tiến độ
  giữ ở popup/aria. Ba khu vực có khung nhỏ nền tối/viền mảnh/họa tiết góc,
  không dây treo/nhãn chữ; khung46×94px nằm trong vùng bấm48×96px, có vạch
  phân cách mảnh giữa hai icon theo màu viền skin. Lối tắt
  dùng cùng navigate/page owner với dock, không mở luồng thưởng mới.
  Trang mở từ bản đồ đóng X về chính bản đồ đang xem, không tạo lại map;
  giữ chặng/vị trí cuộn. Trang mở từ Home vẫn đóng về Home.
  Cả ba cặp xếp dọc, icon30px/vùng bấm48px/lề mép2px. SVG minh họa
  có màu/khối đồng bộ rương, vật liệu theo năm skin; không dùng icon nét
  cho lối tắt bản đồ. Ví thẳng mép với cặp icon phải.
- Shop dùng màu icon/chữ đúng nền theo skin. Nút mua/Play nổi nhẹ2px,
  nhấn1px; Hủy/Mua ngay cùng kích thước và độ nổi, màu phân cấp. Play
  xanh48px trong preview gọn. Chỉ CSS/SVG, không emoji/loop, có reduced-motion.
- Preview là ô đồ họa thời gian, cặp/bộ ba, xem trước (Memory), gợi ý,
  khay (Triple), chủ đề; lấy adapter thật, không cố định75s/6cặp/5s.
  Cập nhật29/10: tiêu đề giữa chỉ “Màn N”, bỏ mô tả chung và chú thích
  số thẻ/đợt; ô thông số gọn, bố cục riêng khi ngang. Vô tận/Thử thách có
  lời giới thiệu ngắn trong ô nền riêng, có viền và khoảng cách với thông số;
  điều kiện mở dùng chữ C/B/A.
  Bấm tên chủ đề mở bộ chọn chủ đề đã sở hữu trên preview; đóng trở lại
  đúng preview/mode, cập nhật tên và focus. Scope preview hủy bộ chọn con
  khi rời bản đồ; không tự mở shop, mua chủ đề hoặc cấp vật phẩm.
  Giữ luật/giá/ID/save/schema và submit/difficulty/first-play guards.
- Fullscreen chỉ mount ở web; APK dùng immersive Android create/resume/
  focus, cho vuốt mở system bars tạm. Java compile offline đạt, chưa APK/
  S22 thật. Web matrix320/412/1024 ba trò/năm skin, header25view, patch/
  reset/restore/rapidbuy/30owner, map320/412 năm skin và ngang844×390 đạt;
  syntax/CSS/preview contract/build đạt. Không Hosting/rules/push.
- M1 4bf4129, M2 793bcf6, M3 542deac, lỗi subscriber f63e2ec; bằng chứng
  chung MENU_SHOP_PREVIEW_UI_RECEIPT.md. Plan triển khai đã hoàn tất và
  xóa sau khi gộp vào context; không phục hồi làm nguồn task đang chạy.

## Sự kiện/Nhiệm vụ/Kho rương — nguồn hiện hành 28/10/2026

- Đã hoàn tất triển khai P0–Q1 và chỉnh mỹ thuật V1–V3. Chủ dự án đổi
  **Lễ hội Đom Đóm → Sưu tập huy hiệu** ngày28/10. Đây là thay tên/đơn vị/
  icon, không tạo sự kiện mới, không reset điểm hoặc đổi tỷ lệ/quà.
  Tab Sự kiện: Vòng quay / Sưu tập chữ / Sưu tập huy hiệu. Màu/chất liệu
  thích ứng năm skin; một header/ví/nút đóng/dock, một vùng cuộn.
- Huy hiệu thu thập là token sự kiện, khác ngoại hình huy hiệu trang bị
  trong Hồ sơ. Icon riêng `collection-badge`: huy chương vàng, lõi xanh,
  hai thẻ ghép, dải ngọc; SVG dùng chung trên trang và loot khi ghép.
  Không dùng emoji/font, không thay đàn đom đóm trang trí của nền động.
- Mỗi nhóm thủ công hợp lệ thử ba nhánh độc lập: thường chữ5%/vé2%/
  huy hiệu6%; đặc biệt/Lucky/Magnet chữ25%/vé10%/huy hiệu30%. Thẻ thường
  trúng quà không đổi phân loại. Giữ2Xu/nhóm và tiến trình/thưởng mốc.
  Thưởng ghi bền ngay khi ghép, giữ kể cả thua/rời ván/offline;
  checkpoint attempt/wave/group và ledger gameplay ngăn farm reload/undo.
  Tối đa12loot gồm năng lượng/hỗ trợ/chữ/vé/huy hiệu cùng lúc.
- Sưu tập huy hiệu cá nhân quay vòng, không mùa/reset/countdown/cap ngày.
  **25 huy hiệu:50Xu; 50:100Xu +1Rương C; 75:1Rương Khung;
  100:1Rương Avatar.** Nhận đủ bốn mốc theo bất kỳ thứ tự nào sang vòng
  tiếp theo, giữ số dư; không cần mở rương. Chưa có snapshot thì không
  bịa số/vòng hoặc bật nhận. Không thêm document theo từng vòng/huy hiệu.
- Tương thích: cố ý giữ `fireflyEarned`, `festival`, `claimFestival`,
  `FIREFLY_DROP_CHANCE`, `firefly-festival-01`, receipt/catalog ID và cờ
  `VITE_FESTIVAL_CHESTS_ENABLED`. Chúng là mã kỹ thuật cũ, nay mang nghĩa
  Sưu tập huy hiệu; không đổi schema/save key/formatVersion2 hoặc rules.
  Mọi tiến độ cũ được tiếp tục tự động, không migration/reset.
- Sửa Bộ sưu tập28/10: Kho rương là tab thứ năm trong cả ba trò, cạnh
  các tab tính năng hiện có; bỏ nút riêng đứng trước tablist. Root đúng
  hai hàng (một dải tab48px, panel nội dung cuộn), tránh hàng tab bị kéo cao.
  Kho rương mở theo initialChest/lối tắt sẽ chọn tab đó, giữ thanh tab
  hiện; rời tab hủy childscope, kết quả đã mở đọc lại từ state. Tab rương
  chỉ chọn trong lần mở hiện tại, không thêm enum/schema settings lưu;
  preference các tab cũ giữ nguyên. Đổi tab bắt đầu đầu nội dung, không
  giả khôi phục scroll trước khi dữ liệu bất đồng bộ tải xong. Không đổi
  thưởng/guard mở rương trong ván; CSS chỉ scope Bộ sưu tập, không Shop.
- Quy ước tab chủ dự án chốt28/10: **một hàng, chữ không xuống dòng,
  nhiều tab thì cuộn ngang, ẩn thanh cuộn**. Áp dụng Cửa hàng/Bộ sưu tập,
  Sự kiện/Nhiệm vụ, Hồ sơ và Xếp hạng; không dùng bố cục tab3cột/2hàng.
  Tab đang chọn được đưa vào vùng nhìn thấy bằng scrollLeft, không kéo
  vị trí cuộn dọc. Giữ roving focus/ARIA và nhớ các lựa chọn cũ.
- Card Kho rương dùng chung icon rương cho cả4loại; tên14px/căn giữa,
  số lượng “Đang có: N”, nút48px “Xem quà” và “Mở 1”. Tỷ lệ/chọn trò/
  xác nhận mở vẫn ở phần chi tiết; không đổi xác suất hoặc thao tác kinh tế.
  Footer Hồ sơ/Tải lại có khoảng cách riêng, màu theo skin; không dùng
  icon avatar/khung/huy hiệu để thay hình vật chứa rương.
- Kho rương chung trong Bộ sưu tập:4card C/Khung/Avatar/Huy hiệu, số lượng
  gộp, mở1, xem pool/tỷ lệ/chọn trò hỗ trợ, gallery12món/trang. Trong ván
  chỉ xem. Nhận rương tách ownership; đồ/grant bền cũ/sáu effect/300Xu/
  rương bản đồ giữ nguyên. Không còn luân phiên12slot hoặc rương10000Xu.
- C:40%50Xu/60%hỗ trợ. Khung:40%100Xu/40%hỗ trợ/20%khung.
  Avatar:40%150Xu/40%hỗ trợ/20%avatar. Huy hiệu như Khung với ngoại hình
  huy hiệu. Ngoại hình trùng/đủ pool đổi100Xu theo yêu cầu28/10; đủ pool
  đổi thẳngXu, C vẫn40/60. Pool chỉ Thành tích/chữ/event, bỏ starter/effect,
  chọn đều. Hỗ trợ chia đều trong subpool theo trò; đầy9999 đổi phần hỗ trợ vượt thành10Xu/đơn vị và
  không mất quà hoặc reroll. Candidate vẫn được giữ qua lỗi kết nối để thử lại.
- Chữ: MEMORY MATCH→Rương Avatar; LINK CONNECT→Rương Khung;
  TRIPLE CONNECT→Rương Huy hiệu; ADVENTURE→Rương Avatar. Kho chung17chữ,
  công thức tiêu đủ số chữ lặp; bán10Xu/chữ, ghép3chữ giống nhau nhận
  1chữ ngẫu nhiên đều, có thể trùng đầu vào. Không đổi ownership trực tiếp.
- Vòng quay8ô bằng nhau5/10/10/15/15/20/20/25Xu;1free+10ad tối đa/ngày,
  1vé/lượt riêng, vé không hết hạn. Không giả ad earned. Nhiệm vụ ngày
  thắng3/ghép30/thắng không Gợi ý thưởng5/5/10Xu; nhận đủ ba tự thưởng
  10Xu+1vé. Tuần thắng12/ghép120/noHint3/điểm danh3, nhận bonus50Xu+2vé.
  Điểm danh10/10/15/10/15/20/25Xu theo bảy lần thực nhận, bỏ ngày giữ lượt.
  Reset07:00 Việt Nam, tuần thứ Hai. Hành trình Xu tuần20/50/80→5/10/10Xu,
  cap40điểm/ngày, tách khỏi Sưu tập huy hiệu, không cấp ngoại hình ở100điểm.
- Firebase Spark: không Functions/SSV/Scheduler/Blaze/polling, không write
  mỗi tick/drop hụt; dùng counter/mask/sequence hữu hạn và CAS root+state.
  Queue ví chung, candidate bền trước publication, marker chống cấp lặp,
  UID/restore/canonical guards giữ nguyên. Rules bảo vệ invariant cơ bản,
  không tuyên bố chống app sửa đổi hoặc xác minh quảng cáo phía máy chủ.
- Rules đã phát hành/đọc lại khớp; cờ liveops và Sưu tập huy hiệu bật trong
  .env.local. UI mới chưa Hosting/APK/push; chưa đo S22/FPS điện thoại.
  V1 c58ded0/V2 65fcd3f/V3 88a9bd0; nghiệm thu cũ61unit,22UI local,
  6Chrome+emulator, rules/check/build đạt; visual14UI và matrix sau nén
  6case đạt. Lịch412px~271px, nhãn320 không cắt. Receipt lịch sử ở
  EVENTS_MOBILE_FESTIVAL_RECEIPT.md và REWARDS_MISSIONS_EVENTS_IMPLEMENTATION_RECEIPT.md.
- Các kế hoạch Sự kiện/Nhiệm vụ và gameplay đã hoàn tất, được xóa sau khi rà soát29/10. Nguồn hiện hành là CONTEXT, ba tài liệu game và ARCHITECTURE; receipt chỉ giữ bằng chứng lịch sử.

## Rơi vật phẩm, năng lượng và thẻ đặc biệt — hoàn tất28–29/10

- Nguồn contract: `ARCHITECTURE.md` và ba tài liệu game; kế hoạch đã hoàn tất và xóa29/10; P0 được chủ dự án duyệt toàn bộ. Đã hoàn tất P0/D0/D1/L1/M1/T1/T2/Q1, gồm startup mở rộng được duyệt29/10. Receipt duy nhất: `DROP_ENERGY_SPECIAL_CARDS_RECEIPT.md`.
- Chính sách mới: năng lượng đặc biệt80%/thường20%; hỗ trợ độc lập thường5%/đặc biệt10%/Memory Special và Link Blue30% thay nhánh chung; không pity. Pool và Lucky theo P0, Memory tier60/30/10; kho9999, vượt10Xu/đơn vị ở các nguồn trong task. Rương ngoại hình trùng/đủ bộ và fallback chữ100Xu; giữ receipt đã commit cũ.
- Memory Lucky mọi mode,1–3cặp chỉ đợt đầu; Challenge/Endless chỉ màn1/đợt1 của run, Continue giữ quà. Triple Lucky chỉ Challenge15giây; Magnet1/đợt mọi mode, nguyên tử và ưu tiên khay. Giữ Triple30/3 và bảng10quà. Vô tận vẫn nhận hỗ trợ thời gian vào kho; Lucky thời gian đổi10Xu Memory/50Xu Link.
- Checkpoint chính sách2cho bàn mới; thiếu field=1, giữ luật phiên cũ tới hết đợt. Không đổi save keys/formatVersion2, không reset Xu/kho/claim/progress hoặc quà Lucky đã lưu. Ledger cả trượt giữ qua undo; không rơi trên nhóm phá phụ. Rate sự kiện và2Xu/nhóm cơ bản không đổi.
- Check/build,95unit,pack web chức năng và emulator đã có bằng chứng trong receipt. Ngày29/10 chủ dự án duyệt mở phạm vi sửa startup; đã đóng Q1. Cleanup tách root sau khi scope inactive, markup dựng tách rời, presentation/icon theo startup batch có hủy. CPU6x3/3 đạt: start tối đa61.3ms, framep95≤10.1ms, clickp95≤1.3ms/max2.9ms (ngưỡng100/25/75/100). Project `cpu-budget` không trace DOM vẫn thuộc suite mặc định; test chức năng giữ trace. Hồi quy38/38, responsive12/12, check/build và95unit đạt; xem receipt cho baseline/method/giới hạn.
- Chưa đo S22/chơi thật về tiêu hao và mốc/phút; không nhận60FPS hoặc kinh tế cân bằng. Không tự push/deploy/rules deployment/APK. Chủ dự án đã giao rà soát, dọn tài liệu và commit29/10; bằng chứng hiện hành ở GAMEPLAY_ECONOMY_AUDIT.md.

## Điều chỉnh cân bằng bổ sung — 24/10/2026 (đã cập nhật dữ liệu)

- Thử thách theo kích thước bàn: chọn độ khó nhỏ nhất chứa đủ số thẻ, dùng mốc Memory75/110/150/220s hoặc Link/Triple60/90/120/180s mỗi đợt, giữ giờ dư. Ngưỡng Memory/Link12/24/36/60thẻ, Triple27/54/78/120thẻ; trên ngưỡng lớn nhất dùng Siêu khó. Nguồn `calculateChallengeWaveTime` trong `js/progression/waveTiming.js`; phiên cũ giữ ngân sách đã cấp. Thay quyết định Thử thách không đổi của lượt trước bên dưới.
- Vật phẩm tăng giờ mới chỉ còn30/45/60s ở Memory; Triple dùng30s. Bỏ gói10s khỏi cửa hàng và nguồn thưởng Memory mới; mốc thưởng từng cấp10s chuyển sang30s. Giữ key `time10` của kho cũ nhưng mỗi món dùng được30s, chỉ hiện lựa chọn này khi còn tồn kho, không chuyển/xóa số lượng. Không đổi schema/save/catalog ID còn dùng. Xem trước5s, Gợi ý2,5s và các khoản cộng giờ trực tiếp từ thẻ may mắn/Phá Băng/combo giữ nguyên vì không phải vật phẩm tăng giờ trong kho.
- Giá chỉ vật phẩm tiêu hao của cả ba trò: `round(giá gốc × 8 × 90 / 100)` Xu, làm tròn một lần đến Xu nguyên. `CONSUMABLE_PRICE_MULTIPLIER=8` là hệ số gốc, `CONSUMABLE_DISCOUNT_PERCENT=10` là mức giảm; không giảm lần nữa ở UI/giao dịch. Nguồn `calculateConsumablePrice`, `SHOP_ITEMS`, `TIME_ITEM_PRICES` trong `js/shopCatalog.js`. Không đổi giá chủ đề, ngoại hình, hiệu ứng, mở rộng khay hay thưởng Xu.
- Giá hiện hành Memory: +30s360/+45s504/+60s648; Gợi ý1/2/3/5lượt58/108/151/216; Xem trước4/8/12/tất cả58/108/158/216Xu. Link: Gợi ý58/Xáo108/Sấm sét180/Đóng băng30s288Xu. Đóng băng tăng15→30s nên giá gốc tăng theo tỷ lệ2 rồi giảm10% (`160×2×0,9=288`). Triple: Gợi ý58/+30s360/Hoàn tác108/Xáo108Xu; giá30s lấy trực tiếp bảng chung, `timePerSecond=12` là đơn giá suy ra từ gói30s, không áp lại giảm10%.
- Popup thua Memory/Link bán30s360Xu và60s648Xu, cùng giá cửa hàng; Triple chưa có mua giờ khi thua và chủ dự án chốt chưa bổ sung. Khác biệt còn giữ: cộng giờ trực tiếp từ may mắn/Phá Băng có thể dưới30s, thời gian Xem trước/Gợi ý khác tác dụng tăng giờ, từng game có danh sách công cụ riêng. Không tự đồng nhất các phần này.

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

## Nền động — đã bàn giao local, còn QA thiết bị thật

- Giữ ảnh nền hiện có, chuyển động nhẹ ở map/ba game; Home tĩnh khi không có vùng an toàn. Singleton coordinator và scene owner giữ cap/Light/Standard/Static, reduced-motion/hidden/modal/startup/cancel; master setting meteorEffects không đổi.
- Bản đồ đã bật đèn/đom đóm rõ hơn, gợn hồ và ếch sau khi chủ dự án duyệt; ba game không tăng mật độ. Layout/crop dọc/ngang, hull đường/node/khay/HUD/quảng cáo giữ vùng tránh.
- G0–G5/M1–M2 đã hoàn tất; không còn plan active. Nguồn contract: ARCHITECTURE; bằng chứng A/B/soak/cleanup: ANIMATED_BACKGROUNDS_IMPLEMENTATION_RECEIPT.md. Các số desktop/RAF không phải S22/GPU vật lý/pin/nhiệt; ngang do chủ dự án kiểm. Không mở lại polish effect như gate runtime.

## Hồ sơ, âm thanh và vòng đời giao diện

- UID dùng Firebase hiện có, rút gọn hiển thị6đầu…4cuối, copy toàn bộ; không cấp mã riêng. Tên/bút sửa tại chỗ; chọn lại avatar/khung/huy hiệu để bỏ trang bị. Public projection giữ danh sách ID, không thay điểm xếp hạng.
- Avatar52px trên thanh tên mở Hồ sơ và pause/resume qua owner, không tạo ván mới. Popup màn dùng MànN-ĐợtN; preview bản đồ hiện MànN theo yêu cầu29/10. Khung header/ví/dock và điều hướng hiện hành ở mục Menu.
- Nhạc không khởi động lại giữa đợt. open_box dùng khi mở nắp; reward cho quà; coin_drop khi thu Xu; unlock_1 khi mở băng. Các voice/effect có scope/cancel/hidden/mute, callback không cấp tài nguyên. Đóng băng Link hiện30giây, không dùng ghi chú15giây cũ.

## Quy tắc bàn giao và tài liệu

- AGENTS.md quản workflow, README/ADD_GAME quản chạy và tích hợp; sửa source generator rồi sinh output. Không đổi schema/save/catalog/effect ID ngoài phạm vi được giao.
- Chỉ test/build khi rủi ro cần, không sau mỗi chỉnh sửa; gom commit theo phase. APK/push/deploy cần yêu cầu riêng. Không xóa cache/dist/node_modules/QA chỉ vì dọn kế hoạch.
- Receipt kỹ thuật/UI là bằng chứng tại thời điểm nghiệm thu, có thể chứa tên Đom Đóm/giá hoặc trạng thái cũ. Contract hiện hành ở phần trên và ARCHITECTURE/ba tài liệu game; không dùng prompt triển khai lịch sử làm lệnh mới.
- Giữ hạn chế S22, quảng cáo/provider/Google OAuth thật và dữ liệu chơi thực tế. Khi có task mới cần kế hoạch, tạo một plan cho task đó và chỉ rõ tại đây; không phục hồi plan đã đóng.
