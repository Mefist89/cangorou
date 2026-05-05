<script lang="ts">
  import type { LevelDefinition } from '$lib/stores/levels';

  let { level, completed = false, unlocked = true, onclick }:
    { level: LevelDefinition; completed?: boolean; unlocked?: boolean; onclick?: () => void } = $props();
</script>

<button
  class="level-card"
  class:completed
  class:locked={!unlocked}
  onclick={() => unlocked && onclick?.()}
  disabled={!unlocked}
  id="level-card-{level.id}"
>
  <div class="card-glow"></div>
  <div class="card-content">
    <div class="level-number">
      {#if completed}
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 6L9 17l-5-5"/></svg>
      {:else if !unlocked}
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
      {:else}
        <span class="num">{level.id}</span>
      {/if}
    </div>
    <h3 class="level-title">{level.title}</h3>
    <p class="level-desc">{level.description}</p>
  </div>
</button>

<style>
  .level-card {
    position: relative;
    padding: 24px 20px;
    background: rgba(30, 41, 59, 0.5);
    border: 1px solid rgba(34, 211, 238, 0.2);
    border-radius: 14px;
    cursor: pointer;
    transition: all 0.3s ease;
    text-align: left;
    overflow: hidden;
    font-family: inherit;
    color: inherit;
    animation: slideUp 0.4s ease both;
  }
  .level-card:nth-child(1) { animation-delay: 0.05s; }
  .level-card:nth-child(2) { animation-delay: 0.1s; }
  .level-card:nth-child(3) { animation-delay: 0.15s; }
  .level-card:nth-child(4) { animation-delay: 0.2s; }
  .level-card:nth-child(5) { animation-delay: 0.25s; }
  .level-card:nth-child(6) { animation-delay: 0.3s; }

  .card-glow {
    position: absolute;
    top: -50%; left: -50%;
    width: 200%; height: 200%;
    background: radial-gradient(circle, rgba(34, 211, 238, 0.06) 0%, transparent 70%);
    opacity: 0;
    transition: opacity 0.3s;
    pointer-events: none;
  }

  .level-card:hover:not(.locked) {
    border-color: rgba(34, 211, 238, 0.5);
    transform: translateY(-4px);
    box-shadow: 0 8px 30px rgba(34, 211, 238, 0.15), 0 0 15px rgba(34, 211, 238, 0.1);
  }
  .level-card:hover:not(.locked) .card-glow { opacity: 1; }

  .level-card.completed {
    border-color: rgba(132, 204, 22, 0.3);
  }
  .level-card.completed:hover {
    border-color: rgba(132, 204, 22, 0.5);
    box-shadow: 0 8px 30px rgba(132, 204, 22, 0.15), 0 0 15px rgba(132, 204, 22, 0.1);
  }

  .level-card.locked {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .card-content { position: relative; z-index: 1; }

  .level-number {
    width: 44px; height: 44px;
    display: flex; align-items: center; justify-content: center;
    border: 2px solid rgba(34, 211, 238, 0.4);
    border-radius: 10px;
    margin-bottom: 14px;
    color: #22d3ee;
  }
  .completed .level-number { border-color: rgba(132, 204, 22, 0.5); color: #84cc16; }
  .locked .level-number { border-color: rgba(100, 116, 139, 0.3); color: #475569; }

  .num {
    font-family: 'Orbitron', sans-serif;
    font-size: 1.1rem;
    font-weight: 700;
  }

  .level-title {
    font-family: 'Orbitron', sans-serif;
    font-size: 0.85rem;
    font-weight: 600;
    color: #e2e8f0;
    margin-bottom: 6px;
    letter-spacing: 0.03em;
  }
  .completed .level-title { color: #84cc16; }

  .level-desc {
    font-size: 0.75rem;
    color: #94a3b8;
    line-height: 1.4;
    margin: 0;
  }
</style>
