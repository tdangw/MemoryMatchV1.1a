export const TREASURE_CATALOG = Object.freeze([
  Object.freeze({ tier: 'C', name: 'Rương Mầm Non', difficulty: 'Dễ', mode: 'easy', wood: '#795038', face: '#a87649', metal: '#d6a85f', light: '#ffe2a1' }),
  Object.freeze({ tier: 'B', name: 'Rương Lá Bạc', difficulty: 'Trung bình', mode: 'normal', wood: '#304f69', face: '#557f9a', metal: '#c4deea', light: '#e4f6ff' }),
  Object.freeze({ tier: 'A', name: 'Rương Hoa Vàng', difficulty: 'Khó', mode: 'hard', wood: '#704329', face: '#ac7437', metal: '#f0cb71', light: '#fff0bb' }),
  Object.freeze({ tier: 'S', name: 'Rương Ánh Sao', difficulty: 'Siêu khó', mode: 'superHard', wood: '#493f6b', face: '#79639e', metal: '#e5ce87', light: '#f1dcff' }),
]);
export function treasureDefinition(tier) {
  const definition = TREASURE_CATALOG.find(chest => chest.tier === tier);
  if (!definition) throw new RangeError('Unknown treasure tier.');
  return definition;
}
