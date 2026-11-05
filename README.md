# 奶茶挤挤

竖屏2D奶茶小料合成游戏。Cocos Creator 3.8.8；发布目标为 TapTap 小游戏 `game.zip`。

**当前验收BLOCKED。** bd12b73已有部分R1–R4改动并已同步远端；R2原始回读场景、R3取消冻结和R4第四局资格通过本地检查，但加载超时未接通、Release裁剪编译失败、领取并发边界和复活重试UI仍待修复。真实Tap、广告及性能复测未完成。

- [当前事实与待办](docs/22-current-progress-and-resume.md)
- [最新验收与详细实施设计](docs/45-r1-r4-acceptance-next-design.md)
- [下一轮开发执行提示词](docs/45-r1-r4-acceptance-next-design.md#12-开发执行提示词)
- [唯一候选及SHA](output/taptap-upload/CURRENT-CANDIDATE.md)
- [文档导航](docs/README.md)、[开发交接](docs/13-developer-handoff.md)、[工具命令](tools/README.md)
- [素材与来源](assets/README.md)、[历史归档与清理记录](docs/archive-location.md)

工程为 `奶茶挤挤/`。参数来源是 `config/design-baseline.json`，配置镜像校验通过；根 `contracts/types.ts` 落后于工程复活类型，合同镜像校验未通过，须后续合并，不能用旧根文件直接覆盖工程。排行榜、五款、云档、奖励券仍属于后续需求。

2026-11-05整理：旧构建和缓存已移除，历史文档、原始证据与旧ZIP移到项目外归档。保留现用源码、开发依赖、素材原稿、音频、技能、最新Web Debug/Release、一个Tap ZIP及必要派生验证快照。清理未修改游戏运行代码，未上传或发布。
