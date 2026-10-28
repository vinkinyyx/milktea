# Final build command — 20261029-p1a-final-14

Exact Creator invocation from `creator-exit.json`:

```powershell
"C:\ProgramData\cocos\editors\Creator\3.8.8\CocosCreator.exe" --remote-debugging-port=4443 --remote-allow-origins=* --project "D:\cocos-p1a-build-source\20261029-p1a-final-14" --build "platform=web-mobile;debug=true;buildPath=D:/cocos-p1a-build;outputName=20261029-p1a-final-14;startScene=44e30fdb-084f-5609-8283-4fdd8d2fab81"
```

Actual retained Process handle `WaitForExit()` exit code: **36**. Build output: `D:/cocos-p1a-build/20261029-p1a-final-14`. Only the Creator child environment had the bridge disabled; parent environment values were unchanged. SIGTERM/worker close trace: `creator-kill-trace.jsonl`, process tree: `creator-process-tree.jsonl`.

Three-circle real runtime command:

```powershell
node 'C:/Program Files/nodejs/node_modules/npm/bin/npx-cli.js' --yes @playwright/cli -s=p1a-final14 --raw run-code --filename 'D:/Workspace/TapTap/奶茶挤挤/tools/p1a-three-circle-stability.js'
```

## Real host lifecycle diagnosis (same final14, no runtime source change)

Run from the project root with installed Playwright CLI 0.1.22. These commands create new immutable attempts; choose another ID if it already exists:

```powershell
./tools/run_p1a_real_lifecycle.ps1 -CaseId LIFE-08 -AttemptId LIFE-08-PRIMARY-003
./tools/run_p1a_real_lifecycle.ps1 -CaseId LIFE-02 -AttemptId LIFE-02-PRIMARY-002
./tools/run_p1a_real_lifecycle.ps1 -CaseId LIFE-03 -AttemptId LIFE-03-PRIMARY-002
```

LIFE-08 is expected to FAIL on the unchanged final14. LIFE-03 performs one continuous 300000ms hidden interval. The runner removes focus emulation on the original Playwright protocol session, switches actual tabs, reads hidden pages without activation, and restores test overrides in finally. It does not synthesize lifecycle events or advance physics.

Current lifecycle matrix is assembled only from explicit selected raw results:

```powershell
python tools/closeout_p1a_lifecycle_diagnosis.py --evidence evidence/P1-A/20261029-p1a-final-14 --build-id 20261029-p1a-final-14
python tools/validate_p1a_evidence.py --evidence evidence/P1-A/20261029-p1a-final-14 --build-id 20261029-p1a-final-14
```

The second command should return exit 2 while LIFE-08 remains FAIL. It must not return phase approval. The old finalize_p1a_evidence.py is guarded against restoring the obsolete Opera-unavailable lifecycle matrix.
