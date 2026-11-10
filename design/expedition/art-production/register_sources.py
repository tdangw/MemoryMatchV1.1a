"""Register explicitly generated sources without approving them for production."""
import hashlib
import json
from pathlib import Path
from PIL import Image

ART = Path(__file__).resolve().parent
ROOT = ART.parents[2]
GENERATED = Path('C:/Users/Dang/.codex/generated_images/01a1bc02-7510-79f3-a60e-a1a441cec2c1')
SOURCES = [
    ('memory-avatar-sapphire-owl',2,'r2','exec-e1e4ab0f-7e57-43bd-b18c-ea781a3d81d5.png'),
    ('memory-avatar-sapphire-owl',3,'r2','exec-0f69eb59-5e46-4986-aefa-0117b7a4c598.png'),
    ('memory-avatar-cherry-rabbit',2,'r1','exec-b50bf582-d666-415b-a8d6-18b1da8fb133.png'),
    ('memory-avatar-cherry-rabbit',3,'r1','exec-89349f7d-5b95-4dfc-90e1-671393d6f92f.png'),
    ('memory-frame-cherry-blossom',2,'r1','exec-ae88e29d-ec2a-4aab-8c5a-e0a8c5bece2b.png'),
    ('memory-frame-cherry-blossom',3,'r1','exec-59c940e9-20de-4113-824b-9253db2d6f1b.png'),
    ('memory-frame-cherry-blossom',3,'r2','exec-a81350ff-8a26-481d-83d6-2e91d37d92c1.png'),
    ('memory-badge-memory-master',2,'r1','exec-0075c743-9b9f-4348-aa26-fda882607280.png'),
    ('memory-badge-memory-master',3,'r1','exec-9dff126a-f8cc-47c1-926b-8ec5829b8c3c.png'),
    ('memory-frame-golden-laurel',2,'r2','exec-99973592-b36e-4d72-a955-8703dff9f2ce.png'),
    ('memory-avatar-stellar-cat',2,'r1','exec-02ad7a1f-ed83-49c3-86c7-9ab342d4a8de.png'),
    ('memory-avatar-stellar-cat',3,'r1','exec-642d80ed-bf90-4457-8fa0-8ce7d507a3c4.png'),
    ('memory-frame-sky-feather',2,'r1','exec-c7119538-f37b-49c3-a21d-ccd1cd668236.png'),
    ('memory-frame-sky-feather',3,'r1','exec-455fe7f3-478c-4737-89e3-85e8d9af09a8.png'),
    ('memory-avatar-scholar-squirrel',2,'r1','exec-a6e30bf2-9b2f-4bd6-b47e-29a0589a35ae.png'),
]
j = json.loads((ART/'journal.json').read_text(encoding='utf-8-sig'))
p = json.loads((ART/'prompts.json').read_text(encoding='utf-8-sig'))
for id, form, revision, source in SOURCES:
    suffix = '-r2' if revision == 'r2' else ''
    master = ART/'masters'/f'{id}-form{form}{suffix}.png'
    im = Image.open(master).convert('RGBA')
    record = dict(id=id,form=form,revision=revision,master=master.relative_to(ROOT).as_posix(),generationSource=str(GENERATED/source),dimensions=list(im.size),alphaBBox=list(im.getchannel('A').getbbox()),sha256=hashlib.sha256(master.read_bytes()).hexdigest(),status='generated-pending-alignment-qa',exports=None,promptReference=f'prompts.json#{id}/form{form}/{revision}')
    if not any(r.get('revision')==revision and r['id']==id and r['form']==form for r in j['records']):
        j['records'].append(record)
    for r in p['records']:
        if (r['id'],r['form'],r.get('revision')) == (id,form,revision):
            r['status']='generated-pending-alignment-qa'
            r['master']=record['master']
for name,value in [('journal.json',j),('prompts.json',p)]:
    (ART/name).write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(f'Registered {len(SOURCES)} generation sources; previous masters preserved.')
