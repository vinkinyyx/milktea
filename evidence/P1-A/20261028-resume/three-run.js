async (page) => {
 await page.bringToFront(); await page.locator('#GameCanvas').click(); await page.keyboard.press('2'); await page.keyboard.press('r');
 const samples=[]; const start=Date.now();
 for(let i=0;i<7;i++){await page.waitForTimeout(10000); samples.push(await page.evaluate(()=>{const l=cc.director.getScene().getChildByName('PhysicsLabRoot').getComponent('PhysicsLab');return {time:new Date().toISOString(),tick:l.clock.tick,paused:l.clock.paused,message:l.message,entities:l.adapter.entityCount,contacts:l.adapter.contactCount,states:Array.from(l.visuals.keys(),id=>l.adapter.getBody(id))}}));}
 return {elapsedMs:Date.now()-start,samples};
}
