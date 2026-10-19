# Kế hoạch tiến trình độ khó, wave và phần thưởng — ba trò

Ngày lập: 19/10/2026. Trạng thái: **được yêu cầu triển khai; đang làm phần model độc lập P1; P0 còn quyết định, chưa bật luật mới**.

Đây là nguồn phạm vi duy nhất cho thay đổi gameplay mới trong cuộc trao đổi này. Không mở lại các kế hoạch cũ và không trộn với công việc thống nhất UX/UI đang có trong working tree. Tài liệu kỹ thuật dành cho chủ dự án; câu chữ ở đây không được đưa nguyên văn lên giao diện người chơi.

## 1. Mục tiêu, phạm vi và trạng thái quyết định

Mục tiêu: tạo hai nhánh tiến triển song song — đi tiếp bằng Dễ để nhận EXP/rương, quay lại chinh phục đủ độ khó để hoàn thiện bộ sưu tập; thêm nhiều wave, cân lại điểm/xu và đa dạng bàn Triple mà vẫn bảo vệ dữ liệu và vòng đời game.

### 1.1. Đã chốt từ yêu cầu

- Mỗi màn Hành trình mở Dễ trước. Thắng Dễ mở Thường, thắng Thường mở Khó, thắng Khó mở Siêu khó ở chính màn đó.
- Thắng Dễ màn L mở Dễ màn L+1; không bắt hoàn thành bốn độ khó mới được đi tiếp.
- Hoàn thành cả bốn độ khó của một màn nhận một mảnh; đủ 10 màn trong một cụm nhận đủ 10 mảnh và phần thưởng bộ riêng.
- Mỗi lần thắng trọn màn/độ khó được 10 EXP; thắng Dễ màn 1–10 đủ 100 EXP để đạt rương C. Rương có các cấp C, B, A, S.
- Bổ sung đã chốt: hoàn thành 10 màn Dễ đạt rương C; nhận C chuyển sang B, hoàn thành 10 màn Thường đạt B; tiếp tục Khó→A và Siêu khó→S. Mỗi cấp cần 100 EXP của độ khó tương ứng, không gộp EXP độ khó khác để bỏ qua yêu cầu.
- Số wave theo màn: 1–10: 2; 11–50: 3; 51–90: 4; từ 91: 5.
- Wave áp dụng cho cả Hành trình, Thử thách và Vô tận của ba trò. Chế độ có thời hạn dùng một đồng hồ chung trong toàn màn: giữ giây dư và cộng thời gian khi vượt wave để tiếp tục; không cấp lại đồng hồ từng wave. Vô tận giữ nguyên đếm lên, không có thời gian cần tiếp tế.
- Điểm/xu theo đề xuất mới trước đó, được ghi rõ tại mục 3–4. Không giữ thưởng xu tăng vô hạn theo combo.
- Link tiếp tục khai thác trọng lực; đánh giá thêm kiểu dịch chuyển có ý nghĩa.
- Triple cần ít nhất 20 kiểu bố cục khác nhau thực sự, có vị trí/lớp có chủ đích; không đặt ngẫu nhiên tự do hoặc đếm phép xoay là kiểu mới.
- Memory chưa bổ sung một luật đặc biệt mới ngoài tiến trình và wave trong phạm vi này.
- Không thêm cấp tài khoản/XP hồ sơ. EXP mới phục vụ rương của hành trình.

### 1.2. Cần chốt ở P0 trước khi triển khai phần phụ thuộc

| Mã | Quyết định | Phương án đề xuất, chưa được coi là duyệt |
|---|---|---|
| D1 | EXP có lặp khi chơi lại? | Chỉ lần đầu thắng từng game + màn + độ khó + phiên bản luật; replay nhận xu/kỷ lục, không thêm EXP/mảnh |
| D2 — đã chốt | Chuỗi rương theo độ khó | C/Dễ → nhận → B/Thường → nhận → A/Khó → nhận → S/Siêu khó; 10 màn ×10 EXP cho mỗi cấp. Cần chi tiết nhỏ ở mục 2.2: ghi nhận trước và màn sau khi nhận S |
| D3 — đã chốt | Phạm vi wave | Cả ba mode của cả ba trò; đồng hồ chung trong màn, cộng thưởng giây khi vượt wave với mode có thời hạn |
| D4 | Số giây đầu màn/thưởng wave và combo | Chốt số giây tiếp tế, trần nếu có và ngân sách Challenge; bỏ giây combo và thưởng nhanh toàn màn tại mục 3, 5 vẫn là đề xuất chờ duyệt |
| D5 | Tiến độ/save và bảng xếp hạng cũ | Giữ dữ liệu/đồ đã nhận, tách chứng nhận luật cũ; không tự coi ván một wave cũ là ván nhiều wave mới |
| D6 | Vật phẩm bộ sưu tập, nội dung và giá trị rương | Chọn mảnh tranh/bản đồ kho báu; thưởng bộ và bảng thưởng C/B/A/S phải có catalog sản phẩm thật trước nghiệm thu |
| D7 | Khối lượng từng wave | Dùng kích thước theo độ khó làm baseline để mô phỏng, chưa mặc định nhân nguyên bàn cũ 2–5 lần khi nghiệm thu cân bằng |
| D8 | Kiểu trọng lực Link mới | Thẩm định hai kiểu cụ thể ở mục 7; chỉ rollout sau khi kiểm khả năng giải và duyệt hành vi |

Không cấp thưởng thay thế, tự chọn migration hoặc kích hoạt luật chưa chốt. Chủ dự án đã yêu cầu triển khai nếu không xung đột với agent giao diện; được làm model độc lập, không bật luật/schema khi còn quyết định phụ thuộc. Không tạo APK/deploy/push. Không commit các thay đổi có sẵn của công việc khác.

## 2. Tiến trình Hành trình và EXP/rương/mảnh

### 2.1. Luật mở khóa

- Nguồn sự thật: kết quả hoàn thành của từng màn/độ khó. Trạng thái mở khóa suy ra từ đó, không duy trì nhiều cờ độc lập.
- Màn 1 mở Dễ. Màn L>1 mở Dễ khi Dễ màn L−1 đã hoàn thành, theo phiên bản tiến trình đã chọn tại D5.
- Thường yêu cầu Dễ cùng màn; Khó yêu cầu Thường; Siêu khó yêu cầu Khó.
- Nút Chơi, tiếp tục từ summary, resume và lời gọi launch trực tiếp đều kiểm cùng luật; không chỉ làm mờ nút trong popup.
- Không có yêu cầu 2/3 sao để mở độ khó; thắng là đủ. Replay không làm giảm kỷ lục hay khóa lại tiến trình.
- Popup giữ bốn độ khó để nhìn thấy mục tiêu, hiển thị khóa rõ và ngắn; không cho bấm Chơi vào mức chưa mở. Không tự chuyển map sang chế độ khó hơn khi người chơi muốn đi tiếp Dễ.

### 2.2. EXP và chuỗi rương đã chốt; chính sách replay còn chờ D1

- Một chiến thắng là clear toàn bộ wave của một màn ở một độ khó, không phải clear một board.
- Một cụm: màn 1–10, 11–20, ...; mỗi game có tiến độ riêng. Giữ chặng lưu trữ hiện có 100 màn, không đổi thành chặng 10 màn.
- Trong cùng cụm 10 màn, từng độ khó có tiến độ EXP riêng: Dễ cấp C, Thường cấp B, Khó cấp A, Siêu khó cấp S. Mỗi lần thắng đủ wave nhận 10 EXP; cần hoàn thành 10 màn thuộc độ khó tương ứng để đạt 100 EXP/cấp.
- Chuỗi nhận: C đủ điều kiện → người chơi nhận C → hiển thị B → nhận B → hiển thị A → nhận A → hiển thị S → nhận S. Không dùng tổng 200/300/400 EXP trộn độ khó để mở cấp cao. Có thể lưu tổng thành tích 400 nhưng tổng này không là điều kiện mở riêng.
- Mỗi cấp nhận một lần theo game + cụm + cấp + phiên bản luật, claim trước phải được commit rồi mới chuyển cấp. Không xóa lịch sử hoặc EXP đã ghi để biểu diễn cấp mới; UI đọc EXP của độ khó ứng với cấp hiện tại.
- Đề xuất cần chốt trước code: hoàn thành Thường/Khó/Siêu khó trước khi nhận cấp trước vẫn được ghi nhận, sau khi chuyển cấp hiển thị đúng EXP đã kiếm, không bắt chơi lại. Sau S đánh dấu cụm đã hoàn tất; cụm 10 màn sau có chuỗi riêng. Không tự khóa chơi Thường chỉ vì chưa bấm nhận C; khóa độ khó vẫn theo từng màn.
- EXP chỉ phục vụ rương Hành trình theo phạm vi đã bàn; việc thêm rương EXP riêng cho Thử thách/Vô tận chưa được yêu cầu. Wave/điểm/xu áp dụng các mode đó nhưng không tự nhập tiến độ special vào rương Hành trình.
- Nhận rương không thay trạng thái bộ sưu tập; thắng đủ Siêu khó vẫn phát mảnh dù chưa bấm nhận rương trước.
- Luật mới thay điều kiện rương Hành trình cũ khi rollout; không vô tình nhận cả rương cũ và rương mới từ cùng một mốc. Catalog thưởng phải được cân lại cho bốn lần nhận; không nhân bốn nguyên bảng thưởng rương cũ.

### 2.3. Bộ sưu tập

- Mỗi màn có một vị trí mảnh ổn định trong bộ 10 mảnh. Clear Siêu khó sau chuỗi ba mức trước xác nhận nhận mảnh một lần.
- Mảnh là quyền sở hữu lâu dài; không tiêu hao và không rơi ngẫu nhiên. Replay không phát mảnh thứ hai.
- Đủ 10 mảnh mở phần thưởng bộ riêng; claim cùng transaction với grant, có ID chống lặp, không phụ thuộc đã nhận rương S hay chưa.
- D6 chưa chốt: chưa vẽ asset hàng loạt, chưa cấp đồ vô danh hoặc đưa chữ thử nghiệm lên UI. P7 phải hoàn tất catalog/art thật trước nghiệm thu toàn task.

## 3. Điểm, combo, thưởng nhanh và sao

### 3.1. Điểm ghép đã chốt

- Một nhóm = một cặp Memory/Link hoặc một bộ ba Triple.
- Điểm người chơi ghép = `10 + 2 × min(max(combo − 1, 0), 4)` → 10, 12, 14, 16, 18; từ combo 5 giữ 18.
- Số combo vẫn có thể tăng để thể hiện thành tích nhưng không nhân tiếp điểm/xu/thời gian.
- Ghép sai ngắt combo, không trừ điểm/xu. Giữ quy tắc xác định ghép sai riêng từng trò và các cửa sổ combo hiện có làm baseline; không âm thầm đổi luật chọn thẻ Triple.
- Bỏ hệ số điểm ×1,5 cho thẻ đặc biệt; thẻ vẫn giữ tác dụng công cụ/năng lượng theo catalog đã cân.
- Nhóm tự phá bằng công cụ/mốc nhận đúng 10 điểm và không tăng combo; giải quyết thống nhất Sấm sét, phá tự động và các nhánh fallback, không bỏ sót điểm hoặc đếm hai lần.
- Combo reset khi sang wave; điểm toàn màn cộng dồn. Kỷ lục chỉ ghi sau khi thắng wave cuối, riêng theo màn/độ khó/phiên bản luật.

### 3.2. Thưởng nhanh đề xuất, thuộc D4

- Thay đề xuất thưởng nhanh từng wave để phù hợp đồng hồ chung: `N_i` là số nhóm ban đầu; `B=10×ΣN_i`, `P` là thời gian chơi thực tế toàn màn theo playMetrics; `T` là ngân sách cơ bản toàn màn gồm giây đầu màn + các khoản tiếp tế wave đã quy định, không gồm thời gian mua/lucky/milestone.
- Phương án chờ duyệt: `H = round(0,3 × B × clamp(1 − P/T, 0, 1))` nếu có thời hạn; Vô tận `H=0`. Tiếp tế cần được định nghĩa độc lập với tốc độ chơi để không tạo vòng tính thưởng tự tham chiếu.
- Tổng điểm màn = tổng điểm ghép mọi wave + H. Chỉ cộng H một lần khi thắng wave cuối; snapshot wave lưu điểm ghép đã chốt và metric, không cộng thưởng nhanh trung gian.
- Không dùng remainingTime đã mua/thưởng để tính thưởng nhanh. Pause/modal/background không tính vào P; thời gian chơi dưới tác dụng dừng đồng hồ vẫn tính vào P. Khóa input cho animation không tự coi là pause.
- Sử dụng playMetrics hiện có, bổ sung mốc wave có owner rõ; không thêm vòng timer hoặc nguồn đo thời gian song song.

### 3.3. Sao đề xuất để đi cùng điểm mới

Gọi `B=10×ΣN_i` của tất cả wave đã cấu hình từ lúc bắt đầu, không lấy số nhóm còn lại hoặc chỉ nhóm ghép thủ công.

| Trạng thái | Có thời hạn | Vô tận |
|---|---:|---:|
| Thắng wave cuối | Tối thiểu 1 sao | Tối thiểu 1 sao |
| 2 sao | `ceil(1,30×B)` | `ceil(1,25×B)` |
| 3 sao | `ceil(1,65×B)` | `ceil(1,55×B)` |

- Khi chưa hoàn thành chỉ hiển thị tiến độ sao; không coi 1 sao hoàn thành là đã đạt trong wave đầu.
- Điểm/sao đã đạt giữ max theo cùng phiên bản luật; totalScore tăng bằng phần cải thiện, không cộng toàn bộ replay. Không so điểm/sao của hai phiên bản luật làm cùng một kỷ lục.
- Kiểm khả năng đạt sao cho các bàn nhỏ khi combo reset từng wave và sau công cụ tự phá; không đặt ngưỡng 3 sao cao hơn điểm có thể đạt. Hệ số sao là baseline đề xuất, được chốt cùng D4.

## 4. Kinh tế xu đã chọn và các nguồn phụ

`Xu thắng = round((10 + N × K) × D) + 2 × sao`.

- `N=ΣN_i` của toàn màn; K: Memory=1, Link=1, Triple=1,2.
- D: Dễ=1; Thường=1,2; Khó=1,5; Siêu khó=1,8; Thử thách/Vô tận=1,3.
- Chỉ có một khoản thưởng thắng sau wave cuối; không cộng khoản gốc 10 cho mỗi wave.
- Bỏ xu trực tiếp theo từng nhóm/combo và phạt xu do ghép sai. Các vật phẩm đã chi vẫn được ghi nhận bền vững.
- Chơi lại thắng vẫn nhận xu theo công thức, dù điểm thấp hơn; thất bại không nhận xu thắng. Việc EXP có lặp độc lập và chờ D1.
- Rà soát tất cả nguồn phụ: lucky, năng lượng, milestone, tự phá, chuyển đổi đầy kho, rương/bộ, vật phẩm thời gian và giá shop. Không chỉ thay hàm reward khi win.
- Giữ vai trò milestone chủ yếu thưởng công cụ. Bảng số lượng, tỷ lệ và fallback phải có bảng before/after được duyệt, gồm loại bỏ cấu hình rơi năng lượng 100% mang tính kiểm tra nếu không còn phù hợp; không tự đặt lại xác suất theo comment cũ.
- Thưởng xu khi thắng, EXP, best, mở khóa và mảnh dùng một settlement ID/transaction. Dùng lại settlement không phát xu lần hai; replay hợp lệ là lượt mới có ID mới.
- Cân theo xu/phút, tỷ lệ mua công cụ và độ dài thực tế, không ép ba trò có cùng xu/màn. Nhiều wave làm N tăng phải được mô phỏng; không tăng khối lượng nhưng quên kiểm thu nhập/rương.

## 5. Thời gian, wave và thao tác người chơi

### 5.1. Số wave

| Màn | Wave/một lần chơi ở một độ khó |
|---|---:|
| 1–10 | 2 |
| 11–50 | 3 |
| 51–90 | 4 |
| ≥91 | 5 |

Hàm thuần kiểm biên 1/10/11/50/51/90/91 và level không hợp lệ. Sinh theo nhu cầu; không tạo sẵn hàng trăm nghìn màn hay toàn bộ board của các wave trong DOM.

### 5.2. Đồng hồ chung đã chốt; lượng giây chờ D4/D7

- Cấp giây một lần khi bắt đầu màn, đồng hồ chung xuyên suốt các wave; khi clear wave chưa phải cuối: `remainingTime mới = remainingTime cũ + thưởng chuyển wave`. Không reset giây dư hoặc áp dụng luật carry cũ giữa level vào biên wave.
- Chỉ cấp tiếp tế để sang wave kế; wave cuối không được cộng thêm giây sau khi thắng rồi đổi khoản đó thành điểm. Mỗi khoản tiếp tế có receipt theo attempt + wave, cấp đúng một lần kể cả reload/retry.
- Baseline ngân sách một board vẫn có thể tham khảo `Q_i = 5 × round((20 + N_i × S × F)/5)` giây, S: Memory=6, Link=4, Triple=5; F: Dễ=1,2, Thường=1,1, Khó=1, Siêu khó=0,9. Q không có nghĩa là cấp lại đồng hồ từng wave.
- D4 cần chọn khoản tiếp tế cố định hoặc theo ngân sách wave kế tiếp, số giây và trần carry; chưa tự đặt 10 giây hoặc cấp nguyên Q_i. Mô phỏng/chơi thử phải chứng minh đủ ngân sách thực tế cho 2–5 wave; không chỉ tăng thời gian đầu màn bằng tổng wave rồi tiếp tục cộng trùng thưởng wave.
- Bỏ giây combo cho mọi mode là đề xuất còn chờ D4; không lẫn với giây tiếp tế chuyển wave đã được chủ dự án chốt.
- Kiểm nhịp/mật độ/budget và thời lượng thực trước chốt kích thước wave. Không giảm kích thước tùy ý chỉ để test pass, không nhân nguyên full board năm lần mà chưa đo lượt chơi.
- Vật phẩm cộng giây tác động đồng hồ chung của màn và phần dư được mang sang wave sau. Dừng đồng hồ không tự kéo dài cửa sổ combo. Hành vi khi dùng ngay biên chuyển wave phải có guard, không mất đồ hoặc nhân thời gian. Việc freeze còn hiệu lực qua biên wave cần ghi rõ trong D4/snapshot, không tự xóa hoặc cấp lại.
- Intro/xem trước khởi động đồng hồ sau readiness theo luật của game. Sóng tiếp theo không tự coi là thắng màn, không mở popup tổng kết/EXP/rương.
- Cả Hành trình/Thử thách/Vô tận đều có nhiều wave theo cùng bảng mốc. Challenge dùng đồng hồ chung và tiếp tế giữa wave; thời gian đầu level/carry giữa level là quyết định riêng ở D4, không tự đổi theo luật biên wave. Endless giữ đồng hồ đếm lên xuyên suốt wave trong cùng level, không cộng giây thưởng, không có thưởng nhanh. New/restart special vẫn về màn 1/wave 1; resume giữ đúng run/wave. Chính sách cộng dồn đồng hồ qua level special không đổi ngoài quyết định D4.

### 5.3. Snapshot và state machine

Chuỗi nghiệp vụ: `preparing → playing wave i → committing wave i → preparing wave i+1 → ... → committing result → completed`, có nhánh lost, cancelled và recovery theo owner controller hiện hữu. Không tạo tập cờ song song.

- Tại một thời điểm có đúng một board hoạt động. Chuyển wave giải phóng scope con của board/animation/combo, giữ shell và chủ lượt; không rebuild shell hoặc nhân timer/listener.
- Mỗi lượt có attempt ID, mỗi wave có identity/index; callback kiểm cả generation/identity liên quan, không để animation wave cũ sửa board mới.
- Snapshot có rulesVersion, waveCount, waveIndex, phase, seed/layout ID, board đang chơi, ngân sách và thời gian, điểm đã chốt từng wave, session metric và receipt liên quan. Phải lưu đủ để tính lại kết quả mà không nhân thưởng.
- Checkpoint chuyển wave phải bền vững và idempotent: reload sau clear wave, trước tạo wave mới hoặc sau settle đều tiếp tục đúng; lỗi lưu chặn advance, không bỏ board cũ rồi mất trạng thái.
- Lưu cùng transaction khoản giây tiếp tế, wave đã vượt và wave kế; resume không cấp tiếp tế lần hai. Chốt thứ tự sự kiện ở biên hết giờ/clear: một wave chỉ có một outcome theo luật game; không dùng callback chậm để hồi sinh ván đã thua. Chuyển board/preview không được âm thầm tiêu hao đồng hồ khi người chơi chưa thể chơi, pause này phải có owner/metric rõ.
- Không cộng XP/mảnh/checkpoint bảng xếp hạng ở wave trung gian. Thua wave sau không làm màn trở thành đã thắng; không thu hồi đồ/chi tiêu đã commit hợp lệ.
- Chơi lại Hành trình bắt đầu wave 1 của màn/độ khó đó; tiếp tục phiên bắt đầu đúng wave/snapshot đã lưu. Pause/resume/background trong chuyển wave có đường hủy, không mount sau khi đã thoát.
- HUD hiển thị `Đợt 1/2` hoặc cách gọi sản phẩm được duyệt; tên thuật ngữ trên UI thống nhất, không dùng state/seed/transaction. Summary chỉ xuất hiện một lần, phân biệt xu màn, điểm và thành tích.

## 6. Triple: ít nhất 20 bố cục có chủ đích

Chọn thư viện mẫu matrix/slot có tham số, thay vì ngẫu nhiên tọa độ rồi thử sửa. Sinh tự do khó kiểm soát hình dạng, vùng chạm, cover graph và thời gian solver; thư viện mẫu có seed lựa chọn cho kết quả tái hiện được và CPU/bộ nhớ có giới hạn.

- Module layout catalog/generator riêng, trả model slot ID/x/y/layer/bounds; renderer chỉ vẽ, rules chỉ xử lý cover/exposed/tray; không đưa luật chọn hình vào shared shell.
- Mỗi mẫu có constraints số nhóm/lớp, mặt nạ ô hợp lệ và mật độ; tổng thẻ chia hết cho 3, không ép cùng một mẫu có mọi tileCount nếu làm hỏng hình. Số thẻ thực của layout được chốt trước khi tính thời gian/điểm/xu/sao.
- Danh sách thiết kế ban đầu 20 mẫu: kim cương, tháp bậc, vòng tròn rỗng, oval, vòm cầu, móng ngựa, xoắn ốc, cánh quạt, hoa bốn cánh, hoa sáu cánh, bướm, lá, sao năm cánh, trái tim, sóng ngang, đường zíc zắc, hai đảo nối cầu, ba đảo tam giác, bốn tháp góc, mê cung hành lang. Đây là danh sách đề xuất để làm contact sheet; mẫu không đọc được trên mobile phải thay, không chỉ đổi tên để đủ 20.
- Phép xoay/lật/thay thứ tự loại thẻ không tính là bố cục mới. Cần signature cấu trúc để tránh trùng hình học; các biến thể vẫn có thể dùng sau khi đã đủ 20 mẫu thật.
- Chọn theo game/màn/độ khó/wave/seed; lịch chống lặp gần nhất có giới hạn và được lưu tối thiểu. Không sinh ngẫu nhiên lại khi hydrate phiên.
- Sinh cách gán thẻ phù hợp luật khay và chạy solver kiểm nghiệm. Giới hạn attempts/nodes/memo/deadline, có hủy và seed fallback đã chứng nhận tương thích mẫu; hết budget không được coi là không giải được hoặc treo giao diện.
- Giữ khay 7–10 và quyền mua mở rộng, Undo/Shuffle; xử lý snapshot/cover graph/DOM cũ cùng một wave identity. Không thay item/effect ID.
- QA từng mẫu với các độ khó hỗ trợ, portrait hẹp, phổ biến, landscape/desktop; không để slot chồng không hợp lệ, nằm ngoài board, bị khay/HUD che hoặc chỉ chạm được qua ảnh thẻ phía trên.

## 7. Memory và Link

### Memory

- Thay nhóm hình có kiểm soát giữa wave và giữ lịch chống lặp theo theme; không giữ asset/node của mọi wave trong bộ nhớ.
- Preview là bước khởi động của từng wave theo luật đã chốt; không tiêu hao time/combo trước khi readiness xong.
- Chưa thêm thẻ mới, luật che/lật mới hoặc cơ chế đặc biệt khác; dùng độ khó, hình và nhịp wave để thử trước.

### Link

- Tái sử dụng registry/progression trọng lực hiện có, giới hạn cấp độ hình học thay vì tăng số tile vô hạn.
- Có thể đổi trọng lực theo wave từ tĩnh sang dồn/tách/xoay, nhưng mỗi wave xác định sẵn quy tắc, không đổi khó đoán sau mỗi thao tác.
- Hai ứng viên mới để thẩm định D8: (a) dồn về đường chéo theo hai bước trục có thứ tự cố định; (b) dồn theo từng phần tư về bốn tâm cục bộ. Phải mô tả thứ tự fill, băng, biên đường nối và biểu thị trước khi code; không gọi chúng là trọng lực sẵn có.
- Mọi dịch chuyển giữ instance ID, không mất/nhân thẻ, số lượng nhóm hợp lệ và pathfinding tối đa hai rẽ. Sau settle kiểm cặp hợp lệ, xử lý kẹt bằng cơ chế hiện có; không dùng retry vô hạn hoặc auto-reshuffle che lỗi ánh xạ.
- So sánh lựa chọn thêm nhiều kiểu ngay với rollout hai kiểu đã chứng nhận. Chọn ít kiểu rõ ràng, dễ đọc; không đặt số lượng kiểu mới thành mục tiêu thay tính chơi được.

## 8. Ownership, dữ liệu cũ và bảng xếp hạng

### 8.1. Ranh giới thay đổi dự kiến

| Owner hiện tại | Phần liên quan |
|---|---|
| adventureProgress/adventureLaunch/adventureMap + popup preview | Khóa độ khó/màn, cụm 10, trạng thái rương/mảnh và kiểm launch |
| config/linkConfig/tripleConfig + gameplayTuning | Quy tắc tính điểm, reward, thời gian và bảng tham số có version |
| gameController/logic, linkController/linkTurn, tripleController/tripleRules | Điều phối wave và thời điểm commit, luật chọn thẻ riêng |
| sessionProgress/memorySession/pairSessionSnapshot/tripleState | Normalize và snapshot đủ wave, tương thích phiên cũ |
| persistence/chapterStore/cloudSnapshot + merge/recovery | Giao dịch, schema/version, receipt và đồng bộ |
| adventureRewards + model phần thưởng thuần dùng chung | EXP/rương/mảnh/claim; renderer không cấp đồ |
| playMetrics/rankingRules/progressRankingModel/rankingResult/service | Đo thời gian toàn lượt và không công nhận wave dở thành màn thắng |
| tripleBoard/tripleSolver/tripleRenderer + catalog layout mới | 20 mẫu, seed, validation và rendering |
| themeSelection/appearance/shop | Lịch chọn hình, ownership đồ thưởng và chi tiêu |

Không chia lại toàn bộ controller chỉ vì task lớn. So sánh hai phương án wave: ba implementation độc lập dễ lệch settlement; runtime chung chứa nhánh game sẽ lấn ownership. Chọn model/config thuần dùng chung cho wave/result, còn controller mỗi trò sở hữu board/lifecycle qua contract nhỏ. Chỉ tạo abstraction có nhu cầu thực từ cả ba trò, không thêm framework mới.

### 8.2. Dữ liệu và tương thích

- Bổ sung payload có version thay vì đổi nghĩa khóa cũ âm thầm. Không chọn schema cụ thể trước khi inventory storage/local/cloud và D5 hoàn tất.
- Dẫn xuất EXP/mảnh từ receipt thắng đã chứng nhận, cache chỉ để đọc nhanh; claim ID theo game/cụm/cấp hoặc bộ. Giao dịch win/claim nhiều bước phải atomic/rollback/recovery, không dựa vào UI disabled để chống nhận lặp.
- Các grant đã nhận, wallet, inventory, theme và stats riêng tư được giữ. Không tự reset tài khoản hoặc ghi đè backup.
- D5 phải chọn rõ: tiến độ cũ được grandfather mở màn thế nào, sao/score cũ hiển thị ở đâu, phiên cũ được hoàn thành theo luật cũ hay chuyển đổi thế nào, rương cũ ảnh hưởng rương mới ra sao. Không suy ra EXP hoặc mảnh từ record chưa có wave proof.
- Migration chạy lại không nhân grant, không tăng totalScore; test thiếu/lạ/hỏng field, bản mới hơn, mất mạng, hai tab, đổi UID, guest link, cloud conflict. Không lấy max EXP đơn giản nếu các thiết bị có tập receipt khác nhau; dedupe theo kết quả/cấp đã nhận.
- Receipt chi tiết phân trang theo chặng; cache có giới hạn. Không scan toàn bộ 100.000 màn mỗi lần render popup/nhận rương.
- Bảng xếp hạng vẫn là màn cao nhất hoàn thành, không chuyển sang EXP/điểm/tổng wave. Thay đổi chuẩn hoàn thành cần rulesVersion/cohort được duyệt, tránh trộn màn một wave cũ và nhiều wave mới; phải xử lý query/outbox/rules/client cũ, không chỉ đổi nhãn.
- Ngăn client cũ ghi đè tiến trình mới; giữ public API hiện có qua boundary tương thích nếu được, thay đổi cần thiết phải liệt kê và duyệt ở P0/P1. Không hứa schema không đổi cho tính năng cần thêm wave/receipt.

## 9. Phase triển khai và commit

Chủ dự án đã giao thực hiện toàn bộ với điều kiện không xung đột agent giao diện. Chạy tuần tự đến P9 khi đủ quyết định phụ thuộc, mỗi phase hoàn tất có commit riêng chỉ chứa phạm vi của phase; không dừng để chờ “tiếp tục” ở checkpoint nội bộ. Không stage thay đổi có sẵn. Mỗi phase cập nhật một receipt chung `docs/qa/gameplay-progression/RECEIPT.md`, không tạo báo cáo rời mỗi lỗi nhỏ.

| Phase | Công việc / dependency | Gate hoàn thành và commit dự kiến |
|---|---|---|
| P0 — Chốt sản phẩm và baseline | Giữ D2/D3 đã chốt; hoàn tất D1/D4–D8 và chi tiết claim; bảng ví dụ chuẩn; inventory current save/session/cloud/ranking và thay đổi đang có; đo lượt chơi mẫu trước thay | Không còn quyết định ảnh hưởng phase sau; source of truth và phạm vi được duyệt. `docs: approve progression and economy rules` |
| P1 — Model thuần và hợp đồng | Hàm khóa, số wave, score/star/coin, EXP/rương/mảnh, identity/version và contract adapter; chưa bật luật mới trong UI | Unit biên, golden examples ba trò, max-safe levels, tính đạt sao. `feat: add progression and reward rule models` |
| P2 — Persistence và tương thích | Snapshot/version/receipt/chapter/cloud/recovery; migration theo D5; client cũ và rules/cohort | Fault injection các điểm commit, idempotency, offline/reload/UID/two-tabs; không mất grant cũ. `feat: persist versioned waves and reward receipts` |
| P3 — Khung wave và Memory | Áp dụng model vào Memory, tiếp nối wave, timer/metrics, điểm/xu mới, chống stale callback; tạm giữ gating rollout | Memory thật đủ 2–5 wave, restart/resume/pause/thoát/kill ở biên; đúng một settle. `feat: add wave progression to memory match` |
| P4 — Link | Wave, score/rewards thống nhất, trọng lực hiện có và kiểu D8 đã duyệt, auto-break/freeze | Pair/path/transform đúng; nhanh tay, freeze và thunder ở biên wave; không mất/nhân tile. `feat: add link waves and validated gravity rules` |
| P5 — Triple | Catalog ≥20 mẫu + compiler/selection/solver, wave, rewards/Undo/Shuffle/tray | Đủ 20 hình khác biệt qua contact sheet; seeded correctness/solveability/budget/cancel; snapshot đúng layout. `feat: add triple layout variety and waves` |
| P6 — Khóa độ khó và tiến độ UI | Map/popup/launch/summary, HUD wave, tiếp tục Dễ và replay độ khó, sao toàn màn | Không bypass khóa; thắng wave đầu không mở màn; responsive/a11y; UI tự nhiên đúng skin hiện hành. `feat: expose difficulty mastery progression` |
| P7 — EXP/rương/bộ sưu tập | Grant lần đầu theo D1, mốc theo D2, catalog/art sản phẩm theo D6, claim/display thật; thay rương cũ | Clear Dễ 1–10 đạt C; 10 Siêu khó đủ bộ; replay/network/reload không nhận lặp; đồ dùng được. `feat: add expedition chests and collectible sets` |
| P8 — Cân bằng và ranking | Mô phỏng + chơi mẫu, tune wave/time/reward theo dữ liệu và duyệt; certified max-level cohort/outbox | Bảng so sánh xu/phút, thời lượng và sao; so được trước/sau, không trộn luật ranking, không nới test để pass. `feat: align rankings and balance multi-wave runs` |
| P9 — Regression và review cuối | Matrix đầy đủ, build/check, performance/lifecycle, review độc lập, cập nhật CONTEXT/ARCHITECTURE/help | Tất cả gate được chứng minh; một receipt chung ghi pass/fail/skipped và giới hạn máy thật; chỉ web. `test: verify progression lifecycle and compatibility` |

Trong P3–P5, kết nối luật mới qua cấu hình rollout nhất quán sau P2 để tránh trạng thái nửa luật cũ/nửa luật mới trong cùng một phiên. Không phát hành phase trung gian chưa đủ settlement/migration. Việc bật chính thức thuộc P9 sau khi review, không đồng nghĩa deploy.

## 10. Kiểm thử và tiêu chí nghiệm thu

### 10.1. Luật và dữ liệu

- Khóa đủ ma trận ba trò × bốn độ khó, lần đầu/replay/lose/resume; chặn direct launch và tính đúng màn/chặng xa, không quét toàn lịch sử.
- Wave biên 10/11, 50/51, 90/91; N tính từ nhóm ban đầu tất cả wave; mỗi wave chốt đúng một lần. Full run có exactly một result, +10 EXP theo D1, +mảnh khi đủ bốn mức.
- Mẫu 10 Dễ: 100 EXP/rương C nhưng 0 mảnh nếu chưa hoàn thiện màn. Mẫu đủ 40 kết quả: 400 EXP, 10 mảnh và đủ mốc S theo D2. Claim C rồi B vẫn hợp lệ; nhận đồng thời hai tab không nhân xu/đồ.
- Rương: 5 Dễ +5 Thường không thay thế 10 Dễ để nhận C; 10 Dễ +5 Thường không đủ B. Nhận C mới chuyển UI sang B; nhận B/A/S đúng một lần, và kiểm progress kiếm trước khi claim theo quyết định được chốt.
- Đồng hồ: giây dư được giữ, thưởng wave cấp một lần, wave cuối không phát thêm giây; reload ngay biên không nhân thưởng; hết giờ/clear cùng tick không có hai outcome. Endless không reset số giây ở giữa wave và không tăng do thưởng tiếp tế.
- Combo 1/2/4/5/6/30; nhóm tự phá; special; sai; P=0/T/>T; ngưỡng sao bằng/thiếu một điểm; làm tròn .5; điểm không âm/NaN. Golden examples tính bằng hàm sản phẩm và bảng độc lập.
- Failure giữa từng bước chuyển wave/settle/claim, hard reload và offline reconnect; bảo toàn inventory đã chi và không chứng nhận wave dở là thắng màn. Migration cũ/thiếu/hỏng/lạ/version mới và merge receipt không lặp.

### 10.2. UI/lifecycle/performance

- Viewports tối thiểu 320×568, 412×915, 844×390, 1024×900; normal/reduced-motion; chuột/bàn phím và touch giả lập. Touch thật/S22 Ultra nếu chưa có thì ghi chờ, không tuyên bố 60 FPS máy thật.
- Chụp map, popup khóa, HUD wave, chuyển wave, pause/mua/thắng/thua, rương/bộ. Giữ skin vườn/gỗ/giấy dịu đã duyệt, tiêu đề rõ, hit target/focus/scroll/safe-area/banner đúng.
- Test thao tác nhanh và lặp tối thiểu 30 chu kỳ mở/thoát/restart/chuyển mode/biên wave; số shell/board/timer/listener/observer/effect registry trở về baseline, không giữ DOM/asset wave cũ. Không chỉ đo một lần.
- Triple: mọi mẫu trên các độ khó hỗ trợ có nhiều seed cố định và đường solver độc lập; kiểm slot/cover/divisibility và hit testing. Hết budget phân biệt với chứng minh vô nghiệm. Chi phí generator/cover graph/cancel, long task, heap sau warmup được ghi, fallback được thử.
- Mô phỏng điểm/xu tối thiểu ba mức kỹ năng, có/không trợ giúp, 2/3/4/5 wave; chơi mẫu đo cả thời gian animation và mức lặp. Đích 60 FPS trên mobile là mục tiêu, không thay số đo bằng tuyên bố.
- Không dùng emoji/font glyph làm hình trang trí hoạt ảnh; tái sử dụng SVG/CSS/canvas hiện có. Chỉ dùng imagegen nếu D6 thật sự cần tranh/mảnh bitmap mới, không tạo sheet cho icon có thể vẽ bằng hệ thống hiện hành.

### 10.3. Cổng cuối và review

- Chạy static/unit/contract phù hợp từng phase; P9 chạy `npm run check`, `npm run build` và Playwright mục tiêu + regression của shell/layout/lifecycle/progression/persistence/ranking/shop theo thay đổi thật.
- Review độc lập đọc diff cuối, đối chiếu mục 1 và chạy lại bằng chứng trọng yếu: settlement duplicate, wave resume, unlock bypass, migration/merge, Triple layout/solver và lifecycle. Không chỉ tin báo cáo implementation.
- Receipt duy nhất ghi bảng kiểm/ảnh/số đo/failure đã sửa và rủi ro còn lại. CONTEXT/ARCHITECTURE cập nhật trạng thái/thay đổi hợp đồng đúng kết quả.
- Không APK nếu không có yêu cầu rõ; không tự deploy/publish/push. Tài liệu kế hoạch không được đánh dấu implementation pass.

## 11. Trạng thái hiện tại

- Hoàn tất: đối chiếu owner hiện có và lập toàn bộ kế hoạch; model độc lập `js/progression/gameplayRules.js`, `difficultyProgress.js` và unit test, chưa nối runtime. Model tính tiến độ từ record đã chứng nhận, không quyết định/cấp EXP replay hoặc migrate record cũ.
- P0 chưa đạt vì còn luật cần chủ dự án chốt; P1 mới phần độc lập, chưa đánh dấu toàn phase pass. P2–P9 chưa thực hiện; chưa bật công thức mới hoặc đổi gameplay/schema/dữ liệu người chơi.
- Ranh giới với task UI: chỉ tạo file mới dưới `js/progression/`, `tests/unit/progression.test.js` và receipt task; không sửa CSS, popup/HUD, controller hoặc package.json đang có thay đổi. `CONTEXT.md` chỉ cập nhật đúng dòng task gameplay, không stage vào commit khi chứa công việc task khác.
- Đã cập nhật theo trả lời: D2 chuỗi rương gắn độ khó và D3 wave cả ba mode/đồng hồ chung đã chốt. Đang chờ D1, lượng giây/chi tiết ở D4, D5–D8 và chính sách ghi nhận trước khi claim; không buộc quyết định hình mỹ thuật chi tiết trước khi chốt luật cơ bản.
