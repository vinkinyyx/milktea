# 当前交付候选

## 2026-11-07 最新独立核验（优先）

94baeac3…31bc89、3,030,312字节候选及313项源身份核对通过；170/0和独立免费恢复探针通过。当前需要处理的是实际平台登录/包体声明与真机接入，见[docs49](../../docs/49-final-delivery-platform-device-plan.md)，不再将已修客户端缺陷列为阻断。广告MCP TOKEN_REVOKED、CLI有效；用户确认1021353与USB调试路线；ADB尚无设备。尚无真实两广告/同SHA Tap开局及400MB峰值关闭证据，仍为诊断候选，未上传或晋升。

## 独立复核更新（本节优先）

**整体BLOCKED，本轮新候选 `94baeac3…31bc89` 仅诊断候选。** 额外晃杯"提交后回读失败→免费重试CAS冲突"已修复并补 SR01–SR07（合计 170 PASS / 0 FAIL）；StartupTrace 独立有界 errorSummary 已补；设计校验已按经典模式/延期P3归因修正（errors=[]）。新 buildId `20261106-adfix2-tap-candidate-01` 顺序构建，71 art + 7 effect、CRC/派生哈希、无 source map/无 Debug API 全部通过；源码 manifest 与原工程一致。两个真实广告位仍 disabled/null、Tap宿主/启动/内存仍NOT_RUN。最新整改/最终包门禁见[docs48](../../docs/48-adfix-review-and-device-closeout-design.md)。本轮未上传、未改后台、未提审发布。

## 2026-11-06 adfix2 轮：诊断候选已产出，整体 BLOCKED，未晋升最终包

源码基线 `f1c49c0` + 本轮未提交整改（额外晃杯回读失败免费恢复、StartupTrace errorSummary、validate_design 经典/P3 范围修正，以及前轮广告服务交接/清理归属、SDK 生命周期、Release 裁剪）。本地门禁全部通过，已用新唯一 buildId 顺序构建 Tap 候选；真实广告位仍为空，Tap 宿主与内存未实测，因此**该候选只用于诊断，不是最终包**。

| 类型 | buildId | 产物 | 字节 | SHA256 / 校验 |
|---|---|---|---|---|
| Web Release | `20261106-adfix-web-release-01` | [build](../../build-artifacts/cocos-p1b-build/20261106-adfix-web-release-01) | 5,063,191 | `WEB_CANDIDATE_BUILD_PASS`，`sourceMapCount=0` |
| Tap 候选（诊断对照） | `20261106-adfix-tap-candidate-01` | [game.zip](../../build-artifacts/cocos-taptap-minigame-build/20261106-adfix-tap-candidate-01/TapBuild/game.zip) | 3,030,025（解压 5,180,242） | `84a1db3fe6bdbc6d8ff8907ee013477196002f15591a7f7715e174e4044f9b85` |
| **Tap 候选（本轮）** | `20261106-adfix2-tap-candidate-01` | [game.zip](../../build-artifacts/cocos-taptap-minigame-build/20261106-adfix2-tap-candidate-01/TapBuild/game.zip) | 3,030,312（解压 5,182,543） | `94baeac3409b4109d397f922db095e6b0df6d6e639a1b826f38fdd5ee231bc89` |

- 本地结果：typecheck 0 错误；合同/设计配置镜像通过；`verify:art` 通过（71图）；`validate_design.py` `errors=[]`（P3 列入 deferred_stage_fit）；`node tools/verify_rewarded_shake.cjs` **170 checks / 0 failed**（原152 + SR01–SR07 共18）。
- Tap 包校验（本轮 `94baeac3…`）：71 art + 7 effect、78 派生资源命中、ZIP CRC 通过、派生哈希一致、无 source map、无 `__P1B_*`/Fake/Mock 调试 API；RGBA 60,251,896 → 24,119,392；`status=LOCAL_CONVERSION_PASS_NOT_HOST_VALIDATED`、`runtimeVerified=false`、`originalSourceChanges=[]`。
- Web 实操（前轮）：菜单→教程三步→开局→落料→拖杯→暂停/继续→两次晃杯→耗尽→杯满结算→刷新续局→损坏存档回退，截图在 `evidence/Acceptance/20261106-adfix-web-release-01/`。
- 仍 BLOCKED / NOT_RUN：两个真实激励广告点（无 `adUnitId`，策略 `enabled=false`，未造 ID、未用 Mock 冒充）；Tap 宿主同 SHA 开局、真实广告、启动与内存曲线。
- 本轮未上传、未修改线上配置、未提审、未发布。不得把本候选当作真实广告或性能已验收的最终版。

---

## 2026-11-06 独立验收：修复前状态（历史）

源码 `f1c49c0`；原工程编译/镜像/71图/预算探针通过，原回归125通过1失败；新Web Release `20261106-ae-ad-review-web-release-01` 裁剪expected46/found48失败，未产生可用成品。异步归属、复活假成功及SDK清理缺陷见[docs47](../../docs/47-ad-acceptance-and-final-package-design.md)。两个真实广告位仍关闭/为空，平台开局与启动/内存未验；**整体BLOCKED，无新Tap ZIP/SHA，不可将下方V3当本轮完成版。**

当前本机具备Node/Python/Creator，下方“无工具”是另一执行机的历史状态。本轮未上传、未提审、未发布。

---

## 2026-11-06 第二整改轮：无新包

源码身份 `cc70736` + 本轮工作区改动（A–E 与广告门槛）。执行机无 D 盘、无 Node/Python/Cocos Creator，**未执行 typecheck、118项、构建与真机验证**，因此**没有新 buildId、没有新 game.zip、没有新 SHA**。下表仍是上一轮包，**不能代表本轮改动**。

本轮完成的是代码整改，不是包体验证。新增回归 `RV-32a/b/c`、`RV-31a/b`、`RS-30a/b`（118→125）与预算探针 A02/B01 也**未执行**。详见 [docs22](../../docs/22-current-progress-and-resume.md)。

---

2026-11-06：上一轮整改候选，基于 `bd12b731a91bc3a2952af02faf4219ff1e286fc9` + 未提交整改（工作区脏）。状态：**BLOCKED。本地构建、118项和正常Web链路通过，但额外异常复核失败；Tap宿主/真实广告/平台性能仍NOT_RUN。不能作为正式完成版。**

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
