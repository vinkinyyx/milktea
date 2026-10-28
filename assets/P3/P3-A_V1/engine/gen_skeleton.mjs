export function renderSkeleton(ctx, x, y, w, h, t=0) {
 ctx.save(); const k=0.13+0.04*Math.sin(t*2); ctx.fillStyle=`rgba(133,105,76,${k})`;
 for (let j=0;j<4;j++){ctx.beginPath();ctx.roundRect(x+16,y+18+j*65,w-32,46,12);ctx.fill();}
 ctx.restore();
}
