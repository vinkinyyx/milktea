/** P3-B dynamic rank rendering, no fixed score/rank in PNG. */
export function standardCompetitionRanks(entries) {
  const sorted = [...entries].filter(x=>Number.isFinite(x.score)).sort((a,b)=>b.score-a.score);
  let lastScore = null, currentRank = 0;
  return sorted.map((entry, index) => { if(lastScore === null || entry.score!==lastScore) currentRank=index+1; lastScore=entry.score; return {...entry, rank:currentRank}; });
}
export function leaderboardRankLabel({rank, surpassedPercent}={}) {
  const r=Number.isInteger(rank)&&rank>0 ? `第 ${rank} 名` : '暂无排名';
  const p=Number.isFinite(surpassedPercent) && surpassedPercent>=0 && surpassedPercent<=100 ? ` · 超过 ${surpassedPercent.toFixed(1)}% 玩家` : '';
  return r+p;
}
export function drawLeaderboardRank(ctx,{rank,surpassedPercent,x=0,y=0,color='#593E31',font='bold 18px sans-serif'}={}) {
  ctx.save();ctx.fillStyle=color;ctx.font=font;ctx.textAlign='left';ctx.textBaseline='alphabetic';
  ctx.fillText(leaderboardRankLabel({rank,surpassedPercent}),x,y);ctx.restore();
}
