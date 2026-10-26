"""Validate the design package; optionally build local reading copies.

Uses Python's standard library. This does not run a game or validate gameplay.
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import html
import json
import math
from pathlib import Path
import re
from urllib.parse import unquote, urlsplit
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"


def inline(text: str) -> str:
    value = html.escape(text, quote=True)
    value = re.sub(r"`([^`]+)`", r"<code>\1</code>", value)
    value = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", value)
    def link(match: re.Match) -> str:
        label, target = match.groups()
        target = html.unescape(target)
        scheme = urlsplit(target).scheme
        if scheme and scheme not in {"https", "http", "mailto"}:
            return label
        return f'<a href="{html.escape(target, quote=True)}">{label}</a>'
    return re.sub(r"\[([^\]]+)\]\(([^)]+)\)", link, value)


def render_markdown(text: str, prefix: str) -> str:
    """Small renderer for the documented subset used by these authored files."""
    lines = text.splitlines()
    out: list[str] = []
    i = 0
    while i < len(lines):
        line = lines[i]
        if line.startswith("```"):
            body = []
            i += 1
            while i < len(lines) and not lines[i].startswith("```"):
                body.append(lines[i])
                i += 1
            out.append("<pre><code>" + html.escape("\n".join(body)) + "</code></pre>")
        elif re.match(r"^#{1,6} ", line):
            match = re.match(r"^(#{1,6}) (.+)$", line)
            assert match
            depth = min(len(match[1]) + 1, 6)
            heading_id = prefix + "-h" + str(i)
            out.append(f'<h{depth} id="{heading_id}">{inline(match[2])}</h{depth}>')
        elif line.startswith("|"):
            rows = []
            while i < len(lines) and lines[i].startswith("|"):
                row = [cell.strip() for cell in lines[i].strip().strip("|").split("|")]
                if not all(re.fullmatch(r":?-+:?", cell.replace(" ", "")) for cell in row):
                    rows.append(row)
                i += 1
            out.append('<div class="table-wrap"><table>')
            for n, row in enumerate(rows):
                cell_tag = "th" if n == 0 else "td"
                out.append("<tr>" + "".join(f"<{cell_tag}>{inline(c)}</{cell_tag}>" for c in row) + "</tr>")
            out.append("</table></div>")
            continue
        elif line.startswith("- "):
            out.append('<p class="bullet">• ' + inline(line[2:]) + "</p>")
        elif line.startswith("> "):
            out.append("<blockquote>" + inline(line[2:]) + "</blockquote>")
        elif line.strip():
            out.append("<p>" + inline(line) + "</p>")
        i += 1
    return "\n".join(out)


def build_copies() -> list[str]:
    files = sorted(DOCS.glob("[0-9][0-9]-*.md"))
    intro = "# 奶茶挤挤 · 完整策划总案\n\n交接版本 v0.2，玩法参数design-v0.1。游戏尚未实现；本文件由分册生成，请修改分册后再生成。\n\n"
    sections = []
    nav = []
    merged = [intro]
    for file in files:
        text = file.read_text(encoding="utf-8")
        title = text.splitlines()[0].lstrip("# ")
        ident = "d" + file.name[:2]
        nav.append(f'<a href="#{ident}">{html.escape(file.name[:2] + " · " + title)}</a>')
        merged.append("\n---\n\n" + text)
        sections.append(f'<section id="{ident}">{render_markdown(text, ident)}</section>')
    (DOCS / "complete-design.md").write_text("".join(merged), encoding="utf-8", newline="\n")
    style = """
    :root{color-scheme:light;--ink:#3d2a23;--brand:#8b4e2f;--paper:#fffaf3;--line:#e8d9c7}
    *{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.8 'Microsoft YaHei',sans-serif}
    nav{position:fixed;inset:0 auto 0 0;width:270px;padding:26px 16px;overflow:auto;background:#f3e9db;border-right:1px solid var(--line)}
    nav strong{display:block;margin:0 10px 16px;font-size:22px}nav a{display:block;font-size:13px;padding:8px 10px;text-decoration:none;border-radius:8px}
    a{color:var(--brand)}a:hover{background:#ead6be}main{max-width:1250px;margin-left:270px;padding:42px 5vw 90px}
    header{padding-bottom:30px;border-bottom:2px solid var(--brand)}h1{font-size:38px;margin:0}h2{font-size:29px;margin:0 0 24px}h3{font-size:21px;margin-top:32px}
    .status{display:inline-block;background:#f0dfc5;border-radius:8px;padding:4px 12px;font-size:13px}section{padding:42px 0;border-bottom:1px solid var(--line);scroll-margin-top:20px}
    p{margin:12px 0}.bullet{padding-left:12px}code{font:13px/1.6 Consolas,monospace;background:#f1e7da;padding:2px 5px;border-radius:4px}
    pre{overflow:auto;padding:20px;background:#f1e7da;border-radius:10px;line-height:1.6}pre code{padding:0;background:none}
    .table-wrap{overflow-x:auto;margin:18px 0}table{border-collapse:collapse;min-width:620px;width:100%;font-size:14px}
    th,td{border:1px solid var(--line);padding:10px 12px;text-align:left;vertical-align:top}th{background:#f0e1ce}tr:nth-child(even){background:#fffdf9}
    blockquote{border-left:4px solid var(--brand);margin:20px 0;padding:8px 20px;background:#f6eddf}.wireframe{display:block;max-width:360px;width:100%;margin:24px auto;border:1px solid var(--line)}
    @media(max-width:980px){nav{position:static;width:auto;max-height:260px}main{margin:0;padding:26px 20px}h1{font-size:30px}}
    @media print{nav{display:none}main{margin:0;padding:0}section{break-before:page}body{font-size:11px}.table-wrap{overflow:visible}table{min-width:0;font-size:10px}a{color:inherit;text-decoration:none}}
    """
    page = f'''<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="data:,"><title>奶茶挤挤 · 项目策划总案</title><style>{style}</style></head><body>
    <nav aria-label="分册目录"><strong>奶茶挤挤</strong>{''.join(nav)}</nav><main><header><span class="status">设计基线 v0.1 · 游戏尚未实现</span><h1>奶茶挤挤 · 项目策划总案</h1><p>完整需求、物理、美术动画、音频、技术、延期功能与验证计划。数字为待测初值。</p><p><a href="../README.md">项目入口</a> · <a href="complete-design.md">Markdown总案</a></p></header>
    <img class="wireframe" src="visuals/layout-wireframe.svg" alt="主界面区域规格线框，不是最终美术">{''.join(sections)}</main></body></html>'''
    (DOCS / "complete-design.html").write_text(page, encoding="utf-8", newline="\n")
    return [str(DOCS / "complete-design.md"), str(DOCS / "complete-design.html")]


def validate() -> dict:
    errors: list[str] = []
    authored = [ROOT / "README.md", ROOT / "AGENTS.md", ROOT / "research/README.md", ROOT / "THIRD_PARTY_NOTICES.md"] + list(DOCS.rglob("*.md"))
    links = 0
    for file in authored:
        text = file.read_text(encoding="utf-8")
        if "\ufffd" in text or "\x00" in text:
            errors.append(f"Invalid text character: {file}")
        if len(re.findall(r"^```", text, re.M)) % 2:
            errors.append(f"Unclosed fence: {file}")
        for target in re.findall(r"!?\[[^\]]*\]\(([^)]+)\)", text):
            target = html.unescape(target.strip().strip("<>"))
            if urlsplit(target).scheme or target.startswith("#"):
                continue
            path = unquote(target.split("#", 1)[0])
            if not path:
                continue
            links += 1
            if not (file.parent / path).resolve().exists():
                errors.append(f"Broken local link: {file.name} -> {target}")
    cfg = json.loads((ROOT / "config/design-baseline.json").read_text(encoding="utf-8"))
    ing = cfg["ingredients"]
    assert len(ing) == 9
    assert [x["level"] for x in ing] == list(range(1, 10))
    assert len({x["id"] for x in ing}) == 9
    assert sum(x["weight"] for x in cfg["drop"]["spawn_levels"]) == 100
    assert all(x["units"] == 2 ** (x["level"] - 1) for x in ing)
    ratios = []
    for old, new in zip(ing, ing[1:]):
        assert old["radius_du"] < new["radius_du"] < math.sqrt(2) * old["radius_du"]
        ratios.append(1 - new["radius_du"] ** 2 / (2 * old["radius_du"] ** 2))
    score = 0
    for item in ing[1:]:
        score = 2 * score + item["merge_score"]
    assert score == 9680
    assert 2 * ing[1]["merge_score"] + ing[2]["merge_score"] == 50
    stages = cfg["stages"]
    assert len(stages) == 5 and stages[0]["unlock_previous"] is None
    for old, new in zip(stages, stages[1:]):
        assert new["unlock_previous"] == old["id"]
        assert new["cup_width_scale"] < old["cup_width_scale"]
        assert new["unlock_score"] > old["unlock_score"]
    assert cfg["cup"]["bottom_width_du"] * stages[-1]["cup_width_scale"] > 2 * ing[-1]["radius_du"]
    assert cfg["shake"]["base_per_run"] == 2
    assert cfg["shake"]["extra_max_per_run"] == cfg["reward"]["daily_grant_limit"] == 5
    assert cfg["budgets"]["gate"] is False
    assert cfg["product"]["prototype_ads"] is False
    assert cfg["physics"]["fixed_hz"] == 60
    for filename in ["asset-manifest.csv", "audio-manifest.csv"]:
        with (ROOT / "assets" / filename).open(encoding="utf-8", newline="") as handle:
            rows = list(csv.DictReader(handle))
        assert rows and all(None not in r for r in rows)
        assert all(r["status"] in {"planned", "deferred"} for r in rows)
    requirements_text = (DOCS / "01-requirements.md").read_text(encoding="utf-8")
    ids = re.findall(r"^\| (FR-\d+) \|", requirements_text, re.M)
    assert ids == [f"FR-{n:02}" for n in range(1, 31)]
    backlog = (DOCS / "08-backlog-roadmap.md").read_text(encoding="utf-8")
    for number in range(15, 31):
        assert f"FR-{number:02}" in backlog, f"Deferred FR-{number:02} missing from backlog"
    ET.parse(DOCS / "visuals/layout-wireframe.svg")
    manifest = json.loads((ROOT / "research/skills-manifest.json").read_text(encoding="utf-8"))
    skill_count = 0
    for source in manifest["files"]:
        path = ROOT / source["local_path"]
        raw = path.read_bytes()
        actual = hashlib.sha1(b"blob " + str(len(raw)).encode() + b"\0" + raw).hexdigest()
        if actual != source["blob_sha"]:
            errors.append(f"Source snapshot content differs: {source['local_path']}")
        source["snapshot_sha256"] = hashlib.sha256(raw).hexdigest()
        if source["path"].endswith("SKILL.md"):
            skill_count += 1
    assert skill_count == 13
    if not errors:
        (ROOT / "research/skills-manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
    return {"status": "pass" if not errors else "fail", "authored_markdown_files": len(authored), "local_links_checked": links,
            "skills_read_and_snapshotted": skill_count, "snapshot_files": len(manifest["files"]),
            "ingredients": len(ing), "stages": len(stages), "requirements": len(ids),
            "merge_area_release_percent_range": [round(min(ratios)*100, 2), round(max(ratios)*100, 2)],
            "full_level_one_to_mochi_score": score, "errors": errors,
            "not_run": ["game_implementation", "physics_integration", "engine_build", "device_performance", "game_art_visual_review", "audio_listening", "human_playtest", "platform_review"]}


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--build", action="store_true")
    args = parser.parse_args()
    if args.build:
        build_copies()
        from validate_handoff import build_handbook
        build_handbook()
    report = validate()
    from validate_handoff import extended_checks
    try:
        report.update(extended_checks())
    except (AssertionError, KeyError, ValueError, FileNotFoundError) as exc:
        report['status'] = 'fail'
        report['errors'].append('Handoff validation: ' + repr(exc))
    output = ROOT / "research/document-validation.json"
    output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
    print(json.dumps(report, ensure_ascii=False, indent=2))
    raise SystemExit(0 if report["status"] == "pass" else 1)
