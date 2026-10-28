async page => {
  await page.bringToFront();
  await page.locator('#GameCanvas').click();
  await page.waitForFunction(() => window.cc?.director?.getScene()?.getChildByName('PhysicsLabRoot')?.getComponent('PhysicsLab')?.ready, null, { timeout: 30000 });
  await page.keyboard.press('4');
  await page.waitForFunction(() => cc.director.getScene().getChildByName('PhysicsLabRoot').getComponent('PhysicsLab').adapter.entityCount === 220, null, { timeout: 10000 });
  await page.keyboard.press('r');
  await page.waitForFunction(() => cc.director.getScene().getChildByName('PhysicsLabRoot').getComponent('PhysicsLab').clock.tick >= 30, null, { timeout: 5000 });
  const startedAt = Date.now();
  await page.waitForTimeout(70000);
  const endedAt = Date.now();
  return await page.evaluate(({ startedAt, endedAt }) => {
    const lab = cc.director.getScene().getChildByName('PhysicsLabRoot').getComponent('PhysicsLab');
    const states = Array.from(lab.visuals.keys(), id => lab.adapter.getBody(id));
    const probe = window.__p1aProbe.export();
    const summarize = key => {
      const values = probe.frames.map(frame => frame[key]).filter(Number.isFinite).sort((a, b) => a - b);
      const at = q => values.length ? values[Math.min(values.length - 1, Math.floor(q * values.length))] : null;
      return { count: values.length, p50: at(0.50), p95: at(0.95), p99: at(0.99), max: values.length ? values[values.length - 1] : null };
    };
    return { metadata: probe.metadata, coverage: probe.coverage, wallDurationMs: endedAt - startedAt,
      tick: lab.clock.tick, stepCount: lab.adapter.stepCount, paused: lab.clock.paused, message: lab.message,
      entities: lab.adapter.entityCount, finiteBodies: states.filter(state => state && Number.isFinite(state.positionDu.x) && Number.isFinite(state.positionDu.y)).length,
      timings: Object.fromEntries(['wallGapMs', 'engineDtMs', 'steps', 'adapterMs', 'viewMs', 'frameWorkMs', 'probeMs'].map(key => [key, summarize(key)])) };
  }, { startedAt, endedAt });
}
