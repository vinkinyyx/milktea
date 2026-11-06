# AI开发上下文

2026-11-07最新执行[docs49](../docs/49-final-delivery-platform-device-plan.md)：170/0及独立恢复/摘要探针通过；94baeac3候选源/包核对通过。目标503251/1021353和安卓USB路线已由用户确认，ADB已准备但无设备；实际广告MCP TOKEN_REVOKED且缓存矛盾，CLI有效，包体声明有warning。先处理这些真实接入条件，不再索要手工广告ID或反复重修已过客户端逻辑。

最新独立验收见[docs48](../docs/48-adfix-review-and-device-closeout-design.md)：152/0、Web与候选包核验通过，但额外晃杯提交后回读失败时免费重试持续CAS冲突。真实广告和Tap性能未交付。执行docs48第9节，保留已有整改，不沿用下方历史结论覆盖新故障。

2026-11-06独立验收更新：当前源码 `f1c49c0`，本机具备完整工具；原回归125通过1失败，新Release裁剪46/48失败。真实广告关闭且无ID，存在宿主清理归属、复活应用失败假成功、SDK清理缺陷。以[docs47](../docs/47-ad-acceptance-and-final-package-design.md)及[docs22最新节](../docs/22-current-progress-and-resume.md)为准；下方为上一执行机历史，不代表本轮通过或缺工具。

2026-11-06（第二整改轮）。当前入口为[docs46验收与收口设计](../docs/46-v3-review-and-host-closeout-design.md)。工程奶茶挤挤/、Creator3.8.8、Tap小游戏；当前源码是 `cc70736` 加本轮工作区改动，完整身份以实际源清单为准。

## 本轮已完成的代码整改（验证未执行）

实施机为 C 盘仓库（**无D盘**）、**无Node/Python/Cocos Creator**，故 typecheck、118项、构建、真机均为 NOT_RUN。

1. **A 前台分段预算**：`ArtAssets` 用 `lastAccountedAtMs`+`previousForeground` 记账，hide/show 先按旧状态补记，资源回调/`assertScope`/`settle` 前对时；不 clamp 有效大 delta。后台20秒不计入，真实前台超15秒必超时，16秒回调不再错误 settle。
2. **A 令牌化 scope**：`beginLoadScope` 返回 `ArtLoadBudget` 令牌；`settleLoadScope(handle)`/`cancelScope(code,handle)` 令牌不符即 no-op，旧 finally 不能拆新批次。
3. **B 独立错误层**：`render()` = `renderUnsafe()` + 兜底，抛错也建 overlay；`returnToMenuFromError()` 清 overlay/按钮/pointer/engine/world 后可重新开局。
4. **C 设置 scope**：`openModal('SETTINGS')` 自建 `SETTINGS_UI` scope，令牌收尾，首屏仍只按需加载 `ui_*`。
5. **D 宿主交接**：`bind()` 代际变更时清除 PREPARING/SHOWING/SETTLING；同run已提交 receipt 走 `applyCommittedRevive` 免费恢复，不接受旧 used0 覆盖 used1；`watch/finally` 加代际校验。`RewardedShakeService` 同构修复 + `applyCommittedExtraGrant` 免费补发。
6. **E Boot 归因**：AppRoot 增 `BOOT_CONFIG` start/ok/error；细分 `BOOT_CONFIG_READ/VALIDATE`、`BOOT_PHYSICS_UNSUPPORTED`、`BOOT_GAMEROOT_FAILED`、`BOOT_LAB_SCENE`；`StartupRecord.stack` 存前6帧堆栈。
7. **广告资格门槛**：`RewardLedger`/`ReviveLedger` 的 60 秒前台保护改为仅“首局完成前”生效，无限模式用“完成一局自然游戏”映射平台“1个关卡”，不再对老玩家永久隐形阻断。测试断言同步新增老玩家不受限用例。
8. **交接待确认记录**：交接后 `pendingAttempt` 由旧宿主持有、`clearPending` 的归属校验必然失败。`bind()` 立即解除 `PENDING_ATTEMPT` 阻断并异步 `clearStalePending()`（CAS 失败即安全放弃），避免新宿主永久无法发起广告。
9. **预算定时器隔离**：被替换批次的 `tickBudget` 直接返回，不再清除新批次的共享 `budgetTimer`；`verify_rewarded_shake.cjs` 增 `RV-32a/b/c`、`RV-31a/b`、`RS-30a/b` 共 7 条（118→125）；`budget-integration-probe.cjs` 增 A02（起始后台→前台15s必超时）与 B01（旧令牌不能 settle/cancel 新 scope）。二者均**未执行**。
10. **busy 归属**：`watch`/`retrySettlement`/`abandonPending` 的 await 之后统一用 `releaseBusy(owner,generation)`，旧批次不能再清掉新批次的 busy；`bind()` 代际变更时无条件复位 busy 与 attempt 内存态（避免旧批次 `busy=false` 造成重复开广告）。

两个真实广告点代码路径完整，但策略仍 `enabled=false/adUnitId=null`，真实广告**未交付**。

## 上一轮复核结论（保留）

原工程与Release裁剪副本typecheck通过，合同镜像一致，118项回归通过；V3的71+7资源/CRC/SHA复核通过，正常Web开局/落料/移杯/晃杯/暂停/刷新续局已实操。Web在本次localhost上下文可持久化。

真实Tap/广告、原手机晃杯和平台约400MB峰值未验。不要用delta clamp把真实等待丢掉。

下一轮按[执行提示词](../docs/46-v3-review-and-host-closeout-design.md#12-完成标准与执行提示词)执行，保留118项有效修复和既有业务不变量。[当前事实](../docs/22-current-progress-and-resume.md)、[候选身份](../output/taptap-upload/CURRENT-CANDIDATE.md)为准；不回退到旧源码或用旧包验证新代码。
