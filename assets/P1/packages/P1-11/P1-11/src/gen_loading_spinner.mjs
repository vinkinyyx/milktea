/** Render in Canvas, no full-screen sprite; static text on reduced-motion preference. */
import {COLORS,paintText} from './core.mjs';
export const assetId='gen_loading_spinner';
export function spinnerAngle({elapsedMs=0,reducedMotion=false}={}){
 return reducedMotion?0:(Math.max(0,elapsedMs)%1000)/1000*Math.PI*2;
}
export function drawLoadingSpinner(ctx,{loading=true,x=375,y=650,elapsedMs=0,reducedMotion=false}={}){
 if(!loading)return {visible:false,animated:false};
 ctx.save();
 if(reducedMotion){paintText(ctx,'加载中…',x,y,{font:'bold 35px system-ui, sans-serif',color:COLORS.caramel});}
 else{
 const angle=spinnerAngle({elapsedMs});
 for(let i=0;i<12;i++){
  const a=angle+i*Math.PI/6;
  ctx.beginPath();ctx.moveTo(x+28*Math.cos(a),y+28*Math.sin(a));ctx.lineTo(x+44*Math.cos(a),y+44*Math.sin(a));
  ctx.strokeStyle=i===0?COLORS.caramel:COLORS.dark;ctx.lineWidth=7;ctx.lineCap='round';ctx.globalAlpha=.14+.78*(i+1)/12;ctx.stroke();
 }
 ctx.globalAlpha=1;paintText(ctx,'加载中…',x,y+90,{font:'600 23px system-ui, sans-serif',color:COLORS.caramel});
 }
 ctx.restore();return {visible:true,animated:!reducedMotion};
}
