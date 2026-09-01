# CONTEXT — Trạng thái dự án hiện tại

## Phạm vi

- Dự án là game web JavaScript thuần, tối ưu cho màn hình mobile dọc. Khi mở game luôn chọn một trong hai trò độc lập: **Memory Match** (ghi nhớ và lật cặp thẻ) hoặc **Link Connect** (quan sát và nối cặp hình không có vật cản).
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

### Memory Match và Link Connect

- Hai trò dùng chung **Xu**, danh sách chủ đề và chủ đề đã sở hữu; chủ đề đang trang bị được lưu riêng theo từng trò. Vật phẩm hỗ trợ/tồn kho của mỗi trò độc lập.
- Mỗi trò có sáu chế độ: Dễ, Trung bình, Khó, Siêu khó, Vô tận và Thử thách. Tiến trình tiếp tục được lưu độc lập theo từng chế độ; bắt đầu ván mới chỉ ghi đè tiến trình của đúng chế độ đó. Popup chọn tiếp tục dùng cùng phong cách với popup chọn chế độ; **Chơi mới** ở bên trái, **Tiếp tục** ở bên phải.
- Khi đổi chủ đề trong lúc đang chơi, chủ đề mới chỉ áp dụng từ ván tiếp theo. Popup thông báo dùng chung, không tạo biến thể riêng cho từng màn.
- Popup đầu màn, tổng kết màn và hết giờ dùng các thành phần chung cho hai trò. Popup hết giờ có Về Menu, Chơi lại, mua +1 giây (2 Xu) hoặc +5 giây (10 Xu).

### Link Connect

- Luật cơ bản: chọn hai hình giống nhau có thể nối bằng tối đa **ba đoạn thẳng** (hai lần rẽ), được phép đi quanh viền ngoài bàn. Ghép đúng sẽ vẽ đường nối rồi thẻ tan biến; ghép sai tăng lượt sai và reset combo. Sau mỗi cặp ghép, bàn áp dụng quy tắc dồn thẻ của màn trước khi kiểm tra đường nối tiếp theo.
- Bàn tự tính kích thước theo không gian thực còn lại của khung game trên mobile, gồm HUD, padding, viền và khoảng cách; không tràn khung game. Bàn tự cập nhật khi khung đổi kích thước. Với bàn tĩnh, chỉ hai ô vừa ghép được cập nhật; với bàn động, thẻ di chuyển bằng hoạt ảnh FLIP để người chơi theo dõi vị trí mới. Sau mọi dịch chuyển hoặc xóa cặp bằng Sấm sét, game kiểm tra nước đi và tự xáo các thẻ còn lại nếu cần.
- Quy tắc dồn thẻ theo cấp áp dụng cho mọi chế độ: cấp 1–2 **Tĩnh**, 3–5 **Dồn xuống**, 6–8 **Dồn lên**, 9–12 luân phiên **Dồn trái/phải**, từ cấp 13 chọn ngẫu nhiên một trong bốn hướng cơ bản cho cả màn. Sau popup giới thiệu màn, các màn động mở popup chung **Quy tắc màn chơi** (nền xanh đậm, tiêu đề vàng, nút “Đã hiểu”) và ghi rõ hướng dồn; màn tĩnh đi thẳng vào chơi. Không dùng banner/toast riêng để tránh rối HUD.
- Chế độ hiện dùng: Dễ 12 thẻ (4×3), Trung bình 24 (6×4), Khó 36 (6×6), Siêu khó/Vô tận 60 (6×10), Thử thách tăng từ 12 đến 48 thẻ theo cấp. Vô tận đếm xuôi nhưng vẫn qua màn; không nhận thưởng thời gian hoặc vật phẩm đóng băng.
- Từ cấp 3, bàn có một cặp thẻ đóng băng. Mỗi màn luôn có ít nhất một cặp đặc biệt (asset `special/` hoặc fallback); ghép cặp đặc biệt này sẽ mở khóa cặp băng trong màn, nên ván không thể kẹt. Cặp đặc biệt nhận thêm 50% điểm sau combo. Bộ đếm đặc biệt tích lũy qua các màn liên tiếp trong cùng lượt chơi; các mốc 1/3/5/7/9/10 áp dụng hiệu ứng và đến mốc 10 reset về 0. Bắt đầu lượt chơi mới sẽ đặt lại bộ đếm. Khi mốc tự xóa/mở khóa/đánh dấu thẻ, cả dữ liệu và giao diện phải được đồng bộ trong cùng lượt để không tạo “thẻ ma”.
- Vật phẩm Link Connect: Gợi ý đường nối, Xáo trộn, Sấm sét và Đóng băng thời gian. Từ màn 2, nhận +1 Gợi ý mỗi màn, tối đa 10; tiếp tục hoặc chơi lại cùng màn không cộng lặp. Âm thanh dùng chung với Memory Match: click, đúng/sai, thưởng, cảnh báo còn 10 giây, thua, thắng và nhạc nền.
- Danh mục hiệu ứng nối/tan đã tách tại `js/linkConnect/linkEffects.js` để sau này mở bán Laser, Điện, Xung Cyber, Bụi phép… Hiện hiệu ứng Điện là mặc định. HUD Link Connect dùng cùng nhịp bố cục với Memory Match: tiến trình ở trên, thanh Menu/LV/Thời gian/Sao ở giữa, nút công cụ mở danh sách bốn vật phẩm và thanh mốc thẻ đặc biệt gọn ngay dưới HUD.

### Link Connect — Hạng mục chờ thực hiện

1. **Hoàn thiện nhóm bàn cờ động nâng cao:** Hút vào tâm, tách đôi dọc/ngang, tráo đổi và xoay tròn. Mỗi loại phải có quy tắc bảo toàn cặp, hoạt ảnh dịch chuyển, kiểm tra nước đi và kiểm thử với thẻ băng/đặc biệt/Sấm sét trước khi mở theo cấp.
2. **Rà soát chất lượng từng hiệu ứng trong Bộ sưu tập:** Các hiệu ứng đường nối và xóa thẻ đã có catalog/cơ chế trang bị, nhưng cần đối chiếu lần lượt với demo và hoàn thiện từng hiệu ứng đạt mức phát hành; không xem toàn bộ danh sách là hoàn tất chỉ vì đã xuất hiện trong Shop.
3. **Kiểm thử hiển thị thực tế Link Connect:** Xác minh board, đường nối và hiệu ứng không tràn ở các kích thước mobile hẹp, các bàn 6 cột và level cao sau mọi dạng dồn thẻ.

### Link Connect — Ngoài phạm vi hiện tại

- Không triển khai đá, cổng không gian hoặc chướng ngại vật khác; 100 màn Adventure với bàn riêng; Time Rush; Zen Mode; Fever ×5/hạt nổ/Fever FX/nhạc tăng nhịp; hay hiệu ứng xáo “xoáy” bắt buộc ba nước đi. Các mục này đã được loại khỏi kế hoạch để tránh hiểu nhầm với phạm vi Link Connect hiện tại.

- Có 4 mặt lưng thẻ và 7 hiệu ứng lật/hiện thẻ. Ngoại hình mua bằng Xu, lưu theo thiết bị và trang bị trong tab **Ngoại hình** của Cửa hàng.
- **Bộ sưu tập V2** gồm chủ đề Mặc định (1.000 ảnh), **25** chủ đề ảnh 3D theo `themes.md`, và các chủ đề tạo bằng mã: Chữ cái (48 giá trị), 2 Số (96), 3 Số (900), Ký hiệu máy tính (48). `animals-land`, `animals-air`, `animals-sea`, `trees`, `leaves`, `instruments` và `mystery` hiển thị **Sắp có** cho đến khi có đủ ảnh cho bàn chơi lớn nhất. `themeCatalog.js` chỉ giữ ID tiếng Anh cùng metadata UI; `scripts/generate-theme-manifest.mjs` tự quét tất cả WebP trong `public/assets/images/themes/<theme-id>/` để sinh catalog ảnh runtime. Không còn danh sách filename viết tay trong JavaScript. Các thẻ tạo mã dùng SVG, không emoji: Chữ cái là khối đồ chơi 3D xanh–tím, 2/3 Số là bảng số điện tử xanh ngọc, Ký hiệu máy tính là phím chức năng xanh đậm; mỗi giá trị có biến thể màu cố định để hai thẻ cùng cặp luôn giống nhau.
- Động vật trên cạn đã hoàn tất 120 ảnh WebP 256×256 (năm lô, cùng năm thẻ đặc biệt trong `special/`). Từ lô 4, mỗi loài dùng góc nhìn tự do và bệ nền nhỏ theo sinh cảnh (đất, cỏ, đá, bùn hoặc vỏ cây) trên nền phẳng; lô 5 bổ sung quy tắc tránh tư thế/hướng nhìn lặp lại giữa các loài gần nhau và thu gọn tiểu cảnh để không lấn chủ thể. Thẻ đặc biệt có biến thể hiếm/lai, bệ trang trí và điểm nhấn lộng lẫy hơn. Cyberpunk, RPG phép thuật, Vũ trụ, Vật dụng gia đình, Đồ dùng văn phòng, Dụng cụ làm vườn, Thời trang & phụ kiện, Phương tiện giao thông, Cổ vật & gián điệp và Lễ hội cũng đã có asset theo lô. Các chủ đề này vẫn hiển thị **Sắp có** cho đến khi có đủ ảnh cho bàn lớn nhất hoặc có quyết định mở khóa catalog.
- Cửa hàng chỉ bán Ngoại hình, Hiệu ứng lật và Chủ đề; các mục đã mua hiển thị **Đã sở hữu**, còn trang bị thực hiện trong Bộ sưu tập. Vật phẩm tiêu hao nằm trong HUD: Mua thời gian cũng bán gợi ý. Mua thời gian 10/30/45/60 giây có giá 18/50/70/90 Xu; gợi ý 1/2/3/5 lượt có giá 8/15/21/30 Xu; xem trước 4/8/12 thẻ có giá 8/15/22 Xu; xem tất cả có giá cố định 30 Xu.
- Khi đang chơi, HUD tiến trình phía trên gồm **Moves, Miss, Combo, thanh sao ba mốc, Điểm, số cặp và Gợi ý**. Thanh sao đặt mốc tại khoảng 48% / 72% / 94%; sao sáng ngay khi điểm chạm mốc. HUD thao tác phía dưới giữ Menu, Mua thời gian, Cấp, Thời gian, **tổng sao tích lũy**, Xem trước thẻ và Gợi ý. Hai thao tác mua/xem trước mở popup tối, hiện số Xu tại header, mua/dùng ngay; bàn cờ khóa trong lúc xem trước.
- Có **6 chế độ chơi**:
  1. **Dễ**: 12 thẻ (4×3), 60 giây, thưởng Xu `30 + floor(t × 0.35)`.
  2. **Trung bình**: 24 thẻ (6×4), 90 giây, thưởng Xu `50 + floor(t × 0.5)`.
  3. **Khó**: 36 thẻ (6×6), 120 giây, thưởng Xu `70 + floor(t × 0.65)`.
  4. **Siêu khó**: 60 thẻ (6×10, mobile 6 cột), 180 giây, thưởng Xu `90 + floor(t × 0.8)`.
  5. **Vô tận (Endless)**: 60 thẻ, preview 8 giây, đếm xuôi thời gian, thưởng cố định 10 Xu, không hiển thị nút mua thời gian.
  6. **Thử thách (Challenge)**: Kích thước bàn cờ tự mở rộng linh hoạt theo cấp độ (từ 12 thẻ đến 48 thẻ theo `CHALLENGE_LAYOUTS`), khởi đầu 60 giây, mỗi màn cộng dồn +10 giây thưởng, xuất hiện ô may mắn (Lucky Tiles) tặng thêm thời gian/gợi ý/xu.
- Thời gian nền và cấp độ: các chế độ thông thường cộng `min((level - 1) × 2, 10)` giây. Gợi ý chưa dùng tích lũy, nhận thêm từ level 2 và giới hạn 10 lượt.
- Điểm và sao: mỗi cặp đúng nhận `10 + (combo - 1) × 3` điểm; combo không có trần. Khi hoàn thành, mỗi giây còn lại cộng đúng 1 điểm trước khi xét sao và mở tổng kết. Các chế độ có đếm ngược dùng mốc sao theo số cặp: `12 / 18 / 25` điểm mỗi cặp; Endless không có thưởng thời gian dùng `10 / 15 / 20` điểm mỗi cặp. Sai đặt combo về 0 và trừ 1 Xu khỏi thưởng cuối màn, nhưng không khóa 3 sao.
- Khi ghép đúng, hiệu ứng `+điểm` hiện tại tâm thẻ vừa lật khớp rồi bay lên; nếu đạt combo, hiệu ứng combo xuất hiện sau đó. Combo bắt đầu tại x2; mỗi cặp đúng từ x2 cũng cộng số giây bằng cấp combo.
- Popup tổng kết không đóng khi chạm nền: hiển thị sao, tổng điểm, Xu nhận, thời gian, số nước đi, lượt sai và thưởng thời gian; người chơi chỉ đi tiếp bằng **Menu** hoặc **Next Level**. Sao giữa lớn hơn nhẹ để bố cục cân bằng.
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
- Skill tái sử dụng `C:\Users\Dang\.codex\skills\memory-match-image-assets\SKILL.md` quy định quy trình tạo ảnh chủ đề: xác nhận phạm vi thay thế, tạo lưới vuông N×N, kiểm tra tỉ lệ nguồn trước khi cắt, xuất WebP 256×256 và kiểm tra trực quan mẫu. Không cắt từ lưới chữ nhật hoặc dùng cắt tự động theo nội dung. Quy trình hiện tại dùng hai sheet 4×4/lô (16 thẻ, rồi 8 thẻ + thẻ đặc biệt); không dùng tọa độ prompt để cắt mà đo riêng biên thật/gutter của từng sheet, thử các ô góc và ô giữa, rồi loại sheet có pixel chủ thể/bóng sát biên. Có thể giữ nhiều thẻ đặc biệt tại `themes/<theme>/special/<slug>.webp` hoặc thư mục con bất kỳ. Trình tạo manifest quét đệ quy toàn bộ cây thư mục của từng chủ đề, nên mọi WebP trong đó đều được nạp vào pool runtime. Asset nằm trong thư mục tên `special/` có cờ `special: true`; khi ghép cặp, điểm đã gồm Combo nhận thêm 50% (làm tròn thành điểm nguyên). Thẻ đặc biệt không mặc định dùng màu vàng: ưu tiên biến thể lai/hiếm hoặc phiên bản huyền thoại vẫn hợp chủ đề, giữ màu thường nếu đó là phương án đẹp hơn. Asset mới dùng tên mô tả English `kebab-case.webp`; sau khi đặt ảnh vào đúng thư mục theme, chạy `npm run assets:sync` thay vì sửa JavaScript.
- Hiện không có thư mục `source-assets/` trong workspace hoặc lịch sử Git hiện có. Nếu tạo asset mới, lưu contact sheet/bản nguồn ngoài `public/assets/` trong lúc xử lý; chỉ đưa WebP đã kiểm tra vào asset runtime.
- Dữ liệu người chơi lưu bằng `localStorage`, không commit.
