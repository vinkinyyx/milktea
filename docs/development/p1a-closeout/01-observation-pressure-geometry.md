# 01 观测、压力暂停与几何异常的实施设计

本文属于[总方案](../../26-p1a-detailed-repair-design.md)。下文接口和输出是目标设计，不代表已完整实现；最新基础及缺项见0节。

## 0. 执行纠偏：现有帧时探针不是完整几何探针

`repair-03`的LabProbe只记录逐frame标量，`afterStep(elapsedMs)`只累计步数/adapter时间，未实现本文要求的body标量visitor、有限墙几何、前后位置扫掠、逐step覆盖及异常冻结。下一轮应在现有实现上补齐，不能只因同名类存在就跳过。未实现的辅助函数先落代码并用手算夹具验证，禁止在验收脚本中直接调用设计伪API。

两次SUMMARY失败不能证明“宿主故障”；OFF通过也不能证明几何正确。现有`probeMs`仅是endFrame局部写入成本，不含完整采样、坐标读取、几何、计时及输出；暂停后仍采样会使分位数掺入空闲帧。下一轮必须按第3节的阶段和范围保存原始记录再归因。

## 1. 问题拆解与第一轮实验

不能把“第102步暂停”直接解释成Box2D穿透、设备性能不足或探针过慢。当前FixedClock在一个render update里最多走五步；还有积压即暂停。触发原因可能是渲染主线程长帧、调试器、浏览器前后台、物理/表现/探针开销，或先前未卸载的原型包装。

先保留最新包、旧探针和原220布局，不做参数调整。建立三组同包实验，每组新建/刷新测试页、只保留本组前台测试页，不能关闭用户其他浏览器。记录用户其他负载而非擅自结束它们。

| 组 | 物理与布局 | 观测 | 要回答的问题 |
| --- | --- | --- | --- |
| P0 | 原220一级圆 | 几何/详细探针OFF；保留声明成本的最小公共帧间隔、低频状态和首个暂停事件 | 原应用在当前前台环境能否持续运行 |
| P1 | 同一布局 | 本文轻量逐step统计 | 可接受开销的连续几何观测能否运行 |
| P2 | 同一布局 | 保留原对象分配/数组push探针 | 是否只有旧探针显著导致长帧 |

先各跑一次，出现差异再对差异组重复，不能为了凑次数重复所有已稳定通过的检查。全部记录状态和失败，不只挑最好的一次。24体混合布局在220体原因分离后按同样方法补测，固定原布局文件。

每组记录同一buildId、布局坐标哈希、配置哈希、杯倍率、实体数、视口、浏览器版本/启动配置、probe模式及当前前台证据。对照组间宿主条件变了就记录为混杂因素；先取得能比较的窗口，不能按“某次P0通过、稍后P1失败”直接确认原因。记录公共观测入口自身范围，避免把完全无记录的OFF组包装成已有帧时基线。

### 实验停止条件

- 正常：预热600个实际物理step，随后完成3600个实际step，并有至少60秒前台观察窗口。
- 失败：项目因积压暂停、非有限状态、侧底穿出、数量意外改变。保存窗口后停止该用例，不自动R反复恢复后累计成连续60秒。
- 前置失效：document隐藏、实际窗口被遮挡/调试器暂停等；记录事件，性能样本不能混入前台结果。应用是否正确保护另立用例。
- 超时：测试时钟/调度没有前进，保留未完成原因；不以墙钟等待70秒就直接PASS。

## 2. 观测入口与数据结构

### 2.1 按现有唯一时钟接入

在`PhysicsLab.update(dt)`最外层记录frame，在FixedClock的现有onStep闭包中调用一次adapter.stepFixed，再调用只读probe。不要为取样额外调用physics.step、director.tick或clock.update。

建议顺序：

```ts
// 示意：具体类型按工程现有声明实现。
update(dt) {
  probe?.beginFrame(performance.now(), dt, hostVisibility);
  try {
    if (pauseGate.canAdvance && clock) {
      const result = clock.update(dt); // 内部保持现有60Hz/五步保护
      if (result.pausedForBacklog) {
        pauseGate.add('BACKLOG');
        probe?.freezeAnomaly('CLOCK_BACKLOG', result);
      }
      syncViews();
    }
    refreshDiagnosticsIfDirty(); // HUD刷新也计入本frame工作量，不能遗漏
  } finally {
    probe?.endFrame(clock?.tick, adapter?.stepCount, performance.now());
  }
}

// FixedClock既有onStep闭包：
adapter.stepFixed();
probe?.afterStep(adapter, clock.tick + 1); // 当前_clock.tick尚未递增
sampleGravity(clock.tick + 1);
sampleCadence(clock.tick + 1);
```

probe异常不能静默吞掉后继续声称通过。记录`PROBE_ERROR`，停止该用例并恢复包装。probe本身不能控制玩法，只能经现有暂停入口请求保存异常现场。

### 2.2 拟新增LabProbe的最小接口

```ts
type ProbeMode = 'OFF' | 'SUMMARY' | 'LEGACY_COMPARE';
interface ProbeOptions {
  buildId: string;
  caseId: string;
  attemptId: string;
  probeVersion: string;
  mode: ProbeMode;
  worldId: number;
  cupScale: number;
}
interface ProbeExport {
  metadata: ProbeOptions;
  stepCoverage: { first: number; last: number; count: number; gaps: number };
  frameCount: number;
  overflow: boolean;
  aggregate: unknown; // 固定字段，见下节
  anomaly: unknown | null;
}
// beginFrame、afterStep、endFrame、export、dispose；不向外暴露可修改body引用。
```

Adapter补一个同步只读遍历入口，传标量而非每次创建PhysicalBodyState：

```ts
visitBodySamples(visitor: (
  id: number, level: number, radiusDu: number,
  xDu: number, yDu: number, vxDu: number, vyDu: number, sleeping: boolean
) => void): void;
```

visitor函数每个probe实例只创建一次。遍历内部仍从现有body/node读取和统一CoordinateMapper转换，不缓存引擎位置后当成真实结果。不要将此debug遍历加入P1-B的公共实体序列化合同。

### 2.3 内存与输出上限

- frame标量预分配Float64Array，容量14400帧；诊断最大观察窗口120秒，超过容量标`overflow=true`，不能丢样本后仍称完整。
- 每step全程累计：count、first/last tick、gaps、实体数变化、每边最小边距及实体/tick、最大连续负余量时长、非有限次数。
- 最近256step的摘要采用环形数组；只存tick、边距、异常实体和耗时，不存220个对象树。
- 每60个实际step生成一条秒摘要，最大120条；序列化在测试结束后进行。
- 每秒最多保留一个全体标量快照，环形保留最近10份。若全快照导致显著观测开销，单独关闭它并保留该组差异，连续几何聚合仍必须启用。
- 发生异常时一次性复制当前状态和最近窗口，之后冻结该异常。不得每帧console.log或通过CDP抓全体body。
- `LEGACY_COMPARE`只用于对照旧探针，独立页面、独立attempt，不混入最终几何结果。

这些数值是诊断存储容量，不是玩法参数，也不是性能放行阈值。记录实际使用字节数与溢出标志。

## 3. 耗时定位与修复分支

### 3.1 记录什么

每帧至少记录：wallGapMs、engineDtMs、steps、tickBefore/After、visibility、hasFocus、adapterMs、viewMs、probeMs、frameWorkMs、pauseReason。墙钟只用于诊断，不参与物理/危险规则。

需要细分时在Adapter内临时计时：syncSceneToPhysics、physics.step（包含接触回调）、syncPhysicsToScene、速度限幅。总量与子量有包含关系，不能重复相加。接触回调的细分计时只在短定位attempt打开，避免大量performance.now本身扰动。

离线计算p50/p95/p99、最大值、样本数、观察区间。对超过现有五步积压保护而暂停的那一帧，输出前后至少最近256step/相应frame窗口。engineDt与wallGap不一致要结合本机Game.DEBUG_DT_THRESHOLD解释。

### 3.1.1 测量范围、阶段和首次异常

- 每条记录带phase：SETUP、WARMUP、OBSERVE、FAILURE、PAUSED；同时带worldId、tickBefore/After和adapterStepBefore/After。汇总只取声明的同一phase，暂停后记录单列，不能加入失败前负载分位数。
- 分开记录`probeStepMs`（完整只读body采样和几何聚合）、`probeFrameMs`（frame记录）、测试结束的`probeExportMs`。计时调用与未覆盖部分写入measurementScopes；局部0.1ms不能证明完整插桩扰动仅0.1ms，完整扰动还需P0/P1对照判断。
- `labUpdateMs`仅代表PhysicsLab.update内工作；若未测引擎其他组件、渲染和主线程长任务，不能将`wallGap-labUpdateMs`直接判成浏览器节流。短定位attempt可采集引擎阶段、Long Task或性能trace，记录实际支持能力及缺失，不在常规组堆叠重型profile。
- 第一次BACKLOG/非有限/几何穿出时，立刻保存触发frame、已有最近256step/对应frame、布局、暂停原因和完整当前状态；不足256step按实际数量记录。冻结该attempt的故障窗口，禁止后续暂停帧覆盖它。导出结束后才序列化，失败数据自动落盘。
- 由宿主运行器读取已冻结结果并保存；不要依赖暂停后可能停止的目标页rAF来结束，也不要每frame通过CDP取全部body。若连异常结果都无法读取，记录具体target/连接错误，保留既有原始文件。
- WARMUP到OBSERVE以实际物理tick为边界。记录600预热step、随后至少3600连续观察step及OBSERVE墙钟区间；至少60秒只计算OBSERVE，不能将初始化、预热、暂停或多次R计入。若达到3600step时墙钟略不足60秒，保持同一连续运行窗口至两个条件都满足，不先暂停再空等补时长。超时依据预热/观察步数和墙钟要求制定，超时不是PASS。

### 3.2 原因决策表

| 结果 | 处理 |
| --- | --- |
| P0、P1稳定，P2暂停 | 确认旧探针开销；停止用旧探针做最终证明，保留失败；用P1补完整数据 |
| P0稳定、P1也暂停 | 先核对两组宿主条件与首次异常阶段；若完整probeStep/Frame成本或trace指向探针，再优化分配/转换/输出并复测；否则保持未归因，不能仅凭模式差异下结论 |
| P0/P1均暂停，wallGap陡升而frameWork不高 | 检查真实隐藏、调试器、窗口遮挡和其他宿主停顿；标明环境事件，稳定前台重测；不直接改引擎dt |
| P0/P1均暂停，physics.step高 | 查接触索引、fixture/接触数量、对象创建频率；先做下述O(1)索引，不调迭代数 |
| 主要开销在viewMs/label | 缓存诊断文案，状态变化/低频刷新；避免每帧重排长Label；物体位置仍跟随真实物理 |
| 连续多帧普通前台性能落后 | 在同包可复现后修复实际热点，保存前后数据；若仍不能达成则P1-A保持FAIL |

### 3.3 已知可检查的热点与最小修改

1. `idFromCollider()`目前遍历全部bodies；同一次碰撞从self/other和manifold多次查找。改成02定义的collider索引后O(1)解析，语义不变。
2. 诊断Label当前每帧重新拼接全文。将实体/接触/消息变化作为dirty，常规tick显示最多每0.1秒刷新；此为调试HUD刷新率，物理仍60Hz。
3. 老探针每body创建对象和record闭包。改成标量visitor与复用字段，禁止每步JSON序列化。
4. `syncViews`若测得占主要开销，比较现有坐标/角度，仅对发生变化的显示节点写入；容许每frame按实际新状态更新，不跳物理step、不动画驱动刚体。
5. 所有优化都要固定步、接触、帧时回归；不依靠剔除场内小料、关闭真实碰撞、缩小实体数或降低物理频率。

## 4. 独立几何判定算法

### 4.1 单位与独立性

从配置读取cx、bottomY、topY、底/顶宽和当前stage倍率；独立算内缘端点及切线，不调用正在被验收的碰撞盒中心来定义“正确边界”。这样可发现错误外扩，而不是自证。

所有公式输入DU；引擎node/linearVelocity只经CoordinateMapper转换一次。不能再乘PTM或100。左、右、底的法线独立单测，包含scale=1和0.8。

### 4.2 内侧距离

对边端点a、b：`t=(b-a)/|b-a|`，选择指向杯内的单位法线n。底部n=(0,1)；左边n=(dy,-dx)/L；右边n=(-dy,dx)/L。

圆心p、半径r：

```text
u = dot(p-a,t)
d = dot(p-a,n)
faceMargin = d-r
```

0≤u≤L时可检查对应有限内表面。不能在杯口上方继续使用无限延伸的斜线判断正常投放为侧穿透。

### 4.3 有限墙盒及端点

当前杯壁碰撞盒长度为L+wallThickness、向杯外偏移wallThickness/2；沿t的范围为[-wallThickness/2,L+wallThickness/2]，沿n为[-wallThickness,0]。探针可从配置独立建立这一矩形。

令q=(u,d)，矩形中心c=(L/2,-wallThickness/2)，半长h=((L+wallThickness)/2,wallThickness/2)：

```text
z = abs(q-c)-h
signedDistanceToBox = length(max(z,0)) + min(max(z.x,z.y),0)
circleBoxMargin = signedDistanceToBox-r
```

该值说明圆与有限墙盒的几何关系，但在墙外远离时也会为正，不能只看“没有相交”就宣称仍在杯内。必须同时记录内侧/外侧、历史进入杯体和跨越轨迹。

- 有效端点附近：检查端点圆距、矩形外角和相邻墙盒并集，避免两面都漏算连接。
- 顶部：没有封口；从顶部进入/离开不作为侧底穿出。超过topY后仍靠近侧壁端点的圆，用有限矩形检查接触，不能用无限墙。
- 底角：两个盒可能共同接触，分别记录，不强行只保留一面。
- 明确穿出：曾在内侧的圆跨到某墙外侧且沿该有限墙路径穿越，记录完整状态序列；整圆位于外侧且未经过开放顶部是硬失败。
- 圆可能在一step从内侧跳到外侧而未停留在重叠位置，必须用前后圆心线段与有限墙盒的扫掠检测补捉；探针扫掠只检测，不改变求解器。

扫掠实现可将墙矩形按r作Minkowski扩展，用线段与扩展面/四个圆角的最早交点判断；至少保留前后状态和疑似跨越标志供复现。不能用扩展AABB单独认定精确角落碰撞；AABB只能作粗筛。

可直接实施的局部扫掠步骤：

1. 用t/n把前后圆心变换为局部q0/q1；矩形范围记[u0,u1]×[d0,d1]。
2. 半径r扩展的精确形状可写为两个矩形`[u0-r,u1+r]×[d0,d1]`、`[u0,u1]×[d0-r,d1+r]`与四个角点半径r圆的并集。
3. 线段与矩形用slab法求进入/离开参数：每轴速度为0时检查该轴是否在范围内；其余轴求两边交点区间，和[0,1]取交。
4. 对四个圆求`|q0+t*(q1-q0)-corner|²=r²`的二次方程根，判别式非负后取[0,1]范围；零长度轨迹直接判点距。
5. 合并各部分命中的参数区间，得到是否经过扩展墙。起点本来就在接触层时单独标initialContact，不把合法反弹误判为从内穿出。
6. 只有轨迹确实横穿有限墙，且前后内外侧/是否从开放顶部绕行的历史一致，才升级为穿出证据；单独“命中墙”是正常碰撞。失败快照中保存q0/q1、命中t及实际world状态，便于独立重算。

## 5. 负余量、引擎skin与初始布局

### 5.1 本机实测源码尺度

本机集成Box2D的linearSlop=0.008m，polygonRadius=0.016m，项目映射为0.8DU/1.6DU。检查真实编译后端后记入environment。它们作为solver接触分类依据，不修改引擎、不把所有小于1.6DU的误差自动放行。

每个负余量片段记录：起止tick、峰值、实体/边、圆心是否跨内面、circleBoxMargin、速度、sleep状态、当时接触、是否初始就重叠、是否收敛。若超出已解释接触范围、持续增长或整圆穿出，保持FAIL；不能只报告600tick之后正余量。

### 5.2 原220布局可能自带轻微侧重叠

当前布局按同一高度水平宽度内缩r：`x=leftX(y)+r`。斜壁距离按垂线计算，为`r/sqrt(1+k²)`，k=0.1时r=18会自带约-0.0893DU的内面余量。应先计算并记录tick0，不能把这一初始几何差当成“后来穿墙”，也不能删除它来净化数据。

保留原布局作为原问题复现；另建“严格合法初始布局”对照：

```text
xMin(y,r,gap) = leftX(y)+(r+gap)*sqrt(1+k²)
xMax(y,r,gap) = rightX(y)-(r+gap)*sqrt(1+k²)
yMin = bottomY+r+gap
```

gap是该测试夹具声明的初始间距，不写入玩法配置。对照必须仍220体，保持半径/物理参数；若某层无法在间距下容纳原数量，输出布局生成失败，不能悄悄减少数量。保存完整坐标表和预检报告，原布局结果仍保留。

预检所有圆的有限侧底关系和两两间距，O(n²)只在测试开始一次执行，不放逐step热路径。混合24体原布局也做同样预检。

### 5.3 接触误差如何决定是否关闭

先建立独立单圆/双圆正常落底、左右斜壁的已知合法起点对照，输出相同solver下的稳态误差与瞬态片段；再解释压力片段。只允许有物理接触、局部、收敛且不发生真实外穿的求解误差被明确记录为数值接触。

不能临时设置一个更大的全局容差来覆盖失败。需要改变项目门禁时必须单独记录数值依据和规则决定，未经确认的异常在出口保持未关闭。

## 6. 旧数据校正流程

1. 原`continuous-three.json`和压力JSON保留字节及哈希。
2. 分析脚本读取原始x/y/r时，优先用本文正确法线重新计算；只有只剩错误margin且附带r时才用`correct=-raw-2r`，并写明转换条件。
3. 输出`derived/<source>-corrected.csv`与`derivation.json`，包含源哈希、脚本哈希、公式版本、条数、异常条数。
4. 单圆位于杯中心、左右镜像、端点外侧三个手算案例验证脚本。不能修改原CSV后继续沿用同一文件名。
5. 新结果必须说明属于旧构建数据重算，不冒充最新包重测。

## 7. 完整物理场景与断言

| 用例 | 夹具/动作 | 必须核对 |
| --- | --- | --- |
| 三圆 | 原3级圆三个高度，唯一时钟自然释放 | 600step后连续3600step，3实体，接触链、sleep与侧底 |
| 九级独立 | 每级清空世界后单圆释放 | 正确半径、底接触、无漏图；每级独立结果 |
| 左右壁 | 现有3级圆由合法中心以±1200DU/s撞墙 | 真实侧接触/底接触，左右镜像，扫掠不穿出 |
| 向下最大速 | 从杯内合法位置以-1200DU/s竖直撞底 | 底接触且不从底穿出；不得只测自由落体替代 |
| 最高级最窄杯 | scale0.8、r140，单独落杯 | 配置几何、落稳、左右/底余量；另测合法底角路径 |
| 九级左右/角 | 每级从由法线推导的合法起点向目标边/角运动 | 9×左/右/角，不凭截图推断全等级通过 |
| 压力原布局 | 220个一级圆 | 原问题复现、tick0合法性、连续覆盖、异常完整保留 |
| 压力合法对照 | 同220体独立预检布局 | 区分初始重叠与解算问题，不代替原用例 |
| 混合堆 | 原24体1～4级布局 | 实体/接触、大小相互作用、逐步侧底数据 |

原压力全九级混合尚未定义；如补极端大小比布局，使用固定坐标表并预检合法性，单列case，不冒充“200个最大圆都应塞入杯”。本阶段不要求不合理容量。

## 8. 验证与输出

纯TS单测覆盖：法线、镜像、有限线段/端点、矩形有符号距离、环形缓冲顺序、溢出标志、tick连续性、旧数据转换；真实运行覆盖上述场景。

输出：`pressure-compare.csv`、`frames.csv`、`step-summary.csv`、`geometry-episodes.csv`、`initial-layout.json`、`initial-layout-audit.json`、`anomaly.json`、`probe-environment.json`及录像。每份有buildId/attemptId/probeVersion，记录何时失败以及原因是否已关闭。
