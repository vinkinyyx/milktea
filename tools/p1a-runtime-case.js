async page => {
  const query = new URL(page.url()).searchParams;
  const caseId = query.get('p1aCase');
  const attemptId = query.get('attemptId');
  const expectedBuildId = query.get('expectedBuildId');
  const buildId = await page.evaluate(() => window.__p1aLab?.status?.().buildId ?? null);
  const consoleEvents = [];
  const pageErrors = [];
  const onConsole = message => {
    const value = message.text();
    if (/p1a-runtime-identity|nine-size-queue|contact-rebuild-(start|result)|contact-matrix-(start|result)|pressure-layout-preflight|fixed-step-120/.test(value)) consoleEvents.push(value);
  };
  const onPageError = error => pageErrors.push(String(error));
  page.on('console', onConsole); page.on('pageerror', onPageError);
  const waitReady = () => page.waitForFunction(() => {
    try { return window.__p1aLab?.status?.().ready === true; } catch { return false; }
  }, null, { timeout: 90000 });
  const status = () => page.evaluate(() => { try { return window.__p1aLab?.status?.() ?? null; } catch { return null; } });
  const fullSnapshot = () => page.evaluate(() => window.__p1aLab?.snapshot?.() ?? null);
  const tapControl = async (name, gallery = false) => {
    const point = await page.evaluate(({name,gallery}) => {
      const labRoot = cc.director.getScene()?.getChildByName('PhysicsLabRoot');
      const root = gallery ? labRoot?.children.find(node => node.name === 'P1ArtGallery') : labRoot?.getChildByName('P1TouchControls');
      const node = root?.children.find(child => child.name === `${gallery ? 'GalleryTouch' : 'Touch'}-${name}`);
      if (!node) throw new Error(`Touch control missing: ${name}`);
      const p = node.worldPosition; const rect = document.querySelector('#GameCanvas').getBoundingClientRect();
      const scale = Math.min(rect.width / 750, rect.height / 1334);
      return { x:rect.left + rect.width / 2 + p.x * scale, y:rect.top + rect.height / 2 - p.y * scale,
        world:{x:p.x,y:p.y}, rect:{x:rect.x,y:rect.y,width:rect.width,height:rect.height},scale };
    }, {name,gallery});
    await page.mouse.click(point.x, point.y); return point;
  };
  const saveShot = async name => {
    const dir = query.get('artifactDir'); if (!dir) return null;
    const path = `${dir}/${name}.png`;
    await page.screenshot({ path, fullPage: true }); return path;
  };
  const result = { caseId, attemptId, buildId, expectedBuildId, pageUrl: page.url(), startedAt: new Date().toISOString() };
  try {
    if (caseId === 'config-404-retry' || caseId === 'config-malformed-retry' || caseId === 'config-invalid-retry' || caseId === 'config-destroy-during-load') {
      const configImport = '**/*cbe4ae2c-d9d3-5cef-bc22-3f5721e44258.json*';
      const requestUrls = []; const onRequest = request => requestUrls.push(request.url()); page.on('request', onRequest);
      let routeHits = 0; let injectedHits = 0; let recoveryHits = 0; let allowRecovery = false; let releaseConfig;
      const configGate = caseId === 'config-destroy-during-load' ? new Promise(resolve => { releaseConfig = resolve; }) : null;
      await page.route(configImport, async route => {
        routeHits++;
        if (configGate) {
          await configGate;
          try { if (!route.request().failure()) return await route.continue(); }
          catch (error) { result.cancelledStaleConfigRequest = String(error); }
          return;
        }
        if (allowRecovery) { recoveryHits++; return route.continue(); }
        injectedHits++;
        if (caseId === 'config-404-retry') return route.fulfill({ status: 404, body: 'injected missing config' });
        if (caseId === 'config-malformed-retry') return route.fulfill({ status: 200, contentType: 'application/json', body: '{' });
        const response = await route.fetch(); const data = await response.json(); data[5][0][2].physics.density_relative = 0;
        return route.fulfill({ response, json: data });
      });
      await page.reload();
      if (configGate) {
        const deadline = Date.now() + 30000; while (routeHits === 0 && Date.now() < deadline) await page.waitForTimeout(50);
        result.routeHeld = routeHits > 0; result.beforeDestroy = await page.evaluate(() => ({ scene: cc.director.getScene()?.name,
          lifecycle: window.__p1aLifecycle.snapshot(), appLoading: cc.director.getScene()?.getChildByName('BootRoot')?.getComponent('AppRoot')?.loading }));
        await page.evaluate(() => cc.director.loadScene('PhysicsLab'));
        await page.waitForFunction(() => cc.director.getScene()?.name === 'PhysicsLab', null, { timeout: 30000 });
        await page.unroute(configImport); releaseConfig(); await page.waitForTimeout(1000);
        result.afterStaleCallback = await page.evaluate(() => {
          try { const state = window.__p1aLab?.status?.(); return { scene: cc.director.getScene()?.name, hasRules: !!state?.ready,
            bodies: state?.entityCount ?? 0, statusError: null }; }
          catch (error) { return { scene: cc.director.getScene()?.name, hasRules: false, bodies: 0, statusError: String(error) }; }
        });
        await page.evaluate(() => cc.director.loadScene('Boot')); await waitReady();
        result.afterNewOwner = await status(); result.routeHits = routeHits;
        result.recovered = result.afterNewOwner?.ready === true && result.afterNewOwner.entityCount === 3;
      } else {
        try {
          await page.waitForFunction(() => window.cc?.director?.getScene()?.getChildByName('BootRoot')?.getChildByName('ConfigErrorRetry'), null, { timeout: 20000 });
        } catch (error) {
          result.routeHits = routeHits; result.requestUrls = requestUrls.filter(url => /cbe4ae2c|config\.json|design-baseline/i.test(url));
          result.waitError = String(error); result.currentScene = await page.evaluate(() => cc.director.getScene()?.name);
          result.currentStatus = await status(); result.failureScreenshot = await saveShot(`${caseId}-injection-missed`);
          result.pass = false; result.acceptance = 'FAIL';
          page.off('request', onRequest); return result;
        }
        result.failureVisible = await page.evaluate(() => {
          const scene = cc.director.getScene(); const root = scene.getChildByName('BootRoot'); const app = root.getComponent('AppRoot');
          return { scene: scene.name, label: root.getChildByName('ConfigErrorRetry').getComponent('cc.Label').string,
            loadError: app.retryNode?.isValid };
        });
        result.failureScreenshot = await saveShot(`${caseId}-failure`);
        allowRecovery = true;
        await page.locator('#GameCanvas').click({ clickCount: caseId === 'config-invalid-retry' ? 3 : 1, delay: 25 });
        await waitReady();
        result.afterRetry = await status(); result.routeHits = routeHits;
        result.injectedHits = injectedHits; result.recoveryHits = recoveryHits;
        await page.unroute(configImport);
        result.recovered = result.afterRetry?.ready === true && result.afterRetry.entityCount === 3;
        result.singleSuccessfulRetry = result.recoveryHits === 1;
      }
      page.off('request', onRequest);
    } else if (caseId === 'image-404-retry' || caseId === 'image-404-click' || caseId === 'image-404-key') {
      const image = '**/assets/resources/native/7e/7e08f8b2-a421-4035-b60c-a37571e221d3.png'; let routeHits = 0; const requestUrls = [];
      const requestListener = request => requestUrls.push(request.url()); page.on('request', requestListener);
      await page.route(image, route => { routeHits++; return route.fulfill({ status: 404, body: 'injected missing image' }); });
      await page.reload();
      try { await page.waitForFunction(() => window.__p1aLab?.status?.().message?.includes('美术加载失败'), null, { timeout: 30000 }); }
      catch (error) { result.routeHits = routeHits; result.requestUrls = requestUrls.filter(url => /7e08f8b2|\.png(?:\?|$)/i.test(url));
        result.currentScene = await page.evaluate(() => window.cc?.director?.getScene()?.name ?? null); result.currentStatus = await status();
        result.waitError = String(error); result.failureScreenshot = await saveShot(`${caseId}-injection-missed`);
        result.pass = false; result.acceptance = 'FAIL'; await page.unroute(image); page.off('request', requestListener); return result; }
      result.failure = await status(); result.failureScreenshot = await saveShot('image-404-failure');
      await page.unroute(image);
      if (caseId === 'image-404-key') {
        await page.evaluate(() => { window.__p1aKeyEvents = [];
          window.addEventListener('keydown', e => window.__p1aKeyEvents.push({key:e.key,code:e.code,keyCode:e.keyCode,trusted:e.isTrusted})); });
        await page.bringToFront(); await page.keyboard.press('t');
      } else await page.locator('#GameCanvas').click();
      try { await waitReady(); }
      catch (error) { result.routeHits = routeHits; result.keyEvents = caseId === 'image-404-key' ? await page.evaluate(() => window.__p1aKeyEvents) : [];
        result.retryError = String(error); result.pass = false; result.acceptance = 'FAIL'; page.off('request', requestListener); return result; }
      result.keyEvents = caseId === 'image-404-key' ? await page.evaluate(() => window.__p1aKeyEvents) : [];
      result.afterRetry = await status(); result.routeHits = routeHits;
      result.recovered = result.afterRetry?.ready === true && result.afterRetry.entityCount === 3;
      page.off('request', requestListener);
    } else if (caseId === 'image-retry-burst') {
      const image = '**/assets/resources/native/7e/7e08f8b2-a421-4035-b60c-a37571e221d3.png'; let routeHits = 0; const requestUrls = [];
      const requestListener = request => requestUrls.push(request.url()); page.on('request', requestListener);
      await page.route(image, route => { routeHits++; return routeHits <= 8 ? route.fulfill({ status: 404, body: `injected failure ${routeHits}` }) : route.continue(); });
      await page.reload();
      try { await page.waitForFunction(() => window.__p1aLab?.status?.().message?.includes('美术加载失败'), null, { timeout: 30000 }); }
      catch (error) { result.routeHits = routeHits; result.requestUrls = requestUrls.filter(url => /7e08f8b2|\.png(?:\?|$)/i.test(url));
        result.currentScene = await page.evaluate(() => window.cc?.director?.getScene()?.name ?? null);
        result.currentStatus = await status(); result.waitError = String(error); result.failureScreenshot = await saveShot('image-burst-injection-missed');
        result.pass = false; result.acceptance = 'FAIL'; page.off('request', requestListener); return result; }
      result.failures = [];
      for (let i = 0; i < 1; i++) {
        await page.locator('#GameCanvas').click();
        const hitDeadline = Date.now() + 30000; while (routeHits < 5 && Date.now() < hitDeadline) await page.waitForTimeout(50);
        if (routeHits < 5) throw new Error(`retry route hit ${routeHits}, expected at least 5`);
        await page.waitForFunction(() => window.__p1aLab?.status?.().message?.includes('美术加载失败') && !window.__p1aLab.status().loading, null, { timeout: 30000 });
        result.failures.push(await status());
      }
      await page.keyboard.press('t'); await waitReady();
      result.afterUniqueRecovery = await status(); result.routeHits = routeHits;
      result.recovered = result.routeHits === 9 && result.afterUniqueRecovery?.ready === true && result.afterUniqueRecovery.entityCount === 3;
    } else if (caseId === 'destroy-during-image-load') {
      const image = '**/assets/resources/native/**/*.png';
      let routeHits = 0; const requestUrls = []; let releaseRequest;
      const gate = new Promise(resolve => { releaseRequest = resolve; });
      await page.route(image, async route => {
        routeHits++; requestUrls.push(route.request().url()); await gate;
        try { if (!route.request().failure()) return await route.continue(); }
        catch (error) { result.cancelledOldImageRequest = String(error); }
      });
      await page.reload();
      await page.waitForFunction(() => window.cc?.director?.getScene()?.name === 'PhysicsLab', null, { timeout: 90000 });
      await page.waitForFunction(() => window.__p1aLab?.status?.().loading === true, null, { timeout: 30000 });
      await page.waitForFunction(() => window.__p1aLab?.status?.().ready === false, null, { timeout: 5000 });
      result.beforeDestroy = await status();
      await page.evaluate(() => cc.director.loadScene('Boot'));
      await page.waitForFunction(() => window.cc?.director?.getScene()?.name === 'Boot', null, { timeout: 30000 });
      await page.unroute(image); releaseRequest(); await waitReady();
      result.afterNewOwner = await status(); result.routeHits = routeHits; result.requestUrls = requestUrls; result.pageErrors = pageErrors.slice();
      result.recovered = result.afterNewOwner?.ready === true && result.afterNewOwner.entityCount === 3 && result.afterNewOwner.listenerCount === 6;
    } else {
      await waitReady();
      result.buildId = (await status())?.buildId ?? result.buildId;
      if (!['runtime-identity'].includes(caseId)) {
        const startupStatus = await status(); result.startupStatus = startupStatus;
        const resumable = startupStatus.paused && startupStatus.pauseReasons.every(reason => ['BACKLOG','RESUME_REQUIRED','MANUAL','SAMPLE_COMPLETE'].includes(reason));
        if (resumable) {
          await page.locator('#GameCanvas').click(); await page.keyboard.press('r');
          await page.waitForFunction(() => !window.__p1aLab.status().paused, null, { timeout: 10000 });
        }
        await page.waitForFunction(() => {
          const current = window.__p1aLab?.status?.();
          return current?.ready === true && current.tick > 0 && current.paused === false
            && current.lifecycle?.backgrounded === false;
        }, null, { timeout: 20000, polling: 100 });
      }
      if (caseId === 'lifecycle-smoke') {
        const durationMs = Number(query.get('durationMs') ?? 5000);
        result.initial = await status();
        await page.evaluate(() => {
          window.__p1aHostCapture = [];
          document.addEventListener('visibilitychange', event => window.__p1aHostCapture.push({ source:'dom-listener', trusted:event.isTrusted,
            visibility:document.visibilityState, at:performance.now(), tick:window.__p1aLab?.status?.().tick,
            stepCount:window.__p1aLab?.status?.().stepCount, entityCount:window.__p1aLab?.status?.().entityCount }));
        });
        const targetSession = await page.context().newCDPSession(page);
        await targetSession.send('Emulation.setFocusEmulationEnabled', { enabled:false });
        await page.bringToFront(); const activeStart = await status();
        const helper = await page.context().newPage();
        const helperSession = await page.context().newCDPSession(helper);
        await helperSession.send('Emulation.setFocusEmulationEnabled', { enabled:false });
        await helper.goto('about:blank'); await helper.bringToFront();
        await page.waitForTimeout(Math.min(durationMs,10000));
        result.helperState = await helper.evaluate(() => ({ visibility:document.visibilityState, hasFocus:document.hasFocus() }));
        await page.bringToFront(); await page.waitForTimeout(500);
        result.hiddenCapture = await page.evaluate(() => window.__p1aHostCapture.filter(event => event.visibility === 'hidden'));
        result.hostEvents = await page.evaluate(() => window.__p1aLifecycle.snapshot().events);
        result.visibleAfter = await page.evaluate(() => ({ visibility:document.visibilityState, hasFocus:document.hasFocus(), lifecycle:window.__p1aLifecycle.snapshot() }));
        result.after = await status(); result.durationMs = durationMs; result.activeStart = activeStart;
        result.focusOverrideDisabled = true; result.syntheticEventsUsed = false;
        await helperSession.detach(); await helper.close(); await targetSession.detach();
        result.pass = result.hiddenCapture.some(event => event.trusted === true) && result.visibleAfter.visibility === 'visible'
          && result.hostEvents.some(event => event.source === 'dom' && event.hidden === true && event.trusted === true)
          && result.after.tick === result.hiddenCapture[0].tick && result.after.stepCount === result.hiddenCapture[0].stepCount;
      } else if (caseId === 'runtime-identity') {
        await page.waitForFunction(() => window.__p1aLab?.status?.().tick >= 60, null, { timeout: 10000 });
        result.runtime = await page.evaluate(() => ({ lab: window.__p1aLab.status(), lifecycle: window.__p1aLifecycle.snapshot(),
          probe: window.__p1aProbe.export(), engine: window.__p1aLab.status().engine,
          canvas: document.querySelector('#GameCanvas')?.getBoundingClientRect().toJSON() }));
        result.buildId = result.runtime.lab.buildId;
        result.identityMatchesRequestedBuild = result.runtime.lab.buildId === expectedBuildId;
        result.screenshot = await saveShot(caseId);
      } else if (caseId === 'queue-terminal') {
        await page.locator('#GameCanvas').click(); await page.keyboard.press('3');
        await page.waitForFunction(() => window.__p1aLab.status().queue?.state === 'BLOCKED_FINAL' || window.__p1aLab.status().queue?.state === 'COMPLETE', null, { timeout: 120000 });
        result.terminal = await page.evaluate(() => window.__p1aLab.snapshot().queue);
        const terminalStatus = await status();
        if (terminalStatus.paused && terminalStatus.pauseReasons.every(reason => ['SAMPLE_COMPLETE','BACKLOG','RESUME_REQUIRED','MANUAL'].includes(reason))) {
          await page.keyboard.press('r'); await page.waitForFunction(value => window.__p1aLab.status().tick >= value + 120
            || window.__p1aLab.status().paused && window.__p1aLab.status().pauseReasons.includes('BACKLOG'), terminalStatus.tick, { timeout: 15000, polling: 100 });
        } else await page.waitForFunction(value => window.__p1aLab.status().tick >= value + 120,
          terminalStatus.tick, { timeout: 15000, polling: 100 });
        result.afterWait = await status();
        result.terminalAdvanceSteps = result.afterWait.tick - terminalStatus.tick;
        result.expectedTerminal = result.terminal.state === 'BLOCKED_FINAL';
        result.terminalStable = result.terminal.state === result.afterWait.queue.state && result.terminal.batchAttempt === result.afterWait.queue.batchAttempt
          && result.terminal.records.length === result.afterWait.queue.recordCount && result.terminalAdvanceSteps >= 120;
      } else if (caseId === 'queue-cancel') {
        await page.evaluate(() => window.__p1aLab.startQueue());
        await page.waitForFunction(() => (window.__p1aLab.status().queue?.batchAttempt ?? 0) >= 3, null, { timeout: 15000 });
        result.beforeCancel = await page.evaluate(() => window.__p1aLab.snapshot().queue);
        await page.evaluate(() => window.__p1aLab.cancelQueue()); await page.waitForTimeout(2000);
        result.afterCancel = await page.evaluate(() => window.__p1aLab.snapshot().queue);
        result.cancelStable = result.afterCancel.state === 'CANCELLED' && result.afterCancel.batchAttempt === result.beforeCancel.batchAttempt;
      } else if (caseId === 'contact-matrix') {
        await page.evaluate(() => window.__p1aLab.startContactMatrix());
        await page.waitForFunction(() => window.__p1aLab.status().contactMatrix?.phase === 'DONE', null, { timeout: 20000 });
        result.contactMatrix = await page.evaluate(() => window.__p1aLab.status().contactMatrix.result);
      } else if (caseId === 'wall-matrix') {
        result.expectedCases = await page.evaluate(() => window.__p1aLab.startWallMatrix());
        await page.waitForFunction(() => ['PASS','FAIL'].includes(window.__p1aLab.status().wallMatrix?.status), null,
          { timeout: 90000, polling: 250 });
        result.wallMatrix = (await fullSnapshot()).wallMatrix;
        result.wallMatrixSummary = await status();
      } else if (caseId === 'narrowest-cup') {
        await page.evaluate(() => window.__p1aLab.startNarrowestCup());
        await page.waitForFunction(() => {
          const s = window.__p1aLab.status();
          return s.contactCount > 0 || s.tick > 2400 || s.paused && !s.pauseReasons.includes('REBUILD');
        }, null, { timeout: 45000, polling: 250 });
        result.snapshot = await fullSnapshot(); result.status = await status();
        result.cupScale = result.status.cupWidthScale; result.actualBody = result.snapshot.bodies.find(body => body[0] === 1) ?? null;
      } else if (caseId === 'rebuild-20' || caseId === 'rebuild-interrupt-5' || caseId === 'rebuild-interrupt-10') {
        const interruptAt = caseId.endsWith('-5') ? 5 : caseId.endsWith('-10') ? 10 : 0;
        result.interruptAt = interruptAt;
        await page.evaluate(value => window.__p1aLab.startContactRebuild(value), interruptAt);
        await page.waitForFunction(value => {
          const current = window.__p1aLab.status().contactRebuild;
          return value ? current?.status === 'CANCELLED' : current?.status === 'PASS' || current?.status === 'FAIL';
        }, interruptAt, { timeout: 60000 });
        result.firstTask = await page.evaluate(() => window.__p1aLab.snapshot().contactRebuild);
        if (interruptAt) {
          result.firstTaskRecordsAtInterrupt = result.firstTask.records.length;
          await page.evaluate(() => window.__p1aLab.startContactRebuild(0));
          await page.waitForFunction(() => window.__p1aLab.status().contactRebuild?.status === 'PASS' || window.__p1aLab.status().contactRebuild?.status === 'FAIL', null, { timeout: 60000 });
          result.afterReplacement = await status();
          result.history = result.afterReplacement.contactRebuildHistory;
          result.replacementPass = result.afterReplacement.contactRebuild?.status === 'PASS'
            && result.afterReplacement.contactRebuild.records.length === 20
            && result.afterReplacement.contactRebuildHistory.some(item => item.failure === `INTERRUPTED_AFTER_CONTACT_ROUND_${interruptAt}`
              && item.recordCount === interruptAt);
        }
      } else if (/^level-drop-[1-9]$/.test(caseId)) {
        const level = Number(caseId.slice(-1));
        result.entityId = await page.evaluate(value => window.__p1aLab.startLevelDrop(value), level);
        await page.waitForFunction(() => {
          const s = window.__p1aLab.status();
          return s.contactCount > 0 || s.tick > 2400 || s.paused && !s.pauseReasons.includes('REBUILD');
        }, null, { timeout: 45000 });
        result.level = level; result.snapshot = await fullSnapshot();
        result.actualBody = result.snapshot.bodies.find(body => body[0] === result.entityId) ?? null;
        result.landed = result.snapshot.contactCount > 0;
        result.radiusMatchesConfig = result.actualBody?.[1] === result.snapshot.config?.levelRadii.find(item => item.level === level)?.radiusDu;
      } else if (caseId.startsWith('pressure-')) {
        const layout = caseId.endsWith('-strict') ? 'strict' : caseId.endsWith('-mixed') ? 'mixed' : 'original';
        const mode = await page.evaluate(() => window.__p1aProbe.export().metadata.mode);
        result.layout = layout; result.probeMode = mode; result.requestedProbe = query.get('p1aProbe');
        await page.evaluate(() => {
          const sampler = window.__p1aExternalFrames = { active:true, frames:[], ticks:[], last:0, frame:0 };
          const sample = now => {
            if (!sampler.active) return;
            sampler.frames.push([now, sampler.last ? now - sampler.last : 0]); sampler.last = now; sampler.frame++;
            if (sampler.frame % 60 === 0) {
              const state = window.__p1aLab.status();
              sampler.ticks.push([now, state.tick, state.stepCount, state.paused, state.entityCount, state.pauseReasons]);
            }
            requestAnimationFrame(sample);
          };
          requestAnimationFrame(sample);
        });
        const started = Date.now(); await page.evaluate(value => window.__p1aLab.startPressure(value), layout);
        await page.waitForFunction(mode => {
          const status = window.__p1aLab.status(); const phase = window.__p1aProbe.phase();
          return status.paused && !status.pauseReasons.includes('REBUILD') || phase === 'FAILURE' || phase === 'COMPLETE'
            || (mode === 'OFF' && status.tick >= 4200);
        }, mode, { timeout: 150000, polling: 1000 });
        result.externalFrames = await page.evaluate(() => { window.__p1aExternalFrames.active = false; return window.__p1aExternalFrames; });
        result.wallDurationMs = Date.now() - started; result.status = await status();
        result.preflight = await page.evaluate(() => window.__p1aLab.snapshot().preflight ?? window.__p1aLabPreflight ?? null);
        result.probe = await page.evaluate(() => window.__p1aProbe.export()); result.screenshot = await saveShot(caseId);
      } else if (caseId === 'gallery') {
        const galleryTitle = () => `cc.director.getScene()?.getChildByName('PhysicsLabRoot')?.children.find(n => n.name === 'P1ArtGallery')?.children.find(n => n.name === 'GalleryText')?.getComponent('cc.Label')?.string`;
        result.galleryOpenPoint = await tapControl('G');
        await page.waitForFunction(() => cc.director.getScene()?.getChildByName('PhysicsLabRoot')?.children.some(n => n.name === 'P1ArtGallery'), null, { timeout: 5000 });
        const pages = [];
        for (let i = 0; i < 7; i++) {
          await page.waitForFunction(() => {
            const gallery = cc.director.getScene()?.getChildByName('PhysicsLabRoot')?.children.find(n => n.name === 'P1ArtGallery');
            return gallery?.children.find(n => n.name === 'GalleryText')?.getComponent('cc.Label')?.string?.includes('共81项');
          }, null, { timeout: 20000 });
          pages.push(await page.evaluate(() => ({ title: cc.director.getScene().getChildByName('PhysicsLabRoot').children.find(n => n.name === 'P1ArtGallery')?.children.find(n => n.name === 'GalleryText')?.getComponent('cc.Label')?.string,
            loaded: window.__p1aLab.snapshot().loadedArtVariants?.length })));
          await saveShot(`gallery-page-${i + 1}`);
          await tapControl('›', true);
        }
        await page.waitForTimeout(1000); result.loadedArtVariants = await page.evaluate(() => window.__p1aLab.snapshot().loadedArtVariants);
        result.pages = pages; result.allCatalogItemsLoaded = result.loadedArtVariants.length >= 81 && pages.every((x, i) => x.title?.includes(`${i + 1}/7`) && x.title?.includes('共81项'));
        result.screenshot = await saveShot(caseId); await tapControl('返回', true);
      } else if (caseId === 'viewport') {
        const sizes = [[320,568],[360,800],[375,812],[390,844],[414,896],[430,932],[750,1334],[1024,768],[768,1024]];
        const rows = [];
        for (const [width,height] of sizes) {
          await page.setViewportSize({ width, height }); await page.waitForTimeout(100);
          const before = await fullSnapshot();
          const pausePoint = await tapControl('P'); const paused = await status(); const pausedSnapshot = await fullSnapshot();
          await tapControl('G'); await page.waitForTimeout(250); const nextPoint = await tapControl('›', true); await page.waitForTimeout(250);
          const galleryVisible = await page.evaluate(() => !!cc.director.getScene()?.getChildByName('PhysicsLabRoot')?.children.find(n => n.name === 'P1ArtGallery'));
          const closePoint = await tapControl('返回', true);
          const afterGallerySnapshot = await fullSnapshot();
          const row = await page.evaluate(({width,height,galleryVisible}) => {
            const c = document.querySelector('#GameCanvas'); const r = c.getBoundingClientRect(); const lab = window.__p1aLab.status();
            return {width,height,canvas:{x:r.x,y:r.y,width:r.width,height:r.height},inside:r.width>0&&r.height>0&&r.x>=-1&&r.y>=-1&&r.right<=width+1&&r.bottom<=height+1,
              paused:lab.paused,pauseReasons:lab.pauseReasons,tick:lab.tick,entities:lab.entityCount,galleryVisible };
          }, {width,height,galleryVisible}); rows.push(row);
          row.beforeEntities = before.entityCount; row.pauseTick = paused.tick;
          row.positionsPreserved = JSON.stringify(pausedSnapshot.bodies) === JSON.stringify(afterGallerySnapshot.bodies);
          row.worldIdPreserved = pausedSnapshot.worldId === afterGallerySnapshot.worldId;
          row.points = { pausePoint, nextPoint, closePoint };
          await tapControl('R'); await page.waitForFunction(() => !window.__p1aLab.status().paused, null, { timeout: 5000 });
          row.resumed = await status();
        }
        await tapControl('R'); await page.waitForFunction(() => !window.__p1aLab.status().paused, null, { timeout: 5000 });
        result.rows = rows; result.pausePreserved = rows.every(row => row.inside && row.paused && row.galleryVisible
          && row.pauseTick === row.tick && row.beforeEntities === row.entities && row.positionsPreserved && row.worldIdPreserved && !row.resumed.paused);
        result.afterResume = await status(); result.screenshot = await saveShot(caseId);
      } else if (caseId === 'manual-pause') {
        await page.locator('#GameCanvas').click(); await page.waitForTimeout(250); await page.keyboard.press('p'); result.paused = await status();
        await page.waitForTimeout(1200); result.afterWait = await status(); await page.keyboard.press('r');
        await page.waitForFunction(() => !window.__p1aLab.status().paused, null, { timeout: 5000 }); result.resumed = await status();
      } else {
        throw new Error(`Unsupported p1aCase: ${caseId}`);
      }
    }
    if (caseId === 'runtime-identity') result.pass = result.identityMatchesRequestedBuild && result.runtime.engine?.cocos === '3.8.8'
      && result.runtime.engine?.physicsBackend === 'BOX2D' && result.runtime.engine?.ptmRatio === 32 && result.runtime.engine?.autoSimulation === false;
    else if (caseId.startsWith('pressure-')) {
      const probe = result.probe; const pre = result.preflight; const expectedCount = result.layout === 'mixed' ? 24 : 220;
      const expectedMode = result.requestedProbe === 'summary' ? 'SUMMARY' : result.requestedProbe === 'light' ? 'TIMING'
        : result.requestedProbe === 'legacy' ? 'LEGACY_COMPARE' : 'OFF';
      result.requestModeMatches = result.probeMode === expectedMode;
      result.pass = result.requestModeMatches && result.status?.entityCount === expectedCount && pre?.entityCount === expectedCount && pre?.nonFinite === 0
        && (result.probeMode === 'OFF' ? result.status?.stepCount >= 4200 && !result.status?.paused
          : probe?.metadata?.phase === 'COMPLETE' && probe?.coverage?.warmupSteps >= 600 && probe?.coverage?.observeSteps >= 3600
            && probe?.coverage?.activeObserveMs >= 60000 && !probe?.anomaly
            && (result.probeMode !== 'LEGACY_COMPARE' || probe?.legacySummary?.stepRecords >= 4200
              && probe?.legacySummary?.bodyRecords === expectedCount * probe.legacySummary.stepRecords));
    } else if (caseId === 'queue-terminal') result.pass = result.expectedTerminal && result.terminalStable
      && result.afterWait.queue?.state === 'BLOCKED_FINAL' && result.afterWait.queue?.batchAttempt === result.terminal.batchAttempt;
    else if (caseId === 'queue-cancel') result.pass = result.cancelStable;
    else if (caseId === 'contact-matrix') result.pass = result.contactMatrix?.status === 'PASS';
    else if (caseId === 'wall-matrix') result.pass = result.wallMatrix?.status === 'PASS'
      && result.wallMatrix.records.length === 45 && result.wallMatrix.records.every(row => row.status === 'PASS' && !row.sweptEscape);
    else if (caseId === 'rebuild-20') result.pass = result.firstTask?.status === 'PASS' && result.firstTask.records.length === 20
      && result.firstTask.records.every(row => row.canonicalContacts.includes(`${row.entityIds?.[0]}|${row.entityIds?.[1]}`)
        && row.oldDestroyed && row.emptyBaseline && row.stableFrames >= 2);
    else if (caseId.startsWith('rebuild-interrupt-')) result.pass = result.firstTask?.status === 'CANCELLED'
      && result.firstTask.records.length === result.interruptAt && result.replacementPass;
    else if (caseId.startsWith('level-drop-')) result.pass = result.landed && result.radiusMatchesConfig && result.actualBody !== null;
    else if (caseId === 'narrowest-cup') result.pass = result.status?.contactCount > 0 && result.cupScale === 0.8 && result.actualBody?.[1] === 140;
    else if (caseId === 'gallery') result.pass = result.allCatalogItemsLoaded;
    else if (caseId === 'viewport') result.pass = result.pausePreserved && result.rows.length === 9 && result.rows.every(row => row.galleryVisible);
    else if (caseId === 'manual-pause') result.pass = result.paused?.paused && result.afterWait?.tick === result.paused.tick && !result.resumed?.paused;
    else if (caseId.startsWith('config-')) result.pass = caseId === 'config-destroy-during-load'
      ? result.routeHeld && result.beforeDestroy?.appLoading && result.afterStaleCallback?.scene === 'PhysicsLab' && result.afterNewOwner?.ready
      : result.failureVisible?.label?.includes('配置加载或校验失败') && result.recovered && result.singleSuccessfulRetry;
    else if (caseId.startsWith('image-404-')) result.pass = result.failure?.message?.includes('美术加载失败') && result.recovered;
    else if (caseId === 'image-retry-burst') result.pass = result.recovered && result.routeHits === 9;
    else if (caseId === 'destroy-during-image-load') result.pass = result.routeHits > 0 && result.recovered && result.pageErrors.length === 0;
    if (result.pass === false) result.acceptance = 'FAIL'; else if (result.pass === true) result.acceptance = 'PASS';
    result.endedAt = new Date().toISOString(); result.consoleEvents = consoleEvents; result.pageErrors = pageErrors;
    return result;
  } finally { page.off('console', onConsole); page.off('pageerror', onPageError); }
}
