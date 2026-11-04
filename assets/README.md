# 素材入口

运行图片以[工程catalog](../奶茶挤挤/assets/resources/art/p1/catalog.json)为准：V2精选71项，来源为assets2中的六批、补充包和9:20背景；动画资源另有7项映射。实际接入及缺口以[最新验收](../docs/44-tap-host-start-review.md)和[动画设计](../docs/42-animation-start-physics-design.md)为准，不把图集存在当作全部效果完成。

- `assets2/`：六批、新背景、动画及补充素材原包，保留，不全量打包。
- [旧制作库索引](library/catalog.json)：原稿、母版、原始导出和来源/使用权；不代表当前运行绑定。
- [逐项图片规格](image-elements.json)：制作计划与后续需求，planned/deferred不表示已交付。
- 根`audio/`：正式渲染、九项运行音频、无损母版与来源，工程assets/resources/audio/p1c为运行副本。
- [音频标准](audio/production-requirements.md)、[音频设计](audio/design/README.md)、[音乐设计](../docs/21-music-design.md)。

构建工具仅在隔离副本生成较小派生纹理，原稿和根catalog保持。优化后单份RGBA预算不等于设备进程峰值，不能据此关闭平台约400MB问题；派生核验见[工具入口](../tools/README.md)。素材许可待核项不因接入或清理变为已确认。

2026-11-05清理只更新本说明，图片、音频、原始素材文档、目录索引和许可证未改；历史导出工作区与旧审查资料见[归档入口](../docs/archive-location.md)。需要重新导出时使用prepare_v2_art重新prepare，不直接安装旧归档里的选择清单。
