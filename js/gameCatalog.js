// Danh mục dùng chung cho selector, menu và tiến trình. Khi thêm game mới,
// khai báo metadata tại đây trước khi nối controller/renderer của game đó.
export const GAME_DEFINITIONS = Object.freeze([
  Object.freeze({
    id: "memory-match",
    progressKey: "memoryMatch",
    title: "Memory Match",
    description: "Mới thấy đó thôi, chớp mắt đã quên!",
    icon: "images",
  }),
  Object.freeze({
    id: "link-connect",
    progressKey: "linkConnect",
    title: "Link Connect",
    description: "Ngay trước mắt nhìn, vạn dặm xa xôi!",
    icon: "puzzle",
  }),
  Object.freeze({
    id: "triple-connect",
    progressKey: "tripleConnect",
    title: "Triple Connect",
    description: "Nhìn tưởng dễ ăn, chớp mắt chịu thua!",
    icon: "puzzle",
    released: true,
  }),
]);

export const GAME_MODES = Object.freeze([
  Object.freeze({ id: "easy", label: "Dễ", icon: "status-easy" }),
  Object.freeze({ id: "normal", label: "Trung bình", icon: "status-normal" }),
  Object.freeze({ id: "hard", label: "Khó", icon: "status-hard" }),
  Object.freeze({ id: "superHard", label: "Siêu khó", icon: "status-super-hard" }),
  Object.freeze({ id: "endless", label: "Vô tận", icon: "timer" }),
  Object.freeze({ id: "challenge", label: "Thử thách", icon: "trophy" }),
]);

export function getGameDefinition(gameId) {
  return GAME_DEFINITIONS.find((game) => game.id === gameId) || null;
}

export function getGameProgressKey(gameId) {
  return getGameDefinition(gameId)?.progressKey || null;
}

export function getGameMode(modeId) {
  return GAME_MODES.find((mode) => mode.id === modeId) || null;
}

export function getGameModeLabel(modeId) {
  return getGameMode(modeId)?.label || modeId;
}

export function getGameModeIcon(modeId) {
  return getGameMode(modeId)?.icon || "play";
}
