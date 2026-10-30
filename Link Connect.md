# Quy tắc & Thiết kế — Link Connect

> Cân bằng vật phẩm24/10/2026: chỉ vật phẩm tiêu hao giảm10%, làm tròn đến Xu nguyên; công thức và bảng giá chung tại `js/shopCatalog.js` và mục cân bằng mới nhất trong `CONTEXT.md`. Vật phẩm tăng giờ tối thiểu30s; Xem trước/Gợi ý và thưởng cộng giờ trực tiếp giữ thời lượng. Ngoại hình/hiệu ứng/chủ đề/mở rộng khay giữ giá.

> Cập nhật 24/10/2026: Dễ / Trung bình / Khó / Siêu khó cấp lần lượt **60 / 90 / 120 / 180 giây cho mỗi đợt thẻ**. Thời gian dư được giữ sang đợt tiếp theo; không cộng thêm thời gian theo level ở bốn độ khó này. Thử thách dùng mốc của độ khó nhỏ nhất chứa đủ số thẻ; Vô tận giữ nguyên. Phiên đang lưu giữ thời gian đã cấp/còn lại và dùng mốc mới từ đợt kế tiếp. Quyết định này thay các mốc thời gian cũ bên dưới; nguồn hiện hành là `js/progression/waveTiming.js`.

Tài liệu này mô tả luật chơi, cân bằng và phạm vi sản phẩm của **Link Connect**. Ranh giới module nằm trong `ARCHITECTURE.md`; trạng thái ngắn gọn của dự án nằm trong `CONTEXT.md`.

---

## 1. Tổng quan & Tầm nhìn thiết kế (Design Vision)

| Tiêu chí               | Memory Match                                   | Link Connect                                                                    |
| :--------------------- | :--------------------------------------------- | :------------------------------------------------------------------------------ |
| **Trạng thái thẻ**     | Ẩn mặt (úp thẻ)                                | **Mở ngửa toàn bộ thẻ ngay từ đầu**                                             |
| **Mục tiêu cốt lõi**   | Rèn luyện **trí nhớ ngắn hạn** và sự tập trung | Rèn luyện **khả năng quan sát nhanh, phản xạ mắt** và tư duy đường đi trực giao |
| **Luật ghép đôi**      | Lật trúng 2 thẻ giống nhau ở bất kỳ đâu        | Ghép 2 thẻ giống nhau có **đường nối hợp lệ không bị cản**                      |
| **Nhịp độ chơi**       | Cẩn trọng, ghi nhớ vị trí, tính toán lật mở    | Nhanh, dồn dập, tạo chuỗi combo liên hoàn cực kỳ thỏa mãn (satisfying)          |
| **Tài nguyên sử dụng** | Kho chủ đề dùng chung                          | **Kho chủ đề và hệ thống Xu dùng chung**                                        |

---

## 2. Quy tắc Đường nối Chuẩn (Orthogonal Pathfinding Rules)

Hai thẻ cùng hình chỉ được ghép nối thành công khi đường đi thỏa mãn đồng thời các điều kiện sau:

1. **Tối đa 2 khúc gấp (Max 2 Bends / 3 Segments):**
   - **0 khúc gấp (1 đoạn thẳng):** Hai thẻ cùng hàng hoặc cùng cột và ở giữa không có thẻ nào cản trở (hoặc nằm kề sát nhau).
   - **1 khúc gấp (2 đoạn thẳng - Hình chữ L):** Đi thẳng theo một trục rồi rẽ 90° qua các ô trống để chạm tới thẻ đích.
   - **2 khúc gấp (3 đoạn thẳng - Hình chữ U hoặc chữ Z):** Đi qua các khoảng trống trên bàn cờ hoặc vòng qua khoảng không bên ngoài biên bàn cờ, gập 2 lần 90° để chạm thẻ đích.
2. **Quy tắc viền ngoài (Outer Boundary Routing):**
   - Xung quanh bàn cờ luôn có một "vùng đệm rỗng" (1 lớp ô trống bao quanh). Các thẻ nằm ở mép ngoài cùng có thể nối vòng qua khoảng không này để ghép với nhau.
3. **Hiệu ứng tia sáng kết nối (Laser Beam FX):**
   - Khi ghép đúng, một vệt sáng neon phát quang vẽ lướt qua chính xác lộ trình nối; hai thẻ tan biến và để lại ô trống.

```text
  [A] ──── [A]             [A] ─────┐              ┌─────── [A]
 (0 khúc gấp - Thẳng)               │              │
                                   [A]             └─────── [A]
                           (1 khúc gấp - Chữ L)    (2 khúc gấp - Chữ U / Z)
```

---

## 3. Bàn cờ & Thẻ Tương tác

Sau mỗi cặp ghép, Link Connect áp dụng quy tắc bàn cờ của cả màn. Dù bàn tĩnh hay động, sau khi trạng thái ổn định hệ thống luôn kiểm tra còn ít nhất một đường nối; nếu không, game xáo các thẻ còn lại để ván tiếp tục.

### Bàn Thử thách

| Level | Số thẻ | Số cặp | Số cột |
| --- | ---: | ---: | ---: |
| 1 | 12 | 6 | 4 |
| 2 | 16 | 8 | 4 |
| 3 | 20 | 10 | 4 |
| 4 | 24 | 12 | 4 |
| 5 | 30 | 15 | 6 |
| 6 | 36 | 18 | 6 |
| 7 | 42 | 21 | 6 |
| 8 | 48 | 24 | 6 |
| 9 | 54 | 27 | 6 |
| Từ 10 | 60 | 30 | 6 |

Thử thách tăng một bậc mỗi level: 4×3 → 4×4 → 4×5 → 4×6 → 6×5 → 6×6 → 6×7 → 6×8 → 6×9 → 6×10 (cột × hàng). Bỏ bậc 6×4 vì trùng 12 cặp với 4×6 nhưng làm bàn thấp xuống. Từ level 10 giữ tối đa 30 cặp. Số cặp không đổi theo thiết bị hoặc fullscreen. Các chế độ cố định giữ cấu hình cũ. Thời gian mỗi đợt là60/90/120/180giây theo bàn tối đa12/24/36/60thẻ; nhịp mới cần tiếp tục đánh giá bằng tỷ lệ hoàn thành và lượng hỗ trợ sử dụng, chưa được coi là cân bằng phát hành đã kiểm chứng.

### Toàn màn hình và tập trung

- Nút góc phải hàng tên game bật/tắt toàn màn hình bằng thao tác chủ động; không tự bật khi tải trang. Trạng thái fullscreen giữ qua các level, toàn bộ trang được mở để popup và công cụ vẫn hoạt động.
- Trình duyệt không hỗ trợ hoặc từ chối fullscreen dùng chế độ tập trung: ẩn Moves, Miss, Điểm và thanh sao phụ; giữ đồng hồ, cặp, combo và công cụ. Nhấn lại nút hoặc Escape để thoát chế độ tập trung.
- Game shell tính lại kích thước theo vùng nhìn thấy, không tạo lại bàn hoặc đổi số cặp. Điều khiển và sự kiện được dọn theo vòng đời shell, không thêm vòng lặp đo bố cục.
- Lưới 6×10 ưu tiên màn hình dọc; màn ngang thấp vẫn vừa khung nhưng thẻ nhỏ. Không thay đổi ma trận đường nối giữa ván khi resize.
- Phiên cũ tiếp tục bằng level/tài nguyên/thời gian đã lưu và tạo bàn theo bảng mới, không reset tiến trình. Dùng Chơi mới để đánh giá trọn nhịp cân bằng mới.

### Các kiểu dịch chuyển thẻ — Gravity Shifts

Đây là cơ chế gameplay riêng, không phải hiệu ứng thẻ biến mất trong Bộ sưu tập. Sau khi một cặp thẻ bị loại bỏ, bàn cờ có thể dịch chuyển các thẻ còn lại theo quy tắc của màn, rồi tính lại các đường nối hợp lệ.

1. **Bàn cờ tĩnh — Classic Static:** Ô ghép xong để trống cố định.
2. **Rơi tự do — Gravity Down:** Thẻ phía trên rơi xuống lấp khoảng trống bên dưới.
3. **Dồn lên trên — Gravity Up:** Thẻ phía dưới trượt lên lấp các vị trí phía trên.
4. **Dồn sang bên — Gravity Left / Right:** Thẻ trượt dồn về cạnh trái hoặc cạnh phải bàn cờ.
5. **Hút vào tâm — Center Pull:** Thẻ từ bốn phía trượt về vùng giữa bàn cờ.
6. **Tách đôi ra biên dọc — Vertical Split:** Nửa trên dồn lên, nửa dưới dồn xuống.
7. **Tách đôi ra biên ngang — Horizontal Split:** Nửa trái dồn sang trái, nửa phải dồn sang phải.
8. **Tráo đổi vị trí — Swap:** Các thẻ gần nhau đổi chỗ theo từng cặp.
9. **Xoay tròn — Rotation:** Các vòng thẻ dịch một ô theo chiều kim đồng hồ hoặc ngược chiều kim đồng hồ.

#### Đã triển khai

- Đã có đủ **Tĩnh và 9 nhóm dịch chuyển**: Dồn xuống, Dồn lên, Dồn trái/phải, Hút vào tâm, Tách dọc, Tách ngang, Tráo đổi và Xoay. Xoay có hai chiều nên runtime có tổng cộng 10 quy tắc dịch chuyển cụ thể.
- Phân bổ cấp độ, áp dụng cho mọi chế độ: **1–2 Tĩnh; 3–5 Dồn xuống; 6–8 Dồn lên; 9–12 luân phiên Trái/phải; 13–15 Hút vào tâm; 16–18 Tách dọc; 19–21 Tách ngang; 22–24 Tráo đổi; 25–27 luân phiên hai chiều Xoay; từ 28 chọn ngẫu nhiên trong toàn bộ kiểu dịch chuyển**. Quy tắc đã chọn được lưu cùng phiên đang chơi để không đổi khi tiếp tục màn.
- Không hiển thị popup quy tắc khi bắt đầu màn. Mục **Hướng dẫn** trong Menu giải thích ngắn gọn cách nối, các kiểu dịch chuyển, thẻ cao cấp, năng lượng, tự xáo và tự mở băng cuối màn.
- Sau dịch chuyển hoặc Sấm sét xóa cặp, hệ thống kiểm tra nước đi; nếu cần sẽ xáo các thẻ còn lại.

### Thẻ đặc biệt và thẻ đóng băng

Điểm/Xu/sao của màn nhiều đợt lấy từ `js/progression/gameplayRules.js`:
ghép thủ công nhận 2 Xu cố định; điểm `10 + 2 × min(max(combo − 1,0),4)`,
phá phụ tự động 10 điểm. Không áp hệ số điểm 1,5 của helper config cũ.
Thưởng thắng theo `calculateVictoryCoins`, điểm hoàn thành nhanh theo
`calculateFastFinishBonus`; không dùng hệ số tốc độ/giây dư cũ trong
config làm nguồn cân bằng hiện hành. Mốc sao dùng tổng nhóm cả màn,
chung Memory/Triple. Đánh giá kinh tế mới ở `GAMEPLAY_ECONOMY_AUDIT.md`.

- Thẻ cao cấp không bắt buộc xuất hiện ở mọi màn. Tỷ lệ/số cặp theo kích thước bàn: tối đa 8 cặp là 60% có 1 cặp; 9–15 cặp là 70% có 1–2 cặp; từ 16 cặp là 80% có 2–3 cặp.
- Số cặp băng: tối đa 8 cặp có 1; 9–15 có 2; 16–24 có 3; từ 25 có 4. Nếu chỉ còn băng hoặc không còn nước đi với thẻ mở, hệ thống mở đồng thời số băng cần thiết để tránh kẹt màn.
- Cyan – Phá Băng mở đúng 1 cặp băng; hết băng nhận 10 Xu. Blue – Tiếp Tế có 30% nhận 1 Gợi ý/Xáo trộn/Đóng băng thời gian vào kho, chia đều 3 món. Red – Bùng Nổ có 50% phá 1 cặp thường,50% xáo miễn phí bàn còn lại.
- Năng lượng: thường 20%, đặc biệt/Lucky 80%, mỗi lần trúng 1 năng lượng. Hỗ trợ độc lập: thường 5%, đặc biệt 10%, Blue 30% thay nhánh chung. Không pity; phá phụ không bốc thưởng hoặc kích hoạt chuỗi mới.
- Lucky giữ phạm vi xuất hiện hiện hành: chọn đều 50 Xu hoặc 30 giây trực tiếp. Nhánh thời gian ở Vô tận đổi 50 Xu. Hỗ trợ thời gian/đóng băng vẫn vào kho ở Vô tận.
- Thưởng ghi cùng bàn/phiên trước hiệu ứng. Vòng 10 năng lượng quay về 0 sau mốc 10. Mốc 1/3/5/7/9 nhận 10/20/30/40/50 Xu; mốc 2 phá 1 cặp;4 Gợi ý;6 Xáo trộn;8 Sấm sét;10 phá 1 cặp+100 Xu+1 Đóng băng vào kho.
- Phá phụ chỉ chọn cặp thường không băng/đặc biệt/Lucky, có score/gravity; không tìm được cặp đổi 10 Xu. Red xáo không tiêu item, có giới hạn thử và giữ bàn cũ nếu không thể tạo nước đi; bàn rỗng không xáo hoặc thêm quà ở nhánh xáo.
- Kho 9999, hỗ trợ gameplay vượt kho đổi 10 Xu/đơn vị. Phiên cũ giữ chính sách cũ tới hết đợt; không đổi quà Lucky đã lưu hoặc tiến độ.

---

## 4. Hệ thống Vật phẩm Đặc biệt & Kỹ năng (Unique Items & Power-ups)

Các vật phẩm được tích hợp trực tiếp vào hệ thống tiền tệ Xu và Cửa hàng:

| Vật phẩm                               | Icon SVG | Chức năng chi tiết                                                                                    | Giá (Xu) |
| :------------------------------------- | :------: | :---------------------------------------------------------------------------------------------------- | :--------------: |
| **Kính Định Vị (Smart Hint)**          | `search`  | Tự động vẽ vệt sáng chỉ rõ đường nối của 1 cặp thẻ có thể ghép ngay.                                  |       58 Xu       |
| **Xáo Trộn Không Gian (Reshuffle)**    | `restart` | Xáo lại toàn bộ vị trí các thẻ còn lại trên bàn cờ để tạo đường nối mới.                              |      108 Xu       |
| **Sấm Sét Hủy Diệt (Thunder Strike)**  | `wand`    | Tự động chọn và tiêu diệt ngay 1~3 cặp thẻ bất kỳ mà không cần đường nối.                             |      180 Xu       |
| **Đồng Hồ Ngưng Đọng (Chrono Freeze)** | `timer`   | Đóng băng đồng hồ đếm ngược trong 30 giây để người chơi thoải mái quan sát.                           |      288 Xu       |

---

## 5. Tận dụng Thẻ Đặc Biệt (Special Cards Integration)

Mỗi chủ đề có 5 thẻ đặc biệt ở thư mục `special/`. Khi xuất hiện trong chế độ Link Connect:

- **Nhận diện:** chỉ dùng viền phát sáng theo màu loại thẻ cao cấp, không gắn huy hiệu che hình. Ô may mắn dùng viền tím; băng dùng vệt lau sương từ trên xuống và không tạo hạt băng.
- **Hiệu ứng thưởng:** năng lượng, Xu và vật phẩm hỗ trợ rơi quanh vị trí ghép rồi bay về đúng HUD/công cụ bằng `transform` và `opacity`; phần tử tạm tự dọn sau hoạt ảnh và không khóa bàn.

---

## 6. Trạng thái triển khai & phạm vi

1. **Lõi trò chơi:** Thuật toán nối tối đa hai lần rẽ, vùng đệm ngoài biên, bàn cờ ma trận và tự phát hiện ngõ cụt.
2. **Bàn có dịch chuyển:** Đã có toàn bộ các nhóm ở mục 3, dùng lại phần tử thẻ theo `instanceId`, hoạt ảnh FLIP và kiểm tra nước đi sau dịch chuyển.
3. **Gameplay & giao diện:** Chủ đề ảnh dùng chung, HUD, điểm, combo, thời gian, Xu, popup đầu/cuối màn và bố cục responsive cho mobile.
4. **Vật phẩm & thẻ đặc biệt:** Gợi ý, xáo trộn, sấm sét, đóng băng thời gian, thẻ đặc biệt, thẻ đóng băng, mốc thưởng và chế độ Thử thách.
5. **Cột mốc level 100:** Sau khi hoàn thành level 100 trên web, bảng tổng kết hiển thị nút `Congratulations!`; chọn nút này mở cảnh bông hoa chiến thắng ở cả Memory Match và Link Connect.

### Chủ động không triển khai trong phạm vi này

- Đá, cổng không gian và các chướng ngại khác.
- 100 màn Adventure có hình bàn riêng, Time Rush và Zen Mode.
- Fever ×5, hạt nổ, Fever FX, nhạc tăng nhịp và hiệu ứng xáo “xoáy” với ràng buộc ba nước đi.

## Quà sưu tập theo nhóm — cập nhật30/10/2026

Mỗi nhóm ghép thủ công hợp lệ thử ba nguồn độc lập: nhóm thường có5%
nhận1chữ,2% nhận1vé quay và6% nhận1huy hiệu thu thập; nhóm đặc biệt/
Lucky/Nam châm có25%/10%/30% tương ứng. Có thể nhận nhiều loại cùng
lượt hoặc không nhận loại nào. Nhiều dấu đặc biệt vẫn chỉ tính một nhóm;
thẻ thường trúng quà không trở thành thẻ đặc biệt. Chữ chọn đều17loại,
bán10Xu/chữ; vé và huy hiệu tích lũy. Giữ tỷ lệ năng lượng/hỗ trợ và
quà mốc hiện hành. Phá phụ không rơi thêm; retry/undo/restore không bốc
lại nhóm đã xử lý. Quà lưu cùng tiến độ trước khi hiện hiệu ứng.

Rương ngoại hình giữ20% nhánh ngoại hình, chọn đều trong món chưa có
đúng loại; đủ bộ đổi thẳng100Xu. Nhánh Xu/hỗ trợ và Rương C giữ nguyên.
Nếu món quà đã được chọn trước đó nay đã có, đổi100Xu; không chọn lại.
Candidate/receipt cũ vẫn tương thích; không tự trang bị hoặc xóa kho cũ.
