# Quà tặng 60 phút — kế hoạch hiện hành

Đã duyệt29/10: mỗi lần nhận một quà; vé quay/100Xu/hỗ trợ mỗi nhóm1/3.
Hỗ trợ chọn đều ba trò rồi đều vật phẩm trong pool rương hiện hành. Lần đầu
nhận ngay; đủ60phút thực tế từ lần nhận trước, gồm thời gian đóng game,
không tích lượt. Nhận online; vượt kho dùng chính sách10Xu hiện có.

## A — Luật và lưu thưởng
- Mốc thời gian máy chủ trong tài liệu liveops hiện hữu, không tạo lịch sử
  tăng vô hạn. Giao dịch liên kết root/snapshot, idempotency và candidate
  bền vững dùng chung service. Save cũ thiếu field vẫn đọc được.
- Rules do generator sinh; chặn sớm/đổi giờ/chèn key/nhận song song.
- Unit5ca đạt; Firebase giả lập riêng đạt, không chạm dữ liệu thật.

## B — Giao diện và hiệu ứng
- Icon quà dưới Sự kiện, ngăn cách từng nút, giữ48px vùng bấm và skin.
- Popup online/cooldown/lỗi/thử lại; đóng về map; chỉ lưu quà qua service.
- Hiệu ứng hữu hạn khoảng1,3giây: anticipation120ms, mở hộp320ms,
  quà xuất hiện350ms, sáu vật phẩm/đồng xu bật ra-rơi-bay về đích850ms.
  Chỉ transform/opacity; tối đa sáu particleSVG, không ảnh mới/RAF loop.
- Scope hủy animation/node/listener; giảm chuyển động và khi ẩn dùng trạng
  thái tĩnh/resolve. Animation không quyết định việc cấp quà.

## Q — Nghiệm thu
- Kiểm tra ranh60phút, replay/xung đột/offline/thay account, phần thưởng
  vào đúng kho, dữ liệu cũ và rules bằng emulator độc lập.
- Matrix mobile hẹp/phổ biến/ngang, năm skin, reduced-motion và nhiều
  chu kỳ đóng/mở/đóng giữa effect; build web. Không APK/deploy tự động.
- Commit theo phase; cập nhật CONTEXT/receipt rồi bỏ plan hoàn tất.
