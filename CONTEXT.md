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
- **Bộ sưu tập** gồm chủ đề Mặc định (1.000 ảnh); 20 chủ đề ảnh 3D đang mở rộng theo `themes.md`; và các chủ đề tạo bằng mã: Chữ cái, 2 Số, 3 Số, Ký hiệu máy tính. Tên asset là mô tả ASCII dạng `kebab-case.webp`; danh mục `{ id, label, file }` ở `js/themeAssets.js` là nguồn runtime. Đồ uống, Cây cối & lá và Thiết bị gián điệp đã đồng bộ vào Shop. Trái cây và Rau củ cũng có mặt trong Shop với giá thử nghiệm **1 Xu**, cho phép mua trước nhưng chỉ mở trang bị khi đủ ảnh tối thiểu cho gameplay. Các thẻ tạo mã dùng SVG, không emoji: Chữ cái là khối đồ chơi 3D xanh–tím, 2/3 Số là bảng số điện tử xanh ngọc, Ký hiệu máy tính là phím chức năng xanh đậm; mỗi giá trị có biến thể màu cố định để hai thẻ cùng cặp luôn giống nhau. Trong giai đoạn kiểm thử, mọi chủ đề có thể mua đều có giá **1 Xu**; cần cân bằng lại trước phát hành.
- Cyberpunk, RPG phép thuật, Vũ trụ, Vật dụng gia đình, Đồ dùng văn phòng, Dụng cụ làm vườn, Thời trang & phụ kiện, Phương tiện giao thông, Cổ vật & gián điệp và Lễ hội đã có lô đầu 24 ảnh WebP 256×256/chủ đề, đang quy hoạch đến 96 ảnh và vẫn hiển thị **Sắp có** cho đến khi có quyết định mở khóa catalog.
- Tab **Vật phẩm** chỉ chứa vật phẩm tiêu hao từ `js/shopCatalog.js`; không có phần thưởng xem quảng cáo. Mua thời gian 10/30/45/60 giây có giá 18/50/70/90 Xu; gợi ý 1/2/3 lượt có giá 8/15/21 Xu; xem trước 4/8/12 thẻ có giá 8/15/22 Xu; xem tất cả có giá `max(6, ceil(số thẻ chưa ghép × 1,75))` Xu.
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
- Khi thắng màn 100, game mở popup tổng kết cuối rồi chạy cảnh hoa chiến thắng.
- Hoa nở trong 6,4 giây; pháo hoa khởi động trước khi hoa nở xong 2 giây. Sau khi hiện lời chúc và âm thanh `congratulations.mp3` kết thúc sẽ có ba đợt pháo hoa cuối.

## Dữ liệu và asset

- Hình/âm thanh runtime ở `public/assets/`; ảnh thẻ mặc định ở `public/assets/images/themes/default/`.
- Danh sách asset chủ đề được theo dõi tại `themes.md`; khi phát hiện trùng đối tượng, thay mục chưa phát hành trong danh sách rồi chỉ tạo lại thẻ đơn lẻ, không tạo lại cả lô.
- Danh mục ảnh ưu tiên một loại nội dung cho mỗi theme: Đồ ăn, Đồ uống, Trái cây, Rau củ, Hoa, Cây cối & lá, Cổ vật lịch sử và Thiết bị gián điệp được theo dõi riêng. Không tái dùng asset giữa các pool runtime; sau khi đối chiếu checksum và phân loại xong, các thư mục legacy trùng lặp được xóa.
- Skill tái sử dụng `C:\Users\Dang\.codex\skills\memory-match-image-assets\SKILL.md` quy định quy trình tạo ảnh chủ đề: xác nhận phạm vi thay thế, tạo lưới vuông N×N, kiểm tra tỉ lệ nguồn trước khi cắt, xuất WebP 256×256 và kiểm tra trực quan mẫu. Không cắt từ lưới chữ nhật hoặc dùng cắt tự động theo nội dung. Khi cắt sheet 5×5, không chia đều toàn bộ pixel sheet vì sẽ lấy cả viền/gutter; phải đo và dùng riêng biên của năm ô theo từng trục, rồi mới resize. Mỗi lô gồm 24 thẻ thường và một thẻ đặc biệt ở ô cuối; có thể giữ nhiều thẻ đặc biệt tại `themes/<theme>/special/<slug>.webp`. Thẻ đặc biệt không mặc định dùng màu vàng: ưu tiên biến thể lai/hiếm hoặc phiên bản huyền thoại vẫn hợp chủ đề, giữ màu thường nếu đó là phương án đẹp hơn. Với asset mới của năm chủ đề ảnh 3D, dùng tên mô tả `kebab-case.webp` và cập nhật `js/themeAssets.js` thay vì dùng tên đánh số.
- Hiện không có thư mục `source-assets/` trong workspace hoặc lịch sử Git hiện có. Nếu tạo asset mới, lưu contact sheet/bản nguồn ngoài `public/assets/` trong lúc xử lý; chỉ đưa WebP đã kiểm tra vào asset runtime.
- Dữ liệu người chơi lưu bằng `localStorage`, không commit.
