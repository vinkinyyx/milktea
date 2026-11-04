from pathlib import Path
import csv,hashlib,importlib.util,json,re
root=Path(__file__).resolve().parents[3];e=Path(__file__).parent;folder=root/'docs/development/spill-revive';dest=root/'output/taptap-upload/20261104-recovery-memory-tap-release-02'
errors=[];links=0
files=[root/'docs/43-spill-revive-performance-design.md',*folder.glob('*.md'),e/'acceptance.md',dest/'acceptance.md',root/'README.md',root/'docs/22-current-progress-and-resume.md',root/'docs/38-taptap-minigame-current.md',root/'AGENTS.md',root/'tools/README.md',root/'assets/README.md']
for p in files:
 text=p.read_text(encoding='utf-8-sig')
 if '\ufffd' in text:errors.append(f'{p.name}: replacement character')
 for target in re.findall(r'\]\(([^)]+)\)',text):
  if target.startswith(('http://','https://','#')):continue
  links+=1
  if not (p.parent/target.split('#')[0]).resolve().exists():errors.append(f'{p.name}: broken link {target}')
with (folder/'test-cases.csv').open(encoding='utf-8-sig',newline='') as f:rows=list(csv.DictReader(f))
if len(rows)!=48 or len({x['id'] for x in rows})!=48 or any(x['status']!='NOT_RUN' for x in rows):errors.append('design case count/status')
manifest=json.loads((dest/'release-manifest.json').read_text(encoding='utf-8'));actual=hashlib.sha256((dest/'game.zip').read_bytes()).hexdigest()
if actual!=manifest['package']['sha256']:errors.append('delivery package hash')
spec=importlib.util.spec_from_file_location('tap_builder',root/'tools/build_taptap_minigame.py');module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
before=json.loads((e/'tap-release-02/source-manifest.json').read_text(encoding='utf-8'));after=module.manifest(root/root.name)
changed=[k for k in before.keys()|after.keys() if before.get(k)!=after.get(k)]
if changed:errors.append('source changed after final build')
result={'status':'PASS' if not errors else 'FAIL','markdownFiles':len(files),'localLinks':links,'designCases':len(rows),'allDesignCasesNotRun':True,'sourceChangesAfterFinalBuild':changed,'packageSha256':actual,'formalDeliveryStatus':'BLOCKED','errors':errors}
(e/'document-validation.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(result,ensure_ascii=False,indent=2));raise SystemExit(1 if errors else 0)
