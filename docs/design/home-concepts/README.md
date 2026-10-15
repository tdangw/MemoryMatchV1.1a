# Hai hướng màn chọn trò — 2026-10-15

Concept tham khảo, chưa áp dụng vào Home. Skill imagegen, built-in image_gen, không CLI/API fallback. [Prompt đầy đủ](prompts.json).

- [Một lớn, hai nhỏ](home-grid-v1.png): Memory Match portal rộng, Link/Triple ngang hàng phía dưới. Cả3lựa chọn thấy ngay, vùng bấm rõ và dễ co giãn cho mobile/ngang/desktop. Khuyến nghị hướng này để triển khai.
- [Lối vườn ba cổng](home-portals-v1.png): mỗi game là một cổng riêng trên lối đi lệch, giàu không khí và khác biệt hơn; cần cân đối vùng bấm và crop trên màn hẹp để tên không nhỏ hoặc lẫn với tranh nền.

Art riêng cho từng game, vàng/teal/navy và ảnh nền tương thích thế giới Vườn đêm. Tranh chỉ minh họa cơ chế ghép cặp/nối đường/ghép ba; không dùng ảnh toàn màn có chữ làm UI runtime. Khi chọn hướng, tách tranh nền/khung và giữ tên, nút, dock là DOM để responsive/focus/localization rõ. Số ô khay và hình minh họa nhỏ trong concept không phải thông số gameplay; bản triển khai phải lấy catalog hiện hành. Không thêm progress/XP/offer hoặc hành vi mới.

Hai PNG là tài liệu thiết kế ngoài bundle, không preload hoặc tăng tải của sản phẩm hiện tại. Ảnh đầu ưu tiên rõ đường chọn; ảnh sau ưu tiên trải nghiệm khám phá.
