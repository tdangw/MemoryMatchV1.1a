# CONTEXT — Trạng thái dự án hiện tại

## Phạm vi

- Dự án là game web JavaScript thuần, tối ưu cho màn hình mobile dọc.
- Không còn Android/Capacitor, APK/AAB, AdMob, quảng cáo hoặc vùng giữ chỗ quảng cáo.
- Firebase Web SDK vẫn được dùng; Firebase Hosting project là `memorymatchv1-1a`.

## Chạy, kiểm tra và phát hành

- `npm run dev`: chạy môi trường Vite cục bộ.
- `npm run check`: kiểm tra các module JavaScript trong `js/`.
- `npm run build`: build cho Firebase Hosting tại base `/`.
- `npm run deploy`: build và deploy Firebase Hosting.
- `npm run build:gh-pages`: build tại base `/MemoryMatchV1.1a/`.
- `npm run deploy:gh-pages`: deploy `dist/` lên nhánh GitHub Pages.

## PWA

- `public/manifest.webmanifest` đặt chế độ `standalone` và ưu tiên `portrait-primary`.
- `js/pwa.js` đăng ký `public/sw.js`; service worker cache app shell và chỉ cache phản hồi đầy đủ HTTP `200`, bỏ qua request `Range` để không lỗi với audio tải từng đoạn.
- Người chơi cài từ Chrome qua “Cài đặt ứng dụng” hoặc “Thêm vào Màn hình chính”; mở từ icon sẽ chạy toàn màn hình.

## Gameplay và Cửa hàng

- Có 4 mặt lưng thẻ và 7 hiệu ứng lật/hiện thẻ. Ngoại hình mua bằng Xu, lưu theo thiết bị và trang bị trong tab **Ngoại hình** của Cửa hàng.
- Tab **Vật phẩm** chỉ chứa vật phẩm tiêu hao từ `js/shopCatalog.js`; không có phần thưởng xem quảng cáo.
- Thời gian nền theo độ khó: 60/90/120/180 giây từ Dễ đến Siêu khó. Gợi ý chưa dùng tích lũy, nhận thêm từ level 2 và giới hạn 10 lượt.
- Combo bắt đầu tại x2: mỗi cặp đúng cộng số giây bằng cấp combo; ghép sai đặt lại combo và trừ 1 Xu khỏi thưởng cuối màn.
- `style.css` giữ kiểu nền dùng chung; CSS Shop và hiệu ứng gameplay đã tách sang `styles/shop.css` và `styles/gameplay-effects.css`.

## Hiệu ứng chiến thắng

- Pháo hoa canvas nằm ở `js/fireworkEffect.js`. Ba vụ nổ cuối luôn xóa hạt cũ trước khi nổ để tạo vòng tròn đầy đủ, không bị khuyết.
- Cảnh hoa độc lập ở `js/victoryCelebration.js`; template và CSS tương ứng là `js/victoryFlowerScene.js`, `js/victoryFlowerSourceTemplate.js` và `styles/victory-flower*.css`.
- Hiện thử nghiệm cảnh hoa ở level 1: `GAMEPLAY_TIMING.victoryCelebration.triggerLevel = 1`. Trước phát hành chính thức, đổi mốc này thành 100.
- Hoa nở trong 6,4 giây; pháo hoa khởi động trước khi hoa nở xong 2 giây. Sau khi hiện lời chúc và âm thanh `congratulations.mp3` kết thúc sẽ có ba đợt pháo hoa cuối.

## Dữ liệu và asset

- Hình/âm thanh runtime ở `public/assets/`; ảnh thẻ mặc định ở `public/assets/images/themes/default/`.
- `source-assets/` là asset gốc để chỉnh sửa, không được build/deploy.
- Dữ liệu người chơi lưu bằng `localStorage`, không commit.
