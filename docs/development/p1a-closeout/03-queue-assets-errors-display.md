# 03 九尺寸队列、资源所有权、错误恢复与显示设计

本文属于[总方案](../../26-p1a-detailed-repair-design.md)。只增强PhysicsLab和工程恢复，不实现正式玩法投放。

## 1. 九尺寸：明确成功、合法阻挡和失败

### 1.1 现有证据说明什么

九级分别在空杯落稳已通过。原队列按等级递增且优先投中心，tick566时8号圆中心(375,1024.3964)、r112；9级r140、出生y1130，合法中心x∈[255,495]。8号圆的禁止出生区间约(146.19,603.81)，覆盖全部合法区间。

因此该时刻拒绝第9级是正确的防重叠行为。待修复/补验收的是队列任务的可观测性、有界终止和取消，不是让第9级无条件出现。旧`nine_original_queue=FAIL`保留；新增子用例不能改写旧执行的实际结果。

### 1.2 三类用例分开

| 用例 | 完成定义 |
| --- | --- |
| NINE-INDEPENDENT | 1～9级分别真实生成、落稳，半径/图像/接触正确 |
| NINE-MIXED | 固定合法布局的不同级圆实际接触，不要求所有最大圆无限塞杯 |
| NINE-BLOCKED | 原顺序队列合法拒绝、记录原因、达到原重试上限后明确终止，之后不再生成或排队 |

调试界面显示“九尺寸队列：已投8/9，9级被8号阻挡”，最终为“试验结束：合法出生区持续被挡住”，不能显示“九级全部生成成功”。NINE-BLOCKED通过表示阻挡处理正确，不等于旧队列已完成九次生成。

## 2. 队列任务数据和状态机

### 2.0 执行纠偏：按失败轮次计数，跨等级记录不得清空

`repair-03`在五候选for循环内增加attempts，并在成功时清空records；这与下文算法不一致，必须修正。一个`batchAttempt`表示一次到期的候选检查轮次；每个候选另记`candidateIndex`和拒绝原因。只有本轮候选全部拒绝才增加当前等级的`blockedAttempts`一次，成功轮不增加连续失败计数。不能以120次候选比较（约24轮）冒充120轮有效失败。

记录追加保留整个task的等级、batchAttempt、candidateIndex、tick、worldId、x、接受/拒绝及原因；成功只清当前等级失败计数，不清历史。记录容量须覆盖最多9级×120轮×5候选及成功/取消事件，或用等价的完整分段输出；不得只留最后120条候选记录。暂停等待不是一次失败，不能消费重试额度。

保留Cocos调度时，取消必须unschedule具体句柄并配合token guard；采用tick驱动时不再同时保留scheduleOnce链。terminal后验证实际继续120step而非只等两秒墙钟。120次失败距离第一次至少1785tick，加上前面等级投放/等待，旧30秒总超时不适合作为必然终止判据；运行器按实际tick进度和有界宿主总超时执行。

### 2.1 拟新增内部结构

```ts
type NineStatus = 'IDLE' | 'WAITING_WORLD' | 'WAITING_RESUME' |
  'WAITING_DELAY' | 'TRYING' | 'BLOCKED_RETRY' |
  'COMPLETED' | 'BLOCKED_FINAL' | 'CANCELLED' | 'ERROR';
interface NineTask {
  taskId: number;
  worldId: number;
  ownerLifetimeId: number;
  status: NineStatus;
  index: number;                // 当前待投等级索引，0..8
  successfulIds: number[];
  blockedAttempts: number;      // 当前等级连续失败次数
  nextEligibleTick: number;
  terminalAtTick: number | null;
  cancelledBy: string | null;
}
```

参数沿用原诊断行为：成功后间隔1秒（60物理tick）；失败后0.25秒（15tick），当前等级最多120次有效尝试。它们是原试验场调度参数，不是P1-B投放冷却。

推荐将九尺寸延时改为本地物理tick驱动：在既有step安全边界之后检查nextEligibleTick，符合条件才尝试；不再维护一个后台反复scheduleOnce的等待链。暂停期间无物理tick就不消费重试次数。首次启动在world完成重建后安排第一次尝试。

若为最小改动保留scheduleOnce，必须按02保存回调句柄、暂停时不计attempt，并证明只存在一条当前任务等待链。两种实现选一种，不能同时推进。

### 2.2 核心算法

```text
startNine:
  取消旧task；清理旧world；新world稳定后创建NineTask
  index=0, attempts=0, nextEligibleTick=currentTick
  若当前有暂停原因 -> WAITING_RESUME，否则WAITING_DELAY

afterStepSafeBoundary(tick):
  没有task或已terminal -> return
  lifetime/task/world不匹配 -> CANCELLED，清理等待，return
  pauseGate不允许运行 -> WAITING_RESUME，return
  tick < nextEligibleTick -> WAITING_DELAY，return
  status=TRYING
  用原五个候选顺序逐一检查；记录每个拒绝原因
  找到合法候选:
    创建一个真实圆；只分配一次ID；记录成功
    index++，attempts=0
    index==9 -> COMPLETED并停调度
    否则nextEligibleTick=tick+60，WAITING_DELAY
  所有候选都不合法:
    attempts++，记录完整禁止区间诊断
    attempts==120 -> BLOCKED_FINAL，terminalAtTick=tick，停调度
    否则nextEligibleTick=tick+15，BLOCKED_RETRY
```

注意第一失败发生立即计1，之后119次间隔15tick，因此最后失败距第一次为1785tick（约29.75秒物理时间）；不能机械等待启动后30秒就判定全部重试已发生，因为前8次成功和暂停也占时间。

新任务或C/X/N、场景销毁、重新初始化都使旧token失效。进入terminal后继续运行至少120tick，新增实体与尝试次数不再变化；暂停恢复不能把terminal变回TRYING。再次按3才创建新任务。

### 2.3 只读出生诊断

保留`canSpawn(level,x):boolean`公共行为；增加内部`explainSpawn`供诊断/测试，返回：UNKNOWN_LEVEL、NO_CUP、OUT_OF_RANGE、BODY_OVERLAP、OK及阻挡实体/余量。不得把调试错误字符串作为玩法业务协议。

边界：合法x闭区间为[cupLeft+r,cupRight-r]；圆间重叠沿用现有严格`distance < r+ri`。相切与浮点比较必须与canSpawn一致，不能加新的“安全余量”缩小容量。

## 3. 完整出生区间诊断算法

对出生高度ys、待投半径r、现有圆(xi,yi,ri)：令dy=abs(ys-yi)、R=r+ri。

- dy≥R：该圆不禁止任何水平位置（相切按现有canSpawn允许）。
- dy<R：`halfWidth=sqrt(R*R-dy*dy)`，禁止开区间`(xi-halfWidth, xi+halfWidth)`。
- 将所有禁止区间与合法闭区间求交，再求并集/补集，得到整个合法出生空间。

区间必须带端点开闭标志。两个禁止开区间端点相等时，交点可能是合法相切单点，不能用普通`<=`合并把它丢掉。补集的候选端点再调用同一个explainSpawn校验，避免诊断与实际逻辑不同。

输出示例：

```json
{
  "taskId": 7,
  "worldId": 22,
  "tick": 566,
  "level": 9,
  "attempt": 4,
  "legal": [255, 495],
  "blockers": [{"entityId":8,"lo":146.19,"hi":603.81,"open":true}],
  "freeIntervals": [],
  "result": "BLOCKED_RETRY"
}
```

数值示例仅说明schema，实际trace必须保留真实精度。区间诊断只解释五候选策略是否遗漏可行区间，不自行改变正式候选选择。若五候选全拒绝但freeIntervals非空，新增明确诊断`CANDIDATES_MISS_FREE_INTERVAL`；是否优化试验场候选另作有证据的小改，原候选回归保留。

纯TS测试至少覆盖：无圆、圆跨合法区间、多个区间并集、刚好相切、单点可行、杯宽倍率、未知等级和非有限输入。后者应明确拒绝，不能让NaN穿过比较成为合法出生。

## 4. 资源与异步所有权

执行纠偏：ArtAssets内部generation检查已有，不能据此认定整条异步链安全。PhysicsLab仍需按4.1在await前固定owner，避免旧attempt在await后读取当前this.art。AppRoot现有loading在配置回调内就释放，需覆盖配置成功、场景加载到切换成功/失败的完整启动事务；各阶段具体回调以3.8.8实际API为准，旧generation不能清新事务锁。通过第5节真实故障注入验证，不能仅检查布尔值。

### 4.1 每次初始化固定一个owner

PhysicsLab当前在await前后使用this.art。设计改为：

```ts
const attempt = ++artGeneration;
const artOwner = new ArtAssets();
this.art = artOwner;
try {
  await artOwner.initialize();
  await Promise.all(requests.map(r => artOwner.load(r.id,r.target)));
  if (!isCurrent(attempt, artOwner)) return;
  createSceneFrom(artOwner);
} catch (error) {
  if (isCurrent(attempt, artOwner)) showCurrentError(error);
  else recordCancelledLoad(error);
} finally {
  if (!isCurrent(attempt, artOwner)) artOwner.dispose();
  else loading = false;
}
```

新attempt开始先取消/释放旧owner；过期catch不能释放当前this.art、销毁新world或把新ready改false。Promise.all早失败后其余请求仍可能回调，所以disposed检查仍须存在。

### 4.2 引用账本

| 资源 | 何时获得所有权 | 何时释放 |
| --- | --- | --- |
| catalog JsonAsset | initialize成功且owner有效后addRef一次 | owner.dispose时decRef一次 |
| ImageAsset | 图片成功、尺寸合法、owner仍有效后addRef一次 | 对应LoadedArt释放时decRef一次 |
| new Texture2D/SpriteFrame | 当前owner创建 | owner销毁时destroy，避免其他节点仍使用 |
| 在途回调结果 | 未addRef前只视为借用结果 | 过期时不decRef一个从未持有的引用，不强制释放共享cache |

创建texture/frame中途失败要撤销本次已经取得的引用/对象；不能只在最终Map成功后才有释放路径。dispose幂等，记录ownedRefsReleased/created/destroyed用于诊断；缓存内仍有其他owner资源不等于本owner泄漏。

延迟销毁的展示节点与动态资源释放顺序要明确：先摘除/清空引用或等安全frame销毁视图，再销毁frame/texture；若简单dispose恰在旧节点仍可能渲染期间执行，应先使该owner视图不再渲染。不要通过全局releaseAll释放其他场景。

## 5. 配置失败、缓存与切场景的完整流程

### 5.1 AppRoot的加载阶段

在现有loading基础上明确阶段：IDLE、LOADING_CONFIG、SWITCHING_SCENE、ERROR、DISPOSED。这只是启动器内部状态，不是玩法状态机。

- onLoad建立不依赖配置成功的750×1334错误显示基线，安装宿主可见性协调器。
- retry仅ERROR/IDLE可接受；LOADING_CONFIG/SWITCHING_SCENE拒绝重复，不新建请求。
- resources.load回调检查generation与组件有效性，校验成功后将启动阶段改SWITCHING_SCENE；场景切换完成/失败回调才结束在途状态。
- 当前代码成功校验后会先loading=false再loadScene；完善此窗口，防止外部retry/重复输入并发启动场景。
- 场景失败回调要显示可重试错误，不能只设置AppRuntime.rules后假定进入PhysicsLab。
- onDestroy先标DISPOSED并递增generation；迟到配置结果不设置全局rules/mapper、不再loadScene。

### 5.2 缓存处理

非法密度恢复已有`resources.release('config/design-baseline',JsonAsset)`修复，保留。完善为：只在当前有效attempt确认无效、且该路径当前没有其他持有者时失效此配置缓存；不释放新attempt已经接收的有效asset。

如为配置asset引入addRef，错误分支先释放自身ref，再在明确单一Boot所有权条件下清该无效缓存。普通成功配置解析成启动器持有的纯数据后释放asset所有权；不留下依赖已销毁Asset的对象引用。不得在“过期回调”里按路径全局release，因为该路径可能已被新场景使用。

不要用未经核对的reload参数猜测Cocos API；实际缓存失效行为对照3.8.8安装声明和隔离请求次数验证。

### 5.2.1 ConfigLoader只补P1-A实际消费的不变量

当前数值范围检查已存在，保留；针对错误恢复补齐必要结构而非全量引入JSON Schema依赖：design_rules_version必须为非空字符串，physics.sleep必须为布尔值，stages必须包含实际启动使用的classic，重力/viewport/cup等被读取字段须为正确结构及有限数。否则可能校验通过后才在createCup或引擎设置中失败。

为每个新增校验提供非法输入和正确基线两个断言；输出CONFIG_INVALID和明确路径，保持retryable。只校验P1-A消费的字段，不借此提前实现P1-B随机、合成、计分或存档规则。基线值和规则版本不因补结构校验而改变。

### 5.3 请求故障注入

验证脚本先根据本构建资源索引/实际请求定位配置URL，不把旧UUID路径当所有构建都固定。现有导入JSON为Cocos序列化格式，`data[5][0][2]`只能作旧包已核对格式的测试细节。

- 404：只拦截已确认配置资源请求，返回404。
- 非法JSON：该资源请求返回HTTP200、application/json、截断的`{"broken":`，让真实资源管线解析失败。
- 合法JSON但非法配置：解析真实响应，定位并验证待修改对象确为配置，再改density或必需字段；定位不符应让harness FAIL，不能拦截错误URL后宣称应用通过。
- 延迟：保持请求待完成，执行销毁/切场景，再放行；finally解除所有route并释放held请求。
- 持续失败连点：在一个请求明确挂起时多次点击，断言最多一项在途启动；Cocos底层重试和用户启动attempt分开计数。

每个故障场景使用独立干净页面/缓存上下文。不要让上个用例的cache使这次route根本没被命中。记录routeMatches和expectedAsset，不命中就不算用例执行。

### 5.4 故障用例步骤与判据

| ID | 步骤 | 实际状态断言 |
| --- | --- | --- |
| ERR-01 | 配置404→看错误→移除route→点击 | 错误页可见，恢复到一个PhysicsLab，3实体6Adapter监听 |
| ERR-02 | 非法JSON→错误→正常响应重试 | 引擎回调返回错误，未用默认空配置假启动；恢复唯一初始化 |
| ERR-03 | 非法密度→恢复→连点三次 | 无效缓存没有被重用；在途attempt不重复，成功切场景一次 |
| ERR-04 | 挂起配置→销毁Boot/换场景→放行 | 旧generation不写rules/mapper、不切回旧目的场景 |
| ERR-05 | 单张图片404→点击与T各测一次 | 错误提示可见，18项场景图恢复，world/监听不翻倍 |
| ERR-06 | 图片挂起→连续重试/销毁→放行 | owner取消，旧catch不破坏新world；没有未处理拒绝 |
| ERR-07 | 连续失败两次→第三次正常 | 每次ERROR可再次操作，失败不累计残留world/引用 |
| ERR-08 | 成功后再次点击原重试区域 | 不重复初始化，不再触发配置请求 |

pageerror、未处理Promise rejection与预期console.error分开统计。故障期间预期错误日志保留并标注；恢复后新增非预期错误必须调查，不能要求故障用例控制台永远零错误。

## 6. 图库必须显示真实加载规格

### 6.1 当前问题

ArtAssets以assetId缓存第一次加载的variant；ArtGallery又用catalog.select(id,160)计算展示规格。若PhysicsLab先加载高规格，再进图库，展示说明可能指向另一规格。现有图库还统一centerPivot=true，会掩盖杯层原锚点问题。

最小设计：不改缓存键和运行贴图策略，新增只读`getLoadedInfo(id)`返回实际variant、宽高、pivot、insets和resourceKey；图库用此信息计算展示、标注和断言。不要为展示某小规格直接替换正在被其他节点引用的texture。

需要验收某个额外variant时，使用独立ArtAssets owner或独立页面，结束后释放；81个assetId的必要视觉与117个PNG文件完整性分别记录，不要求同时把117图全常驻。

### 6.2 三种图库检查模式

1. **总览**：保留7页缩略图，显示实际variant和加载状态；仅证明加载与初步辨识。
2. **原锚点**：单项显示原pivot与中心/原点十字、非透明包围框及完整画布；杯层用原(0,0)而非强制中心。棋盘背景用于透明边观察，不改原图。
3. **九切**：对带insets的资产显示原图分割线及三组目标尺寸。最小目标宽至少left+right、目标高至少top+bottom；低于此值作为明确不支持尺寸另测，不把塌缩归因于素材损坏。

九切边距取实际已加载variant的像素值，不能拿128图边距套512图。目标高度固定、宽度分别最小/常规/较宽，比较角和边是否保形；记录Sprite.type、frame四inset和UITransform尺寸。

### 6.3 81项视觉记录字段

`assetId, variantKey, fileHash, actualPixels, anchor, insets, targetDu, alphaReview, cropReview, readability, layerReview, result, screenshot, note`。

缺图、错误锚点、错误九切、关键调试内容不可辨识需修复；现有风格主观精修不扩大到P1-C。发现图片本体缺陷先记录来源和证据，未经授权不重新生成或覆盖原文件；可以先用正确已有variant解决绑定问题。

## 7. 杯层与圆体的显示合同

- 七层共同画布750×1000、原点世界(0,200)，pivot(0,0)，trim=false。
- 按既有back/tea/rim_back→小料→front/rim_front/base/label分层，不在材质上随意调透明度掩盖错误遮挡。
- 宽度倍率只作用杯层显示和对应杯几何，保持共同原点/缩放关系；不能每层独立裁切居中。
- 小料精灵完整边长=2r/0.9、中心锚点；显示跟随真实body位置/角度。碰撞线显示真实r，不通过缩小r匹配轮廓。
- 检查scale1与scale0.8，两侧、底和杯口的视觉/配置内缘共同截图。图上装饰外轮廓不等同碰撞内缘，标注可理解的对应关系。

## 8. 小屏HUD与触摸操作设计

当前18DU Label在小屏缩放后不可读。P1-A调试入口仍需要可操作，不能用“只有键盘才能验收”回避。

保持全局750×1334 SHOW_ALL及物理world不变，仅重排调试HUD：默认折叠为状态条，展开显示测试操作；至少P/R/C、九尺寸、压力、G及图库前后页有触摸入口。按钮触摸由UI消费，不向world透传；无需实现正式游戏HUD。

字号目标采用CSS显示空间：正文不小于14CSS px，按钮命中区域至少44×44CSS px，作为本地调试可操作性设计。将HUD锚点投影到真实Canvas CSS矩形，按实际DU到CSS缩放反算fontSize/命中尺寸；不要直接把devicePixelRatio再乘一次。可用安装版Camera.worldToScreen与Canvas/clientRect核对映射，具体调用按声明实现。

空间不足时分页/滚动调试面板并可折叠，不能把整套大字号文字堆在杯口上。运行观察时状态条不遮住侧底接触；完整诊断数据放导出，不强塞进画面。

## 9. 显示矩阵与验证操作

本组是执行agent的实际验收工作，不能因压力或后台用例未通过而全部写“需要人工视觉检查”。执行agent应使用可用浏览器/桌面工具操作、截图并检查图片，回读variant/inset/anchor/UITransform与物理摘要；只有具体认证或桌面控制权限缺失才单列依赖。截图存在、HTTP 200或页面无滚动都不是视觉通过断言。

Web Mobile最终候选：320×568、360×800、375×812、390×844、414×896、430×932、750×1334、1024×768、768×1024。每个视口先暂停、取body状态摘要，再调整显示并等待布局稳定；对比实体数、worldId、配置半径和暂停body状态完全不变。

检查Canvas实际rect、document滚动尺寸、设计分辨率、关键内容投影、HUD字/按钮尺寸；每个视口实际点一次P/R和图库翻页，不能只检查页面无滚动。

SHOW_ALL产生留白是允许的，不能拉伸物理。Web Desktop固定1280×960的历史溢出保留为该目标限制；本地移动验收统一Web Mobile，无须同时改安装目录模板。构建包与最终视口截图必须是同一buildId。

## 10. 输出与关闭标准

输出`nine-attempts.jsonl`、`nine-terminal.json`、`asset-visual-review.csv`、`resource-owner-ledger.json`、`errors-retry.jsonl`、`viewport-final.csv`和对应截图。所有任务/资源owner必须能关联到world/attempt。

关闭要求：队列不会无限等待或在取消后投放；错误后可真实恢复且唯一初始化；资源无本owner泄漏/错误释放；81项必要视觉和九切/杯层检查可追溯；最终包小屏可读可点、旋转不改变物理。任何“预览通过”都不能自动写成“最终包通过”。
