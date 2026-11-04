"""Build an isolated CupAuto Web debug or release candidate and retain reproducible evidence."""
from pathlib import Path
import argparse, datetime, hashlib, json, os, re, shutil, subprocess, sys

ROOT=Path(__file__).resolve().parents[1]
CREATOR=Path(r'C:\ProgramData\cocos\editors\Creator\3.8.8\CocosCreator.exe')

def write(path:Path,value): path.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def sha(path:Path): return hashlib.sha256(path.read_bytes()).hexdigest()
def main():
    ap=argparse.ArgumentParser(description=__doc__);ap.add_argument('--build-id',required=True);ap.add_argument('--mode',choices=['debug','release'],default='debug');ap.add_argument('--evidence-dir');args=ap.parse_args()
    if not re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9._-]*',args.build_id): raise SystemExit('invalid build id')
    project=ROOT/ROOT.name;stage=ROOT/'build-artifacts/cocos-p1b-build-source'/args.build_id
    output=ROOT/'build-artifacts/cocos-p1b-build'/args.build_id;evidence=(ROOT/args.evidence_dir if args.evidence_dir else ROOT/'evidence/CupAuto'/args.build_id/'web')
    for p in [stage,output,evidence]:
        if p.exists(): raise FileExistsError(f'Preserve existing path and choose a new build ID: {p}')
    if not CREATOR.is_file(): raise FileNotFoundError(CREATOR)
    evidence.mkdir(parents=True);stage.parent.mkdir(parents=True,exist_ok=True);output.parent.mkdir(parents=True,exist_ok=True)
    shutil.copytree(project,stage,ignore=shutil.ignore_patterns('library','temp','build','local','.git','evidence','profiles','.creator','extensions'))
    runtime=stage/'assets/scripts/core/AppRuntime.ts';before=runtime.read_text(encoding='utf-8')
    after,count=re.subn(r"static readonly buildId = '[^']+';",f"static readonly buildId = '{args.build_id}';",before,count=1)
    if count!=1: raise RuntimeError('AppRuntime build ID injection not unique')
    runtime.write_text(after,encoding='utf-8')
    manifest={p.relative_to(stage).as_posix():sha(p) for folder in ('assets','settings') for p in (stage/folder).rglob('*') if p.is_file()}
    for name in ('package.json','tsconfig.json','build-templates/web-mobile/index.html'):
      p=stage/name
      if p.is_file():manifest[name]=sha(p)
    write(evidence/'staged-source-manifest.json',manifest)
    commands=[]
    if args.mode=='release': commands.append(('release-code',['node.exe',str(ROOT/'tools/strip_p1c_release_debug.cjs'),str(stage),str(evidence/'release-code-staging.json')]))
    commands.extend([('release-assets',[sys.executable,str(ROOT/'tools/prepare_p1c_release_assets.py'),'--project',str(stage),'--evidence-dir',str(evidence.relative_to(ROOT).as_posix())]),
      ('typecheck',['node.exe',str(stage/'node_modules/typescript/bin/tsc'),'--project',str(stage/'tsconfig.json')])])
    env=os.environ.copy();env['MILKTEA_DISABLE_EDITOR_BRIDGE']='1';record={'buildId':args.build_id,'project':str(stage),'output':str(output),'status':'STARTED','startedAt':datetime.datetime.now().astimezone().isoformat()}
    try:
      for name,cmd in commands:
        write(evidence/f'{name}-command.json',{'command':cmd,'cwd':str(ROOT)})
        with (evidence/f'{name}.log').open('w',encoding='utf-8') as log: record[name+'ExitCode']=subprocess.run(cmd,cwd=ROOT,env=env,stdout=log,stderr=subprocess.STDOUT).returncode
        if record[name+'ExitCode']!=0: raise RuntimeError(f'{name} failed; inspect {evidence/name}.log')
      boot=json.loads((stage/'assets/scenes/Boot.scene.meta').read_text(encoding='utf-8-sig'))['uuid']
      config={'platform':'web-mobile','buildPath':str(output.parent),'outputName':args.build_id,'debug':args.mode=='debug','sourceMaps':args.mode=='debug','startScene':boot,'scenes':[{'uuid':boot,'url':'db://assets/scenes/Boot.scene'}]}
      write(evidence/'creator-build-config.json',config)
      cmd=[str(CREATOR),'--user-data-dir='+str(evidence/'creator-user-data'),'--project',str(stage),'--build','configPath='+str(evidence/'creator-build-config.json')]
      write(evidence/'creator-command.json',{'command':cmd,'cwd':str(stage),'environment':{'MILKTEA_DISABLE_EDITOR_BRIDGE':'1'}})
      with (evidence/'creator.log').open('w',encoding='utf-8') as log: record['creatorExitCode']=subprocess.run(cmd,cwd=stage,env=env,stdout=log,stderr=subprocess.STDOUT).returncode
      if record['creatorExitCode']!=36: raise RuntimeError('Creator did not return installed 3.8.8 BUILD_SUCCESS=36')
      if not (output/'index.html').is_file() or not (output/'src/settings.json').is_file(): raise RuntimeError('Web output missing index/settings')
      record.update({'mode':args.mode,'status':'WEB_CANDIDATE_BUILD_PASS','indexHtmlSha256':sha(output/'index.html'),'settingsSha256':sha(output/'src/settings.json'),'outputBytes':sum(p.stat().st_size for p in output.rglob('*') if p.is_file()),'templateApplied':b'milktea-boot' in (output/'index.html').read_bytes()})
      if not record['templateApplied']: raise RuntimeError('custom early-brand template not present in built Web output')
      if args.mode=='release':
        settings=json.loads((output/'src/settings.json').read_text(encoding='utf-8-sig'))
        settings_text=json.dumps(settings)
        if re.search(r'\bdebug\s*[:=]\s*true',settings_text,re.I): raise RuntimeError('Release settings contain debug=true')
        if any(p.suffix=='.map' for p in output.rglob('*') if p.is_file()): raise RuntimeError('Release output contains source maps')
        js_files=[p for p in output.rglob('*.js') if p.is_file()]
        forbidden=('__P1B_FIXTURES__','makeFixtureSnapshot','p1bFixture','__P1B_DIAGNOSTICS__','FakeRewardedAdProvider','debug-mock','rewardedMock')
        leaked=[term for term in forbidden if any(term in p.read_text(encoding='utf-8',errors='ignore') for p in js_files)]
        if leaked: raise RuntimeError(f'Release output contains debug API strings: {leaked}')
        record.update({'releaseSettingsVerified':True,'sourceMapCount':0,'documentTitle':'奶茶挤挤','debugApiStringsVerifiedAbsent':True})
        if '<title>奶茶挤挤</title>' not in (output/'index.html').read_text(encoding='utf-8'): raise RuntimeError('Web title not updated')
    except Exception as e:
      record.update({'status':'FAIL','error':str(e)})
      raise
    finally:
      record['finishedAt']=datetime.datetime.now().astimezone().isoformat();write(evidence/'build-result.json',record)
      print(json.dumps(record,ensure_ascii=False,indent=2))
if __name__=='__main__':main()

