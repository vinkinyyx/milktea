"""Build a local TapTap minigame ZIP using the installed Creator extension."""
from pathlib import Path
import argparse, hashlib, json, os, re, shutil, subprocess, sys, datetime, zipfile

ROOT = Path(__file__).resolve().parents[1]
CREATOR = Path(r"C:\ProgramData\cocos\editors\Creator\3.8.8\CocosCreator.exe")
IGNORED = {"library", "temp", "build", "local", ".git", "evidence", "profiles", ".creator"}


def save(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def manifest(project):
    files = [p for folder in ("assets", "settings") for p in (project / folder).rglob("*") if p.is_file()]
    files += [project / "package.json", project / "tsconfig.json"]
    return {p.relative_to(project).as_posix(): hashlib.sha256(p.read_bytes()).hexdigest() for p in files}


BOOTSTRAP_PLATFORM_OLD = "sysInfo.platform.toLocaleLowerCase() === 'android'"
BOOTSTRAP_PLATFORM_NEW = "String((sysInfo && sysInfo.platform) || '').toLowerCase() === 'android'"


def patch_tap_game_js(package: Path, unpacked: Path) -> dict:
    """Make the converted Tap bootstrap survive hosts without fetch/GameGlobal/platform.

    The Tap converter prepends wx_unity.js, which used to throw before the engine booted; the host then
    only showed its launch cover. This patch is deterministic and verified before the package is kept.
    """
    patched = unpacked.read_text(encoding="utf-8")
    if "throw new Error('fetch is not defined')" in patched:
        raise ValueError("Tap bootstrap still contains the fatal fetch guard")
    if BOOTSTRAP_PLATFORM_OLD not in patched:
        raise ValueError("Tap bootstrap platform check not found")
    patched = patched.replace(BOOTSTRAP_PLATFORM_OLD, BOOTSTRAP_PLATFORM_NEW)
    unpacked.write_text(patched, encoding="utf-8")
    tmp = package.with_name("game.patched.zip")
    with zipfile.ZipFile(package) as source, zipfile.ZipFile(tmp, "w", zipfile.ZIP_DEFLATED) as target:
        for item in source.infolist():
            data = patched.encode("utf-8") if item.filename == "game.js" else source.read(item.filename)
            target.writestr(item, data)
    tmp.replace(package)
    return {"bootstrapFatalFetchGuardRemoved": True, "bootstrapPlatformGuardAdded": True}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--build-id", required=True)
    platform = json.loads((ROOT / "config/taptap-minigame.json").read_text(encoding="utf-8-sig"))
    parser.add_argument("--app-id", default=platform["miniAppId"], help="Defaults to this game MiniApp ID in config/taptap-minigame.json")
    parser.add_argument("--version", default="0.0.1")
    parser.add_argument("--evidence-dir", help="Evidence directory relative to project root")
    args = parser.parse_args()
    if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9._-]*", args.build_id):
        parser.error("build-id must be an ASCII directory name")
    if not re.fullmatch(r"[0-9]+\.[0-9]+\.[0-9]+", args.version):
        parser.error("version must have three numeric components")
    project = ROOT / ROOT.name
    artifacts = ROOT / "build-artifacts"
    staged = artifacts / "cocos-p1b-build-source" / args.build_id
    output = artifacts / "cocos-taptap-minigame-build" / args.build_id
    evidence = ROOT / args.evidence_dir if args.evidence_dir else ROOT / "evidence/TapTap" / args.build_id
    for path in (staged, output, evidence):
        if path.exists():
            raise FileExistsError(f"Preserve existing candidate and choose a new build-id: {path}")
    if not CREATOR.is_file():
        raise FileNotFoundError(CREATOR)
    extension = project / "extensions/taptap-minigame-tools/package.json"
    if json.loads(extension.read_text(encoding="utf-8"))["version"] != "1.2.2":
        raise ValueError("Expected the inspected Tap minigame extension 1.2.2")
    evidence.mkdir(parents=True)
    output.mkdir(parents=True)
    before = manifest(project)
    save(evidence / "source-manifest.json", before)
    record = {"buildId": args.build_id, "startedAt": datetime.datetime.now().astimezone().isoformat(),
              "originalProject": str(project), "stagedProject": str(staged), "output": str(output),
              "appIdProvided": bool(args.app_id), "miniAppId": args.app_id, "gameId": platform["gameId"], "runtimeVerified": False, "status": "STARTED",
              "sourceManifestCount": len(before),
              "sourceManifestSha256": hashlib.sha256(json.dumps(before, ensure_ascii=False, sort_keys=True).encode("utf-8")).hexdigest(),
              "tools": {"python": sys.version.split()[0], "node": subprocess.run(["node.exe", "--version"], capture_output=True, text=True).stdout.strip(),
                        "creator": str(CREATOR), "tapExtension": "1.2.2"}}

    def run(name, command, env=None):
        save(evidence / (name + "-command.json"), {"command": command, "cwd": str(staged)})
        with (evidence / (name + ".log")).open("w", encoding="utf-8") as log:
            code = subprocess.run(command, cwd=staged, env=env, stdout=log, stderr=subprocess.STDOUT).returncode
        record[name + "ExitCode"] = code
        if code != 0:
            raise RuntimeError(f"{name} failed with exit {code}; see {evidence / (name + '.log')}")
        return (evidence / (name + ".log")).read_text(encoding="utf-8")

    try:
        shutil.copytree(project, staged, ignore=shutil.ignore_patterns(*IGNORED))
        if manifest(staged) != before:
            raise ValueError("Source copy does not match original")
        runtime = staged / "assets/scripts/core/AppRuntime.ts"
        text, count = re.subn(r"static readonly buildId = '[^']+';", f"static readonly buildId = '{args.build_id}';", runtime.read_text(encoding="utf-8"))
        if count != 1:
            raise ValueError("Expected exactly one build identity")
        runtime.write_text(text, encoding="utf-8")
        run("release-assets", [sys.executable, str(ROOT / "tools/prepare_p1c_release_assets.py"), "--project", str(staged), "--evidence-dir", str(evidence)])
        run("release-code", ["node.exe", str(ROOT / "tools/strip_p1c_release_debug.cjs"), str(staged), str(evidence / "release-code-staging.json")])
        tsc = staged / "node_modules/typescript/bin/tsc"
        run("typecheck", ["node.exe", str(tsc), "--project", str(staged / "tsconfig.json")])
        # Hard gate: the UTF-8/SHA path must survive every host TextEncoder shape. Verify the isolated
        # staging copy (the exact packaging input), and never start Creator when it fails.
        gate_project = str(staged)
        try:
            gate_log = run("host-utf8-gate", ["node.exe", str(ROOT / "tools/verify_host_utf8.cjs"), "--project", gate_project])
        except Exception as gate_error:
            record["hostUtf8Gate"] = {"project": gate_project, "exitCode": record.get("host-utf8-gateExitCode"),
                                      "status": "FAIL", "log": str(evidence / "host-utf8-gate.log"), "error": str(gate_error)}
            raise
        gate_lines = [line for line in gate_log.splitlines() if line.strip()]
        try:
            gate_summary = json.loads(gate_lines[-1])
        except (IndexError, ValueError) as error:
            record["hostUtf8Gate"] = {"project": gate_project, "exitCode": 0, "status": "FAIL",
                                      "log": str(evidence / "host-utf8-gate.log"), "error": f"no JSON summary: {error}"}
            raise RuntimeError(f"host-utf8-gate produced no JSON summary: {error}") from error
        if gate_summary.get("status") != "PASS":
            record["hostUtf8Gate"] = {"project": gate_project, "exitCode": 0, "status": "FAIL",
                                      "log": str(evidence / "host-utf8-gate.log"), "summary": gate_summary}
            raise RuntimeError(f"host-utf8-gate did not report PASS: {gate_summary}")
        record["hostUtf8Gate"] = {"project": gate_project, "exitCode": 0, "log": str(evidence / "host-utf8-gate.log"), **gate_summary}
        boot = json.loads((staged / "assets/scenes/Boot.scene.meta").read_text(encoding="utf-8-sig"))["uuid"]
        config = {"platform": "wechatgame", "name": "奶茶挤挤", "buildPath": str(output), "outputName": "wechatgame",
                  "debug": False, "sourceMaps": False, "startScene": boot,
                  "scenes": [{"uuid": boot, "url": "db://assets/scenes/Boot.scene"}],
                  "packages": {"wechatgame": {"orientation": "portrait", "appid": ""},
                               "taptap-minigame-tools": {"enableTapConvert": True, "tapAppid": args.app_id,
                                   "gameVersion": args.version, "usePythonScript": False, "deleteWechatBuild": False}}}
        config_path = evidence / "creator-build-config.json"
        save(config_path, config)
        save(evidence / "staged-source-manifest.json", manifest(staged))
        command = [str(CREATOR), "--user-data-dir=" + str(evidence / "creator-user-data"), "--project", str(staged), "--build", "configPath=" + str(config_path)]
        save(evidence / "creator-command.json", {"command": command, "cwd": str(staged), "childEnvironment": {"MILKTEA_DISABLE_EDITOR_BRIDGE": "1"}})
        env = os.environ.copy()
        env["MILKTEA_DISABLE_EDITOR_BRIDGE"] = "1"
        with (evidence / "creator.log").open("w", encoding="utf-8") as log:
            record["creatorExitCode"] = subprocess.run(command, cwd=staged, env=env, stdout=log, stderr=subprocess.STDOUT).returncode
        if record["creatorExitCode"] != 36:
            raise RuntimeError(f"Creator exit {record['creatorExitCode']}; expected installed 3.8.8 BUILD_SUCCESS=36")
        package = output / "TapBuild/game.zip"
        record.update(patch_tap_game_js(package, output / "TapBuild/game/game.js"))
        with zipfile.ZipFile(package) as z:
            if z.testzip() is not None:
                raise ValueError("ZIP integrity failure")
            names = set(z.namelist())
            if not {"game.js", "game.json", "web-adapter.js", "engine-adapter.js"} <= names:
                raise ValueError("Tap package is missing entry files")
            forbidden = ("FakeRewardedAdProvider", "debug-mock", "rewardedMock", "__P1B_FIXTURES__", "makeFixtureSnapshot", "__P1B_DIAGNOSTICS__")
            leaked = []
            for name in names:
                if name.endswith(".js"):
                    text = z.read(name).decode("utf-8", errors="ignore")
                    leaked += [term for term in forbidden if term in text]
            if leaked:
                raise ValueError(f"Tap package contains debug-only rewarded/debug strings: {sorted(set(leaked))}")
            record.update({"package": str(package), "packageBytes": package.stat().st_size,
                           "packageSha256": hashlib.sha256(package.read_bytes()).hexdigest(),
                           "uncompressedBytes": sum(f.file_size for f in z.infolist()),
                           "fileCount": len(z.infolist()), "pngCount": sum(n.endswith('.png') for n in names)})
        record["status"] = "LOCAL_CONVERSION_PASS_NOT_HOST_VALIDATED"
    except Exception as error:
        record["status"] = "FAIL"
        record["error"] = str(error)
        raise
    finally:
        after = manifest(project)
        record["originalSourceChanges"] = sorted(k for k in before.keys() | after.keys() if before.get(k) != after.get(k))
        record["finishedAt"] = datetime.datetime.now().astimezone().isoformat()
        if record["originalSourceChanges"]:
            record["status"] = "SOURCE_CHANGED_DURING_BUILD"
        save(evidence / "result.json", record)
        print(json.dumps(record, ensure_ascii=False, indent=2))
    if record["status"] != "LOCAL_CONVERSION_PASS_NOT_HOST_VALIDATED":
        raise RuntimeError(record["status"])


if __name__ == "__main__":
    main()
