# COL-04

- 状态：PASS
- 候选：20261029-p1a-final-14
- 执行编号：COL-02-001
- 前置：同一最终候选 20261029-p1a-final-14
- 操作与判据：销毁刚体时接触索引清理。
- 实际：contactMatrix={'attemptId': 'COL-02-001-CONTACT-1793217324546', 'buildId': '20261029-p1a-final-14', 'pairBegin': {'contactCount': 1, 'beginEvents': 1}, 'pairEnd': {'endEvents': 1, 'contactCount': 0}, 'cornerContacts': {'contactIds': ['9103|cup:1', '9103|cup:0'], 'distinctCupSegments': ['1', '0'], 'contactCount': 2}, 'cornerEnd': {'ended': 'left', 'retained': 'bottom', 'contactIds': ['9103|cup:0'], 'endEvents': 1}, 'otherPairBeforeDestroy': {'contactIds': ['9103|cup:0', '9201|9202'], 'beginEvents': 4}, 'destroyCleanup': {'bodyCount': 4, 'contactCount': 1, 'listenerCount': 7, 'otherPairSurvives': True, 'contactIds': ['9201|9202'], 'staleCallbackReplay': {'contactCount': 0, 'beginEvents': 4, 'endEvents': 2, 'colliderOwners': 0}, 'oldEventCountsUnchanged': True, 'replayAfterIdReuse': {'contactCount': 0, 'beginEvents': 4, 'endEvents': 2, 'colliderOwners': 0}, 'newWorldUnaffected': True}, 'status': 'PASS', 'emitted': True}
- 证据：attempts/COL-02-001.result.json
