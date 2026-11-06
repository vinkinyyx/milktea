# 奶茶挤挤

竖屏2D奶茶小料合成游戏。Cocos Creator 3.8.8；发布目标为 TapTap 小游戏 `game.zip`。

**2026-11-07独立验收：客户端本地通过，进入平台真机收尾，整体尚未完成。** 170/0、回读失败免费恢复独立探针、StartupTrace摘要/32条环、typecheck/镜像/设计及94baeac3候选资源和313项源清单通过。实际平台阻断：广告MCP服务端TOKEN_REVOKED但本地仍认为有效；CLI可登录、应用1021353的包体声明/绑定有不一致提示。用户已确认1021353并选择安卓USB调试；ADB已就绪但尚无设备。下一步执行账号恢复、平台能力核对、真实两广告和同SHA启动/内存验证，不再反复重修已通过逻辑。

- [当前事实与待办](docs/22-current-progress-and-resume.md)
- [最新验收、根因与最终交付方案](docs/49-final-delivery-platform-device-plan.md)
- [下一轮开发执行提示词](docs/49-final-delivery-platform-device-plan.md#9-下一agent完整执行提示词)
- [唯一候选及SHA](output/taptap-upload/CURRENT-CANDIDATE.md)
- [文档导航](docs/README.md)、[开发交接](docs/13-developer-handoff.md)、[工具命令](tools/README.md)
- [素材与来源](assets/README.md)、[历史归档与清理记录](docs/archive-location.md)

工程为 `奶茶挤挤/`。参数来源是 `config/design-baseline.json`，配置镜像校验通过；根 `contracts/types.ts` 与工程合同镜像已逐字节一致。排行榜、五款、云档、奖励券仍属于后续需求。

2026-11-05整理：旧构建和缓存已移除，历史文档、原始证据与旧ZIP移到项目外归档。保留现用源码、开发依赖、素材原稿、音频、技能、最新Web Debug/Release、一个Tap ZIP及必要派生验证快照。清理未修改游戏运行代码，未上传或发布。
