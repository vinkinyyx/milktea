# 当前交付候选

2026-11-06：本轮整改候选，基于 `bd12b731a91bc3a2952af02faf4219ff1e286fc9` + 未提交整改（工作区脏）。状态：**BLOCKED。本地构建、118项和正常Web链路通过，但额外异常复核失败；Tap宿主/真实广告/平台性能仍NOT_RUN。不能作为正式完成版。**

最新结论与下一轮设计见[docs46](../../docs/46-v3-review-and-host-closeout-design.md)。本轮复核未改变下列包体；广告开关改变将产生新buildId/SHA，需重新验证。

## 本轮 buildId

| 类型 | buildId | 产物 | 字节 | SHA256 |
|---|---|---|---|---|
| Web Debug | `20261105-host-revive-v3-debug-01` | [build](../../build-artifacts/cocos-p1b-build/20261105-host-revive-v3-debug-01) | 23,354,052 | index.html `3ba9d9a28f72987fac665296378dd66293926cbba4c474aebc70fe9b0f6d21c5` |
| Web Release | `20261105-host-revive-v3-web-release-01` | [build](../../build-artifacts/cocos-p1b-build/20261105-host-revive-v3-web-release-01) | 5,051,376 | settings `ab537d01153f32aa3356517987c4777848479eb4fe1a02615023be11d1161cc3` |
| Tap Release | `20261105-host-revive-v3-tap-release-01` | [game.zip](../../build-artifacts/cocos-taptap-minigame-build/20261105-host-revive-v3-tap-release-01/TapBuild/game.zip) | 3,026,101 | `b2c3519df4371255346590a583c0413260c003d3b56b6a8842e36f18640a57e7` |

## 构建输入与既有门禁（不代表额外异常场景全部通过）

- 原工程 `tsc` 0 错误；Release 裁剪隔离副本 `tsc` 0 错误，裁剪精确命中数未变（GameRoot 5+46，AppRoot 4）。
- 合同 `tools/sync_client_contracts.py --check` 逐字节一致。
- `tools/verify_rewarded_shake.cjs`：118 checks passed, 0 failed（含 RV-25 取消不发奖+再次观看发奖、R2c 换宿主零回调、AB-01..04 预算断言）。
- Tap 包资源：71 art + 7 effect mappings，78 package assets，0 errors，无 Fake/LabProbe/PhysicsLab/ArtGallery 调试代码，无 source map。

## 本轮 NOT_RUN（缺设备/平台证据，不宣称通过）

- H02 Tap 宿主真实开局截图与日志；
- 真实激励广告（成功/取消/失败）链路在 Tap 宿主内的证据；
- 真机启动中位数/P95、进程内存曲线、物理压力复测；
- 同 SHA 的 Tap 包上传与平台回包。

## 说明

保留前轮基线 [20261104-spill-revive-tap-02/game.zip](../../build-artifacts/cocos-taptap-minigame-build/20261104-spill-revive-tap-02/TapBuild/game.zip)（SHA `f768704568d3c43a7122f2a205a79f253650026c3a6a13d4512a0e7ddcd93a3e`）仅作对照，不代表本轮通过。未实施上传、提审或发布。
