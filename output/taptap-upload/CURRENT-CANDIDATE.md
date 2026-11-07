# 当前交付候选

## 2026-11-07 强颠杯与杯口保护候选（当前构建，未上传）

| buildId | 产物 | 版本 | 字节 | SHA256 |
|---|---|---|---|---|
| `20261107-guard02-tap-candidate-01` | [game.zip](../../build-artifacts/cocos-taptap-minigame-build/20261107-guard02-tap-candidate-01/TapBuild/game.zip) | 1.7.3 | 3,040,925 | `b7a8d0acf69b172ead446602ea8e8b47be8fb939c972d4e9d44d8bb7c3b2147f` |

- 本轮按 docs53 完成 CUP-01 至 CUP-03（低处猛颠、高处横拨、随真实杯体移动的杯口物理保护）和 REC-01/02（首存失败可重试、渲染/续局失败保留活动局）。定稿参数与实测表见 [docs53 第 12 节](../../docs/53-strong-cup-bump-and-release-closeout.md#12-本轮实施与验收状态2026-11-07)。
- 本地验收：真实 Edge + Playwright **45/45 PASS**；`verify_rewarded_shake.cjs` **200 PASS / 0 FAIL**（普通与无 `TextEncoder` 环境一致）；config/contract 镜像、typecheck、`verify:host-utf8`（110 样本/660 比较/6 模式）、`verify:art`（71 图，errors=[]）全部通过。
- 包身份：解压 5,217,185 字节、394 文件、77 PNG；`assets/main/index.js` 仅含本 buildId 一次，无旧 `20261107-bump01…`、`__P1B_FIXTURES__`、`INJECTED_RENDER_FAULT`、`debugRenderFaults`、source map 或 PhysicsLab；315 项源清单，`originalSourceChanges=[]`。
- `runtimeVerified=false`，`status=LOCAL_CONVERSION_PASS_NOT_HOST_VALIDATED`。**未上传、未真机、未提审、未发布**，不能把本地转换通过当作 Tap 宿主或广告验收。
- 证据目录：`evidence/TapTap/20261107-guard02-tap-candidate-01/`、`evidence/CupAuto/20261107-guard04-web-debug-01/web/runtime/`。
- 外部阻断：广告未开通（`status=0`，无 `space_id`）→ ADS-01 BLOCKED；草稿主包仍指向失效 `433619`，`region_flag_ios` 缺失，资质查询被阻塞；ADB 无设备 → HOST-01/PERF-01 NOT_RUN。上传、绑定、资料/资质写入与提审均待用户具体授权。

## 2026-11-07 一键颠杯候选（历史构建，未上传）

| buildId | 产物 | 版本 | 字节 | SHA256 |
|---|---|---|---|---|
| `20261107-bump01-tap-candidate-01` | [game.zip](../../build-artifacts/cocos-taptap-minigame-build/20261107-bump01-tap-candidate-01/TapBuild/game.zip) | 1.7.2 | 3,036,668 | `fd7239e226f9e5a1acd07cdb7c55fe6c84faa52fe996f266b65eddc8870e8b11` |

- 本轮实施 BUMP-01 至 BUMP-06：一次真实物理速度脉冲（垂直 320 DU/s、水平向心 70 + 散布 20、向上钳制 420）、动作 39 tick + 冷却 21 tick、launch delay 6 tick、基础 2 次/奖励 5 次、空杯不扣次数、杯身 6/12 DU 表现位移、HUD 单一状态源与颠杯文案。
- 本地门禁：config/contract 镜像、typecheck、`verify:host-utf8`、`verify:art` 通过；回归 **193 PASS / 0 FAIL**，普通与无 `TextEncoder` 环境一致。真实浏览器证据见 `evidence/CupAuto/20261107-bump02-web-debug-01/web/runtime/`：不同质量实体 delta 均为 3.2 m/s、静置后上移 48.5/47.6 DU、暂停冻结、刷新同 runId/tick/baseUsed、次数耗尽无脉冲。
- 包身份：398 文件（77 PNG）、解压 5,192,757 字节、CRC 通过；staging UTF-8 门禁 PASS（110 样本/660 比较/6 种宿主模式）；`assets/main/index.js` 仅含本 buildId 一次，无旧 buildId、Debug API 字符串或 source map；315 项源清单，`originalSourceChanges=[]`。
- `runtimeVerified=false`，`status=LOCAL_CONVERSION_PASS_NOT_HOST_VALIDATED`。**未上传、未真机、未提审、未发布**，不能把本地转换通过当作宿主或广告验收。
- 证据目录：`evidence/TapTap/20261107-bump01-tap-candidate-01/`（result.json、package-identity.json、staged-source-manifest.json、host-utf8-gate.log）。
- 外部阻断：广告未开通（无 space_id）；草稿主包仍指向失效的 433619；`region_flag_ios` 缺失；资质查询被草稿引用阻塞；ADB 无设备。上传、绑定、资料/资质写入与提审均待用户具体授权。

## 2026-11-07 用户上传后的自测核查

TapTap 开发包 `444838` 已就绪，平台显示版本 `1.7.0`、大小 `3,035,417` 字节，与本地 host6 ZIP 大小一致。平台列表未返回 SHA256。用户报障截图顶部显示 `20261107-host3-bootguard-candidate-02`，本地 host6 ZIP 的 `assets/main/index.js` 则含 `20261107-host6-gate-candidate-01`。用户已确认通过 [444838 专属自测入口](../../build-artifacts/taptap-selftest-444838.png) 可以自测。完整真机验收仍待补齐，原始构建记录中的 `runtimeVerified=false` 保留。

## 2026-11-07 1.7.1 host6（当前构建；host5仍是未宿验证的同源包）

| buildId | 产物 | 字节 | SHA256 |
|---|---|---|---|
| `20261107-host6-gate-candidate-01` | [game.zip](../../build-artifacts/cocos-taptap-minigame-build/20261107-host6-gate-candidate-01/TapBuild/game.zip) | 3,035,417 | `ba395b0c13f11735217b7d99a3c01f83f6090155a87f44f861c2219c4661b287` |

- 本轮只改构建/测试工具与 `奶茶挤挤/package.json` 命令，运行时代码与host5同源；host6的价值是带强制门禁、可追溯的新构建，不宣称宿主已验证。`runtimeVerified=false`，`status=LOCAL_CONVERSION_PASS_NOT_HOST_VALIDATED`。
- DEV-01：`npm run verify:host-utf8 --prefix 奶茶挤挤` 通过；`build_taptap_minigame.py` 在Creator之前用**隔离staging源码**执行门禁（660比较/6种TextEncoder形态），失败即停止。失败注入构建`20261107-dev01-gate-injection-01`确实在Creator前退出，未生成`creator.log`/ZIP，证据在`evidence/Acceptance/20261107-dev01-gate-injection-01/`。
- DEV-02：`node tools/verify_rewarded_shake.cjs` 现为 **185 PASS / 0 FAIL**（原170项保留 + TextEncoder缺失/不可构造/构造抛错三种模式下真实`LocalSaveRepository`新存档commit、readback、续局runId/checksum，共15项）；无全局TextEncoder整轮回归同为185/0。
- DEV-03：`result.json`记录`hostUtf8Gate`（PASS、staging源路径、源SHA256 `c3e14dbc…2b72`、6模式、660比较）、`sourceManifestCount=315`、`sourceManifestSha256=d41d426f…7545`、`packageBytes/packageSha256`、`runtimeVerified=false`；本表与ZIP实际字节/SHA一致。Creator退出36，ZIP CRC通过，398文件/77PNG，构建脚本对全部JS扫描确认无`FakeRewardedAdProvider`/`debug-mock`/`rewardedMock`/`__P1B_FIXTURES__`/`makeFixtureSnapshot`/`__P1B_DIAGNOSTICS__`，且无source map（引擎`cc.js`中的普通英文词fixture不属于项目调试入口）。
- 其他本地门禁：typecheck 0错误；`verify:art` 71 art + 7 effect 通过；合同镜像逐字节一致；`validate_design.py`仍因历史`client/README.md`路径不存在而未跑完（既有问题，与本次改动无关，未修改脚本）。
- 平台只读事实（2026-11-07）：包体列表有1.0.0–1.6.0开发包，资料页`main`槽绑定的仍是1.2.0（package 433619）；`get-available-package-types`返回`available=[]`、`declared=["spark"]`，与已存在的小游戏包不一致，需平台侧确认，未改声明/绑定。广告MCP当前为**未开通**（status=0），无真实广告位；CLI登录有效。
- 未上传、未提审、未发布、未替换线上包。host5（1.7.0，3,035,170字节，`b0a3217d…b840`）仍保留作对照；两者都必须用同SHA Tap宿主验证，旧host3截图不能判定本轮失败。

## 2026-11-07 1.7.0 host5（历史候选，未宿验证）

| buildId | 产物 | 字节 | SHA256 |
|---|---|---|---|
| `20261107-host5-utf8-candidate-01` | [game.zip](../../build-artifacts/cocos-taptap-minigame-build/20261107-host5-utf8-candidate-01/TapBuild/game.zip) | 3,035,170 | `b0a3217d9b4e1442a6228390c3b732eae90bc559b400cd902710fa527077b840` |

- 用户截图是host3/1.5.0，明确错误为新局存档哈希的`TextEncoder is not a constructor`。host4/1.6.0的typeof检查仍无法处理“函数但不可构造”；本轮已在VM复现。
- host5统一手写UTF-8，不依赖宿主TextEncoder；660组比较通过，普通/缺失TextEncoder环境完整回归各170/0，typecheck通过。
- Creator返回36，构建成功；71art+7effect、78资源、CRC/派生哈希通过。315项源清单一致，`originalSourceChanges=[]`。无source map/fixture全局/FakeRewardedAdProvider。
- 版本1.7.0，解压5,187,680字节、396文件、77PNG，比host4小30字节。源稿、存档schema、SHA算法、广告策略未改。
- **只代表本地修复与候选打包通过**：`runtimeVerified=false`，本轮未上传；正常开局与错误UI、真实广告、启动/内存仍需同SHA Tap验证。手机顶部须显示host5才是本次包，host3截图不能用于判定本包失败。
- 详细根因和验证见[docs50](../../docs/50-host-boot-injection-fix/spec.md)，原始构建/校验结果见`evidence/TapTap/20261107-host5-utf8-candidate-01/`。

## 2026-11-07 1.6.0 候选（宿主 TextEncoder 修复，优先）

| 类型 | buildId | 产物 | 字节 | SHA256 |
|---|---|---|---|---|
| Tap 候选 | `20261107-host4-textencoder-candidate-01` | [game.zip](../../build-artifacts/cocos-taptap-minigame-build/20261107-host4-textencoder-candidate-01/TapBuild/game.zip) | 3,035,200 | `a125f699f34b48f7640073139f54099170688051b7a5786a7332d184ebf310cc` |

- 触发证据：1.5.0 在 Tap 宿主内诊断条显示 `render-error | 新局存档失败：档案规范化失败：TypeError: TextEncoder is not a constructor`。
- 修复：`assets/scripts/core/Sha256.ts` 的 `sha256Utf8()` 增加手写 UTF-8 回退（优先 `TextEncoder`），已与浏览器实现逐字节比对一致。
- 本地断言：`typecheck=0`、`creatorExitCode=36`、注入块无致命 `fetch` 抛错、platform 判断为安全版、包内含 `BootDiagnostics` 与 UTF-8 回退；`runtimeVerified=false`，状态 `LOCAL_CONVERSION_PASS_NOT_HOST_VALIDATED`。
- 下一步：上传该 `game.zip`（版本 1.6.0）→ 取新 `package_id` 与自测码 → 宿主实测回传截图。仍未上传、未提审、未发布。

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
