# P1-A 2026-10-29实施复测：未通过

**阶段出口未满足，不进入P1-B。** 本次完成了详细方案中的一批代码、探针、构建隔离及证据工作，并实际启动新Web Mobile候选；压力复测、真实后台、接触驱动重建、队列、资源错误恢复与显示矩阵仍有失败或未执行项。旧失败记录和产物均保留。

## 已实施

- `CocosPhysicsAdapter` 增加 collider owner 索引，结束接触清理、销毁清理及旧generation回调隔离；出生校验提供具体拒绝原因。
- 新增 `LabPauseGate` 暂停原因集合和只读有界 `LabProbe`；HUD更新限频并抑制无变化写入。
- PhysicsLab 增加构建/attempt/probe身份、队列状态、逐候选拒绝原因、120次失败终止、取消逻辑；后台和图库恢复遵循暂停原因所有权。
- ArtAssets 对异步回调增加generation/owner校验；图库展示实际加载variant并保留素材锚点。
- 编辑器桥增加仅构建进程禁用开关；新增源码副本、构建、几何历史派生和纯逻辑检查辅助工具。
- 未修改玩法配置、引擎常量、图片、旧meta、`migrate-canvas.ts`、旧构建和旧失败证据。

## 实际执行

- Creator 3.8.8 / Box2D 1.0.2 / PTM32；TypeScript类型检查、纯逻辑检查、静态素材绑定检查通过。
- 新候选源副本与项目排除缓存后的文件哈希一致（1341文件、0差异）。独立构建任务日志显示完成，输出可由 `127.0.0.1:8772` 返回HTTP 200并进入实际PhysicsLab，运行回读buildId为`20261029-p1a-repair-03`，Box2D、PTM32、`autoSimulation=false`正确。
- 无探针压力对照运行70,013ms、4,231步，220实体均有限且未暂停；这不是600步预热+3600步几何连续验收。
- 轻量探针两次压力运行均FAIL：attempt `STR-01-002`在477步暂停；`STR-01-003`在156步暂停。第二次322帧有186次大于250ms间隔，墙钟间隔中位数约1000ms，探针p95约0.1ms。页面采样均报可见/聚焦，因此当前自动化宿主不支持归因到探针或游戏真实负载。
- 历史三圆边距原始记录保持不变；仅在`derived/`生成哈希可追溯派生CSV：12,603行，左右有效侧记录各12,537，600步后无负余量。它不是本轮最终包压力证明。

## 失败、未执行和外部依赖

- Creator子进程出现SIGTERM；构建任务日志随后显示完成且产物可运行，但包装进程`exitCode`为null。安装版builder可用包内入口仅为编译产物，尚不能将SIGTERM归因于正常回收。按构建出口要求，BLD-01为FAIL，不能声称独立构建闭合。
- 关闭Playwright focus emulation后真实切换标签仍为`visibilityState=visible`，无可信visibilitychange或引擎hide/show。真实后台5秒/60秒/5分钟及恢复组合未执行，需要可产生真实hidden/show的宿主或人工运行环境。
- P2原探针比较未执行：自动化宿主5秒内未达到30 tick，未取得有效比较。队列真实操作停留在level3、attempts=0并因积压暂停，未到120次终止。不能据此宣称九级原队列PASS或FAIL于合法空间结论。
- 220几何、24体混合连续观察未执行；探针没有几何采样、压力运行提前暂停。
- 当前`X`重建入口每轮没有先制造真实接触；接触驱动20轮、round5/10中断、接触end/多边接触/销毁的真实引擎矩阵未验收。
- 非法JSON、加载中销毁、持续失败连点与唯一恢复未执行；图库实际variant、透明边/九切/杯层及九视口P/R实操未做人工显示验收。
- 真机/抖音环境未执行，属于P2边界；它不替代本地Web Mobile问题。

## 出口判断

P1-A **未通过**。主要阻断为压力根因和几何连续验收、真实后台、真实接触重建隔离、队列终态/取消、必要错误恢复与显示验收，以及Creator退出码/SIGTERM归因。完整逐例及attempt状态见[cases.csv](cases.csv)，构建与源码清单分别见[build-manifest.json](build-manifest.json)、[source-manifest.json](source-manifest.json)。新产物位于 `D:/cocos-p1a-build/20261029-p1a-repair-03`；HTTP服务记录见[http-server.json](http-server.json)。
