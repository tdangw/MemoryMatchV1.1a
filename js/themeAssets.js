function defineAssets(entries) {
  return Object.freeze(entries.map(([id, label]) => Object.freeze({ id, label, file: `${id}.webp` })));
}

function defineSlugAssets(ids) {
  return defineAssets(ids.map((id) => [id, id.replaceAll("-", " ")]));
}

const ENDLESS_ASSET_ADDITIONS = Object.freeze({
  nature: ["bai-cat", "canh-dong-lua", "con-cat", "dam-lay", "dam-sen", "dao-nho", "dinh-nui-tuyet", "dong-co", "hang-dong", "hem-nui", "ho-bang", "mang-da", "nui-da-voi", "nui-lua", "ran-san-ho", "rung-ngap-man", "rung-thong", "rung-tre", "ruong-bac-thang", "suoi-nho", "thac-nuoc", "thao-nguyen", "vach-da", "vinh-bien"],
  flowers: ["hoa-anh-tuc", "hoa-bi-ngan", "hoa-cam-chuong", "hoa-cam-tu-cau", "hoa-chuong", "hoa-cuc-trang"],
  geometry: ["ban-nguyet", "bat-giac", "dau-cong", "dau-nhan", "hinh-binh-hanh", "hinh-chu-nhat", "hinh-elip", "hinh-mui-ten", "hinh-sao-nam-canh", "hinh-thang", "hinh-thoi", "hinh-tia-set", "hinh-tim", "hinh-tron", "hinh-vuong", "luc-giac", "mot-phan-tu-hinh-tron", "ngu-giac", "tam-giac-can", "tam-giac-deu", "tam-giac-vuong", "thap-giac", "that-giac", "vanh-khuyen"],
  space: ["ang-ten-parabol", "bo-do-phi-hanh-gia", "cong-khong-gian", "dai-quan-sat", "gang-tay-phi-hanh-gia", "khoang-ngu-khong-trong-luc", "khoang-thoat-hiem", "kinh-thien-van-khong-gian", "kinh-thien-van-radio", "la-co-hanh-tinh", "mat-trang-europa", "mat-trang-ganymede", "mat-trang-io", "mat-trang-titan", "mu-phi-hanh-gia", "robot-tham-hiem", "sao-diem-vuong", "tau-cho-hang-vu-tru", "tau-con-thoi", "tau-do-bo-mat-trang", "ten-lua-day", "tram-tiep-nhien-lieu", "ung-phi-hanh-gia", "xe-tu-hanh-mat-trang"],
  household: ["ban-an", "ban-tra", "cay-lau-nha", "choi", "den-dung", "den-ngu", "ghe-an", "gia-sach", "gio-dung-do", "giuong-ngu", "guong-treo-tuong", "hop-khan-giay", "hot-rac", "ke-treo-tuong", "may-loc-khong-khi", "may-tao-am", "moc-ao", "nem-cuon", "ngan-keo", "rem-cua", "tham-tron", "thung-rac", "tu-quan-ao", "xo-nuoc"],
  "office-supplies": ["bang-kep-giay", "bang-trang-mini", "but-bi", "but-gel", "but-long-bang", "but-mau-sap", "but-ve-ky-thuat", "compa", "con-dau-ngay-thang", "dau-but-thay-the", "e-ke", "ghim-nam-cham", "giay-ghi-chu", "giay-in-anh", "giay-than", "giay-thu-cong", "hop-but", "hop-muc", "khan-lau-bang", "muc-dau", "nam-cham-tron", "nhan-dan-mau", "ruot-but", "thuoc-do-goc"],
  "garden-tools": ["bau-uom-cay", "bien-danh-dau-cay-khong-chu", "bo-hen-gio-tuoi", "choi-co", "coc-chong-cay", "cua-canh"],
  fashion: ["ao-blazer", "ao-bong-da", "ao-cardigan", "ao-hoodie", "ao-khoac-da", "ao-khoac-phao", "ao-mua", "ao-polo", "ao-so-mi", "bo-do-the-thao", "chan-vay-xep-ly", "dep-di-trong-nha", "do-boi", "gang-tay-len", "giay-ballet", "giay-cao-got", "giay-di-mua", "giay-luoi", "quan-kaki", "quan-short", "quan-yem", "tat-soc", "vay-da-hoi", "vay-ngu"],
  vehicles: ["xe-boc-thep-khong-vu-khi", "xe-caravan", "xe-cau", "xe-cho-kem", "xe-cho-ngua", "xe-cho-rac", "xe-cho-thu", "xe-cuu-ho", "xe-dap-cho-hang", "xe-dap-dia-hinh", "xe-dap-doi", "xe-dien", "xe-giao-pizza", "xe-hybrid", "xe-limousine", "xe-lu", "xe-may-sidecar", "xe-mui-tran", "xe-nang", "xe-nha-di-dong", "xe-quet-duong", "xe-the-thao", "xe-tuk-tuk", "xe-xuc"],
  festivals: ["ao-dai-tet", "banh-gung", "banh-tet", "banh-trung-thu", "canh-dao-hong", "cau-doi-trong-khong-chu", "cay-keo-mut", "con-giap-dat", "dau-lan", "den-long-giay", "den-ong-sao", "gang-tay-noel", "hoa-sen", "hoa-trang-nguyen", "hop-thu-ong-gia-noel", "mam-ngu-qua", "mu-ong-gia-noel", "ngoi-sao-noel", "nguoi-tuyet", "qua-chau-noel", "trong-com", "tuan-loc", "vong-nguyet-que-noel", "xe-truot-tuyet-noel"],
});

const BASE_IMAGE_THEME_ASSETS = Object.freeze({
  // Asset còn ở thư mục legacy `animals` chờ người dùng phân loại thủ công.
  animals: defineSlugAssets(["ostrich", "turtle", "unicorn"]),
  nature: defineAssets([
    ["forest-hill", "Đồi rừng"], ["river", "Sông"], ["cloud", "Mây"], ["rain-cloud", "Mây mưa"],
    ["lightning-bolt", "Tia sét"], ["snowflake", "Bông tuyết"], ["sand-dune", "Cồn cát"], ["tropical-island", "Đảo nhiệt đới"],
    ["coral-reef", "Rạn san hô"], ["iceberg", "Tảng băng"], ["cave", "Hang động"], ["geyser", "Mạch nước phun"],
    ["aurora", "Cực quang"], ["rocky-mountain", "Núi đá"], ["rainbow", "Cầu vồng"], ["volcano", "Núi lửa"],
    ["waterfall", "Thác nước"], ["moon", "Mặt Trăng"], ["sun", "Mặt Trời"], ["pine-tree", "Cây thông"],
    ["seashell", "Vỏ sò"], ["starfish", "Sao biển"], ["floating-iceberg", "Núi băng trôi"], ["waterfall-pool", "Thác nước hồ"],
  ]),
  flowers: defineAssets([
    ["monstera-leaf", "Lá monstera"], ["bonsai", "Bonsai"], ["fern", "Dương xỉ"], ["echeveria", "Sen đá echeveria"],
    ["fly-agaric", "Nấm tán đỏ"], ["maple-leaf", "Lá phong"], ["pinecone", "Quả thông"], ["acorn", "Quả sồi"],
    ["ivy", "Thường xuân"], ["bamboo", "Tre"], ["bellflower", "Hoa chuông"], ["poppy", "Hoa anh túc"],
    ["lily", "Hoa loa kèn"], ["dandelion", "Bồ công anh"], ["sunflower", "Hoa hướng dương"], ["rose", "Hoa hồng"],
    ["flowering-cactus", "Xương rồng nở hoa"], ["tulip", "Hoa tulip"], ["orchid", "Hoa lan"], ["daisy", "Hoa cúc"],
    ["palm-tree", "Cây cọ"], ["oak-leaf", "Lá sồi"], ["cherry-blossom", "Hoa anh đào"], ["aloe-vera", "Lô hội"],
  ]),
  geometry: defineAssets([
    ["cube", "Khối lập phương"], ["sphere", "Khối cầu"], ["cylinder", "Khối trụ"], ["cone", "Khối nón"],
    ["square-pyramid", "Chóp đáy vuông"], ["rectangular-prism", "Hộp chữ nhật"], ["hemisphere", "Bán cầu"], ["capsule", "Khối nang"],
    ["triangular-pyramid", "Chóp tam giác"], ["pentagonal-prism", "Lăng trụ ngũ giác"], ["hexagonal-pyramid", "Chóp lục giác"], ["octahedron", "Bát diện"],
    ["ellipsoid", "Khối elip"], ["blue-cone-frustum", "Nón cụt xanh"], ["orange-cone-frustum", "Nón cụt cam"], ["pentagonal-pyramid", "Chóp ngũ giác"],
    ["trapezoidal-prism", "Lăng trụ hình thang"], ["truncated-block", "Khối cụt"], ["star-prism", "Lăng trụ ngôi sao"], ["torus", "Khối xuyến"],
    ["square-bipyramid", "Chóp đôi"], ["dodecahedron", "Thập nhị diện"], ["triangular-prism", "Lăng trụ tam giác"], ["crescent", "Khối trăng lưỡi liềm"],
  ]),
  cyberpunk: defineSlugAssets(["ai-chip", "ao-khoac-phat-sang", "ar-glasses", "bien-quang-cao-neon", "ca-may-hologram", "cap-quang", "cho-may", "chuot-laser", "con-trung-nano", "cot-den-neon", "cua-an-ninh-tuong-lai", "cyber-headphones", "data-crystal", "delivery-robot", "dong-ho-thong-minh", "drone-camera", "electronic-mask", "energy-battery", "flying-taxi", "future-motorcycle", "gang-tay-haptic", "giay-phan-luc", "glowing-circuit-board", "hologram-speaker", "holographic-keyboard", "kinh-ap-trong-ar", "laser-toolbox", "man-hinh-gap", "may-in-3d", "mini-satellite", "neon-arrow", "neon-helmet", "neon-tree", "o-cung-neon", "robot-barista", "robot-cat", "robot-ve-sinh", "robotic-arm", "round-drone", "tech-suitcase", "teleport-gate", "thang-may-hologram", "thanh-ram", "thu-cung-robot", "tram-sac", "vending-machine", "vong-tay-sinh-trac", "vuon-thuy-canh-neon"]),
  "magic-rpg": defineSlugAssets(["antique-key", "baby-dragon", "baby-phoenix", "baby-unicorn", "blue-potion", "crystal-ball", "crystal-wand", "fire-spellbook", "flower-fairy", "flying-boots", "flying-broom", "friendly-slime", "glowing-flower", "glowing-sword", "golden-potion", "ice-spellbook", "knight-helmet", "lightning-hammer", "magic-cauldron", "magic-gloves", "magic-lantern", "magic-mushroom", "magic-powder-pouch", "magic-ring", "magic-snowman", "magic-wand", "map-scroll", "messenger-owl", "moon-amulet", "moon-bow", "mortar-pestle", "poisonous-mushroom", "purple-crystal", "purple-potion", "red-potion", "rune-crossbow", "rune-shield", "rune-stone-gate", "spellbook", "star-broom", "stone-golem", "sun-staff", "thunder-staff", "treasure-chest", "wizard-cat", "wizard-hat", "wizard-robe", "wizard-staff"]),
  space: defineSlugAssets(["astronaut", "black-hole", "comet", "constellation", "earth", "green-alien", "jupiter", "mars-rover", "mars", "mercury", "meteor", "moon", "nebula", "neptune", "rocket", "satellite", "saturn", "space-station", "spaceship", "sun", "telescope", "ufo", "uranus", "venus"]),
  household: defineSlugAssets(["alarm-clock", "armchair", "body-pillow", "bowl", "ceramic-cup", "cooking-pot", "desk-lamp", "flower-vase", "folded-blanket", "frying-pan", "iron", "microwave", "picture-frame", "plate", "potted-plant", "refrigerator", "stool", "table-fan", "tea-kettle", "television", "toaster", "tv-remote", "vacuum-cleaner", "washing-machine"]),
  "office-supplies": defineSlugAssets(["binder-clip", "calculator", "clipboard", "computer-mouse", "desk-calendar", "envelope", "eraser", "file-folder", "glue-stick", "highlighter", "ink-pen", "keyboard", "notebook", "paper-clip", "pencil-sharpener", "pencil", "printer", "push-pin", "reading-glasses", "ruler", "scissors", "stapler", "tape-roll", "usb-drive"]),
  "garden-tools": defineSlugAssets(["bird-nest", "cactus", "carrot", "coiled-hose", "gardening-gloves", "hand-trowel", "leaf-rake", "mini-greenhouse", "pruning-shears", "pumpkin", "red-apple", "seed-packet", "seedling", "shovel", "small-hoe", "soil-bag", "spray-bottle", "sunflower", "terracotta-pot", "tomato", "tulip-bush", "watering-can", "wheelbarrow", "wooden-fence"]),
  fashion: defineSlugAssets(["backpack", "baseball-cap", "belt", "beret", "boots", "bracelet", "denim-jacket", "dress", "earrings", "hair-bow", "handbag", "jeans", "knit-beanie", "necklace", "ring", "round-glasses", "sandals", "scarf", "sneakers", "sunglasses", "sweater", "tshirt", "wallet", "wristwatch"]),
  vehicles: defineSlugAssets(["airplane", "ambulance", "bicycle", "bus", "cable-car", "construction-wheelbarrow", "delivery-truck", "dump-truck", "electric-scooter", "fire-truck", "helicopter", "hot-air-balloon", "motorcycle", "police-car", "sailboat", "skateboard", "small-car", "snowmobile", "speedboat", "submarine", "taxi", "tractor", "train", "tram"]),
  festivals: defineSlugAssets(["balloons", "banh-chung", "birthday-cake", "birthday-candle", "candy-cane", "carnival-mask", "christmas-stocking", "christmas-tree", "confetti", "easter-bunny", "easter-egg", "festival-drum", "fireworks", "flower-wreath", "golden-bell", "halloween-pumpkin", "jack-o-lantern", "lion-dance-head", "lucky-envelope", "red-lantern", "ribbon-gift", "triangular-bunting", "witch-hat", "yellow-apricot-blossom"]),
});

const SPLIT_IMAGE_THEME_ASSETS = Object.freeze({
  // V2: các pool này chỉ được bật sau khi có tối thiểu 24 asset riêng,
  // không tái sử dụng ảnh của chủ đề legacy trong gameplay.
  "animals-land": defineSlugAssets(["red-panda", "elephant", "tiger", "lion", "rabbit", "fox", "giant-panda", "koala", "giraffe", "monkey", "sloth", "polar-bear", "zebra", "hedgehog", "frog", "alpaca", "raccoon", "beaver", "mongoose", "skunk", "marmot", "armadillo", "pangolin", "tapir", "giant-anteater", "capybara", "donkey", "llama", "yak", "american-bison", "wildebeest", "gazelle", "okapi", "rhinoceros", "hippopotamus", "camel"]),
  "animals-air": defineSlugAssets(["flying-squirrel", "macaw", "peacock", "toucan", "flamingo"]),
  "animals-sea": defineSlugAssets(["dolphin", "otter", "penguin", "seal"]),
  trees: defineSlugAssets(["bamboo", "bonsai", "palm-tree", "seedling"]),
  leaves: defineSlugAssets(["fern", "ivy", "maple-leaf", "monstera-leaf", "oak-leaf"]),
  instruments: defineSlugAssets([]),
  mystery: defineSlugAssets([]),
  foods: defineSlugAssets(["banh-bao", "banh-cuon", "banh-mi", "banh-xeo", "bibimbap", "bun-bo", "burrito", "cha-gio", "cheese-wedge", "cheeseburger", "chicken-drumstick", "chocolate-chip-cookie", "com-tam", "croissant", "cupcake", "dim-sum", "donut", "french-fries", "goi-cuon", "ha-cao", "hot-dog", "ice-cream-cone", "kimbap", "nem-ran", "onigiri", "paella", "pancakes", "pho", "pizza", "pretzel", "quesadilla", "ramen", "risotto", "salad", "sushi", "taco", "udon", "xoi-man"]),
  drinks: defineSlugAssets(["bubble-tea", "strawberry-milkshake", "coconut-water", "matcha-latte", "hot-cocoa", "cafe-latte", "cappuccino", "espresso", "lemonade", "orange-juice", "mango-smoothie", "blueberry-soda", "kombucha", "peach-iced-tea", "black-iced-tea", "chai-latte", "sparkling-water", "grape-juice", "apple-juice", "watermelon-juice", "soy-milk", "herbal-tea", "ginger-tea", "hot-milk"]),
  fruits: defineSlugAssets(["grapes", "orange", "pear", "red-apple", "strawberry", "watermelon"]),
  vegetables: defineSlugAssets(["carrot", "pumpkin", "tomato"]),
  flowers: defineSlugAssets(["bellflower", "cherry-blossom", "daisy", "dandelion", "flowering-cactus", "hoa-anh-tuc", "hoa-bi-ngan", "hoa-cam-chuong", "hoa-cam-tu-cau", "hoa-chuong", "hoa-cuc-trang", "hoa-da-yen-thao", "hoa-danh-danh", "hoa-dien-vi", "hoa-hong-do", "hoa-huong-duong", "hoa-lan-ho-diep", "hoa-loa-ken", "hoa-mao-luong", "hoa-mau-don", "hoa-moc-lan", "hoa-nhai", "hoa-oai-huong", "hoa-pansy", "hoa-rum", "hoa-thuoc-duoc", "hoa-tra", "hoa-tulip", "hoa-violet", "lily", "orchid", "poppy", "rose", "sunflower", "tulip", "tulip-bush"]),
  plants: defineSlugAssets(["acorn", "aloe-vera", "cactus", "echeveria", "fly-agaric", "pinecone"]),
  "garden-tools": defineSlugAssets(["bau-uom-cay", "bien-danh-dau-cay-khong-chu", "bird-nest", "bo-hen-gio-tuoi", "choi-co", "coc-chong-cay", "coiled-hose", "cua-canh", "cuoc-chim", "dau-phun-xoay", "dau-tuoi-nho-giot", "day-buoc-cay", "gang-tay-cao-su", "gardening-gloves", "hand-trowel", "keo-cat-canh-lon", "khay-gieo-hat", "leaf-rake", "liem-cat-co", "luoi-che-nang", "luoi-chong-con-trung", "may-do-do-am-dat", "mini-greenhouse", "nhiet-ke-dat", "nia-lam-vuon", "ong-dan-nuoc", "pruning-shears", "seed-packet", "shovel", "small-hoe", "soil-bag", "spray-bottle", "terracotta-pot", "thung-chua-nuoc-mua", "thung-u-phan", "ung-di-vuon", "watering-can", "wheelbarrow", "wooden-fence", "xeng-xuc-dat"]),
  "historical-artifacts": defineSlugAssets(["ancient-vase", "antique-compass", "antique-padlock", "ban-do-kho-bau", "binh-amphora", "brass-key", "buc-tuong-moai", "cipher-book", "cuon-giay-coi", "dong-ho-mat-troi", "egyptian-cat-statue", "golden-mask", "hop-bi-mat", "khien-ai-cap", "magnifying-glass", "map-scroll", "mat-na-chau-phi", "mu-sat-la-ma", "music-box", "oil-lamp", "pocket-watch", "rotary-telephone", "thien-van-cau", "tuong-dat-nung", "tuong-nhan-su", "typewriter", "vintage-camera", "vinyl-record", "wax-seal"]),
  "spy-gadgets": defineSlugAssets(["bo-dam", "but-camera", "den-uv", "glowing-footprint", "kinh-nhin-dem", "kinh-ram-gian-diep", "lapel-microphone", "may-do-kim-loai", "may-ghi-am-mini", "may-ma-hoa", "may-nghe-len", "may-phat-tin-hieu", "mini-spy-camera", "nut-ao-camera", "o-khoa-so", "periscope", "secret-earpiece", "spy-suitcase", "telescope"]),
});

export const IMAGE_THEME_ASSETS = Object.freeze(
  Object.fromEntries(
    Object.entries({ ...BASE_IMAGE_THEME_ASSETS, ...SPLIT_IMAGE_THEME_ASSETS }).map(([themeId, assets]) => [
      themeId,
      Object.freeze([
        ...assets,
        ...defineSlugAssets(ENDLESS_ASSET_ADDITIONS[themeId] || []).filter(
          ({ id }) => !assets.some((asset) => asset.id === id),
        ),
      ]),
    ]),
  ),
);
