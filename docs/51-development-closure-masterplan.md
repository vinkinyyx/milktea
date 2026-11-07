# host5之后：开发闭环总设计与执行提示词

2026-11-07 更新。用户确认当前开发包可自测，并选定一键颠杯。下一轮实施入口为 [docs52](52-cup-bump-and-release-design.md)，其中包含新的开发队列和执行提示词。本文保留历史任务、过程与证据。

核验基准：2026-11-07。本文把目前已知的客户端开发事项、真机/平台门禁和最终包验收收敛到一个有限闭环。执行入口优先级高于历史接力文档；业务约束仍以 `AGENTS.md`、docs49、docs50及配置唯一源为准。

## 1. 结论：`TextEncoder` 同类错误还会不会出现

**由已修复的这条代码路径再次触发同一个 `TextEncoder is not a constructor` 错误，按当前源码不会。** `奶茶挤挤/assets/scripts/core/Sha256.ts` 的 `sha256Utf8()` 已统一使用项目内UTF-8编码实现，不再读取或构造宿主 `TextEncoder`。因此 Tap 宿主把该全局设为缺失、`null`、普通对象、不可构造函数或构造即抛错，都不会影响这条哈希路径；对SHA-256输入字节的比较已在660个样本中通过。

这不是对未来所有版本、所有启动故障的绝对保证，原因有两项：

1. `tools/verify_host_utf8.cjs` 当前是独立测试脚本，没有接入 `奶茶挤挤/package.json` 的固定命令，也没有作为 `tools/build_taptap_minigame.py` 的构建前门禁。若后续源码又引入宿主API依赖，开发者可能忘记运行它。
2. 新1.7.0 host5包尚未由用户在Tap宿主实测。代码和候选包通过本地检查，不等于Tap宿主已正常进入菜单、创建新局并写入存档。

所以明确区分：

- **同一根因的代码回归风险：低，能通过把UTF-8回归加入强制门禁进一步压低。**
- **host5在Tap宿主是否开局：待同SHA真机验证。** 必须看手机诊断条buildId为 `20261107-host5-utf8-candidate-01`，并确认杯、HUD、落料和可操作按钮；上传过旧包或只看到背景不算host5结果。
- **其他宿主兼容/渲染/性能故障：仍可能发生。** 必须根据新buildId、阶段码和真实首错逐一处理，不能把所有问题都归到TextEncoder。

## 2. 当前基线与不重复开工项

### 2.1 当前候选

| 项 | 当前事实 |
|---|---|
| 目标 | Cocos Creator 3.8.8 + Tap扩展1.2.2 的Tap小游戏 |
| 应用 | developer `503251` / app `1021353` / miniAppId `tapmccrbqbepy6dfz3`，用户已确认 |
| USB路径 | 安卓USB调试，用户已授权；此前ADB无设备，需连接并RSA允许 |
| 当前代码候选 | buildId `20261107-host5-utf8-candidate-01`，版本1.7.0 |
| ZIP | `build-artifacts/cocos-taptap-minigame-build/20261107-host5-utf8-candidate-01/TapBuild/game.zip` |
| SHA256 | `b0a3217d9b4e1442a6228390c3b732eae90bc559b400cd902710fa527077b840` |
| 包本地结果 | UTF-8 660项、奖励回归普通及无TextEncoder各170/0、typecheck、资源78项与ZIP CRC通过；`runtimeVerified=false` |
| 广告 | 两策略均 `enabled=false`、`adUnitId=null`；不能真实展示广告，也不能假称广告功能通过 |
| 性能 | ZIP约3.04MB不是设备内存指标；此前约400MB问题没有同机同口径新证据 |
| 平台登录 | CLI曾有效；广告MCP遇到服务端 `TOKEN_REVOKED` 与本地缓存状态冲突。执行前需重新只读确认，不假设仍相同 |

前轮170项奖励逻辑、CAS/receipt恢复、广告回调幂等等已有本地回归证据。**没有新代码修改或新失败，不要重复重写这些已通过模块。** 94baeac3及host4是历史候选，host5才是本次TextEncoder修复包。

### 2.2 仍有效的产品不变量

- 窄杯、自动定时落料、拖杯、同级碰撞合成；动态小料依靠物理世界，不用动画直接搬动刚体。
- 免费晃杯两次；额外次数只有真实激励广告顶层 `onClose.isEnded === true` 后记账。
- 小料洒出可自愿看完广告，同run同分复活；成功复活每局至多一次，保留120tick缓冲，不添加未经授权的每日复活上限。
- 取消/失败/未看完不发奖；权益已经持久化但显示/应用失败时免费幂等恢复，不重看广告。
- 不清用户存档、不切换应用/平台路线、不用Mock冒充真实广告、不改商店资料/绑定/声明来绕过问题。

## 3. 有限开发队列

执行者先完成A类不依赖平台的客户端工作，再按B类证据触发条件处理。没有证据支持的“预防性重构”和无关新功能不列入本轮范围。

### A类：现在可以独立完成的开发与验证

| ID | 事项 | 精确实施 | 完成判据 |
|---|---|---|---|
| DEV-01 | 把宿主UTF-8/SHA测试设为硬门禁 | 为 `verify_host_utf8.cjs` 增加 `奶茶挤挤/package.json` script（例如 `verify:host-utf8`）；将该命令纳入 `tools/build_taptap_minigame.py` 的隔离staging构建步骤，失败即停止Creator构建；同时在staging目录运行，保证校验的代码与本次打包输入一致 | `npm run verify:host-utf8 --prefix 奶茶挤挤`通过；模拟断言失败时构建在Creator前失败；正常构建记录该门禁结果；不得把脚本改成只检查源码字符串 |
| DEV-02 | 补完整存档调用链的宿主全局回归 | 将现有 `verify_rewarded_shake.cjs` 的无TextEncoder场景扩展到“新存档commit、readback、续局读取、checksum校验”；另注入不可构造函数/构造抛错两种全局，覆盖保存和读取。优先复用现有170项fixture，不复制整套奖励逻辑 | 三种异常全局下存档提交/回读和现有奖励断言一致；revision、runId、checksum不变；失败报错能定位具体case；不删减原170断言 |
| DEV-03 | 将候选包状态和测试证据互相校验 | 构建脚本/候选清单记录UTF-8门禁结果、源manifest、ZIP SHA、buildId；打包后 `result.json` 的 buildId/SHA与 `CURRENT-CANDIDATE.md`一致；禁止旧证据覆盖新候选 | 新候选目录只读复核可从buildId追到源码哈希和门禁日志；未跑宿主时仍明确 `runtimeVerified=false` |
| DEV-04 | 本地错误层行为回归 | 复用当前已有的独立 `P1BStartupOverlay`，为初始化失败/普通screen渲染抛错各建立可重复注入的测试入口；检查错误层在背景、UI、BootDiagnostics之上，触控可点“重试/返回菜单/诊断”；解除错误后开始按钮可操作。测试注入必须只在Debug/测试构建存在，Release包不得含入口 | 本地浏览器自动化覆盖两类错误并验证按钮实际执行；错误文案/buildId可见；关闭浮层后菜单恢复；Tap Release扫描不到测试开关、fixture API或Fake provider。该用例只证明本地错误层，不替代Tap宿主验收 |
| DEV-05 | 核对诊断信息脱敏与有界性 | 审查 `BootDiagnostics`、`StartupTrace` 在错误文本过长、循环错误、未处理拒绝时是否保持有界；保留阶段/首错/buildId，不把设备标识、用户存档内容、令牌输出到诊断条/日志 | 有界环不增长；摘要长度受限；错误层截图可读；正式包不含超量debug探针 |

**执行顺序：DEV-01 → DEV-02 → DEV-03；DEV-04/05只在现有代码检查发现必要性时做最小实现。** DEV-01/02是目前唯一明确的无外部依赖开发缺口。DEV-04是对截图“没有错误操作按钮”的本地复现能力补齐，不应在未复现时重写渲染架构。

### B类：有明确外部证据后才允许编码

| ID | 触发证据 | 可开发内容 | 验收边界 |
|---|---|---|---|
| DEV-06 | host5同SHA在Tap打开失败，手机顶部可读host5 buildId及首个阶段/错误 | 按首条错误修启动链、存档、Canvas、输入或资源；一次只修可证实根因，增加回归，重新buildId/ZIP/SHA | 故障旧证据仍保留；同SHA Tap重测；不以Web成功代替 |
| DEV-07 | host5进入错误页但Tap端仍看不到/点不到控件 | 针对实际失效的绘制层或触摸映射，补独立错误逃生层；核验Canvas排序、safe area、坐标转换、遮罩拦截、节点active和按钮回调；避免同时绘制两个互相遮挡的ERROR界面 | Tap中制造一条可控错误后可点“返回菜单/重试”；恢复菜单可开始新局；原存档不被破坏 |
| DEV-08 | 官方广告MCP重新授权，确认app1021353广告状态与本次原生Cocos适用的guide | 使用官方本次查询得到的当前配置映射现有 `TapRewardedAdProvider`；只做必要字段/生命周期适配；保持两个业务点互斥、可信完成、CAS/receipt和幂等恢复 | 普通/无库存/取消/失败/未完成均不发奖；真实完成晃杯+1及洒出复活符合产品规则；不复用示例ID、不把H5教程直接套入小游戏 |
| DEV-09 | Tap宿主采样确认内存高，并有阶段/资源/子进程数据 | 按证据优化启动资源加载、纹理生命周期、动画节点/监听释放或重复实例；先区分宿主常驻与游戏增量，再改一个主要峰值来源 | 同机、同Tap版本、同测试脚本前后对比PSS/RSS和启动耗时；无画质损失未经用户接受；ZIP大小和RGBA估算不能代替RAM |
| DEV-10 | Tap宿主物理或拖动/晃杯出现可复现新问题 | 用设备型号、buildId、触发步骤、首错/物理tick记录定位；只修真实复现项，新增确定性回归 | 标明普通/极端设备和物理时序；不得把限帧、吞tick或抑制报错当修复 |

## 4. 外部门禁（不是客户端开发任务）

这些项有真实执行入口，但必须由Tap后台、账号、人机交互或设备提供数据。不能靠增加代码或生成假数据将其“开发完成”。

1. **ADB设备**：手机USB调试已授权，但此前设备列表为空。连线、打开USB调试、手机上接受RSA；Agent用ADB确认状态为`device`后读取机型/系统和实际Tap宿主进程，不假设包名。
2. **广告MCP身份**：只读复核当前认证；若仍是TOKEN_REVOKED且官方工具要求重授权，用户按官方流程完成。不得清CLI登录、导出/复制令牌或把设备码落盘。
3. **应用与小游戏槽位**：固定核对503251/1021353，查清declared/available package type历史异常。先只读；需要改声明、绑定或资料时，展示具体差异和后果，取得该项确认后才操作。
4. **开发包上传**：用户此前上传旧包不等于授权Agent上传host5。上传host5前确认具体ZIP、buildId、SHA和仅开发自测范围；不提审、不发布、不替换线上包。
5. **真实广告开通**：先用官方工作流选1021353并check状态；只有当前响应有效、guide适用于Cocos Tap小游戏后才实现。若服务端未开通，按工具给的官方路径处理，不制造广告位ID。
6. **约400MB问题**：必须拿到原Tap拒绝报告/同机信息或当前真机同口径数据；USB每秒采样只能作为样本，记录PSS/RSS、冷启、菜单、PLAYING、广告、5分钟游戏和10轮进出。原失败机型缺席时，不能以另一台手机关闭原风险。

上述账号/设备/包体范围已在此前由用户确认：应用为1021353、安卓USB调试。此前是否同意重置广告MCP失效凭证、是否授权Agent上传具体新候选，不能从这两项确认中推导；真正需要时再展示具体动作请求一次。

## 5. Tap同SHA验收矩阵

所有证据绑定候选ZIP的SHA，而不是只看版本号。发现不一致时停止并找出实际运行的包。

| ID | 操作 | 必须观察到 | 失败处理 |
|---|---|---|---|
| TAP-01 | 从Tap开发自测入口冷启动host5 | 诊断条buildId正确；品牌/菜单和至少一个可操作按钮出现；无连续启动错误 | 截图含buildId和完整错误条；保存Tap版本/手机型号/新首错 |
| TAP-02 | 新局开始 | 杯、HUD、当前/下一个小料、控制按钮显示；落料按计时发生；首个存档可提交并续读 | 若存档失败，收集stage/code和是否留存旧档；不得点“仅内存”规避验收 |
| TAP-03 | 旧档续局 | 旧run、分数、profile/revision通过校验；可选择明确继续 | 不清档；记录迁移/校验错误 |
| TAP-04 | 故障错误层 | 可控错误能显示可读详情和可点击恢复/返回；返回后菜单交互正常 | 对齐DEV-07，只修宿主真实差异 |
| TAP-05 | 杯移动/晃杯/物理 | 按住拖杯跟手；频繁反向不抖动；晃杯有效且无异常回滚/物理中断；小料自然碰撞、合成和洒出 | 记录操作、物理tick、错误码/构建，不仅写“感觉慢” |
| TAP-06 | 后台与恢复 | 切后台不追赶后台物理时间；回前台按规则暂停/继续；局面和计分一致 | 记录切后台时长、屏幕状态与日志 |
| AD-01 | 免费晃杯用完后点击额外机会 | 用户主动选看广告；真实完整关闭后额度+1仅一次 | show失败/取消/未完成无额度变化 |
| AD-02 | 小料洒出时选复活 | 完整视频后同run同分继续、revive used=1、落料缓冲120ticks；本局第二次失败不再给复活 | 不创建新局、不清分、不自动复活 |
| AD-03 | 广告故障/关闭竞态 | 两广告互斥；取消/失败可重试或结束；重入/晚到close不双奖；提交后应用失败免费恢复 | 用本地故障注入覆盖罕见回调；真实和模拟证据分开报告 |
| PERF-01 | 冷启/热启/连续游戏 | 至少冷启5次、热启5次、5分钟运行、10轮开局返回；记录启动耗时和宿主/关联进程PSS/RSS | Android采样可能漏峰；平台原报告和原失败设备仍须纳入 |

## 6. 最终包晋升标准

只有同时满足下列条件，才把候选标为最终交付；否则候选状态保持准确，不允许只因没有其它本地代码可改就宣布发布合格：

- DEV-01/02关闭，当前代码经固定命令验证；typecheck、原170项奖励回归和配置/资源校验通过。
- 用单一Creator顺序构建新的唯一buildId；记录source manifest、工具/版本、构建日志、完整ZIP字节数和SHA256。
- 71 art + 7 effect/78项映射、ZIP CRC、资源hash、Release无Mock/fixture/source map等现有门禁通过。
- TAP-01至TAP-06中适用于当前功能的项通过；如真实广告位已启用则AD-01至AD-03实测通过。
- 性能数据覆盖实际Tap宿主；原400MB拒绝若仍是发布门槛，要由Tap平台回报或相同目标设备/口径复验关闭。
- 更新唯一候选入口、docs22、README和本文件中的证据；包SHA始终一致；不把外部未完成项写作通过。

## 7. 责任与停机条件：解决“每次到最后才说没完成”

- **Agent先做完所有A类**，不得因为等手机/账号就跳过DEV-01/02等可本地完成项。
- 开始时检查连接条件；如果需用户扫码/RSA/上传确认，立即给出确切对象、动作和最短步骤，并继续A类工作。
- 外部条件返回后沿同一执行清单继续，不另写一份计划再交回用户；发生代码失败则以证据定位、修复、重跑受影响门禁。
- 任一任务只能是`PASS`、`FAIL`、`WAITING_FOR_USER_ACTION`、`WAITING_FOR_PLATFORM`、`NOT_APPLICABLE`之一，并附证据、下一动作及责任人；不允许只写`BLOCKED`而没有下一步。
- “开发层面已无事项”指：A类全部通过；B类没有能在缺少触发证据时负责实施的改动；剩余项明确属于平台/设备/用户授权。该状态不等于Tap最终验收、广告已接入或性能合格。
- 无新增真实故障、需求或证据时停止扩展范围，不发明排行榜、云存档、商城等既有后续愿望作为本轮缺口。

## 8. 完整执行提示词

```text
在 D:\Workspace\TapTap\奶茶挤挤 继续完成当前奶茶挤挤项目。先读 AGENTS.md、docs/51-development-closure-masterplan.md、docs/49-final-delivery-platform-device-plan.md、docs/50-host-boot-injection-fix/spec.md 和当前候选清单；按适用范围读取官方TapTap Skills/最新指南。本文是本轮统一执行入口。

用户问TextEncoder错误是否会复发：当前 Sha256.sha256Utf8 已不依赖全局TextEncoder，特定同根因已修；但 verify_host_utf8.cjs 还未接入固定构建门禁，host5也未同SHA Tap实测。不要承诺所有未来版本绝无宿主问题，也不要把旧host3截图误当host5失败。

第一阶段必须完成本地A类开发，不得因等待手机或Tap后台而停止：
1) DEV-01：给工程增加明确的 verify:host-utf8 命令；将它接入 tools/build_taptap_minigame.py 的staging构建，必须在Creator之前执行且失败立即停止。测试执行的源码要与实际staging输入一致；失败注入验证门禁确会阻止Creator，不得仅grep关键字。
2) DEV-02：扩展现有verify_rewarded_shake测试，在TextEncoder缺失、不可构造、构造抛错时覆盖真实SaveCodec/LocalSaveRepository的新存档commit、readback、续局checksum，原170项有效断言全部保留。
3) DEV-03：门禁结果、buildId、source manifest、ZIP SHA可从result.json和CURRENT-CANDIDATE追溯；任何状态不得误报runtimeVerified。
4) DEV-04/05先检查是否有明确缺口。现有P1BStartupOverlay有独立绘制/按钮逻辑；没有本地可复现失败前不要重写UI或扩大架构。若实现了debug-only错误注入，必须证明release包不含入口，并用本地浏览器真实点测错误重试/返回菜单。

保护所有现有脏改动、历史ZIP、用户存档、素材原稿和凭据。先记录git status，禁止清理用户文件、提交/推送、上传或修改后台。按项目现有命令完成typecheck、host UTF8门禁、奖励170项及无TextEncoder完整回归、镜像/资源校验；只重跑受改动影响项并提供真实结果。

完成A类后，继续docs51第4节平台/设备门禁：用户已确认developer503251/app1021353/miniAppId tapmccrbqbepy6dfz3及安卓USB调试，不要再问目标应用或设备路线。重新检查ADB；需用户连线/RSA时立即清晰提示并等待设备可用，同时不停止其它独立工作。重新只读确认Tap CLI/MCP状态；如广告MCP仍TOKEN_REVOKED且官方OAuth流程要求重置，只针对该MCP失效凭证提出具体动作，不碰有效CLI凭证、不抄录令牌。先核实小游戏包体声明/槽位，绝不猜测切H5/Maker、清绑定或修改资料。

host5候选当前buildId=20261107-host5-utf8-candidate-01、version=1.7.0、ZIP绝对路径 D:\Workspace\TapTap\奶茶挤挤\build-artifacts\cocos-taptap-minigame-build\20261107-host5-utf8-candidate-01\TapBuild\game.zip、SHA256=b0a3217d9b4e1442a6228390c3b732eae90bc559b400cd902710fa527077b840。先核对文件存在及SHA。用户之前上传旧包不授权Agent上传host5；若要上传开发自测包，先展示该绝对路径/buildId/SHA及“只用于1021353开发测试、不提审不发布不替换线上包”的具体动作，按项目授权规则取得授权后再执行。构建/本地开发不能代替上传同SHA宿主验证。

拿到同SHA测试入口后按docs51第5节执行。优先确认host5诊断条，然后开始新局、存档/续局、错误按钮；只有复现host5错误或错误UI缺失，才依首错实施DEV-06/07根因修复并新buildId。旧存档不得删除。

真实广告仅在本次官方workflow返回的配置明确适用于Cocos Tap小游戏后实现DEV-08。应用状态按官方流程选择1021353并查询；不接受手工/示例广告位ID、不把H5代码套入、不把完整视频门槛实现成本地30秒计时。验证额外晃杯+1与洒出同局同分复活、每局最多一次、120tick缓冲、取消失败不发奖、重复/晚到不双奖、两入口互斥及已提交权益免费恢复。没有真实广告位时保持两个策略关闭并标记等待平台，不伪造通过。

性能只在设备/平台提供实际高内存或启动数据后做DEV-09；采集冷启/热启、菜单、PLAYING、广告、5分钟运行、10轮循环的启动时间与宿主/相关进程PSS/RSS，区分采样盲区和平台值。先归因再改，不能以ZIP大小或RGBA估算声称400MB已解决；不默认清除Tap数据或存档。物理只对复现问题做DEV-10。

对每项用PASS/FAIL/WAITING_FOR_USER_ACTION/WAITING_FOR_PLATFORM/NOT_APPLICABLE和证据/责任人/下一动作维护状态。先完成所有当前可执行的A类；对用户依赖尽早发出一次具体操作请求并在可行时继续其它工作；外部动作返回后继续执行直到A类全过、证据触发的B类修复闭环、同SHA真机/平台矩阵有真实结论、候选入口更新。没有用户输入或平台设备数据时，停在明确的等待状态，不得伪造通过；也不得只交一份提示词后不执行当前已授权的本地工作。

最终如实交付：源码/文档改动、每个门禁结果、候选路径/字节/SHA、同SHA宿主结果、真实广告状态、启动/内存证据及仍待外部执行的唯一具体动作。只有全部要求的同SHA真实门禁通过后才能称“可交付最终包”；如只剩用户/平台动作，要明确“开发层面已无可负责任地继续的代码项，但平台/真机最终验收仍未关闭”。
```

## 9. 更新规则

每次执行后更新本文件的任务状态和证据链接；变更本地代码后重新校验相应门禁。平台状态、ADB设备状态、广告开通和候选SHA都可能变化，执行前必须重新查询，不能把本文中的历史值当实时平台结果。

## 10. 2026-11-07 A类执行结果（host6）

| ID | 状态 | 证据与说明 |
|---|---|---|
| DEV-01 | PASS | `奶茶挤挤/package.json` 新增 `verify:host-utf8`；[build_taptap_minigame.py](../tools/build_taptap_minigame.py) 在Creator前对隔离staging源码执行[verify_host_utf8.cjs](../tools/verify_host_utf8.cjs)，6种TextEncoder形态/660比较，失败即停止。失败注入构建`20261107-dev01-gate-injection-01`在Creator前退出，无`creator.log`/ZIP：[result.json](../evidence/Acceptance/20261107-dev01-gate-injection-01/result.json)。正常构建门禁PASS：[gate.log](../evidence/TapTap/20261107-host6-gate-candidate-01/host-utf8-gate.log)。 |
| DEV-02 | PASS | [回归日志](../evidence/Acceptance/20261107-dev02-regression.log) 185 PASS/0 FAIL；无全局TextEncoder整轮[日志](../evidence/Acceptance/20261107-dev02-no-encoder.log) 同为185/0。新增15项覆盖缺失/不可构造/构造抛错下的真实`LocalSaveRepository` commit、readback、第二次提交后runId/checksum。原170项未删减。 |
| DEV-03 | PASS | host6 `buildId=20261107-host6-gate-candidate-01`，[result.json](../evidence/TapTap/20261107-host6-gate-candidate-01/result.json) 记录`hostUtf8Gate`、staging源SHA256、315项源manifest SHA256、ZIP字节/SHA、`runtimeVerified=false`；[CURRENT-CANDIDATE.md](../output/taptap-upload/CURRENT-CANDIDATE.md) 与ZIP实际值一致。 |
| DEV-04 | NOT_APPLICABLE | 静态复核未发现明确缺口：`P1BStartupOverlay`有独立绘制、全屏触控拦截、重试/返回菜单命中区和错误态防递归；未发现本地可复现的初始化/渲染错误，按计划不重写UI、不加注入入口。本轮未执行两类错误注入与浏览器点测，不替代TAP-04宿主验收。 |
| DEV-05 | PASS（静态） | `BootDiagnostics`错误文本截断90字符、按0.5s重绘并抬升自身层级；`StartupTrace`为32项环形缓冲，字段摘要48/512字符上限，循环/未处理拒绝有兜底；不写设备标识、存档内容或令牌。错误条可读性仍需同SHA宿主截图，随TAP-04等待。 |
| DEV-06/07 | WAITING_FOR_USER_ACTION | 无host5/host6同SHA Tap首错证据；未上传（用户此前明确不授权Agent上传host5），ADB仍无设备。拿到同SHA测试入口并出现首错后才允许改启动链/错误层。 |
| DEV-08 | WAITING_FOR_PLATFORM | 官方MCP `check_ads_status` 返回**未开通(status=0)**，无真实广告位；两个策略保持关闭，不伪造验证。 |
| DEV-09 | NOT_APPLICABLE | 无设备/平台高内存或启动耗时数据；不以ZIP大小或RGBA估算代替PSS/RSS。 |
| DEV-10 | NOT_APPLICABLE | 本轮无宿主可复现物理/拖动/晃杯新问题。 |
| TAP/ADB矩阵 | WAITING_FOR_USER_ACTION | `adb devices -l` 为空；需连线、开启USB调试并在手机接受RSA。CLI登录有效；平台只读查询见下。 |

平台只读事实：`list-mini-app-packages`可见1.0.0–1.6.0开发包，`app list-packages`的`main`槽仍绑定1.2.0（package 433619）；`get-available-package-types`返回`available=[]`、`declared=["spark"]`，`analyze-app-status`提示“绑定的包体类型超出已声明范围”。该声明/绑定不一致只能由平台/用户侧确认，本轮未切换H5/Maker、未清绑定、未改资料。广告MCP本轮未出现`TOKEN_REVOKED`，无需重置凭证。

host6 ZIP：`D:\Workspace\TapTap\奶茶挤挤\build-artifacts\cocos-taptap-minigame-build\20261107-host6-gate-candidate-01\TapBuild\game.zip`，3,035,417字节，SHA256 `ba395b0c13f11735217b7d99a3c01f83f6090155a87f44f861c2219c4661b287`；未上传、未提审、未发布。host5（1.7.0，3,035,170字节，SHA256 `b0a3217d9b4e1442a6228390c3b732eae90bc559b400cd902710fa527077b840`）仍保留，未宿验证。

## 11. 2026-11-07 用户上传后的自测核查

| 验收项 | 状态 | 证据与下一步 |
|---|---|---|
| 开发包入口 | PASS | `444838` 为 `mini_app`，开发阶段已就绪，后台标为 `1.7.0`，大小 `3,035,417` 字节与 host6 一致。平台列表未返回 SHA256。已生成 [444838 专属自测码](../build-artifacts/taptap-selftest-444838.png)。 |
| 开发包可玩性 | PASS（用户反馈） | 用户确认 `444838` 版本可自测。前次报障截图的 buildId 为 `host3`，本地 host6 主脚本含 `20261107-host6-gate-candidate-01`，无 host3 标识或 `TextEncoder` 字样。 |
| TAP-01 至 TAP-06 | WAITING_FOR_USER_ACTION | 当前反馈确认可自测和晃杯力度不足。仍需补齐包含 buildId 的冷启动、开局、续局、错误恢复、物理操作与前后台证据。 |

若新码冷启仍显示 host3，记录 `444838`、扫码时间、TapTap 版本和带 buildId 的截图，继续区分设备缓存与平台实际下发。若显示 host6 后仍卡住，以当前 buildId 的首错和异常栈继续定位。资料页 `main` 槽仍绑定 `433619`，资料槽位和开发包自测分别记录。

上线核查：应用 `1021353` 的广告能力仍未开通，额外晃杯与洒出复活的激励视频保持关闭。商店资料分析返回缺少 `region_flag_ios`，资质查询因草稿绑定包体版本不存在而被拒绝。需在开发者后台核实草稿包体及小游戏前置备案状态。

防回归复验：移除构建脚本的 `MILKTEA_HOST_UTF8_SOURCE` 覆盖入口。正常源码通过 6 种宿主形态、660 次比较。隔离副本中故意破坏 SHA 输出，并将旧环境变量指向正常工程。资源裁剪与类型检查通过后，实际 staging 的 UTF-8 门禁失败，Creator 未启动，未产出 ZIP。

