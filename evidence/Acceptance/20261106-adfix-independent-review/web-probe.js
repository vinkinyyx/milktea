async page=>{
 await page.setViewportSize({width:390,height:844});
 const dir='D:/Workspace/TapTap/奶茶挤挤/evidence/Acceptance/20261106-adfix-independent-review/';
 const errors=[];page.on('pageerror',e=>errors.push({kind:'pageerror',text:e.message}));
 page.on('console',m=>{if(m.type()==='error')errors.push({kind:'console',text:m.text()});});
 const read=()=>page.evaluate(async()=>{
   const cc=await System.import('cc'),r=cc.director.getScene().getChildByName('BootRoot').getComponent('P1BGameRoot');
   const s=r.engine?.snapshot();
   return {screen:r.screen,persistent:r.persistent,revision:r.bundleRevision,loading:r.loading,overlay:r.overlayVisible,loaded:r.art.loadedCount,
     slider:!!r.art.getLoadedVariant('ui_slider_knob'),notice:r.notice,tutorial:r.tutorialStep,tick:s?.tick,phase:s?.state,runId:s?.runId,score:s?.score,
     dropIndex:s?.dropIndex,shakeUsed:s?.shake.baseUsed,cupOffset:s?.cupMotion.offsetXDu,fault:r.engine?.lastTickFault,
     buttons:r.buttons.map(b=>({id:b.id,rect:b.rect}))};
 });
 const click=async id=>{const s=await read(),b=s.buttons.find(b=>b.id===id);if(!b)throw Error('Missing '+id+' in '+s.screen);
   await page.mouse.click(195+(b.rect.x+b.rect.w/2-375)*.52,422+(667-b.rect.y-b.rect.h/2)*.52);await page.waitForTimeout(500);};
 const ready=async()=>{for(let i=0;i<36;i++){const s=await read();if(!s.loading)return s;await page.waitForTimeout(500);}throw Error('Loading did not settle within polling window');};
 await page.reload();await page.waitForTimeout(4500);
 const menu=await ready();await click('settings');await page.waitForTimeout(700);const settings=await read();await page.screenshot({path:dir+'settings.png'});
 await click('back');await click('new');const tutorial=await ready();
 if(tutorial.buttons.some(b=>b.id==='tutorial-skip'))await click('tutorial-skip');
 await page.waitForTimeout(2200);const playing=await read();await page.screenshot({path:dir+'playing.png'});
 if(playing.screen!=='PLAYING')throw Error('Not playing: '+JSON.stringify(playing));
 await page.mouse.move(195,530);await page.mouse.down();await page.mouse.move(250,530,{steps:8});await page.waitForTimeout(200);await page.mouse.up();
 const moved=await read();await click('shake');await page.waitForTimeout(1000);const shaken=await read();
 await click('pause');await page.waitForTimeout(500);const paused=await read();await page.screenshot({path:dir+'paused.png'});
 await page.reload();await page.waitForTimeout(4500);const reloaded=await read();
 if(reloaded.buttons.some(b=>b.id==='continue'))await click('continue');await page.waitForTimeout(1000);const restored=await read();
 const result={scope:'Real Web Release mouse interaction, not Tap host or phone performance',menu,settings,tutorial,playing,moved,shaken,paused,reloaded,restored,errors};
 await page.screenshot({path:dir+'restored.png'});
 await page.evaluate(data=>{globalThis.__reviewResult=data;},result);
 return result;
}
