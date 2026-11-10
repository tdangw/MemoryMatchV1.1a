# Prompt bàn giao — Agent A: tạo ảnh ngoại hình

Đây là hướng dẫn tiếp nhận công việc, không phải kế hoạch active thứ hai. Có thể gửi nguyên nội dung phần “Nhiệm vụ” cho chat mới. Cập nhật bàn giao ngày08/11/2026.

## Nhiệm vụ

Bạn tiếp nhận **phần ảnh** cho Memory Match Adventure ở `C:/Users/Dang/MyProject/MemoryMatchV1.1a`. Đọc `AGENTS.md`, `CONTEXT.md`, rồi `COSMETIC_UPGRADE_IMPLEMENTATION_PLAN.md`, đặc biệt mục9,13,14. Tuân thủ skill imagegen được cung cấp trong phiên. Chỉ làm ảnh, kiểm tra mỹ thuật/căn ghép, manifest và xuất ảnh; agent khác làm logic, UI và offline. Không tự tạo kế hoạch active khác, không deploy, không APK.

Mục tiêu đủ101món (39avatar,39khung,23huy hiệu), mỗi món có ba hình thái theo cùng ID:

- Level1–6: giữ nguyên ảnh gốc.
- Level7–20: hình nâng cấp, form2.
- Level21: hình hoàn thiện, form3; giao diện ghi Level Max.

Cần **202 thiết kế mới**, xuất mỗi thiết kế128/256/512 WebP trong suốt, tổng606file mới. 303file gốc giữ nguyên. Bổ sung tương lai qua manifest, không thêm điều kiện theo từng ID vào renderer. Không dùng những lớp trang trí chung chồng thêm quanh avatar vì hướng đó đã bị bác; cần vẽ hai hình thái riêng cho từng món, không vẽ lại ảnh gốc.

## Đọc đúng tài nguyên và trạng thái

- Danh sách đầy đủ và lôA0–A5: `design/expedition/cosmetic-art-batches.json`; inventory: `design/expedition/cosmetic-inventory.json`.
- Ảnh gốc: trường `baseFiles` từng món, dưới `public/assets/achievements/v1/`; đã kiểm101ID/303file tồn tại.
- Master hiện có: `design/expedition/art-production/masters/`.
- Journal nguồn/hash/bbox/status: `design/expedition/art-production/journal.json`.
- Sáu prompt thực tế đã lưu nguyên văn: `design/expedition/art-production/prompts.json`.
- Hướng dẫn prompt tiếp tục: `design/expedition/art-production/PROMPT_GUIDE.md`.
- Mẫu cũA0: `three-form-preview/comparison.png`, `alignment.json`, các WebP avatar/frame/badge2/3. Master gốc đã sao chép vào art-production/masters, không phụ thuộc thư mục ảnh ngoài repository nữa.
- Bộ Cú Sapphire: `art-production/first-three-qa.png` và các master cùng ID. Chỉ là ảnh ứng viên, chưa nhập game.
- Bố cục được tham khảo: `profile-preview/profile-mobile.png`, `collection-preview/collection-mobile.png`. Không lấy mockup5bậc cũ làm luật hoặc coi overlay cũ là phương án được chọn.

**Kiểm đếm khi bàn giao:**12ảnh ứng viên cho6món, chưa có606export sản phẩm được nghiệm thu. Còn190thiết kế chưa có ứng viên.12ảnh hiện có cũng phải QA, có thể phải vẽ lại, không đánh dấu hoàn tất chỉ vì có file.

| Nhóm | ID | Ảnh hiện có |
|---|---|---|
| A0 mẫu cũ | event-avatar-lantern-otter | form2,3 |
| A0 mẫu cũ | starter-frame-plain-wood | form2,3 |
| A0 mẫu cũ | starter-badge-first-leaf | form2,3 |
| A1 mới | memory-avatar-sapphire-owl | form2,3 |
| A1 mới | memory-frame-golden-laurel | form2,3 |
| A1 mới | memory-badge-wisdom | form2,3 |

## Yêu cầu mỹ thuật bắt buộc

Xem ảnh gốc trước từng món rồi viết brief riêng. Giữ nhân vật, biểu tượng, chủ đề và phong cách; không biến mọi món thành một bộ bạc–vàng giống nhau. Hai hình mới phải khác rõ về trang phục, vật liệu hoặc hình khối, vẫn đọc được khi thu nhỏ. Không dùng chỉ đổi màu nhẹ hoặc trang trí li ti làm dấu hiệu tiến hóa.

Avatar, khung và huy hiệu là ba lớp độc lập. Giữ mặt rõ, lỗ khung trong suốt, huy hiệu rõ ở cỡ nhỏ. Không vẽ cả khung/huy hiệu vào ảnh avatar. Không vẽ avatar trong khung. Không đặt trang trí che vị trí huy hiệu. Không chữ, số level, nhãn giải thích, watermark hoặc emoji/font làm đồ họa.

**Lưu ý QA hiện có:** Cú Sapphire form2 có khoảng trống alpha lớn, form3 gần kín canvas; chưa thể lấy cùng width/height là đã khớp mặt. Khung mới cần kiểm lỗ trong suốt và tâm lỗ, không chỉ bbox ngoài. MẫuA0 từng căn bằng CSS trong trang xem thử; phải chuyển thành ảnh nguồn đã căn chuẩn, không bê tỷ lệ CSS thử sang runtime.

Đọc `createCosmeticPortrait` trong `js/storybook/presentation.js` và CSS portrait để hiểu hợp đồng hiện tại, chỉ đọc. Tọa độ canvas gốc512px không trim ở runtime; badge hiện nằm bên dưới, khoảng28%portrait. Đối chiếu source thật nếu agent logic đổi contract. Căn vị trí/tỷ lệ tại lúc xuất, không scaleX/scaleY méo ảnh, không tính bbox mỗi frame. Không đổi kích thước/vị trí mặt tùy hình thái rồi che bằng overlay.

## Cách thực hiện tiếp

1. Kiểm và hoàn thiện hai nhóm12ảnh đã có trước; dùng ảnh gốc làm mốc. Nếu kết quả không khớp thì sửa bằng imagegen, giữ master cũ để đối chiếu. Sao lưu prompt chính xác cho mỗi lần sinh/sửa; không bịa prompt cũ chưa được lưu.
2. Theo lôA1→A2→A3→A4→A5 và phầnA0 cần sửa. Một lời gọi imagegen cho một asset/form; không sinh contact sheet nhiều vật phẩm rồi cắt làm ảnh sản phẩm. Contact sheet chỉ dùng QA.
3. Dùng built-in imagegen; xem local reference trước khi edit; transparent_background=true. Không tự đổi sang API/CLI cần key nếu chưa được chủ dự án chọn.
4. Giữ master đủ độ phân giải, alpha thật; xuất WebP128/256/512 từ nguồn đã căn. Không upscale file128 làm master.
5. Kiểm alpha, lỗ khung, tâm mặt, crop, độ rõ116px/header nhỏ và badge khoảng32px. Phối chéo với khung/avatar/badge gốc và hình mới; kiểm mỗi món, không chỉ bộ cùng chủ đề. Ảnh bị che, quá rối hoặc không rõ khác biệt phải sửa.
6. Ghi tiến độ thật theo từng form: chưa tạo / ứng viên / cần sửa / đã QA / đã export. Đủ file/hash không thay thế QA thị giác. Không dùng fallback ảnh gốc để báo đủ202thiết kế.
7. Bàn giao lô đạt cho agent logic qua manifest; không chỉnh code/catalog generated. Tiếp tục hết phạm vi ảnh đã giao, không dừng mặc định sau một món/lô. Nếu bị giới hạn dịch vụ thật thì ghi rõ ảnh nào còn thiếu và giữ progress bền.

## Hợp đồng file bàn giao cho agent logic

Quy ước thống nhất từ lượt bàn giao này, chưa có export sản phẩm ở đường dẫn này:

`public/assets/achievements/evolution/v1/{item-id}-form{2|3}-{128|256|512}.webp`

Agent ảnh sở hữu namespace mới này và `design/expedition/art-production/`. Giữ nguyên ID và303ảnh gốc. Manifest xuất cuối đặt tại `design/expedition/art-production/manifest.json`, version1, theo từng ID/form, gồm: đường dẫn tương đối từpublic, master, kích thước, dung lượng, SHA256, thông tin căn canvas/anchor, prompt reference và trạng thái QA. Chỉ form đã QA+đủ ba cỡ mới marked ready. Journal ứng viên hiện tại không phải manifest ready để import thẳng.

Agent logic sở hữu bộ đọc/generator và catalog runtime cho hình thái; agent ảnh không sửa các file đó. Nếu cần đổi contract tên/path thì trao đổi và cập nhật cùng hai bản handoff trước, không tự tạo nhánh naming khác.

## Ngoài phạm vi

Không sửa luật level/mảnh/rương/phí, persistence/cloud/rules/offline, UI sản phẩm/CSS runtime, menu/map hoặc công việc đang dirty của agent khác. Hai trò **Match3Connect và MemorySequence** chỉ có `NEW_GAMES_OUTLINE.md`, chờ phân tích thêm, không triển khai. Không commit log/ảnh QA/file tạm vào bundle.
