async page=>{
 await page.bringToFront();const result=await page.evaluate(async()=>{
  const cc=await System.import('cc'),r=cc.director.getScene().getChildByName('BootRoot').getComponent('P1BGameRoot'),records=[];
  for(let seed=1;seed<=12;seed++){
   await window.__P1B_FIXTURES__.start({attemptId:'shake-'+seed+'-'+Date.now(),fixtureId:'empty',seed});r.tutorialStep=0;r.clock.pause();r.engine.resume();r.screen='PLAYING';
   let step=0;while(step<900&&r.engine.phase==='PLAYING'){r.advanceRunTick();r.processEvents();step++;}
   const before=r.engine.snapshot();r.enqueue('SHAKE');let j=0;while(j<120&&r.engine.phase==='PLAYING'){r.advanceRunTick();r.processEvents();j++;}
   const after=r.engine.snapshot();records.push({seed,beforeTick:before.tick,afterTick:after.tick,baseUsed:after.shake.baseUsed,fault:r.engine.lastTickFault,phase:after.state,reason:after.terminalReason,score:after.score});
   r.engine.pause('MANUAL');r.clock.pause();r.baseTick=after.tick;r.clock.reset();r.screen='PAUSED';
  }r.render();return records;
 });return {scope:'real Cocos/Box2D first shake after 900 ticks, 12 seeds, not phone host',records:result};
}
