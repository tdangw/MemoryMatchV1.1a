from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCES = Path(r"C:\Users\Dang\.codex\generated_images\01a03e56-e5de-7981-8f4f-04bcda6346f7")

THEMES = {
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

for theme, (source_name, names_string) in THEMES.items():
    names = names_string.split()
    if len(names) != 24:
        raise ValueError(f"{theme} must have 24 names")
    with Image.open(SOURCES / source_name) as source:
        if source.width != source.height:
            raise ValueError(f"{source_name} is not square")
        target_dir = ROOT / "public" / "assets" / "images" / "themes" / theme
        target_dir.mkdir(parents=True, exist_ok=True)
        for index, name in enumerate(names):
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
