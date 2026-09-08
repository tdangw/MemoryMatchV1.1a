import { createGameShellHud } from "./gameShellHud.js";
import { formatClockTime } from "../uiCatalog.js";

// Link adapter is removed with legacy markup in Phase 8.
const link = new WeakMap();
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
