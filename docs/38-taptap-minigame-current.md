# TapTap小游戏当前入口

当前形态：Creator3.8.8 + 工程内taptap-minigame-tools1.2.2，经中间构建转换Tap小游戏。配置在config/taptap-minigame.json；当前不是H5托管或APK。

**BLOCKED**：用户反馈Tap自测开局只有背景；复活逻辑有新增验收缺陷；真实广告、晃杯异常根因、启动和内存平台复测均未关闭。详见[docs44](44-tap-host-start-review.md)。

唯一保留Tap候选：[game.zip](../build-artifacts/cocos-taptap-minigame-build/20261104-spill-revive-tap-02/TapBuild/game.zip)，buildId `20261104-spill-revive-tap-02`，3,021,177 bytes，SHA256 `f768704568d3c43a7122f2a205a79f253650026c3a6a13d4512a0e7ddcd93a3e`。本地转换通过、runtimeVerified=false，复活策略enabled=false/adUnitId=null。用户已上传的文件身份仍待核对。

- [候选清单](../output/taptap-upload/CURRENT-CANDIDATE.md)
- [构建原始结果](../evidence/TapTap/20261104-spill-revive-tap-02/result.json)
- [优化资产复核](../evidence/TapTap/20261104-spill-revive-tap-02/optimized-asset-verification.json)
- [检查与构建命令](../tools/README.md)
- [历史包和资料归档](archive-location.md)

清理保留最新ZIP及验证所需派生快照，删除解压副本、旧转换输出和构建缓存。未重新打包、上传、提审或发布。后续构建须用新buildId；缺少真实广告配置和实测证据时保持关闭策略。
