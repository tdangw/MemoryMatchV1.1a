# Adventure Web — Kế hoạch thiết kế và triển khai

Ngày cập nhật: 2026-10-13.

Trạng thái: **được giao triển khai toàn bộ phase**, theo yêu cầu ngày 2026-10-13; kiểm tra và commit riêng từng phase, tiếp tục tới hết phạm vi đã giao. Đây là kế hoạch hiện hành duy nhất. Phase 0 đã chốt phạm vi, dữ liệu, economy rương và backend free; các phase implementation chưa pass. Không tự deploy Hosting, nâng billing hoặc gắn SDK quảng cáo chưa được chọn.

## 1. Mục tiêu và phạm vi

Biến ba trò Memory Match, Link Connect và Triple Connect thành một web app có hành trình màn chơi, giao diện mobile thống nhất, sao lưu guest/Google, xếp hạng và thống kê đơn giản. Tái sử dụng runtime đã hoàn tất; giữ bản chất Memory luyện trí nhớ, Link quan sát đường nối và Triple quan sát/tính toán khay. Không mở lại các kế hoạch runtime cũ.

Trong phạm vi thiết kế: bản đồ/chọn màn, menu mobile, mở khóa/thưởng, tiếp tục sau màn 100, UI ngoài game, cảnh chiến thắng, dữ liệu theo chặng, Auth/sync, bảng xếp hạng, Analytics, tải tài nguyên và kiểm chứng hiệu suất. Trọng tâm đánh giá hiện tại là chọn màn/menu và chuẩn bị dữ liệu xếp hạng; chưa triển khai code.

Nhiệm vụ và cơ chế gameplay mới được tạm hoãn theo yêu cầu người dùng. Không đưa mission engine, early-win, luật ngân sách hành động hoặc thiết kế nhiệm vụ vào gate bản đồ/menu. Ba trò tiếp tục dùng điều kiện thắng và luật hiện hành.

Tài liệu trong repository chỉ chứa thiết kế, quy tắc và kế hoạch của dự án. Nội dung nghiên cứu/tham khảo trò khác chỉ trao đổi trong chat; không lưu tên, mô tả, bảng so sánh, đường dẫn hoặc tài nguyên của các trò đó vào dự án.

Ngoài phạm vi mặc định: APK/store, multiplayer, lives/energy để giới hạn chơi, gắn mạng quảng cáo/IAP, backend xác minh gameplay chống gian lận nâng cao, viết lại ba game bằng framework khác, tinh chỉnh toàn bộ Effect V2. Chừa vị trí quảng cáo trên menu chính/bản đồ thuộc task hiện tại; SDK/mã quảng cáo thật do người dùng cung cấp sau. Không tự nâng gói Firebase.

## 2. Quyết định đã xác nhận

- Mỗi trò có hành trình độc lập.
- Bản đồ dùng cho Dễ, Trung bình, Khó, Siêu khó. Thử thách và Vô tận hiện hữu giữ lối vào riêng.
- Trong một trò, mở khóa màn dùng chung giữa bốn độ khó; sao và điểm thuộc độ khó đang chơi.
- Ban đầu có thể chọn màn 1–3. Thắng màn N mở tất cả màn đến N+3; không thu hồi màn đã mở. Đã xác nhận ví dụ: thắng màn 3 trước màn 1–2 mở thêm 4–6; vẫn quay lại chơi 1–2.
- Người chơi tự vuốt bản đồ để chọn/tìm màn, không thêm nút tìm, lọc hoặc nhảy tới màn chưa clear. Node đã mở hiện sao chưa sáng; kết quả clear hiển thị sao sáng theo số sao đạt được ở độ khó đang xem. Logic completion dùng chung giữa độ khó vẫn được lưu độc lập với số sao.
- Mỗi 10 màn có một rương; cần thắng 10 màn để mở rương. Thưởng trước mắt là Xu, catalog cho phép đổi nội dung sau.
- Mỗi chặng có 100 màn chơi và 10 nút rương, tổng cộng 110 nút bản đồ. Sau chặng có thể chơi 101–200, 201–300…
- Chặng tiếp theo chỉ mở khi thắng đủ 100 màn khác nhau trong chặng hiện tại, tính chung giữa bốn độ khó. N+3 dừng ở ranh giới chặng cho tới khi đủ điều kiện; cảnh hoàn tất chặng theo completion này, không theo việc chỉ thắng màn 100/200/300.
- Chưa áp dụng nhiệm vụ. Bản đồ dùng kết quả thắng theo luật hiện tại của từng trò; không thay điều kiện thắng hoặc bổ sung early-win.
- Giao diện đang chơi giữ nguyên HUD, bàn, khay, công cụ hỗ trợ và cách trình bày hiện hữu. Chỉ thêm bốn nút chức năng đã chốt vào phần trống dưới game hiện tại; người dùng xác nhận cả ba trò đều còn khoảng trống. Không dùng bố cục gameplay trong minh họa làm thiết kế triển khai.
- Dãy nút đáy thống nhất trên menu chính, bản đồ từng trò và gameplay: Cửa hàng → Bộ sưu tập → Xếp hạng → Cài đặt. Các hành động quay lại, chọn mode, chơi lại và trợ giúp giữ ở owner/vị trí phù hợp hiện hữu, không thay bằng các tab đáy khác nhau.
- Quảng cáo chỉ có vùng riêng dưới thanh nút tại menu chính/bản đồ; thanh nút nằm trên vùng đó. Gameplay không hiển thị hay giữ chỗ quảng cáo, không chỉ làm nội dung quảng cáo trong suốt. Chừa bố cục có token kích thước/safe-area trước, chưa gắn provider/ad unit.
- Bốn độ khó thường luôn đếm ngược. Không bổ sung chế độ không giờ hoặc ngân sách hành động thay đồng hồ trong task này.
- Người dùng tự nghiên cứu thêm phần nhiệm vụ. Các đề xuất nhiệm vụ chưa được duyệt và không là dependency hay acceptance criteria của bản đồ/menu.
- Hình ảnh, tên vùng, bố cục chi tiết, icon, âm thanh và luật được thiết kế riêng cho dự án.
- Cảnh cuối chặng ưu tiên đẹp với chuyển động nhẹ; chạm có hạt bụi hoặc phản hồi nhẹ.
- Guest có sao lưu; có thể liên kết Google sau. Khi có hai bản lưu khác nhau, cho chọn bản, không tự cộng tài nguyên.
- Giữ Xu/vật phẩm/chủ đề/kỷ lục/session hiện có khi chuyển định dạng; được phép bước chuyển đổi dữ liệu. Không tiếp tục chính sách reset development chỉ vì save là version trước.
- Rương theo nhóm 1–10, 11–20… một lần mỗi trò; tạm dùng Nhỏ 60 + ngẫu nhiên 20–40 Xu (70%), Vừa 100 + 30–60 (25%), Lớn 150 + 50–100 (5%). Catalog có version, phần cố định/phần ngẫu nhiên và danh sách grants để mở rộng vật phẩm sau; kết quả đã nhận được lưu, không quay lại khi mở/đóng.
- Backend xếp hạng bản đầu đã được chọn: Firebase free, kiểm tra identity/dữ liệu, lưu best từ client, bảng mọi thời gian và gửi lại kết quả offline. Chưa xác minh toàn bộ gameplay trên server.
- Review agent chỉ dùng khi rủi ro thực sự cần đánh giá độc lập, ưu tiên phase persistence/shared lifecycle/Auth/rules; không dùng cho mọi sửa giao diện nhỏ. Agent review chỉ đọc diff và chạy kiểm tra, không sửa file/commit.
- Xếp hạng màn thường riêng theo trò × độ khó × màn; chỉ kết quả clear, thời gian thực đang chơi ngắn hơn xếp trước. Loại thời gian tải, tạm dừng, menu và tab ẩn; cộng giờ/đóng băng countdown không làm giảm thời gian chơi thực.
- Xếp hạng Thử thách và Vô tận Triple theo màn đạt tới khi kết thúc lượt, màn cao hơn trước; nếu cùng màn, tổng điểm của đúng lượt cao hơn trước, gồm các màn đã clear và điểm ở màn cuối. Không dùng tổng kỷ lục từ nhiều lượt.
- Thử thách giữ luật hiện hữu: vẫn đếm ngược; Triple có 7 màn Thử thách. Vô tận không đếm ngược. Chưa thiết kế điều kiện thua và chưa có xếp hạng Vô tận Memory/Link; không thêm nút Kết thúc lượt vào hai trò này.
- Các lượt dùng hỗ trợ vẫn được xếp hạng như chơi bình thường. Guest và tài khoản liên kết Google đều được gửi thành tích; mỗi tài khoản có một kỷ lục trên mỗi bảng.
- Thử thách hết giờ nhưng mua thêm giờ để tiếp tục vẫn là cùng lượt, không chốt/gửi kết quả cuối tại popup hết giờ. Chơi lại màn cũng không gửi kết quả ngay và không loại lượt khỏi xếp hạng: đã xác nhận đang ở màn 10, chơi lại màn 10, rồi tới màn 15 mới kết thúc vẫn được gửi thành tích ở màn 15. Chỉ chốt khi thực sự kết thúc ván, không cộng điểm lặp do restart.
- Dự kiến dưới 100 người chơi; chưa xác định là DAU, tổng tài khoản hay số đồng thời.
- Baseline đã có trong CONTEXT là Galaxy S22 Ultra, CSS viewport 412×915. Không tự thêm một matrix thiết bị khác trước khi thống nhất.

## 3. Các quyết định còn chờ

1. Đã chốt điểm vào từng trò là bản đồ và dãy tab đáy đồng nhất. Triển khai menu theo hệ màu xanh đêm/vàng và nền tĩnh hiện hữu của dự án, giữ gameplay hiện hữu; hình minh họa là tham khảo, không dùng toàn bộ raster màn hình làm giao diện. Kích thước các vùng/nút được kiểm chứng trên baseline 412×915.
2. Rương đã chốt theo nhóm 10 màn và ba gói Xu tạm thời ở mục 2; có thể chỉnh catalog hoặc thêm vật phẩm ở task sau. Thưởng nhận một lần mỗi trò, không bắt buộc nhận để chơi tiếp.
3. Đối chiếu restart/replay/resume của từng trò để bảo đảm thao tác chọn màn giữ contract hiện hữu. Mọi thay đổi về seed/bố trí khi retry phải được giao riêng, không tự thêm vào thiết kế menu.
4. Thiết bị/browser thấp nhất ngoài baseline hiện có; phạm vi dưới 100 người chơi; phong cách cụ thể trong hướng mobile tươi sáng.
5. Xung đột tài liệu save đã được giải quyết bằng yêu cầu mới: giữ dữ liệu và có chuyển đổi. Source v1 dùng formatVersion=1; phase 1 nâng lên formatVersion=2, giữ nguồn phục hồi, test idempotent/failure. Không dùng schemaVersion/key migration lịch sử làm schema nguồn.
6. Backend cơ bản/mọi thời gian/offline đã chốt. Account-linking gặp UID khác dùng lựa chọn local/cloud cho save, không tự union hoặc chuyển public entry của UID trước. Tên hiển thị/avatar dùng giá trị tối thiểu có fallback và được escape. Không thêm mùa giải hoặc nâng billing trong task.

Các đề xuất chưa xác nhận không phải acceptance criteria đã phê duyệt.

## 4. Logic hành trình và đánh giá N+3

### Hai phương án đã cân nhắc

- Mở theo màn thắng cao nhất +3: có lựa chọn để tránh bị kẹt một màn; có thể đi 1→4→7… và còn nhiều màn thiếu. Đây là phương án người dùng đã chọn.
- Cửa sổ ba màn từ màn chưa thắng đầu tiên: ít bỏ sót, kiểm soát nội dung tốt hơn; dễ bị chặn khi hai màn sau đã thắng nhưng màn đầu vẫn khó. Không tự thay thế phương án đã chọn.

N+3 hợp lý cho mục tiêu tự do chọn màn, với điều kiện bản đồ giải thích rõ mở khóa không đồng nghĩa hoàn tất.

UI dùng trạng thái sao trên node để thể hiện kết quả của độ khó đang xem; rương hiển thị tiến độ 7/10. Người chơi tự vuốt lên/xuống tìm và chọn màn, không thêm nút tìm/lọc/nhảy tới màn chưa clear. Trạng thái hết chặng hiển thị tiến độ và điều kiện mở chặng sau.

Rương đề xuất chỉ là phần thưởng, không là cổng chặn sau mỗi 10 màn. Chặng tiếp theo yêu cầu đủ 100 màn nên chặn ở ranh giới chặng; người chơi tự cuộn về các màn còn thiếu. Người chơi có thể thắng màn 100 trước màn 47: chặng vẫn chưa hoàn tất; khi thắng màn thiếu cuối cùng mới mở 101–103 và có cảnh tổng kết chặng. Không dùng số màn cao nhất để giả định đã hoàn thành 100 màn.

Completion phải lưu rõ theo game/mode/level. Không suy thắng từ stars >0: luật cũ có thể ghi kết quả thắng 0 sao. Completion chung giữa mode là kết quả suy ra từ các completion riêng, không tạo hai sổ sự thật lệch nhau.

Giữ số màn toàn cục, không reset về 1 khi sang chặng mới. Reward ID dựa trên game + nhóm 10 màn; không phụ thuộc vị trí DOM hoặc mode. Chơi lại không tạo completion/rương mới.

## 5. Nhiệm vụ tạm hoãn

Người dùng tiếp tục nghiên cứu phần nhiệm vụ. Chưa áp dụng các cơ chế mới, mission state, HUD mục tiêu, early-win hoặc luật giới hạn hành động. Giữ bản chất Memory luyện trí nhớ, Link quan sát đường nối và Triple quan sát/tính toán khay.

Bản đồ/menu dùng kết quả thắng hiện hữu. Task này không cần thiết kế 100 nhiệm vụ, bộ sinh theo goal hoặc nghiệm thu pilot nhiệm vụ. Khi có yêu cầu mới, phải chốt thiết kế và phạm vi riêng; không khôi phục các đề xuất trước làm nhiệm vụ bắt buộc.

Điểm/sao, thời gian, combo, vật phẩm và luật thua/thắng giữ nguyên, trừ thay đổi được người dùng giao rõ ở task sau.

## 6. Chọn màn hiện tại và bản đồ

### 6.1. Luồng hiện tại và vấn đề từ code

- Chọn trò → menu danh sách → Bắt đầu/Tiếp tục → chọn mode hoặc session → lựa chọn chơi mới/tiếp tục ở một số nhánh → bàn chơi.
- Memory và Link có phiên riêng theo mode; menu Tiếp tục mở một danh sách session. Luồng bắt đầu Triple và lựa chọn session chưa được tổ chức giống hai trò còn lại.
- Menu trước bàn là overlay giữa màn với wrapper rộng tối đa khoảng 370px. Các mục Chơi, Bộ sưu tập, Cửa hàng, Hướng dẫn, Cài đặt và Home có hình thức gần nhau, chưa phân biệt hành động chính và điều hướng.
- Một số nhãn mô tả đang 10px. Menu chưa thể hiện rõ màn đã mở, kỷ lục theo mode, rương hoặc màn còn thiếu.
- Bắt đầu một run mới chủ yếu quay về màn 1; không có UI chọn lại một màn cụ thể.

### 6.2. So sánh phương án

| Tiêu chí | Menu chọn mode/tiếp tục | Bản đồ màn | Bản đồ + Tiếp tục nổi bật |
| --- | --- | --- | --- |
| Vào chơi nhanh | Hợp với run liên tục, nhưng có nhiều lớp chọn | Có thể cần tìm/chạm một node | Nút chính vào session hoặc màn đề xuất |
| Xem tiến trình | Chủ yếu qua phiên/kỷ lục khác | Thấy màn, sao, khóa và rương | Có đủ tiến trình, vẫn vào chơi nhanh |
| Chọn chơi lại | UI hiện thiếu | Chọn đúng màn/độ khó | Giống bản đồ |
| Rương/chặng/N+3 | Khó diễn đạt bằng danh sách mode | Phù hợp với cấu trúc hành trình | Phù hợp với cấu trúc hành trình |
| Giữ mục đích luyện tập | Dễ chọn độ khó và chơi liên tục | Cần tránh làm thao tác chọn màn thành cản trở | Giữ độ khó rõ và nối màn nhanh |
| Chi phí làm/kiểm chứng | Thấp nếu chỉ sắp xếp menu | Thêm progress/launch/replay/layout | Thêm map và logic phân biệt resume/new |
| Tạo nội dung mới | Không tự tạo | Không tự tạo | Không tự tạo |

Đề xuất bản đồ + nút Tiếp tục làm màn Chơi của từng trò. Bản đồ là cách điều hướng/biểu diễn tiến trình, không chứng minh 100 màn đã đa dạng hơn. Trong phạm vi hiện tại, các màn vẫn chơi theo luật/cấu hình mode đang có.

### 6.3. Cách vào chơi phải rõ

- Có session của mode đang chọn: nút chính ghi Tiếp tục kèm màn và mode, resume session đó.
- Không có session: nút chính dẫn tới màn chưa thắng được đề xuất trong các màn đã mở; nhãn Chơi màn N.
- Chạm node màn đang có session có lựa chọn tiếp tục hoặc chơi lại. Chơi lại/mở màn khác không âm thầm xóa session đang dở.
- Nếu cần thay session duy nhất của một mode, thông báo cụ thể trước khi thay; các session ở mode/trò khác được giữ.
- Sau thắng: nút chơi tiếp dùng cùng độ khó và đưa tới màn phù hợp đã mở. Có nút về bản đồ để xem sao/rương và chọn lại.
- Thay mode chỉ thay dữ liệu sao/điểm/session của UI; không reset mở khóa, rebuild bàn đang chơi hoặc tự bắt đầu một run.
- Header/chọn node ghi rõ mode. Tiến độ rương và hoàn thành chặng dùng completion chung; sao/điểm node thuộc mode đang chọn.

### 6.4. Chặng dài hạn khi chưa có nhiệm vụ

100 màn + 10 rương là cấu trúc hành trình. Sau đủ 100 completion khác nhau mở chặng sau; số màn tiếp tục tăng. Chỉ tải chặng đang xem, prefetch có cap và sinh board cho màn được chọn.

Không tăng board, giảm thời gian hoặc bổ sung mechanic mới theo số chặng trong task này. Không tự áp recipe mission, seed cố định hay luật replay mới; launch/replay/resume phải giữ đúng semantic timer/vật phẩm của controller hiện tại.

Trước khi thêm archive/chunk storage, đo kích thước save và chi phí hydrate/stringify; không xử lý mọi chặng lịch sử trong mỗi checkpoint. Giữ mọi completion/claim và báo được lỗi storage thay vì cắt dữ liệu.

### 6.5. Rủi ro khi chuyển sang bản đồ

- Session hiện chỉ có một slot mỗi game/mode. Chọn màn khác phải phân biệt chơi mới với tiếp tục, không âm thầm thay phiên đang dở hoặc tác động các slot khác.
- Kỷ lục hiện có theo mode/level không thay thế quy tắc completion/claim mới. Không suy đủ 100 màn từ màn cao nhất hoặc từ sao; mở khóa chung, kỷ lục riêng và rương một lần phải được kiểm tra độc lập.
- Replay/chọn node có thể đi sai nhánh new/advance và cấp vật phẩm đầu màn lặp. Giữ thưởng ghép/thắng theo luật hiện hữu; rương mới dùng claim riêng, commit cùng Xu và rollback khi lưu lỗi.
- N+3 cho phép chơi không theo thứ tự. Phân biệt khóa/mở và hiển thị sao theo độ khó ngay trên node; người chơi tự cuộn tìm màn. Không coi việc cần tìm màn là lý do thêm nút hoặc bộ lọc. Điều kiện mở chặng sau vẫn dựa trên đủ 100 completion chung.
- Bản đồ tăng khả năng thấy tiến trình nhưng chưa làm các màn đa dạng hơn. Không hứa giải quyết độ lặp khi nhiệm vụ đang tạm hoãn.
- Chỉ giữ DOM/tài nguyên của chặng đang xem, không sinh 100 bàn hoặc render mọi chặng lịch sử; kiểm tra chi phí lưu theo lịch sử tăng dần.
- Thanh nút gameplay tận dụng khoảng trống phía dưới mà người dùng xác nhận có ở cả ba trò. Giữ giao diện hiện hữu, không phủ lên bàn/khay; kiểm tra thanh mới vừa vùng trống và các nút chạm được trên baseline 412×915, kể cả Triple mở rộng khay.

Tách dữ liệu/luật hành trình, luồng chọn màn và thêm thanh nút gameplay thành các thay đổi kiểm chứng được. Auth, Analytics, nhiệm vụ và thay mỹ thuật gameplay không được gộp vào để hoàn thành chuyển bản đồ. Đây là đánh giá thiết kế, chưa là kết quả test implementation.

## 7. Kiến trúc menu/bản đồ

- App navigation có một owner cho destination, trò hiện tại, mode đang xem, chặng, vị trí cuộn và overlay đang mở. Không thêm nguồn state song song với registry/controller đang dùng.
- Shared shell/menu dùng adapter/capability của từng trò cho theme, collection, shop, launch/replay/resume; không thêm nhánh mặc định coi mọi trò là một loại game.
- Progression/reward eligibility là logic thuần theo game/mode/level/nhóm màn; DOM không là nguồn kết quả.
- Map có một owner cho mount/input/scroll/data/cleanup. Đổi mode patch sao/điểm/trạng thái, giữ scroll/focus; không dựng lại toàn bộ subtree chỉ để đổi số.
- Page shop/collection/settings quay lại đúng trò/mode/chặng/scroll. Back, đóng panel và chuyển trò dùng một luồng điều hướng có thể kiểm thử.
- Controller từng trò giữ ownership round/timer/board/outcome; menu không sửa trực tiếp state nội bộ.
- Metadata xếp hạng được thu thập ở boundary ready/pause/resume/outcome/session của controller, độc lập với bộ đếm countdown và DOM. Logic so sánh kỷ lục là logic thuần; gửi cloud không nằm trong đường render/tick và không quyết định thắng/thua.
- Replay/chọn màn phân biệt với lần đầu vào/advance để không cấp Gợi ý hoặc thưởng đầu màn lặp do điều hướng. Thưởng ghép và thưởng thắng giữ contract hiện hữu; rương một lần là ledger riêng.
- Completion/kỷ lục/thưởng/claim có commit và rollback rõ; không hiển thị đã nhận rương bền vững khi save fail.
- Hủy transition/callback cũ khi đổi trò/màn hoặc rời page; không nhân listener/observer/RAF. Chỉ một page/overlay theo thiết kế tại một thời điểm.
- Refactor ownership menu và thay hành vi launch/progress ở các gate riêng. Không đổi luật thắng, không thêm mission engine.

## 8. Dữ liệu và hành trình dài hạn

Giữ stable game/mode/theme/effect ID; phase 1 nâng định dạng lưu với migration bảo toàn dữ liệu đã được phê duyệt.

Hai phương án: giữ root localStorage đồng bộ dễ giữ chữ ký cũ nhưng phải parse/stringify lịch sử và không có transaction nhiều bản ghi; IndexedDB theo chặng có chi phí chuyển đổi/luồng bất đồng bộ nhưng có transaction profile + chapter và không cần hydrate lịch sử. Chọn IndexedDB cho backend local chính, facade persistence có ownership duy nhất. Các call site ghi phải await kết quả durability, rollback RAM khi false, guard stale round và không xác nhận thưởng trước commit. Đây là thay đổi contract nội bộ có chủ đích của phase dữ liệu; giữ entry point gameplay, ID catalog và luật.

Root profile giữ settings/wallet/appearance/session/totals và metadata chặng cần điều hướng; kết quả lịch sử ở chapter records, chỉ đọc chặng cần dùng. Summary/index là cache suy ra từ chapter results, cập nhật trong cùng transaction, không là sổ completion thứ hai. Khi nâng bản lưu v1, chỉ coi entry best hợp lệ của mode thường là thắng (bao gồm 0 sao); giữ kỷ lục Challenge/Endless và toàn bộ session/appearance/item hiện hữu. Không suy thời gian hoặc tổng điểm lượt chưa từng được đo.

Chuyển đổi hoàn tất atomically rồi mới dùng backend mới; bản v1 được giữ làm bản phục hồi, không xóa trước commit. Không fallback âm thầm về bản v1 cũ nếu backend mới đã có dữ liệu nhưng tạm không truy cập được. Trình duyệt chưa từng dùng backend mới có thể dùng fallback localStorage được khai báo rõ; lỗi storage không được ghi đè dữ liệu hỏng/không biết version bằng profile rỗng.

Failure policy của phase 1: một write thất bại làm chặn các snapshot đã xếp hàng phụ thuộc vào RAM optimistic; phục hồi bằng tải lại profile đã commit. Modal recovery có owner app, không bị cleanup round hủy và không bị popup retry/timeout khác che. Timer dừng khi backend blocked. Đây là lựa chọn an toàn thay cho việc tiếp tục ghi snapshot có thể chứa thay đổi của giao dịch đã rollback.

Mô hình dự kiến: profile/wallet/appearance/settings, chapter progress của mỗi game, active sessions, bản ghi thời gian tốt nhất, metadata lượt liên tục và sync metadata tách ownership. Không lưu bitmap hoặc toàn bộ mô tả 100 màn lặp lại; dùng catalog hiện hành và trạng thái session cần thiết. Completion/claim không bị cắt mất chỉ để giảm kích thước. Dữ liệu bảng xếp hạng công khai tách khỏi save riêng của người chơi.

DOM và RAM chỉ giữ chặng đang xem và lượng prefetch có giới hạn. Lịch sử nằm trong storage, tải theo nhu cầu; có xử lý hết dung lượng/offline. Không cam kết số chặng vô hạn theo nghĩa không có giới hạn bộ nhớ hay quota.

Một document Firestore tối đa 1 MiB; không đổ mọi chặng/session vào một document duy nhất. Đề xuất profile + chapter documents, đọc/ghi phần đổi; giao dịch reward/wallet phải atomically cập nhật các document liên quan. Snapshot Triple cũng phải có budget kích thước.

## 9. Thiết kế menu mobile và cảnh chiến thắng

### 9.1. Cấu trúc ba màn theo yêu cầu hiện tại

**Menu chính.** Trên cùng là tài khoản và Xu. Phần chính có tên app và ba lựa chọn trò chơi, với hình đại diện và mô tả trí nhớ/quan sát/tính toán. Thanh đáy theo thứ tự Cửa hàng, Bộ sưu tập, Xếp hạng, Cài đặt; phía dưới có vùng quảng cáo riêng.

**Bản đồ từng trò.** Bấm trò mở thẳng bản đồ; phía trên là tên trò, nút quay lại và Xu. Phần giữa là tiến trình, nút màn/rương và Chơi/Tiếp tục. Phía dưới có chọn bốn độ khó và dãy Cửa hàng, Bộ sưu tập, Xếp hạng, Cài đặt, rồi vùng quảng cáo riêng. Thử thách/Vô tận dùng lối vào riêng trong nội dung/header, không chiếm một tab đáy.

**Trong game.** Giữ nguyên HUD, bàn chơi, khay, công cụ hỗ trợ và vị trí/cách trình bày hiện tại; chỉ bổ sung dãy Cửa hàng, Bộ sưu tập, Xếp hạng, Cài đặt vào khoảng trống phía dưới. Không có vùng quảng cáo ở gameplay. Người dùng xác nhận cả ba trò đều còn khoảng trống. Thanh mới không đè lên thẻ/khay hoặc tự chuyển công cụ sang vị trí khác. Bố cục gameplay mới trong minh họa không thay runtime hiện hữu.

### 9.2. Cấu trúc chung

- Trang chọn trò: ba lựa chọn có hình/biểu tượng riêng, mô tả đúng trí nhớ/quan sát/tính toán và progress phù hợp; không thêm trang trung gian chỉ có danh sách nút lặp lại.
- Thanh chức năng đáy thống nhất như mục 9.1; nút có icon và nhãn đọc được. Xếp hạng theo luật tại mục 12, backend được triển khai ở phase 6. Hướng dẫn là trợ giúp theo trò.
- Thử thách/Vô tận có mục Chế độ khác dễ tìm trên màn Chơi; không trộn chúng với bốn lựa chọn độ khó của map.
- Độ khó và theme là hai khái niệm riêng; không dùng cùng một nhãn chế độ cho cả hai. Nhớ lựa chọn theo trò khi rời/quay lại.
- UI full page trên mobile, header/content/bottom navigation rõ; dùng panel từ dưới cho chọn mode/preview màn phù hợp, tránh chuỗi popup lồng nhau.
- Trong gameplay chỉ thêm hàng nút vào vùng trống ở đáy, không dựng lại HUD/board/khay hoặc sắp xếp lại công cụ. Các nút gọi hành động hiện hữu qua owner pause/resume/navigation; không tạo luồng timer hay listener song song. Kiểm tra vùng trống và vùng chạm trên baseline 412×915 để xác nhận giữ bố cục hiện hữu.
- Dùng button/link semantic, tên truy cập rõ và focus/keyboard đầy đủ; không dùng li có onclick như nút chính.
- Chạm node để xem kỷ lục và Play; node locked giải thích điều kiện. Người chơi tự vuốt bản đồ để chọn màn; không thêm nút tìm/lọc/nhảy tới màn chưa clear. Nút Tiếp tục session hiện hữu vẫn giữ theo mục 6.3.
- Bản đồ gồm nền tĩnh từng vùng, đường SVG và nút HTML. Đo trước khi chọn virtualization; một chặng không đồng nghĩa cần 100 board/animation.
- Chuyển page bằng transform/opacity hữu hạn; nền gameplay yên và đủ tương phản. Không thêm loop trang trí liên tục hoặc blur toàn màn để tạo cảm giác app.
- Giữ 44px hit target và baseline 412×915, safe-area, landscape/desktop theo phần liên quan. Font phụ cần đọc được; không giữ nhãn 10px cho thông tin quan trọng.

### 9.3. Hệ hình ảnh và cảnh cuối chặng

Hướng mỹ thuật cụ thể chưa duyệt. Concept cũ chỉ là phương án; prototype hiện giúp chọn cấu trúc điều hướng, không chốt palette/asset.

Cảnh cuối chặng: ảnh hoa/cây 3–5 lớp, animate transform/opacity ngắn rồi đứng yên; nút tiếp tục hiện rõ. Chạm sinh hạt nhỏ có cap chung (mục tiêu thử 12 hạt đồng thời). Reduced-motion dùng ảnh tĩnh và phản hồi tối thiểu. Owner hủy timers/RAF/audio/listeners kể cả khi đóng trước resolve. Các budget này chưa là số đo pass.

Timeline thử: anticipation 0–200 ms; hoa/cây xuất hiện 200–1400 ms; title/reward resolve 1400–2000 ms; sau đó tĩnh. Chỉ render trong vùng hoa. Cảnh gắn với đủ 100 completion trong chặng, không chỉ số màn cao nhất.

Bitmap mới dùng imagegen; raster card/theme dùng memory-match-image-assets khi có task asset. Chưa sinh asset hoặc sửa cảnh trong task phân tích này.

## 10. Guest/Google và cloud sync

Firebase Anonymous Auth cho guest online; chơi offline vẫn lưu local và tạo/link identity khi kết nối được. Tạo một UID bền vững, không tạo user mới mỗi màn. Liên kết Google giữ UID khi tài khoản chưa liên kết nơi khác.

Nếu Google đã có user/save khác: tải metadata hai bản, hiển thị game/chặng/time/coins, cho chọn local hoặc cloud. Account-linking thất bại do credential đã dùng là nhánh dự kiến, không bắt lỗi chung rồi ghi đè. Giữ bản phục hồi trước khi áp dụng lựa chọn; không tự union Xu/item/claim/session và không xóa dữ liệu tài khoản cũ trong luồng này.

Cloud revision/server timestamps và giao dịch chống stale overwrite; local revision hiện tại chỉ chống tab khác, không đủ cho hai thiết bị. Dirty state có owner, batch/debounce theo event; retry backoff hữu hạn; lỗi mạng/quota không làm mất local hoặc khóa chơi. Không chỉ trông vào unload để lưu.

Rules chỉ cho UID đọc/ghi dữ liệu của mình, validate shape/bounds/version. Không mở collection saves công khai. Test/beta/production tách dữ liệu và Analytics; ba site hiện cùng project không tự tách Auth/Firestore. Chưa truy cập console hoặc bật dịch vụ trong task này.

Guest cloud không thay thế phương thức khôi phục tài khoản: cần liên kết Google trước khi mất identity trình duyệt. UI thể hiện trạng thái lưu local, chờ sync, đã sync và lỗi.

## 11. Analytics, quota và tải tài nguyên

GA4/Firebase Analytics đo game/level/mode, start/end/abandon, win/loss, elapsed gameplay, stars, trợ giúp và nhận rương. Không thêm metric nhiệm vụ khi phần đó đang hoãn. Không log mỗi frame/tick/click thẻ. Đăng ký custom dimensions cần dùng; tránh identifier cardinality cao trong báo cáo thông thường.

DAU/WAU và tháng lịch là distinct users theo khoảng, không tổng lượt từng ngày. Gameplay duration loại pause/menu/tab nền; GA engagement là thời gian trang có focus, không đồng nghĩa thời gian chơi. Chọn timezone báo cáo Asia/Saigon, loại traffic development/beta/test. Không gửi email/nội dung save làm event.

Ước tính nếu dưới 100 DAU, 20 lần sync/người/ngày và mỗi sync ghi 2 document: khoảng 4.000 writes/ngày trước retry/auth/metadata. Đây là giả định budget, không bảo đảm quota; đo thực tế số document operations và payload trước release. Analytics không tiêu Firestore writes.

Rà soát service worker hiện refresh asset cache-hit ở nền, preload âm thanh, tải theme/background theo nhu cầu, URL asset fingerprint và chính sách nâng version. Hosting quota chung project cho ba site. Không lấy tổng asset repo làm dung lượng tải mỗi phiên.

## 12. Bảng xếp hạng — thiết kế dữ liệu và vận hành

### 12.1. Phạm vi đã xác nhận và cách so sánh

| Nhóm | Phạm vi bảng | Kết quả được tính | Tiêu chí chính | Khi bằng tiêu chí chính |
| --- | --- | --- | --- | --- |
| Màn thường | Từng trò × độ khó × số màn toàn cục | Clear màn | Thời gian thực đang chơi tăng dần | Đề xuất đồng hạng nếu cùng giá trị thời gian chuẩn hóa |
| Thử thách | Riêng từng trò | Kết thúc lượt do thua; Triple còn có hoàn tất màn 7 | Màn đạt tới giảm dần | Tổng điểm đúng lượt giảm dần |
| Vô tận Triple | Riêng Triple | Kết thúc lượt do thua | Màn đạt tới giảm dần | Tổng điểm đúng lượt giảm dần |
| Vô tận Memory/Link | Chưa có bảng | Chưa áp dụng | Chờ task thiết kế điều kiện thua riêng | Không tự bổ sung mechanic để có dữ liệu xếp hạng |

Cho phép hỗ trợ và các nâng cấp hiện hữu như chơi bình thường. Không tự tạo chế độ thi đấu, khóa vật phẩm, seed cố định hoặc thay luật thắng/thua. Thành tích vì vậy phản ánh cả kỹ năng, hỗ trợ và khác biệt board ngẫu nhiên; không gọi là phép đo kỹ năng tuyệt đối.

Màn đạt tới phải đi kèm lastClearedLevel và terminalOutcome, tránh mô tả màn thua là đã clear. Ví dụ thua ở màn 25 sau khi clear 24: xếp theo màn đạt tới 25, hiển thị rõ clear 24. Với Triple Thử thách, hoàn tất màn 7 cũng là outcome kết thúc hợp lệ; thua ở màn 7 ghi clear 6, hoàn tất chuỗi ghi clear 7. Khi cùng màn vẫn so tổng điểm đúng quy tắc người dùng đã chốt, không tự chèn outcome thành tiêu chí ưu tiên mới; outcome được hiển thị để phân biệt hai thành tích.

Khi các tiêu chí thi đấu bằng nhau, đề xuất đồng hạng. Có thể dùng thời điểm đạt trên server và UID làm thứ tự ổn định trong danh sách, không coi chúng là thành tích tốt hơn. Cần chốt độ chính xác thời gian hiển thị/sắp xếp cùng nhau để không hiện cùng số giây nhưng khác hạng không có giải thích.

### 12.2. Đồng hồ đo thành tích riêng

- Code hiện chỉ có countdown/count-up phục vụ gameplay; sessionTiming còn giữ timeLimit/levelStartTime và hỗ trợ cộng thời gian. Không tính thời gian xếp hạng bằng timeLimit trừ remainingTime: mua/cộng giờ, Freeze, carry thời gian và preview có thể làm phép trừ sai.
- Bắt đầu đo khi round đã ready và cho phép thao tác; chốt tại thời điểm logic ghi nhận clear, trước animation/tổng kết. Tải tài nguyên, intro/preview mặc định trước khi bắt đầu thao tác, animation kết thúc không tính vào thời gian thành tích.
- Dùng elapsed từ đồng hồ monotonic, không tăng một biến đếm bằng số lần callback timer. Pause/menu/tab ẩn đóng khoảng đo; resume mở khoảng mới; thời gian cộng giờ hoặc Freeze khi vẫn thao tác được vẫn tính. Không ngừng đồng hồ thành tích chỉ vì countdown đứng yên.
- Mọi nguyên nhân pause/resume phải dùng owner hiện hữu. Snapshot chứa activeDurationMs đã cộng dồn; reload/resume không cộng thời gian app đóng và không reset thời gian của cùng attempt. Không so mốc performance.now() giữa hai lần tải trang.
- Restart/chơi lại tạo attempt mới, reset thời gian của attempt; callback từ round trước không được chốt round mới. Không thay countdown, time bonus, combo hoặc HUD hiện tại để thêm phép đo.
- Persist theo checkpoint có ý nghĩa, không ghi mỗi tick/frame. Quy tắc gameplay duration cho Analytics có thể dùng cùng boundary đo nhưng event và persistence vẫn có owner riêng.

### 12.3. Điểm theo lượt Thử thách/Vô tận

Hiện recordMemoryMatchResult/recordLinkConnectResult/recordTripleConnectResult cộng totalScore bằng phần tăng kỷ lục của từng mode:level. Đây là tổng kỷ lục, không phải điểm một lượt liên tục; điểm round cũng được reset khi mở màn mới. Không dùng hai số đó thay cho runScore.

Đề xuất run metadata gồm runId, gameId, mode, rulesVersion, levelReached, lastClearedLevel, completedLevelsScore, currentLevelScore, terminalOutcome và trạng thái đã chốt/gửi. completedLevelsScore là điểm các màn trước màn hiện tại trong đúng lượt; currentLevelScore là điểm attempt hiện tại, gồm completion bonus khi attempt clear. runScore bằng hai phần này cộng lại. Khi Next sang màn sau, chuyển điểm màn vừa clear vào completedLevelsScore đúng một lần rồi bắt đầu currentLevelScore mới. Không cộng lại điểm round khi event clear/Next/outcome bị gọi lặp; không suy tổng lượt từ ledger kỷ lục toàn bộ lịch sử.

- Lượt Thử thách/Vô tận dùng để xếp hạng bắt đầu từ màn 1 và đi theo luồng Next hiện hữu; không đi qua N+3 hoặc nhảy từ bản đồ.
- Resume giữ runId và tổng điểm cùng session. Đề xuất pause/quay menu không tự kết thúc lượt; bắt đầu lượt mới không được thừa hưởng runScore cũ.
- Chơi lại màn giữ runId và completedLevelsScore, tạo attempt mới cho màn hiện tại và thay/reset currentLevelScore theo luật restart hiện hữu; không cộng điểm của attempt bị bỏ. Nếu màn hiện tại đã clear nhưng chưa Next, replay cũng chỉ thay phần điểm màn đó, không cộng thêm một lần clear vào tổng lượt. Giữ hành vi chơi lại màn của controller; không tự reset cả lượt về màn 1 hoặc loại lượt khỏi bảng.
- Đã xác nhận ví dụ restart màn 10 rồi kết thúc hẳn ở màn 15 vẫn được gửi thành tích màn 15. Khi ván thật sự đã được chốt, snapshot kết quả là bất biến; bắt đầu ván mới không mở lại run đã kết thúc hoặc kế thừa điểm. Đối chiếu riêng các nút replay sau khi hoàn tất Triple Thử thách 7 để không biến một lần chơi lại màn 7 thành lượt mới đã đạt 7 mà chưa chơi các màn trước.
- Tách round won khỏi run ended: clear một màn Thử thách/Vô tận thường chưa chốt bảng của cả lượt. Triple clear Thử thách 7 là run ended với outcome hoàn tất chuỗi.
- Mua tiếp thời gian ở popup hết giờ giữ cùng runId, tổng điểm và lượt; chưa chốt/gửi. Hết giờ là trạng thái chờ lựa chọn, không lập tức là terminal run outcome. Chỉ khi kết thúc thật mới chốt một snapshot cuối; nếu có thể hồi phục ở popup thua khác, cần đối chiếu owner tương ứng, không vừa gửi lost vừa tiếp tục cộng điểm.
- Với Memory/Link Vô tận, chưa có điều kiện thua tự nhiên tương ứng đầy khay Triple; giữ ngoài xếp hạng cho tới task luật riêng. Không đóng giả một run lost khi người chơi quay menu hoặc đóng tab.

### 12.4. Kỷ lục local và đồng bộ

Mỗi kết quả phải là snapshot bất biến của đúng attempt/run: ID, trò, mode, level, rulesVersion, durationMs hoặc bộ levelReached/runScore/outcome, metadata hiển thị tối thiểu và trạng thái gửi. Best time và best score có thể đến từ hai attempt khác nhau; không ghép best time của lượt A với score/outcome của lượt B thành một kết quả xếp hạng.

Chỉ thay kỷ lục khi comparator kết luận kết quả mới tốt hơn; thất bại gửi không làm mất local hoặc cản chơi. Retry dùng cùng ID và key kỷ lục, có backoff/cap và guard UID/rulesVersion. Nhiều tab/thiết bị gửi cùng bảng phải so với bản tốt nhất hiện có, không để kết quả chậm hơn ghi đè. Đề xuất transaction đọc một entry rồi conditional update; tính cả reads/retry vào budget.

Save cũ chưa đo duration hoặc runScore không đủ để dựng thành tích này: giữ sao/điểm/tiến trình cũ và để kỷ lục thời gian trống, không suy từ countdown, ngày lưu hay totalScore. Chuẩn bị phép đo/kỷ lục local trong gate dữ liệu bản đồ để kết quả mới có thông tin trước khi Auth được thêm; không backfill thời gian giả cho các màn đã chơi.

Session cũ đang dở thiếu duration/run metadata vẫn có thể tiếp tục gameplay và nhận tiến trình/thưởng theo contract đã chốt, nhưng chưa đủ dữ liệu để gửi thành tích của attempt/run đó. Không mặc định elapsed = 0 rồi chỉ đo phần sau resume, hoặc lấy tổng kỷ lục làm điểm các màn trước. Lượt mới có metadata đầy đủ mới dùng để xếp hạng; chính sách compatibility cần được thống nhất ở gate dữ liệu, không reset session cũ trong task lập kế hoạch.

Offline giữ kỷ lục local và được gửi lại khi online theo lựa chọn đã xác nhận. Queue có identity/profile/rulesVersion và chỉ cập nhật best; không gửi queue của tài khoản trước sang tài khoản sau chỉ vì UI đổi người dùng. Không gọi dữ liệu từ client/save là gameplay đã xác minh.

### 12.5. Auth, dữ liệu công khai và bảng

- Guest dùng Anonymous Auth; Google link thành công giữ UID. Mỗi UID có một entry tốt nhất trên mỗi bảng. Điều này là một entry mỗi tài khoản, không bảo đảm một tài khoản mỗi con người hoặc một guest qua mọi thiết bị.
- Đề xuất đường dẫn theo environment → leaderboard(boardId) → entries(uid). boardId chứa rulesVersion + game + mode + level cho màn thường; bảng lượt đặc biệt dùng rulesVersion + game + mode. Chỉ tạo entry khi có kết quả, không tạo sẵn mọi bảng cho mọi chặng.
- Entry công khai chỉ có tên hiển thị/avatar ID được phép, thành tích và metadata cần sắp xếp. Không đưa email, Google credential, session snapshot, Xu/vật phẩm hoặc save riêng vào entry. Chốt giới hạn tên, fallback và xử lý nội dung hiển thị trước code; không render tên như HTML.
- Saves riêng vẫn chỉ UID chủ sở hữu truy cập; leaderboard có rules đọc/list riêng. Người dùng chỉ ghi entry của UID mình, field/type/version/range hợp lệ và metric mới không được kém bản cũ. Giới hạn query/page size, index và environment phải kiểm chứng bằng Emulator.
- Chọn local/cloud cho save không tự rollback/xóa public best trên server. Account linking gặp Google UID khác cần quy tắc ownership/chuyển entry riêng; không tự union hoặc chuyển entry sang UID khác bằng client khi chưa có quyền/contract.
- Mở màn Xếp hạng từ menu chính, chọn trò/nhóm; nhóm thường chọn độ khó/màn. Không thêm bộ lọc hoặc nút tìm màn lên bản đồ. Giữ gameplay hiện hữu; không dựng lại HUD để hiển thị thứ hạng.

### 12.6. Hai phương án backend và mức tin cậy

**Phương án A — đã chọn: Firebase free, client gửi kỷ lục + Rules.** Auth, giới hạn dữ liệu, comparator/transaction, query có limit và theo dõi usage. Có thể bổ sung App Check sau khi đo quota/provider. Hạn chế đã được nêu và người dùng chấp nhận cho bản đầu: browser có thể sửa thời gian/điểm trước gửi; Rules và App Check không replay hoặc chứng minh gameplay. Bảng mọi thời gian, có nhận lại kết quả offline.

**Phương án B — backend xác minh lượt.** Server cấp run/seed, nhận log sự kiện hoặc bằng chứng phù hợp từng trò, kiểm tra hành động/điểm/trình tự rồi mới ghi bảng. Ownership công khai tốt hơn nhưng có chi phí compute, lưu log, replay và chống retry; đo thời gian/thao tác phía client vẫn có giới hạn chống gian lận. Đây là task riêng, không cài mặc định vào bản đồ/Auth. Triển khai Cloud Functions for Firebase cần gói Blaze; không coi free quota của Blaze là Spark hoặc là cam kết không phát sinh phí.

Theo Firebase, [Rules](https://firebase.google.com/docs/firestore/security/rules-conditions) kiểm tra identity/data; [App Check](https://firebase.google.com/docs/app-check) bảo vệ nguồn request và chỉ giảm một số kiểu lạm dụng. Suy luận thiết kế: hai lớp này không đủ xác minh thành tích game chạy trên client. [Cloud Functions](https://firebase.google.com/docs/functions/get-started) yêu cầu Blaze để deploy. Không tự nâng billing, tạo service hoặc hứa chống gian lận tuyệt đối trong kế hoạch này.

### 12.7. Quota và phạm vi bản đầu đề xuất

- Đề xuất bảng mọi thời gian trước; chưa thêm daily/weekly reset, mùa giải, thưởng theo hạng hoặc bảng tổng hợp ba trò. Thống kê DAU/WAU/MAU là hạng mục Analytics khác, không buộc bảng xếp hạng phải có chu kỳ đó.
- Chỉ đọc bảng người dùng đang xem: top 20 + một entry cá nhân, cache ngắn theo boardId/environment/version, refresh theo thao tác có debounce. Không listener realtime mặc định, không tải toàn bộ người chơi/màn/chặng. Một kết quả hoàn tất chỉ ghi nếu là kỷ lục tốt hơn; không ghi theo click thẻ/tick.
- Đề xuất hiển thị top và Kỷ lục của bạn; nếu cần hạng chính xác ngoài top, dùng query count các kết quả tốt hơn thay vì tải toàn collection. count là request riêng có chi phí và consistency cần xem xét; không gắn ordinal giả khi chỉ biết top 20.
- Budget giả định 100 DAU × 5 lần mở bảng mới × 21 document reads ≈ 10.500 reads/ngày trước cache, index/rules reads, transaction/retry và sync. Giả định 5 kỷ lục mới/người/ngày ≈ 500 entry writes/ngày, cộng writes sync riêng; không phải mọi lần thắng đều là kỷ lục.
- Theo [Firestore pricing](https://firebase.google.com/docs/firestore/pricing), Standard có free quota 50.000 document reads/ngày, 20.000 writes/ngày và 1 GiB storage tại thời điểm kiểm tra. Đây là quota chung database/project dùng cho sync và xếp hạng, không cấp riêng cho mỗi site/bảng. Số người thấp không tự bảo đảm đủ quota nếu đọc lặp, abuse hoặc lịch sử tăng.
- Dung lượng tăng theo số bảng đã chơi, không chỉ số người hiện tại. Ví dụ giả định 100 tài khoản đều chơi đủ 3 trò × 4 độ khó × 100 màn: tối đa 120.000 entry màn thường cho một chặng. Giả định 500 byte payload/entry là khoảng 60 MB trước overhead tên document/index và saves; đây là minh họa tăng trưởng, chưa đo kích thước thực. Đọc top 20 không có nghĩa chỉ lưu 20 entry. Cần đo cả dữ liệu và index trước quyết định lưu lịch sử bảng nhiều chặng.
- rulesVersion tách bảng khi luật tính thời gian/điểm/cấu hình làm thành tích không còn so sánh được. Tải tài nguyên và đời sống bảng version cũ phải có chính sách trước khi số bảng tăng lâu dài; không xóa hoặc cắt tiến trình/claim để giảm dữ liệu công khai.

## 13. Gate triển khai đề xuất

Đã được giao toàn bộ phase 0–8 và commit riêng mỗi phase. Thứ tự dependency: dữ liệu + bản đồ → Auth/sync → xếp hạng online. Nhiệm vụ, luật thua Vô tận Memory/Link, mạng quảng cáo thật và nâng billing không nằm trong các phase. Các dịch vụ/cấu hình bên ngoài bắt buộc chưa có phải được nêu khi xác minh, không đánh dấu pass bằng placeholder.

| Gate | Kết quả phải bàn giao | Bằng chứng hoàn thành |
| --- | --- | --- |
| 0 — Chốt menu/map/dữ liệu | Menu chính/bản đồ; gameplay giữ nguyên + hàng nút đáy; resume/replay; economy rương; contract save và các quyết định xếp hạng còn chờ | Người dùng chốt behavior/art; tài liệu không xung đột; không dùng gameplay mockup thay runtime |
| 1 — Tiến trình/launch/kỷ lục local | Completion/mode, N+3, rương, chặng; launch/replay/resume; duration/run metadata và comparator thuần | Unit/contract; save fail/rollback; 9/10/11, 99/100/101; timer pause/resume/Freeze; không đổi luật hoặc cấp lại hỗ trợ |
| 2 — Navigation/menu | Header/content; bốn tab đáy đồng nhất; capability shop/collection; mode/theme riêng; vùng quảng cáo menu | Back/return giữ context; session ở mode khác; keyboard/focus; không popup nhân đôi; gameplay không có vùng quảng cáo |
| 3 — Map | Một chặng 110 node, mode patch, preview, resume/replay, rương/chuyển chặng | Layout/scroll/focus; khóa/mở/sao rõ trên node; không có nút tìm màn; resource/DOM ổn định; chơi liên tục thuận tiện |
| 4 — UI/cảnh chiến thắng | Token/surface thống nhất; hoa nhiều lớp nếu hạng mục được giao | Visual review; reduced-motion; spam đóng/mở/chạm; lifecycle và asset budget |
| 5 — Auth/sync | Guest backup, Google link, chọn bản, offline/conflict/quota nếu hạng mục được giao | Emulator/rules; 2 tab/2 thiết bị; fail/recovery; operations/payload đo thật |
| 6 — Xếp hạng online | Bảng/entry public tách saves; submit best, danh sách giới hạn/cache, guest/Google, version và chính sách trust nếu được giao | Emulator ownership/validation/query; tie/comparator; terminal/retry không lặp; offline/UID conflict; quota operations đo thật |
| 7 — Analytics/tải | Báo cáo người chơi/playtime; cache/load nếu hạng mục được giao | DebugView; loại test traffic; event không lặp; cold/warm transfer |
| 8 — Nghiệm thu | Review sau implementation, kiểm tra tổng thể và cập nhật tài liệu | npm run check/build; suites tương xứng; thiết bị mục tiêu; diff đúng phạm vi |

Gate là checkpoint, không mặc định là ranh giới kết thúc lượt. Yêu cầu hiện tại giao toàn kế hoạch: thực hiện tuần tự các phase đã giao, kiểm tra, review và commit từng phase; không dừng sau phase trung gian. Không tự nâng billing, deploy Hosting, gắn mạng quảng cáo thật hoặc thêm nhiệm vụ.

### Theo dõi triển khai

| Phase | Trạng thái | Bằng chứng/commit |
| --- | --- | --- |
| 0 | Pass — phạm vi và quyết định sản phẩm đã chốt | Commit a7e4579; baseline check/build pass |
| 1 | Pass — persistence v2, progression, launch, rewards, timing/run | check/build pass; 6 browser data/cleanup pass; review độc lập không còn finding |
| 2–8 | Chưa bắt đầu | Không đánh dấu pass bằng kết quả baseline |

Firebase (2026-10-13): người dùng đã tạo `(default)` ở `asia-southeast1`; CLI xác nhận Firestore Native Standard, `freeTier=true`. Chưa deploy Hosting hoặc thay billing.

Baseline trước sửa (2026-10-13): Chrome headless 412×915, không overflow; frame gồm cả khay của Triple. Memory Easy/Super Hard còn lần lượt 460/113px dưới frame; Link 459/115px; Triple 134/269px. Đây là bằng chứng bố cục hiện tại đủ chỗ cho một hàng nút gọn ở portrait, chưa là pass của hàng nút mới, landscape hoặc khay mở rộng. Các phép đo dùng browser context mới, không thay dữ liệu người chơi.

## 14. Ma trận kiểm chứng bắt buộc khi triển khai

- Logic: N+3 chơi đảo thứ tự; completion 0 sao; mode khác mở chung; rương không nhận lặp; đủ 10 đúng nhóm; missing level; chặng trước/sau; replay level rất cao không dựng toàn lịch sử.
- Gameplay regression: luật thắng/thua, timer, combo, inventory, hỗ trợ tự động, restart/resume và kết quả sao/điểm giữ contract hiện hữu; chọn lại màn không cấp lại quà đầu màn.
- Data: rollback đa miền, quota/network/storage fail, stale result sau đổi UID/mode/round, hai tab/thiết bị, dữ liệu chưa sync, chọn local/cloud, account-linking collision.
- Timing: không tính loading/intro trước ready hoặc resolve sau clear; pause/menu/tab ẩn; resume sau reload; cộng giờ/Freeze không làm giảm duration; timer callback trễ; restart và stale outcome; không ghi theo tick.
- Run ranking: điểm cộng dồn đúng lượt, gồm màn cuối; không lấy totalScore/bestByLevel; clear/Next chuyển điểm đúng một lần; hết giờ rồi mua tiếp giữ cùng run và không gửi sớm; Chơi lại giữ eligibility, thay điểm màn hiện tại chứ không cộng thêm; restart màn 10 rồi kết thúc 15 gửi đúng lượt; session cũ thiếu metadata không tạo thành tích giả; mất mạng/retry không cộng/gửi hai lần; thua khác clear; Triple Thử thách hoàn tất 7; replay sau run đã chốt không mở lại run cũ; chưa có bảng Vô tận Memory/Link; hỗ trợ được phép.
- Public data/ranking: fast/slow/tie, đồng hạng và order ổn định, hai tab gửi best, attempt snapshot không trộn; write UID khác/field lạ bị chặn; tên được escape; read save riêng bị chặn; query limit/index/cache; count rank ngoài top nếu được giao; test/beta không vào production; old save thiếu duration giữ tiến trình và không tạo time record giả.
- UI/lifecycle: baseline 412×915 và desktop; portrait/landscape theo phần liên quan; keyboard/focus/safe-area; reduced-motion; nhiều chu kỳ mount/restart/mode/scene; cap particles/DOM/cache.
- Performance: so sánh cold/warm load, map mount/scroll/mode switch, board generation, HUD update, scene idle/touch; frame time/long tasks/memory/resource plateau và transfer. 60 FPS là mục tiêu đo, chưa tuyên bố pass.
- Gates cuối: npm run check, npm run build, Playwright regression tương xứng shared owners, review diff ngoài scope và đối chiếu acceptance. Không chạy check/build để suy gameplay đã cân bằng.

## 15. Nguồn và bằng chứng hiện tại

- CONTEXT.md, gameCatalog.js, gameState.js, persistence.js, sessionProgress.js, sessionTiming.js.
- config.js/logic.js/grid.js; linkConfig.js/linkBoard.js/linkController.js; tripleConfig.js/tripleBoard.js/tripleRules.js/tripleState.js/tripleController.js.
- victoryCelebration.js, victoryFlowerSourceTemplate.js và CSS victory; public/sw.js, pwa.js, firebase.json/.firebaserc.
- Code inspection trước đó: 202 phần tử trong markup nguồn hoa, nhiều infinite animation và blur/filter; timer/RAF/audio callback chưa được cancel đầy đủ. Đây là risk inventory, không phải FPS/memory benchmark.
- [Firebase Anonymous Auth](https://firebase.google.com/docs/auth/web/anonymous-auth), [Account linking](https://firebase.google.com/docs/auth/web/account-linking), [Firestore rules](https://firebase.google.com/docs/firestore/security/rules-conditions), [Firestore quotas](https://firebase.google.com/docs/firestore/quotas), [Analytics](https://firebase.google.com/docs/analytics), [Hosting quota](https://firebase.google.com/docs/hosting/usage-quotas-pricing).
- Xếp hạng (kiểm tra ngày 2026-10-12): [Firestore order/limit](https://firebase.google.com/docs/firestore/query-data/order-limit-data), [Aggregation count](https://firebase.google.com/docs/firestore/query-data/aggregation-queries), [Firestore pricing/free quota](https://firebase.google.com/docs/firestore/pricing), [App Check và giới hạn bảo vệ](https://firebase.google.com/docs/app-check), [Cloud Functions yêu cầu Blaze](https://firebase.google.com/docs/functions/get-started).

Phase 1 đã triển khai runtime/schema local, chưa cấu hình Auth/rules Firebase, chưa đo FPS hoặc cân bằng gameplay. Kết quả test runtime ghi trong CONTEXT là lịch sử, không đại diện cho tính năng đề xuất.
