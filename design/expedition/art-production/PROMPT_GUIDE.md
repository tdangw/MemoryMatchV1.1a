# Prompt tạo tiếp ảnh ngoại hình

Đây là nguồn prompt/brief, không phải kế hoạch triển khai thứ hai. Dùng cùng `HANDOFF_ART_AGENT.md` và kế hoạch hiện hành.

## Prompt thực tế đã lưu

`prompts.json` chứa nguyên văn6prompt đã dùng cho bộ Cú Sapphire / Vòng Nguyệt Quế Vàng / Huy Hiệu Trí Tuệ. `journal.json` nối ID/form với master, nguồn và hash. Sáu masterA0 cũ đã được lưu lại, nhưng không có bản prompt nguyên văn trước đây trong archive; không gắn một prompt tái dựng thành “prompt gốc”. Khi sửa hoặc tạo tiếp, lưu prompt mới trước lời gọi công cụ và cập nhật kết quả sau khi hoàn tất.

## Khung prompt dùng cho một món, một hình thái

Thay toàn bộ phần trong ngoặc vuông sau khi đã xem ảnh gốc. Chọn brief riêng theo đúng chủ đề; không gửi nguyên các biến hoặc dùng một mô tả màu chung cho101món.

```text
Edit target: the attached original [TYPE] collectible, ID [ITEM_ID], named [ITEM_NAME].
Create form [2 OR 3] of a THREE-FORM progression for Memory Match Adventure.
Keep the original [CHARACTER / SYMBOL], its [THEME], recognizable features, front-view orientation, and polished dimensional painted game-art style.

Evolution art direction:
[SPECIFIC CLOTHING / MATERIAL / LARGE SHAPE CHANGES FOR THIS FORM AND THIS ITEM].
[FORM 2: a clear middle evolution beyond the original, restrained and readable.
 OR FORM 3: the complete final evolution, substantially different from BOTH original and form2, with a stronger coherent silhouette.]

Composition and alignment:
One isolated [AVATAR / FRAME / BADGE], square canvas, true transparent alpha background.
Preserve the original portrait coordinate system and matching composition for interchangeable layers.
[TYPE-SPECIFIC CONSTRAINTS BELOW].
Keep all important details safely inside the canvas. Use substantial readable shapes rather than many tiny decorations.

No text, numerals, level labels, captions, watermark, emoji, unrelated floating objects, glitter clouds, rectangular background panels or contact sheets.
Deliver ONE asset only. Do not draw other equipment slots into this asset.
```

## Ràng buộc theo loại

**Avatar**

```text
Keep the same character identity, face direction and expression family. Keep face center, eye line and portrait crop aligned to the original reference, rather than zooming out to a full-body character. Leave the face unobstructed. Upgrade clothing, headwear and substantial character accessories within the existing portrait safe region. Do not add a surrounding frame, medal, badge, pedestal or laurel ring. Do not push the face downward to make room for a tall crown. Preserve the original circular portrait coverage when applicable; do not replace a filled portrait with a tiny isolated subject in a large empty square.
```

**Khung**

```text
Only the frame. The inner opening must remain fully transparent with no face or scene inside. Match the original inner opening center, shape and usable size, not merely the outer bounding box. Upgrade the border material and large coherent ornaments; place them mainly outward so the avatar face stays visible. Leave the separate bottom badge region unobstructed. Do not add a built-in medal, text or avatar. Preserve enough margin around the outer ornaments to avoid clipping.
```

**Huy hiệu**

```text
One standalone badge, preserving the original central symbol and meaning. Make the symbol and evolution readable at approximately32px. Prefer bold emblem structure and clear material changes over tiny gems, detached sparkles or thin dangling details. Keep the original center and footprint suitable for the portrait's bottom badge slot. Do not draw an avatar or a surrounding portrait frame. Transparent background outside the badge.
```

## Cách dùng reference

- Reference bắt buộc: ảnh gốc512px đúng ID từ manifest lô ảnh. Xem ảnh trước khi gọi edit.
- Có thể thêm form2 đã đạt làm supporting reference khi tạo form3, nhưng ảnh gốc vẫn là mốc nhận diện và căn ghép. Nêu rõ vai trò từng ảnh.
- Mẫu phối tổng chỉ là reference kiểm bố cục, không phải target để sinh lại cả bộ trong một ảnh.
- Truyền `transparent_background:true`; lưu một master/form; không dùng ảnh nhiều ô làm master sản phẩm.

Sau sinh phải kiểm ảnh thực tế: prompt yêu cầu đúng chưa có nghĩa kết quả đã đúng. Đặc biệt kiểm tâm mắt, khoảng trống alpha, lỗ khung và việc huy hiệu bị che khi ghép.
