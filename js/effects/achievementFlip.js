const NS = 'http://www.w3.org/2000/svg';
let liveParticles = 0;
export function decorateAchievementFlip(image, animationClass) {
  const petals = animationClass === 'appear-storybook-petals';
  if (!petals && animationClass !== 'appear-storybook-moon') return null;
  const tile = image.closest('.tile'), count = petals ? 6 : 4;
  if (!tile || liveParticles + count > 24) return null;
  const layer = document.createElementNS(NS, 'svg'); layer.setAttribute('viewBox', '0 0 100 100');
  layer.setAttribute('aria-hidden', 'true'); layer.classList.add('achievement-flip-particles');
  for (let index = 0; index < count; index++) {
    const particle = document.createElementNS(NS, 'path');
    particle.setAttribute('d', petals ? 'M0 0Q-8-11 0-15Q8-11 0 0Z' : 'M-5-7A8 8 0 1 0 5 7A7 7 0 0 1-5-7Z');
    particle.setAttribute('fill', petals ? '#ffa9cc' : '#c7eaff');
    particle.setAttribute('transform', `translate(${18 + index * 64 / (count - 1)} ${22 + index % 2 * 46}) scale(.6)`);
    layer.append(particle);
  }
  tile.append(layer); liveParticles += count;
  let active = true;
  return () => { if (!active) return; active = false; layer.remove(); liveParticles -= count; };
}
export const getAchievementFlipParticleCount = () => liveParticles;
