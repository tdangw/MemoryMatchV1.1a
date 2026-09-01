from pathlib import Path
import sys
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCES = Path(r"C:\Users\Dang\.codex\generated_images\01a03e56-e5de-7981-8f4f-04bcda6346f7")
ANIMAL_SOURCES = Path(r"C:\Users\Dang\.codex\generated_images\01a058ee-a066-7610-ac88-aaff8a0d0a96")

THEMES = {
    "animals-land-batch-1a": (ANIMAL_SOURCES, "exec-2279fcf8-1f73-4d8f-b06d-bd163a662940.png", "elephant tiger lion rabbit fox giant-panda giraffe monkey sloth zebra hedgehog alpaca red-panda beaver pangolin tapir", ((21,22,310,311),(328,22,617,311),(636,22,925,311),(943,22,1232,311),(21,329,310,618),(328,329,617,618),(636,329,925,618),(943,329,1232,618),(21,636,310,925),(328,636,617,925),(636,636,925,925),(943,636,1232,925),(21,943,310,1232),(328,943,617,1232),(636,943,925,1232),(943,943,1232,1232))),
    "animals-land-batch-1b": (ANIMAL_SOURCES, "exec-323d3368-5d65-4e11-8183-91243ba812ba.png", "capybara rhinoceros hippopotamus camel wolf deer wild-boar tortoise", ((35,35,316,316),(336,35,617,316),(636,35,917,316),(936,35,1217,316),(35,343,316,624),(336,343,617,624),(636,343,917,624),(936,343,1217,624),(35,652,316,933))),
    "animals-land": (
        ANIMAL_SOURCES,
        "exec-90f2f048-6c31-4d50-8c90-aea3b4f4fc2c.png",
        "elephant tiger lion rabbit fox giant-panda giraffe monkey sloth zebra hedgehog alpaca red-panda beaver pangolin tapir capybara rhinoceros hippopotamus camel wolf deer wild-boar tortoise",
        ((0, 0, 251, 260), (261, 0, 493, 260), (503, 0, 749, 260), (759, 0, 991, 260), (1001, 0, 1254, 260), (0, 270, 251, 510), (261, 270, 493, 510), (503, 270, 749, 510), (759, 270, 991, 510), (1001, 270, 1254, 510), (0, 519, 251, 752), (261, 519, 493, 752), (503, 519, 749, 752), (759, 519, 991, 752), (1001, 519, 1254, 752), (0, 762, 251, 990), (261, 762, 493, 990), (503, 762, 749, 990), (759, 762, 991, 990), (1001, 762, 1254, 990), (0, 1000, 251, 1254), (261, 1000, 493, 1254), (503, 1000, 749, 1254), (759, 1000, 991, 1254), (1001, 1000, 1254, 1254)),
    ),
    "animals-land-batch-2": (
        ANIMAL_SOURCES,
        "exec-1b661876-32a8-45fc-9c9a-1d8c7225b5ad.png",
        "cheetah leopard snow-leopard lynx serval-cat hyena meerkat mongoose skunk ferret marten dhole arctic-fox fennec-fox corgi shiba-inu husky dachshund bengal-cat maine-coon scottish-fold sheep mountain-goat american-bison",
        ((0, 0, 243, 245), (254, 0, 495, 245), (506, 0, 747, 245), (758, 0, 999, 245), (1010, 0, 1254, 245), (0, 256, 243, 497), (254, 256, 495, 497), (506, 256, 747, 497), (758, 256, 999, 497), (1010, 256, 1254, 497), (0, 509, 243, 751), (254, 509, 495, 751), (506, 509, 747, 751), (758, 509, 999, 751), (1010, 509, 1254, 751), (0, 762, 243, 1003), (254, 762, 495, 1003), (506, 762, 747, 1003), (758, 762, 999, 1003), (1010, 762, 1254, 1003), (0, 1014, 243, 1254), (254, 1014, 495, 1254), (506, 1014, 747, 1254), (758, 1014, 999, 1254), (1010, 1014, 1254, 1254)),
    ),
    "animals-land-batch-3": (
        ANIMAL_SOURCES,
        "exec-3780fc12-566b-43b8-8c40-ca7262cfa62e.png",
        "dairy-cow water-buffalo foal-horse donkey llama yak gazelle wildebeest saiga-antelope spotted-deer moose reindeer mini-pig ring-tailed-lemur guinea-pig hamster chinchilla red-squirrel marmot kangaroo armadillo giant-anteater salamander axolotl",
        ((0, 0, 245, 246), (254, 0, 497, 246), (506, 0, 748, 246), (757, 0, 999, 246), (1008, 0, 1254, 246), (0, 255, 245, 498), (254, 255, 497, 498), (506, 255, 748, 498), (757, 255, 999, 498), (1008, 255, 1254, 498), (0, 507, 245, 752), (254, 507, 497, 752), (506, 507, 748, 752), (757, 507, 999, 752), (1008, 507, 1254, 752), (0, 759, 245, 1003), (254, 759, 497, 1003), (506, 759, 748, 1003), (757, 759, 999, 1003), (1008, 759, 1254, 1003), (0, 1012, 245, 1254), (254, 1012, 497, 1254), (506, 1012, 748, 1254), (757, 1012, 999, 1254), (1008, 1012, 1254, 1254)),
    ),
    "animals-land-batch-4": (
        ANIMAL_SOURCES,
        "exec-68344041-4d02-48b0-ae7e-2ac688c920ce.png",
        "chameleon monitor-lizard toad tree-frog newt box-turtle sulcata-tortoise gecko corn-snake cobra-snake ball-python green-iguana tarantula rhinoceros-beetle stick-insect praying-mantis ladybug worker-ant cricket caterpillar african-pygmy-hedgehog echidna aardvark wombat",
        ((0, 0, 245, 248), (253, 0, 497, 248), (505, 0, 749, 248), (757, 0, 999, 248), (1008, 0, 1254, 248), (0, 257, 245, 503), (253, 257, 497, 503), (505, 257, 749, 503), (757, 257, 999, 503), (1008, 257, 1254, 503), (0, 510, 245, 757), (253, 510, 497, 757), (505, 510, 749, 757), (757, 510, 999, 757), (1008, 510, 1254, 757), (0, 765, 245, 1005), (253, 765, 497, 1005), (505, 765, 749, 1005), (757, 765, 999, 1005), (1008, 765, 1254, 1005), (0, 1013, 245, 1254), (253, 1013, 497, 1254), (505, 1013, 749, 1254), (757, 1013, 999, 1254), (1008, 1013, 1254, 1254)),
    ),
    "animals-land-batch-5": (
        ANIMAL_SOURCES,
        "exec-5484a584-75cd-498f-a773-33e9ac0bf3c1.png",
        "baby-koala quokka possum red-kangaroo wallaby european-badger wolverine pine-marten sable civet genet binturong coati kinkajou peccary brazilian-tapir babirusa okapi bongo-antelope oryx kudu alpine-ibex markhor pronghorn",
        ((0, 0, 251, 251), (251, 0, 502, 251), (502, 0, 752, 251), (752, 0, 1003, 251), (1003, 0, 1254, 251), (0, 251, 251, 502), (251, 251, 502, 502), (502, 251, 752, 502), (752, 251, 1003, 502), (1003, 251, 1254, 502), (0, 502, 251, 752), (251, 502, 502, 752), (502, 502, 752, 752), (752, 502, 1003, 752), (1003, 502, 1254, 752), (0, 752, 251, 1003), (251, 752, 502, 1003), (502, 752, 752, 1003), (752, 752, 1003, 1003), (1003, 752, 1254, 1003), (0, 1003, 251, 1254), (251, 1003, 502, 1254), (502, 1003, 752, 1254), (752, 1003, 1003, 1254), (1003, 1003, 1254, 1254)),
    ),
    "cyberpunk": ("exec-fea4ecb5-f5e2-42eb-bc34-683cbe0b7fb3.png", "delivery-robot robot-cat round-drone neon-helmet ar-glasses robotic-arm ai-chip glowing-circuit-board energy-battery hologram-speaker vending-machine neon-arrow future-motorcycle flying-taxi teleport-gate tech-suitcase cyber-headphones holographic-keyboard drone-camera mini-satellite neon-tree electronic-mask laser-toolbox data-crystal"),
    "magic-rpg": ("exec-6297f86f-17ad-419d-b0fe-2130f4eee9e3.png", "magic-wand spellbook red-potion blue-potion crystal-ball wizard-hat flying-broom baby-dragon baby-phoenix baby-unicorn treasure-chest antique-key magic-ring moon-amulet glowing-sword rune-shield wizard-staff magic-mushroom glowing-flower poisonous-mushroom purple-crystal map-scroll magic-lantern rune-stone-gate"),
    "space": ("exec-c571df32-808c-46ca-915b-d8fa27f6fb35.png", "rocket astronaut green-alien ufo spaceship space-station satellite mars-rover sun mercury venus earth moon mars jupiter saturn uranus neptune comet meteor telescope black-hole nebula constellation"),
    "household": ("exec-db6352d3-bf80-47ac-8985-964b8d261912.png", "desk-lamp alarm-clock armchair stool body-pillow folded-blanket tea-kettle ceramic-cup plate bowl cooking-pot frying-pan refrigerator microwave toaster table-fan vacuum-cleaner washing-machine iron tv-remote television picture-frame flower-vase potted-plant"),
    "office-supplies": ("exec-d104fc18-ecfd-4474-8301-a1973e7758e7.png", "pencil ink-pen highlighter eraser pencil-sharpener ruler scissors glue-stick tape-roll paper-clip binder-clip push-pin stapler notebook desk-calendar file-folder clipboard envelope calculator keyboard computer-mouse usb-drive printer reading-glasses"),
    "garden-tools": ("exec-f8838584-7c16-4b59-837b-e4a37ea68c56.png", "hand-trowel shovel leaf-rake small-hoe pruning-shears watering-can coiled-hose spray-bottle gardening-gloves wheelbarrow terracotta-pot soil-bag seed-packet cactus seedling tulip-bush sunflower pumpkin carrot tomato red-apple bird-nest mini-greenhouse wooden-fence"),
    "fashion": ("exec-b3218692-e327-4b95-966b-4c524a375614.png", "tshirt denim-jacket sweater dress jeans sneakers boots sandals baseball-cap beret knit-beanie sunglasses round-glasses wristwatch bracelet necklace ring earrings handbag backpack wallet scarf belt hair-bow"),
    "vehicles": ("exec-9bb2f562-e76f-4192-9810-1443547c9974.png", "bicycle motorcycle electric-scooter small-car taxi bus fire-truck ambulance police-car delivery-truck dump-truck tractor construction-wheelbarrow train tram sailboat speedboat submarine helicopter airplane hot-air-balloon cable-car skateboard snowmobile"),
    "antiques-spy": ("exec-ded2b14f-6c53-458d-aabd-a13255a545d4.png", "antique-compass magnifying-glass vintage-camera mini-spy-camera periscope pocket-watch brass-key antique-padlock map-scroll egyptian-cat-statue golden-mask ancient-vase vinyl-record rotary-telephone typewriter music-box telescope oil-lamp wax-seal cipher-book spy-suitcase lapel-microphone secret-earpiece glowing-footprint"),
    "festivals": ("exec-46bd12bc-aa25-4b52-9797-ab3f1d128e35.png", "red-lantern yellow-apricot-blossom banh-chung lucky-envelope festival-drum lion-dance-head christmas-tree golden-bell christmas-stocking candy-cane halloween-pumpkin jack-o-lantern witch-hat easter-egg easter-bunny fireworks balloons birthday-cake birthday-candle triangular-bunting carnival-mask confetti flower-wreath ribbon-gift"),
}

SPECIAL_ASSET_NAMES = {
    "animals-land-batch-1b": "crystal-antlered-deer",
    "animals-land": "mythical-griffin",
    "animals-land-batch-2": "mythical-winged-lion",
    "animals-land-batch-3": "mythical-winged-lynx",
    "animals-land-batch-4": "crystal-crowned-chimera",
    "animals-land-batch-5": "prismatic-antlered-deer",
}

OUTPUT_THEMES = {
    "animals-land-batch-1a": "animals-land",
    "animals-land-batch-1b": "animals-land",
    "animals-land-batch-2": "animals-land",
    "animals-land-batch-3": "animals-land",
    "animals-land-batch-4": "animals-land",
    "animals-land-batch-5": "animals-land",
}

selected_themes = sys.argv[1:] or list(THEMES)
unknown_themes = set(selected_themes) - set(THEMES)
if unknown_themes:
    raise ValueError(f"Unknown themes: {', '.join(sorted(unknown_themes))}")

for theme in selected_themes:
    config = THEMES[theme]
    if len(config) == 2:
        source_directory, source_name, names_string, boxes = SOURCES, *config, None
    else:
        source_directory, source_name, names_string, boxes = config
    names = names_string.split()
    if len(names) not in (8, 16, 24):
        raise ValueError(f"{theme} must have 8, 16, or 24 names")
    with Image.open(source_directory / source_name) as source:
        if source.width != source.height:
            raise ValueError(f"{source_name} is not square")
        target_theme = OUTPUT_THEMES.get(theme, theme)
        target_dir = ROOT / "public" / "assets" / "images" / "themes" / target_theme
        target_dir.mkdir(parents=True, exist_ok=True)
        for index, name in enumerate(names):
            if boxes:
                box = boxes[index]
            else:
                column, row = index % 5, index // 5
                box = (
                    round(column * source.width / 5),
                    round(row * source.height / 5),
                    round((column + 1) * source.width / 5),
                    round((row + 1) * source.height / 5),
                )
            card = source.crop(box).resize((256, 256), Image.Resampling.LANCZOS)
            card.save(target_dir / f"{name}.webp", "WEBP", quality=90, method=6)
            card.close()
        if theme in SPECIAL_ASSET_NAMES:
            special_box = boxes[len(names)] if boxes else (
                round(4 * source.width / 5),
                round(4 * source.height / 5),
                source.width,
                source.height,
            )
            special_dir = target_dir / "special"
            special_dir.mkdir(exist_ok=True)
            special = source.crop(special_box).resize((256, 256), Image.Resampling.LANCZOS)
            special.save(special_dir / f"{SPECIAL_ASSET_NAMES[theme]}.webp", "WEBP", quality=90, method=6)
            special.close()
