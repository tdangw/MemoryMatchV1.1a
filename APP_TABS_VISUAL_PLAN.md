# Kế hoạch mỹ thuật năm tab và bố cục Profile/Cài đặt

Ngày2026-10-15. Đã hoàn tất phase0–5; hồ sơ nghiệm thu, không còn kế hoạch triển khai active. Người dùng đã giao triển khai toàn bộ và commit từng phase. Thực hiện tuần tự phase0–5, không dừng ở gate trung gian.

## 1. Phạm vi

- Bốn nền mới cho Nhiệm vụ/Bạn bè/Profile/Cài đặt; giữ Vườn đêm Xếp hạng làm chuẩn nét vẽ/ánh sáng/chất liệu.
- Profile/Cài đặt gọn, chuyên nghiệp, thao tác ở trong luồng cuộn; dock/header giữ owner hiện tại.
- Xếp hạng bỏ nút refresh thường trực, fresh khi mở, menu vừa nội dung, family xuống heading và độ nổi nhẹ.
- Không XP/avatar upload/tính năng xã hội hay nhiệm vụ mới. Không đổi ranking v3, luật game, save/Auth/sync, UID, privacy owner/admin, điểm/sao. Không Hosting/APK/Firebase rollout.
- Không đổi nền Home/map/gameplay hoặc các tab Cửa hàng/Bộ sưu tập theo ngữ cảnh map. Nền cho Nhiệm vụ/Bạn bè không có nghĩa triển khai thêm tính năng đang hoãn.
- Không copy kỹ thuật/nội bộ/hướng dẫn thiết kế trong app. Không dùng dữ liệu mockup làm dữ liệu runtime.

## 2. Baseline trước triển khai và owner

- `js/accountPanel.js`: input và Lưu tên luôn mở, status rời danh tính, Google ở modal footer. `renderState` đang tìm button trong footer: bố trí mới phải đổi reference và lifecycle cùng nhau, không chỉ đổi CSS. Giữ dispose/subscription idempotent.
- `js/settings.js`: chuyển controls DOM vào screen/modal, trả về home khi hủy. Help/Reset tạo ở actions footer: phải chuyển đúng owner vào content, không clone controls/listeners.
- `js/leaderboardPanel.js`: menu hardcode200px; family lặp dưới game; refresh có DOM/listener riêng; mount gọi `load()` chưa ép fresh. Bỏ nút phải đi cùng fresh-on-open.
- `styles/leaderboard.css`: heading ba vùng; giữ body rank/avatar/name/level alignment khi đổi heading.
- `appNavigation/appPageLifecycle/modal`: screen/dock và pause modal có vòng đời khác; lớp nền chỉ thuộc screen, không rò gameplay.
- `profileStatsService/Model/Store`: ngày Auth, ngày profile local, trackedSince khác nghĩa; không gộp hoặc sửa số để đẹp bố cục.

## 3. Bộ mỹ thuật

| Tab | Cảnh nền | Bố cục |
|---|---|---|
|Nhiệm vụ|Góc hành trình, sổ/bản đồ ở rìa vườn|Tâm xanh tối sạch|
|Bạn bè|Sân vườn, ghế và đèn ấm ở xa|Không người/avatar giả|
|Profile|Góc lưu niệm cạnh cửa sổ|Khung trống ở mép, không huy chương giả|
|Xếp hạng|Vườn đêm hiện hữu|Giữ asset hiện hành|
|Cài đặt|Góc nghỉ tĩnh, vòm và đèn nhỏ|Ít tương phản nhất|

- Deep teal/navy, lá xanh, vàng ấm tiết chế, ánh sáng trên trái, nét vẽ mềm có khối. Trang trí ở mép/trên; tâm sạch và crop portrait/landscape được.
- Panel gần kín, viền sáng trên/cạnh tối dưới và shadow ngắn. Primary button cạnh2–3px CSS; nhấn dịch1px. Toggle rãnh chìm, núm có khối; slider/input native được style chung. Không làm từng row thành button nổi lớn.
- Raster dành cho nền và art lá vàng trang trí header/popup. Frame/button/toggle/icon đơn giản tiếp tục DOM/CSS/SVG từ hệ hiện có. Không bitmap chứa chữ, không ảnh nguyên màn dùng làm UI.
- Header/icon/spacing/type scale thống nhất. Hit44px; pager28×32 giữ quy ước cũ. Text dữ liệu là DOM, tên dài wrap/ellipsis.
- Press/open120–180ms transform/opacity hữu hạn; reduced-motion bỏ dịch chuyển, state rõ. Không loop, full-screen blur/filter mới.

## 4. Profile

1. Header Hồ sơ, đóng theo shell. Giữ tab Profile để không đổi navigation ngoài scope.
2. Hero: avatar chữ cái dự phòng không thêm save field, tên làm điểm nhấn, nhãn Tài khoản khách/Google nhỏ, bút chì sửa tên.
3. Sửa tên chỉ mở khi bấm; form có Lưu/Hủy, maxlength20 và validation cũ. Không overwrite draft bởi subscribe; busy/error/double-submit rõ.
4. Hai ô Tham gia và Thời gian chơi. Nguồn offline local dùng Hồ sơ tạo ngày, missing là—không giả0. trackedSince thành chi tiết phụ đúng nghĩa, không suy tổng từ ngày tạo.
5. Khối tài khoản: trạng thái lưu và Liên kết Google/Đổi tài khoản theo chức năng hiện tại, nằm trong content. Không email/UID public. Offline không hiển thị Đã lưu như online nếu chưa sync.
6. Đủ guest/linked/connecting/offline/error/conflict/disabled. Giữ dialog chọn bản lưu và rollback; không thêm quản lý tài khoản mới.

## 5. Cài đặt

- Âm thanh: một card hai rows có toggle/slider/phần trăm theo dữ liệu thật.
- Hiển thị: một card Hiệu ứng nền/Tọa độ bàn cờ/Tên thẻ, divider nhẹ.
- Thông tin và dữ liệu: Hướng dẫn/Giới thiệu +version/Xóa dữ liệu; xóa row cuối màu đỏ dịu, confirmation giữ nguyên.
- Cả ba card trong một vùng cuộn, không footer action ghim/spacer ép đáy. Header/dock thuộc shell.
- Pause modal giữ đồng hồ pause, đóng trả DOM về owner, Help/Reset không nhân modal hoặc unpause sớm.

## 6. Xếp hạng

- Xóa refresh DOM/listener/CSS. Mỗi mount online trang1 fresh đúng game/family, flush qua service hiện có khi phù hợp; không polling/query khi chỉ mở-hủy menu. Paging/family giữ cache bounded.
- Offline dùng cache và status ngắn. Cursor stale/reset tự về trang1 tối đa một lần/request; lỗi có Thử lại theo ngữ cảnh, không retry vô hạn hoặc refresh thường trực.
- Ba game cùng hàng, chỉ tên+▾, cùng chiều cao. Menu theo mục dài nhất+padding+selection mark, dự kiến128–152px CSS, max viewport-16; hit44px, clamp/upward/keyboard/focus/outside/resize đầy đủ.
- Heading `Hạng | Người chơi | Thử thách | Màn`: Thử thách là family động Hành trình/Thử thách/Vô tận, bên cạnh Người chơi. Đây là nhãn bảng đang xem, không metric/cột lặp từng người. Body tên dùng toàn vùng giữa.
- Mobile middle flex Người chơi+badge family; rank/level hai biên, tránh tên bị bóp. Header divider nhẹ, highlight trên/cạnh tối dưới, badge nhẹ3D; top3 giữ huy hiệu. Không thêm filter thứ hai.
- Giữ ellipsis loaded-only giữa footer, UID/generation guards, textContent và level formatvi-VN; không đổi query schema/sort.

## 7. Phương án

So sánh ảnh nguyên màn/controls có chữ với nền/art raster +component linh hoạt. Ảnh nguyên màn khó responsive/state/accessibility và dễ mờ, loại. Chọn raster ở phần mỹ thuật, DOM/CSS ở controls và chữ; không thêm framework hoặc viết lại navigation/modal. Chỉ chia token/component có ít nhất hai consumer cùng ngữ nghĩa.

## 8. Phases và commit

|Phase|Phạm vi|Gate / commit dự kiến|
|---|---|---|
|0 hiện tại|Phân tích,4nền,art,mẫu UI,manifest|Đủ hình đã xem, prompt/path/giới hạn; docs: define tab visual direction and assets|
|1|Nén nền WebP, token/surface/header và scope4screen|Crop/fallback/cache, không preload4ảnh; feat: add cohesive tab backgrounds and surfaces|
|2|Profile hero/editor/stats/account|State/owner/name draft/30cycles; feat: redesign profile layout|
|3|Cài đặt3nhóm, Help/Reset trong scroll|Screen+pause/controls/save/reopen; feat: regroup settings controls and actions|
|4|Ranking fresh/menu/heading/nhẹ3D|Query counts/offline/cursor/UID/keyboard/320px; feat: refine leaderboard controls and headings|
|5|Review riêng, target regression/check/build|Mobile/landscape/desktop/resource30cycles; test: verify tab redesign and lifecycle|

Mỗi phase triển khai một commit theo quy ước đã dùng khi được giao thực hiện. Không thêm nhiệm vụ/bạn bè/backend/gameplay tiện thể.

## 9. QA và ngân sách

- Masters/art/mockups ở `docs/design/app-tabs/`; runtime WebP sau duyệt mục tiêu≤350KB/nền, tối đa500KB nếu cần và có QA. PNG master không vào bundle. Một nền mỗi screen, reuse cache, không preload cả bộ.
- Viewport412×915/844×390/1024×900;320px vì lỗi menu/heading thực tế, font scaling/keyboard/safe-area/tên dài.
- 30cycles mount/close/tab/pause, single screen/modal, listener/timer/subscription trở baseline. Async cũ không sửa view đã hủy.
- UI account/profile/settings/navigation/ranking/layout/lifecycle; unit boundary fresh/recovery nếu tách helper. Giữ privacy owner/admin, không đổi Rules.
- Gate cuối `npm run check`, `npm run build`, `npm run build:android`. Không nhận runtime test pass từ lượt chỉ tạo ảnh/docs.
- Galaxy S22 Ultra thật vẫn chờ thiết bị theo xác nhận; desktop headless không chứng minh60FPS điện thoại.

## 10. Trạng thái

Phase0–5 đã hoàn tất và có commit riêng. Bốn nền/art đã có output runtime; Profile/Cài đặt/Xếp hạng đã triển khai. Nghiệm thu và ảnh runtime: `docs/design/app-tabs/QA.md`; masters/prompt/metadata: `docs/design/app-tabs/ASSETS.md`. Device QA thật còn chờ theo xác nhận người dùng.

## Nhật ký triển khai

- Phase0 `ac0e6ae`: chốt kế hoạch và masters.
- Phase1: nền WebP53.774–112.372bytes, flourish19.760bytes; pipeline Pillow chuyển định dạng/resize, không sinh art bằng code. CSS ownership/diffcheck pass, browser nền+navigation10/10 ở412×915,640×360,1024×900.
- Phase2: Profile editor giữ draft/cancel/failure/UID và pending action; stats không đổi nguồn. Browser profile+stats11/11, có4viewport và30cycles, syntax135module pass.
- Phase3: ba nhóm cùng scroll, action content và owner trả DOM, giữ IDs/âm thanh/handoff. Settings8/8 (4viewport,30cycles,3game paused clock) và navigation9/9 pass; pure CSS/syntax pass. Fixture đầu đã sửa đúng trigger/API/modal riêng của từng game.
- Phase4: bỏrefresh, menu128px/hit44, familyheading, retry/stale bounded. Layout15/15 và Rules/store emulator thật pass. Review phát hiện cooldown15s; đã thêm forceRefresh theo board/UID để mount/recovery thật sự lấy mới, giữ semantics refresh legacy và cache paging.

- Phase5: review độc lập19ca cópass; regression58/58chạyriêng, Settingsdelta9/9, emulatoronline6/6, fullcheck135modulepass. Resource ranking277node/6listener/0timer không tăng sau30cycles. Build web và Android wrapper pass. Settings replacement/focusdelta9/9 pass, không nới assertion. Finalcommit title `test: verify tab redesign and lifecycle`.
