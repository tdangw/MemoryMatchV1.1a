# Quy tắc & Cấu hình — Memory Match

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
| Dễ | 12 | 6 | 4 | 4 | 60 giây | `30 + floor(thời gian còn lại × 0,35)` |
| Trung bình | 24 | 12 | 6 | 4 | 90 giây | `50 + floor(thời gian còn lại × 0,50)` |
| Khó | 36 | 18 | 6 | 6 | 120 giây | `70 + floor(thời gian còn lại × 0,65)` |
| Siêu khó | 60 | 30 | 6 | 6 | 180 giây | `90 + floor(thời gian còn lại × 0,80)` |
| Vô tận | 60 | 30 | 6 | 6 | Không giới hạn | 10 Xu |
| Thử thách | Theo level | Theo level | Theo level | Theo level | 60 giây ban đầu | `30 + floor(thời gian còn lại × 0,35)` |

Với Dễ, Trung bình, Khó và Siêu khó, mỗi level sau được cộng `2 giây`, tối đa `10 giây` so với thời gian gốc của chế độ.

### Bàn Thử thách

| Level | Số thẻ | Số cặp | Cột desktop | Cột mobile |
| --- | ---: | ---: | ---: | ---: |
| 1–3 | 12 | 6 | 4 | 4 |
| 4–6 | 16 | 8 | 4 | 4 |
| 7–9 | 20 | 10 | 4 | 4 |
| 10–12 | 24 | 12 | 6 | 4 |
| 13–15 | 30 | 15 | 6 | 5 |
| 16–18 | 36 | 18 | 6 | 6 |
| 19–21 | 42 | 21 | 6 | 6 |
| Từ 22 | 48 | 24 | 6 | 6 |

Thử thách bắt đầu với 60 giây. Khi qua màn, thời gian còn lại được giữ và cộng thêm 10 giây cho màn kế tiếp.

## 3. Bắt đầu màn và bố cục thích ứng

- Mỗi màn chọn ngẫu nhiên số hình cần thiết từ chủ đề đang trang bị, nhân đôi từng hình rồi xáo danh sách.
- Tất cả thẻ được mở xem trước trước khi bắt đầu tính giờ:
  - Chế độ thường và Thử thách: 5 giây.
  - Vô tận: 8 giây.
- Bàn tự tính kích thước thẻ theo chiều rộng và chiều cao khả dụng:
  - Điểm chuyển mobile: 600 px.
  - Kích thước thẻ tối thiểu: 36 px.
  - Kích thước thẻ tối đa: 180 px.
  - Khoảng cách thẻ: 1 px ở màn hình gọn, 3 px ở màn hình lớn.
- HUD nhận chiều rộng từ bàn; thanh thời gian 3px được tích hợp trực tiếp dưới HUD và dùng chung kiểu hiển thị với Link Connect.
- Tùy chọn tọa độ bàn thêm nhãn cột/hàng nhưng không thay đổi luật ghép.

## 4. Điểm, sao và Xu

### Điểm ghép cặp

Điểm một cặp thường:

```text
10 + (combo - 1) × 3
```

Cặp đặc biệt được cộng thêm 50% điểm ghép hiện tại, làm tròn số nguyên:

```text
điểm cặp đặc biệt = điểm cặp thường + round(điểm cặp thường × 0,5)
```

Khi hoàn thành màn có giới hạn thời gian, số giây còn lại được cộng trực tiếp vào tổng điểm trước khi xét sao. Vô tận không có điểm thưởng thời gian cuối màn.

### Mốc sao

| Sao | Màn có giới hạn thời gian | Vô tận |
| --- | ---: | ---: |
| 1 sao | `số cặp × 12` | `số cặp × 10` |
| 2 sao | `số cặp × 18` | `số cặp × 15` |
| 3 sao | `số cặp × 25` | `số cặp × 20` |

HUD sao hiển thị tooltip `Mục tiêu: xxx`, trong đó `xxx` là tổng điểm cần để đạt 3 sao.

Kết quả lưu theo `mode:level`. Tổng điểm và tổng sao chỉ tăng theo phần chênh lệch của kỷ lục mới, không cộng lặp khi chơi lại cùng màn với kết quả thấp hơn.

### Xu khi ghép và hoàn thành

Xu nhận ngay khi ghép:

```text
2 + (combo - 1)
```

Mỗi Xu được biểu diễn bằng một icon rơi quanh cặp vừa ghép rồi bay tới icon Xu trên HUD. Bộ đếm Xu cập nhật bằng hoạt ảnh nhưng dữ liệu được cộng ngay khi phần thưởng phát sinh.

Cuối màn:

- Tính thưởng theo bảng chế độ ở mục 2.
- Mỗi lần ghép sai trừ 1 Xu khỏi thưởng cuối màn, nhưng thưởng không thể âm.
- Vô tận không áp dụng phạt Xu theo số lần sai.

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
- Từ combo 2 trở lên, màn có giới hạn thời gian nhận thêm số giây bằng chính combo hiện tại. Vô tận không nhận thưởng thời gian combo.
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
| Xem 4 thẻ | `preview4` | Teal | 8 Xu |
| Xem 8 thẻ | `preview8` | Xanh dương | 15 Xu |
| Xem 12 thẻ | `preview12` | Tím | 22 Xu |
| Xem tất cả | `previewAll` | Vàng | 30 Xu |

- Mua gói Xem trước chỉ cộng vào kho, không tự dùng.
- Nút Xem trước trên HUD hiển thị tổng số gói đang có; mở nút để chọn loại gói và sử dụng.
- Một lượt Xem trước kéo dài 5 giây và chỉ lật các thẻ chưa ghép đang úp.
- Gói 4/8/12 chọn ngẫu nhiên tối đa số thẻ tương ứng; gói tất cả lật toàn bộ thẻ hợp lệ.
- Vật phẩm Xem trước rơi từ cặp đặc biệt tự kích hoạt, không cộng vào kho và chỉ chọn ngẫu nhiên gói 4/8/12.
- Nếu lúc vật phẩm tự dùng người chơi đang chọn thẻ hoặc bàn đang khóa, hệ thống đợi tối đa khoảng 5 giây để tìm thời điểm an toàn.

## 7. Kho Thời gian và xử lý hết giờ

| Gói | Mã dữ liệu | Màu nhận diện | Giá |
| --- | --- | --- | ---: |
| +10 giây | `time10` | Teal | 18 Xu |
| +30 giây | `time30` | Xanh dương | 50 Xu |
| +45 giây | `time45` | Tím | 70 Xu |
| +60 giây | `time60` | Vàng | 90 Xu |

- Mua gói Thời gian chỉ cộng vào kho.
- Nút Thời gian trên HUD hiển thị tổng số gói và cho chọn loại để dùng.
- Nút kho Thời gian được ẩn trong Vô tận.
- Hai nút hỗ trợ nhanh chỉ hiển thị biểu tượng; số lượng nằm trong tooltip và từng lựa chọn trong kho theo mẫu `Đang có: x`.
- Khi dùng, thời gian được cộng ngay vào đồng hồ và phiên hiện tại được lưu cùng số lượng kho mới.
- Giới hạn thử nghiệm dùng chung cho mỗi loại vật phẩm và số Gợi ý là 999.

Khi hết giờ, popup thất bại có các lựa chọn:

- Về Menu.
- Chơi lại.
- Mua trực tiếp 1 giây với 2 Xu.
- Mua trực tiếp 5 giây với 10 Xu.

Hai gói cứu thua là giao dịch riêng của popup hết giờ, không lấy từ kho Thời gian. Sau khi mua thành công, đồng hồ bắt đầu lại sau 1 giây đệm.

## 8. Thẻ đặc biệt và vật phẩm rơi

Thẻ nằm trong thư mục `special/` của chủ đề được đánh dấu là thẻ đặc biệt. Khi ghép đúng một cặp đặc biệt:

1. Điểm cặp được cộng thêm 50% như mục 4.
2. Kiểm tra rơi Năng lượng.
3. Kiểm tra thêm một phần thưởng hỗ trợ độc lập.

### Năng lượng

- Tỷ lệ hiện tại: **100%** để kiểm thử hiệu ứng.
- Cấu hình vẫn giữ bảo hiểm: sau 9 lần liên tiếp không rơi, lần thứ 10 chắc chắn rơi.
- Năng lượng là tiến trình nội bộ, không phải vật phẩm trong kho.
- Tiến trình được cộng ngay khi vật phẩm xuất hiện trên bàn; icon sau đó bay tới thanh 10 mốc.
- Qua level, thua rồi Chơi lại và quay Menu rồi Tiếp tục vẫn giữ tiến trình.
- Chọn Chơi mới reset tiến trình và chuỗi không-rơi.
- Đạt mốc 10 nhận thưởng, hiển thị đầy thanh trong thời gian ngắn rồi trở về mốc 0 để bắt đầu vòng mới.

### Phần thưởng hỗ trợ độc lập

- Xác suất hiện tại: **50%** cho mỗi cặp đặc biệt.
- Nếu rơi, chọn đều một trong ba nhóm:
  - Xem trước tự dùng: ngẫu nhiên 4/8/12 thẻ.
  - Gợi ý: +1 lượt.
  - Vật phẩm Thời gian: ngẫu nhiên +10/+30/+45/+60 giây, cộng vào kho.
- Màu icon Xem trước thể hiện cấp gói; vật phẩm rơi không hiển thị nhãn số để tránh rườm rà.
- Hiệu ứng rơi và bay thu thập không khóa gameplay. Riêng lúc Xem trước thực sự lật thẻ, bàn được khóa để bảo toàn lựa chọn.

## 9. Vòng 10 mốc năng lượng

Các phần thưởng dưới đây là cấu hình tạm thời để kiểm thử và sẽ được cân bằng lại sau:

| Mốc | Phần thưởng | Cách nhận |
| ---: | --- | --- |
| 1 | Xem trước 4 thẻ | Tự dùng |
| 2 | Vật phẩm +10 giây | Vào kho |
| 3 | +1 Gợi ý | Cộng trực tiếp |
| 4 | +5 Xu | Cộng trực tiếp |
| 5 | Ngẫu nhiên Xem trước 4 hoặc 8 thẻ | Tự dùng |
| 6 | Ngẫu nhiên vật phẩm +10 hoặc +30 giây | Vào kho |
| 7 | +1 Gợi ý và +5 Xu | Cộng trực tiếp |
| 8 | Xem trước 12 thẻ | Tự dùng |
| 9 | Vật phẩm +30 giây và +1 Gợi ý | Vào kho và cộng trực tiếp |
| 10 | Xem trước tất cả, +60 giây và +10 Xu | Hai vật phẩm vào kho, Xu cộng trực tiếp |

## 10. Ô may mắn trong Thử thách

- Chỉ xuất hiện trong chế độ Thử thách.
- Mỗi bàn chọn ngẫu nhiên từ 1 đến 3 cặp trong các hình đã có để gắn phần thưởng bí mật.
- Khi ghép cặp tương ứng, nhận ngẫu nhiên một trong ba nhóm:
  - +3–5 giây.
  - +1–2 Gợi ý.
  - +1–10 Xu.
- Nếu Gợi ý đã đạt giới hạn, hệ thống chọn lại phần thưởng không phải Gợi ý.
- Ô may mắn và thẻ đặc biệt là hai cờ độc lập; một hình có thể đồng thời mang dữ liệu đặc biệt của chủ đề và phần thưởng may mắn của màn Thử thách.

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
- HUD menu hiển thị level, timer, tổng sao; thanh thời gian 3px nằm liền dưới HUD, thụt hai mép 6px giống Link Connect và đổi màu theo tỷ lệ còn lại:
  - Bình thường từ 70% trở lên.
  - Cảnh báo từ 30% đến dưới 70%.
  - Nguy cấp dưới 30%.
- Thanh năng lượng có đủ 10 mốc; Xu nằm bên trái ngoài thanh và hiển thị đầy đủ số lượng.
- Tooltip năng lượng dùng dạng `Năng lượng x/10`.
- Điểm hiện cạnh cặp vừa ghép; hiệu ứng combo hiện ở vùng trên của bàn để dễ quan sát.
- Vật phẩm rơi dùng Web Animations với `transform/opacity`, được giữ ngắn trên bàn rồi bay thẳng đến đúng công cụ/HUD và tự xóa.
- Hiệu ứng tôn trọng `prefers-reduced-motion`; dữ liệu phần thưởng không phụ thuộc vào việc hoạt ảnh có chạy hay không.
- Thanh thời gian dùng `requestAnimationFrame` chỉ để nội suy `transform`; đồng hồ gameplay vẫn cập nhật theo giây. Khi pause/lock, nội suy dừng giảm thời gian.

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
| Cảnh chiến thắng đặc biệt | Level 100 |
| Giới hạn mỗi loại vật phẩm/Gợi ý | 999 |

## 14. Nguồn cấu hình và module

| Nhóm | Nguồn chính |
| --- | --- |
| Chế độ, bàn Thử thách, điểm, sao, thời gian, may mắn, năng lượng và mốc thưởng | `js/config.js` |
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
- Gói Xem trước tự dùng không cộng kho; gói Xem tất cả mua/thưởng mốc 10 có cộng kho.
- Cặp đặc biệt ở mốc 1–10, vòng mới sau mốc 10 và tỷ lệ hỗ trợ 50%.
- Vật phẩm tự dùng khi bàn đang khóa, đang chọn một thẻ hoặc vừa hoàn thành màn.
- Ô may mắn nhận đủ ba loại thưởng và xử lý khi Gợi ý đã đầy.

### Giao diện và hiệu suất

- HUD không tràn ở mobile hẹp; mốc 1 và 10 nằm trong thanh, Xu không bị cắt.
- Màu gói teal/xanh dương/tím/vàng phân biệt rõ mà không cần nhãn trên vật phẩm rơi.
- Timer bar, combo bar, bộ đếm Xu và tooltip cập nhật chính xác.
- Đổi game hoặc đổi round khi preview/vật phẩm đang bay không để lại phần tử tạm.
- Chế độ giảm chuyển động vẫn cộng thưởng và cập nhật HUD đúng.
- Board chỉ render lại khi tạo màn; lật, úp, match và xem trước chỉ cập nhật các thẻ liên quan.

## 16. Trạng thái cân bằng cần nhớ

- `energyDrop.chance = 1` là tỷ lệ **100% phục vụ kiểm thử**, chưa phải tỷ lệ phát hành.
- `supportDrop.chance = 0.5` và 10 mốc hiện tại là cấu hình tạm thời.
- Chưa áp dụng giới hạn thấp hơn 999 hoặc trần Xu.
- Khi chốt kinh tế chính thức cần đánh giá chung: Xu mỗi cặp, Xu cuối màn, giá cửa hàng, tần suất thẻ đặc biệt, tỷ lệ hỗ trợ và giá trị 10 mốc.
