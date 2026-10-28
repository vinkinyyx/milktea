async page => {
  await page.bringToFront();
  await page.locator('#GameCanvas').click();
  await page.waitForFunction(() => window.cc?.director?.getScene()?.getChildByName('PhysicsLabRoot')?.getComponent('PhysicsLab')?.ready, null, { timeout: 30000 });
  await page.keyboard.press('4');
  await page.waitForFunction(() => {
    const lab = cc.director.getScene().getChildByName('PhysicsLabRoot').getComponent('PhysicsLab');
    return lab.adapter.entityCount === 220;
  }, null, { timeout: 10000 });
  await page.keyboard.press('r');
  await page.waitForFunction(() => cc.director.getScene().getChildByName('PhysicsLabRoot').getComponent('PhysicsLab').clock.tick >= 30, null, { timeout: 5000 });
  const startedAt = Date.now();
  await page.waitForTimeout(70000);
  const endedAt = Date.now();
  return await page.evaluate(({ startedAt, endedAt }) => {
    const lab = cc.director.getScene().getChildByName('PhysicsLabRoot').getComponent('PhysicsLab');
    const states = Array.from(lab.visuals.keys(), id => lab.adapter.getBody(id));
    return { buildId: lab.probe.identity.buildId, attemptId: lab.probe.identity.attemptId, probeVersion: lab.probe.identity.probeVersion,
      mode: lab.probe.mode, wallDurationMs: endedAt - startedAt, tick: lab.clock.tick, stepCount: lab.adapter.stepCount,
      paused: lab.clock.paused, message: lab.message, entities: lab.adapter.entityCount,
      finiteBodies: states.filter(state => state && Number.isFinite(state.positionDu.x) && Number.isFinite(state.positionDu.y)).length };
  }, { startedAt, endedAt });
}
