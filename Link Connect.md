# Quy tắc & Thiết kế — Link Connect

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

- Thẻ cao cấp không bắt buộc xuất hiện ở mọi màn. Tỷ lệ/số cặp theo kích thước bàn: tối đa 8 cặp là 60% có 1 cặp; 9–15 cặp là 70% có 1–2 cặp; từ 16 cặp là 80% có 2–3 cặp.
- Số cặp băng: tối đa 8 cặp có 1; 9–15 có 2; 16–24 có 3; từ 25 có 4. Nếu chỉ còn băng hoặc không còn nước đi với thẻ mở, hệ thống mở đồng thời số băng cần thiết để tránh kẹt màn.
- Ba loại thẻ cao cấp: **Cyan – Phá Băng** luôn mở một cặp băng (hết băng thì nhận ngẫu nhiên Xu hoặc thời gian); **Xanh dương – Tiếp Tế** có 50% nhận Gợi ý, Xáo trộn hoặc Đóng băng thời gian; **Đỏ – Bùng Nổ** có 50% gọi Sấm sét phá một cặp thường. Sấm sét từ thẻ cao cấp tiếp tục combo; Sấm sét từ vật phẩm không tăng combo.
- Mỗi cặp cao cấp có cơ hội rơi một năng lượng. Trong giai đoạn kiểm thử tỷ lệ đang là 100%; cấu hình phát hành dự kiến là 20%, bảo hiểm rơi ở lần thứ 10 sau 9 lần trượt.
- Tiến trình năng lượng giữ xuyên các level, khi thua/Chơi lại và khi quay Menu rồi Tiếp tục; chỉ reset khi chọn **Chơi mới**. Sau mốc 10, tiến trình quay về đầu và lặp vòng thưởng. Năng lượng được tính ngay lúc rơi ra bàn; hiệu ứng thu thập bay vào thanh mốc nhưng không khóa thao tác.
- Có đủ 10 mốc thưởng: phá cặp thường, Xu, thời gian, Gợi ý, Xáo trộn, Đóng băng thời gian và mở băng theo cấu hình tập trung. Thưởng phá cặp vẫn xử lý được cặp cuối để hoàn thành màn; không chọn băng, thẻ cao cấp hoặc ô may mắn.

---

## 4. Hệ thống Vật phẩm Đặc biệt & Kỹ năng (Unique Items & Power-ups)

Các vật phẩm được tích hợp trực tiếp vào hệ thống tiền tệ Xu và Cửa hàng:

| Vật phẩm                               | Icon SVG | Chức năng chi tiết                                                                                    | Giá (Xu) |
| :------------------------------------- | :------: | :---------------------------------------------------------------------------------------------------- | :--------------: |
| **Kính Định Vị (Smart Hint)**          | `search`  | Tự động vẽ vệt sáng chỉ rõ đường nối của 1 cặp thẻ có thể ghép ngay.                                  |       8 Xu       |
| **Xáo Trộn Không Gian (Reshuffle)**    | `restart` | Xáo lại toàn bộ vị trí các thẻ còn lại trên bàn cờ để tạo đường nối mới.                              |      15 Xu       |
| **Sấm Sét Hủy Diệt (Thunder Strike)**  | `wand`    | Tự động chọn và tiêu diệt ngay 1~3 cặp thẻ bất kỳ mà không cần đường nối.                             |      25 Xu       |
| **Đồng Hồ Ngưng Đọng (Chrono Freeze)** | `timer`   | Đóng băng đồng hồ đếm ngược trong 10 giây để người chơi thoải mái quan sát.                           |      20 Xu       |

---

## 5. Tận dụng Thẻ Đặc Biệt (Special Cards Integration)

Mỗi chủ đề có 5 thẻ đặc biệt ở thư mục `special/`. Khi xuất hiện trong chế độ Link Connect:

- **Nhận diện:** chỉ dùng viền phát sáng theo màu loại thẻ cao cấp, không gắn huy hiệu che hình. Ô may mắn dùng viền tím; băng dùng vệt lau sương từ trên xuống và không tạo hạt băng.
- **Hiệu ứng thưởng:** năng lượng, Xu và vật phẩm hỗ trợ rơi quanh vị trí ghép rồi bay về đúng HUD/công cụ bằng `transform` và `opacity`; phần tử tạm tự dọn sau hoạt ảnh và không khóa bàn.

---

## 6. Trạng thái triển khai & phạm vi

1. **Lõi trò chơi:** Thuật toán nối tối đa hai lần rẽ, vùng đệm ngoài biên, bàn cờ ma trận và tự phát hiện ngõ cụt.
2. **Bàn cờ động:** Đã có toàn bộ các nhóm ở mục 3, dùng lại phần tử thẻ theo `instanceId`, hoạt ảnh FLIP và kiểm tra nước đi sau dịch chuyển.
3. **Gameplay & giao diện:** Chủ đề ảnh dùng chung, HUD, điểm, combo, thời gian, Xu, popup đầu/cuối màn và bố cục responsive cho mobile.
4. **Vật phẩm & thẻ đặc biệt:** Gợi ý, xáo trộn, sấm sét, đóng băng thời gian, thẻ đặc biệt, thẻ đóng băng, mốc thưởng và chế độ Thử thách.

### Chủ động không triển khai trong phạm vi này

- Đá, cổng không gian và các chướng ngại khác.
- 100 màn Adventure có hình bàn riêng, Time Rush và Zen Mode.
- Fever ×5, hạt nổ, Fever FX, nhạc tăng nhịp và hiệu ứng xáo “xoáy” với ràng buộc ba nước đi.
