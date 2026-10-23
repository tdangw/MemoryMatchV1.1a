import { playOwnedRewardCue } from '../sound.js';
import { gameState } from '../gameState.js';
import { canLaunchGame } from '../profileOperations.js';
import { getGameProgressKey } from '../gameCatalog.js';
import { getChapterNumber } from '../adventureProgress.js';
import { loadPersistentChapter } from '../persistence.js';
import { getMasteryRewards } from './masteryRewards.js';
import { MASTERY_DIFFICULTIES, hasCertifiedCompletion, getDifficultyAccess } from './difficultyProgress.js';
import { claimAdventureCollection } from '../adventureRewards.js';
import { refreshAppWallet } from '../appNavigation.js';
import { openAppModal } from '../modal.js';
import { createGameShellLifecycle } from '../gameShell/gameShellLifecycle.js';
import { dismissContextGuide, showContextGuide } from '../tutorial/contextGuide.js';
import '../../styles/mastery-collection.css';

export const COLLECTION_PAINTINGS = Object.freeze([
  Object.freeze({ id: 'moonlit-conservatory', asset: 'assets/images/collections/moonlit-conservatory.webp', crop: '50% 50%', title: 'Vườn trăng' }),
  Object.freeze({ id: 'botanical-library', asset: 'assets/images/collections/botanical-library.webp', crop: '50% 50%', title: 'Thư viện trong cây' }),
  Object.freeze({ id: 'three-island-garden', asset: 'assets/images/collections/three-island-garden.webp', crop: '50% 50%', title: 'Ba đảo hoa' }),
]);

/** One ten-piece set is mounted at a time; late reads cannot rebuild a closed tab. */
export function renderMasteryCollection(container, gameId, { block: requestedBlock, owner, onPlay } = {}) {
  container.className = 'mastery-collection-panel';
  const key = getGameProgressKey(gameId);
  const profile = gameState.progress[key];
  let block = Math.floor(((profile.adventure?.unlockedThrough || 1) - 1) / 10) + 1;
  const lastBlock = Math.max(block, requestedBlock || 1);
  if (Number.isSafeInteger(requestedBlock) && requestedBlock > 0) block = requestedBlock;
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
        const piece = document.createElement('button');
        piece.type = 'button'; piece.dataset.pieceLevel = String(firstLevel + index);
        const earned = mastery.fragmentLevels.includes(firstLevel + index);
        piece.className = `mastery-collection__piece${earned ? ' is-earned' : ''}`;
        piece.title = `Màn ${firstLevel + index}${earned ? ' · Đã nhận' : ' · Hoàn thành cả bốn độ khó'}`;
        piece.setAttribute('aria-label', piece.title);
        piece.onclick = () => showPiece(firstLevel + index, { ...record.bestByLevel, ...profile.bestByLevel });
        if (earned) {
          piece.style.backgroundImage = `url('${import.meta.env.BASE_URL}${painting.asset}')`;
          piece.style.backgroundPosition = `${(index % 5) * 25}% ${Math.floor(index / 5) * 100}%`;
        } else piece.textContent = String(firstLevel + index);
        pieces.append(piece);
      }
      const progress = document.createElement('p');
      progress.textContent = `Màn ${firstLevel}–${firstLevel + 9} · ${mastery.fragmentLevels.length}/10 mảnh`;
      const reward = document.createElement('p');
      reward.textContent = mastery.collectionClaimed ? 'Đã nhận 300 Xu' : mastery.collectionComplete ? 'Hoàn thiện bộ tranh · Thưởng 300 Xu' : 'Đủ 10 mảnh: hoàn thiện tranh và nhận 300 Xu';
      const purpose = document.createElement('p');
      purpose.textContent = 'Hoàn thành cả bốn độ khó của một màn để nhận một mảnh.';
      const previous = control('Trước', block <= 1, () => { block--; void render(); });
      const next = control('Sau', block >= lastBlock, () => { block++; void render(); });
      const navigation = document.createElement('nav'); navigation.className = 'mastery-collection__navigation';
      navigation.setAttribute('aria-label', 'Chọn bộ tranh'); navigation.append(previous, next);
      dismissContextGuide(root);
      root.replaceChildren(heading, purpose, pieces, progress, reward, navigation);
      showContextGuide('pieces',navigation,owner);
      if (mastery.collectionComplete) {
        root.append(control('Xem tranh', false, () => {
          if (isCurrentView() && identity === generation) showPainting(painting, owner);
        }));
      }
      if (mastery.collectionEligible) {
        const claim = control('Nhận 300 Xu', false, async () => {
          claim.disabled = true;
          if (!isCurrentView() || identity !== generation) {
            if (root.isConnected) reward.textContent = 'Tiến trình vừa thay đổi. Hãy mở lại bộ sưu tập.';
            return;
          }
          try {
            const outcome = await claimAdventureCollection(gameId, block);
            if (!root.isConnected || identity !== generation || gameState.progress[key] !== profile || owner && !owner.active) return;
            if (outcome) {
              if (owner) playOwnedRewardCue('reward', owner, gameState.settings);
              refreshAppWallet(); await render();
            }
            else { claim.disabled = false; reward.textContent = 'Chưa nhận được thưởng. Hãy thử lại.'; }
          } catch (error) {
            if (root.isConnected && identity === generation && gameState.progress[key] === profile && (!owner || owner.active)) {
              claim.disabled = false; reward.textContent = 'Chưa nhận được thưởng. Hãy thử lại.';
            }
            console.error('Collection claim failed', error.name);
          }
        });
        root.append(claim);
      }
    } catch (error) {
      if (identity !== generation || !root.isConnected) return;
      root.replaceChildren(document.createTextNode('Chưa tải được bộ tranh. Hãy thử lại.'), control('Thử lại', false, () => void render()));
      console.error('Collection load failed', error);
    } finally { if (identity === generation) root.removeAttribute('aria-busy'); }
  }
  function isCurrentView() {
    return root.isConnected && gameState.progress[key] === profile && (!owner || owner.active) && canLaunchGame();
  }
  function showPiece(level, completed) {
    if (!isCurrentView()) return;
    const content = document.createElement('div');
    const list = document.createElement('ul');
    for (const [index, mode] of MASTERY_DIFFICULTIES.entries()) {
      const row = document.createElement('li');
      row.textContent = ['Dễ','Trung bình','Khó','Siêu khó'][index] + ': ' + (hasCertifiedCompletion(completed, mode, level) ? 'Đã hoàn thành' : 'Chưa hoàn thành');
      list.append(row);
    }
    const target = collectionPieceTarget({ completed, level, unlockedThrough: profile.adventure?.unlockedThrough || 1 });
    const copy = document.createElement('p');
    copy.textContent = target ? 'Hoàn thành đủ bốn độ khó của màn này để ghép mảnh tranh.' : 'Bạn đã có mảnh tranh này.';
    content.append(copy, list);
    openAppModal({ id: 'collection-piece-modal', icon: 'puzzle', title: 'Mảnh tranh · Màn ' + level, content, owner,
      actions: target && onPlay ? [{ label: 'Chơi màn ' + target.level, variant: 'primary', onClick: async () => {
        if (root.isConnected && gameState.progress[key] === profile) await onPlay(target);
        return false;
      }}] : [] });
  }
  void render();
}
function showPainting(painting, owner) {
  const scope = createGameShellLifecycle();
  const content = document.createElement('div');
  const image = document.createElement('img');
  image.className = 'mastery-painting'; image.alt = painting.title; image.hidden = true;
  image.style.objectPosition = painting.crop;
  const status = document.createElement('p'); status.setAttribute('role', 'status');
  const retry = control('Thử lại', false, load); retry.hidden = true;
  content.append(status, image, retry);
  openAppModal({ id: 'mastery-painting-modal', icon: 'collection', title: painting.title, content,
    owner, size: 'large', keepBanner: false, onDestroy: () => scope.dispose() });
  scope.listen(image, 'load', () => { status.hidden = true; image.hidden = false; });
  scope.listen(image, 'error', () => { status.textContent = 'Chưa tải được tranh. Hãy thử lại.'; retry.hidden = false; });
  scope.own(() => image.removeAttribute('src'));
  function load() {
    status.hidden = false; status.textContent = 'Đang mở tranh…'; retry.hidden = true; image.hidden = true;
    image.src = `${import.meta.env.BASE_URL}${painting.asset}`;
  }
  load();
}
function control(label, disabled, onClick) {
  const button = document.createElement('button'); button.type = 'button';
  button.className = 'app-button app-button--secondary';
  button.textContent = label; button.disabled = disabled; button.onclick = onClick;
  return button;
}

export function collectionPieceTarget({ completed, level, unlockedThrough }) {
  const mode = MASTERY_DIFFICULTIES.find(mode => !hasCertifiedCompletion(completed, mode, level));
  if (!mode) return null;
  if (level > unlockedThrough) return { level: unlockedThrough, mode: 'easy' };
  const access = getDifficultyAccess({ completed, level, mode });
  return access.unlocked ? { level, mode } : { ...access.requires };
}
