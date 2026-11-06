# 工具入口

当前工作以[最终交付方案与提示词](../docs/49-final-delivery-platform-device-plan.md)为准。170/0及独立回读失败恢复探针已通过，94baeac3候选资源/源清单核对通过；下一步是实际MCP认证、包体能力核对和USB真机。ADB路径与命令见docs49，不再重复修已关闭的CAS问题或索要手工广告ID。

在项目根执行现有检查：

```powershell
python -X utf8 tools/sync_design_config.py --check
python -X utf8 tools/sync_client_contracts.py --check
npm run typecheck --prefix 奶茶挤挤
npm run verify:art --prefix 奶茶挤挤
node tools/verify_rewarded_shake.cjs
```

`verify_rewarded_shake`会重建build-artifacts/rewarded-tests；该目录是缓存。现有118项只覆盖已写场景，额外复活故障复现位于evidence/Acceptance/20261105-tap-host-review/probe-revive-boundaries.cjs。

构建每次使用新唯一ID，不能照抄现有候选ID：

```powershell
python -X utf8 tools/build_cupauto_web.py --build-id NEW_UNIQUE_WEB_ID --mode release
python -X utf8 tools/build_taptap_minigame.py --build-id NEW_UNIQUE_TAP_ID --version 0.1.3
```

版本示例不表示后台已接受。两种构建使用隔离副本，调用prepare_p1c_release_assets；Tap还使用strip_p1c_release_debug与工程内扩展，不修改原始工程和原稿。

原稿使用verify_runtime_art严格检查。优化包使用以下派生核验，不把原稿哈希直接套给缩放后的PNG：

```powershell
python -X utf8 tools/verify_optimized_assets.py --build-id 20261104-spill-revive-tap-02 --evidence-dir evidence/TapTap/20261104-spill-revive-tap-02 --package build-artifacts/cocos-taptap-minigame-build/20261104-spill-revive-tap-02/TapBuild/game.zip
```

optimize_runtime_assets只处理隔离镜像；当前保留一个最小Tap派生快照用于复核。prepare_v2_art是素材重导出工具，prepare/install均应按需使用；清理后历史output/v2-art-runtime移至归档，不要把旧安装清单覆盖当前素材。

一次性清理脚本、计划、执行日志与复核位于[清理记录](../evidence/maintenance/20261105-project-cleanup/)。历史文档与包体位置见[归档入口](../docs/archive-location.md)。
