import { node, action } from './ui.js';
import { requestLiveops } from './service.js';
import { loadPersistentGameData } from '../persistence.js';
import { getActiveGameScope, createGameShellLifecycle } from '../gameShell/gameShellLifecycle.js';
import { getAccountService } from '../accountService.js';
import '../../styles/liveops.css';

/** A collection-owned child view. Closing presentation never cancels a committed reward. */
export function mountChestInventory(host, { owner, back, gameId = 'memory-match' }) {
  const scope = createGameShellLifecycle(), release = owner.own(() => scope.dispose());
  const identity = getAccountService()?.getIdentity();
  const current = () => scope.active && host.isConnected && getAccountService()?.getIdentity()?.profileId === identity?.profileId;
  const root = node('div', 'liveops liveops--chests'), status = node('p', 'liveops__status', 'Đang tải Kho rương…');
  status.setAttribute('role', 'status'); root.append(action('Quay lại Bộ sưu tập', back), status); host.replaceChildren(root);
  async function load() {
    try {
      const result = getActiveGameScope() ? { state: (await loadPersistentGameData()).appearance.spark?.state } : await requestLiveops();
      if (!current()) return;
      status.textContent = result.state?.chests ? 'Kho rương' : 'Kho rương sắp mở.';
      root.dataset.gameId = gameId;
    } catch { if (current()) status.textContent = 'Chưa tải được Kho rương. Hãy kết nối và thử lại.'; }
  }
  root.append(action('Tải lại Kho rương', () => void load())); void load();
  return () => { scope.dispose(); release.forget(); };
}
