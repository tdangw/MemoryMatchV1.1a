"""Checkpoint a completed bounded image-generation request without auto-approval."""
import hashlib
import json
import sys
from pathlib import Path
from PIL import Image

ART=Path(__file__).resolve().parent
ROOT=ART.parents[2]
date=sys.argv[1]
group_word=sys.argv[2] if len(sys.argv)>2 else 'two'
group_count={'two':2,'three':3}[group_word]
expected=group_count*12
jobs=json.loads((ART/f'jobs-{group_word}-groups-{date}.json').read_text(encoding='utf-8'))['records']
journal=json.loads((ART/'journal.json').read_text(encoding='utf-8'))
prompts=json.loads((ART/'prompts.json').read_text(encoding='utf-8'))['records']
manifest=json.loads((ART/'manifest.json').read_text(encoding='utf-8'))
latest={(r['id'],r['form']):r for r in journal['records']}
assert len(jobs)==expected and len({(r['id'],r['form']) for r in jobs})==expected
records=[]
for job in jobs:
    r=latest[job['id'],job['form']]
    path=ROOT/r['master']
    assert hashlib.sha256(path.read_bytes()).hexdigest()==r['sha256']
    assert any((p['id'],p['form'],p.get('revision'),p['prompt'])==(job['id'],job['form'],job['revision'],job['prompt']) for p in prompts)
    im=Image.open(path).convert('RGBA')
    assert min(im.size)>=512 and im.getchannel('A').getextrema()[0]==0
    bbox=im.getchannel('A').point(lambda a:255 if a>16 else 0).getbbox()
    edge=bbox[0]==0 or bbox[1]==0 or bbox[2]==im.width or bbox[3]==im.height
    status='needs-revision' if edge else 'candidate-pending-product-qa'
    detail='Source/three-form inspection only. Face anchors, exact opening contour, edge alpha, small-size readability and full cross-match remain pending; not ready for runtime.'
    if edge:
        detail+=' Substantial alpha contacts source edge; inspect clipped ornament before export.'
    if job['id']=='link-frame-moonblossom' and job['form']==3:
        status='needs-revision'
        detail+=' Visible pale background/haze around exterior and opening: regenerate with clean alpha before product acceptance.'
    if job['id']=='triple-frame-tri-crystal' and job['form']==3:
        status='needs-revision'
        detail+=' Visible pale gray haze outside the frame; clean alpha required before export.'
    if job['id']=='triple-frame-prism':
        detail+=' Inspect purple fringe and detached pale pixels around the opening and outer crystal tips on light and dark backgrounds.'
    if job['id']=='triple-frame-crystal-arch':
        detail+=' Visible detached pale/purple edge pixels around crystals and opening require alpha inspection and cleanup before export.'
    if job['id']=='triple-frame-three-wing-star':
        status='needs-revision'
        detail+=' Visible white fringe/haze around the feathers; form3 ornament reaches source edge. Restore clean alpha and full safe margins before export.'
    if job['id']=='triple-frame-jade-gears':
        status='needs-revision'
        detail+=' Pale haze/detached pixels visible outside the gears and in the opening; form3 side ornament also requires safe-margin inspection.'
    if job['id']=='triple-badge-crystal-keeper' and job['form']==3:
        detail+=' Wing tips approach source side edges; inspect full silhouette and small-size readability before export.'
    if job['id'] in ('link-frame-silver-moon','link-frame-moon-coral'):
        detail+=' Check pale fringe and detached pixels against both light and dark backgrounds.'
    if job['id']=='link-badge-ocean-knot' and job['form']==2:
        status='needs-revision'
        detail+=' Visible pale backdrop above badge; clean alpha required before export.'
    if job['id']=='link-frame-silk-lanterns':
        detail+=' Upper central tassel projects into the opening; verify face clearance against base, shorten or move outward if necessary.'
    if job['id'] in ('link-frame-silver-waves','link-frame-pearl-shell','link-frame-osmanthus-branch'):
        detail+=' Inspect detached bright fringe/halo on light and dark backgrounds; no automatic acceptance based on transparent center.'
    r.update(status=status,qaNotes=detail)
    records.append(dict(id=job['id'],form=job['form'],group=job['group'],master=r['master'],sha256=r['sha256'],dimensions=list(im.size),strongAlphaBBox=bbox,status=status,notes=detail))
for r in manifest['records']:
    for e in r['exports']:
        path=ROOT/'public'/e['path']
        assert path.stat().st_size==e['bytes'] and hashlib.sha256(path.read_bytes()).hexdigest()==e['sha256']
        assert list(Image.open(path).size)==e['dimensions']
(ART/'journal.json').write_text(json.dumps(journal,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(ART/f'{group_word}-groups-qa-{date}.json').write_text(json.dumps(dict(version=1,status='generation-complete-product-qa-pending',sourceChecks=f'{expected} master hashes, dimensions, transparency presence and exact prompts verified; existing manifest exports rechecked',records=records),ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
count=len(latest)
ready=manifest['readyDesignCount']
exports=manifest['readyExportCount']
(ART/'SESSION_STATUS.md').write_text(f'''# Art production — paused after {group_word} requested groups, {date}

The bounded request for {group_word} groups / {expected} new image candidates is complete. No group beyond the authorized {group_count} started. Resume on user request. Same active plan: COSMETIC_UPGRADE_IMPLEMENTATION_PLAN.md, Gate 5.

- {count}/202 distinct designs have confirmed candidate sources; {202-count} designs still have no candidate.
- {len(journal['records'])} master records include preserved revisions; master count is not design count.
- Manifest unchanged at {ready}/202 ready designs and {exports}/606 exports. {202-ready} designs are not product-ready; {606-exports} exports remain outstanding. Existing export hash/bytes/dimensions rechecked successfully.
- All {expected} new masters, exact prompts and generation sources are saved: jobs-{group_word}-groups-{date}.json, prompts.json, journal.json and individual result-*.json.
- QA notes: {group_word}-groups-qa-{date}.json. Source-comparison sheets: {group_word}-groups-N-review-{date}.png, N=1 through {group_count}. All new images remain unapproved for product use.
- Explicit revision and inspection findings are preserved per form in journal and QA notes. Ocean knot form2 has pale backdrop; silk lantern upper tassel and all frame opening/clearance/fringe checks remain pending. Prior moonblossom form3 still needs clean alpha. No new product approvals.
- This request: tri-crystal form3 has exterior haze; three-wing-star and jade-gears need alpha/margin revision. Prism and crystal-arch have detached pale/purple pixels requiring inspection. Badge footprint/aspect and avatar eye-line/face anchors still require measurement; bounding-box alignment alone is insufficient.
- Prior pending issues remain in journal.json and earlier group-six-qa/two-groups-qa files, especially the astral-orbit rail crossing the opening. Do not overwrite these notes or mark older candidates ready based on a new generation count.

No logic/UI/offline/save/original assets/catalog mapping changed. No deploy/APK or game check/build. Source integrity validation does not substitute product QA. Use journal inventory before new generation to avoid duplicates.
''',encoding='utf-8')
print(f'{expected} new sources verified. {count}/202 candidates; {202-count} ungenerated. Manifest unchanged: {ready} ready / {exports} exports.')
