import { createGameShellLifecycle } from '../gameShell/gameShellLifecycle.js';
import { createIcon } from '../icons.js';
import { LOOT_PRESETS, LOOT_HOLD_MS } from '../lootEffects.js';
import { CHEST_NAMES, CHEST_ITEMS, CHEST_SUPPORTS } from './chestConfig.js';
import { LETTER_ALPHABET } from './config.js';
import { REWARD_FEEDBACK_LIMIT } from './rewardFeedbackModel.js';
import { playRewardPhase } from '../rewardAudio.js';
import '../../styles/liveops-reward-feedback.css';

export const LIVEOPS_REWARD_TIMING = Object.freeze({ dropMs:LOOT_PRESETS.memory.dropMs, holdMs:LOOT_HOLD_MS, flightMs:LOOT_PRESETS.memory.flightMs });
const supportIcons = { hint:'wand', preview4:'eye', time30:'timer', reshuffle:'shuffle', thunder:'energy', freeze:'snowflake', undo:'undo', shuffle:'shuffle', time:'timer' };
function describe(reward) {
  if (reward.kind === 'coins') return { icon:'coin', label:`${reward.amount.toLocaleString('vi-VN')} Xu`, target:'.app-wallet' };
  if (reward.kind === 'ticket') return { icon:'ticket', label:`${reward.amount} Vé quay`, target:'.liveops__ticket-balance' };
  if (reward.kind === 'chest') return { icon:'chest', label:`${reward.amount} ${CHEST_NAMES[reward.chestType]}`, target:'[data-dock-action="collection"], [data-map-destination="collection"]' };
  if (reward.kind === 'letter') return { letter:reward.letter, label:`Chữ ${reward.letter}`, target:`.liveops__letter-grid [aria-label^="Chữ ${reward.letter},"]` };
  if (reward.kind === 'support') return { icon:supportIcons[reward.key], label:CHEST_SUPPORTS[reward.gameId].find(item => item.key === reward.key).label, target:'[data-dock-action="collection"], [data-map-destination="collection"]' };
  const item = CHEST_ITEMS.find(item => item.id === reward.itemId);
  return { icon:item?.type === 'avatar' ? 'profile' : 'achievements', label:item?.name || 'Ngoại hình mới', target:'[data-dock-action="collection"], [data-map-destination="collection"]' };
}
function artwork(prize) {
  if (!prize.letter) return createIcon(prize.icon);
  const sprite = document.createElement('span'), index = LETTER_ALPHABET.indexOf(prize.letter);
  sprite.className = 'liveops-reward-feedback__letter'; sprite.setAttribute('aria-hidden','true');
  sprite.style.backgroundPosition = `${index % 5 * 25}% ${Math.floor(index / 5) * 100 / 3}%`;
  return sprite;
}
const center = rect => ({ x:rect.left + rect.width / 2, y:rect.top + rect.height / 2 });
export function captureRewardOrigin(root) {
  const focused = document.activeElement;
  return center((root.contains(focused) ? focused : root).getBoundingClientRect());
}

/** A page owns its one feedback batch; replacing page content cannot detach it. */
export function createRewardFeedback({ owner, host }) {
  let current = null;
  const clear = () => { current?.dispose(); current = null; };
  owner.own(clear);
  return { clear, present(rewards, origin) {
    if (!owner.active || !host.isConnected || !rewards?.length) return;
    clear();
    const scope = createGameShellLifecycle(), release = owner.own(() => scope.dispose()); current = scope;
    scope.own(() => { release.forget(); if (current === scope) current = null; });
    const layer = document.createElement('div'); layer.className = 'liveops-reward-feedback';
    const toast = document.createElement('div'); toast.className = 'liveops-reward-feedback__toast'; toast.setAttribute('role','status');
    const prizes = rewards.map(reward => ({ ...describe(reward), kind:reward.kind, amount:reward.amount }));
    toast.textContent = `Đã nhận ${prizes.map(prize => prize.label).join(' + ')}`; layer.append(toast);
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const cue = phase => playRewardPhase(phase,owner);
    // Measure all destinations before mounting this batch. Missing/offscreen
    // destinations resolve to the page header, never a detached control.
    const fallback = center(host.querySelector('.app-modal__header').getBoundingClientRect());
    const start = { x:Math.max(24,Math.min(innerWidth-24,origin.x)), y:Math.max(24,Math.min(innerHeight-100,origin.y)) };
    const targets = prizes.map(prize => {
      const candidates = [...host.querySelectorAll(prize.target), ...document.querySelectorAll(prize.target)];
      const target = candidates.find(node => node.getClientRects().length && !node.closest('[inert]'));
      return target ? center(target.getBoundingClientRect()) : fallback;
    });
    (host.closest('.app-modal-overlay') || document.body).append(layer); scope.own(() => layer.remove(),'node');
    cue('receive');
    if (reduced.matches || document.hidden) { scope.timeout(() => scope.dispose(),1100); return; }
    cue('drop');
    const animations = [], { dropMs, holdMs, flightMs } = LIVEOPS_REWARD_TIMING;
    const duration = dropMs + holdMs + flightMs, land = dropMs / duration, collect = (dropMs + holdMs) / duration;
    let count = 0;
    for (const [index,prize] of prizes.entries()) {
      const copies = Math.min(REWARD_FEEDBACK_LIMIT-count,prize.kind === 'coins' ? Math.min(6,prize.amount) : Math.min(3,prize.amount));
      for (let i=0;i<copies;i++,count++) {
        const node = document.createElement('span'); node.className = 'liveops-reward-feedback__particle'; node.dataset.rewardKind = prize.kind; node.setAttribute('aria-hidden','true'); node.append(artwork(prize)); layer.append(node);
        const x = start.x-18, y = start.y-18, dx = Math.max(18,Math.min(innerWidth-54,Math.max(80,Math.min(innerWidth-80,start.x))-18+(count%6-2.5)*20)), dy = Math.min(innerHeight-152,y+28)+Math.floor(count/6)*32;
        const landed = `translate(${dx}px,${dy}px) scale(1)`;
        const animation = node.animate([
          { opacity:0, transform:`translate(${x}px,${y}px) scale(.5)`, offset:0 },
          { opacity:1, transform:`translate(${dx}px,${Math.max(16,y-50)}px) scale(1.08)`, offset:land*.42 },
          { opacity:1, transform:landed, offset:land },
          { opacity:1, transform:landed, offset:collect },
          { opacity:0, transform:`translate(${targets[index].x-18}px,${targets[index].y-18}px) scale(.4)`, offset:1 },
        ], { duration, delay:count*24, fill:'both', easing:'ease-in-out' });
        scope.animation(animation); animations.push(animation);
      }
    }
    const finish = () => { for (const animation of animations) if (animation.playState !== 'idle') animation.finish(); };
    scope.listen(document,'visibilitychange',() => { if (document.hidden) finish(); });
    scope.listen(reduced,'change',event => { if (event.matches) finish(); });
    Promise.all(animations.map(animation => animation.finished)).then(() => { if (scope.active) { cue('collect'); scope.dispose(); } },() => scope.dispose());
  } };
}
