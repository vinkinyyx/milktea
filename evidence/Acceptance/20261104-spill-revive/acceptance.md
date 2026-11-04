# 洒出复活本轮验收记录（2026-11-05 凌晨完成）

## 范围

每局一次洒出广告复活的本地实现与验证；保留前轮恢复与资源优化。正式广告策略仍关闭，未上传、提审或发布。

## 自动化

- `node tools/verify_rewarded_shake.cjs`：111/111 通过（80 项旧回归 + RV-01..RV-30 复活新增）。
- typecheck 0；Release 无 sourcemap、debug API 字符串不存在。

## 浏览器端到端（Debug 构建 20261104-spill-revive-debug-03，本地 http://127.0.0.1:8124，Playwright 3.8.8 环境模拟点击）

1. fixture `revive-candidate` 启动 → 跳过教程 → 洒出冻结，弹窗“小料洒出来了”（截图 revive-modal-*.png），状态“本局可复活一次；完整观看后才发放”。
2. 点击“观看广告复活”（rewardedMock=ok）→ pendingAttempt 先落盘 → 模拟完整观看 → 结算提交 receipt + 清理后 run 原子落盘 → 回读校验 → 引擎应用复活，弹窗显示“复活成功：分数已保留，点击继续。”（截图 revive-granted-*.png）。快照：`revive.used=1`、`committedReceiptId=9a144810-c0c2-41bd-be4f-d5a4dbda2916`。
3. 点击“继续游戏”→ 安全暂停页 → 再点“继续游戏”→ `state=PLAYING`、`tick` 继续推进、`boardType=assisted`、自动落料恢复（截图 revive-resumed-playing-*.png）。

注：harness 首轮状态行显示“等待复活弹窗超时”是自动化等待窗口先于人工点击结束的计时假象，非产品缺陷；同页第二轮在窗口内完成，上述快照与截图为准。

## 本轮修复的缺陷（浏览器端到端发现）

- fixture/debug 命名空间下复活服务误写主仓库导致 `CONFLICT_REVISION`（“无法写入待确认的复活记录”）。GameRoot 新增 `adSaveRepository()` 代理，两个广告服务均改为运行时路由到 `activeSaveRepository()`；修复后同流程通过。

## 包身份

- Tap 本地转换候选：`build-artifacts/cocos-taptap-minigame-build/20261104-spill-revive-tap-02/TapBuild/game.zip`，3,021,177 bytes，SHA256 `f768704568d3c43a7122f2a205a79f253650026c3a6a13d4512a0e7ddcd93a3e`，398 条目，解压 5,134,152 bytes，状态 LOCAL_CONVERSION_PASS_NOT_HOST_VALIDATED，runtimeVerified=false。
- Web Release：`build-artifacts/cocos-p1b-build/20261104-spill-revive-web-release-02/`。
- Web Debug（含复活 harness，仅本地测试）：`build-artifacts/cocos-p1b-build/20261104-spill-revive-debug-03/`。
- `verify_optimized_assets` PASS：71 art + 7 effect 映射、包内 78 项、RGBA 60,251,896→24,119,392。
- `verify_runtime_art --package` 对 ZIP 报 15 图哈希不符：即纹理优化派生图（杯层/背景/4 小料等），由 verify_optimized_assets 覆盖；非缺图。
- 包内 `spill-revive-policy` 实测 `enabled=false`、`adUnitId=null`、clearanceDu=40、autoDropDelayTicks=120。

## 未验证项（如实保留）

- 真实广告位/真实 Tap 宿主激励视频回调：未测（无 adUnitId，策略关闭）。
- Tap 宿主启动、真机运行、平台上传包复测：未做；旧包平台启动/约 400MB 峰值与手机晃杯最初根因未关闭。
- 实体设备触摸、性能峰值：未测。
