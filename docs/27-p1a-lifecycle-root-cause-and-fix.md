# P1-A真实后台阻塞定位与最小修复

日期：2026-10-29。对象：冻结候选`20261029-p1a-final-14`。本轮已修复诊断路径并进行真实后台测试；**游戏运行源码尚未修改，LIFE-08真实失败，P1-A仍不能放行**。当前结果见[后台汇总](../evidence/P1-A/20261029-p1a-final-14/lifecycle/diagnosis-summary.json)及[逐例矩阵](../evidence/P1-A/20261029-p1a-final-14/cases.csv)。

## 1. 已确认的两个原因

### 1.1 测试工具撤销了错误会话的覆盖

Playwright在其原始页面协议会话中发送`Emulation.setFocusEmulationEnabled(true)`。Chromium浏览器端为启用它的EmulationHandler保留capture_handle；向另一个`newCDPSession(page)`发送false，无法释放原始会话的持有。它可能改变renderer焦点，所以会读到hasFocus=false，却仍然visibility=visible。

本机实际版本为`@playwright/cli 0.1.22`、`playwright-core 1.64.0-alpha-1790635538000`、Chrome156.0.8078.48。两个空白标签位于同一window的真实对照：

| 操作 | 非活动目标标签 | 可信visibilitychange |
| --- | --- | --- |
| 默认覆盖开启 | visible / hasFocus=true | 无 |
| 新建CDP会话发送false并保持连接 | visible / hasFocus=false | 无 |
| 原始会话发送false，再实际切到辅助标签 | hidden / hasFocus=false | hidden，isTrusted=true |
| 实际切回目标标签 | visible / hasFocus=true | visible，isTrusted=true |

原始输出保存在[control-01](../evidence/P1-A/20261029-p1a-final-14/diagnostics/lifecycle-control-01/stdout.log)和[control-02](../evidence/P1-A/20261029-p1a-final-14/diagnostics/lifecycle-control-02/stdout.log)，版本/源码哈希见[provenance](../evidence/P1-A/20261029-p1a-final-14/diagnostics/playwright-source-provenance.json)。[Chromium对应实现](https://chromium.googlesource.com/chromium/src/+/main/content/browser/devtools/protocol/emulation_handler.cc)中的SetFocusEmulationEnabled按handler持有/释放capturer，与此对照一致。

已在`tools/p1a-lifecycle-real-case.js`实现对本机Playwright原始会话的受控访问：`page._connection.toImpl(page).delegate._mainFrameSession._client`。这是版本相关的内部测试入口，不是Cocos或稳定公共API；入口不匹配必须失败并记录，不回退成“新会话false已撤销全部覆盖”。每次操作前核对当前页面，finally恢复覆盖并关闭自建辅助页；不修改安装版Playwright或游戏包。

后台读取使用独立CDP的Runtime.evaluate，保持目标隐藏，不切回、不截目标图、不用目标rAF等待。没有dispatch合成事件、没有改document.hidden、没有game.emit，也没有启动此前被拒绝的普通浏览器命令。Opera连接仍需认证，但它已不是本项目真实后台验收的必要依赖。

### 1.2 Boot期间的“待恢复”语义未跨场景保留

LIFE-08在同一final14上独立复现两次：

1. 截住实际配置JSON请求；Boot尚未建立PhysicsLab。
2. 真实切到辅助标签，记录DOM trusted hidden和Game hide；在隐藏期间放行配置请求。
3. 返回时Boot先收到show，随后切换PhysicsLab。
4. 未按R，新PhysicsLab已自动推进：第一次13step、第二次16step；paused=false，pauseReasons为空。

证据：[第一次](../evidence/P1-A/20261029-p1a-final-14/attempts/LIFE-08-PRIMARY-001/result.json)、[第二次](../evidence/P1-A/20261029-p1a-final-14/attempts/LIFE-08-PRIMARY-002/result.json)。两次route均真实命中并在隐藏时放行，hidden期间没有推进；失败发生在返回后的新场景初始化。

具体链路：

- `HostLifecycleCoordinator.snapshot()`保留当前domHidden/engineHidden及事件历史，但没有持久的“用户尚未确认恢复”状态。
- `subscribe()`仅立即回传当前snapshot。此时show已完成，backgrounded=false；过去的事件虽在数组里，却没有对应的待恢复语义。
- `PhysicsLab.onLifecycleState()`仅在当前backgrounded=true时加入RESUME_REQUIRED。因此新建的Lab没有收到该原因，创建clock/三圆并自动开始。

这是真实产品缺陷，不是认证缺失，也不是图片或配置内容不足。把当前backgrounded改成永远true、由加载完成调用resume或手工补R都不能修复它。

## 2. 最小代码修复（待执行）

优先只改两个运行文件：

1. `client/assets/scripts/core/HostLifecycleCoordinator.ts`：增加跨场景持久的`resumeRequired`及对应隐藏代次。真实隐藏时置位，show仅更新当前可见性，不清此标记；snapshot和subscribe立即回传它。提供显式用户恢复确认方法，检查当前可见及代次，拒绝旧回调/旧代次确认。
2. `client/assets/scripts/debug/PhysicsLab.ts`：订阅时即使当前已visible，只要resumeRequired仍在，就加入gate的RESUME_REQUIRED；初始化创建clock时继承它。只有R/恢复按钮通过现有ready、可见、无GALLERY/REBUILD/INITIALIZING/ERROR等guard后，才同步确认协调器并清该恢复原因。图库关闭、图片完成、重建结束及show不能替用户确认。

协调器应持有语义状态，不要求新的常驻Node或玩法状态机；避免多个组件直接写该标志。DOM/Game重复隐藏不能制造可被旧确认误清的新状态。测试dispose/reset行为须明确，普通Boot→Lab切换不能清掉它。不改变FixedClock、参数或补步上限。

## 3. 必须验证的修复分支

- 新页面始终可见、从未隐藏：不平白增加恢复要求，正常启动。
- Boot加载中隐藏、显示后才建立Lab：R前tick=step=0、RESUME_REQUIRED仍在，R后推进。
- 隐藏时Lab已建立、显示后才加载完图片：同样保持暂停至R。
- 手动暂停/图库/重建与宿主隐藏重叠：各原因保持归属；拒绝R不清全局待恢复标记。
- 用户R确认后又隐藏：产生新代次，旧回调或旧确认不能清掉它。
- 5秒/60秒/5分钟真实隐藏：连续时长与状态冻结来自原始事件/快照，show不追帧。

纯状态转换检查与真实宿主/引擎用例分开。修复核心必须由真实LIFE-08的route/场景/步数证据关闭，不能只补一个布尔值单测。

## 4. 已可直接运行的验证入口

项目根PowerShell，使用未用过的attemptId：

```powershell
./tools/run_p1a_real_lifecycle.ps1 -CaseId LIFE-08 -AttemptId LIFE-08-PRIMARY-003
```

默认目标是final14（该包应继续复现FAIL），支持LIFE-01～08、LIFE-09-QUEUE、LIFE-09-REBUILD、LIFE-10；LIFE-02默认60秒，LIFE-03默认连续300秒。输出在该候选`attempts/<attemptId>/`，保存原始stdout、解析结果、metadata和新运行的runner副本。内部API变更或CLI输出损坏必须单列工具失败。

修复后另取未使用buildId与独立端口，用参数明确切到新候选：

```powershell
./tools/run_p1a_real_lifecycle.ps1 -CaseId LIFE-08 -AttemptId <新ID> -BuildId <新buildId> -BaseUrl http://127.0.0.1:<新端口>/ -EvidenceDir evidence/P1-A/<新buildId> -Session <该候选会话>
```

尖括号是待替换参数，不是已经存在的目录/端口。现有会话不存在时按Playwright实际帮助创建允许的测试会话；不要假设包装器会替用户认证Opera。

## 5. 出口和证据

本轮修改的是诊断/证据工具，没有改运行源码；324项运行输入与final14源码清单一致，当前结果可以在同一包内补入。旧的“43PASS+9未执行/只能重认证Opera”摘要已快照到`diagnostics/lifecycle-closeout-before/`，原始失败attempt均保留。LIFE-05需按规范覆盖图库隐藏场景，旧manual-pause结果不能替代它；LIFE-10前台长帧本来也不应被Opera认证阻塞。

实施上述两个运行文件后必须新建候选、重建并回归全部受影响的启动/暂停/任务/错误/显示与物理用例；最终矩阵全部关联新包。不能只给final14换一个buildId，或将本轮后台PASS直接复制到新包。旧repair03压力未复现现象继续保留为历史，不声称本轮找到了它的根因。

当前确切工作是：修好跨场景待恢复语义→真实LIFE-08复现转PASS→新候选同包完整验收。只有这些结果成立才能交付P1-A；无须更换引擎、重新制图或接入账号平台。
