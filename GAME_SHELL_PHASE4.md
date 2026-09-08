# Game Shell — Phase 4

## Phạm vi và mốc gốc

Tiếp tục từ `d8f968d` (Phase 3). Mobile dọc vẫn là bố cục chính, giữ các vùng giao diện đã kiểm chứng. Không thêm Triple Connect, không chuyển HUD sang component hoặc đổi luật chơi.

Workspace có sửa đổi độc lập về session timing, tooltip/item name và asset trái cây. Phase 4 chỉ thay phần tích hợp shell/lifecycle trong các file chung; các sửa đổi độc lập được giữ ngoài commit phase. Mốc trước sửa: check/build đạt, 16/16 audit/geometry đạt; CSS+JS gzip 110.91 kB.

## Hợp đồng DOM

`gameShell.js` tạo các vùng semantic hoặc nhận các vùng hiện có: `title`, `progress`, `hud`, `milestones`, `frame`, `board`. API trả `refs` ổn định; root/board/HUD có role và accessible label. `mount()` tạo scope mới và hủy shell trước; `update()` cập nhật trạng thái trình bày; `unmount()` hủy tài nguyên và ẩn root, gọi lại an toàn. Board vẫn do renderer tạo/patch; cập nhật shell không dựng lại tile.

`legacyShellAdapters.js` là nơi ánh xạ ID cũ sang contract mới. Memory giữ markup trong HTML, Link vẫn dựng markup một lần; Phase 4 không di chuyển nội dung các component HUD. Hai layout adapter đọc `refs` thay vì tự tìm lại các vùng. Xóa adapter Memory trong Phase 7 và Link trong Phase 8; các consumer ID/HUD legacy còn lại chuyển ở Phase 5/7/8.

## Hợp đồng vòng đời

`gameShellLifecycle.js` quản lý cleanup, listener, timeout, interval, RAF và Web Animation. Mỗi scope có guard callback; dispose đánh dấu chết trước khi hủy, kể cả callback đã nằm trong hàng đợi cũng không chạy sang game mới. Registry bỏ mục đã hoàn tất hoặc hủy; cleanup idempotent và tiếp tục dọn các owner khác nếu một owner lỗi.

Các scheduler tương thích giữ tên/API gọi cũ của controller/renderer nhưng đăng ký vào scope hiện hành. Ngoài shell (menu), chúng dùng scheduler trình duyệt. Đây là bước nối vòng đời, chưa hợp nhất timing/quỹ đạo hiệu ứng (Phase 6). Các `roundId`/board guard gameplay vẫn giữ nguyên.

Controller gắn cleanup timer, layout, logic, tooltip, loot, coin và popup vào lượt chơi. Chuyển game qua selector/menu cũng unmount shell trước; vào round mới thay scope. Các listener điều hướng/tooltip toàn ứng dụng vẫn được đăng ký một lần; chúng không tăng theo mount. Logic pause/background của controller tiếp tục quyết định đồng hồ và âm thanh.

Modal có lifecycle riêng, thuộc scope game nếu mở trong game. Đóng bình thường giữ animation và callback; unmount/replacement hủy ngay và bỏ callback cũ, không resume nhầm game mới. Thay modal cùng ID hủy listener và lịch đóng của bản trước.

Loot có scope con giữ node, animation và thời gian chờ; hủy animation không đi vào nhánh `onCollected`. Callback hiệu ứng Xu, preview và phản hồi HUD được hủy cùng round. Promise mở tổng kết kiểm scope trước khi tạo modal.

Cleanup chỉ checkpoint Memory khi màn còn hiển thị, tránh ghi trạng thái đã reset sau nút Về Menu của popup hết giờ. Loot đang giữ trạng thái cuối bằng `fill:forwards` cũng được cancel khi dọn, dù animation đã chạy hết thời lượng.

## Tài nguyên ảnh và kiểm chứng

Kiểm tra 20 lượt ban đầu tìm thấy node/listener cũ còn sống. Heap snapshot chỉ ra đường giữ từ Chromium `Pending activities` → ảnh đang tải/giải mã → nút Link cũ. Renderer nay gỡ `src` của ảnh chỉ khi loại bỏ ô/bàn cũ; không đụng ảnh của tile tái sử dụng khi dịch chuyển. Sau sửa, số node và listener về baseline sau 20 lượt.

- Unit: hủy timeout/interval/RAF/listener/animation/node, callback cũ, scope chết, thay scope, cleanup lặp và release công việc hoàn tất.
- UI: semantic slots, reference ổn định, không ID trùng; 20 mount/unmount và đo node/listener thật bằng CDP sau khi tài nguyên tải ổn định; registry hết tài nguyên khi về Menu.
- Đổi game trong preview/loot/Xu/tooltip/modal đang đóng; thay modal cùng ID 20 lần; chơi lại khi timer đang chạy; tạo shell mới và update không thay node board.
- Giữ bộ audit/geometry/config và 88 kiểm tra layout của Phase 3 trên bốn viewport.

Vite dùng cổng test riêng qua `GAME_SHELL_TEST_PORT`; khi biến này có giá trị, tắt HMR/file watching để giữ module graph ổn định trong lượt kiểm. Một lượt đã bị reload trang giữa `page.evaluate` khi asset task khác cập nhật; các test dùng dynamic import cũng cần module graph ổn định. Cấu hình mới chỉ áp dụng cho máy chủ test opt-in; dev thông thường và production không đổi. Không tăng tolerance hoặc bỏ assertion để xử lý lỗi này.

Kết quả cuối ngày 2026-09-08:

- `npm run check` và `npm run build` đạt.
- **128/128 UI** tại `playwright-report/game-shell-phase4-final/`; sau hai sửa cleanup cuối, **28/28 lifecycle/cleanup** tại `playwright-report/game-shell-phase4-cleanup-stable/`. Tổng cộng **136 trường hợp riêng biệt** qua kiểm tra trên bốn viewport. Không thay geometry sau lượt 128 tests.
- Build workspace: CSS gzip 31.02 kB + JS gzip 82.09 kB = 113.11 kB. Workspace đồng thời thêm/đổi asset trái cây, manifest tăng từ 1780 lên 1828 ảnh, ngoài Phase 4.
- Đối chiếu công bằng bằng build cùng runtime cuối nhưng nạp danh sách 1780 asset từ Git HEAD qua plugin build tạm, không sửa file/asset workspace: CSS 31.02 kB + JS 81.71 kB = **112.73 kB gzip**. Tăng 1.82 kB so trước Phase 4 và 4.72 kB so baseline 108.01 kB, đạt ngân sách 5 kB. Không thêm dependency runtime, ảnh hoặc font cho shell.

Chạy bộ kiểm vòng đời bằng `npm run test:ui:lifecycle`; khi làm song song với task khác, đặt `GAME_SHELL_TEST_PORT` và output riêng. Báo cáo, heap snapshot chẩn đoán và build đối chiếu nằm trong `playwright-report/`, không commit.

## Bàn giao

Phase tiếp theo: **Phase 5 — HUD component dùng chung**. Các component HUD và motion strategy vẫn thuộc các phase tiếp theo; kiểm thử mobile thật vẫn là gate phát hành.
