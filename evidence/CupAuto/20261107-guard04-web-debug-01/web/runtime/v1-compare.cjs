// A/B/C comparison on the same fixture: no-op (A), historical bump_v1 build (B, port 8765), guarded v2 build (C, port 8766).
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const OUT = process.argv[2];
const Y = (designY) => 1334 - designY;

(async () => {
  const out = { startedAt: new Date().toISOString(), variants: {} };
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const run = async (label, url, action) => {
    const ctx = await browser.newContext({ viewport: { width: 750, height: 1334 } });
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: 'load', timeout: 60000 });
    await page.waitForFunction(() => !!window.__P1B_FIXTURES__ && !!window.__P1B_DIAGNOSTICS__, null, { timeout: 60000 });
    await page.evaluate(() => window.__P1B_FIXTURES__.start({ attemptId: `ab-${Date.now()}-${Math.random()}`, seed: 20261107, fixtureId: 'shake-mass' }));
    await page.mouse.click(535, Y(698));
    await page.waitForTimeout(1400);
    const settleSnap = await page.evaluate(() => window.__P1B_DIAGNOSTICS__.snapshot());
    const t0 = settleSnap.tick;
    const collecting = page.evaluate(({ t0 }) => new Promise(resolve => {
      const diag = window.__P1B_DIAGNOSTICS__, rows = [], start = performance.now();
      const timer = setInterval(() => {
        const s = diag.snapshot(); if (!s) return;
        rows.push({ tick: s.tick, bodies: s.ingredients.map(i => ({ id: i.entityId, level: i.level, x: i.positionDu.x, y: i.positionDu.y, vx: i.velocityDuPerSecond.x, vy: i.velocityDuPerSecond.y })) });
        if (s.tick >= t0 + 130 || performance.now() - start > 8000) { clearInterval(timer); resolve({ rows, status: diag.status(), probe: diag.readFixtureImpulseProbe(), settle: diag.snapshot() }); }
      }, 16);
    }), { t0 });
    if (action === 'shake') await page.mouse.click(142, Y(96));
    const collected = await collecting;
    await ctx.close();
    const base = settleSnap.ingredients.map(i => ({ id: i.entityId, level: i.level, x: i.positionDu.x, y: i.positionDu.y }));
    const metrics = base.map(b => {
      let peakY = -Infinity, peakVx = 0;
      for (const row of collected.rows) { const s = row.bodies.find(v => v.id === b.id); if (!s) continue; peakY = Math.max(peakY, s.y); peakVx = Math.max(peakVx, Math.abs(s.vx)); }
      return { id: b.id, level: b.level, baseY: +b.y.toFixed(2), rise: +(peakY - b.y).toFixed(2), peakAbsVx: +peakVx.toFixed(2) };
    });
    out.variants[label] = { url, action, t0, metrics, impulses: collected.probe.length, status: { lastTickFault: collected.status.lastTickFault, tick: collected.status.tick } };
    return metrics;
  };
  try {
    const noop = await run('A-noop-v2', 'http://127.0.0.1:8766/', 'noop');
    const v1 = await run('B-shake-v1', 'http://127.0.0.1:8765/', 'shake');
    const v2 = await run('C-shake-v2', 'http://127.0.0.1:8766/', 'shake');
    const diff = (a, b) => b.map(x => { const y = a.find(v => v.id === x.id); return { id: x.id, level: x.level, riseA: y?.rise ?? null, riseB: x.rise, riseDelta: y ? +(x.rise - y.rise).toFixed(2) : null, vxA: y?.peakAbsVx ?? null, vxB: x.peakAbsVx }; });
    out.diff = { v1VsNoop: diff(noop, v1), v2VsNoop: diff(noop, v2), v2VsV1: v1.map(x => { const y = v2.find(v => v.id === x.id); return { id: x.id, riseV1: x.rise, riseV2: y?.rise ?? null, riseGain: y ? +(y.rise - x.rise).toFixed(2) : null, vxV1: x.peakAbsVx, vxV2: y?.peakAbsVx ?? null }; }) };
    out.pass = { v2LowRise: v2.some(v => v.rise >= 75), v2StrongerThanV1: out.diff.v2VsV1.every(d => d.riseGain === null || d.riseGain >= 0) };
  } catch (e) { out.error = e.stack || e.message; }
  out.finishedAt = new Date().toISOString();
  fs.writeFileSync(path.join(OUT, 'v1-v2-compare.json'), JSON.stringify(out, null, 2));
  console.log(JSON.stringify({ pass: out.pass, error: out.error, v1VsNoop: out.diff?.v1VsNoop, v2VsNoop: out.diff?.v2VsNoop }, null, 2));
  await browser.close();
})();
