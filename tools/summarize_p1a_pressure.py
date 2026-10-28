#!/usr/bin/env python3
"""Derive phase-filtered pressure CSVs from immutable P1-A attempt JSON files."""
from __future__ import annotations

import argparse
import csv
import json
import math
from pathlib import Path
from statistics import median
from typing import Any


def percentile(values: list[float], q: float) -> float | None:
    if not values:
        return None
    ordered = sorted(values)
    pos = (len(ordered) - 1) * q
    lo = math.floor(pos)
    hi = math.ceil(pos)
    return ordered[lo] + (ordered[hi] - ordered[lo]) * (pos - lo)


def write_csv(path: Path, fields: list[str], rows: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8-sig", newline="") as stream:
        writer = csv.DictWriter(stream, fieldnames=fields, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--evidence-dir", required=True, type=Path)
    parser.add_argument("--build-id", required=True)
    args = parser.parse_args()
    evidence = args.evidence_dir.resolve()
    attempts = evidence / "attempts"
    if not attempts.is_dir():
        raise SystemExit(f"attempt directory missing: {attempts}")

    frame_rows: list[dict[str, Any]] = []
    summaries: list[dict[str, Any]] = []
    results = sorted(attempts.glob("*.result.json"))
    for result_path in results:
        result = json.loads(result_path.read_text(encoding="utf-8-sig"))
        if not str(result.get("caseId", "")).startswith("pressure-"):
            continue
        if result.get("buildId") != args.build_id or result.get("expectedBuildId") != args.build_id:
            continue
        attempt_id = result.get("attemptId", result_path.name.removesuffix(".result.json"))
        probe = result.get("probe") or {}
        metadata = probe.get("metadata") or {}
        layout = result.get("layout")
        mode = metadata.get("mode", result.get("probeMode", "UNKNOWN"))
        frames = probe.get("frames") or []

        if frames:
            for index, frame in enumerate(frames):
                frame_rows.append({"buildId": args.build_id, "attemptId": attempt_id, "layout": layout,
                    "probeMode": mode, "phase": frame.get("phase"), "frameIndex": index,
                    "wallMs": frame.get("wallMs"), "wallGapMs": frame.get("wallGapMs"),
                    "engineDtMs": frame.get("engineDtMs"), "steps": frame.get("steps"),
                    "tickBefore": frame.get("tickBefore"), "tickAfter": frame.get("tickAfter"),
                    "adapterMs": frame.get("adapterMs"), "viewMs": frame.get("viewMs"),
                    "labUpdateMs": frame.get("labUpdateMs"), "probeFrameMs": frame.get("probeFrameMs"),
                    "visible": frame.get("visible"), "hasFocus": frame.get("hasFocus"),
                    "pauseReasonMask": frame.get("pauseReasonMask")})
            observed = [f for f in frames if f.get("phase") == 2 and f.get("pauseReasonMask") == 0]
            scope = "OBSERVE frames; excludes setup, warmup, paused and failure frames"
        else:
            observed = []
            external = result.get("externalFrames") or {}
            for index, frame in enumerate(external.get("frames") or []):
                frame_rows.append({"buildId": args.build_id, "attemptId": attempt_id, "layout": layout,
                    "probeMode": mode, "phase": "P0_ACTIVE", "frameIndex": index,
                    "wallMs": frame[0] if len(frame) > 0 else None,
                    "wallGapMs": frame[1] if len(frame) > 1 else None})
            scope = "external requestAnimationFrame over complete P0 active run; no app probe timings"

        def values(key: str) -> list[float]:
            return [float(frame[key]) for frame in observed if isinstance(frame.get(key), (int, float))]

        summary: dict[str, Any] = {"buildId": args.build_id, "attemptId": attempt_id,
            "caseId": result.get("caseId"), "layout": layout, "probeMode": mode,
            "acceptance": result.get("acceptance"), "pass": result.get("pass"),
            "phaseScope": scope, "frameSamples": len(observed) if frames else len((result.get("externalFrames") or {}).get("frames") or []),
            "wallDurationMs": result.get("wallDurationMs"), "tick": (result.get("status") or {}).get("tick"),
            "stepCount": (result.get("status") or {}).get("stepCount"),
            "entityCount": (result.get("status") or {}).get("entityCount"),
            "paused": (result.get("status") or {}).get("paused"),
            "warmupSteps": (probe.get("coverage") or {}).get("warmupSteps"),
            "observeSteps": (probe.get("coverage") or {}).get("observeSteps"),
            "observeActiveMs": (probe.get("coverage") or {}).get("activeObserveMs"),
            "stepGaps": (probe.get("coverage") or {}).get("stepGaps"),
            "frameOverflow": (probe.get("coverage") or {}).get("frameOverflow"),
            "anomaly": (probe.get("anomaly") or {}).get("reason") if probe.get("anomaly") else None,
            "minMargins": json.dumps(probe.get("summary", {}).get("minMargins"), separators=(",", ":")) if probe.get("summary") else None,
            "negativeMarginTicks": json.dumps(probe.get("summary", {}).get("negativeMarginTicks"), separators=(",", ":")) if probe.get("summary") else None,
            "legacyStepRecords": (probe.get("legacySummary") or {}).get("stepRecords"),
            "legacyBodyRecords": (probe.get("legacySummary") or {}).get("bodyRecords"),
            "legacyProbeStepP95Ms": ((probe.get("legacySummary") or {}).get("probeStepMs") or {}).get("p95"),
            "legacyProbeStepP99Ms": ((probe.get("legacySummary") or {}).get("probeStepMs") or {}).get("p99"),
            "legacyProbeStepMaxMs": ((probe.get("legacySummary") or {}).get("probeStepMs") or {}).get("max"),
            "recentStepSampleCount": len(probe.get("recentSteps") or [])}
        for key in ("wallGapMs", "engineDtMs", "steps", "adapterMs", "viewMs", "labUpdateMs", "probeFrameMs"):
            sample = values(key)
            summary[f"{key}SampleCount"] = len(sample)
            summary[f"{key}P50"] = percentile(sample, .50)
            summary[f"{key}P95"] = percentile(sample, .95)
            summary[f"{key}P99"] = percentile(sample, .99)
            summary[f"{key}Max"] = max(sample) if sample else None
        recent = probe.get("recentSteps") or []
        step_times = [float(row[14]) for row in recent if len(row) > 14 and isinstance(row[14], (int, float))]
        summary["recentProbeStepSampleCount"] = len(step_times)
        summary["recentProbeStepP50Ms"] = percentile(step_times, .50)
        summary["recentProbeStepP95Ms"] = percentile(step_times, .95)
        summary["recentProbeStepP99Ms"] = percentile(step_times, .99)
        summary["probeExportMs"] = (probe.get("measurementScopes") or {}).get("probeExportMs")
        summaries.append(summary)

    if not summaries:
        raise SystemExit("no pressure attempt results for selected buildId")
    physics = evidence / "physics"
    frame_fields = ["buildId", "attemptId", "layout", "probeMode", "phase", "frameIndex", "wallMs", "wallGapMs",
        "engineDtMs", "steps", "tickBefore", "tickAfter", "adapterMs", "viewMs", "labUpdateMs", "probeFrameMs",
        "visible", "hasFocus", "pauseReasonMask"]
    write_csv(physics / "frames.csv", frame_fields, frame_rows)
    summary_fields = list(dict.fromkeys(key for row in summaries for key in row))
    write_csv(physics / "pressure-compare.csv", summary_fields, summaries)
    print(json.dumps({"buildId": args.build_id, "attempts": len(summaries), "frameRows": len(frame_rows),
        "pressureCompare": str(physics / "pressure-compare.csv"), "frames": str(physics / "frames.csv")}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
