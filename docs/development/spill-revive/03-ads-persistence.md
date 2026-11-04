> 当前事实与执行以[最新独立验收](../../44-tap-host-start-review.md)为准；本分册保留需求/设计依据，其中旧完成状态和旧提示词不能覆盖最新整改。

# 广告接口、存档契约与一次复活保障

## 1. 官方接口与完成标准

2026-11-04重新读取，页面未标接口版本更新时间：

- [tap.createRewardedVideoAd](https://developer.taptap.cn/minigameapidoc/dev/api/ad/tap.createRewardedVideoAd/)：adUnitId必填，默认单例，可显式multiton。
- [onClose](https://developer.taptap.cn/minigameapidoc/dev/api/ad/RewardedVideoAd.onClose/)：仅`res.isEnded===true`确认完整观看。规定时长由原生广告及其奖励机制决定；不是自己计时5/15/30秒，也不接受嵌套status、show Promise完成、页面可见时间作为替代。
- [广告规范](https://developer.taptap.cn/minigameapidoc/tap-operation/operation-standards/minigame-ad-policy/)：自愿并预先说明奖励；首次启动体验保护。维持现有教程/首次体验资格门禁，未获平台确认不放松“60秒及首自然局”保守策略。

沿用Dirichlet/TapADN普通小游戏路径。晃杯与复活可使用各自真实激励位；是否复用同位以媒体配置/真实宿主测试为准，不把MiniApp ID当广告位。没有真实位或可靠持久化能力时，在观看前禁用复活广告，不展示视频后再说不能保存。

## 2. 共享展示协调

新增App级`RewardedAdSessionCoordinator`，统一持有展示锁与Provider生命周期；保留现有TapRewardedAdProvider的load超时、稳定监听注销、attempt隔离，不能为第二广告点另起一套不互斥的全局单例。

上下文：`{placement:'extra_shake'|'spill_revive',attemptId,runId,failureId?,ownerEpoch,policyVersion,adUnitId}`。一个时刻最多一个PREPARING/SHOWING/SETTLING；重复点击复用/拒绝，不覆盖pending。关闭回调只能回到所属上下文，不能把extra_shake的完成变成复活。

Provider负责load/show/严格outcome；各业务Service负责奖励内容。业务ID与SDK展示回调ID不同，不伪称平台提供了唯一impressionId。保留错误/晚回调隔离验证；多例支持必须在目标宿主实际确认，不能仅因类型声明有multiton就宣称平台已支持。

策略建议新增独立`spillRevive`配置块：enabled=false、adUnitId=null、maxSuccessfulPerRun=1、autoDropDelayTicks=120、clearanceDu=40。晃杯现有每天/每局5次计数保持，只对晃杯生效；不擅自加“复活每日也5次”。保留统一首次体验保护、平台原生频控和互斥；不新增未经用户要求的强制插屏。

## 3. 数据结构建议

当前run schema4/profile2/envelope2。建议升级为run5/profile3/envelope3，完整保留只读迁移和未知未来版本保护：

```text
RunSnapshotV5.revive = {
  used: 0 | 1,
  pendingFailure: null | {
    failureId, detectedTick, reason:'SPILLED', spilledEntityIds,
    candidate: ReviveCandidate, candidateHash
  },
  committedReceiptId: null | UUID
}
ProfileV3.rewardedRevive = {
  pendingAttempt: null | {
    attemptId, placement:'spill_revive', runId, failureId,
    candidateHash, policyVersion, startedAt
  },
  receipts: [{attemptId,runId,failureId,candidateHash,status:'COMMITTED',grantedAt}]
}
```

`ReviveCandidate`只含恢复所需run字段和清理ID，不嵌套整个run.revive产生递归/膨胀；写一次候选，不持续录每帧。候选hash覆盖runId/rules/tick/score/剩余物体/RNG/pendingSpawn/清理集，使用现有canonical checksum模式。

保留rewardedShake独立账本，两个placement由协调器互斥和同一个Repository单写CAS协调。若改为通用ledger需明确迁移，不能重置旧晃杯凭证/日计数。所有receipt查重需比对字段，同attemptId同内容直接返回已有结果，不再加次数；同ID不同failure拒绝。

校验：used整数0或1；receipt与runId/failureId相同；used1必须有相应已提交凭证；candidate几何/有限值/字段范围正确；score等恢复字段不得高于或低于冻结当步的承诺值。boardType应为`assisted`当且仅当extraUsed>0或revive.used===1，不再用“extraUsed==0必须standard”的旧断言。

旧run4迁移默认used0/pendingFailure null；已终结的lastResult不变，不把历史已结束SPILLED倒变为可复活。旧版本run/个人记录身份保留，只有明确正常保存才写盘，不在启动资源重试时写迁移。应用版本、rulesVersion、存档schema是三类版本，分别核验。

## 4. 完整原子流程

1. SPILL固定步提交->冻结，生成并验证candidate，保存pendingFailure；保存失败不展示广告，允许重试保存或结束本局。
2. 用户自愿点观看->等待保存队列空闲后重新读bundle/revision/run，验证failure未变/used0/资格；写入pendingAttempt和candidateHash，再调用Provider.prepare/show。
3. load失败/取消准备/未看完：可靠CAS清pendingAttempt，pendingFailure保留；不加receipt、不改used/score/boardType。清理保存失败不能假装结束，保留可恢复状态。
4. 严格COMPLETED：持有内存可信完成标记，验证原run/failure/候选/owner。组成一个新bundle：candidate变为PAUSED活动run、used1、receiptId、boardType assisted、清pendingFailure；profile写receipt并清pendingAttempt；其它晃杯/个人记录不变。单次CAS提交并回读。
5. 以已提交候选重建真实世界，重建成功才展示“复活成功”。构建失败则保留已提交候选，免费重试应用，不再看广告，不再发第二份或把used清0。
6. 点击继续->epoch更新、输入清空、tick不回退，自动料缓冲120tick；同局继续累计分数。

每个await后核对runId/failureId/attemptId、host generation。等待保存前抓的旧bundle不能在等待后直接覆盖新状态。scene卸载不能把inflight改回IDLE；新UI同run只重新订阅，旧UI不得回调新局。

## 5. 异常和崩溃恢复

| 中断点 | 恢复语义 |
|---|---|
| pendingFailure已存，未观看 | 重进仍可选择观看/结束，used0 |
| pendingAttempt已存，视频未确认 | 不补发；明确上次未确认，可重试或结束 |
| 完成但保存失败，进程尚在 | 同attempt重试提交，无需重看 |
| 完成回调未落盘就杀进程 | 本地无法证明完成，不凭空奖励；说明限制 |
| 原子提交后、重建前杀进程 | 从已提交候选PAUSED恢复，used1/score保留，不再给广告机会 |
| 重复/晚close | 已有receipt幂等；错误placement/已结束旧局忽略，不给新局 |
| 保存CAS冲突/抛错 | 保持冻结和可重试，不先应用可玩内存奖励 |
| 广告后hide/show | AD与HOST锁独立，回前台不表示看完，不自动恢复物理 |

本地一次性保证只在可验证的单设备存档范围内；重装/改文件/跨设备防刷没有服务端保证。若需强防刷另行确认官方服务端能力，不能编造验奖API。

## 6. 不与免费技术恢复混淆

`PHYSICS_TICK_ROLLED_BACK`/资源失败是产品错误，走免费检查点恢复，绝不展示复活广告，也不改revive.used、晃杯余额或standard/assisted。技术恢复只能使用不早于已提交奖励凭证的兼容快照；旧盘档不能回滚掉已经获得的复活或晃杯权益。本轮已修临时模式内存检查点，后续需把schema5/receipt约束纳入该路径。
