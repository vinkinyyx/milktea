# LOAD-01

- 状态：PASS
- 候选：20261029-p1a-final-14
- 执行编号：ERR-01-004 / ERR-02-008
- 前置：同一最终候选 20261029-p1a-final-14
- 操作与判据：配置/图片异步加载中切场景销毁旧owner；新owner恢复且无旧回调污染。
- 实际：旧配置/图片请求在场景销毁后取消；新owner body=3、listeners=6；旧回调未改新世界。
- 证据：attempts/ERR-01-004.result.json; attempts/ERR-02-008.result.json
