# Vòng ghép chữ và ưu tiên chữ thiếu

Đã hoàn tất. Nguồn yêu cầu01/11/2026, đóng04/11/2026; không còn active.

- Nút tâm là hành động Ghép/Thử lại; bỏ nút Ghép/Ghép tiếp phía dưới.
  Sau kết quả, chọn chữ trong kho để bắt đầu lượt mới.
- Một nút tròn đồng tâm, viền kim loại 3D dùng token skin; không còn
  SVG vòng rời bị lệch theo tỷ lệ khung chứa. Chọn/có kết quả cùng một tâm.
- Sau commit: ba ảnh chữ tạm thu vào tâm trong 520ms, stagger60ms;
  kết quả lóe480ms và dùng hiệu ứng chữ rơi/âm thanh hiện có. Tối đa3
  ghost +1 aura và1letter feedback; không animation loop, timer hoặc grant
  theo animation. Owner hủy khi đóng, reduced-motion/hidden kết thúc ngay.
- Đã cân nhắc animate node thật hoặc ghost. Chọn ghost vì không thay đổi
  bố cục và trạng thái chọn; chỉ đọc vị trí một lần rồi animate transform/
  opacity. Nút tâm giữ transform định vị, chỉ animate face/aura bên trong.
- Luật chủ dự án đã duyệt: ưu tiên hoàn toàn chữ có count0 trước khi trừ
  ba nguyên liệu; chọn đều trong pool thiếu. Có đủ17loại thì đều cả17.
  Giữ giá bán và tiêu hao, legacy pending/receipt/replay; entropy bền vững
  qua retry/CAS, không bốc lại khi mất phản hồi. Rules bảo vệ luật mới.

Phase1: model/service/rules, unit và emulator — đạt, ed959aa.
Phase2: nút tâm/vòng3D và timeline có cleanup, UI regression — đạt,965995e.
Phase3: review, check/build và phát hành riêng rules theo quyền đã cấp;
context — đạt.17unit, hai emulator,15 dữ liệu giả bị chặn; UI20ca+1ca
đóng giữa absorb20vòng đạt. Rules báo released/Deploy complete. Chưa đo
FPS thiết bị thật; không dùng mô tả60FPS làm kết quả nghiệm thu.

Không đổi Hosting/APK. Không đưa log, ảnh thử vào commit.
