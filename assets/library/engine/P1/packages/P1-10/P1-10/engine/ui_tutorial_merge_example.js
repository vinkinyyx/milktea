/** P1-10 | ui_tutorial_merge_example | ENGINE-ONLY RUNTIME ELEMENT
 * Draws TWO same-level ingredient thumbnails merging into the NEXT LEVEL thumbnail.
 * No new artwork is painted here. Provided images must already exist (P1-02).
 * Device pixel ratio / logical DU positioning is handled by the caller.
 */
export function drawTutorialMerge(ctx, {left, right, result, x=0, y=0, size=256, alpha=1}) {
  if (!ctx || !left || !right || !result) return;
  const s=size/256;
  ctx.save(); ctx.globalAlpha *= alpha; ctx.translate(x,y); ctx.scale(s,s);
  // rounded milk-paper panel - engine drawn, not a PNG asset
  ctx.fillStyle='rgba(255,247,231,.87)';ctx.strokeStyle='#9C6947';ctx.lineWidth=4;
  ctx.beginPath();ctx.roundRect(8,24,240,208,24);ctx.fill();ctx.stroke();
  const put=(im,cx,cy,side)=>ctx.drawImage(im,cx-side/2,cy-side/2,side,side);
  put(left,71,105,65);put(right,177,105,65);
  // Dynamic plus sign and downward arrow communicate next-level merging.
  ctx.strokeStyle='#A66C44';ctx.lineWidth=7;ctx.lineCap='round';ctx.lineJoin='round';
  ctx.beginPath();ctx.moveTo(120,105);ctx.lineTo(136,105);ctx.moveTo(128,97);ctx.lineTo(128,113);ctx.stroke();
  ctx.beginPath();ctx.moveTo(128,137);ctx.lineTo(128,157);ctx.moveTo(119,149);ctx.lineTo(128,158);ctx.lineTo(137,149);ctx.stroke();
  put(result,128,190,67);ctx.restore();
}
