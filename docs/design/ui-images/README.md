# Bộ hình giao diện Vườn đêm

Nguồn hiện hành gồm `masters/garden-simple-v2.png`, `masters/garden-v1.png` (huy hiệu và chi tiết còn dùng) và `masters/icons-v1.png`. Các master gỗ/giấy và nút cũ được giữ như hồ sơ nguồn, không còn xuất vào bản web. Dùng skill imagegen với công cụ có sẵn; prompt nguyên văn ở [prompts.md](prompts.md).

Khung, nhãn và nút dùng cùng chất liệu xanh đêm, viền vàng đơn giản, nét hoạt hình bo dày và nổi khối ở popup thường, thắng, rương/quà, cửa hàng, các tab, HUD và cảnh hoàn thành chặng. Thắng giữ chữ cong, sao đạt/chưa đạt và ba hàng Xu nhận/Thời gian/Điểm; bố cục tự chảy một cột, chuyển hai cột khi màn thấp. Nút/nhãn không vẽ vào ảnh. Thẻ, nền và đồ vật của trò chơi vẫn giữ hình cần thiết để phân biệt nội dung.

## Xuất ảnh

`python scripts/prepare-ui-image-assets.py` đọc `regions.json`, cắt vùng, bỏ lề trong suốt (tìm biên với alpha lớn hơn8 để bỏ nhiễu gần vô hình; vẫn giữ alpha gốc trong vùng cắt), thu nhỏ và nén WebP; không vẽ lại nội dung. Các file sinh là `public/assets/images/ui/v1/`, `styles/ui-art-tokens.css`, `js/uiArtManifest.js` và `runtime-metadata.json`. Sửa source/config rồi chạy script, không sửa tay output.

Generator chỉ xóa các ảnh đã được manifest trước quản lý nhưng cấu hình nguồn hiện hành đã bỏ; kiểm đường dẫn tuyệt đối ở trong thư mục xuất, không quét/xóa ảnh ngoài đó. Bộ hình cũ có21ảnh không còn dùng đã được loại khỏi bundle.

- Khung/nút Vườn đêm16ảnh:180.128bytes, giới hạn350KB.
- Biểu tượng phần thưởng6ảnh:51.882bytes, giới hạn250KB.
- Biểu tượng điều hướng/công cụ24ảnh:190.162bytes, giới hạn250KB.
- Tổng46WebP/422.172bytes; browser chỉ tải theo phần được sử dụng. Master không nằm trong bundle.

Master khung và biểu tượng ban đầu1254×1254 RGBA; sheet Night Garden đơn giản mới1312×1199 RGBA, alpha0–255. Khung dùng chia9phần; icon xuất160px, sao192px. Kích thước/crop/hash thật ở `generation-metadata.json`, `regions.json` và `runtime-metadata.json`.

## Tương tác và fallback

Chữ/số, vùng chạm, focus, cuộn và trạng thái giữ DOM/owner hiện có. `createIcon` vẫn trả SVG/aria như trước; ảnh lỗi dùng đường SVG có sẵn và tông vàng chung. Nền tối, chữ sáng và các nút vẫn đọc được khi ảnh không tải được. Sao chưa đạt xám hoàn toàn, không làm mờ.

Không đổi API/schema/save/catalog/effect ID, không thêm chuyển động hoặc timer. Các màu báo lỗi/cảnh báo và màu phân biệt độ khó vẫn giữ ý nghĩa. Bản kiểm tra hình ở `test-results/night-garden` và `test-results/victory-design`; không tạo báo cáo riêng hoặc APK khi chủ dự án đang thử web. QA/APK trong tài liệu cũ là lịch sử trước đổi chủ đề này.
