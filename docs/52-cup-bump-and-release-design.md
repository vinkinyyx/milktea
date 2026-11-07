# 一键颠杯与上线前开发设计

编写日期为 2026-11-07。本文记录一键颠杯 v1 的设计、实施汇报与证据。用户试玩反馈和后续验收结论已纳入 [docs53 强颠杯与上线前开发收口](53-strong-cup-bump-and-release-closeout.md)，当前任务和提示词以该文为准。既有业务不变量继续遵循 [项目规则](../AGENTS.md)，历史根因和证据保留在 [docs51](51-development-closure-masterplan.md)。

## 1. 目标与交付范围

本轮将轻微左右晃动改成一次可感知的颠杯，让杯内小料弹起、错位回落并重新碰撞。同时完成受本改动影响的操作反馈、自动落料协调、存档保护、奖励入口适配和候选包验证。真实广告接通、宿主故障修复和性能优化按本文列明的条件推进。

用户本轮授权产出设计与执行提示词。本文中的运行代码、参数和新候选构建均为后续实施任务。

首发范围为经典窄杯、自动落料、左右拖杯、同级合成、两次免费颠杯、激励视频额外次数和洒出复活。排行榜、云存档、多杯型、商城、奖励券及新的广告样式继续留在原需求队列。

| ID | 工作项 | 启动条件 | 交付与完成判据 |
|---|---|---|---|
| BUMP-01 | 颠杯配置与物理实现 | 立即可做 | 固定步受力、有效目标筛选、一次施力、受力异常回滚通过 |
| BUMP-02 | 交互、表现和教程 | BUMP-01 | 点击可见反馈，杯身与小料运动协调，按钮状态和文案一致 |
| BUMP-03 | 存档与旧规则保护 | 与 BUMP-01 同步 | 颠杯中暂停和恢复不重复施力或扣次，旧档按既有确认流程保护 |
| BUMP-04 | 既有奖励流程适配 | BUMP-01/02 | 额外次数可用于颠杯，复活候选与权益恢复不重复施力 |
| BUMP-05 | 本地功能与错误恢复验证 | BUMP-01 至 04 | 现有回归及新增关键回归通过，真实浏览器完成操作链与错误恢复 |
| BUMP-06 | 候选身份与防回归 | BUMP-05 | staging UTF-8 门禁、资源、裁剪、包身份检查通过 |
| ADS-01 | 真实激励视频接通 | 平台开通且官方查询返回有效配置 | 两业务点真实完整观看、取消、加载失败及权益恢复验证通过 |
| HOST-01 | Tap 宿主功能验收 | 新候选的专属自测入口与设备可用 | 记录手机 buildId、开局、颠杯、存档、前后台及错误恢复结果 |
| PERF-01 | 性能采样与按证据优化 | 设备/平台数据可用 | 同机同口径冷启、热启、连续运行和多轮退出对比，必要缺陷关闭 |
| RELEASE-01 | 平台上线准备核对 | 可立即只读核对 | 草稿绑定、资料、资质、包体和审核范围形成明确差异清单 |

以上任务使用 `TODO`、`IN_PROGRESS`、`PASS`、`FAIL`、`WAITING_FOR_USER_ACTION`、`WAITING_FOR_PLATFORM` 或 `NOT_APPLICABLE`。每项完成时附证据、剩余问题和下一动作。

## 2. 已知基线

| 项目 | 已知事实与证据边界 |
|---|---|
| 工程 | Cocos Creator 3.8.8，Tap 扩展 1.2.2，Tap 小游戏 |
| 应用 | developer 503251，app 1021353，miniAppId tapmccrbqbepy6dfz3 |
| 本地候选 | `20261107-host6-gate-candidate-01`，3,035,417 字节 |
| ZIP SHA256 | `ba395b0c13f11735217b7d99a3c01f83f6090155a87f44f861c2219c4661b287` |
| 平台开发包 | package 444838，后台版本 1.7.0，大小与 host6 一致，列表未返回 SHA256 |
| 用户反馈 | 当前版本可以自测，晃杯力度不足、效果不明显 |
| 旧故障 | 截图顶部为 host3，新局存档遇到异常 TextEncoder 后中断 |
| 已完成的防回归 | 自有 UTF-8 实现，6 种宿主全局形态、660 次比较，真实存档链异常宿主回归，staging 强制门禁 |
| 本地回归 | 最近一次 185 PASS / 0 FAIL，普通环境与缺少 TextEncoder 环境均通过 |
| 广告 | 适配器及两条权益流程存在，策略关闭、广告位为空，最近官方查询为未开通 |
| 平台待办 | 缺 `region_flag_ios`，草稿主槽仍引用 433619，资质查询提示草稿绑定包体版本不存在 |
| 平台其他异常 | 包体类型查询曾返回 available 为空、declared 为 spark，小游戏列表却存在可用开发包，需要重新核对 |
| 性能 | 约 400 MB 的历史问题缺少当前同机同口径关闭证据 |

这些平台事实是 2026-11-07 的记录，执行前按实际操作需要刷新。用户确认可自测只关闭当前无法开始自测的问题，其他验收项分别保留状态。

## 3. 一键颠杯的玩家体验

### 3.1 完整动作

玩家在正常对局中点击「颠杯 2」，杯子先短促下压，随后杯内小料向上弹起并带少量横向扰动，最后自然下落。动作以一次主弹起为核心，按钮在动作期间显示「颠杯中…」，结束后进入短冷却。

可感知目标如下。

- 接受点击后 100 ms 内出现按钮与杯身反馈。
- 半杯、存在松动空间时，可以看见至少一部分小料脱离原来的支撑位置并回落。
- 相同等级的小料通过新的真实接触获得合成机会。合成、计分和洒出仍由物理与领域规则决定。
- 满杯附近仍有洒出风险，教程清楚说明。颠杯不附送无敌、清空危险计时或自动合成。

### 3.2 按钮状态

| 状态 | 文案 | 行为 |
|---|---|---|
| 剩余免费次数 | `颠杯 2` / `颠杯 1` | 优先消耗免费次数 |
| 免费用完，有已到账奖励次数 | `奖励颠杯 1` | 使用一次已到账权益 |
| 动作进行中 | `颠杯中…` | 不接受再次消耗 |
| 动作结束、冷却未到 | `稍等片刻` | 不接受再次消耗 |
| 杯内没有有效小料 | 原次数文案，点击提示 `杯里还没有小料` | 不扣次数 |
| 无次数、广告可提供 | `看视频 +1 次` | 打开自愿观看说明 |
| 无次数、广告未开通/不可用/额度耗尽 | `本局次数已用完` | 给出对应原因，允许继续普通对局 |
| 暂停、教程、结算或广告期间 | 对应遮罩内不可操作 | 不排队扣次或施力 |

`renderPlaying()` 与 `refreshHud()` 必须使用一致的状态计算，避免首次绘制和逐帧刷新出现不同按钮语义。两处现有的 `48` tick 等旧时长硬编码一并核查。

### 3.3 教程与结果页

将玩家可见的「晃杯」「轻晃」及相关提示统一为「颠杯」。第三步教程说明「点一下颠杯，让小料弹起后重新碰撞。杯满时也可能洒出」。首次更新的教程完成标记沿用规则版本机制，新规则展示一次，旧设置和音量保留。

修改范围覆盖 HUD、教程、次数耗尽提示、广告收益说明、结果页、错误消息和无障碍描述。内部 `SHAKE`、`ShakeConsumed`、`extra_shake`、`extra-shake` 等命令与账本标识继续复用，避免无行为收益的全项目重命名。

## 4. BUMP-01 配置与物理设计

### 4.1 配置唯一源和初始参数

所有参数先写入根目录 `config/design-baseline.json`，再同步工程资源。新局规则版本使用 `design-v0.6-cup-bump-01`。以下是首轮调试初值，实施者必须用真实 Box2D 及 Tap 自测调整后记录最终值。

同一对外发布规则版本的物理参数固定。调试候选发生参数变化须用新的 buildId 区分，正式确认参数后再次修改玩法时提升规则版本，避免同一存档标识代表不同物理行为。

| 配置项，均位于 shake 下 | 初值 | 含义 |
|---|---|---|
| `motion` | `bump_v1` | 新规则的动作模型 |
| `base_per_run` | 2 | 每局免费次数 |
| `extra_max_per_run` | 5 | 沿用当前额外次数上限 |
| `duration_seconds` | 0.65 | 动作期 39 个固定步 |
| `cooldown_seconds` | 0.35 | 动作结束后冷却 21 个固定步 |
| `launch_delay_ticks` | 6 | 接受命令后预备 0.1 秒再施加一次脉冲 |
| `vertical_delta_velocity_du_per_second` | 320 | 目标向上速度增量，按真实质量换算冲量 |
| `horizontal_delta_velocity_max_du_per_second` | 70 | 向杯中心扰动的最大水平增量 |
| `horizontal_scatter_du_per_second` | 20 | 按 entityId 奇偶固定方向的小扰动 |
| `max_upward_velocity_du_per_second` | 420 | 本动作新增向上速度的上限 |
| `visual_compress_du` | 6 | 杯身短暂下压的位移 |
| `visual_rebound_du` | 12 | 杯身视觉上弹的最大位移 |
| `guaranteed_merge` | false | 碰撞自然合成 |

新模式不再使用旧的 `acceleration_amplitude`、`frequency_hz`、`visual_offset_max_du` 驱动运动。更新 `RulesConfig`、TypeScript `ConfigLoader` 和 Python 配置校验器，分别校验字段、单位、有限值及关系。旧版配置按已有版本识别规则处理，不能把缺字段默认为新颠杯。

硬约束如下。

- fixed_hz 为 60。动作与冷却只按固定 tick 推进。
- `launch_delay_ticks` 是安全整数，范围为 `0 <= delay < durationTicks`。
- 时长及速度参数必须有限且为正，散布参数可以为零。视觉位移使用有限、明确的边界校验，不能整体放开旧校验。
- 本动作速度上限不得高于现有全局线速度上限换算后的 DU/s。
- 60 Hz 下接受于 tick s，施力 tick 为 `s + 6`，活动区间为 `[s, s + 39)`，下次可接受 tick 为 `s + 60`。

### 4.2 物理接口

复用现有 `IPhysicsAdapter`，添加一个能表达二维速度增量的最小方法，例如 `applyVelocityImpulse(entityId, deltaVelocityDuPerSecond)`。实现在 `CocosPhysicsAdapter`，将 DU/s 转换到 Box2D 速度单位，按 `J = mass × deltaVelocity` 计算冲量，在刚体质心施加并唤醒。Creator 3.8.8 已安装类型声明有 `RigidBody2D.applyLinearImpulse(impulse, point, wake)`，实施时核对真实后端及质心坐标。

`RunEngine` 只决定对象与速度增量，单位换算和刚体 API 留在适配器。不同等级的小料应获得相同设计速度增量，不能对不同质量直接使用相同冲量数值。现有全局速度钳制继续生效。

施力只能发生在 world 未锁定的固定步边界。按现有顺序，在处理命令后、`stepFixed()` 前执行。不能在接触回调或表现层动画回调中改刚体。

### 4.3 有效目标与扣次

接受 `SHAKE` 命令时，至少存在一个实际进入杯内、在当前杯轮廓范围内且尚未洒出的小料，才消耗一次额度。筛选使用当前杯偏移和现有杯体几何，小料实体、刚体及存活状态须一致。只有杯外下落中的小料时按空杯处理。

在施力 tick 再按同一规则筛选当前存活对象，按 entityId 升序施力。同一脉冲中，已经合成移除的父体不施力，新生成且有效的子体可以参与。接受和脉冲之间正常发生的物理变化仍有效，动作被接受后不因目标随后离杯自动退次。

向上增量以配置初值为目标。若当前向上速度加增量超过动作上限，只增加到上限。已经超过上限时本动作不再增加向上速度，不能突然反向刹停。向下运动的小料在本次冲量后仍可能向下，按真实动力结果呈现。

水平方向采用确定性小扰动。令 u 为小料相对杯中心的归一化位置，限制到 [-1, 1]，水平增量取 `-u × horizontalMax + parity(entityId) × scatter`，再限制到 ±`horizontalMax + scatter`。中间区域也有轻微错位，靠壁区域主要朝中心扰动。不得消耗掉落随机数流、使用 `Math.random()` 或遍历顺序决定力的方向。

### 4.4 一次脉冲与失败回滚

继续复用 `shake.activeStartTick` 和快照 tick。在且仅在 `nextTick === activeStartTick + launch_delay_ticks` 时执行一次脉冲。动作进行中的其他 tick 不继续加力。暂停不推进 tick，恢复只执行尚未到达的脉冲，已经保存脉冲之后的快照不再施力。

沿用 `advanceOneTick()` 的 checkpoint 和异常恢复。施力中途若某个刚体或 `stepFixed()` 抛错，恢复本 tick 前的全部物理状态、次数、活动时间、命令结果和领域状态，进入可恢复错误流程。对账以最近完整提交的存档为准，不自行补发额度。不能保留前几个小料已受力而后几个未受力的半完成状态。

### 4.5 主要修改入口

下表中的工程脚本路径均相对于 `奶茶挤挤/assets/scripts/`。

| 文件 | 必要调整 |
|---|---|
| 根 `config/design-baseline.json` | 新规则版本、动作参数与有效范围 |
| 根 `contracts/types.ts` | 最小二维脉冲接口，随后同步工程合同 |
| `core/ConfigLoader.ts` 与根 `tools/sync_design_config.py` | 新字段、单位、时长/速度关系和旧配置识别的双端校验 |
| `core/RunEngine.ts` | 命令合法性、目标筛选、一次脉冲、固定步边界和异常恢复 |
| `physics/CocosPhysicsAdapter.ts`、`physics/CoordinateMapper.ts` | DU/Box2D 换算、质量与质心冲量、真实速度上限 |
| `presentation/GameRoot.ts` | HUD统一状态、颠杯表现、教程、结果、旧规则提示和 Debug fixture |
| `persistence/SaveValidator.ts` | 新规则版本合法性及恢复状态校验 |
| `persistence/SaveCodec.ts`、`persistence/SaveMigration.ts` | 复核现有行为，仅在必要字段或兼容缺陷被证实时改动 |
| `application/RewardedShakeService.ts`、`application/SpillReviveService.ts` | 核查文案、权益到账和候选恢复与新动作的衔接，复用既有账本 |
| `platform/TapRewardedAdProvider.ts` | 广告开通后按本次官方配置做必要适配 |
| 根 `tools/verify_rewarded_shake.cjs`、`tools/strip_p1c_release_debug.cjs` | 新动作回归、原断言预期及必要的新增 Debug 入口裁剪 |
| 根 `tools/build_taptap_minigame.py` | 复核 staging 门禁及最终包 buildId 的一致性 |

当前额外颠杯策略唯一源为根 `config/rewarded-ad-policy.json`，对应资源镜像为 `奶茶挤挤/assets/resources/config/rewarded-ad-policy.json`。复活策略当前实际位于 `奶茶挤挤/assets/resources/config/spill-revive-policy.json`，根 config 尚无同名文件。先遵循实际入口维护，不能只创建一份运行时未读取的配置并声称接通。

## 5. BUMP-02 表现与调度

### 5.1 动作分段

| 相对时间 | 表现 | 物理与输入 |
|---|---|---|
| 0 至 0.10 秒 | 杯身短暂下压 6 DU，按钮立即反馈 | 命令已接受，锁定重复颠杯 |
| 0.10 秒 | 杯身开始上弹 | 施加一次物理脉冲 |
| 0.10 至 0.25 秒 | 杯身上弹至最大 12 DU 后返回 | 小料按物理轨迹弹起 |
| 0.25 至 0.65 秒 | 杯身归位，小料自然下落 | 动作仍处于活动期 |
| 0.65 至 1.00 秒 | 按钮显示稍等片刻 | 物理继续，颠杯处于冷却 |

杯体前后层、杯影与现有特效按图层关系协调。视觉偏移不能应用到动态小料父节点、HUD 或物理碰撞节点。视觉杯身位移仅作短促反馈，最大相位差须在录像中检查，避免看起来小料穿过杯底或杯口。

优先复用 `shake_start`、已有特效和图标。若真实听感或图形方向明显不合适，再做最小替换并记录素材来源。用户的 reducedMotion 开关只降低杯身位移和特效强度，实际受力、额度、计分和结果与普通模式一致。

### 5.2 自动落料、拖杯与危险判定

- 颠杯活动期间，自动落料按现有活动期阻塞逻辑处理。保留 pendingSpawn 和生成器状态，不积累多次补发。
- 动作期结束时，若原定落料已到期且杯口可生成，只释放一颗，之后继续正常间隔。杯口受阻走原 blocked retry。
- 冷却期允许正常自动落料。
- 左右拖杯继续由 Kinematic 杯体逻辑控制。颠杯视觉使用独立的表现偏移，与真实 X 位置叠加，不能覆盖拖杯状态或把杯移回中心。
- 危险线计时、洒出判定和复活资格沿用领域规则。颠杯期间继续计算危险时间。
- 后台、手动暂停、广告、模态框和教程暂停使用已有统一时钟路径，恢复时不补算后台时间。

## 6. BUMP-03 存档、规则版本与旧局

### 6.1 本轮默认策略

新规则使用新 `design_rules_version`，计分纪录按现有 `bestScoresByRules` 分桶。现有快照的 `shake` 字段足以记录一次脉冲的时序，本轮优先沿用 run schema 5，profile schema 3 和 envelope schema 2。只有实现证明缺少必要持久字段时才提出具体 schema 变更与迁移方案。

旧规则未完成局沿用当前工程的保护流程。校验成功后保留原档，显示规则更新提示，玩家可以取消并保留原局，或明确确认开始采用颠杯的新局。此策略的结果是旧规则活动局不会直接接入新物理规则。实施前核对 GameRoot 当前行为一致，并在更新说明中交代。

取消、读取失败、资源加载失败和新局保存失败都不能先清除旧槽或旧 activeRunId。仅在玩家确认且新 bundle 提交成功后切换活动局。保留旧 profile 设置、历史纪录和已提交奖励账本，不重置免费次数或把旧局 receipt 转移给新 run。

### 6.2 需要调整的位置

- `SaveValidator` 的已知规则版本列表、配置加载、菜单旧规则提示、教程规则标记与新局创建。
- `RunEngine` 的 snapshot/restore 一致性、冷却边界与活动期计算。
- 保存发生在预备期、脉冲当步之后、下落期、冷却期和广告 pending 时的恢复。
- `SpillReviveCandidate` 的候选哈希仍包含 tick、shake 及物理状态。清理候选、提交复活和恢复后不能重放已经发生的脉冲。
- `renderPlaying()`、`refreshHud()`、Debug fixture 及回归脚本中 48/78 等常量，按规则推导改写。

收到领域命令的 APPLIED 结果后刷新已用次数，接受前的按压反馈不代表已扣次。保存失败走现有技术错误路径，按最近完整提交的快照恢复，恢复后的物理状态与次数必须一致。已提交广告权益仍按免费幂等恢复处理。禁止以仅内存模式掩盖持久化故障。

## 7. BUMP-04 与 ADS-01 激励视频

### 7.1 复用现有实现

沿用 `TapRewardedAdProvider`、`RewardedAdCoordinator`、`RewardedShakeService`、`SpillReviveService`、`RewardLedger`、`ReviveLedger` 和 CAS/receipt 提交流程。

业务收益如下。

| 入口 | 收益 | 约束 |
|---|---|---|
| 免费颠杯用完后的自愿观看 | 额外颠杯次数 +1 | 当前每局最多额外 5 次、当前每日奖励颠杯最多 5 次，沿用既有策略 |
| 洒出后的自愿观看 | 同 run、同分继续 | 每局最多一次成功复活，恢复后保留 120 tick 自动落料缓冲 |

复活继续保持无额外每日上限。受助局分类、首局/教程门槛和已提交权益免费恢复规则继续有效。颠杯改名只影响展示，不改 receipt 的 rewardKind 或历史账本键。

### 7.2 真实接通步骤

1. 用已安装官方 TapTap Skills 和 MCP 广告工作流核对当前应用 1021353。
2. 查询服务端广告状态。未开通时给出本次官方返回的开通入口，继续其他本地开发，状态记为等待平台。
3. 生效且配置有效后，读取本次官方指南，核对 Cocos Tap 小游戏和当前运行时 API，映射到现有 Provider。
4. 通过配置唯一源更新额外颠杯与复活策略，并校验工程资源镜像。复活策略按实际 canonical 路径维护，先定位，不猜文件。
5. 用全新 buildId 生成开启广告的候选并记录 SHA。关闭广告的旧包验证只能覆盖对应旧包。
6. 在 Tap 宿主验证真实加载、播放、关闭、奖励持久化和再次进入的结果。

不向用户索要手工广告位 ID。使用本次官方工具返回的有效配置。`tap.createRewardedVideoAd` 支持 `adUnitId` 和 `multiton`，按 3.8.8 工程现有每次 attempt 实例管理核对监听解绑和 destroy。参数支持参考 [官方 API](https://developer.taptap.cn/minigameapidoc/dev/api/ad/tap.createRewardedVideoAd/)。

### 7.3 必验异常

完整观看以 SDK 可信完成事件为依据。提前关闭、未完整观看、无库存、load/show 失败均不发奖。两入口互斥，重复/晚到 close、页面换代、旧 run 回调和重复点击均最多提交一次。

receipt 已提交但回读/显示/应用失败时，免费幂等恢复已到账差额。不得要求再看一遍。只看 toast、弹窗关闭或 Provider 返回 completed 均不能单独判定收益到账，须核对 revision、runId、receipt 和剩余次数/复活状态。

## 8. BUMP-05 功能和错误恢复验证

### 8.1 领域与适配器回归

扩展现有 `tools/verify_rewarded_shake.cjs` 或已存在的相邻物理验证入口，保留原 185 项的业务覆盖。受新玩法影响的旧断言按新规则更新预期，并记录对应原因。测试总数不作为验收目标。

| 用例 ID | 必须验证的行为 |
|---|---|
| BP-01 | 点击一次只扣一次，合法额度由领域命令决定，重复 command 不重复消费 |
| BP-02 | 空杯、只有杯外小料、暂停、冷却和额度不足时不扣次 |
| BP-03 | s+5 无脉冲，s+6 恰好一次，s+7 不重复，39/60 tick 活动与冷却边界正确 |
| BP-04 | 不同质量实体获得同设计速度增量，中心冲量单位正确，睡眠刚体被唤醒 |
| BP-05 | 移除父体、当前子体、杯偏移和杯外实体的目标筛选正确 |
| BP-06 | 不消耗掉落 RNG，entity 遍历顺序变化不影响扰动分配 |
| BP-07 | 半途暂停、后台、保存和恢复不重复脉冲或扣次，冷却剩余 tick 一致 |
| BP-08 | 第二个实体施力故障或 stepFixed 故障触发全步回滚，位置、速度与额度一致 |
| BP-09 | 自动落料最多释放一个到期 pendingSpawn，活动期与冷却期区分正确 |
| BP-10 | 连续合成一次计分，危险线、洒出和复活候选哈希仍有效 |
| BP-11 | 旧规则取消保留存档，新局提交失败保留旧活动局，确认成功才切换 |
| BP-12 | 额外次数、两广告互斥、已提交权益免费补发与旧 receipt 不跨局生效 |

物理层必须在真实 Creator/Box2D 中补充 BP-04/05/08 的可观察结果。Node adapter 替身负责时序和领域断言，不能据其通过认定真实受力有效。

### 8.2 真实浏览器操作

在 Web Debug 的已有 fixture 体系加入最少量确定性场景，先查当前 fixture/裁剪工具的 AST 约束。任何新增 Debug 入口均须与 Release 裁剪同步验证。

- 松散半杯场景中，选出至少三颗不相交的小料，点击一次，录制 60 Hz 逻辑对应的实际画面。至少一颗相对无操作对照向上重排达到 20 DU；普通松散目标争取 20 至 60 DU 的可见弹起。此为调参验收目标，不直接修改实体坐标制造位移。
- 堆叠半杯场景中，对比同一初态的无操作与颠杯结果，记录目标数量、实际速度、位置与新接触，证明有真实重排。
- 满杯与危险线场景中，检查正常危险累计与洒出，不能依靠停止危险计时来通过。
- 点击、快速重复点击、拖杯同时点击、次数耗尽、暂停继续、刷新续局与 reducedMotion 各走一次完整链路。
- 真实点击菜单、新局、教程、颠杯、暂停、返回菜单与再次开局，检查按钮状态、坐标命中及可读性。

若初值未达目标，先记录 DU 到物理单位换算、速度钳制、质量和接触约束，再调速度或表现参数。不能仅把画面振幅调大后宣布物理效果完成。

### 8.3 错误恢复

复用已有 `P1BStartupOverlay` 与 `BootDiagnostics`。检查新局保存失败和普通界面渲染抛错时，详情可读，恢复/返回菜单可点，旧存档可保留，解除故障后可以开新局。

优先通过测试环境注入仓储失败和渲染异常。必要时在已有 Debug fixture API 中加极小入口，Release 裁剪必须移除该入口。这里要求完成实际点测，不能只静态阅读后把本项记为通过。实测发现缺陷后再修改错误层实现。

## 9. BUMP-06 固定门禁与候选交付

本地检查从根目录执行，先核对脚本帮助和当前实现。

```powershell
python -X utf8 tools/sync_design_config.py --check
python -X utf8 tools/sync_client_contracts.py --check
npm run typecheck --prefix 奶茶挤挤
npm run verify:host-utf8 --prefix 奶茶挤挤
node tools/verify_rewarded_shake.cjs
node -e "globalThis.TextEncoder=undefined; require('./tools/verify_rewarded_shake.cjs')"
npm run verify:art --prefix 奶茶挤挤
```

改动唯一源之后先按各同步脚本实际 `--sync` 命令更新镜像，再执行检查。只读 `--check` 不能代替同步。

构建使用现有 `tools/build_cupauto_web.py` 与 `tools/build_taptap_minigame.py`。先通过 Web 操作，再顺序生成一个 Tap 候选。新 buildId 每次唯一，版本高于平台当前同类版本，不硬编码占用过的输出目录。同一时刻只跑一个 Creator 构建。

Tap 包必须满足以下检查。

- UTF-8 门禁只检查实际 staging，在 Creator 前失败即停止；宿主全局缺失、不可构造或构造抛错仍通过正常源码。
- source manifest、staging manifest、buildId、工具版本、构建命令、ZIP 字节/SHA 和门禁日志可追溯。
- 检查主资源脚本内嵌的 buildId 与本次构建一致，发现旧 buildId 就停止交付。
- ZIP CRC、真实资源映射和派生资源哈希通过。资源数量按当前 catalog 核对，有意替换素材时记录差异。
- Release 无新增 Debug 注入入口、Fake Provider、Mock、fixture 全局和 source map。裁剪失败须修复精确目标，不能放宽 expected 数量。
- 用户反馈通过只记录在对应证据，不回写历史 result.json 伪造构建时的宿主状态。

上传后记录 `ZIP SHA → package_id → 专属自测入口 → 手机 buildId → 实际操作结果`。平台版本标签或大小相同只能作为辅助线索。用户先前上传 444838 不代表授权上传新包。

## 10. HOST-01 与 PERF-01 真机关闭条件

### 10.1 功能矩阵

| 场景 | 通过标准 |
|---|---|
| 冷启动与新局 | 顶部 buildId 对应当前候选，菜单和杯/HUD 完整，首存档回读成功 |
| 颠杯 | 半杯可见真实重排，按钮状态正确，拖杯不跳位，连续操作无物理中断 |
| 暂停与续局 | 暂停/后台/重启分别恢复正确时序和额度，旧档保护符合第 6 节 |
| 错误恢复 | 可读首错、可点击恢复或返回，随后可重新开始 |
| 真实激励视频 | 两业务点看完到账一次，取消或失败不发奖，回读后保持 |
| reducedMotion | 视觉减弱，真实玩法、次数和结果一致 |

### 10.2 性能采样与开发触发

ADB 可用时先确定真实 Tap 宿主及相关子进程，不假设包名。记录设备型号、系统、Tap 版本、buildId、采样时段和口径。覆盖冷启 5 次、热启 5 次、菜单、开局、半杯连续颠杯、5 分钟运行、10 轮开局返回，以及广告前后。

记录 PSS/RSS、启动耗时、峰值时段与进程归属。Android 采样频率可能漏峰，保留平台报告与采样差异。出现重复创建未释放、纹理峰值、监听增长或加载阻塞后，按具体证据调整一个主要来源并同机复测。

此前约 400 MB 问题若仍属平台拒绝项，由平台复测或原失败设备同口径结果关闭。禁止把 ZIP 体积、理论纹理 RGBA 或另一台设备单次成功当作关闭证据。

## 11. RELEASE-01 平台事项与依赖

| 事项 | 当前线索 | 下一步与责任 |
|---|---|---|
| 主包草稿引用 | 433619 已不在最近候选列表，资质查询返回版本不存在 | Agent 只读核对草稿和可用包，生成有效包替换差异。用户确认具体绑定范围后才写入并读回 |
| 包体声明 | available/declared 与小游戏列表曾不一致 | 复查实际后台与官方工具结果，必要时用户联系平台核实 |
| 资料必填 | `region_flag_ios` 缺失 | 展示准确字段语义与可选项，由用户明确实际发行范围，不能代填猜测 |
| 资质与隐私 | 当前客观状态读取受草稿引用阻塞 | 引用恢复后重新分析必须项和客观状态，敏感材料由用户在官方页面填写 |
| 广告开通 | 最近状态未开通 | 用户按官方返回入口办理，完成后 Agent 刷新一次并继续 ADS-01 |
| 自测设备 | 用户可手机自测，ADB 此前未发现设备 | 用当前候选自测码继续，必要时连线并接受 RSA |
| 提审与发布 | 当前尚无完整通过证据 | 候选、资料、资质和真机证据齐备后，按官方流程确认并提交 |

资质应依据实际游戏事实和本次服务端分析判断。资质状态不可用就记为未知，不把所有空槽都列为必交项。普通小游戏前置备案办理规则参考 [官方前置备案](https://developer.taptap.cn/minigameapidoc/quick-start/guide/pre-filing/)，版本提交参考 [官方提审流程](https://developer.taptap.cn/minigameapidoc/quick-start/guide/game-publish/version/)。这些文档在 2026-11-07 核查，实施时再核对最新要求。

上传、包体声明/绑定修改、广告后台配置、资质提交、提审和发布分别遵循用户已给出的具体授权。已有明确授权沿用，尚缺的授权在完成可审阅的本地结果或差异预览后按具体对象提出。等待外部动作时继续独立本地事项。

## 12. 实施顺序和最终交付

1. 记录当前工作区差异与用户已验证候选，定位配置、合同、RunEngine、物理适配器和 GameRoot 的最小改动面。
2. BUMP-01/03 同步完成，再实现 BUMP-02/04。先用当前关闭广告策略完成可玩的颠杯。
3. BUMP-05 的领域、物理、浏览器与错误恢复通过后，完成 BUMP-06。
4. 从开始就只读核对设备、广告与平台草稿条件。条件具备时推进 ADS-01、HOST-01、PERF-01 和 RELEASE-01。
5. 有授权的新包上传后，生成对应包体的专属自测码并展示。先核对手机 buildId，再跑本轮场景。
6. 真机失败沿同一任务修复，必要时用新 buildId 构建并复测对应 SHA。证据归属明确，已通过的无关项不重复开工。

最终交付包括实际源码修改、最终参数、配置/合同镜像、相关回归、浏览器操作证据、新候选的路径/字节/SHA、平台包体 ID、真机与广告结果、性能状态，以及每个外部待办的具体责任人和动作。

完整开发通过且真机/平台证据齐备后才判断可提审或可交付。若外部条件缺失，交付可用候选和准确的等待清单，不将受阻事项扩大成新的客户端功能。

## 13. v1 执行提示词（历史）

```text
在 D:\Workspace\TapTap\奶茶挤挤 实施用户已选定的一键颠杯及上线前剩余开发。主设计为 docs/52-cup-bump-and-release-design.md。先读 AGENTS.md、docs52、docs/22-current-progress-and-resume.md 和 output/taptap-upload/CURRENT-CANDIDATE.md，按任务读取相关实现与官方 Skills，保护当前未提交修改。docs49/51 中已完成事项和旧提示词只用于查证历史。

先完成 docs52 的 BUMP-01 至 BUMP-06。将轻微左右晃杯改为固定步驱动的一次向上物理脉冲和轻微横向重排，覆盖配置唯一源、物理适配器、命令消费、自动落料、冷却、暂停/后台、存档、旧规则保护、HUD/教程/结果文案和两条奖励流程。内部 SHAKE、receipt 与 CAS 逻辑优先复用。参数是待调初值，必须用真实 Creator/Box2D 和浏览器点测确认效果。按 docs52 的 BP-01 至 BP-12 覆盖关键回归，原185项业务覆盖保留，受需求改变的物理/时序断言记录变更原因。实际点测错误层的恢复与返回菜单，测试注入只存在于 Debug 并证明 Release 已裁掉。

保持 TextEncoder 已修路径与实际 staging UTF-8 强制门禁，检查新包内嵌 buildId。旧存档按现有取消保留、确认新局的策略保护，保存失败不能提前替换旧活动局。新规则使用新 rulesVersion，纪录分桶和教程规则标记一致。按现有命令完成类型、配置/合同镜像、UTF-8、奖励链、资源和裁剪检查，Web 实操通过后顺序生成全新 buildId 的 Tap 候选，记录 source manifest、完整ZIP SHA256和字节数。

同步只读检查503251/1021353的广告、草稿包引用、资料和设备。用户已经确认444838版本可自测，后台版本1.7.0与本地host6大小一致，平台列表未返回SHA。host3截图不能当作新候选运行证据。当前用户反馈晃杯效果弱是本轮玩法改动依据。

按官方广告工作流执行 ADS-01。最近广告未开通，现有两入口策略关闭。条件具备后使用本次官方返回的有效配置接通现有Provider，验证真实看完后额外颠杯+1、洒出同局同分复活，每局最多一次成功复活、120tick缓冲。取消/失败不发奖，重复/晚到回调不双奖，已提交权益免费恢复。广告未开通时继续本地开发，保留明确等待平台状态。

按 HOST-01/PERF-01 继续同SHA Tap实测和性能采样。按 RELEASE-01 复查草稿引用433619失效、region_flag_ios缺失、资质读取受阻与包体声明异常。每个问题先读取当前事实，再给最小差异和可执行下一步。上传、绑定/声明修改、广告配置、资质提审与发布遵循用户已有具体授权，尚未授权的外部写入在结果可审阅后提出针对性确认，不反复询问已授权步骤。

持续推进到当前授权范围内的本地开发和验证完成。不要只输出计划。外部条件具备时沿同一清单继续修复验收；条件不足则为每项记录证据、责任人和唯一下一动作。更新 docs52实施状态、docs22、候选入口和必要导航。最终报告实际改动、参数、测试、候选路径/SHA、真实广告和宿主结果、性能状态及尚待用户/平台动作，不以构建成功替代上线验收。
```

## 14. 实施状态（2026-11-07 本轮）

### 14.1 BUMP-01 至 BUMP-06

| 项 | 状态 | 落地内容 |
|---|---|---|
| BUMP-01 | 完成 | `design-baseline.json` 规则版本 `design-v0.6-cup-bump-01`，shake 改为 `motion=bump_v1` 与速度脉冲参数；`sync_design_config.py`、`ConfigLoader.ts` 增加 motion、有限性、launch_delay<动作时长、线速度上限与视觉位移边界校验；合同删除 `applyHorizontalAcceleration`，新增 `applyVelocityImpulse` 并同步镜像 |
| BUMP-02 | 完成 | `CocosPhysicsAdapter.applyVelocityImpulse` 在真实刚体上按实际质量换算冲量，`applyLinearImpulseToCenter` 唤醒休眠体；Debug probe 记录质量、换算后 delta、冲量与施力前速度 |
| BUMP-03 | 完成 | 一次 SHAKE 仅在 `activeStartTick+6` 施加一次脉冲；目标限定 `hasEnteredCup && spillTicks===0 && 当前杯轮廓内`；空杯返回 `杯里还没有小料` 且不扣次数；遍历顺序不变 |
| BUMP-04 | 完成 | HUD 由 `shakeControl()` 单一状态源驱动（颠杯中/稍等片刻/颠杯 N/奖励颠杯 N/奖励待确认/看视频+1/次数已用完）；杯身仅做 Y 轴压缩 6DU 与回弹 12DU 的表现位移，不改碰撞体；reducedMotion 缩放为 0.35；教程第 3 步、结果、奖励与错误文案统一为「颠杯」 |
| BUMP-05 | 完成 | 回归 193 项（原 185 项保留）覆盖脉冲、目标、冷却、暂停、自动落料、存档、奖励；新增 BP-08 施力故障回滚与重试 |
| BUMP-06 | 完成 | 奖励账本复用 baseUsed/extraGranted/extraUsed，奖励颠杯与基础颠杯共用同一脉冲；旧规则存档仍按取消保留、确认新局保护；刷新恢复绑定同 runId、分数、tick、次数与 cooldown |

### 14.2 最终参数（调试初值，已通过真实 Box2D 点测）

| 参数 | 值 | 说明 |
|---|---|---|
| motion | `bump_v1` | 只允许该模式 |
| base_per_run / extra_max_per_run | 2 / 5 | 基础次数与每局奖励次数 |
| duration / cooldown | 0.65s(39 tick) / 0.35s(21 tick) | 合计 60 tick，等于设计冷却 |
| launch_delay_ticks | 6 | 命令接受后第 6 tick 施加 |
| vertical_delta_velocity | 320 DU/s (3.2 m/s) | 按真实质量换算冲量 |
| horizontal_delta_velocity_max / scatter | 70 / 20 DU/s | 向心重排 + 按实体 id 奇偶的确定性散布 |
| max_upward_velocity | 420 DU/s (4.2 m/s) | 向上速度上限 |
| visual_compress / visual_rebound | 6 / 12 DU | 仅表现层 Y 轴位移 |
| guaranteed_merge | false | 不作保证合成 |

真实浏览器实测（`shake-mass`，静置后点击）：质量 0.1017876 与 0.1809557 的实体在同一颠杯中都获得 3.2 m/s 的 `deltaBox2D.y`，冲量分别为 0.32572 / 0.579058；相对静置基线向上重排 48.5 / 47.6 DU，峰值上升速度约 303 DU/s，满足 BP-04 的 20–60 DU 目标。水平方向为向心加固定散布，两侧 delta 为 ±5.68 DU/s。

### 14.3 BP 验证证据

| 编号 | 证据类型 | 结果 |
|---|---|---|
| BP-01 | 静态/回归 | 配置、合同与工程镜像一致；规则版本进入存档白名单 |
| BP-02 | 真实 Box2D | 每次颠杯每条目标恰好一次冲量；`preStepIndex` 无重复施力 |
| BP-03 | 回归 + 浏览器 | 回归验证 s+5 无脉冲、s+6 一次、s+7 不重复；浏览器 activeStartTick=53，脉冲在 tick 59 |
| BP-04 | 真实 Box2D/浏览器 | 静置后 48.5/47.6 DU 上升，质量不同、速度增量相同；截图 `bp03-bump-rise.png` |
| BP-05 | 真实 Box2D | 水平向心 + 奇偶散布，`deltaDu.x` 为 ∓5.68 DU/s |
| BP-06 | 回归 + 浏览器 | 遍历顺序不变，每条实体仅一次；第二杯 3 条实体各一次 |
| BP-07 | 回归 + 浏览器 | 冷却 s+59/s+60 边界；暂停期间 tick 与 probe 均冻结（255/2，600ms 不变），恢复后单次脉冲；刷新后同 runId、tick 209、baseUsed=1、恢复 PAUSED，继续后 tick 234 且不补扣 |
| BP-08 | 回归 | 第二实体施力抛错时回滚到本 tick 前状态并暂停，`restoreBodies` 被调用；恢复后重试每条实体一次、额度不重复扣减 |
| BP-09 | 回归 + 浏览器 | 活动期不释放到期 pendingSpawn，窗口结束后最多释放一颗；浏览器 dropIndex 只按间隔增长 |
| BP-10 | 回归 + 浏览器 | 合成/危险/洒出/复活流程与哈希不变；真实浏览器发生合成与计分 |
| BP-11 | 回归 + 浏览器 | 旧规则局保留不覆盖；真实局刷新后同 runId、分数与次数一致 |
| BP-12 | 回归 + 浏览器 | 次数耗尽点击不再产生脉冲（probe 5→5），按钮显示「本局次数已用完」，提示「广告奖励尚未开启」；奖励流程互斥/权益恢复沿用既有回归 |

浏览器证据：`evidence/CupAuto/20261107-bump02-web-debug-01/web/runtime/browser-runtime-result.json`、`browser-runtime.cjs`、`bp03-settled-before-bump.png`、`bp03-bump-rise.png`、`bp07-paused-pre-delay.png`、`bp07-resumed.png`、`bp12-hud-exhausted.png`、`bp11-real-run-refresh.png`。构建 buildId `20261107-bump02-web-debug-01`。

本轮同时修正一个表现层缺陷：颠杯按钮回调原先捕获渲染时快照，导致冷却结束后仍按旧状态判断而无法提示次数耗尽；改为回调时读取 `engine.snapshot()`，BP-12 证据已复验。

### 14.4 门禁与候选

- `sync_design_config --check`、`sync_client_contracts --check`、typecheck、`verify:host-utf8`、`verify:art` 通过；回归 193 项在普通宿主与缺失 `TextEncoder` 两种环境均通过。
- Tap 候选：`build-artifacts/cocos-taptap-minigame-build/20261107-bump01-tap-candidate-01/TapBuild/game.zip`，版本 1.7.2，buildId `20261107-bump01-tap-candidate-01`。
- ZIP 3,036,668 字节，SHA256 `fd7239e226f9e5a1acd07cdb7c55fe6c84faa52fe996f266b65eddc8870e8b11`，398 文件（77 PNG），解压 5,192,757 字节；源码清单 315 项，`originalSourceChanges=[]`。
- staging 强制 UTF-8 门禁 PASS（110 样本 / 660 比较，6 种宿主模式）；包内 `assets/main/index.js` 仅含本次 buildId 一次，无旧 buildId、无 Debug API 字符串、无 source map；包内规则版本 `design-v0.6-cup-bump-01` 与 `bump_v1` 存在，旧 `acceleration_amplitude` 已不存在。
- 证据：`evidence/TapTap/20261107-bump01-tap-candidate-01/`（result.json、package-identity.json、staged-source-manifest.json、host-utf8-gate.log）。该包仅本地转换通过，未上传、未真机、未平台验收。

### 14.5 平台只读核对与外部动作

- 广告：1021353 当前「未开通」，`check_ads_status` 未返回 space_id，现有两入口策略保持关闭；ADS-01 等待用户在 <https://developer.taptap.cn/forge/503251/app/1021353/operation/ad-monetization> 开通后重新检查。
- 草稿引用：当前草稿主包仍指向 433619（不在可用列表，查询资质返回 422/版本不存在）；可用小游戏包为 444838(1.7.0) 与 443886(1.6.0)。系列任务需先由用户授权把草稿绑定到有效包，再重跑资质分析。
- 资料：图标、3 张截图、宣传图与视频已填；`region_flag_ios` 缺失（`MISSING_REQUIRED`），`developer_message` 为建议项，实机演示视频未填；`app_platforms=MOBILE`。
- 资质：因草稿包引用失效，客观状态读取受阻，不能判断缺口；不把空槽全部列为必交。
- 设备：本机 ADB 未发现设备，HOST-01/PERF-01 等待用户连接手机并接受 RSA。
- 提审/发布：无完整通过证据，不提交；上述写入均需用户对具体对象授权后执行。
