import { memoryRoot } from "./memoryShellDom.js";
import { createGameShell } from "../gameShell/gameShell.js";
import { createGameShellHud } from "../gameShell/gameShellHud.js";
import { formatClockTime } from "../uiCatalog.js";

const regions = Object.fromEntries([...memoryRoot.querySelectorAll("[data-shell-region]")].map(node => [node.dataset.shellRegion, node]));
const shell = createGameShell({ root: memoryRoot, regions, title: "Memory Match", display: "flex", backgroundScene: 'memory-match' });
export function getMemoryShell() { return shell; }
let memory;
export function getMemoryHud() {
  if (memory) return memory;
  const find = id => memoryRoot.querySelector(`[id="${id}"]`);
  const ids = { score: "score", level: "level", moves: "moves", misses: "misses", combo: "combo", totalStars: "total-stars", timer: "timer-value" };
  const stats = Object.fromEntries(Object.entries(ids).map(([key, id]) => [key, { element: find(id) }]));
  stats.combo.format = value => value > 1 ? `x${value}` : "0";
  stats.timer.format = formatClockTime;
  const assist = (id, label) => ({ element: find(id), count: find(id).querySelector(".hud-tool-count"), format: count => `${label} · Đang có: ${count}` });
  return memory = createGameShellHud({ stats,
    stars: { element: find("level-stars"), fill: find("level-stars-fill"), card: find("level-stars")?.closest(".stat-star-progress"), scoreCard: find("score")?.closest(".stat-points") },
    coins: { element: find("memory-game-coins"), balance: find("memory-coin-balance") },
    tools: {
      time: assist("btn-buy-time", "Thời gian"), preview: assist("btn-preview-cards", "Xem trước"),
      hint: { element: find("btn-hint"), count: find("btn-hint").querySelector(".hud-tool-count"), format: count => `Gợi ý · Đang có: ${count}`, tooltip: "Lật 2 thẻ để bạn ghi nhớ." },
    },
    milestones: { track: find("memory-special-hud"), markers: [...memoryRoot.querySelectorAll("[data-memory-special-milestone]")], format: (progress, target) => `Năng lượng ${progress}/${target}` },
  });
}
