# Cocos 构建产物

本目录收纳《奶茶挤挤》的 Cocos 构建输出、隔离源码快照和 Creator 用户数据。各子目录按原名称保留，便于按 build ID 查找和复核；历史构建和证据所需的文件没有删除。

| 原用途 | 当前位置 |
| --- | --- |
| P1-A 构建输出与源码快照 | `cocos-p1a-build/`、`cocos-p1a-build-source/` |
| P1-B/P1-C 构建输出与源码快照 | `cocos-p1b-build/`、`cocos-p1b-build-source/` |
| Creator 用户数据 | `cocos-p1b-creator-user-data/`、`cocos-p1c-creator-user-data/` |
| TapTap Android 历史输出与源码快照 | `cocos-taptap-build/`、`cocos-taptap-build-source/` |
| TapTap 小游戏输出 | `cocos-taptap-minigame-build/` |

当前 TapTap 小游戏候选为 `cocos-taptap-minigame-build/20261102-taptap-minigame-release-05/`。后续构建从项目工具脚本生成到本目录对应的构建根下，运行命令和 `--build-id` 约定见 `docs/13-developer-handoff.md`、`docs/38-taptap-minigame-current.md`。

要调整后续构建位置，修改对应项目脚本中的输出根目录：P1-A/P1-B 在 `tools/build_p1a_web.ps1`、`tools/build_p1b_web.ps1` 的 `$buildRoot`；隔离源码副本在 `tools/prepare_p1a_build_source.ps1`、`tools/prepare_p1b_build_source.ps1` 的 `$targetRoot`；TapTap 小游戏在 `tools/build_taptap_minigame.py` 的 `staged` 与 `output`；Android 输出/源码副本在 `tools/build_taptap_android.ps1` 的 `$output` 与 `$staging`。直接从 Creator 构建时，在“构建发布”任务配置的 `buildPath` 和 `outputName` 指定目录及子目录名。Creator 单独用户数据目录由启动参数 `--user-data-dir=<路径>` 指定；P1-B 脚本提供 `-CreatorUserDataDir`，TapTap 小游戏脚本把它放在该次构建的证据目录下。

共享的 Android SDK/Gradle 工具链仍在 `D:\cocos-taptap-tools`，CocosDashboard 安装仍在 `D:\CocosDashboard`；它们是安装/运行依赖，不是游戏构建产物。
