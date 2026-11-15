"""Encode selected illustrations/reused sources; never repaint artwork."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import hashlib, json

ROOT = Path(__file__).resolve().parents[1]
DESIGN = ROOT / 'design/shop-catalog'
TARGET = ROOT / 'public/assets/shop-catalog'
for version in ['v1','v2']: (TARGET/version).mkdir(parents=True,exist_ok=True)
previous=DESIGN/'previous-public-manifest.json'
if not previous.exists(): previous.write_bytes((DESIGN/'art-manifest.json').read_bytes())
illustrations={}
for record in sorted((DESIGN/'generation-records').glob('*.json')):
    for item in json.loads(record.read_text(encoding='utf-8'))['entries']:
        if item['key'] in illustrations: raise ValueError(f"Duplicate illustration: {item['key']}")
        illustrations[item['key']]=item
regions = json.loads((ROOT / 'docs/design/ui-images/regions.json').read_text(encoding='utf-8'))
support = {'hint':'icon-search','undo':'icon-undo','shuffle':'icon-shuffle','preview':'icon-eye','freeze':'icon-freeze','expand':'icon-expand'}
assets = {}
def digest(path): return hashlib.sha256(path.read_bytes()).hexdigest()
def encode(key, image, source, point=None):
    image = image.convert('RGBA')
    bounds = image.getchannel('A').point(lambda a: 255 if a > 8 else 0).getbbox()
    if not bounds: raise ValueError(f'Empty capture: {key}')
    anchor = None
    original = image.size
    image = image.crop(bounds)
    if point: point = (point[0]*original[0]-bounds[0],point[1]*original[1]-bounds[1])
    files = {}
    for size in [128,256]:
        factor = min(size*.88/image.width,size*.88/image.height)
        scaled = image.resize((max(1,round(image.width*factor)),max(1,round(image.height*factor))),Image.Resampling.LANCZOS)
        canvas = Image.new('RGBA',(size,size)); left=(size-scaled.width)//2;top=(size-scaled.height)//2;canvas.alpha_composite(scaled,(left,top))
        path=TARGET/('v1' if key.startswith('support/') else 'v2')/f"{key.replace('/','-')}-{size}.webp";canvas.save(path,'WEBP',quality=84,method=6,exact=True)
        files[str(size)]={'url':'/'+path.relative_to(ROOT/'public').as_posix(),'bytes':path.stat().st_size,'sha256':digest(path)}
        if point:anchor=[round((left+point[0]*factor)/size,4),round((top+point[1]*factor)/size,4)]
    assets[key]={'source':source,'files':files,**({'numberAnchor':anchor} if anchor else {})}
for kind,name in support.items():
    entry=next(x for x in regions if x['name']==name)
    source=ROOT/'docs/design/ui-images/masters'/entry['source']
    image=Image.open(source).crop(entry['rect'])
    encode('support/'+kind,image,{'file':source.relative_to(ROOT).as_posix(),'rect':entry['rect'],'method':'reuse-approved-ui-art'})
for kind in ['time','thunder']:
    source=DESIGN/'masters'/f'{kind}-v1.png'
    encode('support/'+kind,Image.open(source),{'file':source.relative_to(ROOT).as_posix(),'sha256':digest(source),'method':'imagegen'},(.484,.568) if kind=='time' else None)
capture=json.loads((DESIGN/'capture-manifest.json').read_text(encoding='utf-8'))
for item in capture['entries']:
    key=item['kind']+'/'+item['id']
    if key=='theme/default':
        source=ROOT/'android/app/src/main/res/drawable/app_icon_art.png'
        details={'method':'reuse-launcher','file':source.relative_to(ROOT).as_posix(),'sha256':digest(source)}
    elif key in illustrations:
        source=DESIGN/illustrations[key]['master']
        if Image.open(source).getchannel('A').getextrema()[0]!=0: raise ValueError(f'Illustration needs true alpha: {key}')
        details={'method':'illustration','file':source.relative_to(ROOT).as_posix(),'sha256':digest(source),'referenceRenderer':item['source']}
    else:
        source=DESIGN/'captures'/f"{item['kind']}-{item['id']}.png"
        details={'file':source.relative_to(ROOT).as_posix(),'sha256':digest(source),'method':'reuse-rendered-back','renderer':item['source'],'frameMs':item['frameMs'],'seed':capture['seed']}
    encode(key,Image.open(source),details)
manifest={'version':2,'assets':assets}
(DESIGN/'art-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
# QA sheet is not shipped in the application.
keys=list(assets);cell=150;columns=8;rows=(len(keys)+columns-1)//columns
sheet=Image.new('RGB',(columns*cell,rows*(cell+25)), '#153440');draw=ImageDraw.Draw(sheet)
font=ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf',11)
for index,key in enumerate(keys):
    x=index%columns*cell;y=index//columns*(cell+25)
    image=Image.open(ROOT/'public'/assets[key]['files']['128']['url'].lstrip('/')).convert('RGBA');sheet.paste(image,(x+11,y+8),image)
    draw.text((x+4,y+139),key[:26],font=font,fill='#fff1c5')
sheet.save(DESIGN/'contact-sheet.png')
print(json.dumps({'assets':len(assets),'exports':len(assets)*2,'bytes':sum(f['bytes'] for a in assets.values() for f in a['files'].values()),'largest128':max(a['files']['128']['bytes'] for a in assets.values()),'largest256':max(a['files']['256']['bytes'] for a in assets.values())}))
