# Sưu tập chữ và ghép ba chữ bất kỳ

Nguồn: yêu cầu chủ dự án31/10/2026. Đã hoàn tất01/11/2026; không còn active.

- Bốn bộ MEMORY MATCH/LINK CONNECT/TRIPLE CONNECT/ADVENTURE thành tab
  nhỏ một hàng cuộn ngang, rương đúng bộ ở bên phải. Kho17chữ bên dưới.
- Chạm chữ mở popup Ghép/Bán/X. Ghép mở bảng3ô, chọn ba đơn vị chữ bất
  kỳ (được lặp nếu đủ tồn), có thể bỏ/chọn lại; xác nhận mới trừ kho.
- Ra1chữ chọn đều17loại hiện có, có thể trùng nguyên liệu. Giữ10Xu/chữ
  khi bán và bảng rương đã chốt. Không thêm currency, pity, quota hoặc cap.
- Giữ pending/receipt/command ghép cùng chữ cũ; bổ sung ingredients[3]
  cho giao dịch mới, sequence/CAS/replay/UID guard không đổi. Rules chứng
  minh từng delta chữ, không cấp/trừ từ animation hoặc từ thao tác chọn.
- UI tiếp tục theo5skin và atlas hiện có; tham khảo bố cục3ô quanh tâm,
  không sao chép nhãn/nội dung hoặc tạo ảnh mới. Mỗi popup có owner; đóng
  hoặc đổi tài khoản không để callback cũ sửa popup mới. Quà đã commit
  vẫn giữ dù đóng. Reduced-motion không phụ thuộc hoạt ảnh để grant.

Phase F0: chốt phạm vi và mapping owner (xong).
Phase F1: model/rules tương thích cũ, unit+emulator (xong).
Phase F2: panel bộ chữ, popup Ghép/Bán, chọn nguyên liệu và kết quả (xong).
Phase F3: review/QA mobile320/412/ngang/desktop,5skin, chọn nhanh/đóng/
retry/UID/replay/reduced-motion, check/build và cập nhật context (xong).

Nghiệm thu và phát hành:
- Receipt mới có ingredients và letter hint khớp phần tử đầu để client
  cũ vẫn đọc được; lệnh hai nguồn nguyên liệu vẫn bị từ chối.
- 6unit mới, policy/generator đạt. Emulator ghép và liveops rộng đạt,
  12trường hợp giả mạo bị từ chối; không sửa schema version hoặc reset.
- UI22ca đạt, thêm4ca kết nối đạt;40tổ hợp skin/viewport/motion,20vòng
  cleanup. Hai lỗi review (tab bị khuất, mở popup khi đang lưu) đã sửa
  và có regression. npm run check và build cuối đạt.
- Bổ sung01/11: căn giữa thông báo kết nối/Thử lại, bỏ nút Tải lại tiến
  độ Nhiệm vụ; recovery theo lỗi giữ và không thêm polling.
- Chủ dự án đã cấp quyền phát hành rules; Firebase báo released và
  Deploy complete cho firestore:rules, project memorymatchv1-1a.
- Không deploy Hosting/APK. Auth+Firestore browser online suite chưa
  chạy; emulator giao dịch đã đạt. Chưa đo hiệu suất thiết bị thật.
