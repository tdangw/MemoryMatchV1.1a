"""Render previously recorded inspection concerns on real opaque backgrounds."""
import json,math
from pathlib import Path
from PIL import Image,ImageDraw
A=Path(__file__).resolve().parent; R=A.parents[2]
j=json.loads((A/'journal.json').read_text(encoding='utf-8'))['records']
latest={(r['id'],r['form']):r for r in j}
concerns=[r for r in latest.values() if r.get('qaNotes') and r.get('qaNotes','').split('runtime.')[-1].strip() and r['status']!='exported-qa-passed']
ids=list(dict.fromkeys(r['id'] for r in concerns))
for g in range(math.ceil(len(ids)/4)):
    part=ids[g*4:(g+1)*4]; sheet=Image.new('RGB',(960,len(part)*200),'#21404a'); d=ImageDraw.Draw(sheet)
    for row,id in enumerate(part):
        paths=[R/'public/assets/achievements/v1'/f'{id}-512.webp']
        paths.extend(R/latest[id,f]['master'] for f in (2,3) if (id,f) in latest)
        for col,p in enumerate(paths):
            im=Image.open(p).convert('RGBA').resize((160,160),Image.Resampling.LANCZOS)
            for bgno,bg in enumerate(('#111827','#f5f5f5')):
                t=Image.alpha_composite(Image.new('RGBA',(160,160),bg),im).convert('RGB')
                sheet.paste(t,(col*320+bgno*160,row*200+25))
        d.text((4,row*200+4),id+' | original dark/light / form2 dark/light / form3 dark/light',fill='white')
    sheet.save(A/f'recorded-concerns-review-{g+1}-2026-11-11.png')
(A/'recorded-concerns-review-2026-11-11.json').write_text(json.dumps(dict(version=1,items=ids,records=concerns),indent=2)+'\n',encoding='utf-8')
print(f'{len(concerns)} recorded inspection concerns across {len(ids)} items rendered.')
