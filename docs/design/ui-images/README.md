# Bộ hình giao diện Vườn đêm và phần thưởng

Nguồn hiện hành cho `UI_IMAGE_UPGRADE_PLAN.md` D–G. Skill `imagegen`, công cụ built-in; không dùng CLI hoặc khóa riêng. Ba sheet đã tạo: [Vườn đêm](masters/garden-v1.png), [gỗ và giấy](masters/reward-v1.png), [biểu tượng](masters/icons-v1.png). Bộ icon đầu quá sát nhau, đã tạo lại khoảng cách trước khi xuất; không đưa bản bị loại vào gói ứng dụng.

## Xuất ảnh

`python scripts/prepare-ui-image-assets.py` đọc `regions.json`, cắt đúng vùng đã kiểm, bỏ lề trong suốt, thu nhỏ và nén WebP. Script không vẽ hoặc sửa nội dung. Chạy lại sinh cùng bộ56ảnh, `styles/ui-art-tokens.css`, `js/uiArtManifest.js` và `runtime-metadata.json`; sửa cấu hình/source rồi chạy script, không sửa tay file sinh.

- Vườn đêm16ảnh:218.454bytes, giới hạn350KB.
- Thắng/thưởng16ảnh:166.190bytes, giới hạn250KB.
- Biểu tượng24ảnh:141.620bytes, giới hạn250KB.
- Tổng526.264bytes cho toàn bộ thư viện; không đồng nghĩa Home tải tất cả. CSS biến chỉ tải ảnh khi selector sử dụng; icon chỉ tải khi tạo. Ảnh nguồn không nằm trong public/bundle.

Master thực tế1254×1254, RGBA, có alpha0–255; không coi kích thước2048 trong yêu cầu vẽ là kết quả. Khung dùng chia chín phần, không phóng toàn mảnh300px lên làm tranh toàn màn. Góc/cạnh dùng khoảng30–36% nguồn và rộng khoảng28–32px trên popup; phần giữa yên được kéo giãn. `generation-metadata.json` ghi kích thước/hash thật; `regions.json` ghi crop và nguồn. Các biến thể nút/huy hiệu có nguồn riêng vì khác chất liệu/trạng thái; dùng lại giữa trò/tab/popup.

## Phân công hình và hành vi

| Phần | Dùng hình | Giữ cách điều khiển hiện có |
|---|---|---|
| Popup chọn màn/đầu màn/thông tin/tạm dừng/hết giờ/xác nhận/công cụ | Khung/nút Vườn đêm, huy hiệu, icon | Nội dung, focus, cuộn, pause, thao tác và lifecycle |
| Thắng, rương, quà, kết thúc chặng | Gỗ/giấy, ribbon trống, sao sáng/tối, ô số, nút cam/xanh, quà/rương/xu/giờ | Thưởng thật, sao0–3, nhiều dòng, counter, chuyển tiếp và cảnh hoa hiện có |
| Cửa hàng/Bộ sưu tập | Khung hàng, bệ giá/preview, trạng thái mua/chọn, icon công cụ dùng chung | Giá/kho/giao dịch và preview chủ đề/mặt lưng/hiệu ứng có sẵn |
| Home/map/tab | Giữ nền/tranh/đồ trang trí cũ, thay bệ tên/khung nhóm/avatar/medal/nút/tab/icon | Carousel, map patch/scroll, hồ sơ và bảng xếp hạng |
| HUD/khay3trò | Khung và bệ công cụ/khay, sao/xu/icon | Kích thước bàn/HUD, thanh thời gian/combo, đường nối và renderer |

Các đường nét chức năng nhỏ (nút đóng, focus, dấu chọn, menu ba gạch, trạng thái khóa), icon chủ đề ít dùng và preview hiệu ứng giữ SVG/CSS theo API cũ. Không thay ảnh thẻ/chủ đề đã có, không biến chỉ số hoặc toàn màn thành ảnh. Không thêm chuyển động mới; các animation cũ vẫn có owner/cancel/reduced-motion. `createIcon` vẫn trả SVG, ảnh được đặt bên trong nên aria/class/call sites tương thích; icon chưa có trong bộ mới vẫn dùng đường SVG hiện có.

## Nghiệm thu

Ảnh kiểm tra ở `qa/`; kết quả tổng hợp trong `QA.md`. Không tự xuất bản. Chỉ tạo APK một lần khi hoàn tất toàn bộ D–G theo yêu cầu chủ dự án.
