# Rà soát Sự kiện/Nhiệm vụ và gameplay — 29/10/2026

> Cập nhật sau đánh giá: chủ dự án đã chốt chữ **30% / bán10Xu**.
> Đã cập nhật mã/rules source tại workspace; các mục3–4 bên dưới là
> phép tính ở thời điểm audit trước thay đổi. Mục8 ghi trạng thái mới
> và đề xuất ngoại hình còn chưa áp dụng. Không dùng số100%/1000Xu
> trong phân tích lịch sử làm chính sách hiện hành.

Đây là **báo cáo đánh giá**, không là kế hoạch triển khai hoặc phê duyệt
đổi giá/tỷ lệ. Chủ dự án giao kiểm tra hai task đã hoàn tất, phân tích
cân bằng, dọn code/tài liệu cũ và commit. Không deploy/push/APK hoặc đổi
kinh tế lần hai trong lượt này. Các thay đổi có sẵn trước audit được giữ
và đối chiếu với receipt/P0 đã duyệt, không nhận là code mới do audit tạo.

## 1. Kết luận và phạm vi bằng chứng

**Đạt chức năng web local trong phạm vi kiểm tra lại. Chưa đủ bằng chứng
để kết luận kinh tế đã cân bằng hoặc đạt60FPS trên S22.**

- Nhiệm vụ/Sự kiện/Kho rương: tab, lịch, nhận quà, đổi chữ, bốn loại rương,
  vòng Sưu tập huy hiệu và chống nhận trùng đúng contract hiện hành.
  Lễ hội đã đổi tên thành Sưu tập huy hiệu; không reset key/điểm cũ.
- Gameplay: năng lượng80/20, hỗ trợ5/10/30 độc lập, Lucky mới, mốc Link
  2/10 và Magnet nguyên tử/undo/restore có kiểm tra. Phiên chính sách1
  giữ luật đến hết đợt; không xóa nhánh cũ để gọi là dọn rác.
- Rules mới khớp template/generator, hai suite emulator đạt. Không suy
  emulator thành dịch vụ thật đã cập nhật: workspace chưa được deploy.
- Review này đọc code/diff sau triển khai và chạy bằng chứng lại; không
  có reviewer độc lập, không nhận báo cáo cũ thay cho kết quả mới.

Nguồn: `js/progression/groupDropPolicy.js`, pair resolver, Triple state/
rules/milestones/transactions, `liveops/{config,chestConfig,chests,letters,
sparkModel,supportInventory,service}.js`, persistence, startup owner và
rules source/generated. Receipt cũ giữ diễn biến chi tiết, không là plan.

## 2. Kiểm tra lại trong lượt audit

| Kiểm tra | Kết quả |
|---|---|
| Pack8file unit: drop, mốc, rương, nguồn grant, kho/queue, nhiệm vụ | 76/76 đạt |
| Sau gom helper Magnet: drop-energy-policy và check-triple-connect-rules | 46/46 và contract đạt |
| UI: events-festival, collection-chest-tabs, pair-rewards, triple milestones | 33/33 đạt |
| Magnet normal/reduced-motion, 20chu kỳ mỗi profile | 2/2 đạt,40chu kỳ;320/360/412/1024/ngang844 và5skin |
| Triple startup CPU6x, ba mode trong cùng test | 1/1 đạt; sync-start34/35,1/17,2ms, framep95=8,5ms, clickp95≈1,1ms/max≈1,4ms |
| Firestore emulator: check-liveops-emulator + check-festival-emulator | Cả hai đạt, exit0; deny/race/retry/receipt/account isolation |
| generate-liveops-model --check | Đạt; rules khớp cấu hình |
| npm run check | Đạt trước và sau thay đổi code cuối |
| npm run build | Đạt,24,55s; chưa phát hành |
| node scripts/analyze-game-economy.mjs | Chạy được, đọc config hiện tại, không ghi save/mạng |
| git diff --check | Đạt |

Các log nằm local `runtime/qa/audit-20261029-*`, không đưa vào commit.
Lần UI đầu ở môi trường hạn chế gặp EACCES loopback; đã dừng tiến trình
đó và chạy lại môi trường cho phép local browser, không sửa app/test để
bỏ lỗi. Các PERMISSION_DENIED trong emulator là deny case được assert.

Đã xem ảnh thật từ suite Kho rương mobile/Cổ tích; bốn loại và trạng thái
0/10000 được gộp đúng, nội dung cuối có cuộn. Ảnh fixture không chứng minh
provider/quảng cáo thật hoặc tốc độ điện thoại.

Probe Magnet có cả resize/đổi skin/restart: reduced framep95/p99≈27,7/
55,6ms; normal≈20,8/37,2ms,1long task76ms. Đây không là A/B steady-state
hay đạt60FPS. Heap trước/sau chưa épGC cũng không chứng minh leak/không
leak; scope/ghost/resource assertion đạt. Không có S22 vật lý trong lượt
này. Hai suite emulator mô phỏng22publication,130reads/87writes,30934byte
ở workload Festival; không quảng cáo đây là chi phí một lượt rơi.

## 3. Điểm mất cân bằng ưu tiên cao: chữ và Xu

**Nguồn bán chữ đang áp đảo các nguồn chơi chính.** Cấu hình hiện hành
vẫn là chữ100% để thử và1000Xu/chữ, không cap mới; nhóm thường không rơi
chữ. Một chữ đủ mua khoảng17Gợi ý58Xu, hoặc2gói30s360Xu và còn280Xu.
Ghép một nhóm thủ công chỉ2Xu; một chữ tương đương500nhóm theo nguồn này.

Giả định10% nhóm là đặc biệt/Lucky/Magnet, mỗi100nhóm mới kỳ vọng có10chữ
=10000Xu nếu bán hết. Đây là scenario, không số đo tỷ lệ sinh thẻ thực.
Giảm chữ100%→20% mà giữ1000Xu vẫn cấp kỳ vọng2000Xu/100nhóm, lớn hơn
200Xu ghép cơ bản và phần Xu mốc ở bảng dưới.

| Bộ chữ | Số chữ | Bán riêng hiện tại | Quà đổi |
|---|---:|---:|---|
| MEMORY MATCH | 11 | 11000Xu | Rương Avatar |
| LINK CONNECT | 11 | 11000Xu | Rương Khung |
| TRIPLE CONNECT | 13 | 13000Xu | Rương Huy hiệu |
| ADVENTURE | 9 | 9000Xu | Rương Avatar |

Rương Avatar trước đủ pool chỉ kỳ vọng60–80Xu tiền mặt +0,4hỗ trợ và
nhánh ngoại hình20%; không thể đánh giá ngoại hình bằng Xu tùy ý. Tuy
nhiên chênh lệch bán bộ9–13nghìnXu quá lớn: người ưu tiên qua màn gần
như luôn nên bán thay vì sưu tập. Giá mở rộng khay3000Xu/ô chỉ cần3chữ,
cả3ô cần9chữ, làm mục tiêu dài hạn này ngắn hơn nhiều so với quà mốc.

**Đề xuất chưa áp dụng:** khi kết thúc thử drop, xét đồng thời chữ20%
và giá bán20Xu/chữ, không chỉ hạ xác suất. Khi đó bộ11chữ có phương án
bán220Xu, tạo lựa chọn thực giữa hỗ trợ chơi và ngoại hình. Đây là cấu
hình thử để chủ dự án duyệt, chưa kết luận tối ưu. Không giảm số Xu cũ,
không xóa chữ/kho cũ. Nếu đổi giá phải version/validate được receipt bán
1000Xu trước đây và đồng bộ rules/source/UI; không thay một hằng số rồi
làm bản lưu cũ mất hợp lệ. Không tự deploy.

## 4. Năng lượng, tiếp tế và chênh lệch giữa ba trò

Công thức với Nnhóm thường, Snhóm đặc biệt, Bnhóm Memory Special/Link
Blue (BthuộcS): năng lượng=`0,2N+0,8S`; hỗ trợ trực tiếp=
`0,05N+0,10S+0,20B`. Không cộng nhánh30% lần hai, không pity.

| Một vòng đủ mốc | Memory | Link | Triple |
|---|---:|---:|---:|
| Năng lượng cần | 10 | 10 | 30 |
| Xu cơ bản từ mốc | 210 | 250 | 210 |
| Vật phẩm từ mốc | 9 | 4 | 9 |
| Tác dụng phá phụ | 0 | 2cặp | 0 |

Scenario100nhóm,90thường/10đặc biệt: kỳ vọng26năng lượng. Với Memory
giả định toàn nhóm đặc biệt là Special, Link Blue30% trong các nhóm đặc
biệt; không tính Lucky/quà thẻ/auto-break fallback/thắng màn/tiêu hao:

| Nguồn, quy về100nhóm theo nhịp dài hạn | Memory | Link | Triple |
|---|---:|---:|---:|
| Hỗ trợ trực tiếp | 7,5 | 6,1 | 5,5 |
| Xu từ năng lượng/mốc | 546 | 650 | 182 |
| Vật phẩm mốc, bình quân dài hạn | 23,4 | 10,4 | 7,8 |

Không lấy26/10 làm số vòng tròn hoàn thành trong một ván100nhóm cụ thể;
biên chu kỳ/tiến độ ban đầu làm kết quả hữu hạn khác kỳ vọng dài hạn.
Memory đã giảm tiếp tế nhưng mốc vẫn là nguồn đồ lớn. Triple cần khoảng
115,4nhóm/vòng ở giả định trên, Memory/Link khoảng38,5nhóm. Số thao tác,
tốc độ ghép, tỷ lệ Special thật và sự trợ giúp Magnet khác nhau nên
không thể kết luận bất công chỉ bằng số nhóm.

**Đề xuất:** giữ80/20 và5/10/30 trong lượt thử đầu, đo nhận/dùng/tồn,
mốc/phút và tỷ lệ thắng/đầy khay theo trò/mode. Nếu Triple vẫn thiếu động
lực sau dữ liệu chơi, thử target20/step2 trước khi cân nhắc10/1. Chưa đổi
target; nếu được duyệt phải giữ quyền nhận/tiến độ chu kỳ cũ, không tăng
version khiến normalizer trả progress0. Không tăng giá shop để che dư đồ.

## 5. Sưu tập huy hiệu và rương

- Huy hiệu thu thập100% là tỷ lệ thử đã duyệt, độc lập chữ/vé; chưa tự
  hạ10%. Vé5% có kỳ vọng0,75Xu quay mỗi nhóm đặc biệt (vòng quay15Xu/lượt),
  nhỏ hơn nguồn chữ. Không có phát hiện cần đổi vé/ngày trong audit.
- Mỗi100huy hiệu:150Xu trực tiếp +C/Khung/Avatar. Với mức trùng mới100Xu,
  mở cả ba kỳ vọng270Xu nếu không trùng, tiến tới310Xu nếu nhánh ngoại
  hình đều trùng nhưng pool chưa đủ; khoảng1,4hỗ trợ. Đủ hai pool thì
  kỳ vọng370Xu +0,6hỗ trợ. Không dùng số670/700 từ plan mức đổi200/300 cũ.
- Pool38avatar/38khung/22huy hiệu, nhánh ngoại hình20% và chọn đều có
  trùng. Từ kho trống, chỉ tính rương cùng loại và không nguồn khác:
  kỳ vọng đủ38món khoảng803,3rương; đủ22món khoảng406rương. Đây là mô
  hình thu thập có lặp `N×H(N)/0,2`, không số rương bảo đảm.
- **Đề xuất mỹ thuật/UX:** công khai số đã có/tổng pool và giải thích
  khả năng trùng. Nếu mục tiêu là hoàn thành bộ thay vì sưu tập dài hạn,
  cân nhắc bảo đảm món chưa có sau một số lần mở hoặc ưu tiên món chưa
  có; đó là đổi chính sách cần duyệt, không tự thêm pity/reroll vào code.
- Sau ổn định dữ liệu, cân nhắc hạ huy hiệu về10% như dự kiến cũ, nhưng
  đánh giá mốc/phút trước. Không tự chỉnh cùng lúc mọi nguồn và không
  hồi tố điểm/huy hiệu đã nhận.

## 6. Dọn code và tài liệu đã thực hiện

- Gom lựa chọn hai đồng loại Magnet vào state helper dùng chung cho
  reducer/Gợi ý, ưu tiên khay, chỉ sort ứng viên board cùng loại. Loại
  logic lặp/array trung gian trên hai đường đi; không đổi luật, ID, API
  cũ, save hoặc snapshot. So với giữ hai bản sao, phương án này có hai
  caller thật và một thứ tự lựa chọn duy nhất. Không tuyên bố tăngFPS
  do refactor nhỏ khi chưa có A/B riêng.
- Giữ các API legacy được test/call site dùng và phiên policy1; không
  xóa theo tìm kiếm tên đơn thuần. Không dọn cache/dist/node_modules,
  ảnh QA hoặc asset chỉ vì tên cũ.
- Thêm script phân tích đọc config `scripts/analyze-game-economy.mjs`;
  output là mô hình kỳ vọng, không phải telemetry hay mô phỏng tiêu hao.
- Xóa5plan đã đóng: DROP_ENERGY_SPECIAL_CARDS, ANIMATED_BACKGROUNDS,
  GAME_UX_SKIN, ILLUSTRATED_UI_ACHIEVEMENTS, UI_UX_ONBOARDING_REWARDS.
  Giữ receipt; đánh dấu rõ lịch sử để không mở lại gate cũ. Plan Sự kiện
  đã được xóa ở lượt trước, không phục hồi. ADS giữ vì QA thật còn chờ.
- CONTEXT rút từ hơn400xuống khoảng200dòng, bỏ “chờ triển khai”/quyền phát hành cũ
  và gộp trạng thái hiện hành. ARCHITECTURE bổ sung owner drop/Magnet/
  rương/queue. Ba tài liệu game đối chiếu công thức runtime; sửa các
  mô tả Memory còn+50% điểm, Xu theo combo, giá preview gốc, cộng giây
  dư/phạt Xu và không lưu bàn; Triple sửa score/star cũ. Đây là sửa tài
  liệu theo code hiện hành, không thay công thức cân bằng của runtime.
- Xóa plan giúp giảm ngữ cảnh/tài liệu gây nhầm, không giảm bundle hoặc
  tự tăngFPS vì Markdown không nằm trong đường render game.

## 7. Ranh giới bàn giao

Được commit: phần gameplay/startup/tương thích đã triển khai có sẵn và
được rà, helper/script audit, cập nhật thiết kế/CONTEXT/receipt và xóa
plan đã đóng. Ảnh QA thay đổi có sẵn không đưa vào commit, không reset
hoặc xóa chúng. Không tự thêm các test ignored/ảnh/log vào Git chỉ để
đủ số lượng; suite hiện hữu local có thể chạy lại nhưng không là bằng
chứng CI clone sạch sẽ có mọi fixture đó.

Chưa kiểm S22, mạng/provider/quảng cáo thật, tỷ lệ sinh thẻ thực và hành
vi dùng đồ. Những giới hạn này không phải lý do giữ plan đã hoàn tất
như đang triển khai, cũng không cho phép tuyên bố kinh tế đã cân bằng.

## 8. Chữ30%/10Xu đã chốt và đề xuất hoàn tất ngoại hình

### Chính sách chữ hiện hành

Chủ dự án chốt30% rơi chữ từ nhóm đặc biệt/Lucky/Magnet hợp lệ của cả
ba trò; chữ vẫn chọn đều17loại, độc lập vé/huy hiệu, không rơi từ nhóm
thường hoặc bốc lại sau retry/undo. Bán10Xu/chữ cho giao dịch mới.
Không xóa chữ, không sửa Xu cũ, không đổi schema; giữ receipt1000Xu/chữ
và replay không cấp lại. Rules sinh từ giá trong config, cần phát hành
riêng cùng bản web tương ứng; không tự deploy trong lượt cập nhật này.

Scenario100nhóm/10%đặc biệt: kỳ vọng3chữ, bán30Xu, thay10000Xu trước.
Giá bán riêng bộ MEMORY MATCH/LINK CONNECT/TRIPLE CONNECT/ADVENTURE
hiện110/110/130/90Xu; đổi lấy rương đã là lựa chọn hợp lý hơn trước.
Đây là kỳ vọng cấu hình, vẫn chưa có dữ liệu tiêu hao chơi thật.

Kiểm tra: `scripts/check-letter-policy.mjs` bao phủ biên0,3 của ba trò,
nhóm thường, retry cả lần trượt, bán mới10Xu và receipt cũ1000Xu. Bảy
unit chữ đạt; UI luồng đổi/bán/rương1/1 đạt; hai suite emulator đạt gồm
giao dịch mới giá10Xu được chấp nhận và giá1000Xu bị từ chối. Generated
rules/check/build đạt (build18,80s), log `letter-policy-20261029-*`.
Các thay đổi quà theo giờ đang được task khác sửa cùng workspace được
giữ riêng, không coi là phạm vi hoặc phần thưởng đã duyệt của task này.

### Phương án ngoại hình khuyên dùng — mới là đề xuất

**Giữ20% nhánh ngoại hình; khi trúng, chọn đều trong những món chưa có
của đúng loại rương.** Không đổi nhánh Xu/hỗ trợ, quà mốc hoặc pool ID.

| Loại | Số món | Hiện tại, kỳ vọng đủ bộ | Đề xuất ưu tiên chưa có |
|---|---:|---:|---:|
| Avatar | 38 | ≈803rương | ≈190rương |
| Khung | 38 | ≈803rương | ≈190rương |
| Huy hiệu | 22 | ≈406rương | ≈110rương |

Giả định bắt đầu chưa có món nào, chỉ mở rương cùng loại và không nguồn
ngoại hình khác. Hiện tại là `N×H(N)/0,2`, đề xuất là `N/0,2`; đây là số
rương trung bình, không trần bảo đảm. Trung bình5rương có1món, nhưng
vẫn có thể nhiều lần chỉ nhận Xu/hỗ trợ. Không hứa5lần chắc chắn trúng.

- Chưa đủ pool: nhánh ngoại hình luôn tiến thêm một món mới, giảm cảm
  giác mở trùng khi còn nhiều món thiếu. Đổi lại hoàn tất bộ nhanh hơn
  khoảng4,2lần cho Avatar/Khung và3,7lần cho Huy hiệu trong mô hình này.
- Đủ pool loại đang mở: vẫn đổi thẳng100Xu như hiện tại. Rương C giữ
  nguyên. Không tự trang bị, đổi quà mốc hoặc tạo rương mới.
- Nếu món đã bốc được sở hữu ở thiết bị/nguồn khác trước commit, giữ
  quy đổi trùng100Xu; không reroll. Candidate/receipt cũ đã bền giữ nguyên.
- Tái dùng ownership canonical đang có để lọc pool khi bốc candidate;
  không thêm bộ đếm pity, document/lịch ngày hoặc backend trả phí. Cùng
  transaction/CAS hiện có xử lý quà thật trước presentation.
- So với tăng20% lên30% nhưng vẫn chọn cả món trùng: cách ưu tiên chưa
  có giải quyết trực tiếp việc thiếu món cuối, không tăng rơi ngoại hình
  trong mọi lần mở. Chưa đề xuất bảo đảm sau10rương vì cần thêm trạng
  thái và thay xác suất thực; chưa cần thêm độ phức tạp đó.

**Chưa sửa chestCandidate/luật rương.** Chờ chủ dự án chọn phương án
trước khi triển khai; các phép tính so sánh được in riêng bởi script
phân tích, không bị dùng làm cấu hình runtime.
