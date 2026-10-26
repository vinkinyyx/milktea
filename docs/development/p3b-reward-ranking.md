# P3-B · 录屏奖励、晃杯券、可信成绩与榜单

## 进入条件与模块
P3-A账号/云档可用，P2已证实真实发布证据可校验；否则奖励开关保持关闭。待证实的跨端物理验分同样是上线榜单前置，不得以规则写得详细代替技术结果。
模块：RewardService.prepare/claim；CouponService.getBalance/consume；RunVerifier.verify；SettlementService.finish；LeaderboardRepository.list；客户端RewardPresenter/CouponPresenter/LeaderboardPresenter/ShareCardRenderer。API/字段见contracts。

## 奖励业务规则
每成功发布一份新的本局真实录屏可领1张券；同一run最多领1次、同一发布内容不得重复领；同账号北京时间一天最多5张，五杯共享。取消、失败、仅点击分享不得领。
券当日24点过期，基础2次优先使用；一局实际额外用券最多5次，即使跨日也最多5。账户有新券不突破本局上限。每日额度按服务器Asia/Shanghai日历算，不信手机时间。
券余额、当天已领次数、过期时间、当前局额外已用分别展示；“已领取5/5”不等于“还剩5”。首次真用券才从标准局切到助力局，领取但未使用不改变榜分类。切助力后不可切回。

## 发布与发券事务
prepare校验run归属和有效，生成不可猜intentId、过期和服务端nonce，绑定player/run/platform。claim带intent及可验证平台证明；先在事务外执行证据校验并验证发布归属/内容/时效，不能持数据库锁等平台网络。
事务内按固定顺序锁reward_intent→reward_daily(player,Beijingday)→run→coupon批次；新daily行先INSERT ON CONFLICT DO NOTHING再SELECT FOR UPDATE。重复intent或唯一发布ID命中时返回原结果。
重新确认intent未消费、run未领、当天count<5；写share_grants唯一run和platformContent、daily+1、coupon_batches+1、coupon_ledger GRANT+1；同事务提交。第六次返回DAILY_LIMIT且无任何部分写入。
幂等键作用域为(player,route,key)，存请求摘要和响应；同键不同payload返回409，不复用旧结果。平台证明验证失败不产生券，也不把intent标领完；可恢复错误允许重试，永久无效明确提示。
两请求同时冲第五张只能一个成功；每天边界以事务决定的server day为准。平台证明不能可信验证时返回VERIFICATION_UNAVAILABLE，并保留普通分享，不偷偷降级为点击即发。

## 用券事务与游戏时序
基础还有时核心本地先用基础，不调用扣券。需要额外时进入SHAKE_PENDING临时冻结核心，发送runId/commandId/sequence/tick；超时重试同commandId，不递增新请求。
服务端锁run→可用批次，检查active、owner、extraUsed<5、命令序列合法、当天余额>0；扣最早到期批次1、写CONSUME-1和唯一consumeEventId、run.extraUsed+1、board=assisted，同事务保存命令。成功后客户端只应用一次ShakeAccepted并恢复；失败恢复原状态且不执行晃杯。
若服务端已扣但客户端断线，重连拉命令日志和checkpoint，补应用同一consumeEventId；不自动退券又补执行。重开后晚回调因epoch不同不应用到新run。真正放弃已扣且已受理的局不退款，避免反复回滚刷券。
后台过期不删除账本；余额以批次剩余且未过期计算。跨日清额度但不重置run.extraUsed。不得把过期整批原始数量再扣一次导致负数。

## 操作日志与验分
客户端上传规范命令序列和checkpoint；服务器初始seed、规则、投放上限、晃杯授权与命令时间为真值。finish仅置PENDING，不能立即上榜。结构验证检查连续sequence、非倒退tick、合法drop与random、事件父子一次消费、units、得分、资格/终局和次数，拒绝NaN/不可能对象/伪造券。
结构检查不能证明玩家没有伪造碰撞。必须做技术试验：同后端无头回放能否在锁定环境重现碰撞与最终账本。若跨环境不确定，选可验证的规则/运行环境或服务器权威物理方案并形成ADR；未经验证不能标VERIFIED或打开公共权威榜。
状态PENDING→VERIFIED/REJECTED/STRUCTURAL_ONLY；结果查询可轮询退避。PENDING显示“成绩核验中”，本地个人纪录可展示为待核验；REJECTED给可理解原因和反馈入口，不泄漏作弊阈值。
分数只来自服务器确认的合成账本，不信请求score；同run结算一次，重复finish返回同结果。验分失败保留可诊断日志，不把失败自动改成通过。

## 排名与胜负
每杯+rulesVersion+boardType独立榜，取player最高已验证单局分；不同宽度、版本和标准/助力绝不混排。排序先score降序，再达到时间升序、playerId稳定分页；对外名次用RANK，1200/1000/1000/800显示1/2/2/4，较早时间只稳定展示，不打破同分并列。
“超过X%”分母为同榜其他有效玩家数，分子为分数严格低于自己人数；没有其他玩家显示“成为首位挑战者”，不除0、不含自己。不拿虚构机器人当真实人排名。
无限经典没有最终赢遍所有人的通关；玩家刷新纪录、合到麻薯、提高名次就是阶段成就。榜单成绩高于对方可称本次领先，同分并列。具体好友胜负在P4同条件模式定义。
分页cursor包含score/time/playerId和榜快照版本；榜变动时提示刷新，不能重复/漏掉页面又称稳定。移除违规分后重建best，不把玩家历史所有合法分一起删除。

## UI与验收
结算卡包含奶茶款、分数、最高料、规则/标准助力标记和真实截图；昵称/头像来自授权平台或默认，不拉无权限通讯录。分享失败可继续重开。排行榜加载/空/失败/核验中/本人未入榜均有独立状态。
验收：第5/6张、重复intent/content/run、两个并发第五张、改手机时间、跨午夜、基础优先、跨日第6次额外、扣券断网恢复、伪造score、同分、空榜、待核验不入榜、越权领奖。检查数据库前后行和券账本，不只看界面。
交付可信证据试验、验分ADR、事务代码/并发测试、榜单SQL、卡片模板和真机录屏。证据或验分未通过时本阶段不算公开发行完成。


## 长局日志上传协议
无限刷分不能把整局全部事件塞入一个有5MiB限制的finish。每满100条命令或15秒活动时间尝试POST /runs/{runId}/logs，单批最多1000命令/2000事件；超过字节限制先分批，绝不截断账本。
第一批firstSequence=0/previousBatchHash=null；后续批接前次lastSequence+1和batchHash。服务器锁run检查连续性、前驱、命令ID和已经受理的扣券命令是否完全一致；同批重复返回原receipt，改变已收内容返回409。
hash用UTF-8规范JSON（对象键排序、无空格、数组有序，排除batchHash本身）做SHA256；不得用不同序列化格式造成假冲突。hash只防传输变更，不证明客户端诚实。
客户端只在receipt落地本地后清除待传副本；断网继续保存本地队列，重连顺序补传。finish仅带最后小尾部和finalSnapshot；验分读取服务器完整批次+尾部，缺序列保持待补传/拒绝，不以最后100条估全局得分。
