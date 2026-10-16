# Nghiệm thu năm tab, Profile, Cài đặt và Xếp hạng

Ngày2026-10-15. Phase0–5 hoàn tất, mỗi phase một commit. [Kế hoạch](../../../APP_TABS_VISUAL_PLAN.md), [tài nguyên/prompt](ASSETS.md).

## Kết quả sản phẩm

- Bốn nền mới cùng thế giới Vườn đêm, tải theo tab,53.774–112.372bytes/ảnh; flourish384×128 giữ alpha19.760bytes. Masters ngoài bundle. Không thay nền Home/map/gameplay.
- Profile hiển thị danh tính, sửa tên khi bấm, Lưu/Hủy, hai ô ngày/thời gian và account action trong content. Draft không mất do status update, UID đổi loại draft cũ, async sau close không sửa view.
- Cài đặt3nhóm, Help/Reset cùng scroll, không action footer ghim. Native sliders44px có rãnh/fill/thumb được style; toggles44px và reduced-motion. Giữ IDs/audio/save và pause/handoff3game.
- Xếp hạng bỏrefresh, menu128px vừa3mục/hit44, game không lặp family; familybadge cạnh Người chơi. Header divider/độ nổi nhẹ, pager nhỏ ở giữa. Fresh ở mount/UID/recovery; cache paging vẫn bounded và offline giữ cache riêng UID/board.
- Không XP, chức năng xã hội/nhiệm vụ mới, dữ liệu minh họa, đổi save/schema/ranking/Auth/privacy hoặc deploy. API store bổ sung forceRefresh mặc địnhfalse tương thích; refresh cũ giữ cooldown.

## Phương án và findings

Chọn art raster +DOM/CSS linh hoạt thay ảnh nguyên màn có chữ. Không thêm framework, modal/navigation viết lại hoặc animation loop.

Review độc lập phát hiện refresh:true vẫn bị cooldown15s của store, nên mount chưa fresh thật. Đã bổ sung forceRefresh riêng đúng cache key, có emulator store thật và bài hai browser với Date.now cố định: thiết bị A mở lại nhận level mới từ B mà không đợi cooldown. Stale recovery cũng dùng đường này và chỉ retry1lần.

Review đọc diff và chạy lại19ca Profile/Cài đặt/nền (4viewport,30cycles,3pause clocks), pure syntax135module/CSS ownership pass, không còn finding blocker. Đã xem ảnh runtime Profile/Cài đặt412.

## Bằng chứng

|Gate|Kết quả|
|---|---|
|Phase1 nền+navigation|10/10, lazyload và Home isolation|
|Phase2 Profile+private stats|11/11, name draft/error/UID và30subscriptions cycles|
|Phase3 Settings|8/8; navigation9/9;3game pause→Help clock không tăng|
|Phase4 leaderboard layout|15/15,9board/4viewport/menu/loaded-only pager/offline/stalebounded/30cycles|
|Phase4 emulator store/Rules|Pass: force cachemiss+reuse, legacy refresh, cursors/ownership/public limits|
|Online emulator cuối|6/6: Profile name vàGoogle state, hai thiết bị fresh board dưới cooldown;4Auth/sync regression|
|Independent review|19ca cuối có kết quảpass; syntax/CSS pass, finding cooldown đã đóng|
|Regression cuối|58/58 ở lượt chạy sạch; sau delta replacement/focus Settings,9/9pass gồm10vòng close-pending/reopen và4viewport focus|
|npm run check|Pass135module và toàn bộ contracts; Triple Easy p95 10,78ms,28high-level witnesses max132,61ms trên Node desktop|
|npm run build / build:android|Pass cả hai; chỉ tạo dist, không cap sync/APK/Hosting|

Lượt đầu58ca có54pass,3teardownENOENT do các Playwright process cùng xóa thư mục trace và1idleFrameP95 vượt25ms trong lúc chạy đồng thời. Không bỏ/nới assertion: chạy lại riêng khi các tiến trình khác đã kết thúc, output `test-results/root-tabs`:58/58pass, gồm idleFrameP95≤25ms của harness khi chạy riêng. Không nới assertion hoặc nhận kết quả này là FPS điện thoại. Lượt review có cùng artifact conflict đã rerunaffected thành công. Fixture mới Settings ban đầu dùng sai trigger/API/modal riêng; đã sửa theo owner thật và8/8pass, không thay gameplay để chiều test.

30cycle ranking giữ277node,6owner listener và0timeout/interval/frame trước/sau, ảnh nền tải1lần; [dữ liệu thô](qa/level-ranking-30-cycles.json). Đây là browser Windows headless, không phải phép chứng minh FPS/memory điện thoại.

## Hình runtime

- [Profile412](qa/profile-412.png), [Cài đặt412](qa/settings-412.png), [Cài đặt actions](qa/settings-actions-412.png).
- [Profile320](qa/profile-320.png), [Cài đặt ngang844](qa/settings-844.png), [Profile desktop1024](qa/profile-1024.png).
- [Xếp hạng](qa/mobile-level-challenge.png), [menu gọn](qa/mobile-family-menu.png), [ngang](qa/landscape-level.png), [fallback](qa/background-fallback.png).

Ảnh Profile local dùng Firebase disabled để chứng minh fallback đúng nguồn ngày; Google/name thật được kiểm bằng emulator. Dữ liệu xếp hạng trong layout screenshot là fixture, không seed runtime/production.

## Commit

|Phase|Commit|
|---|---|
|0|ac0e6ae docs: define tab visual direction and assets|
|1|59eb0c3 feat: add cohesive tab backgrounds and surfaces|
|2|2412685 feat: redesign profile layout|
|3|cddd284 feat: regroup settings controls and actions|
|4|1339c67 feat: refine leaderboard controls and headings|
|5|Commit nghiệm thu, title test: verify tab redesign and lifecycle|

## Giới hạn

Galaxy S22 Ultra thật vẫn chờ thiết bị theo xác nhận của người dùng. Google hosted popup/OAuth, dashboard admin ngoài repo và phát hành Hosting/APK không thuộc lượt này. Không deploy Rules/indexes vì không đổi backend. Không nhận idle browser threshold là60FPS trên điện thoại.

Final delta Settings: display sau openAppModal để olddestroy không ẩn sharedcontrols khi thay cùngID; focus controlenabled/panel sau khi hiện. Review độc lập xác nhận logic,9/9browserpass sau sửa cuối.

## Tinh chỉnh sau nghiệm thu — 2026-10-15

Phạm vi: sửa tên trực tiếp trong hàng danh tính; làm rõ ngày theo dõi thời gian; canh giữa family; huy chương top3 và số thường không khung; chống chói tiêu đề và gắn exit vào góc phải thanh tiêu đề trên cả5tab. Không đổi API/schema/save, Auth, luật xếp hạng hoặc dữ liệu riêng tư.

Chọn giữ DOM/handler exit hiện tại và đổi bố cục tại owner CSS, thay vì dựng nút thoát/handler thứ hai. Header60px và exit56px dùng cùng safe-area, host640px; exit nằm ngoài vùng cuộn. Huy chương mở rộng hệ icon SVG hiện có, giữ số thật và nhãn hạng cho trình đọc màn hình. Không thêm raster/animation/timer.

- Profile: bút ngay cạnh tên, đổi thành dấu xác nhận; Enter lưu và Hủy khôi phục tên. Draft/error/UID/busy/dispose giữ contract cũ. “Tính từ…” nằm trong ô thời gian chơi, chỉ ngày bắt đầu theo dõi; ngày tham gia vẫn từ Auth. Trạng thái synced/disabled không hiện thông báo thường trực; pending/offline/error vẫn hiển thị.
- Xếp hạng: family canh giữa header, không chạm nhãn ở320px; top3 huy chương vàng/bạc/đồng có ruy băng, hạng4+ số sáng không khung. Không đổi thứ tự hoặc query.
- Cả5tab: thanh tiêu đề tối che ánh nền; exit vuông gắn góc phải, đứng yên khi cuộn, vẫn trở về Home. Không ảnh hưởng nút gameplay/map.

| Kiểm tra | Kết quả |
|---|---|
| Profile/layout/stats, ranking và tab regression |32/32 trước delta exit;11/11 Profile+stats sau đặt ngày vào ô thời gian |
| Delta huy chương |16/16 leaderboard layout |
| Delta exit và regression cuối |31/31: app-tabs9, leaderboard16, profile6;320/412/844/1024 và cả5tab |
| Accessibility cuối |1/1 huy chương có role img và nhãn Hạng1 |
| Firebase emulator |2/2: lưu tên guest/Google state và hai thiết bị mở lại bảng fresh |
| Lifecycle ranking30vòng |277node,6listener,0timer/interval/frame trước/sau; ảnh tải1lần |
| Review độc lập |CSS ownership/diff pass; finding accessibility đã đóng, không còn blocker |
| npm run check |Pass135module và toàn bộ contracts; Easy p95 10,40ms,28high-level witnesses max103,70ms trên Node desktop |
| npm run build / build:android |Pass cả hai; không cap sync/APK/Hosting |

Ảnh runtime: [sửa tên trực tiếp](qa/profile-editing-412.png), [Profile](qa/profile-inline-412.png), [Cài đặt và exit](qa/settings-412.png), [huy chương/canh giữa](qa/mobile-level-challenge.png). Screenshot layout dùng fixture, không đưa dữ liệu mẫu vào sản phẩm. Đã xem ảnh runtime; Galaxy S22 Ultra thật vẫn chờ thiết bị theo xác nhận người dùng. Số đo Node/browser không phải nghiệm thu FPS điện thoại.

## Bỏ dòng ngày theo dõi — 2026-10-16

Bỏ node và render “Tính từ…” trong Profile; chỉ còn ngày tham gia/tạo hồ sơ và tổng thời gian chơi. Không ẩn bằng CSS, không đổi trackedSince, counter, service, subscription hoặc save. CSS account-play-since vẫn dùng cho trạng thái lỗi aria-live. Kiểm tra mục tiêu5/5:4viewport320/412/844/1024 và tổng thời gian3trò giữ sau reload. Review độc lập1/1 approve; trackedSince vẫn>0, tổng96000ms không thay. Ảnh profile4viewport đã cập nhật và kiểm trực quan.

Cổng cuối cho thay đổi này: npm run check, npm run build và npm run build:android đều exit0; git diff --check đạt. Không deploy/đổi API hoặc dữ liệu lưu.

## Sự kiện thay Bạn bè — 2026-10-16

Đổi dock action thành events, nhãn/tiêu đề Sự kiện và biểu tượng lịch SVG cùng hệ icon. Trang events-screen vẫn Sắp ra mắt; chưa thêm luật/module/network sự kiện. Đổi các scope CSS header/title/nền và test điều hướng, tái sử dụng friends-courtyard.webp để giữ pipeline/asset hiện tại. Không giữ alias route Bạn bè vì navigation không lưu bền; không đổi schema/save/Auth.

UI36/36 đạt: mobile hẹp/phổ biến, landscape/desktop, header exit/selected/background, chuyển tab/map, profile/settings pending actions và30cycles ownership. Event title/icon/current và không còn Bạn bè được kiểm trực tiếp. Đã xem [ảnh Sự kiện412](qa/events-412.png); các ảnh Profile/Settings cập nhật nhãn dock. Fixture app-tabs-online đổi selector sang events nhưng không chạy emulator trong task trình bày này; không sửa logic Firebase.

Review độc lập Sự kiện3/3 đạt, approve không finding:412/640ngang/1024, title/icon/active, không còn Bạn bè, owner baseline không tăng, pageerrors rỗng.

Cổng cuối cho tab Sự kiện: npm run check, npm run build và npm run build:android đều exit0; git diff --check đạt. Không deploy, không thay schema/save hoặc endpoint.
