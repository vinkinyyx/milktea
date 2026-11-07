# 历史归档与清理

2026-11-07 强颠杯收口后清理归档：

`D:\Workspace\TapTap\_cleanup-backups\奶茶挤挤-20261107-guard-closeout-cleanup`

目录内保留原相对路径：旧验收证据（CupAuto bump01/02、guard01–03）、旧 Tap 候选证据（bump01、guard01、host3–6）、Acceptance 全部门禁日志、asset-intake/supplement-2026-10-27、progress-2026-10-27-art-binding、tooling，以及过期评审文档 docs44–50（含 50-host-boot-injection-fix）。本轮只移出项目、不删除归档。

- 执行记录：[execution.jsonl](../evidence/maintenance/20261107-guard-closeout-cleanup/execution.jsonl)

本轮直接删除、不承诺恢复的内容：`build-artifacts/cocos-p1b-build-source`（1.24 GB staging 副本）、`build-artifacts/cocos-p1b-build`（6 个旧 Web 构建）、旧 Tap 包体（bump01、guard01、host3/4/5/6，仅保留当前候选 `20261107-guard02-tap-candidate-01`）、`runtime-deps`（Playwright 依赖副本）、`rewarded-tests`、`.screenshots`、`.trae-html-share-packages`、证据目录内的 Cocos 编辑器缓存 `creator-user-data`。均可用现用源码与 tools 脚本重新生成。

保留不动：当前候选 guard02 及 TapTap/guard02 证据、CupAuto/guard04 验收证据、`evidence/maintenance`、docs 现行入口与基础设计文档（00–23、38、51–53、archive-location、README 及 art/development/spec/visuals 子目录）、`assets/`、`assets2/`、`assets/library/`（含 source 原稿与许可证）、`audio/`、`config/`、`contracts/`、工程 `assets`、`extensions`（Tap 转换扩展）、`node_modules`、`skills/`、`research/`。项目内未发现游离图片/视频素材：运行图片以 catalog 绑定的 71 项为准并由 `verify:art` 核验。

2026-11-07清理归档：

`D:\Workspace\TapTap\_cleanup-backups\奶茶挤挤-20261107-project-cleanup`

目录内保留原相对路径：P1-A/CupAuto 旧验收证据、旧 Tap ZIP 证据（1.3.0/1.4.0/1.5.0 之前候选）、旧验收目录、已过期的进度/评审文档、旧设计汇总（complete-design）、旧设计 ZIP、旧 `client/` 工程副本。本轮只移出项目、不删除归档；需要历史材料时按原相对路径取回并核对内容。

- 执行记录（逐项动作与字节数）：[execution.jsonl](../evidence/maintenance/20261107-project-cleanup/execution.jsonl)

本轮直接删除、不承诺恢复的内容：`build-artifacts/cocos-p1b-build-source`（源码构建副本）、`build-artifacts/cocos-p1b-build`（旧Web/调试构建）、旧 `cocos-taptap-minigame-build` 候选、`rewarded-tests`、`__pycache__`、`.trae-html-share-packages`、`.playwright-cli`、`.screenshots`。均可用现用源码与 tools 脚本重新生成。

保留不动：`assets/`、`assets/library/`（含 source 原稿与许可证）、`assets2/`（美术设计包原稿）、`audio/`（音频原稿）、`config/`、`contracts/`、`奶茶挤挤/extensions`（Tap 转换扩展）、`奶茶挤挤/node_modules`（开发依赖）、`skills/`、`research/`。

2026-11-05清理归档：

`D:\Workspace\TapTap\_cleanup-backups\奶茶挤挤-20261105-project-cleanup`

目录内保留原相对路径：旧文档、旧验收原始证据、旧Tap ZIP和旧交付文件可找回；修改前的现行入口文档位于_active-docs-before-cleanup。此归档位于项目之外，不随当前项目发布。

- [清理计划](../evidence/maintenance/20261105-project-cleanup/plan.json)
- [执行记录](../evidence/maintenance/20261105-project-cleanup/execution.jsonl)
- [归档逐文件SHA256](../evidence/maintenance/20261105-project-cleanup/archive-files.jsonl)
- [清理后验证](../evidence/maintenance/20261105-project-cleanup/validation.json)

可再生的旧Web/转换中间物、源码构建副本、node_modules副本、library/temp、测试编译缓存与临时自动化输出直接删除，不承诺从归档恢复；使用现用源码和tools中的构建脚本重新生成。原工程开发依赖及Tap扩展保留，素材原稿、许可证、音频、配置、公共类型均保留。

需要历史材料时按原相对路径从归档复制单项，先核对hash，避免整个归档覆盖当前源码。当前报告中的历史链接可能指向项目外归档；历史文档内旧可执行包路径不表示产物仍有效。

更早的2026-11-03归档仍位于 `D:\Workspace\TapTap\_cleanup-backups\奶茶挤挤-20261103-review-cleanup`。本轮不删除该归档或父目录其它项目。

当前工作只使用[最新事实](22-current-progress-and-resume.md)、[最新验收](44-tap-host-start-review.md)及[唯一候选](../output/taptap-upload/CURRENT-CANDIDATE.md)。
