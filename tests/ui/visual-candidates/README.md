# Ảnh so sánh Game Shell — chờ duyệt

Tám ảnh được tạo trên Windows/Chromium, seed và thời gian cố định, hai trò ở bốn viewport. Mặc định bộ so ảnh không tự cập nhật. `npm run test:ui:visual` kiểm tra ảnh, hình học, ID/aria-controls; Memory còn kiểm nút không chồng chỉ số.

Ảnh tách nút fullscreen đang phát triển riêng khỏi baseline. Memory landscape có thay đổi có chủ đích ở Phase 9: toolbar tối thiểu 390px để không chồng nút kho lên LV/tổng sao; các vùng khác giữ baseline Phase 1.

| Viewport | Memory | Link |
| --- | --- | --- |
| 1024×900 | [Memory](desktop/memory.png) | [Link](desktop/link.png) |
| 390×844 | [Memory](mobile/memory.png) | [Link](mobile/link.png) |
| 320×568 | [Memory](mobile-narrow/memory.png) | [Link](mobile-narrow/link.png) |
| 844×390 | [Memory](landscape/memory.png) | [Link](landscape/link.png) |

Đã kiểm ảnh mobile-narrow/landscape trực tiếp và so ảnh qua lần chạy độc lập. Chưa thay cho người dùng duyệt hoặc chơi thử trên điện thoại thật. Không dùng tùy chọn cập nhật ảnh để che lỗi.
