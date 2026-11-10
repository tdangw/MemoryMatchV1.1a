"""Build cross-equipment QA sheets at actual display sizes, without runtime edits."""
from pathlib import Path
from PIL import Image, ImageDraw

ART = Path(__file__).resolve().parent
ROOT = ART.parents[2]
AVATARS = ['event-avatar-lantern-otter','memory-avatar-sapphire-owl']
FRAMES = ['starter-frame-plain-wood','memory-frame-golden-laurel']
BADGES = ['starter-badge-first-leaf','memory-badge-wisdom']

def load(id,form):
    path = ROOT/'public/assets/achievements/v1'/f'{id}-512.webp' if form==1 else ART/'aligned-candidates'/f'{id}-form{form}.png'
    return Image.open(path).convert('RGBA')

def compose(a,f,b,size):
    im = load(*a).resize((size,size),Image.Resampling.LANCZOS)
    im.alpha_composite(load(*f).resize((size,size),Image.Resampling.LANCZOS))
    badge = load(*b).resize((round(size*.28),round(size*.28)),Image.Resampling.LANCZOS)
    im.alpha_composite(badge,(round(size*.36),round(size*.684)))
    return im

for badge in BADGES:
    for bf in (1,2,3):
        sheet = Image.new('RGB',(1080,900),'#21404a')
        d = ImageDraw.Draw(sheet)
        for row,a in enumerate((id,form) for id in AVATARS for form in (1,2,3)):
            for col,f in enumerate((id,form) for id in FRAMES for form in (1,2,3)):
                x,y=col*180,row*150
                im=compose(a,f,(badge,bf),116)
                sheet.paste(im,(x,y),im)
                im=compose(a,f,(badge,bf),52)
                sheet.paste(im,(x+120,y+60),im)
                d.text((x,y+120),f'a{row+1} f{col+1} b{bf}',fill='white')
        sheet.save(ART/f'cross-{badge}-form{bf}.png')
print('216 combinations rendered at 116px and 52px; badges 32px and 15px.')
