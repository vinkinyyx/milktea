# 奶茶挤挤

竖屏2D奶茶小料合成游戏。Cocos Creator 3.8.8；发布目标为 TapTap 小游戏 `game.zip`。

**2026-11-07 当前执行入口**。用户反馈颠杯偏轻，已选定低处猛颠、高处横拨并保护杯内小料。新版设计、存档恢复修复、补充验收和执行提示词见 [强颠杯与上线前开发收口](docs/53-strong-cup-bump-and-release-closeout.md)。当前候选和剩余项见 [当前事实](docs/22-current-progress-and-resume.md)。

**2026-11-07 host5复核：整体尚未完成。** 用户host3截图已定位新局存档哈希构造TextEncoder失败；host4的typeof判断仍有不可构造函数缺口。本轮消除该宿主依赖，660组UTF-8/SHA比较一致，普通/无TextEncoder两环境完整回归均170/0。host5/1.7.0候选实际身份见CURRENT。同SHA Tap正常开局、错误UI、真实两广告及启动/内存尚待验证，不把浏览器通过当作宿主通过。

- [host5后开发闭环总设计与完整提示词](docs/51-development-closure-masterplan.md)
- [当前事实与待办](docs/22-current-progress-and-resume.md)
- [当前截图根因与host5修复](docs/50-host-boot-injection-fix/spec.md)
- [最新验收、根因与最终交付方案](docs/49-final-delivery-platform-device-plan.md)
- [当前开发执行提示词](docs/53-strong-cup-bump-and-release-closeout.md#11-可直接执行的提示词)
- [唯一候选及SHA](output/taptap-upload/CURRENT-CANDIDATE.md)
- [文档导航](docs/README.md)、[开发交接](docs/13-developer-handoff.md)、[工具命令](tools/README.md)
- [素材与来源](assets/README.md)、[历史归档与清理记录](docs/archive-location.md)

工程为 `奶茶挤挤/`。参数来源是 `config/design-baseline.json`，配置镜像校验通过；根 `contracts/types.ts` 与工程合同镜像已逐字节一致。排行榜、五款、云档、奖励券仍属于后续需求。

2026-11-05整理：旧构建和缓存已移除，历史文档、原始证据与旧ZIP移到项目外归档。保留现用源码、开发依赖、素材原稿、音频、技能、最新Web Debug/Release、一个Tap ZIP及必要派生验证快照。清理未修改游戏运行代码，未上传或发布。
