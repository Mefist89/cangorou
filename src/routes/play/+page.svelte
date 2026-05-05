<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import CodeEditor from '$lib/components/CodeEditor.svelte';
  import ControlPanel from '$lib/components/ControlPanel.svelte';
  import GameCanvas from '$lib/components/GameCanvas.svelte';
  import { levels } from '$lib/stores/levels';
  import { progressStore } from '$lib/stores/gameStore';
  import { eventBus } from '$lib/game/EventBus';

  let levelIndex = $state(0);
  let code = $state('// Scrie codul tău aici\npas;\npas;\npas;\nvopseste;\n');
  let speed = $state(1);
  let showHint = $state(false);
  let showSuccess = $state(false);

  let level = $derived(levels[levelIndex] || levels[0]);

  onMount(() => {
    const params = new URLSearchParams(window.location.search);
    const idx = parseInt(params.get('level') || '0');
    if (idx >= 0 && idx < levels.length) levelIndex = idx;

    // Listen for level completion
    eventBus.on('level-complete', (levelId: number) => {
      progressStore.completeLevel(levelId);
      showSuccess = true;
      setTimeout(() => { showSuccess = false; }, 4000);
    });
  });

  function goBack() { goto('/'); }
  function nextLevel() {
    if (levelIndex < levels.length - 1) {
      levelIndex++;
      showSuccess = false;
      code = '// Nivel ' + level.id + '\n';
      goto(`/play?level=${levelIndex}`, { replaceState: true });
    }
  }
</script>

<svelte:head>
  <title>Cangaroo — {level.title}</title>
</svelte:head>

<main class="play-page">
  <!-- Top Bar -->
  <header class="top-bar">
    <button class="back-btn" onclick={goBack} id="btn-back">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5m7-7-7 7 7 7"/></svg>
    </button>
    <div class="level-info">
      <span class="level-badge">Nivel {level.id}</span>
      <h1 class="level-title">{level.title}</h1>
    </div>
    <button class="hint-btn" class:active={showHint} onclick={() => showHint = !showHint} id="btn-hint">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><circle cx="12" cy="17" r=".5" fill="currentColor"/></svg>
      <span>Indiciu</span>
    </button>
  </header>

  {#if showHint}
    <div class="hint-bar" id="hint-display">
      <span class="hint-icon">💡</span>
      <p>{level.hint}</p>
    </div>
  {/if}

  <!-- Success overlay -->
  {#if showSuccess}
    <div class="success-overlay" id="success-overlay">
      <div class="success-card">
        <div class="success-icon">🎉</div>
        <h2>Excelent!</h2>
        <p>Ai completat nivelul «{level.title}»!</p>
        {#if levelIndex < levels.length - 1}
          <button class="btn-neon lime" onclick={nextLevel}>Nivelul următor →</button>
        {:else}
          <button class="btn-neon" onclick={goBack}>Înapoi la meniu</button>
        {/if}
      </div>
    </div>
  {/if}

  <!-- Main Layout -->
  {#key levelIndex}
  <div class="game-layout">
    <div class="editor-panel">
      <div class="editor-area">
        <CodeEditor bind:code />
      </div>
      <ControlPanel {code} {level} bind:speed />
    </div>

    <!-- Commands Cheat Sheet -->
    <div class="commands-panel">
      <h3 class="panel-title">COMENZI</h3>
      <div class="commands-list">
        <div class="cmd-item">
          <code>pas;</code>
          <p>Un pas înainte</p>
        </div>
        <div class="cmd-item">
          <code>rotire_dreapta;</code>
          <p>Viraj dreapta</p>
        </div>
        <div class="cmd-item">
          <code>rotire_stinga;</code>
          <p>Viraj stânga</p>
        </div>
        <div class="cmd-item">
          <code>vopseste;</code>
          <p>Vopsește celula</p>
        </div>
        <div class="cmd-item">
          <code>sari;</code>
          <p>Sari o celulă</p>
        </div>
        <div class="cmd-item loop">
          <code>repetă (n) &lbrace; ... &rbrace;</code>
          <p>Repetă de n ori</p>
        </div>
        <div class="cmd-item cond">
          <code>dacă (liber) &lbrace; ... &rbrace;</code>
          <p>Dacă drumul e liber</p>
        </div>
      </div>
    </div>

    <div class="canvas-panel">
      <GameCanvas {level} {speed} />
      <div class="level-desc">
        <p>{level.description}</p>
      </div>
    </div>
  </div>
  {/key}
</main>

<style>
  .play-page { height:100vh; display:flex; flex-direction:column; padding:0; overflow:hidden; }

  .top-bar { display:flex; align-items:center; gap:16px; padding:12px 20px; background:rgba(15,23,42,0.8); border-bottom:1px solid rgba(34,211,238,0.1); flex-shrink:0; }
  .back-btn { background:none; border:1px solid rgba(34,211,238,0.2); color:#94a3b8; cursor:pointer; padding:6px 8px; border-radius:6px; display:flex; align-items:center; transition:all 0.2s; }
  .back-btn:hover { color:#22d3ee; border-color:rgba(34,211,238,0.4); }
  .level-info { flex:1; }
  .level-badge { font-family:'Orbitron',sans-serif; font-size:0.6rem; color:#d946ef; letter-spacing:0.12em; text-transform:uppercase; }
  .level-title { font-family:'Orbitron',sans-serif; font-size:0.95rem; font-weight:600; color:#e2e8f0; margin:2px 0 0; }
  .hint-btn { display:flex; align-items:center; gap:4px; background:none; border:1px solid rgba(234,179,8,0.3); color:#eab308; cursor:pointer; padding:6px 12px; border-radius:6px; font-family:'Orbitron',sans-serif; font-size:0.6rem; letter-spacing:0.08em; text-transform:uppercase; transition:all 0.2s; }
  .hint-btn:hover, .hint-btn.active { background:rgba(234,179,8,0.1); box-shadow:0 0 8px rgba(234,179,8,0.2); }

  .hint-bar { display:flex; align-items:center; gap:10px; padding:10px 20px; background:rgba(234,179,8,0.06); border-bottom:1px solid rgba(234,179,8,0.15); flex-shrink:0; animation:slideUp 0.2s ease; }
  .hint-icon { font-size:1.2rem; }
  .hint-bar p { font-family:'JetBrains Mono',monospace; font-size:0.8rem; color:#fbbf24; margin:0; }

  .game-layout { flex:1; display:grid; grid-template-columns: 0.8fr 220px 1.25fr; gap:0; overflow:hidden; }

  .editor-panel { display:flex; flex-direction:column; gap:0; border-right:1px solid rgba(34,211,238,0.08); overflow:hidden; }
  .editor-area { flex:1; padding:12px; overflow:hidden; display:flex; flex-direction:column; }

  .commands-panel { display:flex; flex-direction:column; padding:16px; border-right:1px solid rgba(34,211,238,0.08); background:rgba(2,6,23,0.4); overflow-y:auto; }
  .panel-title { font-family:'Orbitron',sans-serif; font-size:0.75rem; color:#22d3ee; margin:0 0 16px; letter-spacing:0.1em; text-align:center; border-bottom:1px solid rgba(34,211,238,0.2); padding-bottom:8px; }
  .commands-list { display:flex; flex-direction:column; gap:12px; }
  .cmd-item { padding:8px 10px; background:rgba(30,41,59,0.5); border:1px solid rgba(34,211,238,0.15); border-radius:6px; transition:all 0.2s; }
  .cmd-item:hover { border-color:rgba(34,211,238,0.4); background:rgba(30,41,59,0.8); }
  .cmd-item code { display:block; font-family:'JetBrains Mono',monospace; font-size:0.75rem; color:#e879f9; margin-bottom:4px; font-weight:bold; }
  .cmd-item p { margin:0; font-size:0.65rem; color:#94a3b8; }
  .cmd-item.loop code { color:#22d3ee; }
  .cmd-item.cond code { color:#a3e635; }

  .canvas-panel { display:flex; flex-direction:column; padding:12px; overflow:hidden; }

  .level-desc { padding:10px 4px; }
  .level-desc p { font-size:0.75rem; color:#64748b; margin:0; }

  .success-overlay { position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(2,6,23,0.85); z-index:100; display:flex; align-items:center; justify-content:center; animation:fadeIn 0.3s ease; }
  .success-card { text-align:center; padding:40px 50px; background:rgba(30,41,59,0.9); border:1px solid rgba(132,204,22,0.3); border-radius:16px; box-shadow:0 0 40px rgba(132,204,22,0.15); animation:slideUp 0.4s ease; }
  .success-icon { font-size:3rem; margin-bottom:12px; }
  .success-card h2 { font-family:'Orbitron',sans-serif; font-size:1.5rem; color:#84cc16; margin:0 0 8px; }
  .success-card p { color:#94a3b8; margin:0 0 20px; font-size:0.85rem; }

  @media (max-width: 768px) {
    .game-layout { grid-template-columns:1fr; grid-template-rows:1fr 1fr; }
  }
</style>
