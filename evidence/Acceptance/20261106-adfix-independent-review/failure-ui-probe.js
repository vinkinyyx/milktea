async page=>{
 const dir='D:/Workspace/TapTap/奶茶挤挤/evidence/Acceptance/20261106-adfix-independent-review/';
 const before=await page.evaluate(async()=>{
   const cc=await System.import('cc'),r=cc.director.getScene().getChildByName('BootRoot').getComponent('P1BGameRoot');
   r.showStartupFailure('START_ART_FAILED','REVIEW_CONTROLLED_FAILURE',r.startupTraceId);
   return {screen:r.screen,overlay:r.overlayVisible,buttons:r.overlayButtons.map(b=>({id:b.id,rect:b.rect}))};
 });
 const b=before.buttons.find(b=>b.id==='startup-menu');
 await page.mouse.click(195+(b.rect.x+b.rect.w/2-375)*.52,422+(667-b.rect.y-b.rect.h/2)*.52);await page.waitForTimeout(300);
 const afterMenu=await page.evaluate(async()=>{const cc=await System.import('cc'),r=cc.director.getScene().getChildByName('BootRoot').getComponent('P1BGameRoot');return {screen:r.screen,overlay:r.overlayVisible,overlayButtons:r.overlayButtons.map(b=>b.id)};});
 await page.screenshot({path:dir+'failure-menu-still-covered.png'});
 const startButton=await page.evaluate(async()=>{const cc=await System.import('cc'),r=cc.director.getScene().getChildByName('BootRoot').getComponent('P1BGameRoot');return r.buttons.find(b=>b.id==='new').rect;});
 await page.mouse.click(195+(startButton.x+startButton.w/2-375)*.52,422+(667-startButton.y-startButton.h/2)*.52);await page.waitForTimeout(500);
 const afterStartClick=await page.evaluate(async()=>{const cc=await System.import('cc'),r=cc.director.getScene().getChildByName('BootRoot').getComponent('P1BGameRoot');return {screen:r.screen,loading:r.loading,overlay:r.overlayVisible};});
 const renderFault=await page.evaluate(async()=>{
   const cc=await System.import('cc'),r=cc.director.getScene().getChildByName('BootRoot').getComponent('P1BGameRoot');
   r.hideOverlay();const render=r.renderUnsafe;let thrown=null;
   r.renderUnsafe=()=>{throw Error('REVIEW_RENDER_FAULT');};
   try{r.render();}catch(e){thrown=String(e);}
   const result={thrown,overlay:r.overlayVisible};
   r.renderUnsafe=render;r.screen='PAUSED';r.notice='已暂停。';r.loading=false;r.artLoading=false;r.hideOverlay();r.render();
   return result;
 });
 return {scope:'Controlled runtime fault injection in existing Web Release; does not diagnose original phone root cause',before,afterMenu,afterStartClick,renderFault};
}
