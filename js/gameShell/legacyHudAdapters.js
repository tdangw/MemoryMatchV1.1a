import { createGameShellHud } from "./gameShellHud.js";
import { formatClockTime } from "../uiCatalog.js";

// ID adapters are removed with legacy markup in Phases 7–8.
let memory;
const link = new WeakMap();
export function getMemoryHud() {
  if (memory) return memory;
  const find = id => document.getElementById(id);
  const ids = { score: "score", level: "level", hint: "hint", moves: "moves", misses: "misses", combo: "combo", matchedPairs: "matched-pairs", totalPairs: "total-pairs", totalStars: "total-stars", timer: "timer-value" };
  const stats = Object.fromEntries(Object.entries(ids).map(([key, id]) => [key, { element: find(id) }]));
  stats.combo.format = value => value > 1 ? `x${value}` : "0";
  stats.timer.format = formatClockTime;
  const assist = (id, label) => ({ element: find(id), format: count => `${label} · Đang có: ${count}` });
  return memory = createGameShellHud({ stats,
    stars: { element: find("level-stars"), fill: find("level-stars-fill"), card: find("level-stars")?.closest(".stat-star-progress"), scoreCard: find("score")?.closest(".stat-points") },
    coins: { element: find("memory-game-coins"), balance: find("memory-coin-balance") },
    tools: {
      time: assist("btn-buy-time", "Thời gian"), preview: assist("btn-preview-cards", "Xem trước"),
      hint: { element: find("btn-hint"), tooltip: "Lật 2 thẻ để bạn ghi nhớ." },
    },
    milestones: { track: find("memory-special-hud"), markers: [...document.querySelectorAll("[data-memory-special-milestone]")], format: (progress, target) => `Năng lượng ${progress}/${target}` },
  });
}

export function getLinkHud(hud) {
  if (!hud.root) return createGameShellHud();
  if (link.has(hud.root)) return link.get(hud.root);
  const stats = Object.fromEntries(["level", "moves", "misses", "combo", "score", "matchedPairs", "totalPairs", "hint", "totalStars", "timer"].map(key => [key, { element: hud[key] }]));
  stats.timer.format = formatClockTime;
  const copy = { hint: "Chỉ ra hai thẻ nối được.", reshuffle: "Đổi chỗ thẻ để tìm đường mới.", thunder: "Xóa ngẫu nhiên vài cặp thẻ.", freeze: "Dừng thời gian trong chốc lát." };
  const tools = Object.fromEntries(hud.itemCounts.map(count => {
    const key = count.dataset.itemCount;
    return [key, { count, element: count.closest("button"), tooltip: copy[key] }];
  }));
  tools.toggle = { element: hud.root.querySelector("#link-tools-toggle"), tooltip: "Dùng vật phẩm khi cần trợ giúp." };
  const component = createGameShellHud({ stats, tools,
    stars: { element: hud.levelStars, fill: hud.starsFill, card: hud.starProgressCard, scoreCard: hud.scoreCard },
    coins: { element: hud.coins, balance: hud.coinBalance },
    milestones: { track: hud.specialTrack, markers: hud.milestones },
  });
  link.set(hud.root, component);
  return component;
}
