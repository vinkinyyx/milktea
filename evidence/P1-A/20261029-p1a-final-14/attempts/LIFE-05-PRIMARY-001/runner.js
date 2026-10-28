async page => {
  const query = new URL(page.url()).searchParams;
  const caseId = query.get('p1aCase');
  const result = { schemaVersion: 1, caseId, attemptId: query.get('attemptId'),
    buildId: null, expectedBuildId: query.get('expectedBuildId'),
    startedAt: new Date().toISOString(), syntheticEventsUsed: false,
    focusOverrideRoute: 'Playwright original session; version-checked local inprocess client', checks: {} };
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  const primary = candidate => {
    const client = candidate._connection?.toImpl?.(candidate)?.delegate?._mainFrameSession?._client;
    if (!client?.send) throw new Error('PRIMARY_SESSION_UNAVAILABLE: verify installed Playwright; do not fall back to a second session');
    return client;
  };
  const readInPage = () => {
    let status = null, bodies = [], worldId = null, readError = null;
    try { status = window.__p1aLab?.status?.() ?? null; const snapshot = window.__p1aLab?.snapshot?.();
      bodies = snapshot?.bodies ?? []; worldId = snapshot?.worldId ?? null; }
    catch (error) { readError = String(error); }
    return { atMs: performance.now(), visibility: document.visibilityState, hasFocus: document.hasFocus(),
      scene: window.cc?.director?.getScene?.()?.name ?? null, status, bodies, worldId, readError,
      lifecycle: window.__p1aLifecycle?.snapshot?.() ?? null };
  };
  let helper, helperPrimary, reader, releaseLoad, loadPattern;
  let routeHits = 0, continuedHits = 0;
  const expression = `(${readInPage.toString()})()`;
  const read = async () => {
    const response = await reader.send('Runtime.evaluate', { expression, returnByValue: true });
    if (response.exceptionDetails) throw new Error(JSON.stringify(response.exceptionDetails));
    return response.result.value;
  };
  const until = async (label, predicate, timeout = 15000) => {
    const deadline = Date.now() + timeout;
    let state;
    do { state = await read(); if (predicate(state)) return state; await sleep(50); } while (Date.now() < deadline);
    throw new Error(`${label}: ${JSON.stringify(state?.status ?? state)}`);
  };
  const physical = state => JSON.stringify({ tick: state.status?.tick, stepCount: state.status?.stepCount,
    worldId: state.worldId, entityCount: state.status?.entityCount, bodies: state.bodies,
    queue: state.status?.queue, rebuild: state.status?.contactRebuild });
  const installCapture = async () => page.evaluate(readSource => {
    const sample = (0, eval)(`(${readSource})`);
    window.__p1aRealLifeCapture = [];
    document.addEventListener('visibilitychange', event => window.__p1aRealLifeCapture.push({
      trusted: event.isTrusted, ...sample() }));
  }, readInPage.toString());
  const capture = async () => {
    const response = await reader.send('Runtime.evaluate', {
      expression: 'window.__p1aRealLifeCapture || []', returnByValue: true });
    return response.result.value;
  };
  const active = async () => {
    await until('READY_TIMEOUT', state => state.status?.ready && !state.status.pauseReasons.includes('REBUILD')
      && state.visibility === 'visible' && state.lifecycle?.backgrounded === false, 90000);
    await page.locator('#GameCanvas').click();
    const state = await read();
    if (state.status.paused) { await page.keyboard.press('r'); }
    return until('ACTIVE_TIMEOUT', current => current.status?.ready && !current.status.paused && current.status.tick > 0);
  };
  try {
    await primary(page).send('Emulation.setFocusEmulationEnabled', { enabled: false });
    reader = await page.context().newCDPSession(page);
    await page.bringToFront();
    await active();
    result.buildId = (await read()).status.buildId;
    result.checks.identity = result.buildId === result.expectedBuildId;
    if (!result.checks.identity) throw new Error('BUILD_ID_MISMATCH');
    helper = await page.context().newPage(); await helper.goto('about:blank');
    helperPrimary = primary(helper);
    await helperPrimary.send('Emulation.setFocusEmulationEnabled', { enabled: false });
    await page.bringToFront();
    await active();

    if (caseId === 'LIFE-10') {
      result.baseline = await page.evaluate(() => {
        const before = window.__p1aLab.status(); const started = performance.now();
        while (performance.now() - started < 250) { /* One intentional foreground main-thread stall. */ }
        return { status: before, blockedMs: performance.now() - started, visibility: document.visibilityState };
      });
      result.afterStall = await until('BACKLOG_NOT_OBSERVED', state => state.status?.pauseReasons.includes('BACKLOG'));
      result.checks.backlogProtected = result.afterStall.status.paused
        && result.afterStall.status.stepCount - result.baseline.status.stepCount === 5;
      result.checks.foreground = result.afterStall.visibility === 'visible' && result.baseline.visibility === 'visible';
    } else {
      const isLoad = caseId === 'LIFE-07' || caseId === 'LIFE-08';
      if (isLoad) {
        loadPattern = caseId === 'LIFE-08' ? '**/*cbe4ae2c-d9d3-5cef-bc22-3f5721e44258.json*' : '**/*7e08f8b2-a421-4035-b60c-a37571e221d3.png*';
        const gate = new Promise(resolve => { releaseLoad = resolve; });
        await page.route(loadPattern, async route => { routeHits++; await gate; continuedHits++; await route.continue(); });
        await page.reload({ waitUntil: 'domcontentloaded' });
        await primary(page).send('Emulation.setFocusEmulationEnabled', { enabled: false });
        await until('LOAD_ROUTE_NOT_HIT', state => routeHits > 0 && state.lifecycle !== null, 45000);
        result.loadingBeforeHide = await read();
        result.checks.loadHeld = routeHits > 0 && !result.loadingBeforeHide.status?.ready;
      } else {
        await page.keyboard.press('2'); await active();
        if (caseId === 'LIFE-04' || caseId === 'LIFE-06') await page.keyboard.press('p');
        if (caseId === 'LIFE-05' || caseId === 'LIFE-06') await page.keyboard.press('g');
        if (caseId === 'LIFE-09-QUEUE') await page.keyboard.press('3');
        if (caseId === 'LIFE-09-REBUILD') await page.evaluate(() => window.__p1aLab.startContactRebuild());
      }
      await installCapture();
      result.beforeHide = await read();
      await helper.bringToFront();
      result.hiddenStart = await until('TRUSTED_HIDDEN_NOT_OBSERVED', state => state.visibility === 'hidden'
        && state.lifecycle?.backgrounded === true);
      const hidingEvents = await capture();
      result.hideEvent = hidingEvents.find(event => event.visibility === 'hidden' && event.trusted);
      result.checks.trustedHidden = !!result.hideEvent;
      result.checks.engineHide = result.hiddenStart.lifecycle.events.some(event => event.source === 'engine' && event.hidden
        && event.atMs >= result.beforeHide.atMs);
      if (isLoad) { releaseLoad(); await sleep(1000); result.loadReleasedWhileHidden = await read(); }
      const durationMs = Number(query.get('durationMs') ?? (caseId === 'LIFE-03' ? 300000 : caseId === 'LIFE-02' ? 60000 : 5000));
      result.requestedHiddenMs = durationMs;
      result.hiddenSamples = [];
      const deadline = Date.now() + durationMs;
      while (Date.now() < deadline) {
        await sleep(Math.min(30000, Math.max(1, deadline - Date.now())));
        result.hiddenSamples.push(await read());
      }
      result.hiddenEnd = await read();
      result.actualHiddenMs = result.hiddenEnd.atMs - result.hiddenStart.atMs;
      result.checks.continuousHidden = result.hiddenEnd.visibility === 'hidden'
        && result.hiddenSamples.every(state => state.visibility === 'hidden') && result.actualHiddenMs >= durationMs;
      result.checks.frozenWhileHidden = isLoad
        ? result.hiddenSamples.every(state => !state.status || state.status.tick <= 0)
        : result.hiddenSamples.every(state => physical(state) === physical(result.hiddenStart))
          && physical(result.hiddenEnd) === physical(result.hiddenStart);
      await page.bringToFront(); await sleep(500);
      result.shown = await read();
      if (isLoad) result.shown = await until('INIT_NOT_READY_AFTER_SHOW', state => state.status?.ready, 90000);
      result.events = await capture();
      result.checks.trustedShown = result.events.some(event => event.visibility === 'visible' && event.trusted);
      result.checks.engineShow = result.shown.lifecycle.events.some(event => event.source === 'engine' && !event.hidden
        && event.atMs >= result.hiddenEnd.atMs);
      result.checks.showStillPaused = result.shown.status?.paused === true
        && result.shown.status.pauseReasons.includes('RESUME_REQUIRED');
      if (caseId === 'LIFE-04' || caseId === 'LIFE-06') result.checks.manualOwnerRetained = result.shown.status.pauseReasons.includes('MANUAL');
      if (caseId === 'LIFE-05' || caseId === 'LIFE-06') {
        result.checks.galleryRetained = result.shown.status.pauseReasons.includes('GALLERY');
        await page.keyboard.press('g'); await sleep(200);
        result.afterGalleryClosed = await read();
        result.checks.galleryDoesNotResume = result.afterGalleryClosed.status.paused
          && !result.afterGalleryClosed.status.pauseReasons.includes('GALLERY');
      }
      if (isLoad) {
        result.routeHits = routeHits; result.continuedHits = continuedHits;
        result.checks.initNeverSteppedBeforeResume = result.shown.status.tick === 0 && result.shown.status.stepCount === 0;
      }
      if (caseId === 'LIFE-09-QUEUE') result.checks.queueOwnerStable = result.shown.status.queue?.taskId === result.beforeHide.status.queue?.taskId;
      if (caseId === 'LIFE-09-REBUILD') result.checks.rebuildOwnerStable = result.shown.status.contactRebuild?.attemptId === result.beforeHide.status.contactRebuild?.attemptId;
      result.beforeResume = await read();
      await page.locator('#GameCanvas').click(); await page.keyboard.press('r');
      result.resumed = await until('EXPLICIT_RESUME_DID_NOT_ADVANCE', state => state.status?.tick > result.beforeResume.status.tick);
      result.checks.explicitResumeAdvances = result.resumed.status.tick > result.beforeResume.status.tick
        && !result.resumed.status.pauseReasons.includes('BACKGROUND') && !result.resumed.status.pauseReasons.includes('RESUME_REQUIRED');
      if (caseId === 'LIFE-09-REBUILD') {
        result.completedRebuild = await until('REBUILD_NOT_COMPLETED_AFTER_RESUME', state => state.status?.contactRebuild?.status !== 'RUNNING', 45000);
        result.checks.rebuildCompletes = result.completedRebuild.status.contactRebuild.status === 'PASS'
          && result.completedRebuild.status.contactRebuild.records.length === 20;
      }
    }
    result.pass = Object.values(result.checks).every(value => value === true);
    result.acceptance = result.pass ? 'PASS' : 'FAIL';
  } catch (error) {
    result.error = String(error); result.pass = false; result.acceptance = 'FAIL';
    if (reader) { try { result.failureState = await read(); result.events = await capture(); } catch (readError) { result.readError = String(readError); } }
  } finally {
    if (releaseLoad) releaseLoad();
    if (loadPattern) await page.unroute(loadPattern);
    if (helperPrimary) await helperPrimary.send('Emulation.setFocusEmulationEnabled', { enabled: true });
    if (helper) await helper.close();
    if (reader) await reader.detach();
    await page.bringToFront();
    await primary(page).send('Emulation.setFocusEmulationEnabled', { enabled: true });
  }
  result.finishedAt = new Date().toISOString();
  return result;
}
