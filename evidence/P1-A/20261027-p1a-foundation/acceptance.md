# P1-A 验收记录

本文件保留首次实施时的历史结果。后续全量类型检查、原代码问题修正与真实图片绑定见 [最新记录](../../progress-2026-10-27-art-binding/acceptance.md)；Creator运行验收仍未完成。

- Build ID：`20261027-p1a-foundation`
- 该 ID 仅标识验收记录目录；未生成 Cocos 构建产物。
- 配置：`design-v0.1`，SHA-256 `973eae177ac05c4a7076543323f7af479d4aaf065c3a2e380a6655df3ce6747f`
- 结论：**未通过阶段出口，不能进入 P1-B。** 纯逻辑与静态结构检查通过；本机没有 Cocos Creator，核心引擎验收无法执行。
- 运行日志：[`core-logic-results.json`](core-logic-results.json)；用例明细：[`cases.csv`](cases.csv)；环境：[`environment.json`](environment.json)。

## 已通过

| 范围 | 结果与依据 |
| --- | --- |
| 配置加载校验 | PASS：九级唯一性、非有限半径、出料权重总和等正/负例通过 Node 断言。 |
| 配置同步 | PASS：`python tools/sync_design_config.py --check`，客户端副本与根配置字节一致。 |
| 类型合同同步 | PASS：`python tools/sync_client_contracts.py --check`，Creator 资源内镜像与 `contracts/types.ts` 字节一致，脚本导入均位于 `assets` 内。 |
| 纯逻辑编译 | PASS：TypeScript 5.4.5 strict 编译 ConfigLoader、Clock、CoordinateMapper、CupGeometry 及类型合同。 |
| 时钟算法模型 | PASS：模拟30及60fps各运行2秒，均为120步/120 tick，回调模型最终位置与速度完全相同。此项没有加载 Cocos 或 Box2D。 |
| 暂停/恢复/长帧策略 | PASS：暂停期间不计tick，恢复不继承之前累积时间；超过5步追赶上限时暂停。仅为 FixedClock 单测。 |
| 坐标及几何纯逻辑 | PASS：屏幕映射、100DU=1规格米、Box2D米↔Cocos PTM像素转换、三段开放杯几何、最高级对象适配配置最窄杯底。引擎重力设置值经PTM setter换算的实现已核对；运行位移仍待实测。 |
| 资源结构 | PASS：scene/json/meta 均可解析，20个资源UUID唯一，场景对象索引引用范围有效，脚本UUID均可找到，各资产有meta。它不能证明 Creator 导入兼容。 |

## 引擎 API 对照（非运行验收）

实现对照 Creator 3.8.9 官方源码：`PhysicsSystem2D.gravity` setter 将 Cocos 单位除以 PTM；`RigidBody2D.linearVelocity` 直接传递给 Box2D；公开 `step()` 只推进物理 world，因此 adapter 在每步前后显式同步节点与物理 world。当前映射取 PTM=32 默认值，测试模型显示 `100 DU -> 1 Box2D长度单位 -> 32 Cocos世界单位`，`-9.8`规格重力映射为 `-313.6` Cocos API单位，经引擎 setter 得到 `-9.8` Box2D单位/s²。实际 Creator 补丁、PTM 值及运行结果仍未验证。

## 未执行 / 不适用

| 范围 | 状态与理由 |
| --- | --- |
| Creator 编辑器打开、补丁版本锁定 | NOT RUN：环境中未发现 Creator 命令、程序目录或 Dashboard 安装目录。 |
| 实际 Box2D 后端/API与有效构建目标 | NOT RUN：依赖 Creator 安装；工程当前没有编辑器生成的物理设置。源实现参考 Creator 3.8.9 官方代码，但这不是本机集成引擎版本证据。 |
| Box2D自由落体0.5/1秒实际位移及离散误差 | NOT RUN：PhysicsLab 已有采样输出，但无引擎可运行。`gravity-test.csv` 仅登记解析解和显式半隐式积分参照，不伪造引擎实测。 |
| 引擎30/60fps各120步、同初值可复现 | NOT RUN：纯 FixedClock 模型通过；未证明 Creator 的实际帧率、物理world步数或真实结果复现。 |
| 三圆/同级异级碰撞、九尺寸动态生成、60秒静置、最高级圆落杯 | NOT RUN：需 Box2D运行。 |
| 96圆压力测试不穿杯 | NOT RUN：需 Box2D运行和碰撞证据。 |
| 引擎暂停/后台恢复、连续重建20次、旧接触与异步回调隔离 | NOT RUN：需 Creator 生命周期与物理回调实测；输入操作及诊断计数已经实现。 |
| 截图/录屏、运行路径 | NOT RUN：无编辑器/播放器；`screenshots/README.md` 记录缺失原因。 |
| 平台构建 | NOT RUN：未安装 Creator、未选择目标平台。运行和构建状态分别记录。 |
| 美术、音频、游戏循环及服务 | N/A：P1-A范围明确不实施。 |

## P1-B 准入判断

**不满足。** 阶段规则要求工程能实际打开运行，锁定编辑器补丁与Box2D后端，并完成真实重力、固定步、碰撞/压力和生命周期证据。当前上述引擎验收均未执行，纯逻辑通过不足以替代。
