# 奶茶挤挤 · 项目设计与开发入口

版本：P1-A 实施中｜整理日期：2026-10-27｜玩法参数：design-v0.1｜状态：Cocos 工程骨架与纯逻辑模块已建立；待 Creator 3.8 LTS 实机运行及 Box2D 验收。

这是一款竖屏、单人、立体质感的 2D 物理合成小游戏。玩家往奶茶杯投入小料，相同小料接触后升级，利用有限的晃杯机会腾出空间、提高成绩。首发候选已确定为抖音小游戏，开发者目前为个人主体。

## 本次交付的三个入口

- [13阶段任务、交付与验收](docs/12-delivery-phases.md)：每阶段做什么、交什么、如何判断完成。
- [初级开发者交接入口](docs/13-developer-handoff.md) 与 [完整开发手册](docs/development/development-handbook.html)：模块/文件、状态、算法、接口、异常和验收；包含22个API操作、SQL设计和类型合同。
- [213项图像可搜索清单](assets/image-elements.html) 与 [CSV清单](assets/image-elements.csv)：逐项规格、最早阶段、复用关系和制作要求，配套 [图像总规范](docs/14-image-production.md)。

在线仓库：[vinkinyyx/milktea](https://github.com/vinkinyyx/milktea)。原先测试版暂缓的功能仍保留，详见延期表与P2～P4阶段设计。

## 先读什么

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
| P1-A 工程与物理基础 | 工程骨架、配置/坐标、杯边界、九级圆体、固定时钟、PhysicsLab | 代码及纯逻辑检查已完成；引擎运行/物理验收受 Creator 未安装阻塞 |
| P1-B～P1-D 本地可玩测试 | 投放/合成/晃杯、结束/重开、基础视听、本地纪录与试玩 | 未开始 |
| P2 抖音封闭测试 | 真实运行环境、生命周期、平台必要能力、合规与性能核查 | 未实现 |
| P3 完整首发 | 五款奶茶及解锁、身份与云数据、录屏奖励、每日券额度、标准/助力成绩与榜单 | 未实现 |
| P4 扩展运营 | 每日同题、好友挑战、成就/收藏、可选广告、多平台评估 | 未实现 |

P1 是本地测试，不代表可以免资质对公众发布。P2/P3 上线前要重新核对平台当时的要求。

## 参数怎么理解

1. 用户已经确定的方向是产品约束，例如立体质感 2D、抖音首发、分享奖励每日最多五次。
2. 本案补充的半径、重力、概率、解锁分数、动画时长、性能预算是**可执行的初始设计值**，不是已经通过试玩的结论。
3. [配置基线](config/design-baseline.json) 是数值的统一来源；更改配置时同步更新相关说明与规则版本。
4. 正式美术、音乐、音效尚未制作。本轮建立了 Cocos 工程骨架，但本机没有 Creator，尚未确认工程可由编辑器打开、尚未运行 Box2D 场景或构建。

## 文档验证与维护

静态检查结果见 [校验记录](research/document-validation.json)；本轮阅读版与可搜索资产目录的浏览器检查见 [v0.2检查记录](output/playwright/handoff-review.json)。这些只证明文档产物，不证明游戏物理、性能、听感或好玩程度。旧版阅读检查保留在output/playwright，文件名区分。

维护图像清单先运行 `python tools/build_image_catalog.py`，再运行 `python tools/validate_design.py --build` 生成总案/开发手册并检查链接、配置、契约与来源；运行 `python tools/prepare_publish.py --archive` 生成交付ZIP。工具仅使用Python标准库。具体边界见 [仓库交付说明](docs/15-repository-delivery.md)。

## 资料与复用

已定向检索 GitHub，完整阅读并保存 13 份相关 SKILL.md、1 份配套参考和 4 份许可证。快照位于 `research/upstream/`，来源提交和文件校验信息位于 [技能清单](research/skills-manifest.json)。它们是项目学习资料，没有安装到全局技能目录，也没有执行上游脚本。

建议技术路线：Cocos Creator 3.8 LTS + TypeScript + 集成的 Box2D 2D 物理；具体编辑器补丁版本与物理后端在 P1 技术试验时锁定。Phaser + Matter.js 是网页优先场景的备选，见技术分册。

本项目独立放在 `D:/Workspace/TapTap/奶茶挤挤`，不复用旁边其他游戏项目的规则、素材或账号。
