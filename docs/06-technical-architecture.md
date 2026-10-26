# 技术选型与架构

## 1. 建议与备选

建议：Cocos Creator 3.8 LTS + TypeScript + 引擎集成的 Box2D 2D 物理。具体编辑器补丁版、后端 JS/WASM、构建模式在 P1 spike 后写入工程配置和验证记录；本轮未安装或锁定运行环境。

| 方案 | 适配本项目的优势 | 代价/限制 | 判断 |
| --- | --- | --- | --- |
| Cocos Creator + Box2D | 场景/UI/动画工具完整；有抖音、微信构建路径；刚体堆积无需自写求解器 | 需要编辑器、节点资源绑定和真实小游戏适配 | 当前推荐 |
| Phaser + Matter.js | JS/TS 网页原型直接；Matter.js 可做刚体堆积 | 浏览器可运行不等于抖音可直接发布，平台适配和编辑工作需另核实 | 若项目转为 H5 优先，可重新考虑 |
| Unity + 对应小游戏转换方案 | 编辑器和资源生态可用，未来重 3D 更合适 | 对当前一屏 2D 目标增加构建与运行负担，仍要平台接入 | 当前不优先 |
| 自写 Canvas + 碰撞 | 展示原型轻 | 稳定堆积、连续接触、摩擦、休眠和恢复容易反复造轮子 | 不作为生产方案 |

不同时引入 Cocos Box2D、Matter.js 和 Planck 求解同一物理世界；框架版本不按 GitHub 星数选择。Phaser 当前主分支已涉及 4.x，不照搬旧教程的 3.x API；若采用它，必须重新锁定版本。

官方运行时源码仓库：[cocos-engine](https://github.com/cocos/cocos-engine)、[Phaser](https://github.com/phaserjs/phaser)、[Matter.js](https://github.com/liabru/matter-js)。Creator 编辑器条款与引擎源码许可分开核对，不能把一部分许可推广为所有工具、插件和素材都相同。

## 2. 一个核心，若干适配器

建议工程目录（未来实现，不代表这些脚本已存在）：

```text
assets/
  scenes/             Boot、Menu、Game
  prefabs/            Ingredient、Cup、HUD、Results
  scripts/
    core/             Session、Score、MergeRules、Rng、RunCommands
    physics/          PhysicsAdapter、ContactRegistry、MergeCommit
    presentation/     IngredientView、HUD、VfxPool、AudioManager
    persistence/      SaveSchema、LocalSave、Migration
    platform/         LocalAdapter、DouyinAdapter
    services/         后续 API、奖励、榜单客户端
  resources/config/   从设计基线导入的带版本配置
  art/ audio/
```

core 尽量不依赖场景节点和 `tt`。PhysicsAdapter 负责坐标、后端与安全物理步；平台接口负责登录、存储、录屏、广告和生命周期。表现层订阅逻辑事件，不拥有分数或奖励余额。

P1 用 LocalAdapter；缺失平台能力时明确标记不可用，不返回假的分享成功、广告完成或全球排名。

## 3. 权威与事件

每局唯一 `runId`、每个实体唯一 `entityId`、每条合成唯一 `eventId`、每次场景生命周期有 `epoch`。字段都可序列化。

核心事件：RunStarted、IngredientDropped、MergeCommitted、ShakeConsumed、DangerChanged、RunEnded、SaveCommitted。后续增加 ShareRewardGranted、CouponConsumed、ScoreVerified、StageUnlocked。

- 合成/计分事务同一次提交；重复回调不再计分。
- 广告或分享异步回调必须核对当前账号、请求和 epoch；旧局结束后不能回调到新局。
- 所有定时由明确系统拥有，暂停/离开时释放或冻结；不为 UI、物理各启动一个危险倒计时。
- 规则版本包含小料半径、概率、杯形、晃杯、计分、后端等版本摘要。只改背景颜色不必改变竞技规则版本。

## 4. 本地存档

数据包括 schemaVersion、rulesVersion、runId、revision、完整实体快照、分数/最大小料、当前与下一份、随机状态、dropIndex、机会、危险累计、逻辑 tick、设置和各款纪录。

采用双槽 A/B：写完整新 revision 与校验值 → 回读校验 → 切换当前索引；异常时回退到上一个完整槽。校验值用于发现损坏，不把它当反作弊签名。先保存最近完成的事务快照，不能在锁定物理回调中读取半成品。

活跃时按完整边界约 2 秒保存一次，暂停/后台/结算再保存。界面说“从最近保存处继续”，不承诺强杀进程绝不丢最后一秒。快照损坏要告知玩家并提供恢复备份或新局，不静默清空历史纪录。

恢复完整排序后的实体后才重新连线表现和接触。保存位姿速度不能保存求解器所有内部缓存，需实测恢复偏差；排名局如无法通过权威验证，应保留娱乐进度、标注不计榜。

## 5. 未来服务端边界

P3 需要平台身份、事务数据库和少量 API；不在 P1 引入生产云服务。优先沿用 TypeScript，数据库须有事务/唯一约束，具体供应商与部署成本在 P3 定案。

逻辑对象：Player、Run、BestScore、StageUnlock、RewardClaim、CouponLedger、ShareContent、Challenge。唯一约束包括奖励请求、内容去重、结算 ID 和用户/关卡/榜类型/规则版本。

接口草案：

- `POST /session/exchange`：平台临时登录凭证换项目会话；私钥只在服务端。
- `POST /runs`：下发 runId、规则、随机种子、允许资源。
- `POST /runs/{id}/finish`：提交操作日志/合成记录并验分，重复提交返回同一结果。
- `POST /share-rewards/claim`：依据平台支持的成功证据检查新内容、日额度，事务发券。
- `POST /runs/{id}/shake`：联网助力局消耗券，确认后生效；网络未知状态可查询，不能重复扣。
- `GET /leaderboards`：按关卡、榜类型、规则版本分页，返回数据时间。

客户端的“success”本身不是不可伪造的服务端证明。P3 spike 必须确认所选发布渠道实际提供的凭据/可核验能力；若无法可靠判定，不能假装已实现强验证，应调整奖励设计或记录风险。

公开榜启用前至少验证资源上限、输入合法性、份数当量、合成路径、计分和终局。高分逐步增加权威重放/复核；完整跨设备确定性尚未证实前，不承诺仅有种子就可精确复现。

## 6. 性能预算与测试场景

以下是项目软目标，尚未测量；平台硬上限在 P2 以实际文档/控制台核对。未达软预算先定位，不自动改游戏规则或删除物体。

| 项目 | 初始目标 | 测量条件 |
| --- | --- | --- |
| 画面 | 主流档 60 FPS，兼容档 30 FPS | 真机全杯、合成与晃杯、录屏分别测 |
| 帧时间 | 主流档 p95≤20 ms，兼容档 p95≤36 ms | 前台稳定场景采样，不用平均 FPS 掩盖卡顿 |
| 物理 | 固定 60 Hz，不随画质变化 | 同操作日志比较计分、事件顺序与漂移 |
| 输入可见响应 | p95≤100 ms | 点击、投放、晃杯分别录屏测 |
| 包体 | 首包目标≤3 MiB；P1 首次总下载≤8 MiB | 均为自定预算，不是宣称平台统一限制 |
| 内存 | 总峰值初始预算≤256 MiB；解码纹理≤32 MiB | iOS/Android 真机，记录基础运行占用 |
| 音频 | 下载≤2 MiB，总声部≤8 | 密集合成、来电与重开 |
| 粒子 | 同屏≤48 | 超额削减装饰，不丢逻辑 |
| 压力场景 | 200 个动态物体、10 分钟堆积、30 分钟循环 | 是测试负载，不是实际玩法硬上限 |

对象池先按典型量预热，按需增长。逻辑实体数量不得为了 FPS 静默截断。相同等级贴图共享，避免每个小料独立大材质/动态阴影。

P2 记录至少一台较弱 Android、一台主流 Android、一台支持范围内 iPhone，包含型号、系统、抖音版本、模式、构建和配置。没有设备时写未执行，不能以桌面浏览器代替真机。

## 7. 必须先做的小型技术试验

1. 编辑器可用性、引擎版本、平台导出与物理后端确认。
2. 三种占位圆在杯内稳定堆积、合成，不在回调锁内改世界。
3. 固定步所有权与长帧/后台恢复，验证不能双步进。
4. 九级半径、高密度堆积和晃杯，记录穿透/抖动/危险误判。
5. 本地存档恢复，不增加对象、分数或机会。

通过后再展开正式美术和五款关卡。若引擎在目标环境无法稳定运行，可基于真实失败证据重新比较方案，不因已有文档而强行保留选型。

## 8. 费用与许可边界

本次未安装引擎、购买资源或启用付费服务。框架开源不等于所有编辑器插件/素材免费；选定工具时检查当前许可。后端、CDN、日志、账号与广告结算费用尚未报价，不能据此承诺固定月成本。P1 无生产后台，降低早期运营负担。
