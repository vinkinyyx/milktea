#!/usr/bin/env python3
"""Read-only structural and exit-gate audit for a single P1-A evidence package."""
from __future__ import annotations
import argparse, csv, hashlib, json, sys
from pathlib import Path

STATUSES = {"PASS", "FAIL", "未执行", "不适用"}
COLUMNS = ["caseId", "status", "buildId", "attemptId", "probeVersion", "environmentId", "preconditions", "stepsFile", "expected", "actual", "evidenceFiles", "blockedReason", "issueId"]
REQUIRED = {"VER-01", "GEO-01", "GEO-02", "CLK-01", "CLK-02", "CLK-03", "CLK-04", "COL-01", "COL-02", "COL-03", "COL-04", "COL-05", "COL-06", "COL-07", "COL-08", "REB-01", "REB-02", "REB-03", "REB-04", "STR-01", "STR-02", "STR-03", "STR-04", "NINE-01", "NINE-02", "NINE-03", "NINE-04", "ART-01", "ART-02", "ART-03", "VIEW-01", "LOAD-01", "BLD-01", "BLD-02"}
REQUIRED |= {f"LIFE-{i:02d}" for i in range(1, 11)} | {f"ERR-{i:02d}" for i in range(1, 9)}

def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for block in iter(lambda: f.read(1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()

def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--evidence", required=True, help="Evidence directory for exactly one build")
    parser.add_argument("--build-id", required=True)
    args = parser.parse_args()
    root = Path(args.evidence).resolve()
    errors: list[str] = []
    incomplete: list[str] = []
    required_files = ["acceptance.md", "cases.csv", "issues.md", "environment.json", "source-manifest.json", "build-manifest.json", "creator-exit.json"]
    for name in required_files:
        if not (root / name).is_file(): errors.append(f"missing required file: {name}")
    docs: dict[str, dict] = {}
    for name in ("environment.json", "source-manifest.json", "build-manifest.json", "creator-exit.json"):
        path = root / name
        if path.is_file():
            try: docs[name] = json.loads(path.read_text(encoding="utf-8-sig"))
            except Exception as e: errors.append(f"invalid JSON {name}: {e}")
    for name, data in docs.items():
        if data.get("buildId") != args.build_id and not (name == "environment.json" and data.get("requestedBuildId") == args.build_id):
            errors.append(f"{name} buildId does not match {args.build_id}")
    rows: list[dict[str, str]] = []
    if (root / "cases.csv").is_file():
        try:
            with (root / "cases.csv").open(encoding="utf-8-sig", newline="") as f:
                reader = csv.DictReader(f)
                if reader.fieldnames != COLUMNS: errors.append(f"cases.csv columns differ from contract: {reader.fieldnames}")
                rows = list(reader)
        except Exception as e: errors.append(f"cannot parse cases.csv: {e}")
    seen: set[tuple[str,str]] = set()
    statuses: dict[str, list[str]] = {}
    for n, row in enumerate(rows, start=2):
        cid, aid = row.get("caseId", ""), row.get("attemptId", "")
        if not cid or not aid: errors.append(f"row {n}: caseId/attemptId is empty")
        if (cid, aid) in seen: errors.append(f"row {n}: duplicate caseId+attemptId {cid}/{aid}")
        seen.add((cid, aid)); statuses.setdefault(cid, []).append(row.get("status", ""))
        if row.get("status") not in STATUSES: errors.append(f"row {n}: invalid status {row.get('status')!r}")
        if row.get("buildId") != args.build_id: errors.append(f"row {n}: buildId mismatch")
        for field in ("probeVersion", "environmentId", "preconditions", "stepsFile", "expected", "actual", "issueId"):
            if not row.get(field, "").strip(): errors.append(f"row {n}: required field {field} is empty")
        if row.get("status") == "未执行" and not row.get("blockedReason", "").strip(): errors.append(f"row {n}: unexecuted case has no reason")
        if row.get("status") in {"PASS", "FAIL"} and row.get("blockedReason", "").strip(): errors.append(f"row {n}: executed result also has blockedReason")
        refs = [p.strip() for p in row.get("evidenceFiles", "").split(";") if p.strip()]
        if row.get("status") in {"PASS", "FAIL"} and not refs: errors.append(f"row {n}: executed result has no evidenceFiles")
        for ref in refs:
            target = (root / ref).resolve()
            if root not in target.parents and target != root: errors.append(f"row {n}: evidence path escapes package: {ref}")
            elif not target.is_file(): errors.append(f"row {n}: missing evidence file: {ref}")
        if cid.startswith('LIFE-') and row.get('status') in {'PASS', 'FAIL'}:
            runs = []
            for ref in refs:
                target = (root/ref).resolve()
                if root not in target.parents or not target.is_file() or target.suffix != '.json': continue
                try: run = json.loads(target.read_text(encoding='utf-8-sig'))
                except Exception: continue
                if str(run.get('caseId', '')).startswith(cid): runs.append(run)
            if not runs: errors.append(f"row {n}: lifecycle case lacks matching raw case result")
            if cid == 'LIFE-09' and row.get('status') == 'PASS' and {r.get('caseId') for r in runs} != {'LIFE-09-QUEUE', 'LIFE-09-REBUILD'}:
                errors.append(f"row {n}: LIFE-09 must cover both queue and rebuild")
            for run in runs:
                if run.get('buildId') != args.build_id: errors.append(f"row {n}: lifecycle raw build mismatch")
                if row.get('status') != 'PASS': continue
                checks = run.get('checks', {})
                if run.get('pass') is not True or not checks or not all(v is True for v in checks.values()):
                    errors.append(f"row {n}: lifecycle PASS contradicts raw assertions")
                if run.get('syntheticEventsUsed') is not False: errors.append(f"row {n}: lifecycle PASS does not exclude synthetic events")
                if cid == 'LIFE-10':
                    if checks.get('backlogProtected') is not True or checks.get('foreground') is not True:
                        errors.append(f"row {n}: foreground backlog guard was not observed")
                    continue
                required = ('trustedHidden', 'engineHide', 'continuousHidden', 'frozenWhileHidden', 'trustedShown', 'engineShow', 'showStillPaused', 'explicitResumeAdvances')
                if any(checks.get(key) is not True for key in required): errors.append(f"row {n}: real lifecycle assertions incomplete")
                interval = (run.get('hiddenStart', {}).get('atMs', 0), run.get('hiddenEnd', {}).get('atMs', 0))
                events = run.get('events', [])
                if not any(e.get('trusted') is True and e.get('visibility') == 'hidden' for e in events): errors.append(f"row {n}: no trusted hidden event")
                if not any(e.get('trusted') is True and e.get('visibility') == 'visible' for e in events): errors.append(f"row {n}: no trusted shown event")
                if any(e.get('visibility') == 'visible' and interval[0] < e.get('atMs', 0) < interval[1] for e in events):
                    errors.append(f"row {n}: continuous hidden interval contains a visible event")
                minimum = 300000 if cid == 'LIFE-03' else 60000 if cid == 'LIFE-02' else 5000
                if run.get('actualHiddenMs', 0) < minimum: errors.append(f"row {n}: actual hidden duration below {minimum}ms")
    present = set(statuses)
    for cid in sorted(REQUIRED - present): incomplete.append(f"missing case row: {cid}")
    failed = sorted(cid for cid, vals in statuses.items() if "FAIL" in vals)
    not_run = sorted(cid for cid, vals in statuses.items() if "未执行" in vals)
    not_applicable = sorted(cid for cid, vals in statuses.items() if all(v == "不适用" for v in vals))
    exit_data = docs.get("creator-exit.json", {})
    if exit_data:
        if exit_data.get("exitCode") != 36: errors.append(f"Creator exit code is {exit_data.get('exitCode')!r}, expected actual 36")
        out = Path(exit_data.get("outputPath", ""))
        if not out.is_dir(): errors.append(f"build output directory missing: {out}")
        manifest = docs.get("build-manifest.json", {})
        if manifest.get("buildId") != args.build_id: errors.append("build-manifest identity mismatch")
        if out.is_dir():
            for item in manifest.get("files", []):
                p = out / item.get("path", "")
                if not p.is_file(): errors.append(f"build manifest file missing: {item.get('path')}")
                elif sha256(p) != item.get("sha256"): errors.append(f"build hash mismatch: {item.get('path')}")
    if errors:
        verdict = "INVALID_EVIDENCE"
        code = 1
    elif incomplete or failed or not_run:
        verdict = "EVIDENCE_CONSISTENT_EXIT_NOT_MET"
        code = 2
    elif any(all(v == "不适用" for v in statuses.get(cid, [])) for cid in REQUIRED):
        verdict = "EVIDENCE_CONSISTENT_EXIT_NOT_MET"
        incomplete.append("required case marked not applicable without phase-boundary approval")
        code = 2
    else:
        verdict = "EVIDENCE_CONSISTENT_EXIT_REVIEW_REQUIRED"
        code = 0
    report = {"schemaVersion": 1, "buildId": args.build_id, "evidencePath": str(root), "verdict": verdict,
              "caseRows": len(rows), "requiredCaseRows": len(REQUIRED), "missing": incomplete, "failedCaseIds": failed,
              "unexecutedCaseIds": not_run, "notApplicableCaseIds": not_applicable, "errors": errors,
              "note": "This audit checks consistency only and never creates or upgrades a PASS."}
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return code

if __name__ == "__main__": sys.exit(main())
