from pathlib import Path
import csv,hashlib,json,shutil,zipfile
root=Path(__file__).resolve().parents[3];e=Path(__file__).parent
record=json.loads((e/'tap-release-02/result.json').read_text(encoding='utf-8'));build=record['buildId'];dest=root/'output/taptap-upload'/build
if dest.exists():raise FileExistsError('Preserve existing delivery')
dest.mkdir(parents=True);shutil.copy2(Path(record['package']),dest/'game.zip')
sha=hashlib.sha256((dest/'game.zip').read_bytes()).hexdigest();assert sha==record['packageSha256']
(dest/'SHA256SUMS.txt').write_text(sha+'  game.zip\n',encoding='utf-8')
verification=json.loads((e/'tap-release-02/optimized-asset-verification.json').read_text(encoding='utf-8'))
with zipfile.ZipFile(dest/'game.zip') as z:game_config=json.loads(z.read('game.json'));assert z.testzip() is None
manifest={'status':'BLOCKED','purpose':'internal retest candidate; platform performance not verified','buildId':build,'artifactVersion':game_config.get('productVersion'),'saveAppVersion':'0.1.0','saveSchemaVersion':4,'engine':'3.8.8','tapExtension':'1.2.2','converter':'2.0.4-ts','sourceChangesDuringBuild':record['originalSourceChanges'],'package':{'file':'game.zip','bytes':record['packageBytes'],'sha256':sha,'entries':record['fileCount'],'uncompressedBytes':record['uncompressedBytes'],'CRC':'PASS'},'artAssets':verification,'rewardedAds':{'enabled':False,'realUnitConfigured':False,'spillReviveImplemented':False},'validation':{'regression':'80/80 local checks pass','memoryOnlyRecovery':'real Cocos injected failure, same run/score/RNG, 90 subsequent steps PASS','releaseUI':'menu/settings/tutorial/start/autoDrop/pause PASS in local Chromium','phoneShakeRootCause':'OPEN; user reports after SHAKE, not reproduced in desktop 12 seeds','platformStartupAndPeakMemory':'BLOCKED; old build failed per user; new build NOT_RUN'},'budgets':{'allDerivedImageRGBABytesBefore':verification['rgbaBefore'],'allDerivedImageRGBABytesAfter':verification['rgbaAfter'],'note':'not whole-process peak memory'},'sourceManifestSha256':hashlib.sha256((e/'tap-release-02/source-manifest.json').read_bytes()).hexdigest()}
(dest/'release-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
shutil.copy2(e/'tap-release-02/texture-optimization.json',dest/'texture-optimization.json');shutil.copy2(e/'tap-release-02/optimized-asset-verification.json',dest/'asset-verification.json');shutil.copy2(root/'docs/development/spill-revive/test-cases.csv',dest/'planned-test-cases.csv')
(dest/'acceptance.md').write_text(f'''# 复测候选：不是正式交付通过

状态 **BLOCKED**。版本{manifest['artifactVersion']}，{record['packageBytes']:,} bytes，SHA256 `{sha}`。

本轮实际修复临时模式检查点恢复、补底层错误摘要；分阶段菜单22图/并发4、构建派生贴图和图集、保留杯体DU尺寸。80条局部回归通过，真实Cocos故障注入可恢复并继续，最终Web Release菜单/设置/教程/自动落料/暂停可操作，71+7派生资源和CRC/Release隔离通过。

用户旧v4包平台启动/约400MB峰值失败，新包还没有平台复测；晃杯最初的手机物理异常本地尚未复现。57.5->23.0MiB为单份RGBA尺寸预算，不是进程总内存实测。当前不能标合格提审包。

正式广告关闭、没有真实位，**尚未实现洒出复活**。planned-test-cases.csv共48条为新设计用例，均NOT_RUN，不冒称已执行。未上传、提审或发布。详细设计与执行提示词见[docs43](../../../docs/43-spill-revive-performance-design.md)，实际原始证据见[本轮记录](../../../evidence/Acceptance/20261104-revive-delivery-review/acceptance.md)。
''',encoding='utf-8')
(dest/'platform-readiness.md').write_text('''# 平台复测前置

- 用户报告旧v4启动慢及部分机型峰值约400MB：OPEN；本候选未平台复测。
- 同SHA冷/热启动、低/中/高档手机进程峰值、20次重开及广告阶段：NOT_RUN。
- 手机点击晃杯最初异常：OPEN；新错误页查看底层错误详情可继续定位。
- Tap登录/隐私/资质/后台版本唯一性/真实广告位：待实际账号与宿主证据。
- 未上传、提审或发布；本地ZIP通过不代表平台放行。
''',encoding='utf-8')
tests=[('TYPE','PASS','typecheck; config/contracts mirrors'),('REG','PASS','80 checks; regression-after.log'),('ART','PASS','71+7 original-to-derived-to-ZIP'),('REC','PASS','real Cocos memory-only recovery and resume90'),('UI','PASS','final Web02 menu/settings/tutorial/autoDrop/pause'),('PHONE','BLOCKED','original phone shake fault root cause not reproduced'),('PERF','BLOCKED','new same-SHA platform startup/400MB retest not run'),('AD','NOT_RUN','disabled; revive design only')]
with (dest/'test-results.csv').open('w',encoding='utf-8-sig',newline='') as f:
 w=csv.writer(f);w.writerow(['id','status','evidence']);w.writerows(tests)
# Replace intermediate revision01 identity only in this round's authored documentation.
for p in [root/'docs/43-spill-revive-performance-design.md',*list((root/'docs/development/spill-revive').glob('*.md'))]:
 t=p.read_text(encoding='utf-8');t=t.replace('20261104-recovery-memory-tap-release-01',build).replace('e58dc4684b226d539b278b2590e3c69f8bbd45e6dd33ba5ab8edc78aa9817974',sha).replace('3,008,253','3,008,364').replace('5,064,317','5,064,864');p.write_text(t,encoding='utf-8')
print(json.dumps({'delivery':str(dest),'bytes':record['packageBytes'],'sha256':sha,'status':'BLOCKED'},ensure_ascii=False))
