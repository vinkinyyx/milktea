/** P1-11: gameplay coordinates in 750x1334 design units. No baked dynamic text. */
export const DESIGN_WIDTH=750, DESIGN_HEIGHT=1334, TICK_RATE=60;
export const COLORS=Object.freeze({brown:'#6E3E2D',dark:'#44291D',caramel:'#BD7750',cream:'#FFF0D4',alert:'#D95E48',mint:'#65916F'});
export const clamp=(v,min,max)=>Math.min(max,Math.max(min,Number.isFinite(v)?v:min));
export const asInteger=(v)=>Math.max(0,Math.floor(Number.isFinite(v)?v:0));
export function worldYToScreen(y,stageHeight=DESIGN_HEIGHT){return stageHeight-y;}
export function paintText(ctx,text,x,y,options={}){
 const {font='bold 30px system-ui, sans-serif',align='center',color=COLORS.dark,outline='rgba(255,246,226,.95)',width=4}=options;
 ctx.save();ctx.font=font;ctx.textAlign=align;ctx.textBaseline='middle';
 if(outline&&width){ctx.strokeStyle=outline;ctx.lineWidth=width;ctx.lineJoin='round';ctx.strokeText(String(text),x,y);}
 ctx.fillStyle=color;ctx.fillText(String(text),x,y);ctx.restore();
}
export function card(ctx,x,y,w,h,fill='rgba(255,247,232,.96)',stroke=COLORS.caramel,r=20){
 ctx.save();ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle=stroke;ctx.lineWidth=3;ctx.stroke();ctx.restore();
}
