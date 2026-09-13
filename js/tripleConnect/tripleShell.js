import { createGameShell } from "../gameShell/gameShell.js";

let shell;

export function getTripleShell() {
  if (shell) return shell;
  const root = document.createElement("section");
  root.id = "triple-connect-container";
  root.className = "triple-connect-game";
  root.hidden = true;
  root.innerHTML = `<header data-shell-region="title" class="triple-connect__title">Triple Connect</header>
    <div data-shell-region="progress" class="triple-connect__progress"><span>Moves <b data-triple-stat="moves">0</b></span><span>Miss <b data-triple-stat="misses">0</b></span><span>Combo <b data-triple-stat="combo">0</b></span><span>Điểm <b data-triple-stat="score">0</b></span><span><b data-triple-stat="matched">0</b>/4</span></div>
    <div data-shell-region="hud" class="triple-connect__hud"><span>Easy · Level 1 · 01:00</span></div>
    <div data-shell-region="milestones" class="triple-connect__milestones" aria-hidden="true"></div>
    <div data-shell-region="frame" class="triple-connect__frame"><div data-shell-region="board" class="triple-connect__surface"><div class="triple-connect__board"></div><svg class="triple-connect__line" aria-hidden="true"></svg><div class="triple-connect__tray" aria-label="Khay 7 ô"></div></div></div>`;
  document.querySelector(".main-wrapper").append(root);
  const regions = Object.fromEntries([...root.querySelectorAll("[data-shell-region]")].map(node => [node.dataset.shellRegion, node]));
  shell = createGameShell({ root, regions, title: "Triple Connect" });
  return shell;
}
