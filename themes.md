# Kế hoạch asset chủ đề

Ghi chú dự kiến / backlog: Nấm, cây mọng nước, các loại hạt, phone.

Tài liệu này là nguồn theo dõi duy nhất cho toàn bộ chủ đề thẻ trong game. Mục tiêu là định hình phong cách đồng bộ, tránh lặp đối tượng giữa các chủ đề ảnh, lưu prompt chuẩn hóa 6 quy tắc và kiểm tra nhanh tiến độ.

## Quy ước chung

- **Quy cách lô:** Mỗi lô tạo ảnh gồm 24 thẻ thường khác nhau, xuất ở kích thước 256×256 px. Mục tiêu V2 là **120 ảnh thường cho mỗi chủ đề ảnh**, chia thành 5 lô theo thứ tự: `01–24`, `25–48`, `49–72`, `73–96`, `97–120`. Asset mới dùng tên mô tả ASCII dạng `kebab-case.webp` (ví dụ `red-panda.webp`).
- **Thẻ đặc biệt theo từng lô (Slot 25):** Vì lưới contact sheet vuông 5×5 có tổng cộng 25 ô mà mỗi lô chỉ cần 24 thẻ thường, ô góc dưới bên phải **[5, 5] (slot 25)** được quy hoạch để AI tự do sáng tạo **1 thẻ đặc biệt cho chính lô đó**. Một chủ đề hoàn chỉnh 5 lô sẽ tạo ra **5 thẻ đặc biệt độc đáo**.
- **Lưu trữ thẻ đặc biệt:** Thẻ đặc biệt được lưu trong thư mục con `special/` của từng chủ đề với tên mô tả `kebab-case.webp` (ví dụ `public/assets/images/themes/animals-land/special/golden-horned-lion.webp`). Chúng không thuộc pool 24 thẻ thường của ván chơi tiêu chuẩn và sẵn sàng cho các cơ chế gameplay/sự kiện đặc biệt.
- **Hướng sáng tạo thẻ đặc biệt:** AI tự do sáng tạo thẻ đặc biệt tại ô [5, 5] dựa trên chủ đề của lô đang tạo (sinh vật lai hiếm, phiên bản huyền thoại, tổ hợp độc đáo, chi tiết nạm vàng/ngọc...). Không gán cứng tên đối tượng trong prompt để có thể tái sử dụng prompt cho mọi lô.
- **Quy tắc cắt bắt buộc:** Không chia đều toàn bộ kích thước sheet theo 5 vì phép chia đó bao gồm cả viền ngoài và gutter. Sau khi kiểm tra sheet vuông, xác định riêng biên trái/phải và trên/dưới của 5 ô, cắt đúng nội dung từng ô, rồi mới resize thành WebP 256×256. Không dùng phương pháp cắt theo khung đều 5×5 mà bỏ qua bounding box thực tế của từng icon.
- Không đưa ảnh nguồn vào `public/assets/`. Lưu sheet nguồn ở vị trí tạm/ngoài runtime đã thống nhất khi bắt đầu tạo, rồi kiểm tra trước khi cắt.
- Chỉ đánh dấu **Hoàn thành** sau khi có đủ WebP 256×256 đạt chuẩn và cập nhật `js/themeCatalog.js` / `js/themeAssets.js`.

---

## 6 Quy tắc tạo Prompt chuẩn hóa (Prompt Formulation Rules)

Mọi prompt tạo ảnh trong toàn bộ dự án phải tuân thủ nghiêm ngặt 6 quy tắc sau:

1. **Bố cục Contact Sheet (Layout):**
   - Bắt buộc dạng lưới 5×5 chứa 25 ô độc lập: `A 5x5 contact sheet grid of 25 distinct individual slots...`
   - Khai báo danh sách 24 item thường và chỉ dẫn AI tự do sáng tạo 1 thẻ đặc biệt ở ô `[5, 5]` (slot 25): `...and one special rare legendary or hybrid themed item creatively designed for this theme at slot 25.`
2. **Định hình Phong cách Art (Style & Rendering):**
   - Góc nhìn: Khai báo chuẩn `isometric 3D render style` (góc chiếu Isometric 3D đồng bộ).
   - Định dạng: Thể hiện rõ `stylized game assets` (icon game cách điệu, chi tiết sắc nét, không dùng tả thực).
3. **Màu nền chuẩn Palette (Solid Background Color):**
   - Nền phẳng hoàn toàn, một màu duy nhất chỉ định bằng mã Hex theo đúng Palette của từng nhóm: `centered on solid flat background color [HEX_COLOR]`.
   - Tuyệt đối không chứa hiệu ứng chuyển màu (`no gradients`) hay hoa văn họa tiết (`no patterns`).
4. **Ánh sáng & Bề mặt (Lighting & Material):**
   - Chỉ dẫn ánh sáng chung: `smooth clean lighting, soft drop shadows, high detail, vibrant colors, clean sharp edges`.
   - Bổ sung tính chất bề mặt riêng theo nhóm chủ đề (`[EXTRA_STYLE]`: bóng kim loại, hiệu ứng phát sáng magical, bề mặt gốm/da/gỗ/thủy tinh, chất liệu đất nung/clay toy...).
5. **Quy tắc Ràng buộc / Bắt buộc Loại trừ (Negative Constraints):**
   - Loại bỏ các yếu tố rác: `no text, no borders, no watermark`.
   - Đảm bảo từng item nằm gọn trong ô, không dính hay chồng lấn: `each item fully contained inside its own square cell with generous plain margins and gutters, no overlapping, no items crossing cell boundaries`.
6. **Tỷ lệ Khung ảnh (Aspect Ratio):**
   - Luôn cố định tham số tỉ lệ vuông `--ar 1:1` ở cuối prompt để phục vụ cắt crop tự động 256×256 px.

---

## Palette nền bắt buộc

Mọi prompt lô và ảnh tạo lẻ phải dùng **một nền phẳng duy nhất trong toàn bộ chủ đề**, cùng ánh sáng studio mềm và bóng đổ nhẹ.

| Chủ đề                 | Mã ID                  | Nền chuẩn                     |
| :--------------------- | :--------------------- | :---------------------------- |
| Động vật trên cạn      | `animals-land`         | Kem ấm `#f6f0e5`              |
| Động vật trên không    | `animals-air`          | Xanh trời rất nhạt `#e8f5ff`  |
| Động vật dưới biển     | `animals-sea`          | Xanh nước biển nhạt `#dff4f5` |
| Đồ ăn                  | `foods`                | Đào–kem `#fde4cf`             |
| Đồ uống                | `drinks`               | Đào–kem `#fde4cf`             |
| Trái cây               | `fruits`               | Vàng kem `#fff1dc`            |
| Rau củ                 | `vegetables`           | Xanh kem `#eef6df`            |
| Thiên nhiên            | `nature`               | Xanh trời nhạt `#d8edf0`      |
| Hoa                    | `flowers`              | Xanh mint `#eef7ef`           |
| Cây                    | `trees`                | Xanh lá sương `#e8f4e5`       |
| Lá                     | `leaves`               | Xanh ngọc nhạt `#edf8ef`      |
| Hình học               | `geometry`             | Kem pastel `#f8f3e8`          |
| Cyberpunk              | `cyberpunk`            | Navy đậm `#02051b`            |
| RPG phép thuật         | `magic-rpg`            | Indigo đậm `#0b0b32`          |
| Vũ trụ                 | `space`                | Xanh đêm `#020819`            |
| Vật dụng gia đình      | `household`            | Kem ấm `#fff6e7`              |
| Đồ dùng văn phòng      | `office-supplies`      | Xanh trắng `#f4faff`          |
| Dụng cụ làm vườn       | `garden-tools`         | Xanh lá nhạt `#edf8d2`        |
| Thời trang & phụ kiện  | `fashion`              | Hồng nhạt `#fff0f5`           |
| Phương tiện giao thông | `vehicles`             | Xanh trời `#e5f5ff`           |
| Cổ vật lịch sử         | `historical-artifacts` | Xanh đen `#031126`            |
| Thiết bị gián điệp     | `spy-gadgets`          | Xanh xám đậm `#101927`        |
| Lễ hội                 | `festivals`            | Kem vàng `#fff5dc`            |
| Nhạc cụ                | `instruments`          | Tím lavender nhạt `#f2e8ff`   |
| Huyền bí               | `mystery`              | Tím đêm `#17112d`             |

---

## Bảng tiến độ

| ID                     | Chủ đề                 | Loại        | Trạng thái   |    Đã tạo | Chi tiết                                            |
| :--------------------- | :--------------------- | :---------- | :----------- | --------: | :-------------------------------------------------- |
| `default`              | Mặc định               | Ảnh WebP    | Hoàn thành   | 1000/1000 | [Chi tiết](#mặc-định-default)                       |
| `animals-land`         | Động vật trên cạn      | Ảnh WebP    | Sắp có       |     0/120 | [Chi tiết](#1-động-vật-trên-cạn-animals-land)       |
| `animals-air`          | Động vật trên không    | Ảnh WebP    | Sắp có       |     0/120 | [Chi tiết](#2-động-vật-trên-không-animals-air)      |
| `animals-sea`          | Động vật dưới biển     | Ảnh WebP    | Sắp có       |     0/120 | [Chi tiết](#3-động-vật-dưới-biển-animals-sea)       |
| `foods`                | Đồ ăn                  | Ảnh WebP    | Đang mở rộng |    39/120 | [Chi tiết](#4-đồ-ăn-foods)                          |
| `drinks`               | Đồ uống                | Ảnh WebP    | Đang mở rộng |    24/120 | [Chi tiết](#5-đồ-uống-drinks)                       |
| `fruits`               | Trái cây               | Ảnh WebP    | Đang mở rộng |     6/120 | [Chi tiết](#6-trái-cây-fruits)                      |
| `vegetables`           | Rau củ                 | Ảnh WebP    | Đang mở rộng |     3/120 | [Chi tiết](#7-rau-củ-vegetables)                    |
| `nature`               | Thiên nhiên            | Ảnh WebP    | Đang mở rộng |    48/120 | [Chi tiết](#8-thiên-nhiên-nature)                   |
| `flowers`              | Hoa                    | Ảnh WebP    | Đang mở rộng |    36/120 | [Chi tiết](#9-hoa-flowers)                          |
| `trees`                | Cây                    | Ảnh WebP    | Sắp có       |     4/120 | [Chi tiết](#10-cây-trees)                           |
| `leaves`               | Lá                     | Ảnh WebP    | Sắp có       |     5/120 | [Chi tiết](#11-lá-leaves)                           |
| `geometry`             | Hình học               | Ảnh WebP    | Đang mở rộng |    48/120 | [Chi tiết](#12-hình-học-geometry)                   |
| `cyberpunk`            | Cyberpunk              | Ảnh WebP    | Đang mở rộng |    48/120 | [Chi tiết](#13-cyberpunk-cyberpunk)                 |
| `magic-rpg`            | RPG phép thuật         | Ảnh WebP    | Đang mở rộng |    48/120 | [Chi tiết](#14-rpg-phép-thuật-magic-rpg)            |
| `space`                | Vũ trụ                 | Ảnh WebP    | Đang mở rộng |    48/120 | [Chi tiết](#15-vũ-trụ-space)                        |
| `household`            | Vật dụng gia đình      | Ảnh WebP    | Đang mở rộng |    48/120 | [Chi tiết](#16-vật-dụng-gia-đình-household)         |
| `office-supplies`      | Đồ dùng văn phòng      | Ảnh WebP    | Đang mở rộng |    48/120 | [Chi tiết](#17-đồ-dùng-văn-phòng-office-supplies)   |
| `garden-tools`         | Dụng cụ làm vườn       | Ảnh WebP    | Đang mở rộng |    41/120 | [Chi tiết](#18-dụng-cụ-làm-vườn-garden-tools)       |
| `fashion`              | Thời trang & phụ kiện  | Ảnh WebP    | Đang mở rộng |    48/120 | [Chi tiết](#19-thời-trang--phụ-kiện-fashion)        |
| `vehicles`             | Phương tiện giao thông | Ảnh WebP    | Đang mở rộng |    48/120 | [Chi tiết](#20-phương-tiện-giao-thông-vehicles)     |
| `historical-artifacts` | Cổ vật lịch sử         | Ảnh WebP    | Đang mở rộng |    29/120 | [Chi tiết](#21-cổ-vật-lịch-sử-historical-artifacts) |
| `spy-gadgets`          | Thiết bị gián điệp     | Ảnh WebP    | Đang mở rộng |    19/120 | [Chi tiết](#22-thiết-bị-gián-điệp-spy-gadgets)      |
| `festivals`            | Lễ hội                 | Ảnh WebP    | Đang mở rộng |    48/120 | [Chi tiết](#23-lễ-hội-festivals)                    |
| `instruments`          | Nhạc cụ                | Ảnh WebP    | Sắp có       |     0/120 | [Chi tiết](#24-nhạc-cụ-instruments)                 |
| `mystery`              | Huyền bí               | Ảnh WebP    | Sắp có       |     0/120 | [Chi tiết](#25-huyền-bí-mystery)                    |
| `alphabet`             | Chữ cái                | SVG sinh mã | Hoàn thành   |     26/26 | [Chi tiết](#chữ-cái-alphabet)                       |
| `numbers-2`            | 2 Số                   | SVG sinh mã | Hoàn thành   |     90/90 | [Chi tiết](#2-số-numbers-2)                         |
| `numbers-3`            | 3 Số                   | SVG sinh mã | Hoàn thành   |   900/900 | [Chi tiết](#3-số-numbers-3)                         |
| `computer-symbols`     | Ký hiệu máy tính       | SVG sinh mã | Hoàn thành   |     30/30 | [Chi tiết](#ký-hiệu-máy-tính-computer-symbols)      |

---

## Phân loại chuẩn V2 và ranh giới chống trùng lặp

Roadmap V2 chuẩn hóa **25 chủ đề ảnh**:

- `animals-sea`: giữ các loài sống chủ yếu trên biển hoặc ven bờ (chim cánh cụt, hải cẩu, rùa biển, cá, san hô, giáp xác, động vật có vú thân biển). Không đưa ếch, nhái, rắn, cá sông hoặc các loài sống chủ yếu trên cạn.
- `animals-land`: dành cho ếch, nhái, kỳ nhông, rùa cạn, thú cạn, bò sát trên đất, côn trùng/bọ sống chủ yếu trên mặt đất. Không đưa chim bay, dơi, bướm bay và sinh vật biển.
- `animals-air`: giữ chim bay, dơi, bướm, côn trùng bay. Không dùng chim cánh cụt, đà điểu, sinh vật biển hoặc vật thể huyền bí.
- `trees`: chỉ gồm cây hoàn chỉnh có thân, tán và gốc/chậu; không đưa lá rời, quả rời, hạt rời, chậu rỗng, giàn cây, dây leo hoặc vật dụng làm vườn.
- `leaves`: chỉ gồm lá đơn, cụm lá, cành lá; không gồm cây nguyên khối, hoa rời hay quả.
- `garden-tools`: chỉ tập trung vào công cụ, vật tư, bình tưới, chậu rỗng, phân bón, hệ thống nước và hạ tầng làm vườn; tuyệt đối không chứa hoa, cây, quả, rau, nấm, vật nuôi hay nhà chim/nhà ong.
- `historical-artifacts`: giữ vật phẩm văn hóa, nghi lễ, đồ cổ và di sản văn minh; không dùng vũ khí hay trang bị chiến đấu.
- `spy-gadgets`: chỉ gồm thiết bị gián điệp, mật mã, định vị, ghi âm, theo dõi, quét, truyền tin và hỗ trợ an ninh; không chứa vũ khí, dao súng, bom.
- `mystery`: dành cho sinh vật thần thoại, cổ tích, cổ vật huyền bí, vật thể siêu nhiên, bí ẩn khoa học/viễn tưởng; không lẫn với đồ thật lịch sử, pháp cụ RPG thường và thiết bị không gian thông thường.

---

# Chi tiết 25 chủ đề ảnh V2

---

### 1. Động vật trên cạn (`animals-land`)

**Prompt chuẩn:**

```text
A 5x5 contact sheet grid of 25 distinct individual slots featuring stylized game assets of land animals in isometric 3D render style: elephant, tiger, lion, rabbit, fox, giant panda, giraffe, monkey, sloth, zebra, hedgehog, alpaca, red panda, beaver, pangolin, tapir, capybara, rhinoceros, hippopotamus, camel, wolf, deer, wild boar, tortoise, and one special rare mythical or hybrid land animal creatively designed for this theme at slot 25. Centered on solid flat background color #f6f0e5, no gradients, no patterns, smooth clean lighting, soft drop shadows, high detail, vibrant colors, clean sharp edges, cute stylized clay toy finish, soft fur textures, charming chibi proportions, no text, no borders, no watermark, each item fully contained inside its own square cell with generous plain margins and gutters, no overlapping, no items crossing cell boundaries --ar 1:1
```

- **Thẻ đặc biệt:** AI tự do sáng tạo 1 thẻ đặc biệt ở ô `[5, 5]` của mỗi lô (lưu vào `special/<slug>.webp`).
- **01–24:** voi, hổ, sư tử, thỏ, cáo, gấu trúc, hươu cao cổ, khỉ, lười, ngựa vằn, nhím, alpaca, gấu mèo đỏ, hải ly, tê tê, heo vòi, capybara, tê giác, hà mã, lạc đà, sói, nai, lợn rừng, rùa cạn.
- **25–48:** báo gêpa, báo hoa mai, báo tuyết, linh miêu, mèo serval, linh cẩu, cầy meerkat, cầy mangut, chồn hôi, chồn ferret, chồn mactet, sói đỏ, cáo Bắc Cực, cáo fennec, chó corgi, chó shiba, chó husky, chó dachshund, mèo Bengal, mèo Maine Coon, mèo Scottish Fold, cừu, dê núi, bò rừng Mỹ.
- **49–72:** bò sữa, trâu nước, ngựa con, lừa, llama, yak, linh dương gazelle, linh dương đầu bò, linh dương saiga, hươu sao, nai sừng tấm, tuần lộc, lợn mini, lợn vòi, chuột lang, chuột hamster, chinchilla, sóc đỏ, marmot, chuột túi, armadillo, thú ăn kiến khổng lồ, kỳ nhông, axolotl.
- **73–96:** tắc kè hoa, kỳ đà, cóc, ếch cây, kỳ giông, rùa hộp, rùa sulcata, thằn lằn gecko, rắn ngô, rắn hổ mang, rắn trăn bóng, iguana xanh, nhện tarantula, bọ cánh cứng tê giác, bọ que, bọ ngựa, bọ rùa, kiến thợ, dế mèn, sâu bướm, nhím gai châu Phi, echidna, aardvark, wombat.
- **97–120:** koala con, quokka, possum, kangaroo, wallaby, badger, wolverine, marten, sable, civet, genet, binturong, coati, kinkajou, peccary, tapir Brazil, babirusa, okapi, bongos, oryx, kudu, ibex, markhor, pronghorn.

---

### 2. Động vật trên không (`animals-air`)

**Prompt chuẩn:**

```text
A 5x5 contact sheet grid of 25 distinct individual slots featuring stylized game assets of aerial animals and birds in isometric 3D render style: eagle, owl, macaw parrot, toucan, peacock, flamingo, swallow, kingfisher, hummingbird, bat, butterfly, dragonfly, bumblebee, hornbill, sparrow, pigeon, seagull, pelican, parakeet, falcon, golden eagle, snowy owl, flying ladybug, vulture, and one special rare mythical or legendary flying bird or insect creatively designed for this theme at slot 25. Centered on solid flat background color #e8f5ff, no gradients, no patterns, smooth clean lighting, soft drop shadows, high detail, vibrant colors, clean sharp edges, cute stylized clay toy finish, smooth feather and wing details, charming chibi proportions, no text, no borders, no watermark, each item fully contained inside its own square cell with generous plain margins and gutters, no overlapping, no items crossing cell boundaries --ar 1:1
```

- **Thẻ đặc biệt:** AI tự do sáng tạo 1 thẻ đặc biệt ở ô `[5, 5]` của mỗi lô (lưu vào `special/<slug>.webp`).
- **01–24:** đại bàng, cú mèo, vẹt macaw, chim toucan, chim công, chim hồng hạc, chim én, chim bói cá, chim ruồi, dơi, bướm, chuồn chuồn, ong nghệ, chim hồng hoàng, chim sẻ, chim bồ câu, chim hải âu, chim bồ nông, chim két, chim cắt, đại bàng vàng, cú tuyết, bọ cánh cam bay, kền kền.
- **25–48:** chim condor, chim hải âu albatross, chim choi choi, chim cu gáy, chim sáo, chim chích chòe, chim họa mi, chim yến, chim bìm bịp, chim cuốc, chim bói cá lửa, chim gõ kiến, chim đầu rìu, chim sáo đá, chim sẻ vàng, chim sẻ đỏ, chim hút mật, chim sâu, chim trĩ vàng, chim trĩ bạc, chim thiên nga bay, ngỗng trời, vịt trời, cò trắng.
- **49–72:** diệc xám, cò quăm, hạc vương miện, sếu đầu đỏ, chim secretary, chim osprey, chim ưng peregrine, diều hâu đỏ đuôi, chim én biển, chim puffin, chim cốc bay, chim mòng biển, chim nhạn, chim waxwing, chim cardinal, chim blue jay, chim robin, chim finch, chim canary, chim lovebird, cockatiel, chim cockatoo, chim lorikeet, chim sun conure.
- **73–96:** dơi tai dài, dơi quỷ, dơi ăn quả, dơi ma cà rồng, cáo bay, ong mật, ong bắp cày, ong ký sinh, ruồi chuồn, ruồi cánh hoa, muỗi hạc, bướm monarch, bướm xanh morpho, bướm đuôi én, bướm đêm luna, bướm đêm atlas, chuồn chuồn kim, chuồn chuồn ngô, ve sầu bay, bọ cánh cứng ánh kim, bọ xít cánh, bọ ngựa phong lan, châu chấu cánh xanh, cào cào sa mạc.
- **97–120:** chim ruồi ruby, chim ruồi anna, chim ruồi đuôi nhọn, chim bói cá châu Âu, chim công lam, chim toucan mỏ cầu vồng, vẹt xám châu Phi, vẹt eclectus, vẹt cockatoo mào vàng, đại bàng hói, đại bàng biển, cú đại bàng, cú barn, cú tai ngắn, chim kền kền đen, chim frigate, chim nhiệt đới đuôi đỏ, chim sẻ nhà, chim bồ câu đốm, chim cu cu, chim hoopoe, chim roller, chim bee-eater, chim jacana bay.

---

### 3. Động vật dưới biển (`animals-sea`)

**Prompt chuẩn:**

```text
A 5x5 contact sheet grid of 25 distinct individual slots featuring stylized game assets of sea creatures in isometric 3D render style: dolphin, seal, penguin, sea turtle, beluga whale, seahorse, octopus, squid, jellyfish, stingray, whale shark, clownfish, pufferfish, swordfish, hermit crab, lobster, starfish, sea urchin, abalone, sea cucumber, sea otter, manatee, narwhal, brain coral, and one special rare glowing or mythical sea creature creatively designed for this theme at slot 25. Centered on solid flat background color #dff4f5, no gradients, no patterns, smooth clean lighting, soft drop shadows, high detail, vibrant colors, clean sharp edges, cute stylized clay toy finish, smooth glossy aquatic textures, charming chibi proportions, no text, no borders, no watermark, each item fully contained inside its own square cell with generous plain margins and gutters, no overlapping, no items crossing cell boundaries --ar 1:1
```

- **Thẻ đặc biệt:** AI tự do sáng tạo 1 thẻ đặc biệt ở ô `[5, 5]` của mỗi lô (lưu vào `special/<slug>.webp`).
- **01–24:** cá heo, hải cẩu, chim cánh cụt, rùa biển, cá voi beluga, cá ngựa, bạch tuộc, mực ống, sứa, cá đuối, cá mập voi, cá hề, cá nóc, cá kiếm, cua ẩn sĩ, tôm hùm, sao biển, nhím biển, bào ngư, hải sâm, rái cá biển, lợn biển, narwhal, san hô não.
- **25–48:** cá mập đầu búa, cá mập rạn san hô, cá mập hổ, cá voi xanh, cá voi lưng gù, cá nhà táng, cá heo mũi chai, cá heo đốm, orca, cá voi đầu bò, cá heo mũi dài, dugong, hải mã, sư tử biển, hải cẩu lông, rùa da, rùa xanh, cá đuối manta, cá đuối gai độc, cá cờ, cá buồm, cá ngừ vây xanh, cá mahi-mahi.
- **49–72:** cá hề cam, cá tang xanh, cá bướm vàng, cá thiên thần hoàng đế, cá nóc gai, cá sư tử, cá ngựa vằn, cá chình moray, cá chình điện, cá mú khổng lồ, cá đuối đại bàng, cá đèn lồng, cá vây tay, cá rồng biển lá, cá rồng biển cỏ, cá bò da, cá mú sọc, cá chim, cá trích, cá mòi, cá thu, cá mập mako, cá mập y tá, cá mập goblin.
- **73–96:** bạch tuộc vòng xanh, bạch tuộc khổng lồ Thái Bình Dương, mực khổng lồ, mực ma cà rồng, mực nang, sứa mặt trăng, sứa bờm sư tử, sứa hộp, hải miên, sao biển hướng dương, sao biển giòn, nhím biển tím, cầu gai, san hô bàn, san hô quạt, san hô nhánh, hải quỳ, hàu ngọc trai, sò điệp, ốc vòi voi, trai khổng lồ, cua nhện Nhật, cua xanh, cua hoàng đế.
- **97–120:** tôm hùm gai, tôm hùm Mỹ, tôm tít, tôm sú, tôm hề, cua ẩn sĩ, cua móng ngựa, ốc nautilus, ốc sên biển, sên biển nudibranch, rồng biển đỏ, hải long, cá đuối điện, cá bơn, cá sole, chim cánh cụt hoàng đế, cá voi sát thủ, cá heo Risso, cá voi pilot, hải cẩu báo, hải cẩu voi, rùa hawksbill, cá mập thresher, cá đèn pin.

---

### 4. Đồ ăn (`foods`)

**Prompt chuẩn:**

```text
A 5x5 contact sheet grid of 25 distinct individual slots featuring stylized game assets of delicious dishes and food in isometric 3D render style: banh mi, pho bowl, bun bo hue, crispy banh xeo, fresh spring rolls, fried spring rolls, com tam broken rice, nem ran, steamed bun, ha cao dumplings, savory sticky rice, banh cuon steamed rolls, dim sum basket, sushi platter, ramen bowl, udon bowl, onigiri rice ball, kimbap roll, bibimbap stone bowl, slice of pizza, cheeseburger, taco, burrito, buttery croissant, and one special rare culinary masterpiece or royal gourmet dish creatively designed for this theme at slot 25. Centered on solid flat background color #fde4cf, no gradients, no patterns, smooth clean lighting, soft drop shadows, high detail, vibrant colors, clean sharp edges, cute stylized clay food toy finish, delicious glossy glaze, appetizing pastel details, no text, no borders, no watermark, each item fully contained inside its own square cell with generous plain margins and gutters, no overlapping, no items crossing cell boundaries --ar 1:1
```

- **Thẻ đặc biệt:** AI tự do sáng tạo 1 thẻ đặc biệt ở ô `[5, 5]` của mỗi lô (lưu vào `special/<slug>.webp`).
- **01–24:** bánh mì, phở, bún bò, bánh xèo, gỏi cuốn, chả giò, cơm tấm, nem rán, bánh bao, há cảo, xôi mặn, bánh cuốn, dim sum, sushi, ramen, udon, onigiri, kimbap, bibimbap, pizza, cheeseburger, taco, burrito, croissant.
- **25–48:** donut, cupcake, french-fries, hot-dog, pancakes, pretzel, paella, risotto, quesadilla, salad, cheese-wedge, chicken-drumstick, ice-cream-cone, mì spaghetti, lasagna, sandwich, bagel, bánh waffle, bánh churros, súp bí đỏ, bò bít tết, gà quay, bánh crepe, bánh tart trứng.
- **49–72:** bún chả, hủ tiếu, mì hoành thánh, mì quảng, bánh bèo, bánh bột lọc, bánh khọt, bánh canh cua, cháo sườn, cơm chiên dương châu, lẩu thái, bò kho, vịt quay Bắc Kinh, tempura, takoyaki, gyoza, yakitori, tonkatsu, pad Thái, tom yum, curry Ấn Độ, gà tikka masala, bánh naan, bánh samosa.
- **73–96:** bánh taco giòn, bánh nacho phô mai, bánh quesadilla gà, bánh empanada, xúc xích Đức bratwurst, súp hành tây Pháp, bánh quiche Lorraine, cơm risotto nấm, mì pasta sốt pesto, mì ravioli, súp kem nấm, bánh focaccia, bánh bao xá xíu, há cảo tôm, bánh tart trái cây, bánh tiramisu, bánh panna cotta, bánh churro socola, bánh pudding caramel, phô mai que chiên, mực khoanh chiên, cá hồi áp chảo, tôm nướng bơ tỏi, sò điệp áp chảo.
- **97–120:** bánh macaron, bánh éclair socola, bánh souffle phô mai, bánh crepe kem dâu, bánh mille-feuille, súp goulash, súp borscht, bánh shepherd's pie, cá chiên khoai tây fish & chips, bánh pie thịt bò, xúc xích chorizo nướng, cơm paella hải sản, mì yakisoba, cơm lươn unadon, cơm cà ri Nhật, bánh xèo Nhật okonomiyaki, chả cua nướng, thịt xiên satay, súp laksa, bánh bao kim sa, bánh xốp quế waffle dâu, súp lơ nướng phô mai, bánh mì nướng bơ tỏi, trứng ốp la xúc xích.

---

### 5. Đồ uống (`drinks`)

**Prompt chuẩn:**

```text
A 5x5 contact sheet grid of 25 distinct individual slots featuring stylized game assets of cute beverages in isometric 3D render style: boba milk tea, strawberry milkshake, fresh coconut water, matcha latte, hot cocoa with marshmallow, cafe latte, cappuccino, espresso cup, lemonade glass, fresh orange juice, mango smoothie, blueberry soda, glass of kombucha, peach iced tea, black iced tea, spiced chai latte, sparkling soda can, grape juice, apple juice, watermelon juice, soy milk bottle, herbal flower tea, warm ginger tea, hot milk mug, and one special rare luxury or magical beverage mocktail creatively designed for this theme at slot 25. Centered on solid flat background color #fde4cf, no gradients, no patterns, smooth clean lighting, soft drop shadows, high detail, vibrant colors, clean sharp edges, cute stylized clay drink toy finish, glossy glass and ceramic surfaces, refreshing liquid transparency, no text, no borders, no watermark, each item fully contained inside its own square cell with generous plain margins and gutters, no overlapping, no items crossing cell boundaries --ar 1:1
```

- **Thẻ đặc biệt:** AI tự do sáng tạo 1 thẻ đặc biệt ở ô `[5, 5]` của mỗi lô (lưu vào `special/<slug>.webp`).
- **01–24:** trà sữa, sữa lắc dâu, nước dừa, matcha latte, cacao nóng, café latte, cappuccino, espresso, nước chanh, nước cam, sinh tố xoài, soda việt quất, kombucha, trà đào đá, trà đen đá, chai latte, nước có ga, nước nho, nước táo, nước ép dưa hấu, sữa đậu nành, trà thảo mộc, trà gừng, sữa nóng.
- **25–48:** soda chanh, soda dâu, soda đào, soda táo, soda nho, nước ép lựu, nước ép ổi, nước ép cà rốt, nước ép cà chua, nước ép dừa, sinh tố chuối, sinh tố bơ, sinh tố dâu, sinh tố đào, sinh tố kiwi, sữa nghệ, sữa hạnh nhân, sữa yến mạch, sữa gạo, sữa chua uống, cold brew, americano, mocha, macchiato.
- **49–72:** flat white, affogato, trà xanh, trà nhài, trà hoa cúc, trà bạc hà, trà hibiscus, trà chanh mật ong, trà sữa khoai môn, trà sữa matcha, trà sữa socola, trà ô long, trà Earl Grey, trà Darjeeling, nước tonic, ginger ale, root beer, cola, nước khoáng, nước điện giải, nước mía, nước sâm, nước gạo lứt, nước đậu đen.
- **73–96:** sữa bắp, sữa mè đen, cacao đá, cà phê sữa đá, cà phê trứng, cà phê dừa, espresso tonic, nước ép dứa, nước ép bưởi, nước ép thanh long, nước ép cần tây, nước ép củ dền, sinh tố việt quất, sinh tố mâm xôi, sinh tố chanh dây, lassi xoài, lassi dâu, kefir, kvass, trà kombucha gừng, trà đào cam sả, trà vải, trà táo quế, trà ô mai.
- **97–120:** trà rooibos, trà pu-erh, trà masala chai, trà yuzu, trà hương thảo, trà bưởi xanh, trà hoa đậu biếc, trà yến mạch khô, trà nấm dược liệu, boza, tepache, switchel, shrub giấm trái cây, nước nha đam, nước rau má, nước bột sắn, nước mía tươi, soda dưa chuột, soda bạc hà, soda hoa cúc, sữa hạt hạnh nhân, sữa hạt điều, sữa hạt bí, sữa đậu xanh.

---

### 6. Trái cây (`fruits`)

**Prompt chuẩn:**

```text
A 5x5 contact sheet grid of 25 distinct individual slots featuring stylized game assets of fresh fruits in isometric 3D render style: red apple, green apple, banana bunch, whole orange, tangerine, yellow lemon, green lime, grapefruit, green pear, juicy peach, purple plum, sweet apricot, red cherries, strawberry, blueberries, red raspberries, blackberries, grape bunch, watermelon slice, cantaloupe melon, pineapple, mango, papaya, whole coconut, and one special rare glowing or unique hybrid fruit creatively designed for this theme at slot 25. Centered on solid flat background color #fff1dc, no gradients, no patterns, smooth clean lighting, soft drop shadows, high detail, vibrant colors, clean sharp edges, cute stylized clay fruit toy finish, plump juicy surfaces, vibrant natural fruit textures, no text, no borders, no watermark, each item fully contained inside its own square cell with generous plain margins and gutters, no overlapping, no items crossing cell boundaries --ar 1:1
```

- **Thẻ đặc biệt:** AI tự do sáng tạo 1 thẻ đặc biệt ở ô `[5, 5]` của mỗi lô (lưu vào `special/<slug>.webp`).
- **01–24:** táo đỏ, táo xanh, chuối, cam, quýt, chanh vàng, chanh xanh, bưởi, lê, đào, mận, mơ, cherry, dâu tây, việt quất, mâm xôi đỏ, mâm xôi đen, nho, dưa hấu, dưa lưới, dứa, xoài, đu đủ, dừa.
- **25–48:** kiwi, chanh dây, thanh long, lựu, sung, ổi, vải, chôm chôm, nhãn, sầu riêng, mít, khế, hồng, bơ, me, quất, xuân đào, lý gai, nam việt quất, dâu tằm, chà là, mãng cầu, sapoche, măng cụt.
- **49–72:** salak, langsat, sa kê, mộc qua, xương rồng lê gai, tamarillo, dâu tằm đen, dâu tây rừng, lý chua đỏ, lý chua đen, việt quất rừng, acai, yuzu, calamansi, cam đỏ, chanh ngón tay, feijoa, tỳ bà, táo tàu, bael, canistel, cherimoya, na, lê Nashi.
- **73–96:** táo gai, mận damson, mận mirabelle, mận greengage, chokeberry, serviceberry, thanh lương trà, hắc mai biển, miracle fruit, jabuticaba, santol, cóc, cóc Thái, táo nước, mận nước, pomelo ugli, hồng xiêm đen, quả mơ rừng, quả bael, quả bứa, quả sơn tra, quả chùm ruột, quả dứa rừng, quả ổi hồng.
- **97–120:** quả ackee, quả lucuma, quả mangaba, quả marula, quả nance, quả yumberry, quả cloudberry, quả huckleberry, quả elderberry, quả boysenberry, quả loganberry, quả tayberry, quả dewberry, quả salmonberry, quả thimbleberry, quả dâu da, quả trâm, quả sim, quả dọc, quả bòn bon, quả hồng bì, quả nhàu, quả hồng quân, quả gấc.

---

### 7. Rau củ (`vegetables`)

**Prompt chuẩn:**

```text
A 5x5 contact sheet grid of 25 distinct individual slots featuring stylized game assets of vegetables in isometric 3D render style: carrot, red tomato, pumpkin, brown potato, sweet potato, yellow onion, garlic bulb, red shallot, ginger root, red radish, white daikon radish, beetroot, turnip, parsnip, cassava root, taro root, purple yam, burdock root, lotus root, water chestnut, celery bunch, green cucumber, zucchini, purple eggplant, and one special rare glowing or unique heirloom vegetable variety creatively designed for this theme at slot 25. Centered on solid flat background color #eef6df, no gradients, no patterns, smooth clean lighting, soft drop shadows, high detail, vibrant colors, clean sharp edges, cute stylized clay vegetable toy finish, fresh organic textures, earthy smooth surfaces, no text, no borders, no watermark, each item fully contained inside its own square cell with generous plain margins and gutters, no overlapping, no items crossing cell boundaries --ar 1:1
```

- **Thẻ đặc biệt:** AI tự do sáng tạo 1 thẻ đặc biệt ở ô `[5, 5]` của mỗi lô (lưu vào `special/<slug>.webp`).
- **01–24:** cà rốt, cà chua, bí ngô, khoai tây, khoai lang, hành tây, tỏi, hành tím, gừng, củ cải đỏ, củ cải trắng, củ dền, củ turnip, củ cải vàng, sắn, khoai môn, khoai mỡ, ngưu bàng, củ sen, củ năng, cần tây, dưa leo, bí ngòi, cà tím.
- **25–48:** bông cải xanh, súp lơ trắng, bắp cải, cải thảo, cải xoăn, rau bina, xà lách, cải thìa, rau muống, cải xanh, cải cầu vồng, cải collard, cải Brussels, măng tây, đậu que, đậu Hà Lan tuyết, đậu Hà Lan, đậu nành non, bắp, ớt chuông, ớt đỏ, đậu bắp, atisô, tỏi tây.
- **49–72:** thì là, rau diếp xoăn, radicchio, arugula, cải làn, măng tre, giá đỗ, mầm cỏ linh lăng, khổ qua, bầu, mướp, su su, bí đao, bí spaghetti, bí acorn, bí butternut, bí kabocha, nấm mỡ, nấm đông cô, nấm bào ngư, nấm kim châm, nấm đùi gà, nấm portobello, cải xoong.
- **73–96:** bắp cải tím, xà lách romaine, xà lách iceberg, tatsoi, mizuna, komatsuna, cải chíp, củ cần, su hào, củ đậu, salsify, atisô Jerusalem, dương xỉ non, rong biển, nori, wakame, củ cải đường, củ mài, củ dền hồng, củ cải trắng lớn, cà chua bi, tomatillo, ớt poblano, ớt jalapeño.
- **97–120:** củ wasabi, củ maca, củ yacon, củ konjac, củ oca, củ ulluco, củ mashua, đậu lima, đậu fava, đậu lăng xanh, đậu gà tươi, đậu lupin, đậu đũa tím, đậu đen, rau dền, rau sam, rau đay, rau tần ô, rau escarole, rau endive, ớt habanero, ớt serrano, ớt cayenne, ớt shishito.

---

### 8. Thiên nhiên (`nature`)

**Prompt chuẩn:**

```text
A 5x5 contact sheet grid of 25 distinct individual slots featuring stylized game assets of nature landscapes and weather icons in isometric 3D render style: forested hill, winding river, fluffy white cloud, rain cloud with drops, golden lightning bolt, crystal snowflake, desert sand dune, tropical island with palm, vibrant coral reef, floating iceberg, stone cave entrance, bubbling geyser, northern lights aurora, rocky mountain peak, arched rainbow, erupting mini volcano, mountain waterfall, crescent moon with stars, shining sun, snowy pine tree, ocean seashell, orange starfish, glacial ice peak, waterfall pool diorama, and one special rare glowing crystal nature wonder or floating island diorama creatively designed for this theme at slot 25. Centered on solid flat background color #d8edf0, no gradients, no patterns, smooth clean lighting, soft drop shadows, high detail, vibrant colors, clean sharp edges, cute stylized miniature terrain dioramas, clay toy aesthetic, pristine natural landscapes, no text, no borders, no watermark, each item fully contained inside its own square cell with generous plain margins and gutters, no overlapping, no items crossing cell boundaries --ar 1:1
```

- **Thẻ đặc biệt:** AI tự do sáng tạo 1 thẻ đặc biệt ở ô `[5, 5]` của mỗi lô (lưu vào `special/<slug>.webp`).
- **01–24:** đồi rừng, sông, mây, mây mưa, tia sét, bông tuyết, cồn cát, đảo nhiệt đới, rạn san hô, tảng băng, hang động, mạch nước phun, cực quang, núi đá, cầu vồng, núi lửa, thác nước, Mặt Trăng, Mặt Trời, cây thông, vỏ sò, sao biển, núi băng trôi, thác nước hồ.
- **25–48:** núi đá vôi, đỉnh núi tuyết, hẻm núi, suối nhỏ, hồ băng, đầm sen, bãi cát, măng đá, đảo nhỏ, vịnh biển, vách đá, đồng cỏ, thảo nguyên, rừng thông, rừng tre, rừng ngập mặn, đầm lầy, ruộng bậc thang, cánh đồng lúa, đồi chè, đầm phá xanh, vịnh hẹp, cồn cát sao, đồng cỏ hoa dại.
- **49–72:** mây cumulus, mây giông, giọt mưa, mưa đá, xoáy nước, sóng biển, sóng thần cách điệu, lốc xoáy, cầu băng, hoàng hôn, bình minh, nhật thực, nguyệt thực, sao băng, chòm sao, tinh thể băng, lá phong mùa thu, quả thông, tảng băng trôi lớn, băng hà xanh, mây lenticular, sét bóng, mưa sao băng, nguyệt thực toàn phần.
- **73–96:** viên cuội nhiều màu, đá geode, hóa thạch ammonite, tổ ong tự nhiên, mạng nhện đẫm sương, nấm rừng, địa y, rêu xanh, cỏ bốn lá, hạt bồ công anh bay, cành san hô, ngọc trai trong vỏ, hoa tuyết, giọt sương, luồng gió xoáy, tia nắng xuyên mây, mây sương, lửa trại, nhánh sông uốn lượn, cánh đồng oải hương, đồi cỏ hồng, rừng sương mù, rừng lá đỏ, sa mạc đá.
- **97–120:** đỉnh núi đá, thung lũng sương, hồ núi lửa, hang băng, cột đá bazan, đá cân bằng, đồng muối, thác băng, suối nước nóng, bãi biển đá cuội, bờ biển vỏ sò, hẻm núi đỏ, bãi băng trôi, hố sụt thiên nhiên, mạch nước ngầm, cồn cát đỏ, đảo san hô vòng, rừng cổ thụ, cây cô đơn, vòm đá tự nhiên, mạch suối khoáng, thung lũng hoa dại, hồ nước mặn, hẻm núi băng.

---

### 9. Hoa (`flowers`)

**Prompt chuẩn:**

```text
A 5x5 contact sheet grid of 25 distinct individual slots featuring stylized game assets of blooming flowers in isometric 3D render style: blue bellflower, cherry blossom twig, white daisy, yellow dandelion, flowering cactus, red poppy blossom, red spider lily, carnation bloom, blue hydrangea cluster, purple bellflower, white chrysanthemum, petunia flower, gardenia flower, purple iris, velvety red rose, yellow sunflower, pink moth orchid, white calla lily, buttercup blossom, blooming peony, white magnolia, star jasmine, lavender bundle, pansy blossom, and one special rare glowing crystal or magical flower blossom creatively designed for this theme at slot 25. Centered on solid flat background color #eef7ef, no gradients, no patterns, smooth clean lighting, soft drop shadows, high detail, vibrant colors, clean sharp edges, cute stylized clay botanical toy finish, velvety flower petals, delicate vibrant blossoms, no text, no borders, no watermark, each item fully contained inside its own square cell with generous plain margins and gutters, no overlapping, no items crossing cell boundaries --ar 1:1
```

- **Thẻ đặc biệt:** AI tự do sáng tạo 1 thẻ đặc biệt ở ô `[5, 5]` của mỗi lô (lưu vào `special/<slug>.webp`).
- **01–24:** hoa chuông, hoa anh đào, hoa cúc, bồ công anh, xương rồng nở hoa, hoa anh túc, hoa bỉ ngạn, hoa cẩm chướng, hoa cẩm tú cầu, hoa chuông tím, hoa cúc trắng, hoa dạ yến thảo, hoa dành dành, hoa diên vĩ, hoa hồng đỏ, hoa hướng dương, lan hồ điệp, hoa loa kèn, hoa mao lương, hoa mẫu đơn, hoa mộc lan, hoa nhài, hoa oải hương, pansy.
- **25–48:** hoa ngọc lan, hoa bìm bìm, hoa camellia, hoa phlox, hoa poppy, hoa alstroemeria, hoa lavender, hoa chuông tuyết, hoa lily trắng, hoa daisy, hoa camomile, hoa bellflower, hoa cúc đỏ nắng, hoa lục bình, hoa cúc dại, hoa hải đường, hoa mộc hương, hoa dạ hương, hoa cúc đồng tiền, hoa cẩm tú cầu trắng, hoa mười giờ tím, hoa thạch thảo, hoa hồng phấn, hoa cúc rực.
- **49–72:** hoa thanh tú, hoa salvia, hoa verbena, hoa zinnia, hoa cosmos, hoa cúc vạn thọ, hoa cẩm chướng mini, hoa dừa cạn, hoa mười giờ, hoa sen, hoa súng, hoa mai, hoa đào, hoa mận, hoa táo, hoa lê, hoa tử đằng, hoa tử đinh hương, hoa đỗ quyên, hoa trà my, hoa hồng trà, hoa lan vũ nữ, hoa lan dendrobium, hoa lan cymbidium.
- **73–96:** hoa thiên điểu, hoa chuối cảnh, hoa protea, hoa milkweed, hoa lupine, hoa scabiosa, hoa foxglove, hoa lục bình ngọc, hoa sweet pea, hoa sunflower mini, hoa hạc đính, hoa iris Nhật, hoa tulip sọc, hoa hồng leo, hoa hồng sa mạc, hoa mẫu đơn trắng, hoa cúc xanh, hoa lavender trắng, hoa dạ lan hương, hoa lili bông, hoa phi yến, hoa loa kèn đỏ, hoa lan hồ điệp trắng, hoa cẩm tú cầu tím.
- **97–120:** hoa hồng vàng, hoa hồng cam, hoa hồng tím, hoa tulip đen, hoa tulip kép, hoa lan cattleya, hoa lan mokara, hoa lan vanda, hoa cúc đồng tiền hồng, hoa cúc đồng tiền cam, hoa dâm bụt đỏ, hoa dâm bụt vàng, hoa giấy hồng, hoa giấy tím, hoa cẩm chướng đỏ, hoa mao lương trắng, hoa mẫu đơn hồng, hoa sen hồng, hoa súng tím, hoa tử đằng trắng, hoa đỗ quyên đỏ, hoa cát cánh, hoa lưu ly, hoa thạch nam.

---

### 10. Cây (`trees`)

**Prompt chuẩn:**

```text
A 5x5 contact sheet grid of 25 distinct individual slots featuring stylized game assets of complete trees in isometric 3D render style: grand oak tree, autumn maple tree, evergreen pine tree, cypress tree, weeping willow, white birch tree, baobab tree, coconut palm tree, bamboo stalk clump, banana tree, cacao tree with pods, coffee plant with cherries, olive tree with olives, lemon fruit tree, red apple tree, pink peach blossom tree, banyan tree, weeping fig tree, royal poinciana tree, freshwater mangrove tree, potted ficus bonsai, potted pine bonsai, potted monstera plant, potted snake plant, and one special rare glowing celestial or ancient mythical tree creatively designed for this theme at slot 25. Centered on solid flat background color #e8f4e5, no gradients, no patterns, smooth clean lighting, soft drop shadows, high detail, vibrant colors, clean sharp edges, cute stylized clay miniature trees on grassy bases, lush sculpted foliage, wooden bark textures, no text, no borders, no watermark, each item fully contained inside its own square cell with generous plain margins and gutters, no overlapping, no items crossing cell boundaries --ar 1:1
```

- **Thẻ đặc biệt:** AI tự do sáng tạo 1 thẻ đặc biệt ở ô `[5, 5]` của mỗi lô (lưu vào `special/<slug>.webp`).
- **01–24:** cây sồi, cây phong, cây thông, cây bách, cây liễu, cây bạch dương, cây bao báp, cây cọ, tre, cây chuối, cây cacao, cây cà phê, cây ô liu, cây chanh, cây táo, cây đào, cây đa, cây si, cây phượng, cây lộc vừng, bonsai ficus, bonsai thông, cây monstera, cây lưỡi hổ.
- **25–48:** cây bạch đàn, cây phong đường, cây dẻ, cây du, cây sung, cây mít, cây xoài, cây mận, cây hồng, cây quýt, cây bưởi, cây táo ta, cây hồng xiêm, cây vải, cây nhãn, cây sầu riêng, cây măng cụt, cây khế, cây ổi, cây me, cây điều, cây dừa, cây cao su, cây trà.
- **49–72:** cây tràm, cây đước, cây sú vẹt, cây phi lao, cây tùng, cây vân sam, cây gỗ đỏ, cây tuyết tùng, cây bách xù, cây thủy tùng, cây thông rụng lá, cây bạch quả, cây dương, cây tần bì, cây đoạn, cây linden, cây magnolia, cây long não, cây nguyệt quế, cây mộc lan, cây hoa ban, cây phượng vĩ, cây bằng lăng, cây lim.
- **73–96:** cây sưa, cây sao đen, cây dầu rái, cây keo, cây xoan, cây gạo, cây me tây, cây sanh, cây đa búp đỏ, cây gừa, cây đề, cây trúc mây, cây cau, cây cọ lùn, cây thốt nốt, cây chuối cảnh, cây thiên điểu thân gỗ, cây kim ngân, cây phát tài, cây thiết mộc lan, cây ngọc ngân, cây vạn niên thanh thân, cây tùng la hán, cây mai chiếu thủy.
- **97–120:** bonsai tùng, bonsai sanh, bonsai linh sam, bonsai mai, bonsai nguyệt quế, cây olive già, cây bonsai phong Nhật, cây bonsai lựu, cây bonsai táo, cây bonsai mộc qua, cây sồi đỏ, cây phong Nhật, cây bạch dương giấy, cây liễu rủ, cây bồ đề, cây jacaranda, cây flamboyant, cây đàn hương, cây hạt dẻ, cây cà phê arabica, cây tiêu, cây vanilla, cây chanh dây, cây nho.

---

### 11. Lá (`leaves`)

**Prompt chuẩn:**

```text
A 5x5 contact sheet grid of 25 distinct individual slots featuring stylized game assets of single leaves and botanical sprigs in isometric 3D render style: monstera deliciosa leaf, red maple leaf, golden oak leaf, green fern frond, golden ginkgo biloba leaf, tropical palm frond, silvery olive leaf, laurel bay leaf, mint leaf sprig, basil leaf, rosemary sprig, sage leaf, perilla leaf, curly kale leaf, bamboo leaf cluster, broad banana leaf, pothos ivy leaf, philodendron leaf, calathea striped leaf, fittonia nerve leaf, marble queen leaf, eucalyptus leaf sprig, pine needle cluster, weeping willow twig, and one special rare glowing iridescent or crystal fairy leaf creatively designed for this theme at slot 25. Centered on solid flat background color #edf8ef, no gradients, no patterns, smooth clean lighting, soft drop shadows, high detail, vibrant colors, clean sharp edges, cute stylized clay botanical toy finish, detailed leaf veins, smooth organic textures, no text, no borders, no watermark, each item fully contained inside its own square cell with generous plain margins and gutters, no overlapping, no items crossing cell boundaries --ar 1:1
```

- **Thẻ đặc biệt:** AI tự do sáng tạo 1 thẻ đặc biệt ở ô `[5, 5]` của mỗi lô (lưu vào `special/<slug>.webp`).
- **01–24:** lá monstera, lá phong đỏ, lá sồi, lá dương xỉ, lá bạch quả, lá cọ, lá ô liu, lá nguyệt quế, lá bạc hà, lá húng quế, lá hương thảo, lá xô thơm, lá tía tô, lá cải xoăn, lá tre, lá chuối, lá trầu bà, lá philodendron, lá calathea, lá fittonia, lá pothos, lá bạch đàn, lá thông, cành liễu có lá.
- **25–48:** lá dương xỉ tổ chim, lá dương xỉ bạc, lá bạch đàn tròn, lá bạch đàn dài, lá phong Nhật, lá phong bạc, lá sồi đỏ, lá sồi trắng, lá liễu, lá dâu tằm, lá sung, lá bàng, lá lộc vừng, lá phượng, lá me, lá khế, lá xoài, lá ổi, lá chanh, lá cam, lá bưởi, lá quýt, lá táo, lá đào.
- **49–72:** lá trầu bà vàng, lá trầu bà cẩm thạch, lá philodendron tim, lá philodendron xẻ, lá monstera variegata, lá calathea sọc, lá calathea tròn, lá maranta, lá alocasia, lá môn kiểng, lá ráy, lá lan chi, lá lưỡi hổ, lá ngọc ngân, lá kim tiền, lá vạn niên thanh, lá phát tài, lá thiết mộc lan, lá kim ngân, lá cọ quạt, lá cau, lá dừa, lá thốt nốt, lá chuối cảnh.
- **73–96:** lá húng chanh, lá tarragon, lá oregano, lá thyme, lá dill, lá parsley, lá cilantro, lá tía tô xanh, lá shiso đỏ, lá rau răm, lá ngải cứu, lá trà xanh, lá trà ô long, lá bạc hà chocolate, lá húng lủi, lá hương nhu, lá nguyệt quế khô, lá xô thơm tím, lá húng quế chanh, lá hẹ, lá hành, lá cần tây, lá rau bina, lá cải thìa.
- **97–120:** lá bắp cải tím, lá cải xoăn tím, lá cải cầu vồng, lá xà lách romaine, lá xà lách iceberg, lá arugula, lá cải xoong, lá cải xanh, lá cải thảo, lá bông cải xanh, lá cải Brussels, lá rau muống, lá khoai lang, lá khoai môn, lá sen, lá súng, lá rong biển wakame, lá nori, lá tảo bẹ, lá bạch đàn bạc, lá tùng, lá bách, lá cỏ bốn lá, cành ô liu có lá.

---

### 12. Hình học (`geometry`)

**Prompt chuẩn:**

```text
A 5x5 contact sheet grid of 25 distinct individual slots featuring stylized game assets of 3D geometric shapes in isometric 3D render style: cube, sphere, cylinder, cone, square pyramid, rectangular prism, hemisphere, capsule pill, triangular pyramid, pentagonal prism, hexagonal pyramid, octahedron, ellipsoid, blue cone frustum, orange cone frustum, pentagonal pyramid, trapezoidal prism, truncated block, star prism, torus donut, square bipyramid, dodecahedron, triangular prism, crescent block, and one special rare glowing hyperdimensional geometric polyhedral structure creatively designed for this theme at slot 25. Centered on solid flat background color #f8f3e8, no gradients, no patterns, smooth clean lighting, soft drop shadows, high detail, vibrant colors, clean sharp edges, cute stylized clay math blocks, smooth matte porcelain finish, vibrant playful colors, no text, no borders, no watermark, each item fully contained inside its own square cell with generous plain margins and gutters, no overlapping, no items crossing cell boundaries --ar 1:1
```

- **Thẻ đặc biệt:** AI tự do sáng tạo 1 thẻ đặc biệt ở ô `[5, 5]` của mỗi lô (lưu vào `special/<slug>.webp`).
- **01–24:** khối lập phương, khối cầu, khối trụ, khối nón, chóp đáy vuông, hộp chữ nhật, bán cầu, khối nang, chóp tam giác, lăng trụ ngũ giác, chóp lục giác, bát diện, khối elip, nón cụt xanh, nón cụt cam, chóp ngũ giác, lăng trụ hình thang, khối cụt, lăng trụ ngôi sao, khối xuyến, chóp đôi, thập nhị diện, lăng trụ tam giác, khối trăng lưỡi liềm.
- **25–48:** tam giác đều, tam giác vuông, tam giác cân, hình vuông, hình chữ nhật, hình thang, hình bình hành, hình thoi, ngũ giác, lục giác, thất giác, bát giác, thập giác, hình tròn, hình elip, bán nguyệt, một phần tư hình tròn, vành khuyên, hình sao năm cánh, hình tim, hình mũi tên, hình tia sét, dấu cộng, dấu nhân.
- **49–72:** khối chóp cụt, lăng trụ ngũ giác rỗng, hình xuyến khuyết, khối đa diện đều, bát diện sao, khối icosahedron, khối dodecahedron, nêm xoắn, khối mắt, sao 8 mặt, hình khối cắt gãy, lăng trụ bát giác rỗng, hình cắt tròn đối xứng, khối bậc thang ba chiều, khối răng cưa, khối lưới xoắn, trụ chồng, khối hình học phức hợp, lưới không gian, xoắn vô cực.
- **73–96:** xoắn ốc Fibonacci, mê cung tròn, mẫu caro, lưới tam giác, lưới lục giác, họa tiết chevron, họa tiết ziczac, họa tiết chấm bi, mảnh ghép tangram, vòng tròn đồng tâm, đường sóng sin, biểu đồ cột không chữ, biểu đồ tròn không chữ, kính vạn hoa, fractal cây, fractal bông tuyết, tessellation tam giác, tessellation lục giác, hình đối xứng gương, hình đối xứng quay, khối pixel, khối voxel, mô hình phân tử trừu tượng, biểu tượng vô cực.
- **97–120:** hình tam giác bo góc, hình vuông bo góc, hình chữ nhật bo góc, hình ngũ giác bo góc, hình lục giác bo góc, hình bát giác bo góc, hình hộp rỗng, quả cầu rỗng, trụ rỗng, nón rỗng, khối chóp rỗng, vòng xoắn, lò xo, xích, bánh răng, khối tổ ong, khối lưới cầu, lưới lập phương, khối Rubik mini, khối tangram, hình xoắn ốc kép, biểu tượng pi 3D, biểu tượng sigma 3D, biểu tượng delta 3D.

---

### 13. Cyberpunk (`cyberpunk`)

**Prompt chuẩn:**

```text
A 5x5 contact sheet grid of 25 distinct individual slots featuring stylized game assets of cyberpunk gadgets and robots in isometric 3D render style: delivery robot, robotic cat, round scout drone, neon motorcycle helmet, AR augmented reality glasses, robotic mechanical arm, AI microchip, glowing PCB circuit board, futuristic energy battery, hologram mini speaker, neon vending machine, neon arrow sign, sci-fi motorcycle, flying hover taxi, teleportation portal gate, high-tech briefcase, cybernetic headphones, holographic keyboard, camera drone, mini orbital satellite, glowing neon cyber tree, digital LED visor mask, laser tool kit, data crystal, and one special rare glowing quantum cyber core or neon mecha relic creatively designed for this theme at slot 25. Centered on solid flat background color #02051b, no gradients, no patterns, smooth clean lighting, soft drop shadows, high detail, vibrant colors, clean sharp edges, stylized sci-fi game assets, matte tech plastic, glowing neon cyan and magenta LED accents, metallic alloy highlights, no text, no borders, no watermark, each item fully contained inside its own square cell with generous plain margins and gutters, no overlapping, no items crossing cell boundaries --ar 1:1
```

- **Thẻ đặc biệt:** AI tự do sáng tạo 1 thẻ đặc biệt ở ô `[5, 5]` của mỗi lô (lưu vào `special/<slug>.webp`).
- **01–24:** robot giao hàng, mèo máy, drone tròn, mũ bảo hiểm neon, kính thực tế tăng cường, cánh tay máy, chip AI, bảng mạch phát sáng, pin năng lượng, loa hologram, máy bán hàng tự động, biển hiệu mũi tên neon, mô tô tương lai, taxi bay, cổng dịch chuyển, vali công nghệ, tai nghe cyber, bàn phím hologram, máy ảnh drone, vệ tinh mini, cây nhân tạo neon, mặt nạ điện tử, hộp công cụ laser, tinh thể dữ liệu.
- **25–48:** robot vệ sinh, chó máy, cá máy hologram, côn trùng nano, kính áp tròng AR, găng tay haptic, giày phản lực, áo khoác phát sáng, đồng hồ thông minh, vòng tay sinh trắc, ổ cứng neon, thanh RAM, màn hình gập, chuột laser, cáp quang, trạm sạc, máy in 3D, cửa an ninh tương lai, thang máy hologram, biển quảng cáo neon, cột đèn neon, robot barista, vườn thủy canh neon, thú cưng robot.
- **49–72:** bảng điều khiển tàu, bàn đạp chân máy, cổng quét võng mạc, camera an ninh bay, máy chiếu hologram, bản đồ thành phố neon, tủ lạnh công nghệ, máy bán vé tự động, quả cầu plasma, chip lượng tử, kính bảo hộ thợ máy, mũ trùm cyber, nhẫn thông minh, loa drone, băng tay phát sáng, cờ lê đa năng laser, tuốc nơ vít điện tử, hộp sơ cứu nano, pin mặt trời mini, thẻ nhận diện điện tử, đồng xu dữ liệu, dây chuyền mạch điện, radio tương lai, biển hiệu pixel.
- **73–96:** robot đầu bếp, robot thợ hàn, robot nhảy múa, xe trượt phản lực, ván bay, monorail tương lai, tàu điện neon, máy bay không người lái giao hàng, tàu vũ trụ chở hàng, mô tô một bánh, bốt dịch chuyển, máy quét vật thể, kính hiển vi nano, máy tạo thời tiết, bộ phát khiên năng lượng, ăng-ten tín hiệu, máy chủ dữ liệu, khối mã hóa, ổ khóa vân tay, đồng hồ đếm ngược, xúc xắc kỹ thuật số, xúc tu robot, nấm cyber phát sáng, giọt chất lỏng neon.
- **97–120:** bộ não hologram, máy quét nano, chip sinh học, ổ cứng lượng tử, trạm dữ liệu mini, máy chủ neon, cổng quét thẻ, vòng tay laser, mũ bảo hộ thợ máy, robot thợ sửa chữa, robot giao hoa, robot cứu hộ, robot nhện, drone cánh quạt, drone đèn neon, taxi tự lái, bảng điều khiển hologram, bản đồ mạch điện, chìa khóa dữ liệu, đồng xu kỹ thuật số, hộp mã hóa, máy chiếu plasma, cây cyber phát sáng, bảng quảng cáo dữ liệu.

---

### 14. RPG phép thuật (`magic-rpg`)

**Prompt chuẩn:**

```text
A 5x5 contact sheet grid of 25 distinct individual slots featuring stylized game assets of fantasy RPG magic items in isometric 3D render style: wooden magic wand, ancient spellbook, red healing potion vial, blue mana potion vial, glowing crystal ball, pointed wizard hat, flying magic broom, cute baby dragon, miniature baby phoenix, baby unicorn, wooden treasure chest, ornate brass key, enchanted magic ring, moon amulet, glowing enchanted sword, rune carved shield, wizard staff, magical glowing mushroom, luminescent fantasy flower, purple poison mushroom, purple mana crystal, rolled treasure map scroll, brass magic lantern, stone rune portal, and one special rare glowing celestial or legendary enchanted magic artifact creatively designed for this theme at slot 25. Centered on solid flat background color #0b0b32, no gradients, no patterns, smooth clean lighting, soft drop shadows, high detail, vibrant colors, clean sharp edges, stylized fantasy game items, enchanted glowing runes, polished crystal gems, worn mystical leather and wood, no text, no borders, no watermark, each item fully contained inside its own square cell with generous plain margins and gutters, no overlapping, no items crossing cell boundaries --ar 1:1
```

- **Thẻ đặc biệt:** AI tự do sáng tạo 1 thẻ đặc biệt ở ô `[5, 5]` của mỗi lô (lưu vào `special/<slug>.webp`).
- **01–24:** đũa phép, sách thần chú, lọ thuốc đỏ, lọ thuốc xanh, quả cầu pha lê, mũ phù thủy, chổi bay, rồng con, phượng hoàng con, kỳ lân con, rương kho báu, chìa khóa cổ, nhẫn phép, amulet mặt trăng, thanh kiếm phát sáng, khiên rune, gậy pháp sư, nấm phép, hoa phát sáng, nấm độc, tinh thể tím, cuộn bản đồ, đèn lồng ma thuật, cổng đá rune.
- **25–48:** cây đũa phép pha lê, sách phép băng, sách phép lửa, lọ thuốc tím, lọ thuốc vàng, vạc phép, chày giã thuốc, túi bột phép, chổi quét sao, mèo phù thủy, cú đưa thư, yêu tinh nhỏ, tiên hoa, quái vật slime, golem đá, người tuyết phép, cây gậy sấm sét, gậy trượng mặt trời, cung ánh trăng, nỏ rune, búa sét, mũ giáp hiệp sĩ, áo choàng pháp sư, giày bay.
- **49–72:** găng tay phép, khiên hoa văn rồng, thanh kiếm băng, kiếm gỗ cổ, rìu chiến không sắc, bình mực phép, lông vũ phượng hoàng, vảy rồng, trứng rồng, móng griffin, sừng kỳ lân, bánh xe phép thuật, ngôi sao triệu hồi, vòng tròn rune, cánh cổng mây, tháp phù thủy, lều pháp sư, cầu đá ma thuật, giếng điều ước, cây cổ thụ biết nói, nấm phát sáng xanh, cây ăn quả phép, hòn đá mặt trăng, đá mặt trời.
- **73–96:** rương mimics thân thiện, bản đồ kho báu, la bàn phép, kính viễn vọng sao, chìa khóa pha lê, ổ khóa rune, cuộn sấm chú, cuộn dịch chuyển, mặt dây chuyền sao, huy hiệu bang hội, đồng xu vàng, viên ngọc lục bảo, viên ruby, viên sapphire, viên ngọc trai phép, đèn dầu thần, bình xịt phép thuật, quả táo vàng, bánh quy sao, ấm trà phù thủy, đèn lồng bí ngô phép, chuông gió pha lê, mô hình lâu đài, lá bùa may mắn.
- **97–120:** rồng băng con, rồng lửa con, griffin con, kỳ lân biển, mèo phép thuật, cú tuyết đưa thư, đèn thần, gương ma thuật, đàn hạc phép, trống rune, quả táo phép, bánh sao phép, bình thuốc hồi máu, bình thuốc tàng hình, bình thuốc may mắn, đá triết gia, viên ngọc lửa, viên ngọc băng, viên ngọc sét, sách phép rừng, sách phép biển, chuông triệu hồi, bùa hộ mệnh, cổng cầu vồng.

---

### 15. Vũ trụ (`space`)

**Prompt chuẩn:**

```text
A 5x5 contact sheet grid of 25 distinct individual slots featuring stylized game assets of space exploration and astronomy in isometric 3D render style: space rocket, cute chibi astronaut, friendly green alien, flying saucer UFO, spaceship, orbital space station, communications satellite, Mars rover explorer, blazing Sun, planet Mercury, planet Venus, planet Earth, cratered Moon, planet Mars, planet Jupiter, ringed Saturn, planet Uranus, planet Neptune, icy comet, glowing meteor, optical telescope, cosmic black hole, colorful nebula cloud, starry constellation, and one special rare glowing mythical cosmos starship or celestial phenomenon creatively designed for this theme at slot 25. Centered on solid flat background color #020819, no gradients, no patterns, smooth clean lighting, soft drop shadows, high detail, vibrant colors, clean sharp edges, stylized space exploration icons, glossy astronaut suits, smooth planetary textures, metallic hull finishes, no text, no borders, no watermark, each item fully contained inside its own square cell with generous plain margins and gutters, no overlapping, no items crossing cell boundaries --ar 1:1
```

- **Thẻ đặc biệt:** AI tự do sáng tạo 1 thẻ đặc biệt ở ô `[5, 5]` của mỗi lô (lưu vào `special/<slug>.webp`).
- **01–24:** tên lửa, phi hành gia, người ngoài hành tinh xanh, UFO, tàu không gian, trạm vũ trụ, vệ tinh, rover Sao Hỏa, Mặt Trời, Sao Thủy, Sao Kim, Trái Đất, Mặt Trăng, Sao Hỏa, Sao Mộc, Sao Thổ, Sao Thiên Vương, Sao Hải Vương, sao chổi, thiên thạch, kính thiên văn, hố đen, tinh vân, chòm sao.
- **25–48:** Sao Diêm Vương, mặt trăng Europa, mặt trăng Titan, mặt trăng Io, mặt trăng Ganymede, tàu con thoi, tàu đổ bộ Mặt Trăng, robot thám hiểm, xe tự hành Mặt Trăng, kính thiên văn không gian, kính thiên văn radio, đài quan sát, ăng-ten parabol, tên lửa đẩy, khoang thoát hiểm, bộ đồ phi hành gia, mũ phi hành gia, găng tay phi hành gia, ủng phi hành gia, lá cờ hành tinh, trạm tiếp nhiên liệu, tàu chở hàng vũ trụ, cổng không gian, khoang ngủ không trọng lực.
- **49–72:** vệ tinh thời tiết, vệ tinh liên lạc, vệ tinh định vị, tàu thăm dò, tàu do thám, tàu khai thác tiểu hành tinh, tiểu hành tinh băng, thiên thạch lửa, mảnh sao băng, vòng sao Thổ, bão Sao Mộc, vết đỏ lớn, cực quang hành tinh, nhật thực, nguyệt thực, quỹ đạo hành tinh, vành đai tiểu hành tinh, vành đai Kuiper, đám mây Oort, thiên hà xoắn ốc, thiên hà elip, thiên hà lùn, cụm sao, sao lùn trắng.
- **73–96:** sao lùn đỏ, sao khổng lồ đỏ, sao neutron, pulsar, siêu tân tinh, tàn dư siêu tân tinh, tinh vân hành tinh, tinh vân đại bàng, đám mây bụi vũ trụ, lỗ sâu, cổng sao, tinh thể không gian, đồng hồ thiên văn, quả cầu mô hình hệ Mặt Trời, bản đồ sao, máy tính dẫn đường, hệ thống duy trì sự sống, bình oxy, bình nhiên liệu, hộp dụng cụ phi hành gia, thức ăn không gian, cây trồng thủy canh, thiên thạch có vòng, người ngoài hành tinh tím.
- **97–120:** sao lùn nâu, sao lùn xanh, sao khổng lồ xanh, sao đôi, cụm sao cầu, tinh vân xoắn, tinh vân phản xạ, tinh vân tối, thiên hà Andromeda, thiên hà vòng, sao chổi đôi đuôi, tiểu hành tinh kim loại, tiểu hành tinh đá, vệ tinh nano, tàu vũ trụ mini, tàu thám hiểm sâu, xe rover băng, trạm không gian vòng, kính thiên văn James Webb, đài quan sát Mặt Trăng, radar vũ trụ, bình oxy phi hành gia, hộp đồ nghề không gian, vườn không trọng lực.

---

### 16. Vật dụng gia đình (`household`)

**Prompt chuẩn:**

```text
A 5x5 contact sheet grid of 25 distinct individual slots featuring stylized game assets of cozy household items in isometric 3D render style: desk lamp, retro alarm clock, cozy armchair, wooden stool, plush bolster pillow, folded pastel blanket, ceramic tea kettle, coffee mug, dinner plate, soup bowl, cooking pot with lid, frying pan, mini refrigerator, microwave oven, bread toaster, retro electric fan, canister vacuum cleaner, front-load washing machine, steam iron, TV remote control, smart television, wooden picture frame, ceramic flower vase, potted houseplant, and one special rare vintage gold-trimmed royal luxury household heirloom creatively designed for this theme at slot 25. Centered on solid flat background color #fff6e7, no gradients, no patterns, smooth clean lighting, soft drop shadows, high detail, vibrant colors, clean sharp edges, cute stylized clay home appliances, cozy pastel ceramic, soft fabric textures, polished plastic, no text, no borders, no watermark, each item fully contained inside its own square cell with generous plain margins and gutters, no overlapping, no items crossing cell boundaries --ar 1:1
```

- **Thẻ đặc biệt:** AI tự do sáng tạo 1 thẻ đặc biệt ở ô `[5, 5]` của mỗi lô (lưu vào `special/<slug>.webp`).
- **01–24:** đèn bàn, đồng hồ báo thức, ghế bành, ghế đẩu, gối ôm, chăn gấp, ấm nước, cốc sứ, đĩa, bát, nồi, chảo, tủ lạnh, lò vi sóng, máy nướng bánh mì, quạt bàn, máy hút bụi, máy giặt, bàn là, điều khiển TV, tivi, khung ảnh trống, bình hoa, chậu cây.
- **25–48:** giường ngủ, nệm cuộn, đèn ngủ, đèn đứng, rèm cửa, thảm tròn, giá sách, kệ treo tường, bàn trà, bàn ăn, ghế ăn, tủ quần áo, ngăn kéo, gương treo tường, móc áo, giỏ đựng đồ, hộp khăn giấy, thùng rác, chổi, cây lau nhà, hốt rác, xô nước, máy lọc không khí, máy tạo ẩm.
- **49–72:** máy sấy tóc, máy cạo râu, bàn chải đánh răng, kem đánh răng, xà phòng, chai dầu gội, khăn tắm, áo choàng tắm, cân sức khỏe, hộp thuốc, nhiệt kế, đèn pin, ổ cắm điện, dây nối điện, công tắc đèn, đồng hồ treo tường, chuông cửa, chìa khóa nhà, thảm chùi chân, hộp thư, bình chữa cháy, quạt trần, máy điều hòa, lò sưởi.
- **73–96:** máy pha cà phê, ấm siêu tốc, máy xay sinh tố, nồi cơm điện, nồi chiên không dầu, máy rửa bát, máy đánh trứng, hộp cơm, thớt gỗ, dao bếp an toàn, muỗng gỗ, nĩa, đũa, khay đá, lọ gia vị, bình nước, hộp bánh quy, tạp dề, găng tay lò nướng, giá phơi đồ, giỏ giặt, móc kẹp quần áo, máy may, bộ dụng cụ sửa nhà.
- **97–120:** đèn ngủ mặt trăng, đèn sàn, rèm cuốn, thảm lông, ghế bập bênh, ghế beanbag, bàn làm việc, bàn đầu giường, tủ đầu giường, kệ giày, giá treo áo, giỏ mây, hộp đựng điều khiển, lọ nến, máy lọc nước, máy khử mùi, máy sưởi gốm, máy sấy tóc, bàn chải điện, hộp đựng kim chỉ, máy đo huyết áp, khóa cửa điện tử, thẻ từ cửa, ổn áp mini.

---

### 17. Đồ dùng văn phòng (`office-supplies`)

**Prompt chuẩn:**

```text
A 5x5 contact sheet grid of 25 distinct individual slots featuring stylized game assets of office stationery supplies in isometric 3D render style: wooden pencil, fountain ink pen, yellow highlighter, rubber eraser, pencil sharpener, wooden ruler, craft scissors, glue stick, tape dispenser roll, paper clip, binder clip, push pin, desktop stapler, spiral notebook, blank desk calendar, accordion file folder, clipboard, mailing envelope, desk calculator, computer keyboard, optical mouse, USB thumb drive, desktop color printer, reading glasses, and one special rare gold-plated luxury executive stationery item creatively designed for this theme at slot 25. Centered on solid flat background color #f4faff, no gradients, no patterns, smooth clean lighting, soft drop shadows, high detail, vibrant colors, clean sharp edges, cute stylized stationery icons, smooth colorful plastic, crisp paper textures, polished metal clips, no text, no borders, no watermark, each item fully contained inside its own square cell with generous plain margins and gutters, no overlapping, no items crossing cell boundaries --ar 1:1
```

- **Thẻ đặc biệt:** AI tự do sáng tạo 1 thẻ đặc biệt ở ô `[5, 5]` của mỗi lô (lưu vào `special/<slug>.webp`).
- **01–24:** bút chì, bút mực, bút dạ quang, tẩy, gọt bút chì, thước kẻ, kéo, keo dán, băng keo, kẹp giấy, kẹp bướm, ghim bấm, máy dập ghim, sổ tay, lịch bàn không chữ, tập hồ sơ, bìa kẹp, phong bì, máy tính cầm tay, bàn phím, chuột máy tính, USB, máy in, kính đọc sách.
- **25–48:** bút bi, bút gel, bút lông bảng, bút vẽ kỹ thuật, bút màu sáp, hộp bút, hộp mực, ruột bút, đầu bút thay thế, thước đo góc, compa, ê-ke, bảng kẹp giấy, bảng trắng mini, khăn lau bảng, nam châm tròn, ghim nam châm, nhãn dán màu, giấy ghi chú, giấy than, giấy in ảnh, giấy thủ công, con dấu ngày tháng, mực dấu.
- **49–72:** máy ép plastic, túi ép plastic, máy hủy giấy, máy quét tài liệu, máy photocopy, máy chiếu, màn chiếu, webcam, tai nghe có mic, mic để bàn, đèn bàn LED, ổ cứng ngoài, thẻ nhớ, đầu đọc thẻ, hub USB, dây sạc, sổ danh thiếp, danh thiếp trống, bảng tên để bàn, giá đỡ điện thoại, giá đỡ laptop, túi đựng laptop, máy tính để bàn, màn hình máy tính.
- **73–96:** bút cảm ứng, bảng vẽ điện tử, chuột không dây, bàn di chuột, máy đếm tiền, máy tính in hóa đơn, máy đóng gáy, lò xo đóng tập, bìa nhựa trong, giấy phân trang, kẹp trình ký, hộp lưu trữ hồ sơ, khay đựng giấy, giá đỡ sách, kính lúp đọc chữ, đèn kẹp bàn, bộ hẹn giờ, lịch lật không chữ, bảng kế hoạch trống, hộp ghim, máy gọt bút chì điện, dao rọc giấy, thảm cắt, con lăn keo.
- **97–120:** bút máy, bút lông dầu, bút brush, bút vẽ màu nước, hộp màu, bảng pha màu, bút xóa, giấy note hình sao, giấy note hình mũi tên, sổ lò xo, sổ da, kẹp tài liệu, khay giấy, giá sách để bàn, đục lỗ giấy, máy đóng gáy mini, bấm lỗ điện, bảng lót bàn văn phòng, keo sữa, keo dán hai mặt, nhãn dán tròn, con dấu trống, hộp bút để bàn, đèn bàn kẹp.

---

### 18. Dụng cụ làm vườn (`garden-tools`)

**Prompt chuẩn:**

```text
A 5x5 contact sheet grid of 25 distinct individual slots featuring stylized game assets of gardening tools and infrastructure in isometric 3D render style: empty terracotta planter pot, blank garden plant marker, automated watering timer, lawn broom rake, wooden plant stakes, coiled green garden hose, pruning hand saw, garden pickaxe, rotating lawn sprinkler, drip irrigation nozzle, plant tying twine roll, rubber gardening gloves, heavy-duty garden gloves, metal hand trowel, long bypass lopper, seed germination starter tray, leaf rake, grass sickle, sunshade garden netting, insect mesh net, soil moisture meter, mini glass greenhouse, analog soil thermometer, wall tool hanging rack, and one special rare luxury garden workstation or all-in-one brass tool apparatus creatively designed for this theme at slot 25. Centered on solid flat background color #edf8d2, no gradients, no patterns, smooth clean lighting, soft drop shadows, high detail, vibrant colors, clean sharp edges, cute stylized garden tool assets, terracotta pottery, forged metal blades, sturdy wooden handles, no text, no borders, no watermark, each item fully contained inside its own square cell with generous plain margins and gutters, no overlapping, no items crossing cell boundaries --ar 1:1
```

- **Thẻ đặc biệt:** AI tự do sáng tạo 1 thẻ đặc biệt ở ô `[5, 5]` của mỗi lô (lưu vào `special/<slug>.webp`).
- **01–24:** chậu trồng rỗng, biển đánh dấu luống, bộ hẹn giờ tưới, chổi cỏ, cọc neo luống, vòi tưới cuộn, cưa cành, cuốc chim, đầu phun xoay, đầu tưới nhỏ giọt, dây buộc cành, găng tay cao su, găng tay làm vườn, xẻng tay, kéo cắt cành lớn, khay gieo hạt, cào lá, liềm cắt cỏ, lưới che nắng, lưới chống côn trùng, máy đo độ ẩm đất, nhà kính mini, nhiệt kế đất, giá treo dụng cụ.
- **25–48:** nĩa làm vườn, ống dẫn nước, kéo tỉa cành, gói hạt giống, xẻng lớn, cuốc nhỏ, túi đất, bình xịt, chậu đất nung rỗng, thùng chứa nước mưa, thùng ủ phân, ủng đi vườn, bình tưới, xe cút kít, hàng rào gỗ, xẻng xúc đất, bệ chậu rỗng, tấm lót luống, khung giàn giáo, hộp phân hữu cơ, đèn năng lượng mặt trời, ghế băng vườn, bàn ghế sân vườn.
- **49–72:** đài phun nước, cổng vòm lưới, hàng rào lưới, lối đi đá, vòng trang trí cỏ, xe cắt cỏ, máy thổi lá, máy cắt tỉa hàng rào, bình phun phân bón, túi phân trộn, xe kéo làm vườn, giỏ dụng cụ, bàn làm vườn, giá để dụng cụ, hộp dụng cụ làm vườn, thước đo đất, máy đo pH đất, máy đo ánh sáng, máy rải hạt, máy làm đất mini, máy cắt cỏ cầm tay.
- **73–96:** máy tưới tự động, van tưới, đầu nối vòi, cuộn dây nhỏ giọt, béc phun sương, mái che vườn, lều ươm, khung giàn giáo, giá đỡ chậu rỗng, đế có bánh xe cho chậu, khay thoát nước, chậu treo rỗng, bình phun sâu bệnh, bẫy côn trùng, lưới chắn chim, dụng cụ nhổ cỏ, xẻng xúc phân, dao ghép cành, dây buộc cành, ghim cố định lưới, giá treo vòi, thùng đựng dụng cụ, xe đẩy vườn, máy xịt áp lực.
- **97–120:** kéo cắt cỏ, kéo hái cành, cưa cầm tay, búa đóng cọc, kìm cắt dây, kìm uốn cành, bàn chải chậu, lưỡi thay thế máy cắt, dây tưới thấm, đầu nối nhanh, van chia nước, đồng hồ nước, máy bơm nước mini, máy hút lá, máy nghiền cành, xe kéo tay, hộp hạt giống, giá treo dụng cụ, móc treo xẻng, thùng rác vườn, tấm lót chống cỏ, viền luống vườn, cọc đèn sân vườn, dù che nắng sân vườn.

---

### 19. Thời trang & phụ kiện (`fashion`)

**Prompt chuẩn:**

```text
A 5x5 contact sheet grid of 25 distinct individual slots featuring stylized game assets of clothing and fashion accessories in isometric 3D render style: cotton t-shirt, blue denim jacket, knitted wool sweater, summer casual dress, denim jeans, sporty sneakers, leather ankle boots, casual strap sandals, baseball cap, classic beret hat, knit beanie, stylish sunglasses, round wireframe glasses, luxury wristwatch, beaded bracelet, gold pendant necklace, gemstone ring, hoop earrings, leather handbag, everyday backpack, folding wallet, warm wool scarf, leather waist belt, silk hair bow, and one special rare sparkling royal gemstone accessory or haute couture item creatively designed for this theme at slot 25. Centered on solid flat background color #fff0f5, no gradients, no patterns, smooth clean lighting, soft drop shadows, high detail, vibrant colors, clean sharp edges, cute stylized fashion accessories, soft woven fabric, shiny gold jewelry, leather footwear, no text, no borders, no watermark, each item fully contained inside its own square cell with generous plain margins and gutters, no overlapping, no items crossing cell boundaries --ar 1:1
```

- **Thẻ đặc biệt:** AI tự do sáng tạo 1 thẻ đặc biệt ở ô `[5, 5]` của mỗi lô (lưu vào `special/<slug>.webp`).
- **01–24:** áo thun, áo khoác denim, áo len, váy liền, quần jeans, giày thể thao, giày bốt, dép sandal, mũ lưỡi trai, mũ beret, mũ len, kính râm, kính gọng tròn, đồng hồ đeo tay, vòng tay, vòng cổ, nhẫn, bông tai, túi xách, ba lô, ví tiền, khăn quàng, thắt lưng, nơ cài tóc.
- **25–48:** áo sơ mi, áo polo, áo hoodie, áo cardigan, áo blazer, áo mưa, áo khoác da, áo khoác phao, quần short, quần kaki, quần yếm, chân váy xếp ly, váy dạ hội, váy ngủ, bộ đồ thể thao, đồ bơi, áo bóng đá, giày lười, giày cao gót, giày ballet, giày đi mưa, dép đi trong nhà, tất sọc, găng tay len.
- **49–72:** mũ rộng vành, mũ fedora, mũ bảo hộ, băng đô, kẹp tóc, vương miện, khăn turban, mặt nạ ngủ, kính bơi, kính bảo hộ, đồng hồ bỏ túi, nhẫn cưới, nhẫn đá quý, vòng chân, trâm cài áo, ghim cài áo, huy hiệu cài áo, dây đeo thẻ, túi tote, túi đeo chéo, túi ví cầm tay, túi du lịch, va li, ô gấp.
- **73–96:** ô che mưa, gương cầm tay, lược, bàn chải tóc, máy uốn tóc, máy sấy tóc, chai nước hoa, son môi, bảng phấn mắt, lọ sơn móng, dây chuyền ngọc trai, vòng cổ choker, vòng tay charm, thắt nơ cổ, cà vạt, nơ bướm, khuy măng sét, dây treo quần, ví đựng thẻ, hộp trang sức, giá treo quần áo, móc khóa, bao điện thoại, huy hiệu thời trang.
- **97–120:** áo khoác bomber, áo khoác trench, áo vest, áo gile, áo len cổ lọ, quần jogger, quần culottes, quần short jeans, váy maxi, váy yếm, váy sơ mi, giày Oxford, giày loafer, giày mule, túi bucket, túi baguette, túi đeo hông, ví cầm tay, khăn bandana, khăn choàng lụa, mũ bucket, mũ visor, vòng cổ ngọc trai, kẹp cà vạt.

---

### 20. Phương tiện giao thông (`vehicles`)

**Prompt chuẩn:**

```text
A 5x5 contact sheet grid of 25 distinct individual slots featuring stylized game assets of transportation vehicles in isometric 3D render style: city bicycle, modern motorcycle, electric kick scooter, compact hatchback car, yellow city taxi, city transit bus, red fire engine truck, medical ambulance, blue police car, cargo delivery truck, construction dump truck, farm tractor, construction wheelbarrow, passenger train engine, electric tramway car, classic wooden sailboat, motorized speedboat, yellow research submarine, rescue helicopter, passenger airplane, hot air balloon, aerial cable car, street skateboard, snowmobile, and one special rare golden futuristic concept vehicle creatively designed for this theme at slot 25. Centered on solid flat background color #e5f5ff, no gradients, no patterns, smooth clean lighting, soft drop shadows, high detail, vibrant colors, clean sharp edges, cute stylized toy vehicle models, glossy enamel paint, rubber tires, clear glass windshields, no text, no borders, no watermark, each item fully contained inside its own square cell with generous plain margins and gutters, no overlapping, no items crossing cell boundaries --ar 1:1
```

- **Thẻ đặc biệt:** AI tự do sáng tạo 1 thẻ đặc biệt ở ô `[5, 5]` của mỗi lô (lưu vào `special/<slug>.webp`).
- **01–24:** xe đạp, xe máy, scooter điện, ô tô nhỏ, taxi, xe buýt, xe cứu hỏa, xe cứu thương, xe cảnh sát, xe tải chở hàng, xe ben, máy kéo, xe cút kít công trường, tàu hỏa, tàu điện, tàu buồm, ca nô, tàu ngầm, trực thăng, máy bay, khinh khí cầu, xe cáp treo, ván trượt, xe trượt tuyết.
- **25–48:** xe đạp đôi, xe đạp địa hình, xe đạp chở hàng, xe máy sidecar, xe tuk tuk, xe limousine, xe mui trần, xe thể thao, xe điện, xe hybrid, xe caravan, xe nhà di động, xe bọc thép không vũ khí, xe chở rác, xe quét đường, xe chở thư, xe giao pizza, xe chở kem, xe nâng, xe cẩu, xe lu, xe xúc, xe cứu hộ, xe chở ngựa.
- **49–72:** tàu chở hàng, tàu du lịch, phà, tàu phá băng, tàu đánh cá, tàu cứu hộ, tàu vũ trụ, thuyền kayak, thuyền gondola, thuyền chèo, ván buồm, mô tô nước, xe lội nước, tàu đệm khí, máy bay trực thăng cứu hộ, thủy phi cơ, máy bay phản lực, máy bay cánh quạt, máy bay không người lái, khinh khí cầu hình thú, dù lượn, tàu lượn siêu tốc, xe đẩy hành lý sân bay, cầu thang máy bay.
- **73–96:** tàu điện ngầm, tàu một ray, tàu cao tốc, đầu máy hơi nước, xe điện mặt đất, toa ăn tàu, xe cáp treo núi, thang cuốn, băng chuyền hành lý, xe trượt băng, xe chó kéo, xe trượt tuyết tuyết, xe golf, xe lăn điện, xe đẩy em bé, xe kéo tay, xe thồ hàng, xe ba bánh, xe đạp một bánh, ván lướt sóng, ván trượt điện, xe scooter gấp, xe leo núi, xe trượt dốc.
- **97–120:** xe jeep, xe bán tải, xe minivan, xe sedan, xe hatchback, xe roadster, xe rally, xe điện mini, xe buýt hai tầng, xe buýt trường học, xe tải thùng, xe tải lạnh, xe bồn, xe chở container, xe nâng điện, xe chở hành lý, tàu điện đô thị, tàu hỏa tốc hành, đầu máy điện hiện đại, phà chở xe, thuyền buồm catamaran, tàu cánh ngầm, máy bay phản lực mini, drone chở hàng.

---

### 21. Cổ vật lịch sử (`historical-artifacts`)

**Prompt chuẩn:**

```text
A 5x5 contact sheet grid of 25 distinct individual slots featuring stylized game assets of historical relics and museum artifacts in isometric 3D render style: ancient painted pottery vase, antique brass maritime compass, antique ornate iron padlock, rolled vintage treasure map, terracotta amphora jar, skeleton brass key, Easter Island Moai stone statue, ancient cipher codex book, rolled papyrus scroll, brass sundial, Egyptian Bastet cat statue, golden burial mask, carved wooden secret puzzle box, ceremonial Egyptian shield, antique magnifying glass, rolled parchment map, carved African ritual mask, Roman centurion helmet, vintage wind-up music box, classical brass oil lamp, ornate pocket watch, rotary dial telephone, brass armillary sphere, terracotta warrior figurine, and one special rare glowing golden ancient pharaoh or emperor relic creatively designed for this theme at slot 25. Centered on solid flat background color #031126, no gradients, no patterns, smooth clean lighting, soft drop shadows, high detail, vibrant colors, clean sharp edges, stylized museum artifact relics, weathered antique brass, carved ancient pottery, aged papyrus, no text, no borders, no watermark, each item fully contained inside its own square cell with generous plain margins and gutters, no overlapping, no items crossing cell boundaries --ar 1:1
```

- **Thẻ đặc biệt:** AI tự do sáng tạo 1 thẻ đặc biệt ở ô `[5, 5]` của mỗi lô (lưu vào `special/<slug>.webp`).
- **01–24:** bình cổ, la bàn cổ, ổ khóa cổ, bản đồ kho báu, bình amphora, chìa khóa đồng, tượng Moai, sách mật mã cổ, cuộn giấy cói, đồng hồ mặt trời, tượng mèo Ai Cập, mặt nạ vàng, hộp bí mật, khiên Ai Cập, kính lúp cổ, bản đồ cuộn giấy, mặt nạ châu Phi, mũ sắt La Mã, hộp nhạc, đèn dầu, đồng hồ bỏ túi, điện thoại quay số, thiên văn cầu, tượng đất nung.
- **25–48:** tượng nhân sư, máy đánh chữ bàn, máy ảnh cổ, đĩa than, con dấu sáp, vương miện cổ, quyền trượng hoàng gia, nhẫn signet, hộp trang sức cổ, gương cổ, đèn dầu La Mã, quạt cổ, gramophone, máy đánh điện báo, máy ảnh hộp, máy quay phim cổ, kính một tròng, ống nhòm sân khấu, kính vạn hoa cổ, địa cầu cổ, la bàn sao, mẫu tàu trong chai, tượng chiến binh đất nung, phù điêu đá.
- **49–72:** mảnh bản đồ cổ, hộp thuốc cổ, đồng xu La Mã, bia đá rune, bức tượng thần Hy Lạp, bát gốm cổ, đĩa gốm cổ, lư hương đồng, trống đồng, trượng nghi lễ, áo giáp nghi lễ, huy chương cổ, ấn chương hoàng gia, bình thuốc cổ, đồng hồ cát cổ, thẻ bài tarot cổ, sách da cổ, cuộn da thuộc, bản khắc gỗ, mặt nạ Venice, tượng Phật cổ, tượng Ai Cập, bùa hộ mệnh scarab, dây chuyền cổ.
- **73–96:** vòng tay cổ, hộp khảm trai, bình rượu cổ, khung tranh cổ, giá nến cổ, đèn lồng cổ, bình thủy tinh cổ, dụng cụ thiên văn cổ, astrolabe, đồng hồ mặt trời mini, bàn tính cổ, kính hiển vi cổ, máy đánh chữ tay, hộp nhạc quay tay, con dấu sáp cổ, chìa khóa skeleton, ổ khóa sắt cổ, la bàn gỗ, bản đồ sao cổ, tượng sư tử đá, ngọc bội cổ, trâm cài cổ, nhẫn đá quý cổ, hộp bí mật chạm khắc.
- **97–120:** tượng thần Anubis, tượng chiến binh Sparta, bình gốm Hy Lạp, bình ngọc cổ, khay đồng cổ, chén ngọc, hộp sơn mài, quạt giấy cổ, thư pháp cuộn trống, sách minh họa cổ, bản đồ hàng hải cổ, địa cầu đồng, kính thiên văn đồng, hộp đồng xu, huy hiệu hoàng gia, chìa khóa lâu đài, ổ khóa chạm khắc, đèn bão cổ, máy đánh chữ hoàng gia, máy ảnh xếp, máy quay phim tay, radio cổ, máy hát đĩa, máy thu điện báo.

---

### 22. Thiết bị gián điệp (`spy-gadgets`)

**Prompt chuẩn:**

```text
A 5x5 contact sheet grid of 25 distinct individual slots featuring stylized game assets of spy gadgets and surveillance gear in isometric 3D render style: handheld walkie-talkie, spy camera pen, handheld UV blacklight, glowing surveillance footprint, night vision goggles, polarized spy sunglasses, clip-on lapel microphone, handheld metal detector, mini magnetic voice recorder, cipher decoding device, parabolic listening device, covert radio beacon, miniature spy camera, buttonhole hidden camera, combination padlock, optical periscope, covert micro earpiece, secret agent aluminum briefcase, scout reconnaissance telescope, classified confidential document folder, wax sealed top-secret envelope, secret agency seal stamp, brass film canister, 35mm photographic negative film roll, and one special rare advanced hologram stealth gadget or covert device creatively designed for this theme at slot 25. Centered on solid flat background color #101927, no gradients, no patterns, smooth clean lighting, soft drop shadows, high detail, vibrant colors, clean sharp edges, stylized secret agent gadgets, matte tactical carbon fiber, stealth dark alloys, glowing sensor lenses, no text, no borders, no watermark, each item fully contained inside its own square cell with generous plain margins and gutters, no overlapping, no items crossing cell boundaries --ar 1:1
```

- **Thẻ đặc biệt:** AI tự do sáng tạo 1 thẻ đặc biệt ở ô `[5, 5]` của mỗi lô (lưu vào `special/<slug>.webp`).
- **01–24:** bộ đàm, bút camera, đèn UV, dấu chân phát sáng, kính nhìn đêm, kính râm gián điệp, micro cài áo, máy dò kim loại, máy ghi âm mini, máy mã hóa, máy nghe lén, máy phát tín hiệu, máy ảnh gián điệp mini, nút áo camera, ổ khóa số, kính tiềm vọng, tai nghe bí mật, vali điệp viên, kính thiên văn trinh sát, tài liệu mật không chữ, phong bì niêm phong, con dấu bí mật, hộp đựng phim, cuộn phim âm bản.
- **25–48:** máy chiếu phim mini, đĩa mềm, băng cassette, máy nhắn tin, điện thoại vệ tinh, kính hồng ngoại, máy quét dấu vân tay, thiết bị định vị, đèn pin mật mã, bảng giải mã, bánh xe Caesar, thẻ nhận diện bí mật, hình con mắt bí mật, dây móc leo, đồng xu bí mật, hộp phấn ngụy trang, máy quét RFID, khóa vân tay, micro laser, máy dò chuyển động, camera nút áo, camera bút chì, camera kính mắt, máy ghi âm bỏ túi.
- **49–72:** tai nghe xương, đồng hồ bí mật, nhẫn thông minh bí mật, dây chuyền mật mã, ổ USB mã hóa, đèn pin UV mini, kính lúp gián điệp, ống nhòm mini, bản đồ nhiệt, thiết bị đổi giọng, máy gây nhiễu, bộ đàm cổ tay, máy quét tần số, hộp thư bí mật, bút mực tàng hình, giấy mật mã, kính lọc phân cực, máy chụp ảnh nhiệt, thẻ chìa khóa điện tử, vali mật mã, túi đựng thiết bị, găng tay cảm ứng, giày chống dấu vết, áo khoác ẩn hình.
- **73–96:** mặt nạ nhận diện, huy hiệu đặc vụ, đèn hiệu khẩn cấp, máy phát GPS, thiết bị nghe qua tường, máy dò bug, bộ dụng cụ mở khóa an toàn, máy in ảnh mini, thiết bị phát tín hiệu SOS, máy quét võng mạc, bộ điều khiển drone, drone trinh sát mini, hộp mã hóa dữ liệu, điện thoại mã hóa, máy tạo khói sân khấu, kính nhìn xuyên đêm, la bàn điện tử, thiết bị theo dõi hành lý, máy quét mã QR, ví chống RFID, đồng hồ đếm ngược, máy thu sóng, máy sao chép thẻ, máy định vị mini.
- **97–120:** camera siêu nhỏ, tai nghe hạt đậu, micro cúc áo, bút laser, đồng hồ camera, nhẫn camera, kính camera, máy quét lỗi, máy dò nhiệt, máy dò hồng ngoại, thiết bị nghe lén điện thoại, máy ghi âm thẻ, USB ngụy trang, thẻ nhớ bí mật, ví tài liệu mật, phong bì chống nước, hộp dấu vân tay, máy quét DNA giả lập, thiết bị định vị xe, thiết bị theo dõi chìa khóa, drone gián điệp côn trùng, robot gián điệp mini, máy phát Wi-Fi bí mật, máy phá mã mini.

---

### 23. Lễ hội (`festivals`)

**Prompt chuẩn:**

```text
A 5x5 contact sheet grid of 25 distinct individual slots featuring stylized game assets of festive celebrations in isometric 3D render style: red silk lantern, yellow apricot blossom branch, traditional banh chung, blank lucky red envelope, festival ceremonial drum, festive lion dance head, decorated Christmas tree, golden holiday bell, red Christmas stocking, striped candy cane, carved Halloween pumpkin jack-o-lantern, glowing pumpkin lantern, pointed witch hat, painted Easter egg, cute Easter bunny with ribbon, bursting fireworks rocket, party balloon cluster, birthday cake with icing, glowing birthday candle, colorful triangular bunting banner, venetian carnival mask, multicolored paper confetti, holiday pine wreath, wrapped gift box with silk ribbon, and one special rare golden ceremonial festival mascot or festive heirloom creatively designed for this theme at slot 25. Centered on solid flat background color #fff5dc, no gradients, no patterns, smooth clean lighting, soft drop shadows, high detail, vibrant colors, clean sharp edges, cute stylized holiday symbols, joyful carnival confetti, glazed confectionery, festive ribbons, no text, no borders, no watermark, each item fully contained inside its own square cell with generous plain margins and gutters, no overlapping, no items crossing cell boundaries --ar 1:1
```

- **Thẻ đặc biệt:** AI tự do sáng tạo 1 thẻ đặc biệt ở ô `[5, 5]` của mỗi lô (lưu vào `special/<slug>.webp`).
- **01–24:** đèn lồng đỏ, hoa mai vàng, bánh chưng, phong bao lì xì không chữ, trống hội, múa lân, cây thông Noel, chuông vàng, tất Giáng sinh, kẹo gậy, bí ngô Halloween, đèn bí ngô, mũ phù thủy Halloween, trứng Phục Sinh, thỏ Phục Sinh, pháo hoa, bóng bay, bánh sinh nhật, nến sinh nhật, cờ tam giác, mặt nạ carnival, hoa giấy, vòng hoa, quà gói ruy băng.
- **25–48:** bánh trung thu, đèn ông sao, đầu lân, cành đào hồng, câu đối trống không chữ, mâm ngũ quả, con giáp đất, áo dài Tết, hoa sen, trống cơm, đèn lồng giấy, bánh tét, hoa trạng nguyên, quả châu Noel, ngôi sao Noel, vòng nguyệt quế Noel, xe trượt tuyết Noel, người tuyết, găng tay Noel, hộp thư ông già Noel, cây kẹo mút, bánh gừng, tuần lộc đeo chuông Giáng sinh, mũ ông già Noel.
- **49–72:** nón phù thủy Halloween, mạng nhện Halloween, kẹo ngô, ma thân thiện, dơi giấy, mèo đen Halloween, bộ xương vui nhộn, quan tài hoạt hình, cổng nhà ma, quả táo caramel, giỏ kẹo, nến Halloween, thỏ Phục Sinh ôm trứng, giỏ trứng, gà con Phục Sinh, hoa thủy tiên, chuông Phục Sinh, bươm bướm mùa xuân, bánh kem đám cưới, chuông cưới, bó hoa cưới, thiệp mời trống, bánh quy trái tim, hòm quà cưới.
- **73–96:** bánh cupcake sinh nhật, mũ sinh nhật, kèn thổi tiệc, dải ruy băng, phông nền chấm bi, bóng bay hình sao, hoa giấy hình ngôi sao, huy chương vàng, cúp chiến thắng, cờ caro, đuốc Olympic, trống cổ vũ, áo đội tuyển không logo, huy hiệu lễ hội, đèn disco, mặt nạ hóa trang, chuỗi hạt carnival, lông vũ carnival, xe diễu hành mini, pháo giấy, trống lắc, vòng tay phát sáng, đèn lồng trăng, ngôi sao giấy.
- **97–120:** đèn lồng hoa sen, đèn lồng cá chép, đèn lồng ngôi sao, đầu rồng múa hội, trống lân, quạt múa, cờ lễ hội, vòng nguyệt quế mùa đông, chuông gió lễ hội, bánh quy Noel, bánh fruitcake, ngôi nhà gừng, cây kẹo mút Noel, vớ treo quà, xe tuần lộc, mũ tốt nghiệp, bằng khen trống, pháo giấy kim tuyến, bóng bay số, bánh cupcake Halloween, mặt nạ ma, lồng đèn ma, trứng Phục Sinh sơn màu, giỏ hoa mùa xuân.

---

### 24. Nhạc cụ (`instruments`)

**Prompt chuẩn:**

```text
A 5x5 contact sheet grid of 25 distinct individual slots featuring stylized game assets of musical instruments in isometric 3D render style: classical violin, orchestral viola, acoustic cello, double contrabass, classical nylon guitar, acoustic wooden guitar, electric solid-body guitar, electric bass guitar, wooden ukulele, country banjo, teardrop mandolin, concert pedal harp, ancient classical lyre, renaissance lute, Indian sitar, Japanese shamisen, Japanese koto zither, Chinese guzheng, Chinese erhu fiddle, Chinese pipa lute, Vietnamese dan bau monochord, Vietnamese dan tranh zither, Vietnamese dan nguyet moon lute, Vietnamese dan tam lute, and one special rare glowing golden magical instrument or legendary musical masterpiece creatively designed for this theme at slot 25. Centered on solid flat background color #f2e8ff, no gradients, no patterns, smooth clean lighting, soft drop shadows, high detail, vibrant colors, clean sharp edges, cute stylized musical instruments, polished varnished tone wood, gleaming brass and silver alloys, delicate strings, no text, no borders, no watermark, each item fully contained inside its own square cell with generous plain margins and gutters, no overlapping, no items crossing cell boundaries --ar 1:1
```

- **Thẻ đặc biệt:** AI tự do sáng tạo 1 thẻ đặc biệt ở ô `[5, 5]` của mỗi lô (lưu vào `special/<slug>.webp`).
- **01–24:** violin, viola, cello, contrabass, guitar cổ điển, guitar acoustic, guitar điện, guitar bass, ukulele, banjo, mandolin, harp, lyre, lute, sitar, shamisen, koto, guzheng, erhu, pipa, đàn bầu, đàn tranh, đàn nguyệt, đàn tam.
- **25–48:** đàn tỳ bà Việt, đàn nhị, đàn hồ, đàn tính, đàn đáy, đàn goong, trống cái, trống cơm, trống lẫy, trống snare, trống bass, tom-tom, conga, bongo, djembe, cajón, timpani, tambourine, maracas, claves, castanets, triangle, cowbell, agogô.
- **49–72:** vibraphone, marimba, xylophone, glockenspiel, chuông ống, handpan, steelpan, trống taiko, trống bodhrán, trống frame, trống lục lạc, wood block, sáo trúc, sáo ngang concert, piccolo, recorder, ocarina, pan flute, shakuhachi, sáo mèo, sáo bầu, kèn harmonica, kèn accordion hơi, kèn melodica.
- **73–96:** clarinet, bass clarinet, oboe, bassoon, saxophone alto, saxophone tenor, saxophone baritone, trumpet, cornet, flugelhorn, trombone, tuba, French horn, kèn euphonium, kèn suona, kèn sheng, kèn bagpipe, kèn didgeridoo, synthesizer, keyboard điện tử, piano điện, organ điện tử, drum machine, sampler pad.
- **97–120:** MIDI controller, DJ turntable, theremin, keytar, electronic wind instrument, guitar synthesizer, bass synthesizer, digital piano, electronic tabla, cồng chiêng Tây Nguyên, đàn t’rưng, k’ni, đàn klông pút, đàn chapi, đàn kora, balafon, kalimba, mbira, oud, qanun, santur, đàn dulcimer, đàn rebab, đàn sarangi.

---

### 25. Huyền bí (`mystery`)

**Prompt chuẩn:**

```text
A 5x5 contact sheet grid of 25 distinct individual slots featuring stylized game assets of mythical creatures and mysterious wonders in isometric 3D render style: cloud dragon, icy frost phoenix, forest unicorn, majestic griffin, cute baby kraken, ancient stone sphinx, luminescent mermaid, nine-tailed celestial fox, giant mythical roc bird, gentle basilisk, magic brass genie lamp, glowing prophecy crystal orb, ancient portal keystone, solar eclipse mask, mystical hourglass of time, memory crystal shard, floating self-opening ancient grimoire, fairy wooden tree door, floating castle on clouds, bioluminescent enchanted mushroom forest, ghost ship in clouds, glowing quantum vortex gate, alien monolith artifact, galaxy egg container, and one special rare glowing cosmic singularity relic or legendary mysterious wonder creatively designed for this theme at slot 25. Centered on solid flat background color #17112d, no gradients, no patterns, smooth clean lighting, soft drop shadows, high detail, vibrant colors, clean sharp edges, stylized mysterious fantasy and sci-fi relics, ethereal glowing violet runes, enchanted crystals, no text, no borders, no watermark, each item fully contained inside its own square cell with generous plain margins and gutters, no overlapping, no items crossing cell boundaries --ar 1:1
```

- **Thẻ đặc biệt:** AI tự do sáng tạo 1 thẻ đặc biệt ở ô `[5, 5]` của mỗi lô (lưu vào `special/<slug>.webp`).
- **01–24:** rồng mây, phượng hoàng băng, kỳ lân rừng, griffin, kraken con, nhân sư, người cá phát sáng, cáo chín đuôi, chim roc, basilisk hiền, đèn thần, quả cầu tiên tri, chìa khóa cổng cổ, mặt nạ nguyệt thực, đồng hồ cát thời gian, tinh thể ký ức, sách cổ tự mở, cánh cửa thần tiên, lâu đài trên mây, rừng nấm phát sáng, tàu ma trên mây, cổng lượng tử bí ẩn, khối đá alien, quả trứng thiên hà.
- **25–48:** chimera, minotaur hiền, centaur, satyr, faun nhỏ, golem pha lê, golem rêu, người sói hiền, ma cà rồng thân thiện, yêu tinh goblin hiền, elf rừng, nàng tiên nước, sprite sao, pixie phát sáng, troll đá, yeti tuyết, quái vật hồ sâu, rắn biển cổ, quỷ đèn lồng hiền, ngựa kelpie, hippogriff, quái thú manticore, kirin phương Đông, rồng ouroboros.
- **49–72:** bản đồ sao cổ bí ẩn, la bàn linh hồn, hộp nhạc ma thuật, gương cổng chiều, chuông gió linh thiêng, bùa mắt thần, vòng tròn đá rune, tượng đá biết nói, viên đá mặt trăng, hòn đá triết gia, mảnh thiên thạch bí ẩn, khối lập phương thời gian, đĩa bay cổ, lọ đom đóm linh hồn, lồng đèn ma trơi, chìa khóa xương, hộp bí mật đa diện, đồng xu lời nguyền, vương miện cổ tích, vương trượng mặt trăng, mặt nạ cáo thần, đàn hạc pha lê, cổng đá rêu, quả cầu tuyết vũ trụ.
- **73–96:** làng nấm cổ tích, cây cổ thụ có cửa sổ, giếng ước nguyện, cầu vồng đêm, thác nước phát quang, hồ gương, đảo bay, hòn đảo rồng, hang pha lê, mê cung hàng rào ma thuật, lâu đài trôi nổi, tháp đồng hồ bí ẩn, thư viện vô tận, ga tàu ma, con đường gạch sao, rừng đom đóm, sa mạc kính, núi mặt trăng, cánh đồng tinh thể, biển mây, bầu trời hai mặt trăng, vườn thiên thạch, thành phố dưới mái vòm, đài quan sát cổ.
- **97–120:** robot cổ đại, trí tuệ nhân tạo trong quả cầu, cổng dịch chuyển thời gian, tàu thăm dò bị bỏ quên, hành tinh pha lê, mặt trăng có vòng, thiên hà trong chai, lỗ sâu thân thiện, tín hiệu vô tuyến bí ẩn, vệ tinh ma, phòng thí nghiệm bị phủ rêu, sinh vật năng lượng, alien đèn lồng, alien rêu, bóng ma hologram, bộ xương robot, đồng hồ bỏ túi xuyên thời gian, máy đánh chữ tiên tri, kính vạn hoa lượng tử, hộp ký ức, cây máy phát sáng, cánh cổng số sao, đám mây biết nói, quả trứng máy.

---

# Các chủ đề khác

### Mặc định (`default`)

- **Nguồn:** Bộ sưu tập 1.000 ảnh WebP legacy trong `public/assets/images/themes/default/`. Không dùng prompt tạo mới.

### Chữ cái (`alphabet`)

- **Quy cách sinh:** SVG sinh trực tiếp từ 26 ký tự A–Z. Mỗi ký tự là khối đồ chơi 3D xanh–tím; màu cố định theo giá trị. Không cần prompt ảnh.

### 2 Số (`numbers-2`)

- **Quy cách sinh:** SVG sinh trực tiếp từ các số 10–99 (90 giá trị). Mỗi giá trị hiển thị trên bảng số điện tử xanh ngọc; màu cố định theo giá trị. Không cần prompt ảnh.

### 3 Số (`numbers-3`)

- **Quy cách sinh:** SVG sinh trực tiếp từ các số 100–999 (900 giá trị). Mỗi giá trị hiển thị trên bảng số điện tử xanh ngọc; màu cố định theo giá trị. Không cần prompt ảnh.

### Ký hiệu máy tính (`computer-symbols`)

- **Quy cách sinh:** SVG sinh trực tiếp từ 30 ký hiệu máy tính (`+`, `-`, `×`, `÷`, `=`, `≠`, `<`, `>`, `≤`, `≥`, `%`, `#`, `@`, `&`, `|`, `^`, `~`, `_`, `/`, `\`, `(`, `)`, `[`, `]`, `{`, `}`, `*`, `!`, `?`, `:`, `;`). Mỗi ký hiệu hiển thị như phím chức năng xanh đậm; màu cố định theo giá trị. Không cần prompt ảnh.
