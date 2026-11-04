async page=>{
 await page.goto('http://localhost:4223/?probe=off');await page.bringToFront();await page.waitForFunction(()=>!!window.__P1B_FIXTURES__);
 const result=await page.evaluate(async()=>{
  const cc=await System.import('cc'),r=cc.director.getScene().getChildByName('BootRoot').getComponent('P1BGameRoot');
  const initialLoaded=r.art.loadedCount;
  await window.__P1B_FIXTURES__.start({attemptId:'memory-recovery-'+Date.now(),fixtureId:'create-fault',seed:1});r.tutorialStep=0;r.clock.pause();r.engine.resume();r.screen='PLAYING';r.debugMode=false;r.persistent=false;
  const before=r.engine.snapshot();let steps=0;while(steps++<20&&!r.engine.lastTickFault)r.advanceRunTick();
  const fault={message:r.engine.lastTickFault,phase:r.screen,repositoryAvailable:!!r.activeSaveRepository(),checkpoint:r.engine.recoveryCheckpoint};
  await r.retryTechnicalRecovery();const restored=r.engine?.snapshot();
  return {initialLoaded,gameLoaded:r.art.loadedCount,before,fault,restored,status:{screen:r.screen,paused:r.clock.paused,notice:r.notice,recoveryUsed:r.recoveryUsedRunId},sameRun:restored?.runId===before.runId,sameScore:restored?.score===before.score,sameRng:JSON.stringify(restored?.rng)===JSON.stringify(before.rng),sameSpawnRng:JSON.stringify(restored?.spawnRng)===JSON.stringify(before.spawnRng)};
 });await page.screenshot({path:'D:/Workspace/TapTap/奶茶挤挤/evidence/Acceptance/20261104-revive-delivery-review/memory-recovered.png'});return result;
}
