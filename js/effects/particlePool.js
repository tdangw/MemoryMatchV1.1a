export function createParticlePool(capacity = 48) {
  if (!Number.isInteger(capacity) || capacity < 1 || capacity > 48) throw new TypeError("Invalid particle pool capacity");
  const x = new Float32Array(capacity);
  const y = new Float32Array(capacity);
  const velocityX = new Float32Array(capacity);
  const velocityY = new Float32Array(capacity);
  let active = 0;
  return Object.freeze({
    acquire(count) {
      const size = Math.max(0, Math.min(capacity - active, Math.floor(count)));
      const start = active;
      active += size;
      return Object.freeze({ start, size, x, y, velocityX, velocityY });
    },
    release(slice) {
      if (!slice || slice.start + slice.size !== active) throw new Error("Particle slices must release in LIFO order");
      active = slice.start;
    },
    get capacity() { return capacity; },
    get active() { return active; },
  });
}
