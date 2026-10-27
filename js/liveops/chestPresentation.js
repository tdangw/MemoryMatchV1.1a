import { node, action } from './ui.js';
import { requestLiveops } from './service.js';
import { loadPersistentGameData } from '../persistence.js';
import { getActiveGameScope, createGameShellLifecycle } from '../gameShell/gameShellLifecycle.js';
import { getAccountService } from '../accountService.js';
import { CHEST_TYPES, CHEST_NAMES, CHEST_POLICY, CHEST_ITEMS, CHEST_POOLS } from './chestConfig.js';
import { createIcon } from '../icons.js';
import { refreshAppWallet } from '../appNavigation.js';
import '../../styles/liveops.css';

/** A collection-owned child view. Closing presentation never cancels a committed reward. */
export function mountChestInventory(host, { owner, back, gameId = 'memory-match' }) {
  const scope = createGameShellLifecycle(), release = owner.own(() => scope.dispose());
  const identity = getAccountService()?.getIdentity();
  const current = () => scope.active && host.isConnected && getAccountService()?.getIdentity()?.profileId === identity?.profileId && getAccountService()?.getIdentity()?.uid === identity?.uid;
  const root = node('div', 'liveops liveops--chests'), status = node('p', 'liveops__status', 'Đang tải Kho rương…');
  status.setAttribute('role', 'status'); root.append(action('Quay lại Bộ sưu tập', back), status); host.replaceChildren(root);
  let view = null, busy = false, connected = false, selected = null, page = 0;
  const cards = node('div', 'liveops__chest-grid'), detail = node('section', 'liveops__card'); root.append(cards, detail);
  function render() {
    const focus = document.activeElement?.dataset.focusKey;
    cards.replaceChildren(); detail.replaceChildren();
    if (!view?.state?.chests) return;
    const chests = view.state.chests;
    for (const type of CHEST_TYPES) {
      const count = chests.earned[type] - chests.spent[type], card = node('section', 'liveops__card');
      card.append(createIcon(type === 'c' ? 'chest' : type === 'avatar' ? 'profile' : type === 'frame' ? 'expand' : 'achievements'),
        node('h3', '', CHEST_NAMES[type]), node('p', '', count ? `×${count.toLocaleString('vi-VN')}` : 'Chưa có'),
        action('Xem quà & tỷ lệ', () => { selected = type; page = 0; render(); detail.querySelector('h3').focus(); }, false, `details-${type}`),
        action('Mở 1 rương', () => { selected = type; page = 0; render(); detail.querySelector('select').focus(); }, busy || !connected || Boolean(getActiveGameScope()) || count < 1, `open-${type}`));
      cards.append(card);
    }
    if (selected) {
      const policy = CHEST_POLICY[selected], title = node('h3', '', CHEST_NAMES[selected]); title.tabIndex = -1;
      detail.append(title, node('p', '', `40%: ${policy.coins} Xu · ${selected === 'c' ? '60' : '40'}%: 1 hỗ trợ${selected === 'c' ? '' : ' · 20%: 1 ngoại hình đúng loại'}`));
      if (policy.duplicate) detail.append(node('p', '', `Ngoại hình trùng: ${policy.duplicate} Xu. Đã đủ toàn bộ pool của loại này: mỗi rương đổi thẳng ${policy.duplicate} Xu.`));
      const games = node('select', 'liveops__letter-select'); games.setAttribute('aria-label', 'Trò nhận hỗ trợ');
      for (const [id, label] of [['memory-match','Memory Match'],['link-connect','Link Connect'],['triple-connect','Triple Connect']]) {
        const option = node('option', '', label); option.value = id; games.append(option);
      }
      games.value = gameId; games.onchange = () => { gameId = games.value; };
      detail.append(games, action('Mở 1 rương', () => void open(), busy || !connected || Boolean(getActiveGameScope()) || chests.earned[selected] === chests.spent[selected], 'confirm-open'),
        node('p', '', 'Mỗi rương nhận một quà. Xu vào ví, hỗ trợ vào kho trò đã chọn, ngoại hình vào Hồ sơ. Kho hỗ trợ đầy sẽ giữ rương để thử lại.'));
      const pool = CHEST_POOLS[selected] || [], gallery = node('div', 'liveops__chest-grid'), owned = new Set(view.ownedItemIds || view.ownedLetterIds || []);
      detail.append(node('p', '', `${owned.size ? pool.filter(id => owned.has(id)).length : 0}/${pool.length} ngoại hình đã có`));
      for (const id of pool.slice(page * 12, page * 12 + 12)) {
        const item = CHEST_ITEMS.find(item => item.id === id), figure = node('figure'), image = node('img', 'liveops__reward-preview');
        image.src = `${import.meta.env.BASE_URL}${item.files[128]}`; image.width = image.height = 128; image.loading = 'lazy'; image.decoding = 'async'; image.alt = item.name;
        figure.append(image, node('figcaption', '', `${item.name} · ${owned.has(id) ? 'Đã có' : 'Chưa có'}`)); gallery.append(figure);
      }
      detail.append(gallery);
      if (pool.length > 12) detail.append(action('Trang trước', () => { page--; render(); }, page === 0), node('span', '', `Trang ${page + 1}/${Math.ceil(pool.length / 12)}`), action('Trang sau', () => { page++; render(); }, (page + 1) * 12 >= pool.length));
    }
    if (getActiveGameScope()) status.textContent = 'Về bản đồ để mở rương.';
    else if (!connected) status.textContent = 'Đang xem dữ liệu đã lưu. Kết nối để mở rương.';
    if (focus) [...root.querySelectorAll('button')].find(button => button.dataset.focusKey === focus && !button.disabled)?.focus({ preventScroll: true });
  }
  async function open() {
    if (busy || !connected || getActiveGameScope()) return;
    busy = true; render();
    try {
      const result = await requestLiveops({ type:'openChest', chestType:selected, gameId });
      if (!current()) return; view = result; refreshAppWallet();
      const reward = result.chestResult;
      status.textContent = reward ? reward.kind === 'item' ? `Đã nhận ${CHEST_ITEMS.find(item => item.id === reward.itemId).name}. Xem và trang bị trong Hồ sơ.`
        : reward.kind === 'support' ? `Đã nhận ${reward.label} · ${reward.gameId === 'memory-match' ? 'Memory Match' : reward.gameId === 'link-connect' ? 'Link Connect' : 'Triple Connect'}.`
          : `${reward.reason === 'duplicate' ? 'Đã có · ' : reward.reason === 'full' ? 'Đã đủ bộ · ' : ''}Nhận ${reward.coins} Xu.` : 'Đã cập nhật Kho rương.';
    } catch (error) { if (current()) status.textContent = error.message || 'Chưa mở được rương. Hãy thử lại.'; }
    finally { busy = false; if (current()) render(); }
  }
  async function load() {
    if (busy) return; busy = true;
    try {
      const result = getActiveGameScope() ? { state: (await loadPersistentGameData()).appearance.spark?.state } : await requestLiveops();
      if (!current()) return;
      view = result; connected = navigator.onLine && !getActiveGameScope(); status.textContent = result.state?.chests ? 'Kho rương' : 'Kho rương sắp mở.';
    } catch { connected = false; if (current()) status.textContent = 'Chưa tải được Kho rương. Hãy kết nối và thử lại.'; }
    finally { busy = false; if (current()) render(); }
  }
  root.append(action('Tải lại Kho rương', () => void load())); void load();
  return () => { scope.dispose(); release.forget(); };
}
