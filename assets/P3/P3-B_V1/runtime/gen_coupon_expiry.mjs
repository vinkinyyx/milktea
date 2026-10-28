/** P3-B coupon expiry. UTC+8 (Beijing) is fixed offset; uses trusted server time. */
const DAY=86400000, OFFSET=8*3600000;
export function nextBeijingMidnight(serverEpochMs) {
  if(!Number.isFinite(serverEpochMs)) throw new TypeError('trusted serverEpochMs required');
  return (Math.floor((serverEpochMs+OFFSET)/DAY)+1)*DAY-OFFSET;
}
export function couponTimeRemaining(serverEpochMs, expiryAtMs) {
  if(!Number.isFinite(serverEpochMs) || !Number.isFinite(expiryAtMs)) return null;
  const sec=Math.max(0,Math.ceil((expiryAtMs-serverEpochMs)/1000));
  return {expired:sec===0,seconds:sec,hours:Math.floor(sec/3600),minutes:Math.floor((sec%3600)/60),secs:sec%60};
}
export function couponExpiryLabel({serverEpochMs,expiryAtMs,balance}={}) {
  if (!Number.isFinite(serverEpochMs)) return '正在同步…';
  if(!Number.isFinite(balance)) return '券数待同步';
  const expires=Number.isFinite(expiryAtMs)?expiryAtMs:nextBeijingMidnight(serverEpochMs);
  const r=couponTimeRemaining(serverEpochMs,expires);if(!r)return '到期时间待同步';
  return r.expired?`剩余 ${Math.max(0,Math.floor(balance))} 张 · 已到期`:`剩余 ${Math.max(0,Math.floor(balance))} 张 · ${r.hours}小时${String(r.minutes).padStart(2,'0')}分后到期`;
}
export function drawCouponExpiry(ctx,{serverEpochMs,expiryAtMs,balance,x=0,y=0,font='16px sans-serif'}={}) {
  ctx.save();ctx.font=font;ctx.fillStyle='#60432F';ctx.fillText(couponExpiryLabel({serverEpochMs,expiryAtMs,balance}),x,y);ctx.restore();
}
