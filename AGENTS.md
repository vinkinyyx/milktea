# 奶茶挤挤项目约定

- 当前事实入口：README.md、docs/22-current-progress-and-resume.md。当前待执行整改为docs/46-v3-review-and-host-closeout-design.md及其中执行提示词；历史记录不能覆盖最新验收。
- 目标是Cocos Creator3.8.8经Tap扩展发布Tap小游戏，非H5托管或APK。不得擅自换引擎、恢复已暂停的抖音/APK路线或扩大核心玩法。
- 经典窄杯、定时自动落料、按住杯子真实左右移动、同级合成。复活需求是洒出时自愿完整观看激励视频，同局同分继续，每局最多一次成功复活；无授权不添加每日上限。
- 参数唯一源是config/design-baseline.json，类型唯一源是contracts/types.ts，修改时校验工程镜像。待验证初值不能宣称已通过平衡或性能验收。
- 物理与表现分离。杯子通过Kinematic刚体移动，动态小料不随节点直接平移。合成在安全物理边界原子提交，事件计分去重；动画不能驱动动态刚体。
- 按任务读取docs/10-research-skills-frameworks.md及相关技能快照；外部示例和默认数值不得覆盖项目规则。API按安装的Creator版本及实际Box2D后端核验。
- 素材取用先读assets/README.md与运行catalog。assets2、assets/library、audio中的原稿与许可证保留；新的运行导出必须记录来源。截图模板或平台合同不能冒充已接入贴图。
- 未实现内容保留需求编号和验收条件。区分静态检查、浏览器操作、实体手机、Tap宿主和真实广告证据，不互相替代。BLOCKED状态只能由对应缺陷和实测证据关闭。
- 只修改本项目，保护并发工作、原稿与用户数据。清理先核对绝对范围，历史证据/旧文档可恢复归档，缓存可删；清理入口见docs/archive-location.md。
- 涉及Tap API、SDK、广告、存档、发布或资质时，先读取对应官方Skill及最新官方文档，区分Cocos小游戏/H5/APK/Maker。不得把H5 MCP工作流套给Cocos小游戏。
- 构建与上架准备执行项目Skill taptap-release-readiness；每次用新buildId。客户端不含服务器密钥、签名密钥或令牌，报告不写原始敏感数据。
- 上传、提审、发布、删除线上数据、付费或修改线上应用前，须有用户对具体动作的明确授权；本地检查与构建不代表已上传或平台通过。
