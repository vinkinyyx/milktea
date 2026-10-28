async (page) => {
 await page.bringToFront(); await page.locator('#GameCanvas').click(); await page.keyboard.press('r');
 const cdp=await page.context().newCDPSession(page); const {windowId}=await cdp.send('Browser.getWindowForTarget');
 const read=async()=> (await cdp.send('Runtime.evaluate',{expression:`JSON.stringify((()=>{const l=cc.director.getScene().getChildByName('PhysicsLabRoot').getComponent('PhysicsLab');return {visibility:document.visibilityState,tick:l.clock.tick,paused:l.clock.paused,message:l.message,states:Array.from(l.visuals.keys(),id=>l.adapter.getBody(id))}})())`,returnByValue:true})).result.value;
 const before=await read(); let hidden,foreground;
 try {await cdp.send('Browser.setWindowBounds',{windowId,bounds:{windowState:'minimized'}}); await new Promise(r=>setTimeout(r,2000)); hidden=await read(); await new Promise(r=>setTimeout(r,3000)); var hidden2=await read();} finally {await cdp.send('Browser.setWindowBounds',{windowId,bounds:{windowState:'normal'}}); await new Promise(r=>setTimeout(r,1000)); foreground=await read();}
 return {before:JSON.parse(before),hidden:JSON.parse(hidden),hidden2:JSON.parse(hidden2),foreground:JSON.parse(foreground)};
}
