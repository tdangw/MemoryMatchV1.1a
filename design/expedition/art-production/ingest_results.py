"""Register completed built-in imagegen results from a saved result document."""
import hashlib
import json
import sys
from pathlib import Path
from PIL import Image

ART = Path(__file__).resolve().parent
ROOT = ART.parents[2]

def ingest(path):
    journal = json.loads((ART/'journal.json').read_text(encoding='utf-8-sig'))
    prompts = json.loads((ART/'prompts.json').read_text(encoding='utf-8-sig'))
    for r in json.loads(Path(path).read_text(encoding='utf-8-sig'))['records']:
        if 'error' in r:
            continue
        master = ROOT/r['master']
        im = Image.open(master).convert('RGBA')
        key = r['id'],r['form'],r['revision']
        if not any((x['id'],x['form'],x.get('revision'))==key for x in journal['records']):
            journal['records'].append(dict(id=r['id'],form=r['form'],revision=r['revision'],master=r['master'],generationSource=r['generationSource'],dimensions=list(im.size),alphaBBox=list(im.getchannel('A').getbbox()),sha256=hashlib.sha256(master.read_bytes()).hexdigest(),status='generated-pending-alignment-qa',exports=None,promptReference=f"prompts.json#{r['id']}/form{r['form']}/{r['revision']}"))
        for p in prompts['records']:
            if (p['id'],p['form'],p.get('revision'))==key:
                p.update(status='generated-pending-alignment-qa',master=r['master'])
    for name,value in [('journal.json',journal),('prompts.json',prompts)]:
        (ART/name).write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print('Registered confirmed results; no QA approvals added.')

if __name__ == '__main__':
    ingest(sys.argv[1])
