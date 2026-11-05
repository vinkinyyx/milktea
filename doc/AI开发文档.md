# AI开发上下文

2026-11-05更新。当前完整验收与实施规格以[docs45](../docs/45-r1-r4-acceptance-next-design.md)为准，本文件只提供导航。

- 工程：`奶茶挤挤/`，Cocos Creator3.8.8、TypeScript、集成Box2D；Tap扩展1.2.2。当前目标是Tap小游戏，非抖音首发/H5/APK；工程不叫client。
- 源码：工程assets/scripts；配置源config/design-baseline.json，类型源contracts/types.ts。根合同落后于工程复活类型，禁止用旧根合同覆盖工程。
- 当前源commit：bd12b73，origin/main已同步。现有game.zip是前轮，不含该commit。
- 已验：原工程类型检查通过；原R2回读失败恢复、取消后保持PAUSED、同日第四局offer允许。
- 未通过：R1超时/generation未接通；开始后阶段/可见错误层未完成；Release裁剪后缺DiagnosticRing；R2新检查点revision与异步owner边界；取消后UI无再次观看；旧RV-25未更新，结果110/1。
- 真实Tap宿主、原始晃杯异常、广告/启动/内存复测仍未关闭，不仅是缺设备。

下一步按[docs45第12节提示词](../docs/45-r1-r4-acceptance-next-design.md#12-开发执行提示词)执行。[当前事实](../docs/22-current-progress-and-resume.md)、[工具入口](../tools/README.md)、[候选基线](../output/taptap-upload/CURRENT-CANDIDATE.md)按实际结果更新。

保留：完整观看isEnded===true、两广告互斥、同run同分、双槽CAS、崩溃恢复、每局一次及120tick缓冲。没有真实广告位时策略关闭，不把Mock当真实验收。
