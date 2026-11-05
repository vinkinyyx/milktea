# 当前事实与继续入口

2026-11-05。**BLOCKED；R1–R4已部分实现，下一轮设计尚未执行。** commit bd12b73已在origin/main；本轮执行push返回Everything up-to-date并用ls-remote核对。

已具备：窄杯、自动落料、真实移杯、V2/9:20素材、局部动画、物理事务恢复、分阶段贴图加载和纹理派生；广告晃杯与洒出复活有本地实现，正式广告策略关闭。

最新复核：原工程typecheck通过，既有回归110 PASS/1 FAIL（RV-25旧断言）；真实Release裁剪后的隔离typecheck失败，缺DiagnosticRing导入。原R2回读失败场景已能恢复，R3取消后PAUSED，R4同日第四局offer允许。但R1超时/generation只声明未接通，开始后阶段与错误出口不完整；R2最新revision/owner边界仍失败，R3缺重新观看按钮。根类型合同仍未同步。

下一轮完整方案和提示词见[docs45](45-r1-r4-acceptance-next-design.md)。优先修Release裁剪→真实加载截止和开局状态层→领取身份/revision和重试UI→合同/测试→新唯一ID包体→同SHA Tap/广告/性能复测。其它原有晃杯与动画缺口保持OPEN。

- [最新验收与详细设计](45-r1-r4-acceptance-next-design.md)
- [开发执行提示词](45-r1-r4-acceptance-next-design.md#12-开发执行提示词)
- [复活产品与原子存档基线](43-spill-revive-performance-design.md)
- [平台与构建](38-taptap-minigame-current.md)

保留的前轮基线（均不含bd12b73，不可据此验证新改动）：

- Tap：`20261104-spill-revive-tap-02`，3,021,177 bytes，SHA256 `f768704568d3c43a7122f2a205a79f253650026c3a6a13d4512a0e7ddcd93a3e`。路径见[唯一候选](../output/taptap-upload/CURRENT-CANDIDATE.md)，未作为正式通过包交付。
- Web Release：`build-artifacts/cocos-p1b-build/20261104-spill-revive-web-release-02/`。
- Web Debug：`build-artifacts/cocos-p1b-build/20261104-spill-revive-debug-03/`，仅用于开发验证。
- 派生复核快照：`build-artifacts/cocos-p1b-build-source/20261104-spill-revive-tap-02/`，保留assets/settings等；依赖、导入缓存和转换中间物已清除，不作为另一个开发工程。

当前未核对用户上传包SHA，不能把手机截图自动归属于上述候选。所有旧候选与阶段报告改读[项目外归档](archive-location.md)。本次独立验收未修运行代码、未更新RV-25、未新打包或上传Tap；只推送核对既有commit并编写设计。本轮文档更改未另行提交。
