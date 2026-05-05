<script lang="ts">
  import './layout.css';

  let { children } = $props();
</script>

<svelte:head>
  <title>Cangaroo Web — Învață algoritmizarea</title>
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🦘</text></svg>" />
</svelte:head>

<div class="app-shell cyber-grid-bg scanlines">
  {@render children()}
</div>

<style>
  .app-shell {
    min-height: 100vh;
    position: relative;
  }
</style>
