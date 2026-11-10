# PHÁC THẢO HAI TRÒ MỚI — 08/11/2026

Trạng thái: bản phác thảo để phân tích thêm, CHƯA được giao triển khai. Tách biệt hoàn toàn với COSMETIC_UPGRADE_IMPLEMENTATION_PLAN.md; không phải kế hoạch active thay thế task ngoại hình.

## Mục tiêu đã chốt

Thêm hai nút **Match 3 Connect** và **Memory Sequence** vào menu chính, nâng tổng lên năm trò. Vào chơi tự do như ba trò hiện tại; không vé, không cửa vào Thung Lũng, không bốc ngẫu nhiên giữa các trò. Tên tiếng Anh giữ đúng như chủ dự án chốt, không đổi thành Cluster Match.

Tái sử dụng hình thẻ, mặt lưng, nền, hiệu ứng, âm thanh và các dịch vụ phù hợp. Không cần nhân vật mới. Đây là hai bộ luật riêng; không giả một mode của Link/Triple bằng các nhánh game rải trong runtime dùng chung.

## Match 3 Connect — ý tưởng cần phân tích

Chạm cụm hình giống nhau liền cạnh để xóa; các thẻ phía trên rơi xuống. Có thể dùng giới hạn lượt, mục tiêu thu thập hoặc dọn bàn. Tham chiếu cơ chế do chủ dự án mô tả gần với Swell Foop, không sao chép giao diện/tài sản.

Các quyết định chưa chốt:
- Cụm tối thiểu2hay3; nối4cạnh hay thêmđườngchéo. Tên Match3Connect đã chốt nhưng không tự suy ra ngưỡng luật.
- Chỉ rơi dọc trong cột hay dồn cột khi trống; có bổ sung thẻ mới không; có xóa dây chuyền tự động hay chỉ xóa theo lần chạm.
- Mục tiêu và kết thúc: hết lượt, không còn cụm, đạt số lượng, dọn sạch; xử lý thẻ lẻ và hỗ trợ khi kẹt.
- Cách tạo bàn có lời giải/độ khó hợp lý; nếu dọn sạch thì không sinh bàn ngẫu nhiên không thể thắng rồi gọi đó là thử thách.
- Điểm/combo/thưởng/hỗ trợ, lượng thẻ và thời gian một màn, giới hạn chuyển động/lựa chọn reduced-motion.

Hướng kiến trúc để đánh giá: model bàn và tìm cụm thuần, reducer tính xóa/rơi/kết thúc, renderer chỉ trình bày kết quả. So sánh bàn không bổ sung với bàn có refill trước khi chọn. Không dùng timeout che cập nhật sai thứ tự hoặc tạo chuỗi xóa vô hạn.

## Memory Sequence — ý tưởng cần phân tích

Phát sáng các thẻ theo thứ tự, người chơi chạm lại chuỗi. Có thể tăng độ dài, đổi vị trí hoặc nhập ngược; các biến thể chưa được duyệt.

Các quyết định chưa chốt:
- Lưới và số thẻ, có lặp thẻ liên tiếp trong chuỗi, chuỗi tăng dần hay sinh lại mỗi màn.
- Số lần được sai, thời gian trả lời, tốc độ phát và khoảng nghỉ; âm thanh có phân biệt theo thẻ hay chỉ làm tín hiệu hỗ trợ.
- Hiển thị thẻ cố định hay đổi vị trí; chuỗi thuận/ngược và thời điểm mở biến thể.
- Tắt âm vẫn phải chơi được bằng hình; không dùng màu là dấu hiệu duy nhất nếu có thể hỗ trợ thêm viền/độ sáng.
- Chính sách pause/ẩn app/quay lại khi đang phát hoặc nhập chuỗi, xem lại chuỗi, restart và kết thúc.

Hướng kiến trúc để đánh giá: state machine hữu hạn chuẩn bị → phát chuỗi → nhận đáp án → kết quả; một owner giữ timeline và input. Không nhận chạm trong pha phát; callback cũ không sửa màn mới; hủy được giữa chuỗi. So sánh bàn cố định trước với biến thể đổi vị trí sau.

## Tích hợp phải phân tích trước thực hiện

- Menu năm trò: thiết kế lại mobile/ngang/PC, không ép năm nút nhỏ vào ảnh ba nút hiện tại; giữ vùng dock/quảng cáo và nút đủ lớn, bàn phím/focus.
- Adapter game registry/shell, điều hướng vào/ra, hướng dẫn lần đầu; chọn những mode thực sự phù hợp cho mỗi game, không tự sao chép toàn bộ mode hiện có.
- Bản đồ riêng hay chọn màn khác, progression/save/reset/replay, thống kê/thành tích/xếp hạng, vật phẩm và hỗ trợ; xác định cách thêm schema/gameID mà không làm mất dữ liệu ba trò cũ.
- Chính sách Xu, quà rơi, vé quay/huy hiệu, bảng kinh tế và tránh phần thưởng lặp. Đom đóm/quầy đổi quà chưa mặc định thuộc hai trò này.
- Quảng cáo, âm thanh, background, lifecycle, reduced-motion, startup/hidden, offline và độ an toàn persistence theo owner hiện có.
- Nguồn CSS/asset có owner riêng; dùng raster đã có khi phù hợp, minh họa mới không emoji/font làm đồ họa.

## Trình tự dự kiến sau khi được giao phân tích chi tiết

1. Khóa đặc tả và acceptance từng trò, mode/mục tiêu/thiết bị, giới hạn CPU/DOM/bộ nhớ.
2. Prototype luật và bàn có lời giải; kiểm chứng độ vui/độ khó bằng một nhóm màn nhỏ trước khi mở rộng.
3. Chốt UX menu năm trò và hướng dẫn, responsive và việc chơi từng game độc lập.
4. Lập kế hoạch triển khai riêng theo owner/model/render/data/reward; ít nhất hai phương án cho lifecycle, sinh bàn và timeline.
5. Khi được giao triển khai mới sửa code theo gate, thêm migration/unit/contract/UI và đo hiệu suất thực tế.

Không dùng file này để tự triển khai hai trò trong lúc thực hiện ngoại hình. Không có ảnh/gameplay mới, API/schema mới hoặc quyền build/deploy/APK được cấp từ bản phác thảo.
