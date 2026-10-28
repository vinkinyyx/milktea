async page => {
  const buildId = '20261029-p1a-final-14';
  const attemptId = 'COL-01-001';
  const artifactDir = 'D:/Workspace/TapTap/奶茶挤挤/evidence/P1-A/20261029-p1a-final-14/raw/COL-01-001';
  await page.goto(`http://127.0.0.1:8784/?p1aCase=runtime-identity&attemptId=${attemptId}&expectedBuildId=${buildId}&probeVersion=p1a-probe-v2&p1aProbe=off`);
  await page.waitForFunction(() => window.__p1aLab?.status?.().ready === true, null, { timeout: 90000 });
  await page.waitForFunction(() => window.__p1aLab.status().tick >= 600, null, { timeout: 30000 });
  const before = await page.evaluate(() => window.__p1aLab.snapshot());
  const sampleStart = await page.evaluate(() => {
    const sampler = window.__p1aThreeCircle = {active:true, frames:[], states:[], last:0};
    const frame = now => {
      if (!sampler.active) return;
      sampler.frames.push([now, sampler.last ? now-sampler.last : 0]); sampler.last=now;
      if (sampler.frames.length % 60 === 0) {
        const s=window.__p1aLab.status(); sampler.states.push({time:now,tick:s.tick,stepCount:s.stepCount,paused:s.paused,entityCount:s.entityCount,pauseReasons:s.pauseReasons});
      }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
    return {tick:window.__p1aLab.status().tick,wall:performance.now(),snapshot:window.__p1aLab.snapshot()};
  });
  await page.waitForFunction(start => window.__p1aLab.status().tick >= start + 3600 || window.__p1aLab.status().paused,
    sampleStart.tick, { timeout: 150000, polling: 500 });
  const ending = await page.evaluate(() => {
    window.__p1aThreeCircle.active=false;
    return {end:performance.now(),status:window.__p1aLab.status(),snapshot:window.__p1aLab.snapshot(),sampler:window.__p1aThreeCircle};
  });
  await page.screenshot({path:`${artifactDir}/three-circle-final.png`,fullPage:true});
  const result = {caseId:'COL-01',attemptId,buildId,probeVersion:'p1a-probe-v2',before,sampleStart,ending,
    observedSteps:ending.status.tick-sampleStart.tick,activeObserveMs:ending.end-sampleStart.wall,
    noPause:ending.status.paused===false,stableEntityCount:before.entityCount===3&&ending.status.entityCount===3,
    bodyStateFinite:ending.snapshot.bodies.every(b=>b.slice(1).every(Number.isFinite)),
    pass:before.entityCount===3&&ending.status.entityCount===3&&ending.status.paused===false
      &&ending.status.tick-sampleStart.tick>=3600&&ending.end-sampleStart.wall>=60000
      &&ending.snapshot.bodies.every(b=>b.slice(1).every(Number.isFinite)),
    screenshot:`${artifactDir}/three-circle-final.png`};
  return result;
}
