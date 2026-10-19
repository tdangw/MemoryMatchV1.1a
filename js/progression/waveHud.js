import '../../styles/progression.css';

// The shell owns the node; remounts update the same badge and create no listeners.
export function renderWaveStatus(refs, wave) {
  if (!wave) return;
  let badge = refs.title.querySelector('.progression-wave-status');
  if (!badge) {
    badge = document.createElement('span');
    badge.className = 'progression-wave-status';
    refs.title.append(badge);
  }
  badge.textContent = `Đợt ${wave.index}/${wave.count}`;
  refs.root.dataset.waveIndex = String(wave.index);
  refs.root.dataset.waveCount = String(wave.count);
}
