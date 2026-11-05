> 2026-11-06：本页为前轮设计基线。Release、合同、正常Web及118项已通过；最新额外失败场景、收口方案和执行提示词以[docs46](46-v3-review-and-host-closeout-design.md)为准，不重复修已关闭项。

# R1–R4独立验收与下一轮实施设计

日期：2026-11-05。验收对象：commit `bd12b731a91bc3a2952af02faf4219ff1e286fc9`。**总体BLOCKED，不能交付。不是只剩真机验证：本地还有未实现、构建失败和可复现的逻辑缺口。**

本轮只验收、验证现有提交并编写下一轮方案，没有修运行代码、更新旧断言、生成新包或上传Tap。已按用户要求执行`git push origin main`，返回`Everything up-to-date`；随后`git ls-remote --heads origin main`确认远端正是上述完整SHA。无需代理。新文档及验收资料尚未另行commit/push。

## 1. 本轮实际结果

| 项目 | 结论 | 证据及边界 |
|---|---|---|
| 现有commit推送 | PASS | 远端main与本地HEAD相同，不是仅凭缓存的origin/main判断 |
| 原工程类型检查 | PASS | `npm run typecheck --prefix 奶茶挤挤` |
| R1前台15秒截止与generation取消 | FAIL，未接通 | ArtAssets只新增常量、字段和setter；没有计时、拒绝Promise、generation比对或调用setter的代码 |
| R1阶段诊断 | PARTIAL | 只写初始化四类阶段；没有开始后的世界/HUD/首帧记录，没有导出最新32条；catalogSize恒为0，读档失败也可能记ok |
| Release可构建性 | FAIL，P0 | 真实裁剪脚本在隔离副本运行后，tsc报`TS2304: Cannot find name 'DiagnosticRing'` |
| R2原始“提交后额外回读失败” | PASS，限本地案例 | 内存revision3=实际revision3；两次领取调用后GRANTED、liveUsed1 |
| R2无receipt且出现新检查点 | FAIL | 补充注入后内存revision2、实际3，重试仍ERROR、used0 |
| R2异步期间更换宿主 | FAIL | 读取期间重新bind后，旧宿主提交回调仍被调用1次；身份检查前已发生副作用 |
| R3取消后保持失败冻结 | PASS，限服务层 | 取消后PAUSED、used0、phase ERROR，不再直接SETTLING |
| R3玩家能再次观看 | FAIL，静态确认 | renderRevive的ERROR分支没有重新观看按钮；用户仍只有结束/部分领取选项 |
| R4同日第四局offer | PASS，限Ledger | dailyGranted3时checkOffer返回allowed=true/block=null，次数阻断已移除 |
| R4配置与文案收口 | PARTIAL | maxDailyRevives仍必填1..3，保留dailyRemaining、旧DAILY_LIMIT分支和误导测试名；主业务不再阻断，不把残留等同于第四局仍被限制 |
| 旧回归及边界探针 | 110 PASS / 1 FAIL | RV-25仍断言取消后SETTLING，与已确认需求冲突；不能写111/111 |
| 根类型合同镜像 | FAIL，前轮遗留 | 根contracts/types.ts仍落后于工程复活类型；未同步覆盖 |
| 当前源码对应新包 | NOT_RUN | 现存game.zip为前轮构建，不含本commit。Release检查失败后未继续Creator构建 |
| Tap宿主、真实广告、启动/约400MB峰值 | NOT_RUN / OPEN | 缺同SHA宿主日志与复测结果，不能据本地结果关闭 |

实际命令/结果保留在[本轮证据目录](../evidence/Acceptance/20261105-r1-r4-review/)：

- [原边界探针日志](../evidence/Acceptance/20261105-r1-r4-review/probe.log)、[结果](../evidence/Acceptance/20261105-r1-r4-review/probe-result.json)。旧轮次JSON已原样恢复，没有用新结果覆盖旧事故证据。
- [补充探针](../evidence/Acceptance/20261105-r1-r4-review/additional-probe.cjs)、[结果](../evidence/Acceptance/20261105-r1-r4-review/additional-result.json)。它们复用现有fixtures，未改原测试断言。
- [Release裁剪记录](../evidence/Acceptance/20261105-r1-r4-review/release-strip.json)、[Release类型错误](../evidence/Acceptance/20261105-r1-r4-review/release-typecheck.log)。隔离副本在build-artifacts内，不是新候选，不准上传。

保留项核对：本commit没有修改TapRewardedAdProvider、Factory、RewardedAdCoordinator、RunEngine、LocalSaveRepository和120tick策略。现有纯逻辑相应用例仍通过；这只证明代码差异及本地覆盖，不证明真实广告、崩溃和设备表现全部验收。

## 2. 目标、范围与实施顺序

目标是交付一份可在Tap稳定进入游戏、复活可重试且不串局、资源可追溯的新候选，并取得同包宿主与性能证据。开发先完成可独立验证的工作，不把所有本地缺口都归因为“缺真机”。

| 顺序 | 工作 | 依赖/完成标准 |
|---|---|---|
| P0-A | 修Release裁剪 | 裁剪后的类型检查通过，必要诊断保留，Debug/Mock接口仍移除 |
| P0-B | 补齐加载截止、取消、状态层和完整阶段日志 | 前台截止真实触发、迟到回调不生效；世界/HUD异常仍有可点出口 |
| P1-A | 修复活领取身份与revision重读 | 本章第5节及R类案例通过，不改核心物理/奖励规则 |
| P1-B | 补取消后重试UI、移除每日上限残留、同步合同 | 玩家能重试；同日第四局全流程通过；根/工程合同一致 |
| P1-C | 更新测试和候选 | 修正RV-25而不删有效断言；新Debug/Web/Tap均新buildId |
| P1-D | 同SHA Tap宿主、真广告及性能复测 | 获得实际开局/操作/奖励/存档/性能结果后才关闭对应缺陷 |
| P2 | 按数据补动画生命周期和资源优化 | 不先重画素材、不盲改物理；必要项与本轮未实现项都保留 |

不增加每日复活额度、自动弹广告、付费重生、新排行榜或云存档。每局一次成功复活、同run同分、完整视频才奖励、120tick缓冲及两广告互斥保持。

## 3. P0-A：修复Release裁剪回归

根因：[strip_p1c_release_debug.cjs](../tools/strip_p1c_release_debug.cjs)会删掉GameRoot对DiagnosticRing的导入，但新增的stages字段仍使用该类。源工程typecheck通过不能覆盖这个转换后错误。

最小修复：保留正式阶段日志需要的DiagnosticRing导入和实现；继续只删除events/commands/frames等Debug探针、fixtures和Mock广告入口。随着诊断位置调整，按实际AST目标更新精确命中数，并解释为何变化；不能整段跳过裁剪或删除正式日志制造通过。不要引入第二套大型日志框架。

验证顺序：在全新隔离目录运行真实裁剪脚本→隔离tsc→Debug/Mock禁词门禁→正式Creator构建。只要隔离tsc仍失败就停止包体生成。Debug和Release都要有第4节允许的阶段摘要，Release没有任意执行命令/fixtures全局。

## 4. P0-B：开局可观测、超时可退出、重试不串局

### 4.1 阶段日志与身份

复用DiagnosticRing，使用一份最多32条的正式阶段记录。推荐由AppRuntime持有，使AppRoot能记录真正的配置加载，GameRoot复用同一上下文；移除无用的重复64条日志。它是进程内诊断数据，不是新存档schema或业务事件。

每条记录：`buildId / traceId / ownerEpoch / phase / result(start,ok,error,cancel) / elapsedMs / foregroundElapsedMs / code / assetId或bundleName(可选)`。错误只保留脱敏摘要及有限堆栈，单条建议不超过512字符；不记录存档正文、账号、Token、广告原始回调。禁止逐帧写盘和持续上报。时钟不可用也不能因日志自身抛错而导致开局失败。

| 阶段 | 正确记录位置/判据 |
|---|---|
| BOOT_CONFIG | AppRoot真实配置读取/校验前后，不是假称GameRoot取得租约就是配置完成 |
| SAVE_READ | 真实读档结果；失败、降级内存模式和成功分别记录，不能用bundleInitialized=true代替成功 |
| ART_CATALOG | 索引通过校验，记录实际ids/variants数；不能写恒为0的占位值 |
| MENU_READY | 菜单已绘制且开始按钮可响应 |
| START_REQUEST | 游戏内开始/继续点击已被接收；区分平台启动入口与游戏内按钮 |
| GAME_ART | 必需资源批次开始/完成/失败，包含资源ID和共享加载预算 |
| WORLD_CREATE | Cup及物理后端成功建立，失败记录实际异常 |
| RUN_CREATE | RunEngine成功建立，仍保持不推进 |
| INITIAL_SAVE | 新局CAS成功或明确进入允许的内存模式；记录revision和结果，不记录payload |
| HUD_READY | 杯、HUD、晃杯/暂停或教程出口已建立，不能仅凭screen赋值记录成功 |
| FIRST_TICK | 第一个成功固定物理步，最多一次；教程/后台暂停时尚未出现是合理状态 |

阶段记录start和终态，异常归属实际阶段。每次开局/继续/重试采用新的traceId；最近32条携带各自traceId，不能把上一次的HUD_READY当作本次完成。FIRST_TICK与MENU_READY分别衡量游戏推进和首个可交互，不混成同一启动指标。

可见出口：正常菜单/失败页提供“查看诊断”，展示构建ID、阶段和错误编号；错误时按需输出一条可复制的最近32条JSON到宿主console。使用现有按钮/文字风格，默认不向普通玩家铺满技术细节。无需暴露__P1B_DIAGNOSTICS__或新测试命令全局。

### 4.2 真正的前台累计15秒截止

修改ArtAssets实际加载路径，而非只加常量。一次资源批次共享加载上下文，建议字段为`generation / ownerEpoch / traceId / foregroundMs / cancelled / settled`：

1. 初始化索引+菜单资源共享一个15,000ms前台资源预算；点击开始的必需游戏资源批次使用新的15,000ms预算。四并发和逐批加载都消耗同一个预算，不给每颗图片重置15秒而导致总等待数分钟。
2. 可见性使用现有HostLifecycleCoordinator；后台不累计，不自动补时间。使用真实单调时间差，100–250ms的轻量检查即可，不建每张图片一个高频循环。
3. 索引、loadBundle、resources.load和bundle.load都受上下文控制。资源报错立即失败；始终不回调也必须在前台累计达到预算后拒绝等待，进入可操作错误状态。
4. GameRoot在开始/继续/重试时实际设置或传入generation；返回菜单、换局和销毁立即取消旧上下文。取消要让等待Promise结束，不能只改一个未读取的数字。
5. 回调执行前检查disposed、generation、owner和是否已settled。迟到回调不得写loaded/bundles、创建Sprite/世界、覆盖状态或打开第二局。pending缓存只在仍指向该任务时清理，旧回调不能删除新generation的pending项。
6. 不粗暴releaseAll或释放其它generation正持有的共享ImageAsset。只配对释放本次实际持有的引用；全局引擎缓存的资产不因本次取消被一律销毁。
7. 结束/失败/取消都解除定时器及生命周期订阅；重开20次不累积加载计时器。下一次重试可使用已正确加载且仍有效的资源，但不能复用旧的未决Promise。

建议错误编号：`START_ART_TIMEOUT / START_ART_FAILED / START_WORLD_FAILED / START_RUN_FAILED / START_SAVE_FAILED / START_HUD_FAILED`。这是本项目诊断编号，不冒充Tap官方错误码；用户取消使用cancel而非技术报错。

### 4.3 独立状态层与开局提交边界

现有render先destroy全部UI再重建。下一轮增加稳定的状态/错误层，直接由AppRoot或Canvas专用兄弟节点持有，只依赖现有Graphics/Label及最小输入处理，不依赖ArtAssets、Cup/World、Effects或同一个失败的GameRoot.render。它不随重建HUD销毁，不被杯子或全屏背景覆盖。

- 点击开始后下一次可绘制帧展示“正在准备这杯…”，禁用重复开始；不显示虚构百分比。
- 必需资源、世界、引擎、存档边界和HUD完成前，不提前公布可玩的PLAYING。复用现有暂停机制，避免初始化过程中物理/自动落料先推进。
- 创建HUD先使用临时子树；成功后替换旧UI，失败保留原可操作菜单或显示独立兜底。异常处理不能递归调用同一个已失败的render。
- 超时页提供“重试准备”“返回菜单”“查看诊断”。重试资源不自动抹旧档或开始另一局；继续上局失败保留原槽和revision。
- 世界或刚体创建失败后，清理本次临时世界/引擎/监听，不销毁其它owner的数据；不能留下disposed engine继续被render/update使用。
- 只有整个图形运行环境已不可用时才无法承诺引擎内按钮可见，这种情形必须取得宿主错误/崩溃报告，不能把背景当作正常等待页。

## 5. P1-A：复活领取的身份、重读与幂等

### 5.1 已复现但未覆盖的两种情况

第一种：奖励提交失败，之后其它合法检查点将revision推进到3，尚无receipt。当前retry虽然读到revision3，却没有同步，就调用settle用revision2写入，永久冲突。

第二种：retry读档期间重新bind。当前代码在检查`this.host===owner`和generation之前就调用旧owner.onSpillReviveCommitted。补充探针观察到一次旧回调；此处还未完整比较当前活动run与failure身份。

### 5.2 不可变尝试身份

在开始观看前保存本次不可变身份：`owner / hostGeneration / runId / failureId / attemptId / candidateHash`。复用现有pending数据，不另建数据库、存储协议或奖励通道。可信完成只能绑定这一份attempt；bind新run不能继承旧可信完成权益。

每个await之后，任何宿主写入、引擎apply、phase变更或changed通知之前，都先验证：同owner、同hostGeneration、同活动run；失败候选仍是本failure，或者当前run已由本attempt成功复活。失效时只清理旧任务自己的busy状态，不通知/覆盖新宿主。新host的bind负责初始化自己的视图；旧任务收尾后不能让新run永远停在旧任务的SETTLING状态。

### 5.3 领取重试算法

1. 检查同一attempt的可信完成与当前owner；进入SETTLING并等待现有保存边界空闲。不能用retry触发新prepare/show。
2. readBundle返回错误/无可验证信封时，保留免费“重试领取”，不回落到旧bundle盲写CAS。
3. 信封存在对应receipt：同时核对attemptId、runId、failureId、rewardKind/amount、committedReceiptId、run.revive.used1；当前活动run也必须匹配。原candidateHash与待应用候选必须属于同一失败。任何不符都停止，不能把两个彼此一致但属于另一局的持久化对象当作本局凭证。
4. 核验完成后才同步宿主bundle和**读到的envelope.revision**，免费应用这份已提交候选。已应用同receipt直接幂等成功，不重复建世界/清料/计分；应用失败保留凭证和免费重试。
5. 信封没有receipt：必须仍存在本attempt的pending及相同pendingFailure/候选、同活动run，才可同步最新bundle/revision，再合并本次奖励发起CAS。保留其它账本、设置和新字段，不能用旧bundle整体覆盖新档。
6. 遇CAS冲突只允许一次受控的重新读取/核验；仍冲突则暂停、显示可重试。不循环写、不放宽CAS、不覆盖其它新局。
7. commit成功立即同步已提交revision是本轮正确改动，保留。额外回读后采用回读信封revision，重新核验身份，才允许应用和显示成功。
8. 只有receipt+候选原子落盘后才used1；apply之后PLAYING前仍安全暂停。技术恢复不可把较旧内存检查点used0写回覆盖已提交used1。

伪代码约束（实际接口沿用现有服务）：

```text
ctx = captureCurrentAttemptIdentity()
fresh = await repo.readBundle()
if !stillOwns(ctx): return without touching either host
if !fresh.valid: keepFreeRetry(); return
if matchingCommittedReceiptAndRun(fresh, ctx):
    syncHost(fresh.payload, fresh.revision)
    applyCommittedCandidateOnce(ctx); return
if !matchingPendingAndFailure(fresh, ctx): blockWithoutGrant(); return
syncHost(fresh.payload, fresh.revision)
CASRewardIntoFreshBundle(ctx) // 冲突后有限重读，绝不重放广告
```

已落盘但未应用的奖励错误页，不得再让普通“结束本局”沿旧live used0结算覆盖新候选。提供免费重试；返回菜单必须保留已提交候选并安全销毁旧现场，不直接复用会abandon并保存旧现场的返回流程。仅“可信完成但尚未落盘”的状态可由用户明确放弃奖励后正常结算，不能自动放弃。

## 6. P1-B：取消后可重试的UI与每日策略收口

### 6.1 复活弹窗状态

| 状态 | 提示/可用按钮 | 禁止行为 |
|---|---|---|
| OFFER/可观看 | 说明清料、保分、每局一次；观看/结束 | 自动播放、隐藏结束入口 |
| PREPARING/SHOWING | 准备或播放中 | 重复点击发起另一广告 |
| ERROR，未完成且pending已可靠清理 | “未完整观看/暂时加载失败，未获得复活”；重新观看/结束 | 只给结束；自动反复弹广告 |
| ERROR，pending清理未完成 | 重试处理/明确放弃处理 | 带未清理pending再次展示广告 |
| SETTLING/已完成待领取 | 保存中或免费重试领取 | 要求重看视频、再次扣机会 |
| 已提交候选应用失败 | 奖励已保存；免费重试恢复/安全返回菜单 | 用旧失败现场覆盖已保存权益 |
| GRANTED | 成功保分；继续 | 再次发奖 |

最小UI修改是补齐renderRevive的ERROR分支：当`!retrySettle && !pendingAttempt && block===null`时显示“重新观看复活”，点击后调用既有openOffer/watch。取消后used仍0、同failure冻结、score/run/RNG不变。仅用户明确结束才唯一结算。不要改Tap完整观看判据或把SDK取消当成完成。

### 6.2 R4剩余收口

次数阻断已移除，不要再重新添加每日限制。继续清理必填maxDailyRevives、dailyRemaining和旧DAILY_LIMIT用户文案：

- 新配置不要求maxDailyRevives；旧配置带该字段时只做兼容读取/忽略，不影响可观看能力，不把值改成巨大的常数。
- 正式策略类型/Loader/配置同步调整；`maxRevivesPerRun=1`保持硬规则，真实adUnitId缺失仍关闭策略。
- 账本dayKey、dailyGranted与receipt历史保留作审计，不因此升级或重写存档。确需展示统计时显示“今日已复活N次”，不显示“今日剩余0次”。
- 额外晃杯自己的每日策略不受此变更影响；两广告点仍共享展示互斥并分开记账。
- 第四局验证不能只断言dailyRemaining为0；必须在日计数3时仍可offer，并完整成功一次，再次洒出不能第二次复活。

### 6.3 合同与文档一致

比较根contracts/types.ts与工程镜像，优先把工程新增复活/旧版兼容类型正确合入根合同，再运行同步和check。不得用落后的根合同直接覆盖工程。保持当前实际run5/profile3/envelope2及save appVersion0.1.0；本轮逻辑修补不需要凭文档建议擅自升级schema。构建版本、buildId、rulesVersion和存档版本分别记录。

`doc/AI开发文档.md`和`doc/项目设计文档.md`原有client/抖音/未装编辑器等内容是旧快照，不是当前事实。本轮将它们改成现行导航，详细设计集中在本页，避免两份相互冲突的状态表。

## 7. 测试更新设计

保留原111项的有效行为覆盖。RV-25应改为取消不发奖、pending清理、同failure继续PAUSED/used0/非SETTLING；新增玩家再次观看后才GRANTED。更新不是删除失败测试，更不能直接把总数改写成111/111。

使用现有runner/fixtures扩展有价值的断言。以下是**下一轮待执行案例设计**，不是本次已全部通过；本轮实际结果只看第1节。Debug注入放既有测试命名空间，Release必须剥离，不为测试引入另一套运行引擎。

| ID | 场景/步骤 | 预期与需回读的结果 |
|---|---|---|
| H01 | Web新档开始→教程完成→落料→暂停/继续 | 杯/HUD/晃杯/暂停可见，tick推进；非只看背景 |
| H02 | 同SHA Tap新档冷启，点击平台入口后再点击游戏开始 | MENU_READY、START_REQUEST、HUD_READY正确；完成教程后FIRST_TICK |
| H03 | 保存旧局→退出→继续上局 | run/score/RNG/revision正确，明确继续前不推进 |
| H04a | catalog、Bundle、Image分别不回调 | 前台累计15秒拒绝；有错误编号/重试/菜单 |
| H04b | 加载5秒→后台20秒→前台9秒→再1秒 | 前台累计14秒前不超时，达到15秒超时；后台不补投 |
| H04c | 超时后重试，新任务成功，旧回调随后到达 | 仅新任务生效，无双局、无旧资源覆盖或新pending被删 |
| H05a | 创建世界/引擎分别注入异常 | 独立状态层仍可操作，旧档不变，无多余监听 |
| H05b | renderGame/HUD构建抛错 | 旧菜单或独立错误页保留按钮，不再次递归失败render |
| H06 | 加载中/教程中/首帧前切后台再返回 | 生命周期按当前owner处理，明确继续，阶段不误报 |
| H07 | 三次连续开始/重试/返回 | 每个trace独立，最近32条有界；只一个有效世界和计时上下文 |
| R01a | reward CAS成功、额外回读失败一次，再领两次 | 内存/磁盘revision一致，receipt1条、used1、只apply一次，无重看 |
| R01b | reward提交失败→其它合法检查点推进revision→重试 | 使用最新revision和字段，成功一次；不再2对3永久冲突 |
| R01c | 重试readBundle报错/空信封/冲突再次发生 | 保持免费重试、不写旧bundle、不无界循环 |
| R02a | CANCELLED/未看完 | 同run/score/failure、used0、PAUSED，无receipt；UI有重新观看 |
| R02b | 取消后手动再看并完整结束 | 真实第二次用户点击才展示；成功保分且used1 |
| R03a | load/show失败后手动重试 | 不SETTLING、不扣机会；清理未成功时先处理存档 |
| R03b | 同一失败反复取消→明确结束 | 仅最终一次RunEnded/结果，无已完成奖励伪造 |
| R04 | 同日已有3次复活，在第四个新run复活 | 仍可观看并成功；本run第二次洒出直接正常结算 |
| R05a | commit成功→世界应用失败→再应用 | 持久候选used1不回退，免费重建，不二次清料/计分 |
| R05b | pending前/完成未落盘/落盘后/应用后分别杀进程 | 仅可证明的已提交权益恢复；不会补发未经确认的视频 |
| R06a | retry读档期间换host/换run/解绑 | 旧owner回调0次、新host无覆盖、新run分数和revision不变 |
| R06b | 返回另一run/failure/attempt的合法receipt信封 | 严格拒绝，不apply，不把合法异局档写进当前host |
| R06c | 已提交used1后点击技术恢复或返回菜单 | 不以旧used0现场覆盖；再进可恢复已提交候选 |
| R07 | 两广告同时点击、重复SDK回调、早退、旧attempt晚回调 | 一次展示；按归属发一次；isEnded不是true不奖 |
| R08 | 同等级合成计分后洒出复活 | 同run/分数/maxLevel/两RNG/晃杯余额保持，清料不加分 |
| R09 | 复活成功后继续，数到119/120 tick | 保持120tick落料缓冲，不被普通resume覆盖成60 |
| C01 | 合并合同后check、旧run4/profile2读档 | 镜像一致，合法迁移，不在资源重试时悄悄覆盖旧档 |
| B01 | Debug与Release分别裁剪/编译 | Release无DiagnosticRing缺失，正式阶段摘要可用 |
| B02 | 真实Creator构建并检查ZIP | 71+7映射、CRC、派生哈希、版本、原稿保护通过 |
| B03 | 检查所有Release JS和入口 | 无FakeRewardedAdProvider/fixtures/debug globals，安全日志仍存在 |
| B04 | 菜单/诊断页buildId对照发布清单/实际上传SHA | 一一匹配，无拿前轮包验证本轮代码 |
| P01 | 各设备冷/热启动10次；记录原始样本 | 分开MENU_READY与FIRST_TICK，记录中位数和P95，不扣掉人为等待伪提速 |
| P02 | 每设备正常玩10分钟、重开20次 | 宿主进程峰值、稳定值及增长曲线可核对，无持续泄漏 |
| P03 | 真广告加载/播放/返回再继续 | 广告阶段峰值单列，前后台不追赶物理，资格只发一次 |
| P04 | 真机快速拖杯/连续晃杯/洒出密集场景 | 无原始物理故障，移动响应和效果合理，异常保留实际堆栈 |

现有边界探针exit1来自旧RV-25失败，不是R2原场景继续失败。补充探针修复后应保留“旧宿主回调0次”“新检查点后领取成功”等明确断言；不能仅看进程退出码或把JSON存在当作通过。

## 8. 新包与同SHA验收

本轮不生成新包；下一轮在前述本地检查通过后使用全新ID，例如`20261105-host-revive-v3-debug-01 / web-release-01 / tap-release-01`。这些只是命名建议，不是已经存在的包。先检查目录不存在，每次构建独立ID，旧ZIP继续保留用于复现。

执行现有tools/build_cupauto_web.py、build_taptap_minigame.py及verify_optimized_assets.py；具体参数以工具帮助和项目tools/README为准。正式广告仍无真实ID时保持关闭，不以Mock联调包充正式包。

一份发布清单记录：sourceCommit、是否有未提交源码及差异摘要、三种buildId、引擎/扩展/转换器版本、artifactVersion、save/rules版本、广告策略开关、ZIP字节数/SHA256、资源校验、实际已测设备。明确生成一个Tap ZIP；复制交付目录后必须再次校验SHA一致，不改写ZIP再沿用旧SHA。

README、docs22、docs38和CURRENT-CANDIDATE统一从同一份实际清单更新。旧候选标“前轮复现基线，不含bd12b73”，不能先换成并不存在的新路径。每个UI诊断页显示同buildId，区分平台包版本与内部存档appVersion。

上传、配置真实广告位、提审和发布为外部动作，须沿用用户具体授权范围；本轮已做的Git push不是这些动作的授权。未取得对应授权就完成本地可复核候选后停止在外部写入边界。

## 9. Tap自测与原始空屏问题的关闭方式

最小现场资料：实际上传ZIP完整SHA、平台包版本、Android/iOS型号及系统/Tap版本、点击的是平台入口还是游戏内按钮、首条console.error完整堆栈、最近32条阶段记录。没有旧包身份时把旧现场标UNKNOWN，不猜它来自当前本地ZIP。

拿到新候选后，用同SHA测试全新存储、合法旧档、失败/损坏槽、前后台、资源不回调/迟到及低内存。分别核验菜单可操作、杯/HUD出现、教程出口、自动落料、移动杯、晃杯/暂停和再开一局。按第一次失败阶段定位：

- 无BOOT_CONFIG：宿主入口/引擎/配置更早阶段，取原生或转换器错误；不能归罪游戏HUD。
- 停GAME_ART：核对实际Bundle路径/大小写/解码与回调；超时UI必须可操作。
- WORLD_CREATE失败：核对本机已安装版本的物理后端和初始化时序，使用真实异常修，不盲改规则。
- INITIAL_SAVE失败：核对Tap实际存储错误和revision，不清空用户档来掩盖。
- HUD_READY未出现：核对UI层级、临时子树和渲染异常。
- HUD_READY存在但看不到按钮：检查实际节点可见性/相机/遮罩/安全区和截图，日志字段不替代画面。
- FIRST_TICK失败：保留原始物理异常，技术恢复免费，不占广告复活。

没有设备时仍须完成本地截止、错误出口、奖励及Release修复，交付“诊断候选+待设备复测项”。不能把R1整项标PASS；也不能在旧源码包上做真机通过后宣称新代码通过。

## 10. 启动、内存和动画的后续收口

### 10.1 指标口径与测量

旧平台报告“启动慢、部分机型约400MB峰值”仍开放。先取得平台原始报告及失败阈值；本轮访问性能指南中的评测标准链接返回404，没有核实到适用于本游戏的硬阈值，不能编造“平台要求低于某数”。

工程内部暂定观察目标：冷启首次可交互中位数≤5秒/P95≤8秒、游戏稳定进程内存≤200MiB/峰值≤256MiB、20次重开后第20次相对第10次稳定值增长≤10MiB。它们是下一轮可调整的开发目标，**不是Tap认证要求或本次实测结果**；取得实际平台标准后按更严格且明确适用的口径验收。

进程内存、JS堆、GPU纹理、Canvas/Image backing、音频、广告SDK和临时峰值分别记录；MB/MiB沿平台原单位，不把23MiB纹理预算说成整进程占用。脚本启动前的包下载/引擎加载不能靠GameRoot计时推断；用平台报告与应用阶段日志对照。

设备至少覆盖实际失败机型、低档Android、中档Android、支持目标内的iOS。每台冷/热启动分组各10次，记录网络与缓存条件；游戏10分钟、20次重开、一次真实广告前后/晃杯压力另采。Android按Tap调试能力观察，iOS具备条件时用Instruments对应WebContent进程；拿不到设备的数据写NOT_RUN。

### 10.2 按证据优化，保持当前玩法

保留已做的首屏22项、运行69项及71+7派生映射。先测解析/解码/上传纹理/物理初始化/存档各阶段耗时，不先恢复全量预载。

- 检查场景重建时Texture2D、SpriteFrame、ImageAsset引用是否配对；常驻资源每会话一份，失败/取消任务不能额外留纹理。
- EffectsController的猫咪异步加载去重、过期回调、SpriteFrame销毁、render销毁UI与活动特效引用脱节，以及减少动态遵守情况逐项核验；只修实际持有/释放缺口，不改物理逻辑。
- 暂停/广告/菜单转换后清理取消任务、监听、定时器、Tween及世界；20次重开看数量和内存是否回落。
- ASTC只在真实支持且当前ImageAsset→Texture2D路径已改为可用的引擎压缩纹理消费路径后验证收益；不能只勾导入选项便宣称压缩已生效。保留不支持设备的可验证回退。
- 当前画布缓冲收益未被证明，不使用私有引擎字段或弃用开关假称降低DPR。若确有过大缓冲，再用安装版本公开支持方式试验，并验证坐标/清晰度/手机安全区。
- GC不能保证立刻回收，不用循环triggerGC掩盖引用泄漏；每个优化点都与同包同设备曲线比较。

动画细项仍参考docs42现行设计分册；未真正接入的转场/猫咪变化不写完成。仅当它们影响本次可玩性或内存目标时纳入本轮必要修复，余项在最终交付显式列出。

## 11. 交付与停止条件

本地候选条件：原工程与Release裁剪后类型检查通过；合同镜像一致；RV-25及新增奖励/加载/owner用例通过；Web当前源码实际开局并回看截图；71+7、CRC、无Debug/Mock泄漏通过；ZIP与清单一致。

正式关闭R1/性能/广告条件：同SHA真实Tap开局及失败出口可达；原手机晃杯异常有复测与根因处理；真实完成/取消广告与存档结果通过；平台启动/内存复测通过。缺任一关键现场证据则保持BLOCKED，并分清已修代码与NOT_RUN现场。不要为了绿灯删测试、放宽权限、填假广告位或清用户存档。

只追加必要的现有日志/测试结果/同包清单，避免复制整套历史报告、重复进度文件或无关重构。达到本轮验收目标后停止，不扩展新功能。

官方核对（2026-11-05）：[Cocos适配](https://developer.taptap.cn/minigameapidoc/dev/engine/Cocos-Laya-Egret/)（页面未标更新日）、[完整观看回调](https://developer.taptap.cn/minigameapidoc/dev/api/ad/RewardedVideoAd.onClose/)（未标更新日）、[内存优化](https://developer.taptap.cn/minigameapidoc/dev/tutorial/performance/runtime/memory/)（2025-02-25）、[性能测试](https://developer.taptap.cn/minigameapidoc/dev/tutorial/performance/performance-test/)（未标更新日）。以上支持适配/回调和测量方法，不证明本包平台通过；原有七项奖励/物理不变量继续适用。

## 12. 开发执行提示词

```text
请在 D:\Workspace\TapTap\奶茶挤挤 实际执行 docs/45-r1-r4-acceptance-next-design.md，先读AGENTS.md和当前实现。验收基线是bd12b73，已推送到origin/main；不要把旧game.zip当作本commit产物。

按优先级完成：
1. 修Release裁剪删除DiagnosticRing导入的TS2304，保留安全阶段日志，继续剥离Debug/Mock。
2. 真正实现ArtAssets前台累计15秒预算、generation取消和迟到回调保护；补AppRoot到GameRoot完整阶段/诊断出口及独立加载/错误层。当前常量和setter没接线，不能算已完成。保证失败、重试、后台切换不空屏/不开双局/不覆盖旧档。
3. 修retrySettlement每个await后的owner/run/failure/attempt校验；副作用必须在检查之后。无receipt但有新合法检查点时使用最新已核验bundle/revision；读取失败不盲写；已落盘凭证免费幂等应用。保护已提交used1不被旧现场恢复/结算覆盖。
4. 补复活ERROR页“重新观看”及明确结束，未完整观看/加载失败继续冻结同failure。移除每日上限配置必填和误导字段，保留每日审计，不改额外晃杯策略。
5. 正确合并根合同遗漏的复活类型后再同步。保留原111项有效覆盖，仅把RV-25改成已确认正确预期，并补本页H/R/C/B/P案例。已有探针复现了两个R2新缺口，不得忽略。
6. 本地通过后，以新唯一buildId构建Debug/Web Release/Tap，验证71+7派生资源、CRC/哈希及无Debug/Mock泄漏，更新实际候选清单。真实广告ID缺失时保持关闭。
7. 按本页取得同SHA Tap日志、可操作开局、真实广告/存档/后台/晃杯及启动内存证据。没有设备/广告条件则完成不依赖它们的工作，交付诊断候选和精确NOT_RUN项，保持BLOCKED，不能冒称全完成。

不改变Tap顶层isEnded===true才发奖、两广告互斥、同run同分、双槽CAS、旧档保护、每局一次和120tick缓冲。运行源码改动后按风险验证，不引入无关依赖/重构。交付实际根因、改动、命令结果、必要截图、用例状态、包体SHA及未验证项；上传/广告配置/提审/发布按用户具体授权边界执行。
```
