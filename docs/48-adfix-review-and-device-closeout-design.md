# adfix 独立验收与下一轮实施设计

2026-11-07最新：170/0及独立故障恢复探针通过，本轮94baeac3诊断候选已完成本地核验。下一步按[docs49最终交付方案](49-final-delivery-platform-device-plan.md)处理真实平台登录/能力和USB真机。docs47/48中要求用户手工提供adUnitId的方案已被官方MCP自动查询流程替代，不再执行旧提示词索要ID。

日期：2026-11-06。适用源码：`f1c49c0` 加当前未提交修改；本轮保护这些修改，只做验收、故障探针和文档，没有修改游戏实现，没有重新构建、提交推送或执行平台写入。前轮完整约束继续参考 docs47，本文件覆盖其当前结论与下一轮顺序。

## 1. 结论与实际验证

**本轮整改本地验收通过，整体仍 BLOCKED（缺真实广告位与设备/平台条件）。** 原152项回归 + 新增 SR01–SR07 共170项全部通过；额外晃杯"提交成功后回读失败→免费重试持续CAS冲突"已修复（commit成功立即同步revision，retry先回读校验身份并只免费幂等应用差额）；StartupTrace 独立有界 errorSummary 已补；设计校验已按经典模式/延期P3归因修正（经典杯底300/口440 > 最大直径280，P3列入 deferred_stage_fit）。真实两个激励广告位仍 `enabled=false, adUnitId=null`，Tap同SHA开局、真实广告与启动/内存曲线仍 NOT_RUN。本轮新 buildId 候选构建中，完成后更新包体身份；旧 `84a1db3f…4f9b85` 仅作诊断对照。

| 项目 | 独立核验结果 | 说明 |
|---|---|---|
| 原工程 typecheck | PASS | 本轮实际执行，0错误 |
| 合同 / 设计配置镜像 | PASS | 配置哈希仍为 `f10bbd9c5fbb408449a572fb243ec58b645653dd0ca741402e0fc19a477a25f5` |
| 既有回归 + SR01–SR07 | **170 PASS / 0 FAIL** | 本轮复跑，原152项有效断言全部保留，新增18项（SR01×1、SR02×3、SR03×2、SR04×3、SR05×2、SR06×4、SR07×3） |
| 候选资源 | PASS | 复跑既有 optimized verifier：71 art + 7 effect、78资源、CRC/派生哈希通过 |
| 包体身份 | 待新包 | 上一轮 3,030,025字节 / SHA `84a1db3f…4f9b85` 仍为诊断对照；本轮新 buildId 构建中，完成后更新 |
| 构建输入身份 | PASS | 候选 source-manifest 的313项与当前原工程逐项哈希一致；不是只核对commit标签 |
| Release裁剪修复 | 本地证据通过 | 精确独立clear语句集合；两个新增clear归属returnToMenuFromError；原Web/Tap构建日志成功，本轮不重复消耗Creator构建 |
| SDK原问题 | 本地合同测试通过 | 独立off、最多一次destroy、部分失败回滚、重复/晚到close隔离；**不等于真实SDK测试通过** |
| 首屏设置 / 游戏交互 | 独立浏览器PASS | 390×844实际点击；菜单22资源，首屏设置滑块可见；开局、落料、拖杯、晃杯、暂停通过 |
| 续局 | 独立浏览器PASS | 同run、score=30、tick=285、baseUsed=1、cupOffset约105.77，刷新后保持；恢复后安全暂停 |
| 错误页与render失败 | 独立注入PASS | 错误→返回菜单overlay=false且overlayButtons=[]→新局PLAYING；renderUnsafe抛错无外泄且独立overlay=true |
| 控制台 | favicon 404 | 本轮浏览器仅发现favicon缺失，无新增游戏脚本异常；可低优先级补图标或data favicon |
| 额外晃杯提交后回读失败 | **PASS（SR01–SR07）** | commit成功立即同步revision；retry先回读校验receipt/run/attempt，已提交只免费幂等应用差额，不重看/不重CAS/不扣配额；跨run凭证不发奖 |
| StartupTrace错误摘要 | PASS | `errorSummary` 独立有界字段，不被 `code` 覆盖；支持 Error/字符串/对象/null，环32条、有限stack |
| 设计校验 | PASS（P3 延期） | 经典杯底300/口440 > 最大直径280；P3 四阶段列入 deferred_stage_fit，不作为当前硬失败 |
| 真实广告 / Tap宿主 / 启动和内存 | **NOT_RUN** | 两个广告位仍 disabled/null，未造ID、未用Mock；Tap同SHA开局/真实广告/启动内存缺设备与平台条件 |

本轮浏览器、故障探针和截图在 `evidence/Acceptance/20261106-adfix-independent-review/`。其中 `shake-readback-probe.cjs` 动态注入故障到原runner的独立执行副本，不改原断言；该探针输出中的152/0仍只是原断言计数，**新增故障结果另在 shake-readback-result.json，结果为FAIL**。

## 2. 当前候选身份与可用范围

- buildId：`20261106-adfix2-tap-candidate-01`（本轮新唯一 buildId）。
- 路径：`build-artifacts/cocos-taptap-minigame-build/20261106-adfix2-tap-candidate-01/TapBuild/game.zip`。
- SHA256：`94baeac3409b4109d397f922db095e6b0df6d6e639a1b826f38fdd5ee231bc89`。
- 大小：3,030,312 字节（解压 5,182,543 字节，398 文件 / 77 PNG）。
- 状态：`LOCAL_CONVERSION_PASS_NOT_HOST_VALIDATED`，`runtimeVerified=false`。
- 资源校验：`verify_optimized_assets.py` PASS；`artMappings=71`、`effectMappings=7`、`packageAssetsPresent=78`、ZIP CRC 通过、派生资源哈希全部命中、无 source map、无 `__P1B_*`/Fake/Mock 调试 API；RGBA 由 60,251,896 降至 24,119,392（构建期派生，原稿未改）。
- 构建输入：`originalSourceChanges=[]`，源码 manifest 与原工程一致；release-assets/release-code/typecheck 均 exit 0。
- 两广告策略：`enabled=false, adUnitId=null`。候选只验证了广告关闭配置下的本地路径，不能证明玩家能够观看真实视频获得奖励。
- 旧 `20261106-adfix-tap-candidate-01`（SHA `84a1db3f…4f9b85`，3,030,025 字节）保留作诊断对照，不代表本轮通过。

当前网页服务8124属于前轮保留，本轮只关闭自己的Playwright浏览器；未停止用户已有服务。后续无需为读档故障重复构建旧源码，先修逻辑和回归。

## 3. P0：额外晃杯“已提交但回读失败”免费恢复

### 3.1 根因与影响

`RewardedShakeService.settle()` 在 `commitBundle()`成功后，先readBundle再调用host.onRewardedShakeCommitted。读失败时宿主仍持旧bundle/revision；`retrySettlement()`直接再次settle，没有先回读已提交receipt。于是每次都用旧revision尝试再次提交，持续CAS冲突。玩家已经完整观看，磁盘已有合法奖励，却领不到次数。

这是与前轮复活R2相似的故障，不能因当前广告关闭就忽略；开启真实广告前必须关闭。本轮复现show调用1次、磁盘receipt1条、首次ERROR后连续两次免费重试仍extra=0。

### 3.2 最小实施方案

涉及 `application/RewardedShakeService.ts`；必要时调整host恢复接口及GameRoot，无须改存档schema。

1. 保存pending前捕获 `{owner,generation,runId,attemptId}`；全过程统一验证归属。commit成功立即确认该代仍拥有同run，再用已提交next及返回revision更新宿主，**不让后续回读失败阻塞revision同步**。
2. 回读作为完整性校验保留；失败转ERROR，明确“已保存，可免费重试”，保留可信completion及attempt身份，禁止进入重新观看路径。
3. retrySettlement先读最新有效信封，再核对owner/generation/run。检查receipt的attemptId/runId/rewardKind/amount、run身份、已提交extraGranted总量及消费计数约束。
4. 已提交且一致：同步最新信封的revision，然后仅把持久化总量与实时引擎的**正差额**应用；不再CAS grant，不追加receipt，不重新消费每日/单局配额，不展示视频。应用失败继续免费恢复，成功才GRANTED。
5. 无receipt：仅在当前可信完成attempt与待结算pending仍匹配时，用最新revision继续原子settle；身份不符、run切换或记录冲突则安全停在可操作错误，不能用旧bundle覆盖新局。
6. 使用**所采用信封本身**的revision。当前readback采用新payload却回调committed.data.revision，若期间revision已前进，会造成payload/revision不配对；须同步纠正。
7. bind后的已提交额度补齐失败，也应有可达的免费恢复入口。当前分支仅ERROR/retrySettle=false及“重新进入”文案，避免用户只能退出或误以为需要重看。按同一可信恢复路径解决，不增加另一套奖励来源。
8. 清理/放弃已确认奖励不得擦掉已提交receipt或再次扣配额；返回游戏也不能让下一次自动保存用旧used/granted覆盖新权益。

不得削弱“顶层isEnded===true才奖励”、双广告互斥、每次最多+1以及现有额外晃杯5次配额。复活保持每局1次、无新增每日上限、同run同分和120tick缓冲。

### 3.3 必要测试

| ID | 场景 | 断言 |
|---|---|---|
| SR01 | reward commit成功，紧接readback失败一次 | 宿主revision等于已提交revision；ERROR有免费恢复，不误称GRANTED |
| SR02 | SR01后点击重试两次 | 首次有效重试到账1次，第二次幂等；show=1、receipt=1、dailyGranted仅+1 |
| SR03 | commit成功、apply失败一次再试 | 不重看；extraUsed不变；恢复后总量正确，GRANTED仅在成功后 |
| SR04 | 重试读档期间换owner或run | 旧owner零回调、不向新run补发；当前owner通过自己的恢复入口对账 |
| SR05 | 回读信封revision高于commit结果 | 宿主采用新payload时同时采用新revision，下一次合法保存不持续CAS冲突 |
| SR06 | receipt缺失/类型或run不符/存储不可读 | 不伪造奖励、不覆盖旧档；有明确可重试/退出入口，不能无限自动重试 |
| SR07 | 已提交总量3，实时1且extraUsed=1 | 只补差额2，重复bind/重试不多补、不恢复已消耗次数 |

将本轮故障注入并入既有runner，保留原152条有效断言；新增数以实际输出为准。不使用诊断副本的“152/0”掩盖新增失败。

**本轮执行结果：SR01–SR07 全部 PASS，合计 170/170。** 实现要点：`settle()` 在 commit 成功后立即用已提交 envelope 与 revision 同步宿主，readback 失败只置 ERROR+retrySettle 不再回退 revision；`retrySettlement()` 先回读最新信封、校验 receipt 身份（runId/attemptId/rewardKind/amount）与 run 身份，已提交奖励只免费应用正差额（不重看、不追加 receipt、不重扣配额），并采用回读信封自身的 revision；bind 恢复 apply 失败同样暴露免费 retry。SR04 验证重试读档期间换 owner 时旧 owner 零回调、新 owner 通过自己的恢复入口对账；SR05 验证 readback revision 高于 commit 结果时宿主采用新 revision、下次保存无 CAS；SR07 验证已提交总量3/实时1/已用1 时只补差额2且幂等。

## 4. P1：宿主空屏所需诊断与恢复闭环

本轮Web证明错误层可操作，不能证明Tap原始空屏已修。保持当前独立overlay与scope分段预算，不重复改已通过逻辑。

`core/StartupTrace.ts` 已增加独立且有界的 `errorSummary` 字段；`code` 保持机器错误码，`errorSummary` 保存 Error.message 或非 Error 摘要（支持 Error/字符串/对象/null），`stack` 保留有限帧。原“code 存在时覆盖 detail.error”的问题已修复——`stage()` 现在独立写入 `errorSummary`，不再被 `code` 覆盖。环32条、每字段长度限制、仅失败时生成摘要，不引入常驻大日志或隐私数据。

测试：同时有code+Error、code+字符串、无stack对象、空值、读取摘要自身抛错；不能影响启动。Release裁剪后仍保留必要失败诊断；禁止发布console对象整包、无限stack或逐帧日志。

Tap现场按同SHA记录：设备型号/系统/Tap版本、全新或旧存储、从启动到背景停留的录像、最后成功阶段、首条失败摘要/stack、资源ID和buildId。看到背景但无杯/HUD时，区分BOOT/GAME_ART/HUD/render/输入层失败，按首错处理，不能仅增加15秒超时、把实际前台阻塞clamp掉或将其命名“设备负载”后结束排查。

必须在同一候选完成：冷启、旧档继续、首次教学、设置返回、后台切换、资源失败/低内存、晃杯及错误返回菜单。杯子+HUD+落料+可点按钮同时存在才通过。

## 5. P1：真实两个激励广告点交付

### 5.1 配置与授权边界

当前关闭状态符合“不造ID”的要求，但功能仍未交付。先读实际Loader与授权配置来源：额外晃杯根 `config/rewarded-ad-policy.json` 及工程资源镜像，复活 `奶茶挤挤/assets/resources/config/spill-revive-policy.json`。确认与当前小游戏应用匹配的有效广告位。缺少时需要提供**两处placement对应的有效adUnitId，或平台确认允许共用的位**；不要误把应用ID当广告位ID。

广告位ID是客户端配置，不是服务器密钥；仍不在日志打印认证信息。用户确认具体本地配置后再开启；创建/修改后台广告位、上传测试、提审发布是各自外部动作，按具体授权执行，不把本地构建授权扩展为发布授权。没有现场条件时保持NOT_RUN，不编造SDK回包。

### 5.2 必须可达的产品流程

- **额外晃杯**：用完2次免费额度→点击晃杯→说明完整观看+1次→用户同意→真实视频→可信完成且落盘/应用成功→额度+1→用户继续后自行使用。拒绝/提前关闭/加载失败不增加次数，可退出或重试。
- **洒出复活**：真实物理SPILLED，符合首次体验等资格且本局used=0→立即冻结失败快照→显示保留分数、每局1次、清理危险区的说明→看视频继续或结束本局→完整完成后同run同分、used=1、安全清理，用户继续后120tick缓冲；再次洒出不得第二次复活。
- 技术故障免费恢复；不以错误页、物理异常或无效存档作为广告入口。未看完保留用户主动重试/结束选择，不提前SETTLING。
- UI使用“完整观看”，**不本地倒计时30秒发奖**。真实片长由平台决定，只有顶层onClose.isEnded===true发奖；show Promise resolve不能替代。
- SDK provider=tap、simulated=false、两个placement互斥；成功/取消/失败后恢复输入、前后台与音频，不重复实例/发奖。掉close回调不得无限锁死，也不得根据超时补奖；先证明旧原生展示已结束或销毁再允许下一次。
- 首次体验保护沿用docs47的核对要求。无限模式“一局”等于“一关”的平台口径仍需确认；不为让按钮出现而强改firstNaturalRunCompleted或关闭保护。

2026-11-06重新核对官方[onClose](https://developer.taptap.cn/minigameapidoc/dev/api/ad/RewardedVideoAd.onClose/)的isEnded语义及[destroy](https://developer.taptap.cn/minigameapidoc/dev/api/ad/RewardedVideoAd.destroy/)释放资源语义，页面未标注SDK版本。其余接口及运营规范入口见docs47第5节；实际联调时按当日官方文档复核。

### 5.3 真机广告测试矩阵

每个广告点分别执行完整观看、提前关、加载失败、展示失败、后台返回、重复点击、断网；记录奖励前后、runId、score、额度/used、receipt数及revision。重复/晚到close可用本地接口故障探针补充，标明注入而非声称真实SDK主动产生重复事件。

跨场景追加：晃杯视频正在展示时洒出入口不能另开视频；复活后同局再次洒出；同日第四局首次复活；广告完整后存档回读失败；发奖后立即杀进程重启。真实联调至少覆盖一次完整成功、取消和不可用，不能只测Mock，不能把一次成功推及所有异常。

## 6. 设计校验的准确归因与处理

实际失败位置为 `tools/validate_design.py:158`：`bottom_width_du * stages[-1].cup_width_scale > 2 * maxRadius`；脚本没有输出前轮所写的“经典杯口”信息，而是直接AssertionError。

| 阶段 | phase | 杯底 / 杯口 DU | 对比最大直径280 DU |
|---|---|---|---|
| classic | P1 | 300 / 440 | 杯底可容纳 |
| coconut_green | P3 | 285 / 418 | 杯底可容纳，余量较小 |
| taro_boba | P3 | 270 / 396 | 杯底不能容纳 |
| brown_sugar | P3 | 255 / 374 | 杯底不能容纳 |
| mochi_special | P3 | 240 / 352 | 杯底不能容纳 |

当前RunEngine新局固定classic，其他四款仍延期，ConfigLoader也对classic执行最高级杯底容纳校验。因此该断言失败**不是已证明当前经典杯会启动失败**；未来更窄杯能否容纳最大球须结合斜壁、落位和生成规则设计，不能简单认为直径大于底宽就永远无合法落位。

最小处理：不为旧全量策划校验改宽用户已确认的经典杯，也不擅自改九级小料/存档哈希。给校验工具输出实际stage、宽度、直径及当前/延期范围；区分当前实现门禁与未来设计待定，完整报告仍列出未解决项。保留有效断言，不能把所有断言换成warning或删除。工具中的旧“尚未实现”、prototype_ads必须false等策划假设也应按实际调用范围核对，避免广告开启后错误判定所有实现不合格。

**本轮已修正：** `tools/validate_design.py` 现在只对 `stages[0]`（当前 classic）执行杯底容纳硬校验，`stages[1:]`（P3 四阶段）列入 `deferred_stage_fit` 报告而非 errors；输出新增 `classic_cup_bottom_du=300`、`max_ingredient_diameter_du=280`、`deferred_stage_fit[...]`。本轮 `validate_design.py` 结果 `errors=[]`，未改经典杯尺寸、未改九级小料、未启用 P3。

未来P3另立任务比较缩小高级小料、调整阶段形状或限定配方，完成物理验证和旧档策略后再启用；本轮不实施新阶段。

## 7. 启动、400MB峰值与小包验收方案

复用docs47第7节，不追加无数据的重压缩。当前约2.89MiB ZIP已经很小；优先检查原生广告实例、纹理/图片解码重复持有、动画缓存和场景释放，不能将“所有资源都预载入”换成启动稳定。

1. 本地保持菜单分阶段加载、游戏按需加载、效果单份缓存；核对返回菜单/循环开局时引用有界。资源释放按Creator实际引用关系，避免直接destroy共享SpriteFrame导致黑图。原稿保留，优化只在隔离派生副本。
2. 顺序构建、最多一个Creator实例，按需打开一个测试浏览器；不要为省ZIP几个KB新增大型压缩依赖或同时保存原图/派生全套到运行包。
3. 至少平台此前失败机型及一台常规机，记录系统/Tap/内存/网络/冷或热缓存、广告开启状态、SHA。冷启/热启各至少5次，报告单次和中位/最大值，不拿5次样本宣称稳定P95。启动拆菜单可交互与开始后游戏可操作两个时段，以平台实测口径为准。
4. 采样冷启→菜单→开局→5分钟→满杯晃杯→视频峰值→关闭30秒→返回菜单，重复开局/广告10轮。采集平台可提供的进程/原生/GPU/JS指标并说明缺失项，不只报JS heap；记录OOM、卡死及平台拒绝原因。
5. 同设备同口径对比旧约400MB峰值；修复实例数量随轮次增长的问题，再定位纹理/Canvas/视频解码占用。平台拒绝项必须实际重测通过，不自创某个MB审核阈值。
6. 同画质下以当前3,030,025字节为内部ZIP比较基线，列出增长原因；必要的诊断/修复允许合理增长。小包、贴图RGBA估算、构建成功均不能作为真机内存合格证明。

没有设备/平台数据时输出NOT_RUN及具体采集步骤，不继续盲改物理参数、反复压图或称性能优化完成。

## 8. 执行顺序、最终包和完成标准

1. **[完成]** 实施第3节，新增SR01–SR07（共18项），原152项有效断言全部保留；`verify_rewarded_shake.cjs` 实跑 **170 PASS / 0 FAIL**；原工程 typecheck 0 错误。
2. **[完成]** 补第4节有界 `errorSummary`，`stage()` 独立写入不被 `code` 覆盖；支持 Error/字符串/对象/null，环32条、有限 stack。
3. **[完成]** 修正第6节校验归因：`validate_design.py` 仅对 classic(stages[0]) 硬校验，P3 列入 `deferred_stage_fit`；`errors=[]`，未改经典杯/小料尺寸，未启用 P3。
4. **[完成]** 本地门禁通过后新唯一 buildId `20261106-adfix2-tap-candidate-01` 构建 Tap 候选；一个 Creator 顺序构建，release-assets/code/typecheck 均 exit 0。旧 `84a1db3f…4f9b85` 保留作诊断对照。
5. **[完成]** 运行 `verify_optimized_assets.py`：`artMappings=71`、`effectMappings=7`、`packageAssetsPresent=78`、CRC/派生哈希通过、无 source map、无 `__P1B_*`/Fake/Mock；源码 manifest `originalSourceChanges=[]`，合同/配置镜像 `sync_client_contracts --check`、`sync_design_config --check` 通过。
6. **[NOT_RUN]** 两个广告位仍 `enabled=false, adUnitId=null`，缺真实 adUnitId 与设备/平台条件，未执行 Tap 同 SHA 开局、真实广告和启动内存复测；不造 ID、不用 Mock 冒充。
7. **[当前状态]** 无真实广告位/无设备时，已完成全部本地授权工作，交付诊断候选 `94baeac3…`、缺口清单见本节；整体保持 BLOCKED，不晋升最终包。

最终交付：修复说明；实际测试断言数/结果；Web交互证据；真实广告收益前后与同run续玩证据；启动与内存原始记录；当前包绝对路径/大小/SHA；未完成项及原因。当前文档和候选入口必须一致。提交、推送、线上广告修改、上传、提审发布均按用户对具体动作的授权，不隐含执行。

## 9. 给开发 Agent 的完整提示词

```text
请在 D:\Workspace\TapTap\奶茶挤挤 继续修复、验证并准备最终Tap小游戏包。先读适用AGENTS.md、README、docs22、docs48-adfix-review-and-device-closeout-design.md及docs47业务约束，按任务读取项目taptap-release-readiness和官方TapTap Skills。保护所有未提交修改，不回退本轮已通过的修复。

当前实际事实：原152项回归通过；Web正常交互、错误返回菜单/render失败兜底已独立通过；Tap诊断包84a1db3fe6bdbc6d8ff8907ee013477196002f15591a7f7715e174e4044f9b85为3,030,025字节且资源/CRC通过，但两个广告位disabled/null、Tap开局与400MB峰值仍未实测。不要重新宣布这些已交付。

第一优先修RewardedShakeService的提交后回读失败：本轮探针已复现磁盘revision3、内存2，receipt存在但连续免费重试仍CAS失败、extra=0。commit成功同步revision；retry先回读并校验receipt/run/attempt与额度总量，已提交只免费幂等应用，不重看、不重复CAS发奖、不重复扣配额；绑定恢复失败也提供免费重试。payload与其信封revision必须配对，所有await守住owner/generation/run。把docs48 SR01–SR07纳入既有runner，保留原152项有效断言，不弱化测试或用手工修fixture状态代替生产恢复。

补StartupTrace独立有界errorSummary，修code覆盖具体错误的问题，保留32条环与有限stack。保持已通过的scope计时/令牌、错误层和真实物理，不做无关重构。修正validate_design归因：实际是P3最窄杯底240小于最大直径280，经典杯底300/杯口440正常；分清当前/延期校验，保留有效规则，不擅自改宽经典杯、改小料或启用P3。

按docs48完成两个真实自愿广告点：免费2次耗尽后完整观看+1次；真实洒出后完整观看同局同分复活、每局最多一次、无新增每日复活上限、120tick缓冲。仅顶层onClose.isEnded===true奖励，不能本地30秒或show.resolve发奖；取消/失败可重试或显式结束，技术异常免费恢复。查授权配置来源，缺有效adUnitId明确报告，不造ID、不用Mock冒充完成、不擅自改线上广告。

按文档依次完成逻辑回归、Web真实操作、新唯一buildId的Release与Tap候选、71art+7effect/CRC/派生哈希和无Debug/Mock/source map校验。一个Creator顺序构建，派生资源优化不改原稿。优先修原生广告/纹理生命周期，按平台失败机型与同口径采集启动和内存曲线、10轮广告/开局循环；不能用3MB ZIP或JS heap证明400MB已解决。

同SHA完成Tap开局、真实两广告成功/取消/失败、旧档/后台/物理压力和平台启动内存复测后才晋升最终包。缺现场条件则完成全部本地工作、交付诊断包和NOT_RUN清单，整体保持BLOCKED。更新docs48、docs22、README及唯一候选入口，报告实际修复、断言结果、包绝对路径/字节/SHA和剩余缺口。未经具体授权不提交推送、不上传、不改后台、不提审发布。
```
