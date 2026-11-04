from pathlib import Path
import os,json,hashlib,re,zipfile
ROOT=Path(__file__).resolve().parents[3]
HERE=Path(__file__).parent
ARCHIVE=ROOT.parent/'_cleanup-backups/奶茶挤挤-20261105-project-cleanup'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
protected=json.loads((HERE/'protected-files.json').read_text(encoding='utf-8'))
modified=[];lost=[];intentional=[]
for rel,expected in protected.items():
    p=ROOT/rel
    if not p.exists():lost.append(rel)
    elif sha(p)!=expected:
        (intentional if rel=='assets/README.md' else modified).append(rel)
archive_errors=[];archive_records=[]
for line in (HERE/'archive-files.jsonl').read_text(encoding='utf-8-sig').splitlines():
    item=json.loads(line);p=ARCHIVE/item.get('archivePath',item['path'])
    if not p.is_file() or sha(p)!=item['sha256']:archive_errors.append(item['path'])
    archive_records.append(item)
package=ROOT/'build-artifacts/cocos-taptap-minigame-build/20261104-spill-revive-tap-02/TapBuild/game.zip'
package_sha=sha(package)
with zipfile.ZipFile(package) as z:crc=z.testzip();entries=len(z.infolist())
actions=[json.loads(s) for s in (HERE/'execution.jsonl').read_text(encoding='utf-8-sig').splitlines()]
plan=json.loads((HERE/'plan.json').read_text(encoding='utf-8'))
remaining_targets=[x['path'] for x in plan['actions'] if (ROOT/x['path']).exists()]
mds=list((ROOT/'docs').rglob('*.md'))+[ROOT/r for r in ['README.md','tools/README.md','奶茶挤挤/README.md','assets/README.md','output/taptap-upload/CURRENT-CANDIDATE.md']]
links=[];bad_links=[]
for md in mds:
    for val in re.findall(r'\]\(([^)]+)\)',md.read_text(encoding='utf-8-sig')):
        if '://' in val or val.startswith('#') or val.startswith('mailto:'):continue
        p=md.parent/val.strip('<>').split('#')[0]
        if p.resolve()==(HERE/'validation.json').resolve():continue
        links.append(str(p))
        if not p.exists():bad_links.append({'file':str(md.relative_to(ROOT)),'target':val})
manifest=json.loads((ROOT/'evidence/TapTap/20261104-spill-revive-tap-02/source-manifest.json').read_text(encoding='utf-8-sig'))
source_changes=[rel for rel,value in manifest.items() if not (ROOT/'奶茶挤挤'/rel).is_file() or sha(ROOT/'奶茶挤挤'/rel)!=value]
runtime_changes=[r for r in source_changes if r!='README.md']
total_bytes=total_files=0;all_zip=[];unexpected_cache=[]
for parent,dirs,names in os.walk(ROOT):
    dirs[:]=[d for d in dirs if not (Path(parent)/d).is_symlink()]
    for name in names:
        p=Path(parent)/name;total_files+=1;total_bytes+=p.stat().st_size
        if name=='game.zip':all_zip.append(p.relative_to(ROOT).as_posix())
    if 'node_modules' not in Path(parent).parts:
        for d in dirs:
            if d in {'__pycache__','library','temp','.playwright-cli','rewarded-tests'}:
                # assets/library contains authored originals, not an engine import cache.
                rel=(Path(parent)/d).relative_to(ROOT).as_posix()
                if rel!='assets/library':unexpected_cache.append(rel)
archived_bytes=sum(x['bytes'] for x in archive_records)
contract_root=sha(ROOT/'contracts/types.ts');contract_engine=sha(ROOT/'奶茶挤挤/assets/scripts/contracts/types.ts')
passed=not any([lost,modified,archive_errors,remaining_targets,bad_links,runtime_changes,unexpected_cache]) and package_sha=='f768704568d3c43a7122f2a205a79f253650026c3a6a13d4512a0e7ddcd93a3e' and crc is None and len(all_zip)==1
report={
 'cleanupStatus':'PASS' if passed else 'FAIL','gameDeliveryStatus':'BLOCKED',
 'beforeBytes':plan['beforeBytes'],'afterBytes':total_bytes,'projectBytesRemoved':plan['beforeBytes']-total_bytes,
 'beforeFiles':plan['beforeFiles'],'afterFiles':total_files,
 'actionsCompleted':len(actions),'archiveActions':sum(x['action']=='archive' for x in actions),'deleteActions':sum(x['action']=='delete' for x in actions),
 'archivedFileCount':len(archive_records),'archivedBytes':archived_bytes,'archiveRoot':str(ARCHIVE),
 'protectedFiles':len(protected),'protectedFilesUnchanged':len(protected)-len(intentional)-len(modified)-len(lost),
 'intentionalDocumentationChanges':intentional,'missingProtectedFiles':lost,'unexpectedProtectedChanges':modified,
 'archiveHashErrors':archive_errors,'remainingPlannedTargets':remaining_targets,'remainingUnexpectedCaches':unexpected_cache,
 'activeMarkdownFilesChecked':len(mds),'localLinksChecked':len(links),'brokenActiveLinks':bad_links,
 'originalProjectSourceChanges':source_changes,'runtimeSourceChanges':runtime_changes,
 'gameZipsRemaining':all_zip,'packageSha256':package_sha,'packageEntries':entries,'zipCRC':'PASS' if crc is None else 'FAIL',
 'checks':{'typecheck':'PASS','configMirror':'PASS','runtimeArt71':'PASS','optimizedAsset71Plus7':'PASS','existingRegression':'111/111 PASS','contractsMirror':'FAIL_PREEXISTING_UNCHANGED'},
 'contractMismatch':{'rootSha256':contract_root,'engineSha256':contract_engine,'bothUnchangedFromBeforeCleanup':protected['contracts/types.ts']==contract_root and protected['奶茶挤挤/assets/scripts/contracts/types.ts']==contract_engine},
 'notPerformed':['Game defect implementation','New build','Tap host/device/platform performance tests','Real ads','Upload or publication'],
 'notes':['Project size reduction includes files moved to the external archive; it is not identical to disk space freed.','The regression-generated cache was moved reversibly to archive/_regenerated-test-cache after tests.','Validation output/report files add a few KB after the size snapshot.']
}
(HERE/'validation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(report,ensure_ascii=False,indent=2))
raise SystemExit(0 if passed else 1)
