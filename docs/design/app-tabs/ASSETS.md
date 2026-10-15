# Bộ mỹ thuật năm tab — bản thiết kế v1

Ngày2026-10-15. Skill đã dùng: imagegen, công cụ built-in image_gen; không dùng CLI/API fallback. Bốn nền và art đã có bản WebP runtime, Profile/Cài đặt/Xếp hạng đã áp dụng bố cục mới. [Kế hoạch hiện hành](../../../APP_TABS_VISUAL_PLAN.md).

## Tài nguyên

|Vai trò|File|Thông số|
|---|---|---|
|Nhiệm vụ|[missions-garden-master.png](backgrounds/missions-garden-master.png)|941×1672 RGB,1.81MB; sổ/bản đồ/la bàn góc trái|
|Bạn bè|[friends-courtyard-master.png](backgrounds/friends-courtyard-master.png)|940×1672 RGB,1.98MB; ghế/đèn/tách ở rìa phải|
|Profile|[profile-keepsake-master.png](backgrounds/profile-keepsake-master.png)|941×1672 RGB,1.83MB; góc cửa sổ/album/khung ảnh trống|
|Cài đặt|[settings-retreat-master.png](backgrounds/settings-retreat-master.png)|940×1672 RGB,1.72MB; góc nghỉ và đèn, vùng giữa ít tương phản|
|Xếp hạng giữ nguyên|[leaderboard-night-garden.webp](../../../public/assets/images/backgrounds/leaderboard-night-garden.webp)|Asset runtime hiện hữu, không sinh bản mới|
|Art header/popup|[botanical-header-flourish-master.png](art/botanical-header-flourish-master.png)|2172×724 RGBA,1.10MB; alpha có thật, không ảnh nền đen|
|Mẫu ba màn|[profile-settings-ranking-v1.png](mockups/profile-settings-ranking-v1.png)|1457×1080 RGB,2.04MB; tham khảo bố cục và bộ bề mặt|

Thông số MB là thập phân làm tròn. [Metadata chính xác](asset-metadata.json). [Toàn bộ prompt](prompts.json).

## Cách tạo và đối chiếu

- Bốn nền dùng nền Vườn đêm làm reference; giữ palette deep teal/navy, lá xanh, highlight vàng và ánh sáng trên trái. Mỗi lần gọi sinh một ảnh riêng.
- Flourish tạo mới với transparent_background=true. Kiểm bằng Pillow read-only: RGBA và1.136.458pixel alpha0. Không dùng code để vẽ/chỉnh ảnh.
- Mockup dùng nền Profile/Cài đặt/Xếp hạng và flourish làm reference. Tên An Nhiên, ngày, playtime và các hàng rank là fixture minh họa; không được đưa vào runtime như dữ liệu thật.
- Đã xem từng ảnh: bốn bối cảnh khác nhau, không chữ/UI trên nền, tâm tối cho content; mockup có ba màn đầy đủ, đúng nhóm, Profile không input luôn mở, không refresh, family ở heading, dock đúng tab. Phần chữ/font, pressed/focus/disabled/scroll vẫn phải dựng và kiểm trong browser, không suy pass từ bitmap.
- Menu nhỏ không mở trong mockup ghép để không che heading; kích thước theo nội dung128–152px CSS và hit44px đã ghi trong kế hoạch. Menu runtime128px/hit44px đã có ảnh trong qa/mobile-family-menu.png.
- Mockup thể hiện viền vàng rõ hơn ảnh cài đặt đầu tiên; khi triển khai dùng token chung và không copy cứng họa tiết vào từng control. Chữ DOM nên giữ font hệ thống hiện hành ở body; serif trong bitmap chỉ là đề xuất cho heading, cần đối chiếu độ đọc trước khi chọn.

## Quy trình áp dụng

1. Giữ PNG master ngoài public. Nén background thành WebP mục tiêu≤350KB, tối đa500KB có QA; palette/crop/độ đọc phải được xem lại ở kích thước thật.
2. Flourish thu nhỏ theo kích thước render (khoảng80–120px rộng), giữ alpha và kiểm fringe trên nền teal. Không tải bản2172px cho một icon nhỏ, không biến nó thành logo/avatar thành tích.
3. Panel/header/button/toggle/slider dùng DOM/CSS/SVG chung. Không dùng ảnh mockup làm UI, không bake chữ hoặc tạo button bitmap riêng cho mỗi label.
4. Một nền ứng với screen, không preload toàn bộ. Crop center giữ vùng đọc, đồ vật mép có thể mất bớt ở landscape; ảnh browser320/412/844/1024 đã lưu trong qa/ để kiểm crop thực tế.
5. Controls dùng DOM/CSS, IDs/save/Auth/privacy giữ nguyên. Kết quả runtime/check/build/review cuối ghi trong [QA](QA.md); thiết bị thật còn chờ.

## Ghi nhận

- Phase0–5 đã hoàn tất, xem QA.md.
- Không thay save/API/schema/Auth/Rules/ranking v3.
- Không thêm tính năng Nhiệm vụ/Bạn bè; hai nền chỉ là tài nguyên mỹ thuật đã được yêu cầu.


## Output runtime

Pipeline: `python scripts/prepare-app-tab-assets.py` (Pillow, chỉ resize/chuyển định dạng ảnh đã tạo bằng imagegen).

|File trong public/assets/images/backgrounds|Bytes|
|---|---:|
|missions-garden.webp|77048|
|friends-courtyard.webp|112372|
|profile-keepsake.webp|84722|
|settings-retreat.webp|53774|
|botanical-header-flourish.webp (384×128)|19760|

Các PNG master vẫn ở docs; không bị copy vào bundle. WebP là ảnh tĩnh, không thêm request theo frame/tick.
