import {DESIGN_HEIGHT,DESIGN_WIDTH,COLORS,paintText,card} from '../src/core.mjs';
import {drawDangerLine} from '../src/gen_danger_line.mjs';
import {drawDropGuide} from '../src/gen_drop_guide.mjs';
import {drawScoreText} from '../src/gen_score_text.mjs';
import {drawDangerCountdown} from '../src/gen_danger_countdown.mjs';
import {drawShakeCount} from '../src/gen_shake_count.mjs';
import {drawModalDim,blockOutsidePanelPointer} from '../src/gen_modal_dim.mjs';
import {drawLoadingSpinner} from '../src/gen_loading_spinner.mjs';
const modes=[['gen_danger_line','警戒线'],['gen_drop_guide','落点虚线'],['gen_score_text','动态分数'],['gen_danger_countdown','危险倒计时'],['gen_shake_count','晃杯次数'],['gen_modal_dim','弹窗遮罩'],['gen_loading_spinner','加载动画']];
const canvas=document.querySelector('#stage'),ctx=canvas.getContext('2d'),select=document.querySelector('#mode'),reduced=document.querySelector('#reduce'),paused=document.querySelector('#paused'),tick=document.querySelector('#tick');
for(const [id,title] of modes){const el=document.createElement('option');el.value=id;el.textContent=`${title} / ${id}`;select.append(el);}
let mode=modes[0][0],toggle=true,dropX=375,mouseBlocked=0,start=performance.now();
select.addEventListener('change',()=>mode=select.value);
document.querySelector('#toggle').addEventListener('click',()=>toggle=!toggle);
tick.addEventListener('input',()=>document.querySelector('#ticksLabel').textContent=tick.value);
canvas.addEventListener('pointermove',e=>{if(mode!=='gen_drop_guide')return;const b=canvas.getBoundingClientRect();dropX=(e.clientX-b.left)*canvas.width/b.width;});
canvas.addEventListener('pointerdown',e=>{const block=blockOutsidePanelPointer(e,{active:mode==='gen_modal_dim'&&toggle,canvas,panelRect:{x:140,y:480,width:470,height:365}});if(block)mouseBlocked++;});
function background(){
 let grd=ctx.createLinearGradient(0,0,0,1334);grd.addColorStop(0,'#FFF7E8');grd.addColorStop(1,'#F3D7AE');ctx.fillStyle=grd;ctx.fillRect(0,0,750,1334);
 ctx.fillStyle='rgba(157,103,64,.10)';for(let x=30;x<750;x+=130){ctx.fillRect(x,270,3,760);}
 // Classic cup inner collision geometry based on original 750DU source guide.
 ctx.save();ctx.beginPath();ctx.moveTo(115,274);ctx.lineTo(635,274);ctx.lineTo(555,1074);ctx.lineTo(195,1074);ctx.closePath();
 ctx.fillStyle='rgba(236,183,132,.31)';ctx.fill();ctx.strokeStyle='#B98F71';ctx.lineWidth=6;ctx.stroke();
 ctx.beginPath();ctx.ellipse(375,274,260,36,0,0,Math.PI*2);ctx.fillStyle='rgba(255,248,236,.65)';ctx.fill();ctx.strokeStyle='#C49B7A';ctx.lineWidth=5;ctx.stroke();
 ctx.beginPath();ctx.ellipse(375,1074,180,22,0,0,Math.PI);ctx.strokeStyle='#C49B7A';ctx.stroke();ctx.restore();
 card(ctx,240,1144,270,67,'rgba(255,246,230,.9)',COLORS.caramel,16);paintText(ctx,'奶茶挤挤 · 运行图元测试',375,1177,{font:'bold 24px system-ui, sans-serif'});
}
function render(t){const elapsedMs=t-start;ctx.clearRect(0,0,DESIGN_WIDTH,DESIGN_HEIGHT);background();
 const opts={elapsedMs,reducedMotion:reduced.checked};let last;
 switch(mode){
 case 'gen_danger_line':last=drawDangerLine(ctx,{...opts,danger:toggle});break;
 case 'gen_drop_guide':last=drawDropGuide(ctx,{x:dropX,bodyRadius:32});break;
 case 'gen_score_text':last=drawScoreText(ctx,{score:12840,best:25600,floats:[{delta:80,x:425,y:635,ageMs:elapsedMs%900}],x:190,y:185,reducedMotion:reduced.checked});break;
 case 'gen_danger_countdown':last=drawDangerCountdown(ctx,{remainingTicks:+tick.value,paused:paused.checked,x:375,y:343});break;
 case 'gen_shake_count':last=drawShakeCount(ctx,{baseRemaining:toggle?2:0,ticketRemaining:toggle?1:0,cooldownTicks:toggle?0:88,x:375,y:620});break;
 case 'gen_modal_dim':{
  drawModalDim(ctx,{active:toggle});card(ctx,140,480,470,365);paintText(ctx,'暂停游戏',375,575,{font:'bold 51px system-ui, sans-serif'});paintText(ctx,'遮罩区域禁止点击底层',375,658,{font:'600 25px system-ui, sans-serif'});paintText(ctx,`已拦截 ${mouseBlocked} 次`,375,718,{font:'bold 26px system-ui, sans-serif'});break;}
 case 'gen_loading_spinner':last=drawLoadingSpinner(ctx,{...opts,loading:true});break;
 }
 paintText(ctx,`P1-11  /  ${mode}`,375,70,{font:'bold 27px system-ui, sans-serif',color:COLORS.brown});
 window.__lastAssetReturn=last;window.__lastDrawMode=mode;
 if(!window.__staticCapture)requestAnimationFrame(render);
}
window.naichaDemo={setMode(value){if(modes.some(x=>x[0]===value)){mode=value;select.value=value;}},setReducedMotion(v){reduced.checked=!!v;},setDanger(v){toggle=!!v;},setTicks(v){tick.value=String(v);document.querySelector('#ticksLabel').textContent=tick.value;},capture(){window.__staticCapture=true;render(performance.now());}};
requestAnimationFrame(render);
