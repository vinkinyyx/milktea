export function renderErrorEmpty(ctx,x,y,w,h,{icon=null,message='',retryLabel='重试'}={}) {
 ctx.save();ctx.fillStyle='#FEF5E8';ctx.beginPath();ctx.roundRect(x,y,w,h,20);ctx.fill();
 ctx.fillStyle='#65422f';ctx.textAlign='center';ctx.font='22px sans-serif';ctx.fillText(message,x+w/2,y+h*.55,w-42);ctx.restore();
 // Render ui_icon_info/offline separately and wire actual retry button to the loading/error state machine.
}
