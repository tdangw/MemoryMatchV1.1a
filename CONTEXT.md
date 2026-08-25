# CONTEXT — Bộ nhớ làm việc

## Hạng mục đã hoàn thành

Đã triển khai hệ ngoại hình thẻ: mua một lần bằng Xu, lưu vĩnh viễn theo thiết bị và trang bị ngay trong tab **Ngoại hình** của Cửa hàng.

## Phạm vi đã triển khai

- 4 mặt lưng: Hoàng hôn (mặc định), Đêm sao, Cực quang, Kẹo sắc màu.
- 7 hiệu ứng lật/hiện thẻ: Bật nảy (mặc định), Mờ phóng to, Nảy nhanh, Trượt lên, Lật 3D, Xoay thu phóng, Tan mờ.
- Ngoại hình được chọn áp dụng cho các bàn chơi tạo sau khi trang bị; hiệu ứng lật áp dụng ngay cho lần lật tiếp theo.

## Hướng tiếp theo (nếu cần)

- Thêm vật phẩm tiêu hao tại `js/shopCatalog.js`; điều chỉnh mốc combo hoặc thời lượng lật/ẩn thẻ, popup combo, Shop và intro màn tại `js/gameplayTuning.js`.
- CSS Shop và CSS hiệu ứng gameplay đã được tách tương ứng sang `styles/shop.css` và `styles/gameplay-effects.css`; `style.css` tiếp tục giữ kiểu nền dùng chung.

- Có thể bổ sung thêm mẫu mặt lưng dạng ảnh hoặc gói ngoại hình theo chủ đề.
- Kinh tế hiện dùng thời gian màn 60/90/120/180 giây (Dễ đến Siêu khó), thưởng Xu tăng theo độ khó và tốc độ; "Xem trước tất cả" tính 10 Xu cho mỗi thẻ chưa ghép.
- Combo bắt đầu từ x2: mỗi cặp đúng cộng số giây bằng cấp combo (x2 +2 giây, x3 +3 giây…); miss đặt lại combo và trừ 1 Xu từ phần thưởng cuối màn. Kỷ lục lưu lâu dài đã được loại bỏ, HUD chỉ hiển thị điểm của lượt chơi hiện tại.
- Mỗi level cộng tối đa 30 giây tiến trình (3 giây/level), đặt lại từ thời gian nền; gợi ý chưa dùng tích lũy, nhận thêm 1 lượt từ level 2 và giới hạn 10 lượt.
- Popup đầu màn hiển thị màn chơi, độ khó và ba chỉ số gọn bằng icon: điểm, thời gian, gợi ý.

## Hiệu ứng chiến thắng cuối chặng

- Hiệu ứng vườn hoa là một lớp riêng, không can thiệp luật chơi: `js/victoryCelebration.js` điều phối, `js/victoryFlowerScene.js` và `js/victoryFlowerSourceTemplate.js` giữ cảnh hoa, CSS nằm tại `styles/victory-flower*.css`.
- Hiện đang thử nghiệm ở level 2 (`GAMEPLAY_TIMING.victoryCelebration.triggerLevel`); trước khi phát hành đổi mốc này thành level 100. Người chơi vẫn xem popup tổng kết và pháo hoa như bình thường, sau đó bấm nút `Congratulations!` để vào cảnh hoa.
- Trong cảnh hoa, sau khi hoa nở xong mới hiện chữ `Congratulations!` và phát `congratulations.mp3`. Chạm/rê lên chữ chỉ làm hiện hạt; chạm lần nữa để hiện hoặc ẩn nút Menu/Tiếp tục. Ba bông hoa chính có thể đu đưa khi chạm.
- Nhạc cảnh hoa là `victory-flower-theme.mp3`; nhạc menu chọn ngẫu nhiên một lần mỗi phiên giữa `menu1.mp3` và `menu2.mp3`.
- Nút `Congratulations!` trong popup tổng kết dùng nền đỏ chiến thắng, chữ và viền vàng sáng. Selector phải đi qua overlay `#level-summary-modal .level-summary-modal--victory` để không bị style nút xanh chung ghi đè.
