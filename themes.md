# Kế hoạch asset chủ đề

Tài liệu này là nguồn theo dõi duy nhất cho toàn bộ chủ đề thẻ trong game. Mục tiêu là tránh lặp đối tượng giữa các chủ đề ảnh, lưu prompt có thể tái sử dụng và kiểm tra nhanh tiến độ.

## Quy ước chung

- Mỗi lô tạo ảnh gồm 24 thẻ khác nhau, xuất ở kích thước 256×256. Asset mới dùng tên mô tả ASCII dạng `kebab-case.webp` (ví dụ `red-panda.webp`), không dùng số thứ tự. Các mốc `25–96` dưới đây chỉ là thứ tự theo dõi kế hoạch; không phải tên file.
- Trước khi thêm asset mới, bổ sung `{ id, label, file }` tương ứng vào `js/themeAssets.js`, rồi ghi lại tên file trong tài liệu này. Không thay thế asset hiện có trừ khi đã có quyết định rõ ràng.
- Thẻ đặc biệt được lưu trong thư mục con `special/` của từng chủ đề, với tên mô tả `kebab-case.webp`, ví dụ `public/assets/images/themes/animals/special/golden-phoenix.webp`. Một chủ đề có thể có nhiều thẻ đặc biệt. Chúng không thuộc pool 24 thẻ thường và chỉ được thêm vào gameplay khi có quy tắc riêng.
- **Hướng sáng tạo thẻ đặc biệt:** “đặc biệt” là do ý tưởng, không mặc định là màu vàng hay ánh kim. Ưu tiên một biến thể hiếm nhưng vẫn đúng chủ đề: sinh vật lai, phiên bản có cánh/giáp, tổ hợp hai đối tượng, hoặc thiết kế huyền thoại. Giữ màu nguyên bản khi đẹp và phù hợp hơn; chỉ dùng vàng/kim loại khi bản thân chủ đề và ý tưởng thực sự cần sắc đó.
- Khi tạo theo lô, tạo một contact sheet vuông 5×5: 24 ô đầu là thẻ thường theo danh sách, ô cuối cùng (góc phải dưới) là **thẻ đặc biệt**; các ô phải vuông bằng nhau, có viền ngoài và gutter rõ ràng, đối tượng nằm trọn trong ô.
- **Quy tắc cắt bắt buộc:** không chia đều toàn bộ kích thước sheet theo 5 vì phép chia đó bao gồm cả viền ngoài và gutter. Sau khi kiểm tra sheet vuông, xác định riêng biên trái/phải và trên/dưới của 5 ô (theo vùng nền liên tục hoặc tọa độ lưới đã đo), cắt đúng nội dung của từng ô, rồi mới resize thành WebP 256×256. Kiểm tra trực quan tối thiểu thẻ đầu, giữa và cuối để chắc không còn dải gutter hoặc cắt lệch.
- Hướng hình hiện tại: minh hoạ đồ chơi 3D chibi/clay, một đối tượng chính ở giữa, nền sáng tối giản tương phản tốt, không có chữ, logo, khung thẻ hoặc watermark.
- Không đưa ảnh nguồn vào `public/assets/`. Lưu sheet nguồn ở vị trí tạm/ngoài runtime đã thống nhất khi bắt đầu tạo, rồi kiểm tra trước khi cắt.
- Chỉ đánh dấu **Hoàn thành** sau khi có đủ 24 WebP 256×256, kiểm tra các thẻ 01, 12 và 24, và cập nhật `js/themeCatalog.js` theo yêu cầu phát hành.

## Palette nền bắt buộc

Mọi prompt lô và ảnh tạo lẻ phải dùng **một nền phẳng duy nhất trong toàn bộ chủ đề**, cùng ánh sáng studio mềm và bóng đổ nhẹ. Không đổi gradient, cảnh nền, thời tiết hoặc thời điểm giữa các thẻ.

| Chủ đề | Nền chuẩn |
|---|---|
| Động vật | Kem ấm `#f6f0e5` |
| Đồ ăn | Đào–kem `#fde4cf` |
| Đồ uống | Đào–kem `#fde4cf` |
| Trái cây | Vàng kem `#fff1dc` |
| Rau củ | Xanh kem `#eef6df` |
| Thiên nhiên | Xanh trời nhạt `#d8edf0` |
| Hoa | Xanh mint `#eef7ef` |
| Cây cối & lá | Xanh lá sương `#e8f4e5` |
| Hình học | Kem pastel `#f8f3e8` |
| Cyberpunk | Navy đậm `#02051b` |
| RPG phép thuật | Indigo đậm `#0b0b32` |
| Vũ trụ | Xanh đêm `#020819` |
| Vật dụng gia đình | Kem ấm `#fff6e7` |
| Đồ dùng văn phòng | Xanh trắng `#f4faff` |
| Dụng cụ làm vườn | Xanh lá nhạt `#edf8d2` |
| Thời trang & phụ kiện | Hồng nhạt `#fff0f5` |
| Phương tiện giao thông | Xanh trời `#e5f5ff` |
| Cổ vật lịch sử | Xanh đen `#031126` |
| Thiết bị gián điệp | Xanh xám đậm `#101927` |
| Lễ hội | Kem vàng `#fff5dc` |

## Bảng tiến độ

| ID | Chủ đề | Loại | Trạng thái | Đã tạo | Prompt và danh sách |
|---|---|---|---|---:|---|
| `default` | Mặc định | Ảnh WebP | Hoàn thành | 1000/1000 | Asset có sẵn |
| `animals` | Động vật | Ảnh WebP | Đang chuẩn hóa | 48/96 + 3 đặc biệt | Asset 01–48 và ba thẻ đặc biệt đã chuẩn hóa; các lô 49–96 cần tạo |
| `foods` | Đồ ăn | Ảnh WebP | Đang mở rộng | 38/96 | Đã tách 38 món ăn khỏi bộ legacy |
| `drinks` | Đồ uống | Ảnh WebP | Đang mở rộng | 24/96 + 1 đặc biệt | Đã tạo lô 01–24 và một mocktail đặc biệt |
| `fruits` | Trái cây | Ảnh WebP | Đang mở rộng | 6/96 | Đã tạo thư mục `themes/fruits/` từ asset legacy; danh sách 01–24 đã xác định |
| `vegetables` | Rau củ | Ảnh WebP | Đang mở rộng | 3/96 | Đã tạo thư mục `themes/vegetables/` từ asset legacy; danh sách 01–24 đã xác định |
| `nature` | Thiên nhiên | Ảnh WebP | Đang mở rộng | 48/96 | Asset 01–48 có sẵn; kế hoạch 49–96 bên dưới |
| `flowers` | Hoa | Ảnh WebP | Đang mở rộng | 36/96 | Đã tách asset hoa khỏi các bộ legacy |
| `plants` | Cây cối & lá | Ảnh WebP | Đang mở rộng | 15/96 | Đã tách asset cây/lá khỏi các bộ legacy |
| `geometry` | Hình học | Đang mở rộng | 48/96 | Asset 01–48 có sẵn; kế hoạch 49–96 bên dưới |
| `cyberpunk` | Cyberpunk | Ảnh WebP | Đang mở rộng | 48/96 | [Chi tiết](#cyberpunk) |
| `magic-rpg` | RPG phép thuật | Ảnh WebP | Đang mở rộng | 48/96 | [Chi tiết](#rpg-phép-thuật) |
| `space` | Vũ trụ | Ảnh WebP | Đang mở rộng | 24/96 | [Chi tiết](#vũ-trụ) |
| `household` | Vật dụng gia đình | Ảnh WebP | Đang mở rộng | 24/96 | [Chi tiết](#vật-dụng-gia-đình) |
| `office-supplies` | Đồ dùng văn phòng | Ảnh WebP | Đang mở rộng | 24/96 | [Chi tiết](#đồ-dùng-văn-phòng) |
| `garden-tools` | Dụng cụ làm vườn | Ảnh WebP | Đang mở rộng | 40/96 | Chỉ còn công cụ, vật tư và hạ tầng làm vườn |
| `fashion` | Thời trang & phụ kiện | Ảnh WebP | Đang mở rộng | 24/96 | [Chi tiết](#thời-trang--phụ-kiện) |
| `vehicles` | Phương tiện giao thông | Ảnh WebP | Đang mở rộng | 24/96 | [Chi tiết](#phương-tiện-giao-thông) |
| `historical-artifacts` | Cổ vật lịch sử | Ảnh WebP | Đang mở rộng | 29/96 | Đã tách từ bộ legacy |
| `spy-gadgets` | Thiết bị gián điệp | Ảnh WebP | Đang mở rộng | 19/96 | Đã tách từ bộ legacy |
| `festivals` | Lễ hội | Ảnh WebP | Đang mở rộng | 24/96 | [Chi tiết](#lễ-hội) |
| `alphabet` | Chữ cái | SVG sinh mã | Hoàn thành | 26/26 | Sinh từ A–Z |
| `numbers-2` | 2 Số | SVG sinh mã | Hoàn thành | 90/90 | Sinh từ 10–99 |
| `numbers-3` | 3 Số | SVG sinh mã | Hoàn thành | 900/900 | Sinh từ 100–999 |
| `computer-symbols` | Ký hiệu máy tính | SVG sinh mã | Hoàn thành | 30/30 | Sinh từ danh sách ký hiệu |

## Rà soát phạm vi chủ đề

| Hiện trạng | Hướng tách chuẩn | Trạng thái |
|---|---|---|
| Food gộp món ăn, đồ uống và trái cây | Đã tách thành **Đồ ăn**, **Đồ uống** và **Trái cây** | Đồ ăn/Đồ uống đã tạo theme runtime; Trái cây đang chờ asset riêng |
| Dụng cụ làm vườn có rau củ/trái cây | **Dụng cụ làm vườn** chỉ giữ công cụ, vật tư và hạ tầng; **Rau củ** là chủ đề riêng | Đã thêm kế hoạch `vegetables` |
| Cây cối & hoa lá gộp hoa với lá/cây | Đã tách thành **Hoa** và **Cây cối & lá** | Đã tạo theme runtime từ asset legacy |
| Cổ vật & gián điệp gộp hai nhóm khác nhau | Đã tách thành **Cổ vật lịch sử** và **Thiết bị gián điệp** | Đã tạo theme runtime từ asset legacy |

Các nhóm sau đang nhất quán và chưa cần tách: Động vật, Thiên nhiên, Hình học, Cyberpunk, RPG phép thuật, Vũ trụ, Vật dụng gia đình, Đồ dùng văn phòng, Thời trang & phụ kiện, Phương tiện giao thông và Lễ hội.

## Mặc định

**Nguồn:** bộ sưu tập legacy gồm 1.000 ảnh WebP. Đây là chủ đề tổng hợp, không có một prompt lô duy nhất để tái tạo chính xác; nếu mở rộng, cần chia thành các chủ đề riêng thay vì thêm ảnh ngẫu nhiên vào bộ này.

## Động vật

**Prompt tái tạo:** `Square 5x5 contact sheet of 24 distinct cute 3D chibi animals, one centered animal per cell, uniform warm cream background (#f6f0e5) in every cell, clean soft studio lighting and gentle shadows, playful child-friendly toy-like style, no text, no logos, no watermark; exactly equal square cells with generous plain gutters and outer margins, every animal fully inside its own cell, bottom-right cell contains one special rare hybrid or mythical animal in natural or theme-appropriate colors, not automatically gold. Do not vary the background color, gradient, scene, or time of day between cells.`

**Asset hiện có (01–24):** `red-panda.webp` — gấu mèo đỏ; `elephant.webp` — voi; `tiger.webp` — hổ; `penguin.webp` — chim cánh cụt; `turtle.webp` — rùa; `lion.webp` — sư tử; `rabbit.webp` — thỏ; `fox.webp` — cáo; `giant-panda.webp` — gấu trúc; `dolphin.webp` — cá heo; `koala.webp` — koala; `giraffe.webp` — hươu cao cổ; `monkey.webp` — khỉ; `sloth.webp` — lười; `polar-bear.webp` — gấu Bắc Cực; `zebra.webp` — ngựa vằn; `hedgehog.webp` — nhím; `otter.webp` — rái cá; `frog.webp` — ếch; `alpaca.webp` — alpaca; `raccoon.webp` — gấu mèo; `macaw.webp` — vẹt macaw; `seal.webp` — hải cẩu; `unicorn.webp` — kỳ lân.

**Danh sách 01–24:** gấu mèo đỏ, voi, hổ, chim cánh cụt, rùa, sư tử, thỏ, cáo, gấu trúc, cá heo, koala, hươu cao cổ, khỉ, lười, gấu Bắc Cực, ngựa vằn, nhím, rái cá, ếch, alpaca, gấu mèo, vẹt macaw, hải cẩu, kỳ lân.

**Thẻ đặc biệt hiện có:** `special/golden-unicorn.webp` — kỳ lân vàng, nền kem–vàng rực rỡ; `special/golden-phoenix.webp` — phượng hoàng vàng dang cánh, điểm sáng lấp lánh; và `special/winged-unicorn-pegasus.webp` — kỳ lân–pegasus lai màu trắng ngọc trai, bờm pastel, cánh lông trắng. Đây là các lựa chọn riêng của từng lô, không phải quy tắc màu cho thẻ đặc biệt sau này.

**Mở rộng đã quy hoạch (25–96):** giữ nguyên 24 asset hiện có; khi tạo thêm, dùng đúng đối tượng sau và đặt tên tệp `kebab-case` mô tả nội dung.

- **25–48 — đã tạo:** hải ly, cầy mangut, chồn hôi, sóc bay, marmot, armadillo, tê tê, heo vòi, thú ăn kiến khổng lồ, capybara, lừa, llama, yak, bò rừng Mỹ, linh dương đầu bò, linh dương gazelle, okapi, tê giác, hà mã, lạc đà, đà điểu, chim công, chim toucan, chim hồng hạc.
- **49–72:** chim cốc, chim cú, vẹt macaw, chim kiwi, chim bồ nông, hải âu, dơi, kỳ nhông, axolotl, tắc kè hoa, kỳ đà, rùa cạn, rùa biển, ếch cây, cóc, kỳ giông, cua ẩn sĩ, tôm hùm, bạch tuộc, mực ống, sứa, cá ngựa, cá đuối, cá voi beluga.
- **73–96:** narwhal, lợn biển, hải cẩu, moóc, cáo Bắc Cực, tuần lộc, sói, linh cẩu, linh miêu, báo tuyết, mèo rừng serval, chó corgi, chó shiba, cừu, dê núi, lừa, lợn guinea, nhím, chuột hamster, chuột chinchilla, bọ rùa, bướm, chuồn chuồn, ong nghệ.

## Đồ ăn

**Prompt tái tạo:** `Square 5x5 contact sheet of 24 distinct cute 3D clay prepared foods, desserts and snacks, one centered dish per cell, uniform peach-cream background (#fde4cf) in every cell, clean soft studio lighting and gentle shadows, playful child-friendly toy-like style, no text, no logos, no watermark; exactly equal square cells with generous plain gutters and outer margins, every dish fully inside its own cell, bottom-right cell contains one special rare dish in natural, theme-appropriate colors. Do not include drinks or whole raw fruits.`

**Danh sách hiện có 01–38:** bánh bao, bánh cuốn, bánh mì, bánh xèo, bibimbap, bún bò, burrito, chả giò, miếng phô mai, hamburger phô mai, đùi gà, bánh quy sô-cô-la, cơm tấm, croissant, cupcake, dim sum, donut, khoai tây chiên, gỏi cuốn, há cảo, hot dog, kem ốc quế, kimbap, nem rán, onigiri, paella, bánh kếp, phở, pizza, pretzel, quesadilla, ramen, risotto, salad, sushi, taco, udon, xôi mặn. Tất cả nằm trong `themes/foods/`; không có đồ uống hoặc trái cây nguyên quả.

**Mở rộng đã quy hoạch (25–96):** giữ nguyên 24 asset hiện có; khi tạo thêm, dùng đúng đối tượng sau và đặt tên tệp `kebab-case` mô tả nội dung.

- **39–60:** bánh khọt, miến, lasagna, gnocchi, falafel, hummus, bánh pita, kebab, cà ri Thái, bánh naan, couscous, waffle, macaron, tiramisu, bánh mousse, panna cotta, crème brûlée, bánh táo, bánh bí đỏ, gelato, sữa chua, pudding.
- **61–84:** bánh quy gừng, bắp rang bơ, hạt dẻ rang, thanh granola, bánh mochi, kẹo bông gòn, churro, brownie, madeleine, financier, cannoli, éclair, scone, bagel, focaccia, quiche, bánh bao chiên, bánh xếp, bánh gạo cay, cơm cuộn, mì soba, mì pad Thái, pizza cuộn, bánh falafel cuộn.
- **85–96:** bánh tostada, bánh empanada, bánh arepa, bánh pierogi, bánh tempura, cơm chiên, mì Ý carbonara, mì Ý bolognese, cơm cà ri, bánh pita kẹp, bánh donut nhân, bánh tart trái cây.

## Đồ uống

**Prompt tái tạo:** `Square 5x5 contact sheet of 24 distinct cute 3D clay drinks, one centered cup, glass, bottle or can per cell, uniform peach-cream background (#fde4cf), clean soft studio lighting and gentle shadows, playful child-friendly toy-like style, no text, no logos, no watermark; exactly equal square cells with generous plain gutters and outer margins, every drink fully inside its own cell, bottom-right cell contains one special rare mocktail in bright natural colors. Do not include food dishes or whole raw fruits.`

**Asset hiện có (01–24):** trà sữa, sữa lắc dâu, nước dừa, matcha latte, cacao nóng, café latte, cappuccino, espresso, nước chanh, nước cam, sinh tố xoài, soda việt quất, kombucha, trà đào đá, trà đen đá, chai latte, nước có ga, nước nho, nước táo, nước ép dưa hấu, sữa đậu nành, trà thảo mộc, trà gừng, sữa nóng.

**Thẻ đặc biệt:** `special/rainbow-fruit-mocktail.webp` — mocktail trái cây cầu vồng tự nhiên, dùng riêng cho cơ chế gameplay đặc biệt.

- **25–48:** soda chanh, soda dâu, soda đào, soda táo, soda nho, nước ép lựu, nước ép ổi, nước ép cà rốt, nước ép cà chua, nước ép dừa, sinh tố chuối, sinh tố bơ, sinh tố dâu, sinh tố đào, sinh tố kiwi, sữa nghệ, sữa hạnh nhân, sữa yến mạch, sữa gạo, sữa chua uống, cold brew, americano, mocha, macchiato.
- **49–72:** flat white, affogato, trà xanh, trà nhài, trà hoa cúc, trà bạc hà, trà hibiscus, trà chanh mật ong, trà sữa khoai môn, trà sữa matcha, trà sữa socola, trà ô long, trà Earl Grey, trà Darjeeling, nước tonic, ginger ale, root beer, cola, nước khoáng, nước điện giải, nước mía, nước sâm, nước gạo lứt, nước đậu đen.
- **73–96:** sữa bắp, sữa mè đen, cacao đá, cà phê sữa đá, cà phê trứng, cà phê dừa, espresso tonic, nước ép dứa, nước ép bưởi, nước ép thanh long, nước ép cần tây, nước ép củ dền, sinh tố việt quất, sinh tố mâm xôi, sinh tố chanh dây, lassi xoài, lassi dâu, kefir, kvass, trà kombucha gừng, trà đào cam sả, trà vải, trà táo quế, trà ô mai.

## Trái cây

**Prompt tái tạo:** `Square 5x5 contact sheet of 24 distinct cute 3D clay fruits, one centered fruit or small fruit cluster per cell, uniform pale fruit-cream background (#fff1dc), clean soft studio lighting and gentle ground shadows, child-friendly toy-like style, no text, no logos, no watermark; exactly equal square cells with generous plain gutters and outer margins, every fruit fully inside its own cell, bottom-right cell contains one special rare fruit hybrid or unusual fruit variety in natural colors.`

**Asset hiện có:** `red-apple.webp`, `watermelon.webp`, `grapes.webp`, `pear.webp`, `orange.webp`, `strawberry.webp` trong `themes/fruits/`. Chưa đưa vào game vì chưa đủ 24 ảnh.

**Danh sách 01–24:** táo đỏ, táo xanh, chuối, cam, quýt, chanh vàng, chanh xanh, bưởi, lê, đào, mận, mơ, cherry, dâu tây, việt quất, mâm xôi đỏ, mâm xôi đen, nho, dưa hấu, dưa lưới, dứa, xoài, đu đủ, dừa.

- **25–48:** kiwi, chanh dây, thanh long, lựu, sung, ổi, vải, chôm chôm, nhãn, sầu riêng, mít, khế, hồng, bơ, me, quất, xuân đào, lý gai, nam việt quất, dâu tằm, chà là, mãng cầu, sapoche, măng cụt.
- **49–72:** salak, langsat, sa kê, mộc qua, xương rồng lê gai, tamarillo, dâu tằm đen, dâu tây rừng, lý chua đỏ, lý chua đen, việt quất rừng, acai, yuzu, calamansi, cam đỏ, chanh ngón tay, feijoa, tỳ bà, táo tàu, bael, canistel, cherimoya, na, lê Nashi.
- **73–96:** táo gai, mận damson, mận mirabelle, mận greengage, chokeberry, serviceberry, thanh lương trà, hắc mai biển, miracle fruit, jabuticaba, santol, cóc, cóc Thái, táo nước, mận nước, pomelo ugli, hồng xiêm đen, dâu tây trắng, nho xanh, nho đỏ, nho đen, dưa gang, dưa vàng, dưa pepino.

## Rau củ

**Prompt tái tạo:** `Square 5x5 contact sheet of 24 distinct cute 3D clay vegetables, roots, bulbs and edible greens, one centered vegetable or small matching cluster per cell, uniform soft green-cream background (#eef6df), clean soft studio lighting and gentle ground shadows, child-friendly toy-like style, no text, no logos, no watermark; exactly equal square cells with generous plain gutters and outer margins, every subject fully inside its own cell, bottom-right cell contains one special rare vegetable variety or playful natural hybrid in theme-appropriate colors.`

**Asset hiện có:** `pumpkin.webp`, `carrot.webp`, `tomato.webp` trong `themes/vegetables/`. Chưa đưa vào game vì chưa đủ 24 ảnh.

**Danh sách 01–24:** cà rốt, cà chua, bí ngô, khoai tây, khoai lang, hành tây, tỏi, hành tím, gừng, củ cải đỏ, củ cải trắng, củ dền, củ turnip, củ cải vàng, sắn, khoai môn, khoai mỡ, ngưu bàng, củ sen, củ năng, cần tây, dưa leo, bí ngòi, cà tím.

- **25–48:** bông cải xanh, súp lơ trắng, bắp cải, cải thảo, cải xoăn, rau bina, xà lách, cải thìa, rau muống, cải xanh, cải cầu vồng, cải collard, cải Brussels, măng tây, đậu que, đậu Hà Lan tuyết, đậu Hà Lan, đậu nành non, bắp, ớt chuông, ớt đỏ, đậu bắp, atisô, tỏi tây.
- **49–72:** thì là, rau diếp xoăn, radicchio, arugula, cải làn, măng tre, giá đỗ, mầm cỏ linh lăng, khổ qua, bầu, mướp, su su, bí đao, bí spaghetti, bí acorn, bí butternut, bí kabocha, nấm mỡ, nấm đông cô, nấm bào ngư, nấm kim châm, nấm đùi gà, nấm portobello, cải xoong.
- **73–96:** bắp cải tím, xà lách romaine, xà lách iceberg, tatsoi, mizuna, komatsuna, cải chíp, củ cần, su hào, củ đậu, salsify, atisô Jerusalem, dương xỉ non, rong biển, nori, wakame, củ cải đường, khoai tây tím, cà rốt tím, củ dền sọc, cà chua gia truyền, tomatillo, ớt poblano, ớt jalapeño.

## Thiên nhiên

**Prompt tái tạo:** `Square 5x5 contact sheet of 24 distinct cute 3D clay nature objects and scenes, one centered subject per cell, uniform pale sky-blue background (#d8edf0) in every cell with a subtle soft ground shadow, warm sunshine and soft studio shadows, child-friendly toy-like style, no text, no logos, no watermark; equal square cells with generous gutters, every subject fully inside its own cell, bottom-right cell contains one special, visually more premium themed subject; it may use a complementary accent background while remaining clearly part of this theme. Do not vary the background color, gradient, scene, weather, or time of day between cells.`

**Asset hiện có (01–24):** `forest-hill.webp` — đồi rừng; `river.webp` — sông; `cloud.webp` — mây; `rain-cloud.webp` — mây mưa; `lightning-bolt.webp` — tia sét; `snowflake.webp` — bông tuyết; `sand-dune.webp` — cồn cát; `tropical-island.webp` — đảo nhiệt đới; `coral-reef.webp` — rạn san hô; `iceberg.webp` — tảng băng; `cave.webp` — hang động; `geyser.webp` — mạch nước phun; `aurora.webp` — cực quang; `rocky-mountain.webp` — núi đá; `rainbow.webp` — cầu vồng; `volcano.webp` — núi lửa; `waterfall.webp` — thác nước; `moon.webp` — Mặt Trăng; `sun.webp` — Mặt Trời; `pine-tree.webp` — cây thông; `seashell.webp` — vỏ sò; `starfish.webp` — sao biển; `floating-iceberg.webp` — núi băng trôi; `waterfall-pool.webp` — thác nước hồ.

**Mở rộng đã quy hoạch (25–96):** giữ nguyên 24 asset hiện có; khi tạo thêm, dùng đúng đối tượng sau và đặt tên tệp `kebab-case` mô tả nội dung.

- **25–48:** núi lửa, đỉnh núi tuyết, núi đá vôi, hẻm núi, thác nước, suối nhỏ, hồ băng, đầm sen, bãi cát, cồn cát, hang động, măng đá, rạn san hô, đảo nhỏ, vịnh biển, vách đá, đồng cỏ, thảo nguyên, rừng thông, rừng tre, rừng ngập mặn, đầm lầy, ruộng bậc thang, cánh đồng lúa.
- **49–72:** cầu vồng, mây cumulus, mây giông, tia sét, giọt mưa, bông tuyết, mưa đá, xoáy nước, sóng biển, sóng thần cách điệu, lốc xoáy, cầu băng, cực quang, hoàng hôn, bình minh, nhật thực, nguyệt thực, sao băng, chòm sao, tinh thể băng, tảng băng trôi, băng hà, lá phong mùa thu, quả thông.
- **73–96:** viên cuội nhiều màu, đá geode, hóa thạch ammonite, tổ ong tự nhiên, mạng nhện đẫm sương, nấm rừng, địa y, rêu xanh, cỏ bốn lá, hạt bồ công anh bay, cành san hô, vỏ sò, sao biển, nhím biển, ngọc trai trong vỏ, hoa tuyết, giọt sương, luồng gió xoáy, tia nắng xuyên mây, mây sương, lửa trại, nhánh sông uốn lượn, đồi chè, cánh đồng oải hương.

## Hoa

**Prompt tái tạo:** `Square 5x5 contact sheet of 24 distinct cute 3D clay flowers and flower blossoms, one centered bloom or small matching bouquet per cell, uniform soft mint background (#eef7ef), warm sunshine and gentle studio shadows, child-friendly toy-like style, no text, no logos, no watermark; exactly equal square cells with plain gutters and outer margins, every flower fully inside its own cell, bottom-right cell contains one special rare flower or natural floral hybrid in theme-appropriate colors.`

**Danh sách hiện có 01–36:** hoa chuông, hoa anh đào, hoa cúc, bồ công anh, xương rồng nở hoa, hoa anh túc, hoa bỉ ngạn, hoa cẩm chướng, hoa cẩm tú cầu, hoa dạ yến thảo, hoa dành dành, hoa diên vĩ, hoa hồng đỏ, hoa hướng dương, lan hồ điệp, hoa loa kèn, hoa mao lương, hoa mẫu đơn, hoa mộc lan, hoa nhài, hoa oải hương, pansy, hoa rum, hoa thược dược, hoa trà, hoa tulip, hoa violet, lily, orchid, poppy, rose, sunflower, tulip, bụi tulip.

- **37–60:** hoa thược dược pompon, hoa cúc gerbera, hoa cẩm tú cầu xanh, hoa violet châu Phi, hoa freesia, hoa gladiolus, hoa hyacinth, hoa anemone, hoa asters, hoa baby, hoa cát tường, hoa lồng đèn, hoa thanh tú, hoa salvia, hoa verbena, hoa zinnia, hoa cosmos, hoa cúc vạn thọ, hoa cẩm chướng mini, hoa dừa cạn, hoa mười giờ, hoa sen, hoa súng, hoa mai.
- **61–84:** hoa đào, hoa mận, hoa táo, hoa lê, hoa tử đằng, hoa tử đinh hương, hoa đỗ quyên, hoa trà my, hoa hồng trà, hoa lan vũ nữ, hoa lan dendrobium, hoa lan cymbidium, hoa thiên điểu, hoa chuối cảnh, hoa protea, hoa milkweed, hoa lupine, hoa delphinium, hoa foxglove, hoa snapdragon, hoa sweet pea, hoa sunflower mini, hoa bluebell, hoa iris Nhật.
- **85–96:** hoa tulip sọc, hoa hồng leo, hoa hồng sa mạc, hoa mẫu đơn trắng, hoa cúc trắng, hoa lavender trắng, hoa dạ lan hương, hoa thạch thảo, hoa phi yến, hoa loa kèn đỏ, hoa lan hồ điệp trắng, hoa cẩm tú cầu tím.

## Cây cối & lá

**Prompt tái tạo:** `Square 5x5 contact sheet of 24 distinct cute 3D clay plants, trees, leaves and botanical parts, one centered subject per cell, uniform misty leaf-green background (#e8f4e5), warm soft studio lighting and gentle ground shadows, child-friendly toy-like style, no text, no logos, no watermark; exactly equal square cells with plain gutters and outer margins, every subject fully inside its own cell, bottom-right cell contains one special rare plant or botanical hybrid.`

**Danh sách hiện có 01–15:** lá monstera, bonsai, dương xỉ, sen đá, nấm tán đỏ, lá phong, quả thông, quả sồi, thường xuân, tre, cây cọ, lá sồi, lô hội, xương rồng, cây non.

- **16–39:** sen đá haworthia, cây trầu bà, cây lưỡi hổ, cây kim tiền, cây lan ý, cây bạch dương, cây liễu, cây bao báp, cây thông Noel, cây chuối, cây cacao, cây cà phê, cây ô liu, cây chanh, cây táo, cây đào, cây bàng, cây đa, cây si, cây nguyệt quế, cây hương thảo, cây bạc hà, cây húng quế, cây rau mùi.
- **40–63:** lá phong đỏ, lá dương xỉ, lá bạch quả, lá cọ, nhánh khuynh diệp, cành ô liu, cành tầm gửi, quả dẻ, hạt phong có cánh, chồi cây, rễ khí sinh, terrarium mini, cây không khí, cây thủy sinh, rêu xanh, địa y, nấm rừng, cây dương xỉ tổ chim, cây xương rồng tai thỏ, xương rồng cầu, xương rồng cột, cây lá kim, cây bách, cây tùng.
- **64–96:** cây phong Nhật, cây sồi, cây dương, cây thông, cây vân sam, cây gỗ đỏ, cây me, cây xoan, cây lộc vừng, cây phượng, cây liễu rủ, cây tre vàng, cây trúc mây, cây cọ lùn, cây monstera, cây philodendron, cây calathea, cây peperomia, cây fittonia, cây pothos, cây không khí treo, chậu bonsai thông, chậu bonsai tùng, chậu bonsai ficus, lá nguyệt quế, lá bạc hà, lá húng quế, lá hương thảo, lá xô thơm, lá tía tô, lá cải xoăn, mầm đậu.

## Hình học

**Prompt tái tạo:** `Square 5x5 contact sheet of 24 distinct cute 3D clay geometric shapes and playful math objects, one centered subject per cell, bright pastel gradient background, clean soft studio lighting and gentle shadows, child-friendly toy-like style, no text, no logos, no watermark; equal square cells with generous gutters, every subject fully inside its own cell, bottom-right cell contains one special, visually more premium themed subject; it may use a complementary accent background while remaining clearly part of this theme.`

**Asset hiện có (01–24):** `cube.webp` — khối lập phương; `sphere.webp` — khối cầu; `cylinder.webp` — khối trụ; `cone.webp` — khối nón; `square-pyramid.webp` — chóp đáy vuông; `rectangular-prism.webp` — hộp chữ nhật; `hemisphere.webp` — bán cầu; `capsule.webp` — khối nang; `triangular-pyramid.webp` — chóp tam giác; `pentagonal-prism.webp` — lăng trụ ngũ giác; `hexagonal-pyramid.webp` — chóp lục giác; `octahedron.webp` — bát diện; `ellipsoid.webp` — khối elip; `blue-cone-frustum.webp` — nón cụt xanh; `orange-cone-frustum.webp` — nón cụt cam; `pentagonal-pyramid.webp` — chóp ngũ giác; `trapezoidal-prism.webp` — lăng trụ hình thang; `truncated-block.webp` — khối cụt; `star-prism.webp` — lăng trụ ngôi sao; `torus.webp` — khối xuyến; `square-bipyramid.webp` — chóp đôi; `dodecahedron.webp` — thập nhị diện; `triangular-prism.webp` — lăng trụ tam giác; `crescent.webp` — khối trăng lưỡi liềm.

**Mở rộng đã quy hoạch (25–96):** giữ nguyên 24 asset hiện có; khi tạo thêm, dùng đúng đối tượng sau và đặt tên tệp `kebab-case` mô tả nội dung.

- **25–48:** tam giác đều, tam giác vuông, tam giác cân, hình vuông, hình chữ nhật, hình thang, hình bình hành, hình thoi, ngũ giác, lục giác, thất giác, bát giác, thập giác, hình tròn, hình elip, bán nguyệt, một phần tư hình tròn, vành khuyên, hình sao năm cánh, hình tim, hình mũi tên, hình tia sét, dấu cộng, dấu nhân.
- **49–72:** khối lập phương, khối hộp chữ nhật, khối cầu, bán cầu, khối nón, khối trụ, khối chóp tam giác, khối chóp tứ giác, lăng trụ tam giác, lăng trụ lục giác, hình xuyến, khối bát diện, khối mười hai mặt, khối hai mươi mặt, khối nêm, khối vòng cung, khối cầu cắt, khối trụ rỗng, khối xoắn ốc, khối cầu gai, khối domino, xúc xắc, rubik, quả cầu disco.
- **73–96:** xoắn ốc Fibonacci, mê cung tròn, mẫu caro, lưới tam giác, lưới lục giác, họa tiết chevron, họa tiết ziczac, họa tiết chấm bi, mảnh ghép tangram, vòng tròn đồng tâm, đường sóng sin, biểu đồ cột không chữ, biểu đồ tròn không chữ, kính vạn hoa, fractal cây, fractal bông tuyết, tessellation tam giác, tessellation lục giác, hình đối xứng gương, hình đối xứng quay, khối pixel, khối voxel, mô hình phân tử trừu tượng, biểu tượng vô cực.

## Chữ cái

**Quy cách sinh:** SVG sinh trực tiếp từ 26 ký tự A–Z. Mỗi ký tự là khối đồ chơi 3D xanh–tím; màu cố định theo giá trị để một cặp luôn giống nhau. Không cần prompt ảnh.

## 2 Số

**Quy cách sinh:** SVG sinh trực tiếp từ các số 10–99, tổng 90 giá trị. Mỗi giá trị hiển thị trên bảng số điện tử xanh ngọc; màu cố định theo giá trị. Không cần prompt ảnh.

## 3 Số

**Quy cách sinh:** SVG sinh trực tiếp từ các số 100–999, tổng 900 giá trị. Mỗi giá trị hiển thị trên bảng số điện tử xanh ngọc; màu cố định theo giá trị. Không cần prompt ảnh.

## Ký hiệu máy tính

**Quy cách sinh:** SVG sinh trực tiếp từ 30 ký hiệu máy tính. Mỗi ký hiệu hiển thị như phím chức năng xanh đậm; màu cố định theo giá trị. Không cần prompt ảnh.

## Cyberpunk
**Prompt lô:** `Square 5x5 contact sheet of 24 distinct cute 3D clay cyberpunk objects and robots, one centered subject per cell, dark navy background with neon cyan, magenta and violet rim lighting, clean soft studio shadows, child-friendly, no people, no text, no logos, no watermark; equal square cells with generous gutters, every subject fully inside its own cell, bottom-right cell contains one special, visually more premium themed subject; it may use a complementary accent background while remaining clearly part of this theme.`

**Danh sách 01–24:** robot giao hàng, mèo máy, drone tròn, mũ bảo hiểm neon, kính thực tế tăng cường, cánh tay máy, chip AI, bảng mạch phát sáng, pin năng lượng, loa hologram, máy bán hàng tự động, biển hiệu mũi tên neon, mô tô tương lai, taxi bay, cổng dịch chuyển, vali công nghệ, tai nghe cyber, bàn phím hologram, máy ảnh drone, vệ tinh mini, cây nhân tạo neon, mặt nạ điện tử, hộp công cụ laser, tinh thể dữ liệu.

- **25–48:** robot vệ sinh, chó máy, cá máy hologram, côn trùng nano, kính áp tròng AR, găng tay haptic, giày phản lực, áo khoác phát sáng, đồng hồ thông minh, vòng tay sinh trắc, ổ cứng neon, thanh RAM, màn hình gập, chuột laser, cáp quang, trạm sạc, máy in 3D, cửa an ninh tương lai, thang máy hologram, biển quảng cáo neon, cột đèn neon, robot barista, vườn thủy canh neon, thú cưng robot.
- **49–72:** bảng điều khiển tàu, bàn đạp chân máy, cổng quét võng mạc, camera an ninh bay, máy chiếu hologram, bản đồ thành phố neon, tủ lạnh công nghệ, máy bán vé tự động, quả cầu plasma, chip lượng tử, kính bảo hộ thợ máy, mũ trùm cyber, nhẫn thông minh, loa drone, băng tay phát sáng, cờ lê đa năng laser, tuốc nơ vít điện tử, hộp sơ cứu nano, pin mặt trời mini, thẻ nhận diện điện tử, đồng xu dữ liệu, dây chuyền mạch điện, radio tương lai, biển hiệu pixel.
- **73–96:** robot đầu bếp, robot thợ hàn, robot nhảy múa, xe trượt phản lực, ván bay, monorail tương lai, tàu điện neon, máy bay không người lái giao hàng, tàu vũ trụ chở hàng, mô tô một bánh, bốt dịch chuyển, máy quét vật thể, kính hiển vi nano, máy tạo thời tiết, bộ phát khiên năng lượng, ăng-ten tín hiệu, máy chủ dữ liệu, khối mã hóa, ổ khóa vân tay, đồng hồ đếm ngược, xúc xắc kỹ thuật số, xúc tu robot, nấm cyber phát sáng, giọt chất lỏng neon.

## RPG phép thuật
**Prompt lô:** `Square 5x5 contact sheet of 24 distinct cute 3D clay fantasy magic items and creatures, one centered subject per cell, deep indigo background with warm gold and violet magical glow, soft studio shadows, whimsical child-friendly game art, no text, no logos, no watermark; equal square cells with generous gutters, every subject fully inside its own cell, bottom-right cell contains one special, visually more premium themed subject; it may use a complementary accent background while remaining clearly part of this theme.`

**Danh sách 01–24:** đũa phép, sách thần chú, lọ thuốc đỏ, lọ thuốc xanh, quả cầu pha lê, mũ phù thủy, chổi bay, rồng con, phượng hoàng con, kỳ lân con, rương kho báu, chìa khóa cổ, nhẫn phép, amulet mặt trăng, thanh kiếm phát sáng, khiên rune, gậy pháp sư, nấm phép, hoa phát sáng, nấm độc, tinh thể tím, cuộn bản đồ, đèn lồng ma thuật, cổng đá rune.

- **25–48:** cây đũa phép pha lê, sách phép băng, sách phép lửa, lọ thuốc tím, lọ thuốc vàng, vạc phép, chày giã thuốc, túi bột phép, chổi quét sao, mèo phù thủy, cú đưa thư, yêu tinh nhỏ, tiên hoa, quái vật slime, golem đá, người tuyết phép, cây gậy sấm sét, gậy trượng mặt trời, cung ánh trăng, nỏ rune, búa sét, mũ giáp hiệp sĩ, áo choàng pháp sư, giày bay.
- **49–72:** găng tay phép, khiên hoa văn rồng, thanh kiếm băng, kiếm gỗ cổ, rìu chiến không sắc, bình mực phép, lông vũ phượng hoàng, vảy rồng, trứng rồng, móng griffin, sừng kỳ lân, bánh xe phép thuật, ngôi sao triệu hồi, vòng tròn rune, cánh cổng mây, tháp phù thủy, lều pháp sư, cầu đá ma thuật, giếng điều ước, cây cổ thụ biết nói, nấm phát sáng xanh, cây ăn quả phép, hòn đá mặt trăng, đá mặt trời.
- **73–96:** rương mimics thân thiện, bản đồ kho báu, la bàn phép, kính viễn vọng sao, chìa khóa pha lê, ổ khóa rune, cuộn sấm chú, cuộn dịch chuyển, mặt dây chuyền sao, huy hiệu bang hội, đồng xu vàng, viên ngọc lục bảo, viên ruby, viên sapphire, viên ngọc trai phép, đèn dầu thần, bình xịt phép thuật, quả táo vàng, bánh quy sao, ấm trà phù thủy, đèn lồng bí ngô phép, chuông gió pha lê, mô hình lâu đài, lá bùa may mắn.

## Vũ trụ
**Prompt lô:** `Square 5x5 contact sheet of 24 distinct cute 3D clay space objects and friendly astronauts, one centered subject per cell, deep starry navy background with cyan and violet light, soft studio shadows, child-friendly, no text, no logos, no watermark; equal square cells with generous gutters, every subject fully inside its own cell, bottom-right cell contains one special, visually more premium themed subject; it may use a complementary accent background while remaining clearly part of this theme.`

**Danh sách 01–24:** tên lửa, phi hành gia, người ngoài hành tinh xanh, UFO, tàu không gian, trạm vũ trụ, vệ tinh, rover Sao Hỏa, Mặt Trời, Sao Thủy, Sao Kim, Trái Đất, Mặt Trăng, Sao Hỏa, Sao Mộc, Sao Thổ, Sao Thiên Vương, Sao Hải Vương, sao chổi, thiên thạch, kính thiên văn, hố đen, tinh vân, chòm sao.

- **25–48:** Sao Diêm Vương, mặt trăng Europa, mặt trăng Titan, mặt trăng Io, mặt trăng Ganymede, tàu con thoi, tàu đổ bộ Mặt Trăng, robot thám hiểm, xe tự hành Mặt Trăng, kính thiên văn không gian, kính thiên văn radio, đài quan sát, ăng-ten parabol, tên lửa đẩy, khoang thoát hiểm, bộ đồ phi hành gia, mũ phi hành gia, găng tay phi hành gia, ủng phi hành gia, lá cờ hành tinh, trạm tiếp nhiên liệu, tàu chở hàng vũ trụ, cổng không gian, khoang ngủ không trọng lực.
- **49–72:** vệ tinh thời tiết, vệ tinh liên lạc, vệ tinh định vị, tàu thăm dò, tàu do thám, tàu khai thác tiểu hành tinh, tiểu hành tinh băng, thiên thạch lửa, mảnh sao băng, vòng sao Thổ, bão Sao Mộc, vết đỏ lớn, cực quang hành tinh, nhật thực, nguyệt thực, quỹ đạo hành tinh, vành đai tiểu hành tinh, vành đai Kuiper, đám mây Oort, thiên hà xoắn ốc, thiên hà elip, thiên hà lùn, cụm sao, sao lùn trắng.
- **73–96:** sao lùn đỏ, sao khổng lồ đỏ, sao neutron, pulsar, siêu tân tinh, tàn dư siêu tân tinh, tinh vân hành tinh, tinh vân đại bàng, đám mây bụi vũ trụ, lỗ sâu, cổng sao, tinh thể không gian, đồng hồ thiên văn, quả cầu mô hình hệ Mặt Trời, bản đồ sao, máy tính dẫn đường, hệ thống duy trì sự sống, bình oxy, bình nhiên liệu, hộp dụng cụ phi hành gia, thức ăn không gian, cây trồng thủy canh, thiên thạch có vòng, người ngoài hành tinh tím.

## Vật dụng gia đình
**Prompt lô:** `Square 5x5 contact sheet of 24 distinct cute 3D clay household objects, one centered subject per cell, warm cream background with soft pastel accents and studio shadows, child-friendly, no text, no logos, no watermark; equal square cells with generous gutters, every subject fully inside its own cell, bottom-right cell contains one special, visually more premium themed subject; it may use a complementary accent background while remaining clearly part of this theme.`

**Danh sách 01–24:** đèn bàn, đồng hồ báo thức, ghế bành, ghế đẩu, gối ôm, chăn gấp, ấm nước, cốc sứ, đĩa, bát, nồi, chảo, tủ lạnh, lò vi sóng, máy nướng bánh mì, quạt bàn, máy hút bụi, máy giặt, bàn là, điều khiển TV, tivi, khung ảnh trống, bình hoa, chậu cây.

- **25–48:** giường ngủ, nệm cuộn, đèn ngủ, đèn đứng, rèm cửa, thảm tròn, giá sách, kệ treo tường, bàn trà, bàn ăn, ghế ăn, tủ quần áo, ngăn kéo, gương treo tường, móc áo, giỏ đựng đồ, hộp khăn giấy, thùng rác, chổi, cây lau nhà, hốt rác, xô nước, máy lọc không khí, máy tạo ẩm.
- **49–72:** máy sấy tóc, máy cạo râu, bàn chải đánh răng, kem đánh răng, xà phòng, chai dầu gội, khăn tắm, áo choàng tắm, cân sức khỏe, hộp thuốc, nhiệt kế, đèn pin, ổ cắm điện, dây nối điện, công tắc đèn, đồng hồ treo tường, chuông cửa, chìa khóa nhà, thảm chùi chân, hộp thư, bình chữa cháy, quạt trần, máy điều hòa, lò sưởi.
- **73–96:** máy pha cà phê, ấm siêu tốc, máy xay sinh tố, nồi cơm điện, nồi chiên không dầu, máy rửa bát, máy đánh trứng, hộp cơm, thớt gỗ, dao bếp an toàn, muỗng gỗ, nĩa, đũa, khay đá, lọ gia vị, bình nước, hộp bánh quy, tạp dề, găng tay lò nướng, giá phơi đồ, giỏ giặt, móc kẹp quần áo, máy may, bộ dụng cụ sửa nhà.

## Đồ dùng văn phòng
**Prompt lô:** `Square 5x5 contact sheet of 24 distinct cute 3D clay office supplies, one centered subject per cell, pale blue-white background with subtle pastel accents and studio shadows, child-friendly, no text, no logos, no watermark; equal square cells with generous gutters, every subject fully inside its own cell, bottom-right cell contains one special, visually more premium themed subject; it may use a complementary accent background while remaining clearly part of this theme.`

**Danh sách 01–24:** bút chì, bút mực, bút dạ quang, tẩy, gọt bút chì, thước kẻ, kéo, keo dán, băng keo, kẹp giấy, kẹp bướm, ghim bấm, máy dập ghim, sổ tay, lịch bàn không chữ, tập hồ sơ, bìa kẹp, phong bì, máy tính cầm tay, bàn phím, chuột máy tính, USB, máy in, kính đọc sách.

- **25–48:** bút bi, bút gel, bút lông bảng, bút vẽ kỹ thuật, bút màu sáp, hộp bút, hộp mực, ruột bút, đầu bút thay thế, thước đo góc, compa, ê-ke, bảng kẹp giấy, bảng trắng mini, khăn lau bảng, nam châm tròn, ghim nam châm, nhãn dán màu, giấy ghi chú, giấy than, giấy in ảnh, giấy thủ công, con dấu ngày tháng, mực dấu.
- **49–72:** máy ép plastic, túi ép plastic, máy hủy giấy, máy quét tài liệu, máy photocopy, máy chiếu, màn chiếu, webcam, tai nghe có mic, mic để bàn, đèn bàn LED, ổ cứng ngoài, thẻ nhớ, đầu đọc thẻ, hub USB, dây sạc, sổ danh thiếp, danh thiếp trống, bảng tên để bàn, giá đỡ điện thoại, giá đỡ laptop, túi đựng laptop, máy tính để bàn, màn hình máy tính.
- **73–96:** bút cảm ứng, bảng vẽ điện tử, chuột không dây, bàn di chuột, máy đếm tiền, máy tính in hóa đơn, máy đóng gáy, lò xo đóng tập, bìa nhựa trong, giấy phân trang, kẹp trình ký, hộp lưu trữ hồ sơ, khay đựng giấy, giá đỡ sách, kính lúp đọc chữ, đèn kẹp bàn, bộ hẹn giờ, lịch lật không chữ, bảng kế hoạch trống, hộp ghim, máy gọt bút chì điện, dao rọc giấy, thảm cắt, con lăn keo.

## Dụng cụ làm vườn
**Prompt lô:** `Square 5x5 contact sheet of 24 distinct cute 3D clay gardening tools, materials and garden infrastructure, one centered object per cell, uniform fresh light-green background (#edf8d2) with warm sunshine and soft studio shadows, child-friendly, no text, no logos, no watermark; exactly equal square cells with plain gutters and outer margins, every object fully inside its own cell, bottom-right cell contains one special premium tool or compact garden workstation. Do not include flowers, plants, fruits or vegetables.`

**Danh sách hiện có 01–40:** bầu ươm cây, biển đánh dấu cây, tổ chim, bộ hẹn giờ tưới, chổi cỏ, cọc chống cây, vòi tưới cuộn, cưa cành, cuốc chim, đầu phun xoay, đầu tưới nhỏ giọt, dây buộc cây, găng tay cao su, găng tay làm vườn, xẻng tay, kéo cắt cành lớn, khay gieo hạt, cào lá, liềm cắt cỏ, lưới che nắng, lưới chống côn trùng, máy đo độ ẩm đất, nhà kính mini, nhiệt kế đất, nĩa làm vườn, ống dẫn nước, kéo tỉa cây, gói hạt giống, xẻng lớn, cuốc nhỏ, túi đất, bình xịt, chậu đất nung, thùng chứa nước mưa, thùng ủ phân, ủng đi vườn, bình tưới, xe cút kít, hàng rào gỗ, xẻng xúc đất.

- **41–64:** bù nhìn rơm, nhà chim gỗ, máng ăn chim, tổ ong nhân tạo, khách sạn côn trùng, đèn năng lượng mặt trời, ghế băng vườn, bàn ghế sân vườn, chòi cây, giàn leo, cổng vòm, hồ cá mini, đài phun nước, tượng gnome, đá lát lối đi, vòng trang trí cỏ, xe cắt cỏ, máy thổi lá, máy cắt tỉa hàng rào, bình phun phân bón, túi phân trộn, xe kéo làm vườn, giỏ thu hoạch, bàn làm vườn.
- **65–88:** giá để dụng cụ, hộp dụng cụ làm vườn, thước đo đất, máy đo pH đất, máy đo ánh sáng, máy rải hạt, máy làm đất mini, máy cắt cỏ cầm tay, máy tưới tự động, van tưới, đầu nối vòi, cuộn dây nhỏ giọt, béc phun sương, mái che vườn, lều ươm, khung giàn leo, giá đỡ chậu cây, đế có bánh xe cho chậu, khay thoát nước, chậu treo rỗng, bình phun sâu bệnh, bẫy côn trùng, lưới chắn chim, dụng cụ nhổ cỏ.
- **89–96:** xẻng xúc phân, dao ghép cây, dây buộc cành, ghim cố định lưới, giá treo vòi, thùng đựng dụng cụ, xe đẩy vườn, máy xịt áp lực.

## Thời trang & phụ kiện
**Prompt lô:** `Square 5x5 contact sheet of 24 distinct cute 3D clay fashion items and accessories, one centered subject per cell, blush pink background with pastel lavender and soft studio shadows, child-friendly, no text, no logos, no watermark; equal square cells with generous gutters, every subject fully inside its own cell, bottom-right cell contains one special, visually more premium themed subject; it may use a complementary accent background while remaining clearly part of this theme.`

**Danh sách 01–24:** áo thun, áo khoác denim, áo len, váy liền, quần jeans, giày thể thao, giày bốt, dép sandal, mũ lưỡi trai, mũ beret, mũ len, kính râm, kính gọng tròn, đồng hồ đeo tay, vòng tay, vòng cổ, nhẫn, bông tai, túi xách, ba lô, ví tiền, khăn quàng, thắt lưng, nơ cài tóc.

- **25–48:** áo sơ mi, áo polo, áo hoodie, áo cardigan, áo blazer, áo mưa, áo khoác da, áo khoác phao, quần short, quần kaki, quần yếm, chân váy xếp ly, váy dạ hội, váy ngủ, bộ đồ thể thao, đồ bơi, áo bóng đá, giày lười, giày cao gót, giày ballet, giày đi mưa, dép đi trong nhà, tất sọc, găng tay len.
- **49–72:** mũ rộng vành, mũ fedora, mũ bảo hộ, băng đô, kẹp tóc, vương miện, khăn turban, mặt nạ ngủ, kính bơi, kính bảo hộ, đồng hồ bỏ túi, nhẫn cưới, nhẫn đá quý, vòng chân, trâm cài áo, ghim cài áo, huy hiệu cài áo, dây đeo thẻ, túi tote, túi đeo chéo, túi ví cầm tay, túi du lịch, va li, ô gấp.
- **73–96:** ô che mưa, gương cầm tay, lược, bàn chải tóc, máy uốn tóc, máy sấy tóc, chai nước hoa, son môi, bảng phấn mắt, lọ sơn móng, dây chuyền ngọc trai, vòng cổ choker, vòng tay charm, thắt nơ cổ, cà vạt, nơ bướm, khuy măng sét, dây treo quần, ví đựng thẻ, hộp trang sức, giá treo quần áo, móc khóa, bao điện thoại, huy hiệu thời trang.

## Phương tiện giao thông
**Prompt lô:** `Square 5x5 contact sheet of 24 distinct cute 3D clay vehicles, one centered subject per cell, bright sky blue background with soft white clouds and studio shadows, child-friendly, no text, no logos, no watermark; equal square cells with generous gutters, every subject fully inside its own cell, bottom-right cell contains one special, visually more premium themed subject; it may use a complementary accent background while remaining clearly part of this theme.`

**Danh sách 01–24:** xe đạp, xe máy, scooter điện, ô tô nhỏ, taxi, xe buýt, xe cứu hỏa, xe cứu thương, xe cảnh sát, xe tải chở hàng, xe ben, máy kéo, xe cút kít công trường, tàu hỏa, tàu điện, tàu buồm, ca nô, tàu ngầm, trực thăng, máy bay, khinh khí cầu, xe cáp treo, ván trượt, xe trượt tuyết.

- **25–48:** xe đạp đôi, xe đạp địa hình, xe đạp chở hàng, xe máy sidecar, xe tuk tuk, xe limousine, xe mui trần, xe thể thao, xe điện, xe hybrid, xe caravan, xe nhà di động, xe bọc thép không vũ khí, xe chở rác, xe quét đường, xe chở thư, xe giao pizza, xe chở kem, xe nâng, xe cẩu, xe lu, xe xúc, xe cứu hộ, xe chở ngựa.
- **49–72:** tàu chở hàng, tàu du lịch, phà, tàu phá băng, tàu đánh cá, tàu cứu hộ, tàu vũ trụ, thuyền kayak, thuyền gondola, thuyền chèo, ván buồm, mô tô nước, xe lội nước, tàu đệm khí, máy bay trực thăng cứu hộ, thủy phi cơ, máy bay phản lực, máy bay cánh quạt, máy bay không người lái, khinh khí cầu hình thú, dù lượn, tàu lượn siêu tốc, xe đẩy hành lý sân bay, cầu thang máy bay.
- **73–96:** tàu điện ngầm, tàu một ray, tàu cao tốc, đầu máy hơi nước, xe điện mặt đất, toa ăn tàu, xe cáp treo núi, thang cuốn, băng chuyền hành lý, xe trượt băng, xe chó kéo, xe trượt tuyết tuyết, xe golf, xe lăn điện, xe đẩy em bé, xe kéo tay, xe thồ hàng, xe ba bánh, xe đạp một bánh, ván lướt sóng, ván trượt điện, xe scooter gấp, xe leo núi, xe trượt dốc.

## Cổ vật lịch sử

**Prompt tái tạo:** `Square 5x5 contact sheet of 24 distinct cute 3D clay historical artifacts, one centered artifact per cell, uniform midnight-blue background (#031126) with restrained antique-gold highlights and soft studio shadows, adventurous child-friendly museum style, no weapons, no text, no logos, no watermark; exactly equal square cells with plain gutters and outer margins, every artifact fully inside its own cell, bottom-right cell contains one special rare historical relic in appropriate natural materials.`

**Danh sách hiện có 01–29:** bình cổ, la bàn cổ, ổ khóa cổ, bản đồ kho báu, bình amphora, chìa khóa đồng, tượng Moai, sách mật mã cổ, cuộn giấy cói, đồng hồ mặt trời, tượng mèo Ai Cập, mặt nạ vàng, hộp bí mật, khiên Ai Cập, kính lúp cổ, cuộn bản đồ, mặt nạ châu Phi, mũ sắt La Mã, hộp nhạc, đèn dầu, đồng hồ bỏ túi, điện thoại quay số, thiên văn cầu, tượng đất nung, tượng nhân sư, máy đánh chữ, máy ảnh cổ, đĩa than, con dấu sáp.

- **30–53:** vương miện cổ, quyền trượng hoàng gia, nhẫn signet, hộp trang sức cổ, gương cổ, đèn dầu La Mã, quạt cổ, gramophone, máy đánh điện báo, máy ảnh hộp, máy quay phim cổ, kính một tròng, ống nhòm sân khấu, kính vạn hoa cổ, địa cầu cổ, la bàn sao, mẫu tàu trong chai, tượng chiến binh đất nung, phù điêu đá, mảnh bản đồ cổ, hộp thuốc cổ, đồng xu La Mã, bia đá rune, bức tượng thần Hy Lạp.
- **54–77:** bát gốm cổ, đĩa gốm cổ, lư hương đồng, trống đồng, kiếm nghi lễ không sắc, áo giáp nghi lễ, huy chương cổ, ấn chương hoàng gia, bình thuốc cổ, đồng hồ cát cổ, thẻ bài tarot cổ, sách da cổ, cuộn da thuộc, bản khắc gỗ, mặt nạ Venice, tượng Phật cổ, tượng Ai Cập, bùa hộ mệnh scarab, dây chuyền cổ, vòng tay cổ, hộp khảm trai, bình rượu cổ, khung tranh cổ, giá nến cổ.
- **78–96:** đèn lồng cổ, bình thủy tinh cổ, dụng cụ thiên văn cổ, astrolabe, đồng hồ mặt trời mini, bàn tính cổ, kính hiển vi cổ, máy đánh chữ mini, hộp nhạc quay tay, con dấu sáp cổ, chìa khóa skeleton, ổ khóa sắt cổ, la bàn gỗ, bản đồ sao cổ, tượng sư tử đá, ngọc bội cổ, trâm cài cổ, nhẫn đá quý cổ, hộp bí mật chạm khắc.

## Thiết bị gián điệp

**Prompt tái tạo:** `Square 5x5 contact sheet of 24 distinct cute 3D clay spy gadgets, one centered gadget per cell, uniform dark blue-gray background (#101927) with subtle cool rim lighting and soft studio shadows, playful child-friendly style, no weapons, no text, no logos, no watermark; exactly equal square cells with plain gutters and outer margins, every gadget fully inside its own cell, bottom-right cell contains one special advanced gadget in theme-appropriate colors.`

**Danh sách hiện có 01–19:** bộ đàm, bút camera, đèn UV, dấu chân phát sáng, kính nhìn đêm, kính râm gián điệp, micro cài áo, máy dò kim loại, máy ghi âm mini, máy mã hóa, máy nghe lén, máy phát tín hiệu, máy ảnh gián điệp mini, nút áo camera, ổ khóa số, kính tiềm vọng, tai nghe bí mật, vali điệp viên, kính thiên văn trinh sát.

- **20–43:** tài liệu mật không chữ, phong bì niêm phong, con dấu bí mật, hộp đựng phim, cuộn phim âm bản, máy chiếu phim mini, đĩa mềm, băng cassette, máy nhắn tin, điện thoại vệ tinh, kính hồng ngoại, máy quét dấu vân tay, thiết bị định vị, đèn pin mật mã, bảng giải mã, bánh xe Caesar, thẻ nhận diện bí mật, hình con mắt bí mật, dây móc leo, đồng xu bí mật, hộp phấn ngụy trang, máy quét RFID, khóa vân tay, micro laser.
- **44–67:** máy dò chuyển động, camera nút áo, camera bút chì, camera kính mắt, máy ghi âm bỏ túi, tai nghe xương, đồng hồ bí mật, nhẫn thông minh bí mật, dây chuyền mật mã, ổ USB mã hóa, đèn pin UV mini, kính lúp gián điệp, ống nhòm mini, bản đồ nhiệt, thiết bị đổi giọng, máy gây nhiễu, bộ đàm cổ tay, máy quét tần số, hộp thư bí mật, bút mực tàng hình, giấy mật mã, kính lọc phân cực, máy chụp ảnh nhiệt, thẻ chìa khóa điện tử.
- **68–96:** vali mật mã, túi đựng thiết bị, găng tay cảm ứng, giày chống dấu vết, áo khoác ẩn hình, mặt nạ nhận diện, huy hiệu đặc vụ, đèn hiệu khẩn cấp, máy phát GPS, thiết bị nghe qua tường, máy dò bug, bộ dụng cụ mở khóa an toàn, máy in ảnh mini, thiết bị phát tín hiệu SOS, máy quét võng mạc, bộ điều khiển drone, drone trinh sát mini, hộp mã hóa dữ liệu, điện thoại mã hóa, máy tạo khói sân khấu, kính nhìn xuyên đêm, la bàn điện tử, thiết bị theo dõi hành lý, máy quét mã QR, ví chống RFID, đồng hồ đếm ngược, máy thu sóng, máy sao chép thẻ, máy định vị mini.

## Lễ hội
**Prompt lô:** `Square 5x5 contact sheet of 24 distinct cute 3D clay festival decorations, foods and symbols from diverse celebrations, one centered subject per cell, joyful warm cream background with colorful confetti and soft studio shadows, child-friendly, no text, no logos, no watermark; equal square cells with generous gutters, every subject fully inside its own cell, bottom-right cell contains one special, visually more premium themed subject; it may use a complementary accent background while remaining clearly part of this theme.`

**Danh sách 01–24:** đèn lồng đỏ, hoa mai vàng, bánh chưng, phong bao lì xì không chữ, trống hội, múa lân, cây thông Noel, chuông vàng, tất Giáng sinh, kẹo gậy, bí ngô Halloween, đèn bí ngô, mũ phù thủy Halloween, trứng Phục Sinh, thỏ Phục Sinh, pháo hoa, bóng bay, bánh sinh nhật, nến sinh nhật, cờ tam giác, mặt nạ carnival, hoa giấy, vòng hoa, quà gói ruy băng.

- **25–48:** bánh trung thu, đèn ông sao, đầu lân, cành đào hồng, câu đối trống không chữ, mâm ngũ quả, con giáp đất, áo dài Tết, hoa sen, trống cơm, đèn lồng giấy, bánh tét, hoa trạng nguyên, quả châu Noel, ngôi sao Noel, vòng nguyệt quế Noel, xe trượt tuyết Noel, người tuyết, găng tay Noel, hộp thư ông già Noel, cây kẹo mút, bánh gừng, tuần lộc, mũ ông già Noel.
- **49–72:** nón phù thủy Halloween, mạng nhện Halloween, kẹo ngô, ma thân thiện, dơi giấy, mèo đen Halloween, bộ xương vui nhộn, quan tài hoạt hình, cổng nhà ma, quả táo caramel, giỏ kẹo, nến Halloween, thỏ Phục Sinh đội nơ, giỏ trứng, gà con Phục Sinh, hoa thủy tiên, chuông Phục Sinh, bươm bướm mùa xuân, bánh kem đám cưới, chuông cưới, bó hoa cưới, thiệp mời trống, bánh quy trái tim, hòm quà cưới.
- **73–96:** bánh cupcake sinh nhật, mũ sinh nhật, kèn thổi tiệc, dải ruy băng, phông nền chấm bi, bóng bay hình sao, hoa giấy hình ngôi sao, huy chương vàng, cúp chiến thắng, cờ caro, đuốc Olympic, trống cổ vũ, áo đội tuyển không logo, huy hiệu lễ hội, đèn disco, mặt nạ hóa trang, chuỗi hạt carnival, lông vũ carnival, xe diễu hành mini, pháo giấy, trống lắc, vòng tay phát sáng, đèn lồng trăng, ngôi sao giấy.

## Lô mở rộng 97–120

Các lô dưới đây tiếp nối trực tiếp từng chủ đề tương ứng; chỉ là danh sách theo dõi, chưa phải asset đã tạo.

### Động vật

- **97–120:** chó đốm, chó husky, chó dachshund, mèo Bengal, mèo Scottish Fold, mèo Maine Coon, lợn mini, bò sữa, trâu nước, ngựa con, nai sừng tấm, hươu sao, linh dương saiga, cầy meerkat, cầy mực, mèo cầy, chồn ferret, sóc đỏ, chuột đồng, chuột túi, emu, chim cánh cụt hoàng đế, chim hồng hoàng, chim bói cá.

### Đồ ăn

- **97–120:** bánh mì kẹp thịt, bánh mì kẹp cá, bánh mì kẹp rau, bánh mì que, bánh mì nướng bơ tỏi, bánh mì vòng, bánh khoai tây, khoai tây nghiền, khoai tây lát, bánh crepe, bánh waffle kẹp kem, bánh mì French toast, bánh mì sandwich tam giác, cơm nắm tam giác, cơm niêu, cơm cuộn rong biển, mì ramen cay, mì udon xào, mì Ý pesto, bánh pizza hải sản, bánh pizza chay, bánh taco cá, bánh burrito chay, bánh quesadilla phô mai.

### Đồ uống

- **97–120:** trà sữa trân châu đen, trà sữa trân châu trắng, trà sữa đường đen, cà phê bạc xỉu, cà phê cold brew cam, cà phê mocha đá, cacao bạc hà, sữa dâu, sữa chuối, sữa khoai môn, nước ép dưa lưới, nước ép xoài, nước ép dâu, nước ép nho, nước ép táo xanh, nước ép lựu, soda bạc hà, soda chanh dây, soda dưa hấu, trà sữa hoa nhài, trà sữa ô long đào, trà sen, trà gạo rang, trà quế táo.

### Trái cây

- **97–120:** táo đỏ mini, táo xanh Granny Smith, chuối cau, chuối tiêu, cam Valencia, cam quýt Satsuma, chanh Meyer, bưởi hồng, lê đỏ, đào trắng, mận đỏ, mơ vàng, cherry vàng, dâu tây rừng, việt quất xanh, mâm xôi vàng, nho tím, nho không hạt, dưa hấu vàng, dưa hấu mini, dưa lưới xanh, dứa mini, xoài cát, đu đủ đỏ.

### Rau củ

- **97–120:** củ cải đỏ tròn, củ cải trắng dài, củ sen cắt lát, khoai sọ, khoai lang tím, khoai tây bi, hành boa-rô, hành lá, tỏi đen, nghệ tươi, sả, cà chua bi, cà chua vàng, bí đỏ mini, bí ngòi vàng, dưa chuột mini, cà tím dài, cà tím tròn, bắp non, đậu cô ve, đậu rồng, mướp đắng, rau cải ngọt, rau mồng tơi.

### Thiên nhiên

- **97–120:** đỉnh núi đá, thung lũng sương, hồ núi lửa, hang băng, cột đá bazan, đá cân bằng, đồng muối, thác băng, suối nước nóng, bãi biển đá cuội, bờ biển vỏ sò, rừng sương mù, rừng lá đỏ, sa mạc đá, hẻm núi đỏ, đầm phá xanh, vịnh hẹp, cồn cát sao, đồng cỏ hoa dại, bãi băng trôi, mây lenticular, sét bóng, mưa sao băng, nguyệt thực toàn phần.

### Hoa

- **97–120:** hoa hồng vàng, hoa hồng cam, hoa hồng tím, hoa tulip đen, hoa tulip kép, hoa lan cattleya, hoa lan mokara, hoa lan vanda, hoa cúc đồng tiền hồng, hoa cúc đồng tiền cam, hoa dâm bụt đỏ, hoa dâm bụt vàng, hoa giấy hồng, hoa giấy tím, hoa cẩm chướng đỏ, hoa mao lương trắng, hoa mẫu đơn hồng, hoa sen hồng, hoa súng tím, hoa tử đằng trắng, hoa đỗ quyên đỏ, hoa cát cánh, hoa lưu ly, hoa thạch nam.

### Cây cối & lá

- **97–120:** cây bạch đàn, cây phong đường, cây dẻ, cây du, cây sung, cây mít, cây xoài, cây mận, cây hồng, cây quýt, cây bưởi, cây chanh leo, cây thanh long, cây trầu bà leo, cây lưỡi hổ sọc, cây kim ngân, cây đa búp đỏ, cây vạn niên thanh, lá bạc hà xoăn, lá húng quế tím, lá nguyệt quế tươi, lá bạch đàn, nhánh thông, cành liễu.

### Hình học

- **97–120:** hình tam giác bo góc, hình vuông bo góc, hình chữ nhật bo góc, hình ngũ giác bo góc, hình lục giác bo góc, hình bát giác bo góc, khối lập phương rỗng, khối cầu rỗng, khối trụ rỗng, khối nón rỗng, khối chóp rỗng, khối vòng xoắn, khối lò xo, khối xích, khối bánh răng, khối tổ ong, khối lưới cầu, khối lưới lập phương, khối Rubik mini, khối tangram, hình xoắn ốc kép, biểu tượng pi 3D, biểu tượng sigma 3D, biểu tượng delta 3D.

### Cyberpunk

- **97–120:** bộ não hologram, kính hiển vi nano, chip sinh học, ổ cứng lượng tử, trạm dữ liệu mini, máy chủ neon, cổng quét thẻ, vòng tay laser, mũ bảo hộ thợ máy, robot thợ hàn, robot giao hoa, robot cứu hộ, robot nhện, drone cánh quạt, drone đèn neon, taxi tự lái, bảng điều khiển hologram, bản đồ mạch điện, chìa khóa dữ liệu, đồng xu kỹ thuật số, hộp mã hóa, máy chiếu plasma, cây cyber phát sáng, biển hiệu pixel.

### RPG phép thuật

- **97–120:** rồng băng con, rồng lửa con, griffin con, kỳ lân biển, mèo phép thuật, cú tuyết đưa thư, đèn thần, gương ma thuật, đàn hạc phép, trống rune, quả táo phép, bánh sao phép, bình thuốc hồi máu, bình thuốc tàng hình, bình thuốc may mắn, đá triết gia, viên ngọc lửa, viên ngọc băng, viên ngọc sét, sách phép rừng, sách phép biển, chuông triệu hồi, bùa hộ mệnh, cổng cầu vồng.

### Vũ trụ

- **97–120:** sao lùn nâu, sao lùn xanh, sao khổng lồ xanh, sao đôi, cụm sao cầu, tinh vân xoắn, tinh vân phản xạ, tinh vân tối, thiên hà Andromeda, thiên hà vòng, sao chổi đôi đuôi, tiểu hành tinh kim loại, tiểu hành tinh đá, vệ tinh nano, tàu vũ trụ mini, tàu thám hiểm sâu, xe rover băng, trạm không gian vòng, kính thiên văn James Webb, đài quan sát Mặt Trăng, radar vũ trụ, bình oxy phi hành gia, hộp đồ nghề không gian, vườn không trọng lực.

### Vật dụng gia đình

- **97–120:** đèn ngủ mặt trăng, đèn sàn, rèm cuốn, thảm lông, ghế bập bênh, ghế beanbag, bàn làm việc, bàn đầu giường, tủ đầu giường, kệ giày, giá treo áo, giỏ mây, hộp khăn giấy, lọ nến, máy lọc nước, máy lọc không khí, máy tạo ẩm, máy sấy tóc, bàn chải điện, hộp thuốc, nhiệt kế, chuông cửa, chìa khóa nhà, ổ cắm điện.

### Đồ dùng văn phòng

- **97–120:** bút máy, bút lông dầu, bút brush, bút vẽ màu nước, hộp màu, bảng pha màu, bút xóa, giấy note hình sao, giấy note hình mũi tên, sổ lò xo, sổ da, kẹp tài liệu, khay giấy, giá sách để bàn, đục lỗ giấy, máy đóng gáy, dao rọc giấy, thảm cắt, keo sữa, keo dán hai mặt, nhãn dán tròn, con dấu trống, hộp bút để bàn, đèn bàn kẹp.

### Dụng cụ làm vườn

- **97–120:** kéo cắt cỏ, kéo hái quả, cưa cầm tay, búa đóng cọc, kìm cắt dây, kìm uốn cây, bàn chải chậu, lưỡi thay thế máy cắt, dây tưới thấm, đầu nối nhanh, van chia nước, đồng hồ nước, máy bơm nước mini, máy hút lá, máy nghiền cành, xe kéo tay, hộp hạt giống, giá treo dụng cụ, móc treo xẻng, thùng rác vườn, tấm lót chống cỏ, viền luống vườn, cọc đèn sân vườn, dù che nắng sân vườn.

### Thời trang & phụ kiện

- **97–120:** áo khoác bomber, áo khoác trench, áo vest, áo gile, áo len cổ lọ, quần jogger, quần culottes, quần short jeans, váy maxi, váy yếm, váy sơ mi, giày Oxford, giày loafer, giày mule, túi bucket, túi baguette, túi đeo hông, ví cầm tay, khăn bandana, khăn choàng lụa, mũ bucket, mũ visor, vòng cổ ngọc trai, vòng tay charm.

### Phương tiện giao thông

- **97–120:** xe jeep, xe bán tải, xe minivan, xe sedan, xe hatchback, xe roadster, xe rally, xe điện mini, xe buýt hai tầng, xe buýt trường học, xe tải thùng, xe tải lạnh, xe bồn, xe cứu hộ, xe nâng điện, xe chở hành lý, tàu điện ngầm, tàu cao tốc, tàu hỏa đồ chơi, phà chở xe, thuyền buồm catamaran, thủy phi cơ, máy bay phản lực mini, drone chở hàng.

### Cổ vật lịch sử

- **97–120:** tượng thần Anubis, tượng chiến binh Sparta, bình gốm Hy Lạp, bình ngọc cổ, khay đồng cổ, chén ngọc, hộp sơn mài, quạt giấy cổ, thư pháp cuộn trống, sách minh họa cổ, bản đồ hàng hải cổ, địa cầu đồng, kính thiên văn đồng, hộp đồng xu, huy hiệu hoàng gia, chìa khóa lâu đài, ổ khóa chạm khắc, đèn bão cổ, máy đánh chữ vàng, máy ảnh xếp, máy quay phim tay, radio cổ, máy hát đĩa, máy thu điện báo.

### Thiết bị gián điệp

- **97–120:** camera siêu nhỏ, tai nghe hạt đậu, micro cúc áo, bút laser, đồng hồ camera, nhẫn camera, kính camera, máy quét lỗi, máy dò nhiệt, máy dò hồng ngoại, thiết bị nghe lén điện thoại, máy ghi âm thẻ, USB ngụy trang, thẻ nhớ bí mật, ví tài liệu mật, phong bì chống nước, hộp dấu vân tay, máy quét DNA giả lập, thiết bị định vị xe, thiết bị theo dõi chìa khóa, drone gián điệp côn trùng, robot gián điệp mini, máy phát Wi-Fi bí mật, máy phá mã mini.

### Lễ hội

- **97–120:** đèn lồng hoa sen, đèn lồng cá chép, đèn lồng ngôi sao, đầu rồng múa hội, trống lân, quạt múa, cờ lễ hội, vòng nguyệt quế mùa đông, chuông gió lễ hội, bánh quy Noel, bánh fruitcake, ngôi nhà gừng, cây kẹo mút Noel, vớ treo quà, xe tuần lộc, mũ tốt nghiệp, bằng khen trống, pháo giấy kim tuyến, bóng bay số, bánh cupcake Halloween, mặt nạ ma, lồng đèn ma, trứng Phục Sinh sơn màu, giỏ hoa mùa xuân.

