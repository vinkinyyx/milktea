async page => {
  const ctx = page.context();
  const target = await ctx.newCDPSession(page);
  let other, otherSession;
  const restoreFocusOverride = true;
  const read = async () => {
    const expression = 'JSON.stringify({visibility:document.visibilityState,hasFocus:document.hasFocus(),tick:cc.director.getScene().getChildByName("PhysicsLabRoot").getComponent("PhysicsLab").clock.tick,paused:cc.director.getScene().getChildByName("PhysicsLabRoot").getComponent("PhysicsLab").clock.paused,events:window.__p1aLifeEvents||[]})';
    const response = await target.send('Runtime.evaluate', { expression, returnByValue: true });
    return JSON.parse(response.result.value);
  };
  try {
    await target.send('Emulation.setFocusEmulationEnabled', { enabled: false });
    await page.bringToFront();
    await page.evaluate(async () => {
      window.__p1aLifeEvents = [];
      document.addEventListener('visibilitychange', event => window.__p1aLifeEvents.push({
        kind: 'visibilitychange', state: document.visibilityState, isTrusted: event.isTrusted, time: Date.now()
      }));
      const engine = await System.import('cc');
      engine.game.on(engine.Game.EVENT_HIDE, () => window.__p1aLifeEvents.push({ kind: 'GAME_HIDE', time: Date.now() }));
      engine.game.on(engine.Game.EVENT_SHOW, () => window.__p1aLifeEvents.push({ kind: 'GAME_SHOW', time: Date.now() }));
    });
    await page.locator('#GameCanvas').click();
    await page.waitForTimeout(800);
    const before = await read();
    other = await ctx.newPage();
    otherSession = await ctx.newCDPSession(other);
    await otherSession.send('Emulation.setFocusEmulationEnabled', { enabled: false });
    await other.goto('about:blank');
    await other.bringToFront();
    let hidden = before;
    const hideDeadline = Date.now() + 10000;
    while (hidden.visibility !== 'hidden' && Date.now() < hideDeadline) {
      await new Promise(resolve => setTimeout(resolve, 100));
      hidden = await read();
    }
    await new Promise(resolve => setTimeout(resolve, 5000));
    const hiddenAfter = await read();
    await page.bringToFront();
    let shown = hiddenAfter;
    const showDeadline = Date.now() + 10000;
    while (shown.visibility !== 'visible' && Date.now() < showDeadline) {
      await new Promise(resolve => setTimeout(resolve, 100));
      shown = await read();
    }
    await new Promise(resolve => setTimeout(resolve, 500));
    const showStable = await read();
    await page.locator('#GameCanvas').click();
    await page.keyboard.press('r');
    await page.waitForTimeout(400);
    const resumed = await read();
    return {
      before, hidden, hiddenAfter, shown, showStable, resumed,
      checks: {
        trustedHidden: hidden.events.some(event => event.kind === 'visibilitychange' && event.state === 'hidden' && event.isTrusted),
        gameHide: hidden.events.some(event => event.kind === 'GAME_HIDE'),
        hiddenFrozen: hidden.tick === hiddenAfter.tick && hidden.paused && hiddenAfter.paused,
        showDoesNotAutoResume: showStable.paused,
        explicitResumeAdvances: resumed.tick > showStable.tick && !resumed.paused
      }
    };
  } finally {
    if (other) await other.close();
    await page.bringToFront();
    await target.send('Emulation.setFocusEmulationEnabled', { enabled: restoreFocusOverride });
    await target.detach();
  }
}
