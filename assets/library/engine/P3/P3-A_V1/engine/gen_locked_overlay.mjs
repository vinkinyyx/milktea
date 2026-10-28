export function renderLockedOverlay(ctx,x,y,w,h,opacity=.56) {
 ctx.save();ctx.fillStyle=`rgba(59,49,43,${Math.max(0,Math.min(opacity,.85))})`;ctx.beginPath();ctx.roundRect(x,y,w,h,24);ctx.fill();ctx.restore();
 // Place ui_icon_lock.png using an independent sprite node. Do not bake unlock threshold text.
}
