# ARCHITECTURE — Bản đồ kỹ thuật V1.1a

> **Nguồn sự thật kỹ thuật duy nhất** của dự án. Chỉ cập nhật khi kiến trúc, hợp đồng dữ liệu, quyền sở hữu module hoặc quy trình vận hành bền vững thay đổi.

## 1. Tổng quan

Memory Match Adventure là game ghép thẻ chạy trên web, viết bằng HTML/CSS/JavaScript ES modules. Vite đảm nhận dev server và build.

```text
index.html → js/main.js → controller / UI / gameplay modules
                         ↘ public/assets (ảnh WebP, âm thanh)
Vite build → dist → Firebase Hosting hoặc GitHub Pages
```

- Phiên bản hiển thị cho người chơi: `js/appMeta.js` (`V1.1a`).
- Cấu hình gameplay: `js/config.js`.
- Entry point: `js/main.js`.
- Không có backend hoặc Firebase Web SDK; hệ thống hoạt động offline-first trên từng trình duyệt/thiết bị. Firebase chỉ được dùng làm Hosting.

## 2. Cấu trúc thư mục

| Khu vực | Vai trò |
| --- | --- |
| `index.html` | Khung DOM cố định: game, HUD, menu tác vụ, cài đặt và audio nền. |
| `style.css` | Kiểu giao diện dùng chung: responsive, HUD, board, menu, popup và trạng thái tạm dừng. |
| `styles/shop.css` | Kiểu giao diện riêng của Cửa hàng và hộp xác nhận mua. |
| `styles/gameplay-effects.css` | Mặt lưng thẻ và hiệu ứng phản hồi combo. |
| `js/` | Các ES module theo trách nhiệm. |
| `public/assets/` | Tài nguyên runtime được copy nguyên vẹn vào `dist/assets/`. |
| *(không có)* `source-assets/` | Không còn trong workspace. Nếu cần tạo ảnh nguồn, lưu ngoài `public/assets/` trong quá trình xử lý và không phát hành. |
| `scripts/check-js.mjs` | Kiểm tra tĩnh import/cú pháp module JavaScript. |
| `dist/` | Sản phẩm build, bị Git bỏ qua; được phát hành lên Firebase Hosting. |

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
| `shopCatalog.js` | Catalog vật phẩm Shop và quy tắc giá động của từng vật phẩm. |
| `themeCatalog.js` | Metadata chủ đề, tạo nội dung chữ/số/ký hiệu bằng SVG và cung cấp dữ liệu thẻ cho board. Không chứa tên tệp ảnh. |
| `scripts/generate-theme-manifest.mjs` | Quét ảnh WebP trong từng thư mục chủ đề và sinh manifest runtime tự động. |
| `gameplayTuning.js` | Mốc combo, phần thưởng thời gian theo combo và thời lượng hiệu ứng gameplay. |
| `gameMenu.js` | Menu tác vụ trong HUD. |
| `sound.js` | Âm thanh hiệu ứng, nhạc nền và quy tắc phát/dừng theo trạng thái trang. |
| `persistence.js` | Đọc/ghi/xóa dữ liệu trình duyệt. |
| `icons.js`, `utils.js` | Icon SVG và tiện ích dùng chung. |

Các module được nối qua hàm `configure*`; tránh import vòng giữa controller, menu và settings.

## 4. Luồng runtime và gameplay

### Chế độ chơi

| Chế độ | Board chuẩn | Quy tắc mở rộng |
| --- | --- | --- |
| Dễ | 12 thẻ (4×3), 60 giây | Không đổi theo level, thưởng `30 + floor(t × 0.35)`. |
| Trung bình | 24 thẻ (6×4), 90 giây | Không đổi theo level, thưởng `50 + floor(t × 0.5)`. |
| Khó | 36 thẻ (6×6), 120 giây | Không đổi theo level, thưởng `70 + floor(t × 0.65)`. |
| Siêu khó | 60 thẻ (6×10), 180 giây | Không đổi theo level, thưởng `90 + floor(t × 0.8)`. |
| Vô tận (Endless) | 60 thẻ (6×10), preview 8 giây | Đếm thời gian xuôi, thưởng cố định 10 Xu, không mua thời gian. |
| Thử thách (Challenge) | 12–48 thẻ theo `CHALLENGE_LAYOUTS` | Khởi đầu 60 giây, cộng dồn +10s mỗi level, ô may mắn Lucky Tiles. |

`getModeLayout(mode)` và `getChallengeLayout(level)` quyết định kích thước board theo chế độ và cấp độ. Giao diện chỉ hiển thị tên chế độ, không hiển thị số thẻ.

1. `main.js` nạp dữ liệu từ `persistence.js`, hydrate `gameState`, áp dụng âm thanh và hiển thị menu chính.
2. Người chơi chọn độ khó; `gameController.initializeLevel()` tạo `roundId` mới và board mới.
3. Board preview toàn bộ thẻ. Khi preview hoàn tất và `roundId` vẫn hợp lệ, countdown mới bắt đầu và nhạc nền tiếp tục.
4. `logic.js` xử lý hai thẻ được chọn. Match cập nhật điểm/progress và combo; từ combo x2, mỗi cặp đúng nhận số giây bằng cấp combo (x2 +2 giây, x3 +3 giây…). Miss đặt combo về 0, khóa board trong khoảng thời gian cần thiết và trừ 1 Xu từ phần thưởng cuối màn.
5. Hint tiêu thụ một lượt, lật tạm một cặp chưa match và **không** tự ghép cặp hay cộng điểm.
6. Mỗi cặp ghép đúng cộng `1` điểm; điểm HUD là điểm của lượt chơi hiện tại và không dùng mua vật phẩm.
7. Khi hoàn thành màn, người chơi nhận Xu theo độ khó và thời gian còn lại: Dễ `30 + floor(t × 0.35)`, Trung bình `50 + floor(t × 0.5)`, Khó `70 + floor(t × 0.65)`, Siêu khó `90 + floor(t × 0.8)`; sau đó trừ 1 Xu cho mỗi miss, không thấp hơn 0. Xu được cộng/lưu trước khi popup tổng kết hiển thị; popup gọi `onNext` hoặc `onMenu`; timer cũ bị vô hiệu bằng `roundId`.

Mỗi level bắt đầu lại với thời gian nền theo độ khó (Dễ hiện là 6 giây để thử nghiệm; đổi 60 khi phát hành), cộng `min((level - 1) × 3, 30)` giây. Lượt gợi ý chưa dùng được giữ lại; từ level 2, người chơi nhận thêm 1 lượt mỗi màn đến tối đa 10 lượt.

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
| `coins` | số nguyên không âm, mặc định `0` | `persistence.js` / `gameState.js` |
| `sound` | chuỗi boolean, mặc định `true` | `persistence.js` / `settings.js` |
| `music` | chuỗi boolean, mặc định `true` | `persistence.js` / `settings.js` |
| `soundVolume` | số `0..1`, mặc định `0.4` | `persistence.js` / `settings.js` |
| `musicVolume` | số `0..1`, mặc định `0.35` | `persistence.js` / `settings.js` |
| `appearance` | JSON: ngoại hình và chủ đề đã sở hữu/đang trang bị | `persistence.js` / `appearance.js` |

`clearPersistentGameData()` chỉ xóa các key trên. Trạng thái ván đang chơi, level hiện tại và hint không được lưu qua lần tải lại. Xu được dùng cho shop; vật phẩm ngoại hình mua một lần, được sở hữu vĩnh viễn trên thiết bị và có thể trang bị trong tab Ngoại hình của Cửa hàng. Key `highScore` cũ không còn được đọc, ghi hoặc xóa.

## 6. Tài nguyên và đường dẫn

- Ảnh phát hành là WebP trong `public/assets/images/themes/<theme-id>/`. Tên thư mục và tên tệp mới dùng English `kebab-case`; ví dụ `animals-land/red-panda.webp`. `scripts/generate-theme-manifest.mjs` quét các tệp WebP trực tiếp trong từng thư mục (không lấy thư mục `special/`) rồi tạo `js/generated/themeAssetManifest.js`. File sinh tự động bị Git bỏ qua.
- `themeCatalog.js` chỉ giữ metadata ổn định: ID tiếng Anh, icon, giá và nhãn hiển thị tiếng Việt. Mỗi ảnh được game nhận diện theo tên tệp trong manifest; không duy trì danh sách filename bằng tay trong JavaScript.
- `npm run dev`, `npm run build`, `npm run build:gh-pages`, `npm run build:android` và `npm run check` đều đồng bộ manifest trước khi chạy. Khi thêm ảnh trong lúc dev server đang mở, chạy `npm run assets:sync` rồi tải lại trang.
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
| `npm run deploy` | Build rồi phát hành lên Firebase Hosting. |
| `npm run deploy:gh-pages` | Build rồi phát hành `dist` sang nhánh `gh-pages`. |

## 8. Repository và chính sách Git

| Remote | Mục đích | Nội dung |
| --- | --- | --- |
| `origin` → `tdangw/MemoryMatchV1.1a` | Repository công khai/GitHub Pages | Nhánh `gh-pages` nhận nội dung build qua deploy. |
| `data` → `tdangw/MemoryMatchV1.1a-data` | Repository Private | Mã nguồn, cấu hình, tài liệu và lịch sử Git trên nhánh `main`. |

- `dist/` bị bỏ qua khỏi repository Private.
- Dữ liệu `localStorage` không được commit hoặc deploy.
- Sau thay đổi mã nguồn: chạy `npm run check`; với thay đổi ảnh hưởng runtime/build, chạy thêm `npm run build`; sau đó deploy và push source khi được yêu cầu.
