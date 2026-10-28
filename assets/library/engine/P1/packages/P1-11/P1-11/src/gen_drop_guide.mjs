/** Visual drop guide only. Never apply forces or change collision geometry. */
import {COLORS,clamp,worldYToScreen} from './core.mjs';
export const assetId='gen_drop_guide';
export function resolveDropX(rawX,{minX=115,maxX=635,radius=24}={}){
 return clamp(rawX,minX+radius,maxX-radius);
}
export function drawDropGuide(ctx,{x=375,minX=115,maxX=635,bodyRadius=24,fromWorldY=1190,toWorldY=900,stageHeight=1334,visible=true}={}){
 const resolvedX=resolveDropX(x,{minX,maxX,radius:bodyRadius});
 if(!visible)return {resolvedX,visible:false,physicsModified:false};
 const y1=worldYToScreen(fromWorldY,stageHeight),y2=worldYToScreen(toWorldY,stageHeight);
 ctx.save();ctx.strokeStyle=COLORS.mint;ctx.lineWidth=5;ctx.globalAlpha=.80;ctx.setLineDash([8,13]);ctx.lineCap='round';
 ctx.beginPath();ctx.moveTo(resolvedX,y1);ctx.lineTo(resolvedX,y2);ctx.stroke();ctx.setLineDash([]);
 ctx.beginPath();ctx.ellipse(resolvedX,y2,28,8,0,0,Math.PI*2);ctx.stroke();ctx.restore();
 return {resolvedX,fromY:y1,toY:y2,visible:true,physicsModified:false};
}
