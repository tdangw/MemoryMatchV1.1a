# Cập nhật rơi vật phẩm, năng lượng và thẻ đặc biệt — ba trò

Ngày 27/10/2026. **Chỉ lập kế hoạch, chưa thay code, cấu hình, dữ liệu,
rules, asset hoặc triển khai.** Đây là kế hoạch duy nhất cho task mới này.
Quyết định Sự kiện/Nhiệm vụ đã hoàn tất ở `CONTEXT.md` quản task
riêng; không nhập thay đổi gameplay này vào task giao diện hoặc nền động.

## 1. Mục tiêu, phạm vi và quyết định đã xác nhận

- Ba trò cùng dùng xác suất năng lượng theo nhóm ghép: **đặc biệt 80%,
  thường 20%**. Mỗi lần trúng cộng **1 năng lượng**, không nhân theo số thẻ.
- **Phê duyệt cân bằng bổ sung 27/10:** hỗ trợ bốc độc lập với năng lượng,
  **nhóm thường 5%, nhóm đặc biệt thông thường 10%, Memory Special / Link
  Tiếp Tế 30%**. Ngoại lệ 30% thay hoàn toàn nhánh chung, không bốc thêm.
  Bảng này **thay** mức hỗ trợ 20%/50% đã chốt ban đầu; không dùng số cũ
  trong cấu hình mới hoặc tooltip. Năng lượng vẫn giữ 80%/20%.
- Memory Special dùng **80% năng lượng**, thay câu chắc chắn +1 trong
  bản mô tả ban đầu; hỗ trợ riêng **30%** theo phê duyệt mới nhất.
- Memory Lucky: **mọi chế độ**, 1–3 cặp mỗi ván; quà trực tiếp một trong
  **+15 giây / +1 Gợi ý / +10 Xu**. Không còn dải số ngẫu nhiên cũ.
- Triple Lucky chỉ Thử thách: một trong **+10 Xu / +15 giây / +1 Gợi ý**.
  Chủ dự án đã chọn **15 giây**, thay dòng 5 giây trùng trong yêu cầu.
- Triple Magnet: **1 thẻ mỗi đợt bàn, mọi chế độ**. Thẻ được chọn phải
  bóc được; hai thẻ đồng loại được hút từ khay hoặc mọi lớp trên bàn.
- Vô tận: vật phẩm thời gian/đóng băng **vẫn cộng vào kho** để dùng ở
  chế độ có giờ. Nhánh Lucky cộng thời gian trực tiếp đổi sang Xu;
  **mức đổi cụ thể chưa chốt**, không tự giữ bảng quy đổi cũ của mốc.
- Mười mốc Memory và Link theo bảng mục 5–6. Không tự đổi mười quà mốc
  Triple vì người dùng chưa đưa danh sách thay thế.
- Không thêm pity/bảo đảm rơi sau chuỗi trượt. Đồ mạnh trong pool tiếp
  tế hiếm hơn đồ thấp cấp: Xem trước 12 thẻ thấp hơn 4 thẻ, +60 giây thấp
  hơn +30 giây; previewAll chỉ ở mốc 10. Trọng số số học còn chốt ở P0.
- Giữ Lucky và Magnet như đã xác nhận trong lần thử cân bằng đầu. Đánh
  giá Triple theo thời gian chơi và tiêu hao thực tế, không ép target
  giống hai trò kia hoặc tự đổi 30/3 chỉ vì giảm hỗ trợ.

Phê duyệt bổ sung là quyền cập nhật kế hoạch và viết prompt bàn giao;
lượt hiện tại chưa được giao triển khai. Agent nhận prompt ở mục 13 sẽ
thực hiện trong lượt riêng, sau khi làm rõ các quyết định còn thiếu.

Ngoài phạm vi: giá shop, số Xu cơ bản mỗi nhóm/ván, công thức sao/ranking,
độ khó và thời lượng ván, nhiệm vụ, rương xác suất, vé/chữ/huy hiệu sự kiện và nền
động. Chỉ sửa adapter nhận diện thẻ mới khi cần để tương thích nguồn
thưởng hiện có; không tự đổi tỷ lệ của các nguồn đó.

Mục tiêu nghiệm thu: luật và xác suất rõ, không cộng quà lặp/mất quà,
đúng snapshot và khay/bàn sau restore/undo, tooltip khớp catalog, không
ghi Firebase theo animation/tick, kiểm web PC/mobile và S22 khi có máy.

## 2. Đối chiếu mã nguồn và điểm thay đổi thực sự

| Owner | Hiện trạng được đọc | Việc cần cập nhật |
|---|---|---|
| `js/config.js`, `js/memoryMatch/pairRewards.js` | Chỉ Special vào nhánh năng lượng; đang 100% thử, có bảo đảm sau 9 lần trượt; hỗ trợ 50%; 10 mốc gần như đúng yêu cầu | Cho cặp thường bốc 20%, Special 80%; hỗ trợ thường 5%, Memory Special 30%, đặc biệt khác 10%; chuẩn hóa Lucky và Vô tận |
| `js/grid.js`, `js/logic.js`, `js/memorySession.js` | Lucky chỉ Thử thách; resolver chạy trước stage/save, hiệu ứng sau commit | Lucky mọi chế độ, giữ định danh/quà qua resume và số lượng đúng phạm vi ván |
| `js/linkConnect/linkConfig.js`, `pairRewards.js` | Năng lượng Special 100% thử; Cyan fallback Xu/thời gian ngẫu nhiên; Blue 50%; Red 50% phá còn lại chưa xáo; Lucky dải Xu/thời gian | Đổi luật theo mục 5; thêm nhánh thường; bỏ dải fallback cũ |
| `js/linkConnect/linkController.js`, `linkBoard.js` | Resolver sửa bàn trước save; phá cặp tự động ở mốc 1/3/9/10, có score/gravity | Chuyển phá sang 2/10, thêm Red xáo trộn miễn phí, giữ atomic snapshot |
| `js/tripleConnect/tripleMilestones.js` | Mỗi nhóm fresh +1 tiến trình, target 30, mỗi 3 tiến trình nhận 1 trong 10 mốc | Tách đã xử lý nhóm và có rơi năng lượng; đưa RNG 80/20 vào, giữ 30/3 trừ khi được đổi |
| `tripleRules.js`, `tripleState.js` | Chỉ select/undo/expire-combo; chưa có Magnet; chọn thẻ bị che bị chặn; có ledger Lucky/mốc | Thêm metadata Magnet và chuyển trạng thái hút trong reducer, normalize/snapshot/undo/solver |
| `tripleBoard.js`, `tripleGeneration*.js`, `tripleSolver.js` | Board phân lớp/pile, generation có solver/witness; Lucky trang trí sau sinh | Magnet không đổi tổng thẻ/bội số ba; solver và witness phải hiểu hành động mới |
| `tripleController.js`, `tripleTransactions.js` | Claim Lucky, milestoneTileIds và thưởng đi cùng transaction session | Lưu kết quả RNG, dấu đã xử lý cả khi trượt; không farm lại sau undo |
| `js/liveops/dropAdapters.js` | Special của vé/chữ nhận diện Lucky/pair Special; Triple hiện chỉ Lucky | Phân biệt phân loại cho năng lượng với nguồn vé/chữ/huy hiệu sự kiện, đề xuất nhận Magnet là Special ở adapter |

Các test tên `approved` và ghi chú cũ “100% để QA/trả về 20%” là baseline
của chính sách trước; yêu cầu mới và các xác nhận ở mục 1 là nguồn ưu
tiên cho task này. Khi triển khai sửa cả luật, tooltip và expected tương
ứng; không sửa test để che lỗi, không khôi phục plan đã hoàn tất từ Git.

## 3. Hợp đồng xác suất và chống nhân đôi

### Đơn vị bốc và phân loại

- Một **cặp ghép đúng** Memory/Link hoặc **bộ ba đã xóa** Triple là một
  nhóm. Lật sai, chạm thẻ, dùng Gợi ý, xáo trộn hay chỉ chọn một thẻ chưa
  thành nhóm không bốc. Magnet tạo đúng một nhóm ghép hợp lệ.
- Đề xuất phân loại Lucky là đặc biệt cho năng lượng, giống ý nghĩa
  adapter drop hiện có; Triple Magnet cũng đặc biệt. Memory nhóm vừa
  Lucky vừa Special chỉ bốc năng lượng một lần, hỗ trợ 30% theo Special.
  **Phân loại Lucky cho năng lượng cần chốt**, vì Lucky hiện tách cờ.
- Đặc biệt: `energyRoll < 0.8`; thường: `energyRoll < 0.2`.
  Hỗ trợ: thường `supportRoll < 0.05`, đặc biệt thông thường `< 0.1`,
  ngoại lệ tiếp tế `< 0.3`. Bốc các nhánh bằng giá trị độc lập, RNG có
  thể truyền vào test; không dùng một số cho cả hai. Lucky dùng nhóm hỗ
  trợ 10% nếu P0 chốt là đặc biệt; nếu trùng Memory Special thì chỉ 30%.
- 80/20 là xác suất theo nhóm, **không** là tỷ lệ xuất hiện thẻ đặc biệt
  trên bàn, không tỷ lệ chia 80% năng lượng/20% hỗ trợ trong một lần rơi.
- Xác suất thật không kèm pity/bảo đảm sau chuỗi trượt. Đã chốt ngừng
  sử dụng guaranteeAfterMisses cho luật mới; field save cũ vẫn đọc an
  toàn. Giữ pity ở nhánh thường sẽ làm tỷ lệ dài hạn vượt 20%.
- Chỉ giữ 1 nhánh tiếp tế ngẫu nhiên mỗi nhóm. Quà Lucky, khả năng thẻ
  và quà mốc là nguồn riêng, có thể cùng nhận; không cắt mốc vì đã rơi đồ.

| Nhóm | Năng lượng | Hỗ trợ | Cùng trúng hai nhánh | Không trúng hai nhánh |
|---|---:|---:|---:|---:|
| Thường | 20% | 5% | 1% | 76% |
| Đặc biệt thông thường | 80% | 10% | 8% | 18% |
| Memory Special / Link Blue | 80% | 30% | 24% | 14% |

Các tỷ lệ trên chưa tính quà Lucky/khả năng thẻ/quà mốc. Một lần không
rơi hỗ trợ không có nghĩa thẻ đặc biệt mất tác dụng riêng.

### Một nguồn quà, một lần commit

- Đề xuất nhóm bị phá **tự động** bởi Red/mốc/đồ hỗ trợ không mở tiếp
  nhánh rơi, không tăng năng lượng và không kích hoạt chuỗi phá mới.
  Vẫn tính nhóm/score/gravity theo luật đã yêu cầu. Magnet do người chơi
  chọn là nhóm chính, khác cặp bị phá phụ; không nhân ba lần rơi.
- Dấu đã xử lý phải ghi cả **lần trượt**. Định danh theo attempt + wave
  + ID thẻ gốc, không theo vị trí hoặc animation; shuffle không đổi ID.
  Sau undo, nếu nhóm chứa thẻ đã xử lý thì không dùng tổ hợp ID khác để
  bốc lại. Giữ ledger theo thẻ hữu hạn của ván, không tạo log vô hạn.
- Giữ cùng transaction cho board/tray/score, ví/kho, thời gian, năng
  lượng, claim và session. Commit trước hiệu ứng. Lỗi giữ lại trạng thái
  hợp lệ/khôi phục RAM; response cũ không sửa round/UID mới.
- Retry dùng cùng kết quả đã ghi, không lấy RNG mới sau mất phản hồi.
  Không thêm ledger quà chờ riêng nếu transaction/session đang đủ sức
  biểu diễn; không cắt đồ vượt kho 999 hoặc âm thầm reroll sang món khác.

## 4. Pool vật phẩm và các quyết định còn cần chốt

Pool dưới đây giữ đề xuất chọn nhóm vật phẩm; không mặc định mọi SKU có
cùng trọng số. Tỷ lệ rơi 5%/10%/30% đã duyệt, còn trọng số từng nhóm/món
chưa chốt. Với Memory, đã duyệt nguyên tắc đồ mạnh hiếm hơn; không tiếp
tục dùng chọn đều 4/8/12 hoặc 30/45/60 từ bản kế hoạch trước.

| Trò/nguồn | Pool hỗ trợ đề xuất |
|---|---|
| Memory thường 5%; đặc biệt khác 10%; Special 30% | Đề xuất nhóm Xem trước/Gợi ý/thời gian mỗi nhóm 1/3; trong Xem trước, đề xuất 4/8/12 = 60/30/10%; trong thời gian, đề xuất 30/45/60 = 60/30/10%; cộng kho |
| Link thường 5%; đặc biệt khác 10%; Blue 30% | Gợi ý / Xáo trộn / Đóng băng thời gian, đề xuất mỗi loại 1/3, cộng kho |
| Triple thường 5%; Magnet/Lucky 10% nếu phân loại đặc biệt | Gợi ý / Hoàn tác / Xáo trộn / +30 giây vào kho, đề xuất mỗi loại 1/4 |

Các tỷ lệ 60/30/10 trên là **đề xuất cụ thể mới để chốt ở P0**, chưa
được coi là con số đã duyệt từ yêu cầu “đồ mạnh hiếm hơn”. Đây là tỷ lệ
có điều kiện sau khi đã trúng tiếp tế và nhóm đồ, không xác suất rơi
trên mỗi nhóm ghép. Mỗi tầng trọng số phải cộng 100% và được công khai
đúng phạm vi, không vô tình đổi tỷ lệ ba nhóm vật phẩm.

Memory previewAll chỉ từ mốc 10, không tự đưa vào pool tiếp tế thường.
Link Sấm sét giữ ở mốc 8, không tự thêm vào pool Blue. Triple không thêm
Sấm sét/Đóng băng vốn đang bị loại trong catalog.

| Điểm chưa xác định | Đề xuất để duyệt, chưa coi là luật đã chốt |
|---|---|
| Xác suất giữa các quà Lucky | Memory/Triple 1/3 mỗi nhánh; Link 1/2 Xu, 1/2 thời gian |
| Lucky Link 50 Xu hoặc 30 giây | +30 giây cộng trực tiếp trong chế độ có đồng hồ, không vật phẩm time30 của Memory |
| Lucky cộng thời gian ở Vô tận | Memory nhánh 15 giây → 10 Xu; Link nhánh 30 giây → 50 Xu; giữ trọng số gốc, không rút lại chỉ trên hai loại quà |
| Khi không có cặp thường cho phá tự động | Đề xuất +10 Xu thay hiệu ứng phá, theo fallback breakCoins hiện có; Cyan không có băng +10 Xu là yêu cầu đã rõ |
| Red nhánh xáo khi bàn hết/không còn cấu hình khác | Không xáo bàn rỗng, không thêm quà; giữ kết quả ghép thắng. Bàn còn thẻ phải xáo có giới hạn và có đường thoát |
| Kho hỗ trợ đủ 999 | Đề xuất đổi phần vượt thành Xu theo bảng từng item dùng chung cho nguồn gameplay; chưa có bảng đầy đủ, không lấy giá shop hoặc mức trùng ngoại hình |
| Phạm vi 1–3 cặp Memory Lucky khi một ván có nhiều đợt | Giữ đúng tổng 1–3 **mỗi ván/attempt**, phân bổ các cặp vào đợt có thể chơi; không tự nhân 1–3 mỗi đợt. Cần chốt ranh giới ván Vô tận và đường đi khi người chơi kết thúc sớm |
| Mốc 10 Memory | Tất cả quà là vật phẩm vào kho, gồm previewAll + time30, kèm 100 Xu, khớp catalog hiện tại; không tự kích hoạt xem tất cả ngay |
| Chu kỳ Triple | Giữ 30 năng lượng/10 mốc, mỗi 3 năng lượng nhận 1 mốc và quà hiện có; người dùng chỉ thay nguồn rơi, chưa cho bảng mốc Triple mới |
| Lucky/Magnet và nguồn vé/chữ/huy hiệu sự kiện | Đề xuất Lucky/Magnet là đặc biệt cho các adapter nhưng không đổi rate nguồn đó; không để thường 20% năng lượng thành đủ điều kiện rơi vé/chữ/huy hiệu sự kiện |

Các câu trả lời đã có trong mục 1 không đưa lại vào danh sách chờ duyệt.
Có thể triển khai phần luật đã rõ khi được giao code; chỉ phần phụ thuộc
quyết định còn thiếu phải chốt trước, không dùng giả định đổi kinh tế.

## 5. Link Connect — thẻ và 10 mốc mới

### Khả năng thẻ

| Thẻ | Luật mới |
|---|---|
| Phá Băng (Cyan) | Rã đông ngay đúng 1 cặp băng; không có cặp băng thì +10 Xu. Không còn fallback +2–5 giây hoặc Xu 5–15 |
| Tiếp Tế (Blue) | 30% nhận ngay 1 Gợi ý/Xáo trộn/Đóng băng vào kho; 70% không rơi hỗ trợ. Dùng thay nhánh hỗ trợ đặc biệt 10%, không cộng thêm 5% hoặc 10% |
| Bùng Nổ (Red) | 50% phá 1 cặp thường khác, tính score và gravity; 50% tự xáo trộn bàn còn lại, không tiêu item Xáo trộn |
| Lucky | Nhận đúng 50 Xu **hoặc** +30 giây trực tiếp; xác suất hai nhánh và Vô tận theo mục 4 |

Cyan/Blue/Red là luật Link, không sao chép sang Memory/Triple vì tên màu.
Chưa đổi trọng số sinh Cyan/Blue/Red 50/30/20 hoặc số cặp đặc biệt; tỷ lệ
rơi 80/20 không được dùng để thay generator. Lucky giữ phạm vi xuất hiện
hiện hành của Link, không tự mở mọi chế độ theo quyết định riêng Memory.

### Bảng mốc

| Mốc | Phần thưởng | Thực hiện |
|---:|---|---|
| 1 | 10 Xu | Vào ví |
| 2 | Phá ngay 1 cặp thường | Tác dụng trên bàn, score và gravity |
| 3 | 20 Xu | Vào ví |
| 4 | 1 Gợi ý | Vào kho |
| 5 | 30 Xu | Vào ví |
| 6 | 1 Xáo trộn | Vào kho |
| 7 | 40 Xu | Vào ví |
| 8 | 1 Sấm sét | Vào kho |
| 9 | 50 Xu | Vào ví |
| 10 | Phá 1 cặp thường + 100 Xu + 1 Đóng băng thời gian | Phá trên bàn, Xu vào ví, item vào kho |

Một vòng đủ mốc cấp **250 Xu + 4 vật phẩm + 2 lần phá** trước fallback,
không tính quà thẻ/Lucky và Xu ghép cơ bản. Bỏ phá phụ ở mốc 1/3/9;
không cộng lại bộ quà cũ cùng bộ mới. Cả tooltip và resolver phải lấy
chung cấu hình hành động, không giữ `[1,3,9,10]` rải rác.

Thứ tự giải quyết đề xuất: xác nhận/xóa cặp người chơi → khả năng thẻ →
năng lượng và thưởng mốc → dồn trọng lực theo các lần xóa → Red xáo nếu
đã chọn nhánh đó → kiểm hết bàn/nước đi → stage/commit → trình bày. Có
thể điều chỉnh thứ tự gravity cho đúng owner hiện hành, nhưng phải có
test cố định cho Red cùng mốc 2/10 và Cyan rã đông. Chọn phá bằng ID,
không dùng lại tọa độ cũ sau gravity/shuffle. Đối tượng phá là cặp thường,
không băng/đặc biệt/Lucky, không cặp người chơi vừa xóa.

Xáo Red tái dùng luật `shuffleLinkBoard` và kiểm nước đi hiện có; không
gọi đường tiêu vật phẩm. Giới hạn thử/fallback rõ, không `while` vô hạn
để ép bàn phải khác. Không thay toàn DOM/HUD chỉ vì cộng Xu/năng lượng.

## 6. Memory Match — Lucky, Special và 10 mốc

Lucky 1–3 cặp được chọn bằng ID cặp, nhận một quà khi ghép đúng, không
nhận khi lật riêng một mặt. Giữ quà đã bốc qua save/resume; không sinh
lại Lucky bằng random rồi bỏ đi khi đang restore. Xác định cách phân
bổ vào các đợt theo mục 4 trước khi mở rộng generator cho mọi chế độ.

Special: năng lượng 80%, hỗ trợ riêng 30%; thường hỗ trợ 5% và năng
lượng 20%. Nếu Lucky trùng Special, thưởng Lucky vẫn có nhưng chỉ một
lần năng lượng và một lần tiếp tế. Không dùng nhánh `if (!special)
return` khiến thường bị bỏ qua như runtime hiện tại.

| Mốc | Phần thưởng | Điểm cần giữ |
|---:|---|---|
| 1 | 10 Xu | Vào ví |
| 2 | Xem trước 4 thẻ | 1 preview4 vào kho |
| 3 | 20 Xu | Vào ví |
| 4 | +30 giây | 1 time30 vào kho |
| 5 | Xem trước 8 thẻ | 1 preview8 vào kho |
| 6 | 30 Xu | Vào ví |
| 7 | 1 Gợi ý +30 giây | hint +1 và time30 +1 vào kho |
| 8 | Xem trước 12 thẻ | 1 preview12 vào kho |
| 9 | 50 Xu +1 Gợi ý | Xu vào ví, hint +1 vào kho |
| 10 | Xem trước TẤT CẢ +30 giây +100 Xu | previewAll +1, time30 +1 vào kho; 100 Xu vào ví |

Bảng này đã gần như trùng catalog hiện hành; không viết lại cho đủ diff.
Giữ 10 năng lượng/vòng, xử lý 9→10→0 và nhận mốc 10 đúng một lần. Tổng
vòng **210 Xu + 4 món Xem trước + 2 Gợi ý + 3 time30** trước quà rơi.
Field cũ `time10` đang biểu diễn item legacy +30 giây: giữ kho cũ, quà
mới dùng time30; không đổi key/xóa stock để làm sạch tên.

## 7. Triple Connect — Magnet và Lucky

### Ngữ nghĩa Magnet đề xuất

- Dùng một **thẻ thường có type gốc và metadata Magnet**, không thêm
  thẻ thứ tư hoặc một type đơn lẻ làm lệch số lượng bội số ba.
- Sinh đúng 1 Magnet ở mỗi đợt mới, mọi chế độ; chọn thẻ không Lucky,
  tối đa một Magnet trên một type. Không gắn thêm vào board restore cũ.
  Thẻ bị che vẫn phải mở đường mới chọn được; chỉ hai mục tiêu hút được
  bỏ qua điều kiện bị che. Không bỏ toàn bộ luật exposed của game.
- Khi chọn Magnet, xét cả board + tray chưa removed của cùng type.
  Nếu khay đã có 1–2 thẻ cùng loại thì ưu tiên lấy chúng, chỉ hút phần
  còn thiếu từ board theo thứ tự ID/slot ổn định. Không hút thêm 2 thẻ
  board rồi vô tình xóa 4–5 thẻ hoặc bỏ cặp thẻ cùng loại trong khay.
- Khay không có thẻ cùng loại: hút 2 thẻ board. Khay có 1: dùng thẻ đó
  và hút 1 board. Khay có 2: hoàn thành bộ ba hiện có, không hút thêm.
- Toàn bộ chọn/hút/xóa là **một command nguyên tử**; tính điều kiện
  đầy khay/sau thắng ở trạng thái cuối. Khay đang 6/7 hoặc 9/10 không
  được thua tạm thời vì animation ba thẻ đi vào trước khi xóa.
- Một bộ ba: một lần score/combo/matchedTriples, một nhánh rơi năng
  lượng 80% và hỗ trợ 10%. Không cộng ba lần hoặc kích hoạt Magnet
  đệ quy. Nếu mục tiêu có Lucky, claim Lucky thật đúng một lần.
- Generation phải bảo đảm còn đủ hai đồng loại hợp lệ. Save hỏng/thiếu
  mục tiêu: reject trước mutation, báo tự nhiên và giữ snapshot; không
  đổi type tùy tiện, chọn hai thẻ bất kỳ hoặc loop tìm mãi.

### Ảnh hưởng kiến trúc phải xử lý cùng tính năng

- `tripleState`: validate/normalize metadata và round snapshot; giữ ID,
  cover graph/pile/locations nhất quán. Thẻ board/khay/removed không thể
  đồng thời nằm hai nơi. Restore cũ thiếu Magnet coi là không có.
- `tripleRules`: reducer trả event hút/xóa chuẩn cùng `triple-resolved`;
  side effect, RNG quà và animation không chạy bên trong solver/reducer.
- `tripleSolver`, hint, shuffle, generator worker và witness: dùng cùng
  semantics chọn Magnet. Witness sau trang trí không thể còn yêu cầu
  chọn hai thẻ đã bị hút; phải replay/validate lại với ngân sách hiện
  hành hoặc sinh lại hữu hạn. Không nhận board solvable chỉ vì solver
  đã kiểm trước khi thêm Magnet. Cache/memo phải bao gồm metadata liên quan.
- Undo có thể phục hồi bộ ba/khay theo luật hiện có, nhưng **không phục
  hồi quyền bốc quà**. Ledger năng lượng/hỗ trợ/Lucky và lượt trượt giữ
  qua undo/resume, không dựa `milestoneTileIds` chỉ khi trúng năng lượng.
- Triple Lucky giữ Thử thách và số lượng hiện hành, đổi thời gian 5→15
  giây cho ván mới. Quà đã định sẵn trong session cũ giữ nguyên, không
  hồi tố Lucky đã nhận. Không mở Lucky sang Vô tận ngoài yêu cầu.
- Giữ bảng 10 quà Triple và target 30/step 3 làm phương án bảo toàn;
  năng lượng mới 80/20 làm tiến độ chậm hơn nguồn +1 mọi bộ ba hiện tại.
  Phải hiển thị đúng đơn vị năng lượng, không ghi mỗi bộ ba chắc chắn +1.

### Phương án loại

Không triển khai hút bằng cách gọi giả 3 lần `select-tile`: gặp blocker,
đầy khay tạm thời, undo ba bước và có thể cấp quà nhiều lần. Chọn reducer
giải quyết nguyên tử để renderer/solver/persistence có chung nguồn thật.
Không tạo Magnet thành vật phẩm mua hoặc thao tác vào DOM để xóa thẻ.

## 8. Giao dịch, tương thích và Firebase miễn phí

Phương án sửa trực tiếp nhiều controller/DOM bị loại vì khó giữ rollback,
undo và snapshot cùng một kết quả. Chọn pure resolver/reducer theo từng
trò + adapter drop nhỏ; các hàm xác suất chung chỉ được gom khi thật sự
có cùng hợp đồng. Không tạo hệ reward engine tổng quát để dành.

- Model mới chỉ áp dụng ở ranh giới ván/đợt đã chốt, không đổi luật giữa
  một lượt đang resolve. Gắn version chính sách trong checkpoint khi
  cần; thiếu field ở save cũ có đường normalize, không reset progress.
- Triển khai cần thiết kế cụ thể migration/compatibility ở phase D0:
  giữ coins/items/energy đã có, claim cũ, quà Lucky đã cam kết và round
  đang chơi. Không tăng version milestones Triple chỉ để khiến normalizer
  trả progress/cycle về 0. Không reset bảng xếp hạng/người chơi.
- Memory/Link giữ API và ID save hiện có nếu đủ; Triple cần metadata
  Magnet và dấu bốc quà mới hoặc mở rộng ledger hiện có. Phạm vi kế hoạch
  cho phép **thiết kế** phần bổ sung này, chưa phê duyệt schema cụ thể.
  Test save thiếu field/field lạ/hỏng/vòng cũ/recovery trước khi áp dụng.
- Local durable commit và online snapshot vẫn qua persistence hiện có;
  không thêm Functions, SSV/scheduler hoặc document cho mỗi drop/mốc.
  Không gửi mạng theo frame/đồng hồ; đo write thực tế trước khi hứa không
  tăng tải. Thường có drop mới có thể làm snapshot lớn hơn, cần đo bytes.
- Bảo mật cơ bản theo phạm vi đã chốt: owner UID, validate kiểu/phạm vi,
  idempotency, revision/CAS, không sửa tài khoản khác. Client RNG không
  cung cấp chống gian lận tuyệt đối; không đề xuất backend phức tạp mới.
- Vé/chữ và Sưu tập huy hiệu theo quyết định hiện hành ở CONTEXT.md. Khi sửa adapter Magnet, chỉ
  thêm phân loại sau khi chốt mục 4; giữ group key và dedup hiện có,
  không nhận lại quà của thẻ đã undo hoặc bật drop trên mọi thẻ thường.

## 9. Trình bày, lifecycle và ngân sách hiệu suất

- Năng lượng/hỗ trợ dùng loot effect có sẵn sau commit; thường có thể
  cùng rơi hai nhánh. Batch presentation và giữ giới hạn loot hiện có,
  không tạo thêm một lớp particle cho mỗi vật phẩm/mốc.
- Magnet dùng biểu tượng nam châm SVG/CSS gắn với thẻ gốc, vẫn đọc được
  type cần ghép; không emoji/font icon, không bitmap mới ở lượt kế hoạch.
- Timeline đề xuất: nhấn/nhận diện 80–120ms → hai thẻ hút 180–240ms →
  bộ ba resolve 120–180ms. Tối đa 3 ghost card và 1 dấu tác động trong
  lớp effect chung, transform/opacity, không blur lớn/repaint toàn màn.
  Đo rồi chốt timing, không thay timeline chuẩn của hiệu ứng khác.
- Callback hiệu ứng không được sửa score/kho/khay hoặc quyết định thắng.
  Interrupt/restart/chuyển mode/đóng scope hủy ghost/handle, round và
  generation guard bỏ response cũ; cleanup idempotent.
- Reduced-motion dùng trạng thái cuối/nhấn tĩnh; game không chờ animation
  mới cấp quà. Không animation loop cho Magnet đang nằm trên bàn.
- Đo A/B cùng seed trên PC và S22 nếu có: thời gian resolve/commit, frame
  p95/p99, long task, node/layer và memory sau lặp. Mục tiêu 60 FPS chỉ
  được xác nhận bằng số đo thiết bị, không suy từ build hoặc PC.

## 10. Kinh tế và mâu thuẫn cần thấy trước triển khai

- Với S nhóm đặc biệt, N nhóm thường mới hợp lệ: kỳ vọng năng lượng
  `0,8S + 0,2N`, không bảo đảm từng ván đúng 80/20. Tổng hỗ trợ kỳ vọng
  **`0,05N + 0,10S + 0,20B`**, B là số nhóm thuộc ngoại lệ tiếp tế 30%
  và là tập con của S; 0,20B là phần cộng từ 10% lên 30%, không bốc lần hai.
- Minh họa, không phải giả định tỷ lệ sinh thẻ: 90 nhóm thường +10 Memory
  Special nhận kỳ vọng 26 năng lượng và **7,5 hỗ trợ trực tiếp**, thay 23
  theo chính sách cũ. Quà mốc/Lucky tính riêng; không lấy 26/10 làm số
  chu kỳ tròn đã hoàn thành trong một lượt 100 nhóm cụ thể.
- Memory/Link một vòng 10 năng lượng: nếu toàn nhóm thường thì trung
  bình 50 nhóm, toàn đặc biệt trung bình 12,5 nhóm; Triple giữ 30 năng
  lượng thì lần lượt 150/37,5 nhóm. Đây là kỳ vọng lý thuyết, không cam
  kết số nhóm tối đa và không tự đổi tỷ lệ sinh thẻ để bù nhịp.
- Link Xu mốc cơ bản từ 210→250/vòng trước fallback; Memory 210 giữ
  nguyên. Xu từ Cyan/Lucky/không có cặp và item kho là phần thêm riêng.
  Không coi 250 Xu là trần một ván hay tự tăng giá shop cho cân bằng.
- Memory Lucky mọi chế độ và +15 giây có thể tăng thời gian chơi/thu
  nhập; Magnet bảo đảm xóa một bộ có thể giảm số lần đầy khay. Theo dõi
  bằng scenario có seed/trace cục bộ, không thêm analytics mạng ngoài phạm vi.
- Các mâu thuẫn chính đã được làm rõ: 80/20 là xác suất theo nhóm,
  Memory Special không còn +1 chắc chắn; hỗ trợ đã cập nhật 5%/10%/30%
  thay bảng 20%/50% ban đầu, mỗi nhóm chỉ một nhánh tiếp tế; Triple Lucky
  dùng +15 giây; Memory Lucky mọi chế độ; Vô tận giữ item kho. Các điểm
  còn đề xuất xem mục 4, không coi cả kế hoạch là đã duyệt triển khai.

### Đánh giá lần thử cân bằng đầu

Giữ bảng mốc, Lucky và Magnet đã chốt; không đồng thời tăng giá shop,
giảm thêm tỷ lệ năng lượng hoặc sửa thời lượng ván để che lượng thưởng.
So sánh chính sách cũ/mới bằng mô phỏng cục bộ có seed và cùng scenario
chơi, sau đó thử PC/S22. Không cần telemetry hoặc dịch vụ trả phí mới.

- Ghi lượng Xu/item **nhận, dùng, còn trong kho** trên cùng thời lượng
  chơi, tách theo trò/mode và phân vị thay vì chỉ một trung bình chung.
- Tách nguồn: ghép cơ bản, rơi trực tiếp, Lucky, năng lượng/mốc và các
  nguồn ngoài task. Không kết luận kho cân bằng nếu bỏ qua quà mốc.
- Theo dõi năng lượng/mốc mỗi phút, thời gian chơi, tỷ lệ thắng/đầy khay,
  tác dụng Magnet và tỷ lệ dùng từng item. Triple đang 30/3 so với 10/1
  của Memory/Link: đánh giá theo phút, chưa ép target giống nhau.
- Chưa có dữ liệu tiêu hao thực tế nên chưa đặt ngưỡng nhận/dùng tùy ý
  hoặc tuyên bố bảng mới đã cân bằng. Sau lượt thử báo số đo và đề xuất
  điều chỉnh nếu cần; không tự đổi rate lần hai ngoài phạm vi đã duyệt.

## 11. Phase triển khai và cổng nghiệm thu

| Phase | Phạm vi | Điều kiện hoàn thành |
|---|---|---|
| P0 | Chốt pool/trọng số, Lucky phân loại, quy đổi Vô tận, overflow/no-pair, ranh giới ván nhiều đợt và 30/3 Triple | Không còn luật ngầm; giữ nguyên các xác nhận mục 1 |
| D0 | Snapshot baseline, hợp đồng nhóm/ledger, schema/migration và version chính sách | Có mapping cũ→mới, không mất quà/progress; đọc xong owner trước sửa |
| D1 | Năng lượng 80%/20%, hỗ trợ 5%/10%/30%, pool trọng số đã chốt và lời hướng dẫn | RNG độc lập, rơi thường, không bốc đôi/pity ngoài luật; atomic lưu lần trượt |
| L1 | Link Cyan/Blue/Red/Lucky và 10 mốc | Phá chỉ mốc 2/10; score/gravity/shuffle/save đúng; không tiêu item cho Red |
| M1 | Memory Lucky mọi chế độ, giá trị cố định, Special và kiểm mốc | 1–3 cặp đúng ranh giới ván, restore giữ quà, inventory và Vô tận đúng |
| T1 | Magnet generation/state/reducer/solver/undo | 1/đợt, các vị trí hút hợp lệ, khay không thua tạm, witness valid, không farm |
| T2 | Triple Lucky 15 giây và tích năng lượng mới | Dùng bảng mốc/target đã xác nhận ở P0, mỗi nhóm fresh bốc đúng một lần |
| Q1 | Review sau implementation, regression/cost/perf/cân bằng theo mục 10 và diff cuối | Bằng chứng đạt; ghi rõ S22/tiêu hao chưa đo nếu thiếu, không tự nhận self-review là độc lập |

Khi được giao triển khai toàn task, làm tuần tự mọi phase còn lại; không
dừng sau gate trung gian. Không triển khai phần chưa đủ quyết định sản
phẩm. Không tự commit/push/deploy/rules/APK; commit theo phase khi được
giao, không gom task nền động hoặc ảnh/log QA ngoài phạm vi.

### Kiểm tra theo rủi ro — chỉ chạy ở lượt triển khai

- Unit/contract: RNG ngay dưới/đúng/trên 0,05/0,10/0,20/0,30/0,80,
  thêm 0 và 0,999…; biên trọng số pool sau P0, các nhánh độc lập,
  thẻ thường/đặc biệt/Lucky/ngoại lệ, không pity/bốc đôi, kho 998/999,
  fallback đã chốt. Dùng RNG xác định; không test tỷ lệ ngẫu nhiên dễ nhiễu.
- Mốc: từng 1–10, rollover nhiều vòng, mốc có nhiều quà, không cặp,
  Red cùng mốc phá, Cyan hết băng, time item vào kho ở Vô tận. Kiểm cả
  điểm/nhóm/xóa/gravity và tooltip, không chỉ tổng coins.
- Magnet: khay 0/1/2 đồng loại, khay 6/7 và 9/10, mục tiêu bị che/pile,
  hết board, Lucky trong mục tiêu, ID không hợp lệ, thiếu 2 thẻ, double
  click, undo ghép lại bằng tổ hợp khác, missed roll không được bốc lại.
- Solver/generation: mọi chế độ/đợt/layout/corner stack, witness replay,
  budget/retry/fallback hữu hạn; hint/shuffle không đề xuất thẻ removed.
- Persistence: save cũ, schema mới, snapshot chưa có Magnet, crash trước/
  sau commit, offline→online, hai UID/hai thiết bị, restore/undo không
  tăng quà. Field thời gian legacy không mất; giữ phiên Lucky cũ.
- UI/lifecycle: ba trò, 320/360/412/1024 và landscape, năm skin/font lớn,
  thao tác nhanh/restart/đổi mode giữa hiệu ứng, reduced-motion; lặp
  20–30 vòng đo node/listener/timer/ghost về baseline, không rebuild bàn
  khi chỉ cập nhật HUD. PC và S22 ghi kết quả riêng.
- Bắt đầu từ `scripts/check-pair-rewards.mjs`, `check-memory-special.mjs`,
  `check-link-connect-core.mjs`, `check-link-connect-board.mjs`,
  `check-triple-connect-rules.mjs`, `check-triple-connect-board.mjs`,
  `tests/unit/milestone-economy-approved.test.mjs`; cập nhật đúng test
  bị đổi luật, bổ sung case Magnet/RNG nếu thiếu.
- UI mục tiêu: `tests/ui/pair-rewards.spec.js`,
  `milestone-approved-rewards.spec.js`, `special-mode-preview.spec.js`,
  `triple-connect.milestones.spec.js`, `triple-generation.spec.js`.
  Mở rộng persistence/shared runtime khi diff thực sự ảnh hưởng.
- Check/build sản phẩm ở cổng cuối nếu triển khai; không chạy sau mỗi
  chỉnh sửa hoặc cho lượt tài liệu. Không gọi test qua nếu tiến trình
  chưa xong hoặc một profile mới có kết quả.

## 12. Trạng thái tài liệu

Đã đọc các owner/catalog/resolver/transaction/board/snapshot/adapter và
test liên quan để lập kế hoạch. Skill `clarify-ambiguous-requirements`
được dùng để chốt sáu nhóm quyết định ở mục 1. Chưa chạy gameplay/UI,
test/check/build/perf hoặc kiểm S22 trong lượt này; không có tuyên bố
runtime mới đã đúng. Chỉ thêm kế hoạch này và cập nhật mục riêng trong
CONTEXT, giữ nguyên công việc Sự kiện/Nhiệm vụ và nền động đang có.

Phê duyệt cân bằng tiếp theo 27/10 đã thay toàn bộ chỉ dẫn hỗ trợ mới
bằng 5%/10%/30%, giữ năng lượng 80%/20%, bỏ pity và yêu cầu đồ mạnh hiếm
hơn. Chỉ dẫn hỗ trợ 20%/50% ở cột hiện trạng là lịch sử code, không được
lấy làm cấu hình triển khai. Trọng số 60/30/10 trong mục 4 vẫn chờ chốt.

## 13. Prompt bàn giao cho agent triển khai

Đoạn dưới dùng cho lượt triển khai riêng. Nó không phải chỉ thị agent
đang cập nhật tài liệu bắt đầu code trong lượt hiện tại.

> Làm việc tại `C:\Users\Dang\MyProject\MemoryMatchV1.1a`. Đọc `AGENTS.md`,
> phần task rơi vật phẩm trong `CONTEXT.md` và toàn bộ
> `DROP_ENERGY_SPECIAL_CARDS_PLAN.md`; đây là nguồn phạm vi của task.
>
> Triển khai toàn bộ các phase P0 → D0 → D1 → L1 → M1 → T1 → T2 → Q1.
> Trước code, kiểm trạng thái Git, giữ mọi thay đổi có sẵn, nêu ngắn mục
> tiêu/ngoài phạm vi/rủi ro. P0 chỉ hỏi gộp các quyết định còn thiếu ở
> mục 4, không hỏi lại các quyết định đã duyệt; tiếp tục phần độc lập
> trong khi chờ, không đoán luật kinh tế hoặc schema ảnh hưởng dữ liệu.
>
> Chính sách mới nhất: năng lượng đặc biệt 80%, thường 20%; hỗ trợ
> thường 5%, đặc biệt 10%, Memory Special/Link Blue 30% thay nhánh chung.
> Hai nhánh độc lập, không pity, không dùng lại hỗ trợ 20%/50%. Đồ mạnh
> hiếm hơn; 60/30/10 trong pool là đề xuất chờ P0. Giữ Lucky/Magnet và
> các mốc đúng plan, không tự đổi 30/3 Triple hoặc giá shop. Memory Lucky
> mọi chế độ 1–3 cặp mỗi ván; Triple Lucky Thử thách +15 giây; Magnet 1
> thẻ mỗi đợt mọi chế độ, ưu tiên đồng loại trong khay rồi hút từ bàn.
> Vô tận vẫn nhận item thời gian vào kho; mức Xu đổi Lucky chốt ở P0.
>
> Giải quyết Magnet nguyên tử trước xét đầy khay; cập nhật solver,
> witness, hint/shuffle, snapshot và undo cùng semantics. Lưu dấu đã bốc
> cả khi trượt, chống nhận quà lặp qua undo/restore/retry. Commit cùng
> board/session/ví/kho trước hiệu ứng. Giữ đồ, tiến độ và quà cũ; migration
> idempotent có test, không reset người chơi. Firebase free và bảo mật
> cơ bản theo persistence hiện có; không thêm backend hoặc ghi theo tick.
>
> Thực hiện tuần tự đến cổng cuối khi đã đủ quyết định; không dừng sau
> gate trung gian. Chạy kiểm tra theo rủi ro và acceptance của plan,
> check/build ở cổng cuối; đo hiệu suất và lượng quà nhận/dùng/tồn theo
> phút chơi. Không gọi PC là đã kiểm S22 hoặc tự đổi cân bằng sau thử.
> Không sửa task Sự kiện/Nhiệm vụ/nền động; không tự commit/push/deploy/
> rules/APK. Cuối lượt báo ngắn phase đạt, file thay đổi, kiểm tra thật,
> dữ liệu giữ tương thích và giới hạn chưa xác minh. Nếu thiếu quyết
> định bắt buộc, báo cụ thể thay vì tự coi toàn bộ kế hoạch hoàn thành.
