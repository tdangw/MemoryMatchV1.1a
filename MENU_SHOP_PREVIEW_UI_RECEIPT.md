# Nghiệm thu Menu, Cửa hàng, Preview — 28/10/2026

Đã hoàn tất giao diện cùng các bổ sung trong chat. Nguồn hiện hành ở
mục Menu/Cửa hàng/Preview của CONTEXT; kế hoạch triển khai đã được gộp
vào đó, không dùng tài liệu cũ để phục hồi bố cục trước.

- Tab chức năng: Xu bên trái, tên giữa, đóng bên phải; Cài đặt không
  mount ví. Home có ví trên cùng. Bản đồ giữ tên game giữa/avatar trái,
  ví nằm dưới X bên phải; kế tiếp là hai icon Nhiệm vụ/Sự kiện. Khung
  icon Kho báu/Bộ sưu tập ở trên trái, khung chế độ tròn ở dưới trái.
  Màn ngang tách hai khung trái thành hai cột để không chồng nhau.
- Cùng component ví, subscription theo owner; nhận patch.coins, bỏ qua
  commit không đổi tiền. Reset/restore đọc canonical với generation guard.
  Sửa lỗi data.coins undefined từ hợp đồng subscriber dùng sai; không sửa
  persistence để hợp thức hóa callback. Số0 và định dạngvi-VN đều đúng.
- Shop: nền/icon/chữ dựa cặp ui-ink/ui-inset, sửa chữ nhạt trên Cổ tích;
  mua và Play có chiều sâu nhẹ2px, nhấn1px, không loop. Hủy/Mua ngay cùng
  kích thước/bo góc/độ nổi, phân biệt màu; không tự đổi giá/quà/handler.
- Preview dùng ô timer/cards/eye/hints/theme/tray theo adapter thật; không
  hardcode75s/6cặp/5s. CTA xanh lớn64px/fullwidth, giữ khóa độ khó/submit.
  Kho báu icon giữ block/ready và mô tả aria; chi tiết vẫn ở popup.
- Web giữ fullscreen/focus fallback; native không tạo control/listener.
  MainActivity dùng WindowInsetsControllerCompat, hide systemBars tại
  create/resume/focus, cho vuốt xem thanh hệ thống tạm thời. Không APK.

Cân nhắc ví riêng mỗi trang với component chung: chọn chung để một nguồn
số dư và cleanup. Chọn CSS/SVG tĩnh với pressed transition hữu hạn thay
engine3D/raster/loop. Lối tắt dùng cùng navigate/page owner với dock qua
WeakMap có cleanup; không tạo luồng điều hướng kinh tế riêng.

Bằng chứng web tại runtime/qa (ignored):
- Matrix320/412/1024, ba trò×năm skin cho menu/preview/shop đã đạt ba case;
  25header theo năm skin, settings không ví và balance cập nhật đạt.
- menu-wallet-contract.log4/4: header/rapidbuy/dedup,30owner/reduced-motion,
  đúng payload persistence, zero/reset/restore; không console subscriber error.
- menu-final-gallery.log5/5: gallery412, mua đúng một lần,30owner, patch,
  Hủy/Mua ngay cân bằng cả năm skin. Ảnh default/storybook đã xem trực tiếp.
- menu-shortcut-final.log3/3: submit khóa đúng, patch và shortcut routes.
  map-five-skins.log2/2: layout/route ở320/412 năm skin, landscape844×390
  không chồng khung/dock. Icon rương mở Kho báu, collection mở đúng tab,
  missions/events mở đúng page và quay lại map qua dock.
- node --check8module, CSS ownership và check-adventure-preview.mjs đạt.
  Java :app:compileDebugJavaWithJavac --offline exit0 (69task,20s), log
  menu-native-compile.log; chưa tạo hoặc chạy APK/S22 thật.
- npm run build exit0, menu-final-build.log. Hai cảnh báo public asset marker
  là baseline có từ trước; output không còn literal marker đó. Không deploy.

Các lần test đầu phát hiện lỗi callback ví và padding lệch28px của header
Liveops đã sửa; test luồng Chơi được seed skipped tutorial đúng phạm vi
submit rồi chờ launch promise, không đổi first-play runtime hoặc nới guard.
Không tự review là review độc lập; đã đọc diff riêng sau implementation và
chạy bằng chứng trên. Không tuyên bố FPS/kiểm chứng native vật lý.

Commits: M1 4bf4129; M2 793bcf6; M3 542deac; sửa hợp đồng ví f63e2ec;
Q chứa chỉnh theo phản hồi cuối, nghiệm thu và đồng bộ context. Không
stage log/ảnh/test QA ignored hoặc thay đổi gameplay/drop task song song.
