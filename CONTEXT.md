# CONTEXT — Bộ nhớ làm việc

> Tài liệu này chỉ ghi công việc đang diễn ra, việc cần theo dõi ngắn hạn và các ràng buộc tức thời.  
> Không ghi lịch sử tính năng đã hoàn tất; các thông tin kỹ thuật ổn định thuộc về [ARCHITECTURE.md](ARCHITECTURE.md).

## Trạng thái hiện tại

- Phiên bản hiển thị: **V1.1a**.
- Không có hạng mục mã nguồn đang thực hiện dở tại thời điểm cập nhật.
- Bản web đã phát hành qua GitHub Pages; mã nguồn nằm ở repository Private.

## Việc cần theo dõi

- Sau mỗi lần phát hành GitHub Pages, chờ hệ thống cập nhật ngắn và tải lại cứng trình duyệt (`Ctrl+F5`) khi cần kiểm tra thay đổi mới.
- Lệnh deploy hiện dùng `gh-pages --add` để tránh giới hạn độ dài lệnh của Windows khi dự án có khoảng 1.000 ảnh. Hệ quả là các tệp bundle có hash cũ có thể còn lại trên nhánh `gh-pages`; chỉ cần dọn nhánh này khi dung lượng tăng đáng kể.
- Chưa có bộ unit test tự động. Khi thay đổi luật chơi, timer, lưu trữ hoặc luồng chuyển màn, cần bổ sung kiểm thử phù hợp trước khi coi thay đổi là bền vững.

## Quy ước cho phiên làm việc kế tiếp

1. Đọc `ARCHITECTURE.md` trước khi thay đổi mã nguồn.
2. Cập nhật file này khi bắt đầu/kết thúc một hạng mục ngắn hạn hoặc khi phát hiện sự cố chưa giải quyết.
3. Khi một thay đổi trở thành hợp đồng kỹ thuật ổn định, chuyển mô tả của nó sang `ARCHITECTURE.md` và xóa khỏi file này.
