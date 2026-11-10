"""Export only the explicitly reviewed first six items. Never edits game catalogs."""
import hashlib
import json
from pathlib import Path
from PIL import Image
from prepare_candidates import opening

ART = Path(__file__).resolve().parent
ROOT = ART.parents[2]
REVIEWED = {
    'event-avatar-lantern-otter', 'starter-frame-plain-wood',
    'starter-badge-first-leaf', 'memory-avatar-sapphire-owl',
    'memory-badge-wisdom',
}
alignment = json.loads((ART/'alignment-review.json').read_text(encoding='utf-8'))
journal = json.loads((ART/'journal.json').read_text(encoding='utf-8'))
records = []
for r in alignment['records']:
    if r['id'] not in REVIEWED:
        continue
    im = Image.open(ROOT/r['candidate']).convert('RGBA')
    assert im.size == (512,512)
    assert im.getchannel('A').getextrema() == (0,255)
    bbox = im.getchannel('A').getbbox()
    assert bbox[0]>0 and bbox[1]>0 and bbox[2]<512 and bbox[3]<512, 'Clipped artwork'
    if '-frame-' in r['id']:
        opening(im)
    source = next(s for s in reversed(journal['records']) if (s['id'],s['form'])==(r['id'],r['form']))
    exports = []
    for size in (128,256,512):
        relative = f"assets/achievements/evolution/v1/{r['id']}-form{r['form']}-{size}.webp"
        path = ROOT/'public'/relative
        path.parent.mkdir(parents=True,exist_ok=True)
        im.resize((size,size),Image.Resampling.LANCZOS).save(path,'WEBP',lossless=True,method=6)
        check = Image.open(path)
        assert check.size == (size,size) and check.mode == 'RGBA'
        if '-frame-' in r['id']:
            assert check.getpixel((size//2,size//2))[3] == 0
        exports.append(dict(path=relative,dimensions=[size,size],bytes=path.stat().st_size,sha256=hashlib.sha256(path.read_bytes()).hexdigest()))
    records.append(dict(id=r['id'],form=r['form'],status='ready',master=r['master'],masterSha256=r['sha256'],canvas=[512,512],alignment=r['alignment'],promptReference=source.get('promptReference',f"prompts.json#{r['id']}/form{r['form']}" if r['id'].startswith('memory-') else None),promptStatus=source.get('promptStatus','archived-verbatim'),qa=dict(status='passed',scope='First six items: 216 cross-equipment combinations at 116 and 52px; source and three-form visual review',evidence=['aligned-review.png', 'cross-*.png'],limitations='Cross-match with remaining 95 items will be verified as production continues.'),exports=exports))
    source['status']='exported-qa-passed'
    source['exports']=exports
manifest = dict(version=1,status='partial',expectedDesignCount=202,expectedExportCount=606,readyDesignCount=len(records),readyExportCount=sum(len(r['exports']) for r in records),records=records)
(ART/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(ART/'journal.json').write_text(json.dumps(journal,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(f"Exported {manifest['readyDesignCount']} designs / {manifest['readyExportCount']} WebP files / {sum(e['bytes'] for r in records for e in r['exports'])} bytes")
