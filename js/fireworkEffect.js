const MOBILE_QUERY = "(max-width: 600px)";

function random(min, max) {
  return Math.random() * (max - min) + min;
}

/** A short, capped canvas show designed for mid-range mobile devices. */
export function showVictoryFireworks({
  durationMs = 3600,
  containerId = "game-container",
  burstCount = 4,
  burstIntervalMs = 620,
} = {}) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return Promise.resolve();
  }

  document.getElementById("victory-fireworks")?.remove();
  const canvas = document.createElement("canvas");
  canvas.id = "victory-fireworks";
  canvas.setAttribute("aria-hidden", "true");
  Object.assign(canvas.style, {
    position: "fixed", inset: "0", width: "100vw", height: "100dvh",
    pointerEvents: "none", zIndex: "32001",
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
  const rockets = [];
  const particles = [];
  const particleLimit = compact ? 175 : 250;
  const particlesPerBurst = compact ? 44 : 60;
  let frameId;
  let previous = performance.now();
  let nextBurstAt = 0;
  let launches = 0;

  const burst = (x, y, hue, isFinalBurst = false) => {
    const count = isFinalBurst ? (compact ? 74 : 96) : particlesPerBurst;
    for (let index = 0; index < count && particles.length < particleLimit; index += 1) {
      const angle = (Math.PI * 2 * index) / count + (isFinalBurst ? 0 : random(-0.12, 0.12));
      const speed = random(compact ? 3.6 : 4.2, isFinalBurst ? (compact ? 8.2 : 10) : (compact ? 6.8 : 8)) * scale;
      particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 1, decay: random(isFinalBurst ? 0.009 : 0.012, isFinalBurst ? 0.014 : 0.022), hue: isFinalBurst ? (hue + (index / count) * 180) % 360 : hue, size: random(isFinalBurst ? 2 : 1.5, compact ? 2.8 : 3.2) * scale });
    }
  };

  const launchRocket = () => {
    const finalBurstStart = Math.max(0, burstCount - 3);
    const isFinalBurst = launches >= finalBurstStart;
    const finalIndex = launches - finalBurstStart;
    const gameBounds = document.getElementById(containerId)?.getBoundingClientRect();
    const centerX = gameBounds
      ? (gameBounds.left + gameBounds.width / 2) * scale
      : canvas.width / 2;
    const launchY = gameBounds
      ? (gameBounds.bottom - 8) * scale
      : canvas.height + 8 * scale;
    const centerY = gameBounds
      ? (gameBounds.top + gameBounds.height * 0.46) * scale
      : canvas.height * 0.44;
    rockets.push({
    x: centerX + (isFinalBurst
      ? [-canvas.width * 0.14, canvas.width * 0.14, 0][finalIndex]
      : random(-canvas.width * 0.18, canvas.width * 0.18)),
    y: launchY,
    targetY: centerY + (isFinalBurst
      ? [-canvas.height * 0.04, -canvas.height * 0.04, -canvas.height * 0.12][finalIndex]
      : random(-canvas.height * 0.16, canvas.height * 0.12)),
    speed: random(compact ? 16 : 18, compact ? 19 : 22) * scale,
    hue: random(20, 340),
    isFinalBurst,
    trail: [],
    });
  };

  const render = (now) => {
    const delta = Math.min(2, (now - previous) / 16.67);
    previous = now;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.globalCompositeOperation = "lighter";
    if (now >= nextBurstAt && launches < burstCount) {
      launchRocket();
      launches += 1;
      nextBurstAt = now + random(burstIntervalMs * 0.75, burstIntervalMs * 1.1);
    }
    for (let index = rockets.length - 1; index >= 0; index -= 1) {
      const rocket = rockets[index];
      rocket.trail.push([rocket.x, rocket.y]);
      if (rocket.trail.length > 4) rocket.trail.shift();
      rocket.y -= rocket.speed * delta;
      rocket.speed *= 1.006;
      context.beginPath();
      rocket.trail.forEach(([x, y], trailIndex) => {
        if (trailIndex === 0) context.moveTo(x, y); else context.lineTo(x, y);
      });
      context.strokeStyle = `hsl(${rocket.hue}, 100%, 72%)`;
      context.lineWidth = compact ? 1.5 * scale : 2 * scale;
      context.stroke();
      if (rocket.y <= rocket.targetY) {
        burst(rocket.x, rocket.y, rocket.hue, rocket.isFinalBurst);
        rockets.splice(index, 1);
      }
    }
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
      context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
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
