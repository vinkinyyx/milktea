/** 180 simulation ticks at 60Hz; pause MUST freeze remaining ticks. */
import {COLORS,asInteger,paintText,card,TICK_RATE} from './core.mjs';
export const assetId='gen_danger_countdown',FULL_TICKS=180;
export function advanceDangerTimer(remainingTicks,deltaTicks,{paused=false}={}){
 return paused?asInteger(remainingTicks):Math.max(0,asInteger(remainingTicks)-asInteger(deltaTicks));
}
export function remainingSeconds(ticks){return Math.ceil(asInteger(ticks)/TICK_RATE);}
export function drawDangerCountdown(ctx,{remainingTicks=FULL_TICKS,paused=false,x=375,y=235,visible=true}={}){
 const sec=remainingSeconds(remainingTicks);
 if(!visible||!sec)return {seconds:sec,paused,visible:false};
 card(ctx,x-118,y-46,236,92,'rgba(255,246,222,.98)',COLORS.alert,18);
 paintText(ctx,`危险 ${sec}`,x,y,{font:'bold 39px system-ui, sans-serif',color:COLORS.alert});
 return {seconds:sec,paused,visible:true};
}
