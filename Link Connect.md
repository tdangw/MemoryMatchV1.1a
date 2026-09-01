# Kế hoạch & Thiết kế Chế độ chơi: Link Connect (Lộ Tuyến Quang Học)

Tài liệu này là bản phân tích toàn diện và kế hoạch thiết kế cho chế độ chơi mới **Link Connect** (ghép nối lộ trình không vật cản). Chế độ này vận hành song song với chế độ truyền thống **Memory Match** (lật thẻ luyện trí nhớ), dùng chung toàn bộ kho tài nguyên 25 chủ đề ảnh 3D và hệ thống kinh tế trong game.

---

## 1. Tổng quan & Tầm nhìn thiết kế (Design Vision)

| Tiêu chí               | Memory Match (Hiện tại)                        | Link Connect (Chế độ mới)                                                       |
| :--------------------- | :--------------------------------------------- | :------------------------------------------------------------------------------ |
| **Trạng thái thẻ**     | Ẩn mặt (úp thẻ)                                | **Mở ngửa toàn bộ thẻ ngay từ đầu**                                             |
| **Mục tiêu cốt lõi**   | Rèn luyện **trí nhớ ngắn hạn** và sự tập trung | Rèn luyện **khả năng quan sát nhanh, phản xạ mắt** và tư duy đường đi trực giao |
| **Luật ghép đôi**      | Lật trúng 2 thẻ giống nhau ở bất kỳ đâu        | Ghép 2 thẻ giống nhau có **đường nối hợp lệ không bị cản**                      |
| **Nhịp độ chơi**       | Cẩn trọng, ghi nhớ vị trí, tính toán lật mở    | Nhanh, dồn dập, tạo chuỗi combo liên hoàn cực kỳ thỏa mãn (satisfying)          |
| **Tài nguyên sử dụng** | 25 chủ đề ảnh 3D + 1000 ảnh default            | **Tái sử dụng 100% tài nguyên ảnh 3D và hệ thống Shop/Xu**                      |

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

### Cơ chế dồn thẻ — Gravity Shifts

Đây là cơ chế gameplay riêng, không phải hiệu ứng thẻ biến mất trong Bộ sưu tập. Sau khi một cặp thẻ bị loại bỏ, bàn cờ có thể dịch chuyển các thẻ còn lại theo quy tắc của màn, rồi tính lại các đường nối hợp lệ.

1. **Bàn cờ tĩnh — Classic Static:** Ô ghép xong để trống cố định.
2. **Rơi tự do — Gravity Down:** Thẻ phía trên rơi xuống lấp khoảng trống bên dưới.
3. **Dồn lên trên — Gravity Up:** Thẻ phía dưới trượt lên lấp các vị trí phía trên.
4. **Dồn sang bên — Gravity Left / Right:** Thẻ trượt dồn về cạnh trái hoặc cạnh phải bàn cờ.
5. **Hút vào tâm — Center Pull:** Thẻ từ bốn phía trượt về tâm bàn cờ.
6. **Tách đôi ra biên dọc — Split Push:** Nửa trên dồn lên, nửa dưới dồn xuống từ tâm bàn cờ.
7. **Tráo đổi vị trí — Swap:** Khi một cặp bị loại bỏ, các thẻ xung quanh tráo đổi vị trí với nhau.
8. **Tách đôi ra biên ngang:** Nửa trái dồn sang trái, nửa phải dồn sang phải.
9. **Xoay tròn — Rotation:** Các thẻ xoay theo chiều kim đồng hồ hoặc ngược chiều kim đồng hồ.

#### Đã triển khai

- **Tĩnh, Dồn xuống, Dồn lên, Dồn trái và Dồn phải**. Các thẻ chuyển động bằng hoạt ảnh dịch vị; trạng thái thẻ (đặc biệt, băng và phần thưởng) đi theo chính thẻ, không theo ô cũ.
- Phân bổ cấp độ, áp dụng cho mọi chế độ: **1–2 Tĩnh; 3–5 Dồn xuống; 6–8 Dồn lên; 9–12 luân phiên Dồn trái/phải; từ 13 ngẫu nhiên một trong bốn hướng cơ bản**. Hướng đã chọn được lưu cùng phiên đang chơi để không đổi khi tiếp tục màn.
- Sau popup giới thiệu màn, màn động dùng popup chung **Quy tắc màn chơi** để nói rõ hướng dịch chuyển. Popup không dùng banner/toast riêng và chỉ bắt đầu đếm giờ khi người chơi đóng popup.
- Sau dịch chuyển hoặc Sấm sét xóa cặp, hệ thống kiểm tra nước đi; nếu cần sẽ xáo các thẻ còn lại.

#### Chờ triển khai sau

- **Hút vào tâm, Tách đôi dọc, Tráo đổi, Tách đôi ngang và Xoay tròn.** Chỉ mở từng loại khi đã có thuật toán bảo toàn cặp, hoạt ảnh rõ ràng và kiểm thử với cặp băng, thẻ đặc biệt, Sấm sét cùng các bàn nhiều cột.

### Thẻ đặc biệt và thẻ đóng băng

1. **Ghép đủ bộ 3:** Khi ghép đủ 3 cặp thẻ đặc biệt sẽ mở khóa 1 cặp thẻ đóng băng (nếu có).
2. **Ghép cặp đặc biệt:** Mỗi màn luôn có ít nhất 1 cặp thẻ đặc biệt. Khi ghép được cặp này, cặp thẻ đóng băng trong màn sẽ được mở khóa; đồng thời phá hủy 1 cặp thẻ bất kì.
3. **Ghép đủ bộ 5:** Khi ghép đủ 5 cặp thẻ đặc biệt sẽ biến 1 cặp thẻ bất kì thành 1 cặp thẻ đặc biệt.
4. **Ghép đủ bộ 7:** Khi ghép đủ 7 cặp thẻ đặc biệt sẽ nhận 1 trong các hiệu ứng: Thêm thời gian, thêm 1 lượt gợi ý, thêm 1 lượt xáo trộn.
5. **Ghép đủ bộ 9:** Khi ghép đủ 9 cặp thẻ đặc biệt sẽ nhận 1 trong các hiệu ứng: Mở khóa 1 cặp thẻ đóng băng, phá hủy 1 cặp thẻ bất kì.
6. **Ghép đủ bộ 10:** Khi ghép đủ 10 cặp thẻ đặc biệt, nhận 100 xu đồng thời phá hủy tất cả thẻ đóng băng, tạo 1 cặp thẻ đặc biệt ngẫu nhiên và phá hủy 1 cặp thẻ ngẫu nhiên.

- Các bộ thẻ có thể tích lũy qua các màn chơi. Ví dụ: Màn 1 ghép được 3 thẻ, màn 2 ghép được 2 thẻ => Tổng cộng 5 thẻ, sẽ nhận được hiệu ứng của bộ 5. Đến đủ mốc 10 thì sẽ reset lại từ 1.

---

## 4. Hệ thống Vật phẩm Đặc biệt & Kỹ năng (Unique Items & Power-ups)

Các vật phẩm được tích hợp trực tiếp vào hệ thống tiền tệ Xu và Cửa hàng:

| Vật phẩm                               | Icon SVG | Chức năng chi tiết                                                                                    | Giá dự kiến (Xu) |
| :------------------------------------- | :------: | :---------------------------------------------------------------------------------------------------- | :--------------: |
| **Kính Định Vị (Smart Hint)**          | `search`  | Tự động vẽ vệt sáng chỉ rõ đường nối của 1 cặp thẻ có thể ghép ngay.                                  |       8 Xu       |
| **Xáo Trộn Không Gian (Reshuffle)**    | `restart` | Xáo lại toàn bộ vị trí các thẻ còn lại trên bàn cờ để tạo đường nối mới.                              |      15 Xu       |
| **Sấm Sét Hủy Diệt (Thunder Strike)**  | `wand`    | Tự động chọn và tiêu diệt ngay 1~3 cặp thẻ bất kỳ mà không cần đường nối.                             |      25 Xu       |
| **Đồng Hồ Ngưng Đọng (Chrono Freeze)** | `timer`   | Đóng băng đồng hồ đếm ngược trong 10 giây để người chơi thoải mái quan sát.                           |      20 Xu       |

---

## 5. Tận dụng Thẻ Đặc Biệt (Special Cards Integration)

Mỗi chủ đề có 5 thẻ đặc biệt ở thư mục `special/`. Khi xuất hiện trong chế độ Link Connect:

- **Hiệu ứng nổi bật:** Viền thẻ phát sáng lấp lánh ánh kim/ngọc dạ quang.
- **Kích hoạt Siêu Phần Thưởng khi ghép trúng cặp thẻ đặc biệt:**
  - _Cộng thưởng:_ Cộng thời gian hoặc Xu.

---

## 6. Kiến trúc Kỹ thuật

### A. Cấu trúc Module đề xuất:

```text
js/
├── linkConnect/
│   ├── pathfinder.js       # Thuật toán tìm đường trực giao tối đa 2 khúc gấp (BFS 2-turn)
│   ├── linkBoard.js        # Khởi tạo ma trận bàn cờ và xử lý viền đệm
│   ├── linkRenderer.js     # Vẽ đường nối SVG neon và hiệu ứng tan thẻ
│   └── linkController.js   # Quản lý vòng đời màn chơi, combo, timer, deadlock check
```

### B. Thuật toán Tìm đường (2-Turn Orthogonal BFS):

```javascript
// Ý tưởng giải thuật tìm đường tối đa 2 khúc gấp:
function canConnect(startPos, endPos, grid) {
  // 1. Kiểm tra nối thẳng 0 khúc gấp (cùng hàng hoặc cột, không vật cản)
  if (checkStraightLine(startPos, endPos, grid))
    return [{ path: [startPos, endPos], turns: 0 }];

  // 2. Kiểm tra nối 1 khúc gấp (hình chữ L: đi qua 1 điểm trung gian)
  // 3. Kiểm tra nối 2 khúc gấp (hình chữ U/Z: quét theo tia trực giao từ 2 đầu đến khi gặp đường nối thẳng qua ô trống)
  // Trả về lộ trình các điểm tọa độ [p1, p2, p3, p4] để linkRenderer vẽ đường sáng.
}
```

### C. Tự động kiểm tra Ngõ Cụt (Deadlock Prevention):

- Sau mỗi nước đi, một hàm kiểm tra chạy ngầm (`hasAvailableMoves()`) sẽ quét nhanh xem còn ít nhất 1 cặp thẻ nào nối được không.
- Nếu không còn cặp nào nối được, hệ thống tự xáo bài miễn phí để ván chơi tiếp tục mà không làm gián đoạn người dùng.

---

## 7. Trạng thái triển khai & phạm vi

1. **Lõi trò chơi:** Thuật toán nối tối đa hai lần rẽ, vùng đệm ngoài biên, bàn cờ ma trận và tự phát hiện ngõ cụt.
2. **Bàn cờ động cơ bản:** Đã có Tĩnh/Dồn xuống/Dồn lên/Dồn trái/Dồn phải, hoạt ảnh dịch chuyển và kiểm tra nước đi. Nhóm quy tắc nâng cao ở mục 3 vẫn chờ thiết kế và kiểm thử riêng.
3. **Gameplay & giao diện:** Chủ đề ảnh dùng chung, HUD, điểm, combo, thời gian, Xu, popup đầu/cuối màn và bố cục responsive cho mobile.
4. **Vật phẩm & thẻ đặc biệt:** Gợi ý, xáo trộn, sấm sét, đóng băng thời gian, thẻ đặc biệt, thẻ đóng băng, mốc thưởng và chế độ Thử thách.

### Chủ động không triển khai trong phạm vi này

- Đá, cổng không gian và các chướng ngại khác.
- 100 màn Adventure có hình bàn riêng, Time Rush và Zen Mode.
- Fever ×5, hạt nổ, Fever FX, nhạc tăng nhịp và hiệu ứng xáo “xoáy” với ràng buộc ba nước đi.
