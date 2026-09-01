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
   - Khi ghép đúng, một vệt sáng neon phát quang (màu ngọc lam hoặc vàng ánh kim) vẽ lướt qua chính xác lộ trình nối, 2 thẻ phát nổ hạt ánh sáng và biến mất để lại ô trống.

```text
  [A] ──── [A]             [A] ─────┐              ┌─────── [A]
 (0 khúc gấp - Thẳng)               │              │
                                   [A]             └─────── [A]
                           (1 khúc gấp - Chữ L)    (2 khúc gấp - Chữ U / Z)
```

---

## 3. Các Cơ chế Bàn cờ Động & Môi trường Tương tác (Dynamic Board Mechanics)

Để tạo sự đột phá và đa dạng qua từng màn chơi, hệ thống hỗ trợ 6 cơ chế biến chuyển bàn cờ:

### A. Cơ chế Dồn thẻ (Gravity Shifts)

Sau khi một cặp thẻ bị loại bỏ, bàn cờ có thể kích hoạt hiệu ứng dịch chuyển:

1. **Bàn cờ Tĩnh (Classic Static):** Ô ăn xong để trống cố định.
2. **Rơi tự do (Gravity Down):** Các thẻ ở phía trên tự động rơi xuống lấp đầy các khoảng trống bên dưới.
3. **Dồn lên trên (Gravity Up):** Các thẻ bên dưới tự động trượt nổi lên trên.
4. **Dồn sang bên (Gravity Left / Right):** Thẻ tự động trượt dồn về phía cạnh trái hoặc cạnh phải bàn cờ.
5. **Hút vào tâm (Center Pull):** Thẻ ở 4 phía tự động trượt hút về tâm bàn cờ.
6. **Tách đôi ra biên (Split Push):** Nửa trên dồn lên, nửa dưới dồn xuống từ giữa tim bàn cờ.
7. **Thẻ tráo đổi vị trí (Swap):** Khi 2 thẻ bị loại bỏ, các thẻ xung quanh sẽ tráo đổi vị trí với nhau.
8. **Tách đôi ra trái/phải:** Nửa trái dồn sang trái, nửa phải dồn sang phải.
9. **Xoay tròn:** Các thẻ xoay tròn theo chiều kim đồng hồ hoặc ngược chiều kim đồng hồ.

### B. Các Chướng ngại vật & Ô tương tác đặc biệt

1. **Ghép đủ bộ 3:** Khi ghép đủ 3 cặp thẻ đặc biệt sẽ mở khóa 1 thẻ bị đóng băng (nếu có).
2. **Ghép cặp đặc biệt:** Khi ghép được 1 cặp thẻ đặc biệt sẽ đồng thời phá hủy 1 cặp thẻ bất kì.
3. **Ghép đủ bộ 5:** Khi ghép đủ 5 cặp thẻ đặc biệt sẽ biến 1 cặp thẻ bất kì thành 1 cặp thẻ đặc biệt.
4. **Ghép đủ bộ 7:** Khi ghép đủ 7 cặp thẻ đặc biệt sẽ nhận 1 trong các hiệu ứng: Thêm thời gian, thêm 1 lượt gợi ý, thêm 1 lượt xáo trộn.
5. **Ghép đủ bộ 9:** Khi ghép đủ 9 cặp thẻ đặc biệt sẽ nhận 1 trong các hiệu ứng: Mở khóa 1 thẻ đóng băng, phá hủy 1 cặp thẻ bất kì.
6. **Ghép đủ bộ 10:** Khi ghép đủ 10 cặp thẻ đặc biệt, nhận 100 xu đồng thời phá hủy tất cả thẻ đóng băng, tạo 1 cặp thẻ đặc biệt ngẫu nhiên và phá hủy 1 cặp thẻ ngẫu nhiên.

- Các bộ thẻ có thể tích lũy qua các màn chơi. Ví dụ: Màn 1 ghép được 3 thẻ, màn 2 ghép được 2 thẻ => Tổng cộng 5 thẻ, sẽ nhận được hiệu ứng của bộ 5. Đến đủ mốc 10 thì sẽ reset lại từ 1.

---

## 4. Hệ thống Vật phẩm Đặc biệt & Kỹ năng (Unique Items & Power-ups)

Các vật phẩm được tích hợp trực tiếp vào hệ thống tiền tệ Xu và Cửa hàng:

| Vật phẩm                               | Biểu tượng | Chức năng chi tiết                                                                                    | Giá dự kiến (Xu) |
| :------------------------------------- | :--------: | :---------------------------------------------------------------------------------------------------- | :--------------: |
| **Kính Định Vị (Smart Hint)**          |     🔍     | Tự động vẽ vệt sáng chỉ rõ đường nối của 1 cặp thẻ có thể ghép ngay.                                  |       8 Xu       |
| **Xáo Trộn Không Gian (Reshuffle)**    |     🔀     | Xáo lại toàn bộ vị trí các thẻ còn lại trên bàn cờ, cam kết luôn tạo ra ít nhất 3 đường nối khả dụng. |      15 Xu       |
| **Sấm Sét Hủy Diệt (Thunder Strike)**  |     ⚡     | Tự động chọn và tiêu diệt ngay 1~3 cặp thẻ bất kỳ mà không cần đường nối.                             |      25 Xu       |
| **Đồng Hồ Ngưng Đọng (Chrono Freeze)** |     ⏱️     | Đóng băng đồng hồ đếm ngược trong 10 giây để người chơi thoải mái quan sát.                           |      20 Xu       |

---

## 5. Tận dụng Thẻ Đặc Biệt (Special Cards Integration)

Mỗi chủ đề có 5 thẻ đặc biệt ở thư mục `special/`. Khi xuất hiện trong chế độ Link Connect:

- **Hiệu ứng nổi bật:** Viền thẻ phát sáng lấp lánh ánh kim/ngọc dạ quang.
- **Kích hoạt Siêu Phần Thưởng khi ghép trúng cặp thẻ đặc biệt:**
  - _Cộng thưởng:_ Cộng thời gian hoặc Xu.

---

## 6. Các Chế độ Chơi Con (Sub-game Modes)

1. **Chế độ Hành Trình Vượt Ải (Adventure Quest):**
   - Gồm 100 màn chơi với bàn cờ tạo hình học nghệ thuật (hình trái tim, hình ngôi sao, kim tự tháp, chữ thập...).
   - Mỗi màn kết hợp một kiểu dồn trọng lực hoặc chướng ngại vật khác nhau.
2. **Chế độ Cuồng Nhiệt Thời Gian (Time Rush):**
   - Khởi đầu với 45 giây; mỗi cặp ghép đúng cộng thêm `+2s` đến `+5s`.
   - Mục tiêu duy trì tốc độ ghép tối đa để sống sót qua nhiều đợt dọn bàn cờ nhất có thể.
3. **Chế độ Thiền Định Thư Giãn (Zen Mode):**
   - Hoàn toàn không giới hạn thời gian, không có áp lực thua cuộc, kết hợp nhạc nền nhẹ nhàng.
4. **Chế độ Bão Thẻ Sinh Tồn (Endless Rising):**
   - Cứ mỗi 20 giây, bàn cờ tự động đẩy thêm 1 hàng thẻ mới từ dưới lên. Nếu thẻ bị đẩy chạm nóc trên cùng thì ván chơi kết thúc.

---

## 7. Hệ thống Combo & Trạng thái Quá Tải (Fever Mode)

- **Chuỗi Combo:** Ghép thành công cặp tiếp theo trong vòng **2.5 giây** sẽ tăng cấp Combo (`x2`, `x3`, `x4`...).
- **Trạng thái Quá Tải (Fever Mode):**
  - Khi đạt chuỗi **Combo x5**, toàn màn hình kích hoạt hiệu ứng ánh sáng rực rỡ trong 8 giây:
    - Điểm số và Xu nhận được nhân đôi (x2).
    - Mọi đường nối đổi sang màu lửa cầu vồng rực sáng.
    - Nhạc nền tăng tiết tấu vui nhộn, tạo cảm giác vô cùng phấn khích.

---

## 8. Kiến trúc Kỹ thuật & Lộ trình Triển khai (Technical Blueprint)

### A. Cấu trúc Module đề xuất:

```text
js/
├── linkConnect/
│   ├── pathfinder.js       # Thuật toán tìm đường trực giao tối đa 2 khúc gấp (BFS 2-turn)
│   ├── linkBoard.js        # Khởi tạo ma trận bàn cờ, xử lý viền đệm và trọng lực
│   ├── linkRenderer.js     # Vẽ đường nối canvas/SVG neon và hiệu ứng hạt nổ
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
- Nếu không còn cặp nào nối được, hệ thống tự động chạy hiệu ứng xoay lốc xoáy và xáo bài miễn phí (Smart Auto-Reshuffle) mà không làm gián đoạn ván chơi của người dùng.

---

## 9. Kế hoạch từng giai đoạn (Implementation Roadmap)

1. **Giai đoạn 1 (Core Engine):** Xây dựng module thuật toán `pathfinder.js`, bàn cờ ma trận cơ bản, kiểm tra 0-1-2 khúc gấp và vẽ vệt sáng kết nối.
2. **Giai đoạn 2 (Gameplay & UI):** Nối module với `themeCatalog.js`, tạo giao diện HUD Link Connect, hệ thống tính điểm, combo và timer.
3. **Giai đoạn 3 (Vật phẩm & Trọng lực):** Tích hợp vật phẩm (Gợi ý, Xáo bài, Sấm sét) và các cơ chế dồn thẻ trọng lực.
4. **Giai đoạn 4 (Chướng ngại vật & Màn chơi):** Thêm ô băng giá, khối đá, cổng không gian và xây dựng hệ thống 100 màn chơi Adventure.
5. **Giai đoạn 5 (Âm thanh, FX & Đánh bóng):** Hoàn thiện âm thanh zap laser, hiệu ứng Fever mode và tối ưu hóa hiệu năng trên thiết bị di động.
