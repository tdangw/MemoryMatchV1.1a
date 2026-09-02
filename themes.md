# Kế hoạch asset chủ đề

> **Ghi chú mở rộng / Backlog quy hoạch tương lai:** `electronics` (Thiết bị điện tử), `kitchenware` (Dụng cụ nhà bếp), `mushrooms` (Nấm), `succulents` (Cây mọng nước), `nuts` (Các loại hạt)

# PROMPT MASTER — NỀN PHẲNG, BIẾN TIỂU CẢNH

Dùng prompt master này cho mọi lô 24 thẻ thường + 1 thẻ đặc biệt. Mỗi lô vẫn giữ danh sách 24 mẫu hiện có, nhưng tạo qua hai sheet 4×4: sheet A gồm 16 mẫu đầu; sheet B gồm 8 mẫu còn lại, 1 thẻ đặc biệt và 7 ô trống. Thay biến trong ngoặc vuông trước khi tạo ảnh; không để biến còn sót trong prompt gửi AI.

| Biến                         | Nội dung thay thế                                                                                                               |
| :--------------------------- | :------------------------------------------------------------------------------------------------------------------------------ |
| `[THEME]`                    | Tên nhóm nội dung bằng tiếng Anh, ví dụ `land animals`.                                                                         |
| `[SHEET_SUBJECTS]`           | Đúng 16 mô tả cho sheet A, hoặc 8 mô tả cho sheet B, theo thứ tự trái sang phải, trên xuống dưới.                               |
| `[STYLE]` / `[STYLE_FINISH]` | Phong cách và bề mặt được chọn trong thư viện bên dưới.                                                                         |
| `[BACKGROUND_HEX]`           | Màu nền của chủ đề trong bảng palette.                                                                                          |
| `[SCENE_MODE]`               | Chọn nguyên văn một trong hai giá trị `MICRO_PROP_RULE` hoặc `MINI_SCENE_RULE` bên dưới.                                        |
| `[MICRO_PROP]`               | Đạo cụ/cảnh phụ phù hợp chủ đề, ví dụ `a small mossy rock`, `three coffee beans`, `a tiny music stand`; có thể là `none`.       |
| `[SPECIAL_BRIEF]`            | Thẻ đặc biệt đúng chủ đề, ví dụ `rare legendary hybrid land animal`, `golden museum heirloom`, `magical masterwork instrument`. |

```text
A 4x4 contact sheet of square, borderless game-asset cells for [THEME] in [STYLE] style. Place [SHEET_SUBJECTS] in the first slots, left to right and top to bottom. For sheet B, place one special rare [SPECIAL_BRIEF] immediately after the eight normal subjects; every remaining slot must be completely blank flat background. [SCENE_MODE]

Layout contract: the generated source is 1254×1254. Use four 289–300px square content cells per axis, clear empty gutters between cells, and an empty outer margin. Gutters and margins must be the same single solid flat background color [BACKGROUND_HEX]; they are blank space, not visible frames. Every main subject, shadow and prop stays entirely inside the central 60% safe area of its own cell, with at least 20% clear margin from that cell's measured edge. No cropping, cutoff, overlap, or pixel of subject/shadow/prop in any gutter. Use varied front, side, three-quarter, high, and low views where natural; neighboring subjects must not repeat the same pose or facing direction. Use gentle, natural distinct expressions only. Make subjects instantly distinguishable through silhouette, color, material, pattern, size, or viewing angle. No gradients, patterns, full landscape, text, labels, watermark, logo, borders, frames, or UI icons. Soft clean studio lighting, restrained contact shadows, high detail, vibrant colors, clean sharp edges, [STYLE_FINISH] --ar 1:1
```

Chọn **một** giá trị cho `[SCENE_MODE]`:

```text
MICRO_PROP_RULE: Add at most one tiny, low [MICRO_PROP] only when it improves recognition. It occupies less than 20% of the cell, stays beside or beneath the subject, and does not read as a scene.
```

```text
MINI_SCENE_RULE: Add one small, low, theme-appropriate vignette using [MICRO_PROP] to make the card more beautiful. It occupies at most 30% of the cell, remains below or behind the subject, leaves the solid background clearly dominant, and never becomes a full environment.
```

1. [STYLE] = isometric 3D render
   [STYLE_FINISH] = cute stylized isometric 3D render, clay toy finish, soft fur textures, smooth clean plastic look, charming chibi proportions
2. [STYLE] = cute chibi 3D render
   [STYLE_FINISH] = cute stylized clay toy finish, soft fur textures, big head tiny body, soft pastel shading, charming chibi proportions, smooth rounded edges
3. [STYLE] = realistic photography, photorealistic
   [STYLE_FINISH] = photorealistic, ultra detailed, natural textures, realistic lighting, 8k detail, true-to-life materials
4. [STYLE] = hand-drawn watercolor illustration
   [STYLE_FINISH] = hand-drawn watercolor illustration, soft paper texture, gentle brush strokes, light watercolor wash, charming storybook style
5. [STYLE] = anime illustration
   [STYLE_FINISH] = anime illustration, vibrant anime colors, clean lineart, cel shading, soft anime shading, expressive cute style
6. LOW-POLY 3D - GỌN SẠCH, TRENDY
   [STYLE] = low-poly 3D render
   [STYLE_FINISH] = low-poly 3D render, faceted geometric shapes, clean flat shading, minimalist, soft matte finish
   Dùng cho: vehicles, đồ dùng - nhìn rất game.

7. PAPERCRAFT / ORIGAMI - GIẤY GẤP
   [STYLE] = papercraft origami style
   [STYLE_FINISH] = papercraft origami style, folded paper texture, soft paper shadows, charming handmade paper craft
   Dùng cho: animals, flowers - cực cute, phân biệt dễ.

8. PIXAR / DISNEY 3D - HOẠT HÌNH BOM TẤN
   [STYLE] = Pixar style 3D render
   [STYLE_FINISH] = Pixar style 3D render, Disney Pixar character style, soft subsurface scattering, expressive eyes, fluffy fur, highly detailed
   Dùng cho: animals-land, sea - bản cao cấp hơn chibi.

9. VOXEL ART - KHỐI VUÔNG MINECRAFT
   [STYLE] = voxel art 3D
   [STYLE_FINISH] = voxel art 3D, cubic blocks, Minecraft style, soft lighting, charming blocky finish
   Dùng cho: vehicles, kitchen tools - phân biệt cực tốt.

10. FLAT VECTOR STICKER - STICKER PHẲNG
    [STYLE] = flat vector sticker illustration
    [STYLE_FINISH] = flat vector sticker illustration, bold thick outline, flat colors, soft drop shadow, kawaii sticker style
    Dùng cho: drinks, fruits, juices - nhìn là muốn bóc dán, bán rất chạy.

11. CLAYMATION / PLASTICINE - ĐẤT NẶN
    [STYLE] = claymation plasticine style
    [STYLE_FINISH] = claymation plasticine style, handmade clay texture, fingerprints visible, soft squishy look, Aardman style
    Dùng cho: animals, food - mềm mềm rất yêu.

12. GHIBLI / WATERCOLOR ANIME - GHIBLI
    [STYLE] = Studio Ghibli watercolor style
    [STYLE_FINISH] = Studio Ghibli watercolor style, soft dreamy watercolor, hand-painted background, warm cozy lighting
    Dùng cho: flowers, forest animals - đẹp mơ màng.

13. KAWAII PASTEL - PASTEL NHẬT SIÊU CUTE
    [STYLE] = kawaii pastel 3D
    [STYLE_FINISH] = kawaii pastel 3D, ultra cute pastel colors, big sparkling eyes, soft blush cheeks, extremely cute
    Dùng cho: drinks, desserts, baby animals - hút nữ.

14. WOODEN TOY - ĐỒ CHƠI GỖ
    [STYLE] = wooden toy style
    [STYLE_FINISH] = wooden toy style, smooth varnished wood grain, carved wooden toy, natural wood texture, charming handcrafted
    Dùng cho: vehicles, animals - ấm, sạch, premium.
15. GLASS / CRYSTAL - THỦY TINH PHA LÊ
    [STYLE] = translucent glass sculpture
    [STYLE_FINISH] = translucent glass sculpture, crystal clear, refractive glass material, soft caustics, shiny polished
    Dùng cho: thẻ đặc biệt special, drinks cao cấp.

Tài liệu này là nguồn theo dõi duy nhất cho toàn bộ chủ đề thẻ trong game. Mục tiêu là định hình phong cách đồng bộ, tránh lặp đối tượng giữa các chủ đề ảnh, lưu prompt chuẩn hóa 6 quy tắc và kiểm tra nhanh tiến độ.

## Quy ước chung

- **Quy cách lô:** Mỗi lô giữ 24 thẻ thường khác nhau, xuất ở kích thước 256×256 px, qua hai sheet nguồn 4×4: A có 16 thẻ đầu; B có 8 thẻ cuối, một thẻ đặc biệt và 7 ô trống. Mục tiêu V2 là **120 ảnh thường cho mỗi chủ đề ảnh**, chia thành 5 lô theo thứ tự: `01–24`, `25–48`, `49–72`, `73–96`, `97–120`. Asset mới dùng tên mô tả ASCII dạng `kebab-case.webp` (ví dụ `red-panda.webp`).
- **Thẻ đặc biệt theo từng lô:** Sheet B đặt thẻ đặc biệt ở ô thứ 9, sau tám thẻ thường; bảy ô còn lại bắt buộc trống. Một chủ đề hoàn chỉnh 5 lô sẽ tạo ra 5 thẻ đặc biệt độc đáo.
- **Lưu trữ thẻ đặc biệt:** Thẻ đặc biệt được lưu trong thư mục con `special/` của từng chủ đề với tên mô tả `kebab-case.webp` (ví dụ `public/assets/images/themes/animals-land/special/golden-horned-lion.webp`). Trình tạo manifest quét đệ quy toàn bộ thư mục chủ đề, nên mọi WebP trong `special/` hoặc thư mục con khác đều có thể được dùng trong pool runtime. Ảnh nằm trong thư mục tên `special/` được gắn cờ `special: true`; khi ghép đúng cặp, điểm sau Combo nhận thêm 50%.
- **Hướng sáng tạo thẻ đặc biệt:** AI tự do sáng tạo thẻ đặc biệt tại ô [5, 5] dựa trên chủ đề của lô đang tạo (sinh vật lai hiếm, phiên bản huyền thoại, tổ hợp độc đáo, chi tiết nạm vàng/ngọc...). Không gán cứng tên đối tượng trong prompt để có thể tái sử dụng prompt cho mọi lô.
- **Quy tắc cắt bắt buộc:** Không dùng tọa độ quy ước trong prompt để cắt. Sau khi kiểm tra sheet vuông, đo biên thật của từng ô và gutter trên chính ảnh nguồn; chỉ cắt một vùng vuông theo biên đã đo, rồi resize riêng thành WebP 256×256. Trước khi xuất cả sheet, cắt thử bốn góc và ít nhất một ô giữa; loại sheet nếu có pixel chủ thể, bóng hoặc tiểu cảnh chạm biên vùng cắt/gutter.
- Không đưa ảnh nguồn vào `public/assets/`. Lưu sheet nguồn ở vị trí tạm/ngoài runtime đã thống nhất khi bắt đầu tạo, rồi kiểm tra trước khi cắt.
- Chỉ đánh dấu **Hoàn thành** sau khi có đủ WebP 256×256 đạt chuẩn và chạy `npm run assets:sync`.

---

## Checklist dùng Prompt Master

- Chia đúng danh sách 24 mẫu thành 16 mẫu ở sheet A và 8 mẫu ở sheet B; không thay đổi danh sách gốc trong tài liệu.
- Chỉ dùng **một** trong hai chế độ: `MICRO_PROP_RULE` hoặc `MINI_SCENE_RULE`; tiểu cảnh không được thành nền phong cảnh.
- Giữ lưới 4×4, gutter trống rõ, không chữ/nhãn/logo và luôn kết thúc bằng `--ar 1:1`.
- Trước khi cắt, kiểm tra sheet vuông, đo biên/gutter thật và kiểm tra pixel sát mọi biên; sau đó kiểm tra WebP 256×256 đại diện đầu, giữa, cuối lô.

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
| `animals-land`         | Động vật trên cạn      | Ảnh WebP    | Hoàn thành   |   120/120 | [Chi tiết](#1-động-vật-trên-cạn-animals-land)       |
| `animals-air`          | Động vật trên không    | Ảnh WebP    | Sắp có       |     0/120 | [Chi tiết](#2-động-vật-trên-không-animals-air)      |
| `animals-sea`          | Động vật dưới biển     | Ảnh WebP    | Sắp có       |     0/120 | [Chi tiết](#3-động-vật-dưới-biển-animals-sea)       |
| `foods`                | Đồ ăn                  | Ảnh WebP    | Đang mở rộng |     0/120 | [Chi tiết](#4-đồ-ăn-foods)                          |
| `drinks`               | Đồ uống                | Ảnh WebP    | Đang mở rộng |     0/120 | [Chi tiết](#5-đồ-uống-drinks)                       |
| `fruits`               | Trái cây               | Ảnh WebP    | Đang mở rộng |     0/120 | [Chi tiết](#6-trái-cây-fruits)                      |
| `vegetables`           | Rau củ                 | Ảnh WebP    | Đang mở rộng |     0/120 | [Chi tiết](#7-rau-củ-vegetables)                    |
| `nature`               | Thiên nhiên            | Ảnh WebP    | Đang mở rộng |     0/120 | [Chi tiết](#8-thiên-nhiên-nature)                   |
| `flowers`              | Hoa                    | Ảnh WebP    | Đang mở rộng |     0/120 | [Chi tiết](#9-hoa-flowers)                          |
| `trees`                | Cây                    | Ảnh WebP    | Sắp có       |     0/120 | [Chi tiết](#10-cây-trees)                           |
| `leaves`               | Lá                     | Ảnh WebP    | Sắp có       |     0/120 | [Chi tiết](#11-lá-leaves)                           |
| `geometry`             | Hình học               | Ảnh WebP    | Đang mở rộng |     0/120 | [Chi tiết](#12-hình-học-geometry)                   |
| `cyberpunk`            | Cyberpunk              | Ảnh WebP    | Đang mở rộng |     0/120 | [Chi tiết](#13-cyberpunk-cyberpunk)                 |
| `magic-rpg`            | RPG phép thuật         | Ảnh WebP    | Đang mở rộng |     0/120 | [Chi tiết](#14-rpg-phép-thuật-magic-rpg)            |
| `space`                | Vũ trụ                 | Ảnh WebP    | Đang mở rộng |     0/120 | [Chi tiết](#15-vũ-trụ-space)                        |
| `household`            | Vật dụng gia đình      | Ảnh WebP    | Đang mở rộng |     0/120 | [Chi tiết](#16-vật-dụng-gia-đình-household)         |
| `office-supplies`      | Đồ dùng văn phòng      | Ảnh WebP    | Đang mở rộng |     0/120 | [Chi tiết](#17-đồ-dùng-văn-phòng-office-supplies)   |
| `garden-tools`         | Dụng cụ làm vườn       | Ảnh WebP    | Đang mở rộng |     0/120 | [Chi tiết](#18-dụng-cụ-làm-vườn-garden-tools)       |
| `fashion`              | Thời trang & phụ kiện  | Ảnh WebP    | Đang mở rộng |     0/120 | [Chi tiết](#19-thời-trang--phụ-kiện-fashion)        |
| `vehicles`             | Phương tiện giao thông | Ảnh WebP    | Đang mở rộng |     0/120 | [Chi tiết](#20-phương-tiện-giao-thông-vehicles)     |
| `historical-artifacts` | Cổ vật lịch sử         | Ảnh WebP    | Đang mở rộng |     0/120 | [Chi tiết](#21-cổ-vật-lịch-sử-historical-artifacts) |
| `spy-gadgets`          | Thiết bị gián điệp     | Ảnh WebP    | Đang mở rộng |     0/120 | [Chi tiết](#22-thiết-bị-gián-điệp-spy-gadgets)      |
| `festivals`            | Lễ hội                 | Ảnh WebP    | Đang mở rộng |     0/120 | [Chi tiết](#23-lễ-hội-festivals)                    |
| `instruments`          | Nhạc cụ                | Ảnh WebP    | Sắp có       |     0/120 | [Chi tiết](#24-nhạc-cụ-instruments)                 |
| `mystery`              | Huyền bí               | Ảnh WebP    | Sắp có       |     0/120 | [Chi tiết](#25-huyền-bí-mystery)                    |
| `alphabet`             | Chữ cái                | SVG sinh mã | Hoàn thành   |     48/48 | [Chi tiết](#chữ-cái-alphabet)                       |
| `numbers-2`            | 2 Số                   | SVG sinh mã | Hoàn thành   |     96/96 | [Chi tiết](#2-số-numbers-2)                         |
| `numbers-3`            | 3 Số                   | SVG sinh mã | Hoàn thành   |   900/900 | [Chi tiết](#3-số-numbers-3)                         |
| `computer-symbols`     | Ký hiệu máy tính       | SVG sinh mã | Hoàn thành   |     48/48 | [Chi tiết](#ký-hiệu-máy-tính-computer-symbols)      |

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

[Quay lại](#bảng-tiến-độ)

### 1. Động vật trên cạn (`animals-land`)

**Thiết lập Prompt Master:**

- `[THEME]`: `land animals`
- `[BACKGROUND_HEX]`: `#f6f0e5`
- `[STYLE]` / `[STYLE_FINISH]`: `isometric 3D render` / `cute stylized clay toy finish, soft fur textures, charming chibi proportions`
- `[SCENE_MODE]` / `[MICRO_PROP]`: `MINI_SCENE_RULE` / `a restrained species-appropriate earth, grass, rock, mud, bark, or leaf-litter contact base; varied natural viewing angles and no repeated neighboring pose or facing direction`
- `[SPECIAL_BRIEF]`: `mythical or hybrid land animal`
- **01–24:** elephant, tiger, lion, rabbit, fox, giant panda, giraffe, monkey, sloth, zebra, hedgehog, alpaca, red panda, beaver, pangolin, tapir, capybara, rhinoceros, hippopotamus, camel, wolf, deer, wild boar, tortoise.
- **25–48:** cheetah, leopard, snow leopard, lynx, serval cat, hyena, meerkat, mongoose, skunk, ferret, marten, dhole, arctic fox, fennec fox, corgi dog, shiba inu, husky dog, dachshund, bengal cat, maine coon cat, scottish fold cat, sheep, mountain goat, american bison.
- **49–72:** dairy cow, water buffalo, foal horse, donkey, llama, yak, gazelle, wildebeest, saiga antelope, spotted deer, moose, reindeer, mini pig, ring-tailed lemur, guinea pig, hamster, chinchilla, red squirrel, marmot, kangaroo, armadillo, giant anteater, salamander, axolotl.
- **73–96:** chameleon, monitor lizard, toad, tree frog, newt, box turtle, sulcata tortoise, gecko, corn snake, cobra snake, ball python, green iguana, tarantula spider, rhinoceros beetle, stick insect, praying mantis, ladybug, worker ant, cricket, caterpillar, african pygmy hedgehog, echidna, aardvark, wombat.
- **97–120:** baby koala, quokka, possum, red kangaroo, wallaby, european badger, wolverine, pine marten, sable, civet, genet, binturong, coati, kinkajou, peccary, brazilian tapir, babirusa, okapi, bongo antelope, oryx, kudu, alpine ibex, markhor, pronghorn.

---

[Quay lại](#bảng-tiến-độ)

### 2. Động vật trên không (`animals-air`)

**Thiết lập Prompt Master:**

- `[THEME]`: `aerial animals and birds`
- `[BACKGROUND_HEX]`: `#e8f5ff`
- `[STYLE]` / `[STYLE_FINISH]`: `isometric 3D render` / `cute stylized clay toy finish, smooth feather and wing details, charming chibi proportions`
- `[SCENE_MODE]` / `[MICRO_PROP]`: `MINI_SCENE_RULE` / `a tiny branch, feather, or soft cloud`
- `[SPECIAL_BRIEF]`: `mythical or legendary flying bird or insect`
- **01–24:** eagle, owl, macaw parrot, toucan, peacock, flamingo, swallow, kingfisher, hummingbird, fruit bat, butterfly, dragonfly, bumblebee, hornbill, sparrow, pigeon, seagull, pelican, parakeet, falcon, golden eagle, snowy owl, flying ladybug, vulture.
- **25–48:** andean condor, albatross, plover, spotted dove, magpie, oriental magpie-robin, laughingthrush, swift, coucal, watercock, flame kingfisher, woodpecker, hoopoe, starling, goldfinch, scarlet tanager, sunbird, flowerpecker, golden pheasant, silver pheasant, flying swan, wild goose, mallard duck, white egret.
- **49–72:** grey heron, ibis, crowned crane, red-crowned crane, secretary bird, osprey, peregrine falcon, red-tailed hawk, tern, puffin, cormorant, black-headed gull, sand martin, bohemian waxwing, northern cardinal, blue jay, european robin, finch, canary, lovebird, cockatiel, cockatoo, rainbow lorikeet, sun conure.
- **73–96:** long-eared bat, vampire bat, flying fox, ghost bat, horseshoe bat, honeybee, hornet, parasitic wasp, robber fly, hoverfly, crane fly, monarch butterfly, blue morpho butterfly, swallowtail butterfly, luna moth, atlas moth, damselfly, darner dragonfly, cicada, jewel beetle, shield bug, orchid mantis, green grasshopper, desert locust.
- **97–120:** ruby-throated hummingbird, anna's hummingbird, sword-billed hummingbird, common kingfisher, blue peacock, keel-billed toucan, african grey parrot, eclectus parrot, sulphur-crested cockatoo, bald eagle, sea eagle, eagle owl, barn owl, short-eared owl, black vulture, frigatebird, red-tailed tropicbird, house sparrow, rock dove, cuckoo, eurasian hoopoe, european roller, bee-eater, pheasant-tailed jacana.

---

[Quay lại](#bảng-tiến-độ)

### 3. Động vật dưới biển (`animals-sea`)

**Thiết lập Prompt Master:**

- `[THEME]`: `sea creatures`
- `[BACKGROUND_HEX]`: `#dff4f5`
- `[STYLE]` / `[STYLE_FINISH]`: `isometric 3D render` / `cute stylized clay toy finish, smooth glossy aquatic textures, charming chibi proportions`
- `[SCENE_MODE]` / `[MICRO_PROP]`: `MINI_SCENE_RULE` / `a small sand patch, shell, or coral fragment`
- `[SPECIAL_BRIEF]`: `glowing or mythical sea creature`
- **01–24:** dolphin, seal, penguin, sea turtle, beluga whale, seahorse, octopus, squid, jellyfish, stingray, whale shark, clownfish, pufferfish, swordfish, hermit crab, lobster, bright orange living sea star, sea urchin, abalone, sea cucumber, sea otter, manatee, narwhal, brain coral.
- **25–48:** hammerhead shark, reef shark, tiger shark, blue whale, humpback whale, sperm whale, bottlenose dolphin, spotted dolphin, orca killer whale, bowhead whale, spinner dolphin, dugong, walrus, sea lion, fur seal, leatherback turtle, green sea turtle, manta ray, spotted eagle ray, sailfish, blue marlin, bluefin tuna, mahi-mahi, harbor porpoise.
- **49–72:** ocellaris clownfish, blue tang, yellow butterflyfish, emperor angelfish, porcupinefish, lionfish, zebra lionfish, moray eel, electric eel, giant grouper, eagle ray, anglerfish, coelacanth, leafy seadragon, weedy seadragon, leatherjacket fish, striped sea bass, pomfret, herring, sardine, mackerel, mako shark, nurse shark, goblin shark.
- **73–96:** blue-ringed octopus, giant pacific octopus, giant squid, vampire squid, cuttlefish, moon jellyfish, lion's mane jellyfish, box jellyfish, sea sponge, sunflower sea star, brittle star, purple sea urchin, sea chestnut, table coral, sea fan coral, staghorn coral, sea anemone, pearl oyster, scallop, geoduck clam, giant clam, japanese spider crab, blue swimming crab, king crab.
- **97–120:** spiny lobster, american lobster, mantis shrimp, tiger prawn, harlequin shrimp, dardanus hermit crab, horseshoe crab, chambered nautilus, sea snail, nudibranch sea slug, red ribbon seadragon, pipefish, electric ray, flounder, sole fish, emperor penguin, dwarf sperm whale, risso's dolphin, pilot whale, leopard seal, elephant seal, hawksbill sea turtle, thresher shark, flashlight fish.

---

[Quay lại](#bảng-tiến-độ)

### 4. Đồ ăn (`foods`)

**Thiết lập Prompt Master:**

- `[THEME]`: `delicious dishes and food`
- `[BACKGROUND_HEX]`: `#fde4cf`
- `[STYLE]` / `[STYLE_FINISH]`: `isometric 3D render` / `cute stylized clay food toy finish, delicious glossy glaze, appetizing pastel details`
- `[SCENE_MODE]` / `[MICRO_PROP]`: `MINI_SCENE_RULE` / `a tiny plate, garnish, or a few ingredients`
- `[SPECIAL_BRIEF]`: `culinary masterpiece or royal gourmet dish`
- **01–24:** banh mi, pho bowl, bun bo hue, crispy banh xeo, fresh spring rolls, fried spring rolls, com tam broken rice, nem ran, steamed bun, ha cao dumplings, savory sticky rice, banh cuon steamed rolls, dim sum basket, sushi platter, ramen bowl, udon bowl, onigiri rice ball, kimbap roll, bibimbap stone bowl, slice of pizza, cheeseburger, taco, burrito, croissant.
- **25–48:** donut, cupcake, french fries, hot dog, pancakes, pretzel, paella, risotto, quesadilla, green salad, cheese wedge, chicken drumstick, ice cream cone, spaghetti pasta, lasagna, club sandwich, bagel, belgian waffle, churros, pumpkin soup, beef steak, roasted chicken, sweet crepe, egg tart.
- **49–72:** bun cha, hu tieu, wonton noodle soup, mi quang, banh beo, banh bot loc, banh khot, crab noodle soup, pork rib congee, yangzhou fried rice, thai hot pot, vietnamese beef stew, peking duck, shrimp tempura, takoyaki balls, gyoza dumplings, yakitori skewers, tonkatsu cutlet, pad thai, tom yum soup, indian curry, chicken tikka masala, garlic naan, samosa pastry.
- **73–96:** crispy hard taco, cheese nachos, chicken quesadilla, meat empanada, german bratwurst, french onion soup, quiche lorraine, mushroom risotto, pesto pasta, cheese ravioli, creamy mushroom soup, focaccia bread, bbq pork char siu bun, crystal shrimp dumpling, fruit tart, tiramisu slice, panna cotta, chocolate churros, caramel pudding, fried mozzarella sticks, calamari rings, pan-seared salmon, garlic butter grilled shrimp, seared scallops.
- **97–120:** macaron cookies, chocolate eclair, cheese souffle, strawberry crepe, mille-feuille pastry, goulash stew, borscht soup, shepherd's pie, fish and chips, beef pot pie, grilled chorizo sausage, seafood paella, yakisoba noodles, unadon eel bowl, japanese curry rice, okonomiyaki pancake, crab cakes, chicken satay skewers, laksa noodle soup, salted egg custard bun, strawberry waffle, baked cauliflower gratin, garlic toast, sunny-side up eggs with sausage.

---

[Quay lại](#bảng-tiến-độ)

### 5. Đồ uống (`drinks`)

> **Quy tắc phân biệt thị giác bắt buộc (Vessel & Topping Differentiation):** Để tránh người chơi nhầm lẫn giữa các loại cà phê/trà/sinh tố:
>
> - **Cà phê nóng / Espresso:** Dùng tách sứ mini có đĩa lót cho espresso; cốc sứ miệng rộng có latte art (hình trái tim/lá) cho cappuccino/latte.
> - **Cà phê đá / Phá cách:** Cà phê sữa đá VN bắt buộc phân 2 tầng (sữa đặc trắng đáy, cà phê nâu trên, đá bi); cà phê trứng có lớp bọt trứng vàng bồng bềnh; cà phê dừa có xoắn ốc cốt dừa trắng.
> - **Cacao & Sữa nóng:** Cacao nóng dùng ly gốm đỏ phủ đầy marshmallow phồng xốp; sữa nóng có làn khói bốc nghi ngút.
> - **Trà sữa & Trà trái cây:** Trà sữa dùng cốc nhựa trong suốt thấy rõ hạt trân châu đen ở đáy; trà đào/vải dùng ly highball có lát quả nổi; trà hoa cúc dùng bình trà thủy tinh thấy rõ bông cúc đang nở.
> - **Nước ép & Nước dừa:** Nước dừa nguyên quả chặt nắp có ô giấy; sinh tố có chóp kem tươi xoắn (whipped cream); nước ngọt dùng lon nhôm sủi bọt mát lạnh.

**Thiết lập Prompt Master:**

- `[THEME]`: `cute beverages in unique distinct cups, glasses, bottles, cans, and mugs`
- `[BACKGROUND_HEX]`: `#fde4cf`
- `[STYLE]` / `[STYLE_FINISH]`: `isometric 3D render` / `cute stylized clay drink toy finish, glossy glass and ceramic surfaces, refreshing liquid transparency and clear distinct cup silhouettes`
- `[SCENE_MODE]` / `[MICRO_PROP]`: `MINI_SCENE_RULE` / `a few ice cubes, fruit slices, or coffee beans`
- `[SPECIAL_BRIEF]`: `luxury layered mocktail or magical glowing beverage`
- **01–24:** boba milk tea, strawberry milkshake, fresh coconut water, matcha latte, hot cocoa with marshmallows, cafe latte, cappuccino, espresso, iced lemonade, orange juice, mango smoothie, blueberry soda, kombucha, peach iced tea, black iced tea, spiced chai latte, sparkling soda can, grape juice, apple juice, watermelon juice, soy milk, herbal flower tea, warm ginger tea, hot milk.
- **25–48:** lemon soda, strawberry soda, peach soda, apple soda, grape soda, pomegranate juice, guava juice, carrot juice, tomato juice, coconut water bottle, banana smoothie, avocado smoothie, strawberry smoothie, peach smoothie, kiwi smoothie, golden turmeric latte, almond milk, oat milk, rice milk, drinking yogurt, cold brew coffee, americano, mocha, macchiato.
- **49–72:** flat white, affogato, green tea, jasmine tea, chamomile tea, peppermint tea, hibiscus tea, honey lemon tea, taro milk tea, matcha milk tea, chocolate milk tea, oolong tea, earl grey tea, darjeeling tea, tonic water, ginger ale, root beer, cola, mineral water, electrolyte drink, sugarcane juice, herbal ginseng tea, brown rice tea, black bean tea.
- **73–96:** sweet corn milk, black sesame milk, iced chocolate cocoa, iced milk coffee, vietnamese egg coffee, coconut coffee, espresso tonic, pineapple juice, grapefruit juice, dragon fruit juice, celery juice, beetroot juice, blueberry smoothie, raspberry smoothie, passion fruit smoothie, mango lassi, strawberry lassi, kefir, kvass, ginger kombucha, lemongrass peach tea, lychee tea, cinnamon apple tea, salted plum tea.
- **97–120:** rooibos tea, pu-erh tea, masala chai, yuzu citrus tea, rosemary tea, pomelo green tea, butterfly pea flower tea, oat tea, reishi mushroom tea, boza, tepache, switchel, fruit shrub vinegar drink, aloe vera juice, pennywort juice, arrowroot drink, fresh sugarcane juice, cucumber soda, mint soda, daisy soda, hazelnut milk, cashew milk, pumpkin seed milk, mung bean milk.

---

[Quay lại](#bảng-tiến-độ)

### 6. Trái cây (`fruits`)

**Thiết lập Prompt Master:**

- `[THEME]`: `fresh fruits`
- `[BACKGROUND_HEX]`: `#fff1dc`
- `[STYLE]` / `[STYLE_FINISH]`: `isometric 3D render` / `cute stylized clay fruit toy finish, plump juicy surfaces, vibrant natural fruit textures`
- `[SCENE_MODE]` / `[MICRO_PROP]`: `MICRO_PROP_RULE` / `a tiny leaf or small fruit slice`
- `[SPECIAL_BRIEF]`: `glowing or unique hybrid fruit`
- **01–24:** red apple, green apple, banana, orange, tangerine, yellow lemon, green lime, grapefruit, green pear, juicy peach, plum, apricot, sweet cherries, strawberry, blueberries, red raspberries, blackberries, grapes, watermelon, cantaloupe melon, pineapple, mango, papaya, whole coconut.
- **25–48:** kiwi, passion fruit, dragon fruit, pomegranate, fresh fig, guava, lychee, rambutan, longan, durian, jackfruit, starfruit, persimmon, avocado, tamarind, kumquat, nectarine, gooseberry, cranberry, mulberry, date fruit, soursop, sapodilla, mangosteen.
- **49–72:** salak snake fruit, langsat, breadfruit, quince, prickly pear cactus fruit, tamarillo, black mulberry, wild strawberry, redcurrant, blackcurrant, bilberry, acai berry, yuzu, calamansi, blood orange, finger lime, feijoa, loquat, jujube red date, bael fruit, canistel egg fruit, cherimoya, sugar apple, nashi asian pear.
- **73–96:** hawthorn berry, damson plum, mirabelle plum, greengage plum, chokeberry, serviceberry, rowan berry, sea buckthorn, miracle fruit, jabuticaba, santol, ambarella, hog plum, water apple, rose apple, ugli fruit, black sapote, wild apricot, bael, garcinia fruit, mountain hawthorn, otaheite gooseberry, wild pineapple, pink guava.
- **97–120:** ackee fruit, lucuma, mangaba, marula fruit, nance fruit, yumberry, cloudberry, huckleberry, elderberry, boysenberry, loganberry, tayberry, dewberry, salmonberry, thimbleberry, baccaurea fruit, java plum, rose myrtle berry, garcinia cowa fruit, duku langsat, wampee fruit, noni fruit, governor's plum, gac fruit.
- **Special** Buddha's hand, Kiwano, Guarana, Hala fruit, Calabash, Water chestnut, Pistachio, Fresh walnut, Lotus pod, Sweet corn, Bitter melon, Eggplant, Okra, Beetroot, Black olive, Chayote, Abiu, Ginkgo nut, Nipa palm fruit, Palmyra fruit, Breadnut, Surinam cherry, Cupuacu, Macadamia nut, Peanut, Cashew apple, Barbados cherry, Velvet tamarind, Indian almond, Winter melon, Pumpkin, Garlic

---

[Quay lại](#bảng-tiến-độ)

### 7. Rau củ (`vegetables`)

**Thiết lập Prompt Master:**

- `[THEME]`: `vegetables`
- `[BACKGROUND_HEX]`: `#eef6df`
- `[STYLE]` / `[STYLE_FINISH]`: `isometric 3D render` / `cute stylized clay vegetable toy finish, fresh organic textures, earthy smooth surfaces`
- `[SCENE_MODE]` / `[MICRO_PROP]`: `MINI_SCENE_RULE` / `a tiny soil mound or small leaf`
- `[SPECIAL_BRIEF]`: `glowing or unique heirloom vegetable variety`
- **01–24:** carrot, red tomato, pumpkin, brown potato, sweet potato, yellow onion, garlic bulb, red shallot, ginger root, red radish, white daikon radish, beetroot, turnip, parsnip, cassava root, taro root, purple yam, burdock root, lotus root, water chestnut, celery, cucumber, zucchini, eggplant.
- **25–48:** broccoli, cauliflower, green cabbage, napa cabbage, curly kale, baby spinach, butterhead lettuce, bok choy, water spinach, mustard greens, swiss chard, collard greens, brussels sprouts, green asparagus, string beans, snow peas, green peas, edamame, sweet corn, bell pepper, red chili pepper, okra, artichoke, leek.
- **49–72:** fresh dill, chicory, radicchio, wild arugula, gai lan chinese broccoli, bamboo shoots, mung bean sprouts, alfalfa sprouts, bitter melon, bottle gourd, sponge luffa, chayote, winter melon, spaghetti squash, acorn squash, butternut squash, kabocha pumpkin, button mushroom, shiitake mushroom, oyster mushroom, enoki mushroom, king oyster mushroom, portobello mushroom, watercress.
- **73–96:** purple cabbage, romaine lettuce, iceberg lettuce, tatsoi, mizuna greens, komatsuna, baby bok choy, celeriac, kohlrabi, jicama root, salsify root, jerusalem artichoke, fiddlehead fern, sea kelp, nori seaweed, wakame seaweed, sugar beet, wild yam, candy cane beet, giant white radish, cherry tomatoes, tomatillo, poblano pepper, jalapeño pepper.
- **97–120:** fresh wasabi root, maca root, yacon root, konjac corm, oca root, ulluco root, mashua root, lima beans, fava beans, green lentils, fresh chickpeas, lupin beans, purple yardlong beans, black beans, red amaranth greens, purslane, jute greens, garland chrysanthemum, escarole, endive, habanero pepper, serrano pepper, cayenne pepper, shishito pepper.

---

[Quay lại](#bảng-tiến-độ)

### 8. Thiên nhiên (`nature`)

**Thiết lập Prompt Master:**

- `[THEME]`: `nature landscapes and weather icons`
- `[BACKGROUND_HEX]`: `#d8edf0`
- `[STYLE]` / `[STYLE_FINISH]`: `isometric 3D render` / `cute stylized miniature terrain dioramas, clay toy aesthetic, pristine natural landscapes`
- `[SCENE_MODE]` / `[MICRO_PROP]`: `MINI_SCENE_RULE` / `a small terrain base appropriate to the subject`
- `[SPECIAL_BRIEF]`: `glowing crystal nature wonder or floating island diorama`
- **01–24:** forested hill, river, fluffy cloud, rain cloud, lightning bolt, snowflake, sand dune, tropical island, coral reef, floating iceberg, cave entrance, geyser, aurora borealis, rocky mountain, rainbow, volcano, waterfall, crescent moon, sun, snow-dusted pine forest hill, seashell, tidepool sea star on a coastal rock, glacial peak, waterfall pool.
- **25–48:** limestone mountain, snowy mountain peak, deep canyon, babbling brook, frozen lake, lotus pond, sandy beach, stalagmites, tiny islet, sea cove, ocean cliff, meadow, savanna steppe, pine forest, bamboo grove, mangrove forest, wetland marsh, terraced rice field, green paddy field, tea hill, blue lagoon, sea fjord, star sand dune, wildflower meadow.
- **49–72:** cumulus cloud, thundercloud, raindrops, hail stones, water whirlpool, ocean waves, tidal wave, tornado whirlwind, ice bridge, golden sunset, sunrise, solar eclipse, lunar eclipse, shooting star, star constellation, ice crystal, autumn maple leaf, pinecone, large iceberg, blue glacier, lenticular cloud, ball lightning, meteor shower, total lunar eclipse behind thin clouds.
- **73–96:** polished river pebbles, crystal geode, ammonite fossil, natural beehive, dewy spiderweb, forest mushroom, tree lichen, green moss patch, four-leaf clover meadow patch, dandelion seed puffs, coral branch, sea pearl in oyster, snow crystal, morning dewdrop, mini dust devil, sunbeams through clouds, mist fog, campfire, winding river bend, lavender field, pink grass hill, misty forest, autumn red forest, rock desert.
- **97–120:** sharp rock peak, foggy valley, crater lake, ice cave, basalt columns, balancing rock, salt flat, frozen waterfall, hot thermal spring, pebble beach, shell beach, red canyon, pack ice floe, natural sinkhole, underground stream, red sand dune, coral atoll, ancient grove, lone tree, natural rock arch, mineral spring, wildflower valley, salt lake, ice gorge.

---

[Quay lại](#bảng-tiến-độ)

### 9. Hoa (`flowers`)

**Thiết lập Prompt Master:**

- `[THEME]`: `blooming flowers`
- `[BACKGROUND_HEX]`: `#eef7ef`
- `[STYLE]` / `[STYLE_FINISH]`: `isometric 3D render` / `cute stylized clay botanical toy finish, velvety flower petals, delicate vibrant blossoms`
- `[SCENE_MODE]` / `[MICRO_PROP]`: `MICRO_PROP_RULE` / `a tiny leaf, pebble, or short stem`
- `[SPECIAL_BRIEF]`: `glowing crystal or magical flower blossom`
- **01–24:** bluebell, cherry blossom, white daisy, yellow dandelion, flowering cactus, red poppy, red spider lily, carnation, blue hydrangea, purple bellflower, white chrysanthemum, petunia, gardenia, purple iris, red rose, sunflower, pink orchid, calla lily, buttercup, blooming peony, white magnolia, star jasmine, lavender, pansy.
- **25–48:** michelia alba, morning glory, camellia, phlox, field poppy, alstroemeria, english lavender, snowdrop, white lily, oxeye daisy, chamomile, campanula bellflower, gazania sun daisy, water hyacinth, wild daisy, begonia, osmanthus, night-blooming jasmine, gerbera daisy, white hydrangea, purple moss rose, aster, pink rose, bright gazania.
- **49–72:** blue daze, blue salvia, verbena, zinnia, cosmos, french marigold, mini carnation, periwinkle, portulaca moss rose, sacred lotus, water lily, yellow apricot blossom, peach blossom, plum blossom, apple blossom, pear blossom, wisteria, lilac, azalea, red camellia, black tea rose, oncidium orchid, dendrobium orchid, cymbidium orchid.
- **73–96:** bird of paradise, banana flower, king protea, milkweed, lupine, pincushion scabiosa, foxglove, jade hyacinth, sweet pea, mini sunflower, nun's orchid, japanese iris, striped tulip, climbing rose, desert rose, white peony, blue chrysanthemum, white lavender, hyacinth, oriental lily, delphinium, red amaryllis, white moth orchid, purple hydrangea.
- **97–120:** yellow rose, orange rose, purple rose, black tulip, double tulip, cattleya orchid, mokara orchid, vanda orchid, pink gerbera, orange gerbera, red hibiscus, yellow hibiscus, pink bougainvillea, purple bougainvillea, red carnation, white ranunculus, pink peony, pink lotus, purple water lily, white wisteria, red rhododendron, platycodon balloon flower, forget-me-not, heather blossom.

---

[Quay lại](#bảng-tiến-độ)

### 10. Cây (`trees`)

**Thiết lập Prompt Master:**

- `[THEME]`: `complete trees`
- `[BACKGROUND_HEX]`: `#e8f4e5`
- `[STYLE]` / `[STYLE_FINISH]`: `isometric 3D render` / `cute stylized clay miniature trees on grassy bases, lush sculpted foliage, wooden bark textures`
- `[SCENE_MODE]` / `[MICRO_PROP]`: `MINI_SCENE_RULE` / `a tiny soil mound, grass patch, or small rock`
- `[SPECIAL_BRIEF]`: `glowing celestial or ancient mythical tree`
- **01–24:** oak tree, autumn maple tree, tall mature pine tree, cypress tree, weeping willow, white birch tree, baobab tree, coconut palm tree, bamboo clump, banana tree, cacao tree, coffee plant, olive tree, lemon tree, apple tree, peach blossom tree, banyan tree, weeping fig, royal poinciana, mangrove tree, ficus bonsai, pine bonsai, potted monstera, snake plant.
- **25–48:** eucalyptus tree, sugar maple tree, chestnut tree, elm tree, fig tree, jackfruit tree, mango tree, plum tree, persimmon tree, mandarin tree, pomelo tree, jujube tree, sapodilla tree, lychee tree, longan tree, durian tree, mangosteen tree, starfruit tree, guava tree, tamarind tree, cashew tree, coconut palm, rubber tree, tea bush.
- **49–72:** cajeput tree, mangrove root tree, coastal she-oak, conifer tree, spruce tree, giant redwood, cedar tree, juniper tree, dawn redwood, larch conifer, ginkgo biloba tree, poplar tree, ash tree, linden tree, basswood tree, magnolia tree, camphor tree, bay laurel tree, southern magnolia, mountain ebony, flame tree, crape myrtle, ironwood tree, paperbark tree.
- **73–96:** red rosewood tree, black dammar tree, dipterocarp tree, acacia tree, chinaberry tree, red silk cotton tree, rain tree, weeping fig ficus, rubber fig, cluster fig, bodhi tree, lady palm, areca palm, dwarf palmetto, palmyra palm, traveler's palm, giant bird of paradise, money tree, lucky bamboo tree, corn plant, silver queen, chinese evergreen, buddhist pine bonsai, water jasmine bonsai.
- **97–120:** juniper bonsai, banyan bonsai, desmodium bonsai, apricot bonsai, sweet osmanthus bonsai, ancient olive tree, japanese maple bonsai, pomegranate bonsai, apple bonsai, flowering quince bonsai, northern red oak, japanese red maple, paper birch, golden rain tree, sacred fig tree, jacaranda tree, royal flamboyant, sandalwood tree, sweet chestnut tree, arabica coffee bush, black pepper vine, vanilla orchid vine, passionfruit vine, grapevine arbor.

---

[Quay lại](#bảng-tiến-độ)

### 11. Lá (`leaves`)

**Thiết lập Prompt Master:**

- `[THEME]`: `single leaves and botanical sprigs`
- `[BACKGROUND_HEX]`: `#edf8ef`
- `[STYLE]` / `[STYLE_FINISH]`: `isometric 3D render` / `cute stylized clay botanical toy finish, detailed leaf veins, smooth organic textures`
- `[SCENE_MODE]` / `[MICRO_PROP]`: `MICRO_PROP_RULE` / `a tiny twig or small pebble`
- `[SPECIAL_BRIEF]`: `glowing iridescent or crystal fairy leaf`
- **01–24:** monstera leaf, red maple leaf, oak leaf, fern frond, ginkgo leaf, palm frond, olive leaf, bay laurel leaf, mint sprig, basil leaf, rosemary sprig, sage leaf, perilla leaf, curly kale leaf, bamboo leaf, banana leaf, pothos leaf, philodendron leaf, calathea leaf, fittonia leaf, marble queen leaf, eucalyptus leaf, pine needles, willow branch leaf.
- **25–48:** bird's nest fern leaf, silver fern frond, round eucalyptus leaf, weeping eucalyptus leaf, japanese maple leaf, silver maple leaf, red oak leaf, white oak leaf, weeping willow leaf, mulberry leaf, wild fig leaf, tropical almond leaf, freshwater mangrove leaf, poinciana leaf, tamarind leaf, starfruit leaf, mango leaf, guava leaf, lemon leaf, orange leaf, pomelo leaf, mandarin leaf, apple leaf, peach leaf.
- **49–72:** golden pothos leaf, marble pothos leaf, heartleaf philodendron, split-leaf philodendron, variegated monstera leaf, striped calathea leaf, orbifolia calathea leaf, prayer plant leaf, alocasia elephant ear leaf, caladium leaf, giant taro leaf, spider plant leaf, snake plant leaf, silver queen leaf, zz plant leaf, chinese evergreen leaf, lucky bamboo leaf, cornstalk dracaena leaf, money tree leaf, fan palm leaf, areca palm frond, coconut frond, palmyra palm leaf, wild banana leaf.
- **73–96:** mexican mint leaf, tarragon leaf, oregano leaf, thyme sprig, dill weed, flat-leaf parsley, fresh cilantro leaf, green shiso leaf, red shiso leaf, vietnamese coriander leaf, mugwort leaf, green tea leaf, oolong tea leaf, chocolate mint leaf, spearmint leaf, holy basil leaf, dried bay leaf, purple sage leaf, lemon basil leaf, garlic chive leaf, green scallion leaf, celery leaf, baby spinach leaf, bok choy leaf.
- **97–120:** purple cabbage leaf, purple kale leaf, rainbow chard leaf, romaine lettuce leaf, iceberg lettuce leaf, wild arugula leaf, watercress leaf, mustard green leaf, napa cabbage leaf, broccoli leaf, brussels sprout leaf, water spinach leaf, sweet potato leaf, taro leaf, lotus leaf, water lily pad, wakame seaweed frond, nori seaweed sheet, sugar kelp frond, silver dollar eucalyptus leaf, spruce needle twig, cypress scale leaf, single four-leaf clover leaf, olive sprig with leaves.

---

[Quay lại](#bảng-tiến-độ)

### 12. Hình học (`geometry`)

**Thiết lập Prompt Master:**

- `[THEME]`: `3D geometric shapes`
- `[BACKGROUND_HEX]`: `#f8f3e8`
- `[STYLE]` / `[STYLE_FINISH]`: `isometric 3D render` / `cute stylized clay math blocks, smooth matte porcelain finish, vibrant playful colors`
- `[SCENE_MODE]` / `[MICRO_PROP]`: `MICRO_PROP_RULE` / `none`
- `[SPECIAL_BRIEF]`: `glowing hyperdimensional geometric polyhedral structure`
- **01–24:** cube, sphere, cylinder, cone, square pyramid, rectangular prism, hemisphere, capsule, triangular pyramid, pentagonal prism, hexagonal pyramid, octahedron, ellipsoid, blue cone frustum, orange cone frustum, pentagonal pyramid, trapezoidal prism, truncated block, star prism, torus, square bipyramid, dodecahedron, triangular prism, crescent block.
- **25–48:** equilateral triangle, right triangle, isosceles triangle, square, rectangle, trapezoid, parallelogram, rhombus, pentagon, hexagon, heptagon, octagon, decagon, circle, ellipse, semicircle, quadrant, annulus ring, five-pointed star, heart shape, arrow shape, lightning bolt shape, plus sign, multiplication cross.
- **49–72:** truncated cone, hollow pentagonal prism, notched torus, regular polyhedron, stellated octahedron, icosahedron, dodecahedral frame, helical wedge, eye polyhedron, 8-sided star block, sliced geometric block, hollow octagonal prism, symmetric circular cutout, 3d stepped staircase block, gear cog block, spiral twisted grid, stacked cylinders, complex geometric hybrid, space lattice cube, infinite mobius twist, sierpinski tetrahedron, interlocking cube sculpture, rhombic dodecahedron, parametric wave surface.
- **73–96:** fibonacci spiral, circular labyrinth, checkerboard pattern, triangle grid, hexagonal mesh, chevron pattern, zigzag pattern, polka dot pattern, tangram puzzle set, concentric circles, sine wave curve, 3d bar chart block, 3d pie chart block, kaleidoscope pattern, tree fractal, snowflake fractal, triangle tessellation, hexagon tessellation, mirror symmetry block, rotational symmetry block, pixel cube, voxel cluster, abstract molecule model, 3d infinity loop.
- **97–120:** rounded triangle, rounded square, rounded rectangle, rounded pentagon, rounded hexagon, rounded octagon, hollow box cube, hollow sphere, hollow cylinder, hollow cone, hollow pyramid, coil helix, compression spring, chain link, spur gear, honeycomb block, geodesic sphere, cubic wireframe grid, mini rubik's cube, tangram block, double helix spiral, 3d pi symbol, 3d sigma symbol, 3d delta symbol.

---

[Quay lại](#bảng-tiến-độ)

### 13. Cyberpunk (`cyberpunk`)

**Thiết lập Prompt Master:**

- `[THEME]`: `cyberpunk gadgets and robots`
- `[BACKGROUND_HEX]`: `#02051b`
- `[STYLE]` / `[STYLE_FINISH]`: `isometric 3D render` / `stylized sci-fi game assets, matte tech plastic, glowing neon cyan and magenta LED accents, metallic alloy highlights`
- `[SCENE_MODE]` / `[MICRO_PROP]`: `MINI_SCENE_RULE` / `a tiny glowing circuit base or holographic panel`
- `[SPECIAL_BRIEF]`: `glowing quantum cyber core or neon mecha relic`
- **01–24:** delivery robot, robotic cat, round scout drone, neon motorcycle helmet, AR augmented reality glasses, robotic mechanical arm, AI microchip, glowing PCB circuit board, futuristic energy battery, hologram mini speaker, neon vending machine, neon arrow sign, sci-fi motorcycle, flying hover taxi, teleportation portal gate, high-tech briefcase, cybernetic headphones, holographic keyboard, camera drone, mini orbital satellite, glowing neon cyber tree, digital LED visor mask, laser tool kit, data crystal.
- **25–48:** cleaning robot, robotic dog, hologram mechanical fish, nano insect drone, AR smart contact lens, haptic feedback glove, jet propulsion boots, glowing LED jacket, smart smartwatch, biometric wristband, neon hard drive, RAM memory stick, foldable display screen, laser mouse, optical fiber cable, charging station dock, compact 3d printer, futuristic security blast door, holographic elevator tube, neon billboard sign, neon street light pole, barista robot, neon hydroponic planter, robotic pet creature.
- **49–72:** starship control dashboard, robotic cyber foot pedal, retinal scanner lock, flying surveillance camera, hologram projector pod, neon city map display, smart cyber refrigerator, automated transit ticket kiosk, plasma energy sphere, quantum computing chip, cyber mechanic goggles, tech stealth hood, smart ring, drone audio speaker, glowing LED armband, laser multitool wrench, electronic screwdriver, nano first-aid kit, mini solar panel array, digital RFID identity card, data chip coin, circuit board necklace, retro futuristic radio, pixel LED display.
- **73–96:** robotic chef, robotic welder, dancing android robot, jet hoverboard, anti-gravity skateboard, futuristic monorail train, neon subway car, drone delivery pod, heavy cargo dropship, self-balancing monocycle, teleportation booth, 3d object scanner, nano microscope, compact weather generator, force field shield emitter, signal antenna array, server data rack, encrypted crypto block, neon biometric fingerprint smart lock, digital countdown clock, digital led dice, cybernetic mechanical tentacle, glowing cyber mushroom, neon chemical fluid vial.
- **97–120:** holographic brain core, nano blood scanner, bionic cyberware implant, quantum data storage crystal, mini relay data station, neon server tower, smart transit turnstile, laser security tripwire, mechanic safety helmet, repair drone, florist robot, rescue search android, spider drone, multirotor drone, neon beacon drone, autonomous self-driving car, holographic HUD projector, circuit diagram tablet, digital master key, encrypted cryptocurrency coin, cyber lockbox, plasma beam projector, bioluminescent cyber tree, data matrix billboard.

---

[Quay lại](#bảng-tiến-độ)

### 14. RPG phép thuật (`magic-rpg`)

**Thiết lập Prompt Master:**

- `[THEME]`: `fantasy RPG magic items`
- `[BACKGROUND_HEX]`: `#0b0b32`
- `[STYLE]` / `[STYLE_FINISH]`: `isometric 3D render` / `stylized fantasy game items, enchanted glowing runes, polished crystal gems, worn mystical leather and wood`
- `[SCENE_MODE]` / `[MICRO_PROP]`: `MINI_SCENE_RULE` / `a tiny rune stone, crystal, or mossy rock`
- `[SPECIAL_BRIEF]`: `glowing celestial or legendary enchanted magic artifact`
- **01–24:** wooden magic wand, ancient spellbook, red healing potion vial, blue mana potion vial, glowing crystal ball, pointed wizard hat, flying magic broom, cute baby dragon, miniature baby phoenix, baby unicorn, wooden treasure chest, ornate brass key, enchanted magic ring, moon amulet, glowing enchanted sword, rune carved shield, wizard staff, magical glowing mushroom, luminescent fantasy flower, purple poison mushroom, purple mana crystal, rolled treasure map scroll, brass magic lantern, stone rune portal.
- **25–48:** crystal wand, frost spellbook, fire spellbook, purple poison vial, golden elixir vial, bubbling magic cauldron, mortar and pestle, magical powder pouch, star dust broom, wizard's familiar cat, messenger owl, tiny forest sprite, flower fairy, friendly green slime, ancient stone golem, enchanted snowman, lightning staff, solar sun staff, lunar bow, rune crossbow, thunder warhammer, knight helmet, enchanted wizard robe, winged flying boots.
- **49–72:** spellcaster gloves, dragoncrest shield, frostbrand sword, ancient wooden practice sword, battleaxe, enchanted inkwell, phoenix feather quill, red dragon scale, golden dragon egg, griffin talon, unicorn horn, arcane astrology wheel, summoning ritual circle, glowing rune circle, cloud gateway, wizard tower spire, alchemist tent, mystical stone bridge, wishing stone well, talking elder tree, luminescent blue mushroom, golden apple tree, glowing moonstone, radiant sunstone.
- **73–96:** friendly mimic chest, buried treasure map, brass arcane compass, brass astral telescope, crystal key, rune locked padlock, scroll of lightning, teleportation scroll, star pendant necklace, adventurer guild badge, golden fantasy coin, cut emerald gem, glowing ruby gem, sapphire crystal, enchanted pearl, magic genie lamp, potion spray atomizer, golden enchanted apple, star sugar cookie, witch's iron teapot, glowing jack-o'-lantern lantern, crystal wind chime with floating runes, miniature fantasy castle, clover lucky charm.
- **97–120:** baby frost dragon, baby fire dragon, baby griffin, sea unicorn hippcampus, magical shadow cat, snowy messenger owl, ornate magic lamp, enchanted mirror, crystal harp, rune war drum, enchanted red apple, star candy, mega health potion, invisibility potion, lucky four-leaf potion, philosopher's stone, fire elemental orb, ice elemental orb, lightning elemental orb, grimoire of the forest, grimoire of the ocean, spirit summoning bell, ancient protection amulet, rainbow magic bridge.

---

[Quay lại](#bảng-tiến-độ)

### 15. Vũ trụ (`space`)

**Thiết lập Prompt Master:**

- `[THEME]`: `space exploration and astronomy`
- `[BACKGROUND_HEX]`: `#020819`
- `[STYLE]` / `[STYLE_FINISH]`: `isometric 3D render` / `stylized space exploration icons, glossy astronaut suits, smooth planetary textures, metallic hull finishes`
- `[SCENE_MODE]` / `[MICRO_PROP]`: `MINI_SCENE_RULE` / `a tiny asteroid fragment, dust ring, or small star sparkle`
- `[SPECIAL_BRIEF]`: `glowing mythical cosmos starship or celestial phenomenon`
- **01–24:** space rocket, cute chibi astronaut, friendly green alien, flying saucer UFO, spaceship, orbital space station, communications satellite, Mars rover explorer, blazing Sun, planet Mercury, planet Venus, planet Earth, cratered Moon, planet Mars, planet Jupiter, ringed Saturn, planet Uranus, planet Neptune, icy comet, glowing meteor, optical telescope, cosmic black hole, colorful nebula cloud, starry constellation.
- **25–48:** dwarf planet Pluto, icy moon Europa, smoggy moon Titan, volcanic moon Io, giant moon Ganymede, space shuttle orbiter, lunar lander module, planetary scout robot, lunar rover buggy, space telescope, radio telescope dish, astronomical observatory dome, parabolic dish antenna, booster rocket stage, escape capsule pod, eva astronaut spacesuit, astronaut bubble helmet, pressurized astronaut gloves, magnetic moon boots, planetary colony flag, orbital fuel depot, heavy space cargo freighter, hyperspace jump gate, zero-g sleep pod.
- **49–72:** weather monitoring satellite, orbital communication relay, GPS navigation satellite, deep space probe, recon scout probe, asteroid mining ship, icy comet fragment, burning fireball meteor, glowing shooting star, Saturn's ice rings, Jupiter's great red spot, planetary aurora borealis, solar eclipse shadow, total lunar eclipse seen from orbit, planetary orbit ring, main asteroid belt, kuiper belt object, oort cloud comet, barred spiral galaxy, elliptical galaxy, dwarf galaxy, open star cluster, white dwarf star, solar prominence arc.
- **73–96:** red dwarf star, red supergiant star, neutron star, spinning pulsar, glowing supernova explosion, supernova remnant veil, planetary nebula ring, eagle nebula pillar, cosmic dust cloud, theoretical wormhole, star gate portal, alien space crystal, astronomical clock, brass orrery solar system model, star chart map, starship navigation computer, life support oxygen scrubber, compressed oxygen tank, rocket propellant tank, astronaut multitool case, freeze-dried space food packet, zero-g hydroponic plant pod, ringed metallic asteroid, friendly purple alien.
- **97–120:** brown dwarf star, blue dwarf star, blue hypergiant star, binary star system, globular star cluster, helix nebula, reflection nebula, dark horse nebula, andromeda spiral galaxy, ring galaxy, twin-tailed comet, metallic iron asteroid, stony chondrite asteroid, cube satellite nanosat, mini scout shuttle, deep abyss explorer ship, ice rover vehicle, rotating torus space station, james webb space telescope, lunar far-side observatory, deep space radar dish, emergency oxygen backpack, orbital mechanic toolbox, space botany greenhouse.

---

[Quay lại](#bảng-tiến-độ)

### 16. Vật dụng gia đình (`household`)

> **Định vị phạm vi (Cozy Living Decor & Furniture):** Tập trung vào nội thất, chiếu sáng, đồ trang trí và tiện ích không gian sống ấm cúng.
>
> - **Không đưa vào:** Thiết bị điện tử lớn (Tivi, Tủ lạnh, Máy giặt, Điều hòa, Lò vi sóng, Máy hút bụi... dành riêng cho `electronics`); Dụng cụ nấu nướng bếp (Nồi, Chảo, Dao thớt, Máy xay, Bát đĩa ăn... dành riêng cho `kitchenware`).

**Thiết lập Prompt Master:**

- `[THEME]`: `cozy home furniture and living decor`
- `[BACKGROUND_HEX]`: `#fff6e7`
- `[STYLE]` / `[STYLE_FINISH]`: `isometric 3D render` / `cute stylized clay home decor and furniture finish, cozy pastel ceramic, soft woven fabric textures, polished natural wood`
- `[SCENE_MODE]` / `[MICRO_PROP]`: `MICRO_PROP_RULE` / `a small rug edge, low coaster, or tiny base`
- `[SPECIAL_BRIEF]`: `vintage gold-trimmed royal luxury furniture heirloom`
- **01–24:** comfortable sofa armchair, wooden coffee table, study desk lamp, vintage alarm clock, plush throw pillow, knitted wool blanket, round living room rug, standing bookshelf, wooden photo frame, ceramic flower vase, window curtains, hanging wall mirror, mini wardrobe, bedside nightstand, coat rack stand, woven rattan storage basket, wooden tissue box, tabletop potted plant, mini wind chime, moon night light, door doormat, wooden stool, floating wall shelf, potted lavender flower.
- **25–48:** rocking chair, beanbag lounge chair, vanity dressing table, round ottoman pouf, chest of drawers, shoe rack cabinet, full-length standing mirror, faux sheepskin rug, sheer voile curtains, tall standing floor lamp, bedside reading lamp, mini chandelier, rattan blanket basket, entryway key tray, pendulum wall clock, mini canvas wall art, clear glass flower vase, scented jar candle, aroma diffuser, ultrasonic room humidifier, wooden music box, animal plush cushion, sofa throw blanket, magazine holder rack.
- **49–72:** small wooden writing desk, fabric swivel chair, clip-on reading light, woven laundry hamper, standing towel rack, rolled bath towel set, non-slip bathroom mat, round bathroom mirror, wooden jewelry box, compact sewing kit, room fragrance spray, decorative wall hook, wooden curtain rod, foldable wooden room divider, mini indoor watering can, multi-tier plant stand, ceramic animal figurine, mini snow globe, sand hourglass timer, dining chair cushion, memory foam neck pillow, folded down comforter, mini wooden tea tray, dried flower bouquet.
- **73–96:** single accent sofa, end-of-bed bench, decorative console table, low buffet sideboard, corner shelf unit, wall-mounted key holder, entryway handbag hook, wooden watch box, paper lantern lamp, fairy string lights, picture spotlight lamp, glass candle holder, bohemian woven rug, wooden venetian blinds, ethnic pattern sofa cushion, blackout window drapes, toy storage basket, accessory organizer tray, secret wooden keepsake box, brass doorbell chime, hallway runner rug, hat display stand, ceramic twig vase, hanging pothos ivy pot.
- **97–120:** reading wingback chair with ottoman, decorative wooden chessboard, touch bedside nightstand lamp, vintage storm lantern, double photo frame, hexagonal wall mirror, wooden cuckoo clock, handwoven wool rug, wooden beaded door curtain, zigzag floating bookshelf, leather tissue box cover, entryway umbrella stand, indoor slipper rack, storage bench for blankets, sunburst round rug, leaf-shaped throw pillow, vintage floral quilt, mini succulent pot, wooden candle holder tray, reed diffuser bottle, crystal window wind chime, wooden makeup organizer, balcony clothes drying rack, velvet vanity stool.

---

[Quay lại](#bảng-tiến-độ)

### 17. Đồ dùng văn phòng (`office-supplies`)

**Thiết lập Prompt Master:**

- `[THEME]`: `office stationery supplies`
- `[BACKGROUND_HEX]`: `#f4faff`
- `[STYLE]` / `[STYLE_FINISH]`: `isometric 3D render` / `cute stylized stationery icons, smooth colorful plastic, crisp paper textures, polished metal clips`
- `[SCENE_MODE]` / `[MICRO_PROP]`: `MICRO_PROP_RULE` / `a single paper clip, note corner, or small desk base`
- `[SPECIAL_BRIEF]`: `gold-plated luxury executive stationery item`
- **01–24:** wooden pencil, fountain ink pen, yellow highlighter, rubber eraser, pencil sharpener, wooden ruler, craft scissors, glue stick, tape dispenser roll, paper clip, binder clip, push pin, desktop stapler, spiral notebook, blank desk calendar, accordion file folder, clipboard, mailing envelope, desk calculator, computer keyboard, optical mouse, USB thumb drive, desktop color printer, reading glasses.
- **25–48:** ballpoint pen, gel pen, whiteboard marker, technical drawing pen, wax crayon box, pencil case, fountain pen ink bottle, pen ink refill, replacement nib, plastic protractor, drawing compass, set square triangle ruler, document clipboard, mini desktop whiteboard, whiteboard eraser, round fridge magnet, push pin magnet, color sticky tab flags, sticky notes pad, carbon paper sheet, photo printing paper pack, origami craft paper pack, date stamp tool, ink stamp pad.
- **49–72:** thermal laminating machine, laminating pouch, cross-cut paper shredder, flatbed document scanner, heavy-duty photocopier, digital office projector, projection screen, HD computer webcam, headset with microphone, desktop conference microphone, flexible LED desk lamp, external hard drive, SD memory card, multi-card reader, USB hub adapter, braided charging cable, business card binder, blank business cards, desk nameplate, adjustable phone stand, ergonomic laptop stand, padded laptop sleeve, desktop computer tower, desktop LCD monitor.
- **73–96:** digital stylus pen, graphic drawing tablet, wireless ergonomic mouse, extended mouse pad, currency cash counter, thermal receipt printer, comb binding machine, plastic binding spines, clear report cover, tab divider sheets, executive presentation folder, document storage archive box, desktop paper tray, desktop bookend pair, handheld magnifying glass, clamp-on desk lamp, analog pomodoro timer, flip desk calendar, blank weekly planner, staple refill box, electric pencil sharpener, utility snap-off knife, self-healing cutting mat, glue tape roller.
- **97–120:** calligraphic dip pen, permanent marker, watercolor brush pen, water brush, watercolor paint pan, paint mixing palette, white correction tape, star-shaped sticky notes, arrow index flags, twin-wire notebook, leather journal notebook, metal document fastener, stacking letter tray, desktop bookshelf, two-hole paper punch, mini thermal bookbinder, electric hole puncher, faux leather desk blotter mat, liquid craft glue, double-sided tape, color dot label stickers, blank rubber stamp, desktop pen holder cup, clip-on reading lamp.

---

[Quay lại](#bảng-tiến-độ)

### 18. Dụng cụ làm vườn (`garden-tools`)

**Thiết lập Prompt Master:**

- `[THEME]`: `gardening tools and infrastructure`
- `[BACKGROUND_HEX]`: `#edf8d2`
- `[STYLE]` / `[STYLE_FINISH]`: `isometric 3D render` / `cute stylized garden tool assets, terracotta pottery, forged metal blades, sturdy wooden handles`
- `[SCENE_MODE]` / `[MICRO_PROP]`: `MINI_SCENE_RULE` / `a tiny soil mound, grass patch, or seedling`
- `[SPECIAL_BRIEF]`: `luxury garden workstation or all-in-one brass tool apparatus`
- **01–24:** empty terracotta planter pot, blank garden plant marker, automated watering timer, lawn broom rake, wooden plant stakes, coiled green garden hose, pruning hand saw, garden pickaxe, rotating lawn sprinkler, drip irrigation nozzle, plant tying twine roll, rubber gardening gloves, heavy-duty garden gloves, metal hand trowel, long bypass lopper, seed germination starter tray, leaf rake, grass sickle, sunshade garden netting, insect mesh net, soil moisture meter, mini glass greenhouse, analog soil thermometer, wall tool hanging rack.
- **25–48:** hand garden fork, heavy garden water pipe, bypass hand pruners, vegetable seed packet, round digging shovel, small hand garden hoe, organic soil bag, trigger spray bottle, clay terracotta pot, rain water collection barrel, outdoor compost bin, waterproof rubber garden boots, plastic watering can, soil-filled garden wheelbarrow, decorative wooden picket fence, flat scoop shovel, empty planter pedestal saucer, landscape garden fabric, metal garden trellis, organic fertilizer box, solar garden stake light, wooden garden bench, outdoor garden bistro table, padded garden kneeler.
- **49–72:** stone garden fountain, arched metal garden arbor, wire mesh garden fence, garden stone stepping path, lawn edging border, walk-behind lawn mower, electric leaf blower, hedge trimmer tool, pressurized fertilizer sprayer, compost mulch bag, garden dump cart, metal garden tool caddy, potting workbench table, garden tool shed rack, wooden garden tool chest, soil depth ruler, digital soil pH meter, sunlight solar meter, rotary seed spreader, mini rotary garden tiller, handheld grass shears, mesh soil sieve, wooden seed dibber, spike lawn aerator.
- **73–96:** automated drip controller, brass hose splitter valve, quick-connect hose coupling, soaker hose line, brass misting nozzle, garden shade canopy, seedling propagation tent, cold frame greenhouse, hanging pot bracket, rolling plant dolly coaster, planter drainage saucer, empty hanging coconut basket, plant disease spray bottle, sticky insect trap, bird deterrent net, weed puller tool, manure scoop fork, grafting knife tool, soft plant tie wire, ground anchor pegs, wall garden hose reel, plastic garden tub cart, four-wheel garden wagon, high-pressure garden sprayer.
- **97–120:** manual grass edging shears, fruit harvesting shears, compact folding hand saw, wooden stake mallet, wire cutting pliers, branch bonsai bending pliers, terracotta pot scrub brush, replacement mower blade, porous weeping hose, brass tap adapter, manifold water distributor, water flow meter, mini submersible water pump, leaf vacuum shredder, electric branch wood chipper, hand-pull garden cart, wooden heirloom seed box, magnetic tool organizer bar, shovel wall bracket, outdoor compost bucket, weed barrier landscape cloth, flexible lawn border roll, solar pathway bollard light, garden patio parasol umbrella.

---

[Quay lại](#bảng-tiến-độ)

### 19. Thời trang & phụ kiện (`fashion`)

**Thiết lập Prompt Master:**

- `[THEME]`: `clothing and fashion accessories`
- `[BACKGROUND_HEX]`: `#fff0f5`
- `[STYLE]` / `[STYLE_FINISH]`: `isometric 3D render` / `cute stylized fashion accessories, soft woven fabric, shiny gold jewelry, leather footwear`
- `[SCENE_MODE]` / `[MICRO_PROP]`: `MICRO_PROP_RULE` / `a small display base, fabric fold, or jewelry cushion`
- `[SPECIAL_BRIEF]`: `sparkling royal gemstone accessory or haute couture item`
- **01–24:** cotton t-shirt, blue denim jacket, knitted wool sweater, summer casual dress, denim jeans, sporty sneakers, leather ankle boots, casual strap sandals, baseball cap, classic beret hat, knit beanie, stylish sunglasses, round wireframe glasses, luxury wristwatch, beaded bracelet, gold pendant necklace, gemstone ring, hoop earrings, leather handbag, everyday backpack, folding wallet, warm wool scarf, leather waist belt, silk hair bow.
- **25–48:** button-up dress shirt, polo shirt, pullover hoodie, knit cardigan, tailored blazer, yellow raincoat, leather biker jacket, quilted puffer jacket, denim shorts, khaki chino pants, denim overalls, pleated tennis skirt, formal evening gown, silk pajama set, athletic tracksuit, one-piece swimsuit, soccer jersey, leather loafers, high heel pumps, ballet flats, rubber rain boots, cozy house slippers, striped crew socks, knitted wool mittens.
- **49–72:** wide-brim sun hat, classic fedora hat, hard safety helmet, fabric headband, hair claw clip, crystal tiara, silk turban headwrap, satin sleep eye mask, swim goggles, protective safety glasses, vintage pocket watch, gold wedding band, gemstone cocktail ring, delicate ankle bracelet, vintage brooch pin, enamel lapel pin, metal badge pin, lanyard badge holder, canvas tote bag, crossbody saddle bag, envelope clutch purse, leather duffle bag, rolling travel suitcase, compact folding umbrella.
- **73–96:** long walking umbrella, handheld vanity mirror, tortoiseshell hair comb, paddle hairbrush, hair curling iron, ionic hair dryer, glass perfume bottle, matte lipstick, eyeshadow palette, nail polish bottle, layered pearl necklace, velvet choker necklace, charm bracelet, silk ascot tie, silk necktie, satin bow tie, cufflink pair, adjustable suspenders, leather cardholder wallet, wooden jewelry organizer, coat hanger, key finder keychain, protective phone case, enamel fashion pin.
- **97–120:** satin bomber jacket, classic trench coat, tailored suit vest, knitted sweater vest, turtleneck sweater, fleece jogger pants, wide-leg culotte pants, frayed denim shorts, floral maxi dress, pinafore dress, oversized shirt dress, oxford dress shoes, penny loafers, pointed mule slides, leather bucket bag, baguette shoulder bag, belt fanny pack, evening wristlet pouch, paisley bandana scarf, printed silk scarf, cotton bucket hat, sports sun visor, baroque pearl necklace, gold tie clip bar.

---

[Quay lại](#bảng-tiến-độ)

### 20. Phương tiện giao thông (`vehicles`)

**Thiết lập Prompt Master:**

- `[THEME]`: `transportation vehicles`
- `[BACKGROUND_HEX]`: `#e5f5ff`
- `[STYLE]` / `[STYLE_FINISH]`: `isometric 3D render` / `cute stylized toy vehicle models, glossy enamel paint, rubber tires, clear glass windshields`
- `[SCENE_MODE]` / `[MICRO_PROP]`: `MINI_SCENE_RULE` / `a tiny road segment, rail, water ripple, or display base`
- `[SPECIAL_BRIEF]`: `golden futuristic concept vehicle`
- **01–24:** city bicycle, modern motorcycle, electric kick scooter, compact hatchback car, yellow city taxi, city transit bus, red fire engine truck, medical ambulance, blue police car, cargo delivery truck, construction dump truck, farm tractor, yellow construction wheelbarrow with gravel, passenger train engine, electric tramway car, classic wooden sailboat, motorized speedboat, yellow research submarine, rescue helicopter, passenger airplane, hot air balloon, aerial cable car, street skateboard, snowmobile.
- **25–48:** tandem bicycle, mountain bike, front-loader cargo bicycle, motorcycle with sidecar, auto rickshaw tuk tuk, stretch limousine, convertible sports car, coupe sports car, electric sedan, hybrid passenger car, travel caravan trailer, motorhome RV camper, armored security transport, municipal garbage truck, street sweeper vehicle, postal mail delivery truck, pizza delivery scooter, ice cream van, warehouse forklift, mobile crane truck, road roller compactor, hydraulic excavator, vehicle recovery tow truck, horse trailer transport.
- **49–72:** container cargo ship, luxury cruise liner, vehicle passenger ferry, arctic icebreaker ship, commercial fishing boat, ocean rescue lifeboat, crewed space rocket, touring kayak, venetian gondola, wooden rowboat, windsurfing board, personal watercraft jet ski, amphibious vehicle, passenger hovercraft, search and rescue helicopter, amphibious sea plane, private business jet, twin-engine turboprop plane, cargo quadcopter drone, novelty hot air balloon, tandem paraglider, roller coaster car, airport baggage tug, mobile airplane boarding stairs.
- **73–96:** underground subway train, elevated monorail train, bullet train, vintage steam locomotive, heritage electric streetcar, train dining car, aerial tramway gondola, moving escalator stairs, airport baggage carousel, ice skates, dog sled team, heavy snow grooming cat, electric golf cart, motorized electric wheelchair, folding baby stroller, wooden hand cart, two-wheel luggage hand truck, cargo tricycle, classic unicycle, ocean surfboard, motorized electric skateboard, folding commuter scooter, 4x4 mountain buggy, alpine toboggan sled.
- **97–120:** 4x4 off-road jeep, pickup truck, family minivan, luxury sedan, 3-door hatchback, two-seater roadster, rally racing car, micro electric city car, double-decker city bus, yellow school bus, box truck transporter, refrigerated food truck, fuel tanker truck, intermodal container chassis, electric pallet stacker, airport baggage cart, light rail transit car, high-speed express locomotive, electric commuter train, roll-on roll-off car ferry, sailing catamaran, passenger hydrofoil boat, very light jet plane, heavy-lift delivery drone.

---

[Quay lại](#bảng-tiến-độ)

### 21. Cổ vật lịch sử (`historical-artifacts`)

**Thiết lập Prompt Master:**

- `[THEME]`: `historical relics and museum artifacts`
- `[BACKGROUND_HEX]`: `#031126`
- `[STYLE]` / `[STYLE_FINISH]`: `isometric 3D render` / `stylized museum artifact relics, weathered antique brass, carved ancient pottery, aged papyrus`
- `[SCENE_MODE]` / `[MICRO_PROP]`: `MINI_SCENE_RULE` / `a small museum plinth, sand patch, or aged parchment scrap`
- `[SPECIAL_BRIEF]`: `glowing golden ancient pharaoh or emperor relic`
- **01–24:** ancient painted pottery vase, antique brass maritime compass, antique ornate iron padlock, rolled vintage treasure map, terracotta amphora jar, skeleton brass key, Easter Island Moai stone statue, ancient cipher codex book, rolled papyrus scroll, brass sundial, Egyptian Bastet cat statue, golden burial mask, carved wooden secret puzzle box, ceremonial Egyptian shield, antique magnifying glass, rolled parchment map, carved African ritual mask, Roman centurion helmet, vintage wind-up music box, classical brass oil lamp, ornate pocket watch, rotary dial telephone, brass armillary sphere, terracotta warrior figurine.
- **25–48:** stone sphinx statue, mechanical desktop typewriter, antique wooden bellows camera, vinyl phonograph record, sealing wax stamp, ancient royal crown, golden ceremonial scepter, carved signet ring, antique jewelry casket, ornate handheld mirror, classical roman terracotta oil lamp, folding silk hand fan, brass horn gramophone, telegraph morse code key, wooden box camera, vintage hand-crank film camera, vintage gold monocle, brass opera binoculars, antique brass kaleidoscope, antique desktop globe, brass astrolabe compass, classic ship in a bottle, terracotta archer figure, carved stone bas-relief tablet.
- **49–72:** ancient parchment map fragment, antique apothecary medicine box, bronze Roman coin, carved runic stone stele, classical Greek marble deity bust, ancient terracotta bowl, antique celadon ceramic plate, bronze ritual incense burner, bronze ceremonial drum, ceremonial stone scepter, ceremonial parade armor, antique commemorative medal, imperial jade seal, ancient blown-glass medicine vial, brass sand hourglass, antique hand-painted tarot card, leather-bound ancient book, rolled sheepskin vellum, antique woodblock printing plate, Venetian masquerade mask, ancient seated Buddha statue, ancient Egyptian ushabti figurine, carved scarab amulet, antique filigree necklace.
- **73–96:** mother-of-pearl inlaid bracelet, mother-of-pearl lacquer box, antique ceramic wine flagon, ornate baroque picture frame, antique brass candlestick, filigree metal lantern, ancient Roman blown-glass bottle, antique brass quadrant, marine astrolabe, pocket miniature sundial, wooden counting abacus, antique brass microscope, manual portable typewriter, hand-crank music box, royal wax seal impression, antique skeleton iron key, antique hand-forged padlock, vintage wooden drafting compass, antique celestial map chart, carved stone lion guardian, carved jade pendant, ancient silver hairpin, antique gemstone ring, puzzle-carved treasure box.
- **97–120:** jackal deity Anubis statue, bronze Spartan warrior figurine, black-figure Greek amphora, ancient carved jade cup, engraved brass serving tray, imperial jade bowl, lacquerware tiered box, antique calligraphy paper fan, blank rolled silk scroll, illuminated medieval manuscript, antique maritime nautical chart, engraved bronze celestial globe, brass telescope on wooden tripod, antique coin collector chest, heraldic royal crest shield, castle fortress iron key, carved padlock, antique glass hurricane lantern, royal crest typewriter, vintage folding plate camera, hand-crank movie camera, vintage tube radio, hand-crank phonograph, morse code receiver ticker.

---

[Quay lại](#bảng-tiến-độ)

### 22. Thiết bị gián điệp (`spy-gadgets`)

**Thiết lập Prompt Master:**

- `[THEME]`: `spy gadgets and surveillance gear`
- `[BACKGROUND_HEX]`: `#101927`
- `[STYLE]` / `[STYLE_FINISH]`: `isometric 3D render` / `stylized secret agent gadgets, matte tactical carbon fiber, stealth dark alloys, glowing sensor lenses`
- `[SCENE_MODE]` / `[MICRO_PROP]`: `MICRO_PROP_RULE` / `a tiny tactical base, signal wave, or subtle sensor light`
- `[SPECIAL_BRIEF]`: `advanced hologram stealth gadget or covert device`
- **01–24:** handheld walkie-talkie, spy camera pen, handheld UV blacklight, glowing surveillance footprint, night vision goggles, polarized spy sunglasses, clip-on lapel microphone, handheld metal detector, mini magnetic voice recorder, cipher decoding device, parabolic listening device, covert radio beacon, miniature spy camera, buttonhole hidden camera, combination padlock, optical periscope, covert micro earpiece, secret agent aluminum briefcase, scout reconnaissance telescope, classified confidential document folder, wax sealed top-secret envelope, secret agency seal stamp, brass film canister, 35mm photographic negative film roll.
- **25–48:** mini microfiche projector, 3.5-inch floppy disk, magnetic audio microcassette, covert numeric pager, rugged satellite phone, infrared thermal monocle, biometric fingerprint scanner, magnetic GPS tracker puck, Morse code tactical flashlight, caesar cipher wheel disc, tactical cipher grid card, secret agent RFID ID badge, covert eye logo badge, tactical grappling hook rope, hidden hollow coin, covert makeup powder compact, handheld RFID skimmer reader, compact covert biometric fingerprint padlock, laser window microphone, passive infrared motion detector, camera button screw, camera pencil tool, camera eyeglasses, pocket audio recorder.
- **49–72:** bone conduction tactical earpiece, covert camera wristwatch, smart transmitter ring, Morse code pendant necklace, hardware-encrypted USB flash drive, pocket UV LED flashlight, covert magnifying glass, micro roof-prism binoculars, infrared thermal imaging camera, electronic voice changer box, RF signal jammer pod, wrist-mounted tactical radio, spectrum frequency scanner, covert dead drop box, invisible ink UV pen, secret cipher paper note, polarizing lens filter, FLIR thermal imaging device, RFID keycard cloner, briefcase combination lock, tactical modular gadget pouch, capacitive touch gloves, stealth rubber sole shoe, active camouflage cloak.
- **73–96:** silicone disguise face mask, metal special agent badge, emergency strobe distress beacon, magnetic vehicle GPS tracker, through-wall contact microphone, bug RF radio detector, master lockpick toolset, thermal photo printer, emergency SOS beacon transmitter, retinal biometric scanner, drone remote control console, micro scout drone, hardware crypto data pod, encrypted satellite smartphone, compact theatrical smoke generator, wide-angle night vision binoculars, tactical digital compass, luggage barcode tracker, RFID-blocking passport wallet, electronic countdown timer, portable radio receiver, magnetic stripe cloner, mini GPS locator, button compass with hidden camera.
- **97–120:** fiber optic micro snake camera, covert micro earbud, button mic transmitter, handheld green laser dazzler, camera wristwatch, camera spy ring, camera spy glasses, electronic bug sweeper, handheld thermal spotter, infrared perimeter beam, phone tap analyzer, credit-card sized voice recorder, disguised flash drive key, micro SD card concealment, waterproof document wallet, tamper-evident security envelope, fingerprint lift tape kit, portable DNA analyzer simulator, vehicle magnetic tracker, key fob GPS locator, insect ornithopter micro drone, tracked robot rover, covert Wi-Fi hotspot beacon, hardware brute-force decoder.

---

[Quay lại](#bảng-tiến-độ)

### 23. Lễ hội (`festivals`)

**Thiết lập Prompt Master:**

- `[THEME]`: `festive celebrations`
- `[BACKGROUND_HEX]`: `#fff5dc`
- `[STYLE]` / `[STYLE_FINISH]`: `isometric 3D render` / `cute stylized holiday symbols, joyful carnival confetti, glazed confectionery, festive ribbons`
- `[SCENE_MODE]` / `[MICRO_PROP]`: `MINI_SCENE_RULE` / `a few low confetti pieces, ribbon curl, or festive pedestal`
- `[SPECIAL_BRIEF]`: `golden ceremonial festival mascot or festive heirloom`
- **01–24:** red silk lantern, yellow apricot blossom branch, traditional banh chung, blank lucky red envelope, festival ceremonial drum, festive lion dance head, decorated Christmas tree, golden holiday bell, red Christmas stocking, striped candy cane, carved Halloween pumpkin jack-o-lantern, glowing pumpkin lantern, pointed witch hat, painted Easter egg, cute Easter bunny with ribbon, bursting fireworks rocket, party balloon cluster, birthday cake with icing, glowing birthday candle, colorful triangular bunting banner, venetian carnival mask, multicolored paper confetti, holiday pine wreath, wrapped gift box with silk ribbon.
- **25–48:** baked mooncake, star lantern, lion dance mascot head, pink peach blossom branch, blank red couplet banner, traditional five-fruit tray, terracotta zodiac animal, festive traditional Ao Dai, sacred lotus flower, festival ceremonial cylinder drum with red ribbons, colorful accordion paper lantern, square sticky rice banh tet, red poinsettia flower, glass Christmas bauble, gold tree-topper star, holiday evergreen wreath, Santa's wooden sleigh, smiling snowman, knit holiday mittens, North Pole mailbox, swirl lollipop candy, gingerbread man cookie, reindeer with jingle bells, plush Santa Claus hat.
- **49–72:** pointed witch hat with buckle, artificial spiderweb with spiders, candy corn candy, friendly cartoon ghost, black paper bat, cute black cat with witch hat, dancing skeleton figure, cartoon vampire coffin, haunted house gate arch, caramel dipped apple, trick-or-treat candy bucket, glowing Halloween pillar candle, Easter bunny holding egg, woven egg basket, fluffy Easter chick, yellow daffodil flower, brass Easter bell, colorful spring butterfly, tiered wedding cake, golden wedding bells, bridal flower bouquet, blank wedding invitation envelope, frosted heart cookie, decorated wedding gift chest.
- **73–96:** birthday cupcake with candle, cone party hat, party noisemaker horn, curly satin ribbon, polka dot photo backdrop, star foil balloon, metallic star confetti, gold victory medal, trophy cup, checkered finish flag, Olympic ceremonial torch, festival cheering drum, unbranded team sports jersey, festival enamel badge, mirror disco ball, Mardi Gras masquerade mask, colorful carnival beads, carnival feather plume, festive parade float model, paper party popper, wooden rattle drum, glow stick bracelet, mid-autumn moon lantern, 3d origami paper star.
- **97–120:** lotus paper lantern, carp fish lantern, star paper lantern, festival dragon dance head, festival brass cymbals, traditional dance folding fan, colorful pennant festival flag, winter evergreen wreath, brass wind chime bell, iced holiday sugar cookie, traditional fruitcake loaf, gingerbread house with frosting, striped holiday candy cane, velvet mantle stocking, Santa's reindeer team, graduation mortarboard cap, blank diploma scroll, shimmering metallic confetti, number foil balloon, Halloween spider cupcake, friendly ghost mask, paper ghost lantern, hand-painted floral Easter egg, spring basket with blossoms.

---

[Quay lại](#bảng-tiến-độ)

### 24. Nhạc cụ (`instruments`)

**Thiết lập Prompt Master:**

- `[THEME]`: `musical instruments`
- `[BACKGROUND_HEX]`: `#f2e8ff`
- `[STYLE]` / `[STYLE_FINISH]`: `isometric 3D render` / `cute stylized musical instruments, polished varnished tone wood, gleaming brass and silver alloys, delicate strings`
- `[SCENE_MODE]` / `[MICRO_PROP]`: `MINI_SCENE_RULE` / `a tiny music stand, low stage base, or a few musical sparkles`
- `[SPECIAL_BRIEF]`: `glowing golden magical instrument or legendary musical masterpiece`
- **01–24:** classical violin, orchestral viola, acoustic cello, double contrabass, classical nylon guitar, acoustic wooden guitar, electric solid-body guitar, electric bass guitar, wooden ukulele, country banjo, teardrop mandolin, concert pedal harp, ancient classical lyre, renaissance lute, Indian sitar, Japanese shamisen, Japanese koto zither, Chinese guzheng, Chinese erhu fiddle, Chinese pipa lute, Vietnamese dan bau monochord, Vietnamese dan tranh zither, Vietnamese dan nguyet moon lute, Vietnamese dan tam lute.
- **25–48:** Vietnamese dan ty ba lute, Vietnamese dan nhi fiddle, Vietnamese dan ho fiddle, Vietnamese dan tinh gourd lute, Vietnamese dan day lute, Vietnamese dan goong bamboo zither, large ceremonial bass drum, traditional wooden cylinder drum with drumsticks, marching snare drum, orchestral snare drum, concert bass drum, drum kit tom-tom, wooden conga drum, wooden bongo drums, African djembe drum, wooden cajon box drum, copper orchestral timpani, handheld tambourine with jingles, wooden maracas pair, wooden claves pair, wooden castanets, metal triangle with striker, metal cowbell, twin agogo bells.
- **49–72:** concert vibraphone, wooden marimba, orchestral xylophone, metal glockenspiel, tubular bells chime, steel handpan drum, steelpan drum, Japanese taiko drum, Irish bodhran drum, handheld frame drum, sleigh bell tambourine, wooden woodblock with mallet, traditional bamboo flute, silver concert transverse flute, silver piccolo, wooden soprano recorder, ceramic ocarina, wooden pan flute, Japanese shakuhachi, traditional cat flute, traditional gourd flute, chromatic harmonica, piano accordion, portable melodica.
- **73–96:** wooden Bb clarinet, wooden bass clarinet, orchestral oboe, wooden bassoon, brass alto saxophone, brass tenor saxophone, brass baritone saxophone, brass trumpet, brass cornet, brass flugelhorn, brass tenor trombone, brass tuba, brass French horn, brass euphonium, traditional suona horn, traditional bamboo sheng, Scottish highland bagpipes, Australian wooden didgeridoo, analog synthesizer keyboard, electronic music keyboard, digital electric piano, electronic organ, analog drum machine, pad sampler controller.
- **97–120:** USB MIDI keyboard controller, DJ vinyl turntable, analog theremin with antenna, keytar synthesizer, electronic digital wind instrument, guitar synthesizer, bass synthesizer module, digital upright piano, electronic tabla drum pads, Central Highlands gong set, bamboo t'rung xylophone, k'ni fiddle, klong put bamboo resonant tubes, chapi bamboo zither, West African kora harp, African balafon xylophone, wooden kalimba thumb piano, traditional mbira, Middle Eastern wooden oud, Middle Eastern qanun zither, Persian santur dulcimer, hammered dulcimer, Arabian rebab fiddle, Indian sarangi fiddle.

---

[Quay lại](#bảng-tiến-độ)

### 25. Huyền bí (`mystery`)

**Thiết lập Prompt Master:**

- `[THEME]`: `mythical creatures and mysterious wonders`
- `[BACKGROUND_HEX]`: `#17112d`
- `[STYLE]` / `[STYLE_FINISH]`: `isometric 3D render` / `stylized mysterious fantasy and sci-fi relics, ethereal glowing violet runes, enchanted crystals`
- `[SCENE_MODE]` / `[MICRO_PROP]`: `MINI_SCENE_RULE` / `a tiny crystal, mossy rock, or soft magical sparkle`
- `[SPECIAL_BRIEF]`: `glowing cosmic singularity relic or legendary mysterious wonder`
- **01–24:** cloud dragon, icy frost phoenix, forest unicorn, majestic griffin, cute baby kraken, ancient stone sphinx, luminescent mermaid, nine-tailed celestial fox, giant mythical roc bird, gentle basilisk, magic brass genie lamp, glowing prophecy crystal orb, ancient portal keystone, solar eclipse mask, mystical hourglass of time, memory crystal shard, floating self-opening ancient grimoire, fairy wooden tree door, floating castle on clouds, bioluminescent enchanted mushroom forest, ghost ship in clouds, glowing quantum vortex gate, alien monolith artifact, galaxy egg container.
- **25–48:** mythical chimera, gentle minotaur, noble centaur, woodland satyr, baby woodland faun, glowing crystal golem, ancient moss golem, gentle werewolf, friendly vampire, peaceful goblin, woodland high elf, freshwater naiad, twinkling star sprite, glowing forest pixie, stone mountain troll, gentle snowy yeti, mythical deep lake creature, ancient sea serpent, friendly paper lantern ghost, kelpie water horse, feathered hippogriff, mythical manticore, eastern kirin, ouroboros dragon.
- **49–72:** ancient mysterious star map, spirit-guiding compass, mechanical magic music box, dimensional portal mirror, sacred bronze wind chime, all-seeing eye talisman, glowing runic stone circle, talking stone face statue, glowing moonstone gem, legendary philosopher's stone, mysterious glowing meteorite fragment, hyperdimensional time tesseract cube, ancient flying saucer relic, glowing soul firefly jar, floating will-o'-the-wisp lantern, ancient carved bone key, multifaceted secret puzzle box, cursed gold doubloon, fairy tale golden crown, celestial moon scepter, sacred kitsune fox mask, crystal concert harp, mossy ancient stone archway, cosmic snow globe.
- **73–96:** enchanted fairy mushroom village, ancient talking elder tree house, glowing wishing well, midnight rainbow, bioluminescent waterfall, reflective enchanted mirror lake, floating sky island, mythical dragon island, glowing amethyst crystal cavern, magical hedge labyrinth, drifting sky fortress, mysterious clockwork clocktower, infinite ancient library, phantom train station, glowing cobblestone star path, glowing firefly forest, iridescent glass desert, crescent moon mountain, shimmering crystal plain, glowing sea of clouds, twin moon starry night sky, celestial meteorite garden, dome-covered crystal city, ancient cliffside observatory.
- **97–120:** ancient technological golem, AI glowing intelligence sphere, time travel portal arch, abandoned deep space probe, crystalline alien planet, ringed blue moon, galaxy inside a bottle, friendly cosmic wormhole, mysterious radio signal wave, phantom orbital satellite, moss-overgrown sci-fi lab, glowing plasma energy creature, floating lantern alien, mossy symbiotic alien, holographic ghost projection, robotic metallic skeleton, chronomancer pocket watch, prophecy typewriter, quantum kaleidoscope, memory crystal container, glowing bio-mechanical tree, celestial star portal gate, talking thundercloud, cosmic machine egg.

---

# Các chủ đề khác - [Quay lại](#bảng-tiến-độ)

### Mặc định (`default`)

- **Nguồn:** Bộ sưu tập 1.000 ảnh WebP legacy trong `public/assets/images/themes/default/`. Không dùng prompt tạo mới.

### Chữ cái (`alphabet`)

- **Quy cách sinh:** SVG sinh trực tiếp từ 48 ký tự: A–Z (01–26), sau đó 22 ký tự tiếng Việt mở rộng (27–48): `Ă`, `Â`, `Đ`, `Ê`, `Ô`, `Ơ`, `Ư`, `À`, `Á`, `Ả`, `Ã`, `Ạ`, `È`, `É`, `Ẻ`, `Ẽ`, `Ẹ`, `Ì`, `Í`, `Ỉ`, `Ĩ`, `Ị`. Mỗi ký tự là khối đồ chơi 3D xanh–tím; màu cố định theo giá trị. Không cần prompt ảnh.

### 2 Số (`numbers-2`)

- **Quy cách sinh:** SVG sinh trực tiếp từ 96 giá trị hai chữ số: `00`–`05` và `10`–`99`. Mỗi giá trị hiển thị trên bảng số điện tử xanh ngọc; màu cố định theo giá trị. Không cần prompt ảnh.

### 3 Số (`numbers-3`)

- **Quy cách sinh:** SVG sinh trực tiếp từ các số 100–999 (900 giá trị). Mỗi giá trị hiển thị trên bảng số điện tử xanh ngọc; màu cố định theo giá trị. Không cần prompt ảnh.

### Ký hiệu máy tính (`computer-symbols`)

- **Quy cách sinh:** SVG sinh trực tiếp từ 48 ký hiệu máy tính: `+`, `-`, `×`, `÷`, `=`, `≠`, `<`, `>`, `≤`, `≥`, `%`, `#`, `@`, `&`, `|`, `^`, `~`, `_`, `/`, `\`, `(`, `)`, `[`, `]`, `{`, `}`, `*`, `!`, `?`, `:`, `;`, `←`, `→`, `↑`, `↓`, `↵`, `⇥`, `⌫`, `⌦`, `⌘`, `⌥`, `⌃`, `⎋`, `±`, `∞`, `√`, `∑`, `∏`, `∫`. Mỗi ký hiệu hiển thị như phím chức năng xanh đậm; màu cố định theo giá trị. Không cần prompt ảnh.
