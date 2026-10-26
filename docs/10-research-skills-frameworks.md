# GitHub 技能、框架与官方资料调研

## 1. 研究范围和证据边界

观察日期：2026-10-26。以当前会话已确定的个人开发、抖音首发、2D立体质感、刚体堆积和轻量运营为筛选条件。

已实际读取 GitHub 仓库元数据、指定 SKILL.md、配套文件和许可证；已完整阅读并保存13份技能、1份Cocos配套参考和4份MIT许可证。来源固定到提交，文件blob标识见 [skills-manifest.json](../research/skills-manifest.json)，原文保存在 `research/upstream/`。

这是项目范围的学习快照，不是全局安装，也没有执行外部仓库脚本。技能文本的质量需要人工判断，不能因为叫“professional”或星数高就当作经过生产验证。没有对所选技能做运行时触发评测，不能声称它们已安装、热加载或能自动完成游戏。

框架源码与官方文档用于选型；没有安装引擎、运行示例、做帧率基准或完成小游戏导出。所有性能承诺仍需P1/P2试验。

## 2. 已读并应用的13份技能

| # | 技能 | 仓库 | 应用于本项目 | 不照搬的部分 |
| --- | --- | --- | --- | --- |
| 1 | cocos-creator-mobile-game | Fable-Forge/cocos-creator-mobile-game | 先查场景/配置/节点绑定；状态与UI分离；明确编辑器验证 | 仓库标记beta，主例偏微信/Android，不能代替抖音官方规则 |
| 2 | game-designer | edhahn/agent-skills | 动机、输入输出、系统依赖、GDD、边界和调参项 | 默认团队与UE/Godot背景不适用于本项目 |
| 3 | eval-driven-game-development | edhahn/agent-skills | 规则校验与平衡观测分开；假设不能写成通过；试玩不能由模拟替代 | 不为了完整建立庞大平衡CI；本轮不写尚无游戏的模拟器 |
| 4 | 2d-games | vudovn/ag-kit | 图集、pivot、层次、简单碰撞、固定物理步 | 平台跳跃、tilemap和示例动画帧率不是本游戏规则 |
| 5 | game-art | vudovn/ag-kit | 软阴影风格、轮廓/色彩、资源母版、动画与命名 | “移动端某固定素材尺寸”等泛化值按本项目尺寸重定 |
| 6 | game-audio | vudovn/ag-kit | 声音分类、变体、混音、加载和暂停 | 不引用“音频占体验50%”这类无证据表达；不引入战斗/3D音频系统 |
| 7 | mobile-games | vudovn/ag-kit | 触屏遮挡、安全区域、后台暂停、热量和性能 | 不强制同时做横屏；画面30FPS建议不改变60Hz物理 |
| 8 | physics-interaction | jammyfu/open-game-skills | 唯一运动权威、力与冲量、质量范围、保存状态、固定步 | 搬运/投掷箱子的示例转成杯内堆积测试，不复制Godot API |
| 9 | art-bible | jammyfu/open-game-skills | 统一轮廓、调色、生成图验证、皮肤约束 | 不套用任何现有品牌或大作风格指南 |
| 10 | audio-feel | jammyfu/open-game-skills | 逻辑事件→cue；独立表现随机流；并发上限；后台清理 | 不需要复杂分层战斗和对白 |
| 11 | game-state-flow | jammyfu/open-game-skills | 会话ID、epoch、单一状态转移、唯一结算 | 不引入SCXML运行时或多余通用框架 |
| 12 | performance-budget | jammyfu/open-game-skills | 明确设备/模式/场景，采样p95等，区分物理与渲染 | 不把项目目标当行业通用常数或已测结果 |
| 13 | cocos | jammyfu/open-game-skills | 更新/调度/物理的所有权、音频与生命周期、资源释放 | 具体API必须按安装补丁版本复核 |

配套读过：Fable-Forge 的 `references/cocos-workflow.md` 和 open-game-skills 的共享合同（用于理解方法；本轮仅将实际采用的技能及许可证固定保存）。本地 `ui-ux-pro-max` 已读取，提取触摸区、对比、安全区、反馈与弱动态原则；其中网页框架、SVG运行时、深色模式等默认建议没有机械推广到Cocos小游戏。

### 来源仓库与固定提交

- [Fable-Forge/cocos-creator-mobile-game](https://github.com/Fable-Forge/cocos-creator-mobile-game)，`2909edb86273a011b1d877b79bc0eaceb0f6dacb`，MIT；提交日期2026-09-15。应用范围窄、易审阅，beta成熟度需保留判断。
- [edhahn/agent-skills](https://github.com/edhahn/agent-skills)，`ffc6fc4bf1408bc3cac522916bb58e603f39ab45`，MIT；提交日期2026-09-07。重点采用设计规格和证据纪律。
- [vudovn/ag-kit](https://github.com/vudovn/ag-kit)，`549ba3dc2eb1d40fccb5b6d792eba4101c80cd69`，MIT；本次固定提交日期2026-08-31。原 antigravity-kit 地址已重定向；技能目录实际为 `.agents/skills/`。
- [jammyfu/open-game-skills](https://github.com/jammyfu/open-game-skills)，`b6847e82aa16e0e00c36b251e1fbf1dd5656456e`，MIT；提交日期2026-10-23。只选本项目需要的职责，不激活整个目录。

这些日期是本次固定版本的提交信息，不等于作者对质量或兼容性的保证。快照保留上游MIT许可与作者署名。

## 3. 各阶段如何继续用技能

- 需求阶段：game-designer + eval-driven-game-development，先说明规则、范围、初值与可测问题。
- 物理阶段：physics-interaction + game-state-flow + Cocos工作流；验证后端、单位和更新顺序。
- 视觉阶段：art-bible + game-art + 2d-games，按素材清单交付和核对实际碰撞。
- 音频阶段：game-audio + audio-feel，先事件表，再素材、混音与设备听测。
- 性能阶段：performance-budget + mobile-games，按真实设备场景记录；不只跑桌面预览。

上游技能中的“始终读取全部文档”“使用某默认引擎”等示例不自动成为本项目的额外要求；用户范围和当前任务优先。

## 4. 框架比较的实际依据

### Cocos Creator / cocos-engine：首选

[GitHub README](https://github.com/cocos/cocos-engine)描述了2D/3D、Web与小游戏平台支持。已核对官方3.8文档的2D物理、音频、抖音导出和iOS性能。仓库本次观察默认分支为 `v3.8.9`，不等于已安装或已验证这个编辑器补丁。

可迁移：场景/精灵/UI、固定步刚体、平台导出路径。不可迁移：官方能力存在不等于本项目无需真机验证。引擎运行时、编辑器、Spine等第三方组件许可必须分别核对。

### Phaser：可信备选

[GitHub README](https://github.com/phaserjs/phaser)明确是JS/TS HTML5框架，支持WebGL/Canvas；仓库本次读取默认分支涉及4.x，不能把旧版教程当当前API。

可迁移：快速网页试玩、纯代码迭代和2D资源组织。限制：抖音小游戏不是完整浏览器；当前调研不足以确认“原包直接发布”，适配成本需要真实试验。若首发改为H5，它的优先级会上升。

### Matter.js：物理库，不是完整发行框架

[GitHub README](https://github.com/liabru/matter-js)定位为Web的2D刚体物理，含混合形状、堆积等示例，MIT。

可迁移：物理原型和行为对照。不可迁移：它不提供完整账号、关卡、UI、存档、平台分享和发行链路。已经选择Cocos集成Box2D时不再叠一套Matter世界。

### Box2D：原理与后端参考

[GitHub](https://github.com/erincatto/box2d)和[Simulation文档](https://box2d.org/documentation/md_simulation.html)用于理解刚体、固定步、力和接触。当前官方网页是较新版本，不能推断Creator集成版API或跨设备确定性与其相同。

没有采用：区块链/NFT游戏技能、Unreal大型3D工作流、等距地图与寻路工具包。它们虽在搜索中出现，但不对应当前玩法和平台，不为扩大技能数量而引入。

## 5. 官方资料索引

| 资料 | 支持的决策 | 限制 |
| --- | --- | --- |
| [Cocos 2D物理简介](https://docs.cocos.com/creator/3.8/manual/zh/physics-2d/physics-2d.html) | Builtin只做检测，本项目需要Box2D刚体 | 实际后端仍待锁定 |
| [Cocos 2D物理系统](https://docs.cocos.com/creator/3.8/manual/zh/physics-2d/physics-2d-system.html) | 固定步、重力和迭代配置 | 示例不是本项目实测参数 |
| [Cocos 抖音发布](https://docs.cocos.com/creator/3.8/manual/zh/editor/publish/publish-bytedance-mini-game.html) | 有对应发布路径 | 不代表导出即通过审核 |
| [Cocos AudioSource](https://docs.cocos.com/creator/3.8/manual/zh/audio-system/audiosource.html) | 可用引擎音频能力 | 编码、循环与后台要听测 |
| [抖音iOS优化](https://docs.cocos.com/creator/3.8/manual/zh/editor/publish/bytedance-ios-optimize.html) | 设备/模式下分别测内存与性能 | 本项目尚无实测值 |
| [抖音录屏奖励审核](https://developer.open-douyin.com/docs/resource/zh-CN/mini-game/guide/contactus/record-share) | 成功兑现、取消/重复录屏处理 | 成功证据如何服务端核验仍需试验 |
| [抖音必接能力](https://developer.open-douyin.com/docs/resource/zh-CN/mini-game/guide/minigame/essential-skills) | 侧边栏复访；自定义输入相关要求 | 发布前再次核查当前条款 |
| [抖音ICP核准](https://developer.open-douyin.com/docs/resource/zh-CN/mini-game/guide/minigame/icp/icp-filings) | 发布与本地测试分开 | 备案周期不等于开发周期 |
| [Suika Game 官方玩法](https://suikagame.jp/about/) | 左右投放、同类接触、合成和杯满的直接参考 | 不复制素材、品牌、完整表现或代码 |
| [Stack 官方商店页](https://apps.apple.com/us/app/stack/id1080487957) | 一屏、简洁反馈和个人纪录的相邻参考 | 时机堆叠并非合成物理，不照搬规则 |

## 6. 研究停止点与后续核查

当前资料足以形成可执行P1规划，继续收集通用技能不会替代物理原型。仍需在实施时核实：可用编辑器补丁、集成Box2D版本与单位、目标真机、录屏奖励证据、个人账号实际权限、素材版权和当前发布要求。

没有调用付费生成服务，没有安装GitHub示例依赖，没有运行未知脚本，没有创建外部账号或对外发布。
