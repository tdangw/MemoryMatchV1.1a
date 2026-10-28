import { gameState } from './gameState.js';
import { subscribeToLocalCommit, loadPersistentGameData } from './persistence.js';
import { createIcon } from './icons.js';
import '../styles/wallet.css';

/** One presentation subscription owned by the current menu or modal. */
export function mountAppWallet(host, scope, className = '') {
  const wallet = document.createElement('div'); wallet.className = `app-wallet ${className}`;
  const value = document.createElement('span'); value.dataset.appCoinBalance = ''; value.dataset.shopCoinBalance = '';
  wallet.append(createIcon('coin'), value); host.append(wallet);
  let previous, generation = 0;
  const update = coins => {
    if (coins === previous) return; previous = coins;
    value.textContent = coins.toLocaleString('vi-VN');
    wallet.setAttribute('aria-label', `Số Xu hiện có: ${value.textContent}`);
  };
  update(gameState.coins);
  scope.own(subscribeToLocalCommit(({patch}) => {
    if (!scope.active) return;
    if (patch.coins !== undefined) { generation++; update(patch.coins); }
    else if (patch.reset || patch.restored) {
      const token = ++generation;
      void loadPersistentGameData().then(data => {
        if (scope.active && token === generation) update(data.coins);
      }).catch(error => {
        if (scope.active && token === generation) {
          value.textContent = '…'; previous = undefined;
          wallet.setAttribute('aria-label', 'Chưa đọc được số Xu');
          console.warn('Wallet refresh unavailable', error.code || error.name);
        }
      });
    }
  }), 'listener');
  scope.own(() => { wallet.remove(); host.classList.remove('has-app-wallet'); }, 'node');
  host.classList.add('has-app-wallet');
  return wallet;
}
