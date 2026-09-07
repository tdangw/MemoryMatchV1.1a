# Game Shell — Phase 3

## Phạm vi

Hai trò dùng chung phép đo và tính kích thước bàn tại `js/gameShell/gameShellLayout.js`. Mobile dọc vẫn là bố cục chính; bàn tự fit khi xoay ngang. Không thêm Triple Connect. Controller/renderer tiếp tục sở hữu gameplay, tile và đường nối.

`calculateBoardLayout()` là hàm thuần, nhận không gian khả dụng, hàng/cột, spacing, border, giới hạn và độ chính xác kích thước ô; trả `{ tileSize, boardWidth, boardHeight, gap, padding }`. Không ép kích thước tối thiểu khiến bàn lớn tràn màn hình. Spacing co lại khi không đủ chỗ; không gian bằng không cho kết quả bằng không.

`connectGameShellLayout()` giữ một shell đang hoạt động, một ResizeObserver và tối đa một RAF chờ. Trong RAF, engine đọc viewport, các vùng title/progress/HUD/milestones, vị trí đầu bàn và computed style, rồi mới gọi adapter ghi kích thước. Kết quả không đổi không ghi lại. Engine không import state, controller hoặc tên trò.

Viewport dùng `visualViewport` và fallback `innerWidth/innerHeight`; safe area được đọc từ token CSS trên root. Width tính cả vị trí root, padding, gutter tọa độ và khoảng ngoài bàn. Height tính từ đầu bàn tới đáy viewport, trừ safe area và inset. Font ready chỉ kích hoạt một lần; asset load chỉ kích hoạt tối đa hai frame bổ sung. Khi tab ẩn, RAF dừng; khi hiện lại sẽ đo lại.

Hai adapter trong `grid.js` và `linkRenderer.js` giữ CSS variables và DOM board cũ, chỉ nhận kết quả fit. Các khác biệt width ratio, gutter, tile cap/rounding và khoảng đường nối ngoài bàn đi qua cấu hình có tên và schema. Đổi kích thước không dựng lại tile. Hai controller hủy kết nối layout khi về Menu; kết nối mới tự hủy kết nối trước, cleanup gọi lại an toàn. Registry lifecycle cho toàn bộ gameplay/effect vẫn thuộc Phase 4.

## Điều chỉnh hình học có chủ đích

Legacy Link tính ô theo chiều rộng lớn hơn khung đã bị CSS clamp 8–16px. Engine mới fit cả ô thẻ vào khung thật. Trên bàn Dễ dùng đối chiếu, chiều cao bàn giảm khoảng 12px ở desktop và 6px ở hai viewport mobile; chiều rộng/vị trí khung và các vùng HUD giữ baseline trong 1px. Chiều cao bàn ngang giữ trong 1px.

Audit giữ nguyên baseline Phase 1 cho mọi vùng chuẩn, chỉ kiểm riêng chiều cao bàn Link theo công thức ô vuông vừa khung. Không tăng tolerance tổng quát hoặc thay golden baseline. Bộ layout kiểm thêm bounds của từng tile để không bỏ sót bàn tràn trong một khung đã clamp.

## Kiểm chứng

- `npm run check` bao gồm test hàm fit: border, làm tròn, max tile, không gian rất nhỏ, số không hữu hạn và validation cấu hình.
- `npm run test:ui:layout`: bốn viewport × sáu mode cho hai game; Memory có cả bật/tắt tọa độ. Thêm Challenge level 100, xoay/resize liên tục, giữ nguyên node tile, modal, 20 lượt đổi game trong preview và fallback viewport/safe area.
- Diagnostics ở development kiểm tối đa một phép đo/frame, một observer/shell, listener không tăng qua các lượt và không còn tài nguyên layout sau về Menu. Đây là kiểm chứng phạm vi layout; không thay thế gate lifecycle toàn ứng dụng ở Phase 4.
- Audit/geometry/CSS override vẫn chạy cùng bộ layout. Ảnh và số đo nằm trong `playwright-report/game-shell-phase3-final/` (không commit).

Kết quả cuối ngày 2026-09-07: `npm run check` và production build đạt; **108/108 UI tests đạt** (88 layout + 20 audit/geometry/config). CSS gzip 31.02 kB, JS gzip 79.89 kB, tổng **110.91 kB**, tăng 1.86 kB so Phase 2 và 2.90 kB so baseline 108.01 kB, dưới ngân sách 5 kB. Số này bao gồm các sửa đổi độc lập về tooltip/session đang có trong workspace, nên là giới hạn trên cho riêng Phase 3.

Lệnh kiểm UI dùng server/output riêng để tránh ảnh hưởng tác vụ đồng thời:

```powershell
$env:GAME_SHELL_TEST_PORT = '4186'
npx playwright test tests/ui/game-shell.layout.spec.js tests/ui/game-shell.audit.spec.js tests/ui/game-shell.geometry.spec.js tests/ui/game-shell.config.spec.js --output=playwright-report/game-shell-phase3-final
```

## Bàn giao

Adapter ID/CSS variables cũ tiếp tục tồn tại tới Phase 7–8; chưa xóa markup HUD hay thay hệ effect. Phase kế tiếp là **Phase 4 — Game Shell DOM và lifecycle**. Kiểm thử thiết bị mobile thật vẫn cần cho gate phát hành.
