# Phạm vi ảnh nâng cấp — rà soát08/11/2026

Nguồn đếm: PROFILE_COSMETIC_ITEMS trong achievementModel.js được dựng từ achievementCatalog.generated.js (ACHIEVEMENT_ITEMS + EXTRA_COSMETIC_ITEMS) và letterCatalog.generated.js. Chỉ avatar/frame/badge; loại effect-cover, nền/theme/thẻ, ảnh QA và mẫu trong design. Vòng quay dùng lại CHEST_ITEMS, không cộng trùng quyền nhận thành món mới.

| Nguồn | Avatar | Khung | Huy hiệu | Tổng |
| --- | ---: | ---: | ---: | ---: |
| Memory Match |11|11|6|28|
| Link Connect |11|11|6|28|
| Triple Connect |11|11|6|28|
| Sưu tập chữ |4|4|4|12|
| Sự kiện |1|1|0|2|
| Khởi đầu |1|1|1|3|
| Tổng |39|39|23|101|

101 ID duy nhất, không có hai món dùng file512 giống byte. Tất cả303file được tham chiếu (128/256/512) tồn tại, đúng kích thước, có alpha; không có file avatar/frame/badge dư trong public/assets/achievements/v1. Tổng dung lượng8.652.824B. Chi tiết đường dẫn từng món trong cosmetic-inventory.json.

Phương án hiện hành: 21 level, ba hình thái Level 1–6 / 7–20 / 21; tại 21 ghi Level Max. Thêm78ảnh avatar+78ảnh khung+46ảnh huy hiệu=202thiết kế mới. Xuất đủ3cỡ:606file mới; tổng909file ảnh sản phẩm cho ba hình thái, không phải909thiết kế. Sáu ảnh mẫu mới cho3món hiện tại có thể tái dùng nếu chủ dự án duyệt; khi đó còn196thiết kế mới. Không lấy mẫu đang chờ duyệt làm asset sản phẩm một cách mặc định.

Khả thi: mỗi món đang trang bị vẫn vẽ đúng3lớp avatar/frame/badge, chọn1hình thái theo bậc; không chồng3hình thái hoặc thêm animation. Dung lượng cài/tải tăng theo asset nhưng tài nguyên render không cần tăng tương ứng; chỉ nạp cỡ/hình thái cần dùng. Độ lớn bundle cuối phải đo từ export thực, chưa ước lượng như số đo.

Giới hạn và điều kiện triển khai: cần duyệt phạm vi toàn101hay một nhóm; chốt hướng tiến hóa theo từng món/chủ đề, không ép tất cả thành cùng bảng màu bạc-vàng. Giữ IDgốc và lựa chọn trang bị; thêm ánh xạ hình thái và tiến trình mảnh tại nguồn generator/catalog, không sửa generatedoutput bằng tay. Mỗi món tối đa Level 21, mỗi bản nhận hợp lệ +1 level; sau Max thành mảnh theo loại, có bán và ghép 3 mảnh bất kỳ thành rương ngẫu nhiên. Luật chi phí 1/2/4/6/8 và Max đổi thẳng Xu cũ không còn áp dụng; xem kế hoạch hiện hành. Rương hiện ưu tiên món chưa có nên nguồn bản sao phải được thiết kế cùng. Kiểm tra từng ảnh lẻ và phối với các món khác, không chỉ một bộ đồng nhất; thử kích thước116px và header nhỏ, bảo vệ mặt avatar/vịtrí badge.

Lượt này chỉ rà soát và ghi tài liệu, chưa tạo hàng loạt ảnh, đổi catalog/save/UI, chạy build hoặc deploy. Các chỉnh sửa liveops/rules đang có do agent khác thực hiện được giữ nguyên.
