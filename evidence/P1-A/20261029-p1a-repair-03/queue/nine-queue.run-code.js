async page => {
  await page.bringToFront();
  await page.locator('#GameCanvas').click();
  await page.waitForFunction(() => window.cc?.director?.getScene()?.getChildByName('PhysicsLabRoot')?.getComponent('PhysicsLab')?.ready, null, { timeout: 30000 });
  const events = [];
  const onConsole = message => {
    const text = message.text();
    if (!text.includes('nine-size-queue')) return;
    try { events.push(JSON.parse(text)); } catch (error) { events.push({ parseError: String(error), text }); }
  };
  page.on('console', onConsole);
  try {
    await page.keyboard.press('3');
    await page.keyboard.press('r');
    await page.waitForFunction(() => {
      const lab = cc.director.getScene().getChildByName('PhysicsLabRoot').getComponent('PhysicsLab');
      return lab.queueState?.state === 'BLOCKED_FINAL';
    }, null, { timeout: 30000 });
    const terminal = await page.evaluate(() => {
      const lab = cc.director.getScene().getChildByName('PhysicsLabRoot').getComponent('PhysicsLab');
      return { state: lab.queueState.state, taskId: lab.queueState.taskId, level: lab.queueState.level,
        attempts: lab.queueState.attempts, records: lab.queueState.records.slice(), message: lab.message };
    });
    await page.waitForTimeout(2000);
    const after = await page.evaluate(() => {
      const lab = cc.director.getScene().getChildByName('PhysicsLabRoot').getComponent('PhysicsLab');
      return { state: lab.queueState.state, attempts: lab.queueState.attempts, entities: lab.adapter.entityCount };
    });
    return { buildId: (await page.evaluate(() => window.__p1aProbe?.export?.().metadata?.buildId)) ?? '20261029-p1a-repair-03',
      terminal, after, events, terminalStable: terminal.attempts === after.attempts && after.state === 'BLOCKED_FINAL' };
  } finally { page.off('console', onConsole); }
}
