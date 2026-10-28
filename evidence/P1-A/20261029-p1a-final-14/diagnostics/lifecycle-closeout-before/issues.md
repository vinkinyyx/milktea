# 20261029-p1a-final-14 issues

## 阶段阻断

- **HOST-AUTH-01 / B1 / OPEN**：LIFE-01～04、06～10及5秒、60秒、5分钟真实隐藏/恢复矩阵未执行。Opera Browser Connector返回`UNAUTHORIZED: reauthentication`；Playwright真实标签切换没有使页面变hidden。影响P1-A出口，不影响同包已完成的前台用例。所需动作：在Codex Apps重新认证Opera，在真实Opera页面打开final14，切换到其他标签并用不抢焦点读取核实hidden/show。

## 保留的失败尝试与未复现现象

- `attempts/ERR-02-006`、`ERR-02-007`为早期图片路由/监听数断言失败，原始文件保留；修正route命中实际native请求并核实启动监听基线后，`ERR-02-008`通过。
- `20261029-p1a-repair-03`约102步压力暂停为历史失败候选，未修改。final14 P0/P1/P2以及混合/严格布局无暂停；历史现象没有在该包复现，故不宣称其根因已确定。
- `20261029-p1a-final-13`内嵌buildId不匹配为被final14替代的失败候选，证据未改写。
- Creator builder worker日志出现SIGTERM；独立Creator进程实际退出码36，结合安装版builder源码和worker完成/退出时序记录归因为构建后worker关闭。没有把空退出码当成功。

- ttempts/index.csv列出本候选全部playwright结果attempt；ERR-02-005是CLI结果被非JSON诊断文本污染（工具输出不完整），ERR-02-006/007是图片销毁测试夹具/断言失败。没有把这些执行当产品PASS；改正native请求匹配及新场景监听基线后，ERR-02-008在最终包通过。所有原attempt输出保留。

