// P4-A | gen_daily_budget | Canvas2D, no fixed art / no hardcoded fake player progress.
export const DAILY_THROW_LIMIT = 120;
export function budgetState(throws) {
  if (!Number.isFinite(throws)) throw new TypeError('throws must be finite');
  const value = Math.max(0, Math.min(DAILY_THROW_LIMIT, Math.floor(throws)));
  return { value, limit: DAILY_THROW_LIMIT, remaining: DAILY_THROW_LIMIT - value,
    ratio: value / DAILY_THROW_LIMIT, label: `${value}/${DAILY_THROW_LIMIT}`,
    finished: value >= DAILY_THROW_LIMIT };
}
export function drawDailyBudget(ctx, x, y, width, height, throws, opts = {}) {
  const b = budgetState(throws);
  if (!ctx || typeof ctx.fillRect !== 'function') throw new TypeError('CanvasRenderingContext2D required');
  const { reducedMotion = false, showLabel = true } = opts;
  if (width <= 0 || height <= 0) throw new RangeError('invalid bar size');
  ctx.save();
  ctx.fillStyle = '#EBD4B5';
  rounded(ctx,x,y,width,height,height/2);ctx.fill();
  // deterministic, reduced-motion-friendly; no animation/timers inside renderer
  const pad = Math.max(2, Math.min(height / 6, 5));
  const fillWidth = Math.max(0,(width-2*pad)*b.ratio);
  if(fillWidth > 0) {
    ctx.fillStyle = b.finished ? '#8BB39A' : '#C98952';
    rounded(ctx, x+pad, y+pad, fillWidth, height-2*pad, Math.min((height-2*pad)/2,fillWidth/2));ctx.fill();
  }
  if (showLabel) {
    ctx.font = `${Math.max(12,Math.floor(height*0.52))}px sans-serif`;
    ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#3B271E';
    ctx.fillText(b.label,x+width/2,y+height/2);
  }
  ctx.restore();
  return {...b, reducedMotion};
}
function rounded(ctx,x,y,w,h,r){
  if (typeof ctx.roundRect==='function') {ctx.beginPath();ctx.roundRect(x,y,w,h,r);return;}
  const rr=Math.min(r,Math.abs(w)/2,Math.abs(h)/2);
  ctx.beginPath();ctx.moveTo(x+rr,y);ctx.lineTo(x+w-rr,y);ctx.quadraticCurveTo(x+w,y,x+w,y+rr);ctx.lineTo(x+w,y+h-rr);ctx.quadraticCurveTo(x+w,y+h,x+w-rr,y+h);ctx.lineTo(x+rr,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-rr);ctx.lineTo(x,y+rr);ctx.quadraticCurveTo(x,y,x+rr,y);ctx.closePath();
}
