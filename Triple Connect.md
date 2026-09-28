# Kế hoạch & Thiết kế — Triple Connect

## 1. Mục tiêu và phạm vi

**Triple Connect** là trò chơi thứ ba, độc lập với **Memory Match** và **Link Connect**. Người chơi tìm ba thẻ cùng hình trên bàn nhiều lớp. Thẻ được chọn bay vào khay dưới bàn; khi một bộ ba hoàn tất, ba thẻ tự nhóm sang trái, một đường hiệu ứng chạy ngang qua cả ba rồi áp dụng hiệu ứng xóa thẻ đang trang bị.

Trò chơi dùng chung hệ thống Xu, chủ đề ảnh, Bộ sưu tập hiệu ứng, âm thanh, HUD, modal và popup với hai game hiện tại. Chỉ dùng chung các hợp đồng giao diện/dữ liệu ổn định; trạng thái vòng chơi, controller, board và lưu tiến trình phải tách riêng để không gây lỗi chéo.

### Quyết định đã chốt

- Màn hình mobile dọc: HUD ở trên, bàn nhiều lớp ở giữa, khay ngang dưới bàn.
- Khay cơ bản có 7 ô. Quyền Mở rộng khay mua một lần với 3.000 Xu nâng capacity lên 10; entitlement lưu ở profile, áp dụng ngay cho round đang chơi và rollback nếu persistence thất bại.
- Chỉ thẻ không còn bị bất kỳ thẻ lớp cao nào giao phủ mới có thể chọn. Các lớp được lệch theo bước nửa thẻ để người chơi nhìn được thẻ bên dưới; không bắt buộc dọn sạch toàn bộ một layer trước khi mở tile đã hết blocker.
- Khay luôn tự dồn trái và tự nhóm các thẻ cùng loại. Khi đủ đúng 3 thẻ, game ưu tiên xóa bộ ba trước khi xét khay đầy.
- Điều kiện thắng: xóa sạch board. Điều kiện thua: sau khi ưu tiên giải quyết mọi bộ ba vừa hình thành, khay vẫn có đủ 7 thẻ và không có bộ ba có thể xóa ngay.
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
- Luật Miss dùng `streakType` và `streakCount` độc lập với thứ tự hiển thị sau khi khay tự nhóm. Nếu `streakCount` đang là 1 hoặc 2 mà người chơi chọn loại khác, ghi đúng một **Miss**, combo về 0, rồi thẻ mới bắt đầu chuỗi mới.
- Hoàn tất bộ ba đặt chuỗi về rỗng sau khi cộng match/combo/điểm. Bộ ba hình thành từ các thẻ đã có trong khay vẫn resolve bình thường, nhưng không được suy luận Miss từ vị trí nhóm trên giao diện.
- Bảng ví dụ chuẩn:

| Chuỗi chọn | Kết quả |
| --- | --- |
| `A-A-A` | Hoàn tất một bộ ba; không Miss; tăng combo một lần; reset chuỗi. |
| `A-B-A` | Lượt `B` tạo một Miss và bắt đầu chuỗi B; lượt `A` tạo thêm một Miss và bắt đầu chuỗi A. Các thẻ vẫn được nhóm trong khay. |
| `A-A-B` | Lượt `B` tạo đúng một Miss, combo về 0 và bắt đầu chuỗi B. |
| `A-A-B-B-A` | `B` đầu tiên tạo một Miss; `B` thứ hai tiếp tục chuỗi B; `A` cuối tạo một Miss mới. Nhóm A/B trong khay không thay đổi cách đếm. |
| `A-A-A → B-B-B` | Hai bộ ba hoàn tất liên tiếp; combo đạt 2 nếu không có lượt khác chen giữa. |
- Mỗi bộ ba là một match. Điểm dùng công thức Link Connect: `10 + (combo − 1) × 3` khi hoàn tất bộ ba. Sao xét trên tổng số bộ ba đã xóa; mốc cụ thể sẽ tinh chỉnh sau khi thử bàn nhiều lớp.

## 3. Board nhiều lớp và tính khả thi

### Trình bày

- Board active có 3–6 lớp, dùng tọa độ logic theo bước nửa thẻ. Mỗi lớp có mask hình học riêng; không xếp thành các cột thẻ giống nhau.
- Các lớp căn giữa trên cùng một board và xen kẽ theo từng cặp: Layer 2 đặt vào khe của Layer 1, Layer 3 đặt vào khe của Layer 2, Layer 4 đặt vào khe của Layer 3 và Layer 5 đặt vào khe của Layer 4. Bước tọa độ là nửa chiều rộng/nửa chiều cao thẻ để tạo cảm giác chồng lớp nhưng vẫn thấy ảnh/viền phía sau.
- Layer 1 có thể phủ gần toàn board nhưng phải tạo silhouette đẹp. Số lượng/footprint không bắt buộc giảm đều: Layer 4 có thể nhiều thẻ hoặc có cụm lớn hơn Layer 3 miễn các tile cùng layer không chồng nhau; Layer 5 nên nhỏ hơn để giữ chiều sâu thị giác. Kích thước từng card trong cùng layout vẫn nhất quán, “lớn hơn” chỉ nói về cụm/mask.
- Base layout active V5 có `27/45/63/96` slot cho Dễ/Trung bình/Khó/Siêu khó-Vô tận. Round có xấp dùng topology V6, dời toàn bộ base layout vào lane giữa và đặt xấp ở góc trong vùng loại trừ riêng; không base card nào được chạm footprint xấp.
- Hidden Piles: Trung bình có một xấp 9 thẻ ở góc trên trái; Khó có hai xấp 7 và 8 thẻ ở hai góc trên; Siêu khó/Vô tận có bốn xấp 6 thẻ ở bốn góc. Chỉ top card tồn tại trong DOM/a11y; thẻ sâu được reveal tuần tự.
- Một thẻ chỉ tương tác được nếu không còn thẻ lớp cao nào giao lên vùng của nó trong cover graph. Tile bị che mờ tĩnh, không focus/không nhận chạm; tile dưới đã hết blocker được sáng và chọn ngay, không cần chờ dọn sạch cả layer.
- Ảnh trên thẻ phải hiện trọn nội dung (`contain` về mặt trình bày), không bị crop do tỷ lệ card hoặc bị ép theo từng trục. Board co bằng một tỷ lệ đồng nhất và căn giữa trên mobile/desktop; resize không thay slot, layer hoặc cover graph.
- Hoàn tác phục hồi snapshot chính xác của lượt chọn gần nhất: tile, slot, layer, quan hệ che phủ, khay, chuỗi Miss/combo và các giá trị lượt liên quan. Không tự nâng thẻ lên lớp trên. Nếu snapshot không còn phục hồi hợp lệ thì từ chối thao tác và không trừ vật phẩm. Xáo thẻ luôn xóa lịch sử Hoàn tác.

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
| Dễ | 27 | 9 | 3 | 93 giây | Không có xấp góc. |
| Trung bình | 54 | 18 | 4 | 133 giây | Base 45 + một xấp 9. |
| Khó | 78 | 26 | 5 | 178 giây | Base 63 + hai xấp 7/8. |
| Siêu khó | 120 | 40 | 6 | 262 giây | Base 96 + bốn xấp 6. |
| Vô tận | 120 | 40 | 6 | Đếm xuôi | Cùng topology Siêu khó; qua level liên tiếp. |
| Thử thách | 18 → 93 | 6 → 31 | 2 → 5 | 75 → 210 giây | Tổng thẻ theo stage `18, 27, 42, 51, 66, 75, 93`; có thẻ may mắn. |

Mốc thời gian ban đầu đồng bộ với hai game và chỉ được điều chỉnh sau khi có dữ liệu thử nghiệm thực tế.

## 5. HUD và giao diện

### Bố cục dọc

1. **HUD tiến trình trên:** Moves, Miss, Combo, thanh 3 sao, Điểm, tiến trình bộ ba `1 / 12`, Gợi ý.
2. **Thanh thao tác:** Menu, Level, Thời gian, tổng sao, nút Công cụ.
3. **Board nhiều lớp:** tự co theo chiều cao còn lại, không tràn vùng chơi mobile.
4. **Khay ngang:** 7 vị trí hoạt động cố định ở dưới board; không hiển thị ba ô khóa hoặc affordance mở rộng trong phiên bản đầu.

### Đồng bộ màn chọn và HUD

- Picker Bắt đầu/Tiếp tục hiển thị chủ đề Triple đang trang bị và nút Đổi trước danh sách mode, cùng ngôn ngữ hình ảnh và luồng tương tác của Memory Match/Link Connect.
- Tên mode luôn lấy từ catalog và hiển thị Dễ, Trung bình, Khó, Siêu khó, Vô tận hoặc Thử thách; không đưa ID nội bộ như `normal`/`superHard` lên HUD.
- Triple dùng semantic Game Shell/HUD chung cho progress, Menu, Level, Timer, tổng sao và Công cụ. Khác biệt chỉ nằm ở chỉ số/lệnh riêng của Triple; action không có handler thật không được hiển thị.
- Action menu và tools menu loại trừ lẫn nhau, có cleanup khi đóng/đổi game. Compact landscape kế thừa contract shell toàn game; desktop landscape giữ bố cục desktop và phải fit trọn board/ảnh.

Trong vertical slice trước Gate 7B, chưa có Gợi ý hoặc vật phẩm thật thì phải ẩn bộ đếm Gợi ý và nút Công cụ; không dựng nút giả, tồn kho giả hoặc hành vi tạm chỉ để giống mockup.

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
| Xáo thẻ | Xáo mọi thẻ còn lại trên mọi lớp/xấp, sau khi solver xác nhận board mới. | Xóa lịch sử Hoàn tác. |
| Thêm thời gian | Dùng cơ chế mua/thêm thời gian chung. | Không dùng trong Vô tận. |
| Mở rộng khay | Quyền mua một lần, tăng 7 → 10 ô. | Giá 3.000 Xu; mobile dọc hiển thị 5×2. |

Trong Thử thách, thẻ may mắn có thể thưởng `+thời gian`, `+gợi ý` hoặc `+Xu`; được thể hiện như một thẻ trong bộ ba và dùng popup phần thưởng chung.

Thẻ đặc biệt, thẻ đóng băng và các luật độ khó bổ sung được hoãn sang giai đoạn sau. Chúng phải được thiết kế lại theo bộ ba, không sao chép trực tiếp luật theo cặp của Link Connect.

## 7. Cô lập kỹ thuật và tái sử dụng chung

### Module mới

```text
js/tripleConnect/
├── tripleConfig.js       # mode, layer, scoring, thời lượng và tuning riêng
├── tripleRules.js        # luật/reducer thuần dùng chung cho runtime và solver
├── tripleState.js        # trạng thái round độc lập, roundId và khay
├── tripleBoard.js        # slot/layer, cover graph và generator
├── tripleSolver.js       # xác minh lời giải, budget và fallback corpus
├── tripleRenderer.js     # board lớp, khay, line ba thẻ và animation
├── tripleShell.js        # mount/unmount Game Shell và vùng board composite
├── tripleController.js   # vòng đời màn, timer, HUD, win/lose và session
└── tripleItems.js        # chỉ tạo tại Gate 7B khi có vật phẩm thật
```

### Thành phần tái sử dụng

- `appearance.js`, `themeCatalog.js`, Xu và persistence chung.
- `modal.js`, `ui.js`, popup đầu/tổng kết/hết giờ, cài đặt, âm thanh và responsive shell.
- Catalog/renderer hiệu ứng line và xóa thẻ qua interface chung, không copy danh sách hiệu ứng.
- Shop/Bộ sưu tập dùng tab hoặc adapter theo game; quyền sở hữu effect/theme không nhân đôi.

### Nguyên tắc chống lỗi chéo

- Không import hoặc ghi trực tiếp `gameState`/`linkGameState` để làm state Triple; Triple có `tripleGameState` và `roundId` riêng.
- `triple-connect` chỉ là ID catalog/registry; key dữ liệu JavaScript là `tripleConnect`. Từ Gate 6, progress/session nằm dưới `progress.tripleConnect` và `progress.tripleConnect.sessionsByMode`; inventory chỉ được thêm tại Gate 7B sau khi contract kinh tế được duyệt. Không tạo localStorage key song song riêng cho Triple.
- Component dùng chung chỉ nhận dữ liệu qua tham số/callback; không chứa nhánh logic Triple trong Memory hoặc Link controller.
- Kiểm tra tĩnh và test board/solver Triple được thêm vào `npm run check` trước khi mở game trong menu chính.

## 8. Trạng thái triển khai

- Core gameplay, sáu mode, Challenge/Lucky, item, solver, session, responsive, Hidden Piles, khay 7/10 và milestone 10/30 đã có trong runtime.
- Round mới dùng topology corner-safe V6; layout V1–V5 tiếp tục là compatibility corpus cho save cũ.
- Effect V2 runtime dùng adapter chung cho Link/Triple và đã có cleanup/reduced-motion/performance test. Visual fidelity từng line effect là phase riêng, không ảnh hưởng kết quả gameplay.
- Công việc active nằm trong `TASK_RUNTIME_CLOSURE_AND_SIMPLIFICATION_PLAN.md`: đóng stale regression, hoàn tất generated-theme history/snapshot và giảm test matrix trùng lặp.

## 9. Trạng thái quyết định sản phẩm

Đã được triển khai: 3 Gợi ý khởi đầu; giá Gợi ý 8 Xu, Thêm thời gian 2 Xu/giây, Hoàn tác/Xáo thẻ 15 Xu; mốc sao `12/18/25` và Endless `10/15/20`; Lucky chỉ có ở Challenge; Mở rộng khay giá 3.000 Xu; milestone version 2 gồm 10 mốc mỗi 3 bộ ba, target 30.

Phân bố Lucky, bảng reward milestone, fallback khi inventory đầy và phần thưởng cuối màn/Endless phải lấy từ `tripleConfig.js` cùng module transaction tương ứng; tài liệu này không sao chép bảng số chi tiết để tránh lệch nguồn sự thật.

Mọi tuning sản phẩm phải nằm tập trung trong `tripleConfig.js`/catalog, không rải hằng số vào renderer hoặc controller.
