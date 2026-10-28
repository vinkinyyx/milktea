# 奶茶挤挤 · 项目设计与开发入口
**2026-10-29真实后台问题已定位：P1-A仍未放行。** final14矩阵已由43 PASS/9未执行收敛为51 PASS/1 FAIL/0未执行。撤销Playwright原始CDP会话的覆盖后，现有Chrome真实后台5秒/60秒/连续5分钟及其他组合通过；唯一产品失败为LIFE-08，Boot配置加载中隐藏→返回后新Lab未按R已自动推进13/16步。当前应修跨场景持久待恢复语义，见[定位与最小修复](docs/27-p1a-lifecycle-root-cause-and-fix.md)、[验收](evidence/P1-A/20261029-p1a-final-14/acceptance.md)和[矩阵](evidence/P1-A/20261029-p1a-final-14/cases.csv)。游戏运行源码本轮未改；修复后需新候选同包回归。


**历史基线（已由final14后续实测更新）：2026-10-29执行复核后已修订交付要求：** 下一轮从[总方案0节](docs/26-p1a-detailed-repair-design.md)和[新版实施提示词](docs/development/p1a-closeout/05-implementation-prompt.md)开始。明确帧时探针缺逐step几何、空世界重建、队列重试计数/历史、异步启动所有权及取证缺项；先验证环境能力，再补可执行夹具并完成同包矩阵。该段描述final14之前的复核基线；之后的运行结果见上方final14证据入口。

**2026-10-29 P1-A实施复测：仍未通过，不进入P1-B。** 已加入基础暂停gate、帧时探针、碰撞索引/过期回调隔离、队列状态、资源generation保护和构建桥接开关，尚未完整落实修复设计。候选`20261029-p1a-repair-03`压力复测暂停并记录到约1秒帧间隔，原因未明；真实后台、接触驱动重建、显示矩阵及构建退出码仍未闭合。详见[本轮证据](evidence/P1-A/20261029-p1a-repair-03/acceptance.md)；历史失败保留。

**2026-10-28收尾复测：P1-A仍未通过，不进入P1-B。** 右壁几何已修复；独立Web Mobile构建及部分物理、错误恢复通过，真实后台、最终包连续压力与重建旧事件隔离等仍未完成。详见 [收尾证据](evidence/P1-A/20261028-closeout/acceptance.md)，[上次失败记录](evidence/P1-A/20261028-resume/acceptance.md)保留。


版本：P1-A 验收中，玩法实施保持暂停｜日期：2026-10-29｜玩法参数：design-v0.1｜Creator 3.8.8已实际运行，重力/固定步/暂停部分验收通过，仍有后台、压力及其他验收缺口。本轮另完成音乐设计和两个Cocos MCP安装/桥接，详见 [当前进展与续做提示词](docs/22-current-progress-and-resume.md)、[音乐设计](docs/21-music-design.md)、[MCP配置](docs/23-cocos-mcp-setup.md)。此前现场见 [暂停交接记录](docs/20-pause-handoff-2026-10-28.md)。

这是一款竖屏、单人、立体质感的 2D 物理合成小游戏。玩家往奶茶杯投入小料，相同小料接触后升级，利用有限的晃杯机会腾出空间、提高成绩。首发候选已确定为抖音小游戏，开发者目前为个人主体。

## 本次交付的三个入口

- [13阶段任务、交付与验收](docs/12-delivery-phases.md)：每阶段做什么、交什么、如何判断完成。
- [初级开发者交接入口](docs/13-developer-handoff.md) 与 [完整开发手册](docs/development/development-handbook.html)：模块/文件、状态、算法、接口、异常和验收；包含22个API操作、SQL设计和类型合同。
- [213项图像可搜索清单](assets/image-elements.html) 与 [CSV清单](assets/image-elements.csv)：逐项规格、最早阶段、复用关系和制作要求，配套 [图像总规范](docs/14-image-production.md)。

在线仓库：[vinkinyyx/milktea](https://github.com/vinkinyyx/milktea)。原先测试版暂缓的功能仍保留，详见延期表与P2～P4阶段设计。

## 先读什么

- 当前进展和你接下来要做什么：读 [最新进展、详细安排与提示词](docs/22-current-progress-and-resume.md)。PhysicsLab18项真实图片已实际加载，P1的81项有开发素材入口；正式页面尚待玩法后实现。[10月27日进展](docs/19-progress-and-next-actions.md)仅作历史。
- 美术已交付并补件：先看 [最新补交复查](docs/18-supplement-cleanup-report.md) 和 [可浏览素材库](assets/library/index.html)。190项静态素材、16项程序参考、5项平台合同已到位，另2项为未立项候选；9份小料ORA是重建分层参考。P1的81项、117张PNG保留原运行版本，已导入Creator。

- 第一次了解项目：读 [项目说明](docs/00-project-brief.md) 和 [完整玩法](docs/02-game-design.md)。
- 想连续阅读全部内容：读 [完整策划总案](docs/complete-design.md)。这是分册的合并阅读版；维护时修改分册，再生成总案。
- 更适合直接阅读的版本：[浏览器阅读版](docs/complete-design.html)，带目录和主界面区域线框，可本地打开。
- 查看首个测试版做什么：[需求与版本范围](docs/01-requirements.md)。
- 查看以后还要做什么：[延期功能与路线图](docs/08-backlog-roadmap.md)。未实现的功能已编号，不会因为本次缩小测试范围而删除。
- 开始开发前：读 [物理规则](docs/03-physics-spec.md)、[技术方案](docs/06-technical-architecture.md) 和 [验证要求](docs/09-qa-acceptance.md)。
- 委托美术、动画、音频制作：[画面与动画规格](docs/04-art-ui-motion.md)、[音乐与音效规格](docs/05-audio-spec.md)、[素材清单](assets/asset-manifest.csv)、[音频清单](assets/audio-manifest.csv)。
- 核对选型和技能：[GitHub 调研与技能学习](docs/10-research-skills-frameworks.md)。
- 查看尚未被试玩证实的内容：[决策、风险与待验证事项](docs/11-decisions-risks.md)。

## 第一版与完整版本

| 版本 | 内容 | 当前状态 |
| --- | --- | --- |
| P0 设计基线 | 需求、物理、视听、技术选型、延期清单、验收用例 | 本次交付 |
| P1-A 工程与物理基础 | 工程骨架、配置/坐标、杯边界、九级圆体、固定时钟、PhysicsLab | 实际工程/图片导入及部分物理验收通过；独立构建和部分重建、碰撞已验证；后台及重建旧事件隔离等未完成，尚不放行 |
| P1-B～P1-D 本地可玩测试 | 投放/合成/晃杯、结束/重开、基础视听、本地纪录与试玩 | 未开始 |
| P2 抖音封闭测试 | 真实运行环境、生命周期、平台必要能力、合规与性能核查 | 未实现 |
| P3 完整首发 | 五款奶茶及解锁、身份与云数据、录屏奖励、每日券额度、标准/助力成绩与榜单 | 未实现 |
| P4 扩展运营 | 每日同题、好友挑战、成就/收藏、可选广告、多平台评估 | 未实现 |

P1 是本地测试，不代表可以免资质对公众发布。P2/P3 上线前要重新核对平台当时的要求。

## 参数怎么理解

1. 用户已经确定的方向是产品约束，例如立体质感 2D、抖音首发、分享奖励每日最多五次。
2. 本案补充的半径、重力、概率、解锁分数、动画时长、性能预算是**可执行的初始设计值**，不是已经通过试玩的结论。
3. [配置基线](config/design-baseline.json) 是数值的统一来源；更改配置时同步更新相关说明与规则版本。
4. 美术已收到P1～P4交付包并独立复核入库，具体缺件/条件见素材报告。音乐新增原创多轨MIDI设计草稿，最终音频与音效尚未交付/听测。Creator及Box2D已实际运行，Web构建和部分运行用例有证据；阶段验收仍未完成。

## 文档验证与维护

静态检查结果见 [校验记录](research/document-validation.json)；本轮阅读版与可搜索资产目录的浏览器检查见 [v0.2检查记录](output/playwright/handoff-review.json)。这些只证明文档产物，不证明游戏物理、性能、听感或好玩程度。旧版阅读检查保留在output/playwright，文件名区分。

维护图像清单先运行 `python tools/build_image_catalog.py`，再运行 `python tools/validate_design.py --build` 生成总案/开发手册并检查链接、配置、契约与来源；运行 `python tools/prepare_publish.py --archive` 生成交付ZIP。工具仅使用Python标准库。具体边界见 [仓库交付说明](docs/15-repository-delivery.md)。

## 资料与复用

已定向检索 GitHub，完整阅读并保存 13 份相关 SKILL.md、1 份配套参考和 4 份许可证。快照位于 `research/upstream/`，来源提交和文件校验信息位于 [技能清单](research/skills-manifest.json)。它们是项目学习资料，没有安装到全局技能目录，也没有执行上游脚本。

建议技术路线：Cocos Creator 3.8 LTS + TypeScript + 集成的 Box2D 2D 物理；具体编辑器补丁版本与物理后端在 P1 技术试验时锁定。Phaser + Matter.js 是网页优先场景的备选，见技术分册。

本项目独立放在 `D:/Workspace/TapTap/奶茶挤挤`，不复用旁边其他游戏项目的规则、素材或账号。
