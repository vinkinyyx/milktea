# P2 · 抖音适配和封闭测试

## 前置、外部依赖和交付
需要P1-D、实际开发者账号、可用AppID与目标手机；主体资格、类目和发行要求按申请当时后台核验，本设计不保证个人一定可正式发行。P2只做真实平台能力与封测，奖励和联网榜在P3。
官方入口：[分享API](https://developer.open-douyin.com/docs/resource/zh-CN/mini-game/develop/api/javascript-api/open-capacity/retweet/tt-share-app-message)、[必要能力](https://developer.open-douyin.com/docs/resource/zh-CN/mini-game/guide/minigame/essential-skills)，核对日期2026-10-27，开发时复核版本。

## 文件设计
platform/IPlatformAdapter引用contracts接口；platform/DouyinAdapter.ts封装SDK；platform/LocalAdapter.ts用于本地且明确返回UNSUPPORTED；platform/CapabilityProbe.ts记录能力；platform/RecordingController.ts管理录屏状态IDLE→RECORDING→STOPPING→READY/FAILED。
UI与core只调用适配器，不直接访问tt。平台session code只能送服务端换身份，不能写日志/截图；P2可先无服务器展示匿名，不伪造已登录。

## 接入任务
1. 在实际Cocos版本构建抖音包，记录操作/构建设置/输出目录，不把H5包改后缀冒充小游戏。
2. 绑定onShow/onHide：onHide先冻结核心→停止/暂停音频→保存→处理录屏；onShow回到暂停确认页，不自动推进离开期间物理。
3. 获取安全区域、胶囊/系统遮挡，适配短屏；侧边栏进入/复访按平台现行要求实现并真机验证。
4. 录屏在玩家明确操作或已说明的流程启动。结束停止得到本地视频路径；只能处理本局内容，失败保留成绩。
5. 用户点发布后调用真实发布接口。取消、失败、无权限、旧SDK不支持、后台切换都回到可继续页面；不扣机会，P2不发券。
6. 隐私告知只描述实际采集信息；系统授权由实际能力触发，不启动即索要所有权限。不存在自由文本输入时不额外造敏感词功能，有则按平台规范接入。

## 可信证据技术验证任务
SDK的success或“点击分享”不是本项目认可的服务端防伪发布证明。建立能力表，列SDK/权限/返回字段、能否校验发布ID、能否服务端查询、取消样例、重复样例、过期策略。
P3-B启用奖励前必须有实际可用证据链；如果只有客户端成功回调，只能做低可信内部实验，不公示“已验证发布”，不以此打开自动领券。该限制不阻碍普通分享和本地玩法。

## 异常实现
平台Promise包装只完成一次；timeout后晚回调用requestToken/epoch忽略。UNSUPPORTED显示替代文案，不写假成功。录屏临时文件路径不能进入永久存档；旧局录制结束回调不能发到新局。SDK异常只影响相关按钮，不能卡住结算/重开。
禁止在日志中保留登录code、access token、视频原始路径或真实玩家个人内容。

## 真机用例与验收
正常进入、后台30秒回来、切应用录屏中断、拒绝权限、取消发布、网络离线、低版本客户端、侧边栏进入、系统静音、十次重开。对每能力记录通过/失败/不支持及设备版本。
交付DouyinAdapter、能力矩阵、真机证据、封测构建及后台审核状态。没有账号/权限时记录具体依赖，不能称抖音已通过；本地调试模拟回调不作为平台验收证据。

