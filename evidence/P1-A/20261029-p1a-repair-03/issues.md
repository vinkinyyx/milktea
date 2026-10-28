# Open issues — 20261029-p1a-repair-03

| ID | Severity | Current evidence | Required closure |
|---|---|---|---|
| PA-01 | Blocker | no-probe 70s passes; lightweight-probe attempts pause at 477 and 156 steps; visible/focused browser reports ~1s frame intervals and low probe p95 | obtain a stable real host, run valid P0/P1/P2 same-layout comparisons and close 220/mixed geometry intervals; then fix the measured application hotspot if evidence attributes one |
| PA-04/05 | Blocker | actual tab switch did not make document hidden; no trusted visibility or engine hide/show | run on a host that naturally produces lifecycle events; verify pause ownership and 5s/60s/5min restore cases |
| PA-06/07 | Blocker | empty-world X rebuild only; no engine contact-cycle evidence | create real contact each round; test end/multiple boundary contacts/destroy, 20 rounds and interruptions |
| PA-08 | Blocker | queue stayed RUNNING at level 3, attempts 0 after backlog pause | reliable host run for per-level complete attempt logs, level 9 legal block, 120 terminal cap, stable terminal and cancellation; preserve original legal obstruction |
| PA-09 | Blocker | route fault matrix not run in candidate | malformed JSON, destroy while pending, repeated failures, one recovery/init |
| PA-10/11 | Blocker | static asset integrity passed only | inspect actual variant/pivot/transparency/nine-slice/layers and interact at required viewports |
| PA-12 | Blocker | task says finished, child build-script SIGTERM, actual Creator exitCode null | capture actual Creator exit status and attribute SIGTERM from readable installed builder source; do not infer success from output |
| HOST-01 | External | Playwright headed Chrome reports visible page and roughly 1s frame cadence | provide genuine background-capable host/manual execution; current window not sufficient for real lifecycle/pressure acceptance |
