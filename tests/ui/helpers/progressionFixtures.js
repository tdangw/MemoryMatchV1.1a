export async function seedProgressionAccess() {
  const { gameState } = await import('/js/gameState.js');
  const { getLevelWaveCount } = await import('/js/progression/gameplayRules.js');
  for(const key of ['memoryMatch','linkConnect','tripleConnect']) {
    const best=gameState.progress[key].bestByLevel;
    for(const level of [1,10,11,50,51,90,91]) for(const mode of ['easy','normal','hard','superHard'])
      best[`${mode}:${level}`]={score:100,stars:1,cleared:true,rulesVersion:1,completedWaves:getLevelWaveCount(level)};
  }
  gameState.settings.sound=gameState.settings.music=false;
  if(!await(await import('/js/persistence.js')).savePersistentGameData({progress:gameState.progress})) throw new Error('Access fixture could not be saved.');
}

export async function startProgressionScene(gameId, mode='easy', level=1) {
  const { gameState } = await import('/js/gameState.js');
  gameState.settings.mode=mode;
  if(gameId==='memory-match') return(await import('/js/gameController.js')).initializeLevel(level,{skipIntro:true});
  if(gameId==='link-connect') return(await import('/js/linkConnect/linkController.js')).startLinkLevel({mode,level,skipIntro:true});
  return(await import('/js/tripleConnect/tripleController.js')).startTripleConnectRound({mode,level,skipIntro:true});
}
