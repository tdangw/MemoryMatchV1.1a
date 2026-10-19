# Kho báu hành trình — hợp đồng triển khai

Nguồn phạm vi: GAMEPLAY_PROGRESSION_PLAN.md §12, được chủ dự án giao thực hiện sau phần chuyển wave. Không thay kinh tế, schema hoặc claim key. Kiểm tra trên working tree tích hợp; giữ các hunk UI khác ngoài commit.

- Mỗi trò × đoạn 10 màn: Rương Mầm Non (Dễ), Lá Bạc (Trung bình), Hoa Vàng (Khó), Ánh Sao (Siêu khó). Thưởng lần lượt 30/60/100/160 Xu và 1/2/3/4 Gợi ý.
- Trạng thái dẫn xuất: đang tích, chờ rương trước, sẵn sàng, đã mở; cả bốn giữ EXP thực kể cả khi đã nhận. Busy/success/retry thuộc modal, không persist.
- Một marker, bốn thẻ 2×2, một hero và hai ô thưởng. Thành công giữ đúng rương vừa nhận; xem rương tiếp là hành động riêng. Bộ sưu tập giữ riêng.
- Claim mới dùng expectedTier tại boundary, kết quả chi tiết phân biệt đầy kho với lỗi lưu/chuyển profile/chưa đủ điều kiện. API cũ vẫn outcome/null. Atomic receipt+Xu+Gợi ý trước presentation.
- Chơi tiếp tìm màn chưa thắng ở độ khó tương ứng và prerequisite qua preview/launch hiện có; không đổi phiên đang chơi bằng thao tác DOM giả.
- Chọn SVG native: cùng góc nhìn, từng cấp có vật liệu và biểu tượng khác; không tải thêm tám raster. Phương án raster chỉ cần khi SVG không đạt chất lượng mẫu. Ưu tiên transform/opacity, một hero, không particle/loop nền. Animation sau commit hữu hạn 850 ms, reduced-motion hiển thị kết quả ngay; scope hủy được.
- Sau thắng: +10 kinh nghiệm và tên rương, trước→sau; chỉ delta lần đầu, không phát lại khi reopen. Xu và mảnh tranh tách dòng.

R0 hoàn tất: luật/copy/owner và lựa chọn kỹ thuật rõ. R1–R6 thực hiện tuần tự và lưu kết quả trong receipt chung. Giới hạn máy thật giữ nguyên: chưa có S22 Ultra.

R1: mẫu SVG C/S và cả bộ được kiểm bằng browser tại412×915, sáu trạng thái,4thẻ luôn hiện và không tràn ngang. SVG là artwork/fallback cùng nguồn, không fetch raster. Ảnh mẫu lưu trong QA chung. Chọn tiếp tục nativeSVG; không tạo támảnh raster.

R2–R6 hoàn tất20/10: receipt canonical/expectedTier, bảng4rương/preview, summary kinh nghiệm và opening sau commit; retry/identity/cancel/responsive được kiểm chứng. Chọn SVG native, không thêm ảnh rương raster. Unit33/33, UI60/60+3boundary, check/build/production2/2 đạt; review độc lập không còn P1/P2 xác nhận. Chi tiết và giới hạn máy thật trong receipt chung; đây là ghi chú thiết kế, không là một kế hoạch active thứ hai.
