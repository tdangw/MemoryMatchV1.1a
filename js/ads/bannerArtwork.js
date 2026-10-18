const heart = '<path d="M12 20 3 11C-2 3 8-1 12 6 16-1 26 3 21 11Z"/>';
const star = '<path d="m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z"/>';
const cards = [10, 30, 50, 70, 90].map((position, index) =>
  `<span class="ad-art-card${index === 4 ? ' ad-art-card--gold' : ''}" style="--ad-art-position:${position}%;--ad-art-delay:${index % 2 * .18}s"><svg viewBox="0 0 24 24">${index === 4 ? star : heart}</svg></span>`).join('');
const flower = `<path d="M24 52V23M24 43Q5 44 9 32Q22 32 24 43M24 38Q42 36 39 27Q28 28 24 38" fill="#78bfa0" stroke="#78bfa0" stroke-width="2"/><g fill="#f3cbd5"><ellipse cx="24" cy="12" rx="6" ry="10"/><ellipse cx="24" cy="32" rx="6" ry="10"/><ellipse cx="14" cy="22" rx="10" ry="6"/><ellipse cx="34" cy="22" rx="10" ry="6"/><circle cx="24" cy="22" r="7" fill="#f4d57b"/></g>`;
const flowers = [18, 50, 82].map(position =>
  `<svg class="ad-art-flower" style="--ad-art-position:${position}%" viewBox="0 0 48 54">${flower}</svg>`).join('');
const scenes = [
  ['cards', `${cards}<i class="ad-art-spark ad-art-spark--one"></i><i class="ad-art-spark ad-art-spark--two"></i><i class="ad-art-spark ad-art-spark--three"></i>`],
  ['garden', `${flowers}<i class="ad-art-firefly ad-art-firefly--one"></i><i class="ad-art-firefly ad-art-firefly--two"></i><i class="ad-art-firefly ad-art-firefly--three"></i>`],
  ['runner', `<span class="ad-art-runner"><svg viewBox="0 0 48 48"><path d="M10 38V22C10 2 38 2 38 22V38Z" fill="#91d1b5"/><ellipse cx="24" cy="24" rx="11" ry="10" fill="#fff0cb"/><circle cx="20" cy="23" r="1.6" fill="#203c48"/><circle cx="28" cy="23" r="1.6" fill="#203c48"/><path d="M21 28Q24 31 27 28" fill="none" stroke="#9d6354" stroke-width="1.5" stroke-linecap="round"/><path d="M8 16Q23-4 40 16Z" fill="#e8c67b"/></svg><i class="ad-art-foot ad-art-foot--left"></i><i class="ad-art-foot ad-art-foot--right"></i></span><i class="ad-art-trail ad-art-trail--one"></i><i class="ad-art-trail ad-art-trail--two"></i>`],
];

// One finite CSS scene at a time. The owning banner cancels it by disposal.
export function mountBannerArtwork(host) {
  let index = 0, scene = null, disposed = false;
  function show() {
    const next = document.createElement('div');
    next.className = 'ad-art-scene';
    next.dataset.adScene = scenes[index][0];
    next.innerHTML = scenes[index][1];
    if (scene) scene.replaceWith(next);
    else host.append(next);
    scene = next;
  }
  function advance(event) {
    if (disposed || event.target !== scene || event.animationName !== 'ad-art-scene-cycle') return;
    index = (index + 1) % scenes.length;
    show();
  }
  host.addEventListener('animationend', advance);
  show();
  return {
    dispose() {
      if (disposed) return;
      disposed = true;
      host.removeEventListener('animationend', advance);
      scene.remove();
      scene = null;
    },
    diagnostics() { return { scene: scene?.dataset.adScene || null, nodes: scene ? 1 + scene.querySelectorAll('*').length : 0 }; },
  };
}
