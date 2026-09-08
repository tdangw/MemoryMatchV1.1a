# Game Shell — Phase 6

## Triển khai

- `gameShellEffects.js` quản lý registry theo scope của lượt chơi, giới hạn đồng thời theo loại, cleanup và API trình bày node, animation, bay tới đích, nhấn sáng. Core chỉ nhận node/keyframe/thời lượng; không đọc state hay tính thưởng.
- Giới hạn mặc định: loot 16, Xu 32, điểm 12, combo 2, vật phẩm 12, highlight 8, FLIP 256, canvas 4. Registry cho phép override số nguyên 0–512 với key hợp lệ. Vượt giới hạn bỏ hình ảnh dư; loot vẫn gọi callback nhận thưởng ngay một lần, không làm mất thưởng.
- `lootEffects.js` dùng một quỹ đạo drop/hold/collect cho Memory và hai adapter Link (năng lượng, vật phẩm), có preset và schema timing. Link giữ thời lượng từ cấu hình game; hình đường bay và biểu tượng dùng nền loot chung, cần xác nhận cảm nhận thủ công.
- Xu và nhãn điểm/combo dùng giới hạn/cleanup chung. Phép tính Xu vẫn trong `coinRewards.js`, luật thưởng/mốc vẫn trong controller; không chuyển vào registry.
- Bay từ cửa hàng và highlight dùng transform/opacity. FLIP Link dùng cùng API animation và giữ node bàn. Memory chưa có FLIP cần di chuyển. Canvas xóa thẻ/sấm sét giữ renderer riêng, dùng registry và RAF lifecycle hiện có.
- Loại bỏ animate filter/color ở nhấn sáng Xu. Keyframe API mới chỉ chấp nhận transform/opacity cùng metadata; không thêm will-change dài hạn lên HUD/bàn. CSS và adapter legacy chưa dùng được dọn ở Phase 7–8.

## Kiểm chứng có chọn lọc

- Kiểm tra cú pháp 62 module đạt; production build đạt (CSS gzip 31,02 kB, JS gzip 82,83 kB; gồm bộ ảnh hiện có trong workspace).
- 6 ca desktop đạt: hai ca cleanup hiện có, bốn ca registry/motion mới. Bao gồm spam ở hai trò, giới hạn Xu/loot/item, callback khi bỏ bớt hình ảnh, cleanup đổi trò, hủy animation, giảm chuyển động, hoàn tất thu thưởng một lần và keyframe chỉ transform/opacity.
- Không chạy lại full suite hoặc audit hình học vì không đổi cấu trúc HUD/bàn. Không tuyên bố đã đo GPU layer/FPS trên điện thoại.

## Chờ kiểm tra thủ công trước Phase 7

1. Chơi hai trò trên điện thoại dọc/ngang, ghép liên tiếp và nhận mốc thưởng: nhìn đường bay, điểm/combo/Xu và độ mượt.
2. Trong lúc vật phẩm đang bay, về menu/đổi trò/chơi lại; không còn hình ảnh cũ hoặc cập nhật nhầm trò.
3. Bật giảm chuyển động trên thiết bị: phần thưởng vẫn đủ; thử xáo trộn Link và hiệu ứng sấm sét/xóa thẻ.

Chưa triển khai Triple Connect.
