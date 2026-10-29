# Nghiệm thu Quà tặng bất ngờ — 29/10/2026

## Quyết định đã duyệt

- Một quà/lần:1vé quay hoặc100Xu hoặc1hỗ trợ; ba nhóm mỗi nhóm1/3.
  Hỗ trợ chọn đều ba trò, rồi đều loại trong pool rương3/4/4 hiện hành.
- Lần đầu nhận ngay; tiếp theo sau60phút thực tế kể cả khi đóng game,
  không tích lượt. Cần tài khoản/kết nối. Mốc chung theo tài khoản, cả ba trò.
  Kho đầy dùng quy đổi10Xu đã có; không đổi ID, pool hoặc luật quà khác.
- Thay đổi cuối: popup chỉ hộp quà và nút Mở quà; title Quà tặng bất ngờ.
  Đồng hồ ở dưới icon bản đồ trong nút48px. Bấm mở: lưu trước, đóng popup,
  mở hộp/rơi/thu quà trên map, thông báo phần thưởng ngắn.

## Triển khai

- A: ae11691. Model thuần hourlyGift, candidate lưu trước giao dịch, sequence
  và last receipt để chống nhận trùng/replay, dữ liệu có giới hạn. Field mới
  tùy chọn trong Spark; save cũ không có field vẫn đọc được, không reset.
- Mốc nhận dùng serverTimestamp trong private liveops. Publisher giữ nguyên
  Timestamp cũ trên giao dịch khác; model dùng số ms. Rules chặn sớm/backdate/
  sửa trạng thái khác, liên kết revision/root; generator là nguồn rules.
- Quà vào cùng giao dịch profile/snapshot hiện có. Đồng hồ sau commit đọc
  lại mốc canonical; nếu chỉ lần đọc này mất mạng, quà vẫn giữ và countdown
  tạm tính bảo thủ. Tick không đọc/ghi Firebase. Cache UI giới hạn một view,
  interval/listener thuộc map/modal và được hủy theo owner.
- B: icon SVG theo skin, ba nút dọc bên phải với vạch phân cách. Popup tối giản,
  retry/cooldown nằm trong trạng thái nút; không thêm dòng mô tả. Scope hiệu
  ứng thuộc map nên tiếp tục sau đóng popup, hủy khi map bị thay thế.
- Timeline: nhún120ms, mở nắp320ms, kết quả350ms, bay850ms lệch pha; tối đa
  sáu coin hoặc một vé/hỗ trợ; hold thông báo1s rồi dọn. Transform/opacity,
  không RAF loop, không bitmap mới. Reduced-motion hiện tĩnh; ẩn trang kết
  thúc animation, âm thanh theo setting, không phụ thuộc animation để cấp quà.

## Bằng chứng

- Unit5/5: nhóm RNG/biên, đủ60phút, không tích lượt, replay, save cũ/hỏng,
  Timestamp, đầy kho và cấp vé một lần. tests/unit/hourly-gift.test.js.
- Emulator độc lập demo-hourly-gift: hai client chỉ một giao dịch thành công,
  mốc máy chủ, chặn sớm/backdate, giờ tiếp theo,100Xu, hỗ trợ vào đúng kho ba
  trò, login cũ sau claim và không đọc tài khoản khác. hourly-emulator.log.
  Log PERMISSION_DENIED ở đây là các ca cố ý bị chặn, không phải ca thành công.
- UI4/4:320×640/412×915/844×390, năm skin; popup tối giản, một nút, clock không
  tăng vùng bấm; bấm đôi chỉ một grant, đóng trước FX, thu sáu coin; vé/hỗ trợ,
  cooldown/retry/chờ mạng; rời map ngắt FX, không còn node/particle; diagnostics
  bằng baseline. hourly-ui.log. Tương phản năm skin kiểm lại đạt1/1 ở412px.
  QA dùng service fixture cho UI; không coi đó là chứng minh giao dịch thật.
- Syntax/CSS ownership/generator --check và npm run build đạt; ảnh default320
  và Cổ tích ngang đã xem. hourly-build-final.log; cảnh báo Vite đã có về asset
  marker và module import tĩnh/động. Không tuyên bố đo FPS hoặc S22 vật lý.
- Firestore rules: user cho phép trực tiếp sau lỗi403. Lệnh deploy chỉ
  firestore:rules/project memorymatchv1-1a thành công, server xác nhận compile
  và release (hourly-rules-deploy.log). Không deploy Hosting/APK, không sửa
  dữ liệu người chơi và không tự bấm nhận quà trên tài khoản thật.
- Chỉnh ô mô tả Vô tận/Thử thách được ưu tiên và commit riêng38121cd; không
  gom thay đổi audit/chữ hoặc ảnh/log QA của các task khác vào phase quà.
