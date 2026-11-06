# TapTap小游戏当前入口

2026-11-07入口更新：[docs49](49-final-delivery-platform-device-plan.md)记录170/0与94baeac3包独立通过、真实平台TOKEN_REVOKED、包体声明warning及USB接入步骤。目标1021353已由用户确认。真实位应按官方MCP查，不再向用户索要手工ID。整体待平台/真机收尾，下方历史入口不覆盖本节。

最新整改以[docs48](48-adfix-review-and-device-closeout-design.md)为准：额外晃杯"提交后回读失败→免费重试CAS冲突"已修复并补 SR01–SR07（合计 170/0）；StartupTrace 独立有界 errorSummary 已补；设计校验按经典模式/延期P3修正（errors=[]）。本轮新候选 `20261106-adfix2-tap-candidate-01`（3,030,312 bytes，SHA `94baeac3409b4109d397f922db095e6b0df6d6e639a1b826f38fdd5ee231bc89`）71 art + 7 effect、CRC/派生哈希、无 source map/无 Debug API 全 PASS，`runtimeVerified=false`。真实两个广告位仍 disabled/null，Tap 同 SHA 开局/真实广告/启动内存 NOT_RUN，整体 BLOCKED，候选仅诊断未晋升最终包。未上传、未提审发布。

2026-11-06 adfix 轮（历史）：基于 `f1c49c0` + 未提交整改，本地门禁通过（typecheck 0、镜像/71图通过、广告/奖励回归 152/0），Web Release 与 Tap 诊断候选已用新 buildId 顺序产出；裁剪 48 节点、宿主归属、权益假成功和 SDK 释放已修复。Tap 候选 `20261106-adfix-tap-candidate-01` 为 3,030,025 bytes、SHA256 `84a1db3fe6bdbc6d8ff8907ee013477196002f15591a7f7715e174e4044f9b85`，71 art + 7 effect、CRC/派生哈希/Release 清洁度通过，但 `runtimeVerified=false`。两个广告位仍 disabled/null，Tap 宿主开局、真实广告与启动/内存 NOT_RUN，整体仍 BLOCKED，候选未晋升最终包。详见[docs47](47-ad-acceptance-and-final-package-design.md)和[当前事实](22-current-progress-and-resume.md)。下方 V3 与修复前信息仅供历史复现。

2026-11-06，当前整体BLOCKED。V3构建、合同、118项回归与正常Web链路通过，但额外预算/错误层/设置/宿主交接场景失败，详见[docs46](46-v3-review-and-host-closeout-design.md)。真实Tap、真实广告、手机晃杯和平台启动/内存仍未验，不是可选项。

平台路线：Creator3.8.8 + 工程内Tap扩展1.2.2，经中间构建转换Tap小游戏，非H5托管/APK。配置在config/taptap-minigame.json。

V3复测基线：[game.zip](../build-artifacts/cocos-taptap-minigame-build/20261105-host-revive-v3-tap-release-01/TapBuild/game.zip)，3,026,101 bytes，SHA256 `b2c3519df4371255346590a583c0413260c003d3b56b6a8842e36f18640a57e7`。本次复核71+7资源、CRC/派生哈希通过；构建原清单313项与当前原工程一致。源码是bd12b73加未提交整改，不单凭旧commit标识。

- [候选清单](../output/taptap-upload/CURRENT-CANDIDATE.md)
- [原始转换结果](../evidence/TapTap/20261105-host-revive-v3-tap-release-01/result.json)
- [本次验收与新包/设备计划](46-v3-review-and-host-closeout-design.md)
- [检查与构建工具](../tools/README.md)

广告策略未配置真实位时关闭。关闭/开启广告包是不同buildId/SHA，开启包必须补对应启动/存档/性能验证。下一轮代码修复后用新唯一ID，保留V3作失败边界复现。上传/广告配置/提审/发布按具体授权，本次未执行。

更早f7687045包和历史资料仅供溯源，见[归档入口](archive-location.md)，不作为本轮源码验收产物。
