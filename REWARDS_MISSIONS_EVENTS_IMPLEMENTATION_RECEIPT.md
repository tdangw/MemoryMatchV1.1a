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

## P0 — đã duyệt, 24/10/2026

Đã đọc review, hai proposal JSON, inventory và xem trực tiếp hai ảnh được
chọn trong `review-v1/selected-images.json`. Chưa có60sprite mới hoặc runtime
liveops tại thời điểm chuẩn bị. Chủ dự án đã duyệt cả ba nhóm: hai concept,
toàn bộ 60 tên/brief/mapping và hai quà event; nguyên kinh tế proposal;
clock/account/backend và facts offline. Bản nguồn đã duyệt được chụp riêng
tại `design/rewards-liveops/{catalog.source,liveops.source,approval}.json`,
kèm hash nguồn chuẩn bị; không sửa hay commit tài liệu có sẵn của người dùng.

Reset ngày 07:00 Việt Nam, tuần thứ Hai 07:00, chung tài khoản ba trò.
Facts offline chỉ tính trong kỳ server đã xác nhận và gửi trước khi kỳ hết;
nhận cần mạng, nhiệm vụ đủ điều kiện chưa nhận chốt một lần khi reset.
Backend chỉ code/emulator. Pilot chung bảy ngày, chưa có ngày bắt đầu;
không tự chạy hoặc đếm ngược. Không APK/push/Hosting/backend/rules deploy.

P0 mỹ thuật duyệt concept/brief; bước mẫu avatar/khung/huy hiệu đại diện
trước sáu lô vẫn theo mục 3 của kế hoạch. Không coi ảnh concept là sprite
hoặc golden runtime. Giữ nguyên 30 mapping/receipt, sáu hiệu ứng và 300 Xu.

Giữ nguyên các thay đổi có sẵn: `CONTEXT.md`,
`ILLUSTRATED_UI_ACHIEVEMENTS_PLAN.md`, `REWARDS_MISSIONS_EVENTS_PLAN.md`;
không đưa chúng vào commit sửa thống kê.

Skill thực dùng: `clarify-ambiguous-requirements` để chốt P0; `imagegen`
ở chế độ built-in, từng món một, alpha thật và giữ nguồn/prompt khi làm A1.

## A1 — mẫu đại diện đã duyệt

Chủ dự án duyệt Sóc Thư Sinh, Trang Sách Vàng, Dấu Ấn Tri Thức làm chuẩn
và giao tiếp tục toàn bộ kế hoạch. Mẫu đã pack 512/256/128 bằng source
generator `scripts/prepare-reward-expansion.mjs`; canvas/pivot/avatarRect
theo manifest bộ cũ, không upscale. Khung được imagegen chỉnh hai lần:
thêm margin, rồi sửa lòng 838×752 vượt circularity limit cũ. Giữ ngưỡng,
không sửa PNG bằng tay hoặc dùng ảnh chân dung gộp vào khung.

Alpha/geometry: 100 cặp (10 avatar × 10 khung, gồm đồ cũ và mẫu mới) PASS,
không hở lòng/nhô chân dung ra ngoài. Đã xem nền sáng/tối, mọi avatar cũ
qua khung mới và avatar mới qua mọi khung cũ. Chưa thay cho matrix 1.156
cặp cuối. Playwright mẫu 5/5 PASS: modal Hồ sơ bốn viewport 412/320/844/
1024, ba hero và renderer chân dung 30px của BXH. Đây là QA presentation,
chưa phải đồng bộ ID mới qua hai tài khoản. Bằng chứng tại
`design/rewards-liveops/review`; chưa ghi catalog/runtime/quyền sở hữu mới.

### Bổ sung trực tiếp của chủ dự án

Sau khi tạo bộ quà, thêm bộ hồ sơ cơ bản sẵn trong kho: Chim Sẻ Nhỏ,
Vòng Gỗ Mộc, Lá Đầu Tiên. Nguồn riêng trong `cosmetic-extras.source.json`;
không chiếm mapping của 90 thành tích, không giả receipt hoặc tự đổi đồ
đang trang bị. Kiểm cuối tăng thành 35 avatar × 35 khung = 1.225 cặp.

### Lô 1 — Thư viện Ánh Sao

Đủ 10 món màn 11–20 Memory Match, PNG alpha và WebP 128/256/512.
169 cặp (13×13, gồm đồ cũ) PASS. Hươu được vẽ lại để sừng không vượt
ảnh tròn; Mây Lụa được rút ngắn ornament dưới để giữ canvas chuẩn.
Không nới ngưỡng hoặc đổi geometry cũ. Chỉ nguồn/pack/QA, chưa runtime.

### Lô 2 — Khu rừng Bốn Mùa

Đủ thêm 10 món màn 21–30 Memory Match; tổng mới 20 PNG và 60 WebP.
289 cặp (17×17 gồm đồ cũ) PASS. Sửa hạt dẻ đúng brief và thu gọn lá khung
qua imagegen; không vẽ sửa bằng code. Một lần tạo Gấu bị moderation output
từ chối, tạo lại built-in với mô tả động vật rừng rõ ràng và thành công.
Nguồn native giữ nguyên; crop theo alpha >8 của pipeline cũ, kiểm corner
alpha=0 trên sprite xuất, kiểm alpha/kích thước mọi WebP. Chưa runtime.

Trong A1 xuất hiện thay đổi gameplay/shop/cấu hình ngoài task. Giữ ngoài
commit và đã hỏi owner còn hoạt động trước khi nối facts ở các gate sau.
