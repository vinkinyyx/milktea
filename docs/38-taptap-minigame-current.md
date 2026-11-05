# TapTap小游戏当前入口

2026-11-06，当前整体BLOCKED。V3构建、合同、118项回归与正常Web链路通过，但额外预算/错误层/设置/宿主交接场景失败，详见[docs46](46-v3-review-and-host-closeout-design.md)。真实Tap、真实广告、手机晃杯和平台启动/内存仍未验，不是可选项。

平台路线：Creator3.8.8 + 工程内Tap扩展1.2.2，经中间构建转换Tap小游戏，非H5托管/APK。配置在config/taptap-minigame.json。

V3复测基线：[game.zip](../build-artifacts/cocos-taptap-minigame-build/20261105-host-revive-v3-tap-release-01/TapBuild/game.zip)，3,026,101 bytes，SHA256 `b2c3519df4371255346590a583c0413260c003d3b56b6a8842e36f18640a57e7`。本次复核71+7资源、CRC/派生哈希通过；构建原清单313项与当前原工程一致。源码是bd12b73加未提交整改，不单凭旧commit标识。

- [候选清单](../output/taptap-upload/CURRENT-CANDIDATE.md)
- [原始转换结果](../evidence/TapTap/20261105-host-revive-v3-tap-release-01/result.json)
- [本次验收与新包/设备计划](46-v3-review-and-host-closeout-design.md)
- [检查与构建工具](../tools/README.md)

广告策略未配置真实位时关闭。关闭/开启广告包是不同buildId/SHA，开启包必须补对应启动/存档/性能验证。下一轮代码修复后用新唯一ID，保留V3作失败边界复现。上传/广告配置/提审/发布按具体授权，本次未执行。

更早f7687045包和历史资料仅供溯源，见[归档入口](archive-location.md)，不作为本轮源码验收产物。
