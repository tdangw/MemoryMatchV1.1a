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
W1: weighted candidate, Spark/service, rules generated và emulator — đạt.
W2: vòng10ô, ảnh rương theo skin, mở hộp/toast/âm thanh và nhận quà giữ — đạt.
W3: review độc lập, unit/UI/lifecycle/responsive/reduced-motion, check/build,
commit theo phase — đạt. Rules vòng quay đã phát hành và đọc lại xác nhận
đúng nội dung06/11; ngoài vùng Spark giống hoàn toàn bản production trước
phát hành. Không deploy Hosting/APK.

Nghiệm thu 06/11 đang thực hiện:
- Model/service/catalog được review độc lập; 66/66 unit regression đạt.
- Service thật với Auth/Firestore cục bộ: 2/2 đạt, gồm mất phản hồi và
  claim quà khi có lượt quay đang chờ; không cấp trùng/không xóa lượt chờ.
- UI: 12/12 đạt; 5 skin × 4 viewport (320/412/844/1024), đủ 10 kết quả,
  reduced-motion, 20 chu kỳ đóng giữa hiệu ứng, không còn node/animation.
  Kiểm tra thêm 4 mẫu rương riêng mỗi skin: đạt. Default dùng lại ảnh
  woodland C/B/A/S; các skin khác dùng bộ rương riêng hiện có.
- npm run check và npm run build: đạt. Không đo FPS thiết bị thật.
- Rules/emulator: đạt đủ10ô, nhận quảng cáo trễ với29 receipt cũ,
  13 yêu cầu giả bị từ chối (gồm ordinal trùng/lùi/vượt10). Regression
  liveops cũ đạt; ghép chữ13 luồng hợp lệ/15 yêu cầu giả bị từ chối.
  Nguồn rules dùng kiểm tra ordinal tăng theo ngày (trần10), không lặp
  lại kiểm tra receipt cũ; nhóm10 phép so sánh và catalog regex chính xác
  giữ trong ngân sách biểu thức. Model vẫn phát ordinal liên tiếp.
- Commits: W0 `25fecd7`; W1 `2fe6cc9`; W2 `ce9c34e`. W3 chỉ ghi nhận
  nghiệm thu/context. Giữ riêng toàn bộ thay đổi ACCOUNT_RELEASE đang dở.
- Không đổi ID/effect/kho đang có; Spark save version1 tương thích cũ.
  Trường wheel.version2 và pendingWheel là phần mở rộng có kiểm tra đã
  được phê duyệt. Chưa kiểm thử provider quảng cáo/thiết bị Android thật.

Không commit ảnh/log/fixture tạm trong runtime. Không tuyên bố FPS thiết
bị thật nếu chưa đo. Ghi nghiệm thu tại đây khi đóng task.
