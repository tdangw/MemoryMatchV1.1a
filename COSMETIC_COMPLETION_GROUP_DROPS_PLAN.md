# Rương ưu tiên ngoại hình chưa có và rơi quà theo nhóm thẻ

Ngày30/10/2026. **Đã được giao triển khai toàn bộ, commit từng phase.**
Đây là nguồn phạm vi duy nhất của task. Quà tặng bất ngờ đã hoàn tất;
giữ nguyên luật và bằng chứng trong `HOURLY_GIFT_RECEIPT.md`.
Không tự deploy Hosting/rules hoặc tạo APK.

## 1. Quyết định đã chốt và phạm vi

Chủ dự án giao lập kế hoạch theo hướng rương ưu tiên món chưa có, bổ
sung rơi từ thẻ thường và chốt chính xác bảng sau. Các tỷ lệ đề xuất
trước5%/1%/10% và30%/5%/100% không còn là mục tiêu của task này.

| Nhóm ghép hợp lệ | 1 chữ ngẫu nhiên | 1 vé quay | 1 huy hiệu thu thập |
|---|---:|---:|---:|
| Thường | **5%** | **2%** | **6%** |
| Đặc biệt / Lucky / Magnet | **25%** | **10%** | **30%** |

- Áp dụng cả Memory Match, Link Connect, Triple Connect và các mode có
  gameplay thưởng hiện hành. Đơn vị là một cặp/bộ ba, không từng thẻ.
- Ba nhánh độc lập: có thể trượt hết, nhận một hoặc nhiều loại cùng
  nhóm; không diễn giải thành ba nhánh loại trừ hoặc tổng100%.
- Chữ chọn đều17loại, bán10Xu/chữ; công thức ghép/bán/đổi bộ giữ nguyên.
  Vé tích lũy, mỗi vé một lượt, riêng free/ad quota, không hết hạn.
  Huy hiệu thu thập dùng cho Sưu tập huy hiệu, không phải ngoại hình
  huy hiệu trang bị Hồ sơ. Không thêm cap ngày hoặc hết hạn.
- Nhóm Special/Lucky/Magnet chỉ được phân loại một lần dù có nhiều dấu
  đặc biệt. Thẻ thường trúng quà không đổi cờ thành đặc biệt.
- Rương ngoại hình giữ20% nhánh ngoại hình; trúng thì chọn đều trong
  món chưa sở hữu của loại rương. Nhánh Xu/hỗ trợ giữ nguyên. Đủ pool
  của loại đó đổi thẳng100Xu. Rương C và hỗ trợ tiêu hao giữ nguyên.
- Giữ năng lượng80%/20%; hỗ trợ5%/10%/Memory Special–Link Blue30%, các
  mốc thưởng, Lucky/Magnet,2Xu/nhóm, giá shop, kho9999 và overflow10Xu.
  Không gộp bảng rơi mới với xác suất tiếp tế/năng lượng.

Hoàn thành lập kế hoạch: xác suất/ownership/lưu thưởng/đường hiển thị
đã chỉ rõ, có phase và acceptance. Hoàn thành triển khai chỉ sau khi
được giao code và các cổng dưới đây có bằng chứng; không coi plan là
chức năng đã chạy hoặc dịch vụ thật đã nhận chính sách mới.

## 2. Hiện trạng và lựa chọn kỹ thuật

Hiện code đang là chữ30%, vé5%, huy hiệu100% thử trên nhóm đặc biệt;
nhóm thường bị chặn sớm ở `applySpecialDrop`. Rương đang chọn cả món
đã sở hữu trong pool, sau đó quy đổi trùng. Giá bán chữ10Xu và tương
thích receipt1000Xu đã được triển khai ở `c37c11b`, không làm lại.

| Cách làm | Đánh đổi | Kết luận |
|---|---|---|
| Tăng tần suất nhánh ngoại hình hoặc thêm bộ đếm bảo đảm | Không trực tiếp giải quyết trùng món cuối; pity thêm state/rules/migration | Không chọn |
| Lọc pool chưa có, giữ20% và transaction hiện hữu | Mỗi lần trúng có tiến độ mới, dùng ownership đã có, không bộ đếm mới | Chọn |
| Đánh dấu mọi nhóm thường thành special để dùng luồng cũ | Sai phân loại, kéo theo sai năng lượng/tiếp tế/thành tích | Không chọn |
| Bảng tỷ lệ theo nguồn cho hai nhóm, giữ adapter/ledger hiện hữu | Cần mở nhánh normal và feedback, không cần ba hệ drop riêng | Chọn |

Không thêm reward engine, backend/Functions/scheduler, document từng
rương/lượt ghép hoặc nguồn state song song. Chỉ gom xác suất vào config
có owner; giữ tên export/key kỹ thuật cũ nếu có call site đang dùng.

## 3. Luật rương ưu tiên chưa sở hữu

1. Bắt đầu mở theo service hiện hữu, đọc ownership canonical của UID.
2. Lấy pool đúng loại rương từ whitelist hiện hành. Tạo danh sách món
   chưa có; không thay pool bằng mọi ảnh hoặc thêm món starter/effect.
3. Nếu danh sách rỗng, bốc kết quả cố định100Xu như full pool hiện tại,
   không bốc lại category. Rương C không đi qua nhánh này.
4. Nếu còn món: bốc category theo bảng hiện tại; chỉ khi ra ngoại hình
   mới chọn đều một ID trong danh sách chưa có. Xu/hỗ trợ không đổi.
5. Lưu candidate bền trước transaction, dùng lại qua lỗi/mất phản hồi.
   Giữa bốc và commit nếu món đã được nhận từ nguồn/máy khác, vẫn đổi
   trùng100Xu, không reroll. Không ghi đè quà đã bốc bằng món mới hơn.
6. Giảm một rương, grant quyền thưởng, cập nhật last/sequence/ví/kho cùng
   CAS/transaction hiện có; trình bày sau commit, không auto-equip.

Candidate/receipt cũ giữ đúng kết quả, kể cả món trùng đã bốc; chỉ lần
mở mới dùng cách chọn mới. Không xóa món cũ, số rương, điểm sự kiện hoặc
schema để bắt đầu lại. Không thêm field unowned/pity vào save: trạng
thái chưa có dẫn xuất từ catalog + ownership canonical. Nếu pool thêm
món mới, trạng thái full tự hết như contract hiện hành.

UI công khai: “Khi trúng ngoại hình, ưu tiên món bạn chưa sở hữu.” Giải
thích riêng trường hợp quà đã bốc trở thành trùng trước commit và quà
legacy. Không ghi “mở5rương chắc chắn có món” hoặc “mỗi rương có món mới”.
Xem quà vẫn cho xem cả pool, có đã sở hữu/chưa có;20% là xác suất cho
cả nhóm ngoại hình. Nếu cònU món, xác suất mỗi món trong lần mở mới là
20%/U, không20% mỗi món. Đủ bộ hiện rõ đổi100Xu.

## 4. Rơi chữ/vé/huy hiệu ở cả hai nhóm

### Giải quyết và chống cấp lặp

- `dropAdapters.js` tiếp tục gửi nhóm thường với special=false, nhóm
  đặc biệt=true và ID gốc. Memory/Link đã gửi group cho mọi cặp; Triple
  đã gửi nhóm fresh. Không đổi type thẻ hoặc dùng vị trí sau gravity.
- `sparkModel.js::applySpecialDrop`: bỏ chặn toàn bộ normal, chọn từng
  xác suất đúng bảng mục1. RNG riêng cho vé, chữ, huy hiệu; chữ chỉ bốc
  ID sau khi trúng nhánh. `applyTicketDrop`/flag dropLetters/dropFireflies
  vẫn giữ ngữ nghĩa, nguồn tắt không được phát quà hoặc tăng counter.
- Ghi marker cả trúng lẫn trượt theo attempt/wave/group. Trước sửa xác
  nhận ledger cũ đủ chỗ khi ghi normal: marker1000nhóm/đợt; validator
  snapshot cặp cho phép tới60cặp, Triple config120thẻ=40bộ ba, đều dưới
  cap. Kiểm generator/mode thực tế trước code, không tăng cap vô hạn.
- Không cấp hồi tố các nhóm đã ghép. Reload/retry cùng group không lấy
  RNG mới; Triple undo ghép lại hoặc trộn thẻ đã xử lý không cấp lại.
  Giữ ledger gameplay cả trượt và guard freshTileIds; không chỉ dedup
  theo tổ hợp thẻ mới nếu có thể farm cùng thẻ qua undo.
- Chỉ nhóm thủ công hợp lệ; Magnet do người chơi chọn tính một nhóm.
  Phá phụ bởi Red/mốc/Sấm sét không bốc tiếp, không chain. Không phát
  quà trong tutorial/preview/simulation không có quyền thưởng hiện tại.
- Nhận bền ngay khi ghép, vẫn giữ nếu sau đó thua/rời ván/offline.
  Marker, letterEarned/ticketEarned/fireflyEarned đi cùng snapshot/coins/
  board/session trước feedback. Không ghi riêng từng nhánh hoặc mỗi frame.
- Giữ key `fireflyEarned`, `festival`, quota, source ID/formatVersion2.
  Không reset huy hiệu đang có khi30% thay100%; rate mới chỉ áp dụng
  lần bốc mới. Drop hụt không tăng earned hoặc tạo mạng riêng.

### Feedback và hiệu suất

Các controller đang chỉ chuẩn bị `onSpecialDrop` khi special=true.
Chỉ mở RNG normal sẽ khiến quà vào kho nhưng không thấy rơi. Phải nối
feedback cho cả hai nhóm của ba trò, giữ public callback cũ nếu còn dùng.

- Feedback chỉ hiện quà thật sau commit; miss không sinh node/âm/thông
  báo giả. Origin thẻ/khay được lấy theo vòng đời còn hợp lệ, không dựa
  DOM đã detach hoặc tọa độ cũ sau gravity.
- So sánh reuse rect đã có với lazy capture sau commit trước khi controller
  gỡ thẻ; chọn cách đúng lifecycle, không tự thêm getBoundingClientRect
  trên mọi lượt miss. Không đọc layout xen kẽ nhiều lần ghi style.
- Dùng owner/cap12/timeline/reduced-motion hiện hữu; cả3loại cùng trúng
  cộng với năng lượng/hỗ trợ/mốc vẫn không vượt ngân sách. Hủy scope/
  round cũ chỉ hủy hình, không hủy quà đã lưu. Không ảnh bitmap mới.

## 5. Đánh giá cân bằng và mô hình so sánh

Với Nnhóm thường và Snhóm đặc biệt mới hợp lệ:

- Chữ kỳ vọng=`0,05N+0,25S`; Xu nếu bán hết=`10×số chữ`.
- Vé kỳ vọng=`0,02N+0,10S`; vòng quay hiện kỳ vọng15Xu/vé, không chắc
  nhận15Xu ở mỗi lần và không tự quay/tiêu vé khi rơi.
- Huy hiệu kỳ vọng=`0,06N+0,30S`; không phải30% hiện chỉ để thử nữa.

| Scenario100nhóm:90thường/10đặc biệt | Code trước task | Sau kế hoạch |
|---|---:|---:|
| Chữ | 3 | 7 |
| Xu nếu bán hết chữ | 30 | 70 |
| Vé | 0,5 | 2,8 |
| Xu quay dài hạn từ vé | 7,5 | 42 |
| Huy hiệu thu thập | 10 | 8,4 |

Đây là giả định mô hình, không tỷ lệ sinh thẻ hoặc telemetry. Huy hiệu
tổng không nhất thiết tăng khi thêm normal: đặc biệt100%→30% làm nhịp
ở scenario này giảm16%. Không đổi mốc/đẩy rate lên lại để bù theo cảm giác.
Xác suất ít nhất một quà: normal≈12,486%, đặc biệt52,75%; cả ba nhánh
cùng trúng lần lượt0,006% và0,75%. Không dùng tổng% làm xác suất chung.

| Hoàn tất ngoại hình từ kho trống, chỉ rương cùng loại | Hiện tại | Ưu tiên chưa có |
|---|---:|---:|
|38Avatar|≈803rương|≈190rương|
|38Khung|≈803rương|≈190rương|
|22Huy hiệu trang bị|≈406rương|≈110rương|

Công thức cũ `N×H(N)/0,2`, mới `N/0,2`; không là trần bảo đảm hoặc số
rương cần khi đã sở hữu một phần. Không tự tăng20% ngoại hình cùng lúc.
Sau triển khai đo quà nhận/dùng/tồn, mốc/phút và tiến độ bộ/phút theo
trò/mode; giữ số liệu PC và S22 riêng. Không thêm telemetry trả phí,
không tuyên bố đạt cân bằng từ phép tính kỳ vọng.

## 6. Owner, dữ liệu và công việc đồng thời

| Owner dự kiến | Thay đổi khi được giao triển khai |
|---|---|
|liveops/config.js, chestConfig.js|Bảng tỷ lệ rõ cho normal/special; giữ export giá chữ10, key kỹ thuật cũ và bảng quà rương|
|liveops/chests.js|Chọn từ pool chưa có khi bốc mới; giữ canonical commit/legacy candidate/replay|
|liveops/sparkModel.js, dropAdapters.js|Ba nguồn rơi ở hai nhóm, marker cả hụt, fresh/flag/auto-removal guards|
|logic.js, Link/Triple controller, letterDropFeedback.js|Feedback normal và special sau commit, đúng origin/cap/cleanup|
|liveops/chestPresentation.js, presentation.js, hướng dẫn ba trò|Giải thích tỷ lệ/ưu tiên chưa sở hữu, giữ layout/ARIA/skin|
|scripts/analyze-game-economy.mjs, check-letter-policy.mjs|Mô hình hai nhóm, biên RNG mới, normal không còn bị chặn toàn bộ|
|CONTEXT, ARCHITECTURE, ba tài liệu game|Chuyển từ baseline cũ sang luật mới chỉ sau triển khai; plan chỉ là tương lai|

Không mặc định sửa service/cloudStore/persistence hoặc schema. Kiểm
invariant trước, chỉ sửa owner chung nếu có bằng chứng cần; giữ root/
snapshot/CAS/UID guard. Mở rương theo nguồn hiện hữu, không tự mở trong
ván. Firebase free, không thêm Functions/SSV/Scheduler hoặc migration
vì thay tên/màu/type thẻ. Nếu bắt buộc mở rộng dữ liệu, trình bày mapping
và tương thích trước code, không tự tăng version làm mất tiến độ.

Task quà60phút đang sửa sparkModel/service/rules/generator. Không cho
hai agent sửa cùng owner đồng thời: thống nhất ranh giới/đợi phase chung
ổn định, đọc lại diff trước tích hợp. Không stage/commit cả các hunk quà
theo giờ khi chỉ triển khai task này. Rules là generated output; thay
nguồn rồi sinh, kiểm cả hai nguồn thưởng sau tích hợp, không sửa tay.

## 7. Phase và tiêu chí nghiệm thu cho lượt triển khai

|Phase|Phạm vi|Cổng đạt|
|---|---|---|
|P0|Đóng băng bảng mục1, mapping source/call sites và ranh giới quà60phút|Không hỏi lại các tỷ lệ đã chốt; phân biệt kế hoạch với runtime hiện tại|
|C1|Rương ưu tiên chưa có và mô tả quà|Không chọn món đã có ở candidate mới, trừ trường hợp sở hữu đổi sau bốc; full/legacy/replay đúng|
|D1|Bảng normal/special, RNG và marker ba nguồn|Đúng biên5/2/6 và25/10/30%, không bốc lại/chuyển loại/chain|
|V1|Feedback ba trò, hướng dẫn/tooltip/thể lệ|Quà normal hiện đúng sau lưu, miss không hình giả, cap/reduced-motion/cleanup đúng|
|Q1|Review sau code, regression/rules/cost/perf và tài liệu|Bằng chứng thật, không thay task khác hoặc tự deploy; báo giới hạn S22|

Kiểm tra bắt buộc theo rủi ro:

- Candidate:0/1/nhiều món chưa có; pool sai loại/ngoại lai; độc lập
  category20%; đầy pool100Xu; C không đổi; kho hỗ trợ đầy; pool thêm món;
  canonical race sở hữu, candidate cũ/receipt cũ, retry không reroll.
- Drop: ba game×hai nhóm; RNG dưới/đúng/trên0,02/0,05/0,06/0,10/0,25/
  0,30; không quà/một/hai/cả ba; chọn chữ đều17loại; disabled source,
  special+Lucky trùng cờ, nhóm phá phụ, thẻ thường trúng năng lượng.
- Save: marker cả trượt, undo/reload/lost response, giao dịch lặp,
  đổi UID/restore/cancel; không cấp hồi tố hoặc tăng counters hai lần.
  Số marker/byte bounded theo wave, không bloat qua nhiều vòng chơi.
- UI: origin và đích kho đúng với normal; quà tích bền kể cả thua;
  320/412/1024/ngang, năm skin/font lớn, reduced-motion/ẩn tab/restart.
  Lặp20–30chu kỳ, node/listener/timer/ghost về baseline, max12loot.
- Rules/generator/service thật qua emulator nếu phần dispatch/data có
  đổi; giữ regression quà60phút đang có, không phát hành dịch vụ thật.
  Đo reads/writes/bytes trên workload tương đương, không hứa0write/drop.
- Test RNG xác định, không dùng xác suất ngẫu nhiên làm test flaky.
  Cập nhật các assertion cũ trong check-letter-policy/liveops-spark đang
  coi normal không được bốc; thay bằng kiểm biên mới và giữ các test
  replay/receipt bán10Xu/legacy1000Xu, không xóa kiểm tra chống cấp lặp.
  Check/build ở gate cuối theo phạm vi code đã sửa; S22 ghi chưa đo nếu
  không có máy. Không chạy test/build/APK cho lượt chỉ lập kế hoạch này.

Khi giao toàn task, đi liên tục mọi gate đã đủ quyết định; ghi tiến độ
vào một receipt chung khi triển khai, không tạo report mỗi chỉnh sửa.
Không tự đổi thêm rate/quà hoặc coi đầy đủ5/25% chữ là đủ nghiệm thu
hai nguồn vé/huy hiệu. Không commit/push/deploy/rules/APK trong lượt
lập kế hoạch; các thao tác đó chỉ theo phạm vi được giao sau.

## Tiến độ triển khai

- P0: đã khóa bảng tỷ lệ, ownership và call sites. Snapshot cặp tối đa60
  cặp, Triple tối đa120 thẻ/40 bộ ba; cap1000 marker/đợt giữ nguyên.
- Các phase C1/D1/V1/Q1 đang triển khai; bằng chứng tập trung trong
  `COSMETIC_COMPLETION_GROUP_DROPS_RECEIPT.md`.
