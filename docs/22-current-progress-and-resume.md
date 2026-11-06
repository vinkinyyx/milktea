# 当前事实与继续入口

## 2026-11-07 独立验收与最终交付路径（优先）

最新事实、未完成根因、用户操作与完整提示词见[docs49](49-final-delivery-platform-device-plan.md)。本轮客户端验收通过，整体进入平台/真机阶段，尚未最终晋升。

- 实际复跑170/0、typecheck/配置/合同/设计通过，94baeac3包3,030,312字节、资源/CRC及313项源清单一致；独立回读失败探针证明免费重试到账一次、show1/receipt1；StartupTrace摘要与32环实测通过。
- 不再索要用户手工广告位ID：当前官方MCP工作流要求选应用后check_ads_status自动查。实际list_developers_and_apps报TOKEN_REVOKED；start_oauth却认为本地已有有效MAC，需获确认后仅重置失效MCP登录并扫码，不动有效CLI凭证。
- CLI有效；503251/1021353返回available类型空、declared=[spark]，并有绑定超声明warning。用户已明确此前自测就是1021353，不能换游戏；先核对能力/槽位，不自动切Maker/H5或清绑定。
- 用户已选安卓USB调试。ADB已安装 `%LOCALAPPDATA%/CodexDeviceTools/platform-tools/adb.exe`；当前devices无设备，需要手机数据线/调试/RSA允许。
- 待落实具体MCP重置与开发测试上传授权；平台真实两广告、同SHA开局/启动内存仍待执行。下一Agent按docs49从接入条件推进，不重复本地修复接力。未上传/改后台/提审发布。

## adfix2 整改（本节优先）

整体 **BLOCKED**，最新详细设计/执行提示词见[docs48](48-adfix-review-and-device-closeout-design.md)。本轮已修复并重新构建 Tap 诊断候选。

- 已修复额外晃杯"提交成功后回读失败→免费重试持续CAS冲突"：commit 成功立即同步宿主 revision；retry 先回读校验 receipt/run/attempt 身份，已提交只免费幂等应用正差额（不重看、不追加 receipt、不重扣配额），采用回读信封自身 revision。补 SR01–SR07，合计 **170 PASS / 0 FAIL**（原152项有效断言全部保留）。
- StartupTrace 已补独立有界 `errorSummary`，`stage()` 独立写入不被 `code` 覆盖；支持 Error/字符串/对象/null。
- `validate_design.py` 已修正：仅对 classic(stages[0]) 硬校验，P3 四阶段列入 `deferred_stage_fit`，`errors=[]`；未改经典杯/小料尺寸，未启用 P3。
- 新唯一 buildId `20261106-adfix2-tap-candidate-01`：3,030,312 bytes，SHA256 `94baeac3409b4109d397f922db095e6b0df6d6e639a1b826f38fdd5ee231bc89`；71 art + 7 effect、CRC/派生哈希/无 source map/无 Debug API 全 PASS；源码 manifest `originalSourceChanges=[]`。
- 真实广告位仍 `enabled=false, adUnitId=null`；Tap 同 SHA 开局/真实广告/启动内存仍 NOT_RUN。新候选仅诊断，未晋升最终包。
- 未上传、未改线上配置、未提审发布。

## 2026-11-06 adfix 轮：本地修复与候选包已产出，整体仍 BLOCKED（本节优先）

源码基线 `f1c49c0` + 本轮工作区改动（未提交）。本机有 D 盘/Node/Python/Creator，已按 [docs47](47-ad-acceptance-and-final-package-design.md) 顺序执行。

本轮实际关闭的本地缺陷：

| 缺陷 | 修复 | 证据 |
|---|---|---|
| Release 裁剪 expected46/found48 | `strip_p1c_release_debug.cjs` 用精确独立语句集合匹配调试环清理，第二组精确计数 46→48（`returnToMenuFromError` 新增的两个独立 clear），不放宽匹配 | `release-codeExitCode=0`（Web/Tap 两次），`release-code-staging.json` 记录 `exactNodeEdits:48` |
| R2c 夹具混淆 | 拆成同 run 换 owner（R2c-1）与新 run（R2c-2，合法 UUID + 重封候选哈希）两场景，各自独立计数器/bundle/revision | `verify_rewarded_shake.cjs` R2c-1/R2c-2 全 PASS |
| 两个广告服务清理无归属 | `clearStalePending` 先回读最新信封→校验 attemptId/runId→用新鲜 revision CAS→复核 host/generation/run，过期 owner 零回调；`watch` 写入前同步 revision | OW02-a/b/c、OW03-a/b/c 全 PASS |
| 已提交复活 apply=false 仍 GRANTED | receipt 落盘但应用失败转 ERROR + `retrySettle=true`，免费重试且不再看广告 | RC01-a/b PASS |
| 额外晃杯重复/丢失 | `applyCommittedExtraGrant(amount)` 按持久化总量差额幂等补齐，不改写 `extraUsed` | RC02-a/b PASS |
| 广告实例解绑/销毁异常 | `TapRewardedAdProvider` 每监听独立 off、destroy 最多一次、部分创建/注册失败回滚、晚到/重复 close 忽略、timer 清理 | AD05-a~e PASS |

本轮本地门禁实际结果：

- `npm run typecheck`：0 错误；`sync_client_contracts.py --check`、`sync_design_config.py --check`、`npm run verify:art`：通过。
- `node tools/verify_rewarded_shake.cjs`：**152 checks passed, 0 failed**（原 126 项有效断言全部保留，新增 RC01/RC02/AD05/OW02/OW03 等）。
- Web Release `20261106-adfix-web-release-01`（新唯一 buildId）：`WEB_CANDIDATE_BUILD_PASS`，`sourceMapCount=0`，调试 API 字符串不存在；真实浏览器完成菜单→教程三步→开局→落料→拖杯→暂停/继续→两次晃杯→次数耗尽→杯满结算→刷新续局→损坏存档回退（截图见证据目录）。
- Tap 候选 `20261106-adfix-tap-candidate-01`：`tools/verify_optimized_assets.py` **PASS**，`artMappings=71`、`effectMappings=7`、`packageAssetsPresent=78`、ZIP CRC 通过、派生资源哈希全部命中、无 source map、`.js` 内无 `__P1B_*`/Fake/Mock 调试 API；RGBA 由 60,251,896 降至 24,119,392（原稿未改，构建期派生）。
- 包体：`D:\Workspace\TapTap\奶茶挤挤\build-artifacts\cocos-taptap-minigame-build\20261106-adfix-tap-candidate-01\TapBuild\game.zip`，3,030,025 bytes，SHA256 `84a1db3fe6bdbc6d8ff8907ee013477196002f15591a7f7715e174e4044f9b85`，398 文件 / 77 PNG / 解压 5,180,242 bytes。

保持 BLOCKED / NOT_RUN 的项：

- 两个真实广告点（额外晃杯 +1、洒出同局同分复活）仍 `enabled=false`、`adUnitId=null`，**没有真实 TapTap 广告位**；未造 ID、未用 Mock 冒充完成，因此真实广告交付仍为**未交付**。
- Tap 宿主同 SHA 开局、真实两广告（完整/取消/失败/重复/晚到 close）、启动与内存曲线：**NOT_RUN**，不能用小 ZIP 或 JS 堆证明约 400MB 峰值已解决。
- `tools/validate_design.py` 报“最大小料直径不能大于经典杯口内宽”，属 `f1c49c0` 既有基线问题，本轮未改设计基线，未宣称通过。
- 本轮未上传、未改线上配置、未提审、未发布。

## 2026-11-06 独立验收（历史：问题复现轮）

源码 `f1c49c0`，当前本机有D盘、Node、Python、Creator。整体 **BLOCKED**。最新设计与完整提示词见[docs47](47-ad-acceptance-and-final-package-design.md)。

- 本轮实际通过：原工程typecheck、合同/配置镜像、71图完整性、前后台分段预算与旧令牌隔离集成探针。
- 原始回归实际126项，125通过/1失败。R2c把新旧宿主回调计数混用，且旧snapshot覆盖了想传入的新runId。隔离诊断变体126/0不代表原runner已修；保留有效断言并正确修夹具。
- 已复现真实缺陷：clearStalePending回调过期宿主；复活apply=false仍GRANTED/used0；SDK异常解绑跳过destroy、部分创建失败未销毁、dispose重复销毁。
- 新Web Release尝试 `20261106-ae-ad-review-web-release-01` 在裁剪阶段失败：expected46/found48，未进入Creator。本轮没有新Web成品/新Tap ZIP，没有本轮新UI或同SHA真机通过证据。
- 两个真实广告位均disabled/null；真实视频、Tap空屏及此前约400MB峰值仍未关闭。先修本地阻断，再真实广告候选与真机验证，最后晋升正式包。
- 证据：`evidence/Acceptance/20261106-ae-ad-review/`；本轮未改运行源码、未提交推送、未上传或改线上配置。

## 以下为上一执行轮历史记录（环境与验证状态已由上节更新）

2026-11-06（第二整改轮）。**整体BLOCKED。** 源码身份=commit `cc70736` + 本轮工作区改动；不能只用旧commit标识本轮全部源码。

## 本轮（A–E + 广告门槛）代码完成，验证未执行

本轮实施环境为 `c:\Users\vinkin.yx.yu\文件\05_其他\milktea`（执行机**无D盘**，`D:\Workspace\TapTap\奶茶挤挤` 不存在）。该执行机**未安装 Node、Python（仅Store占位）、Cocos Creator**，因此 typecheck、118项回归、Debug/Web/Tap 打包、真机验证全部为 **NOT_RUN**，不是通过。

| 项 | 根因 | 修改 | 状态 |
|---|---|---|---|
| A 预算桥接 | `tickBudget` 用“当前可见性”分类跨越后台的整段 delta，hide期间20s被计入；`assertScope`/`settle` 不对时 | `ArtAssets` 改为 `lastAccountedAtMs`+`previousForeground` 分段记账，订阅 hide/show 先按旧状态补记；callback/assert/settle 前对时；不 clamp 大 delta | 代码完成 / 未跑A类集成测试 |
| A 令牌化 | `settleLoadScope()`/`cancelScope()` 无令牌，旧批次 finally 可拆掉新批次 | 两方法接受 `ArtLoadBudget` 令牌，令牌不符即 no-op；`failScope` 终止过期批次 | 代码完成 / 未跑测试 |
| B 独立错误层 | `showStartupFailure` 先调普通 `render()`，抛错即跳不到 overlay；返回菜单不清 overlay/pointer | `render()` 拆为 `renderUnsafe()`+兜底；新增 `returnToMenuFromError()` 清 overlay/按钮/pointer/engine/world | 代码完成 / 未实机点验 |
| C 首屏设置 scope | 首屏 scope 已 settle，设置面板复用即 `START_ART_CANCELLED` | `openModal('SETTINGS')` 自建 `SETTINGS_UI` scope，令牌化收尾；仅按需加载 `ui_*` | 代码完成 / 未截图 |
| D 宿主交接 SETTLING | `bind()` 在 busy 时不复位瞬态 phase；旧 finally 无代际校验 | 代际变更时清除 PREPARING/SHOWING/SETTLING；同run已提交 receipt 走 `applyCommittedRevive` 免费恢复；finally 加代际校验 | 代码完成 / 未跑探针 |
| E Boot 归因 | AppRoot 完全没有 `BOOT_CONFIG` 记录，失败无阶段/堆栈 | 新增 `BOOT_CONFIG` start/ok/error，细分 `BOOT_CONFIG_READ/VALIDATE`、`BOOT_PHYSICS_UNSUPPORTED`、`BOOT_GAMEROOT_FAILED`、`BOOT_LAB_SCENE`；`StartupRecord.stack` 存前6帧 | 代码完成 / 未跑 |
| 广告门槛 | 60秒前台保护对**已完成首局**的老玩家永久生效，属无依据隐形阻断 | 两个 Ledger 改为仅“首局完成前”要求60秒；无限模式用“完成一局”映射平台“1个关卡” | 代码完成 / 断言已同步，未执行 |
| D 交接遗留 pending | 交接后 `pendingAttempt` 归属旧宿主，`clearPending` 的 ownership 校验永远失败，新宿主被 `PENDING_ATTEMPT` 永久阻断 | `bind()` 立即解除阻断并异步 `clearStalePending()`（CAS 失败安全放弃），`getView().pendingAttempt` 不再伪装成本次尝试 | 代码完成 / 未跑探针 |
| 回归补充 | 原 118 项未覆盖交接后瞬态、已提交 receipt 免费恢复、额外晃杯补发 | `verify_rewarded_shake.cjs` 新增 RV-32a/b/c、RV-31a/b、RS-30a/b 共 7 条；断言总数 118→125（未执行） | 代码完成 / 未执行 |
| 预算探针补充 | 原探针只覆盖“先前台后后台”和超时回调 | `budget-integration-probe.cjs` 新增 A02（起始即后台20s→前台15s必超时）与 B01（旧令牌不能 settle/cancel 新 scope） | 代码完成 / 未执行 |
| 预算定时器隔离 | 旧批次的 150ms 定时器回调可能清除新批次的共享定时器句柄 | `tickBudget` 对被替换的 scope 直接返回，不再调用 `stopBudgetTimer()` | 代码完成 / 未执行 |
| busy 归属 | 旧批次的 `watch/retrySettlement/abandonPending` 在 await 后无条件写 `busy=false`，可能清掉新批次的 `busy`，导致重复开广告 | 统一走 `releaseBusy(owner,generation)`；`bind()` 变更代际时无条件复位 busy 与 attempt 内存态；`abandonPending` 交接后不再触碰新宿主 UI/局面 | 代码完成 / 未执行 |

本轮新增回归 ID 与用途：`RV-32a/b/c`（广告批次进行中换宿主：新宿主不为瞬态、旧完成不发奖、账本无新 receipt）、`RV-31a/b`（同 run 已提交复活 receipt 不再要求观看，直接 GRANTED）、`RS-30a/b`（额外晃杯 receipt 免费补发且不再 offer）。

两个真实广告点（额外晃杯、洒出复活）**代码路径完整**（自愿触发、收益展示、结束本局、`isEnded===true` 判据、取消/失败不发奖、互斥、独立记账、每局一次、120tick缓冲），但两个策略仍 `enabled=false, adUnitId=null`。**没有真实广告位，不得填假ID或以Mock冒充上线**，故真实广告交付仍为 **未交付**。

## 本机无法继续的原因与最小补测步骤

阻断项（本机确认为缺环境，不是代码失败）：

- 无 Node/npm：`where node`、`where npx` 均无结果，`奶茶挤挤/node_modules` 不存在 → 无法 tsc/跑回归/打包。
- Python 仅 Store 占位（`python --version` 退出码 9009）。
- 无 Cocos Creator / CocosDashboard / Cocos 安装目录 → 无法生成 Web/Debug/Tap 包与截图。
- 无 D 盘，`D:\Workspace\TapTap\奶茶挤挤` 不存在。
- 无真实 Tap 广告位 `adUnitId`，无 Tap 宿主设备 → 真实广告与平台验收无法进行。

到有环境的机器后的最小步骤（按序）：

1. `npm ci`（或按工程锁文件安装）；`npx tsc --noEmit -p 奶茶挤挤/tsconfig.json` 校验 A–E 与广告门槛改动。
2. `node tools/verify_rewarded_shake.cjs`，期望 **125** 项全通过（118 旧 + 7 新）；失败即为新断言暴露的真实缺陷，禁止删断言。
3. `node evidence/Acceptance/20261106-host-revive-review/budget-integration-probe.cjs`，期望 `background.actualForegroundMs=5000`、`overdue.status=EXPIRED`、`startedBackground.status=EXPIRED`、`tokens.afterOldSettle.newStatus=ACTIVE`、`tokens.newSettled=true`。
4. 合同镜像与 71 art+7 effect/CRC：按现有脚本重跑，确认 `contracts` 与 `build-artifacts/rewarded-tests/js` 同步。
5. Web Release 实操：开始→教程→落料→拖杯→晃杯→暂停→刷新续局→制造错误后“返回菜单”→“开始新局”，逐步截图回看。
6. 全新唯一 buildId 依次生成 Debug、Web Release、Tap `game.zip`；分别构建广告关闭（`enabled=false`）与开启（真实 adUnitId）两版，记录源码身份、未提交差异、版本、字节数与 SHA256，旧包保留。
7. 同 SHA 真机/Tap 宿主：真实广告完整看完/取消/加载失败、奖励落盘与恢复、前后台、晃杯、洒出复活、启动速度、10 分钟、20 次重开、约 400MB 峰值复测。

在上述 1–7 完成前，本文档状态保持 **BLOCKED**，不得声称“本地通过/真实广告通过/平台通过”。

## 上一轮独立复核结论（保留）

2026-11-06。**整体BLOCKED。** 当前V3基于bd12b73加工作区未提交整改，不能只用旧commit标识本轮全部源码。

本次独立复核：原工程与现有Tap Release裁剪副本typecheck通过，根/工程合同一致，118项回归通过。Tap ZIP为3,026,101 bytes，SHA256 `b2c3519df4371255346590a583c0413260c003d3b56b6a8842e36f18640a57e7`，71+7资源/CRC/哈希复核通过；原工程构建清单313项无后续变化。

Web Release实际完成开局/跳过教程/落料/拖杯/晃杯/暂停和刷新续局：同run、score30、tick290、晃杯used1恢复PAUSED，未出现物理fault。localhost上下文persistent=true，并非Web天然不支持持久化。

新增失败：

1. 前台5秒+后台20秒、timer停调时，恢复后误记25秒并超时；回调先于timer时又能在16秒后错误settle。不得用delta clamp掩盖真实等待。
2. 错误页返回菜单仍overlay=true，实际开始点击无效；普通render抛错时独立错误层也未显示。
3. 首屏设置未建立资源scope，22项未增，主题资源加载失败；游戏资源加载后再测设置不能覆盖首屏问题。
4. 换宿主后旧回调已为0，但旧任务结束仍SETTLING；新视图可操作性和免费权益恢复尚未闭合。
5. 真正AppRoot Boot及错误摘要/阶段归因仍有缺口。

完整验收、下一轮设计与测试：[docs46](46-v3-review-and-host-closeout-design.md)；[执行提示词](46-v3-review-and-host-closeout-design.md#12-完成标准与执行提示词)。docs45为前轮设计基线，不重复修已关闭的合同/裁剪错误。

保留V3产物：

- Debug：`build-artifacts/cocos-p1b-build/20261105-host-revive-v3-debug-01/`。
- Web Release：`build-artifacts/cocos-p1b-build/20261105-host-revive-v3-web-release-01/`。
- Tap Release：[候选与SHA](../output/taptap-upload/CURRENT-CANDIDATE.md)。该包是存在已知异常边界的复测基线，不是正式完成版。

真实Tap开局、真实广告、原始手机晃杯异常及约400MB平台峰值复测仍OPEN/NOT_RUN，不是可选工作。广告关闭/开启配置对应不同SHA，分别验证。本轮只验收与文档设计，未修运行代码、未生成新包、未提交/推送或上传。
