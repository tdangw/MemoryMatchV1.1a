"""Export the approved Home artwork; no drawing/cropping or text is performed here."""
from pathlib import Path
import hashlib
import json
from PIL import Image

root = Path(__file__).resolve().parents[1]
source = root / 'docs/design/home-assets/masters'
target = root / 'public/assets/images/home'
target.mkdir(parents=True, exist_ok=True)
assets = {'memory-match': ('memory-match-v2.png', 'memory-match-v2.webp', (576, 768)), 'link-connect': ('link-connect-v1.png', 'link-connect.webp', (576, 720)), 'triple-connect': ('triple-connect-v1.png', 'triple-connect.webp', (576, 720))}
records = []
for game, (filename, runtime, size) in assets.items():
    master = source / filename
    output = target / runtime
    with Image.open(master) as original:
        original_size = original.size
        image = original.convert('RGB')
        image.thumbnail(size, Image.Resampling.LANCZOS)
        image.save(output, 'WEBP', quality=72, method=6)
    records.append({'game': game, 'master': master.relative_to(root).as_posix(), 'sourceSize': original_size, 'runtime': output.relative_to(root).as_posix(), 'size': image.size, 'bytes': output.stat().st_size, 'sha256': hashlib.sha256(output.read_bytes()).hexdigest()})
assert sum(record['bytes'] for record in records) <= 350_000, 'Home artwork exceeds the approved transfer budget'
(root / 'docs/design/home-assets/runtime-metadata-v2.json').write_text(json.dumps(records, indent=2) + '\n', encoding='utf-8')
for record in records:
    print(record['game'], record['size'], record['bytes'])
