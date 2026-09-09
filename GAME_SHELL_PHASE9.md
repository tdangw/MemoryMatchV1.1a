# Game Shell — Phase 9

## Dọn và khóa contract

Xóa CSS/keyframe của energy/item flight Link cũ, sáu custom property không còn consumer, selector cleanup tương ứng và import `createIcon` thừa. Giữ scheduler dùng chung vì vẫn quản lý tài nguyên thực tế, cùng ID/CSS đang được gameplay sử dụng; không xóa phần đang hoạt động chỉ vì tên cũ.

`check-game-shell-contract.mjs` kiểm import tương đối tồn tại, cấm adapter/effect đã bỏ, chặn shared core import luật/state trò, kiểm sáu vùng semantic và ID literal. UI audit kiểm ID trùng toàn document và đích `aria-controls` khi từng trò đang mở. Bộ check này nằm trong `npm run check`.

`playwright.visual.config.js` tạo/so tám ảnh (hai trò × bốn viewport) trong `tests/ui/visual-candidates`. Seed, thời gian, chuyển động và thời điểm tải font/ảnh được cố định theo audit. Ảnh là bản chờ duyệt; không sửa baseline Phase 1. Fullscreen đang làm riêng được loại khỏi phép đo này theo cơ chế đã ghi ở Phase 7–8; game thực tế vẫn có fullscreen.

Hướng dẫn tích hợp trò mới: `ADD_GAME.md`. Chưa triển khai Triple Connect.

## Kiểm chứng

Đã tạo tám ảnh, xem trực tiếp bốn ảnh mobile-narrow/landscape và xác minh bằng lần chạy độc lập không cập nhật ảnh: 8 ca đạt. Sau sửa toolbar, kiểm lại riêng bốn viewport Memory đều đạt. Năm ca hiệu ứng/registry/canvas Link đạt. Check/build đạt. Bundle workspace: CSS gzip 30,53 kB + JS gzip 84,67 kB = 115,20 kB (giảm 0,77 kB so với build Phase 8 cùng workspace), HTML gzip 1,06 kB. Không chạy lại full suite.

## Sửa chồng nút kho ở Memory ngang

Khi xem ảnh 844×390, nút Thời gian/Xem trước chồng một phần lên LV/tổng sao trong baseline cũ. Đã thêm token `hud.landscapeMinWidth` 390px, chỉ áp dụng cho toolbar Memory ở màn ngang thấp, giới hạn bởi viewport. Board và các vùng còn lại giữ nguyên. Audit có kiểm giao nhau giữa nút và chỉ số, đồng thời ghi rõ ngoại lệ chiều rộng/vị trí toolbar thay vì sửa baseline Phase 1. Chỉ ảnh chờ duyệt Memory landscape được cập nhật theo thay đổi có lý do này.

## Gate phát hành chưa khóa

- Cần người dùng xem bộ ảnh chờ duyệt và chơi thử ít nhất một điện thoại thật, gồm fullscreen, orientation, thưởng/kho và chuyển trò.
- Workspace còn thay đổi fullscreen, Challenge, thời gian, tooltip và ảnh của công việc riêng; không tự gộp hoặc xóa để làm sạch worktree.
- Số liệu bundle của workspace bao gồm những thay đổi riêng đó; không coi đây là đo riêng phần Game Shell hoặc chứng nhận ngân sách bản phát hành cuối.

Phase 9 hoàn tất phần triển khai khi check/visual/build đạt; chưa tuyên bố bản phát hành đã được khóa nếu các gate trên chưa xác nhận.
