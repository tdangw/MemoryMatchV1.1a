import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBackgroundRuntime } from '../../js/background/runtime.js';
import { createGameShellLifecycle } from '../../js/gameShell/gameShellLifecycle.js';

const turn = () => new Promise(resolve => setImmediate(resolve));
function fixture() {
  const view = new EventTarget(), doc = new EventTarget(), media = new EventTarget();
  const timers = new Map(), frames = new Map(); let serial = 0, active = 0, live = 0, preparations = 0;
  media.matches = false; doc.hidden = false;
  Object.assign(view, { AbortController, matchMedia: () => media,
    setTimeout(callback) { const id = ++serial; timers.set(id, callback); return id; }, clearTimeout: id => timers.delete(id),
    requestAnimationFrame(callback) { const id = ++serial; frames.set(id, callback); return id; }, cancelAnimationFrame: id => frames.delete(id) });
  const errors = [];
  const runtime = createBackgroundRuntime({ view, document: doc, report: (...args) => errors.push(args), meteor: {
    spawn() { active = Math.min(2, active + 1); }, cancel() { active = 0; }, setVisible() {}, diagnostics: () => ({ nodes: 2, active }),
  } });
  const root = { hidden: false };
  const factory = () => {
    live++; let disposed = false;
    return { diagnostics: () => ({ nodes: 3, handles: 1 }), refresh() {}, dispose() { if (!disposed) { disposed = true; live--; } } };
  };
  const mount = (extra = {}) => {
    const scope = createGameShellLifecycle();
    const control = runtime.mount({ scope, root, kind: 'memory', prepare: async () => { preparations++; return factory; }, ...extra });
    return { scope, control };
  };
  return { runtime, mount, factory, root, view, doc, media, timers, frames, errors, get live() { return live; }, get preparations() { return preparations; } };
}
test('meteor eligibility never blocks gameplay; nested suspension and 100 toggles release exact owners', async () => {
  const f = fixture(); f.runtime.setMeteorEligible(true); assert.equal(f.timers.size, 1);
  f.mount(); await turn();
  f.runtime.setMeteorEligible(false);
  assert.equal(f.runtime.diagnostics().state, 'RUNNING'); assert.equal(f.live, 1); assert.equal(f.timers.size, 0);
  const a = f.runtime.suspend(), b = f.runtime.suspend();
  assert.equal(f.live, 0); a(); a(); assert.equal(f.runtime.diagnostics().state, 'SUSPENDED');
  b(); assert.equal(f.live, 1);
  for (let i = 0; i < 100; i++) { f.runtime.setEnabled(false); assert.equal(f.live, 0); f.runtime.setEnabled(true); }
  assert.equal(f.preparations, 1); assert.equal(f.live, 1);
  f.runtime.dispose(); f.runtime.dispose(); assert.equal(f.live, 0); assert.equal(f.timers.size, 0);
});
test('late preparation and failed sources cannot mount into the next scope or retry on resize', async () => {
  const f = fixture(); let resolve;
  const one = f.mount({ prepare: () => new Promise(r => { resolve = r; }) }); await turn();
  const two = f.mount(); await turn(); resolve(f.factory); await turn();
  assert.equal(f.live, 1); one.scope.dispose(); assert.equal(f.live, 1);
  two.scope.dispose(); assert.equal(f.live, 0);
  let attempts = 0;
  f.mount({ prepare: async () => { attempts++; throw new Error('decode failed'); } }); await turn();
  assert.equal(f.runtime.diagnostics().state, 'STATIC');
  for (let i = 0; i < 100; i++) { f.runtime.refresh(); for (const [id, fn] of [...f.frames]) { f.frames.delete(id); fn(); } }
  assert.equal(attempts, 1); assert.equal(f.live, 0); assert.equal(f.errors.length, 1); f.runtime.dispose();
});
test('off/reduced before preparation makes no requests; hidden/pagehide and disposed queued frames stay bounded', async () => {
  const f = fixture(); f.runtime.setEnabled(false); const { scope } = f.mount(); await turn(); assert.equal(f.preparations, 0);
  f.runtime.setEnabled(true); await turn(); assert.equal(f.live, 1);
  f.media.matches = true; f.media.dispatchEvent(new Event('change')); assert.equal(f.live, 0);
  f.media.matches = false; f.media.dispatchEvent(new Event('change')); assert.equal(f.live, 1);
  f.doc.hidden = true; f.doc.dispatchEvent(new Event('visibilitychange')); assert.equal(f.live, 0);
  f.doc.hidden = false; f.doc.dispatchEvent(new Event('visibilitychange')); assert.equal(f.live, 1);
  f.view.dispatchEvent(new Event('pagehide')); assert.equal(f.live, 0);
  f.view.dispatchEvent(new Event('pageshow')); assert.equal(f.live, 1);
  f.runtime.refresh(); assert.equal(f.frames.size, 1); scope.dispose();
  assert.equal(f.frames.size, 0); assert.equal(f.live, 0); f.runtime.refresh(scope); assert.equal(f.frames.size, 0);
  f.runtime.dispose();
});
test('a scene exceeding the fixed Light budget falls static and is disposed', async () => {
  const f = fixture(); let disposed = 0;
  f.mount({ prepare: async () => () => ({ diagnostics: () => ({ nodes: 10, handles: 6 }), refresh() {}, dispose() { disposed++; } }) });
  await turn(); assert.equal(f.runtime.diagnostics().state, 'STATIC'); assert.equal(disposed, 1); assert.match(f.runtime.diagnostics().lastError, /Error/);
  f.runtime.dispose();
});

test('turning off pending preparation aborts it; a stale rejection cannot fail the resumed owner', async () => {
  const f=fixture(), pending=[];
  f.mount({prepare:signal=>new Promise((resolve,reject)=>pending.push({signal,resolve,reject}))});
  await turn(); f.runtime.setEnabled(false); assert.equal(pending[0].signal.aborted,true);
  f.runtime.setEnabled(true); await turn(); assert.equal(pending.length,2);
  pending[0].reject(new Error('late failure')); pending[1].resolve(f.factory); await turn();
  assert.equal(f.live,1); assert.equal(f.runtime.diagnostics().state,'RUNNING'); assert.equal(f.errors.length,0); f.runtime.dispose();
});

test('the shared scroll-idle timer survives another popup and is cancelled on system off', async () => {
  const f=fixture();let resumeScroll=null,cancelIdle=null;
  const end=()=>{if(cancelIdle)cancelIdle();cancelIdle=null;const resume=resumeScroll;resumeScroll=null;if(resume)resume();};
  f.mount({onInactive:end});await turn();resumeScroll=f.runtime.suspend();cancelIdle=f.runtime.idle(end,140);
  const popup=f.runtime.suspend();assert.equal(f.timers.size,1);
  f.runtime.refresh();assert.equal(f.timers.size,1);
  for(const [id,fn] of [...f.timers]){f.timers.delete(id);fn();}
  assert.equal(f.runtime.diagnostics().blockers,1);popup();assert.equal(f.live,1);
  resumeScroll=f.runtime.suspend();cancelIdle=f.runtime.idle(end,140);f.runtime.setEnabled(false);
  assert.equal(f.timers.size,0);assert.equal(f.runtime.diagnostics().blockers,0);f.runtime.dispose();
});

test('replacing or disposing the app owner releases scene bindings even while its page remains active', async () => {
  const f=fixture();let cleanups=0;
  const page=f.mount({onDispose:()=>cleanups++});await turn();
  f.mount();await turn();assert.equal(cleanups,1);assert.equal(page.scope.active,true);
  f.runtime.dispose();assert.equal(f.live,0);assert.equal(f.timers.size,0);assert.equal(f.frames.size,0);
});

test('layout reconciliation releases meteors before allocating a larger scene',async()=>{
  const f=fixture();let handles=1,refreshed=false;
  f.runtime.setMeteorEligible(true);
  f.mount({prepare:async()=>()=>({diagnostics:()=>({nodes:12,handles}),dispose(){},refresh(){
    assert.equal(f.runtime.meteorDiagnostics().active,0);
    handles=5;refreshed=true;
  }})});
  await turn();
  for(let i=0;i<2;i++){const [id,callback]=f.timers.entries().next().value;f.timers.delete(id);callback();}
  assert.equal(f.runtime.meteorDiagnostics().active,2);
  f.runtime.refresh();
  for(const [id,callback]of [...f.frames]){f.frames.delete(id);callback();}
  assert.equal(refreshed,true);assert.equal(f.runtime.diagnostics().handles,5);
  assert.equal(f.runtime.diagnostics().lastError,null);assert.equal(f.timers.size,0);f.runtime.dispose();
});

test('static backing slots share capacity with meteors without changing eligibility',async()=>{
  const f=fixture();let handles=3;
  f.runtime.setMeteorEligible(true);
  f.mount({prepare:async()=>()=>({diagnostics:()=>({nodes:15,handles,reservedSlots:1}),dispose(){},refresh(){}})});
  await turn();
  assert.equal(f.runtime.meteorDiagnostics().eligible,true);
  assert.equal(f.timers.size,0); // 3 native + pad leaves only one, not two meteor slots
  handles=2;f.runtime.refresh();
  for(const [id,callback]of [...f.frames]){f.frames.delete(id);callback();}
  assert.equal(f.timers.size,1);
  for(let i=0;i<3;i++){const [id,callback]=f.timers.entries().next().value;f.timers.delete(id);callback();}
  assert.equal(f.runtime.meteorDiagnostics().active,2);
  assert.equal(f.runtime.diagnostics().handles+f.runtime.diagnostics().reservedSlots,5);
  handles=5;f.runtime.refresh();
  for(const [id,callback]of [...f.frames]){f.frames.delete(id);callback();}
  assert.equal(f.runtime.diagnostics().state,'STATIC');
  assert.match(f.runtime.diagnostics().lastError,/budget/);f.runtime.dispose();
});
