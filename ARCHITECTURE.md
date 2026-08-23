# ARCHITECTURE — Bản đồ kỹ thuật V1.1a

> **Nguồn sự thật kỹ thuật duy nhất** của dự án. Chỉ cập nhật khi kiến trúc, hợp đồng dữ liệu, quyền sở hữu module hoặc quy trình vận hành bền vững thay đổi.

## 1. Tổng quan

Memory Match Adventure là game ghép thẻ chạy trên web, viết bằng HTML/CSS/JavaScript ES modules. Vite đảm nhận dev server và build; Capacitor đóng gói Android từ thư mục build web.

```text
index.html → js/main.js → controller / UI / gameplay modules
                         ↘ public/assets (ảnh WebP, âm thanh)
Vite build → dist → GitHub Pages hoặc Capacitor Android
```

- Phiên bản hiển thị cho người chơi: `js/appMeta.js` (`V1.1a`).
- Cấu hình gameplay: `js/config.js`.
- Entry point: `js/main.js`.
- Không có backend; hệ thống hoạt động offline-first trên từng trình duyệt/thiết bị.

## 2. Cấu trúc thư mục

| Khu vực | Vai trò |
| --- | --- |
| `index.html` | Khung DOM cố định: game, HUD, menu tác vụ, cài đặt và audio nền. |
| `style.css` | Giao diện responsive, HUD, board, menu, popup và trạng thái tạm dừng. |
| `js/` | Các ES module theo trách nhiệm. |
| `public/assets/` | Tài nguyên runtime được copy nguyên vẹn vào `dist/assets/`. |
| `source-assets/` | Ảnh nguồn PNG lưu trữ, không được phát hành. |
| `scripts/check-js.mjs` | Kiểm tra tĩnh import/cú pháp module JavaScript. |
| `dist/` | Sản phẩm build, bị Git bỏ qua; chỉ được publish sang nhánh `gh-pages`. |
| `android/` | Dự án Android do Capacitor quản lý. |

## 3. Quyền sở hữu module

| Module | Trách nhiệm duy nhất |
| --- | --- |
| `main.js` | Bootstrap: hydrate dữ liệu, nối callback giữa module, gắn sự kiện nút cố định. |
| `gameState.js` | Trạng thái runtime thuần và vòng đời round (`roundId`); không thao tác DOM hay `localStorage`. |
| `gameController.js` | Khởi tạo màn, timer, preview, pause/resume khi ẩn tab, chuyển màn và quay menu. |
| `logic.js` | Luật chọn/match/miss và điều kiện hoàn thành. |
| `grid.js` | Tạo board, thẻ và preview; nhận `roundId` để timeout cũ không tác động board mới. |
| `ui.js` | Cập nhật HUD, hiệu ứng và popup game (thưởng, tổng kết, reset, về menu). |
| `modal.js` | Hệ modal dùng chung: overlay, focus/đóng, action buttons và toast. |
| `mainmenu.js` | Menu chính và chọn độ khó. |
| `settings.js` | Cài đặt âm thanh, nhạc, âm lượng và popup Phiên bản. |
| `shop.js` | Cửa hàng/vật phẩm trong game. |
| `gameMenu.js` | Menu tác vụ trong HUD. |
| `sound.js` | Âm thanh hiệu ứng, nhạc nền và quy tắc phát/dừng theo trạng thái trang. |
| `persistence.js` | Đọc/ghi/xóa dữ liệu trình duyệt. |
| `icons.js`, `utils.js` | Icon SVG và tiện ích dùng chung. |

Các module được nối qua hàm `configure*`; tránh import vòng giữa controller, menu và settings.

## 4. Luồng runtime và gameplay

### Chế độ chơi

| Chế độ | Board chuẩn | Quy tắc mở rộng |
| --- | --- | --- |
| Dễ | 12 thẻ | Không đổi theo level. |
| Trung bình | 24 thẻ | Không đổi theo level. |
| Khó | 36 thẻ | Không đổi theo level. |
| Siêu khó | 48 thẻ, 6 cột × 8 hàng | Từ level 10: 54 thẻ, 6 cột × 9 hàng. |

`getModeLayout(mode, level)` là điểm duy nhất quyết định kích thước board theo chế độ và level. Giao diện chỉ hiển thị tên chế độ, không hiển thị số thẻ.

1. `main.js` nạp dữ liệu từ `persistence.js`, hydrate `gameState`, áp dụng âm thanh và hiển thị menu chính.
2. Người chơi chọn độ khó; `gameController.initializeLevel()` tạo `roundId` mới và board mới.
3. Board preview toàn bộ thẻ. Khi preview hoàn tất và `roundId` vẫn hợp lệ, countdown mới bắt đầu và nhạc nền tiếp tục.
4. `logic.js` xử lý hai thẻ được chọn. Match cập nhật điểm/progress; miss khóa board trong khoảng thời gian cần thiết.
5. Hint tiêu thụ một lượt, lật tạm một cặp chưa match và **không** tự ghép cặp hay cộng điểm.
6. Mỗi cặp ghép đúng cộng `1` điểm; điểm chỉ phục vụ thành tích và high score, không dùng mua vật phẩm.
7. Khi hoàn thành màn, người chơi nhận `50 + floor(thời gian còn lại)` Xu. Xu được cộng/lưu trước khi popup tổng kết hiển thị; popup gọi `onNext` hoặc `onMenu`; timer cũ bị vô hiệu bằng `roundId`.

### Chống race condition

- `beginRound()` và `invalidateRound()` tăng `gameState.roundId`.
- Mọi callback bất đồng bộ của preview, mismatch, hint và cửa hàng phải kiểm tra round hiện tại trước khi cập nhật DOM/trạng thái.
- Countdown chỉ chạy sau preview; `stopCountdown()` phải được gọi trước khi khởi tạo/chuyển màn.

### Khi tab/app bị ẩn

- `visibilitychange` trong `gameController.js` tạm dừng timer khi bàn chơi đang hiển thị.
- Âm thanh luôn dừng ở mọi màn hình, kể cả menu/popup.
- Khi quay lại, nhạc chỉ tiếp tục nếu thực tế đang phát trước thời điểm tab bị ẩn; `sound.js` không bao giờ khởi động nhạc khi `document.hidden`.

## 5. Hợp đồng dữ liệu và lưu trữ

Lưu trữ dùng `localStorage`, theo thiết bị/trình duyệt. Không có dữ liệu người chơi nào được gửi lên GitHub hay server.

| Key | Kiểu/giá trị | Chủ sở hữu |
| --- | --- | --- |
| `highScore` | số nguyên, mặc định `0` | `persistence.js` |
| `coins` | số nguyên không âm, mặc định `0` | `persistence.js` / `gameState.js` |
| `sound` | chuỗi boolean, mặc định `true` | `persistence.js` / `settings.js` |
| `music` | chuỗi boolean, mặc định `true` | `persistence.js` / `settings.js` |
| `soundVolume` | số `0..1`, mặc định `0.4` | `persistence.js` / `settings.js` |
| `musicVolume` | số `0..1`, mặc định `0.35` | `persistence.js` / `settings.js` |

`clearPersistentGameData()` chỉ xóa các key trên. Trạng thái ván đang chơi, level hiện tại và hint không được lưu qua lần tải lại. Xu được dùng cho shop; việc mua vật phẩm không làm giảm điểm hoặc high score.

## 6. Tài nguyên và đường dẫn

- Ảnh phát hành là WebP trong `public/assets/images/`; bộ thẻ mặc định gồm 1.000 ảnh.
- Âm thanh ở `public/assets/sounds/`.
- `vite.config.js` đặt `base: '/MemoryMatchV1.1a/'` cho GitHub Pages.
- JavaScript dùng `import.meta.env.BASE_URL` cho ảnh thẻ và âm thanh. Không thay bằng đường dẫn tuyệt đối `/assets/...` trong JavaScript.
- Vite tự viết lại `url('/assets/...')` trong CSS theo `base` ở bản production.

## 7. Build, kiểm tra và phát hành

| Lệnh | Mục đích |
| --- | --- |
| `npm run dev` | Chạy môi trường phát triển Vite. |
| `npm run check` | Kiểm tra module JavaScript. |
| `npm run build` | Tạo production build vào `dist/`. |
| `npm run preview` | Xem thử production build tại local. |
| `npm run deploy:gh-pages` | Build rồi phát hành `dist` sang nhánh `gh-pages`. |
| `npm run android:sync` | Build web và đồng bộ sang Capacitor Android. |

`deploy:gh-pages` dùng `gh-pages -d dist --add`. Cờ `--add` là yêu cầu vận hành trên Windows để tránh lỗi `ENAMETOOLONG` khi package cố xóa hơn 1.000 tệp asset trong một lệnh.

## 8. Repository và chính sách Git

| Remote | Mục đích | Nội dung |
| --- | --- | --- |
| `origin` → `tdangw/MemoryMatchV1.1a` | Repository công khai/GitHub Pages | Chỉ nhánh `gh-pages` nhận nội dung build qua deploy. |
| `data` → `tdangw/MemoryMatchV1.1a-data` | Repository Private | Mã nguồn, cấu hình, tài liệu và lịch sử Git trên nhánh `main`. |

- `dist/` bị bỏ qua khỏi repository Private.
- Dữ liệu `localStorage` không được commit hoặc deploy.
- Sau thay đổi mã nguồn: chạy `npm run check`; với thay đổi ảnh hưởng runtime/build, chạy thêm `npm run build`; sau đó deploy và push source khi được yêu cầu.

## 9. Android

Capacitor dùng `dist` làm `webDir`, `appId` là `com.memorymatch.adventure`, nền Android là `#10162f`. Mọi thay đổi web cần `npm run android:sync` trước khi build APK/AAB.
