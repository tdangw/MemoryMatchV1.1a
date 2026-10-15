from pathlib import Path
from PIL import Image
root=Path.cwd()
inputs={'missions-garden':'missions-garden','friends-courtyard':'friends-courtyard','profile-keepsake':'profile-keepsake','settings-retreat':'settings-retreat'}
for name in inputs:
 source=root/'docs/design/app-tabs/backgrounds'/f'{name}-master.png'
 target=root/'public/assets/images/backgrounds'/f'{name}.webp'
 with Image.open(source) as im: im.save(target,'WEBP',quality=80,method=6)
 print(target.name,target.stat().st_size)
source=root/'docs/design/app-tabs/art/botanical-header-flourish-master.png'
target=root/'public/assets/images/backgrounds/botanical-header-flourish.webp'
with Image.open(source) as im:
 im.thumbnail((384,128),Image.Resampling.LANCZOS)
 im.save(target,'WEBP',quality=85,method=6)
print(target.name,target.stat().st_size)
