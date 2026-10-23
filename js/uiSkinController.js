export const UI_SKIN_CHOICES = Object.freeze([
  { id: 'default', name: 'Mặc định' }, { id: 'woodland', name: 'Nâng cao' },
  { id: 'papercut', name: 'Giấy cắt nhiều lớp' }, { id: 'starship', name: 'Phi thuyền vũ trụ' },
  { id: 'storybook', name: 'Cổ tích' },
]);
export const normalizeUiSkin = value => UI_SKIN_CHOICES.some(skin => skin.id === value) ? value : 'default';

/** One generation owns loading and one queue owns durable selection commits. */
export function createUiSkinController({ load, save, apply, captureOwner, committed = () => {} }) {
  let generation = 0, disposed = false, loading = null, queue = Promise.resolve();
  async function select(value, { persist = true } = {}) {
    if (disposed) return { status: 'stale' };
    const skin = normalizeUiSkin(value), token = ++generation, owner = captureOwner();
    loading?.abort();
    const abort = new AbortController(); loading = abort;
    const current = () => !disposed && token === generation && owner === captureOwner();
    try {
      await load(skin, abort.signal);
      if (!current()) return { status: 'stale' };
      const commit = queue.then(async () => {
        if (!current()) return { status: 'stale' };
        if (persist && !await save(skin)) throw new Error('skin-save-failed');
        if (!current()) return { status: 'stale' };
        committed(skin, persist);
        apply(skin);
        return { status: 'applied', skin };
      });
      // A failed choice cannot poison the queue for a later retry.
      queue = commit.then(() => undefined, () => undefined);
      return await commit;
    } catch (error) {
      abort.abort();
      if (!current() || error.name === 'AbortError') return { status: 'stale' };
      return { status: 'error', error };
    } finally { if (loading === abort) loading = null; }
  }
  return {
    select,
    get busy() { return loading !== null; },
    dispose() { disposed = true; generation++; loading?.abort(); loading = null; },
  };
}
