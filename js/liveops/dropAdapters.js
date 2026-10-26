function group(wave, ids, special) {
  if (!wave) return undefined;
  return { gameId:wave.gameId, mode:wave.mode, attempt:wave.attemptId, wave:wave.index,
    group:[...ids].sort().join('|'), special:Boolean(special) };
}
export function memoryTicketDrop(wave, first, second, rewards) {
  return group(wave,[first.id,second.id],first.special || second.special || rewards.lucky);
}
export function linkTicketDrop(wave, first, second) {
  return group(wave,[first.instanceId,second.instanceId],first.special || second.special || first.luckyReward || second.luckyReward);
}
export function tripleTicketDrop(wave, tiles, tileIds, freshTileIds) {
  return freshTileIds.length ? group(wave,tileIds,tileIds.some(id=>Boolean(tiles[id].lucky))) : undefined;
}
