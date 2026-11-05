# R1–R4 整改任务清单（tasks）

对应规格：[spec.md](./spec.md)。按顺序执行；每项完成后立即验证并更新状态。

## T1（P0-A）阶段日志迁移，修复 Release TS2304

- [ ] 新建 `奶茶挤挤/assets/scripts/core/StartupTrace.ts`（DiagnosticRing(32)，字段/API 见 spec §1.1）。
- [ ] `core/AppRuntime.ts` 暴露 `static readonly startup`。
- [ ] `presentation/GameRoot.ts` 删除 `stages/stageStartedAtMs/appendStage`，全部改调 `AppRuntime.startup.stage`；修正 SAVE_READ 重复、ART_CATALOG 计数、BOOT_CONFIG 归属。
- [ ] 验证：`npm run typecheck --prefix 奶茶挤挤`。
- [ ] 验证：隔离副本运行 `tools/strip_p1c_release_debug.cjs`，隔离 `tsc` 0 错误；确认 AST 精确命中数未变。

## T2（P0-B）ArtLoadBudget 与 ArtAssets 真实取消

- [ ] 新建 `core/ArtLoadBudget.ts`（advance/cancel/settle/assertActive/cancelled）。
- [ ] 改 `presentation/ArtAssets.ts`：`beginLoadScope/settleLoadScope/cancelLoadScope`、150ms 单定时器、后台不累计、Promise.race、迟到回调保护、pending 条件清理、dispose 清理。
- [ ] `presentation/GameRoot.ts`：`initialize/startNew/restoreRun/retryArtAndStart` 接入 scope 与新 traceId；离开/销毁取消。
- [ ] 修正启动错误出口：独立 `overlayRoot`、开始防重复、“正在准备这杯…”、超时页三按钮、查看诊断。
- [ ] `bootstrap/AppRoot.ts`：BOOT_CONFIG start/ok/error；保持裁剪 4 命中。
- [ ] 验证：typecheck + Node 预算断言（T5 后统一跑）。

## T3（P1-A）复活领取身份/revision/幂等

- [ ] `application/SpillReviveService.ts`：attemptIdentity、stillOwns、retrySettlement 重写、settle 身份/回读 revision 修正、错误分支 retrySettle 语义。
- [ ] 验证：RV-25 与新增 R2b/R2c 断言通过。

## T4（P1-B）重新观看与每日限制收口

- [ ] `SpillReviveService.retryWatch()`；`GameRoot.renderRevive` 增加“重新观看复活”。
- [ ] `contracts/types.ts` 删除 `maxDailyRevives`；`SpillRevivePolicyLoader` 忽略旧字段；config JSON 删除字段。
- [ ] `ReviveLedger` 删除 `DAILY_LIMIT/dailyRemaining`；`GameRoot` 清理 CLOSED policy 与文案。
- [ ] 合并根/工程合同：`python tools/sync_client_contracts.py --sync` 再 `--check`。
- [ ] 验证：typecheck + 合同逐字节一致。

## T5（P1-C）回归更新

- [ ] `tools/verify_rewarded_shake.cjs` 更新 RV-25（取消不奖、PAUSED、used0、非 SETTLING；再次观看 GRANTED）。
- [ ] 新增 R2b（重读新 revision 后成功）与 R2c（换 host 旧回调 0 次）。
- [ ] 新增 ArtLoadBudget 断言（14s/15s/后台/取消）。
- [ ] 运行全部 Node 测试，记录 PASS/FAIL（不得改写总数掩盖失败）。

## T6（P1-C）新候选构建

- [ ] 确认三个新 buildId 目录不存在。
- [ ] 构建 Debug、Web Release、Tap Release；执行 `verify_optimized_assets.py`。
- [ ] 校验 71+7、CRC、ZIP 字节/SHA256、无 Fake/fixtures/debug globals。
- [ ] 更新 `output/taptap-upload/CURRENT-CANDIDATE.md` 与发布清单（同 commit/差异/三 buildId/哈希）。

## T7（P1-D）证据与边界

- [ ] Web 当前源码实际开局并留存截图/日志（浏览器可执行时）。
- [ ] Tap 宿主/真实广告/真机启动与内存：无设备证据的项标 NOT_RUN，不改写为 PASS。
- [ ] 按实际结果更新 RV-25、候选清单与 NOT_RUN 表；保持总体 BLOCKED 直至设备证据补齐。

## 完成判据

- 原工程与 Release 裁剪后 typecheck 均通过；
- 合同镜像一致；
- RV-25 + R2b/R2c + 预算断言通过；
- 新 ZIP 与清单 SHA 一致、无 Debug/Mock 泄漏；
- 所有未取得证据项明确 NOT_RUN，不宣称全部完成。
