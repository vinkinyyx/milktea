# 02 真实后台、暂停组合、重建及接触清理设计

本文属于[总方案](../../26-p1a-detailed-repair-design.md)。以下为待实施的最小工程设计，不实现P1-B状态机。

## 0. 执行纠偏与环境预检

`repair-03`已有基础LabPauseGate和collider索引，但未完成本文跨场景HostVisibility、所有clock恢复归口、任务句柄和接触驱动X20。现有`rebuildTwentyTimes()`仍然是空世界循环；不论首尾计数是否正常，都不能替代每轮真实接触。不能只新增generation字段就将整组生命周期问题记为关闭。

下一轮首先做一次短真实后台预检：记录浏览器版本/启动方式/有关后台与焦点覆盖、目标target及窗口动作；撤销覆盖后真实切标签，非抢焦点读取DOM可信事件和Game事件。`repair-03`撤销后仍visible是已知失败，不能把重复相同步骤当作新诊断。按1.3继续查连接target、两页活动状态、实际窗口/遮挡和已允许的桌面或浏览器操作路径。需要认证或用户本机动作时早期说明具体依赖，期间推进接触、任务和错误恢复等独立工作。

`visibility=visible`、`hasFocus=true`不证明窗口未被遮挡或主线程无停顿；没有hidden也不证明引擎没有生命周期能力。外部阻塞结论必须附已尝试路径、实际错误、对照结果和仅受影响的case。不得绕过此前审批拒绝，也不得用合成事件补PASS。

## 1. 先解决为什么一直读到visible

**final14真实诊断更新：** 已通过原始会话对照确认并解决测试覆盖问题，见[定位与最小修复](../../27-p1a-lifecycle-root-cause-and-fix.md)。`newCDPSession(page).send(false)`不能释放Playwright原始会话持有的浏览器端capturer；不能再把返回成功当作全部覆盖已撤销。本机Chrome已产生可信真实hidden/show，不依赖Opera认证。LIFE-08另发现跨Boot→Lab的待恢复状态丢失，须按第2节及docs/27修复。

### 1.1 已核实的本机工具行为

本机npm缓存中`playwright-core/lib/coreBundle.js`在主frame初始化调用：

```js
this._client.send('Emulation.setFocusEmulationEnabled', { enabled: true });
```

所以旧实验不能只归因于“自动化读取会抢焦点”。该焦点覆盖可能让页面被视为持续活动。先撤销该覆盖，再通过真实标签切换观察，而不是重新启动曾被审批拒绝的普通Chrome进程。

这是一条可实施的新诊断路线，不是已证实的运行修复。不能预写BACKGROUND=PASS。

### 1.2 测试前置步骤与伪代码

使用现有Playwright CLI的run-code入口，实际协议能力需先检查；目标是撤销覆盖，不发送合成hidden。

```js
// 已在本机版本验证；属于内部测试入口，升级后必须重新核对，失配时明确失败。
const focusOwner = candidate => {
  const client = candidate._connection?.toImpl?.(candidate)?.delegate?._mainFrameSession?._client;
  if (!client?.send) throw new Error('Playwright original focus session unavailable');
  return client;
};
const targetFocusOwner = focusOwner(page);
const targetSession = await page.context().newCDPSession(page); // 独立会话只用于不抢焦点读取
let other, otherSession, otherFocusOwner;
// 当前本机Playwright默认值已由源码确认。测试配置显式记录恢复值。
const restoreFocusOverride = true;
try {
  await targetFocusOwner.send('Emulation.setFocusEmulationEnabled', {enabled:false});
  await installLifecycleRecorderThroughCDP(targetSession);
  await page.bringToFront();
  await waitVisibleWithoutRaf(targetSession);

  other = await page.context().newPage();
  otherSession = await page.context().newCDPSession(other);
  otherFocusOwner = focusOwner(other);
  await otherFocusOwner.send('Emulation.setFocusEmulationEnabled', {enabled:false});
  await other.goto('about:blank');
  await other.bringToFront(); // 真实切换活动页面

  // 从CDP Runtime.evaluate读取目标，不能bringToFront或截图目标页。
  await waitActualHidden(targetSession, 10000);
  const atHide = await readScalarSnapshot(targetSession);
  await hostWaitWithoutTargetRaf(5000);
  const whileHidden = await readScalarSnapshot(targetSession);

  await page.bringToFront();
  await waitVisibleWithoutRaf(targetSession);
  const shown = await readScalarSnapshot(targetSession);
  // 先记录show后的暂停状态，再通过真实画布操作点“恢复”。
  assertHiddenFrozenAndStillPaused(atHide, whileHidden, shown);
} finally {
  if (otherFocusOwner) await otherFocusOwner.send('Emulation.setFocusEmulationEnabled',
                                               {enabled:restoreFocusOverride});
  if (other) await other.close();
  await page.bringToFront();
  await targetFocusOwner.send('Emulation.setFocusEmulationEnabled',
                              {enabled:restoreFocusOverride});
  await targetSession.detach();
  // 辅助页的session随页销毁；若未销毁则显式detach。
}
```

以上函数名是待实现的验证辅助函数，不能当已有API调用。状态读取用`Runtime.evaluate`的returnByValue；返回只含标量、状态摘要和已复制轨迹，不传引擎对象。每个辅助函数有超时和错误输出，不空catch。

### 1.3 hidden的判定与失败分支

- 必须有真实`document.visibilityState==='hidden'`及visibilitychange的`isTrusted`记录；同时记录Game.EVENT_HIDE是否到达。
- `hasFocus=false`或window blur单独不能替代hidden；截图也不能代替事件。
- 隐藏后tick、stepCount、位置/速度摘要不变；目标页rAF和Cocos调度可能停止，不能用它们轮询。
- 10秒仍不hidden：输出目标/辅助target信息、两页可见性、是否已成功撤销焦点覆盖；立即结束这一前置实验，不再重复同一条超时脚本。
- CDP方法不支持或连接不允许：使用已连接浏览器真实切换，或可用的桌面工具/用户手动切换；页面内同一record器保留事件。需要登录认证则明确该依赖，不绕过审批。
- `Emulation.setPageVisibility...`、手工dispatch visibilitychange、`game.emit(EVENT_HIDE)`只能单列逻辑测试，不算真实后台。

长5分钟实验拆成begin/wait/read/end操作，宿主每次等待不超过60秒，期间可汇报进度；不要让一个不可中断的脚本挡住整个聊天。不能把多个短隐藏累计冒充一次连续5分钟。

## 2. 宿主可见性的唯一记录与场景切换

### 2.1 当前风险

AppRoot和PhysicsLab各自订阅hide/show；场景切换存在销毁/创建间隙。仅靠某组件当时收到的布尔值，可能漏掉初始隐藏，或在重复DOM/Game事件下互相覆盖。

最小设计：在现有AppRoot.ts中的AppRuntime附近放一个进程级轻量HostVisibility协调器（可独立文件，但不是新增常驻场景Node）。AppRoot第一次onLoad安装一次，跨Boot→PhysicsLab保留；各场景仅订阅/退订协调器状态。

```ts
interface HostVisibilityState {
  domHidden: boolean;       // Web可用时读取document.hidden
  engineHidden: boolean;    // Game.EVENT_HIDE/SHOW
  backgrounded: boolean;   // domHidden || engineHidden
  resumeRequired: boolean; // 真实隐藏后持续保留，show/切场景不能清掉
  hideEpoch: number;       // 标识待确认的隐藏代次，旧确认不能清新代次
  transition: number;       // composite状态真正变化时递增
  changedAtMs: number;      // 仅诊断
}
```

`installOnce()`注册一套Game hide/show；Web存在document时加一套visibilitychange，并立即读初始document.hidden。引擎事件监听在引擎可用后安装，不在模块导入时假设document或game已就绪。`subscribe(listener)`立即回传当前状态并返回unsubscribe。

原始DOM/Game事件均可记录，但composite状态未变就不重复增加暂停代次。show仅清除engineHidden，DOM可见仅清除domHidden；任一仍隐藏就保持backgrounded。AppRuntime.backgrounded可作为兼容只读镜像，禁止多个组件随意直接赋值。

隐藏时协调器持久置resumeRequired并标记hideEpoch；显示不清它。新Lab订阅即使backgrounded=false，也必须从snapshot继承RESUME_REQUIRED。仅用户R/恢复按钮通过ready/可见/任务guard后，才能以当前hideEpoch向协调器确认恢复；过期确认或后台确认拒绝。场景销毁/加载成功/图库关闭不得清此标记。原设计文字要求加载期间show后仍显式恢复，但示意状态未列出这项持久语义；final14 LIFE-08已证明只靠新Lab本地gate无法覆盖它。

协调器拥有的全局监听计数单独统计，不加入Adapter的3+N监听。普通场景销毁只unsubscribe，不把整个协调器关掉。独立测试结束才使用disposeForTests撤销；重新install不得叠加监听。

### 2.2 初始已隐藏

PhysicsLab.attach时拿到backgrounded=true，先建立暂停条件再初始化图片。图片完成后创建clock应立即按当前gate状态暂停；不能先推进一步后补暂停。协调器在加载期间收到show，仍保留“需要显式恢复”的条件，不能由加载完成自动解锁。

## 3. LabPauseGate：避免暂停原因互相覆盖

### 3.1 拟新增纯TS数据结构

```ts
type PauseReason =
  'INITIALIZING' | 'MANUAL' | 'BACKGROUND' | 'RESUME_REQUIRED' |
  'GALLERY' | 'REBUILD' | 'BACKLOG' | 'ERROR' | 'SAMPLE_COMPLETE';

interface PauseSnapshot {
  reasons: readonly PauseReason[];
  interruptionSerial: number;
  canAdvance: boolean;
}
```

实现可用Set或bitmask，无第三方库；不持有Node、RigidBody或计分状态。`reconcileClock()`是PhysicsLab中唯一普通pause/resume入口。FixedClock内部积压保护仍保留；onStep中采样结束仍允许立即停住，但随后把SAMPLE_COMPLETE同步到gate。

`canAdvance = ready && !destroyed && reasons.size===0`。reconcile先比较clock.paused是否需要变化，避免每frame重复resume把accumulator清零。

### 3.2 事件转换表

| 事件 | 修改原因 | 能否自动恢复 |
| --- | --- | --- |
| 开始初始化 | 加INITIALIZING | 否 |
| 初始化成功 | 移除INITIALIZING/本次ERROR | 无其他原因才恢复 |
| 初始化失败 | 加ERROR，移除INITIALIZING | 否 |
| P/手动暂停 | 加MANUAL，interruptionSerial++ | 否 |
| 宿主隐藏 | 加BACKGROUND和RESUME_REQUIRED，serial++ | 否 |
| 宿主显示 | 仅移除BACKGROUND | 否，RESUME_REQUIRED还在 |
| 打开图库 | 加GALLERY，保存进入时serial与原运行状态 | 否 |
| 关闭图库 | 移除GALLERY | 原来运行且serial未变、无其他原因才恢复 |
| 开始重建 | 加REBUILD，绑定重建task token | 否 |
| 重建安全边界完成 | 仅由同一token移除REBUILD | 其他原因均不能被清除 |
| 固定步积压 | 加BACKLOG，serial++，保存异常 | 否 |
| 120step样本完成 | 加SAMPLE_COMPLETE | 否 |
| 用户R/恢复按钮 | 见下面guard | 条件满足才恢复 |
| 销毁场景 | 标destroyed、取消任务、unsubscribe | 永不恢复 |

R的guard：ready、未销毁、宿主可见、未打开图库、无在途REBUILD/INITIALIZING/ERROR。通过后清MANUAL、RESUME_REQUIRED、BACKLOG、SAMPLE_COMPLETE；不删除所有原因集合，不触碰其他任务token。拒绝要显示原因。

图库打开时手动P、隐藏、积压均改变interruptionSerial；图库关闭不能恢复。用户R在图库中应被拒绝，不能等图库关闭突然生效。

### 3.2.1 迁移现有方法，避免两套暂停权威

- `pause(reason)`改为向gate添加对应原因，再reconcile；不再只改message与clock。
- `resume()`执行上表用户恢复guard；X20完成、图库关闭和图片初始化完成不得调用用户resume来清其他原因，只解除自己的reason。
- `clearAndRebuild()`、`rebuildTwentyTimes()`使用REBUILD及当前token；取消旧任务不能清掉新任务持有的REBUILD。
- `runFixedStepSample()`由用户V明确启动时，先要求ready、真实前台、无GALLERY/ERROR及其他在途任务；保存旧积压现场后，明确清除MANUAL、SAMPLE_COMPLETE、BACKLOG、RESUME_REQUIRED以开始一份新的受控试验，不清BACKGROUND。这个权限只来自本次V输入，不得被延迟回调继承到后来被暂停/隐藏的新状态。原120step结束逻辑仍在同一个onStep里立即暂停，并同步SAMPLE_COMPLETE。
- `sampleGravity()`和`sampleCadence()`仍只观察同一adapter；禁止为恢复采样直接调用clock.update。
- `update()`只在gate允许时向clock提交dt；Clock内部积压暂停应同步BACKLOG，否则gate不能在下一frame误将其重新resume。
- 先用纯TS转换测试确认所有分支，再回归原键盘1/2/3/4/5/6/V/N/P/R/C/X/G，确保原有试验入口未被新gate卡死。

### 3.3 恢复首帧

先通过真实实验记录show前后wallGap与dt。正常策略是show后项目clock保持暂停，玩家R发生时accumulator清空；第一次推进用下一次普通前台frame的dt。

若发现R恰在携带后台间隔的frame前被处理，使用一次性`resumeFence`：R成功时设true；下一次update只同步视图并清fence，不把该frame的dt交给clock；第二个普通frame开始物理。仅明确用户恢复边界可用fence，普通前台长帧不能统一清掉。记录fenceDiscardedDt而不是隐瞒丢弃。

该改动若不需要不硬加；有改动必须回归固定120step、暂停/恢复和前台超时保护，不修改Clock的五步上限。

## 4. 真实后台用例与判据

| ID | 操作 | 回读/预期 |
| --- | --- | --- |
| LIFE-01 | 下落中切另一标签5秒→回来 | 真实hidden/Game hide；hide内步数和状态摘要不变；show后仍paused |
| LIFE-02 | 同上60秒 | 同一连续隐藏区间，回来不补跑 |
| LIFE-03 | 同上5分钟 | 保留完整时刻及事件，无后台计时推进 |
| LIFE-04 | P后隐藏→显示→R | MANUAL保留至R，show不解除 |
| LIFE-05 | 运行→G→隐藏→显示→关G | RESUME_REQUIRED仍在，图库不自动恢复 |
| LIFE-06 | 已暂停→G→关G | 保持原暂停 |
| LIFE-07 | 阻断图片请求→真实隐藏→放行请求→显示 | owner有效但clock从创建即暂停，show后仍需R |
| LIFE-08 | 配置加载中隐藏→完成Boot切场景 | 协调器跨场景保持隐藏/恢复条件 |
| LIFE-09 | 九尺寸等待/重建中隐藏 | 不向旧世界投放；暂停代次阻止迟到恢复 |
| LIFE-10 | 前台注入一个单独逻辑长帧测试 | 五步上限保护仍生效；不能与真实后台混为一项 |

位置摘要应按entityId排序，复制DU位置/速度/角度/sleep。隐藏前到hide事件间可能有合法前台step；以事件时快照为冻结基点，而不是以鼠标点击前快照强行要求绝对相同。

## 5. 重建与任务取消：具体流程

### 5.1 分开三种身份

- `labLifetimeId`：该PhysicsLab组件实例生命周期。
- `taskGeneration`：用户启动的一项X20/九尺寸任务；被新任务替换时递增。
- `worldId`：每次真正替换Adapter/PhysicsWorld递增；X20的20轮各不同。

现有rebuildGeneration可兼容作为taskGeneration，不能为了表格好看每轮都递增它并把正在执行的X20取消。每轮记录round和worldId。

### 5.2 一次重建事务

1. 检查不在physics.step/contact回调，添加REBUILD；取消前一任务的具体回调并失效token。
2. 在当前world尚可读时复制诊断基线，标记旧Adapter无效；先退订监听/清逻辑接触，再请求node.destroy。
3. 清显示map和radius map，重置探针world边界，创建新PhysicsWorld与Adapter和三条杯边。
4. 下一正常引擎frame结束后，确认旧body延迟销毁已完成；通过读world计数和旧root有效性核验，不直接调用引擎内部_deferredDestroy。
5. 只有当前token/lab/world仍匹配，才移除该次REBUILD；gate决定是否恢复。不要直接clock.resume绕过MANUAL/BACKGROUND。
6. 异常时保留ERROR和诊断，不半初始化后继续运行；新任务可显式重试。

实际body延迟可超过旧脚本固定40ms。验证工具用有界轮询到两个相邻稳定frame的空世界基线；超时FAIL并保存对象列表，不通过多等几秒隐藏持续泄漏。

### 5.3 回调调度句柄

继续用Cocos scheduleOnce时，每次创建新闭包并保留函数引用：

```ts
function scheduleOwned(delay, owner, fn) {
  const callback = () => {
    ownedCallbacks.delete(callback); // 执行前移除，避免旧selector递归复用
    if (!owner.isCurrent()) { traceCancelledCallback(owner); return; }
    fn();
  };
  ownedCallbacks.add(callback);
  component.scheduleOnce(callback, delay);
}
function cancelOwned() {
  for (const callback of ownedCallbacks) component.unschedule(callback);
  ownedCallbacks.clear();
}
```

`isCurrent`包括lab未销毁、taskGeneration、worldId和需要时的pause serial。取消与过期guard同时存在，因为取消不能保证已排入执行的回调不再抵达。不要用unscheduleAllCallbacks把无关图库/诊断工作也清掉。

## 6. 接触注册和索引设计

### 6.1 解决现有线性查找和未知collider误分类

在Adapter内部新增：

```ts
type ColliderMeta =
  { kind:'ingredient'; entityId:number; worldId:number; active:boolean } |
  { kind:'cup'; boundaryIndex:0|1|2; worldId:number; active:boolean };
private colliderMeta = new Map<Collider2D, ColliderMeta>();
```

创建body/杯边时登记；销毁前active=false并移除。明确区分“已知杯边”和“未知collider”，未知不能因为idFromCollider返回null就被当作杯边。

保持公共contactId的当前格式：动态对`min|max`、杯对`id|cup:0/1/2`，底/左/右的索引顺序固定。worldId是内部所有权，不擅自改领域ContactPair合同。

### 6.2 事件算法

installContacts捕获该listener的collider、meta和Adapter自身身份。事件到达时：

1. Adapter.disposed或meta inactive/world不匹配→忽略并计入stale诊断，不写activeContacts。
2. self映射必须仍是捕获的meta；other必须在同一Adapter索引且active。缺一即记录unknown并返回。
3. 按双方kind计算canonical key；cup-cup忽略。
4. begin：只复制normalSpeed等标量，Map.set该key。两个动态listener可能各收到同一物理begin；活动对只保留一条，不把原始回调次数当活动接触数。
5. end：删除对应key，幂等；不递减一个可能变负的普通计数。只结束当前那一杯边，不批量删所有cup接触。
6. normal/manifold只在本次回调内读取并立即复制，不保存引擎可复用对象引用。

本P1-A圆体与每条Box边各单fixture；若以后引入多fixture形状，需另行升级fixture级计数，不在本次把复杂形状支持偷偷加入。

接触诊断在常规压力组只计数/聚合，详细标量事件使用有界缓冲；不能在每个原始回调里拼接JSON或持续console.log。短接触用例若要完整trace，声明容量和overflow；溢出时不能声称事件链完整。

### 6.3 销毁顺序

`destroyBody(id)`：标ref/meta inactive→退订该listener→清该实体所有活动对→移除body和collider索引→node.destroy。允许重复调用为幂等。旧listener引用即使被测试单独调用，也因meta inactive失效。

`dispose()`：最先置disposed=true，保存必要诊断；内部清理函数不能再通过assertAlive拒绝清理；清全部listener/活动对/索引，最后请求所有node销毁。重复dispose不重复释放。

`destroyCup()`同理按每个boundary meta清理，不只靠staticNodes.indexOf在延迟销毁阶段反查。对外创建/step在disposed后必须抛明确错误，不能静默返回成功。

## 7. 接触与重建的验收夹具

### 7.1 每轮都建立真实接触

20轮每轮：空世界→生成两个明确同级或异级圆→自然运行至指定动态对和底接触存在→暂停取样→执行重建→延迟销毁完成→核对实体0、接触0、监听3、body稳定4。再进行下一轮。不要只对X20空世界循环重新计数。

等待接触是按条件有超时的真实运行，不能固定睡100ms后假设已发生。baseline中引擎内部body为1、杯body为3需当次确认。

运行夹具必须在实施阶段补齐，并提供可重复启动的真实入口。每轮输出round/labLifetimeId/taskGeneration/worldId、接触建立tick及canonical pair、销毁前摘要、旧root失效结果、新世界两相邻稳定frame计数。缺任一轮接触前置即该轮未完成，不能仅输出第20轮首尾总数。

第5/10轮中断分成独立attempt：先达到该轮真实接触，再启动替代任务，继续观察旧任务原计划执行的时间范围，验证旧token不再推进后续round、新world正常。执行等待由宿主有界轮询管理；隐藏或手动暂停时暂停任务进度，不消费接触等待的有效运行预算，但仍保留防挂起的宿主总超时及原因。

### 7.2 多边接触及end

由配置求一个圆同时靠近底和左斜壁的合法位置，不硬编码错误x-r判定。令y=bottomY+r，左内面为x=leftX(y)+r*sqrt(1+k²)，以微小初始间隙从上方放下让solver自然建立底/侧接触。若尚未同时接触，不算该用例已执行。

记录两条cup key都存在；通过测试专用的有限向右运动/外力让侧接触结束，保持底接触，确认只删左key。测试动作的速度/力写在夹具，不修改玩法参数。

动态体begin→分离用相同方式，先观察指定key再在安全边界施加测试速度；等待真实end与key删除。不能直接从Map中删key来伪造end。

### 7.3 旧事件隔离

- 真实集成：销毁/重建前有接触，重建后实体ID从1复用，监测旧world回调不能写入新Adapter，旧队列原定时刻之后继续观察。
- 单元隔离：捕获旧listener函数，dispose后在测试替身上调用，断言旧Adapter不复活、新Adapter不改变；明确这是单元检查，不替代真实碰撞。
- 第5/10轮中断：启动另一重建或九尺寸任务，旧X20后续round不能再出现；记录取消token和新world。

## 8. 验收输出及关闭标准

输出`lifecycle.jsonl`、`pause-transitions.csv`、`rebuild-contact.csv`、`contact-events.csv`、`stale-callbacks.json`和操作录像。每条有lab/task/world身份、tick、宿主事件来源、状态摘要。

完成要求：真实hidden/show闭合；所有暂停组合按表转换；20轮真实接触后清理；多边end和销毁清理正确；旧回调不影响新world；纯状态机测试与真实宿主/引擎证据各自标明。任一项前置条件未取得就保持未执行/阻塞，不能由模拟事件替代。
