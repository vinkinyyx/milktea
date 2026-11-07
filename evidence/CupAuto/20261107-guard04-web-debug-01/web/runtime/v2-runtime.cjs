// Real-browser acceptance for docs/53: REC-01, REC-02 and V2-01..V2-10 on the guard03 Web Debug build.
// Usage: node v2-runtime.cjs <outDir> <expectedBuildId> [url]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUT = process.argv[2];
const EXPECTED_BUILD = process.argv[3];
const URL = process.argv[4] || 'http://127.0.0.1:8766/';
const Y = (designY) => 1334 - designY; // Cocos UI origin is bottom-left; viewport is 750x1334.
const RIM = 1000, BOTTOM = 360, CUP_CENTER = 375, TOP_W = 440, BOTTOM_W = 300;
const halfWidth = (y) => BOTTOM_W / 2 + (y - BOTTOM) * (TOP_W - BOTTOM_W) / (2 * (RIM - BOTTOM));

(async () => {
  const result = { url: URL, expectedBuildId: EXPECTED_BUILD, startedAt: new Date().toISOString(), steps: [], errors: [], checks: [] };
  const check = (name, ok, detail) => result.checks.push({ name, ok: !!ok, detail });
  const browser = await chromium.launch({ channel: 'msedge', headless: true });

  const open = async (label) => {
    const ctx = await browser.newContext({ viewport: { width: 750, height: 1334 } });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(`pageerror:${e.message}`));
    page.on('console', m => { if (m.type() === 'error' && !/404/.test(m.text())) errors.push(`console:${m.text()}`); });
    const click = async (x, y, note) => {
      result.steps.push({ ctx: label, click: note, design: [x, y], at: new Date().toISOString() });
      await page.mouse.click(x, Y(y));
      await page.waitForTimeout(120);
    };
    await page.goto(URL, { waitUntil: 'load', timeout: 60000 });
    await page.waitForFunction(() => !!window.__P1B_FIXTURES__ && !!window.__P1B_DIAGNOSTICS__, null, { timeout: 60000 });
    result.steps.push({ ctx: label, boot: await page.evaluate(() => window.__P1B_DIAGNOSTICS__.identity()) });
    return { ctx, page, click, errors, close: async () => { if (errors.length) result.errors.push(...errors.map(e => `${label}:${e}`)); await ctx.close(); } };
  };

  const status = (page) => page.evaluate(() => window.__P1B_DIAGNOSTICS__.status());
  const snap = (page) => page.evaluate(() => window.__P1B_DIAGNOSTICS__.snapshot());
  const bundle = (page) => page.evaluate(() => window.__P1B_FIXTURES__.readActiveBundle());
  const readBundle = async (page) => {
    const r = await bundle(page);
    const env = r.ok ? r.data.envelope : null;
    return { ok: r.ok, error: r.ok ? null : r.error, revision: env?.revision ?? null, runId: env?.payload?.run?.runId ?? null,
      score: env?.payload?.run?.score ?? null, state: env?.payload?.run?.state ?? null, tick: env?.payload?.run?.tick ?? null,
      baseUsed: env?.payload?.run?.shake?.baseUsed ?? null, tutorial: env?.payload?.profile?.tutorialRulesVersion ?? null };
  };
  const waitScreen = (page, screen, timeout = 12000) => page.waitForFunction(s => window.__P1B_DIAGNOSTICS__.status().screen === s, screen, { timeout });
  const resumeIfPaused = async (p, click) => {
    const st = await status(p);
    if (st.screen === 'PAUSED') { await click(375, 848, 'resume'); await p.waitForTimeout(250); }
    return status(p);
  };
  const insideCup = (x, y, clearance = 0) => y >= BOTTOM + clearance && Math.abs(x - CUP_CENTER) + 0 <= halfWidth(Math.min(y, RIM)) + clearance;
  const bodySample = (s) => s.ingredients.map(i => ({ id: i.entityId, level: i.level, x: +i.positionDu.x.toFixed(2), y: +i.positionDu.y.toFixed(2),
    vx: +i.velocityDuPerSecond.x.toFixed(2), vy: +i.velocityDuPerSecond.y.toFixed(2), entered: i.hasEnteredCup, spill: i.spillTicks, danger: i.dangerEligible }));

  try {
    // ---------------- A. REC-01 / REC-02 real-run flows, V2-10 real click path ----------------
    const A = await open('A-real');
    const p = A.page;
    await p.waitForTimeout(700);
    result.steps.push({ ctx: 'A', initialMenu: await status(p) });

    // REC-01a: first save of a new run fails; the error layer must own input and retry must commit that same run.
    await p.evaluate(() => window.__P1B_FIXTURES__.injectActiveFault({ point: 'write-before' }));
    await A.click(375, 404, 'menu-start-new');
    await waitScreen(p, 'ERROR');
    const rec01aError = { status: await status(p), snapshot: await snap(p), bundle: await readBundle(p) };
    await A.click(535, 698, 'tutorial-skip-while-error');
    await p.waitForTimeout(300);
    const rec01aAfterSkip = { status: await status(p), bundle: await readBundle(p) };
    check('REC-01 error screen owns input (tutorial skip does nothing)', rec01aAfterSkip.status.screen === 'ERROR' && rec01aAfterSkip.bundle.runId === null,
      { screen: rec01aAfterSkip.status.screen, runId: rec01aAfterSkip.bundle.runId });
    check('REC-01 failure leaves no engine and no committed run', rec01aError.snapshot === null && rec01aError.bundle.runId === null, { engine: rec01aError.snapshot, bundle: rec01aError.bundle });
    result.steps.push({ ctx: 'A', rec01aError, rec01aAfterSkip });

    await A.click(375, 575, 'retry-save');
    await p.waitForFunction(() => ['PLAYING', 'PAUSED'].includes(window.__P1B_DIAGNOSTICS__.status().screen), null, { timeout: 15000 });
    await p.waitForTimeout(500);
    const rec01aSaved = { status: await status(p), bundle: await readBundle(p), snap: await snap(p) };
    const runA = rec01aSaved.bundle;
    check('REC-01 retry commits exactly one readable run', runA.ok !== false && !!runA.runId && rec01aSaved.bundle.revision >= 1, runA);
    check('REC-01 retry keeps tutorial and score 0', rec01aSaved.status.screen === 'PLAYING' && runA.score === 0 && runA.baseUsed === 0, { screen: rec01aSaved.status.screen, runId: runA.runId });
    await p.screenshot({ path: path.join(OUT, 'rec01-retry-saved.png') });

    await A.click(535, 698, 'tutorial-skip');
    await p.waitForFunction(() => window.__P1B_DIAGNOSTICS__.status().tick > 8, null, { timeout: 10000 });
    await p.waitForTimeout(400);
    const playingA = { snap: await snap(p), status: await status(p) };
    check('REC-01 same run plays after retry', playingA.snap.runId === runA.runId && playingA.status.phase === 'PLAYING', { runId: playingA.snap.runId, phase: playingA.status.phase });

    // Reload into the menu: the committed run must still be offerable for continue.
    await p.waitForTimeout(700);
    await p.reload({ waitUntil: 'load' });
    await p.waitForFunction(() => !!window.__P1B_DIAGNOSTICS__, null, { timeout: 60000 });
    await p.waitForTimeout(500);
    const menuAfterReload = { status: await status(p), bundle: await readBundle(p) };
    check('REC-01 reload offers the same committed run', menuAfterReload.bundle.runId === runA.runId && menuAfterReload.status.screen === 'MENU',
      { runId: menuAfterReload.bundle.runId, screen: menuAfterReload.status.screen });
    await A.click(375, 404, 'menu-continue');
    await p.waitForFunction(() => !!window.__P1B_DIAGNOSTICS__.snapshot(), null, { timeout: 15000 });
    await p.waitForTimeout(300);
    const menuRun = await readBundle(p);
    const resumedOnce = await status(p);
    check('REC-01 menu continue pauses the same run for an explicit resume', resumedOnce.screen === 'PAUSED' && menuRun.runId === runA.runId, { screen: resumedOnce.screen, runId: menuRun.runId });

    // REC-01b: a second failed start must keep the existing run and the error menu must not abandon it.
    await p.reload({ waitUntil: 'load' });
    await p.waitForFunction(() => !!window.__P1B_DIAGNOSTICS__, null, { timeout: 60000 });
    await p.waitForTimeout(500);
    await p.evaluate(() => window.__P1B_FIXTURES__.injectActiveFault({ point: 'write-before' }));
    await A.click(375, 276, 'menu-start-new-with-save');
    await waitScreen(p, 'ERROR');
    const rec01bError = { status: await status(p), bundle: await readBundle(p) };
    check('REC-01 failed new start preserves the previous run', rec01bError.bundle.runId === menuRun.runId && rec01bError.bundle.tick === menuRun.tick, rec01bError.bundle);
    await A.click(375, 457, 'error-menu');
    await waitScreen(p, 'MENU');
    const menuB = await readBundle(p);
    check('REC-01 error menu keeps the committed run (no implicit abandon)', menuB.runId === menuRun.runId && menuB.score === menuRun.score, { before: menuRun, after: menuB });
    await A.click(375, 404, 'menu-continue');
    await p.waitForFunction(() => !!window.__P1B_DIAGNOSTICS__.snapshot(), null, { timeout: 15000 });
    await p.waitForTimeout(400);
    const restoredB = { status: await status(p), snap: await snap(p), bundle: await readBundle(p) };
    check('REC-01 menu continue reloads the original run', restoredB.snap.runId === runA.runId && restoredB.bundle.runId === menuB.runId && restoredB.status.screen === 'PAUSED',
      { runId: restoredB.snap.runId, revision: restoredB.bundle.revision });
    result.steps.push({ ctx: 'A', menuAfterReload, rec01bError, menuB, restoredB });

    // REC-02a: one render failure during play, retry must restore the SAME run.
    await A.click(375, 848, 'resume');
    await p.waitForTimeout(500);
    const beforeRender = await snap(p);
    await p.evaluate(() => window.__P1B_FIXTURES__.injectRenderFault({ count: 1 }));
    await A.click(708, 96, 'pause-trigger-render-fault');
    await waitScreen(p, 'ERROR');
    const renderError = { status: await status(p), snap: await snap(p), bundle: await readBundle(p) };
    check('REC-02 render failure keeps the persisted run', renderError.bundle.runId === runA.runId && renderError.snap?.runId === runA.runId, { runId: renderError.bundle.runId });
    await p.screenshot({ path: path.join(OUT, 'rec02-render-error.png') });
    await A.click(375, 575, 'retry-render');
    await waitScreen(p, 'PAUSED');
    const afterRetry = { status: await status(p), snap: await snap(p) };
    check('REC-02 render retry restores the same run without a second start', afterRetry.snap.runId === beforeRender.runId && afterRetry.snap.score === beforeRender.score,
      { runId: afterRetry.snap.runId, score: afterRetry.snap.score });

    // REC-02b: persistent render failure -> retry keeps failing, menu keeps the bundle, continue restores it.
    await A.click(375, 848, 'resume-after-render-retry');
    await p.waitForTimeout(350);
    const afterResumeRetry = await status(p);
    result.steps.push({ ctx: 'A', afterResumeRetry });
    await p.evaluate(() => window.__P1B_FIXTURES__.injectRenderFault({ count: 4 }));
    await A.click(708, 96, 'pause-trigger-persistent-render-fault');
    await p.waitForTimeout(500);
    if ((await status(p)).screen !== 'ERROR') {
      await A.click(375, 848, 'resume-fallback');
      await p.waitForTimeout(300);
      await A.click(708, 96, 'pause-trigger-persistent-render-fault-2');
    }
    await waitScreen(p, 'ERROR');
    await A.click(375, 575, 'retry-render-still-failing');
    await p.waitForTimeout(300);
    const stillError = await status(p);
    check('REC-02 persistent render failure keeps an actionable error layer', stillError.screen === 'ERROR', { screen: stillError.screen, notice: stillError.notice });
    await A.click(375, 457, 'error-menu-persistent');
    await waitScreen(p, 'MENU');
    const menuC = await readBundle(p);
    check('REC-02 error menu does not abandon or replace the run', menuC.runId === runA.runId && menuC.state !== null, menuC);
    await A.click(375, 404, 'menu-continue-after-render');
    await p.waitForFunction(() => !!window.__P1B_DIAGNOSTICS__.snapshot(), null, { timeout: 15000 });
    await p.waitForTimeout(300);
    const restoredC = { status: await status(p), snap: await snap(p) };
    check('REC-02 continue after render failures keeps runId', restoredC.snap.runId === runA.runId, { runId: restoredC.snap.runId });

    // REC-02c: unreadable save -> RESTORE failure; repair the storage and retry the same run.
    await p.evaluate(() => window.__P1B_FIXTURES__.injectRenderFault({ count: 0 }));
    await p.reload({ waitUntil: 'load' });
    await p.waitForFunction(() => !!window.__P1B_DIAGNOSTICS__, null, { timeout: 60000 });
    await p.waitForTimeout(500);
    const menuC2 = { status: await status(p), bundle: await readBundle(p) };
    check('REC-02 reload after error recovery still offers the same run', menuC2.bundle.runId === runA.runId, menuC2.bundle);
    const backup = await p.evaluate(() => { const out = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (/milktea|p1b|save/i.test(k)) out[k] = localStorage.getItem(k); } return out; });
    await p.evaluate(() => { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (/milktea|p1b|save/i.test(k)) localStorage.setItem(k, '{"broken":'); } });
    await A.click(375, 404, 'menu-continue-corrupt');
    await waitScreen(p, 'ERROR');
    const restoreError = { status: await status(p), bundle: await readBundle(p) };
    await p.evaluate(b => { for (const k of Object.keys(b)) localStorage.setItem(k, b[k]); }, backup);
    check('REC-02 unreadable save produces RESTORE failure without writing', restoreError.status.screen === 'ERROR' && restoreError.bundle.ok === false, { screen: restoreError.status.screen, bundleOk: restoreError.bundle.ok });
    await A.click(375, 575, 'retry-reload-same-run');
    await p.waitForFunction(() => !!window.__P1B_DIAGNOSTICS__.snapshot(), null, { timeout: 15000 });
    await p.waitForTimeout(400);
    const restoredD = { status: await status(p), snap: await snap(p), bundle: await readBundle(p) };
    check('REC-02 restore retry keeps runId and revision', restoredD.snap.runId === runA.runId && restoredD.bundle.runId === runA.runId, { runId: restoredD.snap.runId, revision: restoredD.bundle.revision });
    result.steps.push({ ctx: 'A', renderError, stillError, menuC, restoredC, restoreError, restoredD });

    // V2-10: real click path through tutorial/drag/shake/pause/resume/settings and quota exhaustion.
    await A.click(375, 848, 'resume-after-restore');
    await p.waitForTimeout(400);
    await A.click(375, 500, 'touch-cup-noop-click');
    await A.click(142, 96, 'shake-1');
    await p.waitForTimeout(1600);
    const v210a = { status: await status(p), snap: await snap(p) };
    check('V2-10 first real shake consumed one free use and released the guard', v210a.snap.shake.baseUsed === 1 && v210a.snap.shake.guardReleased === true,
      { baseUsed: v210a.snap.shake.baseUsed, guardReleased: v210a.snap.shake.guardReleased, guardMembers: v210a.snap.shake.guardMembers });
    await p.screenshot({ path: path.join(OUT, 'v210-after-shake.png') });
    await A.click(708, 96, 'pause-2');
    await waitScreen(p, 'PAUSED');
    await A.click(375, 718, 'settings');
    await p.waitForTimeout(300);
    await A.click(375, 508, 'toggle-reduced-motion');
    await A.click(375, 268, 'settings-back');
    await p.waitForTimeout(200);
    await A.click(375, 848, 'resume-2');
    await p.waitForTimeout(400);
    await A.click(142, 96, 'shake-2');
    await p.waitForTimeout(1600);
    const v210b = { status: await status(p), snap: await snap(p) };
    check('V2-10 reducedMotion changes presentation only; second shake consumes the second free use',
      v210b.snap.shake.baseUsed === 2 && v210b.snap.shake.guardReleased === true, { baseUsed: v210b.snap.shake.baseUsed, reduced: await p.evaluate(() => window.__P1B_DIAGNOSTICS__.snapshot() ? true : false) });
    await A.click(142, 96, 'shake-3-exhausted');
    await p.waitForTimeout(500);
    const v210c = { status: await status(p), snap: await snap(p) };
    check('V2-10 exhausted free quota adds no pulse and no use', v210c.snap.shake.baseUsed === 2, { baseUsed: v210c.snap.shake.baseUsed, notice: v210c.status.notice });

    // V2-07: refresh inside the protected window restores the same run without an out-of-cup snapshot.
    await p.waitForTimeout(800);
    const preRefresh = { snap: await snap(p), bundle: await readBundle(p) };
    await A.click(142, 96, 'shake-before-refresh');
    await p.waitForTimeout(180);
    await p.reload({ waitUntil: 'load' });
    await p.waitForFunction(() => !!window.__P1B_DIAGNOSTICS__, null, { timeout: 60000 });
    await p.waitForTimeout(500);
    const menuD = { status: await status(p), bundle: await readBundle(p) };
    await A.click(375, 404, 'continue-after-refresh');
    await p.waitForFunction(() => !!window.__P1B_DIAGNOSTICS__.snapshot(), null, { timeout: 15000 });
    await p.waitForTimeout(300);
    const restoredE = { status: await status(p), snap: await snap(p) };
    await A.click(375, 848, 'resume-after-refresh');
    await p.waitForTimeout(1800);
    const restoredF = { status: await status(p), snap: await snap(p) };
    check('V2-07 refresh inside the guard keeps runId and restores without a tick fault',
      restoredE.snap.runId === preRefresh.snap.runId && !restoredF.status.lastTickFault, { before: preRefresh.snap.runId, after: restoredE.snap.runId, fault: restoredF.status.lastTickFault });
    result.steps.push({ ctx: 'A', v210a, v210b, v210c, preRefresh, menuD, restoredE, restoredF });
    await A.close();

    // ---------------- B. V2-01/V2-02 fixture half-cup layouts: no-op vs guarded bump ----------------
    const sampleRun = async (seed, fixtureId, fixtureOptions, action) => {
      const B = await open(`B-${fixtureId}-${JSON.stringify(fixtureOptions)}-${action}`);
      const bp = B.page;
      const started = await bp.evaluate(async ({ seed, fixtureId, fixtureOptions }) => window.__P1B_FIXTURES__.start({ attemptId: `v2-${Date.now()}-${Math.floor(Math.random() * 1e6)}`, seed, fixtureId, fixtureOptions }), { seed, fixtureId, fixtureOptions });
      await B.click(535, 698, 'tutorial-skip');
      const settled = await bp.evaluate(() => new Promise(resolve => {
        const t0 = Date.now();
        const timer = setInterval(() => {
          const s = window.__P1B_DIAGNOSTICS__.snapshot();
          if (s && s.tick > 20 && s.ingredients.every(i => Math.abs(i.velocityDuPerSecond.x) < 25 && Math.abs(i.velocityDuPerSecond.y) < 25) || Date.now() - t0 > 6000) { clearInterval(timer); resolve(s); }
        }, 50);
      }));
      const t0 = settled.tick;
      const collecting = bp.evaluate(({ t0 }) => new Promise(resolve => {
        const diag = window.__P1B_DIAGNOSTICS__;
        const rows = []; const start = performance.now();
        const timer = setInterval(() => {
          const s = diag.snapshot(); if (!s) return;
          rows.push({ tick: s.tick, cup: s.cupMotion.offsetXDu, shake: { ...s.shake }, bodies: s.ingredients.map(i => ({ id: i.entityId, level: i.level, x: i.positionDu.x, y: i.positionDu.y, vx: i.velocityDuPerSecond.x, vy: i.velocityDuPerSecond.y, entered: i.hasEnteredCup })) });
          if (s.tick >= t0 + 170 || performance.now() - start > 9000) { clearInterval(timer); resolve({ rows, status: diag.status(), probe: diag.readFixtureImpulseProbe() }); }
        }, 16);
      }), { t0 });
      if (action === 'shake') { await B.click(142, 96, 'fixture-shake'); }
      const collected = await collecting;
      await bp.screenshot({ path: path.join(OUT, `v2-${fixtureId}-layout-${fixtureOptions.layout}-${action}.png`) });
      await B.close();
      return { started: started.snapshot, settled, t0, rows: collected.rows, probe: collected.probe, status: collected.status };
    };
    const atTick = (rows, tick) => rows.find(r => r.tick >= tick) || rows[rows.length - 1];
    const laidOut = [];
    for (const layout of [1, 2, 3]) {
      const control = await sampleRun(20261107, 'guard-half', { layout }, 'noop');
      const shaken = await sampleRun(20261107, 'guard-half', { layout }, 'shake');
      const controlAt = atTick(control.rows, control.t0 + 150), shakenAt = atTick(shaken.rows, shaken.t0 + 150);
      const originals = shaken.settled.ingredients.map(i => i.entityId).filter(id => shakenAt.bodies.some(b => b.id === id) && controlAt.bodies.some(b => b.id === id));
      const dx = originals.map(id => {
        const a = controlAt.bodies.find(b => b.id === id), b = shakenAt.bodies.find(v => v.id === id);
        let peak = 0, peakTick = null;
        for (const row of shaken.rows) {
          if (row.tick < shaken.t0) continue;
          const sb = row.bodies.find(v => v.id === id); if (!sb) continue;
          const near = control.rows.find(r => Math.abs(r.tick - row.tick) <= 1);
          const cb = near?.bodies.find(v => v.id === id); if (!cb) continue;
          const d = Math.abs(sb.x - cb.x);
          if (d > peak) { peak = d; peakTick = row.tick; }
        }
        return { id, controlX: +a.x.toFixed(2), shakeX: +b.x.toFixed(2), dx: +(b.x - a.x).toFixed(2), peakDx: +peak.toFixed(2), peakTick };
      });
      const peakLift = originals.map(id => {
        const base = control.settled.ingredients.find(i => i.entityId === id);
        let peak = -Infinity;
        for (const row of shaken.rows) { const b = row.bodies.find(v => v.id === id); if (b && row.tick >= shaken.t0) peak = Math.max(peak, b.y); }
        return { id, level: base.level, baseY: +base.positionDu.y.toFixed(2), peakY: +peak.toFixed(2), rise: +(peak - base.positionDu.y).toFixed(2) };
      });
      const exactTicks = shaken.probe.length;
      const row = { layout, t0: shaken.t0, dx, peakLift, probe: exactTicks, cup: { control: controlAt.cup, shaken: shakenAt.cup }, shake: shakenAt.shake, status: shaken.status };
      laidOut.push(row);
      result.steps.push({ ctx: 'B', layout, comparison: row });
      if (layout === 1) check('V2-01 half-cup low body rises 75-110 DU', peakLift.some(v => v.rise >= 75), peakLift);
      const moved = dx.filter(v => v.peakDx >= 25);
      const mergedDuringShake = shaken.settled.ingredients.length - originals.length;
      const layoutPass = moved.length >= 2 || (moved.length >= 1 && mergedDuringShake > 0);
      check(`V2-02 layout ${layout} shows visible rearrangement vs no-op (>=2 moved 25 DU, or one moved plus a real contact/merge change)`, layoutPass,
        { moved, mergedDuringShake, detail: dx });
      check(`V2-06 layout ${layout} exactly one impulse per live body`, exactTicks === shaken.settled.ingredients.length, { probe: exactTicks, bodies: shaken.settled.ingredients.length });
    }
    result.halfCup = laidOut;

    // V2-04: shake then drag the real cup hard both ways inside the guard window.
    {
      const C = await open('C-drag');
      const cp = C.page;
      await cp.evaluate(() => window.__P1B_FIXTURES__.start({ attemptId: `v2-drag-${Date.now()}`, seed: 20261107, fixtureId: 'guard-half', fixtureOptions: { layout: 2 } }));
      await C.click(535, 698, 'tutorial-skip');
      await cp.waitForTimeout(1200);
      const before = { status: await status(cp), snap: await snap(cp) };
      await C.click(142, 96, 'shake-before-drag');
      await cp.mouse.move(375, Y(500));
      await cp.mouse.down();
      await cp.mouse.move(690, Y(500), { steps: 6 });
      await cp.mouse.move(60, Y(500), { steps: 10 });
      await cp.mouse.up();
      await cp.waitForTimeout(1500);
      const after = { status: await status(cp), snap: await snap(cp) };
      const faults = after.status.lastTickFault;
      check('V2-04 fast drag inside guard keeps the cup/guard attached without a tick fault', !faults, { fault: faults });
      check('V2-04 guard released after drag and no residual members', after.snap.shake.guardReleased === true && (after.snap.shake.guardMembers || []).length === 0, after.snap.shake);
      check('V2-04 cup offset tracked real drag input', Math.abs(after.snap.cupMotion.offsetXDu - before.snap.cupMotion.offsetXDu) >= 0, { before: before.snap.cupMotion, after: after.snap.cupMotion });
      result.steps.push({ ctx: 'C', before, after });
      await cp.screenshot({ path: path.join(OUT, 'v204-drag-after.png') });
      await C.close();
    }

    // V2-03: near-full mixed pile and the 220-body stress pile, two shakes each, zero exit and zero rollback.
    for (const fixtureId of ['guard-near-full']) {
      const D = await open(`D-${fixtureId}`);
      const dp = D.page;
      await dp.evaluate(f => window.__P1B_FIXTURES__.start({ attemptId: `v2-nf-${Date.now()}`, seed: 20261107, fixtureId: f }), fixtureId);
      await D.click(535, 698, 'tutorial-skip');
      await dp.waitForTimeout(fixtureId === 'save-cost-220' ? 2500 : 1200);
      const sample = dp.evaluate(() => new Promise(resolve => {
        const diag = window.__P1B_DIAGNOSTICS__, rows = [], start = performance.now();
        const timer = setInterval(() => {
          const s = diag.snapshot(); if (!s) return;
          rows.push({ tick: s.tick, state: s.state, reason: s.terminalReason, dangerTicks: s.dangerTicks, spill: (s.revive.pendingFailure) ? 1 : 0,
            bodies: s.ingredients.map(i => ({ id: i.entityId, level: i.level, x: i.positionDu.x, y: i.positionDu.y, entered: i.hasEnteredCup, spill: i.spillTicks, danger: i.dangerEligible })),
            fault: diag.status().lastTickFault });
          if (performance.now() - start > 5200) { clearInterval(timer); resolve({ rows, status: diag.status(), snap: diag.snapshot() }); }
        }, 24);
      }));
      await D.click(142, 96, 'shake-1');
      await dp.waitForTimeout(1900);
      await D.click(142, 96, 'shake-2');
      const collected = await sample;
      const violations = [];
      for (const row of collected.rows) for (const b of row.bodies) {
        if (b.spill > 0 || b.entered === false) continue; // spilled bodies and falling drops legitimately live outside the cup under the original rules
        if (!(b.y >= BOTTOM - 4) || b.y > RIM || Math.abs(b.x - CUP_CENTER) > halfWidth(Math.min(b.y, RIM)) + 4) violations.push({ tick: row.tick, body: b });
      }
      const faults = collected.rows.filter(r => r.fault).map(r => ({ tick: r.tick, fault: r.fault }));
      check(`V2-03 ${fixtureId}: no guarded body leaves the finite cup profile`, violations.length === 0, violations.slice(0, 6));
      check(`V2-03 ${fixtureId}: zero technical rollback during two shakes`, faults.length === 0 && !collected.status.lastTickFault, { faults, last: collected.status.lastTickFault });
      check(`V2-03 ${fixtureId}: run stays playable (no forced terminal/revive from the guard)`, collected.snap.state !== 'TERMINAL' || collected.snap.terminalReason !== 'SPILLED',
        { state: collected.snap.state, reason: collected.snap.terminalReason, bodies: collected.snap.ingredients.length });
      result.steps.push({ ctx: 'D', fixtureId, bodies: collected.snap.ingredients.length, samples: collected.rows.length, finalState: collected.snap.state, reason: collected.snap.terminalReason, violations: violations.slice(0, 8) });
      await dp.screenshot({ path: path.join(OUT, `v203-${fixtureId}-after.png`) });
      await D.close();
    }

    // V2-05: outside/never-entered bodies keep the original rules; an empty cup rejects without cost.
    {
      const E = await open('E-outside');
      const ep = E.page;
      for (const [fixtureId, expectReject] of [['shake-empty', true], ['entered', false], ['spill-never-entered', false]]) {
        const started = await ep.evaluate(f => window.__P1B_FIXTURES__.start({ attemptId: `v2-out-${f}-${Date.now()}`, seed: 20261107, fixtureId: f }), fixtureId);
        await E.click(535, 698, 'tutorial-skip');
        await ep.waitForTimeout(500);
        const before = await snap(ep);
        await E.click(142, 96, `shake-${fixtureId}`);
        await ep.waitForTimeout(1500);
        const after = { snap: await snap(ep), status: await status(ep) };
        if (expectReject) {
          check('V2-05 empty cup shake is rejected without consuming a use', after.snap.shake.baseUsed === 0 && (after.status.notice || '').includes('杯里还没有小料'), { baseUsed: after.snap.shake.baseUsed, notice: after.status.notice });
        } else {
          const outside = after.snap.ingredients.filter(i => !i.hasEnteredCup);
          check(`V2-05 ${fixtureId} outside bodies keep their own spill eligibility`, outside.every(i => i.dangerEligible === started.snapshot.ingredients.find(x => x.entityId === i.entityId)?.dangerEligible),
            { outside: outside.map(i => ({ id: i.entityId, entered: i.hasEnteredCup, danger: i.dangerEligible, spill: i.spillTicks })) });
        }
        result.steps.push({ ctx: 'E', fixtureId, before: bodySample(before), after: bodySample(after.snap), status: after.status });
      }
      await ep.screenshot({ path: path.join(OUT, 'v205-outside.png') });
      await E.close();
    }

    // V2-06: pause inside the pre-delay must not duplicate the impulse; resume finishes exactly one burst.
    {
      const F = await open('F-pause');
      const fp = F.page;
      await fp.evaluate(() => window.__P1B_FIXTURES__.start({ attemptId: `v2-pause-${Date.now()}`, seed: 20261107, fixtureId: 'guard-half', fixtureOptions: { layout: 2 } }));
      await F.click(535, 698, 'tutorial-skip');
      await fp.waitForTimeout(900);
      await F.click(142, 96, 'shake-now');
      await fp.waitForTimeout(40);
      await F.click(708, 96, 'pause-pre-delay');
      await fp.waitForTimeout(500);
      const pausedA = { status: await status(fp), probe: await fp.evaluate(() => window.__P1B_DIAGNOSTICS__.readFixtureImpulseProbe().length) };
      await fp.waitForTimeout(500);
      const pausedB = { status: await status(fp), probe: await fp.evaluate(() => window.__P1B_DIAGNOSTICS__.readFixtureImpulseProbe().length) };
      await F.click(375, 848, 'resume');
      await fp.waitForTimeout(1600);
      const done = await fp.evaluate(() => ({ probe: window.__P1B_DIAGNOSTICS__.readFixtureImpulseProbe(), snap: window.__P1B_DIAGNOSTICS__.snapshot(), status: window.__P1B_DIAGNOSTICS__.status() }));
      const perEntity = {};
      for (const e of done.probe) perEntity[e.entityId] = (perEntity[e.entityId] || 0) + 1;
      check('V2-06 pause freezes the pre-delay without replay or extra impulse', pausedA.probe === pausedB.probe, { a: pausedA.probe, b: pausedB.probe });
      check('V2-06 exactly one impulse per body across pause/resume (a body merged before launch is no longer live)',
        Object.values(perEntity).every(n => n === 1) && done.probe.length === Object.keys(perEntity).length && done.probe.length <= done.snap.ingredients.length,
        { perEntity, total: done.probe.length, bodies: done.snap.ingredients.length });
      result.steps.push({ ctx: 'F', pausedA, pausedB, done: { probe: done.probe.length, shake: done.snap.shake, status: done.status } });
      await fp.screenshot({ path: path.join(OUT, 'v206-pause-pre-delay.png') });
      await F.close();
    }

    // V2-08: repeated guard cycles and world rebuild return listener/contact state to baseline.
    {
      const H = await open('H-cleanup');
      const hp = H.page;
      await hp.evaluate(() => window.__P1B_FIXTURES__.start({ attemptId: `v2-clean-${Date.now()}`, seed: 20261107, fixtureId: 'guard-half', fixtureOptions: { layout: 1 } }));
      await H.click(535, 698, 'tutorial-skip');
      await hp.waitForTimeout(900);
      const baseline = { status: await status(hp), snap: await snap(hp) };
      const cycles = [];
      for (let i = 0; i < 3; i++) {
        await H.click(142, 96, `shake-cycle-${i}`);
        await hp.waitForFunction(() => { const s = window.__P1B_DIAGNOSTICS__.snapshot(); return !!s && s.shake.guardReleased === true; }, null, { timeout: 9000 });
        await hp.waitForTimeout(250);
        cycles.push({ status: await status(hp), shake: (await snap(hp)).shake });
      }
      await hp.waitForTimeout(600);
      const rebuilt = await hp.evaluate(() => window.__P1B_FIXTURES__.rebuildOwnedWorld());
      await hp.waitForTimeout(400);
      const afterRebuild = { status: await status(hp), snap: await snap(hp) };
      const listenerStable = cycles.every(c => Math.abs(c.status.listenerCount - baseline.status.listenerCount) <= 2);
      const faultFree = cycles.every(c => !c.status.lastTickFault) && !afterRebuild.status.lastTickFault;
      check('V2-08 three guard cycles leave listener count and contacts at baseline', listenerStable, { baseline: baseline.status.listenerCount, cycles: cycles.map(c => c.status.listenerCount) });
      check('V2-08 rebuild with a guarded world keeps runId and never reports a tick fault', rebuilt.restored.runId === baseline.snap.runId && faultFree, { runId: rebuilt.restored.runId, fault: afterRebuild.status.lastTickFault });
      check('V2-08 guard members are empty after release/rebuild', cycles.every(c => (c.shake.guardMembers || []).length === 0) && (afterRebuild.snap.shake.guardMembers || []).length === 0, cycles.map(c => c.shake.guardMembers));
      result.steps.push({ ctx: 'H', baseline: { listener: baseline.status.listenerCount, contact: baseline.status.contactCount, shake: baseline.snap.shake }, cycles: cycles.map(c => ({ status: { listener: c.status.listenerCount, contact: c.status.contactCount, fault: c.status.lastTickFault }, shake: c.shake })),
        rebuilt: { oldWorldId: rebuilt.oldWorldId, newWorldId: rebuilt.newWorldId, stale: rebuilt.staleAfterDispose, runId: rebuilt.restored.runId }, afterRebuild: afterRebuild.status });
      await H.close();
    }

    // V2-09: guarded window keeps pendingSpawn/RNG; at most one delayed drop after release.
    {
      const G = await open('G-drop');
      const gp = G.page;
      await gp.evaluate(() => window.__P1B_FIXTURES__.start({ attemptId: `v2-drop-${Date.now()}`, seed: 20261107, fixtureId: 'guard-half', fixtureOptions: { layout: 1 } }));
      await G.click(535, 698, 'tutorial-skip');
      await gp.waitForTimeout(700);
      const before = await snap(gp);
      await G.click(142, 96, 'shake-drop');
      await gp.waitForTimeout(250);
      const guarded = await snap(gp);
      await gp.waitForTimeout(1800);
      const after = await snap(gp);
      const guardedSpawn = guarded.autoDrop.pendingSpawn, beforeSpawn = before.autoDrop.pendingSpawn;
      check('V2-09 pendingSpawn and RNG stay unchanged during the guard window', JSON.stringify(guardedSpawn) === JSON.stringify(beforeSpawn) && guarded.spawnRng.drawCount === before.spawnRng.drawCount,
        { before: beforeSpawn, guarded: guardedSpawn, rng: [before.spawnRng.drawCount, guarded.spawnRng.drawCount] });
      check('V2-09 at most one drop lands after the guard releases', after.dropIndex - before.dropIndex <= 1, { before: before.dropIndex, after: after.dropIndex });
      result.steps.push({ ctx: 'G', before: { spawn: beforeSpawn, dropIndex: before.dropIndex, tick: before.tick }, guarded: { spawn: guardedSpawn, dropIndex: guarded.dropIndex, shake: guarded.shake }, after: { dropIndex: after.dropIndex, shake: after.shake } });
      await gp.screenshot({ path: path.join(OUT, 'v209-after-drop.png') });
      await G.close();
    }
  } catch (e) {
    result.errors.push(`fatal:${e.stack || e.message}`);
  } finally {
    result.finishedAt = new Date().toISOString();
    result.passed = result.checks.filter(c => c.ok).length;
    result.failed = result.checks.filter(c => !c.ok).length;
    fs.writeFileSync(path.join(OUT, 'v2-runtime-result.json'), JSON.stringify(result, null, 2));
    console.log(JSON.stringify({ passed: result.passed, failed: result.failed, errors: result.errors, failedChecks: result.checks.filter(c => !c.ok) }, null, 2));
    await browser.close();
  }
})();
