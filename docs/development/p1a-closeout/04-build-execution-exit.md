# 04 独立构建、执行矩阵、证据与阶段出口

本文属于[总方案](../../26-p1a-detailed-repair-design.md)。下文同时包含已有基础和待补目标；具体可用入口先读源码/帮助，不能把目标设计当作已经完成。

## 0. 能力预检、运行入口和交付责任

### 0.1 先验证三种能力

最新失败候选为`20261029-p1a-repair-03`，不是已验收final。上一轮构建/验证工具部分已有，下一轮需核对源码与实际帮助再复用，不从设计函数名猜接口。开工先执行以下小规模真实检查，保存独立attempt：

| ID | 检查 | 必须取得的结果 | 失败后推进 |
| --- | --- | --- | --- |
| ENV-01 | 最小真实场景前台运行并记录render/墙钟/物理step | 确认测量入口与target；前台调度有原始记录，异常能够冻结 | 检查浏览器版本/启动配置、覆盖、遮挡/窗口、主线程和引擎工作；不能直接标宿主故障；继续独立实现 |
| ENV-02 | 按02撤销focus emulation后真实切标签 | 可信hidden/show、引擎事件、非抢焦点读取路径 | 只做一次有效分支实验后查实际target/活动窗口及允许的桌面/浏览器路径；认证/本机动作需求早期提出 |
| ENV-03 | 修好包装器并运行一次独立诊断构建 | Creator实际PID/退出码、桥开关作用域、子进程时序和必要产物 | 先用已知退出码的短子进程验证采集链，再查Creator句柄/进程树与SIGTERM，避免连续重复完整构建却仍输出null |

ENV是诊断入口，不替代最终包LIFE、STR、BLD。环境异常和最终功能失败分别记录；自建包装器、超时预算、夹具缺失不是外部权限依赖。某个ENV未通过不停止其他独立工作。

### 0.2 实施阶段必须提供的运行入口

复用现有PhysicsLab/validation，补齐宿主运行器和引擎内夹具；不要求新通用框架。具体文件名/命令在实现后写入新证据README或acceptance，文档中的拟名不能冒充已存在的命令。至少提供：

- 环境预检入口：可单项运行ENV并输出原始信息。
- 场景用例入口：选择case和attempt，安装固定布局、等真实物理条件、执行安全边界操作、按断言保存结果；覆盖COL/REB/NINE等，不只靠手动按键和私有字段快照。
- 宿主编排入口：构建/启动HTTP、真实用户输入、网络故障注入、真实后台begin/read/end、显示矩阵、拉取并落盘原始结果。内部夹具不能额外调用physics.step；UI输入仍需有实际覆盖。
- 证据检查入口：读取必测case目录、所有attempt和源码/产物清单，拒绝缺项及证据冲突，不生成或补写PASS。

这些入口必须可重复调用并有有界超时、取消和清理。后台5分钟拆分宿主等待；长期测试不依赖目标页rAF作为唯一超时源。超时按实际物理进度设计，例如队列不能固定30秒就假定完成120轮。测试工具需要修复时先修工具，再生成新attempt；不手工填结果代替重跑。

### 0.3 需求到实现到证据逐项闭合

开工依据第5节和分册建立机器可读的必测case目录及覆盖表，关联实现文件/真实入口/前置/断言/原始输出。LIFE-01～10、ERR-01～08和REB-02/03拆开；九级、墙方向、视口可用带参数子case，结果必须逐项有记录。NINE-01中动态/混合接触也要按03分别验收。

不要再用`REBUILD-20`、`ERROR-01`等少量汇总行替代整个矩阵。历史失败attempt全部保留；最终验收指向同包明确selectedAttempt，同时列出旧失败及其关闭依据。仅某项真实外部依赖无法取得时可保持该项未执行并完成其他项，不能因此将内部实现遗漏也归入“外部阻塞”。

## 1. 构建策略和版本闭合

### 1.1 候选版本

当前最新失败候选为`20261029-p1a-repair-03`，历史参照为`closeout-mobile-cache-20261028`。下一轮实际检查源码副本、产物和证据目录后选择未使用的buildId，不能覆盖或重用旧目录；01/02/03已有失败尝试。

每个候选包括：源码清单（相关scripts/scenes/settings/extensions/lockfile）、玩法配置哈希、图片/meta保护清单、Creator/引擎/Box2D版本、构建参数、probeVersion、产物清单。启动时导出同一buildId及实际运行后端、PTM、autoSimulation。构建自带标识可放debug资源，不能在预览和产物里共用一个可被外部任意改写的全局字符串来假冒同版本。

源码清单与构建配置先确定；生成buildId标识后再算源码清单；构建完成后算产物清单。产物清单本身存evidence目录，避免把自身哈希列入自身造成循环。

`repair-03`的source-manifest只列部分变更文件，不能当作完整构建输入清单。新清单至少覆盖实际使用的scripts（含声明buildId的AppRoot）、scenes/meta、玩法配置及资源副本、settings/profiles、extensions、依赖锁文件和构建配置，并关联隔离源码副本哈希。保留输入清单路径、排除缓存范围及复制前后核对结果。保护图片/已有meta/migrate-canvas先取本轮修改前哈希，再核对修改后；项目与副本相等只证明复制一致，不能单独证明未改历史文件。

启动日志中写死的Creator/Box2D版本属于declaredVersions，不能独立证明actualBackend。把安装版包版本/源码哈希、构建所用路径与日志、实际产物引擎bundle哈希、运行后端标志/PTM/autoSimulation和内嵌buildId连起来记录。不能通过外部覆盖全局字符串让旧包伪装为新buildId。

### 1.2 final的含义

同一候选完成最终运行矩阵后才能标记final。若后续又改了AppRoot、Adapter或PauseGate，新包必须重跑其受影响运行路径；旧包pressure PASS不能直接填到新包。纯文档修正不必重建运行包，但清单应明确文档不在运行输入范围。

P1-A统一使用Web Mobile作为本地显示和浏览器验收目标。Web Desktop固定画布历史FAIL保留并说明不作为本次目标，不删除旧用例，也不把它标成已经修好。抖音首发仍保留，平台和手机实机验收归P2。

## 2. 解决编辑器桥接端口冲突

### 2.1 根因与最小修改

历史根因：项目本地扩展`client/extensions/codex-editor-bridge/browser.js`的load原本无条件startServer。GUI编辑器已占17388，CLI构建进程再加载扩展发生EADDRINUSE。`repair-03`已加入禁用开关及启动状态保护，下一轮保留并验证，不重复覆盖该修复。

添加仅影响当前构建子进程的环境开关：

```js
exports.load = function load() {
  if (process.env.MILKTEA_DISABLE_EDITOR_BRIDGE === '1') {
    console.log('[codex-editor-bridge] disabled for this build process');
    return;
  }
  startServer().catch(reportBridgeStartFailure);
};
```

环境名是本项目已加入的开关，不是上游现成功能。构建脚本显式设置并finally恢复，禁止修改系统环境/用户级MCP配置，也不关闭用户既有GUI编辑器来抢端口。不自动递增端口，否则本会话可能读到另一个不明工程。

startServer使用局部candidate，只有listen成功后赋给server/currentPort；失败不留下一个“server存在所以reused=true”的假状态。并发启动如确实存在，用单个startPromise复用同一次绑定。EADDRINUSE仍要有明确错误，不做空catch吞掉。

### 2.2 验证开关

1. 原GUI编辑器桥health与Boot场景读取正常。
2. 带开关构建日志出现disabled，不尝试绑定17388。
3. 构建期间原GUI桥仍可读正确工程。
4. 构建进程退出后调用shell的原环境值恢复；正常GUI扩展重载仍能绑定原端口。

## 3. 构建命令、退出码与SIGTERM归因

### 3.1 已核实的基础命令

使用Creator3.8.8，不引入微信CLI。命令基础为：

```text
CocosCreator.exe --project <绝对client路径> --build "platform=web-mobile;debug=true;buildPath=D:/cocos-p1a-build;outputName=<新buildId>;startScene=44e30fdb-084f-5609-8283-4fdd8d2fab81"
```

实际启动前核对Boot UUID仍为当前meta值。buildPath保持ASCII；输出名唯一且不存在，存在就换新ID，不递归清理旧产物。

参考[Cocos3.8官方命令行说明](https://docs.cocos.com/creator/3.8/manual/en/editor/publish/publish-in-command-line.html)：成功码36，参数错误32，构建过程错误34。PowerShell外层脚本退出0不能代替Creator进程退出码。

### 3.2 PowerShell构建包装设计

`tools/build_p1a_web.ps1`及`tools/prepare_p1a_build_source.ps1`已存在；先读实际参数和路径规则。当前包装器曾记录Creator退出码null，尚未完成本节合同，不能原样重复并把null解释为Creator异常退出。已有GUI保持运行时使用经过哈希核对的隔离源码副本，缓存目录独立，不复制GUI占用的日志。

脚本步骤：

1. Resolve-Path核对client、Creator、evidence绝对路径；检查输出目标属于D:/cocos-p1a-build且不存在。所有目录创建保留旧资料。
2. 保存当前进程环境开关值；设置`MILKTEA_DISABLE_EDITOR_BRIDGE=1`。
3. Start-Process指定`-WindowStyle Hidden -PassThru`或使用等价隐藏进程API，stdout/stderr重定向到新证据目录；项目路径和完整build字符串分别正确传参，避免分号被shell解释。启动后在退出前取得并保留有效进程句柄；具体API按实际PowerShell/.NET版本验证，必要时更换采集方式，不靠重复构建碰运气。
4. 保存进程ID、开始时刻和精确参数。等待过程中通过会话轮询日志/进程状态，聊天每60秒以内更新，不额外启动重复构建。
5. 实际进程结束后读取非空ExitCode，保存`creator-exit.json`与结束时刻；将launcher、Creator主进程及build-script子进程的PID/父子关系、退出码/信号分开，不能把子进程code:null当主进程退出码。采集失败单列captureError，禁止写成0或36；finally恢复原环境值，包括原先未设置的情况。
6. 退出36后核对必要产物和脚本场景索引，再生成manifest；非36即FAIL但保留部分产物供诊断。

不能用`Invoke-Expression`拼命令，不能把包含路径的JSON字符串当shell转义。脚本不能结束不属于本轮启动的进程。

### 3.3 SIGTERM处理决策

旧日志的SIGTERM出现在脚本任务相关阶段，不能仅根据最终36确定它无害，也不能因此断言整个构建失败。

按以下步骤收集：任务ID/PID、SIGTERM前后日志、build-script完成标记、后续产物生成、主进程退出码；读取本机3.8.8 builder中对应sub-process-manager关闭路径，确认是否是成功后的worker回收。

若安装包`.ccc`为编译产物而不可读，记录入口路径/哈希和可读性结果后继续诊断，不能就此宣布引擎局限并停止。结合安装版可得调用路径，在本轮独立构建子进程中增加只读生命周期/终止调用来源及栈日志；保持原调用与错误传播，不修改安装目录、不吞SIGTERM、不伪造完成事件。将worker任务完成/IPC返回、终止请求、实际exit和主进程退出排成时序，判断SIGTERM是否结束已完成worker。若缺可验证的对应关系仍未关闭，不以“产物能打开”豁免。

- 若源码与日志证明为已完成worker的正常清理：在issues中记录对应代码位置/日志区间/产物核验，关闭为“工具清理日志”，保留原始信息。
- 若worker在任务完成前被终止或产物缺失：构建FAIL，修复真实调用/进程生命周期或报告具体外部阻塞，不忽略。
- 若原因仍不明：标未关闭；即便基本启动成功，也不能声称构建异常已解释。

修改桥接开关只解决端口冲突，不自动解决SIGTERM；两个问题分开验收。

### 3.4 favicon与模板

favicon404是非阻断杂项，应与脚本/图片资源404分开。若清理，按Creator3.8.8实际项目构建模板机制复制必要入口到项目内，引用已有授权小图，或在开发模板明确禁用favicon请求；不修改安装目录、不下载新素材、不把非关键图标变成玩法门禁。

## 4. 本地HTTP和最终运行

使用唯一可用端口，只绑定127.0.0.1，目录必须为新产物根。示意已知可用命令：

```text
python -m http.server <port> --bind 127.0.0.1 --directory D:/cocos-p1a-build/<buildId>
```

服务用隐藏进程启动，保存PID/日志/根路径；不要误连旧8771端口后按新包命名。页面运行回读buildId、引擎后端、PTM、autoSimulation及首场景，比对manifest和HTTP根。

最终运行至少包含启动、固定步、后台、队列、接触重建、三圆/压力、错误恢复和显示矩阵。部分输入通过debug按钮而非全部直接调用私有方法；内部夹具允许摆放测试坐标，但必须真实经过同一物理step与Cocos接触。

## 5. 可执行验收矩阵

每个ID有独立步骤/前置/断言/证据；组合case不能只列总PASS。以下为新矩阵，旧cases不改写。

| 新ID | 前置与操作 | 断言 | 输出 |
| --- | --- | --- | --- |
| VER-01 | 读取新包身份与版本 | 后端Box2D、PTM32、autoSimulation=false、正确buildId | environment.json |
| GEO-01 | 纯几何镜像/法线/内面测试 | 单位法线、垂直、内面位置正确 | geometry-unit.json |
| GEO-02 | 有限面、端点、开放顶部手算夹具 | 探针无符号/顶部误判 | probe-unit.json |
| CLK-01 | 单圆无阻尼，30/60tick | 与现有半隐式积分基准一致，参数不变 | gravity-test.csv |
| CLK-02 | 30/60/60Hz各120step | tick=stepCount=120，终态误差按现有断言 | fixed-step-comparison.csv |
| CLK-03 | P后等待→R | 暂停状态不变，恢复无额外step | pause.json |
| CLK-04 | 前台独立长帧夹具 | 不超过5步，随后BACKLOG；真实宿主暂停另测 | backlog.json |
| LIFE-01～10 | 按02逐项实际操作 | 真实hidden和暂停转换，不用合成事件替代 | lifecycle.jsonl、逐例结果 |
| COL-01 | 三圆释放→预热→连续60秒 | 数量/边界/接触/睡眠正常，异常解释完整 | three-summary、录像 |
| COL-02 | 指定同级/异级动态接触 | 指定canonical pair存在 | contact-events.csv |
| COL-03 | 已接触两圆真实分离 | end后对应key删除，未手工改Map | contact-events.csv |
| COL-04 | 圆同时接触底/侧后离开侧 | 一条end不删另一条接触 | multi-contact.json |
| COL-05 | 安全边界销毁接触中的圆 | 所有相关对/监听清理，其他对保留 | destroy-contact.json |
| COL-06 | 最大配置速度左/右/下撞壁 | 实际接触且无扫掠穿出 | collision-summary、录像 |
| COL-07 | 九级各左右/底角合法夹具 | 每级实际运行结果独立，有限端点正确 | level-wall-corner.csv |
| COL-08 | scale0.8、r140落杯及角路径 | 实际半径/杯几何、稳定接触、无穿出 | narrow-final.json |
| REB-01 | 每轮先接触再清理，20轮 | 20份接触基线及稳定清理基线，body4/监听3 | rebuild-contact.csv |
| REB-02/03 | 第5/10轮打断并开新任务 | 旧task后续round不发生，world身份正确 | rebuild-interrupt.json |
| REB-04 | 旧listener单元调用+真实重建复用ID | 旧世界无写入、新世界不受污染；两类证据分开 | stale-callbacks.json |
| STR-01 | 原220体P0/P1/P2 | 根因对照，不挑成功覆盖失败 | pressure-compare.csv |
| STR-02 | 最新包220体连续观察 | 600预热+3600观察step，至少60秒、无意外暂停/穿出 | pressure-final/frames |
| STR-03 | 原24体混合布局同上 | 固定合法性预检及连续结果 | mixed-final/frames |
| STR-04 | 严格合法220布局对照 | 同数量、参数，独立布局哈希；不替代原用例 | layout-compare.json |
| NINE-01 | 1～9级独立生成 | 九份真实落杯/半径/贴图/接触 | nine-independent-final |
| NINE-02 | 原队列完整尝试 | 阻挡正确、120有效失败后terminal，完整原因 | nine-attempts.jsonl |
| NINE-03 | terminal后继续120step | 不再生成、attempt不变、无等待句柄 | nine-terminal.json |
| NINE-04 | 阻挡中C/X或销毁 | 旧token不能创建新实体 | nine-cancel.json |
| ERR-01～08 | 按03独立故障注入 | route确实命中、真实错误和唯一恢复、owner正确 | errors-retry.jsonl |
| ART-01 | 七页81项总览 | 全部ID、实际variant、无缺图 | gallery-load.json |
| ART-02 | 原锚点/alpha/画布检查 | 九级和杯层原点正确，必要素材逐项结果 | asset-visual-review.csv |
| ART-03 | 所有带insets项的三尺寸九切 | 实际frame inset与目标尺寸正确，角边保形 | nineslice-review.csv |
| VIEW-01 | 最终包9视口及旋转 | 内容可见/HUD可操作，暂停物理摘要/半径/world不变 | viewport-final.csv、截图 |
| LOAD-01 | 图片/配置销毁与恢复循环 | owner引用账本平衡，无旧catch破坏新world | resource-owner-ledger |
| BLD-01 | 带进程开关独立Web构建 | Creator退出36、无端口抢占、必要产物齐 | build日志/exit/manifests |
| BLD-02 | 运行实际产物 | buildId一致，无非预期资源失败；以上核心用例关联同包 | final-runtime.json |

矩阵中的LIFE/ERR展开为逐条记录，不输出“LIFE-01～10全部PASS”而缺具体行为。纯逻辑单测不需要重复实际引擎所有场景，但必须覆盖本次新增的gate、队列区间、环形缓冲和过期所有权分支。

### 5.1 最新旧用例逐项去向

下表用于确保现有closeout/cases.csv每一行都有处理去向，不把历史PASS直接移植到新候选。

| 现有caseId | 本方案去向 |
| --- | --- |
| version | VER-01，回读最终候选 |
| geometry_static | GEO-01，保留右壁修复，按受影响范围回归 |
| wall_contact_preview | COL-06/07，历史预览记录保留 |
| wall_contact_build | COL-06/07，对新最终包补齐方向/等级 |
| nine_independent_preview | NINE-01，最终包覆盖 |
| nine_original_queue | NINE-02/03，旧FAIL保留，合法阻挡与完成生成分开 |
| nine_attempt_trace | NINE-02，完整有效attempt而非单快照 |
| rebuild_20_counts | REB-01，增加每轮真实接触 |
| rebuild_old_callback | REB-04，真实和单元隔离分开 |
| background_visibility | LIFE-01/02/03，先撤销focus emulation |
| background_loading | LIFE-07/08，跨初始化与场景记录 |
| three_continuous_preview | COL-01，旧数据校正及最终包新结果 |
| pressure_220_preview | STR-01/02，不能替代最终包 |
| pressure_mixed_preview | STR-03，明确只是原1～4级24体布局 |
| pressure_final_initial | STR-01，保留第35步原失败并解释 |
| same_different_contact | COL-02/03，增加真实分离 |
| contact_end_destroy | COL-03/04/05和REB-04 |
| narrow_cup | COL-08，增加最终包和角路径 |
| images_load | ART-01，保留文件与加载两种作用域 |
| images_visual_nineslice | ART-02/03 |
| viewport_mobile | VIEW-01，最终候选且实际操作 |
| viewport_desktop | 保留该目标限制，不冒充已修复；P1-A目标明确Web Mobile |
| config_404_retry_final | ERR-01，按AppRoot改动回归 |
| image_404_retry_final | ERR-05，点击与T分别记录 |
| invalid_config_retry | ERR-03，缓存与连点回归 |
| build_final | BLD-01，构建开关与异常归因 |
| final_build_regression | BLD-02及该候选全部核心子用例 |
| device | 保留未执行；P2真机，不写成桌面已通过 |
| pressure_final_retry | STR-01保留旧复测；STR-02补新候选 |
| malformed_json | ERR-02，真实资源解析失败路径 |
| pressure_cache_continuous | STR-01/02，必须解释第102步暂停 |
| destroy_during_image_load | ERR-06、LOAD-01，owner与迟到回调 |
| rebuild_interrupt_round5 | REB-02/03，补第10轮与真实接触 |

## 6. 已有检查命令与新增检查接入

现有核心/美术检查入口（项目根）：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File client/validation/run-art-check.ps1 -EvidenceDir 'evidence/P1-A/<新buildId>'
```

它会写指定新目录。不能把旧证据目录当参数覆盖。类型检查在client目录：

```powershell
./node_modules/.bin/tsc.cmd --project tsconfig.json --types './temp/declarations/cc,./temp/declarations/cc.env,./temp/declarations/cc.custom-macro,./temp/declarations/jsb'
```

实施新增纯TS测试后，按真实run-core-check.ps1的编译清单增加纯模块；若LabProbe依赖Cocos，拆出纯标量算法再单测，不用假cc声明掩盖错误。新增脚本的命令必须随实现提交到文档，未实现前不可宣称已经能运行。

当前creator-preview-smoke.js中的后台测试需按02改为先验证真实hidden前置；不能通过删除BACKGROUND行使allPassed=true。环境不支持时，保留attempt失败，并在最终用例标未执行+blockedReason，阶段仍不放行。

## 7. 证据数据合同

### 7.1 cases.csv

```text
caseId,status,buildId,attemptId,probeVersion,environmentId,preconditions,
stepsFile,expected,actual,evidenceFiles,blockedReason,issueId
```

status只用PASS、FAIL、未执行、不适用。status与blockedReason分开：前置条件没取得用“未执行+原因”；实际运行失败用FAIL；不能在PASS后另写一个会否定核心断言的blockedReason。历史失败attempt仍有独立行，不用最终复测覆盖。

### 7.2 每个attempt的JSON

```json
{
  "schemaVersion":1,
  "caseId":"STR-02",
  "attemptId":"STR-02-002",
  "buildId":"<实际构建>",
  "probeVersion":"lab-probe-v1",
  "environmentId":"desktop-local-01",
  "executionStatus":"finished",
  "result":"FAIL",
  "failureReason":"CLOCK_BACKLOG",
  "preconditions":{"visible":true,"layoutHash":"<实际哈希>"},
  "coverage":{"warmupSteps":600,"observedSteps":102,"gaps":0},
  "evidenceFiles":["frames.csv","anomaly.json"]
}
```

示例数值只说明schema，不对应现有第102步失败的预热阶段；真实记录不能复制这个示例冒充数据。

结果由执行入口实时收集，断言通过后生成。完整原始frames/step聚合/events与阶段边界先落盘，再从同一文件派生分位数和acceptance；不能仅从聊天输出手抄摘要充当唯一原始证据。每条关联build/case/attempt/probe/environment/world/layout，记录开始/结束与实际覆盖、原始文件SHA-256。attempt重复时使用新ID/目录，不覆盖失败。视觉结论由执行agent检查对应截图并记录理由，不能由程序默认填PASS。

### 7.3 目录

```text
evidence/P1-A/<buildId>/
  acceptance.md / cases.csv / issues.md / environment.json
  source-manifest.json / build-manifest.json / asset-meta-protection.json
  build/       # 命令、Creator退出码、stdout/stderr、异常解释
  attempts/    # 每次执行独立目录，不覆盖
  lifecycle/   # 真实事件、暂停转换、位置摘要
  physics/     # 原始/摘要/帧时/布局/异常
  assets/      # 实际variant、逐项审查、九切与显示
  derived/     # 旧数据重算与来源哈希
  screenshots/ / video/
  validation/ # 类型、纯逻辑、资源及证据自身校验
```

每个文件要能通过相对路径定位，UTF-8编码；CSV字段含逗号/换行正确引用。截图/录像有buildId和case对应，不把编辑器截图当游戏运行截图。

## 8. 证据自检器设计

拟新增`tools/validate_p1a_evidence.py`，只读新证据，不生成PASS：

1. 检查必需文件、JSON/CSV解析、精确列数/必需字段/类型、状态枚举和attempt唯一性。case可有多个attempt；其组合身份不得重复。不得只查文件存在而放过CSV错列、丢issueId或空stepsFile。
2. evidenceFiles全部存在，引用旧文件需源哈希，不能指向不存在的截图。
3. 将必测case目录与结果逐项连接，拒绝缺行、汇总代替子case和以历史PASS移植final；每个最终selectedAttempt都关联该buildId。环境预检/静态检查/历史派生是不同作用域，不能算作所缺真实引擎case。
4. 实际tick/step连续性、样本数量、warmup/observed区间、probe溢出标志与结果不矛盾；检查暂停后帧未混入OBSERVE统计，OBSERVE至少60秒；核对队列失败轮次而非候选计数，20轮每轮真实接触和稳定清理均有证据。
5. 真实后台PASS必须含真实visibility事件、hide/show、冻结摘要与恢复证据；只含game.emit记录则拒绝。
6. 原始失败、复测、未执行缺口都出现在issues/acceptance，不能只导出PASS行。
7. source/build/图片meta清单哈希与当前文件核对；验证不修改文件。

自检通过只能说明证据一致性，不能取代实际业务断言或视觉人工审查。

检查器至少区分“证据完整但结果FAIL”和“最终出口通过”，不能把引用/JSON格式检查成功写成allPassed。必测项未执行或阻断未关闭时出口结果非成功；不适用需有明确阶段边界依据。该脚本目前尚需实施，开发完成后记录实际命令和退出语义。

## 9. 阶段出口与未关闭问题的处理

P1-A放行需要同时满足：

- 唯一时钟、单位、固定步及参数来源无回归；真实后台和显式恢复通过。
- 最新同一候选包压力根因闭合，220体及固定混合堆连续物理观察完成；无未解释侧底穿出、持续明显穿透或数量丢失。
- 接触begin/end/多边/销毁清理正确，20轮有接触重建及中断、旧回调隔离通过。
- 九级实际可验证；原队列合法阻挡、有界终止和取消正确，不要求不合理同时容量。
- 配置/资源失败可重试、初始化唯一；必要素材、九切、杯层、屏幕显示和输入可用。
- 最终独立构建运行、版本和证据闭合；构建异常已明确解释或修复，没有阻断缺陷。

以下可以作为明确边界而非伪造通过：Web Desktop历史模板限制、favicon非关键请求、尚未执行的抖音/真机、正式UI与音频/P1-C、真人试玩/P1-D。它们不能反过来掩盖当前Web Mobile缺图、后台或物理故障。

若真实后台因已确认的外部认证/本机操作无法取得，其他项照常完成，acceptance列出准确未关闭项；只有其他必测项真的已通过时才能写“仅剩LIFE具体依赖”。若压力仍无法解释，保持FAIL并交付首次异常原始窗口、已排除原因和下一个具体诊断分支，不改变玩法参数。自建工具未实现/失败、独立用例未做、可读源码暂缺不自动成为外部阻塞。执行agent应持续解决可行动问题，不能以新增待办列表代替已授权的实施。

## 10. 文档更新和最后交付

更新README、docs/22、docs/12的最新入口；旧24/25顶部标历史/被本方案替代，正文不伪造改写成已通过。assets/README及catalog中的import_pending若需维护，应区分“源库制作状态”与“本次Creator运行证明”，不随意改生成源字段导致以后被工具覆盖。

最终说明：实际改动、原因与对应issue；执行命令及实际结果；预览/最终包/真机边界；失败和未执行；证据路径；最终候选目录；P1-A是否满足出口。不提交、推送、发布或部署，不自动开始P1-B。
