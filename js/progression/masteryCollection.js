import { gameState } from '../gameState.js';
import { getGameProgressKey } from '../gameCatalog.js';
import { getChapterNumber } from '../adventureProgress.js';
import { loadPersistentChapter } from '../persistence.js';
import { getMasteryRewards } from './masteryRewards.js';
import { claimAdventureCollection } from '../adventureRewards.js';
import { refreshAppWallet } from '../appNavigation.js';
import '../../styles/mastery-collection.css';

export const COLLECTION_PAINTINGS = Object.freeze([
  Object.freeze({ id: 'moonlit-conservatory', title: 'Vườn trăng' }),
  Object.freeze({ id: 'botanical-library', title: 'Thư viện trong cây' }),
  Object.freeze({ id: 'three-island-garden', title: 'Ba đảo hoa' }),
]);

/** One ten-piece set is mounted at a time; late reads cannot rebuild a closed tab. */
export function renderMasteryCollection(container, gameId) {
  container.className = 'mastery-collection-panel';
  const key = getGameProgressKey(gameId);
  const profile = gameState.progress[key];
  let block = Math.floor(((profile.adventure?.unlockedThrough || 1) - 1) / 10) + 1;
  const lastBlock = block;
  const root = document.createElement('section');
  root.className = 'mastery-collection';
  container.replaceChildren(root);
  let generation = 0;
  async function render() {
    const identity = ++generation;
    const firstLevel = (block - 1) * 10 + 1;
    root.setAttribute('aria-busy', 'true');
    try {
      const record = await loadPersistentChapter(key, getChapterNumber(firstLevel));
      if (!root.isConnected || identity !== generation || gameState.progress[key] !== profile) return;
      const mastery = getMasteryRewards({ completed: { ...record.bestByLevel, ...profile.bestByLevel }, level: firstLevel,
        claim: profile.claimedChests?.[block] || record.claimedChests[block] });
      const gameOffset = ['memory-match','link-connect','triple-connect'].indexOf(gameId);
      const painting = COLLECTION_PAINTINGS[(block - 1 + gameOffset) % COLLECTION_PAINTINGS.length];
      const heading = document.createElement('h3'); heading.textContent = `${painting.title} · Bộ ${block}`;
      const pieces = document.createElement('div'); pieces.className = 'mastery-collection__pieces';
      pieces.setAttribute('aria-label', `${mastery.fragmentLevels.length} trên 10 mảnh tranh`);
      for (let index = 0; index < 10; index++) {
        const piece = document.createElement('span');
        const earned = mastery.fragmentLevels.includes(firstLevel + index);
        piece.className = `mastery-collection__piece${earned ? ' is-earned' : ''}`;
        piece.title = `Màn ${firstLevel + index}${earned ? ' · Đã nhận' : ' · Hoàn thành cả bốn độ khó'}`;
        if (earned) {
          piece.style.backgroundImage = `url('/assets/images/collections/${painting.id}.webp')`;
          piece.style.backgroundPosition = `${(index % 5) * 25}% ${Math.floor(index / 5) * 100}%`;
        } else piece.textContent = String(firstLevel + index);
        pieces.append(piece);
      }
      const progress = document.createElement('p');
      progress.textContent = `Màn ${firstLevel}–${firstLevel + 9} · ${mastery.fragmentLevels.length}/10 mảnh`;
      const reward = document.createElement('p');
      reward.textContent = mastery.collectionClaimed ? 'Đã nhận 300 xu' : 'Ghép đủ tranh nhận 300 xu';
      const previous = control('Trước', block <= 1, () => { block--; void render(); });
      const next = control('Sau', block >= lastBlock, () => { block++; void render(); });
      const navigation = document.createElement('nav'); navigation.className = 'mastery-collection__navigation';
      navigation.setAttribute('aria-label', 'Chọn bộ tranh'); navigation.append(previous, next);
      root.replaceChildren(heading, pieces, progress, reward, navigation);
      if (mastery.collectionEligible) {
        const claim = control('Nhận 300 xu', false, async () => {
          claim.disabled = true;
          const outcome = await claimAdventureCollection(gameId, block);
          if (!root.isConnected || identity !== generation) return;
          if (outcome) { refreshAppWallet(); await render(); }
          else { claim.disabled = false; reward.textContent = 'Chưa nhận được thưởng. Hãy thử lại.'; }
        });
        root.append(claim);
      }
    } catch (error) {
      if (identity !== generation || !root.isConnected) return;
      root.textContent = 'Chưa tải được bộ tranh. Hãy mở lại bộ sưu tập.';
      console.error('Collection load failed', error);
    } finally { if (identity === generation) root.removeAttribute('aria-busy'); }
  }
  void render();
}
function control(label, disabled, onClick) {
  const button = document.createElement('button'); button.type = 'button';
  button.className = 'app-button app-button--secondary';
  button.textContent = label; button.disabled = disabled; button.onclick = onClick;
  return button;
}
