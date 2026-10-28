#!/usr/bin/env python3
"""Update only lifecycle rows from selected raw runs; retain every old attempt."""
from __future__ import annotations
import argparse
import csv
import hashlib
import json
from pathlib import Path


def load(path: Path):
    return json.loads(path.read_text(encoding='utf-8-sig'))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--evidence', required=True)
    parser.add_argument('--build-id', required=True)
    args = parser.parse_args()
    root = Path(args.evidence).resolve()
    selection = load(root / 'lifecycle/selected-attempts.json')
    with (root / 'cases.csv').open(encoding='utf-8-sig', newline='') as f:
        reader = csv.DictReader(f)
        columns, rows = reader.fieldnames, list(reader)
    expected = {
        'LIFE-01': '真实标签隐藏至少5秒，DOM/Game事件可信，隐藏冻结，show后仍暂停，R后推进。',
        'LIFE-02': '同一真实隐藏区间至少60秒，状态冻结，show不自动恢复，R后推进。',
        'LIFE-03': '同一真实隐藏区间至少300秒，状态冻结，show不自动恢复，R后推进。',
        'LIFE-04': '手动P后隐藏/显示，MANUAL保持至R。',
        'LIFE-05': '运行中打开图库，真实隐藏/显示，关闭图库仍需R。',
        'LIFE-06': '手动暂停后打开图库，真实隐藏/显示再关闭，不自动解除暂停。',
        'LIFE-07': '挂起图片请求，真实隐藏后放行，返回时初始化无物理步且需R。',
        'LIFE-08': '挂起配置请求，Boot隐藏后放行，返回并切PhysicsLab时tick=step=0且需R。',
        'LIFE-09': '队列和接触重建各自在运行期间真实隐藏；任务冻结、owner不变，R后正常继续。',
        'LIFE-10': '真实前台单次250ms主线程长帧触发BACKLOG，最多5物理步，无后台事件替代。',
    }
    selected = {}
    for row in rows:
        cid = row['caseId']
        if cid not in expected:
            continue
        refs = selection['cases'].get(cid, [])
        results, summaries = [], []
        for ref in refs:
            path = (root / ref).resolve()
            if root not in path.parents:
                raise ValueError(f'Path escapes evidence: {ref}')
            d = load(path)
            if d.get('buildId') != args.build_id or d.get('expectedBuildId') != args.build_id:
                raise ValueError(f'Wrong build in {ref}')
            if not str(d.get('caseId', '')).startswith(cid):
                raise ValueError(f'Wrong case in {ref}')
            checks = d.get('checks', {})
            declared_pass = d.get('pass') is True and d.get('acceptance') == 'PASS'
            if declared_pass and (not checks or not all(v is True for v in checks.values()) or d.get('syntheticEventsUsed') is not False):
                raise ValueError(f'Contradictory PASS in {ref}')
            failed = [key for key, value in checks.items() if value is not True]
            shown = (d.get('shown') or {}).get('status') or {}
            summaries.append(f"{d['attemptId']}: {d.get('acceptance')}; hiddenMs={d.get('actualHiddenMs')}; "
                             f"shownTick={shown.get('tick')}; shownPaused={shown.get('paused')}; failedChecks={failed}")
            results.append(d)
        status = '未执行' if not results else 'PASS' if all(d.get('pass') is True for d in results) else 'FAIL'
        row.update(status=status, attemptId=' / '.join(d['attemptId'] for d in results) or f'{cid}-NOT-RUN',
                   preconditions=f'同一{args.build_id}；Chrome真实标签切换，撤销Playwright原始会话焦点覆盖；无合成生命周期事件',
                   expected=expected[cid], actual='；'.join(summaries) or '尚未完成实际运行。',
                   evidenceFiles=';'.join(refs), blockedReason='' if results else '实际用例未完成。',
                   issueId='LIFE-BOOT-RESUME-01' if status == 'FAIL' and cid == 'LIFE-08' else 'NONE')
        step = root / row['stepsFile']
        step.write_text(f"# {cid}\n\n- 候选：{args.build_id}\n- 状态：{status}\n- 操作与判据：{expected[cid]}\n"
                        f"- 实际：{row['actual']}\n- 原始输出：{row['evidenceFiles']}\n", encoding='utf-8')
        selected[cid] = {'status': status, 'attemptIds': [d['attemptId'] for d in results],
                         'rawFiles': [{'path': ref, 'sha256': hashlib.sha256((root/ref).read_bytes()).hexdigest()} for ref in refs]}
    with (root / 'cases.csv').open('w', encoding='utf-8-sig', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=columns)
        writer.writeheader()
        writer.writerows(rows)
    counts = {status: sum(row['status'] == status for row in rows) for status in ('PASS', 'FAIL', '未执行', '不适用')}
    summary = {'buildId': args.build_id, 'counts': counts, 'selected': selected,
               'note': 'Lifecycle row status is derived from preserved raw runs. This tool does not grant phase approval.'}
    (root / 'lifecycle/diagnosis-summary.json').write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding='utf-8')
    index_path = root / 'attempts/index.csv'
    with index_path.open(encoding='utf-8-sig', newline='') as f:
        reader = csv.DictReader(f)
        index_columns, index_rows = reader.fieldnames, list(reader)
    known = {row['resultFile'] for row in index_rows}
    for path in sorted((root/'attempts').glob('*-PRIMARY-*/result.json')):
        ref = path.relative_to(root).as_posix()
        if ref in known:
            continue
        d = load(path)
        state = 'PASS' if d.get('pass') is True else 'TOOL_SETUP_FAIL' if d.get('error') else 'FAIL'
        index_rows.append(dict(attemptId=d.get('attemptId'), caseId=d.get('caseId'), buildId=d.get('buildId'),
                               attemptState=state, resultFile=ref,
                               detail=d.get('error') or str({k: v for k, v in d.get('checks', {}).items() if v is not True})))
    with index_path.open('w', encoding='utf-8-sig', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=index_columns)
        writer.writeheader()
        writer.writerows(index_rows)
    print(json.dumps({'buildId': args.build_id, 'rows': len(rows), 'counts': counts}, ensure_ascii=True))


if __name__ == '__main__':
    main()
