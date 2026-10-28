import { gameState } from './gameState.js';
import { subscribeToLocalCommit } from './persistence.js';
import { createIcon } from './icons.js';
import '../styles/wallet.css';

/** One presentation subscription owned by the current menu or modal. */
export function mountAppWallet(host, scope, className = '') {
  const wallet = document.createElement('div'); wallet.className = `app-wallet ${className}`;
  const value = document.createElement('span'); value.dataset.appCoinBalance = ''; value.dataset.shopCoinBalance = '';
  wallet.append(createIcon('coin'), value); host.append(wallet);
  let previous;
  const update = coins => {
    if (coins === previous) return; previous = coins;
    value.textContent = coins.toLocaleString('vi-VN');
    wallet.setAttribute('aria-label', `Số Xu hiện có: ${value.textContent}`);
  };
  update(gameState.coins);
  scope.own(subscribeToLocalCommit(({data}) => update(data.coins)), 'listener');
  scope.own(() => wallet.remove(), 'node');
  host.classList.add('has-app-wallet');
  return wallet;
}
