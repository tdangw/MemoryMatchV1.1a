# Nghiệm thu Sự kiện, Nhiệm vụ và Kho rương — 27/10/2026

## Phạm vi và quyết định

Nguồn: EVENTS_MOBILE_FESTIVAL_PLAN.md, P0–Q1; commit riêng từng phase.
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
