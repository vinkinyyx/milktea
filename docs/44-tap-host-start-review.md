# Tap 自测背景空屏与洒出复活独立验收

2026-11-05。结论：**BLOCKED，验收未通过，不能作为正式完成版交付**。

本次是独立验收：重新执行检查、操作现有 Web Release、增加故障注入，更新事实与交付入口。没有修改游戏运行代码、开启广告、生成替代包或上传平台。新增检查发现的问题需要继续整改。

## 核验对象与证据

- Cocos Creator 3.8.8，Tap 扩展 1.2.2，经微信目标中间产物转换的 Tap 小游戏；不是 H5 托管或 APK。
- 当前本地 Tap 候选：[game.zip](../build-artifacts/cocos-taptap-minigame-build/20261104-spill-revive-tap-02/TapBuild/game.zip)。3,021,177 bytes、398 条目；SHA256 `f768704568d3c43a7122f2a205a79f253650026c3a6a13d4512a0e7ddcd93a3e`。
- 构建原始清单的 311 个文件与当前工程逐项 SHA 比较，无差异。本次报告针对这份源码和本地候选。用户实际上传包的路径/SHA 尚未获得，不能认定截图一定来自这一包。
- [补充故障探针](../evidence/Acceptance/20261105-tap-host-review/probe-revive-boundaries.cjs)、[复现结果](../evidence/Acceptance/20261105-tap-host-review/revive-boundaries.json)、[完整日志](../evidence/Acceptance/20261105-tap-host-review/revive-boundaries.log)。探针复用现有测试的场景，不改生产代码或原测试断言。
- [本地游戏截图](../evidence/Acceptance/20261105-tap-host-review/web-release-playing.png)、[暂停截图](../evidence/Acceptance/20261105-tap-host-review/web-release-start.png)。

## 实际验证结果

| 检查 | 结果 | 范围与限制 |
|---|---|---|
| 既有自动回归 | PASS，111/111 | Node 逻辑、存档与模拟广告；新增探针证明仍有未覆盖缺陷 |
| Creator 工程 TypeScript 检查 | PASS | 不代表运行正确 |
| 优化贴图来源与 ZIP 校验 | PASS | 71 art + 7 effect 映射全部在包；CRC/派生哈希通过 |
| 当前源码与最新 Tap 构建输入身份 | PASS | 原始构建清单 311 项无变化 |
| Web Release 菜单→开始→跳过教程→落料→暂停→继续 | PASS | Chromium 390×844，实际鼠标点击；PLAYING tick238/dropIndex3/fault null；69 项游戏美术；杯子/HUD/晃杯/暂停可见 |
| 广告写盘成功后回读失败，再领取 | FAIL | 实际故障注入；连续两次重试仍冲突，见下文 R2 |
| 未完整观看后保留同次复活选择 | FAIL | 既有取消场景实际进入 SETTLING，见 R3 |
| Tap 宿主开局 | FAIL（用户设备反馈） | 附件只见背景，无杯、HUD、菜单或可继续按钮；本地未能复现，根因未确认 |
| 真实广告位/真实完成回调 | NOT_RUN | 两类广告正式策略关闭；复活 adUnitId=null |
| Tap 冷启动及约400MB峰值复测 | NOT_RUN | RGBA预算23MiB不等于进程峰值23MiB |

技能自带 Web 测试客户端首次因其目录无法解析 playwright 而未执行；随后将同一客户端复制到证据目录，仅将 import 指向现有 npm 缓存中的 Playwright。客户端可以执行，但首次及延长等待重试的截图均纯黑，不能用它判定首屏通过；该自动客户端的截图结果保留为未解决的工具/运行差异。上表 Web 通过只依据另一个 Playwright CLI 浏览器实际操作及已回看的非黑屏截图，不推断纯黑与用户 Tap 背景空屏同因。CLI 控制台两条 favicon 404，与游戏资源无关，未计作游戏故障。

## 问题及整改要求

### R1：P0，Tap 宿主只有背景，无法开始

附件可确认的是：店铺背景已显示，但玩家界面没有出现。它不能单独证明缺图、教程遮挡、内存耗尽或 Box2D 出错。也需区分用户点击的是平台开始入口，还是游戏内“开始新局”。本地流程正常不构成平台通过。

当前代码存在两个诊断/恢复缺口：

1. `GameRoot.startNew/restoreRun` 等待 `loadGameArt`；`ArtAssets` 的资源/Bundle 回调没有应用级截止与过期回调保护。回调不返回时可以无限等待。此为源码风险，尚不是附件的已证实根因。
2. `GameRoot.render` 先销毁整层旧 UI，再顺序创建背景与控件，没有独立于资源和业务渲染的错误兜底。后续渲染抛错时可能只留下背景。同样是待验证路径，不能直接写成已定位。

按以下顺序排查并修复：

1. 核对上传 ZIP SHA、Tap 包版本、设备型号/系统/Tap版本。保留这份失败包和首条错误堆栈；不先换图或重装掩盖现场。
2. 在正式构建保留低成本开局阶段记录：`BOOT_CONFIG`、`SAVE_READ`、`ART_CATALOG`、`MENU_READY`、`START_REQUEST`、`GAME_ART`、`WORLD_CREATE`、`RUN_CREATE`、`INITIAL_SAVE`、`HUD_READY`、`FIRST_TICK`。每条含 buildId、相对毫秒、阶段、结果和脱敏错误摘要；资源仅记录逻辑 ID/Bundle，不记录用户存档或广告敏感字段。环形内存最多32条，禁止逐帧写盘。
3. 用引擎 Graphics/Label 创建独立的状态层，不依赖 ArtAssets、世界节点、广告或旧 UI。点击后下一次可绘制帧显示“正在准备这杯…”；异常显示可读错误编号、构建ID、返回菜单/重试按钮。绘制失败要由 AppRoot 的独立兜底承接，不能递归调用同一个失败 render。
4. 核对 Tap 转换后真实资源路径、Bundle配置、大小写、图片解码、物理后端初始化和宿主存储，逐项以首个失败阶段及日志排除。不得因为图片在 ZIP 就判定加载链路正确。
5. 资源加载增加明确的超时和 generation/owner 取消。建议前台累计15秒作为首轮可调上限，后台不累计；超时后可重试/返回菜单，迟到回调不能建立第二局或覆盖新状态。平台内存压力应作为独立信号排查，不用放宽超时隐藏问题。
6. HUD、杯体视图、必需资源、物理世界及首个存档边界全部就绪后才发布可玩的 PLAYING 状态。失败不能覆盖原完整存档。资源重试不应默认新开局。
7. 保留 UI 的专用稳定父节点和层级，重建世界不得压住 UI。对于渲染异常，先保留当前可操作状态或使用独立兜底；避免每次失败先清空全部按钮。
8. 用与待上传 ZIP **同一 SHA** 的真实 Tap 宿主复测；至少覆盖全新存储、旧存档、继续上局、冷启动、后台切换、资源失败与低内存。必须看到杯子、分数、落料和可点按钮，不能以背景出现/打包成功作为通过。

### R2：P1，奖励已提交后回读失败，领取重试永久冲突

位置：`SpillReviveService.ts` 的 `settle`。提交奖励成功后，直到额外 readBundle 成功才更新宿主 bundle/revision；额外读取失败时内存仍保存旧 revision 和 pendingAttempt。

实际探针：第一次待确认写入 revision2；奖励写入成功 revision3；只注入一次后续回读错误。随后读取已恢复正常，但两次“重试领取”仍使用内存 revision2 重写，产生 CAS 冲突。实际档案已 used1，现场引擎却 used0，不能继续。

修复要求：领取重试先读取最新完整信封，验证 runId/failureId/attemptId/receipt/candidate 身份。若对应 receipt 和 used1 已落盘，同步宿主 revision 后免费应用这份已提交候选，禁止再看广告或重新发奖。没有对应凭证时才在可信完成记录仍有效的前提下重试 CAS；冲突不能盲目覆盖其它新局。回读仍失败则保留可信待领取状态。

### R3：P1，广告取消/加载失败直接结算，违背可重试设计

位置：`SpillReviveService.watch → clearPending`；默认调用 `declineSpillRevive`。探针复用已有取消案例，观察到 `state=SETTLING`、used0、phase ERROR。未扣 used 并不意味着用户还保有一次机会。

原设计明确要求 load失败/未完整观看后清 pendingAttempt，**保留 pendingFailure**，允许手动重试或结束。现有 RV-25 反而断言必须进入 SETTLING，测试与需求冲突。

修复要求：清理未完成广告记录后仍冻结同一 failure；显示“未完整观看，未获得复活”，提供重试和结束。仅用户明确选择结束，或已经成功复活后再次洒出，才正常唯一结算。清理写盘失败继续保留待处理，不能假装清理完成。新增业务测试后更新 RV-25 为正确预期，保留取消不发奖的断言。

### R4：P1，擅加每日3次复活上限

配置 `spill-revive-policy.maxDailyRevives=3`，PolicyLoader 把该值限制为1..3；Ledger 和结算服务均强制执行。原需求只有“每局最多一次成功复活”，docs43还明确不自加每日上限。

修复要求：移除本轮未授权的每日阻断规则，保留日键/receipt历史可用于审计。不要通过填一个极大数字伪装无限，或把额外晃杯每日额度套给复活。验证同一天第四局在满足其它合法条件时仍可获得该局唯一一次复活。

### R5：交付入口与状态说明过期

`output/taptap-upload/CURRENT-CANDIDATE.md` 原指向 `mobile-feel-ads-tap-release-03`，README/AGENTS 仍写“复活只有设计”。本次修正当前入口并保留历史记录。上传包是否选错仍需实际路径/SHA确认，不能据此认定用户操作错误。

### R6：真实广告和性能门槛尚未完成

当前包关闭复活策略且 adUnitId=null，正常玩家不会获得真实广告复活。关闭策略是缺乏真实配置时应保留的保护，但不能把 Mock 成功视为需求全部交付。

保留真实 Tap 完成判定 `onClose` 顶层 `isEnded===true`，不能用倒计时、show resolve 或停留时长发奖。启动优化、约400MB峰值、手机晃杯异常仍需同包设备证据；旧问题不因本地回归通过自动关闭。

## 复验场景

| 编号 | 操作 | 必须观察到的结果 | 本次 |
|---|---|---|---|
| H01 | 当前Web Release开始/教程/落料/暂停/继续 | 杯、HUD、落料、按钮正常 | PASS |
| H02 | 同SHA Tap全新存储开始 | 菜单与游戏均可操作；记录HUD_READY/FIRST_TICK | NOT_RUN |
| H03 | Tap旧档继续/新局确认 | 原档受保护；正确暂停恢复 | NOT_RUN |
| H04 | 必需资源报错/回调不返回/回调迟到 | 可读错误和重试；不空屏/不开双局 | NOT_RUN |
| H05 | 世界创建或HUD渲染注入异常 | 独立状态层仍能返回或重试 | NOT_RUN |
| H06 | 加载时切后台再回来 | 后台时间不算超时；不补投；需明确继续 | NOT_RUN |
| R01 | 奖励落盘成功，额外回读失败一次，再领两次 | 免费恢复同局、同分、只一条receipt | FAIL |
| R02 | 取消/未看完，再次选择观看 | 保留failure，不扣额度、不提前结算 | FAIL |
| R03 | load/show失败再重试 | 同上；不自动反复弹广告 | NOT_RUN（源码同路径） |
| R04 | 同日第四局申请首次复活 | 不受未经授权的每日3次阻挡 | FAIL（静态规则） |
| R05 | 保存后应用世界失败/进程重启 | 应用已提交候选；不重看、不二次发奖 | NOT_RUN |
| P01 | Tap冷启、低中高设备、10分钟/20次重开 | 平台启动与进程峰值通过；无持续增长 | NOT_RUN |
| P02 | 真机晃杯、广告前后台、洒出 | 无物理错误；不丢分/余额/复活状态 | NOT_RUN |

## 下一轮交接

执行[整改提示词](../evidence/Acceptance/20261105-tap-host-review/execution-prompt.md)。优先关闭 R1，再处理 R2–R4，最后在真实广告位与同 SHA 平台复验中关闭 R6。没有获得宿主证据时应交付带明确未验证项的诊断候选，不再宣称“全部完成”。

2026-11-05在线核对的官方资料：[Cocos/Laya/Egret适配](https://developer.taptap.cn/minigameapidoc/dev/engine/Cocos-Laya-Egret/)说明小游戏不是完整浏览器环境，Cocos插件支持3.8.x及以上、当前页面列出1.2.2。页面未标更新时间；该文档只能支持适配路线，不能证明本包宿主运行通过。
