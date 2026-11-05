# AI开发上下文

2026-11-06。当前入口为[docs46验收与收口设计](../docs/46-v3-review-and-host-closeout-design.md)。工程奶茶挤挤/、Creator3.8.8、Tap小游戏；当前源码是bd12b73加未提交/未跟踪整改，完整身份以实际源清单为准。

原工程与Release裁剪副本typecheck通过，合同镜像一致，118项回归通过；V3的71+7资源/CRC/SHA复核通过，正常Web开局/落料/移杯/晃杯/暂停/刷新续局已实操。Web在本次localhost上下文可持久化。

仍BLOCKED：后台时间预算误计、超期回调guard漏检、错误层返回菜单输入残留及render兜底、首屏设置scope、宿主交接后SETTLING、Boot/异常诊断缺口。真实Tap/广告、原手机晃杯和平台约400MB峰值未验。不要用delta clamp把真实等待丢掉。

下一轮按[执行提示词](../docs/46-v3-review-and-host-closeout-design.md#12-完成标准与执行提示词)执行，保留118项有效修复和既有业务不变量。[当前事实](../docs/22-current-progress-and-resume.md)、[候选身份](../output/taptap-upload/CURRENT-CANDIDATE.md)为准；不回退到旧源码或用旧包验证新代码。
