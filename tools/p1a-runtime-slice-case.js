async page => {
  const root = 'http://127.0.0.1:8784/?p1aCase=runtime-identity&attemptId=ART-03-001&expectedBuildId=20261029-p1a-final-14&probeVersion=p1a-probe-v2&p1aProbe=off';
  await page.goto(root);
  await page.waitForFunction(() => { try { return window.__p1aLab?.status?.().ready === true; } catch { return false; } }, null, { timeout: 90000 });
  await page.waitForFunction(() => window.__p1aLab.status().tick >= 60, null, { timeout: 10000 });
  const before = await page.evaluate(() => window.__p1aLab.snapshot());
  const point = await page.evaluate(() => {
    const labRoot = cc.director.getScene()?.getChildByName('PhysicsLabRoot');
    const node = labRoot?.getChildByName('P1TouchControls')?.children.find(child => child.name === 'Touch-G');
    const p = node.worldPosition; const rect = document.querySelector('#GameCanvas').getBoundingClientRect(); const scale = Math.min(rect.width / 750, rect.height / 1334);
    return {x:rect.left+rect.width/2+p.x*scale,y:rect.top+rect.height/2-p.y*scale};
  });
  await page.mouse.click(point.x, point.y);
  await page.waitForFunction(() => cc.director.getScene()?.getChildByName('PhysicsLabRoot')?.children.some(n=>n.name==='P1ArtGallery'), null, { timeout:10000 });
  const result = await page.evaluate(async () => {
    const labRoot = cc.director.getScene().getChildByName('PhysicsLabRoot');
    const lab = labRoot.getComponent('PhysicsLab'); const gallery = lab.gallery; const art = gallery.art;
    gallery.content.children.forEach(node => { node.active = false; });
    const cases = [
      {id:'ui_panel_modal',size:1230,targets:[[128,96],[256,160],[420,240]]},
      {id:'ui_btn_primary_normal',size:256,targets:[[128,96],[256,96],[420,120]]},
      {id:'ui_btn_icon_normal',size:160,targets:[[72,72],[96,96],[160,160]]}
    ];
    const output=[];
    for(let row=0;row<cases.length;row++){
      const item=cases[row]; await art.load(item.id,item.size); const variant=art.getLoadedVariant(item.id);
      for(let column=0;column<item.targets.length;column++){
        const [w,h]=item.targets[column]; const node=art.createSprite(gallery.content,item.id,w,h); node.setPosition((column-1)*220,250-row*360,0);
        const sprite=node.getComponent('cc.Sprite'); const frameInsets=[sprite.spriteFrame.insetLeft,sprite.spriteFrame.insetTop,sprite.spriteFrame.insetRight,sprite.spriteFrame.insetBottom];
        output.push({assetId:item.id,variantId:variant.resource_key,pixels:variant.size,pivot:variant.pivot,insets:frameInsets,
          type:sprite.type,sliced:sprite.type===cc.Sprite.Type.SLICED,frameInsets,
          uiTransform:[node.getComponent('cc.UITransform').contentSize.width,node.getComponent('cc.UITransform').contentSize.height]});
      }
    }
    return {samples:output,expectedWorldId:window.__p1aLab.status().worldId,entityCount:window.__p1aLab.status().entityCount};
  });
  await page.waitForTimeout(500);
  await page.screenshot({path:'D:/Workspace/TapTap/奶茶挤挤/evidence/P1-A/20261029-p1a-final-14/raw/ART-03-001/cocos-nine-slice-preview.png',fullPage:true});
  const after = await page.evaluate(() => window.__p1aLab.snapshot());
  result.worldIdPreserved=before.worldId===after.worldId; result.bodyStatePreserved=JSON.stringify(before.bodies)===JSON.stringify(after.bodies);
  result.pass=result.samples.length===9&&result.samples.every(x=>x.sliced&&x.uiTransform[0]>0&&x.uiTransform[1]>0)&&result.worldIdPreserved&&result.bodyStatePreserved;
  result.buildId=await page.evaluate(()=>window.__p1aLab.status().buildId); return result;
}
