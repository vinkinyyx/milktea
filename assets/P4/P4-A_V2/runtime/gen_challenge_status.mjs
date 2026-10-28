// P4-A | gen_challenge_status. Never claim a win from unverified or pending data.
export const CHALLENGE_STATES = Object.freeze({
  pending: {label:'待核验',icon:null,color:'#917C6D'},
  leading: {label:'领先',icon:'ui_icon_win',color:'#467C5B'},
  tie: {label:'平局',icon:'ui_icon_tie',color:'#AD834A'},
  trailing: {label:'落后',icon:'ui_icon_loss',color:'#B46F5E'},
  expired: {label:'已过期',icon:null,color:'#917C6D'},
});
export function getChallengeStatus({ ownScore, otherScore, verified = false, expired = false }={}) {
  if (expired) return 'expired';
  if (verified !== true || !Number.isFinite(ownScore) || !Number.isFinite(otherScore)) return 'pending';
  if(ownScore>otherScore)return 'leading';
  if(ownScore===otherScore)return 'tie';
  return 'trailing';
}
export function drawChallengeStatus(ctx, x, y, payload, icons={}) {
  const state=getChallengeStatus(payload);
  const spec=CHALLENGE_STATES[state];
  if(!ctx || typeof ctx.fillText!=='function') throw new TypeError('CanvasRenderingContext2D required');
  ctx.save();ctx.font='bold 22px sans-serif';ctx.textBaseline='middle';ctx.textAlign='left';
  const icon=spec.icon && icons[spec.icon];
  if(icon) ctx.drawImage(icon,x,y-20,40,40);
  ctx.fillStyle=spec.color;ctx.fillText(spec.label,x+(icon?48:0),y);ctx.restore();
  return { state, ...spec };
}
