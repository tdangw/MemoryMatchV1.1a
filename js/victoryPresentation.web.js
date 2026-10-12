import confetti from "canvas-confetti";
import "../styles/victory-flower.css";
import { showVictoryFireworks } from "./fireworkEffect.js";
import { showVictoryCelebration } from "./victoryCelebration.js";

export const canShowFullVictoryCelebration = true;

export function showSummaryFireworks(options) {
  return showVictoryFireworks(options);
}

export function launchSummaryConfetti() {
  confetti({
    particleCount: 150,
    spread: 70,
    origin: { y: 0.6 },
    colors: ["#6366f1", "#a855f7", "#10b981"],
    disableForReducedMotion: true,
    zIndex: 31000,
  });
}

export function showFullVictoryCelebration(completion) {
  showVictoryCelebration(completion);
}
