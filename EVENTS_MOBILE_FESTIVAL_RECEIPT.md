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

