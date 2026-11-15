"""Prepare review images; never marks assets ready or changes runtime files."""
import hashlib
import json
from collections import deque
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[3]
ART = Path(__file__).resolve().parent

def opening(im):
    a = im.getchannel('A')
    w, h = im.size
    center = (w // 2, h // 2)
    assert a.getpixel(center) < 8, 'Frame center is not transparent'
    seen = {center}
    queue = deque([center])
    while queue:
        x, y = queue.popleft()
        for p in ((x-1,y),(x+1,y),(x,y-1),(x,y+1)):
            if 0 <= p[0] < w and 0 <= p[1] < h and p not in seen and a.getpixel(p) < 8:
                seen.add(p)
                queue.append(p)
    assert not any(x in (0,w-1) or y in (0,h-1) for x,y in seen), 'Frame opening leaks to outside'
    xs, ys = zip(*seen)
    return (min(xs), min(ys), max(xs)+1, max(ys)+1)

def box(im, kind):
    return opening(im) if kind == 'frame' else im.getchannel('A').point(lambda a: 255 if a > 16 else 0).getbbox()

def safe_frame_scale(im, source, target, scale):
    """Uniformly retain outer tips, then verify face clearance before export."""
    bounds = im.getchannel('A').point(lambda a: 255 if a > 128 else 0).getbbox()
    cx, cy = (source[0]+source[2])/2, (source[1]+source[3])/2
    tx, ty = (target[0]+target[2])/2, (target[1]+target[3])/2
    if min(tx+scale*(bounds[0]-cx), ty+scale*(bounds[1]-cy),
           512-tx-scale*(bounds[2]-cx), 512-ty-scale*(bounds[3]-cy)) > 0:
        return scale
    return min(scale, (tx-3)/(cx-bounds[0]), (509-tx)/(bounds[2]-cx),
               (ty-3)/(cy-bounds[1]), (509-ty)/(bounds[3]-cy))


def prepare():
    journal = json.loads((ART/'journal.json').read_text(encoding='utf-8-sig'))
    inventory = json.loads((ART.parent/'cosmetic-art-batches.json').read_text(encoding='utf-8-sig'))
    items = {i['id']: i for b in inventory['batches'] for i in b['items']}
    out = ART/'aligned-candidates'
    out.mkdir(exist_ok=True)
    records = []
    latest = {(r['id'],r['form']):r for r in journal['records']}
    for r in latest.values():
        item = items[r['id']]
        master = ROOT/r['master']
        base = Image.open(ROOT/'public'/item['baseFiles']['512']).convert('RGBA')
        src = Image.open(master).convert('RGBA')
        target, source = box(base,item['type']), box(src,item['type'])
        scale = min((target[2]-target[0])/(source[2]-source[0]), (target[3]-target[1])/(source[3]-source[1]))
        if item['type'] == 'frame':
            scale = safe_frame_scale(src, source, target, scale)
        tx = (target[0]+target[2])/2 - scale*(source[0]+source[2])/2
        ty = (target[1]+target[3])/2 - scale*(source[1]+source[3])/2
        aligned = src.transform((512,512),Image.Transform.AFFINE,(1/scale,0,-tx/scale,0,1/scale,-ty/scale),Image.Resampling.BICUBIC)
        path = out/f"{r['id']}-form{r['form']}.png"
        aligned.save(path)
        records.append(dict(id=r['id'],form=r['form'],master=master.relative_to(ROOT).as_posix(),candidate=path.relative_to(ROOT).as_posix(),alignment=dict(method='uniform-scale-and-translate',scale=scale,translation=[tx,ty],sourceAnchorBox=source,targetAnchorBox=target,anchorKind='inner-opening' if item['type']=='frame' else 'alpha-footprint'),sha256=hashlib.sha256(master.read_bytes()).hexdigest(),status='pending-visual-qa'))
    (ART/'alignment-review.json').write_text(json.dumps(dict(version=1,records=records),indent=2)+'\n',encoding='utf-8')
    ids = list(dict.fromkeys(r['id'] for r in records))
    sheet = Image.new('RGB',(960,200*len(ids)), '#21404a')
    draw = ImageDraw.Draw(sheet)
    for y,id in enumerate(ids):
        item = items[id]
        for form in (1,2,3):
            path = ROOT/'public'/item['baseFiles']['512'] if form==1 else out/f'{id}-form{form}.png'
            im = Image.open(path).convert('RGBA').resize((180,180),Image.Resampling.LANCZOS)
            sheet.paste(im,((form-1)*200,y*200),im)
        draw.text((600,y*200+20),id,fill='white')
    sheet.save(ART/'aligned-review.png')
    print(f'Prepared {len(records)} candidates; no production exports or ready claims.')

if __name__ == '__main__':
    prepare()
