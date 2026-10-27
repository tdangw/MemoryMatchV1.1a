# Trang Sự kiện, Nhiệm vụ mobile, Kho rương và Lễ hội Đom Đóm

## Triển khai được giao — 27/10/2026

Chủ dự án giao toàn bộ P0–Q1, commit từng phase, và duyệt toàn bộ đề xuất
còn lại của P0: mốc 25/50 cấp 50/100 Xu; subpool hỗ trợ chia đều theo mục 4;
kho đầy 999 giữ rương/candidate để thử lại; whitelist gồm ngoại hình
Thành tích/chữ/event, loại starter/effect, chọn đều; loại rương chữ cố định
theo bộ (bảng đính chính dưới đây); trong ván chỉ xem kho; SVG tĩnh khu vườn đêm theo skin hiện có.
Các câu “chỉ lập kế hoạch/chưa giao triển khai/còn đề xuất” bên dưới là
lịch sử trước phê duyệt này. Không deploy, rules live, APK hoặc push.

P0–Q1 đã hoàn tất mã nguồn/web local. Bằng chứng và giới hạn ghi chung trong
`EVENTS_MOBILE_FESTIVAL_RECEIPT.md`.

Đính chính trực tiếp: bỏ cơ chế luân phiên/12 slot. Phần thưởng phải ghi
rõ loại rương chung, bên trong bốc đúng bảng. Mapping đã chốt: MEMORY MATCH → Avatar; LINK CONNECT → Khung;
TRIPLE CONNECT → Huy hiệu; ADVENTURE → Avatar. Mỗi lần đổi nhận một rương
đúng loại của bộ, không cursor/luân phiên/đợi ownership. Phê duyệt P0 cũ
về cursor được thay bằng quyết định trực tiếp này.

Cập nhật ngày 27/10/2026. **Chỉ phân tích và lập kế hoạch; chưa sửa code,
đổi dữ liệu/rules, tạo icon hoặc phát hành.** Đây là nguồn phạm vi duy
nhất của task Sự kiện, Nhiệm vụ và Kho rương mới.

Làm rõ cuối của chủ dự án về **bốn loại rương chung** thay thế cách hiểu
trước đó “rương gắn với món A”. Không khôi phục cách hiểu đó từ bản nháp.
Nguồn đầu vào gồm yêu cầu trực tiếp, file `Pasted text.txt` đính kèm ngày
27/10, CONTEXT và code hiện hành. Đính kèm chỉ có mô tả bằng chữ, chưa
phải ảnh concept hay mẫu giao diện đã được duyệt.

## 1. Các quyết định sản phẩm

### Đã chốt

- Lễ hội cá nhân lặp vô hạn, không mùa giải, countdown hoặc reset tuần.
- Mỗi nhóm ghép đặc biệt của ba trò có thể nhận 1 đom đóm, độc lập chữ/vé.
  Tạm dùng **100% để thử**, sau đó dự kiến chỉnh **10%**; không tự chuyển
  theo đồng hồ. Nhận ngay kể cả thua, giữ qua offline, không hết hạn/cap ngày.
- Vòng 100 điểm có bốn mốc: **25: Xu; 50: Xu + 1 Rương C; 75: 1 Rương
  Khung; 100: 1 Rương Avatar**. Nhận đủ bốn mốc thì sang vòng mới, giữ
  điểm dư; không cần mở hết rương. Rương đã nhận vào kho để mở sau.
- Bốn loại rương chung: **C** có Xu/hỗ trợ; **Avatar, Khung, Huy hiệu** có
  Xu/hỗ trợ/ngoại hình đúng loại. Mở theo tỷ lệ, có thể nhiều lần chỉ ra
  Xu hoặc hỗ trợ. Không hứa chắc hoặc khóa một món cụ thể cho mỗi rương.
- Mọi quà avatar/khung/huy hiệu **chưa nhận** của Thành tích, Sưu tập chữ
  và Lễ hội đổi thành rương đúng loại. Đồ/grant đã cấp bền vững giữ nguyên,
  dù người chơi chưa xem thông báo. Sáu effect không tự đổi sang rương.
- Pool ngoại hình được phép gồm món từ các bộ sưu tập khác. Món cụ thể
  được rút trong pool của loại rương, không gắn với món cũ của mốc thưởng.
- Ngoại hình đã có đổi Xu; hỗ trợ đã có **vẫn cộng số lượng vào kho**.
- Khi đủ ngoại hình trong pool của loại rương, lần mở tiếp loại đó đổi
  thẳng Xu. Rương C vẫn Xu/hỗ trợ. Không tạo rương Xu riêng, không giữ
  cơ chế chuyển sang rương 10.000 Xu của Sưu tập chữ trước đây.
- Nhận rương và sở hữu món bên trong là hai trạng thái riêng. Nhận rương
  cập nhật tiến trình nguồn; không chờ trúng món cũ mới chuyển bước thưởng.

Cách gọi: **Rương C / Rương Avatar / Rương Khung / Rương Huy hiệu**.
Không dùng “rương A/B” để chỉ món giả định; A/B còn là tier rương bản đồ.

### Phê duyệt bổ sung ngày 27/10/2026

Chủ dự án yêu cầu áp dụng đề xuất vào kế hoạch: **bảng tỷ lệ và mức Xu
trong rương, đổi trùng/đủ bộ ở mục 4 cùng bố cục Kho rương ở mục 5 đã
được duyệt**. Kho chung nằm trong Bộ sưu tập, lưới 2×2 bốn loại gộp số
lượng; xem quà/tỷ lệ, chọn trò nhận hỗ trợ và mở từng rương. Xu vào ví,
hỗ trợ vào kho trò được chọn, ngoại hình vào đồ Hồ sơ. Các nguồn thưởng
dẫn tới cùng kho; nhận rương cập nhật bước thưởng và có thể mở sau.
Không yêu cầu duyệt lại các quyết định này ở P0. Phê duyệt này chỉ cập
nhật kế hoạch, chưa phải lệnh triển khai hoặc phát hành.

### Chi tiết còn ở mức đề xuất

Mức Xu trực tiếp tại mốc 25/50; subpool hỗ trợ, chính sách kho đầy 999;
whitelist/trọng số ngoại hình; chu kỳ loại rương của Sưu tập chữ và mẫu
mỹ thuật cụ thể. Các chi tiết này chưa được chốt bởi bảng đề xuất vừa
duyệt; không dùng chúng để mở lại quyết định tỷ lệ/rương/Kho rương đã chốt.

Giữ recipe chữ, bán/ghép chữ, quota free/ad/vé, điểm danh, sáu effect,
rương độ khó bản đồ và thưởng 300 Xu. Không thêm IAP hoặc bán rương/lượt.
Yêu cầu bổ sung 27/10 giao lập kế hoạch cải tiến cả trang Nhiệm vụ theo
phong cách khu vườn đêm, hai tab Hôm nay/Tuần này. Chủ dự án đã xác nhận
**giữ thưởng Xu điểm danh hiện tại, chỉ cải tiến giao diện**. Không thêm
vé ngày 4–6, rương thật ngày 7 hoặc thay điều kiện nhiệm vụ từ hình minh họa.

## 2. Đối chiếu bản phân tích với code

| Nội dung | Kết quả | Hướng xử lý |
|---|---|---|
| Events cuộn dài | Đúng: wheel, bốn bộ chữ, preview, kho cùng content | Ba tab, một vùng cuộn mỗi tab |
| Wheel phẳng, nút dọc | Đúng: conic-gradient và CTA rộng 100% | Hình nổi tĩnh, phân cấp thao tác; không cần engine 3D |
| Kho chữ dùng select/input | Đúng trong presentation | Grid chọn chữ và sheet thao tác chạm |
| Grid 4×3 đủ chữ | Sai: alphabet hiện có 17 loại | Bốn cột, năm hàng; hàng cuối thiếu ô, không bỏ chữ |
| Mọi tab phải vừa một màn | Không phù hợp màn 320/font lớn/safe-area | Cho cuộn có kiểm soát, không scale cả trang |
| Rương 10.000 Xu luôn cạnh bộ chữ | Baseline cũ chỉ sau đủ 12 món; yêu cầu mới bỏ cơ chế riêng đó | Thay bằng rương chung, preview pool/tỷ lệ |
| Lễ hội mùa/countdown/cap 40 | Khác yêu cầu vô hạn | Festival riêng, không lịch mùa/cap mới |
| Mốc 20/50/80 là Lễ hội hiện hành | Hiện ở Nhiệm vụ tuần | Giữ mốc Xu tuần, không đổi nghĩa dữ liệu |
| Nhiệm vụ cần tab ngày/tuần | Đã có nhưng bố cục còn đơn giản | Cải tiến hai tab hiện có theo mục 3A, giữ model |
| Điểm danh có vé/siêu rương ngày 7 | Khác bảng Xu hiện hành | Chủ dự án đã chọn giữ Xu; không thêm loại thưởng thật |
| Emoji/nút nạp Xu/lấp lánh liên tục | Không phù hợp quy định/chức năng hiện có | SVG/asset, không nút giả hoặc loop mới |

`service.js` hiện gọi `sparkModel.js`. Không sửa policy cũ trong
`model.js` rồi coi là đã đổi runtime Spark. Approval JSON cũ giữ làm
lịch sử; nguồn cấu hình hiện hành phải phản ánh quyết định mới.

Bộ sưu tập do `mainmenu.js::showCollectionModal` quản, có tab theo trò;
`achievementCollection.js` quản Thành tích. Avatar/khung/huy hiệu được
trang bị qua Hồ sơ. Hiện chưa có kho rương chung chưa mở. Không đặt rương
chưa mở lẫn vào danh sách ngoại hình đã sở hữu.

## 3. Thiết kế trang Sự kiện mobile

### Khung chung

- Ba tab: **Vòng quay / Sưu tập chữ / Lễ hội**. Giữ header/dock/close/
  banner/safe-area theo owner hiện có; không nhân đôi ví hoặc thêm nút
  nạp Xu chưa có chức năng. Navy/emerald/gold dùng qua token của năm skin.
- Tablist/tabpanel/selection/focus đúng, hỗ trợ bàn phím và đọc màn hình.
  Một panel active; không chạy ba renderer/fetch/animation đồng thời.
  Đổi tab là state UI, không ghi Firebase.
- Padding 12–16 CSS px, spacing 8/12/16; ưu tiên vùng chạm 48×48 CSS px
  trên web và kiểm thực S22. Không nhầm với pixel vật lý/DPR hoặc 48dp
  native. Chữ thường có tương phản mục tiêu 4,5:1; không chỉ dựa màu.
- Một vùng cuộn dọc; font lớn vẫn tới được CTA và hàng cuối. Không thu
  cả trang để ép vừa chiều cao hoặc tạo nhiều vùng cuộn lồng nhau.
- Tách page owner, active-tab owner và operation owner. Đổi tab có thể
  hủy hình quay đang ẩn, không hủy quà đã commit. Không rebuild rotor chỉ
  vì đổi status/kho; focus theo ID. Response UID/page cũ không render vào
  tài khoản mới. Loading/offline/lỗi/kết quả dùng lời sản phẩm tự nhiên.

### Vòng quay

Giữ tám ô `[5,10,10,15,15,20,20,25]`, mỗi ô 12,5%, free 1/ad 10/vé riêng.
Rim/hub/pointer nổi nhờ SVG/texture tĩnh, không WebGL/blur động. Đường kính
khoảng 240–304 CSS px theo không gian; radius nhãn theo kích thước thật.
Một CTA chính, nguồn quay rõ và hai lựa chọn phụ gọn; không tự tiêu vé/
bật ad. Giữ rotor 2.400ms và reduced-motion tĩnh; kết quả bền trước quay.
Mini-card chữ/kho rương dùng cùng state đã tải, không hứa 10.000 Xu riêng.

### Sưu tập chữ

- Chọn bốn bộ bằng lưới 2×2; tên đầy đủ ở bảng ô chữ. Kho chung 17 loại,
  slot lặp phân bổ đúng: 2 chữ M chỉ sáng 2 slot M. Preview các bộ không
  có nghĩa một chữ đã được dành đồng thời cho mọi recipe.
- Recipe, tỷ lệ chữ, bán 1.000 Xu/chữ và ghép 3 ra 1 có thể trùng giữ nguyên.
  Quà đổi là **rương loại chung của bước kế tiếp**; preview loại/tỷ lệ,
  không dùng hình một món như thể được nhận chắc chắn.
- Mỗi bộ chữ đổi một loại rương cố định đã chốt khi triển khai:
  MEMORY MATCH → Avatar; LINK CONNECT → Khung; TRIPLE CONNECT → Huy hiệu;
  ADVENTURE → Avatar. Không cursor, không luân phiên theo 12 món cũ.
  Trừ recipe và cấp rương cùng commit; không chờ ownership và không
  chuyển sang payout 10.000 Xu theo số món hoặc số rương.
- Kho chữ dùng button grid có label/số lượng. Ghép 3 có preview ngẫu nhiên;
  Bán mở sheet số lượng −/+, preset hợp lệ, tổng Xu trước xác nhận. Có
  thể có nhập số trong sheet cho lượng lớn, không bán chỉ bằng chạm chữ.
- Sau đổi hiện xác nhận và “Xem Kho rương”; không tự mở/trang bị ngoại hình.

### Lễ hội

Banner gọn, nhãn **Vòng N**, điểm thực/100, road bốn mốc 25/50/75/100.
“Chưa đủ/Đủ điều kiện/Đã nhận” khác trạng thái rương “Chưa mở”. CTA Nhận,
Xem quà, Chơi ngay. Nhận đủ mốc sang vòng mới dù còn rương trong kho.
Lối tắt dẫn **cùng Kho rương chung**, không có kho riêng của Lễ hội.
Không countdown mùa, loop đàn đom đóm hoặc tự popup quà giữa ván.

## 3A. Thiết kế cải tiến trang Nhiệm vụ

### Phạm vi và kết luận đối chiếu

Áp dụng phân tích bổ sung của chủ dự án vào **cả Hôm nay và Tuần này**,
đồng bộ phong cách khu vườn đêm với Sự kiện. Phần văn bản gửi lặp hai lần
là cùng một yêu cầu, không tạo hai bảng điểm danh hoặc hai bộ nhiệm vụ.
Chưa có ảnh concept được duyệt; đặc tả dưới đây là phạm vi thiết kế,
không là xác nhận giao diện đã được triển khai hoặc nghiệm thu.

Đối chiếu `presentation.js`, catalog `model.js` và reducer `sparkModel.js`:

| Chi tiết phân tích | Hiện trạng và quyết định |
|---|---|
| Hôm nay/Tuần này | Đã có; nâng cấp bố cục và trạng thái, không dựng hệ quest mới |
| Ngày 3 nhận 15 Xu | Đúng bảng hiện hành, chỉ hiển thị khi thực sự đến lượt ngày 3 |
| Ngày 4–6 có vé, ngày 7 siêu rương | Là minh họa khác chính sách; đã chốt giữ toàn bộ thưởng Xu |
| Thắng 3, ghép 30, thắng không Gợi ý | Đúng ba nhiệm vụ ngày; giữ thưởng lần lượt 5/5/10 Xu |
| Ghép 30/30 hiện Nhận 5 Xu | Hợp lệ nếu chưa nhận; trạng thái phải lấy từ dữ liệu thật |
| Thưởng trọn bộ ngày +10 Xu và 1 vé | Đã có; tự cấp khi nhận đủ ba quà nhiệm vụ, không thêm lần nhận riêng |
| Hoàn thành 3/3 nhưng thanh 2/3 | Mâu thuẫn minh họa; nhãn, thanh và điều kiện nhận phải cùng dữ liệu |
| Bấm Chơi vào ván gần nhất | Hiện mở menu trò gần nhất; giữ lối chọn ván, không tự khởi tạo/tiếp quản ván |
| Tiến độ tăng ngay sau mọi lần ghép | Khác luật nhiệm vụ: hiện ghi sau ván thắng; không đổi sang cơ chế drop đom đóm |

### Khung trang và lựa chọn cách triển khai

So sánh hai phương án trước triển khai:

| Phương án | Đánh đổi | Chọn |
|---|---|---|
| Viết một hệ nhiệm vụ/điểm danh và state mới cho thiết kế | Trùng luật, tăng migration/ghi đồng bộ và nguy cơ cấp quà hai lần | Loại |
| Cải tiến renderer trên catalog, snapshot và command hiện có | Giữ quyền thưởng, thời điểm reset và save; cần tách cập nhật UI theo vùng | Chọn |

- Dùng page owner hiện có của `openLiveopsPage('missions')`; chia owner
  phần trình bày Nhiệm vụ/Sự kiện theo ranh giới cần thiết, không sao chép
  service/reducer hoặc thêm generic quest engine. Giữ ID/API/catalog.
- Header Nhiệm vụ, ví và dock chỉ có một bản. Hai tab **Hôm nay / Tuần
  này** ở đầu nội dung, mỗi tab giữ scroll riêng trong vòng đời trang;
  một panel active và một vùng cuộn dọc, không ép mọi thẻ vừa một màn.
- Hôm nay: Điểm danh 7 ngày → ba nhiệm vụ → Thưởng trọn bộ → thời gian
  làm mới. Tuần này: bốn nhiệm vụ → Thưởng trọn bộ → Hành trình tuần
  hiện có. Giữ mốc hành trình 20/50/80, không nhập vào Lễ hội vô hạn.
- Nền navy, thẻ emerald và điểm nhấn vàng dùng token của skin; các skin
  hiện hành vẫn đọc được. Dùng viền, gradient/shadow tĩnh tạo độ nổi cho
  nút; không thêm engine 3D, background owner hoặc đàn đom đóm riêng.
- Mobile dùng padding/spacing, vùng chạm, tương phản và safe-area như
  mục 3. Desktop căn giữa với chiều rộng hợp lý, không kéo thẻ dài hết
  màn. Tab có tabpanel/roving focus; đổi tab không làm mất focus/scroll.

### Điểm danh 7 ngày

Giữ chính xác **10 / 10 / 15 / 10 / 15 / 20 / 25 Xu**. Đây là chu kỳ bảy
lần nhận, không đổi thành streak bắt buộc bảy ngày liên tục hoặc tuần
thứ Hai–Chủ nhật. Bỏ một ngày không tự phạt mất chu kỳ; sau nhận ngày 7
ngày hợp lệ kế tiếp mới bắt đầu lượt 1.

- Bố cục ưu tiên hai hàng **4 + 3 ô**, ô ngày 7 nổi bật nhưng không chiếm
  chỗ nút Nhận; tránh nhét bảy ô nhỏ vào chiều ngang 320px. Có đầy đủ tên
  ngày, số Xu và trạng thái, không chỉ phân biệt bằng màu.
- Ngày đã nhận: dấu tích **SVG**, nền trầm hơn và nhãn Đã nhận. Ngày có
  thể nhận hôm nay: viền vàng/halo tĩnh và một nút Nhận ghi đúng số Xu.
  Ngày sau: khóa SVG và nhãn Chưa đến lượt, không giả đã đủ điều kiện.
- Dùng túi Xu cho cả bảy ngày; ngày 7 dùng túi Xu/đồng Xu được trang trí
  nổi bật với **25 Xu**, không gọi Siêu Rương hoặc ngụ ý cấp rương vào
  Kho rương. Thưởng điểm danh không mở popup rương xác suất.
- Suy trạng thái từ `loginNext`, `loginDay`, kỳ hiện tại của snapshot.
  Sau nhận, cursor đã sang ô tiếp theo nhưng ô đó chưa được nhận hôm nay;
  với cursor quay về 0 sau ngày 7 vẫn hiển thị chu kỳ vừa nhận đủ, không
  cho nhận ngày 1 cùng kỳ. Không dựng lịch sử các ngày ngoài dữ liệu có.
- Không mặc định ngày 1–2 đã nhận/ngày 3 là hôm nay cho người chơi mới.
  Giữ bảng lịch nhìn được sau nhận, không giấu mất phần tiến trình chính.

### Thẻ nhiệm vụ và đường dẫn Chơi

| Tab | Nhiệm vụ | Mục tiêu | Thưởng |
|---|---|---:|---|
| Hôm nay | Thắng 3 ván | 3 | 5 Xu |
| Hôm nay | Ghép đúng 30 lần | 30 | 5 Xu |
| Hôm nay | Thắng 1 ván không dùng Gợi ý | 1 | 10 Xu |
| Tuần này | Thắng 12 ván | 12 | Tính vào thưởng trọn bộ tuần |
| Tuần này | Ghép đúng 120 lần | 120 | Tính vào thưởng trọn bộ tuần |
| Tuần này | Thắng 3 ván không dùng Gợi ý | 3 | Tính vào thưởng trọn bộ tuần |
| Tuần này | Điểm danh 3 ngày | 3 | Tính vào thưởng trọn bộ tuần |

- Thẻ gồm icon SVG cúp/cặp thẻ/huy hiệu/lịch, tên, thưởng nếu có, thanh
  tiến độ kèm `n/m` và CTA. Không dùng emoji hoặc font làm hình trang trí.
  Số thẻ và mục tiêu lấy từ catalog, không hard-code mẫu 2/3 hay 30/30.
- Nhiệm vụ ngày: **Chơi → Nhận N Xu → Đã nhận**. Chỉ đổi nút khi snapshot
  xác nhận đủ điều kiện; có khóa thao tác đang gửi, lỗi cho thử lại mà
  không giả đã nhận hoặc cấp lại. Đủ mục tiêu có thể ghi Xong nhưng chưa
  được coi là đã nhận quà; không chỉ dùng phát sáng để biểu thị quyền nhận.
- Nhiệm vụ tuần không có quà riêng: ghi **Hoàn thành** khi đủ; không vẽ
  nút Nhận Xu riêng. Nhiệm vụ Điểm danh có CTA **Điểm danh**, chuyển sang
  tab Hôm nay và đưa focus tới bảng lịch. Các nhiệm vụ còn lại dùng Chơi.
- Chơi dùng luồng menu trò gần nhất đã có; nếu chưa có trò gần nhất thì
  dùng lựa chọn mặc định hiện hành. Không tự chọn độ khó/tốn vật phẩm/
  khởi động ván. Nếu mở trang từ ván đang chơi, phải giữ guard hiện có:
  đề xuất chỉ xem nhiệm vụ, không chồng menu hoặc ngầm bỏ ván; ghi chỉ
  dẫn ngắn Quay lại ván chơi. Trước code cần kiểm call sites để giữ đúng
  quyền mở trang và vòng đời của ván.
- Tiến độ chung ba trò ghi theo ván thắng đã settlement: một cặp hoặc
  một bộ ba tính một lần ghép. Hiển thị hướng dẫn ngắn này; không đổi
  luật nhiệm vụ thành nhận ngay khi ghép/kể cả thua như đom đóm.

### Thưởng trọn bộ ngày/tuần

- Hình rương vàng là **minh họa thưởng trọn bộ cố định**; nội dung ghi
  rõ Xu + vé, không là rương C/Avatar/Khung/Huy hiệu, không vào Kho rương
  và không mở ngẫu nhiên. Không tạo thêm loại rương hoặc vật phẩm Vé Vàng;
  dùng đúng Vé quay tích lũy hiện có.
- Ngày: giữ **10 Xu + 1 Vé quay**. Thanh thể hiện số nhiệm vụ đủ mục
  tiêu/3; nếu còn quà chưa nhận thì ghi rõ số đã nhận, ví dụ Hoàn thành
  3/3 · Đã nhận 2/3. Nhắc nhận các quà nhiệm vụ còn lại; khi nhận quà
  cuối reducer cấp bonus cùng giao dịch. Không có nút nhận bonus thứ hai.
- Tuần: giữ **50 Xu + 2 Vé quay**. Thanh theo bốn mục tiêu/4; đủ mới bật
  Nhận thưởng trọn bộ, sau commit hiện Đã nhận. Không tự sao chép điều
  kiện đã nhận từng nhiệm vụ ngày sang tuần vốn không có quà riêng.
- Giữ xử lý cấp quyền đủ điều kiện khi đổi kỳ của reducer hiện hành;
  qua ngày/tuần khi đang mở trang không làm mất quà đủ điều kiện hoặc
  nhận lần nữa. UI cập nhật từ kết quả đã lưu, không tự cộng ví/vé.

### Làm mới, đồng bộ và hiệu suất

- Hiển thị **Làm mới sau: …**, tính từ cùng hàm `periods(now)` và mốc
  ngày/tuần mà service dùng. Baseline hiện là 00:00 UTC, tức 07:00 tại
  Việt Nam; tuần bắt đầu thứ Hai tại mốc đó. Không reset theo nửa đêm
  máy, tạo giờ máy chủ giả hoặc dùng chuỗi 11h 20m cố định.
- Một timer ở page owner cho nhãn đếm ngược, tối đa cập nhật mỗi phút
  khi trang đang hiện; khi ẩn dừng, khi trở lại tính lại từ thời gian
  hiện tại. Chỉ sửa text cần đổi, không rebuild toàn trang/thanh/card.
  Cleanup timer/listener idempotent khi đóng, không timer cho từng thẻ.
- Countdown chạm 0 không tự reset save/grant. Hợp nhất một lần refresh
  kỳ mới vào luồng status đang có; khóa request trùng và chặn response
  cũ sau đổi UID/đóng trang. Không polling Firebase theo phút/giây.
- Tab/scroll/halo/countdown là UI cục bộ, không persist. Dùng snapshot
  và đồng bộ Spark hiện có, không Functions/scheduler/document mỗi quest
  hay log điểm danh tăng vô hạn. Quyền owner và guard giao dịch giữ nguyên.
- Loading/offline/error/đang nhận/đã nhận có trạng thái riêng. Offline
  chỉ xem tiến độ đã biết, không giả nhận thành công hoặc gọi số 0 khi
  chưa có dữ liệu; kết nối lại theo luồng khôi phục hiện có.
- Halo vàng, khóa, túi Xu và hình rương ưu tiên SVG/ảnh tĩnh. Không thêm
  shimmer/particle loop. Nếu triển khai chuyển trạng thái nhận, timeline
  hữu hạn tối đa 200ms, chỉ opacity/transform trên thẻ liên quan, không
  trì hoãn commit; hủy khi đóng/đổi tab và reduced-motion dùng trạng thái
  cuối ngay. Một chuyển trạng thái cho mỗi operation, không nhân layer
  theo số ngày/nhiệm vụ. Chưa có số đo thì không tuyên bố đạt 60 FPS.

### Tiêu chí nghiệm thu riêng Nhiệm vụ

- Đủ hai tab, 7 ô điểm danh, 3 nhiệm vụ ngày/4 nhiệm vụ tuần và đúng bảng
  thưởng. Ngày 3 là 15 Xu, ngày 7 là 25 Xu; không quà rương/vé điểm danh.
- Thử chưa đến lượt/nhận được/đã nhận, ngày 7→1, bỏ ngày, hai thiết bị,
  nhận nhanh hai lần, offline/retry/lost response và đổi tài khoản.
- Ngày đủ mục tiêu nhưng chưa nhận, nhận quà cuối cấp bonus đúng một
  lần; tuần đủ 4/4 nhận 50 Xu + 2 vé, visits dẫn đúng bảng điểm danh.
- Qua mốc 07:00 Việt Nam và thứ Hai, tab đang ẩn/app sleep/foreground,
  đồng hồ lùi và snapshot cũ không giả quyền nhận hoặc ghi lặp.
- Cả hai tab ở 320/360/412/1024 CSS px, landscape, font lớn và năm skin;
  nút Nhận không che nội dung, ô khóa/trạng thái rõ, keyboard/focus/Back
  đúng, reduced-motion không ảnh hưởng quyền thưởng. Kiểm S22 khi có máy.
- Lặp 20–30 lần mở/đóng/đổi tab; node/listener/timer về baseline. Nhãn
  đếm ngược không tăng writes/reads định kỳ, không rebuild thẻ mỗi tick.
  Test logic chỉ cần bổ sung nếu thực sự thay model; UI/lifecycle test
  bám các nhánh trên, không chạy suite hoặc tạo APK ở lượt lập kế hoạch.

## 4. Tỷ lệ rương đã duyệt và các chi tiết kinh tế còn đề xuất

Mỗi lần mở ra **một kết quả**: Xu **hoặc** một hỗ trợ **hoặc** một ngoại
hình đúng loại. Không cả ba cùng lúc.

Mức Xu trực tiếp tại mốc 25/50 dưới đây vẫn là đề xuất; loại phần thưởng
và bốn mốc đã chốt:

| Mốc Lễ hội | Phần thưởng |
|---|---|
| 25 điểm | 50 Xu |
| 50 điểm | 100 Xu + 1 Rương C |
| 75 điểm | 1 Rương Khung |
| 100 điểm | 1 Rương Avatar |

**Bảng rương đã duyệt ngày 27/10/2026:**

| Rương | Xu | Hỗ trợ | Ngoại hình | Đổi trùng/đủ bộ |
|---|---|---|---|---:|
| C | 40% → 50 Xu | 60% → 1 món | Không | Không áp dụng |
| Khung | 40% → 100 Xu | 40% → 1 món | 20% → 1 khung trong pool | 200 Xu |
| Avatar | 40% → 150 Xu | 40% → 1 món | 20% → 1 avatar trong pool | 300 Xu |
| Huy hiệu | 40% → 100 Xu | 40% → 1 món | 20% → 1 huy hiệu trong pool | 200 Xu |

Mỗi hàng đúng 100%. 20% là cơ hội nhận **một món trong pool**, không phải
20% cho từng món, không bảo đảm mở năm rương có món mới. Nếu N món được
chọn đều thì mỗi món có xác suất `20%/N`. Chưa thêm pity/bảo hiểm/reroll
né trùng hoặc trọng số ngầm.

### Pool, đủ bộ và quy đổi

- Đề xuất pool theo loại, gồm đồ Thành tích/chữ/event đã được cho phép;
  loại starter mặc định, effect, cover preview và file kỹ thuật. Whitelist
  ID từ catalog, không từ mọi PNG. Ban đầu chọn đều các món trong mỗi loại;
  duyệt danh sách trước phát hành.
- Chưa đủ pool: bốc category theo bảng. Nếu ra ngoại hình đã có, đổi Xu
  đúng dòng; không reroll sang món khác. Hỗ trợ đang có vẫn cộng kho.
- Đủ toàn bộ món trong pool **của loại rương đang mở**: bỏ bốc category,
  đổi thẳng 200/300/200 Xu. Không cần đủ cả ba loại; C vẫn theo 40/60.
  Công khai điều kiện này trong Thể lệ, không báo như trúng món mới.
- Full là predicate từ ownership canonical và pool version, không là cờ
  tùy ý hoặc số rương đã mở. Thêm món mới vào pool có thể làm trạng thái
  đủ bộ hết; đồ cũ và quà đã commit luôn giữ nguyên.
- Source hiện giới hạn hỗ trợ 999 món. Đề xuất nếu kết quả gặp kho đầy:
  giữ rương và candidate, thử lại khi có chỗ; không cắt quà bằng Math.min,
  mất rương, reroll hoặc tự đổi Xu. Chính sách kho đầy này còn cần chốt
  riêng; bảng tỷ lệ và mức quy đổi rương phía trên đã được duyệt.
- Chọn trò nhận hỗ trợ trước mở, gợi ý trò đang xem/gần nhất. Game ID vào
  operation trước RNG; không bốc xong đổi trò để đổi kết quả.

Nhánh hỗ trợ đề xuất chọn đều theo trò, mỗi kết quả cộng một món:

| Trò | Subpool |
|---|---|
| Memory | Gợi ý 1 lượt; Xem trước 4 thẻ; vật phẩm +30 giây — mỗi loại 1/3 |
| Link | Gợi ý; Xáo trộn; Sấm sét; Đóng băng 30 giây — mỗi loại 1/4 |
| Triple | Gợi ý; Hoàn tác; Xáo trộn; vật phẩm +30 giây — mỗi loại 1/4 |

Giá shop tham khảo trung bình: 158,67 Xu/món Memory, 158,5 Xu/món Link/
Triple. Đây là giá trị sử dụng so sánh, không cấp số Xu đó hoặc sửa giá.
Rương C mới có ID riêng, có thể tái dùng hình C nhưng **không đổi luật
rương độ khó C/B/A/S bản đồ, sáu effect hoặc thưởng 300 Xu**. Huy hiệu
nhận qua nguồn có quà huy hiệu; không tự thêm mốc 125 cho Lễ hội.

## 5. Kho rương trong Bộ sưu tập

Bố cục Kho rương chung, gộp bốn loại thành lưới 2×2, xem tỷ lệ/chọn trò/
mở từng rương và nơi nhận quà đã được duyệt ngày 27/10/2026. Các thông số
render, điều hướng và xử lý giao dịch dưới đây là đặc tả cho triển khai;
không đồng nghĩa mẫu mỹ thuật đã được xem hoặc code đã hoàn thành.

### Vị trí và cách gộp

| Phương án | Đánh đổi | Kết luận |
|---|---|---|
| Chỉ đặt trong Lễ hội | Người nhận từ Thành tích/chữ khó tìm; dễ thành kho riêng | Loại |
| Mỗi rương một ô theo nguồn/vòng | Scroll, render và state tăng theo số rương | Loại |
| **Kho chung trong Bộ sưu tập, gộp bốn loại** | Một nơi lưu và mở; cần renderer/entry dùng chung | Chọn |

- Trong Bộ sưu tập hiện có, thêm mục **Kho rương · N chưa mở** trước hàng
  tab theo trò. Chạm mở view con cùng owner, có Quay lại giữ tab/scroll cũ.
  Không chen một tab dài thứ năm vào hàng bốn tab trên màn 320px.
- Sự kiện, Thành tích và xác nhận đổi chữ chỉ dẫn tới **cùng kho**; không
  sao chép inventory hay mở chuỗi modal xếp chồng.
- Kho dùng lưới **2×2 card**, thứ tự cố định C/Khung/Avatar/Huy hiệu. Mỗi
  card có ảnh tĩnh, biểu tượng loại, tên, số lượng ×N, Xem quà & tỷ lệ và
  Mở 1 rương. Có 10.000 rương vẫn chỉ bốn card.
- Giữ cả loại đang 0 với “Chưa có”; khóa Mở, không biến mất làm nhảy ô.
  Số lớn rút gọn trên badge vẫn có label/số đầy đủ trong chi tiết. Không
  sort theo lượng khiến đổi chỗ trong lúc thao tác.
- Phân biệt hình/biểu tượng và tên, không chỉ màu. Không vẽ ngoại hình
  cụ thể trên rương như thể chắc chắn sẽ nhận món đó.

### Chi tiết và mở rương

Sheet có loại/số lượng, tỷ lệ, quy đổi trùng/đủ bộ, chọn trò hỗ trợ và
**Mở 1 rương**. Chưa thêm Mở tất cả/mua thêm/bán rương. Gallery pool dùng
thumbnail 128px, tối đa 12 món/trang, có đã sở hữu/chưa có và tổng theo
loại; không decode cả catalog 512px chỉ để xem bốn loại rương.

Rương giảm một khi commit quyền thưởng. Kết quả rõ Xu/hỗ trợ/món mới,
“Đã có · Nhận X Xu” hoặc “Đã đủ bộ · Nhận X Xu”. Ngoại hình mới vào **Đồ
đã sở hữu** và hệ trang bị Hồ sơ hiện có; có lối tắt Xem trong Hồ sơ,
không auto-equip. Hỗ trợ vào đúng kho trò, Xu vào ví duy nhất. Rương chưa
mở không nằm lẫn danh sách ngoại hình đã sở hữu.

Có thể Mở tiếp 1 rương sau operation trước hoàn tất; mỗi click một giao
dịch, không auto-loop. Đóng view/đổi tab chỉ đóng presentation. Mất phản
hồi đọc lại kết quả đã lưu, không cấp lại/reroll. Offline chỉ xem cache
có nhãn kết nối đúng; chưa biết số lượng thì loading, không giả số 0 hoặc
cho Mở dựa cache cũ.

### Mở kho từ màn chơi

`showCollectionModal({fromGame:true})` giữ activeGameScope, trong khi
reward service hiện chặn giao dịch khi game scope còn active. Đề xuất
đợt đầu: trong ván **xem kho**, mở ở trang chủ/bản đồ, có hướng dẫn “Về
bản đồ để mở rương”; không tự rời ván. Không nới guard chỉ vì đang pause,
tránh tranh ví/kho RAM với settlement. Mở ngay trong ván là phần lifecycle
cần chốt/thử riêng nếu chủ dự án muốn thêm.

## 6. Nguồn rương, ownership và dữ liệu cũ

- Thành tích giữ điều kiện chứng nhận/game+level. Quà avatar/khung/huy hiệu
  chưa cấp chuyển thành loại rương tương ứng. Item ID cũ giữ trong catalog/
  lịch sử nhưng không là kết quả khóa của rương. Completion Thành tích
  khác ownership ngoại hình. Sáu effect và thưởng cũ khác giữ nguyên.
- Marker nguồn đã cấp rương chỉ một lần; không để resolver nhìn grant
  rương như đã sở hữu ngoại hình. Popup Tiếp tục không là owner cấp quà.
- Chữ: recipe exchange cấp đúng loại rương cố định của bộ, không chờ sở hữu món.
  Bỏ payout 10.000 Xu riêng sau đủ 12 món/12 rương. Đủ pool xử lý khi mở
  bốn loại chung; rương từ mọi nguồn nhập cùng counter theo loại.
- Lễ hội cấp C/Khung/Avatar tại 50/75/100; Xu tại 25/50 theo bảng đề xuất.
  Không tạo rương riêng theo trò, nguồn, vòng hoặc từng món ngoại hình.
- Grant legacy đã commit/backfill giữ quyền vĩnh viễn, kể cả chưa thông
  báo; không đổi ngược thành rương hoặc tháo trang bị. Chứng nhận chưa có
  grant áp policy mới; không xóa receipt để cấp lại hoặc hồi tố rương.
- Thêm field/version normalizer tách entitlement rương và item thật; giữ
  save key/formatVersion2/ID cũ, không reset kho. Missing có default; dữ
  liệu hỏng/future version giữ nguyên và fail an toàn.
- Mỗi ngoại hình mới có ownership grant ổn định UID+itemID. Trùng chỉ cộng
  Xu/sequence, không thêm grant theo mỗi lần mở. Source chest không giả
  nguồn chứng nhận Thành tích. Hồ sơ/BXH chỉ đọc ownership thật.

## 7. Lễ hội vô hạn và Firebase Spark

### Chọn kiến trúc

Không dùng Functions/SSV/Scheduler/TTL hoặc document mỗi đom đóm/rương/
vòng. Tái dùng Auth, `gamespaces/{space}/liveops/{uid}`, root players/
chunks, queue tài khoản/persistence và CAS. Chỉ snapshot base64 không đủ
để rules kiểm counter/quota; chọn state có cấu trúc + snapshot hiện có.

Festival giữ earnedTotal, completedCycles, mask bốn mốc, version/watermark.
Kho giữ **bốn counter C/Avatar/Khung/Huy hiệu**, earned/spent hoặc invariant
tương đương, sequence và operation/result cuối. Không targetItemId, UUID
mỗi rương, mảng history hoặc kết quả cho mọi rương chưa mở. Lượng rương
có thể tăng nhưng size state không tăng theo số vòng/rương.

`available=earnedTotal-100*completedCycles`, progress=`min(available,100)`.
Chỉ dùng 100 khi nhận đủ bốn mốc, không trừ tổng 250. Có 130 điểm thì vòng
mới còn 30. Nhận mốc 100 trước vẫn chờ đủ mask; opening không đổi cycle.
Claim dùng cycle+mốc để retry cũ không nhận nhầm mốc vòng mới. Không tự
loop claim/mở mọi vòng khi có điểm dư lớn.

### Thu thập và đồng bộ

Dùng dropAdapters/applySpecialDrop và attempt/wave/group dedup hiện có.
Thêm earned đom đóm cùng giao dịch local của kết quả ghép; callback sau
durable commit. Một nhóm chỉ một thử dù nhiều cờ/animation; thẻ thường
không rơi. Chance riêng 1 khi thử/0,10 sau; không đổi vé 0,05/chữ trial.
Giảm chance không xóa/chia 10/reroll điểm cũ. Offline/thua/Hoàn tác/reload
không làm mất hoặc nhận lại. Sync watermark đơn điệu gộp flush, không
cloud write mỗi icon/frame. Chữ đang chia bốn loại/publication vì rules
1.000 expressions: thêm chest/festival phải giữ phase hữu hạn, root+state
atomic, ack đúng phần đã gửi, không bypass invariant để vừa budget.

### Nhận rương khác mở rương

1. Nhận mốc/nguồn: kiểm quyền, tăng counter rương/cộng Xu nếu có và marker
   nguồn trong cùng publication. Chưa RNG hoặc sở hữu ngoại hình.
2. Mở: đọc canonical/count/full pool, chọn trò hỗ trợ; lưu candidate RNG
   hoặc đổi Xu khi full với poolVersion/gameID/sequence bền trước transaction.
   Không RNG/animation trong callback có thể retry; không bốc mọi rương lúc nhận.
3. CAS cùng snapshot+state: trừ một rương/cộng Xu hoặc item/acquisition/
   sequence. Kho đầy giữ rương và candidate, không cắt quà. Opening không
   đổi mask/cycle hoặc marker nguồn đã cấp rương.
4. Commit rồi áp RAM/báo quà/animate. Crash trước không mất, crash sau đọc
   canonical; không hoàn rương rồi cấp quà lần hai. Hai máy tranh rương
   cuối chỉ một thành công; UID mới không nhận pending của UID cũ.

service/commitSparkOperation hiện chủ yếu xử lý coins/appearance; phải
bổ sung snapshot/kho đúng trò/notify RAM cho hỗ trợ và test queued shop/
settlement. Không chỉ vẽ item mà không cộng kho, không thêm queue kinh tế
tranh với queue hiện có. Restore đối chiếu rewardRevision/economyRevision/
fingerprint, không hoàn rương đã mở.

Rules owner/private/schema/range, bốn counter không âm, sequence/earned
đơn điệu, mask/điểm mốc/linked root. Claim tăng count khác opening giảm 1;
không broad owner-write. Gameplay/RNG/ownership vẫn ở mức tin app theo bảo
mật cơ bản đã chốt, không tuyên bố chống app sửa. Sửa source template
`design/rewards-liveops/spark-rules.template.txt` qua
`scripts/generate-liveops-model.mjs`, không sửa generated tay.

Rương chung chưa mở dùng bảng công bố khi bắt đầu Mở; operation đã bắt
đầu giữ candidate/version qua retry, không reroll khi bảng đổi. Đồ/asset/
ID đã cấp giữ nguyên. Full không là cờ độc lập dễ lệch; whitelist/rules/
preview/bảng bốc phải khớp.

## 8. Icon và tài nguyên

Đề xuất `createIcon('firefly')` SVG thân/cánh/bụng vàng-xanh, khác vé/năng
lượng, dùng chung drop/tab/progress. Không emoji hoặc sheet nặng.
Callback sau commit dùng playLootDrop như vé, cap item 12 hiện có, capture
origin trước board đổi; target Sự kiện nếu hiện, nếu không thu tại chỗ.
Không phóng lớn giữa màn như chữ, không thêm write để animate; scope cũ
hủy không vẽ lên ván mới. Reduced-motion theo loot cũ; quyền nhận độc lập.

Rương bốn loại dùng art tĩnh kèm icon phân biệt. Nếu cần bitmap mới, dùng
skill imagegen ở lượt asset được giao; source/QA ngoài bundle, kiểm alpha/
size trước pack. Không tạo ảnh trong lượt lập kế hoạch này.

## 9. Ngân sách đề xuất và kiểm chứng

Nếu chốt mức Xu mốc 25/50 như đề xuất, một vòng cấp 150 Xu trực tiếp +
C/Khung/Avatar. Phép tính sau dùng tỷ lệ rương đã duyệt và giả định mức
Xu trực tiếp đó, chưa phải toàn bộ kinh tế đã chốt. Nếu cả hai
pool ngoại hình chưa đầy, mở hết ba rương kỳ vọng **270–370 Xu + 1,4 món
hỗ trợ**, tùy tỷ lệ đồ trùng; ngoại hình mới tính riêng. Nếu cả hai pool
đầy, đổi Khung/Avatar thẳng 200+300 Xu, cộng mốc và Rương C thành kỳ vọng
**670 Xu + 0,6 món hỗ trợ**. Max một vòng theo bảng là **700 Xu**; không
là trần thu nhập/ngày/tuần hoặc giới hạn kho rương. Giá shop không là Xu
thực nhận và không tự tăng để bù kinh tế.

100% thử cần 100 nhóm đặc biệt hợp lệ cho 100 điểm; 10% dự kiến trung bình
1.000 nhóm, không bảo đảm đúng 1.000. Chữ/vé/thưởng cũ còn riêng.
Spark dùng quota chung: 50.000 reads/20.000 writes ngày, 1GiB storage,
10GiB egress tháng; rules reads/retry/cleanup cũng tính. Không polling/
status write chỉ vì đổi tab. Đo 10/50 nhóm drop gộp, claim bốn mốc, mở bốn
loại/duplicate/full/retry/backlog chữ, reads/writes/deletes/bytes. Một
publication vẫn có n chunks + root + state, không hứa Mở chỉ một write.
Không tự chuyển Blaze hoặc coi cơ chế vô hạn là tài nguyên không giới hạn.

## 10. Phase và nghiệm thu sau khi được giao triển khai

| Phase | Phạm vi | Cổng đạt |
|---|---|---|
| P0 | Giữ bảng rương/quy đổi và bố cục Kho rương đã duyệt; chốt Xu mốc 25/50, subpool/kho đầy, whitelist/trọng số, chu kỳ loại rương chữ và mẫu mỹ thuật | Ghi rõ quyết định còn thiếu; không yêu cầu duyệt lại phần đã chốt |
| U1 | Owner ba tab/Kho rương dùng chung | Navigation/focus/scroll/scope đúng, bốn card không nhân inventory |
| U2 | Wheel/ô chữ/grid17/sheet/Kho rương/tỷ lệ | Đúng quyền, touch/skin, bỏ rương 10.000 Xu riêng |
| U3 | Hai tab Nhiệm vụ, điểm danh, thẻ nhiệm vụ, thưởng trọn bộ/countdown theo mục 3A | Giữ bảng Xu và luật thưởng; trạng thái nhận/đổi kỳ/đường dẫn Chơi đúng; không thêm writes định kỳ |
| D1 | Model/counter/festival/migration/rules/public ID | Atomic claim/open, mask/cycle, old save/restore/UID/deny |
| D2 | Quà chưa nhận Thành tích/chữ, drop/icon ba trò/UI | Không mất đồ cũ, đúng loại rương và số kho thật |
| Q1 | Review riêng, regression theo rủi ro, perf/cost | Kết quả thật, không leak/thay ngoài scope/log rác |

**Chưa triển khai phase nào trong lượt này.** Khi giao toàn task, đi tiếp
qua phase đã đủ quyết định, không kết thúc sau mỗi bước. Test/build khi
thay đổi hoặc rủi ro cần, cuối cổng phù hợp; không chạy cho thay đổi chỉ
tài liệu. Commit theo phase nếu có quyền; không gom log/ảnh QA/file tạm
hoặc task nền động. Không tự deploy/rules/APK/push. Capability riêng cho
festival/chest: flag liveops đang bật không chứng minh rules đã nhận field
mới. Wheel/chữ/nhiệm vụ cũ vẫn hoạt động khi bản mới chưa phát hành.

Acceptance:

- UI dọc 320/360/412, PC1024 và S22 thật khi có; năm skin, font lớn/safe-area/
  banner/Back/focus/đổi tab. Không suy pass ngang từ task nền động khác.
- Nhiệm vụ đạt toàn bộ tiêu chí mục 3A: đủ cả ngày/tuần, vòng điểm danh,
  bonus tự cấp ngày/nhận tuần, countdown đúng kỳ và không cấp thưởng lặp.
- Bốn card với 0/1/10.000 rương, offline unknown/cache stale; không clone
  10.000 node. Mở từng cái/race rương cuối/đổi tab giữ result; xem từ game
  không nới guard kinh tế tùy tiện.
- Recipe/sell/fuse không đổi; nhận rương tiến bước, không coi rương là
  ownership, không payout 10.000 Xu theo điều kiện cũ đã bỏ. Free/ad/vé giữ.
- Bốn loại/category/subpool/RNG biên/ID đúng loại, duplicate/full từng loại/
  pool thêm ID, kho 999 không mất hoặc reroll. Có thể nhiều lần không ra
  ngoại hình; không test thống kê nhiễu hoặc ngầm thêm pity.
- Drop ba trò/nhóm thường/duplicate/undo/reload/thua/offline; đổi 100%→10%
  không sửa điểm cũ; chữ/vé/đom đóm cùng lúc giữ cap loot 12.
- 24→25/49→50/74→75/99→100, dư130/1.000, nhận mốc mọi thứ tự; đủ bốn mốc
  sang vòng dù chưa mở. 10.000 vòng test thuần không làm state phình,
  không dùng 10.000 giao dịch live để thử.
- Legacy grant chưa announced/backfill/equipped không đổi; rương bản đồ/
  300 Xu/effect/weekly giữ nguyên; source chest không giả certification.
- Hai máy/lost response/crash từng phase/UID/restore/future data; rules
  dưới giới hạn 1.000 expressions, deny cases/source-generated khớp.
- 20–30 chu kỳ page/tab/sheet/restart/reduced-motion: node/timer/listener/
  animation về baseline. Check/build và regression đúng shared module
  ở cổng cuối. Không có S22 thì ghi chưa xác minh.

## 11. Nguồn và giới hạn lượt này

Đã đọc presentation/Spark/service/persistence/drop/loot/catalog/rules và
Collection/Hồ sơ, chưa kiểm UI live hoặc đo S22. Skill
`clarify-ambiguous-requirements` dùng để chốt loại rương và sửa nhầm lẫn
“rương gắn món A”. Mô tả đó và việc đợi trúng món A mới cập nhật quà đã
bị yêu cầu làm rõ cuối thay thế.

Bổ sung 27/10: đối chiếu phân tích trang Nhiệm vụ với catalog và Spark;
skill trên giúp làm rõ quà điểm danh. Chủ dự án chọn giữ Xu hiện hành,
chỉ cải tiến giao diện. Mục 3A/U3 là phạm vi mới của cùng kế hoạch, chưa
triển khai; không khôi phục câu cũ coi Nhiệm vụ nằm ngoài task.

Tham khảo: [Firestore quota](https://firebase.google.com/docs/firestore/quotas),
[transactions](https://firebase.google.com/docs/firestore/manage-data/transactions),
[WAI tabs](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/),
[Android touch](https://developer.android.com/guide/topics/ui/accessibility/views/apps-views),
[WCAG contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).
Đây là tiêu chí thiết kế/kiểm chứng, không tự nhận chứng nhận native app.

Chỉ sửa kế hoạch/CONTEXT, chưa code/save/rules/config/test/build/deploy.
Bảng rương/quy đổi ở mục 4 và bố cục Kho rương ở mục 5 đã được duyệt
ngày 27/10/2026. Xu mốc 25/50, subpool, whitelist/trọng số, vòng loại
rương chữ, policy đầy kho và mẫu mỹ thuật còn là đề xuất. Lượt cập nhật
này chỉ ghi nhận quyết định vào tài liệu, không tự triển khai.
