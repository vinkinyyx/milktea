/** Dynamic hazard line anchored to world y=1000. Breath 1Hz <= 2Hz. */
import {COLORS,worldYToScreen,clamp} from './core.mjs';
export const assetId='gen_danger_line';
export function dangerLineOpacity({danger=false,elapsedMs=0,reducedMotion=false}={}){
 if(!danger)return .30;
 if(reducedMotion)return .90;
 return clamp(.66+.22*Math.sin(2*Math.PI*1.0*Math.max(0,elapsedMs)/1000),.44,.88);
}
export function drawDangerLine(ctx,{worldY=1000,stageHeight=1334,minX=122,maxX=628,danger=false,elapsedMs=0,reducedMotion=false}={}){
 const y=worldYToScreen(worldY,stageHeight),opacity=dangerLineOpacity({danger,elapsedMs,reducedMotion});
 ctx.save();ctx.strokeStyle=danger?COLORS.alert:COLORS.caramel;ctx.globalAlpha=opacity;ctx.lineWidth=danger?5:3;
 ctx.lineCap='round';ctx.setLineDash([14,12]);ctx.beginPath();ctx.moveTo(minX,y);ctx.lineTo(maxX,y);ctx.stroke();ctx.setLineDash([]);ctx.restore();
 return {screenY:y,opacity,frequencyHz:danger&&!reducedMotion?1:0,worldY};
}
