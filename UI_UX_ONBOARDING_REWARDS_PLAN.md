# Kế hoạch cải thiện hướng dẫn, câu chữ và trải nghiệm phần thưởng

Ngày lập: 22/10/2026. Trạng thái: **R0–R8 đã nghiệm thu phạm vi web**. Kết quả, giới hạn mỹ thuật/thiết bị thật và từng gate tại [IMPLEMENTATION.md](docs/design/advanced-ui/IMPLEMENTATION.md), phần R0–R8. Review cuối là tự review riêng, không nhận review độc lập.

Đây là kế hoạch thực thi hiện hành duy nhất cho yêu cầu mới về hướng dẫn và phần thưởng. `GAME_UX_SKIN_PLAN.md` cùng hồ sơ G0–G10 là nền tảng đã triển khai, không phải bằng chứng những tiêu chí UX mới dưới đây đã đạt. Không mở lại toàn bộ công việc skin, âm thanh, hiệu ứng bàn chơi hoặc hoạt ảnh bản đồ.

## 1. Mục tiêu, phạm vi và quyết định thiết kế

### 1.1. Kết quả người chơi phải nhận được

1. Lần chơi đầu mỗi trò được hướng dẫn thao tác cơ bản bằng bàn tay và hành động thật; có thể bỏ qua, xem lại.
2. Mỗi bước biết rõ cần chạm đâu, thao tác đã đúng hay sai và vì sao. Không có trạng thái chỉ còn đường nối trên khoảng trống gây hiểu nhầm.
3. Popup thắng tập trung vào kết quả và chơi tiếp; không chứa EXP, tiến trình rương hoặc mảnh tranh.
4. Tiến trình rương có nơi xem cố định trên bản đồ; mục tiêu, điều kiện mở và phần thưởng dễ hiểu.
5. Bộ sưu tập có mục đích rõ: kiếm mảnh, hoàn thiện tranh, nhận thưởng và xem lại tranh.
6. Nội dung toàn ứng dụng dùng ngôn ngữ dành cho người chơi, gồm cả nhãn truy cập, thông báo lỗi và trạng thái rỗng.

### 1.2. Phạm vi được chốt trong kế hoạch này

- Cả Memory Match, Link Connect và Triple Connect; hai giao diện Mặc định/Nâng cao.
- Tự mở một lượt nhập môn cách ly trước ván đầu; bài nhập môn dùng hình thẻ và phong cách bàn chơi hiện hành. Cài đặt → Hướng dẫn dùng lại cùng bài.
- Chọn cách ly vì bài nối bị chặn cần bàn mẫu kiểm chứng được; chỉ dẫn trên ván thật sẽ phải xử lý RNG, thời gian và thưởng. Không tự sửa seed hoặc tạm dừng thêm đồng hồ ván thật để phục vụ bài học.
- Các gợi ý công cụ, đợt chơi, kho báu và mảnh tranh xuất hiện tại vị trí tính năng thật khi gặp lần đầu. Không ép thực hiện giao dịch hoặc tiêu công cụ để vượt hướng dẫn.
- Giữ số EXP nội bộ hiện có; trên giao diện dùng số màn hoàn thành làm tiến trình chính của rương.
- Đủ 10 mảnh vẫn hoàn thiện tranh và nhận 300 Xu một lần. Không thêm rương đặc biệt hoặc khoản thưởng thứ hai.
- Cho phép thay nội dung tranh sau này. Lượt này thiết kế giao diện và hợp đồng nội dung thay được; **không tự coi ba tranh đang có là mỹ thuật đã được chủ dự án duyệt**.

### 1.3. Ngoài phạm vi

- Hoạt ảnh cảnh nền bản đồ, viết lại effect/exit engine, thay đổi thuật toán hay tốc độ luật chơi, âm thanh và quảng cáo.
- Viết lại toàn bộ skin, đổi năm tab điều hướng, thêm battle pass, gacha, độ hiếm, giao dịch mảnh hoặc bộ sưu tập có thời hạn.
- APK, deploy, push, thay quyền Windows/Git/sandbox hoặc dịch vụ bên ngoài.
- Tạo cả catalog tranh mới. Nếu chưa có hình được duyệt, tiếp tục kiểm UX bằng tài nguyên hiện có; ghi trạng thái mỹ thuật chưa duyệt trong báo cáo kỹ thuật, không ghi trên giao diện người chơi.

## 2. Các contract bắt buộc giữ

| Hệ thống | Contract |
|---|---|
| Gameplay | Không đổi luật, seed/RNG, mode, wave, timer, scoring, combo, điều kiện thắng/thua và mở độ khó |
| Thưởng ghép | 2 Xu cho một cặp Memory/Link hoặc một bộ ba Triple theo luật hiện hành |
| Rương | Mỗi trò × cụm 10 màn có bốn rương: Mầm Non/Dễ, Lá Bạc/Trung bình, Hoa Vàng/Khó, Ánh Sao/Siêu khó |
| EXP | Thắng lần đầu đúng màn/độ khó nhận 10; 100 cho đúng rương; replay không cấp lại; tiến độ kiếm trước được giữ |
| Thứ tự mở | C → B → A → S, không nhầm đã đủ tiến trình với đã được phép mở |
| Phần thưởng rương | 30/60/100/160 Xu và 1/2/3/4 Gợi ý tương ứng |
| Mảnh tranh | Hoàn thành cả bốn độ khó của một màn nhận một mảnh; đủ 10 nhận tranh và 300 Xu một lần |
| Lưu thưởng | Grant thuộc transaction/receipt hiện có, không thuộc hoạt ảnh, toast, điều hướng hoặc popup |
| Tương thích | Giữ key/formatVersion/session/API/effect ID/catalog ID hiện hành và dữ liệu đã kiếm được |

Ngoại lệ dữ liệu duy nhất có thể cần là mở rộng **tương thích** `settings.tutorialProgress` để phân biệt đã bỏ qua với đã hoàn thành. Không thay schema gameplay hoặc tạo localStorage song song. Gate R0 phải chốt dạng mở rộng cụ thể, ưu tiên thêm trường tùy chọn trong boundary hiện có; normalize phải giữ flags cũ. Không tăng version theo cách khiến người cũ mất toàn bộ trạng thái đã học.

## 3. Bằng chứng và thiếu sót hiện tại

Đã kiểm trực tiếp bằng trình duyệt tại `http://localhost:4173/`: Link → Cài đặt → Hướng dẫn → Tập luyện. Chưa chạy lại toàn bộ ma trận Memory/Triple trong lượt lập kế hoạch này.

| Mã | Phát hiện | Bằng chứng và cách hiểu | Tiêu chí đóng |
|---|---|---|---|
| T01 | Hai bước đầu Link thiếu bàn tay | `linkPractice().view().targets` rỗng ở bước thẳng/rẽ; đã xác minh UI | Có một bàn tay chỉ đúng thao tác kế tiếp ở từng bước có hướng dẫn |
| T02 | Chưa tự mở bài nhập môn lần đầu | Call site `openPractice` hiện qua nút trong modal help; không có điều phối first-play | Hồ sơ mới đi qua luồng nhập môn bằng đường Chơi thật của cả ba trò |
| T03 | Sau nối đúng chỉ còn đường xanh | Adapter xóa hình, giữ path và chờ Tiếp tục; đã tái hiện; không phải lỗi tải ảnh | Phản hồi đúng có ngữ cảnh và chuyển bước rõ ràng, không có bàn trống khó hiểu |
| T04 | Thiếu minh họa nối sai | Bước bị chặn hiện phản hồi chữ; renderer chỉ có đường hợp lệ màu xanh | Có đoạn thử nối tới vật cản, nhấn vật cản, giải thích và cho thử lại |
| T05 | Hướng dẫn mới có test logic/geometry, thiếu tiêu chí thị giác theo bước | `runtime/tutorial.spec.cjs` kiểm lời phản hồi và hoàn thành; không xác nhận bàn tay từng bước/đường thử bị chặn | Test hành động, geometry và bằng chứng nhìn thấy cho từng bước |
| W01 | Summary gộp kết quả với meta progression | `js/ui.js` tạo `.mastery-win-reward`; `modal.js` gắn guide EXP vào summary | Không còn EXP/rương/mảnh hoặc guide EXP trong summary ở mọi nhánh |
| W02 | EXP thiếu ý nghĩa trực tiếp | Đây là tiến trình rương theo độ khó, không phải cấp nhân vật | Tiến trình chính là số màn đúng độ khó; giải thích ngắn tại Kho báu |
| C01 | Tranh chưa chốt, catalog hiện có ba tranh lặp | `masteryCollection.js` chọn theo block và game offset | Giao diện thay hình được, không hứa mỗi cụm có tranh mới; giữ quyền sở hữu |
| L01 | Một số câu chữ thiên về vận hành và nhãn ảnh thô | Bài học hiện “Đang lưu bài đã học…”; nhãn ảnh có `acai_berry` | Rà câu chữ theo ngữ cảnh, có tên thân thiện cho nhãn truy cập |

Không kết luận mọi comment/log kỹ thuật là lỗi sản phẩm. Chỉ sửa nội dung đi tới người chơi; lỗi tải/lưu/thiếu Xu vẫn phải được giải thích khi cần để quyết định thao tác.

## 4. Đặc tả nhập môn và bài tập

### 4.1. Đường vào và vòng đời

- Khi người chơi bấm Chơi lần đầu của một trò và chưa có bằng chứng đã chơi/học/bỏ qua, mở nhập môn trước khi khởi tạo ván thật. Giữ đúng ý định mở màn/mode của người dùng.
- Hồ sơ đã có tiến trình chơi nhưng thiếu cờ tutorial do nâng cấp: không ép học lại; vẫn xem lại được trong Cài đặt.
- Kiểm tra dữ liệu hoạt động thực của từng trò; không dùng số Xu hoặc việc đã mở Home làm bằng chứng đã chơi.
- Chặn thao tác Chơi lặp bằng owner/launch intent hiện hữu; chỉ một bài và một lần khởi tạo ván. Không dùng cờ global rời rạc để mở lại callback đã cũ.
- Hoàn thành bài: hiện “Bạn đã sẵn sàng!” và “Bắt đầu chơi”; không tự nhảy vào ván khi người chơi còn đọc.
- “Bỏ qua” ở luồng tự động: ghi nhận đã bỏ qua riêng, bắt đầu đúng ván đã chọn một lần. Ở luồng xem lại: chỉ đóng bài, không khởi tạo ván mới.
- Đóng bằng X/back/Escape trước khi xác nhận chơi: trở về nơi đã mở bài, hủy pending launch. Không tự bắt đầu sau một lần lưu chậm.
- Tách trạng thái chưa xem/đã bỏ qua/đã hoàn thành. Bỏ qua không được đánh dấu hoàn thành. Xác nhận hoàn thành bằng mục tiêu thật, không bằng timeout.
- Đổi trò/hồ sơ, owner mất hiệu lực hoặc đóng bài trong lúc lưu phải hủy continuation. Không mở lại bài, modal hoặc round cũ.
- Khi ứng dụng bị ẩn: dừng trình bày và bỏ nhận input. Trở lại khôi phục đúng bước, không tự tiến bước.
- Lỗi lưu tùy chọn học tập không được khóa người chơi trong bài; vẫn có thể chơi hoặc thoát. Không báo đã lưu bền vững khi commit thất bại; giới hạn việc nhắc lại trong phiên bằng state có owner rõ.

### 4.2. Bàn tay, bố cục và tương tác

- Một bàn tay SVG duy nhất, không emoji/font icon. Chỉ ô tiếp theo; chọn xong ô đầu thì chuyển sang ô thứ hai, không đặt hai tay cùng lúc.
- Hiển thị đủ ngay từ bước đầu, không đợi sai hoặc tìm trong Cài đặt mới xuất hiện. Bước tự giải không chỉ sẵn đáp án.
- Neo vào DOM thật của ô; cập nhật sau layout/resize/orientation/scroll. Không hardcode tọa độ viewport; không ghi đè transform đang căn thẻ/lớp.
- Có thể nhấn 1–2 nhịp rồi đứng yên; không cần vòng animation vô hạn. Reduced-motion dùng hình tĩnh và outline rõ.
- Dẫn mắt bằng độ tương phản/outline; chữ và hình vẫn đọc được. Không dùng màu làm dấu hiệu duy nhất.
- Dọn khoảng trống: vùng bài vừa nội dung và viewport, CTA tới được ở màn ngang/hẹp; không kéo giãn modal chỉ vì có hàng rỗng trong ma trận luật.
- Chọn sai ô được hướng dẫn lại nhẹ nhàng. Không khóa toàn popup hoặc làm nút Thoát/Bỏ qua mất tác dụng.
- Thứ tự focus ổn định khi redraw; ưu tiên ô kế tiếp hoặc CTA. Không để focus rơi về body sau mỗi bước.

### 4.3. Nội dung theo trò

| Trò | Các mục tiêu theo thứ tự | Bằng chứng cần có |
|---|---|---|
| Memory | Lật ô đầu → xem ô khác không khớp → ghi nhớ/úp → ghép đúng → tự giải | Bàn tay đúng ô; mặt hình và việc úp rõ; cặp sai không bị mất trước khi hiểu; hoàn thành đúng luật |
| Link | Nối thẳng → nối qua góc → thể hiện giới hạn tối đa hai lần rẽ → thử cặp bị chặn → dọn cặp cản → nối lại → tự giải | Đường đúng nối đúng tâm; điểm bị chặn thấy được; không xóa cặp sai; bàn tay chuyển theo lựa chọn |
| Triple | Chọn ô đang mở → gom ba → thấy ô dưới được mở → giữ chỗ trong khay → tự giải | Ô che không bấm được; bay/khay gọn; slot count theo capacity model thật, không hardcode bảy slot trong trình bày |

Không ép tiêu công cụ trong bài. Công cụ được giới thiệu khi mở bảng công cụ lần đầu: tác dụng, số lượt đang có và điều kiện dùng. Tôn trọng pause/resume hiện hữu khi mở hướng dẫn từ ván đang chơi.

### 4.4. Phản hồi nối đúng/sai của Link

- Dùng pathfinder thật cho kết luận hợp lệ. Đường minh họa sai chỉ mô tả nỗ lực bị chặn trong bàn mẫu, không trả về như đường hợp lệ, không xuyên hình để tới đích.
- Hợp lệ: giữ ngữ cảnh cặp hình ở pha impact ngắn, hiện đường đúng; sau resolve chuyển sang trạng thái bài học đã xong hoặc bước kế. Nếu chờ Tiếp tục, phải có lời xác nhận/ảnh ngữ cảnh gọn, không chỉ một vạch trên bàn rỗng.
- Bị chặn: giữ hai hình; vẽ đoạn thử tới điểm chặn và nhấn vật cản; thêm ký hiệu chặn cùng chữ. Người dùng xác nhận/tiếp tục hoặc thao tác mở đường rồi mới chuyển mục tiêu, không đổi bước quá nhanh khiến không kịp hiểu.
- Chọn hai hình khác nhau: phản hồi khác với đường bị chặn. Bấm lại ô đang chọn: bỏ chọn theo luật. Đường cũ không được tồn tại sai sang bước mới.
- Timeline đề xuất: phản hồi nhấn 80–140ms; impact đúng/sai 200–350ms; resolve 150–250ms. Đây là token thiết kế cần đo và kiểm ảnh, không phải delay khóa input của gameplay thật.

## 5. Câu chữ toàn ứng dụng

Lập inventory theo màn/entry point và owner, không chỉ tìm một danh sách từ cấm. Bao gồm Home, hai ngữ cảnh năm tab, Cài đặt, help, ba gameplay/HUD/menu, công cụ, popup/toast/tooltip, lỗi/rỗng/loading, rương/collection và nhãn truy cập ảnh/nút.

| Cách viết | Hướng thay |
|---|---|
| Tên file/ID như `acai_berry` | Tên hình thân thiện; nếu không có tên dịch đáng tin thì nhãn trung tính có ý nghĩa như “Hình quả màu tím”, không đưa key kỹ thuật |
| “Đang lưu bài đã học…” ở điểm kết thúc | “Bạn đã sẵn sàng!”; chỉ giải thích lỗi lưu khi người chơi cần hành động |
| Ghi chú dài về cách ly dữ liệu bài tập | Khi cần: “Bạn có thể thử tự do, không tốn vật phẩm.” |
| “Trừ từ kho của trò đó” | Mô tả rõ số lượt dùng và tác dụng của công cụ, ngắn gọn theo ngữ cảnh |
| EXP/số chuyển `0 → 10/100` trong summary | Loại khỏi summary; số màn hoàn thành xuất hiện tại Kho báu |
| Nhãn hành động “Menu” ở kết quả | “Bản đồ” nếu thực sự trở về bản đồ; không đổi route chỉ để khớp chữ |

- Không có “nội bộ”, “mô phỏng”, “placeholder”, “debug”, “API/SDK”, “bản thử nghiệm” hoặc hướng dẫn phát triển trong UI/ảnh bàn giao người chơi.
- Giữ log/comment/diagnostics cần thiết trong code và báo cáo kỹ thuật; không xóa logic hoặc công cụ chỉ vì trùng từ tìm kiếm.
- Không bịa khả năng chưa có, ví dụ tranh mới vô hạn, mở rương bất kỳ thứ tự, mảnh rơi ngẫu nhiên hoặc thưởng replay.
- Mọi thay đổi câu chữ có contract test phải cập nhật expectation đúng câu mới, giữ nguyên kiểm hành vi và nhánh lỗi.

## 6. Popup thắng và hành trình sau thắng

### 6.1. Thành phần popup

Giữ sao, “Hoàn thành Màn N!”, Xu nhận, Điểm, thời gian với nhãn đúng ý nghĩa hiện có và hai CTA Bản đồ/Chơi tiếp. Gate R0 xác minh thời gian đang là còn lại hay đã chơi; đổi nhãn cho đúng dữ liệu, không đổi công thức.

Loại toàn bộ EXP, thanh rương, trạng thái rương, nút Xem kho báu và mảnh tranh khỏi popup kết quả. Không dời chúng sang một popup tự bật ngay sau mỗi lần thắng. Rà cả `modal.js` để gỡ hoặc chuyển guide EXP khỏi hook summary, không để anchor mất nhưng callback còn chạy.

### 6.2. Điều hướng và thông báo

- Bản đồ: về map đúng trò/chặng, cập nhật thẻ tiến trình từ dữ liệu đã commit; có thể chuyển số tiến trình một lần, không phát thưởng lại.
- Chơi tiếp: vào đúng màn/preview theo contract hiện hữu ngay khi người dùng yêu cầu; không ép quay map hoặc chờ animation thưởng phụ.
- Rương sẵn sàng: indicator tĩnh ở điểm vào Kho báu/bản đồ; khi trở về map làm nổi một lần. Không chen modal cưỡng bức hoặc chặn input ván kế.
- Mảnh mới: badge ở Bộ sưu tập; khi mở đúng bộ, trình bày mảnh mới nếu có bằng chứng nhận mới phù hợp. Nếu không phân biệt được mới/cũ bền vững thì hiện trạng thái hiện tại, không tự thêm ledger thưởng để chạy animation.
- Không mất thưởng nếu bỏ qua mọi animation, đóng/reload hoặc chơi tiếp liên tục.

## 7. Bản đồ và Kho báu

### 7.1. Điểm vào ổn định

Thêm một thẻ tiến trình gọn trong vùng bản đồ dưới tiêu đề, không đè các nút mode, level hoặc dock/quảng cáo. Ở landscape thu gọn thành control vẫn đọc được và mở Kho báu. Không thêm tab thứ sáu.

Ví dụ với dữ liệu thật:

> Rương Mầm Non · 3/10 màn Dễ
>
> Thưởng: 30 Xu · 1 Gợi ý
>
> Xem kho báu

- Thẻ thể hiện đúng cụm 10 màn; luôn có nhãn “Màn 1–10” hoặc phạm vi đang xem. Không dùng rương của cụm cuộn khác mà không đổi nhãn.
- Chọn cụm mặc định theo tiến trình hiện hành; marker rương trên map mở đúng cụm đã bấm. Cuộn/chuyển chương không phát sinh ghi save.
- EXP vẫn tồn tại nội bộ: 30/100 tương đương 3/10 màn thắng lần đầu đúng độ khó; không làm tròn/đếm số trận thắng hoặc cộng replay.
- Rương đang chờ phải thể hiện cả tiến trình đã kiếm và điều kiện mở trước, không kéo thanh về 0.

### 7.2. Trang chi tiết Kho báu

- Một vùng xem bốn rương cùng tên/độ khó/trạng thái; chi tiết rương đang chọn có hero, tiến trình, thưởng và một CTA chính.
- Ưu tiên `Đã hoàn thành 3/10 màn Dễ`. EXP chỉ ở thông tin phụ ngắn nếu cần; không lặp hai thanh cùng một dữ liệu.
- Bốn trạng thái: Đang tích lũy / Có thể mở / Đã đủ nhưng chờ rương trước / Đã nhận. Phân biệt bằng hình, nhãn và khả năng thao tác, không chỉ màu.
- Tên sản phẩm giữ Mầm Non, Lá Bạc, Hoa Vàng, Ánh Sao; C/B/A/S là ID nội bộ, không thay tên đọc cho người chơi.
- Xem trước phần thưởng trước khi mở. Mở rương chỉ sau transaction thành công; lỗi giữ đúng tiến trình và có Thử lại.
- Đã nhận thì hiện hình mở và nhãn rõ; mở lại trang không phát animation nhận thưởng như mới và không grant lại.
- CTA Chơi tiếp dẫn tới màn/độ khó hợp lệ còn thiếu trong cụm đang chọn, qua preview hiện hữu. Không tự vượt khóa độ khó.
- Nội dung quá dài có cuộn trong vùng thiết kế; footer/close/focus tới được trên 320px và màn ngang.

## 8. Mảnh tranh và bộ sưu tập

- Một bộ có tên tranh, phạm vi màn, preview 10 mảnh, số đã kiếm, cách lấy mảnh còn thiếu và thưởng hoàn thành. Không biến tranh thành vật phẩm rơi từ rương vì luật hiện tại không như vậy.
- Chọn mảnh thiếu xem màn liên quan và những độ khó còn thiếu; hành động Chơi dẫn tới lựa chọn hợp lệ, không tự mở khóa.
- Khi vừa nhận một mảnh và mở bộ: nhấn vị trí đó bằng animation hữu hạn nếu có dữ liệu xác định mới; còn lại là trạng thái tĩnh đúng dữ liệu.
- Đủ 10: hiện tranh hoàn chỉnh, “Hoàn thiện bộ tranh”, phần thưởng 300 Xu và CTA Nhận thưởng khi còn eligible. Nếu đã nhận, chỉ hiện trạng thái Đã nhận và Xem tranh.
- Trang xem lớn có tải/lỗi/Thử lại/đóng. Không giải mã lại ảnh không cần thiết hoặc giữ ảnh detach sau khi owner hủy.
- Có thể trình bày khoản 300 Xu trong khoảnh khắc hoàn thành; không thêm một “rương đặc biệt” có lần nhận riêng.
- Tranh là nội dung thay được: metadata tên/asset/alt/crop có owner rõ, giữ ID và earned/claimed hiện hữu. Không tự shuffle mapping khiến tranh đã mở đổi ngẫu nhiên giữa reload.
- Tranh mới cần được duyệt bằng bản xem trước cả hình đầy đủ và layout 10 mảnh trên mobile. Nếu chưa được duyệt, ghi giới hạn trong hồ sơ, không ghi “thử nghiệm” trên sản phẩm và không coi mỹ thuật mới đã đạt.

## 9. Kiến trúc, lifecycle và ngân sách

| Owner hiện có | Phạm vi dự kiến; agent xác minh lại trước sửa |
|---|---|
| `js/tutorial/practice.js`, `practiceAdapters.js`, `tutorialModel.js`, `tutorialProgress.js` | Step state, targets/pointer, input/feedback, flags và persistence riêng của bài |
| `js/tutorial/contextGuide.js`, `js/modal.js` | Gợi ý tại DOM thật, đóng/mở, focus; loại guide EXP khỏi summary |
| Game launch/navigation adapters và settings | Một entry nhập môn trước ván mới, replay từ help, hủy pending launch; tránh sửa rải rác ba controller |
| `js/ui.js`, styles summary/modal | Kết quả gọn, giữ số liệu và hai CTA; không động transaction cấp thưởng |
| `js/adventureMap.js`, `adventureMapLayout.js`, styles map | Điểm vào tiến trình/đúng block, responsive; không đụng animation ghép/dồn hoặc scenery nền |
| `js/progression/treasureProjection.js`, `treasureView.js`, `treasureModal.js` | Projection đọc dữ liệu thật, bốn trạng thái/CTA và presentation mở rương |
| `js/progression/masteryCollection.js`, styles collection | Mảnh/album/xem ảnh và đường tới màn còn thiếu |
| Catalog copy/theme/ARIA và owner từng màn | Câu chữ; không sửa generated output trực tiếp |

Quy tắc triển khai:

- So sánh ít nhất hai phương án cho entry tutorial và progress surface trước khi sửa. R0 ghi lựa chọn, failure mode và ranh giới file; không tạo framework tutorial/reward mới khi owner hiện có đủ dùng.
- Một owner cho một bài/overlay; tối đa một bàn tay và một lời dẫn. Mỗi bước có state thật về mục tiêu/chọn/feedback/đợi xác nhận/hoàn thành, không thêm nhiều boolean rời rạc.
- Tái dùng luật chọn/ghép/pathfinder/reducer; không viết luật dễ hơn để demo luôn thành công.
- Mục tiêu ban đầu: tối đa 12 node phụ cho pointer/spotlight/callout trên bài, tối đa một frame JS đang chờ để cập nhật vị trí. Đây là giới hạn thiết kế cần xác nhận, không phải phép đo đã có.
- Không thêm JS loop theo frame cho bàn tay. Ưu tiên transform/opacity trên lớp nhỏ; giữ điểm neo và layout trên lớp ngoài. Timer/animation hữu hạn phải do scope sở hữu và hủy được.
- Promise hoàn thành/lưu/tải có success/failure/cancel/stale guard. Animation kết thúc không có quyền cấp thưởng hay thay round mới.
- Responsive, focus, safe-area và reduced-motion là acceptance, không phải tinh chỉnh tùy chọn.
- 60FPS trên mobile là mục tiêu cần đo trên máy thật; rAF desktop 144Hz hoặc file ảnh nén nhỏ không chứng minh đạt.

## 10. Các gate triển khai và đầu ra

Mọi gate ban đầu là **chưa thực hiện**. Agent được giao triển khai toàn kế hoạch phải làm liên tục R0–R8, chỉ dừng với blocker thật theo AGENTS.md; không kết thúc sau một checkpoint.

| Gate | Công việc | Điều kiện đạt |
|---|---|---|
| R0 — Baseline và ownership | Đọc code/flags/save/test, tái hiện T01–T05/W01–W02/C01/L01; thống nhất entry, flags và ranh giới với công việc đồng thời; ghi bảng nguồn câu chữ | Có baseline thật, sơ đồ luồng, cách giữ luật/dữ liệu, danh sách file và phương án chọn/loại; chưa đổi gameplay |
| R1 — Bài học đúng và rõ | Sửa targets, một pointer, feedback, đường bị chặn, chuyển bước, bố cục/focus của ba bài | Đi hết từng bước qua UI; có kiểm pointer/đường/cặp và không có bàn trống gây hiểu nhầm; bàn tập không đổi ví/kho/session/record |
| R2 — First-play và replay | Entry tự động, Bỏ qua/Bắt đầu chơi/đóng, đọc dữ liệu cũ, flags tương thích, xử lý save failure và owner stale | Hồ sơ mới của mỗi trò tự hướng dẫn đúng một luồng; skip không completed; người cũ không bị reset; ván launch đúng một lần; đang chơi mở help quay về đúng ván |
| R3 — Ngôn ngữ sản phẩm | Rà các màn theo inventory, cả ARIA, loading/lỗi/rỗng; bổ sung kiểm copy theo ngữ cảnh | Không còn nội dung phát triển trên UI; câu chữ đúng khả năng/luật; thông báo lỗi hữu ích, không che lỗi bằng catch rỗng |
| R4 — Summary gọn | Loại EXP/rương/mảnh và guide anchor, giữ reward commit cùng route/metrics hiện hữu | Thắng cả ba trò/two skins không có phần phụ bị loại; replay/Chơi tiếp/Bản đồ đúng; nhận Xu/score/stars không đổi |
| R5 — Kho báu chuyên nghiệp | Thẻ map, đúng block, overview bốn rương, số màn, điều kiện/thưởng/CTA và các trạng thái | Tìm được Kho báu từ map; đủ/chờ/claimed không nhầm; C→B→A→S, đồng bộ sau reload và chuyển hồ sơ; không nhận lặp |
| R6 — Bộ sưu tập rõ giá trị | Preview/10 mảnh, cách kiếm mảnh thiếu, nhận300Xu và xem tranh; hợp đồng thay hình | 0/1/9/10 mảnh đúng, bộ hoàn thành/xem lại/claimed rõ; art chưa duyệt được ghi đúng giới hạn; không thêm thưởng hoặc đổi sở hữu |
| R7 — Kiểm tích hợp/lifecycle/hiệu suất | Ma trận bên dưới, check/build, lỗi lưu/tải, skip/close/restart/account switch trong animation; rà diff | Bằng chứng đủ cho từng tiêu chí, không leak/race hoặc regression phạm vi liên quan; báo đúng pass/fail/giới hạn |
| R8 — Review và bàn giao | Một bước review sau implementation, đối chiếu acceptance và chạy lại kiểm trọng yếu | Không còn lỗi nghiêm trọng trong phạm vi; báo rõ số đo, gate thiếu bằng chứng và mỹ thuật chưa duyệt; không APK/deploy/push |

R8 không tự tạo quyền spawn reviewer hoặc gửi tin sang thread khác. Chỉ ủy quyền khi người dùng cho phép. Nếu chưa có reviewer độc lập, thực hiện lượt tự review riêng, ghi đúng là tự review và không nhận là đã được review độc lập.

## 11. Ma trận kiểm thử và bằng chứng

### 11.1. Hành vi và dữ liệu

- Ba trò × hai skin: tự mở nhập môn từ nút Chơi thật, đi hết bài, bỏ qua, đóng, xem lại trong Cài đặt và khi đang chơi.
- Lần đầu/đã bỏ qua/đã hoàn thành/người chơi cũ thiếu flags; reload; đổi hồ sơ trong load/save; cờ hỏng/thiếu/field lạ; save reject và kết quả lưu tới muộn.
- Unit/contract: mục tiêu từng bước, target thay sau lựa chọn đầu, sai hình khác sai đường, số góc rẽ đúng luật, blocker không bị xóa, Triple khay capacity model, completion chỉ bởi hành động đúng.
- Rương ở0/10,3/10,9/10,10/10; đủ nhưng chờ rương trước; đã nhận; cả bốn đã nhận; đúng block/game/mode.
- Mảnh0/1/9/10; nhận300Xu; đã nhận; xem tranh/lỗi tải/Thử lại. Kiểm ledger giữ một lần qua close/reload/retry/đổi owner.
- Summary thắng tự nhiên ba trò có ít nhất một lượt/mỗi skin, replay không cộng lại EXP/mảnh. Fixture chỉ dùng chuẩn bị mốc lớn, không thay toàn bộ bằng lời gọi hàm hoàn thành/grant.

### 11.2. Thị giác và tương tác

- 320×568,412×915,844×390,1024×900; hai skin; normal/reduced motion. DPR2/3 kiểm những chỗ dùng bitmap/pointer/preview cần sắc nét.
- Chụp từng bước quan trọng của ba bài, không chỉ bước mở đầu. Kiểm pointer thấy được và đúng vị trí, không chỉ count SVG tồn tại.
- Đường sai và điểm chặn nhìn thấy; frame sau thành công không trống gây nhầm; thao tác sai không làm bước tự nhảy qua khi chưa hiểu.
- Tất cả control chạm được, CTA cuối tới được, chữ không cắt; không che banner thật hoặc nhãn bắt buộc. Focus/keyboard/back/Escape theo contract.
- Đổi skin khi đang có bài/callout không đổi state hoặc nhân node; đổi hướng màn không làm lệch pointer/path hoặc mất ý định mở ván.

### 11.3. Lifecycle và hiệu suất

- Tối thiểu50chu kỳ mở/đóng bài/chuyển tab hoặc trò; restart/chuyển owner giữa animation, load và save. So node/listener/timeout/RAF/observer về baseline tương ứng; không tăng tuyến tính.
- Đo cùng build/profile bật/tắt presentation mới: mở bài, chọn ô nhanh, chuyển bước, cuộn map, mở rương và xem tranh. Ghi frame time p50/p95/p99, long task và heap sau warmup; không quy toàn bộ thay đổi của checkout chung cho task này.
- Ngân sách dự kiến: không thêm long task >50ms do code mới; không layout/read-write theo frame; cập nhật pointer đồng bộ tối đa một frame đang chờ. Ngưỡng cụ thể và baseline chốt ở R0, không nới khi fail để báo xanh.
- Chạy static/logic checks mục tiêu, các suite tutorial/reward/summary/map/collection/lifecycle liên quan, `npm run check`, `npm run build` ở gate cuối. Không chạy suite không liên quan để tạo số lượng pass.
- Nếu check chung fail do thay đổi của agent khác, ghi owner/lỗi và ranh giới đúng; không revert, sửa test hộ hoặc báo full check pass từ một lần cũ. Sửa và chạy lại mọi lỗi thuộc phạm vi.

### 11.4. Hồ sơ duy nhất và Definition of Done

- Ghi một phần R0–R8 mới trong `docs/design/advanced-ui/IMPLEMENTATION.md`; dùng chung hồ sơ thay vì tạo báo cáo cho từng lỗi nhỏ. Giữ lịch sử G0–G10 và không coi pass cũ thay pass mới.
- Gắn từng gate với source revision/working-tree identity, command/result, đường ảnh/JSON và giới hạn. Lưu asset mỹ thuật chưa duyệt ở vùng review, không nhét file nguồn tạm vào bundle.
- Toàn bộ gate triển khai đều có bằng chứng; runtime/compatibility đạt và các giới hạn máy thật/mỹ thuật được ghi đúng. Chỉ việc lập tài liệu này không hoàn thành bất kỳ gate nào.
- Không có log debug/asset rác/code chết/ngoài phạm vi; API/save/catalog/economy giữ contract hoặc có mở rộng tutorial đã mô tả và kiểm.
- Nếu mỹ thuật tranh chưa được chủ dự án duyệt, có thể bàn giao UX chạy đúng với tài nguyên hiện có nhưng phải ghi **mỹ thuật tranh chưa chốt**; không báo nội dung tranh đã hoàn tất hoặc dùng đó làm lý do dừng các phần runtime độc lập.

## 12. Nguồn tham khảo và giới hạn

- Royal Match: [các bộ thẻ](https://dreamgames.helpshift.com/hc/en/3-royal-match/faq/334-what-are-sets-and-when-do-i-get-a-new-set/), [hoàn thành bộ sưu tập](https://dreamgames.helpshift.com/hc/en/3-royal-match/faq/333-what-happens-when-i-complete-a-collection/).
- Fishdom: [Collections](https://playrix.helpshift.com/hc/en/4-fishdom/faq/15534-collections-1757594621/).
- Học nguyên tắc mục tiêu/phần thưởng rõ theo bộ; các tài liệu này không chứng minh bố cục popup hay timeline cụ thể. Không sao chép gacha, mùa, trao đổi thẻ hoặc kinh tế của game khác vào dự án.
- Thiết kế thẻ tiến trình map, summary gọn và nhập môn ở trên là đề xuất cho dự án dựa trên phản hồi trực tiếp của chủ dự án, không phải tuyên bố đã quan sát chúng trong game tham khảo.

## 13. Bổ sung mỹ thuật bộ sưu tập — thực hiện sau

Chủ dự án chọn thử catalog10tranh dùng chung cho ba trò, hướng phong cảnh lãng mạn và nhân vật nữ trưởng thành. Sau lần tạm dừng, đã cho phép bổ sung đúng3ảnh nhân vật nữ châu Á18tuổi để danh sách đủ10ảnh tính cùng3legacy+4ảnh mới trước đó. Tài nguyên dùng thử gồm3legacy+7mới; chưa tích hợp runtime hoặc thay3tranh legacy. Bổ sung dùng thử và rủi ro đổi mảng modulo tại [COLLECTION_ART_ADDENDUM.md](docs/design/collection-art/COLLECTION_ART_ADDENDUM.md). Không tự tạo ngoài số lượng đã giao, không coi mỹ thuật đã duyệt cuối, không mở một kế hoạch runtime song song hoặc chặn R0–R8 độc lập.
