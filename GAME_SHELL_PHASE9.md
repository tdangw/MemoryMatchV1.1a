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

## Kết luận và bàn giao ngày 2026-09-09

- Người dùng xác nhận giao diện và chốt Game Shell hoàn thành. `npm run check` và production build đạt; audit hiện tại đạt 8/8 ca cho Memory/Link trên desktop, mobile dọc, mobile hẹp và mobile ngang.
- Build hiện tại: HTML 1,05 kB gzip, CSS 30,56 kB gzip và JavaScript 84,67 kB gzip. Audit ổn định không có ID trùng, `aria-controls` hỏng, chồng nút/chỉ số hoặc animation tồn dư; một interval và một RAF còn lại ở mỗi game là đồng hồ/thanh thời gian đang chạy.
- Lỗi vật phẩm Xem trước Memory được sửa sau Phase 9: hiệu ứng chạy sau khi modal đóng và game bỏ pause; ca hồi quy tập trung đạt.
- Chơi thử điện thoại thật, fullscreen/orientation và cảm nhận hiệu ứng vẫn nên thực hiện trước phát hành công khai. Đây là QA phát hành, không phải phase Game Shell còn thiếu.
- Workspace còn thay đổi fullscreen, Challenge, thời gian, tooltip và ảnh của công việc riêng; không tự gộp, reset hoặc xóa để làm sạch worktree. Số liệu bundle bao gồm những thay đổi này.

Phase 9 và toàn bộ kế hoạch Game Shell đã hoàn tất. Chat mới phải chọn một công việc mới; không tiếp tục sang Phase 10 và không tự động triển khai Triple Connect.
