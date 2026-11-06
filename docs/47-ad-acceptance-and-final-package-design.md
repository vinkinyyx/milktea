# A–E 整改验收、真实激励广告与最终小包设计

最新独立复核见[docs48](48-adfix-review-and-device-closeout-design.md)：原152项通过、Web与候选包核验通过，但新增额外晃杯提交后回读失败阻断；下方本轮总结不覆盖该新故障。下一轮执行docs48第9节提示词。

核验日期：2026-11-06。核验源码基线：`f1c49c0` + 本轮未提交整改。目标为 Creator 3.8.8 + Tap 扩展 1.2.2 的 **Tap 小游戏**，不走 H5 托管/APK。本轮未上传、未修改线上广告配置、未提审、未发布。

## 1. 验收结论

**本轮已完成本地修复、回归、Web 实操与 Tap 诊断候选打包；整体仍 BLOCKED。** 文档中的本地阻断（裁剪计数、R2c 夹具、异步清理归属、已提交奖励假成功、SDK 生命周期）均已修复并有回归证据。两个真实广告位仍为 `enabled=false` / `adUnitId=null`，Tap 宿主同 SHA 开局、真实广告与启动/内存实测为 NOT_RUN，因此候选不得晋升最终包，也不得宣称真实广告或性能通过。

| 检查 | 本轮真实结果 | 证据与边界 |
|---|---|---|
| 原工程 TypeScript | PASS（0 错误） | `npm run typecheck --prefix 奶茶挤挤` |
| 合同、设计配置镜像 | PASS | `sync_client_contracts.py --check`、`sync_design_config.py --check` |
| 71 张现用美术静态完整性 | PASS | `npm run verify:art`，0 errors；不证明手机渲染 |
| 广告/奖励回归 | **PASS，152 checks / 0 failed** | `node tools/verify_rewarded_shake.cjs`；原 126 项有效断言保留，新增 OW02/OW03 等 |
| Release 裁剪 | PASS（精确 48 节点） | `release-code-staging.json` 的 `exactNodeEdits:48`；Web/Tap 两次 `release-codeExitCode=0` |
| R2c 夹具 | PASS | 同 run 换 owner 与新 run 两场景分离，各自独立计数与 revision |
| 两个 clearStalePending 归属 | PASS | 回读最新信封→身份校验→新鲜 revision CAS→复核 owner/generation/run；OW02/OW03 |
| 已提交复活 apply=false | PASS | RC01-a ERROR 非 GRANTED；RC01-b 免费重试成功且不再看广告 |
| 额外晃杯已提交总量 | PASS | RC02-a 恢复总量 3、RC02-b 重复 bind 不多补、`extraUsed` 保留 |
| SDK 完成判据 | PASS | 顶层 `onClose({isEnded:true})` 才发奖；AD05-a~e 覆盖 off 抛错/缺接口/注册中断/重复 dispose/晚到 close |
| Web Release 构建与实操 | PASS（候选） | buildId `20261106-adfix-web-release-01`，`WEB_CANDIDATE_BUILD_PASS`，`sourceMapCount=0`；真实浏览器完成菜单/教程/开局/落料/拖杯/暂停/两次晃杯/耗尽/结算/刷新续局/坏档回退 |
| Tap 候选包 | PASS（仅本地转换） | `20261106-adfix-tap-candidate-01`；71 art + 7 effect、78 派生资源命中、ZIP CRC、无 source map、无调试 API |
| 真实激励广告（两个点） | **NOT_RUN / 未交付** | 无真实广告位（`adUnitId=null`）；未造 ID、未用 Mock 冒充 |
| Tap 宿主开局、真实两广告、启动/内存 | **NOT_RUN** | 缺 Tap 宿主现场；不能用 3.0MB ZIP 或 JS 堆证明约 400MB 峰值 |
| `validate_design.py` | FAIL（既有基线，归因已更正） | 实际P3最窄杯底240<最大直径280；经典杯底300/口440，不是经典杯口不足；见docs48第6节 |

### 1.1 问题复现基线（修复前，历史）

以下为修复前 `20261106-ae-ad-review` 的复现结果，保留作缺陷证据，不代表当前状态：

| 检查 | 修复前结果 | 证据 |
|---|---|---|
| 原始广告回归 | 125 PASS / 1 FAIL，共126项 | `regression.log` |
| R2c 失败定位 | 测试夹具混淆新旧宿主 | 复用回调计数 + 旧 snapshot 覆盖 runId |
| 异步清理宿主归属 | FAIL | `DIAG superseded-owner commit true` |
| 已提交复活应用失败 | FAIL | `phase=GRANTED, usedThisRun=0` |
| SDK 异常释放 | FAIL | offLoad 抛错后 destroy=0；展示中 dispose 导致 destroy=2 |
| 新 Web Release 构建 | FAIL | `expected46 / found48`，Creator 前失败 |


## 2. 不可回退的业务与技术条件

- 杯子窄版、自动落料、按住杯子跟手移动、真实动态碰撞与同级合成保留；不得恢复小料随杯节点平移、单列固定堆叠等假物理。
- 免费晃杯额度为 2；用完后自愿完整观看激励视频，额外增加 1 次，不直接扣成已使用。现有额外晃杯单局/每日配额保持原策略，本轮不扩大或缩减。
- 晃杯或移杯造成实际洒出，符合资格时提供自愿复活。成功复活每局最多 1 次，保留 runId、分数和已合法获得的奖励；**复活不增加每日上限**。取消、加载失败、未看完不消耗成功次数。
- 物理异常、资源故障、存档故障不是洒出失败，不得拿广告交换错误恢复。
- SDK 顶层 `onClose({isEnded:true})` 才是完整观看凭据；双广告互斥、事件去重、原子双槽 CAS、可信 receipt 恢复、旧档保护、120 tick 复活落料缓冲继续保留。
- 广告时暂停物理、自动落料、输入及相关计时；hide/show 不误计前台。保存失败不能宣称发奖成功，已提交奖励恢复不得要求重看。

## 3. P0：构建脚本与回归夹具修复

### 3.1 Release 裁剪漂移

文件：`tools/strip_p1c_release_debug.cjs`，GameRoot 第二个 AST 裁剪规则。

先对当前原始 GameRoot 只读列出所有匹配节点：类型、行号、短文本，比较 f1c49c0 与上个可构建版本。明确新增两处为何匹配，排查过宽的 if/then 文本匹配是否会把必要错误恢复或启动诊断一起删除。**不能直接把46改48、放开断言或跳过裁剪来制造成功。**

确认节点均为应删探针后，更新精确集合/计数和说明；若误匹配则收紧到节点语义与归属方法。保留播放器必要的有限启动故障日志，移除 Mock、fixture 和大容量逐帧调试收集。裁剪只作用于新隔离镜像；源工程及原稿不动。

验证：原工程 tsc → 裁剪清单/前后哈希 → 隔离工程 tsc → Web Release。故意增加一个未知匹配时仍应明确失败。检查 Release 不包含 FakeRewardedAdProvider、debug-mock、PhysicsLab、ArtGallery、测试全局、source map；不得误删 BOOT_CONFIG 到 MENU_READY 的必要诊断。

### 3.2 R2c 正确区分调用者

原 `tools/verify_rewarded_shake.cjs` 的 R2c 中，为 A/B 宿主分别创建独立回调、计数器和 bundle/revision；区分“同 run 换 owner”与“切换新 run”两个场景。新 run 使用合法 UUID，构造后断言 snapshot.runId 真正变化，不能把旧 snapshot 当新局。

保留原“过期 owner 零回调”的有效断言，同时断言 B 的合法恢复可更新 B。修正夹具后原 126 项必须全部执行，必要新增以下故障断言；既有有效用例不得删除。测试总数以实际 runner 输出为准。

## 4. P0：奖励交接与免费恢复

### 4.1 两类 clearStalePending 必须有归属与结算门禁

涉及 `application/SpillReviveService.ts`、`RewardedShakeService.ts`。

当前 `void clearStalePending(host)` 在 await commit 后直接通知传入 owner，没有 generation 校验；尚未落盘就解除阻断，也可能让 watch 与清理竞争 CAS。两个服务均须修复，不只修复活。

最小设计：

1. 捕获 owner、generation、runId、pendingAttemptId、期望 revision。进入短暂的“恢复处理中”状态，先完成清理/重新读档，再允许新 watch；该状态不占用成功配额，不需要新增永久存档 schema。
2. 清理前重新确认目标 pending 仍是原记录，保留全部 receipt 和 run 状态；通过既有 CAS 提交。
3. 每个 await 后先核对 owner+generation+run；过期结果不回调旧 owner，不触碰新 owner 的 busy/phase/modal，不从旧 bundle 覆盖新局。
4. 提交若已成功但 owner 失效，磁盘 revision 变化是事实；当前 owner 下一次操作先回读/同步，不拿旧 revision 发起奖励写入。不得“跳过回调”后又让当前 owner 永远 CAS 冲突。
5. CAS 冲突走有限回读，若新 pending/新奖励存在则保留；仓库异常捕获并展示可重试错误。禁止 fire-and-forget 未处理 rejection、无限自动重试或清掉新 pending。
6. 无 pending 的正常 bind 不做额外落盘；重复 bind 不并发清同一条。沿用当前服务模式，避免另起通用事务框架。

### 4.2 真实应用成功才显示 GRANTED

当前复活 bind 找到同 run receipt 后即置 GRANTED，即使 apply=false；GameRoot 优先根据 phase 显示“复活成功”，吞掉失败语义。

恢复流程必须核对当前 run、已提交 receipt 身份及持久化 used/committedReceiptId 一致；正确已应用则幂等成功；尚未应用则从可信的已提交结果免费恢复。应用失败保留 receipt，进入 ERROR + 免费恢复入口，明确“权益已保存，恢复未完成”，不展示继续成功、不再索取广告、不再次消费配额。复验成功后才 GRANTED。

额外晃杯也不能只找任意一条历史 receipt 就认为整个 run 已同步：比较已提交 extraGranted 与当前值，按已持久化的总量恢复，防止多次权益只补 1 或重复 bind 多补；不能把已消费次数变成免费次数。失败要能由调用方检测并回读，不以 void 调用冒充应用成功。

状态顺序：`OFFER → PREPARING → SHOWING → SETTLING → GRANTED → 安全暂停 → 用户继续`。取消/未看完/加载失败转可操作错误，洒出 pendingFailure 继续冻结，用户可重试或显式结束；不自动 SETTLING。持久化成功、内存应用失败是“免费领取重试”，与“重新观看”分开。

## 5. P0：两个真实广告点与 SDK 生命周期

### 5.1 配置与可达性

当前额外晃杯策略在 `config/rewarded-ad-policy.json`，复活策略在 `奶茶挤挤/assets/resources/config/spill-revive-policy.json`；以实际 Loader 的来源为准核对镜像和打包结果。两者均 `enabled=false, adUnitId=null`。先读仓库及被授权平台配置，仍缺失再索取对应应用的有效广告位，不编造 ID、不提交密钥、不自动修改线上配置。

本地准备广告关闭诊断版与真实广告候选；配置开启会改变包内容，必须用不同唯一 buildId/SHA。真实位有效后确认 providerName=tap、simulated=false、capability=SUPPORTED。若 SDK/广告位不可用，展示诚实原因和可用退出动作，不给假奖励或让用户无限等待。

**额外晃杯入口**：2次免费耗尽 → 点击晃杯 → 自愿收益说明“完整观看，增加1次晃杯” → 看视频/返回 → 完成且落盘 → 次数增加1 → 用户继续后使用。不得耗尽即自动强播。

**洒出复活入口**：真实 SPILLED → 冻结完整失败快照 → 显示当前分数、本局剩余1次及“完整观看视频，保留分数继续” → 看视频继续/结束本局。成功后安全清掉已洒出和需要清理的危险小料，按既有 clearanceDu 规则保留合法杯内物品，保护物理完整性；120tick 缓冲在用户继续后的实际游戏 tick 消耗，不在广告/暂停时耗尽。同 run 再次洒出正常结算，不再 offer。

“看满30秒”按用户完整观看的业务意图实现：**不创建本地30秒发奖计时器**。实际片长由平台素材决定，只有官方完整结束回调发奖；UI 不承诺不可控制的固定30秒。若必须采购固定30秒素材，需要平台侧确认，不能客户端伪造时长。

首次体验保护：当前代码用 firstNaturalRunCompleted 判断门槛，已完成首局的老用户不会每次重等60秒。对“无限模式一局是否对应平台一关”、首局很短和首次启动记录的口径须核对平台要求，记录场景与结论；**本轮不把未确认映射写为合规通过，也不擅自关闭保护**。不能仅为出现广告而强行标记教学/首局完成。

### 5.2 最小 SDK 资源修复

文件：`platform/TapRewardedAdProvider.ts`。继续使用官方 `tap.createRewardedVideoAd({adUnitId,multiton:true})`，不增加另一套广告 SDK。

- 每个 InstanceState 增加明确的 detached/closed 标识；第一次关闭就置位。onLoad/onError/onClose 的旧回调忽略已关闭实例，既有 pending 仅结算一次。
- 每一个 offLoad/offError/offClose 独立 try，destroy 在保证执行的清理路径；一个失败不阻止其余释放。每实例 destroy 最多调用一次，重复 dispose、finish+dispose 都幂等。
- 创建后必需接口校验失败、注册到一半抛错时，也清理已创建实例及已注册 listener。保留同一函数引用配对 off；避免旧回调解绑新实例。
- 清掉 load 超时 timer 和内存引用；load/show 的 reject、同步 throw、重复 close、晚到 close 都不能双发奖或遗留互斥锁。
- show Promise resolve 仅代表展示调用完成，不能发奖。若宿主丢失 close/error 回调，在恢复前台时提供有界诊断与安全退出/重新核对机制，不根据墙钟补奖；不能用固定展示超时在正在正常播放时销毁视频。重试先确认旧展示已结束/销毁并释放协调器，不能同时开两个。

官方文档核对于2026-11-06，以下接口页未标注版本时不推断 SDK 版本：

- [createRewardedVideoAd](https://developer.taptap.cn/minigameapidoc/dev/api/ad/tap.createRewardedVideoAd/)、[load](https://developer.taptap.cn/minigameapidoc/dev/api/ad/RewardedVideoAd.load/)、[show](https://developer.taptap.cn/minigameapidoc/dev/api/ad/RewardedVideoAd.show/)。
- [onClose 完整观看判据](https://developer.taptap.cn/minigameapidoc/dev/api/ad/RewardedVideoAd.onClose/)、[offClose 配对解绑](https://developer.taptap.cn/minigameapidoc/dev/api/ad/RewardedVideoAd.offClose/)、[destroy 释放资源](https://developer.taptap.cn/minigameapidoc/dev/api/ad/RewardedVideoAd.destroy/)。
- [小游戏广告运营规范](https://developer.taptap.cn/minigameapidoc/tap-operation/operation-standards/minigame-ad-policy/)：收益与观看自愿性、首次体验保护；没有保证所有视频固定30秒的依据。

## 6. P1：空屏、界面和物理体验实操

构建恢复后，先新 Web Release 再同 SHA Tap 真机。Web只证明浏览器链路。

1. 全新存储冷启：品牌加载→菜单→首屏设置→返回→开始→教学→完整游戏。可见杯子、HUD、落料、晃杯/暂停可点，不能只看 screen=PLAYING。
2. 慢网/资源缺失/前后台切换：前台15秒预算严格生效，后台不计；旧回调无权结束新 scope。失败界面可返回菜单并实际再次开始；复现 renderUnsafe 抛错仍有独立可点错误入口。控制台原始错误保留，不能把 Error3804/START_ART_TIMEOUT 未调查即称自动化噪声。
3. Boot 失败保留 buildId、traceId、阶段、错误 code、独立摘要及有限 stack；当前 StartupTrace 同时有 code/error 时 error 会被 code 覆盖，需独立 summary 字段或等价有限记录，覆盖 Error 与非 Error 抛出；无敏感数据、无逐帧堆栈积累。
4. 持续拖杯、快速反向、边缘拖动、满杯晃杯、连续点击、暂停/切后台再回：手势及时跟手，真实小料滚动/合成/洒出，不单列悬挂、不穿底、不弹出物理追赶技术弹窗。异常技术恢复免费且不能变成复活广告入口。
5. 有档刷新/旧档迁移、同分续局、已提交奖励中断重进、不可验证存档：不覆盖原档、不重复计分/发奖；无可用存档时不展示无效的读取按钮。

## 7. 性能与小包方案

### 7.1 先量化，保留既有压缩成果

旧 V3 Tap ZIP 3,026,101字节，约2.89MiB，**不是当前源码包**。现有派生优化已将单份未压缩 RGBA 纹理估算降至约23MiB；这是估算，不是进程内存。3MB ZIP 同样可能触发大纹理解码、原生视频和引擎峰值，不能宣称已解决400MB。

优先顺序：SDK实例/监听清理 → 首屏仅载菜单和必要背景 → 开局按需载游戏 → 效果按需单份加载与有限缓存 → 核对重复解码/贴图/Canvas引用 → 必要时再缩放派生图。单一 Creator 进程顺序构建；日志有界，不并行开多个 Creator/浏览器/打包副本。

复用 `prepare_p1c_release_assets.py`、`optimize_runtime_assets.py`、`verify_optimized_assets.py`；优化只作用于隔离副本。保留原稿、许可证和透明通道；背景可沿用合适 JPEG，透明 UI 不盲改 JPEG；图集留边防渗色，不整包提前解码所有动画，不同时保留原图与重复派生版本。ASTC 可按目标设备/扩展实测支持后采用，不能强行切换导致缺图或把原始PNG兜底全常驻。音频去重复、按需加载；资源释放必须核对 Creator 引用，不直接 destroy 共享贴图造成别的页面黑图。

对小包优化逐项列 top20 压缩前/后资源、用途、加载阶段、尺寸及峰值估算；先清理被打包引用的冗余项，不为几KB牺牲画质或可维护性，不把仓库文档打进 ZIP。保持同清晰度下 ZIP 不高于旧约3.03MB为**内部比较目标**，若真实必要内容增长，解释增量而非删功能凑数。

### 7.2 真机性能验收协议

至少覆盖平台此前失败机型与一台常规机；每机记录型号/内存/系统/Tap版本、包SHA、广告状态、网络及存储状态。冷启至少5次、热启至少5次，样本不足不称可靠P95；报告逐次值与中位数/最大值。定义启动为宿主开始加载到菜单可交互，并单列点击开始到杯子+HUD+第一颗落料；以平台实测的正式口径和阈值为准，不自造平台合格线。

采样：冷启、菜单、开局、5分钟游戏、满杯晃杯、视频播放峰值、关闭视频30秒、返回菜单、重复开局/两类广告至少10轮。记录宿主提供的进程/原生/GPU/JS各自指标及采样频率；不要只记录JS heap。对同设备同口径对比旧包约400MB峰值与新包；不能用强制GC后截图代替峰值。

内部成功条件：无新增OOM/长时间无交互；同口径峰值实质下降；稳定阶段无随轮次持续增长的实例/监听/纹理计数；平台此前启动/内存失败项实际重测通过。没有实机数据就写 NOT_RUN，不能声明“低内存合格”。官方[运行时内存建议](https://developer.taptap.cn/minigameapidoc/dev/tutorial/performance/runtime/memory/)（页标更新2025-02-25）可作排查依据，不能将建议值或贴图估算当该游戏审核通过证据。

## 8. 必要测试案例与门禁

| ID | 操作/注入 | 必须结果 |
|---|---|---|
| PK01 | 对当前源码列出裁剪节点并构建 | 明确48与46差异，审定后精确裁剪、隔离tsc和Web Release通过 |
| OW01 | A重试读档中切B，同run独立回调 | A零回调，B合法恢复；不残留SHOWING/SETTLING |
| OW02 | B清pending的commit等待时切C | B零回调；C回读最新revision可继续，无新奖励丢失 |
| OW03 | 清pending时CAS冲突/仓库throw/立刻重看 | 保留新pending，错误可操作，无未处理rejection或并发watch |
| RC01 | 已提交复活receipt，apply失败一次 | ERROR且可免费重试，used不伪造；重试仅应用一次，不再看广告 |
| RC02 | 多条额外晃杯receipt，内存落后2次 | 恢复已提交总量，重复bind不多补，消费数保留 |
| AD01 | 免费两次后第三次点击晃杯 | 自愿说明→完整视频→落盘+1；取消不加、未看完不加 |
| AD02 | 晃杯洒出→看完 | 同run同分、used=1、安全清理、暂停后120tick缓冲；再次洒出无第二次复活 |
| AD03 | 取消/未看完/loadfail/showreject→重试或结束 | 不自动结算、不扣成功quota、不重复广告，显式结束才普通结算 |
| AD04 | true/false/缺值/嵌套值/重复/晚到close | 仅当前可信顶层true奖励一次；show.resolve/本地30秒不奖励 |
| AD05 | off任一throw、缺接口、注册部分throw、dispose两次 | 其余清理照做，destroy每实例最多1次，互斥锁/回调不泄漏 |
| AD06 | 断网/切后台/丢close/宿主换代 | 正常视频不中途误销毁，无未证实补奖或永远无法操作 |
| AD07 | 同日第四局首次复活 | 没有新增每日复活阻断；每局仍最多1次 |
| UX01 | 首屏设置→返回→新局；错误→菜单→新局 | 实际可点击、可落料，无遮罩残留 |
| UX02 | renderUnsafe抛错、配置坏档、资源超时 | 独立错误入口可操作；首错误有阶段/摘要/stack |
| PF01 | 首次/旧档/低内存/慢网Tap开局 | 同SHA真实杯+HUD+落料+可点按钮，背景空屏判失败 |
| PF02 | 5分钟游戏+10轮广告/重开 | 同口径内存曲线无持续增长，平台拒绝项重测通过 |
| IN01 | 原始回归+合同/配置+资源/包体 | 原126有效断言保留、必要新增全部执行；71 art+7 effect、派生哈希及ZIP CRC通过 |

原 `ownership-diagnostic.cjs` 是诊断变体，用于证明问题，不代替正式测试修订。新增案例并入现有 runner/最小探针，避免维护第二套完整回归。

## 9. 最终打包顺序与交付

1. 修3–5节本地阻断，运行最小必要门禁；不先刷旧包或连续盲构建。
2. 用新唯一ID构建 Web Release 并实际操作第6节；需要注入时另建Debug，不把Debug当上传包。失败时保留首错与身份，停止后续正式打包。
3. 广告位有效且本地通过后，通过项目现有 Creator+Tap扩展生成候选 `game.zip`。真实广告与Tap验证需要候选包，先候选验证，**所有缺口关闭后才晋升最终包**。若验证后任何代码/广告配置变化，重新构建新ID并重验受影响项，不能把旧SHA改名为最终版。
4. 校验71 art+7 effect映射、ZIP CRC/每个派生资源哈希、资源路径大小写、Release清洁度、源/隔离清单与实际政策；列出buildId、version、源码commit+diff、字节数、SHA256。明确当前真实广告配置状态，不输出原始凭据。
5. 同SHA Tap真机覆盖开局、真实两广告、取消/失败、旧档、后台、物理压力及启动/内存。用户具体授权后才上传测试/修改广告配置/提审；本轮没有这些外部操作。
6. 所有门禁通过，只保留一个明确的最终入口并更新 CURRENT-CANDIDATE；历史失败候选标注不用于验收，不删除复现证据。若平台或设备条件缺失，交付诊断候选和精确NOT_RUN清单，整体仍BLOCKED。

已核实的本地命令（项目根，ID和版本在执行前取实际新值，不重用本轮失败ID）：

```powershell
npm run typecheck --prefix 奶茶挤挤
python -X utf8 tools/sync_client_contracts.py --check
python -X utf8 tools/sync_design_config.py --check
npm run verify:art --prefix 奶茶挤挤
node tools/verify_rewarded_shake.cjs
python -X utf8 tools/build_cupauto_web.py --build-id NEW_UNIQUE_WEB_ID --mode release --evidence-dir evidence/Acceptance/NEW_UNIQUE_WEB_ID
python -X utf8 tools/build_taptap_minigame.py --build-id NEW_UNIQUE_TAP_ID --version ACTUAL_SEMVER --evidence-dir evidence/TapTap/NEW_UNIQUE_TAP_ID
python -X utf8 tools/verify_optimized_assets.py --build-id NEW_UNIQUE_TAP_ID --evidence-dir evidence/TapTap/NEW_UNIQUE_TAP_ID --package build-artifacts/cocos-taptap-minigame-build/NEW_UNIQUE_TAP_ID/TapBuild/game.zip
```

`NEW_UNIQUE_*`/`ACTUAL_SEMVER`为占位，不直接照抄执行。不要为了构建重装全部工具、升级引擎或并行运行多个Creator。

### 9.1 本轮实际产物（2026-11-06 adfix）

| 类型 | buildId | 路径 | 字节 | 校验 |
|---|---|---|---|---|
| Web Release | `20261106-adfix-web-release-01` | `build-artifacts/cocos-p1b-build/20261106-adfix-web-release-01` | 5,063,191 | `WEB_CANDIDATE_BUILD_PASS`；`sourceMapCount=0`；调试 API 字符串不存在 |
| Tap 候选（诊断） | `20261106-adfix-tap-candidate-01` | `build-artifacts/cocos-taptap-minigame-build/20261106-adfix-tap-candidate-01/TapBuild/game.zip` | ZIP 3,030,025；解压 5,180,242；398 文件 / 77 PNG | SHA256 `84a1db3fe6bdbc6d8ff8907ee013477196002f15591a7f7715e174e4044f9b85`；71 art + 7 effect；78 派生资源命中；CRC PASS；无 source map / 调试 API |

- Tap 候选 `result.json`：`status=LOCAL_CONVERSION_PASS_NOT_HOST_VALIDATED`、`runtimeVerified=false`；`release-assetsExitCode=0`、`release-codeExitCode=0`、`typecheckExitCode=0`。
- 证据目录：`evidence/Acceptance/20261106-adfix-web-release-01/`（构建、`result.json`、真实浏览器截图）、`evidence/Acceptance/20261106-adfix-tap-candidate-01/`（`release-asset-staging.json`、`texture-optimization.json`、`optimized-asset-verification.json` 等）。
- 广告配置：`config/rewarded-ad-policy.json` 与 `assets/resources/config/rewarded-ad-policy.json` 仍 `enabled=false`、`adUnitId=null`；复活策略同理。**没有真实广告位，因此两个广告点的真实链路为 NOT_RUN，不是已交付。**
- 候选不得晋升最终包；同 SHA 的 Tap 宿主开局、真实广告、启动/内存全部 NOT_RUN，整体保持 BLOCKED。

## 10. 执行提示词

```text
请在 D:\Workspace\TapTap\奶茶挤挤 继续实施并完成验收。先读适用AGENTS.md、README、docs/22、docs/47-ad-acceptance-and-final-package-design.md、CURRENT-CANDIDATE及项目taptap-release-readiness Skill，按任务读取已安装官方TapTap Skill与最新广告文档。当前源码核验基线f1c49c0；保护我的所有现有修改。本任务要实际修复、验证和准备最终game.zip，不能只给计划，也不能把历史V3或Mock当真实交付。

按docs47顺序执行：
1. 定位Release裁剪expected46/found48的具体AST差异，修最小规则/精确清单；不得盲改计数、放开断言或删必要启动诊断。修R2c共用新旧宿主计数器和旧snapshot冒充新run的夹具，保留原126项有效断言。
2. 两个广告服务的clearStalePending加owner/generation/run/attempt归属、await后校验、异常和CAS恢复，避免旧宿主回调、清新pending、revision失步及清理未完就重开。修已落盘复活apply=false仍GRANTED；必须免费恢复成功才显示成功。额外晃杯按可信已提交总量幂等补齐，不重复补、不丢消费次数。
3. 修TapRewardedAdProvider实例创建部分失败、off抛错、重复dispose的清理：每个off独立、destroy最多一次、晚到回调无效、timer与锁释放。保留顶层onClose.isEnded===true才奖励，show.resolve或本地30秒不奖励。
4. 实际打通两个自愿广告点：免费2次晃杯用尽后完整观看+1次；晃杯/移杯洒出后完整观看同局同分复活、每局最多1次、无新增每日复活上限、120tick安全缓冲。取消/未看完/失败保持可重试，不自动结束。核对首次体验保护，技术故障不能要求看广告。先检查授权配置，仍缺真实广告位明确列缺口，不造ID、不用Mock冒充真实完成、不擅自改线上配置。
5. 按docs47测试矩阵复用现有runner补最小故障回归；验证前台预算、首屏设置、错误页返回菜单再开始、render失败兜底及有限首错摘要。真实Web必须看见杯+HUD+落料+可点按钮，实操拖杯/晃杯/暂停/旧档续局，不仅检查screen变量。
6. 先修资源/原生广告实例生命周期，再按需优化隔离派生素材和加载；保留原稿、透明UI和清晰度。一个Creator顺序构建，记录ZIP大小与同口径真机内存，不能用小ZIP或JS堆证明解决400MB。覆盖平台失败机型启动、广告峰值、10轮循环，实测平台拒绝项。
7. 本地通过后新唯一buildId依次Web Release与Tap候选，核对71art+7effect、CRC/派生哈希、Release无Debug/Mock/source map、源码身份及SHA。广告配置变化用新ID/SHA。同SHA完成Tap开局、真实两广告及性能后才晋升最终包；缺现场条件交付诊断候选与NOT_RUN，整体保持BLOCKED。上传/后台修改/提审/发布按用户具体授权执行。

更新docs47、docs22、README与唯一候选入口为实际事实，交付改动、必要测试/截图、最终或诊断ZIP绝对路径/字节/SHA及剩余缺口。禁止删有效断言、吞错、改业务限制或仅打包成功便宣布验收通过。
```
