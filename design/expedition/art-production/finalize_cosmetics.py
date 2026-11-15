"""Audit aligned art and export only forms explicitly approved in a review ledger.

Review composites are local evidence, never runtime artwork. No game logic edits.
"""
import hashlib
import json
import sys
from pathlib import Path
from PIL import Image, ImageDraw
import numpy as np
from scipy.ndimage import label, find_objects

ART = Path(__file__).resolve().parent
ROOT = ART.parents[2]

def read(name):
    return json.loads((ART/name).read_text(encoding='utf-8-sig'))

def save(name, value):
    (ART/name).write_text(json.dumps(value, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')

def hole(im):
    a = np.array(im.getchannel('A'))
    labels, _ = label(a < 8)
    component = labels[im.height//2, im.width//2]
    assert component, 'Opaque frame center'
    mask = labels == component
    assert not (mask[0].any() or mask[-1].any() or mask[:,0].any() or mask[:,-1].any()), 'Unbounded opening'
    bounds = find_objects(labels)[component-1]
    return mask, [bounds[1].start,bounds[0].start,bounds[1].stop,bounds[0].stop]

def composite(avatar, frame, badge):
    out = avatar.copy()
    out.alpha_composite(frame)
    out.alpha_composite(badge.resize((143,143),Image.Resampling.LANCZOS),(184,350))
    return out

def audit():
    inventory = {i['id']:i for b in json.loads((ART.parent/'cosmetic-art-batches.json').read_text(encoding='utf-8-sig'))['batches'] for i in b['items']}
    aligned = read('alignment-review.json')['records']
    assert len(aligned)==202
    images = {}
    by_type = {t:[] for t in ('avatar','frame','badge')}
    metrics=[]; failures=[]
    for id,item in inventory.items():
        for form in (1,2,3):
            path=ROOT/'public'/item['baseFiles']['512'] if form==1 else ART/'aligned-candidates'/f'{id}-form{form}.png'
            im=Image.open(path).convert('RGBA'); assert im.size==(512,512)
            images[id,form]=im; by_type[item['type']].append((id,form))
            if form==1: continue
            alpha=im.getchannel('A'); box=alpha.point(lambda v:255 if v>128 else 0).getbbox()
            margin=min(box[0],box[1],512-box[2],512-box[3])
            record=dict(id=id,form=form,opaqueMargin=margin,alphaRange=alpha.getextrema())
            if margin<=0: failures.append([id,form,'clipped opaque artwork'])
            if item['type']=='frame':
                mask,bounds=hole(im); base_mask,base_bounds=hole(images[id,1])
                union=np.logical_or(mask,base_mask).sum()
                record.update(openingBounds=bounds,openingIoU=float(np.logical_and(mask,base_mask).sum()/union),protectedFaceMaxAlpha=int(np.array(alpha)[175:291,195:331].max()))
                if record['protectedFaceMaxAlpha']>8: failures.append([id,form,'frame enters protected face region'])
            metrics.append(record)
    # The three layers have fixed placement. Face clearance is separable: every
    # frame is tested against the shared face region, every badge stays below it.
    # Thus no expensive runtime geometry or cubic bitmap matrix is needed.
    samples=[]
    for typ,keys in by_type.items():
        for i,key in enumerate(keys):
            avatars=by_type['avatar']; frames=by_type['frame']; badges=by_type['badge']
            triple=(key,frames[(i*7)%len(frames)],badges[(i*11)%len(badges)]) if typ=='avatar' else (avatars[(i*5)%len(avatars)],key,badges[(i*13)%len(badges)]) if typ=='frame' else (avatars[(i*7)%len(avatars)],frames[(i*17)%len(frames)],key)
            samples.append(triple)
    for start in range(0,len(samples),60):
        part=samples[start:start+60]; sheet=Image.new('RGB',(1000,10*140),'#21404a'); draw=ImageDraw.Draw(sheet)
        for i,triple in enumerate(part):
            x=(i%6)*166;y=(i//6)*140
            im=composite(*(images[key] for key in triple))
            large=im.resize((116,116),Image.Resampling.LANCZOS); small=im.resize((52,52),Image.Resampling.LANCZOS)
            sheet.paste(large,(x,y),large);sheet.paste(small,(x+112,y+64),small)
            draw.text((x,y+119),str(start+i),fill='white')
        sheet.save(ART/f'product-cross-{start//60+1}.png')
    # Badge rows at actual 32px and all three forms on both backgrounds.
    badge_ids=[id for id,item in inventory.items() if item['type']=='badge']
    sheet=Image.new('RGB',(700,len(badge_ids)*58),'#21404a'); draw=ImageDraw.Draw(sheet)
    for y,id in enumerate(badge_ids):
        draw.text((250,y*58+12),id,fill='white')
        for f in (1,2,3):
            im=images[id,f].resize((32,32),Image.Resampling.LANCZOS)
            for bg in range(2):
                x=(f-1)*72+bg*34
                sheet.paste('#f5f5f5' if bg else '#111827',(x,y*58,x+32,y*58+32));sheet.paste(im,(x,y*58),im)
    sheet.save(ART/'product-badges-32.png')
    result=dict(version=1,metrics=metrics,failures=failures,sampledCombinations=[[[id,form] for id,form in triple] for triple in samples],coverage=dict(avatarFramePairs=len(by_type['avatar'])*len(by_type['frame']),frameBadgePairs=len(by_type['frame'])*len(by_type['badge']),sampledThreeLayerPortraits=len(samples)),limitations='Automated shared face clearance and visual samples do not imply Android device performance. Source identity/eye-line/distinction require the separate visual review ledger.')
    save('product-qa-metrics.json',result)
    print(json.dumps(dict(failures=failures,coverage=result['coverage'],minimumOpeningIoU=min(r.get('openingIoU',1) for r in metrics))))

def export():
    ledger=read('product-visual-approval.json')
    metrics=read('product-qa-metrics.json'); assert not metrics['failures']
    assert ledger['status']=='passed' and ledger['reviewedDesignCount']==202
    approved={(r['id'],r['form']):r for r in ledger['records']}
    assert len(approved)==202
    journal=read('journal.json');latest={(r['id'],r['form']):r for r in journal['records']}
    records=[]
    for r in read('alignment-review.json')['records']:
        source=latest[r['id'],r['form']]
        assert approved[r['id'],r['form']]['sha256']==r['sha256']
        assert approved[r['id'],r['form']]['master']==r['master']
        if not source.get('promptReference') and not source.get('promptStatus'):
            prompts=read('prompts.json')['records']
            assert any(p['id']==r['id'] and p['form']==r['form'] and p.get('prompt') for p in prompts)
            source['promptReference']=f"prompts.json#{r['id']}/form{r['form']}"
        assert source['master']==r['master'] and hashlib.sha256((ROOT/r['master']).read_bytes()).hexdigest()==r['sha256']
        im=Image.open(ROOT/r['candidate']).convert('RGBA'); exports=[]
        for size in (128,256,512):
            rel=f"assets/achievements/evolution/v1/{r['id']}-form{r['form']}-{size}.webp"
            path=ROOT/'public'/rel;path.parent.mkdir(parents=True,exist_ok=True)
            im.resize((size,size),Image.Resampling.LANCZOS).save(path,'WEBP',lossless=True,method=6)
            check=Image.open(path);assert check.size==(size,size) and check.mode=='RGBA'
            assert check.getchannel('A').getextrema()==(0,255)
            if '-frame-' in r['id']: hole(check)
            exports.append(dict(path=rel,dimensions=[size,size],bytes=path.stat().st_size,sha256=hashlib.sha256(path.read_bytes()).hexdigest()))
        records.append(dict(id=r['id'],form=r['form'],status='ready',master=r['master'],masterSha256=r['sha256'],canvas=[512,512],alignment=r['alignment'],promptReference=source.get('promptReference'),promptStatus=source.get('promptStatus','archived-verbatim'),qa=dict(status='passed',scope=ledger['scope'],evidence=['product-visual-approval.json','product-qa-metrics.json','product-cross-*.png','product-badges-32.png'],limitations='Android physical-device validation is assigned to the project owner.'),exports=exports))
        source.update(status='exported-qa-passed',exports=exports)
    assert len(records)==202
    save('manifest.json',dict(version=1,status='complete',expectedDesignCount=202,expectedExportCount=606,readyDesignCount=202,readyExportCount=606,records=records))
    save('journal.json',journal)
    print('Exported 202 reviewed designs / 606 transparent lossless WebP files.')

if __name__=='__main__':
    export() if '--export' in sys.argv else audit()
