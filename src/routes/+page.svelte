<script lang="ts">
  import LevelCard from '$lib/components/LevelCard.svelte';
  import { levels } from '$lib/stores/levels';
  import { progressStore } from '$lib/stores/gameStore';
  import { goto } from '$app/navigation';

  let progress = $state($progressStore);

  progressStore.subscribe(v => { progress = v; });

  function openLevel(index: number) {
    progressStore.setCurrentLevel(index);
    goto(`/play?level=${index}`);
  }

  function isCompleted(levelId: number): boolean {
    return progress.completedLevels.includes(levelId);
  }

  function isUnlocked(levelId: number): boolean {
    if (levelId === 1) return true;
    return progress.completedLevels.includes(levelId - 1);
  }
</script>

<svelte:head>
  <title>Cangaroo Web — Alege un nivel</title>
</svelte:head>

<main class="home-page">
  <header class="hero">
    <div class="logo-wrapper">
      <h1 class="logo glow-cyan">CANGAROO</h1>
      <p class="subtitle">Platforma interactivă de algoritmizare</p>
    </div>
    <div class="hero-decoration">
      <div class="hex hex-1"></div>
      <div class="hex hex-2"></div>
      <div class="hex hex-3"></div>
    </div>
  </header>

  <section class="levels-section">
    <h2 class="section-title">
      <span class="accent">▸</span> Alege nivelul
    </h2>
    <div class="levels-grid">
      {#each levels as level, i}
        <LevelCard
          {level}
          completed={isCompleted(level.id)}
          unlocked={isUnlocked(level.id)}
          onclick={() => openLevel(i)}
        />
      {/each}
    </div>
  </section>

  <footer class="footer">
    <p>Liceul Teoretic «Ioan Vodă» · Informatica · Clasa a 7-a</p>
  </footer>
</main>

<style>
  .home-page {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    padding: 0 24px;
    max-width: 900px;
    margin: 0 auto;
  }

  .hero {
    position: relative;
    text-align: center;
    padding: 60px 0 40px;
  }

  .logo-wrapper { position: relative; z-index: 1; }

  .logo {
    font-family: 'Orbitron', sans-serif;
    font-size: clamp(2.5rem, 8vw, 4.5rem);
    font-weight: 900;
    color: #22d3ee;
    letter-spacing: 0.15em;
    margin: 0;
    animation: float 4s ease-in-out infinite;
  }

  .subtitle {
    font-family: 'Inter', sans-serif;
    font-size: 0.9rem;
    color: #64748b;
    margin-top: 8px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .hero-decoration {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    pointer-events: none;
    overflow: hidden;
  }

  .hex {
    position: absolute;
    width: 100px; height: 100px;
    border: 1px solid rgba(34, 211, 238, 0.08);
    border-radius: 12px;
    transform: rotate(45deg);
    animation: pulse-glow 3s ease-in-out infinite;
  }
  .hex-1 { top: 10%; left: 5%; animation-delay: 0s; }
  .hex-2 { top: 20%; right: 8%; width: 60px; height: 60px; border-color: rgba(217, 70, 239, 0.08); animation-delay: 1s; }
  .hex-3 { bottom: 10%; left: 15%; width: 80px; height: 80px; animation-delay: 2s; }

  .levels-section {
    flex: 1;
    padding-bottom: 40px;
  }

  .section-title {
    font-family: 'Orbitron', sans-serif;
    font-size: 0.85rem;
    font-weight: 600;
    color: #94a3b8;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    margin-bottom: 20px;
  }
  .accent { color: #22d3ee; }

  .levels-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 16px;
  }

  .footer {
    text-align: center;
    padding: 30px 0;
    border-top: 1px solid rgba(34, 211, 238, 0.08);
  }
  .footer p {
    font-size: 0.7rem;
    color: #475569;
    letter-spacing: 0.06em;
  }
</style>
