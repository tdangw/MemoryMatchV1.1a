# Sưu tập chữ và ghép ba chữ bất kỳ

Nguồn: yêu cầu chủ dự án31/10/2026. Kế hoạch hiện hành duy nhất của task.

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
Phase F1: model/rules tương thích cũ, unit+emulator.
Phase F2: panel bộ chữ, popup Ghép/Bán, chọn nguyên liệu và kết quả.
Phase F3: review/QA mobile320/412/ngang/desktop,5skin, chọn nhanh/đóng/
retry/UID/replay/reduced-motion, check/build và cập nhật context.

Không tự deploy Hosting/APK. Việc phát hành rules ghép cần đúng quyền
triển khai; hoàn thiện source và emulator trước bước phát hành.
