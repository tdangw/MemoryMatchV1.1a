import '../styles/victory-flower.css';
import { showVictoryCelebration } from './victoryCelebration.js';
export const canShowFullVictoryCelebration = true;
export function showSummaryFireworks() { return Promise.resolve(); }
export function launchSummaryConfetti() {}
export function showFullVictoryCelebration(completion) { return showVictoryCelebration(completion); }
