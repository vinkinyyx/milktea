async (page) => {
 await page.bringToFront(); await page.locator('#GameCanvas').click(); await page.keyboard.press('r'); await page.keyboard.press('3');
 const samples=[];
 for(let i=0;i<16;i++){await page.waitForTimeout(1000); samples.push(await page.evaluate(()=>{const l=cc.director.getScene().getChildByName('PhysicsLabRoot').getComponent('PhysicsLab');return {message:l.message,tick:l.clock.tick,paused:l.clock.paused,entities:l.adapter.entityCount,ids:Array.from(l.visuals.keys()),radii:Array.from(l.visualRadii.values())}})); if(samples.at(-1).message.includes('九级对象均已'))break;}
 return samples;
}
