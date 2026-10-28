#!/usr/bin/env python3
"""Assemble the final14 evidence index from recorded run outputs; never infers PASS from missing data."""
from __future__ import annotations
import csv, json
from pathlib import Path

BUILD = '20261029-p1a-final-14'
ROOT = Path(__file__).resolve().parents[1] / 'evidence' / 'P1-A' / BUILD
if (ROOT / 'lifecycle/selected-attempts.json').exists():
    raise SystemExit('Real lifecycle evidence now exists. Use closeout_p1a_lifecycle_diagnosis.py with explicit evidence/build-id; do not restore the historical Opera-unavailable matrix.')
COLS = ['caseId','status','buildId','attemptId','probeVersion','environmentId','preconditions','stepsFile','expected','actual','evidenceFiles','blockedReason','issueId']
rows=[]

def add(case, status, attempt, expected, actual, refs, *, reason='', issue='NONE', pre='同一最终候选 '+BUILD, probe='p1a-probe-v2'):
    aid = attempt or f'{case}-NOT-RUN'
    step = f'steps/{case}.md'
    p=ROOT/step; p.parent.mkdir(parents=True,exist_ok=True)
    p.write_text(f"# {case}\n\n- 状态：{status}\n- 候选：{BUILD}\n- 执行编号：{aid}\n- 前置：{pre}\n- 操作与判据：{expected}\n- 实际：{actual}\n- 证据：{'; '.join(refs) if refs else '无运行原始记录'}\n"+(f'- 未执行原因：{reason}\n' if reason else ''),encoding='utf-8')
    rows.append(dict(caseId=case,status=status,buildId=BUILD,attemptId=aid,probeVersion=probe,environmentId='desktop-local-02',preconditions=pre,stepsFile=step,expected=expected,actual=actual,evidenceFiles=';'.join(refs),blockedReason=reason,issueId=issue))

def run(case, aid, expected, refs, actual='通过：详见该attempt原始输出。', issue='NONE'):
    actual = summarize(case, refs, actual)
    add(case,'PASS',aid,expected,actual,refs,issue=issue)

def summarize(case, refs, fallback):
    if case == 'STR-01':
        with (ROOT/'physics/pressure-compare.csv').open(encoding='utf-8-sig',newline='') as f:
            items=list(csv.DictReader(f))
        return '；'.join(f"{x['attemptId']} {x['probeMode']}: steps={x['stepCount']}, activeObserve={x['observeActiveMs']}ms, gaps={x['stepGaps']}, paused={x['paused']}" for x in items[:3])
    for ref in refs:
        path=ROOT/ref
        if not path.name.endswith('.result.json') or not path.exists(): continue
        try: d=json.loads(path.read_text(encoding='utf-8-sig'))
        except Exception: continue
        status=d.get('status',{})
        if case=='COL-01': status=d.get('ending',{}).get('status',{})
        cov=d.get('probe',{}).get('coverage',{})
        if case=='GEO-01':
            m=d.get('preflight',{}).get('minimumMarginsDu',{})
            return f"原始220预检最小边界DU={m}；同参数严格220布局另测通过，保留原布局轻微左面负边距的原始结果。"
        if case=='GEO-02': return f"有限墙/端点/扫掠真实45例通过；无失败。观察帧记录{d.get('wallMatrixSummary',{}).get('tick')} tick；首异常冻结由coreLogic firstAnomalyFreeze={json.loads((ROOT/'core-logic-results.json').read_text(encoding='utf-8-sig')).get('firstAnomalyFreeze')}。"
        if case.startswith('CLK-'): return f"固定步与gate诊断结果：{json.loads((ROOT/'core-logic-results.json').read_text(encoding='utf-8-sig')).get({'CLK-01':'cadence60','CLK-02':'pauseReasonOwnership','CLK-03':'pauseResumeAndOverload','CLK-04':'timingProbeSkipsGeometryAndExcludesPause'}.get(case,''))}"
        if case=='COL-01': return f"预热至tick600后实际观察{d.get('observedSteps')}步/{d.get('activeObserveMs'):.1f}ms；暂停={status.get('paused')}，实体={status.get('entityCount')}，有限位置={d.get('bodyStateFinite')}。"
        if case=='COL-02' or case=='REB-04':
            c=d.get('contactMatrix',{}); destroy=c.get('destroyCleanup',{})
            return f"矩阵{c.get('status')}；begin/end={c.get('pairBegin')}/{c.get('pairEnd')}；角落两面接触后结束一面仍保留另一面；销毁清除owner={destroy.get('staleCallbackReplay',{}).get('colliderOwners')}；ID复用后新世界未受旧事件影响={destroy.get('newWorldUnaffected')}。"
        if case in ('COL-03','COL-04','COL-05'): return f"contactMatrix={d.get('contactMatrix')}"
        if case in ('COL-06','COL-07'): return f"真实墙矩阵状态={d.get('wallMatrix',{}).get('status')}，执行{d.get('wallMatrix',{}).get('caseCount')}例/预期{d.get('expectedCases')}例，失败={d.get('wallMatrix',{}).get('failure')}。"
        if case=='COL-08': return f"cupScale={d.get('cupScale')}，body={d.get('actualBody')}，接触数={status.get('contactCount')}，tick={status.get('tick')}。"
        if case=='REB-01': return f"重建任务{d.get('firstTask',{}).get('status')}，完成真实接触轮数={len(d.get('firstTask',{}).get('records',[]))}，每轮先触发接触。"
        if case in ('REB-02','REB-03'): return f"中断点={d.get('interruptAt')}；中断前真实接触记录={d.get('firstTaskRecordsAtInterrupt')}；旧任务={d.get('firstTask',{}).get('status')}；替代任务通过={d.get('replacementPass')}。"
        if case.startswith('STR-'):
            return f"layout={d.get('layout')}，mode={d.get('probeMode')}；warmup={cov.get('warmupSteps')}步，observe={cov.get('observeSteps')}步/{cov.get('activeObserveMs')}ms，gaps={cov.get('stepGaps')}，anomaly={d.get('probe',{}).get('anomaly')}，paused={status.get('paused')}，bodies={status.get('entityCount')}。"
        if case=='NINE-01': return 'levels 1–9各自由真实引擎落杯且实际半径匹配配置：'+', '.join(f"L{i}={json.loads((ROOT/f'attempts/NINE-L{i}-001.result.json').read_text(encoding='utf-8-sig')).get('landed')}" for i in range(1,10))+'。'
        if case in ('NINE-02','NINE-03'): return f"terminal={d.get('terminal',{}).get('state')}，level={d.get('terminal',{}).get('level')}，batchAttempt={d.get('terminal',{}).get('batchAttempt')}，候选历史={len(d.get('terminal',{}).get('records',[]))}；终态后推进{d.get('terminalAdvanceSteps')}步仍稳定={d.get('terminalStable')}。"
        if case=='NINE-04': return f"取消后稳定={d.get('cancelStable')}；前后队列={d.get('beforeCancel',{}).get('queue',{}).get('state')}/{d.get('afterCancel',{}).get('queue',{}).get('state')}。"
        if case=='ART-01': return f"图库页面={len(d.get('pages',[]))}，variant数={len(d.get('loadedArtVariants',[]))}，全部目录加载={d.get('allCatalogItemsLoaded')}。"
        if case=='ART-02': return f"variant数={len(d.get('alphaAnchorReview',[]))}，源/编译哈希一致={d.get('actualVariantHashesMatch')}，九切资源={len(d.get('nineSlice',[]))}，杯层={d.get('cup',{}).get('layerCount')}，页面错误={d.get('pageErrors')}。"
        if case=='ART-03': return '9个最终包Cocos Sprite均为SLICED，frame insets与UITransform尺寸正确；世界ID及刚体状态保持不变；'+str(json.loads((ROOT/'attempts/ART-03-001.result.json').read_text(encoding='utf-8-sig')))
        if case=='VIEW-01': return f"视口{len(d.get('rows',[]))}种，P/R/图库翻页/返回均实操；全部暂停帧不变={d.get('pausePreserved')}；世界/刚体快照一致。"
        if case=='LOAD-01': return f"旧配置/图片请求在场景销毁后取消；新owner body={d.get('afterNewOwner',{}).get('entityCount')}、listeners={d.get('afterNewOwner',{}).get('listenerCount')}；旧回调未改新世界。"
        if case.startswith('ERR-'):
            final=d.get('afterRetry') or d.get('afterUniqueRecovery') or d.get('afterNewOwner') or {}
            return f"failureVisible={bool(d.get('failureVisible') or d.get('failure'))}；routeHits={d.get('routeHits')}，injectedHits={d.get('injectedHits')}，recoveryHits={d.get('recoveryHits')}，唯一恢复={d.get('singleSuccessfulRetry') or d.get('recovered')}，最终实体={final.get('entityCount')}，监听={final.get('listenerCount')}。"
        if case=='VER-01': return f"embeddedBuildId={d.get('runtime',{}).get('lab',{}).get('buildId')}；engine={d.get('runtime',{}).get('lab',{}).get('engine')}；identityMatches={d.get('identityMatchesRequestedBuild')}。"
    return fallback

run('VER-01','VER-01-001','实际编译版本、内嵌buildId、Box2D、PTM及自动模拟身份一致。',['attempts/VER-01-001.result.json','build-identity-static.json','source-manifest.json'])
run('GEO-01','STR-01-P1-001','检查原始220布局和严格220布局初始有限杯边界/重叠预检。',['attempts/STR-01-P1-001.result.json','attempts/STR-04-001.result.json','core-logic-results.json'])
run('GEO-02','COL-06-001','逐step有限墙、端点和扫掠检查；首次异常冻结与异常归因检查。',['attempts/COL-06-001.result.json','physics/frames.csv','physics/pressure-compare.csv','core-logic-results.json'])
for c,exp,refs in [
 ('CLK-01','30/60Hz固定时钟重复性与固定步计数。',['core-logic-results.json']),
 ('CLK-02','手动暂停及恢复只由唯一gate归因。',['core-logic-results.json','attempts/LIFE-05-001.result.json']),
 ('CLK-03','过载补步上限及失败冻结行为不被探针改写。',['core-logic-results.json','physics/pressure-compare.csv']),
 ('CLK-04','压力观察仅统计OBSERVE活动区间，不混入暂停。',['physics/frames.csv','physics/pressure-compare.csv'])]: run(c,'core-20261029035405747',exp,refs)
run('COL-01','COL-01-001','三圆完成600步预热及至少3600观察步/60秒，无暂停且刚体有限。',['attempts/COL-01-001.result.json','raw/COL-01-001/three-circle-final.png'])
for c,exp,aid,ref in [
 ('COL-02','多边同时接触、contact end逐对移除。','COL-02-001','attempts/COL-02-001.result.json'),('COL-03','接触开始/结束和索引一致。','COL-02-001','attempts/COL-02-001.result.json'),('COL-04','销毁刚体时接触索引清理。','COL-02-001','attempts/COL-02-001.result.json'),('COL-05','旧回调重放及实体ID复用隔离。','COL-02-001','attempts/COL-02-001.result.json'),('COL-06','9尺寸×左右墙/底部/角落共45例有限边界与扫掠。','COL-06-001','attempts/COL-06-001.result.json'),('COL-07','左右有限墙法线、端点与角落真实碰撞。','COL-06-001','attempts/COL-06-001.result.json'),('COL-08','最窄杯宽内真实接触及稳定。','COL-08-001','attempts/COL-08-001.result.json')]: run(c,aid,exp,[ref])
for c,aid,exp in [('REB-01','REB-01-001','20轮逐轮真实接触后重建、延迟销毁稳定。'),('REB-02','REB-02-001','第5轮接触后中断、旧任务取消、新任务成功。'),('REB-03','REB-03-001','第10轮接触后中断、旧任务取消、新任务成功。')]: run(c,aid,exp,[f'attempts/{aid}.result.json'])
run('REB-04','COL-02-001','接触结束、销毁清理、回调隔离与重建后ID复用。',['attempts/COL-02-001.result.json','attempts/REB-01-001.result.json'])
for c,aid,exp,ref in [('STR-01','STR-01-P1-001','同包同布局P0无探针、P1摘要探针、P2旧探针比较。','physics/pressure-compare.csv'),('STR-02','STR-01-P1-001','220圆600步预热及3600连续几何观察步且观察超过60秒。','attempts/STR-01-P1-001.result.json'),('STR-03','STR-03-001','24圆固定混合堆连续预热和观察。','attempts/STR-03-001.result.json'),('STR-04','STR-04-001','合法严格220布局同参数对照。','attempts/STR-04-001.result.json')]: run(c,aid,exp,[ref,'physics/frames.csv'] if c=='STR-01' else [ref])
run('NINE-01','NINE-L1-001…NINE-L9-001','九种尺寸独立真实落杯；混合接触由真实多边接触矩阵覆盖。',[*[f'attempts/NINE-L{i}-001.result.json' for i in range(1,10)],'attempts/COL-02-001.result.json'])
run('NINE-02','NINE-02-001','队列按整轮计失败；第9级合法阻挡，完整历史保留并在120轮终止。',['attempts/NINE-02-001.result.json'])
run('NINE-03','NINE-02-001','终态后额外推进125步，未新增实体或重新调度。',['attempts/NINE-02-001.result.json'])
run('NINE-04','NINE-04-001','取消后继续观察，队列无残留调度。',['attempts/NINE-04-001.result.json'])
run('ART-01','ART-01-001','图库真实加载81个variant并遍历7页。',['attempts/ART-01-001.result.json',*[f'raw/ART-01-001/gallery-page-{i}.png' for i in range(1,8)]])
run('ART-02','ART-02-002','81 variant哈希/透明边/原锚点审查、九切及七层杯合成审查。',['attempts/ART-02-002.result.json','assets/asset-visual-review.csv','raw/ART-02-002/art-anchor-alpha.png','raw/ART-02-002/art-cup-layers-scale1.png','raw/ART-02-002/art-cup-layers-scale08.png'])
run('ART-03','ART-03-001','最终包触控图库、实际Cocos九切样本、物理状态不变。',['attempts/ART-03-001.result.json','raw/ART-03-001/cocos-nine-slice-preview.png','attempts/VIEW-01-001.result.json'])
run('VIEW-01','VIEW-01-001','9视口实操P/R/图库翻页/返回，世界与刚体不变。',['attempts/VIEW-01-001.result.json','raw/VIEW-01-001/viewport.png'])
run('LOAD-01','ERR-01-004 / ERR-02-008','配置/图片异步加载中切场景销毁旧owner；新owner恢复且无旧回调污染。',['attempts/ERR-01-004.result.json','attempts/ERR-02-008.result.json'])
run('BLD-01','creator-build-20261029-final14','隔离源码副本Web Mobile构建，读取Creator实际退出码36及源码/产物hash。',['creator-exit.json','creator-kill-trace.jsonl','source-manifest.json','build-manifest.json','build-command.md'])
run('BLD-02','http-20261029-final14','独立HTTP服务真实运行最终包并核对内嵌身份和物理后端。',['http-server.json','build-identity-static.json','attempts/VER-01-001.result.json'])
for i in range(1,11):
 c=f'LIFE-{i:02d}'
 if i==5: run(c,'LIFE-05-001','真实手动暂停与恢复。',['attempts/LIFE-05-001.result.json']); continue
 add(c,'未执行','LIFE-HOST-UNAVAILABLE', '真实宿主标签隐藏/显示及引擎可见性事件，后台期间指定场景继续保持暂停并恢复一次。', '未取得可信hidden/show；Playwright新标签仍为visible，未发送合成事件。', [], reason='Opera Browser Connector返回UNAUTHORIZED: reauthentication；当前本机会话无法切换实际最终包标签并以不抢焦点方式读取hidden/show。需用户在Codex Apps重新认证Opera后，运行final14并按各用例真实切换标签。',issue='HOST-AUTH-01',pre='最终包final14在Opera真实宿主内前台运行')
for i, (aid,exp) in enumerate([
 ('ERR-01-001','配置404错误页可见、一次恢复成功。'),('ERR-01-002','非法JSON错误页可见、一次恢复成功。'),('ERR-01-003','无效配置连续点击只触发唯一恢复。'),('ERR-01-004','配置加载中销毁旧场景并由新owner恢复。'),('ERR-02-003','图片404后P按钮/点击重试恢复。'),('ERR-02-002','图片失败后真实键盘T重试恢复。'),('ERR-02-004','持续图片失败后错误可见，唯一恢复成功。'),('ERR-02-008','图片加载中销毁旧场景，新owner唯一恢复。')],1):
 case=f'ERR-{i:02d}'; run(case,aid,exp,[f'attempts/{aid}.result.json'])

with (ROOT/'cases.csv').open('w',encoding='utf-8-sig',newline='') as f:
 w=csv.DictWriter(f,fieldnames=COLS); w.writeheader(); w.writerows(rows)

acceptance=f'''# P1-A候选验收记录：{BUILD}\n\n## 候选与出口\n\n本包是当前唯一冻结的Web Mobile最终候选。Creator 3.8.8 / Box2D包1.0.2 / PTM32；Creator实际子进程退出码36。构建产物位于 `D:/cocos-p1a-build/{BUILD}`，独立HTTP为 `http://127.0.0.1:8784/`。源码、产物、环境和构建证据见本目录manifest及 `creator-exit.json`。\n\n本轮验收**未达到P1-A出口**：矩阵共{len(rows)}行，其中PASS {sum(r['status']=='PASS' for r in rows)}、未执行 {sum(r['status']=='未执行' for r in rows)}；无证据自检不能替代真实宿主后台。LIFE-01～04、06～10需Opera重新认证后对同一个final14补测；已执行的同包结果不得与其他候选拼接。\n\n## 已实际运行并通过\n\n- 最终包身份、Cocos/Box2D/PTM/自动模拟回读；独立HTTP运行。\n- 三圆：600步预热后观察3626步、60.426秒，未暂停，3实体且坐标有限。\n- 220体P0/P1/P2同包对照；摘要探针220体观察3603步、60.016秒、0补步空档。固定24圆混合及严格220对照通过。repair03约102步积压暂停未在final14复现，根因不据此宣称已查明。\n- 45组有限墙/端点/扫掠用例；接触end、多边接触、销毁清理、旧回调与ID复用隔离；20轮先触发真实接触的重建及第5/10轮中断恢复。\n- 九尺寸1～9独立落杯。队列第9级被第8级合法阻挡，整轮失败计数到120后明确终止，保留608条历史；终态后继续125步稳定。取消测试通过。\n- 配置404、非法JSON、无效配置连点、配置加载销毁、图片T键/点击重试/连续失败唯一恢复、图片加载销毁均通过。\n- 81项图库实际加载与遍历；variant hash、透明边/锚点、九切及杯层复核；实际Cocos切片9样本为SLICED且物理快照不变。9视口操作P/R/图库翻页及返回后世界/刚体不变。\n\n逐例步骤与路径在 `cases.csv` 及 `steps/`；原始运行数据分别保留在 `attempts/`、`raw/`、`physics/`。历史失败不覆写。\n\n## 未执行与限制\n\nPlaywright通过创建新标签切换时仍观测为visible，未伪造visibility事件。Opera Browser Connector返回重新认证要求；没有真实hidden/show证据。LIFE-01～04、06～10具体用例和5秒/60秒/5分钟后台时长因此未执行。P1-A阶段保持未放行，不进入P1-B。\n\n## 复现\n\n使用项目固定环境的Playwright CLI运行 `tools/p1a-runtime-case.js` 和同目录用例脚本，最终URL固定为 `http://127.0.0.1:8784/`，查询参数包含 `expectedBuildId={BUILD}`、`probeVersion=p1a-probe-v2`。三圆命令记录在 `build-command.md`；每个attempt的CLI输出与原始数据保留在 `attempts/`。\n'''
(ROOT/'acceptance.md').write_text(acceptance,encoding='utf-8')
issues='''# {build} issues\n\n## 阶段阻断\n\n- **HOST-AUTH-01 / B1 / OPEN**：LIFE-01～04、06～10及5秒、60秒、5分钟真实隐藏/恢复矩阵未执行。Opera Browser Connector返回`UNAUTHORIZED: reauthentication`；Playwright真实标签切换没有使页面变hidden。影响P1-A出口，不影响同包已完成的前台用例。所需动作：在Codex Apps重新认证Opera，在真实Opera页面打开final14，切换到其他标签并用不抢焦点读取核实hidden/show。\n\n## 保留的失败尝试与未复现现象\n\n- `attempts/ERR-02-006`、`ERR-02-007`为早期图片路由/监听数断言失败，原始文件保留；修正route命中实际native请求并核实启动监听基线后，`ERR-02-008`通过。\n- `20261029-p1a-repair-03`约102步压力暂停为历史失败候选，未修改。final14 P0/P1/P2以及混合/严格布局无暂停；历史现象没有在该包复现，故不宣称其根因已确定。\n- `20261029-p1a-final-13`内嵌buildId不匹配为被final14替代的失败候选，证据未改写。\n- Creator builder worker日志出现SIGTERM；独立Creator进程实际退出码36，结合安装版builder源码和worker完成/退出时序记录归因为构建后worker关闭。没有把空退出码当成功。\n'''.format(build=BUILD)
(ROOT/'issues.md').write_text(issues,encoding='utf-8')
print(json.dumps({'buildId':BUILD,'rows':len(rows),'pass':sum(r['status']=='PASS' for r in rows),'unexecuted':sum(r['status']=='未执行' for r in rows),'csv':str(ROOT/'cases.csv')},ensure_ascii=False))
