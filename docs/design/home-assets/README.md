# Bộ mỹ thuật Vườn đêm — hướng1

Người dùng đã chọn hướng1 cho màn chính. Sheet trang trí là nguồn tham khảo. Home hiện đã triển khai hướng1 với ba tranh riêng và WebP runtime, xem [QA](../home-menu/QA.md); không dùng sheet nguyên tấm làm giao diện. Skill `imagegen`, công cụ built-in image_gen, không CLI/API fallback.

- [PNG gốc trong suốt](garden-ui-sheet-v1.png)
- [Kiểm tra hiển thị trên nền tối](garden-ui-sheet-on-dark-qa.png)
- [Prompt nguyên văn](prompt-v1.json)
- [Kích thước/alpha/hash](metadata-v1.json)

## Nội dung12vùng

Theo hàng từ trên xuống, mỗi hàng từ trái qua phải:

|Hàng|Trái|Giữa|Phải|
|---|---|---|---|
|1|Nền Memory Match: nhà kính lục, hoa trắng, đài phun|Nền Link Connect: sân nước lam, vòm đá|Nền Triple Connect: đình hoa tím, tử đằng|
|2|Popup lục, lá và hoa góc, giữa thoáng|Popup lam, cửa vòm hai bên, giữa thoáng|Popup tím, hoa rủ viền, giữa thoáng|
|3|Crest hoa trắng và cành vàng|Bảng tên lục viền vàng để trống|Vòm hoa tím và huy hiệu trống|
|4|Khung ngang lá vàng/lục|Khung dọc vàng/đá lam|Khung tên/nút ngang bo tròn|

Không vẽ chữ, nút đóng, số liệu hay nhãn kỹ thuật vào artwork. Tranh nền có nội dung ở mép; popup giữ vùng giữa yên để chữ/nút runtime đọc rõ. Hàng4 có lòng khung trong suốt thật. Phong cách cùng vật liệu vàng dịu/navy/teal của mẫu1; những trò mới có thể dùng lại khung và đổi cảnh nền.

## Kiểm tra và phạm vi

PNG thực tế1254×1254, RGBA, không phải3072px như mong muốn trong prompt. Đã kiểm alpha bằng dữ liệu pixel:647.852pixel alpha0; ba điểm giữa khung hàng4 alpha0. Đã mở ảnh trong Chromium trên nền#071f29 để kiểm đường viền, khoảng tách và nền trong; bản screenshot QA chỉ là hình xem, không thay nguồn PNG trong suốt.12mảnh tách nhau, không có chữ hoặc cạnh bị cắt.

Sheet là nguồn tổng quan, không phải atlas đã cắt với các ô đồng kích thước. Khi xuất runtime, cần lấy riêng từng vùng theo biên hình và đúng kích thước/DPR sử dụng; không phóng lớn cả sheet làm một ảnh nền của Home và không co kéo góc khung theo tỷ lệ tùy ý. Mảnh cảnh hiện khoảng400pxrộng trên sheet, vì vậy sheet không được xem là master đủ nét cho mọi kích thước hiển thị lớn. Chưa xuất asset rời/WebP, chưa thay giao diện hoặc logic, không ảnh hưởng save/API/performance runtime; không cần chạy lại suite gameplay/build cho thay đổi chỉ trong docs.

## Ảnh riêng cho runtime main menu

Theo yêu cầu triển khai hướng1, đã dùng imagegen built-in dựng riêng3cảnh theo mẫu đã chọn, không phóng lớn các ô400px của sheet. Master PNG giữ ngoài bundle trong `masters/`; [prompt](runtime-prompts-v1.json), [metadata](runtime-metadata-v1.json). Chỉ ảnh minh họa cơ chế ghép cặp/nối cặp/ba thẻ cùng loại; không bake tên/nút/UI vào tranh. Triple không vẽ khay tránh mô tả sai dung lượng.

`python scripts/prepare-home-menu-assets.py` chỉ xuất RGB/resize/WebP, không vẽ/cắt/chỉnh nội dung. Runtime: Memory900×600/134.722bytes, Link576×720/100.752bytes, Triple576×720/113.944bytes; tổng349.418bytes, gate≤350.000bytes. Tên/viền/focus vẫn là DOM/CSS. Nền Home dùng lại Vườn đêm36.046bytes hiện có, không tạo bản gần giống. Ảnh popup trong game không dùng bộ art này.
