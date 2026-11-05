# V3本地独立验收与宿主收口实施设计

2026-11-06。**结论：BLOCKED。正常Web链路及既有118项通过，但“全部复核通过”“只剩可选真机工作”不能成立。** 本轮发现并复现了计时桥接、异常出口、首屏设置和换宿主状态缺口。P1-D在docs45中包括同SHA的Tap、真实广告和性能验证；本次Web成功只是其中的本地子集。

本次只做独立验收和详细设计，未修改运行代码、未新打包、未提交/推送或上传Tap。工作区已有大量未提交整改，均保留；不是仅凭commit bd12b73验收这轮代码。

## 1. 核验对象与实际结果

### 1.1 源码和包体身份

| 对象 | 身份/结果 |
|---|---|
| 原工程 | `奶茶挤挤/`，Creator3.8.8；当前工作区包括未提交及未跟踪源码 |
| Web Release | `20261105-host-revive-v3-web-release-01`，通过现有8123服务实际操作 |
| Tap ZIP | [game.zip](../build-artifacts/cocos-taptap-minigame-build/20261105-host-revive-v3-tap-release-01/TapBuild/game.zip)，3,026,101 bytes |
| ZIP SHA256 | `b2c3519df4371255346590a583c0413260c003d3b56b6a8842e36f18640a57e7` |
| 原工程与Tap构建输入 | 构建原始清单313项逐一SHA比较，无变化；当前新增元数据/文件仍须由最终发布清单完整收录 |
| 编译 | 本次原工程typecheck、现有Tap Release裁剪副本typecheck均通过，前轮DiagnosticRing错误已关闭 |
| 合同 | 根/工程types逐字节一致，前轮合同缺口已关闭 |
| 纯逻辑回归 | 本次重跑118 PASS / 0 FAIL，RV-25已按正确需求修订 |
| 资源 | 本次71 art + 7 effect、ZIP CRC、派生哈希验证通过 |

包体验证只证明现有V3产物的完整性，不证明它通过Tap宿主、广告或手机性能。日期以实际执行的2026-11-06为准，不从buildId中的20261105推断测试时间。

### 1.2 真实浏览器操作

使用390×844视口和真实鼠标操作，未调用无参数getComponents或遍历所有组件：

1. MENU：22项美术，`persistent=true`，Web Locks可用，secure context为true。
2. 开始新局→跳过教程→自动落料：PLAYING tick164/dropIndex2，杯、HUD、晃杯、暂停按钮可见。
3. 拖杯：杯偏移约105.77DU；一次晃杯后baseUsed1，无物理fault。
4. 暂停：tick290、score30、dropIndex4；刷新→继续上局：同run、同分、同tick、晃杯余额保持，恢复到PAUSED，不自动追赶。
5. 首屏直接打开设置：22项不增加、slider未加载，notice为“部分设置图片加载失败”，样式明显退化，见下文问题C。

截图已实际回看：[游戏](../evidence/Acceptance/20261106-host-revive-review/playing.png)、[设置](../evidence/Acceptance/20261106-host-revive-review/settings.png)、[刷新恢复](../evidence/Acceptance/20261106-host-revive-review/restored.png)。[完整状态序列](../evidence/Acceptance/20261106-host-revive-review/web-release-result.json)包含run/score/phase/revision及按钮，不以screen=PLAYING代替实际落料。

第一次自动脚本固定等待约4秒时仍在加载68/69项，不能据此判定产品失败；改为等待明确完成条件后正常进入。改的是测试等待方式，未改游戏截止时间或测试业务预期。

### 1.3 额外失败场景

| 问题 | 实际复现 | 状态 |
|---|---|---|
| A1 后台时长误计前台 | 真ArtAssets代码配合可控时钟：前台5秒→后台20秒且timer停调→前台，预算变25秒并EXPIRED；应仅5秒 | FAIL，P0 |
| A2 资源回调先于逾期timer | 真assertScope路径：前台已16秒但timer未派发，guard仍接受，settle后计时0并SETTLED | FAIL，P1 |
| B1 返回菜单仍被旧overlay劫持输入 | 实际错误注入后点“返回菜单”，screen=MENU但overlay=true；再真实点开始仍MENU/loading=false | FAIL，P0 |
| B2 render失败无法进入独立兜底 | 将普通render受控替换为抛错，再调用showStartupFailure，异常外抛且overlay=false | FAIL，P0 |
| C 首屏设置无资源scope | openModal未beginLoadScope；未加载的ui资源触发START_ART_CANCELLED，实际UI退化 | FAIL，P1 |
| D 旧宿主不写了，但新视图仍挂起 | 既有边界探针：旧宿主回调0次，换bind后旧任务结束仍phase=SETTLING | FAIL，P1 |
| E 启动诊断不覆盖真正Boot | AppRoot无StartupTrace调用；错误记录有code时丢掉detail.error文字，无法导出实际异常 | PARTIAL，静态确认 |
| 原R2新检查点CAS | memoryRevision4=实际4，used1、GRANTED | PASS，限本地纯逻辑 |
| 原R4同日第四局资格 | checkOffer allowed=true/block=null | PASS，限本地纯逻辑 |

这些受控故障不代表已经复现最早手机“只剩背景”的具体根因。原手机故障、真实广告和约400MB峰值仍OPEN/NOT_RUN。

证据集中在[本轮目录](../evidence/Acceptance/20261106-host-revive-review/)：[预算桥接结果](../evidence/Acceptance/20261106-host-revive-review/budget-integration-result.json)、[错误出口结果](../evidence/Acceptance/20261106-host-revive-review/failure-ui-result.json)、[领取重检结果](../evidence/Acceptance/20261106-host-revive-review/revive-recheck-result.json)。未覆盖/改写旧轮次原始事故JSON。

## 2. 对上一轮关键假设的裁定

### 2.1 不采用delta clamp作为产品修复

`now-lastTickMs`较大，不等于伪超时。若应用确实在前台等了20秒，用户也等待了20秒，15秒截止应在主线程恢复后的首次可执行机会触发。将delta截为300ms会丢掉19.7秒；若每5秒才调一次而每次仅计300ms，15秒预算会拖成约250秒真实等待。

低档设备、图片解码、GC、同步计算或调试都可能造成长任务；没有证据可以承诺“真实游戏绝不会阻塞15秒”。快速重试成功只证明存在成功路径，不能单独证明先前失败是自动化伪报。

正确方向：前后台按**状态转换时刻**分段计时，回调提交前补记真实前台时间；保留真实前台长等待。若要证明自动化自身造成特定超时，应保留原始操作时间线/长任务证据，测试工具停止组件全遍历，不能修改产品计时规则来使测试变绿。

### 2.2 Web并非天然无持久化

LocalSaveRepository支持具备Web Locks和localStorage的环境。本次localhost新浏览器上下文实际persistent=true，并完成刷新续局。前轮“仅内存模式”应查锁被其它标签占用、上下文是否安全、API缺失或租约失败，不能统一描述为“Web构建无持久化仓库”。

同时保留合法内存降级分支：缺少可靠能力时不强行写档。测试分别记录能力缺失与写租约冲突，不通过关闭安全保护制造持久化成功；不清掉用户存档或打断其它正常标签来取得锁。

### 2.3 Error 3804须凭调用定位

本机Creator3.8.8的`DebugInfos.json`和`cocos/scene-graph/node.ts`对应3804为`getComponent: Type must be non-nil`。无参/错误类型的组件查询确实会触发，不能笼统解释为正常日志。

本次有效组件查询及真实点击未复现3804，只见favicon 404，后者不是游戏资源缺图。原报告若要把3804归因自动化，须给出具体调用或堆栈；无法提供时应写“原运行未归因、本次未复现”。不关闭console.error、不全局忽略3804，也不把约18ms场景加载耗时当作完整冷启动时间。

## 3. 下一轮范围与优先级

不重做已经通过的合同合并、Release导入修复或每日额度移除。沿用现有组件、预算状态机、测试runner和构建工具，不加另一套运行框架。

| 优先级 | 必做项 | 完成边界 |
|---|---|---|
| P0 | A：修前后台时间桥接与回调截止 | 5秒前台+20秒后台仍记5秒；前台真实超限不能被忽略 |
| P0 | B：修错误层、返回菜单和输入所有权 | render抛错仍有可见出口；菜单出现后实际开始可点击 |
| P1 | C：设置独立scope及令牌化收尾 | 首屏设置资源加载成功；旧设置finally不取消新GAME_ART |
| P1 | D：宿主交接后的阶段/免费恢复 | 新宿主不永久SETTLING，不重看、不丢已提交权益 |
| P1 | E：真实Boot、错误摘要、阶段归因 | 当前包能导出实际首错与正确phase，不再只有通用code |
| P1 | 新候选+真实Tap/广告/性能 | 同SHA证据完成，不能标“后续可选” |
| 按风险 | docs45尚未测的权益退出/杀进程/动画资源生命周期 | 保持明确NOT_RUN；若影响奖励或性能则必须修复后交付 |

## 4. A：真实前台预算的最小实现设计

### 4.1 根因

当前tickBudget只在timer触发时读取**当下**backgrounded，再把整个delta归到这个状态。后台timer被冻结时，恢复后的delta包含后台时间。另一方面，assertScope和settleLoadScope不先对时，callback先执行就能在实际超期后提前settle掉尚未运行的timer。

### 4.2 统一计时边界

ArtLoadBudget.advance本身的纯逻辑可保留；补齐ArtAssets与HostLifecycleCoordinator的桥接：

1. 每个LoadScope记录`lastAccountedAtMs / previousForeground / ownerEpoch / traceId / generation`及取消/订阅句柄。begin时读取现有生命周期，不假定起始必在前台。
2. 实现一个最小的`accountUntil(now)`：用**之前的可见状态**分类`now-lastAccountedAtMs`，完整累计真实前台段，再更新lastAccountedAtMs。时间异常、负数不增加；不截断有效大delta。
3. 订阅现有生命周期。hide/show回调先accountUntil转换时刻，再改previousForeground。hide后即使timer整段停止，show也只按旧后台状态补记，不收费后台时长。
4. timer只是兜底检查，不是时间唯一来源。资源/Bundle回调、assertScope和settle前也调用accountUntil并检查预算，逾期先reject/cancel，不能先写loaded、创建纹理或改为SETTLED。
5. 单个游戏资源批次共享15,000ms，不按每张图或每次timer重置。异步任务迟到后只执行其允许的清理，不能创建世界、覆盖新pending或触发新局。
6. settle/cancel/dispose都清理timer和生命周期订阅。所有收尾仅对本scope身份有效；timer的旧回调不能清掉新scope的timer。
7. 预算与StartupTrace前台耗时应使用同一已核对的分段口径，不把帧dt、真实时间与clamp后时间混着报告。单独记录timers迟到/主线程停顿，可用于诊断，不从等待预算扣掉。

核心示例：

```text
begin: last=t0; previousForeground=!host.backgrounded
onVisibilityChange(newState, now):
    accountUntil(now, previousForeground)
    previousForeground = !newState.backgrounded
onTimerOrResourceCallback(now):
    accountUntil(now, previousForeground)
    assert sameScope && sameGeneration && budget.active
settle(scope):
    accountUntil(now)
    if currentScope != scope: return without touching new scope
    if expired: reject; return
    settle and detach only this scope's handles
```

若宿主的hide事件本身延迟，无法凭timer恢复精确历史，应保留可见性事件时间线并标不确定性；不要借此忽略所有长delta。正常已分发的hide/show路径必须通过确定性测试。

## 5. B：独立错误出口与输入所有权

### 5.1 当前两个根因

`showStartupFailure`先调用普通render，再创建overlay，故普通render抛错时根本到不了独立层。返回菜单动作只改screen/render，未清overlayVisible/overlayButtons；画面可能显示菜单，但pointer逻辑仍将点击派给旧overlay。

### 5.2 修复顺序

- 失败处理先冻结本次推进、取消本次资源scope、取消手势；保存错误元数据，不覆盖完整存档。
- 直接构造独立错误层，**不以普通render成功为前置条件**。底层普通UI可以best effort清理，异常只写诊断，不再次递归调用失败render。
- show时将overlayRoot置于Canvas最上层；正常UI/world重建不能把它压到后面。root已失效时由现有AppRoot兜底处理；整个GFX环境已崩溃属于宿主故障，不能承诺引擎内按钮仍有效。
- “返回菜单”统一执行：取消当前scope/旧异步任务→取消pointer和startedInOverlay→hide/clear overlay与旧actions→按持久化边界安全返回→重建菜单。必须回读`overlayVisible=false`，并实际点一次“开始新局”验证，不以screen=MENU为验收。
- “重试准备”先清理旧层与手势，再启动新trace/scope；迟到旧回调不能把新层关掉。诊断页返回恢复到来源页，不只把不可操作错误页藏起来。
- 若已产生临时world/engine但尚未提交成功，只销毁本attempt拥有的临时对象；若已有正式可恢复局，不沿用会abandon/写旧结果的菜单返回逻辑。正常技术恢复仍免费。

下一轮必须注入renderGame/通用render错误、WORLD_CREATE错误、资源不回调及INITIAL_SAVE失败，分别验证按钮可见、可点、返回和重新开始，且旧两槽字节/有效revision不被错误路径无端覆盖。

## 6. C：首屏设置的资源scope

首屏只加载22项，ArtAssets在初始化完成后已settle。openModal(SETTINGS)的loadArtBatch仍调用需要active scope的acquire，故必然对尚未加载项报取消；游戏69项加载后再开设置不能覆盖这一首屏路径。

最小修复：

1. 仅当设置确需未加载UI资源时创建一个设置scope；已加载资源可直接复用。加载中保留文字控件，完成后补齐主题面板/旋钮/图标。
2. begin返回可辨别的scope句柄，settle/cancel接收并核对句柄。旧设置finally不能结束随后启动的GAME_ART scope。
3. 关闭设置、离开菜单、销毁组件时取消设置任务；新游戏资源批次开始前明确接管资源scope。不允许设置任务与开局互相误取消或无限重入。
4. 拒绝/真实缺图时保留可操作文字和返回按钮，并显示真实失败说明；不能把每次首开必失败当作正常降级。
5. 异步完成仍检查owner、modal和scope身份；已返回菜单后不重新画设置。不得为了省事把全部71项恢复为首屏预载。

验收分别覆盖“首次菜单打开设置”“游戏暂停后打开设置”“设置加载中返回并立即开局”，并检查资源数、slider存在、notice与实际截图。

## 7. D：换宿主后的状态与已提交权益

旧宿主回调0次是正确修复，继续保留。但bind在busy时不初始化新视图，旧retry发现ctx失效就return，finally只清busy，因此phase会遗留SETTLING。现有118项/旧探针对此只验证了回调数，没有验证后续按钮与操作可达。

改动限制在服务/宿主/UI交接，不更改核心物理、CAS或完整观看判据：

- 将phase、busy和attempt身份的归属保持一致。新bind根据新活动run与其已核验账本建立视图，旧任务仅释放自己的资源，不能给新宿主写状态或让它永久显示旧任务SETTLING。
- 新run无本次pending/receipt时是独立资格，不继承旧可信视频完成；不能只把旧attempt套入新run。
- 同run已有used1/receipt但现场尚未应用时，必须进入可见的免费恢复状态，绑定新的owner/generation并核对receipt/run/failure/attempt；不能简单改为IDLE后允许再看一次。
- SDK仍在展示时继续遵守现有app级互斥，不能为了重置视图而释放另一展示的锁；本地领取任务被替换也不能清掉新任务的busy。
- 已提交候选应用失败时，普通“结束本局”/返回菜单不能把旧live used0现场写回。docs45的R05/R06c仍须补实际断言；无证据不宣称崩溃/权益退出全验收。
- 必须验证新宿主至少能完成一个后续动作：正常新局继续玩并在合格洒出时offer，或同run免费恢复成功。仅assert旧callback=0不足以关闭。

## 8. E：诊断记录及文档真实性

1. 在真正AppRoot配置加载/校验前后记录BOOT_CONFIG，不在GameRoot已初始化后补写假Boot完成。AppRoot失败时也能显示构建ID和有限诊断。
2. StartupRecord分别保留code与errorSummary/stack；当前有code时不应丢掉error参数。建议摘要≤512字符、堆栈≤1024字符、最近32条；脱敏、按需导出，不逐帧写盘。
3. WORLD_CREATE、RUN_CREATE、INITIAL_SAVE、HUD_READY分别记录start/终态。当前startNew的统一catch将非超时都记WORLD_CREATE，应使用当前失败阶段归因，不能让HUD抛错记录成创建世界失败。
4. FIRST_TICK只记录真实成功推进后的首次步，教程PAUSED和后台暂停不误标为可玩。MENU_READY也不等于手机已落料。
5. 报告写清“正常路径通过”“额外故障失败”“原异常未归因”。修正无依据的“主线程不可能阻塞15秒”“Web无持久化”说明，保留原报告为历史，不覆盖原始日志。
6. 当前源码为未提交整改，发布身份须包括基准commit、当前差异/源清单哈希及未跟踪模块；不把bd12b73单独写成完整构建源码。验收所需新.ts必须在最终源码清单内，不能遗漏于提交/交付。

## 9. 下一轮测试案例与证据

本表为下一轮修复/复验设计；“当前”只表示本次真实执行范围，不把全部计划算PASS。保留118项有效回归；按以下边界补必要集成断言，不只再测纯advance函数。

| ID | 步骤 | 修复后预期 | 当前 |
|---|---|---|---|
| A01 | 前台5秒，hide20秒期间timer不调，再show | 仅计5秒，ACTIVE | FAIL，计25秒 |
| A02 | begin时后台，20秒后show，再前台15秒 | 后台0计费，前台达到15秒才超时 | NOT_RUN |
| A03 | 前台16秒，资源callback先于逾期timer | 提交前拒绝TIMEOUT，不settle、不写loaded | FAIL，SETTLED且记0 |
| A04 | 前台真正阻塞20秒后恢复 | 首个可执行检查超时，不clamp为300ms | 待加入集成断言 |
| A05 | 14秒/15秒、取消、同scope并发、旧timer迟到 | 同一批预算正确，旧timer不关新timer | 纯逻辑部分PASS，集成待测 |
| B01 | 注入资源错误→返回菜单→点开始 | overlay false，真实进入新加载并可玩 | FAIL，点击无响应 |
| B02 | 普通render/HUD分别抛错 | 独立错误层仍可见可点，不外抛递归 | FAIL，overlay false |
| B03 | WORLD_CREATE/INITIAL_SAVE失败→重试/菜单 | 真实错误阶段；临时对象清理，旧档保留 | NOT_RUN |
| B04 | 按下overlay按钮时被取消/切页再松手 | 无旧按钮动作或漏到游戏的点击 | NOT_RUN |
| C01 | 首屏22项时直接打开设置 | UI资源补齐、slider存在，无无故取消 | FAIL |
| C02 | 设置加载中返回，立即开始/继续 | 新GAME_ART不被旧finally结束 | NOT_RUN |
| C03 | 已加载69项后暂停开设置 | 缓存可复用，返回仍暂停，主题正确 | 待复验 |
| D01 | retry读档中bind另一宿主，等旧任务结束 | 旧回调0，新视图可操作、非永久SETTLING | PARTIAL，phase仍SETTLING |
| D02 | reward失败→其它合法检查点推进→重试 | 使用最新revision，used1且GRANTED | PASS，4=4 |
| D03 | 取消→UI重新观看→成功→再次洒出 | 同分同run，一次成功额度，后续正常结算 | Node覆盖通过，完整UI/宿主待测 |
| D04 | receipt已落盘而应用失败→菜单/技术恢复/重启 | 免费应用同候选，used1不回退，不重看 | NOT_RUN |
| D05 | 同日第四局、错run/failure/attempt、双广告并发 | 资格正确，错凭证不发，展示互斥 | 已有部分Node覆盖，设备待测 |
| E01 | 配置失败、HUD失败分别导出日志 | 包含真实Boot、正确phase、异常摘要/堆栈 | 静态缺口 |
| E02 | 有/无Web Locks、锁占用分别启动 | 正确记录持久/内存原因，原档不被强写 | 正常持久化PASS，其它待测 |
| E03 | 无无参组件查询的真实操作 | 无3804；若出现保留首条堆栈 | 本次未复现3804 |
| N01 | 开始/教程/落料/拖杯/晃杯/暂停/刷新续局 | 同run/score/RNG/余额，真实按钮可达 | PASS，见状态序列 |
| T01 | 新包同SHA Tap全新存储/旧档/继续/后台 | 杯/HUD/按钮及落料可操作，阶段正确 | NOT_RUN |
| T02 | 真广告完整/取消/失败/迟到/保存失败 | 只按可信完成发一次，取消可手动重试 | NOT_RUN |
| P01 | 冷/热各10次，各目标机型 | 原始样本、中位数/P95、缓存网络口径一致 | NOT_RUN |
| P02 | 游戏10分钟、重开20次、广告和晃杯压力 | 进程峰值/稳定值/增长曲线，平台复测通过 | NOT_RUN |

本次正常动作只有favicon 404，不将其算缺少游戏图片；也不通过忽略所有console.error来让验证通过。自动脚本等待明确状态/资源条件，等待窗口失败需记录当时loading/budget，而非“未在固定5秒内进游戏”就下结论。

## 10. 新包、Tap与真实广告执行设计

### 10.1 修复后重新构建

本V3的SHA是已知失败边界的对照。下一轮代码改变必须使用新唯一Debug/Web Release/Tap buildId，例如20261106-host-revive-v4的三个独立ID；不能复用V3路径或只修改清单。版本号先核对后台唯一性，不从文件夹名推断。

先通过原工程/裁剪副本类型检查、合同镜像、原118项及新增案例，再用现有构建工具。验证71+7映射、CRC、派生哈希、无Debug/Mock及无source map，实际Web全链路和失败出口；清单与交付ZIP再次校验SHA。原稿不改，旧包保留复现，不为本轮再复制全部历史文档。

README、docs22、docs38、CURRENT-CANDIDATE从一份真实发布清单更新；工作区改动未提交时记录完整源清单/差异身份。提交/推送、Tap上传/广告配置/提审/发布按用户具体授权执行，本次验收不自动执行。

### 10.2 Tap开局与广告分阶段

第一阶段可以用广告关闭的新诊断包先验证Tap真实开局：记录包SHA/平台包版本、设备型号/系统/Tap版本、首条错误堆栈、最近32条诊断；覆盖新档、旧档、后台切换、失败重试、落料/移动/晃杯/暂停。原手机错误没取到实际根因前仍OPEN。

第二阶段具备真实广告位且取得配置/上传授权后，生成**广告开启的新buildId与新SHA**。打开策略会改变包体，不能沿用广告关闭包的SHA或把其启动/内存结果直接作为广告开启包的结果。重新跑受影响的开局/存档/性能场景。

真实视频仍只按Tap顶层`onClose.res.isEnded===true`发奖，不看本地倒计时或show.resolve。准备满足现行教程/首轮保护/前台时长门槛的账号状态；门槛未达和SDK失败分开记，不自动去掉已有保护来演示成功。

至少实测完整观看、提前关闭、load/show失败、后台切换、重复/迟到回调、奖励保存失败后免费领取、同局第二次洒出及同日第四局。回读同run/score、used、pending、receipt和revision摘要，不能只看“成功”提示。无真实广告位时保留disabled及NOT_RUN，不能当需求已交付。

采用已安装官方taptap-* Skills与Cocos小游戏路线；不将H5 MCP广告/上传流程套用本项目。任何账号凭据不进仓库/报告。

### 10.3 用户补充：实际广告点必须可用，不以本地代码代替接入

2026-11-06再次核对实际源码：两个广告策略均为enabled=false、adUnitId=null。洒出复活的enabled还传给RunEngine；关闭时beginSpillPending返回false，SPILLED直接走结算，因此用户看不到复活询问。这不是“真实广告已接入，只缺一张验证截图”，而是当前包仍未提供玩家可用的真实广告奖励。

| 必交广告点 | 玩家触发 | 奖励与上限 | 当前检查结论 |
|---|---|---|---|
| 额外晃杯 | 两次免费晃杯用尽后，点击对应按钮自愿观看 | 完整观看后本局额外一次晃杯，沿用该点独立策略 | 本地代码存在；正式策略关闭，真实展示/奖励未验 |
| 洒出复活 | 晃杯或移杯导致小料真实判定SPILLED，本局尚未成功复活 | 询问是否观看；完整观看后同局同分继续，每局最多一次成功复活 | 本地代码存在；关闭状态直接结算，真实接入未完成 |

洒出复活的必验流程：判定SPILLED→冻结物理/落料并保存候选→提示“完整观看视频可复活一次，保留当前分数”→玩家点击观看→真实SDK视频→可信完成回调→receipt与候选原子提交→清理洒出/危险区小料→安全暂停，玩家继续后120tick内不落新料。拒绝则唯一正常结算；取消/未看完不发奖，保留手动重试。技术故障不能借此要求看广告。

用户提到“看满30秒”：实现以Tap顶层isEnded===true为完成判据，不新增本地30秒计时发奖。若实际素材为30秒，则应完整观看该素材；具体时长由真实投放确认，不能在未确认素材时承诺所有视频恰好30秒。

还需核对可见性门槛：当前要求教程完成、前台至少60秒、已完成一局自然游戏。Tap[首次启动广告规范](https://developer.taptap.cn/minigameapidoc/tap-operation/operation-standards/minigame-ad-policy/)包含首次60秒内或1个关卡内不展示广告的要求；无限模式如何映射“关卡/首局”需按平台适用口径确认，不盲目删保护，也不将额外无依据的门槛保留为永久隐形阻断。验收必须分别记录门槛未达、配置未开、缺广告位、不支持SDK、load失败，不能全部统称“没有广告”。

下一轮必须交付：这两个广告点的真实配置身份、合格状态下可见入口截图、成功/取消/失败实机视频与奖励存档回读。同一局洒出第二次不得再次复活。同日第四个新run在符合其它合法条件时仍有一次机会。没有真实广告位和宿主结果时，这两项继续标未交付，不能因118项或Mock通过关闭。

## 11. 性能、晃杯和动画的必须收口项

旧“启动慢、部分机型约400MB峰值”是平台失败反馈，不能写后续可选。按docs45已有测量设计继续：实际失败机型、低/中档Android及目标iOS，分别记录冷/热启动、10分钟、20次重开、广告前后和晃杯压力。

- 区分JS堆、GPU/解码纹理、Canvas/Image backing、音频、广告阶段和整进程；23MiB纹理预算不等于整进程峰值。
- 获取原平台报告的明确阈值和单位，按该口径复测。docs45中的5秒/8秒、200/256MiB只是开发观察目标，不是已核实的官方过线值。
- 对长任务采样保留场景和时序，不将主线程阻塞从前台等待里抹掉。发现确切热点后再分阶段/延后非必需资源或减少同步工作。
- 检查设置/开局scope timer和监听、世界、SpriteFrame/Texture2D/ImageAsset、猫咪异步加载、Tween和特效持有是否随重开回收；不靠循环GC掩盖引用泄漏。
- ASTC和DPR策略仍需按实际引擎/加载路径证明生效及回退，不先换引擎/私有字段或重画素材。已存在的图集收益继续保留。
- 原手机晃杯异常用同包真实设备复测，出现时保存实际堆栈与物理阶段；技术恢复免费，不能用广告恢复掩盖程序错误。其余动画未接入/减少动态/生命周期项按docs42明确保留，不宣称全完成。

官方核对日期2026-11-06：[完整观看回调](https://developer.taptap.cn/minigameapidoc/dev/api/ad/RewardedVideoAd.onClose/)（未标更新日）、[内存优化](https://developer.taptap.cn/minigameapidoc/dev/tutorial/performance/runtime/memory/)（2025-02-25）、[性能测试](https://developer.taptap.cn/minigameapidoc/dev/tutorial/performance/performance-test/)（未标更新日）。官方资料支持回调含义、纹理/对象持有风险和设备测量方法，不代表本包通过。Android按Tap开发调试记录，iOS具备条件时观察对应WebContent进程；未执行的项分别标NOT_RUN。

## 12. 完成标准与执行提示词

本地可以关闭的条件：A–E失败项修复并有集成/实际按钮证据；118项及新增有效断言通过；新Release编译、资源/ZIP门禁通过；正常与失败后重新开始、持久化恢复均可操作。

整体通过还需要同SHA Tap、真实广告、原始手机故障与平台启动/内存结果。缺设备不阻止先修本地问题，但应交付诊断候选和精确补测步骤，不再把P1-D标全部完成。

```text
请在 D:\Workspace\TapTap\奶茶挤挤 按 docs/46-v3-review-and-host-closeout-design.md 实施，先读AGENTS.md和当前代码，保护所有未提交整改，不回退到bd12b73。

1. 保留已通过的合同/Release/RV-25及118项修复。修ArtAssets的真实前台分段计时：hide/show先按旧状态补记，资源callback/settle前对时；不clamp有效大delta。执行本页A类集成测试，不能只测ArtLoadBudget.advance。
2. 修独立错误层：不依赖普通render；返回菜单清overlay/pointer/actions并实际点开始验证。修首屏设置的加载scope，令牌化收尾，旧finally不能取消新GAME_ART。
3. 修bind/retry交接后残留SETTLING：旧回调仍0次，新视图能继续操作。同run已落盘权益走免费恢复，不能改为可重看或让旧used0覆盖used1。
4. 补真实AppRoot Boot记录、阶段归因、错误摘要/堆栈，修正“自动化伪超时”“Web无持久化”等无充分证据的结论。
5. 复用现有runner补本页必要案例；真实Web验证开局、移杯、晃杯、暂停、刷新续局以及错误→菜单→重新开始。只记录实际结果，不删断言或忽略console错误制造通过。
6. 本地通过后用新唯一buildId构建Debug/Web/Tap，验证71+7、CRC/哈希和Release清洁度，统一实际源身份/包SHA/候选入口。广告关闭与开启包是不同SHA，分别验证。
7. 按授权与设备条件完成同SHA Tap开局、真实视频完成/取消/失败、存档、晃杯、冷热启动和约400MB峰值复测。特别完成第10.3节两个真实广告点：免费晃杯用尽后的额外晃杯，以及晃杯洒出后保分复活；核对首次体验门槛，不能只验证Mock或保留enabled=false便称接入完成。缺条件时交付可操作诊断候选、NOT_RUN项与所需现场资料，整体保持BLOCKED；这些不是可选验收。

不改完整观看才奖励、双广告互斥、同run同分、每局一次、120tick缓冲、双槽CAS与旧档保护，不加每日限制/新付费/新玩法。最小修复，复用已有依赖，不改原稿或擅自升级引擎。交付改动与根因、必要测试/截图、实际ZIP SHA及剩余缺口；提交/推送和平台外部写入按用户具体授权执行。
```
