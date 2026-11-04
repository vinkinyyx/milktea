# 挑战待定/领先/平局/落后 · `gen_challenge_status`

- 类型：engine
- 不制作虚构图片
- 实现要点：状态只根据服务端真实challenge记录决定；待定/领先/平局/落后为运行时文本，分别复用 ui_icon_win/ui_icon_tie/ui_icon_loss；未校验时不得声称领先。
- 测试：对应行为需使用真实 Cocos 运行版本检查，当前未执行。
