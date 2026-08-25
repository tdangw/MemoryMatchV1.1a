# CONTEXT — Trạng thái dự án hiện tại

## Phạm vi

- Dự án là game web JavaScript thuần, tối ưu cho màn hình mobile dọc.
- Không còn Android/Capacitor, APK/AAB, AdMob, quảng cáo hoặc vùng giữ chỗ quảng cáo.
- Firebase Hosting project là `memorymatchv1-1a`; game không dùng Firebase Web SDK hay backend.

## Chạy, kiểm tra và phát hành

- `npm run dev`: chạy môi trường Vite cục bộ.
- `npm run check`: kiểm tra các module JavaScript trong `js/`.
- `npm run build`: build cho Firebase Hosting tại base `/`.
- `npm run deploy`: build và deploy Firebase Hosting.
- `npm run build:gh-pages`: build tại base `/MemoryMatchV1.1a/`.
- `npm run deploy:gh-pages`: deploy `dist/` lên nhánh GitHub Pages.

## PWA

- `public/manifest.webmanifest` đặt chế độ `standalone` và ưu tiên `portrait-primary`.
- `js/pwa.js` đăng ký `public/sw.js`; service worker cache app shell và asset giao diện/gameplay, không cache tùy tiện mọi phản hồi cùng domain. Chỉ cache phản hồi đầy đủ HTTP `200`, bỏ qua request `Range` để không lỗi với audio tải từng đoạn.
- Người chơi cài từ Chrome qua “Cài đặt ứng dụng” hoặc “Thêm vào Màn hình chính”; mở từ icon sẽ chạy toàn màn hình.

## Gameplay và Cửa hàng

- Có 4 mặt lưng thẻ và 7 hiệu ứng lật/hiện thẻ. Ngoại hình mua bằng Xu, lưu theo thiết bị và trang bị trong tab **Ngoại hình** của Cửa hàng.
- **Bộ sưu tập** gồm chủ đề Mặc định (1.000 ảnh); năm chủ đề ảnh 3D gồm Động vật chibi, Đồ ăn & thức uống, Thiên nhiên, Cây cối & hoa lá, Hình học (24 ảnh WebP 256×256/chủ đề); và các chủ đề tạo bằng mã: Chữ cái, 2 Số, 3 Số, Ký hiệu máy tính. Các thẻ tạo mã dùng SVG, không emoji: Chữ cái là khối đồ chơi 3D xanh–tím, 2/3 Số là bảng số điện tử xanh ngọc, Ký hiệu máy tính là phím chức năng xanh đậm; mỗi giá trị có biến thể màu cố định để hai thẻ cùng cặp luôn giống nhau. Trong giai đoạn kiểm thử, mọi chủ đề có thể mua đều có giá **1 Xu**; cần cân bằng lại trước phát hành.
- Các chủ đề Cyberpunk, RPG phép thuật, Vũ trụ, Vật dụng gia đình, Đồ dùng văn phòng, Dụng cụ làm vườn, Thời trang & phụ kiện, Phương tiện giao thông, Cổ vật & gián điệp, Lễ hội đang hiển thị **Sắp có** cho đến khi đủ asset.
- Tab **Vật phẩm** chỉ chứa vật phẩm tiêu hao từ `js/shopCatalog.js`; không có phần thưởng xem quảng cáo. Mua thời gian có các mốc 10/30/45/60 giây. Xem trước có 4/8/12 thẻ với giá 5/10/15 Xu; giá xem toàn bộ bằng `ceil(số thẻ chưa ghép × 1,25)`.
- Khi đang chơi, HUD có bảy thành phần cân đối: Menu và Mua thời gian bên trái; Cấp, Thời gian, Điểm ở giữa; Xem trước thẻ và Gợi ý bên phải. Hai thao tác mua/xem trước mở popup tối, hiện số Xu tại header, mua/dùng ngay; bàn cờ khóa trong lúc xem trước.
- **Bộ sưu tập** chỉ mở bên ngoài ván chơi (menu chính và màn chọn chế độ), không nằm trong menu trong game.
- Thời gian nền theo độ khó: **6/90/120/180 giây** từ Dễ đến Siêu khó. Mốc 6 giây ở Dễ là cấu hình thử nghiệm; đổi lại 60 trước khi phát hành. Gợi ý chưa dùng tích lũy, nhận thêm từ level 2 và giới hạn 10 lượt.
- Combo bắt đầu tại x2: mỗi cặp đúng cộng số giây bằng cấp combo; ghép sai đặt lại combo và trừ 1 Xu khỏi thưởng cuối màn.
- `style.css` giữ kiểu nền dùng chung; CSS Shop và hiệu ứng gameplay đã tách sang `styles/shop.css` và `styles/gameplay-effects.css`.

## Cài đặt và hiệu ứng nền

- Cài đặt được lưu trên thiết bị: âm thanh hiệu ứng, nhạc nền, âm lượng từng loại và **Hiệu ứng nền**.
- `js/backgroundEffects.js` quản lý sao băng: tối đa 2 phần tử đồng thời, tạo thưa 3,2–7 giây/lần, tự dừng khi người chơi tắt, tab bị ẩn hoặc hệ điều hành yêu cầu giảm chuyển động. Cài đặt **Hiệu ứng nền** cũng ẩn toàn bộ mây/sương CSS. Nền ảnh WebP vẫn là nền chính; chỉ còn hai mây mờ trôi rất chậm và một lớp sương nhẹ để giảm chi phí vẽ trên mobile.

## Ghi chú kỹ thuật còn lại

- Giá vật phẩm, mốc thời gian, layout theo độ khó và thời lượng hiệu ứng được gom ở `js/shopCatalog.js`, `js/config.js`, `js/gameplayTuning.js`: đây là hằng số sản phẩm có chủ đích, không phải mã cứng rải rác.
- `style.css`, `styles/hud.css` và `styles/modals.css` vẫn chứa một số selector giao diện đời cũ/chung chung (như `.game-header`, `.header-left`, `.shop-item-grid`) song song với style đã tách. Chúng chưa gây lỗi logic, nhưng có thể ghi đè nhau khi phát triển giao diện; cần một đợt gom CSS có kiểm thử hiển thị trước khi xóa hàng loạt.
- `background-attachment: fixed` của ảnh nền có thể gây cuộn/paint kém trên một số máy Android yếu; nếu nhận phản hồi giật, ưu tiên vô hiệu `fixed` riêng cho mobile thay vì giảm chất lượng ảnh.

## Hiệu ứng chiến thắng

- Pháo hoa canvas nằm ở `js/fireworkEffect.js`. Ba vụ nổ cuối luôn xóa hạt cũ trước khi nổ để tạo vòng tròn đầy đủ, không bị khuyết.
- Cảnh hoa độc lập ở `js/victoryCelebration.js`; template và CSS tương ứng là `js/victoryFlowerScene.js`, `js/victoryFlowerSourceTemplate.js` và `styles/victory-flower*.css`.
- Hiện thử nghiệm cảnh hoa ở level 1: `GAMEPLAY_TIMING.victoryCelebration.triggerLevel = 1`. Trước phát hành chính thức, đổi mốc này thành 100.
- Hoa nở trong 6,4 giây; pháo hoa khởi động trước khi hoa nở xong 2 giây. Sau khi hiện lời chúc và âm thanh `congratulations.mp3` kết thúc sẽ có ba đợt pháo hoa cuối.

## Dữ liệu và asset

- Hình/âm thanh runtime ở `public/assets/`; ảnh thẻ mặc định ở `public/assets/images/themes/default/`.
- Skill tái sử dụng `C:\Users\Dang\.codex\skills\memory-match-image-assets\SKILL.md` quy định quy trình tạo ảnh chủ đề: xác nhận phạm vi thay thế, tạo lưới vuông N×N, kiểm tra tỉ lệ nguồn trước khi cắt, xuất WebP 256×256 và kiểm tra trực quan mẫu. Không cắt từ lưới chữ nhật hoặc dùng cắt tự động theo nội dung.
- `source-assets/` là asset gốc để chỉnh sửa, không được build/deploy.
- Dữ liệu người chơi lưu bằng `localStorage`, không commit.
