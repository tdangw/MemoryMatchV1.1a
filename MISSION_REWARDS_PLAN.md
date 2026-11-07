# Nhiệm vụ và điểm danh — 07/11/2026

Phạm vi riêng task nhiệm vụ; không gom ACCOUNT_RELEASE/ads/Android đang dở.

Quyết định đã duyệt:
- Ô điểm danh bấm nhận trực tiếp, sáng khi nhận được; các ô còn lại khóa/mờ,
  ô đã nhận có dấu kiểm. Không nút nhận riêng hay trạng thái chữ dưới ô.
- Ngày1..7:10/10/15/15/20/25/50Xu. Ngày1..6 thêm1hint lần lượt
  Link/Memory/Triple/Memory/Triple/Link. Ngày7 mở ngay gói3hỗ trợ, mỗi trò
  một món chọn đều trong danh sách hỗ trợ hiện có. Nếu đầy kho, giữ toàn
  bộ kết quả để thử lại, không mất lượt/không bốc lại.
- Ngày hoàn thành đủ3nhiệm vụ mở rương10Xu+1vé, không cần nhận từng quà.
  Tuần đủ4nhiệm vụ mở rương50Xu+2vé. Rương bấm nhận, có mở rương/loot/toast.
  Giữ bảo toàn thưởng chưa nhận khi đổi ngày/tuần như runtime hiện có.
- Chỉ thanh “Nhiệm vụ đã hoàn thành” và rương bên phải; không mô tả thừa.
- Giữ LOGIN legacy, save Spark.version1, không cấp bù quà cho ngày đã nhận.
  Receipt điểm danh mới có phiên bản/operation/day/index/supports để kiểm
  tra và phục hồi. Entropy/candidate lưu trước publish; CAS/replay không
  nhận trùng; animation chỉ trình bày sau commit.

M1: cấu hình thuần, model/service/receipt và kiểm thử dữ liệu/replay/đầy kho — đạt.
M2: source-generated rules; emulator chặn receipt/bonus giả; giữ receipt cũ — đạt.
M3: UI, dấu chấm, mở rương/loot, responsive/reduced-motion/cleanup; review,
check/build phù hợp và commit từng phase. Cập nhật context. Rules chỉ phát
hành phần nhiệm vụ, giữ nguyên phần production khác; không Hosting/APK.

So sánh hai cách gói hỗ trợ: thêm loại rương tồn kho hoặc mở ngay một
transaction. Chọn transaction vì đã duyệt mở ngay; không mở rộng CHEST_TYPES.
Quà đầy kho giữ trong pending operation hiện có, không thêm kho trạng thái
thứ hai. Mọi món được kiểm tra dung lượng trước khi đổi ngày điểm danh.

Bằng chứng M1/M2:60unit trong phạm vi đạt;2service browser Firebase cục bộ
đạt (nhận đúng1lần/khôi phục mất phản hồi/giữ toàn bộ khi kho đầy).
Emulator nhiệm vụ:7ngày hợp lệ,140yêu cầu giả bị từ chối; wheel29receipt
và13yêu cầu giả bị từ chối; baseline liveops và ghép chữ13valid/15denied đạt.
Rules nhóm claim hẹp giữ ngân sách biểu thức; không nới điều kiện thưởng.
Một kiểm tra ad promise cũ trong liveops.test.js vẫn lệch với thay đổi ads
ngoài task (0thay vì1 callback); không sửa/chặn hành vi quảng cáo ở task này.
