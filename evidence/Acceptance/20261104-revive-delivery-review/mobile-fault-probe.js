async page=>{
 await page.goto('http://localhost:4220/?probe=off');await page.bringToFront();await page.waitForFunction(()=>!!window.__P1B_FIXTURES__);
 const result=await page.evaluate(async()=>{
  const cc=await System.import('cc'),r=cc.director.getScene().getChildByName('BootRoot').getComponent('P1BGameRoot'),records=[];
  for(let seed=1;seed<=8;seed++){
   await window.__P1B_FIXTURES__.start({attemptId:'moving-'+seed+'-'+Date.now(),fixtureId:'empty',seed});r.tutorialStep=0;r.clock.pause();r.engine.resume();r.screen='PLAYING';let step=0;
   while(step<7200&&r.engine.phase==='PLAYING'){
    if(step%30===0)r.engine.setCupTarget((Math.floor(step/30)%2===0?1:-1)*110);
    r.advanceRunTick();r.processEvents();step++;
   }
   const s=r.engine.snapshot();records.push({seed,steps:step,tick:s.tick,dropIndex:s.dropIndex,score:s.score,phase:s.state,reason:s.terminalReason,fault:r.engine.lastTickFault,snapshot:s});
   r.engine.pause('MANUAL');r.clock.pause();r.baseTick=s.tick;r.clock.reset();r.screen='PAUSED';
  }
  r.render();return records;
 });
 return {scope:'real Cocos/Box2D, direct fixed steps and alternating cup target; not a phone profile',records:result};
}
