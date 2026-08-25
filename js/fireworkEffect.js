const MOBILE_QUERY = "(max-width: 600px)";

function random(min, max) {
  return Math.random() * (max - min) + min;
}

/** A short, capped canvas show designed for mid-range mobile devices. */
export function showVictoryFireworks({ durationMs = 3600 } = {}) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return Promise.resolve();
  }

  document.getElementById("victory-fireworks")?.remove();
  const canvas = document.createElement("canvas");
  canvas.id = "victory-fireworks";
  canvas.setAttribute("aria-hidden", "true");
  Object.assign(canvas.style, {
    position: "fixed", inset: "0", width: "100vw", height: "100dvh",
    pointerEvents: "none", zIndex: "32000",
  });
  document.body.append(canvas);

  const compact = window.matchMedia(MOBILE_QUERY).matches;
  const scale = Math.min(window.devicePixelRatio || 1, compact ? 1.25 : 1.5);
  const resize = () => {
    canvas.width = Math.floor(window.innerWidth * scale);
    canvas.height = Math.floor(window.innerHeight * scale);
  };
  resize();
  const context = canvas.getContext("2d", { alpha: true });
  const particles = [];
  const particleLimit = compact ? 110 : 180;
  const particlesPerBurst = compact ? 28 : 42;
  let frameId;
  let previous = performance.now();
  let nextBurstAt = 0;

  const burst = () => {
    const x = random(canvas.width * 0.18, canvas.width * 0.82);
    const y = random(canvas.height * 0.12, canvas.height * 0.48);
    const hue = random(20, 340);
    for (let index = 0; index < particlesPerBurst && particles.length < particleLimit; index += 1) {
      const angle = (Math.PI * 2 * index) / particlesPerBurst + random(-0.12, 0.12);
      const speed = random(compact ? 1.6 : 2.2, compact ? 3.8 : 5.2) * scale;
      particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 1, decay: random(0.012, 0.022), hue });
    }
  };

  const render = (now) => {
    const delta = Math.min(2, (now - previous) / 16.67);
    previous = now;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.globalCompositeOperation = "lighter";
    if (now >= nextBurstAt) { burst(); nextBurstAt = now + random(420, 700); }
    for (let index = particles.length - 1; index >= 0; index -= 1) {
      const particle = particles[index];
      particle.x += particle.vx * delta;
      particle.y += particle.vy * delta;
      particle.vy += 0.07 * scale * delta;
      particle.vx *= 0.985;
      particle.life -= particle.decay * delta;
      if (particle.life <= 0) { particles.splice(index, 1); continue; }
      context.fillStyle = `hsla(${particle.hue}, 100%, 68%, ${particle.life})`;
      context.beginPath();
      context.arc(particle.x, particle.y, compact ? 1.6 * scale : 2 * scale, 0, Math.PI * 2);
      context.fill();
    }
    frameId = requestAnimationFrame(render);
  };

  frameId = requestAnimationFrame(render);
  return new Promise((resolve) => setTimeout(() => {
    cancelAnimationFrame(frameId);
    canvas.remove();
    resolve();
  }, durationMs));
}
