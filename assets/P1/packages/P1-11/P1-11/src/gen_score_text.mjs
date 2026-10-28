/** Current score, best score, and optional floating score: all runtime text. */
import {COLORS,asInteger,paintText,card,clamp} from './core.mjs';
export const assetId='gen_score_text';
export function scoreViewModel({score=0,best=0,floats=[],reducedMotion=false}={}){
 const safeScore=asInteger(score),safeBest=Math.max(safeScore,asInteger(best));
 const visibleFloats=reducedMotion?[]:floats.filter(x=>x&&Number.isFinite(x.ageMs)&&x.ageMs>=0&&x.ageMs<900&&Number.isFinite(x.delta)).map(x=>({delta:Math.floor(x.delta),x:clamp(x.x??375,0,750),y:clamp(x.y??520,0,1334),ageMs:x.ageMs}));
 return {score:safeScore,best:safeBest,floats:visibleFloats};
}
export function drawScoreText(ctx,opts={}){
 const model=scoreViewModel(opts),{x=190,y=116}=opts;
 card(ctx,x-160,y-50,320,104,'rgba(255,248,235,.94)',COLORS.caramel,16);
 paintText(ctx,`得分 ${model.score}`,x,y-20,{font:'bold 33px system-ui, sans-serif'});
 paintText(ctx,`最高 ${model.best}`,x,y+25,{font:'600 22px system-ui, sans-serif',color:COLORS.caramel});
 for(const f of model.floats){const t=f.ageMs/900;ctx.save();ctx.globalAlpha=1-t;
 paintText(ctx,`+${f.delta}`,f.x,f.y-44*t,{font:'bold 34px system-ui, sans-serif',color:COLORS.mint,width:3});ctx.restore();}
 return model;
}
