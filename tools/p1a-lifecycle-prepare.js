async page => {
  const state = await page.evaluate(() => window.__p1aLab?.status?.() ?? null);
  const session = await page.context().newCDPSession(page);
  await session.send('Emulation.setFocusEmulationEnabled', { enabled: false });
  await page.evaluate(() => {
    window.__p1aHostCapture = [];
    document.addEventListener('visibilitychange', event => window.__p1aHostCapture.push({ trusted:event.isTrusted,
      visibility:document.visibilityState, at:performance.now(), tick:window.__p1aLab?.status?.().tick,
      stepCount:window.__p1aLab?.status?.().stepCount, entityCount:window.__p1aLab?.status?.().entityCount,
      bodies:window.__p1aLab?.snapshot?.().bodies }));
  });
  await page.bringToFront();
  await page.waitForTimeout(1000);
  const paused = await page.evaluate(() => window.__p1aLab?.status?.() ?? null);
  if (paused?.paused && paused.pauseReasons.every(reason => ['BACKLOG','RESUME_REQUIRED','MANUAL','SAMPLE_COMPLETE'].includes(reason))) {
    await page.locator('#GameCanvas').click(); await page.keyboard.press('r');
    await page.waitForFunction(() => !window.__p1aLab.status().paused, null, { timeout:10000 });
  }
  const visible = await page.evaluate(() => ({ visibility:document.visibilityState, hasFocus:document.hasFocus(),
    lifecycle:window.__p1aLifecycle?.snapshot?.(), status:window.__p1aLab?.status?.() ?? null }));
  await session.detach();
  return { stateBefore:state, visibleBeforeSwitch:visible, focusOverrideDisabled:true, syntheticEventsUsed:false };
}
