"""Create an auditable cleanup plan; mutations are performed by the matching PowerShell script."""
from pathlib import Path
import datetime, hashlib, json, os

ROOT = Path(__file__).resolve().parents[3]  # one-off audit script retained under evidence/maintenance/run
RUN = '20261105-project-cleanup'
EVIDENCE = ROOT / 'evidence/maintenance' / RUN
ARCHIVE = ROOT.parent / '_cleanup-backups' / ('奶茶挤挤-' + RUN)
TAP = '20261104-spill-revive-tap-02'
WEB = '20261104-spill-revive-web-release-02'
DEBUG = '20261104-spill-revive-debug-03'

def files(path):
    pending = [path]
    while pending:
        parent = pending.pop()
        if parent.is_file():
            yield parent
            continue
        with os.scandir(parent) as entries:
            for entry in entries:
                if entry.is_symlink() or getattr(entry, 'is_junction', lambda: False)():
                    raise RuntimeError('Refusing reparse point: ' + entry.path)
                if entry.is_dir(follow_symlinks=False): pending.append(Path(entry.path))
                else: yield Path(entry.path)

def fingerprint(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()

def main():
    if (EVIDENCE/'plan.json').exists():
        raise RuntimeError('Cleanup plan already exists; this one-off record must not overwrite an executed plan')
    EVIDENCE.mkdir(parents=True, exist_ok=True)
    plan = []
    def add(action, p, reason):
        if not p.exists(): return
        rel = p.relative_to(ROOT).as_posix()
        if any(rel == r['path'] or rel.startswith(r['path'] + '/') for r in plan): return
        if any(r['path'].startswith(rel + '/') for r in plan): raise RuntimeError('Overlapping plan ' + rel)
        plan.append({'action': action, 'path': rel, 'reason': reason})
    for p in (ROOT/'build-artifacts/cocos-p1b-build-source').iterdir():
        if p.name != TAP: add('delete', p, 'Reproducible isolated build copy; source and build manifests retained')
        else:
            for child in p.iterdir():
                if child.name not in {'assets','assets.meta','settings','build-templates','package.json','package-lock.json','tsconfig.json'}:
                    add('delete', child, 'Latest staged art/source retained; dependency/import/editor caches reproducible')
    for p in (ROOT/'build-artifacts/cocos-p1b-build').iterdir():
        if p.name not in {WEB, DEBUG}: add('delete', p, 'Superseded generated Web output')
    for p in (ROOT/'build-artifacts/cocos-taptap-minigame-build').iterdir():
        if p.name != TAP:
            oldzip=p/'TapBuild/game.zip'
            if oldzip.exists(): add('archive', oldzip, 'Previous package retained for fault/build identity investigation')
            # Enumerate siblings so archived ZIP is not part of a destructive parent target.
            for child in p.iterdir():
                if child.name=='TapBuild':
                    for sub in child.iterdir():
                        if sub.name!='game.zip': add('delete', sub, 'Generated unpacked/intermediate Tap output')
                else: add('delete',child,'Generated intermediate Tap output')
        else:
            for child in p.iterdir():
                if child.name=='TapBuild':
                    for sub in child.iterdir():
                        if sub.name!='game.zip': add('delete',sub,'Current ZIP retained; unpacked duplicate is reproducible')
                else:add('delete',child,'Current final ZIP retained; conversion intermediate is reproducible')
    add('delete', ROOT/'build-artifacts/rewarded-tests', 'Recreated by verify_rewarded_shake.cjs')
    for rel in ['奶茶挤挤/library','奶茶挤挤/temp','奶茶挤挤/build','tools/__pycache__','.playwright-cli','.screenshots','.codex/.tmp']:
        add('delete',ROOT/rel,'Reproducible cache or scratch automation output')
    for p in (ROOT/'output').iterdir():
        if p.name=='taptap-upload':
            for child in p.iterdir():
                if child.name!='CURRENT-CANDIDATE.md':add('archive',child,'Obsolete delivery package and its evidence; current candidate remains a single ZIP')
        else:add('archive',p,'Historical screenshots or artwork conversion workspace, not runtime input')
    for name in ['16-phase-verification.md','34-p1c-implementation-design.md','36-cup-auto-ranking-revision.md','39-cup-auto-closeout-design.md','40-unified-acceptance-background-ads.md','41-mobile-feel-ads-release-design.md','taptap-integration-report.md']:
        add('archive',ROOT/'docs'/name,'Superseded phase plan; current fixes remain in docs43/44')
    for p in (ROOT/'docs/development').iterdir():
        if p.name not in {'animation-start-physics','spill-revive'}:add('archive',p,'Completed/superseded development phase')
    keep_accept={'20261105-tap-host-review','20261104-spill-revive','20261104-revive-delivery-review'}
    keep_evidence={'Acceptance':keep_accept,'CupAuto':{WEB,DEBUG},'TapTap':{TAP},'maintenance':{RUN}}
    for p in (ROOT/'evidence').iterdir():
        if p.name not in keep_evidence:add('archive',p,'Historical original acceptance evidence, retained outside active workspace')
        else:
            for child in p.iterdir():
                if child.name not in keep_evidence[p.name]:add('archive',child,'Historical acceptance/build evidence')
    # Chromium/Creator personal caches are not test evidence; retained logs/manifests remain sufficient.
    for base in ['evidence/Acceptance/20261104-revive-delivery-review','evidence/CupAuto/'+WEB,'evidence/CupAuto/'+DEBUG,'evidence/TapTap/'+TAP]:
        for parent, dirs, _ in os.walk(ROOT/base):
            for name in list(dirs):
                if name=='creator-user-data':
                    add('delete',Path(parent)/name,'Editor user-data cache; commands/logs/source manifests preserved')
                    dirs.remove(name)
    protected={}
    for rel in ['assets','assets2','audio','config','contracts','research','skills','奶茶挤挤/assets','奶茶挤挤/settings','奶茶挤挤/build-templates']:
        for p in files(ROOT/rel):protected[p.relative_to(ROOT).as_posix()]=fingerprint(p)
    for rel in ['奶茶挤挤/package.json','奶茶挤挤/package-lock.json','奶茶挤挤/tsconfig.json','THIRD_PARTY_NOTICES.md']:
        p=ROOT/rel;protected[rel]=fingerprint(p)
    before_bytes=before_files=0
    for p in files(ROOT):before_files+=1;before_bytes+=p.stat().st_size
    report={'root':str(ROOT),'archiveRoot':str(ARCHIVE),'createdAt':datetime.datetime.now().astimezone().isoformat(),'beforeBytes':before_bytes,'beforeFiles':before_files,'actions':plan}
    (EVIDENCE/'plan.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
    (EVIDENCE/'protected-files.json').write_text(json.dumps(protected,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps({'actions':len(plan),'archive':sum(x['action']=='archive' for x in plan),'delete':sum(x['action']=='delete' for x in plan),'protected':len(protected),'beforeBytes':before_bytes,'beforeFiles':before_files},ensure_ascii=False))

if __name__=='__main__':main()
