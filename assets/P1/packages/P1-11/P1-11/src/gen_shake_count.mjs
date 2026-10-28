/** Shake charges, ticket charges and cooldown are gameplay-controlled UI values. */
import {COLORS,asInteger,clamp,paintText,card} from './core.mjs';
export const assetId='gen_shake_count';
export function shakeViewModel({baseRemaining=0,ticketRemaining=0,cooldownTicks=0,cooldownTotalTicks=180}={}){
 const base=asInteger(baseRemaining),tickets=asInteger(ticketRemaining),cooldown=asInteger(cooldownTicks);
 const progress=clamp(1-cooldown/Math.max(1,asInteger(cooldownTotalTicks)),0,1);
 return {base,tickets,cooldown,progress,canShake:base+tickets>0&&cooldown===0};
}
export function drawShakeCount(ctx,{x=575,y=1110,...options}={}){
 const m=shakeViewModel(options);card(ctx,x-145,y-73,290,146,m.canShake?'rgba(255,249,232,.97)':'rgba(222,215,205,.92)',m.canShake?COLORS.caramel:'#9D9892',19);
 paintText(ctx,'晃一晃',x,y-39,{font:'bold 29px system-ui, sans-serif',color:m.canShake?COLORS.dark:'#6C6C6C'});
 paintText(ctx,`基础 ${m.base}  ·  券 ${m.tickets}`,x,y+2,{font:'600 20px system-ui, sans-serif',color:m.canShake?COLORS.dark:'#6C6C6C'});
 ctx.save();ctx.fillStyle='rgba(113,93,71,.20)';ctx.fillRect(x-114,y+35,228,11);
 ctx.fillStyle=m.canShake?COLORS.mint:'#A79D92';ctx.fillRect(x-114,y+35,228*m.progress,11);ctx.restore();
 return m;
}
