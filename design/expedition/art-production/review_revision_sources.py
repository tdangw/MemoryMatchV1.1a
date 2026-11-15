"""Verify and preview revision sources; does not approve product exports."""
import hashlib,json,math
from pathlib import Path
from PIL import Image,ImageDraw
A=Path(__file__).resolve().parent
R=A.parents[2]
jobs=sum([json.loads((A/n).read_text(encoding='utf-8'))['records'] for n in ['jobs-repair-2026-11-11.json','jobs-older-repair-2026-11-11.json','jobs-extra-repair-2026-11-11.json','jobs-wish-knot-revision-2026-11-11.json']],[])
journal=json.loads((A/'journal.json').read_text(encoding='utf-8'))['records']
prompts=json.loads((A/'prompts.json').read_text(encoding='utf-8'))['records']
records=[]
def tile(path,bg,size=224):
    im=Image.open(path).convert('RGBA').resize((size,size),Image.Resampling.LANCZOS)
    return Image.alpha_composite(Image.new('RGBA',(size,size),bg),im).convert('RGB')
for i,j in enumerate(jobs):
    r=next(x for x in reversed(journal) if (x['id'],x['form'],x.get('revision'))==(j['id'],j['form'],j['revision']))
    p=R/r['master']; im=Image.open(p).convert('RGBA')
    assert hashlib.sha256(p.read_bytes()).hexdigest()==r['sha256']
    assert min(im.size)>=512 and im.getchannel('A').getextrema()==(0,255)
    assert any((x['id'],x['form'],x.get('revision'),x['prompt'])==(j['id'],j['form'],j['revision'],j['prompt']) for x in prompts)
    box=im.getchannel('A').point(lambda v:255 if v>128 else 0).getbbox()
    records.append(dict(id=j['id'],form=j['form'],revision=j['revision'],master=r['master'],sha256=r['sha256'],strongAlphaBBox=box,opaqueMarginPixels=min(box[0],box[1],im.width-box[2],im.height-box[3]),status='revision-source-review-pending'))
for group in range(math.ceil(len(jobs)/4)):
    part=jobs[group*4:(group+1)*4]
    sheet=Image.new('RGB',(960,len(part)*270),'#21404a'); d=ImageDraw.Draw(sheet)
    for row,j in enumerate(part):
        paths=[R/j['reference'],R/j['references'][0],R/records[group*4+row]['master'],R/records[group*4+row]['master']]
        for col,p in enumerate(paths):
            sheet.paste(tile(p,'#111827' if col<3 else '#f5f5f5'),(col*240,row*270+24))
        d.text((4,row*270+4),j['id']+' form'+str(j['form'])+' | original / previous / revised-dark / revised-light',fill='white')
        if '-badge-' in j['id']:
            small=tile(paths[2],'#111827',32); sheet.paste(small,(920,row*270+230))
    sheet.save(A/f'repair-source-review-{group+1}-2026-11-11.png')
(A/'repair-source-checks-2026-11-11.json').write_text(json.dumps(dict(version=1,records=records),indent=2)+'\n',encoding='utf-8')
print(f'{len(records)} revision sources verified; source comparison sheets saved.')
