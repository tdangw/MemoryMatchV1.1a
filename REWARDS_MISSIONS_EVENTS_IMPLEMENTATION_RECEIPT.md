# Nghiệm thu mở rộng quà, Nhiệm vụ và Sự kiện

Nguồn phạm vi: `REWARDS_MISSIONS_EVENTS_PLAN.md` cùng bộ chuẩn bị trong
`docs/design/rewards-liveops`. Cổ tích/D0–Q1 và30quà cũ đã hoàn tất; không mở lại.

## Sửa lỗi ưu tiên — thống kê Hồ sơ,24/10/2026

Người dùng báo `Private profile statistics unavailable Error` và yêu cầu
sửa trước khi triển khai kế hoạch. Tái hiện tại normalizer: marker liên kết
đã lưu environment hiện hành như `local-waves1`, nhưng whitelist cũ chỉ có
local/test/beta/production, gây `Invalid linked profile owner` khi reload.
Contract mới được chạy trước sửa và thất bại đúng lỗi này.

Đã cân nhắc thêm cứng tám tên môi trường hoặc tái dùng nguồn season hiện có;
chọn `gameplaySpace` để giữ whitelist chính xác, không lặp suffix. Chấp nhận
đúng môi trường cũ và hiện hành, vẫn từ chối môi trường lạ/future. Chặn tạo
marker không hợp lệ ngay tại adoption; không reset/migrate/cộng lại thời gian.
Warning giữ nguyên failure path, bổ sung message để phân biệt lỗi gốc.

Phạm vi sửa: `profileStatsModel.js`, diagnostic trong `profileStatsService.js`
và regression tương ứng. Không đổi API/schema/keys, rule quyền riêng tư,
UID owner, rank, ví, gameplay hoặc bộ quà.

Đã đạt:

- `node scripts/check-profile-stats.mjs`: PASS, bao gồm8environment,
  replay/adoption, counter cũ, quota rollback, metadata pair và clock owner.
- `profile-stats.spec.js`:6/6 PASS; marker hiện hành qua3reload vẫn giữ
  60000ms, không warning/nhận lại; dữ liệu hỏng được giữ, retry đúng.
- `profile-stats-online.spec.js`:2/2 PASS với Auth/Firestore emulator;
  offline/reload, hai thiết bị cộng đúng180000ms, linking giữ ngày tạo,
  UID mới không bị kết quả/lỗi cũ sửa trạng thái.

`npm run check`: PASS khi chạy ngoài sandbox (Easy p95=10,96ms). Hai lần
trong sandbox lần lượt vấp benchmark Normal114,18ms >100ms và Easy20,68ms
>20ms; không đổi generator/ngưỡng. Benchmark không import module thống kê.
Kết quả tách môi trường cho thấy không cần sửa Triple để xử lý lỗi Hồ sơ.
`npm run build`: PASS,298modules. Cảnh báo chia chunk sound có sẵn, không
lỗi build. Tự review diff riêng sau kiểm thử: whitelist vẫn đóng, dữ liệu
marker/counter được giữ, không retry/timer mới hoặc ghi vào UID khác;
không có thay đổi ngoài phạm vi sửa thống kê. Không deploy hoặc APK/push/Hosting.

## P0 — quyết định sản phẩm đang chờ

Đã đọc review, hai proposal JSON, inventory và xem trực tiếp hai ảnh được
chọn trong `review-v1/selected-images.json`. Chưa có60sprite mới hoặc runtime
liveops. Đã hỏi ba nhóm: art/catalog/pilot, kinh tế, clock/account/backend/
facts offline. Chưa coi concept hoặc giá trị đề xuất là phê duyệt.

Giữ nguyên các thay đổi có sẵn: `CONTEXT.md`,
`ILLUSTRATED_UI_ACHIEVEMENTS_PLAN.md`, `REWARDS_MISSIONS_EVENTS_PLAN.md`;
không đưa chúng vào commit sửa thống kê.

Skill thực dùng: `clarify-ambiguous-requirements` cho các quyết định P0 còn
mở. Chưa dùng imagegen trong lượt này vì A1 chưa được duyệt.
