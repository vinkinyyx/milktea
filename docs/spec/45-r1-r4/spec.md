> 2026-11-06独立验收更新：T1编译/合同已通过；T2预算/错误层、T3宿主视图仍有缺口；T4实现及既有Node回归通过；T5为118/118；T6本地包通过；T7仅正常Web子集通过，Tap/广告/性能未验。本页旧复选框不能作为当前通过结论，现行任务见[docs46](../../46-v3-review-and-host-closeout-design.md)。

# R1–R4 整改实现规格（spec）

基线规范：[docs/45-r1-r4-acceptance-next-design.md](../../45-r1-r4-acceptance-next-design.md)
基线提交：`bd12b731a91bc3a2952af02faf4219ff1e286fc9`
本规格只覆盖下一轮本地可独立验证的实现；设备/Tap 宿主/真实广告证据缺一即 NOT_RUN。

## 0. 不可变约束

- 保持：经典窄杯、定时自动落料、按住杯子移动、同级合成；每局最多一次成功复活；同 run 同分；`isEnded===true` 才发奖；双广告互斥；120 tick 落料缓冲；双槽 CAS 与旧档保护。
- 不改：RunEngine 物理/计分规则、RewardedAdCoordinator、TapRewardedAdProvider、LocalSaveRepository、存档 schema（run5/profile3/envelope2、save appVersion 0.1.0）。
- 不新增每日复活上限；不自动弹广告；不加付费重生/排行榜/云存档。
- 源码改动只在本项目；不删除历史证据与旧候选 ZIP。

## 1. P0-A：Release 裁剪后恢复可编译

### 1.1 新文件 `奶茶挤挤/assets/scripts/core/StartupTrace.ts`

- 复用 `DiagnosticRing`，容量 32，进程内单例由 `AppRuntime` 持有。
- 记录字段：`buildId / traceId / ownerEpoch / phase / result(start|ok|error|cancel) / elapsedMs / foregroundElapsedMs / code? / assetId? / bundleName?`。
- API：
  - `beginTrace(ownerEpoch: number): number`，递增 traceId，返回新 id；
  - `stage(phase, result, detail?)`，内部 try/catch，日志自身异常不得影响开局；
  - `tickForeground(deltaMs)`，由 GameRoot `update()` 累计真实前台毫秒；
  - `page(after, limit)` / `latest(limit=32)` / `overflowCount`；
  - `exportJson()`：最近 32 条、单条错误摘要 ≤512 字符，不写存档正文/账号/Token/广告原始回调。
- 时钟不可用（`performance` 缺失）时用 0，不抛错。

### 1.2 `core/AppRuntime.ts`

- 增加 `static readonly startup = new StartupTrace();`。
- 保留 `buildId` 单点替换（构建脚本只替换这一处）。

### 1.3 `presentation/GameRoot.ts`

- 删除字段 `stages`、`stageStartedAtMs`、方法 `appendStage`。
- 所有阶段调用改为 `AppRuntime.startup.stage(...)`。
- 修正现有错误：
  - `initialize()` 只记录一次 `SAVE_READ`，result 取自真实 `stored.ok/envelope`（失败记 error + code，降级内存记 ok + 标记）；
  - `ART_CATALOG` 记录 `catalog.ids.length` / `catalog.variants` 实际数量，删除 `catalog?0:0` 与重复记录；
  - 阶段 `BOOT_CONFIG` 改为 AppRoot 真实配置读取/校验（GameRoot 不再冒充）。
- `update()` 每帧调用 `AppRuntime.startup.tickForeground(dt*1000)`，仅前台（`!HostLifecycleCoordinator.backgrounded`）。

### 1.4 裁剪脚本

- `tools/strip_p1c_release_debug.cjs` 不改删除范围；因 `GameRoot` 不再有 `stages`，AST 精确命中数保持不变（GameRoot 5 处 Probe 字段/方法另计不变）。
- 验证：隔离副本运行真实脚本 → 隔离 `tsc` 0 错误 → Debug/Mock 禁词门禁。

## 2. P0-B：真实前台累计 15s、取消、迟到保护

### 2.1 新文件 `core/ArtLoadBudget.ts`（纯逻辑，可 Node 测试）

- 字段：`ownerEpoch / traceId / budgetMs / foregroundMs / state('ACTIVE'|'EXPIRED'|'CANCELLED'|'SETTLED')`。
- `advance(ms, foreground)`：仅前台累计；累计 ≥ budgetMs 置 `EXPIRED`。
- `cancel()` / `settle()`；`assertActive()` 抛出带 code 的错误（`START_ART_TIMEOUT` / `START_ART_CANCELLED`）。
- `cancelled(): Promise<never>`：取消/超时时 reject，让等待 Promise 立即结束；调用方必须 `Promise.race` 并吞掉落败分支。

### 2.2 `presentation/ArtAssets.ts`

- 单一加载上下文：
  - `beginLoadScope(ownerEpoch, traceId, budgetMs=15000)`：取消旧 scope、`generation++`、创建 budget、启动唯一 150ms 定时器；
  - 定时器按 `HostLifecycleCoordinator.backgrounded` 决定是否前台累计；到点 `cancelLoadScope('START_ART_TIMEOUT')`；
  - `settleLoadScope()` / `cancelLoadScope(code)` 均清定时器。
- 所有 `resources.load`、`assetManager.loadBundle`、`bundle.load` 都用 `Promise.race([真实加载, budget.cancelled()])`。
- 每个回调与 then 内检查：`disposed`、scope 仍有效、`generation` 未变、未 settled；迟到回调不得写 `loaded`/`bundles`、不得删除新 generation 的 `pending`。
- `acquire()` 在成功建纹理前再次校验 scope；失效则配对释放本次 ImageAsset 引用后抛 `START_ART_CANCELLED`。
- 不 `releaseAll`、不销毁其它 generation 持有的共享资产。
- `dispose()` 清定时器、取消 scope。

### 2.3 `presentation/GameRoot.ts` 接线

- `initialize()`：`beginTrace` → `art.beginLoadScope(ownerEpoch, trace)` → 索引+菜单资源；成功 `settleLoadScope()`，失败 `cancelLoadScope(code)`。
- `startNew()` / `restoreRun()` / `retryArtAndStart()`：每次新 traceId、新 15s scope；返回菜单/销毁/换局时 `cancelLoadScope()`。
- 阶段记录：`START_REQUEST`（点击接收）、`GAME_ART`(start/ok/error，带 assetId/bundle)、`WORLD_CREATE`、`RUN_CREATE`、`INITIAL_SAVE`（revision）、`HUD_READY`（杯+HUD+按钮已建）、`FIRST_TICK`（首个成功固定步，最多一次）。
- 错误编号：`START_ART_TIMEOUT / START_ART_FAILED / START_WORLD_FAILED / START_RUN_FAILED / START_SAVE_FAILED / START_HUD_FAILED`。
- 新增独立 `overlayRoot`（`this.node` 子节点，sibling 最后，不由 `render()` 销毁）：
  - 点击开始后下一可绘制帧显示“正在准备这杯…”，期间 `loading` 防重复；
  - 超时/失败显示：重试准备 / 返回菜单 / 查看诊断；
  - `beginPointer/endPointer` 优先命中 overlay 按钮并拦截底层输入；新 `pointerKind='overlay'`。
- 菜单与错误页增加“查看诊断”：展示 buildId + 最近 32 条阶段；按需 `console.info` 输出可复制 JSON，不新增全局调试对象。
- 世界/引擎/HUD 失败清理本次临时 world/adapter/clock/listener，不递归调用已失败的 `render()`。
- `MENU_READY` 只在菜单已绘制且开始按钮可响应后记录；`FIRST_TICK` 与 `MENU_READY` 分开。

### 2.4 `bootstrap/AppRoot.ts`

- `BOOT_CONFIG` start/ok/error（真实 `resources.load` 与 `ConfigLoader.validate` 结果）。
- 保留现有重试与场景切换；保持裁剪脚本 4 处精确命中（`diagnosticLab` 变量/分支、`__p1aLifecycle`、`director` 导入）。

## 3. P1-A：复活领取身份、revision 重读、幂等

### 3.1 `application/SpillReviveService.ts`

- 新增不可变身份 `attemptIdentity`：`owner / hostGeneration / runId / failureId / attemptId / candidateHash`，在 `watch()` 写 pending 后保存；`bind` 换 run 时不继承旧身份。
- 新增 `stillOwns(ctx)`：同 host、同 hostGeneration、活动 run 同 runId。
- `retrySettlement()` 重写：
  1. 捕获 ctx；进入 SETTLING；`await readBundle()`；
  2. 每个 await 后先 `stillOwns`，失效则不碰任何 host；
  3. 读失败/无信封 → 保持免费重试，不盲写旧 bundle；
  4. 有 receipt：严格核对 `attemptId/runId/failureId/rewardKind/amount/committedReceiptId/run.revive.used===1` 与当前活动 run；任一不符 → ERROR、`retrySettle=false`、不 apply、不同步错误信封；
  5. 校验通过 → `onSpillReviveCommitted(envelope.payload, envelope.revision)` → 再校验 owner → `applyCommittedRevive` 幂等；apply 失败保持 `retrySettle=true`；
  6. 无 receipt：必须 pending 的 attemptId/runId/failureId 全匹配且活动 run 的 `pendingFailure` 同 failure、used0；先同步已核验信封/revision，再 `settle(attemptId)` 合并奖励 CAS；不整体覆盖新档；
  7. CAS 冲突只允许一次受控重读（settle 内已有一次回读），仍失败保持可重试，不循环。
- `settle()`：
  - receipt 分支补齐 failureId/rewardKind/amount 校验；
  - commit 成功后先同步宿主 revision；回读成功后用 `readback.data.envelope.revision` 而非 `committed.data.revision`，应用前再次校验 owner；
  - 已落盘 used1 时，旧 used0 现场不得覆盖（本服务不写回旧 bundle）。
- 取消/加载失败：`clearPending` 成功后才清身份；保持 `pendingFailure` 冻结，phase ERROR、used0、非 SETTLING。

## 4. P1-B：重新观看入口与每日限制收口

- `SpillReviveService.retryWatch()`：仅当 `phase==='ERROR' && !retrySettle && !stalePending && check.allowed` 时，走 `openOffer()` + `watch()`；不自动播放第二轮。
- `GameRoot.renderRevive()` ERROR 分支新增条件：`!view.retrySettle && !view.pendingAttempt && view.block===null` → “重新观看复活”按钮调用 `retryWatch()`；仍保留“结束本局”。
- 移除每日限制残留：
  - `contracts/types.ts`：`SpillRevivePolicy` 删除 `maxDailyRevives`（根合同先合入工程新增复活类型再同步）；
  - `SpillRevivePolicyLoader`：不要求该字段；旧配置带该字段时忽略；
  - `resources/config/spill-revive-policy.json`：删除 `maxDailyRevives`；
  - `ReviveLedger`：删除 `DAILY_LIMIT` 与 `dailyRemaining`，保留 `dayKey/dailyGranted/receipts/grantedForDay` 审计；
  - `GameRoot`：`CLOSED_SPILL_REVIVE_POLICY` 删除字段，`reviveBlockText` 删除 `DAILY_LIMIT`；
  - 额外晃杯策略与 `RewardedShakeView.dailyRemaining` 不动。
- 合同流程：先合并工程复活/兼容类型到 `contracts/types.ts`，再 `python tools/sync_client_contracts.py --sync`，最后 `--check` 逐字节一致。

## 5. P1-C：测试与候选

- `tools/verify_rewarded_shake.cjs`：
  - RV-25 改为：取消 → 无 receipt、pending 清空、`phase PAUSED`、used0、服务 ERROR、非 SETTLING；随后 `retryWatch()` + 第二次 COMPLETED → GRANTED、used1、仅一条 receipt、run/score 不变；
  - 新增 R2b（提交失败→其它检查点推进 revision→重试用最新 revision 成功）与 R2c（读取期间换 host，旧 owner 回调 0 次）；
  - 新增 `ArtLoadBudget` 单元断言（14s 不超时/15s 超时/后台不累计/cancel 使等待结束）。
- 保留原有效断言，不删除失败测试、不改写总数。
- 新 buildId（目录必须不存在）：
  - Debug：`20261105-host-revive-v3-debug-01`
  - Web Release：`20261105-host-revive-v3-web-release-01`
  - Tap Release：`20261105-host-revive-v3-tap-release-01`
- 记录 sourceCommit、未提交差异、三 buildId、ZIP 字节/SHA256、71+7 派生资源、CRC、无 Fake/fixtures/debug globals。

## 6. P1-D 与关闭条件

本地完成：原工程 typecheck、Release 裁剪+tsc、合同 check、RV-25/R2/预算回归、Web 实际开局截图、Tap ZIP 校验。

NOT_RUN（无设备/真实广告/宿主证据）：H02、P01–P04、同 SHA Tap 开局、真实广告、启动中位数/P95、进程内存曲线、真机物理压力。

## 7. 验证命令

```powershell
npm run typecheck --prefix 奶茶挤挤
node tools/verify_rewarded_shake.cjs
python tools/sync_client_contracts.py --check
# 隔离副本 + strip_p1c_release_debug.cjs + 隔离 tsc
python tools/build_cupauto_web.py --help
python tools/build_taptap_minigame.py --build-id 20261105-host-revive-v3-tap-release-01
python tools/verify_optimized_assets.py
```

## 8. 授权与执行

用户已明确要求“全流程自动执行、不再确认”，并指定本文件为执行规范；本规格视为已获执行授权。上传、配置真实广告位、提审、发布仍属外部动作，不在本轮授权内。
