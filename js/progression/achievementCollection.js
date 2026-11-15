import { festivalChestsEnabled } from '../liveops/availability.js';
import { CHEST_NAMES } from '../liveops/chestConfig.js';
import { gameState } from '../gameState.js';
import { getGameProgressKey, getGameDefinition } from '../gameCatalog.js';
import { loadPersistentChapter } from '../persistence.js';
import { getChapterNumber } from '../adventureProgress.js';
import { ACHIEVEMENT_ITEMS, achievementAssetUrl } from './achievementModel.js';
import { MASTERY_DIFFICULTIES, hasCertifiedCompletion } from './difficultyProgress.js';
import { getMasteryRewards } from './masteryRewards.js';
import { createAchievementListContent } from '../storybook/presentation.js';
import { claimAdventureCollection } from '../adventureRewards.js';
import { refreshAppWallet } from '../appNavigation.js';
import { canLaunchGame } from '../profileOperations.js';
import { playOwnedRewardCue } from '../sound.js';

export function renderAchievementCollection(container, gameId, { block: requestedBlock, owner, onOpenChests } = {}) {
  const key = getGameProgressKey(gameId), profile = gameState.progress[key];
  const root = document.createElement('section'); root.className = 'achievement-collection';
  container.className = 'achievement-collection-panel'; container.replaceChildren(root);
  let generation = 0;
  let block = Number.isSafeInteger(requestedBlock) && requestedBlock > 0 ? requestedBlock : 1;
  const maxBlock = Math.max(3, block, Math.ceil((profile.adventure?.unlockedThrough || 1) / 10));
  const current = () => root.isConnected && (!owner || owner.active) && gameState.progress[key] === profile && canLaunchGame();
  const control = (label, disabled, action) => { const button = document.createElement('button'); button.type = 'button'; button.className = 'tab-button'; button.textContent = label; button.disabled = disabled; button.onclick = action; return button; };
  async function render() {
    const token = ++generation; root.setAttribute('aria-busy', 'true');
    try {
      const chapter = getChapterNumber((block - 1) * 10 + 1);
      const firstPromise = loadPersistentChapter(key, 1);
      const [first, rewardChapter] = await Promise.all([firstPromise, chapter === 1 ? firstPromise : loadPersistentChapter(key, chapter)]);
      if (!current() || token !== generation) return;
      const completed = { ...first.bestByLevel, ...profile.bestByLevel };
      const firstLevel = (block - 1) * 10 + 1;
      const content = createAchievementListContent({ gameName: getGameDefinition(gameId).title,
        levels: ACHIEVEMENT_ITEMS.filter(item => item.gameId === gameId && item.level >= firstLevel && item.level < firstLevel + 10).map(item => {
          const grant = gameState.appearance.achievements.grants[`${gameId}:${item.level}`];
          const chestType = grant?.chestType || (!grant && festivalChestsEnabled() && ['avatar','frame','badge'].includes(item.type) ? item.type : null);
          return { level:item.level, chestType, name:chestType ? CHEST_NAMES[chestType] : item.name,
            image:chestType ? null : achievementAssetUrl(item,128), completed:MASTERY_DIFFICULTIES.map(mode=>hasCertifiedCompletion(completed,mode,item.level)) };
        }) });
      const mastery = getMasteryRewards({ completed: { ...rewardChapter.bestByLevel, ...profile.bestByLevel }, level: firstLevel,
        claim: profile.claimedChests?.[block] || rewardChapter.claimedChests[block] });
      const group = document.createElement('section'); group.className = 'tab-card achievement-group-reward';
      const title = document.createElement('h3'); title.textContent = `Màn ${firstLevel}–${firstLevel + 9}`;
      const text = document.createElement('p'); text.textContent = mastery.collectionClaimed ? 'Đã nhận 300 Xu' : `${mastery.fragmentLevels.length}/10 màn hoàn thành cả bốn độ khó · Thưởng 300 Xu`;
      group.append(title, text);
      if (mastery.collectionEligible) {
        const claim = control('Nhận 300 Xu', false, async () => {
          if (!current() || token !== generation) return;
          claim.disabled = true;
          try {
            const result = await claimAdventureCollection(gameId, block);
            if (!current() || token !== generation) return;
            if (result) { if (owner) playOwnedRewardCue('reward', owner, gameState.settings); refreshAppWallet(); await render(); }
            else { claim.disabled = false; text.textContent = 'Chưa nhận được thưởng. Hãy thử lại.'; }
          } catch (error) {
            if (current() && token === generation) { claim.disabled = false; text.textContent = 'Chưa nhận được thưởng. Hãy thử lại.'; }
            console.error('Achievement group reward failed', error);
          }
        }); group.append(claim);
      }
      const navigation = document.createElement('nav'); navigation.setAttribute('aria-label', 'Chọn nhóm thưởng');
      navigation.append(control('Nhóm trước', block <= 1, () => { block--; void render(); }), control('Nhóm sau', block >= maxBlock, () => { block++; void render(); }));
      if(festivalChestsEnabled()&&onOpenChests)navigation.append(control('Xem Kho lưu trữ',false,onOpenChests));
      group.append(navigation); root.replaceChildren(content, group);
    } catch (error) {
      if (current() && token === generation) root.replaceChildren(document.createTextNode('Chưa tải được Thành tích. Hãy thử lại.'), control('Thử lại', false, () => void render()));
      console.error('Achievement collection failed', error);
    } finally { if (token === generation) root.removeAttribute('aria-busy'); }
  }
  void render();
}
