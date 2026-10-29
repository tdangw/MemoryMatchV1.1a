# Quy tắc & Cấu hình — Memory Match

> Cân bằng vật phẩm24/10/2026: chỉ vật phẩm tiêu hao giảm10%, làm tròn đến Xu nguyên; công thức và bảng giá chung tại `js/shopCatalog.js` và mục cân bằng mới nhất trong `CONTEXT.md`. Vật phẩm tăng giờ tối thiểu30s; Xem trước/Gợi ý và thưởng cộng giờ trực tiếp giữ thời lượng. Ngoại hình/hiệu ứng/chủ đề/mở rộng khay giữ giá.

> Cập nhật 24/10/2026: Dễ / Trung bình / Khó / Siêu khó cấp lần lượt **75 / 110 / 150 / 220 giây cho mỗi đợt thẻ**. Thời gian dư được giữ sang đợt tiếp theo; không cộng thêm thời gian theo level ở bốn độ khó này. Thử thách dùng mốc của độ khó nhỏ nhất chứa đủ số thẻ; Vô tận giữ nguyên. Phiên đang lưu giữ thời gian đã cấp/còn lại và dùng mốc mới từ đợt kế tiếp. Quyết định này thay các mốc thời gian cũ bên dưới; nguồn hiện hành là `js/progression/waveTiming.js`.

Tài liệu này là nguồn theo dõi luật chơi, cân bằng và cấu hình sản phẩm hiện hành của **Memory Match**. Ranh giới module và hợp đồng kỹ thuật nằm trong `ARCHITECTURE.md`; trạng thái ngắn gọn của toàn dự án nằm trong `CONTEXT.md`.

---

## 1. Mục tiêu và luật chơi cốt lõi

- Mỗi hình xuất hiện đúng hai lần trên bàn.
- Người chơi lật tối đa hai thẻ để tìm hai hình giống nhau.
- Ghép đúng giữ hai thẻ ở trạng thái đã ghép và tăng số cặp hoàn thành.
- Ghép sai trả hai thẻ về trạng thái úp, tăng số lần sai và đặt combo về 0.
- Chạm lại chính thẻ đang chọn sẽ bỏ chọn thẻ đó; thao tác này không làm mất combo.
- Khi một cặp sai đang hiện, chạm thẻ mới sẽ đóng ngay cặp sai trước đó để giữ nhịp chơi.
- Hoàn thành toàn bộ cặp trước khi hết giờ để qua màn. Vô tận không có giới hạn thời gian và đồng hồ đếm xuôi.
- Khi xem trước, dùng Gợi ý hoặc đang chạy hoạt ảnh cần bảo toàn trạng thái thẻ, bàn tạm khóa tương tác.

## 2. Chế độ và kích thước bàn

### Chế độ cố định

| Chế độ | Số thẻ | Số cặp | Cột desktop | Cột mobile | Thời gian gốc | Thưởng Xu cuối màn |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Dễ | 12 | 6 | 4 | 4 | 75 giây/đợt | Công thức chung bên dưới |
| Trung bình | 24 | 12 | 6 | 4 | 110 giây/đợt | Công thức chung bên dưới |
| Khó | 36 | 18 | 6 | 6 | 150 giây/đợt | Công thức chung bên dưới |
| Siêu khó | 60 | 30 | 6 | 6 | 220 giây/đợt | Công thức chung bên dưới |
| Vô tận | 60 | 30 | 6 | 6 | Không giới hạn | Công thức chung khi hoàn thành màn |
| Thử thách | Theo level | Theo level | Theo level | Theo level | Theo kích thước bàn | Công thức chung bên dưới |

Với Dễ, Trung bình, Khó và Siêu khó, mỗi đợt thẻ nhận thời gian cố định theo bảng; không tăng thêm theo level.

### Bàn Thử thách

| Level | Số thẻ | Số cặp | Cột desktop | Cột mobile |
| --- | ---: | ---: | ---: | ---: |
| 1–2 | 12 | 6 | 4 | 4 |
| 3–4 | 16 | 8 | 4 | 4 |
| 5–6 | 20 | 10 | 4 | 4 |
| 7–8 | 24 | 12 | 4 | 4 |
| 9–10 | 30 | 15 | 6 | 6 |
| 11–12 | 36 | 18 | 6 | 6 |
| 13–14 | 42 | 21 | 6 | 6 |
| 15–16 | 48 | 24 | 6 | 6 |
| 17–18 | 54 | 27 | 6 | 6 |
| Từ 19 | 60 | 30 | 6 | 6 |

Thử thách cấp75/110/150/220giây mỗi đợt cho bàn tối đa12/24/36/60thẻ; giữ thời gian dư sang đợt sau.

Giữ mỗi kích thước 2 level để làm quen vị trí: 4×3 → 4×4 → 4×5 → 4×6 → 6×5 → 6×6 → 6×7 → 6×8 → 6×9 → 6×10 (cột × hàng). Từ level 19 giữ tối đa 30 cặp. Cột desktop/mobile giống nhau trong Thử thách để việc resize/fullscreen không đổi vị trí ghi nhớ. Các chế độ cố định giữ cấu hình cũ. Luật thời gian, combo và thưởng giữ nguyên; cần đánh giá thời gian hoàn thành, tỷ lệ thua và lượng hỗ trợ ở nhịp mới trước khi chốt cân bằng phát hành.

### Toàn màn hình và tập trung

- Nút góc phải hàng tên game bật/tắt toàn màn hình theo thao tác người chơi, giữ qua level; không tự bật khi tải game.
- Khi không hỗ trợ hoặc yêu cầu bị từ chối, dùng chế độ tập trung: ẩn Moves, Miss, Điểm và thanh sao phụ; giữ đồng hồ, cặp, combo và công cụ. Nhấn lại nút hoặc Escape để thoát chế độ tập trung.
- Fullscreen bao gồm cả trang để popup/công cụ vẫn hiển thị. Dùng lại bộ tính bố cục game shell, không tạo lại bàn khi chuyển trạng thái; nút và sự kiện được dọn khi rời shell.
- Lưới 6×10 ưu tiên màn hình dọc. Màn ngang thấp vẫn vừa khung nhưng thẻ nhỏ; không tự đổi số hàng/cột giữa ván để bảo toàn vị trí ghi nhớ.
- Phiên lưu giữ seed, vị trí/trạng thái thẻ, quà Lucky và chính sách thưởng của đợt qua pairSnapshot. Tiếp tục khôi phục bàn cũ, không sinh lại Lucky hoặc thay chính sách giữa đợt; bàn mới mới dùng cấu hình hiện hành.

## 3. Bắt đầu màn và bố cục thích ứng

- Mỗi màn chọn ngẫu nhiên số hình cần thiết từ chủ đề đang trang bị, nhân đôi từng hình rồi xáo danh sách.
- Tất cả thẻ được mở xem trước trước khi bắt đầu tính giờ:
  - Chế độ thường và Thử thách: 5 giây.
  - Vô tận: 8 giây.
- Bàn tự tính kích thước thẻ theo chiều rộng và chiều cao khả dụng:
  - Điểm chuyển mobile: 600 px.
  - Kích thước thẻ tối thiểu: 36 px.
  - Kích thước thẻ tối đa: 180 px.
  - Khoảng cách thẻ: 4 px ở màn hình hẹp, 6 px ở màn hình lớn.
- HUD nhận chiều rộng từ bàn; toàn bộ cụm đầu màn dùng cùng chiều rộng tối đa 700px và nhịp dọc 10px với Link Connect.
- Bàn dùng cùng khoảng cách thẻ 6px, padding 8px; trên màn hình hẹp dùng 4px và 6px. Chiều cao thẻ được tính từ vị trí thật của board để không tràn đáy.
- Tùy chọn tọa độ bàn thêm nhãn cột/hàng nhưng không thay đổi luật ghép.

## 4. Điểm, sao và Xu

### Điểm ghép cặp

Điểm một cặp thường:

```text
10 + 2 × min(max(combo - 1, 0), 4)
```

Điểm nhóm đặc biệt dùng cùng công thức, không nhân 1,5. Nguồn runtime là
`calculateGroupScore` trong `js/progression/gameplayRules.js`; các helper
tính điểm cũ trong config không quyết định lượt chơi nhiều đợt hiện tại.
Điểm hoàn thành nhanh lấy từ `calculateFastFinishBonus`, theo số nhóm,
thời gian chơi thực và tổng ngân sách đã cấp, không cộng nguyên số giây
còn lại. Vô tận không có phần điểm hoàn thành nhanh.

### Mốc sao

| Sao | Màn có giới hạn thời gian | Vô tận |
| --- | ---: | ---: |
| 1 sao | Hoàn thành màn nếu chưa đạt ngưỡng 2 sao | Tương tự |
| 2 sao | `ceil(tổng số nhóm của màn × 13)` | `ceil(tổng số nhóm × 12,5)` |
| 3 sao | `ceil(tổng số nhóm của màn × 16,5)` | `ceil(tổng số nhóm × 15,5)` |

HUD sao hiển thị tooltip `Mục tiêu: xxx`, trong đó `xxx` là tổng điểm cần để đạt 3 sao.

Kết quả lưu theo `mode:level`. Tổng điểm và tổng sao chỉ tăng theo phần chênh lệch của kỷ lục mới, không cộng lặp khi chơi lại cùng màn với kết quả thấp hơn.

### Xu khi ghép và hoàn thành

Xu nhận ngay khi ghép:

```text
2 Xu cho mỗi cặp ghép thủ công, không tăng theo combo
```

Mỗi Xu được biểu diễn bằng một icon rơi quanh cặp vừa ghép rồi bay tới icon Xu trên HUD. Bộ đếm Xu cập nhật bằng hoạt ảnh nhưng dữ liệu được cộng ngay khi phần thưởng phát sinh.

Cuối màn:

- Dùng `calculateVictoryCoins`: `round((10 + tổng số nhóm × 1) × hệ số độ khó) + 2 × sao` cho Memory.
- Hệ số Dễ/Trung bình/Khó/Siêu khó/Thử thách/Vô tận: 1/1,2/1,5/1,8/1,3/1,3. Tổng nhóm tính cả các đợt của màn.
- Không trừ Xu cuối màn theo số lần ghép sai. Thưởng từ Lucky, mốc, nhiệm vụ và các nguồn khác tính riêng.

## 5. Combo

Combo chỉ nối tiếp nếu cặp tiếp theo được ghép đúng trong cửa sổ thời gian hiện hành:

| Kích thước bàn | Cửa sổ combo |
| --- | ---: |
| Tối đa 8 cặp | 15 giây |
| 9–15 cặp | 20 giây |
| Từ 16 cặp | 30 giây |

- Ghép đúng khởi động lại toàn bộ vạch thời gian combo.
- Ghép sai hoặc để vạch chạy hết đặt combo về 0.
- Bỏ chọn cùng thẻ không làm mất combo.
- Combo ảnh hưởng điểm theo công thức có trần ở mục 4; không tự cộng giây vào đồng hồ.
- Nhãn combo bắt đầu từ x2 và tăng cấp trình bày: Nice, Good, Great, Excellent, Perfect, Peak, Unbelievable, Supreme, Legendary, Mythic, Godlike và Ultimate.

## 6. Gợi ý và Xem trước

### Gợi ý

- Lượt chơi mới bắt đầu với 3 Gợi ý.
- Khi sang level mới, nhận thêm 1 Gợi ý nếu chưa đạt giới hạn kho.
- Mỗi lần dùng chọn ngẫu nhiên một cặp chưa ghép, lật hai thẻ và đánh dấu trong 2,5 giây.
- Không dùng được khi bàn đang khóa, game đang tạm dừng hoặc người chơi đang chọn dở một thẻ.
- Gợi ý mua trong cửa hàng được cộng trực tiếp vào số lượt hiện có và giữ luồng sử dụng hiện tại.

### Kho Xem trước

| Gói | Mã dữ liệu | Màu nhận diện | Giá |
| --- | --- | --- | ---: |
| Xem 4 thẻ | `preview4` | Teal | 58 Xu |
| Xem 8 thẻ | `preview8` | Xanh dương | 108 Xu |
| Xem 12 thẻ | `preview12` | Tím | 158 Xu |
| Xem tất cả | `previewAll` | Vàng | 216 Xu |

- Mua gói Xem trước chỉ cộng vào kho, không tự dùng.
- Nút Xem trước trên HUD hiển thị tổng số gói đang có; mở nút để chọn loại gói và sử dụng.
- Một lượt Xem trước kéo dài 5 giây và chỉ lật các thẻ chưa ghép đang úp.
- Gói 4/8/12 chọn ngẫu nhiên tối đa số thẻ tương ứng; gói tất cả lật toàn bộ thẻ hợp lệ.
- Vật phẩm Xem trước rơi vào kho; chỉ dùng khi người chơi chọn. Pool tiếp tế có4/8/12thẻ theo60/30/10; Xem tất cả chỉ ở mốc10.

## 7. Kho Thời gian và xử lý hết giờ

| Gói | Mã dữ liệu | Màu nhận diện | Giá |
| --- | --- | --- | ---: |
| +30 giây | `time30` | Xanh dương | 360 Xu |
| +45 giây | `time45` | Tím | 504 Xu |
| +60 giây | `time60` | Vàng | 648 Xu |

- Mua gói Thời gian chỉ cộng vào kho. `time10` cũ giữ nguyên số lượng, mỗi món dùng được +30s; không bán hoặc cấp mới loại này.
- Nút Thời gian trên HUD hiển thị tổng số gói và cho chọn loại để dùng.
- Nút kho Thời gian được ẩn trong Vô tận.
- Hai nút hỗ trợ nhanh chỉ hiển thị biểu tượng; số lượng nằm trong tooltip và từng lựa chọn trong kho theo mẫu `Đang có: x`.
- Khi dùng, thời gian được cộng ngay vào đồng hồ và phiên hiện tại được lưu cùng số lượng kho mới.
- Giới hạn thử nghiệm dùng chung cho mỗi loại vật phẩm và số Gợi ý là 9999.

Khi hết giờ, popup thất bại có các lựa chọn:

- Về Menu.
- Chơi lại.
- Mua trực tiếp30giây với360Xu.
- Mua trực tiếp60giây với648Xu.

Hai gói cứu thua là giao dịch riêng của popup hết giờ, không lấy từ kho Thời gian. Sau khi mua thành công, đồng hồ bắt đầu lại sau 1 giây đệm.

## 8. Thẻ đặc biệt và vật phẩm rơi

Thẻ nằm trong thư mục `special/` của chủ đề được đánh dấu là thẻ đặc biệt. Khi ghép đúng một cặp đặc biệt:

1. Tính điểm nhóm theo công thức chung ở mục 4, không nhân hệ số đặc biệt.
2. Kiểm tra rơi Năng lượng.
3. Kiểm tra thêm một phần thưởng hỗ trợ độc lập.

### Năng lượng và hỗ trợ

- Mỗi cặp thường có 20% nhận 1 năng lượng, cặp đặc biệt/Lucky có 80%; không bảo đảm sau chuỗi trượt.
- Hỗ trợ bốc độc lập: thường 5%, Lucky 10%, Special 30%. Lucky trùng Special chỉ dùng nhánh 30%, không bốc hai lần.
- Ba nhóm Xem trước/Gợi ý/Thời gian chia đều. Trong nhóm Xem trước,4/8/12 theo 60/30/10; trong nhóm Thời gian,30/45/60 giây theo 60/30/10. Tất cả hỗ trợ vào kho, kể cả Vô tận.
- Năng lượng và thưởng mốc được lưu cùng lượt ghép trước hiệu ứng. Vòng 10 năng lượng nhận mốc 10 một lần rồi về 0; hoạt ảnh không quyết định quyền nhận quà.
- Kho mỗi món tối đa 9999; quà hỗ trợ của nguồn gameplay vượt kho đổi 10 Xu/đơn vị.
- Luật mới áp dụng từ bàn mới. Phiên cũ giữ chính sách thưởng tới hết đợt, giữ quà Lucky đã lưu và tiến độ cũ.

## 9. Vòng 10 mốc năng lượng

Bảng đã duyệt; hỗ trợ vào kho, Xu vào ví, kể cả khi chơi Vô tận.

| Mốc | Phần thưởng |
|---:|---|
|1|10 Xu|
|2|Xem trước 4 thẻ|
|3|20 Xu|
|4|1 gói 30 giây|
|5|Xem trước 8 thẻ|
|6|30 Xu|
|7|1 Gợi ý và 1 gói 30 giây|
|8|Xem trước 12 thẻ|
|9|50 Xu và 1 Gợi ý|
|10|Xem trước tất cả,1 gói 30 giây và 100 Xu|

## 10. Ô may mắn

- Mọi chế độ có 1–3 cặp Lucky ở đợt đầu. Thử thách/Vô tận chỉ sinh ở màn 1/đợt 1 của run; Tiếp tục không sinh lại.
- Chọn đều một trong 15 giây cộng trực tiếp/1 Gợi ý/10 Xu. Nhánh 15 giây ở Vô tận đổi 10 Xu, giữ trọng số ban đầu.
- Lucky và Special độc lập; Lucky trùng Special vẫn có quà Lucky nhưng chỉ một lần bốc năng lượng/hỗ trợ.
- Kho đầy đổi phần Gợi ý vượt thành 10 Xu/đơn vị, không bốc lại loại quà.

## 11. Bắt đầu mới, Chơi lại và Tiếp tục

Ba luồng phải được hiểu tách biệt:

| Luồng | Level | Thời gian | Gợi ý | Năng lượng |
| --- | --- | --- | --- | --- |
| Chơi mới | Bắt đầu level 1 | Thời gian chuẩn của chế độ | Trạng thái đầu lượt | Reset |
| Chơi lại | Giữ level | Khôi phục thời gian đầu màn | Giữ số hiện tại | Giữ |
| Tiếp tục | Khôi phục level đã lưu | Khôi phục thời gian checkpoint | Khôi phục | Khôi phục |
| Sang màn | Level +1 | Thường: thời gian chuẩn mới; Thử thách: thời gian còn lại +10 giây | Có thể +1 | Giữ |

- Phiên được lưu riêng cho từng chế độ trong `progress.memoryMatch.sessionsByMode`.
- Phiên gồm mode, level, thời gian còn lại, giới hạn thời gian, thời gian đầu màn, Gợi ý, tiến trình năng lượng và chuỗi không-rơi.
- Thời gian được checkpoint mỗi 5 giây, khi tab bị ẩn và khi rời trang.
- `roundId` ngăn timeout hoặc callback hiệu ứng của màn cũ sửa dữ liệu/DOM của màn mới.
- Khi tạo màn mới hoặc Chơi lại, hiệu ứng tạm, combo timer và trạng thái lựa chọn cũ được dọn trước khi render bàn.

## 12. HUD và hiệu ứng

- HUD tiến trình trên cùng hiển thị Moves, Miss, Combo, sao màn, Điểm, số cặp và Gợi ý.
- HUD menu hiển thị level, timer, tổng sao; thanh thời gian 3px nằm liền dưới HUD, thụt hai mép 6px giống Link Connect và không chặn thao tác với thanh mốc.
- Thanh mốc cách HUD và bàn theo cùng nhịp dọc 10px của Link Connect; rê chuột hoặc nhấn giữ từng mốc để xem phần thưởng.
- Thanh thời gian đổi màu theo tỷ lệ còn lại:
  - Bình thường từ 70% trở lên.
  - Cảnh báo từ 30% đến dưới 70%.
  - Nguy cấp dưới 30%.
- Thanh năng lượng có đủ 10 mốc; Xu nằm bên trái ngoài thanh và hiển thị đầy đủ số lượng.
- Tooltip năng lượng dùng dạng `Năng lượng x/10`.
- Điểm hiện cạnh cặp vừa ghép; hiệu ứng combo hiện ở vùng trên của bàn để dễ quan sát.
- Vật phẩm rơi dùng Web Animations với `transform/opacity`, được giữ ngắn trên bàn rồi bay thẳng đến đúng công cụ/HUD và tự xóa.
- Hiệu ứng tôn trọng `prefers-reduced-motion`; dữ liệu phần thưởng không phụ thuộc vào việc hoạt ảnh có chạy hay không.
- Thanh thời gian dùng `requestAnimationFrame` chỉ để nội suy `transform`; đồng hồ gameplay vẫn cập nhật theo giây. Khóa thao tác để bảo vệ thẻ không làm dừng thời gian; chỉ trạng thái pause thực sự mới dừng đồng hồ.

## 13. Thời lượng và giới hạn dùng chung

| Nội dung | Giá trị |
| --- | ---: |
| Lật thẻ | 600 ms |
| Úp thẻ | 180 ms |
| Giữ cặp sai | 800 ms |
| Xem trước từ vật phẩm | 5.000 ms |
| Thông tin đầu màn | 2.000 ms |
| Nhãn thưởng | 760 ms + 260 ms thoát |
| Điểm/combo nổi | 1.900 ms |
| Xu rơi và thu thập | 1.500 ms, lệch nhau 45 ms/icon |
| Hoạt ảnh bộ đếm Xu | 520 ms |
| Checkpoint phiên | 5 giây |
| Đệm sau mua cứu thua | 1.000 ms |
| Pháo hoa tổng kết | 2.500 ms |
| Cảnh chiến thắng đặc biệt | Sau khi hoàn thành level 100; mở từ nút `Congratulations!` ở bảng tổng kết |
| Giới hạn mỗi loại vật phẩm/Gợi ý | 9999 |

## 14. Nguồn cấu hình và module

| Nhóm | Nguồn chính |
| --- | --- |
| Chế độ, bàn Thử thách, may mắn, năng lượng và mốc thưởng | `js/config.js` |
| Điểm, sao, Xu ghép/thắng, nhiều đợt và thưởng hoàn thành nhanh | `js/progression/gameplayRules.js` |
| Thời lượng, cửa sổ combo và giới hạn dùng chung | `js/gameplayTuning.js` |
| Giá gói cửa hàng và mua cứu thua | `js/shopCatalog.js` |
| Quy tắc Xu mỗi cặp và hiệu ứng Xu | `js/coinRewards.js` |
| Catalog và số lượng kho Memory Match | `js/memoryItems.js` |
| Luật rơi năng lượng và giải mốc | `js/memorySpecial.js` |
| Xem trước thẻ | `js/memoryPreview.js` |
| Snapshot phiên Memory Match | `js/memorySession.js` |
| Vòng đời level, timer, Gợi ý và hết giờ | `js/gameController.js` |
| Chọn thẻ, ghép, combo, điểm và hoàn thành | `js/logic.js` |
| Tạo bàn và bố cục responsive | `js/grid.js` |
| HUD và phản hồi giao diện | `js/ui.js` |
| Hiệu ứng vật phẩm rơi dùng chung | `js/lootEffects.js` |

Khi điều chỉnh cân bằng, sửa nguồn cấu hình tương ứng thay vì chép số mới vào controller, renderer hoặc CSS.

## 15. Danh sách kiểm thử bắt buộc

### Gameplay

- Chạm cùng thẻ để bỏ chọn; combo không mất.
- Ghép đúng/sai ở đầu, giữa và cuối cửa sổ combo 15/20/30 giây.
- Cặp cuối hoàn thành màn đúng một lần; thưởng và kỷ lục không bị cộng lặp.
- Dễ, Trung bình, Khó, Siêu khó, Vô tận và toàn bộ bậc bàn Thử thách.
- Chơi mới, Chơi lại, sang màn, Tiếp tục sau reload và quay Menu rồi Tiếp tục.

### Vật phẩm và phần thưởng

- Mua và dùng riêng từng gói Xem trước/Thời gian; số kho giảm đúng một.
- Lỗi lưu giữa giao dịch không làm mất Xu hoặc tạo vật phẩm lệch.
- Quà Xem trước vào kho; nhận quà không tự kích hoạt lật thẻ.
- Cặp đặc biệt ở mốc 1–10, vòng mới sau mốc 10 và tỷ lệ hỗ trợ5/10/30%.
- Nhận hỗ trợ khi bàn đang khóa không tự dùng vật phẩm hoặc thay lựa chọn.
- Ô may mắn nhận đủ ba loại thưởng và xử lý khi Gợi ý đã đầy.

### Giao diện và hiệu suất

- HUD không tràn ở mobile hẹp; mốc 1 và 10 nằm trong thanh, Xu không bị cắt.
- Màu gói teal/xanh dương/tím/vàng phân biệt rõ mà không cần nhãn trên vật phẩm rơi.
- Timer bar, combo bar, bộ đếm Xu và tooltip cập nhật chính xác.
- Đổi game hoặc đổi round khi preview/vật phẩm đang bay không để lại phần tử tạm.
- Chế độ giảm chuyển động vẫn cộng thưởng và cập nhật HUD đúng.
- Board chỉ render lại khi tạo màn; lật, úp, match và xem trước chỉ cập nhật các thẻ liên quan.

## 16. Trạng thái cân bằng cần nhớ

- Chính sách mới dùng năng lượng80/20, hỗ trợ5/10/30, không pity; không còn tỷ lệ100%/50% để kiểm thử.
- Giới hạn kho9999; overflow gameplay10Xu/đơn vị. Không đổi giá shop hoặc thưởng thắng.
- Khi chốt kinh tế chính thức cần đánh giá chung: Xu mỗi cặp, Xu cuối màn, giá cửa hàng, tần suất thẻ đặc biệt, tỷ lệ hỗ trợ và giá trị 10 mốc.
