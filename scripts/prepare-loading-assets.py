"""Prepare the approved startup background; masters stay outside the web bundle."""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "docs/design/loading/masters/garden-gate-v1.png"
OUTPUT = ROOT / "public/assets/images/loading/garden-gate-v1.webp"
OUTPUT.parent.mkdir(parents=True, exist_ok=True)
with Image.open(SOURCE) as master:
    master.convert("RGB").resize((960, 1440), Image.Resampling.LANCZOS).save(
        OUTPUT, quality=82, method=6
    )
if OUTPUT.stat().st_size > 200_000:
    raise ValueError("Startup background exceeds the 200 KB transfer budget")
print(f"Prepared {OUTPUT.name}: {OUTPUT.stat().st_size} bytes")
