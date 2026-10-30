import { node, action } from './ui.js';
import { requestLiveops } from './service.js';
import { loadPersistentGameData } from '../persistence.js';
import { getActiveGameScope, createGameShellLifecycle } from '../gameShell/gameShellLifecycle.js';
import { getAccountService } from '../accountService.js';
import { CHEST_TYPES, CHEST_NAMES, CHEST_POLICY, CHEST_ITEMS, CHEST_POOLS, CHEST_SUPPORTS } from './chestConfig.js';
import { createIcon } from '../icons.js';
import { refreshAppWallet } from '../appNavigation.js';
import { ownedProfileCosmeticItems } from '../progression/achievementModel.js';
import '../../styles/liveops.css';

function rewardDescription(reward) {
  if (reward.kind === 'item') return `${CHEST_ITEMS.find(item=>item.id===reward.itemId).name} · Xem và trang bị trong Hồ sơ.`;
  if (reward.kind === 'support') return `${reward.label} · ${reward.gameId === 'memory-match' ? 'Memory Match' : reward.gameId === 'link-connect' ? 'Link Connect' : 'Triple Connect'}.`;
  return `${reward.reason === 'duplicate' ? 'Đã có · ' : reward.reason === 'full' ? 'Đã đủ bộ · ' : ''}${reward.coins} Xu.`;
}

/** A collection-owned child view. Closing presentation never cancels a committed reward. */
export function mountChestInventory(host, { owner, back, profile, gameId = 'memory-match' }) {
  const scope = createGameShellLifecycle(), release = owner.own(() => scope.dispose());
  const identity = getAccountService()?.getIdentity();
  const current = () => scope.active && host.isConnected && getAccountService()?.getIdentity()?.profileId === identity?.profileId && getAccountService()?.getIdentity()?.uid === identity?.uid;
  const root = node('div', 'liveops liveops--chests'), status = node('p', 'liveops__status', 'Đang tải Kho rương…');
  status.setAttribute('role', 'status');
  if (back) root.append(action('Quay lại Bộ sưu tập', back));
  root.append(status); host.replaceChildren(root);
  let view = null, busy = false, connected = false, selected = null, page = 0, pendingChest = null;
  const lastResult = node('p', 'liveops__last-result'), cards = node('div', 'liveops__chest-grid'), detail = node('section', 'liveops__card liveops__chest-detail'); root.append(lastResult, cards, detail);
  const tools = node('div', 'liveops__chest-tools'); root.append(tools);
  if (profile) tools.append(action('Xem trong Hồ sơ', profile));
  function render() {
    const focus = document.activeElement?.dataset.focusKey;
    cards.replaceChildren(); detail.replaceChildren();
    lastResult.textContent = '';
    if (!view?.state?.chests) return;
    const chests = view.state.chests;
    if(chests.last)lastResult.textContent=`Lần mở gần nhất: ${rewardDescription(chests.last)}`;
    for (const type of CHEST_TYPES) {
      const count = chests.earned[type] - chests.spent[type], card = node('section', 'liveops__card liveops__chest-card');
      card.append(createIcon('chest'),
        node('h3', '', CHEST_NAMES[type]), node('p', 'liveops__chest-count', `Đang có: ${count.toLocaleString('vi-VN')}`),
        action('Xem quà', () => { selected = type; page = 0; render(); detail.querySelector('h3').focus(); }, false, `details-${type}`),
        action('Mở 1', () => { selected = type; page = 0; render(); detail.querySelector('select').focus(); }, busy || !connected || Boolean(getActiveGameScope()) || count < 1 || Boolean(pendingChest && pendingChest.chestType !== type), `open-${type}`));
      card.lastElementChild.classList.add('liveops__chest-open');
      cards.append(card);
    }
    if (selected) {
      const policy = CHEST_POLICY[selected], title = node('h3', '', CHEST_NAMES[selected]); title.tabIndex = -1;
      detail.append(title, node('p', '', `40%: ${policy.coins} Xu · ${selected === 'c' ? '60' : '40'}%: 1 hỗ trợ${selected === 'c' ? '' : ' · 20%: 1 ngoại hình đúng loại'}`));
      if (policy.duplicate) detail.append(node('p', '', `Khi trúng ngoại hình, ưu tiên món bạn chưa sở hữu. Khi đã có đủ ngoại hình của loại rương này, mỗi rương đổi thẳng ${policy.duplicate} Xu. Nếu món quà đã được chọn trước đó nay đã có, bạn nhận ${policy.duplicate} Xu.`));
      const games = node('select', 'liveops__letter-select'); games.setAttribute('aria-label', 'Trò nhận hỗ trợ');
      for (const [id, label] of [['memory-match','Memory Match'],['link-connect','Link Connect'],['triple-connect','Triple Connect']]) {
        const option = node('option', '', label); option.value = id; games.append(option);
      }
      const supportInfo = node('p', 'liveops__support-pool');
      const describeSupports = () => { supportInfo.textContent = `Quà hỗ trợ: ${CHEST_SUPPORTS[gameId].map(item=>item.label).join(' · ')}. Nếu nhận hỗ trợ, các món có cơ hội như nhau. Kho tối đa 9.999 mỗi món; mỗi món vượt kho đổi thành 10 Xu.`; };
      games.value = gameId; games.disabled = busy || Boolean(pendingChest); games.onchange = () => { gameId = games.value; describeSupports(); }; describeSupports();
      detail.append(games, supportInfo, action('Mở 1 rương', () => void open(), busy || !connected || Boolean(getActiveGameScope()) || chests.earned[selected] === chests.spent[selected] || Boolean(pendingChest && pendingChest.chestType !== selected), 'confirm-open'),
        node('p', '', 'Mỗi rương nhận một quà. Xu vào ví, hỗ trợ vào kho trò đã chọn, ngoại hình vào Hồ sơ. Mỗi hỗ trợ vượt kho đổi thành 10 Xu.'));
      const pool = CHEST_POOLS[selected] || [], gallery = node('div', 'liveops__chest-grid'), owned = new Set(view.ownedItemIds || view.ownedLetterIds || []);
      if (pool.length) {
        const missing = pool.filter(id => !owned.has(id)).length;
        const chance = missing ? (20 / missing).toLocaleString('vi-VN', { maximumFractionDigits:3 }) : null;
        detail.append(node('p', '', `${pool.length - missing}/${pool.length} ngoại hình đã có`),
          node('p', '', missing ? `20% là cơ hội nhận một ngoại hình; ${missing} món chưa có được chọn đều (mỗi món khoảng ${chance}% mỗi lần mở mới).` : `Đã đủ bộ: mỗi rương nhận ${policy.duplicate} Xu.`));
      }
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
    if (busy || !connected || getActiveGameScope() || pendingChest && pendingChest.chestType !== selected) return;
    busy = true; render();
    try {
      const result = await requestLiveops({ type:'openChest', chestType:selected, gameId });
      if (!current()) return; view = result; pendingChest = null; refreshAppWallet();
      const reward = result.chestResult;
      status.textContent = reward ? `${reward.kind==='coins'&&reward.reason!=='coins'?'':'Đã nhận '}${rewardDescription(reward)}` : 'Đã cập nhật Kho rương.';
    } catch (error) { if (current()) { if(error.pendingChest){pendingChest=error.pendingChest;selected=pendingChest.chestType;gameId=pendingChest.gameId;}status.textContent = error.message || 'Chưa mở được rương. Hãy thử lại.'; } }
    finally { busy = false; if (current()) render(); }
  }
  async function load() {
    if (busy || !current()) return; busy = true;
    try {
      let result;
      if (getActiveGameScope() || !navigator.onLine) {
        const data = await loadPersistentGameData();
        result = data.appearance.spark?.ownerUid === identity?.uid ? { state:data.appearance.spark.state, ownedItemIds:ownedProfileCosmeticItems(data.appearance).map(item=>item.id) } : {state:null};
      } else result = await requestLiveops();
      if (!current()) return;
      view = result; connected = navigator.onLine && !getActiveGameScope(); status.textContent = result.state?.chests ? 'Kho rương' : 'Kết nối để xem Kho rương.';
    } catch(error) {
      connected = false;
      if(current()) {
        try {
          const data=await loadPersistentGameData();
          if(current()&&data.appearance.spark?.ownerUid===identity?.uid){view={state:data.appearance.spark.state,ownedItemIds:ownedProfileCosmeticItems(data.appearance).map(item=>item.id)};}
          if(error.pendingChest&&current()){pendingChest=error.pendingChest;selected=pendingChest.chestType;gameId=pendingChest.gameId;connected=navigator.onLine&&!getActiveGameScope();}
          if(current())status.textContent=error.pendingChest?error.message:'Đang xem dữ liệu đã lưu. Kết nối và tải lại để mở rương.';
        } catch { if(current())status.textContent='Chưa đọc được Kho rương. Hãy tải lại trang.'; }
      }
    }
    finally { busy = false; if (current()) render(); }
  }
  scope.listen(window,'offline',()=>{connected=false;if(current())render();});
  scope.listen(window,'online',()=>{if(current())void load();});
  const account=getAccountService();
  if(account)scope.own(account.subscribe(()=>{
    if(scope.active&&!current()){view=null;connected=false;lastResult.textContent='';cards.replaceChildren();detail.replaceChildren();status.textContent='Tài khoản đã thay đổi. Mở lại Bộ sưu tập để xem Kho rương.';}
  }));
  tools.append(action('Tải lại Kho rương', () => void load())); void load();
  return () => { scope.dispose(); release.forget(); };
}
