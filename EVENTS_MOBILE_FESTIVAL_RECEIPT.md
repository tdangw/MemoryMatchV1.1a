# Nghiệm thu Sự kiện, Nhiệm vụ và Kho rương — 27/10/2026

## Phạm vi và quyết định

Nguồn: EVENTS_MOBILE_FESTIVAL_PLAN.md, P0–Q1; commit riêng từng phase.
Giữ điểm danh/weekly/quota wheel/recipe/bán/ghép/rương bản đồ/300 Xu/sáu effect.
Không đổi save key hoặc formatVersion 2; mở rộng model có version và capability
riêng, không tự deploy rules/Hosting/APK/push. Không sửa task drop/năng lượng.

P0: người dùng duyệt toàn bộ đề xuất còn thiếu qua câu hỏi trong chat.
50/100 Xu ở mốc 25/50; hỗ trợ chọn đều trong subpool mục 4; đầy 999 giữ
rương và candidate; pool ngoại hình Thành tích/chữ/event bỏ starter/effect;
loại rương chữ lặp 12 slot; trong ván chỉ xem; SVG tĩnh khu vườn đêm.

## Phương án

- Giữ service/CAS/persistence queue và renderer hiện có, tách owner theo
  trang/tab/kho; loại hệ quest hoặc queue kinh tế mới vì trùng quyền thưởng.
- State rương bốn counter, kết quả cuối và festival earned/cycle/mask có
  kích thước cố định; loại document/mảng theo từng rương/vòng vì tăng I/O.
- SVG/CSS tĩnh dùng token skin, không thêm animation loop hay bitmap.

## Tiến độ

- P0: đã duyệt và ghi nhận, chỉ rà diff tài liệu; không chạy test.
- U1/U2/U3/D1/D2/Q1: đang thực hiện, chưa nghiệm thu.

U1: tách owner tab Sự kiện, tablist/tabpanel bàn phím và view con Kho rương trong Bộ sưu tập. Capability festival/chest riêng mặc định tắt đến khi rules tương ứng được phát hành. Kiểm cú pháp các owner và diff đạt; tích hợp dữ liệu/UI/lifecycle kiểm ở Q1.


Đính chính P0 sau trao đổi: bỏ 12 slot/cursor. Chủ dự án duyệt mapping
cố định MEMORY MATCH→Avatar, LINK CONNECT→Khung, TRIPLE CONNECT→Huy hiệu,
ADVENTURE→Avatar. Mỗi bộ đổi một rương đúng loại; bảng bên trong giữ nguyên.

U2: wheel theo kích thước thật, hub tĩnh; 4 recipe và 17 chữ button, sheet
bán có số lượng/tổng Xu; Kho rương 4 card và chi tiết tỷ lệ/chọn trò/gallery
12 món/trang. Kiểm cú pháp/diff đạt; tích hợp command và kiểm UI ở D1/Q1.

U3: Nhiệm vụ hai tab, lịch 4+3 luôn hiện, đúng trạng thái sau ngày 7/nhận/bỏ ngày; thẻ catalog, tiến độ/bonus/weekly/điểm danh, countdown UTC một timer UI dừng khi ẩn và refresh kỳ mới có khóa chống lặp. Giữ guard ván chơi, stale UID. 13/13 unit nhiệm vụ/Spark đạt; giao diện/lifecycle kiểm chung Q1.

