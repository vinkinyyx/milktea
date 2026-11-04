# 2026-11-04 交付复核、手机恢复与性能优化记录

结论：正式交付BLOCKED。用户报告旧v4平台启动/内存测试失败（峰值约400MB），手机HTTP浏览器点击晃杯后回滚及读检查点失败。最初晃杯异常尚未在本地复现；本轮已修已知恢复路径并生成首批优化复测候选。新广告复活仅设计，未启用广告，未上传平台。

身份限定：v4是本地优化前基线；用户实际上传ZIP的SHA和手机HTTP构建ID未知，不能将外部故障断言为该特定SHA的复现。

## 实际执行

| 检查 | 结果/范围 |
|---|---|
| 修改前后回归 | 80/80，regression.log/regression-after.log |
| typecheck/配置/types镜像/原71图 | PASS；原配置SHA f10bbd9c5fbb408449a572fb243ec58b645653dd0ca741402e0fc19a477a25f5 |
| 旧包预检 | 3PASS/0FAIL/1WARN；缺商店物料manifest，不是平台通过 |
| 真实移动杯8种子 | 3203～4841步自然终局，5SPILLED/3CUP_FULL，无fault；mobile-fault-probe.json |
| 真实晃杯12种子 | 各900步后晃杯再120步，均baseUsed1、无fault；shake-fault-probe.json；不是手机根因关闭 |
| repository不可用时真实事务故障注入 | 恢复同run/score/RNG/spawnRNG并安全暂停；memory-recovery.json/png |
| 恢复后继续90步 | PLAYING/tick90/fault null/score10/baseUsed0；recovery-resume.log |
| 原/新Release本地DPR3资源对照 | menu71->22，art RGBA44699616->4982272bytes；buffer同780×1688，不宣称buffer节省；compare-startup.json |
| 新游戏图像校准 | 69art，杯体节点仍750×1000，教程按钮可见，Release fixture undefined |
| Debug/Web Release/Tap新构建 | Creator36，typecheck及转换成功；见web-debug/web-release-02/tap-release-02结果 |
| 71art+7effects派生入ZIP | 原稿SHA->派生->包核对PASS；原稿不修改；optimized-asset-verification.json |
| 用户手机及平台新包复测 | NOT_RUN，最初故障/400MB平台评测仍OPEN |

原始截图保留user-physics-rollback.jpg和user-checkpoint-unavailable.jpg。截图为手机浏览器局域网HTTP，不据此宣称Tap原生宿主也已复现同一异常。

## 本轮实现

RunEngine保留失败事务前数据，GameRoot支持本页内存恢复并校验、给出原错误摘要；首屏22项，游戏资源分阶段/并发4；构建镜像生成较小贴图与6图集/猫咪副本，杯体display_size保持；新增严格派生校验器。没有改物理参数、存档schema、广告策略或原始素材；完整广告复活未实现。

可直接证明的纹理预算总量：60,251,896->24,119,392bytes，**不是进程实测**。冷启对照为稳定场景而加入等待，sampleAtMs不用于性能结论。第一次CDP场景读取过早失败后增加等待，最终数据/截图成功；没有把测试装置异常当产品错误。

## 当前候选

以tap-release-02/result.json和最终交付manifest为准，revision01仅过程候选。正式广告关闭；平台版本后台唯一性未确认，存档appVersion仍沿用0.1.0，与产物版本0.1.2分别记录。最终ZIP只给用户复测，不自行上传或提审。

[完整设计与提示词](../../../docs/43-spill-revive-performance-design.md)。新CSV为后续设计用例默认NOT_RUN，本表才是本轮实际执行记录。
