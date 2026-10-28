async page => {
  const context = page.context();
  const browserSession = await context.browser().newBrowserCDPSession();
  let control, helper, controlSession, helperSession;
  const result = { schemaVersion: 1, purpose: 'real-tab-visibility-control', syntheticEventsUsed: false,
    originalUrl: page.url(), startedAt: new Date().toISOString(), observations: [] };
  const expression = `JSON.stringify({visibility:document.visibilityState,hidden:document.hidden,
    hasFocus:document.hasFocus(),events:window.__visibilityEvents||[]})`;
  const read = async session => {
    const response = await session.send('Runtime.evaluate', { expression, returnByValue: true });
    return JSON.parse(response.result.value);
  };
  const observe = async label => result.observations.push({ label,
    control: await read(controlSession), helper: await read(helperSession) });
  try {
    control = await context.newPage();
    await control.goto('about:blank');
    await control.evaluate(() => {
      document.title = 'P1A visibility control'; window.__visibilityEvents = [];
      document.addEventListener('visibilitychange', event => window.__visibilityEvents.push({
        visibility: document.visibilityState, trusted: event.isTrusted, at: performance.now() }));
    });
    controlSession = await context.newCDPSession(control);
    const controlInfo = await controlSession.send('Target.getTargetInfo');
    helper = await context.newPage();
    await helper.goto('about:blank');
    await helper.evaluate(() => { document.title = 'P1A visibility helper'; });
    helperSession = await context.newCDPSession(helper);
    const helperInfo = await helperSession.send('Target.getTargetInfo');
    result.browser = await browserSession.send('Browser.getVersion');
    result.windows = {
      control: await browserSession.send('Browser.getWindowForTarget', { targetId: controlInfo.targetInfo.targetId }),
      helper: await browserSession.send('Browser.getWindowForTarget', { targetId: helperInfo.targetInfo.targetId }) };
    await helper.bringToFront();
    await new Promise(resolve => setTimeout(resolve, 500));
    await observe('default-helper-front');
    await controlSession.send('Emulation.setFocusEmulationEnabled', { enabled: false });
    await helperSession.send('Emulation.setFocusEmulationEnabled', { enabled: false });
    await helper.bringToFront();
    await new Promise(resolve => setTimeout(resolve, 500));
    await observe('both-overrides-disabled-sessions-attached');
    await control.bringToFront();
    await new Promise(resolve => setTimeout(resolve, 200));
    await observe('control-front');
    await helper.bringToFront();
    await new Promise(resolve => setTimeout(resolve, 500));
    await observe('real-switch-back-to-helper');
    await controlSession.detach(); controlSession = await context.newCDPSession(control);
    await new Promise(resolve => setTimeout(resolve, 200));
    await observe('control-disabled-session-detached-new-reader');
    // The default focus override belongs to Playwright's original protocol session.
    // A second session has its own browser-side capture handle and cannot release it.
    const primary = candidate => {
      const implementation = candidate._connection?.toImpl?.(candidate);
      const client = implementation?.delegate?._mainFrameSession?._client;
      if (!client?.send) throw new Error('Installed Playwright primary session route unavailable');
      return client;
    };
    result.primarySessionRoute = 'inprocess Page.delegate._mainFrameSession._client';
    await primary(control).send('Emulation.setFocusEmulationEnabled', { enabled: false });
    await primary(helper).send('Emulation.setFocusEmulationEnabled', { enabled: false });
    await control.bringToFront();
    await new Promise(resolve => setTimeout(resolve, 200));
    await control.evaluate(() => { window.__visibilityEvents = []; });
    await observe('original-session-disabled-control-front');
    await helper.bringToFront();
    await new Promise(resolve => setTimeout(resolve, 500));
    await observe('original-session-disabled-real-switch-to-helper');
    await control.bringToFront();
    await new Promise(resolve => setTimeout(resolve, 200));
    await observe('original-session-disabled-real-return');
    result.finishedAt = new Date().toISOString();
    return result;
  } finally {
    if (controlSession) await controlSession.detach();
    if (helperSession) await helperSession.detach();
    if (helper) await helper.close();
    if (control) await control.close();
    await browserSession.detach();
    await page.bringToFront();
  }
}
