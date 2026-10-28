# 20261029-p1a-final-14 issues

## 阶段阻断

- **LIFE-BOOT-RESUME-01 / B1 / OPEN**：LIFE-08真实产品失败。Boot配置加载中隐藏→放行→返回后才建立Lab，未按R已推进13/16步。协调器只回传当前backgrounded，缺跨场景持久resumeRequired。原始证据attempts/LIFE-08-PRIMARY-001/result.json、attempts/LIFE-08-PRIMARY-002/result.json；最小修复见docs/27。需要修复运行代码、新候选同包回归，不再要求先认证Opera。

- **HOST-AUTH-01 / CLOSED AS P1-A DEPENDENCY**：Opera连接仍返回认证要求，但已用现有Chrome原始CDP会话撤销覆盖后取得可信真实hidden/show；因此Opera不再是P1-A验收必要依赖。没有代替用户认证或绕过安全边界。参见diagnostics/lifecycle-control-02及lifecycle/diagnosis-summary.json。

## 保留的失败尝试与未复现现象

- `attempts/ERR-02-006`、`ERR-02-007`为早期图片路由/监听数断言失败，原始文件保留；修正route命中实际native请求并核实启动监听基线后，`ERR-02-008`通过。
- `20261029-p1a-repair-03`约102步压力暂停为历史失败候选，未修改。final14 P0/P1/P2以及混合/严格布局无暂停；历史现象没有在该包复现，故不宣称其根因已确定。
- `20261029-p1a-final-13`内嵌buildId不匹配为被final14替代的失败候选，证据未改写。
- Creator builder worker日志出现SIGTERM；独立Creator进程实际退出码36，结合安装版builder源码和worker完成/退出时序记录归因为构建后worker关闭。没有把空退出码当成功。

- attempts/index.csv列出本候选全部playwright结果attempt；ERR-02-005是CLI结果被非JSON诊断文本污染（工具输出不完整），ERR-02-006/007是图片销毁测试夹具/断言失败。没有把这些执行当产品PASS；改正native请求匹配及新场景监听基线后，ERR-02-008在最终包通过。所有原attempt输出保留。


## 本轮工具尝试

- LIFE-01-PRIMARY-001在准备阶段创建辅助标签后没有重新聚焦画布，R未被接收，ACTIVE_TIMEOUT；已保留原始输出并归为TOOL_SETUP_FAIL，修正夹具后LIFE-01-PRIMARY-002通过。
- LIFE-08-PRIMARY-001/002均为真实行为FAIL，不是工具超时。其余本轮selected后台结果由原始断言生成；LIFE-03为一次连续300秒隐藏，没有累计多个短窗口。
