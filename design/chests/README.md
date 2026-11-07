# Bộ rương sự kiện — 07/11/2026

- 12 loại đang dùng: C, Avatar, Khung, Huy hiệu; Xu, Ngẫu nhiên, Ngoại hình, Lật thẻ, Chủ đề, Đường nối, Xóa thẻ, Hỗ trợ.
- Mỗi loại có hai ảnh đóng/mở, nền trong suốt, 256×256 WebP; tổng 24 ảnh game là 459.428 byte. Một loại giữ cùng hình ở mọi skin và bề mặt.
- Bốn mẫu dự phòng ở `reserve/`: Băng (`ice`), Lửa (`fire`), Rừng (`forest`), Thiên văn (`cosmic`), mỗi mẫu có hai trạng thái. Chưa đưa vào bundle hay luật thưởng.
- Ảnh tạo bằng công cụ image_gen tích hợp, theo phong cách minh họa game phiêu lưu, vật liệu gỗ/men/kim loại/đá quý, không chữ. Cặp đóng/mở cùng góc nhìn và tỉ lệ; khác loại phân biệt bằng dáng nắp, màu và huy hiệu nổi.
- Ảnh nguồn và bộ prompt lưu cục bộ ở `runtime/art-source/chests/`; `manifest.json` ghi nguồn, mô tả từng loại và prompt chung. Không đưa PNG nguồn vào thư mục game.
- `python scripts/prepare-chest-art.py` chỉ cắt hai ô vuông theo biên cố định và chuyển WebP, không vẽ rương bằng code. Giữ nguyên alpha và vùng đệm; kiểm tra ảnh không chạm biên, kích thước và định dạng sau xuất.
- Thư mục chạy: `public/assets/rewards/chests/`. `js/liveops/chestArt.js` sở hữu đường dẫn hình theo loại. Các rương cấp C/B/A/S trên bản đồ giữ bộ ảnh cấp bậc hiện có.

Nghiệm thu: 32 ảnh đạt kích thước/alpha, 24 ảnh build khớp nguồn và không chứa mẫu dự phòng; 56 bài UI liên quan đạt qua lượt chính và chạy lại 9 bài sau sửa cuối; kiểm tra JavaScript, CSS ownership, diff và build web đạt. Chưa deploy/APK hoặc đo FPS trên điện thoại thật.
