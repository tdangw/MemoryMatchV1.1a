> Hồ sơ nghiệm thu lịch sử. Tên hiện hành: **Sưu tập huy hiệu** (28/10/2026).
> Quyết định đang áp dụng ở CONTEXT.md; các tên/quyền phát hành cũ bên dưới chỉ ghi lịch sử.

# Nghiệm thu Sự kiện, Nhiệm vụ và Kho rương — 27/10/2026

> Mở lại phần mỹ thuật: chủ dự án gửi ba ảnh tham chiếu và xác nhận UI
> chưa đúng kế hoạch. Các kết quả P0–Q1 sau đây vẫn là bằng chứng chức năng,
> không phải bằng chứng khớp mỹ thuật. V1–V3 đang xử lý theo cùng plan.

## Phạm vi và quyết định

Nguồn: CONTEXT.md, P0–Q1; commit riêng từng phase.
Giữ điểm danh/weekly/quota wheel/recipe/bán/ghép/rương bản đồ/300 Xu/sáu effect.
Không đổi save key hoặc formatVersion 2; mở rộng model có version và capability
riêng, không tự deploy rules/Hosting/APK/push. Không sửa task drop/năng lượng.

P0: người dùng duyệt toàn bộ đề xuất còn thiếu qua câu hỏi trong chat.
50/100 Xu ở mốc 25/50; hỗ trợ chọn đều trong subpool mục 4; đầy 999 giữ
rương và candidate; pool ngoại hình Thành tích/chữ/event bỏ starter/effect;
loại rương chữ cố định theo từng bộ (đính chính bên dưới); trong ván chỉ xem; SVG tĩnh khu vườn đêm.

## Phương án

- Giữ service/CAS/persistence queue và renderer hiện có, tách owner theo
  trang/tab/kho; loại hệ quest hoặc queue kinh tế mới vì trùng quyền thưởng.
- State rương bốn counter, kết quả cuối và festival earned/cycle/mask có
  kích thước cố định; loại document/mảng theo từng rương/vòng vì tăng I/O.
- SVG/CSS tĩnh dùng token skin, không thêm animation loop hay bitmap.

## Tiến độ

- P0: đã duyệt và ghi nhận, chỉ rà diff tài liệu; không chạy test.
- U1/U2/U3/D1/D2: đã triển khai và commit riêng. Q1 hoàn tất phạm vi mã nguồn/web local; bằng chứng và giới hạn ở cuối.

U1: tách owner tab Sự kiện, tablist/tabpanel bàn phím và view con Kho rương trong Bộ sưu tập. Capability festival/chest riêng mặc định tắt đến khi rules tương ứng được phát hành. Kiểm cú pháp các owner và diff đạt; tích hợp dữ liệu/UI/lifecycle kiểm ở Q1.


Đính chính P0 sau trao đổi: bỏ 12 slot/cursor. Chủ dự án duyệt mapping
cố định MEMORY MATCH→Avatar, LINK CONNECT→Khung, TRIPLE CONNECT→Huy hiệu,
ADVENTURE→Avatar. Mỗi bộ đổi một rương đúng loại; bảng bên trong giữ nguyên.

U2: wheel theo kích thước thật, hub tĩnh; 4 recipe và 17 chữ button, sheet
bán có số lượng/tổng Xu; Kho rương 4 card và chi tiết tỷ lệ/chọn trò/gallery
12 món/trang. Kiểm cú pháp/diff đạt; tích hợp command và kiểm UI ở D1/Q1.

U3: Nhiệm vụ hai tab, lịch 4+3 luôn hiện, đúng trạng thái sau ngày 7/nhận/bỏ ngày; thẻ catalog, tiến độ/bonus/weekly/điểm danh, countdown UTC một timer UI dừng khi ẩn và refresh kỳ mới có khóa chống lặp. Giữ guard ván chơi, stale UID. 13/13 unit nhiệm vụ/Spark đạt; giao diện/lifecycle kiểm chung Q1.


D1: model version mở rộng tương thích, 4 counter earned/spent + sequence/result, festival earned/cycle/mask, command nhận/mở nguyên tử qua CAS/queue hiện có. Candidate ghi bền trước transaction; đầy 999 giữ pending; ownership grant UID+itemID riêng. Hỗ trợ cập nhật kho và RAM cùng commit. Rules sửa từ template/generator, dispatch chuyên biệt giữ quota/invariant trong ngân sách1000. 46/46 unit đạt. Hai suite Firebase emulator đạt: regression cũ và migration/130/claim mọi thứ tự/4 recipe/4 loại/race rương cuối/recovery/deny owner-counter-cycle. Suite mới21 publication:124reads/83writes/28.733bytes; chỉ đo emulator. Log runtime/qa/events-d1-*.log; không đưa log/test tạm vào commit.


D2: Thành tích mới lưu chestType riêng, không trở thành ownership; grant cũ
(kể cả chưa announced/backfill) và sáu effect giữ nguyên. Watermark bốn
source counter cấp rương một lần qua publication, không document/receipt
mỗi vòng. Bốn bộ chữ theo mapping cố định được duyệt. Lễ hội có đủ road
25/50/75/100 và entry kho chung. Đom đóm SVG dùng loot owner/cap12/timeline
và reduced-motion sẵn có, chỉ phát sau durable commit và hủy theo round.
Không thêm loop hoặc allocation mỗi frame; không thay gameplay task năng lượng.
9/9 unit nguồn/kinh tế mới đạt; emulator nguồn+chest22 publication đạt
(130reads/87writes/30.934bytes). Cú pháp/diff đạt; UI tích hợp kiểm ở Q1.

## Q1 — rà soát độc lập và sửa lỗi

Sau yêu cầu chia việc, hai sub-agent đọc độc lập economy và UI/lifecycle;
sub-agent thứ ba bổ sung test biên. Các phát hiện đã được xử lý:

- Queue snapshot cũ không ghi đè hỗ trợ vừa commit: bù delta theo game/item
  trong queue hiện có; epoch mới loại snapshot trước reset/import/đổi dữ liệu.
  Loại phương án viết lại toàn bộ command kho vì rộng hơn task.
- Nếu snapshot mua hàng chờ làm tổng vượt 999, từ chối toàn bộ snapshot,
  giữ quà đã commit và Xu; cơ chế bảo vệ ghi hiện hữu yêu cầu tải lại dữ liệu.
  Không cắt quà hoặc chuyển Xu ngầm.
- Kiểm pool đúng loại trước quy đổi đồ trùng; candidate phiên bản chưa biết
  giữ nguyên để cập nhật ứng dụng, không xóa rồi bốc lại.
- Chỉ view đã xác nhận online mới mở quyền nhận; cache/lỗi reconnect chỉ xem.
  Kiểm UID sau hoạt ảnh cũng dùng identity đã capture, không hiện quà UID cũ.
- Pending kho đầy khóa loại/trò nhận quà ở cả card lẫn nút xác nhận; pool
  khác vẫn xem được. Kết quả canonical cuối luôn có nhãn Lần mở gần nhất.
- Back giữ scroll Bộ sưu tập; tab focus không kéo scroll; entry kho cập nhật
  theo commit kể cả khi đã Back trước khi mở xong.
- Giảm render trùng sau response; rotor dùng lại, không dựng nhãn lại theo status.
  Grid17 tách khỏi card lồng để giữ 48px; ô chữ có owner chrome riêng theo token.
  Nút điểm danh nằm dưới lịch để không bị hẹp ở 320px.

Skill thực sự ảnh hưởng: clarify-ambiguous-requirements giúp chốt P0 và sửa
cách hiểu thưởng chữ; không dùng imagegen vì toàn bộ hình mới là SVG/CSS.

### Phát hành và giới hạn

Không deploy rules/Hosting/APK/push. Cờ `VITE_FESTIVAL_CHESTS_ENABLED=1` chỉ
bật khi rules source tương ứng đã được phát hành ở môi trường đó. Cờ liveops
cũ không tự bật festival/chest. Nhiệm vụ/wheel/chữ baseline tiếp tục hoạt động
khi môi trường chưa bật capability mới. Giữ save key/formatVersion2/catalog
ID và public API hiện hữu; thêm field/command có validation, không reset đồ.

Chưa có máy S22 thật; không chứng nhận 60 FPS mobile, Google OAuth/provider
quảng cáo thật hay hành vi live. Các ảnh QA là UI thật của component trên
Chrome với fixture cho matrix hình ảnh; suite online riêng dùng service thật
với Auth/Firestore emulator. Test/log/ảnh nằm local trong vùng ignored theo
quy định repository, không đóng vào commit ứng dụng.

### Kết quả nghiệm thu cuối

- `node --test`: **61/61 đạt** qua 10 file logic/persistence, gồm test biên
  sub-agent và queue shop/spend/rollback/capacity/reset/restore mới.
  Log `runtime/qa/events-q1-unit-acceptance.log`.
- **22 kịch bản UI local đạt** (17 Nhiệm vụ/Sự kiện/Kho rương/Bộ sưu tập,
  5 drop/feedback). Matrix gồm 320/360/412/1024 và 844×390 chữ lớn, năm
  skin, vùng chạm48px, keyboard, offline/reconnect thất bại, scroll,
  pending khác loại, quà Thành tích mới/cũ, 20–30 chu kỳ và reduced-motion.
  14 case trong suite UI chính, 3 case bổ sung ở suite scroll/offline/rewards;
  3 drop ban đầu đạt, 2 case yêu cầu cờ runtime đã bật lại và chạy đạt,
  không lấy skip làm pass. Log `events-q1-ui-{acceptance,scroll,offline,rewards,pools,smoke}.log`
  và `events-q1-drop-{ui,persistence-ui}.log` trong `runtime/qa`.
- **6/6 Chrome + Auth/Firestore emulator đạt**, có service thật:
  flush earned offline, 4 recipe cố định, kho999 giữ candidate, RAM đúng,
  Back trước commit cập nhật số kho, replay không cấp lại, UID đổi giữa
  hoạt ảnh đã commit, interruption/reload, stale backup và 20 chu kỳ
  status không tăng revision. Hai suite rules cũ/mới cũng đạt trong cùng
  `runtime/qa/events-q1-emulator-acceptance.log`; không sửa ngưỡng/luật
  để pass. Helper tracked `scripts/check-festival-emulator.mjs`.
- `node scripts/generate-liveops-model.mjs --check`: đạt.
- `npm run check`: exit0 (`runtime/qa/events-q1-final-check.log`).
- `npm run build`: exit0 (`runtime/qa/events-q1-build-delivery.log`).
- Review diff cuối: không tài nguyên tạm/log/ảnh/test ignored trong commit;
  không đổi task DROP_ENERGY_SPECIAL_CARDS_PLAN, không deploy/APK/push.

Số đo giới hạn Chrome desktop: 30 vòng UI, DOM1411→1413, listener120→117,
mount p95≈33,1ms, frame p95≈40,5ms và 1 long task56ms trong thao tác đổi
trang/tab dồn dập. Đây không phải FPS gameplay hay A/B chuẩn; không gán
pass60FPS mobile. Đã bỏ render response trùng và giữ rotor; cần đo S22
thật cho ngân sách điện thoại. Mẫu quay GPU riêng không có long task,
log `runtime/qa/rewards-liveops-spin-measurement.json`, cũng chỉ desktop.

Pool được lấy từ catalog rõ nguồn:38avatar/38khung/22huy hiệu, không
starter/effect; các món chọn đều. UI xem cả hỗ trợ theo trò, tỷ lệ nhóm,
quy đổi trùng/đủ bộ và kết quả cuối. Thành tích chưa grant hiện đúng tên
rương, grant legacy giữ ảnh/tên món; preview không hứa chắc ngoại hình.

Commits phase trước Q1: P0 `13cde67`, U1 `8c4d5fb`, U2 `f71e697`, U3
`2ce996b`, D1 `ed57c02`, D2 `8e63e8d`. Q1 chứa sửa từ review và hồ sơ
nghiệm thu này. Toàn bộ P0–Q1 hoàn tất trong phạm vi local đã giao.

## Phát hành rules được duyệt bổ sung 27/10/2026

Chủ dự án cho phép riêng rules để thử Lễ hội. `firebase deploy --only
firestore:rules --project memorymatchv1-1a --non-interactive` exit0; đọc lại
release cloud.firestore bằng scripts/verify-deployed-firestore-rules.mjs đạt.
Ruleset e539def1-4498-42b6-8e2f-fa6417ab32b9; SHA256
d4f2f15a8c3135441adaf8e3883a5a70675fafad7651d191e9470a26a8f1619d.
Đã bật cờ festival/chest trong .env.local (ignored) để thử web local. Không
Hosting/APK/push, không tạo tài khoản hoặc grant thử trên dữ liệu live.
Luật vòng lặp vẫn ở code, state hữu hạn; không Functions/Scheduler/Blaze.

V1 mỹ thuật: đã chốt ảnh là tham chiếu bố cục, phối màu/chất liệu theo từng skin. Chuẩn bị wheel SVG80node không filter/loop; palette local và header/ví duy nhất, không nạp Xu, không đổi chrome toàn app. So sánh giữ geometry modal cũ với cô lập surface hai trang: chọn cô lập local để không bị parchment/ribbon ép bố cục nhưng vẫn giữ vật liệu skin. Kiểm cú pháp/diff; đối chiếu ảnh thật ở V3 sau tích hợp V2.


V2 mỹ thuật (28/10): tích hợp lịch 4+3, hàng nhiệm vụ icon/nội dung/CTA,
thưởng trọn bộ, wheel SVG có rim/hub/pointer và CTA riêng, một bộ chữ đang
chọn/kho chữ 4 cột/thao tác ghép-bán; tab Lễ hội luôn hiện với đường mốc
và trạng thái chưa tải trung thực. Giữ API, save, service, reducer và luật
thưởng. Review độc lập logic không phát hiện lỗi; review CSS bắt và sửa
cascade nút cùng tương phản canvas Cổ tích/Papercut, focus nút đã chọn.
Unit điểm danh 1/1, UI lần đầu 13/13; V3 kiểm lại sau chỉnh CSS và đối
chiếu ảnh thật, không lấy kết quả chức năng làm bằng chứng khớp mỹ thuật.

## V3 — nghiệm thu mỹ thuật web local 28/10/2026

V1 `c58ded0`, V2 `65fcd3f`; phase V3 gồm sửa finding từ review và hồ sơ
nghiệm thu. Đã đối chiếu ảnh ba tham chiếu với UI thật, gồm popup và trang
mở từ dock. Năm skin giữ chất liệu/màu riêng; không ép tất cả thành navy.
Reviewer độc lập đã kiểm logic và ảnh, finding đã sửa: cascade làm mất màu
CTA, tương phản canvas Storybook/Papercut, focus của nút đang chọn và icon
cúp nhạt. Nén lịch từ khoảng363 xuống271px trên trang412px; vẫn đủ bảy
ngày, số Xu, trạng thái, nút48px. Ba nhiệm vụ xuất hiện trước dock; thưởng
trọn bộ và thao tác kho chữ phía dưới vẫn cuộn tới được.

Bằng chứng (runtime/qa, ignored, không đưa vào commit):
- Unit điểm danh1/1; cú pháp presentation/missions đạt.
- UI14/14: events-visual-v2-cascade-suite.log; năm skin,320/360/412/844
  chữ lớn/1024, vùng chạm48px, keyboard/focus/scroll, claim/recipe/sell,
  offline và30chu kỳ lifecycle. Dock thật có một header/ví/nút đóng/dock.
- Sau nén CSS: matrix/dock6/6 (events-visual-v2-compact.log), preview khi
  chưa có dữ liệu Lễ hội và gallery2/2 (events-visual-v2-unknown.log), ảnh
  phần dưới1/1 (events-visual-v2-bottom.log). Không bịa vòng/điểm khi chưa
  có snapshot; cả bốn nút nhận bị khóa.
- Ảnh cuối: runtime/qa/events-visual-v2/, default/storybook/papercut cho
  missions/wheel/letters/festival, ảnh320 và844 chữ lớn; thêm hai ảnh
  missions-bottom/letters-bottom412. Reviewer xác nhận nhãn320 không cắt.
- npm run check exit0: events-v3-final-check.log. Lần đầu khi Chrome đang
  chạy vượt microbenchmark Triple20,71>20ms; chạy lại khi Chrome dừng đạt,
  không sửa benchmark hoặc logic Triple. Sau chỉnh CSS chỉ chạy lại gate
  ownership và UI đúng phạm vi; đều đạt.
- npm run build trên source cuối exit0: events-v3-final-build.log. Hai
  cảnh báo VITE_PUBLIC_ASSET đã có ở build Q1; output cuối không còn literal
  marker đó. Không phát sinh thay đổi generated file hoặc dependency.

30chu kỳ desktop fixture: DOM1411→1413, listener120→117; mount p9552,1ms,
frame p9561,1ms, long task52/53/68ms khi dồn mở/đổi tab. Đây là kiểm stress
mount UI, không chứng minh60FPS hoặc số đo điện thoại. Chưa xác minh S22.
Không đổi service/reducer/model/API/schema/save ở V1–V3. Rules đã phát hành
riêng theo phê duyệt ở trên, cờ Lễ hội bật cho web local; Hosting/APK/push
chưa thực hiện. Giữ task nền/năng lượng ngoài phạm vi và không stage log,
ảnh QA, test ignored hoặc tài nguyên thử. V1–V3 hoàn tất trong phạm vi web.

## Đổi sang Sưu tập huy hiệu — 28/10/2026

Theo yêu cầu chủ dự án, đổi toàn bộ tên/đơn vị sự kiện đang hiển thị:
Sưu tập huy hiệu, mốc25/50/75/100huy hiệu, thông báo chưa đủ và hướng dẫn.
SVG collection-badge riêng có huy chương vàng, hai thẻ ghép, lõi xanh và
dải ngọc; thay icon đom đóm trên trang và loot nhận khi ghép. Catalog đổi
tên series từ source cosmetic-extras rồi chạy generator; giữ nguyên ID,
ảnh/tên món ngoại hình đã có. Đom đóm trang trí trong nền không thuộc token.

Cân nhắc đổi cả schema/ID với migration hoặc chỉ đổi lớp trình bày: chọn
lớp trình bày để giữ toàn bộ số đã kiếm, vòng, mốc đã nhận và rules đã phát
hành. Giữ fireflyEarned/festival/claimFestival/ID/cờ cũ theo ghi chú CONTEXT;
không phát sinh migration, write hoặc deploy. Tỷ lệ rơi100% để thử, phần
thưởng và cơ chế giữ dư/sang vòng không đổi.

CONTEXT đã gộp chính sách hiện hành, loại các ghi chú triển khai cũ xung
đột (12slot/chưa duyệt Xu/chưa triển khai/chưa phát hành rules). Xóa hai
kế hoạch đã xong EVENTS_MOBILE_FESTIVAL_PLAN.md và REWARDS_MISSIONS_EVENTS_PLAN.md;
sửa liên kết liên quan sang CONTEXT, đánh dấu receipt là bằng chứng lịch
sử. Giữ DROP_ENERGY_SPECIAL_CARDS_PLAN.md vì chưa triển khai, chỉ đồng bộ
tên token/nguồn context; không áp các tỷ lệ gameplay mới trong lượt này.

Kiểm tra đúng rủi ro: 231module JS parse đạt; generator rules --check đạt
và không đổi firestore.rules; UI5/5 đạt gồm320/412 năm skin, nhận mốc theo
thứ tự khác nhau/sang vòng, trạng thái unknown và30chu kỳ loot cả normal/
reduced-motion. Ảnh412 đã xem: tab hai dòng, icon riêng và đơn vị mốc đúng,
không tràn. Log runtime/qa/badge-collection-ui.log, ảnh gallery ignored.
Không chạy lại fullcheck/build cho thay đổi tên/icon/tài liệu; không
Hosting/APK/rules/push. Không thay API/schema/save/catalog ID hoặc luật rơi.

Review độc lập xác nhận không đổi tiến độ/luật thưởng hoặc link plan bị
xóa; đã sửa hai finding tài liệu: bỏ đoạn Spark cũ mang nhãn hiện hành
và đồng bộ tên sự kiện ở ghi chú adapter của kế hoạch gameplay còn chờ.
