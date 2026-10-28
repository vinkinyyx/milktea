async page => {
  const root = 'http://127.0.0.1:8785/';
  const artifactDir = 'D:/Workspace/TapTap/奶茶挤挤/evidence/P1-A/20261029-p1a-final-14/raw/ART-02-002';
  await page.goto(root);
  await page.waitForFunction(() => document.querySelectorAll('.card').length === 81, null, { timeout: 15000 });
  const result = { buildId: await page.locator('h1').innerText(), overviewCount: await page.locator('.card').count(), images: [] };
  await page.screenshot({ path: `${artifactDir}/art-overview.png`, fullPage: true });
  result.alphaAnchorReview = await page.evaluate(() => window.__p1aArtReviewInspectAll());
  result.actualVariantHashesMatch = result.alphaAnchorReview.length === 81 && result.alphaAnchorReview.every(row => row.hashMatches && row.nonEmpty);
  await page.locator('#asset').selectOption('spr_cup_classic_front');
  await page.locator('[data-mode="anchor"]').click();
  await page.waitForFunction(() => document.querySelector('#alpha')?.textContent.includes('L/T/R/B='));
  result.anchor = await page.evaluate(() => ({ assetId: document.querySelector('#asset').value, alpha: document.querySelector('#alpha').textContent,
    pixels: window.__p1aArtReview.variants.find(v => v.assetId === document.querySelector('#asset').value)?.pixels,
    pivot: window.__p1aArtReview.variants.find(v => v.assetId === document.querySelector('#asset').value)?.pivot }));
  await page.screenshot({ path: `${artifactDir}/art-anchor-alpha.png`, fullPage: true });
  const nineRows = await page.evaluate(() => window.__p1aArtReview.variants.filter(v => v.nineSliceInsets));
  result.nineSlice = [];
  if (nineRows.length) {
    await page.locator('#asset').selectOption(nineRows[0].assetId); await page.locator('[data-mode="nine"]').click();
    for (let i=0;i<nineRows.length;i++) {
      const row=nineRows[i]; if (i>0) await page.locator('#asset').selectOption(row.assetId);
      await page.waitForFunction(id => document.querySelector('h2')?.textContent.includes(id) && document.querySelectorAll('#samples canvas').length===3,
        row.assetId, { timeout: 10000 });
      const item = await page.evaluate(() => ({ assetId: document.querySelector('#asset').value,
        insets: window.__p1aArtReview.variants.find(v => v.assetId === document.querySelector('#asset').value)?.nineSliceInsets,
        targets: [...document.querySelectorAll('.sample b')].map(n => n.textContent) }));
      result.nineSlice.push(item); await page.screenshot({ path: `${artifactDir}/nine-${String(i+1).padStart(2,'0')}-${row.assetId}.png`, fullPage: true });
    }
  }
  await page.locator('[data-mode="cup"]').click();
  await page.waitForFunction(() => document.querySelector('#cup') !== null, null, { timeout: 10000 });
  result.cup = await page.evaluate(async () => ({ layerCount: window.__p1aArtReview.cupLayerOrder.length,
    order: window.__p1aArtReview.cupLayerOrder.map(x => x.assetId), width: document.querySelector('#cup').width, height: document.querySelector('#cup').height,
    imageNaturalSizes: await Promise.all(window.__p1aArtReview.cupLayerOrder.map(row => new Promise(resolve => { const im = new Image(); im.onload = () => resolve([im.naturalWidth, im.naturalHeight]); im.onerror = () => resolve(null); im.src = row.compiledNativePath; }))) }));
  await page.screenshot({ path: `${artifactDir}/art-cup-layers-scale1.png`, fullPage: true });
  await page.locator('#cupScale').selectOption('0.8'); await page.waitForTimeout(200);
  await page.screenshot({ path: `${artifactDir}/art-cup-layers-scale08.png`, fullPage: true });
  result.pageErrors = [];
  return result;
}
