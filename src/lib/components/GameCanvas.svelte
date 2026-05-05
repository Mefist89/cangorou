<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { eventBus } from '$lib/game/EventBus';
  import type { LevelDefinition } from '$lib/stores/levels';

  let { level, speed = 1 }: { level: LevelDefinition; speed?: number } = $props();

  let container: HTMLDivElement;
  let game: any = null;
  let isSceneReady = false;

  onMount(async () => {
    const Phaser = (await import('phaser')).default;
    const { GridScene } = await import('$lib/game/GridScene');

    game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: container,
      width: Math.max(level.gridWidth * 52 + 80, 480),
      height: Math.max(level.gridHeight * 52 + 80, 400),
      transparent: true,
      scene: [GridScene],
      physics: {
        default: 'arcade',
        arcade: { gravity: { x: 0, y: 0 }, debug: false }
      },
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
      },
      render: {
        pixelArt: false,
        antialias: true
      }
    });

    // Wait for scene to be ready, then load level
    eventBus.on('scene-ready', () => {
      isSceneReady = true;
      eventBus.emit('load-level', level);
      eventBus.emit('speed-change', speed);
    });
  });

  onDestroy(() => {
    if (game) {
      game.destroy(true);
      game = null;
    }
    const phaserEvents = ['execute-code', 'load-code', 'resume', 'step', 'stop', 'reset', 'speed-change', 'load-level'];
    phaserEvents.forEach(e => eventBus.deleteEvent(e));
  });

  // React to speed changes
  $effect(() => {
    eventBus.emit('speed-change', speed);
  });


</script>

<div class="game-canvas-wrapper" id="game-canvas">
  <div bind:this={container} class="game-container"></div>
</div>

<style>
  .game-canvas-wrapper {
    position: relative;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid rgba(34, 211, 238, 0.2);
    background: linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(30, 41, 59, 0.9));
    box-shadow:
      0 0 20px rgba(34, 211, 238, 0.1),
      inset 0 0 40px rgba(0, 0, 0, 0.3);
  }

  .game-container {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .game-container :global(canvas) {
    border-radius: 8px;
    max-width: 100%;
    height: auto !important;
  }
</style>
