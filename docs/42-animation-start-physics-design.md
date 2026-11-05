# 动画、开局与自然落料设计

本页保留2026-11-04设计依据；其中部分已在本地实现。当前缺陷、已执行验证和下一轮工作只按[最新独立验收](46-v3-review-and-host-closeout-design.md)，不要重跑已归档的旧执行提示词。

| 分册 | 内容 |
|---|---|
| [开局与UI可达性](development/animation-start-physics/02-start-flow.md) | 首局、教程、继续、失败出口及无按钮场景 |
| [动画接入设计](development/animation-start-physics/03-animation-integration.md) | 效果映射、资源、事件、暂停、减少动态与性能 |
| [自然落料与堆积](development/animation-start-physics/04-natural-piling.md) | 独立随机流、确定性偏移、物理和存档测试 |
| [逐项测试案例](development/animation-start-physics/test-cases.csv) | 设计用例；不等同全部已执行 |

当前本地具备加载态开局、教程出口、自动落料、真实移杯、自然微偏移及部分序列帧动画。仍需按最新验收处理Tap宿主背景空屏、真机晃杯、广告/性能，以及尚未闭合的动画与生命周期项。场景转场、猫咪动态、危险提示/连击反馈的实现边界应逐项实测，禁止因素材已拷贝就写全部完成。

旧80项/20种子/转换包的原始结果保留在[项目外历史归档](archive-location.md)，不能替代当前同SHA实体Tap宿主验收。[当前事实](22-current-progress-and-resume.md)、[当前开发提示词](../evidence/Acceptance/20261105-tap-host-review/execution-prompt.md)和[候选入口](../output/taptap-upload/CURRENT-CANDIDATE.md)为现行入口。
