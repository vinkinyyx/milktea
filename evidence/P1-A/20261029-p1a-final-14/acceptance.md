# P1-A候选验收记录：20261029-p1a-final-14

## 候选与出口

本包是当前唯一冻结的Web Mobile最终候选。Creator 3.8.8 / Box2D包1.0.2 / PTM32；Creator实际子进程退出码36。构建产物位于 `D:/cocos-p1a-build/20261029-p1a-final-14`，独立HTTP为 `http://127.0.0.1:8784/`。源码、产物、环境和构建证据见本目录manifest及 `creator-exit.json`。

本轮验收**未达到P1-A出口**：矩阵52项，PASS 51、FAIL 1、未执行0。真实后台已能在现有Chrome中验证，无需Opera认证作为前置；唯一当前产品失败是LIFE-08配置加载跨Boot→PhysicsLab的显式恢复状态丢失，已独立复现两次。

## 已实际运行并通过

- 最终包身份、Cocos/Box2D/PTM/自动模拟回读；独立HTTP运行。
- 三圆：600步预热后观察3626步、60.426秒，未暂停，3实体且坐标有限。
- 220体P0/P1/P2同包对照；摘要探针220体观察3603步、60.016秒、0补步空档。固定24圆混合及严格220对照通过。repair03约102步积压暂停未在final14复现，根因不据此宣称已查明。
- 45组有限墙/端点/扫掠用例；接触end、多边接触、销毁清理、旧回调与ID复用隔离；20轮先触发真实接触的重建及第5/10轮中断恢复。
- 九尺寸1～9独立落杯。队列第9级被第8级合法阻挡，整轮失败计数到120后明确终止，保留608条历史；终态后继续125步稳定。取消测试通过。
- 配置404、非法JSON、无效配置连点、配置加载销毁、图片T键/点击重试/连续失败唯一恢复、图片加载销毁均通过。
- 81项图库实际加载与遍历；variant hash、透明边/锚点、九切及杯层复核；实际Cocos切片9样本为SLICED且物理快照不变。9视口操作P/R/图库翻页及返回后世界/刚体不变。

逐例步骤与路径在 `cases.csv` 及 `steps/`；原始运行数据分别保留在 `attempts/`、`raw/`、`physics/`。历史失败不覆写。

## 本轮真实后台定位与产品失败

- Playwright原始CDP会话仍持有保持可见的capture引用；只在新CDP会话发送focus emulation false无效。两个空白标签同窗口对照确认：撤销原始会话覆盖后实际切换即产生trusted hidden/show。该路径没有合成事件或绕过认证。
- 5秒、60秒、连续5分钟后台，手动暂停、图库、图片加载、队列和接触重建组合通过；LIFE-09同时有QUEUE/REBUILD两个真实子用例。LIFE-10前台250ms长帧实际触发五步BACKLOG保护。
- LIFE-08两次失败：配置请求在Boot真实隐藏时放行，返回后才建立PhysicsLab，未按R已分别推进13/16步，paused=false且pauseReasons=[]。期望为tick=step=0、保持RESUME_REQUIRED至有效R。
- 根因：协调器有当前backgrounded和事件历史，却无跨场景持久resumeRequired语义；新Lab订阅时已visible，未继承此前隐藏带来的待确认恢复要求。修复位置为HostLifecycleCoordinator.ts和PhysicsLab.ts；本轮仅定位并提供最小修复设计，未修改游戏运行源码。
- 324项运行源码哈希仍与final14清单一致。原43项前台记录保留，本次只补充真实后台/长帧证据并纠正LIFE-05/10用例对应；未声称已重跑全部前台用例或查明旧repair03压力现象。
- 原“43PASS+9未执行”的阶段摘要已快照到diagnostics/lifecycle-closeout-before；所有失败attempt继续保留，当前矩阵选择有原始结果和哈希的实际attempt。

定位与最小修复见项目docs/27-p1a-lifecycle-root-cause-and-fix.md；原始对照见diagnostics/lifecycle-control-02/stdout.log，选择与汇总见lifecycle/selected-attempts.json、lifecycle/diagnosis-summary.json。

## 复现

使用项目固定环境的Playwright CLI运行 `tools/p1a-runtime-case.js` 和同目录用例脚本，最终URL固定为 `http://127.0.0.1:8784/`，查询参数包含 `expectedBuildId=20261029-p1a-final-14`、`probeVersion=p1a-probe-v2`。三圆命令记录在 `build-command.md`；每个attempt的CLI输出与原始数据保留在 `attempts/`。

真实后台复现入口为tools/run_p1a_real_lifecycle.ps1，实际使用命令见build-command.md。修复运行代码后须新建候选、构建并完成受影响同包完整回归，不能将final14的PASS移植给新包。P1-A保持未放行，不进入P1-B。
