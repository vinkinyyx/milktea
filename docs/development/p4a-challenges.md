# P4-A · 每日同题与好友异步挑战

## 输入与条件
依赖服务器可信run/验分/榜单。只做异步分数挑战，不做实时对战。每题指定stage、rulesVersion、非零seed、投放预算120、基础晃杯2、额外券0；重试无限取最好已验证成绩。

## 模块与数据
server/challenges/DailyService.ts负责北京时间日历生成与唯一(day,rules)题；ChallengeService.create/join/result负责邀请；ChallengeSettlementJob封榜。客户端DailyPresenter、FriendChallengePresenter、ChallengeResultPresenter。
daily_challenges保存seed/budget/openAt/closeAt；friend_challenges保存sourceRun、同题配置和expiresAt；challenge_entries保存每人最佳verifiedRun，不存客户端任意分。
API见/v1/daily-challenges/today和/v1/friend-challenges。服务端从题目读取参数，客户端不可自选seed、增加券或改成更宽杯。

## 开局、结束与截止
服务器北京0点生成当日题，closeAt下个0点；只接受截止前的有效操作，网络提交可有明确有限传输宽限但不能允许截止后继续玩，宽限一旦采用须单独配置并在规则版本记录。默认无额外宽限。
第120次投放后禁投，继续物理最多300tick=5秒后结算，危险/溢出可提前结束。第120次投放本身必须截止前受理；最后5秒也不能越过closeAt继续计挑战分。中途退出可恢复，但不得暂停跨截止获额外时间。
同条件seed只决定出料，玩家落点决定结果；不宣称全玩家轨迹相同。额外券按钮隐藏且服务器拒绝，已有券不被扣。

## 好友创建与胜负
只有已验证、同预算标准daily/friend局可直接作为挑战基准；经典无限局分数不能直接和120投题比较。经典分享卡可邀请进入游戏，若要发公平挑战，先玩一次规定条件的题目。
创建者选择有效期的业务默认需在上线前固定并写入配置；初始实施以当日closeAt为上限，不擅自让挑战永久有效。join校验有效期、账号、版本和题参数，重复加入返回原entry。
未完成一方显示待挑战，不称对方输；双方有verified结果时高分领先，同分平局。挑战截止才确定当前最终胜负；可重试阶段标“暂时领先”。创建者自己也可再刷同题最好分，记录发生时间。
分享参数使用短challengeId，服务端解析归属和题配置，不把可篡改score/seed当可信信息。已过期链接显示结果/今日题入口，不自动创建收费或领奖动作。

## 异常与验收
并发结算只更新更高分，较低重试不能覆盖；PENDING不宣布胜利；已封榜成绩依明确截止规则处理。客户端改时间无效。活动局旧规则不可迁移混榜。
必测同seed前120料一致、122次投放拒绝、额外券拒绝、最后5秒/截止边界、重复join、无成绩一方、平分、过期链接、两次并发高低分。交付题服务、调度重跑记录、DB结果、分享真机和胜负状态截图。

