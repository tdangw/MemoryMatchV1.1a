"""Convert approved, transparent two-state image strips; no artwork is drawn here."""
import json
from pathlib import Path
from shutil import copy2
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'runtime/art-source/chests'
MANIFEST = json.loads((SOURCE / 'manifest.json').read_text(encoding='utf-8'))
ACTIVE = ROOT / 'public/assets/rewards/chests'
RESERVE = ROOT / 'design/chests/reserve'
ACTIVE.mkdir(parents=True, exist_ok=True)
RESERVE.mkdir(parents=True, exist_ok=True)
labels = {'c':'C', 'avatar':'Avatar', 'frame':'Khung', 'badge':'Huy hieu', 'coins':'Xu', 'mystery':'Ngau nhien', 'cosmetic':'Ngoai hinh', 'flip':'Lat the', 'theme':'Chu de', 'path':'Duong noi', 'exit':'Xoa the', 'support':'Ho tro', 'ice':'Bang', 'fire':'Lua', 'forest':'Rung', 'cosmic':'Thien van'}
preview = Image.new('RGB', (960, 1080), '#16313e')
draw = ImageDraw.Draw(preview)
font = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 18)
stats = []
for index, (kind, asset) in enumerate(MANIFEST['assets'].items()):
    original = Path(asset['source'])
    source = SOURCE / f'{kind}-source.png'
    if not source.exists():
        copy2(original, source)
    strip = Image.open(source).convert('RGBA')
    width, height = strip.size
    if width != height * 2 or strip.getchannel('A').getextrema() != (0, 255):
        raise ValueError(f'{kind}: expected transparent 2:1 strip, got {strip.size}')
    for column, state in enumerate(['closed', 'open']):
        cell = strip.crop((column * height, 0, (column + 1) * height, height))
        # Ignore near-invisible generator alpha noise only for the boundary check; preserve all pixels in the output.
        bounds = cell.getchannel('A').point(lambda alpha: 255 if alpha > 32 else 0).getbbox()
        if not bounds or bounds[0] == 0 or bounds[1] == 0 or bounds[2] == height or bounds[3] == height:
            raise ValueError(f'{kind}/{state}: subject touches cell boundary')
        output = (RESERVE if asset['reserve'] else ACTIVE) / f'{kind}-{state}.webp'
        cell.resize((256, 256), Image.Resampling.LANCZOS).save(output, 'WEBP', quality=90, method=6)
        decoded = Image.open(output)
        if decoded.size != (256, 256) or decoded.mode != 'RGBA':
            raise ValueError(f'Invalid output: {output}')
        stats.append({'file':str(output.relative_to(ROOT)), 'bytes':output.stat().st_size})
        thumb = decoded.resize((112,112), Image.Resampling.LANCZOS)
        x, y = (index % 4)*240 + column*112 + 8, (index//4)*270 + 32
        preview.paste(thumb, (x,y), thumb)
        small=decoded.resize((48,48), Image.Resampling.LANCZOS)
        preview.paste(small,(x+32,y+128),small)
    draw.text(((index%4)*240+10,(index//4)*270+8),labels[kind]+(' (du phong)' if asset['reserve'] else ''),font=font,fill='#fff0bd')
preview.save(SOURCE / 'chest-catalog.png')
(SOURCE / 'outputs.json').write_text(json.dumps(stats,indent=2),encoding='utf-8')
print(f'{len(stats)} transparent 256x256 WebP images; active bytes: '+str(sum(row['bytes'] for row in stats if row['file'].startswith('public'))))
