async page => {
  await page.bringToFront();
  await page.locator('#GameCanvas').click();
  await page.waitForFunction(() => window.cc?.director?.getScene()?.getChildByName('PhysicsLabRoot')?.getComponent('PhysicsLab')?.ready, null, { timeout: 30000 });
  await page.evaluate(() => {
    const lab = cc.director.getScene().getChildByName('PhysicsLabRoot').getComponent('PhysicsLab');
    const prototype = Object.getPrototypeOf(lab.adapter);
    const originalStep = prototype.stepFixed;
    window.__p1aLegacyProbe = { samples: [], startedAt: performance.now(), restored: false };
    prototype.stepFixed = function () {
      originalStep.call(this);
      const entities = [];
      for (const [id, ref] of this.bodies) {
        const state = this.getBody(id);
        const x = state.positionDu.x; const y = state.positionDu.y; const r = ref.radiusDu;
        const signed = (x0, y0, x1, y1) => {
          const dx = x1 - x0; const dy = y1 - y0;
          const t = ((x - x0) * dx + (y - y0) * dy) / (dx * dx + dy * dy);
          if (t < 0 || t > 1) return null;
          return ((x - x0) * (-dy) + (y - y0) * dx) / Math.hypot(dx, dy) - r;
        };
        entities.push({ id, x, y, r, bottom: y - r - 260,
          left: signed(195, 260, 115, 1060), right: signed(635, 1060, 555, 260) });
      }
      window.__p1aLegacyProbe.samples.push({ tick: lab.clock.tick + 1, entities, contacts: this.contactCount });
    };
    window.__p1aLegacyProbe.restore = () => { prototype.stepFixed = originalStep; window.__p1aLegacyProbe.restored = true; };
  });
  let result;
  try {
    await page.keyboard.press('4');
    await page.waitForFunction(() => cc.director.getScene().getChildByName('PhysicsLabRoot').getComponent('PhysicsLab').adapter.entityCount === 220, null, { timeout: 10000 });
    await page.keyboard.press('r');
    await page.waitForFunction(() => cc.director.getScene().getChildByName('PhysicsLabRoot').getComponent('PhysicsLab').clock.tick >= 30, null, { timeout: 5000 });
    const startedAt = Date.now();
    await page.waitForTimeout(70000);
    const endedAt = Date.now();
    result = await page.evaluate(({ startedAt, endedAt }) => {
      const lab = cc.director.getScene().getChildByName('PhysicsLabRoot').getComponent('PhysicsLab');
      const probe = window.__p1aLegacyProbe;
      return { buildId: lab.probe.identity.buildId, attemptId: lab.probe.identity.attemptId,
        probeVersion: 'legacy-continuous-three-adapted-220-v1', wallDurationMs: endedAt - startedAt,
        tick: lab.clock.tick, stepCount: lab.adapter.stepCount, paused: lab.clock.paused, message: lab.message,
        entities: lab.adapter.entityCount, sampleCount: probe.samples.length,
        bodySnapshots: probe.samples.reduce((sum, sample) => sum + sample.entities.length, 0) };
    }, { startedAt, endedAt });
  } finally {
    await page.evaluate(() => window.__p1aLegacyProbe?.restore?.());
  }
  return result;
}
