# Shop catalog — nguồn và cách tái tạo

Phạm vi: mục15 của COSMETIC_UPGRADE_IMPLEMENTATION_PLAN.md. Bằng chứng nghiệm thu lưu chung tại design/expedition/IMPLEMENTATION_NOTES.md.

-94key /188WebP:8hỗ trợ,23đường nối,23xóa thẻ,9lật,11mặt lưng,20chủ đề có sẵn.
-6icon hỗ trợ tái dùng master UI;2master mới là đồng hồ trống và sấm sét. Prompt thật tại prompt-records.json.
-78minh họa được chọn có master và prompt tại illustrations/ và generation-records/. Ứng viên theme/default được thay bằng launcher Android theo yêu cầu; không export ứng viên đó.
-7mặt lưng có ảnh tái dùng capture;4mặt lưng CSS có minh họa riêng. Chủ đề mặc định tái dùng android/app/src/main/res/drawable/app_icon_art.png.
-10chủ đề thiếu thẻ giữ icon hiện có và trạng thái chưa có sẵn; không tạo bộ thẻ mới.
-inventory.json ghi catalog thật; capture-manifest.json ghi renderer/frame/seed; art-manifest.json ghi nguồn/hash/byte. Chỉ dẫn mỹ thuật hiện hành trong art-direction.json và kế hoạch mục15.

Tái tạo:
1. tests/ui/shop-catalog-capture.spec.js tạo tham chiếu từ renderer thật, DPR2, context riêng; không thay save người chơi.7capture mặt lưng là đầu vào export.
2. python scripts/prepare-shop-catalog-art.py: Pillow, crop alpha, lề quang học,128/256px WebP quality84; không vẽ lại ảnh.
3. node scripts/generate-shop-catalog-art.mjs hoặc npm run assets:sync. --check kiểm coverage/hash/output. Chỉ xóa export cũ thuộc namespace này sau khi hash khớp bản đã ghi.

Runtime dùng128px tới DPR3,256px khi DPR>3; chỉ tải một biến thể. Tải theo tab đang xem, fallback một lần. Tên/số giây/tồn kho/giá/trạng thái vẫn là DOM dữ liệu thật.

Master/prompt không nằm trong public. Ảnh QA/log và prototype cũ đã chuyển vào runtime/qa/shop-catalog/ được ignore. Pipeline này không sở hữu và không sửa master/prompt/journal/manifest trong expedition/art-production.
