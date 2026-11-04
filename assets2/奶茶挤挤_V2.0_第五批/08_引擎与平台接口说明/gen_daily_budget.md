# 120投进度条 · `gen_daily_budget`

- 类型：engine
- 不制作虚构图片
- 实现要点：每日同题进度，0–120投，超出上限禁止显示/继续增加；根据gameState.dailyDropCount实时渲染，不在贴图中放入固定数值。
- 测试：对应行为需使用真实 Cocos 运行版本检查，当前未执行。
