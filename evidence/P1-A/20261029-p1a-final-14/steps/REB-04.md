# REB-04

- 状态：PASS
- 候选：20261029-p1a-final-14
- 执行编号：COL-02-001
- 前置：同一最终候选 20261029-p1a-final-14
- 操作与判据：接触结束、销毁清理、回调隔离与重建后ID复用。
- 实际：矩阵PASS；begin/end={'contactCount': 1, 'beginEvents': 1}/{'endEvents': 1, 'contactCount': 0}；角落两面接触后结束一面仍保留另一面；销毁清除owner=0；ID复用后新世界未受旧事件影响=True。
- 证据：attempts/COL-02-001.result.json; attempts/REB-01-001.result.json
