// Game state store with localStorage persistence
import { writable, get } from 'svelte/store';

const STORAGE_KEY = 'cangaroo_progress';

export interface GameProgress {
  currentLevelIndex: number;
  completedLevels: number[];
  userSettings: {
    speed: number;
  };
}

const defaultProgress: GameProgress = {
  currentLevelIndex: 0,
  completedLevels: [],
  userSettings: {
    speed: 1
  }
};

function loadProgress(): GameProgress {
  if (typeof window === 'undefined') return { ...defaultProgress };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...defaultProgress, ...parsed };
    }
  } catch {
    // corrupted data, reset
  }
  return { ...defaultProgress };
}

function createProgressStore() {
  const store = writable<GameProgress>(loadProgress());

  // Auto-save to localStorage on every change
  store.subscribe(value => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    }
  });

  return {
    subscribe: store.subscribe,
    set: store.set,
    update: store.update,

    completeLevel(levelId: number) {
      store.update(p => {
        if (!p.completedLevels.includes(levelId)) {
          p.completedLevels = [...p.completedLevels, levelId];
        }
        return p;
      });
    },

    setCurrentLevel(index: number) {
      store.update(p => ({ ...p, currentLevelIndex: index }));
    },

    setSpeed(speed: number) {
      store.update(p => ({
        ...p,
        userSettings: { ...p.userSettings, speed }
      }));
    },

    resetProgress() {
      store.set({ ...defaultProgress });
    },

    isLevelUnlocked(levelId: number): boolean {
      const p = get(store);
      // Level 1 is always unlocked, others need previous level completed
      if (levelId === 1) return true;
      return p.completedLevels.includes(levelId - 1);
    }
  };
}

export const progressStore = createProgressStore();
