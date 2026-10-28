/** Full-area canvas dim is NOT enough to block pointer input; use hitTestModalDim. */
import {clamp} from './core.mjs';
export const assetId='gen_modal_dim';
export function drawModalDim(ctx,{active=true,width=750,height=1334,alpha=.55}={}){
 if(!active)return {active:false,alpha:0};
 ctx.save();ctx.fillStyle=`rgba(38,26,20,${clamp(alpha,0,1)})`;ctx.fillRect(0,0,width,height);ctx.restore();
 return {active:true,alpha:clamp(alpha,0,1),width,height};
}
export function hitTestModalDim({active=false,x=0,y=0,panelRect=null}={}){
 if(!active)return false;
 if(!panelRect)return true;
 const inPanel=x>=panelRect.x&&x<=panelRect.x+panelRect.width&&y>=panelRect.y&&y<=panelRect.y+panelRect.height;
 return !inPanel;
}
export function blockOutsidePanelPointer(event,{active,panelRect,canvas}={}){
 if(!active||!canvas)return false;
 const b=canvas.getBoundingClientRect(),x=(event.clientX-b.left)*canvas.width/b.width,y=(event.clientY-b.top)*canvas.height/b.height;
 const blocked=hitTestModalDim({active,x,y,panelRect});
 if(blocked){event.preventDefault();event.stopPropagation();}
 return blocked;
}
