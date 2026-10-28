// Playwright CLI run-code function. Drives the actual Creator preview; no physics mock or injected ticks.
async (page) => {
  await page.bringToFront();
  await page.waitForFunction(() => window.cc?.director.getScene()?.getChildByName('PhysicsLabRoot')?.getComponent('PhysicsLab')?.ready, null, { timeout: 30000 });
  await page.locator('#GameCanvas').click();
  const events = [];
  const receive = message => { try { const event = JSON.parse(message.text()); if (event.test) events.push(event); } catch {} };
  page.on('console', receive);
  const results = [];
  const read = () => page.evaluate(async () => {
    const lab = cc.director.getScene().getChildByName('PhysicsLabRoot').getComponent('PhysicsLab');
    const engine = await System.import('cc');
    const world = engine.PhysicsSystem2D.instance.physicsWorld;
    return { tick: lab.clock.tick, paused: lab.clock.paused, message: lab.message,
      entities: lab.adapter.entityCount, contacts: lab.adapter.contactCount, listeners: lab.adapter.listenerCount,
      worldBodies: world.impl?.GetBodyCount?.() ?? null,
      states: Array.from(lab.visuals.keys(), id => lab.adapter.getBody(id)),
      physicsStepCalls: lab.adapter.stepCount, autoSimulation: engine.PhysicsSystem2D.instance.autoSimulation };
  });
  const check = (condition, text) => { if (!condition) throw new Error(text); };
  const caseRun = async (id, run) => { try { results.push({ id, status: 'PASS', actual: await run() }); }
    catch (error) { results.push({ id, status: 'FAIL', error: String(error), actual: await read() }); } };
  const twoFrames = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  try {
    await caseRun('GRAVITY', async () => {
      const offset = events.length;
      await page.keyboard.press('1'); await twoFrames(); await page.keyboard.press('r');
      await page.waitForFunction(() => cc.director.getScene().getChildByName('PhysicsLabRoot').getComponent('PhysicsLab').gravityProbe?.samples.has(60), null, { timeout: 15000 });
      await page.keyboard.press('p');
      const samples = events.slice(offset).filter(event => event.test === 'gravity-free-fall');
      check(samples.length === 2, 'Expected both actual gravity samples');
      for (const sample of samples) {
        const discrete = 980 / (60 * 60) * sample.tick * (sample.tick + 1) / 2;
        check(Math.abs(sample.actualDisplacementDu - discrete) < 0.1, 'Gravity unit or integration mismatch');
      }
      return samples;
    });
    const comparisons = [];
    for (const hz of [30, 60, 60]) await caseRun(`FIXED_${hz}_${comparisons.length + 1}`, async () => {
      const offset = events.length;
      await page.keyboard.press(hz === 30 ? '5' : '6'); await page.keyboard.press('v');
      await page.waitForFunction(() => { const l = cc.director.getScene().getChildByName('PhysicsLabRoot').getComponent('PhysicsLab'); return l.clock.tick === 120 && l.clock.paused; }, null, { timeout: 15000 });
      const sample = events.slice(offset).find(event => event.test === 'fixed-step-120');
      check(!!sample && sample.physicsStepCalls === 120 && sample.tick === 120, 'Expected exactly 120 actual world steps');
      comparisons.push(sample); return sample;
    });
    await caseRun('FIXED_REPRODUCIBILITY', async () => {
      check(comparisons.length === 3, 'Missing comparison runs');
      const first = comparisons[0].state;
      for (const sample of comparisons.slice(1)) {
        check(Math.abs(sample.state.positionDu.x - first.positionDu.x) < 0.0001 && Math.abs(sample.state.positionDu.y - first.positionDu.y) < 0.0001, 'Different final positions');
        check(Math.abs(sample.state.velocityDuPerSecond.y - first.velocityDuPerSecond.y) < 0.0001, 'Different final velocities');
      }
      return { positionsIdenticalWithinDu: 0.0001, runs: comparisons.length, autoSimulation: (await read()).autoSimulation };
    });
    await caseRun('PAUSE', async () => {
      await page.keyboard.press('p'); const before = await read(); await page.waitForTimeout(700); const after = await read();
      check(before.tick === after.tick && JSON.stringify(before.states) === JSON.stringify(after.states), 'Paused physics advanced');
      return { before, after, observationMs: 700 };
    });
    await caseRun('BACKGROUND', async () => {
      await page.keyboard.press('r'); await twoFrames();
      const other = await page.context().newPage();
      let before; let hidden;
      try {
        await other.goto('about:blank'); await other.bringToFront();
        // requestAnimationFrame is suspended for hidden pages, so use timer polling for this condition.
        await page.waitForFunction(() => document.visibilityState === 'hidden', null, { polling: 100, timeout: 10000 });
        before = await read(); await page.waitForTimeout(1000); hidden = await read();
      } finally { await other.close(); await page.bringToFront(); await page.locator('#GameCanvas').click(); }
      await page.waitForFunction(() => document.visibilityState === 'visible', null, { polling: 100 }); const foreground = await read();
      check(before.tick === hidden.tick && hidden.tick === foreground.tick && foreground.paused, 'Background or foreground advanced physics');
      await page.keyboard.press('r'); await twoFrames(); const resumed = await read();
      check(resumed.tick - foreground.tick <= 4 && !resumed.paused, 'Background time was replayed');
      await page.keyboard.press('p'); return { before, hidden, foreground, resumed };
    });
    await caseRun('REBUILD_20', async () => {
      await page.bringToFront(); await page.locator('#GameCanvas').click(); await page.keyboard.press('p');
      await page.keyboard.press('c'); await twoFrames(); const baseline = await read();
      await page.keyboard.press('x');
      await page.waitForFunction(() => cc.director.getScene().getChildByName('PhysicsLabRoot').getComponent('PhysicsLab').message.startsWith('连续重建20次'), null, { timeout: 10000 });
      await twoFrames(); const after = await read();
      check(after.entities === 0 && after.contacts === 0 && after.listeners === baseline.listeners && after.worldBodies === baseline.worldBodies, 'Rebuild leaked entities, contacts, listeners or world bodies');
      return { baseline, after };
    });
  } finally { page.off('console', receive); }
  return { engine: 'Creator 3.8.8 integrated Box2D', results, actualConsoleSamples: events, allPassed: results.every(result => result.status === 'PASS') };
}
