# 当前事实与继续入口

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
