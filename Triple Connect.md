# Kế hoạch & Thiết kế — Triple Connect

## 1. Mục tiêu và phạm vi

**Triple Connect** là trò chơi thứ ba, độc lập với **Memory Match** và **Link Connect**. Người chơi tìm ba thẻ cùng hình trên bàn nhiều lớp. Thẻ được chọn bay vào khay dưới bàn; khi một bộ ba hoàn tất, ba thẻ tự nhóm sang trái, một đường hiệu ứng chạy ngang qua cả ba rồi áp dụng hiệu ứng xóa thẻ đang trang bị.

Trò chơi dùng chung hệ thống Xu, chủ đề ảnh, Bộ sưu tập hiệu ứng, âm thanh, HUD, modal và popup với hai game hiện tại. Chỉ dùng chung các hợp đồng giao diện/dữ liệu ổn định; trạng thái vòng chơi, controller, board và lưu tiến trình phải tách riêng để không gây lỗi chéo.

### Quyết định đã chốt

- Màn hình mobile dọc: HUD ở trên, bàn nhiều lớp ở giữa, khay ngang dưới bàn.
- Khay có 10 ô; 7 ô mở sẵn, 3 ô khóa. Mở rộng khay mở tạm cả 3 ô trong đúng ván hiện tại; chơi lại, bắt đầu ván mới hoặc sang màn sẽ trở về 7 ô.
- Chỉ thẻ lộ hoàn toàn trên lớp cao nhất mới có thể chọn. Các lớp sau được lệch nhẹ để người chơi nhìn được thẻ bên dưới.
- Khay luôn tự dồn trái và tự nhóm các thẻ cùng loại. Khi đủ đúng 3 thẻ, game ưu tiên xóa bộ ba trước khi xét khay đầy.
- Điều kiện thắng: xóa sạch board. Điều kiện thua: cả 7 ô mở sẵn đều đầy và không có bộ ba nào vừa hoàn thành.
- Vô tận đếm thời gian xuôi, chơi thư giãn và qua level liên tiếp. Các mode khác đếm ngược theo mốc thời gian chung hiện có.

## 2. Vòng lặp gameplay

1. Người chơi chỉ chạm được một thẻ đang lộ hoàn toàn.
2. Thẻ rời board và bay xuống khay; khay sắp lại các nhóm từ trái sang phải.
3. Nếu khay có đủ ba thẻ cùng loại, ba thẻ được kéo thành một hàng liền nhau ở phía trái khay.
4. Renderer vẽ line từ thẻ thứ nhất đến thẻ thứ ba, đi qua thẻ giữa; sau đó chạy hiệu ứng xóa thẻ đang trang bị.
5. Game cộng điểm, cập nhật combo, tiến trình và kiểm tra thắng. Các thẻ bị che bởi thẻ vừa chọn sẽ được mở ra để tiếp tục chơi.
6. Nếu không tạo bộ ba, game cập nhật khay; khi đạt 7 thẻ, game kết thúc theo luồng thua dùng chung.

### Combo và lượt sai

- Thẻ đầu của một loại bắt đầu chuỗi, không tạo combo.
- Chỉ khi hoàn tất nguyên một bộ ba liên tiếp mới tăng combo và cộng điểm.
- Nếu đang gom một loại mà người chơi chọn loại khác trước khi đủ ba, đó là một **Miss**, combo về 0; thẻ mới vẫn vào khay và được tự nhóm.
- Ví dụ: `A-A-A → B-B-B` tạo combo 2. `A-A-A → B-B-A` tính Miss ở A; nhóm B vẫn ở khay để hoàn thành sau.
- Mỗi bộ ba là một match. Điểm dùng công thức Link Connect: `10 + (combo − 1) × 3` khi hoàn tất bộ ba. Sao xét trên tổng số bộ ba đã xóa; mốc cụ thể sẽ tinh chỉnh sau khi thử bàn nhiều lớp.

## 3. Board nhiều lớp và tính khả thi

### Trình bày

- Board là các vị trí cố định, xếp thành 2–5 lớp. Lớp sau lệch nhỏ theo trục X/Y và nằm dưới lớp trước.
- Một thẻ chỉ tương tác được nếu không bị thẻ nào phủ lên vùng chọn của nó. Thẻ bị che vẫn lộ đủ ảnh/viền để người chơi lập kế hoạch, nhưng không nhận chạm.
- Thẻ được Hoàn tác trở về đúng vị trí/lớp lúc rời board; nếu ô đó bị che, thẻ được đặt lên trên cùng tại vị trí ấy để vẫn có thể chọn lại.

### Sinh màn có lời giải — yêu cầu bắt buộc

Không xếp board ngẫu nhiên hoàn toàn. Cách phù hợp cho trò Triple là **solution-first + solver validation**:

1. Tạo số bộ ba theo mode và tạo một thứ tự xóa hợp lệ.
2. Phân bố bộ ba theo thứ tự ngược lên các lớp: các thẻ cần xóa sớm phải lộ trước; việc xóa chúng sẽ giải phóng dần các thẻ ở lớp sâu hơn.
3. Chạy solver mô phỏng khay 7 ô, quy tắc lộ thẻ và chuỗi xóa bộ ba để xác nhận ít nhất một đường thắng không cần vật phẩm.
4. Nếu không đạt, sinh lại bố cục trước khi hiển thị. Không “sửa” board đang chơi bằng cách xóa/gán thẻ bí mật.

Cách này tốt hơn việc chỉ tạo một chuỗi mẫu vì vẫn cho phép bố cục, chủ đề và thứ tự mở thẻ đa dạng, đồng thời không tạo màn bất khả thi.

### Xáo thẻ

- Vật phẩm xáo lại phân bố **toàn bộ thẻ còn lại trên mọi lớp**, nhưng giữ số lớp và số thẻ mỗi lớp phù hợp với màn.
- Sau xáo, xóa lịch sử Hoàn tác vì vị trí cũ không còn hợp lệ.
- Bố cục sau xáo cũng phải qua solver trước khi render.

## 4. Chế độ chơi

| Chế độ | Thẻ | Bộ ba | Lớp | Thời gian | Ghi chú |
| --- | ---: | ---: | ---: | --- | --- |
| Dễ | 12 | 4 | 2 | 60 giây | Nhịp làm quen. |
| Trung bình | 24 | 8 | 3 | 90 giây | Tăng loại hình và lớp. |
| Khó | 36 | 12 | 4 | 120 giây | Cần theo dõi thẻ bị che. |
| Siêu khó | 60 | 20 | 5 | 180 giây | Board dày và khay dễ bị áp lực. |
| Vô tận | 60 | 20 | 5 | Đếm xuôi | Clear board để sang level tiếp; thưởng Xu cố định, không mua/thêm thời gian. |
| Thử thách | 12 → 48 | 4 → 16 | 2 → 5 | 60 giây + thời gian cấp | Tăng theo dãy `12, 18, 24, 30, 36, 42, 48`; có thẻ may mắn. |

Mốc thời gian ban đầu đồng bộ với hai game và chỉ được điều chỉnh sau khi có dữ liệu thử nghiệm thực tế.

## 5. HUD và giao diện

### Bố cục dọc

1. **HUD tiến trình trên:** Moves, Miss, Combo, thanh 3 sao, Điểm, tiến trình bộ ba `1 / 12`, Gợi ý.
2. **Thanh thao tác:** Menu, Level, Thời gian, tổng sao, nút Công cụ.
3. **Board nhiều lớp:** tự co theo chiều cao còn lại, không tràn vùng chơi mobile.
4. **Khay ngang:** 10 vị trí ở dưới board; 7 ô hoạt động, 3 ô khóa có biểu tượng mở rộng.

Màu, typography, icon, modal, popup đầu màn/tổng kết/hết giờ và timer bar dùng đúng hệ component hiện có. Popup giới thiệu riêng xuất hiện tại level đầu của mỗi độ khó để giải thích: chỉ chọn thẻ lộ hoàn toàn, gom đủ ba để xóa, và khay đầy sẽ thua.

### Hiệu ứng dùng chung

- Cấu hình line đã trang bị được tái sử dụng với adapter ba điểm trên khay: đầu thẻ 1 → qua thẻ 2 → cuối thẻ 3.
- Cấu hình xóa thẻ đã trang bị chạy trên cả ba thẻ sau khi line hoàn thành.
- Tái dùng âm thanh chọn, ghép đúng, Miss, thưởng, cảnh báo, thắng/thua và nhạc nền. Không tạo âm thanh riêng trước khi có yêu cầu nội dung mới.

## 6. Vật phẩm và thẻ may mắn

Các vật phẩm của Triple Connect có tồn kho, cân bằng giá và controller riêng; UI danh sách/vật phẩm, Xu, popup mua và hạ tầng Shop được tái sử dụng.

| Vật phẩm | Hành vi đã chốt | Ghi chú |
| --- | --- | --- |
| Hoàn tác | Trả thẻ chọn gần nhất từ khay về board; dùng nhiều lần theo số lượng sở hữu. | Không phải xóa vĩnh viễn thẻ. |
| Gợi ý | Ưu tiên chỉ thẻ lộ trùng với thẻ trong khay; nếu khay có đúng một thẻ lẻ, chỉ hai thẻ còn lại của bộ ba. | Không tự chọn hoặc tự xóa. |
| Xáo thẻ | Xáo mọi thẻ còn lại trên mọi lớp, sau khi solver xác nhận board mới. | Xóa lịch sử Hoàn tác. |
| Mở rộng khay | Mở tạm ba ô khóa cho hết ván. | Không lưu sang ván/màn tiếp theo. |
| Thêm thời gian | Dùng cơ chế mua/thêm thời gian chung. | Không dùng trong Vô tận. |

Trong Thử thách, thẻ may mắn có thể thưởng `+thời gian`, `+gợi ý` hoặc `+Xu`; được thể hiện như một thẻ trong bộ ba và dùng popup phần thưởng chung.

Thẻ đặc biệt, thẻ đóng băng và các luật độ khó bổ sung được hoãn sang giai đoạn sau. Chúng phải được thiết kế lại theo bộ ba, không sao chép trực tiếp luật theo cặp của Link Connect.

## 7. Cô lập kỹ thuật và tái sử dụng chung

### Module mới

```text
js/tripleConnect/
├── tripleConfig.js       # mode, layer, scoring, thời lượng và tuning riêng
├── tripleState.js        # trạng thái round độc lập, roundId và khay
├── tripleBoard.js        # slot/layer, lộ thẻ, generator và solver
├── tripleRenderer.js     # board lớp, khay, line ba thẻ và animation
├── tripleItems.js        # tồn kho/hiệu ứng vật phẩm riêng
└── tripleController.js   # vòng đời màn, timer, HUD, win/lose và session
```

### Thành phần tái sử dụng

- `appearance.js`, `themeCatalog.js`, Xu và persistence chung.
- `modal.js`, `ui.js`, popup đầu/tổng kết/hết giờ, cài đặt, âm thanh và responsive shell.
- Catalog/renderer hiệu ứng line và xóa thẻ qua interface chung, không copy danh sách hiệu ứng.
- Shop/Bộ sưu tập dùng tab hoặc adapter theo game; quyền sở hữu effect/theme không nhân đôi.

### Nguyên tắc chống lỗi chéo

- Không import hoặc ghi trực tiếp `gameState`/`linkGameState` để làm state Triple; Triple có `tripleGameState` và `roundId` riêng.
- Session, item inventory và level progress có namespace `triple-connect` riêng trong `localStorage`.
- Component dùng chung chỉ nhận dữ liệu qua tham số/callback; không chứa nhánh logic Triple trong Memory hoặc Link controller.
- Kiểm tra tĩnh và test board/solver Triple được thêm vào `npm run check` trước khi mở game trong menu chính.

## 8. Lộ trình triển khai

### Giai đoạn 1 — Vertical slice lõi

1. Thêm game Triple Connect vào màn chọn game, navigation, session namespace và theme dùng chung.
2. Làm `tripleState`, board 2 lớp 12 thẻ và renderer board/khay dọc mobile.
3. Cài luật chọn thẻ lộ, bay xuống khay, tự nhóm, bộ ba, Miss/combo/điểm và win/lose.
4. Adapter line/xóa ba thẻ với hiệu ứng đang trang bị.
5. Tạo generator solution-first và solver; thêm kiểm thử cases board/khoang khay.

### Giai đoạn 2 — Đồng bộ trải nghiệm

1. Tái dùng HUD, timer, sao, popup đầu màn/tổng kết/hết giờ, pause và âm thanh.
2. Hoàn thiện responsive: board/khay không tràn màn hẹp, animation không che HUD.
3. Thêm sáu mode và cấu hình bảng ở mục 4.
4. Thêm Thử thách, thẻ may mắn và Vô tận theo luật đã chốt.

### Giai đoạn 3 — Vật phẩm và cân bằng

1. Hoàn tác, Gợi ý, Xáo thẻ, Mở rộng khay và Thêm thời gian.
2. Nối Shop/collection, giá Xu, tồn kho và UI Công cụ.
3. Cân bằng mốc sao, phần thưởng Xu, thời gian, mật độ lớp và tần suất thẻ may mắn bằng test thực tế.

### Giai đoạn 4 — Mở rộng có kiểm soát

1. Thiết kế bộ ba thẻ đặc biệt và thẻ băng riêng cho Triple Connect.
2. Chỉ thêm biến thể lớp/luật khi solver, animation và bàn 5 lớp đã được kiểm thử ổn định.

## 9. Quyết định để lại cho giai đoạn cân bằng

- Giá Xu, số lượng khởi đầu và cách bán từng vật phẩm.
- Mốc sao cụ thể theo số bộ ba/layer.
- Tần suất và vị trí sinh thẻ may mắn.
- Chỉ số thời gian cuối cùng sau thử nghiệm thiết bị thật.

Các giá trị này là tuning sản phẩm và phải nằm tập trung trong `tripleConfig.js`/catalog, không rải hằng số vào renderer hoặc controller.
