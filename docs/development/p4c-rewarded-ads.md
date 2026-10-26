# P4-C · 可选激励广告

## 当前决策
用户接受未来考虑广告，但具体奖励、数额和每天上限未定。config/rewarded-ad-policy.json因此enabled=false，rewardKind=unconfigured，amount/dailyLimit=0。本阶段可以完成能力适配与关闭状态；启用验收需要先确定业务规则，不能由开发者擅自用“再送晃杯”补空白。

## 模块与接口
platform/DouyinRewardedAdAdapter.ts实现load/show/dispose；AdPresenter管理用户主动点击与状态；server/ads/AdIntentService prepare/claim。契约/v1/rewarded-ads/prepare和claim；未配置策略返回FEATURE_DISABLED。
策略包含placementId、policyVersion、rewardKind、amount、dailyLimit、affectsRankedRun。当前建议将未来奖励与排名资源分离，具体奖励仍待确认；cosmetic_token只是接口候选类型，不表示已批准货币玩法。

## 客户端流程
IDLE→LOADING→READY→SHOWING→COMPLETED/CANCELLED/FAILED。只有用户明确点带奖励说明的按钮才show；进入广告先暂停/保存，关闭回来保持可恢复状态。广告无库存、失败、拒看都可回原游戏，不制造必须看广告才能重开的路径。
广告SDK完成事件与普通关闭区分；只关闭未完成不领奖。防止load失败无限重试，使用有限退避；切后台晚回调通过intentId/epoch过滤。广告层不直接修改score、coupon或inventory。

## 服务端与幂等
prepare鉴权、placement/策略版本/额度验证，生成intent。claim检查真实可用完成证明，校验玩家/placement/时效/唯一providerEventId；无法可信验证则保持关闭或只做内部非权益实验，不能假定回调已防伪。
同intent重复claim返回同奖励，事务锁日计数与库存，写grant账本后返回。若将来决定奖励为晃杯券，必须同步修改奖励契约并仍遵守每日5和每局额外5，不能旁路已有上限。退款/作废必须有补偿账本，不直接改余额。
广告密钥仅服务端；埋点不发送无必要个人数据。平台限制和SDK版本在实施时重新核对。

## 验收
未配置时所有入口关闭、服务端拒绝；取消/无库存/断网/重复完成/并发claim/过期intent不双发。完成需核对真实库存与账本。交付适配器、关闭开关、已批准策略（若有）、真实广告证据；业务规则未定时状态为“基础设施可交付，启用待定”，不得标商业化已完成。

