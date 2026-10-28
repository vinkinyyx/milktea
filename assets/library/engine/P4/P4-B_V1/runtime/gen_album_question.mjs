/** Draw a dynamic ? over P1-derived ingredient silhouette, not an invented tenth grade. */
export const ASSET_ID = 'gen_album_question';
export function drawAlbumQuestion(ctx, x, y, boxSize, options={}) {
  if (!ctx || typeof ctx.save !== 'function') throw new TypeError('CanvasRenderingContext2D required');
  if (![x,y,boxSize].every(Number.isFinite) || boxSize <= 0) throw new RangeError('Invalid coordinates/boxSize');
  const {color='#FFF6E7', stroke='#4B3023', fontFamily='system-ui, sans-serif', scale=0.54} = options;
  ctx.save();ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.font=`900 ${Math.max(11,Math.round(boxSize*scale))}px ${fontFamily}`;
  ctx.lineWidth=Math.max(2,boxSize*.035);ctx.strokeStyle=stroke;ctx.fillStyle=color;
  ctx.strokeText('?',x+boxSize/2,y+boxSize/2,boxSize*.8);
  ctx.fillText('?',x+boxSize/2,y+boxSize/2,boxSize*.8);ctx.restore();
}
