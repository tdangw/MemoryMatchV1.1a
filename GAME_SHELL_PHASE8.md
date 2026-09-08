# Game Shell — Phase 8

## Triển khai

`js/linkConnect/linkShell.js` sở hữu markup Link, các vùng semantic, tham chiếu HUD, khai báo vật phẩm/icon, formatter/tooltip và áp dụng timing do controller truyền vào. Shell dựng một lần khi cần; controller chỉ mount và truyền callback hành động/dùng vật phẩm. Cả hai adapter legacy đã xóa vì không còn nơi gọi.

Các listener menu/công cụ được gắn qua scope mỗi lượt và dọn khi unmount. Button/node không được dựng lại khi Chơi lại. Nút vật phẩm dùng một listener chung trên danh sách; thao tác sau unmount không gọi controller cũ.

Renderer vẫn sở hữu tile theo instanceId, ô bàn, path, FLIP, băng và canvas; shell không render bàn hoặc quyết định luật thưởng/dịch chuyển. Giữ CSS/ID đang còn dùng để bảo toàn bố cục; không xóa selector còn hoạt động. Các phần tương thích hiệu ứng còn lại thuộc Phase 9.

## Kiểm chứng có chọn lọc

- 8 ca desktop HUD/lifecycle/control: node ổn định, không ghi DOM thừa, tooltip, 20 lượt mount, đổi trò khi đang có hiệu ứng, modal; Challenge level 1/7/14/28/29 giữ node sau patch, bốn nút công cụ, mỗi click trừ đúng một Gợi ý và không xử lý sau unmount.
- Kiểm tra core và board Link đạt, không sửa thuật toán.
- Sáu chế độ và bàn Challenge lớn/đổi kích thước/modal dùng bộ layout hiện có; audit bốn viewport tách fullscreen khỏi phép đo baseline cũ như Phase 7.
- Kết quả: 19 ca UI liên quan đạt (8 HUD/lifecycle/control + 7 layout + 4 audit tách fullscreen); check/build đạt. Bundle workspace gồm các tính năng đang làm riêng: CSS gzip 31,25 kB, JS gzip 84,72 kB, HTML gzip 1,05 kB.

## Chờ kiểm tra thủ công trước Phase 9

1. Trên điện thoại dọc/ngang, dùng Gợi ý/Xáo trộn/Sấm sét/Đóng băng; mở cửa hàng và chơi lại để kiểm nút luôn phản hồi một lần.
2. Ghép thẻ cao cấp, mở cặp băng cuối, gặp bàn hết đường nối và thử các hướng dịch chuyển; kiểm thưởng/mốc và đường nối khi chơi thực tế.
3. Đổi trò khi đường nối/vật phẩm đang bay; kiểm bố cục cùng nút fullscreen đang phát triển riêng.

Chưa triển khai Triple Connect.
