<script lang="ts">
  import { eventBus } from '$lib/game/EventBus';
  import { parse } from '$lib/parser/parser';
  import { interpret, type GridState } from '$lib/parser/interpreter';
  import type { LevelDefinition } from '$lib/stores/levels';

  let { code = '', level, speed = $bindable(1), onspeedchange }:
    { code: string; level: LevelDefinition; speed: number; onspeedchange?: (s: number) => void } = $props();

  let isRunning = $state(false);
  let isPaused = $state(false);
  let compiledCode = $state('');
  let hasError = $state(false);
  let errorMessage = $state('');

  $effect(() => {
    const onStart = () => { isRunning = true; isPaused = false; };
    const onStop = () => { isRunning = false; isPaused = true; };
    const onComplete = () => { isRunning = false; isPaused = false; };
    eventBus.on('execution-start', onStart);
    eventBus.on('execution-stop', onStop);
    eventBus.on('execution-complete', onComplete);
    return () => {
      eventBus.off('execution-start', onStart);
      eventBus.off('execution-stop', onStop);
      eventBus.off('execution-complete', onComplete);
    };
  });

  function handlePlay() {
    hasError = false;
    if (isPaused && code === compiledCode) {
      eventBus.emit('resume');
      return;
    }
    const { ast, errors } = parse(code);
    if (errors.length > 0) { hasError = true; errorMessage = errors[0].message; return; }
    compiledCode = code;
    isPaused = false;
    const gs: GridState = { x: level.startX, y: level.startY, direction: level.startDirection, gridWidth: level.gridWidth, gridHeight: level.gridHeight, obstacles: new Map(level.obstacles.map(o => [`${o.x},${o.y}`, { type: o.type }])) };
    eventBus.emit('execute-code', interpret(ast, gs));
  }
  
  function handleStep() {
    hasError = false;
    if ((!isRunning && !isPaused) || code !== compiledCode) {
      const { ast, errors } = parse(code);
      if (errors.length > 0) { hasError = true; errorMessage = errors[0].message; return; }
      compiledCode = code;
      isPaused = true;
      const gs: GridState = { x: level.startX, y: level.startY, direction: level.startDirection, gridWidth: level.gridWidth, gridHeight: level.gridHeight, obstacles: new Map(level.obstacles.map(o => [`${o.x},${o.y}`, { type: o.type }])) };
      eventBus.emit('load-code', interpret(ast, gs));
      setTimeout(() => eventBus.emit('step'), 10);
      return;
    }
    eventBus.emit('step');
  }
  
  function handleStop() { eventBus.emit('stop'); }
  function handleReset() { hasError = false; isPaused = false; compiledCode = ''; eventBus.emit('reset'); }
  function handleSpeedChange(e: Event) { speed = parseFloat((e.target as HTMLInputElement).value); onspeedchange?.(speed); }
</script>

<div class="control-panel" id="control-panel">
  <div class="btn-group">
    <button class="ctrl-btn play" onclick={handlePlay} disabled={isRunning} id="btn-play">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
      <span>START</span>
    </button>
    <button class="ctrl-btn step" onclick={handleStep} id="btn-step">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
      <span>Pas</span>
    </button>
    <button class="ctrl-btn stop" onclick={handleStop} disabled={!isRunning} id="btn-stop">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12"/></svg>
      <span>Stop</span>
    </button>
    <button class="ctrl-btn reset" onclick={handleReset} id="btn-reset">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 1 3 7"/><path d="M3 22v-6h6"/></svg>
      <span>Reset</span>
    </button>
  </div>
  <div class="speed-control">
    <label for="speed-slider"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>{speed.toFixed(1)}x</label>
    <input type="range" id="speed-slider" min="0.3" max="3" step="0.1" value={speed} oninput={handleSpeedChange} class="speed-slider" />
  </div>
  {#if hasError}<div class="error-message">⚠ {errorMessage}</div>{/if}
</div>

<style>
  .control-panel { display:flex; flex-direction:column; gap:10px; padding:12px 14px; background:rgba(15,23,42,0.7); border:1px solid rgba(34,211,238,0.15); border-radius:10px; }
  .btn-group { display:flex; gap:6px; }
  .ctrl-btn { display:flex; align-items:center; gap:4px; padding:8px 14px; border:1px solid rgba(34,211,238,0.3); background:rgba(34,211,238,0.06); color:#22d3ee; font-family:'Orbitron',sans-serif; font-size:0.65rem; letter-spacing:0.08em; text-transform:uppercase; cursor:pointer; border-radius:6px; transition:all 0.2s ease; }
  .ctrl-btn:hover:not(:disabled) { background:rgba(34,211,238,0.15); box-shadow:0 0 12px rgba(34,211,238,0.2); }
  .ctrl-btn:active:not(:disabled) { transform:scale(0.96); }
  .ctrl-btn:disabled { opacity:0.35; cursor:not-allowed; }
  .ctrl-btn.play { border-color:rgba(132,204,22,0.4); background:rgba(132,204,22,0.08); color:#84cc16; }
  .ctrl-btn.play:hover:not(:disabled) { background:rgba(132,204,22,0.18); box-shadow:0 0 12px rgba(132,204,22,0.25); }
  .ctrl-btn.stop { border-color:rgba(239,68,68,0.4); background:rgba(239,68,68,0.08); color:#ef4444; }
  .ctrl-btn.stop:hover:not(:disabled) { background:rgba(239,68,68,0.18); box-shadow:0 0 12px rgba(239,68,68,0.25); }
  .ctrl-btn.reset { border-color:rgba(234,179,8,0.4); background:rgba(234,179,8,0.08); color:#eab308; }
  .ctrl-btn.reset:hover:not(:disabled) { background:rgba(234,179,8,0.18); box-shadow:0 0 12px rgba(234,179,8,0.25); }
  .speed-control { display:flex; align-items:center; gap:10px; }
  .speed-control label { display:flex; align-items:center; gap:4px; font-family:'JetBrains Mono',monospace; font-size:0.7rem; color:#94a3b8; min-width:55px; }
  .speed-slider { flex:1; -webkit-appearance:none; appearance:none; height:4px; background:rgba(34,211,238,0.2); border-radius:2px; outline:none; cursor:pointer; }
  .speed-slider::-webkit-slider-thumb { -webkit-appearance:none; appearance:none; width:14px; height:14px; background:#22d3ee; border-radius:50%; cursor:pointer; box-shadow:0 0 6px rgba(34,211,238,0.5); }
  .error-message { padding:6px 10px; background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); border-radius:6px; color:#f87171; font-family:'JetBrains Mono',monospace; font-size:0.7rem; }
</style>
