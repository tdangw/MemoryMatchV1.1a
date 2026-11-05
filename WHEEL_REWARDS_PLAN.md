# Vòng quay 10 ô và rương mở ngay

Phạm vi task Vòng quay đã chốt05/11/2026. Công việc tài khoản/Google Play
trong ACCOUNT_RELEASE_PLAN.md thuộc lượt khác; không gom thay đổi đó vào
commit này. Chỉ sửa vùng Spark của rules qua source generator.

| Ô | Phần thưởng | Tỷ lệ |
|---|---|---:|
|1|5 Xu|40%|
|2|10 Xu|25%|
|3|Xu nguyên ngẫu nhiên5–50|15%|
|4|Chọn đều rương C/Avatar/Khung/Huy hiệu, mở theo luật hiện có|1%|
|5|Rương Ngoại hình|2%|
|6|Rương Lật thẻ|2%|
|7|Rương Chủ đề|1%|
|8|Rương Đường nối|2%|
|9|Rương Xóa thẻ|2%|
|10|Rương Hỗ trợ|10%|

- Tổng100%;10ô bằng nhau để đọc trên mobile, xác suất thực ghi rõ trong
  Thể lệ. Tiền ngẫu nhiên chọn đều5–50, không suy xác suất từ diện tích ô.
- Rương mở ngay khi vòng dừng. Theo cập nhật của chủ dự án, tận dụng ảnh
  rương đóng/mở theo skin có sẵn, kèm dấu nhóm để phân biệt; tên rõ nghĩa
  Rương Xu (ô5–50), Rương Hỗ trợ… Không vẽ lại hình rương bằng SVG.
  Toast báo quà thực nhận; không ghi tên kỹ thuật/pool ID lên giao diện.
- Ngoại hình/chủ đề/hiệu ứng dùng danh mục hiện có, bỏ mặc định/starter
  và theme không chơi được; chọn đều trong món chưa có. Đủ bộ hoặc vật
  phẩm đã có do giao dịch khác thì100Xu. Không tự trang bị; giữ đúng kho
  hiện tại, chủ đề Memory/Link chung, Triple riêng.
- Hỗ trợ chọn đều3trò rồi đều các loại trong trò. Nếu kho đầy, kết quả
  bốc được giữ trong một pendingWheel canonical có giới hạn1; không quay
  mới cho tới nhận quà. Quà giữ qua đổi ngày, không cấp giả/không mất vé.
- So sánh: thêm6loại rương vào kho hoặc mở quà trực tiếp trong transaction.
  Chọn mở trực tiếp vì người dùng chốt mở ngay; không nới CHEST_TYPES hay
  đổi bộ rương hiện có. Pending support là ngoại lệ giữ quà khi đầy kho.
- Entropy/candidate lưu trước publish; retry/CAS không bốc lại. Receipt
  wheelV2 tách với8ô legacy, giữ quyền/receipt/pending cũ; save version1
  giữ, thêm trường receipt/pending có kiểm tra. Grant không theo animation.

W0: catalog thuần/entitlement đúng kho, normalize và tương thích dữ liệu —
đạt.228quyền,7unit mới+7unit legacy và check appearance/theme đạt.
W1: weighted candidate, Spark/service, rules generated và emulator.
W2: vòng10ô, hình hộp riêng, mở hộp/toast/âm thanh và state nhận quà giữ.
W3: review độc lập, unit/UI/lifecycle/responsive/reduced-motion, check/build,
commit theo phase. Phát hành riêng rules chỉ khi không kéo theo thay đổi
tài khoản chưa được phép; không deploy Hosting/APK.

Không commit ảnh/log/fixture tạm trong runtime. Không tuyên bố FPS thiết
bị thật nếu chưa đo. Ghi nghiệm thu tại đây khi đóng task.
