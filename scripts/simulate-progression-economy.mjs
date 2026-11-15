import { writeFile } from 'node:fs/promises';
import { getModeLayout, getChallengeLayout, calculateCoinReward } from '../js/config.js';
import { getLinkModeLayout, getLinkChallengeLayout, calculateLinkCoinReward } from '../js/linkConnect/linkConfig.js';
import { getTripleModeConfig, getTripleChallengeStage, calculateTripleCoinReward } from '../js/tripleConnect/tripleConfig.js';
import { getLevelWaveCount, calculateWaveTime, calculateGroupScore, calculateFastFinishBonus, calculateProgressionStars, calculateVictoryCoins } from '../js/progression/gameplayRules.js';

const rows=[];
for(const gameId of ['memory-match','link-connect','triple-connect']) for(const mode of ['easy','normal','hard','superHard','challenge','endless']) for(const level of [1,11,51,91]) {
  const layout=gameId==='memory-match' ? mode==='challenge' ? getChallengeLayout(level) : getModeLayout(mode)
    : gameId==='link-connect' ? mode==='challenge' ? getLinkChallengeLayout(level) : getLinkModeLayout(mode)
      : mode==='challenge' ? getTripleChallengeStage(level) : getTripleModeConfig(mode);
  const groups=layout.tileCount/(gameId==='triple-connect'?3:2);
  const waves=getLevelWaveCount(level), totalGroups=groups*waves;
  const budget=calculateWaveTime({gameId,mode,totalGroups:groups})*waves;
  for(const [skill,chain,ratio] of [['careful',2,.85],['regular',4,.65],['quick',8,.45]]) for(const assisted of [false,true]) {
    let score=0;
    for(let wave=0;wave<waves;wave++) for(let group=0;group<groups;group++) score+=calculateGroupScore({combo:group%chain+1,automatic:assisted && group%5===4});
    // Endless has no countdown: use the timed Normal pace only to estimate duration.
    const activeMs=Math.round((budget || calculateWaveTime({gameId,mode:'normal',totalGroups:groups})*waves)*ratio*1000);
    score+=calculateFastFinishBonus({totalGroups,mode,activeMs,allocatedSeconds:budget});
    const stars=calculateProgressionStars({gameId,score,totalGroups,mode,won:true});
    const coins=calculateVictoryCoins({gameId,mode,totalGroups,stars});
    const oldThreeStarCoins=gameId==='memory-match' ? calculateCoinReward(mode,Math.floor((layout.timeSeconds||60)*(1-ratio)))
      : gameId==='link-connect' ? calculateLinkCoinReward(mode,Math.floor((layout.timeSeconds||60)*(1-ratio)))
        : calculateTripleCoinReward({mode,matchedTriples:groups,stars:3,maxCombo:chain});
    rows.push({gameId,mode,level,waves,groups,totalGroups,skill,assisted,budgetSeconds:budget,estimatedActiveSeconds:activeMs/1000,score,stars,coins,estimatedCoinsPerActiveMinute:Math.round(coins/(activeMs/60000)*10)/10,oldSingleBoardCoinsAtThreeStars:oldThreeStarCoins});
  }
}
const columns=Object.keys(rows[0]);
await writeFile('docs/qa/gameplay-progression/economy.csv',[columns.join(','),...rows.map(row=>columns.map(key=>row[key]).join(','))].join('\n')+'\n');
console.log(`${rows.length} deterministic scenarios: three games, six modes, four wave counts, three skill bands, with/without automatic assistance.`);
for(const gameId of ['memory-match','link-connect','triple-connect']) {
  const samples=rows.filter(row=>row.gameId===gameId && row.mode==='easy' && row.level===1 && !row.assisted);
  console.log(gameId,JSON.stringify(samples.map(({skill,score,stars,coins,estimatedActiveSeconds})=>({skill,score,stars,coins,estimatedActiveSeconds}))));
}
