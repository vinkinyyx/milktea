async page=>{
 const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:3,mobile:true});
 const records=[];
 for(const [label,url] of [['before','http://localhost:4219/'],['after','http://localhost:4224/']]){
  await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});await page.goto(url);await page.bringToFront();await page.waitForTimeout(7000);
  await page.waitForFunction(async()=>{try{const cc=await System.import('cc'),r=cc.director.getScene()?.getChildByName('BootRoot')?.getComponent('P1BGameRoot');return r?.artReady&&!r.loading;}catch{return false;}},null,{timeout:45000});
  records.push(await page.evaluate(async label=>{const cc=await System.import('cc'),r=cc.director.getScene().getChildByName('BootRoot').getComponent('P1BGameRoot'),canvas=document.querySelector('canvas');return {label,sampleAtMs:Math.round(performance.now()),loadedArt:r.art.loadedCount,canvas:{width:canvas.width,height:canvas.height,cssWidth:canvas.clientWidth,cssHeight:canvas.clientHeight,dpr:devicePixelRatio},buttons:r.buttons.map(b=>b.id),rgbaLoadedBytes:r.art.loadedVariantSnapshot().reduce((s,v)=>s+v.size[0]*v.size[1]*4,0)};},label));
  await page.screenshot({path:'D:/Workspace/TapTap/奶茶挤挤/evidence/Acceptance/20261104-revive-delivery-review/startup-'+label+'.png'});
 }
 const game=await page.evaluate(async()=>{const cc=await System.import('cc'),r=cc.director.getScene().getChildByName('BootRoot').getComponent('P1BGameRoot');await r.startNew(true);return {screen:r.screen,tutorial:r.tutorialStep,loadedArt:r.art.loadedCount,buttons:r.buttons.map(b=>b.id),cupChildDimensions:r.rear.children.slice(1,4).map(n=>({id:n.name,w:n.getComponent(cc.UITransform)?.width,h:n.getComponent(cc.UITransform)?.height})),rgbaLoadedBytes:r.art.loadedVariantSnapshot().reduce((s,v)=>s+v.size[0]*v.size[1]*4,0),fixtures:typeof window.__P1B_FIXTURES__};});
 await page.screenshot({path:'D:/Workspace/TapTap/奶茶挤挤/evidence/Acceptance/20261104-revive-delivery-review/optimized-game-tutorial.png'});await cdp.detach();return {scope:'single Chromium cold-cache observation at emulated DPR3, not platform timing or 400MB process memory',records,game};
}
