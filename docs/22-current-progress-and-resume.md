# 当前事实与继续入口

2026-11-05。**BLOCKED；最新验收的整改尚未执行。**

已具备：窄杯、自动落料、真实移杯、V2/9:20素材、局部动画、物理事务恢复、分阶段贴图加载和纹理派生；广告晃杯与洒出复活有本地实现，正式广告策略关闭。

最新复核：111/111既有自动回归、类型检查及71+7优化资源检查通过。Web Release实际开始/教程/落料/暂停/继续正常。额外故障注入发现复活奖励提交后回读失败，领取重试永久CAS冲突；取消广告直接结算和每日3次限制偏离原需求。

仍需完成：

1. Tap自测点击开始后只剩背景，需核对上传SHA和首条宿主错误，修复实际首次失败并验证杯/HUD/按钮可操作。
2. 免费恢复已提交复活凭证；未完整观看/加载失败保留同failure手动重试；撤掉未经授权的每日3次限制。
3. 真机晃杯最初物理异常、真实广告、启动速度和旧平台约400MB内存峰值复测；动画其余缺口按docs42保留。
4. 清理复核发现根contracts/types.ts尚未合入工程新增的复活/schema类型，合同镜像检查失败；两份文件与清理前哈希相同。后续正确合并并校验，不运行旧根合同直接覆盖工程的同步操作。

- [最新验收/复现/测试场景](44-tap-host-start-review.md)
- [当前开发执行提示词](../evidence/Acceptance/20261105-tap-host-review/execution-prompt.md)
- [复活产品与原子存档设计](43-spill-revive-performance-design.md)
- [平台与构建](38-taptap-minigame-current.md)

当前保留候选：

- Tap：`20261104-spill-revive-tap-02`，3,021,177 bytes，SHA256 `f768704568d3c43a7122f2a205a79f253650026c3a6a13d4512a0e7ddcd93a3e`。路径见[唯一候选](../output/taptap-upload/CURRENT-CANDIDATE.md)，未作为正式通过包交付。
- Web Release：`build-artifacts/cocos-p1b-build/20261104-spill-revive-web-release-02/`。
- Web Debug：`build-artifacts/cocos-p1b-build/20261104-spill-revive-debug-03/`，仅用于开发验证。
- 派生复核快照：`build-artifacts/cocos-p1b-build-source/20261104-spill-revive-tap-02/`，保留assets/settings等；依赖、导入缓存和转换中间物已清除，不作为另一个开发工程。

当前未核对用户上传包SHA，不能把手机截图自动归属于上述候选。所有旧候选与阶段报告改读[项目外归档](archive-location.md)。清理没有实施上述整改，没有新打包、上传、提审或发布。
