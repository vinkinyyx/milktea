#!/usr/bin/env python3
"""Derive corrected side margins from immutable P1-A legacy probe output."""
from __future__ import annotations

import csv
import hashlib
import json
import math
import sys
from pathlib import Path


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def main() -> int:
    if len(sys.argv) != 3:
        raise SystemExit("usage: python tools/derive_p1a_legacy_geometry.py <source.json> <output-dir>")
    source = Path(sys.argv[1]).resolve()
    output = Path(sys.argv[2]).resolve()
    output.mkdir(parents=True, exist_ok=True)
    data = json.loads(source.read_text(encoding="utf-8"))
    target = output / "continuous-three-corrected.csv"
    rows = 0
    corrected = {"left": 0, "right": 0}
    side_summary = {side: {"minOverall": None, "minAfterTick600": None, "negativeAfterTick600": 0} for side in ("left", "right")}
    with target.open("w", encoding="utf-8-sig", newline="") as stream:
        writer = csv.DictWriter(stream, fieldnames=["tick", "entity_id", "x_du", "y_du", "radius_du",
            "bottom_margin_du", "left_raw_du", "left_corrected_du", "right_raw_du", "right_corrected_du"])
        writer.writeheader()
        for sample in data.get("samples", []):
            for body in sample.get("entities", []):
                values = {side: body.get(side) for side in ("left", "right")}
                fixed: dict[str, float | str] = {}
                for side, raw in values.items():
                    if isinstance(raw, (int, float)) and math.isfinite(raw):
                        fixed[side] = -float(raw) - 2.0 * float(body["r"])
                        corrected[side] += 1
                        margin = fixed[side]
                        current = side_summary[side]["minOverall"]
                        side_summary[side]["minOverall"] = margin if current is None else min(current, margin)
                        if int(sample.get("tick", 0)) >= 600:
                            current = side_summary[side]["minAfterTick600"]
                            side_summary[side]["minAfterTick600"] = margin if current is None else min(current, margin)
                            if margin < 0:
                                side_summary[side]["negativeAfterTick600"] += 1
                    else:
                        fixed[side] = ""
                writer.writerow({"tick": sample.get("tick"), "entity_id": body.get("id"), "x_du": body.get("x"),
                    "y_du": body.get("y"), "radius_du": body.get("r"), "bottom_margin_du": body.get("bottom"),
                    "left_raw_du": values["left"] if values["left"] is not None else "",
                    "left_corrected_du": fixed["left"], "right_raw_du": values["right"] if values["right"] is not None else "",
                    "right_corrected_du": fixed["right"]})
                rows += 1
    meta = {"schemaVersion": 1, "sourcePath": str(source), "sourceSha256": sha256(source),
        "sourceBuildId": "historical-20261028-closeout", "sourceFile": source.name,
        "outputFile": target.name, "outputSha256": sha256(target), "scriptPath": str(Path(__file__).resolve()),
        "scriptSha256": sha256(Path(__file__).resolve()), "formulaVersion": "legacy-side-sign-correction-v1",
        "formula": "corrected = -raw - 2*radius_du; applied only to finite legacy side margins whose stored normal sign was reversed",
        "rows": rows, "correctedRows": corrected, "sideSummary": side_summary, "sourceModified": False}
    (output / "derivation.json").write_text(json.dumps(meta, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"status": "PASS", "rows": rows, "correctedRows": corrected,
        "sourceSha256": meta["sourceSha256"], "output": str(target)}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
